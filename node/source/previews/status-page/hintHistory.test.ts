import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeResearchHintHistory } from '../../src/domain/researchHintHistory';
import { AUTOSAVE_KEY, copySaveToSlot, normalizeLegacy, readAutosave, readSlots, saveSlot } from '../../src/persistence/saves';
import { GameEngine } from '../../src/simulation/engine';
import { getResearchMilestones } from '../../src/ui/researchMilestones';
import { ASSIGNMENT, previewState } from './model';
import { acknowledgeStatusAssignment, eligibleStatusHints, readStatusHintHistory, statusHint, syncStatusHintHistory } from './statusHints';

afterEach(() => vi.unstubAllGlobals());

describe('per-factory hint history', () => {
  it('keeps the acknowledged assignment and unlocked opening clues through normalized save/load', () => {
    const game = previewState(0);
    syncStatusHintHistory(game); acknowledgeStatusAssignment(game);
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(game)))!, { autosave: false }).getState();
    expect(restored.researchHintHistory?.assignmentAcknowledged).toBe(true);
    expect(restored.researchHintHistory?.unlocked.map(hint => hint.title)).toEqual(['Your assignment', 'A promising Forest', 'Copper prospects', 'Charcoal']);
    expect(statusHint(restored)?.title).toBe('A promising Forest');
    expect(restored.extracted?.wood ?? 0).toBe(0);
    expect(restored.research.completed).not.toContain('kiln');
  });

  it('retains retired eligible hints while recommending the live primary and hiding future clues', () => {
    const game = previewState(0); syncStatusHintHistory(game);
    game.extracted = { wood: 1 };
    game.research.completed.push('kiln', 'smelter', 'refiner', 'exploration');
    expect(eligibleStatusHints(game).some(hint => hint.title === 'Copper prospects')).toBe(false);
    syncStatusHintHistory(game);
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(game)))!;
    const history = readStatusHintHistory(loaded);
    expect(history.unlocked.some(hint => hint.title === 'Copper prospects')).toBe(true);
    expect(history.unlocked.some(hint => hint.title === 'Your assignment')).toBe(true);
    expect(history.unlocked.some(hint => hint.title === 'The four corners')).toBe(false);
    expect(statusHint(loaded)).toEqual(getResearchMilestones(loaded)[0]);
    expect(statusHint(loaded)?.title).not.toBe('Your assignment');
    expect(history.assignmentAcknowledged).toBe(true);
  });

  it('seeds old factories from current eligibility without granting the review catalog', () => {
    const game = normalizeLegacy(JSON.parse(JSON.stringify(previewState(0))))!;
    expect(game.researchHintHistory).toBeUndefined();
    expect(readStatusHintHistory(game).unlocked).toHaveLength(4);
    expect(game.researchHintHistory).toBeUndefined();
    game.research.completed.push('kiln', 'smelter', 'refiner', 'exploration');
    syncStatusHintHistory(game);
    expect(game.researchHintHistory?.assignmentAcknowledged).toBe(true);
    expect(game.researchHintHistory?.unlocked.some(hint => hint.title === 'Your assignment')).toBe(false);
    expect(game.researchHintHistory?.unlocked.some(hint => hint.title === 'The four corners')).toBe(false);
  });

  it('refreshes matching copy without duplicating hints and refreshes the saved assignment after acknowledgement', () => {
    const game = previewState(0);
    game.researchHintHistory = { assignmentAcknowledged: false, unlocked: [
      { title: 'Your assignment', detail: 'Earlier assignment' },
      { title: 'A promising Forest', detail: 'Earlier Forest copy' },
      { title: 'Suppression Bot 4 AP', detail: 'A steady procession might be persuasive.' },
      { title: 'Tree Planter', detail: 'Forests are a growth industry.' },
      { title: 'Trains', detail: 'The freight is becoming unreasonable.' },
      { title: 'Yin', detail: 'Two pieces seem to agree.' },
      { title: 'Yang', detail: 'Two pieces seem to agree.' },
    ] };
    syncStatusHintHistory(game);
    expect(game.researchHintHistory.unlocked).toContainEqual({title:'Suppression Bot',detail:'A steady procession might be persuasive.'});
    expect(game.researchHintHistory.unlocked.some(hint=>['Suppression Bot 4 AP','Tree Planter','Trains','Yin','Yang'].includes(hint.title))).toBe(false);
    expect(game.researchHintHistory.unlocked.filter(hint => hint.title === 'A promising Forest')).toEqual([
      { title: 'A promising Forest', detail: 'The trees look employable.' },
    ]);
    acknowledgeStatusAssignment(game);
    syncStatusHintHistory(game, 'Updated assignment');
    expect(game.researchHintHistory.unlocked.filter(hint => hint.title === 'Your assignment')).toEqual([
      { title: 'Your assignment', detail: 'Updated assignment' },
    ]);
    expect(game.researchHintHistory.assignmentAcknowledged).toBe(true);
  });

  it('keeps manual slots, copied slots and autosaves independent with their own hint records', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    const first = previewState(0), second = previewState(0);
    syncStatusHintHistory(first); acknowledgeStatusAssignment(first); syncStatusHintHistory(second);
    saveSlot(0, first, 'First factory'); saveSlot(1, second, 'Second factory');
    const [firstSlot, secondSlot] = readSlots();
    expect(firstSlot!.state.researchHintHistory?.assignmentAcknowledged).toBe(true);
    expect(secondSlot!.state.researchHintHistory?.assignmentAcknowledged).toBe(false);
    copySaveToSlot(2, firstSlot!);
    const copied = readSlots()[2]!;
    expect(copied.state.researchHintHistory).toEqual(firstSlot!.state.researchHintHistory);
    copied.state.researchHintHistory!.unlocked[0].detail = 'Copy only';
    expect(firstSlot!.state.researchHintHistory!.unlocked[0].detail).toBe(ASSIGNMENT);
    expect(secondSlot!.state.researchHintHistory!.unlocked[0].detail).toBe(ASSIGNMENT);
    storage.set(AUTOSAVE_KEY, JSON.stringify(first));
    expect(readAutosave()!.state.researchHintHistory).toEqual(first.researchHintHistory);
  });

  it('normalizes malformed optional metadata without breaking the factory or retaining extra hint fields', () => {
    const game = previewState(0);
    const loaded = normalizeLegacy({ ...game, researchHintHistory: { assignmentAcknowledged: 'true', unlocked: [
      null, 4, { title: '', detail: 'blank' }, { title: 'Old clue', detail: 'First' },
      { title: 'Old clue', detail: 'Updated', unexpected: 'discard' }, { title: 'Bad clue', detail: 4 },
    ] } })!;
    expect(loaded.researchHintHistory).toEqual({ assignmentAcknowledged: false, unlocked: [{ title: 'Old clue', detail: 'Updated' }] });
    expect(loaded.sectors).toEqual(game.sectors);
    expect(normalizeLegacy({ ...game, researchHintHistory: 'invalid' })?.researchHintHistory).toBeUndefined();
    expect(normalizeResearchHintHistory({ unlocked: Array.from({ length: 300 }, (_, i) => ({ title: `Clue ${i}`, detail: 'Text' })) })?.unlocked).toHaveLength(256);
  });

  it('retains learned hints and assignment acknowledgement through undo without leaking into another factory', () => {
    const fixture = previewState(0);
    fixture.sectors['5,5'].nodes = [];
    const engine = new GameEngine(fixture, { autosave: false });
    syncStatusHintHistory(engine.getState());
    const placed = engine.placeNode('extractor', 1000, 1000);
    expect(placed).toBeTruthy();
    acknowledgeStatusAssignment(engine.getState());
    engine.getState().research.completed.push('exploration');
    syncStatusHintHistory(engine.getState());
    expect(engine.getState().researchHintHistory?.unlocked.some(hint => hint.title === 'The factory is thirsty')).toBe(true);
    engine.undo();
    expect(engine.getSector().nodes.some(node => node.id === placed)).toBe(false);
    expect(engine.getState().research.completed).not.toContain('exploration');
    expect(engine.getState().researchHintHistory?.assignmentAcknowledged).toBe(true);
    expect(engine.getState().researchHintHistory?.unlocked.some(hint => hint.title === 'The factory is thirsty')).toBe(true);
    expect(statusHint(engine.getState())?.title).toBe('A promising Forest');
    engine.replaceState(previewState(0));
    expect(engine.getState().researchHintHistory).toBeUndefined();
    expect(statusHint(engine.getState())?.title).toBe('Your assignment');
  });
});
