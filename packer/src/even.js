// Evenness tools and two more packings. Millimetres throughout.

// The white between discs, split fairly: every point of the page belongs to the disc
// whose EDGE is nearest (not its centre). The borders of these cells run down the
// middle of the white, so two discs whose cells touch are neighbours.
// Returns, per neighbour pair, the white between them; and the biggest hole.
function measure(discs, s, res = 1) {
  const nx = Math.ceil(s.W / res), ny = Math.ceil(s.H / res);
  const own = new Int16Array(nx * ny);
  let hole = 0;
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const x = (ix + 0.5) * res, y = (iy + 0.5) * res;
    let best = 1e9, bi = -1;
    for (let i = 0; i < discs.length; i++) {
      const d = discs[i], e = Math.hypot(x - d.x, y - d.y) - d.r;
      if (e < best) { best = e; bi = i; }
    }
    own[iy * nx + ix] = bi;
    // A hole: white whose nearest disc edge is far. Points near the page edge count less,
    // since a hole cut by the page edge is not a hole on the cover.
    if (best > 0) {
      const toEdge = Math.min(x, y, s.W - x, s.H - y);
      hole = Math.max(hole, Math.min(best, toEdge + best * 0.5));
    }
  }
  const pairs = new Set();
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const a = own[iy * nx + ix];
    if (ix + 1 < nx) { const b = own[iy * nx + ix + 1]; if (a !== b) pairs.add(a < b ? a * 1000 + b : b * 1000 + a); }
    if (iy + 1 < ny) { const b = own[(iy + 1) * nx + ix]; if (a !== b) pairs.add(a < b ? a * 1000 + b : b * 1000 + a); }
  }
  const gaps = [], links = [];
  pairs.forEach(p => {
    const i = Math.floor(p / 1000), j = p % 1000, a = discs[i], b = discs[j];
    const g = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
    links.push([i, j]);
    // A pair whose gap lies off the page doesn't show; skip it in the score.
    const mx = (a.x * b.r + b.x * a.r) / (a.r + b.r), my = (a.y * b.r + b.y * a.r) / (a.r + b.r);
    if (mx > 0 && mx < s.W && my > 0 && my < s.H) gaps.push(g);
  });
  const mean = gaps.reduce((t, g) => t + g, 0) / gaps.length;
  const sd = Math.sqrt(gaps.reduce((t, g) => t + (g - mean) ** 2, 0) / gaps.length);
  return { links, gaps, mean, sd, cv: sd / mean, hole: 2 * hole };
}

function clampAll(discs, s) {
  discs.forEach(d => {
    const b = bounds(d.r, s, d);
    d.x = Math.min(b.x1, Math.max(b.x0, d.x));
    d.y = Math.min(b.y1, Math.max(b.y0, d.y));
  });
}

function separate(discs, g) {          // hard rule: never closer than the gap
  for (let i = 0; i < discs.length; i++) for (let j = i + 1; j < discs.length; j++) {
    const a = discs[i], b = discs[j];
    let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1e-6;
    const over = a.r + b.r + g - dist;
    if (over <= 0) continue;
    const wa = b.r * b.r / (a.r * a.r + b.r * b.r), wb = 1 - wa;
    a.x -= dx / dist * over * wa; a.y -= dy / dist * over * wa;
    b.x += dx / dist * over * wb; b.y += dy / dist * over * wb;
  }
}

// EVEN GAPS. Start from a packing; tie every pair of neighbours with a spring whose
// rest length leaves the same white between them. Springs push AND pull, so wide
// gaps close and tight ones open. The discs then grow together until the smallest
// white reaches the gap; the springs keep the white equal while they grow.
function evenGaps(start, s, rounds = 40) {
  const discs = start.discs.map(d => ({ ...d }));
  let scale = start.scale;
  const setR = () => discs.forEach(d => { d.r = d.rel * scale / 2; });
  for (let round = 0; round < rounds; round++) {
    setR();
    const m = measure(discs, s, 2);
    const target = Math.max(s.gap, m.mean);
    for (let it = 0; it < 30; it++) {
      for (const [i, j] of m.links) {
        const a = discs[i], b = discs[j];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1e-6;
        const err = dist - (a.r + b.r + target);           // + too far, − too close
        const k = 0.15 * err;
        const wa = b.r * b.r / (a.r * a.r + b.r * b.r), wb = 1 - wa;
        a.x += dx / dist * k * wa; a.y += dy / dist * k * wa;
        b.x -= dx / dist * k * wb; b.y -= dy / dist * k * wb;
      }
      separate(discs, s.gap); clampAll(discs, s); pinEdges(discs, s);
    }
    // Grow while the closest pair still has more white than the gap.
    let minGap = 1e9;
    for (let i = 0; i < discs.length; i++) for (let j = i + 1; j < discs.length; j++) {
      const a = discs[i], b = discs[j];
      minGap = Math.min(minGap, Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r);
    }
    if (minGap > s.gap * 1.02) scale *= 1 + Math.min(0.02, (minGap - s.gap) / (4 * scale));
  }
  setR(); separate(discs, s.gap);
  return { discs, scale };
}

// Where the biggest hole is: the white point farthest from every disc edge
// (points cut by the page edge count less, as in measure()).
function biggestHole(discs, s, res = 2) {
  let best = -1, bx = 0, by = 0;
  for (let y = res / 2; y < s.H; y += res) for (let x = res / 2; x < s.W; x += res) {
    let e = 1e9;
    for (const d of discs) e = Math.min(e, Math.hypot(x - d.x, y - d.y) - d.r);
    if (e <= 0) continue;
    const toEdge = Math.min(x, y, s.W - x, s.H - y), v = Math.min(e, toEdge + e * 0.5);
    if (v > best) { best = v; bx = x; by = y; }
  }
  return { x: bx, y: by, d: 2 * best };
}
