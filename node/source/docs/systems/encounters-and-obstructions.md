# Encounters and obstructions

[System index](README.md)

World encounters constrain placement and cable routing while providing new supply options. Settlements require continuing suppression; mineral Golems become permanent reserves after defeat; Deep Holes consume Stone to reclaim space.

## Settlements and tribute

New standard worlds contain five Goblin Camps, five Villages and five Kingdoms. They also contain five of each Dwarven settlement subtype in separate sectors across tiers four through nine. Both use serialized kind `monster-camp`; subtype fields distinguish their behavior.

| Settlement | AP required per 60-second check | Tribute per 5-second production cycle | Tribute capacity |
| --- | --- | --- | --- |
| Goblin Camp | 3 | 6 | 100 |
| Goblin Village | 9 | 18 | 100 |
| Goblin Kingdom | 16 | 36 | 100 |
| Dwarven Camp | 6 | 1 Mythril | 100 |
| Dwarven Village | 16 | 5 Mythril | 120 |
| Dwarven Kingdom | 32 | 12 Mythril | 288 |

Successful AP checks shrink the camp toward minimum size; failure grows it. Tribute operates only while suppressed at minimum size. The linked Tribute node stores output and can stop when full. Failed Goblin suppression removes its Tribute and stock. Dwarven Tribute remains linked but stops producing while the camp is not fully suppressed. Recurring supply matters even after the camp is small.

Goblin tribute can select Iron, Copper, Stone or Wood. Dwarven tribute is Mythril only. Dwarven overpayment retains surplus AP as credit and can retry a failed check when sufficient supply arrives. Goblin and Dwarven payment behavior must not be treated as identical.

## Mineral Golems

New worlds reserve four clear tier-five sectors for Iron, Copper, Stone and Mythril Golems. The first three require 100 AP each; Mythril requires 150 AP. Bots reduce remaining health, and defeat converts the same node into an infinite reserve with four directional extraction sockets. Extractors still determine output rate.

Saved worlds can retain tier-six placement from an earlier layout. Cost-version migrations and saved encounter identity matter when comparing an existing world with a freshly generated one. The current source supersedes older documentation quoting 180/360 AP.

## Deep Holes and landmarks

Generated Deep Holes vary with tier and geometry. Feed extracted Stone to reduce the outstanding amount; filling a hole reclaims its space. Depleted ordinary mineral reserves can also become Deep Holes. Efficient Landfill compounds the original Stone bill by 0.8 per rank, rounds upward, subtracts Stone already consumed and has a one-Stone minimum.

Fabricator Ruin and Sorting Ruin are discovery landmarks. Their presence can satisfy discovery conditions; they are not ordinary selectable production machines. Four distinct corner encounters have separate requirements in [endgame](endgame-and-victory.md).

Camp radii, Lake rectangles, hole circles and corner quadrants have distinct geometry. A node that fits visually can still have an illegal cable crossing. Post-victory relocation preserves stock and obeys placement restrictions; camp relocation moves its linked Tribute nodes together.

## Agreed changes awaiting implementation

A subsequent [Deep Hole exploration-gate estimate](../deep-hole-exploration-simulation.md) models the requested restriction on the four unexplored neighbors of a discovered generated-hole map, blocked from every approach until all its generated holes are filled. Already explored maps remain accessible. Main results use revealed information only; no hidden distribution guides player decisions. Only generated holes block exploration (NODE-0601); later depletion holes retain physical blocking and their 250-Stone base bill but never trigger or extend the gate. Honor completed destination purchases: purchased-but-unvisited maps stay enterable despite a later-discovered neighboring blocker (NODE-0602). Do not grey out or disable those purchased cells. New unfunded destination purchases remain gated. Purchases with contributed Cores before the blocker was discovered may continue and complete, keeping their quote, payment and subsequent entry access (NODE-0603), including after switching projects or reload. The exploration-gate policy review is complete; implementation remains pending. The graph estimates assume immediate visits and do not model buying ahead. No runtime gate is implemented.

The adopted [28-map distribution](../deep-hole-exploration-simulation.md#distribution-calibration-for-10515-targets) (NODE-0606) selects exactly 28 eligible hole-only maps in standard 11 × 11 new worlds. Use seeded weighted sampling without replacement: weight four at tiers 3–4, one elsewhere, with the selected layout preserved through saves and discovery. Unselected eligible locations become clear resource maps. Keep the approved one-to-five holes and budgets within selected maps and preserve other reserved encounters. Validation matched target medians of 10 / 5 / 15 maps filled for direct, adaptive and adaptive-with-all-Golems play; those targets are not per-world guarantees. This is adopted design awaiting implementation, with the existing new-world-only boundary.

The November 18, 2026 review is complete. All changed camp, Deep Hole and Lake rules in that review apply only to newly created worlds. Existing worlds retain their current rules, including on unexplored maps; loading, importing or re-saving must preserve that boundary. These are compatibility requirements for the pending implementation.

The [obstruction review](../obstruction-types-and-behavior.md) records newer design decisions separately from current runtime: a five-candidate generated-hole budget, random subsets, persistent grey buildable terrain after filling and refunds of unused Stone. Current code still removes filled holes. Lake Intake naming/access and automatic inclusion of Intakes in Lake relocation also have review decisions; consult that record before implementing changes rather than treating current labels or manual selection as the intended final behavior.

Sources: [Goblin definitions](../../src/content/goblinSettlements.ts), [Dwarven definitions](../../src/content/lizardSettlements.ts), [tribute](../../src/simulation/goblinTribute.ts), [Golems](../../src/content/resourceGolems.ts), [generation](../../src/simulation/worldGeneration.ts), [geometry](../../src/domain/obstructionGeometry.ts).

Coverage: [Goblins](../../src/simulation/goblinSettlements.test.ts), [Dwarven settlements](../../src/simulation/lizardSettlements.test.ts), [Golems](../../src/simulation/resourceGolems.test.ts), [obstruction borders](../../src/simulation/obstructionBorders.test.ts). [Earlier obstruction documentation](../obstruction-types-and-behavior.md) preserves detailed history and older observations.
