# Road command pilot evidence

Supporting evidence for NODE-0817 and the [authoritative refactor plan](../../docs/master-plan/07-technical-design.md#standalone-code-organization-refactor-plan). Phases 0 and 1 are complete locally; Phases 2–5 are pending. The changelog owns the dated outcome. No publication or campaign-save access occurred.

## Checkpoint and preservation

The workspace root is not a Git checkout. [Baseline manifest](baseline-manifest.json) captures 613 existing source, tooling, documentation and configuration fingerprints plus eight recoverable file snapshots in `baseline/`. These include other chats' already completed local work; they are the starting point, not changes to revert. Tests also discover preserved release source under `.artifact-work/node-release-2026-11-08/`; these are included in reported workspace totals.

Independent concurrent changes to sound-building/checking scripts, audio planning, style references and generated history were detected during this work and preserved. NODE-0816 belongs to that sound change; the pilot uses NODE-0817. The verification report distinguishes source preservation from other files changed since capture; it does not attribute all workspace changes to this pilot.

To recover this stage, compare current files with the snapshots and restore only this stage's changed hunks. Do not overwrite whole current files when another chat has edited them. The Road command owner and its regression file are additions. Build output is isolated here; the ordinary `dist/` and deployment checkouts were not written. Do not rerun `checkpoint.mjs` over this checkpoint.

## Dependency and ownership map

| Boundary | Owner and dependencies | Pilot treatment |
| --- | --- | --- |
| Road controls | PixiPlayfield node action → FactoryApp callback; NodeInspector reverse action; RoadFlowPanel error/status display → GameEngine facade | Existing callers and messages retained |
| Direction transaction | GameEngine facade → RoadCommandRuntime → node capabilities and domain types | Only the three cohesive direction methods moved; no engine/UI/renderer import back into the owner |
| State and transaction capabilities | Engine current-state getter; private checkpoint, cancelTransfers and publish callbacks | Four narrow capabilities; no retained factory/node object, cache, whole-engine context or newly public mutation method |
| Physical refunds | Engine cancelTransfers → mixedOutput.returnOutput | Existing reverse traversal/FIFO reconstruction, source-port refund and cosmetic exclusion retained |
| Placement and movement | roadPlacement, engine placement/move transactions, shared border permissions | Untouched |
| Material and local routing | roadMaterials, connectionMaterials, connectionRules, logisticsRoutes, SimulationLookups | Untouched; no new validator or index |
| Dispatch and tick orchestration | Engine transport/delivery/reservation helpers and existing tick sequence | Untouched; Phase 2 remains pending |
| Travel | domain/roadNavigation → engine camera/travel → UI and renderer controls | Stricter travel validation stays separate from reversal compatibility |
| Research and templates | ResearchRuntime and FactoryTemplateRuntime already use current-state getters | Reused pattern; owners and shared nodeLayoutCopy reset unchanged |
| UI and renderer lifetime | FactoryApp panel/keyboard coordination; Dialog/dialogFocus/factoryKeyboard; PixiPlayfield with scene/socket/camera/resource modules | No extraction here; Phases 4 and 5 need their own checks |

The pilot has four small injected capabilities for one pair transaction; it does not duplicate placement/material/transport rules. The engine facade remains recognizable. The owner imports only content capabilities and domain types, so there is no new dependency cycle. The [three method bodies](../../src/simulation/roadCommandRuntime.ts) match the captured engine bodies verbatim. Getter-based state access is the only new ownership mechanism.

## Preserved contracts

- Public method signatures, booleans and validation strings; invalid directions and missing/conflicting pairs reject without mutation, publication or checkpoint.
- Existing-direction success is a no-op. Older pairs without optional reciprocal fields can still reverse even when travel is unavailable.
- A real change checkpoints once, cancels/refunds each endpoint's transfers before its cables are removed, swaps buffers only for changed modes, resets both progress values and publishes once after both endpoints finish.
- Refund quantities, mixed FIFO stock, Tri Extractor source outlets, cosmetic exclusion and unrelated cargo order remain intact. Undo restores the pre-command snapshot.
- Calls after Undo or replaceState read current state and the current active sector. Replacement still clears old history. No retained state requires lifecycle invalidation.
- Save fields/IDs, history cap, simulation order/clocks, inactive maps, paid batches, world/terrain/Landmark markers, shared fresh-layout reset and existing mod behavior remain unchanged.

## Verification

Actual commands, counts, preservation results and limits are in [verification.json](verification.json). Raw JSON reports and logs are retained alongside it.

| Check | Evidence |
| --- | --- |
| Baseline workspace tests | [JSON](baseline-tests.json), [log](baseline-tests.log): 2,372 passed, one existing skip; 1,576 current-tree and 796 preserved-copy passes |
| New facade contracts against original engine | [JSON](contracts-before.json): eleven passed before extraction |
| Focused Road/routing/architecture checks after extraction | [JSON](focused-tests.json): 191 passed across 18 discovered files, including matching preserved copies |
| Final workspace tests | [JSON](final-tests.json), [log](final-tests.log) |
| TypeScript and production builds | [Baseline](baseline-build.log), [final](final-build.log); both use an isolated output directory |
| Baseline docs/history checks | [Catalogs/links](baseline-systems.log), [history](baseline-history.log) |
| Final regenerated catalogs/history | [Catalog regeneration](final-systems-generate.log), [catalog check](final-systems.log), [history generation](final-history-generate.log), [history check](final-history.log) |

Baseline and final workspace commands use `npm test -- --maxWorkers=4 --testTimeout=15000 --reporter=json --outputFile=...`; this explicitly includes the preserved release copies under the existing Vitest discovery rules. Focused tests use the eleven listed Road/routing/architecture paths and four workers. Eleven new contract cases cover previously uncovered extraction boundaries rather than test the delegation implementation. Both builds use `npm run build -- --outDir outputs/road-command-refactor/...` and retain the existing large-chunk warning.

## Renderer comparison baseline

[Raw sample](baseline-browser.json) and [paused screenshot](baseline-browser.jpg) retain a frozen Vite production build of the existing active-factory fixture in `baseline-fixture/`. Start that build with `npx vite preview --outDir outputs/road-command-refactor/baseline-fixture --host 127.0.0.1 --port 4186 --strictPort` and open `http://127.0.0.1:4186/?layout=standard&nodes=600&sampleSeconds=25`. Use a 1,280 × 720 CSS-pixel viewport and **Fit all**; the captured camera is 15% zoom, x=225.99408411979675, y=151.41607093811035. Distant text/boxes are off; progress emphasis is on. The workload is the standard 600-node/831-connection factory on a 5,400 × 3,600 field. Use the documented five-second warmup and uninterrupted fixed 25-second sample, without other heavy checks or interactions during measurement.

This baseline measured 74.28 average FPS, frame p95 16.8 ms, frame p99 25 ms and tick p95 4.4 ms, with 1,857 frame intervals, 600 retained node objects and cached cables. These are one-host synthetic observations, not a performance improvement, gameplay balance result, universal FPS target or closure of SR-20. Later renderer work must compare serial built versions with the same fixture, viewport, camera and workload; repeat the baseline if the host/browser differs. No post-pilot renderer comparison is claimed because this pilot changes no drawing or interaction owner.

The first sandboxed server was unreachable. Restarting the local fixture server through the configured escalation flow made it reachable; no browser permissions or campaign tabs were changed. A fresh tab recovered from the initial error page. The sample tab was paused and closed, the temporary viewport override reset, and the server stopped afterward.
