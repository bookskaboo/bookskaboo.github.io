import { borderKey, type BorderObstruction } from './borderObstructionLayout';

export const BORDER_BAND_WIDTH_MULTIPLIER = 1.25;
export const BORDER_FIELD_CROSS_SCALE = 3 * BORDER_BAND_WIDTH_MULTIPLIER;
export const BORDER_RESOURCE_GAP = 32;
export interface BorderArtProjection {
  horizontal?: boolean;
  field?: { width: number; height: number };
  crossScale?: number;
}
export interface MountainFace { x: number; y: number; width: number; height: number; lean: number; shade: number }
export const MOUNTAIN_FACE_OUTLINE = [[-72,65],[-46,11],[-22,-8],[4,-49],[30,-10],[51,8],[80,68],[28,82],[-20,71]];

export function borderTerrainArtSeed(worldSeed: number, from: string, to: string) {
  let seed = worldSeed >>> 0;
  for (const letter of borderKey(from, to)) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619) >>> 0;
  return seed;
}

/** Irregular pockets spread across the ridge, rather than a single chain. */
export function mountainFaces(artSeed = 0x4d4f554e): MountainFace[] {
  let seed = artSeed >>> 0;
  const jitter = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const faces: MountainFace[] = [];
  for (let y = -48; y < 560; y += 42 + jitter() * 28) {
    const count = 2 + Math.floor(jitter() * 3);
    for (let i = 0; i < count; i++) faces.push({
      x: 302 + jitter() * 94, y: y + (jitter() - .5) * 58,
      width: .64 + jitter() * .48, height: .5 + jitter() * .6,
      lean: (jitter() - .5) * .2, shade: Math.floor(jitter() * 3),
    });
  }
  return faces.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Undo the horizontal band's axis swap for each peak, so every peak still points up. */
export function mountainPoint(face: MountainFace, dx: number, dy: number, projection: BorderArtProjection = {}): [number, number] {
  const px = dx * .55 * face.width + dy * .75 * face.height * face.lean;
  const py = dy * .75 * face.height;
  if (!projection.horizontal) return [face.x + px, face.y + py];
  const field = projection.field ?? { width: 3600, height: 2400 };
  const cross = projection.crossScale ?? BORDER_FIELD_CROSS_SCALE;
  // Bias the shared horizontal ridge toward its upper half. South fields then
  // retain more complete bases; the North field/ghost still clips the same art.
  return [face.x - 64 + py * (field.height / 500) / cross, face.y + px * cross / (field.width / 500)];
}

/** Conservative visible cross-band extent, including outlines. Used by generation too. */
export function borderTerrainCrossBounds(kind: BorderObstruction, artSeed: number, projection: BorderArtProjection = {}) {
  // River bounds include Bezier control points; chasm bounds include both cliff lips.
  if (kind === 'river') return { min: 250, max: 433 };
  if (kind === 'chasm') return { min: 253, max: 449 };
  let min = 260, max = 453;
  for (const face of mountainFaces(artSeed)) for (const [dx, dy] of MOUNTAIN_FACE_OUTLINE) {
    const [x] = mountainPoint(face, dx, dy, projection);
    min = Math.min(min, x - 2); max = Math.max(max, x + 2);
  }
  return { min, max };
}
