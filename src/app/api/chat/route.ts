import { smoothStream, streamText, stepCountIs } from 'ai';
import { auditTools } from '@/lib/audit-tools';
import { auditInputSchema, auditOutputSchema } from '@/lib/audit-tool-contract';
import { AI_CONFIG, AUDIT_SYSTEM_PROMPT, auditModel, modelConfigured } from '@/lib/ai-config';
import { isMessage, messageContext, type StreamPart } from '@/lib/chat-protocol';
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
  if (!messages.length || messages.length > AI_CONFIG.maxMessages || !messages.every(isMessage) || messages.at(-1)?.role !== 'user' || messages.reduce((sum, message) => sum + messageContext(message).length, 0) > AI_CONFIG.maxInputChars || messages.some(message => !messageContext(message).trim())) {
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
        const result = streamText({ model: auditModel(), system: AUDIT_SYSTEM_PROMPT, messages: messages.map(message => ({ role: message.role, content: messageContext(message) })), tools: auditTools, stopWhen: stepCountIs(3), maxOutputTokens: AI_CONFIG.maxOutputTokens, maxRetries: 0, abortSignal: abort.signal, experimental_transform: smoothStream({ delayInMs: AI_CONFIG.streamDelayMs, chunking: 'word' }), providerOptions: { google: { thinkingConfig: { thinkingLevel: AI_CONFIG.thinkingLevel } } }, onError: () => { /* Return a safe UI error below, never raw provider metadata. */ } });
        let receivedText = false;
        const inputText = new Map<string, string>();
        for await (const part of result.fullStream) {
          if (abort.signal.aborted) break;
          if (part.type === 'error') throw part.error;
          if (part.type === 'text-delta' && part.text) { receivedText = true; send({ type: 'text-delta', delta: part.text }); }
          if (part.type === 'tool-input-start' && part.toolName === 'get_audit_report') {
            inputText.set(part.id, '');
            send({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: part.id, state: 'input-streaming', inputText: '' } });
          }
          if (part.type === 'tool-input-delta' && inputText.has(part.id)) {
            const text = (inputText.get(part.id) || '') + part.delta;
            inputText.set(part.id, text);
            send({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: part.id, state: 'input-streaming', inputText: text.slice(0, 4000) } });
          }
          if (part.type === 'tool-call' && part.toolName === 'get_audit_report' && !part.invalid) {
            send({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: part.toolCallId, state: 'input-available', input: auditInputSchema.parse(part.input) } });
          }
          if (part.type === 'tool-result' && part.toolName === 'get_audit_report') {
            receivedText = true;
            send({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: part.toolCallId, state: 'output-available', input: auditInputSchema.parse(part.input), output: auditOutputSchema.parse(part.output) } });
          }
          if (part.type === 'tool-error' && part.toolName === 'get_audit_report') {
            receivedText = true;
            const input = auditInputSchema.safeParse(part.input);
            send({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: part.toolCallId, state: 'output-error', input: input.success ? input.data : undefined, errorText: input.success ? 'That sample report could not be found. Choose studio-north, field-notes, or evergreen and try again.' : 'The report ID was invalid. Use a short ID containing lowercase letters and hyphens.' } });
          }
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
