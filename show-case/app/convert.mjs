import { fileURLToPath } from "node:url";
const APP = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");      // show-case/app
const REPO = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
// Turns the two Node scripts of the cases-and-straps engine into browser modules, changing as little as possible:
// the file reads go, the batch runs at the end go, and one exported draw() stands where the runs were.
import fs from "fs";
const SRC = REPO + "/show-case/src/";
for (const name of ["engineer", "miyazaki"]) {
  let s = fs.readFileSync(SRC + name + ".mjs", "utf8");
  const cut = (from, to, put = "") => { const a = s.indexOf(from), b = to === null ? s.length : s.indexOf(to, a); if (a < 0 || b < 0) throw new Error(`${name}: ${from} … ${to}`); s = s.slice(0, a) + put + s.slice(b); };
  s = "const process = { env: {} };      // the Node scripts read settings from the environment; here nothing is set\n" + s;
  cut('import fs from "fs";', "const f = (v)", "let PK = null, DIALS = [], HANDS_A = { hour: 305, minute: 60, second: 180 };\n");
  cut("const jobs = [];", "\n", "");
  cut("const add = (n, ...a)", "\n", "");
  // the hands: their angles from the time shown, and marked so a frame can turn them without drawing the watch again
  s = s.replace("A = { hour: 305, minute: 60, second: SEC === null ? 180 : SEC * 6 }", "A = HANDS_A");
  s = s.replace('${x.hand ? ` transform="translate(${f(sh[0])} ${f(sh[1])}) rotate(${-A[x.hand]})"`', '${x.hand ? ` data-hs="${x.hand}" data-sh="${f(sh[0])} ${f(sh[1])}" transform="translate(${f(sh[0])} ${f(sh[1])}) rotate(${-A[x.hand]})"`');
  s = s.replace('${x.hand ? ` transform="rotate(${-A[x.hand]})"` : ""}/>`', '${x.hand ? ` data-h="${x.hand}" transform="rotate(${-A[x.hand]})"` : ""}/>`');
  if (!s.includes("data-hs=") || !s.includes("data-h=")) throw new Error(name + ": hands not marked");
  // the flare and the glass's shine, adjustable on the page (Okay, 20 Oct 2026, 23:14): FL — size, how close to the
  // case's colour, brightness; GLASS — the shine's width, length and opacity. All 1 (or the engine's own) at rest.
  s = s.replace("let PK = null,", "let FL = { size: 1, tint: 0.45, bright: 1 }, GLASS = { fat: 1, len: 1, op: 1 }, PK = null,");
  const swap = (a, b) => { if (!s.includes(a)) throw new Error(name + ": no " + a.slice(0, 60)); s = s.split(a).join(b); };
  swap('const flareColour = (T) => (hex2hsl(T[1])[1] < 0.12 ? "#ffffff" : mixc(T[0], "#ffffff", 0.55));', 'const flareColour = (T) => mixc(T[0], "#ffffff", 1 - FL.tint);');
  swap('const g = (a, r, w, o) => `<path d="M${f(Math.cos(rad(a - 28)) * r)} ${f(Math.sin(rad(a - 28)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 28)) * r)} ${f(Math.sin(rad(a + 28)) * r)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}"',
       'const g = (a, r, w, o) => `<path d="M${f(Math.cos(rad(a - 28 * GLASS.len)) * r)} ${f(Math.sin(rad(a - 28 * GLASS.len)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 28 * GLASS.len)) * r)} ${f(Math.sin(rad(a + 28 * GLASS.len)) * r)}" fill="none" stroke="#fff" stroke-opacity="${f(Math.min(1, o * GLASS.op))}" stroke-width="${f(w * GLASS.fat)}"');
  if (name === "engineer") {
    swap('stroke="${FLARE_TINT}" stroke-opacity="${o * 0.45 * FLARE_SCALE}" stroke-width="${w * 5}"', 'stroke="${FLARE_TINT}" stroke-opacity="${f(Math.min(1, o * 0.45 * FLARE_SCALE * FL.bright))}" stroke-width="${f(w * 5 * FL.size)}"');
  } else {
    swap('rad(a - 35)) * r)} ${f(Math.sin(rad(a - 35)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 35)) * r)} ${f(Math.sin(rad(a + 35)) * r)}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="${f(1.6 * GLASS_K)}"',
         'rad(a - 35 * GLASS.len)) * r)} ${f(Math.sin(rad(a - 35 * GLASS.len)) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(rad(a + 35 * GLASS.len)) * r)} ${f(Math.sin(rad(a + 35 * GLASS.len)) * r)}" fill="none" stroke="#fff" stroke-opacity="${f(Math.min(1, 0.5 * GLASS.op))}" stroke-width="${f(1.6 * GLASS_K * GLASS.fat)}"');
    swap('stroke="${FLARE_TINT}" stroke-opacity="${Math.min(1, o * 0.9)}" stroke-width="${w * 3.5}"', 'stroke="${FLARE_TINT}" stroke-opacity="${f(Math.min(1, o * 0.9 * FL.bright))}" stroke-width="${f(w * 3.5 * FL.size)}"');
    swap('r="${f(2.2 + w * 2.4)}" fill="${FLARE_TINT}" fill-opacity="${f(Math.min(1, o * 0.85) * FLARE_SCALE)}"', 'r="${f((2.2 + w * 2.4) * FL.size)}" fill="${FLARE_TINT}" fill-opacity="${f(Math.min(1, o * 0.85 * FL.bright) * FLARE_SCALE)}"');
    swap('r="${f(0.32 + w * 0.22)}" fill="#fff" fill-opacity="${f(0.95 * Math.sqrt(FLARE_SCALE))}"', 'r="${f((0.32 + w * 0.22) * FL.size)}" fill="#fff" fill-opacity="${f(Math.min(1, 0.95 * Math.sqrt(FLARE_SCALE) * FL.bright))}"');
  }
  // more metals (Okay, 20 Oct 2026, 23:28): black anodized (a very dark grey) and titanium
  if (name === "engineer") swap('bronze: ["#dcb185", "#a9784c", "#7e5636"] };', 'bronze: ["#dcb185", "#a9784c", "#7e5636"], titanium: ["#cac9c3", "#908f89", "#73726d"], black: ["#55565a", "#2c2d30", "#1d1e20"] };');
  else swap('bronze: ["#cf9d6c", "#8f6440", "#6a472c"] };', 'bronze: ["#cf9d6c", "#8f6440", "#6a472c"], titanium: ["#bdbcb6", "#7f7e78", "#62615c"], black: ["#4a4b4f", "#26272a", "#17181a"] };');
  // the diver's insert in any colour, one or two (a top half and a bottom half, as a GMT's), and a thin ring of the
  // case's metal between the insert and the dial (23:28)
  s = s.replace("let FL = {", "let INSERT = { top: \"#2b2c30\", bottom: \"#2b2c30\" }, FL = {");
  if (name === "engineer") {
    swap('const ins = ["#3a3b3f", "#2b2c30", "#222326"];\n    out.push(sloped(I.id / 2, ri, ins, L, -1, 0.5));',
      `const ins = (c) => [hsl(c, 1.33), c, hsl(c, 0.78)], half = "hb" + clipN++;
    CLIPS.push(\`<clipPath id="\${half}"><rect x="-60" y="0" width="120" height="60"/></clipPath>\`);
    out.push(sloped(I.id / 2, ri, ins(INSERT.top), L, -1, 0.5));
    if (INSERT.bottom !== INSERT.top) out.push(\`<g clip-path="url(#\${half})">\${sloped(I.id / 2, ri, ins(INSERT.bottom), L, -1, 0.5)}</g>\`);
    out.push(sloped(C.opening, I.id / 2, T, L, -1, 0.7));      // the thin metal ring between the insert and the dial`);
  } else {
    swap('out.push(blob(circle(ro), ["#36373b", "#26272b", "#18191b"], L, 0.6, 1.2));',
      `const ins = (c) => [hsl(c, 1.35), c, hsl(c, 0.65)], half = "hb" + BLOB++;
    CLIPS.push(\`<clipPath id="\${half}"><rect x="-60" y="0" width="120" height="60"/></clipPath>\`);
    out.push(blob(circle(ro), ins(INSERT.top), L, 0.6, 1.2));
    if (INSERT.bottom !== INSERT.top) out.push(\`<g clip-path="url(#\${half})">\${blob(circle(ro), ins(INSERT.bottom), L, 0.6, 1.2)}</g>\`);
    { const r0 = C.opening, r1 = I.id / 2, rm = (r0 + r1) / 2, wd = r1 - r0, arc = (a, sp) => \`M\${f(Math.cos(rad(a - sp)) * rm)} \${f(Math.sin(rad(a - sp)) * rm)}A\${f(rm)} \${f(rm)} 0 0 1 \${f(Math.cos(rad(a + sp)) * rm)} \${f(Math.sin(rad(a + sp)) * rm)}\`;
      out.push(\`<path d="\${circle(r1)}\${circle(r0)}" fill-rule="evenodd" fill="\${T[1]}"/><path d="\${arc(L, 55)}" fill="none" stroke="\${T[0]}" stroke-width="\${f(wd * 0.6)}" stroke-linecap="round"/><path d="\${arc(L + 180, 55)}" fill="none" stroke="\${T[2]}" stroke-width="\${f(wd * 0.6)}" stroke-linecap="round"/>\`); }      // the thin metal ring between the insert and the dial`);
  }
  // the Engineer's sloped rings (bezels, the thin metal ring, the rehaut) drawn as runs of one tone: a run is now
  // measured on one unwrapped turn and split in halves under 180°, as an SVG arc with the small-arc flag can't draw
  // more. A high or turned sun made runs longer than that, and they drew the wrong way round (02:43: "moving the sun
  // broke diver")
  if (name === "engineer") swap(`  for (let k = 0; k < N; k++) {
    const i = (start + k) % N, t = tones[i];
    if (!run || run.t !== t) { if (run) html += flat(wedge(run.a0, run.a1), run.t); run = { t, a0: i / N * 2 * Math.PI, a1: (i + 1) / N * 2 * Math.PI }; }
    else run.a1 = run.a0 + (k - (run.k0 ?? 0) + 1) / N * 2 * Math.PI, run.a1 = (i + 1) / N * 2 * Math.PI + (i + 1 < start ? 2 * Math.PI : 0);
  }
  html += flat(wedge(run.a0, run.a1 < run.a0 ? run.a1 + 2 * Math.PI : run.a1), run.t);`,
`  const put = (r) => { const n = Math.ceil((r.a1 - r.a0) / (Math.PI * 0.9)); for (let j = 0; j < n; j++) html += flat(wedge(r.a0 + (r.a1 - r.a0) * j / n, r.a0 + (r.a1 - r.a0) * (j + 1) / n), r.t); };
  for (let k = 0; k < N; k++) {
    const t = tones[(start + k) % N], a0 = (start + k) / N * 2 * Math.PI, a1 = (start + k + 1) / N * 2 * Math.PI;
    if (!run || run.t !== t) { if (run) put(run); run = { t, a0, a1 }; } else run.a1 = a1;
  }
  put(run);`);
  // Emre01 (03:54): Emre's case prototype, read off his photos — a round head on a frame of two upright rails, the strap
  // between them; the bezel a flat wide ring stepping down to a 16 mm dial; a pin crown out through the right rail; grey
  // like its print (aluminium). The rails stand in for the lugs, so the shadows, the outline and the straps follow
  swap("  dress: {", `  emre01: {
    name: "Emre01 · Emre's prototype · aluminium", rails: true, depth: 0.5, od: 22, l2l: 27, lugw: 19.4, lugT: 3.3, flare: 0, metal: ALU,
    bands: [[11, 10.5, 1, 0.6], [10.5, 9.1, 1, 0.12], [9.1, 8.6, -1, 0.7], [8.6, 8.0, 1, 0.12]],
    opening: 8.0, dial: 16, crown: { at: 0, w: 1.8, h: 1.1, knurl: 2 }, drilled: false, dialName: "Dress roman",
  },
  dress: {`);
  swap("function lugPath(C, sx, sy) {\n", `function lugPath(C, sx, sy) {
  if (C.rails) { const xi = C.lugw / 2, xo = xi + C.lugT, hy = C.l2l / 2, c = 0.2; return P([[sx * xi, -hy], [sx * (xo - c), -hy], [sx * xo, -hy + c], [sx * xo, hy - c], [sx * (xo - c), hy], [sx * xi, hy]]); }      // a rail, whole (the same for sy ±1)
`);
  if (name === "engineer") {
    swap("const cw = C.crown.w, ch = C.crown.h, x0 = R - 0.4;", "const RC = C.rails ? C.lugw / 2 + C.lugT : R, cw = C.crown.w, ch = C.crown.h, x0 = RC - 0.4;      // on Emre01, out through the rail");
    swap("[[R - 1.2, -cw * 0.32], [x0, -cw * 0.32], [x0, cw * 0.32], [R - 1.2, cw * 0.32]]", "[[RC - 1.2, -cw * 0.32], [x0, -cw * 0.32], [x0, cw * 0.32], [RC - 1.2, cw * 0.32]]");
    // a rail: its flat top and a bevel on all four sides, each lit by the way it faces (as the cushion's bevel)
    swap("  } else for (const sx of [-1, 1]) for (const sy of [-1, 1]) {\n    out.push(shape(lugPath(C, sx, sy), T[1], 0.2, T[2]));",
      `  } else if (C.rails) for (const sx of [-1, 1]) {
    const xi = sx * C.lugw / 2, xo = sx * (C.lugw / 2 + C.lugT), hy = C.l2l / 2, b = 0.5, xa = Math.min(xi, xo), xz = Math.max(xi, xo);
    const o = [[xa, -hy], [xz, -hy], [xz, hy], [xa, hy]], i = [[xa + b, -hy + b], [xz - b, -hy + b], [xz - b, hy - b], [xa + b, hy - b]];
    out.push(shape(P(o), T[1], 0.2, T[2]));
    [[0, 1, 270], [1, 2, 0], [2, 3, 90], [3, 0, 180]].forEach(([a, z, phi]) => out.push(flat(P([o[a], o[z], i[z], i[a]]), tone(T, phi, 0.85, L))));
    out.push(stroke(P(i), 0.1), stroke(P(o), 0.2));
  } else for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    out.push(shape(lugPath(C, sx, sy), T[1], 0.2, T[2]));`);
  } else {
    swap("  { const cd = rrect(R - 1.2, -cw / 2, R + ch, cw / 2, 1.0),", "  const RC = C.rails ? C.lugw / 2 + C.lugT - 0.1 : R;      // on Emre01, out through the rail\n  { const R = RC, cd = rrect(R - 1.2, -cw / 2, R + ch, cw / 2, Math.min(1.0, cw / 2)),");
  }
  // on Emre01 the strap's end tucks under the round head, between the rails (as the bracelet does in the photos)
  swap("Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2)", "(C.rails ? C.od / 2 - 1.5 : Math.min(C.l2l / 2 - 3.4, C.od / 2 + 0.2))");
  // the diver's bracelet: the end link at 12 now fills down to the case, as the one at 6 does — its shading's box was
  // measured from the wrong end on that side, so the floor showed between it and the case (03:59)
  swap("const top = Math.min(sy * (Math.sqrt(Rr * Rr - lw * lw / 4) - 0.15), sy * yE), bot = Math.max(sy * (Math.sqrt(Rr * Rr) - 0.15), sy * yE);",
    "const ys = [sy * (Math.sqrt(Rr * Rr - lw * lw / 4) - 0.15), sy * (Rr - 0.15), sy * yE], top = Math.min(...ys), bot = Math.max(...ys);");
  // a second bracelet for the diver, after the links of Emre's prototype (03:59): three-piece links, each an H — a wide
  // middle barrel and two outer barrels half a step on — in the case's metal, each barrel lit as a cylinder
  s = "let BRACELET_KIND = \"vault\";      // which bracelet the diver wears: vault (Oyster) or links (Emre's)\n" + s;
  swap("\nfunction braceletSVG(C, L, span) {", `
function linksBracelet({ W = 19.8, y0 = 0, span = 46, sy = 1, L = 225, H = 40, ramp, ink = null, inkW = 0.22 }) {
  const lv = [Math.cos(rad(H)) * Math.cos(rad(L)), Math.cos(rad(H)) * Math.sin(rad(L)) * sy, Math.sin(rad(H))];
  const h = 4.4, g = 0.15, mid = W * 0.46, out = [\`<rect x="\${f(-W / 2 + 0.3)}" y="\${f(Math.min(sy * y0, sy * span))}" width="\${f(W - 0.6)}" height="\${f(Math.abs(span - y0))}" fill="\${ramp[0]}"/>\`];      // the pins and the dark between the barrels: no floor shows through
  const piece = (x0, x1, a, b) => { const top = Math.min(sy * a, sy * b), bot = Math.max(sy * a, sy * b), r = Math.min(0.9, (bot - top) * 0.3), d = rrect4(x0, top, x1, bot, [r, r, r, r]);
    out.push(barrel(d, x0, top, x1, bot, 0.99, ramp, lv, 1)); if (ink) out.push(\`<path d="\${d}" fill="none" stroke="\${ink}" stroke-width="\${inkW}" stroke-linejoin="round"/>\`); };
  piece(-mid / 2 + g / 2, mid / 2 - g / 2, y0, y0 + h / 2 - g);      // a half middle barrel against the end link, so no floor shows there
  for (let y = y0; y + h / 2 <= span + 0.01; y += h) {
    const b = Math.min(span, y + h - g);
    piece(-W / 2, -mid / 2 - g / 2, y, b); piece(mid / 2 + g / 2, W / 2, y, b);      // the outer barrels
    const c0 = y + h / 2, c1 = Math.min(span, c0 + h - g); if (c1 > c0 + 0.5) piece(-mid / 2 + g / 2, mid / 2 - g / 2, c0, c1);      // the middle one, half a step on
  }
  return out.join("");
}
function braceletSVG(C, L, span) {`);
  swap("out += vaultBracelet({ W, y0: yE, span, sy, L, H: SUN_H, ramp, ink: INKB });", "out += (BRACELET_KIND === \"links\" ? linksBracelet : vaultBracelet)({ W, y0: yE, span, sy, L, H: SUN_H, ramp, ink: INKB });");
  // how deep the dial sits: the bezel wall's shadow on it scales with \`depth\` (Emre01's dial halfway up, 04:08)
  swap("Math.max(0.5, Math.min(2.6, 1.1 * Math.tan(rad(40)) / Math.tan(rad(SUN_H))))", "(C.depth ?? 1) * Math.max(0.5, Math.min(2.6, 1.1 * Math.tan(rad(40)) / Math.tan(rad(SUN_H))))");
  // shadows darker or lighter, on their own (Okay, 20 Oct 2026, 23:38): SHD scales the hands' shadow, the bezel's
  // crescent on the dial and the block shadow's depth (the last in draw())
  s = s.replace("let INSERT = {", "let SHD = 1, HB_ON = false, INSERT = {");
  swap('`<path d="${x.p}" fill="#000" fill-opacity="0.35"${x.hand', '`<path d="${x.p}" fill="#000" fill-opacity="${f(Math.min(1, 0.35 * SHD))}"${x.hand');
  if (name === "engineer") swap('fill-rule="evenodd" fill="#000" fill-opacity="0.4"/></g></g>`); }', 'fill-rule="evenodd" fill="#000" fill-opacity="${f(Math.min(1, 0.4 * SHD))}"/></g></g>`); }');
  else swap('fill-rule="evenodd" fill="#000" fill-opacity="0.44"/></g></g>`);', 'fill-rule="evenodd" fill="#000" fill-opacity="${f(Math.min(1, 0.44 * SHD))}"/></g></g>`);');
  // hand bevels, marked so a frame can turn them and swap their light and dark halves with the hand's angle
  swap('return `<g transform="rotate(${-A[x.hand]})"><g clip-path="url(#${id})"><rect x="0" y="-50" width="50" height="100" fill="${side > 0 ? "#fff" : "#000"}" fill-opacity="${f(side > 0 ? lit : dark)}"/><rect x="-50"',
       'return `<g data-hb="${x.hand}" transform="rotate(${-A[x.hand]})"><g clip-path="url(#${id})"><rect x="0" y="-50" width="50" height="100" fill="${side > 0 ? "#fff" : "#000"}" fill-opacity="${f(side > 0 ? lit : dark)}"/><rect x="-50"');
  // the diver's rehaut (23:38, after a Rolex GMT): a wall sloping down from the thin metal ring to the dial, the dial a
  // little smaller under it. The wall's far side faces the light, so it lights up there and darkens near the light.
  swap("s = C.dial / D.d,", "s = (C.dial - (C.insert ? 2 * REHAUT : 0)) / D.d,");
  s = s.replace("let SHD = 1,", "const REHAUT = 0.8; let SHD = 1,");
  if (name === "engineer") swap('out.push(`<g clip-path="url(#dial-${C.key})">${dialSVG(C, v, L)}</g>`);',
    'out.push(`<g clip-path="url(#dial-${C.key})">${dialSVG(C, v, L)}</g>`);\n  if (C.insert) out.push(sloped(C.opening - REHAUT, C.opening, T, L, -1, 0.9), stroke(circle(C.opening - REHAUT), 0.15));      // the rehaut');
  else swap('out.push(`<g clip-path="url(#dial-${C.key})">${dialSVG(C, v, L)}</g>`);',
    `out.push(\`<g clip-path="url(#dial-\${C.key})">\${dialSVG(C, v, L)}</g>\`);
  if (C.insert) { const r0 = C.opening - REHAUT, r1 = C.opening, rm = (r0 + r1) / 2, wd = r1 - r0, arc = (a, sp) => \`M\${f(Math.cos(rad(a - sp)) * rm)} \${f(Math.sin(rad(a - sp)) * rm)}A\${f(rm)} \${f(rm)} 0 0 1 \${f(Math.cos(rad(a + sp)) * rm)} \${f(Math.sin(rad(a + sp)) * rm)}\`;
    out.push(\`<path d="\${circle(r1)}\${circle(r0)}" fill-rule="evenodd" fill="\${T[1]}"/><path d="\${arc(L + 180, 70)}" fill="none" stroke="\${T[0]}" stroke-width="\${f(wd * 0.75)}" stroke-linecap="round"/><path d="\${arc(L, 60)}" fill="none" stroke="\${T[2]}" stroke-width="\${f(wd * 0.75)}" stroke-linecap="round"/><path d="\${circle(r0)}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="0.12"/>\`); }      // the rehaut`);
  // ink height per colour of the dial (Okay, 20 Oct 2026, 23:51): each printed shape carries its own level, `x.ink`
  swap('const inkRelief = (x, s, L) => { if (!INK_K) return "";', 'const inkRelief = (x, s, L) => { const K = x.ink ?? INK_K; if (!K) return "";');
  swap('es = Math.min(0.035 * INK_K, th * 0.16), eh = Math.min(0.025 * INK_K, th * 0.1);', 'es = Math.min(0.035 * K, th * 0.16), eh = Math.min(0.025 * K, th * 0.1);');
  // the batch: RUNS go (the deeper colours before the loop stay), the loop and the cover go
  { const a = s.indexOf("const RUNS = ["), b = s.indexOf("\n];\n", a); if (a < 0 || b < 0) throw new Error(name + ": RUNS"); s = s.slice(0, a) + s.slice(b + 4); }
  cut("for (const [n0, key, strap, v, L0, h, dial, metal0, size] of RUNS)", null, fs.readFileSync(APP + "/draw-" + name + ".js", "utf8"));
  fs.writeFileSync(APP + `/src/${name}.js`, s);
  console.log(name, s.length);
}
