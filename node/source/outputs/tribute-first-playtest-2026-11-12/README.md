# Dwarven Tribute before the corner survey

November 12, 2026

Both routes start from fresh Home and stop on the first Shiny Core production tick. They use the same three seeds, Core consumption pilot bills, Lake protection, 400 ms engine step, and 30-second allowance per new survey. Both pay for the same one-time research and use the same Medium Suppression Bot and Shiny Core factory plans. The clock includes production, shipping, research, and construction timers. Hands-on placement and wiring time are outside the headless measurement.

The corners-first route scouts all four corners and both relevant Golems and selects its later factory sites before building for Dwarven Tribute. The Tribute-first route scouts for a small Dwarven Camp and two suitable Lake sites. Site choice uses only visited maps. The early Shiny factory and its Mythril freight still use normal factory and Road actions. This compares two survey policies through first Shiny, including the sites and freight distances each policy produces.

| Seed | Hydro → Shiny, corners first | Hydro → Shiny, Tribute first | Time saved | Maps opened, corners → Tribute | Gross extraction, corners → Tribute |
| --- | ---: | ---: | ---: | ---: | ---: |
| 680312004 | 2:08:46.8 | 1:32:54.0 | 35:52.8 | 66 → 37 | 19,091 → 17,349 |
| 10 | 2:06:06.4 | 1:12:08.4 | 53:58.0 | 64 → 20 | 19,095 → 16,323 |
| 1361531576 | 2:08:36.0 | 1:07:16.8 | 1:01:19.2 | 66 → 17 | 19,227 → 16,216 |

The Tribute-first route reached Shiny 36–61 minutes earlier. It opened 29–49 fewer maps before Shiny, saving 145–245 Simple Cores at the pilot's five-Core Map Point price. Gross extraction fell by 1,742–3,011 units across the phase. Those totals include stock left in buffers. The one-time research bills matched.

All three Tribute-first runs exceeded the 55-minute upper target. They spent 21:22–46:55 from first Hydro to selecting both factory sites and a further 45:54–47:21 from site selection to first Shiny. On seed 680312004 the small Dwarven Camp was visible 6:27 after first Hydro, but selecting suitable Lake sites took another 40:28. Both factories were built after site selection in these runs. The comparison ends at first Shiny, so later corner surveying, freight and first victory still need measurement with this route.

## Evidence and reproduction

All six paused saves loaded through the save normalizer with one Shiny Core produced. Each pair matched through first Hydro. The corners-first reruns reproduced the first-Shiny times, extraction, and production from the earlier two-channel audits. Each Tribute-first run reached Shiny before visiting any corner.

| Seed | Corners-first audit | Tribute-first audit |
| --- | --- | --- |
| 680312004 | [Audit](680312004-corners-first.json) | [Audit](680312004-tribute-first.json) |
| 10 | [Audit](10-corners-first.json) | [Audit](10-tribute-first.json) |
| 1361531576 | [Audit](1361531576-corners-first.json) | [Audit](1361531576-tribute-first.json) |

Run from the workspace with Node 24. Use `corners-first` and `tribute-first` with each seed and separate output paths.

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --shiny-survey=tribute-first --seed=680312004 --audit=tribute-audit.json --checkpoint=tribute-checkpoint.json
```
