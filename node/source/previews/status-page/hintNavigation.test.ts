import selectorSource from '../../src/ui/researchMilestones.ts?raw';
import { describe, expect, it } from 'vitest';
import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import { getResearchProject } from '../../src/content/research';
import { researchCardDetails } from '../../src/ui/researchPresentation';
import { eligibleStatusHints } from '../../src/ui/upgrades/statusHints';
import { statusResearchList } from '../../src/ui/upgrades/researchList';
import { isTutorialUnlocked } from '../../src/tutorials/tutorialUnlocks';
import { hintDestination, hintTutorialPractice } from './hintNavigation';
import { HINT_REVIEW } from './hintReview';
import { HINT_EXAMPLES, hintCatalogExample, hintExampleClue, hintExampleVariants, hintRecommendation } from './hintNavigationCatalog';
import { hintDisplayTitle } from '../../src/content/hintTitles';
import { hintPreviewTitle } from './hintTitles';

const cases = HINT_EXAMPLES.flatMap(entry => hintExampleVariants(entry.id).map(variant => ({ entry, variant })));
describe('complete ordered hint navigation study', () => {
  it('preserves the existing author order and includes the overlooked live detour', () => {
    expect(HINT_EXAMPLES.map(entry => entry.id)).toEqual(HINT_REVIEW.map(entry => entry.id));
    expect(HINT_EXAMPLES.slice(0, 9).map(entry => entry.id)).toEqual(['assignment','wood','copper','fuel','plate','lab','simple','iron','assembler']);
    const index = HINT_EXAMPLES.findIndex(entry => entry.id === 'exploration');
    expect(HINT_EXAMPLES[index + 1].id).toBe('detour');
    expect(new Set(HINT_EXAMPLES.map(entry => entry.id)).size).toBe(HINT_EXAMPLES.length);
    expect(HINT_EXAMPLES.at(-1)?.id).toBe('finished');
    expect(HINT_EXAMPLES.some(entry=>['yin','yang','treePlanter','golems','golem','heavyRobotics','commandRobotics','trucks','roadChannels1','trains'].includes(entry.id))).toBe(false);
    const upgradeIndex=HINT_EXAMPLES.findIndex(entry=>entry.id==='complexUpgrade');
    for(const id of ['corners','grove','reclamation','foundry','dragon'])expect(HINT_EXAMPLES.findIndex(entry=>entry.id===id)).toBeGreaterThan(upgradeIndex);
    expect(HINT_EXAMPLES.findIndex(entry=>entry.id==='final')).toBeGreaterThan(HINT_EXAMPLES.findIndex(entry=>entry.id==='dragon'));
  });
  it('covers literal scout/build/terminal clue titles declared by the live selector', () => {
    const declarations = [...selectorSource.matchAll(/(?:scout\(|build\('extractor',\s*|goal\()'([^']+)'/g)].map(match => match[1]);
    for (const title of declarations) expect(HINT_REVIEW.some(row => row.title === title), title).toBe(true);
    expect(HINT_REVIEW.some(row => row.title === 'A useful detour')).toBe(true);
  });
  it.each(cases)('$entry.id / $variant.id has live copy, a concrete suggestion and a safe destination', ({ entry, variant }) => {
    const engine = hintCatalogExample(entry.id, variant.id);
    const game = engine.getState();
    const clue = hintExampleClue(game, entry.id, variant.id);
    expect(hintDisplayTitle(clue.title)).toBe(hintPreviewTitle(entry.id, variant.id));
    expect(eligibleStatusHints(game)).toContainEqual(clue);
    if (entry.id !== 'detour' && variant.id !== 'pieces') expect(clue.detail).toBe(entry.text);
    const snapshot = JSON.stringify(game);
    const suggestion = hintRecommendation(entry, game, clue.title);
    expect(suggestion.why.length).toBeGreaterThan(20);
    expect(suggestion.next.length).toBeGreaterThan(20);
    const target = hintDestination(game, clue.title);
    if (target?.kind === 'research') {
      expect(researchCardDetails(getResearchProject(target.id)!, game).selectable).toBe(true);
      const visible = statusResearchList(game, 'nodes');
      expect(target.id === 'mapNode' || visible.projects.some(project => project.id === target.id)
        || BOT_UPGRADES.some(bot => bot.id === target.id)).toBe(true);
    }
    if (getResearchProject(entry.id)) expect(target).toEqual({ kind:'research', id:entry.id });
    if (target?.kind === 'tutorial') expect(isTutorialUnlocked(target.id, game)).toBe(true);
    expect(game.paused).toBe(true);
    expect(engine.retryAutosave()).toBe(false);
    expect(JSON.stringify(game)).toBe(snapshot);
  });
  it.each(['basic','automata','hydro','shiny','complex'])('%s switches from its actual upgrade to no unsupported recipe shortcut', id => {
    const before = hintCatalogExample(id).getState();
    const clue = hintExampleClue(before, id);
    const destination = hintDestination(before, clue.title);
    expect(destination?.kind).toBe('research');
    expect(BOT_UPGRADES.some(bot => bot.id === destination?.id)).toBe(true);
    const after = hintCatalogExample(id, 'production').getState();
    expect(hintDestination(after, hintExampleClue(after, id, 'production').title)).toBeUndefined();
  });
  it.each(['detour','lake','camp','dwarves','corners'])('%s uses Map Point research before an unlocked Expansion refresher', id => {
    const before = hintCatalogExample(id).getState();
    expect(hintDestination(before, hintExampleClue(before, id).title)).toEqual({ kind:'research', id:'mapNode' });
    const after = hintCatalogExample(id, 'map-point').getState();
    expect(hintDestination(after, hintExampleClue(after, id, 'map-point').title)).toEqual({ kind:'tutorial', id:'expansion' });
  });
  it('does not reuse Basics for Iron, fake absent lessons or mix legacy world rules', () => {
    for (const id of ['iron','tribute','bot','grove','reclamation','foundry','dragon','final','finished']) {
      const game = hintCatalogExample(id).getState();
      expect(hintDestination(game, hintExampleClue(game, id).title), id).toBeUndefined();
    }
    const game = hintCatalogExample('guardedMythril').getState();
    expect(hintDestination(game, 'Dwarven Mythril')).toEqual({kind:'tutorial',id:'monster-camps'});
    expect(eligibleStatusHints(game).some(hint => hint.title === 'Dwarven Tribute')).toBe(false);
  });
  it('never navigates arbitrary, stale or unreached saved hint titles', () => {
    const game = hintCatalogExample('wood').getState();
    game.researchHintHistory!.unlocked.push({title:'A metallic glint',detail:'Old saved clue'});
    expect(hintDestination(game,'A metallic glint')).toBeUndefined();
    expect(hintDestination(game,'Exploration')).toBeUndefined();
    expect(hintDestination(game,'Invented clue')).toBeUndefined();
    const later = hintCatalogExample('exploration').getState();
    later.research.completed.push('exploration');
    expect(hintDestination(later,'Exploration')).toBeUndefined();
  });
  it.each(['basic','expansion','monster-camps'] as const)('%s practice stays independent and autosave disabled', kind => {
    const study = hintCatalogExample('assignment');
    const before = JSON.stringify(study.getState());
    const practice = hintTutorialPractice(kind);
    expect(practice.getState().isTraining).toBe(true);
    expect(practice.retryAutosave()).toBe(false);
    practice.togglePause();
    expect(JSON.stringify(study.getState())).toBe(before);
  });
});
