# Active factory test

Run `npm run dev` and open `/previews/active-factory/` on its local URL.
The default is 300 nodes on one Map Node: 60 Dev Sources, 120 Production nodes,
60 Carts and 60 Warehouses. Choose 150 or 600 nodes to compare load, or use
`?nodes=600`. Changing load or Reset test creates a fresh fixture and reuses the
current renderer. The earlier pre-optimization 600-node browser crash remains
recorded in NODE-0598; the retained renderer is checked separately.

This page imports the current GameEngine and PixiPlayfield. Each branch has two
real production stages followed by Cart-to-Warehouse delivery. The four chains
produce Iron Gear, Copper Wire, Automata Core and Basic Frame. Dev Sources fill
missing ingredients. Recipe durations and cable rules are unchanged; initial
progress is staggered to spread activity across the map. The test uses an empty,
fully expanded field and one-million-item final storage per branch. It does not
measure ordinary progression, resource depletion, balance or finite storage.

Pause/Resume controls simulation. Fit all shows the factory; Inspect a line
zooms into its first branch. The normal renderer supports zoom, pan, selection,
node movement and rewiring. Reload discards the fixture. Autosave is disabled,
and this page has no save-slot or browser-preference controls.

Counters distinguish total production from final Warehouse deliveries and
physical cargo from Dev Source cosmetic pulses. The current game's 64-animation
limit remains in force. Page FPS measures requestAnimationFrame callbacks, and
last tick time measures the latest engine tick, not a controlled benchmark.
The activity row also shows the 95th-percentile frame interval after a five-second
warmup. Its `data-benchmark` metadata includes frame p95/p99, tick p95, frame
count, frames above 33.4 ms and measured duration. Samples retain at most 3,600
frame intervals and 600 ticks. Reset before measuring; pauses and interaction
remain part of a sample. Compare built versions serially at the same viewport
and camera. The `data-renderer` metadata tracks node creation/destruction,
visible nodes and pooled cargo objects, allowing selection and movement checks
to verify that unrelated nodes are retained. These counters are optional to the
renderer and do not affect saves or simulation rules.

Verify with `npx tsc -p previews/active-factory/tsconfig.json --noEmit` and
`npx vitest run previews/active-factory/model.test.ts`.
