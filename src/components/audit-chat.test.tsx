// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import AuditChat from './audit-chat';
import { CHAT_STORAGE_KEY, type StreamPart } from '@/lib/chat-protocol';
import { executeAuditLookup } from '@/lib/audit-tools';

function testStream() {
  let control: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({ start(controller) { control = controller; } });
  return { response: new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }), emit(part: StreamPart) { control.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(part)}\n\n`)); }, close() { control.close(); } };
}
beforeEach(() => { localStorage.clear(); });
async function ask(text: string) { const user = userEvent.setup(); await user.type(screen.getByLabelText('Ask about the sample audit'), text); await user.click(screen.getByRole('button', { name: /Send/ })); }
it('shows thinking until text arrives and renders incomplete markdown as safe text', async () => {
  const stream = testStream(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(stream.response)); render(<AuditChat configured/>); await ask('Explain this.');
  expect(screen.getByText('Thinking through your audit…')).toBeInTheDocument();
  await act(async () => stream.emit({ type: 'text-delta', delta: '**Partial <script>\n```' }));
  expect(screen.queryByText('Thinking through your audit…')).not.toBeInTheDocument(); expect(screen.getByText(/Partial/)).toHaveTextContent('<script>'); expect(document.querySelector('script')).toBeNull();
  await act(async () => { stream.emit({ type: 'finish' }); stream.close(); }); expect(screen.queryByRole('button', { name: /Stop/ })).not.toBeInTheDocument();
});
it('preserves partial text on stop and can immediately send again with history', async () => {
  const first = testStream(); const second = testStream(); const fetchMock = vi.fn().mockResolvedValueOnce(first.response).mockResolvedValueOnce(second.response); vi.stubGlobal('fetch', fetchMock);
  render(<AuditChat configured/>); await ask('First question'); await act(async () => first.emit({ type: 'text-delta', delta: 'Partial reply' }));
  await userEvent.click(screen.getByRole('button', { name: /Stop/ })); expect(screen.getByText('Partial reply')).toBeInTheDocument(); expect(screen.getByText('Stopped')).toBeInTheDocument();
  await ask('Follow-up'); expect(fetchMock).toHaveBeenCalledTimes(2);
  const sent = JSON.parse(fetchMock.mock.calls[1][1].body); expect(sent.messages.map((message: { role: string }) => message.role)).toEqual(['user', 'assistant', 'user']);
  await act(async () => { second.emit({ type: 'text-delta', delta: 'Follow-up reply' }); second.emit({ type: 'finish' }); second.close(); });
  expect(screen.getByText('Follow-up reply')).toBeInTheDocument(); expect(JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)!)).toHaveLength(4);
});
it('reports HTTP errors and re-enables the input/send controls', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Provider unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
  render(<AuditChat configured/>); await ask('A question'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Provider unavailable'));
  expect(screen.getByLabelText('Ask about the sample audit')).toBeEnabled(); expect(screen.queryByRole('button', { name: /Stop/ })).not.toBeInTheDocument();
});
it('does not auto-scroll when the reader has scrolled up and offers jump-to-latest', async () => {
  const stream = testStream(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(stream.response)); render(<AuditChat configured/>);
  const pane = screen.getByLabelText('Conversation messages'); Object.defineProperties(pane, { scrollHeight: { value: 1000, configurable: true }, clientHeight: { value: 300, configurable: true } });
  await ask('Explain'); pane.scrollTop = 150; fireEvent.scroll(pane);
  await act(async () => stream.emit({ type: 'text-delta', delta: 'New text' })); expect(pane.scrollTop).toBe(150);
  await userEvent.click(screen.getByRole('button', { name: /Jump to latest/ })); expect(pane.scrollTop).toBe(1000);
  await act(async () => { stream.emit({ type: 'finish' }); stream.close(); });
});
it('restores persisted text and does not pretend interrupted generation is running', () => {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([{ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Saved partial' }] }])); render(<AuditChat configured/>);
  expect(screen.getByText('Saved partial')).toBeInTheDocument(); expect(screen.getByText('Stopped')).toBeInTheDocument();
});
it('explains missing configuration and disables submission', () => {
  render(<AuditChat configured={false}/>); expect(screen.getByRole('alert')).toHaveTextContent('waiting for its AI connection'); expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
});

it('keeps a structured tool result while streaming its explanation and forwards it in follow-up context', async () => {
  const first = testStream(); const second = testStream();
  const fetchMock = vi.fn().mockResolvedValueOnce(first.response).mockResolvedValueOnce(second.response); vi.stubGlobal('fetch', fetchMock);
  render(<AuditChat configured/>); await ask('Show the studio-north report.');
  const input = { auditId: 'studio-north' }; const output = await executeAuditLookup(input);
  await act(async () => {
    first.emit({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: 't', state: 'output-available', input, output } });
    first.emit({ type: 'text-delta', delta: 'Fix descriptions first.' });
    first.emit({ type: 'finish' }); first.close();
  });
  expect(screen.getByText('82')).toBeInTheDocument(); expect(screen.getByText('Fix descriptions first.')).toBeInTheDocument();
  await ask('Why that score?');
  const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(sent.messages[1].parts[0].output.score).toBe(82);
  await act(async () => { second.emit({ type: 'finish' }); second.close(); });
});

it('preserves a reply cut mid-stream and retries only the failed message once even on double click', async () => {
  const broken = testStream(); const recovered = testStream();
  const fetchMock = vi.fn().mockResolvedValueOnce(broken.response).mockResolvedValueOnce(recovered.response); vi.stubGlobal('fetch', fetchMock);
  render(<AuditChat configured/>); await ask('Explain the sample audit.');
  await act(async () => { broken.emit({ type: 'text-delta', delta: 'Partial advice' }); broken.close(); });
  expect(screen.getByText('Partial advice')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('before the response finished');
  const retry = screen.getByRole('button', { name: /Retry this message/ });
  fireEvent.click(retry); fireEvent.click(retry);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(sent.messages).toHaveLength(1); expect(sent.messages[0].parts[0].text).toBe('Explain the sample audit.');
  await act(async () => { recovered.emit({ type: 'text-delta', delta: 'Complete fresh advice' }); recovered.emit({ type: 'finish' }); recovered.close(); });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText('Complete fresh advice')).toBeInTheDocument();
  expect(screen.queryByText('Partial advice')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)!)).toHaveLength(2);
});

it('handles network failure before send, persists the retry target, and does not send blank input', async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')); vi.stubGlobal('fetch', fetchMock);
  const { unmount } = render(<AuditChat configured/>);
  expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Ask about the sample audit'), { target: { value: '   ' } });
  fireEvent.submit(screen.getByLabelText('Ask about the sample audit').closest('form')!); expect(fetchMock).not.toHaveBeenCalled();
  await ask('Why alt text?'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Check your internet connection'));
  unmount(); render(<AuditChat configured/>);
  expect(screen.getByRole('button', { name: /Retry this message/ })).toBeEnabled();
  expect(screen.getByRole('alert')).toHaveTextContent('Why alt text?');
  const success = testStream(); fetchMock.mockResolvedValueOnce(success.response);
  await userEvent.click(screen.getByRole('button', { name: /Retry this message/ }));
  await act(async () => { success.emit({ type: 'text-delta', delta: 'Restored retry works.' }); success.emit({ type: 'finish' }); success.close(); });
  expect(screen.getByText('Restored retry works.')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('turns malformed tool data into a readable retry error without dumping schema internals', async () => {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"type":"tool-update","part":{"type":"tool-get_audit_report","state":"output-available","output":{"score":"invalid"}}}\n\n')); controller.close(); } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })));
  render(<AuditChat configured/>); await ask('Show the report');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('report data was incomplete or invalid'));
  expect(screen.getByRole('alert')).not.toHaveTextContent('Zod'); expect(screen.getByRole('button', { name: /Retry this message/ })).toBeEnabled();
});

it('offers useful examples on first run and fills the question without making a provider call', async () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); render(<AuditChat configured/>);
  await userEvent.click(screen.getByRole('button', { name: /Show the studio-north report/ }));
  expect(screen.getByLabelText('Ask about the sample audit')).toHaveValue('Show the studio-north report.');
  expect(fetchMock).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: /Send/ })).toBeEnabled();
});

it('shows slow-response guidance and a bounded timeout with retry', async () => {
  vi.useFakeTimers();
  try {
    vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => { init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))); })));
    render(<AuditChat configured/>);
    fireEvent.change(screen.getByLabelText('Ask about the sample audit'), { target: { value: 'Explain this' } });
    fireEvent.submit(screen.getByLabelText('Ask about the sample audit').closest('form')!);
    await act(async () => vi.advanceTimersByTimeAsync(8000));
    expect(screen.getByText(/Taking a little longer/)).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(47000));
    expect(screen.getByRole('alert')).toHaveTextContent('took too long');
    expect(screen.getByRole('button', { name: /Retry this message/ })).toBeEnabled();
  } finally { vi.useRealTimers(); }
});

it('honors rate-limit retry timing without issuing automatic requests', async () => {
  vi.useFakeTimers();
  try {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '2' } })); vi.stubGlobal('fetch', fetchMock);
    render(<AuditChat configured/>);
    fireEvent.change(screen.getByLabelText('Ask about the sample audit'), { target: { value: 'Explain this' } });
    await act(async () => fireEvent.submit(screen.getByLabelText('Ask about the sample audit').closest('form')!));
    expect(screen.getByRole('button', { name: /Retry in 2s/ })).toBeDisabled();
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByRole('button', { name: /Retry this message/ })).toBeEnabled(); expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); }
});
