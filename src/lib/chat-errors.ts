export class ChatRequestError extends Error {
  constructor(message: string, public retryAfterSeconds = 0) { super(message); this.name = 'ChatRequestError'; }
}
export function safeChatError(cause: unknown): Error {
  if (cause instanceof TypeError) return new Error('The connection was lost. Check your internet connection, then retry this message.');
  if (cause instanceof Error && cause.message.length <= 350) return cause;
  return new Error('The response could not be read safely. Retry this message to request a fresh response.');
}
export function retryDelay(value: string | null): number {
  if (!value) return 0;
  const seconds = Number(value);
  return Math.min(120, Math.max(0, Number.isFinite(seconds) ? Math.ceil(seconds) : Math.ceil((Date.parse(value) - Date.now()) / 1000) || 0));
}
