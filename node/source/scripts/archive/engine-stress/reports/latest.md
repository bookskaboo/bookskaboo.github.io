# Current engine stress test

Run: 2026-11-02T08:04:42.458Z. CPU: AMD Ryzen 9 9900X 12-Core Processor. Runtime: v24.19.0.

Each case uses five simulated seconds of warmup followed by 30 measured seconds at 100 ms per tick. Sources contain preloaded wood. Production networks convert wood to charcoal; continuous logistics networks pass wood through joints. Each network has six nodes, four local cables, and one paired road link. Road destinations are adjacent maps except in the one-map control.

| Maps | Networks per map | Workload | Nodes | Road pairs | Mean tick ms | 95th percentile ms | Worst tick ms | Ticks over 100 ms | Peak travelling items | Delivered items |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4 | Production | 24 | 4 | 0.05 | 0.16 | 1.24 | 0/300 | 12 | 20 |
| 25 | 4 | Production | 600 | 100 | 0.73 | 2.64 | 8.59 | 0/300 | 300 | 500 |
| 121 | 4 | Production | 2904 | 484 | 3.39 | 18.18 | 51.10 | 0/300 | 1452 | 2420 |
| 121 | 12 | Production | 8712 | 1452 | 26.85 | 160.54 | 533.64 | 22/300 | 4356 | 7260 |
| 121 | 32 | Production | 23232 | 3872 | 185.79 | 1006.86 | 3237.94 | 92/300 | 11616 | 19360 |
| 121 | 4 | Continuous logistics | 2904 | 484 | 7.01 | 25.18 | 104.93 | 2/300 | 968 | 2904 |
| 121 | 12 | Continuous logistics | 8712 | 1452 | 35.06 | 160.43 | 542.70 | 24/300 | 2904 | 8712 |
| 121 | 32 | Continuous logistics | 23232 | 3872 | 217.23 | 1082.66 | 3542.08 | 84/300 | 7744 | 23232 |

Every completed case checks delivery to every destination storage, integer/nonnegative inventories, and conservation of all items, including items travelling through cables. Wood-to-charcoal production is one-for-one, so total item count must remain constant.

The 100 ms threshold is the simulation update interval. Browser rendering shares the main thread, so visible stutters can occur well below that threshold. These timings are a single run on this machine, not universal capacity limits.

| Maps | Networks per map | Workload | Serialized state MB | Serialization ms | One state clone ms |
| --- | --- | --- | --- | --- | --- |
| 1 | 4 | Production | 0.01 | 0.06 | 0.13 |
| 25 | 4 | Production | 0.20 | 0.50 | 1.67 |
| 121 | 4 | Production | 0.98 | 1.45 | 5.80 |
| 121 | 12 | Production | 2.89 | 5.92 | 23.91 |
| 121 | 32 | Production | 7.71 | 15.24 | 66.55 |
| 121 | 4 | Continuous logistics | 0.96 | 2.10 | 7.87 |
| 121 | 12 | Continuous logistics | 2.82 | 6.62 | 24.95 |
| 121 | 32 | Continuous logistics | 7.53 | 17.62 | 68.38 |

Serialization and a single clone are measured separately from tick time. Autosave writes and accumulated undo snapshots are excluded.

Limits:

- Engine only; no React/Pixi rendering, browser scheduling, autosave writes, or undo history.
- Synthetic graphs bypass placement/collision checks; one-map control uses a local road pair.
- Production converts wood to charcoal one-for-one; logistics uses joint pass-throughs. Warehouses replace legacy Storage sinks; old timing baselines are not directly comparable.
- Generated terrain, camps, extraction, complex recipe mixes, map-switch catch-up, and blocked-road accumulation are not covered.
- Listener notifications are counted, but React/Pixi work is excluded.

Reproduce with `npm run stress`. Raw measurements: `outputs/stress/latest.json`.

## Before and after

Baseline timings are from the original engine on the same machine. Performance varies between runs. Delivery counts and peak in-flight counts are compared to check that the workload stayed the same.

| Maps | Networks per map | Workload | Before mean ms | After mean ms | Speedup | Before worst ms | After worst ms | Delivery/peak counts match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4 | Production | 0.02 | 0.05 | 0.3x | 0.93 | 1.24 | No |
| 25 | 4 | Production | 0.15 | 0.73 | 0.2x | 1.31 | 8.59 | No |
| 121 | 4 | Production | 0.79 | 3.39 | 0.2x | 7.62 | 51.10 | No |
| 121 | 12 | Production | 4.26 | 26.85 | 0.2x | 59.37 | 533.64 | No |
| 121 | 32 | Production | 32.44 | 185.79 | 0.2x | 673.97 | 3237.94 | No |
| 121 | 4 | Continuous logistics | 4.01 | 7.01 | 0.6x | 39.09 | 104.93 | No |
| 121 | 12 | Continuous logistics | 33.93 | 35.06 | 1.0x | 370.02 | 542.70 | No |
| 121 | 32 | Continuous logistics | 242.12 | 217.23 | 1.1x | 2386.44 | 3542.08 | No |
