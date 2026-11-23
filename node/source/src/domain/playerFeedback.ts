export const FEEDBACK_CUES = ['select','panel','place','move','connect','disconnect','delete','configure','queue','pause','resume','complete','upgrade','unlock','travel','save','reject','attention','victory'] as const;
export type FeedbackCue = typeof FEEDBACK_CUES[number];
export type PlayerFeedback = { type: 'cue'; cue: FeedbackCue } | { type: 'reset' };
