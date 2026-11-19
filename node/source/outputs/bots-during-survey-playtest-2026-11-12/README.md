# Medium Bot production during the Shiny survey

November 12, 2026

The test starts from fresh Home on the three Tribute-first seeds and ends on the first Shiny Core production tick. Once the harness finds a small Dwarven Camp and a suitable Lake for Medium Bots, it pays for Sealed Robotics, builds the Bot factory, and ships its output to staging Carts at the camp. It continues scouting for the Shiny factory site while the Bot line runs. The route still stages 34 Bots before feeding the camp and uses the established Shiny factory and Tribute shipment plan.

The control is the previous Tribute-first run on each seed, which finished choosing both Lake sites before building either factory. Both routes use the Core consumption pilot, a 400 ms engine step, and the same 30-second allowance per new survey. The clock includes production, freight, research, and construction timers. Hands-on placement and wiring are outside the headless measurement.

| Seed | Hydro → Shiny, previous route | Hydro → Shiny, Bots during survey | Time saved | Maps opened in both | Bots staged when both sites were chosen |
| --- | ---: | ---: | ---: | ---: | ---: |
| 680312004 | 1:32:54.0 | 1:11:03.6 | 21:50.4 | 37 | 40 |
| 10 | 1:12:08.4 | 59:03.6 | 13:04.8 | 20 | 0 |
| 1361531576 | 1:07:16.8 | 1:01:18.4 | 5:58.4 | 17 | 0 |

The earlier factory shortened Hydro to Shiny on all three seeds. The routes visited the same maps in the same order and paid the same bills. Gross extraction during the phase was identical on seeds 680312004 and 10. Seed 1361531576 extracted 10 fewer units and used the two Lake sites in the opposite roles, so its measured gain includes the effects of different freight distances. On the other seeds, the earlier build used the same factory sites as the control.

The closest run missed the 55-minute upper target by 4:03.6. The slowest missed it by 16:03.6 even though it already had 40 Bots staged when it chose the Shiny site. These runs end at first Shiny. First-victory time remains open.

## Evidence and reproduction

All three paused saves loaded through the save normalizer at the first Shiny Core. Each run matched its control through first Hydro and verified an earlier Bot build before the Shiny site was selected. [Control audits](../tribute-first-playtest-2026-11-12/README.md#evidence-and-reproduction)

| Seed | Bots during survey audit |
| --- | --- |
| 680312004 | [Audit](680312004.json) |
| 10 | [Audit](10.json) |
| 1361531576 | [Audit](1361531576.json) |

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --shiny-survey=bots-during-survey --seed=680312004 --audit=bots-audit.json --checkpoint=bots-checkpoint.json
```
