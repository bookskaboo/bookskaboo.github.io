import { createCornerNodes, syncCornerLayout } from './endgameRuntime';
import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { DEFAULT_WORLD_GRID_SIZE, HOME_COORDINATE as HOME, worldCornerIds, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import { modNode, modRule, modWorldSpawns, modWorldVariants } from '../mods/modRules';
import { WORLD_SPAWN_MAX_TIER, type ModNode, type ModWorldSpawn } from '../mods/modTypes';
import { canPlaceNode, nodesOverlap, NODE_CLEARANCE } from './collisions';
import { overlapsMaximumCampRadius } from '../domain/obstructionGeometry';
import { getGoblinSettlementForMapTier, GOBLIN_CHECK_INTERVAL_MS } from '../content/goblinSettlements';
import { GOLEM_COST_VERSION, GOLEM_MINERALS, GOLEM_NAMES, GOLEM_PLACEMENT_TIER, LEGACY_GOLEM_PLACEMENT_TIER, golemApCost, type GolemPlacementTier } from '../content/resourceGolems';
import { getLizardSettlementForMapTier } from '../content/lizardSettlements';

const BASE_MAX_RESOURCE_TIER = DEFAULT_WORLD_GRID_SIZE - 1;
const BASE_RESOURCE_CAPACITY = 1000;
const RESOURCE_CAPACITY_PER_TIER = 500;
const MAP_OBSTRUCTION_MARGIN = 72;
const MAX_GENERATED_BIG_HOLE_COUNT = 5;
const BIG_HOLE_RADIUS = 38;
const BIG_HOLE_MAX_RADIUS_MULTIPLIER = 1.25;
const BIG_HOLE_CENTER_SPACING = 1.7;
const BIG_HOLE_MIN_STONE = 20;
const BIG_HOLE_TIER_ONE_MAX_STONE = 500;
const BIG_HOLE_MAX_STONE = 4000;
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
export const getMapNodeMaximumResourceCapacity = (x: number, y: number) => Math.round((BASE_RESOURCE_CAPACITY + Math.min(BASE_MAX_RESOURCE_TIER, sectorDistance(x, y)) * RESOURCE_CAPACITY_PER_TIER) * modRule('mapResourceMultiplier'));
/** The four corner sectors have no ordinary reserves. */
export const getMapNodeResourceCapacity = (x: number, y: number, gridSize = DEFAULT_WORLD_GRID_SIZE) => sectorDistance(x, y) >= gridSize - 1 ? 0 : getMapNodeMaximumResourceCapacity(x, y);
/** Mythril comes from Dwarven Tribute and the approved Golem reserve only. */
export const getMythrilSpawnChance = (_tier: number) => 0;

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
    width: Math.round(BASE_WORLD_SIZE.width * distanceMultiplier * researchMultiplier * modRule('mapWidthMultiplier')),
    height: Math.round(BASE_WORLD_SIZE.height * distanceMultiplier * researchMultiplier * modRule('mapHeightMultiplier')),
  };
}

export function syncCornerLayouts(state: GameState) {
  for (const id of worldCornerIds(worldGridSize(state))) {
    const sector = state.sectors[id];
    if (sector) syncCornerLayout(sector, getSectorWorldSize(sector, state.research.completed), state);
  }
}

function node(kind: MachineNode['kind'], name: string, x: number, y: number, extra: Partial<MachineNode> = {}): MachineNode {
  const patch = modNode(kind);
  return {
    id: id(kind), kind, name, x, y, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000,
    constructedAt: 0, constructionMs: 0, ...extra,
    ...(patch?.name ? { name: patch.name, modBaseName: name } : {}),
    ...(patch?.resourceCapacity !== undefined && extra.resourceCapacity !== undefined ? { resourceCapacity: patch.resourceCapacity, resourceRemaining: patch.resourceCapacity } : {}),
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
  return .15 + (.35 - .15) * progression;
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

function maximumGeneratedHoleRadius(tier: number, field: { width: number; height: number }) {
  const target = field.width * field.height * getMapNodeBigHoleAreaRatio(tier);
  return Math.max(BIG_HOLE_RADIUS, ...bigHoleLayouts(field, target).map((layout) => layout.radius * (layout.count > 1 ? BIG_HOLE_MAX_RADIUS_MULTIPLIER : 1)));
}

export function getBigHoleStoneRequirementForRadius(radius: number, tier: number, field?: { width: number; height: number }) {
  const clampedTier = Math.min(9, Math.max(1, tier));
  const baseField = getSectorWorldSize({ x: HOME + clampedTier, y: HOME }, []);
  const baseRadius = field ? radius * Math.sqrt((baseField.width * baseField.height) / (field.width * field.height)) : radius;
  const tierMaximum = Math.round(BIG_HOLE_TIER_ONE_MAX_STONE + (BIG_HOLE_MAX_STONE - BIG_HOLE_TIER_ONE_MAX_STONE) * (clampedTier - 1) / 8);
  const sizeProgress = Math.max(0, Math.min(1, (baseRadius - BIG_HOLE_RADIUS) / Math.max(1, maximumGeneratedHoleRadius(clampedTier, baseField) - BIG_HOLE_RADIUS)));
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
    resourceRemaining: getBigHoleStoneRequirementForRadius(radii[index], tier, field),
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

function makeCamp(tier: number, field: { width: number; height: number }, dwarven = false) {
  const settlement = dwarven ? getLizardSettlementForMapTier(tier) : getGoblinSettlementForMapTier(tier);
  return node('monster-camp', settlement.name, field.width / 2, field.height / 2, {
    ...(dwarven ? { lizardSettlement: settlement.settlement, settlementMapTier: tier, tributeItem: 'mythril', tributeSelectionVersion: 1 } : { goblinSettlement: settlement.settlement }),
    attackRequirement: settlement.attackRequirement, campStrength: 25, cycleMs: GOBLIN_CHECK_INTERVAL_MS, obstructionMaxRadius: settlement.maxRadius,
  });
}

const spawnRegions: Record<NonNullable<ModWorldSpawn['region']>, [left: number, top: number, right: number, bottom: number]> = {
  anywhere: [0, 0, 1, 1], center: [.25, .25, .75, .75],
  northwest: [0, 0, .5, .5], northeast: [.5, 0, 1, .5],
  southwest: [0, .5, .5, 1], southeast: [.5, .5, 1, 1],
};

function makeModSpawn(kind: MachineNode['kind'], patch: ModNode, tier: number, capacity: number, field: { width: number; height: number }, random: () => number) {
  const template = patch.template ?? kind;
  if (template === 'lake') return makeLake(field, random);
  if (template === 'monster-camp') return makeCamp(tier, field);
  if (template === 'big-hole') {
    const radius = Math.min(field.width, field.height) * (.09 + random() * .05);
    return node('big-hole', 'Deep Hole', 0, 0, {
      obstructionRadius: radius, resourceRemaining: getBigHoleStoneRequirementForRadius(radius, tier, field),
    });
  }
  const item = template === 'stoneDeposit' ? 'stone' : template === 'forest' ? 'wood' : template as 'iron' | 'copper' | 'mythril';
  const name = template === 'stoneDeposit' ? 'Stone Deposit' : template === 'forest' ? 'Forest' : `${item[0].toUpperCase()}${item.slice(1)}`;
  return node(kind, name, 0, 0, {
    resourceItem: patch.resourceItem ?? item, resourceRemaining: capacity, resourceCapacity: capacity, cycleMs: 5000, capacity: 5,
    ...(template === 'forest' ? { regenMs: 0 } : {}),
  });
}

function addModSpawns(nodes: MachineNode[], x: number, y: number, sectorSeed: number, field: { width: number; height: number }, capacity: number) {
  const tier = sectorDistance(x, y);
  const isReserve = (entry: MachineNode) => entry.resourceItem && entry.kind !== 'lake';
  for (const [kind, patch] of modWorldSpawns()) {
    const { minTier = 1, maxTier = WORLD_SPAWN_MAX_TIER, chance = 1, count = 1, region = 'anywhere' } = patch.worldSpawn;
    if (tier < minTier || tier > maxTier) continue;
    // Each rule has its own seeded stream, independent of the base layout and the order of entries in a pack.
    let hash = 0x4e4f4445;
    for (const letter of kind) hash = Math.imul(hash ^ letter.charCodeAt(0), 0x01000193);
    const random = rng(sectorSeed ^ hash);
    if (random() >= chance) continue;
    const [left, top, right, bottom] = spawnRegions[region];
    for (let index = 0; index < count; index++) {
      const entry = makeModSpawn(kind, patch, tier, capacity, field, random);
      entry.id = `mod-spawn-${x}-${y}-${kind}-${index}`;
      const camp = entry.kind === 'monster-camp' ? { ...entry, campStrength: 100 } : undefined;
      const footprint = camp ?? entry;
      for (let attempt = 0; attempt < 128; attempt++) {
        entry.x = footprint.x = (left + random() * (right - left)) * field.width;
        entry.y = footprint.y = (top + random() * (bottom - top)) * field.height;
        if (!canPlaceNode(footprint, nodes, field) || nodes.some(other =>
          (other.kind === 'monster-camp' && overlapsMaximumCampRadius(footprint, other, NODE_CLEARANCE)) ||
          (camp && overlapsMaximumCampRadius(other, camp, NODE_CLEARANCE)) ||
          (isReserve(entry) && isReserve(other) && nodesOverlap(entry, other, 160)))) continue;
        nodes.push(entry);
        break;
      }
    }
  }
}

type MapCell = { x: number; y: number; key: string; quadrant: number };

// Clockwise from northwest, with each quadrant owning one adjacent Home axis.
function mapQuadrant(x: number, y: number) {
  if (y < HOME) return x <= HOME ? 0 : 1;
  if (y > HOME) return x < HOME ? 3 : 2;
  return x > HOME ? 1 : 3;
}

function takeBalanced(candidates: MapCell[], count: number, totals: number[]) {
  const remaining = [...candidates];
  const chosen: MapCell[] = [];
  while (chosen.length < count && remaining.length) {
    // Candidates are shuffled, so the seed breaks ties between equally served quadrants.
    const index = remaining.reduce((best, cell, index) => totals[cell.quadrant] < totals[remaining[best].quadrant] ? index : best, 0);
    const [cell] = remaining.splice(index, 1);
    chosen.push(cell);
    totals[cell.quadrant]++;
  }
  return chosen;
}

function buildMapLayout(seed: number, golemTier: GolemPlacementTier, balanced: boolean, gridSize: number) {
  const random = rng(seed ^ 0x51f15e);
  const campRandom = rng(seed ^ 0xcab005e);
  const tiers: MapCell[][] = Array.from({ length: gridSize }, () => []);
  const { min, max } = worldGridBounds(gridSize);
  for (let y = min; y <= max; y++) for (let x = min; x <= max; x++) {
    tiers[sectorDistance(x, y)].push({ x, y, key: sectorId(x, y), quadrant: mapQuadrant(x, y) });
  }
  const countsByTier = [0, 1, 2, 2, 2, 2, 1, 2, 2, 1];
  // Keep this shuffle to preserve the seeded tier-two Lake layout.
  shuffled(tiers[1], random);
  const tierTwo = shuffled(tiers[2], random);
  const minimumLakes = Math.ceil(tierTwo.length * .6);
  const lakeCount = tierTwo.length > minimumLakes ? minimumLakes + Math.floor(random() * (tierTwo.length - minimumLakes)) : minimumLakes;
  const guaranteedLake = sectorId(7, 5);
  const otherLakeSlots = tierTwo.length - countsByTier[2] - 1;
  const earlyLakes = tierTwo.slice(0, lakeCount).filter(cell => cell.key !== guaranteedLake).slice(0, otherLakeSlots);
  earlyLakes.push(tierTwo.find(cell => cell.key === guaranteedLake)!);
  const lakes = new Set(earlyLakes.map(cell => cell.key));
  // Fifteen settlements in distinct sectors: five of each subtype. Keep early
  // discovery reachable and spread stronger settlements across robotics tiers.
  const camps = new Set<string>();
  const campTotals = [0, 0, 0, 0];
  for (let tier = 1; tier <= 9; tier++) {
    const eligible = tiers[tier].filter(cell => !(cell.y === HOME && (cell.x === HOME + 1 || cell.x === HOME + 2)));
    // Filter after shuffling so Lake exclusions do not move camps on later tiers.
    const available = shuffled(eligible, campRandom).filter(cell => !lakes.has(cell.key));
    const chosen = balanced ? takeBalanced(available, countsByTier[tier], campTotals) : available.slice(0, countsByTier[tier]);
    chosen.forEach(cell => camps.add(cell.key));
  }
  const golemCandidates = shuffled(tiers[golemTier].filter(cell => !camps.has(cell.key)
    && (!balanced || (cell.x !== HOME && cell.y !== HOME))), rng(seed ^ 0x601e6));
  const golemSectors = balanced ? takeBalanced(golemCandidates, GOLEM_MINERALS.length, [0, 0, 0, 0]) : golemCandidates.slice(0, GOLEM_MINERALS.length);
  const golems = new Map(golemSectors.map((cell, index) => [cell.key, GOLEM_MINERALS[index]]));
  const lizards = new Set<string>();
  const lizardRandom = rng(seed ^ 0x112a4d);
  // Five of each Dwarven subtype: 2/3 across tiers 4/5, 6/7, and 8/9.
  for (let tier = 4; tier <= 9; tier++) {
    const available = shuffled(tiers[tier].filter(cell => !camps.has(cell.key) && !golems.has(cell.key)), lizardRandom);
    const count = tier % 2 === 0 ? 2 : 3;
    const chosen = balanced ? takeBalanced(available, count, campTotals) : available.slice(0, count);
    chosen.forEach(cell => lizards.add(cell.key));
  }
  const clear = new Set([sectorId(HOME + 1, HOME)]);
  const reserved = new Set([...lakes, ...camps, ...lizards, ...golems.keys()]);
  const laterLakeChoices: { candidates: MapCell[]; quadrantCount: number }[] = [];
  for (let tier = 2; tier < gridSize - 1; tier++) {
    const ordinary = shuffled(tiers[tier].filter(cell => !reserved.has(cell.key)), rng(seed ^ 0xace71 ^ tier));
    const clearCount = Math.round(ordinary.length / 4);
    ordinary.slice(0, clearCount).forEach(cell => clear.add(cell.key));
    const candidates = ordinary.slice(clearCount);
    if (tier < 3 || !candidates.length) continue;
    const lakeRandom = rng(seed ^ 0x1a4e ^ tier);
    if (balanced) laterLakeChoices.push({ candidates: shuffled(candidates, lakeRandom), quadrantCount: new Set(candidates.map(cell => cell.quadrant)).size });
    else lakes.add(candidates[Math.floor(lakeRandom() * candidates.length)].key);
  }
  const lakeTotals = [0, 0, 0, 0];
  earlyLakes.forEach(cell => lakeTotals[cell.quadrant]++);
  // Place Lakes in constrained tiers first so tiers with more choices can fill the gaps.
  laterLakeChoices.sort((a, b) => a.quadrantCount - b.quadrantCount);
  for (const { candidates } of laterLakeChoices) lakes.add(takeBalanced(candidates, 1, lakeTotals)[0].key);
  return { lakes, clear, camps, lizards, golems };
}

let cachedLayout: { seed: number; golemTier: GolemPlacementTier; balanced: boolean; gridSize: number; layout: ReturnType<typeof buildMapLayout> } | undefined;

function getMapLayout(seed: number, golemTier: GolemPlacementTier, balanced: boolean, gridSize: number) {
  if (cachedLayout?.seed !== seed || cachedLayout.golemTier !== golemTier || cachedLayout.balanced !== balanced || cachedLayout.gridSize !== gridSize) {
    cachedLayout = { seed, golemTier, balanced, gridSize, layout: buildMapLayout(seed, golemTier, balanced, gridSize) };
  }
  return cachedLayout.layout;
}

export function getGolemPlacementTier(state: GameState): GolemPlacementTier {
  // Keep old reserved locations once a save has generated sectors in the affected tiers.
  return state.golemPlacementTier ?? (Object.values(state.sectors).some(sector => sectorDistance(sector.x, sector.y) >= GOLEM_PLACEMENT_TIER)
    ? LEGACY_GOLEM_PLACEMENT_TIER : GOLEM_PLACEMENT_TIER);
}

export function getEncounterLayoutVersion(state: GameState): 1 | 2 {
  // Mixing layouts could lose or duplicate encounters in a partly generated world.
  return state.encounterLayoutVersion ?? (Object.values(state.sectors).some(sector => sectorDistance(sector.x, sector.y) > 0) ? 1 : 2);
}

export function sectorForState(state: GameState, x: number, y: number): SectorState {
  return state.sectors[sectorId(x, y)] ?? generateSector(x, y, state.seed, Date.now(), state.research.completed, getGolemPlacementTier(state), getEncounterLayoutVersion(state), worldGridSize(state));
}

export function generateSector(x: number, y: number, seed: number, now = Date.now(), completedResearch: readonly string[] = [], golemTier: GolemPlacementTier = GOLEM_PLACEMENT_TIER, encounterLayoutVersion: 1 | 2 = golemTier === LEGACY_GOLEM_PLACEMENT_TIER ? 1 : 2, gridSize = DEFAULT_WORLD_GRID_SIZE): SectorState {
  const distance = sectorDistance(x, y);
  const isOuterCorner = distance === gridSize - 1;
  const sectorSeed = seed ^ (x * 73856093) ^ (y * 19349663);
  const random = rng(sectorSeed);
  const capacity = getMapNodeResourceCapacity(x, y, gridSize);
  const field = getSectorWorldSize({ x, y }, completedResearch);
  const worldNodes: MachineNode[] = [];
  const key = sectorId(x, y);
  const layout = getMapLayout(seed, golemTier, encounterLayoutVersion === 2, gridSize);
  const golemMineral = layout.golems.get(key);
  const dwarvenCamp = layout.lizards.has(key);
  const replaces = (kind: MachineNode['kind']) => modNode(kind)?.worldSpawn?.mode === 'replace';
  if (distance > 0 && !isOuterCorner && !golemMineral) {
    if (layout.lakes.has(key)) {
      const lake = makeLake(field, random);
      if (!replaces('lake')) worldNodes.push(lake);
    } else if (!layout.clear.has(key)) {
      const holes = makeBigHoles(distance, field, random);
      if (!replaces('big-hole')) worldNodes.push(...holes);
    }
  }
  if (dwarvenCamp || (layout.camps.has(key) && !replaces('monster-camp'))) {
    worldNodes.push(makeCamp(distance, field, dwarvenCamp));
  }
  if(x===5&&y===7)worldNodes.push(node('sortingStation','Sorting Ruin',300,350));
  if (golemMineral) {
    worldNodes.push(node('resourceGolem', `${GOLEM_NAMES[golemMineral]} Golem`, field.width / 2, field.height / 2, {
      health: golemApCost({ golemMineral }), golemCostVersion: GOLEM_COST_VERSION, golemMineral, golemOutputs: [golemMineral],
    }));
  }
  const nodes: MachineNode[] = [...worldNodes, ...createCornerNodes(x, y, seed, field, undefined, gridSize)];
  const resources: ItemId[] = isOuterCorner ? [] : ['iron', 'copper', 'stone', 'wood'];
  if (random() < getMythrilSpawnChance(distance)) resources.push('mythril');
  const variants = modWorldVariants();
  const variantRandom = rng(sectorSeed ^ 0x23c0ffee);
  resources.forEach((item, index) => {
    const angle = (index / Math.max(1, resources.length)) * Math.PI * 2 + random();
    const px = 1450 + Math.cos(angle) * (720 + random() * 260);
    const py = 950 + Math.sin(angle) * (440 + random() * 220);
    if (item === 'wood') {
      if (!replaces('forest')) nodes.push(node('forest', 'Forest', px, py, { resourceItem: item, resourceRemaining: capacity, resourceCapacity: capacity, regenMs: 0, cycleMs: 5000, capacity: 5 }));
    } else {
      const kind: MachineNode['kind'] = item === 'stone' ? 'stoneDeposit' : item === 'iron' || item === 'copper' || item === 'mythril' ? item : 'deposit';
      if (replaces(kind)) return;
      const name = item === 'stone' ? 'Stone Deposit' : `${item[0].toUpperCase()}${item.slice(1)}`;
      const variant = variants.find(([, patch]) => patch.template === kind && !patch.worldSpawn && variantRandom() < (patch.worldChance ?? 0.25));
      const resourceItem = variant?.[1].resourceItem ?? item;
      nodes.push(node(variant?.[0] ?? kind, name, px, py, { resourceItem, resourceRemaining: capacity, resourceCapacity: capacity, cycleMs: 5000, capacity: 5 }));
    }
  });
  nodes.forEach((entry, index) => { if(entry.kind==='cornerChallenge'||entry.kind==='cornerTribute')return; entry.id = `${x}-${y}-${entry.kind}-${index}`; });
  const placed: MachineNode[] = [];
  nodes.forEach((entry) => {
    if (entry.kind === 'big-hole' || entry.kind === 'lake') { placed.push(entry); return; }
    const campStrength = entry.kind === 'monster-camp' ? entry.campStrength : undefined;
    if (entry.kind === 'monster-camp') entry.campStrength = 100;
    const isResource = (candidate: MachineNode) => Boolean(candidate.resourceItem && candidate.kind !== 'lake');
    const valid = () => canPlaceNode(entry, placed, field) && (!isResource(entry) || !placed.some((other) =>
      (isResource(other) && nodesOverlap(entry, other, 160)) || (other.kind === 'monster-camp' && overlapsMaximumCampRadius(entry, other, NODE_CLEARANCE))));
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
    const located = valid();
    if (campStrength !== undefined) entry.campStrength = campStrength;
    if (!located) throw new Error(`No clear position for ${entry.name} on map ${x},${y}`);
    placed.push(entry);
  });
  if (!isOuterCorner) addModSpawns(nodes, x, y, sectorSeed, field, capacity);
  return { id: sectorId(x, y), x, y, name: 'Unnamed Node', label: '◆', unlocked: false, nodes, connections: [], camera: { x: -450, y: -260, zoom: .65 }, lastSimulatedAt: now };
}
