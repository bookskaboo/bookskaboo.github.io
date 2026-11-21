import { BOT_UPGRADES } from '../content/botUpgrades';
import { migrateCoreResearch } from '../content/coreResearch';
import type { GameState } from '../domain/types';

/** Keep earned recipe IDs and payments; applied-mod adoption remains deferred. */
export function migrateUpgrades(state: GameState) {
  if (state.mod) return;
  migrateCoreResearch(state);
  state.mapResearchMode = 'points';
  const research = state.research;
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
