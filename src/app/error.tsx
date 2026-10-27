'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <section className="panel empty-panel" role="alert"><h1>Something went out of focus.</h1><p>We couldn't load this view. Please try again.</p><button className="button-primary" onClick={reset}>Try again</button></section>; }
