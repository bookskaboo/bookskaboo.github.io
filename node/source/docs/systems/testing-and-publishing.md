# Testing and publishing

[System index](README.md)

Verification should match the change: catalog consistency, simulation behavior, browser interaction, normal-play balance and live publication establish different things. Keep those claims separate in history and reports.

## Upgrades integration checks

The [robot assembly checks](../../previews/status-page/robotAssembly.test.tsx) process real synthetic lab payments for all seven upgrades, distinguish buffered stock/partial cycles from paid Cores, and retain the portrait's paid fraction through disabling, pause and normalized reload. Active cycles flash only the pending synchronized-set hardware; tests cover exact consumption handoff, missing inputs, disabled/paused labs, game/research pause and unrelated research. The author gallery previews the same shared portrait without changing factory state. Finished SVG comparisons and desktop/mobile checks live in `outputs/robot-upgrade-animations/`; processing flash observations live in `outputs/robot-upgrade-processing/`. These are presentation/payment checks, not campaign pacing measurements.

Unmodded Upgrades is now part of the game. [Integration coverage](../../src/ui/UpgradesIntegration.test.tsx) checks initial controls, constrained Basics, actual slot normalization/replacement, old paid-map quotes, preserved contributions/history and the retained applied-mod screen. Queue, synchronized-payment, map and tutorial suites cover the underlying runtime.

Browser verification completed all 19 Basics stages through normal practice placement, extraction, Charcoal/Plate/Gear/Core production, lab delivery and actual five-Core Assembler payment. Selection alone stayed on step 14; queueing advanced while paused, and step 15 waited for payment. Completion explained the four-card queue; Finish returned to the original paused factory. A separate unmodded factory saved through Save / Load, changed upgrade/research-pause state and restored the saved selection, pause and hint archive. No campaign save from another origin was overwritten.

Checked Q/Escape, Tab/Shift+Tab wrap, recipe return focus/scroll and the assignment-sized hint during arrow and wheel navigation. Normal layouts were checked at 1280×720, 960×720, 960×540 and 390×844 (the browser reported 845 px for the mobile override); compact/mobile tutorial panels were also checked without overlap. The disabled character column is hidden in compact practice, and short desktop queues use four compact slots to retain list space. Evidence is in [the integration report](../../outputs/upgrades-integration/verification.json).

Use a separate local origin and an isolated output directory for production-build browser checks when other work also builds the workspace. The reviewed fixed build is outputs/upgrades-integration/game; the author study still exports its independent fixtures. Functional practice and synthetic save regression evidence do not establish full campaign pacing or modded-factory support.

## Workspace commands

| Command | Purpose |
| --- | --- |
| `npm test` | Ordinary Vitest suite, including architecture checks |
| `npm run build` | TypeScript checks and local Vite production build |
| `npm run build:site` | TypeScript checks and `/node/` publication build |
| `npm run docs:systems` | Regenerate six system catalogs and check local documentation links |
| `npm run docs:systems:check` | Check catalog freshness and local links without rewriting |
| `npm run changelog` | Refresh generated history Markdown and searchable view |
| `npm run changelog:check` | Verify history generation and its checks |
| `npm run stress` | Opt-in engine benchmark with synthetic networks |
| `npm run progression` | Analytical progression scenarios and reports |
| `npm run balance:audit` | Read-only recipe and balance calculations |

The documentation check validates catalog freshness, local file targets and Markdown section anchors in the system library, archive and project entry documents. It accepts angle-bracket paths containing spaces and preserves checks on legacy section links. It does not prove prose matches gameplay or check external URLs. Read the source when reviewing a rule.

The progression report runner excludes archived release source under `.artifact-work/` so historical copies cannot overwrite the current analysis. Its generated review covers fixed Simple-through-Complex research consumption; Final-Core projects and ordinary-play timing remain outside those totals. The report labels its retained planning context as historical.

## Browser playtests

Read [browser playtests](../browser-playtest.md) before starting or recovering a session. Preserve the current game during recovery. Before a new run, read the [build guide](../playtest-build-guide.md) and reuse verified plans through normal gameplay. Preserve successful branches while testing separate routing experiments.

Balance runs use ordinary play without grants, save injection, accelerated simulation or rule changes. Queue ordinary bugs and design ideas until the run ends. If a progression blocker needs a fix, make the smallest authorized fix, record it and continue. Reports retain resource totals and elapsed game time, distinguishing setup/interaction overhead from production waiting.

Synthetic stress scenarios bypass ordinary placement and use prepared buffers; they measure the engine in Node. They do not certify browser performance, learning or normal-play completion time. Analytical recipe bills likewise cannot establish delivery feasibility alone.

The [border engine fixture](../../previews/border-obstructions/README.md#real-engine-test) uses actual generation, Road placement, Pixi art and Node Map presentation with synthetic empty fields and explicit research grants. It disables browser-save writes. Terrain selectors, sample navigation and map travel publish sector changes through the engine so paused previews redraw; local label changes alone do not refresh Pixi. The header follows the actual active map, and clear maps disable crossing tools until a terrain example is selected. Run `node scripts/audit-border-obstructions.mjs` to reproduce the 1,100-world static route/quota audit. Functional fixtures and graph safeguards do not certify normal-play purchase timing or routing balance.

The [Upgrades queue lab](../../previews/status-page/README.md#reviewed-presentation-and-controls) is an isolated synthetic Research Center fixture with autosave disabled. Its clock runs at normal speed; separate supply/completion controls seed Cores or step ordinary cycles for interaction review. Use it to check four slots visible by default, single-click selection without payment, double-click queueing exactly once, the Queue research action (including keyboard activation), locked/duplicate/full rejection, automatic advancement, pause/resume icons and retained payments. It does not establish production feasibility or campaign balance. [Runtime tests](../../src/simulation/researchQueue.test.ts) exercise queue order, limits, cancellation, pause and normalized save round trips.

### Active factory browser test

With the local Vite server running, open `/previews/active-factory/`. This isolated
page imports the current engine and Pixi renderer. Standard expanded map is the
default: 600 nodes and 831 connections in thirty cells on a 5,400 × 3,600 field,
with 90 Production nodes and 210 of each router. It starts at 15 percent zoom
using normal readout visibility. Dense routing stress test retains 600, 1,200
and 2,400 on a synthetic 10,800 × 7,200 field. Display actual field dimensions
beside the counts; stress loads are not ordinary-map capacity claims. Each compact cell has
three Production nodes, seven Splitters and seven Mergers, plus a Dev Source,
Wooden Chest and Warehouse. Real material routes fan out through two downstream recipe
machines and rejoin through routing blocks. At 2,400 nodes, 360 Production nodes
and 840 of each router fit within the expanded field without overlapping bodies.
Production lines retains the previous 150/300/600-node layouts and old URL query
compatibility. Production, cycling, router, transfer and delivery counters keep
the load inspectable. Pause/Resume, Reset test, Fit all and Inspect a cell/line
control the fixture and camera.

Emphasize progress bars gives actual progress fills and tracks a three-CSS-pixel
minimum height in this fixture, retaining their bottom edge as zoom changes.
It defaults on for dense routing and off for the original lines. The normal game
keeps its current bar sizing. This is visual emphasis, not fake progress or a
simulation speed change.

The page disables autosave and does not expose save-slot or persistent preference
controls. Reload creates a fresh fixture. The empty expanded field, staggered
initial progress, Dev Sources and one-million-item final Warehouses are synthetic
setup; recipe cycles and cable rules use current game behavior. Page FPS and last
tick time are live observations, not controlled benchmark results. The renderer's
existing 64-transfer-animation cap still applies; the cargo counter counts all
physical transfers and excludes cosmetic Dev Source pulses. This page does not
establish normal-play balance or progression. The fixture reports frame p95/p99,
slow-frame counts, tick p95 and renderer object counts in its activity metadata,
after five seconds of warmup. Samples retain at most 3,600 frame intervals and
600 ticks; paused or interaction periods affect a sample unless the fixture is
reset. Compare built versions serially, at the same viewport and camera, with
production active; keep inspection/movement checks separate from timing samples.
See the [fixture guide](../../previews/active-factory/README.md)
and [sustained-delivery checks](../../previews/active-factory/model.test.ts).

Renderer metadata also reports shared overview appearances, cable neighborhoods
and whether overview cable caching is active. Check movement, group movement,
socket reconnection, selected cables, zoom threshold crossings and pan separately
from an uninterrupted timing sample. The cache regression tests exercise overlay
exclusion, appearance sharing, restoration after snapshot failure, neighborhood
movement and reopening culled regions. The 2,400-node optimization changes drawing
and lookup work, without changing simulation cadence, recipe timing, transfer
timing or the existing animation cap. Local measurement evidence is retained in
`outputs/dense-optimization/` and recorded by NODE-0611; it is not a universal FPS
guarantee.

The active-factory page's **Show distant text and boxes** checkbox compares the
usual overview against live node text and buffers while retaining artwork and
cable caching. Switching it resets the synthetic factory and timing samples.
For repeatable runs, `?layout=dense&nodes=2400&sampleSeconds=25` freezes benchmark
samples after a five-second warmup and 25 seconds of measurement. Simulation and
the live page FPS counter keep running. Average benchmark FPS is computed from
the sampled frame intervals, including with a bounded rolling history. Compare
identical viewport/camera/load settings and keep heavy tools out of the timed
interval. Inspect labels, current buffer contents, zoom and movement separately.

For a centered zoom sweep, add `details=1&zoom=0.25` to begin with distant
text/boxes at 25 percent zoom. The preview accepts 0.05–2, preserves that starting
zoom on Reset test, and reports actual clamped camera values in `data-camera`.
Fit all and Inspect a cell retain normal framing. Compare average FPS and the
33.3 ms frame budget together, and repeat candidate settings in another visible
region before suggesting a practical 30 FPS zoom. All 2,400 nodes continue to
simulate even when most are outside the camera.

The visible Zoom dropdown shows the actual camera percentage, including custom
wheel values. Its presets include 35%. Selecting one preserves the current field
center and simulation state. A change in actual zoom, from any camera control,
restarts timing samples and their five-second warmup, so completed measurements
are not displayed as results for the new zoom. Fit all and Inspect a cell update
the readout too. This control is local to the test page.

## Publishing

The live game is [NODE](https://bookskaboo.github.io/node/), published from `main` in `bookskaboo/bookskaboo.github.io`. An explicit request to publish authorizes the full release workflow in [project instructions](../../AGENTS.md).

Build with `npm run build:site`, run workspace tests and prepare matching runtime output under `node/` and source under `node/source/`. Confirm changes are confined to `node/` and can fast-forward current remote `main`. Submit the exact commit and destination through the configured approval flow.

After pushing, wait for GitHub Pages and verify normal live HTML plus SHA-256 hashes of every new build asset. Only then update publication history and associate records with that release. A local commit or feature-branch push alone does not publish NODE. If the configured reviewer denies the push, preserve the tested commit and report the denial and exact command for the user.

## Documentation upkeep

Update the affected system document and regenerate catalogs after a completed system change. Preserve decisions and earlier evidence in their records. Add a stable dated entry using the [changelog procedure](../changelog/README.md), then regenerate and check history. For player-facing style/copy changes, read and update both [style guide](../node-ui-style-guide.md) and [review notes](../typography-style-review.md).

Sources: [package scripts](../../package.json), [architecture tests](../../scripts/architecture.test.ts), [documentation generator](../../scripts/system-docs.mjs), [stress runner](../../scripts/run-stress.mjs), [progression runner](../../scripts/run-progression.mjs), [project instructions](../../AGENTS.md).

In the Upgrades prototype, the external Test completion fixture previews its tier-completion notice. The live lab's Complete current test project instead completes the selected project in its existing engine; only a bot upgrade creates the character notice. Check hover/focus benefits, 4.5-second expiry, manual/keyboard dismissal, no historical replay on fixture loads and Final's lack of a next Core or victory claim. See the [prototype guide](../../previews/status-page/README.md#upgrade-benefits-and-completion-notices). These are synthetic UI checks rather than normal-play progression evidence.

For saved thought-bubble history, Payment tests → Reload factory snapshot serializes and normalizes the current isolated prototype state rather than resetting its factory. Verify assignment acknowledgement after close/reopen and reload, retired hints after later progress, current-primary selection, hidden future clues and a fresh history after Reset example. Slot/copy/autosave tests use in-memory storage; no browser campaign saves are written. See [per-factory history](../../previews/status-page/README.md#hints-and-saved-history).

Test Basics research starts an explicitly stocked separate practice engine. Verify selection alone leaves step 1 waiting, Queue research and double-click share the Assembler-only guard, pause retains progress and step 2 cannot be manually skipped. After five real lab payments, check the four-card explanation. Restart resets only practice; Exit/Finish restore the original prototype queue and paid Cores. This covers three existing Basics stages, not the full lesson or campaign adoption. [Author controls](../../previews/status-page/README.md#basics-research-transition) distinguish synthetic supply/completion from ordinary-clock observation.

Test saved progress checks the approved earned-progress transition without importing campaign slots. Reload must retain the Basic bot, Automata upgrade at 2/5 for all three Cores, two queued projects, explicit pause and parked three-Core payment. Disable Upgrade and resume research to inspect the restored queued payment; re-enable to inspect the unchanged upgrade bill. Existing completions must not replay promotion notices. [Tests](../../previews/status-page/savedProgress.test.ts) additionally cover every Core tier, missing historical predecessors, Final/victory separation, input isolation and exact remaining-cycle completion. This is synthetic compatibility evidence, pending actual screen adoption and campaign/mod-package verification.

Test saved map purchase exercises converted legacy destination quotes. Check the exact 9 Simple/4 Basic bill and 11/13 paid total before/after snapshot reload. Resuming at normal speed must consume only the two outstanding Simple Cores, bank one point, leave E1 locked and resume the queue. In Node Map, activate N1 to spend the point, retaining Home as current and N1 unexplored until travel. [Conversion tests](../../previews/status-page/mapPoints.test.ts) also cover parked quotes, prior banked points, idempotence and source isolation. No campaign slots are imported or written.
