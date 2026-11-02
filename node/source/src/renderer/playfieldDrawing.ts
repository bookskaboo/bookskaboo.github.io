import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getConnectionControlPoints, getPortSide } from '../simulation/connectionRules';

export function drawCurve(graphic: Graphics, start: { x: number; y: number }, end: { x: number; y: number }, sourceSide: ReturnType<typeof getPortSide> = 'east', targetSide: ReturnType<typeof getPortSide> = 'west') {
  const controls = getConnectionControlPoints(start, end, sourceSide, targetSide);
  graphic.moveTo(start.x, start.y).bezierCurveTo(controls.first.x, controls.first.y, controls.second.x, controls.second.y, end.x, end.y);
}

export function label(text: string, size: number, color: number, weight: 'normal' | 'bold' = 'normal', family = 'Segoe UI Variable Text, Segoe UI, Arial') {
  const rendered = new Text({
    text,
    resolution: Math.min(4, Math.max(2, (globalThis.devicePixelRatio || 1) * 1.5)),
    style: new TextStyle({ fontFamily: family, fontSize: size, fill: color, fontWeight: weight }),
  });
  rendered.roundPixels = true;
  return rendered;
}

export function drawTrashIcon(root: Container, centerX: number, centerY: number, color: number) {
  const icon = new Graphics();
  icon.moveTo(centerX - 4, centerY - 3).lineTo(centerX + 4, centerY - 3).stroke({ color, width: 1.5 });
  icon.roundRect(centerX - 3, centerY - 1, 6, 7, 1).stroke({ color, width: 1.4 });
  icon.moveTo(centerX - 2, centerY - 5).lineTo(centerX + 2, centerY - 5).stroke({ color, width: 1.4 });
  root.addChild(icon);
}


export function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!); }
