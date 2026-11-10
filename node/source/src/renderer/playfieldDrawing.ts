import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getConnectionControlPoints, getPortSide } from '../simulation/connectionRules';
import type { MachineNode } from '../domain/types';

export function drawCurve(graphic: Graphics, start: { x: number; y: number }, end: { x: number; y: number }, sourceSide: ReturnType<typeof getPortSide> = 'east', targetSide: ReturnType<typeof getPortSide> = 'west') {
  const controls = getConnectionControlPoints(start, end, sourceSide, targetSide);
  graphic.moveTo(start.x, start.y).bezierCurveTo(controls.first.x, controls.first.y, controls.second.x, controls.second.y, end.x, end.y);
}

// Match the UI font stacks in styles/readability.css. Pixi does not inherit CSS fonts.
const CANVAS_FONTS = {
  ui: ['Segoe UI Variable Text', 'Segoe UI', 'Inter', 'Arial', 'sans-serif'],
  mono: ['Cascadia Mono', 'Consolas', 'ui-monospace', 'monospace'],
};

export function label(text: string, size: number, color: number, weight: TextStyle['fontWeight'] = 'normal', family: keyof typeof CANVAS_FONTS = 'ui') {
  const rendered = new Text({
    text,
    resolution: Math.min(4, Math.max(2, (globalThis.devicePixelRatio || 1) * 1.5)),
    style: new TextStyle({ fontFamily: CANVAS_FONTS[family], fontSize: size, fill: color, fontWeight: weight }),
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

const flowAngle = { east: 0, south: Math.PI / 2, west: Math.PI, north: -Math.PI / 2 };

function flowArrow(name: string) {
  const arrow = new Graphics();
  arrow.label = name;
  arrow.eventMode = 'none';
  arrow.poly([-36, -9, 8, -9, 8, -24, 36, 0, 8, 24, 8, 9, -36, 9])
    .fill({ color: 0xe8ce83, alpha: .95 }).stroke({ color: 0xf5e3ae, width: 2 });
  return arrow;
}

/** roadFacing is the socket facing into the field, opposite the map edge. */
export function drawRoadFlowArrow(root: Container, node: MachineNode) {
  const socketSide = node.roadFacing ?? (node.roadMode === 'import' ? 'east' : 'west');
  const arrow = flowArrow('road-flow-arrow');
  arrow.position.set(0, 18);
  arrow.rotation = flowAngle[socketSide] + (node.roadMode === 'import' ? 0 : Math.PI);
  root.addChild(arrow);
}

export function drawFreightVehicleFlowArrow(root: Container, node: MachineNode) {
  const arrow = flowArrow('freight-vehicle-flow-arrow');
  arrow.position.set(0, -10);
  arrow.scale.set(.46, .30);
  arrow.rotation = flowAngle[getPortSide(node, 'output', 0)];
  root.addChild(arrow);
}


export function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!); }
