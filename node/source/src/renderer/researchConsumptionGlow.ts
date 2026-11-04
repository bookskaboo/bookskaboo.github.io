import type { MachineNode } from '../domain/types';

/** Renew the existing blue completion pulse for one full successful research cycle. */
export function researchConsumptionGlow(node: MachineNode, simulationTimeMs: number, reducedMotion = false) {
  const consumed = node.researchConsumption;
  if (!consumed || node.disabled || node.processingPaused) return 0;
  const elapsed = simulationTimeMs - consumed.atMs;
  if (elapsed < 0 || elapsed >= consumed.cycleMs) return 0;
  // Keep successful-check feedback visible without pulsing when reduced motion is requested.
  return reducedMotion ? .45 : Math.sin(Math.PI * (elapsed % 480) / 480);
}
