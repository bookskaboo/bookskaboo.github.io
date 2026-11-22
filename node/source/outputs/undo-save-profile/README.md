# Undo and save memory profile

Measured November 21, 2026 against current local source (NODE-0801). **Adopted decision (NODE-0802): retain the existing fifty-checkpoint behavior and defer a byte-budget or history-representation redesign.** This sample found bounded retention and working recovery, without a demonstrated need to reduce available undo. Revisit if slower-device testing or larger current factories show a problem. Manual save collection processing remains a possible separate profiling task if save latency becomes an issue; that work has not been authorized by this decision.

## Factories and method

| Factory | Maps | Nodes | Cables | Raw save UTF-8 bytes |
| --- | ---: | ---: | ---: | ---: |
| Fresh seed 10, current new-world rules | 1 | 5 | 0 | 37,666 |
| Archived Shiny playtest, current normalization | 31 | 469 | 333 | 252,998 |
| Archived late playtest, current normalization | 64 | 1,159 | 1,033 | 599,749 |

The Shiny source is `outputs/tribute-first-playtest-2026-11-12/10-tribute-first-checkpoint.json`; the late source is `outputs/live-map-pricing-playtest-2026-11-15/10-final-checkpoint.json`. These are copies of actual archived headless playtest layouts with legacy world rules. Their normalization does not make them current-rule balance runs or establish representative coverage for every campaign, mod, template collection or device. The fresh world includes current saved world metadata even though only five nodes are instantiated.

Node v24.19.0 and the in-app Chromium 157 browser ran on Windows with an AMD Ryzen 9 9900X. Three separate Node processes per factory used five warmups and thirty samples for cloning, serialization and export/normalized import. Each performed seventy-five real `beginMove` checkpoints, varying a camera coordinate and committing the command. History length, oldest eviction, independent copied nodes, fifty-step undo exhaustion and replacement clearing were asserted. These are checkpoint/lifecycle measurements without simulation, Pixi rendering or App subscribers. They do not measure whole-command UI latency or frame time.

Node ran with `--expose-gc`, invoking GC three times before each heap reading. The reported retained heap is the increase above the same engine's no-history baseline, including small measurement bookkeeping. It is **Node V8 retained heap**, not total browser memory or serialized JSON size. Browser runs repeated three trials per factory, with thirty clone/stringify/export samples, seventy-five checkpoints, fifty undos and ten normalized import/autosave/manual-save samples after warmup. Browser timer resolution rounds small samples to zero; this means below resolution, not free work. Each manual-save sample had three populated slots. No Save / Load panel or React subscriber was mounted for writer timings.

## Results

Times below are the range of the three browser trial medians. Heap is the median of three Node retained-heap deltas after fifty checkpoints, in MiB (1,048,576 bytes).

| Factory | Heap at 50 | Clone ms | Checkpoint ms | Autosave ms | Manual save ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fresh | 3.11 MiB | 0.2 | 0.2 | 0.1–0.2 | 2.9–3.4 |
| Shiny, 469 nodes | 19.44 MiB | 1.1–1.2 | 1.1–1.2 | 0.8–1.2 | 11.7–13.1 |
| Late, 1,159 nodes | 45.64 MiB | 2.5–2.6 | 2.6–2.7 | 4.6–4.9 | 26.2–28.3 |

At seventy-five commands, only fifty checkpoints remained and measured retention was effectively unchanged (less than 0.001 MiB growth). After fifty undos, the retained-heap delta fell to about 0.17/0.53/1.04 MiB respectively. This remaining delta includes the restored current-state copy; undo does not make the whole engine disappear. Replacement cleared command history. These observations do not prove the absence of every possible leak in a long-running rendered campaign.

The late factory's worst trial checkpoint p95 was 6.7 ms; manual-save p95 reached 43.1 ms. Saving a slot clones the target, reads/serializes the complete collection, writes it synchronously, then normalizes the returned slots. This profile measures that complete operation but does not attribute the cost among those phases. A later optimization should measure those phases and preserve raw sibling payloads and slot-error isolation. No writer or history representation was changed here.

## Native storage failure and recovery

The isolated browser origin was `http://127.0.0.1:4293`, with an empty-storage guard before the run. Three copies of the late factory plus its autosave used 2,398,805 value code units, excluding storage keys. That fit in this browser. Filling a separate disposable key reached a native `QuotaExceededError` at 5,242,880 total key/value code units. This observed quota is specific to this browser/profile; it is not a promised save capacity or a conversion from UTF-8 file bytes.

At exhaustion, replacing a small autosave with the late factory failed and set the engine's save-failure status. The old autosave string remained byte-for-byte intact. A growing manual-slot write also failed, leaving the complete prior slot collection intact. The current large factory serialized and parsed through the real portable-save functions while storage was full. Removing the filler allowed Retry to save it and clear the status; a manual save then succeeded. All four disposable profiling keys were removed and storage returned to empty. No campaign origin or browser save was accessed.

This checks native quota behavior through real persistence/engine APIs. It does not exercise the download chooser, the visible warning component or every automatic interval in this browser run; their existing focused regressions cover those paths. Node also asserted deterministic failed-write preservation/export/retry for all three factory sizes.

## Evidence and reproduction

- [Node trials, environment and source fingerprints](node-results.json)
- [Browser trials and native quota assertions](browser-results.json)
- [Computed comparison](summary.json)
- [Browser recovery proof](storage-recovery.jpg)
- [One-off Node harness](profile.ts) and [browser harness](browser/main.ts)

The run verified unchanged SHA-256 hashes for all 377 captured `src/` files and the two original archive snapshots, including after browser measurements. Original snapshots remain untouched. This adds audit evidence and documentation only; there is no gameplay change, new supported benchmark command, production build or publication. A new full gameplay suite was unnecessary for unchanged runtime source.

From the project root, reproduce the Node run with installed workspace dependencies:

```powershell
node --input-type=module -e "import {build} from 'vite'; await build({configFile:false,build:{ssr:'outputs/undo-save-profile/profile.ts',outDir:'outputs/undo-save-profile/compiled',rollupOptions:{output:{entryFileNames:'profile.mjs'}}}});"
node outputs/undo-save-profile/compiled/profile.mjs
```

For browser reproduction, start Vite on a dedicated unused origin, open `/outputs/undo-save-profile/browser/`, run the measurements and then the storage recovery check. Use only a disposable empty origin; the guard refuses existing storage. Browser results must be captured before reload. The fixture deliberately measures only the three declared factories and does not replace the retired whole-world benchmark.
