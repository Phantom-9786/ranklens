import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeading({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{children}</p></div>{action}</div>;
}
export function DemoNote() { return <div className="demo-note"><span aria-hidden="true">◈</span><p><strong>A foundation for better insights.</strong> Reports use sample audit data. Ask the AI assistant to explain findings; live website crawling is still planned.</p><span className="pill">Sample reports</span></div>; }
export function AuditLink({ id, children = 'View report' }: { id: string; children?: ReactNode }) { return <Link className="text-link" href={`/audits/${id}`}>{children}<span aria-hidden="true">↗</span></Link>; }
export function Score({ score }: { score: number }) { return <span className={`score ${score < 75 ? 'score-amber' : ''}`}>{score}<small>/100</small></span>; }
