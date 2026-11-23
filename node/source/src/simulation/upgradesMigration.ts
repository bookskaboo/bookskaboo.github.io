import { BOT_UPGRADES } from '../content/botUpgrades';
import { migrateCoreResearch } from '../content/coreResearch';
import type { GameState } from '../domain/types';
import { worldCornerIds, worldGridSize } from '../domain/worldGrid';

/** Keep earned recipe IDs and payments; applied-mod adoption remains deferred. */
export function migrateUpgrades(state: GameState) {
  if (!state.mod) migrateCoreResearch(state);
  const research = state.research;
  if (research.endgameUnlockVersion !== 1) {
    const previousRecipes = research.completed.includes('complexCore') || research.completed.includes('cornerComponents');
    const previousMarkers = previousRecipes || worldCornerIds(worldGridSize(state)).some(id => {
      const sector = state.sectors[id];
      return sector?.unlocked && (sector.visited || id === state.activeSectorId)
        && sector.nodes.some(node => node.kind === 'cornerChallenge');
    });
    if (previousRecipes) research.legacyHalfRecipesUnlocked = true;
    if (previousMarkers) research.legacyCornerLocationsRevealed = true;
    research.endgameUnlockVersion = 1;
  }
  if (state.mod) return;
  state.mapResearchMode = 'points';
  if (research.mapNodeQuote) delete research.mapNodeQuote.destination;
  const highest = BOT_UPGRADES.reduce((last, upgrade, index) => research.completed.includes(upgrade.id) ? index : last, -1);
  for (const upgrade of BOT_UPGRADES.slice(0, highest + 1)) {
    if (!research.completed.includes(upgrade.id)) research.completed.push(upgrade.id);
    if (!research.unlocked.includes(upgrade.id)) research.unlocked.push(upgrade.id);
  }
  if (research.queue === undefined) {
    research.queue = research.selected && !BOT_UPGRADES.some(upgrade => upgrade.id === research.selected)
      ? [research.selected] : [];
  }
  research.paused ??= false;
}
