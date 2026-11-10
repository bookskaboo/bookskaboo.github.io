import { Container, Graphics, GraphicsPath } from 'pixi.js';
import { LINE_ART, type LineArtId } from '../art/lineArt';
import { label } from './playfieldDrawing';

const paths = new Map<LineArtId, GraphicsPath>();

export function drawLineArt(
  root: Container, icon: LineArtId, x: number, y: number, size: number,
  color: number, width = 1.75,
) {
  let path = paths.get(icon);
  if (!path) {
    path = new GraphicsPath(LINE_ART[icon]);
    paths.set(icon, path);
  }
  const graphic = new Graphics().path(path).stroke({ color, width, cap: 'round', join: 'round' });
  graphic.eventMode = 'none';
  graphic.position.set(x - size / 2, y - size / 2);
  graphic.scale.set(size / 24);
  root.addChild(graphic);
  return graphic;
}

export function drawNodeIcon(root: Container, icon: LineArtId, x: number, y: number, size: number, color: number, customGlyph?: string) {
  if (customGlyph) {
    const glyph = label(customGlyph, size, color);
    glyph.anchor.set(.5);
    glyph.position.set(x, y);
    root.addChild(glyph);
    return glyph;
  }
  return drawLineArt(root, icon, x, y, size, color);
}
