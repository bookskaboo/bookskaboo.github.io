import type { SectorState } from '../domain/types';
import { getNodeModule } from '../content/nodeModules';

/** Keep protected/Landmark eligibility and incident-cable selection outside the mutation boundary. */
export function planNodeDeletion(sector: SectorState, ids: readonly string[]) {
  const deletable = sector.nodes.filter((n) => !n.landmark && ids.includes(n.id) && !n.protected && getNodeModule(n.kind).controls.deletable).map((n) => n.id);
  if (!deletable.length) return;
  const removedConnectionIds = new Set(sector.connections.filter((connection) => deletable.includes(connection.from) || deletable.includes(connection.to)).map((connection) => connection.id));
  return { sector, deletable, removedConnectionIds };
}
