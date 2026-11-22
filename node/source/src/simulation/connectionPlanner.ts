import type { Connection, GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, needsRecipeSelection } from '../content/nodeCapabilities';
import { isCartKind } from '../content/cartUpgrades';
import { ITEM_NAMES } from '../content/items';
import { guardedResourceAccessible, lakeIntakeLimit, usesNewWorldRules } from './worldRules';
import { connectionLimit } from './progression';
import { cablesUnderNode } from './cableInsertion';
import { roadConnectionError } from './roadMaterials';
import { routedConnectionFailure } from './connectionMaterials';
import { connectionBlockedByWorld, connectionObstruction, inputPortAcceptsItem, portFamilyAcceptsItem,
  portFamiliesCompatible, resolveConnectionPlan, resolveExactConnectionPlan, roadVehicleError } from './connectionRules';

/** Read-only connection plans preserve command and explanation validation order separately. */
export class ConnectionPlanner {
  constructor(private readonly getState: () => GameState, private readonly getSector: () => SectorState) {}
  private get state() { return this.getState(); }

  planAutomaticConnection(from: string, to: string) {
    if (from === to) return;
    const sector = this.getSector();
    const sourceNode = sector.nodes.find((node) => node.id === from);
    const targetNode = sector.nodes.find((node) => node.id === to);
    if (!sourceNode || !targetNode) return;
    if(!this.canAddProgressionConnection(sourceNode,targetNode,sector.connections))return;
    const plan = resolveConnectionPlan(sourceNode, targetNode, sector.connections, this.state.research.completed, plan => !routedConnectionFailure({ from, to, fromPort: plan.fromPort, toPort: plan.toPort }, sector.nodes, sector.connections, this.state.research.completed, new Set(plan.replace)));
    if (!plan || connectionBlockedByWorld(sourceNode, targetNode, plan, sector.nodes)) return;
    return { fromPort: plan.fromPort, toPort: plan.toPort };
  }

  planConnection(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string) {
    if (from === to) return;
    const sector = this.getSector();
    const sourceNode = sector.nodes.find((node) => node.id === from);
    const targetNode = sector.nodes.find((node) => node.id === to);
    if (!sourceNode || !targetNode) return;
    const validationConnections = replaceConnectionId
      ? sector.connections.filter((connection) => connection.id !== replaceConnectionId)
      : sector.connections;
    if(!this.canAddProgressionConnection(sourceNode,targetNode,validationConnections))return;
    const plan = resolveExactConnectionPlan(sourceNode, fromPort, targetNode, toPort, validationConnections, this.state.research.completed);
    if (!plan || connectionBlockedByWorld(sourceNode, targetNode, plan, sector.nodes)) return;
    const replaced = new Set([...plan.replace, ...(replaceConnectionId ? [replaceConnectionId] : [])]);
    if (routedConnectionFailure({ from, to, fromPort, toPort }, sector.nodes, sector.connections, this.state.research.completed, replaced)) return;
    if (roadConnectionError(this.state, sector, { id: '__road-validation', from, to, fromPort, toPort, createdAt: 0 }, replaced)) return;
    return { sector, sourceNode, replaced };
  }

  getRoadConnectionError(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string) {
    const sector = this.getSector();
    const source = sector.nodes.find(n => n.id === from), target = sector.nodes.find(n => n.id === to);
    if (!source || !target) return;
    const vehicleError = roadVehicleError(source, target);
    if (vehicleError) return vehicleError;
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, sector.connections.filter(c => c.id !== replaceConnectionId), this.state.research.completed);
    if (!plan) return;
    return roadConnectionError(this.state, sector, { id: '__road-validation', from, to, fromPort, toPort, createdAt: 0 }, new Set([...plan.replace, ...(replaceConnectionId ? [replaceConnectionId] : [])]));
  }

  getConnectionFailure(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string): { title: string; detail: string } | undefined {
    const sector = this.getSector();
    const source = sector.nodes.find(n => n.id === from), target = sector.nodes.find(n => n.id === to);
    if (!source || !target) return { title: 'Socket unavailable', detail: 'Choose an output and an input on existing nodes.' };
    if (source === target) return { title: 'Choose another node', detail: 'A cable must connect two different nodes.' };
    if (source.disabled || target.disabled) return { title: 'Node disabled', detail: 'Enable both nodes before connecting them.' };
    if (source.guardedCampId && !guardedResourceAccessible(source, sector.nodes)) return { title: 'Deposit guarded', detail: 'Fully suppress the linked settlement before connecting extraction.' };
    if (source.kind === 'lake' && usesNewWorldRules(this.state) && target.kind !== 'fluidLink') return { title: 'Lake Intake required', detail: 'Connect the Lake to a Lake Intake, then route its Water to the factory.' };
    const vehicleError = roadVehicleError(source, target);
    if (vehicleError) return { title: 'Freight vehicle required', detail: vehicleError };
    const unconfigured = [source, target].find(needsRecipeSelection);
    if (unconfigured && source.kind !== 'devSource') return { title: 'Choose a recipe first', detail: `${unconfigured.name} needs a recipe before it can be connected. Left-click it and choose a recipe.` };
    if ((hasNodeBehavior(source.kind, 'resource') || source.infiniteResource) && !hasNodeBehavior(target.kind, 'extractor') && !getNodeCapabilities(target.kind).passThrough) return { title: 'Extractor required', detail: 'Connect the resource to an Extractor, then connect the Extractor output to this machine.' };
    if (!portFamiliesCompatible(source, fromPort, target, toPort, this.state.research.completed)) {
      if (isCartKind(target.kind)) return { title: 'Solid items only', detail: `${target.name} cannot store fluids. Use the appropriate fluid or waste storage instead.` };
      const family = getEffectiveNodeInputFamilies(target, this.state.research.completed)[toPort];
      const name = family && family in ITEM_NAMES ? ITEM_NAMES[family as ItemId] : family ?? 'a compatible material';
      return { title: 'Incompatible socket', detail: `${target.name}'s selected input requires ${name}. Choose the matching output and input, or use a Filter to select a material.` };
    }
    const connections = sector.connections.filter(c => c.id !== replaceConnectionId);
    if (!this.canAddProgressionConnection(source, target, connections)) return { title: 'Connection limit reached', detail: 'This node has reached its researched connection limit. Remove a connection or research more capacity.' };
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, connections, this.state.research.completed);
    if (!plan) return { title: 'Connection unavailable', detail: 'These sockets are already connected or the receiving Merger holds a different material. Drain that material or choose another socket.' };
    const materialFailure = routedConnectionFailure({ from, to, fromPort, toPort }, sector.nodes, connections, this.state.research.completed, new Set(plan.replace));
    if (materialFailure) return materialFailure;
    const obstruction = connectionObstruction(source, target, plan, sector.nodes);
    if (obstruction) return { title: `Blocked by ${obstruction.name}`, detail: `The cable crosses ${obstruction.name} on map ${sector.id}. Route it around the obstruction using Joints, allowing clearance outside its border.` };
    const road = this.getRoadConnectionError(from, fromPort, to, toPort, replaceConnectionId);
    return road ? { title: 'Road connection blocked', detail: road } : undefined;
  }

  getCableInsertionPreview(node: MachineNode): { replacedConnectionId: string; connections: [Connection, Connection] } | undefined {
    if (!getNodeCapabilities(node.kind).passThrough || node.disabled) return undefined;
    const sector = this.getSector();
    for (const old of cablesUnderNode(node, sector)) {
      const from = sector.nodes.find(candidate => candidate.id === old.from), to = sector.nodes.find(candidate => candidate.id === old.to);
      if (!from || !to) continue;
      const remaining = sector.connections.filter(candidate => candidate.id !== old.id);
      for (let input = 0; input < getEffectiveNodeInputFamilies(node, this.state.research.completed).length; input++) {
        const first = resolveExactConnectionPlan(from, old.fromPort ?? 0, node, input, remaining, this.state.research.completed);
        if (!first || first.replace.length || connectionBlockedByWorld(from, node, first, sector.nodes)) continue;
        for (let output = 0; output < getEffectiveNodeOutputFamilies(node).length; output++) {
          const second = resolveExactConnectionPlan(node, output, to, old.toPort ?? 0, remaining, this.state.research.completed);
          if (!second || second.replace.length || connectionBlockedByWorld(node, to, second, sector.nodes)) continue;
          if (old.item && (!inputPortAcceptsItem(node, input, old.item, this.state.research.completed) || !portFamilyAcceptsItem(getEffectiveNodeOutputFamilies(node)[output], old.item))) continue;
          const firstCable: Connection = { ...old, id: `__insert-in-${node.id}`, to: node.id, toPort: input, createdAt: Date.now() };
          const secondCable: Connection = { ...old, id: `__insert-out-${node.id}`, from: node.id, fromPort: output, createdAt: Date.now() };
          const previewNodes = [...sector.nodes.filter(candidate => candidate.id !== node.id), node];
          if (routedConnectionFailure(secondCable, previewNodes, [...remaining, firstCable], this.state.research.completed, new Set())) continue;
          return { replacedConnectionId: old.id, connections: [firstCable, secondCable] };

        }
      }
    }
    return undefined;
  }

  private canAddProgressionConnection(source:MachineNode,target:MachineNode,connections:Connection[]){
    if(source.kind==='devSource')return true;
    if (source.kind === 'lake' && target.kind === 'fluidLink') {
      const connectedPumps = connections.filter(cable => cable.from === source.id && cable.to !== target.id &&
        this.getSector().nodes.some(node => node.id === cable.to && node.kind === 'fluidLink'));
      if (new Set(connectedPumps.map(c => c.to)).size >= lakeIntakeLimit(this.state)) return false;
    }
    if(source.kind==='inventory'&&connections.filter(c=>c.from===source.id).length>=connectionLimit(this.state,'inventory'))return false;
    if(target.kind==='storage'&&connections.filter(c=>c.to===target.id).length>=connectionLimit(this.state,'storage'))return false;
    return true;
  }
}
