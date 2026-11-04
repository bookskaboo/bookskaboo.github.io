import type { GameMod, ModNode, ModRules } from './modTypes';
import { BASE_MOD_CONTENT } from './modContent';

const families = new Set(['FLUID', 'WASTE', 'ANY', 'RESOURCE', 'METAL', 'PLATE', 'GEAR', 'CORE', 'ROBOT_FRAME', 'ROBOT_WEAPON', 'ATTACK_POWER', 'POWER', ...Object.keys(BASE_MOD_CONTENT.names)]);
export const RULE_LIMITS: Record<keyof ModRules, [number, number]> = {
  cableTravelMs: [100, 60000], cableLaunchMs: [50, 60000], roadTransferMs: [100, 600000],
  constructionMultiplier: [0, 100], forestRegenMs: [100, 3600000],
  mapResourceMultiplier: [0.1, 100], mapWidthMultiplier: [1, 4], mapHeightMultiplier: [1, 4],
};
const nodeNumbers: Partial<Record<keyof ModNode, [number, number]>> = {
  constructionMs: [0, 3600000], cycleMultiplier: [0.01, 100], capacity: [1, 1000000], inputCapacity: [1, 1000000],
  maxInputConnections: [0, 1000], maxOutputConnections: [0, 1000], resourceCapacity: [1, 100000000], obstructionScale: [0.25, 2],
};
const fail = (path: string, reason: string): never => { throw new Error(`${path}: ${reason}`); };
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(path, 'expected a settings object.');
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${path}.${key}`, 'unknown setting.');
}
function string(value: unknown, path: string, max = 240, empty = true) {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) fail(path, `use ${empty ? 'at most' : '1–'}${max} characters.`);
}
function number(value: unknown, path: string, range: [number, number], integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < range[0] || value > range[1] || (integer && !Number.isInteger(value))) fail(path, `use ${integer ? 'a whole number' : 'a number'} between ${range[0]} and ${range[1]}.`);
}
function color(value: unknown, path: string) { if (typeof value !== 'string' || !/^#[a-f\d]{6}$/i.test(value)) fail(path, 'choose a six-digit color.'); }
function reference(value: unknown, catalog: object, path: string, empty = false) { if (empty && value === '') return; if (typeof value !== 'string' || !Object.hasOwn(catalog, value)) fail(path, 'unknown base-game entry.'); }
function references(value: unknown, catalog: object, path: string) {
  if (!Array.isArray(value) || value.length > 200) fail(path, 'use a list of at most 200 entries.');
  (value as unknown[]).forEach((id, index) => reference(id, catalog, `${path}[${index}]`));
  if (new Set(value as unknown[]).size !== (value as unknown[]).length) fail(path, 'remove duplicate entries.');
}
function bag(value: unknown, path: string, requireOutput = false) {
  const entries = object(value, path);
  for (const [id, count] of Object.entries(entries)) { reference(id, BASE_MOD_CONTENT.names, path); number(count, `${path}.${id}`, [1, 1000000], true); }
  if (requireOutput && !Object.keys(entries).length) fail(path, 'add at least one product.');
}

/** Reject unknown keys, non-finite values, bad references, and research dependency cycles before mutation. */
export function validateMod(input: unknown): GameMod {
  const mod = object(input, 'Mod');
  keys(mod, ['version', 'name', 'author', 'description', 'resources', 'nodes', 'recipes', 'research', 'rules'], 'Mod');
  if (mod.version !== 1) fail('Mod version', 'this game supports version 1 share codes.');
  string(mod.name, 'Mod name', 80, false); string(mod.author, 'Author', 80); string(mod.description, 'Description', 2000);
  for (const [id, raw] of Object.entries(object(mod.resources, 'Resources'))) {
    reference(id, BASE_MOD_CONTENT.names, 'Resource'); const value = object(raw, id); keys(value, ['name', 'color'], id);
    if (value.name !== undefined) string(value.name, `${id} name`, 80, false);
    if (value.color !== undefined) color(value.color, `${id} color`);
  }
  for (const [id, raw] of Object.entries(object(mod.nodes, 'Nodes'))) {
    reference(id, BASE_MOD_CONTENT.nodes, 'Node'); const value = object(raw, id);
    keys(value, ['name', 'description', 'icon', 'accentCss', 'input', 'output', 'unlockResearch', 'recipeIds', 'multiInput', 'multiOutput', 'customSockets', 'worldObstacle', ...Object.keys(nodeNumbers)], id);
    for (const key of ['name', 'description', 'icon']) if (value[key] !== undefined) string(value[key], `${id} ${key}`, key === 'description' ? 2000 : key === 'icon' ? 8 : 80, key === 'description');
    if (value.accentCss !== undefined) color(value.accentCss, id);
    if (value.unlockResearch !== undefined) reference(value.unlockResearch, Object.fromEntries(BASE_MOD_CONTENT.research.map(p => [p.id, true])), `${id} unlock`, true);
    for (const key of ['input', 'output']) if (value[key] !== undefined) {
      const list = value[key]; if (!Array.isArray(list) || list.length > 16 || list.some(item => !families.has(item))) fail(`${id} ${key}`, 'choose at most 16 valid connection types.');
    }
    for (const key of ['multiInput', 'multiOutput', 'customSockets', 'worldObstacle']) if (value[key] !== undefined && typeof value[key] !== 'boolean') fail(`${id} ${key}`, 'expected on or off.');
    for (const [key, range] of Object.entries(nodeNumbers)) if (value[key] !== undefined) number(value[key], `${id} ${key}`, range!, !['cycleMultiplier', 'obstructionScale'].includes(key));
    if (value.recipeIds !== undefined) {
      if (BASE_MOD_CONTENT.capabilities[id as keyof typeof BASE_MOD_CONTENT.capabilities].behavior !== 'recipe') fail(id, 'recipes can only be assigned to recipe-processing machines.');
      references(value.recipeIds, BASE_MOD_CONTENT.recipes, `${id} recipes`);
    }
  }
  const researchIds = Object.fromEntries(BASE_MOD_CONTENT.research.map(p => [p.id, true]));
  for (const [id, raw] of Object.entries(object(mod.recipes, 'Recipes'))) {
    reference(id, BASE_MOD_CONTENT.recipes, 'Recipe'); const value = object(raw, id);
    keys(value, ['name', 'inputs', 'outputs', 'cycleMs', 'unlockResearch', 'recovery', 'chanceOutputs'], id);
    if (value.name !== undefined) string(value.name, `${id} name`, 80, false);
    if (value.inputs !== undefined) bag(value.inputs, `${id} ingredients`);
    if (value.outputs !== undefined) bag(value.outputs, `${id} products`, true);
    if (value.cycleMs !== undefined) number(value.cycleMs, `${id} cycle time`, [100, 3600000], true);
    if (value.unlockResearch !== undefined) reference(value.unlockResearch, researchIds, `${id} unlock`, true);
    if (value.recovery !== undefined && typeof value.recovery !== 'boolean') fail(id, 'recovery must be on or off.');
    if (value.chanceOutputs !== undefined) {
      if (!Array.isArray(value.chanceOutputs) || value.chanceOutputs.length > 16) fail(id, 'use at most 16 chance products.');
      for (const rawChance of value.chanceOutputs as unknown[]) { const chance = object(rawChance, id); keys(chance, ['item', 'amount', 'probability'], id); reference(chance.item, BASE_MOD_CONTENT.names, id); number(chance.amount, id, [1, 1000000], true); number(chance.probability, id, [0, 1]); }
    }
  }
  const projects = BASE_MOD_CONTENT.research.map(p => ({ ...p }));
  for (const [id, raw] of Object.entries(object(mod.research, 'Research'))) {
    reference(id, researchIds, 'Research'); const value = object(raw, id); keys(value, ['name', 'description', 'unlock', 'costs', 'prerequisite', 'prerequisites', 'costGrowth', 'repeatable'], id);
    for (const key of ['name', 'description', 'unlock']) if (value[key] !== undefined) string(value[key], `${id} ${key}`, key === 'name' ? 80 : 2000, key !== 'name');
    if (value.costs !== undefined) bag(value.costs, `${id} costs`);
    if (value.prerequisite !== undefined) reference(value.prerequisite, researchIds, id, true);
    if (value.prerequisites !== undefined) references(value.prerequisites, researchIds, id);
    if (value.costGrowth !== undefined) number(value.costGrowth, id, [1, 10]);
    if (value.repeatable !== undefined && typeof value.repeatable !== 'boolean') fail(id, 'repeatable must be on or off.');
    Object.assign(projects.find(p => p.id === id)!, value);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const byId = new Map(projects.map(p => [p.id, p]));
  const visit = (id: string) => {
    if (visiting.has(id)) fail('Research', `dependency cycle at ${id}.`);
    if (visited.has(id)) return;
    visiting.add(id); const p = byId.get(id);
    for (const dependency of [p?.prerequisite, ...(p?.prerequisites ?? [])]) if (dependency) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  projects.forEach(p => visit(p.id));
  const rules = object(mod.rules, 'Game settings'); keys(rules, Object.keys(RULE_LIMITS), 'Game settings');
  for (const [key, value] of Object.entries(rules)) number(value, key, RULE_LIMITS[key as keyof ModRules]);
  return structuredClone(input) as GameMod;
}
