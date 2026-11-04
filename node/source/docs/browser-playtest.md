# Browser playtest startup and recovery

## Published playtest target

The current published game is **https://bookskaboo.github.io/node/**, confirmed by the user on November 2, 2026. Use this URL when the user requests the GitHub/published version. Do not infer the deployment from an older checkout's Git remote or its README: `ForzenAcademy/nodes` links to an older, different FACTORINODE build at `forzenacademy.com/node/`.

Keep published-version runs separate from localhost runs and record the actual URL in the run log. Use only the normal player UI when requested; do not inspect source, use developer tools or exported reports, alter rules, or apply mid-run fixes. Preserve existing factories during browser recovery.

Verified November 1, 2026, against the local game at `http://127.0.0.1:4174/`.

## Verified recovery

Selecting an existing tab by URL with `cua.getTab({ url }, { browser: 'iab' })` returned `browser.user is unavailable`. This did not establish that the entire browser connection was unavailable. After resetting the CUA JavaScript session, inventory discovery, selection of the returned in-app browser ID and creation of a fresh tab worked. The game rendered and its Pause control successfully changed to Resume.

The precise internal cause of the failed URL lookup is unconfirmed. Use the verified discovery path instead of repeatedly attempting that lookup or switching to native Firefox automation. Firefox was explicitly stopped because Windows browser URL-policy enforcement was unsupported.

On the next continuation, a retained tab binding also returned `browser.user is unavailable`. Resetting once, calling `cua.getState()`, selecting the returned browser ID and rebinding the existing tab with `cua.getTab(returnedTabId, { browser: browser.browserId })` recovered the same paused game. This ID-based recovery is now verified; creating a new tab or resetting the game was unnecessary. The preserved browser tab and the JavaScript binding are distinct: a tab can survive while its old binding fails.

## Startup procedure

1. Check that the local server is available at the intended URL. Use the same host and port throughout the run.
2. Initialize the browser controller with `await cua.getState()`, then inspect its returned browser and tab inventory. Read the returned documentation before further actions.
3. Select the in-app browser using its actual returned ID with `cua.getBrowser({ id })`. Do not hard-code the numeric ID from an earlier session.
4. Reuse a live game-tab binding when available. When recovering a missing tab, use a returned tab ID and the selected browser ID. An empty tab list is not a broken browser connection; create a fresh tab on the selected browser when necessary. The verified creation call was `cua.createBrowserTab(browser.browserId, url, { visible: true })`.
5. Verify that the visible game page renders and a normal UI control responds before announcing that a playtest has started. Pause during preparation. Preserve existing saves and do not generate a new map merely to diagnose browser access.
6. Reuse the selected browser and tab bindings for the run. Mark the tab for handoff before ending any turn that must preserve it; these marks are turn-scoped. Use a deliverable mark for a finished result the user should retain.
7. If browser access fails, record the exact failing operation and follow the current controller documentation. When only a tab is stale, obtain a fresh binding from the already selected browser; do not reselect or switch browsers to recover a tab. If the CUA JavaScript session itself needs resetting, reset once and use the startup discovery procedure in the new session. Follow any explicit security stop; do not bypass it through native desktop input, another automation protocol or another browser.

## Continuing a gameplay checkpoint

Read the latest run log and exported report before acting. Verify the visible map and controls, then resume the preserved game through its normal UI. Recheck coordinates after travel, zoom changes and road placement; the camera view can change. A completed cable drag is not proof of a working supply chain: verify the recipient buffer, production or research completion. The visible Dev controls → Export playtest report is useful for recording actual totals and diagnosing missing links.

Keep gameplay rules intact during balance measurements. Record ordinary interface bugs for later, and record any authorized progression-blocker fix explicitly. Save a report and pause at a discussion checkpoint so planning time does not silently continue accumulating production. Report partial milestones as partial milestones; a working Shiny chain is not a completed Complex or endgame test.

## Permission observation

The inspected browser configuration listed `http://localhost:5173` under allowed origins and `http://127.0.0.1:4174` only under allowed downloads. Those are different permission categories and different origins. However, the verified in-app recovery worked without changing either permission, so this mismatch is not established as the cause of the failed lookup. Do not widen permissions to fix this particular error. If a later operation explicitly requests site permission, use the normal site-specific approval flow.

## Verification record

- Browser inventory returned an in-app browser for this chat; its tab list was empty.
- Selection by the returned browser ID succeeded.
- A new game tab rendered at the intended URL.
- Clicking Pause changed the visible control to Resume.
- The tab was marked for handoff and left paused; no game rules, resources or research were changed.
- Screenshot: [verified paused game](../outputs/browser-connection-verified.png).

This is a verified recovery procedure, not a guarantee against future browser-tool failures. Balance tests and browser connection checks are separate from a completed gameplay playtest.
