import { describe, expect, it } from 'vitest';
import { BUILDABLE_NODES } from '../content/nodes';
import { createTutorialState, tutorialNode, BASIC_STAGES, LOGISTICS_STAGES, CONTROL_GROUP_STAGES, CAMP_STAGES, EXPANSION_STAGES, EXPANSION_OUTPOST, EXPANSION_HOME, type TutorialKind } from './tutorialRuntime';
import { permitsTutorialChoice, tutorialChoices, tutorialRecipeChoice } from './tutorialChoices';

describe('tutorial choices', () => {
  it('keeps normal play unrestricted and distinguishes no choice from any choice', () => {
    expect(permitsTutorialChoice(undefined, 'anything')).toBe(true);
    expect(permitsTutorialChoice(null, 'anything')).toBe(false);
    expect(permitsTutorialChoice('assembler', 'joint')).toBe(false);
    expect(permitsTutorialChoice('assembler', 'assembler')).toBe(true);
  });

  it('never permits unrelated building or research in any lesson step', () => {
    const lessons = { basic: BASIC_STAGES, logistics: LOGISTICS_STAGES, 'control-groups': CONTROL_GROUP_STAGES, 'monster-camps': CAMP_STAGES, expansion: EXPANSION_STAGES };
    for (const [kind, stages] of Object.entries(lessons)) {
      const game = createTutorialState(kind as TutorialKind);
      for (const stage of stages) {
        const choices = tutorialChoices(kind as TutorialKind, stage, game);
        const enabled = BUILDABLE_NODES.filter(node => node.kind === choices.buildKind);
        expect(enabled.length, `${kind}: ${stage}`).toBeLessThanOrEqual(1);
        if (kind !== 'basic' && stage !== 'expansion-road-place') expect(enabled).toEqual([]);
        expect(permitsTutorialChoice(choices.researchProjectId, 'mapNode')).toBe(false);
        if (kind !== 'basic') expect(choices.researchProjectId).toBeNull();
      }
    }
  });

  it('permits only Joint inspection and Assembler payment at the relevant Basics steps', () => {
    const game = createTutorialState('basic');
    for (const stage of ['research-open', 'research-explain'] as const) {
      expect(tutorialChoices('basic', stage, game).researchProjectId).toBe('joint');
    }
    for (const stage of ['cores-open', 'cores-explain'] as const) {
      expect(tutorialChoices('basic', stage, game).researchProjectId).toBe('assembler');
    }
    expect(tutorialChoices('basic', 'make-core', game).researchProjectId).toBeNull();
  });

  it('permits only the required Expansion destination, including minimap actions', () => {
    const game = createTutorialState('expansion');
    for (const stage of EXPANSION_STAGES) {
      const target = tutorialChoices('expansion', stage, game).sectorId;
      expect([EXPANSION_HOME, EXPANSION_OUTPOST]).toContain(target);
      expect(permitsTutorialChoice(target, '6,5')).toBe(false);
    }
    expect(tutorialChoices('expansion', 'expansion-return', game).sectorId).toBe(EXPANSION_HOME);
    expect(tutorialChoices('expansion', 'expansion-outpost', game).sectorId).toBe(EXPANSION_OUTPOST);
    game.activeSectorId = EXPANSION_OUTPOST;
    expect(tutorialChoices('expansion', 'expansion-road-place', game).buildKind).toBe('road');
    game.sectors[EXPANSION_OUTPOST].nodes.push(tutorialNode('road', 'new-road', 3892.5, 350, { roadMode: 'export' }));
    expect(tutorialChoices('expansion', 'expansion-road-place', game).buildKind).toBeUndefined();
  });

  it('keeps the two tutorial Refiners on their own recipes when revisited', () => {
    const gear = tutorialNode('refiner', 'gear', 1000, 1000);
    const core = tutorialNode('refiner', 'core', 1400, 1000);
    expect(tutorialRecipeChoice('basic', gear, [gear, core])).toBe('copper-gear');
    expect(tutorialRecipeChoice('basic', core, [gear, core])).toBe('simple-core');
    expect(permitsTutorialChoice(tutorialRecipeChoice('basic', gear, [gear, core]), 'simple-core')).toBe(false);
  });
});
