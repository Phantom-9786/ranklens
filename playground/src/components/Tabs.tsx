import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type TabItem = { label: string; content: ReactNode };
type TabsProps = { label: string; items: readonly TabItem[] };

/** Horizontal, left-to-right, automatic-activation APG tabs. */
export function Tabs({ label, items }: TabsProps) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return; // Up/Down keep normal page scrolling in a horizontal tablist.
    event.preventDefault();
    setSelected(next);
    refs.current[next]?.focus();
  }
  if (!items.length) return <p>No tabs available.</p>;
  return <div className="custom-tabs">
    <div role="tablist" aria-label={label} aria-orientation="horizontal" className="tablist">
      {items.map((item, index) => <button key={item.label} ref={element => { refs.current[index] = element; }} id={`${id}-tab-${index}`} role="tab" aria-selected={selected === index} aria-controls={`${id}-panel-${index}`} tabIndex={selected === index ? 0 : -1} onFocus={() => setSelected(index)} onClick={() => setSelected(index)} onKeyDown={event => move(event, index)}>{item.label}</button>)}
    </div>
    {items.map((item, index) => <section key={item.label} role="tabpanel" className="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0}>{item.content}</section>)}
  </div>;
}
