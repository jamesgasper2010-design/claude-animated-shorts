// EXAMPLE of a sandbox entry for the look pass. You normally do not write this by hand: run
//   npm run sandbox -- <name>        (from the project folder)
// which copies src/videos/bridge to src/videos/bridge_<name> and writes src/sandboxes/<name>/index.tsx like this one,
// with the right folder name filled in. Here the copy is called "bridge_world", i.e. `npm run sandbox -- world`.
//
// A sandbox entry is its OWN entry point: never import it from src/index.ts or src/Root.tsx. The guard below stops
// "registerRoot() was called more than once" if that happens by accident.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "../../videos/bridge_world/Bridge";

const Root: React.FC = () => (
  <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
);

const g = globalThis as unknown as { __SHORTS_ROOT_REGISTERED__?: boolean };
if (!g.__SHORTS_ROOT_REGISTERED__) {
  g.__SHORTS_ROOT_REGISTERED__ = true;
  registerRoot(Root);
}
