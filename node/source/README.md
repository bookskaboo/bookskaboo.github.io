# Factorinode reconstruction

A local-first React + PixiJS factory automation game. React owns the interface and PixiJS owns the active-sector graph; the simulation has no dependency on either renderer.

The [master development plan](docs/master-plan/README.md) organizes the current game, component designs, validation needs, proposed milestones, and a one-question-at-a-time review queue.

The [change history](CHANGELOG.md) tracks completed work, earlier decisions, and publication status. Use the [searchable view](docs/changelog/index.html) to filter by topic, date, state, or publication, and the [maintenance guide](docs/changelog/README.md) when adding records.

The [November 4 endgame implementation report](docs/master-plan/20-endgame-implementation.md) covers four seeded corner challenges, Final Core assembly and victory, post-victory research, relocation, the Recycler and hidden recovery. Reclamation balance is provisional; normal-play balance and visual QA remain to validate.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173/`.

## Implemented game

- Fixed 100 ms simulation with 750 ms UI publication and inactive-sector updates
- Pixi node graph with one ticker, cable particles, progress interpolation, marquee selection, node dragging, port connections, right/middle/Space panning, and pointer-centered zoom
- Item, recipe, node, and research catalogs including Mythril production, Suppression Bots, Inventory/Filter logistics, Roads, Tree Planters, and Mining Drills. Power is removed pending a useful integration design.
- Production chains, buffers, resource depletion, alternating Splitters, storage retrieval, synchronized research core sets, research milestones and efficiency upgrades, rising repeatable Map Node costs, and dedicated Forest Growth ports
- Tree Planters restore Forest without Power. Generators, Power Splitters, Power Lines and their research are absent from playable catalogs; Hydrochemistry no longer requires Basic Electricity. Old Power equipment, wiring, stored energy and affected in-flight cargo are archived within saves rather than simulated.
- React build, inventory, research, world map, journal, options, save/load, inspector, and shortcut interfaces
- **Options → Mods** provides guided editors for existing resources, nodes, recipes, research, obstructions, maps and connection/construction settings, with base-game templates, change review, local drafts, save-aware activation and copy/paste share codes. See the [mod guide](docs/mods.md) for supported fields and behavior.
- Three manual slots plus autosave using the permanent `factorinode.save-slots.v1` and `factorinode.temporary-save.v1` keys, with migration from original version-1 NODE saves
- Command checkpoints with up to 50 undo states
- Selecting research immediately checks for a complete required Core set. After a successful payment, Research Centers consume further sets every five seconds before upgrades; project changes preserve that payment interval. Six research ranks reduce the interval to 4.5, 4, 3.5, 3, 2.5 and 2 seconds; new and loaded centers use the same base timing. Successful Core-set payments renew a repeating blue completion glow for the full current interval; missing the next payment lets it expire.
- Road research unlocks the Cart (formerly Wooden Chest), a 20-item solid buffer. Every solid product and Core tier is allowed immediately; fluids are excluded. Trucks research (20 each Simple, Basic and Automata Cores) upgrades all existing and future Carts to 40-item Trucks. Trains research (40 each through Hydro) upgrades them to 80-item Trains. Stock, IDs, wiring, templates and the two-second local transfer cycle are retained; the 20 display blocks represent the proportion filled. Vehicle headers show an icon in place of title text, with the same header/body shading dimensions as Roads.
- Roads start at one pair per map face. Road Channels 1 adds a second slot (2 each through Hydro), and Road Channels 2 adds a third (130 each through Shiny), sequentially. Sending and receiving endpoints share each face's limit; reversal consumes no extra slot. Existing saved Roads above the new limit remain usable. The Expansion tutorial demonstrates sending Cart → Road pair → receiving Cart using actual Wood production and delivery.
- Road placement creates both facing endpoints together only when both locations and face slots are legal. The chosen face must have an unlocked neighbor. Click either endpoint for the Road flow panel, then click its direction card to reverse the one-way route; the paired endpoint takes the opposite role. The panel shows only the toggle and 12 items / minute below it. A large arrow points toward the map edge when sending and into the field when receiving; the header icon uses the standard node icon size. Map Road hovers show only compass direction and material. Direction changes disconnect endpoint cables for rewiring. Selecting an unchanged direction through the engine is a no-op; malformed double-export pairs do not dispatch. Practice fixes direction to the lesson route.
- Roads have no internal inventory. Each five-second check moves one item directly from a connected source to a connected destination, including routes through local logistics. Disconnected or full receivers leave cargo at its source; unused trips never build up. Local cable motion is cosmetic and reserves no storage. On loading an older save, Road cargo returns to connected inventories where possible; overflow is preserved in the shared pool, and pending Road deliveries are refunded before migration.
- **Dev tools → Place Dev Source** places a movable, saveable universal supplier outside the normal Build catalog. Connect its star output to any existing input; each cable automatically supplies that socket's ingredients, bots, or required research Core types. Recipe changes keep valid Dev Source cables. Extractors mine a virtual infinite reserve on their normal cycle; generic inputs infer downstream demand or default to Iron. Normal production/research timing, prerequisites, and obstruction boundaries still apply.
- Persistent Control Groups with the original ten colors: right-click a highlighted selection to create a group, click/drag a member to control the group, double-click (and hold to drag) to control one member, and right-click a member to confirm disbanding. Down-right selection expands touched groups; up-left selection prioritizes only touched nodes. Shift adds to selection. Full-group copies receive independent group IDs. Groups survive save/load and undo. After Connector Mirroring research, production-node right-click mirrors input/output sides instead. Left-click still opens the recipe chooser, and the connector-order button retains its separate left/right-click row controls.
- Extractors and Lake Intakes are Production nodes, alongside Kilns, Smelters, Refiners, Assemblers and the advanced processors. The Build catalog, hover labels and production controls use that classification. Carts, Trucks and Trains are Logistics nodes with their existing solid-item storage behavior. Cart shortcuts follow normal Road-unlock placement in the next free Logistics slot; older Cart/Chest assignments on other bars migrate there. Explicitly cleared slots stay cleared, and vehicle upgrades reuse the existing shortcut.
- Configurable production nodes, including Smelters, need a selected recipe before either side can be connected. Smelters keep the chosen metal recipe. Basics highlights Copper Plate.
- Extractor rewiring discards stock of a different resource and keeps matching stock. Resource-node bars show the fraction of their reserve remaining.
- Research Centers open the research panel on click, show total project progress, and retain named Core storage boxes. Hover explains the active project and missing Cores.
- Dragging a node or cable near a zoomed field's edge scrolls the map while preserving the drag position and normal map bounds.
- The Map button and Shift+M expand the existing minimap. Selection, separate compact/expanded zoom levels, and its saved floating position and size survive collapse. The expanded view uses Home-relative compass positions (Home H; the northwest neighbor N1.W1), a simple title/close header and larger action text. Unvisited maps show Map Node Unexplored; visited maps list resources and obstructions without a legend. Naming, activation, travel, roads and tutorial restrictions remain available.
- Shortcut groups fit the viewport without saving temporary layout adjustments over the player's preferred positions; revealing or expanding the Node Map leaves the bars in place.
- Shortcut assignment uses narrow icon/name columns with at most five nodes in each. Columns grow toward the side with more room; small windows can scroll horizontally through the remaining choices. Production and Logistics toggles filter the choices; pressing the active toggle again shows all nodes. Clicking anywhere outside the picker closes it while allowing the clicked control to work. Close, Escape, Clear Slot, research locks and tutorial restrictions are retained. Build omits the Storage category tab; the remaining storage nodes are available under All.
- New-game startup shows Production and Logistics bars and hides the empty third bar, including older cached empty layouts. The first genuine Storage unlock reveals it. F3 and Options still toggle it during play; all-hidden startup recovery restores the first two bars without resetting their geometry.
- Options begins with Save / Load, Commands, Recipes, Tutorials and Journal. The four game preferences use a two-column grid; action descriptions and dry flavor appear on hover or keyboard focus instead of under each title.
- Attached shortcut bars share one six-dot drag handle on the first visible bar. Other members show a padlock that releases just that bar; it regains its own six-dot handle and any remaining pair stays joined.
- Hold A while placing or dragging nodes to align their top-left corners to the 64-unit world grid. Options can keep snapping enabled; selected groups retain their internal spacing.
- Shift-right-click a configured machine, then Shift-left-click another machine of the same type to copy its recipe. Releasing Shift or pressing Escape clears the copy source; mismatched machines are ignored.
- Recipe pickers retain their remembered icon view and recipe tooltips. The production guide uses uniform larger ingredient/output bubbles, with the recipe to the right of its title and the time at the far right on one line. Guide cards have no subtext; hover shows only their flavor. Ingredient links still open producer recipes, compact guide icons expand on click, and long rows scroll horizontally on narrow screens. Node recipe buttons are removed; left-click still opens the picker.
- The Research Center restores its INACTIVE button/current-project indicator and shows overall consumed-Core progress without a percentage label.
- Selected research details use compact Core badges beside the title, a total at the right, and a generic Start button beside the flavor text. Badge tooltips retain per-Core costs and processed progress; badges still open their recipes.
- Source-game charcoal/steel/gold UI palette with its canonical names and player-facing descriptions
- Original node silhouettes, dimensions, vector icon family, embedded controls, directional ports, typed cable colors, and star/circle connection affordances
- Three movable, rotatable, resizable shortcut bars; hover help; full command reference; 11 × 11 Node Map; and an interactive field minimap
- Collision-safe placement/movement/world generation and obstacle-aware cable routing
- Connection validation follows known materials through logistics chains and buffers, including chains wired before their source. Charcoal cannot enter an ore socket through a generic Splitter, Merger, or Joint; valid mixed-material smart branches remain usable.
- Multi-node selections regain the original outlined selection and batch-delete button. It uses the deletion preference, removes attached cables together, and restores the batch with one undo.
- Five Goblin Camps, five Villages and five Kingdoms per new world, with research-aligned AP requirements and configurable direct-output Tribute while suppressed; tribute stores up to 100 materials and is lost on a failed AP check. See [obstruction behavior](docs/obstruction-types-and-behavior.md).
- Five Dwarven Camps, five Dwarven Villages and five Dwarven Kingdoms in separate map tiers 4–9 sectors, with higher recurring AP costs and larger tribute batches defaulting to Mythril. Their sectors exclude Goblins and the reserved Golem encounters.
- Four mineral Golems centered in separate clear tier 6 sectors. Each costs 10,000 AP once and becomes an infinite reserve of its mineral, with four directional star sockets for Extractors.

The implementation intentionally has no analytics, remote APIs, hosted assets, or cloud persistence.

## Progression design goals

**Research timing correction, November 2:** the live baseline is five seconds per synchronized Core set, not one. `npm run progression` refreshes the current live-catalog analysis using that baseline. Older benchmark, player-simulation, speedrun and waste-demand outputs must be rebased and regenerated before their timing/throughput conclusions are used for further balance work. See [analysis status](outputs/progression/README.md). Earlier measured playtests describe their original builds.

These goals govern research-core design. The reviewed general balance baseline
through tier 6 is implemented. The separate higher-cost one-hour speedrun
sensitivity candidate is not adopted. Pacing and geography still need playtests.

The ongoing [progression and scaling discussion](docs/progression-and-scaling.md)
records agreed direction, deferred topics and proposals still under review.

Use the [browser playtest startup and recovery procedure](docs/browser-playtest.md)
to verify browser access before starting a run and recover missing tab bindings.

Discovering Mythril processing grants basic Slag recovery and waste-handling
tools without a core payment. Slag washing still needs local Water. Existing
Mythril discoveries receive the unlocks on load; advanced recovery remains
with Precision Control.

The live additions include Hydro, Shiny and Complex Core chains, water processing,
Mythril separation, tier-6 probabilistic waste and deterministic recovery,
stronger bots, encounter unlocks, fluid/waste transport, road channels, shared
Storage/Inventory, repeatable capacity upgrades, mineral regeneration, resource
Golems and collision-checked factory templates. Random batch results persist
through saves; full waste buffers stop the next batch before consuming inputs.

Regenerate higher-tier catalogs with `node scripts/sync-progression-content.mjs`
after editing the reviewed design data. `npm run progression` reports the live
research bill; the older simulation pages are analytical experiments.

- Seven research levels in total. Simple, Basic, and Automata Cores establish the
  first three analytical levels; level seven is endgame.
- Paid research requires equal quantities of every core type through its highest
  required tier. For example, a Hydro-tier project costing 40 needs 40 Simple,
  40 Basic, 40 Automata and 40 Hydro Cores. Research unlocking a new core uses
  the preceding available tiers, so it never requires its own locked core.
- Price capability unlocks affordably so new tools and recipes arrive quickly.
  Efficiency and quality-of-life improvements are the larger, escalating
  investments: increase costs with upgrade rank and research tier, and escalate
  repeatable-rank costs. Keep these improvements optional for access to the next
  core tier; a cheap unlock must not hide an expensive mandatory upgrade gate.
- Efficient play should reach endgame in 20–30 hours. A factory with minimum
  viable research throughput may take substantially longer.
- Corner costs: Alpha 50 AP; Foundry 50 Circuit B, 25 Sealed Frames and 100
  Mythril Gears; Grove 500 growth; Reclamation ten Fines or proportionally mixed
  waste. Endgame Theory is retired. Victory requires manually researching
  A Remarkably Indirect Conclusion at the Research Center with one of every
  Core, Simple through Final. See the [cost review](outputs/balance-review-2026-11-05/review.txt).
- Perfect play should complete tier 6, including the research opening tier 7,
  within three hours from a fresh start while maximizing Research Center use.
  This is a separate checkpoint from the endgame target. Include startup,
  prerequisites and logistics gaps in that time, and distinguish lab-only time
  from elapsed playtime when estimating. All required core types are consumed
  together in synchronized research batches; buffers absorb delivery jitter.
- Maximum research throughput means sustained progress on every eligible
  Research Center tick, supported by production rather than a finite stockpile.
  A tick consumes one of every required core type simultaneously. The slowest
  required production stream determines research throughput (decision D04).
  The one Research Center is globally unique and anchored at Home (D13).
- Minimum throughput means a viable factory eventually produces the required
  cores but leaves significant gaps between research ticks.
- Research pacing should keep new logistics problems available: capability
  unlocks should finish by the earliest reasonable readiness time for the next
  challenge, as the current chain stabilizes. Optional upgrades must not gate it.
  While players build and troubleshoot the newest tier, established production
  should fund useful research from earlier tiers. Consider improvements funded
  one tier behind current production, with selected longer investments two tiers
  behind; this guides the next proposal revision rather than changing live costs.
- Future player simulations should overlap planning, building, troubleshooting
  and research. Track unlock, first working production, stable production and
  next-tier access. Measure forced waiting when research blocks the next useful
  logistics challenge and no useful progression work remains. Target zero forced
  waiting for efficient play and only brief gaps for typical first playthroughs.
  Human learning times are assumptions until calibrated by playtests.
- By endgame, minimum throughput should require 30–50% of the available world;
  maximum throughput should require about 90%. With 121 buildable maps, use
  37–60 active maps for the strict minimum range and 109 for the maximum target.
  World-map tier 10 contains endgame Monster Nodes (D01/D10); do not assume
  its currently empty corner maps are free industrial sites in the final design.
- Count productive map utilization, not merely unlocked or visited cells. Define
  each production network as a local factory cluster with an identifiable input
  and output; count road links separately from those clusters.
- Geographic resource requirements and sustainable per-map output must justify
  the coverage targets. Current free placement and shared recipes alone do not
  impose these map counts. Do not present future node/network counts as derived
  facts before the relevant core recipes and supply constraints exist.
- Every Extractor has a five-second base cycle, including newly placed and
  loaded nodes. Six efficiency ranks reduce effective cycles to 4.5, 4, 3.5, 3, 2.5
  and 2 seconds without changing that base value.

Run `npm run progression` to calculate the current research resource bills,
production-time bounds and lean/peak factory envelopes. The readable report is
`outputs/progression/review.html`, with detailed data in
`outputs/progression/analysis.json`. This analysis reads the implemented recipes
through tier 6.

Hydro, Shiny and Complex progression is implemented in live gameplay. Adopted
recipe and price settings are in
`outputs/progression/balance-settings.json`; the base proposal is retained in
`core-design-model.mjs`. Generate the reports in this order:

```powershell
node outputs/progression/core-design-model.mjs
node outputs/progression/waste-model.mjs
node outputs/progression/benchmark-model.mjs
node outputs/progression/player-simulation.mjs
node outputs/progression/speedrun-model.mjs
node outputs/progression/encounter-unlocks-model.mjs
node outputs/progression/encounter-simulation.mjs
```

Reports and JSON results are saved alongside their scripts. The current live
inspection is `review.html`; current comparisons are `benchmarks.html`, current
waste design is `waste-design.html`, the general player model is
`player-simulation.html`, and the necessary-only route is `speedrun.html`.

The general pacing revision makes access research cost 1–3 of each required
core. Nine machine efficiency lines now use six ranks: 10, 20, 30, 40, 50 and 60
of each required core, adding a core type per rank from Simple through Complex.
Other optional improvements retain their individual costs; repeatables use
ceil(base × 1.5^(rank−1)) each. Next-tier access
does not require optional efficiency research. These prices are implemented,
including cheaper Assembler/Exploration/Road/Automata access. All fixed research
totals 11,859 physical cores in 2,701 synchronized
iterations; direct inputs are 133,292 Copper, 114,215 Wood, 82,088 Iron, 5,029
Stone, 39,974 Water and 9,352 Mythril, without recycling credits or support costs.

No core may consume another core, directly or through intermediates. A recursive
dependency check enforces this for all six core recipes. Research still consumes
equal quantities of all required core tiers. Copper Slurry replaces
the slurry name; its recipe is unchanged (2 Water + 1 Copper Wire + 1 Charcoal
produces 2 in 8s). Stable calculation IDs remain separate from display names.
Hydro uses 1 Hydro Piston + 1 Electrode + 2 Coolant. Shiny uses
1 Mythril Mesh + 1 Hydro Piston + 2 Circuit A. Complex uses 1 Logic
Substrate + 1 Controller + 1 Servo Piston. Electrode
uses Brick, Copper Wire and Dispersion; Mesh uses Pure Mythril and Copper
Wire and Coolant; Substrate uses Circuit A, Electrode and Mythril Wire. They
unlock alongside their respective core access research. The current recipe
reference is `outputs/progression/core-recipes.html`, regenerated with
`node outputs/progression/core-recipes-model.mjs`.
Pure Mythril is dry-produced from 1 Mythril Plate + 4 Iron Plates + 1 Charcoal, yielding 2 Pure Mythril + 2 Slag in 12s. Mesh takes 18s. Controllers use Mythril Gear; Servo Pistons use Mesh and 3 Coolant. All three Complex components take 30s. Precision Control unlocks two Assembler batches: 4 Copper Gears or 4 Iron Wires plus 1 Mythril Plate produce 4 Mythril Gears or Wires in 12s. Existing single-metal Refiner recipes remain available.
Final core cycles are Hydro 18s, Shiny 24s and Complex 36s. Extractors retain
their five-second base cycle. Tier 5 refining produces guaranteed Slag only;
independent Fines/Flux/Crust probabilities begin with tier 6 intermediaries.
Rare waste never gates progression. Basic recovery unlocks at Mineral Recovery;
sorting and advanced recovery unlock with Precision Control.

The general simulation runs 200 seeded duration/uptime variations and checks
paid prerequisites and core conservation. It uses explicit assumed player
action times, not calibrated learning data. The revised experienced scenario
has no modeled forced waiting; the first-playthrough scenario has about four
seconds. Independent-core recipes reduce maximum-supply construction demand;
read the generated reports for current times and production/support counts.
These results assume resource/map access and do not validate a full playthrough,
the final 37–60 versus 109 productive-map goals, combat, power or waste stalls.
Production speed upgrades are not credited in machine-capacity estimates.
Before-balance JSON snapshots retain the previous comparison.

The separate speedrun model treats five seconds as one node plus its first
connection, with an assumed 2.5 seconds per additional connection. It buys only
the paid prerequisite closure to Endgame Theory plus Assembler and Road, with
no optional upgrades. Core production is capped at necessary route demand.
A rate-grid search with coordinate descent is a local optimization, not proof
of the fastest possible route. The current general prices produce a roughly
20-minute abstract rush route.

A separate one-hour candidate in `speedrun-one-hour-candidate.json` multiplies
only tier-3-and-later required access prices by a searched multiplier. It is
regenerated after recipe changes; its current timings and counts are in
`speedrun.html` and `speedrun-results.json`. It is
not adopted into the general design or live game because it creates long waits
for slower factories. Source placement, map expansion, finite deposits, travel,
combat, power and explicit waste queues remain outside the model. Keep the
one-hour necessary-route goal distinct from the three-hour maximum-throughput
checklist and the 20–30-hour tier-7 endgame target.

The [research proposal](https://chatgpt.com/space/page_3f63cbe142508191a73e41bc10b7f530)
also records design decisions. Routine construction stays free, Road channels
retain sending-chest instant batches, and late Storage/Inventory share one pool
with initial Inventory outputs through Filters. Regeneration and combat-earned
Resource Golems provide the intended late renewal direction. These systems
remain proposals; synchronized consumption is implemented in the live lab.

Encounter-based machine access is implemented; details are in
`outputs/progression/encounter-unlocks.json` and `encounter-unlocks.html`.
First entering an activated map with a Lake grants water tools and Coolant;
Mythril grants the Separator, refining and Slag Hopper.
Fabricators grant Assembler IIs with familiar recipes, and
Sorting Ruins grant waste handling early. Core recipes and upgrades
remain paid research. Precision Control remains a handling fallback so rare
landmarks never block recovery. Required discoveries must be guaranteed reachable
before their production tier, with persisted early discoveries and no circular
access requirements. These unlocks are live. General timing estimates
do not schedule encounters; the separate `encounter-simulation.html` experiment
now models two required discovery waves and limited preparation during research
gaps. It assumes one minute of active scouting per nearby wave, one worker and
up to 25% of the next tier's placement work prepared early. With unchanged
candidate prices, it reoptimizes factory rates and reports waiting separately.
Earlier nested-core timings are superseded by independent-core recipes; use the
regenerated report rather than the historical numbers. General low-wait profiles mostly gain
no preparation benefit and pay the additional scouting time. These are
conditional scenarios, not measured map routes. The experiment checks core
conservation, discovery before commissioning and single-worker placement time,
and includes 200 paired seeded profile comparisons.

### Map readability and factory size estimates

Use these working estimates for future core, throughput, resource and network
budgets. They assume a 1080p display and the current node dimensions and renderer;
they are layout estimates, not measured usability limits or enforced node caps.
Revisit them when node sizes, connection rendering or map dimensions change.

| Map size | Comfortable total nodes | Dense but manageable |
| --- | ---: | ---: |
| Home map | 35–50 | 60–70 |
| Medium outer map | 50–80 | 90–110 |
| Large expanded map | 80–120 | 140–160 |

Total nodes include machines, resources, chests, splitters, mergers, joints and
road endpoints. Large maps require panning between production areas; fitting the
whole map onscreen does not preserve readable connections and directionality.

- Balance ordinary occupied maps around 50–70 total nodes, using **60 nodes per
  map** as the default estimate. Treat 100 as a practical readability soft ceiling
  for ordinary maps; larger expanded maps can support more with organized lanes.
- At readable working zoom, target 12–20 visible production machines plus their
  supporting logistics. Most machines are now 256 × 192–256 world units on a 64-unit size grid; allow roughly
  450 × 340 units per machine position for cables and separation. Compact logistics
  nodes can use some of that space.
- A typical 60-node map should budget 30–40 production machines and 3–4 local
  networks of roughly 10–15 nodes each, plus shared infrastructure. These are
  approximate allocations within the total, not quantities to add together.
- Preserve distinct production lanes and traceable connections. Cable crossings,
  overlapping routes and ambiguous flow can make a smaller factory harder to read
  than a larger, well-organized one.
- For minimum-throughput endgame estimates, use 37–60 occupied maps averaging
  40 total nodes: **1,480–2,400 nodes across the world**.
- For maximum-throughput endgame estimates, use 109 occupied maps averaging
  60 total nodes: **about 6,540 nodes across the world**.

These are factory-size budgets for designing subsequent cores. Actual node and
network requirements must still be derived from recipes, sustainable supply,
logistics and the agreed map-utilization goals.

## Adding or editing nodes

Node behavior is data-driven so an ordinary node variant does not need another
hard-coded kind check in the engine. Keep these catalogs in sync:

- `src/content/nodes.ts` — player-facing name, description, ports, unlock, color, and catalog metadata
- `src/content/nodeCapabilities.ts` — simulation behavior, capacities, defaults, routing, uniqueness, obstacles, and placement constraints
- `src/content/nodeModules.ts` — shape, icon, size family, controls, and configuration interaction
- `src/content/recipes.ts` — production inputs, outputs, machine groups, and timing
- `src/ui/NodeIcon.tsx` and `src/renderer/drawNodeIcon.ts` — matching DOM and Pixi vector icon implementations
- `src/simulation/connectionRules.ts` — shared port-family compatibility and world-obstacle routing rules

Prefer an existing capability behavior for a new node. Add a new simulation
branch only when the node introduces a genuinely new interaction. New saved
fields should be optional and normalized on load so existing save slots remain
valid. `catalogIntegrity.test.ts` fails when catalogs, recipes, research links,
or port families drift out of sync.

## Verification

The main module boundaries are:

- `src/ui/App.tsx` coordinates the live factory and tutorial session. Its dialogs live in `src/ui/panels`, with common controls in `src/ui/components`.
- `src/simulation/engine.ts` coordinates simulation and factory editing. `researchRuntime.ts` owns research payments and milestones; `factoryTemplateRuntime.ts` owns saved layouts. Both read current state through a getter so undo and loading do not leave stale state references.
- `src/domain/nodeGeometry.ts` supplies node sizes and sockets to simulation, rendering, and tutorials. `src/renderer/nodeLayout.ts` remains a compatible import path.
- `src/renderer/PixiPlayfield.tsx` owns the Pixi lifecycle and interaction state. Cable geometry, drawing primitives, buffers, view types, and the palette live in separate renderer modules.
- `src/persistence/saves.ts` handles browser slots. Legacy payload conversion lives in `legacyMigration.ts`; existing browser keys are centralized in `storageKeys.ts`.
- `src/tutorials/tutorialRuntime.ts` preserves the tutorial API while definitions, placement rules, practice states, dialogue, and completion checks live separately.
- `src/styles.css` imports the component and responsive styles in their original cascade order.

Runtime TypeScript checks reject unused imports and parameters. Architecture tests keep simulation and persistence independent of the renderer and verify persisted key compatibility.

```powershell
npm test
npm run build
```

Run the opt-in simulation stress benchmark with `npm run stress`. It exercises
up to 121 maps, 32 independent networks per map, production, and simultaneous
paired-road deliveries. Each scenario warms up for five simulated seconds and
measures another 30 seconds using the application's 100 ms tick. It checks item
conservation, nonnegative inventories, and delivery to every destination, then
writes timing and state-size measurements to `outputs/stress/latest.json`.
The synthetic graphs bypass placement checks and use preloaded source buffers.
This benchmark measures the engine in Node; browser rendering, autosave writes,
and undo history are outside its scope. Ordinary `npm test` skips it.

Simulation phases build temporary indexes for nodes, cables, and pending items
by destination. Routing updates those reservations immediately so several
sources cannot overfill the same input. Indexes are discarded after each phase,
so editing, undo, and loading saves do not require persistent-cache invalidation.
All unlocked maps retain the same simulation timing. The renderer reads a cached
list of active-map transfers and updates particles independently of node/cable
views; background-map transfers do not create animation objects.

## Progression follow-up decisions

Living discussion list, updated 2026-10-30. Values marked provisional below are
implemented defaults to review, not settled endgame balance.

- [ ] **Tier 7 and victory:** choose the final core, intermediates, research,
  geographic requirements and completion condition. Endgame Theory is retired;
  it does not invent a seventh core or victory screen. Complex Core is the canonical tier-six name.
- [ ] **Playthrough pace:** measure actual learning, exploration, building and
  rebuilding time. Targets remain about one hour necessary-only speedrunning,
  three hours through full tier 6 at maximum throughput, and 20–30 hours through
  efficient endgame. The five-second node-plus-first-connection assumption and
  abstract simulations require real playtesting. Decide whether any speedrun
  sensitivity candidate should replace the currently adopted cheap access costs.
- [ ] **World utilization:** derive actual sustainable production limits to make
  37–60 productive maps sufficient at minimum throughput and roughly 109 needed
  at maximum. Prices alone do not enforce this. Keep the readability estimate of
  60 nodes per ordinary map and a soft ceiling near 100; validate connection clarity.
- [ ] **Discovery geography:** early fabrication is guaranteed at (6,5), water
  and Mythril at (7,5), sorting at (5,7). Review fixed coordinates versus seeded
  variation, travel costs, obstruction and encounter timing. Legacy saves treat
  previously unlocked maps as visited because the older format had no visit history.
- [ ] **Waste:** tune independent tier-6 probabilities (controller: fines 65%,
  crust 8%; actuator: flux 35%, crust 5%), burst headroom, recovery throughput and
  demand for recovered materials. Mythril separation produces guaranteed slag.
  Rare waste is never a mandatory progression ingredient. Discuss recovery sinks.
- [ ] **Fluid logistics:** review intake 4/8/16 water per second, at most two
  Intakes per Lake, Fluid Link 16 units/second, fluid storage 256 and fluid-road
  receiving capacity 256. There is currently no pressure simulation.
- [ ] **Road throughput:** pairs move one solid item per five seconds directly
  between connected nodes, with no Road inventory. Blocked trips leave stock at
  its source. Review throughput against Cart/Truck/Train capacities of 20/40/80;
  face slots progress from 1 to 2 to 3. Fluid Roads remain retired.
- [ ] **Waste logistics:** review 32 combined waste at processors, 200 per hopper,
  sorter input 32 per type and 40 units/second routing. Review how mixed waste
  outputs and recovery feedback feel under sustained load.
- [ ] **Global storage:** provisional pool cap is 1,000 per item. Initially one
  Storage and one Inventory placement; two Storage inputs and one Inventory
  output, increased by repeatable research. Inventory supplies one unit per
  connected Filter per second. Define final caps, UI and any tier-7 pool upgrade.
- [ ] **Bots and combat:** strength is 1/3/8/20 for Small/Medium/Heavy/Command.
  Regional camp checks provisionally require 3, 8, 20, 35 or 50 strength as
  distance increases. Review disposable supply, combat costs and regional pacing.
- [ ] **Resource Golems:** four fixed resource encounters provisionally have
  100 health and, once defeated, produce one unit each of two materials per
  second with a 64-item buffer. Set rewards, distribution, strength and whether
  this sustainable supply competes appropriately with drills and regeneration.
- [ ] **Power — deferred:** removed from the playable game in Q10. Reconsider only
  when it has a clear role that justifies the added complexity; it is not required
  for the stabilization milestone.
- [ ] **Sustainability:** mineral regeneration starts at one unit/30 seconds,
  improves to one/15 seconds, then adds 20% of base rate per repeatable rank.
  Validate depletion, forestry, drills and Golems across the full progression.
- [ ] **Templates and research UX:** templates save empty machine layouts and
  internal connections with atomic collision validation. They exclude the unique
  lab, paired roads and global-pool nodes. Consider mouse placement previews and
  editing/sharing templates. Research selection is manual; no queue is specified.
- [ ] **Performance:** all unlocked maps simulate live; only the active map
  renders. Offline catch-up is disabled to avoid double production. Recheck
  browser rendering, save size and undo costs at the intended 6,540-node scale.

Latest implementation verification: 93 regular tests pass; production build passes.
The opt-in eight-scenario stress test passes conservation and per-destination
receipts. At 121 maps / 32 synthetic networks per map (23,232 nodes), production
averaged about 17 ms/tick (p95 74 ms); busiest pass-through logistics averaged
44 ms/tick (p95 152 ms). These are engine-only measurements on this machine,
not browser frame rates or guaranteed limits. Results: `outputs/stress/latest.json`.

### Linear machine efficiency research

Extractor, Kiln, Smelter, Refiner, Assembler, Research Center, Hydro Plant,
Assembler II and Separator each have six
ranks. Rank r costs 10r of every core from Simple through tier r and uses
(100 - 10r)% of base cycle time. Each rank requires its preceding rank; ranks
3–6 additionally require Automata Core, Hydraulic Assembly, Ore Separation and
Precision Control respectively. These upgrades remain optional for core access.
Existing completed ranks retain their effects. See [the research catalog](docs/research-catalog.md).

The dedicated Automata Core Assembler is removed. Automata Core production uses
the regular Assembler. Old saves and templates convert the retired machine
without removing stored items, recipe progress or connections.

### Map Node research and full world access

Exploration costs 1 Simple + 1 Basic Core and grants the first Map Point.
Map Node completions 1–9 cost 5 Simple Cores each, making exploration the first
sustained reason to scale Simple production while Assembler stays at 1 Simple.
Completions 10–19 rise from 6 to 10 each through Basic, 20–29 from 11 to 15 through
Automata, 30–39 from 16 to 20 through Hydro, 40–49 from 21 to 25 through Shiny,
and 50–59 from 26 to 30 through Complex. Each price lasts two purchases within
these later phases, introducing the new core before demanding more output. Together with
Home and Exploration, those 59 purchases fund 61 of 121 maps.

For the remaining 60 maps, prices increase by 1 per required core every five
purchases, from 31 to 42 each. A core only becomes required once its recipe is
unlocked. Active purchase quotes persist across core unlocks and saves until
completion or a project change. Earned points and old completion counts remain
valid. Further purchases stop when all maps are unlocked or banked points cover
every remaining map.

With each core unlocked by its scheduled phase, full-world access costs 17,287
physical cores in 3,136 synchronized sets, including Exploration. This is a
research bill, not elapsed playtime or productive-map coverage.
