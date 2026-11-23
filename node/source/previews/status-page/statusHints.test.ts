import selectorSource from '../../src/ui/researchMilestones.ts?raw';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getResearchMilestones } from '../../src/ui/researchMilestones';
import { ASSIGNMENT, previewState } from './model';
import { assignmentComplete, eligibleStatusHints, hintKey, mergeUnlockedHints, statusHint } from './statusHints';
import { HintBrowser } from './HintBrowser';
import { HINT_REVIEW } from './hintReview';
import { mythrilGuidance } from '../../src/content/researchGuidance';

describe('Status assignment and hint review', () => {
  it('starts with the assignment, then recommends Forest after acknowledgement before any extraction', () => {
    const game = previewState(0);
    expect(statusHint(game)).toMatchObject({ title: 'Your assignment', detail: ASSIGNMENT });
    expect(statusHint(game, 'Edited assignment')?.detail).toBe('Edited assignment');
    expect(assignmentComplete(game, true)).toBe(true);
    expect(statusHint(game, ASSIGNMENT, true)?.title).toBe('A promising Forest');
    expect(game.extracted?.wood ?? 0).toBe(0);
    expect(game.research.completed).not.toContain('kiln');
  });

  it('only unlocks hints admitted by the existing world conditions', () => {
    const game = previewState(0);
    const opening = eligibleStatusHints(game);
    expect(opening.map(hint => hint.title)).toEqual(['Your assignment', 'A promising Forest', 'Copper prospects', 'Charcoal']);
    expect(opening.some(hint => hint.title === 'The factory is thirsty')).toBe(false);
    expect(opening.some(hint => hint.title === 'The four corners')).toBe(false);
    game.research.completed.push('exploration');
    const expanded = eligibleStatusHints(game);
    expect(expanded.some(hint => hint.title === 'The factory is thirsty')).toBe(true);
    expect(expanded.some(hint => hint.title === 'The four corners')).toBe(false);
    game.research.completed.push('automataCore');
    expect(eligibleStatusHints(game).some(hint => hint.title === 'The four corners')).toBe(false);
    game.research.completed.push('complexCore','precisionControl','finalCore');
    expect(eligibleStatusHints(game).some(hint => hint.title === 'The four corners')).toBe(true);
    expect(getResearchMilestones(game)).toEqual(getResearchMilestones(game, { allCandidates: true }).slice(0, 3));
    expect(getResearchMilestones(game, { allCandidates: true }).length).toBeGreaterThan(3);
  });

  it('retains past eligible clues for browsing, without importing unreached review entries', () => {
    const game = previewState(0);
    const opening = eligibleStatusHints(game);
    game.extracted = { wood: 1 };
    game.research.completed.push('kiln', 'smelter', 'refiner', 'exploration');
    const next = eligibleStatusHints(game);
    const history = mergeUnlockedHints(opening, next);
    expect(next.some(hint => hint.title === 'Your assignment')).toBe(false);
    expect(history.slice(0, opening.length)).toEqual(opening);
    expect(history).toContainEqual(statusHint(game));
    expect(history.some(hint => hint.title === 'The four corners')).toBe(false);
    expect(new Set(history.map(hintKey)).size).toBe(history.length);
    expect(mergeUnlockedHints(history, next)).toEqual(history);
    const edited = mergeUnlockedHints(history, eligibleStatusHints(previewState(0), 'Updated assignment'));
    expect(edited.filter(hint => hintKey(hint) === 'assignment')).toHaveLength(1);
    expect(edited[0].detail).toBe('Updated assignment');
  });

  it('renders visible hint copy and bounded navigation without a hold control or future clues', () => {
    const html = renderToStaticMarkup(createElement(HintBrowser, {
      game: previewState(0), assignment: ASSIGNMENT, onAssignmentRead() {},
    }));
    expect(html).toContain(ASSIGNMENT);
    expect(html).toMatch(/aria-label="Previous hint"[^>]*disabled/);
    expect(html).toContain('aria-label="Next hint"');
    expect(html).not.toContain('>Previous<');
    expect(html).not.toContain('>Next<');
    expect(html).not.toContain('>Current<');
    expect(html).not.toContain('Hold');
    expect(html).not.toContain('The four corners');
    expect(html).not.toContain('The factory is thirsty');
  });

  it('skips the introduction when an example already has opening progress', () => {
    const game = previewState(0);
    game.extracted = { copper: 1 };
    expect(assignmentComplete(game)).toBe(false);
    game.extracted.wood = 1;
    expect(assignmentComplete(game)).toBe(true);
    expect(statusHint(game)).toEqual(getResearchMilestones(game)[0]);
    game.extracted = {};
    game.research.completed.push('kiln');
    expect(statusHint(game)).toEqual(getResearchMilestones(game)[0]);
  });

  it('uses the existing primary in later examples and preserves terminal victory', () => {
    for (let stage = 1; stage < 8; stage++) {
      const game = previewState(stage);
      expect(statusHint(game)).toEqual(getResearchMilestones(game)[0]);
    }
    const game = previewState(7);
    game.research.completed.push('victory');
    expect(statusHint(game)?.title).toBe('You’ve got this');
  });

  it('follows Copper, Charcoal and First Plate despite competing secondary clues', () => {
    const game = previewState(0);
    game.extracted = { wood: 1 };
    game.research.completed.push('kiln');
    expect(getResearchMilestones(game).at(-1)?.title).toBe('Charcoal');
    expect(statusHint(game)?.title).toBe('Copper prospects');
    game.research.completed.push('smelter');
    expect(statusHint(game)?.title).toBe('Charcoal');
    game.produced = { charcoal: 1 };
    expect(statusHint(game)?.title).toBe('First Plate');
  });

  it('includes every sentence of current selector hint copy, including corner and optional clues', () => {
    const literals = [...selectorSource.matchAll(/(['"])((?:\\.|(?!\1)[^\\\r\n])*)\1/g)].map(match => match[2]);
    const required = new Set(literals.filter(text => /[.!?]$/.test(text)));
    expect(required.size).toBeGreaterThan(30);
    const covered = new Set(HINT_REVIEW.map(row => row.text));
    for (const text of required) expect(covered.has(text), `Missing selector copy: ${text}`).toBe(true);
    for (const worldRulesVersion of [1, 2] as const) {
      const hint = mythrilGuidance({ worldRulesVersion }).hint;
      expect(HINT_REVIEW).toContainEqual(expect.objectContaining({ title: hint.title, text: hint.detail }));
    }
    expect(new Set(HINT_REVIEW.map(row => row.id)).size).toBe(HINT_REVIEW.length);
    for (const row of HINT_REVIEW) {
      expect(row.appears.length).toBeGreaterThan(10);
      expect(row.advances.length).toBeGreaterThan(10);
    }
  });
});
