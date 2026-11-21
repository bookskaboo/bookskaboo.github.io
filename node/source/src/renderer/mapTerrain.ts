import { Texture, TilingSprite } from 'pixi.js';
import { tileSvg } from '../art/mapTerrainArt';
import { revealedMapTerrain } from '../simulation/mapTerrain';
import type { GameState } from '../domain/types';

/** One rasterized periodic tile per terrain/variant, reused across field and Road views. */
export class MapTerrainTextures {
  private textures = new Map<string, Texture>();
  private loading = new Map<string, HTMLImageElement>();
  constructor(private ready: () => void) {}
  create(state: GameState, id: string, field: { width: number; height: number }) {
    const kind = revealedMapTerrain(state, id);
    if (!kind) return undefined;
    const [x,y] = id.split(',').map(Number);
    const variant = ((state.seed ^ Math.imul(x,73856093) ^ Math.imul(y,19349663)) >>> 0) % 4;
    const key = `${kind}:${variant}`;
    const texture = this.textures.get(key);
    if (!texture) {
      if (!this.loading.has(key)) {
        // Native SVG rasterization preserves viewport clipping and nested wrap transforms.
        const image = new Image(); this.loading.set(key,image);
        image.onload = () => { this.textures.set(key,Texture.from(image)); this.loading.delete(key); this.ready(); };
        image.onerror = () => console.error(`Could not load ${kind} terrain tile.`);
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tileSvg(kind,variant))}`;
      }
      return undefined;
    }
    const floor = new TilingSprite({ texture, width: field.width, height: field.height });
    floor.eventMode = 'none';
    floor.label = `map-terrain:${kind}`;
    return floor;
  }
  destroy() {
    this.loading.forEach(image => { image.onload=null; image.onerror=null; }); this.loading.clear();
    this.textures.forEach(texture => texture.destroy(true)); this.textures.clear();
  }
}
