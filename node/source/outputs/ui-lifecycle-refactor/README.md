# UI and state lifecycle refactor evidence

Supporting evidence for the [standalone plan](../../docs/master-plan/07-technical-design.md#standalone-code-organization-refactor-plan). Phases 4 and 5 are complete locally (NODE-0829, NODE-0831). All six standalone plan phases are complete. No publication or campaign-save access.

## Phase 4 boundaries and verification

Panel return/navigation state moved to useFactoryPanels; the original factory keyboard effect moved to useFactoryKeyboard. Dialog, dialogFocus and factoryKeyboard remain policy owners. App retains subscriptions, timing, JSX visibility and hidden Upgrades mounting during recipe visits.

Renderer transient input state and pointer/keyboard handlers moved to playfieldInteractions. Live props/scene getters preserve engine replacement and camera transforms. PixiPlayfield retains drawing, node display listeners, camera geometry and render/ticker cadence. PlayfieldResources gives registrations exactly-once disposal, including application initialization rejection and unmount while pending. The only intended behavior correction is prompt cleanup of partial startup resources; no gameplay rule changes.

Focused coverage: 494 tests passed. Full workspace: 2,405 passed, one existing skip, no failures; includes preserved release copies. TypeScript and local production build passed (existing large-chunk advisory). Eight resource and four interaction regressions cover startup/disposal, exact captured listener removal, semantic sockets/current camera, current callbacks, cancel-without-commit, detached listeners and paste capture ordering. Raw JSON/logs are retained here.

The isolated production FactoryApp fixture uses two paused synthetic factories, autosave disabled, and author controls for snapshot replacement/engine swap/mounting. [DOM observations](browser-observations.json) verify wiring, input rerouting, movement/Undo, zoom/pan, Road double-click travel, replacement, input on the new engine and teardown. Subscriptions change from [3,0] to [0,3] on swap and [0,0] on unmount; canvas count changes 1 → 0 → 1. No browser console errors observed. Recipes returns to its Options opener. Core recipe return restores the exact Upgrades opener and preserves a hidden Kiln search. Delete/Undo remain blocked in Recipes. Tab reaches recipe controls. Socket click/Escape cancellation is checked; pointercancel/blur cancellation is covered automatically. This is functional evidence, not a normal campaign or balance run.

## Serial active-factory comparison

Built versions, one browser/host, 1280×720; standard 600-node/831-connection map, Fit all, zoom .15, camera x225.99408411979675/y151.41607093811035, distant details off, progress emphasis on. Five-second warmup and uninterrupted 25-second window, no tests/builds during sampling. Phase 0 frozen build is reused, then current Phase 4; repeated in reverse order after a slower first candidate.

| Sample order | Build | Average FPS | Frame p95 ms | Tick p95 ms | Frames >33.4 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Phase 0 | 75.44 | 16.8 | 4.4 | 0 |
| 2 | Phase 4 | 61.20 | 25.1 | 5.3 | 6 |
| 3 | Phase 4 repeat | 60.16 | 25.1 | 5.4 | 6 |
| 4 | Phase 0 repeat | 59.68 | 25.0 | 4.9 | 3 |

The reverse-order pair is similar, so these samples do not establish a consistent refactor performance regression or improvement. Host variation limits the first pair. All samples retain 600 nodes, 24 cable chunks, 13 overview textures and 64 pooled particle objects, with no destroyed nodes. These observations do not close whole-world performance SR-20 or establish universal FPS. Raw perf-phase*.json retains metrics.

## Checkpoint and preservation

The root is not a Git checkout. baseline-manifest.json captures 626 fingerprints and 397 recoverable snapshots, including the complete pre-phase-4 src tree. Never rerun checkpoint.mjs over it. Compare current files and restore only this work's own hunks; concurrent music/audio/tooling/style/history changes are preserved. No dependency upgrades or release-checkout edits.

## Phase 5 lifecycle review and verification

Line-by-line comparison retained the separate engine sequences documented in [architecture](../../docs/systems/architecture-and-simulation.md#state-and-mutation). Only initializeStateCollections (constructor/replacement defaults plus existing upgrade migration) and retainUndoKnowledge moved to stateLifecycle. These are stateless operations on the supplied current owned state/snapshot, with no retained engine, cache or catalog. Full normalizeExtractorCycles remains engine orchestration: moving it would require callbacks for existing migration, cable refunds, obstruction cleanup and layout rules without a useful new policy boundary. New-game creation already has createInitialState; tutorial creation/restart keeps authored state and autosave-disabled/new-engine or replacement behavior. No generic reset, format, storage key or rule change.

Constructor still evaluates milestones after full normalization. Replacement keeps names both before defaults and after normalization, active-clock reset, research/Forest reconciliation, history clear and publication. Undo only carries its existing learned-knowledge/depletion state, handles the developer map-reveal exception, then restores progression/Cart/names/milestones and publishes. Mod application retains early validation/checkpoint/grid rules, migration/layout/names/Cart/names order, quote cleanup and transfer accumulator reset. Autosave failure, clock, accumulated timing, clipboard and identity-based transport caches retain their original lifetimes.

Five new engine boundary regressions passed against the pre-extraction implementation and the final implementation: missing collections/source isolation/history clear; ordinary knowledge/depletion retention; developer reveal exception; invalid mod validation/history/catalog behavior; realtime replacement/Undo clock reset. The focused persistence/mod/research/template/Road/Landmark/terrain suites pass 250 tests. The final workspace suite passes **2,411 tests, one existing skip, no failures**, across 239 test files, including preserved release test copies. Existing save/export/autosave retry and research queue/payment tests remain included. TypeScript and production build pass with the existing large-chunk advisory.

[Original-source comparison](lifecycle-comparison.json) builds the complete pre-phase-4 src snapshot and final candidate separately, controls IDs/time/randomness, and compares public results, whole-state SHA-256 hashes and publication order. Ordinary/Road/protected-Landmark-and-template/modded scenarios match **148 steps and 94 publications**. Each also replaces fresh and missing-collection legacy worlds, normalizes a file-shaped snapshot, replaces a modded world, performs commands/Undo, removes/restores its mod and compares autosave failure through replacement and successful retry/storage. This proves equivalence for declared deterministic scenarios, not every possible save.

The final built browser fixture repeats snapshot replacement, engine swap, real socket wiring and keyboard Undo on the replacement engine, then unmount/remount. [Final observations](browser-final-observations.json) retain one canvas and three subscriptions only on the current engine, zero on old/unmounted engines and no observed console errors. [Final screenshot](browser-final.jpg) shows the remounted fixture. Pending-init/startup rejection and pointercancel/blur paths are automated rather than forced in the browser. The ninth resource test preserves the original startup error even if partial cleanup also throws, while disposing earlier registrations.

## Final dependency map

| Responsibility | Owner | Boundary retained |
| --- | --- | --- |
| Tick, command commits, history and lifecycle policy | GameEngine | Existing facade, checkpoint, publication and catalog order |
| Research / templates / Road directions | Existing ResearchRuntime / FactoryTemplateRuntime / RoadCommandRuntime | Current-state getters and narrow transaction callbacks |
| Delivery/refunds/reservations/local launches | TransportRuntime, roadTransport, SimulationLookups | Phase-scoped lookups, existing Road timing and cable-object fairness |
| Read-only command planning | NodePlacementPlanner / NodeMovementPlanner / ConnectionPlanner; nodeDeletion and controlGroups | No retained plan/state; engine commits immediately |
| New world / shared lifecycle operations | createInitialState / stateLifecycle | Separate new/load/Undo/mod sequences; no new snapshot format |
| Panels and shortcuts | useFactoryPanels / useFactoryKeyboard | Dialog/focus/shortcut policy reused; App owns subscriptions and visibility |
| Input gestures | playfieldInteractions | Current props/engine/scene/camera; semantic sockets and capture order |
| Drawing and mount disposal | PixiPlayfield / PlayfieldResources | Existing cadence, textures and display owners; explicit release paths |

Current system references and plan are updated. Generated catalogs/local links and history are checked. No player-facing copy/style edits, dependency upgrades, campaign save access, release-checkout writes, commit or publication. Concurrent music/audio/tooling/style/history work remains preserved. Performance remains the scoped Phase 4 comparison above; no universal improvement or whole-world claim.
