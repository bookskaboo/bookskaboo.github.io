import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameState, MachineNode } from '../domain/types';
import { getResearchProject } from '../content/research';
import { researchTriggerCopy } from '../content/researchGuidance';
import { createInitialState, GameEngine } from '../simulation/engine';
import { normalizeLegacy } from '../persistence/saves';
import { getResearchMilestones } from './researchMilestones';
import { researchCardDetails, searchResearch } from './researchPresentation';
import { readStatusHintHistory } from './upgrades/statusHints';
import { ResearchListRow } from './upgrades/ResearchListRow';
import { ResearchProjectDetail } from './ResearchProjectDetail';

const pending = 'Extract Mythril from a Dwarven deposit while its settlement is fully suppressed.';
const complete = 'First Dwarven Mythril extracted';
const legacyPending = 'Produce Mythril Tribute at a Dwarven settlement';
const legacyComplete = 'First Dwarven Mythril Tribute produced';
const legacyDetail = 'The factory’s future depends on their cooperation.';
const modernDetail = 'Keep the Dwarven settlement fully suppressed, then connect an Extractor to its Mythril deposit. Cooperation now comes with a cable.';
const project = getResearchProject('mithrilTools')!;
function node(kind: MachineNode['kind'], id = kind): MachineNode {
  return { id, kind, name: kind, x: 1000, y: 1000, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0 };
}
function fixture(version: GameState['worldRulesVersion'] = 2) {
  const game = createInitialState(321);
  game.worldRulesVersion = version;
  game.research.completed = ['kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'basicCore', 'exploration', 'road', 'automataCore', 'fabricatorTools', 'lakeTools', 'hydrochemistry', 'hydraulicAssembly', 'hydroCore', 'fluidRouting', 'suppressionBot', 'sealedRobotics'];
  game.produced = { 'simple-core': 1, 'basic-core': 1, 'automata-core': 1, 'hydro-core': 1 };
  game.sectors['5,5'].nodes.push(node('researchCenter'));
  game.sectors['8,6'] = { ...structuredClone(game.sectors['5,5']), id: '8,6', x: 8, y: 6, unlocked: true, visited: true,
    nodes: [{ ...node('monster-camp'), lizardSettlement: 'camp' }], connections: [] };
  return game;
}

describe('world-specific Mythril guidance', () => {
  it.each([1, undefined] as const)('retains legacy pending and completed wording for saved version %s', version => {
    const game = fixture(); if (version === undefined) delete game.worldRulesVersion; else game.worldRulesVersion = version;
    expect(researchCardDetails(project, game).status).toBe(legacyPending);
    game.research.completed.push('mithrilTools');
    expect(researchCardDetails(project, game).status).toBe(legacyComplete);
  });
  it('uses extraction wording in pending/completed status and tooltips without mutating the catalog', () => {
    const game = fixture(), original = structuredClone(project);
    expect(researchCardDetails(project, game).status).toBe(pending);
    expect(researchCardDetails(project, game).tooltip).toContain(pending);
    game.research.completed.push('mithrilTools');
    expect(researchCardDetails(project, game).status).toBe(complete);
    expect(project).toEqual(original);
  });
  it('searches the matching world requirement without leaking obsolete Tribute copy into new-world results', () => {
    expect(searchResearch(fixture(), 'fully suppressed').map(entry => entry.id)).toContain('mithrilTools');
    expect(searchResearch(fixture(), 'Tribute').map(entry => entry.id)).not.toContain('mithrilTools');
    expect(searchResearch(fixture(1), 'Tribute').map(entry => entry.id)).toContain('mithrilTools');
  });
  it.each([1, 2] as const)('renders matching list and detailed requirements for world version %s', version => {
    const game = fixture(version), engine = new GameEngine(game, { autosave: false });
    const list = renderToStaticMarkup(<ResearchListRow project={project} game={game} onInspect={() => {}} onOpenRecipe={() => {}} />);
    const detail = renderToStaticMarkup(<ResearchProjectDetail project={project} game={game} engine={engine} onPrerequisite={() => {}} onOpenRecipe={() => {}} />);
    expect(list).toContain(version === 2 ? pending : legacyPending);
    expect(detail).toContain(version === 2 ? pending : legacyPending);
    if (version === 2) { expect(list).not.toContain('Tribute'); expect(detail).not.toContain('Tribute'); }
  });
  it('guides a visited new-world Dwarven settlement to extraction and keeps the same navigation target', () => {
    const game = fixture();
    expect(getResearchMilestones(game)[0]).toEqual({ title: 'Dwarven Mythril', detail: modernDetail, action: { kind: 'sector', id: '8,6' } });
    game.sectors['8,6'].visited = false;
    expect(getResearchMilestones(game).map(hint => hint.title)).not.toContain('Dwarven Mythril');
  });
  it('retains the legacy settlement hint and supporting flavor', () => {
    expect(getResearchMilestones(fixture(1))[0]).toEqual({ title: 'Dwarven Tribute', detail: legacyDetail, action: { kind: 'sector', id: '8,6' } });
  });
  it('corrects an earned old hint after the new-world objective is completed without duplicating it or mutating the save', () => {
    const game = fixture(); game.research.completed.push('mithrilTools');
    game.researchHintHistory = { assignmentAcknowledged: true, unlocked: [
      { title: 'Dwarven Tribute', detail: legacyDetail }, { title: 'Dwarven Mythril', detail: modernDetail },
      { title: 'Earlier clue', detail: 'Keep this earned clue.' },
    ] };
    const original = structuredClone(game.researchHintHistory);
    const hints = readStatusHintHistory(game).unlocked;
    expect(hints.filter(hint => hint.title === 'Dwarven Mythril')).toEqual([{ title: 'Dwarven Mythril', detail: modernDetail }]);
    expect(hints.some(hint => hint.title === 'Dwarven Tribute')).toBe(false);
    expect(hints).toContainEqual({ title: 'Earlier clue', detail: 'Keep this earned clue.' });
    expect(game.researchHintHistory).toEqual(original);
  });
  it('preserves earned legacy wording and custom hint text', () => {
    const game = fixture(1); game.research.completed.push('mithrilTools');
    game.researchHintHistory = { assignmentAcknowledged: true, unlocked: [{ title: 'Dwarven Tribute', detail: legacyDetail }] };
    expect(readStatusHintHistory(game).unlocked).toContainEqual({ title: 'Dwarven Tribute', detail: legacyDetail });
    game.worldRulesVersion = 2; game.researchHintHistory.unlocked[0].detail = 'A custom hint.';
    expect(readStatusHintHistory(game).unlocked).toContainEqual({ title: 'Dwarven Tribute', detail: 'A custom hint.' });
  });
  it('selects guidance from the normalized saved world marker', () => {
    const modern = normalizeLegacy(JSON.parse(JSON.stringify(fixture())))!;
    const old = fixture(1); delete old.worldRulesVersion;
    const legacy = normalizeLegacy(JSON.parse(JSON.stringify(old)))!;
    expect(researchCardDetails(project, modern).status).toBe(pending);
    expect(researchCardDetails(project, legacy).status).toBe(legacyPending);
  });
  it('preserves custom trigger wording instead of overwriting a mod author’s copy', () => {
    const custom = { ...project, trigger: { ...project.trigger!, pending: 'Collect the custom mineral.', complete: 'Custom mineral collected.' } };
    expect(researchTriggerCopy(custom, fixture())).toEqual(custom.trigger);
  });
});
