# Recipes

[System index](README.md) · [Exact recipe catalog](catalogs/recipes.md)

A recipe defines inputs, guaranteed outputs, optional chance outputs, a base cycle and any research gate. Recipe groups determine which machines can run it. The visible recipe guide and machine pickers use these definitions.

## Availability and configuration

[Normal Doubler landmarks](landmarks.md) accept every unlocked recipe in their fixed Refiner, Assembler or Fabricator family except Core, Yin and Yang production. Their ordinary ingredients, time and speed upgrades produce twice every resolved output, including waste; each chance roll occurs once and failures stay zero. Oversized completed batches drain in saved order through the unchanged ordinary output capacity before another batch starts. Unknown Device instead duplicates an existing Core in a fixed five seconds, with no manufacturing recipe entry or original ingredient bill.

A recipe must be live, research-unlocked, assigned to an available machine and allowed in the current world. Ingredient ownership is not an availability requirement. Simple Core has no recipe research gate: an accessible Refiner can select it immediately, including before producing or owning any Cores. Its serialized simple-core recipe/item IDs and recipe bill remain unchanged. Retired recipe definitions remain loadable for already-paid batches without returning to the live picker.

Smelters, Refiners, Assemblers and advanced processors use explicit selection. The base Kiln has a fixed recipe. Bot Plants choose from supplied frame and gun pairs. Recyclers infer their recipe from incoming material. Yin and Yang definitions include three possible world pairings; only the current world's pairing is usable.

Recipe changes can alter socket identities and legal connections. Copying a recipe between machines requires the same node type and follows the same availability checks as ordinary selection. Committed batches cannot be replaced by selecting a new recipe.

## Work and output

The intentional Doubler Brick/recycling loop turns one Stone into two Bricks and recovers two Stone. Material recovery loops are permitted. Ordinary Brick and Recycler recipes keep their catalog bills.

Simple recipe processing and advanced committed batches have separate runtime paths. Advanced processing checks complete ingredients and room for the maximum possible output before taking inputs. It records the paid batch and its resolved chance results, then emits that batch on completion. Saved committed batches retain what was already paid.

Mixed product and waste outputs share the production stream. The output queue preserves dispatch order, so a waste blockage can halt further production. A recipe with no outputs is disposal. Recovery and composite alternatives must be compared by actual ingredients, yield, processing work and destination capacity.

The catalog's seconds are base processing times. Machine efficiency changes the cycle multiplier; it does not rewrite the ingredient bill. Starvation, full output, construction and logistics add delays. Chance percentages are per batch and must not be treated as a guarantee of a rare item.

## Maintaining recipes

Edit [base recipes and grouping](../../src/content/recipes.ts), [later production](../../src/content/progression.ts), [endgame](../../src/content/endgame.ts), [bot assembly](../../src/content/botAssembly.ts) or [recycling](../../src/content/recycling.ts), according to ownership. Maintain these modules directly with reviewed definition and runtime tests. The historical `node scripts/sync-progression-content.mjs` command is retired: it reports the supported maintenance path and exits with status 1 without reading inputs or writing source, including when given extra arguments or imported. Its [original compiler, helper and inputs](../../scripts/archive/progression-proposal/README.md) are preserved as checksummed evidence; they contain retired rules and must not be restored over current gameplay. Run `npm run docs:systems` only to refresh documentation catalogs after content edits.

[Availability](../../src/content/recipeAvailability.ts), [selection](../../src/simulation/engine.ts), [batch processing](../../src/simulation/progression.ts) and [mixed output](../../src/simulation/mixedOutput.ts) implement the rules. [Catalog integrity](../../src/content/catalogIntegrity.test.ts) and [availability tests](../../src/content/recipeAvailability.test.ts) cover definition consistency and selection. Regenerate the [catalog](catalogs/recipes.md) after changes.

Related systems: [production](production-nodes.md), [resource use](resource-use.md), [routing](connections-and-routing.md), [waste](waste-and-recycling.md).
