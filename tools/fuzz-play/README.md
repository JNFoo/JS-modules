# fuzz-play

A robot that plays your browser game badly on purpose, and checks the rules that must always hold. It found real bugs in Apple Press that hand testing missed (a stuck curtain, an auto-clicker showing the wrong numbers, flyers left over after a restart).

```
npm i playwright-core
CHROMIUM=/path/to/chrome node fuzz-play.js --url file:///path/game.html --actions ./examples/dom-actions.js --seconds 60 --seed 1
```
Options: `--viewport 412x800`, `--throttle 4` (CPU slowdown), `--init "localStorage.setItem('k','v')"`, `--check-every 5`. Exit code 1 when an invariant fails, a page error is thrown, or a stuck state lasts too long. The same seed repeats the same run.

Write an actions file for your game (see `examples/dom-actions.js`, which works on most click pages with no game code): `actions` (weighted random moves), `invariants(page)` (list of what is wrong, for example `count > total`, `NaN` in text), and optional `stuck(page)`.

**Firefox:** Playwright cannot drive stock Firefox, so `inpage.js` runs the same idea inside the page; inject it with `marionette-lite`.

## How it differs
Monkey-testing tools such as gremlins.js click randomly and watch for errors. This one is built around **your own invariants**, repeatable seeds, CPU throttling, and a "stuck" check, which is what catches the quiet bugs in games.

---
Part of [JS-modules](../../README.md) · MIT License · Copyright (c) 2026 JNFoo
