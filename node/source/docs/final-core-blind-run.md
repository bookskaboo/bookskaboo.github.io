# Blind map simulation to the first Final Core

This run compares a fresh map survey against the saved seed-10 route. Both routes aim to produce one Final Core after using a Dwarven settlement and the Mythril and Iron Golems. [Seed-10 benchmark](final-core-dry-run.md) · [Paused seed-10 checkpoint](../outputs/final-core-engine-run/seed-10-checkpoint.json)

The resource-protection replay delivered **one Final Core to a Home Cart at 8:58:22** of simulated time. It visited 76 new maps and took **4:27:17** longer than seed 10. Both checkpoints were loaded through the game’s save normalizer and retained one Final Core in a Home Cart. [Paused blind checkpoint](../outputs/final-core-blind-run/checkpoint.json) · [Engine result and factory layout](../outputs/final-core-blind-run/verified.json)

## What the explorer knew

The game drew seed **1361531576** on the first attempt. The policy had the grid, Home, and the corner coordinates. It learned resource totals, terrain, encounter types, and which challenge occupied each corner only after paying for activation and visiting the map. It selected Yin and Yang from the recipes the game exposed after the first piece. The explorer and its factory code already knew the recipes, production ratios, and Road rules.

The policy surveyed nearby maps, connected the four visible corners using a shared spine, then looked for a small Dwarven Camp, both target Golems, and Lakes with reserves large enough for the independent production districts. It added a Core bank when booked production could no longer cover the next research quote. Shiny and Complex research followed the scouting campaign, so their Cores were reserved for technology in this run. The policy charged 30 seconds of active simulation for each new survey. Production continued during that interval.

The harness replayed the same random seed after correcting a repeated Cart connection and adding retirement of fully delivered Core routes. Every replay started at fresh Home and rebuilt its own survey. The second attempt stopped when old research routes filled the available Road slots even though other surveyed maps still held resources.

## What happened without reserving factory sites

The unreserved attempt reached all four corners at about **1:46**. The small Dwarven Camp appeared around **2:06**, the Mythril Golem at **5:15**, and the Iron Golem at **5:41**. It still needed industrial Lakes for the Bot factories. The policy picked research sites largely by distance to Home, so it repeatedly used the larger Lakes at `(10,8)`, `(7,8)` and `(9,2)` to make Hydro Cores for more Map Points. Their remaining ore then fell below the requirements for the factories that had prompted the search.

I stopped that attempt after **82 activations**, with its last recorded milestone at about **8:41:38**. It had reached the four corners and found both Golems. Its site requirements were still unmet when it stopped. [Survey and production trace](../outputs/final-core-blind-run/unreserved-lakes.log)

## Recovery policy and revealed sites

A resource-protection replay kept the seed and rebuilt the survey from fresh Home. It prioritized ordinary maps for dry Core production and smaller Lakes for Hydro, preferred one Home entry per Core, and deferred Hydro research until after the scouting route was paid. Its midfield search prioritized maps five moves from Home when available. The route choice still used coordinates and newly visited maps. Metered inputs kept the Medium Bot factory within its local reserve budget. The harness staged 15 of each lower Core at Home for the remaining research, then retired the Core Roads to make space for Tribute shipments.

The policy completed scouting at **4:40:42**, with **76 activations** including Exploration. The Mythril Golem was at `(4,1)`, the Iron Golem at `(6,9)`, and the chosen small Dwarven Camp at `(8,4)`. All four corner challenges moved relative to seed 10.

The engine cleared the Mythril Golem with 15 Command Bots. The next cargo route ran into a blocked cable corridor across a surveyed map. I resumed from the paused Golem checkpoint at the same game clock, removed the completed freight routes, and routed the Iron attack around the blocked crossing. When concurrent late cargoes filled the Road slots, I restarted the continuation from the same checkpoint and brought the Foundry and Grove pieces home first. Their retired lanes made room for Mythril freight to the Dragon factory. Both recoveries kept the surveyed map choices. [Scouting and attack trace](../outputs/final-core-blind-run/pre-resume.log) · [Mythril Golem checkpoint](../outputs/final-core-blind-run/mythril-milestone.json)

| Campaign | Revealed production map | Delivery |
| --- | --- | --- |
| Dwarven Tribute | `(7,8)` Lake | Medium Bots to `(8,4)` |
| Shiny and Complex research | `(3,5)` Lake | Cores to Home |
| Mythril Golem attack | `(7,1)` Lake | Command Bots to `(4,1)` |
| Iron Golem attack | `(5,7)` Lake | Command Bots to `(6,9)` |
| Ancient Dragon | `(10,8)` Lake | Command Bots to the northeast corner |
| Ancient Foundry | `(7,1)` for hydraulic parts and `(0,1)` for gears | Three solid cargoes to the northwest corner |
| Elder Grove | Local Wood and Stone and Plates made at the Iron Golem | Supplies to the southwest corner |
| Ancient Reclamation | Fines from the Dragon factory | Fines to the southeast corner |

The 75 Map Node purchases used **1,145 Simple, 1,100 Basic, and 1,025 Automata Cores**. The whole research bill, including the later technology projects, was **3,670 Cores**, compared with **1,243** in seed 10. Survey time totaled 38 minutes by assumption and overlapped production. Waiting for additional Core banks and funding the next Map Node contributed much more to the scouting clock.

## Measured timing

| Milestone | Seed 10, surveyed in advance | Seed 1361531576, resource-protection replay |
| --- | ---: | ---: |
| All four corners visited | 3:45:03 | ~1:37:02 |
| Maps opened beyond Home | 38 | 76 |
| Scouting and factory sites settled | Before the clock | ~4:40:42 |
| First Dwarven Mythril Tribute | 1:42:46 | ~5:44:28 |
| Command Robotics and Road Channels 2 | 2:03:25 | ~6:03:08 |
| Mythril Golem defeated | 2:57:23 | 6:57:35 |
| Iron Golem defeated | 3:30:01 | 7:30:43 |
| Foundry and Grove pieces at Home | By 3:48:22 | 7:42:40 |
| Reclamation piece at Home | By 3:48:22 | 8:08:29 |
| Dragon piece at Home | 4:30:22 | 8:57:39 |
| **One Final Core in the collection Cart** | **4:31:05.4** | **8:58:22.0** |

The blind route reached the four corners early. It then spent about three more hours finding both Golems and choosing suitable factory sites while paying the rising Map Node prices. The Dragon was the last factory on the critical path. Once the Foundry and Grove Roads were free, its first Bot took **29:52** and all 21 took **1:13:56**. The Reclamation received its 20 Fines from the same line before the Dragon was defeated. The Dragon piece then crossed ten Roads to Home. The remaining assembly and cable transfers took **43.2 seconds**. [Continuation trace](../outputs/final-core-blind-run/run.log)

| Gross extraction | Wood | Copper | Iron | Stone | Water | Mythril |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Seed 10 | 21,949 | 22,531 | 18,087 | 1,131 | 6,108 | 1,148 |
| Seed 1361531576 | 30,752 | 34,958 | 23,300 | 1,880 | 5,428 | 1,461 |

Gross extraction includes staged and unused material. The finished save and production totals cover the full run. The JSON district, cable-placement and freight counters cover the continuation after the Mythril checkpoint. The separate scouting trace covers the earlier decisions.

The comparison shows one possible first-map experience. The seed, exploration policy and freight schedule differ, and the successful replay incorporates lessons from the unreserved attempt. The offline harness already knew recipes and wiring patterns. Placement and routing corrections were instantaneous in the simulated clock. It advanced the normal engine in 400 ms steps for the successful replay and 100 ms for the seed-10 benchmark. The clocks measure engine progression with the stated survey allowance. Human setup, learning and troubleshooting time were outside the clock.

## Reproduce the continuation

Run from the workspace with Node 24 and the saved Mythril checkpoint. [Engine harness](../scripts/final-core-engine-run.mjs) · [Map-blind policy](../scripts/final-core-blind-run.mjs)

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --resume=outputs/final-core-blind-run/mythril-milestone.json --prior-trace=outputs/final-core-blind-run/pre-resume.log --layout
```
