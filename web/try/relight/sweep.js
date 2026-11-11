// sweep.js — the one builder most of the watch is made with: a section swept along a path, a finish per face (kb/system.md).
import * as THREE from "three";

// ── 2 · the builders ───────────────────────────────────────────────────────────────────────────────────────────────────
/** a SWEEP: `stations` is a list of sections (each the same count of [x, y, z] points); between two stations every edge of
 *  the section becomes a strip of quads, and `mats[e]` names the material of edge e — so one mesh can wear a brushed top
 *  and a polished chamfer. A closed section joins its last point to its first; closed ends get a fan cap (mats[n]) */
export function sweep(stations, mats, { closeSection = true, caps = false, crease = 40, hard = 25 } = {}) {
  const n = stations[0].length, S = stations.length, E = closeSection ? n : n - 1, g = new THREE.BufferGeometry(), v = [], uv = [], tan = [], idx = [], groups = [];
  // HARD STATIONS along the path (round 60): where the path turns by more than `hard`° at a station (a scallop's rim on the coin edge,
  // a lug tip's corner) the station is doubled — the quad before it and the quad after it get their own vertices — so the normals stay
  // apart and the turn shades as the edge it is. Smoothing ALONG the path had blended the land's normal with the scallop wall's at
  // every rim, and the toon's tones (and the SVG traced from them) fanned across the long triangles there
  const hardAt = new Uint8Array(S); if (hard > 0 && S > 2) { const cosH = Math.cos(hard * Math.PI / 180), a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let k = 1; k + 1 < S; k++) { let worst = 1; for (let i = 0; i < n; i++) { a.set(stations[k][i][0] - stations[k - 1][i][0], stations[k][i][1] - stations[k - 1][i][1], stations[k][i][2] - stations[k - 1][i][2]); b.set(stations[k + 1][i][0] - stations[k][i][0], stations[k + 1][i][1] - stations[k][i][1], stations[k + 1][i][2] - stations[k][i][2]);
      if (a.lengthSq() < 1e-12 || b.lengthSq() < 1e-12) continue; const d = a.normalize().dot(b.normalize()); if (d < worst) worst = d; } if (worst < cosH) hardAt[k] = 1; } }
  // TANGENTS: the brushed grain runs along the path, so every vertex gets the path's direction there (the station before to
  // the station after; w = 1 is the handedness). Without this attribute three.js builds the frame per pixel from screen-space
  // UV derivatives, which jumps per facet on a sweep — and the anisotropic reflection follows that frame, not the surface, so
  // whole faces mirrored the key light and went white (round 14). Lathes and plates never needed it: their derivatives are smooth
  const T = new THREE.Vector3(), last = new THREE.Vector3(1, 0, 0), tangentAt = (k, i) => { const a = stations[Math.max(0, k - 1)][i], b = stations[Math.min(S - 1, k + 1)][i];
    T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (T.lengthSq() > 1e-10) last.copy(T.normalize()); return last; };      // a pinched station (a link's end) keeps the last direction
  // EVERY STRIP OWNS ITS VERTICES: two faces meeting at a section point do not share it, so a corner stays a corner — shared
  // points averaged the normals across the edge and a slab shaded like the inside of a tube (round 16, "I can see inside the lug").
  // Along the path the normals stay smooth; across the section they are smoothed only where the bend is gentler than `crease`°
  const push = (k, i) => { const p = stations[k][i], t = tangentAt(k, i); v.push(...p); uv.push(k / (S - 1) * 4, i / n); tan.push(t.x, t.y, t.z, 1); return v.length / 3 - 1; };
  const at = [];      // at[e][k] = [vertex of point e, vertex of point e+1] in strip e at station k
  const at2 = [];      // at2[e][k]: at a hard station, the second copy of the point pair — the quad LEAVING the station uses it, the quad arriving keeps at[e][k]
  for (let e = 0; e < E; e++) { const e2 = (e + 1) % n, s0 = idx.length; at[e] = []; at2[e] = [];
    for (let k = 0; k < S; k++) { at[e][k] = [push(k, e), push(k, e2)]; at2[e][k] = hardAt[k] ? [push(k, e), push(k, e2)] : at[e][k]; }
    for (let k = 0; k + 1 < S; k++) { const [a, b] = at2[e][k], [c, d] = at[e][k + 1]; idx.push(a, c, b, b, c, d); }
    groups.push([s0, idx.length - s0, mats[e] ?? 0]); }
  if (caps) for (const [k, which] of [[0, 0], [S - 1, 1]]) { const s0 = idx.length, base = v.length / 3; for (let i = 0; i < n; i++) push(k, i);
    for (let i = 1; i + 1 < n; i++) idx.push(base, base + (which ? i + 1 : i), base + (which ? i : i + 1));
    groups.push([s0, idx.length - s0, mats[n] ?? 0]); }
  // FACES OUTWARD: a mirrored sweep (a lug on the other side) winds its triangles inward. The colour pass is DoubleSide and
  // doesn't care, but the AO pass (GTAOPass: MeshNormalMaterial, FrontSide) culls the near wall and takes its depth and
  // normals from the far wall inside the solid — the inside showed through the lug (round 16). Measure the winding
  // (do the faces point away from the part's centre?) and flip the order if not
  { let cx = 0, cy = 0, cz = 0; const nv = v.length / 3; for (let i = 0; i < v.length; i += 3) { cx += v[i]; cy += v[i + 1]; cz += v[i + 2]; } cx /= nv; cy /= nv; cz /= nv;
    let score = 0; for (let t = 0; t < idx.length; t += 3) { const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
      const ux = v[b] - v[a], uy = v[b + 1] - v[a + 1], uz = v[b + 2] - v[a + 2], wx = v[c] - v[a], wy = v[c + 1] - v[a + 1], wz = v[c + 2] - v[a + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;      // the face's normal, scaled by its area
      score += nx * ((v[a] + v[b] + v[c]) / 3 - cx) + ny * ((v[a + 1] + v[b + 1] + v[c + 1]) / 3 - cy) + nz * ((v[a + 2] + v[b + 2] + v[c + 2]) / 3 - cz); }
    if (score < 0) for (let t = 0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; } }
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("tangent", new THREE.Float32BufferAttribute(tan, 4));
  g.setIndex(idx); for (const [a, b, m] of groups) g.addGroup(a, b, m); g.computeVertexNormals();
  // the crease pass: where two strips meet at a gentle angle (a bean's arc, the band's belly) blend their normals back together
  const N = g.attributes.normal, A = new THREE.Vector3(), B = new THREE.Vector3(), cosC = Math.cos(crease * Math.PI / 180);
  for (let e = 0; e < E; e++) { const f = (e + 1) % n; if (!closeSection && f === E) break; if (!at[f]) continue;
    for (let k = 0; k < S; k++) for (const AT of [at, at2]) { const a = AT[e][k][1], b = AT[f][k][0]; A.fromBufferAttribute(N, a); B.fromBufferAttribute(N, b);
      if (A.dot(B) > cosC) { A.add(B).normalize(); N.setXYZ(a, A.x, A.y, A.z); N.setXYZ(b, A.x, A.y, A.z); } } }
  N.needsUpdate = true; return g;
}
