import type { Connection, DeferredPowerInfrastructure, GameState, MachineNode } from '../domain/types';
import { RECIPES } from './recipes';
import { DEFERRED_POWER_NODES, DEFERRED_POWER_RESEARCH } from './deferredPower';
import { RETIRED_RESEARCH } from './retiredResearch';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from './researchTiming';

/** Retain old factories and templates while removing the dedicated machine kind. */
export function migrateRetiredNodes(state: GameState) {
  const groups = [
    ...Object.values(state.sectors).map(sector => sector.nodes),
    ...(state.factoryTemplates ?? []).map(template => template.nodes),
  ];
  for (const nodes of groups) for (const node of nodes) {
    if (node.kind === 'researchCenter' || node.kind === 'research-center') node.cycleMs = RESEARCH_CENTER_BASE_CYCLE_MS;
    if ((node.kind as string) !== 'automataCoreAssembler') continue;
    node.kind = 'assembler';
    if (node.name === 'Automata Core Assembler') node.name = 'Assembler';
    node.recipeId = 'automata-core';
    node.cycleMs = RECIPES['automata-core'].cycleMs;
  }
  for (const graph of [...Object.values(state.sectors), ...(state.factoryTemplates ?? [])]) retirePowerGraph(graph);
  for (const sector of Object.values(state.sectors)) {
    const retired = new Set(sector.deferredPower?.nodes.map(node => node.id));
    const removedEdges = new Set(sector.deferredPower?.connections.map(edge => edge.id));
    const transfers = state.inFlightTransfers?.filter(transfer => transfer.sectorId === sector.id && (
      transfer.item === 'power' || retired.has(transfer.from) || retired.has(transfer.to)
      || removedEdges.has(transfer.connectionId) || transfer.routeConnectionIds?.some(id => removedEdges.has(id))
    )) ?? [];
    if (!transfers.length) continue;
    ((sector.deferredPower ??= { nodes: [], connections: [] }).transfers ??= []).push(...transfers);
    const ids = new Set(transfers.map(transfer => transfer.id));
    state.inFlightTransfers = state.inFlightTransfers?.filter(transfer => !ids.has(transfer.id));
  }
  if (state.research.selected && (DEFERRED_POWER_RESEARCH.has(state.research.selected) || RETIRED_RESEARCH.has(state.research.selected))) {
    (state.research.projectContributions ??= {})[state.research.selected] = { ...state.research.contributed };
    delete state.research.selected;
    state.research.contributed = {};
  }
}

/** Archive obsolete equipment, wiring and energy instead of destroying saved factories. */
function retirePowerGraph(graph: { nodes: MachineNode[]; connections: Connection[]; deferredPower?: DeferredPowerInfrastructure }) {
  const retired = new Set(graph.nodes.filter(node => DEFERRED_POWER_NODES.has(node.kind)).map(node => node.id));
  const powerSources = new Set([...retired, ...graph.nodes.filter(node => (node.output.power ?? 0) > 0).map(node => node.id)]);
  const joints = new Set(graph.nodes.filter(node => node.kind === 'joint').map(node => node.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graph.connections) if (powerSources.has(edge.from) && joints.has(edge.to) && !powerSources.has(edge.to)) {
      powerSources.add(edge.to); changed = true;
    }
  }
  const edges = graph.connections.filter(edge => retired.has(edge.from) || retired.has(edge.to) || powerSources.has(edge.from));
  const powered = graph.nodes.filter(node => !retired.has(node.id) && ('power' in node.input || 'power' in node.output));
  if (!retired.size && !edges.length && !powered.length) return;
  const archive = graph.deferredPower ??= { nodes: [], connections: [] };
  archive.nodes.push(...graph.nodes.filter(node => retired.has(node.id)));
  archive.connections.push(...edges);
  for (const node of powered) {
    (archive.buffers ??= {})[node.id] = { input: node.input.power ?? 0, output: node.output.power ?? 0 };
    delete node.input.power; delete node.output.power;
  }
  const removed = new Set(edges.map(edge => edge.id));
  graph.nodes = graph.nodes.filter(node => !retired.has(node.id));
  graph.connections = graph.connections.filter(edge => !removed.has(edge.id));
}
