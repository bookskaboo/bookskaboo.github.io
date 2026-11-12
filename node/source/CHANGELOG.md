# NODE: Another Factory Game — Changelog

A searchable record of completed changes, design decisions, and relevant review findings. Stable NODE IDs can be cited in chats and searched in the repository.

**490 records · 2026-10-12–2026-11-11 · America/Los_Angeles**

[Open searchable history](<docs/changelog/index.html>) · [How to review and maintain it](<docs/changelog/README.md>) · [Sources and coverage gaps](<docs/changelog/sources.md>)

## Local changes awaiting publication

Latest confirmed game publication: [afdea7a](https://github.com/bookskaboo/bookskaboo.github.io/commit/afdea7a72552e6c1575dc039b54018c909a50edb).

| ID | Change | Topics |
| --- | --- | --- |
| [NODE-0490](<docs/changelog/2026-11.md#node-0490>) | Place copied layouts at the cursor | Interface, Controls, World, Documentation |
| [NODE-0489](<docs/changelog/2026-11.md#node-0489>) | Use the approved item art in the game | Art, Interface, Recipes, Documentation |
| [NODE-0487](<docs/changelog/2026-11.md#node-0487>) | Add an item art gallery to the NODE Art Preview | Art, Documentation |
| [NODE-0486](<docs/changelog/2026-11.md#node-0486>) | Show the active Recycler recipe and give Extractors turns at shared inputs | Production, Recipes, Connections, Interface |
| [NODE-0485](<docs/changelog/2026-11.md#node-0485>) | Clear automatic Recycler disposal after the material drains | Production, Recipes, Connections, Interface |
| [NODE-0484](<docs/changelog/2026-11.md#node-0484>) | Fit the Deep Hole glow to its visible rim | Interface, World, Documentation |
| [NODE-0483](<docs/changelog/2026-11.md#node-0483>) | Distinguish Dwarven and Goblin camps on the Node Map | Interface, World, Encounters, Documentation |
| [NODE-0482](<docs/changelog/2026-11.md#node-0482>) | Alert on resource depletion and scale minimap icons with zoom | Interface, World, Encounters, Production, Persistence, Documentation |
| [NODE-0481](<docs/changelog/2026-11.md#node-0481>) | Reveal Final Core corner markers and update minimap tooltips live | Interface, World, Exploration, Encounters, Documentation |
| [NODE-0480](<docs/changelog/2026-11.md#node-0480>) | Name the map survey section Points of Interest | Interface, World |
| [NODE-0479](<docs/changelog/2026-11.md#node-0479>) | Center Road markers and show all materials on each map border | Roads, Interface, World, Documentation |
| [NODE-0478](<docs/changelog/2026-11.md#node-0478>) | Standardize tutorial dialogs and step controls | Interface, Tutorials, Documentation |
| [NODE-0475](<docs/changelog/2026-11.md#node-0475>) | Label the Hydro Plant Water socket before recipe selection | Production, Interface, Documentation |
| [NODE-0474](<docs/changelog/2026-11.md#node-0474>) | Move Mythril recipes and configure Recyclers one recipe at a time | Production, Recipes, Research, Interface, Documentation |
| [NODE-0472](<docs/changelog/2026-11.md#node-0472>) | Rename the Fabricator and Synthesizer | Production, Research, Interface, Documentation |
| [NODE-0471](<docs/changelog/2026-11.md#node-0471>) | Require Water for every Recycler recipe | Production, Recipes, Interface, Documentation |
| [NODE-0427](<docs/changelog/2026-11.md#node-0427>) | Save the surveyed route and simulate blind map discovery | Playtesting, Progression, World generation, Logistics, Endgame |
| [NODE-0426](<docs/changelog/2026-11.md#node-0426>) | Verify the first Final Core route with the offline engine | Playtesting, Progression, Logistics, Endgame |
| [NODE-0425](<docs/changelog/2026-11.md#node-0425>) | Model a route from Home to one Final Core | Playtesting, Progression, Logistics, Endgame |
| [NODE-0338](<docs/changelog/2026-11.md#node-0338>) | Verify Monster Camp AP delivery for all four bot tiers | Encounters, Connections, Playtesting, Documentation |
| [NODE-0325](<docs/changelog/2026-11.md#node-0325>) | Record verified Hydro delivery and Tree Planter recovery through the normal UI | Playtesting, Documentation, Logistics, Production |
| [NODE-0324](<docs/changelog/2026-11.md#node-0324>) | Record the normal-UI fuel repair and sustained Medium Bot verification | Documentation, Logistics, Production, Playtesting |
| [NODE-0242](<docs/changelog/2026-11.md#node-0242>) | Show recipes on one line with equal larger bubbles and flavor-only hover | Recipes, Interface, Accessibility |
| [NODE-0241](<docs/changelog/2026-11.md#node-0241>) | Apply normal Cart shortcut rules and hide the empty third bar at startup | Shortcuts, Progression, Persistence, Interface, Testing |
| [NODE-0234](<docs/changelog/2026-11.md#node-0234>) | Condense Options and shortcut node selection | Interface, Controls, Shortcuts, Documentation |
| [NODE-0229](<docs/changelog/2026-11.md#node-0229>) | Show Road transfer rate in items per minute | Roads, Logistics, Interface |
| [NODE-0225](<docs/changelog/2026-11.md#node-0225>) | Add Road-unlocked Carts, global Truck and Train upgrades, and shared face slots | Research, Storage, Logistics, Roads, Tutorials, Persistence, Interface |
| [NODE-0218](<docs/changelog/2026-11.md#node-0218>) | Remove map-node hover tooltips from the expanded map | Interface, Map |
| [NODE-0217](<docs/changelog/2026-11.md#node-0217>) | Keep H for Home and separate compass coordinates with a dot | Interface, World, Map |
| [NODE-0207](<docs/changelog/2026-11.md#node-0207>) | Pulse Research Centers between successful Core payments | Research, Interface, Animation, Simulation |
| [NODE-0195](<docs/changelog/2026-11.md#node-0195>) | Keep history date-filter checks valid as new entries are added | Documentation, Tooling |
| [NODE-0129](<docs/changelog/2026-11.md#node-0129>) | Unlock Tribute at minimum camp size and allow material changes with stock sacrifice | Combat, Logistics, Interface, Controls |
| [NODE-0128](<docs/changelog/2026-11.md#node-0128>) | Camp checks consume only the bots needed and display their AP requirement | Combat, Controls, Interface |
| [NODE-0127](<docs/changelog/2026-11.md#node-0127>) | Use visible obstruction borders and reserve maximum camp growth on spawn | World map, Combat, Connections, Resources |
| [NODE-0120](<docs/changelog/2026-11.md#node-0120>) | Create a local master development plan and sequential review queue | Documentation, Planning |
| [NODE-0119](<docs/changelog/2026-11.md#node-0119>) | Realign Research Center status and Core buffers | Research, Interface |
| [NODE-0118](<docs/changelog/2026-11.md#node-0118>) | Use 64-unit multiples for node bodies | Nodes, Construction, Interface |
| [NODE-0117](<docs/changelog/2026-11.md#node-0117>) | Align grid snapping by top-left corners | Construction, Controls, Options |
| [NODE-0116](<docs/changelog/2026-11.md#node-0116>) | Remove the fixed command strip and Running badge | Interface, Controls |
| [NODE-0115](<docs/changelog/2026-11.md#node-0115>) | Require extraction before resource delivery | Connections, Resources, Production |
| [NODE-0114](<docs/changelog/2026-11.md#node-0114>) | Copy recipes with a held-Shift gesture | Controls, Recipes, Undo |
| [NODE-0113](<docs/changelog/2026-11.md#node-0113>) | Remove resource output socket labels | Resources, Interface |
| [NODE-0112](<docs/changelog/2026-11.md#node-0112>) | Hide node hover text except the multi-connection hint | Interface, Connections |
| [NODE-0111](<docs/changelog/2026-11.md#node-0111>) | Keep locked connector mirroring quiet | Controls, Research |
| [NODE-0110](<docs/changelog/2026-11.md#node-0110>) | Tidy recipe cards and ungroup compact icons | Recipes, Interface |
| [NODE-0109](<docs/changelog/2026-11.md#node-0109>) | Prevent Ctrl+A from selecting the game page | Controls, Interface |
| [NODE-0107](<docs/changelog/2026-11.md#node-0107>) | Create a searchable changelog and backfill earlier work | Documentation, Workflow, Search |
| [NODE-0105](<docs/changelog/2026-11.md#node-0105>) | Rebind hold-to-snap from Z to A | Construction, Controls, Options |
| [NODE-0104](<docs/changelog/2026-11.md#node-0104>) | Validate materials through logistics networks | Connections, Logistics, Production |
| [NODE-0103](<docs/changelog/2026-11.md#node-0103>) | Move Advanced Fabrication to Automata-tier research | Research, Progression, Balance |
| [NODE-0102](<docs/changelog/2026-11.md#node-0102>) | Condense selected research details | Research, Interface |
| [NODE-0101](<docs/changelog/2026-11.md#node-0101>) | Restore batch deletion of selected nodes | Controls, Undo, Control groups |
| [NODE-0100](<docs/changelog/2026-11.md#node-0100>) | Place the recipe time beside its title | Recipes, Interface |
| [NODE-0098](<docs/changelog/2026-11.md#node-0098>) | Restore the inactive/current-project control and paid-Core progress | Research, Interface |
| [NODE-0097](<docs/changelog/2026-11.md#node-0097>) | Remove the small blue recipe button | Recipes, Controls, Interface |
| [NODE-0095](<docs/changelog/2026-11.md#node-0095>) | Give attached shortcut bars a shared grip and individual unlock | Shortcuts, Controls |
| [NODE-0093](<docs/changelog/2026-11.md#node-0093>) | Expand the existing minimap instead of opening another modal | World map, Interface |
| [NODE-0092](<docs/changelog/2026-11.md#node-0092>) | Keep shortcut positions stable when the map is revealed | Shortcuts, World map, Responsive |
| [NODE-0091](<docs/changelog/2026-11.md#node-0091>) | Scroll the map while dragging nodes or cables near an edge | Camera, Controls, Connections |
| [NODE-0090](<docs/changelog/2026-11.md#node-0090>) | Shorten names that overflow node cards | Naming, Interface, Saves |
| [NODE-0089](<docs/changelog/2026-11.md#node-0089>) | Simplify the Research Center's visible labels | Research, Interface |
| [NODE-0088](<docs/changelog/2026-11.md#node-0088>) | Reject connections until a production recipe is chosen | Production, Recipes, Connections |
| [NODE-0087](<docs/changelog/2026-11.md#node-0087>) | Require an explicit Smelter recipe | Production, Recipes, Tutorials |
| [NODE-0086](<docs/changelog/2026-11.md#node-0086>) | Show remaining resource reserves in the progress bar | Resources, Interface |
| [NODE-0085](<docs/changelog/2026-11.md#node-0085>) | Clear mismatched Extractor stock when its input changes | Production, Resources, Connections |

## Dated history

- [2026-11](<docs/changelog/2026-11.md>) — 472 records
- [2026-10](<docs/changelog/2026-10.md>) — 18 records

“Known by” dates are implementation/publication bounds, not exact change dates. “Backfilled” dates mark records with uncertain original dates. Supersession links explain reversals. Original-game records do not certify current rebuild behavior.

## Published releases

- 2026-11-10 — [afdea7a: Bot Plant, freight, research, and interface updates](https://github.com/bookskaboo/bookskaboo.github.io/commit/afdea7a72552e6c1575dc039b54018c909a50edb) — Published the tested /node/ build and matching source on main. The standard live HTML and all ten runtime assets matched the tested commit by SHA-256.
- 2026-11-09 — [8ba3691: Extra Map Point research naming and priority](https://github.com/bookskaboo/bookskaboo.github.io/commit/8ba36918eaf14ad8fb30b0cf26af0d180a03d31d) — Published the tested /node/ build and matching source on main. The standard live HTML and all ten runtime assets matched the build by SHA-256.
- 2026-11-09 — [6316989: Automatic Deep Hole clearing](https://github.com/bookskaboo/bookskaboo.github.io/commit/631698997b6bd684876ed2128159c787aeba284a) — Published the tested /node/ build and matching source on main. The normal live URL served matching HTML and all ten runtime assets matched the build by SHA-256.
- 2026-11-09 — [aac2bae: Publish the release instructions and verification history](https://github.com/bookskaboo/bookskaboo.github.io/commit/aac2bae9f1249b99ea0d839edd014d3330ad2170) — Source documentation publication. All six changed source files matched the deployed commit. The normal live HTML and all ten runtime assets matched the rebuilt game and remain on the ad996a7 game build.
- 2026-11-08 — [ad996a7: Editable mod packs, adjustable world maps and research updates](https://github.com/bookskaboo/bookskaboo.github.io/commit/ad996a79ee0a3588bc9aeeef6db9d79b2863d32e) — Published the /node/ build and matching source on main. The standard live URL served matching HTML and all ten runtime assets matched the build by SHA-256.
- 2026-11-08 — [19dc40f: World balance, illustrated corner camps and interface improvements](https://github.com/bookskaboo/bookskaboo.github.io/commit/19dc40fff3a1c8d201352a726cdb494ec5521655) — Published the /node/ build and matching source on main. The normal live URL served matching HTML and all ten runtime assets matched the build by SHA-256.
- 2026-11-05 — [df69900: Corner balance, paid seven-Core victory and camp Tribute feedback](https://github.com/bookskaboo/bookskaboo.github.io/commit/df69900fd71d89b911057eeb90a1fb0ae63a2824) — User authorizes publishing to the live NODE game. Main preserves newer Chapter 1 work; live HTML and all ten runtime asset hashes match the /node/ publication build.
- 2026-11-04 — [0c7c924: Elder Grove cumulative progress display](https://github.com/bookskaboo/bookskaboo.github.io/commit/0c7c924bfc75644ebe9de75739248b7fe6f188a8) — User-authorized main-branch publication. All seven referenced live assets match the tested build; preserved 2:07:01 player checkpoint restored through normal Save/Load and Grove shows 1,057/2,000,000.
- 2026-11-02 — [e177479: Refactored NODE game and source](https://github.com/bookskaboo/bookskaboo.github.io/commit/e177479113d773e1b74bdaf2fafd46776ea4a786) — Latest game publication found in the local clone. Contains readable source at node/source. Published-by references are upper bounds, not necessarily first release dates.
- 2026-11-01 — [341b2f0: Responsive UI and production node redesign](https://github.com/bookskaboo/bookskaboo.github.io/commit/341b2f0d2e87f7aeb38e5f75c768079b4d9b9d61)
- 2026-11-01 — [6ebdb7f: Tutorials, logistics controls, and player interface](https://github.com/bookskaboo/bookskaboo.github.io/commit/6ebdb7f109f6df3de447a4bfb5fa06d26eb29a96)
- 2026-11-01 — [a571e87: Current NODE factory game reconstruction](https://github.com/bookskaboo/bookskaboo.github.io/commit/a571e87d48f0e824dc1042f44d03b9a91c31dda6)
- 2026-11-04 — [eca1c2d: Seeded corner endgame, recycling and continued-play research](https://github.com/bookskaboo/bookskaboo.github.io/commit/eca1c2d99d74c906999f4b95c90575155d4c4f29)

A record marked “Published by” was known in that snapshot and may have appeared earlier. The release notes describe how each publication was verified.

## Topics

- [Accessibility](<docs/changelog/index.html?topic=Accessibility>) (6)
- [Animation](<docs/changelog/index.html?topic=Animation>) (6)
- [Architecture](<docs/changelog/index.html?topic=Architecture>) (3)
- [Art](<docs/changelog/index.html?topic=Art>) (2)
- [Audio](<docs/changelog/index.html?topic=Audio>) (1)
- [Balance](<docs/changelog/index.html?topic=Balance>) (78)
- [Building](<docs/changelog/index.html?topic=Building>) (1)
- [Camera](<docs/changelog/index.html?topic=Camera>) (3)
- [Combat](<docs/changelog/index.html?topic=Combat>) (12)
- [Compatibility](<docs/changelog/index.html?topic=Compatibility>) (3)
- [Connections](<docs/changelog/index.html?topic=Connections>) (31)
- [Construction](<docs/changelog/index.html?topic=Construction>) (15)
- [Control groups](<docs/changelog/index.html?topic=Control%20groups>) (3)
- [Controls](<docs/changelog/index.html?topic=Controls>) (37)
- [Deployment](<docs/changelog/index.html?topic=Deployment>) (1)
- [Design](<docs/changelog/index.html?topic=Design>) (7)
- [Developer tools](<docs/changelog/index.html?topic=Developer%20tools>) (1)
- [Discovery](<docs/changelog/index.html?topic=Discovery>) (5)
- [Documentation](<docs/changelog/index.html?topic=Documentation>) (208)
- [Encounters](<docs/changelog/index.html?topic=Encounters>) (87)
- [Endgame](<docs/changelog/index.html?topic=Endgame>) (3)
- [Exploration](<docs/changelog/index.html?topic=Exploration>) (22)
- [Extraction](<docs/changelog/index.html?topic=Extraction>) (1)
- [Interface](<docs/changelog/index.html?topic=Interface>) (186)
- [Logistics](<docs/changelog/index.html?topic=Logistics>) (85)
- [Map](<docs/changelog/index.html?topic=Map>) (3)
- [Mods](<docs/changelog/index.html?topic=Mods>) (6)
- [Mythril](<docs/changelog/index.html?topic=Mythril>) (14)
- [Naming](<docs/changelog/index.html?topic=Naming>) (7)
- [Nodes](<docs/changelog/index.html?topic=Nodes>) (2)
- [Options](<docs/changelog/index.html?topic=Options>) (4)
- [Performance](<docs/changelog/index.html?topic=Performance>) (1)
- [Persistence](<docs/changelog/index.html?topic=Persistence>) (38)
- [Planning](<docs/changelog/index.html?topic=Planning>) (169)
- [Playtesting](<docs/changelog/index.html?topic=Playtesting>) (24)
- [Power](<docs/changelog/index.html?topic=Power>) (2)
- [Production](<docs/changelog/index.html?topic=Production>) (59)
- [Progression](<docs/changelog/index.html?topic=Progression>) (184)
- [Publication](<docs/changelog/index.html?topic=Publication>) (2)
- [Publishing](<docs/changelog/index.html?topic=Publishing>) (4)
- [Recipes](<docs/changelog/index.html?topic=Recipes>) (93)
- [Research](<docs/changelog/index.html?topic=Research>) (182)
- [Resources](<docs/changelog/index.html?topic=Resources>) (87)
- [Responsive](<docs/changelog/index.html?topic=Responsive>) (2)
- [Roads](<docs/changelog/index.html?topic=Roads>) (13)
- [Saves](<docs/changelog/index.html?topic=Saves>) (5)
- [Search](<docs/changelog/index.html?topic=Search>) (2)
- [Shortcuts](<docs/changelog/index.html?topic=Shortcuts>) (12)
- [Simulation](<docs/changelog/index.html?topic=Simulation>) (8)
- [Storage](<docs/changelog/index.html?topic=Storage>) (7)
- [Testing](<docs/changelog/index.html?topic=Testing>) (17)
- [Text](<docs/changelog/index.html?topic=Text>) (6)
- [Tooling](<docs/changelog/index.html?topic=Tooling>) (3)
- [Tutorials](<docs/changelog/index.html?topic=Tutorials>) (30)
- [UI](<docs/changelog/index.html?topic=UI>) (4)
- [Undo](<docs/changelog/index.html?topic=Undo>) (4)
- [Waste](<docs/changelog/index.html?topic=Waste>) (21)
- [Workflow](<docs/changelog/index.html?topic=Workflow>) (1)
- [World](<docs/changelog/index.html?topic=World>) (53)
- [World generation](<docs/changelog/index.html?topic=World%20generation>) (9)
- [World map](<docs/changelog/index.html?topic=World%20map>) (18)
- [Writing](<docs/changelog/index.html?topic=Writing>) (1)

## Search from the repository

```powershell
npm run changelog -- --search "connector mirroring"
npm run changelog -- --search "grid snap"
rg -n -i "splitter|mythril|control group" docs/changelog/entries.json
```

The canonical records are in `docs/changelog/entries.json`. Markdown and the offline viewer are generated from that file; edit the records, then run `npm run changelog`.
