'use client';
import { useEffect, useRef, useState, type FormEvent, type UIEvent } from 'react';
import { CHAT_STORAGE_KEY, consumeStream, isMessage, messageContext, applyStreamPart, nearBottom, type ChatMessage } from '@/lib/chat-protocol';
import AuditToolCard from './audit-tool-card';
import { ChatRequestError, safeChatError, retryDelay } from '@/lib/chat-errors';

type Generation = 'idle' | 'thinking' | 'streaming';
const starters = ['Show the studio-north report.', 'Show the field-notes report.', 'Which finding should I fix first?'];
type ChatFailure = { error: Error; assistantId: string; question: string; retryAt: number };

export default function AuditChat({ configured }: { configured: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [generation, setGeneration] = useState<Generation>('idle');
  const [error, setError] = useState('');
  const [failure, setFailure] = useState<ChatFailure | null>(null);
  const [slow, setSlow] = useState(false);
  const [now, setNow] = useState(0);
  const [storageWarning, setStorageWarning] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [jumpVisible, setJumpVisible] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const pinRef = useRef(true);
  const mounted = useRef(true);
  const activeId = useRef<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (!Array.isArray(saved) || saved.length > 40 || !saved.every(isMessage) || new Set(saved.map(message => message.id)).size !== saved.length) throw new Error('Invalid history');
        setMessages(saved.map(message => ({ ...message, state: message.state || 'stopped' })));
        const last = saved.at(-1); const question = saved.at(-2);
        if (last?.role === 'assistant' && last.state === 'error' && question?.role === 'user') setFailure({ error: new Error(last.failureMessage || 'The previous response did not finish. Retry this message.'), assistantId: last.id, question: messageContext(question), retryAt: 0 });
      }
    } catch { setStorageWarning('Saved conversation could not be restored. Your stored data has not been overwritten.'); }
    setLoaded(true);
    return () => { mounted.current = false; controllerRef.current?.abort(); };
  }, []);

  useEffect(() => {
    setSlow(false);
    if (generation === 'idle') return;
    const timer = setTimeout(() => { setSlow(true); setAnnouncement('This response is taking longer than usual. You can wait or stop.'); }, 8000);
    return () => clearTimeout(timer);
  }, [generation]);
  useEffect(() => {
    if (!failure?.retryAt) return;
    setNow(Date.now());
    const timer = setInterval(() => { setNow(Date.now()); if (Date.now() >= failure.retryAt) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [failure]);

  // Persist partial text too, so refreshing during generation keeps received content.
  useEffect(() => {
    if (!loaded || !messages.length) return;
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40))); }
    catch { setStorageWarning('Browser storage is unavailable. This conversation is kept for this session only.'); }
  }, [messages, loaded]);

  useEffect(() => {
    const pane = scrollRef.current;
    if (pane && pinRef.current) { pane.scrollTop = pane.scrollHeight; setJumpVisible(false); }
    else if (pane) setJumpVisible(!nearBottom(pane.scrollTop, pane.clientHeight, pane.scrollHeight));
  }, [messages, generation]);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const pane = event.currentTarget;
    pinRef.current = nearBottom(pane.scrollTop, pane.clientHeight, pane.scrollHeight);
    setJumpVisible(!pinRef.current);
  }
  function unpin() { pinRef.current = false; }
  function mark(id: string, state: ChatMessage['state']) { setMessages(current => current.map(message => message.id === id ? { ...message, state } : message)); }
  function stop() {
    controllerRef.current?.abort();
    if (activeId.current) mark(activeId.current, 'stopped');
    controllerRef.current = null; activeId.current = null; busyRef.current = false;
    setGeneration('idle'); setAnnouncement('Response stopped. Partial text preserved. You can send another message.');
    inputRef.current?.focus();
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current || !draft.trim() || !configured) return;
    const text = draft.trim();
    if (text.length > 2000) { setError('Keep each question within 2,000 characters.'); return; }
    const user: ChatMessage = { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text }], state: 'complete' };
    const history = [...messages.filter(message => messageContext(message).trim() && message.state !== 'error'), user];
    if (history.length > 20 || history.reduce((sum, message) => sum + messageContext(message).length, 0) > 12_000) { setError('This conversation has reached its limit. Start a new conversation to continue.'); return; }
    const id = crypto.randomUUID();
    setMessages(current => [...current, user, { id, role: 'assistant', parts: [] }]);
    setDraft('');
    await generate(history, id, text);
  }
  async function retry() {
    if (!failure || busyRef.current || failure.retryAt > Date.now() || !configured) return;
    const index = messages.findIndex(message => message.id === failure.assistantId);
    if (index < 1 || messages[index - 1].role !== 'user') return;
    const history = messages.slice(0, index).filter(message => messageContext(message).trim() && message.state !== 'error');
    const id = failure.assistantId; const question = failure.question;
    setMessages(current => current.map(message => message.id === id ? { ...message, parts: [], state: undefined, failureMessage: undefined } : message));
    await generate(history, id, question);
  }
  async function generate(history: ChatMessage[], id: string, question: string) {
    if (busyRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller; activeId.current = id; busyRef.current = true;
    pinRef.current = true;
    setError(''); setFailure(null); setGeneration('thinking'); setAnnouncement('Preparing a response.');
    let timedOut = false;
    const watchdog = setTimeout(() => { timedOut = true; controller.abort(); }, 55_000);
    const fail = (cause: unknown) => {
      const problem = safeChatError(cause);
      setMessages(current => current.map(message => message.id === id ? { ...message, state: 'error', failureMessage: problem.message } : message));
      setFailure({ error: problem, assistantId: id, question, retryAt: problem instanceof ChatRequestError && problem.retryAfterSeconds > 0 ? Date.now() + problem.retryAfterSeconds * 1000 : 0 });
      setAnnouncement('Response failed. Your question and any partial reply are preserved. Retry this message when ready.');
    };
    let failed = false;
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }), signal: controller.signal });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message = response.status === 429 ? 'The assistant is receiving too many requests. Wait a moment, then retry this message.' : payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error.slice(0, 350) : 'The response could not start. Please retry this message.';
        throw new ChatRequestError(message, response.status === 429 ? retryDelay(response.headers.get('retry-after')) || 10 : 0);
      }
      if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('The server returned an unexpected response.');
      await consumeStream(response.body, part => {
        if (!mounted.current || controller.signal.aborted) return;
        if (part.type === 'text-delta' || part.type === 'tool-update') {
          // Text and indicator transition in one React batch: no empty frame.
          setMessages(current => current.map(message => message.id === id ? applyStreamPart(message, part) : message));
          setGeneration('streaming');
        } else if (part.type === 'error') { failed = true; fail(new ChatRequestError(part.message, part.retryAfterSeconds)); }
        else if (part.type === 'finish') mark(id, 'complete');
      }, controller.signal);
      if (!failed && !controller.signal.aborted) { mark(id, 'complete'); setAnnouncement('Response complete.'); }
    } catch (cause) {
      if (!mounted.current) return;
      if (controller.signal.aborted && !timedOut) mark(id, 'stopped');
      else fail(timedOut ? new Error('The response took too long. Your partial reply is preserved. Retry this message when ready.') : cause);
    } finally {
      clearTimeout(watchdog);
      // An aborted older request must not reset a newer send's state.
      if (controllerRef.current === controller) {
        busyRef.current = false; activeId.current = null; controllerRef.current = null;
        if (mounted.current) { setGeneration('idle'); inputRef.current?.focus(); }
      }
    }
  }
  function startNew() {
    if (busyRef.current) return;
    setMessages([]); setError(''); setFailure(null); setDraft(''); pinRef.current = true; setJumpVisible(false);
    try { localStorage.removeItem(CHAT_STORAGE_KEY); setStorageWarning(''); } catch { setStorageWarning('Browser storage could not be cleared.'); }
    inputRef.current?.focus();
  }
  const busy = generation !== 'idle';
  const retrySeconds = failure ? Math.max(0, Math.ceil((failure.retryAt - now) / 1000)) : 0;
  return <section className="chat-workspace" aria-labelledby="chat-title">
    <div className="page-heading"><div><p className="eyebrow">A LITTLE CONTEXT. A CLEARER NEXT STEP.</p><h1 id="chat-title">Make sense of what matters.</h1><p className="page-description">Your sample audit findings, explained one conversation at a time.</p></div><button className="chat-new" disabled={busy} onClick={startNew}>New conversation ↗</button></div>
    <div className="chat-layout"><div className="chat-main"><div className="chat-bar"><div><span className="chat-assistant-icon" aria-hidden="true">✳</span><div><strong>RankLens assistant</strong><small>{busy ? 'Working through your question' : 'Here to bring a little clarity'}</small></div></div><span className="pill">AI · Sample reports</span></div>
      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll} onWheel={event => { if (event.deltaY < 0) unpin(); }} onTouchStart={unpin} onKeyDown={event => { if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) unpin(); }} tabIndex={0} aria-label="Conversation messages">
        {!messages.length && <div className="chat-welcome"><span aria-hidden="true">✳</span><h2>From findings to understanding.</h2><p>Ask what to fix first, why a finding matters, or how to make a practical improvement.</p><div>{starters.map(question => <button key={question} disabled={!configured || busy} onClick={() => { setDraft(question); inputRef.current?.focus(); }}>{question}<span aria-hidden="true">↗</span></button>)}</div></div>}
        {messages.map((message, index) => <article key={message.id} className={`chat-message ${message.role}`} aria-label={`${message.role === 'user' ? 'You' : 'Assistant'}, message ${index + 1}`}><span className="message-avatar" aria-hidden="true">{message.role === 'user' ? 'Y' : '✳'}</span><div><div className="message-label">{message.role === 'user' ? 'You' : 'RankLens'}{message.state === 'stopped' && <small>Stopped</small>}{message.state === 'error' && <small>Incomplete</small>}</div>{message.parts.map((part, partIndex) => part.type === 'text' ? <p className="message-text" key={partIndex}>{part.text}</p> : <AuditToolCard key={part.toolCallId} part={part} interrupted={message.state === 'stopped' || message.state === 'error'}/>)}{message.parts.length ? null : busy && index === messages.length - 1 ? <div className="reply-pending"><p className="thinking"><span aria-hidden="true">● ● ●</span>Thinking through your audit…</p><div className="reply-skeleton" aria-hidden="true"><i/><i/><i/></div></div> : <p className="message-empty">{message.state === 'stopped' ? 'Stopped before the first text arrived.' : 'No response text received. Try another question.'}</p>}</div></article>)}
      </div>
      {slow && busy && <p className="chat-slow" role="status">Taking a little longer. Your question is safe—you can wait or use Stop.</p>}{jumpVisible && <button className="jump-latest" onClick={() => { pinRef.current = true; if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; setJumpVisible(false); }}>Jump to latest ↓</button>}
      <div className="chat-composer">{!configured && <p className="chat-error" role="alert">The assistant is waiting for its AI connection. It will be ready after the workspace owner finishes setup.</p>}{error && <p className="chat-error" role="alert">{error}</p>}{failure && <section className="chat-failure" role="alert" aria-labelledby="retry-title"><div><span aria-hidden="true">↻</span><h2 id="retry-title">Let’s give that reply another try.</h2></div><p>{failure.error.message}</p><p className="retry-question">Your question: “{failure.question}”</p><p className="retry-hint">Any partial reply stays above. Retry replaces only this reply; no duplicate question is added.</p><button type="button" className="retry-button" disabled={busy || !configured || retrySeconds > 0} onClick={() => { void retry(); }}>{busy ? 'Retrying…' : retrySeconds > 0 ? `Retry in ${retrySeconds}s` : 'Retry this message ↻'}</button></section>}{storageWarning && <p className="chat-storage" role="status">{storageWarning}</p>}
        <form onSubmit={send}><label className="sr-only" htmlFor="chat-input">Ask about the sample audit</label><textarea ref={inputRef} id="chat-input" rows={2} maxLength={2000} disabled={!configured} placeholder="Ask about your sample audit…" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}/><div className="composer-bottom"><span>Enter to send · Shift + Enter for a new line</span>{busy ? <button type="button" onClick={stop} className="stop-button">■ Stop</button> : <button type="submit" disabled={!configured || !draft.trim()} className="send-button">Send <span aria-hidden="true">↑</span></button>}</div></form><p className="chat-disclaimer">AI can make mistakes. Check suggestions before applying them. This assistant discusses sample data, not a live crawl.</p>
      </div><span className="sr-only" role="status" aria-live="polite">{announcement}</span></div>
      <aside className="chat-context"><p className="eyebrow">YOUR CONVERSATION CONTEXT</p><h2>A grounded starting point.</h2><p>These are illustrative reports. The assistant cannot visit a website or run an audit.</p><div><span>SN</span><strong>Studio North</strong><small>82 / 100 · 12 sample findings</small></div><div><span>FN</span><strong>Field Notes</strong><small>67 / 100 · 23 sample findings</small></div><div><span>EG</span><strong>Evergreen</strong><small>94 / 100 · 4 sample findings</small></div><p className="context-bottom">Take it one question at a time.<br/>Your follow-ups stay in context.</p></aside></div>
  </section>;
}
