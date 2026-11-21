# NODE documentation

Start with the [system reference library](systems/README.md) for the current game. Each major system has its own document, with implementation links and related systems. Exact catalog tables are generated from the assembled base-game content.

## Find a document

| Need | Starting point |
| --- | --- |
| Understand a mechanic or plan a system change | [Systems](systems/README.md) |
| Work through the current document review | [Temporary system review register](reviews/system-review-temporary.md) |
| Find ingredients, costs, names, capacities or unlocks | [Reference catalogs](systems/README.md#reference-catalogs) |
| Review intended direction and unresolved design work | [Master development plan](master-plan/README.md) |
| Understand permanent map landmarks and their frequency | [Current Landmarks system](systems/landmarks.md), [design decisions](master-plan/23-map-power-ups.md) |
| Find when or why something changed | [Change history](changelog/README.md), [searchable history](changelog/index.html) |
| Find superseded reference material | [Documentation archive](archive/README.md) |
| Run a browser playtest or recover its browser session | [Browser playtests](browser-playtest.md) |
| Build a factory using verified normal-play layouts | [Playtest build guide](playtest-build-guide.md) |
| Review balancing discussions | [Progression and scaling](progression-and-scaling.md), [Core consumption proposal](core-consumption-balance-proposal.md) |
| Edit UI typography or player-facing copy | [UI style guide](node-ui-style-guide.md), [style review notes](typography-style-review.md) |
| Review river, mountain and chasm art or Node Map markers | [Border obstruction art and modal tests](../previews/border-obstructions/README.md) |
| Review Map Node terrain art and starting resource rules | [Current terrain rules](systems/map-nodes-and-exploration.md#ground-terrain-for-new-games), [art and real-engine test views](../previews/terrain-tiles/README.md), [adopted design](master-plan/22-map-terrain-tiles.md) |
| Review the junior AI premise, Status modal and robot upgrades | [Art and writing framework](master-plan/06-art-audio-and-writing.md#status-page-narrative-framework), [interactive study](../previews/status-page/README.md) |
| Create or share a data mod | [Mod guide](mods.md) |
| Inspect historical observations | [Novice findings](novice-playtest-findings.md), [blind research playtest](blind-research-playtest-2026-11-11.md), [Final Core dry run](final-core-dry-run.md), [Final Core blind run](final-core-blind-run.md) |

## Authority and upkeep

The system library describes current local implementation. The [changelog](changelog/README.md) is the primary history of what changed, when and why, including meaningful decisions and deferrals in their correct states. Source determines runtime behavior; recorded design decisions determine intended behavior. A discrepancy is work to resolve, rather than permission to change gameplay while documenting it. Historical plans, dated catalogs and run reports retain their original evidence. A documentation update does not establish a live publication or a new balance result.

Every future NODE chat must maintain the affected references as part of its authorized work, without waiting for a separate documentation request. Update the existing system document and applicable guides, regenerate affected catalogs with `npm run docs:systems`, run `npm run docs:systems:check`, and record the outcome using the [changelog procedure](changelog/README.md). Add and index a system document when a new major system needs one. Keep current rules in system references and intended work in plans; link supporting evidence from the changelog using stable NODE IDs. Preserve older records and their dates, and avoid creating competing timelines or duplicate references.
