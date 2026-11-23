import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./assets', () => ({ cueUrls: { select: '/select.wav', place: '/place.wav', complete: '/complete.wav', upgrade: '/upgrade.wav', victory: '/victory.wav', attention: '/attention.wav', reject: '/reject.wav' }, musicUrl: '/music.wav' }));
import { GameAudio } from './GameAudio';
class Source {
  buffer?: unknown; loop = false; loopStart = 0; loopEnd = 0; onended?: () => void;
  connect = vi.fn(); disconnect = vi.fn(); start = vi.fn(); stop = vi.fn(() => this.onended?.());
}
class Context {
  static latest: Context;
  currentTime = 10; destination = {}; sources: Source[] = [];
  gains: Array<{ gain: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn> }> = [];
  resume = vi.fn(async () => {}); suspend = vi.fn(async () => {}); close = vi.fn(async () => {});
  decodeAudioData = vi.fn(async () => ({ duration: 60 }));
  constructor() { Context.latest = this; }
  createGain() { const gain = { gain: { value: 1, setTargetAtTime: vi.fn() }, connect: vi.fn() }; this.gains.push(gain); return gain; }
  createBufferSource() { const source = new Source(); this.sources.push(source); return source; }
}
const instances: GameAudio[] = [];
function setup() {
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
  const audio = new GameAudio(); instances.push(audio); return audio;
}
afterEach(async () => { await Promise.all(instances.splice(0).map(audio => audio.dispose())); vi.unstubAllGlobals(); });
it('stays silent and lazy until a gesture, then midpoint levels match the audition and loop continuously', async () => {
  const audio = setup(); audio.update({ musicVolume: 50, effectsVolume: 50 });
  expect(fetch).not.toHaveBeenCalled(); expect(audio.play('place')).toBe(false);
  await audio.activate(); const context = Context.latest, music = context.sources[0];
  expect(context.sources).toHaveLength(1); expect(music.loop).toBe(true); expect(music.loopEnd).toBe(60);
  expect(context.gains[0].gain.value).toBeCloseTo(.3); expect(context.gains[1].gain.value).toBeCloseTo(.15);
  context.currentTime = 131; await audio.activate(); expect(music.start).toHaveBeenCalledTimes(1); expect(fetch).toHaveBeenCalledTimes(8);
});
it('supports double the audition levels at maximum and independent mute without restarting music', async () => {
  const audio = setup(); await audio.activate(); const context = Context.latest, music = context.sources[0];
  audio.update({ effectsVolume: 100, musicVolume: 100 });
  expect(context.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.6, 10, .015);
  expect(context.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.3, 10, .015);
  audio.play('place'); const effect = context.sources[1];
  audio.update({ effectsVolume: 100, musicVolume: 100, effectsMuted: true });
  expect(effect.stop).toHaveBeenCalled(); expect(audio.play('place')).toBe(false); expect(music.stop).not.toHaveBeenCalled();
  expect(context.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.3, 10, .015);
  audio.update({ musicMuted: true }); expect(audio.play('reject')).toBe(true);
  expect(context.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 10, .015); expect(music.start).toHaveBeenCalledTimes(1);
});
it('drops hidden and pre-load cues, resumes the same clock and disposes both channels', async () => {
  const audio = setup(); expect(audio.play('complete')).toBe(false); await audio.activate(); const context = Context.latest, music = context.sources[0];
  audio.play('place'); await audio.setHidden(true);
  expect(audio.play('victory')).toBe(false); expect(context.suspend).toHaveBeenCalledTimes(1); expect(music.stop).not.toHaveBeenCalled();
  await audio.setHidden(false); expect(context.sources).toHaveLength(2); expect(music.start).toHaveBeenCalledTimes(1);
  await audio.dispose(); expect(context.close).toHaveBeenCalled(); expect(music.stop).toHaveBeenCalledTimes(1);
});
it('keeps milestone priority and blocks navigation double sounds after committed actions', async () => {
  const audio = setup(); await audio.activate();
  expect(audio.play('place')).toBe(true); expect(audio.play('select')).toBe(false);
  expect(audio.play('complete')).toBe(true); expect(audio.play('place')).toBe(false);
  expect(audio.play('complete')).toBe(false);
  expect(audio.play('upgrade')).toBe(true); expect(audio.play('attention')).toBe(false);
  expect(audio.play('victory')).toBe(true); expect(Context.latest.sources[0].stop).not.toHaveBeenCalled();
  audio.reset(); expect(Context.latest.sources[0].stop).not.toHaveBeenCalled();
});
it('retries failed loading and never starts audio after disposal during a pending load', async () => {
  const audio = setup(); vi.mocked(fetch).mockRejectedValueOnce(Error('Offline'));
  await audio.activate(); expect(audio.play('place')).toBe(false); await audio.activate(); expect(audio.play('place')).toBe(true);
  const pending = setup(); let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  vi.mocked(fetch).mockImplementation(async () => { await gate; return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) } as Response; });
  const loading = pending.activate(); await Promise.resolve(); const context = Context.latest; await pending.dispose(); release(); await loading;
  expect(context.sources).toHaveLength(0); expect(context.close).toHaveBeenCalledTimes(1);
});
it('isolates device failures during UI playback, hiding and teardown', async () => {
  const audio = setup(); await audio.activate(); const context = Context.latest;
  vi.spyOn(context, 'createBufferSource').mockImplementationOnce(() => { throw Error('Device closed'); });
  expect(audio.play('place')).toBe(false);
  context.suspend.mockRejectedValueOnce(Error('Device closed')); await expect(audio.setHidden(true)).resolves.toBeUndefined();
  context.close.mockRejectedValueOnce(Error('Device closed')); await expect(audio.dispose()).resolves.toBeUndefined();
  expect(audio.play('complete')).toBe(false);
});
