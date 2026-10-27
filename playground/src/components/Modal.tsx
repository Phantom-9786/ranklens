import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type ModalProps = { trigger: string; title: string; description: string; children: ReactNode };

/** Single-dialog exercise: browser-native inertness, explicit keyboard wrapping. */
export function Modal({ trigger, title, description, children }: ModalProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal(); // Makes the rest of the document inert, unlike aria-modal alone.
    titleRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current!;
    const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
      .filter(element => !element.closest('[hidden]') && getComputedStyle(element).display !== 'none');
    const first = controls[0];
    const last = controls.at(-1);
    const active = document.activeElement;
    if (!first) { event.preventDefault(); titleRef.current?.focus(); return; }
    if (event.shiftKey && (active === first || active === titleRef.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (active === last || active === titleRef.current)) {
      event.preventDefault(); first.focus();
    }
  }

  return <>
    <button ref={triggerRef} className="primary" onClick={() => setOpen(true)}>{trigger}<span aria-hidden="true">↗</span></button>
    <dialog ref={dialogRef} aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onKeyDown={trapTab} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <div className="dialog-heading"><h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>{title}</h2><button className="icon-button" aria-label="Close custom dialog" onClick={() => setOpen(false)}>×</button></div>
      <p id={`${id}-description`}>{description}</p>
      {children}
      <div className="dialog-actions"><button className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" onClick={() => setOpen(false)}>Keep exploring</button></div>
    </dialog>
  </>;
}
