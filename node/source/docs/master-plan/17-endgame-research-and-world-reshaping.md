# Endgame research and world reshaping

## Adopted research tracks (Q113, November 3, 2026)

The user supplies four endgame research tracks rather than choosing the proposed generic speed/yield improvement. Treat these as Final-Core-era research, intended to give continued Final Core production a purpose. Q120, Q125, Q129 and Q132 adopt all-seven-Core prices for regeneration, Landfill, Train research and the two advanced Road levels. Q134 adopts the three relocation prices below; Q135 adopts post-victory availability; Q136–Q138 adopt resource eligibility, coupled camp/Tribute movement and Lake-only movement with optional explicit Intake selection. Geometry/save integration remains implementation work. Existing post-first-Core global Storage/Inventory access stays independent.

| Working project name | Purchase structure | Adopted benefit |
| --- | --- | --- |
| Resource Relocation | One-time research | Resource nodes become movable |
| Efficient Landfill | Repeatable research with increasing research costs | Each rank reduces the Stone needed to fill a Deep Hole |
| Lake Relocation | One-time research | Lakes become movable |
| Monster Camp Relocation | One-time research | Monster camps become movable |
| Resource Regeneration | Repeatable research | Each completion increases regeneration of resource nodes, explicitly including Forests |

Q115 adds two further adopted endgame tracks: increasing-cost Road-channel ranks extending the existing maximum from three to four and five per face, and increasing-cost Train capacity research with coordinated transfer quantities. [Endgame transport research](18-endgame-transport-research.md) records the current 20/40/80 vehicle capacities, one-item/five-second runtime Road baseline and Q116A adopted 1/2/4 design. These additions are separate from the six unadopted QoL candidates below.

These are adopted design directions, not implemented research. Q134 adopts relocation prices below; Q129 Train and Q132 advanced Road prices are adopted; Q123 adopts the Deep Hole reduction/minimum, Q125 Landfill prices, and Q120 the separate Resource Regeneration prices. Q114 adopts same-map relocation only. The two proposed generic production-speed/material-yield benefits remain unadopted.

## Relocation rules to resolve

**Q114 adopted November 3, 2026:** all three relocation unlocks permit repositioning **within the same map only**. The user selected option 1. Preserve each feature’s sector identity and existing world distribution; the benefit is rebuilding local layouts rather than consolidating the world’s resources into one map. Cross-map transfer is not granted by these projects and remains an unadopted possible future research.

Q136 adopts Resource Relocation coverage for Forests, ordinary valid mineral deposits and cleared-Golem reserves, including infinite reserves. Lake movement is deliberately a separate project. Monster Camp Relocation needs explicit coverage for ordinary Goblin/Dwarven Camps, Villages and Kingdoms and their linked Tribute boxes. Do not silently classify the four unique endgame corner challenges or undefeated Golems as ordinary movable camps/resources. Their inclusion would need a separate design decision.

Moving an existing object must preserve its identity and state: remaining resource/capacity, regeneration, suppression/AP credit and timers, local stock, Tribute linkage and stock, research/discovery history and connections/transfers as applicable. Relocation does not imply duplication, replenishment, a new reward or re-triggering first discovery. Define valid footprints, bounds, overlaps, attached-object movement, route changes and undo/save behavior before runtime integration. A move must not silently delete another feature, factory stock or in-flight goods.

The one-time research unlocks the ability to move eligible objects; it is not a research purchase for each individual object. Q134 adopts no additional material fee for eligible moves after the one-time unlock. Preserve ordinary node movement and the free ability to inspect errors; these are new capabilities for currently fixed world features.

## Adopted one-time relocation prices (Q134, November 4, 2026)

The user selects option 1: **each** of Resource Relocation, Lake Relocation and Monster Camp Relocation costs **one of each of all seven Core types, Simple through Final**. They remain **three separate one-time projects**, bought once globally per project. Buying all three costs three of each Core type: **21 physical Cores including three Final Cores**.

The three-each alternative was not selected. After completing a project, subsequent eligible moves within the same map carry **no additional material fee**. Research payment neither replenishes a feature nor resets its state. Q135 adopts unlock prerequisites below; exact target/linked-object handling remains to finalize.

This common-price decision does not grant cross-map transfer or movement of unique corner challenges. The already adopted Q114 same-map rule and preservation of resources/encounter state remain in force.

## Adopted relocation project availability (Q135, November 4, 2026)

The user selects option 1: require **recorded victory-research completion** for all three relocation projects. Each remains its own one-time purchase at the adopted seven-Core price. No extra ordinary research project is required. First Final Core production alone is insufficient; the earlier-access alternative was not selected.

A shared gate does not bundle their effects or grant movement automatically: buy each relevant project before moving its eligible features. No placed feature or dismissed victory notice is required as an extra unlock condition. Global Storage/Inventory access retains its separate first-production gate. Preserve Q114 same-map movement and all original feature state.

## Adopted Resource Relocation eligibility (Q136, November 4, 2026)

The user selects option 1: include **Forests, ordinary valid mineral deposits and cleared-Golem mineral reserves**, whether those reserves are finite or infinite. Current defeat handling converts a Golem into its resource kind, retaining ID/position and setting its infinite flag; moving an already-cleared reserve would fit the normal resource family while preserving the original map.

The fixed-reserve alternative was not selected. This project excludes Lakes (their own unlock), living/undefeated Golems, Deep Holes, camps and unique corner challenges from this particular project.

Eligible movement must retain resource item, ID, remaining stock/capacity, regeneration progress, infinite status and defeated-Golem history. No fresh Mythril deposits or Wood Golem are introduced. Do not move a still-living encounter merely because it will eventually become a resource node. Source: [Golem conversion](../../src/content/resourceGolems.ts), [resource modules](../../src/content/nodeModules.ts), [capabilities](../../src/content/nodeCapabilities.ts). This is adopted design; runtime movement permission remains unimplemented.

## Adopted camp and Tribute relocation (Q137, November 4, 2026)

The user selects option 1: treat an ordinary Goblin or Dwarven Camp, Village or Kingdom and its existing linked Tribute box as one relocation group. A relocation translates both by the same amount, preserving their relative placement; initiating movement through either member must not bypass this grouping. If no box exists yet, move only the camp. If either footprint cannot be placed legally, reject the entire move without changing either object.

Independent camp/box relocation was not selected. Unique corner challenges and living Golems are not ordinary settlements covered by this project. Same-map scope, the separate one-time purchase and the post-victory gate remain unchanged.

The coupled move must preserve IDs, owner linkage, inventories, capacities, suppression/AP credit, pressure/radius, production/upkeep clocks and connection/transfer state. Moving must not award Tribute, reset suppression, start a free upkeep interval or create another box. Recompute encroachment at the new camp location. If a group selection already contains both objects, translate each only once. Current boxes are separate nodes linked by tributeCampId; the existing item-selection helper follows that link but does not establish relocation behavior. See [Tribute creation](../../src/simulation/goblinTribute.ts) and [camp effects](../../src/simulation/campEffects.ts).

## Adopted Lake relocation and connected Intakes (Q138, November 4, 2026)

The user selects option 1: moving a Lake alone leaves its connected Lake Intakes in place and preserves their connections. Players can explicitly group-select Intakes when they want to move the installation together. Automatic inclusion of connected Intakes was not selected.

Current Intakes obtain Water through a Lake connection, not a shoreline-distance test, and each Lake currently supports at most two connected Intakes. Preserve these rules, node IDs, Water stock, progress, connections and in-flight goods. Moving a Lake must not automatically collect connected Intakes or downstream factory nodes. Retain same-map scope and legal placement requirements. Lake Intakes remain Production nodes; this decision grants no new Water rate, extra Intake connection or cross-map movement. Sources: [Intake production](../../src/simulation/progression.ts), [connection validation](../../src/simulation/engine.ts). Runtime Lake relocation remains pending.

## Deep Hole efficiency rules to resolve

**Current generated fill prices (November 8, 2026, NODE-0349).** The tier-9 per-hole maximum is 4,000 Stone. Efficient Landfill prices a hole at that maximum at 3,200 Stone at rank 1, 2,048 at rank 3, and 1,311 at rank 5, before credit for Stone already consumed. Older saves can still contain 20,000-Stone holes, which the rank-45 limit below covers.

The user adopts a progressively more expensive research line that reduces Stone demand. Q123 adopts the reduction, upward rounding and one-Stone minimum below. Q124 adopts crediting consumed fill below; Q125 adopts research cost growth below; Q126 adopts post-victory availability below; Q127 adopts a rank-45 limit below. Keep delivered Stone progress accounted for; do not silently remove or refund prior deliveries during a price/rank change. Update the remaining-fill display and accepted deliveries consistently with the chosen formula.

Current source consumes one Stone per fill unit. Holes from depleted deposits currently start at 250 units; generated holes derive their requirement from size and map tier. The new line should respect those distinct base requirements unless a later decision explicitly changes them. This is not a new blanket 250-Stone cost for every hole.

**Q123 adopted November 3, 2026:** the user selects option 2, a **20% compounded Stone reduction per rank**. For an unstarted hole, total Stone = **max(1, ceil(original Stone requirement × 0.8^rank))**. Recalculate from the original base rather than discounting an already rounded prior bill. A 250-Stone example costs **200 / 160 / 128 Stone** at ranks one/two/three. The ten-percent option was not selected.

The minimum applies to the hole's total bill, not to any balance after already-consumed Stone is credited. Use mathematically consistent upward rounding: 250 × 0.8² is exactly 160, not 161 from floating-point noise. Natural/depletion holes retain their distinct original bases. Q125 settles research prices/growth and Q124 existing partial progress below; Q126 settles availability below; Q127 settles the cap below; the numeric effect is adopted design, not implemented or measured payback.

### Adopted partial-fill treatment (Q124, November 3, 2026)

The user selects option 1: recalculate the discounted **whole-hole total** and credit every Stone already consumed as fill: remaining = **max(0, discounted total − consumed fill)**. For an original 250-Stone hole with 100 consumed, rank one lowers the total to 200, leaving **100 more Stone**. If consumed fill already meets/exceeds the new bill, mark the hole ready for its normal clearing step; do not refund consumed Stone or silently remove the hole.

The remaining-balance-only alternative was not selected. Keep the credited fill cumulative across research ranks and further deliveries; the total discount is always recalculated from the original requirement, not an already rounded balance. Clearly distinguish consumed fill from unused buffered/in-flight Stone, and preserve the latter through research/clearing rather than counting it as both stock and paid progress.

Persist/recover each hole's original requirement and credited fill to implement this adopted policy. Legacy saves may retain only remaining fill; if the original/consumed amounts cannot be reconstructed reliably, define an explicit progress-preserving migration fallback rather than inventing a refund or discarding progress.

### Adopted Efficient Landfill research prices (Q125, November 3, 2026)

The user selects option 1, matching regeneration’s all-seven-Core ladder: rank r costs **ceil(1.5^(r − 1)) of each Core type, Simple through Final**, giving **1 / 2 / 3 / 4 / 6 each** for the first five ranks. Recompute each rank from the original base, independently rounding up. Each research consumption set includes all seven required types together.

The linear-price alternative was not selected. The first five bills total **7 / 14 / 21 / 28 / 42 physical Cores**, including **1 / 2 / 3 / 4 / 6 Final Cores**. This adopts Landfill’s price only; it does not import regeneration’s unlock or unlimited-rank rule. Q126 adopts Landfill availability below; Q127 cap is adopted below; actual material/space payback remains unvalidated.

### Adopted Efficient Landfill availability (Q126, November 3, 2026)

The user selects option 1: first-rank availability follows **completed victory research**. No additional ordinary research project is required. The pre-victory first-Final-Core alternative was not selected. This gates the discounted-fill research, not the ordinary ability to fill and clear holes.

Victory means the one-time project’s recorded completion, not notice acknowledgement. Research still requires explicit selection/payment; victory does not buy a rank automatically. Global Storage/Inventory research retains its separate first-production gate. Regeneration retains its own additional Mineral Regeneration 2 requirement; this decision applies only to Efficient Landfill.

### Adopted maximum Landfill rank (Q127, November 3, 2026)

The user selects option 1: stop at **rank 45**, when every hole within current normal content's maximum original requirement can cost one Stone. Current generated holes are bounded by **20,000 Stone**; depletion holes start at 250. With exact upward rounding, a 20,000-Stone hole needs **two Stone at rank 44**, **one at rank 45**, and still one at rank 46. Do not offer the next purchase after the chosen final beneficial rank.

The ten-rank alternative was not selected. At completed rank 45, stop offering another purchase and show this line as completed; no rank 46 is available. Rank 45 is a content-bound upper limit, not a pacing target; the steep approved price curve and actual material/space payback still need validation. Revisit the limit if content adds larger original hole requirements, preserving completed ranks and the one-Stone floor.

Regeneration's unlimited-rank policy is separate. Ordinary Stone filling remains available before either project; Q126 only gates this research's first rank. Validate legacy/custom hole requirements rather than assuming all saved values share the current generator maximum.

### One updating entry for recurring endgame research (Q127 additional direction)

The user requests **one Research-tab entry per recurring endgame line**. Show its current purchasable/in-progress level and quoted cost; only advance that same entry to the next level and price after completion. Do not display separate locked future-level rows or leave a trail of one entry per completed level. At a cap, show one final completed entry rather than a next purchase.

Apply the pattern to Landfill, regeneration, Train capacity, the endgame global Storage/Inventory recurring lines and finite advanced Road-channel levels. This does not adopt any unselected research candidate. See [research interface requirements](05-interface-and-learning.md) for level/progress examples and integration checks. The existing repeatable project-ID/completion-counter pattern provides a baseline; these future lines still need implementation.

## Forest-inclusive resource regeneration

The user adds repeatable endgame research increasing resource-node regeneration, **including Forests**. The benefit direction and Forest coverage are adopted. Q119 adopts +100% of the ordinary-researched passive rate per rank; Q120 adopts all-seven-Core pricing below; Q121 adopts victory completion plus Mineral Regeneration 2 for access; Q122 adopts no maximum rank.

Current Forests naturally restore one Wood per 30 seconds up to capacity. Existing Mineral Regeneration/2 restores finite mineral stocks at one unit per 30/15 seconds after the relevant unlocks; Mineral Regeneration Rate then adds 20% of its base rate per rank and explicitly excludes Forests in current runtime. The new direction must cover both resource-node families rather than inheriting that exclusion.

Apply regeneration to depleted resource stock up to the existing node capacity. This does not itself increase storage capacity or Extractor speed, create new deposits, refill instantly, change Dwarven Tribute production, or directly supply Grove progress. Infinite reserves/Lakes do not gain extra finite stock from faster regeneration. The previously adopted paid Tree Planter output/delivery and upkeep remain separate; future costing must show any benefits of passive regrowth explicitly rather than silently changing the standard paid-forestry reference.

**Q117 adopted November 3, 2026:** the user selects option 1: a **new repeatable Final-Core regeneration line alongside existing mineral research**. It includes Forests; the existing mineral-only projects and completed ranks retain their earlier role. Do not replace or rename their serialized IDs, remove paid effects, or silently grant the new endgame benefit through the old project. The new project uses Final Cores; Q119 bonus/stacking is adopted below; Q120 adopts exact base/growth and all-seven-Core composition below; Q121 prerequisites are adopted below; Q122 adopts no maximum rank.

Validate rank progress/save-load, existing Forest/mineral differences, full-capacity pause, continued extraction and elapsed regeneration credit. Account for actually available researched regeneration in the hidden expansion-solvability model. Forest renewal does not reinstate Wood rescue or the canceled Wood Golem.

## Adopted regeneration rank effect (Q119, November 3, 2026)

The user selects option 1: each rank adds **100% of the current passive rate after ordinary research**. Effective rate = ordinary-researched rate × **(1 + endgame rank)**. Rank one/two/three give **2×/3×/4×** that baseline. Endgame ranks add from the same baseline; they do not compound rank to rank. This is adopted design, with runtime and measured balance still pending.

For Forests, whose ordinary passive rate is two Wood/minute, the adopted effect gives four/six/eight Wood/minute at ranks one/two/three while depleted. For minerals, first apply the existing unlocks/rate ranks, then the adopted endgame factor. Recompute the ordinary baseline from current earlier research rather than taking a snapshot when the first endgame rank is purchased.

The +50% alternative was not selected. Keep node capacity, paid Tree Planter output and direct Grove progress separate. Q120 prices are adopted below; Q121 availability is adopted below; Q122 adopts no maximum rank; actual factory payback remains to validate.

## Adopted regeneration research prices (Q120, November 3, 2026)

The user selects option 1: first rank costs **one of every Core type, Simple through Final**, with later per-Core prices **ceil(1.5^(rank − 1))**. Ranks one through five cost **1 / 2 / 3 / 4 / 6 of each of the seven Core types**. This keeps earlier Core factories part of the continued research network. These values apply to this regeneration line; other endgame research prices are not implied.

The Final-Cores-only alternative was not selected. Use **1.5× growth from the unrounded base**, rounding each rank up independently; do not multiply an already rounded previous price. The first five bills contain 7/14/21/28/42 physical Cores in total, including 1/2/3/4/6 Final Cores. Consume each required seven-Core set together under ordinary Research Center rules; a missing type stalls progress. Adopted prices are starting balance targets, not measured factory payback.

## Adopted regeneration research availability (Q121, November 3, 2026)

The user selects option 1: require **completed victory research AND Mineral Regeneration 2** before the first endgame regeneration rank becomes available. Victory means the one-time project's recorded completion, not merely producing/delivering a Final Core or dismissing the victory modal.

No earlier Mineral Regeneration Rate repeatable rank is required; those ranks remain optional and still improve the baseline. Subsequent endgame ranks follow completion of the preceding rank. Preserve the earlier mineral projects and ordinary prerequisites. Global Storage/Inventory access research remains available after first Final Core production under Q11A, independently of this regeneration gate. This decision does not impose victory on the other endgame projects.

## Adopted unlimited regeneration ranks (Q122, November 3, 2026)

The user selects option 1: **no maximum rank**. Continue the adopted linear regeneration benefit and exponentially increasing all-seven-Core prices indefinitely. Each additional rank adds the same ordinary-researched baseline rate; each rank's price is recalculated from the original base using the adopted formula.

The ten-rank cap was not selected. Preserve node capacity and separate paid Tree Planter/Grove mechanics. Resource, extraction, transport and actual factory payback remain to validate; an uncapped research counter is not a promise of unconstrained delivered production. Implementation must handle large rank/cost displays and regeneration increments consistently without adding an unapproved gameplay cap.

## Other useful candidates — deferred by Q144

| Candidate | New player option | Considerations |
| --- | --- | --- |
| Priority Overflow Routing | Configure a preferred destination and a fallback when it cannot accept more | Particularly useful after filtering waste: recycle first, divert surplus toward Reclamation. Preserve the required mixed-output filtering and whole-Filter blockage rules; add no processing delay |
| Global Pool Item Capacity | Increase the shared pool's per-item storage ceiling | Already an older proposal; pairs naturally with existing global placement/connection research. Gain per rank and Final-Core bill remain open |
| Bulk Retrofitting | Apply compatible recipe/filter settings across a selected group of machines | Extends management of large factories rather than duplicating existing Blueprint placement. Preserve active batches, stock and individual eligibility |
| Factory Telemetry | World-scale production/demand comparisons and bottleneck summaries | Adds an advanced planning view; basic shortage/blockage information remains available without this research |
| Compact Installations | Reduce eligible Production-node footprints to fit denser factories | Creates new layout opportunities after the original geographic constraints have mattered. Needs clear ports, collision checks and migration behavior |
| Research Automation | Repeat selected research toward a target rank with a player-set Core reserve | Helps continued optimization while controlling spending. Does not silently select victory research or spend protected stock |

Earlier recommendations favored Priority Overflow Routing and Global Pool Item Capacity. Q144 defers all six extra candidates until initial endgame playtesting; none is adopted for implementation. Automatic Inventory Selection remains an older unadopted candidate and needs reconciliation with the mandatory filtering role.

## Technical and verification work after design

World-node movement is currently disabled by static kind-based controls. Implement research-aware eligibility consistently in individual drag, group moves, collision previews, movement commands, undo and save/load. Do not mutate a global kind definition based on a single world's completed research or accidentally allow copying protected world features through Blueprints/duplication.

Verify each one-time project unlocks only its intended feature set. Test that resource quantities, regeneration and finite/infinite status survive a move; Lake geometry and attached intakes behave consistently; camp pressure, AP credit, Tribute stock and timers persist; blocked/invalid moves leave the world unchanged; and load/undo retains ownership and locations. Verify moves cannot transfer a feature into another map; cross-map conservation/route work would require a separate future decision.

For Efficient Landfill, test the chosen rank/cost/reduction boundaries, rounding/minimum, natural versus depletion-hole bases, partial progress, excess arriving Stone and old/new saves. Q123 fixes the 20% reduction and one-Stone floor; Q124 credits consumed fill against the new total; Q125 prices/growth are adopted; Q126 availability and Q127 cap 45 are adopted.

Sources: [world controls](../../src/content/nodeModules.ts), [movement and hole handling](../../src/simulation/engine.ts), [generated holes](../../src/simulation/worldGeneration.ts), [Final Core and research inventory](15-final-core-victory-and-postgame.md). Source inspection only; no game code or balance run changed.


Transfer scope clarification after Q116: within-map quantity increases are confirmed; Q116A now adopts matching inter-map Road batches of 1/2/4 every five seconds. See [transport design](18-endgame-transport-research.md).


Vehicle research clarification: throughput improvements also belong to ordinary Cart → Truck → Train progression, before endgame research; later repeatable Train research continues them. [Transport requirements](18-endgame-transport-research.md) records Q118 adopted local amounts. Q117 adopts a separate Final-Core line; Q119 bonus/stacking is adopted; Q120 prices are adopted; Q121 availability is adopted; Q122 adopts no maximum rank.


Q116A/Q116 resolved: inter-map Roads now have adopted design batches of up to 1/2/4 items for Cart/Truck/Train every 5,000 ms (12/24/48 items/minute theoretical per Road). Q118 local 400 ms launches and 1,000 ms travel stay distinct. Source/receiver availability constrains delivery; neither change is implemented yet. Q117 adopts a separate Final-Core line; Q119 rank bonus is adopted; Q120 prices are adopted; Q121 availability remains open.

## Adopted QoL deferral and review closeout (Q144, November 4, 2026)

This is the final question in the bounded endgame design pass. The user selects option 1: keep the adopted research portfolio as the current scope and defer additional QoL candidates until an initial endgame playtest identifies a need. Alternatives: put only Priority Overflow Routing and Global Pool Item Capacity in the follow-up design backlog, or retain all six candidates there (also Bulk Retrofitting, Factory Telemetry, Compact Installations and Research Automation). The two follow-up-backlog alternatives were not selected. This design interview is complete. Automatic Inventory Selection remains an older, separate unadopted candidate.

A follow-up backlog entry is not an implemented system or authorization for an unreviewed price/effect. No extra candidate-pricing interview will be appended to this pass. Preserve the already adopted projects, free basic diagnostic information and Inventory-to-Filter rule. Waste calibration waits for representative factory output; victory-copy review remains deferred. Closing this interview does not certify balance or complete runtime implementation.
