import { smoothStream, streamText } from 'ai';
import { AI_CONFIG, AUDIT_SYSTEM_PROMPT, auditModel, modelConfigured } from '@/lib/ai-config';
import { isMessage, messageText, type StreamPart } from '@/lib/chat-protocol';
import { providerErrorMessage } from '@/lib/provider-error';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Expected JSON.' }, { status: 415 });
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing request body');
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 32_000) { await reader.cancel(); return Response.json({ error: 'Conversation is too large. Start a new one.' }, { status: 413 }); }
      chunks.push(value);
    }
    const joined = new Uint8Array(bytes); let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(joined));
  } catch { return Response.json({ error: 'Invalid conversation payload.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !('messages' in body) || !Array.isArray(body.messages)) return Response.json({ error: 'Messages are required.' }, { status: 400 });
  const messages = body.messages;
  if (!messages.length || messages.length > AI_CONFIG.maxMessages || !messages.every(isMessage) || messages.at(-1)?.role !== 'user' || messages.reduce((sum, message) => sum + messageText(message).length, 0) > AI_CONFIG.maxInputChars || messages.some(message => !messageText(message).trim())) {
    return Response.json({ error: 'Use up to 20 nonempty messages and 12,000 characters. Start a new conversation if needed.' }, { status: 400 });
  }
  if (!modelConfigured()) return Response.json({ error: 'The AI service is not configured yet. Please try again after the workspace owner connects it.' }, { status: 503 });
  const abort = new AbortController();
  const stop = () => abort.abort();
  request.signal.addEventListener('abort', stop, { once: true });
  const timeout = setTimeout(stop, AI_CONFIG.timeoutMs);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (part: StreamPart) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(part)}\n\n`));
      try {
        if (request.signal.aborted) abort.abort();
        send({ type: 'start' });
        const result = streamText({ model: auditModel(), system: AUDIT_SYSTEM_PROMPT, messages: messages.map(message => ({ role: message.role, content: messageText(message) })), maxOutputTokens: AI_CONFIG.maxOutputTokens, maxRetries: 0, abortSignal: abort.signal, experimental_transform: smoothStream({ delayInMs: AI_CONFIG.streamDelayMs, chunking: 'word' }), providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } }, onError: () => { /* Return a safe UI error below, never raw provider metadata. */ } });
        let receivedText = false;
        for await (const part of result.fullStream) {
          if (abort.signal.aborted) break;
          if (part.type === 'error') throw part.error;
          if (part.type === 'text-delta' && part.text) { receivedText = true; send({ type: 'text-delta', delta: part.text }); }
        }
        if (abort.signal.aborted) throw new Error('Generation stopped');
        if (!receivedText) throw new Error('Provider returned no text');
        send({ type: 'finish' });
      } catch (cause) {
        if (!request.signal.aborted) {
          try { send({ type: 'error', message: abort.signal.aborted ? 'The response timed out. Your partial response is preserved; try a shorter follow-up.' : providerErrorMessage(cause) }); } catch { /* Client disconnected. */ }
        }
      } finally {
        clearTimeout(timeout); request.signal.removeEventListener('abort', stop);
        try { controller.close(); } catch { /* Client already cancelled. */ }
      }
    },
    cancel() { abort.abort(); clearTimeout(timeout); request.signal.removeEventListener('abort', stop); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' } });
}
