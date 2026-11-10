# Obstruction types and behavior in the current and old games

Snapshot date: November 2, 2026. Current-game changes described here are local until publication is confirmed.

The current game calls this obstruction Deep Hole. The old game calls it Big Hole. The internal identifiers remain unchanged for save compatibility.

The current game in `D:\node factory v2` and the old game in `D:\Node Game` share three core world obstruction types: **Deep Hole**, **Lake**, and **Monster Camp**. The current game also marks **Resource Golems** as world obstacles. Deep Holes can be filled and cleared, Lakes provide permanent water sources, and Monster Camps expand unless supplied with Attack Power. Camp suppression, collision geometry, and water handling differ between the two implementations.

Map tier below means Manhattan distance from Home at world coordinate `5,5`. Dimensions and radii are in world units. This is an inventory of implemented behavior; future endgame Monster Nodes are outside this inventory.

## Overview

| Type | Current game | Old game | Player response |
| --- | --- | --- | --- |
| Deep Hole | `big-hole`; generated terrain or a collapsed mineral deposit | `bigHole`; generated terrain, collapsed mineral deposit, or rapid field clicking | Deliver processed Stone to fill the hole |
| Lake | `lake`; permanent obstruction, buffered Water output, and Lake Intake support | `lake`; permanent obstruction that attempts direct Water delivery | Route around it and connect its directional outputs |
| Monster settlement | `monster-camp`; three Goblin tiers and three Dwarven tiers with periodic size changes and nearby-node disabling | `monsterCamp`, subtype `smallGoblinCamp`; periodic size changes and polygon-based encroachment | Maintain a recurring supply of suppression bots |
| Resource Golem | `resourceGolem`, one centered mineral boss in each of four clear tier 5 sectors in new worlds | No corresponding type in the old obstruction catalog | Pay 180 AP for Iron, Copper or Stone, or 360 AP for Mythril, to create an infinite mineral reserve |

All three are fixed world features rather than ordinary movable factory machines. Neither game provides a normal removal action for Lakes or Monster Camps. Suppression reduces a camp to a minimum size; it does not destroy it.

## Deep Holes

**Clear outposts (November 8, 2026, NODE-0347).** The first sector east of Home (E1) always generates clear. In later map tiers, the seed selects about one quarter of ordinary sectors as clear outposts, rounding to the nearest whole sector per tier. Ordinary sectors in this selection have no Lake, settlement, or Golem. The standard grid has 20 clear outposts including E1, each with Iron, Copper, Stone, and Wood.

### Shared behavior

- Generated hole maps contain up to five holes. Since NODE-0348, the current game's target sum of circular hole areas rises linearly from **15% of field area at tier 1** to **35% at tier 9**. The drawn outlines cover less than the target circles. The old game's target reaches 50% at tier 9.
- Generated hole sizes vary. In the current game, the base fill requirement uses each hole's radius relative to the field size. The minimum is **20 Stone**, and the per-hole maximum rises linearly from **500 at tier 1** to **4,000 at tier 9** (NODE-0349). A hole with the same relative size has the same price across Area Expansion levels. Saved holes keep their recorded base requirements and fill progress. The old game's tier-9 maximum is 20,000 Stone.
- Each hole has one Stone input and no output. A direct Stone Deposit to Deep Hole connection is rejected; mine the Stone and deliver it through the production or logistics network.
- The hole keeps its full footprint until its Stone bill is paid.
- Depleting a non-forest mineral deposit creates a hole with radius `38 × sqrt(10)`, approximately **120.17**, and a fixed **250 Stone** requirement. The original deposit connections are removed. An empty Forest does not collapse into a hole.

### Current game

The hole stores the amount still required in `resourceRemaining`. Each simulation step consumes at most one Stone from its input buffer and reduces that remaining amount by one. At the normal 100 ms simulation step, that is a consumption ceiling of 10 Stone per second before delivery limits. When the bill reaches zero, the hole and its connections disappear automatically. This also applies when Efficient Landfill reduces the bill below the amount already paid and when a save loads with an already-filled hole. Stone still in transit returns to its sender, and unused Stone in the hole's buffer goes into a salvage Cart.

Mineral Regeneration research prevents the normal deposit-collapse path and lets mineral reserves regenerate instead. Existing holes still require filling.

### Old game

The hole stores `stoneFilled` and an optional explicit `stoneRequirement`. Otherwise, the requirement is calculated from radius and map tier. Successful Stone deliveries increment the filled count immediately. The filled hole has a dedicated manual removal action.

The old game also creates a small hole after **six clustered empty-field clicks within 2.5 seconds**, using a clustering radius of **24**. The hole has radius **38** and normally costs **20 Stone**. Creation is rejected near field boundaries, existing nodes, cables, holes, Lakes, or a camp's reserved maximum footprint. Creating it unlocks the **Oops.** achievement. This rapid-click creation behavior is absent from the current game's source.

Sources: [current generation and fill costs](../src/simulation/worldGeneration.ts), [current simulation and clearing](../src/simulation/engine.ts), [current connection rules](../src/simulation/connectionRules.ts), [current inspector](../src/ui/NodeInspector.tsx), and [old game logic](../../Node%20Game/app/page.tsx), especially `getBigHoleStoneRequirement`, `collapseDepletedResourceNodes`, `recordRapidFieldClick`, and `removeFilledBigHole`.

## Lakes

### Shared behavior

Lakes are permanent, non-depleting Water sources that also occupy building space and block unrelated cables. Each has four directional Water outlets: north, east, south, and west. The base production rate is **one Water per second across the Lake**, shared among connected routes; four outlets do not mean four Water per second.

New Lakes target **15% to just under 25% of field area**. The old game scales an irregular polygon to that area. The current game chooses dimensions from an ellipse-area budget, then uses its drawn organic polygon for every boundary effect. Their stored widths and heights therefore do not imply identical shoreline geometry.

### Current game

Base Water production accumulates in a shared **five-item output buffer**. Production stops when the buffer is full. Routing alternates among usable outputs and skips destinations that cannot accept Water.

The current game adds **Lake Intakes**. Each Intake needs a direct Lake connection and produces **4 Water per second**, increasing to **8** with Pressure Systems and **16** with High Pressure Intakes, with a **64 Water output buffer**. A Lake supports at most **two connected Intakes**. Intake production is handled separately from the Lake's base output; the direct connection does not consume the Lake's ordinary Water buffer. Lake to Extractor connections are rejected.

Encountering a Lake also participates in the current game's encounter-based water-tool unlocks.

### Old game

Every one-second production opportunity attempts delivery to a connected route, rotating the preferred route after success and trying alternatives when blocked. There is no Lake Water stockpile: production opportunities with no accepting route are not retained for later delivery. The old Lake runtime stores its production timer and next route index rather than an inventory buffer.

Sources: [current resource and routing simulation](../src/simulation/engine.ts), [current Lake Intake simulation](../src/simulation/progression.ts), [current generation](../src/simulation/worldGeneration.ts), [old directional ports](../../Node%20Game/game/domain/obstructions.ts), and [old Lake simulation](../../Node%20Game/app/page.tsx), especially `createLakeObstacle` and the loops over `next.lakes`.

## Monster Camps

### Shared behavior

The current game generates **Small Goblin Camps**, **Goblin Villages**, **Goblin Kingdoms**, **Dwarven Camps**, **Dwarven Villages**, and **Dwarven Kingdoms**. The old game generates only Small Goblin Camps. Settlements normally check suppression every **60 seconds**. Meeting the Attack Power requirement reduces size by **10 percentage points**; failing it increases size by **10 percentage points**, within a **10% to 100%** range. Size percentage represents the area ratio used to scale the radius, rather than a linear radius percentage. Every fresh current-game settlement begins at **25%**.

### Current settlement tiers and Attack Power

New worlds have exactly **five of each subtype**, for **15 Goblin settlements and 15 Dwarven settlements**, in distinct sectors. Selection is deterministic for the world seed. Existing saved sectors retain their layout; newly generated sectors use the new selection rules.

| Settlement | Map tier | World count at this tier | AP per 60 seconds | Matching research and example supply |
| --- | --- | --- | --- | --- |
| Small Goblin Camp | 1 | 1 | 3 | Suppression Bot; 3 Small Bots |
| Small Goblin Camp | 2 | 2 | 3 | Suppression Bot; 3 Small Bots |
| Small Goblin Camp | 3 | 2 | 3 | Suppression Bot; 3 Small Bots |
| Goblin Village | 4 | 2 | 9 | Sealed Robotics; 3 Medium Bots |
| Goblin Village | 5 | 2 | 9 | Sealed Robotics; 3 Medium Bots |
| Goblin Village | 6 | 1 | 9 | Sealed Robotics; 3 Medium Bots |
| Goblin Kingdom | 7 | 2 | 16 | Heavy Robotics; 2 Heavy Bots |
| Goblin Kingdom | 8 | 2 | 16 | Heavy Robotics; 2 Heavy Bots |
| Goblin Kingdom | 9 | 1 | 16 | Heavy Robotics; 2 Heavy Bots |

Each settlement has a fixed AP requirement. Small, Medium, Heavy and Command Bots contribute 1, 3, 8 and 24 AP respectively. Any mix meeting the threshold works. To combine separate bot lines, feed a shared Cart and connect that Cart to the camp's single AP input. The input holds enough Small Bots to meet the full requirement. The camp connector shows the required AP per 60-second check, and the inspector shows supplied AP and the last result. A successful Goblin check keeps unused whole bots. A failed Goblin check consumes the insufficient supply.

**Tier 1 balance review (November 8, 2026, NODE-0339).** Keep the Small Goblin Camp at 3 AP per check. Three Small Bots per minute use half a fully supplied base assembler and cost 36 each of Iron ore, Copper ore and Wood.

**Tier 2 balance review (November 8, 2026, NODE-0340).** Lake and Golem sectors exclude camps in new generation. The two tier-2 camps keep the same Small Bot supply target as tier 1.

**Settlement balance by size (November 8, 2026, NODE-0341).** Within each faction, a settlement of a given size should have the same AP requirement and Tribute rate across map tiers. AP and Tribute should both increase from Camp to Village to Kingdom.

**Goblin Village and Tribute update (November 8, 2026, NODE-0342).** Every Goblin Village takes 9 AP per check, or three Medium Bots per minute. All Goblin Tribute batches increase by 20%, including the earlier Small Camp reward. Saved Villages adopt the new AP threshold on load.

**Goblin Kingdom upkeep (November 8, 2026, NODE-0343).** Every Goblin Kingdom takes 16 AP per check, or two Heavy Bots per minute, for up to 432 Tribute per minute. Saved Kingdoms adopt the new AP threshold on load.

### Dwarven settlement tiers and rewards

Dwarven settlements occupy later map tiers and produce **Mythril**. The first Mythril Tribute unlocks Mythril Refining. Dwarven settlements and their Tribute nodes use green accents.

| Settlement | Map tier | Count at this tier | AP per 60 seconds | Mythril every 5 seconds | Tribute capacity |
| --- | --- | --- | --- | --- | --- |
| Dwarven Camp | 4 | 2 | 6 | 1 | 100 |
| Dwarven Camp | 5 | 3 | 6 | 1 | 100 |
| Dwarven Village | 6 | 2 | 16 | 5 | 120 |
| Dwarven Village | 7 | 3 | 16 | 5 | 120 |
| Dwarven Kingdom | 8 | 2 | 32 | 12 | 288 |
| Dwarven Kingdom | 9 | 3 | 32 | 12 | 288 |

Each group totals five settlements across its two map tiers. Dwarven sectors are selected after reserving the Goblin and Golem sectors, so each map contains at most one settlement and the four clear Golem sectors remain free of other obstructions. Tier 10 stays empty.

**Dwarven Camp balance (November 8, 2026, NODE-0344).** Two Medium Bots pay each 6 AP check. Any fully suppressed Dwarven Camp supplies one Mythril every five seconds, up to 12 per minute. Saved Camps adopt the same rates while retaining previously earned Tribute.

**Dwarven Village balance (November 8, 2026, NODE-0345).** Two Heavy Bots pay each 16 AP check. Any fully suppressed Dwarven Village supplies five Mythril every five seconds, up to 60 per minute. Saved Villages adopt the same rates and 120-unit capacity. Any existing stock above capacity can still be withdrawn. Production resumes when the box has room.

**Dwarven Kingdom balance (November 8, 2026, NODE-0346).** Four Heavy Bots pay each 32 AP check. Any fully suppressed Dwarven Kingdom supplies 12 Mythril every five seconds, up to 144 per minute. Four standard Heavy Bots consume 20 raw Mythril to make, leaving up to 124 per minute for other production. Saved Kingdoms adopt the same rates and 288-unit capacity while retaining existing Tribute.

Dwarven checks spend saved AP credit first. A successful check keeps unused bots and carries over any excess AP from the bots it spends. A failed check retains bots, credit, stored Mythril and Tribute wiring. Enough new AP triggers an immediate retry and starts a fresh 60-second countdown. New Mythril resumes when the settlement is suppressed at 10% size and its Tribute box has room.

Sources: [Dwarven settlement settings](../src/content/lizardSettlements.ts), [shared settlement settings](../src/content/goblinSettlements.ts), [exclusive world placement](../src/simulation/worldGeneration.ts), and [shared tribute simulation](../src/simulation/goblinTribute.ts).

### Tribute from continued suppression

A successful AP check creates a separate **Tribute** node after the settlement reaches its **10% minimum size**. Two successful checks take a fresh camp from 25% to 15% to 10%. Connect Tribute directly to machines or storage. A missed check removes Goblin Tribute and pauses new Dwarven Mythril.

| Settlement | Output every 5 seconds | Maximum stored tribute |
| --- | --- | --- |
| Small Goblin Camp | 6 materials | 100 |
| Goblin Village | 18 materials | 100 |
| Goblin Kingdom | 36 materials | 100 |

Click a Goblin Tribute node to open its **right-side resource chooser**. Choose **Iron, Copper, Stone, or Wood**. Changing material removes stock of the old material and resets the production cycle. Already dispatched deliveries remain committed. The selection stays on the settlement if Tribute disappears. Dwarven Tribute supplies Mythril.

Unused Tribute accumulates up to the box's capacity. A partial batch can fill the remaining space. Production then pauses until materials are withdrawn. Settlements continue to check upkeep while the Tribute box is full.

A failed AP check removes the Tribute node, **all its accumulated materials**, its cables, and pending deliveries. Previously delivered materials remain in the factory. Restoring suppression creates a fresh, empty Tribute node; the player must reconnect it. An orphaned Tribute node also disappears if its parent settlement is absent.

Tribute placement avoids buildings and reserves the settlements' maximum footprints. If no position is available nearby, clear space; placement retries at the next successful AP check. Suppression state, output choice, stockpile, cycle progress, and the AP countdown persist through saves. Legacy camps gain this behavior after their next successful check.

Sources: [tribute simulation and placement](../src/simulation/goblinTribute.ts), [settlement output settings](../src/content/goblinSettlements.ts), [lifecycle and configuration](../src/simulation/engine.ts), and [tribute inspector controls](../src/ui/NodeInspector.tsx).

The current game consumes the least total bot AP that meets a successful check, preferring fewer bots when payments have equal AP. Surplus bots remain for later checks. A failed check consumes the insufficient supplied bots. The old game resets its accumulated AP at each check. Neither permanently clears a camp through these checks.

### Behavior comparison

| Rule | Current game | Old game |
| --- | --- | --- |
| Attack requirement | **3 to 80 AP per check**, according to settlement and map tier above | Fresh Small Goblin Camps require **1 AP per check** |
| Bot values | Small **1**, Medium **3**, Heavy **8**, Complex **20** AP | Small Bot **1 AP** |
| Supply storage | Bot items in the camp input; only the sufficient payment is consumed on success; surplus remains | Delivered attack items add to `storedAttackPower`; the accumulated value resets at a check |
| Size and geometry | Generated `obstructionMaxRadius = 600`; size radius is `600 × sqrt(campStrength / 100)` | `maxRadius = 600`; size radius is `600 × sqrt(sizeRatio)`, with a stored irregular polygon |
| Affected factory nodes | Tests whole machine bodies against the current visible camp polygons | Tests purchasable node rectangles against the current camp polygon |
| Operational effect | Writes `disabled` on affected nodes; disabled nodes skip simulation and routing | Encroached nodes and their connected routes are excluded from active simulation |
| Resource protection | Resource behavior nodes, including Lakes, are skipped by the disabling pass | Growth is prevented when it would overlap reserved natural resource nodes; an existing overlap can also reduce camp size |

### Current implementation details that affect play

The current game uses a shared polygon for the camp's visible border, placement, cable obstruction, and machine encroachment. A machine is disabled when its body touches the visible camp area, even if its center is outside. There is no separate disabling circle. Ordinary placement retains an explicit 12-unit gap; runtime encroachment and cables use the border itself.

Encroachment updates every simulation step and immediately after size checks. Multiple camps combine their influence; shrinking a camp restores a machine only when no camp still overlaps it. Resource nodes and other world obstructions are protected. Growing across an existing cable stops its transfers and refunds reserved stock; the cable remains and can resume when clear.

Generation validates each camp at 100% size against field edges and other obstructions before restoring its initial 25%. Natural resources reserve the entire maximum-growth circle, including their own full body and placement clearance. These rules apply to newly generated sectors; existing saved layouts are preserved.

All current subtypes retain the same 600-unit maximum radius and suppression behavior. Their names, map distribution, and AP requirements distinguish their difficulty. They keep the serialized `monster-camp` kind, with an optional `goblinSettlement` subtype, preserving existing saves and Attack Power connections.

The runtime check uses a fixed **60,000 ms** interval, even though nodes have a `cycleMs` field. The old runtime uses each camp's stored `expansionCheckIntervalMs`; its tutorial demonstration uses a separate **2-second** interval.

Sources: [current settlement definitions](../src/content/goblinSettlements.ts), [current camp simulation](../src/simulation/engine.ts), [current bot values](../src/content/progression.ts), [current geometry](../src/renderer/nodeLayout.ts), [current generation](../src/simulation/worldGeneration.ts), [old camp simulation](../../Node%20Game/app/page.tsx), especially `createSmallGoblinCamp`, `advanceMonsterCampCycles`, and `getMonsterCampEncroachedNodeIds`, [old camp geometry](../../Node%20Game/game/geometry/connections.ts), and [old Attack Power values](../../Node%20Game/game/domain/resources.ts).

## Map distribution

| Location | Current game | Old game |
| --- | --- | --- |
| Home | Starts without the three core obstructions | Remote obstruction generation excludes Home |
| Tier 1 | Clear E1 and three hole maps, including one Small Goblin Camp sector | Hole maps; one randomly chosen Small Goblin Camp sector |
| Tier 2 | Five or six Lake sectors out of eight, including the guaranteed Lake. Two Small Goblin Camps occupy separate sectors with holes. | Selects 5 to 7 Lake sectors out of 8; other sectors receive holes; up to two camps, subject to placement and area checks |
| Tier 3 | One Lake, three clear outposts and eight hole maps, including two Small Goblin Camp sectors | Hole maps |
| Tiers 4 to 6 | One Lake per tier, ten clear outposts, four tier-5 Golem sectors, and 39 hole maps, including five Goblin Villages, five Dwarven Camps, and two Dwarven Villages | Hole maps |
| Tiers 7 to 9 | One Lake per tier, six clear outposts and 27 hole maps, including five Goblin Kingdoms, three Dwarven Villages, and five Dwarven Kingdoms | Hole maps |
| Tier 10 | No normal generated holes, Lakes, camps, or resource deposits | Empty tier 10 maps without normal obstruction or resource generation |

The current generator reserves **6,5** (E1) as a clear outpost and **7,5** (E2) for guaranteed Lake access. New camps occupy sectors without Lakes or Resource Golems. Reserving two tier-2 sectors for camps caps the Lake count at six, including E2. Each Lake in tiers 3 through 9 is seed-selected from ordinary sectors after reserving camps, Golems and clear outposts. Existing sectors retain their saved terrain.

New worlds balance encounters across the four quadrants around Home. The north, east, south and west axes count toward the northwest, northeast, southeast and southwest quadrants, respectively. Camp and Lake placement favors quadrants with fewer of that encounter, and each quadrant receives one Golem away from the axes. Older saves with sectors already generated outside Home keep their previous encounter layout.

The old tier 2 generator checks that existing obstruction area plus maximum camp area fits within **50% of the field**, then searches for a nonoverlapping placement. A selected camp can therefore be omitted when those checks fail.

Sources: [current world generation](../src/simulation/worldGeneration.ts), [current generation tests](../src/simulation/engine.test.ts), and [old world generation](../../Node%20Game/app/page.tsx), especially `MAP_NODE_FAVORED_OBSTRUCTION_BY_TIER`, `makeRemoteMapFactoryState`, and `generateMapFactoriesAtGameStart`.

## Placement and cable blocking

Both games reject construction or movement into obstruction footprints and reject new unrelated cable paths that cross them. Connections to the obstruction's own ports exclude that endpoint obstruction from the cable blocking check, allowing Stone delivery, Water extraction, and bot supply.

Current collisions use the same outline drawn on screen for Lakes, Deep Holes, camps, and Golems, with **12 units** of ordinary placement clearance. Cable curves are adaptively flattened to a quarter world unit and their entire segments intersected with the visible polygon, without an extra invisible halo. Small obstructions cannot fall between a fixed set of point samples. Runtime routing rechecks changed geometry and pauses obstructed cables.

The old game uses circles for hole collision and stored polygons for Lake and camp collision. Its hole clearance constant is **10**, while ordinary node clearance is **12**. Hole cable checking adapts its sample count to estimated curve length, with a minimum of 16 segments. Camp cable checks at connection creation use zero extra clearance. These differences can make an apparently similar shoreline or camp boundary accept a route in one game and reject it in the other.

Sources: [current collisions](../src/simulation/collisions.ts), [current cable rules](../src/simulation/connectionRules.ts), [old geometry](../../Node%20Game/game/geometry/connections.ts), [old clearance and ports](../../Node%20Game/game/domain/obstructions.ts), and [old connection creation](../../Node%20Game/app/page.tsx).

## Related world features in the current game

The current game also includes **Fabricators**, **Sorting Ruins**, and **Resource Golems**. Fabricators and Sorting Stations occupy node space but are not marked `worldObstacle`. Resource Golems are world obstacles with a **512 × 768 world-unit humanoid placeholder**, colored to match their mineral. Their visible silhouette also defines their obstruction footprint, including the open space beside the head and legs.

Fabricators and Sorting Stations provide encounter unlocks.

### Mineral Golems

New worlds contain exactly **four Resource Golems**, one each for **Iron, Copper, Stone, and Mythril**. Each occupies a different **tier 5** map sector. Their sectors exclude **Deep Holes, Lakes, and settlements**, while retaining normal mineral and Forest nodes. The Golem starts at the center of its play area, using the field size at the time of generation. Selection is deterministic for the world seed. Older worlds with sectors already generated at tier 5 or farther out retain their seeded tier-6 assignments.

After **Resource Golem Survey**, bot deliveries permanently reduce the Golem's remaining health. Iron, Copper and Stone start at **180 AP**, covered by 180 Small Bots or eight Command Bots. Mythril starts at **360 AP**, covered by 360 Small Bots or 15 Command Bots. Mixed deliveries also work. Partial damage persists through saves.

At zero health, the same node becomes **Infinite Iron**, **Infinite Copper**, **Infinite Stone**, or **Infinite Mythril** at the same position. Its bot input and incoming attack cables are removed. The new reserve has **four multi-connection star outputs**, centered on its north, east, south, and west faces. Connect Extractors to any face. All four sockets expose only that Golem's mineral, and mining never reduces a finite resource counter or creates a depletion hole. There is no recurring bot cost after victory.

Existing saves retain their explored layouts and the exact AP already paid. Loading a save converts a Golem whose prior damage covers the new price and returns its in-flight bots to their source. Any unspent bots already in that Golem's input go to the global pool. Existing infinite reserves retain their node IDs and minerals.

Sources: [Golem costs and conversion](../src/content/resourceGolems.ts), [current capability catalog](../src/content/nodeCapabilities.ts), [additional capability definitions](../src/content/progression.ts), [encounters and Golem simulation](../src/simulation/progression.ts), [infinite extraction](../src/simulation/engine.ts), [directional socket geometry](../src/renderer/nodeLayout.ts), and [world placement](../src/simulation/worldGeneration.ts).

## Importing obstructions from old saves

The current importer carries over hole radius and filled Stone, Lake dimensions and production time, and camp position, size, timer progress, and accumulated Attack Power. It does not retain the old Lake or camp polygon shape arrays. For an old hole without an explicit `stoneRequirement`, it defaults to **250 Stone** before subtracting the filled amount, rather than recalculating the old radius-based requirement.

The camp import does not copy `requiredAttackPower` into `attackRequirement`. Such camps use the current fallback requirement, `ceil(campStrength / 10)` with a minimum of one. For example, an imported camp at 25% size needs **3 AP**, even if the old camp required 1 AP. Its imported interval is stored in `cycleMs`, but the current simulation still checks at the fixed 60 seconds described above.

Source: [old-save obstruction conversion](../src/persistence/saves.ts).
