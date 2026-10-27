import { useRef, useState, type FormEvent } from 'react';
import './App.css';

export const STORAGE_KEY = 'ranklens.audit-settings.v1';
type Settings = { websiteUrl: string; maxPages: number; includeSubdomains: boolean };
type Errors = { websiteUrl?: string; maxPages?: string };
const defaults: Settings = { websiteUrl: 'https://example.com', maxPages: 50, includeSubdomains: false };

function validate(websiteUrl: string, maxPages: string): Errors {
  const errors: Errors = {};
  try {
    const url = new URL(websiteUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
  } catch { errors.websiteUrl = 'Enter an HTTP or HTTPS website URL without a username or password.'; }
  if (!maxPages.trim() || !Number.isInteger(Number(maxPages)) || Number(maxPages) < 1 || Number(maxPages) > 500) {
    errors.maxPages = 'Enter a whole number from 1 to 500.';
  }
  return errors;
}

function restore(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return defaults;
    const candidate = value as Partial<Settings>;
    if (typeof candidate.websiteUrl !== 'string' || typeof candidate.maxPages !== 'number' || typeof candidate.includeSubdomains !== 'boolean') return defaults;
    if (Object.keys(validate(candidate.websiteUrl, String(candidate.maxPages))).length) return defaults;
    return { websiteUrl: candidate.websiteUrl.trim(), maxPages: candidate.maxPages, includeSubdomains: candidate.includeSubdomains };
  } catch { return defaults; }
}

export default function App() {
  const [initial] = useState(restore);
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl);
  const [maxPages, setMaxPages] = useState(String(initial.maxPages));
  const [includeSubdomains, setIncludeSubdomains] = useState(initial.includeSubdomains);
  const [errors, setErrors] = useState<Errors>({});
  const [feedback, setFeedback] = useState<'saved' | 'failed' | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<HTMLInputElement>(null);
  function edited() { setFeedback(null); setErrors({}); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const nextErrors = validate(websiteUrl, maxPages);
    setErrors(nextErrors);
    if (nextErrors.websiteUrl) { urlRef.current?.focus(); return; }
    if (nextErrors.maxPages) { pagesRef.current?.focus(); return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ websiteUrl: websiteUrl.trim(), maxPages: Number(maxPages), includeSubdomains } satisfies Settings));
      setWebsiteUrl(websiteUrl.trim());
      setFeedback('saved');
    } catch { setFeedback('failed'); }
  }
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#settings"><span className="brand-icon" aria-hidden="true">R</span>RankLens</a><p className="tagline">A clearer view of your website.</p><nav aria-label="Workspace"><span className="nav-label">WORKSPACE</span><a className="active-link" href="#settings" aria-current="page"><span aria-hidden="true">⚙</span> Audit settings</a></nav><div className="sidebar-note"><span className="dot" />SETTINGS DEMO<p>Small changes.<br />Better foundations.</p></div></aside>
    <main id="settings"><header className="topbar"><span>Workspace <span aria-hidden="true">/</span> <strong>Audit settings</strong></span><span className="demo-badge">Demo workspace</span></header><div className="content"><p className="eyebrow">CONFIGURE YOUR WORKSPACE</p><h1>Start with the right scope.</h1><p className="intro">Set your website and page limit. A focused scope is the first step toward a healthier website.</p>
    <section className="settings-card" aria-labelledby="form-title"><div className="card-heading"><span className="section-icon" aria-hidden="true">◎</span><div><h2 id="form-title">Audit settings</h2><p>Your preferences, saved on this browser.</p></div></div>
    <form onSubmit={submit} noValidate><div className="field"><label htmlFor="website-url">Website URL</label><p id="url-hint" className="hint">Use the full HTTP or HTTPS address you want to configure.</p><input ref={urlRef} id="website-url" type="url" autoComplete="url" value={websiteUrl} onChange={e => { edited(); setWebsiteUrl(e.target.value); }} aria-invalid={Boolean(errors.websiteUrl)} aria-describedby={`url-hint${errors.websiteUrl ? ' url-error' : ''}`} />{errors.websiteUrl && <p className="error" id="url-error" role="alert">{errors.websiteUrl}</p>}</div>
    <div className="field pages-field"><label htmlFor="max-pages">Maximum pages</label><p id="pages-hint" className="hint">Choose a whole number between 1 and 500.</p><input ref={pagesRef} id="max-pages" type="number" min="1" max="500" step="1" value={maxPages} onChange={e => { edited(); setMaxPages(e.target.value); }} aria-invalid={Boolean(errors.maxPages)} aria-describedby={`pages-hint${errors.maxPages ? ' pages-error' : ''}`} />{errors.maxPages && <p className="error" id="pages-error" role="alert">{errors.maxPages}</p>}</div>
    <div className="checkbox-field"><input id="subdomains" type="checkbox" checked={includeSubdomains} onChange={e => { edited(); setIncludeSubdomains(e.target.checked); }} aria-describedby="subdomains-hint" /><div><label htmlFor="subdomains">Include subdomains</label><p id="subdomains-hint" className="hint">Include addresses such as blog.example.com in your scope.</p></div></div>
    <div className="demo-note"><strong>Settings-only demo</strong><p>Saving stores preferences locally. It does not crawl your website or run a real SEO audit.</p></div><div className="form-footer"><span>Stored on this device only</span><button type="submit">Save settings <span aria-hidden="true">→</span></button></div>
    {feedback === 'saved' && <p className="feedback success" role="status">Settings saved on this browser. No audit was run.</p>}{feedback === 'failed' && <p className="feedback error" role="alert">Settings could not be saved. Browser storage is unavailable. Please try again.</p>}</form></section><p className="footer-note">Thoughtful scope. Clearer insights.</p></div></main>
  </div>;
}
