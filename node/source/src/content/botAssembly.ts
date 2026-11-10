import type { ItemId, Recipe } from '../domain/types';

export type BotTier = 1 | 2 | 3 | 4 | 5;
export type MixedBotId = { [Tier in BotTier]: `bot-f${Tier}-g${Exclude<BotTier, Tier>}` }[BotTier];

export const BOT_FRAMES = ['simple-robot-frame', 'sealed-frame', 'mithril-frame', 'servo-frame', 'final-frame'] as const;
export const BOT_GUNS = ['simple-robot-gun', 'cooled-gun', 'focused-gun', 'pulse-cannon', 'final-cannon'] as const;
export const MATCHED_BOTS = ['suppression-bot', 'medium-suppression-bot', 'heavy-suppression-bot', 'command-suppression-bot', 'final-suppression-bot'] as const;
const BOT_RESEARCH = ['suppressionBot', 'sealedRobotics', 'heavyRobotics', 'commandRobotics', 'finalRobotics'];
const CYCLE_MS = [10000, 20000, 40000, 90000, 210000];
const FRAME_RATING_TENTHS = [10, 20, 32, 48, 72];
const GUN_MULTIPLIER_HALVES = [2, 3, 5, 10, 20];

const botPairs = BOT_FRAMES.flatMap((frame, frameIndex) => BOT_GUNS.map((gun, gunIndex) => ({
  frame, gun, frameTier: frameIndex + 1, gunTier: gunIndex + 1,
  tier: Math.max(frameIndex, gunIndex) + 1,
  legacyId: frameIndex === gunIndex ? MATCHED_BOTS[frameIndex] : `bot-f${frameIndex + 1}-g${gunIndex + 1}` as MixedBotId,
  ap: Math.floor((FRAME_RATING_TENTHS[frameIndex] * GUN_MULTIPLIER_HALVES[gunIndex] + 10) / 20),
})));

export const BOT_STRENGTH: Partial<Record<ItemId, number>> = Object.fromEntries(botPairs.map(({ legacyId, ap }) => [legacyId, ap]));
export const BOT_ITEMS = botPairs.map(({ legacyId }) => legacyId);
const botByPower = new Map(botPairs.map(({ legacyId, ap }) => [ap, legacyId]));
for (const item of MATCHED_BOTS) botByPower.set(BOT_STRENGTH[item]!, item);

export const SUPPRESSION_BOT = 'suppression-bot' as const;
export const SUPPRESSION_BOT_NAME = 'Suppression Bot';

/** Bags store one bucket per AP value. Logistics compares the common material. */
export const cargoMaterial = (item: ItemId): ItemId => BOT_STRENGTH[item] === undefined ? item : SUPPRESSION_BOT;
export const botName = (ap: number) => `${SUPPRESSION_BOT_NAME} ${ap} AP`;

export const BOT_BUILDS = botPairs.map(pair => {
  const { frame, gun, frameTier, gunTier, tier, ap } = pair;
  const item = botByPower.get(ap)!;
  const recipe: Recipe = {
    id: `assemble-bot-f${frameTier}-g${gunTier}`,
    name: botName(ap),
    inputs: { [frame]: 1, [gun]: 1 },
    outputs: { [item]: 1 },
    cycleMs: CYCLE_MS[tier - 1],
    unlockResearch: BOT_RESEARCH[tier - 1],
  };
  return { ...pair, item, recipe };
});

export const BOT_BUILD_BY_ID = new Map(BOT_BUILDS.map(build => [build.recipe.id, build]));
export const FINAL_BOT_AP = BOT_BUILDS.find(build => build.item === 'final-suppression-bot')!.ap;

export const FINAL_BOT_PARTS: Record<'final-frame' | 'final-cannon', Recipe> = {
  'final-frame': {
    id: 'final-frame', name: 'Final Frame', inputs: { 'servo-frame': 3, 'advanced-actuator': 2, brick: 1 },
    outputs: { 'final-frame': 1 }, cycleMs: 45000, unlockResearch: 'finalRobotics',
  },
  'final-cannon': {
    id: 'final-cannon', name: 'Final Cannon', inputs: { 'pulse-cannon': 2, 'precision-controller': 2, 'logic-substrate': 2 },
    outputs: { 'final-cannon': 1 }, cycleMs: 45000, unlockResearch: 'finalRobotics',
  },
};
