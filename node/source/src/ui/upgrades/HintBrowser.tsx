import { useLayoutEffect, useState } from 'react';
import type { GameState } from '../../domain/types';
import { hintKey, readStatusHintHistory, statusHint, syncStatusHintHistory } from './statusHints';

export function HintBrowser({ game, assignment, onAssignmentRead }: {
  game: GameState; assignment: string; onAssignmentRead(): void;
}) {
  const unlocked = readStatusHintHistory(game, assignment).unlocked;
  const recommended = statusHint(game, assignment)!;
  const recommendedKey = hintKey(recommended);
  const [selected, setSelected] = useState(recommendedKey);
  const historySignature = JSON.stringify(unlocked);

  useLayoutEffect(() => { syncStatusHintHistory(game, assignment); }, [game, assignment, historySignature]);
  useLayoutEffect(() => { setSelected(recommendedKey); }, [recommendedKey]);

  const index = Math.max(0, unlocked.findIndex(hint => hintKey(hint) === selected));
  const current = unlocked[index] ?? recommended;
  const select = (next: number) => {
    const hint = unlocked[next];
    if (!hint) return;
    if (current.title === 'Your assignment' && hint.title !== 'Your assignment') onAssignmentRead();
    setSelected(hintKey(hint));
  };

  return <section className="robot-hint-browser" aria-label="Robot thoughts" tabIndex={0}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); select(index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); select(index + 1); }
    }}>
    <div className="robot-hint-content">
      <div className="robot-hint-sizer" aria-hidden="true"><strong>Your assignment</strong><p>{assignment}</p></div>
      <div className="robot-hint-copy" aria-live="polite" aria-atomic="true"><strong>{current.title}</strong><p>{current.detail}</p></div>
    </div>
    <nav className="robot-hint-navigation" aria-label="Browse unlocked hints">
      <button type="button" className="hint-previous" aria-label="Previous hint" title="Previous hint" disabled={index === 0} onClick={() => select(index - 1)}><span aria-hidden="true" /></button>
      <button type="button" className="hint-next" aria-label="Next hint" title="Next hint" disabled={index >= unlocked.length - 1} onClick={() => select(index + 1)}><span aria-hidden="true" /></button>
    </nav>
  </section>;
}
