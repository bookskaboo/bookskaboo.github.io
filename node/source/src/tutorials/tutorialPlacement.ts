import type { GameState, MachineNode, NodeKind } from '../domain/types';
import { getConnectionControlPoints, getPortSide } from '../simulation/connectionRules';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { pairedRoadPositions } from '../simulation/roadPlacement';
import { getWorldFieldSize } from '../simulation/worldGeneration';
import { type TutorialStage, PRODUCTION_TARGETS, TARGETS } from './tutorialDefinitions';

export function productionTarget(stage: TutorialStage, nodes: MachineNode[]) {
  const refiners = nodes.filter(n => n.kind === 'refiner');
  const gear = refiners.find(n => n.recipeId?.endsWith('-gear')) ?? refiners[0];
  const core = refiners.find(n => n.recipeId === 'simple-core') ?? refiners[1];
  const rightOf = (node: MachineNode | undefined, fallback: { x: number; y: number }) => node ? { x: node.x + 360, y: node.y } : fallback;
  const choice = stage === 'make-charcoal' && !nodes.some(n => n.kind === 'kiln') ? { kind: 'kiln' as const, ...PRODUCTION_TARGETS.kiln }
    : stage === 'mine-copper' && nodes.filter(n => n.kind === 'extractor').length < 2 ? { kind: 'extractor' as const, ...PRODUCTION_TARGETS.copperExtractor }
    : stage === 'make-plates' && !nodes.some(n => n.kind === 'smelter') ? { kind: 'smelter' as const, ...PRODUCTION_TARGETS.smelter }
    : stage === 'make-gears' && refiners.length < 1 ? { kind: 'refiner' as const, ...PRODUCTION_TARGETS.gearRefiner }
    : stage === 'make-core' && refiners.length < 2 ? { kind: 'refiner' as const, ...rightOf(gear, PRODUCTION_TARGETS.coreRefiner) }
    : stage === 'build-lab' && !nodes.some(n => n.kind === 'researchCenter') ? { kind: 'researchCenter' as const, ...rightOf(core, PRODUCTION_TARGETS.researchCenter) } : undefined;
  return choice;
}
export interface TutorialPlacementTarget { kind: NodeKind; x: number; y: number; }
export function tutorialInsertionTarget(stage: TutorialStage, state: GameState) {
  if (!['logistics-joint-insert', 'logistics-splitter-insert', 'logistics-merger-insert'].includes(stage)) return;
  const sector = state.sectors[state.activeSectorId];
  const fromId = stage === 'logistics-joint-insert' ? 'tutorial-forest' : 'tutorial-extractor-a';
  const toId = stage === 'logistics-joint-insert' ? 'tutorial-extractor-a' : 'tutorial-kiln-a';
  const cable = sector.connections.find(cable => cable.from === fromId && cable.to === toId);
  const from = sector.nodes.find(node => node.id === fromId), to = sector.nodes.find(node => node.id === toId);
  if (!cable || !from || !to) return;
  const a = getPortAnchor(from, 'output', cable.fromPort ?? 0), b = getPortAnchor(to, 'input', cable.toPort ?? 0);
  const start = { x: from.x + a.x, y: from.y + a.y }, end = { x: to.x + b.x, y: to.y + b.y };
  const controls = getConnectionControlPoints(start, end, getPortSide(from, 'output', cable.fromPort ?? 0), getPortSide(to, 'input', cable.toPort ?? 0));
  return { x: (start.x + 3 * controls.first.x + 3 * controls.second.x + end.x) / 8,
    y: (start.y + 3 * controls.first.y + 3 * controls.second.y + end.y) / 8, w: 90, h: 90 };
}
export function basicTutorialRefinerRecipe(node: MachineNode, nodes: MachineNode[]): string | undefined {
  if (node.kind !== 'refiner') return undefined;
  const index = nodes.filter(candidate => candidate.kind === 'refiner').findIndex(candidate => candidate.id === node.id);
  return index === 0 ? 'copper-gear' : index === 1 ? 'simple-core' : undefined;
}
/** Basics only permits the next machine, and closes placement as soon as it exists. */
export function basicTutorialPlacementKind(stage: TutorialStage, nodes: MachineNode[]): NodeKind | undefined {
  if (stage === 'build-explain' || stage === 'build-place') return nodes.some(n => n.kind === 'extractor') ? undefined : 'extractor';
  if (stage === 'chest-shortcut' || stage === 'chest-place') return nodes.some(n => n.kind === 'woodenChest') ? undefined : 'woodenChest';
  return productionTarget(stage, nodes)?.kind;
}
/** The marker and corrected placement must use exactly the same lesson coordinates. */
export function tutorialPlacementTarget(stage: TutorialStage, state: GameState): TutorialPlacementTarget | undefined {
  if (stage === 'build-place') return { kind: 'extractor', ...TARGETS.extractor };
  if (stage === 'chest-place') return { kind: 'woodenChest', ...TARGETS.woodenChest };
  if (stage === 'expansion-road-place') {
    const field = getWorldFieldSize(state);
    const { x, y } = pairedRoadPositions({ x: field.width, y: 350 }, 'west', field).local;
    return { kind: 'road', x, y };
  }
  return productionTarget(stage, state.sectors[state.activeSectorId].nodes);
}
export function correctTutorialPlacement(kind: NodeKind, point: { x: number; y: number }, target?: TutorialPlacementTarget) {
  if (!target || target.kind !== kind) return { ...point, corrected: false };
  const size = getNodeSize({ kind } as MachineNode);
  // The marker has the same footprint as the intended node. Edge contact counts.
  const touchesMarker = Math.abs(point.x - target.x) <= size.w && Math.abs(point.y - target.y) <= size.h;
  if (touchesMarker) return { ...point, corrected: false };
  return { x: target.x, y: target.y, corrected: true };
}
