// Checks that everything the project needs is in place, and says exactly what to do about anything that is not.
// usage: npm run doctor        (run it from the project folder, the one that contains package.json)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
let fails = 0, warns = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const warn = (m) => { warns++; console.log(`  WARN  ${m}`); };
const fail = (m) => { fails++; console.log(`  FAIL  ${m}`); };
const run = (cmd, args) => { try { return spawnSync(cmd, args, { encoding: "utf8" }); } catch { return { status: 1 }; } };

console.log("Node and packages");
const major = Number(process.versions.node.split(".")[0]);
major >= 18 ? ok(`Node ${process.versions.node}`) : fail(`Node ${process.versions.node} is too old. Install Node 18 or newer.`);
if (!fs.existsSync(path.join(root, "package.json"))) fail("package.json not found. Run this from the project folder.");
else {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const missing = Object.keys({ ...pkg.dependencies }).filter((d) => !fs.existsSync(path.join(root, "node_modules", d)));
  missing.length ? fail(`not installed: ${missing.join(", ")}. Run: npm install`) : ok("all npm packages installed");
}

console.log("Project files");
for (const f of ["src/index.ts", "src/Root.tsx", "src/videos/bridge/Bridge.tsx", "src/videos/bridge/story.ts", "remotion.config.ts", "tsconfig.json"]) {
  fs.existsSync(path.join(root, f)) ? ok(f) : fail(`${f} is missing`);
}
const stray = [];
const walk = (d) => { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (/\.(tsx?|jsx?)$/.test(e.name) && /registerRoot\s*\(/.test(fs.readFileSync(p, "utf8"))) stray.push(path.relative(root, p).replace(/\\/g, "/"));
} };
walk(path.join(root, "src"));
const allowed = (p) => p === "src/index.ts" || p.startsWith("src/sandboxes/");
const bad = stray.filter((p) => !allowed(p));
bad.length ? fail(`registerRoot() is called in ${bad.join(", ")}. It must only be called in src/index.ts (and sandbox entries). This causes the "called more than once" error.`) : ok("registerRoot is only called from entry files");

console.log("3D assets (Kenney, CC0)");
const worldTs = path.join(root, "src/videos/bridge/world.ts");
if (fs.existsSync(worldTs)) {
  const m = fs.readFileSync(worldTs, "utf8").match(/const KENNEY = \[([\s\S]*?)\];/);
  const names = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
  const lack = names.filter((n) => !fs.existsSync(path.join(root, "public/bridge/kenney", `${n}.glb`)));
  if (!names.length) warn("could not read the asset list from world.ts");
  else if (lack.length === names.length) warn(`none of the ${names.length} Kenney models found in public/bridge/kenney/. The scene still renders, but without trees, bushes and market props. See public/bridge/kenney/README.md`);
  else if (lack.length) warn(`${lack.length} of ${names.length} Kenney models missing (${lack.join(", ")}). They are skipped when absent.`);
  else ok(`all ${names.length} Kenney models present`);
}

console.log("Tools for rendering and sound");
const ff = run("ffmpeg", ["-version"]);
ff.status === 0 ? ok("ffmpeg") : fail("ffmpeg not found. Install it and make sure it is on your PATH.");
const py = ["python3", "python"].find((c) => run(c, ["--version"]).status === 0);
if (!py) fail("Python 3 not found. It is needed for the sound and QA scripts.");
else {
  ok(`${py} found`);
  const mods = run(py, ["-c", "import numpy, scipy"]);
  mods.status === 0 ? ok("numpy and scipy") : warn(`Python packages missing. Run: ${py} -m pip install -r requirements.txt`);
}

console.log("Voice and temp folder");
fs.existsSync(path.join(root, "voice/voice.wav")) ? ok("voice/voice.wav") : warn("voice/voice.wav not found yet (needed for the sound mix)");
fs.existsSync(path.join(root, "voice/words.json")) ? ok("voice/words.json") : warn("voice/words.json not found yet (word timings, needed for the sound mix)");
process.env.REMOTION_TMP ? ok(`REMOTION_TMP = ${process.env.REMOTION_TMP}`) : warn("REMOTION_TMP is not set. Each bundle copies public/ into your temp folder; point it at a drive with space.");

console.log(`\n${fails} problem(s), ${warns} warning(s).`);
process.exit(fails ? 1 : 0);
