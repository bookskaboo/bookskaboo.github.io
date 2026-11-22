import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import type { GameState } from '../../src/domain/types';
import type { CueId } from './audio';

export function soundSnapshot(game: GameState) {
  const sectors = Object.values(game.sectors);
  return {
    sector: game.activeSectorId, paused: game.paused, researchPaused: Boolean(game.research.paused),
    nodes: Object.fromEntries(sectors.flatMap(s => s.nodes).map(n => [n.id, { position: `${n.x},${n.y}`, configuration: `${n.recipeId}:${n.rotation}:${n.disabled}:${n.filterItem}` }])),
    connections: sectors.flatMap(s => s.connections.map(c => `${c.id}:${c.from}:${c.to}:${c.fromPort}:${c.toPort}`)),
    completed: [...game.research.completed],
    completions: (game.researchLog ?? []).map(e => e.id),
    queue: [...(game.research.queue ?? [])], selected: game.research.selected,
    unlocked: sectors.filter(s => s.unlocked).map(s => s.id),
  };
}
export type SoundSnapshot = ReturnType<typeof soundSnapshot>;
/** Choose one cue for an atomic publish; routine production/packets remain silent. */
export function changedSound(a: SoundSnapshot, b: SoundSnapshot): CueId | undefined {
  const completed = b.completed.filter(id => !a.completed.includes(id));
  if (completed.includes('victory')) return 'victory';
  if (completed.some(id => BOT_UPGRADES.some(upgrade => upgrade.id === id))) return 'upgrade';
  if (completed.length || b.completions.some(id => !a.completions.includes(id))) return 'complete';
  if (a.sector !== b.sector) return 'travel';
  if (a.paused !== b.paused) return b.paused ? 'pause' : 'resume';
  if (a.researchPaused !== b.researchPaused) return b.researchPaused ? 'pause' : 'resume';
  if (b.unlocked.some(id => !a.unlocked.includes(id))) return 'unlock';
  if (Object.keys(b.nodes).some(id => !a.nodes[id])) return 'place';
  if (Object.keys(a.nodes).some(id => !b.nodes[id])) return 'delete';
  if (Object.keys(b.nodes).some(id => a.nodes[id]?.configuration !== b.nodes[id].configuration)) return 'configure';
  if (b.connections.some(id => !a.connections.includes(id))) return 'connect';
  if (a.connections.some(id => !b.connections.includes(id))) return 'disconnect';
  if (Object.keys(b.nodes).some(id => a.nodes[id]?.position !== b.nodes[id].position)) return 'move';
  if (b.queue.some(id => !a.queue.includes(id)) || (b.selected && a.selected !== b.selected)) return 'queue';
}
