import type { GameState, NodeKind } from '../domain/types';
import { type TutorialStage, EXPANSION_HOME, EXPANSION_OUTPOST, expansionDelivered, CONTROL_GROUP_NODE_IDS } from './tutorialDefinitions';

export interface ControlGroupLessonContext {
  selectedIds: string[];
  selectionInfo?: { source: 'node' | 'box'; individual?: boolean; priority?: boolean; forward?: boolean };
  moveOrigins?: Record<string, { x: number; y: number }>;
}
export function lessonSatisfied(stage: TutorialStage, state: GameState, panel: string | null, placing?: NodeKind, control?: ControlGroupLessonContext) {
  const sector = state.sectors[state.activeSectorId];
  const nodes = sector.nodes;
  const has = (kind: NodeKind) => nodes.some(n => n.kind === kind);
  const link = (from: string, to: string) => sector.connections.some(c => c.from === from && c.to === to);
  const extractor = nodes.find(n => n.kind === 'extractor');
  const chest = nodes.find(n => n.kind === 'woodenChest');
  switch (stage) {
    case 'control-group-select': return CONTROL_GROUP_NODE_IDS.every(id => control?.selectedIds.includes(id));
    case 'control-group-create': return sector.controlGroups?.some(group => CONTROL_GROUP_NODE_IDS.every(id => group.nodeIds.includes(id))) ?? false;
    case 'control-group-click': return control?.selectionInfo?.source === 'node' && !control.selectionInfo.individual && CONTROL_GROUP_NODE_IDS.every(id => control.selectedIds.includes(id));
    case 'control-group-double-click': return Boolean(control?.selectionInfo?.individual && control.selectedIds.length === 1 && control.selectedIds[0] === CONTROL_GROUP_NODE_IDS[0]);
    case 'control-group-move': {
      const origins = control?.moveOrigins;
      const members = CONTROL_GROUP_NODE_IDS.map(id => nodes.find(node => node.id === id));
      if (!origins || members.some(node => !node || !origins[node.id])) return false;
      const first = members[0]!; const dx = first.x - origins[first.id].x; const dy = first.y - origins[first.id].y;
      return Math.hypot(dx, dy) > 30 && members.every(node => Math.abs(node!.x - origins[node!.id].x - dx) < .01 && Math.abs(node!.y - origins[node!.id].y - dy) < .01);
    }
    case 'control-group-select-forward': return Boolean(control?.selectionInfo?.source === 'box' && control.selectionInfo.forward && CONTROL_GROUP_NODE_IDS.every(id => control.selectedIds.includes(id)));
    case 'control-group-select-reverse': return Boolean(control?.selectionInfo?.source === 'box' && control.selectionInfo.priority && control.selectedIds.length === 1 && control.selectedIds[0] === CONTROL_GROUP_NODE_IDS[0]);
    case 'control-group-disband': return !sector.controlGroups?.some(group => group.nodeIds.some(id => CONTROL_GROUP_NODE_IDS.includes(id)));
    case 'expansion-map-open': return panel === 'map';
    case 'expansion-activate': return Boolean(state.sectors[EXPANSION_OUTPOST]?.unlocked);
    case 'expansion-travel':
    case 'expansion-outpost': return state.activeSectorId === EXPANSION_OUTPOST;
    case 'expansion-return':
    case 'expansion-home-receive': return state.activeSectorId === EXPANSION_HOME;
    case 'expansion-road-place': return state.activeSectorId === EXPANSION_OUTPOST && nodes.some(node => node.kind === 'road' && node.roadMode === 'export' && node.pairedSectorId === EXPANSION_HOME);
    case 'expansion-road-feed': return state.sectors[EXPANSION_OUTPOST]?.connections.some(connection => connection.from === 'expansion-outpost-chest' && state.sectors[EXPANSION_OUTPOST].nodes.some(node => node.id === connection.to && node.kind === 'road' && node.roadMode === 'export' && node.pairedSectorId === EXPANSION_HOME)) ?? false;
    case 'expansion-deliver': return state.activeSectorId === EXPANSION_HOME && expansionDelivered(state);
    case 'build-open': return panel === 'build';
    case 'build-explain': return placing === 'extractor';
    case 'build-place': return has('extractor');
    case 'connect-resource': return !!extractor && link('tutorial-forest', extractor.id);
    case 'chest-shortcut': return placing === 'woodenChest';
    case 'chest-place': return has('woodenChest');
    case 'store-item': return !!chest && (chest.output.wood ?? 0) + (chest.input.wood ?? 0) > 0;
    case 'research-open': return panel === 'research';
    case 'make-charcoal': return (state.produced?.charcoal ?? 0) > 0;
    case 'mine-copper': return (state.extracted?.copper ?? 0) > 0;
    case 'make-plates': return (state.produced?.['copper-plate'] ?? 0) > 0;
    case 'make-gears': return (state.produced?.['copper-gear'] ?? 0) > 0;
    case 'make-core': return (state.produced?.['simple-core'] ?? 0) > 0;
    case 'build-lab': return has('researchCenter');
    case 'deliver-core': return nodes.some(n => n.kind === 'researchCenter' && (n.input['simple-core'] ?? 0) > 0);
    case 'cores-open': return state.research.selected === 'assembler' || state.research.completed.includes('assembler');
    case 'cores-explain': return state.research.completed.includes('assembler');
    case 'options-open': return panel === 'options';
    case 'logistics-joint-connect': return link('tutorial-forest', 'tutorial-joint') && link('tutorial-joint', 'tutorial-extractor-a');
    case 'logistics-joint-move': return nodes.some(n => n.id === 'tutorial-joint' && Math.hypot(n.x - 680, n.y - 650) < 100);
    case 'logistics-joint-insert': return link('tutorial-forest', 'tutorial-joint') && link('tutorial-joint', 'tutorial-extractor-a');
    case 'logistics-splitter-insert': return link('tutorial-extractor-a', 'tutorial-splitter') && link('tutorial-splitter', 'tutorial-kiln-a');
    case 'logistics-merger-insert': return link('tutorial-extractor-a', 'tutorial-merger') && link('tutorial-merger', 'tutorial-kiln-a');
    case 'logistics-splitter-rotate': return nodes.some(node => node.id === 'tutorial-splitter' && node.rotation % 360 !== 0);
    case 'logistics-merger-rotate': return nodes.some(node => node.id === 'tutorial-merger' && node.rotation % 360 !== 0);
    case 'logistics-splitter-connect': return link('tutorial-extractor-a', 'tutorial-splitter') && link('tutorial-splitter', 'tutorial-kiln-a') && link('tutorial-splitter', 'tutorial-kiln-b') && new Set(sector.connections.filter(c => c.from === 'tutorial-splitter').map(c => c.fromPort)).size === 2;
    case 'logistics-merger-connect': return link('tutorial-extractor-a', 'tutorial-merger') && link('tutorial-extractor-b', 'tutorial-merger') && link('tutorial-merger', 'tutorial-kiln-a');
    case 'monster-camp-suppression': return nodes.some(n => n.id === 'tutorial-camp' && n.suppressed);
    default: return false;
  }
}

export const MANUAL_STAGES = new Set<TutorialStage>(['logistics-splitter-inserted', 'logistics-merger-inserted', 'options-open', 'control-group-created', 'control-group-click-complete', 'control-group-double-click-complete', 'control-group-moved', 'control-group-forward-complete', 'control-group-reverse-complete', 'control-group-complete', 'research-explain', 'cores-complete', 'shortcuts', 'options-explain', 'logistics-joint-complete', 'logistics-splitter-complete', 'logistics-merger-complete', 'monster-camp-boundary', 'monster-camp-growth', 'expansion-intro', 'expansion-complete']);
