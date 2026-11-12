import { vehiclePayload } from '../content/cartUpgrades';
import { materialTypeName } from '../content/items';
import type { GameState, MachineNode } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { mapNodePosition } from './mapNodePresentation';
import { NodeIcon } from './NodeIcon';

/** One local input or output, with the opposite role on the paired map. */
export function RoadFlowPanel({ node, game, engine, training, onClose }: {
  node: MachineNode; game: GameState; engine: GameEngine; training?: boolean; onClose(): void;
}) {
  const local = game.sectors[game.activeSectorId];
  const remote = node.pairedSectorId ? game.sectors[node.pairedSectorId] : undefined;
  const localPosition = mapNodePosition(local.x, local.y);
  const remotePosition = remote ? mapNodePosition(remote.x, remote.y) : '?';
  const error = engine.getRoadReversalError(node.id);
  const sending = node.roadMode === 'export';
  const source = sending ? localPosition : remotePosition;
  const destination = sending ? remotePosition : localPosition;
  const materials = engine.getRoadTransportStatus(node.id)?.materials ?? [];
  const rate = 12 * vehiclePayload(game.research.completed);

  return <aside className="inspector recipe-picker-panel road-flow-panel glass" aria-label="Road">
    <header className="recipe-picker-header">
      <span><NodeIcon kind={node.kind} node={node} /></span>
      <div><h2>Road</h2></div>
      <button onClick={onClose} aria-label="Close Road">×</button>
    </header>
    <div className="road-flow-content">
      <button type="button" className="road-flow-toggle" aria-pressed={sending}
        aria-label={`Reverse Road flow, currently ${source} to ${destination}`}
        aria-description={error ?? (training ? 'Direction is fixed for this practice route.' : undefined)}
        disabled={Boolean(error || training)} onClick={() => engine.setRoadDirection(node.id, sending ? 'import' : 'export')}>
        <b>{source} → {destination}</b>
      </button>
      <p className="road-flow-material">{materials.length ? materials.map(materialTypeName).join(', ') : 'No material assigned'}</p>
      <p className="road-flow-rate" aria-label={`Transfer rate: ${rate} items per minute`}>{rate} items / minute</p>
    </div>
  </aside>;
}
