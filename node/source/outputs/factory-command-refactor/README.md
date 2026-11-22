# Factory command planning evidence

Supporting evidence for NODE-0823, Phase 3 of the [authoritative refactor plan](../../docs/master-plan/07-technical-design.md#standalone-code-organization-refactor-plan). Phase 3 is complete locally. Phases 4–5 remain pending; the changelog owns dated outcomes. No commit or publication occurred.

## Checkpoint and preservation

[Baseline manifest](baseline-manifest.json) captures 617 existing file fingerprints and 390 recoverable snapshots: the complete 382-file source tree and eight affected document/history files. The workspace root is not a Git checkout. Restore only this stage's own hunks after inspecting current changes; do not overwrite other chats' work or rerun `checkpoint.mjs` over this checkpoint. Concurrent sound-tooling, style and history work was detected and preserved.

The four reviewable source checkpoints are under `slices/placement/`, `slices/movement/`, `slices/connections/` and `slices/selection/`. Their manifests preserve exact file hashes. Build output stays in this directory; ordinary `dist/` and deployment checkouts were not written.

[verify.mjs](verify.mjs) checks that twelve moved planner bodies remain verbatim except placement ID binding; movement/connection validation preserves ordering while returning plans instead of committing. The original engine's placement, cable insertion, Road mutation/alignment, cable deletion and group creation commit blocks are unchanged. Other tick, simulation, lifecycle, recipe, clipboard/duplicate, template and transport behavior remains unchanged. Existing domain group utilities are retained verbatim, with two planning functions appended. Only engine.ts and domain/controlGroups.ts changed among existing source files; four planner/deletion modules and one test file are new.

## Ownership and transactions

| Family | Planning owner | Engine responsibility retained |
| --- | --- | --- |
| Placement | NodePlacementPlanner; existing collision, Road geometry, border, channel and node rules | Checkpoint, paired/local insertion, cable insertion, milestones, placement event, publication |
| Movement | NodeMovementPlanner; existing coupled camp/Lake/Road and cable validators | Checkpoint, coordinate mutation, encroachment refresh and compatible cable insertion; existing begin/commit protocol |
| Connections | ConnectionPlanner; existing socket, material, Road, limit and cable tracing helpers | Checkpoint, refund cancellation, graph mutation, Extractor stock reconciliation, milestones and publication |
| Node deletion | nodeDeletion eligibility/incident-cable plan | Checkpoint, refunds, paired endpoint removal, node/cable removal, all-map group cleanup and publication |
| Control Groups | Existing domain/controlGroups extended with creation/disband plans | Checkpoint, group ID creation, membership mutation and publication |

Planners receive typed current-state/sector getters and placement alone receives ID creation. They retain no plans, state, nodes or indexes. Plans are consumed immediately and synchronously; sector getters preserve existing catalog activation points. The engine keeps its public methods and re-exports RoadPlacementTarget from its new defining module, so renderer type imports remain compatible. No engine/UI/renderer import is added to a planner.

Read-only previews leave factory state, history and supplied position maps unchanged. Rejected commands retain their original return/history behavior. Successful no-op movement still takes its prior checkpoint. Renderer `beginMove`, successful `tryMoveNodesTo` and `commitMove` retain their existing calls; both beginMove and successful tryMoveNodesTo checkpoint as before. This extraction does not consolidate drag Undo history or introduce a generic transaction that would change that behavior.

Clipboard, duplicate and template owners remain in place and share the existing freshLayoutNode work reset. Protected Landmarks, paired Roads, terrain clearance and source-stock compatibility keep their existing validators. Manual Road move validation stays separate from unconditional expansion/load alignment. Failure explanations retain their distinct check ordering rather than being replaced with commit validation.

## Verification

[verification.json](verification.json) contains counts, source checks and limits.

| Check | Result and evidence |
| --- | --- |
| Fresh baseline workspace | [Report](baseline-tests.json): 2,386 passed, one existing skip |
| Placement slice | [Report](placement-tests.json): 330 passed across 22 discovered files |
| Movement slice | [Report](movement-tests.json): 221 passed across 20 discovered files |
| Connection slice | [Report](connections-tests.json): 535 passed across 34 discovered files |
| Selection/deletion slice | [Report](selection-tests.json): 582 passed across 38 discovered files |
| Seven new facade contracts before movement extraction | [Report](contracts-before.json): seven passed |
| Same contracts with the captured original engine | [Report](original-contracts.json): seven passed |
| Final workspace | [Report](final-tests.json): 2,393 passed, zero failed, one existing skip across 236 files; 1,597 current-tree and 796 preserved-release passes |
| TypeScript and local production builds | [Baseline](baseline-build.log), [final](final-build.log); all four slice type checks also passed |
| Original-engine command comparisons | [Report](comparison.json): all 16 slice/scenario pairs match |
| Production browser interaction | [Observations](browser-observations.json), [after-Undo screenshot](browser-after-undo.jpg) |
| Catalog/link/history checks | [Baseline catalogs](baseline-systems.log), [baseline history](baseline-history.log); [final catalog generation](final-systems-generate.log), [catalog checks](final-systems.log), [history generation](final-history-generate.log), [history checks](final-history.log) |

The unchanged workspace test discovery includes preserved release copies under `.artifact-work/`; counts separate those from current source. Full runs use `npm test -- --maxWorkers=4 --testTimeout=15000 --reporter=json --outputFile=...`. Builds use `npm run build -- --outDir outputs/factory-command-refactor/...` and retain the existing large-chunk warning. Focused coverage includes placement/connections, semantic/mirrored sockets, Control Groups, templates, Road expansion/travel, Landmarks, world/border rules, routing, recipe-copy stock and Undo.

The seven new public-facade cases check all five command families after replacement to a different active sector, revalidation after a placement preview, rejected-command history and successful no-op movement. They pass with both the captured original engine and the refactor. No existing regression was weakened or removed.

## Original-engine comparisons

[compare.mjs](compare.mjs) compiles the captured complete original source and each frozen slice independently. [compare-worker.ts](compare-worker.ts) fixes IDs, wall clock and randomness. Each slice runs four scenarios: ordinary factory commands, paired Roads, protected/paid-layout nodes and a modded factory. Per slice, **100 public command returns/full states and 54 publication states match**: 400 command-state/result and 216 publication comparisons across the 16 pairs. Raw original and candidate sequences are retained beside the report.

The scenarios exercise invalid/repeated placement, cable insertion and Undo, duplicate connection explanations, group creation/disband/movement, begin/commit movement and Undo, copy/paste/duplication, cable/node deletion, replacement, Road preview/movement/reversal/paired deletion, protected Landmark deletion rejection, paid Drill reset, template preview/placement and mod removal/Undo. Equality is exact for declared cases, not proof of every possible factory.

## Browser protocol and limits

The isolated `browser/` authoring source mounts the real FactoryApp with the current engine, two synthetic nodes, a paused clock and autosave disabled. It imports the normal game styles and exposes read-only DOM observations of node/cable/camera state. No game UI, renderer or style source was changed. Build with Vite/React using that directory as root; the frozen production result is `browser-build/`. Serve with `npx vite preview --outDir outputs/factory-command-refactor/browser-build --host 127.0.0.1 --port 4187 --strictPort`.

At 1280×720 on its separate local origin, normal UI actions verified:

1. Dragged the Cart output socket to the Warehouse input; observed the actual cable.
2. Opened Build, selected Joint and placed it on clear floor.
3. Dragged the connected Warehouse; observed its new coordinates and retained cable ID.
4. Pressed Delete and confirmed DECOMMISSION; observed the node and attached cable disappear.
5. Pressed Ctrl+Z; observed the same Warehouse position and cable restored.

The page remained paused. No Dev commands, campaign imports, save slots or autosave writes were used. The temporary viewport override was reset, the test tab closed and the server stopped. These are synthetic functional checks, not normal-play resource/balance evidence, an FPS comparison, mobile comfort testing or closure of multi-map performance coverage. The existing Phase 0 renderer baseline remains available for Phase 4.
