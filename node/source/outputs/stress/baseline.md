# Current engine stress test

Run: 2026-10-31T00:13:49.773Z. CPU: AMD Ryzen 9 9900X 12-Core Processor. Runtime: v24.19.0.

Each case uses five simulated seconds of warmup followed by 30 measured seconds at 100 ms per tick. Sources contain preloaded wood. Production networks convert wood to charcoal; continuous logistics networks pass wood through joints. Each network has six nodes, four local cables, and one paired road link. Road destinations are adjacent maps except in the one-map control.

| Maps | Networks per map | Workload | Nodes | Road pairs | Mean tick ms | 95th percentile ms | Worst tick ms | Ticks over 100 ms | Peak travelling items | Delivered items |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4 | Production | 24 | 4 | 0.02 | 0.05 | 0.93 | 0/300 | 16 | 28 |
| 25 | 4 | Production | 600 | 100 | 0.15 | 0.45 | 1.31 | 0/300 | 400 | 700 |
| 121 | 4 | Production | 2904 | 484 | 0.79 | 2.93 | 7.62 | 0/300 | 1936 | 3388 |
| 121 | 12 | Production | 8712 | 1452 | 4.26 | 19.60 | 59.37 | 0/300 | 5808 | 10164 |
| 121 | 32 | Production | 23232 | 3872 | 32.44 | 169.82 | 673.97 | 31/300 | 15488 | 27104 |
| 121 | 4 | Continuous logistics | 2904 | 484 | 4.01 | 25.09 | 39.09 | 0/300 | 4840 | 14520 |
| 121 | 12 | Continuous logistics | 8712 | 1452 | 33.93 | 229.50 | 370.02 | 41/300 | 14520 | 43560 |
| 121 | 32 | Continuous logistics | 23232 | 3872 | 242.12 | 1646.54 | 2386.44 | 66/300 | 38720 | 116160 |

Every completed case checks delivery to every destination storage, integer/nonnegative inventories, and conservation of all items, including items travelling through cables. Wood-to-charcoal production is one-for-one, so total item count must remain constant.

The 100 ms threshold is the simulation update interval. Browser rendering shares the main thread, so visible stutters can occur well below that threshold. These timings are a single run on this machine, not universal capacity limits.

| Maps | Networks per map | Workload | Serialized state MB | Serialization ms | One state clone ms |
| --- | --- | --- | --- | --- | --- |
| 1 | 4 | Production | 0.01 | 0.06 | 0.13 |
| 25 | 4 | Production | 0.19 | 0.56 | 1.25 |
| 121 | 4 | Production | 0.92 | 1.82 | 5.81 |
| 121 | 12 | Production | 2.73 | 5.75 | 17.58 |
| 121 | 32 | Production | 7.29 | 16.15 | 65.17 |
| 121 | 4 | Continuous logistics | 0.90 | 2.25 | 6.45 |
| 121 | 12 | Continuous logistics | 2.65 | 6.14 | 21.55 |
| 121 | 32 | Continuous logistics | 7.07 | 14.84 | 54.93 |

Serialization and a single clone are measured separately from tick time. Autosave writes and accumulated undo snapshots are excluded.

Limits:

- Engine only; no React/Pixi rendering, browser scheduling, autosave writes, or undo history.
- Synthetic graphs bypass placement/collision checks; one-map control uses a local road pair.
- Production converts wood to charcoal one-for-one; logistics uses joint pass-throughs.
- Generated terrain, camps, extraction, complex recipe mixes, map-switch catch-up, and blocked-road accumulation are not covered.
- Listener notifications are counted, but React/Pixi work is excluded.

Reproduce with `npm run stress`. Raw measurements: `outputs/stress/latest.json`.
