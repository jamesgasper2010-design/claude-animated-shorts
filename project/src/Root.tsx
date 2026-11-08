// Lists every video (composition) of the project. This file does NOT call registerRoot: src/index.ts does, once.
import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    {/* A new short: copy src/videos/bridge to src/videos/<name>, then add another <Composition> here with its own id,
        e.g. <Composition id="MyShort" component={MyShort} durationInFrames={MY_FRAMES} fps={30} width={1080} height={1920} /> */}
  </>
);
