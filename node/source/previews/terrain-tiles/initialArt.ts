import { LINE_ART } from '../../src/art/lineArt';
import { NAMES, randomFrom, type Terrain } from './model';

export const PALETTE: Record<Terrain, { base: string; patch: string; line: string; accent: string; description: string }> = {
  badlands: { base: '#242025', patch: '#3a2d2e', line: '#77615a', accent: '#c9957f', description: 'Muted clay plates and shallow erosion lines. The trees have declined the invitation.' },
  grassland: { base: '#1e2827', patch: '#293b32', line: '#56745e', accent: '#9bbd94', description: 'Soft ground patches and sparse grass marks. Reasonably cooperative ground.' },
  desert: { base: '#2a2621', patch: '#41392a', line: '#8b7958', accent: '#cdb685', description: 'Broad sand washes and short dune contours. Shade remains a separate project.' },
  rocky: { base: '#24272e', patch: '#353c46', line: '#6e7887', accent: '#a5b2c6', description: 'Flat stone facets and small seams. Geology has supplied extra paperwork.' },
};

/** Seamless 256-unit tile: all marks stay within the tile, with equal edge tone. */
export function tileSvg(kind: Terrain, variant = 0, strength = 1) {
  const p = PALETTE[kind], random = randomFrom(7711 + variant * 919 + Object.keys(PALETTE).indexOf(kind) * 371);
  let shapes = '';
  for (let i = 0; i < 8; i++) {
    const x = 36 + random() * 184, y = 36 + random() * 184, r = 10 + random() * 20;
    if (kind === 'grassland') shapes += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .6}" fill="${p.patch}"/><path d="M${x-3} ${y+4}l-2 -5m4 5l2 -7m1 7l4 -3" fill="none" stroke="${p.line}" stroke-width="1"/>`;
    else if (kind === 'desert') shapes += `<path d="M${x-r} ${y}q${r} ${-r*.5} ${r*2} 0q${-r} ${r*.65} ${-r*2} 0" fill="${p.patch}"/><path d="M${x-r*.7} ${y-2}q${r*.7} ${-r*.35} ${r*1.4} 0" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
    else if (kind === 'rocky') shapes += `<path d="M${x-r} ${y}l${r*.6} ${-r*.55} ${r*1.2} ${r*.15} ${r*.3} ${r*.55} ${-r*1.3} ${r*.3}Z" fill="${p.patch}"/><path d="M${x-r} ${y}l${r*.8} ${r*.12} ${r*.3} ${-r*.5}m${-r*.3} ${r*.5}l${r*.7} ${r*.15}" fill="none" stroke="${p.line}" stroke-width=".9"/>`;
    else shapes += `<path d="M${x-r} ${y-r*.3}l${r*.9} ${-r*.2} ${r*1.1} ${r*.5} ${-r*.3} ${r*.6} ${-r*1.5} ${-r*.1}Z" fill="${p.patch}"/><path d="M${x-r*.5} ${y-r*.15}l${r*.7} ${r*.15} ${r*.3} ${r*.45}m${-r*.3} ${-r*.45}l${r*.5} ${-r*.2}" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="${NAMES[kind]} repeat tile variant ${variant+1}"><rect width="256" height="256" fill="${p.base}"/><g opacity="${Math.max(0, Math.min(2, strength)) * .36}">${shapes}</g></svg>`;
}

export function fieldSvg(kind: Terrain, options: { grid: boolean; context: boolean; dense: boolean; strength: number; zoom: number; seed: number }) {
  const { grid, context, dense, strength, zoom, seed } = options;
  const p = PALETTE[kind], tile = tileSvg(kind, Math.abs(seed) % 4, strength).replace(/<svg[^>]+>|<\/svg>/g, '');
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(1200-w)/2} ${(800-h)/2} ${w} ${h}" role="img" aria-label="${NAMES[kind]} playfield art with ${context ? count+' illustrative Production nodes' : 'terrain only'}"><defs><pattern id="tile-${kind}" width="256" height="256" patternUnits="userSpaceOnUse">${tile}</pattern><pattern id="grid-${kind}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#93a8b8" stroke-opacity=".10" stroke-width=".7"/></pattern></defs><rect x="-1200" y="-800" width="3600" height="2400" fill="${p.base}"/><rect x="-1200" y="-800" width="3600" height="2400" fill="url(#tile-${kind})"/>${grid?`<rect x="-1200" y="-800" width="3600" height="2400" fill="url(#grid-${kind})"/>`:''}${cables}${nodes}<rect x="70" y="55" width="1080" height="650" rx="3" fill="none" stroke="#97adba" stroke-opacity=".3" stroke-dasharray="6 9"/></svg>`;
}
