// Troy as one three.js scene: sky, beach, sea, the wall with its gate, a few houses, beached ships, the wooden horse
// and the cast. update(id, f, camera) poses everything for shot `id` at frame f (a pure function of id + f).
// It reuses the bridge video's look: two-tone shading (shade.ts), card characters (cast.ts), ink, lens blur, grade.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { stoneHD, grassHD, cobbleHD, planksHD, cloudHD, ctex } from "../bridge/paint";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { FPS, SHOTS, Light, WALL_X, SHIP_BEACH, camAt, horsePos, horseBuilt, hatchOpen, gateOpen, ShotDef, V3 } from "./tstory";
import { stage } from "./tcast";

// ---------------- light presets (day / golden come from the bridge video, night is ours) ----------------
const NIGHT: LightPreset = {
  ...LIGHTS.golden, az: 40, el: 38,
  lit: [0.55, 0.66, 1.25], shade: [0.1, 0.12, 0.3], lift: [0.03, 0.05, 0.15], lambert: 0.35, sideK: 0.84, term: 0.12,
  charTint: [0.72, 0.8, 1.0], charShade: 0.8, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.8, 0.85, 1.0],
  blob: [0.5, 0.5, 0.7], actorShadow: true, top: "#0d1236", hor: "#2b3a78", fog: "#222e66", fogNear: 14, fogFar: 170,
  sunDisc: "#dfe6ff", sunCol: "#9fb4ff", sunI: 2.6, sky: "#6070b0", ground: "#202a50", hemiI: 0.5,
};
const NIGHT_LOOK: WorldLook = {
  sky: { c: ["#34437f", "#2a3670", "#1c2559", "#111845", "#0a0f33"], e: [0, 3, 8, 16, 40] },
  water: LOOK.golden.water, cloud: LOOK.golden.cloud, bounce: [0, 0, 0], sat: 1.0,
};
const LP: Record<Light, LightPreset> = { day: LIGHTS.day, golden: LIGHTS.golden, night: NIGHT };
const LK: Record<Light, WorldLook> = { day: LOOK.day, golden: LOOK.golden, night: NIGHT_LOOK };

const m4 = (x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1, rz = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), V(sx, sy, sz));
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tile = 2, bottom = false) => boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile, bottom);

const discTex = () => ctex("troyDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 50, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const signTex = () => ctex("troySign", 512, 320, (g) => {
  g.fillStyle = "#f6f0e0"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#241726"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 306);
  g.fillStyle = "#c8323a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "bold 150px Arial, Helvetica, sans-serif";
  g.fillText("FREE", 256, 120);
  g.fillStyle = "#241726"; g.font = "bold 78px Arial, Helvetica, sans-serif"; g.fillText("HORSE", 256, 235);
});

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite;
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: THREE.Texture[];
  private sunCache = new Map<number, THREE.Vector3>();
  private horse = new THREE.Group(); private hatch = new THREE.Group();
  private doors: THREE.Group[] = [];
  private sailing: THREE.Group[] = [];
  private sign = new THREE.Mesh();
  private ropes: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private mm = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunDisc.renderOrder = -0.5; this.sunDisc.frustumCulled = false; this.sunDisc.layers.set(NOINK);
    R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- materials ----
    const M = {
      sand: lam("troySand", () => ({ color: "#e6cf9a" })),
      grass: lam("grassHD", () => ({ map: grassHD() })),
      cobble: lam("cobbleHD", () => ({ map: cobbleHD() })),
      stone: lam("troyStone", () => ({ map: stoneHD("troyStone", ["#e4d3b4", "#d9c7a6", "#ecdcc0", "#d2bf9d"], "#a8967a") })),
      planks: lam("planksHD", () => ({ map: planksHD() })),
      dark: lam("troyDark", () => ({ color: "#2a1a1c" })),
      mane: lam("troyMane", () => ({ color: "#5a3a22" })),
      sea: lam("troySea", () => ({ color: "#2a86b8" })),
      foam: lam("troyFoam", () => ({ color: "#f2fbff" })),
      hull: lam("troyHull", () => ({ color: "#8a5a38" })),
      rail: lam("troyRail", () => ({ color: "#c98f5a" })),
      sail: lam("troySail", () => ({ color: "#f4efe2", side: THREE.DoubleSide })),
      sailRed: lam("troySailRed", () => ({ color: "#c8323a", side: THREE.DoubleSide })),
      roof: lam("troyRoof", () => ({ color: "#c9775a" })),
      tent: lam("troyTent", () => ({ color: "#efe3c8" })),
      tentRed: lam("troyTentRed", () => ({ color: "#b8483e" })),
      hill: lam("troyHill", () => ({ color: "#7aa655" })),
    };
    const wallCol = ["#e8c49a", "#e3d2b8", "#dfb98c", "#ead7b2"];
    const wallM = wallCol.map((c) => lam("troyW" + c, () => ({ color: c })));

    // ---- ground, sea, hills ----
    const b = new Batch();
    b.add(box(WALL_X, 47, -3, 0, -500, 500, 8), M.sand);
    b.add(box(-600, WALL_X, -3, 0, -500, 500, 5), M.cobble);
    b.add(box(47, 1400, -3, -0.5, -900, 900, 8), M.sea);
    b.add(box(44.6, 47.4, -0.18, -0.04, -500, 500, 0), M.foam); // shoreline foam
    for (const [x, z, r, h] of [[-330, -160, 150, 60], [-380, 120, 170, 75], [-250, 330, 130, 50], [-300, -330, 160, 55], [250, -520, 190, 70], [210, 520, 170, 60]] as const)
      b.add(new THREE.SphereGeometry(1, 20, 12), M.hill, m4(x, -h * 0.3, z, 0, r, h, r));

    // ---- wall with a gate at z = 0 ----
    for (const [z0, z1] of [[-62, -5], [5, 62]] as const) b.add(box(WALL_X - 2, WALL_X + 2, 0, 12, z0, z1, 3), M.stone);
    b.add(box(WALL_X - 2, WALL_X + 2, 9, 12, -5, 5, 3), M.stone); // lintel over the gate
    for (let z = -61; z <= 61; z += 3.2) {
      if (Math.abs(z) < 6 || Math.abs(z) > 56) continue;
      b.add(box(WALL_X - 2.2, WALL_X + 2.2, 12, 13.4, z - 0.8, z + 0.8, 2), M.stone);
    }
    b.add(box(WALL_X - 2.2, WALL_X + 2.2, 12, 13.4, -4.5, 4.5, 2), M.stone);
    for (const zc of [-62, -34, -9.5, 9.5, 34, 62]) {
      const hw = Math.abs(zc) < 12 ? 3.6 : 5, th = Math.abs(zc) < 12 ? 18 : 17;
      b.add(box(WALL_X - 5, WALL_X + 5, 0, th, zc - hw, zc + hw, 3), M.stone);
      b.add(box(WALL_X - 5.4, WALL_X + 5.4, th, th + 1.1, zc - hw - 0.4, zc + hw + 0.4, 2), M.stone);
      const cone = new THREE.ConeGeometry(hw * 1.5, 5, 4);
      b.add(cone, M.roof, m4(WALL_X, th + 1.1 + 2.5, zc, Math.PI / 4));
    }
    // ---- houses inside (facing the central square) ----
    const houses: [number, number, number, number, number][] = [
      [-58, -24, 11, 12, 8], [-62, -6, 12, 10, 10], [-60, 14, 10, 12, 9], [-57, 32, 12, 11, 8], [-46, -42, 13, 10, 10], [-44, 46, 12, 11, 9],
      [-80, -30, 14, 14, 11], [-84, 0, 12, 12, 13], [-82, 30, 14, 13, 10], [-30, -40, 12, 10, 8], [-28, 42, 12, 10, 9], [-70, 52, 12, 12, 9], [-72, -54, 12, 12, 10],
    ];
    houses.forEach(([x, z, w, d, h], i) => {
      b.add(box(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, 3), wallM[i % wallM.length]);
      b.add(box(x - w / 2 - 0.5, x + w / 2 + 0.5, h, h + 0.7, z - d / 2 - 0.5, z + d / 2 + 0.5, 2), M.stone);
      b.add(new THREE.ConeGeometry(Math.max(w, d) * 0.62, 3.4, 4), M.roof, m4(x, h + 0.7 + 1.7, z, Math.PI / 4));
      for (const k of [-0.28, 0.28]) b.add(box(x + w / 2, x + w / 2 + 0.18, h * 0.45, h * 0.45 + 2.0, z + d * k - 0.7, z + d * k + 0.7, 0), M.dark);
      b.add(box(x + w / 2, x + w / 2 + 0.2, 0, 3.2, z - 0.9, z + 0.9, 0), M.dark);
    });
    // ---- siege camp: tents on the beach ----
    for (const [x, z, k] of [[6, -22, 0], [14, -28, 1], [8, -34, 0], [10, 40, 1], [2, 46, 0], [14, 30, 0], [18, 48, 1]] as const)
      b.add(new THREE.ConeGeometry(3.2, 3.8, 8), k ? M.tentRed : M.tent, m4(x, 1.9, z, 0.3 * x));
    b.build(R);

    // ---- gate doors (pivot at the hinges, z = -5 and z = +5) ----
    for (const s of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(WALL_X, 0, 5 * s);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 5), M.planks);
      door.position.set(0, 4.5, -2.5 * s); door.castShadow = true; door.receiveShadow = true;
      g.add(door);
      for (const y of [1.6, 7.2]) { const band = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 5.02), M.dark); band.position.set(0, y, -2.5 * s); g.add(band); }
      this.doors.push(g); R.add(g);
    }

    // ---- ships (template with the bow toward +x), beached fleet + the one that sails ----
    const ship = new THREE.Group();
    const sb = new Batch();
    sb.add(box(-6, 6, 0.2, 2.0, -1.8, 1.8, 2), M.hull);
    sb.add(new THREE.ConeGeometry(1.8, 4.5, 4), M.hull, m4(8.2, 1.1, 0, Math.PI / 4, 0.9, 1, 1.0, -Math.PI / 2));
    sb.add(box(-7.4, -5.8, 0.5, 4.6, -1.5, 1.5, 2), M.hull);
    sb.add(box(-6, 6.4, 2.0, 2.45, -1.9, 1.9, 2), M.rail);
    sb.add(new THREE.CylinderGeometry(0.2, 0.22, 9.5, 8), M.planks, m4(0.5, 6.5, 0));
    sb.add(box(0.3, 0.7, 10.4, 10.8, -3.8, 3.8, 0), M.hull);
    sb.add(box(0.42, 0.58, 4.6, 10.4, -3.4, 3.4, 0), M.sail);
    sb.add(box(0.38, 0.62, 7.0, 8.0, -3.41, 3.41, 0), M.sailRed);
    sb.build(ship);
    ship.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    for (const [x, y, z] of SHIP_BEACH) { const s = ship.clone(true); s.position.set(x, y, z); s.rotation.set(0, 0.12 * Math.sign(z - 20), 0.04); R.add(s); }
    const sailing = ship.clone(true); sailing.visible = false; this.sailing.push(sailing); R.add(sailing);
    const sailing2 = ship.clone(true); sailing2.visible = false; this.sailing.push(sailing2); R.add(sailing2);

    // ---- the horse (faces -x, base on y = 0; the whole group is scaled by `built`) ----
    const hb = new Batch();
    hb.add(box(-4.6, 4.6, 0.9, 1.5, -2.0, 2.0, 2), M.planks); // platform
    for (const x of [-3.4, 3.4]) for (const z of [-2.5, 2.5]) hb.add(new THREE.CylinderGeometry(1.0, 1.0, 0.6, 14), M.mane, m4(x, 1.0, z, 0, 1, 1, 1, Math.PI / 2));
    for (const x of [-3.0, 1.6]) for (const z of [-1.5, 0.3]) hb.add(box(x, x + 1.4, 1.4, 6.2, z, z + 1.2, 1.4), M.planks); // legs
    hb.add(box(-3.9, 3.9, 5.6, 9.4, -1.9, 1.9, 1.6), M.planks); // barrel
    hb.add(box(-3.0, 3.2, 9.4, 9.8, -1.5, 1.5, 1.6), M.planks); // back
    const neck = new THREE.BoxGeometry(2.0, 5.6, 2.2);
    hb.add(neck, M.planks, m4(-4.4, 11.0, 0, 0, 1, 1, 1, 0.38));
    hb.add(box(-9.0, -5.4, 12.6, 14.3, -1.1, 1.1, 1.4), M.planks); // head
    hb.add(box(-9.4, -8.2, 12.2, 13.5, -0.9, 0.9, 1.0), M.mane); // muzzle
    hb.add(box(-6.9, -6.4, 13.2, 13.7, 1.05, 1.18, 0), M.dark); hb.add(box(-6.9, -6.4, 13.2, 13.7, -1.18, -1.05, 0), M.dark); // eyes
    hb.add(new THREE.ConeGeometry(0.5, 1.5, 4), M.planks, m4(-5.6, 15.0, 0.55)); hb.add(new THREE.ConeGeometry(0.5, 1.5, 4), M.planks, m4(-5.6, 15.0, -0.55));
    for (let i = 0; i < 6; i++) hb.add(box(-3.0 - i * 0.28 - 0.35, -3.0 - i * 0.28 + 0.35, 12.9 - i * 1.0, 13.9 - i * 1.0, -0.4, 0.4, 0), M.mane); // mane
    hb.add(box(3.6, 4.4, 5.6, 9.2, -0.4, 0.4, 0), M.mane); hb.add(box(3.9, 4.7, 4.4, 5.8, -0.4, 0.4, 0), M.mane); // tail
    hb.build(this.horse);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.6), M.dark); // trapdoor under the belly
    flap.position.set(1.2, 0, 0); this.hatch.add(flap); this.hatch.position.set(-1.0, 5.55, 0);
    this.horse.add(this.hatch);
    this.horse.scale.setScalar(0.85);
    this.horse.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    const outer = new THREE.Group(); outer.add(this.horse); this.root.add(outer); this.horseOuter = outer;

    // ---- ropes for the pull (shot 5) ----
    for (let k = 0; k < 2; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1), M.mane); r.visible = false; r.castShadow = true; this.ropes.push(r); R.add(r); }

    // ---- the FREE sign (shot 8) ----
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.75), new THREE.MeshBasicMaterial({ map: signTex(), side: THREE.DoubleSide }));
    board.position.y = 3.8; board.layers.set(NOINK);
    const back = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.85, 0.12), M.planks); back.position.set(0, 3.8, -0.1);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.4, 0.28), M.planks); post.position.set(0, 2.2, -0.1);
    this.sign.add(board, back, post);
    this.sign.traverse((o) => { o.castShadow = true; });
    R.add(this.sign);
  }
  private horseOuter!: THREE.Group;

  /** camera-relative sun, frozen per shot (same rule as the bridge video) */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(L.az), el = THREE.MathUtils.degToRad(L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LP[s.light], K = LK[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 14, 95);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun / moon, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showDisc = s.light !== "day";
    this.sunDisc.visible = showDisc;
    if (showDisc) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(s.light === "night" ? 2.6 : 1.7)));
      (this.sunDisc.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(s.light === "night" ? 1.4 : 4.0);
    }
    for (const m of this.clouds) { m.lookAt(cam.position.x, m.position.y, cam.position.z); m.visible = s.light !== "night"; }
    // ---- scene animation ----
    const hp = horsePos(t), built = horseBuilt(t);
    this.horseOuter.position.set(hp[0], hp[1], hp[2]);
    this.horseOuter.visible = built > 0.001;
    this.horse.scale.set(0.85, 0.85 * Math.max(0.001, built), 0.85);
    this.hatch.rotation.z = -1.5 * hatchOpen(t);
    const go = gateOpen(t);
    this.doors.forEach((d, i) => { d.rotation.y = (i === 0 ? -1 : 1) * 1.75 * go; });
    // ship that sails away (shot 3, from 9.9 s), ships that come back (shot 7)
    const [a0, a1] = this.sailing;
    a0.visible = a1.visible = false;
    if (id === 3 && t >= 9.0) { const u = (t - 9.0) * 11; a0.visible = true; a0.position.set(52 + u, 0.2, 10); a0.rotation.set(0, 0, 0.03 * Math.sin(t * 3)); a1.visible = true; a1.position.set(60 + u * 1.2, 0.2, 24); a1.rotation.set(0, 0, 0.03 * Math.sin(t * 3 + 1)); }
    if (id === 7 || id === 8) { const u = Math.max(0, 24.2 - t) * 9; a0.visible = true; a0.position.set(52 + u, 0.2, 4); a0.rotation.set(0, 0, 0.03 * Math.sin(t * 3)); a1.visible = true; a1.position.set(50 + u * 1.1, 0.2, -12); a1.rotation.set(0, 0, 0.03 * Math.sin(t * 3 + 1)); }
    this.ropes.forEach((r, k) => {
      r.visible = id === 5;
      if (id !== 5) return;
      const side = k ? 1 : -1, dx = -0.52, dz = -0.85, px = -dz, pz = dx;
      const from = V(hp[0] - 3.4, 5.4, hp[2]), to = V(hp[0] + dx * 10.4 + px * 3.2 * side, 1.5, hp[2] + dz * 10.4 + pz * 3.2 * side);
      r.position.copy(from).add(to).multiplyScalar(0.5); r.lookAt(to); r.scale.set(1, 1, from.distanceTo(to));
    });
    this.sign.visible = id === 8;
    this.sign.position.set(-31, 0, 5);
    this.sign.rotation.y = Math.atan2(cam.position.x - this.sign.position.x, cam.position.z - this.sign.position.z);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.mm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const ef = this.fx(fi++);
      ef.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      ef.use(!!p.soft);
      ef.mesh.visible = true;
      ef.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) ef.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { ef.mesh.quaternion.copy(cam.quaternion); ef.mesh.rotateZ(p.rot ?? 0); }
      ef.mesh.scale.set(p.w, p.h, 1);
      fused.push(ef);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const ef of fused) ef.bind();
    return focus;
  }
}
export type { V3 };
