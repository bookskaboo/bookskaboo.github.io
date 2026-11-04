import { describe, expect, it } from 'vitest';
import { RESEARCH_PROJECTS } from '../content/research';
import { createInitialState, GameEngine } from '../simulation/engine';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { researchProgress } from './researchProgress';

const project = RESEARCH_PROJECTS.find(p => p.id === 'exploration')!;
function setup() {
  const game = createInitialState(1);
  game.research.selected = project.id;
  game.sectors['5,5'].nodes = [];
  return game;
}
describe('research payment and delivery details', () => {
  it('explains required Core types without repeating the itemized costs', () => {
    const game = setup();
    expect(researchProgress(project, game).requirement).toBe('Each listed Core is required.');
    game.research.selected = undefined;
    const road = RESEARCH_PROJECTS.find(p => p.id === 'road')!;
    expect(researchProgress(road, game).requirement).toBe('Each listed Core is required.');
    expect(researchProgress(RESEARCH_PROJECTS.find(p => p.id === 'assembler')!, game).requirement).toBe('');
  });
  it('uses processed contributions separately from buffered stock', () => {
    const game = setup();
    game.sectors['5,5'].nodes = [tutorialNode('researchCenter', 'lab', 500, 500, { input: { 'simple-core': 5 } })];
    const progress = researchProgress(project, game);
    expect(progress.rows.map(row => row.researched)).toEqual([0, 0]);
    expect(progress.status).toContain('Waiting for Basic Core');
  });
  it('does not combine incomplete Core sets held in separate Research Centers', () => {
    const game = setup();
    game.sectors['5,5'].nodes = [
      tutorialNode('researchCenter', 'a', 500, 500, { input: { 'simple-core': 1 } }),
      tutorialNode('researchCenter', 'b', 800, 500, { input: { 'basic-core': 1 } }),
    ];
    expect(researchProgress(project, game).status).toContain('own complete Core set');
    game.sectors['5,5'].nodes[0].input['basic-core'] = 1;
    expect(researchProgress(project, game).status).toBe('Processing Cores in a Research Center.');
  });
  it('reports pause, missing Centers, disabled processing, and construction accurately', () => {
    const game = setup();
    expect(researchProgress(project, game).status).toContain('Build a Research Center');
    game.paused = true;
    expect(researchProgress(project, game).status).toContain('Simulation paused');
    game.paused = false;
    const lab = tutorialNode('researchCenter', 'lab', 500, 500, { processingPaused: true });
    game.sectors['5,5'].nodes.push(lab);
    expect(researchProgress(project, game).status).toContain('Enable or resume');
    lab.processingPaused = false; lab.constructedAt = 1000; lab.constructionMs = 1500;
    expect(researchProgress(project, game, 2000).status).toContain('finish construction');
  });
  it('preserves researched payments and immediately checks the remaining Cores when resuming', () => {
    const game = setup();
    game.research.contributed = { 'simple-core': 1 };
    game.sectors['5,5'].nodes = [tutorialNode('researchCenter', 'lab', 500, 500, { input: { 'basic-core': 1 }, progressMs: 500 })];
    const engine = new GameEngine(game, { autosave: false });
    engine.selectResearch(undefined);
    let progress = researchProgress(project, engine.getState());
    expect(progress.active).toBe(false);
    expect(progress.rows.find(row => row.item === 'simple-core')).toMatchObject({ researched: 1, remaining: 0 });
    expect(engine.getSector().nodes[0].progressMs).toBe(0);
    expect(engine.getSector().nodes[0].input).toEqual({ 'basic-core': 1 });
    engine.selectResearch(project.id);
    progress = researchProgress(project, engine.getState());
    expect(progress.active).toBe(false);
    expect(progress.rows.every(row => row.remaining === 0)).toBe(true);
    expect(engine.getSector().nodes[0].input).toEqual({ 'basic-core': 0 });
    expect(engine.getState().research.completed).toContain(project.id);
  });
});
