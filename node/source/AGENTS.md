# Conversation workflow

During sequential planning, interviews, or other question-and-answer work, handle one question at a time. Once the user resolves or explicitly defers it, briefly acknowledge and record the outcome where relevant, then present the next unresolved question in the same response. Do not end with only an acknowledgment or ask whether to continue. A deliberate deferral is settled for now. Continue until the sequence is complete or the user pauses, stops, or changes direction.

# Naming

Use **Complex Core** (and **Complex** for its tier) in player-facing text, documentation, and discussion. Preserve the serialized `command-core` item/recipe IDs for save compatibility. Command Bots and Command Robotics retain their names.

Use **Mythril** as the canonical spelling in player-facing text, documentation, and discussion. Preserve existing serialized item and research IDs when needed for save compatibility.

# Node categories

Extractors and Lake Intakes are Production nodes. Use that category consistently in the interface, documentation, and discussion; do not describe them as separate from production nodes. Carts, Trucks and Trains are Logistics nodes; they retain their inventory and capacity behavior.

# Player-facing voice

Dry, understated humor is the canonical voice of NODE: Another Factory Game. Use it in modal subtext, tutorial dialogue, introductions, and help text. Keep control instructions, ingredient counts, and goals clear; the joke must never obscure what the player needs to do.

# Interface style

Read [the NODE UI style guide](docs/node-ui-style-guide.docx) and [the style review notes](docs/typography-style-review.docx) before changing player-facing style or copy. Update both as part of the same change. Put the current rule and examples in the guide, and record what changed, where it applies, and how it was checked in the notes.

Reuse the shared typography roles in `src/styles/readability.css`. Use sans-serif for player-facing text, named monospace for technical notation, and reserve heavier weights for hierarchy or essential warnings. Keep the Selected project description at 12 CSS px and its Start and Cancel actions, Core badges, and progress count at regular weight. Match Core badges to the research filter buttons, using labels like Simple and Basic.

# Browser playtests

Read `docs/browser-playtest.md` before starting or recovering browser playtests. It records the verified browser discovery and recovery procedure. Follow current tool documentation if it differs from a recorded example. Preserve the current game during browser recovery.

Before a new run, read `docs/playtest-build-guide.md` and reuse its verified functional node/connection plans through normal gameplay. Preserve successful supply branches while scaling; keep unverified routing experiments separate and update the guide after later verified improvements.

For balance runs, use normal gameplay without grants, save injection, accelerated simulation, or changes to game rules. Queue ordinary bugs and suggested design changes until the run is over. If a progression blocker needs a fix, make the smallest authorized fix, record it, and continue. Keep resource totals and elapsed game time in exported playtest reports; distinguish setup and interaction overhead from production waiting.

# Publishing

The live game is `https://bookskaboo.github.io/node/`, published from `main` in `bookskaboo/bookskaboo.github.io`. An explicit request to publish NODE live authorizes the whole release. Build with `npm run build:site` for the `/node/` base, run the workspace tests, and prepare the matching build in `node/` and source in `node/source/`. Confirm the release changes only `node/` and can fast-forward the current remote `main`, then submit the exact commit and destination through Codex's configured approval flow. Use the request to publish as authorization without asking for a second confirmation in chat.

After the push, wait for GitHub Pages and verify the HTML at the normal live URL and the SHA-256 hashes of every asset in the new build. Update the publication history only after verification. If the configured reviewer denies the push, preserve the tested commit and report the denial and the exact command the user can run. A feature-branch push alone does not publish the live game.

# Change history

Maintain `docs/changelog/entries.json` after each completed meaningful game, documentation, or tooling change. Read `docs/changelog/README.md` for the format. Add a stable NODE ID, local date, concise outcome, topics, source/evidence, actual verification and material limits. Batch related changes; do not log unimplemented proposals as completed. Search the history when checking earlier decisions or regressions.

Keep past records intact. Mark replaced behavior superseded and link the replacing record. Distinguish exact dates from retrospective known-by dates, original-game behavior from the rebuild, and local changes from confirmed publications. Only associate a release after publication is verified. Run `npm run changelog` and `npm run changelog:check` to refresh and verify the generated Markdown and searchable view. Update this history as part of the authorized work without asking for a separate approval.
