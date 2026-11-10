import { getResearchProject } from '../content/research';
import { isCartKind } from '../content/cartUpgrades';
import type { GameState, SectorState } from '../domain/types';
import { type GuidedTutorialKind, type GuidedTutorialStage } from './originalTutorials';

export type TutorialKind = GuidedTutorialKind | 'expansion';
export type ExpansionStage = 'expansion-intro' | 'expansion-map-open' | 'expansion-activate' | 'expansion-travel' | 'expansion-return' | 'expansion-outpost' | 'expansion-road-place' | 'expansion-road-feed' | 'expansion-home-receive' | 'expansion-deliver' | 'expansion-complete';
export type TutorialStage = GuidedTutorialStage | ExpansionStage | 'make-charcoal' | 'mine-copper' | 'make-plates' | 'make-gears' | 'make-core' | 'build-lab' | 'deliver-core' | 'logistics-splitter-rotate' | 'logistics-merger-rotate';
export const EXPANSION_STAGES: TutorialStage[] = ['expansion-intro', 'expansion-map-open', 'expansion-activate', 'expansion-travel', 'expansion-return', 'expansion-outpost', 'expansion-road-place', 'expansion-road-feed', 'expansion-home-receive', 'expansion-deliver', 'expansion-complete'];
export const EXPANSION_HOME = '5,5';
export const EXPANSION_OUTPOST = '4,5';

export function expansionCable(sector: SectorState, sending: boolean) {
  if (sector.id !== (sending ? EXPANSION_OUTPOST : EXPANSION_HOME)) return;
  const vehicleId = sending ? 'expansion-outpost-chest' : 'expansion-home-chest';
  const vehicle = sector.nodes.find(node => node.id === vehicleId && isCartKind(node.kind));
  const road = sector.nodes.find(node => node.kind === 'road' && node.roadMode === (sending ? 'export' : 'import') && node.pairedSectorId === (sending ? EXPANSION_HOME : EXPANSION_OUTPOST));
  if (!vehicle || !road) return;
  const [from, to] = sending ? [vehicle, road] : [road, vehicle];
  const connected = sector.connections.some(cable => cable.from === from.id && cable.to === to.id && (cable.fromPort ?? 0) === 0 && (cable.toPort ?? 0) === 0);
  return { from, to, connected };
}

export function expansionDelivered(state: GameState) {
  const home = state.sectors[EXPANSION_HOME], outpost = state.sectors[EXPANSION_OUTPOST];
  const receiving = home && expansionCable(home, false), sending = outpost && expansionCable(outpost, true);
  return Boolean(receiving?.connected && sending?.connected && (receiving.to.input.wood ?? 0) + (receiving.to.output.wood ?? 0) > 0);
}
export const PRODUCTION_TARGETS = { kiln: { x: 1350, y: 340 }, copperExtractor: { x: 650, y: 740 }, smelter: { x: 1350, y: 740 }, gearRefiner: { x: 1010, y: 1040 }, coreRefiner: { x: 1370, y: 1040 }, researchCenter: { x: 1730, y: 1040 } };
export const BASIC_STAGES: TutorialStage[] = ['build-open', 'build-explain', 'build-place', 'connect-resource', 'chest-shortcut', 'chest-place', 'store-item', 'research-open', 'research-explain', 'make-charcoal', 'mine-copper', 'make-plates', 'make-gears', 'make-core', 'build-lab', 'deliver-core', 'cores-open', 'cores-explain', 'cores-complete', 'shortcuts', 'options-open', 'options-explain'];
export const LOGISTICS_STAGES: TutorialStage[] = ['logistics-joint-connect', 'logistics-joint-move', 'logistics-joint-insert', 'logistics-joint-complete', 'logistics-splitter-connect', 'logistics-splitter-rotate', 'logistics-splitter-complete', 'logistics-splitter-insert', 'logistics-splitter-inserted', 'logistics-merger-connect', 'logistics-merger-rotate', 'logistics-merger-complete', 'logistics-merger-insert', 'logistics-merger-inserted'];
export const CAMP_STAGES: GuidedTutorialStage[] = ['monster-camp-boundary', 'monster-camp-suppression', 'monster-camp-growth'];
export const CONTROL_GROUP_STAGES: GuidedTutorialStage[] = ['control-group-select', 'control-group-create', 'control-group-click', 'control-group-move', 'control-group-double-click', 'control-group-select-forward', 'control-group-select-reverse', 'control-group-disband', 'control-group-complete'];
export const CONTROL_GROUP_NODE_IDS = ['control-group-alpha', 'control-group-beta', 'control-group-gamma'];
export const tutorialStages = (kind: TutorialKind): TutorialStage[] => kind === 'basic' ? BASIC_STAGES : kind === 'logistics' ? LOGISTICS_STAGES : kind === 'expansion' ? EXPANSION_STAGES : kind === 'control-groups' ? CONTROL_GROUP_STAGES : CAMP_STAGES;
export const TUTORIAL_NAMES: Record<TutorialKind, string> = { basic: 'Basics', logistics: 'Logistics', expansion: 'Expansion', 'control-groups': 'Control Groups', 'monster-camps': 'Monster Camps' };
export const TARGETS = { extractor: { x: 650, y: 340 }, woodenChest: { x: 1010, y: 340 } };
export const TUTORIAL_CORE_COST = getResearchProject('assembler')!.costs['simple-core']!;
