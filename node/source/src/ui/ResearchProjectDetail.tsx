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
import { mapResearchNeedsDestination, canPurchaseMap } from '../simulation/mapExpansion';
import { mapNodePosition } from '../domain/worldGrid';

export function ResearchProjectDetail({ project, game, engine, canInspect, guided, onPrerequisite, onOpenRecipe, onOpenMap }: { project: ResearchProject; game: GameState; engine: GameEngine; canInspect?(id: string): boolean; guided?: boolean; onPrerequisite(id: string): void; onOpenRecipe(recipeId: string): void; onOpenMap?(): void }) {
  const { active, rows, status } = researchProgress(project, game);
  const section = researchSection(project, game);
  const expansionFunded = project.id === 'mapNode' && remainingMapNodePurchases(game) === 0;
  const canStart = section === 'available' && (!canInspect || canInspect(project.id));
  const selectDestination = project.id === 'mapNode' && mapResearchNeedsDestination(game);
  const destination = project.id === 'mapNode' ? game.research.mapNodeQuote?.destination : undefined;
  const [x, y] = destination?.split(',').map(Number) ?? [];
  const description = game.worldRulesVersion===2 && project.id==='lakeRelocation' ? 'Move Lakes and all directly connected Lake Intakes together within their map.'
    : game.worldRulesVersion===2 && project.id==='campRelocation' ? 'Move a Monster Camp and its guarded deposit together within their map.' : project.description || project.unlock;
  const current = getResearchProject(game.research.selected);
  const total = rows.reduce((sum, row) => sum + row.required, 0);
  const paid = rows.reduce((sum, row) => sum + row.researched, 0);
  return <article className="research-project-detail" data-project-detail={project.id} aria-label={`${project.name} details`} tabIndex={-1}>
    <header className="research-detail-heading">
      <div className="research-detail-title">
        <h3>{project.name}</h3>
        {section === 'active' ? guided ? <span className="research-detail-state">Active</span> : <button type="button" className="research-detail-action research-cancel" aria-label={`Cancel ${project.name} research`}
          data-tooltip="Cancel research" data-tooltip-detail="Keep the Cores already researched. The current cycle restarts when you resume."
          onClick={() => engine.selectResearch(undefined)}>Cancel research</button>
          : canStart && selectDestination ? <button type="button" className="research-detail-action research-start" onClick={onOpenMap}>Open Node Map</button>
          : canStart ? <button type="button" className="research-detail-action research-start" aria-label={`Start ${project.name} research`} data-start-research={project.id}
            data-tooltip="Start research" data-tooltip-detail={current ? `Switch from ${current.name}. Keep the Cores already researched. The current cycle restarts when you resume.` : 'Deliver the required Cores to a Research Center after starting.'}
            onClick={() => engine.selectResearch(project.id)}>Start research</button>
          : <span className="research-detail-state">{section === 'completed' ? 'Complete' : project.trigger ? 'Automatic' : 'Locked'}</span>}
      </div>
      {!project.trigger && !selectDestination && <div className="research-detail-cores" role="group" aria-label={`${project.name} required Cores`}>
        {rows.map(row => {
          const option = RESEARCH_FILTER_OPTIONS.find(option => option.id === row.item);
          const detail = `${row.required} required${!guided && RECIPES[row.item] ? '. Click to view the recipe.' : '.'}`;
          return <button key={row.item} type="button" className="research-requirement-filter research-core-badge" style={{ '--research-filter-color': option?.color } as CSSProperties}
            aria-label={guided ? ITEM_NAMES[row.item] : `View ${ITEM_NAMES[row.item]} recipe`} aria-description={detail} disabled={guided || !RECIPES[row.item]} onClick={() => onOpenRecipe(row.item)}
            data-tooltip={ITEM_NAMES[row.item]} data-tooltip-detail={detail} data-tooltip-tone={option?.color}>
            <i /><span>{option?.label ?? ITEM_NAMES[row.item]}</span><span className="research-core-paid" style={{ width: `${row.required > 0 ? row.researched / row.required * 100 : 0}%` }} aria-hidden="true" />
          </button>;
        })}
        <strong className="research-detail-total" aria-label={`${paid} of ${total} Cores researched`}>{paid}/{total}</strong>
      </div>}
    </header>
    {project.trigger && <p>{section === 'completed' ? project.trigger.complete : project.trigger.pending}</p>}
    <div className="research-prerequisites">{visibleResearchRequirements(project, game).map(id => id === FINAL_CORE_PRODUCTION
      ? <button key={id} disabled={guided} onClick={() => onOpenRecipe('final-core')}>Produce a Final Core →</button>
      : <button key={id} disabled={Boolean(canInspect && !canInspect(id))} onClick={() => onPrerequisite(id)}>Requires {researchPrerequisiteName(id)} →</button>)}</div>
    <p className="research-description">{destination ? `Deliver these Cores to unlock ${mapNodePosition(x, y)}.` : selectDestination
      ? 'Choose a neighboring node on the map to see its Core cost.' : description}</p>
    {destination && !canPurchaseMap(game,x,y) && <p className="field-help" role="status">Nearby generated Deep Holes prevent this new purchase. Fill them to continue; the quote is retained.</p>}
    {project.flavorText && <p className="research-flavor">{project.flavorText}</p>}
    {game.worldRulesVersion===2 && ['fluidLink5','fluidLink6'].includes(project.id) && <p className="field-help">Also raises each Lake's Intake limit to {project.id==='fluidLink5'?3:4}.</p>}
    {game.worldRulesVersion===2 && project.id==='lakeRelocation' && <p className="field-help">All directly connected Lake Intakes move with the Lake.</p>}
    {game.worldRulesVersion===2 && project.id==='campRelocation' && <p className="field-help">The guarded deposit moves with its settlement.</p>}
    {game.worldRulesVersion===2 && project.id==='resourceRelocation' && <p className="field-help">Guarded deposits use Monster Camp Relocation and move with their settlement.</p>}
    {!project.trigger && active && <p className="research-delivery-status" role="status">{status}</p>}
    {expansionFunded && <p>All maps are unlocked or funded. The world has run out of elsewhere.</p>}
  </article>;
}
