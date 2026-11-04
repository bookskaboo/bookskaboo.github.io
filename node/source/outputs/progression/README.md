# Progression analysis status

November 3 implementation update: `analysis.json` and `review.html` have been regenerated after the settled production batch. The standard-recipe model excludes the new efficient alternatives; fixed-research totals include both optional recipe projects and Industrial Forestry. Dwarven Mythril and paid forestry are now live, but their upkeep, actual transport/waste throughput and human pacing remain outside this analytical model. See [implementation status](../../docs/master-plan/19-implementation-status.md).

Updated November 2, 2026 after the Research Center timing correction.

## Current live analysis

Run `npm run progression` to regenerate `analysis.json` and `review.html` from live catalogs. This analysis shares the runtime's five-second Research Center base, reports synchronized-set counts separately from seconds, and sizes its fully supplied base-speed factory at one set per five seconds. Six lab upgrades reduce that base to 4.5, 4, 3.5, 3, 2.5 and 2 seconds. It does not simulate upgrade purchase order or establish human pacing.

## Older models requiring revalidation

Treat older core-design, waste-demand, benchmark, player-simulation, speedrun and encounter reports as historical experiments until their lab assumptions and upgrade trajectories are checked, rebased and regenerated. Some use one-second or subsecond lab cycles. Their timing, peak-throughput machine counts, waste-flow rates and forced-wait conclusions are not current balance evidence after this correction. Re-running an unchanged model alone does not update its assumptions.

Before further calculations, identify which timing/rank assumptions the model uses and align them with `src/content/researchTiming.ts` and the existing six efficiency ranks. Label any deliberately different sensitivity scenario. Recipe/resource bills may remain useful only after verifying them against the current catalog; proposed Dwarven Mythril supply is still separate from the live deposit-based baseline.

Historical browser runs retain their original elapsed times and resource totals. Do not multiply observed playtime by five: construction, production and research overlap, and research may be input-limited. Existing three-hour and 20–30-hour design targets now require renewed assessment; the timing correction does not establish that either is met.
