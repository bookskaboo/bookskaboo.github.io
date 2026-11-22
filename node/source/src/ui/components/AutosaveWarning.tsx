import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { GameEngine } from '../../simulation/engine';
import { downloadSaveFile } from '../saveFile';

export function AutosaveWarning({ engine }: { engine: GameEngine }) {
  const failed = useSyncExternalStore(engine.subscribe, engine.hasAutosaveFailure, engine.hasAutosaveFailure);
  const banner = useRef<HTMLElement>(null);
  const [exportMessage, setExportMessage] = useState<string>();
  useEffect(() => setExportMessage(undefined), [failed]);
  useLayoutEffect(() => {
    const element = banner.current;
    const shell = element?.closest<HTMLElement>('.game-shell');
    if (!element || !shell) return;
    const resize = () => shell.style.setProperty('--autosave-warning-height', `${element.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => { observer.disconnect(); shell.style.removeProperty('--autosave-warning-height'); };
  }, [failed]);
  if (!failed) return null;
  return <aside ref={banner} className="autosave-warning" role="alert" aria-label="Autosave failed" onKeyDown={event => event.stopPropagation()}>
    <div><strong>Autosave failed</strong><p>Recent progress could not be saved in this browser. Retry, or export a save file.</p>
      {exportMessage && <p role="status">{exportMessage}</p>}</div>
    <div className="autosave-warning-actions">
      <button type="button" onClick={() => engine.retryAutosave()}>Retry</button>
      <button type="button" onClick={() => {
        try { downloadSaveFile(engine.getState()); setExportMessage('Save-file download requested. Autosave still needs to succeed.'); }
        catch { setExportMessage('The save file could not be exported. Try again.'); }
      }}>Export Save</button>
    </div>
  </aside>;
}
