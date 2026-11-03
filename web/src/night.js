// night.js — show mode's night (#175's lume view; Okay, 3 Nov 2026, 01:06: "Night is lume mode … Sun is replaced by the
// "moon" … and color theory-accurate darkness filter applied. Moon strength defaults to 50%"; 16:42, on the trial
// renders: "moon 50 lume 100 is the default. go").
//
// What happens to the watch's drawing (watch.js gives an SVG string; this pass returns another). No SVG filter is used:
// Safari renders a filtered group the size of the watch at a clamped resolution and the whole picture blurs (Okay,
// 18:50, his screenshot on an M4 Mac). So the night is done in the colours themselves:
//   1. every colour in the drawing — fills, strokes, gradient stops, the ground — is recomputed for the night: how much
//      of the daylight colour survives is the Moon's Strength (100 = day). What goes is colour first, pulled toward the
//      blue-grey of night vision, then light, then the mid-tones (after Krawczyk, Myszkowski & Seidel 2005, the research
//      v2: scotopic vision is colourless and blue-shifted; brightness and local contrast fall together).
//   2. a lume shape — one whose colour is exactly a lume's (lume.js); a hand's lume opening is one — is painted in that
//      lume's glow colour instead, and a soft halo is laid under it: the same shape again, with a wide glow-coloured
//      stroke at a low opacity, wider and stronger as the night darkens. Lume decay (0 = freshly charged) fades both.
//      The halo is a sibling, so it keeps the shape's place and turns with its hand (show.js moves every data-h… mark).
import { lume_exact } from "./lume.js";

const Y = [0.2126, 0.7152, 0.0722];      // luminance weights (sRGB)
const BLUE = [0.60, 0.70, 1.00];          // night vision's cast: a blue-grey, not black
const COLOURED = ["fill", "stroke", "stop-color", "flood-color"];

const hex_rgb = (h) => (h.length === 4 ? [1, 2, 3].map((i) => parseInt(h[i] + h[i], 16) / 255) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
const rgb_hex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");

/** a daylight colour at night, for a darkness 0–1 (1 − moon strength): k·rgb + (1 − k)·Y·BLUE, dimmed, its mid-tones sunk */
export function night_colour(hex, dark) {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return hex;      // none, url(#…), currentColor: left alone
  const c = hex_rgb(hex), y = c[0] * Y[0] + c[1] * Y[1] + c[2] * Y[2];
  const k = Math.pow(1 - dark, 1.5), dim = (1 - 0.88 * dark) * (0.75 + 0.25 * (1 - dark)), gamma = 1 + 0.4 * dark;
  return rgb_hex(c.map((v, i) => Math.pow((k * v + (1 - k) * y * BLUE[i]) * dim, gamma)));
}

/** the SVG at night: every colour recomputed, the lume shapes glowing over a halo. moon: Strength 0–100; decay: Lume decay 0–100 */
export function night(svg, moon, decay) {
  const dark = Math.max(0, Math.min(1, 1 - moon / 100)), glow_k = Math.max(0, Math.min(1, 1 - decay / 100));
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml"), root = doc.documentElement;
  const halo_w = 0.5 + 1.1 * dark, halo_a = (0.18 + 0.32 * dark) * glow_k;      // the halo's width (the drawing's units) and strength
  const glow = (e, lume) => { e.setAttribute("fill", lume.glow); e.removeAttribute("stroke"); e.removeAttribute("fill-opacity"); if (glow_k < 1) e.setAttribute("opacity", glow_k.toFixed(3)); };
  const halo = (e, lume) => {      // two strokes under the shape, the wide one faint, the narrow one stronger: a soft edge without a blur
    for (const [w, a] of [[2 * halo_w, halo_a / 3], [halo_w, halo_a]]) {
      const h = e.cloneNode(true); h.setAttribute("class", "lumehalo");
      for (const s of [h, ...h.querySelectorAll("*")]) if (s.tagName !== "g") { s.setAttribute("fill", "none"); s.setAttribute("stroke", lume.glow); s.setAttribute("stroke-width", w.toFixed(2)); s.setAttribute("stroke-linejoin", "round"); }      // a stroke only: the shape itself is painted over it
      h.setAttribute("opacity", a.toFixed(3)); e.before(h);
    }
  };
  // a hand's lume opening is a lume-coloured shape like any other, glowing below; its daylight relief (the data-hl
  // group, the ink's edges lit and shaded) is a shading of the day and goes out at night
  for (const g of root.querySelectorAll("[data-hl]")) g.setAttribute("visibility", "hidden");
  for (const e of [...root.querySelectorAll("*")]) {
    if (e.closest("[data-hl], .lumehalo")) continue;
    const lume = lume_exact(e.getAttribute("fill") || "");
    if (lume) { halo(e, lume); glow(e, lume); continue; }
    for (const a of COLOURED) { const v = e.getAttribute(a); if (v) e.setAttribute(a, night_colour(v, dark)); }
  }
  const out = new XMLSerializer().serializeToString(doc);
  return out.replace(/^(<svg[^>]*>)/, "$1\n");      // the svg tag on its own first line, as watch.js writes it: show.js slices the drawing's inside off that line
}
