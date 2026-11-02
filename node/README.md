# NODE: Another Factory Game

Play at [bookskaboo.github.io/node](https://bookskaboo.github.io/node/).

The editable game, tests, and design documentation are in [`source/`](source/).
The files in this directory and `assets/` are the published GitHub Pages build.

From `node/source/`, run:

```sh
npm ci
npm test
npm run build -- --base=/node/
```

To publish, copy `source/dist/index.html` and `source/dist/assets/` into this
directory. Keep existing hashed assets available for already-open game sessions.
Do not copy `node_modules/`, local saves, or playtest outputs into the release.
