# Offline engine run from Home to the first Final Core

The factory delivered **one Final Core to a Home Cart at 4:31:05 of simulated game time**. The offline run started from fresh Home, paid for Exploration and all **37 Map Node purchases**, built the factories and freight routes, cleared the Mythril and Iron Golems, and returned one piece from each of the four corners. The Dragon arrived last. The separate victory project costs five of each Core, including five Final Cores.

The harness ran the November 9 release rules at 100 ms steps in an unmodded 11×11 world with **example seed 10**. It used engine actions to place nodes, connect cables, choose recipes, pay for research, and open maps. The clock includes the normal construction timers, production, freight, and research. Harness actions are instantaneous, so the clock excludes time spent aiming cables, inspecting maps, or deciding what to build. No game tab, user save, grants, or resource rescue participated. Normal fresh worlds pick a random seed. [Engine results and factory geometry](../outputs/final-core-engine-run/verified.json) · [Published source](https://github.com/bookskaboo/bookskaboo.github.io/tree/aac2bae9f1249b99ea0d839edd014d3330ad2170/node/source)

A replay reached the same **4:31:05.4** collection tick and exported the paused engine state. Loading that checkpoint through the game’s save normalizer preserved the Final Core in the Home Cart. [Paused seed-10 checkpoint](../outputs/final-core-engine-run/seed-10-checkpoint.json)

## Map progression

Coordinates increase east and south. Every newly activated map touches an already accessible map. Exploration awards the first point for `(6,5)`. Visit `(7,5)` for the guaranteed Lake and `(5,4)` for the Goblin discovery in this seed. Visiting is what exposes the map survey and activates the encounter discoveries.

```text
 y\x   0  1  2  3  4  5  6  7  8  9 10
  0    α  ·  ·  ·  ·  ·  ·  ·  ·  ·  β
  1    Q  ·  ·  ·  ·  ·  ·  ·  ·  ·  │
  2    │  ·  ·  ·  ·  ·  ·  ·  ·  ·  │
  3    │  ·  I  ·  ·  ·  ·  ·  ·  ·  F
  4    │  ·  │  ·  ·  A  S  ·  ·  M  G
  5    ├──┼──s──Q──s──H──┼──h──┼──D──┤
  6    │  ·  ·  ·  ·  A  ·  ·  ·  │  │
  7    │  ·  ·  ·  ·  ·  ·  ·  ·  B  │
  8    │  ·  ·  ·  ·  ·  ·  ·  ·  ·  │
  9    │  ·  ·  ·  ·  ·  ·  ·  ·  ·  P
 10    δ  ·  ·  ·  ·  ·  ·  ·  ·  ·  γ
```

`H` Home and final assembly. `s` Simple. `A` Automata. `h` Hydro. `S` Shiny, Complex and secondary Hydro. `I` Iron Golem and Basic. `M` Mythril Golem. `D` Dwarven Tribute. `B` Medium Bots. `Q` Command Bots. `F` Command Bots and Foundry hydraulic parts. `G` Foundry gears. `P` Grove supplies. The lines show the freight spine and relays. Dots are outside the route.

| Map Node purchase | Activate in order | Price per required Core |
| --- | --- | --- |
| 1–3 | `(7,5)`, `(5,6)`, `(5,4)` | 5 Simple each |
| 4–9 | `(4,5)`, `(3,5)`, `(2,5)`, `(2,4)`, `(2,3)`, `(8,5)` | 5 Simple each |
| 10–19 | `(9,5)`, `(9,4)`, `(10,5)`, `(10,4)`, `(10,3)`, `(9,6)`, `(9,7)`, `(6,4)`, `(1,5)`, `(0,5)` | 5, 6, 6, 7, 7, 8, 8, 9, 9, 10 each of Simple and Basic |
| 20–29 | `(0,4)`, `(0,3)`, `(0,2)`, `(0,1)`, `(0,0)`, `(10,2)`, `(10,1)`, `(10,0)`, `(10,6)`, `(10,7)` | 5, 6, 7, 8, 9, 11, 12, 13, 14, 15 each through Automata |
| 30–37 | `(10,8)`, `(10,9)`, `(10,10)`, `(0,6)`, `(0,7)`, `(0,8)`, `(0,9)`, `(0,10)` | 5, 7, 8, 10, 12, 13, 15, 17 each through Hydro |

The two other tier-five Golems in this seed are Stone at `(8,7)` and Copper at `(4,9)`. Each can provide a permanent reserve for 180 AP if an actual run needs more stone or copper. The 37-purchase plan budgets the local deposits and uses the Mythril and Iron reserves, so those additional branches have no charge in the ledger.

## Factory placement and supply

### Home and the Research Center

Use the two starting Extractors for Forest and Copper. The following are schematic world-coordinate **centers** for the first placement. Add fuel and plate capacity around these rows once the first Simple Core cycles. The engine result records the coordinates and sockets used in the run.

```text
Forest (406,749) → Extractor (829,749) → Kiln (1260,730)
                                            ↓ Charcoal
Copper → Extractor (929,1177) → Smelter (1630,1100) → Gear (2030,1100)
                                        │                 ↓
                                        │       Simple (2430,1100) → Lab (2980,1100)
                                        ↓ Copper Plate                 ↑
Iron → Extractor (900,1780) → Smelter (1630,1730) → Wire (2030,1730) → Basic (2430,1730)
```

The first 5 Simple pay for the Assembler. Build one to unlock the Splitter before branching Copper Plate or Charcoal. Use separate fuel and smelting capacity for Basic while Simple keeps running. After Road research, use one material per Cart for fan-out. Keep the lab at Home and route each arriving Core through its own Cart to the lab’s input. The lab accepts five of each Core at once and spends one of every still-required type per five-second tick, so leave bulk supply in the Carts and relay chain. [Verified early wiring](playtest-build-guide.md)

### Research factories

Start each row at its resource sockets. Place Wood Extractors and Kilns next to the Forest, then dedicated ore Extractors and Smelters on the open side of each deposit. Put Refiners and intermediate Assemblers between the plate buffers and the recipe’s final bank. At Lake maps, put the Intake on the shore nearest open floor. Pumps carry Water and Coolant. Send Copper Slurry directly to its consumer or use a local Splitter for multiple consumers. Use direct cables between single producers and consumers, and reserve Carts for consolidation, fan-out and freight. Each district repeats the required earlier recipes locally.

| Site | Planned output and rate | Production nodes at design rate | Placement and export |
| --- | --- | ---: | --- |
| Home `(5,5)` | 100 Simple and 60 Basic | 12 + 10 | Expand the two rows. The recipe bill uses 920 of Home’s 1,000 Copper. |
| `(4,5)` and `(2,5)` | 165 and 157 Simple, 4/min each | 11 each | Make Copper Plate → Copper Gear → Simple. Use the same eastbound Simple lane after the flows merge. |
| `(2,3)` | 312 Basic, 4/min | 13 | Make Copper Plate and Iron Plate → Iron Wire → Basic. Use the ordinary Iron deposit for 225 Cores. Switch the Iron feed to the defeated Golem for the last 87, consuming 522 reserve Iron. Export finished Cores east on their own lane. |
| `(5,6)` and `(5,4)` | 200 and 82 Automata, 4/min each | 17 each | Brick from local Stone and Circuit A from local Copper Wire + Iron Plate. Ship south or north to Home as appropriate. Keep the north factory and Road clear of the Goblin Camp’s full footprint. |
| `(7,5)` | 105 Hydro | 32 | Place Hydro Piston, Circuit B and Hydro Core banks beside the Lake. The bill uses 1,578 Copper before buffer stock. Ship Hydro Cores west. |
| `(6,4)` | 15 Shiny, five Complex, then 42 Hydro | 35, 47, 25 plus two Intakes | Use two Intakes on opposite shores. Stage the short research batches and reuse the outbound lane after it drains. Keep a separate inbound Mythril lane. |

Hydro Piston takes Iron Gear, Motor and Coolant. Circuit B takes Brick, Copper Wire and Copper Slurry. Shiny adds Mythril Mesh and two Circuit A to its own Hydro Piston. Complex makes its own Circuit C, Controller and Servo Piston. Keep an independent supply of Plates, Gear, Wire, Motor, Coolant and Slurry in the bot districts. A Basic Core built for a Medium Bot and a Complex Core built for a Command Bot are local ingredients and are counted separately from research payments.

Meter the Shiny, Complex, Command Bot and Foundry Gear batches. Count the units accepted by each recipe input and disconnect that feed once its assigned batch bill has arrived. The receiving machine retains its paid inputs and can finish. This keeps late branches from parking scarce ore and fuel in machines that already have enough to complete their own assignment. Each threshold is an ordinary cable action in the offline harness. For metered Coolant use standard cable transfers through local Splitters so it arrives in single units.

### Dwarves and mineral Golems

1. **Medium Bots on `(9,7)`.** Build the local Robot Frame → Sealed Frame branch, Robot Gun → Cooled Gun branch, and Basic Core branch. Feed their Assembler II into a dedicated Cart and send north through `(9,6)` to `(9,5)`. Keep the transit cables outside the full Dwarven footprint on `(9,6)`. Build 76 Bots and stage 34 in two Carts before feeding the camp. Reverse the Cart-to-Cart cable after staging so both buffers feed the camp through its single AP input. It spends two Medium Bots per 60-second check. Two successful checks shrink a fresh camp from strength 25 to 10, or nine recover a fully grown camp. Drain the separate Tribute box at 12 Mythril/min. The first Tribute unlocks Mythril Refining.
2. **Dwarven Tribute to two destinations.** Route Mythril west for Shiny and Complex research via `(8,5)`, `(7,5)`, `(6,5)` and `(6,4)`. The recipes use 48 Mythril in total. Stage eastbound Tribute for the 15 Golem Command Bots via `(10,5)`, `(10,4)` and `(10,3)`. They use 204 Mythril. Connect the eastbound stockpile as soon as Tribute starts to prevent the 100-unit box from filling while research is in progress. The two routes can draw from a Mythril-only Cart, with the west route dispatch capped at 88 to leave enough supply for the east. A larger Dwarven settlement requires a different AP budget.
3. **Mythril Golem at `(9,4)`.** After Golem Survey and Command Robotics, send 15 Command Bots north from `(10,3)` through `(10,4)`, `(10,5)` and `(9,5)`. At 24 AP each, they meet the 360 AP requirement. Put two Extractors on the resulting reserve and merge into one Mythril Cart. Send ore west for the Iron Golem attack. After that factory finishes eight Bots, open the eastbound feed for Foundry gears. After 65 ore reach the gear factory and the Iron Golem is clear, close those feeds and extend the westbound route to the Dragon. The three plants use 108, 50, and 286 ore. The shared outbound Road moved 759 units including buffer stock, so its occupied shipping slots totaled 63 min 15 sec.
4. **Iron Golem at `(2,3)`.** Produce eight Command Bots on `(3,5)` and send them via `(2,5)` and `(2,4)`. They provide 192 AP against a 180 AP requirement. Attach three Extractors to the new Iron reserve for the late Basic Core run. The Basic factory already has local Copper and fuel. The Core export lane stays in place when the Iron feed changes. After all eight Bots have arrived, retire their Road on the `(3,5)`–`(2,5)` face and reuse that slot for Dragon Mythril. The other two slots are carrying Simple and Basic Cores.

Each Command district uses a 76-node production design at **0.5 bot/min** with base equipment. Work outward from its Lake. Put Hydro Piston and Servo Piston downstream of Coolant, keep the Pure Mythril and Mythril Mesh producers beside that bank, and send dry Circuit and Controller products into the two final rows. One row makes Mythril Frame → Servo Frame and Focused Gun → Pulse Cannon. The other makes the dedicated Complex Core. Their outputs meet at the Command Bot Assembler II. The calculator lists the quantities of each machine, including two Controllers and the local ore, fuel and plate capacity.

For continued operation, give forestry its own Wood, Iron Plate and Stone branch and return its Growth to the local Forest. A fully funded base Planter can return 60 Growth/min while using 6 Wood, 0.6 Iron Plates and 0.6 Stone per minute. The first-Core campaign fits the starting Forest stocks if output is metered. Copper, Stone and the other ordinary Iron deposits are finite. Where a district needs replenishment, keep a local Motor line and pay 20 Motors per Mining Drill for a new 1,000-unit Iron, Copper or Stone reserve after the optional research, or use the matching Golem. Each district’s capacity target still depends on its own Lake, fuel and remaining deposits.

### Roads and corner placement

For each crossing use **sending Cart → Road pair → receiving Cart**. Road pairs are directional, carry one solid material, and have no internal inventory. A base pair ships 12/min and a Cart holds 20. Map faces allow one pair before Road Channels 1, two after it, and three after Road Channels 2. Reserve the third pair across the Home east/west spine for Mythril. Keep Shiny and Complex on a separate lane from Hydro, then merge the secondary Hydro output into the Hydro route after Complex research. On the west spine, Simple and Basic each have a lane. Leave edge strips for the Roads and put the Carts just inside them. Route around Lakes, camps and Deep Holes with Joints. The engine run placed 148 Joints and recorded 12,462 successful item crossings, including every retired Road used earlier in the route. [Road build reference](playtest-build-guide.md#road-route-that-delivered-a-real-bot)

| Corner | Build and delivery plan | Production and freight time at design rate |
| --- | --- | --- |
| **α Dragon `(0,0)`** | Make **21 Command Bots** on Lake map `(0,1)` for 504 AP. Put the receiving Cart on the open, inward side of the corner and feed the AP port. Collect α from the center Tribute box. | **54 min 4 sec** from redirecting Mythril to the α award. The first Bot took 24 min after redirection. The Dragon awarded α at **4:29:30**. |
| **β Foundry `(10,0)`** | Make **50 Circuit B** and **25 Sealed Frames** in separate local branches at `(10,3)`. Share the Lake Intake. Make **100 Composite Mythril Gears** at `(10,4)`, using its own Copper, Forest and imported Golem Mythril. Send the three solids through `(10,2)` and `(10,1)` on separate lanes into their named sockets. | Circuit B and Sealed Frames were ready 10 min 22 sec and 12 min 40 sec after build. β awarded at **3:39:50** when the gear shipment completed. |
| **γ Grove `(10,10)`** | Put two Tree Planters in the open half beside the inward Growth socket. Make Wood, Iron Plates and Stone on `(10,9)` and send them on three Roads into dedicated Carts. Two funded Planters can produce 1,000 Growth in 8 min 20 sec. Pause them after γ. | **10 min 49 sec** from opening the corner to γ at **3:44:42**. The roads supplied 120 Wood, 51 Plates and 51 Stone, including stock held for the running Planters. |
| **δ Reclamation `(0,10)`** | The Dragon district’s Controllers make Fines on their shared product socket. Connect each socket to a Filter set to **Metallic Fines**, send its selected outlet to a Fines-only Cart, and send the remainder to the Controller product Cart. Dispatch **20 Fines** south through `(0,2)` to `(0,10)`, then send excess to a Waste Bin. Keep a separate lane from northbound Mythril between `(0,5)` and `(0,1)`. | **2 min 28 sec** from the last map activation to δ at **3:47:31**. All 20 Fines crossed nine Roads. |

For the Foundry, 100 Composite Mythril Gears use **50 raw Mythril, 400 Copper and 225 Wood**. Standard Mythril Gears would use **400 raw Mythril and 200 Wood**. The composite recipe trades abundant local Copper for 350 fewer units on the remote Mythril lane. Connect the physical Foundry port for Mythril Gear whichever recipe you choose.

### Assembly and return freight

Use inward approaches at all four challenges and place the piece Carts beside the center Tribute boxes. Bring α and δ to the west spine and β and γ to the east spine. Reassign one fully drained lane at a time wherever return routes overlap. To change materials, disconnect the old feed and exit after delivery, verify the relays have emptied, then attach the new one-material Carts and set direction. Hold the previous products in their separate local buffers. You can bring pieces home in batches of one, routing them as soon as the relevant inbound lanes are available.

In seed 10, **α + β → Yin** and **δ + γ → Yang**. Place the two ordinary Assemblers side by side in open Home space and a third to their east. Use four piece Carts as their inputs. Each half takes 10 seconds. Feed both into the Final Core Assembler for its 30-second cycle. Allow **40 seconds** for the parallel recipe cycles once all four pieces are at their input sockets, plus a few seconds for the local cables. The first produced piece unlocks these recipes. Stop after the Final Core Cart receives one.

## Measured schedule and resource ledger

| Milestone | Simulated clock |
| --- | ---: |
| Purchase 3 and Automata Core research | 0:17:28 |
| Purchase 9 and Area Expansion 1 | 0:39:03 |
| Purchase 19 and Medium Bot factory construction starts | 1:06:43 |
| First Dwarven Mythril Tribute | 1:42:46 |
| Command Robotics and Road Channels 2 complete | 2:03:25 |
| Purchase 29 | 2:19:46 |
| Mythril Golem defeated by 15 Command Bots | 2:57:23 |
| Iron Golem defeated by eight Command Bots and Basic feed switched | 3:30:01 |
| Purchase 37 and all maps open | 3:45:03 |
| β, γ and δ at Home | 3:48:22 |
| α at Home | 4:30:22 |
| **One Final Core in the collection Cart** | **4:31:05** |

The measured run ended about **16 minutes beyond the earlier 4:15 upper estimate**. The early Core lines finished their gates faster than forecast. The slower parts came from starting and supplying the Bot factories.

- **Dwarven supply startup.** The first Medium Bot took 12 min 31 sec. The factory needed almost 28 minutes to stage 34 at the camp. Suppression and freight brought the first Tribute to 36 min 3 sec after building started. Pre-staging prevented the camp from losing checks when the first batches arrived unevenly.
- **Command Bot startup.** The Mythril Golem campaign took **53 min 58 sec** from starting its factory through attack delivery, with 32 min 37 sec before the first Bot. The Iron campaign took **32 min 38 sec** through delivery. The final eight map purchases waited on the Basic line while the Iron attack was in production.
- **Shared Mythril freight.** The first reserve Road shipped **759 Mythril**. The three late destinations received 128 for the Iron attack, 65 for Foundry gears, and 306 for the Dragon. The recipe bill across those factories was 444. About 260 units were still in relay Carts at the finish. The Dragon had its lane released at 3:35:26, produced its first Bot at 3:59:27 and awarded α at 4:29:30.
- **Return freight and assembly.** Each one-piece return over ten Road pairs took 51.4 seconds. The last delivery left Yin and Final Core assembly on the critical path. The finished Core reached the Cart 43.8 seconds later.

The Research Center paid **422 Simple, 372 Basic, 282 Automata, 147 Hydro, 15 Shiny, and 5 Complex Cores**. Fully supplied research cycles account for 35 min 10 sec of the clock. The two Hydro lines made 105 and 42. The Basic factories made 84 additional Cores for local Bot ingredients and buffered stock.

| Gross extraction | Wood | Copper | Iron | Stone | Water | Mythril |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Original paper bill, including fuel | 18,030 | 19,294 | 14,732 | 800 | 5,132 | 696 |
| **Measured engine run** | **21,949** | **22,531** | **18,087** | **1,131** | **6,108** | **1,148** |

Gross extraction includes staged items and unfinished inventory. The run placed 1,291 nodes including paired Road endpoints, and added 1,796 cables including temporary and reconfigured connections. Those counts exclude the player’s time to place, aim, inspect and disconnect. The measured clock does not establish a human setup time.

## Reproduce the engine run

Run from the repository with Node 24.

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --layout
```

The run asserts the Map Node quotes, exact corner awards, key freight receipts, the Iron-source switch, and one Final Core in the collection Cart. `--layout` includes final node positions and surviving cables. The freight history includes retired lanes, and the harness recreates earlier wiring. The original calculator retains the paper bill and planned sizing for comparison. [Engine harness](../scripts/final-core-engine-run.mjs) · [Original calculator](../scripts/final-core-dry-run.mjs)
