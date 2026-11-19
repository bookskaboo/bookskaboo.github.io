# Working factories to reuse in future playtests

Recorded November 5, 2026. Read this with [browser playtest startup](browser-playtest.md) before a new run. This is a build reference, not a starter factory, save injection or proof that an old layout fits a new seed.

## What the last run actually verified

The published normal-UI run reached a working Medium Bot factory on S2: an isolated Cart held seven actual bots, with consecutive increases from five to six to seven after fuel and Plate repairs. Slot 2 was saved at **05:09:24** as **UI playtest — Medium Bots sustained**. This is the successful checkpoint to consult if it still exists; do not overwrite or reset it while recovering a browser.

One Medium Bot was subsequently traced through isolated inventories on S3, S4 and S5. Those observations establish one delivered bot, not three separate bots or sustained remote delivery. Later source scaling through a Merger/Joint starved Plate branches; that revised route was not verified. The final halt at **06:38:18** is not the working baseline. See the [corrected halt report](../outputs/live-ui-playtest-2026-11-04/halt-review-2026-11-05.txt) and [chronological log](../outputs/live-ui-playtest-2026-11-04/run-log.txt).

Exact node IDs/positions and a complete successful connection graph were not exported. The wiring table below reconstructs the required functional connections from the live recipes and the verified repairs. Recheck placement and every real input on a new map; do not claim it is an exact saved blueprint.

## Research supply that worked through Hydro

Simple, Basic and Automata Cores repeatedly funded research after remote replenishment; Hydro delivery also funded multiple projects. The run did not verify Shiny or Complex production. Preserve these earlier lines while starting bots: a new tier does not replace the earlier research inputs.

| Core or intermediate | Required functional wiring |
| --- | --- |
| Simple Core | Copper Extractor → Copper Smelter (plus Charcoal) → Copper Gear Refiner (2 Plates per Gear) → Simple Core Refiner (2 Gears per Core) → Research Center |
| Basic Core | Copper Smelter supplies 1 Plate; Iron Smelter → Iron Wire Refiner supplies 1 Wire (3 Plates). Both feed a Basic Core Assembler → Research Center |
| Circuit A | Copper Wire Refiner supplies 1 Wire; Iron Smelter supplies 1 Plate → Circuit A Assembler |
| Automata Core | Circuit A Assembler supplies 1 Circuit A; Stone Extractor → Brick Refiner supplies 1 Brick → Automata Core Assembler → Research Center |
| Copper Slurry | Lake-fed Pump supplies 2 Water, Copper Wire Refiner supplies 1 Wire, and Kiln supplies 1 Charcoal → Hydro Plant producing 2 Slurry |
| Circuit B | Brick Refiner supplies 1 Brick; Copper Wire Refiner supplies 1 Wire; Slurry Hydro Plant supplies 1 Slurry → Fabricator |
| Hydro Core | Hydro Piston branch below supplies 1 Piston; Circuit B supplies 1 Circuit B; Coolant Hydro Plant supplies 2 Coolant → Hydro Core Fabricator → Research Center |

Where a Core crosses maps, collect it in a sending Cart and use the Road route below. Keep Water processing near a Lake. Plate, Wire, Charcoal and Coolant branches are shared demand: new consumers need extra supply, not the removal of an earlier consumer's only cable. Verify repeated research payments, not just initial buffers or a colored cable.

## Medium Bot wiring reference

See [NODE Bot Production](https://chatgpt.com/space/page_f61bbb51dba88191b758234023997faa) for part recipes, research costs, and the AP of every pairing.

Keep this chain independent until repeated output is verified. The wiring below incorporates the revised recipe catalog. The prior browser runs used the former Core-fed Medium Bot recipe.

| Producer | Required incoming items | Output goes to |
| --- | --- | --- |
| Wood Extractor → Kiln | 1 Wood | Charcoal to **every** active Iron/Copper Smelter |
| Iron Smelter | 2 Iron + 1 Charcoal | Plates to Gear, Wire, Frame, Gun, Coolant and Cooled Gun branches |
| Copper Smelter | 2 Copper + 1 Charcoal | Plates to Copper Wire and Basic Core branches |
| Iron Gear Refiner | 2 Iron Plates | Motors and Hydro Pistons |
| Iron Wire Refiner | 3 Iron Plates | Basic Cores |
| Copper Wire Refiner | 3 Copper Plates | Motors and Robot Guns |
| Motor Assembler | 1 Iron Gear + 1 Copper Wire | Robot Frames and Hydro Pistons |
| Robot Frame Assembler | 2 Iron Plates + 1 Motor | Sealed Frame |
| Robot Gun Assembler | 1 Copper Wire + 2 Iron Plates + 1 Brick | Cooled Gun |
| Lake-fed Pump → Coolant Hydro Plant | 4 Water + 1 Iron Plate → 2 Coolant | Hydro Piston and Cooled Gun |
| Hydro Piston Fabricator | 1 Iron Gear + 1 Motor + 2 Coolant | Sealed Frame |
| Stone Extractor → Brick Refiner | 1 Stone → 1 Brick | Sealed Frame and Robot Gun |
| Sealed Frame Fabricator | 1 Robot Frame + 1 Hydro Piston + 2 Bricks | Bot Plant |
| Cooled Gun Fabricator | 1 Robot Gun + 2 Coolant + 2 Iron Plates | Bot Plant |
| Basic Core Assembler | 1 Copper Plate + 1 Iron Wire | Research Center |
| Assemble Bot in Bot Plant | 1 Sealed Frame + 1 Cooled Gun | **Isolated collection Cart first**, then export |

Each cable must reach the correct ingredient socket. Charcoal present at a Kiln is not proof that it reaches a Smelter. In the successful repair, a Smelter had ore but an empty Charcoal input; a direct fuel connection restored cycling. Gear/Frame production also depended on repairing the Plate branches. Keep the working branches while adding capacity; the later Merger/Joint rewrite was an unsuccessful scaling attempt, not a known improvement.

For steady production at two Medium Bots/minute, standard ingredients average **56 Iron, 36 Copper, 46 harvested Wood, 16 Water and six Stone per minute**. These figures are an analytical supply budget. The local 20-second recipe allows one fully supplied base final assembler to make three bots per minute. Upstream production, routing, depletion and shared Core demand can lower actual output.

## Road route that delivered a real bot

Use **sending Cart → sending Road → paired receiving Road → receiving Cart** for each map crossing. Both Road endpoints require a direct connection to a freight vehicle (Cart, Truck, or Train). Put Joints before the sending vehicle or after the receiving vehicle to clear obstructions. Use the receiving Cart to feed the next Road directly in a multi-map relay. Inspect the Road direction after placement. Base Cart Roads carry 12 items/minute.

First isolate the source Cart and count two or more new completed bots without rewiring. Then connect export, isolate the destination Cart and verify its actual contents increase. A colored cable, moving bar or empty inventory pip is not delivery evidence. Preserve a normal save checkpoint before replacing a working distribution route.

## Other reusable recovery and research lessons

- N1.W2's Copper factory successfully exported **Copper Wire** through a direct Cart/Road/Cart pair into N1.W1. The receiving Cart then split to the old Wire branch and the Motor input. Imported Wire was visibly stored at the destination; Motor, slurry, Piston and Hydro Core machines resumed cycling. Repeated Hydro Core delivery was not separately counted.
- At the final halt, Home Research Center held Simple 5, Basic 5, Hydro 5 and **Automata 0**. Identify the missing Core before rebuilding another chain.
- Metal depletion is real; plan new deposits, ordinary Mining Drills or other normal recovery. Wood regenerates, so net Forest drawdown is not gross harvested Wood. Preserve totals and distinguish production waiting from construction/diagnosis in each new report.
- Suppress the intended settlement rather than an arbitrary nearby Goblin camp when pursuing Mythril. Inspect the actual AP/check and Tribute rate. Dwarves supply Mythril after reaching minimum size and maintaining successful checks; collect from the separate Tribute box, not the camp's AP input.

Update this guide with verified improvements after later runs. Keep failed experiments and observed limits distinguishable from working connections.

## November 6 replacement-run verification on N2

The published game was repaired through ordinary UI wiring and construction only. After earlier buffered restarts failed, the final unchanged observation lasted **314 seconds**: an isolated Medium Bot Cart increased from **9 to 20**, and the assembler continued cycling into its own output buffer after the Cart filled. This verifies sustained local production over that window, not sustained camp delivery or an indefinitely supplied factory. The game was left paused. See the [review log](../outputs/live-ui-playtest-2026-11-05-replacement/verified-medium-bots-2026-11-06.txt) and [screenshot](../outputs/live-ui-playtest-2026-11-05-replacement/medium-bots-sustained-verified.jpg).

- Read the normal UI Basics and Logistics guides: **circle sockets hold one cable; star sockets support several.** A Joint's input and output share its center. Adding consumers to a circle output can replace a working feed. Use verified Splitters or unlocked solid-storage Carts for shared supplies, and Pumps for shared fluids.
- The fuel repair required the whole loop: Forest → Wood Extractor → Splitter → both Kiln and Tree Planter Wood input. The Planter also needed Stone and Iron Plate supplies, and its Growth output connected back to the Forest. Forest stock had reached zero; restoring those inputs visibly restarted growth and later recovered more than 100 Wood.
- Trace the **actual Kiln output** to a dedicated Charcoal buffer, then each Smelter's Charcoal socket. A stocked, gray inventory in an older Cart does not identify its contents. The successful final branch used a fresh fuel Cart below the Lake, reached around the left shore, with separate outputs to the left Iron, Copper, middle Iron and bottom Iron Smelters.
- Keep dedicated Plate supply to Iron Wire → Basic Core. Share the right Iron Smelter's output through a fresh Plate Cart to forestry, Coolant and Gear production; restoring forestry must not remove Coolant's only Plate cable. Keep the existing Coolant Pump supplying both Pistons and Cooled Guns.
- Preserve ore supply through normal Mining Drills and resource connections. A further 20-Motor Drill completed as a 1,000-Iron deposit in this repair. Finite ore maintenance remains necessary; the measured window does not establish an infinite resource loop.
- Placing logistics nodes onto a cable can inherit that route. Check its material and both endpoints before reusing it. Keep sockets comfortably away from screen edges while wiring: edge auto-pan made several coordinate attempts miss their intended sockets. Take a fresh screenshot after any camera movement.
- Isolate a new collection Cart, record a baseline, and watch long enough for the original five-item buffers to drain. This run restarted several times before stopping at nine Bots; only the later 314-second interval qualifies as the successful sustained check. The final 20-item Cart is full and needs export or more storage before a longer test.

These are verified functional lessons, not an exported blueprint or a claim that the experimental factory has been cleaned up. UI diagnosis and construction dominated the elapsed run and should not be treated as production waiting in a balance estimate.

## November 6 Hydro and Tree Planter recovery

The same replacement run subsequently completed **Precision Control** through normal UI repairs. Home then held **five Hydro Cores** after spending two on that project: at least seven fresh deliveries were verified. This is a recovery checkpoint, not victory or an indefinitely sustainable factory. See `outputs/live-ui-playtest-2026-11-05-replacement/run-log.txt`, `hydro-repair-home-five.jpg` and `tree-planter-forest-34.jpg`.

- Restore the entire Gear → Piston → Hydro chain. In this repair, the Gear Smelter's Plate output, Gear Refiner → collection Cart, Cart → Piston Gear input, Motor delivery and Piston Cart → Hydro Core input required attention. Retain shared supplies through Cart star outlets; a first research payment alone did not establish continued production.
- **The original N3–N2 northern relay carries Motors, not Wood.** A later attempt to add actual Wood was rejected explicitly as mixing Motor and Wood. Earlier descriptions of that relay as a Wood import were incorrect. Inspect cable material and Road feedback before assigning a stocked inventory a role.
- Add a separate Wood crossing without changing the Motor route: N3 Forest → new Wood Extractor → Joint → dedicated Wood Cart → separate south Road; paired N2 north Road → Wood-only receiving Cart → Tree Planter Wood input. Placement from the less obstructed receiving side succeeded after placement from N3 was blocked by N2's endpoint clearance. Set the direction explicitly to N3 → N2.
- The Tree Planter was short of Wood for its next funded batch. A brief isolated-output check showed five stored Forest Growth units once supplied. Reconnect Growth to the Forest afterward and verify actual recovery: N2 Forest increased **0 → 34** while Extractors continued harvesting. No Tree Planter code defect was established.
- Keep both wiring endpoints away from screen edges. Edge panning shifted the camera during some drags and caused missed connections. Inspect a fresh settled screenshot and the exact socket, then verify receipt. Clicking a cable exposes its material and producer → recipient names in the normal UI; use that evidence instead of inferring material from gray pips or overlapping lines.

The earlier halt's southern relay experiments remain unverified except where explicitly superseded by the successful paths above. No developer controls, reports, save injection, accelerated time, code fixes or rule changes were used. Ordinary finite-deposit maintenance still applies; sustained Medium Bot/camp throughput was not remeasured during this Hydro repair. UI improvements remain queued.

## November 11 headless endgame route

- Reserve one of each pre-Final Core at Home before releasing the research Roads. The first Final Core then paid for A Remarkably Indirect Conclusion 7.6 seconds after production on seed `680312004`.
- Size a surveyed factory site for both its raw reserves and its open floor. An existing Hydro and Mythril attack district could not fit the Iron attack line. The Iron attack worked on a less developed Lake, and the Foundry district reused that floor after the five Bots arrived.
- For the Grove, make Iron Plate on an adjacent surveyed map with Wood, Iron and Stone. Three separate short Roads delivered Wood, Stone and Plate to two Tree Planters and produced the Grove piece. An earlier cross-world Iron Plate route stalled at a crowded crossing.
- Reserve room for the Road pair, both freight vehicles, and their local cables. Moving a Road farther along the boundary let the Iron attack pass a crossing where the first pair had no usable receiving Cart position.

The [headless research report](blind-research-playtest-2026-11-11.md) records the recovered route and phase totals. These layouts were exercised through normal engine actions on one seed.

## November 12 research Tribute routing

The balance pilot needed more Mythril before the first Golem attack. A parallel attack route filled its reserve Carts while the Complex line waited for ore. The successful run capped and completed the research shipment first, then retired that route and supplied the attack. It also reused the completed Shiny line's floor space for Complex while keeping the Lake intake and Mythril receiving Cart. [Pilot trace](../outputs/core-consumption-pilot-2026-11-12/measured-progress.log)

The earlier Shiny Golem Survey pilot paid for Golem combat after first Shiny on all three tested seeds. In the current build, visit the Golem camp and deliver Suppression Bots directly. Add another Home Cart when a research shipment exceeds the combined capacity of the Research Center and its supply Cart. [Balance proposal and pilot results](core-consumption-balance-proposal.md#golem-survey-follow-up)

## November 12 corner freight with two Road channels

When the Foundry crossing is full, deliver the ceramic electrode quota, retire its Road pairs, and reuse the crossing for sealed frames. At the Grove, fill the receiving Cart with ten Stone, then switch that Road slot to Iron Plate. Keep the receiving Stone Cart and wire it to the Tree Planters. Both changes worked through first victory on all three paired seeds. [Road Channels 2 payback test](../outputs/road-channels-payback-2026-11-12/README.md)

## November 12 Tribute-first route

Before surveying the corners, find a small Dwarven Camp and two Lake sites with enough local reserves for the Medium Suppression Bot and Shiny factories. Stage 34 Medium Bots at the camp, connect the reserve, and ship the resulting Mythril Tribute from its own Cart to the Shiny factory. This sequence produced the first Shiny Core on all three paired seeds. [Tribute-first playtest](../outputs/tribute-first-playtest-2026-11-12/README.md)

Once a suitable Medium Bot Lake is surveyed, pay for Sealed Robotics and start the factory and staging freight while scouting for the Shiny site. The earlier start reached first Shiny 6–22 minutes sooner on the same three seeds. [Bot production during scouting](../outputs/bots-during-survey-playtest-2026-11-12/README.md)

Size the first Shiny site for Shiny production. If the Lake lacks Copper, smelt Plates on a surveyed supplier map and connect its receiving Cart to the Shiny factory's Copper Plate bus. This worked over one Road crossing on seed 680312004. [Shiny siting and imports comparison](../outputs/shiny-with-imports-playtest-2026-11-12/README.md)

For a later wave of map purchases, check Simple Core stock still accessible at Home after retiring the original research Roads. Plan a replacement shipment when needed. Maintain Dwarven Tribute until the Mythril Golem attack is supplied. A second Medium Bot factory with its own staged receiving Cart restored supply on all three measured seeds. Disconnect the retired feed before wiring the new Cart to the camp's single input. [Full distributed layout comparison](../outputs/distributed-victory-playtest-2026-11-12/README.md)

For the rounded research bills, reserve the Shiny Lake's planned solid inputs before siting the earlier Core banks. Add Home Carts so the Research Center can draw from more than one load of each required Core. If the largest Complex factory cannot fit on the surveyed Lakes, retry at a smaller production target before opening additional maps. These steps completed all six pilot runs. [Core Assembly Efficiency comparison](../outputs/core-efficiency-payback-2026-11-12/README.md)

For inward freight, build Circuit A on an outward neighbor for Shiny. Give Complex separate Circuit A and Hydro Piston suppliers and keep the Piston line at a Lake. Routes of up to four crossings let all three seeds fit the planned Complex factory. If Reclamation has no free route home after its piece appears, finish the Dragon shipment and release its Roads, then return the pieces. Both arms of seed `10` used that sequence. [Peripheral supply results](../outputs/peripheral-supply-playtest-2026-11-12/README.md)
