import { useEffect, useRef } from 'react';

export function DwarvenDiscoveryNotice({ onDismiss }: { onDismiss(): void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; button.current?.focus(); return () => { if (previous?.isConnected) previous.focus(); }; }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); onDismiss(); }
      if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onDismiss]);
  return <div className="modal-backdrop tutorial-unlock-backdrop"><section className="modal glass tutorial-unlock-modal" role="dialog" aria-modal="true" aria-labelledby="dwarven-discovery-title">
    <header className="panel-header"><div><h2 id="dwarven-discovery-title">Dwarven settlement discovered</h2></div></header>
    <div className="tutorial-modal-content">
      <div className="tutorial-unlock-copy">
        <p>Attacking them might be worth your while.</p>
      </div>
      <footer className="tutorial-unlock-actions"><button ref={button} className="primary-cta" onClick={onDismiss}>Noted.</button></footer>
    </div>
  </section></div>;
}
