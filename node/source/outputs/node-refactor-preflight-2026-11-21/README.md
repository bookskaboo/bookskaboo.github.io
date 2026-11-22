# Frozen NODE release preflight

Supporting evidence for NODE-0834. **Preflight passed; not published.** Started November 21 and completed November 22, 2026 (America/Los_Angeles). This is a release validation artifact, not a new chronological history.

## Candidate identity and scope

Fresh checkout: bookskaboo/bookskaboo.github.io, main at aecc45ec1540249594946fb53bbde714061874f6. Frozen current source, tooling, authored previews and documentation are in repo/node/source; matching /node/ runtime is in repo/node. The initial [source manifest](source-manifest.json) captures 815 inputs. Runtime/test/tooling inputs stay frozen; final preflight documentation/history metadata is added separately. Later unrelated workspace audio-preview and documentation edits are preserved outside the frozen candidate.

[Build manifest](build-manifest.json): eleven files, 1,701,245 bytes, built using npm run build:site. Existing hashed assets are retained for previously open pages. Checkout CRLF versus build LF differences are checked explicitly; each candidate runtime byte matches its dist copy. [Local HTTP verification](local-http-verification.json) checks every served HTML/asset SHA-256 at http://127.0.0.1:4208/node/. This is local verification, not live-site verification.

## Checks completed

- Fresh workspace suite: **2,415 passed, one existing skip**, including 796 preserved release tests.
- Frozen source suite: **1,619 passed**, 156 files, no failures/skips. Production TypeScript/Vite /node/ build passed; existing large-chunk advisory remains.
- Six catalogs regenerated/checked fresh, forty documentation files checked for local links, history generation and six history checks passed. Source packaging preserves two historical deployment-checkout directory links with an explicit README pointer to the preserved receipt/manifest, without a nested Git checkout.
- Normal App, exact packaged build, 1280×720, separate localhost origin. Fresh start/pause and save in slot 1; archived factory imported normally and saved in slot 2. Original archived file unchanged. Archived input has 77 maps, 2,037 nodes and 58 Road endpoints, seed 680312004, 24,640,800 ms elapsed. Its provenance is the older headless playtest, not an ordinary-play claim.
- Imported factory retains physical stock, IDs, wiring, recipes, committed work and positions. Existing legacy gun normalization removes a zero-valued retired input entry; zero counts are ignored only for initial material-bag comparison. Supported load-time progression/research reconciliation remains expected. Paused save→reload→load comparison is exact for all maps and research, plus saved stocks/counters/transfers/templates and world/Landmark/terrain markers.
- Resumed ordinary simulation to 24,650,439.200000048 ms, then paused. Placed two isolated Joints through Build, connected them, and verified keyboard Undo removed exactly that connection while retaining their nodes. No grants, injected save state, accelerated simulation or game-rule changes.
- Core recipe return preserves the Kiln search and exact opener focus; Tab reaches controls. Import confirmation owns background B/Delete/Undo. Map travel reaches E1 and W5; exterior Road arrow travels W5→N1.W5.
- Saved the post-test factory in slot 3. All three names/saves survive browser reload; slot 3 restores seed, elapsed time, current map, all map contents and research exactly. Read-only Dev → Export playtest report exposes JSON; that exported wrapper imports successfully through normal Import Save. Recovery-only Export Save download is covered by the automatic suite and was not forced through a browser storage failure.
- One canvas after reload, no observed console errors, no HTTP failures. [Final screenshot](browser-final.jpg). Large report text was read from the visible textarea in chunks after it exceeded the browser automation snapshot limit; no hidden application state was accessed.

[Runtime validation report](preflight-report.json) retains assertions and initial package counts. Its scope counts precede final documentation/history metadata. Source reports and logs outside this document remain dated evidence, not universal guarantees.

## Publication boundary

Only node/ may change in the prepared Git package. Remote main was re-read after the browser checks and still equals the candidate base. A later publication must recheck this condition, create/submit the exact commit through the configured approval flow, then verify normal live HTML and all new asset hashes before recording any publication. No push or Pages deployment occurred here. The original campaign files and real published-origin saves were not touched.

Current campaign balance, multi-seed sustained feasibility, distributed-world supported scale and the complete desktop accessibility audit remain open under the existing review register. These checks do not close them. Local performance evidence remains the bounded refactor comparison, not a new supported-world certification.
