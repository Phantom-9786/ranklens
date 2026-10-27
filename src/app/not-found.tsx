import Link from 'next/link';
export default function NotFound() { return <section className="panel empty-panel"><p className="eyebrow">404 · A LITTLE OFF TRACK</p><h1>That page isn't in view.</h1><p>Try the overview or explore one of the sample website audits.</p><Link href="/" className="button-primary">Back to overview →</Link></section>; }
