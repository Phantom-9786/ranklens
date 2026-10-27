import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DemoNote, PageHeading, Score } from '@/components/ui';
import { audits, findings } from '@/lib/fixtures';
export function generateStaticParams() { return audits.map(audit => ({ id: audit.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const audit = audits.find(item => item.id === id); return { title: audit ? `${audit.domain} report` : 'Report not found' }; }
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const audit = audits.find(item => item.id === id); if (!audit) notFound();
  return <><Link href="/audits" className="back-link">← All website audits</Link><PageHeading eyebrow="SAMPLE AUDIT REPORT" title={audit.domain}>A preview of how findings will become actionable next steps.</PageHeading><DemoNote/><section className="report-summary panel"><div><p className="eyebrow">ILLUSTRATIVE SEO SCORE</p><Score score={audit.score}/><p>{audit.category} · {audit.pages} fixture pages</p></div><div><h2>Your next improvement starts with context.</h2><p>This sample report demonstrates the screen structure. The findings below are shared illustrative examples, not a real scan of this domain.</p></div></section><section className="panel"><div className="panel-title"><div><h2>Sample findings</h2><p>Illustrative content, accessibility, and structure opportunities.</p></div></div>{findings.map(finding => <article className="finding-row" key={finding.title}><span className={`severity ${finding.severity.toLowerCase()}`}>{finding.severity}</span><div><h3>{finding.title}</h3><p>{finding.detail}</p></div><span>{finding.count} sample pages</span></article>)}</section><div className="inline-note">AI explanations and a content editing pass are planned for subsequent capstone milestones.</div></>;
}
