import type { ItemId, MachineNode, SectorState } from '../domain/types';
import { canPlaceNode, nodesOverlap } from './collisions';
import { getGoblinSettlementForMapTier, GOBLIN_CHECK_INTERVAL_MS } from '../content/goblinSettlements';
import { GOLEM_AP_COST, GOLEM_MINERALS, GOLEM_NAMES } from '../content/resourceGolems';
import { getLizardSettlementForMapTier } from '../content/lizardSettlements';

const HOME = 5;
export const MAP_GRID_SIZE = 11;
export const MAX_MAP_NODE_VALUE = 10;
const BASE_RESOURCE_CAPACITY = 1000;
const RESOURCE_CAPACITY_PER_TIER = 500;
const MYTHRIL_MIN_TIER = 4;
const MYTHRIL_TIER_FOUR_CHANCE = .6;
const MYTHRIL_GUARANTEED_TIER = 9;
const MAP_OBSTRUCTION_MARGIN = 72;
const MAX_GENERATED_BIG_HOLE_COUNT = 5;
const BIG_HOLE_RADIUS = 38;
const BIG_HOLE_MAX_RADIUS_MULTIPLIER = 1.25;
const BIG_HOLE_CENTER_SPACING = 1.7;
const BIG_HOLE_MIN_STONE = 20;
const BIG_HOLE_TIER_ONE_MAX_STONE = 500;
const BIG_HOLE_MAX_STONE = 20000;
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const sectorId = (x: number, y: number) => `${x},${y}`;
export const sectorDistance = (x: number, y: number) => Math.abs(x - HOME) + Math.abs(y - HOME);
/** Original-game maximum reserve rule: 1,000 base plus 500 for each map tier. */
export const getMapNodeMaximumResourceCapacity = (x: number, y: number) => BASE_RESOURCE_CAPACITY + Math.min(MAX_MAP_NODE_VALUE, sectorDistance(x, y)) * RESOURCE_CAPACITY_PER_TIER;
/** Tier-ten map nodes are exhausted/unavailable at generation time, as in the original game. */
export const getMapNodeResourceCapacity = (x: number, y: number) => sectorDistance(x, y) >= MAX_MAP_NODE_VALUE ? 0 : getMapNodeMaximumResourceCapacity(x, y);
export const getMythrilSpawnChance = (tier: number) => {
  if (tier < MYTHRIL_MIN_TIER || tier >= MAX_MAP_NODE_VALUE) return 0;
  const progression = Math.min(1, (tier - MYTHRIL_MIN_TIER) / (MYTHRIL_GUARANTEED_TIER - MYTHRIL_MIN_TIER));
  return MYTHRIL_TIER_FOUR_CHANCE + (1 - MYTHRIL_TIER_FOUR_CHANCE) * progression;
};

export const BASE_WORLD_SIZE = { width: 3600, height: 2400 } as const;

const SOURCE_RESOURCE_NODE_SIZE = { width: 310, height: 242 } as const;
const SOURCE_EXTRACTOR_NODE_SIZE = { width: 258, height: 201 } as const;
const SOURCE_STARTING_RESOURCE_X = 96 + SOURCE_RESOURCE_NODE_SIZE.width / 2;
const SOURCE_STARTING_RESOURCE_STEP = (SOURCE_RESOURCE_NODE_SIZE.height + 12) * 2;
const sourceNodeCenter = (x: number, y: number, size: { width: number; height: number }) => ({
  x: x + size.width / 2,
  y: y + size.height / 2,
});

/**
 * Fresh-home layout from the source game. Its saved positions are top-left
 * coordinates; this engine stores centers, so conversion happens here once.
 */
const SOURCE_HOME_LAYOUT = [
  {
    id: 'forest', kind: 'forest' as const, name: 'Forest',
    ...sourceNodeCenter(SOURCE_STARTING_RESOURCE_X, 120 + SOURCE_STARTING_RESOURCE_STEP, SOURCE_RESOURCE_NODE_SIZE),
    extra: { resourceItem: 'wood' as ItemId, resourceRemaining: 1000, resourceCapacity: 1000, regenMs: 0, cycleMs: 5000, capacity: 5 },
  },
  {
    id: 'copper', kind: 'copper' as const, name: 'Copper',
    ...sourceNodeCenter(SOURCE_STARTING_RESOURCE_X, 120 + SOURCE_STARTING_RESOURCE_STEP * 2, SOURCE_RESOURCE_NODE_SIZE),
    extra: { resourceItem: 'copper' as ItemId, resourceRemaining: 1000, resourceCapacity: 1000, cycleMs: 5000, capacity: 5 },
  },
  {
    id: 'iron', kind: 'iron' as const, name: 'Iron',
    ...sourceNodeCenter(SOURCE_STARTING_RESOURCE_X, 120 + SOURCE_STARTING_RESOURCE_STEP * 3, SOURCE_RESOURCE_NODE_SIZE),
    extra: { resourceItem: 'iron' as ItemId, resourceRemaining: 1000, resourceCapacity: 1000, cycleMs: 5000, capacity: 5 },
  },
  {
    id: 'ironExtractor', kind: 'extractor' as const, name: 'Extractor',
    ...sourceNodeCenter(700, 140 + SOURCE_STARTING_RESOURCE_STEP, SOURCE_EXTRACTOR_NODE_SIZE),
    extra: { cycleMs: 5000 },
  },
  {
    id: 'extractor-2', kind: 'extractor' as const, name: 'Extractor',
    ...sourceNodeCenter(800, 60 + SOURCE_STARTING_RESOURCE_STEP * 2, SOURCE_EXTRACTOR_NODE_SIZE),
    extra: { cycleMs: 5000 },
  },
] as const;

/** Matches the source game's field scaling: up to 2x at world-grid tier 10, plus Area Expansion. */
export function getSectorWorldSize(sector: Pick<SectorState, 'x' | 'y'>, completedResearch: readonly string[]) {
  const distanceMultiplier = 1 + Math.min(10, sectorDistance(sector.x, sector.y)) / 10;
  const researchMultiplier = completedResearch.includes('areaExpansion2') ? 1.5 : completedResearch.includes('areaExpansion1') ? 1.25 : 1;
  return {
    width: Math.round(BASE_WORLD_SIZE.width * distanceMultiplier * researchMultiplier),
    height: Math.round(BASE_WORLD_SIZE.height * distanceMultiplier * researchMultiplier),
  };
}

function node(kind: MachineNode['kind'], name: string, x: number, y: number, extra: Partial<MachineNode> = {}): MachineNode {
  return {
    id: id(kind), kind, name, x, y, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000,
    constructedAt: 0, constructionMs: 0, ...extra,
  };
}

export function createHomeSector(now = Date.now()): SectorState {
  const nodes: MachineNode[] = SOURCE_HOME_LAYOUT.map((entry) => ({
    ...node(entry.kind, entry.name, entry.x, entry.y, entry.extra),
    id: entry.id,
  }));
  return {
    id: '5,5', x: 5, y: 5, name: 'Home Factory', label: 'H', unlocked: true, nodes,
    connections: [], camera: { x: 0, y: -190, zoom: .55 }, lastSimulatedAt: now,
  };
}

function shuffled<T>(values: T[], random: () => number) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index--) { const swap = Math.floor(random() * (index + 1)); [next[index], next[swap]] = [next[swap], next[index]]; }
  return next;
}

export function getMapNodeBigHoleAreaRatio(tier: number) {
  const progression = Math.max(0, Math.min(9, tier) - 1) / 8;
  return .15 + (.5 - .15) * progression;
}

function bigHoleLayouts(field: { width: number; height: number }, targetArea: number) {
  const usableWidth = field.width - MAP_OBSTRUCTION_MARGIN * 2;
  const usableHeight = field.height - MAP_OBSTRUCTION_MARGIN * 2;
  const aspect = usableWidth / usableHeight;
  return Array.from({ length: MAX_GENERATED_BIG_HOLE_COUNT }, (_, index) => {
    const count = index + 1;
    const rows = Math.max(1, Math.round(Math.sqrt(count / aspect)));
    const columns = Math.ceil(count / rows);
    const cellWidth = usableWidth / columns;
    const cellHeight = usableHeight / rows;
    const radius = Math.sqrt(targetArea / (Math.PI * count));
    return { count, rows, columns, cellWidth, cellHeight, radius };
  }).filter((layout) => layout.radius * 2 <= Math.min(layout.cellWidth, layout.cellHeight));
}

function variedRadii(count: number, targetArea: number, maximumCellRadius: number, random: () => number) {
  const equalRadius = Math.sqrt(targetArea / (Math.PI * count));
  if (count <= 1) return [equalRadius];
  const weights = shuffled(Array.from({ length: count }, (_, index) => .75 + .5 * index / (count - 1)), random);
  const maximum = Math.min(maximumCellRadius, equalRadius * BIG_HOLE_MAX_RADIUS_MULTIPLIER);
  for (let strength = 1; strength >= .05; strength -= .05) {
    const adjusted = weights.map((weight) => 1 + (weight - 1) * strength);
    const scale = Math.sqrt(targetArea / (Math.PI * adjusted.reduce((total, weight) => total + weight * weight, 0)));
    const radii = adjusted.map((weight) => scale * weight);
    if (radii.every((radius) => radius <= maximum)) return radii;
  }
  return Array.from({ length: count }, () => equalRadius);
}

function maximumGeneratedHoleRadius(tier: number) {
  const field = getSectorWorldSize({ x: HOME + Math.min(10, Math.max(0, tier)), y: HOME }, []);
  const target = field.width * field.height * getMapNodeBigHoleAreaRatio(tier);
  return Math.max(BIG_HOLE_RADIUS, ...bigHoleLayouts(field, target).map((layout) => layout.radius * (layout.count > 1 ? BIG_HOLE_MAX_RADIUS_MULTIPLIER : 1)));
}

export function getBigHoleStoneRequirementForRadius(radius: number, tier: number) {
  const clampedTier = Math.min(9, Math.max(1, tier));
  const tierMaximum = Math.round(BIG_HOLE_TIER_ONE_MAX_STONE + (BIG_HOLE_MAX_STONE - BIG_HOLE_TIER_ONE_MAX_STONE) * (clampedTier - 1) / 8);
  const sizeProgress = Math.max(0, Math.min(1, (radius - BIG_HOLE_RADIUS) / Math.max(1, maximumGeneratedHoleRadius(clampedTier) - BIG_HOLE_RADIUS)));
  return Math.max(1, Math.round(BIG_HOLE_MIN_STONE + (tierMaximum - BIG_HOLE_MIN_STONE) * sizeProgress));
}

function makeBigHoles(tier: number, field: { width: number; height: number }, random: () => number) {
  const targetArea = field.width * field.height * getMapNodeBigHoleAreaRatio(tier);
  const layouts = bigHoleLayouts(field, targetArea);
  const layout = layouts[Math.floor(random() * layouts.length)] ?? layouts.at(-1);
  if (!layout) return [];
  const radii = variedRadii(layout.count, targetArea, Math.min(layout.cellWidth, layout.cellHeight) / 2, random);
  const cells = shuffled(Array.from({ length: layout.rows * layout.columns }, (_, index) => ({ column: index % layout.columns, row: Math.floor(index / layout.columns) })), random).slice(0, layout.count);
  const centers = cells.map((cell) => ({
    x: MAP_OBSTRUCTION_MARGIN + layout.cellWidth * (cell.column + .5),
    y: MAP_OBSTRUCTION_MARGIN + layout.cellHeight * (cell.row + .5),
  }));
  for (let pass = 0; pass < 3; pass++) shuffled(centers.map((_, index) => index), random).forEach((index) => {
    const radius = radii[index];
    for (let attempt = 0; attempt < 160; attempt++) {
      const candidate = {
        x: MAP_OBSTRUCTION_MARGIN + radius + random() * Math.max(0, field.width - (MAP_OBSTRUCTION_MARGIN + radius) * 2),
        y: MAP_OBSTRUCTION_MARGIN + radius + random() * Math.max(0, field.height - (MAP_OBSTRUCTION_MARGIN + radius) * 2),
      };
      if (centers.every((center, other) => other === index || Math.hypot(candidate.x - center.x, candidate.y - center.y) >= (radius + radii[other]) * Math.max(.85, BIG_HOLE_CENTER_SPACING / 2) + 12)) { centers[index] = candidate; break; }
    }
  });
  return centers.map((center, index) => node('big-hole', 'Deep Hole', center.x, center.y, {
    obstructionRadius: radii[index],
    resourceRemaining: getBigHoleStoneRequirementForRadius(radii[index], tier),
  }));
}

function makeLake(field: { width: number; height: number }, random: () => number) {
  const targetArea = field.width * field.height * (.15 + random() * .1);
  const aspect = 1.25 + random() * .5;
  const halfHeight = Math.sqrt(targetArea / (Math.PI * aspect));
  const halfWidth = halfHeight * aspect;
  return node('lake', 'Lake',
    MAP_OBSTRUCTION_MARGIN + halfWidth + random() * Math.max(0, field.width - (MAP_OBSTRUCTION_MARGIN + halfWidth) * 2),
    MAP_OBSTRUCTION_MARGIN + halfHeight + random() * Math.max(0, field.height - (MAP_OBSTRUCTION_MARGIN + halfHeight) * 2),
    { resourceItem: 'water', cycleMs: 1000, capacity: 5, obstructionWidth: halfWidth * 2, obstructionHeight: halfHeight * 2 },
  );
}

function mapGenerationRule(x: number, y: number, seed: number) {
  const random = rng(seed ^ 0x51f15e);
  const campRandom = rng(seed ^ 0xcab005e);
  const cells = Array.from({ length: MAP_GRID_SIZE * MAP_GRID_SIZE }, (_, index) => ({ x: index % MAP_GRID_SIZE, y: Math.floor(index / MAP_GRID_SIZE) }));
  // Keep this shuffle to preserve the seeded RNG sequence for later tiers.
  shuffled(cells.filter((cell) => sectorDistance(cell.x, cell.y) === 1), random);
  const tierTwo = shuffled(cells.filter((cell) => sectorDistance(cell.x, cell.y) === 2), random);
  const minimumLakes = Math.ceil(tierTwo.length * .6);
  const lakeCount = tierTwo.length > minimumLakes ? minimumLakes + Math.floor(random() * (tierTwo.length - minimumLakes)) : minimumLakes;
  const lakes = new Set(tierTwo.slice(0, lakeCount).map((cell) => sectorId(cell.x, cell.y)));
  // Fifteen settlements in distinct sectors: five of each subtype. Keep early
  // discovery reachable and spread stronger settlements across robotics tiers.
  const camps = new Set<string>();
  const countsByTier = [0, 1, 2, 2, 2, 2, 1, 2, 2, 1];
  for (let tier = 1; tier <= 9; tier++) {
    const eligible = cells.filter((cell) => sectorDistance(cell.x, cell.y) === tier && !(cell.y === 5 && (cell.x === 6 || cell.x === 7)));
    shuffled(eligible, campRandom).slice(0, countsByTier[tier]).forEach((cell) => camps.add(sectorId(cell.x, cell.y)));
  }
  const key = sectorId(x, y);
  const golemSectors = shuffled(cells.filter(cell => sectorDistance(cell.x, cell.y) === 6 && !camps.has(sectorId(cell.x, cell.y))), rng(seed ^ 0x601e6));
  const golemIndex = golemSectors.slice(0, GOLEM_MINERALS.length).findIndex(cell => sectorId(cell.x, cell.y) === key);
  const reservedGolems = new Set(golemSectors.slice(0, GOLEM_MINERALS.length).map(cell => sectorId(cell.x, cell.y)));
  const lizards = new Set<string>();
  const lizardRandom = rng(seed ^ 0x112a4d);
  // Five of each Lizard subtype: 2/3 across tiers 4/5, 6/7, and 8/9.
  for (let tier = 4; tier <= 9; tier++) {
    const eligible = cells.filter(cell => sectorDistance(cell.x, cell.y) === tier && !camps.has(sectorId(cell.x, cell.y)) && !reservedGolems.has(sectorId(cell.x, cell.y)));
    shuffled(eligible, lizardRandom).slice(0, tier % 2 === 0 ? 2 : 3).forEach(cell => lizards.add(sectorId(cell.x, cell.y)));
  }
  return { obstruction: lakes.has(key) ? 'lake' as const : 'big-hole' as const, camp: camps.has(key), lizard: lizards.has(key), golemMineral: golemIndex >= 0 ? GOLEM_MINERALS[golemIndex] : undefined };
}

export function generateSector(x: number, y: number, seed: number, now = Date.now(), completedResearch: readonly string[] = []): SectorState {
  const distance = sectorDistance(x, y);
  const random = rng(seed ^ (x * 73856093) ^ (y * 19349663));
  const capacity = getMapNodeResourceCapacity(x, y);
  const field = getSectorWorldSize({ x, y }, completedResearch);
  const worldNodes: MachineNode[] = [];
  const rule = mapGenerationRule(x, y, seed);
  if (distance > 0 && distance < MAX_MAP_NODE_VALUE && !rule.golemMineral) {
    if (rule.obstruction === 'lake' || (x===7&&y===5)) worldNodes.push(makeLake(field, random));
    else worldNodes.push(...makeBigHoles(distance, field, random));
  }
  if (distance > 0 && distance < MAX_MAP_NODE_VALUE && (rule.camp || rule.lizard)) {
    const settlement = rule.lizard ? getLizardSettlementForMapTier(distance) : getGoblinSettlementForMapTier(distance);
    worldNodes.push(node('monster-camp', settlement.name, field.width / 2, field.height / 2, {
      ...(rule.lizard ? { lizardSettlement: settlement.settlement } : { goblinSettlement: settlement.settlement }), attackRequirement: settlement.attackRequirement,
      campStrength: 25, cycleMs: GOBLIN_CHECK_INTERVAL_MS, obstructionMaxRadius: settlement.maxRadius,
    }));
  }
  if(x===5&&y===7)worldNodes.push(node('sortingStation','Derelict Sorting Station',300,350));
  if(rule.golemMineral)worldNodes.push(node('resourceGolem',`${GOLEM_NAMES[rule.golemMineral]} Golem`,field.width / 2,field.height / 2,{health:GOLEM_AP_COST,golemMineral:rule.golemMineral,golemOutputs:[rule.golemMineral]}));
  const nodes: MachineNode[] = [...worldNodes];
  const resources: ItemId[] = distance >= MAX_MAP_NODE_VALUE ? [] : ['iron', 'copper', 'stone', 'wood'];
  if (random() < getMythrilSpawnChance(distance)) resources.push('mythril');
  resources.forEach((item, index) => {
    const angle = (index / Math.max(1, resources.length)) * Math.PI * 2 + random();
    const px = 1450 + Math.cos(angle) * (720 + random() * 260);
    const py = 950 + Math.sin(angle) * (440 + random() * 220);
    if (item === 'wood') nodes.push(node('forest', 'Forest', px, py, { resourceItem: item, resourceRemaining: capacity, resourceCapacity: capacity, regenMs: 0, cycleMs: 5000, capacity: 5 }));
    else {
      const kind: MachineNode['kind'] = item === 'stone' ? 'stoneDeposit' : item === 'iron' || item === 'copper' || item === 'mythril' ? item : 'deposit';
      const name = item === 'stone' ? 'Stone Deposit' : `${item[0].toUpperCase()}${item.slice(1)}`;
      nodes.push(node(kind, name, px, py, { resourceItem: item, resourceRemaining: capacity, resourceCapacity: capacity, cycleMs: 5000, capacity: 5 }));
    }
  });
  nodes.forEach((entry, index) => { entry.id = `${x}-${y}-${entry.kind}-${index}`; });
  const placed: MachineNode[] = [];
  nodes.forEach((entry) => {
    if (entry.kind === 'big-hole' || entry.kind === 'lake') { placed.push(entry); return; }
    const campStrength = entry.kind === 'monster-camp' ? entry.campStrength : undefined;
    if (entry.kind === 'monster-camp') entry.campStrength = 100;
    const isResource = (candidate: MachineNode) => Boolean(candidate.resourceItem && candidate.kind !== 'lake');
    const valid = () => canPlaceNode(entry, placed, field) && (!isResource(entry) || !placed.some((other) => isResource(other) && nodesOverlap(entry, other, 160)));
    for (let attempt = 0; attempt < 1000 && !valid(); attempt++) {
      entry.x = 220 + random() * (field.width - 440);
      entry.y = 190 + random() * (field.height - 380);
    }
    if (!valid()) {
      search: for (let y = 190; y < field.height - 190; y += 80) for (let x = 220; x < field.width - 220; x += 80) {
        entry.x = x; entry.y = y;
        if (valid()) break search;
      }
    }
    if (campStrength !== undefined) entry.campStrength = campStrength;
    placed.push(entry);
  });
  return { id: sectorId(x, y), x, y, name: 'Unnamed Node', label: '◆', unlocked: false, nodes, connections: [], camera: { x: -450, y: -260, zoom: .65 }, lastSimulatedAt: now };
}
