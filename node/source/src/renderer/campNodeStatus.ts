import { Container, Graphics, Text } from 'pixi.js';
import type { MachineNode } from '../domain/types';
import { obstructionOutline } from '../domain/obstructionGeometry';
import { campStatus } from '../simulation/campStatus';
import { label } from './playfieldDrawing';

export interface CampNodeStatus { root: Container; halo: Graphics; plate: Graphics; bar: Graphics; ap: Text; check: Text; signature?: string; }
export function createCampNodeStatus(): CampNodeStatus {
  const root = new Container(), halo = new Graphics(), plate = new Graphics(), bar = new Graphics();
  root.eventMode = 'none'; root.label = 'camp-check-status';
  const ap = label('', 16, 0xffffff, 'normal', 'mono'), check = label('', 12, 0xffffff, 'normal', 'mono');
  ap.anchor.set(.5); check.anchor.set(.5); ap.position.set(0, 20); check.position.set(0, 58);
  root.addChild(plate, bar, ap, check); halo.eventMode = 'none';
  return { root, halo, plate, bar, ap, check };
}
export function updateCampNodeStatus(view: CampNodeStatus, node: MachineNode, interpolationMs: number, readabilityScale: number) {
  const status = campStatus(node, interpolationMs);
  const signature = `${status.result}:${node.campStrength}:${node.obstructionMaxRadius}`;
  if (view.signature !== signature) {
    view.signature = signature; view.halo.clear();
    if (status.result !== 'pending') {
      const outline = obstructionOutline(node);
      view.halo.poly(outline).stroke({ color: status.color, width: 20, alpha: .12 });
      view.halo.poly(outline).fill({ color: status.color, alpha: .05 }).stroke({ color: status.color, width: 5, alpha: .9 });
    }
    view.plate.clear().roundRect(-128, 3, 256, 71, 8).fill({ color: 0x11171d, alpha: .97 }).stroke({ color: status.color, width: 1, alpha: .7 });
    view.plate.roundRect(-112, 35, 224, 8, 4).fill(0x333c45);
  }
  view.root.position.set(0, 35 * readabilityScale); view.root.scale.set(readabilityScale);
  view.ap.text = status.apLabel; view.check.text = status.checkLabel;
  view.ap.style.fill = status.color; view.check.style.fill = status.color;
  view.bar.clear().roundRect(-112, 35, 224 * status.fraction, 8, 4).fill(status.color);
}
