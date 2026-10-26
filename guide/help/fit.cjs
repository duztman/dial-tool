// fit.cjs — fits each of the app's icons into the help page's prose like a letter (Okay, 26 Oct 2026: "Inline icons and
// elements. Sizes optically aligned to be a part of paragraph prose, like a character … Each icon needs to get custom
// fitment within prose").
//   node guide/help/fit.cjs     (from web/; make.sh runs it after icons.cjs)
// For each icon: its drawing is measured in Chromium, its viewBox cut to what it draws (no empty margin), and it gets a
// height and a baseline shift in em, so it sizes with the text around it:
//   the measure is Inter's cap height, 0.727 em; every icon stands centred on the middle of the capitals, as a letter does;
//   round or square icons are 10 % taller than the capitals (a round letter overshoots, or it looks small);
//   tall, narrow ones (the hands) 30 % taller, like a bracket; wide ones 15 % shorter, and never wider than 1.6 em;
//   a small drawing in a large box (a dot) keeps its box's proportion, the box one em high.
// Lines keep the width the app draws them (R33: 1.5 px and the rest) through vector-effect in the stylesheet, so an icon
// weighs what the text weighs (Inter's stem at 19 px is about 1.6 px). FIX below holds a hand-set fitment where the
// rule reads wrong; each line says why. The result goes between the FIT markers in index.html.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const PAGE = path.join(__dirname, "index.html");
const CAP = 0.727;
const XH = 0.546;                                            // Inter's x-height
const FIX = {
  history: { h: 0.42, mid: XH / 2, why: "a chevron is a lower-case sign: x-height, not capitals" },
  play: { h: CAP, why: "a filled disc looks larger than a drawn ring of the same size: no overshoot" },
  "hand-disc": { h: CAP, why: "a filled disc, as play" },
  "shape-dot": { h: CAP, why: "a filled disc, as play" },
  iris: { box: true, h: CAP * 1.3, why: "its rays run far out and fade under a mask: measure the box the app shows" },
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const p = await b.newPage();
  await p.goto("file://" + PAGE);
  const found = await p.evaluate(() => {
    const out = {};
    for (const i of document.querySelectorAll("i.ic[data-ic]")) {
      const k = i.dataset.ic; if (out[k]) continue;
      const svg = i.querySelector("svg"), vb = svg.getAttribute("data-box") || svg.getAttribute("viewBox");
      const [vx, vy, vw, vh] = vb.split(/[\s,]+/).map(Number);
      svg.setAttribute("viewBox", vb);
      const bb = svg.getBBox();
      out[k] = { box: [vx, vy, vw, vh], ink: [bb.x, bb.y, bb.width, bb.height] };
    }
    return out;
  });
  await b.close();
  const r = (n) => +n.toFixed(3);
  let css = "", html = fs.readFileSync(PAGE, "utf8");
  for (const [k, { box, ink }] of Object.entries(found)) {
    let [x, y, w, h] = ink, H;
    const a = w / h;
    if (h < box[3] * 0.35 && w < box[2] * 0.35) { [x, y, w, h] = box; H = 1; }       // a small drawing keeps its box
    else if (a < 0.6) H = CAP * 1.3;
    else if (a > 1.6) H = Math.min(CAP * 0.85, 1.6 / a);
    else H = CAP * 1.1;
    if (FIX[k] && FIX[k].box) [x, y, w, h] = box;
    if (FIX[k]) H = FIX[k].h;
    const v = (FIX[k] && FIX[k].mid !== undefined ? FIX[k].mid : CAP / 2) - H / 2;
    css += `.ic[data-ic="${k}"]{--h:${r(H)}em;--v:${r(v)}em}\n`;
    // the viewBox cut to the drawing; the app's own box is kept in data-box, so a second run measures from it
    const vb = `${r(x)} ${r(y)} ${r(w)} ${r(h)}`, orig = box.join(" ");
    html = html.replace(new RegExp(`(<i class="ic" data-ic="${k}"><svg)([^>]*?)>`, "g"), (m, open, attrs) => {
      attrs = attrs.replace(/\s(viewBox|data-box)="[^"]*"/g, "").replace(/\s(width|height)="[^"]*"/g, "");
      return `${open} viewBox="${vb}" data-box="${orig}"${attrs}>`;
    });
  }
  const A = "/* FIT: made by fit.cjs, not by hand */", Z = "/* /FIT */";
  const i = html.indexOf(A), j = html.indexOf(Z);
  if (i < 0 || j < 0) throw new Error("the FIT markers are missing from index.html");
  html = html.slice(0, i + A.length) + "\n" + css + html.slice(j);
  fs.writeFileSync(PAGE, html);
  console.log(`fitted ${Object.keys(found).length} icons`);
})();
