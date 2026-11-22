# Recorded piano source

**Historical first pass:** the listener rejected this short, mono upright-piano treatment. Current effects use [stereo grand-piano recordings](../grand-piano/README.md) and longer natural release tails. The source recordings and earlier description below are retained as evidence, not the current palette.

The current action palette uses real **Upright Nr. 1** recordings from [VSCO 2 Community Edition](https://versilian-studios.com/vsco-community/), by Versilian Studios. The library credits Sam Gossner and Simon Dalzell for recording and Elan Hickler / Soundemote for sample cutting. It is distributed under [CC0-1.0](LICENSE.txt).

[source.json](source.json) records the pinned repository commit, exact upstream filenames/URLs, nominal note roots, byte sizes and SHA-256 hashes. Local `c2.wav` through `c6.wav` are the unmodified downloaded C-note recordings at the medium dynamic layer. Ordinary builds verify those hashes and need no network access. Re-fetch explicitly with `node scripts/fetch-piano-samples.mjs` when restoring missing source assets.

[The sampler](../../../../scripts/piano-sampler.mjs) decodes the source PCM, averages stereo channels, identifies the onset, chooses the nearest recorded C note and linearly resamples it to the arranged pitch. The builder retains the recorded hammer attack and natural decay, scales level and damps note-off to fit a short interaction cue. Final files receive a 20 Hz high-pass and exact edge fades before conversion to mono 44.1 kHz / 16-bit WAV. The current pack uses no procedural instrument oscillators, noise rustles or other instrument recordings.

The [audio plan](../../../../docs/master-plan/06-art-audio-and-writing.md#audio) owns the current all-piano direction. The earlier mixed palette and paper-settling placement are superseded; the low research ta-da, single rejection strike and selection-pitch comparison remain recognizable in the piano arrangements.
