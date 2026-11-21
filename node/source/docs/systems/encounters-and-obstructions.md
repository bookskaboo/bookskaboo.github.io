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

In new worlds, each settlement spawns its always-visible guarded deposit to the right, at the same vertical center. Place its left edge 12 world units beyond the rightmost point of that camp's exact visible outline at the fully suppressed 10% footprint. The whole resource card is outside that footprint; the camp intersects its left side again at 20% and at initial discovery. This is a footprint-intersection rule, not a requirement to fit the entire resource card inside the camp. Ordinary resources still remain outside the maximum-growth reservation. Existing saved map positions are preserved. A seeded Goblin mineral choice of Iron, Copper or Stone replaces the matching ordinary deposit. Dwarven Mythril is additional to ordinary Iron, Copper, Stone and Forest supplies. Deposits start at the normal full map reserve and have the normal map maximum. They require Production Extractors; they do not emit free cargo or create separate Tribute boxes.

The camp AP socket stays at the camp center, with its badge on the left and the adjacent reserve on the right. Guarded-camp artwork is 256 world units across (formerly 144), positioned above the socket and to the left of the resource, with its lower edge 20 world units above the socket. The title stays above the art and the AP card below the resource, without overlaps. Legacy artwork sizing remains unchanged. Camp backgrounds have a stable layer beneath resource cards, including when selection or camp growth rebuilds a view. Locked reserves remain visible and inspectable, using the same red card colors and opacity as camp-covered factory nodes, without a padlock or Locked/Accessible label on the card. Extraction remains gated until full suppression, which restores the normal resource appearance. The inspector retains its access explanation. Red styling also applies to previously saved guarded camps without moving their saved positions.

All Goblin and Dwarven Camp/Village/Kingdom AP cards, including legacy worlds, show the AP amount and progress bar without a countdown/result line below it. The card is shortened accordingly. Check timing, results, suppression mechanics and inspector detail remain unchanged; result colors and the camp halo remain visible.

Before full suppression, inspection is allowed but new outgoing extraction connections are blocked. Losing suppression pauses extraction and regeneration without discarding stock, extraction progress, connections or fractional regeneration credit. Restoring suppression resumes the branch. A fully suppressed deposit can connect out through its own camp border; unrelated cables and other obstruction borders retain their normal blocking rules. Empty guarded deposits remain in place and refill without Mineral Regeneration research. Mineral Regeneration 2 doubles their base rate; Mineral Regeneration Rate multiplies by one plus 0.2 per completion; endgame Resource Regeneration multiplies again by one plus its completion count. Reserve caps clear surplus regeneration credit. First actual guarded Dwarven Mythril extraction unlocks Mythril Refining.

Monster Camp Relocation moves a settlement and its guarded deposit together, including when the deposit is dragged. Resource Relocation does not move guarded deposits separately. Growth still pauses covered factory nodes and blocked cables while preserving their state. Locked guarded reserves are excluded from currently collectable recovery supply.

### Automatic reserve refill connection

A fully suppressed settlement automatically shows a dedicated output beside its centered AP input and a connected inlet on its guarded deposit. Both refill sockets and the link are system-owned: players cannot wire, redirect, replace or delete them. The AP input and ordinary Extractor output remain player-controlled. The automatic link disappears when suppression is lost and returns when restored; stock and player extraction routes retain their existing pause/resume behavior.

Packets and arrival pulses depict actual reserve regeneration awards at the existing five-second interval, including all current multipliers, fractional carry and reserve-cap clamping. A packet containing multiple units displays its actual quantity. A full reserve leaves the connection idle. The animation is cosmetic evidence of the existing reserve update, not extra cargo, a new inventory or a second reward. New transient receipts are not saved, and loaded or revisited maps do not replay historical refills. Game pause freezes packets; reduced-motion or disabled-particle preferences retain the static link without moving effects. The connection follows paired relocation and saved positions.

## Legacy settlement rewards

Legacy worlds retain Tribute. Goblins can select Iron, Copper, Stone or Wood, produce only at minimum suppressed size and lose their Tribute node, stock and routes on failure. Dwarven Mythril Tribute remains linked but pauses when suppression lapses; its Camp/Village/Kingdom capacities are 100/120/288. Goblin capacity is 100. Dwarven overpayment and failed-check retries retain their existing behavior. Legacy worlds do not gain guarded deposits during later map generation.

## Deep Holes

Standard new worlds select exactly 28 eligible hole maps by seeded weighted sampling without replacement: weight four at tiers 3–4, one elsewhere. Other eligible locations become clear resource maps. Reserved Home, outposts, Lakes, settlements, Golems and corners remain separate. The fixed 28-map quota is specific to the standard grid; larger mod grids retain their existing eligible-map distribution. Explicit mod spawns can override normal terrain.

Each selected map first sizes five candidate holes against a circular area budget of 15% at tier one through 35% at tier nine. Their Stone pool is 1,650 through 13,200 at default settings, preserving the agreed eightfold progression. Divide the bill by candidate area using largest-remainder integer rounding. Choose one through five candidates with an equal 20% probability per count and a uniform distinct subset before spatial validation; omitted cost and area are not redistributed. Border-clearance retries can condition the accepted layout, while the 28-map quota and sizing/Stone formulas remain unchanged. Resource multipliers/custom Stone capacities affect the base Stone pool. Legacy worlds retain radius-based pricing and their former distribution.

Partial holes keep their full visible blocking footprint. In new worlds, completion retains the exact outline and border as uniform grey buildable terrain beneath factories and cables. Remove active fill ports and routes, refund buffered and in-flight surplus once, and preserve the terrain through saves. Buffered surplus returns to a surviving upstream supplier; missing suppliers use the shared pool to preserve the material. Efficient Landfill completion also clears paused holes. Legacy holes disappear and retain their prior buffered-surplus handling.

Depletion-created holes keep a 250-Stone base bill and may coexist with other obstructions. Neither generated nor depletion holes restrict exploration of neighboring maps. They retain local placement/cable obstruction and their existing filling behavior. [Exploration rules](map-nodes-and-exploration.md#deep-hole-exploration) describe current purchases; the [earlier simulation](../deep-hole-exploration-simulation.md) retains analysis of the retired adjacency gate. Its 10/5/15 filling counts are historical targets under that gate, not guaranteed current gameplay outcomes.

## Lakes

New-world Lakes provide all Water through directly connected Production Lake Intakes, called Pumps in the build catalog. They have no autonomous Water production or direct consumer/logistics output. Intake rates, buffers, permanence and the 15%–25% ellipse budget remain unchanged. When a border-adjacent Lake cannot fit its initial proportions, generation adapts its ellipse aspect to the safe interior while preserving the sampled area; it then places the full rounded body with the artwork gap. This also supports asymmetric mod fields. Each Lake permits two Intakes at base, three with fluidLink5 and four with fluidLink6 or the later rank. Lake Relocation automatically moves all directly connected Intakes by the same displacement and rejects the whole move if a member or affected cable is invalid. Unrelated downstream factories and disconnected Intakes stay put. Legacy Lakes retain direct Water, a two-Intake limit and optional group movement. See [fluids](fluids.md).

## Golems and corner encounters

Four tier-five mineral Golems remain one-time encounters: 100 AP for Iron, Copper and Stone, 150 for Mythril. Defeat creates a permanent infinite reserve worked by Extractors, with a 640 × 512 body. Living Golems stay fixed; defeated reserves use post-victory Resource Relocation. Saved older placements remain compatible.

Corner encounters retain permanent blocking footprints and repeatable rewards. New-world reward node titles use their component names: α Piece, β Piece, γ Piece and δ Piece. Encounter names stay unchanged; legacy reward titles are preserved. Fabricator and Sorting Ruins remain discovery landmarks.

## Verification and entry points

Rivers, mountains and chasms are implemented [shared-border obstructions](map-nodes-and-exploration.md#shared-border-obstructions), with crossing research at Hydro, Shiny and Complex. Newly generated Lakes, Deep Holes, settlements, Golems and resource bodies stay outside their visible half-bands with a 32-world-unit gap. Settlement checks reserve maximum growth and Golems reserve both living and defeated bodies. The protected camp/deposit pair still intentionally shares the camp area, with the deposit beside the centered AP socket. Existing saved layouts are preserved. The [clearance audit](../../outputs/border-obstructions-south-bases/generation-audit.json) reports tested seeds and limits.

Ordinary and mod-added generation now share the full-growth body/border check with [unvisited redistribution](map-nodes-and-exploration.md#field-layout-and-resources). Check every unrelated body against maximum camp size, even if that camp is currently suppressed; never change the camp's saved strength to perform a query. Keep the owner/guarded-deposit exception and the existing separate hole-cluster rules. Redistribution additionally reserves final incoming Road geometry before accepting positions. The [current static audit](../../outputs/unvisited-map-expansion/spawn-clearance/generation-audit.json) and the separate [expansion/test-results page](../../previews/terrain-tiles/expansion.html) report the updated checks. This creates no new spawn types, counts, resource bonuses or player-building exclusion and does not retrofit saved layouts.

[New-world compatibility and mechanics tests](../../src/simulation/newWorldObstructions.test.ts) pair legacy and new rules, including generation, persistence, guarded access/refill, movement, completion/refunds and exploration purchases. The [engine test page](../../previews/obstructions/index.html) uses isolated fixtures with manual controls, an optional ordinary-speed Run clock/Stop clock control and autosave disabled; it is not a normal-play balance run.

Sources: [world rules](../../src/simulation/worldRules.ts), [generation](../../src/simulation/worldGeneration.ts), [guarded regeneration](../../src/simulation/guardedResources.ts), [engine](../../src/simulation/engine.ts), [legacy Tribute](../../src/simulation/goblinTribute.ts), [Golems](../../src/content/resourceGolems.ts), [geometry](../../src/domain/obstructionGeometry.ts). [Earlier obstruction comparisons](../obstruction-types-and-behavior.md) retain the dated historical context.
