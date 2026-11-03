// night.js — show mode's night (#175's lume view; Okay, 3 Nov 2026, 01:06: "Night is lume mode … Sun is replaced by the
// "moon" … and color theory-accurate darkness filter applied. Moon strength defaults to 50%"; 16:42, on the trial
// renders: "moon 50 lume 100 is the default. go").
//
// What happens to the watch's drawing (watch.js gives an SVG string; this pass returns another):
//   1. the whole watch, ground included, goes under a night filter: how much of the daylight picture survives is the
//      Moon's Strength (100 = day). What goes is colour first, pulled toward the blue-grey of night vision, then light,
//      then the mid-tones (after Krawczyk, Myszkowski & Seidel 2005, the research v2: scotopic vision is colourless and
//      blue-shifted; brightness and local contrast fall together).
//   2. over it, a second copy of the watch in which only the lume shapes are drawn — every shape whose colour is exactly
//      a lume's (lume.js) — in that lume's glow colour, with a halo (a blur merged under the sharp shape). A copy, so
//      every shape keeps its place and turns with its hand (the hands' data-h… marks are on both copies; draw() moves
//      both). Lume decay (0 = freshly charged) fades the glow; a darker night widens the halo.
import { lume_exact } from "./lume.js";

const Y = [0.2126, 0.7152, 0.0722];      // luminance weights (sRGB)
const BLUE = [0.60, 0.70, 1.00];          // night vision's cast: a blue-grey, not black

/** the night filter's colour matrix for a darkness 0–1 (1 − moon strength): out = k·rgb + (1 − k)·Y·BLUE, dimmed */
export function night_matrix(dark) {
  const k = Math.pow(1 - dark, 1.5), dim = (1 - 0.88 * dark) * (0.75 + 0.25 * (1 - dark));
  const rows = BLUE.map((b, i) => Y.map((y, j) => ((i === j ? k : 0) + (1 - k) * b * y) * dim));
  return rows.map((r) => [...r.map((v) => v.toFixed(4)), "0", "0"].join(" ")).join(" ") + " 0 0 0 1 0";
}

/** the SVG with the night laid over it: filter defs, the filtered watch, the glow copy. moon: Strength 0–100; decay: Lume decay 0–100 */
export function night(svg, moon, decay) {
  const dark = Math.max(0, Math.min(1, 1 - moon / 100)), glow_k = Math.max(0, Math.min(1, 1 - decay / 100));
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml"), root = doc.documentElement, NS = root.namespaceURI;
  const kids = [...root.childNodes];
  // the filters: night on the watch; the glow's halo, wider as the night darkens, the sharp shape merged over it
  const defs = doc.createElementNS(NS, "defs");
  defs.innerHTML = `<filter id="night" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${night_matrix(dark)}"/><feComponentTransfer><feFuncR type="gamma" exponent="${(1 + 0.4 * dark).toFixed(3)}"/><feFuncG type="gamma" exponent="${(1 + 0.4 * dark).toFixed(3)}"/><feFuncB type="gamma" exponent="${(1 + 0.4 * dark).toFixed(3)}"/></feComponentTransfer></filter>`
    + `<filter id="lumeglow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${(1.2 + 2.4 * dark).toFixed(2)}" result="halo"/><feComponentTransfer in="halo" result="halo2"><feFuncA type="linear" slope="${(0.9 * dark).toFixed(3)}"/></feComponentTransfer><feMerge><feMergeNode in="halo2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const under = doc.createElementNS(NS, "g"); under.setAttribute("filter", "url(#night)");
  for (const k of kids) under.append(k);
  // the glow copy: the same tree, its defs dropped (the originals' ids serve), every shape unpainted but the lume ones
  const over = under.cloneNode(true); over.removeAttribute("filter"); over.setAttribute("class", "lumeglow"); over.setAttribute("filter", "url(#lumeglow)"); over.setAttribute("opacity", glow_k.toFixed(3));
  for (const d of over.querySelectorAll("defs")) d.remove();
  for (const e of over.querySelectorAll("*")) {
    if (e.tagName === "g") continue;
    const hand = e.closest("[data-hl]");      // a hand's lume opening: its fill and its relief, one glow (show.js moves the group every frame)
    const lume = lume_exact(e.getAttribute("fill") || "") || (hand && (lume_exact(hand.querySelector("[fill]")?.getAttribute("fill") || "") || lume_exact("#E4EAC2")));
    if (lume) { e.setAttribute("fill", lume.glow); e.removeAttribute("stroke"); e.removeAttribute("fill-opacity"); e.setAttribute("visibility", "visible"); continue; }
    e.setAttribute("visibility", "hidden"); e.removeAttribute("filter");
  }
  root.replaceChildren(defs, under, over);
  const out = new XMLSerializer().serializeToString(doc);
  return out.replace(/^(<svg[^>]*>)/, "$1\n");      // the svg tag on its own first line, as watch.js writes it: show.js slices the drawing's inside off that line
}
