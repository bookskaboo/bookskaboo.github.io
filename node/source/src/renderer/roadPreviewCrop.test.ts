import { expect, it } from 'vitest';
import { ROAD_PREVIEW_GAP, roadPreviewCrop, roadPreviewPosition } from './roadPreviewCrop';

it('shows only the half of the destination sharing the wall and keeps north up', () => {
  const field = { width: 3600, height: 2800 };
  expect(roadPreviewCrop(field, 'west')).toEqual({ x: 0, y: 0, width: 1800, height: 2800 });
  expect(roadPreviewCrop(field, 'east')).toEqual({ x: 1800, y: 0, width: 1800, height: 2800 });
  expect(roadPreviewCrop(field, 'north')).toEqual({ x: 0, y: 0, width: 3600, height: 1400 });
  expect(roadPreviewCrop(field, 'south')).toEqual({ x: 0, y: 1400, width: 3600, height: 1400 });
});

it('matches the shared corners and gap on each wall even when the neighboring field is larger', () => {
  const local = { width: 4000, height: 3000 };
  const remote = { width: 5000, height: 3750 };
  const layout = (facing: Parameters<typeof roadPreviewPosition>[0]) => roadPreviewPosition(facing, local, roadPreviewCrop(remote, facing));
  expect(layout('west')).toEqual({ x: local.width + ROAD_PREVIEW_GAP, y: 0, scale: .8 });
  expect(layout('east')).toEqual({ x: -local.width / 2 - ROAD_PREVIEW_GAP, y: 0, scale: .8 });
  expect(layout('south')).toEqual({ x: 0, y: -local.height / 2 - ROAD_PREVIEW_GAP, scale: .8 });
  expect(layout('north')).toEqual({ x: 0, y: local.height + ROAD_PREVIEW_GAP, scale: .8 });
});
