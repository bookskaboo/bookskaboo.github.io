import { describe, expect, it } from 'vitest';
import { lessonCopy, lessonSatisfied, MANUAL_STAGES } from '../../src/tutorials/tutorialRuntime';
import { queueTutorialResearch } from '../../src/tutorials/tutorialChoices';
import { researchPracticeExample } from './researchPractice';

describe('Upgrades adaptation of the Basics research segment', () => {
  it('requires queuing the permitted project, rather than merely highlighting it', () => {
    const engine = researchPracticeExample();
    const state = engine.getState();
    expect(lessonSatisfied('cores-open', state, 'research')).toBe(false);
    const before = structuredClone(state.research);
    expect(queueTutorialResearch(engine, 'basic', 'cores-open', 'basicCore')).toBe('unavailable');
    expect(state.research).toEqual(before);
    expect(queueTutorialResearch(engine, 'basic', 'cores-open', 'assembler')).toBe('added');
    expect(lessonSatisfied('cores-open', state, 'research')).toBe(true);
    expect(lessonSatisfied('cores-explain', state, 'research')).toBe(false);
    expect(MANUAL_STAGES.has('cores-explain')).toBe(false);
  });

  it('waits for all five real Research Center payments and respects pause', () => {
    const engine = researchPracticeExample();
    const state = engine.getState();
    const lab = state.sectors['5,5'].nodes.find(node => node.id === 'queue-test-lab')!;
    lab.input['simple-core'] = 4;
    engine.setResearchPaused(true);
    expect(queueTutorialResearch(engine, 'basic', 'cores-open', 'assembler')).toBe('added');
    expect(lessonSatisfied('cores-open', state, 'research')).toBe(true);
    for (let i = 0; i < 300; i++) engine.tick(100);
    expect(lab.input['simple-core']).toBe(4);
    expect(lessonSatisfied('cores-explain', state, null)).toBe(false);
    engine.setResearchPaused(false);
    for (let i = 0; i < 300; i++) engine.tick(100);
    expect(lab.input['simple-core']).toBe(0);
    expect(lessonSatisfied('cores-explain', state, null)).toBe(false);
    lab.input['simple-core'] = 1;
    for (let i = 0; i < 60; i++) engine.tick(100);
    expect(lessonSatisfied('cores-explain', state, null)).toBe(true);
    expect(queueTutorialResearch(engine, 'basic', 'cores-complete', 'basicCore')).toBe('unavailable');
    expect(engine.queueResearch('basicCore')).toBe('added');
  });

  it('adapts only the opted-in copy and introduces the full queue after completion', () => {
    expect(lessonCopy('cores-open').instruction).toContain('Start Assembler research');
    expect(lessonCopy('cores-open', 'upgrades').instruction).toBe('Select Assembler, then press Queue research.');
    expect(lessonCopy('cores-complete', 'upgrades').body).toContain('queue up to four projects');
    const engine = researchPracticeExample();
    expect(queueTutorialResearch(engine, 'basic', 'research-explain', 'joint')).toBe('unavailable');
  });
});
