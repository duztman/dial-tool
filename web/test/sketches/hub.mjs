// hub.mjs — the #404 sketch: a dauphine and a leaf hand upright, the hub as today and as a boss of its own
// (Okay, 3 Nov 2026: "Per-shape boss only" · "The pipe's hole" · "The boss itself, as a round disc").
//   cd web && node test/sketches/hub.mjs      →  test/sketches/out/hub.png (and hub.svg)
// Drawn with the app's own geometry (hand_outline through hand_shape), 1 mm = 24 px, a mm ruler beside each hand.
// Hole Ø: the commonest hand fit, hour 1.50 · minute 0.90 (Esslinger's pairing); boss Ø as #370's First dial, hour 2.4 · minute 2.0.
import fs from "fs";
import { chromium } from "playwright";
import { engines } from "../engines.mjs";
const G = await engines();
const { circle, hand_shape, HAND_BASE, HAND_SHAPES } = G;

const K = 24;                                                             // px per mm
const hands = [                                                           // the First dial's hour and minute sizes
  { name: "hour", len: 8.25, w: 1.4, tail: 0.99, hub: 2.4, hole: 1.5 },
  { name: "minute", len: 13.2, w: 1.0, tail: 1.58, hub: 2.0, hole: 0.9 },
];
const shapes = ["dauphine", "leaf"];
const cols = [                                                            // one column per look
  { title: "A · today: the hub a circle in the hand", draw: (h, p) => [[p, "#1a1a1e"]] },
  { title: "B · a boss of its own, the pipe's hole through it", draw: (h, p) => [[p.difference(circle(h.hole)), "#1a1a1e"], [circle(h.hub).difference(circle(h.hole)), "#55555c"]] },
  { title: "C · B, the hand's tail stopping at the boss", draw: (h, p) => { const body = hand_shape({ ...h, hub: 0, tail: h.hub / 2 }); return [[body.copy().difference(circle(h.hub)), "#1a1a1e"], [circle(h.hub).difference(circle(h.hole)), "#55555c"]]; } },
];

const CW = 230, RH = 420, top = 60, left = 70;
let out = "";
const sv = (p, fill, x, y) => `<path d="${p.scale(K, -K).translate(x, y).svg(3)}" fill="${fill}" fill-rule="evenodd"/>`;
cols.forEach((c, ci) => { out += `<text x="${left + ci * CW * 2 + 20}" y="30" font-family="Helvetica, Arial" font-size="13" fill="#222">${c.title}</text>`; });
shapes.forEach((shape, si) => {
  hands.forEach((hh, hi) => {
    const h = { ...HAND_BASE, ...hh, shape: HAND_SHAPES.indexOf(shape), feature_at: 18 };
    const y0 = top + si * RH * 1.0 + 360, x0 = left + hi * CW;
    cols.forEach((c, ci) => {
      const x = x0 + ci * CW * 2 + 60;
      // the ruler: a tick a mm from the pivot up, numbered every 5
      for (let m = -2; m <= 14; m++) out += `<line x1="${x - 36}" x2="${x - 36 + (m % 5 ? 4 : 8)}" y1="${y0 - m * K}" y2="${y0 - m * K}" stroke="#999" stroke-width="1"/>` + (m % 5 ? "" : `<text x="${x - 60}" y="${y0 - m * K + 4}" font-size="9" font-family="Helvetica, Arial" fill="#777">${m}</text>`);
      out += `<line x1="${x - 12}" x2="${x + 12}" y1="${y0}" y2="${y0}" stroke="#c33" stroke-width="0.6"/><line x1="${x}" x2="${x}" y1="${y0 - 12}" y2="${y0 + 12}" stroke="#c33" stroke-width="0.6"/>`;      // the pivot
      const p = hand_shape(h).copy();      // a copy: a combine consumes its operands
      for (const [q, fill] of c.draw(h, p)) out += sv(q, fill, x, y0);
      out += `<text x="${x - 30}" y="${y0 + 60}" font-size="11" font-family="Helvetica, Arial" fill="#444">${hh.name} · boss ${hh.hub} · hole ${hh.hole}</text>`;
    });
  });
});
const W = left + cols.length * CW * 2 + 40, H = top + shapes.length * RH + 60;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#f4f4f1">${out}</svg>`;
fs.mkdirSync("test/sketches/out", { recursive: true });
fs.writeFileSync("test/sketches/out/hub.svg", svg);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.screenshot({ path: "test/sketches/out/hub.png" });
await b.close();
console.log(`hub.png ${W}×${H}`);
