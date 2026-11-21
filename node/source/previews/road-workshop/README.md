# Road workshop

Open [the local test window](http://127.0.0.1:4196/previews/road-workshop/) while the development server is running. The page is also available at `/previews/road-workshop/` on another local server port.

This isolated review fixture starts with nine unlocked, visited Map Nodes around Home and twelve ordinary reciprocal Road pairs. It uses the real engine, generated terrain and Pixi field. Empty fields, completed Road research and clear borders are synthetic review setup, not a balance run. Autosave is disabled; no campaign save is loaded or written. Reset workshop or reloading discards changes.

The adopted main-game controls remove the Road gear, reverse the pair's flow with a stationary right-click on either body, and place a red directional arrow in the unplayable area beyond each Road’s field boundary, with Travel above it. All four directions use the same 32 × 32 CSS pixel arrow footprint. The red arrow points toward the neighboring map independently of shipment direction. It stays at a readable screen size when zooming and uses the same destination validation and callback as Road double-click travel. Both routes retain zoom and focus and highlight the paired Road in the destination play area, even when that map already has a different saved view. Reversal uses the existing engine action, including its normal cable disconnection and pair validation.

Fit field reserves a gutter outside all four boundaries so every Travel action stays visible. The workshop and main game allow a wider overview around exterior controls and retain zoom through travel.

Use the nine-map grid to move directly between test maps, Fit field to see all local Roads, and a Local Roads row to focus its endpoint at 75% zoom. Drag paired Roads, add another channel with Place Road, toggle the grid, reverse flow or travel back from the paired endpoint. Workshop selection does not open the main game’s Road information panel.

The main game now uses these controls without a renderer preview flag. The workshop remains a temporary nine-map fixture for further review; campaign single-click still opens the Road information panel. Travel arrows and double-click share the validated paired-endpoint navigation helper.

Sources: [fixture](fixture.ts), [review window](main.tsx), [Travel control](../../src/renderer/roadTravelControl.ts), [field integration](../../src/renderer/PixiPlayfield.tsx). Validation: [network fixture check](fixture.test.ts), existing Road flow/navigation and sector travel checks, preview TypeScript, production build and browser review. Browser evidence is stored in `outputs/road-workshop/`.
