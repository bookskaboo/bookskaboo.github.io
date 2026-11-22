import { useCallback, useEffect, useState } from 'react';
import { subscribeAutosaveWrites } from '../persistence/autosave';
import { AUTOSAVE_KEY, readAutosave } from '../persistence/saves';

/** Only persisted-save changes or explicit browser refresh boundaries invalidate this panel snapshot. */
export function observeAutosaveChanges(refresh: () => void, host: Pick<Window, 'addEventListener' | 'removeEventListener'>) {
  const unsubscribe = subscribeAutosaveWrites(refresh);
  const storage = (event: Event) => {
    const { key } = event as StorageEvent;
    if (key === null || key === AUTOSAVE_KEY) refresh();
  };
  host.addEventListener('storage', storage);
  host.addEventListener('focus', refresh);
  // Close the gap between the initial render read and subscribing to writes/events.
  refresh();
  return () => {
    unsubscribe();
    host.removeEventListener('storage', storage);
    host.removeEventListener('focus', refresh);
  };
}

export function useAutosaveSnapshot() {
  const [snapshot, setSnapshot] = useState(readAutosave);
  const refresh = useCallback(() => setSnapshot(readAutosave()), []);
  useEffect(() => observeAutosaveChanges(refresh, window), [refresh]);
  return [snapshot, refresh] as const;
}
