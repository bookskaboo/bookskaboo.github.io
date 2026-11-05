import { useEffect, useRef } from 'react';
import type { MachineNode } from '../../domain/types';
import { getGoblinAttackRequirement } from '../../content/goblinSettlements';
import { tributeAmount } from '../../simulation/goblinTribute';

export function DwarvenDiscoveryNotice({ camp, onDismiss }: { camp: MachineNode; onDismiss(): void }) {
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
    <header className="panel-header"><div><small>DWARVEN SETTLEMENT DISCOVERED</small><h2 id="dwarven-discovery-title">Suppressing this one is probably a good idea.</h2></div></header>
    <div className="tutorial-unlock-copy">
      <p>You found a <b>{camp.name}</b>. Fully suppress it to receive <b>Mythril Tribute</b>. Apparently, diplomacy has an input socket.</p>
      <p>Deliver at least <b>{getGoblinAttackRequirement(camp)} AP every 60 seconds</b>. Successful checks shrink the settlement. At 10% size, its separate Tribute box produces <b>{tributeAmount(camp)} Mythril every five seconds</b>.</p>
      <p>Other camps can demand different AP and give different Tribute. Goblins offer basic resources; Dwarves supply Mythril. The first Dwarven Mythril production unlocks Mythril processing.</p>
      <p>Keep the bots coming. A missed Dwarven check pauses new Mythril; its stored stock and wiring survive the disagreement.</p>
    </div>
    <footer className="tutorial-unlock-actions"><button ref={button} className="primary-cta" onClick={onDismiss}>Noted. Prepare the diplomatic machinery.</button></footer>
  </section></div>;
}
