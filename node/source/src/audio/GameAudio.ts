import { audioGains, audioPreferences, type AudioPreferences } from '../domain/audioPreferences';
import type { FeedbackCue } from '../domain/playerFeedback';
import { cueUrls, musicUrl } from './assets';

const cooldowns: Partial<Record<FeedbackCue, number>> = { select: 80, panel: 80, reject: 500, attention: 3000, complete: 400, travel: 250 };
const priority: Partial<Record<FeedbackCue, number>> = { complete: 2, attention: 3, upgrade: 4, victory: 5 };

/** Audio is a browser-side consumer of committed feedback; it never controls simulation. */
export class GameAudio {
  private context?: AudioContext;
  private effectsGain?: GainNode;
  private musicGain?: GainNode;
  private buffers = new Map<FeedbackCue, AudioBuffer>();
  private musicBuffer?: AudioBuffer;
  private musicSource?: AudioBufferSourceNode;
  private active = new Map<AudioBufferSourceNode, FeedbackCue>();
  private played = new Map<FeedbackCue, number>();
  private preferences = audioPreferences();
  private activation?: Promise<void>;
  private ready = false;
  private disposed = false;
  private hidden = false;
  private lastActionAt = -Infinity;

  update(value: Partial<AudioPreferences>) {
    if (this.disposed) return;
    this.preferences = audioPreferences(value);
    if (!this.context) return;
    const gains = audioGains(this.preferences);
    this.effectsGain?.gain.setTargetAtTime(gains.effects, this.context.currentTime, .015);
    this.musicGain?.gain.setTargetAtTime(gains.music, this.context.currentTime, .015);
    if (!gains.effects) this.stopEffects();
  }

  /** Called directly by a trusted gesture. Loading never queues or replays missed cues. */
  activate(): Promise<void> {
    if (this.disposed || this.hidden) return Promise.resolve();
    if (this.activation) return this.activation;
    this.activation = this.load().catch(() => { /* Audio failure must leave the factory usable; next gesture retries. */ })
      .finally(() => { this.activation = undefined; });
    return this.activation;
  }
  private async load() {
    const context = this.context ??= new AudioContext();
    if (!this.effectsGain) {
      this.effectsGain = context.createGain(); this.effectsGain.connect(context.destination);
      this.musicGain = context.createGain(); this.musicGain.connect(context.destination);
      const gains = audioGains(this.preferences);
      this.effectsGain.gain.value = gains.effects; this.musicGain.gain.value = gains.music;
    }
    await context.resume();
    if (this.disposed || this.hidden) return;
    const decode = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw Error('Audio unavailable');
      return context.decodeAudioData(await response.arrayBuffer());
    };
    await Promise.all([
      ...Object.entries(cueUrls).map(async ([id, url]) => { if (!this.buffers.has(id as FeedbackCue)) this.buffers.set(id as FeedbackCue, await decode(url)); }),
      (async () => { if (!this.musicBuffer) this.musicBuffer = await decode(musicUrl); })(),
    ]);
    if (this.disposed) return;
    this.ready = true; this.update(this.preferences);
    if (this.hidden || this.musicSource) return;
    const source = context.createBufferSource();
    source.buffer = this.musicBuffer!; source.loop = true; source.loopStart = 0; source.loopEnd = this.musicBuffer!.duration;
    source.connect(this.musicGain!); this.musicSource = source;
    source.onended = () => source.disconnect(); source.start();
  }

  play(cue: FeedbackCue) {
    if (!this.ready || this.disposed || this.hidden || !audioGains(this.preferences).effects) return false;
    const now = performance.now(), navigation = cue === 'select' || cue === 'panel';
    if (navigation && now - this.lastActionAt < 150) return false;
    if (now - (this.played.get(cue) ?? -Infinity) < (cooldowns[cue] ?? 100)) return false;
    if ([...this.active.values()].some(active => (priority[active] ?? 0) > (priority[cue] ?? 0))) return false;
    const buffer = this.buffers.get(cue); if (!buffer) return false;
    if (priority[cue]) this.stopEffects();
    if (this.active.size >= 4) { const oldest = this.active.keys().next().value!; this.active.delete(oldest); oldest.stop(); }
    try {
      const source = this.context!.createBufferSource(); source.buffer = buffer; source.connect(this.effectsGain!);
      source.onended = () => { this.active.delete(source); source.disconnect(); };
      source.start(); this.active.set(source, cue); this.played.set(cue, now);
      if (!navigation) this.lastActionAt = now;
      return true;
    } catch { return false; }
  }
  reset() { this.stopEffects(); this.played.clear(); this.lastActionAt = -Infinity; }
  private stopEffects() { for (const source of this.active.keys()) source.stop(); this.active.clear(); }
  async setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (!this.context || this.disposed) return;
    try { if (hidden) { this.stopEffects(); await this.context.suspend(); } else await this.activate(); }
    catch { /* The browser may close an audio device while visibility changes. */ }
  }
  async dispose() {
    this.disposed = true; this.reset(); this.musicSource?.stop(); this.musicSource = undefined;
    await this.context?.close().catch(() => {});
  }
}
