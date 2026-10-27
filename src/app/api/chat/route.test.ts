import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ configured: true, streamText: vi.fn() }));
vi.mock('ai', async importOriginal => ({ ...await importOriginal<typeof import('ai')>(), streamText: mocks.streamText, smoothStream: () => undefined }));
vi.mock('@/lib/ai-config', () => ({ AI_CONFIG: { maxMessages: 20, maxInputChars: 12_000, timeoutMs: 45_000, maxOutputTokens: 1600 }, AUDIT_SYSTEM_PROMPT: 'Test instructions', auditModel: () => 'test-model', modelConfigured: () => mocks.configured }));
import { POST } from './route';
import { consumeStream, type StreamPart } from '@/lib/chat-protocol';
import { executeAuditLookup } from '@/lib/audit-tools';
const question = { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Explain the findings.' }] };
const req = (body: unknown, origin?: string) => new Request('http://localhost/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
beforeEach(() => { mocks.configured = true; mocks.streamText.mockReset(); });
it('rejects invalid requests before contacting a provider', async () => {
  expect((await POST(req({ messages: [question] }, 'https://other.example'))).status).toBe(403);
  expect((await POST(new Request('http://localhost/api/chat', { method: 'POST', body: 'invalid' }))).status).toBe(415);
  expect((await POST(req({ messages: [] }))).status).toBe(400);
  expect((await POST(req({ messages: [{ ...question, role: 'system' }] }))).status).toBe(400);
  expect((await POST(req({ messages: [{ ...question, parts: [{ type: 'text', text: 'x'.repeat(40_000) }] }] }))).status).toBe(413);
  expect(mocks.streamText).not.toHaveBeenCalled();
});
it('fails honestly when the provider key is missing', async () => {
  mocks.configured = false; const response = await POST(req({ messages: [question] })); expect(response.status).toBe(503); expect(mocks.streamText).not.toHaveBeenCalled();
});
it('streams SDK deltas and forwards multi-turn context and cancellation signal', async () => {
  mocks.streamText.mockReturnValue({ fullStream: (async function* () { yield { type: 'text-delta', text: 'Fix ' }; yield { type: 'text-delta', text: 'descriptions.' }; yield { type: 'finish' }; })() });
  const prior = { ...question, id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Earlier response.' }] };
  const response = await POST(req({ messages: [question, prior, { ...question, id: 'u2' }] }));
  const parts: StreamPart[] = []; await consumeStream(response.body!, part => parts.push(part));
  expect(parts).toEqual([{ type: 'start' }, { type: 'text-delta', delta: 'Fix ' }, { type: 'text-delta', delta: 'descriptions.' }, { type: 'finish' }]);
  expect(mocks.streamText.mock.calls[0][0].messages).toHaveLength(3);
  expect(mocks.streamText.mock.calls[0][0].abortSignal).toBeInstanceOf(AbortSignal);
});
it('turns SDK stream errors into safe typed errors, never an empty success', async () => {
  mocks.streamText.mockReturnValue({ fullStream: (async function* () { yield { type: 'error', error: new Error('secret provider metadata') }; })() });
  const response = await POST(req({ messages: [question] })); const parts: StreamPart[] = [];
  await consumeStream(response.body!, part => parts.push(part));
  expect(parts.some(part => part.type === 'error')).toBe(true); expect(parts.some(part => part.type === 'finish')).toBe(false); expect(JSON.stringify(parts)).not.toContain('secret');
});

it('streams typed tool phases and handles execution failure without leaking errors or crashing', async () => {
  const input = { auditId: 'studio-north' }; const output = await executeAuditLookup(input);
  mocks.streamText.mockReturnValue({ fullStream: (async function* () {
    yield { type: 'tool-input-start', id: 't1', toolName: 'get_audit_report' };
    yield { type: 'tool-input-delta', id: 't1', delta: '{"auditId":"studio-north"}' };
    yield { type: 'tool-call', toolCallId: 't1', toolName: 'get_audit_report', input };
    yield { type: 'tool-result', toolCallId: 't1', toolName: 'get_audit_report', input, output };
    yield { type: 'tool-error', toolCallId: 't2', toolName: 'get_audit_report', input: { auditId: 'missing-report' }, error: new Error('private metadata') };
  })() });
  const response = await POST(req({ messages: [question] })); const events: StreamPart[] = [];
  await consumeStream(response.body!, event => events.push(event));
  expect(events.filter(event => event.type === 'tool-update').map(event => event.part.state)).toEqual(['input-streaming', 'input-streaming', 'input-available', 'output-available', 'output-error']);
  expect(events.at(-1)).toEqual({ type: 'finish' });
  expect(JSON.stringify(events)).not.toContain('private metadata');
  expect(mocks.streamText.mock.calls[0][0].tools.get_audit_report.execute).toBeTypeOf('function');
});

it('preserves deltas before an API failure and exposes a safe rate-limit wait hint', async () => {
  mocks.streamText.mockReturnValue({ fullStream: (async function* () {
    yield { type: 'text-delta', text: 'Received partial response.' };
    throw { statusCode: 429, responseBody: 'private provider data' };
  })() });
  const response = await POST(req({ messages: [question] })); const events: StreamPart[] = [];
  await consumeStream(response.body!, event => events.push(event));
  expect(events[1]).toEqual({ type: 'text-delta', delta: 'Received partial response.' });
  expect(events.at(-1)).toMatchObject({ type: 'error', retryAfterSeconds: 10 });
  expect(JSON.stringify(events)).not.toContain('private provider data');
  expect(events.some(event => event.type === 'finish')).toBe(false);
});

it('handles a synchronous route provider throw, an empty model response, and a safety refusal', async () => {
  mocks.streamText.mockImplementationOnce(() => { throw new Error('sabotage route throw'); });
  let response = await POST(req({ messages: [question] })); let events: StreamPart[] = [];
  await consumeStream(response.body!, event => events.push(event)); expect(events.at(-1)?.type).toBe('error');
  mocks.streamText.mockReturnValueOnce({ fullStream: (async function* () {})() });
  response = await POST(req({ messages: [question] })); events = [];
  await consumeStream(response.body!, event => events.push(event)); expect(events.at(-1)).toMatchObject({ type: 'error', message: expect.stringContaining('No reply came back') });
  mocks.streamText.mockReturnValueOnce({ fullStream: (async function* () { yield { type: 'finish', finishReason: 'content-filter' }; })() });
  response = await POST(req({ messages: [question] })); events = [];
  await consumeStream(response.body!, event => events.push(event)); expect(events.at(-1)).toMatchObject({ type: 'error', message: expect.stringContaining('rephrasing') });
});

it('renders malformed tool output as a typed recovery error instead of breaking the stream', async () => {
  mocks.streamText.mockReturnValueOnce({ fullStream: (async function* () { yield { type: 'tool-result', toolName: 'get_audit_report', toolCallId: 'bad', input: { auditId: 'studio-north' }, output: { score: 'invalid' } }; })() });
  const response = await POST(req({ messages: [question] })); const events: StreamPart[] = [];
  await consumeStream(response.body!, event => events.push(event));
  expect(events[1]).toMatchObject({ type: 'tool-update', part: { state: 'output-error', errorText: expect.stringContaining('incomplete data') } });
  expect(events.at(-1)).toEqual({ type: 'finish' });
});
