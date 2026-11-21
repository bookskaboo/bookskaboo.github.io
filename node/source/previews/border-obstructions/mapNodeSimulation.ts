import { borderTerrainMarkup, BORDER_ART } from '../../src/art/borderObstructionArt';
import { LINE_ART } from '../../src/art/lineArt';
import { BORDER_SIDES, SIDE_LABELS } from '../../src/domain/borderObstructionLayout';
import type { BorderSide, MapBorderLayout } from '../../src/domain/borderObstructionLayout';
import { ROAD_PREVIEW_GAP, roadPreviewCrop, roadPreviewPosition } from '../../src/renderer/roadPreviewCrop';

const FIELD = { x: 140, y: 100, width: 840, height: 560 };
const FACING = { north: 'south', east: 'west', south: 'north', west: 'east' } as const;
const transforms = {
  north: 'matrix(0 .7 1.68 0 140 -145)', south: 'matrix(0 -.7 1.68 0 140 905)',
  west: 'matrix(.7 0 0 1.12 -105 100)', east: 'matrix(.7 0 0 1.12 735 100)',
};
export interface RoadPlacementExample { side: BorderSide; researched: boolean }

function terrain(layout: MapBorderLayout, only?: BorderSide) {
  return BORDER_SIDES.filter(side => !only || side === only).map(side => layout[side] ? `<g data-edge="${side}" transform="${transforms[side]}">${borderTerrainMarkup(layout[side]!)}</g>` : '').join('');
}
function road(x: number, y: number, color: string, facing: string) {
  return `<g data-road-preview="${facing}" transform="translate(${x} ${y})"><rect x="-25" y="-25" width="50" height="50" rx="4" fill="#17222d" stroke="${color}" stroke-width="2"/><g transform="translate(-15 -15) scale(1.25)"><path d="${LINE_ART.road}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></g></g>`;
}
export function mapNodeObstructionSvg(layout: MapBorderLayout, grid = true, placement?: RoadPlacementExample) {
  const rectangle = (x: number, y: number, width: number, height: number) => `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`;
  const summary = BORDER_SIDES.map(side => `${SIDE_LABELS[side]}: ${layout[side] ?? 'clear'}`).join('; ');
  let ghostClip = '', ghost = '', roads = '', minX = 90, minY = 50, maxX = 1030, maxY = 710;
  if (placement) {
    const side = placement.side, facing = FACING[side];
    const crop = roadPreviewCrop(FIELD, facing), position = roadPreviewPosition(facing, FIELD, crop);
    const box = { x: FIELD.x + position.x, y: FIELD.y + position.y, width: crop.width, height: crop.height };
    const dx = side === 'east' ? ROAD_PREVIEW_GAP : side === 'west' ? -ROAD_PREVIEW_GAP : 0;
    const dy = side === 'south' ? ROAD_PREVIEW_GAP : side === 'north' ? -ROAD_PREVIEW_GAP : 0;
    ghostClip = `<clipPath id="sim-ghost-clip">${rectangle(box.x, box.y, box.width, box.height)}</clipPath>`;
    ghost = `<g data-road-ghost="${side}" opacity=".65"><g clip-path="url(#sim-ghost-clip)"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#101923"/>${grid ? `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="url(#sim-grid)"/>` : ''}<g transform="translate(${dx} ${dy})">${terrain(layout, side)}</g></g><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="#77d5ed" stroke-width="2" stroke-dasharray="7 7"/><text x="${box.x + box.width / 2}" y="${box.y + box.height / 2}" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="22" fill="#c5d6df">${SIDE_LABELS[side]} map ghost</text></g>`;
    minX = Math.min(minX, box.x - 40); minY = Math.min(minY, box.y - 40);
    maxX = Math.max(maxX, box.x + box.width + 40); maxY = Math.max(maxY, box.y + box.height + 40);
    const local = { x: side === 'west' ? 165 : side === 'east' ? 955 : 560, y: side === 'north' ? 125 : side === 'south' ? 635 : 380 };
    const remote = { x: side === 'west' ? 67 : side === 'east' ? 1053 : 560, y: side === 'north' ? 27 : side === 'south' ? 733 : 380 };
    const color = !layout[side] || placement.researched ? '#e8ce83' : '#f0a4a4';
    roads = `<g data-road-pair="${side}">${road(local.x, local.y, color, 'local')}${road(remote.x, remote.y, color, 'remote')}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="img" aria-label="Current Map Node: ${summary}${placement ? `; ${SIDE_LABELS[placement.side]} destination ghost visible` : '; clipped to the current play area'}">
  <title>Map Node Road placement simulation</title><desc>Ordinary play clips all terrain to the current field. Only Road placement shows the selected adjacent map ghost and the other half of its obstruction.</desc>
  <defs><clipPath id="sim-current-clip">${rectangle(FIELD.x, FIELD.y, FIELD.width, FIELD.height)}</clipPath>${ghostClip}<pattern id="sim-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#7090a7" stroke-opacity=".14"/></pattern></defs>
  <g data-current-field="true" clip-path="url(#sim-current-clip)"><rect x="140" y="100" width="840" height="560" fill="#101923"/>${grid ? '<rect x="140" y="100" width="840" height="560" fill="url(#sim-grid)"/>' : ''}${terrain(layout)}<g transform="translate(390 440)"><rect x="-38" y="-40" width="76" height="80" fill="#17222d" stroke="#7b969f"/><g transform="translate(-20 -20) scale(1.7)"><path d="${LINE_ART.pickaxe}" fill="none" stroke="#9cc7cb" stroke-width="1.5"/></g></g><text x="560" y="300" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="28" fill="#c5d6df">Current Map Node</text></g>
  <rect x="140" y="100" width="840" height="560" fill="none" stroke="#92b8c7" stroke-width="2"/>${ghost}${roads}</svg>`;
}
export function roadPlacementMessage(layout: MapBorderLayout, placement?: RoadPlacementExample) {
  if (!placement) return 'Normal view: only terrain inside the current play area is visible.';
  const kind = layout[placement.side], art = BORDER_ART.find(entry => entry.id === kind);
  return art && !placement.researched ? `${SIDE_LABELS[placement.side]} Road preview: ${art.tier} crossing research required. The ghost shows the other half of the obstruction.` : `${SIDE_LABELS[placement.side]} Road preview: placement permitted. The adjacent map ghost is visible.`;
}
