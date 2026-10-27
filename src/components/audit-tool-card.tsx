import type { AuditToolPart } from '@/lib/audit-tool-contract';

export default function AuditToolCard({ part, interrupted = false }: { part: AuditToolPart; interrupted?: boolean }) {
  return <section className={`audit-tool ${part.state}`} aria-label="Sample audit report lookup" data-tool-state={part.state}>
    <header><span aria-hidden="true">{part.state === 'output-error' ? '!' : part.state === 'output-available' ? '✓' : '↗'}</span><strong>Sample report lookup</strong><small>{part.state === 'output-error' ? 'Needs attention' : part.state === 'output-available' ? 'Report ready' : interrupted ? 'Interrupted' : 'In progress'}</small></header>
    <div className="tool-body" key={part.state}>
      {part.state === 'input-streaming' && <><h3>{interrupted ? 'Report request interrupted' : 'Preparing your report request…'}</h3><p>{interrupted ? 'Send the request again to continue.' : 'The assistant is choosing a report and preparing its lookup details.'}</p><div className="tool-skeleton" aria-hidden="true"><i/><i/></div></>}
      {part.state === 'input-available' && <><h3>{interrupted ? 'Lookup interrupted' : 'Looking in the sample library'}</h3><p>Report ID <span className="tool-id">{part.input.auditId}</span></p><p>{interrupted ? 'Send the request again to continue.' : 'Input checked. Waiting for the server lookup result…'}</p></>}
      {part.state === 'output-error' && <><h3>We couldn’t load that report.</h3>{part.input && <p>Requested <span className="tool-id">{part.input.auditId}</span></p>}<p>{part.errorText}</p><p className="tool-recovery">Try asking: “Show the studio-north report.”</p></>}
      {part.state === 'output-available' && <><div className="tool-report-heading"><div><small>STORED SAMPLE · NOT A LIVE CRAWL</small><h3>{part.output.domain}</h3></div><div className="tool-score"><strong>{part.output.score}</strong><span>/ 100</span></div></div><div className="tool-metrics"><p><strong>{part.output.pages}</strong> sample pages</p><p><strong>{part.output.issues}</strong> sample issues</p></div><h4>Illustrative finding examples</h4><p className="tool-caption">Shared examples; these counts are not a complete breakdown of this report.</p><ul className="tool-findings">{part.output.findings.map((finding, index) => <li key={index}><div><span className={`tool-severity ${finding.severity.toLowerCase()}`}>{finding.severity}</span><small>{finding.category} · {finding.count} examples</small></div><strong>{finding.title}</strong><p>{finding.detail}</p></li>)}</ul></>}
    </div>
  </section>;
}
