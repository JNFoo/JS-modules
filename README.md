# JS-modules

Small, dependency-free pieces for single-file browser games, taken out of **[Apple Press](https://github.com/JNFoo/apple-press)** ([play it](https://jnfoo.github.io/apple-press/)) and **[Fancy, the Banana](https://github.com/JNFoo/fancy-banana)** ([play it](https://jnfoo.github.io/fancy-banana/)) and cleaned up so anyone, or any AI helper working with a human, can drop them into another project.

MIT License. Copyright (c) 2026 JNFoo. Use, change and sell anything built with it. Keeping the license line is the only ask.

Live demos: **https://jnfoo.github.io/JS-modules/**

## Pick a piece

| Module | One line | Global |
|---|---|---|
| [stage-curtains](modules/stage-curtains/README.md) | Velvet stage curtains that slide shut over a page, then fly open. | `StageCurtains` |
| [save-kit](modules/save-kit/README.md) | Safe localStorage saves, backup slot, checksummed copy-paste save codes. | `SaveKit` |
| [hold-press](modules/hold-press/README.md) | Hold-to-repeat for buttons that survives Android Chrome pointercancel. | `HoldPress` |
| [env-probes](modules/env-probes/README.md) | Detects privacy modes that round timers, scramble canvas read-back or block storage. | `EnvProbes` |
| [fx-governor](modules/fx-governor/README.md) | Steps visual effects down when the device cannot keep up; never back up behind the player. | `FxGovernor` |
| [fly-to-mini](modules/fly-to-mini/README.md) | A big element scrolls away and a copy flies to its sticky mini version (and back). | `FlyToMini` |
| [sticker-text](modules/sticker-text/README.md) | Die-cut sticker lettering in plain CSS text-shadow rings, no images. | `StickerText` |
| [idle-core](modules/idle-core/README.md) | Tested maths for idle/clicker games: costs, milestones, away income, boost queue, number format. | `IdleCore` |
| [frame-kit](modules/frame-kit/README.md) | Frame pacing for canvas games: even frame time, effect quality that steps down and back up, heavy jobs spread across frames. | `EvenDt`, `QualityGovernor`, `JobPump` |
| [sprite-baker](modules/sprite-baker/README.md) | Tiny software 3D rasterizer that bakes shaded sprites to canvases once at load. | `SpriteBaker` |
| [pad-nav](modules/pad-nav/README.md) | Gamepad API to DOM focus: drive buttons and menus with a controller. | `PadNav` |
| [lzma-decode](modules/lzma-decode/README.md) | Small readable LZMA1 decoder, tested against Python's lzma. | `lzmaDecode` |
| [cartoon-3d-kit](modules/cartoon-3d-kit/STYLE-GUIDE.md) | A written style guide and demo for a soft, glossy cartoon 3D look in plain CSS, SVG and canvas | none |

Tools for building and testing (not shipped inside a game):

| Tool | One line |
|---|---|
| [fuzz-play](tools/fuzz-play/README.md) | Random-play robot with invariants (Playwright), plus an in-page version for Firefox. |
| [marionette-lite](tools/marionette-lite/README.md) | Drive Firefox from Python with the standard library only. |
| [single-file-tools](tools/single-file-tools/README.md) | Font subsetting, safe inline-SVG tightening and a Zopfli self-extracting packer for one-file games. |
| [lzma-pack](tools/lzma-pack/README.md) | Packs one HTML file into a smaller self-unpacking file with LZMA and a hash check. |
| [fuzz-kit](tools/fuzz-kit/README.md) | Seeded random-input fuzzer engine with invariants and liveness checks, Playwright and Puppeteer runners. |

## How to use a module

Every module is **no dependencies** and, apart from `frame-kit` (three small files, each usable alone), **one file**, and works two ways:

```html
<script src="modules/save-kit/save-kit.js"></script>
<script>var kit = SaveKit.create({ key: 'mygame', schema: { score: 'num' } });</script>
```

```js
const SaveKit = require('./modules/save-kit/save-kit.js');   // Node / bundlers
```

Copy just the file you need. Each folder has a README (what it does, how it differs from what already exists, limits) and a `demo.html` you can open straight from disk.

## Why these and not others

Only parts that are **not already well covered by open source** were kept. Large general libraries (animation, audio, physics, fuzzers, test runners) are not repeated here. What is here are the small, specific fixes learned by shipping one real game to phones and desktops: a curtain half stuck out of place on Android, a hold that dies on `pointercancel`, a save that was overwritten by a `NaN`, Firefox privacy mode rounding the clock to 100 ms. Each module README names the closest existing project and says how this one differs.

## Not included, on purpose

The games' own art, characters, text, sounds and secret content stay in Apple Press and Fancy, the Banana and are not licensed here. `cartoon-3d-kit` teaches the technique with a generic blob character instead.

## Tests

```
npm i playwright-core
CHROMIUM=/path/to/chrome node tests/run.js      # CHROMIUM optional if Playwright finds a browser
npm run test:kits                               # frame-kit, sprite-baker, pad-nav, lzma, fuzz-kit (needs python3 and Playwright for Python for the browser parts)
```

27 checks: maths and save logic in Node, the browser pieces (curtains, hold-press, fly-to-mini, probes, governor, sticker text) in Chromium. For humans and AI helpers: read [AGENTS.md](AGENTS.md), [llms.txt](llms.txt) and [modules.json](modules.json).

## More from JNFoo

- [Apple Press](https://github.com/JNFoo/apple-press): a clicker game for kids ([play](https://jnfoo.github.io/apple-press/))
- [Fancy Banana](https://github.com/JNFoo/fancy-banana): a one-tap flying-banana arcade game ([play](https://jnfoo.github.io/fancy-banana/))
- [JS-modules](https://github.com/JNFoo/JS-modules): this repository ([demos](https://jnfoo.github.io/JS-modules/))
