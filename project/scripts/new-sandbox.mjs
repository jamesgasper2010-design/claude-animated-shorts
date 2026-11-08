// Creates an isolated sandbox copy of a video for the look-match pass, with a correct entry file.
// usage: npm run sandbox -- <name> [video]      e.g. npm run sandbox -- world        (copies src/videos/bridge)
//        npm run sandbox -- world myshort                                            (copies src/videos/myshort)
// Result: src/videos/<video>_<name>/  (the copy)  and  src/sandboxes/<name>/index.tsx  (its own entry point).
// Render it with:  BRIDGE_ENTRY=src/sandboxes/<name>/index.tsx npm run stills -- out/<video>/<name>/x_ 100,400 0.5
import fs from "node:fs";
import path from "node:path";

const [name, video = "bridge"] = process.argv.slice(2);
if (!name || !/^[a-z0-9_-]+$/i.test(name) || !/^[a-z0-9_-]+$/i.test(video)) {
  console.error("usage: npm run sandbox -- <name> [video]   (letters, digits, - and _ only)");
  process.exit(1);
}
const root = process.cwd();
const from = path.join(root, "src/videos", video);
const to = path.join(root, "src/videos", `${video}_${name}`);
const entryDir = path.join(root, "src/sandboxes", name);
if (!fs.existsSync(path.join(from, "Bridge.tsx"))) {
  console.error(`Cannot find ${path.relative(root, from)}/Bridge.tsx. Run this from the project folder (the one with package.json).`);
  process.exit(1);
}
if (!fs.existsSync(to)) fs.cpSync(from, to, { recursive: true });
else console.log(`kept existing ${path.relative(root, to)}`);
fs.mkdirSync(entryDir, { recursive: true });
const entry = path.join(entryDir, "index.tsx");
fs.writeFileSync(entry, `// Sandbox entry "${name}": renders only src/videos/${video}_${name} (an isolated copy of ${video}).
// This is its OWN entry point. Never import it from src/index.ts or src/Root.tsx, and never use it together with them
// in one bundle. The guard stops "registerRoot() was called more than once" if that ever happens by accident.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "../../videos/${video}_${name}/Bridge";

const Root: React.FC = () => (
  <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
);

const g = globalThis as unknown as { __SHORTS_ROOT_REGISTERED__?: boolean };
if (!g.__SHORTS_ROOT_REGISTERED__) {
  g.__SHORTS_ROOT_REGISTERED__ = true;
  registerRoot(Root);
}
`);
console.log(`ready: ${path.relative(root, to)} and ${path.relative(root, entry)}`);
console.log(`render stills with:  BRIDGE_ENTRY=${path.relative(root, entry).replace(/\\/g, "/")} npm run stills -- out/${video}/${name}/x_ 100,400 0.5`);
