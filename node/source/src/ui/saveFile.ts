import type { GameState } from '../domain/types';
import { serializeSaveFile } from '../persistence/saves';

/** Export the current factory without requiring browser storage. */
export function downloadSaveFile(state: GameState) {
  const text = serializeSaveFile(state);
  const filename = `node-save-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return filename;
}
