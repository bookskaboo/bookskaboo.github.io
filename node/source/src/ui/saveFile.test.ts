import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSaveFile } from '../persistence/saves';
import { createInitialState } from '../simulation/engine';
import { downloadSaveFile } from './saveFile';

let link: { href: string; download: string; click: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
let object: Blob;
let revoke: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  link = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
  revoke = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: (blob: Blob) => { object = blob; return 'blob:recovery-save'; }, revokeObjectURL: revoke });
  vi.stubGlobal('document', { createElement: () => link, body: { append: vi.fn() } });
  vi.stubGlobal('window', { setTimeout });
  vi.stubGlobal('localStorage', { setItem() { throw new Error('Unavailable'); } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('recovery save download', () => {
  it('requests a JSON download of current progress and cleans up the temporary URL', async () => {
    const state = createInitialState(204);
    state.playTimeMs = 789;
    const filename = downloadSaveFile(state);
    expect(filename).toMatch(/^node-save-.*\.json$/);
    expect(link.download).toBe(filename);
    expect(link.href).toBe('blob:recovery-save');
    expect(link.click).toHaveBeenCalledOnce();
    expect(parseSaveFile(await object.text()).playTimeMs).toBe(789);
    expect(object.type).toBe('application/json');
    expect(link.remove).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:recovery-save');
  });
  it('reports a failed download request and still releases the temporary link and URL', () => {
    link.click.mockImplementation(() => { throw new Error('Download blocked'); });
    expect(() => downloadSaveFile(createInitialState(204))).toThrow('Download blocked');
    expect(link.remove).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:recovery-save');
  });
});
