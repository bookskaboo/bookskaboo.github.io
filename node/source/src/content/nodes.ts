import { CORNER_ITEMS, FOUNDRY_INPUTS } from './endgame';
import { RECIPES } from './recipes';
import { BOT_STRENGTH } from './botAssembly';
import { NODE_FLAVOR } from './flavor';
import { DEFERRED_POWER_NODES } from './deferredPower';
import { LATE_NODES, WASTE_ITEMS } from './progression';
import { ITEM_COLORS } from './items';
import { getGolemMineral } from './resourceGolems';
import { cartUpgrade, isCartKind } from './cartUpgrades';
import type { MachineNode, NodeDefinition, NodeKind, PortFamily } from '../domain/types';
import { selectedFilterPort } from '../domain/filterRouting';
import { modNode, modNodeTemplate } from '../mods/modRules';

const NODE_PALETTE = {
  water: 0x70c7ee,
  steel: 0xaab4bf,
  storage: 0xc2a3e5,
  logistics: 0xdaa971,
  forestry: 0x8bc98d,
  research: 0x84d5c0,
  power: 0xf2d45c,
};

const CATEGORY_ACCENTS: Record<NodeDefinition['category'], number> = {
  Extraction: NODE_PALETTE.steel,
  Production: NODE_PALETTE.steel,
  Logistics: NODE_PALETTE.logistics,
  Storage: NODE_PALETTE.storage,
  Power: NODE_PALETTE.power,
  Research: NODE_PALETTE.research,
  World: NODE_PALETTE.steel,
};

const KIND_ACCENTS: Partial<Record<NodeKind, number>> = {
  lake: NODE_PALETTE.water,
  hydroProcessor: NODE_PALETTE.water,
  fluidLink: NODE_PALETTE.water,
  fluidRoad: NODE_PALETTE.water,
  fluidStorage: NODE_PALETTE.water,
  inventory: NODE_PALETTE.storage,
  sortingStation: NODE_PALETTE.logistics,
  forest: NODE_PALETTE.forestry,
  treePlanter: NODE_PALETTE.forestry,
  'tree-planter': NODE_PALETTE.forestry,
  powerSplitter: NODE_PALETTE.power,
  cornerChallenge: 0xe0b765,
  cornerTribute: 0xffd77d,
  devSource: 0xc99cff,
  'monster-camp': 0xe15759,
  goblinTribute: 0xa7df67,
  'big-hole': 0x465064,
  resourceGolem: 0x75bfc1,
};

const accentFields = (accent: number) => ({ accent, accentCss: `#${accent.toString(16).padStart(6, '0')}` });

const node = (definition: Omit<NodeDefinition, 'accent' | 'accentCss'>): NodeDefinition => ({
  ...definition,
  ...accentFields(KIND_ACCENTS[definition.kind] ?? CATEGORY_ACCENTS[definition.category]),
});

/** Reserved progression key until the player-facing Inventory requirement is designed. */
export const INVENTORY_UNLOCK_ID = 'autonomousLogistics' as const;

/** Player-facing catalog from NODE: Another Factory Game. */
export const NODE_DEFINITIONS: Record<NodeKind, NodeDefinition> = {
  ...LATE_NODES,
  recycler: node({kind:'recycler',name:'Recycler',category:'Production',description:'Processes one item every two seconds. Returns at most one of each constituent solid resource; raw inputs return nothing. Mixed output needs filtering.',icon:'♻',input:['ANY'],output:['ANY'],unlockResearch:'recycler'}),
  cornerChallenge: node({kind:'cornerChallenge',name:'Ancient Camp',category:'World',description:'A fixed corner camp with a repeatable supply challenge. Deliver supplies to the camp and collect its piece from the linked Tribute box.',icon:'✦',input:['ANY'],output:[],hidden:true,size:'large'}),
  cornerTribute: node({kind:'cornerTribute',name:'Corner Tribute',category:'World',description:'Holds ten corner pieces. Transport them to the Yin and Yang assembly lines.',icon:'✧',input:[],output:['ANY'],hidden:true}),
  devSource: node({ kind: 'devSource', name: 'Dev Source', category: 'World', description: 'Automatically supplies each connected input with its required material. Procurement has been excused.', icon: '∞', input: [], output: ['ANY'], hidden: true }),
  forest: node({ kind: 'forest', name: 'Forest', category: 'World', description: 'Renewable Wood source. Restores one unit naturally every 30 seconds.', icon: '♣', input: ['forest-growth'], output: ['wood'], size: 'large', hidden: true }),
  deposit: node({ kind: 'deposit', name: 'Deposit', category: 'World', description: 'Finite mineral reserve.', icon: '◆', input: [], output: ['RESOURCE'], size: 'large', hidden: true }),
  iron: node({ kind: 'iron', name: 'Iron', category: 'World', description: 'Finite Iron reserve.', icon: '◆', input: [], output: ['iron'], size: 'large', hidden: true }),
  copper: node({ kind: 'copper', name: 'Copper', category: 'World', description: 'Finite Copper reserve.', icon: '◆', input: [], output: ['copper'], size: 'large', hidden: true }),
  mythril: node({ kind: 'mythril', name: 'Mythril', category: 'World', description: 'Rare finite Mythril reserve.', icon: '◆', input: [], output: ['mythril'], size: 'large', hidden: true }),
  stoneDeposit: node({ kind: 'stoneDeposit', name: 'Stone Deposit', category: 'World', description: 'Finite Stone reserve.', icon: '▲', input: [], output: ['stone'], size: 'large', hidden: true }),
  lake: node({ kind: 'lake', name: 'Lake', category: 'World', description: 'Produces Water from four directional outlets.', icon: '≈', input: [], output: ['water', 'water', 'water', 'water'], size: 'large', hidden: true }),

  extractor: node({ kind: 'extractor', name: 'Extractor', category: 'Production', description: 'Automates resource gathering from any natural source.', icon: 'E', input: ['RESOURCE'], output: ['RESOURCE'] }),
  miningDrill: node({ kind: 'miningDrill', name: 'Mining Drill', category: 'Extraction', description: 'Consumes 20 Motors, then becomes a 1,000-unit deposit of the selected material.', icon: 'D', input: ['motor'], output: [], size: 'large', unlockResearch: 'miningDrill' }),

  kiln: node({ kind: 'kiln', name: 'Kiln', category: 'Production', description: 'Fires Wood into Charcoal for metal processing.', icon: 'K', input: ['wood'], output: ['charcoal'], unlockResearch: 'kiln' }),
  smelter: node({ kind: 'smelter', name: 'Smelter', category: 'Production', description: 'Smelts metal with Charcoal into matching Plates.', icon: 'S', input: ['METAL', 'charcoal'], output: ['PLATE'], unlockResearch: 'smelter' }),
  refiner: node({ kind: 'refiner', name: 'Refiner', category: 'Production', description: 'Changes one input item into another product.', icon: 'R', input: ['ANY'], output: ['ANY'], unlockResearch: 'refiner' }),
  assembler: node({ kind: 'assembler', name: 'Assembler', category: 'Production', description: 'Combines two input items into another product.', icon: 'A', input: ['ANY', 'ANY'], output: ['ANY'], size: 'large', unlockResearch: 'assembler' }),
  botPlant: node({ kind: 'botPlant', name: 'Bot Plant', category: 'Production', description: 'Feed one frame and one gun into their marked sockets to assemble a Suppression Bot. The parts determine its attack power.', icon: 'B', input: ['ROBOT_FRAME', 'ROBOT_WEAPON'], output: ['ATTACK_POWER'], size: 'large', unlockResearch: 'suppressionBot' }),

  splitter: node({ kind: 'splitter', name: 'Splitter', category: 'Logistics', description: 'Alternates each incoming item between two smart outputs.', icon: 'Y', input: ['ANY'], output: ['ANY', 'ANY'], size: 'small', unlockResearch: 'splitter' }),
  merger: node({ kind: 'merger', name: 'Merger', category: 'Logistics', description: 'Combines two matching item streams into one smart output.', icon: 'λ', input: ['ANY', 'ANY'], output: ['ANY'], size: 'small', unlockResearch: 'merger' }),
  joint: node({ kind: 'joint', name: 'Joint', category: 'Logistics', description: 'A compact pass-through for shaping and organizing cable routes.', icon: '•', input: ['ANY'], output: ['ANY'], size: 'small', unlockResearch: 'joint' }),
  road: node({ kind: 'road', name: 'Road', category: 'Logistics', description: 'Connect a freight vehicle (Cart, Truck, or Train) directly to each end of the Road pair. The sending vehicle loads one solid material and the receiving vehicle unloads it. Roads store nothing. Base rate is 12 items per minute, with one Road per map face before upgrades.', icon: '⇥', input: ['ANY'], output: ['ANY'], size: 'large', unlockResearch: 'road' }),
  powerSplitter: node({ kind: 'powerSplitter', name: 'Power Splitter', category: 'Logistics', description: 'Branches one Power cable into three compact directional outputs.', icon: 'ϟ', input: ['POWER'], output: ['POWER', 'POWER', 'POWER'], size: 'small', unlockResearch: 'basicElectricity' }),
  filter: node({ kind: 'filter', name: 'Filter', category: 'Logistics', description: 'Routes one item type to either outlet and all other items to the opposite outlet. A blocked required outlet stops both paths.', icon: '▽', input: ['ANY'], output: ['ANY', 'ANY'], size: 'small' }),
  inventory: node({ kind: 'inventory', name: 'Inventory', category: 'Logistics', description: 'Withdraws one global-pool item per connected Filter each second. Placement and connection limits improve through research.', icon: '▦', input: [], output: ['ANY'], unlockResearch: INVENTORY_UNLOCK_ID }),

  woodenChest: node({ kind: 'woodenChest', name: 'Cart', category: 'Logistics', description: 'A freight vehicle that stores up to 20 solid items of any tier. Connect it directly to a Road to load or unload cargo. Trucks and Trains increase capacity globally.', icon: '□', input: ['ANY'], output: ['ANY'], unlockResearch: 'road' }),
  storage: node({ kind: 'storage', name: 'Storage', category: 'Storage', description: 'Deposits materials into the shared global pool. Starts with a 1,000-item limit per material.', icon: '▣', input: ['ANY'], output: [], size: 'large', unlockResearch: 'autonomousLogistics' }),

  charcoalGenerator: node({ kind: 'charcoalGenerator', name: 'Generator', category: 'Power', description: 'Burns Charcoal into a shared 100W reserve for advanced machines.', icon: '⚡', input: ['charcoal'], output: ['POWER'], unlockResearch: 'basicElectricity' }),
  treePlanter: node({ kind: 'treePlanter', name: 'Tree Planter', category: 'Production', description: 'Consumes 10 Wood, 1 Iron Plate and 1 Stone to fund 100 growth units. Emits one per second; Industrial Forestry makes production ten times faster.', icon: 'T', input: ['wood', 'iron-plate', 'stone'], output: ['forest-growth'], unlockResearch: 'treePlanter' }),
  researchCenter: node({ kind: 'researchCenter', name: 'Research Center', category: 'Research', description: 'Studies the selected project by consuming one of every required Core together each cycle. Waits for a complete set.', icon: 'Q', input: ['CORE'], output: [], size: 'large', unlockResearch: 'researchCenter' }),

  'monster-camp': node({ kind: 'monster-camp', name: 'Monster Camp', category: 'World', description: 'Expands unless supplied with Attack Power.', icon: 'M', input: ['ATTACK_POWER'], output: [], size: 'large', hidden: true }),
  goblinTribute: node({ kind: 'goblinTribute', name: 'Tribute', category: 'World', description: 'Produces your chosen material directly while its settlement stays suppressed. Miss an AP check and this node and its stored tribute disappear.', icon: '▣', input: [], output: ['RESOURCE'], hidden: true }),
  'big-hole': node({ kind: 'big-hole', name: 'Deep Hole', category: 'World', description: 'Fill with processed Stone to clear.', icon: '◉', input: ['stone'], output: [], size: 'large', hidden: true }),

  // Early reconstruction aliases remain loadable without appearing twice.
  chest: node({ kind: 'chest', name: 'Cart', category: 'Logistics', description: 'Stores up to 20 solid items of any tier with ordinary local transfers. Fluids are excluded.', icon: '□', input: ['ANY'], output: ['ANY'], unlockResearch: 'road', hidden: true, legacyAlias: true }),
  generator: node({ kind: 'generator', name: 'Generator', category: 'Power', description: 'Legacy Generator identifier.', icon: '⚡', input: ['charcoal'], output: ['POWER'], hidden: true, legacyAlias: true }),
  'tree-planter': node({ kind: 'tree-planter', name: 'Tree Planter', category: 'Production', description: 'Consumes 10 Wood, 1 Iron Plate and 1 Stone to fund 100 growth units. Emits one per second; Industrial Forestry makes production ten times faster.', icon: 'T', input: ['wood', 'iron-plate', 'stone'], output: ['forest-growth'], hidden: true, legacyAlias: true }),
  'research-center': node({ kind: 'research-center', name: 'Research Center', category: 'Research', description: 'Legacy Research Center identifier.', icon: 'Q', input: ['CORE'], output: [], size: 'large', hidden: true, legacyAlias: true }),
};

for (const definition of Object.values(LATE_NODES)) NODE_DEFINITIONS[definition.kind] = node(definition);

for (const kind of DEFERRED_POWER_NODES) {
  NODE_DEFINITIONS[kind].hidden = true;
  delete NODE_DEFINITIONS[kind].unlockResearch;
}

for (const definition of Object.values(NODE_DEFINITIONS)) {
  const canonicalKind = ({ chest: 'woodenChest', generator: 'charcoalGenerator', 'tree-planter': 'treePlanter', 'research-center': 'researchCenter' } as Partial<Record<NodeKind, NodeKind>>)[definition.kind] ?? definition.kind;
  const flavor = NODE_FLAVOR[canonicalKind];
  if (flavor) NODE_DEFINITIONS[definition.kind] = { ...definition, description: `${definition.description} ${flavor}` };
}

export const BUILDABLE_NODES = Object.values(NODE_DEFINITIONS).filter((definition) => !definition.hidden);

export function getBuildNodeDefinition(kind: NodeKind, completedResearch: readonly string[]) {
  const definition = NODE_DEFINITIONS[kind];
  if (!isCartKind(kind)) return definition;
  const { name, capacity } = cartUpgrade(completedResearch);
  return { ...definition, name, description: `A freight vehicle that stores up to ${capacity} solid items of any tier. Carts, Trucks, and Trains ship up to 1, 2, and 4 items at a time, respectively. Connect it directly to a Road to load or unload cargo. The wheels are implied.` };
}

export const getNodeDisplayDefinition = (node: MachineNode): NodeDefinition => {
  if (modNode(node.kind)?.accentCss) return NODE_DEFINITIONS[node.kind];
  const accent = node.kind === 'resourceGolem' ? ITEM_COLORS[getGolemMineral(node)] : node.lizardSettlement ? 0x71c99a : undefined;
  return accent === undefined ? NODE_DEFINITIONS[node.kind] : { ...NODE_DEFINITIONS[node.kind], ...accentFields(accent) };
};

export function getNodeDisplayName(node: Pick<MachineNode, 'name' | 'infiniteResource'>) {
  return node.infiniteResource ? node.name.replace(/^Infinite\s+/i, '') : node.name;
}

export const isNodeUnlocked = (kind: NodeKind, unlockedResearch: readonly string[]) => {
  if (kind === 'fluidRoad' || DEFERRED_POWER_NODES.has(kind)) return false;
  const definition = NODE_DEFINITIONS[kind];
  if (!definition) return false;
  const requirement = definition.unlockResearch;
  return !requirement || unlockedResearch.includes(requirement);
};

/** Forest reforestation is a Tree Planter research benefit, not a starting socket. */
export const getNodeInputFamilies = (kind: NodeKind, completedResearch: readonly string[]): readonly PortFamily[] =>
  kind === 'forest' && !completedResearch.includes('treePlanter') ? [] : NODE_DEFINITIONS[kind].input;

/** Runtime socket types keep semantic port indexes stable while recipes and visual rows change. */
export const getEffectiveNodeInputFamilies = (node: MachineNode, completedResearch: readonly string[]): readonly PortFamily[] => {
  if (modNode(node.kind)?.customSockets && modNode(node.kind)?.input) return modNode(node.kind)!.input!;
  if (node.kind==='cornerChallenge') return node.cornerType==='alpha'?['ATTACK_POWER']:node.cornerType==='foundry'?Object.keys(FOUNDRY_INPUTS) as PortFamily[]:node.cornerType==='grove'?['forest-growth']:['WASTE'];
  if (node.infiniteResource) return [];
  if (node.kind === 'road' || node.kind === 'fluidRoad') return node.roadMode === 'import' ? [] : NODE_DEFINITIONS[node.kind].input;
  const base = getNodeInputFamilies(node.kind, completedResearch);
  const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
  if (!recipe) return base;
  if (['kiln', 'smelter', 'refiner', 'assembler', 'hydroProcessor', 'advancedAssembler', 'separationFurnace'].includes(modNodeTemplate(node.kind))) {
    return Object.keys(recipe.inputs) as PortFamily[];
  }
  return base;
};

export const getEffectiveNodeOutputFamilies = (node: MachineNode): readonly PortFamily[] => {
  if (modNode(node.kind)?.customSockets && modNode(node.kind)?.output) return modNode(node.kind)!.output!;
  if (node.kind==='cornerTribute'&&node.cornerType) return [CORNER_ITEMS[node.cornerType]];
  if (node.kind === 'resourceGolem') return [];
  if (node.infiniteResource && node.resourceItem) return Array<PortFamily>(4).fill(node.resourceItem);
  if (node.kind === 'road' || node.kind === 'fluidRoad') return node.roadMode === 'import' ? NODE_DEFINITIONS[node.kind].output : [];
  const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
  if (recipe && ['kiln', 'smelter', 'refiner', 'assembler','hydroProcessor','advancedAssembler','separationFurnace'].includes(modNodeTemplate(node.kind))) {
    const products = (Object.keys(recipe.outputs) as import('../domain/types').ItemId[]).filter(i=>!WASTE_ITEMS.includes(i));
    return Object.keys(recipe.outputs).some(i=>WASTE_ITEMS.includes(i as import('../domain/types').ItemId)) || recipe.chanceOutputs?.length ? ['ANY'] : products;
  }
  if (node.kind === 'extractor' && node.resourceItem) return [node.resourceItem];
  if (node.kind === 'filter' && node.filterItem) {
    const selected = BOT_STRENGTH[node.filterItem] === undefined ? node.filterItem : 'ATTACK_POWER';
    return selectedFilterPort(node) === 0 ? [selected, 'ANY'] : ['ANY', selected];
  }
  if (node.kind === 'goblinTribute') return Object.keys(node.output).some(item => item !== (node.tributeItem ?? 'iron') && (node.output[item as import('../domain/types').ItemId] ?? 0) > 0) ? ['ANY'] : [node.tributeItem ?? 'iron'];
  return NODE_DEFINITIONS[node.kind].output;
};

export const BASE_NODE_DEFINITIONS = structuredClone(NODE_DEFINITIONS);
