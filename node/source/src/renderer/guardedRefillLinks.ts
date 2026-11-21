import { Container, Graphics, type Text } from 'pixi.js';
import type { MachineNode, SectorState } from '../domain/types';
import { getNodeSize, type Point } from '../domain/nodeGeometry';
import { ITEM_COLORS } from '../content/items';
import { guardedResourceAccessible } from '../simulation/worldRules';
import { guardedRefillReceipt, type GuardedRefillReceipt } from '../simulation/guardedResources';
import { getConnectionControlPoints } from '../simulation/connectionRules';
import { drawCurve, label } from './playfieldDrawing';
import { THEME } from './playfieldTheme';

export function guardedRefillEndpoints(camp: MachineNode, deposit: MachineNode, positions?: Record<string, Point>) {
  const source = positions?.[camp.id] ?? camp, target = positions?.[deposit.id] ?? deposit;
  return { start: { x: source.x + 64, y: source.y }, end: { x: target.x - getNodeSize(deposit).w / 2, y: target.y } };
}

interface RefillView {
  camp: MachineNode; deposit: MachineNode; root: Container; line: Graphics; source: Graphics; target: Graphics;
  packet: Container; quantity: Text; pulse: Graphics; key?: string; elapsed: number; amount: number;
  receipt?: GuardedRefillReceipt;
}

/** System-owned reserve feed. These sockets never enter the player port registry. */
export class GuardedRefillLinks {
  private views = new Map<string, RefillView>();
  private sector?: SectorState;
  private lastFrame?: number;
  constructor(private layer: Container) { layer.eventMode = 'none'; layer.interactiveChildren = false; }

  clear() {
    this.views.forEach(view => view.root.destroy({ children: true }));
    this.views.clear(); this.sector = undefined; this.lastFrame = undefined;
  }

  sync(sector: SectorState) {
    if (this.sector !== sector) { this.clear(); this.sector = sector; }
    const nodes = new Map(sector.nodes.map(node => [node.id, node])), keep = new Set<string>();
    for (const deposit of sector.nodes) {
      const camp = deposit.guardedCampId && nodes.get(deposit.guardedCampId);
      if (!camp || !deposit.resourceItem || !guardedResourceAccessible(deposit, sector.nodes)) continue;
      keep.add(deposit.id);
      const previous = this.views.get(deposit.id);
      if (previous?.camp === camp && previous.deposit === deposit) continue;
      previous?.root.destroy({ children: true });
      const color = ITEM_COLORS[deposit.resourceItem];
      const root = new Container({ eventMode: 'none' }); root.label = `guarded-refill:${deposit.id}`;
      const line = new Graphics(), source = new Graphics(), target = new Graphics(), pulse = new Graphics();
      source.circle(0, 0, 9).fill(0x121315).stroke({ color, width: 2 });
      source.poly([15,-4,21,0,15,4]).fill(color);
      target.circle(0, 0, 9).fill(color).stroke({ color: 0x121315, width: 2 });
      const packet = new Container({ eventMode: 'none' }); packet.label = 'refill-packet'; packet.visible = false;
      packet.addChild(new Graphics().roundRect(-19,-5,38,10,5).fill({color:THEME.flow,alpha:.25}),
        new Graphics().roundRect(-14,-2,28,4,2).fill(THEME.flowCore));
      const quantity = label('',14,THEME.text,'normal','mono'); quantity.anchor.set(.5); quantity.y = -22;
      packet.addChild(quantity); root.addChild(line, source, target, pulse, packet); this.layer.addChild(root);
      this.views.set(deposit.id, { camp, deposit, root, line, source, target, pulse, packet, quantity,
        receipt: guardedRefillReceipt(deposit), elapsed: Infinity, amount: 0 });
    }
    for (const [id, view] of this.views) if (!keep.has(id)) { view.root.destroy({ children: true }); this.views.delete(id); }
  }

  update(frameNow: number, options: { paused: boolean; particles: boolean; reducedMotion: boolean; positions?: Record<string, Point> }) {
    const dt = this.lastFrame === undefined ? 0 : Math.max(0, frameNow - this.lastFrame); this.lastFrame = frameNow;
    for (const view of this.views.values()) {
      const { camp, deposit } = view;
      view.root.visible = Boolean(this.sector && guardedResourceAccessible(deposit, this.sector.nodes));
      if (!view.root.visible) { view.elapsed = Infinity; view.receipt = guardedRefillReceipt(deposit); continue; }
      const receipt = guardedRefillReceipt(deposit);
      if (receipt !== view.receipt) {
        view.receipt = receipt; view.amount = receipt?.amount ?? 0;
        view.elapsed = options.particles && !options.reducedMotion ? 0 : Infinity;
        view.quantity.text = view.amount > 1 ? `×${view.amount}` : '';
      } else if (!options.paused) view.elapsed += dt;
      const { start, end } = guardedRefillEndpoints(camp, deposit, options.positions);
      const localEnd = { x: end.x - start.x, y: end.y - start.y }, origin = { x: 0, y: 0 };
      view.root.position.set(start.x, start.y);
      const key = `${localEnd.x}:${localEnd.y}`;
      if (view.key !== key) {
        view.key = key; const color = ITEM_COLORS[deposit.resourceItem!]; view.line.clear();
        drawCurve(view.line, origin, localEnd); view.line.stroke({color:0x121820,width:7,alpha:.95});
        drawCurve(view.line, origin, localEnd); view.line.stroke({color,width:2.5,alpha:.6});
        view.target.position.set(localEnd.x, localEnd.y);
      }
      const progress = Math.min(1, view.elapsed / 900);
      view.packet.visible = options.particles && !options.reducedMotion && progress < 1 && view.amount > 0;
      if (view.packet.visible) {
        const controls = getConnectionControlPoints(origin, localEnd, 'east', 'west'), u = 1 - progress;
        view.packet.position.set(3*u*u*progress*controls.first.x+3*u*progress*progress*controls.second.x+progress**3*localEnd.x,
          3*u*u*progress*controls.first.y+3*u*progress*progress*controls.second.y+progress**3*localEnd.y);
        view.packet.alpha = Math.min(1, progress/.08, (1-progress)/.12);
      }
      view.pulse.clear();
      const arrival = (view.elapsed - 700) / 500;
      if (options.particles && !options.reducedMotion && arrival >= 0 && arrival < 1) {
        view.pulse.circle(localEnd.x,localEnd.y,12+arrival*20).stroke({color:THEME.flowHighlight,width:2,alpha:1-arrival});
      }
    }
  }
}
