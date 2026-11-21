import { LINE_ART } from './lineArt';

/** Shared flat outlined terrain artwork for the game and reference screens. */
export type BorderTerrain = 'river' | 'mountain' | 'chasm';
export const BORDER_ART = [
  { id: 'river', name: 'Rivers', tier: 'Hydro', count: 16, color: '#77d5ed', description: 'Water, banks, and an inconvenient direction of travel.', detail: 'A continuous watercourse with irregular banks and quiet current marks.' },
  { id: 'mountain', name: 'Mountains', tier: 'Shiny', count: 12, color: '#c4c9d4', description: 'The landscape has declined to be flat.', detail: 'An interlocking ridge of angular rock, with shaded faces and fine contour lines.' },
  { id: 'chasm', name: 'Chasms', tier: 'Complex', count: 8, color: '#b6a0d5', description: 'A considerable shortage of ground.', detail: 'A deep, dark fracture edged by broken stone and descending cliff contours.' },
] as const;

const path = (d: string, fill: string, stroke: string, width = 2, extra = '') => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const poly = (points: number[][], fill: string, stroke: string, width = 2) => path(`M${points.map(p => p.join(',')).join('L')}Z`, fill, stroke, width);

function river() {
  const left = 'M292 -20C253 34 307 75 283 125S303 214 276 267S299 350 277 410S306 480 282 520';
  const right = 'C430 466 382 420 409 369S391 287 418 237S394 151 420 102S391 27 423 -20';
  const bank = `${left}L404 520${right}Z`;
  let art = path(bank, '#253f43', '#65877c', 2.4);
  art += path('M310 -20C271 34 325 75 301 125S321 214 294 267S317 350 295 410S324 480 300 520L386 520C412 466 364 420 391 369S373 287 400 237S376 151 402 102S373 27 405 -20Z', '#153947', '#77b5c2', 2.2);
  art += path('M327 -20C288 34 342 75 318 125S338 214 311 267S334 350 312 410S341 480 317 520L370 520C396 466 348 420 375 369S357 287 384 237S360 151 386 102S357 27 389 -20Z', '#1c4858', 'none');
  for (let i = 0; i < 12; i++) {
    const y = i * 46 - 12, x = 344 + Math.sin(i * 1.75) * 12;
    art += path(`M${x} ${y}q-10 12 -3 23t-2 19`, 'none', '#78c2d0', 1.6, 'opacity=".54"');
    if (i % 2 === 0) art += path(`M${x + 23} ${y + 17}q-5 9 -1 18`, 'none', '#a1dfdf', 1.5, 'opacity=".42"');
  }
  for (let i = 0; i < 13; i++) {
    const y = i * 42 + 3, x = i % 2 ? 428 : 267;
    art += poly([[x, y], [x + 9, y - 4], [x + 16, y + 4], [x + 5, y + 9]], '#354849', '#729085', 1.4);
    art += path(`M${x - 11} ${y + 19}l-4 -9m4 9l5 -6`, 'none', '#65897c', 1.6);
  }
  return art;
}

function mountain() {
  let art = path('M286 -20L425 -20L445 52L426 103L450 157L429 219L449 281L427 347L446 409L425 520H279L263 457L282 395L264 333L282 272L262 205L281 142L265 77Z', '#252f3a', '#566273', 2.3);
  for (let i = -1; i < 7; i++) {
    const y = i * 92 + 36, x = 354 + (i % 2 ? -13 : 13);
    art += poly([[x - 72, y + 65], [x - 46, y + 11], [x - 22, y - 8], [x + 4, y - 49], [x + 30, y - 10], [x + 51, y + 8], [x + 80, y + 68], [x + 28, y + 82], [x - 20, y + 71]], '#45505f', '#95a1af', 2.2);
    art += poly([[x + 4, y - 49], [x + 14, y + 13], [x + 80, y + 68], [x + 28, y + 82], [x - 3, y + 32]], '#2d3746', '#69768a', 1.5);
    art += path(`M${x + 4} ${y - 49}l-8 33 -18 8m26 -8l15 12m-41 -4l-5 31 -23 38m44 -29l-20 33 -22 12m89 -9l-24 -12 -10 -16`, 'none', '#b4bfca', 1.5, 'opacity=".7"');
    art += path(`M${x - 63} ${y + 66}l20 -31 10 -3m69 33l-10 -17`, 'none', '#78889c', 1.5);
  }
  return art;
}

function chasm() {
  const l: number[][] = [], r: number[][] = [];
  for (let i = 0; i <= 20; i++) {
    const y = -20 + i * 27;
    l.push([299 + Math.sin(i * 2.4) * 17 + Math.cos(i * .7) * 9, y]);
    r.push([404 + Math.sin(i * 1.8) * 16 + Math.cos(i * .6) * 9, y]);
  }
  let art = poly([...l.map(([x, y]) => [x - 18, y]), ...[...r].reverse().map(([x, y]) => [x + 18, y])], '#33333f', '#7a738a', 2.3);
  art += poly([...l, ...[...r].reverse()], '#1c1c2a', '#b1a3bc', 2);
  art += poly([...l.map(([x, y]) => [x + 23, y + 8]), ...[...r].reverse().map(([x, y]) => [x - 24, y + 8])], '#090c15', '#51485f', 1.3);
  for (let i = 1; i < l.length - 1; i++) {
    const [x, y] = l[i], [rx, ry] = r[i];
    art += path(`M${x} ${y}l18 12 -3 18m${rx - x - 15} -30l-17 17 1 13`, 'none', '#6c617d', 1.4);
    if (i % 3 === 0) {
      art += path(`M${x - 3} ${y}l-16 -8 -6 -17m6 17l-21 6M${rx + 3} ${ry}l15 9 15 -8`, 'none', '#918497', 1.6);
      art += poly([[x - 28, y + 15], [x - 17, y + 13], [x - 12, y + 24], [x - 25, y + 27]], '#44414d', '#8c8396', 1.3);
    }
  }
  return art;
}

function nearbyNodes() {
  return [135, 565].map((x, index) => `<g transform="translate(${x} 250)" opacity=".85">
    <path d="M-52 -57H52V57H-52Z" fill="#17222d" stroke="#7b969f" stroke-width="2"/>
    <path d="M-52 -31H52" stroke="#7b969f" opacity=".55"/>
    <text x="0" y="-39" fill="#d8e5e9" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="15">${index ? 'Smelter' : 'Extractor'}</text>
    <g transform="translate(-22 -19) scale(1.85)">${path(LINE_ART[index ? 'smelter' : 'pickaxe'], 'none', '#9cc7cb', 1.5)}</g>
    <circle cx="${index ? -52 : 52}" cy="13" r="6" fill="#111b25" stroke="#d2ab79" stroke-width="2"/>
    <path d="M-42 46H42" stroke="#5f7d7c" stroke-width="3"/>
  </g>`).join('');
}

export function borderObstructionSvg(kind: BorderTerrain, options: { grid?: boolean; context?: boolean } = {}) {
  const metadata = BORDER_ART.find(art => art.id === kind)!;
  const art = kind === 'river' ? river() : kind === 'mountain' ? mountain() : chasm();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 500" width="700" height="500" role="img" aria-label="${metadata.name} across a shared map border">
    <title>${metadata.name} border art</title><desc>${metadata.detail} Research permits ordinary Road nodes on this terrain.</desc>
    <defs><pattern id="field-grid-${kind}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#7090a7" stroke-opacity=".12" stroke-width="1"/></pattern></defs>
    <rect width="700" height="500" fill="#101923"/>
    ${options.grid === false ? '' : `<rect width="700" height="500" fill="url(#field-grid-${kind})"/>`}
    <path d="M350 0V500" stroke="#8b9dac" stroke-dasharray="4 10" opacity=".2"/>
    <g>${art}</g>${options.context ? nearbyNodes() : ''}
  </svg>`;
}

/** Canonical shared terrain strip; the field renderer owns clipping and placement. */
export function borderTerrainMarkup(kind: BorderTerrain) {
  return kind === 'river' ? river() : kind === 'mountain' ? mountain() : chasm();
}
