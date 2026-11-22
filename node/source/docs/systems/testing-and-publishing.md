# Testing and publishing

[System index](README.md)

Verification should match the change: catalog consistency, simulation behavior, browser interaction, normal-play balance and live publication establish different things. Keep those claims separate in history and reports.

The frozen refactor/reliability candidate is verified live under NODE-0835 (a8a8d12). Its [publication receipt](../../outputs/node-refactor-preflight-2026-11-21/publication-receipt.json) binds the normal live HTML and current/preceding asset hashes to the exact tested candidate. This establishes delivery; campaign balance, whole-world supported scale and the full accessibility audit retain their separate open requirements.

For a live-game audit, verify served HTML and asset hashes against a frozen release before attributing source findings to the live game. Compare source with explicit line-ending normalization when needed. Keep fresh regression results, isolated defect reproductions and browser observations distinct. Put findings in the requested review destination, indexed by the [review register](../reviews/system-review-temporary.md); a passing suite or link check does not establish error-free gameplay or accurate prose. Label adapted stress fixtures and timeouts explicitly, and keep their results separate from browser performance and normal-play balance.

## Player enjoyment audits

The [fourteen-criterion enjoyment audit and five factory priorities](../reviews/system-review-temporary.md#player-enjoyment-audit) provide a working evaluation rubric, not a validated enjoyment score. Distinguish implemented support, observed defects, hypotheses and missing human/balance evidence. Use U when target-player challenge or current pacing is unmeasured and N/A for optional qualities outside the game's single-player promise; do not sum the ratings. Link existing review IDs rather than duplicate accepted fixes or reopen settled decisions. Keep author studies, current local implementation and verified live releases distinct.

Review one criterion at a time using a native question/review card when a decision is needed, then apply the same decision to linked factory priorities without asking again. Use normal-play tasks to test comprehension, choices, diagnosis, sustained improvement and pacing. Record declared seed/rules, elapsed game time, resources and setup/interaction versus production waiting; synthetic fixtures and passing tests cannot establish player enjoyment. Preserve the current campaign and follow the browser/build guides before running a new playtest.

## Upgrades integration checks

The [focused desktop control checklist](../master-plan/05-interface-and-learning.md#focused-desktop-control-audit-checklist) prepared for E11/SR-21 covers twelve reproducible interaction/accessibility tasks with declared environments, functional acceptance and separate participant-comfort observations. Its execution is pending; it does not import historical browser/test results as fresh passes or close the separate SR-20 distributed-world performance requirement.

The [robot assembly checks](../../previews/status-page/robotAssembly.test.tsx) process real synthetic lab payments for all seven upgrades, distinguish buffered stock/partial cycles from paid Cores, and retain the portrait's paid fraction through disabling, pause and normalized reload. Active cycles flash only the pending synchronized-set hardware; tests cover exact consumption handoff, missing inputs, disabled/paused labs, game/research pause and unrelated research. The author gallery previews the same shared portrait without changing factory state. Finished SVG comparisons and desktop/mobile checks live in `outputs/robot-upgrade-animations/`; processing flash observations live in `outputs/robot-upgrade-processing/`. These are presentation/payment checks, not campaign pacing measurements.

Unmodded Upgrades is now part of the game. [Integration coverage](../../src/ui/UpgradesIntegration.test.tsx) checks initial controls, constrained Basics, actual slot normalization/replacement, old paid-map quotes, preserved contributions/history and the retained applied-mod screen. Queue, synchronized-payment, map and tutorial suites cover the underlying runtime.

Browser verification completed all 19 Basics stages through normal practice placement, extraction, Charcoal/Plate/Gear/Core production, lab delivery and actual five-Core Assembler payment. Selection alone stayed on step 14; queueing advanced while paused, and step 15 waited for payment. Completion explained the four-card queue; Finish returned to the original paused factory. A separate unmodded factory saved through Save / Load, changed upgrade/research-pause state and restored the saved selection, pause and hint archive. No campaign save from another origin was overwritten.

Checked Q/Escape, Tab/Shift+Tab wrap, recipe return focus/scroll and the assignment-sized hint during arrow and wheel navigation. Normal layouts were checked at 1280×720, 960×720, 960×540 and 390×844 (the browser reported 845 px for the mobile override); compact/mobile tutorial panels were also checked without overlap. The disabled character column is hidden in compact practice, and short desktop queues use four compact slots to retain list space. Evidence is in [the integration report](../../outputs/upgrades-integration/verification.json).

Use a separate local origin and an isolated output directory for production-build browser checks when other work also builds the workspace. The reviewed fixed build is outputs/upgrades-integration/game; the author study still exports its independent fixtures. Functional practice and synthetic save regression evidence do not establish full campaign pacing or modded-factory support.

## Landmark headless checks

The [landmark engine suite](../../src/simulation/landmarks.test.ts) audits 1,000 seeds for exact counts, bands, early access, family allocations, quadrant distribution and valid footprints. It exercises all 29 eligible Doubler recipes, fixed speeds, chance outcomes and save/load, branch stock/refunds, shared Core buffers, relocation restrictions and old-save/larger-map compatibility. Controlled synthetic factories use Dev Sources where useful; reserve-consumption cases use real finite reserves. The [presentation suite](../../src/ui/Landmarks.test.tsx) checks hidden Unknown Device recipes/effect, palette, socket geometry and the location-aware hint.

Reports live in outputs/landmark-implementation/. These headless checks verify implementation and regression behavior, not normal campaign pacing or actual Pixi color/contrast. The completed verification record states actual suite/build results.

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
| `npm run progression` | Analytical progression scenarios and reports |
| `npm run balance:audit` | Read-only recipe and balance calculations |

The old `node scripts/sync-progression-content.mjs` command is retired and deliberately exits with status 1 without writing files. It is not a catalog regeneration check. Maintain gameplay through the [owned content modules](recipes.md#maintaining-recipes); the [historical compiler archive](../../scripts/archive/progression-proposal/README.md) preserves its inputs and exact source. [Retirement regressions](../../scripts/compilerRetirement.test.ts) execute copies in disposable workspaces with file-hash comparisons, never the historical writer in this checkout.

The documentation check validates catalog freshness, local file targets and Markdown section anchors in the system library, archive and project entry documents. It accepts angle-bracket paths containing spaces and preserves checks on legacy section links. It does not prove prose matches gameplay or check external URLs. Read the source when reviewing a rule.

The changelog viewer check normalizes CRLF before matching its embedded data, so Windows checkouts verify the same generated content as LF checkouts.

The Road-direction organization pilot retains [recoverable snapshots, a dependency map and actual verification](../../outputs/road-command-refactor/README.md). Its facade regressions cover rejection/no-op history, legacy reversal compatibility, physical and cosmetic cancellation, source-outlet refunds, mixed FIFO stock, one completed-pair publication, undo and replacement. The same eleven cases passed against the original engine before extraction. Workspace totals include preserved release tests under `.artifact-work/`; the report separates those from current-tree passes. The frozen active-factory production sample provides settings and raw metadata for later renderer comparisons, without asserting a pilot speedup or closing multi-map performance coverage.

The [transport extraction evidence](../../outputs/transport-refactor/README.md) freezes Road dispatch, delivery/refunds and local routing as separate slices. Each compares the captured original engine with its slice after every deterministic tick/command and at every publication, using controlled active/blocked/idle factories and read-only historical factory copies. Controlled cases additionally check material conservation, FIFO delivery, empty Roads and reservation limits. Focused Landmark, extraction, Road, routing and mod suites retain special-stock/capacity coverage; three lifecycle regressions cover replacement, Undo and mod deadlines. The Forest input-gate regression now checks actual launches through the engine facade. These are scoped headless regression checks, with no new supported benchmark, performance certification, campaign-save access or balance result.

The [factory command planning evidence](../../outputs/factory-command-refactor/README.md) freezes placement, movement, connection and selection/deletion slices. Deterministic original-engine comparisons check public returns, full command state and every publication for ordinary, Road, protected/paid-layout and modded factories. Seven new facade cases also pass with the original engine, covering replacement active-sector access, stale-preview revalidation and rejected/no-op history behavior. The production FactoryApp browser fixture verifies actual placement, socket wiring, connected movement and decommission/Undo at 1280×720, with autosave disabled on a separate local origin. It exposes read-only observations for verification and does not change game UI or serve as a balance/performance run.

The progression report runner excludes archived release source under `.artifact-work/` so historical copies cannot overwrite the current analysis. Its generated review covers fixed Simple-through-Complex research consumption; Final-Core projects and ordinary-play timing remain outside those totals. The report labels its retained planning context as historical.

## Browser playtests

Read [browser playtests](../browser-playtest.md) before starting or recovering a session. Preserve the current game during recovery. Before a new run, read the [build guide](../playtest-build-guide.md) and reuse verified plans through normal gameplay. Preserve successful branches while testing separate routing experiments.

Balance runs use ordinary play without grants, save injection, accelerated simulation or rule changes. Queue ordinary bugs and design ideas until the run ends. If a progression blocker needs a fix, make the smallest authorized fix, record it and continue. Reports retain resource totals and elapsed game time, distinguishing setup/interaction overhead from production waiting.

The old whole-world engine benchmark is retired. `npm run stress` is removed; direct legacy runner/formatter calls report retirement and exit with status 1 without running workloads or writing reports. The old fixture path contains only a notice and is excluded from current Vitest discovery, including when GAME_STRESS is set. Its [source and checksummed report copies](../../scripts/archive/engine-stress/README.md) are historical evidence. Original reports remain intact under `outputs/stress/`; their old reproduction instructions are not current commands.

Use the active-factory browser fixture below for its documented rendering/simulation measurements and focused Road tests for delivery/conservation correctness. Whole-world multi-map performance coverage remains open: these tools do not replace it. A smaller representative benchmark is deferred until cross-map optimization needs one. Historical synthetic engine timings do not certify browser performance, learning or normal-play completion time. Analytical recipe bills likewise cannot establish delivery feasibility alone.

The [border engine fixture](../../previews/border-obstructions/README.md#real-engine-test) uses actual generation, Road placement, Pixi art and Node Map presentation with synthetic empty fields and explicit research grants. It disables browser-save writes. Terrain selectors, sample navigation and map travel publish sector changes through the engine so paused previews redraw; local label changes alone do not refresh Pixi. The header follows the actual active map, and clear maps disable crossing tools until a terrain example is selected. Run `node scripts/audit-border-obstructions.mjs` to reproduce the 1,100-world static route/quota audit. Functional fixtures and graph safeguards do not certify normal-play purchase timing or routing balance.

The [Upgrades queue lab](../../previews/status-page/README.md#reviewed-presentation-and-controls) is an isolated synthetic Research Center fixture with autosave disabled. Its clock runs at normal speed; separate supply/completion controls seed Cores or step ordinary cycles for interaction review. Use it to check four slots visible by default, single-click selection without payment, double-click queueing exactly once, the Queue research action (including keyboard activation), locked/duplicate/full rejection, automatic advancement, pause/resume icons and retained payments. It does not establish production feasibility or campaign balance. [Runtime tests](../../src/simulation/researchQueue.test.ts) exercise queue order, limits, cancellation, pause and normalized save round trips.

### Bounded transport profile

The [bounded transport/queue profile](../../outputs/transport-profile/README.md) is separate one-off audit evidence. It compares three pristine and three attribution trials plus separate CPU/allocation samples for each declared workload, checks identical final state hashes, and asserts conservation, FIFO order and reservation limits on controlled routes. Instrumentation is confined to output bundles. Cumulative sampled allocation estimates are not retained heap, and headless tick timings are not browser frame timings. It leaves the retired stress command retired and does not close the whole-world browser coverage gap.

The [recovery producer-lookup comparison](../../outputs/recovery-recipe-index/README.md) preserves those pre-change bundles and compares new outcomes against all 48 earlier workers. It also interleaves before/after timings for the archived Shiny/late factories, separating pristine timing from attribution. Keep original reports intact and describe per-tick medians, slow ticks, complete-window cost and sampled allocation separately; an improvement in periodic recovery work does not imply every tick or rendered frame became faster.

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

## Release checkout retention

Generated Vite dependency caches (`node_modules/.vite`) and Vitest transform caches (`node_modules/.vitest-cache`) can be removed independently of installed packages. They regenerate when needed. Obsolete Golem preview document renders and temporary render files under `.artifact-work/golem-camp-preview/` are disposable; retain its `vite.config.ts` authoring source and the original archived documents. The [cache/render cleanup manifest](../../outputs/workspace-cache-render-cleanup-2026-11-21/manifest.json) records exact targets, file/byte counts and protected-source/dependency checks.

Release receipts, source/build manifests, verification reports and saved playtest evidence under `outputs/` remain historical evidence. Keep those files and their parent release folders when removing obsolete `repo/` checkout copies. A cleanup is local tooling work, not a game publication.

Before deletion, check each checkout's tracked and untracked status and verify that its HEAD and every local branch/tag tip are ancestors of the retained history HEAD. Preserve the newest retained history checkout and any checkout with unfinished changes. Check linked worktree ownership so removing an owner cannot break a retained worktree. Resolve deletion paths inside the intended output directory, unlink shared `node_modules` junctions without following them, and reject unexpected reparse points.

Also inspect Git object borrowing through `.git/objects/info/alternates`, including indirect dependencies. An ancestry check can pass while borrowing the very objects scheduled for deletion. Before removing an object-store donor, make retained repositories independent with `git repack -a -d` while the donor is available, remove the alternate only after packing succeeds, then run `git fsck --full --no-dangling` without alternates and repeat the commit-tip checks. A shallow checkout does not establish complete retained history. The [object-history recovery verification](../../outputs/git-history-recovery-2026-11-21/verification.json) records the NODE-0795 correction to the earlier cleanup.

Record exact targets, byte/file counts, retained commits and sibling evidence SHA-256 hashes in a cleanup manifest. Afterwards, verify targets are absent, sibling evidence hashes still match, retained checkout HEAD/status are unchanged and shared dependencies remain intact. The [release-checkout manifest](../../outputs/workspace-cleanup-2026-11-21/manifest.json) supplies this evidence for NODE-0765. The changelog owns the dated cleanup record.

The obsolete `github-pages-deployment` owner and `endgame-git-worktree` are retired. Use [the retained history checkout](../../outputs/node-landmarks-release-2026-11-20/repo) for local Git inspection; historical refs and reflog commit tips are mapped in the [compiled-build/checkouts manifest](../../outputs/compiled-checkout-cleanup-2026-11-21/manifest.json) (NODE-0796). Remove linked worktrees through their owner's `git worktree remove` before deleting the owner. Generated preview build directories can be discarded independently of their surrounding reports and screenshots; retain explicitly referenced frozen builds such as `outputs/live-audit-2026-11-21/build` and `outputs/upgrades-integration/game`.

## Documentation upkeep

The completed standalone refactor's [UI/lifecycle evidence](../../outputs/ui-lifecycle-refactor/README.md) retains pre-change source snapshots, focused/full test JSON, deterministic original-source comparisons, isolated FactoryApp controls and DOM observations, and serial Phase 0/current renderer samples. The [resource](../../src/renderer/playfieldResources.test.ts), [interaction](../../src/renderer/playfieldInteractions.test.ts) and [state lifecycle](../../src/simulation/stateLifecycle.test.ts) regressions cover pending/rejected startup, disposal, live callbacks and state/history/catalog/clock boundaries. Use the documented active-factory protocol for renderer comparisons; keep interaction checks outside timed windows. Synthetic functionality and one-host timing evidence do not replace campaign, balance or whole-world performance validation.

Update the affected system document and regenerate catalogs after a completed system change. Preserve decisions and earlier evidence in their records. Add a stable dated entry using the [changelog procedure](../changelog/README.md), then regenerate and check history. For player-facing style/copy changes, read and update both [style guide](../node-ui-style-guide.md) and [review notes](../typography-style-review.md).

Sources: [package scripts](../../package.json), [architecture tests](../../scripts/architecture.test.ts), [documentation generator](../../scripts/system-docs.mjs), [retired benchmark archive](../../scripts/archive/engine-stress/README.md), [progression runner](../../scripts/run-progression.mjs), [project instructions](../../AGENTS.md).

In the Upgrades prototype, the external Test completion fixture previews its tier-completion notice. The live lab's Complete current test project instead completes the selected project in its existing engine; only a bot upgrade creates the character notice. Check hover/focus benefits, 4.5-second expiry, manual/keyboard dismissal, no historical replay on fixture loads and Final's lack of a next Core or victory claim. See the [prototype guide](../../previews/status-page/README.md#upgrade-benefits-and-completion-notices). These are synthetic UI checks rather than normal-play progression evidence.

For saved thought-bubble history, Payment tests → Reload factory snapshot serializes and normalizes the current isolated prototype state rather than resetting its factory. Verify assignment acknowledgement after close/reopen and reload, retired hints after later progress, current-primary selection, hidden future clues and a fresh history after Reset example. Slot/copy/autosave tests use in-memory storage; no browser campaign saves are written. See [per-factory history](../../previews/status-page/README.md#hints-and-saved-history).

Test Basics research starts an explicitly stocked separate practice engine. Verify selection alone leaves step 1 waiting, Queue research and double-click share the Assembler-only guard, pause retains progress and step 2 cannot be manually skipped. After five real lab payments, check the four-card explanation. Restart resets only practice; Exit/Finish restore the original prototype queue and paid Cores. This covers three existing Basics stages, not the full lesson or campaign adoption. [Author controls](../../previews/status-page/README.md#basics-research-transition) distinguish synthetic supply/completion from ordinary-clock observation.

Test saved progress checks the approved earned-progress transition without importing campaign slots. Reload must retain the Basic bot, Automata upgrade at 2/5 for all three Cores, two queued projects, explicit pause and parked three-Core payment. Disable Upgrade and resume research to inspect the restored queued payment; re-enable to inspect the unchanged upgrade bill. Existing completions must not replay promotion notices. [Tests](../../previews/status-page/savedProgress.test.ts) additionally cover every Core tier, missing historical predecessors, Final/victory separation, input isolation and exact remaining-cycle completion. This is synthetic compatibility evidence, pending actual screen adoption and campaign/mod-package verification.

Test saved map purchase exercises converted legacy destination quotes. Check the exact 9 Simple/4 Basic bill and 11/13 paid total before/after snapshot reload. Resuming at normal speed must consume only the two outstanding Simple Cores, bank one point, leave E1 locked and resume the queue. In Node Map, activate N1 to spend the point, retaining Home as current and N1 unexplored until travel. [Conversion tests](../../previews/status-page/mapPoints.test.ts) also cover parked quotes, prior banked points, idempotence and source isolation. No campaign slots are imported or written.

The frozen [release preflight](../../outputs/node-refactor-preflight-2026-11-21/README.md) checks the exact /node/ build against its source and asset hashes, a separate-origin fresh/archived factory round-trip, ordinary wiring/Undo and Road travel. Keep release code frozen while adding verification metadata, preserve original saves and later concurrent work, and distinguish local preflight from confirmed publication. Recheck remote main and node/-only scope at publication time; verify live HTML/assets before changing delivery records.
