import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { BASE_RESEARCH_PROJECTS, getResearchProject, RESEARCH_PROJECTS } from '../../src/content/research';
import { isRecipeUnlocked } from '../../src/content/recipes';
import { GameEngine } from '../../src/simulation/engine';
import { researchProgress } from '../../src/ui/researchProgress';
import { researchSection, visibleResearchRequirements } from '../../src/ui/researchPresentation';
import { BOT_UPGRADES, characterStage, installBotUpgradeProposal, nextBotUpgrade, previewState, projectStage } from './model';
import { BotUpgrade } from './BotUpgrade';
import { upgradePaymentExample } from './upgradeExamples';
import { createElement } from 'react';

installBotUpgradeProposal();

describe('bot upgrade proposal', () => {
  it('prices every upgrade at five of every Core through its tier and gates only on the previous upgrade', () => {
    BOT_UPGRADES.forEach((upgrade, index) => {
      const project = getResearchProject(upgrade.id)!;
      expect(project.costs).toEqual(Object.fromEntries(CORE_RESEARCH.slice(0, index + 1).map(core => [core.item, 5])));
      expect(project.prerequisite).toBe(upgrade.prerequisite);
      expect(project.prerequisite).toBe(index === 0 ? undefined : BOT_UPGRADES[index - 1].id);
      expect(project.prerequisites).toEqual([]);
      expect(project.coreAccessPrerequisites).toBe(false);
      expect(projectStage(project, previewState(0))).toBe(upgrade.item);
      if (index < 6) expect(project.id).toBe(CORE_RESEARCH[index + 1].id);
    });
    expect(getResearchProject('simpleCore')).toBeUndefined();
    expect(isRecipeUnlocked('simple-core', [])).toBe(true);
    expect(BASE_RESEARCH_PROJECTS.find(project => project.id === 'automataCore')?.costs).toEqual({ 'simple-core': 5, 'basic-core': 5 });
    expect(new Set(RESEARCH_PROJECTS.map(project => project.id)).size).toBe(RESEARCH_PROJECTS.length);
  });

  it('unlocks every later upgrade immediately after its predecessor, without any technology or production gates', () => {
    const state = previewState(0);
    for (let index = 0; index < BOT_UPGRADES.length; index++) {
      const project = getResearchProject(BOT_UPGRADES[index].id)!;
      expect(researchSection(project, state)).toBe(index === 0 ? 'available' : 'future');
      if (index > 0) {
        expect(visibleResearchRequirements(project, state)).toEqual([BOT_UPGRADES[index - 1].id]);
        state.research.completed.push(BOT_UPGRADES[index - 1].id);
      }
      expect(researchSection(project, state)).toBe('available');
      expect(visibleResearchRequirements(project, state)).toEqual([]);
      expect(nextBotUpgrade(state)?.id).toBe(project.id);
      expect(state.research.completed).not.toContain('assembler');
      expect(state.research.completed).not.toContain('exploration');
      expect(state.research.completed).not.toContain('hydraulicAssembly');
      expect(state.produced?.['final-core'] ?? 0).toBe(0);
    }
  });

  it('lets a fresh Junior enable Simple before Assembler or Simple Core discovery, without charging early', () => {
    const state = previewState(0);
    const project = getResearchProject(BOT_UPGRADES[0].id)!;
    expect(state.research.completed).not.toContain('assembler');
    expect(state.research.completed).not.toContain('simpleCore');
    expect(project.prerequisite).toBeUndefined();
    expect(researchSection(project, state)).toBe('available');
    expect(visibleResearchRequirements(project, state)).toEqual([]);
    expect(researchSection(getResearchProject('assembler')!, state)).toBe('future');
    const engine = new GameEngine(state, { autosave: false });
    engine.selectResearch(project.id);
    expect(engine.getState().research.selected).toBe(project.id);
    const live = engine.getState();
    live.paused = false;
    engine.tick(5000);
    expect(live.research.selected).toBe(project.id);
    expect(researchProgress(project, live).rows[0].researched).toBe(0);
    expect(live.research.completed).not.toContain(project.id);
    const html = renderToStaticMarkup(createElement(BotUpgrade, { game: live, engine, onInspect() {}, onOpenRecipe() {} }));
    expect(html).toContain('<span>Upgrade</span>');
    expect(html).not.toContain('<small>Enabled</small>');
    expect(html).toContain('Disable Simple upgrade');
  });

  it('starts with Simple and derives character tiers from paid upgrades, not the first recipe discovery', () => {
    for (let stage = 0; stage < 8; stage++) expect(characterStage(previewState(stage))).toBe(stage);
    const game = previewState(0);
    expect(nextBotUpgrade(game)?.label).toBe('Simple upgrade');
    game.research.completed.push('simpleCore');
    expect(characterStage(game)).toBe(0);
    expect(nextBotUpgrade(game)?.label).toBe('Simple upgrade');
  });

  it.each(BOT_UPGRADES.map((upgrade, stage) => [upgrade.label, stage] as const))('%s fills through actual lab payments and unlocks the next recipe on completion', (_label, stage) => {
    const upgrade = BOT_UPGRADES[stage];
    const partial = upgradePaymentExample(stage, 2);
    const partialState = partial.getState();
    expect(characterStage(partialState)).toBe(stage);
    expect(researchProgress(getResearchProject(upgrade.id)!, partialState).rows).toEqual(
      CORE_RESEARCH.slice(0, stage + 1).map(core => ({ item: core.item, required: 5, researched: 2, remaining: 3 })),
    );
    if (stage < 6) expect(isRecipeUnlocked(CORE_RESEARCH[stage + 1].item, partialState.research.completed)).toBe(false);
    const finished = upgradePaymentExample(stage, 5).getState();
    expect(characterStage(finished)).toBe(stage + 1);
    expect(finished.research.selected).toBeUndefined();
    expect(nextBotUpgrade(finished)?.id).toBe(BOT_UPGRADES[stage + 1]?.id);
    if (stage < 6) expect(isRecipeUnlocked(CORE_RESEARCH[stage + 1].item, finished.research.completed)).toBe(true);
    for (const core of CORE_RESEARCH.slice(0, stage + 1)) expect(finished.sectors['5,5'].nodes[0].input[core.item]).toBe(0);
  });

  it('waits for a missing lower Core before paying any type, then resumes and stops all types when disabled', () => {
    const engine = upgradePaymentExample(3, 2);
    const state = engine.getState();
    const project = getResearchProject(BOT_UPGRADES[3].id)!;
    const lab = engine.getSector().nodes[0];
    lab.input['simple-core'] = 0;
    state.paused = false;
    for (let elapsed = 0; elapsed < 10000; elapsed += 100) engine.tick(100);
    expect(researchProgress(project, state).rows.map(row => row.researched)).toEqual([2, 2, 2, 2]);
    expect(lab.input['hydro-core']).toBe(3);
    lab.input['simple-core'] = 3;
    for (let elapsed = 0; elapsed < 5000; elapsed += 100) engine.tick(100);
    expect(researchProgress(project, state).rows.map(row => row.researched)).toEqual([3, 3, 3, 3]);
    engine.selectResearch(undefined);
    for (let elapsed = 0; elapsed < 10000; elapsed += 100) engine.tick(100);
    expect(researchProgress(project, state).rows.map(row => row.researched)).toEqual([3, 3, 3, 3]);
    expect(lab.input).toEqual({ 'simple-core': 2, 'basic-core': 2, 'automata-core': 2, 'hydro-core': 2 });
  });

  it('shows every required Core badge and uses the full paid total for the upgrade fill', () => {
    const engine = upgradePaymentExample(6, 2);
    const html = renderToStaticMarkup(createElement(BotUpgrade, { game: engine.getState(), engine, onInspect() {}, onOpenRecipe() {} }));
    for (const core of CORE_RESEARCH) expect(html).toContain(`${core.name}s 2 of 5; view recipe`);
    expect(html).toContain('value="14" max="35"');
  });

  it('preserves partial contributions across cancellation and renders matching fill and badge counts', () => {
    const engine = upgradePaymentExample(0, 2);
    const upgrade = BOT_UPGRADES[0];
    engine.selectResearch(undefined);
    expect(researchProgress(getResearchProject(upgrade.id)!, engine.getState()).rows[0].researched).toBe(2);
    engine.selectResearch(upgrade.id);
    expect(engine.getState().research.contributed[upgrade.item]).toBe(2);
    const html = renderToStaticMarkup(createElement(BotUpgrade, { game: engine.getState(), engine, onInspect: () => {}, onOpenRecipe: () => {} }));
    expect(html).toContain('value="2" max="5"');
    expect(html).toContain('>2/5<');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Disable Simple upgrade');
    expect(html).not.toContain('research-core-paid');
    expect(html).not.toContain('bot-upgrade-unlock');
  });

  it('consumes no more Cores while disabled and resumes only after re-enabling', () => {
    const engine = upgradePaymentExample(0, 2);
    const state = engine.getState();
    const upgrade = BOT_UPGRADES[0];
    const center = engine.getSector().nodes[0];
    engine.selectResearch(undefined);
    state.paused = false;
    for (let elapsed = 0; elapsed < 10000; elapsed += 100) engine.tick(100);
    expect(center.input[upgrade.item]).toBe(3);
    expect(researchProgress(getResearchProject(upgrade.id)!, state).rows[0].researched).toBe(2);
    expect(state.research.completed).not.toContain(upgrade.id);
    const html = renderToStaticMarkup(createElement(BotUpgrade, { game: state, engine, onInspect: () => {}, onOpenRecipe: () => {} }));
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Enable Simple upgrade');
    engine.selectResearch(upgrade.id);
    for (let elapsed = 0; elapsed < 5000; elapsed += 100) engine.tick(100);
    expect(center.input[upgrade.item]).toBe(2);
    expect(state.research.contributed[upgrade.item]).toBe(3);
  });

  it('leaves the next tier disabled on completion, even with its Cores in the lab', () => {
    const engine = upgradePaymentExample(0, 5);
    const state = engine.getState();
    const next = BOT_UPGRADES[1];
    const center = engine.getSector().nodes[0];
    center.input[next.item] = 5;
    state.paused = false;
    for (let elapsed = 0; elapsed < 10000; elapsed += 100) engine.tick(100);
    expect(state.research.selected).toBeUndefined();
    expect(center.input[next.item]).toBe(5);
    expect(researchProgress(getResearchProject(next.id)!, state).rows[0].researched).toBe(0);
  });

  it('does not complete an upgrade from stored Core stock before a research cycle', () => {
    const state = previewState(0);
    state.globalPool = { 'simple-core': 5 };
    state.research.completed = ['simpleCore', 'refiner', 'assembler'];
    state.paused = false;
    const engine = new GameEngine(state, { autosave: false });
    engine.selectResearch(BOT_UPGRADES[0].id);
    engine.tick(1000);
    expect(engine.getState().globalPool?.['simple-core']).toBe(5);
    expect(researchProgress(getResearchProject(BOT_UPGRADES[0].id)!, engine.getState()).rows[0].researched).toBe(0);
    expect(nextBotUpgrade(engine.getState())?.label).toBe('Simple upgrade');
    expect(characterStage(engine.getState())).toBe(0);
  });
});
