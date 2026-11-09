import type { GameState, ItemId } from '../domain/types';
import { isCustomContentId, type GameMod } from './modTypes';
import { activateMod } from './modContent';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { portFamiliesCompatible } from '../simulation/connectionRules';
import { ITEM_NAMES } from '../content/items';
import { NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { getResearchProject } from '../content/research';

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
    const research = state.research;
    const payments = { ...research.projectContributions, ...(research.selected ? { [research.selected]: research.contributed } : {}) };
    const paidProject = Object.entries(payments).find(([id, bag]) => isCustomContentId(id) && !getResearchProject(id) && Object.values(bag).some(count => (count ?? 0) > 0));
    if (paidProject) return `Research has already received payment for ${paidProject[0]}. Keep that project in the mod.`;
    const missingItem = (item: string) => isCustomContentId(item) && !Object.hasOwn(ITEM_NAMES, item);
    const missingStock = (bag?: Partial<Record<ItemId, number>>) => Object.entries(bag ?? {}).find(([item, count]) => (count ?? 0) > 0 && missingItem(item))?.[0];
    const stock = [state.globalPool, ...Object.values(payments)];
    const reserved = stock.map(missingStock).find(Boolean) ?? state.inFlightTransfers?.find(transfer => missingItem(transfer.item))?.item;
    if (reserved) return `This factory still holds or is moving ${reserved}. Keep that item in the mod until it is used.`;
    for (const sector of [...Object.values(state.sectors), ...(state.factoryTemplates ?? []).map(t => ({ ...t, id: `template ${t.name}` }))]) {
      const nodes = new Map(sector.nodes.map(node => [node.id, node]));
      const incoming = new Map<string, typeof sector.connections>();
      const outgoing = new Map<string, typeof sector.connections>();
      for (const cable of sector.connections) {
        if (cable.item && missingItem(cable.item)) return `A cable on ${sector.id} uses ${cable.item}. Disconnect it before removing the item.`;
        if (!incoming.has(cable.to)) incoming.set(cable.to, []);
        if (!outgoing.has(cable.from)) outgoing.set(cable.from, []);
        incoming.get(cable.to)!.push(cable);
        outgoing.get(cable.from)!.push(cable);
      }
      for (const node of sector.nodes) {
        if (!Object.hasOwn(NODE_DEFINITIONS, node.kind)) return `${node.name} on ${sector.id} uses a node type this mod would remove.`;
        if (isCustomContentId(node.kind) && state.mod?.nodes[node.kind]?.template !== mod?.nodes[node.kind]?.template) {
          return `${node.name} on ${sector.id} uses a different template. Keep its original template or create a new node type.`;
        }
        if (node.recipeId && isCustomContentId(node.recipeId) && !Object.hasOwn(RECIPES, node.recipeId)) return `Change the recipe on ${node.name} before removing it.`;
        if (node.batch?.recipeId && isCustomContentId(node.batch.recipeId) && !Object.hasOwn(RECIPES, node.batch.recipeId)) return `Finish the current batch on ${node.name} before removing its recipe.`;
        const item = [node.resourceItem, node.filterItem, node.tributeItem].find(value => value && missingItem(value)) ??
          [node.input, node.output, node.batch?.outputs].map(missingStock).find(Boolean);
        if (item) return `${node.name} on ${sector.id} still uses ${item}. Keep that item in the mod until it is cleared.`;
        const patch = mod?.nodes[node.kind];
        const inputs = incoming.get(node.id) ?? [];
        const outputs = outgoing.get(node.id) ?? [];
        if ((patch?.maxInputConnections !== undefined && inputs.length > patch.maxInputConnections) || (patch?.maxOutputConnections !== undefined && outputs.length > patch.maxOutputConnections)) return `${node.name} on ${sector.id} has more cables than this mod allows. Remove the extra cables first.`;
        for (const [direction, cables] of [['input', inputs], ['output', outputs]] as const) {
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
