import { ITEM_NAMES } from '../content/items';
import { getResearchCostsForState } from '../content/research';
import type { GameState, ItemId, ResearchProject } from '../domain/types';

/** Reports processed payments separately from Cores still sitting in Center buffers. */
export function researchProgress(project: ResearchProject, game: GameState, now = Date.now()) {
  const active = game.research.selected === project.id;
  const complete = !project.repeatable && game.research.completed.includes(project.id);
  const paid = active ? game.research.contributed : game.research.projectContributions?.[project.id] ?? {};
  const rows = Object.entries(getResearchCostsForState(project, game.research)).map(([key, value]) => {
    const item = key as ItemId, required = value ?? 0;
    const researched = complete ? required : Math.min(required, Math.max(0, paid[item] ?? 0));
    return { item, required, researched, remaining: Math.max(0, required - researched) };
  });
  const requirement = rows.length > 1 ? 'Each listed Core is required.' : '';
  if (!active) return { active, rows, requirement, status: '' };
  if (game.paused) return { active, rows, requirement, status: 'Simulation paused. Resume to continue research.' };
  const centers = Object.values(game.sectors).filter(sector => sector.unlocked).flatMap(sector => sector.nodes).filter(node => node.kind === 'researchCenter');
  if (!centers.length) return { active, rows, requirement, status: 'Build a Research Center and deliver the required Cores to it.' };
  const enabled = centers.filter(node => !node.disabled && !node.processingPaused);
  if (!enabled.length) return { active, rows, requirement, status: 'Enable or resume a Research Center to continue.' };
  const ready = enabled.filter(node => now - node.constructedAt >= node.constructionMs);
  if (!ready.length) return { active, rows, requirement, status: 'Wait for a Research Center to finish construction.' };
  const outstanding = rows.filter(row => row.remaining > 0);
  if (!outstanding.length) return { active, rows, requirement, status: 'Finishing research.' };
  if (ready.some(node => outstanding.every(row => (node.input[row.item] ?? 0) >= 1))) return { active, rows, requirement, status: 'Processing Cores in a Research Center.' };
  // Pick the Center closest to a complete set. Adding stock in different Centers
  // must not imply that the simulation can consume a set across those machines.
  const missing = ready.map(node => outstanding.filter(row => (node.input[row.item] ?? 0) < 1)).sort((a, b) => a.length - b.length)[0];
  return { active, rows, requirement, status: `Waiting for ${missing.map(row => ITEM_NAMES[row.item]).join(' and ')}. Each Research Center needs its own complete Core set.` };
}
