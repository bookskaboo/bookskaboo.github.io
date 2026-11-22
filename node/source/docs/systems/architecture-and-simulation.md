# Architecture and simulation

[System index](README.md)

React owns the interface, PixiJS renders the active factory field, and the simulation operates on plain game state independently of either renderer. Persistence and content modules provide separate boundaries for saving and customization.

## Module ownership

| Layer | Main location | Responsibility |
| --- | --- | --- |
| Domain | `src/domain/` | State types, geometry, grid, camera and Control Groups |
| Content | `src/content/` | Items, nodes, behaviors, modules, recipes, research and formulas |
| Simulation | `src/simulation/` | Production, routing, research, world generation, recovery and commands |
| Persistence | `src/persistence/` | Slots, payload validation, keys and legacy normalization |
| Mods | `src/mods/` | Data validation, overrides, profiles and sharing |
| UI | `src/ui/` | React panels, controls, recipe/research presentation and preferences |
| Renderer | `src/renderer/` | Pixi lifecycle, drawing, particles and pointer interactions |
| Tutorials | `src/tutorials/` | Practice state, stages, restrictions and progress checks |

Node definitions own identity and static sockets; capabilities own simulation behavior; modules own visual shape and controls. Effective sockets derive from recipe, resource or direction state. Keep geometry shared rather than independently estimating ports in UI and simulation.

## Runtime cadence

The app schedules realtime ticks at 100 ms. The engine measures elapsed active time and caps an individual simulation delta at 1,000 ms. This does not provide unlimited offline catch-up. Global pause stops simulation work. All unlocked sectors run during each update, regardless of the active rendered map.

An update delivers due transfers, simulates nodes, evaluates research milestones, checks recovery, dispatches ready cable work and publishes state. Base cable dispatch is 400 ms; ordinary UI publication is 750 ms with earlier publication for relevant changes. Autosave uses the preference interval. Construction age uses wall-clock timestamps.

Temporary indexes group nodes, connections and pending cargo for simulation phases. Reservations update as routes are planned so competing sources share target capacity. Indexes are rebuilt rather than persisted across undo/load. The renderer reads active-sector transfer views and animates them without inactive-map particles.

Sector indexes populate lazily inside each phase's SimulationLookups object; repeated `sector` accesses do not each rebuild the complete index. Pending-target indexes also build on demand and include later launches. Obstruction caching compares a serialized geometry signature, which must itself be rebuilt before a cache hit can be recognized. Preserve these invalidation/reservation boundaries when reviewing optimizations. The [bounded transport profile](../../outputs/transport-profile/README.md) separates pristine tick costs, instrumented attribution and sampled allocations; its follow-up proposals do not change these runtime rules.

## Rendering work

The playfield retains node and cable objects by identity. Stock, progress and
ordinary movement update existing objects; structural appearance, socket layout,
selection and group-marker changes rebuild affected views. Load, undo, map travel
and mod changes invalidate views whose state sources changed. Moving a node or
group updates affected cable geometry and invalidates cached cargo paths through
those cables without changing transfer clocks or stock reservations.

Cargo graphics are pooled under the existing 64-animation limit. Curve samples
are cached by route and invalidated when any cable in the route changes.
Offscreen node visual updates and cable drawing are skipped; simulation still
runs all unlocked maps. The camera and drag-preview positions determine current
visibility, so zooming, panning and group dragging reveal current state again.
Secondary labels and buffers appear from 15 percent zoom, with selected, hovered
and actively wired nodes retaining detail. Readouts follow simulation revisions
and time; progress and cargo motion interpolate between ticks. Renderer and text
resolution follow display density with a maximum of two.

From 15 percent up to the 40 percent full-artwork transition, labels and live
buffer boxes update over the shared node image. Revealing readouts does not
invalidate that image or the cable caches. Socket overlays refresh using the
owner's readout visibility, including when its static body stays cached.

Below 40 percent zoom, ordinary rectangular player nodes share bounded snapshots
of their existing static artwork. Progress fills/tracks, waiting markers and
arrival flashes remain live; selection, hover, dragging and wiring restore full
detail. Organic/resource nodes, Extractors and Research Centers retain their
specialized drawing. Snapshot keys distinguish recipes, socket appearance and
group colors; research/mod changes invalidate the shared cache. At most 256
appearances are retained, each at most 256 pixels on its longer edge. Further
appearances fall back to vectors. Render targets are released on teardown.

The optional `showDistantNodeDetails` renderer input supports a local performance
comparison. It can restore live text and buffer overlays below the 15 percent cutoff while
keeping the shared static artwork and cable caches enabled. Socket graphics
already present in the shared image stay hidden beneath these overlays; their
interactive roots remain available. The normal game does not enable this input; its fixed 15 percent camera floor
already keeps ordinary readouts visible. Historical lower-zoom samples predate
that floor.

Cables use independently cached neighborhoods grouped by source position on a
1,024-unit grid. Each target is bounded to 2,048 pixels on its longer edge and
culls against its complete curve bounds. Movement, insertion and rewiring dirty
the affected neighborhoods; zooming above the threshold restores vector drawing.
Selected cables remain individual vectors with their existing interaction and
delete control. Hit testing uses the original node/socket/cable objects, and
camera-dependent socket hit areas remain active. Endpoint input signatures avoid
recomputing unchanged curve geometry on stock/progress publications. Node and
port indexes avoid full-factory scans for socket lookup and router arrival pulses.

Simulation remains on the main thread at its existing cadence. A worker is a
separate architectural change; it is not required to use the retained renderer.
The active-factory fixture exposes frame percentiles and renderer allocation
counts for local comparisons; these observations are not universal FPS targets.

## Interface snapshot work

FactoryApp computes physical-buffer inventory totals only while their panel is visible. The memoized result depends on factory identity, revision and visibility, so reopening or replacing a factory with the same revision still refreshes it. Existing totals retain their sector/buffer scope rather than adding reserves, in-flight cargo or the shared pool. [Snapshot regressions](../../src/ui/interfaceSnapshots.test.tsx) cover the guarded aggregation and save invalidation boundaries.

Save / Load retains its parsed autosave snapshot between ordinary renders. It reads on mount and rechecks after attaching observers to close the subscription gap, then refreshes on successful same-window writes, matching storage events/clear, window focus or explicit panel refresh. UI publications, name typing and autosave-frequency changes do not by themselves reread the autosave. The [write notifier](../../src/persistence/autosave.ts) runs only after storage succeeds and isolates observer exceptions from persistence status; the [panel hook](../../src/ui/useAutosaveSnapshot.ts) disposes observers on close.

Both App subscriptions remain intentional: the outer owner keeps Dwarven discovery, tutorial invitations and the available lesson list current, while FactoryApp owns live factory/panel revisions. Removing the outer subscription would stale those consumers. This optimization does not change simulation/publication cadence, saved data, undo snapshots or the standalone refactor plan.

## Refactoring guideline

Use targeted extractions when a concrete fix or measured bottleneck needs a clearer owner. Preserve public engine entry points and existing behavior contracts; splitting files alone is not evidence of a performance improvement. Reuse existing owners and shared rules, including the fresh-layout reset. Long-lived owners must read current state through getters so load, undo and engine replacement cannot leave stale references. Keep checkpoint/publication order explicit and avoid passing the whole engine as an untyped context.

A separate [standalone code organization plan](../master-plan/07-technical-design.md#standalone-code-organization-refactor-plan) has completed its baseline and Road-command pilot locally (NODE-0817), transport ownership (NODE-0819) and factory command planning (NODE-0823). UI/renderer coordination and lifecycle phases remain pending. The [pilot dependency map](../../outputs/road-command-refactor/README.md), [transport verification](../../outputs/transport-refactor/README.md) and [command verification](../../outputs/factory-command-refactor/README.md) retain their boundaries and evidence; file splitting makes no performance claim.

[RoadCommandRuntime](../../src/simulation/roadCommandRuntime.ts) owns pair-direction validation and reversal. Its only engine capabilities are a current-state getter, checkpoint, transfer cancellation and publication. The engine retains its three public direction methods as delegates, owns undo snapshots and delegates physical cancellation to TransportRuntime. The command owner retains no state/node references between calls and has no transient cache to reset on load or undo. Placement geometry, material traversal, dispatch and the stricter travel-pair validator stay in their existing modules. A real direction change checkpoints once, cancels each endpoint's transfers before removing its cables, swaps buffers only when its mode changes, resets progress and publishes once after both endpoints finish. Same-direction success and validation failures neither checkpoint nor publish.

## Transport ownership

[TransportRuntime](../../src/simulation/transportRuntime.ts) owns physical delivery, cancellation/refunds, input capacity/occupancy/reservations, socket readiness, Filter backpressure, Recycler material selection and local route launches. Its engine capabilities are a getter for current state, ID generation and TransferStarted event recording. The getter reads the engine's current state without adding catalog activation inside hot loops; the engine retains its existing mod-activation boundaries. No whole-engine context or newly public engine mutation method is exposed. The engine keeps its tick, production and lifecycle orchestration, checkpoint/publication decisions and Road payload/timing loop.

One-item Road dispatch lives alongside legacy Road-stock recovery in [roadTransport](../../src/simulation/roadTransport.ts), using the transport owner's delivery resolver and existing Road material/vehicle rules. Shared route geometry remains in logisticsRoutes, physical output/refund operations in mixedOutput and indexes in SimulationLookups. The existing generic-family set now belongs to connectionRules and is shared by concrete-output inference and local transport validation.

Delivery creates a fresh lookup phase; simulation shares its own phase across unlocked maps, including Road work; local routing shares a separate phase across maps and records launches through `lookups.launched`. No lookup survives a phase or state replacement. The sole retained transport history is the original WeakMap of actual Extractor cable objects to dispatch times. Its lifetime remains the engine lifetime: replacement/undo clone cables into new keys, while unchanged cable objects retain fairness through ordinary commands/mod application. No cache reset, index algorithm or serialized field was added. The original deliver/simulate/research/recovery/dispatch/publication sequence remains in the engine.

## Factory command planning

[NodePlacementPlanner](../../src/simulation/nodePlacementPlanner.ts) owns new-node and paired-Road placement plans and previews. [NodeMovementPlanner](../../src/simulation/nodeMovementPlanner.ts) expands attached camp/Lake movement, checks proposals and returns ordinary-node or paired-Road plans. [ConnectionPlanner](../../src/simulation/connectionPlanner.ts) owns automatic/exact connection plans, failure explanations and compatible cable-insertion previews. It retains the distinct ordering of explanation and commit validation rather than substituting one for the other. [Deletion planning](../../src/simulation/nodeDeletion.ts) selects eligible nodes and incident cables; Control Group planning extends the existing domain group module.

These planners read current state and the active sector through narrowly typed getters, with ID creation supplied only to placement planning. They retain no state, node, plan or index between calls. Sector lookup keeps the engine's existing catalog-activation timing. Plans are consumed synchronously by the engine facade, which retains checkpoints, material refunds, mutation, reconciliation, milestone/event recording and publication in the original order. Public command methods and the engine's RoadPlacementTarget type export remain compatible. Geometry, Road layout, cable tracing, collision, protected-Landmark and source-stock rules stay with their existing validators.

Clipboard/duplicate layout sanitization and FactoryTemplateRuntime remain independent existing owners and still use the shared freshLayoutNode reset. Manual movement validation remains separate from unconditional expansion/load Road alignment. The existing beginMove/tryMoveNodesTo/commitMove protocol is preserved, including the checkpoints in beginMove and successful tryMoveNodesTo; this refactor does not redesign drag history or normalize successful no-op commands.

## UI and renderer coordination

[useFactoryPanels](../../src/ui/useFactoryPanels.ts) owns panel/recipe return state, focus/scroll restoration and navigation. [useFactoryKeyboard](../../src/ui/useFactoryKeyboard.ts) owns the factory shortcut effect, retaining the shared Dialog, dialogFocus and factoryKeyboard policies. FactoryApp still owns engine subscriptions, ticking, visibility and rendering; Upgrades stays mounted while its recipe subpanel is open.

[playfieldInteractions](../../src/renderer/playfieldInteractions.ts) owns pointer/keyboard coordination and transient drag, Road-click, marquee, hover and camera interaction state. It reads live props, camera and scene accessors; PixiPlayfield retains scene drawing, geometry, tick cadence and rendering resources. Semantic socket targeting and the shared corner-socket radius stay independent of drawing.

[PlayfieldResources](../../src/renderer/playfieldResources.ts) owns each mount's listener, subscription, observer, ticker, texture and application disposal. Registrations release once in reverse order; pending application initialization is released when it settles even after unmount, and rejected startup cleans partial resources. Node-owned display listeners are released with their destroyed containers. This does not change simulation or compute-visibility policy. See [verification and limits](../../outputs/ui-lifecycle-refactor/README.md).

## State and mutation

The engine owns mutable state and emits revisions for subscribers. ResearchRuntime, FactoryTemplateRuntime, RoadCommandRuntime and TransportRuntime access current state through getters so loading or undo does not leave an obsolete object. Commands take checkpoints when undo is supported.

[stateLifecycle](../../src/simulation/stateLifecycle.ts) supplies two stateless operations: constructor/replacement collection defaults (including the existing upgrade migration), and Undo's retained knowledge/depletion notices. Each receives the current owned state or command snapshot for that invocation and retains no factory, catalog or cache. Public lifecycle policy remains in the engine; full normalization stays there because it coordinates existing material/refund, layout and migration owners.

| Path | Preserved sequence and policy |
| --- | --- |
| Constructor | Clone/create, validate applied mod, activate catalog, collection defaults, full normalization, names, research reconciliation, Forest pruning, milestones. No publication or running clock is introduced. |
| replaceState | Clone and validate mod before assignment; reset an already-active realtime clock; activate catalog and apply names before collection defaults; full normalization, names again, research reconciliation, Forest pruning, clear history, publish. It does not gain the constructor's explicit milestone call. |
| Undo | Pop the existing snapshot, carry learned hints/tutorial suppression and depletion notices; retain encounters/visits except for the developer map-reveal command. Assign, reset an already-active clock, activate catalog, initialize progression, apply Cart upgrades/names, evaluate milestones, publish. No full load normalization or history clearing. |
| applyMod | Validate package, grid and graph before checkpoint; retain explicit grid/Landmark/terrain handling, catalog activation, upgrade migration/layout sync, names/Cart upgrades/names, quote cleanup, transfer accumulator reset, research reconciliation and publication. No generic load reset. |
| New game / tutorial restart | createInitialState remains the base-catalog/new-world owner. Tutorial creation retains authored rules and autosave-disabled engines; Restart retains its existing replaceState path. FactoryApp retains its subscription/clock cleanup when engines change. |

Autosave failure and timing accumulators remain transient engine fields with their prior path-specific lifetimes. Transfer visibility observes array/sector identity; phase lookups and cable-object dispatch history retain their existing invalidation rules. No snapshot representation, storage key, rules marker or normalization policy changes. [Lifecycle regressions](../../src/simulation/stateLifecycle.test.ts) and [original-source comparisons](../../outputs/ui-lifecycle-refactor/lifecycle-comparison.json) cover these boundaries.

Command checkpoints retain whole-state structured clones, capped at fifty by oldest-entry eviction. Undo consumes those snapshots; factory replacement clears them. This in-memory history is separate from persistence and is not serialized with each save. The profiling review adopted retaining this behavior and deferring a byte-budget or representation redesign unless slower-device testing or larger current factories demonstrate a problem; use the [save reference](saves-and-compatibility.md#undo-and-recovery) to distinguish heap retention, serialized payload and origin storage measurements.

Production/extraction counters, discovery histories and transient events have different retention rules. Cosmetic transfer pulses are animation, not inventory. Mod activation restores the appropriate assembled catalogs before operating on a state.

Use the [system index](README.md) to find the owning behavior before editing the engine. Run relevant tests and TypeScript/build checks for code changes. Keep simulation and persistence independent of renderer imports, and retain stylesheet import order when changing styles.

TypeScript incremental build information lives under `node_modules/.cache/node/`. The root Vite configuration is `vite.config.ts`; obsolete emitted `vite.config.js` and `vite.config.d.ts` copies are not needed. Temporary document renders and compiled preview bundles can be removed while retaining their authoring sources. Keep publication receipts, deployment checkouts and saved playtest evidence.

Sources: [engine](../../src/simulation/engine.ts), [tick scheduling](../../src/ui/App.tsx), [state types](../../src/domain/types.ts), [indexes](../../src/simulation/simulationLookups.ts), [renderer](../../src/renderer/PixiPlayfield.tsx), [architecture checks](../../scripts/architecture.test.ts). See [saves](saves-and-compatibility.md), [recipes](recipes.md) and [testing](testing-and-publishing.md).
