# Encounters and obstructions

[System index](README.md)

New worlds use the guarded-deposit and obstruction rules below. Existing worlds, including saves without an explicit world-rule marker, keep legacy behavior even on unexplored maps. See [save compatibility](saves-and-compatibility.md).

## Settlements and guarded deposits

Standard worlds contain five each of Goblin Camps, Villages and Kingdoms, and five each of the Dwarven equivalents: fifteen per faction, thirty total. New games retain encounter layout 2 and the prior tier distribution. Settlements keep their recurring suppression checks, growth, AP credit/retry rules and protected maximum-growth space. Suppression succeeds at the 10% minimum after a passed check; it does not remove the settlement.

| Settlement | AP per normal 60-second check | Base reserve regeneration per 5 seconds |
| --- | ---: | ---: |
| Goblin Camp | 3 | 6 |
| Goblin Village | 9 | 18 |
| Goblin Kingdom | 16 | 36 |
| Dwarven Camp | 6 | 1 Mythril |
| Dwarven Village | 16 | 5 Mythril |
| Dwarven Kingdom | 32 | 12 Mythril |

In new worlds, each settlement spawns its always-visible guarded deposit at the camp center, inside its initial 25% footprint. This linked pair intentionally overlaps; ordinary resources still remain outside the maximum-growth reservation. Existing saved map positions are preserved. A seeded Goblin mineral choice of Iron, Copper or Stone replaces the matching ordinary deposit. Dwarven Mythril is additional to ordinary Iron, Copper, Stone and Forest supplies. Deposits start at the normal full map reserve and have the normal map maximum. They require Production Extractors; they do not emit free cargo or create separate Tribute boxes.

The camp AP socket sits on its left border, with clearance from the resource body after suppression; its AP/check readout stays below the deposit.

Before full suppression, inspection is allowed but new outgoing extraction connections are blocked. Losing suppression pauses extraction and regeneration without discarding stock, extraction progress, connections or fractional regeneration credit. Restoring suppression resumes the branch. A fully suppressed deposit can connect out through its own camp border; unrelated cables and other obstruction borders retain their normal blocking rules. Empty guarded deposits remain in place and refill without Mineral Regeneration research. Mineral Regeneration 2 doubles their base rate; Mineral Regeneration Rate multiplies by one plus 0.2 per completion; endgame Resource Regeneration multiplies again by one plus its completion count. Reserve caps clear surplus regeneration credit. First actual guarded Dwarven Mythril extraction unlocks Mythril Refining.

Monster Camp Relocation moves a settlement and its guarded deposit together, including when the deposit is dragged. Resource Relocation does not move guarded deposits separately. Growth still pauses covered factory nodes and blocked cables while preserving their state. Locked guarded reserves are excluded from currently collectable recovery supply.

## Legacy settlement rewards

Legacy worlds retain Tribute. Goblins can select Iron, Copper, Stone or Wood, produce only at minimum suppressed size and lose their Tribute node, stock and routes on failure. Dwarven Mythril Tribute remains linked but pauses when suppression lapses; its Camp/Village/Kingdom capacities are 100/120/288. Goblin capacity is 100. Dwarven overpayment and failed-check retries retain their existing behavior. Legacy worlds do not gain guarded deposits during later map generation.

## Deep Holes

Standard new worlds select exactly 28 eligible hole maps by seeded weighted sampling without replacement: weight four at tiers 3–4, one elsewhere. Other eligible locations become clear resource maps. Reserved Home, outposts, Lakes, settlements, Golems and corners remain separate. The fixed 28-map quota is specific to the standard grid; larger mod grids retain their existing eligible-map distribution. Explicit mod spawns can override normal terrain.

Each selected map first sizes five candidate holes against a circular area budget of 15% at tier one through 35% at tier nine. Their Stone pool is 1,650 through 13,200 at default settings, preserving the agreed eightfold progression. Divide the bill by candidate area using largest-remainder integer rounding. Choose one through five candidates with an equal 20% probability per count and a uniform distinct subset; omitted cost and area are not redistributed. Resource multipliers/custom Stone capacities affect the base Stone pool. Legacy worlds retain radius-based pricing and their former distribution.

Partial holes keep their full visible blocking footprint. In new worlds, completion retains the exact outline and border as uniform grey buildable terrain beneath factories and cables. Remove active fill ports and routes, refund buffered and in-flight surplus once, and preserve the terrain through saves. Buffered surplus returns to a surviving upstream supplier; missing suppliers use the shared pool to preserve the material. Efficient Landfill completion also clears paused holes. Legacy holes disappear and retain their prior buffered-surplus handling.

Depletion-created holes keep a 250-Stone base bill and may coexist with other obstructions. They never trigger or extend the new exploration restriction. [Exploration rules](map-nodes-and-exploration.md#deep-hole-exploration) describe generated-hole blocking and paid-purchase exceptions. The [proposal and simulation](../deep-hole-exploration-simulation.md) retain the decision and analytical evidence; 10/5/15 filling counts are balance targets for the studied thirty-settlement distribution, not guaranteed gameplay outcomes.

## Lakes

New-world Lakes provide all Water through directly connected Production Lake Intakes, called Pumps in the build catalog. They have no autonomous Water production or direct consumer/logistics output. Intake rates, buffers, permanence and the 15%–25% ellipse budget remain unchanged. Each Lake permits two Intakes at base, three with fluidLink5 and four with fluidLink6 or the later rank. Lake Relocation automatically moves all directly connected Intakes by the same displacement and rejects the whole move if a member or affected cable is invalid. Unrelated downstream factories and disconnected Intakes stay put. Legacy Lakes retain direct Water, a two-Intake limit and optional group movement. See [fluids](fluids.md).

## Golems and corner encounters

Four tier-five mineral Golems remain one-time encounters: 100 AP for Iron, Copper and Stone, 150 for Mythril. Defeat creates a permanent infinite reserve worked by Extractors, with a 640 × 512 body. Living Golems stay fixed; defeated reserves use post-victory Resource Relocation. Saved older placements remain compatible.

Corner encounters retain permanent blocking footprints and repeatable rewards. New-world reward node titles use their component names: α Piece, β Piece, γ Piece and δ Piece. Encounter names stay unchanged; legacy reward titles are preserved. Fabricator and Sorting Ruins remain discovery landmarks.

## Verification and entry points

Rivers, chasms and mountains on shared map borders are a [design proposal](../master-plan/21-border-obstructions.md), separate from implemented field obstructions. No terrain crossing research is implemented yet.

[New-world compatibility and mechanics tests](../../src/simulation/newWorldObstructions.test.ts) pair legacy and new rules, including generation, persistence, guarded access/refill, movement, completion/refunds and exploration purchases. The [engine test page](../../previews/obstructions/index.html) uses isolated fixtures with manual controls and autosave disabled; it is not a normal-play balance run.

Sources: [world rules](../../src/simulation/worldRules.ts), [generation](../../src/simulation/worldGeneration.ts), [guarded regeneration](../../src/simulation/guardedResources.ts), [engine](../../src/simulation/engine.ts), [legacy Tribute](../../src/simulation/goblinTribute.ts), [Golems](../../src/content/resourceGolems.ts), [geometry](../../src/domain/obstructionGeometry.ts). [Earlier obstruction comparisons](../obstruction-types-and-behavior.md) retain the dated historical context.
