import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { MachineNode } from '../domain/types';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { label } from './playfieldDrawing';

export interface ResearchNodeStatus {
  root: Container;
  plate: Graphics;
  text: Text;
  width: number;
  projectName?: string;
}

/** The original always-visible INACTIVE button becomes the current project label. */
export function createResearchNodeStatus(node: MachineNode, openResearch: () => void): ResearchNodeStatus {
  const size = getNodeSize(node), width = size.w - 36;
  const root = new Container();
  root.label = 'research-status';
  root.position.set(-width / 2, getPortAnchor(node, 'input', 0).y - 11);
  root.hitArea = new Rectangle(0, 0, width, 22);
  const plate = new Graphics();
  const text = label('', 12, 0xbec8ce, '500');
  text.anchor.set(.5); text.position.set(width / 2, 11); text.eventMode = 'none';
  root.addChild(plate, text);
  root.on('pointerdown', event => { if (event.button === 0) event.stopPropagation(); });
  root.on('pointertap', event => { if (event.button === 0) { event.stopPropagation(); openResearch(); } });
  const status = { root, plate, text, width };
  updateResearchNodeStatus(status, undefined, 1);
  return status;
}

export function updateResearchNodeStatus(status: ResearchNodeStatus, projectName: string | undefined, readabilityScale: number) {
  if (!status.text.text || status.projectName !== projectName) {
    status.projectName = projectName;
    status.text.text = projectName ?? 'INACTIVE';
    status.text.style.fill = projectName ? 0xe6c571 : 0xbec8ce;
    status.plate.clear().roundRect(0, 0, status.width, 22, 5)
      .fill({ color: projectName ? 0x302d23 : 0x242a2f, alpha: .98 })
      .stroke({ color: projectName ? 0x8b7949 : 0x67747e, width: 1, alpha: .85 });
    status.root.eventMode = projectName ? 'none' : 'static';
    status.root.cursor = projectName ? 'default' : 'pointer';
  }
  const naturalWidth = status.text.width / status.text.scale.x;
  status.text.scale.set(Math.min(readabilityScale, (status.width - 18) / Math.max(1, naturalWidth)));
}
