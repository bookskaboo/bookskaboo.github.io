import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GameState, ItemId, NodeKind, PortFamily } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { BASE_MOD_CONTENT as BASE } from '../mods/modContent';
import { BASE_MOD_RULES } from '../mods/modRules';
import { emptyMod, type GameMod, type ModRules } from '../mods/modTypes';
import { validateMod, RULE_LIMITS } from '../mods/modValidation';
import { exportMod, importMod, MAX_MOD_CODE_LENGTH } from '../mods/modSharing';
import { PanelHeader } from './PanelHeader';

const DRAFT_KEY = 'nodefactory.mod-draft.v1';
type Category = 'resources' | 'production' | 'logistics' | 'obstructions' | 'research' | 'maps' | 'recipes' | 'connections';
const CATEGORIES: Array<{ id: Category; title: string; icon: string; detail: string }> = [
  { id: 'resources', title: 'Resources', icon: '◆', detail: 'Names and colors for raw materials and manufactured items.' },
  { id: 'production', title: 'Production nodes', icon: '⚒', detail: 'Machines, Extractors and Lake Intakes. Build times, recipes and sockets.' },
  { id: 'logistics', title: 'Logistics & storage', icon: '⇥', detail: 'Routes, Carts, Trucks and Trains. Capacity and connection limits.' },
  { id: 'obstructions', title: 'Obstructions & world nodes', icon: '◈', detail: 'Lakes, settlements, Deep Holes and natural resource nodes.' },
  { id: 'research', title: 'Research', icon: '⌁', detail: 'Project names, costs, prerequisites and repeatable prices.' },
  { id: 'maps', title: 'Map nodes', icon: '◎', detail: 'Field dimensions, new resource reserves and Forest regeneration.' },
  { id: 'recipes', title: 'Recipes', icon: '≡', detail: 'Ingredients, products, cycle times and chance products.' },
  { id: 'connections', title: 'Connections & construction', icon: '⌘', detail: 'Cable travel, dispatch intervals, Roads and global build times.' },
];
const RESEARCH_OPTIONS = BASE.research.map(p => [p.id, p.name] as const);
const ITEM_OPTIONS = Object.entries(BASE.names).sort((a, b) => a[1].localeCompare(b[1]));
const FAMILY_OPTIONS = [...['ANY', 'RESOURCE', 'METAL', 'PLATE', 'GEAR', 'CORE', 'ROBOT_FRAME', 'ROBOT_WEAPON', 'ATTACK_POWER', 'FLUID', 'WASTE', 'POWER'].map(id => [id, `${id.replaceAll('_', ' ')} family`]), ...ITEM_OPTIONS];
const RULE_LABELS: Record<keyof ModRules, [string, string]> = {
  cableTravelMs: ['Cable travel time (ms)', 'Time in flight for new shipments. Existing shipments finish on their original schedule.'],
  cableLaunchMs: ['Cable dispatch interval (ms)', 'How often cables attempt to launch. Simulation checks run every 100 ms.'],
  roadTransferMs: ['Road dispatch interval (ms)', 'Time between Road shipments; vehicle payload upgrades still apply.'],
  constructionMultiplier: ['Global construction time multiplier', '0 = instant; 0.5 = half the build time; 2 = twice the time. Applies to new builds.'],
  forestRegenMs: ['Forest regeneration interval (ms)', 'Base time to restore one unit naturally. Regeneration research still applies.'],
  mapResourceMultiplier: ['New map resource reserve multiplier', 'Applies when a map is first generated. Existing reserves and stock stay intact.'],
  mapWidthMultiplier: ['Map width multiplier', 'Expands usable fields, including current maps. Existing node positions stay in place.'],
  mapHeightMultiplier: ['Map height multiplier', 'Expands usable fields, including current maps. Existing node positions stay in place.'],
};

function readDraft(game: GameState): GameMod {
  try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) return validateMod(JSON.parse(saved)); } catch { /* An invalid draft must not prevent opening the editor. */ }
  return game.mod ? structuredClone(game.mod) : emptyMod();
}
const changeCount = (mod: GameMod) => Object.values(mod.resources).length + Object.values(mod.nodes).length + Object.values(mod.recipes).length + Object.values(mod.research).length + Object.keys(mod.rules).length;
const errorText = (error: unknown) => error instanceof Error ? error.message : 'The settings could not be loaded.';

export function ModsModal({ game, engine, onClose }: { game: GameState; engine: GameEngine; onClose(): void }) {
  const [draft, setDraft] = useState(() => readDraft(game));
  const [view, setView] = useState<Category | 'home' | 'share' | 'review'>('home');
  const [selected, setSelected] = useState<string>();
  const [search, setSearch] = useState('');
  const [paste, setPaste] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const shareOutput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setStorageError(false); } catch { setStorageError(true); } }, [draft]);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; dialog.current?.focus(); return () => previous?.focus(); }, []);
  useEffect(() => { dialog.current?.focus(); dialog.current?.querySelector('.mods-body')?.scrollTo(0, 0); }, [view, selected]);
  const update = (edit: (mod: GameMod) => void) => { setDraft(current => { const next = structuredClone(current); edit(next); return next; }); setError(''); setMessage(''); setCode(''); };
  const navigate = (next: typeof view) => { setSelected(undefined); setSearch(''); setView(next); setError(''); setMessage(''); };
  const back = () => { if (selected) { setSelected(undefined); setError(''); } else if (view !== 'home') navigate('home'); else onClose(); };
  const attempt = (action: () => void) => { try { action(); setError(''); } catch (caught) { setError(errorText(caught)); setMessage(''); } dialog.current?.querySelector('.mods-body')?.scrollTo(0, 0); };
  const apply = () => attempt(() => { engine.applyMod(draft); setMessage(`“${draft.name}” is active in this factory and will be included in its saves.`); });
  const title = selected ? labelFor(view, selected) : view === 'home' ? 'Mods' : view === 'share' ? 'Import & share' : view === 'review' ? 'Review changes' : CATEGORIES.find(c => c.id === view)!.title;
  return <div className="modal-backdrop mods-backdrop"><section ref={dialog} tabIndex={-1} className="modal glass mods-modal" role="dialog" aria-modal="true" aria-labelledby="mods-title" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); back(); }
    if (event.key === 'Tab') {
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <div id="mods-title"><PanelHeader eyebrow="FACTORY RULES · MOD EDITOR" title={title} onClose={onClose} /></div>
    <div className="mods-navigation"><button onClick={back}>{view === 'home' ? 'Close' : '← Back'}</button><span>{game.mod ? `Active: ${game.mod.name}` : 'Active: Base game'}</span><button onClick={() => navigate('review')}>{changeCount(draft)} edited entries</button></div>
    <div className="mods-body" key={`${view}:${selected ?? ''}`}>
      {error && <p className="mods-error" role="alert">{error}</p>}{message && <p className="mods-success" role="status">{message}</p>}
      {storageError && <p className="mods-error" role="alert">Browser storage is full or unavailable. Export a share code before closing to keep this draft.</p>}
      {view === 'home' && <>
        <p className="mods-intro">Rewrite the factory handbook. The factory was not consulted.</p>
        <p className="mods-help">Edit a draft, review it, then apply it to this factory. One mod package is active at a time. Drafts are kept in this browser; applied mods travel with saves.</p>
        <div className="mods-metadata"><Field label="Mod name"><input maxLength={80} value={draft.name} onChange={e => update(m => { m.name = e.target.value; })} /></Field><Field label="Author"><input maxLength={80} value={draft.author} onChange={e => update(m => { m.author = e.target.value; })} /></Field><Field label="Description"><textarea maxLength={2000} rows={2} value={draft.description} onChange={e => update(m => { m.description = e.target.value; })} /></Field></div>
        <div className="mods-actions"><button onClick={() => navigate('share')}>Import / export share code</button><button onClick={() => { setDraft(emptyMod()); setCode(''); setMessage('Started a new draft using base-game settings. The active factory is unchanged.'); }}>New from base game</button><button disabled={!game.mod} onClick={() => { setDraft(structuredClone(game.mod!)); setCode(''); setMessage('Loaded the active package into the editor.'); }}>Load active mod</button></div>
        <div className="mods-category-grid">{CATEGORIES.map(c => <button key={c.id} onClick={() => navigate(c.id)}><i>{c.icon}</i><span><b>{c.title}</b><small>{c.detail}</small></span><em>→</em></button>)}</div>
        <button disabled={!game.mod} onClick={() => attempt(() => { engine.applyMod(); setMessage('Base-game rules restored. Your draft is still here. Existing reserves, completed research and constructed nodes are retained.'); })}>Use base-game rules in this factory</button>
      </>}
      {view === 'share' && <>
        <h3>Import another player’s mod</h3><p className="mods-help">Paste a complete NODEMOD1 code. Import replaces the editor draft; apply it when you are ready.</p>
        <Field label="Paste mod share code"><textarea rows={5} maxLength={MAX_MOD_CODE_LENGTH} spellCheck={false} value={paste} onChange={e => setPaste(e.target.value)} placeholder="NODEMOD1.…" /></Field>
        <button disabled={!paste.trim()} onClick={() => attempt(() => { const imported = importMod(paste); setDraft(imported); setCode(''); setMessage(`Imported “${imported.name}”${imported.author ? ` by ${imported.author}` : ''}: ${changeCount(imported)} edited entries. Review or apply it below.`); })}>Import into editor</button>
        <h3>Share this draft</h3><p className="mods-help">The code includes names, settings and all declared changes. Share codes contain data; they cannot run scripts.</p>
        <div className="mods-actions"><button onClick={() => attempt(() => { setCode(exportMod(draft)); setMessage('Share code generated. Copy it below.'); })}>Generate share code</button><button disabled={!code} onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('Share code copied.'); } catch { shareOutput.current?.focus(); shareOutput.current?.select(); setMessage('Code selected. Press Ctrl+C or use your browser’s Copy command.'); } }}>Copy share code</button><button onClick={() => navigate('review')}>Review changes</button></div>
        {code && <Field label={`Exported share code · ${code.length.toLocaleString()} characters`}><textarea ref={shareOutput} rows={6} readOnly spellCheck={false} value={code} onFocus={e => e.target.select()} /></Field>}
      </>}
      {view === 'review' && <><h3>{draft.name || 'Untitled mod'}</h3><p className="mods-help">Only declared overrides are exported. Unedited settings inherit the installed base game. Removing a mod restores rules; it does not rewind stock, research, construction or map generation.</p><Review mod={draft} /><div className="mods-actions"><button onClick={() => navigate('share')}>Export this draft</button></div></>}
      {(view === 'maps' || view === 'connections') && <><p className="mods-help">Values start at the base-game settings. Reset any field to inherit the base value.</p>{(Object.keys(BASE_MOD_RULES) as Array<keyof ModRules>).filter(key => view === 'maps' ? ['forestRegenMs', 'mapResourceMultiplier', 'mapWidthMultiplier', 'mapHeightMultiplier'].includes(key) : !['forestRegenMs', 'mapResourceMultiplier', 'mapWidthMultiplier', 'mapHeightMultiplier'].includes(key)).map(key => <Numeric key={key} label={RULE_LABELS[key][0]} hint={RULE_LABELS[key][1]} value={draft.rules[key]} base={BASE_MOD_RULES[key]} min={RULE_LIMITS[key][0]} max={RULE_LIMITS[key][1]} step="any" onChange={value => update(m => { if (value === undefined) delete m.rules[key]; else m.rules[key] = value; })} />)}</>}
      {!['home', 'share', 'review', 'maps', 'connections'].includes(view) && (selected ? <EntryEditor category={view as Category} id={selected} draft={draft} update={update} /> : <>
        <Field label="Search base-game entries"><input type="search" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find an item, node, recipe or project…" /></Field>
        <div className="mods-entry-list">{entriesFor(view).filter(([id, name]) => `${id} ${name}`.toLowerCase().includes(search.toLowerCase())).map(([id, name]) => <button key={id} onClick={() => setSelected(id)}><span><b>{name}</b><small>{id}</small></span><em>{isEdited(draft, view, id) ? 'Edited · ' : ''}Edit →</em></button>)}</div>
      </>)}
    </div>
    <footer className="mods-footer"><span>Draft: {draft.name || 'Untitled'}<small>Edits take effect when applied.</small></span><button onClick={() => navigate('review')}>Review</button><button className="mods-primary" onClick={apply}>Apply to factory</button></footer>
  </section></div>;
}

function entriesFor(category: string): Array<[string, string]> {
  if (category === 'resources') return ITEM_OPTIONS;
  if (category === 'recipes') return Object.entries(BASE.recipes).map(([id, r]) => [id, r.name]);
  if (category === 'research') return BASE.research.map(p => [p.id, p.name]);
  return Object.values(BASE.nodes).filter(n => !n.legacyAlias && (category === 'production' ? n.category === 'Production' || n.category === 'Research' || n.category === 'Extraction' : category === 'logistics' ? n.category === 'Logistics' || n.category === 'Storage' : n.category === 'World')).map(n => [n.kind, n.name]);
}
function labelFor(category: string, id: string) { return entriesFor(category).find(([key]) => key === id)?.[1] ?? id; }
function isEdited(mod: GameMod, category: string, id: string) { return Object.hasOwn(category === 'resources' ? mod.resources : category === 'recipes' ? mod.recipes : category === 'research' ? mod.research : mod.nodes, id); }

function Field({ label, hint, reset, children }: { label: string; hint?: string; reset?: () => void; children: ReactNode }) {
  return <div className="mods-field"><div className="mods-field-title"><span>{label}</span>{reset && <button type="button" aria-label={`Reset ${label}`} onClick={reset}>Reset</button>}</div><label aria-label={label}><span className="mods-sr-only">{label}</span>{children}</label>{hint && <small>{hint}</small>}</div>;
}
function Numeric({ label, hint, value, base, min = 0, max = 1000000, step = 1, onChange }: { label: string; hint?: string; value?: number; base: number; min?: number; max?: number; step?: number | 'any'; onChange(value?: number): void }) {
  return <Field label={label} hint={`${hint ?? ''} Base: ${base}.`} reset={value !== undefined ? () => onChange(undefined) : undefined}><input type="number" min={min} max={max} step={step} value={value ?? ''} placeholder={String(base)} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></Field>;
}
function Select({ value, options, onChange, emptyLabel }: { value: string; options: ReadonlyArray<readonly string[]>; onChange(value: string): void; emptyLabel?: string }) {
  return <select value={value} onChange={e => onChange(e.target.value)}>{emptyLabel !== undefined && <option value="">{emptyLabel}</option>}{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>;
}
function BagEditor({ label, value, onChange, reset }: { label: string; value: Partial<Record<ItemId, number>>; onChange(value: Partial<Record<ItemId, number>>): void; reset?: () => void }) {
  const unused = ITEM_OPTIONS.filter(([id]) => !Object.hasOwn(value, id));
  return <fieldset className="mods-bag"><legend>{label}</legend>{reset && <button type="button" onClick={reset}>Reset {label.toLowerCase()}</button>}{Object.entries(value).map(([id, count]) => <div className="mods-bag-row" key={id}><Select value={id} options={ITEM_OPTIONS.filter(([item]) => item === id || !Object.hasOwn(value, item))} onChange={item => { const next = { ...value }; delete next[id as ItemId]; next[item as ItemId] = count; onChange(next); }} /><input aria-label={`${label}: ${BASE.names[id as ItemId]} amount`} type="number" min={1} max={1000000} step={1} value={count} onChange={e => onChange({ ...value, [id]: Number(e.target.value) })} /><button aria-label={`Remove ${BASE.names[id as ItemId]} from ${label}`} onClick={() => { const next = { ...value }; delete next[id as ItemId]; onChange(next); }}>×</button></div>)}<button disabled={!unused.length} onClick={() => onChange({ ...value, [unused[0]?.[0]]: 1 })}>+ Add item</button></fieldset>;
}
function PortEditor({ label, value, onChange, reset }: { label: string; value: PortFamily[]; onChange(value: PortFamily[]): void; reset?: () => void }) {
  return <fieldset className="mods-bag"><legend>{label} · {value.length} sockets</legend>{reset && <button onClick={reset}>Reset {label.toLowerCase()}</button>}{value.map((family, index) => <div className="mods-bag-row mods-port-row" key={index}><span>{index + 1}</span><Select value={family} options={FAMILY_OPTIONS} onChange={type => onChange(value.map((current, i) => i === index ? type as PortFamily : current))} /><button aria-label={`Remove ${label} socket ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>×</button></div>)}<button disabled={value.length >= 16} onClick={() => onChange([...value, 'ANY'])}>+ Add socket</button></fieldset>;
}

function EntryEditor({ category, id, draft, update }: { category: Category; id: string; draft: GameMod; update(edit: (mod: GameMod) => void): void }) {
  const section = category === 'resources' ? 'resources' : category === 'recipes' ? 'recipes' : category === 'research' ? 'research' : 'nodes';
  const patch = (draft[section] as Record<string, Record<string, unknown>>)[id] ?? {};
  const set = (key: string, value: unknown) => update(mod => {
    const entries = mod[section] as Record<string, Record<string, unknown>>;
    const next = { ...entries[id] }; if (section === 'nodes' && ['input', 'output'].includes(key) && value !== undefined) next.customSockets = true; if (value === undefined) delete next[key]; else next[key] = value;
    if (Object.keys(next).length) entries[id] = next; else delete entries[id];
  });
  const base: Record<string, unknown> = category === 'resources' ? { name: BASE.names[id as ItemId], color: `#${BASE.colors[id as ItemId].toString(16).padStart(6, '0')}` } : category === 'recipes' ? BASE.recipes[id] as unknown as Record<string, unknown> : category === 'research' ? BASE.research.find(p => p.id === id)! as unknown as Record<string, unknown> : BASE.nodes[id as NodeKind] as unknown as Record<string, unknown>;
  const text = (key: string, label: string, multiline = false) => <Field key={key} label={label} hint={`Base: ${String(base[key] ?? 'None')}`} reset={Object.hasOwn(patch, key) ? () => set(key, undefined) : undefined}>{multiline ? <textarea rows={3} maxLength={2000} value={String(patch[key] ?? base[key] ?? '')} onChange={e => set(key, e.target.value)} /> : <input maxLength={key === 'icon' ? 8 : 80} value={String(patch[key] ?? base[key] ?? '')} onChange={e => set(key, e.target.value)} />}</Field>;
  const numeric = (key: string, label: string, defaultValue: number, hint?: string, min = 0, max = 1000000, step: number | 'any' = 1) => <Numeric key={key} label={label} hint={hint} base={defaultValue} value={patch[key] as number | undefined} min={min} max={max} step={step} onChange={v => set(key, v)} />;
  const bool = (key: string, label: string, defaultValue: boolean) => <Field key={key} label={label}><Select value={patch[key] === undefined ? '' : String(patch[key])} emptyLabel={`Base (${defaultValue ? 'on' : 'off'})`} options={[[ 'true', 'On' ], [ 'false', 'Off' ]]} onChange={v => set(key, v === '' ? undefined : v === 'true')} /></Field>;
  const unlock = <Field label="Unlock research" hint="None removes this entry’s catalog requirement. Special progression conditions still apply." reset={patch.unlockResearch !== undefined ? () => set('unlockResearch', undefined) : undefined}><Select value={String(patch.unlockResearch ?? base.unlockResearch ?? '')} options={RESEARCH_OPTIONS} emptyLabel="None" onChange={v => set('unlockResearch', v)} /></Field>;
  const restore = () => update(mod => { delete (mod[section] as Record<string, unknown>)[id]; });
  const importBase = () => update(mod => {
    const copy: Record<string, unknown> = {};
    const allowed = section === 'resources' ? ['name', 'color'] : section === 'recipes' ? ['name', 'inputs', 'outputs', 'cycleMs', 'unlockResearch', 'chanceOutputs', 'recovery'] : section === 'research' ? ['name', 'description', 'unlock', 'costs', 'prerequisite', 'prerequisites', 'costGrowth', 'repeatable'] : ['name', 'description', 'icon', 'accentCss', 'input', 'output', 'unlockResearch'];
    allowed.forEach(key => { if (base[key] !== undefined) copy[key] = structuredClone(base[key]); });
    (mod[section] as Record<string, unknown>)[id] = copy;
  });
  return <><div className="mods-actions"><button onClick={importBase}>Import base settings</button><button disabled={!Object.keys(patch).length} onClick={restore}>Remove this entry’s changes</button></div>
    <p className="mods-help">Stable ID: <code>{id}</code>. Edit the fields below; blank numeric fields inherit the base game. Import base settings pins the values shown here into your package.</p>
    {text('name', 'Name')}
    {category === 'resources' ? <Field label="Resource color" reset={patch.color !== undefined ? () => set('color', undefined) : undefined}><input type="color" value={String(patch.color ?? base.color)} onChange={e => set('color', e.target.value)} /></Field> : category === 'recipes' ? <>
      {numeric('cycleMs', 'Recipe cycle time (ms)', base.cycleMs as number, 'Machine cycle multipliers and efficiency research also apply.', 100, 3600000)}{unlock}
      <BagEditor label="Ingredients" value={(patch.inputs ?? base.inputs) as Partial<Record<ItemId, number>>} onChange={v => set('inputs', v)} reset={patch.inputs !== undefined ? () => set('inputs', undefined) : undefined} />
      <BagEditor label="Products" value={(patch.outputs ?? base.outputs) as Partial<Record<ItemId, number>>} onChange={v => set('outputs', v)} reset={patch.outputs !== undefined ? () => set('outputs', undefined) : undefined} />
      <ChanceEditor value={(patch.chanceOutputs ?? base.chanceOutputs ?? []) as Array<{ item: ItemId; amount: number; probability: number }>} onChange={v => set('chanceOutputs', v)} reset={patch.chanceOutputs !== undefined ? () => set('chanceOutputs', undefined) : undefined} />
      <p className="mods-help">Assign this recipe to machines in a Production node’s “Available recipes” editor. Ingredients and products determine recipe sockets unless the node declares explicit sockets.</p>
    </> : category === 'research' ? <>
      {text('description', 'Description', true)}{text('unlock', 'Unlock description', true)}
      {base.trigger !== undefined && <p className="mods-help">This is an automatic milestone. Its original gameplay trigger remains in place; editing costs does not turn it into a paid project.</p>}
      <BagEditor label="Research costs" value={(patch.costs ?? base.costs) as Partial<Record<ItemId, number>>} onChange={v => set('costs', v)} reset={patch.costs !== undefined ? () => set('costs', undefined) : undefined} />
      <Field label="Primary prerequisite" reset={patch.prerequisite !== undefined ? () => set('prerequisite', undefined) : undefined}><Select value={String(patch.prerequisite ?? base.prerequisite ?? '')} options={RESEARCH_OPTIONS.filter(([key]) => key !== id)} emptyLabel="None" onChange={v => set('prerequisite', v)} /></Field>
      <ListEditor label="Additional prerequisites" value={(patch.prerequisites ?? base.prerequisites ?? []) as string[]} options={RESEARCH_OPTIONS.filter(([key]) => key !== id)} onChange={v => set('prerequisites', v)} reset={patch.prerequisites !== undefined ? () => set('prerequisites', undefined) : undefined} />
      {bool('repeatable', 'Repeatable project', Boolean(base.repeatable))}{numeric('costGrowth', 'Repeatable cost multiplier', (base.costGrowth as number) ?? 1, '1 = fixed price; 2 = double after each completion. Existing research effects and caps still apply.', 1, 10, 'any')}
    </> : <>
      {text('description', 'Description', true)}{text('icon', 'Icon')}
      <Field label="Node color" reset={patch.accentCss !== undefined ? () => set('accentCss', undefined) : undefined}><input type="color" value={String(patch.accentCss ?? base.accentCss)} onChange={e => set('accentCss', e.target.value)} /></Field>
      {unlock}
      {numeric('constructionMs', 'Construction time (ms)', 1500, 'Applies to new builds and overrides the global construction multiplier.', 0, 3600000)}
      {numeric('cycleMultiplier', 'Processing time multiplier', 1, '0.5 = twice as fast; 2 = half as fast. Applies to timed processing, not passive routing.', 0.01, 100, 'any')}
      {numeric('capacity', 'Output / vehicle capacity', BASE.capabilities[id as NodeKind].defaultCapacity ?? 5, 'Existing stock is retained when lowering capacity; output waits for room.', 1)}
      {numeric('inputCapacity', 'Input buffer capacity', BASE.capabilities[id as NodeKind].inputCapacity ?? 5, 'Overrides this node’s input limit. Existing stock is retained.', 1)}
      {bool('customSockets', 'Use explicit sockets instead of dynamic recipe / resource sockets', false)}
      <PortEditor label="Input connections" value={(patch.input ?? base.input) as PortFamily[]} onChange={v => set('input', v)} reset={patch.input !== undefined ? () => set('input', undefined) : undefined} />
      <PortEditor label="Output connections" value={(patch.output ?? base.output) as PortFamily[]} onChange={v => set('output', v)} reset={patch.output !== undefined ? () => set('output', undefined) : undefined} />
      <p className="mods-help">Explicit sockets override recipe-derived sockets. Recipes still require their declared ingredients. Built-in behaviors retain their routing roles: for example, Filters separate selected and remaining items.</p>
      {bool('multiInput', 'Allow multiple cables per input socket', Boolean(BASE.capabilities[id as NodeKind].multiInput))}
      {bool('multiOutput', 'Allow multiple cables per output socket', Boolean(BASE.capabilities[id as NodeKind].multiOutput))}
      {numeric('maxInputConnections', 'Maximum incoming cables per node', 1000, 'Blank keeps the base rules. 0 disallows incoming cables. Other built-in placement and routing rules still apply.', 0, 1000)}
      {numeric('maxOutputConnections', 'Maximum outgoing cables per node', 1000, 'Blank keeps the base rules. 0 disallows outgoing cables.', 0, 1000)}
      {BASE.capabilities[id as NodeKind].behavior === 'recipe' && <ListEditor label="Available recipes" value={(patch.recipeIds ?? BASE.groups[id] ?? []) as string[]} options={Object.values(BASE.recipes).map(r => [r.id, r.name])} onChange={v => set('recipeIds', v)} reset={patch.recipeIds !== undefined ? () => set('recipeIds', undefined) : undefined} />}
      {category === 'obstructions' && <>{bool('worldObstacle', 'Blocks cables as a world obstruction', Boolean(BASE.capabilities[id as NodeKind].worldObstacle))}{numeric('obstructionScale', 'Footprint size multiplier', 1, 'Changes the rendered and collision footprint. Existing nodes do not move.', 0.25, 2, 'any')}{numeric('resourceCapacity', 'New natural reserve capacity', 1000, 'Applies to newly generated natural resource nodes of this kind. Existing reserves remain unchanged.', 1, 100000000)}</>}
    </>}
  </>;
}

function ListEditor({ label, value, options, onChange, reset }: { label: string; value: string[]; options: ReadonlyArray<readonly string[]>; onChange(value: string[]): void; reset?: () => void }) {
  const [choice, setChoice] = useState('');
  return <fieldset className="mods-bag"><legend>{label}</legend>{reset && <button onClick={reset}>Reset {label.toLowerCase()}</button>}{value.map(id => <div className="mods-list-row" key={id}><span>{options.find(([key]) => key === id)?.[1] ?? id}</span><button aria-label={`Remove ${id} from ${label}`} onClick={() => onChange(value.filter(key => key !== id))}>×</button></div>)}<div className="mods-actions"><Select value={choice} options={options.filter(([id]) => !value.includes(id))} emptyLabel="Choose an entry…" onChange={setChoice} /><button disabled={!choice || value.includes(choice)} onClick={() => { onChange([...value, choice]); setChoice(''); }}>+ Add</button></div></fieldset>;
}
function ChanceEditor({ value, onChange, reset }: { value: Array<{ item: ItemId; amount: number; probability: number }>; onChange(value: Array<{ item: ItemId; amount: number; probability: number }>): void; reset?: () => void }) {
  return <fieldset className="mods-bag"><legend>Chance products</legend>{reset && <button onClick={reset}>Reset chance products</button>}{value.map((chance, index) => <div className="mods-chance-row" key={index}><Select value={chance.item} options={ITEM_OPTIONS} onChange={v => onChange(value.map((c, i) => i === index ? { ...c, item: v as ItemId } : c))} /><label>Amount<input type="number" min={1} max={1000000} value={chance.amount} onChange={e => onChange(value.map((c, i) => i === index ? { ...c, amount: Number(e.target.value) } : c))} /></label><label>Chance (0–1)<input type="number" min={0} max={1} step={0.01} value={chance.probability} onChange={e => onChange(value.map((c, i) => i === index ? { ...c, probability: Number(e.target.value) } : c))} /></label><button aria-label={`Remove chance product ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>×</button></div>)}<button disabled={value.length >= 16} onClick={() => onChange([...value, { item: 'stone', amount: 1, probability: 0.5 }])}>+ Add chance product</button></fieldset>;
}
function Review({ mod }: { mod: GameMod }) {
  const rows: Array<[string, string, string, unknown]> = [];
  for (const section of ['resources', 'nodes', 'recipes', 'research'] as const) for (const [id, fields] of Object.entries(mod[section])) for (const [field, value] of Object.entries(fields)) rows.push([section, id, field, value]);
  for (const [field, value] of Object.entries(mod.rules)) rows.push(['settings', 'Game', field, value]);
  const display = (value: unknown): string => typeof value === 'object' && value !== null ? Array.isArray(value) ? value.map(v => typeof v === 'object' ? display(v) : String(v)).join(', ') || 'None' : Object.entries(value).map(([key, count]) => `${key}: ${display(count)}`).join(', ') || 'None' : String(value);
  return rows.length ? <div className="mods-review"><table><thead><tr><th>Entry</th><th>Setting</th><th>Declared value</th></tr></thead><tbody>{rows.map(([section, id, field, value]) => <tr key={`${section}:${id}:${field}`}><td><small>{section}</small>{id}</td><td>{field}</td><td>{display(value)}</td></tr>)}</tbody></table></div> : <p className="mods-help">No overrides declared. This package uses the base game.</p>;
}
