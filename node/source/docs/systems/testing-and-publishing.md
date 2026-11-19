# Testing and publishing

[System index](README.md)

Verification should match the change: catalog consistency, simulation behavior, browser interaction, normal-play balance and live publication establish different things. Keep those claims separate in history and reports.

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

## Browser playtests

Read [browser playtests](../browser-playtest.md) before starting or recovering a session. Preserve the current game during recovery. Before a new run, read the [build guide](../playtest-build-guide.md) and reuse verified plans through normal gameplay. Preserve successful branches while testing separate routing experiments.

Balance runs use ordinary play without grants, save injection, accelerated simulation or rule changes. Queue ordinary bugs and design ideas until the run ends. If a progression blocker needs a fix, make the smallest authorized fix, record it and continue. Reports retain resource totals and elapsed game time, distinguishing setup/interaction overhead from production waiting.

Synthetic stress scenarios bypass ordinary placement and use prepared buffers; they measure the engine in Node. They do not certify browser performance, learning or normal-play completion time. Analytical recipe bills likewise cannot establish delivery feasibility alone.

### Active factory browser test

With the local Vite server running, open `/previews/active-factory/`. This isolated
page imports the current engine and Pixi renderer and starts 300 nodes on one
Map Node, including 120 Production nodes. The load selector also offers 150 and
600 nodes. Each branch has two recipe stages, a Cart and a Warehouse, with Dev
Sources supplying missing ingredients. Production and physical delivery counters
allow repeated activity to be checked separately. Pause/Resume, Reset test,
Fit all and Inspect a line control the fixture and camera.

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

## Publishing

The live game is [NODE](https://bookskaboo.github.io/node/), published from `main` in `bookskaboo/bookskaboo.github.io`. An explicit request to publish authorizes the full release workflow in [project instructions](../../AGENTS.md).

Build with `npm run build:site`, run workspace tests and prepare matching runtime output under `node/` and source under `node/source/`. Confirm changes are confined to `node/` and can fast-forward current remote `main`. Submit the exact commit and destination through the configured approval flow.

After pushing, wait for GitHub Pages and verify normal live HTML plus SHA-256 hashes of every new build asset. Only then update publication history and associate records with that release. A local commit or feature-branch push alone does not publish NODE. If the configured reviewer denies the push, preserve the tested commit and report the denial and exact command for the user.

## Documentation upkeep

Update the affected system document and regenerate catalogs after a completed system change. Preserve decisions and earlier evidence in their records. Add a stable dated entry using the [changelog procedure](../changelog/README.md), then regenerate and check history. For player-facing style/copy changes, read and update both [style guide](../node-ui-style-guide.docx) and [review notes](../typography-style-review.docx).

Sources: [package scripts](../../package.json), [architecture tests](../../scripts/architecture.test.ts), [documentation generator](../../scripts/system-docs.mjs), [stress runner](../../scripts/run-stress.mjs), [progression runner](../../scripts/run-progression.mjs), [project instructions](../../AGENTS.md).
