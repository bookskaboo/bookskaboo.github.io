export type CustomContentId = `mod-${string}`;

export type ItemId = CustomContentId
  | import('../content/botAssembly').MixedBotId | 'final-frame' | 'final-cannon'
  | 'alpha' | 'foundry-component' | 'reclamation-component' | 'grove-component' | 'core-half-a' | 'core-half-b' | 'final-core'
  | 'coolant' | 'conductive-slurry' | 'hydraulic-actuator' | 'ceramic-electrode' | 'hydro-core'
  | 'refined-mithril' | 'slag' | 'mithril-mesh' | 'shiny-core' | 'precision-controller'
  | 'metallic-fines' | 'glassy-crust' | 'advanced-actuator' | 'spent-flux' | 'logic-substrate'
  | 'command-core' | 'sealed-frame' | 'cooled-gun' | 'medium-suppression-bot' | 'mithril-frame'
  | 'focused-gun' | 'heavy-suppression-bot' | 'servo-frame' | 'pulse-cannon' | 'command-suppression-bot' | 'final-suppression-bot'
  | 'mineral-aggregate' | 'metal-residue'
  | 'wood' | 'iron' | 'copper' | 'mythril' | 'stone' | 'water'
  | 'brick' | 'charcoal' | 'iron-plate' | 'copper-plate' | 'mythril-plate'
  | 'iron-gear' | 'copper-gear' | 'mythril-gear' | 'iron-wire' | 'copper-wire' | 'mythril-wire'
  | 'motor' | 'circuit-a' | 'simple-core' | 'basic-core' | 'automata-core'
  | 'simple-robot-frame' | 'simple-robot-gun' | 'suppression-bot' | 'power' | 'forest-growth';

export type NodeKind = CustomContentId
  | 'cornerChallenge' | 'cornerTribute' | 'recycler'
  | 'devSource'
  | 'hydroProcessor' | 'advancedAssembler' | 'separationFurnace'
  | 'wasteHopper' | 'fluidStorage' | 'warehouse' | 'fluidLink'
  | 'powerConduit' | 'fluidRoad' | 'abandonedFabricator' | 'sortingStation' | 'resourceGolem'
  | 'forest' | 'deposit' | 'lake' | 'extractor' | 'kiln' | 'smelter' | 'refiner' | 'assembler' | 'botPlant'
  | 'splitter' | 'merger' | 'joint' | 'chest' | 'generator' | 'tree-planter' | 'research-center'
  | 'road' | 'monster-camp' | 'goblinTribute' | 'big-hole' | 'storage'
  // Canonical node identifiers carried over from NODE: Another Factory Game.
  // The shorter v2 names above remain loadable aliases for early reconstruction saves.
  | 'iron' | 'copper' | 'mythril' | 'stoneDeposit' | 'woodenChest'
  | 'charcoalGenerator' | 'powerSplitter' | 'researchCenter' | 'treePlanter'
  | 'miningDrill' | 'inventory' | 'filter';

export type PortFamily = 'FLUID' | 'WASTE' | 'ANY' | 'RESOURCE' | 'METAL' | 'PLATE' | 'GEAR' | 'CORE' | 'ROBOT_FRAME' | 'ROBOT_WEAPON' | 'ATTACK_POWER' | 'POWER' | ItemId;

export interface Recipe { id: string; name: string; inputs: Partial<Record<ItemId, number>>; outputs: Partial<Record<ItemId, number>>; cycleMs: number; unlockResearch?: string; recovery?: boolean; chanceOutputs?: Array<{item: ItemId; amount: number; probability: number}>; }
export interface MachineNode {
  /** Original label retained while a data mod supplies a replacement. */
  modBaseName?: string;
  id: string;
  kind: NodeKind;
  name: string;
  x: number;
  y: number;
  rotation: number;
  /** Visual slot for each stable input port index. Connections keep their original port index. */
  inputPortOrder?: number[];
  /** Visual slot for each stable output port index. Connections keep their original port index. */
  outputPortOrder?: number[];
  /** Moves a smaller output bank through otherwise-empty connector rows. */
  outputRowOffset?: number;
  /** Mirrors input/output banks horizontally without changing semantic port indices. */
  connectorsMirrored?: boolean;
  recipeId?: string;
  resourceItem?: ItemId;
  resourceRemaining?: number;
  resourceCapacity?: number;
  /** A defeated Golem is an inexhaustible reserve with four directional outputs. */
  infiniteResource?: boolean;
  regenMs?: number;
  input: Partial<Record<ItemId, number>>;
  output: Partial<Record<ItemId, number>>;
  progressMs: number;
  /** Last successful research payment, timed in simulation milliseconds for its visual feedback. */
  researchConsumption?: { atMs: number; cycleMs: number };
  /** Earliest next payment after a successful check, retained across project changes. */
  cycleMs: number;
  constructedAt: number;
  constructionMs: number;
  disabled?: boolean;
  /** Player-controlled processing pause. Completed output may continue routing. */
  processingPaused?: boolean;
  protected?: boolean;
  groupId?: string;
  alternator?: number;
  capacity?: number;
  campStrength?: number;
  attackRequirement?: number;
  /** Settlement subtype; absent on legacy Monster Camps. Keeps the serialized node kind stable. */
  goblinSettlement?: 'camp' | 'village' | 'kingdom';
  /** Dwarven subtype. Retains its legacy serialized key for save compatibility. */
  lizardSettlement?: 'camp' | 'village' | 'kingdom';
  /** Tribute stays active at minimum size between successful recurring suppression checks. */
  suppressed?: boolean;
  /** Last completed AP check, retained for feedback until the next actual check. */
  campLastCheck?: { passed: boolean; atMs: number; suppliedAp: number; requiredAp: number };
  /** Dwarven successful-check overpayment, retained until the next payment. */
  suppressionCredit?: number;
  suppressionRetry?: boolean;
  settlementMapTier?: number;
  /** FIFO dispatch order for complete mixed recipe batches. */
  outputQueue?: ItemId[];
  inputQueue?: ItemId[];
  filterBlocked?: 'selected' | 'remainder';
  /** Paid planter regeneration still available to emit. */
  growthCredit?: number;
  tributeItem?: 'wood' | 'water' | 'iron' | 'copper' | 'stone' | 'mythril';
  /** Marks the one-time migration from legacy Lizard rewards to Dwarven Mythril defaults. */
  tributeSelectionVersion?: 1;
  tributeCampId?: string;
  /** Source-game world-obstruction geometry. Optional so early v2 saves keep loading. */
  obstructionWidth?: number;
  obstructionHeight?: number;
  obstructionRadius?: number;
  obstructionMaxRadius?: number;
  pairedRoadId?: string;
  pairedSectorId?: string;
  roadMode?: 'export' | 'import';
  roadFacing?: 'north' | 'east' | 'south' | 'west';
  bufferAlternator?: number;
  filterItem?: ItemId;
  /** Outlet for the selected item. Saves without a setting use outlet 0. */
  filterOutputPort?: 0 | 1;
  miningTarget?: 'iron' | 'copper' | 'mythril' | 'stone';
  miningProgress?: number;
  transferProgressMs?: number;
  batch?: { recipeId: string; outputs: Partial<Record<ItemId, number>> };
  health?: number;
  defeated?: boolean;
  golemOutputs?: ItemId[];
  golemMineral?: 'iron' | 'copper' | 'stone' | 'mythril';
  golemCostVersion?: 1 | 2 | 3;
  cornerType?: import('../content/endgame').CornerType;
  cornerCampQuadrant?: 'northwest' | 'northeast' | 'southeast' | 'southwest';
  cornerProgress?: number;
  holeBaseStone?: number;
  holeStoneConsumed?: number;
}

export interface Connection { id: string; from: string; to: string; fromPort?: number; toPort?: number; item?: ItemId; createdAt: number; batchCredit?: number; }
export interface InFlightTransfer {
  id: string;
  sectorId: string;
  connectionId: string;
  /** Complete route through transparent logistics nodes, in travel order. */
  routeConnectionIds?: string[];
  from: string;
  to: string;
  item: ItemId;
  launchedAtMs: number;
  arrivesAtMs: number;
  /** Visual pulse for source-side work (for example extraction), not a delivered item. */
  cosmeticOnly?: boolean;
  /** Absent on legacy shipments means one unit. */
  amount?: number;
}
export interface CameraState { x: number; y: number; zoom: number; }
export interface ControlGroup { id: string; nodeIds: string[]; color: string; colorName: string; }
export interface DeferredPowerInfrastructure {
  nodes: MachineNode[];
  connections: Connection[];
  buffers?: Record<string, { input: number; output: number }>;
  transfers?: InFlightTransfer[];
}

export interface SectorState {
  /** Removed Power infrastructure retained for save compatibility, never simulated. */
  deferredPower?: DeferredPowerInfrastructure;
  retiredMythril?: DeferredPowerInfrastructure;
  id: string;
  x: number;
  y: number;
  name: string;
  label: string;
  unlocked: boolean;
  nodes: MachineNode[];
  connections: Connection[];
  controlGroups?: ControlGroup[];
  camera: CameraState;
  lastSimulatedAt: number;
  visited?: boolean;
}

export interface ResearchProject {
  id: string;
  name: string;
  category: string;
  description: string;
  unlock: string;
  flavorText?: string;
  costs: Partial<Record<ItemId, number>>;
  prerequisite?: string;
  prerequisites?: string[];
  costGrowth?: number;
  repeatable?: boolean;
  trigger?: {
    id: 'encounter' | 'connection' | 'assembler-built' | 'basic-core-produced' | 'wood-extracted' | 'motor-produced' | 'metal-extracted' | 'plate-produced' | 'refiner-unlocked' | 'monster-camp' | 'dwarven-mythril-produced' | 'precision-control' | 'complex-core-produced';
    kinds?: NodeKind[];
    pending: string;
    complete: string;
  };
}
export interface MapNodePricingPhase {
  tier: number;
  startedAt: number;
}
export interface ResearchState {
  unlocked: string[];
  selected?: string;
  contributed: Partial<Record<ItemId, number>>;
  completed: string[];
  mapPoints: number;
  repeatableCompletions?: Record<string, number>;
  /** Keeps each project's delivered cores when the active project changes. */
  projectContributions?: Record<string, Partial<Record<ItemId, number>>>;
  /** The selected Extra Map Point purchase's fixed bill, keyed to its completion count. */
  mapNodeQuote?: { completion: number; costs: Partial<Record<ItemId, number>> };
  /** The tier and starting completion count of the last quoted pricing phase. */
  mapNodePricingPhase?: MapNodePricingPhase;
}
export interface GameEvent { id: string; type: 'ItemProduced' | 'TransferStarted' | 'ResearchCompleted' | 'DepositDepleted' | 'NodePlaced'; message: string; at: number; projectId?: string; elapsedMs?: number; }
export interface GamePreferences { autosaveMinutes: number; confirmDelete: boolean; particles: boolean; showGrid: boolean; snapToGrid: boolean; sound: boolean; skipMultiConnectionTooltip?: boolean; }
export interface GameState {
  mod?: import('../mods/modTypes').GameMod;
  version: 1;
  seed: number;
  activeSectorId: string;
  sectors: Record<string, SectorState>;
  worldGridSize?: number;
  /** Shared starting field multiplier. Older worlds retain their largest generated field. */
  fieldSizeScale?: number;
  devMapSurveysRevealed?: true;
  devResearchUnlocked?: true;
  golemPlacementTier?: import('../content/resourceGolems').GolemPlacementTier;
  encounterLayoutVersion?: 1 | 2;
  research: ResearchState;
  isTraining?: boolean;
  paused: boolean;
  playTimeMs: number;
  achievements: string[];
  achievementTimes?: Record<string, number>;
  /** Persistent discovery history, independent of the short live event feed. */
  researchLog?: GameEvent[];
  discoveryTimes?: Partial<Record<NodeKind, number>>;
  preferences: GamePreferences;
  tutorialStep: number;
  /** Tutorial invitations acknowledged in this factory, saved across sessions. */
  tutorialPromptsSeen?: string[];
  events: GameEvent[];
  revision: number;
  produced?: Partial<Record<ItemId, number>>;
  extracted?: Partial<Record<ItemId, number>>;
  hasCreatedConnection?: boolean;
  inFlightTransfers?: InFlightTransfer[];
  progressionVersion?: number;
  reviewedProductionVersion?: 1;
  botAssemblyVersion?: 1;
  endgame?: { cornerOrder: import('../content/endgame').CornerType[]; pairIndex: number; version: 1; victoryAcknowledged?: boolean };
  rescue?: { resources: Array<'iron' | 'copper' | 'stone'>; pending?: { resource: 'iron' | 'copper' | 'stone'; sectorId: string; newMaps: number } };
  dwarvenMythrilProduced?: boolean;
  /** Production milestone for the future Final Core route; never set by delivery. */
  finalCoreProduced?: boolean;
  randomState?: number;
  encounters?: NodeKind[];
  globalPool?: Partial<Record<ItemId, number>>;
  factoryTemplates?: Array<{name: string; nodes: MachineNode[]; connections: Connection[]; deferredPower?: DeferredPowerInfrastructure}>;
}

export interface NodeDefinition {
  kind: NodeKind;
  name: string;
  category: 'Extraction' | 'Production' | 'Logistics' | 'Storage' | 'Power' | 'Research' | 'World';
  description: string;
  accent: number;
  accentCss: string;
  icon: string;
  input: PortFamily[];
  output: PortFamily[];
  size?: 'small' | 'normal' | 'large';
  hidden?: boolean;
  unlockResearch?: string;
  legacyAlias?: boolean;
}
