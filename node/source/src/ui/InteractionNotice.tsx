import { useEffect, useRef, useState } from 'react';

export interface InteractionFailure { title: string; detail: string; x: number; y: number }

/** A failure stays reachable until the next deliberate action, never mouse movement. */
export function InteractionNotice({ failure, onDismiss }: { failure: InteractionFailure; onDismiss(): void }) {
  const [expanded, setExpanded] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dismiss = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') { onDismiss(); return; }
      if (event.target instanceof Element && event.target.closest('[data-interaction-notice]')) return;
      onDismiss();
    };
    // A right-click's trailing contextmenu event must not dismiss the notice it just opened.
    for (const type of ['pointerdown', 'keydown', 'wheel']) window.addEventListener(type, dismiss, true);
    return () => { for (const type of ['pointerdown', 'keydown', 'wheel']) window.removeEventListener(type, dismiss, true); };
  }, [onDismiss]);
  useEffect(() => { if (expanded) close.current?.focus(); }, [expanded]);
  const left = Math.max(8, Math.min(window.innerWidth - 268, failure.x + 18));
  const top = Math.max(8, Math.min(window.innerHeight - 68, failure.y + 18));
  return expanded ? <div className="interaction-explanation-backdrop" data-interaction-notice onPointerDown={event => { if (event.target === event.currentTarget) onDismiss(); }}>
    <section className="interaction-explanation glass" role="dialog" aria-modal="true" aria-labelledby="interaction-failure-title" onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); close.current?.focus(); } }}>
      <h2 id="interaction-failure-title">{failure.title}</h2><p>{failure.detail}</p><button ref={close} onClick={onDismiss}>Close explanation</button>
    </section>
  </div> : <button data-interaction-notice className="interaction-notice" style={{ left, top }} onClick={() => setExpanded(true)} aria-label={`${failure.title}. Show explanation`}><span aria-hidden="true">!</span><b>{failure.title}</b><small>Details</small></button>;
}
