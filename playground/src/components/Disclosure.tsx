import { useId, useState, type ReactNode } from 'react';

type DisclosureProps = { label: string; children: ReactNode };
export function Disclosure({ label, children }: DisclosureProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  return <div className="disclosure">
    <button className="disclosure-trigger" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{label}<span aria-hidden="true">{expanded ? '−' : '+'}</span></button>
    <div id={id} hidden={!expanded} className="disclosure-content">{children}</div>
  </div>;
}
