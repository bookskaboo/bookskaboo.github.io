# Art audio and writing direction

## Established identity

**Implemented:** charcoal, steel and gold UI colors; vector node silhouettes and icons; material-colored cables; star/circle port affordances; production animation and resource bars. The visual system carries functional information, so art changes must preserve recognition at normal play zoom.

**Agreed:** Mythril is the canonical spelling. Extractors are Production nodes. Dry, understated humor belongs in introductions, help, tutorials and modal subtext. Commands, counts and goals stay clear. Preserve serialized IDs even when display text changes.

Q40–Q41 adopt Circuit B as the former Electrode at Hydro and Circuit C as the former Logic Wafer at Complex. Keep Controller distinct. Retain serialized item/recipe IDs, ingredients, cycles and unlocks while updating current names/icons, recipes, research and tooltips consistently during implementation. No runtime naming or art change is made by this design record.

## Proposed art production guide

| Asset family | Standard to define | Review example |
| --- | --- | --- |
| Machines | Silhouette, dimensions, ports, controls and state readability | Same machine idle, running, input-starved and output-full |
| Items and recipes | Recognizable icons with consistent material language | Similar metals and late intermediates side by side |
| World features | Obstacle footprint, encounter identity and interactable boundaries | Lake shoreline versus collision boundary |
| Interface | Typography, spacing, contrast, tooltips and modal hierarchy | Dense Research and recipe views at minimum viewport |
| Effects | Cable motion, production cycles, rejection and warnings | Paused game and reduced-motion alternative |

Use existing vectors and code-native drawing as the baseline. Create an asset inventory before commissioning replacements; record source, license, editable original and export settings for each external asset.

## Audio

No dedicated audio system was identified in the initial source review. **Agreed stabilization scope (Q18, November 2, 2026):** include interaction sounds, useful alerts, ambience and music. This adopts the broader soundscape rather than limiting work to feedback effects. Mute/volume controls and visual equivalents for essential information are part of the intended audio experience.

**Design work remaining:** choose the musical/ambient direction, event-to-sound mapping, asset list and sourcing/licensing, mix levels, repetition limits, transitions and playback behavior. Define how audio responds to pause and tab focus, and verify browser playback behavior and saved preferences. Keep important alerts understandable visually. No audio assets or playback system are created by this scope decision; estimate and schedule the work within stabilization before commissioning assets.

## Fiction and completion

The world mixes industrial automation with Goblins, Dwarven settlements and mineral Golems. Q14 renames the former Lizard settlements as Dwarven and gives their Tribute the regular Mythril-supply role, with the retained Mythril Golem exception in Q14B1; preserve old serialized IDs. Flavor gives the machines character. Q06 defines the final achievement's structure: four corner components feed a final Core, enabling a victory project and continued optimization play. **Open:** the player's role, the reason for building, the meaning of research, and the identity and fiction of the corner obstructions and victory project. A campaign, characters and extensive lore are not yet established requirements.

**Agreed fiction scope (Q19, November 2, 2026):** light framing through a brief introduction, context for progression milestones and an ending. Connect factory development, Dwarven settlements and the four corner challenges into a coherent arc without committing to a full campaign. Keep the established dry, understated humor and clear goals.

The player's role, motivation, milestone text, corner identities and victory-project fiction still need writing. Draft the introduction and implemented milestone framing for stabilization; develop the ending alongside the tier-7 design before implementing it. This decision establishes scope, not completed narrative copy or new story mechanics.

Evidence: [flavor library](../../src/content/flavor.ts), [theme](../../src/styles/theme.css), [node drawing](../../src/renderer/playfieldDrawing.ts), [icons](../../src/renderer/drawNodeIcon.ts).


The Q98 expansion-rescue feature uses escalating congratulatory dry humor for distinct resource rescues. [Three modal drafts and the Destructive Testing achievement](14-expansion-solvability-and-golem-rescue.md) preserve clear resource/destination instructions and thank the player for testing the emergency path. These are draft copy, not shipped UI; the text must describe opened access accurately with Q98B automatic target clearance.


## Ending copy and glow treatment (Q112, November 3, 2026)

[Victory modal design](16-victory-modal.md) now supplies finished draft ending copy in the developer’s voice: completing the intended journey, hoping the player enjoyed it, inviting them to mod NODE into something actually fun, then affectionate original homages about planets/rockets and corporate resource extraction. Title: “Victory. Somehow.” Match NODE’s charcoal/steel/warm-gold UI, with a faceted luminous Core and slow soft halo, static in reduced-motion mode. Continue playing stays plain and readable. This is authored design/preview work, not shipped ending UI or a new audio asset.
