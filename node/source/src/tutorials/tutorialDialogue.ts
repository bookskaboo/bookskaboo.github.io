import { GUIDED_TUTORIAL_COPY, type GuidedTutorialStage } from './originalTutorials';
import { TUTORIAL_CORE_COST, type TutorialStage } from './tutorialDefinitions';

const corePayment = `${TUTORIAL_CORE_COST} Simple ${TUTORIAL_CORE_COST === 1 ? 'Core' : 'Cores'}`;

const adaptations: Partial<Record<TutorialStage, Partial<{ title: string; body: string; instruction: string }>>> = {
  'expansion-intro': {
    title: 'Bring Wood Home',
    body: 'Roads need a Cart, Truck, or Train directly connected at each end. Road and Exploration are already researched. You have 1 Map Point.',
    instruction: 'Continue to set up the delivery.',
  },
  'expansion-map-open': {
    title: 'Open the Node Map',
    body: 'Exploration grants your first Map Point. Research Extra Map Point to earn more.',
    instruction: 'Open Map or press Shift + M.',
  },
  'expansion-activate': {
    title: 'Activate the outpost',
    body: 'The Wood outpost is W1, west of Home. Activation spends 1 Map Point.',
    instruction: 'Select W1, then click Activate node.',
  },
  'expansion-travel': {
    title: 'Visit the outpost',
    body: 'Travel between activated maps is free. A rare administrative success.',
    instruction: 'Click Travel to node.',
  },
  'expansion-return': {
    title: 'Return Home',
    body: 'The outpost fills its Cart while you travel. A Cart holds 20 solid items.',
    instruction: 'Open Map, select H, then click Travel to node.',
  },
  'expansion-outpost': {
    title: 'Return to the sending map',
    body: 'A Road initially sends from the map where you place it.',
    instruction: 'Open Map and travel to W1.',
  },
  'expansion-road-place': {
    title: 'Build a Road pair',
    body: 'Both endpoints need clear space. In your factory, right-click either Road to reverse the route. This disconnects both endpoints’ cables; reconnect them for the new direction.',
    instruction: 'Open Build, choose Road, and place it at the highlighted east edge.',
  },
  'expansion-road-feed': {
    title: 'Connect the sending Cart',
    body: 'The Cart’s arrow points toward its output socket. Put Filters or Joints before the Cart. Wood waits here until the receiving Cart has room.',
    instruction: 'Drag directly from the Cart output to the Road input.',
  },
  'expansion-home-receive': {
    title: 'Find the receiving Cart',
    body: 'The paired Road is on Home’s west edge beside an empty Cart.',
    instruction: 'Open Map and travel to H.',
  },
  'expansion-deliver': {
    title: 'Unload into the Home Cart',
    body: 'The arrow’s tail marks the input side. Put routing nodes after the Cart. At Cart level the Road moves one item every five seconds.',
    instruction: 'Drag directly from the Road output to the Cart input.',
  },
  'expansion-complete': {
    title: 'Wood reached the Home Cart',
    body: 'Each Road pair carries one solid material. Truck and Train upgrades raise capacity and freight rates.',
    instruction: '',
  },
  'build-open': {
    title: 'Make your first Simple Core',
    body: 'Use Wood and Copper to make Simple Cores, then spend them on Assembler research.',
    instruction: 'Open Build.',
  },
  'build-explain': {
    body: 'Nodes are free to build. The layout is your responsibility.',
    instruction: 'Select Extractor in Build.',
  },
  'build-place': {
    body: 'Press Escape or right-click to cancel placement.',
    instruction: 'Place the Extractor on the highlighted spot.',
  },
  'research-explain': {
    body: 'Milestones such as your first cable unlock research without spending Cores.',
    instruction: 'Find Joint under Completed Research.',
  },
  'make-charcoal': {
    title: 'Make Charcoal',
    body: 'Your first Wood unlocks the Kiln. It makes fuel for the Smelter.',
    instruction: 'Build a Kiln, connect the Wood Extractor directly to it, and wait for Charcoal.',
  },
  'mine-copper': {
    title: 'Gather Copper',
    body: 'Like the Forest, the Copper deposit needs its own Extractor.',
    instruction: 'Place a second Extractor and connect the Copper deposit to it.',
  },
  'make-plates': {
    title: 'Smelt Copper Plates',
    body: 'The Smelter has a separate input for each ingredient.',
    instruction: 'Build a Smelter and choose Copper Plate. Connect Copper from the Extractor and Charcoal from the Kiln to their matching inputs.',
  },
  'make-gears': {
    title: 'Refine Copper Gears',
    body: 'Each Gear takes 2 Copper Plates.',
    instruction: 'Build a Refiner, choose Copper Gear under Gear, and connect the Smelter to it.',
  },
  'make-core': {
    title: 'Make a Simple Core',
    body: 'A Simple Core takes 2 Copper Gears.',
    instruction: 'Build a second Refiner, choose Simple Core, and connect the Gear Refiner to it.',
  },
  'build-lab': {
    title: 'You made a Simple Core',
    body: 'Your first Copper Plate unlocked Research Center.',
    instruction: 'Build a Research Center at the target.',
  },
  'deliver-core': {
    title: 'Deliver a Core',
    body: 'The Research Center stores Cores until a project needs them.',
    instruction: 'Connect the Core Refiner to the Research Center and wait for a delivery.',
  },
  'cores-open': {
    body: `Assembler costs ${corePayment}. Your factory supplies them through the Research Center.`,
    instruction: 'Open the highlighted Assembler card and click Start Assembler research.',
  },
  'cores-explain': {
    body: `The Center processes ${corePayment} one at a time. Even science has a queue.`,
    instruction: 'Wait for the Core payment. Resume the simulation if paused.',
  },
  'cores-complete': {
    body: 'Research Basic Core next. Exploration needs both Simple and Basic Cores.',
    instruction: 'Continue to review the shortcut bars.',
  },
  shortcuts: { instruction: 'Inspect the shortcut bars, then continue.' },
  'options-explain': {
    body: 'In your factory, Options has Commands for controls, Recipes for ingredients, and Tutorials for practice.',
    instruction: '',
  },
  'logistics-joint-connect': {
    body: 'A Joint bends a cable. Its input and output share the center socket.',
    instruction: 'Connect Forest → Joint → Extractor.',
  },
  'logistics-joint-move': {
    body: 'The cables stay attached when the Joint moves.',
    instruction: 'Hover over the Joint, then drag its six-dot grip to the target.',
  },
  'logistics-joint-complete': {
    body: 'The item keeps its original travel time through the Joint.',
    instruction: 'Continue to practice with Splitters.',
  },
  'logistics-splitter-rotate': {
    title: 'Rotate the Splitter',
    body: 'Its sockets turn and the cables follow.',
    instruction: 'Right-click the connected Splitter once.',
  },
  'logistics-merger-rotate': {
    title: 'Rotate the Merger',
    body: 'Both inputs and the output rotate together.',
    instruction: 'Right-click the connected Merger once.',
  },
  'logistics-splitter-produce': {
    title: 'Check both branches',
    body: 'Both routes need to deliver Wood before the Kilns can make Charcoal.',
    instruction: 'Wait for both Kilns to produce Charcoal.',
  },
  'logistics-merger-produce': {
    title: 'Check the merged stream',
    body: 'The matching streams feed one Kiln. It still expects Wood.',
    instruction: 'Wait for the Kiln to produce Charcoal.',
  },
  'logistics-splitter-complete': { instruction: 'Continue to insert a Splitter.' },
  'logistics-merger-complete': { instruction: 'Continue to insert a Merger.' },
  'control-group-click': {
    body: 'One click, three opinions.',
    instruction: 'Single-click one grouped Extractor.',
  },
  'control-group-move': {
    title: 'Move the whole group',
    body: 'The three Extractors keep their relative positions.',
    instruction: 'Drag a grouped Extractor by its header toward the target, then release.',
  },
  'control-group-double-click': {
    body: 'Hold the second click to move just that machine.',
    instruction: 'Double-click the highlighted Extractor.',
  },
  'control-group-select-forward': {
    body: 'Touching one group member includes the whole group.',
    instruction: 'Drag down-right across the highlighted Extractor.',
  },
  'control-group-select-reverse': {
    body: 'An up-left box selects only the nodes it touches.',
    instruction: 'Drag up-left across only the highlighted Extractor.',
  },
  'monster-camp-boundary': {
    title: 'Inspect the camp',
    body: 'Give the border some room. Machines caught inside it shut down.',
    instruction: 'Check the border, then continue.',
  },
  'monster-camp-suppression': {
    title: 'Supply Attack Power',
    body: 'The camp keeps a schedule. Supplying enough attack power at a check pushes its border back.',
    instruction: 'Connect the stocked Cart to the camp’s center input and keep it supplied until the camp is fully suppressed.',
  },
  'monster-camp-growth': {
    title: 'Keep the bots coming',
    body: '',
    instruction: 'Continued suppression may bring rewards.',
  },
};

export type ResearchLessonLayout = 'current' | 'upgrades';
const upgradeResearchCopy: Partial<Record<TutorialStage, Partial<{ title: string; body: string; instruction: string }>>> = {
  'research-open': { title: 'Open Upgrades', body: 'Inspect the projects available to your bot.', instruction: 'Open Upgrades or press Q.' },
  'research-explain': { title: 'Completed projects', body: 'Joint unlocked when you connected two nodes. Completed projects remain available for inspection.', instruction: 'Enable Show completed projects and inspect Joint.' },
  'cores-open': {
    title: 'Queue Assembler research',
    body: `Assembler costs ${corePayment}. Only this project is available during this practice step.`,
    instruction: 'Select Assembler, then press Queue research.',
  },
  'cores-explain': {
    title: 'Process the research Cores',
    body: `The Research Center processes ${corePayment} one at a time. Selecting a card alone does not pay for it.`,
    instruction: 'Wait for research to complete. Resume research or the simulation if paused.',
  },
  'cores-complete': {
    title: 'Research complete',
    body: 'In your factory, queue up to four projects with Queue research or by double-clicking cards. Enable Simple upgrade to unlock the Basic Core recipe; Exploration needs Simple and Basic Cores.',
  },
};

export function lessonCopy(stage: TutorialStage, researchLayout: ResearchLessonLayout = 'current') {
  const original = GUIDED_TUTORIAL_COPY[stage as GuidedTutorialStage] ?? { step: 1, title: '', body: '', instruction: '' };
  return { ...original, ...adaptations[stage], ...(researchLayout === 'upgrades' ? upgradeResearchCopy[stage] : {}) };
}

