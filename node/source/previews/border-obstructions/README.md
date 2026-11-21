# Border obstruction art study

Open `/previews/border-obstructions/` on the local development server. `npm run preview:border-art` creates the built page in `outputs/border-obstructions-page/`, a [self-contained HTML copy](../../outputs/border-obstructions-page/border-obstructions.html) that works without a server, and three terrain SVGs in its `art/` directory. The built page is also served at `/outputs/border-obstructions-page/`.

The study shows rivers, mountains and chasms with NODE's dark field palette, outlined vector shapes, faceted rock and shared UI typography. Enlarge each illustration, toggle the 32-unit grid or nearby Production node examples, and download an SVG. Nearby examples reuse the actual line-art paths and illustrate visual contrast; this is an artwork study rather than a running engine fixture.

The Map Node simulation normally shows only the current factory field and clips every terrain strip to its borders. Each strip keeps its total width centered on the shared boundary, with its outside half hidden. Place Road reveals the selected neighboring map ghost and that map's matching terrain half. The simulation reuses the game's near-half crop, normal orientation and preview gap through [Road preview geometry](../../src/renderer/roadPreviewCrop.ts). Edge selects the destination; Crossing research complete toggles the permission example. Missing research shows blocked ordinary Road previews while retaining the ghost. Cancel Road placement hides the ghost. These controls do not build or save actual Roads.

North, East, South and West selectors choose Clear, River, Mountain or Chasm. The default has an East river and West mountains. Adjacent occupied sides are rejected with a written explanation and preserved existing sides; two opposite sides are permitted even when their terrain types differ. Clear both occupied sides to switch orientation. The [shared layout rule](../../src/domain/borderObstructionLayout.ts) is used by this simulation and the integrated world generator, which validates both endpoints of each border.

The [simulation renderer](mapNodeSimulation.ts) owns current-field clipping and the temporary Road ghost, while the terrain vectors stay in the reusable art module. This separates the review controls and existing renderer geometry from game asset ownership.

## Node Map modal test

Open [the modal test](map-modal.html), or the [standalone modal test](../../outputs/border-obstructions-page/map-modal.html) after building. It uses the actual NodeMinimap and MapNodeDetails components, with nine deliberate display borders: three rivers, three mountains and three chasms. These samples satisfy the no-right-angle rule at both endpoints; they do not claim to implement the adopted whole-world 16/12/8 distribution.

Wave marks, mountain peaks and split fracture marks sit on shared tile borders. Hover identifies the terrain and adjacent map positions. Selecting either adjacent map lists only the obstruction's side and terrain in the details panel. Research requirement and permission text is omitted from both summaries and tooltips. The author toolbar retains None, Hydro, Shiny and Complex research examples; terrain remains visible after permission is granted. Surveyed map reveals every sample, while the partial survey hides any border with neither adjacent map visited. Close, Escape and Open Node Map work independently of the game.

The preview disables GameEngine autosave and NodeMinimap layout persistence. Optional mapOverlay and sectorSummary slots add only this specimen's graphics and detail rows; the main game passes neither and uses the generated border markers and summaries with its normal persistence defaults. The fixture is not a normal-play run and does not consume or modify a player save. The standalone export includes its styles and script.

Research grants placement permission for ordinary Road nodes. No separate bridge, span, tunnel portal or after-research image is needed. Counts and tiers follow the [adopted plan](../../docs/master-plan/21-border-obstructions.md). Names and counts remain outside the illustration for narrow-screen readability.

The reusable vector source is [borderObstructionArt.ts](../../src/art/borderObstructionArt.ts). The game renderer, gallery and export helper share it. The gallery never reads or writes browser storage or initializes a game; the integrated feature applies to new games and preserves legacy worlds.

## Real engine test

Open [the engine fixture](runtime.html) or its [self-contained build](../../outputs/border-obstructions-page/runtime.html). It uses seed 37, all 36 generated borders, the real Pixi field and adjacent-map ghost, the ordinary Node Map and engine Road placement. Synthetic empty fields remove resource and encounter collisions for inspection. Autosave and minimap layout persistence are disabled. Terrain, Next border and View other side inspect all four directions. Hold Road and move the pointer over the canvas to show the centered preview; Place test Road attempts an actual pair. Grant crossing research is an explicitly synthetic fixture control. Reset removes test Roads and permissions. These controls do not measure normal-play progression. Run `node scripts/audit-border-obstructions.mjs` for the 1,100-world static audit.
