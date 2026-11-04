import type { GameState } from '../domain/types';
import type { GameMod } from './modTypes';
import { activateMod } from './modContent';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { portFamiliesCompatible } from '../simulation/connectionRules';

export function applyModNames(state: GameState) {
  for (const node of [...Object.values(state.sectors).flatMap(s => s.nodes), ...(state.factoryTemplates ?? []).flatMap(t => t.nodes)]) {
    const replacement = state.mod?.nodes[node.kind]?.name;
    if (replacement !== undefined) { node.modBaseName ??= node.name; node.name = replacement; }
    else if (node.modBaseName !== undefined) { node.name = node.modBaseName; delete node.modBaseName; }
  }
}

/** Inspect a prospective catalog without changing the factory or removing its cables. */
export function modCompatibilityError(state: GameState, mod?: GameMod): string | undefined {
  activateMod(mod);
  try {
    for (const sector of [...Object.values(state.sectors), ...(state.factoryTemplates ?? []).map(t => ({ ...t, id: `template ${t.name}` }))]) {
      const nodes = new Map(sector.nodes.map(node => [node.id, node]));
      for (const node of sector.nodes) {
        const patch = mod?.nodes[node.kind];
        const incoming = sector.connections.filter(c => c.to === node.id);
        const outgoing = sector.connections.filter(c => c.from === node.id);
        if ((patch?.maxInputConnections !== undefined && incoming.length > patch.maxInputConnections) || (patch?.maxOutputConnections !== undefined && outgoing.length > patch.maxOutputConnections)) return `${node.name} on ${sector.id} has more cables than this mod allows. Remove the extra cables first.`;
        for (const [direction, cables] of [['input', incoming], ['output', outgoing]] as const) {
          const multi = patch?.[direction === 'input' ? 'multiInput' : 'multiOutput'];
          if (multi === false) {
            const counts = new Map<number, number>();
            for (const cable of cables) { const port = (direction === 'input' ? cable.toPort : cable.fromPort) ?? 0; counts.set(port, (counts.get(port) ?? 0) + 1); }
            if ([...counts.values()].some(count => count > 1)) return `${node.name} on ${sector.id} has a shared ${direction} socket. Remove its extra cables first.`;
          }
        }
      }
      for (const cable of sector.connections) {
        const source = nodes.get(cable.from), target = nodes.get(cable.to);
        if (!source || !target) continue;
        const output = getEffectiveNodeOutputFamilies(source)[cable.fromPort ?? 0];
        const input = getEffectiveNodeInputFamilies(target, state.research.completed)[cable.toPort ?? 0];
        if (!output || !input || !portFamiliesCompatible(source, cable.fromPort ?? 0, target, cable.toPort ?? 0, state.research.completed)) return `The cable from ${source.name} to ${target.name} on ${sector.id} conflicts with these settings. Disconnect it before applying.`;
      }
    }
    return undefined;
  } finally { activateMod(state.mod); }
}
