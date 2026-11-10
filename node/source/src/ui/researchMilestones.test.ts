import { describe, expect, it } from 'vitest';
import { CORNER_MAPS, type CornerType } from '../content/endgame';
import { isRecipeUnlocked, RECIPES } from '../content/recipes';
import { getResearchProject } from '../content/research';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import { createInitialState } from '../simulation/createInitialState';
import { getResearchMilestones, type MilestoneAction } from './researchMilestones';
import { researchSection } from './researchPresentation';

function node(kind: MachineNode['kind'], extra: Partial<MachineNode> = {}): MachineNode {
  return { id: kind, kind, name: kind, x: 100, y: 100, rotation: 0, input: {}, output: {},
    progressMs: 0, cycleMs: 0, constructedAt: 0, constructionMs: 0, ...extra };
}

function addSector(game: GameState, id: string, visited: boolean, ...nodes: MachineNode[]) {
  const [x, y] = id.split(',').map(Number);
  game.sectors[id] = { ...game.sectors['5,5'], id, x, y, visited, nodes };
}

function expectPrimary(game: GameState, action: MilestoneAction, title?: string) {
  const cards = getResearchMilestones(game);
  expect(cards.length).toBeGreaterThan(0);
  expect(cards.length).toBeLessThanOrEqual(3);
  expect(new Set(cards.map(card => card.title)).size).toBe(cards.length);
  expect(cards[0].action).toEqual(action);
  if (title) expect(cards[0].title).toBe(title);
  for (const card of cards) {
    if (card.action.kind === 'research') expect(['available', 'active']).toContain(researchSection(getResearchProject(card.action.id)!, game));
    if (card.action.kind === 'recipe') expect(isRecipeUnlocked(card.action.id, game.research.completed)).toBe(true);
  }
  return cards;
}

const throughAutomata = ['kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'exploration', 'road', 'automataCore', 'fabricatorTools'];
const throughHydro = [...throughAutomata, 'lakeTools', 'hydrochemistry', 'hydraulicAssembly', 'fluidRouting', 'suppressionBot', 'sealedRobotics'];
const throughComplex = [...throughHydro, 'mithrilTools', 'oreSeparation', 'precisionControl'];

function campaign(completed: string[], produced: Partial<Record<ItemId, number>> = {}): GameState {
  const game = createInitialState(321);
  game.sectors['5,5'].nodes.push(node('researchCenter'));
  game.research.completed.push(...completed);
  game.produced = { 'simple-core': 1, 'basic-core': 1, 'automata-core': 1, ...produced };
  return game;
}

describe('Research milestones', () => {
  it('leads from extraction and fuel to the lab and the first paid projects', () => {
    const game = createInitialState(321);
    const opening = expectPrimary(game, { kind: 'build', id: 'extractor' }, 'A promising Forest');
    expect(opening.slice(1).map(card => card.title)).toEqual(['Copper prospects', 'Charcoal']);
    game.research.completed.push('kiln');
    expectPrimary(game, { kind: 'build', id: 'extractor' }, 'Copper prospects');
    game.research.completed.push('smelter');
    expectPrimary(game, { kind: 'recipe', id: 'charcoal' });
    game.produced!.charcoal = 1;
    expectPrimary(game, { kind: 'recipe', id: 'smelt-copper' });
    game.research.completed.push('refiner', 'researchCenter');
    expectPrimary(game, { kind: 'recipe', id: 'simple-core' });
    game.produced!['simple-core'] = 1;
    const beforeLab = expectPrimary(game, { kind: 'build', id: 'researchCenter' });
    expect(beforeLab.map(card => card.title)).not.toContain('Iron prospects');
    game.sectors['5,5'].nodes.push(node('researchCenter'));
    const beforeBasic = expectPrimary(game, { kind: 'research', id: 'assembler' });
    expect(beforeBasic[1].title).toBe('Iron prospects');
    game.research.completed.push('assembler');
    expectPrimary(game, { kind: 'recipe', id: 'basic-core' });
    game.produced!['basic-core'] = 1;
    const afterBasic = expectPrimary(game, { kind: 'research', id: 'exploration' });
    expect(afterBasic.map(card => card.title)).not.toContain('Iron prospects');
    game.research.completed.push('exploration');
    expectPrimary(game, { kind: 'research', id: 'road' });
    game.research.completed.push('road');
    const [automataResearch] = expectPrimary(game, { kind: 'research', id: 'automataCore' });
    game.research.completed.push('automataCore');
    const [automataProduction] = expectPrimary(game, { kind: 'recipe', id: 'automata-core' });
    expect(automataProduction).toMatchObject({ title: automataResearch.title, detail: automataResearch.detail });
    game.produced!['automata-core'] = 1;
    expectPrimary(game, { kind: 'research', id: 'fabricatorTools' });
  });

  it('switches from a thirst clue to Water production, with a separate Golem clue and Survey', () => {
    const game = campaign(throughAutomata);
    const [hint] = expectPrimary(game, { kind: 'research', id: 'mapNode' }, 'The factory is thirsty');
    expect(hint.detail).toMatch(/very large puddle/);
    expect(hint.detail).not.toMatch(/lake/i);
    game.research.mapPoints = 1;
    expect(expectPrimary(game, { kind: 'map' })[0].detail).toBe(hint.detail);
    game.research.mapPoints = 0;
    addSector(game, '6,5', false, node('lake'));
    expectPrimary(game, { kind: 'map' });
    game.sectors['6,5'].visited = true;
    game.research.completed.push('lakeTools');
    expectPrimary(game, { kind: 'research', id: 'hydrochemistry' });
    game.research.completed.push('hydrochemistry');
    expectPrimary(game, { kind: 'research', id: 'hydraulicAssembly' });
    game.research.completed.push('hydraulicAssembly');
    const cards = expectPrimary(game, { kind: 'recipe', id: 'hydro-core' });
    expect(cards).toContainEqual(expect.objectContaining({ title: 'Some rocks have opinions', detail: expect.stringContaining('outer sectors') }));
    game.produced!['hydro-core'] = 1;
    expectPrimary(game, { kind: 'research', id: 'fluidRouting' });
    game.research.completed.push('fluidRouting');
    expectPrimary(game, { kind: 'research', id: 'mapNode' }, 'The neighbours');
    game.research.completed.push('suppressionBot');
    expectPrimary(game, { kind: 'research', id: 'sealedRobotics' });
    game.research.completed.push('sealedRobotics');
    expect(getResearchMilestones(game)).toContainEqual(expect.objectContaining({ action: { kind: 'research', id: 'resourceGolemSurvey' } }));
    game.research.completed.push('resourceGolemSurvey');
    addSector(game, '10,5', true, node('resourceGolem'));
    expect(getResearchMilestones(game)).toContainEqual(expect.objectContaining({ action: { kind: 'sector', id: '10,5' }, title: 'The Golem' }));
  });

  it('leads to a scouted Dwarven Camp, then Shiny and Complex production', () => {
    const game = campaign(throughHydro, { 'hydro-core': 1 });
    addSector(game, '8,6', false, node('monster-camp', { lizardSettlement: 'camp' }));
    expectPrimary(game, { kind: 'map' }, 'A metallic glint');
    game.sectors['8,6'].visited = true;
    const [primary, ...alternatives] = expectPrimary(game, { kind: 'sector', id: '8,6' }, 'Dwarven Tribute');
    expect(primary.detail).not.toMatch(/Mythril|suppress|\d|per minute/i);
    expect(alternatives.some(card => card.action.kind === 'recipe' && card.action.id === 'assemble-bot-f2-g2')).toBe(true);
    game.sectors['8,6'].nodes[0].lizardSettlement = 'village';
    const village = expectPrimary(game, { kind: 'sector', id: '8,6' }, 'Dwarven Tribute');
    expect(village[0].detail).toBe(primary.detail);
    expect(village.map(card => card.title)).not.toContain('A metallic glint');
    game.research.completed.push('mithrilTools');
    expectPrimary(game, { kind: 'research', id: 'oreSeparation' });
    game.research.completed.push('oreSeparation');
    expectPrimary(game, { kind: 'recipe', id: 'shiny-core' });
    game.produced!['shiny-core'] = 1;
    expectPrimary(game, { kind: 'research', id: 'precisionControl' });
    game.research.completed.push('precisionControl');
    expectPrimary(game, { kind: 'recipe', id: 'command-core' });
  });

  it('keeps the milestone choices focused on progression when a reserve runs out', () => {
    const game = campaign(throughHydro);
    const milestones = getResearchMilestones(game);
    const copper = game.sectors['5,5'].nodes.find(n => n.resourceItem === 'copper')!;
    copper.resourceRemaining = 0;
    expect(getResearchMilestones(game)).toEqual(milestones);
  });

  it('hints at the Final Core’s source and reveals discovered corner names without quotas', () => {
    const game = campaign(throughComplex, { 'command-core': 1 });
    game.endgame = { version: 1, pairIndex: 1, cornerOrder: ['reclamation', 'grove', 'alpha', 'foundry'] };
    addSector(game, '10,10', false, node('cornerChallenge', { cornerType: 'alpha' }));
    const [hint] = expectPrimary(game, { kind: 'map' }, 'The four corners');
    expect(hint.detail).toBe('The map may have something left to say.');
    game.sectors['10,10'].visited = true;
    const [dragon] = expectPrimary(game, { kind: 'sector', id: '10,10' }, 'Ancient Dragon');
    expect(dragon.detail).toContain('Bot');
    expect(dragon.detail).not.toMatch(/\d|\bAP\b/);
    addSector(game, '10,0', true, node('cornerChallenge', { cornerType: 'grove' }));
    expectPrimary(game, { kind: 'research', id: 'treePlanter' });
    game.research.completed.push('treePlanter');
    expectPrimary(game, { kind: 'sector', id: '10,0' }, 'Elder Grove');
  });

  it.each([0, 1, 2])('uses the world’s pairings (%s) and then points to the actual victory research', pairIndex => {
    const game = campaign([...throughComplex, 'treePlanter', 'cornerComponents'], { 'command-core': 1 });
    const cornerOrder: CornerType[] = ['alpha', 'foundry', 'reclamation', 'grove'];
    game.endgame = { version: 1, pairIndex, cornerOrder };
    CORNER_MAPS.forEach(id => addSector(game, id, true));
    const yin = RECIPES[`core-half-a-${pairIndex}`];
    game.globalPool = { ...yin.inputs };
    expectPrimary(game, { kind: 'recipe', id: yin.id });
    const yang = RECIPES[`core-half-b-${pairIndex}`];
    game.globalPool = { 'core-half-a': 1, ...yang.inputs };
    expectPrimary(game, { kind: 'recipe', id: yang.id });
    game.globalPool = { 'core-half-a': 1, 'core-half-b': 1 };
    expectPrimary(game, { kind: 'recipe', id: 'final-core' });
    game.globalPool = { 'final-core': 1 };
    game.research.completed.push('finalCoreProduction');
    expectPrimary(game, { kind: 'research', id: 'victory' });
    game.research.completed.push('victory');
    expect(getResearchMilestones(game)).toEqual([
      { title: 'You’ve got this', detail: 'Maybe a speed run next?', action: { kind: 'factory' } },
    ]);
  });
});
