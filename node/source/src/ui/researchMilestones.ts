import { CORNER_ITEMS, CORNER_NAMES, FINAL_CORE_PRODUCTION, seededCornerOrder, seededPairIndex, type CornerType } from '../content/endgame';
import { worldCornerIds, worldGridSize } from '../domain/worldGrid';
import { RECIPES } from '../content/recipes';
import { getResearchProject, remainingMapNodePurchases } from '../content/research';
import type { GameState, ItemId, NodeKind } from '../domain/types';
import { researchSection } from './researchPresentation';

export type MilestoneAction =
  | { kind: 'research'; id: string }
  | { kind: 'recipe'; id: string }
  | { kind: 'sector'; id: string }
  | { kind: 'build'; id: NodeKind }
  | { kind: 'map' | 'factory' };

export interface ResearchMilestone {
  title: string;
  detail: string;
  action: MilestoneAction;
}

const goal = (title: string, detail: string, action: MilestoneAction): ResearchMilestone => ({ title, detail, action });
const build = (id: NodeKind, title: string, detail: string) => goal(title, detail, { kind: 'build', id });
const recipe = (id: string, title: string, detail: string) => goal(title, detail, { kind: 'recipe', id });
const research = (id: string, detail: string) => goal(getResearchProject(id)!.name, detail, { kind: 'research', id });
const scout = (title: string, detail: string) => goal(title, detail, { kind: 'map' });

const wood = build('extractor', 'A promising Forest', 'The trees look employable.');
const copper = build('extractor', 'Copper prospects', 'The orange stuff has potential.');
const iron = build('extractor', 'Iron prospects', 'Less decorative. Still useful.');
const fuel = recipe('charcoal', 'Charcoal', 'Wood has a warmer calling.');
const lake = scout('The factory is thirsty', 'A very large puddle would help.');
const camp = scout('The neighbours', 'Somebody else got here first.');
const dwarves = scout('A metallic glint', 'The neighbours farther out seem well supplied.');
const golems = scout('Some rocks have opinions', 'The outer sectors have standing rocks.');
const corners = scout('The four corners', 'The map may have something left to say.');
const automataHint = 'Even circuits need a little masonry.';
const treePlanterHint = 'Forests are a growth industry.';
const heavyRoboticsHint = 'The negotiations are getting heavier.';
const commandRoboticsHint = 'Someone has to look in charge.';
const cornerPriority = ['grove', 'reclamation', 'foundry', 'alpha'] as const;
const cornerClues: Record<CornerType, string> = {
  alpha: 'The Dragon respects a substantial Bot presence.',
  foundry: 'The Foundry has expensive tastes.',
  grove: 'The trees expect growth.',
  reclamation: 'Someone finally wants the waste.',
};

export function getResearchMilestones(game: GameState): ResearchMilestone[] {
  const done = (id: string) => game.research.completed.includes(id);
  if (done('victory')) return [goal('You’ve got this', 'Maybe a speed run next?', { kind: 'factory' })];

  const sectors = Object.values(game.sectors).filter(sector => sector.unlocked);
  const visited = sectors.filter(sector => sector.visited || sector.id === game.activeSectorId);
  const nodes = sectors.flatMap(sector => sector.nodes);
  const stock = { ...game.globalPool };
  const addStock = (item: ItemId, quantity: number) => { stock[item] = (stock[item] ?? 0) + quantity; };
  for (const node of nodes) {
    for (const bag of [node.input, node.output, node.batch?.outputs]) {
      for (const [id, count] of Object.entries(bag ?? {})) addStock(id as ItemId, count ?? 0);
    }
  }
  for (const transfer of game.inFlightTransfers ?? []) if (!transfer.cosmeticOnly) addStock(transfer.item, transfer.amount ?? 1);
  const made = (item: ItemId) => (game.produced?.[item] ?? 0) > 0 || (stock[item] ?? 0) > 0;
  const labInstalled = nodes.some(node => node.kind === 'researchCenter' || node.kind === 'research-center');
  const ready = (id: string) => {
    const project = getResearchProject(id);
    return project && ['available', 'active'].includes(researchSection(project, game));
  };
  const visit = (id: string, title: string, detail: string) => goal(title, detail, { kind: 'sector', id });
  const expansion = (hint: ResearchMilestone): ResearchMilestone => game.research.mapPoints > 0 || visited.length < sectors.length || !remainingMapNodePurchases(game)
    ? hint
    : { ...hint, action: { kind: 'research', id: 'mapNode' } };
  const knownDwarves = visited.flatMap(sector => sector.nodes.filter(node => node.lizardSettlement)
    .map(node => ({ sector, node })));
  const starterCamp = knownDwarves.find(({ node }) => node.lizardSettlement === 'camp');
  const tributeSettlement = starterCamp ?? knownDwarves[0];
  const knownGolem = visited.find(sector => sector.nodes.some(node => node.kind === 'resourceGolem'));
  const golemHint = ready('resourceGolemSurvey')
    ? research('resourceGolemSurvey', 'Some deposits have a defensive posture.')
    : knownGolem && done('resourceGolemSurvey')
      ? visit(knownGolem.id, 'The Golem', 'A stubborn rock. Potentially a permanent one.')
      : expansion(golems);

  const pairIndex = game.endgame?.pairIndex ?? seededPairIndex(game.seed);
  const halves = ['core-half-a', 'core-half-b'] as const;
  const missingHalves = halves.filter(item => !(stock[item] ?? 0)).map(item => RECIPES[`${item}-${pairIndex}`]);
  const cornerOrder = game.endgame?.cornerOrder ?? seededCornerOrder(game.seed);
  const cornersByPosition = worldCornerIds(worldGridSize(game));
  const cornerSector = (type: CornerType) => cornersByPosition[cornerOrder.indexOf(type)];
  const needed = new Set(missingHalves.flatMap(half => Object.keys(half.inputs)));
  const cornerGoal = (type: CornerType): ResearchMilestone => {
    const sectorId = cornerSector(type);
    return visited.some(sector => sector.id === sectorId)
      ? visit(sectorId, CORNER_NAMES[type], cornerClues[type])
      : expansion(corners);
  };
  const isCorner = (milestone: ResearchMilestone | undefined, type: CornerType) =>
    milestone?.action.kind === 'sector' && milestone.action.id === cornerSector(type);
  const cornerWork = cornerPriority.filter(type => needed.has(CORNER_ITEMS[type]) && !(stock[CORNER_ITEMS[type]] ?? 0))
    .map(cornerGoal);
  const knownCornerWork = cornerWork.filter(entry => entry.action.kind === 'sector');
  const halfWork = done('cornerComponents') ? missingHalves.filter(half => Object.keys(half.inputs).every(item => (stock[item as ItemId] ?? 0) > 0))
    .map(half => recipe(half.id, half.name, 'Two pieces seem to agree.')) : [];
  const finalAssembly = recipe('final-core', 'Final Core', 'It’s like they fit together.');
  const lab = build('researchCenter', 'Research Center', 'Home could use a lab.');
  const simple = recipe('simple-core', 'Simple Core', 'Copper Gears have ambitions.');
  const basic = recipe('basic-core', 'Basic Core', 'Iron Wire enters the picture.');
  const complex = recipe('command-core', 'Complex Core', 'The leftovers may have a future.');

  let primary: ResearchMilestone;
  if (done('refiner') && !labInstalled && (made('simple-core') || done('assembler'))) {
    primary = lab;
  } else if (done(FINAL_CORE_PRODUCTION)) {
    primary = research('victory', 'The lab likes a complete set.');
  } else if (!done('kiln')) primary = wood;
  else if (!done('smelter')) primary = copper;
  else if (!done('refiner')) primary = made('charcoal')
    ? recipe('smelt-copper', 'First Plate', 'Ore looks better flat.')
    : fuel;
  else if (!made('simple-core') && !done('assembler')) primary = simple;
  else if (!done('assembler')) primary = research('assembler', 'Simple Cores can open doors.');
  else if (!made('basic-core') && !done('exploration')) primary = basic;
  else if (!done('exploration')) primary = research('exploration', 'There appears to be an outside.');
  else if (!done('road')) primary = research('road', 'Good neighbours exchange freight.');
  else if (!done('automataCore')) primary = research('automataCore', automataHint);
  else if (!made('automata-core') && !done('fabricatorTools')) primary = recipe('automata-core', 'Automata Core', automataHint);
  else if (!done('fabricatorTools')) primary = research('fabricatorTools', 'A bigger machine seems inevitable.');
  else if (!done('lakeTools')) primary = expansion(lake);
  else if (!done('hydrochemistry')) primary = research('hydrochemistry', 'Copper needn’t stay dry.');
  else if (!done('hydraulicAssembly')) primary = research('hydraulicAssembly', 'The Pistons are getting ambitious.');
  else if (!made('hydro-core') && !done('fluidRouting')) primary = recipe('hydro-core', 'Hydro Core', 'The Lake may have a second job.');
  else if (!done('fluidRouting')) primary = research('fluidRouting', 'Fluids have places to be.');
  else if (!done('suppressionBot')) primary = expansion(camp);
  else if (!done('sealedRobotics')) primary = research('sealedRobotics', 'One AP only gets you so far.');
  else if (!done('mithrilTools')) primary = tributeSettlement
    ? visit(tributeSettlement.sector.id, 'Dwarven Tribute', 'The factory’s future depends on their cooperation.')
    : expansion(dwarves);
  else if (!done('oreSeparation')) primary = research('oreSeparation', 'There’s something shiny in there.');
  else if (!made('shiny-core') && !done('precisionControl')) primary = recipe('shiny-core', 'Shiny Core', 'Mythril looks promising in Mesh.');
  else if (!done('precisionControl')) primary = research('precisionControl', 'Complications are now a feature.');
  else if (!made('command-core') && !done('cornerComponents')) primary = complex;
  else if (!done('treePlanter') && isCorner(knownCornerWork[0], 'grove') && !halfWork.length) primary = research('treePlanter', treePlanterHint);
  else primary = halfWork[0] ?? knownCornerWork[0] ?? cornerWork[0] ?? finalAssembly;

  const candidates: ResearchMilestone[] = [primary];
  if (labInstalled && !made('basic-core')) candidates.push(iron);
  if (done('exploration')) {
    if (isCorner(primary, 'alpha')) {
      if (ready('commandRobotics')) candidates.push(research('commandRobotics', commandRoboticsHint));
      else if (ready('heavyRobotics')) candidates.push(research('heavyRobotics', heavyRoboticsHint));
    }
    if (done('hydraulicAssembly') && !done('precisionControl')) candidates.push(golemHint);
    if (!done('lakeTools')) candidates.push(expansion(lake));
    if (done('automataCore') && !done('hydraulicAssembly')) candidates.push(expansion(corners));
    if (!done('suppressionBot')) candidates.push(expansion(camp));
    if (done('sealedRobotics') && !done('mithrilTools')) {
      if (starterCamp) candidates.push(recipe('assemble-bot-f2-g2', 'Suppression Bot 3 AP', 'A steady procession might be persuasive.'));
      else if (!tributeSettlement) candidates.push(expansion(dwarves));
    }
    if (done('precisionControl')) {
      if (!made('command-core')) candidates.push(complex);
      const paid = game.research.selected === 'victory' ? game.research.contributed : game.research.projectContributions?.victory;
      const needFinal = !((stock['final-core'] ?? 0) || (paid?.['final-core'] ?? 0));
      if (needFinal) candidates.push(...halfWork, ...knownCornerWork, ...cornerWork, ...(!missingHalves.length ? [finalAssembly] : []));
      if (!done('cornerComponents')) candidates.push(expansion(corners));
      candidates.push(golemHint);
    }
  }
  for (const [id, detail] of [
    ['road', 'Good neighbours exchange freight.'],
    ['sealedRobotics', 'One AP only gets you so far.'],
    ['fluidRouting', 'Fluids have places to be.'],
    ['oreSeparation', 'There’s something shiny in there.'],
    ['treePlanter', treePlanterHint],
    ['heavyRobotics', heavyRoboticsHint],
    ['commandRobotics', commandRoboticsHint],
    ['trucks', 'The Carts look rather full.'],
    ['roadChannels1', 'That border looks busy.'],
    ['trains', 'The freight is becoming unreasonable.'],
  ] as const) if (ready(id)) candidates.push(research(id, detail));

  if (done('refiner') && !labInstalled) candidates.push(lab);
  if (done('refiner') && !made('simple-core')) candidates.push(simple);
  if (done('assembler') && !made('basic-core')) candidates.push(basic);
  if (ready('assembler')) candidates.push(research('assembler', 'Simple Cores can open doors.'));
  if (ready('exploration')) candidates.push(research('exploration', 'There appears to be an outside.'));
  if (!done('exploration')) candidates.push(wood, copper);
  if (!done('refiner') && !made('charcoal')) candidates.push(fuel);
  const seen = new Set<string>();
  return candidates.filter(entry => !seen.has(entry.title) && seen.add(entry.title)).slice(0, 3);
}
