import { FEEDBACK_CUES, type FeedbackCue } from '../domain/playerFeedback';
const assets = import.meta.glob<string>('./assets/*.wav', { eager: true, query: '?url', import: 'default' });
export const cueUrls = Object.fromEntries(FEEDBACK_CUES.map(cue => [cue, assets[`./assets/${cue}.wav`]])) as Record<FeedbackCue, string>;
export const musicUrl = assets['./assets/workshop.wav'];
