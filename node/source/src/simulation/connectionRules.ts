import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, isWorldObstacle, needsRecipeSelection } from '../content/nodeCapabilities';
import { isProductionMachine } from '../content/productionNodes';
import type { Connection, ItemId, MachineNode, PortFamily } from '../domain/types';
import { cornerCampInward, getPortAnchor } from '../domain/nodeGeometry';
import { segmentCrossesObstruction, type Point } from '../domain/obstructionGeometry';
import { FILTERABLE_ITEMS, isFluidItem } from '../content/items';
import { isCartKind } from '../content/cartUpgrades';
import { CORE_ITEMS, WASTE_ITEMS } from '../content/progression';
import { BOT_FRAMES, BOT_GUNS, BOT_ITEMS, cargoMaterial } from '../content/botAssembly';
import { modNode, modNodeTemplate, modResearchAccepts, modReserveItems } from '../mods/modRules';
import { recyclerRecipeForMaterial } from '../content/recipes';

export type PortDirection = 'input' | 'output';
export type PortSide = 'north' | 'east' | 'south' | 'west';

const RESOURCE: ItemId[] = ['wood', 'iron', 'copper', 'mythril', 'stone', 'water'];

export const expandPortFamily = (family: PortFamily): ItemId[] => {
  if (family === 'FLUID') return ['water', 'coolant'];
  if (family === 'ANY') return FILTERABLE_ITEMS;
  if (family === 'WASTE') return WASTE_ITEMS;
  if (family === 'RESOURCE') return [...RESOURCE, ...modReserveItems().filter(item => !RESOURCE.includes(item))];
  if (family === 'METAL') return ['iron', 'copper', 'mythril'];
  if (family === 'PLATE') return ['iron-plate', 'copper-plate', 'mythril-plate'];
  if (family === 'GEAR') return ['iron-gear', 'copper-gear', 'mythril-gear'];
  if (family === 'CORE') return CORE_ITEMS;
  if (family === 'ROBOT_FRAME') return [...BOT_FRAMES];
  if (family === 'ROBOT_WEAPON') return [...BOT_GUNS];
  if (family === 'ATTACK_POWER') return BOT_ITEMS;
  if (family === 'POWER') return ['power'];
  return [family];
};

export const portFamilyAcceptsItem = (family: PortFamily, item: ItemId) => expandPortFamily(family).includes(item);

/** Checks the concrete item against the exact semantic input socket, independent of its visual row. */
export function inputPortAcceptsItem(target: MachineNode, toPort: number, item: ItemId, completedResearch: readonly string[] = []) {
  if (target.kind === 'recycler') {
    if (toPort === 1) return item === 'water';
    return toPort === 0 && recyclerRecipeForMaterial(item, completedResearch) !== undefined;
  }
  if (isCartKind(target.kind) && isFluidItem(item)) return false;
  if (hasNodeBehavior(target.kind, 'research') && toPort === 0 && modResearchAccepts(item)) return true;
  const input = getEffectiveNodeInputFamilies(target, completedResearch)[toPort];
  return Boolean(input && portFamilyAcceptsItem(input, item));
}

export function roadVehicleError(source: MachineNode, target: MachineNode) {
  if (target.kind === 'road' && !isCartKind(source.kind)) return 'Connect a Cart, Truck, or Train directly to the sending Road.';
  if (source.kind === 'road' && !isCartKind(target.kind)) return 'Connect the receiving Road directly to a Cart, Truck, or Train.';
}

export function portFamiliesCompatible(source: MachineNode, fromPort: number, target: MachineNode, toPort: number, completedResearch: readonly string[] = []) {
  if (roadVehicleError(source, target)) return false;
  const output = getEffectiveNodeOutputFamilies(source)[fromPort]; const input = getEffectiveNodeInputFamilies(target, completedResearch)[toPort];
  if (!output || !input) return false;
  if (source.kind === 'devSource') return true;
  if ((hasNodeBehavior(source.kind, 'resource') || source.infiniteResource) && !hasNodeBehavior(target.kind, 'extractor') && !getNodeCapabilities(target.kind).passThrough) return false;
  if (hasNodeBehavior(source.kind, 'inventory') && !hasNodeBehavior(target.kind, 'filter')) return false;
  if (source.kind === 'stoneDeposit' && hasNodeBehavior(target.kind, 'big-hole')) return false;
  if (hasNodeBehavior(source.kind, 'lake') && hasNodeBehavior(target.kind, 'extractor')) return false;
  if (source.kind === 'goblinTribute' && target.kind === 'extractor') return false;
  if (hasNodeBehavior(target.kind, 'research') && toPort === 0 && expandPortFamily(output).some(modResearchAccepts)) return true;
  if (output === 'POWER' || input === 'POWER') return output === 'POWER' && (input === 'POWER' || getNodeCapabilities(target.kind).acceptsPowerRelay);
  if (output === 'forest-growth' || input === 'forest-growth') return output === input;
  return expandPortFamily(output).some((item) => inputPortAcceptsItem(target, toPort, item, completedResearch));
}

export function isMultiConnectionPort(node: MachineNode, direction: PortDirection, _port: number) {
  const capabilities = getNodeCapabilities(node.kind);
  if (direction === 'input') return Boolean(capabilities.multiInput);
  return Boolean(capabilities.multiOutput);
}

export interface ConnectionPlan { fromPort: number; toPort: number; replace: string[] }

export function resolveExactConnectionPlan(source: MachineNode, fromPort: number, target: MachineNode, toPort: number, connections: readonly Connection[], completedResearch: readonly string[] = []): ConnectionPlan | undefined {
  if (source.kind !== 'devSource' && (needsRecipeSelection(source) || needsRecipeSelection(target))) return undefined;
  if (source.id === target.id || source.disabled || target.disabled || !portFamiliesCompatible(source, fromPort, target, toPort, completedResearch)) return undefined;
  if (modNodeTemplate(target.kind) === 'merger') {
    const retainedType = connections.find((connection) => connection.to === target.id && connection.item)?.item;
    const sourceItems = expandPortFamily(getEffectiveNodeOutputFamilies(source)[fromPort]);
    if (retainedType && sourceItems.length === 1 && cargoMaterial(sourceItems[0]) !== cargoMaterial(retainedType)) return undefined;
  }
  if (connections.some((connection) => connection.from === source.id && connection.to === target.id && (connection.fromPort ?? 0) === fromPort && (connection.toPort ?? 0) === toPort)) return undefined;
  const replace = connections.filter((connection) =>
    (!isMultiConnectionPort(source, 'output', fromPort) && connection.from === source.id && (connection.fromPort ?? 0) === fromPort) ||
    (!isMultiConnectionPort(target, 'input', toPort) && connection.to === target.id && (connection.toPort ?? 0) === toPort)
  ).map((connection) => connection.id);
  const retained = connections.filter(connection => !replace.includes(connection.id));
  const maxOutput = modNode(source.kind)?.maxOutputConnections;
  const maxInput = modNode(target.kind)?.maxInputConnections;
  if (maxOutput !== undefined && retained.filter(c => c.from === source.id).length >= maxOutput) return undefined;
  if (maxInput !== undefined && retained.filter(c => c.to === target.id).length >= maxInput) return undefined;
  return { fromPort, toPort, replace };
}

export function resolveConnectionPlan(source: MachineNode, target: MachineNode, connections: readonly Connection[], completedResearch: readonly string[] = [], acceptsPlan?: (plan: ConnectionPlan) => boolean): ConnectionPlan | undefined {
  if (source.kind !== 'devSource' && (needsRecipeSelection(source) || needsRecipeSelection(target))) return undefined;
  if (source.id === target.id || source.disabled || target.disabled) return undefined;
  const outputs = getEffectiveNodeOutputFamilies(source); const inputs = getEffectiveNodeInputFamilies(target, completedResearch);
  const plans: Array<ConnectionPlan & { cost: number }> = [];
  outputs.forEach((_output, fromPort) => inputs.forEach((_input, toPort) => {
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, connections, completedResearch);
    if (plan && (!acceptsPlan || acceptsPlan(plan))) plans.push({ ...plan, cost: plan.replace.length });
  }));
  plans.sort((a, b) => a.cost - b.cost || a.fromPort - b.fromPort || a.toPort - b.toPort);
  const selected = plans[0]; return selected ? { fromPort: selected.fromPort, toPort: selected.toPort, replace: selected.replace } : undefined;
}

const rotatedSide = (base: PortSide, rotation: number): PortSide => {
  const sides: PortSide[] = ['north', 'east', 'south', 'west']; const index = sides.indexOf(base);
  return sides[(index + Math.round(rotation / 90)) % 4];
};

export function getPortSide(node: MachineNode, direction: PortDirection, port: number): PortSide {
  if (node.kind === 'cornerChallenge' && node.cornerCampQuadrant && direction === 'input') return cornerCampInward(node.cornerCampQuadrant).x > 0 ? 'east' : 'west';
  if (node.infiniteResource && direction === 'output') return (['north', 'east', 'south', 'west'] as PortSide[])[port % 4];
  if ((node.kind === 'road' || node.kind === 'fluidRoad') && node.roadFacing) return node.roadFacing;
  if (node.kind === 'lake') return (['north', 'east', 'south', 'west'] as PortSide[])[port % 4];
  if (node.kind === 'powerSplitter' && direction === 'output') return rotatedSide((['north', 'east', 'south'] as PortSide[])[port % 3], node.rotation);
  const mirrored = isProductionMachine(node) && node.connectorsMirrored;
  const base = (direction === 'output') !== Boolean(mirrored) ? 'east' : 'west';
  return NODE_DEFINITIONS[node.kind].category === 'Logistics' && !isCartKind(node.kind) ? rotatedSide(base, node.rotation) : base;
}

const vector = (side: PortSide) => side === 'north' ? { x: 0, y: -1 } : side === 'south' ? { x: 0, y: 1 } : side === 'west' ? { x: -1, y: 0 } : { x: 1, y: 0 };

export function getConnectionControlPoints(start: { x: number; y: number }, end: { x: number; y: number }, sourceSide: PortSide = 'east', targetSide: PortSide = 'west') {
  const distance = Math.hypot(end.x - start.x, end.y - start.y); const reach = Math.max(24, Math.min(180, distance * .45)); const source = vector(sourceSide); const target = vector(targetSide);
  return { first: { x: start.x + source.x * reach, y: start.y + source.y * reach }, second: { x: end.x + target.x * reach, y: end.y + target.y * reach } };
}

export function connectionBlockedByWorld(source: MachineNode, target: MachineNode, plan: Pick<ConnectionPlan, 'fromPort' | 'toPort'>, nodes: readonly MachineNode[]) {
  return Boolean(connectionObstruction(source, target, plan, nodes));
}

export function connectionObstruction(source: MachineNode, target: MachineNode, plan: Pick<ConnectionPlan, 'fromPort' | 'toPort'>, nodes: readonly MachineNode[]) {
  const startAnchor = getPortAnchor(source, 'output', plan.fromPort); const endAnchor = getPortAnchor(target, 'input', plan.toPort);
  const start = { x: source.x + startAnchor.x, y: source.y + startAnchor.y }; const end = { x: target.x + endAnchor.x, y: target.y + endAnchor.y };
  const controls = getConnectionControlPoints(start, end, getPortSide(source, 'output', plan.fromPort), getPortSide(target, 'input', plan.toPort));
  const obstacles = nodes.filter((node) => node.id !== source.id && node.id !== target.id && isWorldObstacle(node.kind));
  if (!obstacles.length) return undefined;
  const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  // Flatten adaptively to a quarter world unit, then intersect entire segments.
  // A small obstruction cannot fall between a fixed set of sample points.
  const visit = (a: Point, first: Point, second: Point, b: Point, depth: number): MachineNode | undefined => {
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const deviation = length ? Math.max(Math.abs(dx * (first.y - a.y) - dy * (first.x - a.x)), Math.abs(dx * (second.y - a.y) - dy * (second.x - a.x))) / length : Math.max(Math.hypot(first.x - a.x, first.y - a.y), Math.hypot(second.x - a.x, second.y - a.y));
    if (deviation <= .25 || depth >= 16) return obstacles.find(obstacle => segmentCrossesObstruction(a, b, obstacle));
    const ab = midpoint(a, first), bc = midpoint(first, second), cd = midpoint(second, b);
    const abc = midpoint(ab, bc), bcd = midpoint(bc, cd), center = midpoint(abc, bcd);
    return visit(a, ab, abc, center, depth + 1) ?? visit(center, bcd, cd, b, depth + 1);
  };
  return visit(start, controls.first, controls.second, end, 0);
}
