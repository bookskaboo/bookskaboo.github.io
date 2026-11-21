import { Container, Rectangle, Sprite, Text, type Texture, type Renderer } from 'pixi.js';

/** Overlay live socket text/buffers without drawing a second copy of cached sockets. */
export function setOverviewArtworkVisibility(artwork: Container[], overview: boolean, details: boolean) {
  for (const child of artwork) {
    const socket = child.label?.startsWith('socket:');
    child.renderable = !overview || Boolean(socket && details);
    if (socket && (!overview || details)) for (const part of child.children) {
      part.renderable = !overview || part instanceof Text || part.label === 'port-label' || part.label === 'live-overlay';
    }
  }
}

/** Bounded, shared snapshots of existing artwork. Dynamic overlays stay live. */
export class OverviewTextures {
  private textures = new Map<string, { texture: Texture; x: number; y: number }>();

  get size() { return this.textures.size; }

  sprite(key: string, root: Container, artwork: Container[], renderer: Renderer) {
    let cached = this.textures.get(key);
    if (!cached) {
      // Custom/modded factories may contain arbitrarily many appearances.
      if (this.textures.size >= 256) return undefined;
      const visibility = new Map<Container, boolean>();
      const socketScales = new Map<Container, { x: number; y: number }>();
      const hide = (child: Container) => { visibility.set(child, child.visible); child.visible = false; };
      const hideText = (child: Container) => {
        if (child.label?.startsWith('socket:')) { socketScales.set(child, { x: child.scale.x, y: child.scale.y }); child.scale.set(1); }
        if (child instanceof Text || child.label === 'port-label' || child.label === 'live-overlay') hide(child);
        else child.children.forEach(hideText);
      };
      const included = new Set(artwork);
      root.children.forEach(child => { if (!included.has(child)) hide(child); else hideText(child); });
      const position = { x: root.x, y: root.y, alpha: root.alpha };
      root.position.set(0); root.alpha = 1;
      try {
        const bounds = root.getLocalBounds();
        const frame = new Rectangle(Math.floor(bounds.x) - 2, Math.floor(bounds.y) - 2, Math.ceil(bounds.width) + 4, Math.ceil(bounds.height) + 4);
        const texture = renderer.generateTexture({ target: root, frame, resolution: Math.min(.5, 256 / Math.max(1, frame.width, frame.height)), antialias: true });
        cached = { texture, x: frame.x, y: frame.y }; this.textures.set(key, cached);
      } finally {
        root.position.set(position.x, position.y); root.alpha = position.alpha;
        visibility.forEach((visible, child) => { child.visible = visible; });
        socketScales.forEach((scale, child) => { child.scale.set(scale.x, scale.y); });
      }
    }
    const sprite = new Sprite(cached.texture); sprite.position.set(cached.x, cached.y); sprite.eventMode = 'none';
    return sprite;
  }

  destroy() { this.textures.forEach(({ texture }) => texture.destroy(true)); this.textures.clear(); }
}
