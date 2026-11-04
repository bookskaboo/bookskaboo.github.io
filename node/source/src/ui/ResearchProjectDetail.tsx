import { atResearchCap } from '../content/endgame';
import type { CSSProperties } from 'react';
import { ITEM_NAMES } from '../content/items';
import { getResearchProject, remainingMapNodePurchases } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { GameState, ResearchProject } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { missingResearchAccess, researchSection } from './researchPresentation';
import { researchProgress } from './researchProgress';
import { RESEARCH_FILTER_OPTIONS } from './researchUiConfig';

export function ResearchProjectDetail({ project, game, engine, canInspect, onPrerequisite, onOpenRecipe }: { project: ResearchProject; game: GameState; engine: GameEngine; canInspect?(id: string): boolean; onPrerequisite(id: string): void; onOpenRecipe(recipeId: string): void }) {
  const { active, rows, status } = researchProgress(project, game);
  const complete = atResearchCap(project,game.research) || (!project.repeatable && game.research.completed.includes(project.id));
  const expansionFunded = project.id === 'mapNode' && remainingMapNodePurchases(game) === 0;
  const canStart = !project.trigger && !complete && !expansionFunded && researchSection(project, game) !== 'future';
  const current = getResearchProject(game.research.selected);
  const total = rows.reduce((sum, row) => sum + row.required, 0);
  const paid = rows.reduce((sum, row) => sum + row.researched, 0);
  return <article className="research-project-detail" data-project-detail={project.id} aria-label={`${project.name} details`}>
    <header className="research-detail-heading">
      <h3>{project.name}</h3>
      {!project.trigger && <>
        <div className="research-detail-cores" aria-label={`${project.name} required Cores`}>{rows.map(row => {
          const option = RESEARCH_FILTER_OPTIONS.find(option => option.id === row.item);
          const detail = `${row.researched} / ${row.required} researched · ${row.remaining} remaining. Every displayed Core type is required.${RECIPES[row.item] ? ' Click to view its recipe.' : ''}`;
          return <button key={row.item} type="button" className="research-requirement-filter research-core-badge" style={{ '--research-filter-color': option?.color } as CSSProperties}
            aria-label={`View ${ITEM_NAMES[row.item]} recipe`} aria-description={detail} disabled={!RECIPES[row.item]} onClick={() => onOpenRecipe(row.item)}
            data-tooltip={ITEM_NAMES[row.item]} data-tooltip-detail={detail} data-tooltip-tone={option?.color}>
            <i /><span>{option?.label ?? ITEM_NAMES[row.item]}</span><span className="research-core-paid" style={{ width: `${row.required > 0 ? row.researched / row.required * 100 : 0}%` }} aria-hidden="true" />
          </button>;
        })}</div>
        <strong className="research-detail-total" aria-label={`${total} Cores required in total`} data-tooltip="Total Cores" data-tooltip-detail={`${paid} / ${total} Cores researched. Hover a Core badge for its individual cost and progress.`}>{total}</strong>
      </>}
    </header>
    <p>{project.description}</p>
    <div className="research-flavor-actions">
      {project.flavorText && <p className="research-flavor">{project.flavorText}</p>}
      {!project.trigger && !complete && !expansionFunded && <>
        {active ? <button className="research-cancel" aria-label={`Cancel ${project.name} research`} data-tooltip="Cancel research" data-tooltip-detail="Keep the Cores already researched. The current cycle restarts when you resume." onClick={() => engine.selectResearch(undefined)}>Cancel</button>
          : <button className="research-start" aria-label={`Start ${project.name} research`} data-start-research={project.id} disabled={!canStart || (canInspect && !canInspect(project.id))}
            data-tooltip="Start research" data-tooltip-detail={current ? `Switch from ${current.name}. Researched Cores are kept; the current cycle restarts. Science saves its receipts.` : 'Select this project, then deliver its required Cores to a Research Center.'} onClick={() => engine.selectResearch(project.id)}>Start</button>}
      </>}
    </div>
    {project.trigger ? <p><b>Automatic milestone:</b> {complete ? project.trigger.complete : project.trigger.pending}</p> : <>
      {active && <p className="research-delivery-status" role="status">{status}</p>}
      {expansionFunded && <p>All maps are unlocked or funded. The world has run out of elsewhere.</p>}
    </>}
    <div className="research-prerequisites">{missingResearchAccess(project, game).map(id => <button key={id} disabled={Boolean(canInspect && !canInspect(id))} onClick={() => onPrerequisite(id)}>Requires {getResearchProject(id)?.name ?? id} →</button>)}</div>
  </article>;
}
