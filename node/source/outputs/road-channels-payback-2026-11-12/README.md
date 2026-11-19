# Road Channels 2 payback through first victory

November 12, 2026

Each pair starts from fresh Home in the same world seed and runs to first victory. Both runs use the Core consumption pilot prices and discover Golems as camps. Both can claim victory after producing the Final Core. The purchase run pays five of every earlier Core plus 12 Complex for Road Channels 2 after Command Robotics. Both runs use Road Channels 1 and the rest of the shared route.

The blind harness opens and visits sectors before inspecting their contents. Each pair surveys the same sectors and selects the same factory sites, sized to accommodate either research bill. The two-channel route can deliver one Foundry ingredient and reuse its Road for the next. At the Grove, it can buffer Stone before switching that Road to Iron Plate. The purchase run can use a third simultaneous Road wherever the site allows it.

The clock includes production, research, freight, normal construction timers, and 30 seconds per new survey. The headless harness places nodes and connects cables immediately, so the results exclude human interaction time. Node and cable counts give context for that difference. Gross extraction includes stock left in buffers and materials that went to other consumers.

## First-victory results

| Seed | Skip Road Channels 2 | Buy Road Channels 2 | Extra time with upgrade | Time saved after late research finished |
| --- | ---: | ---: | ---: | ---: |
| 680312004 | 4:47:30.4 | 5:08:13.2 | 20:42.8 | 0:32.0 |
| 10 | 4:43:26.4 | 5:03:46.0 | 20:19.6 | 0:50.0 |
| 1361531576 | 4:47:55.6 | 5:08:23.2 | 20:27.6 | 0:47.2 |

Buying Road Channels 2 moved the end of the late research sequence back by 21:09.6 to 21:14.8, including the earlier work to supply its bill. The upgrade payment itself took 7:10.0 to 7:15.2 after research was selected. The third channel carried freight at the Foundry and Grove. On all three seeds the two-channel route delivered ceramic electrodes before switching their Roads to sealed frames, then buffered Stone at the Grove before switching its Road to Iron Plate. Once the late research sequence ended, the extra channel shortened the remaining route by 32 to 50 seconds.

| Seed | Gross extraction, skip → buy | Extra units extracted | Node placements, skip → buy | Cables placed, skip → buy | Third-slot lanes that carried freight |
| --- | ---: | ---: | ---: | ---: | ---: |
| 680312004 | 40,594 → 43,130 | 2,536 | 1,432 → 1,431 | 1,736 → 1,737 | 10 |
| 10 | 40,556 → 43,227 | 2,671 | 1,302 → 1,320 | 1,633 → 1,659 | 11 |
| 1361531576 | 40,676 → 43,209 | 2,533 | 1,464 → 1,455 | 1,763 → 1,756 | 10 |

The proposed 37-Core bill did not pay back by first victory on these routes. The test covers a purchase after Command Robotics with a third-channel benefit concentrated in corner freight. Longer-running supply routes or an earlier unlock would expose the upgrade to a different volume of freight.

## Evidence and reproduction

The final comparisons use the `paired/` audits. Both paused victory saves in each pair loaded through the save normalizer. Survey events, site selection, and the sequence of shared research bills matched within each pair.

| Seed | Audit without upgrade | Audit with upgrade |
| --- | --- | --- |
| 680312004 | [Skip](paired/680312004-skip.json) | [Buy](paired/680312004-buy.json) |
| 10 | [Skip](paired/10-skip.json) | [Buy](paired/10-buy.json) |
| 1361531576 | [Skip](paired/1361531576-skip.json) | [Buy](paired/1361531576-buy.json) |

Run from the workspace with Node 24. Use `skip` and `buy` with each seed and separate audit and checkpoint paths.

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --through-victory --road-channels-comparison=skip --seed=680312004 --audit=skip-audit.json --checkpoint=skip-checkpoint.json
```
