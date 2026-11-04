import type { GameState, ItemId } from '../domain/types';
import { getDwarvenSettlement, getLizardSettlementForMapTier } from '../content/lizardSettlements';
import { getGolemMineral } from '../content/resourceGolems';
import { RECIPES, RETIRED_RECIPES } from '../content/recipes';
import { WASTE_ITEMS } from '../content/progression';
import { reconcileQueue } from './mixedOutput';
import { getNodeCapabilities } from '../content/nodeCapabilities';

/** Development migration: keep owned stock, paid batches and historical unlocks. */
export function migrateReviewedProduction(state: GameState) {
  if (!state.reviewedProductionVersion && !state.research.completed.includes('mithrilTools')) {
    const bags = [state.produced, state.extracted, state.globalPool, ...Object.values(state.sectors).flatMap(sector => sector.nodes.flatMap(node => [node.input, node.output]))];
    if (bags.some(bag => Object.entries(bag ?? {}).some(([item, count]) => /mythril|mithril/.test(item) && (count ?? 0) > 0))) {
      state.research.completed.push('mithrilTools');
      if (!state.research.unlocked.includes('mithrilTools')) state.research.unlocked.push('mithrilTools');
    }
  }
  for (const sector of Object.values(state.sectors)) {
    const retired = new Set(sector.nodes.filter(node => (node.kind === 'mythril' || node.resourceItem === 'mythril' && node.kind === 'deposit') && !node.infiniteResource).map(node => node.id));
    if (retired.size) {
      const archive = sector.retiredMythril ??= { nodes: [], connections: [] };
      const edges = sector.connections.filter(edge => retired.has(edge.from) || retired.has(edge.to));
      const edgeIds = new Set(edges.map(edge => edge.id));
      archive.nodes.push(...sector.nodes.filter(node => retired.has(node.id)));
      archive.connections.push(...edges);
      const cargo = (state.inFlightTransfers ?? []).filter(t => t.sectorId === sector.id && (retired.has(t.from) || retired.has(t.to) || (t.routeConnectionIds ?? [t.connectionId]).some(id => edgeIds.has(id))));
      (archive.transfers ??= []).push(...cargo);
      const cargoIds = new Set(cargo.map(t => t.id));
      state.inFlightTransfers = state.inFlightTransfers?.filter(t => !cargoIds.has(t.id));
      sector.nodes = sector.nodes.filter(node => !retired.has(node.id));
      sector.connections = sector.connections.filter(edge => !edgeIds.has(edge.id));
    }
    for (const node of sector.nodes) {
      if (node.lizardSettlement && node.kind === 'monster-camp') {
        const tier = Math.abs(sector.x - 5) + Math.abs(sector.y - 5);
        // Fixture/legacy home placements can still recover their old difficulty.
        const oldTier = ({ 24: 4, 40: 5, 60: 6, 80: 7, 120: 8, 160: 9 } as Record<number, number>)[node.attackRequirement ?? 0];
        const newTier = [4,5,6,7,8,9].find(t => getLizardSettlementForMapTier(t).attackRequirement === node.attackRequirement);
        node.settlementMapTier ??= tier >= 4 ? tier : oldTier ?? newTier ?? getDwarvenSettlement(node).mapTier;
        const spec = getDwarvenSettlement(node);
        node.attackRequirement = spec.attackRequirement;
        node.tributeItem = 'mythril';
        node.suppressionCredit ??= 0;
      }
      if (node.kind === 'miningDrill' && node.miningTarget === 'mythril') node.miningTarget = 'iron';
      if (node.kind === 'resourceGolem' && !node.golemCostVersion) {
        if (getGolemMineral(node) === 'mythril') node.health = 10000 + (node.health ?? 10000);
        node.golemCostVersion = 1;
      }
      if (node.recipeId && RETIRED_RECIPES.has(node.recipeId) && !node.batch) { delete node.recipeId; node.progressMs = 0; }
      const recipe = node.recipeId && RECIPES[node.recipeId];
      if (node.outputQueue || getNodeCapabilities(node.kind).behavior === 'buffer' || recipe && Object.keys(recipe.outputs).some(item => WASTE_ITEMS.includes(item as ItemId))) node.outputQueue = reconcileQueue(node.outputQueue, node.output);
      if (node.kind === 'goblinTribute') {
        const camp = sector.nodes.find(camp => camp.id === node.tributeCampId);
        if (camp?.lizardSettlement) { node.settlementMapTier = camp.settlementMapTier; node.capacity = getDwarvenSettlement(camp).capacity; }
      }
    }
    // All former dedicated waste ports now share socket zero. Preserve their wiring.
    for (const edge of sector.connections) {
      const node = sector.nodes.find(node => node.id === edge.from);
      if (node?.recipeId && RECIPES[node.recipeId] && (edge.fromPort ?? 0) > 0 && (node.outputQueue || Object.keys(RECIPES[node.recipeId].outputs).some(item => WASTE_ITEMS.includes(item as ItemId)))) edge.fromPort = 0;
    }
  }
  state.reviewedProductionVersion = 1;
}
