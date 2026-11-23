import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import { seededCornerOrder, type CornerType } from '../../src/content/endgame';
import { getResearchProject } from '../../src/content/research';
import type { GameState, MachineNode } from '../../src/domain/types';
import { worldCornerIds, worldGridSize } from '../../src/domain/worldGrid';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { researchDependencies } from '../../src/ui/researchPresentation';
import type { ResearchMilestone } from '../../src/ui/researchMilestones';
import { eligibleStatusHints } from '../../src/ui/upgrades/statusHints';
import { TUTORIAL_NAMES } from '../../src/tutorials/tutorialRuntime';
import { HINT_REVIEW, type HintReviewEntry } from './hintReview';
import { hintDestination } from './hintNavigation';

/** Preserve the existing review order, including its supporting and legacy entries. */
export const HINT_EXAMPLES = HINT_REVIEW.map((entry, index) => ({ ...entry, name: `${String(index + 1).padStart(2, '0')} · ${entry.title}` }));
export type HintVariant = 'default' | 'production' | 'map-point' | 'pieces';
const CORE_CASES: Record<string, { project: string; title: string }> = {
  basic: { project: 'basicCore', title: 'Basic Core' }, automata: { project: 'automataCore', title: 'Automata Core' },
  hydro: { project: 'hydroCore', title: 'Hydro Core' }, shiny: { project: 'shinyCore', title: 'Shiny Core' },
  complex: { project: 'complexCore', title: 'Complex Core' },
};
const SCOUT_CASES = new Set(['detour', 'lake', 'camp', 'dwarves', 'corners']);
const PATH = ['kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'basicCore', 'exploration', 'road', 'automataCore',
  'fabricatorTools', 'lakeTools', 'hydrochemistry', 'hydraulicAssembly', 'hydroCore', 'fluidRouting', 'suppressionBot',
  'sealedRobotics', 'mithrilTools', 'oreSeparation', 'shinyCore', 'precisionControl', 'complexCore', 'treePlanter', 'finalCore', 'finalCoreProduction', 'victory'];

export function hintExampleVariants(id: string): Array<{ id: HintVariant; name: string }> {
  if (id === 'final') return [{ id: 'pieces', name: 'Pieces ready; halves not assembled' }, { id: 'default', name: 'Both halves ready' }];
  if (CORE_CASES[id]) return [{ id: 'default', name: 'Upgrade still needed' }, { id: 'production', name: 'Recipe unlocked' }];
  if (SCOUT_CASES.has(id)) return [{ id: 'default', name: 'Needs another Map Point' }, { id: 'map-point', name: 'Map Point available' }];
  return [{ id: 'default', name: id === 'tribute' ? 'Legacy world' : 'Current world' }];
}
function node(kind: MachineNode['kind'], extra: Partial<MachineNode> = {}): MachineNode {
  return { id: `hint-study-${kind}`, kind, name: kind, x: 1000, y: 1000, rotation: 0, input: {}, output: {},
    progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0, ...extra };
}
function visit(game: GameState, id: string, ...nodes: MachineNode[]) {
  const [x, y] = id.split(',').map(Number);
  game.sectors[id] = { ...game.sectors['5,5'], id, x, y, unlocked: true, visited: true, nodes, connections: [] };
}
function before(game: GameState, project: string) {
  const index = PATH.indexOf(project);
  if (index < 0) throw new Error(`No progression fixture for ${project}`);
  game.research.completed = [...new Set([...game.research.completed, ...PATH.slice(0, index)])];
  const made = game.produced ??= {};
  if (index >= PATH.indexOf('assembler')) made['simple-core'] = 1;
  for (const [item, unlock] of [['basic-core', 'basicCore'], ['automata-core', 'automataCore'], ['hydro-core', 'hydroCore'],
    ['shiny-core', 'shinyCore'], ['command-core', 'complexCore']] as const) if (index > PATH.indexOf(unlock)) made[item] = 1;
  if (index > PATH.indexOf('refiner')) game.sectors['5,5'].nodes.push(node('researchCenter'));
}
function prerequisites(game: GameState, id: string, seen = new Set<string>()) {
  if (seen.has(id)) return;
  seen.add(id);
  const project = getResearchProject(id);
  if (!project) return;
  for (const dependency of researchDependencies(project)) {
    if (!game.research.completed.includes(dependency)) game.research.completed.push(dependency);
    prerequisites(game, dependency, seen);
  }
}

/** Each row gets a disposable, paused, actually eligible state. No campaign saves. */
export function hintCatalogExample(id: string, variant: HintVariant = 'default') {
  const game = createInitialState(204);
  game.paused = true;
  game.mapResearchMode = 'points';
  game.researchHintHistory = { assignmentAcknowledged: id !== 'assignment', unlocked: [] };
  if (!HINT_REVIEW.some(row => row.id === id)) throw new Error(`Unknown review hint: ${id}`);
  if (CORE_CASES[id]) {
    const core = CORE_CASES[id];
    before(game, core.project);
    if (variant === 'production') game.research.completed.push(core.project);
  } else switch (id) {
    case 'assignment': case 'wood': break;
    case 'copper': before(game, 'smelter'); break;
    case 'fuel': before(game, 'refiner'); break;
    case 'plate': before(game, 'refiner'); game.produced = { charcoal: 1 }; break;
    case 'simple': before(game, 'assembler'); game.produced = {}; break;
    case 'lab': before(game, 'assembler'); game.sectors['5,5'].nodes = game.sectors['5,5'].nodes.filter(n => n.kind !== 'researchCenter'); break;
    case 'iron': case 'assembler': before(game, 'assembler'); break;
    case 'detour': before(game, 'road'); break;
    case 'lake': before(game, 'lakeTools'); break;
    case 'camp': before(game, 'suppressionBot'); break;
    case 'dwarves': case 'guardedMythril': case 'tribute': case 'bot':
      before(game, 'mithrilTools');
      if (id !== 'dwarves') {
        visit(game, '8,6', node('monster-camp', { lizardSettlement: 'camp' }));
        game.encounters = [...new Set([...(game.encounters ?? []), 'monster-camp' as const])];
      }
      if (id === 'tribute') game.worldRulesVersion = 1;
      break;
    case 'complexUpgrade': before(game, 'finalCore'); break;
    case 'final':
      before(game, 'finalCoreProduction');
      game.globalPool = variant === 'pieces' ? { alpha: 1, 'foundry-component': 1, 'reclamation-component': 1, 'grove-component': 1 }
        : { 'core-half-a': 1, 'core-half-b': 1 };
      break;
    case 'corners': before(game, 'finalCoreProduction'); break;
    case 'grove': case 'reclamation': case 'foundry': case 'dragon': {
      before(game, 'finalCoreProduction');
      const types = game.endgame?.cornerOrder ?? seededCornerOrder(game.seed);
      const type = id === 'dragon' ? 'alpha' : id as CornerType;
      visit(game, worldCornerIds(worldGridSize(game))[types.indexOf(type)], node('cornerChallenge', { cornerType: type }));
      break;
    }
    case 'victory': before(game, 'victory'); game.globalPool = { 'final-core': 1 }; break;
    case 'finished': before(game, 'victory'); game.research.completed.push('victory'); break;
    default:
      if (PATH.includes(id)) before(game, id);
      else { before(game, 'precisionControl'); prerequisites(game, id); }
  }
  if (SCOUT_CASES.has(id)) game.research.mapPoints = variant === 'map-point' ? 1 : 0;
  if (SCOUT_CASES.has(id) && variant === 'default') for (const sector of Object.values(game.sectors)) if (sector.unlocked) sector.visited = true;
  game.research.completed = [...new Set(game.research.completed)];
  game.research.unlocked = [...new Set([...game.research.unlocked, ...game.research.completed])];
  return new GameEngine(game, { autosave: false });
}
export function hintExampleClue(game: GameState, id: string, variant: HintVariant = 'default'): ResearchMilestone {
  const row = HINT_REVIEW.find(entry => entry.id === id)!;
  const core = CORE_CASES[id];
  const title = core ? variant === 'production' ? core.title : getResearchProject(core.project)!.name : row.title;
  const live = eligibleStatusHints(game).find(hint => hint.title === title);
  if (!live) throw new Error(`Fixture did not make ${id}/${variant} (${title}) eligible`);
  return live;
}

/** These are author suggestions. Proposed lessons do not masquerade as working practice. */
const SUGGESTIONS: Record<string, { why: string; next: string }> = {
  assignment: { why: 'Basics demonstrates the assignment through one complete production-and-research loop.', next: 'Keep the mission sentence. Test whether newcomers can name the first useful action before adding explanation.' },
  wood: { why: 'Basics teaches placing an Extractor and connecting it to Wood.', next: 'Use the optional invitation rather than placing or highlighting a campaign node.' },
  copper: { why: 'Basics includes Copper extraction and processing.', next: 'Later, offer a Copper entry point with the earlier supply branch ready, if whole-lesson replay feels too long.' },
  fuel: { why: 'Basics demonstrates Wood becoming Charcoal and supplying production.', next: 'Consider a tested Charcoal entry point rather than another explanation modal.' },
  plate: { why: 'Basics teaches the Copper-and-Charcoal route to a Plate.', next: 'A later entry point could start at the Smelter with its two inputs ready.' },
  lab: { why: 'Basics covers building the lab and delivering Simple Cores.', next: 'Consider a lab-only entry point for delivery and actual payments without repeating extraction.' },
  simple: { why: 'Basics demonstrates Copper Gears, Simple Cores and lab delivery.', next: 'Keep the invitation. Avoid a recipe jump that leaves the production chain unexplained.' },
  iron: { why: 'Basics does not teach Iron Wire. An Extractor shortcut would not explain the new chain.', next: 'Propose Iron and Basic Core practice: extraction, Plates, Wire and the actual Core ingredients. Not built.' },
  assembler: { why: 'The next action is a real research choice; focus its card and leave queuing explicit.', next: 'Verify that newcomers connect lab delivery to actual research payments.' },
  basic: { why: 'Focus Simple upgrade before unlock; producing Basic Cores is a separate task afterward.', next: 'Use the proposed Iron and Basic Core lesson for the production phase. Do not point to a completed upgrade.' },
  exploration: { why: 'Focus Exploration research without buying it. Expansion practice unlocks after completion.', next: 'After the real unlock, offer Expansion from relevant clues without another automatic popup.' },
  detour: { why: 'A missing point targets research. With a point, Expansion teaches visiting an outpost.', next: 'Keep the generated compass direction and Landmark mystery; teach travel without revealing the reward.' },
  road: { why: 'Focus Road research and preserve the choice to queue it.', next: 'Use Expansion on later travel clues: a Cart at each end and actual Wood delivery. Do not auto-build a Road.' },
  automata: { why: 'Focus Basic upgrade before unlock; the production chain needs different guidance afterward.', next: 'Propose Automata practice with the actual recipe, Ceramic supply and sustained delivery. Not built.' },
  fabricatorTools: { why: 'Focus Advanced Fabrication and preserve the research decision.', next: 'Teach machine/recipe differences when the first Fabricator is actually built, if testing shows a gap.' },
  lake: { why: 'Expansion teaches unlocking, travel and returning Home; it does not teach fluids.', next: 'Propose local-fluid practice after Lake discovery: Intake, fluid connection and one working consumer. Not built.' },
  hydrochemistry: { why: 'Focus Hydrochemistry rather than opening a distant Lake or placing a node.', next: 'Use the proposed local-fluid lesson at first fluid production, with actual routing restrictions.' },
  hydraulicAssembly: { why: 'Focus Hydraulic Assembly, leaving its bill and queue explicit.', next: 'Extend local-fluid practice to Pistons only if testing shows a transfer gap.' },
  hydro: { why: 'Focus Automata upgrade first; Hydro Core production needs separate guidance after unlock.', next: 'Propose fluid-to-Hydro Core practice covering supply and local fluid routing. Not built.' },
  fluidRouting: { why: 'Focus Fluid Routing research and retain the choice to pay.', next: 'The proposed fluid lesson should distinguish permitted fluid connections from solid transport.' },
  camp: { why: 'Before the first encounter, Expansion teaches scouting. Monster Camps practice is still locked.', next: 'After a real encounter, offer the existing Monster Camps lesson. Do not unlock it early or reveal a hidden camp.' },
  sealedRobotics: { why: 'Focus Sealed Robotics to address the next Bot capability.', next: 'Propose Bot assembly and sustained supply practice. The camp lesson teaches suppression, not the whole production chain.' },
  dwarves: { why: 'Expansion helps with scouting without revealing the settlement; a missing point still targets research.', next: 'After discovery, branch by saved world rules: guarded extraction or legacy Tribute.' },
  guardedMythril: { why: 'Monster Camps rehearses full suppression, but not guarded Mythril extraction.', next: 'Propose guarded-Extractor practice and stopped-supply diagnosis. The existing shortcut is only a suppression refresher.' },
  tribute: { why: 'This is legacy Tribute production; current guarded-extraction instructions would be incorrect.', next: 'Propose legacy-only Tribute help using saved rules. Keep no shortcut until that lesson exists.' },
  bot: { why: 'The camp lesson does not build this frame/cannon recipe. A recipe jump adds little guidance.', next: 'Propose Bot assembly and delivery practice with component shortages and sustained supply. Not built.' },
  oreSeparation: { why: 'Focus Ore Separation research and leave its purchase explicit.', next: 'Teach the real material outputs and supply requirements later, rather than substituting unrelated Basics.' },
  shiny: { why: 'Focus Hydro upgrade before unlock; Shiny production needs Mythril processing guidance afterward.', next: 'Propose Mythril-to-Shiny Core practice after guarded supply. Not built.' },
  precisionControl: { why: 'Focus Precision Control without queuing it.', next: 'Use the already proposed mixed-output lesson afterward: Controllers, Metallic Fines, Filter outlets and waste storage. Not built.' },
  complex: { why: 'Focus Shiny upgrade before unlock. Complex production can expose mixed-output blockages afterward.', next: 'Prioritize mixed-output practice: diagnose a stopped Controller line without prescribing a layout. Not built.' },
  corners: { why: 'Expansion teaches map/travel controls; it does not solve the corner challenges.', next: 'Keep hidden locations and rewards mysterious. Teach each discovered challenge through its own rules and progress.' },
  grove: { why: 'This is a discovered growth challenge, not a missing navigation control.', next: 'Propose optional growth/progress help using its actual counter and delivery rules. Leave layout and reward discovery open.' },
  reclamation: { why: 'No existing lesson teaches the Reclamation intake and waste tradeoffs.', next: 'Extend mixed-output practice with waste delivery and actual intake progress. Waste Bins store waste; they do not destroy it. Not built.' },
  foundry: { why: 'The task coordinates several supplies. A camera jump would not teach that.', next: 'Propose delivery-planning help with actual counts and bottleneck diagnosis, without a complete factory layout.' },
  dragon: { why: 'The task needs sustained Bot presence, beyond the small existing camp lesson.', next: 'Propose strength-and-supply practice. Keep the Dragon reward hidden until earned and leave strategy open.' },
  complexUpgrade: { why: 'Complex upgrade unlocks Yin, Yang and Final Core recipes and reveals the four corner locations.', next: 'Keep this research step before the corner clues. The separate Yin/Yang hints are retired; the Final Core recipe still requires both halves.' },
  final: { why: 'Complex upgrade is complete. The same clue first covers combining the pieces, then Final Core assembly once both halves are present.', next: 'Inspect this world’s half recipes in the recipe guide. Keep the two individual half hints retired; verify the handoff before proposing combination practice.' },
  victory: { why: 'Focus the actual victory project. Core production and character upgrades do not automatically win.', next: 'Keep the explicit queue/payment step and the existing explanation that play can continue after victory.' },
  finished: { why: 'The assignment is complete; there is no missing next action.', next: 'Keep the dry closing line without Show me. A future new-run challenge belongs in an optional menu, never a forced reset.' },
};
export function hintRecommendation(entry: HintReviewEntry, game: GameState, title: string) {
  const suggestion = SUGGESTIONS[entry.id];
  if (!suggestion) throw new Error(`Missing suggestion for ${entry.id}`);
  const destination = hintDestination(game, title);
  const upgrade = destination?.kind === 'research' && BOT_UPGRADES.find(bot => bot.id === destination.id);
  return { ...suggestion, destination,
    label: destination?.kind === 'tutorial' ? `Offer ${TUTORIAL_NAMES[destination.id]} tutorial`
      : destination ? upgrade ? `Focus ${upgrade.label}` : `Focus ${getResearchProject(destination.id)!.name}` : 'Keep clue; no shortcut yet',
    status: destination ? 'Working in this preview' : entry.id === 'finished' ? 'No action recommended' : 'Lesson proposal only' };
}
