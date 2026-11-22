import { Dialog } from './Dialog';

export function DwarvenDiscoveryNotice({ onDismiss }: { onDismiss(): void }) {
  return <div className="modal-backdrop tutorial-unlock-backdrop"><Dialog className="modal glass tutorial-unlock-modal" aria-labelledby="dwarven-discovery-title" onDismiss={onDismiss}>
    <header className="panel-header"><div><h2 id="dwarven-discovery-title">Dwarven settlement discovered</h2></div></header>
    <div className="tutorial-modal-content">
      <div className="tutorial-unlock-copy">
        <p>Attacking them might be worth your while.</p>
      </div>
      <footer className="tutorial-unlock-actions"><button className="primary-cta" onClick={onDismiss}>Noted.</button></footer>
    </div>
  </Dialog></div>;
}
