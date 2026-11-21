import { LINE_ART } from '../../src/art/lineArt';
import { NAMES, randomFrom, type Terrain } from './model';
import { tileSvg as initialTileSvg } from './initialArt';

export type ArtDraft = 'natural' | 'initial';
export const tileSize = (draft: ArtDraft = 'natural') => draft === 'natural' ? 768 : 256;

export const PALETTE: Record<Terrain, { base: string; patch: string; line: string; accent: string; description: string }> = {
  badlands: { base: '#242025', patch: '#3a2d2e', line: '#77615a', accent: '#c9957f', description: 'Connected clay cracks across broad, weathered plates. The trees have declined the invitation.' },
  grassland: { base: '#1e2827', patch: '#293b32', line: '#56745e', accent: '#9bbd94', description: 'Sprawling grass patches with a few quiet blades. Reasonably cooperative ground.' },
  desert: { base: '#2a2621', patch: '#41392a', line: '#8b7958', accent: '#cdb685', description: 'Long, soft dune contours across open sand. Shade remains a separate project.' },
  rocky: { base: '#24272e', patch: '#353c46', line: '#6e7887', accent: '#a5b2c6', description: 'Joined stone slabs with broad, flat facets. Geology has supplied extra paperwork.' },
};

/** Periodic 768-unit ground forms. Wrapped copies continue across every tile edge. */
export function tileSvg(kind: Terrain, variant = 0, strength = 1, draft: ArtDraft = 'natural') {
  if (draft === 'initial') return initialTileSvg(kind, variant, strength);
  const p = PALETTE[kind], random = randomFrom(7711 + variant * 919 + Object.keys(PALETTE).indexOf(kind) * 371);
  const point = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  let shapes = '';
  if (kind === 'grassland') {
    for (let i=0;i<4;i++) {
      const x = random()*768, y = random()*768, rx = 145+random()*115, ry = 100+random()*65;
      const d = `M${point(x-rx,y)}C${point(x-rx*.9,y-ry*.8)} ${point(x-rx*.25,y-ry*.35)} ${point(x+rx*.1,y-ry)}S${point(x+rx*1.1,y-ry*.3)} ${point(x+rx,y+ry*.2)}S${point(x+rx*.15,y+ry*.65)} ${point(x-rx*.25,y+ry)}S${point(x-rx*1.15,y+ry*.55)} ${point(x-rx,y)}Z`;
      shapes += `<path d="${d}" fill="${p.patch}" opacity=".85"/>`;
      for(let blade=0;blade<3;blade++) {
        const bx=x-rx*.6+blade*rx*.65, by=y+ry*.3+random()*25;
        shapes += `<path d="M${point(bx-6,by)}q-5 -4 -7 -11m8 11q1 -10 6 -16m-2 16q6 -7 12 -8" fill="none" stroke="${p.line}" stroke-width="1.2" opacity=".5"/>`;
      }
    }
  } else if (kind === 'desert') {
    for(let i=0;i<3;i++) {
      const y=75+i*256+(random()-.5)*55, a=40+random()*38, depth=55+random()*35;
      const wave=(offset:number)=>`M0 ${y+offset}C128 ${y-a+offset} 256 ${y-a+offset} 384 ${y+offset}S640 ${y+a+offset} 768 ${y+offset}`;
      shapes += `<path d="${wave(0)}L768 ${y+depth}C640 ${y+a+depth} 512 ${y+a+depth} 384 ${y+depth}S128 ${y-a+depth} 0 ${y+depth}Z" fill="${p.patch}" opacity=".65"/><path d="${wave(0)}" fill="none" stroke="${p.line}" stroke-width="1.5" opacity=".65"/><path d="${wave(depth*.38)}" fill="none" stroke="${p.line}" stroke-width=".8" opacity=".17"/>`;
    }
  } else {
    const junctions = Array.from({length:9},(_,i)=>({x:(i%3)*256+(random()-.5)*130,y:Math.floor(i/3)*256+(random()-.5)*130}));
    const at=(col:number,row:number)=>{const a=junctions[((row%3+3)%3)*3+(col%3+3)%3];return {x:a.x+Math.floor(col/3)*768,y:a.y+Math.floor(row/3)*768};};
    for(let row=0;row<3;row++) for(let col=0;col<3;col++) {
      const a=at(col,row),b=at(col+1,row),c=at(col+1,row+1),d=at(col,row+1);
      const cx=(a.x+b.x+c.x+d.x)/4,cy=(a.y+b.y+c.y+d.y)/4;
      shapes += `<path d="M${point(a.x,a.y)}L${point(b.x,b.y)} ${point(c.x,c.y)} ${point(d.x,d.y)}Z" fill="${p.patch}" opacity="${.18+random()*.45}"/>`;
      if(kind==='badlands') {
        shapes += `<path d="M${point(a.x,a.y)}L${point((a.x+b.x)*.5,(a.y+b.y)*.5+12)} ${point(b.x,b.y)}M${point(a.x,a.y)}L${point((a.x+d.x)*.5+15,(a.y+d.y)*.5)} ${point(d.x,d.y)}M${point(a.x,a.y)}L${point(cx-25,cy-18)} ${point(cx+5,cy+48)}m-30 -66l45 -24" fill="none" stroke="${p.line}" stroke-width="1.6" opacity=".6" stroke-linejoin="round"/>`;
      } else {
        shapes += `<path d="M${point(a.x,a.y)}L${point(b.x,b.y)} ${point(c.x,c.y)} ${point(d.x,d.y)}Z" fill="none" stroke="${p.line}" stroke-width="1.5" opacity=".45"/><path d="M${point(a.x,a.y)}L${point(cx+35,cy-10)} ${point(c.x,c.y)}Z" fill="${p.line}" opacity=".09"/><path d="M${point(b.x,b.y)}L${point(cx+35,cy-10)} ${point(d.x,d.y)}" fill="none" stroke="${p.line}" stroke-width="1" opacity=".3"/>`;
      }
    }
  }
  const wrapped=[-768,0,768].flatMap(x=>[-768,0,768].map(y=>`<g transform="translate(${x} ${y})">${shapes}</g>`)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768" width="768" height="768" role="img" aria-label="${NAMES[kind]} broad natural ground tile variant ${variant+1}"><rect width="768" height="768" fill="${p.base}"/><g opacity="${Math.max(0, Math.min(2, strength)) * .36}">${wrapped}</g></svg>`;
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(1200-w)/2} ${(800-h)/2} ${w} ${h}" role="img" aria-label="${NAMES[kind]} ${options.draft==='initial'?'initial marks':'broad ground forms'} playfield with ${context ? count+' illustrative Production nodes' : 'terrain only'}"><defs><pattern id="tile-${kind}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${tile}</pattern><pattern id="grid-${kind}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#93a8b8" stroke-opacity=".10" stroke-width=".7"/></pattern></defs><rect x="-1200" y="-800" width="3600" height="2400" fill="${p.base}"/><rect x="-1200" y="-800" width="3600" height="2400" fill="url(#tile-${kind})"/>${grid?`<rect x="-1200" y="-800" width="3600" height="2400" fill="url(#grid-${kind})"/>`:''}${cables}${nodes}<rect x="70" y="55" width="1080" height="650" rx="3" fill="none" stroke="#97adba" stroke-opacity=".3" stroke-dasharray="6 9"/></svg>`;
}
