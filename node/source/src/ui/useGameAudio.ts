import { useEffect, useState } from 'react';
import { GameAudio } from '../audio/GameAudio';
import type { GameEngine } from '../simulation/engine';

/** Keep one music clock across campaign/practice engines and bind only the active factory. */
export function useGameAudio(engine: GameEngine, preferencesEngine: GameEngine) {
  const [audio] = useState(() => new GameAudio());
  useEffect(() => {
    const update = () => audio.update(preferencesEngine.getState().preferences);
    update(); return preferencesEngine.subscribe(update);
  }, [audio, preferencesEngine]);
  useEffect(() => {
    audio.reset();
    let failed = engine.hasAutosaveFailure();
    const unsubscribe = engine.subscribeFeedback(event => event.type === 'reset' ? audio.reset() : audio.play(event.cue));
    const unsubscribeWarnings = engine.subscribe(() => { const next = engine.hasAutosaveFailure(); if (next && !failed) audio.play('attention'); failed = next; });
    return () => { unsubscribe(); unsubscribeWarnings(); audio.reset(); };
  }, [audio, engine]);
  useEffect(() => {
    const activate = () => { void audio.activate(); };
    const key = (event: KeyboardEvent) => { if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) activate(); };
    const visibility = () => { void audio.setHidden(document.hidden); };
    document.addEventListener('pointerdown', activate, true); document.addEventListener('keydown', key, true);
    document.addEventListener('visibilitychange', visibility); visibility();
    return () => { document.removeEventListener('pointerdown', activate, true); document.removeEventListener('keydown', key, true); document.removeEventListener('visibilitychange', visibility); void audio.dispose(); };
  }, [audio]);
  return audio;
}
