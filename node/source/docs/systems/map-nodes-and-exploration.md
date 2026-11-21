# Map nodes and exploration

[System index](README.md)

The standard world has an 11 × 11 Node Map with Home at serialized coordinate `5,5`. A Map Node is a sector containing a factory field, natural resources and encounters. This is distinct from an individual production or logistics node inside that field.

## Coordinates and discovery

Player-facing positions are relative to Home: `H`, `N1`, `E2` or `N1.W1`. Map tier is Manhattan distance from Home: `abs(x - 5) + abs(y - 5)`. Standard corners are tier ten. Mods can select larger odd grids up to 21 × 21 while preserving Home's serialized coordinate.

Only orthogonally adjacent locked cells on the unlocked frontier can open. Unlocking and visiting are separate: entering reveals resources and records discovery. Unvisited cells remain unexplored in presentation. All unlocked sectors continue simulating while another sector is active.

## Exploration and prices

Exploration costs five Simple and five Basic Cores and grants one Map Point. Spend saved points on adjacent maps. When no points remain, select the destination to quote its Extra Map Point bill before starting research. Completing a destination quote opens that sector directly.

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

## Deep Hole exploration

In new worlds, discovering unfinished generated Deep Holes prevents new purchases of all four edge-sharing unexplored neighbors, even from another approach. Grey affected map cells and inspect them for the nearby blocking map names. Clear every generated hole in each blocking neighbor to continue. Depletion holes do not trigger or sustain this restriction; completed grey ground is not a blocker.

Already unlocked maps remain enterable, including purchased but unvisited destinations. A destination quote with Cores contributed before blocker discovery may keep funding and finish at its original price, including after switching projects or save/load. Unlock that destination on completion; preserve its entry access and paid value. A selected but unfunded quote does not qualify. Saved Map Points cannot bypass a known blocker or pay twice for an already-started destination purchase; resume that project instead. Unfunded blocked quotes retain their destination, price and input Cores without consuming more.

Standard new worlds use the [28-hole-map distribution](../deep-hole-exploration-simulation.md#distribution-calibration-for-10515-targets), with selection weight four at tiers 3–4 and one elsewhere. Other eligible locations become clear resource maps. The saved seed, world-rule version and encounter-layout version keep selection stable through later discovery. [Encounter rules](encounters-and-obstructions.md) describe candidate sizes, prices, completion and legacy differences. Existing worlds keep their original exploration and generation rules on every later map. The analytical 10/5/15 median filling targets assume the retained thirty-settlement distribution and immediate visits; they do not estimate advance-purchase strategies.

## Fields and generation

### Shared border obstructions

New standard worlds have sixteen river, twelve mountain and eight chasm borders, counted once per shared edge. Assignment uses the saved seed and independent border layout version, before discovery. The nearer endpoint tiers are 1–6 for rivers, 3–8 for mountains and 5–9 for chasms. Larger grids round each quota after multiplying by `2 × n × (n - 1) / 220`; ranges scale with the grid radius. A bounded deterministic generator retains a valid subset if exact quotas cannot fit.

No two obstructed sides on a sector may meet at a right angle, including mixed types. Two opposite sides are allowed. Every map retains at least two clear in-world neighbors, all Home edges and Home–E1–E2 remain clear, and every blocked edge has a clear bypass of at most three hops. The clear graph preserves a Manhattan shortest route from Home to every destination. These are static graph safeguards: bypass sectors may still need purchase or Deep Hole completion. Border terrain does not block exploration or reserve an interior factory footprint.

The field shows its clipped half of the shared terrain band. Only the selected Road placement/move ghost reveals the adjacent half. Node Map waves, peaks and paired fractures become visible after either neighboring map is visited. Selected-map rows list the side and terrain; rows, hover help and accessible labels omit research requirements. Research retains the terrain and allows ordinary Road placement worldwide: [crossing projects](roads-and-vehicles.md#border-crossing-research).

Existing worlds with an absent or zero `borderObstructionVersion` keep clear borders forever, including subsequently generated sectors. Version one saves store and validate the authoritative shared-edge list. The [design and validation record](../master-plan/21-border-obstructions.md#local-implementation) distinguishes implemented safeguards from pending normal-play tuning. The [engine test screen](../../previews/border-obstructions/runtime.html) uses actual generation, renderer, map and placement code with synthetic empty fields and no browser-save writes.

### Field layout and resources

New fields begin at 3,600 × 2,400 world units. Area Expansion grows field dimensions across the world; older saves preserve their largest prior field as the shared baseline. Corner layouts follow expansion only when the move fits existing factories and cable boundaries.

Home starts with Wood, Copper and Iron reserves of 1,000 each. Ordinary mineral/Forest reserve capacity increases with distance: `1,000 + min(10, tier) × 500` before mod multipliers. Standard tier-ten generation has no ordinary resource reserve; corners require supply networks. New natural Mythril spawn chance is zero.

Seeded layouts reserve Lakes, settlements, clear sectors and four mineral Golems. A Lake is guaranteed at `7,5`; the east neighbor `6,5` is reserved clear; a Sorting Ruin appears at `5,7`. New worlds retain thirty Goblin/Dwarven settlements, five of each level per faction in their original tier distributions. Settlements occupy distinct sectors, with Golems reserved separately. Saved layout versions preserve older placement rules.

Sources: [grid and labels](../../src/domain/worldGrid.ts), [destination pricing](../../src/simulation/mapExpansion.ts), [generation](../../src/simulation/worldGeneration.ts), [travel and unlock actions](../../src/simulation/engine.ts), [research quotes](../../src/simulation/researchRuntime.ts).

Coverage: [map research](../../src/simulation/mapResearch.test.ts), [sector travel](../../src/simulation/sectorTravel.test.ts), [world grids](../../src/mods/worldGrid.test.ts). See [roads](roads-and-vehicles.md), [encounters](encounters-and-obstructions.md) and [progression](progression-tiers.md).
