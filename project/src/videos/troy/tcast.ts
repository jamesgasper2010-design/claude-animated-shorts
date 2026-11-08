// The cast of the Trojan Horse short: Greek soldiers, Odysseus, Trojans and the priest as lit flat cards, plus effect cards.
import { Pen, Outfit, Expr, FrontOpts, SideOpts, SKINS, INK, fxBurst, fxPuff } from "../bridge/toon";
import { Stage, CamInfo, person, viewOf, blob, lidAt, hh, q, setCastLight } from "../bridge/cast";
import { SHOTS, FPS, V3, smooth, easeOut, horsePos, H_SQUARE, WALL_X } from "./tstory";

// ---------------- outfits ----------------
const greek = (v: number, extra: Partial<Outfit> = {}): Outfit => ({
  jacket: ["#b8372e", "#a32f2a", "#c4453a", "#9c3a2e"][v % 4], pants: "#dcb98a", boots: "#6b4a2a", hat: "helm", cap: "#c0353a", belt: "#8a5a2b", buttons: "#e8c45a",
  skin: SKINS[v % 4], moustache: v % 3 === 1 ? "#3a2a20" : undefined, ...extra,
});
const GREEKS = [0, 1, 2, 3].map((v) => greek(v));
const ODYSSEUS: Outfit = greek(0, { jacket: "#2f4f9a", build: "stout", sash: "#e8c45a", sword: true, moustache: "#4a3020", cap: "#2f4f9a", belt: null });
const trojan = (v: number): Outfit => ({
  jacket: ["#f1ece0", "#d9e4f2", "#efe0c0", "#e6d3d3", "#d8ead6", "#f4e6ff"][v % 6], pants: "#cdb48c", boots: "#6b4a2a", hat: "hair",
  hair: ["#3a2a20", "#5a3b2a", "#1f1a1a", "#7a5a3a"][v % 4], skin: SKINS[(v + 1) % 4], belt: "#c9a35a",
});
const TROJANS = [0, 1, 2, 3, 4, 5].map((v) => trojan(v));
const PRIEST: Outfit = { jacket: "#ffffff", pants: "#e6dfd0", boots: "#6b4a2a", hat: "hair", hair: "#d8d8dc", moustache: "#d8d8dc", skin: SKINS[0], build: "stout", belt: "#c9a35a" };

// ---------------- effect cards ----------------
const fxBulb = (p: Pen) => {
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + 0.2;
    p.stroke([[250 + 112 * Math.cos(a), 190 + 112 * Math.sin(a)], [250 + 160 * Math.cos(a), 190 + 160 * Math.sin(a)]], 12, "#f2a900");
  }
  p.ell(250, 190, 78, 86, "#ffe45a", 9);
  p.poly([[214, 262], [286, 262], [278, 322], [222, 322]], "#aeb4c2", 9);
  p.stroke([[226, 292], [274, 292]], 6);
};
const fxZ = (p: Pen) => {
  const g = p.g;
  g.font = "bold 150px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 100, 100); g.fillStyle = "#ffffff"; g.fillText("Z", 100, 100);
};

type Who = { i: number; o: Outfit; okey: string };
const W = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const exprOf = (t: number, i: number, list: Expr[]) => list[Math.floor(t * 0.7 + i * 1.7) % list.length];

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setCastLight(s.light === "day" ? "day" : "golden", cam);
  const lid = (i: number) => lidAt(t, i);

  /** a standing / sitting card facing the lens */
  const still = (who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1, shadow = true) => {
    out.places.push(person(cam, who, x, y, z, { side: false, mirror: false }, { blink: lid(who.i), ...fo }, {}, scale));
    if (shadow && fo.mode !== "fall") blob(out, x, y, z, scale);
  };
  /** a walking card moving along (dx, dz): side view when the lens sees it from the side */
  const walk = (who: Who, x: number, y: number, z: number, dx: number, dz: number, fo: FrontOpts, rate = 1, scale = 1) => {
    const view = viewOf(cam, x, z, dx, dz);
    const ph = (((t * rate + who.i * 0.37) % 1) + 1) % 1;
    const so: SideOpts = { phase: ph, expr: fo.expr, mode: "march", blink: lid(who.i), stomp: 1, stride: view.fs * (rate > 1 ? 1.4 : 1) };
    out.places.push(person(cam, who, x, y, z, view, { phase: ph, mode: "march", blink: lid(who.i), ...fo }, so, scale));
    blob(out, x, y, z, scale);
  };

  if (id === 1) {
    const spots: V3[] = [[18, 0, 3], [16, 0, 8], [21, 0, 9.5], [12, 0, 0], [14, 0, 12], [9, 0, 5], [11, 0, -6], [19, 0, -1.5], [7, 0, 9], [8, 0, -3]];
    const ex: Expr[] = ["neutral", "stern", "neutral", "dazed", "stern"];
    spots.forEach(([x, y, z], i) => still(W(i, GREEKS[i % 4], `g${i % 4}`), x, y, z, { mode: i % 4 === 3 ? "sit" : "stand", expr: ex[i % ex.length], look: i % 2 ? -1 : 0 }));
  }
  if (id === 2) {
    const tl = t - 4;
    const idea = tl > 1.3;
    still(W(20, ODYSSEUS, "ody"), -8, 0, 2, { mode: "stand", expr: tl < 1.3 ? "stern" : "grin", look: 0 }, 1.15);
    const back: V3[] = [[-11, 0, -1.8], [-10, 0, 6.2], [-12.5, 0, 3.6], [-14, 0, -4.2], [-13, 0, 8.5]];
    back.forEach(([x, y, z], i) => still(W(i + 1, GREEKS[(i + 1) % 4], `g${(i + 1) % 4}`), x, y, z, { mode: "stand", expr: idea ? (i % 2 ? "nervous" : "neutral") : "neutral", look: 0 }));
    if (idea) {
      const u = Math.min(1, (tl - 1.3) / 0.25), pulse = 1 + 0.06 * Math.sin(tl * 9);
      out.fx.push({ key: "bulb", cw: 500, ch: 400, draw: fxBulb, x: -8.2, y: 3.95, z: 2, w: 1.7 * u * pulse, h: 1.36 * u * pulse });
      if (tl < 1.9) { const b = q((tl - 1.3) / 0.6, 30); out.fx.push({ key: `bigburst${b}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, b), x: -8.2, y: 4.1, z: 1.9, w: 3.0, h: 3.0 }); }
    }
  }
  if (id === 3 && t < 9.9) {
    const tl = t - 7.5;
    const spots: V3[] = [[9.5, 0, 12.5], [10, 0, 19.5], [-1, 0, 11.5], [-0.5, 0, 20.5], [5.5, 0, 25], [4.5, 0, 8.5], [-3, 0, 16]];
    spots.forEach(([x, y, z], i) => {
      const hit = (tl * 2.2 + hh(i) * 1.7) % 1, n = hit < 0.55 ? smooth(hit / 0.55) : 1 - smooth((hit - 0.55) / 0.45);
      still(W(i, GREEKS[i % 4], `g${i % 4}`), x, y, z, { mode: "stand", expr: "grin", prop: ["hammer", n], look: 0 });
      if (hit > 0.55 && hit < 0.9) {
        const u = q((hit - 0.55) / 0.35, 20);
        out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: x + (x > 4 ? -1.1 : 1.1), y: 0.9, z, w: 2.0, h: 2.0 });
      }
    });
  }
  if (id === 4) {
    const tl = t - 11;
    const priest = (): V3 => {
      const a = easeOut(tl / 1.6);
      return [-18 + (-1.5 + 18) * a, 0, 1 + (21 - 1) * a];
    };
    const ex: Expr[] = ["laugh", "grin", "smile_closed", "laugh", "grin", "smile"];
    const targets: V3[] = [[-4, 0, 15], [-1.8, 0, 12.8], [-5.2, 0, 18.5], [-3.6, 0, 11.4], [-6.4, 0, 21.4], [-2.6, 0, 24]];
    targets.forEach(([tx, , tz], i) => {
      const a = easeOut((tl - i * 0.12) / 1.7), x = -18 + (tx + 18) * a, z = 1.5 + (tz - 1.5) * a, moving = a < 0.97;
      if (moving) walk(W(i + 5, TROJANS[i], `t${i}`), x, 0, z, tx + 18, tz - 1.5, { expr: "grin" }, 0.8);
      else still(W(i + 5, TROJANS[i], `t${i}`), x, 0, z, { mode: "stand", expr: ex[i], look: i % 2 ? 1 : -1, wave: 0 });
    });
    const [px, , pz] = priest();
    const pm = easeOut(tl / 1.6) < 0.97;
    if (pm) walk(W(30, PRIEST, "priest"), px, 0, pz, 16.5, 20, { expr: "nervous" }, 1.2, 1.05);
    else {
      const shout = tl > 2.0;
      still(W(30, PRIEST, "priest"), px, 0, pz, { mode: "stand", expr: shout ? "shock" : "nervous", look: 0, wave: shout ? 0.5 + 0.5 * Math.sin(t * 11) : 0 }, 1.05);
    }
  }
  if (id === 5) {
    const hp = horsePos(t), dx = -0.52, dz = -0.85, px = -dz, pz = dx; // forward (toward the gate) and sideways
    for (let k = 0; k < 6; k++) {
      const row = k >> 1, side = k & 1 ? 1 : -1;
      const x = hp[0] + dx * (8 + row * 2.4) + px * 3.2 * side, z = hp[2] + dz * (8 + row * 2.4) + pz * 3.2 * side;
      walk(W(k + 5, TROJANS[k], `t${k}`), x, 0, z, dx, dz, { expr: k % 2 ? "grin" : "laugh" }, 0.8, 1.0);
    }
    for (let k = 0; k < 3; k++) {
      const x = hp[0] + 6 + k * 2.2 + px * (k - 1) * 2.6, z = hp[2] + 7 + k * 2.2 + pz * (k - 1) * 2.6;
      walk(W(k + 11, TROJANS[(k + 2) % 6], `t${(k + 2) % 6}`), x, 0, z, dx, dz, { expr: "grin" }, 0.8, 1.0);
    }
    walk(W(30, PRIEST, "priest"), hp[0] + 10.5, 0, hp[2] + 12, dx, dz, { expr: "shock", wave: 0.5 + 0.5 * Math.sin(t * 11) }, 1.2, 1.05);
  }
  if (id === 6) {
    const tl = t - 18.5, cx = H_SQUARE[0];
    const sleepers: V3[] = [[cx + 7, 0, -5], [cx + 5.5, 0, 4.5], [cx + 3, 0, -9.5], [cx + 9.5, 0, 8.5], [cx - 4, 0, 8.5], [cx - 5, 0, -6.5], [cx + 11, 0, -1]];
    sleepers.forEach(([x, y, z], i) => {
      still(W(i + 5, TROJANS[i % 6], `t${i % 6}`), x, y, z, { mode: "sit", expr: "neutral", blink: 1, look: 0 }, 1.0);
      const u = ((t * 0.6 + hh(i)) % 1);
      out.fx.push({ key: "zzz", cw: 200, ch: 200, draw: fxZ, x: x + 0.35 + 0.35 * u, y: y + 1.2 + 0.9 * u, z, w: 0.45 * (0.6 + u), h: 0.45 * (0.6 + u), soft: false });
    });
    // soldiers climbing out of the horse's belly, one by one, then slipping away toward the gate
    const hx = cx - 0.85, hz = 0;
    [0.9, 1.7, 2.5, 3.2].forEach((t0, i) => {
      if (tl < t0) return;
      const d = Math.min(1, (tl - t0) / 0.7), g = W(40 + i, GREEKS[i % 4], `g${i % 4}`);
      if (d < 1) still(g, hx - 0.3 + i * 0.35, 4.2 * (1 - smooth(d)), hz + 1.0 + (i % 2) * 0.7, { mode: "stand", expr: "grin", look: 0 }, 0.9, d > 0.9);
      else {
        const w = tl - t0 - 0.7, x = hx - 0.3 + i * 0.35 + w * 3.6, z = hz + 1.0 + (i % 2) * 0.7 + w * 1.2;
        walk(g, x, 0, z, 3.6, 1.2, { expr: "grin" }, 1.4, 0.9);
      }
    });
  }
  if (id === 7) {
    const tl = t - 23;
    for (let i = 0; i < 10; i++) {
      const start = 0.9 + (i >> 1) * 0.18 + (i & 1) * 0.1, w = tl - start;
      const x = 14 - w * 9.5, z = -3.6 + (i % 5) * 1.8 + (i & 1) * 0.5;
      if (x < WALL_X - 26 || x > 40) continue;
      walk(W(i, GREEKS[i % 4], `g${i % 4}`), x, 0, z, -1, 0, { expr: "laugh" }, 1.6, 1.0);
    }
    const odd = tl - 1.0, ox = 20 - odd * 9.5;
    if (ox > WALL_X - 26 && ox < 40) walk(W(20, ODYSSEUS, "ody"), ox, 0, 1.0, -1, 0, { expr: "grin" }, 1.6, 1.15);
  }
  if (id === 8) {
    const tl = t - 27, cx = H_SQUARE[0];
    still(W(20, ODYSSEUS, "ody"), cx - 3.5, 0, 8.5, { mode: "stand", expr: "grin", look: 1, wave: 0.5 + 0.5 * Math.sin(t * 5) }, 1.15);
    [[cx + 1, 0, 9.5], [cx - 6.5, 0, 6.5], [cx + 3.5, 0, 12], [cx - 8, 0, 11]].forEach(([x, y, z], i) =>
      still(W(i, GREEKS[i % 4], `g${i % 4}`), x, y, z, { mode: "stand", expr: "laugh", look: 0 }));
    if (tl > 0.2) for (let k = 0; k < 3; k++) {
      const u = q(((t * 1.2 + k * 0.33) % 1), 20);
      out.fx.push({ key: `bigburst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 8, 30, 170), x: cx - 12 + k * 8, y: 8 + (k % 2) * 3.5, z: -2, w: 2.6, h: 2.6 });
    }
  }
  return out;
};
export { FPS };
