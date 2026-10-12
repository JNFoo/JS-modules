# Notes for AI assistants (and the humans working with them)

This repository is meant to be read, copied from and extended by people and AI helpers together.

## Using a module in someone else's project
1. Open `modules.json`, pick the module, read its `README.md` (the "Limits" section matters).
2. Copy the single `.js` file into the project (keep its MIT header). No install step, no dependencies.
3. Wire it up with the snippet at the top of the file or in the README, and open the module's `demo.html` to see it working.

## Changing this repository
- Keep every module **one file, no dependencies**, ES5-compatible syntax (`var`, no build step), with the UMD wrapper at the top level (browser global + `module.exports`).
- Never throw out of a probe or a save; return a safe fallback.
- Add or update a check in `tests/run.js` for every behavior you change, then run `node tests/run.js`.
- Keep the header on each file: `Copyright (c) 2026 JNFoo. MIT License`. Contributions are accepted under the same license.
- Do not add game art, characters, brand names or text from Apple Press. Do not add code you cannot license under MIT, and say where an idea came from in the module README ("Prior art").
- Plain words in docs. Say what a thing does, then its limits.

## Run the tests
`npm i playwright-core && CHROMIUM=/path/to/chrome node tests/run.js`
