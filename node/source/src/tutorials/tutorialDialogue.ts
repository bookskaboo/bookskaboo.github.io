import { GUIDED_TUTORIAL_COPY, type GuidedTutorialStage } from './originalTutorials';
import { TUTORIAL_CORE_COST, type TutorialStage } from './tutorialDefinitions';

const corePayment = `${TUTORIAL_CORE_COST} Simple ${TUTORIAL_CORE_COST === 1 ? 'Core' : 'Cores'}`;

export function lessonCopy(stage: TutorialStage) {
  const copy = { step: 1, title: '', body: '', instruction: '', ...(stage in GUIDED_TUTORIAL_COPY ? GUIDED_TUTORIAL_COPY[stage as GuidedTutorialStage] : {}) };
  const adaptations: Partial<Record<TutorialStage, Partial<typeof copy>>> = {
    'expansion-intro': { title: 'Goal: bring Wood Home', body: 'Road research unlocks both Roads and Carts. This practice factory has that research and Exploration complete, plus 1 Map Point. Its outpost makes Wood: sending Cart → sending Road → receiving Road → receiving Cart. The wheels are a department matter.', instruction: 'Continue to connect Carts on both sides of a Road pair.' },
    'expansion-map-open': { title: 'Open the Node Map', body: 'Exploration unlocks the Node Map and grants your first Map Point. Map Node research earns more points later. Each point activates one adjacent map.', instruction: 'Click Map in the top bar, or press Shift + M.' },
    'expansion-activate': { title: 'Spend one Map Point', body: 'Home is H. The Wood outpost is W1, the adjacent map to its left. Activation spends 1 Map Point and lets you visit; it keeps you in the current map.', instruction: 'Select W1, then click Activate node · 1 point.' },
    'expansion-travel': { title: 'Travel to the new map', body: 'The activated map stays selected. Its button now offers travel. Travelling between activated maps is free.', instruction: 'Click Travel to node to visit the Wood outpost.' },
    'expansion-return': { title: 'Find your way Home', body: 'The Forest and Extractor load Wood into the sending Cart. A second Cart waits at Home to receive it. Carts hold 20 solid items of any tier, including advanced products and Cores. Fluids need other storage. Your factory keeps simulating while you travel.', instruction: 'Open Map, select H, then click Travel to node.' },
    'expansion-outpost': { title: 'Choose the sending map', body: 'Roads send items from the map where you place them. The outpost Cart holds the outgoing Wood; the Home Cart will collect deliveries.', instruction: 'Open Map and travel back to W1.' },
    'expansion-road-place': { title: 'Build a Road pair', body: 'Place Road at the highlighted east edge, next to Home. Both endpoints are created together if both locations are clear. The pair starts by sending from this map. In normal play, click either Road to choose the one-way direction; this lesson keeps Wood travelling Home.', instruction: 'Open Build, choose Road, and place it at the highlighted edge.' },
    'expansion-road-feed': { title: 'Connect the sending Cart', body: 'The sending Cart holds Wood for the Road to H. Connect its output to the Road input. Roads carry one material at 12 items per minute and store nothing. Wood waits in the Cart until the receiving side is connected and has room. The Road declined warehouse duties.', instruction: 'Connect sending Cart output → sending Road input.' },
    'expansion-home-receive': { title: 'Find the receiving Cart', body: 'Home has the paired receiving Road on its west edge and an empty Cart beside it. Connect that Cart to complete the route. Wood waits in the outpost Cart while you travel. For once, it has no plans.', instruction: 'Open Map and travel to H to connect the receiving Cart.' },
    'expansion-deliver': { title: 'Unload the Road into a Cart', body: 'Connect the receiving Road output to the Home Cart input. This completes Cart → Road pair → Cart, keeping a buffer at both ends. The receiving Cart can then supply local production or a Research Center.', instruction: 'Connect receiving Road output → Home Cart input. Wait for Wood to reach the Cart.' },
    'expansion-complete': { title: 'Wood reached the Home Cart', body: 'Sending Cart → Road pair → receiving Cart is ready. It can carry any solid material, including advanced products and Cores, from the start. Trucks research upgrades every Cart to 40 items; Trains raises all vehicles to 80. Road Channels 1 and 2 increase each face from one Road to two, then three. Each pair carries one material; fluids stay local.', instruction: 'Finish to return to your own factory.' },
    'build-open': { title: 'Goal: make your first Simple Core', body: 'Build a working factory from raw Wood and Copper, make a Simple Core, then spend it on research. Start by gathering Wood with an Extractor. Every ingredient in this lesson comes from your machines.', instruction: 'Open Build in the top bar.' },
    'make-charcoal': { title: 'Turn Wood into Charcoal', body: 'Wood extraction unlocked Kiln. A Kiln burns Wood into the Charcoal needed for smelting. Your Cart can feed the Kiln while keeping spare Wood.', instruction: 'Build a Kiln at the target. Connect Cart output → Kiln input and wait for Charcoal.' },
    'mine-copper': { title: 'Gather Copper', body: 'Cores begin with Copper. Like the Forest, the Copper deposit needs an Extractor before it can supply the rest of the factory.', instruction: 'Build another Extractor at the target. Connect Copper → its input and wait for Copper.' },
    'make-plates': { title: 'Smelt Copper Plates', body: 'Extracting Copper unlocked Smelter. It needs two ingredients: Copper and Charcoal. Each ingredient has its own input socket.', instruction: 'Build a Smelter at the target and choose Copper Plate. Feed Copper from its Extractor into the Copper input and Charcoal from the Kiln into the Charcoal input. Wait for a Copper Plate.' },
    'make-gears': { title: 'Refine Copper Gears', body: 'Your first Plate unlocked Refiner. Under Gear, select Copper Gear: 2 Copper Plates make 1 Copper Gear. Each material has its own recipe; this machine keeps the material you choose.', instruction: 'Build a Refiner at the target, choose Copper Gear, then connect Smelter → Refiner. Wait for a Copper Gear.' },
    'make-core': { title: 'Make your first Simple Core', body: 'Use a second Refiner to turn 2 Copper Gears into a Simple Core. Keep the first Refiner making Gears so the chain stays supplied.', instruction: 'Build another Refiner at the target, choose Simple Core, then connect the Gear Refiner → Core Refiner. Wait for your first Simple Core.' },
    'build-lab': { title: 'You made a Simple Core', body: 'Goal achieved: your own factory produced a Simple Core from raw resources. Use it to unlock Assembler research next. Your first Plate also unlocked Research Center.', instruction: 'Build a Research Center at the target.' },
    'deliver-core': { title: 'Deliver your Core', body: 'Research needs physical deliveries. The Research Center stores Cores until a project needs them.', instruction: 'Connect the Simple Core Refiner output → Research Center input. Wait until a Core arrives.' },
    'build-explain': { body: 'Nodes are free to build. This lesson enables only the machine needed for the current step. Select Extractor to hold its schematic. The syllabus has trust issues.', instruction: 'Select Extractor in Build.' },
    'build-place': { body: 'Click to place the requested node. Basics allows one machine at a time, even with Shift held. Press Escape or right-click to cancel placement. Industrial restraint, briefly.', instruction: 'Place the Extractor on the highlighted spot.' },
    'chest-shortcut': { body: 'Carts normally unlock with Road research. This separate practice factory lends you the schematic early to demonstrate buffering. The Cart is in the Logistics shortcut bar.', instruction: 'Select Cart in the Logistics bar, or choose Cart from Build.' },
    'research-explain': { body: 'Some research completes when you perform a specific task. Your first connection unlocked Joint. Its card has a check mark. These milestones do not need Cores.', instruction: 'Inspect the highlighted Joint card, then continue.' },
    'cores-open': { body: `Open the Assembler card to inspect its cost and unlock. Then click Start Assembler research in its details. It currently needs ${corePayment}, supplied by your factory through the Research Center.`, instruction: 'Open the highlighted Assembler card, then click Start Assembler research.' },
    'cores-explain': { body: `Your Core Refiner supplies ${corePayment} to the Research Center. The Center processes one Core per cycle. In your factory, make Simple Cores in a Refiner from Copper Gears. Later projects need one of every required Core type together.`, instruction: 'Watch the Core payment be processed. Resume the simulation if paused.' },
    'cores-complete': { body: `The Research Center processed ${corePayment} and unlocked Assembler. You built the entire chain and used your own Core production to complete research. Next, an Assembler can make Basic Cores. Exploration needs Simple and Basic Cores together, so keep your Simple Core production running.`, instruction: 'Continue when you are ready.' },
    shortcuts: { instruction: 'Inspect the shortcut bars, then continue.' },
    'options-explain': { body: 'Save / Load manages local saves. Commands lists controls. Recipes traces production. Wire animations changes cable effects. Shortcut settings show or hide each bar. Tutorials reopens these lessons.', instruction: 'Finish to return to your factory. Practice progress is discarded.' },
    'logistics-joint-connect': { body: 'A Joint bends a cable route. Its input and output share the center socket. Connect Forest → Joint, then Joint → Extractor.', instruction: 'Connect the Forest to the Joint, then the Joint to the Extractor.' },
    'logistics-joint-move': { body: 'Hover the Joint to reveal its six-dot grip. Drag the grip to move it while keeping its cables attached. Materials pass through without another travel timer.', instruction: 'Drag the six-dot grip to the highlighted spot.' },
    'logistics-joint-complete': { title: 'Joint inserted', body: 'Dropping the Joint onto the cable routed it through the Joint. Moving it keeps both cables attached. One bar travels the whole route in the original travel time.', instruction: 'Continue to learn about Splitters.' },
    'logistics-splitter-rotate': { title: 'Rotate the Splitter', body: 'Right-click the Splitter to rotate it. Its sockets turn and its cables follow. No cable management committee required.', instruction: 'Right-click the connected Splitter once.' },
    'logistics-merger-rotate': { title: 'Rotate the Merger', body: 'Right-click the Merger to rotate it. Both inputs and the output rotate together. The material keeps its appointment.', instruction: 'Right-click the connected Merger once.' },
    'logistics-splitter-complete': { instruction: 'Continue to practice dropping a Splitter onto a cable.' },
    'logistics-merger-complete': { instruction: 'Continue to practice dropping a Merger onto a cable.' },
    'control-group-click': { body: 'Click any grouped machine once to select all three. One click, three opinions.', instruction: 'Click one of the grouped Extractors.' },
    'control-group-move': { title: 'Move the whole group', body: 'Drag the header of any grouped Extractor toward the highlighted area, then release. All three machines move together. The committee has agreed to relocate.', instruction: 'Drag a grouped Extractor by its header. Move all three, then release.' },
    'control-group-double-click': { body: 'Double-click the highlighted Extractor to select only that machine. Hold the second click if you want to move it alone. Even a committee permits the occasional individual decision.', instruction: 'Double-click the highlighted Extractor.' },
    'control-group-select-forward': { body: 'Drag a selection box down and right across the highlighted Extractor. Touching one group member includes all three. The rest arrive uninvited.', instruction: 'Drag down-right across the highlighted Extractor.' },
    'control-group-select-reverse': { body: 'Drag a selection box up and left across only the highlighted Extractor. This direction selects only the machines touched, even inside a group. A rare escape from collective responsibility.', instruction: 'Drag up-left across only the highlighted Extractor.' },
    'monster-camp-boundary': { instruction: 'Inspect the camp and continue to practice supplying Attack Power.' },
    'monster-camp-suppression': { body: 'Send bots to the camp’s center input before its AP check every 60 seconds. Small / Medium / Heavy / Command Bots supply 1 / 3 / 8 / 20 AP each. The bar fills toward the next check; AP shows current supply / required AP. A passed check shrinks the camp and leaves a green glow; a failed check lets it grow and leaves a red glow until the next check. This practice Cart contains bots.', instruction: 'Connect the bot Cart output to the camp input and wait for a successful check.' },
    'monster-camp-growth': { title: 'Suppression comes with a supply contract', body: 'Keep passing checks until the camp reaches 10% size. A separate Tribute box then appears: connect its output directly to a Cart or production node, without an Extractor. Goblins let you choose Iron, Copper, Stone or Wood in the Tribute picker. Dwarves supply Mythril instead. Different settlement types and tiers demand different AP and produce different Tribute amounts; inspect each one. Missing a Goblin check removes its Tribute box, stock and cables. A missed Dwarven check pauses new Mythril while preserving stored Tribute and wiring. The neighbors have discovered recurring billing.', instruction: 'Inspect each camp’s AP requirement and Tribute rate. Keep bot production running; collect Tribute from its separate box.' },
  };
  const lesson = { ...copy, ...adaptations[stage] };
  const aside = TUTORIAL_ASIDES[stage];
  return aside ? { ...lesson, body: `${lesson.body} ${aside}` } : lesson;
}

// Keep the required action literal; the aside belongs in explanatory subtext.
const TUTORIAL_ASIDES: Partial<Record<TutorialStage, string>> = {
  'expansion-intro': 'An entire journey to obtain more Wood. Industry is thorough.',
  'expansion-map-open': 'The world has helpfully been divided into further obligations.',
  'expansion-activate': 'Buying access and going there remain separate activities.',
  'expansion-travel': 'No ticket required. A rare administrative success.',
  'expansion-return': 'Your absence is not a production strategy.',
  'expansion-outpost': 'Exports work best when sent from the place containing the goods.',
  'expansion-road-place': 'The other end is included. A welcome surprise.',
  'expansion-road-feed': 'A Road without supplies is mostly a boundary decoration.',
  'expansion-home-receive': 'The delivery does not require supervision. Only infrastructure.',
  'expansion-deliver': 'Arriving nearby is not the same as being delivered.',
  'expansion-complete': 'The Wood has traveled. You have acquired a supply chain.',
  'build-open': 'A modest plan with several machines attached.',
  'build-explain': 'The machines are free. The layout is your responsibility.',
  'build-place': 'This is the inexpensive part of the plan.',
  'chest-shortcut': 'The box now has a shortcut. A good day for boxes.',
  'chest-place': 'A short pause between one bottleneck and the next.',
  'make-charcoal': 'A productive use of things being on fire.',
  'mine-copper': 'The deposit has declined to move itself.',
  'make-plates': 'Both ingredients are mandatory. The Smelter is inflexible.',
  'make-gears': 'The teeth are a functional requirement.',
  'make-core': 'Two machines, so neither has to change careers.',
  'build-lab': 'Your factory can now fund its own complications.',
  'deliver-core': 'Science requires more than moral support.',
  'research-explain': 'The paperwork has completed itself for once.',
  'cores-open': 'The proposal includes an invoice.',
  'cores-explain': 'Missing ingredients are not an alternative research method.',
  'cores-complete': 'Progress has produced a longer to-do list.',
  'options-explain': 'Even industrial ambition needs a settings menu.',
  'logistics-joint-connect': 'A bend in the cable, rather than in the rules.',
  'logistics-joint-move': 'Cable management now permits second thoughts.',
  'logistics-joint-complete': 'The cables have accepted the rearrangement.',
  'monster-camp-suppression': 'The neighbors are punctual about being difficult.',
};

