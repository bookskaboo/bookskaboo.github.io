# Core consumption balance proposal

November 12, 2026 · Experimental proposal

## November 14 local balance patch

The local base game uses the pilot recipe changes and the rounded milestone bills below. The three matched peripheral runs use the standard recipe and milestone catalogs with a five-Simple Map Point override. They reproduce the earlier unupgraded results through first victory. The experimental 40% Core Assembly Efficiency project remains confined to the comparison harness. [Patch verification and pacing findings](../outputs/first-balance-patch-2026-11-14/README.md)

## November 14 proposed research prices and resource supply

Increase paid, one-time research bills through Complex so higher tiers put progressively more pressure on resource supplies. For each project, multiply its current bill by the factor for the highest Core it requires, then round each positive Core amount up to a multiple of five. Apply the same factor to every Core already in the bill. Keep the opening Assembler, Exploration, Road, and Automata Core projects at five per required tier for the first trial. Keep Tree Planter and the first Mineral Regeneration unlock affordable so a player can invest in sustaining production while a deposit still has reserves. Victory still uses one of each Core. Extra Map Points require a separate schedule because scouting is itself one way to respond to resource shortages.

| Highest Core in the bill | Price multiplier before rounding | Example using the local patch price |
| --- | ---: | --- |
| Simple | 1.10× | A five-Simple bill becomes ten. |
| Basic | 1.20× | A ten-set bill becomes fifteen. |
| Automata | 1.35× | Hydraulic Assembly goes from 15 to 25 of each required Core. |
| Hydro | 1.50× | Ore Separation goes from 20 to 30 of each required Core. |
| Shiny | 1.75× | Heavy Robotics goes from 20 to 35, and Precision Control from 30 to 55. |
| Complex | 2.00× | Command Robotics goes from 30 to 60 of each required Core. |

Repricing the same fixed projects paid in the seed `10` matched victory would raise the Hydro bill from 116 to 211, Shiny from 81 to 151, and Complex from 31 to 61. The standard recipe expansion for that research raises gross Copper demand from 9,782 to 17,830, Iron from 6,030 to 11,072, Wood from 8,324 to 15,240, and Mythril from 256 to 488. The calculation batches shared inputs and excludes Map Points, the Final Core's corner ingredients, encounter supplies, and unused stock. It estimates resource demand for the same projects. Factory routes and elapsed time still need playtesting.

- **Regenerate and keep shipping.** Buy Mineral Regeneration before deposits empty and use Tree Planters where Wood supply is the constraint. Base Mineral Regeneration returns two units per minute per deposit, so test how much stock refills while other factories run and whether the player has a reason to invest in more throughput.
- **Secure a Golem reserve.** Pay the one-time Bot bill to secure the scarce mineral, then ship ore or processed intermediates to the rest of the network. Golem reserves address mineral demand. The factory still needs Wood and other inputs.
- **Open and use more maps.** Bring surveyed suppliers online as the starter reserves run down. Keep Basic and Hydro freight available when buying maps, and introduce higher Cores into Map Point prices after their first production so players can still scout for their first factory site.

Test the three matched seeds with comparable prior factory plans. Measure the first reserve shortage, extraction by source, regenerated units actually harvested, Golem reserve output, new maps that supply working factories, and time through first victory. Use the results to check whether each supply strategy can carry the required bills and whether the growing bills create a reason to invest before reserves run out. [Matched run and Map Point failures](../outputs/first-balance-patch-2026-11-14/README.md)

## Current decision

Resource Golems are discoverable special camps. Deliver Suppression Bots directly after visiting the camp. The one-time AP requirement replaces the research bill. The tested Hydro and Shiny Survey versions below are historical comparisons. The current pilot keeps the other price changes and omits the Survey payment.

The progression design lets players reach first victory through the essential Core production path. The Road Channels 2 follow-up removed the earlier pilot's victory prerequisite for both routes. All six runs won. The third channel saved 32 to 50 seconds after late research finished, while buying it made first victory 20:19.6 to 20:42.8 slower overall. The comparison used the pilot price of five of each earlier Core plus 12 Complex. [Paired playtest](../outputs/road-channels-payback-2026-11-12/README.md) · [Progression and Scaling Design](progression-and-scaling.md#problem-2-progression-demand-and-scaling)

The completed controlled comparison used five Simple Cores per Map Point. The next pricing trial uses the destination tier and quotes the bill before purchase.

### Map prices by destination tier

Each band starts at **five of each required Core** and tracks its own openings. Add five of every required Core after each opening in tiers 1–2, and after every two openings in the other bands. The first non-Home map is free and counts toward its band's openings. Home does not count. Tier 10 corners cost one extra Complex Core on top of their band price.

| Map tiers | Required Cores | Openings per price increase |
| --- | --- | ---: |
| 1–2 | Simple | 1 |
| 3–4 | Simple, Basic | 2 |
| 5–6 | Simple, Basic, Automata | 2 |
| 7 | Simple, Basic, Automata, Hydro | 2 |
| 8 | Simple, Basic, Automata, Hydro, Shiny | 2 |
| 9–10 | Simple, Basic, Automata, Hydro, Shiny, Complex | 2 |

For example, the first two tier 7 maps each cost five Simple, five Basic, five Automata, and five Hydro. The third and fourth each cost ten of every required Core.

| Route | Map Cores at the flat five-Simple price | Map Cores at the proposed price | Starting Wood, Copper, Iron and Stone used by maps plus first-victory research | Starting Wood, Copper, Iron and Stone used by maps plus every research card |
| --- | ---: | ---: | ---: | ---: |
| Seed 10, 60 maps | 295 | 3,114 | 11.8% | 66.9% |
| Seed 680312004, 94 maps | 465 | 7,454 | 13.2% | 45.4% |
| Seed 1361531576, 82 maps | 405 | 7,329 | 12.9% | 50.8% |
| Full board, 120 maps | 595 | 12,539 | 15.6% | 39.6% |

The estimate uses the recorded map routes, current research bills, and standard recipes. It includes corner deliveries for Final Cores and the first rank of each repeatable research. It excludes Mythril supply Bot costs and gives no credit for recycling or regeneration. It compares the four ordinary materials against starting reserves. Water and Mythril come from separate supplies. The player selects a destination on the Node Map, checks its Core cost, and starts research. The payment opens that destination. These figures reprice old routes and do not measure time with the new prices. [Matched routes and checkpoints](../outputs/first-balance-patch-2026-11-14/README.md)

Scout for Dwarven Tribute before the corners and start the Medium Bot factory while looking for a Shiny Lake. Budget that Lake for Shiny and use surveyed suppliers for missing solids. Make transportable intermediates near their sources and send them toward assembly sites nearer Home for the first six Cores. Keep Water-dependent processing at Lakes. Choose the Complex site separately and use peripheral factories and Roads to supply the four corners.

### Exploration and factory location

Exploration should give the player more usable production capacity. Show the upcoming research bills and the inputs those Cores need so players can scout for a particular reserve or Lake before the current line runs short. Start with nearby supplies for the opening. At Hydro and later tiers, use outer resource maps for extraction, smelting, and compact solid intermediates where doing that work locally reduces the cargo that has to cross each Road. Bring those streams inward to build more complex parts and assemble Cores nearer Home. Keep wet processing at Lakes and ship its solid outputs. For example, a peripheral ore map can send plates toward a Lake. The Lake can send Hydro Pistons to a more central Complex line alongside Circuits and Mythril parts from other suppliers. Use outer factories near the four corners for the local challenge deliveries.

Keep the first layout comparison at five Simple Cores per Map Point. Give both routes the same research bills and efficiency choices. Compare a factory that sources most solids locally with one that deliberately adds surveyed suppliers and ships intermediates inward. Record which shortages each opened map solves, resource units and Road crossings per delivered Core, research wait, and total placements and connections through victory. Count a new map as useful when it feeds a working line or opens a freight route that line uses. Use the measured difference to tune reserve distribution or the material demand of shared intermediates.

The matched peripheral runs shipped Circuit A into Shiny and Circuit A plus Hydro Pistons into Complex. All six won 3:45.6–23:49.6 earlier than their previous local-solid routes. All six opened fewer maps, and more of the opened maps carried freight as a share of the total. Every central Complex factory fit at the first planned size. The efficiency purchase saved time on one seed and placements on the other two, so it missed the joint payoff target. [Peripheral supply results](../outputs/peripheral-supply-playtest-2026-11-12/README.md)

Keep first access to each Core affordable. Give the Hydro and Complex phases more production and freight work to match the pacing targets. Test larger optional research against sustained bottlenecks. An upgrade should save time by first victory after paying for its Cores, research, and setup. Use one of each required Core per Research Center cycle as the throughput target for efficient play.

## Pacing targets for the next balance pass

The measured column uses the three runs that skipped Road Channels 2. Times use the headless game clock, which excludes hands-on placement and wiring. Each phase after the opening starts at the first Core of the previous tier. [Run audits](../outputs/road-channels-payback-2026-11-12/README.md#evidence-and-reproduction)

| Phase | Measured | Target |
| --- | ---: | ---: |
| Fresh Home to first Automata | 29:10 | 25–30 min |
| Automata to Hydro | 11:11 | 28–35 min |
| Hydro to Shiny | 2:06:06–2:08:47 | 40–55 min |
| Shiny to Complex | 24:12–24:18 | 60–75 min |
| Complex to Final | 1:32:33–1:34:38 | 90–105 min |
| Fresh Home to first Final Core | 4:43:19–4:47:48 | 4:03–5:00 |

Use these windows as the provisional targets for the route without efficiency research. Evaluate optional upgrades after establishing that baseline.

### Production balance without efficiency research

The baseline should reach first victory with progressively longer intervals between Core tiers. Keep the opening fast. The efficiency route should make cumulative time across the industrial tiers closer to a straight line by narrowing the difference between their intervals, especially from Shiny onward. Use the same first-Core milestones for both routes. Count the cost of producing the upgrade's Cores, researching it, and putting it to use in its time to first victory. The latest distributed runs bought zero projects in the Efficiency category and used logistics and space upgrades to support their layout.

| Core | Current base assembly | First pilot candidate | First pilot material change per Core |
| --- | ---: | ---: | --- |
| Simple | 5 s | 5 s | Keep the current recipe and scale the Simple supply feeding Map Points. |
| Basic | 10 s | 10 s | Keep the current recipe. |
| Automata | 15 s | 15 s | Keep the current recipe. |
| Hydro | 18 s | 20 s | Increase Circuit B from one to two to put more work on the wet and dry supply branches. |
| Shiny | 24 s | 30 s | Increase Circuit A from two to three so the Shiny line draws more on the established circuit supply. |
| Complex | 36 s | 45 s | Increase the Controller's Copper Slurry from two to three. Keep one of each component at assembly and increase each component cycle from 30 to 36 s. |
| Final | 30 s | 60 s | Keep the four corner deliveries and their quotas for the first test. Increase the two half-assembly cycles from 10 to 20 s each. |

The first pilot values in the table are implemented locally. Assembly time is one machine's cycle with inputs ready. It is distinct from the phase time and the work of making and delivering its ingredients. The matched patch runs still took 2:40–3:19 from Complex to Final. Earlier scouting and sustained Tribute are the changes to test for that interval. The first Hydro and first Complex are single units, so a few extra seconds on their assemblers cannot fill a gap of tens of minutes. Test more demand for Automata and Shiny in their respective progression phases after the basic production capability is available. Keep added bills visible in advance and test them separately from recipe changes.

1. Rerun the distributed layout with current recipes and no efficiency research after moving corner scouting earlier and keeping Tribute supplied. Use the same three seeds and five Simple per Map Point. Distinguish production unlocks from route conveniences such as Area Expansion 1, Road Channels 1, and Tree Planter. If the harness needs one of those conveniences, report it and test an alternative layout before calling the route essential-only.
2. Compare the candidate recipe changes against that route with the same research bills and survey policy. Record the first Core and sustained deliveries at each tier, research wait by Core, extraction, nodes and connections, and time spent waiting on freight, scouting, or encounters. Hold the opening steady and check that the later baseline intervals increase on each seed.
3. Test progressive milestone bills on the same recipes and layout. Then compare each unupgraded run with a matched run that buys one efficiency project. Use the same bills on both routes and charge the upgraded route for its full purchase and setup. Test Research Center speed when the Center regularly has a full required set ready, since a shorter research cycle cannot supply missing Cores.

### Progressive research bills and production time

Use five Cores of each required tier as the base price for the pilot upgrade. Price larger pilot research bills in multiples of five per required Core and round intermediate amounts up to the next multiple of five. Keep Assembler, Automata Core, and the first fabrication and wet-processing capabilities affordable. Increase the later milestone bills in equal sets of every required Core so that earlier production lines continue to matter. Leave the first-victory bill at one of each Core, including one Final. Keep Map Points at five Simple for this comparison. Command Robotics is part of the tested corner route. Victory itself has no Command Robotics prerequisite.

The current bill column uses the latest distributed playtest prices. In the unmodded catalog, all the listed projects other than Victory cost five of each required Core. The measured column is elapsed time from starting to completing the selected project on the three distributed runs. Some production and freight already happened before selection. The three assembly columns show the base-cycle work needed to make the highest-tier Core in that bill from zero on one fully supplied machine. Each earlier Core has its own line. The Research Center column is the separate minimum at five seconds per set with a continuous supply. These are capacity calculations. In an actual factory, production, freight, and research can overlap.

| Project | Current playtest bill | Proposed bill | Measured selected time | Current assembly work | Proposed base assembly work | Proposed assembly work with pilot efficiency | Proposed Research Center minimum |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Assembler | 5 Simple | Same | 3:26 | 0:25 | 0:25 | 0:25 | 0:25 |
| Automata Core | 5 each through Basic | Same | 1:14 | 0:50 | 0:50 | 0:50 | 0:25 |
| Hydraulic Assembly | 5 each through Automata | 15 each | 1:36 | 1:15 | 3:45 | 3:45 | 1:15 |
| Ore Separation | 5 each through Hydro | 20 each | 0:55 | 1:30 | 6:40 | 4:00 | 1:40 |
| Heavy Robotics | 5 each through Hydro + 10 Shiny | 20 each through Shiny | 3:59–4:05 | 4:00 | 10:00 | 6:00 | 1:40 |
| Precision Control | 5 each through Hydro + 14 Shiny | 30 each through Shiny | 5:35 | 5:36 | 15:00 | 9:00 | 2:30 |
| Command Robotics | 5 each through Shiny + 8 Complex | 30 each through Complex | 16:23 | 4:48 | 22:30 | 13:30 | 2:30 |
| Victory | 1 each through Final | Same | 0:06 | 0:30 | 1:00 | 1:00 | 0:05 |

### Efficiency at each Core tier

Existing efficiency ranks apply to machine families. Each rank requires its predecessors, and the per-Core price of that rank rises from 10 to 35. This table uses the highest same-family rank payable with the listed Core and assumes all prerequisites are met. A player must first make Cores at that tier to pay that rank. The bill production column gives unupgraded assembly work for the highest Core in that rank's own bill as a reference. Earlier ranks can help make that bill, and their own Core costs are additional. The cumulative center time assumes the five-second base cycle. A separate Research Center upgrade uses the same rank bills and shortens its cycle from five seconds to 4.5, 4, 3.5, 3, 2.5, and 2 seconds across ranks 1–6.

| Core | Existing machine rank | Bill for that rank | Bill production at current base cycles | Cumulative center time | Current cycle at that rank | Pilot recipe cycle at that rank |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Simple | Refiner 1 | 10 Simple | 0:50 | 0:50 | 4.5 s | 4.5 s |
| Basic | Assembler 2 | 15 each through Basic | 2:30 | 2:05 | 8 s | 8 s |
| Automata | Assembler 3 | 20 each through Automata | 5:00 | 3:45 | 10.5 s | 10.5 s |
| Hydro | Fabricator 4 | 25 each through Hydro | 7:30 | 5:50 | 10.8 s | 12 s |
| Shiny | Fabricator 5 | 30 each through Shiny | 12:00 | 8:20 | 12 s | 15 s |
| Complex | Fabricator 6 | 35 each through Complex | 21:00 | 11:15 | 14.4 s | 18 s |
| Final | Assembler 6 | 35 each through Complex | 21:00 | 11:15 | 12 s | 24 s |

For the first payoff test, price a dedicated Core assembly upgrade at **five of each Core through Hydro**, available after first Hydro. Use a **40% cycle reduction for Hydro, Shiny, and Complex Core assembly only**, taking the proposed cycles from 20, 30, and 45 seconds to 12, 18, and 27. Use the faster effect if a player has also researched a Fabricator rank. This is a pilot alternative to the current rank ladder for the comparison. At rank 1, the current 10% cut would take a proposed 30-second Shiny cycle to 27 seconds. Two machines would still produce fewer Cores per minute than three base machines. A 40% cut clears the one-third threshold for two upgraded machines to outproduce three base machines.

#### Payoff test through first victory

With the proposed milestone bills, Heavy Robotics, Precision Control, Command Robotics, and Victory together need 81 Shiny and 31 Complex. In a simplified pooled production calculation, three unupgraded Fabricators per Core finish those assembly batches in **21:45** of combined production time. Two upgraded Fabricators per Core finish in **19:30**. On an existing pair of Hydro Fabricators, making the upgrade's five Hydro takes three 20-second batches. Add 25 seconds of base Research Center time for all five sets and the upgraded estimate is **20:55**, saving **50 seconds** and using **four final-stage Fabricators instead of six**. This assumes continuous inputs, earlier Cores arrive in time for the upgrade, each Core's demand can be pooled, and both routes pay the same downstream research time. Freight, component capacity, parallel production, and setup can consume that margin or change which stage matters.

Require both results in the matched runs. The upgraded route must win sooner **including upgrade Core production, Research Center time, and setup**, and it must **place fewer total nodes**, including any machines and freight nodes used to pay for the upgrade. Also report connections and peak standing nodes. Let the unupgraded route choose its fastest practical build, with the option to add parallel lines. Compare the same seeds and survey policy. If the upgraded route saves assembly work but fails either whole-route test, use the measured bottleneck to adjust the upgrade's cost, effect, or timing before raising more mandatory prices.

All six runs reached first victory. The upgrade saved both time and placements on seeds `10` and `680312004`. On `1361531576` it placed eight fewer nodes and finished 30 seconds later. Most of the 686-placement gap on `680312004` came from failed Complex factory layouts. The upgraded route on that seed finished with 32 more nodes standing. Test peripheral intermediate suppliers and a smaller central assembly site before adjusting the upgrade or mandatory prices again. [Matched results](../outputs/core-efficiency-payback-2026-11-12/README.md)

## Original pilot prices

The baseline spent 3,225 Cores on 66 Map Points between the first Automata and first Hydro Core. It paid five Complex Cores into Command Robotics and one into victory. The first experiment reduces exploration costs and makes the third Road channel a late industrial investment. It keeps the normal recipes, encounters, terrain generation, freight speeds, and victory payment so the existing factory route remains comparable. [Baseline report](blind-research-playtest-2026-11-11.md)

| Rule | Baseline | Pilot |
| --- | --- | --- |
| Extra Map Point | Current increasing quote across available Core tiers | 5 Simple per purchase |
| Heavy Robotics | 5 of each Core through Shiny | 5 of each earlier Core and 10 Shiny |
| Precision Control | 5 of each Core through Shiny | 5 of each earlier Core and 14 Shiny |
| Command Robotics | 5 of each Core through Complex | 5 of each earlier Core and 8 Complex |
| Road Channels 2 | 20 each through Hydro | 5 of each earlier Core and 12 Complex. Requires Command Robotics as well as its existing prerequisites. |
| Victory | First Final Core plus one of each earlier Core | The original pilot added Road Channels 2 as a prerequisite. Both routes in the new comparison use the baseline prerequisites. |

The fixed bills on this route would require 46 Hydro, 35 Shiny, and 21 Complex Cores through victory. The intended increase is in factory work and material demand as recipes become more involved. Compare actual gross extraction and production time by phase before adopting the prices.

## Discovery follow-up

The matched Tribute-first test reached Shiny 36–61 minutes earlier across the three seeds. It skipped 29–49 early map openings and reduced gross extraction by 1,742–3,011 units during the phase. Hydro to Shiny still took 67–93 minutes against the 40–55 minute target. After choosing the factory sites, Suppression Bot staging, Tribute, and first Shiny production took another 46–47 minutes. [Tribute-first playtest](../outputs/tribute-first-playtest-2026-11-12/README.md)

Starting the Bot factory while scouting for the Shiny site saved a further 6–22 minutes on the same three seeds and brought Hydro to Shiny down to 59–71 minutes. Both routes visited the same maps and paid the same bills on each seed. The slowest run still took 71 minutes with 40 Bots already staged when the Shiny site was selected. [Bot production during scouting](../outputs/bots-during-survey-playtest-2026-11-12/README.md)

Sizing the Lake for Shiny alone brought seed 680312004 to 47:48 and changed the other two seeds by six seconds or less. All three used fewer node placements and connections. The chosen Lakes covered ordinary solid demand locally. A separate Copper import check reached Shiny with plates smelted on a neighboring map and shipped by Road. [Shiny siting and imports comparison](../outputs/shiny-with-imports-playtest-2026-11-12/README.md)

Keep the world generator in the first pilot. The existing guaranteed Lake two maps east provides the early Water path. If surveyed seeds still require a long search for a manageable Dwarven Camp or industrial Lakes, implement the existing design decision to guarantee affordable routes to those sites while varying their positions by seed. Test that world change separately so its effect can be measured. [Discovery design](master-plan/04-world-and-encounters.md)

## Playtest and review

Start from fresh Home on seeds `680312004`, `10`, and `1361531576`. Compare the earlier two-channel route with the new layout through first victory. Both runs use the same pilot prices, 400 ms engine step, and 30-second survey allowance. Record time and gross extraction by phase, actual Core bills, nodes and connections placed and still standing, and how long a selected project waits for each Core.

All six runs reached first victory. The new layout reached Shiny in 47:48 to 1:01:24 after Hydro, then reached Complex about 24 minutes later. Deferring the corner survey until after Complex and restoring the Dwarven Bot supply extended Complex to Final to 2:39–3:14. Victory was 32 seconds faster on one seed and 18–19 minutes slower on two, with 14–17% more extraction on all three. Simple Core supply caused the most research waiting, especially for Map Points. The next route should overlap corner scouting with Shiny and Complex production and keep Tribute supplied through the first Golem attack. Use the measured waits to identify an optional upgrade worth testing. [Full comparison](../outputs/distributed-victory-playtest-2026-11-12/README.md)

The original experiment used a [data-only game mod](../scripts/core-consumption-pilot.json). Its command below reproduces the original rules, including the old Road Channels 2 requirement. The full comparison provides commands for both routes under the current test rules.

Run from the repository with Node 24. The checkpoint and audit paths can point to a new output directory.

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --through-victory --seed=680312004 --audit=pilot-audit.json --checkpoint=pilot-checkpoint.json
```

[Measured audit](../outputs/core-consumption-pilot-2026-11-12/measured-audit.json) · [Comparison document](../outputs/core-consumption-pilot-2026-11-12/NODE%20Core%20Consumption%20Playtest.docx)

## Golem Survey follow-up

The Shiny variant kept Sealed Robotics as a prerequisite and added Ore Separation. It replaced the five Hydro Cores in the Survey bill with five Shiny Cores and kept the five Simple, five Basic, and five Automata Cores. Dwarven Tribute supplied the first Shiny line, and the player completed the Survey before the first Golem attack.

On the proposed first-victory route, Hydro payments fall from 46 to 41 and Shiny payments rise from 35 to 40. Complex stays at 21. Keep Road Channels 1, Fluid Routing, Sealed Robotics, and Ore Separation in the Hydro phase.

The paired experiment compared both pilot versions through first victory on `680312004`, `10`, and `1361531576`.

Both versions won on all three seeds. The revised bill reduced pre-Shiny Hydro payments from 25 to 20. The first Shiny Core arrived 50.0 to 97.2 seconds earlier, and victory took 52.8 to 95.2 seconds longer. The comparison records timing and extraction for each seed. [Updated comparison](../outputs/core-consumption-pilot-2026-11-12/NODE%20Core%20Consumption%20Playtest.docx)
