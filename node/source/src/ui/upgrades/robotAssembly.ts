import { characterStage, nextBotUpgrade, STAGES } from '../../content/botUpgrades';
import { getResearchProject } from '../../content/research';
import type { GameState } from '../../domain/types';
import { researchProgress } from '../researchProgress';
import { isResearchCycleActive } from '../../simulation/researchStatus';
import type { robotArtParts } from './robotArt';

export type RobotPart = Exclude<keyof ReturnType<typeof robotArtParts>, 'floor'>;
type Phase = { part: RobotPart; start: number; end: number; x: number; y: number };
const phase = (part: RobotPart, start: number, end: number, x = 0, y = 0): Phase => ({ part, start, end, x, y });
// Each row builds the actual next chassis in a distinct mechanical order.
export const ROBOT_ASSEMBLIES = [
  { description: 'Seat the legs, close the rounded chest, fit the manipulators, then power the Core.',
    phases: [phase('legs', 0, .2, 0, 18), phase('torso', .2, .4, 0, -18), phase('arms', .4, .6, -22, 0), phase('back', .6, .8, 0, -18)] },
  { description: 'Brace the heavy legs, widen the chest and shoulders, then bring the reinforced hands online.',
    phases: [phase('legs', 0, .2, 0, 18), phase('torso', .2, .4, 0, -14), phase('arms', .4, .6, -30, 0), phase('back', .6, .8, 0, -14)] },
  { description: 'Extend the stance, fit the tapered chassis, deploy the extra tool arms and raise the sensor mast.',
    phases: [phase('legs', 0, .2, 0, 16), phase('torso', .2, .4, 0, -18), phase('arms', .4, .6, -24, 8), phase('auxiliary', .6, .8, -28, -16), phase('back', .6, .8, 0, 24)] },
  { description: 'Seal the chassis, fit the working arms, seat the coolant tanks and connect their hoses.',
    phases: [phase('legs', 0, .2, 0, 16), phase('torso', .2, .4, 0, -18), phase('arms', .4, .6, -24, 0), phase('back', .6, .8, -24, -8), phase('auxiliary', .4, .6, -18, -10)] },
  { description: 'Fit the angular legs and Mythril chest, sweep in the armored shoulders and lock the plates in place.',
    phases: [phase('legs', 0, .2, -10, 16), phase('torso', .2, .4, 0, -18), phase('arms', .4, .6, -24, -18), phase('back', .6, .8, -18, -22), phase('auxiliary', .6, .8, -24, 0)] },
  { description: 'Raise the processor fins, seat the chest, spread the tool arms and brace the wider stance.',
    phases: [phase('back', 0, .2, 0, 30), phase('torso', .2, .4, 0, -16), phase('arms', .4, .6, -28, -8), phase('legs', .6, .8, -12, 16), phase('auxiliary', .4, .6, -28, -16)] },
  { description: 'Assemble the orbital frame and crown, widen the stabilizers, fit the final chassis and light all seven Cores.',
    phases: [phase('back', 0, .2, 0, -28), phase('legs', .2, .4, -14, 18), phase('torso', .4, .6, 0, -20), phase('arms', .6, .8, -30, -12), phase('auxiliary', .6, .8, -24, -18)] },
] as const;

export function robotPartProgress(targetTier: number, part: RobotPart, progress: number) {
  const timing = ROBOT_ASSEMBLIES[targetTier - 1]?.phases.find(entry => entry.part === part)
    ?? phase(part, part === 'details' ? .6 : .8, 1);
  const fraction = Math.max(0, Math.min(1, (progress - timing.start) / (timing.end - timing.start)));
  return { fraction, x: timing.x, y: timing.y };
}

/** Paid hardware is permanent; an active cycle previews only its next synchronized set. */
export function robotAssemblyProgress(game: GameState) {
  const tier = characterStage(game), upgrade = nextBotUpgrade(game);
  const project = upgrade && getResearchProject(upgrade.id);
  if (!project) return { tier, progress: 0, processingProgress: undefined, label: `${STAGES[tier].role} (${STAGES[tier].label} AI bot)` };
  const { rows, active } = researchProgress(project, game);
  const total = rows.reduce((sum, row) => sum + row.required, 0);
  const paid = rows.reduce((sum, row) => sum + row.researched, 0);
  const progress = total > 0 ? paid / total : 0;
  const processing = total > paid && active && !game.paused && !game.research.paused && Object.values(game.sectors)
    .filter(sector => sector.unlocked).some(sector => sector.nodes.some(node => node.kind === 'researchCenter'
      && node.progressMs > 0 && Date.now() - node.constructedAt >= node.constructionMs && isResearchCycleActive(node, game.research)));
  const processingProgress = processing ? Math.min(1, (paid + rows.filter(row => row.remaining > 0).length) / total) : undefined;
  const label = `${STAGES[tier].role} (${STAGES[tier].label} AI bot)${progress > 0 ? `; ${Math.round(progress * 100)}% assembled toward ${STAGES[tier + 1].role}` : ''}${processing ? '; next assembly step processing' : ''}`;
  return { tier, progress, processingProgress, label };
}
