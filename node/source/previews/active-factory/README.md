# Active factory test

Run `npm run dev` and open `/previews/active-factory/` on its local URL.
The default is Dense routing with 1,200 nodes on one Map Node. Choose 600, 1,200
or 2,400 nodes; use `?layout=dense&nodes=2400` for the largest fixture. Each
20-node cell contains one Dev Source, three Production nodes, seven Splitters,
seven Mergers, one Cart and one Warehouse. At 2,400 nodes this means 360
Production nodes and 840 of each router. The cells occupy a 1,024 by 512 world-unit
pitch, with up to ten columns on the same expanded field.

Production lines preserves the previous 150-, 300- and 600-node comparisons.
Use `?layout=lines&nodes=300`; old `?nodes=300` URLs still select those lines.
Changing layout/load or Reset test creates a fresh fixture and reuses the
current renderer. The earlier pre-optimization 600-node browser crash remains
recorded in NODE-0598; it is separate from the later verified retained renderer.

This page imports the current GameEngine and PixiPlayfield. Each branch has two
real production stages followed by Cart-to-Warehouse delivery. The four chains
produce Iron Gear, Copper Wire, Automata Core and Basic Frame. Dev Sources fill
missing ingredients. Recipe durations and cable rules are unchanged; initial
progress is staggered to spread activity across the map. The test uses an empty,
fully expanded field and one-million-item final storage per branch. It does not
measure ordinary progression, resource depletion, balance or finite storage.

Dense cells split the first producer's output across two downstream machines,
merge their matching products, and pass the products through two fan-out/fan-in
blocks before storage. All fourteen routers in each cell participate in real
material routes. Both outlets/inlets are connected through their semantic ports.
No routing or recipe rules are changed for the fixture.

Pause/Resume controls simulation. Fit all shows the factory; Inspect a cell
shows the first dense cell, while Inspect a line shows the first original branch.
Emphasize progress bars defaults on for dense routing and gives the real Pixi
progress fills and tracks a minimum three CSS pixels of height, keeping their
bottom edge fixed. Switch it off for ordinary bar sizing. The optional emphasis
does not change normal-game rendering, production progress or simulation speed.
The normal renderer supports zoom, pan, selection,
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

The diagnostics also include `overviewTextures`, `cableChunks` and `cachedCables`.
Below 40 percent zoom, ordinary node artwork is shared while actual progress and
arrival overlays keep updating. Cables cache independent neighborhoods so moving
a node refreshes nearby curves. Selection and zoom restore detailed vectors;
all production and physical material transfers continue at the normal cadence.
Measure with these caches warm, then test movement, wiring and camera changes
separately. The comparison evidence for this optimization lives in
`outputs/dense-optimization/` (NODE-0611).

**Show distant text and boxes** restores titles, socket labels and current buffer
boxes below the usual detail threshold. Static node artwork and cable caches
remain active. It defaults off and changes only this preview; switching it resets
the synthetic factory and timing samples. Ordinary game defaults stay unchanged.

Add `sampleSeconds=25` to the URL for a five-second warmup followed by a fixed
25-second measurement window. The metadata's `complete` flag then stays true and
the benchmark freezes while production and the live FPS counter continue.
`averageFps` and `meanFrameMs` use actual sampled intervals, including in rolling
windows. Repeat off/on runs at the same viewport and camera; verify live text,
stock and movement outside timed windows. Comparative evidence is retained in
`outputs/distant-node-details/`.

For centered zoom comparisons, `details=1` starts with distant text/boxes enabled
and `zoom=0.25` starts at 25 percent zoom (accepted range: 0.05–2). Reset test
reuses that zoom; Fit all and Inspect a cell still use their normal framing.
The activity metadata's `data-camera` reports the actual clamped camera. Combine
these options with a fixed sample window to compare visible-node counts, average
FPS and frame p95 at different zooms while all nodes keep simulating. Repeat a
borderline result; a single average above 30 FPS does not establish a stable
30 FPS floor across camera locations or host load.

The toolbar's **Zoom** dropdown shows the actual percentage. Select **35%** to
set that view directly, or use the wheel and watch the value update. Fit all and
Inspect a cell update it too. Presets preserve the current view center and keep
production running; actual zoom changes restart frame measurements and warmup,
without resetting the factory.

Verify with `npx tsc -p previews/active-factory/tsconfig.json --noEmit` and
`npx vitest run previews/active-factory/`.
