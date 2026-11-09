import { useEffect, useRef } from 'react';
import type { GameState } from '../../domain/types';
import type { GameEngine } from '../../simulation/engine';
import { IconGlyph } from '../NodeIcon';
import '../../styles/endgame.css';

export function EndgameNotice({ game, engine }: { game: GameState; engine: GameEngine }) {
  const rescue = game.rescue?.pending;
  const victory = !rescue && game.research.completed.includes('victory') && !game.endgame?.victoryAcknowledged;
  const card = useRef<HTMLElement>(null);
  const open = Boolean(rescue || victory);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    card.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { if(previous?.isConnected)previous.focus(); };
  }, [open, rescue?.resource]);
  if (!open) return null;
  const stage = game.rescue?.resources.length ?? 1;
  const title = rescue ? ['Congratulations. You found the edge case.', 'Another successful failure.', 'Congratulations. The checklist is on fire.'][Math.min(2, stage - 1)] : 'Victory. Somehow.';
  const close = () => rescue ? engine.acknowledgeRescue() : engine.acknowledgeVictory();
  return <div className="endgame-backdrop" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'Tab') {
      const buttons = [...(card.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
      if (buttons.length === 1 || (event.shiftKey && document.activeElement === buttons[0]) || (!event.shiftKey && document.activeElement === buttons.at(-1))) { event.preventDefault(); (event.shiftKey ? buttons.at(-1) : buttons[0])?.focus(); }
    }
  }}><section ref={card} className={`endgame-notice ${rescue ? 'endgame-rescue' : ''}`} role="dialog" aria-modal="true" aria-labelledby="endgame-title">
    <div className="endgame-orbit" aria-hidden="true">{rescue ? <span>✦</span> : <IconGlyph icon="final-core" className="endgame-core" />}<i/><i/><i/><i/></div>
    <small>{rescue ? 'EMERGENCY PROCEDURE: SUCCESSFUL' : 'FINAL CORE ACCEPTED'}</small>
    <h1 id="endgame-title">{title}</h1>
    {rescue ? <>
      <p>{stage === 1 ? 'Thank you for trying to break the game.' : stage === 2 ? 'Two resources. Two rescue routes. Your commitment to a test nobody assigned has been noted.' : 'Iron, Copper and Stone. All three. Thank you. We have enough data.'}</p>
      <p>The {rescue.resource[0].toUpperCase() + rescue.resource.slice(1)} Golem at <strong>{rescue.sectorId}</strong> has received an administrative defeat. Its infinite reserve and a shortest route are open. Extraction and transport remain your department.</p>
      {stage === 3 && <p className="endgame-achievement">Achievement unlocked: Destructive Testing</p>}
      <div className="endgame-actions"><button onClick={() => { engine.switchSector(rescue.sectorId); close(); }}>SHOW RESERVE</button><button onClick={close}>CONTINUE</button></div>
    </> : <>
      <p className="endgame-subtitle">All four corners. One Final Core. A remarkably indirect way to finish a to-do list.</p>
      <p>I've now asked you to do everything I wanted this game to offer: tame the corners, connect the world, and persuade a very large factory to cooperate. I hope you had fun along the way. Thank you for playing.</p>
      <p>If you didn't, you're welcome to mod NODE until it's actually fun. I've done the difficult part: leaving room for improvement.</p>
      <p>Still need more? Perhaps visit a planet. Or two. Launch a few rockets. I'm told this is how small factory projects remain small.</p>
      <p>Alternatively, sign up with a very large company, travel to a perfectly good planet, and extract its resources. There will probably be a form confirming how satisfied you are.</p>
      <p className="endgame-subtitle">Your factory and progress are preserved. Keep building, keep improving, or just watch it work.</p>
      <button onClick={close}>CONTINUE PLAYING</button><small>Optimization is now a personal problem.</small>
    </>}
  </section></div>;
}
