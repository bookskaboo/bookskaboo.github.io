import { Container, Graphics, GraphicsPath } from 'pixi.js';
import { CORNER_ARTBOARD, CORNER_ILLUSTRATIONS, cornerIllustrationFit } from '../art/cornerIllustrations';
import { ALPHA_AP, FOUNDRY_INPUTS, type CornerType } from '../content/endgame';
import { getNodeSize } from '../domain/nodeGeometry';
import { obstructionOutline } from '../domain/obstructionGeometry';
import type { ItemId, MachineNode } from '../domain/types';
import { groveProgress } from './groveProgress';
import { label } from './playfieldDrawing';
import { nodeTextScale } from './playfieldNodeState';
import { THEME } from './playfieldTheme';

const CAMPS = {
  alpha: { fill: 0x331e27, accent: 0xef9d79 },
  foundry: { fill: 0x33291d, accent: 0xf3bf71 },
  reclamation: { fill: 0x252c41, accent: 0xa5b7ea },
  grove: { fill: 0x1e342a, accent: 0x93d8a2 },
} satisfies Record<CornerType, { fill: number; accent: number }>;

const cornerLayers = new Map(Object.entries(CORNER_ILLUSTRATIONS).map(([corner, layers]) => [
  corner, layers.map(layer => ({ ...layer, path: new GraphicsPath(layer.path) })),
]));

export function drawCornerCamp(body: Graphics, node: MachineNode, selected: boolean) {
  const { fill, accent } = CAMPS[node.cornerType ?? 'alpha'];
  const outline = obstructionOutline(node);
  body.poly(outline).fill(fill).stroke({ color: selected ? THEME.selected : accent, width: selected ? 7 : 4 });
  if (node.cornerCampQuadrant) body.poly(outline.map(value => value * .96)).stroke({ color: accent, width: 3, alpha: .3 });
}

export function createCornerCampStatus(node: MachineNode) {
  const root = new Container();
  root.eventMode = 'none';
  const corner = node.cornerType ?? 'alpha';
  const { fill, accent } = CAMPS[corner];
  const { w, h } = getNodeSize(node);
  const illustration = new Graphics();
  const { scaleX, scaleY } = cornerIllustrationFit(w, h);
  for (const { path, filled, width, opacity } of cornerLayers.get(corner)!) {
    illustration.path(path);
    if (filled) illustration.fill(fill);
    illustration.stroke({ color: accent, width, alpha: opacity, cap: 'round', join: 'round' });
  }
  illustration.position.set(-CORNER_ARTBOARD.width * scaleX / 2, -h * .09 - CORNER_ARTBOARD.height * scaleY / 2);
  illustration.scale.set(scaleX, scaleY);
  root.addChild(illustration);
  const title = label(node.name.toUpperCase(), 24, 0xf3f5f7, 'bold');
  const progress = label('', 15, accent, 'bold', 'monospace');
  title.anchor.set(.5, 0);
  progress.anchor.set(.5, 0);
  progress.y = 30;
  const readout = new Container();
  readout.y = h * .30;
  readout.addChild(title, progress);
  root.addChild(readout);
  return {
    root, readout, progress, titleWidth: title.width,
    maxReadoutWidth: w * .68,
    maxReadoutHeight: h * .17,
  };
}

export type CornerCampStatus = ReturnType<typeof createCornerCampStatus>;

export function updateCornerCampStatus(view: CornerCampStatus, node: MachineNode, zoom: number) {
  const progress = node.cornerProgress ?? 0;
  switch (node.cornerType) {
    case 'alpha': view.progress.text = `${progress.toLocaleString()} / ${ALPHA_AP.toLocaleString()} AP`; break;
    case 'foundry': {
      const bill = Object.entries(FOUNDRY_INPUTS);
      const ready = bill.filter(([item, count]) => (node.input[item as ItemId] ?? 0) >= count!).length;
      view.progress.text = `${ready} / ${bill.length} SUPPLY TYPES READY`;
      break;
    }
    case 'reclamation': view.progress.text = `${(progress * 100).toFixed(3)}% RECLAIMED`; break;
    case 'grove': view.progress.text = `${groveProgress(node)?.label ?? ''} GROWTH`; break;
  }
  const scale = Math.max(nodeTextScale(zoom), node.cornerCampQuadrant ? 1 / zoom : 1);
  view.readout.scale.set(Math.min(
    scale,
    view.maxReadoutWidth / Math.max(view.titleWidth, view.progress.width),
    view.maxReadoutHeight / (view.progress.y + view.progress.height),
  ));
}
