import { useMemo, useRef, type CSSProperties } from 'react';
import { STAGES } from '../../content/botUpgrades';
import type { GameState } from '../../domain/types';
import { robotArtParts } from './robotArt';
import { robotAssemblyProgress, robotPartProgress, type RobotPart } from './robotAssembly';

const PARTS: RobotPart[] = ['back', 'auxiliary', 'legs', 'arms', 'torso', 'core', 'details', 'face'];
const ART = STAGES.map((_, tier) => robotArtParts(tier));

/** Paid hardware commits immediately; only the pending processing step flashes. */
export function RobotAssemblyArt({ tier, progress = 0, processingProgress, label }: { tier: number; progress?: number; processingProgress?: number; label?: string }) {
  const fraction = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const target = Math.min(tier + 1, STAGES.length - 1);
  const layers = useMemo(() => PARTS.flatMap(part => {
    const phase = robotPartProgress(target, part, fraction);
    const previous = robotPartProgress(tier, part, 1);
    // Preserve part identities across a completed tier's handoff.
    const retired = tier > 0 ? [{ key: `${tier - 1}-${part}`, part, art: ART[tier - 1][part], opacity: 0, x: -previous.x * .25, y: -previous.y * .25, scale: .965 }] : [];
    if (target === tier) return [...retired, { key: `${tier}-${part}`, part, art: ART[tier][part], opacity: 1, x: 0, y: 0, scale: 1 }];
    return [...retired,
      { key: `${tier}-${part}`, part, art: ART[tier][part], opacity: 1 - phase.fraction, x: -phase.x * phase.fraction * .25, y: -phase.y * phase.fraction * .25, scale: 1 - phase.fraction * .035 },
      { key: `${target}-${part}`, part, art: ART[target][part], opacity: phase.fraction, x: phase.x * (1 - phase.fraction), y: phase.y * (1 - phase.fraction), scale: .94 + phase.fraction * .06 },
    ];
  }), [tier, target, fraction]);
  const pending = Number.isFinite(processingProgress) && target !== tier ? Math.min(1, Math.max(fraction, processingProgress!)) : fraction;
  const processing = pending > fraction;
  return <div className="robot-portrait robot-assembly" data-robot-tier={tier} data-assembly-progress={fraction} data-assembly-processing={processing || undefined}>
    <svg viewBox="0 0 320 350" role="img" aria-label={label ?? `${STAGES[target === tier || fraction === 0 ? tier : target].role} robot assembly`}>
      <g strokeLinejoin="round" strokeLinecap="round">
        <g dangerouslySetInnerHTML={{ __html: ART[tier].floor }} />
        {PARTS.map(part => {
          const phase = robotPartProgress(target, part, pending);
          const changed = processing && phase.fraction > robotPartProgress(target, part, fraction).fraction;
          return <g key={part} data-assembly-section={part}>
            <g className={changed ? 'robot-processing-committed' : undefined}>
              {layers.filter(layer => layer.part === part).map(layer => <g key={layer.key} className="robot-assembly-part" data-robot-part={layer.key}
                style={{ opacity: layer.opacity, transform: `translate(${layer.x}px, ${layer.y}px) scale(${layer.scale})` } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: layer.art }} />)}
            </g>
            {changed && <g className="robot-processing-preview" aria-hidden="true">
              <g opacity={1 - phase.fraction} dangerouslySetInnerHTML={{ __html: ART[tier][part] }} />
              <g opacity={phase.fraction} dangerouslySetInnerHTML={{ __html: ART[target][part] }} />
            </g>}
          </g>;
        })}
      </g>
    </svg>
  </div>;
}

export function RobotPortrait({ game }: { game: GameState }) {
  const { tier, progress, processingProgress, label } = robotAssemblyProgress(game);
  const identity = useRef({ game, key: 0 });
  if (identity.current.game !== game) identity.current = { game, key: identity.current.key + 1 };
  // A replaced factory mounts its exact paid state instead of replaying the prior factory's motion.
  return <RobotAssemblyArt key={identity.current.key} tier={tier} progress={progress} processingProgress={processingProgress} label={label} />;
}
