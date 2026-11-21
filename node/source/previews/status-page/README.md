# Upgrades author study

The reviewed screen is now integrated into the unmodded game as **Upgrades** (Q). Production components live in [src/ui/ResearchPanel.tsx](../../src/ui/ResearchPanel.tsx) and [src/ui/upgrades](../../src/ui/upgrades/HintBrowser.tsx); content lives in [botUpgrades.ts](../../src/content/botUpgrades.ts). This page remains an isolated author harness using those same components, portraits, hints and rules. Its controls do not appear in the game.

## Opening the study

Run the development server and open /previews/status-page/. Use ?view=art for all eight portraits, ?view=hints for the full hint review, and ?stage=junior through ?stage=final for paused stage examples. npm run preview:status exports self-contained outputs/status-page/status-modal.html, robot-tier-art.html, hint-texts.html and eight editable SVG portraits. These files also open directly without a server.

Test modal, Robot tier art and Hints and triggers select author views. Adjust wording edits the current role and first assignment in this tab; reload restores approved defaults. Reset example/stage selection creates a fresh isolated factory while retaining transient wording. Autosave is disabled and no campaign slots are imported. Stage fixtures are paused; live queue/practice fixtures run ordinary-speed clocks.

## Reviewed presentation and controls

<a id="research-queue-review"></a>

The title is Upgrades with no eyebrow. A robot, thought bubble, centered Upgrade button and required Core badges form the left column. Desktop character widths are 380 and compact 320 CSS px, with narrow layouts stacked. Portraits share a recognizable face and have distinct Junior/Simple/Basic/Automata/Hydro/Shiny/Complex/Final silhouettes. Art remains editable code-native SVG in the existing NODE family, separate from production Bot art. The [production style sheet](../../src/styles/upgrades.css) uses available game viewport height; the author page retains its own toolbar/gallery styles.

The right side orders mutually exclusive Production nodes/Node upgrades filters and completed projects, search, queue and rows. Selected project details remain hidden. Each row has one compact 190 px card, quantity-first Core badges to its right and actual unlock instructions instead of 0 Cores. Ordinary non-node progression projects remain under Production nodes without changing Build categories. Only the lowest eligible rank per family appears. Extra Map Point is the first nonsticky row. Research-list cards have no active payment bar; queue cards and Upgrade retain actual payment fill.

Single-click selects a card. Double-click or green Queue research appends it, including with keyboard activation. Four distinct ordered cards are visible by default; completion advances FIFO. Removal retains contributions. Pause bars and forward triangle toggle research-only processing, preserving queue, buffers, paid amounts and partial cycles. An enabled bot upgrade has priority outside the four slots; disabling/completing it returns to the queue unless research is explicitly paused.

## Character upgrades

The approved titles are Probationary Unit, Resource Technician, Fabrication Specialist, Systems Coordinator, Operations Supervisor, Development Director, Planetary Administrator and Self-Optimizing Intelligence. Simple upgrade is selectable immediately; each later upgrade requires only its predecessor. Every bill costs five of every Core through its named tier. Simple unlocks Basic Core, through Complex unlocking Final Core; Final spends all seven types and completes the character tiers. Victory is separate. Simple Core itself is an ungated Refiner recipe.

Stable next-Core research IDs implement their preceding upgrades: basicCore is Simple upgrade, through finalCore as Complex upgrade, plus finalBotUpgrade. Core badges show filled/needed quantities with colored dots and no underlines. The button reads only Upgrade and collects Core payments only while selected. Its next tier remains unselected after completion.

### Upgrade benefits and completion notices

The hover/focus tooltip and accessible description name promotion, benefits and priority/return behavior. Shiny lists Complex Core, Yin/Yang recipes and all four revealed corner locations. A 4.5-second completion notice names the earned title and benefits; loaded historical progress is not replayed. Final promises no next Core or victory. No permanent explanatory line returns below Upgrade. Production uses the existing game notification stack; the study uses its matching notice observer and explicit Test completion preview.

## Hints and saved history

<a id="saved-hint-history"></a>

Your assignment reads: You are a junior AI bot assigned to this world. Use its resources to build production systems, manufacture Cores, and upgrade yourself. It appears first in a fresh Junior example. Moving forward acknowledges it and shows Forest; Wood/Kiln progress skips the introduction. Progress selects the existing primary hint automatically. Corner triangles and left/right keys browse eligible history; unreached hints stay hidden. Wheel scrolling never changes the selected hint. The hidden inaccessible assignment reference holds uniform dimensions across hint changes, with compact padding and a small arrow gap.

researchHintHistory saves learned title/detail copies and assignment acknowledgement with each factory. Closing/reopening, traveling and saved-factory reload preserve the archive, while reopening recommends the current primary. Old saves seed current candidates only. Invalid entries are dropped, duplicate titles merged and loaded history bounded to 256 entries. Undo retains knowledge; replacing factories uses their own history. The actual game observes publications even while the modal is closed. The author study does the same without a global browser key.

The full [hint review](../../outputs/status-page/hint-texts.html) exposes all 46 entries and their eligibility/retirement conditions for authors; it is not a fixed sequence or a player unlock list. It retains the approved Iron prospects, Road, Exploration and Lake wording and the deliberately retained Dwarven Tribute wording. Splitter and Merger use actual first Simple Core production in the game and study.

## Banked Map Points and Node Map

Extra Map Point uses the destination-free completion-count/Core-access schedule, initially five Simple Cores, and banks one point on completion. The active or parked quote remains fixed through project switching, Core unlocks and reload; the next purchase uses the next scheduled bill. Research never opens a map.

The study's external Node Map control opens the shared modal without saving map-layout preferences. Select an eligible frontier and Activate node · 1 point, or double-click it. Unlocking does not visit/travel; Travel is separate. Zero points disables activation. Adjacency, world bounds and remaining capacity still apply. Unfinished Deep Holes do not block neighboring-map purchases. Test supply/completion controls still operate on the Home lab after travel.

## Preserving saved research

The game now applies the accepted unmodded migration on normal load/engine replacement. [migrateUpgrades](../../src/simulation/upgradesMigration.ts) keeps earned recipes and active/parked Core payments, derives the character stage from stable completion IDs and fills missing earlier milestones implied by higher historical recipe access. Simple discovery alone stays Junior; Final Core and victory do not grant Final character completion. Explicitly saved finalBotUpgrade is retained. Reapplying migration has no further effect.

Selection, queue, explicit pause, stock and partial lab cycles persist. Missing queue defaults become enabled, with an ordinary selected project adopted as head and bot priority kept outside the slots. Existing map purchases adopt point mode with their exact quoted bill/completion index and paid Cores; only the old destination is released. Existing points and opened/visited maps are retained. Actual save-slot and input-isolation coverage is in [UpgradesIntegration.test.tsx](../../src/ui/UpgradesIntegration.test.tsx).

Applied-mod Upgrades support is deliberately deferred. The actual game retains its existing Research screen/catalog for factories with applied packages and does not convert their absent map marker. No mod-price replacement policy has been selected. This study certifies stock-catalog fixtures only and does not import modded campaign slots.

### Converted destination purchases

Test saved map purchase starts an isolated legacy-shaped E1 quote: nine Simple and four Basic, seven Simple/all four Basic paid (11/13). Research is paused; the ordinary simulation clock runs and the lab retains 1.2 seconds. Resume to consume only two outstanding Simple Cores. Completion banks one point and resumes the queue; the player can choose N1 instead of E1 in the Map modal. Old E1 stays locked until chosen. [Coverage](mapPoints.test.ts) includes active/parked quotes, prior points, source isolation, normalized reload and idempotence.

## Basics research transition

The actual game uses the reviewed full Basics lesson with Upgrades. This harness also offers Test Basics research for just its existing cores-open → cores-explain → cores-complete segment. A separate stocked Home lab and normal five-second cycles exercise the same guide, project guards and actual payment condition.

Only Assembler and one slot appear. Selecting alone does not advance. Queue research/double-click share the guard; unrelated projects, Upgrade, recipes, filters/search and removal are disabled. Pause/resume remains available. After all five actual payments, the guide introduces the normal four-card queue and Simple upgrade unlocking Basic Cores. Restart resets this segment; Exit/Finish restore the original author engine, including queue and paid amounts. The production lesson retains all 19 placement/production/delivery/research/options stages and its existing independent factory lifecycle.

## Payment test controls and verification

The external Payment tests menu provides Test 2 payments, Test completion, Load live queue lab, Test saved progress, Test saved map purchase, Reload factory snapshot, Test Basics research, Supply test Cores and Complete current test project. These are synthetic author controls. Complete current test project supplies and steps only the selected project through ordinary engine cycles; it is not normal-play balance evidence. Reload factory snapshot serializes and normalizes the current isolated state rather than creating a fresh world. Whole-page reload creates its starting fixture.

Test saved progress shows a Basic bot, enabled Automata upgrade at 2/5 for Simple/Basic/Automata, parked Extractor 1 with three paid Simple Cores and Kiln 1 second in the paused queue. Snapshot reload preserves these values. Disable priority and resume to inspect the queued payment; re-enable to see the retained upgrade bill.

Checks: npx tsc -p previews/status-page/tsconfig.json, npx vitest run previews/status-page/, npm run preview:status. Main integration evidence is in [the report](../../outputs/upgrades-integration/verification.json) and [current system references](../../docs/systems/research.md). No campaign pacing or applied-mod progression claim follows from these synthetic fixtures.
