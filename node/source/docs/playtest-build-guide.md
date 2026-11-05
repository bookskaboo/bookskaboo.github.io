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
| Copper Slurry | Lake Intake supplies 2 Water; Copper Wire Refiner supplies 1 Wire; Kiln supplies 1 Charcoal → Hydro Plant producing 2 Slurry |
| Circuit B | Brick Refiner supplies 1 Brick; Copper Wire Refiner supplies 1 Wire; Slurry Hydro Plant supplies 1 Slurry → Assembler II |
| Hydro Core | Hydro Piston branch below supplies 1 Piston; Circuit B supplies 1 Circuit B; Coolant Hydro Plant supplies 2 Coolant → Hydro Core Assembler II → Research Center |

Where a Core crosses maps, collect it in a sending Cart and use the Road route below. Keep Water processing near a Lake. Plate, Wire, Charcoal and Coolant branches are shared demand: new consumers need extra supply, not the removal of an earlier consumer's only cable. Verify repeated research payments, not just initial buffers or a colored cable.

## Medium Bot wiring reference

Keep this chain independent until repeated output is verified. All quantities below are current standard recipe batches, without the unimplemented Wire/Gun discounts discussed in the cost review.

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
| Robot Gun Assembler | 1 Copper Wire + 2 Iron Plates | Cooled Gun |
| Lake Intake → Coolant Hydro Plant | 4 Water + 1 Iron Plate → 2 Coolant | Hydro Piston and Cooled Gun |
| Hydro Piston Assembler II | 1 Iron Gear + 1 Motor + 2 Coolant | Sealed Frame |
| Stone Extractor → Brick Refiner | 1 Stone → 1 Brick | Sealed Frame |
| Sealed Frame Assembler II | 1 Robot Frame + 1 Hydro Piston + 2 Bricks | Final Medium Bot assembler |
| Cooled Gun Assembler II | 1 Robot Gun + 2 Coolant + 2 Iron Plates | Final Medium Bot assembler |
| Basic Core Assembler | 1 Copper Plate + 1 Iron Wire | Final Medium Bot assembler; keep research supply funded separately |
| Medium Bot Assembler II | 1 Sealed Frame + 1 Cooled Gun + 1 Basic Core | **Isolated collection Cart first**, then export |

Each cable must reach the correct ingredient socket. Charcoal present at a Kiln is not proof that it reaches a Smelter. In the successful repair, a Smelter had ore but an empty Charcoal input; a direct fuel connection restored cycling. Gear/Frame production also depended on repairing the Plate branches. Keep the working branches while adding capacity; the later Merger/Joint rewrite was an unsuccessful scaling attempt, not a known improvement.

For steady production at two Medium Bots/minute, standard ingredients average **68 Iron, 40 Copper, 54 harvested Wood, 16 Water and four Stone per minute**. This is an analytical supply budget, not the measured rate of the saved factory. One fully supplied base final assembler has capacity 2.4 bots/minute. Upstream production, routing, depletion and shared Core demand can lower actual output.

## Road route that delivered a real bot

Use **sending Cart → sending Road → paired receiving Road → receiving Cart** for each map crossing. Connect Carts directly at both Road endpoints. Continue from the receiving Cart into the next sending route for a multi-map relay. Use Joints to route around actual obstructions; inspect the Road direction after placement. Base Cart Roads carry 12 items/minute.

First isolate the source Cart and count two or more new completed bots without rewiring. Then connect export, isolate the destination Cart and verify its actual contents increase. A colored cable, moving bar or empty inventory pip is not delivery evidence. Preserve a normal save checkpoint before replacing a working distribution route.

## Other reusable recovery and research lessons

- N1.W2's Copper factory successfully exported **Copper Wire** through a direct Cart/Road/Cart pair into N1.W1. The receiving Cart then split to the old Wire branch and the Motor input. Imported Wire was visibly stored at the destination; Motor, slurry, Piston and Hydro Core machines resumed cycling. Repeated Hydro Core delivery was not separately counted.
- At the final halt, Home Research Center held Simple 5, Basic 5, Hydro 5 and **Automata 0**. Identify the missing Core before rebuilding another chain.
- Metal depletion is real; plan new deposits, ordinary Mining Drills or other normal recovery. Wood regenerates, so net Forest drawdown is not gross harvested Wood. Preserve totals and distinguish production waiting from construction/diagnosis in each new report.
- Suppress the intended settlement rather than an arbitrary nearby Goblin camp when pursuing Mythril. Inspect the actual AP/check and Tribute rate. Dwarves supply Mythril after reaching minimum size and maintaining successful checks; collect from the separate Tribute box, not the camp's AP input.

Update this guide with verified improvements after later runs. Keep failed experiments and observed limits distinguishable from working connections.
