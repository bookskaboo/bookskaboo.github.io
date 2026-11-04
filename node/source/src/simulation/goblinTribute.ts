import { getMonsterSettlementDefinition } from '../content/goblinSettlements';
import type { GameState, MachineNode } from '../domain/types';
import { canPlaceNode } from './collisions';
import { getDwarvenSettlement } from '../content/lizardSettlements';

export const TRIBUTE_CYCLE_MS = 5000;
export const TRIBUTE_CAPACITY = 100;
export type TributeItem = NonNullable<MachineNode['tributeItem']>;

export function getTributeItems(state: GameState, camp?: MachineNode): TributeItem[] {
  if (camp?.lizardSettlement) return ['mythril'];
  const items: TributeItem[] = ['iron', 'copper', 'stone', 'wood'];
  void state; // Goblins never generate new Mythril, including after its processing unlock.
  return items;
}

export const tributeAmount = (camp: MachineNode) => getMonsterSettlementDefinition(camp).tributePerCycle;
export const tributeMaterial = (camp: MachineNode): TributeItem => camp.lizardSettlement ? 'mythril' : camp.tributeItem === 'mythril' ? 'iron' : camp.tributeItem ?? 'iron';
export const tributeCapacity = (camp: MachineNode) => camp.lizardSettlement ? getDwarvenSettlement(camp).capacity : TRIBUTE_CAPACITY;
export const isCampFullySuppressed = (camp?: MachineNode) => Boolean(camp?.suppressed && (camp.campStrength ?? 25) <= 10);

export function createGoblinTribute(camp: MachineNode, nodes: readonly MachineNode[], field: { width: number; height: number }): MachineNode | undefined {
  if (!isCampFullySuppressed(camp)) return undefined;
  const node: MachineNode = {
    id: `goblin-tribute-${camp.id}`, kind: 'goblinTribute', name: 'Tribute', tributeCampId: camp.id,
    lizardSettlement: camp.lizardSettlement,
    settlementMapTier: camp.settlementMapTier,
    tributeItem: tributeMaterial(camp), x: camp.x, y: camp.y, rotation: 0,
    input: {}, output: {}, progressMs: 0, cycleMs: TRIBUTE_CYCLE_MS, capacity: tributeCapacity(camp),
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
  if (!camp || !isCampFullySuppressed(camp)) { node.progressMs = 0; return; }
  const item = tributeMaterial(camp);
  node.tributeItem = item;
  if (!getTributeItems(state, camp).includes(item)) { node.progressMs = 0; return; }
  const amount = tributeAmount(camp);
  const capacity = tributeCapacity(camp);
  node.capacity = capacity;
  const occupied = Object.values(node.output).reduce((sum, count) => sum + (count ?? 0), 0);
  if (occupied >= capacity) return;
  node.progressMs += dt;
  if (node.progressMs < TRIBUTE_CYCLE_MS) return;
  node.progressMs %= TRIBUTE_CYCLE_MS;
  const produced = Math.min(amount, capacity - occupied);
  node.output[item] = (node.output[item] ?? 0) + produced;
  state.extracted ??= {};
  state.extracted[item] = (state.extracted[item] ?? 0) + produced;
  if (camp.lizardSettlement && item === 'mythril' && produced > 0) state.dwarvenMythrilProduced = true;
}
