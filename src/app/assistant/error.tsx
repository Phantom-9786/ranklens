'use client';
import Link from 'next/link';
export default function AssistantError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="panel empty-panel" role="alert"><p className="eyebrow">YOUR CONVERSATION IS STILL SAVED</p><h1>The assistant couldn’t open.</h1><p>Try loading this view again. Saved messages will be restored when browser storage is available.</p><div className="health-actions"><button className="button-primary" onClick={reset}>Reload assistant</button><Link className="text-link" href="/audits">Explore sample reports instead ↗</Link></div></section>;
}
