import { useState, type FormEvent } from 'react';
import './styles.css';

export default function App() {
  const [website, setWebsite] = useState('');
  const [limit, setLimit] = useState('100');
  const [frequency, setFrequency] = useState('manual');
  const [mobile, setMobile] = useState(true);
  const [links, setLinks] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    try {
      const url = new URL(website);
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error();
    } catch {
      setError('Enter a complete website URL, such as https://example.com.');
      document.getElementById('website')?.focus();
      return;
    }
    try {
      localStorage.setItem('ranklens-audit-settings', JSON.stringify({ website, limit, frequency, mobile, links }));
      setError(''); setStatus('Settings saved in this browser. No audit has been started.');
    } catch { setError('Your browser could not save settings. Allow local storage and try again.'); }
  }
  return <div className="shell">
    <header><a href="#main" className="brand"><span>R</span>RankLens</a><small>WORKSPACE</small></header>
    <main id="main"><p className="eyebrow">YOUR WEBSITE, IN FOCUS</p><h1>Audit settings</h1><p className="intro">Set the scope for a clearer picture of your website’s SEO.</p>
      <div className="layout"><form onSubmit={save} onChange={() => { setStatus(''); setError(''); }} noValidate>
        <section><div className="section-heading"><span className="step">01</span><div><h2>Website & scope</h2><p>Choose where your audit begins.</p></div></div>
          <label htmlFor="website">Website URL <small>Required</small></label><input id="website" type="url" required placeholder="https://example.com" value={website} onChange={event => setWebsite(event.target.value)} aria-describedby="website-help" aria-invalid={error.startsWith('Enter')}/><p id="website-help" className="help">Include http:// or https://. Use a website you own or manage.</p>
          <div className="fields"><div><label htmlFor="limit">Page limit</label><select id="limit" value={limit} onChange={event => setLimit(event.target.value)}><option value="25">25 pages</option><option value="100">100 pages</option><option value="500">500 pages</option></select></div><div><label htmlFor="frequency">Audit frequency</label><select id="frequency" value={frequency} onChange={event => setFrequency(event.target.value)}><option value="manual">Manual</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div></div>
        </section>
        <section><div className="section-heading"><span className="step">02</span><div><h2>What to check</h2><p>Make your next audit work for you.</p></div></div>
          <label className="check"><input type="checkbox" checked={mobile} onChange={event => setMobile(event.target.checked)}/><span>Mobile friendliness<small>Review how pages work on smaller screens.</small></span></label>
          <label className="check"><input type="checkbox" checked={links} onChange={event => setLinks(event.target.checked)}/><span>Broken links<small>Find links that lead visitors to a dead end.</small></span></label>
        </section>
        <footer><div><p role="alert" className="error">{error}</p><p role="status" className="success">{status}</p></div><button type="submit">Save settings <span aria-hidden="true">↗</span></button></footer>
      </form><aside><span className="aside-icon" aria-hidden="true">◎</span><h2>A little setup.<br/>A lot more clarity.</h2><p>Start with a focused audit, then expand your scope as your website grows.</p><hr/><p className="note"><strong>Local demo</strong>Settings are saved only in this browser. Scheduling and website crawling are not connected.</p></aside></div>
    </main><div className="bottom-note">RANKLENS <span>Make every page count.</span></div>
  </div>;
}
