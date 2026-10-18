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
//
// Its strap (4.69; Okay, 18 Oct 2026, 22:35: "Add straps to bezels metal bands too, same style, style very good …
// Add strap color change option") is drawn the same way: a leather strap in the strap's colour, its light band on the
// left and its shade on the right, a keeper, a buckle at the top end and holes at the bottom; or a metal bracelet of
// three links to a row in the case's own metal, its centre links polished (the light), its gaps the shade. Each runs
// from between the lugs out past the view: the view fits the dial, not the case (22:35: "Fit and previews care about
// the dial still, the bezel and strap secondary").

export const BEZELS = ["None", "Diver", "Pilot", "Dress", "Sport"];
export const STRAPS = ["None", "Strap", "Bracelet"];

// the tones: steel for all but the dress case, which is warm (gold); the insert and its marks for the diver and sport
const STEEL = { body: "#8F8F8B", light: "#D6D6D1", shade: "#55554F", insert: "#161616", mark: "#E8E6DF" };
const GOLD = { body: "#C2A063", light: "#EDD9A3", shade: "#86672F", insert: "#161616", mark: "#E8E6DF" };

const f = (v) => (+v).toFixed(3);
// a strap's three tones from its colour (R, G, B, A from 0 to 1): itself, a third of the way to white, two fifths to black
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (c, to, k) => c.slice(0, 3).map((v) => v + (to - v) * k);
const strap_tones = (c) => ({ body: hex(c), light: hex(mix(c, 1, 0.33)), shade: hex(mix(c, 0, 0.4)) });
const poly = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
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
/** a strap (strap 1) or a bracelet (strap 2) between the lugs, both ends: from under the case at y0 out to the far end;
 *  W wide between the lugs, narrowing to four fifths. Parts in drawing order, before the case's. */
function strap_parts(kind, R, y0, W, metal, colour, lug_end) {
  const parts = [], add = (path, fill) => parts.push({ d: path, fill, rule: "nonzero" });
  const taper = (y) => W * (1 - 0.2 * Math.min(Math.max((y - y0) / (R * 2.4), 0), 1)) / 2;      // the half width at y
  const band = (ya, yb, s0, s1) => poly([[s0 * taper(ya), ya], [s1 * taper(ya), ya], [s1 * taper(yb), yb], [s0 * taper(yb), yb]]);      // between two fractions of the half width, s0 to s1 (−1 left … 1 right)
  for (const side of [1, -1]) {      // 1 the top strap, −1 the bottom one
    const at = (ya, yb, s0, s1) => band(ya, yb, s0, s1).replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, x, y) => `${x} ${f(side * y)}`);
    const len = side > 0 ? R * 3.6 : R * 5.2, y1 = y0 + len;
    if (kind === 1) {
      const T = strap_tones(colour);
      add(at(y0, y1, -1, 1), T.body);
      add(at(y0, y1, -1, -0.72), T.light);
      add(at(y0, y1, 0.72, 1), T.shade);
      if (side < 0) {
        // the keeper just past the lugs, the holes near the tip, the tip rounded
        const yk = lug_end + R * 0.3, kw = taper(yk) * 1.12;
        add(poly([[-kw, -yk], [kw, -yk], [kw, -yk - R * 0.16], [-kw, -yk - R * 0.16]]), T.shade);
        for (let h = 0; h < 5; h++) { const yh = y1 - R * (0.7 + 0.32 * h), r = R * 0.045; add(`M${f(-r)} ${f(-yh)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`, T.shade); }
        const tw = taper(y1);
        add(`M${f(-tw)} ${f(-y1)}A${f(tw)} ${f(tw)} 0 0 0 ${f(tw)} ${f(-y1)}Z`, T.body);
      } else {
        // the buckle at the top end: a frame in the case's metal, its pin across the strap's middle
        const bw = taper(y1) * 1.18, bh = R * 0.42, t = R * 0.07;
        add(poly([[-bw, y1 - bh / 2], [bw, y1 - bh / 2], [bw, y1 + bh / 2], [-bw, y1 + bh / 2]]) + poly([[-bw + t, y1 - bh / 2 + t], [-bw + t, y1 + bh / 2 - t], [bw - t, y1 + bh / 2 - t], [bw - t, y1 - bh / 2 + t]]), metal.body);
        add(poly([[-R * 0.025, y1], [R * 0.025, y1], [R * 0.025, y1 - bh * 0.9], [-R * 0.025, y1 - bh * 0.9]]), metal.light);
      }
    } else {
      // three links to a row: the outer ones the metal's body, the middle one polished (its light); the gaps between
      // rows and links the metal's shade, as the bracelet's underside showing through
      const pitch = R * 0.3, gap = R * 0.035;
      add(at(y0, y1, -1, 1), metal.shade);
      for (let y = y0; y < y1; y += pitch) {
        const yb = Math.min(y + pitch - gap, y1);
        add(at(y, yb, -1, -0.36), metal.body);
        add(at(y, yb, -0.32, 0.32), metal.light);
        add(at(y, yb, 0.36, 1), metal.body);
      }
    }
  }
  return parts;
}

/** the parts of a case for a dial of diameter d (mm), style i (BEZELS), with its strap (STRAPS: 0 none · 1 strap · 2
 *  bracelet; the strap in `colour`, R G B A from 0 to 1) → {parts: [{d, fill, rule}] in drawing order, reach: how far
 *  the case reaches from the centre}. */
export function bezel_parts(i, d, strap = 0, colour = [0.29, 0.2, 0.14, 1]) {
  const R = d / 2, name = BEZELS[i];
  if (!name || name === "None") return { parts: [], reach: R };
  const T = name === "Dress" ? GOLD : STEEL;
  const parts = [], add = (path, tone, rule = "nonzero") => parts.push({ d: path, fill: T[tone], rule });
  // the classics' proportions, by eye from the kinds: a case this much bigger than its dial, lugs this long and wide
  const P = { Diver: { case: 1.36, lug: 0.3, lw: 0.13, crown: [0.16, 0.2] }, Pilot: { case: 1.2, lug: 0.36, lw: 0.11, crown: [0.26, 0.3] },
    Dress: { case: 1.1, lug: 0.26, lw: 0.08, crown: [0.1, 0.12] }, Sport: { case: 1.3, lug: 0.3, lw: 0.13, crown: [0.15, 0.19] } }[name];
  const Rc = R * P.case, half = R * 0.72, lw = R * 2 * P.lw, out = R * 2 * P.lug;
  // the strap first, under everything: between the lugs' inner edges, from under the case to past the lugs' ends
  if (strap) parts.push(...strap_parts(strap, R, Rc * 0.55, 2 * (half - lw), T, colour, Rc * 0.55 + out));
  // the lugs and the crown, under the case's body; then the body; its light and its shade
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

/** a case (and its strap) as SVG markup in the dial's space. */
export function bezel_svg(i, d, strap = 0, colour) {
  return bezel_parts(i, d, strap, colour).parts.map((p) => `<path d="${p.d}" fill="${p.fill}"${p.rule === "evenodd" ? ' fill-rule="evenodd"' : ""}/>`).join("");
}
