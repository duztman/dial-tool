// frames.mjs — a window's frame is as thick as it is set, all round (#550; Okay, 26 Oct 2026: "Check hexagon and moon
// shape's outlines, they are not uniform"): the frame's outer outline, point by point, against the hole's outline.
// Also the stroker itself: a circle grown by stroking keeps its radius (expandStroke works at scale, 30 Oct 2026).
import { engines } from "./engines.mjs";
const G = await engines();
const pts = (path) => { const out = []; let cur = [0, 0]; for (const c of path.d) { const [v, ...xy] = c; if (v === "M" || v === "L") { cur = [xy[0], xy[1]]; out.push(cur); } else if (v === "Q") { const p0 = cur; for (let t = 0.005; t <= 1; t += 0.005) { const u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * xy[0] + t * t * xy[2], u * u * p0[1] + 2 * u * t * xy[1] + t * t * xy[3]]); } cur = [xy[2], xy[3]]; } else if (v === "C") { const p0 = cur; for (let t = 0.005; t <= 1; t += 0.005) { const u = 1 - t; out.push([u ** 3 * p0[0] + 3 * u * u * t * xy[0] + 3 * u * t * t * xy[2] + t ** 3 * xy[4], u ** 3 * p0[1] + 3 * u * u * t * xy[1] + 3 * u * t * t * xy[3] + t ** 3 * xy[5]]); } cur = [xy[4], xy[5]]; } } return out; };
const measure = (name, hole, grown) => {
  const a = pts(hole), b = pts(grown); const ds = b.map((p) => Math.min(...a.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))));
  console.log(`${name}: frame set 0.3, measured ${Math.min(...ds).toFixed(3)}–${Math.max(...ds).toFixed(3)} mm over ${b.length} points`);
};
// the window as the tool builds it (build_window): its frame is grown(frame) − hole, so the frame's outer edge against the hole's edge
for (const [name, w] of [["hexagon", { da_on: true, da_shape: 3, da_sides: 6, da_round: 0.4, da_w: 6, da_h: 6, da_frame: 0.3 }], ["moon arch", { da_on: true, da_kind: 3, da_shape: 0, da_w: 8, da_h: 4, da_frame: 0.3 }], ["circle", { da_on: true, da_shape: 2, da_w: 5, da_h: 5, da_frame: 0.3 }]]) {
  const S = { ...G.DEFAULTS, ...w }; const built = G.build_static(S).windows[0];
  const outer = built.frame, hole = built.window;
  if (!outer || !hole) { console.log(name, Object.keys(built).join(" ")); continue; }
  // the frame's outline holds both edges; keep the points farther from the window's centre than the hole's edge: the outer edge
  const c = built.centre || [0, 0];
  const a = pts(hole), b = pts(outer).filter((p) => Math.min(...a.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))) > 0.05);
  const ds = b.map((p) => Math.min(...a.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))));
  const lo = Math.min(...ds), hi = Math.max(...ds), ok = lo > 0.29 && hi < 0.33;      // 10 % at a cusp's join is the stroker's own rounding
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}: frame set 0.3, measured ${lo.toFixed(3)}–${hi.toFixed(3)} mm over ${b.length} outer points`);
  if (!ok) process.exitCode = 1;
}
{ // the stroker at scale: a Ø 2.6 circle grown by 0.3 stays a circle (at scale 1 it bulged 21 %)
  const grown = G.offset(G.circle(2.6), 0.3), rs = pts(grown).map((p) => Math.hypot(p[0], p[1]));
  const lo = Math.min(...rs), hi = Math.max(...rs), ok = lo > 1.595 && hi < 1.61;
  console.log(`${ok ? "ok  " : "FAIL"}  a Ø 2.6 circle grown by 0.3 by stroking: radius ${lo.toFixed(4)}–${hi.toFixed(4)} (1.6 wanted)`);
  if (!ok) process.exitCode = 1;
}
