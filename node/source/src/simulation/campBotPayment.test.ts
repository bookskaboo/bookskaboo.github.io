import { describe, expect, it } from 'vitest';
import type { MachineNode } from '../domain/types';
import { consumeCampBots } from './progression';
import { portRoleLabel } from '../renderer/playfieldNodeState';

const camp = (input: MachineNode['input']): MachineNode => ({ id: 'camp', name: 'Camp', kind: 'monster-camp', x: 0, y: 0, rotation: 0, input, output: {}, cycleMs: 60000, progressMs: 0, constructedAt: 0, constructionMs: 0 });

describe('camp suppression payments', () => {
  it('keeps enough surplus for future checks instead of consuming the entire buffer', () => {
    const node = camp({ 'suppression-bot': 10 });
    consumeCampBots(node, 3);
    expect(node.input).toEqual({ 'suppression-bot': 7 });
    consumeCampBots(node, 3);
    expect(node.input).toEqual({ 'suppression-bot': 4 });
  });
  it('prefers an exact mixed AP payment over wasting a stronger bot', () => {
    const node = camp({ 'command-suppression-bot': 1, 'heavy-suppression-bot': 2, 'suppression-bot': 2 });
    consumeCampBots(node, 9);
    expect(node.input).toEqual({ 'command-suppression-bot': 1, 'heavy-suppression-bot': 1, 'suppression-bot': 1 });
  });
  it('uses the least overpayment available and fewer bots when AP payments tie', () => {
    const node = camp({ 'command-suppression-bot': 5, 'heavy-suppression-bot': 1, 'medium-suppression-bot': 3 });
    consumeCampBots(node, 9);
    expect(node.input).toEqual({ 'command-suppression-bot': 5, 'heavy-suppression-bot': 1 });
    const tied = camp({ 'medium-suppression-bot': 2, 'suppression-bot': 8 });
    consumeCampBots(tied, 6);
    expect(tied.input).toEqual({ 'suppression-bot': 8 });
  });
  it('consumes insufficient bots on a failed check without touching unrelated items', () => {
    const node = camp({ 'heavy-suppression-bot': 1, stone: 10 });
    consumeCampBots(node, 24);
    expect(node.input).toEqual({ stone: 10 });
  });
  it('labels the connector with the recurring AP cost even when Small Bots are connected', () => {
    const node = camp({}); node.attackRequirement = 160;
    expect(portRoleLabel(node, 'input', 0, 'ATTACK_POWER', 'suppression-bot')).toBe('160 AP / 60s');
  });
});
