# Expansion solvability and Golem rescue

## Adopted direction (Q98 extension, November 3, 2026)

Maintain a live calculation of the resources the player needs to finish the next Map Node research. If depletion makes that research impossible, show a large congratulatory modal thanking the player for trying to break the game, then open the matching resource Golem's map and a shortest path from the player's explored maps. Escalate the dry humor for subsequent resources. Award Destructive Testing for the three distinct Iron/Copper/Stone rescues in one world after Q102 removes Wood from the plan.

The user originally named Wood, Iron, Copper and Stone. Q100A subsequently excludes renewable Wood from emergency triggers; retain Wood in the resource budget. Preserve recovery rather than a game-over state. Resource destruction remains possible; this is an automatic rescue after a genuine shortage, not a request to block Recycler use. Q98B subsequently requires completing the rescued Golem's unlock/clearing requirement. Exact solvability semantics, extraction readiness and runtime integration still need review.

No calculator, rescue, modal or achievement is implemented by this document. Recycler processing is separately adopted at two seconds per input in Q98.

## Existing game evidence

- The repeatable research is `mapNode`; it grants one Map Point. Costs scale with completed purchases and currently available Core tiers. An active purchase retains its quoted costs across tier unlocks and saves. See [research costs](../../src/content/research.ts) and [research runtime](../../src/simulation/researchRuntime.ts).
- Already consumed Core contributions persist separately from unspent stock. Subtract paid contributions from the active quote; do not recalculate a higher price merely because another Core tier unlocked.
- Current Golems are Iron, Copper, Stone and Mythril. There is no Wood Golem. They occupy seeded clear tier-6 maps and become infinite reserves after defeat. The shared live cost is 10,000 AP; the adopted Mythril-only design target is 20,000. See [Golem content](../../src/content/resourceGolems.ts) and [world generation](../../src/simulation/worldGeneration.ts).
- Forests currently regenerate one Wood reserve unit every thirty seconds, even without Tree Planters. A fully depleted present-day Forest is not necessarily permanently exhausted. Q100A accordingly excludes Wood from emergency rescues and reopens the achievement count.
- Achievements already persist as IDs in game state. The journal has special copy for `oops`; this feature needs a named entry, description, event rule and persistent distinct-resource rescue history. See [achievement journal](../../src/ui/DiscoveryJournal.tsx).

## Resource budget and genuine impossibility

Q107 clarifies that the next-Map-Node resource calculation is internal only. Maintain the quote, remaining Core obligations, resource accounting and feasibility checks without showing a budget, counter or diagnostic panel to the player. Update on relevant stock, research, reserve, recipe/access and world changes, with cached calculations where appropriate. Existing ordinary research prices/progress are separate from this hidden safeguard.

The trigger must distinguish a production stall from an impossible expansion. A raw-inventory comparison alone is insufficient. Review:

- Paid research contributions, existing required Cores, buffered and in-flight stock, intermediates and recoverable materials. Allocate each item once; do not count both an intermediate and its constituent resources as separately available.
- Remaining accessible deposits, renewable Forest supply, affordable regeneration, available Tribute and already usable infinite reserves. Include material and access costs of making those supplies usable.
- Available ordinary and researched recipe choices, including the adopted Recycler and recovery rules. A standard-recipe budget can be displayed as a reference, but failure of that one recipe plan does not prove every allowed plan impossible.
- Existing Map Points and reachable expansion choices that can already resolve a shortage. A paused machine, missing connection or empty buffer alone must not trigger a permanent-shortage rescue.
- No further Map Node purchases: report the budget as not applicable rather than declaring a resource deadlock. Unknown/unimplemented planning cases must not be presented as proven impossibility.

Q102 removes the proposed Wood Golem and all Wood emergency triggers. The Golem roster remains Iron, Copper, Stone and Mythril; rescue/achievement scope is Iron, Copper and Stone. Additional Mythril rescue behavior is not adopted. A resource needed for fuel or support can matter even if it is absent from the final Core's immediate ingredients. The exact feasible-production solver, renewable-supply horizon and handling of multiple simultaneous deficits are open design work.

## Shortest-path rescue requirements

Find a shortest orthogonal map path from any already explored map to the corresponding Golem map, within the 11 × 11 world. Use the explored set as all starting points, not only Home or the currently viewed map. Deterministic tie-breaking should make the same state choose the same route. Unlock the target and missing path maps without erasing existing factories or progress.

Proposed integration: apply rescue map unlocks directly without spending the player's saved Map Points or completing a paid Map Node research. Preserve its quote and paid contributions. Recompute remaining purchase capacity from actual unlocked maps. These accounting details still need implementation review.

Apply each rescue transaction once and persist its resource flag. Q106 adopts one-at-a-time reevaluation for simultaneous deficits. Show the actual resource, Golem destination and opened route. Repeated ticks or reloading must not duplicate unlocks, jokes or achievement progress.

Q98B, November 3, 2026: the user adds completion of the requirement to unlock the Golem. In the context of the depleted-player AP concern, complete the rescued target's encounter access and AP-clearing requirement as part of rescue: it becomes the corresponding usable infinite reserve without consuming the player's bots/materials. The player does not need to fund its Survey/access gate afterward. This is a target-specific emergency exception; ordinary Golems keep their normal requirements. Exactly how to satisfy target access without granting unrelated research still needs implementation design.

Apply route unlock, target clearance/conversion and rescue-state recording together so a save/reload cannot leave a free route to a still-unusable rescued target. Preserve existing source identity, map layout, stock and factories. An already defeated/usable Golem must not be reset or produce duplicate achievement credit. Verify extraction and transport are actually possible; completing Golem access does not by itself define new machine-research grants.

## Draft modal copy

Use the stage for distinct rescued resources, with `[Resource]` and `[Destination]` filled from the actual rescue. These are draft text, not shipped UI. Name the affected resource, destination and rescue result alongside the joke. Q107 excludes numerical budgets and solver diagnostics from these modals as well.

| Rescue | Title | Subtext |
| --- | --- | --- |
| First | Congratulations. You found the edge case. | Thank you for trying to break the game. The [Resource] supply has declined to participate. A route to its infinite reserve at [Destination] is now open. The Golem requirement has been completed. |
| Second | Another successful failure. | Two resources. Two rescue routes. We appreciate your commitment to a test nobody assigned. The [Resource] Golem has received an administrative defeat. Its infinite reserve at [Destination] is ready by the opened route. |
| Third | Congratulations. The checklist is on fire. | Iron, Copper and Stone. All three. Thank you for testing the emergency exits; the [Resource] Golem has been retired for administrative reasons. Its infinite reserve at [Destination] is ready by the opened route. |

A clear **Show route** action and **Continue** action are proposed. Applying the rescue must not depend on approving the modal. Modal pause behavior and simultaneous-event presentation remain to design. Q98B makes the rescued target an infinite reserve, so copy may state that it is ready for extraction. It must not claim an Extractor or transport network has already been built.

## Achievement draft

**Destructive Testing** — Trigger the Iron, Copper and Stone emergency rescues in one world.

Flavor: *Thank you. We have enough data.*

Proposed stable ID: `destructive-testing`. Count distinct resource rescues, not repeated shortages or ordinary Golem discoveries/defeats. Persist progress and award once. Q102 removes Wood from the plan, leaving three qualifying basic-resource rescues. Save compatibility and journal presentation need implementation.

## Adopted Golem and rescue scope after Wood removal (Q102)

Q102, November 3, 2026: the user explicitly scraps the Wood Golem and Wood from the rescue plan. Retain the existing Iron, Copper, Stone and Mythril encounters. Wood remains a normal renewable resource and part of the next-research material budget; it has no emergency-Golem trigger or achievement condition.

The remaining named rescue resources are Iron, Copper and Stone. Destructive Testing and the escalating modal sequence cover those three distinct rescues in one world. Mythril retains its agreed ordinary encounter and reward; it is not substituted into the rescue achievement. No Wood Golem generation, clearing rule, infinite-Wood variant or old-save addition is needed.

## Validation required after design and implementation

Cover each resource and trigger order; enough stock in intermediates/Cores; partial paid research and frozen quotes; regeneration/infinite supply; stored Map Points; alternative/recycling paths; multiple deficits; shortest-path ties and world edges; already unlocked/defeated Golems; target-specific completion of survey/access and AP without charging bots; extraction access; preserving factories; once-only modal/achievement progress; save/load and old saves. Verify actual resource acquisition after rescue. Ordinary balance runs still follow the established gameplay-only rules; any deliberate destructive QA scenario must be labeled as feature testing.


## Adopted strict renewable-supply feasibility (Q100)

Q100, November 3, 2026: the user selects option 2. Count future usable passive Forest regeneration when deciding whether expansion is permanently impossible. Existing stock/reserves below the bill are not enough to trigger Wood rescue if renewable Wood can still meet finite demand eventually. Do not impose an arbitrary waiting-time cutoff or exclude passive regrowth to force a rescue.

Forest regeneration itself remains unchanged. Account for actual access and the ability to harvest/use future supply; an unusable source is not automatically available merely because its node exists. Temporary stock exhaustion, slow production or a repairable/disconnected line alone is not a genuine permanent shortage. The proposed passive-regrowth exception is not adopted.

Protected, usable Forests can make Wood rescue unreachable in ordinary worlds. The later Q100A correction removes Wood emergency rescue and reopens the achievement scope. Q102 explicitly cancels the separate Wood Golem addition. Validate actual attainability under the final solver and report limitations. Remaining solver, extraction and world integration work still needs implementation.


## Adopted renewable-Wood correction (Q100A)

The user remembers that Forests regenerate and confirms the player cannot softlock on Wood. Exclude Wood from the automatic resource-deadlock rescue conditions. Continue counting Wood requirements and usable regenerative supply internally. Do not create a false Wood shortage or change Forest regeneration to make the achievement trigger.

Q102 cancels the Wood Golem addition entirely. No Wood emergency event is required. Iron/Copper/Stone remain the named exhaustible basic-resource rescue candidates, subject to the full feasibility test. Q102 resolves the achievement to the three remaining named rescue events.

Use three modal stages; the final stage accompanies the third distinct rescue. Q101 subsequently adopts Recycler eligibility for Cores and bots.

## Recycler integration status

Q102 Wood removal/three-rescue scope are settled. Q101 subsequently accepts research Cores and bots alongside intermediate goods. Q103 adopts Hydraulic Assembly access and the forty-Core price; the new budget and rescue still need runtime implementation.


## Adopted one-rescue-at-a-time response (Q106)

Q106, adopted November 3, 2026: if several of Iron/Copper/Stone are proven unavailable for the next Map Node purchase, rescue one resource first and recalculate feasibility after opening its route and activating its Golem. Newly opened maps contain resources that can resolve other deficits; do not issue another rescue based on the old snapshot.

Select the deficient resource whose Golem requires the fewest additional map unlocks from the explored set, with deterministic Iron/Copper/Stone order for ties. Preserve the adopted shortest-path requirement for that target. If another genuine deficit remains, repeat the proof/transaction and queue the next escalating modal after the prior one is dismissed. Revalidate before applying any queued rescue so stale notices cannot grant unnecessary extra paths.

The alternative is rescuing every proven-deficient resource from the initial state at once, even if the first opened path would solve another shortage. The user selected option 1: sequential rescue with recalculation is adopted; all-initial-deficits-at-once is not. Evaluate only complete stable state updates, not a temporary instant between production input debit and output creation, and retain once-per-resource persistent flags.


## Adopted hidden failsafe (Q107)

Q107, November 3, 2026: the user rejects visible budget placement and clarifies that this is solely an internal game failsafe against softlock. No new resource-budget display appears in research, expanded-map information, the factory HUD or rescue modals. Maintain the calculation continuously in the game logic, independent of open UI panels.

Keep the requested congratulatory rescue modal, opened route/usable reserve and achievement feedback. Show the actual rescue outcome without exposing resource requirements, available totals or feasibility diagnostics. The calculation is not a player-facing planning tool and must not add a destruction warning/approval gate. Developer tests/debug records may inspect state for verification without adding a player display.

Normal existing Core-cost/progress UI remains separate. Internal unknown/uncertain cases must not be treated as proven softlocks; the solver, persistence and rescue transactions still need runtime implementation. The earlier contextual-panel/HUD proposals are not adopted.
