import { useEffect, useState } from 'react';
import type { GameState } from '../domain/types';
import { getResearchMilestones } from './researchMilestones';

const HEADING = 'Obligatory hand holding';

export function ResearchHintCard({ game }: { game: GameState }) {
  const [held, setHeld] = useState(false);
  const hideHint = () => setHeld(false);

  useEffect(() => {
    const release = () => setHeld(false);
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, []);

  const hint = held ? getResearchMilestones(game).at(-1) : undefined;

  return <section className="research-next-slot" aria-label={HEADING}>
    <h3>{HEADING}</h3>
    <button type="button" className="research-milestone" aria-label="Hold to reveal research hint"
      onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setHeld(true);
      }}
      onPointerUp={hideHint} onPointerCancel={hideHint} onLostPointerCapture={hideHint} onBlur={hideHint}
      onKeyDown={event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        setHeld(true);
      }}
      onKeyUp={event => {
        if (event.key === ' ' || event.key === 'Enter') hideHint();
      }}>
      {hint ? <><strong>{hint.title}</strong><span>{hint.detail}</span></> : <span>Hold to reveal hint</span>}
    </button>
    <div className="research-hint-announcement" role="status">{hint ? `${hint.title}. ${hint.detail}` : ''}</div>
  </section>;
}
