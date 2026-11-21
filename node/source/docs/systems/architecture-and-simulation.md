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
Secondary labels and buffers use zoom-dependent detail, with selected, hovered
and actively wired nodes retaining detail. Readouts follow simulation revisions
and time; progress and cargo motion interpolate between ticks. Renderer and text
resolution follow display density with a maximum of two.

Below 40 percent zoom, ordinary rectangular player nodes share bounded snapshots
of their existing static artwork. Progress fills/tracks, waiting markers and
arrival flashes remain live; selection, hover, dragging and wiring restore full
detail. Organic/resource nodes, Extractors and Research Centers retain their
specialized drawing. Snapshot keys distinguish recipes, socket appearance and
group colors; research/mod changes invalidate the shared cache. At most 256
appearances are retained, each at most 256 pixels on its longer edge. Further
appearances fall back to vectors. Render targets are released on teardown.

The optional `showDistantNodeDetails` renderer input supports a local performance
comparison. It restores live text and buffer overlays at overview zoom while
keeping the shared static artwork and cable caches enabled. Socket graphics
already present in the shared image stay hidden beneath these overlays; their
interactive roots remain available. The normal game does not enable this input.

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

## State and mutation

The engine owns mutable state and emits revisions for subscribers. ResearchRuntime and FactoryTemplateRuntime access current state through getters so loading or undo does not leave an obsolete object. Commands take checkpoints when undo is supported.

Production/extraction counters, discovery histories and transient events have different retention rules. Cosmetic transfer pulses are animation, not inventory. Mod activation restores the appropriate assembled catalogs before operating on a state.

Use the [system index](README.md) to find the owning behavior before editing the engine. Run relevant tests and TypeScript/build checks for code changes. Keep simulation and persistence independent of renderer imports, and retain stylesheet import order when changing styles.

TypeScript incremental build information lives under `node_modules/.cache/node/`. The root Vite configuration is `vite.config.ts`; obsolete emitted `vite.config.js` and `vite.config.d.ts` copies are not needed. Temporary document renders and compiled preview bundles can be removed while retaining their authoring sources. Keep publication receipts, deployment checkouts and saved playtest evidence.

Sources: [engine](../../src/simulation/engine.ts), [tick scheduling](../../src/ui/App.tsx), [state types](../../src/domain/types.ts), [indexes](../../src/simulation/simulationLookups.ts), [renderer](../../src/renderer/PixiPlayfield.tsx), [architecture checks](../../scripts/architecture.test.ts). See [saves](saves-and-compatibility.md), [recipes](recipes.md) and [testing](testing-and-publishing.md).
