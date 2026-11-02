import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, isWorldObstacle } from '../content/nodeCapabilities';
import { isProductionMachine } from '../content/productionNodes';
import type { Connection, ItemId, MachineNode, PortFamily } from '../domain/types';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { FILTERABLE_ITEMS } from '../content/items';
import { CORE_ITEMS, WASTE_ITEMS, BOT_STRENGTH } from '../content/progression';

export type PortDirection = 'input' | 'output';
export type PortSide = 'north' | 'east' | 'south' | 'west';

const RESOURCE: ItemId[] = ['wood', 'iron', 'copper', 'mythril', 'stone', 'water'];
const MATERIAL: ItemId[] = [...RESOURCE, 'brick', 'charcoal', 'iron-plate', 'copper-plate', 'mythril-plate', 'iron-gear', 'copper-gear', 'mythril-gear', 'iron-wire', 'copper-wire', 'mythril-wire', 'motor', 'circuit-a', 'simple-core', 'basic-core', 'automata-core', 'simple-robot-frame', 'simple-robot-gun', 'suppression-bot'];

export const expandPortFamily = (family: PortFamily): ItemId[] => {
  if (family === 'FLUID') return ['water', 'coolant'];
  if (family === 'ANY') return [...new Set([...MATERIAL,...FILTERABLE_ITEMS])];
  if (family === 'WASTE') return WASTE_ITEMS;
  if (family === 'RESOURCE') return RESOURCE;
  if (family === 'METAL') return ['iron', 'copper', 'mythril'];
  if (family === 'PLATE') return ['iron-plate', 'copper-plate', 'mythril-plate'];
  if (family === 'GEAR') return ['iron-gear', 'copper-gear', 'mythril-gear'];
  if (family === 'CORE') return CORE_ITEMS;
  if (family === 'ROBOT_FRAME') return ['simple-robot-frame','sealed-frame','mithril-frame','servo-frame'];
  if (family === 'ROBOT_WEAPON') return ['simple-robot-gun','cooled-gun','focused-gun','pulse-cannon'];
  if (family === 'ATTACK_POWER') return Object.keys(BOT_STRENGTH) as ItemId[];
  if (family === 'POWER') return ['power'];
  return [family];
};

export const portFamilyAcceptsItem = (family: PortFamily, item: ItemId) => expandPortFamily(family).includes(item);

/** Checks the concrete item against the exact semantic input socket, independent of its visual row. */
export function inputPortAcceptsItem(target: MachineNode, toPort: number, item: ItemId, completedResearch: readonly string[] = []) {
  const input = getEffectiveNodeInputFamilies(target, completedResearch)[toPort];
  return Boolean(input && portFamilyAcceptsItem(input, item));
}

export function portFamiliesCompatible(source: MachineNode, fromPort: number, target: MachineNode, toPort: number, completedResearch: readonly string[] = []) {
  const output = getEffectiveNodeOutputFamilies(source)[fromPort]; const input = getEffectiveNodeInputFamilies(target, completedResearch)[toPort];
  if (!output || !input) return false;
  if (hasNodeBehavior(source.kind, 'inventory') && !hasNodeBehavior(target.kind, 'filter')) return false;
  if (source.kind === 'stoneDeposit' && hasNodeBehavior(target.kind, 'big-hole')) return false;
  if (hasNodeBehavior(source.kind, 'lake') && hasNodeBehavior(target.kind, 'extractor')) return false;
  if (source.kind === 'goblinTribute' && target.kind === 'extractor') return false;
  if (output === 'POWER' || input === 'POWER') return output === 'POWER' && (input === 'POWER' || getNodeCapabilities(target.kind).acceptsPowerRelay);
  if (output === 'forest-growth' || input === 'forest-growth') return output === input;
  return expandPortFamily(output).some((item) => expandPortFamily(input).includes(item));
}

export function isMultiConnectionPort(node: MachineNode, direction: PortDirection, _port: number) {
  const capabilities = getNodeCapabilities(node.kind);
  if (direction === 'input') return Boolean(capabilities.multiInput);
  return Boolean(capabilities.multiOutput);
}

export interface ConnectionPlan { fromPort: number; toPort: number; replace: string[] }

export function resolveExactConnectionPlan(source: MachineNode, fromPort: number, target: MachineNode, toPort: number, connections: readonly Connection[], completedResearch: readonly string[] = []): ConnectionPlan | undefined {
  if (source.id === target.id || source.disabled || target.disabled || !portFamiliesCompatible(source, fromPort, target, toPort, completedResearch)) return undefined;
  if (target.kind === 'merger') {
    const retainedType = connections.find((connection) => connection.to === target.id && connection.item)?.item;
    const sourceItems = expandPortFamily(getEffectiveNodeOutputFamilies(source)[fromPort]);
    if (retainedType && sourceItems.length === 1 && sourceItems[0] !== retainedType) return undefined;
  }
  if (connections.some((connection) => connection.from === source.id && connection.to === target.id && (connection.fromPort ?? 0) === fromPort && (connection.toPort ?? 0) === toPort)) return undefined;
  const replace = connections.filter((connection) =>
    (!isMultiConnectionPort(source, 'output', fromPort) && connection.from === source.id && (connection.fromPort ?? 0) === fromPort) ||
    (!isMultiConnectionPort(target, 'input', toPort) && connection.to === target.id && (connection.toPort ?? 0) === toPort)
  ).map((connection) => connection.id);
  return { fromPort, toPort, replace };
}

export function resolveConnectionPlan(source: MachineNode, target: MachineNode, connections: readonly Connection[], completedResearch: readonly string[] = []): ConnectionPlan | undefined {
  if (source.id === target.id || source.disabled || target.disabled) return undefined;
  const outputs = getEffectiveNodeOutputFamilies(source); const inputs = getEffectiveNodeInputFamilies(target, completedResearch);
  const plans: Array<ConnectionPlan & { cost: number }> = [];
  outputs.forEach((_output, fromPort) => inputs.forEach((_input, toPort) => {
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, connections, completedResearch);
    if (plan) plans.push({ ...plan, cost: plan.replace.length });
  }));
  plans.sort((a, b) => a.cost - b.cost || a.fromPort - b.fromPort || a.toPort - b.toPort);
  const selected = plans[0]; return selected ? { fromPort: selected.fromPort, toPort: selected.toPort, replace: selected.replace } : undefined;
}

const rotatedSide = (base: PortSide, rotation: number): PortSide => {
  const sides: PortSide[] = ['north', 'east', 'south', 'west']; const index = sides.indexOf(base);
  return sides[(index + Math.round(rotation / 90)) % 4];
};

export function getPortSide(node: MachineNode, direction: PortDirection, port: number): PortSide {
  if (node.infiniteResource && direction === 'output') return (['north', 'east', 'south', 'west'] as PortSide[])[port % 4];
  if ((node.kind === 'road' || node.kind === 'fluidRoad') && node.roadFacing) return node.roadFacing;
  if (node.kind === 'lake') return (['north', 'east', 'south', 'west'] as PortSide[])[port % 4];
  if (node.kind === 'powerSplitter' && direction === 'output') return rotatedSide((['north', 'east', 'south'] as PortSide[])[port % 3], node.rotation);
  const mirrored = isProductionMachine(node) && node.connectorsMirrored;
  const base = (direction === 'output') !== Boolean(mirrored) ? 'east' : 'west';
  return NODE_DEFINITIONS[node.kind].category === 'Logistics' ? rotatedSide(base, node.rotation) : base;
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
  for (let index = 0; index <= 32; index++) {
    const t = index / 32; const u = 1 - t; const point = { x: u ** 3 * start.x + 3 * u * u * t * controls.first.x + 3 * u * t * t * controls.second.x + t ** 3 * end.x, y: u ** 3 * start.y + 3 * u * u * t * controls.first.y + 3 * u * t * t * controls.second.y + t ** 3 * end.y };
    const blocked = obstacles.find((obstacle) => { const size = getNodeSize(obstacle); const dx = (point.x - obstacle.x) / (size.w / 2 + 12); const dy = (point.y - obstacle.y) / (size.h / 2 + 12); return dx * dx + dy * dy <= 1; });
    if (blocked) return blocked;
  }
  return undefined;
}
