# NODE master development plan

**Current revision — November 5, 2026 (NODE-0321):** explicit user quotas replace five-minute sizing for Alpha (50 AP), Foundry (50 Circuit B / 25 Sealed Frames / 100 Mythril Gears) and Grove (500 growth). Reclamation retains its five-minute credits. Endgame Theory is retired. Victory is a manually selected Research Center project costing one each of all seven Core types; producing a Final Core alone does not win. See [current implementation](20-endgame-implementation.md).

**November 4 implementation:** the [endgame implementation report](20-endgame-implementation.md) records the delivered corner/Final Core route, Recycler/recovery, research, relocation, verification and limitations. The Q01–Q144 interview is complete; optional extra QoL waits for endgame playtesting.

**Runtime update, November 3:** the [local implementation status](19-implementation-status.md) records the delivered Dwarven, Complex-waste/filtering, forestry and ordinary vehicle changes, verification, migration boundary and work still pending. Earlier dated planning descriptions are not delivery claims.

Created November 2, 2026. Working baseline for **NODE: Another Factory Game** in `D:\node factory v2`.

This plan connects the game we have to the decisions, design work and testing needed to finish it. The initial Q01–Q24 review and its follow-ups are complete. The stabilization checklist and deferred scope are adopted as the current baseline; detailed specifications and delivery evidence remain work to complete. Dates, owners and estimates are not yet assigned.

The [current implementation report](20-endgame-implementation.md) is the starting point for reviewing delivered code and remaining verification.

## Read and review

| Document | Purpose | Main unfinished work |
| --- | --- | --- |
| [Vision and scope](01-vision-and-scope.md) | Player promise, pillars, audience and boundaries | Audience and milestone adopted; delivery evidence remains |
| [Gameplay and systems](02-gameplay-and-systems.md) | Core loop and interacting mechanics | Power removed/deferred; shared Inventory access, failure and recovery |
| [Progression and economy](03-progression-and-economy.md) | Tier roles, resource demand and pacing | Sustained balance evidence; four-component final Core, victory project and post-victory research |
| [World and encounters](04-world-and-encounters.md) | Geography, exploration, settlements and sustainability | Four unique corner obstructions, productive expansion and resource longevity |
| [Interface and learning](05-interface-and-learning.md) | Controls, onboarding, accessibility and feedback | Human learning tests and accessibility scope |
| [Art audio and writing](06-art-audio-and-writing.md) | Visual identity, sound, fiction and asset production | Audio direction, fiction depth and asset standards |
| [Technical design](07-technical-design.md) | Architecture, saves, performance and content workflow | Browser budgets, compatibility and build reproducibility |
| [Quality and playtesting](08-quality-and-playtesting.md) | Evidence, test matrix and completion checks | Human sessions and stable late factories |
| [Production roadmap](09-production-roadmap.md) | Dependencies, milestones, risks and task intake | Implement the adopted milestone and validate its exit criteria |
| [Decisions and review queue](10-decisions-and-review-queue.md) | Recorded decisions and review history | Q144 closes this design pass; extra QoL deferred until endgame playtesting. Implementation is delivered locally; see document 20 for evidence and remaining validation. |
| [Sources and reconciliation](11-sources-and-reconciliation.md) | Evidence, older conflicts and planning references | Maintain source links as work changes |
| [Endgame component costs](12-endgame-component-costs.md) | Shared reference, adopted component quantities and open policies | Reclamation calibration, factory feasibility and final Core details |
| [Recycling and waste benchmark](13-recycling-and-waste-benchmark.md) | Intermediate recovery and representative waste-flow evidence | Waste-input policy, buffers/blockage, factory benchmark and expansion rescue |
| [Expansion solvability and Golem rescue](14-expansion-solvability-and-golem-rescue.md) | Internal softlock calculation, emergency routes, modal drafts and achievement | Solvability implementation, extraction readiness and achievement attainability |
| [Final Core, victory and postgame](15-final-core-victory-and-postgame.md) | Final assembly, first-victory flow and continued research | Implemented route/research; normal-play pacing and deferred copy review |
| [Victory modal](16-victory-modal.md) | Glowing ending presentation, finished draft copy and local preview | Runtime integrated; rendered/interactivity verification remains |
| [Endgame research and world reshaping](17-endgame-research-and-world-reshaping.md) | Resource/Lake/camp movement, Deep Hole efficiency and Forest-inclusive regeneration; other QoL candidates | Implemented locally; geometry, migration and normal-play validation |
| [Endgame transport research](18-endgame-transport-research.md) | Road channels up to five per face; coordinated Train capacity and transfer research | Ranks, prices and transfer gains implemented; sustained delivered-rate validation |

## How to read status

- **Implemented:** present in the inspected source or maintained implementation record. This alone does not mean balanced or fully browser-tested.
- **Agreed:** existing recorded direction that remains in force; implementation may be partial.
- **Needs validation:** a specific experience, performance or balance claim still needs evidence.
- **Proposed:** a recommendation in this plan, awaiting a decision.
- **Open:** a design or production choice without a settled answer.
- **Deferred:** deliberately parked; keep the current behavior until reopened.

The baseline comes from source and maintained reports reviewed on November 2. This planning pass did not launch a new game or run a new balance test. Historical test counts belong to their original reports.

## Maintain the plan

Source defines current runtime behavior. Explicit recorded decisions define intended behavior. If those disagree, record the discrepancy and resolve it; neither should silently overwrite the other. Existing detailed catalogs remain the home for exact recipes and formulas. This plan summarizes and links them.

After a review answer, update the decision queue and affected component document. Turn agreed work into tasks using the roadmap format. After implementation, update the current-state section and project change history with actual verification. A deferred answer settles that question for now and advances the review. Keep stable question IDs when reordering the queue.

When presenting reviews, use one native question card with current context, concrete choices and a recommendation. Typed modifications are welcome. Never treat a preselected choice as consent. Advance to the next unresolved question after recording the answer.

Current chat fallback: the user reports disappearing cards on their phone. Use one question with numbered choices in ordinary chat while that limitation persists; typed numbers select the displayed options.

## Current assessment

The agreed next milestone is to stabilize through Complex, with tier 7 design work on paper alongside it (Q01, November 2, 2026). The primary audience is automation enthusiasts, with newcomer support (Q02). The project has a substantial playable foundation, with local saves, tutorials, distributed factories and research. Power is removed and deferred until a useful integration is designed (Q10). The main remaining gaps are detailed final-tier mechanics, measured sustained pacing, shared Inventory scope, accessibility targets and release acceptance criteria. The [roadmap](09-production-roadmap.md) organizes the work; detailed scope remains under review.

Current implementation and unresolved limits are consolidated in [document 20](20-endgame-implementation.md). Older dated pending statements describe their original review state.

**Publication confirmed November 4:** the implementation is merged into main and [live](https://bookskaboo.github.io/node/). The [publication receipt](../../outputs/implementation/endgame-publication-receipt.json) verifies the served assets; this does not certify browser interaction or normal-play balance.
