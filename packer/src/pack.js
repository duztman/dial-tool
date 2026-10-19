// Cover packing: three sizes of disc, packed densely on a page.
// Everything in millimetres. Same settings + same seed = same picture.

function rng(seed) {                       // mulberry32: a small seeded random
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The edge rule. bleed = how much of a disc's diameter may leave the page:
// 0 keeps it inside, 0.5 lets its centre sit on the edge.
// BIG TO CENTRE. s.sort 0…1. Each disc gets a ring to live on, measured as an
// ellipse the shape of the page: 0 its middle, 1 its edge. sortPull nudges a disc towards its size's ring by
// a share of the way, so the packing itself still decides the rest.
function sortRing(d, s) {
  // Only the largest bracket aims for the middle, on a loose ring (0.45) so
  // others can slip between them; the other brackets share one zone (0.7)
  // with a wide random spread (d.jit, ±0.35): medium and small mix, and some
  // land inside, among the large ones.
  const top = Math.min(...s.classes.filter(c => c.n > 0).map(c => c.k ?? 0));
  return d.k === top ? 0.45 + (d.jit || 0) * 0.25 : 0.7 + (d.jit || 0);
}
function sortPull(d, s, share) {
  if (!s.sort) return;
  const cx = s.W / 2, cy = s.H / 2, ax = (d.x - cx) / cx, ay = (d.y - cy) / cy;
  const rho = Math.hypot(ax, ay) || 1e-6, want = sortRing(d, s);
  const k = 1 + share * s.sort * (want - rho) / rho;
  d.x = cx + (d.x - cx) * k; d.y = cy + (d.y - cy) * k;
}

// SMALLEST TO CORNERS. s.corners: the four smallest discs (the shuffle breaks
// ties) are pinned into the four corners, touching both sides, from the start;
// the packing grows inward around them. s.edgeMin: on every side at least that
// many discs touch it (corners count): the ones nearest each side are put on it.
const CORNERS = [[0, 0], [1, 0], [0, 1], [1, 1]];
function markCorners(discs, s) {
  discs.forEach(d => { delete d.corner; });
  if (!s.corners) return;
  const by = discs.map((d, i) => i).sort((a, b) => discs[a].rel - discs[b].rel).slice(0, 4);
  by.forEach((i, c) => { discs[i].corner = CORNERS[c]; });
}
function pinEdges(discs, s) {
  discs.forEach(d => {
    if (!d.corner) return;
    const b = bounds(d.r, s, d);
    d.x = d.corner[0] ? b.x1 : b.x0; d.y = d.corner[1] ? b.y1 : b.y0;
  });
  if (!s.edgeMin) return;
  const sides = [
    [d => d.x - bounds(d.r, s).x0, d => { d.x = bounds(d.r, s).x0; }, c => c[0] === 0],
    [d => bounds(d.r, s).x1 - d.x, d => { d.x = bounds(d.r, s).x1; }, c => c[0] === 1],
    [d => d.y - bounds(d.r, s).y0, d => { d.y = bounds(d.r, s).y0; }, c => c[1] === 0],
    [d => bounds(d.r, s).y1 - d.y, d => { d.y = bounds(d.r, s).y1; }, c => c[1] === 1]];
  for (const [dist, put, isCorner] of sides) {
    const have = discs.filter(d => d.corner && isCorner(d.corner)).length;
    const need = s.edgeMin - have;
    if (need <= 0) continue;
    discs.filter(d => !d.corner && !keepOff(d, s)).sort((a, b) => dist(a) - dist(b)).slice(0, need).forEach(put);
  }
}

// KEEP OFF THE SIDES. With Big to centre on, the largest bracket never touches
// a side: it keeps room for a small disc and its two gaps between it and the
// edge, so that band fills instead of leaving a white sliver. No bleed for them.
function topBracket(s) { return Math.min(...s.classes.filter(c => c.n > 0).map(c => c.k ?? 0)); }
function keepOff(d, s) {
  if (!s.sort || !d || d.k !== topBracket(s)) return 0;
  const live = s.classes.filter(c => c.n > 0);
  const big = Math.max(...live.map(c => c.rel)), small = Math.min(...live.map(c => c.rel));
  return 2 * d.r * small / big + 2 * s.gap;            // a small disc's diameter + two gaps
}
// Where a disc's centre may go. With d given, the keep-off room applies.
function bounds(r, s, d) {
  const off = keepOff(d, s);
  const lo = off ? r + off : r - 2 * s.bleed * r;
  return { x0: lo, x1: s.W - lo, y0: lo, y1: s.H - lo };
}

// Pack. Start the discs small and scattered, then repeat:
// push every overlapping pair apart, keep each disc within the edge rule,
// and grow all discs together while they fit, shrink a hair when they jam.
// The growth stops by itself where the discs press on each other: dense.
function pack(s) {
  const rand = rng(s.seed);
  const discs = [];
  s.classes.forEach((c, k) => {
    for (let i = 0; i < c.n; i++) discs.push({ k: c.k ?? k, rel: c.rel });
  });
  // Shuffle so the class order doesn't bias the start.
  for (let i = discs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [discs[i], discs[j]] = [discs[j], discs[i]];
  }
  markCorners(discs, s);
  discs.forEach(d => {
    d.jit = (rand() - 0.5) * 0.7;
    d.x = rand() * s.W; d.y = rand() * s.H;
    if (s.sort) {                       // start each disc on its size's ring, at a random angle
      const a = rand() * 2 * Math.PI, want = Math.max(0.05, sortRing(d, s)) * 0.9;
      d.x += s.sort * (s.W / 2 + Math.cos(a) * want * s.W / 2 - d.x);
      d.y += s.sort * (s.H / 2 + Math.sin(a) * want * s.H / 2 - d.y);
    }
  });

  // Starting size: the discs together take a third of the page.
  const relArea = discs.reduce((a, d) => a + Math.PI * (d.rel / 2) ** 2, 0);
  let scale = Math.sqrt((s.W * s.H / 3) / relArea);   // mm of diameter per 1.0 rel

  const STEPS = s.steps || 6000;
  const g = s.gap;
  for (let step = 0; step < STEPS; step++) {
    discs.forEach(d => { d.r = d.rel * scale / 2; });
    let worst = 0;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < discs.length; i++) {
        for (let j = i + 1; j < discs.length; j++) {
          const a = discs[i], b = discs[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          const want = a.r + b.r + g;
          if (dist >= want) continue;
          if (dist < 1e-6) { dx = rand() - 0.5; dy = rand() - 0.5; dist = Math.hypot(dx, dy); }
          const over = want - dist;
          worst = Math.max(worst, over / want);
          // The smaller disc gives way more.
          const wa = b.r * b.r / (a.r * a.r + b.r * b.r), wb = 1 - wa;
          const ux = dx / dist, uy = dy / dist;
          a.x -= ux * over * wa; a.y -= uy * over * wa;
          b.x += ux * over * wb; b.y += uy * over * wb;
        }
      }
      discs.forEach(d => {
        const b = bounds(d.r, s, d);
        d.x = Math.min(b.x1, Math.max(b.x0, d.x));
        d.y = Math.min(b.y1, Math.max(b.y0, d.y));
      });
      pinEdges(discs, s);
    }
    // Grow fast at first, gently at the end.
    const t = step / STEPS;
    // The pull shapes the start, then fades out by 40 % of the steps.
    if (t < 0.4) discs.forEach(d => sortPull(d, s, 0.004 * (1 - t / 0.4)));
    const rate = 0.02 * (1 - t) + 0.0005;
    if (worst < 0.002) scale *= 1 + rate;
    else if (worst > 0.01) scale *= 1 - rate * 0.5;
    // A small shake now and then lets jammed discs find a better seat.
    if (t < 0.6 && step % 200 === 199) {
      discs.forEach(d => { d.x += (rand() - 0.5) * d.r * 0.3; d.y += (rand() - 0.5) * d.r * 0.3; });
    }
  }
  // Finish clean: shrink until no pair overlaps.
  for (let k = 0; k < 200; k++) {
    discs.forEach(d => { d.r = d.rel * scale / 2; }); pinEdges(discs, s);
    let ok = true;
    for (let i = 0; i < discs.length && ok; i++)
      for (let j = i + 1; j < discs.length; j++) {
        const a = discs[i], b = discs[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + b.r + g - 1e-6) { ok = false; break; }
      }
    if (ok) break;
    scale *= 0.999;
  }
  discs.forEach(d => { d.r = d.rel * scale / 2; }); pinEdges(discs, s);
  return { discs, scale };
}

// How much of the page the discs cover, sampled on a fine grid.
function coverage(discs, s, n = 240) {
  let hit = 0, tot = 0;
  const ny = Math.round(n * s.H / s.W);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < n; ix++) {
    const x = (ix + 0.5) * s.W / n, y = (iy + 0.5) * s.H / ny;
    tot++;
    for (const d of discs) if ((x - d.x) ** 2 + (y - d.y) ** 2 <= d.r * d.r) { hit++; break; }
  }
  return hit / tot;
}

