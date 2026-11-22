# Soft bowed cello

Four unmodified stereo WAV recordings from **VSCO 2 Community Edition**, Cello Section / susvib, soft layer v1, round robin 1. Library by Versilian Studios / Sam Gossner, **CC0 1.0**. [source.json](source.json) retains pinned original paths, URLs and SHA-256 hashes; [LICENSE.txt](LICENSE.txt) retains the full source license.

Source: [sgossner/VSCO-2-CE](https://github.com/sgossner/VSCO-2-CE), commit `440300901dfe9275fd84e0b7763af1f8443ae62e`.

These are cello-section recordings playing a single melodic line, rather than a solo-cellist recording. Source C1/E1/G1/B1 map to scientific C2/E2/G2/B2. The renderer preserves the original melody's C2–C3 pitches, timing and tempo, and repitches the recordings by at most two semitones. Soft vibrato comes from the recorded instruments. Both source channels are retained with gentle envelopes, mild upper-frequency filtering and circular room reflections.

Fetch once with `node scripts/fetch-cello-samples.mjs`. Render offline with `npm run preview:music:cello`; verify with `node scripts/check-bass-melody.mjs --cello`.
