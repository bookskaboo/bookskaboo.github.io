import { FINAL_CORE_PRODUCTION } from '../content/endgame';
import type { CSSProperties } from 'react';
import { ITEM_NAMES } from '../content/items';
import { getResearchProject, remainingMapNodePurchases } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { GameState, ResearchProject } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { researchPrerequisiteName, researchSection, visibleResearchRequirements } from './researchPresentation';
import { researchProgress } from './researchProgress';
import { RESEARCH_FILTER_OPTIONS } from './researchUiConfig';

export function ResearchProjectDetail({ project, game, engine, canInspect, onPrerequisite, onOpenRecipe }: { project: ResearchProject; game: GameState; engine: GameEngine; canInspect?(id: string): boolean; onPrerequisite(id: string): void; onOpenRecipe(recipeId: string): void }) {
  const { active, rows, status } = researchProgress(project, game);
  const section = researchSection(project, game);
  const expansionFunded = project.id === 'mapNode' && remainingMapNodePurchases(game) === 0;
  const canStart = section === 'available' && (!canInspect || canInspect(project.id));
  const current = getResearchProject(game.research.selected);
  const total = rows.reduce((sum, row) => sum + row.required, 0);
  const paid = rows.reduce((sum, row) => sum + row.researched, 0);
  return <article className="research-project-detail" data-project-detail={project.id} aria-label={`${project.name} details`} tabIndex={-1}>
    <header className="research-detail-heading">
      <div className="research-detail-title">
        <h3>{project.name}</h3>
        {section === 'active' ? <button type="button" className="research-detail-action research-cancel" aria-label={`Cancel ${project.name} research`}
          data-tooltip="Cancel research" data-tooltip-detail="Keep the Cores already researched. The current cycle restarts when you resume."
          onClick={() => engine.selectResearch(undefined)}>Cancel research</button>
          : canStart ? <button type="button" className="research-detail-action research-start" aria-label={`Start ${project.name} research`} data-start-research={project.id}
            data-tooltip="Start research" data-tooltip-detail={current ? `Switch from ${current.name}. Keep the Cores already researched. The current cycle restarts when you resume.` : 'Deliver the required Cores to a Research Center after starting.'}
            onClick={() => engine.selectResearch(project.id)}>Start research</button>
          : <span className="research-detail-state">{section === 'completed' ? 'Complete' : project.trigger ? 'Automatic' : 'Locked'}</span>}
      </div>
      {!project.trigger && <div className="research-detail-cores" role="group" aria-label={`${project.name} required Cores`}>
        {rows.map(row => {
          const option = RESEARCH_FILTER_OPTIONS.find(option => option.id === row.item);
          const detail = `${row.required} required${RECIPES[row.item] ? '. Click to view the recipe.' : '.'}`;
          return <button key={row.item} type="button" className="research-requirement-filter research-core-badge" style={{ '--research-filter-color': option?.color } as CSSProperties}
            aria-label={`View ${ITEM_NAMES[row.item]} recipe`} aria-description={detail} disabled={!RECIPES[row.item]} onClick={() => onOpenRecipe(row.item)}
            data-tooltip={ITEM_NAMES[row.item]} data-tooltip-detail={detail} data-tooltip-tone={option?.color}>
            <i /><span>{option?.label ?? ITEM_NAMES[row.item]}</span><span className="research-core-paid" style={{ width: `${row.required > 0 ? row.researched / row.required * 100 : 0}%` }} aria-hidden="true" />
          </button>;
        })}
        <strong className="research-detail-total" aria-label={`${paid} of ${total} Cores researched`}>{paid}/{total}</strong>
      </div>}
    </header>
    {project.trigger && <p>{section === 'completed' ? project.trigger.complete : project.trigger.pending}</p>}
    <div className="research-prerequisites">{visibleResearchRequirements(project, game).map(id => id === FINAL_CORE_PRODUCTION
      ? <button key={id} onClick={() => onOpenRecipe('final-core')}>Produce a Final Core →</button>
      : <button key={id} disabled={Boolean(canInspect && !canInspect(id))} onClick={() => onPrerequisite(id)}>Requires {researchPrerequisiteName(id)} →</button>)}</div>
    <p className="research-description">{project.description || project.unlock}</p>
    {project.flavorText && <p className="research-flavor">{project.flavorText}</p>}
    {!project.trigger && active && <p className="research-delivery-status" role="status">{status}</p>}
    {expansionFunded && <p>All maps are unlocked or funded. The world has run out of elsewhere.</p>}
  </article>;
}
