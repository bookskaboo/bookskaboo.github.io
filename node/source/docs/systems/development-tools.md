# Development tools

[System index](README.md)

Development tools inspect or prepare game states for debugging. They are separate from ordinary progression and must not be used to establish normal-play balance results.

## Dev Sources

Dev Source is a hidden, movable and saveable supplier placed from the developer panel rather than the normal Build catalog. Its outgoing cables infer demand from their destination sockets. Recipe inputs receive their ingredients, research receives required Core types, and bot/encounter inputs receive appropriate supply. Generic inputs inspect downstream demand or fall back to Iron.

Extractors connected to a Dev Source use a virtual infinite reserve on their ordinary extraction cycle. Production and research still use normal timing and prerequisites. Obstruction rules still apply. For a Road shipment, supply the sending freight vehicle, then use the normal Road pair and receiving vehicle.

Recipe changes retain valid Dev Source cables where possible. Supply pulses are cosmetic feedback rather than additional material cargo. Automatic shortage recovery excludes worlds using Dev Sources, so debugging supply does not mix with ordinary recovery behavior.

## Other developer actions

The developer panel can preview locked nodes, unlock buildable nodes, complete permanent research with Map Points, and unlock map nodes with surveys. These overrides affect gameplay evidence. Mark reports using unlocks, grants, synthetic fixtures or direct engine setup accordingly; keep those results separate from browser playtests through normal controls.

Export playtest report produces JSON containing simulation time, seed, extracted and produced totals, and the complete state. This export is observational and can support a normal-play report without changing the game. Keep setup/interaction overhead and production waiting separate in the accompanying run notes.

Catalog previews and analytical scripts are useful for inspecting parts, milestones and costs without altering a player save. Their outputs establish only what the script checks. The [testing reference](testing-and-publishing.md) identifies standard commands and evidence boundaries.

Sources: [developer panel](../../src/ui/panels/DevPanel.tsx), [demand inference and supply](../../src/simulation/devSource.ts), [engine actions](../../src/simulation/engine.ts), [Dev Source regression tests](../../src/simulation/devSource.test.ts).
