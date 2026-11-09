import type { ReactNode } from 'react';
import type { GameState } from '../../domain/types';
import { GameEngine } from '../../simulation/engine';
import { NodeIcon } from '../NodeIcon';
import { PanelHeader } from '../PanelHeader';
import { SHORTCUT_BAR_IDS, type ShortcutBarsState } from '../ShortcutBars';

export function OptionsPanel({ game, engine, shortcutBars, onShortcutBars, onResetShortcutBars, onJournal, onSaveLoad, onCommands, onRecipes, onMods, onTutorials, training, onClose }: { game: GameState; engine: GameEngine; shortcutBars: ShortcutBarsState; onShortcutBars(v: ShortcutBarsState): void; onResetShortcutBars(): void; onJournal(): void; onSaveLoad(): void; onCommands(): void; onRecipes(): void; onMods(): void; onTutorials(): void; training: boolean; onClose(): void }) {
  return <div className="modal-backdrop"><section className="modal options-modal glass"><PanelHeader title="Options" onClose={onClose} /><div className="option-list">
    <OptionAction icon="◇" label="Save / Load" description="Save your progress." flavor="Or revisit an earlier opinion." disabled={training} onClick={onSaveLoad} />
    <OptionAction icon="◈" label="Mods" description="Create, import and share factory rules." flavor="The handbook is now a suggestion." disabled={training} onClick={onMods} />
    <OptionAction icon="⌨" label="Commands" description="The controls, written down." flavor="A radical convenience." onClick={onCommands} />
    <OptionAction icon={<NodeIcon kind="researchCenter" />} label="Recipes" description="Ingredients and machines." flavor="Guesswork has its limits." className="recipes-option" onClick={onRecipes} />
    <OptionAction icon="?" label="Tutorials" description="Learn in a separate factory." flavor="Keep the mistakes there." onClick={onTutorials} />
    <OptionAction icon="≡" label="Journal" description="Your discoveries, recorded." flavor="Before you forget what they do." onClick={onJournal} />
    <div className="options-toggle-grid" role="group" aria-label="Game preferences">
      <Toggle icon="≈" label="Wire animations" description="Show moving materials." flavor="Let the cables look busy too." checked={game.preferences.particles} onChange={(particles) => engine.updatePreferences({ particles })} />
      <Toggle icon="▦" label="World grid" description="Show alignment lines." flavor="Order is still an option." checked={game.preferences.showGrid} onChange={(showGrid) => engine.updatePreferences({ showGrid })} />
      <Toggle icon="⌗" label="Always snap nodes to grid" description="Align node top-left corners when placing or moving. Hold A when off." flavor="The floor has standards." checked={game.preferences.snapToGrid ?? false} onChange={(snapToGrid) => engine.updatePreferences({ snapToGrid })} />
      <Toggle icon="!" label="Confirm deletion" description="Ask before deleting nodes." flavor="Enthusiasm has consequences." checked={game.preferences.confirmDelete} onChange={(confirmDelete) => engine.updatePreferences({ confirmDelete })} />
    </div>
    <div className="shortcut-visibility-options" role="group" aria-label="Shortcut bar visibility">{SHORTCUT_BAR_IDS.map((barId, index) => { const visible = shortcutBars[barId].visible; const category = ['Production', 'Logistics', 'Storage'][index]; return <button key={barId} className={visible ? 'active' : ''} aria-pressed={visible} aria-label={`Shortcut Bar ${index + 1}, ${visible ? 'visible' : 'hidden'}. Toggle visibility.`} onClick={() => onShortcutBars({ ...shortcutBars, [barId]: { ...shortcutBars[barId], visible: !visible } })}><i>☰</i><b>Shortcut Bar {index + 1}</b><small>{category}</small><strong><kbd>F{index + 1}</kbd>{visible ? 'Visible' : 'Hidden'}</strong></button>; })}</div>
    <OptionAction icon="↺" label="Reset shortcut bars" description="Reset positions, size, rotation, locks, and assignments." flavor="Tidiness by decree." className="subtle" action="RESET" onClick={onResetShortcutBars} />
  </div><div className="panel-note secure-note"><span>⌂</span><p><b>Local-only mode</b>Saves and shortcut layouts stay in this browser profile. Filing is your department.</p></div></section></div>;
}

function OptionAction({ icon, label, description, flavor, onClick, disabled, className = '', action = 'OPEN' }: {
  icon: ReactNode; label: string; description: string; flavor: string; onClick(): void; disabled?: boolean; className?: string; action?: string;
}) {
  return <button className={`option-action ${className}`} disabled={disabled} onClick={onClick} aria-label={label}
    aria-description={`${description} ${flavor}`} data-tooltip={label} data-tooltip-detail={description} data-tooltip-flavor={flavor}>
    <i aria-hidden="true">{icon}</i><span><b>{label}</b></span><strong aria-hidden="true">{action}</strong>
  </button>;
}

function Toggle({ icon, label, description, flavor, checked, onChange }: {
  icon: string; label: string; description: string; flavor: string; checked: boolean; onChange(v: boolean): void;
}) {
  return <label className={`toggle-row ${checked ? 'enabled' : 'disabled'}`} data-tooltip={label} data-tooltip-detail={description} data-tooltip-flavor={flavor}>
    <em aria-hidden="true">{icon}</em><span><b>{label}</b></span>
    <input type="checkbox" aria-label={label} aria-description={`${description} ${flavor}`} checked={checked} onChange={(e) => onChange(e.target.checked)} /><i aria-hidden="true" />
  </label>;
}
