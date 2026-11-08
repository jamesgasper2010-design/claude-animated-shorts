// The Trojan Horse short: timeline, places and cameras. Story time is seconds; shots are cut on the caption beats.
// World: Troy's wall runs along z at x = -20 (the gate is at z = 0), the beach lies in front of it (x -20 .. 45), the sea is x > 45.
export const FPS = 30;
export const TOTAL = 930; // 31 s
export type V3 = [number, number, number];
export type Light = "day" | "golden" | "night";
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export const WALL_X = -20;
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 120, light: "day" },      // 0 - 4 s    ten years of siege
  { id: 2, a: 120, b: 225, light: "day" },    // 4 - 7.5    Odysseus has an idea
  { id: 3, a: 225, b: 330, light: "day" },    // 7.5 - 11   the horse is built, the fleet sails away
  { id: 4, a: 330, b: 450, light: "day" },    // 11 - 15    Troy finds it, a priest warns them
  { id: 5, a: 450, b: 555, light: "day" },    // 15 - 18.5  they drag it inside
  { id: 6, a: 555, b: 690, light: "night" },  // 18.5 - 23  night, soldiers climb out
  { id: 7, a: 690, b: 810, light: "golden" }, // 23 - 27    the gates open, Troy falls
  { id: 8, a: 810, b: 930, light: "golden" }, // 27 - 31    never accept a free horse
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const T = (f: number) => f / FPS;

// ---- the horse: position of its base centre; it faces -x ----
export const H_BEACH: V3 = [4, 0, 16];
export const H_GATE: V3 = [WALL_X, 0, 0];
export const H_SQUARE: V3 = [-36, 0, 0];
export const horsePos = (t: number): V3 => {
  if (t < 15) return H_BEACH;
  if (t < 18.5) return lerp3(H_BEACH, [-4, 0, 3], smooth((t - 15) / 3.5)); // dragged toward the gate
  return H_SQUARE;
};
/** how much of the horse stands (0 -> 1 over the build, 7.5 - 9.7 s) */
export const horseBuilt = (t: number) => (t < 7.5 ? 0 : t >= 11 ? 1 : easeOut((t - 7.5) / 2.2));
/** trapdoor angle (0 shut .. 1 open) */
export const hatchOpen = (t: number) => smooth((t - 19.0) / 0.5);
/** gate doors (0 shut .. 1 open) */
export const gateOpen = (t: number) => (t < 18.4 ? 0.0 : t < 23 ? 0.0 : smooth((t - 23.1) / 1.2));
export const SHIP_BEACH: [number, number, number][] = [[33, 0, -10, ], [36, 0, 22], [31, 0, 38]]; // x, y, z of the beached fleet

// ---- cameras ----
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const go = (a: Cam, b: Cam, u: number): Cam => {
  const k = smooth(u);
  return { pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll, b.roll, k) };
};
const C = (pos: V3, look: V3, fov = 44, roll = 0): Cam => ({ pos, look, fov, roll });
export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], u = (f - s.a) / (s.b - s.a), t = T(f);
  switch (id) {
    case 1: return go(C([26, 2.6, 6], [-20, 6.5, -3], 50), C([20, 3.0, 4], [-20, 7.0, -5], 46), u);
    case 2: return go(C([-0.5, 2.1, 7.5], [-8, 2.5, 2], 36), C([-3.5, 2.0, 5.0], [-8, 2.6, 2], 31, 0.03), u);
    case 3:
      if (t < 9.9) return go(C([30, 3.5, 36], [4, 5.5, 18], 50), C([26, 3.6, 32], [4, 6.5, 18], 46), (t - 7.5) / 2.4);
      return go(C([36, 2.2, 8], [90, 4, 12], 46), C([36, 2.4, 8], [96, 4, 14], 42), (t - 9.9) / 1.1);
    case 4: return go(C([16, 2.6, 30], [-2, 4.4, 13], 48), C([11, 2.4, 25], [-3, 4.2, 14], 40, -0.03), u);
    case 5: {
      const h = horsePos(t);
      const p: V3 = [h[0] + 15 - 4 * u, 3.2, h[2] + 16 - 3 * u], l: V3 = [h[0] - 2, 4.6, h[2]];
      return { pos: p, look: l, fov: 46, roll: 0 };
    }
    case 6: return go(C([-17, 2.4, 15], [-32, 4.4, 1], 48), C([-22, 2.2, 11], [-35, 5.2, 0], 42, 0.03), u);
    case 7: return go(C([-8, 2.4, -20], [-18, 3.6, -1], 50), C([-12, 2.8, -15], [-24, 3.4, -2], 44, -0.03), u);
    default: return go(C([-26, 2.4, 14], [-36, 5.4, 0], 46), C([-28, 2.6, 11], [-36, 5.6, 0], 38), u);
  }
};
export const focusAt = (id: number, f: number): V3 => camAt(id, f).look;
export const DOF: Record<number, { cInf: number }> = { 1: { cInf: 6 }, 2: { cInf: 12 }, 3: { cInf: 4 }, 4: { cInf: 6 }, 5: { cInf: 5 }, 6: { cInf: 8 }, 7: { cInf: 5 }, 8: { cInf: 10 } };
