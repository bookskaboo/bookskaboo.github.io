import type { GameState, MachineNode, SectorState } from '../domain/types';
import { hasNodeBehavior } from '../content/nodeCapabilities';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { getNodeSize } from '../domain/nodeGeometry';
import { borderCrossingFailure } from '../domain/borderObstructionLayout';
import { usesNewWorldRules } from './worldRules';
import { getWorldFieldSize } from './worldGeneration';
import { roadPairLayoutForField } from './roadPlacement';
import { canPlaceNode } from './collisions';
import { connectionBlockedByWorld } from './connectionRules';

/** Resolves paired movement and validates proposals without committing or checkpointing them. */
export class NodeMovementPlanner {
  constructor(private readonly getState: () => GameState, private readonly getSector: () => SectorState) {}
  private get state() { return this.getState(); }

  private movedCablesBlocked(sector: SectorState, proposedById: Map<string, MachineNode>) {
    const nodes = sector.nodes.map(node => proposedById.get(node.id) ?? node);
    const byId = new Map(nodes.map(node => [node.id, node]));
    return sector.connections.some(connection => {
      if (!proposedById.has(connection.from) && !proposedById.has(connection.to)) return false;
      const source = byId.get(connection.from), target = byId.get(connection.to);
      return Boolean(source && target && connectionBlockedByWorld(source, target, { fromPort: connection.fromPort ?? 0, toPort: connection.toPort ?? 0 }, nodes));
    });
  }

  roadPairLayout(sector: SectorState, node: MachineNode, point: { x: number; y: number }) {
    return roadPairLayoutForField(this.state,sector,node,point,getWorldFieldSize(this.state));
  }

  private planRoadMove(sector: SectorState, node: MachineNode, point: { x: number; y: number }) {
    const layout = this.roadPairLayout(sector, node, point);
    if (!layout) return;
    const { node: proposed, road, pair } = layout;
    const neighbor = road.sector, endpoint = road.endpoint, field = getWorldFieldSize(this.state);
    const valid = !borderCrossingFailure(this.state, sector.id, neighbor.id) && canPlaceNode(proposed, sector.nodes, field) && canPlaceNode(endpoint, neighbor.nodes, field)
      && !this.movedCablesBlocked(sector, new Map([[node.id, proposed]]))
      && !this.movedCablesBlocked(neighbor, new Map([[pair.id, endpoint]]));
    return { ...layout, valid };
  }

  getRoadMovePreview(id: string, point: { x: number; y: number }) {
    const sector = this.getSector();
    const node = sector.nodes.find(candidate => candidate.id === id && hasNodeBehavior(candidate.kind, 'road'));
    const plan = node && this.planRoadMove(sector, node, point);
    return plan && { node: plan.node, road: plan.road, valid: plan.valid };
  }

  planMove(positions: Record<string, { x: number; y: number }>) {
    const sector = this.getSector();
    positions={...positions};
    if(this.state.research.completed.includes('campRelocation'))for(const camp of sector.nodes.filter(n=>n.kind==='monster-camp')) {
      const box=sector.nodes.find(n=>usesNewWorldRules(this.state)?n.guardedCampId===camp.id:n.kind==='goblinTribute'&&n.tributeCampId===camp.id);
      if(!box||(!positions[camp.id]&&!positions[box.id]))continue;
      const anchor=positions[camp.id]?camp:box, point=positions[anchor.id];
      const dx=point.x-anchor.x,dy=point.y-anchor.y;
      for(const member of [camp,box]) {const next={x:member.x+dx,y:member.y+dy};if(positions[member.id]&&(Math.abs(positions[member.id].x-next.x)>1e-7||Math.abs(positions[member.id].y-next.y)>1e-7))return;positions[member.id]=next;}
    }
    if (usesNewWorldRules(this.state) && this.state.research.completed.includes('lakeRelocation')) {
      for (const lake of sector.nodes.filter(n => n.kind === 'lake' && positions[n.id])) {
        const dx = positions[lake.id].x - lake.x, dy = positions[lake.id].y - lake.y;
        const attached = new Set(sector.connections.filter(c => c.from === lake.id).map(c => c.to));
        for (const intake of sector.nodes.filter(n => n.kind === 'fluidLink' && attached.has(n.id))) {
          const next = { x: intake.x + dx, y: intake.y + dy };
          if (positions[intake.id] && (Math.abs(positions[intake.id].x-next.x)>1e-7 || Math.abs(positions[intake.id].y-next.y)>1e-7)) return;
          positions[intake.id] = next;
        }
      }
    }
    const selected = sector.nodes.filter((node) => positions[node.id] && isPlayerMovableNode(node.kind,this.state,node));
    if (!selected.length) return;
    if (selected.some(node => hasNodeBehavior(node.kind, 'road'))) {
      if (selected.length !== 1) return;
      const node = selected[0];
      const plan = this.planRoadMove(sector, node, positions[node.id]);
      if (!plan?.valid) return;
      return { kind: 'road' as const, sector, node, plan };
    }
    const field = getWorldFieldSize(this.state);
    const ignored = new Set(selected.map((node) => node.id));
    const proposals = selected.map((node) => ({ node, proposed: { ...node, ...positions[node.id] } }));
    if (!selected.some(n=>!getNodeModule(n.kind).controls.movable)) {
      const minimumShiftX = Math.max(...proposals.map(({ proposed }) => getNodeSize(proposed).w / 2 + 12 - proposed.x));
      const maximumShiftX = Math.min(...proposals.map(({ proposed }) => field.width - getNodeSize(proposed).w / 2 - 12 - proposed.x));
      const minimumShiftY = Math.max(...proposals.map(({ proposed }) => getNodeSize(proposed).h / 2 + 52 - proposed.y));
      const maximumShiftY = Math.min(...proposals.map(({ proposed }) => field.height - getNodeSize(proposed).h / 2 - 12 - proposed.y));
      const shiftX = Math.max(minimumShiftX, Math.min(maximumShiftX, 0)); const shiftY = Math.max(minimumShiftY, Math.min(maximumShiftY, 0));
      proposals.forEach(({ proposed }) => { proposed.x += shiftX; proposed.y += shiftY; });
    }
    if (proposals.some(({ proposed }) => !canPlaceNode(proposed, [...sector.nodes.filter(n=>!ignored.has(n.id)),...proposals.map(p=>p.proposed)], field))) return;
    const proposedById = new Map(proposals.map(({ proposed }) => [proposed.id, proposed]));
    if (this.movedCablesBlocked(sector, proposedById)) return;
    return { kind: 'nodes' as const, sector, selected, proposals };
  }
}
