import { Container } from 'pixi.js';
import type { CameraState } from '../domain/types';
import type { FieldViewport } from '../domain/camera';
import { boundsOnScreen, type CableBounds } from './sceneUpdates';

/** Small independent caches let a moving endpoint redraw its neighborhood. */
export class CableLayers {
  private chunks = new Map<string, { root: Container; dirty: boolean; bounds?: CableBounds }>();
  constructor(private layer: Container) {}
  get size() { return this.chunks.size; }

  add(view: Container, start: { x: number; y: number }, selected: boolean) {
    if (selected) { this.layer.addChild(view); return; }
    const key = `cables:${Math.floor(start.x / 1024)}:${Math.floor(start.y / 1024)}`;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const root = new Container(); root.label = key;
      this.layer.addChild(root); chunk = { root, dirty: true }; this.chunks.set(key, chunk);
    }
    chunk.root.addChild(view); chunk.dirty = true;
  }

  invalidate(view: Container) {
    const chunk = view.parent && this.chunks.get(view.parent.label);
    if (chunk) chunk.dirty = true;
  }

  update(cached: boolean, camera: CameraState, viewport: FieldViewport) {
    for (const [key, chunk] of this.chunks) {
      if (!chunk.root.children.length) { chunk.root.destroy(); this.chunks.delete(key); continue; }
      if (chunk.dirty) {
        // Include every curve, even when its endpoints are outside the viewport.
        chunk.root.visible = true;
        const visibility = chunk.root.children.map(child => child.visible);
        chunk.root.children.forEach(child => { child.visible = true; });
        const bounds = chunk.root.getLocalBounds();
        chunk.root.children.forEach((child, index) => { child.visible = visibility[index]; });
        chunk.bounds = { left: bounds.x, top: bounds.y, right: bounds.maxX, bottom: bounds.maxY };
      }
      if (cached && (chunk.dirty || !chunk.root.isCachedAsTexture)) {
        chunk.root.cacheAsTexture(false);
        const bounds = chunk.bounds!;
        chunk.root.cacheAsTexture({ resolution: Math.min(.5, 2048 / Math.max(1, bounds.right - bounds.left, bounds.bottom - bounds.top)), antialias: true });
      } else if (!cached && chunk.root.isCachedAsTexture) chunk.root.cacheAsTexture(false);
      chunk.root.visible = Boolean(chunk.bounds && boundsOnScreen(chunk.bounds, camera, viewport));
      chunk.dirty = false;
    }
  }
}
