# Current stereo grand-piano source

The current pack uses **Salamander Grand Piano V3** by **Alexander Holm**, recorded from a **Yamaha C5**. [Source and instrument description](https://sfzinstruments.github.io/pianos/salamander/) · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) · [retained license](LICENSE.txt).

Attribution: Salamander Grand Piano V3 by Alexander Holm, licensed CC BY 3.0. Modified for NODE: selected velocity-10 notes; four-second excerpts converted from 24-bit FLAC to 16-bit stereo WAV; arranged, repitched and released as interaction cues. Keep this attribution and license link with redistributed derived sounds. The generated `PIANO-CREDITS.txt`, page footer and asset manifest carry the credit.

[source.json](source.json) records the pinned source commit, URLs, original FLAC hashes, prepared WAV hashes, pitches and conversion details. Fourteen recordings spaced in minor thirds cover the current notes; playback shifts any used note by at most roughly one semitone. Preserve the two recorded channels. The rejected first piano pass and its CC0 source remain in the neighboring [upright source directory](../piano/README.md) as historical evidence.

Normal builds need only these WAVs. To restore them, explicitly install the authoring-only decoder with `npm install --prefix .artifact-work/audio-tools --no-audit --no-fund @wasm-audio-decoders/flac@0.2.11`, then run `node scripts/fetch-grand-piano-samples.mjs`. This does not add a game dependency; the fetch step reads only pinned sample data and license text.

The [sampler](../../../../scripts/piano-sampler.mjs) preserves stereo and the recorded attack. Interaction envelopes allow an additional 450 ms release, or 800 ms for milestones. The research pickup damps sooner so its low dominant chord does not obscure the following tonic chord. No oscillator, procedural piano voice, mono collapse or blanket high-pass shapes the new source. File boundaries fade to zero. Card durations include the release; the model's `duration` and manifest's `gestureSeconds` describe the original gesture before its tail.

The plain four-second A3 reference is not repitched or given an interaction envelope. Its last 150 ms fades out to avoid a truncated file boundary. It is exposed first on the fresh `f-major-review.html` page so the source can be judged separately from the effects. Technical validation cannot establish the listener's preference.
