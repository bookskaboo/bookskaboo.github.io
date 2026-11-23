export interface AudioPreferences { effectsVolume: number; musicVolume: number; effectsMuted: boolean; musicMuted: boolean }
export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> = { effectsVolume: 50, musicVolume: 50, effectsMuted: false, musicMuted: false };
const level = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
export function audioPreferences(value: Partial<AudioPreferences> = {}): AudioPreferences {
  return { effectsVolume: level(value.effectsVolume), musicVolume: level(value.musicVolume), effectsMuted: value.effectsMuted === true, musicMuted: value.musicMuted === true };
}
/** Midpoint matches the approved 30% effects / 15% music audition gains. */
export function audioGains(value: AudioPreferences) {
  return { effects: value.effectsMuted ? 0 : value.effectsVolume * .006, music: value.musicMuted ? 0 : value.musicVolume * .003 };
}
