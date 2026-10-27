import type { Metadata } from 'next';
import { PageHeading } from '@/components/ui';
import { fetchHealth, HEALTH_SOURCE } from '@/lib/health';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'System health' };
export default async function HealthPage() {
  const health = await fetchHealth();
  return <><PageHeading eyebrow="A CHECK THAT MEANS SOMETHING" title="Built on a healthy foundation.">Live server-fetched repository data, separate from the sample audit data.</PageHeading><section className="panel form-panel"><div className="panel-title"><div><h2>Public repository connection</h2><p>Fetched on the server for this request.</p></div><span className={`pill ${health.ok ? 'health-ok' : 'health-error'}`}>{health.ok ? 'Connected' : 'Upstream unavailable'}</span></div><dl className="settings-list"><div><dt>Source</dt><dd><a href={HEALTH_SOURCE} target="_blank" rel="noreferrer">GitHub public API ↗</a></dd></div><div><dt>Checked at (UTC)</dt><dd><time dateTime={health.checkedAt}>{health.checkedAt}</time></dd></div>{health.ok && <><div><dt>Repository</dt><dd>{health.repository.full_name}</dd></div><div><dt>Default branch</dt><dd>{health.repository.default_branch}</dd></div><div><dt>Last repository update</dt><dd>{health.repository.updated_at}</dd></div></>}</dl>{!health.ok && <p role="alert" className="inline-note error-note">{health.error}</p>}<div className="health-actions"><a href="/health" className="button-primary">Check again ↗</a><a className="text-link" href="/api/health">View JSON health response →</a></div><p className="field-hint">Unauthenticated public API requests may be rate-limited. A failed request is shown honestly and does not claim the upstream is healthy.</p></section></>;
}
