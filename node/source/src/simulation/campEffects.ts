import { isResourceBehavior, isWorldObstacle } from '../content/nodeCapabilities';
import { footprintsOverlap } from '../domain/obstructionGeometry';
import type { MachineNode } from '../domain/types';

/** Camp influence is the union of their visible polygons, against whole node bodies. */
export function updateCampEncroachment(nodes: readonly MachineNode[]) {
  const camps = nodes.filter(node => node.kind === 'monster-camp');
  if (!camps.length) return;
  for (const node of nodes) {
    if (isResourceBehavior(node.kind)) continue;
    if (isWorldObstacle(node.kind)) { node.disabled = false; continue; }
    node.disabled = camps.some(camp => footprintsOverlap(camp, node));
  }
}
