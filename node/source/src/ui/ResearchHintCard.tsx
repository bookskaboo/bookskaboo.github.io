import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameState } from '../domain/types';
import { getResearchMilestones, type ResearchMilestone } from './researchMilestones';

const HEADING = 'Obligatory hand holding';

export function ResearchHintCard({ game, hintOverride, heading = HEADING, scrollOnReveal = false, onReveal }: { game: GameState; hintOverride?: ResearchMilestone; heading?: string; scrollOnReveal?: boolean; onReveal?(hint: ResearchMilestone): void }) {
  const [held, setHeld] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const revealedHint = useRef<ResearchMilestone | undefined>(undefined);
  const hideHint = () => { revealedHint.current = undefined; setHeld(false); };
  const showHint = () => {
    if (held) return;
    const next = hintOverride ?? getResearchMilestones(game).at(-1);
    revealedHint.current = next;
    setHeld(true);
    if (next) onReveal?.(next);
  };

  useEffect(() => {
    const release = () => { revealedHint.current = undefined; setHeld(false); };
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, []);

  // A reveal callback may advance the parent's selection. Keep this hold readable.
  const hint = held ? onReveal ? revealedHint.current : hintOverride ?? getResearchMilestones(game).at(-1) : undefined;
  useLayoutEffect(() => {
    if (held && scrollOnReveal) buttonRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [held, scrollOnReveal]);

  return <section className="research-next-slot" aria-label={heading}>
    <h3>{heading}</h3>
    <button ref={buttonRef} type="button" className="research-milestone" aria-label="Hold to reveal research hint"
      onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        showHint();
      }}
      onPointerUp={hideHint} onPointerCancel={hideHint} onLostPointerCapture={hideHint} onBlur={hideHint}
      onKeyDown={event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        showHint();
      }}
      onKeyUp={event => {
        if (event.key === ' ' || event.key === 'Enter') hideHint();
      }}>
      {hint ? <><strong>{hint.title}</strong><span>{hint.detail}</span></> : <span>Hold to reveal hint</span>}
    </button>
    <div className="research-hint-announcement" role="status">{hint ? `${hint.title}. ${hint.detail}` : ''}</div>
  </section>;
}
