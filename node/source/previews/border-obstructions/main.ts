import { BORDER_ART, borderObstructionSvg } from '../../src/art/borderObstructionArt';
import { mapNodeObstructionSvg, roadPlacementMessage } from './mapNodeSimulation';
import type { BorderTerrain } from '../../src/art/borderObstructionArt';
import { BORDER_SIDES, SIDE_LABELS, trySetBorder } from '../../src/domain/borderObstructionLayout';
import type { BorderObstruction, BorderSide, MapBorderLayout } from '../../src/domain/borderObstructionLayout';
import '../../src/styles/readability.css';
import './preview.css';

const root = document.querySelector<HTMLElement>('#root')!;
root.innerHTML = `
<header class="page-heading"><a class="wordmark" href="../../docs/art-preview.html">NODE<span>Another Factory Game</span></a><span class="study-label">Border art study</span></header>
<section class="intro"><div><h1>The landscape has objections</h1><p>Rivers, mountains and chasms along the edges of Map Nodes.</p></div><p class="scope">Shared game artwork<br><span><a href="./runtime.html">Real engine test</a></span></p></section>
<nav class="review-controls"><a href="./map-modal.html">Open Node Map modal test</a></nav>
<section class="map-simulation" aria-labelledby="map-sim-title"><header><h2 id="map-sim-title">Map Node simulation</h2><span>Opposite sides are allowed. Adjacent sides are blocked.</span></header>
  <div class="map-sim-layout"><div id="map-sim-field"></div><div class="map-sim-controls"><p>Choose the obstruction on each side.</p>
  ${BORDER_SIDES.map(side => `<label>${SIDE_LABELS[side]}<select data-sim-side="${side}" aria-label="${SIDE_LABELS[side]} obstruction"><option value="">Clear</option><option value="river">River</option><option value="mountain">Mountain</option><option value="chasm">Chasm</option></select></label>`).join('')}
  <p id="map-sim-message" role="status" aria-live="polite"></p>
  <div class="road-preview-controls"><button id="road-preview-toggle" aria-pressed="false">Place Road</button><label>Edge<select id="road-preview-side" aria-label="Road placement edge" disabled>${BORDER_SIDES.map(side => `<option value="${side}" ${side === 'east' ? 'selected' : ''}>${SIDE_LABELS[side]}</option>`).join('')}</select></label><label class="research-example"><input id="road-preview-researched" type="checkbox" disabled> Crossing research complete</label><p id="road-preview-message" role="status" aria-live="polite"></p></div></div></div>
  <p class="sim-scope">Normal view shows only the current play area. Place Road reveals the adjacent map ghost and its matching half of the obstruction. Terrain keeps its existing width. Isolated layout simulation.</p>
</section>
<div class="review-controls" aria-label="Artwork display"><p>Inspect the terrain on the factory field.</p><div><label><input id="grid" type="checkbox" checked> Field grid</label><label><input id="context" type="checkbox"> Nearby nodes</label></div></div>
<div class="gallery">${BORDER_ART.map(art => `<section class="terrain" style="--accent:${art.color}" aria-labelledby="${art.id}-title">
  <header><h2 id="${art.id}-title">${art.name}</h2><span class="core-badge">${art.tier}</span></header>
  <p class="flavor">${art.description}</p>
  <button class="artwork" data-enlarge="${art.id}" aria-label="Enlarge ${art.name.toLowerCase()} artwork"><span class="art" data-art="${art.id}"></span><span class="enlarge-label">Enlarge art</span></button>
  <p class="terrain-detail">${art.detail}</p>
  <div class="terrain-footer"><span>${art.count} shared borders</span><button class="download" data-download="${art.id}">Download SVG</button></div>
</section>`).join('')}</div>
<section class="placement-rule"><h2>Road placement</h2><p>Each obstruction covers a whole shared border. Research permanently permits ordinary Road nodes on that terrain worldwide. Road channels work as usual, with no extra crossing fee or upkeep.</p><p class="rule-note">The terrain stays visible. No separate crossing artwork is required.</p></section>
<footer class="page-footer"><span>36 of 220 shared borders · 16.4% of the standard map</span><a href="../../docs/master-plan/21-border-obstructions.md">Design plan</a></footer>
<dialog aria-labelledby="detail-title"><header><h2 id="detail-title"></h2><button id="close-detail" aria-label="Close artwork">Close</button></header><div id="detail-art"></div><p id="detail-copy"></p></dialog>`;

const grid = document.querySelector<HTMLInputElement>('#grid')!;
const context = document.querySelector<HTMLInputElement>('#context')!;
const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
let borders: MapBorderLayout = { north: null, east: 'river', south: null, west: 'mountain' };
let placingRoad = false;
const roadSide = document.querySelector<HTMLSelectElement>('#road-preview-side')!;
const roadResearched = document.querySelector<HTMLInputElement>('#road-preview-researched')!;
const roadToggle = document.querySelector<HTMLButtonElement>('#road-preview-toggle')!;
function renderMap() {
  const placement = placingRoad ? { side: roadSide.value as BorderSide, researched: roadResearched.checked } : undefined;
  document.querySelector('#map-sim-field')!.innerHTML = mapNodeObstructionSvg(borders, grid.checked, placement);
  document.querySelector('#road-preview-message')!.textContent = roadPlacementMessage(borders, placement);
  document.querySelectorAll<HTMLSelectElement>('[data-sim-side]').forEach(select => { select.value = borders[select.dataset.simSide as BorderSide] ?? ''; });
}
roadToggle.addEventListener('click', () => {
  placingRoad = !placingRoad;
  roadToggle.textContent = placingRoad ? 'Cancel Road placement' : 'Place Road';
  roadToggle.setAttribute('aria-pressed', String(placingRoad));
  roadSide.disabled = roadResearched.disabled = !placingRoad;
  renderMap();
});
roadSide.addEventListener('change', renderMap);
roadResearched.addEventListener('change', renderMap);
root.addEventListener('change', event => {
  const select = (event.target as Element).closest<HTMLSelectElement>('[data-sim-side]');
  if (!select) return;
  const side = select.dataset.simSide as BorderSide, value = (select.value || null) as BorderObstruction | null;
  const attempt = trySetBorder(borders, side, value), message = document.querySelector<HTMLElement>('#map-sim-message')!;
  if (attempt.accepted) {
    borders = attempt.layout;
    message.textContent = `${SIDE_LABELS[side]}: ${value ?? 'clear'}. Layout allowed.`;
    message.classList.remove('rejected');
  } else {
    message.textContent = `${SIDE_LABELS[side]} and ${SIDE_LABELS[attempt.conflict]} would form a right angle. Clear the adjacent obstruction first.`;
    message.classList.add('rejected');
  }
  renderMap();
});
document.querySelector('#map-sim-message')!.textContent = 'East: River. West: Mountain. North and South remain clear.';
let selected: BorderTerrain = 'river';
const artwork = (kind: BorderTerrain) => borderObstructionSvg(kind, { grid: grid.checked, context: context.checked });
function refresh() {
  document.querySelectorAll<HTMLElement>('[data-art]').forEach(el => { el.innerHTML = artwork(el.dataset.art as BorderTerrain); });
  if (dialog.open) document.querySelector('#detail-art')!.innerHTML = artwork(selected);
  renderMap();
}
grid.addEventListener('change', refresh);
context.addEventListener('change', refresh);
root.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-enlarge],[data-download]');
  if (!target) return;
  const kind = (target.dataset.enlarge ?? target.dataset.download) as BorderTerrain;
  if (target.dataset.enlarge) {
    selected = kind;
    const art = BORDER_ART.find(a => a.id === kind)!;
    document.querySelector('#detail-title')!.textContent = art.name;
    document.querySelector('#detail-art')!.innerHTML = artwork(kind);
    document.querySelector('#detail-copy')!.textContent = `${art.tier} research allows ordinary Road nodes on this terrain. ${art.count} borders on the standard map.`;
    dialog.showModal();
  } else {
    const url = URL.createObjectURL(new Blob([artwork(kind)], { type: 'image/svg+xml' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `node-${kind}-border.svg`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
document.querySelector('#close-detail')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
refresh();
