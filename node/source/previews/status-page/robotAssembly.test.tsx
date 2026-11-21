import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import { getResearchProject } from '../../src/content/research';
import { normalizeLegacy } from '../../src/persistence/saves';
import { GameEngine } from '../../src/simulation/engine';
import { RobotPortrait } from '../../src/ui/upgrades/RobotPortrait';
import { robotAssemblyProgress } from '../../src/ui/upgrades/robotAssembly';
import { previewState } from './model';

function assemblyLab(tier: number) {
  const state = previewState(tier);
  state.paused = false;
  state.sectors['5,5'].nodes = [{ id: 'assembly-lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0,
    input: { ...getResearchProject(BOT_UPGRADES[tier].id)!.costs }, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0 }];
  const engine = new GameEngine(state, { autosave: false });
  engine.selectResearch(BOT_UPGRADES[tier].id);
  return engine;
}

function advance(engine: GameEngine, ms: number) { for (let elapsed = 0; elapsed < ms; elapsed += 100) engine.tick(100); }

describe('Core-funded robot assembly', () => {
  it.each(BOT_UPGRADES.map((upgrade, tier) => ({ ...upgrade, tier })))('$label assembles only after processed payments and finishes at the next artwork', ({ tier, id }) => {
    const engine = assemblyLab(tier), game = engine.getState();
    expect(robotAssemblyProgress(game)).toMatchObject({ tier, progress: 0 });
    advance(engine, 2500);
    expect(robotAssemblyProgress(game).progress).toBe(0);
    expect(robotAssemblyProgress(game).processingProgress).toBe(.2);
    expect(renderToStaticMarkup(<RobotPortrait game={game} />)).toContain('robot-processing-preview');
    advance(engine, 2500);
    expect(robotAssemblyProgress(game)).toMatchObject({ tier, progress: .2 });
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
    advance(engine, 15000);
    expect(robotAssemblyProgress(game)).toMatchObject({ tier, progress: .8 });
    expect(game.research.completed).not.toContain(id);
    advance(engine, 5000);
    expect(game.research.completed).toContain(id);
    expect(robotAssemblyProgress(game)).toMatchObject({ tier: tier + 1, progress: 0 });
    expect(renderToStaticMarkup(<RobotPortrait game={game} />)).not.toContain('robot-processing-preview');
    expect(renderToStaticMarkup(<RobotPortrait game={game} />)).toContain(`data-robot-tier="${tier + 1}"`);
  });

  it('retains assembled hardware when priority is disabled, research is paused and a factory is saved/reloaded', () => {
    const engine = assemblyLab(2);
    advance(engine, 10000);
    expect(robotAssemblyProgress(engine.getState()).progress).toBe(.4);
    engine.releasePriorityResearch(BOT_UPGRADES[2].id);
    advance(engine, 5000);
    expect(robotAssemblyProgress(engine.getState()).progress).toBe(.4);
    expect(robotAssemblyProgress(engine.getState()).processingProgress).toBeUndefined();
    engine.setResearchPaused(true);
    engine.selectResearch(BOT_UPGRADES[2].id);
    advance(engine, 5000);
    expect(robotAssemblyProgress(engine.getState()).progress).toBe(.4);
    expect(robotAssemblyProgress(engine.getState()).processingProgress).toBeUndefined();
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(robotAssemblyProgress(restored.getState())).toEqual(robotAssemblyProgress(engine.getState()));
    restored.setResearchPaused(false); advance(restored, 5000);
    expect(robotAssemblyProgress(restored.getState()).progress).toBe(.6);
  });

  it('leaves the portrait unchanged when a required Core is missing despite other stock', () => {
    const engine = assemblyLab(4), game = engine.getState();
    delete game.sectors['5,5'].nodes[0].input['shiny-core'];
    advance(engine, 30000);
    expect(robotAssemblyProgress(game)).toMatchObject({ tier: 4, progress: 0 });
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
    expect(game.research.contributed).toEqual({});
  });

  it('flashes only an enabled, actually processing upgrade and stops when the lab or game is paused', () => {
    const engine = assemblyLab(1), game = engine.getState(), lab = game.sectors['5,5'].nodes[0];
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
    advance(engine, 1000);
    expect(robotAssemblyProgress(game).processingProgress).toBe(.2);
    game.paused = true;
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
    game.paused = false; lab.disabled = true;
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
    lab.disabled = false; lab.processingPaused = true;
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
    lab.processingPaused = false;
    expect(robotAssemblyProgress(game).processingProgress).toBe(.2);
    engine.selectResearch('assembler');
    advance(engine, 1000);
    expect(robotAssemblyProgress(game).processingProgress).toBeUndefined();
  });
});
