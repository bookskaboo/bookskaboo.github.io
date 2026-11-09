import { cornerCampInward, getNodeSize, isOrganicNode, organicPolygon } from './nodeGeometry';
import type { MachineNode } from './types';

export interface Point { x: number; y: number }
interface Bounds { left: number; right: number; top: number; bottom: number }
const EPSILON = 1e-7;
const outlines = new WeakMap<MachineNode, { key: string; points: Point[]; bounds: Bounds }>();

/** The exact outline drawn by the renderer, in local node coordinates. */
export function obstructionOutline(node: MachineNode): number[] {
  if (node.kind === 'cornerChallenge') {
    const { w, h } = getNodeSize(node);
    const x = w / 2, y = h / 2;
    if (!node.cornerCampQuadrant) return [-x, -y, x, -y, x, y, -x, y];
    const inward = cornerCampInward(node.cornerCampQuadrant);
    const trim = 56;
    const recess = 288;
    return [-x + trim, -y, x - trim, -y, x, -y + trim, x, y - recess,
      x - recess, y, -x + trim, y, -x, y - trim, -x, -y + trim]
      .map((value, index) => value * (index % 2 === 0 ? inward.x : inward.y));
  }
  if (node.kind === 'resourceGolem') {
    const { w, h } = getNodeSize(node);
    // One closed silhouette also defines placement, cable, and field boundaries.
    return [-.14, -.5, .14, -.5, .14, -.34, .36, -.30, .5, .08, .32, .14,
      .24, -.04, .22, .16, .29, .5, .05, .5, 0, .24, -.05, .5,
      -.29, .5, -.22, .16, -.24, -.04, -.32, .14, -.5, .08, -.36, -.30, -.14, -.34]
      .map((value, index) => value * (index % 2 === 0 ? w : h));
  }
  return organicPolygon(node, node.kind === 'lake' ? 18 : node.kind === 'monster-camp' ? 15 : 11);
}

function footprint(node: MachineNode) {
  const size = getNodeSize(node);
  const key = `${node.id}:${node.kind}:${size.w}:${size.h}:${node.cornerCampQuadrant ?? ''}`;
  const cached = outlines.get(node);
  if (cached?.key === key) return cached;
  const raw = isOrganicNode(node) ? obstructionOutline(node) : [-size.w / 2, -size.h / 2, size.w / 2, -size.h / 2, size.w / 2, size.h / 2, -size.w / 2, size.h / 2];
  const points = Array.from({ length: raw.length / 2 }, (_, index) => ({ x: raw[index * 2], y: raw[index * 2 + 1] }));
  const bounds = { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) };
  const result = { key, points, bounds };
  outlines.set(node, result);
  return result;
}

function translatedBounds(node: MachineNode): Bounds {
  const bounds = footprint(node).bounds;
  return { left: bounds.left + node.x, right: bounds.right + node.x, top: bounds.top + node.y, bottom: bounds.bottom + node.y };
}
const separate = (a: Bounds, b: Bounds, gap: number) => a.right + gap < b.left || b.right + gap < a.left || a.bottom + gap < b.top || b.bottom + gap < a.top;
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const onSegment = (p: Point, a: Point, b: Point) => Math.abs(cross(a, b, p)) <= EPSILON && p.x >= Math.min(a.x, b.x) - EPSILON && p.x <= Math.max(a.x, b.x) + EPSILON && p.y >= Math.min(a.y, b.y) - EPSILON && p.y <= Math.max(a.y, b.y) + EPSILON;

export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  if (((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) && ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON))) return true;
  return onSegment(c, a, b) || onSegment(d, a, b) || onSegment(a, c, d) || onSegment(b, c, d);
}

export function pointInPolygon(point: Point, polygon: readonly Point[]) {
  let inside = false;
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index], b = polygon[(index + 1) % polygon.length];
    if (onSegment(point, a, b)) return true;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function pointSegmentDistanceSquared(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return (p.x - a.x - t * dx) ** 2 + (p.y - a.y - t * dy) ** 2;
}

/** Polygon intersections plus the caller's explicit placement clearance. */
export function footprintsOverlap(first: MachineNode, second: MachineNode, clearance = 0) {
  if (separate(translatedBounds(first), translatedBounds(second), clearance)) return false;
  const a = footprint(first).points.map(p => ({ x: p.x + first.x, y: p.y + first.y }));
  const b = footprint(second).points.map(p => ({ x: p.x + second.x, y: p.y + second.y }));
  if (pointInPolygon(a[0], b) || pointInPolygon(b[0], a)) return true;
  const gapSquared = clearance * clearance;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    const a1 = a[i], a2 = a[(i + 1) % a.length], b1 = b[j], b2 = b[(j + 1) % b.length];
    if (segmentsIntersect(a1, a2, b1, b2)) return true;
    if (clearance > 0 && Math.min(pointSegmentDistanceSquared(a1, b1, b2), pointSegmentDistanceSquared(a2, b1, b2), pointSegmentDistanceSquared(b1, a1, a2), pointSegmentDistanceSquared(b2, a1, a2)) <= gapSquared) return true;
  }
  return false;
}

/** Cable tests use the visible border, without an invisible expanded ellipse. */
export function segmentCrossesObstruction(start: Point, end: Point, obstruction: MachineNode) {
  const bounds = { left: Math.min(start.x, end.x), right: Math.max(start.x, end.x), top: Math.min(start.y, end.y), bottom: Math.max(start.y, end.y) };
  if (separate(bounds, translatedBounds(obstruction), 0)) return false;
  const a = { x: start.x - obstruction.x, y: start.y - obstruction.y }, b = { x: end.x - obstruction.x, y: end.y - obstruction.y };
  const points = footprint(obstruction).points;
  return pointInPolygon(a, points) || pointInPolygon(b, points) || points.some((point, index) => segmentsIntersect(a, b, point, points[(index + 1) % points.length]));
}

export function footprintInsideField(node: MachineNode, field: { width: number; height: number }, margin: number) {
  const bounds = translatedBounds(node);
  return bounds.left >= margin && bounds.right <= field.width - margin && bounds.top >= margin && bounds.bottom <= field.height - margin;
}

/** Natural resources reserve the entire maximum growth circle, not today's camp size. */
export function overlapsMaximumCampRadius(resource: MachineNode, camp: MachineNode, clearance = 0) {
  const maximum = getNodeSize({ ...camp, campStrength: 100 });
  const radius = Math.max(camp.obstructionMaxRadius ?? 0, maximum.w / 2, maximum.h / 2) + clearance;
  const size = getNodeSize(resource);
  const dx = Math.max(0, Math.abs(resource.x - camp.x) - size.w / 2), dy = Math.max(0, Math.abs(resource.y - camp.y) - size.h / 2);
  return dx * dx + dy * dy <= radius * radius;
}
