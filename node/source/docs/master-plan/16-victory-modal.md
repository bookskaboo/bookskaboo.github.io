# Victory modal: presentation and finished draft copy

## Adopted brief (Q112, November 3, 2026)

The player selected a one-time Research Center project costing **one Final Core and nothing else**. Project completion records victory and opens a fancy, glowing modal. It thanks the player in the developer's voice, invites modding, and includes original affectionate homages to Factorio and Satisfactory. Continue returns to the same world for further production and optimization research.

This is the authored design and copy for that request, with a [local interactive preview](../../outputs/planning/victory-modal-preview.html). The ending and modal are not yet integrated into runtime; the corner systems and Final Core are still planned content.

## Review status

The user deferred reviewing the modal copy and visual preview until later. Keep the authored draft and adopted victory behavior; this deferral is not approval of the rendered presentation. Continue the design interview with post-victory research (Q113).

## Player-facing copy

Eyebrow: **FINAL CORE ACCEPTED**

Title: **Victory. Somehow.**

Subtitle: All four corners. One Final Core. A remarkably indirect way to finish a to-do list.

I've now asked you to do everything I wanted this game to offer: tame the corners, connect the world, and persuade a very large factory to cooperate. I hope you had fun along the way. Thank you for playing.

If you didn't, you're welcome to mod NODE until it's actually fun. I've done the difficult part: leaving room for improvement.

Still need more? Perhaps visit a planet. Or two. Launch a few rockets. I'm told this is how small factory projects remain small.

Alternatively, sign up with a very large company, travel to a perfectly good planet, and extract its resources. There will probably be a form confirming how satisfied you are.

Continuation note: Your factory and progress are preserved. Keep building, keep improving, or just watch it work.

Primary button: **Continue playing**

Button subtext: Optimization is now a personal problem.

## Visual treatment

- Use the existing charcoal, steel and warm research-gold palette. The modal has a restrained luminous gold edge, a broad soft halo and a brighter faceted Final Core emblem. Four surrounding points visually converge on the completed Core.
- Let the emblem and surrounding light breathe slowly. Avoid flashes and rapid particles; reduced-motion mode keeps the gold glow and removes movement.
- Put the title, clear victory state and thanks before the jokes. Keep all four requested passages in the main reading flow; the homages are original prose rather than borrowed dialogue or logos.
- Use a bounded, scrollable reading area on small screens, with the Continue button always reachable. Text remains legible without relying on glow or color alone.
- The modding invitation is copy, not a promise of a mod loader, SDK or working external link. A real modding action needs an actual supported destination before it is added.

## Behavior and persistence

Show once when the selected victory project completes, after the consumed Core and completed research/victory state are committed together. Production alone, delivery alone and later optimization research do not reopen it. Save both completion and whether the notice has been acknowledged, so a pending unacknowledged victory can appear after loading without replaying an already dismissed celebration.

Use a labelled modal dialog, move focus inside it, contain keyboard focus, and restore focus when it closes. Continue playing and Escape dismiss the notice and return to the same factory, camera, stock and research progress. Preserve the player's pause setting; Continue is not a new-game or reset action. Do not make the decorative entrance an unskippable wait. The exact simulation policy while a modal is open follows the game's modal policy during integration.

Global Storage/Inventory research still becomes available upon first Final Core production, independently of this victory project. No extra victory gate is added to that availability. Further Final Cores remain reproducible and usable for later optimization research.

## Preview and integration verification

The standalone preview is designed to demonstrate the dialog, glow, responsive reading region, reduced-motion styling and Continue/Escape dismissal. Its background is an illustrative factory, not an exported player save. It does not consume Cores, award research or modify the game.

Source checks cover matching copy, JavaScript syntax and the presence of modal/reduced-motion/scrolling controls. Local browser rendering/interaction verification was blocked: headless inspection was unavailable and the browser security policy disallowed file-URL navigation. No rendered-layout or interaction pass is claimed.

Before runtime completion, verify atomic payment/victory state, once-only notice and save/load acknowledgement, continued same-world play, focus handling, keyboard dismissal, small viewport scrolling, readable contrast, reduced motion and ordinary research timing. A visual preview alone does not validate those game systems.
