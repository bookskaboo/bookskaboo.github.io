import { useRef } from 'react';
import { Dialog } from '../components/Dialog';
import { PanelHeader } from '../PanelHeader';
import { TUTORIAL_NAMES, type TutorialKind } from '../../tutorials/tutorialRuntime';

export function HintTutorialInvitation({ kind, onDismiss, onStart }: {
  kind: TutorialKind; onDismiss(): void; onStart(): void;
}) {
  const later = useRef<HTMLButtonElement>(null);
  return <div className="modal-backdrop tutorial-menu-backdrop hint-tutorial-backdrop"
    onMouseDown={event => event.stopPropagation()}
    onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}>
    <Dialog className="modal glass tutorial-dialog tutorial-invitation hint-tutorial-invitation"
      aria-label={`${TUTORIAL_NAMES[kind]} tutorial`} aria-describedby="hint-tutorial-invitation-copy"
      onDismiss={onDismiss} initialFocus={() => later.current}>
      <PanelHeader title={`${TUTORIAL_NAMES[kind]} tutorial`} onClose={onDismiss} />
      <div className="tutorial-modal-content">
        <p className="tutorial-intro" id="hint-tutorial-invitation-copy">We have a tutorial for this. It’s almost suspiciously relevant. Want to try it?</p>
        <p className="hint-tutorial-note">Practice in a separate factory.</p>
        <footer className="tutorial-actions">
          <button ref={later} className="tutorial-button" onClick={onDismiss}>Not now</button>
          <button className="tutorial-button tutorial-primary" onClick={onStart}>Start {TUTORIAL_NAMES[kind]}</button>
        </footer>
      </div>
    </Dialog>
  </div>;
}
