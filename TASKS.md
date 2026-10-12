# Task board

One row per module or piece of work. Update your row in its own small commit before you start and when you finish (see [AGENTS.md](AGENTS.md)).

| Module / task | Status | Owner (session or person) | Notes |
|---|---|---|---|
| `modules/lzma-decode` + `tools/lzma-pack` | done | first session | decoder, packer, 140 decoder checks against Python's lzma, 14 browser checks |
| `frame-kit` | done | first session | EvenDt, QualityGovernor, JobPump; 35 checks |
| `fuzz-kit` | done | first session | seeded fuzzer, Playwright and Puppeteer runners, hook stripper; 21 engine checks, 9 browser checks |
| `sprite-baker` | done | first session | software 3D rasterizer for baked sprites; 29 checks |
| `pad-nav` | done | first session | Gamepad API to DOM focus; 105 checks, Chromium only, no real controller tried |
| Run `fuzz-kit` and `pad-nav` in Firefox and WebKit | open | | the Playwright runner takes `--browser firefox` / `webkit`; only Chromium (and Firefox for the fuzzer) has been run |
| Candidate: save codes (URL-safe base64, FNV checksum, `CompressionStream` with fallback) | open: needs a prior-art check | | lz-string and similar exist; publish only if it adds something |
| Candidate: single-file game "Test Lab" panel (live tuning in a shipped build) | open: needs a decision | | game-specific today; see the source game's `tester/tester.js` |
| GitHub Pages for this repository | open | repository owner | enabling it would serve each module's `example/index.html`; note the `bytes` example of `lzma-pack` needs a server without a utf-8 charset header (use the base64 example on Pages) |
| Story packages (`story-format`, `story-check`, `story-player`, `story-map`, `zip-page`, `qa-kit`, `ai-collab-kit`) | done 2026-10-12 | session p-see-story-editor-c9 | They are cut from the Story Editor's own sources, so they live in https://github.com/JNFoo/p-see-story-editor under `packages/` (single source of truth, drift-checked), not here. Published in commit f457d1c of that repo; cross-links added both ways. Not copying: drag-reorder, spotlight tour and safe storage from the editor UI (SortableJS, Shepherd/driver.js and this repo's `save-kit` already cover them). `zip-page` overlaps `tools/single-file-tools/pack.py` and `lzma-pack`; it adds a pure-JS inflate fallback for browsers without `DecompressionStream`. |
| Regroup the public page, README table, llms.txt and modules.json by function (games / story editor / tools) | in progress | JNFoo's master-guide conversation, 2026-10-12 | Adds `side` and `category` fields to modules.json and a quick finder to the page. No module code changes. Edit those four files only after this row says done, or rebase on top. |

| Re-sync local clones of `fancy-banana`, `apple-press`, `p-see-story-editor` | note | any session | on 2026-10-12 their history was rewritten so no commit or file says the owner's former name (authors and the copyright line are JNFoo). Local clones must `git fetch && git reset --hard origin/main`; do not push old commits back. Backups are not in the repos. |

Status values: `open`, `in progress`, `done`, `blocked`.
