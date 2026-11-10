# Endgame implementation — November 4, 2026

**Current revision, November 9, 2026.** The Dragon requires 200 AP per α Piece. Final Robotics costs one of each Core and unlocks the parts for the 72 AP Final Bot. Victory is a separate Research Center project.

The Q01–Q144 interview is closed. Q144 defers the six extra QoL candidates until initial endgame playtesting. The user subsequently authorized implementing the agreed work and pushing the local game to Git. This document supersedes earlier statements that these features have no runtime implementation; dated decision logs remain historical evidence.

## Implemented locally

| Area | Delivered behavior |
| --- | --- |
| Four corners | All four challenges occur once in a seeded random corner permutation. Saved corner order and independent assembly partition persist. |
| Ancient Dragon | 200 AP per α Piece. The first piece can use nine Command Bots for 216 AP. Surplus AP carries forward. Full output pauses intake and preserves progress. |
| Ancient Foundry | 50 Circuit B + 25 Sealed Frames + 100 Mythril Gears atomically become one β Piece. One base producer per ingredient needs 500/450/300 seconds. Separate ingredient storage holds the corresponding quantity. |
| Elder Grove | 1,000 supplied growth per γ Piece. Two fully supplied base Tree Planters produce that in 8 minutes 20 seconds. Ten funding batches use 100 Wood, 10 Iron Plates and 10 Stone. Surplus growth carries forward and a full Tribute box pauses intake. |
| Reclamation | Any mix contributes proportional credit. Twenty Metallic Fines, 132 Spent Flux, 72 Glassy Crust or 44 Slag alone produces one δ Piece. Full output preserves stock and progress. |
| Buffers | Ten pieces per corner Tribute box. Dragon, Reclamation and Grove have 100 incoming units total, independently of accumulated progress. Receiving reservations participate in normal routing capacity checks. |
| Final Core | The first piece awarded to a corner Tribute box unlocks the seeded Yin and Yang recipes and the Final Core recipe. Yin and Yang each take ten seconds at base speed. One of each makes a Final Core in thirty seconds at base speed. One of each corner piece is required overall. |
| Final Robotics | After producing a Final Core and completing Command Robotics, pay one of each Core through Final. Select a Final Frame and Final Cannon in Assembler II to make a 72 AP Final Bot in 210 seconds. Three Final Bots deliver 216 AP for a subsequent α Piece. |
| Victory | One manually selected Research Center project consumes five each of Simple, Basic, Automata, Hydro, Shiny, Complex and Final Cores, then records victory and displays the glowing dry-humor modal. Continue preserves the world. Notice acknowledgement is saved separately. Draft wording remains available for later editorial review. |
| Global transport | Access research remains behind first Final Core production, independently of victory; it costs five each of all seven Core types. Separate placement and connection lines use the shared seven-Core 1.5-growth ladder with a five-Core minimum. Inventory destination rules remain intact. |
| Post-victory research | Resource/Lake/camp relocation, exact compounded Landfill discounts, fourth/fifth Road slots, uncapped Train freight ranks and Forest-inclusive regeneration use the adopted prices, prerequisites and caps. Recurring lines have one updating entry. |
| Relocation | Resources include cleared-Golem reserves; living Golems and corner challenges stay fixed. Camps and linked Tribute boxes move together atomically; Lakes leave Intakes in place unless explicitly group-selected. Identity, stock, timers and wiring are retained, with undo and placement validation. |
| Recycler | Hydro-era forty-Core research unlocks a two-second, FIFO Recycler with ten input/output spaces. The forty reviewed manufactured goods use fixed standard constituent types, including fuel Wood, at most one of each solid resource. Basic resource destruction returns nothing; fluids are never recovered and waste is rejected. Unmapped future goods, including new endgame tokens/halves/Final Cores, are deliberately rejected until their constituent policy is specified. |
| Hidden rescue | Internal next-Map-Node shortage checks count paid progress, buffered/global/in-flight/committed output and remaining sources. Proven Iron/Copper/Stone shortages open a shortest route and clear the matching Golem to a usable infinite reserve. One saved notice is handled at a time; Wood is excluded. Distinct rescue history supports Destructive Testing. No budget UI is shown. |

Previously delivered Dwarven Mythril, mixed waste/filtering, paid forestry and ordinary Cart/Truck/Train gains are retained. Concurrent local mod-support work is preserved; the extra Q144 research candidates were not implemented as part of this pass.

## Reclamation quotas — November 8

Each single-material quota is twice its November 5 value. Every item adds the reciprocal of its quota to the same meter. A full meter yields one δ Piece.

| Waste | Items alone | Base reference producer | Production seconds |
| --- | ---: | --- | ---: |
| Metallic Fines | 20 | Controller, one per 30 seconds | 600 |
| Spent Flux | 132 | Efficient Hydro Piston, two per nine seconds | 594 |
| Glassy Crust | 72 | Efficient Mythril Mesh, two per 16 seconds | 576 |
| Slag | 44 | Efficient Circuit C, two per 27 seconds | 594 |

Fractional progress carries; no fractional physical item is consumed. Drain other outputs to sustain the reference producer. Mixed waste, alternative Fines sources and upgrades can finish sooner. Saved normalized Reclamation progress remains intact and revised credits apply to new waste. Legacy Alpha/Grove absolute credit and Foundry overstock are retained without resetting saves. Rate sizing and wired engine tests are not a measured average-factory or normal-play endgame result. See [cost model](12-endgame-component-costs.md) and [waste benchmark](13-recycling-and-waste-benchmark.md).

## Validation and limits

The verification report is [endgame-test-results.json](../../outputs/implementation/endgame-test-results.json). Focused tests cover all seeded partitions, corner payment/blockage/surplus, Recycler conservation, a wired ordinary-Assembler route to Final Core, victory payment/persistence, research prices/caps, vehicle payloads, exact Landfill accounting, relocation and a shortest-route Copper rescue. The full test suite, TypeScript/Vite build and progression analysis are run before Git packaging; final counts and commands are recorded in the change history.

Browser verification was attempted with an isolated no-autosave fixture. Local navigation timed out, and recovery was blocked by Browser Use's URL policy on the generated error page. No alternate control path was used after the policy block. The fixture is retained for manual inspection; visual layout, focus behavior and interactive browser rendering are not certified by the engine tests.

The rescue solver deliberately uses an optimistic resource-cost relaxation and generous stock potential: only failure of that relaxation triggers rescue. It can defer difficult cases rather than incorrectly rescue a repairable factory. It is not an exhaustive integer production planner. Affordable supply alternatives are treated conservatively; custom mods, Dev Sources and tutorials disable automatic rescue because the vanilla proof does not establish their feasibility. Broader simultaneous-deficit/achievement attainability and normal-play rescue coverage still need validation.

Legacy holes without original-price/paid-fill provenance use their saved remaining bill as a best-effort base. New holes track both explicitly. Already consumed Stone is never refunded; unused buffered Stone survives clearing in a salvage Cart. No user save is reset.

Normal-play six-Core throughput, first-ending pacing, Reclamation calibration, human learning, accessibility acceptance and release verification remain separate work. A pushed implementation branch is not a verified live publication.

## Runtime entry points

- [Endgame content and formulas](../../src/content/endgame.ts)
- [Corner and Recycler runtime](../../src/simulation/endgameRuntime.ts)
- [Hidden recovery](../../src/simulation/expansionRescue.ts)
- [Victory and rescue presentation](../../src/ui/components/EndgameNotice.tsx)
- [Focused tests](../../src/simulation/endgame.test.ts)

## Git delivery location

The existing deployment repository is `bookskaboo/bookskaboo.github.io`; the prepared branch is `codex/node-endgame-2026-11-04`. It contains the static NODE build under `node/` and the matching source under `node/source/`, preserving the other games. The working Git checkout is `outputs/endgame-git-worktree`; the older deployment checkout and `D:\Node Game` working copy are preserved. [Delivery manifest](../../outputs/implementation/endgame-delivery-manifest.json) records source hashes and verification. A branch push does not update the live main-branch site.

## Confirmed live publication — November 4, 2026

Following the user’s explicit merge/publish request, main advanced to `eca1c2d99d74c906999f4b95c90575155d4c4f29`. [The live NODE game](https://bookskaboo.github.io/node/) now references the new JavaScript/CSS bundle; all seven directly referenced assets match the tested release by SHA-256. [Publication receipt](../../outputs/implementation/endgame-publication-receipt.json) records the check. Other games were preserved. Browser-interactive QA and normal-play balance limits above remain unchanged.

## Confirmed live publication — November 5, 2026

The user clarifies that the requested Git push was intended to publish the public game. Main now includes the explicit 50-AP / 50–25–100 Foundry / 500-growth corner quotas, retired Endgame Theory, manually researched seven-Core victory and camp Tribute/AP/check feedback. Source/build commit `df69900fd71d89b911057eeb90a1fb0ae63a2824` preserves the newer Chapter 1 main-branch work. `npm run build:site` builds for `/node/`; the live page references `index-GUR7pxZM.js`, and all ten runtime assets match the release by SHA-256. [Publication receipt](../../outputs/camp-feedback-2026-11-05/publication-receipt.json) records the verification. Browser interaction and normal-play pacing remain separate unverified work.
