import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../../simulation/engine';
import { DEFAULT_SHORTCUT_BARS } from '../ShortcutBars';
import { OptionsPanel } from './OptionsPanel';
it('shows independent accessible midpoint sliders and mute buttons in Options', () => {
  const engine = new GameEngine(createInitialState(214), { autosave:false });
  const render = () => renderToStaticMarkup(<OptionsPanel game={engine.getState()} engine={engine} shortcutBars={DEFAULT_SHORTCUT_BARS} onShortcutBars={()=>{}} onResetShortcutBars={()=>{}} onJournal={()=>{}} onSaveLoad={()=>{}} onCommands={()=>{}} onRecipes={()=>{}} onMods={()=>{}} onTutorials={()=>{}} training={false} onClose={()=>{}} />);
  const html = render(); expect(html).toContain('aria-label="Audio settings"');
  expect(html).toMatch(/aria-label="Music volume"[^>]*value="50"/); expect(html).toMatch(/aria-label="Sound effects volume"[^>]*value="50"/);
  expect(html).toContain('aria-label="Mute music" aria-pressed="false"'); expect(html).toContain('aria-label="Mute sound effects" aria-pressed="false"');
  engine.updatePreferences({musicVolume:70,musicMuted:true,effectsVolume:35});
  const changed = render(); expect(changed).toContain('aria-label="Mute music" aria-pressed="true"'); expect(changed).toContain('>70%</output>'); expect(changed).toContain('>35%</output>');
});
