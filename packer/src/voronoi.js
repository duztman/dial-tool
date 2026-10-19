// VORONOI. Millimetres throughout.
// Every point of the page belongs to the disc whose EDGE is nearest: that gives each
// disc a cell, like a Voronoi diagram but measured from the edges, so a big disc gets
// a big cell. The border between two discs runs down the middle of the white.
// Each disc moves to the middle of its cell (the point farthest from the cell's
// border), then all discs grow together until the closest pair is at the gap.
// Repeated, the white between neighbours evens out.

// Where a disc's centre must stay so that it touches a side (or sticks out
// by the bleed). bleed 0: the disc's edge lies on the page edge.
function wallPos(r, s, d) { return bounds(r, s, d); }

// CENTRE IN CELLS, with the page edge as a neighbour that wants no white.
// The border between two discs runs down the middle of the white, half the gap
// from each. The page edge's border is put half a gap BEYOND the edge, so a disc
// whose cell reaches the edge settles with its edge on the page edge: tangent.
// No disc is pinned; which discs touch the edge is decided by the cells.
function relax(start, s, rounds = 30, res = Math.max(s.W, s.H) / 120) {
  const discs = start.discs.map(d => ({ ...d }));
  let scale = start.scale;
  const nx = Math.ceil(s.W / res), ny = Math.ceil(s.H / res);
  const N = nx * ny, owner = new Int16Array(N), depthAt = new Float32Array(N);
  const clamp = d => {
    const w = wallPos(d.r, s, d);
    d.x = Math.min(w.x1, Math.max(w.x0, d.x)); d.y = Math.min(w.y1, Math.max(w.y0, d.y));
  };
  const closest = () => {
    let m = 1e9;
    for (let i = 0; i < discs.length; i++) for (let j = i + 1; j < discs.length; j++) {
      const a = discs[i], b = discs[j];
      m = Math.min(m, Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r);
    }
    return m;
  };
  let half = s.gap / 2;
  for (let round = 0; round < rounds; round++) {
    discs.forEach(d => { d.r = d.rel * scale / 2; clamp(d); }); pinEdges(discs, s);
    const deepest = new Float32Array(discs.length).fill(-1);
    let wsum = 0, wn = 0;
    for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
      const x = (ix + 0.5) * res, y = (iy + 0.5) * res;
      let b1 = 1e9, b2 = 1e9, i1 = 0;
      for (let i = 0; i < discs.length; i++) {
        const d = discs[i], e = Math.hypot(x - d.x, y - d.y) - d.r;
        if (e < b1) { b2 = b1; b1 = e; i1 = i; } else if (e < b2) b2 = e;
      }
      // Bleed: the edge a disc may reach lies further out for it.
      // Bleed: the edge a disc may reach lies further out for it; a disc kept
      // off the sides sees the edge that much further in.
      const off = keepOff(discs[i1], s), out = off ? -off : 2 * s.bleed * discs[i1].r;
      const wall = Math.min(x, y, s.W - x, s.H - y) + out;
      const v = Math.min((b2 - b1) / 2, wall + half);
      const p = iy * nx + ix;
      owner[p] = i1; depthAt[p] = v;
      if (v > deepest[i1]) deepest[i1] = v;
      // On a border between two discs (b1 ≈ b2, both outside), that much white.
      if (b1 > 0 && b2 - b1 < res) { wsum += b1 + b2; wn++; }
    }
    if (wn) half = Math.max(s.gap / 2, 0.5 * wsum / wn / 2);
    const ax = new Float64Array(discs.length), ay = new Float64Array(discs.length), an = new Float64Array(discs.length);
    for (let p = 0; p < N; p++) {
      const i = owner[p];
      if (depthAt[p] >= deepest[i] * 0.9) { ax[i] += (p % nx + 0.5) * res; ay[i] += (Math.floor(p / nx) + 0.5) * res; an[i]++; }
    }
    discs.forEach((d, i) => {
      if (!an[i]) return;
      d.x += 0.6 * (ax[i] / an[i] - d.x); d.y += 0.6 * (ay[i] / an[i] - d.y);
      // Fades out over the first half, so the cells settle the rest freely.
      sortPull(d, s, 0.08 * Math.max(0, 1 - round / (rounds / 2))); clamp(d);
    });
    separate(discs, s.gap); discs.forEach(clamp); pinEdges(discs, s);
    const m = closest();
    if (m > s.gap * 1.01) scale *= 1 + Math.min(0.015, (m - s.gap) / (4 * scale));
    else if (m < s.gap * 0.99) scale *= 0.998;
  }
  // Finish: a disc within a gap of the edge is put on it; no pair closer than the gap.
  const snap = d => {
    const w = wallPos(d.r, s, d), t = s.gap;
    if (d.x - w.x0 < t) d.x = w.x0; if (w.x1 - d.x < t) d.x = w.x1;
    if (d.y - w.y0 < t) d.y = w.y0; if (w.y1 - d.y < t) d.y = w.y1;
  };
  for (let k = 0; k < 400; k++) {
    discs.forEach(d => { d.r = d.rel * scale / 2; clamp(d); snap(d); }); pinEdges(discs, s);
    if (closest() >= s.gap - 1e-4) break;
    separate(discs, s.gap); scale *= 0.9995;
  }
  discs.forEach(d => { d.r = d.rel * scale / 2; });
  return { discs, scale };
}
