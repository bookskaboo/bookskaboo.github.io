# Documentation archive

Use the [system library](../systems/README.md) for current mechanics and exact generated catalogs. Archived references preserve earlier rules, assumptions and proposals so decision history remains understandable.

## Superseded references

| Snapshot | Why retained |
| --- | --- |
| [Project README before cleanup](reference-snapshots/project-readme-2026-11-18.md) | Former feature summaries, progression goals, estimates and follow-up lists; many numbers predate the current game |
| [Former research catalog](reference-snapshots/research-catalog-2026-11-18.md) | Mixed current/planned research summaries, former map schedules and dated recipe notes |
| [Bot production history](bot-production/README.md) | Earlier part-matrix and robotics proposals |
| [Original Word style references](style-reference-docx/README.md) | Retired source snapshots; the maintained guide and review notes now use Markdown |
| [Progression proposal compiler](../../scripts/archive/progression-proposal/README.md) | Exact compiler/helper source and analytical inputs with SHA-256 manifest; source-writing entry point retired |
| [Whole-world engine benchmark](../../scripts/archive/engine-stress/README.md) | Retired runner, fixture and formatter plus unchanged historical reports and SHA-256 manifest |

The root README is now a project entry point. The old `docs/research-catalog.md` path remains a short historical index with its section anchors, preserving earlier links and changelog evidence paths.

## Records still in use

The [master plan](../master-plan/README.md), [progression discussion](../progression-and-scaling.md), [obstruction review](../obstruction-types-and-behavior.md), playtest reports and [change history](../changelog/README.md) retain decisions, evidence or pending work. They are not replaced by implementation summaries. Publication receipts and saved playtest states under `outputs/` remain evidence rather than disposable build output.

Temporary document renders, compiled preview bundles, stale process logs and incremental compiler caches can be regenerated. The [reference-cleanup manifest](../../outputs/workspace-cleanup-2026-11-18/manifest.json) lists the removed temporary files; original authoring scripts and preview sources remain available.

The [cache/render cleanup manifest](../../outputs/workspace-cache-render-cleanup-2026-11-21/manifest.json) records removed Vite/Vitest caches and old Golem preview document renders, including exact file inventories and preservation checks. Keep the preview's `vite.config.ts`, installed dependencies and original archived documents; caches regenerate when the development and test tools need them.

Older release `repo/` checkout copies can be removed after confirming clean tracked/untracked status and that their HEAD commits and local branch/tag tips remain in a retained checkout. Keep release parent folders, receipts, manifests, reports and saved playtest evidence. Preserve checkouts with unfinished changes. Unlink shared dependency junctions without deleting their targets, and check linked worktrees before removing their owning repository. The [release-checkout cleanup manifest](../../outputs/workspace-cleanup-2026-11-21/manifest.json) records exact removed paths, retained history, sibling evidence hashes and preservation checks. See [checkout retention](../systems/testing-and-publishing.md#release-checkout-retention) for the procedure; change history is recorded under NODE-0765.

Retained Git history must also be independent of deleted object-store donors: check alternates, internalize borrowed objects and pass a full integrity check without them before deletion. The [history recovery verification](../../outputs/git-history-recovery-2026-11-21/verification.json) records the completed dependency repair; NODE-0795 owns that correction.

The [compiled-build and old-checkout cleanup manifest](../../outputs/compiled-checkout-cleanup-2026-11-21/manifest.json) identifies removed generated build folders and retired deployment checkouts, maps their original refs/reflog tips, and records hashes for preserved reports and source. Historical Git inspection now uses the self-contained [retained history checkout](../../outputs/node-landmarks-release-2026-11-20/repo). The dated removal record is NODE-0796; keep the surrounding test reports, publication evidence and playtest saves.
