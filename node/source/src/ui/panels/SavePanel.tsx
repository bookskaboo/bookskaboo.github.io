import { useRef, useState } from 'react';
import type { GameState } from '../../domain/types';
import { copySaveToSlot, parseSaveFile, readSaveSlots, saveSlot, type SaveSlot } from '../../persistence/saves';
import { useAutosaveSnapshot } from '../useAutosaveSnapshot';
import { GameEngine } from '../../simulation/engine';
import { PanelHeader } from '../PanelHeader';
import { ConfirmModal } from '../components/ConfirmModal';
import { Dialog } from '../components/Dialog';
import { formatTime } from '../formatters';

function SavedModName({ slot }: { slot: SaveSlot | null }) {
  const name = slot?.state.mod?.name;
  return name ? <p className="save-mod-name">Mod pack: {name}</p> : null;
}

interface PendingWrite { index: number; source?: SaveSlot }

export function SavePanel({ game, engine, onSaved, onLoad, onClose }: {
  game: GameState; engine: GameEngine; onSaved?(): void; onLoad(slot: SaveSlot): void; onClose(): void;
}) {
  const [auto, refreshAutosave] = useAutosaveSnapshot();
  const [snapshot, setSnapshot] = useState(readSaveSlots);
  const { slots, unreadableSlots } = snapshot;
  const [names, setNames] = useState(() => slots.map((slot, index) => slot?.name ?? 'Save ' + (index + 1)));
  const nameEdits = useRef(new Set<number>());
  const [pendingLoad, setPendingLoad] = useState<number | 'autosave' | null>(null);
  const [pendingWrite, setPendingWrite] = useState<PendingWrite>();
  const [writeError, setWriteError] = useState<string>();
  const [importedSave, setImportedSave] = useState<SaveSlot>();
  const [importError, setImportError] = useState<string>();
  const [readingFile, setReadingFile] = useState(false);
  const fileRead = useRef(0);
  const load = importedSave ?? (pendingLoad === 'autosave' ? auto : typeof pendingLoad === 'number' ? slots[pendingLoad] : null);
  const error = writeError ?? snapshot.error;
  const blocked = Boolean(snapshot.error);
  const describeInterval = game.preferences.autosaveMinutes === 1 ? 'Every minute' : game.preferences.autosaveMinutes === 60 ? 'Once an hour' : 'Every ' + game.preferences.autosaveMinutes + ' minutes';

  const refresh = () => {
    refreshAutosave();
    const next = readSaveSlots();
    setSnapshot(next);
    setNames(current => next.slots.map((slot, index) => nameEdits.current.has(index) ? current[index] : slot?.name ?? 'Save ' + (index + 1)));
    setWriteError(undefined);
  };
  const write = ({ index, source }: PendingWrite) => {
    try {
      if (source) copySaveToSlot(index, source, names[index]);
      else saveSlot(index, game, names[index]);
      try { onSaved?.(); } catch { /* Feedback cannot turn a successful save into an error. */ }
      nameEdits.current.delete(index);
      refresh();
    } catch {
      const latest = readSaveSlots();
      setSnapshot(latest);
      setWriteError(latest.error ?? 'The save could not be written. Existing stored saves were kept.');
    }
    setPendingWrite(undefined);
  };
  const requestWrite = (index: number, source?: SaveSlot) => {
    if (blocked) return;
    if (unreadableSlots.includes(index)) setPendingWrite({ index, source });
    else write({ index, source });
  };

  return <>
    <div className="modal-backdrop"><Dialog panel className="modal save-modal glass" aria-label="Save / Load" onDismiss={onClose}>
      <PanelHeader title="Save / Load" onClose={onClose} />
      <div className="save-local-note"><i>◇</i><span>
        <b>Saves stay on this device and browser.</b>
        <small>They are not uploaded. The paperwork stays here.</small>
      </span></div>
      <div className="save-file-actions">
        <label className="save-import-control">{readingFile ? 'Reading save file…' : 'Import Save'}
          <input type="file" accept=".json,application/json" disabled={readingFile} aria-label="Import Save" onChange={async event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (!file) return;
            const request = ++fileRead.current;
            setReadingFile(true); setImportError(undefined);
            try { const slot = parseSaveFile(await file.text()); if (request === fileRead.current) setImportedSave(slot); }
            catch (error) { if (request === fileRead.current) setImportError(error instanceof Error ? error.message : 'The save file could not be read. Try again.'); }
            finally { if (request === fileRead.current) setReadingFile(false); }
          }} />
        </label><p>Load an exported save file. Review before replacing this factory.</p>
        {importError && <p className="save-import-error" role="alert">{importError}</p>}
      </div>
      {error && <div className="save-storage-error" role="alert"><p>{error}</p><button onClick={refresh}>Retry</button></div>}
      <div className="save-list">
        <article className={'save-slot autosave ' + (auto ? 'occupied' : 'empty')}>
          <div className="save-slot-index autosave-index"><span>AUTO</span><b>{game.preferences.autosaveMinutes}m</b></div>
          <div className="save-slot-copy">
            <label>AUTOSAVE</label><strong>{auto?.name ?? auto?.sectorName ?? 'Awaiting first autosave'}</strong>
            <p><em className={auto ? '' : 'empty'}>{auto ? 'AVAILABLE' : 'PENDING'}</em>
              {auto ? <time>{new Date(auto.savedAt).toLocaleString()} · {formatTime(auto.playTimeMs)}</time> : <span>{describeInterval} of active play</span>}
            </p><SavedModName slot={auto} />
          </div>
          <div className="save-slot-actions"><button disabled={!auto} onClick={() => setPendingLoad('autosave')}>LOAD</button></div>
          <label className="autosave-frequency">
            <span><b>Autosave frequency</b><small>{describeInterval}</small></span><strong>{game.preferences.autosaveMinutes} MIN</strong>
            <input type="range" min="1" max="60" value={game.preferences.autosaveMinutes} onChange={(event) => engine.updatePreferences({ autosaveMinutes: Number(event.target.value) })} />
            <i><span>Every minute</span><span>Once an hour</span></i>
          </label>
          <div className="autosave-copy-actions"><span>COPY TO PERMANENT SLOT</span>
            {slots.map((slot, index) => <button key={index} disabled={!auto || blocked} onClick={() => auto && requestWrite(index, auto)}>
              {slot || unreadableSlots.includes(index) ? 'Overwrite ' + (index + 1) : 'Slot ' + (index + 1)}
            </button>)}
          </div>
        </article>
        {slots.map((slot, index) => {
          const unreadable = unreadableSlots.includes(index);
          return <article className={'save-slot manual-save ' + (unreadable || blocked ? 'unreadable' : slot ? 'occupied' : 'empty')} aria-label={'Manual save slot ' + (index + 1)} key={index}>
            <div className="save-slot-index"><span>SLOT</span><b>{index + 1}</b></div>
            <div className="save-slot-copy">
              <label htmlFor={'save-name-' + index}>SAVE NAME</label>
              <input id={'save-name-' + index} value={names[index]} maxLength={40} spellCheck={false} placeholder={'Save ' + (index + 1)}
                onChange={(event) => { nameEdits.current.add(index); setNames((current) => current.map((name, nameIndex) => nameIndex === index ? event.target.value : name)); }} />
              <p><em className={unreadable || blocked ? 'unreadable' : slot ? '' : 'empty'}>{blocked ? 'UNAVAILABLE' : unreadable ? 'UNREADABLE' : slot ? 'SAVED' : 'EMPTY'}</em>
                {slot && <time>{new Date(slot.savedAt).toLocaleString()} · {formatTime(slot.playTimeMs)}</time>}
                {!slot && !unreadable && !blocked && <span>No saved game here. Room for a better idea.</span>}
              </p>
              {unreadable && <p className="save-read-error">This save cannot be loaded. Saving to another slot will keep its data.</p>}
              <SavedModName slot={slot} />
            </div>
            <div className="save-slot-actions">
              <button disabled={blocked} onClick={() => requestWrite(index)}>{slot || unreadable ? 'OVERWRITE' : 'SAVE'}</button>
              <button className="secondary" disabled={!slot} onClick={() => setPendingLoad(index)}>LOAD</button>
            </div>
          </article>;
        })}
      </div>
    </Dialog></div>
    {load && <ConfirmModal title={importedSave ? 'Load imported save?' : 'Load saved game?'} body={'Load ' + (load.name ?? load.sectorName) + '? Unsaved progress in the current game will be replaced.'}
      confirm="LOAD SAVE" onCancel={() => { setPendingLoad(null); setImportedSave(undefined); }} onConfirm={() => { onLoad(load); setPendingLoad(null); setImportedSave(undefined); onClose(); }} />}
    {pendingWrite && <ConfirmModal title="Replace unreadable save?"
      body={'This replaces the stored data in Slot ' + (pendingWrite.index + 1) + '. That data cannot be recovered through the game.'}
      confirm="REPLACE SAVE" onCancel={() => setPendingWrite(undefined)} onConfirm={() => write(pendingWrite)} />}
  </>;
}
