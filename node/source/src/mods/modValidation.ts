import type { NodeKind } from '../domain/types';
import { FINAL_CORE_PRODUCTION } from '../content/endgame';
import { DEFAULT_WORLD_GRID_SIZE, isWorldGridSize, MAX_WORLD_GRID_SIZE } from '../domain/worldGrid';
import { CONNECTION_RULE_KEYS, isCustomContentId, MAP_RULE_KEYS, MOD_NODE_TEMPLATES, supportsWorldSpawn, WORLD_SPAWN_MAX_COUNT, WORLD_SPAWN_MAX_TIER, WORLD_SPAWN_REGIONS, type GameMod, type ModNode, type ModRules } from './modTypes';
import { BASE_MOD_CONTENT } from './modContent';

export const SOCKET_FAMILIES = ['FLUID', 'WASTE', 'ANY', 'RESOURCE', 'METAL', 'PLATE', 'GEAR', 'CORE', 'ROBOT_FRAME', 'ROBOT_WEAPON', 'ATTACK_POWER', 'POWER'];
export const RULE_LIMITS: Record<keyof ModRules, [number, number]> = {
  cableTravelMs: [100, 60000], cableLaunchMs: [50, 60000], roadTransferMs: [100, 600000],
  constructionMultiplier: [0, 100], forestRegenMs: [100, 3600000],
  mapResourceMultiplier: [0.1, 100], mapWidthMultiplier: [1, 4], mapHeightMultiplier: [1, 4],
  worldGridSize: [DEFAULT_WORLD_GRID_SIZE, MAX_WORLD_GRID_SIZE],
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
function bag(value: unknown, items: object, path: string, requireOutput = false) {
  const entries = object(value, path);
  for (const [id, count] of Object.entries(entries)) { reference(id, items, path); number(count, `${path}.${id}`, [1, 1000000], true); }
  if (requireOutput && !Object.keys(entries).length) fail(path, 'add at least one product.');
}

function catalogEntries(value: unknown, base: object, path: string) {
  const entries = Object.entries(object(value, path));
  for (const [id] of entries) if (!isCustomContentId(id)) reference(id, base, path);
  return entries;
}

function validateRules(value: unknown, allowed: readonly (keyof ModRules)[], path: string) {
  const rules = object(value, path);
  keys(rules, [...allowed], path);
  for (const [key, setting] of Object.entries(rules)) {
    if (key === 'worldGridSize' && !isWorldGridSize(setting)) fail(`${path}.World map size`, 'choose an odd size from 11×11 to 21×21.');
    number(setting, `${path}.${key}`, RULE_LIMITS[key as keyof ModRules]);
  }
}

function validateWorldSpawn(value: unknown, custom: boolean, path: string) {
  const rule = object(value, path);
  keys(rule, ['mode', 'minTier', 'maxTier', 'chance', 'count', 'region'], path);
  if (rule.mode !== undefined && rule.mode !== 'add' && (custom || rule.mode !== 'replace')) {
    fail(`${path}.mode`, custom ? 'custom entries use add.' : 'choose add or replace.');
  }
  const minTier = rule.minTier ?? 1;
  const maxTier = rule.maxTier ?? WORLD_SPAWN_MAX_TIER;
  for (const key of ['minTier', 'maxTier']) if (rule[key] !== undefined) number(rule[key], `${path}.${key}`, [1, WORLD_SPAWN_MAX_TIER], true);
  if ((minTier as number) > (maxTier as number)) fail(path, 'minimum map tier must be at most the maximum map tier.');
  if (rule.chance !== undefined) number(rule.chance, `${path}.chance`, [0, 1]);
  if (rule.count !== undefined) number(rule.count, `${path}.count`, [1, WORLD_SPAWN_MAX_COUNT], true);
  if (rule.region !== undefined) reference(rule.region, WORLD_SPAWN_REGIONS, `${path}.region`);
}

/** Reject unknown keys, non-finite values, bad references, and research dependency cycles before mutation. */
export function validateMod(input: unknown): GameMod {
  let mod = object(input, 'Mod');
  keys(mod, ['version', 'name', 'author', 'description', 'resources', 'nodes', 'recipes', 'research', 'rules', 'profiles'], 'Mod');
  if (mod.version !== 1) fail('Mod version', 'this game supports version 1 mod packs.');
  string(mod.name, 'Mod name', 80, false); string(mod.author, 'Author', 80); string(mod.description, 'Description', 2000);
  const rawNodes = object(mod.nodes, 'Nodes');
  if (Object.hasOwn(rawNodes, 'slagHopper') || Object.hasOwn(rawNodes, 'wasteLink')) {
    const { slagHopper, wasteLink, ...nodes } = rawNodes;
    if (!Object.hasOwn(nodes, 'wasteHopper')) nodes.wasteHopper = Object.hasOwn(rawNodes, 'slagHopper') ? slagHopper : wasteLink;
    mod = { ...mod, nodes };
  }
  const baseResearch = Object.fromEntries(BASE_MOD_CONTENT.research.map(p => [p.id, p]));
  const resources = catalogEntries(mod.resources, BASE_MOD_CONTENT.names, 'Resources');
  const nodes = catalogEntries(mod.nodes, BASE_MOD_CONTENT.nodes, 'Nodes');
  const recipes = catalogEntries(mod.recipes, BASE_MOD_CONTENT.recipes, 'Recipes');
  const research = catalogEntries(mod.research, baseResearch, 'Research');
  const itemIds = { ...BASE_MOD_CONTENT.names, ...Object.fromEntries(resources) };
  const recipeIds = { ...BASE_MOD_CONTENT.recipes, ...Object.fromEntries(recipes) };
  const researchIds = { ...baseResearch, ...Object.fromEntries(research), [FINAL_CORE_PRODUCTION]: true };
  const families = new Set([...SOCKET_FAMILIES, ...Object.keys(itemIds)]);
  for (const [id, raw] of resources) {
    const value = object(raw, id); keys(value, ['name', 'color'], id);
    if (isCustomContentId(id) || value.name !== undefined) string(value.name, `${id} name`, 80, false);
    if (isCustomContentId(id) || value.color !== undefined) color(value.color, `${id} color`);
  }
  for (const [id, raw] of nodes) {
    const custom = isCustomContentId(id);
    const value = object(raw, id);
    keys(value, ['name', 'description', 'icon', 'accentCss', 'input', 'output', 'unlockResearch', 'recipeIds', 'multiInput', 'multiOutput', 'customSockets', 'worldObstacle', 'worldSpawn', ...Object.keys(nodeNumbers), ...(custom ? ['template', 'worldChance', 'resourceItem'] : [])], id);
    const template = (custom ? value.template : id) as NodeKind;
    if (custom && !Object.values(MOD_NODE_TEMPLATES).some(group => (group as readonly NodeKind[]).includes(template))) fail(id, 'choose a supported node template.');
    const world = custom && (MOD_NODE_TEMPLATES.obstructions as readonly NodeKind[]).includes(template);
    if (value.worldSpawn !== undefined) {
      if (!supportsWorldSpawn(template)) fail(id, 'this entry does not support map spawn rules.');
      validateWorldSpawn(value.worldSpawn, custom, `${id} spawn rule`);
    }
    if (value.worldChance !== undefined) {
      if (!world) fail(id, 'map frequency applies to natural reserves.');
      number(value.worldChance, `${id} map frequency`, [0, 1]);
    }
    if (value.resourceItem !== undefined) {
      if (!world) fail(id, 'the reserve material applies to natural reserves.');
      reference(value.resourceItem, itemIds, `${id} reserve material`);
    }
    for (const key of ['name', 'description', 'icon']) if ((custom && key === 'name') || value[key] !== undefined) string(value[key], `${id} ${key}`, key === 'description' ? 2000 : key === 'icon' ? 8 : 80, key === 'description');
    if (value.accentCss !== undefined) color(value.accentCss, id);
    if (value.unlockResearch !== undefined) reference(value.unlockResearch, researchIds, `${id} unlock`, true);
    for (const key of ['input', 'output']) if (value[key] !== undefined) {
      const list = value[key]; if (!Array.isArray(list) || list.length > 16 || list.some(item => !families.has(item))) fail(`${id} ${key}`, 'choose at most 16 valid connection types.');
    }
    for (const key of ['multiInput', 'multiOutput', 'customSockets', 'worldObstacle']) if (value[key] !== undefined && typeof value[key] !== 'boolean') fail(`${id} ${key}`, 'expected on or off.');
    for (const [key, range] of Object.entries(nodeNumbers)) if (value[key] !== undefined) number(value[key], `${id} ${key}`, range!, !['cycleMultiplier', 'obstructionScale'].includes(key));
    if (value.recipeIds !== undefined) {
      if (BASE_MOD_CONTENT.capabilities[template].behavior !== 'recipe') fail(id, 'recipes can only be assigned to recipe-processing machines.');
      references(value.recipeIds, recipeIds, `${id} recipes`);
    }
  }
  for (const [id, raw] of recipes) {
    const custom = isCustomContentId(id);
    const value = object(raw, id);
    keys(value, ['name', 'inputs', 'outputs', 'cycleMs', 'unlockResearch', 'recovery', 'chanceOutputs'], id);
    if (custom || value.name !== undefined) string(value.name, `${id} name`, 80, false);
    if (custom || value.inputs !== undefined) bag(value.inputs, itemIds, `${id} ingredients`);
    if (custom || value.outputs !== undefined) bag(value.outputs, itemIds, `${id} products`, true);
    if (custom || value.cycleMs !== undefined) number(value.cycleMs, `${id} cycle time`, [100, 3600000], true);
    if (value.unlockResearch !== undefined) reference(value.unlockResearch, researchIds, `${id} unlock`, true);
    if (value.recovery !== undefined && typeof value.recovery !== 'boolean') fail(id, 'recovery must be on or off.');
    if (value.chanceOutputs !== undefined) {
      if (!Array.isArray(value.chanceOutputs) || value.chanceOutputs.length > 16) fail(id, 'use at most 16 chance products.');
      for (const rawChance of value.chanceOutputs as unknown[]) { const chance = object(rawChance, id); keys(chance, ['item', 'amount', 'probability'], id); reference(chance.item, itemIds, id); number(chance.amount, id, [1, 1000000], true); number(chance.probability, id, [0, 1]); }
    }
  }
  const byId = new Map(BASE_MOD_CONTENT.research.map(p => [p.id, { ...p }]));
  for (const [id, raw] of research) {
    const custom = isCustomContentId(id);
    const value = object(raw, id); keys(value, ['name', 'description', 'unlock', 'costs', 'prerequisite', 'prerequisites', 'costGrowth', 'repeatable'], id);
    for (const key of ['name', 'description', 'unlock']) if ((custom && key === 'name') || value[key] !== undefined) string(value[key], `${id} ${key}`, key === 'name' ? 80 : 2000, key !== 'name');
    if (custom || value.costs !== undefined) bag(value.costs, itemIds, `${id} costs`, custom);
    if (value.prerequisite !== undefined) reference(value.prerequisite, researchIds, id, true);
    if (value.prerequisites !== undefined) references(value.prerequisites, researchIds, id);
    if (value.costGrowth !== undefined) number(value.costGrowth, id, [1, 10]);
    if (value.repeatable !== undefined && typeof value.repeatable !== 'boolean') fail(id, 'repeatable must be on or off.');
    byId.set(id, Object.assign(byId.get(id) ?? { id, name: '', category: 'Mod research', description: '', unlock: '', costs: {} }, value));
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) fail('Research', `dependency cycle at ${id}.`);
    if (visited.has(id)) return;
    visiting.add(id); const p = byId.get(id);
    for (const dependency of [p?.prerequisite, ...(p?.prerequisites ?? [])]) if (dependency) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  byId.forEach(p => visit(p.id));
  validateRules(mod.rules, [...MAP_RULE_KEYS, ...CONNECTION_RULE_KEYS], 'Game settings');
  if (mod.profiles !== undefined) {
    const profiles = object(mod.profiles, 'Profiles');
    keys(profiles, ['maps', 'connections'], 'Profiles');
    for (const [category, raw] of Object.entries(profiles)) {
      const group = object(raw, category);
      keys(group, ['selected', 'entries'], category);
      const entries = object(group.entries, `${category} presets`);
      if (group.selected !== undefined) reference(group.selected, entries, `${category} selected preset`);
      for (const [id, rawEntry] of Object.entries(entries)) {
        if (!isCustomContentId(id)) fail(category, 'invalid preset ID.');
        const entry = object(rawEntry, id);
        keys(entry, ['name', 'rules'], id);
        string(entry.name, `${id} name`, 80, false);
        validateRules(entry.rules, category === 'maps' ? MAP_RULE_KEYS : CONNECTION_RULE_KEYS, id);
      }
    }
  }
  return structuredClone(mod) as unknown as GameMod;
}
