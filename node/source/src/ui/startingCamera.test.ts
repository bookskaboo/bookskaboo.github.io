import { describe, expect, it } from 'vitest';
import { createHomeSector } from '../simulation/worldGeneration';
import { getNodeSize } from '../renderer/nodeLayout';
import { startingCamera } from './startingCamera';

describe('fresh Home framing', () => {
  it('keeps every starter node clear of the navigation and shortcut row', () => {
    for (const [width, height, top] of [[800, 600, 132], [1280, 720, 95], [1920, 1080, 111]]) {
      const sector = createHomeSector();
      const before = structuredClone(sector);
      const camera = startingCamera(sector.nodes, { width, height, top });
      sector.nodes.forEach(node => {
        const size = getNodeSize(node);
        expect(camera.y + (node.y - size.h/2) * camera.zoom).toBeGreaterThanOrEqual(top + 5);
        expect(camera.y + (node.y + size.h/2) * camera.zoom).toBeLessThanOrEqual(height - 99);
        expect(camera.x + (node.x - size.w/2) * camera.zoom).toBeGreaterThanOrEqual(47);
        expect(camera.x + (node.x + size.w/2) * camera.zoom).toBeLessThan(width);
      });
      expect(sector).toEqual(before);
    }
  });
});
