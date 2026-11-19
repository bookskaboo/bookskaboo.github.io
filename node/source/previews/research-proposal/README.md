# Historical research proposal preview

This preserves the earlier four-rank design and its captured pre-change catalog in baseline.json. The game now uses the later reviewed node-specific chains through Final Core. This page is a historical comparison, not the current schedule.

Run the local Vite server and open `/previews/research-proposal/`.
Use `?view=tree` to open the dependency tree directly.

The page reuses the game's ResearchPanel, ResearchTreeModal, project details,
Core badges, recipe reference, and shared typography. The Planned and Current
controls reload only this preview document. Progress presets show Refiner through
Complex access. Selecting and starting a project uses an isolated, paused engine
with autosave disabled.

The draft condenses each machine's six efficiency ranks into four, unlocked at
Automata, Hydro, Shiny, and Complex. The cycle factors at those tiers are retained
at 70%, 60%, 50%, and 40%. The proposed prices are 10, 15, 20, and 25 of each Core
through the corresponding tier, totaling 340 Cores per machine versus 560 now.
Optional paid projects also require Automata Core. Road and Exploration each cost
five Simple Cores and depend on Simple Core access. This puts the first map and
Roads before Assembler and Basic Core research. Other essential production projects
retain their progression. Other optional prices are unchanged in the proposal.

Splitter and Merger share a proposed automatic first-Refiner-item milestone.
The Refiner preset shows them pending. Later presets represent that production
having occurred. The shared project type and tree dependency map recognize this
proposed event. The game's current unlock catalog and production triggers retain
their existing rules until the proposal is adopted.

The prototype retains the existing machine rank 3–6 IDs and displays them as
ranks 1–4. This keeps the preview's effects aligned with the existing simulation.
Save migration for adopting this design remains implementation work.

All catalog changes are confined to this page's JavaScript context. The game's
catalog source, live game, and browser saves are not edited by this preview.
