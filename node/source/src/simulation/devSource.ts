import { ITEM_NAMES, isFluidItem } from '../content/items';
import { isCartKind } from '../content/cartUpgrades';
import { getNodeCapabilities, needsRecipeSelection } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { expandPortFamily } from './connectionRules';
import { outstandingResearchCores } from './researchStatus';
import type { SimulationLookups } from './simulationLookups';

type Wiring = Pick<SectorState, 'nodes' | 'connections'>;
const RESOURCE_ITEMS: ItemId[] = ['iron', 'copper', 'stone', 'wood', 'mythril', 'water'];

/** Resolve one semantic input, looking through generic logistics only when needed. */
export function devInputItems(target: MachineNode, port: number, wiring: Wiring, state?: GameState, seen = new Set<string>()): ItemId[] {
  const key = `${target.id}:${port}`;
  if (seen.has(key) || needsRecipeSelection(target)) return [];
  const family = getEffectiveNodeInputFamilies(target, state?.research.completed ?? [])[port];
  if (!family) return [];
  if (family in ITEM_NAMES) return [family as ItemId];
  if (family === 'POWER') return ['power'];
  if (getNodeCapabilities(target.kind).behavior === 'research') return state ? outstandingResearchCores(state.research) : [];
  if (family === 'ATTACK_POWER') return ['command-suppression-bot'];
  const allowed = expandPortFamily(family).filter(item => !isCartKind(target.kind) || !isFluidItem(item));
  if (target.filterItem && allowed.includes(target.filterItem)) return [target.filterItem];
  const capabilities = getNodeCapabilities(target.kind);
  const path = new Set(seen).add(key);
  if (target.kind === 'extractor' || capabilities.passThrough || ['buffer', 'storage'].includes(capabilities.behavior) || target.kind === 'warehouse' || target.kind === 'fluidStorage' || capabilities.behavior === 'road') {
    const downstream = wiring.connections.filter(edge => edge.from === target.id).flatMap(edge => {
      const destination = wiring.nodes.find(node => node.id === edge.to);
      return destination ? devInputItems(destination, edge.toPort ?? 0, wiring, state, path) : [];
    });
    const choices = [...new Set(downstream)].filter(item => target.kind === 'extractor' ? RESOURCE_ITEMS.includes(item) : allowed.includes(item));
    if (choices.length) return choices;
  }
  // An untyped buffer has no required recipe: retain its material, otherwise use Iron.
  const stored = (Object.keys({ ...target.input, ...target.output }) as ItemId[]).find(item => allowed.includes(item) && (target.input[item] ?? 0) + (target.output[item] ?? 0) > 0);
  return [stored ?? (allowed.includes('iron') ? 'iron' : allowed[0])].filter((item): item is ItemId => Boolean(item));
}

/** An Extractor still mines on its ordinary cycle, from a virtual infinite reserve. */
export function devExtractorMaterial(extractor: MachineNode, wiring: Wiring, state?: GameState): ItemId {
  return devInputItems(extractor, 0, wiring, state).find(item => RESOURCE_ITEMS.includes(item)) ?? 'iron';
}

export function supplyDevInputs(state: GameState, sector: SectorState, lookups: SimulationLookups, capacity: (target: MachineNode, item: ItemId) => number) {
  const supplies: Array<{ connectionId: string; from: string; to: string; item: ItemId }> = [];
  if (!sector.nodes.some(node => node.kind === 'devSource')) return supplies;
  const index = lookups.sector(sector);
  for (const edge of index.connections.values()) {
    const source = index.nodes.get(edge.from), target = index.nodes.get(edge.to);
    if (source?.kind !== 'devSource' || source.disabled || !target || target.disabled) continue;
    if (target.kind === 'extractor' || target.kind === 'lakeIntake') continue;
    const items = devInputItems(target, edge.toPort ?? 0, sector, state);
    const perItem = Boolean(getNodeCapabilities(target.kind).perItemInputCapacity || target.recipeId);
    const pending = lookups.target(sector.id, target.id);
    let supplied: ItemId | undefined;
    // Fill balanced shared buffers; research and production have separate item limits.
    while (items.length) {
      const item = items.filter(item => {
        const occupied = perItem ? target.input[item] ?? 0 : Object.values(target.input).reduce((n, q) => n + (q ?? 0), 0);
        const reserved = pending?.transfers.filter(transfer => !transfer.cosmeticOnly && (!perItem || transfer.item === item)).length ?? 0;
        const limit = Math.max(capacity(target, item), RECIPES[target.recipeId ?? '']?.inputs[item] ?? 0);
        return occupied + reserved < limit;
      }).sort((a, b) => (target.input[a] ?? 0) - (target.input[b] ?? 0))[0];
      if (!item) break;
      target.input[item] = (target.input[item] ?? 0) + 1;
      supplied = item;
    }
    if (supplied) {
      edge.item = supplied;
      supplies.push({ connectionId: edge.id, from: source.id, to: target.id, item: supplied });
    }
  }
  return supplies;
}
