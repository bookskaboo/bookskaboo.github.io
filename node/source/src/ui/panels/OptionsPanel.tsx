import type { GameState } from '../../domain/types';
import { GameEngine } from '../../simulation/engine';
import { NodeIcon } from '../NodeIcon';
import { PanelHeader } from '../PanelHeader';
import { SHORTCUT_BAR_IDS, type ShortcutBarsState } from '../ShortcutBars';

export function OptionsPanel({ game, engine, shortcutBars, onShortcutBars, onResetShortcutBars, onJournal, onSaveLoad, onCommands, onRecipes, onTutorials, training, onClose }: { game: GameState; engine: GameEngine; shortcutBars: ShortcutBarsState; onShortcutBars(v: ShortcutBarsState): void; onResetShortcutBars(): void; onJournal(): void; onSaveLoad(): void; onCommands(): void; onRecipes(): void; onTutorials(): void; training: boolean; onClose(): void }) {
  return <div className="modal-backdrop"><section className="modal options-modal glass"><PanelHeader eyebrow="LOCAL PREFERENCES" title="Options" onClose={onClose} /><div className="option-list">
    <button className="option-action" onClick={onJournal}><i>≡</i><span><b>Journal</b><small>Your discoveries, recorded before you forget what they do.</small></span><strong>OPEN</strong></button>
    <button className="option-action" onClick={onTutorials}><i>?</i><span><b>Tutorials</b><small>Learn in a separate factory. Keep the mistakes there.</small></span><strong>OPEN</strong></button>
    <button className="option-action" disabled={training} onClick={onSaveLoad}><i>◇</i><span><b>Save / Load</b><small>Save your progress. Or revisit an earlier opinion.</small></span><strong>OPEN</strong></button>

    <button className="option-action" onClick={onCommands}><i>⌨</i><span><b>Commands</b><small>The controls, written down. A radical convenience.</small></span><strong>OPEN</strong></button>
    <button className="option-action recipes-option" onClick={onRecipes}><i><NodeIcon kind="researchCenter" /></i><span><b>Recipes</b><small>Ingredients and machines. Guesswork has its limits.</small></span><strong>OPEN</strong></button>
    <Toggle icon="≈" label="Wire animations" description="Show moving materials. Let the cables look busy too." checked={game.preferences.particles} onChange={(particles) => engine.updatePreferences({ particles })} />
    <Toggle icon="▦" label="World grid" description="Show alignment lines. Order is still an option." checked={game.preferences.showGrid} onChange={(showGrid) => engine.updatePreferences({ showGrid })} />
    <Toggle icon="!" label="Confirm deletion" description="Ask before deleting nodes. Enthusiasm has consequences." checked={game.preferences.confirmDelete} onChange={(confirmDelete) => engine.updatePreferences({ confirmDelete })} />
    <div className="shortcut-visibility-options" role="group" aria-label="Shortcut bar visibility"><span>SHORTCUT BAR VISIBILITY</span>{SHORTCUT_BAR_IDS.map((barId, index) => { const visible = shortcutBars[barId].visible; const category = ['Production', 'Logistics', 'Storage'][index]; return <button key={barId} className={visible ? 'active' : ''} aria-pressed={visible} aria-label={`Shortcut Bar ${index + 1}, ${visible ? 'visible' : 'hidden'}. Toggle visibility.`} onClick={() => onShortcutBars({ ...shortcutBars, [barId]: { ...shortcutBars[barId], visible: !visible } })}><i>☰</i><b>Shortcut Bar {index + 1}</b><small>{category}</small><strong><kbd>F{index + 1}</kbd>{visible ? 'Visible' : 'Hidden'}</strong></button>; })}</div>
    <button className="option-action subtle" onClick={onResetShortcutBars}><i>↺</i><span><b>Reset shortcut bars</b><small>Reset positions, size, rotation, locks, and assignments. Tidiness by decree.</small></span><strong>RESET</strong></button>
  </div><div className="panel-note secure-note"><span>⌂</span><p><b>Local-only mode</b>Saves and shortcut layouts stay in this browser profile. Filing is your department.</p></div></section></div>;
}

function Toggle({ icon, label, description, checked, onChange }: { icon: string; label: string; description: string; checked: boolean; onChange(v: boolean): void }) { return <label className={`toggle-row ${checked ? 'enabled' : 'disabled'}`}><em>{icon}</em><span><b>{label}</b><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i /></label>; }
