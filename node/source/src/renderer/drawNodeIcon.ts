import { Container, Graphics } from 'pixi.js';
import type { NodeIconId } from '../content/nodeModules';

const stroke = (graphic: Graphics, color: number, width = 1.7) => graphic.stroke({ color, width, cap: 'round', join: 'round' });

/** Lightweight Pixi equivalents of the old Lucide/custom SVG node icons. */
export function drawNodeIcon(root: Container, icon: NodeIconId, x: number, y: number, size: number, color: number) {
  const holder = new Container(); holder.position.set(x, y); holder.scale.set(size / 24); const g = new Graphics(); holder.addChild(g); root.addChild(holder);
  const line = (...points: number[]) => { g.moveTo(points[0] - 12, points[1] - 12); for (let i = 2; i < points.length; i += 2) g.lineTo(points[i] - 12, points[i + 1] - 12); stroke(g, color); };
  const poly = (points: number[]) => { g.poly(points.map((value, index) => value - (index % 2 === 0 ? 12 : 12))); stroke(g, color); };
  switch (icon) {
    case 'gem': poly([4, 8, 8, 3, 16, 3, 20, 8, 12, 21]); line(4, 8, 20, 8); line(8, 3, 12, 8, 16, 3); line(4, 8, 12, 21, 20, 8); break;
    case 'mountain': line(3, 19, 10, 6, 13, 11, 15, 8, 21, 19, 3, 19); break;
    case 'tree': g.circle(0, -3, 6).stroke({ color, width: 1.7 }); line(12, 13, 12, 22); line(8, 22, 16, 22); break;
    case 'lake': [8, 13, 18].forEach((row) => { g.moveTo(-9, row - 12).bezierCurveTo(-6, row - 15, -3, row - 9, 0, row - 12).bezierCurveTo(3, row - 15, 6, row - 9, 9, row - 12); stroke(g, color); }); break;
    case 'pickaxe': line(17, 3, 21, 7, 19, 10, 14, 5, 17, 3); line(17, 8, 6, 19); line(4, 18, 6, 20); break;
    case 'mining-drill': line(5, 18, 19, 18); poly([7, 18, 8, 11, 16, 11, 17, 18]); g.rect(-3, -5, 6, 4).stroke({ color, width: 1.7 }); poly([12, 11, 10, 15, 14, 15]); break;
    case 'flame': poly([13, 2, 10, 12, 12, 16, 15, 11, 18, 17, 16, 21, 9, 21, 6, 17, 13, 2]); break;
    case 'smelter': poly([5, 5, 19, 5, 17, 15, 7, 15]); line(8, 19, 16, 19); line(9, 15, 9, 19); line(15, 15, 15, 19); break;
    case 'cog': g.circle(0, 0, 7).stroke({ color, width: 1.7 }); g.circle(0, 0, 3).stroke({ color, width: 1.7 }); [[12,2,12,5],[12,19,12,22],[2,12,5,12],[19,12,22,12],[5,5,7,7],[17,17,19,19],[19,5,17,7],[7,17,5,19]].forEach((p) => line(...p)); break;
    case 'hammer': poly([14, 4, 20, 10, 17, 13, 11, 7]); line(14, 10, 5, 20); line(4, 18, 6, 20); break;
    case 'atom': g.circle(0, 0, 1.6).fill(color); g.ellipse(0, 0, 9, 3.8).stroke({ color, width: 1.4 }); line(5, 6, 19, 18); line(19, 6, 5, 18); break;
    case 'split': line(4, 12, 10, 12); g.moveTo(-2, 0).bezierCurveTo(3, 0, 2, -6, 7, -6); stroke(g, color); g.moveTo(-2, 0).bezierCurveTo(3, 0, 2, 6, 7, 6); stroke(g, color); line(18, 4, 20, 6, 18, 8); line(18, 16, 20, 18, 18, 20); break;
    case 'merge': g.moveTo(-8, -6).bezierCurveTo(-2, -6, -3, 0, 3, 0); g.moveTo(-8, 6).bezierCurveTo(-2, 6, -3, 0, 3, 0); g.lineTo(8, 0); stroke(g, color); line(18, 10, 20, 12, 18, 14); break;
    case 'cable': g.circle(-5, -5, 3).stroke({ color, width: 1.7 }); g.circle(5, 5, 3).stroke({ color, width: 1.7 }); line(9, 9, 15, 15); break;
    case 'road': line(8, 3, 5, 21); line(16, 3, 19, 21); [[12,4,12,7],[12,10,12,14],[12,17,12,20]].forEach((p) => line(...p)); break;
    case 'zap': poly([13, 2, 5, 14, 11, 14, 10, 22, 19, 9, 13, 9]); break;
    case 'filter': poly([3, 4, 21, 4, 14, 12, 14, 18, 10, 20, 10, 12]); line(8, 8, 16, 8); break;
    case 'package': poly([4, 7, 12, 3, 20, 7, 20, 17, 12, 21, 4, 17]); line(4, 7, 12, 11, 20, 7); line(12, 11, 12, 21); line(8, 5, 16, 9); break;
    case 'archive': g.rect(-8, -5, 16, 13).stroke({ color, width: 1.7 }); g.rect(-9, -8, 18, 4).stroke({ color, width: 1.7 }); line(9, 12, 15, 12); break;
    case 'sprout': line(12, 21, 12, 11); g.moveTo(0, 2).bezierCurveTo(-5, 2, -7, -2, -7, -5).bezierCurveTo(-2, -5, 0, -2, 0, 2); g.moveTo(0, -1).bezierCurveTo(5, -1, 7, -5, 7, -8).bezierCurveTo(2, -8, 0, -5, 0, -1); stroke(g, color); break;
    case 'flask': line(9, 3, 15, 3); g.moveTo(-2, -9).lineTo(-2, -3).lineTo(-7, 6).bezierCurveTo(-8, 8, -6, 9, -4, 9).lineTo(5, 9).bezierCurveTo(8, 9, 8, 7, 7, 6).lineTo(2, -3).lineTo(2, -9); stroke(g, color); line(8, 15, 16, 15); break;
    case 'camp': poly([3, 19, 9, 9, 15, 19]); poly([10, 19, 15, 11, 21, 19]); line(12, 7, 12, 2); line(12, 3, 17, 3, 15, 5, 17, 7, 12, 7); break;
    case 'hole': g.ellipse(0, 1, 9, 6).stroke({ color, width: 1.7 }); g.ellipse(0, 1, 5, 3).stroke({ color, width: 1.7 }); break;
  }
  return holder;
}
