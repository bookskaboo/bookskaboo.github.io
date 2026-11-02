import { RECIPES } from './recipes';
import { NODE_FLAVOR } from './flavor';
import { LATE_NODES, WASTE_ITEMS } from './progression';
import type { MachineNode, NodeDefinition, NodeKind, PortFamily } from '../domain/types';

const node = (definition: NodeDefinition) => definition;

/** Reserved progression key until the player-facing Inventory requirement is designed. */
export const INVENTORY_UNLOCK_ID = 'autonomousLogistics' as const;

/** Player-facing catalog from NODE: Another Factory Game. */
export const NODE_DEFINITIONS: Record<NodeKind, NodeDefinition> = {
  ...LATE_NODES,
  forest: node({ kind: 'forest', name: 'Forest', category: 'World', description: 'Renewable Wood source. Restores one unit naturally every 30 seconds.', accent: 0x72a873, accentCss: '#72a873', icon: '♣', input: ['forest-growth'], output: ['wood'], size: 'large', hidden: true }),
  deposit: node({ kind: 'deposit', name: 'Deposit', category: 'World', description: 'Finite mineral reserve.', accent: 0x8296a6, accentCss: '#8296a6', icon: '◆', input: [], output: ['RESOURCE'], size: 'large', hidden: true }),
  iron: node({ kind: 'iron', name: 'Iron', category: 'World', description: 'Finite Iron reserve.', accent: 0x8296a6, accentCss: '#8296a6', icon: '◆', input: [], output: ['iron'], size: 'large', hidden: true }),
  copper: node({ kind: 'copper', name: 'Copper', category: 'World', description: 'Finite Copper reserve.', accent: 0xd17b55, accentCss: '#d17b55', icon: '◆', input: [], output: ['copper'], size: 'large', hidden: true }),
  mythril: node({ kind: 'mythril', name: 'Mythril', category: 'World', description: 'Rare finite Mythril reserve.', accent: 0x55c97a, accentCss: '#55c97a', icon: '◆', input: [], output: ['mythril'], size: 'large', hidden: true }),
  stoneDeposit: node({ kind: 'stoneDeposit', name: 'Stone Deposit', category: 'World', description: 'Finite Stone reserve.', accent: 0x8c918f, accentCss: '#8c918f', icon: '▲', input: [], output: ['stone'], size: 'large', hidden: true }),
  lake: node({ kind: 'lake', name: 'Lake', category: 'World', description: 'Produces Water from four directional outlets.', accent: 0x55bde8, accentCss: '#55bde8', icon: '≈', input: [], output: ['water', 'water', 'water', 'water'], size: 'large', hidden: true }),

  extractor: node({ kind: 'extractor', name: 'Extractor', category: 'Production', description: 'Automates resource gathering from any natural source.', accent: 0x8ea0a6, accentCss: '#8ea0a6', icon: 'E', input: ['RESOURCE'], output: ['RESOURCE'] }),
  miningDrill: node({ kind: 'miningDrill', name: 'Mining Drill', category: 'Extraction', description: 'Consumes 20 Motors, then becomes a 1,000-unit deposit of the selected material.', accent: 0xd9a54a, accentCss: '#d9a54a', icon: 'D', input: ['motor'], output: [], size: 'large', unlockResearch: 'miningDrill' }),

  kiln: node({ kind: 'kiln', name: 'Kiln', category: 'Production', description: 'Fires Wood into Charcoal for metal processing.', accent: 0x6f7782, accentCss: '#6f7782', icon: 'K', input: ['wood'], output: ['charcoal'], unlockResearch: 'kiln' }),
  smelter: node({ kind: 'smelter', name: 'Smelter', category: 'Production', description: 'Smelts metal with Charcoal into matching Plates.', accent: 0x8296a6, accentCss: '#8296a6', icon: 'S', input: ['METAL', 'charcoal'], output: ['PLATE'], unlockResearch: 'smelter' }),
  refiner: node({ kind: 'refiner', name: 'Refiner', category: 'Production', description: 'Changes one input item into another product.', accent: 0xb99362, accentCss: '#b99362', icon: 'R', input: ['ANY'], output: ['ANY'], unlockResearch: 'refiner' }),
  assembler: node({ kind: 'assembler', name: 'Assembler', category: 'Production', description: 'Combines two input items into another product.', accent: 0x8fa3b8, accentCss: '#8fa3b8', icon: 'A', input: ['ANY', 'ANY'], output: ['ANY'], size: 'large', unlockResearch: 'assembler' }),

  splitter: node({ kind: 'splitter', name: 'Splitter', category: 'Logistics', description: 'Alternates each incoming item between two smart outputs.', accent: 0x9c8ed4, accentCss: '#9c8ed4', icon: 'Y', input: ['ANY'], output: ['ANY', 'ANY'], size: 'small', unlockResearch: 'splitter' }),
  merger: node({ kind: 'merger', name: 'Merger', category: 'Logistics', description: 'Combines two matching item streams into one smart output.', accent: 0x8b9cc9, accentCss: '#8b9cc9', icon: 'λ', input: ['ANY', 'ANY'], output: ['ANY'], size: 'small', unlockResearch: 'merger' }),
  joint: node({ kind: 'joint', name: 'Joint', category: 'Logistics', description: 'A compact pass-through for shaping and organizing cable routes.', accent: 0x7dc8ff, accentCss: '#7dc8ff', icon: '•', input: ['ANY'], output: ['ANY'], size: 'small', unlockResearch: 'joint' }),
  road: node({ kind: 'road', name: 'Road', category: 'Logistics', description: 'Transfers one item every five seconds to an adjacent map. One material per road pair; fluids cannot use roads.', accent: 0x9facbd, accentCss: '#9facbd', icon: '⇥', input: ['ANY'], output: ['ANY'], size: 'large', unlockResearch: 'road' }),
  powerSplitter: node({ kind: 'powerSplitter', name: 'Power Splitter', category: 'Logistics', description: 'Branches one Power cable into three compact directional outputs.', accent: 0xf2d45c, accentCss: '#f2d45c', icon: 'ϟ', input: ['POWER'], output: ['POWER', 'POWER', 'POWER'], size: 'small', unlockResearch: 'basicElectricity' }),
  filter: node({ kind: 'filter', name: 'Filter', category: 'Logistics', description: 'Passes only the selected stored item type through its output.', accent: 0xd39c62, accentCss: '#d39c62', icon: '▽', input: ['ANY'], output: ['ANY'], size: 'small' }),
  inventory: node({ kind: 'inventory', name: 'Inventory', category: 'Logistics', description: 'Withdraws one global-pool item per connected Filter each second. Placement and connection limits improve through research.', accent: 0xad8bd5, accentCss: '#ad8bd5', icon: '▦', input: [], output: ['ANY'], unlockResearch: INVENTORY_UNLOCK_ID }),

  woodenChest: node({ kind: 'woodenChest', name: 'Chest', category: 'Storage', description: 'Stores up to 20 of one production material and transfers items in two-second batches.', accent: 0xc69767, accentCss: '#c69767', icon: '□', input: ['ANY'], output: ['ANY'] }),
  storage: node({ kind: 'storage', name: 'Storage', category: 'Storage', description: 'Deposits materials into the shared global pool. Starts with a 1,000-item limit per material.', accent: 0x72e1d1, accentCss: '#72e1d1', icon: '▣', input: ['ANY'], output: [], size: 'large', unlockResearch: 'autonomousLogistics' }),

  charcoalGenerator: node({ kind: 'charcoalGenerator', name: 'Charcoal Generator', category: 'Power', description: 'Burns Charcoal into a shared 100W reserve for advanced machines.', accent: 0xf2d45c, accentCss: '#f2d45c', icon: '⚡', input: ['charcoal'], output: ['POWER'], unlockResearch: 'basicElectricity' }),
  treePlanter: node({ kind: 'treePlanter', name: 'Tree Planter', category: 'Power', description: 'Uses 5W to restore one depleted Forest unit every second.', accent: 0x82d982, accentCss: '#82d982', icon: 'T', input: ['POWER'], output: ['forest-growth'], unlockResearch: 'treePlanter' }),
  researchCenter: node({ kind: 'researchCenter', name: 'Research Center', category: 'Research', description: 'Studies the selected project by consuming one of every required Core together each cycle. Waits for a complete set.', accent: 0x8baadf, accentCss: '#8baadf', icon: 'Q', input: ['CORE'], output: [], size: 'large', unlockResearch: 'researchCenter' }),

  'monster-camp': node({ kind: 'monster-camp', name: 'Monster Camp', category: 'World', description: 'Expands unless supplied with Attack Power.', accent: 0xe15759, accentCss: '#e15759', icon: 'M', input: ['ATTACK_POWER'], output: [], size: 'large', hidden: true }),
  goblinTribute: node({ kind: 'goblinTribute', name: 'Goblin Tribute', category: 'World', description: 'Produces your chosen material directly while its settlement stays suppressed. Miss an AP check and this node and its stored tribute disappear.', accent: 0xa7df67, accentCss: '#a7df67', icon: '▣', input: [], output: ['RESOURCE'], hidden: true }),
  'big-hole': node({ kind: 'big-hole', name: 'Deep Hole', category: 'World', description: 'Fill with processed Stone to clear.', accent: 0x465064, accentCss: '#465064', icon: '◉', input: ['stone'], output: [], size: 'large', hidden: true }),

  // Early reconstruction aliases remain loadable without appearing twice.
  chest: node({ kind: 'chest', name: 'Chest', category: 'Storage', description: 'Legacy Chest identifier.', accent: 0xc69767, accentCss: '#c69767', icon: '□', input: ['ANY'], output: ['ANY'], hidden: true, legacyAlias: true }),
  generator: node({ kind: 'generator', name: 'Charcoal Generator', category: 'Power', description: 'Legacy Charcoal Generator identifier.', accent: 0xf2d45c, accentCss: '#f2d45c', icon: '⚡', input: ['charcoal'], output: ['POWER'], hidden: true, legacyAlias: true }),
  'tree-planter': node({ kind: 'tree-planter', name: 'Tree Planter', category: 'Power', description: 'Legacy Tree Planter identifier.', accent: 0x82d982, accentCss: '#82d982', icon: 'T', input: ['POWER'], output: ['forest-growth'], hidden: true, legacyAlias: true }),
  'research-center': node({ kind: 'research-center', name: 'Research Center', category: 'Research', description: 'Legacy Research Center identifier.', accent: 0x8baadf, accentCss: '#8baadf', icon: 'Q', input: ['CORE'], output: [], size: 'large', hidden: true, legacyAlias: true }),
};

for (const definition of Object.values(NODE_DEFINITIONS)) {
  const canonicalKind = ({ chest: 'woodenChest', generator: 'charcoalGenerator', 'tree-planter': 'treePlanter', 'research-center': 'researchCenter' } as Partial<Record<NodeKind, NodeKind>>)[definition.kind] ?? definition.kind;
  const flavor = NODE_FLAVOR[canonicalKind];
  if (flavor) NODE_DEFINITIONS[definition.kind] = { ...definition, description: `${definition.description} ${flavor}` };
}

export const BUILDABLE_NODES = Object.values(NODE_DEFINITIONS).filter((definition) => !definition.hidden);

export const getNodeDisplayDefinition = (node: MachineNode): NodeDefinition => node.lizardSettlement
  ? { ...NODE_DEFINITIONS[node.kind], accent: 0x71c99a, accentCss: '#71c99a' }
  : NODE_DEFINITIONS[node.kind];

export const isNodeUnlocked = (kind: NodeKind, unlockedResearch: readonly string[]) => {
  if (kind === 'fluidRoad') return false;
  const requirement = NODE_DEFINITIONS[kind].unlockResearch;
  return !requirement || unlockedResearch.includes(requirement);
};

/** Forest reforestation is a Tree Planter research benefit, not a starting socket. */
export const getNodeInputFamilies = (kind: NodeKind, completedResearch: readonly string[]): readonly PortFamily[] =>
  kind === 'forest' && !completedResearch.includes('treePlanter') ? [] : NODE_DEFINITIONS[kind].input;

/** Runtime socket types keep semantic port indexes stable while recipes and visual rows change. */
export const getEffectiveNodeInputFamilies = (node: MachineNode, completedResearch: readonly string[]): readonly PortFamily[] => {
  if (node.infiniteResource) return [];
  if (node.kind === 'road' || node.kind === 'fluidRoad') return node.roadMode === 'import' ? [] : NODE_DEFINITIONS[node.kind].input;
  const base = getNodeInputFamilies(node.kind, completedResearch);
  const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
  if (!recipe) return base;
  if (node.kind === 'smelter') return ['METAL', 'charcoal'];
  if (node.kind === 'refiner' || node.kind === 'assembler' || ['hydroProcessor','advancedAssembler','separationFurnace'].includes(node.kind)) {
    return Object.keys(recipe.inputs) as PortFamily[];
  }
  return base;
};

export const getEffectiveNodeOutputFamilies = (node: MachineNode): readonly PortFamily[] => {
  if (node.kind === 'resourceGolem') return [];
  if (node.infiniteResource && node.resourceItem) return Array<PortFamily>(4).fill(node.resourceItem);
  if (node.kind === 'road' || node.kind === 'fluidRoad') return node.roadMode === 'import' ? NODE_DEFINITIONS[node.kind].output : [];
  const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
  if (recipe && ['kiln', 'smelter', 'refiner', 'assembler','hydroProcessor','advancedAssembler','separationFurnace'].includes(node.kind)) {
    const products = (Object.keys(recipe.outputs) as import('../domain/types').ItemId[]).filter(i=>!WASTE_ITEMS.includes(i));
    return [...products,...(Object.keys(recipe.outputs).some(i=>WASTE_ITEMS.includes(i as import('../domain/types').ItemId)) || recipe.chanceOutputs?.length ? ['WASTE' as const] : [])];
  }
  if (node.kind === 'extractor' && node.resourceItem) return [node.resourceItem];
  if (node.kind === 'filter' && node.filterItem) return [node.filterItem];
  if (node.kind === 'goblinTribute') return [node.tributeItem ?? 'iron'];
  return NODE_DEFINITIONS[node.kind].output;
};
