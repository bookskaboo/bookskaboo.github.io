import type { GameState, MachineNode, NodeKind, SectorState } from '../domain/types';
import { NODE_DEFINITIONS, isNodeUnlocked } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior } from '../content/nodeCapabilities';
import { RECIPES } from '../content/recipes';
import { DEFERRED_POWER_NODES } from '../content/deferredPower';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';
import { isCartKind, cartUpgrade } from '../content/cartUpgrades';
import { endgameRank } from '../content/endgame';
import { BASE_MOD_CONTENT } from '../mods/modContent';
import { modNode, modNodeTemplate, modRule } from '../mods/modRules';
import { getNodeSize } from '../domain/nodeGeometry';
import { borderCrossingFailure } from '../domain/borderObstructionLayout';
import { getWorldFieldSize, sectorId } from './worldGeneration';
import { pairedRoadPositions } from './roadPlacement';
import { placementLimit, roadChannels } from './progression';
import { canPlaceNode } from './collisions';

const clone = <T,>(value: T): T => structuredClone(value);
export interface RoadPlacementTarget {
  sector: SectorState;
  endpoint: MachineNode;
  localFacing: NonNullable<MachineNode['roadFacing']>;
}

/** Plans are used immediately by the engine; previews never mutate factory state. */
export class NodePlacementPlanner {
  constructor(private readonly getState: () => GameState, private readonly getSector: () => SectorState,
    private readonly makeId: (prefix: string) => string) {}
  private get state() { return this.getState(); }

  planNodePlacement(kind: NodeKind, x: number, y: number, preview = false) {
    const def = NODE_DEFINITIONS[kind];
    if (kind === 'fluidRoad' || DEFERRED_POWER_NODES.has(kind)) return;
    if (!def || (def.hidden && !def.legacyAlias && kind !== 'devSource')) return;
    if (modNode(kind)?.template && !isNodeUnlocked(kind, this.state.research.unlocked) && !preview) return;
    const lockedStorage = (def.category === 'Storage' || isCartKind(kind)) && !isNodeUnlocked(kind, this.state.research.unlocked);
    const lockedBotPlant = kind === 'botPlant' && !isNodeUnlocked(kind, this.state.research.unlocked);
    if ((lockedStorage || lockedBotPlant) && !preview) return;
    const capabilities = getNodeCapabilities(kind);
    if(capabilities.globallyUnique&&this.state.activeSectorId!=='5,5')return;
    if((kind==='storage'||kind==='inventory')&&Object.values(this.state.sectors).flatMap(s=>s.nodes).filter(n=>n.kind===kind).length>=placementLimit(this.state,kind))return;
    const uniqueNodeBlocked = capabilities.globallyUnique && Object.values(this.state.sectors).some((sector) => sector.nodes.some((node) => getNodeCapabilities(node.kind).globallyUnique));
    if (uniqueNodeBlocked && !preview) return;
    const roadPair = capabilities.pairedSectorPlacement ? this.findRoadPair(x, y) : undefined;
    const crossingRequirement = roadPair ? borderCrossingFailure(this.state, this.getSector().id, roadPair.sector.id) : undefined;
    const faceRoads = (sector: SectorState, neighbor: string) => sector.nodes.filter(n => hasNodeBehavior(n.kind, 'road') && n.pairedSectorId === neighbor).length;
    const channelsFull = Boolean(roadPair && (faceRoads(this.getSector(), roadPair.sector.id) >= roadChannels(this.state) || faceRoads(roadPair.sector, this.getSector().id) >= roadChannels(this.state)));
    if (capabilities.pairedSectorPlacement && !roadPair && !preview) return;
    // The original configurable machines are inert until the player chooses a recipe.
    const configuredRecipes = modNode(kind)?.recipeIds;
    const defaultRecipe = capabilities.defaultRecipeId;
    const recipeId = defaultRecipe && (!configuredRecipes || configuredRecipes.includes(defaultRecipe)) ? defaultRecipe : undefined;
    const node: MachineNode = {
      id: preview ? '__placement-preview__' : this.makeId(kind), kind, name: def.name, x, y, rotation: 0, recipeId, input: {}, output: {}, progressMs: 0,
      cycleMs: recipeId ? RECIPES[recipeId].cycleMs : capabilities.behavior === 'research' ? RESEARCH_CENTER_BASE_CYCLE_MS : kind === 'extractor' ? 5000 : capabilities.behavior === 'planter' ? 250 : capabilities.behavior === 'recipe' ? 0 : 1000, constructedAt: Date.now(), constructionMs: kind === 'devSource' ? 0 : 1500,
      capacity: BASE_MOD_CONTENT.capabilities[modNodeTemplate(kind)].defaultCapacity,
      ...(modNode(kind)?.name ? { modBaseName: BASE_MOD_CONTENT.nodes[modNodeTemplate(kind)].name } : {}),
      ...(capabilities.defaultFilterItem ? { filterItem: capabilities.defaultFilterItem } : {}),
      ...(capabilities.defaultMiningTarget ? { miningTarget: capabilities.defaultMiningTarget, miningProgress: 0 } : {}),
    };
    if (isCartKind(kind)) Object.assign(node, cartUpgrade(this.state.research.completed,endgameRank(this.state,'trainFreightCapacity')));
    node.constructionMs = modNode(kind)?.constructionMs ?? node.constructionMs * modRule('constructionMultiplier');
    if (modNode(kind)?.name) node.name = modNode(kind)!.name!;
    let pairedNode: MachineNode | undefined;
    if (roadPair) {
      Object.assign(node, roadPair.local, { roadMode: 'export', pairedSectorId: roadPair.sector.id });
      const pair: MachineNode = { ...clone(node), ...roadPair.remote, id: preview ? '__placement-preview-pair__' : this.makeId('road'), roadMode: 'import', pairedSectorId: this.getSector().id, input: {}, output: {}, progressMs: 0 };
      node.pairedRoadId = pair.id; pair.pairedRoadId = node.id; pairedNode = pair;
    }
    const field = getWorldFieldSize(this.state);
    const localClear = canPlaceNode(node, this.getSector().nodes, field);
    const pairClear = !(pairedNode && roadPair && !canPlaceNode(pairedNode, roadPair.sector.nodes, field));
    const error = lockedBotPlant ? 'Complete Suppression Bot research to build a Bot Plant.'
      : lockedStorage ? ['woodenChest', 'chest'].includes(kind) ? 'Complete Road research to build a Cart.' : 'Research this storage node before building it.' : uniqueNodeBlocked ? 'This unique node already exists.'
      : capabilities.pairedSectorPlacement && !roadPair ? 'Unlock an adjacent map before placing a road to it.'
      : crossingRequirement ? crossingRequirement
      : channelsFull ? `This boundary allows ${roadChannels(this.state)} Roads per map face, counting sending and receiving endpoints together. Use another face or remove a Road${roadChannels(this.state) < 3 ? ', or research Road Channels' : ''}.`
      : !localClear ? `The endpoint on map ${this.getSector().id} needs clearance from the field boundary, other nodes and obstructions. Choose another position.`
      : !pairClear ? `The paired endpoint on adjacent map ${roadPair!.sector.id} is blocked. Move this road along the boundary, or clear room on that map.` : undefined;
    return { node, pairedNode, roadPair, valid: !error, error, crossingRequirement };
  }

  getNodePlacementPreview(kind: NodeKind, x: number, y: number) {
    const plan = this.planNodePlacement(kind, x, y, true);
    if (!plan) return;
    const { node, pairedNode, roadPair, valid } = plan;
    const road: RoadPlacementTarget | undefined = roadPair && pairedNode && Math.abs(roadPair.score) <= getNodeSize(node).w
      ? { sector: roadPair.sector, endpoint: pairedNode, localFacing: roadPair.side }
      : undefined;
    return { node, valid, road, crossingRequirement: plan.crossingRequirement };
  }

  getNodePlacementError(kind: NodeKind, x: number, y: number) {
    return this.planNodePlacement(kind, x, y, true)?.error ?? 'Choose an unlocked node and a clear location on this map.';
  }

  private findRoadPair(x: number, y: number) {
    const current = this.getSector();
    const field = getWorldFieldSize(this.state);
    const candidates = [
      { score: x, x: current.x - 1, y: current.y, side: 'east' as const },
      { score: field.width - x, x: current.x + 1, y: current.y, side: 'west' as const },
      { score: y, x: current.x, y: current.y - 1, side: 'south' as const },
      { score: field.height - y, x: current.x, y: current.y + 1, side: 'north' as const },
    ].sort((a, b) => a.score - b.score);
    const candidate = candidates[0];
    const sector = this.state.sectors[sectorId(candidate.x, candidate.y)];
    if (!sector?.unlocked) return;
    return { ...candidate, ...pairedRoadPositions({ x, y }, candidate.side, field), sector };
  }
}
