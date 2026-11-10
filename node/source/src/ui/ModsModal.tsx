import { useEffect, useRef, useState } from 'react';
import type { GameState, NodeKind } from '../domain/types';
import { WORLD_GRID_SIZES, worldGridSize } from '../domain/worldGrid';
import type { GameEngine } from '../simulation/engine';
import { BASE_MOD_CONTENT as BASE } from '../mods/modContent';
import { BASE_MOD_RULES } from '../mods/modRules';
import { CONNECTION_RULE_KEYS, emptyMod, MAP_RULE_KEYS, MOD_NODE_TEMPLATES, type GameMod, type ModRules, type ProfileCategory } from '../mods/modTypes';
import { validateMod, RULE_LIMITS } from '../mods/modValidation';
import { createEntry, entriesFor, entrySection, isNodeCategory, isProfileCategory, type ModCategory } from '../mods/modCatalog';
import { exportMod, exportModText, importMod, MAX_MOD_CODE_LENGTH, modTextFilename, readModTextFile } from '../mods/modSharing';
import { PanelHeader } from './PanelHeader';
import { EntryEditor, Field, Numeric, Select, type UpdateDraft } from './ModEntryEditor';

const DRAFT_KEY = 'nodefactory.mod-draft.v1';
const CATEGORIES: Array<{ id: ModCategory; title: string; icon: string; detail: string }> = [
  { id: 'resources', title: 'Resources', icon: '◆', detail: 'Names and colors for raw materials and manufactured items.' },
  { id: 'production', title: 'Production nodes', icon: '⚒', detail: 'Machines and Extractors. Build times, recipes and sockets.' },
  { id: 'logistics', title: 'Logistics & storage', icon: '⇥', detail: 'Routes, Carts, Trucks and Trains. Capacity and connection limits.' },
  { id: 'obstructions', title: 'Obstructions & world nodes', icon: '◈', detail: 'Lakes, settlements, Deep Holes and reserves.' },
  { id: 'research', title: 'Research', icon: '⌁', detail: 'Project names, costs, prerequisites and repeatable prices.' },
  { id: 'maps', title: 'Map nodes', icon: '◎', detail: 'World grid size, field dimensions, new resource reserves and Forest regeneration.' },
  { id: 'recipes', title: 'Recipes', icon: '≡', detail: 'Ingredients, products, cycle times and chance products.' },
  { id: 'connections', title: 'Connections & construction', icon: '⌘', detail: 'Cable travel, dispatch intervals, Roads and global build times.' },
];
const RULE_LABELS: Record<keyof ModRules, [string, string]> = {
  cableTravelMs: ['Cable travel time (ms)', 'Time in flight for new shipments. Existing shipments finish on their original schedule.'],
  cableLaunchMs: ['Cable dispatch interval (ms)', 'How often cables attempt to launch. Simulation checks run every 100 ms.'],
  roadTransferMs: ['Road dispatch interval (ms)', 'Time between Road shipments; vehicle payload upgrades still apply.'],
  constructionMultiplier: ['Global construction time multiplier', '0 = instant; 0.5 = half the build time; 2 = twice the time. Applies to new builds.'],
  forestRegenMs: ['Forest regeneration interval (ms)', 'Base time to restore one unit naturally. Regeneration research still applies.'],
  worldGridSize: ['World map size', 'Change the grid before opening your first map beyond Home. Each factory keeps its chosen size.'],
  mapResourceMultiplier: ['New map resource reserve multiplier', 'Applies when a map is first generated. Existing reserves and stock stay intact.'],
  mapWidthMultiplier: ['Map width multiplier', 'Expands usable fields, including current maps. Existing node positions stay in place.'],
  mapHeightMultiplier: ['Map height multiplier', 'Expands usable fields, including current maps. Existing node positions stay in place.'],
};

function readDraft(game: GameState): GameMod {
  try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) return validateMod(JSON.parse(saved)); } catch { /* An invalid draft must not prevent opening the editor. */ }
  return game.mod ? structuredClone(game.mod) : emptyMod();
}
const changeCount = (mod: GameMod) => Object.keys(mod.resources).length + Object.keys(mod.nodes).length + Object.keys(mod.recipes).length + Object.keys(mod.research).length + Object.keys(mod.rules).length +
  Object.values(mod.profiles ?? {}).reduce((sum, group) => sum + Object.keys(group.entries).length, 0);
const errorText = (error: unknown) => error instanceof Error ? error.message : 'The settings could not be loaded.';

function downloadModFile(draft: GameMod) {
  const filename = modTextFilename(draft.name);
  const url = URL.createObjectURL(new Blob([exportModText(draft)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export function ModsModal({ game, engine, onClose }: { game: GameState; engine: GameEngine; onClose(): void }) {
  const [draft, setDraft] = useState(() => readDraft(game));
  const [view, setView] = useState<ModCategory | 'home' | 'share' | 'review'>('home');
  const [selected, setSelected] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [paste, setPaste] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const shareOutput = useRef<HTMLTextAreaElement>(null);
  const fileRequest = useRef(0);
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setStorageError(false); } catch { setStorageError(true); } }, [draft]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => { fileRequest.current++; previous?.focus(); };
  }, []);
  useEffect(() => { if (!creating) dialog.current?.focus(); dialog.current?.querySelector('.mods-body')?.scrollTo(0, 0); }, [view, selected, creating]);
  const update = (edit: (mod: GameMod) => void) => { setDraft(current => { const next = structuredClone(current); edit(next); return next; }); setError(''); setMessage(''); setCode(''); };
  const navigate = (next: typeof view) => {
    fileRequest.current++;
    setReadingFile(false);
    setSelected(undefined); setCreating(false); setSearch(''); setView(next); setError(''); setMessage('');
  };
  const back = () => { if (creating) setCreating(false); else if (selected) { setSelected(undefined); setError(''); } else if (view !== 'home') navigate('home'); else onClose(); };
  const attempt = (action: () => void) => { try { action(); setError(''); } catch (caught) { setError(errorText(caught)); setMessage(''); } dialog.current?.querySelector('.mods-body')?.scrollTo(0, 0); };
  const apply = () => attempt(() => { engine.applyMod(draft); setMessage(`“${draft.name}” is active in this factory and will be included in its saves.`); });
  const loadImportedDraft = (imported: GameMod) => {
    setDraft(imported);
    setCode('');
    setMessage(`Imported “${imported.name}”${imported.author ? ` by ${imported.author}` : ''}. Review the draft before applying it.`);
  };
  const importTextFile = async (file: File) => {
    const request = ++fileRequest.current;
    setReadingFile(true); setError(''); setMessage('');
    try {
      const imported = await readModTextFile(file);
      if (request === fileRequest.current) loadImportedDraft(imported);
    } catch (caught) {
      if (request === fileRequest.current) setError(errorText(caught));
    } finally {
      if (request === fileRequest.current) setReadingFile(false);
    }
  };
  const category = CATEGORIES.find(card => card.id === view);
  const entries = category ? entriesFor(category.id, draft) : [];
  const title = creating ? 'Create entry' : entries.find(([id]) => id === selected)?.[1] ?? category?.title ??
    (view === 'home' ? 'Mods' : view === 'share' ? 'Import & share' : 'Review changes');
  const remove = (group: ModCategory, id: string) => attempt(() => {
    const next = structuredClone(draft);
    if (isProfileCategory(group)) {
      const presets = next.profiles?.[group];
      if (!presets) return;
      delete presets.entries[id];
      if (presets.selected === id) delete presets.selected;
    } else delete (next[entrySection(group)] as Record<string, unknown>)[id];
    setDraft(validateMod(next));
    setCode(''); setMessage('');
    setSelected(undefined);
  });
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
    <div id="mods-title"><PanelHeader title={title} onClose={onClose} /></div>
    <div className="mods-navigation"><button onClick={back}>{view === 'home' ? 'Close' : '← Back'}</button><span>{game.mod ? `Active: ${game.mod.name}` : 'Active: Base game'}</span><button onClick={() => navigate('review')}>{changeCount(draft)} edited entries</button></div>
    <div className="mods-body" key={`${view}:${selected ?? ''}`}>
      {error && <p className="mods-error" role="alert">{error}</p>}{message && <p className="mods-success" role="status">{message}</p>}
      {storageError && <p className="mods-error" role="alert">Browser storage is full or unavailable. Export a mod file before closing to keep this draft.</p>}
      {view === 'home' && <>
        <p className="mods-intro">Rewrite the factory handbook. The factory was not consulted.</p>
        <p className="mods-help">Edit a draft, review it, then apply it to this factory. One mod package is active at a time. Drafts are kept in this browser; applied mods travel with saves.</p>
        <div className="mods-metadata"><Field label="Mod name"><input maxLength={80} value={draft.name} onChange={e => update(m => { m.name = e.target.value; })} /></Field><Field label="Author"><input maxLength={80} value={draft.author} onChange={e => update(m => { m.author = e.target.value; })} /></Field><Field label="Description"><textarea maxLength={2000} rows={2} value={draft.description} onChange={e => update(m => { m.description = e.target.value; })} /></Field></div>
        <div className="mods-actions"><button onClick={() => navigate('share')}>Import / export mods</button><button onClick={() => { setDraft(emptyMod()); setCode(''); setMessage('Started a new draft using base-game settings. The active factory is unchanged.'); }}>New from base game</button><button disabled={!game.mod} onClick={() => { setDraft(structuredClone(game.mod!)); setCode(''); setMessage('Loaded the active package into the editor.'); }}>Load active mod</button></div>
        <div className="mods-category-grid">{CATEGORIES.map(c => <button key={c.id} onClick={() => navigate(c.id)}><i>{c.icon}</i><span><b>{c.title}</b><small>{c.detail}</small></span><em>→</em></button>)}</div>
        <button disabled={!game.mod} onClick={() => attempt(() => { engine.applyMod(); setMessage('Base-game rules restored. Your draft is still here. Existing reserves, completed research and constructed nodes are retained.'); })}>Use base-game rules in this factory</button>
      </>}
      {view === 'share' && <>
        <h3>Editable mod file</h3>
        <p className="mods-help">Download the draft as a text file you can open in any text editor. It uses JSON with a section for each catalog. Importing a valid file replaces the editor draft. Apply it when you are ready.</p>
        <div className="mods-actions">
          <button onClick={() => attempt(() => { const filename = downloadModFile(draft); setMessage(`Download started for ${filename}.`); })}>Export text file</button>
          <button onClick={() => navigate('review')}>Review changes</button>
        </div>
        <Field label="Import mod text file" hint="Choose a NODE Mod Pack .txt or .json file up to 2 MB.">
          <input type="file" accept=".txt,.json,text/plain,application/json" disabled={readingFile} onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void importTextFile(file);
          }} />
        </Field>
        {readingFile && <p className="mods-help" role="status">Reading mod file…</p>}
        <h3>Import a share code</h3><p className="mods-help">Paste a complete NODEMOD1 code to load it into the editor.</p>
        <Field label="Paste mod share code"><textarea rows={5} maxLength={MAX_MOD_CODE_LENGTH} spellCheck={false} value={paste} onChange={e => setPaste(e.target.value)} placeholder="NODEMOD1.…" /></Field>
        <button disabled={readingFile || !paste.trim()} onClick={() => attempt(() => loadImportedDraft(importMod(paste)))}>Import into editor</button>
        <h3>Share this draft</h3><p className="mods-help">The code includes names, settings and all declared changes. Share codes contain data; they cannot run scripts.</p>
        <div className="mods-actions"><button onClick={() => attempt(() => { setCode(exportMod(draft)); setMessage('Share code generated. Copy it below.'); })}>Generate share code</button><button disabled={!code} onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('Share code copied.'); } catch { shareOutput.current?.focus(); shareOutput.current?.select(); setMessage('Code selected. Press Ctrl+C or use your browser’s Copy command.'); } }}>Copy share code</button></div>
        {code && <Field label={`Exported share code · ${code.length.toLocaleString()} characters`}><textarea ref={shareOutput} rows={6} readOnly spellCheck={false} value={code} onFocus={e => e.target.select()} /></Field>}
      </>}
      {view === 'review' && <><h3>{draft.name || 'Untitled mod'}</h3><p className="mods-help">Only declared overrides are exported. Unedited settings inherit the installed base game. Removing a mod restores rules; it does not rewind stock, research, construction or map generation.</p><Review mod={draft} /><div className="mods-actions"><button onClick={() => navigate('share')}>Export this draft</button></div></>}
      {category && (creating ? <CreateEntryForm category={category.id} onCreate={(name, template) => {
        const next = structuredClone(draft);
        const id = createEntry(next, category.id, name, template);
        setDraft(next); setSelected(id); setCreating(false); setCode(''); setError(''); setMessage('');
      }} /> : selected ? isProfileCategory(category.id) ?
        <ProfileEditor category={category.id} id={selected} draft={draft} gridSize={worldGridSize(game)} update={update} onRemove={() => remove(category.id, selected)} /> :
        <EntryEditor category={category.id} id={selected} draft={draft} update={update} onRemove={() => remove(category.id, selected)} /> : <>
        <div className="mods-actions"><button onClick={() => setCreating(true)}>+ Create entry</button></div>
        {!isProfileCategory(category.id) && <Field label="Search entries"><input type="search" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find an item, node, recipe or project…" /></Field>}
        <div className="mods-entry-list">{entries.filter(([id, name]) => `${id} ${name}`.toLowerCase().includes(search.toLowerCase())).map(([id, name]) => (
          <button key={id} onClick={() => setSelected(id)}><b>{name}</b><em>{isEdited(draft, category.id, id) ? 'Edited · ' : ''}Edit →</em></button>
        ))}</div>
        {isProfileCategory(category.id) && <>
          <h3>Factory defaults</h3>
          <p className="mods-help">A selected preset overrides these settings when the draft is applied.</p>
          <RuleFields category={category.id} rules={draft.rules} inherited={{ ...BASE_MOD_RULES, worldGridSize: worldGridSize(game) }} onChange={(key, value) => update(mod => setRule(mod.rules, key, value))} />
        </>}
      </>)}
    </div>
    <footer className="mods-footer"><span>Draft: {draft.name || 'Untitled'}<small>Edits take effect when applied.</small></span><button onClick={() => navigate('review')}>Review</button><button className="mods-primary" disabled={readingFile} onClick={apply}>Apply to factory</button></footer>
  </section></div>;
}

function isEdited(mod: GameMod, category: ModCategory, id: string) {
  if (isProfileCategory(category)) return mod.profiles?.[category]?.selected === id;
  return Object.hasOwn(mod[entrySection(category)], id);
}

function CreateEntryForm({ category, onCreate }: { category: ModCategory; onCreate(name: string, template?: NodeKind): void }) {
  const templates = isNodeCategory(category) ? MOD_NODE_TEMPLATES[category] : undefined;
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<NodeKind | undefined>(templates?.[0]);
  return <form onSubmit={event => { event.preventDefault(); if (name.trim()) onCreate(name.trim(), template); }}>
    <Field label="New entry name"><input autoFocus required maxLength={80} value={name} onChange={event => setName(event.target.value)} /></Field>
    {templates && <Field label="Node template" hint="Choose the built-in behavior to use. You can edit the new node’s settings next.">
      <Select value={template ?? ''} options={templates.map(kind => [kind, BASE.nodes[kind].name])} onChange={value => setTemplate(value as NodeKind)} />
    </Field>}
    <button type="submit" className="mods-primary" disabled={!name.trim()}>Create entry</button>
  </form>;
}

function setRule(rules: ModRules, key: keyof ModRules, value: number | undefined) {
  if (value === undefined) delete rules[key];
  else rules[key] = value;
}

function RuleFields({ category, rules, inherited, onChange }: { category: ProfileCategory; rules: ModRules; inherited: Required<ModRules>; onChange(key: keyof ModRules, value?: number): void }) {
  const keys = category === 'maps' ? MAP_RULE_KEYS : CONNECTION_RULE_KEYS;
  return <>{keys.map(key => key === 'worldGridSize' ? <Field key={key} label={RULE_LABELS[key][0]} hint={RULE_LABELS[key][1]}>
    <Select value={String(rules[key] ?? '')} options={WORLD_GRID_SIZES.map(size => [String(size), `${size}×${size}`])}
      emptyLabel={`Inherit (${inherited[key]}×${inherited[key]})`} onChange={value => onChange(key, value ? Number(value) : undefined)} />
  </Field> : <Numeric key={key} label={RULE_LABELS[key][0]} hint={RULE_LABELS[key][1]} value={rules[key]} base={inherited[key]}
    min={RULE_LIMITS[key][0]} max={RULE_LIMITS[key][1]} step="any" onChange={value => onChange(key, value)} />)}</>;
}

function ProfileEditor({ category, id, draft, gridSize, update, onRemove }: { category: ProfileCategory; id: string; draft: GameMod; gridSize: number; update: UpdateDraft; onRemove(): void }) {
  const group = draft.profiles![category]!;
  const preset = group.entries[id];
  const selected = group.selected === id;
  return <>
    <Field label="Preset name"><input maxLength={80} value={preset.name} onChange={event => update(mod => { mod.profiles![category]!.entries[id].name = event.target.value; })} /></Field>
    <div className="mods-actions">
      <button aria-pressed={selected} onClick={() => update(mod => { const current = mod.profiles![category]!; if (selected) delete current.selected; else current.selected = id; })}>{selected ? 'Use factory defaults' : 'Use this preset'}</button>
      <button onClick={() => update(mod => { const rules = mod.profiles![category]!.entries[id].rules; for (const key of category === 'maps' ? MAP_RULE_KEYS : CONNECTION_RULE_KEYS) rules[key] = BASE_MOD_RULES[key]; })}>Import base settings</button>
      <button onClick={onRemove}>Remove preset</button>
    </div>
    <p className="mods-help">{selected ? 'Selected for this draft.' : 'Saved in this draft for later use.'}</p>
    <RuleFields category={category} rules={preset.rules} inherited={{ ...BASE_MOD_RULES, worldGridSize: gridSize, ...draft.rules }} onChange={(key, value) => update(mod => setRule(mod.profiles![category]!.entries[id].rules, key, value))} />
  </>;
}

function Review({ mod }: { mod: GameMod }) {
  const rows: Array<[string, string, string, unknown]> = [];
  for (const section of ['resources', 'nodes', 'recipes', 'research'] as const) for (const [id, fields] of Object.entries(mod[section])) for (const [field, value] of Object.entries(fields)) rows.push([section, id, field, value]);
  for (const [field, value] of Object.entries(mod.rules)) rows.push(['settings', 'Game', field, value]);
  for (const [category, group] of Object.entries(mod.profiles ?? {})) for (const [id, preset] of Object.entries(group.entries)) {
    const name = group.selected === id ? `${preset.name} (selected)` : preset.name;
    rows.push([category, name, 'preset', preset.rules]);
  }
  const display = (value: unknown): string => typeof value === 'object' && value !== null ? Array.isArray(value) ? value.map(v => typeof v === 'object' ? display(v) : String(v)).join(', ') || 'None' : Object.entries(value).map(([key, count]) => `${key}: ${display(count)}`).join(', ') || 'None' : String(value);
  return rows.length ? <div className="mods-review"><table><thead><tr><th>Entry</th><th>Setting</th><th>Declared value</th></tr></thead><tbody>{rows.map(([section, id, field, value]) => <tr key={`${section}:${id}:${field}`}><td><small>{section}</small>{id}</td><td>{field}</td><td>{display(value)}</td></tr>)}</tbody></table></div> : <p className="mods-help">No overrides declared. This package uses the base game.</p>;
}
