import type { CSSProperties } from 'react';
import type { GameState, ResearchProject } from '../../domain/types';
import { ResearchCard } from '../ResearchCard';
import { researchProgress } from '../researchProgress';
import { researchPrerequisiteName } from '../researchPresentation';
import { RESEARCH_FILTER_OPTIONS } from '../researchUiConfig';
import { researchTriggerCopy } from '../../content/researchGuidance';

export function ResearchListRow({ project, game, selected, highlighted = false, onInspect, onOpenRecipe, onQueue, disabled = false, tutorialChoice = false, recipesDisabled = false }: {
  project: ResearchProject; game: GameState; selected?: string;
  onInspect(id: string, keyboard?: boolean): void; onOpenRecipe(id: string): void;
  onQueue?(id: string): void;
  highlighted?: boolean;
  disabled?: boolean; tutorialChoice?: boolean; recipesDisabled?: boolean;
}) {
  const { rows } = researchProgress(project, game);
  const prerequisites = [...new Set([project.prerequisite, ...(project.prerequisites ?? [])].filter((id): id is string => Boolean(id)))];
  const unlockRequirement = project.trigger?.id === 'complex-core-produced' ? 'Produce 1 Complex Core'
    : researchTriggerCopy(project, game)?.pending ?? (prerequisites.length ? `Complete ${prerequisites.map(researchPrerequisiteName).join(' and ')}` : 'Available from the start');
  return <div className="status-research-row" role="listitem" data-project-row={project.id}>
    <ResearchCard project={project} game={game} disabled={disabled} expanded={false} selected={selected === project.id} highlighted={highlighted} showProgress={false} tutorialChoice={tutorialChoice} filters={[]} onToggle={onInspect} onDoubleClick={onQueue} />
    <div className="status-row-costs" role="group" aria-label={`${project.name} ${rows.length ? 'Core costs' : 'unlock requirement'}`}>
      {rows.length ? rows.map(row => {
        const core = RESEARCH_FILTER_OPTIONS.find(option => option.id === row.item)!;
        return <button key={row.item} type="button" disabled={recipesDisabled} className="research-requirement-filter research-core-badge"
          style={{ '--research-filter-color': core.color } as CSSProperties}
          aria-label={`${row.required} ${core.label} Cores; view recipe`} onClick={() => onOpenRecipe(row.item)}>
          <span className="status-cost-number">{row.required}</span><i /><span>{core.label}</span>
        </button>;
      }) : <span className="status-unlock-requirement">{unlockRequirement}</span>}
    </div>
  </div>;
}
