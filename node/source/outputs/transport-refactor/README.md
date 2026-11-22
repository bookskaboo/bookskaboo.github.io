# Transport extraction evidence

Supporting evidence for NODE-0819, Phase 2 of the [authoritative refactor plan](../../docs/master-plan/07-technical-design.md#standalone-code-organization-refactor-plan). Phase 2 is complete locally; Phases 3–5 remain pending. The changelog owns the dated outcome. No commit or publication occurred.

## Checkpoint and scope

[Baseline manifest](baseline-manifest.json) captures 615 existing file fingerprints and 387 recoverable snapshots: the complete 380-file source tree and seven affected documents/history files. The workspace root is not a Git checkout. Existing local work is the starting point, including the Phase 1 owner and other chats' changes. Restore only this stage's own hunks after checking current files; do not replace whole files that another chat has edited. Never rerun `checkpoint.mjs` over the retained checkpoint.

The three reviewable source checkpoints are under `slices/road-dispatch/`, `slices/delivery/` and `slices/local-routing/`. These are buildable source snapshots for the comparison harness, not deployment trees. Builds and generated evidence stay under this output directory. The ordinary `dist/`, publication checkouts and browser campaign storage were not written. Concurrent sound-tooling/style/history changes detected since capture remain preserved and are distinguished in the verification report.

## Final ownership map

| Responsibility | Current owner | Preserved boundary |
| --- | --- | --- |
| Tick and Road cadence/payload loop | GameEngine | Same deliver → simulate → research → recovery → local dispatch → publication order, with existing clocks/checkpoints/autosave |
| Commit one Road item | Existing roadTransport module, new dispatchRoadItem function | Existing Road material/vehicle rules and remote delivery resolver; immediate receiver input plus cosmetic pulses |
| Legacy stored-Road cargo | Existing recoverRoadStock function | Body unchanged; shared readiness/capacity callback |
| Physical deliveries and cancellation/refunds | TransportRuntime | Existing route validation, FIFO reverse-prepend refunds, source-port metadata and cosmetic exclusion |
| Input readiness, capacity and reservations | TransportRuntime | Per-item/shared buffers, Recycler Water separation, bot bucket identity and Unknown Device waiting-space rules stay together |
| Local launch and Filter/Splitter backpressure | TransportRuntime | Existing FIFO selection, batch credit, growth payload, alternating outlets and Extractor fairness |
| Route geometry and material validation | logisticsRoutes, connectionRules, roadMaterials | Existing owners/rules reused; generic-family set moved unchanged from engine to connectionRules for shared use |
| Physical output queues | mixedOutput | Existing takeOutput/returnOutput operations; paid batch/branch identity unchanged |
| Transient indexes | SimulationLookups | Delivery, simulation and local routing retain separate phases and existing launch updates |

TransportRuntime receives three narrow engine capabilities: current-state getter, ID generation and TransferStarted event recording. It imports no engine, UI or renderer. The engine retains private delegates where its production, migration, control and tick paths need transport operations. RoadCommandRuntime still calls the engine cancellation capability; that delegate reaches the transport owner. No mutation policy was made public on the engine.

The getter reads the engine's current state directly, preserving existing mod activation boundaries rather than adding catalog activation to each capacity lookup. No owner retains a factory/node snapshot. The original Extractor dispatch WeakMap moved with local routing, keyed by actual Connection objects. Its lifetime remains the engine lifetime: cloned replacement/Undo cables get new keys; ordinary edits/mod application keep existing objects and their history. No new cache, clearing policy, persisted field or index algorithm was added.

## Verification

[verification.json](verification.json) contains actual counts, preservation checks and limits. [verify.mjs](verify.mjs) checks all fourteen extracted method bodies with only explicit state/ID/resolver bindings allowed; the rest of the engine, including tick, production, lifecycle and command bodies, remains unchanged. Legacy Road recovery is verbatim. The only existing engine test change is the Forest input-gate case. Other captured source is unchanged except engine.ts, roadTransport.ts and the shared-family export in connectionRules.ts; transportRuntime.ts and its lifecycle test are additions.

| Check | Result and evidence |
| --- | --- |
| Fresh baseline workspace | [Report](baseline-tests.json): 2,383 passed, one existing skip; 1,587 current-tree and 796 preserved-release passes |
| Road dispatch slice | [Focused report](slice-road-tests.json): 205 passed across 17 discovered files; [original comparison](road-dispatch-comparison.json) |
| Delivery/refund slice | [Focused report](slice-delivery-tests.json): 308 passed across 28 discovered files; [original comparison](delivery-comparison.json) |
| Local routing slice | [Focused report](slice-local-tests.json): 308 passed across 28 discovered files; [original comparison](local-routing-comparison.json) |
| New lifecycle contracts before delivery extraction | [Report](contracts-before.json): three passed |
| Engine/lifecycle contracts with captured original engine | [Report](original-facade-tests.json): 61 current tests passed |
| Engine/lifecycle contracts with candidate | [Report](facade-tests.json): 116 passed, including 61 current tests and 55 preserved-copy tests |
| Final workspace | [Report](final-tests.json): 2,386 passed, zero failed, one existing skip across 235 files; 1,590 current-tree and 796 preserved-release passes |
| TypeScript and local production build | [Baseline](baseline-build.log), [final](final-build.log); existing large-chunk warning retained |
| Catalogs/local links and history | [Baseline catalogs](baseline-systems.log), [baseline history](baseline-history.log); [final catalog generation](final-systems-generate.log), [final catalog checks](final-systems.log), [final history generation](final-history-generate.log), [final history checks](final-history.log) |

Focused tests cover Roads, routing, Extractor stock, Landmarks/Unknown Device, bot assembly and mods, plus the new lifecycle cases and architecture checks. The workspace command is `npm test -- --maxWorkers=4 --testTimeout=15000 --reporter=json --outputFile=...`; its unchanged discovery includes preserved release copies under `.artifact-work/`, reported separately. Build commands use `npm run build -- --outDir outputs/transport-refactor/...`.

The first full run passed 2,385 tests and failed one existing regression because it called the private `engine.accepts` helper after that helper moved. [Original failure](first-full-tests.json) and [log](first-full-tests.log) are retained. The Forest gate test now checks real Forest Growth launches before/after research. It passes against both the captured original engine and the candidate; no gameplay rule was changed to satisfy it.

## Original-engine comparisons

[compare.mjs](compare.mjs) builds each frozen slice separately against the captured complete original source tree. [compare-worker.ts](compare-worker.ts) uses deterministic IDs, wall clock and randomness, 100 ms tick deltas and 350 ticks per case. This is a regression harness, not normal-play timing or a revived supported benchmark.

Each slice has nine case pairs: fresh, Shiny and late historical factory copies; controlled active/blocked/idle factories; and those three controlled factories with cancellation, Undo, replacement, mod timing, Road reversal and Undo. Each pair matches **3,180 complete state digests and 763 publication-state digests**. Across three slices, this is 9,540 state and 2,289 publication comparisons. Raw original/candidate sequences are retained as `*-original.json` and `*-candidate.json`. Historical JSON factories are read-only inputs; no campaign save was loaded in a browser.

Controlled cases additionally assert physical material conservation, empty Road inventories and shared receiver reservation limits after each step. The active ordinary case checks FIFO launch/receipt order, sustained Road delivery and full reservation pressure. Existing Landmark tests cover Tri Extractor source outlets, Unknown Device active/queued Cores and paid Doubler output; the normal workspace tests cover grouped Forest Growth, bot AP buckets, obstruction paths and mod timing.

These checks establish scoped behavior preservation on declared workloads, not universal correctness, normal-play balance, a speedup, browser FPS, mobile comfort or closure of the open multi-map performance requirement. Phase 0's renderer baseline remains separate. Phases 3–5 require their own authorized work and verification.
