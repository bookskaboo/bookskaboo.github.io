import { Container, Graphics, Texture, type Renderer } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { OverviewTextures } from './overviewTextures';
import { CableLayers } from './cableLayers';

describe('overview artwork and live overlays', () => {
  it('shares artwork across nodes while keeping progress, stock and arrival effects out of the image', () => {
    const cache = new OverviewTextures(), root = new Container(); root.position.set(900, 500);
    const body = new Graphics().rect(-100, -60, 200, 120).fill(0xffffff);
    const progress = new Graphics().rect(0, 0, 90, 8).fill(0xffffff);
    const port = new Container(), pulse = new Graphics(); port.label = 'socket:input:0'; port.scale.set(1.4); pulse.label = 'live-overlay'; port.addChild(pulse);
    const unnamedArt = new Container(); unnamedArt.label = null as unknown as string; port.addChild(unnamedArt);
    root.addChild(body, port, progress);
    const texture = new Texture({ source: Texture.EMPTY.source });
    const dispose = vi.spyOn(texture, 'destroy').mockImplementation(() => {});
    const generateTexture = vi.fn(({ target, frame, resolution }) => {
      expect(target.position.x).toBe(0); expect(target.position.y).toBe(0);
      expect(body.visible).toBe(true); expect(progress.visible).toBe(false); expect(pulse.visible).toBe(false);
      expect(port.scale.x).toBe(1);
      expect(frame.width * resolution).toBeLessThanOrEqual(256);
      return texture;
    });
    const renderer = { generateTexture } as unknown as Renderer;
    const a = cache.sprite('iron', root, [body, port], renderer)!;
    const b = cache.sprite('iron', root, [body, port], renderer)!;
    expect(a).not.toBe(b); expect(a.texture).toBe(b.texture); expect(generateTexture).toHaveBeenCalledTimes(1);
    expect(root.position.x).toBe(900); expect(root.position.y).toBe(500);
    expect(progress.visible).toBe(true); expect(pulse.visible).toBe(true);
    expect(port.scale.x).toBe(1.4);
    cache.sprite('copper', root, [body, port], renderer);
    expect(generateTexture).toHaveBeenCalledTimes(2);
    cache.destroy(); expect(dispose).toHaveBeenCalledTimes(2); expect(cache.size).toBe(0);
    root.destroy({ children: true }); a.destroy(); b.destroy();
  });

  it('restores live drawing even when snapshot creation fails', () => {
    const cache = new OverviewTextures(), root = new Container(), body = new Graphics(), progress = new Graphics();
    root.addChild(body, progress); root.position.set(400, 200); root.alpha = .68;
    const renderer = { generateTexture() { throw new Error('GPU allocation failed'); } } as unknown as Renderer;
    expect(() => cache.sprite('a', root, [body], renderer)).toThrow('GPU allocation failed');
    expect(progress.visible).toBe(true); expect(root.x).toBe(400); expect(root.y).toBe(200); expect(root.alpha).toBe(.68);
    root.destroy({ children: true });
  });
});

describe('cable neighborhoods', () => {
  it('updates moved cables locally, preserves selected cable interaction and reopens culled regions', () => {
    const layer = new Container(), chunks = new CableLayers(layer), camera = { x: 0, y: 0, zoom: 1 }, viewport = { width: 1000, height: 700, top: 0 };
    const cable = (x: number) => new Graphics().moveTo(x, 100).lineTo(x + 100, 200).stroke({ width: 5, color: 0xffffff });
    const a = cable(100), b = cable(5000), selected = cable(200);
    chunks.add(a, { x: 100, y: 100 }, false); chunks.add(b, { x: 5000, y: 100 }, false); chunks.add(selected, { x: 200, y: 100 }, true);
    expect(a.parent).not.toBe(b.parent); expect(selected.parent).toBe(layer);
    chunks.update(false, camera, viewport); expect(a.parent!.visible).toBe(true); expect(b.parent!.visible).toBe(false);
    const untouched = b.parent;
    chunks.invalidate(a); a.destroy(); const moved = cable(600);
    chunks.add(moved, { x: 600, y: 100 }, false); chunks.update(false, camera, viewport);
    expect(b.parent).toBe(untouched);
    chunks.update(false, { ...camera, x: -5000 }, viewport); expect(b.parent!.visible).toBe(true); expect(moved.parent!.visible).toBe(false);
    chunks.invalidate(b); b.destroy(); chunks.update(false, camera, viewport); expect(chunks.size).toBe(1);
    layer.destroy({ children: true });
  });
});
