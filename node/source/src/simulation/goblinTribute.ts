import { getMonsterSettlementDefinition } from '../content/goblinSettlements';
import type { GameState, MachineNode } from '../domain/types';
import { canPlaceNode } from './collisions';

export const TRIBUTE_CYCLE_MS = 5000;
export const TRIBUTE_CAPACITY = 100;
export type TributeItem = NonNullable<MachineNode['tributeItem']>;

export function getTributeItems(state: GameState, camp?: MachineNode): TributeItem[] {
  const items: TributeItem[] = ['iron', 'copper', 'stone', 'wood'];
  if (camp?.lizardSettlement) items.push('water');
  if (state.research.completed.includes('mithrilTools')) items.push('mythril');
  return items;
}

export const tributeAmount = (camp: MachineNode) => getMonsterSettlementDefinition(camp).tributePerCycle;

export function createGoblinTribute(camp: MachineNode, nodes: readonly MachineNode[], field: { width: number; height: number }): MachineNode | undefined {
  const node: MachineNode = {
    id: `goblin-tribute-${camp.id}`, kind: 'goblinTribute', name: `${camp.lizardSettlement ? 'Lizard ' : ''}${(camp.lizardSettlement ?? camp.goblinSettlement) === 'kingdom' ? 'Kingdom' : (camp.lizardSettlement ?? camp.goblinSettlement) === 'village' ? 'Village' : 'Camp'} Tribute`, tributeCampId: camp.id,
    lizardSettlement: camp.lizardSettlement,
    tributeItem: camp.tributeItem ?? 'iron', x: camp.x, y: camp.y, rotation: 0,
    input: {}, output: {}, progressMs: 0, cycleMs: TRIBUTE_CYCLE_MS, capacity: TRIBUTE_CAPACITY,
    constructedAt: 0, constructionMs: 0,
  };
  // Reserve maximum camp footprints so tribute cannot be swallowed at a later check.
  const reserved = nodes.map(other => other.kind === 'monster-camp' ? { ...other, campStrength: 100 } : other);
  for (let ring = 0; ring < 8; ring++) for (let step = 0; step < 32; step++) {
    const distance = (camp.obstructionMaxRadius ?? 600) + 220 + ring * 160;
    const angle = step * Math.PI * 2 / 32;
    node.x = camp.x + Math.cos(angle) * distance;
    node.y = camp.y + Math.sin(angle) * distance;
    if (canPlaceNode(node, reserved, field)) return node;
  }
  return undefined;
}

export function produceGoblinTribute(state: GameState, node: MachineNode, camp: MachineNode | undefined, dt: number) {
  if (!camp?.suppressed) { node.progressMs = 0; return; }
  const item = camp.tributeItem ?? 'iron';
  node.tributeItem = item;
  if (!getTributeItems(state, camp).includes(item)) { node.progressMs = 0; return; }
  const amount = tributeAmount(camp);
  const occupied = Object.values(node.output).reduce((sum, count) => sum + (count ?? 0), 0);
  if (occupied >= TRIBUTE_CAPACITY) return;
  node.progressMs += dt;
  if (node.progressMs < TRIBUTE_CYCLE_MS) return;
  node.progressMs %= TRIBUTE_CYCLE_MS;
  const produced = Math.min(amount, TRIBUTE_CAPACITY - occupied);
  node.output[item] = (node.output[item] ?? 0) + produced;
  state.extracted ??= {};
  state.extracted[item] = (state.extracted[item] ?? 0) + produced;
}
