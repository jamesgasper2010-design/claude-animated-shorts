// The ONE entry point of the project: `remotion studio src/index.ts`, `remotion render src/index.ts ...`.
// registerRoot may only be called once per bundle, otherwise Remotion fails with
// "registerRoot() was called more than once". The guard below makes an accidental second call (for example a
// sandbox entry pulled into this file's imports) harmless instead of fatal.
import { registerRoot } from "remotion";
import { Root } from "./Root";

const g = globalThis as unknown as { __SHORTS_ROOT_REGISTERED__?: boolean };
if (!g.__SHORTS_ROOT_REGISTERED__) {
  g.__SHORTS_ROOT_REGISTERED__ = true;
  registerRoot(Root);
}
