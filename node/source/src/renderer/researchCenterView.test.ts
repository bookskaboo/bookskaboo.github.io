import { describe, expect, it } from 'vitest';
import { createInitialState } from '../simulation/createInitialState';
import { tutorialNode } from '../tutorials/tutorialState';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import { researchCenterView } from './researchCenterView';

describe('Research Center project display', () => {
  it('keeps paid progress visible while waiting, including while paused', () => {
    const game = createInitialState(1);
    game.research.completed = ['refiner', 'researchCenter'];
    game.research.selected = 'extractor1';
    game.research.contributed = { 'simple-core': 1 };
    const node = tutorialNode('researchCenter', 'lab', 500, 500);
    const cost = getResearchCostsForState(getResearchProject('extractor1')!, game.research)['simple-core']!;
    const display = researchCenterView(node, game);
    expect(display.progress).toBe(1 / cost);
    expect(display.summary).toContain('Waiting for Simple Core');
    game.paused = true;
    expect(researchCenterView(node, game).progress).toBe(display.progress);
  });

  it('counts consumed Cores, without counting buffered Cores or the current cycle', () => {
    const game = createInitialState(1);
    game.research.completed = ['refiner', 'researchCenter'];
    game.research.selected = 'extractor1';
    const node = tutorialNode('researchCenter', 'lab', 500, 500, { input: { 'simple-core': 1 } });
    const cost = getResearchCostsForState(getResearchProject('extractor1')!, game.research)['simple-core']!;
    node.progressMs = 500;
    expect(researchCenterView(node, game).progress).toBe(0);
    expect(researchCenterView(node, game).summary).toContain('Processing complete Core sets.');
    game.paused = true;
    game.research.contributed = { 'simple-core': 2 };
    expect(researchCenterView(node, game).progress).toBe(2 / cost);
    node.input = {};
    expect(researchCenterView(node, game).progress).toBe(2 / cost);
  });

  it('shows 20% after consuming two of ten Cores, and keeps the selected project visible while waiting', () => {
    const game = createInitialState(1);
    game.research.selected = 'extractor1';
    game.research.contributed = { 'simple-core': 2 };
    const node = tutorialNode('researchCenter', 'lab', 500, 500);
    expect(getResearchCostsForState(getResearchProject('extractor1')!, game.research)).toEqual({ 'simple-core': 10 });
    expect(researchCenterView(node, game)).toMatchObject({ progress: .2, projectName: 'Extractor 1' });
  });

  it('uses every required Core type in overall progress, excluding unrelated Cores', () => {
    const game = createInitialState(1);
    game.research.completed = ['extractor1'];
    game.research.selected = 'extractor2';
    const costs = getResearchCostsForState(getResearchProject('extractor2')!, game.research);
    game.research.contributed = { 'simple-core': costs['simple-core']! / 5, 'basic-core': costs['basic-core']! / 5, 'command-core': 1000 };
    const node = tutorialNode('researchCenter', 'lab', 500, 500, { input: { 'simple-core': 5, 'basic-core': 5 } });
    expect(researchCenterView(node, game).progress).toBe(.2);
    game.research.contributed = { 'simple-core': 1000, 'basic-core': 1000 };
    expect(researchCenterView(node, game).progress).toBe(1);
  });

  it('explains how to start when no project is selected', () => {
    const game = createInitialState(1);
    const node = tutorialNode('researchCenter', 'lab', 500, 500);
    expect(researchCenterView(node, game)).toEqual({ progress: 0, summary: 'Choose a research project. Deliver Cores to this Center to fund it.' });
  });
});
