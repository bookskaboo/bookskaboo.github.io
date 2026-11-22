# Map nodes and exploration

[System index](README.md)

The standard world has an 11 × 11 Node Map with Home at serialized coordinate `5,5`. A Map Node is a sector containing a factory field, natural resources and encounters. This is distinct from an individual production or logistics node inside that field.

## Coordinates and discovery

[Landmarks](landmarks.md) add seventeen seeded Production discoveries to new standard 11×11 campaigns: six Rapid machines, six Tri Extractors, three normal Doublers, Reclaimer and Unknown Device. They occupy 2/5/5/5 sectors in the 1–2/3–4/5–6/7–9 bands, with Unknown Device restricted to tier 8. Home and the four corners are excluded.

Existing saves, training and larger worlds retain their existing rules without receiving the first landmark layout. New standard worlds save the assignment before exploration; loading and exploration order never reroll it. See [Landmark compatibility](landmarks.md#relocation-and-compatibility).

The combined Landmarks filter and selected-sector Points of Interest show landmarks only after the first visit. No anonymous frontier signals or activation-only reveals are shown. Unknown Device is pink and named without explaining its effect; the other sixteen landmarks and their discovered markers are purple.

All four current main-game map filters (Monster camps, Lakes, Golem camps and Landmarks) are discovery-gated and have no research requirement. The [revised filter design](../master-plan/04-world-and-encounters.md#map-filter-research-proposal) selects six separately purchased surveys gated by Basic through Final, replacing automatic upgrade rewards (NODE-0785). Manual discovery will enable each filter for known locations; completing its survey will expand coverage worldwide, including unexplored maps. Map filters will stay hidden until discovery or survey. The [isolated Upgrades test page](../../outputs/status-page/map-upgrades.html) reviews research presentation/payments only; camp splitting, border filtering and worldwide map reveals are still future main-game work.

Landmark placement uses a separate seeded stream after ordinary geography. The introductory Rapid Refiner occupies a random clear cardinal neighbor of Home, with a location-aware early exploration hint. Remaining Rapid/Doubler families shuffle across fixed band slots. Quadrant balance and non-adjacent sectors are preferences; existing geography, eligible sources and valid footprints take priority. See [distribution and discovery](landmarks.md#distribution-and-discovery).

Player travel through the Node Map or a Road carries the zoom from the map being left, clamped to the common 15%–220% field range. Saved views and exterior Road previews cannot bypass the 15% maximum zoom-out. Road travel through an exterior Travel arrow or body double-click focuses and highlights its reciprocal endpoint in the destination play area, on first visits and revisits, within field camera bounds. Ordinary Node Map travel centers a new field and retains a revisited destination’s saved world-space center. Each map still saves its view. Tutorial switches keep their authored views. No resource or terrain rules change and no save migration is needed.

Player-facing positions are relative to Home: `H`, `N1`, `E2` or `N1.W1`. Map tier is Manhattan distance from Home: `abs(x - 5) + abs(y - 5)`. Standard corners are tier ten. Mods can select larger odd grids up to 21 × 21 while preserving Home's serialized coordinate.

Only orthogonally adjacent locked cells on the unlocked frontier can open. Unlocking and visiting are separate: entering reveals resources and records discovery. Unvisited cells remain unexplored in presentation. Complex Core research reveals the four corner locations, using anonymous markers for still-locked challenges. This does not open, visit or survey those maps, and ordinary adjacency and prices still apply. A prior corner visit or completed End of the World milestone preserves legacy corner markers. All unlocked sectors continue simulating while another sector is active. Dev → Unlock all map nodes explicitly marks every map visited and updates discovery, so its entire map uses explored terrain, surveys, borders and corner markers. This debug override is not evidence of ordinary exploration.

## Exploration and prices

Double-clicking a paired Road body in the factory field visits its connected unlocked neighbor. This follows ordinary travel discovery and camera rules, from either endpoint and in either shipment direction. See [Road navigation](roads-and-vehicles.md#traveling-through-a-road).

Exploration costs five Simple and five Basic Cores and grants one Map Point. In unmodded factories, research Extra Map Point to bank more points, then choose a frontier in the Map modal. Research never opens a map. Activation spends one saved point and travel remains separate. Applied-mod factories retain their existing destination-priced flow unless their saved marker or research override selects point mode.

| Destination tiers | Required Core types | Price band |
| --- | --- | --- |
| 1–2 | Simple | 1 |
| 3–4 | Simple through Basic | 2 |
| 5–6 | Simple through Automata | 3 |
| 7 | Simple through Hydro | 4 |
| 8 | Simple through Shiny | 5 |
| 9–10 | Simple through Complex | 6 |

Let `opened` be the number of already unlocked sectors in the destination's price band. Per-Core amount is `5 + 5 × floor(opened / step)`, where `step` is one in band one and two in all other bands. The free opening counts. A corner adds one extra Complex Core to its bill. Prices are determined by destination band and prior openings in that band, rather than the global purchase count alone.

A quoted purchase retains its price and destination through project switching and save/load. Once payment has started, another destination cannot replace it. Old points and compatible destination-free quotes remain usable. Training and explicit map-research mod overrides use the fallback research schedule.

<a id="upgrades-prototype-banked-points"></a>

### Upgrades banked points

Unmodded new and loaded factories select mapResearchMode: points through the adopted [Upgrades screen](research.md). Extra Map Point research needs no destination, uses the existing destination-free completion-count/Core-access schedule, and awards one banked point on completion. Research never opens a sector in that mode. The active bill retains its Core types and amounts through switching, Core unlocks and reload; the next purchase reprices normally.

The explicit existing-factory transition also adopts this mode. An old destination quote keeps its exact bill, completion index and active/parked contributions while releasing only its target. Completion banks one point and advances the queue, leaving every map's unlocked/visited state intact until the player chooses a frontier. Existing banked points remain available. The author-only Test saved map purchase fixture also demonstrates this with an 11/13-paid bill, only two Simple Cores outstanding, and later selection of N1 instead of the old E1 destination. [Migration rules](saves-and-compatibility.md#migration-policy) apply the reviewed transition during unmodded campaign loading.

The player opens the shared Map modal, chooses an eligible frontier node and spends one point through Activate node · 1 point or a double-click. Activation consumes exactly one point without visiting; travel remains separate. Zero points disables activation and offers no destination research. Saved points count against remaining world capacity. The actual game retains normal Map layout preferences. Applied-mod factories keep their existing saved flow until support is revisited. The author study retains an external Map control and disables its own layout persistence/autosave. [Functional checks](../../previews/status-page/mapPoints.test.ts) cover point spending and old-quote conversion; normal-play campaign pricing balance remains unverified.

## Deep Hole exploration

Deep Holes do not restrict exploration or purchases of neighboring Map Nodes. Frontier adjacency, grid bounds, Map Points and Core bills determine access in both new and existing factories. Unfinished generated and depletion holes remain physical obstructions inside their own fields, with their existing generation, Stone costs, filling, refunds and completion rules.

Saved destinations retain their price, paid contributions and unlocked state. Previously paused destination funding can continue beside unfinished holes after load. A point still cannot pay again for a destination with an already-started research payment; resume that project instead. No save migration, automatic hole clearing, resource grant or new entry charge is introduced.

Standard new worlds use the [28-hole-map distribution](../deep-hole-exploration-simulation.md#distribution-calibration-for-10515-targets), with selection weight four at tiers 3–4 and one elsewhere. Other eligible locations become clear resource maps. The saved seed, world-rule version and encounter-layout version keep selection stable through later discovery. [Encounter rules](encounters-and-obstructions.md) describe candidate sizes, prices, completion and legacy differences. Existing worlds retain their versioned hole generation and filling rules. The historical 10/5/15 median filling analysis used the retired adjacency gate; it does not establish mandatory filling or pacing under the current exploration rules.

## Fields and generation

### Ground terrain for new games

New factories select mapTerrainVersion 1 and save the complete Map Node assignment before exploration. Existing saves without that marker (or with zero) keep plain ground and their previous resource generation, capacities and regeneration, including maps generated later. Terrain appears in the field and selected-map details only after the first visit; purchased but unvisited maps and legacy survey-only flags do not reveal it. The current full-map developer command explicitly marks maps visited. On the expanded Node Map only, visited cells receive a light terrain-color fill. The compact map keeps its existing colors. The written terrain type appears directly above Resources in the same heading font and size, colored with its terrain accent; legacy worlds without terrain retain their previous map presentation.

| Terrain | Forest stock and lasting cap | Forest natural refill | Stone, Copper, Iron and eligible Mythril stock/cap |
| --- | --- | --- | --- |
| Badlands | No Forest spawns | Not applicable | 50% of expected capacity |
| Grassland | 100% | 100% | 100% |
| Desert | 10% | 10% | 50% |
| Rocky | 50% | 100% | 200% |

Apply these factors once to generated starting reserves after existing distance/mod capacity rules, including finite camp-guarded deposits. Round to whole reserve units. Never create a missing resource or natural Mythril source. Lakes, infinite Golem rewards and subsequently created Drill deposits retain their existing rules. Mineral refill, extraction, suppression and paid Tree Planter rates remain unchanged; every refill respects the adjusted maximum. Moving a reserve within its map preserves that cap and its map's natural Forest rate.

For every supported odd side length N (11–21), each non-Grassland terrain gets floor(N² / 4) maps and Grassland one extra: 31/30/30/30 on the standard world and 111/110/110/110 at 21. Home and all four corners are Grassland. Each first diagonal from Home (N1.W1, N1.E1, S1.E1, S1.W1) is guaranteed the preferred terrain of its actual seeded corner encounter: Ancient Dragon → Badlands, Elder Grove → Grassland, Ancient Reclamation → Desert, Ancient Foundry → Rocky. These nine fixed sites count inside the quotas: six Grassland and one of each other terrain.

Shuffle the remaining positions with a separate terrain RNG, then draw from remaining quotas with 1.5× weight for that quadrant's preferred terrain and 1× for the others. The center row/column remain neutral. This is a soft preference, not an exact one-third quadrant quota. Save/load, exploration order, camera, research and mod removal never reroll terrain. An allowed world-size change before generating beyond Home rebuilds only a version-one assignment from the same seed and saved encounter order, preserving Home's contents.

The approved static 768-unit irregular art repeats across the full field and Area Expansion, beneath grid, border bands, completed-hole ground, cables and nodes. A stable visual variant is independent of gameplay RNG. Training retains plain legacy ground. The [adopted design](../master-plan/22-map-terrain-tiles.md), [author art page](../../previews/terrain-tiles/README.md) and [real engine review](../../previews/terrain-tiles/runtime.html) retain design decisions and review evidence. Normal-play terrain balance validation remains pending.

Sources: [distribution and matrix](../../src/domain/mapTerrain.ts), [saved layout and reserve transform](../../src/simulation/mapTerrain.ts), [generation integration tests](../../src/simulation/mapTerrain.test.ts), [shared artwork](../../src/art/mapTerrainArt.ts), [cached field textures](../../src/renderer/mapTerrain.ts).

### Shared border obstructions

New standard worlds have sixteen river, twelve mountain and eight chasm borders, counted once per shared edge. Assignment uses the saved seed and independent border layout version, before discovery. The nearer endpoint tiers are 1–6 for rivers, 3–8 for mountains and 5–9 for chasms. Larger grids round each quota after multiplying by `2 × n × (n - 1) / 220`; ranges scale with the grid radius. A bounded deterministic generator retains a valid subset if exact quotas cannot fit.

No two obstructed sides on a sector may meet at a right angle, including mixed types. Two opposite sides are allowed. Every map retains at least two clear in-world neighbors, all Home edges and Home–E1–E2 remain clear, and every blocked edge has a clear bypass of at most three hops. The clear graph preserves a Manhattan shortest route from Home to every destination. These are static graph safeguards: bypass sectors still need purchase, and local Road placement may require clearing physical holes. Border terrain does not block exploration or add an interior player-placement exclusion. Newly generated resources and field obstructions reserve the visible border artwork plus a 32-world-unit gap. Generation uses the shared art bounds, maximum settlement growth, future Golem reserve size and the largest Area Expansion peak height. It tries full-sized Lake/Deep Hole repositioning before retrying a bounded layout; it never returns an overlapping layout or shrinks a body to fit. Saved sectors retain their positions.

The field shows its clipped half of the shared terrain band. Horizontal mountain faces sit toward the upper half of the band to expose more bases on a south border; both neighboring views use the same shifted art and generation bounds. Only the selected Road placement/move ghost reveals the adjacent half. Node Map waves, peaks and paired fractures become visible after either neighboring map is visited. Selected-map Points of Interest include side and border-terrain rows in the same subtext style as other entries. There is no separate Border obstructions section. Rows, hover help and accessible labels omit research requirements. Research retains the terrain and allows ordinary Road placement worldwide: [crossing projects](roads-and-vehicles.md#border-crossing-research).

Existing worlds with an absent or zero `borderObstructionVersion` keep clear borders forever, including subsequently generated sectors. Version one saves store and validate the authoritative shared-edge list. The [design and validation record](../master-plan/21-border-obstructions.md#local-implementation) distinguishes implemented safeguards from pending normal-play tuning. The [engine test screen](../../previews/border-obstructions/runtime.html) uses actual generation, renderer, map and placement code with synthetic empty fields and no browser-save writes.

### Field layout and resources

Area Expansion adds equal space west/east and north/south around each existing field. On the standard world, each level adds 450 world units on both horizontal sides and 300 on both vertical sides: 3,600 × 2,400 → 4,500 × 3,000 → 5,400 × 3,600. Modded fields use half the actual width/height increase on each respective side.

When Area Expansion completes, already-generated unvisited maps spread their existing natural contents proportionally around the field center. Resource nodes, Lakes, Deep Holes, Golems, settlements and ruins keep their IDs, types, stock, caps, regeneration, encounter state and terrain assignment. Linked settlement deposits and Tribute nodes move together with their existing offsets. This changes positions, not map contents or resource quantities.

Home, the active map and visited maps keep their exact built/natural arrangement, node sizes and internal cable curves. An unvisited map containing player infrastructure or cables is also preserved. Only Roads move relative to these layouts, changing the curves of their vehicle connections. To retain nonnegative field coordinates, the engine rebases the entire preserved layout by half the size increase and offsets each saved camera by the opposite screen-space amount; field-center positions, the visible factory and zoom stay unchanged. Completed-hole ground and archived infrastructure follow the same frame. The renderer adopts the saved camera and cancels pending drags when field size changes.

Unvisited, unbuilt corners retain their separately authored expansion layout. Discovered or built modern corner challenges keep their footprint and Tribute geometry through expansion, travel and reload. The earlier guarded legacy-corner migration remains separate. Natural redistribution is applied atomically only when the proposed layout fits the field, other natural contents and border terrain; unusual incompatible layouts keep their arrangement. Road endpoints are handled by the separate unconditional border-alignment rule.

Generation and unvisited redistribution share an obstruction-aware placement check. Reserve the updated River/Mountain/Chasm art and its 32-world-unit gap, maximum settlement growth and living/defeated Golem footprints. Keep the intentional owner-camp/guarded-deposit overlap exemption. Redistribution also reserves incoming Roads at their final enlarged-border positions, using the same pair geometry as actual Road alignment. If this would overlap a natural body, preserve that map's centered arrangement rather than moving a reserve onto the Road. This does not constrain ordinary player construction or move a built map's non-Road contents. Existing hole-cluster sizing/overlap rules remain separate.

Maps generated later use the current expanded field dimensions for resource placement, so their resources also spread across the larger area. Existing resource-placement randomness remains seeded. Centered growth and redistribution run once when each expansion completes, and when Dev grants missing expansion research. They do not repeat on save/load; saved positions are authoritative. Previously expanded saves are not retroactively recentered. The position rule applies to legacy and terrain worlds without converting either world's resource rules. Coverage: [unvisited and centered expansion](../../src/simulation/unvisitedMapExpansion.test.ts). The separate [expansion review page](../../previews/terrain-tiles/expansion.html) uses the [comparison fixture](../../previews/terrain-tiles/expansionComparison.ts) to capture both levels around actual research completion for a visited Cart–Kiln–Cart factory and its unvisited Lake neighbor; its [check](../../previews/terrain-tiles/expansionComparison.test.ts) verifies centered coordinates, unchanged internal curves, retained camera/stock/caps and cable identities. This is synthetic review evidence, not a normal-play balance run.

New fields begin at 3,600 × 2,400 world units. Area Expansion grows field dimensions across the world; older saves preserve their largest prior field as the shared baseline. Existing Road pairs automatically reanchor to the new borders on both maps, retaining pairing, direction and cable records even if ordinary placement or cable-path checks would reject a manual move. This includes unvisited maps; loading an expanded save also repairs Roads stranded at old borders. See [Road border alignment](roads-and-vehicles.md#area-expansion-and-road-borders).

Home starts with Wood, Copper and Iron reserves of 1,000 each. Ordinary mineral/Forest reserve capacity increases with distance: `1,000 + min(10, tier) × 500` before mod and the terrain multipliers above. Standard tier-ten generation has no ordinary resource reserve; corners require supply networks. New natural Mythril spawn chance is zero.

Seeded layouts reserve Lakes, settlements, clear sectors and four mineral Golems. A Lake is guaranteed at `7,5`; the east neighbor `6,5` is reserved clear; a Sorting Ruin appears at `5,7`. New worlds retain thirty Goblin/Dwarven settlements, five of each level per faction in their original tier distributions. Settlements occupy distinct sectors, with Golems reserved separately. Saved layout versions preserve older placement rules.

Sources: [grid and labels](../../src/domain/worldGrid.ts), [destination pricing](../../src/simulation/mapExpansion.ts), [generation](../../src/simulation/worldGeneration.ts), [border generation and validation](../../src/simulation/borderObstructions.ts), [travel and unlock actions](../../src/simulation/engine.ts), [research quotes](../../src/simulation/researchRuntime.ts).

Coverage: [map research](../../src/simulation/mapResearch.test.ts), [sector travel](../../src/simulation/sectorTravel.test.ts), [border worlds and crossing rules](../../src/simulation/borderObstructions.test.ts), [map discovery display](../../src/ui/MapBorderObstructions.test.tsx), [world grids](../../src/mods/worldGrid.test.ts). See [roads](roads-and-vehicles.md), [encounters](encounters-and-obstructions.md) and [progression](progression-tiers.md).

Complex Core discovery gives the Map rail control, minimap/modal frame and each of the four corner cells a restrained gold outline and a 1.8-second glow cycle. Opening, hovering or focusing the map clears the map emphasis; hovering, focusing or selecting a corner clears only that corner. Persist the map flag and per-corner acknowledgements in endgame state, so closing/reopening and save/load do not restart cleared flashes. Keyboard focus is equivalent to hover. Reduced motion uses a steady outline. Revealing and acknowledging corners never opens maps or records visits/surveys.
