import type { CSSProperties } from 'react';
import { getResearchProject } from '../../content/research';
import type { GameState } from '../../domain/types';
import type { GameEngine } from '../../simulation/engine';
import { researchProgress } from '../researchProgress';
import { researchSection } from '../researchPresentation';
import { RESEARCH_FILTER_OPTIONS } from '../researchUiConfig';
import { nextBotUpgrade } from '../../content/botUpgrades';

export function BotUpgrade({ game, engine, onInspect, onOpenRecipe, disabled = false, highlighted = false }: { game: GameState; engine: GameEngine; onInspect(id: string): void; onOpenRecipe(id: string): void; disabled?: boolean; highlighted?: boolean }) {
  const upgrade = nextBotUpgrade(game);
  if (!upgrade) return <section className="bot-upgrade" aria-label="Bot upgrade"><p className="bot-upgrade-finished">All seven upgrades complete.</p></section>;
  const project = getResearchProject(upgrade.id)!;
  const { rows, active } = researchProgress(project, game);
  const available = researchSection(project, game) === 'available';
  const paid = rows.reduce((sum, row) => sum + row.researched, 0);
  const total = rows.reduce((sum, row) => sum + row.required, 0);
  const action = active ? `Disable ${upgrade.label}` : available ? `Enable ${upgrade.label}` : `View ${upgrade.label} requirements`;
  const detail = project.description;
  return <section className="bot-upgrade" aria-label="Bot upgrade" data-bot-upgrade={upgrade.id}>
    
    <button type="button" disabled={disabled} className={`bot-upgrade-button ${active ? 'active' : available ? 'available' : 'locked'}${highlighted ? ' hint-research-focus' : ''}`} aria-label={action} aria-pressed={active}
      aria-description={detail} data-tooltip={upgrade.label} data-tooltip-detail={detail}
      onClick={() => { onInspect(upgrade.id); if (active) engine.releasePriorityResearch(upgrade.id); else if (available) engine.selectResearch(upgrade.id); }}>
      <progress value={paid} max={total || 1} aria-label={`${upgrade.label} Core payments`} />
      <span>Upgrade</span>
    </button>
    <div className="bot-upgrade-cores" role="group" aria-label={`${upgrade.label} required Cores`}>{rows.map(row => {
      const option = RESEARCH_FILTER_OPTIONS.find(option => option.id === row.item)!;
      return <button key={row.item} type="button" disabled={disabled} className="research-requirement-filter research-core-badge" style={{ '--research-filter-color': option.color } as CSSProperties}
        aria-label={`${option.label} Cores ${row.researched} of ${row.required}; view recipe`} onClick={() => onOpenRecipe(row.item)}>
        <i /><span>{option.label}</span><span className="bot-core-count">{row.researched}/{row.required}</span>
      </button>;
    })}</div>

  </section>;
}
