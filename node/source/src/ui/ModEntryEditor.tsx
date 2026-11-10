import { useState, type ReactNode } from 'react';
import type { ItemId, NodeKind, PortFamily } from '../domain/types';
import { FINAL_CORE_PRODUCTION } from '../content/endgame';
import { BASE_MOD_CONTENT as BASE } from '../mods/modContent';
import { entriesFor, entryBase, entrySection, type EntryCategory, type ModOption } from '../mods/modCatalog';
import { isCustomContentId, supportsWorldSpawn, WORLD_SPAWN_MAX_COUNT, WORLD_SPAWN_MAX_TIER, WORLD_SPAWN_REGIONS, type GameMod, type ModWorldSpawn } from '../mods/modTypes';
import { SOCKET_FAMILIES } from '../mods/modValidation';

export type UpdateDraft = (edit: (mod: GameMod) => void) => void;

export function Field({ label, hint, reset, children }: { label: string; hint?: string; reset?: () => void; children: ReactNode }) {
  return <div className="mods-field"><div className="mods-field-title"><span>{label}</span>{reset && <button type="button" aria-label={`Reset ${label}`} onClick={reset}>Reset</button>}</div><label aria-label={label}><span className="mods-sr-only">{label}</span>{children}</label>{hint && <small>{hint}</small>}</div>;
}
export function Numeric({ label, hint, value, base, min = 0, max = 1000000, step = 1, resettable = true, onChange }: { label: string; hint?: string; value?: number; base: number; min?: number; max?: number; step?: number | 'any'; resettable?: boolean; onChange(value?: number): void }) {
  return <Field label={label} hint={`${hint ?? ''} ${resettable ? 'Base' : 'Default'}: ${base}.`} reset={resettable && value !== undefined ? () => onChange(undefined) : undefined}><input type="number" min={min} max={max} step={step} value={value ?? ''} placeholder={String(base)} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></Field>;
}
export function Select({ value, options, onChange, emptyLabel }: { value: string; options: ReadonlyArray<readonly string[]>; onChange(value: string): void; emptyLabel?: string }) {
  const retained = value && !options.some(([id]) => id === value);
  return <select value={value} onChange={event => onChange(event.target.value)}>
    {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
    {retained && <option value={value}>{BASE.names[value as ItemId] ?? value}</option>}
    {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
  </select>;
}
function BagEditor({ label, value, options, onChange, reset }: { label: string; options: ModOption[]; value: Partial<Record<ItemId, number>>; onChange(value: Partial<Record<ItemId, number>>): void; reset?: () => void }) {
  const unused = options.filter(([id]) => !Object.hasOwn(value, id));
  return <fieldset className="mods-bag"><legend>{label}</legend>{reset && <button type="button" onClick={reset}>Reset {label.toLowerCase()}</button>}{Object.entries(value).map(([id, count]) => <div className="mods-bag-row" key={id}><Select value={id} options={options.filter(([item]) => item === id || !Object.hasOwn(value, item))} onChange={item => { const next = { ...value }; delete next[id as ItemId]; next[item as ItemId] = count; onChange(next); }} /><input aria-label={`${label}: ${options.find(([item]) => item === id)?.[1] ?? id} amount`} type="number" min={1} max={1000000} step={1} value={count} onChange={e => onChange({ ...value, [id]: Number(e.target.value) })} /><button aria-label={`Remove ${options.find(([item]) => item === id)?.[1] ?? id} from ${label}`} onClick={() => { const next = { ...value }; delete next[id as ItemId]; onChange(next); }}>×</button></div>)}<button disabled={!unused.length} onClick={() => onChange({ ...value, [unused[0]?.[0]]: 1 })}>+ Add item</button></fieldset>;
}
function PortEditor({ label, value, options, onChange, reset }: { label: string; options: ModOption[]; value: PortFamily[]; onChange(value: PortFamily[]): void; reset?: () => void }) {
  return <fieldset className="mods-bag"><legend>{label} · {value.length} sockets</legend>{reset && <button onClick={reset}>Reset {label.toLowerCase()}</button>}{value.map((family, index) => <div className="mods-bag-row mods-port-row" key={index}><span>{index + 1}</span><Select value={family} options={options} onChange={type => onChange(value.map((current, i) => i === index ? type as PortFamily : current))} /><button aria-label={`Remove ${label} socket ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>×</button></div>)}<button disabled={value.length >= 16} onClick={() => onChange([...value, 'ANY'])}>+ Add socket</button></fieldset>;
}

export function EntryEditor({ category, id, draft, update, onRemove }: { category: EntryCategory; id: string; draft: GameMod; update: UpdateDraft; onRemove?: () => void }) {
  const section = entrySection(category);
  const custom = isCustomContentId(id);
  const node = section === 'nodes' ? draft.nodes[id as NodeKind] : undefined;
  const template = node?.template ?? id as NodeKind;
  const capabilities = BASE.capabilities[template];
  const itemOptions = entriesFor('resources', draft);
  const researchOptions = entriesFor('research', draft).filter(([key]) => key !== id);
  researchOptions.push([FINAL_CORE_PRODUCTION, 'First Final Core produced']);
  const families: ModOption[] = [...SOCKET_FAMILIES.filter(family => family !== 'POWER').map((family): ModOption => [family, `${family.replaceAll('_', ' ')} family`]), ...itemOptions];
  const patch = (draft[section] as Record<string, Record<string, unknown>>)[id] ?? {};
  const set = (key: string, value: unknown) => update(mod => {
    const entries = mod[section] as Record<string, Record<string, unknown>>;
    const next = { ...entries[id] };
    if (section === 'nodes' && (key === 'input' || key === 'output') && value !== undefined) next.customSockets = true;
    if (value === undefined) delete next[key];
    else next[key] = value;
    if (Object.keys(next).length) entries[id] = next; else delete entries[id];
  });
  const base = entryBase(category, id, node?.template) as Record<string, unknown>;
  const required = custom ? ['name', ...(category === 'resources' ? ['color'] : category === 'recipes' ? ['inputs', 'outputs', 'cycleMs'] : category === 'research' ? ['costs'] : [])] : [];
  const reset = (key: string) => Object.hasOwn(patch, key) && !required.includes(key) ? () => set(key, undefined) : undefined;
  const text = (key: string, label: string, multiline = false) => <Field key={key} label={label} hint={key === 'name' || (custom && !base[key]) ? undefined : `Base: ${String(base[key] ?? 'None')}`} reset={reset(key)}>{multiline ? <textarea rows={3} maxLength={2000} value={String(patch[key] ?? base[key] ?? '')} onChange={e => set(key, e.target.value)} /> : <input maxLength={key === 'icon' ? 8 : 80} value={String(patch[key] ?? base[key] ?? '')} onChange={e => set(key, e.target.value)} />}</Field>;
  const numeric = (key: string, label: string, defaultValue: number, hint?: string, min = 0, max = 1000000, step: number | 'any' = 1) => <Numeric key={key} label={label} hint={hint} base={defaultValue} value={patch[key] as number | undefined} min={min} max={max} step={step} resettable={!required.includes(key)} onChange={v => set(key, v ?? (required.includes(key) ? defaultValue : undefined))} />;
  const bool = (key: string, label: string, defaultValue: boolean) => <Field key={key} label={label}><Select value={patch[key] === undefined ? '' : String(patch[key])} emptyLabel={`Base (${defaultValue ? 'on' : 'off'})`} options={[[ 'true', 'On' ], [ 'false', 'Off' ]]} onChange={v => set(key, v === '' ? undefined : v === 'true')} /></Field>;
  const unlock = <Field label="Unlock research" hint="None removes this entry’s catalog requirement. Special progression conditions still apply." reset={patch.unlockResearch !== undefined ? () => set('unlockResearch', undefined) : undefined}><Select value={String(patch.unlockResearch ?? base.unlockResearch ?? '')} options={researchOptions} emptyLabel="None" onChange={v => set('unlockResearch', v)} /></Field>;
  const restore = () => update(mod => { delete (mod[section] as Record<string, unknown>)[id]; });
  const importBase = () => update(mod => {
    const copy: Record<string, unknown> = {};
    const allowed = section === 'resources' ? ['name', 'color'] : section === 'recipes' ? ['name', 'inputs', 'outputs', 'cycleMs', 'unlockResearch', 'chanceOutputs', 'recovery'] : section === 'research' ? ['name', 'description', 'unlock', 'costs', 'prerequisite', 'prerequisites', 'costGrowth', 'repeatable'] : ['name', 'description', 'icon', 'accentCss', 'input', 'output', 'unlockResearch'];
    allowed.forEach(key => { if (base[key] !== undefined) copy[key] = structuredClone(base[key]); });
    (mod[section] as Record<string, unknown>)[id] = copy;
  });
  return <>
    <div className="mods-actions">
      {custom ? <button onClick={onRemove}>Remove custom entry</button> : <>
        <button onClick={importBase}>Import base settings</button>
        <button disabled={!Object.keys(patch).length} onClick={restore}>Remove this entry’s changes</button>
      </>}
    </div>
    <p className="mods-help">{custom ? 'Custom entry. It becomes available when you apply the draft.' : 'Import base settings copies the catalog values into your draft. Reset a field to inherit the installed base value.'}</p>
    {text('name', 'Name')}
    {category === 'resources' ? <Field label="Resource color" reset={reset('color')}><input type="color" value={String(patch.color ?? base.color)} onChange={e => set('color', e.target.value)} /></Field> : category === 'recipes' ? <>
      {numeric('cycleMs', 'Recipe cycle time (ms)', base.cycleMs as number, 'Machine cycle multipliers and efficiency research also apply.', 100, 3600000)}{unlock}{bool('recovery', 'Applies recovery efficiency research', Boolean(base.recovery))}
      <BagEditor options={itemOptions} label="Ingredients" value={(patch.inputs ?? base.inputs) as Partial<Record<ItemId, number>>} onChange={v => set('inputs', v)} reset={reset('inputs')} />
      <BagEditor options={itemOptions} label="Products" value={(patch.outputs ?? base.outputs) as Partial<Record<ItemId, number>>} onChange={v => set('outputs', v)} reset={reset('outputs')} />
      <ChanceEditor options={itemOptions} value={(patch.chanceOutputs ?? base.chanceOutputs ?? []) as Array<{ item: ItemId; amount: number; probability: number }>} onChange={v => set('chanceOutputs', v)} reset={patch.chanceOutputs !== undefined ? () => set('chanceOutputs', undefined) : undefined} />
      <p className="mods-help">Assign this recipe to machines in a Production node’s “Available recipes” editor. Ingredients and products determine recipe sockets unless the node declares explicit sockets.</p>
    </> : category === 'research' ? <>
      {text('description', 'Description', true)}{text('unlock', 'Unlock description', true)}
      {base.trigger !== undefined && <p className="mods-help">This is an automatic milestone. Its original gameplay trigger remains in place; editing costs does not turn it into a paid project.</p>}
      <BagEditor options={itemOptions} label="Research costs" value={(patch.costs ?? base.costs) as Partial<Record<ItemId, number>>} onChange={v => set('costs', v)} reset={reset('costs')} />
      <Field label="Primary prerequisite" reset={patch.prerequisite !== undefined ? () => set('prerequisite', undefined) : undefined}><Select value={String(patch.prerequisite ?? base.prerequisite ?? '')} options={researchOptions} emptyLabel="None" onChange={v => set('prerequisite', v)} /></Field>
      <ListEditor label="Additional prerequisites" value={(patch.prerequisites ?? base.prerequisites ?? []) as string[]} options={researchOptions} onChange={v => set('prerequisites', v)} reset={patch.prerequisites !== undefined ? () => set('prerequisites', undefined) : undefined} />
      {bool('repeatable', 'Repeatable project', Boolean(base.repeatable))}{numeric('costGrowth', 'Repeatable cost multiplier', (base.costGrowth as number) ?? 1, '1 = fixed price; 2 = double after each completion. Existing research effects and caps still apply.', 1, 10, 'any')}
    </> : <>
      {text('description', 'Description', true)}{text('icon', 'Icon')}
      <Field label="Node color" reset={patch.accentCss !== undefined ? () => set('accentCss', undefined) : undefined}><input type="color" value={String(patch.accentCss ?? base.accentCss)} onChange={e => set('accentCss', e.target.value)} /></Field>
      {category === 'obstructions' && supportsWorldSpawn(template) && <WorldSpawnEditor
        custom={custom} kind={template} rule={node?.worldSpawn} onChange={rule => set('worldSpawn', rule)} />}
      {unlock}
      {category !== 'obstructions' && numeric('constructionMs', 'Construction time (ms)', 1500, 'Applies to new builds and overrides the global construction multiplier.', 0, 3600000)}
      {numeric('cycleMultiplier', 'Processing time multiplier', 1, '0.5 = twice as fast; 2 = half as fast. Applies to timed processing, not passive routing.', 0.01, 100, 'any')}
      {numeric('capacity', 'Output / vehicle capacity', capabilities.defaultCapacity ?? 5, 'Existing stock is retained when lowering capacity; output waits for room.', 1)}
      {numeric('inputCapacity', 'Input buffer capacity', capabilities.inputCapacity ?? 5, 'Overrides this node’s input limit. Existing stock is retained.', 1)}
      {bool('customSockets', 'Use explicit sockets instead of dynamic recipe / resource sockets', false)}
      <PortEditor options={families} label="Input connections" value={(patch.input ?? base.input) as PortFamily[]} onChange={v => set('input', v)} reset={patch.input !== undefined ? () => set('input', undefined) : undefined} />
      <PortEditor options={families} label="Output connections" value={(patch.output ?? base.output) as PortFamily[]} onChange={v => set('output', v)} reset={patch.output !== undefined ? () => set('output', undefined) : undefined} />
      <p className="mods-help">Explicit sockets override recipe-derived sockets. Recipes still require their declared ingredients. Built-in behaviors retain their routing roles: for example, Filters separate selected and remaining items.</p>
      {bool('multiInput', 'Allow multiple cables per input socket', Boolean(capabilities.multiInput))}
      {bool('multiOutput', 'Allow multiple cables per output socket', Boolean(capabilities.multiOutput))}
      {numeric('maxInputConnections', 'Maximum incoming cables per node', 1000, 'Blank keeps the base rules. 0 disallows incoming cables. Other built-in placement and routing rules still apply.', 0, 1000)}
      {numeric('maxOutputConnections', 'Maximum outgoing cables per node', 1000, 'Blank keeps the base rules. 0 disallows outgoing cables.', 0, 1000)}
      {capabilities.behavior === 'recipe' && <ListEditor label="Available recipes" value={(patch.recipeIds ?? BASE.groups[template] ?? []) as string[]} options={entriesFor('recipes', draft)} onChange={v => set('recipeIds', v)} reset={patch.recipeIds !== undefined ? () => set('recipeIds', undefined) : undefined} />}
      {category === 'obstructions' && <>
        {custom && <>
          <Field label="Reserve material" reset={reset('resourceItem')}>
            <Select value={String(patch.resourceItem ?? '')} options={itemOptions} emptyLabel="Use template material" onChange={value => set('resourceItem', value || undefined)} />
          </Field>
          {node?.worldSpawn === undefined && numeric('worldChance', 'Template replacement chance (0–1)', 0.25, 'Without a spawn rule, this reserve can replace its template when the template would appear.', 0, 1, 'any')}
        </>}
        {bool('worldObstacle', 'Blocks cables as a world obstruction', Boolean(capabilities.worldObstacle))}
        {numeric('obstructionScale', 'Footprint size multiplier', 1, 'Changes the rendered and collision footprint. Existing nodes do not move.', 0.25, 2, 'any')}
        {capabilities.behavior === 'resource' && numeric('resourceCapacity', 'New natural reserve capacity', 1000, 'Applies to newly generated natural resource nodes of this kind. Existing reserves remain unchanged.', 1, 100000000)}
      </>}
    </>}
  </>;
}

function WorldSpawnEditor({ custom, kind, rule, onChange }: { custom: boolean; kind: NodeKind; rule?: ModWorldSpawn; onChange(rule?: ModWorldSpawn): void }) {
  if (!rule) return <fieldset className="mods-bag">
    <legend>Spawning & placement</legend>
    <button type="button" onClick={() => onChange({ mode: 'add', minTier: 1, maxTier: WORLD_SPAWN_MAX_TIER, chance: 1, count: 1, region: 'anywhere' })}>+ Add spawn rule</button>
  </fieldset>;
  const set = <K extends keyof ModWorldSpawn>(key: K, value: ModWorldSpawn[K]) => {
    const next = { ...rule };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };
  return <fieldset className="mods-bag">
    <legend>Spawning & placement</legend>
    <p className="mods-help">Applies when a map is first generated. Tiers above 9 need a larger world. Home and the four corner maps keep their layouts.</p>
    {!custom && <Field label="Spawn behavior" hint={kind === 'monster-camp' ? 'Controls Goblin camps. Dwarven settlements keep their usual spawns.' : 'Replace removes the usual spawns on all new maps and uses this rule instead.'}>
      <Select value={rule.mode ?? 'add'} options={[[ 'add', 'Add to normal spawns' ], [ 'replace', 'Replace normal spawns' ]]} onChange={value => set('mode', value as ModWorldSpawn['mode'])} />
    </Field>}
    <Numeric label="Minimum map tier" value={rule.minTier} base={1} min={1} max={WORLD_SPAWN_MAX_TIER} resettable={false} onChange={value => set('minTier', value)} />
    <Numeric label="Maximum map tier" value={rule.maxTier} base={WORLD_SPAWN_MAX_TIER} min={1} max={WORLD_SPAWN_MAX_TIER} resettable={false} onChange={value => set('maxTier', value)} />
    <Numeric label="Spawn chance (%)" hint="Rolled once per eligible map." value={rule.chance === undefined ? undefined : Number((rule.chance * 100).toPrecision(15))} base={100} min={0} max={100} step="any" resettable={false} onChange={value => set('chance', value === undefined ? undefined : value / 100)} />
    <Numeric label="Count per successful map" value={rule.count} base={1} min={1} max={WORLD_SPAWN_MAX_COUNT} resettable={false} onChange={value => set('count', value)} />
    <Field label="Playfield region" hint="The obstruction’s center must be in this region. If a clear spot can’t be found, the spawn is skipped.">
      <Select value={rule.region ?? 'anywhere'} options={Object.entries(WORLD_SPAWN_REGIONS)} onChange={value => set('region', value as ModWorldSpawn['region'])} />
    </Field>
    <button type="button" onClick={() => onChange(undefined)}>Remove spawn rule</button>
  </fieldset>;
}

function ListEditor({ label, value, options, onChange, reset }: { label: string; value: string[]; options: ReadonlyArray<readonly string[]>; onChange(value: string[]): void; reset?: () => void }) {
  const [choice, setChoice] = useState('');
  return <fieldset className="mods-bag"><legend>{label}</legend>{reset && <button onClick={reset}>Reset {label.toLowerCase()}</button>}{value.map(id => <div className="mods-list-row" key={id}><span>{options.find(([key]) => key === id)?.[1] ?? id}</span><button aria-label={`Remove ${id} from ${label}`} onClick={() => onChange(value.filter(key => key !== id))}>×</button></div>)}<div className="mods-actions"><Select value={choice} options={options.filter(([id]) => !value.includes(id))} emptyLabel="Choose an entry…" onChange={setChoice} /><button disabled={!choice || value.includes(choice)} onClick={() => { onChange([...value, choice]); setChoice(''); }}>+ Add</button></div></fieldset>;
}
function ChanceEditor({ value, options, onChange, reset }: { options: ModOption[]; value: Array<{ item: ItemId; amount: number; probability: number }>; onChange(value: Array<{ item: ItemId; amount: number; probability: number }>): void; reset?: () => void }) {
  return <fieldset className="mods-bag"><legend>Chance products</legend>{reset && <button onClick={reset}>Reset chance products</button>}{value.map((chance, index) => <div className="mods-chance-row" key={index}><Select value={chance.item} options={options} onChange={v => onChange(value.map((c, i) => i === index ? { ...c, item: v as ItemId } : c))} /><label>Amount<input type="number" min={1} max={1000000} value={chance.amount} onChange={e => onChange(value.map((c, i) => i === index ? { ...c, amount: Number(e.target.value) } : c))} /></label><label>Chance (0–1)<input type="number" min={0} max={1} step={0.01} value={chance.probability} onChange={e => onChange(value.map((c, i) => i === index ? { ...c, probability: Number(e.target.value) } : c))} /></label><button aria-label={`Remove chance product ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>×</button></div>)}<button disabled={value.length >= 16} onClick={() => onChange([...value, { item: 'stone', amount: 1, probability: 0.5 }])}>+ Add chance product</button></fieldset>;
}
