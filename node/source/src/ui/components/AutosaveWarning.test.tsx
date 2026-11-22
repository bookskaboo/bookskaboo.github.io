import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, GameEngine } from '../../simulation/engine';
import { AutosaveWarning } from './AutosaveWarning';

afterEach(() => vi.unstubAllGlobals());

describe('persistent autosave warning', () => {
  it('offers recovery after a failure and disappears only after storage succeeds', () => {
    let blocked = true;
    vi.stubGlobal('localStorage', { setItem() { if (blocked) throw new Error('Unavailable'); } });
    const engine = new GameEngine(createInitialState(204));
    const render = () => renderToStaticMarkup(<AutosaveWarning engine={engine} />);
    expect(render()).toBe('');
    engine.retryAutosave();
    expect(render()).toContain('role="alert"');
    expect(render()).toContain('Autosave failed');
    expect(render()).toContain('Retry');
    expect(render()).toContain('Export Save');
    expect(render()).not.toContain('Dismiss');
    engine.togglePause();
    expect(render()).toContain('Autosave failed');
    blocked = false;
    engine.retryAutosave();
    expect(render()).toBe('');
  });
});
