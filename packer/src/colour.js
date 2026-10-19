// COLOUR. Applied after the packing: changing colours never repacks.

// sRGB hex → OKLab, a colour space where distances look even to the eye.
function oklab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const r = lin(n >> 16 & 255), g = lin(n >> 8 & 255), b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(A, B) };
}

// Vividness: mostly colourfulness, plus some contrast with the white page.
// High = bright and strong (goes to the centre); low = dim, close to the paper.
function vivid(hex) { const c = oklab(hex); return c.C * 4 + (1 - c.L) * 0.5; }

// Text on a disc: dark on light colours, white on dark ones.
function inkOn(hex) { return oklab(hex).L > 0.7 ? '#1d1d1c' : '#fff'; }

// Discs that are close enough to read as neighbours.
function neighbours(discs, gap) {
  const out = discs.map(() => []);
  for (let i = 0; i < discs.length; i++) for (let j = i + 1; j < discs.length; j++) {
    const a = discs[i], b = discs[j];
    if (Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r < gap * 2 + 6) { out[i].push(j); out[j].push(i); }
  }
  return out;
}

// Returns one hex per disc.
// random: every colour used about as often, shuffled; then swaps so that
//   touching discs rarely share a colour.
// centre: like a gradient map. Discs are ranked by distance from the page's
//   middle (an ellipse the page's shape); the list's first colour goes to the
//   middle, its last to the edge. mix (0…1) blurs the bands by shifting each
//   disc's rank at random.
function spreadColours(discs, s, pal, how, mix, seed) {
  const n = discs.length, m = pal.length, rand = rng(seed);
  if (!m) return discs.map(() => '#cccccc');
  if (how === 'centre') {
    const cx = s.W / 2, cy = s.H / 2;
    const rho = discs.map(d => Math.hypot((d.x - cx) / cx, (d.y - cy) / cy) + (rand() - 0.5) * 2 * mix);
    const order = rho.map((v, i) => i).sort((a, b) => rho[a] - rho[b]);
    const out = new Array(n);
    order.forEach((i, rank) => { out[i] = pal[Math.min(m - 1, Math.floor(rank / n * m))]; });
    return out;
  }
  const out = discs.map((d, i) => pal[i % m]);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  const nb = neighbours(discs, s.gap);
  const clashes = i => nb[i].reduce((t, j) => t + (out[j] === out[i]), 0);
  for (let pass = 0; pass < 6; pass++) for (let i = 0; i < n; i++) {
    if (!clashes(i)) continue;
    for (let j = 0; j < n; j++) {
      if (out[j] === out[i]) continue;
      const before = clashes(i) + clashes(j);
      [out[i], out[j]] = [out[j], out[i]];
      if (clashes(i) + clashes(j) < before) break;
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

// COLOUR MOSAIC. hex → OKLCH (lightness, chroma, hue) and back.
function toLch(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const r = lin(n >> 16 & 255), g = lin(n >> 8 & 255), b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(A, B), h: Math.atan2(B, A) };
}
function lchToRgb(L, C, h) {
  const A = C * Math.cos(h), B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
         -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
         -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
// Same hue, chroma kept as asked; if that colour can't be shown on screen
// (outside sRGB), the chroma is lowered just enough, lightness kept.
function fromLch(L, C, h) {
  const ok = rgb => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
  let lo = 0, hi = C;
  if (!ok(lchToRgb(L, C, h))) for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (ok(lchToRgb(L, mid, h))) lo = mid; else hi = mid; }
  else lo = C;
  const enc = v => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255); };
  return '#' + lchToRgb(L, lo, h).map(enc).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
// The picked colour is the darkest step; each next step is lighter, same chroma.
// span: how far the lightest step goes towards white (0…1 of the way).
function tints(hex, steps, span) {
  const c = toLch(hex), top = 0.97, out = [];
  for (let t = 0; t < steps; t++) {
    const L = c.L + (Math.max(0, top - c.L)) * span * t / (steps - 1);
    out.push(t === 0 ? hex.toUpperCase() : fromLch(L, c.C, c.h));
  }
  return out;
}

// STEPS BY LIGHTNESS (colour mosaic with Centre → edge). Every step has one
// lightness shared by all colours, so a step reads as one value: step 1 at the
// palette's mean lightness, each next step lighter, the last To white % of the
// way to white. Each colour keeps its hue and chroma (lowered only where the
// screen can't show it). Returns [colour][step].
function lightSteps(pal, steps, span) {
  const lch = pal.map(toLch), top = 0.97;
  const base = lch.reduce((t, c) => t + c.L, 0) / lch.length;
  return lch.map(c => Array.from({ length: steps }, (_, t) =>
    fromLch(base + (top - base) * span * (steps > 1 ? t / (steps - 1) : 0), c.C, c.h)));
}

// The one entry the page calls. P: { pal, how: 'random' | 'centre', mix 0…1,
// mosaic: { on, steps, span }, invert }.
// Centre → edge with the colour mosaic: the discs, ranked by distance from the
// middle, fall into as many bands as there are steps (the middle the darkest,
// or the lightest when inverted); inside a band every colour is used about as
// often, at that band's lightness, shuffled.
function colourDiscs(discs, s, P, seed) {
  const { pal, how, mix, mosaic, invert } = P;
  let out;
  if (!pal.length) out = discs.map(() => '#cccccc');
  else if (how === 'centre' && mosaic.on) {
    const steps = Math.max(2, Math.min(3, Math.round(mosaic.steps)));
    const grid = lightSteps(pal, steps, mosaic.span), n = discs.length, rand = rng(seed);
    const cx = s.W / 2, cy = s.H / 2;
    const rho = discs.map(d => Math.hypot((d.x - cx) / cx, (d.y - cy) / cy) + (rand() - 0.5) * 2 * mix);
    const order = rho.map((v, i) => i).sort((a, b) => rho[a] - rho[b]);
    const bands = Array.from({ length: steps }, () => []);
    order.forEach((i, rank) => {
      let t = Math.min(steps - 1, Math.floor(rank / n * steps));
      if (invert) t = steps - 1 - t;
      bands[t].push(i);
    });
    out = new Array(n);
    bands.forEach((idx, t) => {
      const hues = idx.map((_, j) => j % pal.length);
      for (let j = hues.length - 1; j > 0; j--) { const k = Math.floor(rand() * (j + 1)); [hues[j], hues[k]] = [hues[k], hues[j]]; }
      idx.forEach((i, j) => { out[i] = grid[hues[j]][t]; });
    });
  } else {
    let list = mosaic.on ? pal.flatMap(h => tints(h, mosaic.steps, mosaic.span)) : pal.slice();
    if (how === 'centre' && invert) list = list.slice().reverse();
    out = spreadColours(discs, s, list, how, mix, seed);
  }
  // Corner discs (Smallest to corners) take the lightest colour in use.
  if (pal.length && discs.some(d => d.corner)) {
    const used = [...new Set(out)];
    const light = used.reduce((a, b) => oklab(b).L > oklab(a).L ? b : a);
    discs.forEach((d, i) => { if (d.corner) out[i] = light; });
  }
  return out;
}
// What a palette row's chips show: the steps that will be used.
function chipsFor(i, P) {
  if (!P.mosaic.on) return [];
  if (P.how === 'centre') return lightSteps(P.pal, Math.max(2, Math.min(3, Math.round(P.mosaic.steps))), P.mosaic.span)[i];
  return tints(P.pal[i], P.mosaic.steps, P.mosaic.span);
}
