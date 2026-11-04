import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { isProductionMachine } from '../content/productionNodes';
import { getNodeModule } from '../content/nodeModules';
import { isCartKind } from '../content/cartUpgrades';
import type { MachineNode } from './types';
import { modNode } from '../mods/modRules';

export interface NodeSize { w: number; h: number }
export interface Point { x: number; y: number }

export const RESOURCE_NODE_SIZE: NodeSize = { w: 320, h: 256 };
export const GOLEM_NODE_SIZE: NodeSize = { w: 512, h: 768 };
export const STANDARD_NODE_WIDTH = 256;
export const POWER_SPLITTER_SIZE = 64;
export const JOINT_SIZE = 64;
export const COMPACT_NODE_SIZE = 64;
export const ROAD_NODE_SIZE = 128;
export const WOODEN_CHEST_SIZE: NodeSize = { w: 128, h: 128 };
export const RESEARCH_CENTER_SCALE = 1.2;

export function isResourceNode(node: MachineNode) { return getNodeModule(node.kind).appearance.shape === 'resource'; }
export function isOrganicNode(node: MachineNode) { return ['lake', 'hole', 'camp', 'golem'].includes(getNodeModule(node.kind).appearance.shape); }
export function isCompactNode(node: MachineNode) { return ['joint', 'compact', 'road'].includes(getNodeModule(node.kind).appearance.shape); }

const gridSize = (size: NodeSize): NodeSize => ({ w: Math.max(64, Math.round(size.w / 64) * 64), h: Math.max(64, Math.round(size.h / 64) * 64) });

export function getNodeSize(node: Pick<MachineNode, 'kind'> & Partial<MachineNode>): NodeSize {
  const size = getBaseNodeSize(node);
  const scale = modNode(node.kind)?.obstructionScale ?? 1;
  return scale === 1 ? size : { w: size.w * scale, h: size.h * scale };
}

function getBaseNodeSize(node: Pick<MachineNode, 'kind'> & Partial<MachineNode>): NodeSize {
  if(node.kind==='cornerChallenge'&&node.cornerType==='alpha')return {w:512,h:640};
  const shape = getNodeModule(node.kind).appearance.shape;
  if (shape === 'resource') return RESOURCE_NODE_SIZE;
  if (shape === 'golem') return GOLEM_NODE_SIZE;
  if (shape === 'lake') return gridSize({ w: node.obstructionWidth ?? 350, h: node.obstructionHeight ?? 245 });
  if (shape === 'hole') {
    const radius = node.obstructionRadius;
    return gridSize(radius ? { w: radius * 2, h: radius * 2 } : { w: 210, h: 190 });
  }
  if (shape === 'camp') {
    if (node.obstructionMaxRadius) {
      const diameter = node.obstructionMaxRadius * 2 * Math.sqrt(Math.max(.1, (node.campStrength ?? 25) / 100));
      return gridSize({ w: diameter, h: diameter });
    }
    const scale = .55 + Math.max(10, node.campStrength ?? 25) / 100;
    return gridSize({ w: 260 * scale, h: 220 * scale });
  }
  if (shape === 'joint') return { w: JOINT_SIZE, h: JOINT_SIZE };
  if (shape === 'compact') return node.kind === 'powerSplitter' ? { w: POWER_SPLITTER_SIZE, h: POWER_SPLITTER_SIZE } : { w: COMPACT_NODE_SIZE, h: COMPACT_NODE_SIZE };
  if (shape === 'road') return { w: ROAD_NODE_SIZE, h: ROAD_NODE_SIZE };
  if (shape === 'chest') return WOODEN_CHEST_SIZE;
  const definition = NODE_DEFINITIONS[node.kind];
  const rows = Math.max(definition.input.length, definition.output.length, 1);
  const size = { w: STANDARD_NODE_WIDTH, h: 171 + rows * 30 };
  return gridSize(shape === 'research'
    ? { w: size.w * RESEARCH_CENTER_SCALE, h: size.h * RESEARCH_CENTER_SCALE }
    : size);
}

function rotate(point: Point, turns: number): Point {
  let result = point;
  for (let index = 0; index < ((turns % 4) + 4) % 4; index++) result = { x: -result.y, y: result.x };
  return result;
}

function visualPortSlot(index: number, count: number, order?: number[]) {
  if (!order || order.length !== count || new Set(order).size !== count || order.some((slot) => slot < 0 || slot >= count)) return index;
  return order[index] ?? index;
}

export function getPortAnchor(node: MachineNode, direction: 'input' | 'output', index: number): Point {
  const size = getNodeSize(node);
  if (node.infiniteResource && direction === 'output') return index % 4 === 0 ? { x: 0, y: -size.h / 2 } : index % 4 === 1 ? { x: size.w / 2, y: 0 } : index % 4 === 2 ? { x: 0, y: size.h / 2 } : { x: -size.w / 2, y: 0 };
  if (node.kind === 'lake') {
    const polygon = organicPolygon(node, 18);
    const ray = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }][index % 4];
    const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
    for (let i = 0; i < polygon.length; i += 2) {
      const a = { x: polygon[i], y: polygon[i + 1] };
      const b = { x: polygon[(i + 2) % polygon.length], y: polygon[(i + 3) % polygon.length] };
      const edge = { x: b.x - a.x, y: b.y - a.y };
      const denominator = cross(ray, edge);
      if (Math.abs(denominator) < 1e-8) continue;
      const distance = cross(a, edge) / denominator;
      const along = cross(a, ray) / denominator;
      if (distance > 0 && along >= -1e-8 && along <= 1 + 1e-8) return { x: ray.x * distance, y: ray.y * distance };
    }
  }
  if (node.kind === 'road' || node.kind === 'fluidRoad') {
    const side = node.roadFacing ?? (direction === 'input' ? 'west' : 'east');
    return side === 'north' ? { x: 0, y: -size.h / 2 } : side === 'south' ? { x: 0, y: size.h / 2 } : { x: side === 'west' ? -size.w / 2 : size.w / 2, y: 0 };
  }
  if (node.kind === 'big-hole' || node.kind === 'monster-camp' || node.kind === 'resourceGolem') return { x: 0, y: 0 };
  if (node.kind === 'joint') return { x: 0, y: 0 };
  if (node.kind === 'powerSplitter') {
    if (direction === 'input') return rotate({ x: -size.w / 2, y: 0 }, Math.round(node.rotation / 90));
    return rotate(index === 0 ? { x: 0, y: -size.h / 2 } : index === 1 ? { x: size.w / 2, y: 0 } : { x: 0, y: size.h / 2 }, Math.round(node.rotation / 90));
  }
  const production = isProductionMachine(node);
  const inputCount = production ? getEffectiveNodeInputFamilies(node, []).length : NODE_DEFINITIONS[node.kind].input.length;
  const outputCount = production ? getEffectiveNodeOutputFamilies(node).length : NODE_DEFINITIONS[node.kind].output.length;
  const count = Math.max(1, direction === 'input' ? inputCount : outputCount);
  let point: Point;
  if (node.kind === 'splitter' || node.kind === 'merger') {
    const single = node.kind === 'splitter' ? direction === 'input' : direction === 'output';
    const y = single ? 0 : size.h * (index === 0 ? -1 / 6 : 1 / 6);
    point = { x: direction === 'input' ? -size.w / 2 : size.w / 2, y };
    return rotate(point, Math.round(node.rotation / 90));
  }
  const top = isResourceNode(node) ? -size.h / 2 + 103 : -size.h / 2 + (isCompactNode(node) ? 30 : 86);
  const row = production ? Math.min(42, (size.h - 142) / Math.max(1, Math.max(inputCount, outputCount) - 1)) : isResourceNode(node) ? 36 : isCompactNode(node) ? 20 : 30;
  const order = direction === 'input' ? node.inputPortOrder : node.outputPortOrder;
  const slot = visualPortSlot(index, count, order);
  const rowCount = Math.max(inputCount, outputCount, 1);
  const maximumOutputOffset = Math.max(0, rowCount - outputCount);
  const outputOffset = direction === 'output' ? Math.min(maximumOutputOffset, Math.max(0, node.outputRowOffset ?? 0)) : 0;
  const mirror = production && node.connectorsMirrored ? -1 : 1;
  const anchor = { x: (direction === 'input' ? -size.w / 2 : size.w / 2) * mirror, y: top + (slot + outputOffset) * row };
  return NODE_DEFINITIONS[node.kind].category === 'Logistics' && !isCartKind(node.kind) ? rotate(anchor, Math.round(node.rotation / 90)) : anchor;
}

export function organicPolygon(node: MachineNode, points: number, scale = 1): number[] {
  let hash = 2166136261;
  for (const character of node.id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const size = getNodeSize(node);
  const output: number[] = [];
  for (let index = 0; index < points; index++) {
    hash ^= hash << 13; hash ^= hash >>> 17; hash ^= hash << 5;
    const noise = .78 + ((hash >>> 0) % 1000) / 5000;
    const angle = Math.PI * 2 * index / points - Math.PI / 2;
    output.push(Math.cos(angle) * size.w * .5 * noise * scale, Math.sin(angle) * size.h * .5 * noise * scale);
  }
  return output;
}
