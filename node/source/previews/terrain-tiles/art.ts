import { LINE_ART } from '../../src/art/lineArt';
import { NAMES, type Terrain } from './model';
import { tileSvg as initialTileSvg } from './initialArt';
import { tileSvg as regularTileSvg } from './regularArt';

export type ArtDraft = 'natural' | 'regular' | 'initial';
export const tileSize = (draft: ArtDraft = 'natural') => draft === 'initial' ? 256 : 768;

export { PALETTE } from '../../src/art/mapTerrainArt';
import { PALETTE, tileSvg as naturalTileSvg } from '../../src/art/mapTerrainArt';
export function tileSvg(kind: Terrain, variant = 0, strength = 1, draft: ArtDraft = 'natural') {
  return draft === 'initial' ? initialTileSvg(kind,variant,strength) : draft === 'regular' ? regularTileSvg(kind,variant,strength) : naturalTileSvg(kind,variant,strength);
}

export function fieldSvg(kind: Terrain, options: { grid: boolean; context: boolean; dense: boolean; strength: number; zoom: number; seed: number; draft?: ArtDraft }) {
  const { grid, context, dense, strength, zoom, seed } = options;
  const p = PALETTE[kind], size = tileSize(options.draft), tile = tileSvg(kind, Math.abs(seed) % 4, strength, options.draft).replace(/<svg[^>]+>|<\/svg>/g, '');
  let nodes = '', cables = '';
  const count = dense ? 30 : 9, cols = dense ? 6 : 3;
  if (context) for (let i = 0; i < count; i++) {
    const x = 115 + (i % cols) * (dense ? 174 : 345), y = 100 + Math.floor(i / cols) * (dense ? 125 : 215);
    const icon = [LINE_ART.pickaxe, LINE_ART.smelter, LINE_ART.cog][i % 3];
    const color = ['#b5a07c','#a9c9d3','#aab9cf'][i % 3];
    const title = ['Extractor', 'Refiner', 'Assembler'][i % 3];
    if (i % cols !== cols-1) cables += `<path d="M${x+112} ${y+32}C${x+145} ${y+32} ${x+140} ${y+32} ${x+(dense?174:345)} ${y+32}" fill="none" stroke="#0b1118" stroke-width="7"/><path d="M${x+112} ${y+32}H${x+(dense?174:345)}" fill="none" stroke="${color}" stroke-width="2.3"/>`;
    nodes += `<g transform="translate(${x} ${y})"><rect width="112" height="65" rx="5" fill="#111b26" stroke="#879aab" stroke-width="1.5"/><path d="${icon}" transform="translate(38 13) scale(1.5)" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="7" y="57" width="98" height="3" fill="#253744"/><rect x="7" y="57" width="${25+(i*17)%70}" height="3" fill="#90b5a2"/><circle cx="0" cy="32" r="4" fill="#101820" stroke="#88c1d0"/><circle cx="112" cy="32" r="4" fill="#101820" stroke="${color}"/>${zoom>=.7?`<text x="56" y="-9" text-anchor="middle" fill="#e2e9ef" font-size="13" font-family="Segoe UI,Arial,sans-serif">${title}</text>`:''}</g>`;
  }
  const w = 1200 / zoom, h = 800 / zoom;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(1200-w)/2} ${(800-h)/2} ${w} ${h}" role="img" aria-label="${NAMES[kind]} ${options.draft==='initial'?'initial marks':options.draft==='regular'?'earlier broad forms':'irregular natural forms'} playfield with ${context ? count+' illustrative Production nodes' : 'terrain only'}"><defs><pattern id="tile-${kind}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${tile}</pattern><pattern id="grid-${kind}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#93a8b8" stroke-opacity=".10" stroke-width=".7"/></pattern></defs><rect x="-1200" y="-800" width="3600" height="2400" fill="${p.base}"/><rect x="-1200" y="-800" width="3600" height="2400" fill="url(#tile-${kind})"/>${grid?`<rect x="-1200" y="-800" width="3600" height="2400" fill="url(#grid-${kind})"/>`:''}${cables}${nodes}<rect x="70" y="55" width="1080" height="650" rx="3" fill="none" stroke="#97adba" stroke-opacity=".3" stroke-dasharray="6 9"/></svg>`;
}
