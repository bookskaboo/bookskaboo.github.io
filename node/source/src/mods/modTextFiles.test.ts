import { afterEach, expect, it, vi } from 'vitest';
import { ITEM_NAMES } from '../content/items';
import { RECIPES } from '../content/recipes';
import { copySaveToSlot, readAutosave, readSlots, saveSlot } from '../persistence/saves';
import { createInitialState, GameEngine } from '../simulation/engine';
import { activateMod, BASE_MOD_CONTENT } from './modContent';
import { exportModText, MAX_MOD_FILE_BYTES, readModTextFile } from './modSharing';
import { emptyMod } from './modTypes';

const file = (text: string) => new Blob([text], { type: 'text/plain' });

afterEach(() => {
  activateMod();
  vi.unstubAllGlobals();
});

it('round-trips readable UTF-8 and accepts new entries added in a text editor', async () => {
  const draft = { ...emptyMod(), name: 'Café workshop' };
  const exported = exportModText(draft);
  expect(exported).toContain('\n  "name": "Café workshop",\n');
  expect(await readModTextFile(file(`\uFEFF${exported}`))).toEqual(draft);

  const edited = JSON.parse(exported);
  edited.resources['mod-alloy'] = { name: 'Workshop Alloy', color: '#aaffcc' };
  edited.recipes['mod-make-alloy'] = { name: 'Make Workshop Alloy', inputs: { 'copper-plate': 1 }, outputs: { 'mod-alloy': 2 }, cycleMs: 5000 };
  const imported = await readModTextFile(file(JSON.stringify(edited)));
  expect(imported.resources['mod-alloy']?.name).toBe('Workshop Alloy');
  expect(imported.recipes['mod-make-alloy'].outputs).toEqual({ 'mod-alloy': 2 });
  expect(ITEM_NAMES['mod-alloy']).toBeUndefined();
});

it('rejects malformed, oversized, and non-pack files before applying any changes', async () => {
  const header = { format: 'NODE Mod Pack', version: 1, name: 'Workshop' };
  expect(await readModTextFile(file(JSON.stringify(header)))).toEqual({ ...emptyMod(), name: 'Workshop' });
  await expect(readModTextFile(file('{bad json}'))).rejects.toThrow(/valid JSON/);
  await expect(readModTextFile(file(JSON.stringify(BASE_MOD_CONTENT.recipes)))).rejects.toThrow(/NODE Mod Pack/);
  await expect(readModTextFile(file(JSON.stringify({ ...header, version: 2 })))).rejects.toThrow(/version 1/);
  await expect(readModTextFile(file(JSON.stringify({ ...header, path: 'src/content/recipes.ts' })))).rejects.toThrow(/unknown setting/);
  await expect(readModTextFile(file(JSON.stringify({ ...header, recipes: { 'mod-example': {
    name: 'Example', inputs: {}, outputs: { 'mod-missing': 1 }, cycleMs: 5000,
  } } })))).rejects.toThrow(/mod-missing|unknown base-game entry/);
  await expect(readModTextFile(new Blob([new Uint8Array(MAX_MOD_FILE_BYTES + 1)]))).rejects.toThrow(/2 MB/);
});

it('embeds the applied file pack in manual and automatic saves and keeps base templates read-only', async () => {
  const browserStorage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => browserStorage.get(key) ?? null,
    setItem: (key: string, value: string) => browserStorage.set(key, value),
  });
  const imported = await readModTextFile(file(JSON.stringify({
    format: 'NODE Mod Pack', version: 1, name: 'Foundry pack',
    resources: { wood: { name: 'Timber' }, 'mod-alloy': { name: 'Alloy', color: '#aaffcc' } },
    recipes: { charcoal: { inputs: { wood: 2 } } },
    profiles: { connections: { selected: 'mod-fast', entries: { 'mod-fast': { name: 'Fast', rules: { cableTravelMs: 500 } } } } },
  })));
  const state = createInitialState(82);
  state.preferences.autosaveMinutes = 1;
  const engine = new GameEngine(state);
  engine.applyMod(imported);
  saveSlot(0, engine.getState(), 'Modded factory');
  for (let tick = 0; tick < 60; tick++) engine.tick(1000);
  const autosave = readAutosave()!;
  expect(autosave.state.mod).toEqual(imported);
  copySaveToSlot(1, autosave);
  expect(readSlots().slice(0, 2).map(slot => slot?.state.mod)).toEqual([imported, imported]);

  engine.applyMod();
  expect(ITEM_NAMES.wood).toBe('Wood');
  expect(ITEM_NAMES['mod-alloy']).toBeUndefined();
  expect(Object.isFrozen(BASE_MOD_CONTENT.recipes.charcoal.inputs)).toBe(true);
  expect(BASE_MOD_CONTENT.recipes.charcoal.inputs).toEqual({ wood: 1 });
  engine.replaceState(readSlots()[0]!.state);
  expect(ITEM_NAMES.wood).toBe('Timber');
  expect(ITEM_NAMES['mod-alloy']).toBe('Alloy');
  expect(RECIPES.charcoal.inputs).toEqual({ wood: 2 });
});
