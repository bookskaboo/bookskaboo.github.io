# Map exploration and Map Node research

Map Node research keeps the first half of the world affordable, then charges progressively more for filling out the remaining maps. The six-core price schedule and safeguards below are implemented.

## Half map baseline

The world contains 121 maps. Round half upward to **61 unlocked maps including Home**. Home is available initially and Exploration grants the first Map Point, so reaching this baseline requires **59 Map Node research completions**. The remaining 60 maps bring the total to 121, requiring 119 Map Node completions overall.

This is a budget for unlocked territory. Which maps become available depends on the player’s connected expansion route; productive-map coverage and reaching particular corners are separate goals.

## Prices for the first 59 completions

Each price applies equally to every required core from Simple through the named core. The first nine purchases stay at 5 Simple, making exploration the first sustained reason to expand copper smelting and Simple Core production while Assembler remains inexpensive. Each later phase introduces its new core at the previous phase's final price plus 1, then rises by 1 every two purchases. The first phase covers nine repeat purchases because Exploration already supplies a point; each later phase covers ten purchases.

| Map Node completions | Highest scheduled core | Cost of each required core | Total maps affordable including Home and Exploration |
| --- | --- | --- | --- |
| 1–9 | Simple | 5 | 11 |
| 10–19 | Basic | 6–10, two purchases per price | 21 |
| 20–29 | Automata | 11–15, two purchases per price | 31 |
| 30–39 | Hydro | 16–20, two purchases per price | 41 |
| 40–49 | Shiny | 21–25, two purchases per price | 51 |
| 50–59 | Complex | 26–30, two purchases per price | 61 |

Exploration costs 1 Simple + 1 Basic Core, unlocks the world map and awards the first Map Point. Map Node is repeatable after Exploration and starts at 5 Simple Cores. Every completion awards one Map Point, used to activate a locked map directly north, south, east or west of an unlocked map. Enter the activated map to discover its resources. Area Expansion instead enlarges the working field inside maps. With each core available by its scheduled phase, research for the half-world baseline costs **4,147 physical cores in 946 synchronized sets**, including Exploration. Map Points remain freely assignable to adjacent locked maps.

## Scaling beyond half the map

For the remaining **60 maps**, increase the price by **1 of each required core every five purchases**, starting at 31 each and ending at 42 each.

| Total maps affordable | Cost of each required core for the indicated extra maps |
| --- | --- |
| 62–66 | 31 |
| 67–71 | 32 |
| 72–76 | 33 |
| 77–81 | 34 |
| Continue in groups of five | Add 1 per group |
| 117–121 | 42 |

For extra map number n after the 61-map baseline, the price is **30 + ceil(n / 5)** of each required core, for n = 1 through 60. With all scheduled cores available, full-world map research costs **17,287 physical cores in 3,136 synchronized sets**, including Exploration. This is 52 minutes 16 seconds of uninterrupted base-speed lab work, or about 20 minutes 54 seconds with Research Center 6 throughout. Production, transport, construction, combat and other research add elapsed time; the upgraded figure is a lower bound rather than a progression forecast.

## Preventing exploration dead ends

Require a newly scheduled core only after its recipe has been unlocked. Until then, keep Map Node payable with all available earlier core types at the same per-core price. For example, a scheduled Shiny-phase purchase costs 25 each through Hydro while Shiny remains locked; once Ore Separation unlocks Shiny, subsequent purchases add Shiny. This lets the player scout for the water or Mythril needed for the next core without requiring that core first.

Use the lesser of the scheduled core tier and highest unlocked core tier when calculating a new purchase. Hold a selected project’s quoted requirements steady until it completes or the player changes projects, so unlocking a core during research cannot change the active bill. Preserve earned Map Points and completion counts in existing saves. After all maps are unlocked or remaining maps are covered by banked points, stop offering further Map Node purchases.

## Verification and pacing

Automated checks cover the 59-completion half-world budget, all 119 full-world purchases and connected map activation, every price boundary, core-access fallback, fixed active quotes, saved progress and the fully explored map limit. Sustainable production, resource scouting, combat and real player waiting still need playthrough measurements. The current 37–60 and 109 productive-map endgame targets remain separate from these access budgets.
