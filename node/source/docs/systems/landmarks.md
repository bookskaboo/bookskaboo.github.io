# Landmarks

[System index](README.md) · [Design decisions](../master-plan/23-map-power-ups.md)

New standard 11×11 campaigns contain seventeen permanent Production landmarks, assigned by the world seed. Existing saves never opt in automatically, including their unexplored sectors. Larger worlds and training use their existing rules without this landmark layout.

## Catalogue

| Landmark | Count | Operation |
| --- | ---: | --- |
| Rapid machines | 6 | Two Refiners, two Smelters, one Assembler and one Fabricator. Fixed family; ordinary ingredients and yields; 10% base recipe time. Speed research does not stack. |
| Tri Extractor | 6 | One shared ordinary five-second extraction cycle consumes one reserve unit and adds one identical item to each of three independent five-item output buffers. Ordinary Extractor upgrades apply. Any full branch pauses the shared cycle. |
| Doubler | 3 | One Refiner, one Assembler and one Fabricator. Ordinary ingredients, cycle times and family speed upgrades; double every resolved output, including waste. |
| Reclaimer | 1 | Ordinary unlocked Recycler recipes with no Water socket, buffer or ingredient cost. Fixed 25% base cycle time; Recycler speed research does not stack. |
| Unknown Device | 1 | Accepts any of the seven Core tiers. Consumes the oldest waiting Core and produces two of its tier after a fixed five seconds. No recipe, original ingredient bill or speed upgrades. |

All landmark nodes use purple (`#b584ef`) except Unknown Device, which uses pink (`#f29ac2`). The current node sizes, title typography, item/socket colors and status meanings are retained. Recipe landmarks require their ordinary machine and recipe unlocks, but have no construction, activation or repair bill. Unknown Device only needs a supplied Core.

## Distribution and discovery

| Manhattan distance from Home | Landmarks | Types |
| --- | ---: | --- |
| 1–2 | 2 | One Rapid Refiner in a random clear cardinal neighbor of Home; one Tri Extractor |
| 3–4 | 5 | Two Rapid machines, two Tri Extractors, one Doubler |
| 5–6 | 5 | One Rapid machine, two Tri Extractors, one Doubler, Reclaimer |
| 7–9 | 5 | Two Rapid machines, one Tri Extractor, one Doubler, Unknown Device at tier 8 only |

Home and the four tier-10 corners are excluded. At most one landmark occupies a sector: seventeen of 116 nominal eligible sectors, or 14.7%. Remaining Rapid and Doubler families shuffle across their slots by seed. A separate random stream preserves ordinary terrain and encounter randomness. Placement balances quadrants and prefers sectors without an edge-adjacent landmark; resource eligibility, early access and valid geometry take priority over those soft preferences.

Generation saves the initial landmark-sector snapshots before exploration. Each footprint clears existing reserves, full settlement growth, holes, Lakes, Golems and border terrain, with space inside the initial field. Tri Extractors start connected to an eligible ordinary Wood, Stone, Copper or Iron reserve. They cannot extract guarded or Golem reserves. No natural Mythril or new reserve is added.

Before the first visit, a landmark has no marker or anonymous frontier signal. After a visit, the combined **Landmarks** filter and Points of Interest show its name. Unknown Device has no recipe listing, recipe selector, formula or effect explanation in inspector, tooltip or map text. Its inspector shows stored Cores, the active Core, progress and blocked status. Players discover its effect through use.

The early hint, **A useful detour**, points in the actual spawn direction after Exploration. It is an alternative to the primary production goal, retires on visiting the landmark and stops competing with goals after Hydraulic Assembly. It does not reveal the machine or bonus before visiting.

## Stock, batches and routing

Ordinary cable, vehicle and Road rates and upgrades apply. Recipe landmarks retain ordinary input/output capacities. A Doubler resolves each chance roll once, then multiplies the resulting quantities; failures remain zero. Cores, Yin and Yang are excluded from normal Doubler output, including chance products. Every other unlocked fixed-family recipe is eligible, including Brick, bot parts and efficient recipes. The Brick/recycling material loop is intentional.

Two Fabricator recipes produce eight items when doubled. They retain the five-item output buffer: the paid batch finishes, emits items in saved order as room opens and keeps the remaining resolved items in its batch. No new batch starts until those items have entered the output buffer. Loading, pausing and moving do not consume ingredients again or reroll outcomes. This also handles oversized doubled batches without excluding recipes or increasing buffer capacity.

Tri Extractor output stock is allocated to its actual outlet, so a blocked or disconnected branch cannot donate stock to the others. In-flight cargo retains its source outlet for correct refunds. Switching the connected resource type discards all three old buffers; same-resource rewiring preserves stock. Depletion and ordinary reserve regeneration retain their existing behavior. Dev Sources can provide virtual reserves for controlled tests.

Unknown Device has five waiting and five finished Core spaces, each shared across tiers. The consumed active Core is separate. It reserves two free output spaces before consuming the oldest queued Core; with four or five finished Cores it waits without consuming input. Both products enter the output together. Its input/output queues, active Core and partial progress survive save/load, pause, relocation and undo.

## Relocation and compatibility

Landmarks cannot be deleted, sold, copied, duplicated into templates or transferred between Map Nodes. **Resource Relocation** covers every type after victory research. Its existing one-time price remains one of each of the seven Cores; later moves have no fee. Type, bonus, buffers and progress remain intact. Moving a Tri Extractor alone leaves its reserve fixed; explicitly selecting both permits a valid group move.

New worlds save `landmarkVersion: 1` and `landmarkLayout`. Missing/zero versions retain old behavior and never generate landmarks later. Imports validate versions, counts, tier/family allocations, Core identities and branch-buffer state. Existing field expansion centers dormant landmark sectors as a fixed layout rather than rerolling them. Already materialized sectors and player moves are authoritative.

Changing a new world to a larger supported grid disables its unopened landmark layout. Switching back to 11×11 before generating beyond Home restores a seeded layout only for campaigns carrying the new-game landmarkEligible marker; old saves never gain eligibility. Applied world-spawn mods still generate their natural contents normally; unopened standard-grid landmark sectors retain their selected device and use valid placement among the modded contents. If a mod removes every eligible reserve, a Tri Extractor can remain disconnected until a valid source is available. Existing materialized sectors are preserved.

## Implementation and verification

Landmarks are saved properties of ordinary fixed machine kinds, rather than build-menu entries. Unknown Device uses a separate runtime path on its saved instance. Owners: [definitions](../../src/content/landmarks.ts), [placement](../../src/simulation/landmarkGeneration.ts), [world integration](../../src/simulation/worldGeneration.ts), [Unknown Device](../../src/simulation/landmarkRuntime.ts), [batch processing](../../src/simulation/progression.ts), [engine and routing](../../src/simulation/engine.ts), [validation](../../src/simulation/landmarkValidation.ts).

Coverage: [headless engine/generation tests](../../src/simulation/landmarks.test.ts), [presentation contracts](../../src/ui/Landmarks.test.tsx), [generation audit](../../outputs/landmark-implementation/generation-audit.json), [all 29 eligible recipes](../../outputs/landmark-implementation/recipe-audit.json). Controlled synthetic factories use Dev Sources where useful. These checks establish mechanics and compatibility; they do not establish normal-play pacing or a rendered browser color/contrast review. Actual check results belong to the matching changelog record and verification report.
