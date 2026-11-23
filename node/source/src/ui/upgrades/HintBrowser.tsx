import { useLayoutEffect, useState } from 'react';
import type { GameState } from '../../domain/types';
import { hintKey, readStatusHintHistory, statusHint, syncStatusHintHistory } from './statusHints';
import { hintDisplayTitle } from '../../content/hintTitles';
import { destinationDescription, hintDestination, type HintDestination } from './hintNavigation';

export function HintBrowser({ game, assignment, initialHintKey, allowTutorials = true, onAssignmentRead, onNavigate }: {
  game: GameState; assignment: string; initialHintKey?: string; onAssignmentRead(): void;
  onNavigate?(destination: HintDestination, title: string): void;
  allowTutorials?: boolean;
}) {
  const unlocked = readStatusHintHistory(game, assignment).unlocked;
  const recommended = statusHint(game, assignment)!;
  const recommendedKey = hintKey(recommended);
  const [selected, setSelected] = useState(() => unlocked.some(hint => hintKey(hint) === initialHintKey) ? initialHintKey! : recommendedKey);
  const historySignature = JSON.stringify(unlocked);

  useLayoutEffect(() => { syncStatusHintHistory(game, assignment); }, [game, assignment, historySignature]);
  const [previousRecommended, setPreviousRecommended] = useState(recommendedKey);
  if (previousRecommended !== recommendedKey) { setPreviousRecommended(recommendedKey); setSelected(recommendedKey); }

  const index = Math.max(0, unlocked.findIndex(hint => hintKey(hint) === selected));
  const current = unlocked[index] ?? recommended;
  const candidate = onNavigate ? hintDestination(game, current.title) : undefined;
  const destination = candidate?.kind === 'tutorial' && !allowTutorials ? undefined : candidate;
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
      <div className="robot-hint-copy" aria-live="polite" aria-atomic="true"><strong>{hintDisplayTitle(current.title)}</strong><p>{current.detail}</p></div>
    </div>
    <nav className="robot-hint-navigation" aria-label="Browse unlocked hints">
      <button type="button" className="hint-previous" aria-label="Previous hint" title="Previous hint" disabled={index === 0} onClick={() => select(index - 1)}><span aria-hidden="true" /></button>
      {destination && <button type="button" className="hint-context-action" aria-label={destinationDescription(destination)}
        onClick={() => onNavigate?.(destination, current.title)}>Show me</button>}
      <button type="button" className="hint-next" aria-label="Next hint" title="Next hint" disabled={index >= unlocked.length - 1} onClick={() => select(index + 1)}><span aria-hidden="true" /></button>
    </nav>
  </section>;
}
