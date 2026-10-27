import { expect, it } from 'vitest';
import { consumeStream, isMessage, nearBottom, parseStreamPart, type StreamPart } from './chat-protocol';

const encode = (value: string) => new TextEncoder().encode(value);
function chunks(values: Uint8Array[]) { return new ReadableStream<Uint8Array>({ start(controller) { for (const value of values) controller.enqueue(value); controller.close(); } }); }
it('parses SSE across single-byte boundaries, split UTF-8 and CRLF', async () => {
  const parts: StreamPart[] = [];
  const bytes = encode('data: {"type":"start"}\r\n\r\ndata: {"type":"text-delta","delta":"Clarity ✳"}\r\n\r\ndata: {"type":"finish"}\r\n\r\n');
  await consumeStream(chunks([...bytes].map(byte => new Uint8Array([byte]))), part => parts.push(part));
  expect(parts).toEqual([{ type: 'start' }, { type: 'text-delta', delta: 'Clarity ✳' }, { type: 'finish' }]);
});
it('reports a truncated stream instead of pretending success', async () => {
  await expect(consumeStream(chunks([encode('data: {"type":"text-delta","delta":"Partial"}\n\n')]), () => undefined)).rejects.toThrow('before the response finished');
});
it('validates event types and message storage shapes', () => {
  expect(() => parseStreamPart('{"type":"execute"}')).toThrow();
  expect(isMessage({ id: '1', role: 'system', parts: [{ type: 'text', text: 'bad' }] })).toBe(false);
  expect(isMessage({ id: '1', role: 'assistant', parts: [{ type: 'html', text: '<script>' }] })).toBe(false);
  expect(isMessage({ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Partial' }], state: 'stopped' })).toBe(true);
});
it('cancels a blocked stream read when stopped', async () => {
  const abort = new AbortController(); let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const consumption = consumeStream(stream, () => undefined, abort.signal);
  abort.abort(); await expect(consumption).rejects.toMatchObject({ name: 'AbortError' }); expect(cancelled).toBe(true);
});
it('marks scroll-up as unpinned and tolerates the bottom threshold', () => {
  expect(nearBottom(0, 300, 1000)).toBe(false);
  expect(nearBottom(650, 300, 1000)).toBe(true);
  expect(nearBottom(700, 300, 1000)).toBe(true);
});
