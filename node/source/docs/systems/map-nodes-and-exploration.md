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

## Proposed Deep Hole restriction

The November 18, 2026 [exploration-gate proposal and simulation](../deep-hole-exploration-simulation.md) would prevent exploration of all four edge-sharing unexplored neighbors of a discovered map with unfinished generated Deep Holes, from every approach, until all its generated holes are filled. Already explored maps retain access. Affected map cells would be greyed out with a nearby-hole explanation. This remains new-world-only design, not current engine behavior. The estimate assumes players do not know hidden terrain or source locations. Only generated holes trigger or sustain this gate (NODE-0601); later depletion holes keep physical blocking and their 250-Stone base bill without restricting exploration. Honor a completed destination purchase and allow its first visit despite a later-discovered neighboring blocker (NODE-0602); those purchased cells remain accessible. New unfunded purchases after a blocker is known remain restricted. A destination quote with Cores contributed before the blocker was discovered may continue funding and complete at its original price (NODE-0603); preserve its destination and payment through switching projects and reload, then unlock normal entry. An unfunded quote alone provides no exception. Existing Map Points remain saved but do not pre-purchase a destination. The exploration-gate policy review is complete; implementation is pending. The simulation results assume immediate visits and do not measure advance purchases.

The adopted [28-hole-map quota](../deep-hole-exploration-simulation.md#distribution-calibration-for-10515-targets) (NODE-0606) applies to standard 11 × 11 new worlds: select eligible hole-only locations without replacement using weight four for tiers 3–4 and one for all other tiers. The remaining eligible locations become clear resource maps. Preserve the seeded selection through save/load and discovery, existing reserved encounters, and one-to-five holes within each selected map. Its target median filling counts are 10 / 5 / 15 for the three tested immediate-visit policies, supported by 1,000 validation worlds. It is adopted proposal design, pending gameplay implementation; existing worlds retain their rules.

## Fields and generation

New fields begin at 3,600 × 2,400 world units. Area Expansion grows field dimensions across the world; older saves preserve their largest prior field as the shared baseline. Corner layouts follow expansion only when the move fits existing factories and cable boundaries.

Home starts with Wood, Copper and Iron reserves of 1,000 each. Ordinary mineral/Forest reserve capacity increases with distance: `1,000 + min(10, tier) × 500` before mod multipliers. Standard tier-ten generation has no ordinary resource reserve; corners require supply networks. New natural Mythril spawn chance is zero.

Seeded layouts reserve Lakes, settlements, clear sectors and four mineral Golems. A Lake is guaranteed at `7,5`; the east neighbor `6,5` is reserved clear; a Sorting Ruin appears at `5,7`. Goblin and Dwarven settlements occupy distinct sectors, with Golems reserved separately. Saved layout versions preserve older placement rules.

Sources: [grid and labels](../../src/domain/worldGrid.ts), [destination pricing](../../src/simulation/mapExpansion.ts), [generation](../../src/simulation/worldGeneration.ts), [travel and unlock actions](../../src/simulation/engine.ts), [research quotes](../../src/simulation/researchRuntime.ts).

Coverage: [map research](../../src/simulation/mapResearch.test.ts), [sector travel](../../src/simulation/sectorTravel.test.ts), [world grids](../../src/mods/worldGrid.test.ts). See [roads](roads-and-vehicles.md), [encounters](encounters-and-obstructions.md) and [progression](progression-tiers.md).
