import { describe, expect, it, vi } from 'vitest';
import { PlayfieldResources, destroyPlayfieldApplication } from './playfieldResources';
import type { Application } from 'pixi.js';

describe('playfield resource lifetime', () => {
  it('releases registrations once in reverse order and releases late registrations immediately', () => {
    const scope = new PlayfieldResources(), calls: number[] = [];
    const release = scope.add(() => calls.push(1));
    scope.add(() => calls.push(2)); release(); scope.dispose(); scope.dispose();
    scope.add(() => calls.push(3));
    expect(calls).toEqual([1, 2, 3]);
  });
  it('unbinds captured DOM listeners', () => {
    const scope = new PlayfieldResources(), target = new EventTarget(), handler = vi.fn();
    scope.listen(target, 'test', handler, true);
    target.dispatchEvent(new Event('test')); scope.dispose(); target.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('waits for pending initialization before destroying and prevents post-unmount setup', async () => {
    const scope = new PlayfieldResources(), dispose = vi.fn(); let ready!: () => void;
    const started = scope.initialize(() => new Promise<void>(resolve => { ready = resolve; }), dispose);
    scope.dispose(); expect(dispose).not.toHaveBeenCalled(); ready();
    expect(await started).toBe(false); expect(dispose).toHaveBeenCalledTimes(1); scope.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it('destroys an initialization failure and still releases registrations attached earlier', async () => {
    const scope = new PlayfieldResources(), dispose = vi.fn(), listener = vi.fn();
    scope.add(listener);
    await expect(scope.initialize(async () => { throw Error('boot'); }, dispose)).rejects.toThrow('boot');
    scope.dispose(); expect(dispose).toHaveBeenCalledTimes(1); expect(listener).toHaveBeenCalledTimes(1);
  });
  it('disposes a completed initialization normally', async () => {
    const scope = new PlayfieldResources(), dispose = vi.fn();
    expect(await scope.initialize(async () => {}, dispose)).toBe(true);
    expect(dispose).not.toHaveBeenCalled(); scope.dispose(); expect(dispose).toHaveBeenCalledTimes(1);
  });
  it('preserves the startup failure when partial cleanup also throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const scope = new PlayfieldResources(), remaining = vi.fn(); scope.add(remaining);
    const dispose = vi.fn(() => { throw Error('cleanup'); });
    await expect(scope.initialize(async () => { throw Error('boot'); }, dispose)).rejects.toThrow('boot');
    scope.dispose(); expect(dispose).toHaveBeenCalledTimes(1); expect(remaining).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalled(); log.mockRestore();
  });
  it('continues cleanup after a disposer throws', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const scope = new PlayfieldResources(), remaining = vi.fn(); scope.add(remaining);
    scope.add(() => { throw Error('cleanup'); }); scope.dispose();
    expect(remaining).toHaveBeenCalledTimes(1); expect(log).toHaveBeenCalled(); log.mockRestore();
  });
  it('destroys only the allocated stage when renderer creation rejects', () => {
    const destroy = vi.fn(); destroyPlayfieldApplication({ stage: { destroyed: false, destroy } } as unknown as Application);
    expect(destroy).toHaveBeenCalledWith({ children: true });
  });
  it('releases a renderer when application plugin cleanup throws', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = { destroy: vi.fn() }, stage = { destroyed: false, destroy: vi.fn() }, ticker = { stop: vi.fn() };
    destroyPlayfieldApplication({ renderer, stage, ticker, destroy() { throw Error('partial plugin'); } } as unknown as Application);
    expect(stage.destroy).toHaveBeenCalledTimes(1); expect(renderer.destroy).toHaveBeenCalledWith(true);
    expect(ticker.stop).toHaveBeenCalledTimes(1); log.mockRestore();
  });
});
