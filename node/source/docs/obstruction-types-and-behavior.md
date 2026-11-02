# Obstruction types and behavior in the current and old games

Snapshot date: November 1, 2026.

The current game calls this obstruction Deep Hole. The old game calls it Big Hole. The internal identifiers remain unchanged for save compatibility.

The current game in `D:\node factory v2` and the old game in `D:\Node Game` share three core world obstruction types: **Deep Hole**, **Lake**, and **Monster Camp**. The current game also marks **Resource Golems** as world obstacles. Deep Holes can be filled and cleared, Lakes provide permanent water sources, and Monster Camps expand unless supplied with Attack Power. Camp suppression, collision geometry, and water handling differ between the two implementations.

Map tier below means Manhattan distance from Home at world coordinate `5,5`. Dimensions and radii are in world units. This is an inventory of implemented behavior; future endgame Monster Nodes are outside this inventory.

## Overview

| Type | Current game | Old game | Player response |
| --- | --- | --- | --- |
| Deep Hole | `big-hole`; generated terrain or a collapsed mineral deposit | `bigHole`; generated terrain, collapsed mineral deposit, or rapid field clicking | Deliver processed Stone, then manually clear the filled hole |
| Lake | `lake`; permanent obstruction, buffered Water output, and Lake Intake support | `lake`; permanent obstruction that attempts direct Water delivery | Route around it and connect its directional outputs |
| Monster settlement | `monster-camp`; three Goblin tiers and three Lizard tiers with periodic size changes and nearby-node disabling | `monsterCamp`, subtype `smallGoblinCamp`; periodic size changes and polygon-based encroachment | Maintain a recurring supply of suppression bots |
| Resource Golem | `resourceGolem`; one centered mineral boss in each of four clear tier 6 sectors | No corresponding type in the old obstruction catalog | Pay 10,000 AP once to create an infinite mineral reserve for Extractors |

All three are fixed world features rather than ordinary movable factory machines. Neither game provides a normal removal action for Lakes or Monster Camps. Suppression reduces a camp to a minimum size; it does not destroy it.

## Deep Holes

### Shared behavior

- Generated hole maps contain up to five holes. The target sum of circular hole areas rises linearly from **15% of field area at tier 1** to **50% at tier 9**.
- Generated hole sizes vary. Stone requirements depend on radius and tier: the minimum is **20 Stone**, the tier 1 maximum is **500**, and the maximum rises linearly to **20,000 at tier 9**. These are per-hole bounds, not a single cost for clearing the map.
- Each hole has one Stone input and no output. A direct Stone Deposit to Deep Hole connection is rejected; mine the Stone and deliver it through the production or logistics network.
- Filling a hole does not gradually shrink its footprint. When full, incoming fill connections are removed, but the obstruction remains until the player clears it.
- Depleting a non-forest mineral deposit creates a hole with radius `38 × sqrt(10)`, approximately **120.17**, and a fixed **250 Stone** requirement. The original deposit connections are removed. An empty Forest does not collapse into a hole.

### Current game

The hole stores the amount still required in `resourceRemaining`. Each simulation step consumes at most one Stone from its input buffer and reduces that remaining amount by one. At the normal 100 ms simulation step, that is a consumption ceiling of 10 Stone per second before delivery limits. Once the remaining amount reaches zero, the inspector exposes **CLEAR FIELD**, which removes the hole and its connections.

Mineral Regeneration research prevents the normal deposit-collapse path and lets mineral reserves regenerate instead. Existing holes still require filling.

### Old game

The hole stores `stoneFilled` and an optional explicit `stoneRequirement`. Otherwise, the requirement is calculated from radius and map tier. Successful Stone deliveries increment the filled count immediately. The filled hole has a dedicated manual removal action.

The old game also creates a small hole after **six clustered empty-field clicks within 2.5 seconds**, using a clustering radius of **24**. The hole has radius **38** and normally costs **20 Stone**. Creation is rejected near field boundaries, existing nodes, cables, holes, Lakes, or a camp's reserved maximum footprint. Creating it unlocks the **Oops.** achievement. This rapid-click creation behavior is absent from the current game's source.

Sources: [current generation and fill costs](../src/simulation/worldGeneration.ts), [current simulation and clearing](../src/simulation/engine.ts), [current connection rules](../src/simulation/connectionRules.ts), [current inspector](../src/ui/NodeInspector.tsx), and [old game logic](../../Node%20Game/app/page.tsx), especially `getBigHoleStoneRequirement`, `collapseDepletedResourceNodes`, `recordRapidFieldClick`, and `removeFilledBigHole`.

## Lakes

### Shared behavior

Lakes are permanent, non-depleting Water sources that also occupy building space and block unrelated cables. Each has four directional Water outlets: north, east, south, and west. The base production rate is **one Water per second across the Lake**, shared among connected routes; four outlets do not mean four Water per second.

New Lakes target **15% to just under 25% of field area**. The old game scales an irregular polygon to that area. The current game scales an ellipse to that area, while its renderer draws an organic outline. Their stored widths and heights therefore do not imply identical shoreline geometry.

### Current game

Base Water production accumulates in a shared **five-item output buffer**. Production stops when the buffer is full. Routing alternates among usable outputs and skips destinations that cannot accept Water.

The current game adds **Lake Intakes**. Each Intake needs a direct Lake connection and produces **4 Water per second**, increasing to **8** with Pressure Systems and **16** with High Pressure Intakes, with a **64 Water output buffer**. A Lake supports at most **two connected Intakes**. Intake production is handled separately from the Lake's base output; the direct connection does not consume the Lake's ordinary Water buffer. Lake to Extractor connections are rejected.

Encountering a Lake also participates in the current game's encounter-based water-tool unlocks.

### Old game

Every one-second production opportunity attempts delivery to a connected route, rotating the preferred route after success and trying alternatives when blocked. There is no Lake Water stockpile: production opportunities with no accepting route are not retained for later delivery. The old Lake runtime stores its production timer and next route index rather than an inventory buffer.

Sources: [current resource and routing simulation](../src/simulation/engine.ts), [current Lake Intake simulation](../src/simulation/progression.ts), [current generation](../src/simulation/worldGeneration.ts), [old directional ports](../../Node%20Game/game/domain/obstructions.ts), and [old Lake simulation](../../Node%20Game/app/page.tsx), especially `createLakeObstacle` and the loops over `next.lakes`.

## Monster Camps

### Shared behavior

The current game generates **Small Goblin Camps**, **Goblin Villages**, **Goblin Kingdoms**, **Lizard Camps**, **Lizard Villages**, and **Lizard Kingdoms**. The old game generates only Small Goblin Camps. Settlements normally check suppression every **60 seconds**. Meeting the Attack Power requirement reduces size by **10 percentage points**; failing it increases size by **10 percentage points**, within a **10% to 100%** range. Size percentage represents the area ratio used to scale the radius, rather than a linear radius percentage. Every fresh current-game settlement begins at **25%**.

### Current settlement tiers and Attack Power

New worlds have exactly **five of each subtype**, for **15 Goblin settlements and 15 Lizard settlements**, in distinct sectors. Selection is deterministic for the world seed. Existing saved sectors retain their layout; newly generated sectors use the new selection rules.

| Settlement | Map tier | World count at this tier | AP per 60 seconds | Matching research and example supply |
| --- | --- | --- | --- | --- |
| Small Goblin Camp | 1 | 1 | 3 | Suppression Bot; 3 Small Bots |
| Small Goblin Camp | 2 | 2 | 3 | Suppression Bot; 3 Small Bots |
| Small Goblin Camp | 3 | 2 | 3 | Suppression Bot; 3 Small Bots |
| Goblin Village | 4 | 2 | 9 | Sealed Robotics; 3 Medium Bots |
| Goblin Village | 5 | 2 | 16 | Heavy Robotics; 2 Heavy Bots |
| Goblin Village | 6 | 1 | 24 | Heavy Robotics; 3 Heavy Bots |
| Goblin Kingdom | 7 | 2 | 40 | Command Robotics; 2 Command Bots |
| Goblin Kingdom | 8 | 2 | 60 | Command Robotics; 3 Command Bots |
| Goblin Kingdom | 9 | 1 | 80 | Command Robotics; 4 Command Bots |

Requirements follow the existing robotics progression and remain fixed for the settlement. Completing research does not raise existing requirements. Any mixture of bots meeting the AP threshold works. Input capacity accommodates enough Small Bots to meet the full requirement, so stronger bots improve efficiency without imposing a hard technology gate. The inspector shows supplied and required AP, time to the next check, and suggested robotics research; hover help shows the recurring AP cost.

### Lizard settlement tiers and rewards

Lizard settlements occupy later map tiers and require more AP than Goblins at the same map tier. Their tribute produces larger batches and adds **Water** to the existing Iron, Copper, Stone, and Wood options. Mythril retains the Mythril Tools requirement. Lizard settlements and their Tribute nodes use green accents to distinguish them from Goblins.

| Settlement | Map tier | Count at this tier | AP per 60 seconds | Tribute every 5 seconds |
| --- | --- | --- | --- | --- |
| Lizard Camp | 4 | 2 | 24 | 20 |
| Lizard Camp | 5 | 3 | 40 | 20 |
| Lizard Village | 6 | 2 | 60 | 40 |
| Lizard Village | 7 | 3 | 80 | 40 |
| Lizard Kingdom | 8 | 2 | 120 | 60 |
| Lizard Kingdom | 9 | 3 | 160 | 60 |

Each group totals five settlements across its two map tiers. Lizard sectors are selected after reserving the Goblin and Golem sectors, so each map contains at most one settlement and the four clear Golem sectors remain free of other obstructions. Tier 10 stays empty. Camp costs align with stronger Medium and Heavy Bot supplies; Village and Kingdom costs favor Heavy and Command Bots.

Lizards use the same suppression, expansion, and tribute lifecycle as Goblins. A successful check activates or preserves direct-output tribute; failing a check removes the Tribute node, its entire stockpile, and its connections. Stockpiles hold **100 materials**, including Wood or Water, and pause production when full. Saved subtype, selected material, suppression countdown, and stored tribute persist through version 1 saves.

Sources: [Lizard settlement settings](../src/content/lizardSettlements.ts), [shared settlement settings](../src/content/goblinSettlements.ts), [exclusive world placement](../src/simulation/worldGeneration.ts), and [shared tribute simulation](../src/simulation/goblinTribute.ts).

### Tribute from continued suppression

A successful AP check activates a separate **Tribute** node near the settlement. It produces the selected material directly; connect it to factory machines or storage without an Extractor. The reward continues between successful checks, even when the settlement has reached its minimum size.

| Settlement | Output every 5 seconds | Maximum stored tribute |
| --- | --- | --- |
| Small Goblin Camp | 5 materials | 100 |
| Goblin Village | 15 materials | 100 |
| Goblin Kingdom | 30 materials | 100 |

Choose **Iron, Copper, Stone, or Wood** in either the settlement or Tribute inspector. **Mythril** becomes available with Mythril Tools. The material selection remains on the settlement if tribute disappears, so restoring suppression restores that choice. Drain the output buffer and wait for pending deliveries before changing material; changing the selection resets the production cycle.

Lizard tribute additionally offers **Water**, with the larger output batches listed above and the same stockpile limit.

Unused tribute accumulates to **exactly 100 materials**. A partially fitting final batch fills the remaining space. Production then pauses until materials are withdrawn. Continuing suppression preserves both the node and its existing stockpile, providing a renewable supply in exchange for recurring bot production.

A failed AP check removes the Tribute node, **all its accumulated materials**, its cables, and pending deliveries. Previously delivered materials remain in the factory. Restoring suppression creates a fresh, empty Tribute node; the player must reconnect it. An orphaned Tribute node also disappears if its parent settlement is absent.

Tribute placement avoids buildings and reserves the settlements' maximum footprints. If no position is available nearby, clear space; placement retries at the next successful AP check. Suppression state, output choice, stockpile, cycle progress, and the AP countdown persist through saves. Legacy camps gain this behavior after their next successful check.

Sources: [tribute simulation and placement](../src/simulation/goblinTribute.ts), [settlement output settings](../src/content/goblinSettlements.ts), [lifecycle and configuration](../src/simulation/engine.ts), and [tribute inspector controls](../src/ui/NodeInspector.tsx).

Attack supply is consumed or reset at each check, including excess supply. Successful suppression must therefore be sustained over time. Neither implementation permanently clears the camp through these checks.

### Behavior comparison

| Rule | Current game | Old game |
| --- | --- | --- |
| Attack requirement | **3 to 80 AP per check**, according to settlement and map tier above | Fresh Small Goblin Camps require **1 AP per check** |
| Bot values | Small **1**, Medium **3**, Heavy **8**, Command **20** AP | Small Suppression Bot **1 AP** |
| Supply storage | Bot items in the camp input; all recognized bot types are consumed at a check | Delivered attack items add to `storedAttackPower`; the accumulated value resets at a check |
| Size and geometry | Generated `obstructionMaxRadius = 600`; size radius is `600 × sqrt(campStrength / 100)` | `maxRadius = 600`; size radius is `600 × sqrt(sizeRatio)`, with a stored irregular polygon |
| Affected factory nodes | At checks, tests each non-resource node's center against `65 + campStrength × 3.2` | Tests purchasable node rectangles against the current camp polygon |
| Operational effect | Writes `disabled` on affected nodes; disabled nodes skip simulation and routing | Encroached nodes and their connected routes are excluded from active simulation |
| Resource protection | Resource behavior nodes, including Lakes, are skipped by the disabling pass | Growth is prevented when it would overlap reserved natural resource nodes; an existing overlap can also reduce camp size |

### Current implementation details that affect play

The current camp's disabling radius is separate from its visible and placement radius. For example, at **25% size**, a generated camp's size radius is **300**, while the disabling radius after a check at that strength would be **145**. The drawn boundary should not be treated as an exact indicator of operational reach.

The disabling pass runs after a camp's size update, so disabling and recovery are refreshed at checks rather than continuously. It assigns `disabled` for every non-resource candidate, including other obstructions and other camps. With multiple camps in an imported or modified map, each pass can overwrite the previous camp's result instead of combining their influence.

All current subtypes retain the same 600-unit maximum radius and suppression behavior. Their names, map distribution, and AP requirements distinguish their difficulty. They keep the serialized `monster-camp` kind, with an optional `goblinSettlement` subtype, preserving existing saves and Attack Power connections.

The runtime check uses a fixed **60,000 ms** interval, even though nodes have a `cycleMs` field. The old runtime uses each camp's stored `expansionCheckIntervalMs`; its tutorial demonstration uses a separate **2-second** interval.

Sources: [current settlement definitions](../src/content/goblinSettlements.ts), [current camp simulation](../src/simulation/engine.ts), [current bot values](../src/content/progression.ts), [current geometry](../src/renderer/nodeLayout.ts), [current generation](../src/simulation/worldGeneration.ts), [old camp simulation](../../Node%20Game/app/page.tsx), especially `createSmallGoblinCamp`, `advanceMonsterCampCycles`, and `getMonsterCampEncroachedNodeIds`, [old camp geometry](../../Node%20Game/game/geometry/connections.ts), and [old Attack Power values](../../Node%20Game/game/domain/resources.ts).

## Map distribution

| Location | Current game | Old game |
| --- | --- | --- |
| Home | Starts without the three core obstructions | Remote obstruction generation excludes Home |
| Tier 1 | Hole maps; exactly one Small Goblin Camp outside the reserved encounter sector | Hole maps; one randomly chosen Small Goblin Camp sector |
| Tier 2 | Selects 5 to 7 Lake sectors out of 8 before the guaranteed Lake exception; other sectors receive holes; exactly two Small Goblin Camps | Selects 5 to 7 Lake sectors out of 8; other sectors receive holes; up to two camps, subject to placement and area checks |
| Tier 3 | Hole maps; two Small Goblin Camps | Hole maps |
| Tiers 4 to 6 | Hole maps, five Goblin Villages, five Lizard Camps and two Lizard Villages, except four clear tier 6 Golem sectors | Hole maps |
| Tiers 7 to 9 | Hole maps, five Goblin Kingdoms, three Lizard Villages and five Lizard Kingdoms | Hole maps |
| Tier 10 | No normal generated holes, Lakes, camps, or resource deposits | Empty tier 10 maps without normal obstruction or resource generation |

The current game reserves **6,5** for the Abandoned Fabricator encounter and **7,5** for guaranteed Lake access. Both are excluded before settlement selection, preserving exact settlement counts. The forced tier 2 Lake can raise the final Lake total above the initial selection of 5 to 7.

The old tier 2 generator checks that existing obstruction area plus maximum camp area fits within **50% of the field**, then searches for a nonoverlapping placement. A selected camp can therefore be omitted when those checks fail.

Sources: [current world generation](../src/simulation/worldGeneration.ts), [current generation tests](../src/simulation/engine.test.ts), and [old world generation](../../Node%20Game/app/page.tsx), especially `MAP_NODE_FAVORED_OBSTRUCTION_BY_TIER`, `makeRemoteMapFactoryState`, and `generateMapFactoriesAtGameStart`.

## Placement and cable blocking

Both games reject construction or movement into obstruction footprints and reject new unrelated cable paths that cross them. Connections to the obstruction's own ports exclude that endpoint obstruction from the cable blocking check, allowing Stone delivery, Water extraction, and bot supply.

The current game approximates obstruction collisions with ellipses and uses **12 units** of ordinary placement clearance. Hole to hole overlap has a special radius rule using **0.85 times the sum of radii**, plus clearance. Cable blocking samples a cubic curve at **33 points** against expanded ellipses with **12 units** of padding.

The old game uses circles for hole collision and stored polygons for Lake and camp collision. Its hole clearance constant is **10**, while ordinary node clearance is **12**. Hole cable checking adapts its sample count to estimated curve length, with a minimum of 16 segments. Camp cable checks at connection creation use zero extra clearance. These differences can make an apparently similar shoreline or camp boundary accept a route in one game and reject it in the other.

Sources: [current collisions](../src/simulation/collisions.ts), [current cable rules](../src/simulation/connectionRules.ts), [old geometry](../../Node%20Game/game/geometry/connections.ts), [old clearance and ports](../../Node%20Game/game/domain/obstructions.ts), and [old connection creation](../../Node%20Game/app/page.tsx).

## Related world features in the current game

The current game also includes **Abandoned Fabricators**, **Derelict Sorting Stations**, and **Resource Golems**. Fabricators and Sorting Stations occupy node space but are not marked `worldObstacle`. Resource Golems are marked `worldObstacle` and use the camp appearance, so the current obstruction collision and cable checks include them.

Fabricators and Sorting Stations provide encounter unlocks.

### Mineral Golems

New worlds contain exactly **four Resource Golems**, one each for **Iron, Copper, Stone, and Mythril**. Each occupies a different **tier 6** map sector. Their sectors exclude **Deep Holes, Lakes, and Goblin settlements**, while retaining normal mineral and Forest nodes. The Golem starts at the center of its play area; generation accounts for Area Expansion research already completed when creating the sector. Selection is deterministic for the world seed.

After **Resource Golem Survey**, bot deliveries permanently reduce the Golem's **10,000 AP** remaining health. This is a one-time combat cost rather than a recurring suppression check. It is equivalent to 500 Command Bots or 1,250 Heavy Bots; mixed bot deliveries also work. Partial damage persists through saves and never regenerates.

At zero health, the same node becomes **Infinite Iron**, **Infinite Copper**, **Infinite Stone**, or **Infinite Mythril** at the same position. Its bot input and incoming attack cables are removed. The new reserve has **four multi-connection star outputs**, centered on its north, east, south, and west faces. Connect Extractors to any face. All four sockets expose only that Golem's mineral, and mining never reduces a finite resource counter or creates a depletion hole. There is no recurring bot cost after victory.

Existing saves retain their explored layouts and partial Golem damage. Existing defeated Golems become infinite reserves using their saved primary mineral; saved items and node IDs remain intact. The new four-sector distribution applies to newly generated worlds and sectors.

Sources: [Golem costs and conversion](../src/content/resourceGolems.ts), [current capability catalog](../src/content/nodeCapabilities.ts), [additional capability definitions](../src/content/progression.ts), [encounters and Golem simulation](../src/simulation/progression.ts), [infinite extraction](../src/simulation/engine.ts), [directional socket geometry](../src/renderer/nodeLayout.ts), and [world placement](../src/simulation/worldGeneration.ts).

## Importing obstructions from old saves

The current importer carries over hole radius and filled Stone, Lake dimensions and production time, and camp position, size, timer progress, and accumulated Attack Power. It does not retain the old Lake or camp polygon shape arrays. For an old hole without an explicit `stoneRequirement`, it defaults to **250 Stone** before subtracting the filled amount, rather than recalculating the old radius-based requirement.

The camp import does not copy `requiredAttackPower` into `attackRequirement`. Such camps use the current fallback requirement, `ceil(campStrength / 10)` with a minimum of one. For example, an imported camp at 25% size needs **3 AP**, even if the old camp required 1 AP. Its imported interval is stored in `cycleMs`, but the current simulation still checks at the fixed 60 seconds described above.

Source: [old-save obstruction conversion](../src/persistence/saves.ts).
