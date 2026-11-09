# Local implementation status

Updated November 3, 2026 following the request to implement settled plans. This is the current runtime delivery record; earlier planning paragraphs and dated observations describe the state when written. Nothing in this batch was published.

| Workstream | Implemented locally |
| --- | --- |
| Dwarven supply, Q14/Q14A/Q25–31/Q61–70 | Camp, Village and Kingdom upkeep is 6/16/32 AP, five-second Mythril batches are 1/5/12, and capacities are 100/120/288. NODE-0344 through NODE-0346 unified the rates by size on November 8. Mythril-only Tribute, persistent first-production processing milestone, successful surplus AP credit, preservation of insufficient bots, immediate retry after failure, retained Tribute stock and wiring. Upkeep continues at full storage. Existing fifteen-settlement distribution remains. |
| Mythril source restriction and Golem exception | No natural or drill-created Mythril, and no Goblin Mythril generation. Existing unsupported deposits/wiring/cargo are archived in `retiredMythril`; owned stock and earned unlocks remain. The seeded tier-six Mythril Golem requires 20,000 AP; existing damage is credited. Other Golems keep 10,000 AP. |
| Complex waste and alternatives, Q32–60 | Shiny is waste-free. Controllers produce one guaranteed Fines and standard Servo Pistons are clean. Circuit B/C names retain existing item IDs. The two independent research projects cost 25 and 50 of each Core through Complex after NODE-0352 and NODE-0353. Precision Control grants Fines recovery. The higher project adds Flux, Crust and Slag recovery. Saved batches using retired recovery recipes can finish. |
| Mixed output and Filters | One shared product/waste outlet; saved FIFO batches dispatch products then their waste before later batches. Filters have selected/remainder outlets, immediate classification and whole-Filter backpressure with a persistent on-node warning and recovery instructions. Buffered mixed stock also retains order. |
| Forestry, Q78A/Q83–86 | Ten Wood, one Iron Plate and one Stone fund 100 growth. Industrial Forestry costs 25 each Simple through Complex after NODE-0357 and grants tenfold output plus local groups of up to ten. Tree Planter 1 reduces cycle time by 10%. Partial groups, capacity reservations and refunds count individual units. |
| Ordinary vehicle throughput, Q118/Q116A | Cart/Truck/Train local payloads are 1/2/4 at the ordinary 400 ms launch cadence and one-second travel. Cart intake adds no second transport timer. Road payloads are 1/2/4 per five-second dispatch. Partial shipments respect available stock and receiving room. Normal single-material, solid-only Road rules remain. |
| Global access, Q11A | Autonomous Logistics now requires the persistent first-Final-Core production milestone; Endgame Theory no longer depends on global access. The milestone hook exists, but fresh normal games cannot reach it until Final Core production is implemented. Existing completed global-access research is retained. Current placeholder access/placement prices were not redesigned. |

## Remaining implementation

- Recycler and the coupled hidden expansion-solvability/rescue system remain pending as a complete dependency group. No raw-resource destruction node was enabled without its required recovery failsafe. The Recycler's settled formulas and buffers remain in its design document.
- Corner encounters, reclamation calibration, seeded component pairing, Final Core assembly, victory research/modal and post-victory research remain outside this delivered batch. Some formulas are settled, but the complete playable route still has unresolved dependencies and values. The separate victory preview is not runtime integration.
- Four/five Road slots and repeatable Train research are not included; the planning review continues to set their complete access, prices and limits. Later decisions recorded in the parallel planning chat are not automatically runtime changes.
- Guaranteed discovery/reachability rules, sustained six-Core balance evidence, human playtests, audio and accessibility acceptance work remain pending. Existing generation is covered by regression tests; it is not a new reachability/balance certification.

## Persistence boundary

Legacy bags cannot reconstruct the original order of already-mixed stock; migration uses saved queue order where available and serialized material order otherwise. New mixed batches retain exact order. Archived unsupported Mythril sources cannot continue generating supply. This is a best-effort development migration, not a promise that old layouts retain their former throughput or recipes. No saved game was reset for this implementation or visual QA.

## Verification

- Full Vitest suite: **647 passed, one pre-existing skip** across 71 files.
- TypeScript and Vite production build passed; existing large-chunk warning remains.
- `npm run progression` passed and refreshed live analysis. The model explicitly excludes efficient alternatives from its standard-recipe baseline. Its totals are analytical bills, not elapsed gameplay, renewable-support or waste-throughput measurements.
- Isolated browser fixture at `http://127.0.0.1:4177/outputs/implementation/production-qa.html` showed a blocked remainder notification and zero deliveries; connecting the remainder delivered one Controller and one Fines and cleared the notice. Screenshots: [blocked](../../outputs/implementation/filter-blocked.png), [resumed](../../outputs/implementation/filter-resumed.png). The fixture uses no autosave or user save and is development QA, not a balance run. Earlier fixture HMR produced duplicate-root warnings; its root is now retained during HMR, and the final page was checked after reload.
- Local source baseline is retained at `outputs/implementation/pre-plans-2026-11-03.zip`. Publication and a normal-play progression/balance run were not performed.

Authoritative runtime entry points: [reviewed content generator](../../scripts/apply-reviewed-production.mjs), [migration](../../src/simulation/reviewedProductionMigration.ts), [simulation](../../src/simulation/engine.ts), [focused regression checks](../../src/simulation/reviewedProduction.test.ts), [change history](../changelog/index.html).

## Subsequent delivery, November 4

The [endgame implementation report](20-endgame-implementation.md) supersedes the remaining-implementation list above for locally delivered corner/Final Core/victory, Recycler/recovery and endgame research/relocation code. Measurement, conservative-solvability coverage and visual QA limits remain explicit. No live publication is inferred.
