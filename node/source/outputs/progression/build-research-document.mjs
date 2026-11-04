import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const load = (path, bindings, exports) => {
  const source = fs.readFileSync(path, 'utf8');
  const js = stripTypeScriptTypes(source)
    .replace(/^import .*?;\s*$/gm, '').replace(/\bexport /g, '');
  return new Function(...Object.keys(bindings), js + '\nreturn {' + exports.join(',') + '};')(...Object.values(bindings));
};
const late = load('src/content/progression.ts', {}, ['LATE_RESEARCH', 'LATE_RECIPES', 'LATE_NODES']);
const { RESEARCH_PROJECTS: projects, getResearchCosts } = load('src/content/research.ts', late, ['RESEARCH_PROJECTS', 'getResearchCosts']);
const names = new Map(projects.map(p => [p.id, p.name]));
const coreNames = ['Simple', 'Basic', 'Automata', 'Hydro', 'Shiny', 'Complex'];
const coreIds = coreNames.map(n => n.toLowerCase() + '-core');
const prerequisites = p => [...new Set([p.prerequisite, ...(p.prerequisites ?? [])].filter(Boolean))].map(id => names.get(id) ?? id).join(' + ') || 'None specified';
const cost = p => {
  const entries = Object.entries(getResearchCosts(p));
  if (!entries.length) return 'Free milestone';
  const highest = Math.max(...entries.map(([id]) => coreIds.indexOf(id)));
  return entries[0][1] + ' each through ' + coreNames[highest];
};
const overrides = {
  lakeTools: 'Lake Intake, Hydro Processor, Coolant and local fluid links; visit a map containing a Lake.',
  mithrilTools: 'Separation Furnace, Refined Mythril and Slag Hopper; visit a map containing Mythril.',
  sortingTools: 'Waste Sorter, Waste Hopper and Waste Link from a Sorting Station encounter; also granted by Precision Control as a fallback.',
  hydrochemistry: 'Copper–Carbon Dispersion recipe.',
  hydraulicAssembly: 'Hydraulic Actuator, Ceramic Electrode and Hydro Core recipes.',
  fluidRouting: 'Fluid Road and Fluid Storage for inter-map fluid logistics.',
  sealedRobotics: 'Sealed Frame, Cooled Gun and Medium Suppression Bot recipes.',
  oreSeparation: 'Mythril Mesh and Shiny Core recipes.',
  mineralRecovery: 'Slag washing, Recovered Brick and Recovered Iron recipes.',
  pressureSystems: 'Lake Intake output increases from 4 to 8 Water/s.',
  heavyRobotics: 'Mythril Frame, Focused Gun and Heavy Suppression Bot recipes.',
  precisionControl: 'Logic Substrate, Precision Controller, Advanced Actuator and Complex Core; advanced recovery recipes and Waste Handling fallback.',
  autonomousLogistics: 'Storage and Inventory use one global transfer pool. Inventory initially outputs through Filters. Pool capacity is currently 1,000 per item.',
  commandRobotics: 'Servo Frame, Pulse Cannon and Command Suppression Bot recipes.',
  mineralRegeneration: 'Ordinary non-wood deposits recover 1 unit every 30 seconds up to capacity. Depleted deposits remain after this unlock; existing Deep Holes are not restored.',
  mineralRegeneration2: 'Ordinary mineral recovery improves to 1 unit every 15 seconds and opens repeatable rate research.',
  highPressureIntakes: 'Lake Intake output increases to 16 Water/s.',
  endgameTheory: 'Implemented research checkpoint marking access to future tier 7. The tier 7 core, research tree and final objective are not implemented.',
};
const effect = p => overrides[p.id] ?? p.unlock ?? p.description;
const clean = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const table = (headers, rows) => [headers, headers.map(() => '---'), ...rows].map(r => '| ' + r.map(clean).join(' | ') + ' |').join('\n');
const milestones = projects.filter(p => p.trigger);
const repeatables = projects.filter(p => p.repeatable);
const fixed = projects.filter(p => !p.trigger && !p.repeatable);
const earlyIds = new Set(['assembler', 'fabricatorTools', 'exploration', 'road', 'automataCore', 'treePlanter', 'miningDrill', 'areaExpansion1']);
const sections = [];
sections.push('Updated November 1, 2026. Factorinode currently has six core types and ' + projects.length + ' research entries: ' + milestones.length + ' free milestones and discoveries, ' + fixed.length + ' fixed paid projects, and ' + repeatables.length + ' repeatable projects. Tier 7 research remains planned. This catalog includes every live entry, its requirements and its effect, followed by the remaining planned research.');
sections.push('# Research rules\n\nA price of **2 each through Hydro** means 2 Simple + 2 Basic + 2 Automata + 2 Hydro Cores. Every successful Research Center cycle consumes one of every required core together; the slowest missing core stream stops progress. The single Research Center is anchored at Home. Its base cycle is one second; its six upgrades use 90%, 80%, 70%, 60%, 50% and 40% of base time.\n\nCore production follows Simple → Basic → Automata → Hydro → Shiny → Complex → future endgame core. Cores never consume other cores as ingredients. Research opening a new core uses the preceding available core tiers. Listed prerequisites are explicit research requirements; production also needs the appropriate machines, recipes, discoveries and material supply.');
sections.push('# Core progression\n\n' + table(['Core tier', 'Access', 'Status'], [
  ['1 Simple', 'Refiner milestone grants the recipe', 'Implemented'],
  ['2 Basic', 'Assembler production; no separate Basic Core research', 'Implemented'],
  ['3 Automata', 'Automata Core research', 'Implemented'],
  ['4 Hydro', 'Hydraulic Assembly after Hydrochemistry; Water Tools for processing', 'Implemented'],
  ['5 Shiny', 'Ore Separation; Mythril Refining discovery for processing', 'Implemented'],
  ['6 Complex', 'Precision Control; Advanced Fabrication for assembly', 'Implemented; Complex Core is the canonical name'],
  ['7 Endgame core', 'Endgame Theory is the current entry checkpoint', 'Core name, recipe and full progression undecided'],
]));
const landmarks = { lake: 'a Lake', mythril: 'a Mythril Deposit', sortingStation: 'a Derelict Sorting Station' };
sections.push('# Implemented milestones and discoveries\n\nThese entries consume no cores. Discoveries require visiting the relevant map; Precision Control also grants Waste Handling.\n\n' + table(['Research', 'Completion condition', 'Unlock or benefit'], milestones.map(p => [p.name, p.trigger.id === 'encounter' ? 'Encounter ' + p.trigger.kinds.map(k => landmarks[k] ?? k).join(', ') + ' in a visited map' : p.trigger.pending, effect(p)])));
const fixedTable = ps => table(['Research', 'Core cost', 'Research prerequisites', 'Unlock or benefit'], ps.map(p => [p.name, cost(p), prerequisites(p), effect(p)]));
sections.push('# Implemented access and expansion research\n\n' + fixedTable(fixed.filter(p => earlyIds.has(p.id))));
sections.push('# Implemented advanced progression\n\nEndgame Theory is a research checkpoint; completing it does not provide a playable tier 7 chain or victory condition.\n\n' + fixedTable(fixed.filter(p => !earlyIds.has(p.id) && p.category === 'Progression')));
sections.push('# Implemented efficiency and logistics research\n\nCycle upgrades replace the earlier speed factor unless the effect explicitly says otherwise. Their costs can use earlier core tiers even when the prerequisites are later in progression.\n\n' + fixedTable(fixed.filter(p => !earlyIds.has(p.id) && p.category !== 'Progression')));
sections.push('# Implemented repeatable research\n\n' + table(['Research', 'First rank cost', 'Research prerequisites', 'Benefit per completion'], repeatables.map(p => [p.name, cost(p), prerequisites(p), effect(p)])) + '\n\nFor the five repeatables other than Map Node, rank r costs **ceil(base × 1.5^(r−1)) of each required core**. Base 40 gives 40, 60, 90, 135, 203 each for ranks 1–5; base 50 gives 50, 75, 113, 169, 254. These have no maximum rank.\n\nMap Node follows a separate curve. Completions 1–3 cost 5, 10 and 15 each of Simple and Basic. Completion 4 adds Automata and resets all three costs to 10 each. Later costs rise by 5 per completion to 105 each at completion 23, then remain at 105 each. Each completion awards one Map Point.');
sections.push('# Planned tier 7 research\n\nThe following entries are retained from the design proposal and are absent from the live research catalog. Prices are sample design values.\n\n' + table(['Research or design item', 'Status and proposed cost', 'Intended benefit and unresolved decisions'], [
  ['Endgame core and research chain', 'Planned; name, recipe, costs and dependencies undecided', 'Build on Endgame Theory. Define regional inputs and sustainable map output so endgame factory coverage follows from production requirements.'],
  ['Global Pool Item Capacity', 'Planned repeatable; sample first rank 50 each through tier 7, growing by 1.5 per rank with rounding up', 'Increase per-item capacity of the shared Storage/Inventory pool indefinitely. Capacity gain per rank and whether upgrades affect all or selected items remain open. Live starting capacity is 1,000 per item.'],
  ['Automatic Inventory Selection', 'Candidate; sample 150 each through tier 7', 'Permit direct Inventory connections to infer an exact configured destination input. Ambiguous ports still require a Filter. Research versus a world or endgame condition remains undecided.'],
  ['Monster Node Assault', 'Candidate; sample 30 each through tier 7', 'Prepare access or targeting for world-map tier 10 Monster Nodes. Combat deliveries must defeat the targets; research alone does not win. Target count, strength, victory conditions and exact access gate remain open.'],
]));
sections.push('# Remaining progression decisions\n\n- Define the tier 7 core, regional specialization, full research tree and final combat objective.\n- Set Global Pool Item Capacity gains and item scope; decide how Automatic Inventory Selection unlocks.\n- Decide whether special world-tier-10 access research or research-bundled survey rewards are needed. These are options rather than additional approved catalog entries.\n- Calibrate costs and geography with playthroughs. Saved targets are tier 6 completion including tier 7 access within three hours for perfect play, 20–30 hours to endgame for efficient play, 37–60 productive maps at minimum throughput and about 109 at maximum. These remain design targets.\n- Keep the separate higher-cost one-hour speedrun candidate outside the live prices unless explicitly adopted.');
sections.push('# Changes since the earlier proposal\n\nHydro, Shiny and Complex chains, machine upgrades, logistics upgrades, regeneration and the five late repeatables are now implemented. Advanced Fabrication is paid research costing 2 Simple + 2 Basic Cores after Assembler; an Abandoned Fabricator encounter does not grant it. Resource Golem Survey now reveals four mineral Golems in separate tier 6 sectors; each takes 10,000 AP once and becomes an infinite reserve with four Extractor sockets. Road channel upgrades are live; the current catalog describes each channel as one item per five seconds, while the earlier proposal described whole-chest batches. Their channel counts are two and then four per direction.');
sections.push('# Sources\n\nLive snapshot: `src/content/research.ts`, `src/content/progression.ts`, `src/content/recipes.ts`, `src/simulation/progression.ts` and `src/simulation/engine.ts` in the Node Factory v2 project. Live implementation takes precedence over older proposal wording.\n\nPlanned research and open decisions: [Research Core Progression and Bot Upgrade Proposal](https://chatgpt.com/space/page_3f63cbe142508191a73e41bc10b7f530). Progression targets: `README.md`.');
const plannedUpgrades = fs.readFileSync('outputs/progression/research-upgrade-plan.md', 'utf8').trim();
sections.splice(sections.findIndex(s => s.startsWith('# Planned tier 7 research')), 0, plannedUpgrades);
sections[0] = sections[0].replace('Tier 7 research remains planned.', 'Nine machine research lines now have six ranks through Complex; tier 7 research remains planned.');
const efficiencyIndex = sections.findIndex(s => s.startsWith('# Implemented efficiency and logistics research'));
sections[efficiencyIndex] = sections[efficiencyIndex].replace('Their costs can use earlier core tiers even when the prerequisites are later in progression.', 'Their costs can use earlier core tiers even when the prerequisites are later in progression. The nine machine lines extend through Complex with six ranks each, as detailed below.');
const mapResearch = fs.readFileSync('outputs/progression/map-expansion-proposal.md', 'utf8').trim();
for (let i = 0; i < sections.length; i++) {
  if (sections[i].startsWith('# Implemented access and expansion research')) sections[i] = sections[i].split('\n').filter(line => !line.startsWith('| Exploration |')).join('\n');
  if (sections[i].startsWith('# Implemented repeatable research')) sections[i] = sections[i].split('\n').filter(line => !line.startsWith('| Map Node |')).join('\n').replace(/\n\nMap Node follows[\s\S]*$/, '');
}
sections.splice(sections.findIndex(s => s.startsWith('# Core progression')) + 1, 0, mapResearch);

const seen = [...milestones, ...fixed.filter(p=>earlyIds.has(p.id)), ...fixed.filter(p=>!earlyIds.has(p.id)&&p.category==='Progression'), ...fixed.filter(p=>!earlyIds.has(p.id)&&p.category!=='Progression'), ...repeatables];
if (seen.length !== projects.length || new Set(seen.map(p=>p.id)).size !== projects.length) throw new Error('Catalog coverage mismatch');
fs.writeFileSync('docs/research-catalog.md', '# Factorinode Current and Planned Research\n\n' + sections.join('\n\n') + '\n');
fs.writeFileSync('outputs/progression/research-document.json', JSON.stringify({title:'Factorinode Current and Planned Research', sections, counts:{total:projects.length,milestones:milestones.length,fixed:fixed.length,repeatables:repeatables.length}}, null, 2));
console.log(JSON.stringify({total:projects.length,milestones:milestones.length,fixed:fixed.length,repeatables:repeatables.length,coverage:'Every live research entry appears exactly once'}));
