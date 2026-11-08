// "The Wrong Century: the Trojan Horse": 31 s vertical short in the flat-characters-in-a-3D-toon-world style, rendered with
// the same post chain as the bridge video (ink -> lens blur -> bloom + neutral tone map -> grade). Captions are HTML.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./tworld";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur, GrainEffect } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { TOTAL, SHOTS, DOF, FPS, shotAt, camAt } from "./tstory";

export const TROY_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = DOF[id]?.cInf ?? 6;
  gradeFor(fx.grade, SHOTS[id - 1].light === "day" ? "day" : "golden");
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const CAPS: [number, number, string][] = [
  [0, 4, "Greece besieged Troy for ten years."],
  [4, 7.5, "Nothing worked. So Odysseus had an idea."],
  [7.5, 11, "Build a giant wooden horse. Then sail away."],
  [11, 15, "Troy found it. A priest warned them."],
  [15, 18.5, "They dragged it inside anyway."],
  [18.5, 23, "At night, soldiers hidden inside climbed out."],
  [23, 27, "They opened the gates. The fleet came back. Troy fell."],
  [27, 31, "Never accept a free horse."],
];

const Captions: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const c = CAPS.find(([a, b]) => t >= a && t < b);
  if (!c) return null;
  const [a, b, text] = c;
  const op = interpolate(t, [a, a + 0.15, b - 0.12, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 250, opacity: op }}>
      <div style={{ width: 900, textAlign: "center", color: "#fff", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 70, lineHeight: 1.12,
        WebkitTextStroke: "14px #241726", paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(36,23,38,.35)" }}>{text}</div>
    </AbsoluteFill>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const k = interpolate(t, [0.1, 0.5, 3.4, 3.9], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 170, opacity: k, transform: `scale(${0.9 + 0.1 * k})` }}>
      <div style={{ color: "#fff4dc", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 190, WebkitTextStroke: "20px #241726", paintOrder: "stroke fill" }}>10 YEARS</div>
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const k = interpolate(t, [28, 28.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 90, opacity: k }}>
      <div style={{ color: "#fff4dc", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 56, letterSpacing: 4, WebkitTextStroke: "10px #241726", paintOrder: "stroke fill" }}>THE WRONG CENTURY</div>
    </AbsoluteFill>
  );
};

export const TrojanShort: React.FC = () => {
  const f = useCurrentFrame();
  const s = shotAt(f);
  void camAt;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
          camera={{ fov: 40, near: 0.2, far: 1500 }}>
          <Inner id={s.id} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Title />
      <Captions />
      <Brand />
    </AbsoluteFill>
  );
};
