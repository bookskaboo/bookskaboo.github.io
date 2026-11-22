# Cello recordings for the lighter melody

Six soft, sustained vibrato cello-section recordings from **VSCO 2 Community Edition**, by Versilian Studios / Sam Gossner, **CC0 1.0**. The pinned repository, original paths, URLs and hashes are in [source.json](source.json); the full license is retained in [LICENSE.txt](LICENSE.txt).

Four low recordings are reused directly from [the original cello bank](../cello/README.md); its source files and manifest remain unchanged. Two additional recordings, source D2 and F2, supply scientific D3 and F3 without large pitch shifts. Source octave names are one lower than scientific notation. The lighter variation uses F2–F3 and repitches by at most two semitones.

Fetch the two additions once with `node scripts/fetch-light-cello-samples.mjs`. Build offline with `npm run preview:music:cello:lighter`; verify with `node scripts/check-bass-melody.mjs --lighter`.
