export type GuidedTutorialKind = "basic" | "logistics" | "control-groups" | "monster-camps";
export type BasicGameplayTutorialStage =
  | "connect-resource"
  | "chest-shortcut"
  | "chest-place"
  | "store-item"
  | "research-open"
  | "research-explain"
  | "cores-open"
  | "cores-explain"
  | "cores-complete"
  | "build-open"
  | "build-explain"
  | "build-place"
  | "shortcuts"
  | "options-open"
  | "options-explain";
export type LogisticsTutorialStage =
  | "logistics-joint-connect"
  | "logistics-joint-move"
  | "logistics-joint-insert"
  | "logistics-joint-complete"
  | "logistics-splitter-connect"
  | "logistics-splitter-complete"
  | "logistics-splitter-insert"
  | "logistics-splitter-inserted"
  | "logistics-merger-connect"
  | "logistics-merger-complete"
  | "logistics-merger-insert"
  | "logistics-merger-inserted";
export type ControlGroupTutorialStage =
  | "control-group-select"
  | "control-group-create"
  | "control-group-created"
  | "control-group-click"
  | "control-group-click-complete"
  | "control-group-double-click"
  | "control-group-double-click-complete"
  | "control-group-move"
  | "control-group-moved"
  | "control-group-select-forward"
  | "control-group-forward-complete"
  | "control-group-select-reverse"
  | "control-group-reverse-complete"
  | "control-group-disband"
  | "control-group-complete";
export type MonsterCampTutorialStage =
  | "monster-camp-boundary"
  | "monster-camp-suppression"
  | "monster-camp-growth";
export type GuidedTutorialStage =
  | BasicGameplayTutorialStage
  | LogisticsTutorialStage
  | ControlGroupTutorialStage
  | MonsterCampTutorialStage;
export const isLogisticsTutorialStage = (
  stage: GuidedTutorialStage | null,
): stage is LogisticsTutorialStage => Boolean(stage?.startsWith("logistics-"));
export const isControlGroupTutorialStage = (
  stage: GuidedTutorialStage | null,
): stage is ControlGroupTutorialStage => Boolean(stage?.startsWith("control-group-"));

export const GUIDED_TUTORIAL_COPY: Record<GuidedTutorialStage, {
  step: number;
  title: string;
  body: string;
  instruction: string;
}> = {
  "connect-resource": {
    step: 2,
    title: "Connect nodes",
    body: "Connections carry resources between nodes. Star connectors can hold several connections; circle connectors can hold one. Drag from the Forest’s right connector to the Extractor’s left connector. The sides matter. Factories are particular like that.",
    instruction: "Connect the Forest’s right side to the Extractor’s left side.",
  },
  "chest-shortcut": {
    step: 3,
    title: "Use a shortcut",
    body: "Unlocking a node adds it to the matching shortcut bar. The Cart is now in the Logistics bar, ready to place without reopening Build. One less menu trip. Civilization advances.",
    instruction: "Select the glowing Cart shortcut in the Logistics bar.",
  },
  "chest-place": {
    step: 3,
    title: "Place the Cart",
    body: "Place the Cart at the highlighted spot. It stores up to 20 solid items, with local shipments of one item before vehicle upgrades. It can hold advanced products and Cores from the start. The box has transport ambitions.",
    instruction: "Place the Cart on the highlighted spot.",
  },
  "store-item": {
    step: 3,
    title: "Store production",
    body: "An Extractor automatically pulls resources, such as Wood, from a connected resource node. Connect its output to the Cart, then wait for the first item. The machinery will handle the lifting.",
    instruction: "Connect the Extractor to the Cart and wait for one item.",
  },
  "research-open": {
    step: 4,
    title: "Research completed",
    body: "Your first connection completed Joint research and unlocked the Joint node. Apparently, one cable counts as a breakthrough. Open Research to see it.",
    instruction: "Open Research in the top bar.",
  },
  "research-explain": {
    step: 4,
    title: "Completed Research",
    body: "Some research completes when you perform a specific task. Your first connection unlocked the Joint and moved its card to Completed Research at the bottom of the list.",
    instruction: "Find the glowing Joint card under Completed Research.",
  },
  "cores-open": {
    step: 5,
    title: "Choose Research",
    body: "Other research must be selected and processed in a Research Center. These projects require Cores. Assembler needs 5 Simple Cores, so select it to tell the Center what to work on.",
    instruction: "Select the glowing Assembler research card.",
  },
  "cores-explain": {
    step: 5,
    title: "Process the Cores",
    body: "The Cart is feeding 5 Simple Cores into the Research Center. The Center stores and processes them one at a time to advance Assembler research. Even science has a queue.",
    instruction: "Watch the Research Center process all 5 Simple Cores.",
  },
  "cores-complete": {
    step: 5,
    title: "Research complete",
    body: "The Research Center processed all 5 Simple Cores and completed Assembler research. Core-based projects advance one processed Core at a time.",
    instruction: "Continue when you’re ready.",
  },
  "build-open": {
    step: 1,
    title: "Build an Extractor",
    body: "Build contains every node you can currently construct. For now, you only need an Extractor. A modest beginning, but most factories are.",
    instruction: "Open Build in the top bar.",
  },
  "build-explain": {
    step: 1,
    title: "Select the Extractor",
    body: "On the Build page, node names and the Never built status are yellow until you build that type for the first time. Afterward, the name turns white. Hover for details, then select the Extractor to put it in your hand.",
    instruction: "Select the yellow Extractor.",
  },
  "build-place": {
    step: 1,
    title: "Place the Extractor",
    body: "The highlighted spot marks where the Extractor belongs in this example factory. Move it there and place it. Interior design can wait.",
    instruction: "Place the Extractor on the highlighted spot.",
  },
  shortcuts: {
    step: 6,
    title: "Shortcut bars",
    body: "Production, Logistics, and Storage each have a shortcut bar. New nodes are added to the matching bar when unlocked. Click a slot to build, right-click to change it, or drag the six-dot handle to move the bar.",
    instruction: "Hover over the glowing shortcut to acknowledge the new unlock.",
  },
  "options-open": {
    step: 7,
    title: "Game options",
    body: "Options keeps saves, controls, recipes, display settings, shortcut-bar settings, and achievements in one place. It is the sensible drawer.",
    instruction: "Open Options in the top bar.",
  },
  "options-explain": {
    step: 7,
    title: "Options at a glance",
    body: "Save / Load manages local saves. Commands lists controls. Recipes traces production. Wire Animations changes cable effects. Shortcut settings show or hide each bar, and Achievements records your discoveries.",
    instruction: "That covers the basics. Return to your factory when ready.",
  },
  "logistics-joint-connect": {
    step: 1,
    title: "Route through a Joint",
    body: "A Joint is a small pass-through that bends a connection around other nodes. Its input and output share the center connector. Dragging to another node automatically chooses the correct direction. Connect the Forest to the Joint, then the Joint to the Extractor.",
    instruction: "Use the Joint’s center connector to make both connections.",
  },
  "logistics-joint-move": {
    step: 1,
    title: "Move the Joint",
    body: "A Joint keeps its connections when moved. Hover over or click it to reveal the six-dot handle, then drag that handle to the highlighted spot. The cables will follow. They are well trained.",
    instruction: "Drag the six-dot handle to the highlighted spot.",
  },
  "logistics-joint-insert": {
    step: 1,
    title: "Insert into a connection",
    body: "You can also drop a Joint directly onto an existing connection. The game replaces the original cable with two cables routed through the Joint.",
    instruction: "Drag the Joint onto the highlighted part of the glowing connection.",
  },
  "logistics-joint-complete": {
    step: 1,
    title: "Joint inserted",
    body: "The Joint now sits between the Forest and Extractor. Move it whenever you need to reshape the route; both cables will stay attached.",
    instruction: "Continue to learn about Splitters.",
  },
  "logistics-splitter-connect": {
    step: 2,
    title: "Split one stream into two",
    body: "A Splitter takes one item stream and alternates items between two outputs. The Forest and Extractor are already connected. Connect the Extractor to the Splitter, then connect one Splitter output to each Kiln.",
    instruction: "Connect Extractor → Splitter, then Splitter → both Kilns.",
  },
  "logistics-splitter-complete": {
    step: 2,
    title: "The stream is split",
    body: "Wood now alternates between the two Kilns. If one route cannot accept an item, the Splitter tries the other. It is flexible, within reason.",
    instruction: "Continue to learn how to insert a Splitter.",
  },
  "logistics-splitter-insert": {
    step: 2,
    title: "Insert a Splitter",
    body: "You can drop a Splitter directly onto an existing connection. The original cable becomes its input, and one output continues to the original destination.",
    instruction: "Drag the Splitter onto the highlighted Extractor-to-Kiln connection.",
  },
  "logistics-splitter-inserted": {
    step: 2,
    title: "Splitter inserted",
    body: "The route is now Extractor → Splitter → Kiln. The second output is free for another destination, should ambition strike.",
    instruction: "Continue to learn about Mergers.",
  },
  "logistics-merger-connect": {
    step: 3,
    title: "Merge two streams into one",
    body: "A Merger combines two matching item streams into one output. The Forest already feeds both Extractors. Connect each Extractor to a different Merger input, then connect the Merger to the Kiln.",
    instruction: "Connect both Extractors → Merger, then Merger → Kiln.",
  },
  "logistics-merger-complete": {
    step: 3,
    title: "The streams are merged",
    body: "Both Extractors now feed one Kiln. The Merger accepts matching items from either input and sends them through its single output. Two queues have become one queue. Progress.",
    instruction: "Continue to learn how to insert a Merger.",
  },
  "logistics-merger-insert": {
    step: 3,
    title: "Insert a Merger",
    body: "You can also drop a Merger directly onto an existing connection. That stream enters one input, and the output continues to the original destination.",
    instruction: "Drag the Merger onto the highlighted Extractor-to-Kiln connection.",
  },
  "logistics-merger-inserted": {
    step: 3,
    title: "Merger inserted",
    body: "The route is now Extractor → Merger → Kiln. The other input is free for a second matching stream.",
    instruction: "That covers the Logistics tutorial.",
  },
  "control-group-select": {
    step: 1,
    title: "Highlight several nodes",
    body: "Control groups begin by selecting several nodes. Drag from upper-left to lower-right around the three clustered Extractors, or Shift-click each node to add it to the selection.",
    instruction: "Select the three clustered Extractors with a selection box or Shift-click.",
  },
  "control-group-create": {
    step: 1,
    title: "Create a control group",
    body: "The three nodes are highlighted. Right-click any one of them, then choose a color to turn the selection into a control group.",
    instruction: "Right-click a highlighted node, then choose a color.",
  },
  "control-group-created": {
    step: 1,
    title: "Control group created",
    body: "The matching markers show that the nodes share a control group. A normal click on one will select them all. They have agreed to cooperate.",
    instruction: "Continue to practice selecting the group.",
  },
  "control-group-click": {
    step: 2,
    title: "Select the whole group",
    body: "A single click on any grouped node selects the entire control group. The shared highlight shows which nodes will act together.",
    instruction: "Single-click any grouped node.",
  },
  "control-group-click-complete": {
    step: 2,
    title: "The group is selected",
    body: "One click selected all three nodes. Dragging any selected node will move the whole group.",
    instruction: "Continue to learn individual selection.",
  },
  "control-group-double-click": {
    step: 3,
    title: "Select one grouped node",
    body: "Double-click a grouped node to select only that node without breaking up the group. Hold the second click if you want to drag it immediately.",
    instruction: "Double-click the highlighted node. You may hold the second click to move it.",
  },
  "control-group-double-click-complete": {
    step: 3,
    title: "Individual node selected",
    body: "Only that node is selected, but its group marker remains. A normal click later will select the full group again. No paperwork required.",
    instruction: "Continue to practice moving the group.",
  },
  "control-group-move": {
    step: 4,
    title: "Move the group together",
    body: "Drag any node in the selected control group. Every grouped node will keep its relative position and move with it.",
    instruction: "Drag any grouped node a clear distance.",
  },
  "control-group-moved": {
    step: 4,
    title: "The whole group moved",
    body: "One drag moved all three nodes while preserving their layout. Order has survived, for now.",
    instruction: "Continue to compare selection-box directions.",
  },
  "control-group-select-forward": {
    step: 5,
    title: "Down-right includes the group",
    body: "Start above-left of the highlighted node and drag down-right across it. In this direction, touching one grouped node selects its entire control group.",
    instruction: "Drag down-right across only the highlighted node, then release.",
  },
  "control-group-forward-complete": {
    step: 5,
    title: "The group was included",
    body: "The box touched one node, but all three were selected. A down-right selection includes the full control group.",
    instruction: "Now compare it with an up-left selection.",
  },
  "control-group-select-reverse": {
    step: 5,
    title: "Up-left selects only what it touches",
    body: "Start below-right of the highlighted node and drag up-left across it. In this direction, the box selects only the nodes it touches, even if they belong to a group.",
    instruction: "Drag up-left across only the highlighted node, then release.",
  },
  "control-group-reverse-complete": {
    step: 5,
    title: "Only one node was selected",
    body: "Only the touched node was selected. Its group still exists; the up-left selection simply gives that node temporary priority.",
    instruction: "Continue to learn how to disband the group.",
  },
  "control-group-disband": {
    step: 6,
    title: "Disband the control group",
    body: "Right-click any grouped node and confirm Disband. The group is removed, but every node stays where it is. This is an administrative separation.",
    instruction: "Right-click a grouped node, then confirm Disband.",
  },
  "control-group-complete": {
    step: 6,
    title: "Control group disbanded",
    body: "The colored markers are gone. Each node can now be selected and moved on its own again.",
    instruction: "That covers the Control Group tutorial.",
  },
  "monster-camp-boundary": {
    step: 1,
    title: "The locals are not happy",
    body: "A Monster Camp blocks everything inside its visible border. If that border reaches one of your nodes, the node shuts down and turns red. Leave space around the camp and keep important machinery at a polite distance.",
    instruction: "Continue to learn how to suppress a camp.",
  },
  "monster-camp-suppression": {
    step: 2,
    title: "Supply the center port",
    body: "Finding a Monster Camp unlocks Suppression Bot recipes in the Assembler. A bot’s parts determine its Attack Power. Send enough Attack Power to the center port before each check and the camp shrinks; send too little and it expands. An encroached node turns red, stops working, and cannot be used until the camp recedes. Its connections stay in place. This demo checks every two seconds, so watch the Cart switch off and back on. The camp remains, but your wiring survives the experience.",
    instruction: "Watch the Cart disable as the camp expands, then reactivate as it shrinks.",
  },
  "monster-camp-growth": {
    step: 3,
    title: "Prepare for other threats",
    body: "Other monsters may behave differently or require a stronger response. Check what each threat needs, then scale your factories and Suppression Bot production to match. Underproduction is rarely persuasive.",
    instruction: "Scale production as needed to keep new threats under control.",
  },
};
export const GUIDED_TUTORIAL_REVIEW_STAGES: Record<number, BasicGameplayTutorialStage> = {
  1: "build-explain",
  2: "connect-resource",
  3: "store-item",
  4: "research-explain",
  5: "cores-complete",
  6: "shortcuts",
  7: "options-explain",
};
