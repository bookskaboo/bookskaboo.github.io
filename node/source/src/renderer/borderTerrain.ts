import { Container, Graphics, Matrix } from 'pixi.js';
import { borderTerrainMarkup } from '../art/borderObstructionArt';
import { borderSide, sectorBorderObstructions, type BorderSide } from '../domain/borderObstructionLayout';
import type { GameState } from '../domain/types';

/** The canonical art runs along y=0..500 with its shared centerline at x=350.
 * Both sectors use the same orientation. Clipping, rather than mirroring or
 * narrowing the artwork, exposes their respective halves. Width is in world units. */
export function borderTerrainTransform(side: BorderSide, field: { width: number; height: number }) {
  const widthScale = 3;
  return side === 'east' || side === 'west'
    ? new Matrix(widthScale, 0, 0, field.height / 500, (side === 'east' ? field.width : 0) - 350 * widthScale, 0)
    : new Matrix(0, widthScale, field.width / 500, 0, 0, (side === 'south' ? field.height : 0) - 350 * widthScale);
}
export function createBorderTerrain(state: GameState, sectorId: string, field: { width: number; height: number }) {
  const root = new Container(); root.eventMode = 'none'; root.label = 'border-terrain';
  const edges = sectorBorderObstructions(state, sectorId);
  if (!edges.length) return root;
  for (const edge of edges) {
    const other = edge.from === sectorId ? edge.to : edge.from;
    const art = new Graphics().svg(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 700 500">${borderTerrainMarkup(edge.kind)}</svg>`);
    art.setFromMatrix(borderTerrainTransform(borderSide(sectorId, other), field));
    root.addChild(art);
  }
  const clip = new Graphics().rect(0, 0, field.width, field.height).fill(0xffffff);
  root.addChild(clip); root.mask = clip;
  return root;
}
