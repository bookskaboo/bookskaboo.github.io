# Soft bowed double bass

Eight unmodified WAV recordings from **VSCO 2 Community Edition**, Solo Contrabass / SusNV, soft layer v1, round robin 1. Library by Versilian Studios / Sam Gossner, released under **CC0 1.0**. The full source license is retained in [LICENSE.txt](LICENSE.txt); [source.json](source.json) pins the repository commit, original paths, download URLs and SHA-256 hashes.

Source: [sgossner/VSCO-2-CE](https://github.com/sgossner/VSCO-2-CE), commit `440300901dfe9275fd84e0b7763af1f8443ae62e`.

The source uses octave names one lower than scientific pitch notation: its C1 recording sounds C2 (MIDI 36). Fundamental/harmonic measurements of the retained recordings confirm that mapping. The melody renderer assigns scientific MIDI roots explicitly and repitches at most one semitone. It preserves both recorded channels, balances the soft recordings by sustained RMS, shapes gentle bow envelopes, lightly reduces upper-frequency noise and adds low-level circular room reflections. No oscillator is used as the instrument voice.

`node scripts/fetch-double-bass-samples.mjs` is an optional one-time authoring download. `node scripts/build-bass-melody.mjs` consumes the retained recordings offline.
