'use client';
import { useChat } from '@ai-sdk/react';
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import { useMemo, useRef } from 'react';
import { consumeStream, messageText, type ChatMessage, type StreamPart } from './chat-protocol';
import { ChatRequestError, retryDelay, safeChatError } from './chat-errors';

type RequestContext = { history: ChatMessage[]; signal: AbortSignal; onPart: (part: StreamPart) => void };
class TransportError extends ChatRequestError {
  constructor(public token: string, cause: unknown) {
    const error = safeChatError(cause);
    super(error.message, error instanceof ChatRequestError ? error.retryAfterSeconds : 0);
  }
}

/** Adapt the existing validated SSE protocol to useChat without changing stored tool parts. */
export function useAuditTransport() {
  const requests = useRef(new Map<string, RequestContext>());
  const failures = useRef(new Map<string, Error>());
  const transport = useMemo<ChatTransport<UIMessage>>(() => ({
    async reconnectToStream() { return null; },
    async sendMessages(options) {
      const token = options.body && 'token' in options.body && typeof options.body.token === 'string' ? options.body.token : '';
      const context = requests.current.get(token);
      if (!context) throw new TransportError(token, new Error('This request expired. Retry this message.'));
      const abort = new AbortController();
      const stop = () => abort.abort();
      const signals = [context.signal, options.abortSignal].filter((signal): signal is AbortSignal => Boolean(signal));
      for (const signal of signals) { if (signal.aborted) stop(); signal.addEventListener('abort', stop, { once: true }); }
      const cleanup = () => { for (const signal of signals) signal.removeEventListener('abort', stop); };
      try {
        const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: context.history }), signal: abort.signal });
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const message = response.status === 429 ? 'The assistant is receiving too many requests. Wait a moment, then retry this message.' : payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error.slice(0, 350) : 'The response could not start. Please retry this message.';
          throw new ChatRequestError(message, response.status === 429 ? retryDelay(response.headers.get('retry-after')) || 10 : 0);
        }
        if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('The server returned an unexpected response. Retry this message.');
        const body = response.body;
        return new ReadableStream<UIMessageChunk>({
          async start(controller) {
            let textStarted = false;
            try {
              controller.enqueue({ type: 'start', messageId: token });
              await consumeStream(body, part => {
                if (abort.signal.aborted) return;
                if (part.type === 'error') throw new ChatRequestError(part.message, part.retryAfterSeconds);
                context.onPart(part);
                if (part.type === 'text-delta') {
                  if (!textStarted) { controller.enqueue({ type: 'text-start', id: token }); textStarted = true; }
                  controller.enqueue({ type: 'text-delta', id: token, delta: part.delta });
                }
              }, abort.signal);
              if (textStarted) controller.enqueue({ type: 'text-end', id: token });
              controller.enqueue({ type: 'finish' }); controller.close();
            } catch (cause) { controller.error(abort.signal.aborted ? new DOMException('Aborted', 'AbortError') : new TransportError(token, cause)); }
            finally { cleanup(); }
          },
          cancel() { stop(); cleanup(); },
        });
      } catch (cause) { cleanup(); throw abort.signal.aborted ? new DOMException('Aborted', 'AbortError') : new TransportError(token, cause); }
    },
  }), []);
  const chat = useChat({ transport, onError(error) { if (error instanceof TransportError) failures.current.set(error.token, error); } });
  async function request(history: ChatMessage[], signal: AbortSignal, onPart: RequestContext['onPart'], retry: boolean) {
    const token = crypto.randomUUID();
    requests.current.set(token, { history, signal, onPart });
    try {
      if (retry) {
        // A restored conversation has no internal SDK messages yet. Seed the failed user turn.
        if (!chat.messages.length) chat.setMessages([{ id: `${token}-user`, role: 'user', parts: [{ type: 'text', text: messageText(history.at(-1)!) }] }]);
        await chat.regenerate({ body: { token } });
      } else await chat.sendMessage({ text: messageText(history.at(-1)!) }, { body: { token } });
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const error = failures.current.get(token);
      if (error) throw error;
    } finally { requests.current.delete(token); failures.current.delete(token); }
  }
  return { request, error: chat.error, clear() { chat.setMessages([]); chat.clearError(); } };
}
