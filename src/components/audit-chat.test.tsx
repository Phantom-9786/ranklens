// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import AuditChat from './audit-chat';
import { CHAT_STORAGE_KEY, type StreamPart } from '@/lib/chat-protocol';

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
