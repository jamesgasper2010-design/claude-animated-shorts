# Claude Animated Shorts

The free Claude skill from the video **"How to Make Viral Animated Shorts Using Claude (Full Workflow)"**.

It makes 55-70 s vertical animated story shorts: 2D characters in a colourful 3D world, with ink outlines, a painted town, lens blur, gliding cameras, a march score and sound effects. Everything is rendered with three.js inside Remotion on your own PC, with no AI video generator.

Proven on **The Bridge That Fell for a Song**, a 67 s short about the 1831 Broughton bridge.

## What's inside
| Path | What it is |
|---|---|
| `SKILL.md` | The skill: the full pipeline, every rule, every fix, and the final look values |
| `project/` | **Ready-to-run Remotion project**: `package.json`, entry file, composition list, config, the bridge source in `src/videos/bridge/`, audio and QA scripts, `npm run doctor` setup checker |
| `templates/bridge/` | The full source of the bridge short: world, characters, ink, lens blur, grade, story/camera |
| `templates/audio/` | The synthesized sound: SFX, march music, the mix with ducking and loudness |
| `templates/scripts/` | Stills, side-by-side sheets, shot merge and frame-by-frame QA helpers |
| `references/STYLE_BIBLE.md` | The script and visual formula measured from 20 reference shorts |
| `references/reports/` | Seven measured reports: motion, depth, textures, characters, lighting, outlines, grade |
| `references/frames/` | 38 full-size reference frames (540x960) to compare your frames against |
| `references/sheets/` | 20 contact sheets, one per reference short, 60 frames each (1,200 frames) |

## Quick start (no coding needed)
1. Install [Node 18+](https://nodejs.org/), [Python 3](https://www.python.org/) and [ffmpeg](https://ffmpeg.org/), and make sure `ffmpeg` and `python` work in a terminal.
2. Download or clone this repo. Open a terminal **in the `project/` folder** (the one that contains `package.json`).
3. Run these, one at a time:
   ```
   npm install
   python -m pip install -r requirements.txt
   npm run doctor
   ```
   `npm run doctor` checks your setup and tells you what is still missing, in plain words.
4. Add the free 3D models (they are not in the repo): see `project/public/bridge/kenney/README.md`.
5. Preview: `npm run studio`. Render a few test frames: `npm run stills -- out/test/x_ 100,400 0.5`. Final video: `npm run render:2k`.

To use it as a Claude skill, also copy this whole repo to `~/.claude/skills/cartoon-3d-short/` and say: *"Use the cartoon short skill and make a short about ..."* (Claude Code runs the commands for you, from the `project/` folder).

## Troubleshooting
| Problem | Fix |
|---|---|
| `registerRoot() was called more than once` | `registerRoot` must be called **only** in `src/index.ts`. Never import a sandbox entry (`src/sandboxes/*`) from `src/index.ts` or `src/Root.tsx`, and never keep two entry files in one bundle. `npm run doctor` finds any stray call. |
| Sandbox cannot find `bridge_world` | Do not copy the example by hand. Run `npm run sandbox -- world` (any name): it makes the copy and a matching entry file. |
| Scene has no trees or market props | The Kenney `.glb` models are missing. See `public/bridge/kenney/README.md`; `npm run doctor` lists which ones. |
| Chrome not found / wrong Chrome path | Nothing to set: Remotion downloads its own browser. Only set `BROWSER_EXECUTABLE` if you want your own Chrome. |
| Disk fills up while rendering | Set `REMOTION_TMP` to a folder on a big drive (each bundle copies `public/`). |
| Version mismatch warning between Remotion packages | Run `npx remotion upgrade` in `project/`. |

## Notes
- Set `REMOTION_TMP` to a folder on a big drive. Every Remotion bundle copies `public/` into the temp folder (the real Kenney models make `public/` large, about 1.3 GB in the original project).
- Story, characters and voice should always be your own. Use the references for the look, not the content.

## License
The code and docs are MIT (see `LICENSE`). The reference frames are included for style study only.

## About this copy
This is a fixed copy of the original repo by mromidev (MIT). It adds the missing project scaffolding and setup tooling; the look, rules and source of the short are unchanged. See `CHANGES.md`.
