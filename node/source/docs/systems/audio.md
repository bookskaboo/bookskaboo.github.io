# Audio

[System index](README.md)

The game plays the adopted Revision 7 piano action cues with the quiet F-major cello and double-bass background. Piano phrases begin immediately, use gently spaced later notes and soft cadences, and retain C2–C4. Music is the exact sixty-second expressive string loop; it contains no piano.

## Options and saved levels

The existing **Options** modal has separate compact **Music** and **Sound effects** cards side by side. Each matches the other 48 px option cards, with a short slider between its title and Mute; there is no visible Audio heading or Credits link. Each has a 0–100% slider, a visible percentage and its own Mute button. Muting retains the slider setting, and a zero slider silences that channel. Both sliders default to **50%**, with both channels unmuted.

| Slider | Gain at 0% | Gain at default 50% | Gain at 100% |
| --- | --- | --- | --- |
| Music | 0 | 0.15, matching the audition | 0.30 |
| Sound effects | 0 | 0.30, matching the audition | 0.60 |

Levels are linear gain controls, with short gain ramps to avoid abrupt adjustment clicks. Each slider therefore offers twice the adopted playback gain at its maximum. The author listening pages keep their literal 15% music / 30% effects controls; their scale differs from the game settings.

`effectsVolume`, `musicVolume`, `effectsMuted` and `musicMuted` are additive factory preferences. They survive manual saves, autosaves, exported/imported files and loading. Missing or invalid levels default to 50; finite levels clamp to 0–100 and only literal `true` mutes. Undo retains the current audio preferences instead of rewinding them with a node edit. The earlier serialized `sound` field remains readable as a retired placeholder and does not override either channel. Practice uses the campaign's audio settings and permits changing these controls while other practice options remain protected.

## Playback lifecycle

The browser audio context is created and resumed on a pointer or ordinary keyboard gesture. WAV files load after that gesture; there is no autoplay, queued catch-up or playback of actions missed while assets load. A load/device failure cannot stop the factory, and later gestures retry loading.

Music has its own looping Web Audio buffer and gain, outside the effects voice pool. It loops exactly 0–60 seconds without seeking or restarting a media element each minute. Muting, slider changes, game pause, panel changes, engine replacement and entering/leaving practice do not restart its clock. Hiding the tab stops current effects and suspends the shared audio clock; returning resumes the same music position. Unmounting disposes the context.

## Committed action feedback

The engine's lightweight feedback subscription emits after successful commands, independently of the ordinary render subscription. It does not scan the full factory on simulation ticks. Drag previews and failed/no-op commands remain silent; a committed changed drop emits one movement cue. Batched layout placement and node deletion each emit one cue. Paired Road changes retain their original behavior.

| Trigger | Cue |
| --- | --- |
| Node placement, paste/duplicate or template placement | Place node |
| Changed committed move, successful Undo | Finish moving |
| Cable commit/removal, node deletion | Connect / Disconnect / Remove nodes |
| Recipe, Filter, mining/tribute, rotation, connector, processing or Road configuration changes; groups | Apply configuration |
| Accepted research selection/queue or destination research | Queue project |
| Game or research pause/resume | Pause / Resume |
| New ordinary research/discovery, character upgrade, victory | Corresponding completion cue |
| New reserve-depletion or autosave-failure notice | Attention |
| Newly activated map, changed travel destination | Activate Map Node / Travel |
| Successful explicit manual save/copy | Manual save complete |
| Visible placement, connection, Road or inspector interaction failure | Action unavailable |
| Node selection or opening a normal panel | Quiet selection / Open panel |

Selection/panel feedback is suppressed immediately after a committed action, avoiding a second cue for automatic selection. Closing panels, hovering, panning, zooming, routine production/transport and successful autosaves are silent. Loading/new state resets effects history without replaying stored completions; constructor and Undo milestone evaluation do not sound historical events.

At most four effect voices play. Victory takes priority over character upgrades, new warnings, ordinary completions and direct actions. A new milestone replaces lower-priority effects; lower-priority cues wait for a future action rather than being queued. Ordinary completion cues coalesce for 400 ms, rejection for 500 ms and attention for three seconds. Music is never part of this limit. Feedback never delays an action to align it with a musical beat.

## Assets and implementation

The nineteen adopted piano WAVs and exact music WAV live under [audio assets](../../src/audio/assets/manifest.json). The [credits](../../src/audio/assets/CREDITS.txt) identify Salamander Grand Piano V3 / Alexander Holm, CC BY 3.0, and VSCO 2 Community Edition / Versilian Studios / Sam Gossner, CC0, with modifications and source links. The release also includes the same attribution in [AUDIO-CREDITS.txt](../../public/AUDIO-CREDITS.txt). Vite emits separately cached files with base-aware URLs; audio data is not embedded in the main JavaScript bundle.

`npm run audio:sync` explicitly adopts the current generated author assets after checking their recorded hashes. Author-preview rebuilds alone do not change the adopted game pack. [Asset checks](../../src/audio/assets.test.mjs) verify the shipped PCM and manifest hashes. [Mixer checks](../../src/audio/GameAudio.test.ts), [feedback checks](../../src/simulation/playerFeedback.test.ts), [saved preference checks](../../src/domain/audioPreferences.test.ts) and [Options presentation checks](../../src/ui/panels/OptionsPanel.test.tsx) cover the integration.

Entry points: [mixer](../../src/audio/GameAudio.ts), [active-engine binding](../../src/ui/useGameAudio.ts), [engine feedback](../../src/simulation/engine.ts), [settings](../../src/ui/panels/OptionsPanel.tsx), [preference normalization](../../src/domain/audioPreferences.ts), [state lifecycle](../../src/simulation/stateLifecycle.ts), [save normalization](../../src/persistence/legacyMigration.ts). Local browser/test evidence lives in [audio integration](../../outputs/audio-integration/verification.json); subjective long-session mix acceptance and publication are separate from these checks.
