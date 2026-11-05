import type { MachineNode } from '../domain/types';
import { GOBLIN_CHECK_INTERVAL_MS, getGoblinAttackRequirement } from '../content/goblinSettlements';
import { attackPower } from './progression';

/** Current stock and last completed check are deliberately separate facts. */
export function campStatus(node: MachineNode, interpolationMs = 0) {
  const elapsed = Math.max(0, Math.min(GOBLIN_CHECK_INTERVAL_MS, node.progressMs + Math.max(0, interpolationMs)));
  const suppliedAp = attackPower(node) + (node.lizardSettlement ? node.suppressionCredit ?? 0 : 0);
  const requiredAp = getGoblinAttackRequirement(node);
  const result = node.campLastCheck ? node.campLastCheck.passed ? 'passed' : 'failed' : 'pending';
  const secondsRemaining = Math.ceil((GOBLIN_CHECK_INTERVAL_MS - elapsed) / 1000);
  return { suppliedAp, requiredAp, result, fraction: elapsed / GOBLIN_CHECK_INTERVAL_MS, secondsRemaining,
    color: result === 'passed' ? 0x65e69b : result === 'failed' ? 0xff6878 : 0xc7cdd2,
    apLabel: `AP ${suppliedAp} / ${requiredAp}`,
    checkLabel: `${result === 'pending' ? 'FIRST CHECK' : result === 'passed' ? 'PASSED' : 'FAILED'} · ${secondsRemaining}s`,
  };
}
