import { ITEM_NAMES } from '../content/items';
import { getResearchProject, remainingMapNodePurchases } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { GameState, ResearchProject } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { missingResearchAccess, researchSection } from './researchPresentation';
import { researchProgress } from './researchProgress';

export function ResearchProjectDetail({ project, game, engine, canInspect, onPrerequisite, onOpenRecipe }: { project: ResearchProject; game: GameState; engine: GameEngine; canInspect?(id: string): boolean; onPrerequisite(id: string): void; onOpenRecipe(recipeId: string): void }) {
  const { active, rows, requirement, status } = researchProgress(project, game);
  const complete = !project.repeatable && game.research.completed.includes(project.id);
  const expansionFunded = project.id === 'mapNode' && remainingMapNodePurchases(game) === 0;
  const canStart = !project.trigger && !complete && !expansionFunded && researchSection(project, game) !== 'future';
  const current = getResearchProject(game.research.selected);
  return <article className="research-project-detail" data-project-detail={project.id} aria-label={`${project.name} details`}>
    <h3>{active ? `Researching ${project.name}` : project.name}</h3>
    <p>{project.description}</p>
    {project.flavorText && <p className="research-flavor">{project.flavorText}</p>}
    {project.trigger ? <p><b>Automatic milestone:</b> {complete ? project.trigger.complete : project.trigger.pending}</p> : <>
      {requirement && <p className="research-core-requirement">{requirement}</p>}
      <div className="research-payment-rows" aria-label={`${project.name} Core progress`}>{rows.map(row => <div key={row.item}>{RECIPES[row.item] ? <button className="research-recipe-link" aria-label={`View ${ITEM_NAMES[row.item]} recipe`} onClick={() => onOpenRecipe(row.item)}>{ITEM_NAMES[row.item]}</button> : <span>{ITEM_NAMES[row.item]}</span>}<b>{row.researched} / {row.required} researched</b><small>{row.remaining} remaining</small></div>)}</div>
      {active && <p className="research-delivery-status" role="status">{status}</p>}
      {active && <p>Deliver one of every remaining Core type per cycle. The Research Center does not accept an incomplete argument.</p>}
      {expansionFunded && <p>All maps are unlocked or funded. The world has run out of elsewhere.</p>}
      {!complete && !expansionFunded && <div className="research-project-actions">
        {active ? <button className="research-cancel" aria-label={`Cancel ${project.name} research`} onClick={() => engine.selectResearch(undefined)}>Cancel research</button> : <button className="research-start" data-start-research={project.id} disabled={!canStart || (canInspect && !canInspect(project.id))} onClick={() => engine.selectResearch(project.id)}>{current ? `Switch to ${project.name}` : `Start ${project.name} research`}</button>}
        <small>Switching keeps researched Cores but restarts the current cycle. Science saves its receipts.</small>
      </div>}
    </>}
    <div className="research-prerequisites">{missingResearchAccess(project, game).map(id => <button key={id} disabled={Boolean(canInspect && !canInspect(id))} onClick={() => onPrerequisite(id)}>Requires {getResearchProject(id)?.name ?? id} →</button>)}</div>
  </article>;
}
