# Development tools

[System index](README.md)

Development tools inspect or prepare game states for debugging. They are separate from ordinary progression and must not be used to establish normal-play balance results.

## Dev Sources

Dev Source is a hidden, movable and saveable supplier placed from the developer panel rather than the normal Build catalog. Its outgoing cables infer demand from their destination sockets. Recipe inputs receive their ingredients, research receives required Core types, and bot/encounter inputs receive appropriate supply. Generic inputs inspect downstream demand or fall back to Iron. Unconfigured recipe machines wait for a recipe; one generic socket does not receive every unrelated material at once. Declared mod reserve materials participate in Extractor inference.

Extractors connected to a Dev Source use a virtual infinite reserve on their ordinary extraction cycle. Production and research still use normal timing and prerequisites. Obstruction rules still apply. For a Road shipment, supply the sending freight vehicle, then use the normal Road pair and receiving vehicle.

Dev supply uses the engine’s input-capacity grouping, including independent Ancient Foundry ingredient quotas. One cable per Foundry input can fund all three requirements without one material occupying another’s buffer. Direct Recycler supply selects the normal automatic material recipe, with Water on its separate inlet. All selectable recipe ingredients and all 25 Bot Plant part combinations are covered by the supply checks.

Recipe changes retain valid Dev Source cables where possible. Supply pulses are cosmetic feedback rather than additional material cargo. Automatic shortage recovery excludes worlds using Dev Sources, so debugging supply does not mix with ordinary recovery behavior.

## Automatic tutorial prompts

Using an enabled Dev control mutes automatic tutorial invitations and the Dwarven discovery notice for that factory. The saved devTutorialPromptsSuppressed flag is set before the action, including Show all nodes and choosing Place Dev Source. Direct engine unlock commands and successful Dev Source placement set it too. The quiet setting survives undo and save/load; a fresh factory starts without it. Manual Tutorials retain their ordinary unlock conditions and remain available. Suppression does not mark lessons seen or complete.

Older saves with devResearchUnlocked, devMapSurveysRevealed or a placed Dev Source also remain quiet without rewriting their tutorial history. Export playtest report remains observational and does not set the suppression flag.

## Other developer actions

The developer panel can preview locked nodes, unlock buildable nodes, complete permanent research with Map Points, and unlock every map as explored. The map action generates/unlocks all supported world cells, marks each visited, updates encounter discovery, and reveals saved terrain colors/types where present, surveys, border entries, landmarks and corner markers. It leaves the active map and saved cameras in place and does not complete paid research. The explored flags survive saves. Older survey-only dev saves may run the action again until every map is visited. Its undo checkpoint restores pre-action visits and encounter discovery; ordinary exploration remains persistent across other undo commands. These overrides affect gameplay evidence. Mark reports using unlocks, grants, synthetic fixtures or direct engine setup accordingly; keep those results separate from browser playtests through normal controls.

Export playtest report produces JSON containing simulation time, seed, extracted and produced totals, and the complete state. This export is observational and can support a normal-play report without changing the game. Keep setup/interaction overhead and production waiting separate in the accompanying run notes.

Catalog previews and analytical scripts are useful for inspecting parts, milestones and costs without altering a player save. Their outputs establish only what the script checks. The [testing reference](testing-and-publishing.md) identifies standard commands and evidence boundaries.

Sources: [developer panel](../../src/ui/panels/DevPanel.tsx), [demand inference and supply](../../src/simulation/devSource.ts), [engine actions](../../src/simulation/engine.ts), [Dev Source regression tests](../../src/simulation/devSource.test.ts).
