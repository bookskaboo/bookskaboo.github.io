import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTOSAVE_KEY, SAVE_KEY } from '../../persistence/saves';
import { createInitialState, GameEngine } from '../../simulation/engine';
import { SavePanel } from './SavePanel';

let memory: Map<string, string>;
beforeEach(() => {
  memory = new Map();
  vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) });
});
afterEach(() => vi.unstubAllGlobals());
const manual = (html: string, index: number) => html.match(new RegExp('<article[^>]+aria-label="Manual save slot ' + (index + 1) + '"[\\s\\S]*?</article>'))![0];
function fixture() {
  const engine = new GameEngine(createInitialState(204), { autosave: false });
  const game = engine.getState();
  const panel = () => renderToStaticMarkup(<SavePanel game={game} engine={engine} onLoad={() => {}} onClose={() => {}} />);
  const saved = (name: string) => ({ savedAt: 1234, name, state: game });
  return { game, panel, saved };
}

describe('save-slot protection presentation', () => {
  it('labels a damaged slot without disabling loading from healthy siblings', () => {
    const { game, saved, panel } = fixture();
    memory.set(SAVE_KEY, JSON.stringify([saved('Healthy A'), { ...saved('Broken'), state: { ...game, research: { ...game.research, completed: {} } } }, saved('Healthy C')]));
    const html = panel();
    expect(manual(html, 0)).toContain('Healthy A');
    expect(manual(html, 0)).not.toMatch(/<button[^>]*disabled/);
    expect(manual(html, 2)).toContain('Healthy C');
    expect(manual(html, 2)).not.toMatch(/<button[^>]*disabled/);
    const broken = manual(html, 1);
    expect(broken).toContain('UNREADABLE');
    expect(broken).not.toContain('EMPTY');
    expect(broken).toContain('Saving to another slot will keep its data.');
    expect(broken).toMatch(/<button[^>]*disabled[^>]*>LOAD/);
    expect(broken).toMatch(/<button>OVERWRITE/);
  });

  it('disables manual saves and autosave copies when the collection is unreadable', () => {
    const { game, panel } = fixture();
    memory.set(SAVE_KEY, '{broken');
    memory.set(AUTOSAVE_KEY, JSON.stringify(game));
    const html = panel();
    expect(html).toContain('role="alert"');
    expect(html).toContain('Saved slots could not be read.');
    expect(html).toContain('Retry');
    for (let index = 0; index < 3; index++) {
      expect(manual(html, index)).toContain('UNAVAILABLE');
      expect(manual(html, index)).not.toContain('EMPTY');
      expect(manual(html, index).match(/<button[^>]*disabled/g)).toHaveLength(2);
    }
    const copyControls = html.match(/<div class="autosave-copy-actions">[\s\S]*?<\/div>/)![0];
    expect(copyControls.match(/<button[^>]*disabled/g)).toHaveLength(3);
  });
});
