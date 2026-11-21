# Interface and assets

[System index](README.md)

The interface uses React panels alongside the Pixi factory field. Shared content names, colors, geometry and typography keep the Build menu, field nodes, recipe views and research presentation consistent.

## Typography and copy

Roads use the adopted controls in the main game: no gear, stationary right-click flow reversal, and a red Travel arrow outside the playable field with its label above it. Every direction uses the same 32 × 32 CSS pixel arrow footprint. Travel and double-click retain zoom and focus and highlight the paired endpoint. The isolated [Road workshop](../../previews/road-workshop/README.md) retains nine connected maps for review without campaign storage and uses the standard renderer.

The [UI style guide](../node-ui-style-guide.md) owns current style rules and examples. The [style review notes](../typography-style-review.md) record changes, applicability and checks. Read both before changing player-facing style or copy, and update both in the same change. Markdown is the maintained format; Word copies and LibreOffice page rendering are not required. Original DOCX snapshots are retained only in the [archive](../archive/style-reference-docx/README.md).

[Readability styles](../../src/styles/readability.css) define shared type roles, including a sans-serif UI family and a named monospace family for technical notation. Reserve heavier weight for hierarchy and essential warnings. Selected project descriptions remain 12 CSS px; Start/Cancel actions, Core badges and progress counts use regular weight. Core badge labels match research filters, such as Simple and Basic.

Dry, understated humor is the game's voice in modal subtext, tutorials, introductions and help. Keep control instructions, quantities and goals explicit. Use Complex Core and Mythril in player-facing text; retain compatibility IDs internally. Command Robotics and Command Bots keep their names. Stone resource nodes use the title Stone, retaining the serialized stoneDeposit kind. Existing default Stone Deposit titles normalize on load, while custom titles remain. Guarded camps keep their AP socket centered, with its badge on the left. Newly generated reserves share its vertical center but sit farther right: their left edge is 12 world units beyond the rightmost visible camp point at the fully suppressed 10% footprint. The entire card clears that footprint and is reached again at 20%. Guarded-camp art is enlarged from 144 to 256 world units, above the socket and left of the deposit; keep the title above the image and AP card below the resource. Stable background layering keeps the reserve visible through camp selection. Locked reserves remain inspectable and use the same red card colors and opacity as camp-covered nodes, without a padlock or status label on the card. Full suppression restores normal colors. All Goblin and Dwarven settlement AP cards, including legacy worlds, show only the AP amount and bar; omit the lower countdown/result text and its empty row. Timing, results and access explanations remain in the inspector.

Fully suppressed guarded camps display a system-owned refill output and deposit inlet joined by a noninteractive resource-colored cable. Blue packets and arrival pulses represent actual refill awards, with regular technical batch quantities, and stop at the reserve cap. Suppression loss hides the connection. Game pause, reduced-motion and particle preferences apply; historical refills are not replayed on load. The centered AP input and player extraction output remain distinct.

## Asset ownership

The Upgrades robot uses [shared vector parts](../../src/ui/upgrades/robotArt.ts), [seven assembly schedules](../../src/ui/upgrades/robotAssembly.ts) and [the portrait component](../../src/ui/upgrades/RobotPortrait.tsx). Each payment advances actual hardware toward the next existing model. During an active character-upgrade lab cycle, only affected upcoming parts flash against the paid chassis once per 1.2 seconds. They become solid immediately when the synchronized Core set is consumed. Pause, disabled/waiting labs and unrelated research stop the preview. Reduced motion suppresses the unpaid flash. Finished vectors, portrait bounds, hint dimensions and controls stay fixed. The [animation gallery](../../previews/status-page/RobotAnimationGallery.tsx) offers isolated playback and payment scrubbing, with 2.4-second example processing intervals that do not alter game research timing.

| Module | Role |
| --- | --- |
| [Line art](../../src/art/lineArt.ts) | Shared vector icon family |
| [Node art](../../src/art/nodeArt.ts) | Node illustration assets |
| [Item art](../../src/art/itemArt.ts) | Material illustration assets |
| [Recipe art](../../src/art/recipeArt.ts) | Recipe presentation assets |
| [Corner illustrations](../../src/art/cornerIllustrations.ts) | Corner encounter imagery |
| [Dragon illustration](../../src/art/dragonIllustration.ts) | Ancient Dragon imagery |

Node modules select icon, shape and embedded controls; shared domain geometry supplies dimensions and sockets. The renderer and React icon components should reuse these sources rather than introduce independent silhouettes or ingredient identities. Material colors come from the item catalog.

The game and [border obstruction art study](../../previews/border-obstructions/README.md) share the [river, mountain and chasm vectors](../../src/art/borderObstructionArt.ts). [Pixi terrain](../../src/renderer/borderTerrain.ts) keeps each band centered on the boundary at the published width (cross-band scale 3.75 in world units, 25% wider than the first published bands), with a common orientation on both sides. Length follows the field edge while width remains fixed during Area Expansion. A per-field mask exposes only that sector's half. The selected Road placement/move ghost includes the adjacent half using the existing crop, orientation and 48-unit gap; canceling hides it. Cables and ordinary Road endpoints remain above terrain. Research changes placement permission, with no after-research artwork. Individual mountain faces are narrower inside the wider ridge, with base cross-band offsets at 55% and along-band offsets at 75% of the original shapes. Stable per-border variation adds irregular spacing, lateral positions, face scale, lean and shade; lower faces overlap upper ones. The world seed and canonical shared-border identity preserve matching halves and repeatable redraws. Use dense, irregular mountain clusters with two to four faces per pocket, spread across the ridge and allowed to overlap. Keep every peak upright on all four borders; counter-project peak vertices for north/south bands rather than rotating the mountain silhouettes sideways. Bias the upright mountain faces toward the upper half of each horizontal shared band so more complete bases remain visible on a south border. Apply the same canonical shift to its north-side view and Road ghost; keep the ridge band centered and east/west faces in place. Generation clearance follows the shifted peak bounds. Retain the current widened bands and slim individual faces. Rivers retain water/banks/current strokes without exterior four-sided debris or caret marks. Chasms retain lips and interior cliff contours without exterior diamonds or Y marks. Shared art geometry also supplies conservative generation bounds; newly generated resource and obstruction bodies leave a 32-world-unit gap, including maximum settlement growth, future Golem reserves and Area Expansion. This does not add a player-building exclusion. Explicit path vertices keep native SVG and Pixi consistent; Pixi does not apply nested SVG group transforms. The gallery's side selectors, enlargement and SVG downloads remain art review tools. This art and clearance revision was published in [48f50fd](https://github.com/bookskaboo/bookskaboo.github.io/commit/48f50fda634343154e4adb67a9953b065d137299).

## Panels and responsive behavior

The main Node Map uses [shared-edge symbols and summaries](../../src/ui/MapBorderObstructions.tsx): waves, peaks and paired fractures, revealed after either neighbor is visited. Researched terrain stays visible at reduced emphasis; Road markers sit above it. Border side/type entries appear as ordinary Points of Interest subtext, without a separate Border obstructions heading; hover and accessible marker labels identify terrain and the two positions without research text. The [nine-sample modal test](../../previews/border-obstructions/README.md#node-map-modal-test) retains its explicit overlay/point-of-interest overrides and external author research controls. The [real engine fixture](../../previews/border-obstructions/runtime.html) uses the generated 36-border layout and ordinary map defaults. Both disable autosave and minimap-layout persistence; main-game persistence defaults remain enabled.

The game and [terrain author review](../../previews/terrain-tiles/README.md) share [sixteen current 768-unit irregular SVG tiles](../../src/art/mapTerrainArt.ts): adjoining clay cracks, asymmetrical grass patches, independent dune bands and joined stone slabs. [The Pixi texture cache](../../src/renderer/mapTerrain.ts) rasterizes the native SVG viewport once per used terrain/variant and repeats it over the full field, including Area Expansion. Native rasterization preserves clipping and wrapped group transforms; Pixi's direct SVG path conversion produced seams during review and is not used for these tiles. Grid, border obstructions, completed-hole ground, cables, node bodies, sockets and selection remain above the ground. Cached textures are released with the field. Road ghosts use the same floor only for previously visited adjacent sectors; unvisited terrain stays hidden.

New-game [ground terrain rules](map-nodes-and-exploration.md#ground-terrain-for-new-games) reveal Terrain: Badlands, Grassland, Desert or Rocky as a heading directly above Resources matching its font and size and using the terrain accent color in selected-map details after first visit. The expanded Node Map also gives visited cells a subtle 18% mix of the same terrain accent over the dark base. The compact map remains untinted; current/Home borders, selected outlines and depletion warnings retain their existing emphasis. Frontier, purchased-but-unvisited and legacy survey-only unvisited maps reveal no terrain color or label. The full-map developer action now sets visited flags and reveals saved terrain normally. Existing saves and training retain their plain field. The [real engine review](../../previews/terrain-tiles/runtime.html) compares generated new/legacy reserves, actual terrain rendering, synthetic Production/cable context, grid, snapshot reload and Node Map without autosaves or map-layout persistence. The author page retains all three art drafts, four variants each, full-layout statistics and downloads; only the selected irregular draft enters the game. Its assignment controls use the runtime distribution module. Normal-play terrain balance checks remain pending.

Build, Research, Recipes, Inventory, Journal, Options, Saves and Mods provide distinct tasks. Research includes the prerequisite tree, selected-project details and reactive hints. The Node Map expands from the minimap and retains its position and zoom preferences. Shortcut bars fit available space without replacing the player's saved preferred layout.

Changes should preserve keyboard dismissal, tooltip access, narrow-window scrolling, recipe links and existing tutorial restrictions. Source modules and automated tests can check behavior; browser inspection is still needed for clipping, contrast, focus and pointer interaction.

Field cameras have a fixed 15% maximum zoom-out (minimum scale) and retain the existing 220% closest zoom. Wheel input, restored views, travel and exterior Road previews share the same limits. Overview framing centers the field without dropping below 15%; narrow screens may require panning.

On the factory field, secondary labels and buffer details appear at 15 percent
zoom and above. Selection, hover, dragging or a cable endpoint restores detail
for the affected node at smaller zoom. Recipe icons, node bodies, sockets,
progress and low-zoom waiting/blockage indicators remain available. Deep Hole
and Golem readouts keep their existing special treatment. Culling is visual
only: offscreen machines continue producing. Native display density is capped
at two for the playfield and canvas labels to bound pixel and texture costs.

Below 40 percent zoom, ordinary node artwork is shared as small cached images of the existing
vectors. From 15 percent up to that transition, text and live buffer boxes overlay the cached artwork. Progress bars and waiting/arrival overlays stay dynamic. Generic socket
labels follow the same detail threshold as Production labels; full text and
buffers return on inspection. Natural resources, Extractors and Research Centers
retain specialized live views. Cable neighborhoods cache their existing colors
and curves at overview scale, and refresh locally when an endpoint moves or a
route changes. Zooming in returns to vector drawing and the original controls.

The isolated active-factory preview can restore distant text and live buffer
boxes below 15 percent over those cached bodies. Its comparison checkbox uses the existing
toolbar styles and leaves ordinary game defaults unchanged. Small labels retain
their usual zoom scale, so visibility alone does not guarantee readability at
the full-factory overview.

Sources: [UI components](../../src/ui/App.tsx), [node modules](../../src/content/nodeModules.ts), [shared geometry](../../src/domain/nodeGeometry.ts), [stylesheet entry](../../src/styles.css), [responsive layout](../../src/ui/responsiveLayout.ts). Broader art/audio direction and unfinished production work remain in the [art audio and writing plan](../master-plan/06-art-audio-and-writing.md).

<a id="status-page-study"></a>

## Upgrades screen

Unmodded factories open **Upgrades** from the toolbar, Q shortcut, Research Center and research navigation. [ResearchPanel](../../src/ui/ResearchPanel.tsx) owns the production modal; applied-mod factories route to [LegacyResearchPanel](../../src/ui/LegacyResearchPanel.tsx) until support is revisited. Selected project details and the old tree action are hidden in Upgrades. Author fixture controls never appear in the game.

The left column contains only the robot, always-visible thought bubble, one centered Upgrade button and paid/required Core badges. Desktop width is 380 CSS px, dropping to 320 at compact desktop widths; narrow screens stack the columns in a scrolling modal. Portrait height shrinks in short windows, with column scrolling retaining access to the full bill. The modal fits below the toolbar; it does not change document overflow. Short desktop windows keep all four queue slots in one compact row so the project list remains usable.

The thought bubble reserves the dimensions of Your assignment at the current width. Small corner triangles and left/right keys browse learned hints; the wheel does not change hints. Keep 12 px top, 10 px bottom and a 2 px gap above the arrows. Future hints remain hidden. Progress chooses the eligible primary automatically; history and assignment acknowledgement belong to the factory. [Guidance rules](tutorials-and-discovery.md) retain original eligibility and reviewed wording.

The right column orders exclusive Production nodes/Node upgrades filters with completed projects beside them, then search, the four-card queue and rows. Each row retains one 190 px card (at most 48 percent on narrow layouts), with quantity-first regular-weight Core badges to its right. Free rows show actual unlock conditions instead of 0 Cores. Extra Map Point is the first ordinary nonsticky row. The lowest eligible rank per machine family is offered. Research-list cards omit active progress bars; queue cards and Upgrade retain real payment fill.

Single-click selects a card; double-click or the green Queue research action adds it. Pause bars/forward triangle toggle research processing with accessible Pause research/Resume research names. Preserve selection, queue and paid Cores across temporary recipe inspection; Back to Upgrades restores the same originating badge focus and list scroll. Tab/Shift+Tab wrap through visible modal controls, tutorial navigation and notices; Escape closes and Q reopens. Guided mode omits aria-modal so the separate practice card remains available to assistive technology.

Basics permits only its current project and one research slot. Upgrade, unrelated choices and recipe navigation are disabled. Completed Joint inspection enables its completed-project checkbox. At compact widths the disabled character column is hidden during practice to leave room for the lesson's controls. Mobile practice stacks the modal above the tutorial card without overlap.

The [character art source](../../src/ui/upgrades/robotArt.ts) supplies eight editable vector portraits with a shared face and distinct silhouettes: narrow Junior, rounded Simple, square Basic, spread-arm Automata, coolant-equipped Hydro, angular Shiny, processor-finned Complex and orbital Final. [Promotion names and bills](research.md#character-progression) are shared content data. Production Bots retain their separate art and names.

Upgrade tooltips/accessibility descriptions list promotion and benefits; Shiny names Complex Core, Yin/Yang and four revealed corner locations. Existing 4.5-second research notices announce new character completions without replaying loaded history. Final does not promise another Core or victory. No permanent description returns below Upgrade.

Sources: [shared controls](../../src/ui/upgrades/BotUpgrade.tsx), [list selection](../../src/ui/upgrades/researchList.ts), [thought bubble](../../src/ui/upgrades/HintBrowser.tsx), [dedicated styles](../../src/styles/upgrades.css), [shared text roles](../../src/styles/readability.css). The [author study](../../previews/status-page/README.md) retains the art gallery, editable wording, hints/triggers and synthetic test fixtures using these same source components.
