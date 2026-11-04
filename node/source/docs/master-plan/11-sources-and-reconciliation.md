# Planning sources and reconciliation

## Repository evidence

| Source | Use in this plan |
| --- | --- |
| [Project overview](../../README.md) | Implemented catalog, architecture, pacing aspirations and earlier pending questions |
| [Progression and scaling](../progression-and-scaling.md) | Settled tier roles, route decisions, normal-play evidence and deferrals |
| [Research catalog](../research-catalog.md) | Exact research structure and current efficiency reference |
| [Obstruction behavior](../obstruction-types-and-behavior.md) | Current versus original game, settlements, Golems, Lakes and holes |
| [Novice findings](../novice-playtest-findings.md) | Current resolutions, historical observations and testing limits |
| [Browser procedure](../browser-playtest.md) | Required session discovery and recovery method |
| [Change history](../changelog/entries.json) | Completed outcomes, earlier decisions and publication boundaries |
| [Live content](../../src/content/progression.ts) | Implemented higher-tier catalog, distinct from proposals |
| [Road rules](../../src/simulation/roadMaterials.ts) | Current solid-only and single-material enforcement |
| [Golem conversion](../../src/content/resourceGolems.ts) | Current permanent mineral reserve reward |

The local source in this folder is the rebuild under review. `D:\Node Game` and exported deployment copies are historical or comparison sources, not automatically the current implementation.

## Known summary conflicts

| Older statement | Current interpretation | Handling |
| --- | --- | --- |
| Roads ship whole buffers; fluid Roads can transport Water | Current catalog and later decisions specify one solid item every five seconds; fluid Roads are retired/rejected | Use current Road rules; retain old notes as historical context |
| Golems have 100 health and yield two materials per second | Four mineral Golems take 10,000 AP once, then become infinite mineral reserves | Use current Golem source and obstruction reference |
| Ordinary Mythril deposits or Goblin/Drill sources are intended future supply | Q14 requires Dwarven Tribute, with the retained infinite-reserve Mythril Golem exception in Q14B1; unsupported alternatives still need transition | Separate current mechanics from target behavior; preserve old saves/stock while preventing ongoing bypasses |
| Complex routes and transported waste remain untested | Later section records Complex delivery and remote Slag recovery on November 1 | Use later evidence, retaining its sustained-throughput limitation |
| All novice suggested changes are pending | Most were resolved; N15 is deferred | Read current statuses before creating work |
| Power is an active system or a planned stabilization requirement | Q10 removes playable Power pending a useful integration design; Tree Planters work without it | Keep old IDs and archived save infrastructure; do not infer a committed reintroduction |
| Endgame Theory means the finished game is complete | It is the entry checkpoint for future tier 7; Q06 now defines four corner components, a final Core, a victory project and continued optimization research | Keep agreed structure distinct from pending mechanics and implementation |
| Old one-second/subsecond lab models are current | Q26A establishes a five-second base and existing upgrades down to two seconds; only the refreshed live report uses this corrected baseline | Rebase older timing, waste-throughput and factory-count experiments before use; see [analysis status](../../outputs/progression/README.md) |
| Shiny should introduce Slag and waste handling | Q32 makes Shiny waste-free and introduces waste with Complex; current runtime still needs transition | Keep historical Shiny recovery evidence intact; update recipes, tooling and teaching together before claiming the new behavior is live |
| Analytical times establish player pacing | Action times and learning are assumptions; one route is not a calibrated population | Label targets, model results and observed runs separately |

This plan does not rewrite the older detailed records. Future cleanup should distinguish obsolete summaries from historical evidence instead of erasing the history.

## Game development planning references

The organization of this plan is an adaptation for NODE, rather than a mandatory studio template.

- [Unity Learn on the production cycle](https://learn.unity.com/tutorial/the-real-time-production-cycle?version=2020.3) describes planning, production, QA and operations, with game design covering gameplay, story, art, audience and accessibility. It informs the component coverage here.
- [Ubisoft on its creative process](https://www.ubisoft.com/en-us/company/how-we-make-games/creative-process) describes an evolving project mandate and evaluation of tools and processes before production. It informs the living vision, dependencies and milestone gates here.

Both references were consulted November 2, 2026. Their production frameworks inform the outline; all NODE-specific mechanics and decisions come from the repository or are explicitly proposed in the review queue.

The [endgame component cost model](12-endgame-component-costs.md) records Q73 cost parity and a November 3 recursive manufacturing calculation from current recipe data. Its gross bills exclude acquisition/transport and recycling credits as stated; they are not measured gameplay or a complete endgame balance. Recalculate when the selected recipe/supply scenario changes.
