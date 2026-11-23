import audioData from '../../outputs/action-sounds/audio-data.json';
import ambientData from '../../outputs/music/quiet-workshop-ambient-strings/audio-data.json';

export type CueId = keyof typeof audioData;
const cooldowns: Partial<Record<CueId, number>> = { select: 80, 'select-low': 80, reject: 500, attention: 3000, complete: 400, travel: 250 };
const milestones = new Set<CueId>(['complete', 'upgrade', 'victory', 'attention']);
const priority: Partial<Record<CueId, number>> = { complete: 2, attention: 3, upgrade: 4, victory: 5 };

/** Preview-only mixer. No production hooks, saved preferences or storage. */
export class PreviewAudio {
  private context?: AudioContext;
  private gain?: GainNode;
  private musicGain?: GainNode;
  private musicBuffer?: AudioBuffer;
  private musicSource?: AudioBufferSourceNode;
  private buffers = new Map<CueId, AudioBuffer>();
  private active = new Map<AudioBufferSourceNode, CueId>();
  private played = new Map<CueId, number>();
  enabled = false;
  muted = false;
  volume = .3;
  music = true;
  musicVolume = .15;
  optional = false;
  lowSelect = false;
  onPlayed?: (cue: CueId) => void;

  async enable() {
    this.context ??= new AudioContext();
    if (!this.gain) { this.gain = this.context.createGain(); this.gain.connect(this.context.destination); }
    if (!this.musicGain) { this.musicGain = this.context.createGain(); this.musicGain.connect(this.context.destination); }
    await this.context.resume();
    await Promise.all([...Object.entries(audioData).map(async ([id, uri]) => {
      if (this.buffers.has(id as CueId)) return;
      const bytes = Uint8Array.from(atob(uri.split(',')[1]), char => char.charCodeAt(0));
      this.buffers.set(id as CueId, await this.context!.decodeAudioData(bytes.buffer));
    }), (async () => {
      if (this.musicBuffer) return;
      const binary = atob(ambientData.uri.split(',')[1]), bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      this.musicBuffer = await this.context!.decodeAudioData(bytes.buffer);
    })()]);
    this.enabled = true; this.update();
  }
  update() {
    if (this.gain) this.gain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.context!.currentTime);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(this.muted ? 0 : this.musicVolume, this.context!.currentTime);
    if (!this.music) this.stopMusic();
    else if (this.enabled && !document.hidden && !this.musicSource && this.musicBuffer) {
      const source = this.context!.createBufferSource();
      source.buffer = this.musicBuffer; source.loop = true; source.loopStart = 0; source.loopEnd = this.musicBuffer.duration;
      source.connect(this.musicGain!); this.musicSource = source;
      source.onended = () => { source.disconnect(); if (this.musicSource === source) this.musicSource = undefined; };
      source.start();
    }
  }
  private stopMusic() { const source = this.musicSource; this.musicSource = undefined; source?.stop(); }
  async setHidden(hidden: boolean) {
    if (!this.context) return;
    if (hidden) { this.stop(); await this.context.suspend(); }
    else if (this.enabled) { await this.context.resume(); this.update(); }
  }
  play(requested: CueId, optional = false) {
    if (!this.enabled || this.muted || document.hidden || (optional && !this.optional)) return false;
    const cue = requested === 'select' && this.lowSelect ? 'select-low' : requested;
    const now = performance.now();
    if (now - (this.played.get(cue) ?? -Infinity) < (cooldowns[cue] ?? 100)) return false;
    if (!milestones.has(cue) && [...this.active.values()].some(id => milestones.has(id))) return false;
    if ([...this.active.values()].some(id => (priority[id] ?? 0) > (priority[cue] ?? 0))) return false;
    if (milestones.has(cue)) this.stop();
    if (this.active.size >= 4) { const oldest = this.active.keys().next().value!; this.active.delete(oldest); oldest.stop(); }
    const buffer = this.buffers.get(cue); if (!buffer) return false;
    void this.context!.resume();
    const source = this.context!.createBufferSource();
    source.buffer = buffer; source.connect(this.gain!); this.active.set(source, cue);
    source.onended = () => { this.active.delete(source); source.disconnect(); };
    this.played.set(cue, now); source.start(); this.onPlayed?.(cue); return true;
  }
  stop() { for (const source of this.active.keys()) source.stop(); this.active.clear(); }
  async dispose() { this.enabled = false; this.stop(); this.stopMusic(); await this.context?.close(); }
}
