# Recipes

[System index](README.md) · [Exact recipe catalog](catalogs/recipes.md)

A recipe defines inputs, guaranteed outputs, optional chance outputs, a base cycle and any research gate. Recipe groups determine which machines can run it. The visible recipe guide and machine pickers use these definitions.

## Availability and configuration

A recipe must be live, research-unlocked, assigned to an available machine and allowed in the current world. Ingredient ownership is not an availability requirement. Simple Core has no recipe research gate: an accessible Refiner can select it immediately, including before producing or owning any Cores. Its serialized simple-core recipe/item IDs and recipe bill remain unchanged. Retired recipe definitions remain loadable for already-paid batches without returning to the live picker.

Smelters, Refiners, Assemblers and advanced processors use explicit selection. The base Kiln has a fixed recipe. Bot Plants choose from supplied frame and gun pairs. Recyclers infer their recipe from incoming material. Yin and Yang definitions include three possible world pairings; only the current world's pairing is usable.

Recipe changes can alter socket identities and legal connections. Copying a recipe between machines requires the same node type and follows the same availability checks as ordinary selection. Committed batches cannot be replaced by selecting a new recipe.

## Work and output

Simple recipe processing and advanced committed batches have separate runtime paths. Advanced processing checks complete ingredients and room for the maximum possible output before taking inputs. It records the paid batch and its resolved chance results, then emits that batch on completion. Saved committed batches retain what was already paid.

Mixed product and waste outputs share the production stream. The output queue preserves dispatch order, so a waste blockage can halt further production. A recipe with no outputs is disposal. Recovery and composite alternatives must be compared by actual ingredients, yield, processing work and destination capacity.

The catalog's seconds are base processing times. Machine efficiency changes the cycle multiplier; it does not rewrite the ingredient bill. Starvation, full output, construction and logistics add delays. Chance percentages are per batch and must not be treated as a guarantee of a rare item.

## Maintaining recipes

Edit [base recipes and grouping](../../src/content/recipes.ts), [later production](../../src/content/progression.ts), [endgame](../../src/content/endgame.ts), [bot assembly](../../src/content/botAssembly.ts) or [recycling](../../src/content/recycling.ts), according to ownership. The generated-file comment in `progression.ts` identifies its originating workflow; inspect the sync script before regenerating it so reviewed local changes are retained.

[Availability](../../src/content/recipeAvailability.ts), [selection](../../src/simulation/engine.ts), [batch processing](../../src/simulation/progression.ts) and [mixed output](../../src/simulation/mixedOutput.ts) implement the rules. [Catalog integrity](../../src/content/catalogIntegrity.test.ts) and [availability tests](../../src/content/recipeAvailability.test.ts) cover definition consistency and selection. Regenerate the [catalog](catalogs/recipes.md) after changes.

Related systems: [production](production-nodes.md), [resource use](resource-use.md), [routing](connections-and-routing.md), [waste](waste-and-recycling.md).
