
// ═══ the page (Dial Show Case): one drawing at a time, of the dial pasted, in the colours and light chosen ═══
const STYLE = { floor: "#b9b3a6", ramp: [1.19, 1.11, 0.875], shadow: 0.67, blur: `<filter id="flare" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter>` };
const hsl = (h, k) => { const [hh, s, l] = hex2hsl(h); return hsl2hex([hh, s, Math.min(0.97, l * k)]); };
/** three tones (light · body · shade) from one body colour, in the proportions of the engine's own tables */
const tones = (h, [up, down]) => [hsl(h, up), h, hsl(h, down)];
/** the colours as the engine has them before anything is changed: what the page's colour list shows first */
export const PRESETS = { floor: STYLE.floor, metals: Object.fromEntries(Object.entries(METALS).map(([k, T]) => [k, T[1]])),
  leather: Object.fromEntries(Object.entries(LEATHER).map(([k, T]) => [k, T[1]])),
  nato: Object.fromEntries(Object.entries({ ...NATO_SETS, ...NATO_MORE }).map(([k, S]) => [k, S.map((T) => T[1])])) };
export function attach(pk) { PK = pk; }
/** the ground's colour at the drawing's edge: what lies beyond it on the screen */
export const edge = (floor, view) => (view === "detail" ? hsl(floor, STYLE.ramp[2]) : floor);
/** the case's outline at a size: lug tip to lug tip (h) and across with the crown (w), in mm — for framing */
export const caseBox = (key, size) => { const C = scaleCase(CASES[key], size); return { h: C.l2l, w: (C.cushion ? 2 * C.cushion.a : C.od) + 2 * C.crown.h, dial: C.dial }; };
export const STRIPE_COUNT = (name) => new Set((STRIPES[name] || [[0, 1, 0]]).map((x) => x[2])).size;
/** o: { items, d (the dial's diameter), A (hand angles), key (dress · field · diver), strap ("leather" · "nato" ·
 *  "bracelet"), nato (a pattern's name), metal, leather, natoColours (body colours, one per colour of the pattern),
 *  floor, L (where the light comes from, degrees: 0 right, 90 down), h (its height, degrees), size, view ("detail" ·
 *  "full" · "dial"), flare ("arc" · "dot") } → one SVG */
export function draw(o) {
  DIALS = [{ name: "live", d: o.d, own: true, items: o.items }];
  HANDS_A = o.A; FLARE_KIND = o.flare; INK_K = o.ink ?? 6; FL = o.fl; GLASS = o.glass; INSERT = o.insert; SHD = o.shadow ?? 1; HAND_BEVEL = Boolean(o.bevels);
  // a colour that is one of the engine's own keeps that entry's three tones; any other gets three made from it
  const own = (tabs, c, k) => tabs.flatMap((t) => Object.entries(t).filter(([n]) => n !== "custom").flatMap(([, v]) => (typeof v[0] === "string" ? [v] : v))).find((T) => T[1] === c) || tones(c, k);
  METALS.custom = own([METALS], o.metal, [1.35, 0.81]);
  LEATHER.custom = own([LEATHER], o.leather, [1.18, 0.82]);
  NATO_MORE.custom = o.natoColours.map((c) => own([NATO_SETS, NATO_MORE], c, [1.18, 0.82]));
  STRIPES.custom = STRIPES[o.nato] || [[0, 1, 0]];
  const two = o.floor2 && o.floor2 !== o.floor;
  SH_OVR = hsl(two ? mixc(o.floor, o.floor2, 0.5) : o.floor, Math.max(0, 1 - (1 - STYLE.shadow) * SHD));
  const strap = o.strap === "bracelet" ? "bracelet" : o.strap + "-custom";
  const make = (mode) => { GLINT = mode; return sheet(o.key, strap, "own", o.L, true, o.h, "live", "custom", o.size).replace("__CLIPS__", CLIPS.join("") + STYLE.blur); };
  const R = STYLE.ramp, vb = (x, y, w, h) => `${f(x)} ${f(y)} ${f(w)} ${f(h)}`;
  const box = o.view === "full" ? [-FULL.w / 2, -FULL.h / 2, FULL.w, FULL.h] : [-DETAIL, -DETAIL, 2 * DETAIL, 2 * DETAIL];      // the exported picture's frame
  // two colours: a gradient at 45°, the first at the top left, the second at the bottom right of the drawing's box
  const e = (box[2] + box[3]) / 4, cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
  const lin = two ? `<linearGradient id="floorg" gradientUnits="userSpaceOnUse" x1="${f(cx - e)}" y1="${f(cy - e)}" x2="${f(cx + e)}" y2="${f(cy + e)}"><stop offset="0" stop-color="${o.floor}"/><stop offset="1" stop-color="${o.floor2}"/></linearGradient>` : "";
  const ground = (svg, fill) => svg.replace('<rect x="-300" y="-300" width="600" height="600" fill="url(#pool)"/>', `${lin ? `<defs>${lin}</defs><rect x="-300" y="-300" width="600" height="600" fill="url(#floorg)"/>` : ""}<rect x="-300" y="-300" width="600" height="600" fill="${fill}"/>`);
  if (o.lighting !== "flat") {      // dramatic: the spotlight and the flare, in any view (the view is only how far in)
    // the spotlight: on one colour its own lighter and darker tones; over a gradient, a light and a dark laid over it
    const stops = two ? `<stop offset="0" stop-color="#fff" stop-opacity="0.24"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.1"/>`
      : `<stop offset="0" stop-color="${hsl(o.floor, R[0])}"/><stop offset="0.55" stop-color="${hsl(o.floor, R[1])}"/><stop offset="1" stop-color="${hsl(o.floor, R[2])}"/>`;
    const pool = `<radialGradient id="pool" cx="${f(Math.cos(rad(o.L)) * 6)}" cy="${f(Math.sin(rad(o.L)) * 6)}" r="24" gradientUnits="userSpaceOnUse">${stops}</radialGradient>`;
    return ground(make(o.flareOn ? "flare" : "off").replace(/<radialGradient id="pool"[^>]*>.*?<\/radialGradient>/s, pool), "url(#pool)").replace("__VB__", vb(...box));
  }
  return ground(make("off"), two ? "none" : o.floor).replace("__VB__", vb(...box));
}
