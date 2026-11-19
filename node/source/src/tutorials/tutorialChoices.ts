import type { GameState, MachineNode, NodeKind } from '../domain/types';
import { basicTutorialPlacementKind, basicTutorialRefinerRecipe, CONTROL_GROUP_NODE_IDS, EXPANSION_HOME, EXPANSION_OUTPOST, type TutorialKind, type TutorialStage } from './tutorialRuntime';

/** undefined permits normal play; null disables choices when the lesson needs none. */
export type TutorialChoice = string | null | undefined;
export const permitsTutorialChoice = (allowed: TutorialChoice, choice: string) => allowed === undefined || allowed === choice;
const mapSteps: TutorialStage[] = ['expansion-map-open', 'expansion-activate', 'expansion-travel', 'expansion-return', 'expansion-outpost', 'expansion-home-receive'];

export function tutorialChoices(kind: TutorialKind, stage: TutorialStage, game: GameState) {
  const nodes = game.sectors[game.activeSectorId].nodes;
  const buildKind: NodeKind | undefined = kind === 'basic' ? basicTutorialPlacementKind(stage, nodes)
    : kind === 'expansion' && stage === 'expansion-road-place' && !nodes.some(node => node.kind === 'road' && node.roadMode === 'export') ? 'road' : undefined;
  const researchProjectId = kind === 'basic' && ['research-open', 'research-explain'].includes(stage) ? 'joint'
    : kind === 'basic' && ['cores-open', 'cores-explain'].includes(stage) ? 'assembler' : null;
  const sectorId = kind !== 'expansion' ? null
    : ['expansion-map-open', 'expansion-activate', 'expansion-travel', 'expansion-outpost', 'expansion-road-place', 'expansion-road-feed'].includes(stage) ? EXPANSION_OUTPOST : EXPANSION_HOME;
  const panel = buildKind || stage === 'build-open' ? 'build'
    : researchProjectId && stage !== 'cores-explain' ? 'research'
    : mapSteps.includes(stage) ? 'map'
    : stage === 'options-open' || stage === 'options-explain' ? 'options' : undefined;
  const recipeKind = stage === 'make-plates' ? 'smelter' : stage === 'make-gears' || stage === 'make-core' ? 'refiner' : undefined;
  const rotationKind = stage === 'logistics-splitter-rotate' ? 'splitter' : stage === 'logistics-merger-rotate' ? 'merger' : undefined;
  return { buildKind, panel, recipeKind, rotationKind, researchProjectId, sectorId,
    selectableNodeId: ['control-group-double-click', 'control-group-select-forward', 'control-group-select-reverse'].includes(stage) ? CONTROL_GROUP_NODE_IDS[0] : undefined };
}

export function tutorialRecipeChoice(kind: TutorialKind, node: MachineNode, nodes: MachineNode[]): TutorialChoice {
  if (kind === 'basic' && node.kind === 'smelter') return 'smelt-copper';
  return (kind === 'basic' ? basicTutorialRefinerRecipe(node, nodes) : undefined) ?? node.recipeId ?? null;
}
