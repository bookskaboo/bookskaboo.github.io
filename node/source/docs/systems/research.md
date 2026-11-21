# Research and Upgrades

[System index](README.md) · [Complete research catalog](catalogs/research.md)

Unmodded factories use **Upgrades** (Q) for character progression and ordinary research. The robot uses this world's resources to manufacture Cores and upgrade itself. The single Research Center stays anchored at Home and processes synchronized Core sets. Applied-mod factories retain the existing Research screen/catalog while support for the new progression is deferred.

## Character progression

The portrait gradually assembles the next tier as actual upgrade contributions are paid. Its permanent fraction is the sum of researched Core quantities divided by the full required bill, matching the Upgrade button. While the selected character upgrade has a ready, enabled Research Center with an active nonzero cycle and every outstanding Core type, flash a preview of its next synchronized payment. The preview alternates affected parts once per 1.2 seconds; it is not paid progress. Consuming the full set commits the hardware immediately. Stock waiting in a lab, unfinished cycles, disabled labs, game/research pause and unrelated projects cannot commit hardware. Parked payments preserve the same hybrid chassis on disable, reopen and reload. The final payment becomes the existing next-tier artwork. Presentation uses existing paid amounts and lab state, with no new save fields, processing rules or unlock effects. Reduced motion hides the unpaid flash and keeps immediate paid updates.

Simple Core is a starting Refiner recipe with no research gate or card. Each character upgrade unlocks the next Core recipe. Machine access and ingredients still determine whether that recipe can actually be produced.

| Upgrade | Promotion | Bill | Unlock |
| --- | --- | --- | --- |
| Arrival | Probationary Unit | None | Junior starting stage |
| Simple | Resource Technician | 5 Simple | Basic Core recipe |
| Basic | Fabrication Specialist | 5 each through Basic | Automata Core recipe |
| Automata | Systems Coordinator | 5 each through Automata | Hydro Core recipe |
| Hydro | Operations Supervisor | 5 each through Hydro | Shiny Core recipe |
| Shiny | Development Director | 5 each through Shiny | Complex Core and Yin/Yang recipes; reveal all four corners |
| Complex | Planetary Administrator | 5 each through Complex | Final Core recipe |
| Final | Self-Optimizing Intelligence | 5 each of all seven Cores | All character upgrades complete; victory remains separate |

Simple upgrade is selectable at the start. Every later upgrade becomes selectable immediately after its predecessor completes, without extra technology/production gates. The button stays labeled Upgrade; ascending Core badges show paid/required amounts and the button fills from actual contributions. The next upgrade remains unselected after completion. Tooltip/accessibility copy names promotion and benefits; Shiny lists all three effects. Existing research notifications announce the completed promotion for 4.5 seconds, with no historical replay on factory load.

Stable recipe project IDs represent their preceding character upgrade: basicCore is Simple upgrade, through finalCore as Complex upgrade. finalBotUpgrade is the new Final character upgrade. The [catalog transform](../../src/content/botUpgrades.ts) applies only to the unmodded runtime catalog; the preserved base catalog still supports deferred applied-mod factories. Existing completed recipe projects and payments migrate without repayment; [save policy](saves-and-compatibility.md#migration-policy) owns this boundary.

## Discoveries and ordinary projects

[Landmarks](landmarks.md) extend Resource Relocation to every landmark type. Its post-victory-research gate and one-time price of one of each of the seven Core types are unchanged. Moves remain within the current Map Node and have no additional material fee; no separate landmark project is added.

Automatic discoveries include extraction, Plate production, Lake/camp encounters and first Simple Core production. They are not manual lab projects. Splitter and Merger unlock together when one Simple Core is actually produced; stock, Refiner access and other outputs do not satisfy that trigger. Historical simpleCore and cornerComponents IDs remain readable, without live cards.

Ordinary projects retain their prices and prerequisites. River Bridges, Mountain Tunnels and Chasm Spans grant worldwide Road crossing permissions without removing terrain or placing Roads. See [crossing rules](roads-and-vehicles.md#border-crossing-research). Connector Mirroring retains its complexCore gate and 10 of each Core through Complex; unfinished old contributions remain valid.

The right column orders mutually exclusive Production nodes/Node upgrades filters and the completed-project checkbox, then search, queue and research rows. Selected project details stay hidden. Ordinary progression research appears under Production nodes without changing actual Build categories: Extractors/Lake Intakes are Production, vehicles are Logistics. Node upgrades offers only the lowest eligible rank per family. Extra Map Point remains the first ordinary, nonsticky row. Each 190 px card has quantity-first Core badges on its right; free/automatic rows show their actual unlock requirement instead of 0 Cores. List cards have no payment bar. Search may include related recipe/prerequisite terms; it does not reveal later machine ranks.

<a id="optional-queue-and-research-pause"></a>

## Queue and priority

Single-click selects a card. Double-click or Queue research appends it. Four distinct cards, including the active queued project, run FIFO. Duplicate, unavailable and full-queue attempts explain the result. Completion removes the card and starts the next eligible project. Each repeatable appears at most once at a time. Removing a project retains its paid contributions.

The icon-only control shows pause bars while research is enabled and a forward triangle while paused. It pauses only research processing, retaining queue, buffered/paid Cores and partial cycle time. Other production continues. New unmodded factories start with an empty enabled queue; valid saved pauses remain in force.

An enabled bot Upgrade takes priority outside the four queue slots. Disabling or completing it resumes the preserved queue unless research was explicitly paused. It collects Cores only while selected. releasePriorityResearch preserves payments and releases older queue-adopted priority entries; ordinary manual cancellation retains its prior semantics.

## Payment cycles and Map Points

A base Research Center cycle is five seconds, including the first payment. A cycle consumes one of every outstanding Core type together. If an outstanding type is missing, stocked types wait and cycle progress resets. Fully paid types are omitted. Five Simple plus five Basic therefore takes five synchronized sets, not ten serial cycles. Switching projects resets partial cycles while retaining per-project contributions.

Extra Map Point research needs no destination and awards one banked point. Its completion-count/Core-access price schedule starts at five Simple Cores. A quoted active/parked bill stays fixed through switching, Core unlocks and reload; the next purchase reprices normally. The player spends points in the Map modal to activate a frontier, then travels separately. Existing destination quotes retain exact bills and paid Cores but release their old target and award a point on completion. Existing opened/visited maps and saved points remain intact. [Map rules](map-nodes-and-exploration.md) cover capacity and selection.

## Guidance and practice

The robot's always-visible thought bubble starts with Your assignment. Arrow triangles and left/right keys browse only previously eligible clues; the primary hint follows world progress automatically. Its dimensions stay anchored to the assignment at the current column width; wheel scrolling never changes the chosen hint. Learned hint copies and assignment acknowledgement persist with the factory. [Guidance](tutorials-and-discovery.md) owns eligibility/history.

Basics uses the actual Upgrades screen: inspect completed Joint, later select Assembler and press Queue research. Practice permits only its required project and one queue slot, with unrelated controls disabled. Actual lab payment is required before the full four-card explanation. Restart/Exit/Finish retain the existing isolated-practice lifecycle.

Sources: [screen](../../src/ui/ResearchPanel.tsx), [shared controls](../../src/ui/upgrades/ResearchQueue.tsx), [catalog](../../src/content/botUpgrades.ts), [runtime](../../src/simulation/researchRuntime.ts), [migration](../../src/simulation/upgradesMigration.ts), [legacy mod screen](../../src/ui/LegacyResearchPanel.tsx).

Coverage: [adoption and slots](../../src/ui/UpgradesIntegration.test.tsx), [queue/payments](../../src/simulation/researchQueue.test.ts), [map research](../../src/simulation/mapResearch.test.ts), [legacy-compatible transition fixtures](../../previews/status-page/savedProgress.test.ts), [banked quotes](../../previews/status-page/mapPoints.test.ts). The [author study](../../previews/status-page/README.md) remains available for art, copy and synthetic fixtures; its controls are not part of the game.
