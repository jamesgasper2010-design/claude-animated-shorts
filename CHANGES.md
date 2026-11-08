# Changes in this copy

Based on mromidev/claude-animated-shorts (MIT). Nothing in the look, the rules or `templates/bridge/` was changed.

## Problems found and what was done
| Reported / found | What the original had | Fix |
|---|---|---|
| No `package.json` | No `package.json` and no lock file at all | `project/package.json` with every package the code imports: `remotion`, `@remotion/three`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/cli`, `three`, `@react-three/fiber`, `postprocessing`, `@react-three/postprocessing`, React, TypeScript types |
| Missing postprocessing packages | `Bridge.tsx` imports `postprocessing` and `@react-three/postprocessing`, which nothing listed | Both added to `dependencies` |
| "Missing `Main.tsx` / core engine files" | **No `Main.tsx` exists or is referenced anywhere.** All 13 files in `templates/bridge/` are present and every relative import resolves. What was missing is the Remotion scaffolding around them | Added `project/src/index.ts`, `project/src/Root.tsx`, `remotion.config.ts`, `tsconfig.json`, with the bridge source in `project/src/videos/bridge/` |
| Duplicate `registerRoot()` errors | Only the sandbox example calls it, and nothing said where the main entry should be, so the example and a home-made entry both ended up in one bundle | One documented entry (`src/index.ts`) that registers once, with a guard; `Root.tsx` only lists compositions; sandbox entries are separate entry points; `npm run doctor` flags any stray call |
| Sandbox example hardcoded to `bridge_world` | The example imported `../../videos/bridge_world/Bridge`, a folder nothing created | `npm run sandbox -- <name>` creates the copy and a matching entry. The old example is kept as documentation |
| Hardcoded Windows Chrome path (found) | `bridge-stills.mjs` used `C:/Program Files/Google/Chrome/...` | Uses Remotion's own browser; `BROWSER_EXECUTABLE` is optional |
| Literal placeholder path (found) | `bridge_merge.py` had `os.path.expanduser("your Remotion project")` | Uses the project folder, or `REMOTION_PROJECT` |
| Kenney models absent (found) | `world.ts` loads 26 `.glb` files from `public/bridge/kenney/`; none are in the repo and the code skips missing ones silently | Folder and README added; `npm run doctor` lists what is missing |

## Not tested
Packages could not be installed where these changes were made, so `npm install`, `npm run studio` and a full render were
**not run**. The new scripts (`doctor`, `new-sandbox`) were run and work; all scripts pass syntax checks. Package versions
are ranges chosen to be compatible (Remotion 4, React 18, react-three-fiber 8, three 0.160, postprocessing 6); if the
first install or render shows a version problem, the fix is in `project/package.json`.

## Update: tested in GitHub Codespaces

- `three` / `@types/three` bumped to ^0.170.0: `postprocessing` needs three >= 0.168, and `npm install` failed with ERESOLVE on 0.160.
- Added `.devcontainer/` so a Codespace installs everything automatically.
- Added `still:cloud` and `render:cloud` scripts (software GL, longer timeout) because Codespaces has no GPU.
- Verified: npm install, `npm run doctor` (0 problems), and one rendered frame. A full video render was not run.
