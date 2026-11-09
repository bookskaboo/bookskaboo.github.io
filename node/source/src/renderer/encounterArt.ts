import { Container, Graphics } from 'pixi.js';
import { getNodeArt } from '../art/nodeArt';
import type { LineArtId } from '../art/lineArt';
import { getGolemMineral, type GolemMineral } from '../content/resourceGolems';
import { getNodeSize } from '../domain/nodeGeometry';
import type { MachineNode } from '../domain/types';
import { drawLineArt } from './drawNodeIcon';

const MINERAL_INLAY: Record<GolemMineral, LineArtId> = {
  iron: 'iron-ingot', copper: 'copper-ingot', stone: 'stone-rune', mythril: 'gem',
};

export function drawEncounterArt(root: Container, node: MachineNode, accent: number) {
  if (node.kind === 'monster-camp') {
    const { w, h } = getNodeSize(node);
    drawLineArt(root, getNodeArt(node.kind, node), 0, -h * .19, Math.min(w, h) * .4,
      node.lizardSettlement ? 0xa9e4bb : 0xffa298, 1.15);
  } else if (node.kind === 'resourceGolem') {
    const { w, h } = getNodeSize(node);
    // Keep the engraving inside the obstruction outline and clear of the central socket.
    const engraving = new Graphics();
    engraving.eventMode = 'none';
    engraving.moveTo(-w * .085, -h * .42).lineTo(-w * .04, -h * .42)
      .moveTo(w * .04, -h * .42).lineTo(w * .085, -h * .42)
      .moveTo(-w * .06, -h * .37).lineTo(w * .06, -h * .37)
      .stroke({ color: accent, width: 7, cap: 'round', join: 'round' });
    root.addChild(engraving);
    drawLineArt(root, MINERAL_INLAY[getGolemMineral(node)], 0, -h * .135, w * .31, accent, 1.2);
  }
}
