# Reviewing and maintaining the change history

Open [the searchable history](index.html) for topic, text, state, publication, and date filters. It is a self-contained file: it works offline without installing anything or loading the game. It can also be opened at `http://127.0.0.1:4174/docs/changelog/index.html` while the local development server is running.

Start with the [changelog index](../../CHANGELOG.md) for local changes awaiting publication, monthly history, and release links. The [source register](sources.md) records the initial backfill's coverage and gaps. Existing detailed design documents remain authoritative for current formulas and open balancing discussions; this history records when and why those documents or behaviors changed.

## Reading a record

- **ID:** a permanent reference such as `NODE-0105`. IDs do not imply chronological order, because older work can be added later.
- **Date:** local calendar date in America/Los_Angeles. “Known by” means confirmed by that date, not the exact implementation day. “Backfilled” means the original date could not be established.
- **State:** implemented, superseded, historical original-game behavior, recorded decision/review, planned, or deliberately deferred.
- **Publication:** published by a confirmed snapshot, local work awaiting publication, unconfirmed historical delivery, or not applicable to decisions/reviews.
- **Supersedes / replaced by:** follow these to understand reversals. For example, the hold key moved from Z to A, and recipe availability moved from material access to research unlocks.
- **Evidence:** supporting chats, files, publications, and recorded verification. Historical test reports are not fresh test runs.

The search includes titles, details, topics, files, sources, verification notes, and IDs. Multiple words must all match. Searching the former spelling of Mythril also finds the canonical spelling. Complex Core is the current name of the tier-six Core; searches for its former name also resolve to current terminology. Historical dates, outcomes and serialized IDs are retained. Date filters use the record's displayed date, including known-by/backfill dates.

## Updating after completed work

1. Edit **[entries.json](entries.json)**, the single source of truth. Obtain the next unused ID with `npm run changelog -- --next-id`. Never renumber existing IDs.
2. Add a concise player-visible outcome or meaningful internal change. Batch closely related fixes; avoid one entry per changed file. Include the request/reason when useful.
3. Use today's local date for newly completed work. For backfills, use the supported date and the correct `dateBasis`; do not guess. New topics should reuse existing names where possible.
4. Keep implementations separate from proposals, reviews, and deferrals. Record actual verification and its limits. Cite relevant source files or a source chat; add a source-register record if needed. Chat IDs can be found through the app's chat tools; missing IDs need not block a new record when repository evidence is sufficient.
5. Mark a replaced record `superseded` and add its ID to the replacing record's `supersedes` array. Preserve the old record. Its publication information describes historical delivery, not current behavior.
6. New code starts with `delivery: "local"`. Only after a confirmed game publication should relevant records receive `delivery: "published"` and `publishedBy`, with a new release record containing the actual commit and date. A local commit alone is not a publication.
7. Run `npm run changelog`, then `npm run changelog:check`. Review the generated index and entries. Commit the records and generated documents alongside the game change when committing is requested.

Generated files are `../../CHANGELOG.md`, `index.html`, `sources.md`, and the monthly Markdown files. Edit `viewer.template.html` for presentation changes. The generator never edits gameplay, user saves, or deployment files.

## Record example

```json
{
  "id": "NODE-0109",
  "date": "2026-11-02",
  "dateBasis": "chat",
  "kind": "fixed",
  "state": "implemented",
  "delivery": "local",
  "title": "Short description of the resulting behavior",
  "summary": "What changed and why the player benefits.",
  "topics": ["Connections", "Logistics"],
  "sources": ["local-code"],
  "evidence": ["src/simulation/connectionRules.ts"],
  "validation": "State only the checks actually completed."
}
```

`dateBasis: "chat"` means a dated request/completion context establishes the date; use `known-by` or `backfill` for uncertain retrospective timing. Optional fields are `details`, `evidence`, `validation`, `supersedes`, and `publishedBy`. Allowed values and validation are defined in [the generator](../../scripts/changelog.mjs).

## Searching from a chat or terminal

```powershell
npm run changelog -- --search "grid snap"
npm run changelog -- --search "connector mirroring"
rg -n -i "research|splitter|mythril" docs/changelog/entries.json
```

Ask for an ID, topic, or behavior in a future chat. The project instructions require keeping this record current; those instructions apply when an agent works in this project, rather than acting as an unattended background monitor.
