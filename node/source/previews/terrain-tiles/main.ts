import { TERRAINS, NAMES, CAP, FOREST_RATE, WORLD_SIZES, DEFAULT_QUADRANT_WEIGHT, QUADRANT_NAMES, stockExample, terrainWorld, terrainCounts, terrainCoordinate, fixedGrasslandIndices, quadrantPreferences, quadrantSummary, terrainQuadrant, quadrantEntrySites, fixedTerrainSites, type Terrain, type Resource } from './model';
import { PALETTE, fieldSvg, tileSvg, tileSize, type ArtDraft } from './art';
import '../../src/styles/readability.css';
import './preview.css';

const root = document.querySelector<HTMLElement>('#root')!;
root.innerHTML = `
<header class="masthead"><span class="wordmark">NODE <small>Another Factory Game</small></span><span class="badge">Proposal · local review</span></header>
<section class="intro"><div><h1>Map terrain tiles and spawning rules</h1><p>Four quiet surfaces for the whole Map Node playfield. The factory should remain the most distracting thing here.</p></div><p class="scope">Implemented locally for new games<br>Existing saves retain previous rules</p></section>
<nav aria-label="Proposal sections"><a href="#art">Art test pages</a><a href="#rules">Resource rules</a><a href="#spawning">Game start spawning</a><a href="#delivery">Implementation proposal</a></nav>
<section id="art"><header class="section-heading"><h2>Art test pages</h2><span>Irregular forms · selected proposal artwork</span></header>
<div class="terrain-tabs" role="group" aria-label="Terrain test page">${TERRAINS.map(t=>`<button data-terrain="${t}" aria-pressed="false">${NAMES[t]}</button>`).join('')}<button id="compare" aria-pressed="false">Compare all four</button></div>
<div class="toolbar"><label>Shape draft <select id="draft" aria-label="Shape draft"><option value="natural">Irregular natural forms</option><option value="regular">Earlier broad forms</option><option value="initial">Initial small marks</option></select></label><label><input id="grid" type="checkbox" checked> 32-unit grid</label><label><input id="context" type="checkbox" checked> Production nodes and cables</label><label><input id="dense" type="checkbox"> Dense layout</label><label>Zoom <select id="zoom"><option value="1">100%</option><option value="0.5">50%</option><option value="1.5">150%</option></select></label><label>Detail strength <select id="strength"><option value="1">Quiet default</option><option value="0.5">Half detail</option><option value="2">Stress comparison</option></select></label></div>
<div id="art-fields" class="fields"></div>
<p class="note">Illustrative Production nodes, sockets and cables sit above the terrain and grid. No art shape blocks building. The revised draft varies shape size, spacing and direction within a 768-unit repeat. Earlier broad forms and initial 256-unit marks remain available for comparison. Each draft has four variants per terrain. These are art specimens, not a running game.</p>
<details><summary>Tile sheet and seams</summary><p>Four variants per terrain, then a repeated field. Revised ground forms wrap across tile edges; the initial marks keep plain edge tones. Decorative cracks and grass are painted ground, not resource nodes.</p><div id="tiles" class="tiles"></div></details>
</section>
<section id="rules"><header class="section-heading"><h2>Resource rules</h2><span>Adopted new-game rules</span></header>
<p>Percentages multiply the capacity expected under current rules. They apply to starting stock and the lasting reserve maximum, not node count or extraction speed. Your Badlands correction is recorded as 50% of expected capacity.</p>
<div class="table-scroll"><table><caption>Terrain multipliers</caption><thead><tr><th scope="col">Terrain</th><th scope="col">Forest stock and cap</th><th scope="col">Forest regeneration</th><th scope="col">Stone, Copper, Iron</th><th scope="col">Eligible Mythril</th></tr></thead><tbody>${TERRAINS.map(t=>`<tr><th scope="row">${NAMES[t]}</th><td>${t==='badlands'?'No Forest spawn':CAP[t].forest*100+'%'}</td><td>${t==='badlands'?'Not applicable':FOREST_RATE[t]*100+'% of default'}</td><td>${CAP[t].mineral*100}% stock and cap</td><td>${CAP[t].mineral*100}% stock and cap</td></tr>`).join('')}</tbody></table></div>
<p class="note">Mythril appears only where the existing rules supply it, including its linked Dwarven settlement. Terrain creates no new Mythril source. Mineral regeneration and suppression rates stay unchanged. Lakes, infinite Golem reserves and player-created Drill deposits keep their current rules.</p>
<div class="calculator"><h3>Starting reserve example</h3><div class="toolbar"><label>Map tier <select id="tier">${Array.from({length:10},(_,i)=>`<option value="${i}" ${i===4?'selected':''}>${i===0?'Home':i}</option>`).join('')}</select></label><label><input id="dwarven" type="checkbox" checked> Applicable Dwarven settlement</label></div><p id="baseline"></p><div id="example"></div><p class="note">Base-game analytical example. The Dwarven switch controls Mythril eligibility only; it does not place a settlement. Home has no Dwarven settlement. Corner maps are shown in the spawning specimen and retain their current resource exclusions.</p></div>
</section>
<section id="spawning"><header class="section-heading"><h2>Game start spawning</h2><span>Seeded and fixed for the save</span></header>
<p>Home and all four corners are Grassland. Keep 31 Grassland, 30 Badlands, 30 Desert and 30 Rocky maps in the standard 11 × 11 world. Home, corners and the four first-diagonal sites count toward these quotas; weighted placement fills the remaining 112 maps.</p>
<p>Larger supported worlds keep the same proportions and guaranteed placements. At 21 × 21, use 111 Grassland and 110 each of the other terrains. Select a world size to inspect the complete assignment.</p>
<p>Each quadrant slightly favors the terrain associated with its seeded corner encounter: Badlands for Ancient Dragon, Grassland for Elder Grove, Desert for Ancient Reclamation and Rocky for Ancient Foundry. Preferred terrain has ${DEFAULT_QUADRANT_WEIGHT}× placement weight for the remaining maps. N1.W1, N1.E1, S1.W1 and S1.E1 are guaranteed to use their quadrant’s preferred terrain. All fixed placements count toward the exact world quotas.</p>
<p class="note">With equal remaining quotas, 1.5× gives the preferred terrain one-third of the draw weight. Fixed sites and exact quotas affect actual quadrant shares.</p><div class="world-layout"><div><div class="toolbar"><label>World size <select id="world-size" aria-label="World size">${WORLD_SIZES.map(size=>`<option value="${size}">${size} × ${size}</option>`).join('')}</select></label><label>Quadrant bias <select id="quadrant-weight" aria-label="Quadrant bias"><option value="${DEFAULT_QUADRANT_WEIGHT}">${DEFAULT_QUADRANT_WEIGHT}× + guaranteed entries</option><option value="1">Earlier unbiased layout</option></select></label><label>World seed <input id="seed" type="number" value="2718" min="0" max="4294967295" step="1"></label><button id="generate">Preview seed</button><button id="export">Download rule snapshot</button></div><div id="world" class="world" aria-label="Full terrain assignment author review"></div></div><aside><h3>Assignment check</h3><p id="world-summary" role="status" aria-live="polite"></p><div class="legend">${TERRAINS.map(t=>`<span><i style="background:${PALETTE[t].accent}"></i>${NAMES[t]}</span>`).join('')}</div><h3>Quadrant tendencies</h3><ul id="quadrant-summary" class="quadrant-summary"></ul><p>Counts cover the full quadrant, including fixed sites. Gold-inset cells mark guaranteed first diagonals in the adopted rule. The center row and column use neutral weights. Earlier unbiased layout restores the previous assignment without entry guarantees.</p><p>H is Home. C marks the four corners. Labels: B Badlands, G Grassland, D Desert, R Rocky.</p><p>Author review shows every assignment. Player terrain stays hidden until first visit, including purchased but unvisited maps.</p></aside></div>
<ol class="steps"><li>Compute existing special-map and encounter assignments unchanged, with their existing seed stream.</li><li>Use a separate terrain seed stream. Reserve Home/corners, shuffle placement order and draw from the remaining quotas with the preferred quadrant terrain weighted ${DEFAULT_QUADRANT_WEIGHT}× after fixing the four first-diagonal sites. Center axes use neutral weights.</li><li>Store the terrain rule version and complete assignment, with corner mapping in saved endgame state at game creation. Later exploration reads that assignment; it never rerolls terrain.</li><li>When creating a sector, apply the saved terrain to eligible starting reserves and the Forest rate. Preserve existing exclusions, guarded links and suppression rules.</li><li>Keep art variation deterministic and separate from resource placement. Reload, imports, travel, undo and delayed exploration must preserve the result.</li></ol>
<p class="note">The specimen demonstrates terrain assignment and arithmetic only, for every supported odd size from 11 × 11 through 21 × 21. The real engine review runs the current generator and renderer. Normal-play balance and solvability review remain separate.</p>
</section>
<section id="delivery"><header class="section-heading"><h2>Implementation</h2><span>Local runtime integration complete</span></header>
<div class="delivery-grid"><article><h3>Rendering</h3><p>Use one terrain per Map Node across the entire field, including Area Expansion. Layer ground beneath the grid; keep completed-hole ground and border terrain beneath cables, node bodies, sockets and interaction feedback. Keep the art static and cache repeated tiles.</p><p>Keep tile contrast below the grid and factory connections. Check all four variants at several zoom levels, crowded sockets, placement ghosts, warnings and the three border types.</p></article><article><h3>Resources and compatibility</h3><p>Apply the terrain multiplier after the current map/mod baseline, rounded once to whole reserve units. An absent resource stays absent. Treat zero-cap Forests as no spawn. Apply the Forest multiplier to the default natural regeneration rate, then retain research/mod rate multipliers.</p><p>Preserve paid Tree Planter output and costs. Existing saves keep their current rules everywhere, including unexplored maps. New terrain applies only to new games. Training keeps legacy ground. Starting reserves use mod baselines before terrain factors; later mod application preserves existing stocks and caps.</p></article><article><h3>Acceptance before delivery</h3><p>Verify exact counts, five fixed Grassland maps, stable seed results, changed-seed variation, zero Badlands Forests and the full capacity matrix. Test guarded minerals and resource exclusions, save/load and future exploration, the legacy boundary and field expansion.</p><p>Run a multi-seed progression and border-layout sweep, then normal gameplay for Desert Wood and early Badlands supply. Preserve successful factory branches and export resource totals and elapsed game time. This proposal is not balance evidence.</p></article><article><h3>Integration and validation</h3><p>The current irregular artwork and quiet default detail are selected for this proposal. Both earlier drafts remain available through Shape draft. New-game generation, full-field art, save compatibility, whole-unit rounding, natural Forest rate composition and mod baseline precedence are integrated locally. The real engine review compares generated reserves with legacy generation. Normal-play balance validation remains pending. The terrain distribution, artwork, discovery and larger-world scaling reviews are complete.</p><p>The starting stock/cap matrix, standard-world quotas, Home/corner Grassland and new-games-only compatibility are recorded design decisions.</p></article></div>
</section>
<footer>NODE terrain author review · local artifact · browser saves untouched <span id="review-state" role="status"></span></footer>`;

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let terrain: Terrain = TERRAINS.includes(location.hash.slice(1) as Terrain) ? location.hash.slice(1) as Terrain : 'grassland';
let compare = false, seed = 2718, worldSize = 11, quadrantWeight = DEFAULT_QUADRANT_WEIGHT;
const input = (id: string) => byId<HTMLInputElement>(id);
function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function refreshArt() {
  document.querySelectorAll<HTMLButtonElement>('[data-terrain]').forEach(b=>b.setAttribute('aria-pressed', String(!compare && b.dataset.terrain===terrain)));
  byId('compare').setAttribute('aria-pressed', String(compare));
  const kinds = compare ? TERRAINS : [terrain];
  const draft = input('draft').value as ArtDraft;
  byId('art-fields').classList.toggle('comparison', compare);
  byId('art-fields').innerHTML = kinds.map(t=>`<article class="field-card"><header><h3>${NAMES[t]}</h3><button data-download="${t}">Download tile SVG</button></header>${fieldSvg(t,{ grid:input('grid').checked,context:input('context').checked,dense:input('dense').checked,strength:Math.min(2,Number(input('strength').value)),zoom:Number(input('zoom').value),seed,draft })}<p>${draft==='initial'?'Initial small repeated marks · retained for comparison.':draft==='regular'?'Earlier broad forms · retained for comparison.':PALETTE[t].description}</p></article>`).join('');
  byId('tiles').innerHTML = kinds.map(t=>`<article><h3>${NAMES[t]}</h3><div class="tile-row">${[0,1,2,3].map(v=>tileSvg(t,v,1,draft)).join('')}</div><p>Variants 1–4 · ${tileSize(draft)} × ${tileSize(draft)} world units</p></article>`).join('');
}
function refreshExample() {
  const tier = Number(input('tier').value), baseline = 1000 + tier * 500;
  input('dwarven').disabled = tier===0;
  const dwarven = tier>0 && input('dwarven').checked;
  byId('baseline').textContent = `Expected unmodified capacity at ${tier===0?'Home':'tier '+tier}: ${baseline.toLocaleString()}. Starting stock equals the adjusted cap.`;
  const kinds: readonly Terrain[] = tier===0 ? ['grassland'] : TERRAINS;
  byId('example').innerHTML = `<div class="table-scroll"><table><thead><tr><th scope="col">Terrain</th>${['Forest','Stone','Copper','Iron','Mythril'].map(s=>`<th scope="col">${s}</th>`).join('')}<th scope="col">Natural Forest refill</th></tr></thead><tbody>${kinds.map(t=>`<tr><th scope="row">${NAMES[t]}</th>${(['forest','stone','copper','iron','mythril'] as Resource[]).map(r=>`<td>${tier===0&&r==='stone'?'No spawn':stockExample(t,r,baseline,dwarven)?.toLocaleString()??'No spawn'}</td>`).join('')}<td>${t==='badlands'?'No Forest':`1 Wood / ${30/FOREST_RATE[t]} seconds`}</td></tr>`).join('')}</tbody></table></div>`;
}
function refreshWorld() {
  const raw = Number(input('seed').value);
  if (!Number.isInteger(raw) || raw<0 || raw>4294967295 || input('seed').value==='') {
    byId('review-state').textContent = 'Enter a whole-number seed from 0 to 4294967295.'; return;
  }
  seed = raw;
  worldSize = Number(input('world-size').value);
  quadrantWeight = Number(input('quadrant-weight').value);
  const world = terrainWorld(seed,worldSize,quadrantWeight), home = Math.floor(world.length/2),preferences=quadrantPreferences(seed);
  const corners = new Set(fixedGrasslandIndices(worldSize).filter(i=>i!==home));
  const entries=quadrantWeight===1?[]:quadrantEntrySites(seed,worldSize);
  const entryMap=new Map(entries.map(site=>[site.index,site]));
  byId('world').style.gridTemplateColumns = `repeat(${worldSize},minmax(0,1fr))`;
  byId('world').innerHTML = world.map((t,i)=>{
    const {x,y}=terrainCoordinate(i,worldSize),quadrant=terrainQuadrant(i,worldSize);
    const entry=entryMap.get(i);
    const suffix=i===home?'Home':corners.has(i)?`Corner · ${preferences.find(p=>p.quadrant===quadrant)!.name}`:entry?`Guaranteed first diagonal ${entry.position} · ${entry.name}`:'';
    return `<span class="world-cell${entry?' guaranteed-entry':''}" style="--tile-color:${PALETTE[t].accent};--ground:${PALETTE[t].base}" title="${x},${y}: ${NAMES[t]}${suffix?' · '+suffix:''}" aria-label="${x},${y} ${NAMES[t]}${suffix?' '+suffix:''}">${i===home?'H':corners.has(i)?'C':NAMES[t][0]}</span>`;
  }).join('');
  byId('world-summary').textContent = `Seed ${seed}. ${worldSize} × ${worldSize} · ${world.length} maps: ${TERRAINS.map(t=>`${world.filter(x=>x===t).length} ${NAMES[t]}`).join(', ')}. Home and four corners: Grassland. ${quadrantWeight===1?'Earlier unbiased comparison.':`${quadrantWeight}× preferred quadrant weight; four first diagonals guaranteed.`}`;
  byId('quadrant-summary').innerHTML=quadrantSummary(seed,worldSize,world,quadrantWeight!==1).map(p=>`<li><span>${QUADRANT_NAMES[p.quadrant]} · ${p.name}</span><span>${NAMES[p.terrain]} · ${p.totalPreferred} / ${p.totalMaps} quadrant maps</span>${p.guaranteedEntry?`<span>${p.guaranteedEntry.position}: guaranteed ${NAMES[p.terrain]}</span>`:''}</li>`).join('');
  byId('review-state').textContent = 'Seed preview updated. Game saves untouched.';
  refreshArt();
}
root.addEventListener('click', event=>{
  const button = (event.target as Element).closest<HTMLButtonElement>('button'); if(!button) return;
  if(button.dataset.terrain){ terrain=button.dataset.terrain as Terrain; compare=false; history.replaceState(null,'',`#${terrain}`); refreshArt(); }
  if(button.id==='compare'){ compare=true; refreshArt(); }
  if(button.dataset.download) download(`node-${button.dataset.download}-${input('draft').value==='natural'?'irregular':input('draft').value}-tile.svg`,tileSvg(button.dataset.download as Terrain,seed%4,1,input('draft').value as ArtDraft),'image/svg+xml');
  if(button.id==='generate') refreshWorld();
  if(button.id==='export') download(`node-terrain-proposal-v4-${worldSize}x${worldSize}-${quadrantWeight===1?'unbiased':'quadrant-entries'}-${seed}.json`,JSON.stringify({ status:'Agreed design; runtime integration pending', version:'proposal-4', worldGridSize:worldSize, home:'5,5', artSelection:{draft:'irregular-natural',scope:'Selected proposal artwork; game integration pending',detail:'quiet-default'}, seed, quadrantBias:{preferredWeight:quadrantWeight,otherWeight:1,centerAxes:'neutral',mapping:quadrantPreferences(seed),guaranteedEntries:quadrantWeight===1?[]:quadrantEntrySites(seed,worldSize),observed:quadrantSummary(seed,worldSize,terrainWorld(seed,worldSize,quadrantWeight),quadrantWeight!==1),rule:quadrantWeight===1?'uniform-comparison':'quadrant-weighted-entries-1'}, capacityMultipliers:CAP, forestRateMultipliers:FOREST_RATE, counts:terrainCounts(worldSize), fixedAssignments:fixedTerrainSites(seed,worldSize,quadrantWeight!==1),fixedGrassland:fixedTerrainSites(seed,worldSize,quadrantWeight!==1).filter(site=>site.terrain==='grassland').map(site=>`${site.x},${site.y}`), assignment:terrainWorld(seed,worldSize,quadrantWeight).map((t,i)=>({...terrainCoordinate(i,worldSize),terrain:t})), scope:'New games only; existing saves preserved', terrainDiscovery:'hidden-until-first-visit', authorPreview:'full-assignment-visible', exclusions:['Lakes','Infinite Golem reserves','Player-created Drill deposits'], mythril:'Existing eligible sources only; linked Dwarven settlement required for guarded Mythril', mineralRegeneration:'Unchanged', note:'Terrain/resource analytical specimen; not game generation or balance evidence'},null,2),'application/json');
});
for (const id of ['draft','grid','context','dense','zoom','strength']) byId(id).addEventListener('change',refreshArt);
for (const id of ['tier','dwarven']) byId(id).addEventListener('change',refreshExample);
input('seed').addEventListener('keydown',e=>{if(e.key==='Enter')refreshWorld();});
byId('world-size').addEventListener('change',refreshWorld);
byId('quadrant-weight').addEventListener('change',refreshWorld);
refreshWorld(); refreshExample();
