# Active 2,400-node rendering verification

Local evidence for NODE-0611, November 19, 2026.

| Observation | Before | Optimized |
| --- | ---: | ---: |
| Frame p95 | 166.8 ms | 25.1 ms |
| Frame p99 | 175.1 ms | 41.7 ms |
| Tick p95 | 25.3 ms | 13.5 ms |
| Frames over 33.4 ms | 315 / 315 | 65 / 2,958 |
| Average page FPS | 7.1 | 61.7 |

Both observations used 2,400 nodes, 360 Production nodes, 840 Splitters, 840 Mergers and 3,330 connections at the desktop overview with emphasized real progress bars. The final clean capture had 240 cycling nodes, 52 physical cargo transfers, 1,580 produced and 386 delivered at 53 game seconds. Production and delivery continued past that capture.

The clean samples have similar durations (44.2 versus 47.9 seconds after warmup) and fewer than 3,600 frames each. Average FPS is their frame count divided by their measured duration. These totals are evidence of active work, not matched throughput measurements. The older 600-node test tab remained paused throughout both observations. Only one heavy 2,400-node tab ran, navigated serially between built versions. Values depend on this browser and host.

See verification.json for exact samples, interaction checks and limitations. The final compiled-build smoke sample is stored separately. Normal recipe/transfer timing and the existing 64-animation cap are unchanged. Tests verify sustained delivery through every router port to every final Warehouse over three simulated minutes. All 1,843 workspace tests pass with two existing skips; main/site/preview builds pass. Word structure checks pass, but both render attempts fail because LibreOffice is unavailable. No publication or production-save changes.

An intermediate build failed on an unnamed art child and stopped Pixi rendering. Its apparent 120 FPS reading is discarded. The final build (index-C3RKnDPf.js) guards nullable labels and preserves socket pulse scale during capture; regression checks pass. The final later screenshot shows 61 page FPS, 25.1 ms p95, 2,616 produced and 714 delivered at 85 game seconds, with no new warnings/errors.
