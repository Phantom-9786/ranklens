import { auditToolPartSchema, type AuditToolPart } from './audit-tool-contract';
export type ChatRole = 'user' | 'assistant';
export type TextPart = { type: 'text'; text: string };
export type ChatMessage = { id: string; role: ChatRole; parts: (TextPart | AuditToolPart)[]; state?: 'complete' | 'stopped' | 'error' };
export type StreamPart = { type: 'start' } | { type: 'text-delta'; delta: string } | { type: 'tool-update'; part: AuditToolPart } | { type: 'finish' } | { type: 'error'; message: string };
export const CHAT_STORAGE_KEY = 'ranklens.audit-conversation.v1';
export const messageText = (message: ChatMessage): string => message.parts.filter(part => part.type === 'text').map(part => part.text).join('');
/** Tool data is untrusted context, never promoted to system instructions. */
export const messageContext = (message: ChatMessage): string => message.parts.map(part => part.type === 'text' ? part.text : part.state === 'output-available' ? `Stored sample report lookup result: ${JSON.stringify(part.output)}` : part.state === 'output-error' ? 'Report lookup failed. No report data returned.' : '').join('\n');

export function applyStreamPart(message: ChatMessage, event: StreamPart): ChatMessage {
  if (event.type === 'tool-update') {
    const index = message.parts.findIndex(part => part.type !== 'text' && part.toolCallId === event.part.toolCallId);
    const parts = [...message.parts];
    if (index < 0) parts.push(event.part); else parts[index] = event.part;
    return { ...message, parts };
  }
  if (event.type === 'text-delta') {
    const parts = [...message.parts]; const last = parts.at(-1);
    if (last?.type === 'text') parts[parts.length - 1] = { type: 'text', text: last.text + event.delta };
    else parts.push({ type: 'text', text: event.delta });
    return { ...message, parts };
  }
  return message;
}

export function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatMessage>;
  return typeof candidate.id === 'string' && candidate.id.length > 0 && (candidate.role === 'user' || candidate.role === 'assistant') && Array.isArray(candidate.parts) && candidate.parts.length <= 40 && candidate.parts.every(part => part && (part.type === 'text' ? typeof part.text === 'string' : candidate.role === 'assistant' && auditToolPartSchema.safeParse(part).success)) && messageContext(candidate as ChatMessage).length <= 8000 && (candidate.state === undefined || ['complete', 'stopped', 'error'].includes(candidate.state));
}

export function parseStreamPart(raw: string): StreamPart {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('type' in value)) throw new Error('Invalid stream event.');
  if (value.type === 'start' || value.type === 'finish') return { type: value.type };
  if (value.type === 'text-delta' && 'delta' in value && typeof value.delta === 'string') return { type: 'text-delta', delta: value.delta };
  if (value.type === 'error' && 'message' in value && typeof value.message === 'string') return { type: 'error', message: value.message };
  if (value.type === 'tool-update' && 'part' in value) return { type: 'tool-update', part: auditToolPartSchema.parse(value.part) };
  throw new Error('Unexpected stream event.');
}

/** Decode SSE across arbitrary network chunk boundaries, including split UTF-8. */
export async function consumeStream(stream: ReadableStream<Uint8Array>, onPart: (part: StreamPart) => void, signal?: AbortSignal): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  let error = false;
  function drain() {
    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
      const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
      if (!data) continue;
      const part = parseStreamPart(data);
      if (part.type === 'finish') finished = true;
      if (part.type === 'error') error = true;
      onPart(part);
    }
  }
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    while (!signal?.aborted) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      drain();
      if (buffer.length > 100_000) throw new Error('Stream event exceeded the size limit.');
      if (done) break;
    }
    if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
    if (!finished && !error) throw new Error('The connection ended before the response finished. Please try again.');
  } finally {
    signal?.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export function nearBottom(scrollTop: number, clientHeight: number, scrollHeight: number): boolean {
  return scrollHeight - scrollTop - clientHeight < 72;
}
