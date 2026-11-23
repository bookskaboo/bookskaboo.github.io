import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOT_UPGRADES, characterStage } from '../content/botUpgrades';
import { getResearchProject } from '../content/research';
import { emptyMod } from '../mods/modTypes';
import { normalizeLegacy, readSlots, saveSlot } from '../persistence/saves';
import { createInitialState, GameEngine } from '../simulation/engine';
import { ResearchPanel } from './ResearchPanel';
import { acknowledgeStatusAssignment, syncStatusHintHistory } from './upgrades/statusHints';

afterEach(() => vi.unstubAllGlobals());
const panel = (engine: GameEngine, allowedProjectId?: string) => renderToStaticMarkup(<ResearchPanel game={engine.getState()} engine={engine}
  allowedProjectId={allowedProjectId} onClose={() => {}} onOpenRecipe={() => {}} />);

describe('adopted Upgrades screen', () => {
  it('opens with the assignment, four queue slots and start-available Simple upgrade', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const html = panel(engine);
    expect(html).toContain('aria-label="Upgrades"');
    expect(html).toContain('Your assignment');
    expect(html).toContain('Enable Simple upgrade');
    expect(html).toContain('Queue slot 4 empty');
    expect(html).toContain('Production nodes');
    expect(html).toContain('Node upgrades');
    expect(html).not.toContain('Hold to reveal');
    expect(html).not.toContain('data-project-detail');
    expect(html).not.toContain('Payment tests');
    expect(html).not.toContain('Research tree');
    expect(engine.queueResearch(BOT_UPGRADES[0].id)).toBe('added');
  });

  it('adopts reviewed titles and tutorial actions without granting the author hint catalog', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const html = renderToStaticMarkup(<ResearchPanel game={engine.getState()} engine={engine}
      onClose={() => {}} onOpenRecipe={() => {}} onStartHintTutorial={() => {}} />);
    expect(html).toContain('Terms of employment');
    expect(html).toContain('Open Basics tutorial');
    expect(html).toContain('Show me');
    expect(html).not.toContain('Promotion pending');
    expect(html).not.toContain('A complete picture');
    expect(html).not.toContain('Hint example');
    expect(html).not.toContain('Review notes');
    expect(engine.getState().research.completed).not.toContain('exploration');
    expect(engine.getState().research.completed).not.toContain('finalCore');
    expect(engine.getState().research.queue).toEqual([]);
  });

  it('restores only earned hint keys after practice and retains ordinary research state', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    syncStatusHintHistory(engine.getState());
    const before = structuredClone(engine.getState());
    const context = { hintKey: 'Copper prospects', filter: 'nodes' as const, query: '', showCompleted: false, scrollTop: 0 };
    const render = (hintKey: string) => renderToStaticMarkup(<ResearchPanel game={engine.getState()} engine={engine}
      onClose={() => {}} onOpenRecipe={() => {}} onStartHintTutorial={() => {}} initialContext={{ ...context, hintKey }} />);
    expect(render('Copper prospects')).toContain('<strong>Grounds for optimism</strong>');
    expect(render('Complex upgrade')).toContain('<strong>Terms of employment</strong>');
    expect(render('Complex upgrade')).not.toContain('<strong>Promotion pending</strong>');
    expect(engine.getState()).toEqual(before);
  });

  it('restricts Basics to one Assembler project and one queue slot', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const html = panel(engine, 'assembler');
    expect(html).toContain('data-research-id="assembler"');
    expect(html).toContain('Queue slot 1 empty');
    expect(html).not.toContain('Queue slot 2 empty');
    expect(html).not.toContain('data-research-id="mapNode"');
    expect(html).not.toContain('data-research-id="kiln"');
    expect(html).toMatch(/<button[^>]*disabled[^>]*aria-label="Enable Simple upgrade"/);
  });

  it('retains a partially funded factory, queue, history and old map bill through actual slots and replacement', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) });
    const old = createInitialState(204);
    old.sectors['5,5'].visited = true; old.sectors['5,5'].controlGroups = [];
    delete old.mapResearchMode; delete old.research.queue;
    old.research.completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'exploration', 'automataCore'];
    old.research.selected = 'mapNode';
    old.research.contributed = { 'simple-core': 7, 'basic-core': 4 };
    old.research.projectContributions = { hydroCore: { 'simple-core': 2, 'basic-core': 2, 'automata-core': 2 } };
    old.research.mapNodeQuote = { completion: 2, destination: '6,5', costs: { 'simple-core': 9, 'basic-core': 4 } };
    old.research.repeatableCompletions = { mapNode: 2 };
    old.research.paused = true;
    old.sectors['5,5'].nodes.push({ id: 'saved-lab', kind: 'researchCenter', name: 'Research Center', x: 2000, y: 1200,
      rotation: 0, input: { 'simple-core': 2 }, output: {}, cycleMs: 5000, progressMs: 1200, constructedAt: 0, constructionMs: 0 });
    syncStatusHintHistory(old); acknowledgeStatusAssignment(old);
    const source = structuredClone(old);
    saveSlot(0, old, 'Before Upgrades');
    const loaded = readSlots()[0]!.state;
    const engine = new GameEngine(loaded, { autosave: false });
    engine.replaceState(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    const state = engine.getState();
    expect(old).toEqual(source);
    expect(characterStage(state)).toBe(2);
    expect(state.research.completed).toContain('basicCore');
    expect(state.research.completed).not.toContain('finalBotUpgrade');
    expect(state.research.selected).toBe('mapNode');
    expect(state.research.queue).toEqual(['mapNode']);
    expect(state.research.contributed).toEqual(source.research.contributed);
    expect(state.research.projectContributions).toEqual(source.research.projectContributions);
    expect(state.research.mapNodeQuote).toEqual({ completion: 2, costs: { 'simple-core': 9, 'basic-core': 4 } });
    expect(state.research.paused).toBe(true);
    expect(state.sectors).toEqual(source.sectors);
    expect(state.researchHintHistory).toEqual(source.researchHintHistory);
  });

  it('keeps applied-mod factories on their existing catalog and screen until support is revisited', () => {
    const state = createInitialState(204);
    state.mod = emptyMod(); delete state.mapResearchMode; delete state.research.queue;
    const engine = new GameEngine(state, { autosave: false });
    expect(getResearchProject('basicCore')?.name).toBe('Basic Core');
    expect(getResearchProject('finalBotUpgrade')).toBeUndefined();
    expect(engine.getState().mapResearchMode).toBeUndefined();
    expect(panel(engine)).toContain('Research projects');
    engine.applyMod(undefined);
    expect(getResearchProject('basicCore')?.name).toBe('Simple upgrade');
    expect(panel(engine)).toContain('aria-label="Upgrades"');
    expect(engine.getState().mapResearchMode).toBe('points');
  });
});
