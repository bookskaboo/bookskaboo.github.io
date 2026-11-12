import { PanelHeader } from './PanelHeader';
import { TUTORIAL_NAMES } from '../tutorials/tutorialRuntime';
import type { ProgressiveTutorialKind } from '../tutorials/tutorialUnlocks';

export function TutorialUnlockInvitation({ kind, onStart, onLater }: { kind: ProgressiveTutorialKind; onStart(): void; onLater(): void }) {
  const expansion = kind === 'expansion';
  const name = TUTORIAL_NAMES[kind];
  return <div className="modal-backdrop tutorial-unlock-backdrop">
    <section className="modal glass tutorial-dialog tutorial-invitation" role="dialog" aria-modal="true" aria-label={`${name} tutorial`}>
      <PanelHeader title={`${name} tutorial`} onClose={onLater} />
      <div className="tutorial-modal-content">
        <p className="tutorial-intro">{expansion ? 'Use your first Map Point to visit an outpost and ship Wood Home with a Cart at each end of the Road.' : 'Learn how to supply Attack Power and collect Tribute. The neighbors keep a schedule.'}</p>
        <footer className="tutorial-actions">
          <button className="tutorial-button" onClick={onLater} data-tooltip="Maybe later" data-tooltip-detail="Find this lesson under Options → Tutorials.">Maybe later</button>
          <button className="tutorial-button tutorial-primary" onClick={onStart} autoFocus>Start {name}</button>
        </footer>
      </div>
    </section>
  </div>;
}
