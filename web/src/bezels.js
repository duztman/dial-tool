// bezels.js — a case round the dial, on the preview only (4.66). The idea is farukahmet's PR #3 (18 Oct 2026); Okay,
// 21:20: "Bezel had a very positive effect on people … I don't like the designs he uses but we can 'abstractify' a few
// bezels and see how they work. Abstractify meaning low number of colors, thick lines, minimal, maybe just silhouettes
// of classics. One highlight one shadow."
//
// So each case is a silhouette of a classic kind, not of a model: a flat body, one lighter band on its upper left (the
// highlight) and one darker band on its lower right (the shadow), and at most one more colour (a diver's insert, its
// marks). Everything is measured from the dial's radius, so a case fits any dial. Millimetres, y up, the dial's centre
// at the origin — the dial's own space (R1, R2). Never in an export (R5, R26): app.js draws it under the dial.
//
// A case is a list of parts, each a path in SVG's own words and a tone: body · light · shade · insert · mark.

export const BEZELS = ["None", "Diver", "Pilot", "Dress", "Sport"];

// the tones: steel for all but the dress case, which is warm (gold); the insert and its marks for the diver and sport
const STEEL = { body: "#8F8F8B", light: "#D6D6D1", shade: "#55554F", insert: "#161616", mark: "#E8E6DF" };
const GOLD = { body: "#C2A063", light: "#EDD9A3", shade: "#86672F", insert: "#161616", mark: "#E8E6DF" };

const f = (v) => (+v).toFixed(3);
const pt = (r, a) => [r * Math.sin(a * Math.PI / 180), r * Math.cos(a * Math.PI / 180)];      // clock degrees, y up
const circle = (r) => `M${f(-r)} 0A${f(r)} ${f(r)} 0 1 0 ${f(r)} 0A${f(r)} ${f(r)} 0 1 0 ${f(-r)} 0Z`;
const ring = (r0, r1) => circle(r1) + circle(r0);                    // evenodd: the band between
// a band of a ring between two clock angles, a0 to a1 clockwise
const arc = (r0, r1, a0, a1) => {
  const big = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0, [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
  return `M${f(x0)} ${f(y0)}A${f(r1)} ${f(r1)} 0 ${big} 0 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${f(r0)} ${f(r0)} 0 ${big} 1 ${f(x3)} ${f(y3)}Z`;
};
const rect = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
// a mark standing on the clock, from r0 out to r1, w wide, at clock angle a
const bar = (r0, r1, w, a) => {
  const [sx, sy] = pt(1, a), nx = sy, ny = -sx, p = (r, s) => [r * sx + s * nx * w / 2, r * sy + s * ny * w / 2];
  const q = [p(r0, -1), p(r1, -1), p(r1, 1), p(r0, 1)];
  return `M${q.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
};
/** the parts of a case for a dial of diameter d (mm), style i (BEZELS) → [{d, tone, rule}] in drawing order, and how
 *  far it reaches from the centre (for the fit). */
export function bezel_parts(i, d) {
  const R = d / 2, name = BEZELS[i];
  if (!name || name === "None") return { parts: [], reach: R };
  const T = name === "Dress" ? GOLD : STEEL;
  const parts = [], add = (path, tone, rule = "nonzero") => parts.push({ d: path, fill: T[tone], rule });
  // the classics' proportions, by eye from the kinds: a case this much bigger than its dial, lugs this long and wide
  const P = { Diver: { case: 1.36, lug: 0.3, lw: 0.13, crown: [0.16, 0.2] }, Pilot: { case: 1.2, lug: 0.36, lw: 0.11, crown: [0.26, 0.3] },
    Dress: { case: 1.1, lug: 0.26, lw: 0.08, crown: [0.1, 0.12] }, Sport: { case: 1.3, lug: 0.3, lw: 0.13, crown: [0.15, 0.19] } }[name];
  const Rc = R * P.case, half = R * 0.72, lw = R * 2 * P.lw, out = R * 2 * P.lug;
  // the lugs and the crown first, under the case's body; then the body; its light and its shade
  for (const sy of [1, -1]) for (const sx of [1, -1]) add(rect(sx > 0 ? half - lw : -half, sy > 0 ? Rc * 0.55 : -Rc * 0.55 - out, lw, out), "body");
  const [cw, ch] = P.crown.map((k) => k * d);
  add(rect(Rc - cw * 0.2, -ch / 2, cw, ch), "body");
  if (name === "Pilot") for (let k = 1; k < 6; k++) add(rect(Rc - cw * 0.2 + cw * k / 6 - d * 0.004, -ch / 2, d * 0.008, ch), "shade");      // an onion crown's ribs
  if (name === "Sport") for (const a of [60, 120]) add(bar(Rc - R * 0.05, Rc + R * 0.14, R * 0.16, a), "body");      // pushers at 2 and 4
  add(ring(R, Rc), "body", "evenodd");
  add(arc(R, Rc, 290, 20), "light");
  add(arc(R, Rc, 110, 200), "shade");
  if (name === "Diver") {
    // the turning bezel: a dark insert, a coin edge of sixty notches, a pip at 12 and a bar every five minutes
    const ri = R * 1.02, ro = R * 1.24;
    add(ring(ri, ro), "insert", "evenodd");
    for (let k = 0; k < 60; k++) add(bar(Rc - R * 0.05, Rc + 0.001, R * 0.035, k * 6), "shade");
    add(`M0 ${f(ro - R * 0.03)}L${f(R * 0.07)} ${f(ri + R * 0.07)}L${f(-R * 0.07)} ${f(ri + R * 0.07)}Z`, "mark");
    for (let k = 1; k < 12; k++) add(bar(ri + R * 0.06, ro - R * 0.05, R * 0.05, k * 30), "mark");
  }
  if (name === "Sport") {
    // a flat bezel with sixty short marks, the fifth ones longer: a tachymeter's rhythm without its words
    const ri = R * 1.03, ro = R * 1.2;
    add(ring(ri, ro), "insert", "evenodd");
    for (let k = 0; k < 60; k++) add(bar(ro - (k % 5 ? R * 0.05 : R * 0.1), ro - R * 0.015, R * 0.018, k * 6), "mark");
  }
  return { parts, reach: Math.max(Rc + (name === "Sport" ? R * 0.14 : 0) + cw * 0.8, Rc * 0.55 + out) };
}

/** a case as SVG markup in the dial's space. */
export function bezel_svg(i, d) {
  return bezel_parts(i, d).parts.map((p) => `<path d="${p.d}" fill="${p.fill}"${p.rule === "evenodd" ? ' fill-rule="evenodd"' : ""}/>`).join("");
}
