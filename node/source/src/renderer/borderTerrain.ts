import { Container, Graphics, Matrix } from 'pixi.js';
import { borderTerrainMarkup } from '../art/borderObstructionArt';
import { BORDER_FIELD_CROSS_SCALE, borderTerrainArtSeed } from '../domain/borderTerrainGeometry';
export { borderTerrainArtSeed } from '../domain/borderTerrainGeometry';
import { borderSide, sectorBorderObstructions, type BorderSide } from '../domain/borderObstructionLayout';
import type { GameState } from '../domain/types';

/** The canonical art runs along y=0..500 with its shared centerline at x=350.
 * Both sectors use the same orientation. Clipping, rather than mirroring or
 * narrowing the artwork, exposes their respective halves. Width is in world units. */
export function borderTerrainTransform(side: BorderSide, field: { width: number; height: number }) {
  const widthScale = BORDER_FIELD_CROSS_SCALE;
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
    const artSeed = borderTerrainArtSeed(state.seed, edge.from, edge.to);
    const side = borderSide(sectorId, other), horizontal = side === 'north' || side === 'south';
    const art = new Graphics().svg(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 700 500">${borderTerrainMarkup(edge.kind, artSeed, { horizontal, field })}</svg>`);
    art.setFromMatrix(borderTerrainTransform(side, field));
    root.addChild(art);
  }
  const clip = new Graphics().rect(0, 0, field.width, field.height).fill(0xffffff);
  root.addChild(clip); root.mask = clip;
  return root;
}
