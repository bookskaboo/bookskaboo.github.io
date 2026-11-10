import type { MachineNode } from '../domain/types';

/** Keep the half of the destination closest to the shared wall, in its normal orientation. */
export function roadPreviewCrop(field: { width: number; height: number }, localFacing: NonNullable<MachineNode['roadFacing']>) {
  const horizontal = localFacing === 'east' || localFacing === 'west';
  const width = horizontal ? field.width / 2 : field.width;
  const height = horizontal ? field.height : field.height / 2;
  return { x: localFacing === 'east' ? width : 0, y: localFacing === 'south' ? height : 0, width, height };
}

export const ROAD_PREVIEW_GAP = 48;
type Size = { width: number; height: number };

/** Place the cropped map across the seam and match the two corners of the shared wall. */
export function roadPreviewPosition(localFacing: NonNullable<MachineNode['roadFacing']>, field: Size, crop: Size) {
  const sideBySide = localFacing === 'east' || localFacing === 'west';
  const scale = sideBySide ? field.height / crop.height : field.width / crop.width;
  const position = {
    west: { x: field.width + ROAD_PREVIEW_GAP, y: 0 },
    east: { x: -crop.width * scale - ROAD_PREVIEW_GAP, y: 0 },
    south: { x: 0, y: -crop.height * scale - ROAD_PREVIEW_GAP },
    north: { x: 0, y: field.height + ROAD_PREVIEW_GAP },
  }[localFacing];
  return { ...position, scale };
}
