import type { Metadata } from 'next';
import Link from 'next/link';
import { AuditLink, DemoNote, PageHeading, Score } from '@/components/ui';
import { audits } from '@/lib/fixtures';
export const metadata: Metadata = { title: 'Website audits' };
export default function AuditsPage() { return <><PageHeading eyebrow="YOUR WORKSPACE" title="Every website. One clear picture." action={<Link href="/audits/new" className="button-primary">＋ New audit</Link>}>Explore the sample reports that shape your next steps.</PageHeading><DemoNote/><section className="audit-cards" aria-label="Sample audits">{audits.map(audit => <article className="panel site-card" key={audit.id}><div className="site-card-top"><span className={`site-avatar avatar-${audit.id}`}>{audit.label}</span><span className="pill">Sample report</span></div><h2>{audit.domain}</h2><p>{audit.category}</p><Score score={audit.score}/><div className="site-card-stats"><span>{audit.pages} sample pages</span><span>{audit.issues} findings</span></div><AuditLink id={audit.id}/></article>)}</section></>; }
