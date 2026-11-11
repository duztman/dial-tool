// svg3d-core.mjs — the 3D trial as LINE ART in SVG (the Engineer idiom, round 48). Runs in the page; svg3d.mjs drives it from node.
//
// How a drawing is made from the meshes:
//  1. every visible mesh (not the table, the contact shadow or the crystal) gives its triangles in world space;
//  2. an edge is drawn when it is a SILHOUETTE (its two triangles face opposite ways from the camera — the outline of a
//     part), a CREASE (the two triangles meet at more than `creaseDeg` — a chamfer, a scallop, a marker's step) or a
//     BOUNDARY (one triangle only: where a lathe's open end meets the next part — the seam under the bezel);
//  3. HIDDEN LINES go: the scene is rendered once to a depth buffer, each edge is sampled every ~2 px of screen and a sample
//     is kept when it is no deeper than the buffer there (the farthest of its 3×3 neighbours, plus a tolerance in mm —
//     a grazing face's own depth steps inside one pixel, and the neighbourhood keeps that from cutting the edge);
//  4. the visible stretches become polylines (consecutive segments chained at shared ends) in two weights:
//     silhouettes heavy, creases and boundaries light — the EdgePass's two weights (round 36), now as vectors.
//
// Nothing is merged across faces: a drawing of N parts is N parts' lines. Preview quality (Okay, 9 Nov 2026: "just for preview").
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

async function exportOnce(w3d, opt = {}) {
  // STAGES (round 80): the drawing is long work on the page's one thread, and while it runs the page can show nothing new. Before each
  // stage the core calls `opt.onStage(name, k, of)` and waits for it — the page uses the wait to put the stage's name on the screen.
  // Every stage leaves the renderer as it found it, so a frame may be drawn in between. Without `onStage` nothing waits
  const STAGES = ["Shapes", "Depth", "Lines", "Marks", "Shadows", "Glare", "Tones", "Writing"], stage = async (name) => { if (opt.onStage) await opt.onStage(name, STAGES.indexOf(name) + 1, STAGES.length); };
  const { scene, camera, renderer } = w3d;
  const o = Object.assign({ creaseDeg: 32, tolMm: 0.06, tolRel: 0.0001, tolSlope: 1.5, bridge: 2, stepPx: 2, depthScale: 2, heavy: 2.0, light: 1.0, inkHex: "#1a1a1a", inkMode: "shaded", paper: "#ffffff", rounding: 2 }, opt);
  scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
  const canvas = renderer.domElement, Wpx = canvas.clientWidth, Hpx = canvas.clientHeight;

  await stage("Shapes");
  // ── 1 · the triangles, by mesh ──
  const skip = (m) => { const mat = [].concat(m.userData.photo ?? m.material)[0]; return !mat || mat.transmission > 0 || (mat.isMeshBasicMaterial && mat.transparent) || m.geometry.type === "PlaneGeometry"; };
  const meshes = [], crystals = []; scene.traverseVisible((m) => { if (!m.isMesh) return; const mat = [].concat(m.userData.photo ?? m.material)[0]; if (!skip(m)) meshes.push(m); else if (mat?.transmission > 0) crystals.push(m); });
  const lined = meshes.concat(crystals);      // the crystal draws its own silhouette (the dome's edge from a low view) but hides nothing: it stays out of the depth buffer
  const camPos = camera.getWorldPosition(new THREE.Vector3());
  const P = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), E1 = new THREE.Vector3(), E2 = new THREE.Vector3();
  const edges = [];      // [ax, ay, az, bx, by, bz, kind, owners]  kind 0 heavy · 1 light; owners: the ids of the triangles touching either end (the edge's own faces and their neighbours)
  let triCount = 0; const base = new Map();      // mesh → the id of its first triangle (ids count on through `lined`, in the order the ID render draws them)
  for (let mi = 0; mi < lined.length; mi++) {
    const m = lined[mi], g = m.geometry, pos = g.attributes.position, idx = g.index, M = m.matrixWorld;
    const n = idx ? idx.count : pos.count, T = n / 3; base.set(m, triCount + 1); const b0 = triCount + 1; triCount += T;      // id 0 is "nothing"
    // world positions, once; a vertex KEY (its position to a thousandth of a mm) so strips that own their vertices still share edges
    const world = new Float64Array(pos.count * 3), key = new Array(pos.count);
    for (let i = 0; i < pos.count; i++) { P.fromBufferAttribute(pos, i).applyMatrix4(M); world[i * 3] = P.x; world[i * 3 + 1] = P.y; world[i * 3 + 2] = P.z; key[i] = `${Math.round(P.x * 1000)},${Math.round(P.y * 1000)},${Math.round(P.z * 1000)}`; }
    const nrm = new Float64Array(T * 3), front = new Uint8Array(T), tri = new Int32Array(T * 3);
    for (let t = 0; t < T; t++) { const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2; tri[t * 3] = a; tri[t * 3 + 1] = b; tri[t * 3 + 2] = c;
      A.fromArray(world, a * 3); B.fromArray(world, b * 3); C.fromArray(world, c * 3); E1.subVectors(B, A); E2.subVectors(C, A); N.crossVectors(E1, E2);
      if (N.lengthSq() < 1e-14) { nrm[t * 3] = NaN; continue; } N.normalize(); nrm[t * 3] = N.x; nrm[t * 3 + 1] = N.y; nrm[t * 3 + 2] = N.z;
      P.addVectors(A, B).add(C).multiplyScalar(1 / 3).sub(camPos); front[t] = N.dot(P) < 0 ? 1 : 0; }
    // the edges of this mesh: key → [triangle, triangle]
    const map = new Map(), star = new Map();      // star: vertex key → the triangles at that vertex
    for (let t = 0; t < T; t++) { if (Number.isNaN(nrm[t * 3])) continue; for (let e = 0; e < 3; e++) { const i = tri[t * 3 + e], j = tri[t * 3 + (e + 1) % 3]; const st = star.get(key[i]); if (st) st.push(b0 + t); else star.set(key[i], [b0 + t]); if (key[i] === key[j]) continue; const k = key[i] < key[j] ? key[i] + "|" + key[j] : key[j] + "|" + key[i];
      const r = map.get(k); if (r) r.push(t); else map.set(k, [i, j, t]); } }
    const cosC = Math.cos(o.creaseDeg * Math.PI / 180);
    for (const r of map.values()) { const [i, j, t1, t2, t3] = r; if (t3 !== undefined) continue;      // a non-manifold edge (three faces): skip
      let kind = -1;
      if (t2 === undefined) kind = 1;                                                                        // boundary: light
      else if (front[t1] !== front[t2]) kind = mi < meshes.length ? 0 : 1;                                   // silhouette: heavy (the crystal's light)
      else { const d = nrm[t1 * 3] * nrm[t2 * 3] + nrm[t1 * 3 + 1] * nrm[t2 * 3 + 1] + nrm[t1 * 3 + 2] * nrm[t2 * 3 + 2]; if (d < cosC) { kind = 1; if (o.debugMesh === mi) { (o._dih ??= []).push(Math.round(Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI)); (o._mid ??= []).push([((world[i * 3] + world[j * 3]) / 2).toFixed(2), ((world[i * 3 + 1] + world[j * 3 + 1]) / 2).toFixed(2), ((world[i * 3 + 2] + world[j * 3 + 2]) / 2).toFixed(2), Math.round(Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI)]); } } }   // crease: light
      if (kind >= 0) edges.push([world[i * 3], world[i * 3 + 1], world[i * 3 + 2], world[j * 3], world[j * 3 + 1], world[j * 3 + 2], kind, new Set([...star.get(key[i]), ...star.get(key[j])]), mi, t2 === undefined]); }      // the last flag: a BOUNDARY edge (one face)
  }

  await stage("Depth");
  // ── 2 · the depth buffer: the scene once more, in depth only, at `depthScale` × the canvas ──
  const DW = Math.round(Wpx * o.depthScale), DH = Math.round(Hpx * o.depthScale);
  const target = new THREE.WebGLRenderTarget(DW, DH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  const hidden = []; scene.traverseVisible((m) => { if (m.isMesh && skip(m)) { m.visible = false; hidden.push(m); } });
  const saved = { bg: scene.background, over: scene.overrideMaterial, target: renderer.getRenderTarget(), tone: renderer.toneMapping, auto: renderer.autoClear };
  scene.background = null; scene.overrideMaterial = depthMat; renderer.toneMapping = THREE.NoToneMapping; renderer.autoClear = true;
  renderer.setRenderTarget(target); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, camera);
  const px = new Uint8Array(DW * DH * 4); renderer.readRenderTargetPixels(target, 0, 0, DW, DH, px);
  // the ID buffer: every triangle in its own colour (its id in 24 bits), so a sample can tell "this pixel is my own face" from
  // "something else is in front" — a face's own depth steps inside a pixel where it grazes the view, and no depth tolerance tells those apart
  const idMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: "attribute float tid; varying float vT; void main() { vT = tid; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying float vT; void main() { float t = floor(vT + 0.5); float r = floor(t / 65536.0), g = floor((t - r * 65536.0) / 256.0), b = t - r * 65536.0 - g * 256.0; gl_FragColor = vec4(r / 255.0, g / 255.0, b / 255.0, 1.0); }" });
  const swapped = []; for (const m of meshes) { const g0 = m.geometry, g1 = g0.index ? g0.toNonIndexed() : g0.clone(), T = g1.attributes.position.count / 3, tid = new Float32Array(T * 3), b0 = base.get(m);
    for (let t = 0; t < T; t++) tid[t * 3] = tid[t * 3 + 1] = tid[t * 3 + 2] = b0 + t; g1.setAttribute("tid", new THREE.BufferAttribute(tid, 1)); m.geometry = g1; swapped.push([m, g0, g1]); }      // the groups stay: a mesh with a material ARRAY draws only its groups, even under an override material — cleared, the bracelet vanished from the ID pass (round 51)
  scene.overrideMaterial = idMat; renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  const ip = new Uint8Array(DW * DH * 4); renderer.readRenderTargetPixels(target, 0, 0, DW, DH, ip);
  const ids = new Uint32Array(DW * DH); for (let i = 0; i < DW * DH; i++) ids[i] = ip[i * 4] * 65536 + ip[i * 4 + 1] * 256 + ip[i * 4 + 2];
  for (const [m, g0, g1] of swapped) { m.geometry = g0; g1.dispose(); } idMat.dispose();
  renderer.setRenderTarget(saved.target); scene.background = saved.bg; scene.overrideMaterial = saved.over; renderer.toneMapping = saved.tone; renderer.autoClear = saved.auto; for (const m of hidden) m.visible = true; target.dispose(); depthMat.dispose();
  const near = camera.near, far = camera.far;
  const depth = new Float32Array(DW * DH);      // the view depth (mm in front of the camera) at each pixel; the clear colour (white) unpacks to the far plane
  // three r170's packDepthToRGBA: r = floor(d·256)/255, g and b the next bytes (×256/255), a the finest as a plain fraction — so
  // d = r·(255/256) + g·(255/256)/256 + b·(255/256)/65536 + a/16777216 with the channels as 0…1 (packing.glsl.js, UnpackFactors4)
  for (let i = 0; i < DW * DH; i++) { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], a = px[i * 4 + 3];
    if (r === 255 && g === 255 && b === 255 && a === 255) { depth[i] = Infinity; continue; }      // the clear colour: nothing there
    const d = r / 256 + g / 65536 + b / 16777216 + a / 255 / 16777216; depth[i] = -(near * far) / ((far - near) * d - far); }
  // the farthest of a pixel's 3×3 neighbours: a grazing face's own depth steps inside a pixel; the neighbourhood keeps that from culling its own edge
  // visible: the pixel is one of the edge's own faces (or a face at its ends), or the sample is no deeper than what's there, by a tight tolerance
  // — the tolerance grows with the buffer's own slope there (how much the depth changes to the next pixel, background
  // neighbours ignored, capped at `tolSlope` mm): a face seen edge-on steps whole millimetres inside one pixel and must not
  // cut its own line, while a flat top (a numeral's cap over its 0.3 mm step) stays tight
  const slopeAt = (x, y, k) => { const d = depth[k]; let g = 0; for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + ox, yy = y + oy; if (xx < 0 || yy < 0 || xx >= DW || yy >= DH) continue; const v = depth[yy * DW + xx]; if (v === Infinity || d === Infinity) continue; const a = Math.abs(v - d); if (a > g) g = a; } return Math.min(g, o.tolSlope); };
  // which mesh a triangle id belongs to (the ids run mesh by mesh, in `lined` order)
  const starts = lined.map((m) => base.get(m)), meshOf = (id) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= id) lo = mid; else hi = mid - 1; } return id >= starts[0] ? lo : -1; };
  const seen = (dx, dy, vz, owners, mi = -1) => { if (!(dx >= 0 && dy >= 0 && dx < DW && dy < DH)) return false; const k = dy * DW + dx; if (owners && owners.has(ids[k])) return true;
    const slope = mi >= 0 && meshOf(ids[k]) === mi ? slopeAt(dx, dy, k) : 0;      // the slope allowance is for a face grazing its OWN mesh; another part in front gets no such mercy (round 58: the bezel's seat leaked under the ring)
    return vz <= depth[k] + o.tolMm + o.tolRel * vz + slope; };

  await stage("Lines");
  // ── 3 · hidden lines: sample each edge in screen space, keep what the buffer does not cover ──
  const proj = (x, y, z, out) => { P.set(x, y, z).applyMatrix4(camera.matrixWorldInverse); const vz = -P.z; P.applyMatrix4(camera.projectionMatrix); out[0] = (P.x + 1) / 2 * Wpx; out[1] = (1 - P.y) / 2 * Hpx; out[2] = vz; return out; };
  const a2 = [0, 0, 0], b2 = [0, 0, 0], segs = [[], []]; let kept = 0, tested = 0;
  for (const [ax, ay, az, bx, by, bz, kind, owners, mi, bnd] of edges) {
    proj(ax, ay, az, a2); proj(bx, by, bz, b2); if (a2[2] <= near || b2[2] <= near) continue;
    const L = Math.hypot(b2[0] - a2[0], b2[1] - a2[1]), n = Math.max(2, Math.ceil(L / o.stepPx) + 1); tested++;
    // a BOUNDARY edge (round 60) is drawn only where the picture actually breaks across it: the depth steps (another part, or the
    // background) or the mesh changes, 2.5 px to either side. Inside one continuous surface — the case top's sector meeting the lug's
    // patch with different sampling — the edge has no neighbour in the data but no edge in the world, and no line. Decided ONCE per
    // edge by the majority of five probes (round 61: per sample, a z-fighting seam flipped it into dots). The flat set-in rings (the
    // plate, the insert) draw no boundary at all: the part they sit in draws its own edge there
    let bndOK = true; if (bnd) { const gt = lined[mi].geometry.type; if (gt === "RingGeometry" || gt === "CircleGeometry") bndOK = false; else { const ex = b2[0] - a2[0], ey = b2[1] - a2[1], L2 = L || 1, px = -ey / L2 * 2.5, py = ex / L2 * 2.5; let yes = 0, tot = 0;
      for (let q = 0; q < 5; q++) { const u = (q + 0.5) / 5, x = a2[0] + ex * u, y = a2[1] + ey * u, vz = a2[2] + (b2[2] - a2[2]) * u; const k1 = Math.round((Hpx - (y + py)) * o.depthScale) * DW + Math.round((x + px) * o.depthScale), k2 = Math.round((Hpx - (y - py)) * o.depthScale) * DW + Math.round((x - px) * o.depthScale);
        if (k1 < 0 || k2 < 0 || k1 >= DW * DH || k2 >= DW * DH) continue; tot++; const d1 = depth[k1], d2 = depth[k2]; if (d1 === Infinity || d2 === Infinity || Math.abs(d1 - d2) > 0.12 + 0.002 * vz || meshOf(ids[k1]) !== meshOf(ids[k2])) yes++; }
      bndOK = tot === 0 || yes * 2 >= tot; } }
    let run = null, gap = 0; const flush = () => { if (run) { segs[kind].push(run); kept++; run = null; } gap = 0; };
    for (let s = 0; s < n; s++) { const u = s / (n - 1), x = a2[0] + (b2[0] - a2[0]) * u, y = a2[1] + (b2[1] - a2[1]) * u, vz = a2[2] + (b2[2] - a2[2]) * u;      // depth interpolated linearly: a hair off for a long edge in perspective, under the tolerance here
      const dx = Math.round(x * o.depthScale), dy = Math.round((Hpx - y) * o.depthScale);      // the buffer's rows run bottom-up
      const vis = seen(dx, dy, vz, owners, mi) && (!bnd || bndOK);
      if (vis) { if (!run) { run = [x, y]; run.mi = mi; } run[2] = x; run[3] = y; gap = 0; } else if (run && ++gap <= o.bridge) { /* a hidden sample or two inside a run: where two parts touch (links in their valley) the test flips sample by sample; bridge it */ } else flush(); }
    flush(); }

  // ── 3b · TONES as shapes, cut in geometry. A tone is a FIELD (a number at each vertex, from the surface normal and the eye)
  // and a list of INTERVALS of that field, each a fill. The field is linear enough over a triangle to cut it along the interval
  // bounds (marching triangles), so each piece is one tone. Pieces are culled at their centre against the depth buffer and drawn
  // back to front (a painter's sort), paper-tone pieces too — they are what hides a deeper part's darks (round 48's link slivers).
  // Same-tone neighbours are NOT merged (Illustrator's Pathfinder does that; a union library would, later); each piece is stroked
  // in its own fill, 0.4 px, so the seams between neighbours don't show as hairlines.
  //  · METAL (round 44's toon bands): h = reflect(eye, n) · world-up — bright above 0.45 (steel mirroring the light overhead) =
  //    paper, dark below −0.15 (mirroring the table), middle between.
  //  · CRYSTAL (round 46's glint): the same h in a band 0.72…0.80 = paper at 42 %; a RIM where the eye grazes it,
  //    (1 − n·v)^5 > 0.35 = paper at 30 %. Front faces only, drawn over everything else, as the toon draws glass.
  const UP = new THREE.Vector3(0, 1, 0), pieces = [], glass = [];
  const sa = (90 - w3d.S.from) * Math.PI / 180, sr = w3d.S.rise * Math.PI / 180, SUN = new THREE.Vector3(Math.cos(sa) * Math.cos(sr), Math.sin(sr), -Math.sin(sa) * Math.cos(sr)).normalize();      // toward the sun, as render() sets it
  // the toon's five light steps (round 44: `steps(5, 0.1)` sampled at n·l·0.5 + 0.5, nearest): 0.10 · 0.40 · 0.62 · 0.82 · 1.00, with
  // the cuts at n·l = −0.6 · −0.2 · 0.2 · 0.6. A metal piece's tone = band factor (1.45 · 0.85 · 0.3, as the toon multiplies) × step,
  // scaled so bright-and-lit is paper, then to sRGB — 15 greys
  // the toon's five light steps (round 44: `steps(5, 0.1)` sampled at n·l·0.5 + 0.5, nearest): 0.10 · 0.40 · 0.62 · 0.82 · 1.00, with
  // the cuts at n·l = −0.6 · −0.2 · 0.2 · 0.6. A piece's tone is the toon's own colour at that step: for a METAL its albedo at 60 %
  // × the band factor (1.45 · 0.85 · 0.3) × the step — steel comes out mid-grey, as in the Toon style — and ONLY the brightest tone
  // (bright band, full light) is paper: white is for highlights (Okay, 9 Nov 2026: "white is only reserved for highlights and white
  // bits on dial"). Every other part (dial plate, markers, hands, insert, leather, holes) is its own colour × the step
  const STEPS = [0.1, 0.4, 0.62, 0.82, 1.0], NL = [-Infinity, -0.6, -0.2, 0.2, 0.6, Infinity], BAND = [[0.45, Infinity, 1.45], [-0.15, 0.45, 0.85], [-Infinity, -0.15, 0.3]];
  // the HIGHLIGHT is the dark room's (round 37): paper only where the steel mirrors the key panel (high at the upper left, a cone of
  // `keyDeg`) or the tall strip at the right (`stripDeg`) — the dark room is what makes steel grey in the Photo style, and its two
  // panels are its only whites (Okay, 9 Nov 2026: "pure whites only small areas"). hl = how far inside the nearer cone, > 0 inside
  // the drawing's metal (round 100; Okay: "Engineer lost all darkest daerks"): a drawing is ink on paper and wants a deeper dark than Toon — its grades run from 0.6 × (base − 0.2) of the metal's colour (0.18 at the slider's 0.5, as before round 99) to 0.6 × 1.65, evenly (0.18 · 0.47 · 0.76 · 0.99)
  const roomT = 27 / (o.keyDeg ?? 18);      // round 98: a metal is paper-white only where it mirrors a light of the ROOM brighter than this — the Highlight slider sets it (18 → 1.5: a key or a strip, not a card; a larger number, a lower bar, more white)
  const KEY = new THREE.Vector3(-55, 55, -35).normalize(), STRIP = new THREE.Vector3(75, 20, 10).normalize(), cosK = Math.cos((o.keyDeg ?? 18) * Math.PI / 180), cosS = Math.cos((o.stripDeg ?? 9) * Math.PI / 180);
  const hex = (c, k) => "#" + c.clone().multiplyScalar(k).getHexString();      // linear × k, then to sRGB (Color converts on getHexString)
  const metalSpec = (c) => { const ivs = [{ cuts: [[2, 0, Infinity]], fill: o.paper }];
    if (o.steps === false) for (const [lo, hi, mul] of BAND) ivs.push({ cuts: [[0, lo, hi], [2, -Infinity, 0]], fill: hex(c, 0.6 * mul) });
    else for (const [lo, hi, mul] of BAND) for (let i = 0; i < 5; i++) ivs.push({ cuts: [[0, lo, hi], [1, NL[i], NL[i + 1]], [2, -Infinity, 0]], fill: hex(c, 0.6 * mul * STEPS[i]) });
    return { fields: ["h", "nl", "hl"], ivs }; };
  const flatSpec = (c) => ({ fields: ["nl"], ivs: o.steps === false ? [{ cuts: [], fill: hex(c, 1) }] : STEPS.map((st, i) => ({ cuts: [[0, NL[i], NL[i + 1]]], fill: hex(c, st) })) });
  const SC = window.SCENE, plateHex = SC?.items?.find((it) => it.role === "plate")?.f ?? "#ffffff";
  const colourOf = (mat) => { if (mat.map) return new THREE.Color(mat.metalness > 0 ? (SC?.insert?.top ?? "#101010") : plateHex); return mat.color; };      // pictures (the insert, the plate): their ground colour
  const TONES = { crystal: { fields: ["h", "rim"], ivs: [{ cuts: [[0, 0.72, 0.8]], fill: o.paper, opacity: 0.42 }, { cuts: [[1, 0.35, Infinity]], fill: o.paper, opacity: 0.3 }], frontOnly: true, out: glass } };
  if (o.bands !== false) {
    const nm = new THREE.Matrix3(), V = new THREE.Vector3(), R = new THREE.Vector3(), tmp = [], tmp2 = [];
    const clip = (poly, fi, t, above) => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ina = above ? a.f[fi] >= t : a.f[fi] < t, inb = above ? b.f[fi] >= t : b.f[fi] < t;
      if (ina) out.push(a); if (ina !== inb) { const u = (t - a.f[fi]) / (b.f[fi] - a.f[fi]); const f = a.f.map((v, k) => k === fi ? t : v + (b.f[k] - v) * u); out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, f }); } } return out; };
    const cut = (m, spec) => {
      const g = m.geometry, pos = g.attributes.position, nor = g.attributes.normal, idx = g.index, M = m.matrixWorld; if (!nor) return; nm.getNormalMatrix(M);
      const n = idx ? idx.count : pos.count, T = n / 3, wp = new Float64Array(pos.count * 3), fi = (name) => spec.fields.indexOf(name), iH = fi("h"), iR = fi("rim"), iL = fi("nl"), iK = fi("hl");
      // the fields at a point, from its normal and the eye
      const fieldsAt = (px, py, pz, out) => { V.set(camPos.x - px, camPos.y - py, camPos.z - pz).normalize(); if (N.dot(V) < 0) N.negate();      // DoubleSide: three turns the normal to face the eye
        if (iH >= 0 || iK >= 0) { R.copy(V).negate(); R.addScaledVector(N, -2 * N.dot(R)); if (iH >= 0) out[iH] = R.dot(UP); if (iK >= 0) out[iK] = window.ROOM3D.lum(R.x, R.y, R.z) - roomT; }      // round 98: the room's light in the mirror direction, over the Highlight's threshold      // reflect(−v, n): · up for the bands, · the panels for the highlight
        if (iR >= 0) out[iR] = Math.pow(1 - Math.max(N.dot(V), 0), 5);
        if (iL >= 0) out[iL] = N.dot(SUN); return out; };
      const wn = new Float64Array(pos.count * 3);      // world positions and world vertex normals
      for (let i = 0; i < pos.count; i++) { P.fromBufferAttribute(pos, i).applyMatrix4(M); wp[i * 3] = P.x; wp[i * 3 + 1] = P.y; wp[i * 3 + 2] = P.z; N.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); wn[i * 3] = N.x; wn[i * 3 + 1] = N.y; wn[i * 3 + 2] = N.z; }
      const cosN = Math.cos((o.normalDeg ?? 25) * Math.PI / 180), FN = new THREE.Vector3();
      const b0 = base.get(m) ?? 0, own = new Set(), mIdx = lined.indexOf(m);
      // is this mesh wound OUTWARD (as sweep() guarantees; lathes and extrusions mostly are)? Σ face-normal · (face centre − mesh centre),
      // sweep()'s own test. If so, its back faces are dropped: a closed solid's far skin, or a ring's underside lying on the case top
      // (round 58: it z-fought the plate and showed as a sawtooth). An inward or open mesh keeps every face, as before
      let outward = false; { let cx = 0, cy = 0, cz = 0; for (let i = 0; i < pos.count; i++) { cx += wp[i * 3]; cy += wp[i * 3 + 1]; cz += wp[i * 3 + 2]; } cx /= pos.count; cy /= pos.count; cz /= pos.count; let score = 0;
        for (let t = 0; t < T; t++) { const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2; A.fromArray(wp, a * 3); B.fromArray(wp, b * 3); C.fromArray(wp, c * 3); E1.subVectors(B, A); E2.subVectors(C, A); N.crossVectors(E1, E2); P.addVectors(A, B).add(C).multiplyScalar(1 / 3); score += N.x * (P.x - cx) + N.y * (P.y - cy) + N.z * (P.z - cz); }
        outward = score > 0 && !spec.frontOnly && m.geometry.type !== "CircleGeometry" && m.geometry.type !== "RingGeometry"; }
      for (let t = 0; t < T; t++) { const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        A.fromArray(wp, a * 3); B.fromArray(wp, b * 3); C.fromArray(wp, c * 3); E1.subVectors(B, A); E2.subVectors(C, A); N.crossVectors(E1, E2); if (N.lengthSq() < 1e-14) continue;
        own.clear(); if (b0) own.add(b0 + t);
        if (spec.frontOnly || outward) { P.addVectors(A, B).add(C).multiplyScalar(1 / 3).sub(camPos); if (N.dot(P) > 0) continue; }      // the crystal: its front skin only, as the toon's FrontSide; an outward-wound solid: its front faces only
        // the corners' fields: from the vertex normal, unless it strays past `normalDeg` from the face's — at a sharp turn the sweep
        // smooths normals along its path (a scallop's rim, round 58) and an in-between normal at one vertex fans spikes through every cut
        FN.copy(N).normalize(); const corners = [a, b, c].map((v) => { N.set(wn[v * 3], wn[v * 3 + 1], wn[v * 3 + 2]); if (Math.abs(N.dot(FN)) < cosN) N.copy(FN); return { x: wp[v * 3], y: wp[v * 3 + 1], z: wp[v * 3 + 2], n: [N.x, N.y, N.z] }; });
        splitAndCut(corners, 0, t); }
      // a triangle large on screen is SPLIT (at its edges' midpoints, to four) before cutting, down to `maxPx2` screen pixels or `maxSplit`
      // levels: the painter's sort goes by a piece's centre, and a huge fan triangle (the case top, the dial plate) has its centre far
      // from where a small piece of another part overlaps it, so the small piece came out on top (round 58's sawtooth at the bezel's foot).
      // Smaller pieces also give the tone cuts truer curves. Normals interpolate to the new corners; fields are read there
      function splitAndCut(cs, level, t) {
        const sp = cs.map((c) => { proj(c.x, c.y, c.z, tmp); return [tmp[0], tmp[1], tmp[2]]; }); if (sp.some((q) => q[2] <= near)) return;
        const area = Math.abs((sp[1][0] - sp[0][0]) * (sp[2][1] - sp[0][1]) - (sp[2][0] - sp[0][0]) * (sp[1][1] - sp[0][1])) / 2;
        if (area > (o.maxPx2 ?? 60) && level < (o.maxSplit ?? 4)) { const mid = (p, q) => { N.set(p.n[0] + q.n[0], p.n[1] + q.n[1], p.n[2] + q.n[2]).normalize(); return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2, n: [N.x, N.y, N.z] }; };
          const [p0, p1, p2] = cs, m01 = mid(p0, p1), m12 = mid(p1, p2), m20 = mid(p2, p0); for (const t3 of [[p0, m01, m20], [m01, p1, m12], [m20, m12, p2], [m01, m12, m20]]) splitAndCut(t3, level + 1, t); return; }
        const tri = cs.map((c) => { N.set(c.n[0], c.n[1], c.n[2]); return { x: c.x, y: c.y, z: c.z, f: fieldsAt(c.x, c.y, c.z, new Array(spec.fields.length)) }; });
        for (const iv of spec.ivs) { let poly = tri; for (const [k, lo, hi] of iv.cuts) { if (lo > -Infinity) poly = clip(poly, k, lo, true); if (hi < Infinity && poly.length) poly = clip(poly, k, hi, false); } if (poly.length < 3) continue;
          let cx = 0, cy = 0, cz = 0; for (const p of poly) { cx += p.x; cy += p.y; cz += p.z; } cx /= poly.length; cy /= poly.length; cz /= poly.length;
          proj(cx, cy, cz, tmp); if (tmp[2] <= near) continue;
          // culled only when its centre AND the points halfway to each corner are all hidden (round 52's white wedges); the painter's sort covers whatever stays
          let vis = seen(Math.round(tmp[0] * o.depthScale), Math.round((Hpx - tmp[1]) * o.depthScale), tmp[2], b0 ? own : null, mIdx);
          for (let q = 0; !vis && q < poly.length; q++) { const p = poly[q]; proj(cx + (p.x - cx) * 0.5, cy + (p.y - cy) * 0.5, cz + (p.z - cz) * 0.5, tmp2); vis = tmp2[2] > near && seen(Math.round(tmp2[0] * o.depthScale), Math.round((Hpx - tmp2[1]) * o.depthScale), tmp2[2], b0 ? own : null, mIdx); }
          if (!vis) continue;
          const pts = poly.map((p) => { proj(p.x, p.y, p.z, tmp); return [tmp[0], tmp[1]]; }); const fill = o.debugPieces ? `hsl(${(mIdx * 47) % 360} 80% ${40 + level * 12}%)` : iv.fill;
          (spec.out ?? pieces).push({ z: tmp[2], key: fill + "|" + (iv.opacity ?? 1), fill, opacity: iv.opacity ?? 1, pts, tid: b0 ? b0 + t : 0 }); } } };
    if (o.tones === "cut" || !window.ImageTracer) for (const m of meshes) { const mat = [].concat(m.userData.photo ?? m.material)[0]; cut(m, mat.userData?.metal ? metalSpec(mat.color) : flatSpec(colourOf(mat))); }      // the cut tones: only when asked (round 59: traced by default)
    // the crystal's glint pieces (rounds 49–63) are gone: the glare is drawn in 3f
    pieces.sort((p, q) => q.z - p.z); glass.sort((p, q) => q.z - p.z); }

  await stage("Marks");
  // ── 3c · DECALS: what the model paints as pictures, drawn as shapes. The dial plate's date disc and numeral come from the
  // dial data's own paths (scene.js, dial mm, y up); the insert's marks are the ones insertRing() paints — minute dots, the
  // five-marks, the numerals (as real text, placed by a local affine fit of the projection), the triangle and its lume dot.
  // Each decal lies on its plate; it is culled like a piece (its plate's triangles count as its own) and drawn right after
  // that plate's pieces, before the rest, so markers and hands still cover it
  const decals = { plate: [], insert: [] }, SC2 = window.SCENE;
  const plateMesh = meshes.find((m) => m.userData.plate) ?? meshes.find((m) => m.geometry.type === "CircleGeometry" && [].concat(m.userData.photo ?? m.material)[0].map), discMeshes = meshes.filter((m) => m.userData.plateDisc), insertMesh = meshes.find((m) => m.geometry.type === "RingGeometry" && [].concat(m.userData.photo ?? m.material)[0].map);
  const idsOf = (m) => { const set = new Set(), b0 = base.get(m), T = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; for (let t = 0; t < T; t++) set.add(b0 + t); return set; };
  const placeDecal = (m, own, polys, fill, opacity, out, text) => {      // polys: [[x, y], …] rings in the plate's local plane; the first is the outline, the rest holes
    const M = m.matrixWorld, world = polys.map((ring) => ring.map(([x, y]) => P.set(x, y, 0).applyMatrix4(M).toArray()));
    const ring0 = world[0]; let cx = 0, cy = 0, cz = 0; for (const [x, y, z] of ring0) { cx += x; cy += y; cz += z; } cx /= ring0.length; cy /= ring0.length; cz /= ring0.length;
    const t = [0, 0, 0]; proj(cx, cy, cz, t); if (t[2] <= near) return; let vis = seen(Math.round(t[0] * o.depthScale), Math.round((Hpx - t[1]) * o.depthScale), t[2], own);
    for (let q = 0; !vis && q < ring0.length; q += Math.max(1, ring0.length >> 3)) { const [x, y, z] = ring0[q]; proj((cx + x) / 2, (cy + y) / 2, (cz + z) / 2, t); vis = seen(Math.round(t[0] * o.depthScale), Math.round((Hpx - t[1]) * o.depthScale), t[2], own); }
    if (!vis) return; const pts = world.map((ring) => ring.map(([x, y, z]) => { proj(x, y, z, t); return [t[0], t[1]]; }));
    out.push({ pts, fill, opacity, text }); };
  if (o.decals !== false && plateMesh && SC2) { const own = idsOf(plateMesh), loader = new SVGLoader(); for (const m of discMeshes) for (const t of idsOf(m)) own.add(t);      // a window's disc is seen through its hole: its decals show where the disc does
    for (const it of SC2.items) { if (!["date disc", "date number"].includes(it.role)) continue;
      for (const p of loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${it.p}"/></svg>`).paths) for (const sh of SVGLoader.createShapes(p)) { const e = sh.extractPoints(10); placeDecal(plateMesh, own, [e.shape, ...e.holes].map((r) => r.map((v) => [v.x, v.y])), it.f, it.a ?? 1, decals.plate); } } }
  if (o.decals !== false && insertMesh) { const own = idsOf(insertMesh), { innerRadius: ri, outerRadius: ro } = insertMesh.geometry.parameters, at = (m, r) => [Math.sin(m * 6 * Math.PI / 180) * r, Math.cos(m * 6 * Math.PI / 180) * r], ink = "#e8e5dc";
    const circle = (x, y, r, n = 16) => Array.from({ length: n }, (_, i) => [x + r * Math.cos(i / n * 2 * Math.PI), y + r * Math.sin(i / n * 2 * Math.PI)]);
    const bar = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * w / 2, ny = dx / l * w / 2; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; };
    for (let m = 1; m < 60; m++) { if (m % 10 === 0) continue; const [X, Y] = at(m, (ri + ro) / 2 + 0.25); placeDecal(insertMesh, own, [circle(X, Y, m % 5 ? 0.09 : 0.16)], ink, 1, decals.insert); }
    for (let m = 5; m < 60; m += 10) placeDecal(insertMesh, own, [bar(at(m, ri + 0.45), at(m, ro - 0.35), 0.28)], ink, 1, decals.insert);
    { const [X, Y] = at(0, ro - 0.35); placeDecal(insertMesh, own, [[[X, Y], [-1.35, ri + 0.5], [1.35, ri + 0.5]]], ink, 1, decals.insert); placeDecal(insertMesh, own, [circle(0, (ri + ro) / 2 + 0.1, 0.42)], "#d8ebc8", 1, decals.insert); }
    // the numerals: text. The glyph's frame in the insert's plane (baseline along u, up along v, as insertRing() rotates the canvas) is
    // carried to the screen by projecting its origin and one mm along each axis — an affine fit of the perspective, exact enough over 2 mm
    const M = insertMesh.matrixWorld, t0 = [0, 0, 0], t1 = [0, 0, 0], t2 = [0, 0, 0];
    for (let m = 10; m < 60; m += 10) { const [X, Y] = at(m, (ri + ro) / 2 + 0.05), th = (m * 6 + (m >= 20 && m <= 40 ? 180 : 0)) * Math.PI / 180, u = [Math.cos(th) * 0.82, -Math.sin(th) * 0.82], v = [Math.sin(th), Math.cos(th)];
      const p0 = P.set(X, Y, 0).applyMatrix4(M).toArray(), pu = P.set(X + u[0], Y + u[1], 0).applyMatrix4(M).toArray(), pv = P.set(X + v[0], Y + v[1], 0).applyMatrix4(M).toArray();
      proj(...p0, t0); if (t0[2] <= near || !seen(Math.round(t0[0] * o.depthScale), Math.round((Hpx - t0[1]) * o.depthScale), t0[2], own)) continue; proj(...pu, t1); proj(...pv, t2);
      decals.insert.push({ text: String(m), fill: ink, matrix: [t1[0] - t0[0], t1[1] - t0[1], -(t2[0] - t0[0]), -(t2[1] - t0[1]), t0[0], t0[1]], size: 1.75, dy: 0.08 }); } }
  const plateIds = plateMesh ? idsOf(plateMesh) : null; if (plateIds) for (const m of discMeshes) for (const t of idsOf(m)) plateIds.add(t); const insertIds = insertMesh ? idsOf(insertMesh) : null;

  await stage("Shadows");
  // ── 3e · GROUND and SHADOWS (round 63). The ground is the scene's backdrop colour under everything (the table is flat and lit
  // full, so its tone is its colour). The sun's CAST SHADOW: the scene twice in a plain white Lambert — with the sun's shadow and
  // without — the difference is the shadow, traced as one region drawn over everything at `shadowOpacity`. The CONTACT shadow (the
  // soft sprite under the caseback): rendered alone, its darkness cut in three steps, traced, drawn under the watch
  const groundOn = o.ground !== "paper" && window.ImageTracer, floorHex = groundOn && w3d.floor ? "#" + w3d.floor().toString(16).padStart(6, "0") : o.paper;
  let shadowSvg = "", contactSvg = "";
  if (groundOn && o.shadows !== false && w3d.sun) {
    const TS = o.traceScale ?? 2, TW = Math.round(Wpx * TS), TH = Math.round(Hpx * TS), tgt = new THREE.WebGLRenderTarget(TW, TH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    const sv = { bg: scene.background, env: scene.environment, over: scene.overrideMaterial, target: renderer.getRenderTarget(), tone: renderer.toneMapping, auto: renderer.autoClear, sunI: w3d.sun.intensity, fillI: w3d.fill?.intensity ?? 0, cast: w3d.sun.castShadow };
    const grab = () => { const px = new Uint8Array(TW * TH * 4); renderer.readRenderTargetPixels(tgt, 0, 0, TW, TH, px); return px; };
    scene.background = null; scene.environment = null; renderer.toneMapping = THREE.NoToneMapping; renderer.autoClear = true; renderer.setRenderTarget(tgt); renderer.setClearColor(0xffffff, 1);
    // the shadow: white Lambert, the sun alone (its strength 1), the contact sprite and the crystal hidden, the ground kept
    const lam = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }); scene.overrideMaterial = lam; w3d.sun.intensity = 1; if (w3d.fill) w3d.fill.intensity = 0;
    const gnd = w3d.ground?.(), spr = w3d.contact?.(), wasG = gnd?.visible, wasS = spr?.visible; if (gnd) gnd.visible = true;      // the Technical style hides the table and the contact sprite; the passes need them
    const hid = []; scene.traverseVisible((m) => { if (m.isMesh && skip(m) && m !== gnd) { m.visible = false; hid.push(m); } });
    w3d.sun.castShadow = true; renderer.clear(); renderer.render(scene, camera); const withS = grab();
    w3d.sun.castShadow = false; renderer.clear(); renderer.render(scene, camera); const noS = grab();
    w3d.sun.castShadow = sv.cast; scene.overrideMaterial = sv.over; lam.dispose(); for (const m of hid) m.visible = true;
    // in shadow: the sun's light there drops by more than half — relative, since three's lights are physical and a white Lambert under one sun is dim
    const mask = { width: TW, height: TH, data: new Uint8ClampedArray(TW * TH * 4) };
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const i = ((TH - 1 - y) * TW + x) * 4, j = (y * TW + x) * 4, d = (noS[i] + noS[i + 1] + noS[i + 2]) - (withS[i] + withS[i + 1] + withS[i + 2]); const lit = noS[i] + noS[i + 1] + noS[i + 2], v = lit > 30 && d > lit * (o.shadowCut ?? 0.5) ? 0 : 255; mask.data[j] = mask.data[j + 1] = mask.data[j + 2] = v; mask.data[j + 3] = 255; }
    const bw = [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }], topt = { pal: bw, colorsampling: 0, numberofcolors: 2, colorquantcycles: 1, ltres: 1, qtres: 1, pathomit: o.pathomit ?? 6, rightangleenhance: false, roundcoords: 2, layering: 0, blurradius: 0, strokewidth: 0 }, popt = { scale: 1 / TS, roundcoords: 2, lcpr: 0, qcpr: 0, strokewidth: 0, linefilter: false, desc: false };
    const tracePaths = (img, opts, lnum, attrs) => { const td = window.ImageTracer.imagedataToTracedata(img, opts); let out = ""; for (let pth = 0; pth < td.layers[lnum].length; pth++) { if (td.layers[lnum][pth].isholepath) continue; out += window.ImageTracer.svgpathstring(td, lnum, pth, popt).replace(/fill="[^"]*" stroke="[^"]*" stroke-width="[^"]*" opacity="[^"]*"/, attrs) + "\n"; } return out; };
    { let dark = 0, lit = 0, sw = 0; for (let i = 0; i < TW * TH; i++) { if (mask.data[i * 4] === 0) dark++; lit += noS[i * 4]; sw += withS[i * 4]; } console.log("shadow mask: dark px", dark, "mean noShadow", (lit / (TW * TH)).toFixed(1), "mean withShadow", (sw / (TW * TH)).toFixed(1), "shadowMap", renderer.shadowMap.enabled, "sun shadow map", !!w3d.sun.shadow.map); }
    shadowSvg = tracePaths(mask, Object.assign({}, topt, { pathomit: o.shadowOmit ?? 24 }), 0, `fill="#000000" opacity="${o.shadowOpacity ?? 0.35}"`); console.log("shadow paths", shadowSvg.length, "contact", !!w3d.contact?.());
    // the contact shadow: the sprite alone on white, its darkness in three steps
    // the drawn styles give the sprite a flat stand-in (no gradient): the pass needs its photo material
    const sprite = spr; if (sprite) { sprite.visible = true; const sm = sprite.material; sprite.material = sprite.userData.photo ?? sm; const shown = []; scene.traverseVisible((m) => { if (m.isMesh && m !== sprite) { m.visible = false; shown.push(m); } }); renderer.clear(); renderer.render(scene, camera); const cp = grab(); sprite.material = sm; for (const m of shown) m.visible = true; { let mn = 255, cnt = 0; for (let i = 0; i < TW * TH; i++) { if (cp[i * 4] < mn) mn = cp[i * 4]; if (cp[i * 4] < 240) cnt++; } if (o.debugShadow) { const cv = document.createElement("canvas"); cv.width = TW; cv.height = TH; const cx = cv.getContext("2d"), im = cx.createImageData(TW, TH); for (let y = 0; y < TH; y++) im.data.set(cp.subarray((TH - 1 - y) * TW * 4, (TH - y) * TW * 4), y * TW * 4); for (let i = 3; i < im.data.length; i += 4) im.data[i] = 255; cx.putImageData(im, 0, 0); o._contactUrl = cv.toDataURL(); const im2 = cx.createImageData(TW, TH); for (let y = 0; y < TH; y++) im2.data.set(mask.data.subarray(y * TW * 4, (y + 1) * TW * 4), y * TW * 4); cx.putImageData(im2, 0, 0); o._maskUrl = cv.toDataURL(); }
      console.log("contact pass: min", mn, "px<240", cnt, "sprite visible", sprite.visible, "mat", sprite.material.type, sprite.material.transparent, sprite.material.opacity); }
      const img = { width: TW, height: TH, data: new Uint8ClampedArray(TW * TH * 4) }; for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const i = ((TH - 1 - y) * TW + x) * 4, j = (y * TW + x) * 4, dark = 1 - cp[i] / 255, lv = dark > 0.42 ? 0 : dark > 0.28 ? 85 : dark > 0.12 ? 170 : 255; img.data[j] = img.data[j + 1] = img.data[j + 2] = lv; img.data[j + 3] = 255; }
      const pal4 = [0, 85, 170, 255].map((v) => ({ r: v, g: v, b: v, a: 255 })), o4 = Object.assign({}, topt, { pal: pal4, numberofcolors: 4 }), td = window.ImageTracer.imagedataToTracedata(img, o4);
      for (let l = 0; l < 3; l++) for (let pth = 0; pth < td.layers[l].length; pth++) { if (td.layers[l][pth].isholepath) continue; contactSvg += window.ImageTracer.svgpathstring(td, l, pth, popt).replace(/fill="[^"]*" stroke="[^"]*" stroke-width="[^"]*" opacity="[^"]*"/, `fill="#000000" opacity="${(o.contactOpacity ?? 0.16).toFixed(2)}"`) + "\n"; } }      // three stacked layers: the darkest region is under all three
    if (gnd) gnd.visible = wasG; if (spr) spr.visible = wasS;
    renderer.setRenderTarget(sv.target); scene.background = sv.bg; scene.environment = sv.env; renderer.toneMapping = sv.tone; renderer.autoClear = sv.auto; w3d.sun.intensity = sv.sunI; if (w3d.fill) w3d.fill.intensity = sv.fillI; tgt.dispose(); }

  await stage("Glare");
  // ── 3f · the GLARE (rounds 64–65; Okay: "a closed shape of white, filled with a line drawing (tarama) style… a band shape").
  // The glare AREA is round 46's band: where the crystal's reflection rises between `glareLo` and `glareHi` (reflection · up,
  // 0.72…0.80) — on the nearly flat dome that cuts a curved stripe, or nothing. Rendered alone, traced, and drawn as a paper
  // shape at `glareVeil`, HATCHED with dense parallel paper lines (`hatchGap` px apart, at `hatchDeg`), clipped by the shape
  let glareSvg = ""; const ff = (v) => v.toFixed(2).replace(/\.?0+$/, "");
  if (crystals.length && window.ImageTracer && o.glare !== false) {
    const TS = o.traceScale ?? 2, TW = Math.round(Wpx * TS), TH = Math.round(Hpx * TS), G3 = window.GLARE3D;
    const gfrag = `uniform samplerCube room; uniform float f0, glareT; varying vec3 vN, vP; void main() { vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vP); if (dot(n, v) < 0.0) discard; vec3 r = reflect(-v, n); float back = (f0 + (1.0 - f0) * pow(1.0 - max(dot(n, v), 0.0), 5.0)) * dot(textureCube(room, r).rgb, vec3(0.2126, 0.7152, 0.0722)); float u = clamp((back - glareT) / glareT, 0.0, 1.0); gl_FragColor = vec4(back > glareT ? 1.0 : 0.0, u, 1.0, 1.0); }`;      // red: a glare — the glass mirrors a light of the room (round 96: the same patch as every look; the band is retired); green: how far over the threshold; blue: on the crystal at all
    const gvert = `varying vec3 vN, vP; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
    const gmat = new THREE.ShaderMaterial({ side: THREE.FrontSide, vertexShader: gvert, fragmentShader: gfrag, uniforms: { room: window.ROOM3D.tex, f0: { value: G3.f0 }, glareT: { value: G3.t } } });
    const tgt = new THREE.WebGLRenderTarget(TW, TH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    const sv = { bg: scene.background, target: renderer.getRenderTarget(), tone: renderer.toneMapping, auto: renderer.autoClear }, shown = [], swapped = [];
    scene.traverseVisible((m) => { if (m.isMesh && !crystals.includes(m)) { m.visible = false; shown.push(m); } }); for (const c of crystals) { swapped.push([c, c.material]); c.material = gmat; }
    scene.background = null; renderer.toneMapping = THREE.NoToneMapping; renderer.autoClear = true; renderer.setRenderTarget(tgt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
    const gp = new Uint8Array(TW * TH * 4); renderer.readRenderTargetPixels(tgt, 0, 0, TW, TH, gp);
    for (const [c, mat] of swapped) c.material = mat; for (const m of shown) m.visible = true; renderer.setRenderTarget(sv.target); scene.background = sv.bg; renderer.toneMapping = sv.tone; renderer.autoClear = sv.auto; tgt.dispose(); gmat.dispose();
    let lit = 0, x0 = TW, y0 = TH, x1 = 0, y1 = 0; const img = { width: TW, height: TH, data: new Uint8ClampedArray(TW * TH * 4) };
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const i = ((TH - 1 - y) * TW + x) * 4, j = (y * TW + x) * 4, on = gp[i] > 128; if (on) { lit++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } const v = on ? 0 : 255; img.data[j] = img.data[j + 1] = img.data[j + 2] = v; img.data[j + 3] = 255; }
    if (lit > 40) {
      const bw = [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }], td = window.ImageTracer.imagedataToTracedata(img, { pal: bw, colorsampling: 0, numberofcolors: 2, colorquantcycles: 1, ltres: 1, qtres: 1, pathomit: 12, rightangleenhance: false, roundcoords: 2, layering: 0, blurradius: 0, strokewidth: 0 });
      const popt = { scale: 1 / TS, roundcoords: 2, lcpr: 0, qcpr: 0, strokewidth: 0, linefilter: false, desc: false }; let maskD = "";
      for (let pth = 0; pth < td.layers[0].length; pth++) { if (td.layers[0][pth].isholepath) continue; const m = window.ImageTracer.svgpathstring(td, 0, pth, popt).match(/ d="([^"]*)"/); if (m) maskD += m[1] + " "; }
      // the glare is a flat faint patch of paper, the one Toon paints (round 96; Okay: "Engineer gets same reflection as toon, retire the rings"):
      // `GLARE.veil` is light added before the screen's curve; a drawing's opacity is after it, hence the power
      glareSvg = `<path fill="${o.paper}" opacity="${Math.pow(G3.veil, 1 / 2.2).toFixed(3)}" fill-rule="evenodd" d="${maskD}"/>`; } }

  await stage("Tones");
  // ── 3d · TONES TRACED (round 59; the default): instead of cutting triangles, the quantized toon is RENDERED — a small shader
  // paints every pixel its exact tone colour (the same formulas as 3b: bands × steps for metal, colour × step for the rest, paper
  // in the highlight cones), the GPU settles what hides what — and each tone's region is traced to a smooth outline (imagetracerjs,
  // with our palette, so every pixel snaps to a tone). Regions are continuous across a sweep's strips, there is no painter's sort,
  // and a scallop is one shape. Pixel-fitted at `traceScale` × the canvas, then smoothed; lines stay geometric
  let tracedSvg = "", tracedCount = 0;
  if (o.bands !== false && o.tones !== "cut" && window.ImageTracer) {
    const TS = o.traceScale ?? 2, TW = Math.round(Wpx * TS), TH = Math.round(Hpx * TS);
    const srgb = `vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }`;
    const frag = `uniform vec3 color, paper, key, strip, sun; uniform float metal, cosK, cosS, useSteps, roomT, rough, gBase; uniform samplerCube room; varying vec3 vN, vP; ${srgb}
      float roomLum(vec3 d, float r) { return dot(textureLod(room, d, r * 7.0).rgb, vec3(0.2126, 0.7152, 0.0722)); }      // round 98: the room, as every look reads it (ROOM_GLSL)
      void main() { vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; vec3 v = normalize(cameraPosition - vP); vec3 r = reflect(-v, n);
        float L = roomLum(r, rough), hl = L - roomT, nl = dot(n, sun);
        float st = useSteps > 0.5 ? (nl < -0.6 ? 0.1 : nl < -0.2 ? 0.4 : nl < 0.2 ? 0.62 : nl < 0.6 ? 0.82 : 1.0) : 1.0;
        vec3 c; if (metal > 0.5) { if (hl > 0.0) { gl_FragColor = vec4(paper, 1.0); return; } float mul = mix(gBase - 0.2, 1.65, L < 0.12 ? 0.0 : L < 0.45 ? 0.34 : L < 1.5 ? 0.67 : 1.0); c = color * 0.6 * mul * st; } else c = color * st;
        gl_FragColor = vec4(toSRGB(clamp(c, 0.0, 1.0)), 1.0); }`;
    const vert = `varying vec3 vN, vP; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
    const paperC = new THREE.Color(o.paper), palette = new Map(); const addPal = (hexs) => { palette.set(hexs, true); }; addPal(o.paper);
    const NONE = "#ff00ff"; addPal(NONE);      // the render's empty area: a sentinel no tone uses, so paper highlights are drawn and only emptiness is skipped (round 64: paper was skipped and the ground bled through every highlight)
    const toneMat = (c, metal, rough = 0.3) => new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: vert, fragmentShader: frag, uniforms: { room: window.ROOM3D.tex, gBase: window.GRADE3D.base, roomT: { value: roomT }, rough: { value: rough }, color: { value: c }, paper: { value: paperC }, key: { value: KEY }, strip: { value: STRIP }, sun: { value: SUN }, metal: { value: metal ? 1 : 0 }, cosK: { value: cosK }, cosS: { value: cosS }, useSteps: { value: o.steps === false ? 0 : 1 } } });
    const swap = []; for (const m of meshes) { const mat = [].concat(m.userData.photo ?? m.material)[0], metal = !!mat.userData?.metal, c = metal ? mat.color : colourOf(mat);
      swap.push([m, m.material]); m.material = toneMat(c, metal, mat.roughness ?? 0.3);
      const steps = o.steps === false ? [1] : STEPS; if (metal) for (const [, , mul] of BAND) for (const st of steps) addPal(hex(c, 0.6 * mul * st)); else for (const st of steps) addPal(hex(c, st)); }
    const tgt = new THREE.WebGLRenderTarget(TW, TH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    const sv = { bg: scene.background, target: renderer.getRenderTarget(), tone: renderer.toneMapping, auto: renderer.autoClear }; const hid = []; scene.traverseVisible((m) => { if (m.isMesh && skip(m)) { m.visible = false; hid.push(m); } });
    scene.background = null; renderer.toneMapping = THREE.NoToneMapping; renderer.autoClear = true; renderer.setRenderTarget(tgt); renderer.setClearColor(new THREE.Color(NONE), 1); renderer.clear(); renderer.render(scene, camera);
    const tp = new Uint8Array(TW * TH * 4); renderer.readRenderTargetPixels(tgt, 0, 0, TW, TH, tp);
    renderer.setRenderTarget(sv.target); scene.background = sv.bg; renderer.toneMapping = sv.tone; renderer.autoClear = sv.auto; for (const m of hid) m.visible = true; for (const [m, mat] of swap) { m.material.dispose(); m.material = mat; } tgt.dispose();
    const img = { width: TW, height: TH, data: new Uint8ClampedArray(TW * TH * 4) }; for (let y = 0; y < TH; y++) img.data.set(tp.subarray((TH - 1 - y) * TW * 4, (TH - y) * TW * 4), y * TW * 4);      // rows bottom-up → top-down
    const pal = [...palette.keys()].map((hx) => ({ r: parseInt(hx.slice(1, 3), 16), g: parseInt(hx.slice(3, 5), 16), b: parseInt(hx.slice(5, 7), 16), a: 255 }));
    const td = window.ImageTracer.imagedataToTracedata(img, { pal, colorsampling: 0, numberofcolors: pal.length, colorquantcycles: 1, ltres: o.ltres ?? 1, qtres: o.qtres ?? 1, pathomit: o.pathomit ?? 6, rightangleenhance: false, roundcoords: 2, layering: 0, blurradius: 0, strokewidth: 0 });
    // the paths, in CSS px: imagetracer's own path writer with scale 1/TS; a region stroked in its fill (0.4 px) against seams; the sentinel's layer (emptiness) is not drawn
    const paperIdx = [...palette.keys()].indexOf(NONE), opts = { scale: 1 / TS, roundcoords: 2, lcpr: 0, qcpr: 0, strokewidth: 0, linefilter: false, desc: false };
    for (let l = 0; l < td.layers.length; l++) { if (l === paperIdx) continue; const hx = [...palette.keys()][l]; for (let pth = 0; pth < td.layers[l].length; pth++) { if (td.layers[l][pth].isholepath) continue;
      let ps = window.ImageTracer.svgpathstring(td, l, pth, opts); ps = ps.replace(/fill="[^"]*" stroke="[^"]*" stroke-width="[^"]*" opacity="[^"]*"/, `fill="${hx}" stroke="${hx}" stroke-width="0.4"`); tracedSvg += ps + "\n"; tracedCount++; } } }


  await stage("Writing");
  // ── 4 · chain segments that meet at an end into polylines, then write the SVG ──
  const chain = (list) => { const q = (v) => Math.round(v * 20) / 20, k = (x, y) => q(x) + "," + q(y), byEnd = new Map(); const add = (key, i) => { const a = byEnd.get(key); if (a) a.push(i); else byEnd.set(key, [i]); };
    list.forEach((s, i) => { add(k(s[0], s[1]), i); add(k(s[2], s[3]), i); }); const used = new Uint8Array(list.length), out = [];
    const take = (key, from) => { const a = byEnd.get(key); if (!a) return -1; for (const i of a) if (!used[i] && i !== from) return i; return -1; };
    for (let i = 0; i < list.length; i++) { if (used[i]) continue; used[i] = 1; const s = list[i], pts = [[s[0], s[1]], [s[2], s[3]]];
      for (const dir of [1, -1]) { for (;;) { const end = dir === 1 ? pts[pts.length - 1] : pts[0], j = take(k(end[0], end[1]), -1); if (j < 0) break; used[j] = 1; const t = list[j], atStart = k(t[0], t[1]) === k(end[0], end[1]), nx = atStart ? [t[2], t[3]] : [t[0], t[1]]; if (dir === 1) pts.push(nx); else pts.unshift(nx); } }
      out.push(pts); } return out; };
  const f = (v) => v.toFixed(o.rounding).replace(/\.?0+$/, "");
  const pathOf = (polys) => polys.map((pts) => "M" + pts.map(([x, y], i) => (i ? "L" : "") + f(x) + " " + f(y)).join("")).join("");
  // the INK (round 57): "shaded" — each line in its part's own colour, darkened (silhouettes × inkHeavy, creases × inkLight in linear):
  // white numerals get light grey lines, the navy plate near-black, steel a dark grey; "black" — one ink for all
  const inkOf = (mi, k) => { if (o.ink === "black" || o.ink === undefined && o.inkMode === "black") return o.inkHex ?? "#1a1a1a"; const m = lined[mi], mat = [].concat(m.userData.photo ?? m.material)[0], c = mat.userData?.metal ? mat.color : (typeof colourOf === "function" ? colourOf(mat) : mat.color);
    return hex(c, k === 0 ? (o.inkHeavy ?? 0.22) : (o.inkLight ?? 0.4)); };
  const byInk = (list, k) => { const g = new Map(); for (const sg of list) { const key = inkOf(sg.mi, k); const a = g.get(key); if (a) a.push(sg); else g.set(key, [sg]); } return [...g].map(([ink, l]) => [ink, chain(l)]); };
  const heavyG = byInk(segs[0], 0), lightG = byInk(segs[1], 1), heavy = heavyG.flatMap(([, c]) => c), light = lightG.flatMap(([, c]) => c);
  if (o.debugBuffers) { const cv = document.createElement("canvas"); cv.width = DW; cv.height = DH; const cx = cv.getContext("2d"), im = cx.createImageData(DW, DH); let lo = Infinity, hi = -Infinity; for (const d of depth) if (d !== Infinity) { if (d < lo) lo = d; if (d > hi) hi = d; }
    for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) { const k = y * DW + x, j = ((DH - 1 - y) * DW + x) * 4, d = depth[k], v = d === Infinity ? 255 : Math.round((d - lo) / (hi - lo) * 220); im.data[j] = im.data[j + 1] = im.data[j + 2] = v; im.data[j + 3] = 255; }
    cx.putImageData(im, 0, 0); const depthUrl = cv.toDataURL(); for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) { const k = y * DW + x, j = ((DH - 1 - y) * DW + x) * 4, id = ids[k]; im.data[j] = (id * 97) & 255; im.data[j + 1] = (id * 193) & 255; im.data[j + 2] = (id * 71) & 255; } cx.putImageData(im, 0, 0); return { svg: "", stats: { lo, hi }, depthUrl, idUrl: cv.toDataURL() }; }
  if (o.debugMeshes) { const byM = new Map(); for (const sg of segs[0].concat(segs[1])) { const a = byM.get(sg.mi); if (a) a.push(sg); else byM.set(sg.mi, [sg]); }
    let dbg = ""; for (const [mi, list] of byM) dbg += `<path stroke="hsl(${(mi * 47) % 360} 90% 40%)" stroke-width="0.9" d="${pathOf(chain(list))}"><title>mesh ${mi} ${lined[mi].name || lined[mi].geometry.type}</title></path>\n`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wpx} ${Hpx}" width="${Wpx}" height="${Hpx}"><rect width="100%" height="100%" fill="#fff"/><g fill="none" stroke-linecap="round">${dbg}</g></svg>`, stats: { meshes: byM.size } }; }
  // the bands: back to front; a run of pieces of one tone becomes one path (nonzero fill), paper-tone pieces are not drawn
  // the tones: back to front; a run of pieces of one fill becomes one path (nonzero fill), stroked in its fill against seams
  const shapesOf = (list) => { let out = "", runs = 0, cur = null, d = ""; const flush = () => { if (cur && d) { const [fill, op] = cur.split("|"); out += `<path fill="${fill}" stroke="${fill}"${+op < 1 ? ` opacity="${op}"` : ""} d="${d}"/>\n`; runs++; } d = ""; };
    for (const p of list) { if (p.key !== cur) { flush(); cur = p.key; } d += "M" + p.pts.map(([x, y], i) => (i ? "L" : "") + f(x) + " " + f(y)).join("") + "Z"; } flush(); return [out, runs]; };
  const decalSvg = (list) => list.map((d) => d.text ? `<text transform="matrix(${d.matrix.map((v) => f(v)).join(" ")})" font-family="Helvetica Neue, Arial, sans-serif" font-weight="bold" font-size="${d.size}" text-anchor="middle" dominant-baseline="central" fill="${d.fill}" y="${d.dy}">${d.text}</text>`
    : `<path fill="${d.fill}" stroke="${d.fill}"${d.opacity < 1 ? ` opacity="${d.opacity}"` : ""} fill-rule="evenodd" d="${d.pts.map((ring) => "M" + ring.map(([x, y], i) => (i ? "L" : "") + f(x) + " " + f(y)).join("") + "Z").join("")}"/>`).join("\n");
  const onPlate = pieces.filter((p) => plateIds?.has(p.tid)), onInsert = pieces.filter((p) => insertIds?.has(p.tid)), rest = pieces.filter((p) => !plateIds?.has(p.tid) && !insertIds?.has(p.tid));
  const [bandSvg, runs] = tracedSvg ? [tracedSvg + decalSvg(decals.plate) + "\n" + decalSvg(decals.insert), tracedCount + decals.plate.length + decals.insert.length] : (() => { const parts = [shapesOf(onPlate), [decalSvg(decals.plate), decals.plate.length], shapesOf(onInsert), [decalSvg(decals.insert), decals.insert.length], shapesOf(rest)]; return [parts.map((p) => p[0]).join("\n"), parts.reduce((n, p) => n + p[1], 0)]; })(), [glassSvg, glassRuns] = shapesOf(glass);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wpx} ${Hpx}" width="${Wpx}" height="${Hpx}">
${groundOn && w3d.floor2?.() ? `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${floorHex}"/><stop offset="1" stop-color="${w3d.floor2()}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/>` : `<rect width="100%" height="100%" fill="${floorHex}"/>`}
<g id="contact">
${contactSvg}</g>
<g id="tones" stroke-width="0.4" stroke-linejoin="round">
${bandSvg}</g>
<g id="shadow">
${shadowSvg}</g>
<g id="creases" fill="none" stroke-width="${o.light}" stroke-linecap="round" stroke-linejoin="round">
${lightG.map(([ink, c]) => `<path stroke="${ink}" d="${pathOf(c)}"/>`).join("\n")}
</g>
<g id="silhouettes" fill="none" stroke-width="${o.heavy}" stroke-linecap="round" stroke-linejoin="round">
${heavyG.map(([ink, c]) => `<path stroke="${ink}" d="${pathOf(c)}"/>`).join("\n")}
</g>
<g id="glare">
${glareSvg}</g>
</svg>`;
  if (o._dbg) console.log(JSON.stringify(o._dbg.filter((_, i) => i % 40 === 0).slice(0, 60)));
  if (o.debugMesh !== undefined) { const m = lined[o.debugMesh]; m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; let nb = 0, nc = 0, ns = 0; for (const e of edges) if (e[8] === o.debugMesh) { if (e[9]) nb++; else if (e[6] === 0) ns++; else nc++; } console.log("mesh", o.debugMesh, m.geometry.type, m.geometry.attributes.position.count, "verts; bbox", bb.min.toArray().map((v) => v.toFixed(1)).join(","), "→", bb.max.toArray().map((v) => v.toFixed(1)).join(","), "edges: boundary", nb, "silhouette", ns, "crease", nc); }
  if (o._box) console.log("in box:", JSON.stringify(o._box));
  if (o.debugMesh !== undefined) { const m = lined[o.debugMesh], pa = m.geometry.attributes.position, seen2 = new Set(), rows = []; for (let i = 0; i < pa.count; i++) { if (Math.abs(pa.getX(i)) < 0.45) { const k = pa.getZ(i).toFixed(2) + "|" + pa.getY(i).toFixed(2); if (!seen2.has(k)) { seen2.add(k); rows.push([pa.getZ(i).toFixed(2), pa.getY(i).toFixed(2)]); } } } rows.sort((a, b) => a[0] - b[0]); console.log("profile near x=0 (local z, local y):", JSON.stringify(rows)); }
  if (o._mid) console.log("crease midpoints (world x,y,z, °):", JSON.stringify(o._mid.filter((m) => m[3] < 85).slice(0, 40)));
  if (o._dih) { const h = {}; for (const a of o._dih) h[a] = (h[a] || 0) + 1; console.log("dihedrals of mesh", o.debugMesh, JSON.stringify(h)); }
  if (o._contactUrl) return { svg, contactUrl: o._contactUrl, maskUrl: o._maskUrl, stats: {} };
  return { svg, stats: { meshes: meshes.length, triangles: triCount, edges: edges.length, tested, kept, polylines: heavy.length + light.length, pieces: pieces.length, paths: runs, glass: glass.length, glassPaths: glassRuns, traced: tracedCount, decals: decals.plate.length + decals.insert.length, size: Wpx + "×" + Hpx, depth: DW + "×" + DH } };
}

// ── 5 · MOTION (round 71; Okay: "a very low effort but identifiable camera movement in svg. Stopping camera renders?"): a
// stop-motion of `frames.n` stills, the camera swung `frames.sweep`° about the orbit's target (half each way, out and back),
// each still a group in one SVG, shown in turn by the SVG's own timing (`frames.hold` s a still). Illustrator shows them stacked
export async function exportSVG(w3d, opt = {}) {
  if (!opt.frames) return exportOnce(w3d, opt);
  const { camera, controls } = w3d, fr = Object.assign({ n: 8, sweep: 10, hold: 0.18 }, opt.frames), target = controls?.target ?? new THREE.Vector3();
  const p0 = camera.position.clone(), up = new THREE.Vector3(0, 1, 0), rel = p0.clone().sub(target), stills = []; let stats = null, head = null;
  const order = []; for (let i = 0; i < fr.n; i++) order.push(i); for (let i = fr.n - 2; i > 0; i--) order.push(i);      // out and back, the ends held once
  const uniq = [...new Set(order)];
  for (const i of uniq) { const a = (-0.5 + i / (fr.n - 1)) * fr.sweep * Math.PI / 180; camera.position.copy(rel).applyAxisAngle(up, a).add(target); camera.lookAt(target); camera.updateMatrixWorld(true); w3d.render?.();
    const r = await exportOnce(w3d, Object.assign({}, opt, { frames: undefined })); stats = r.stats; head ??= r.svg.match(/^[\s\S]*?<rect[^>]*\/>/)[0]; stills[i] = r.svg.replace(/^[\s\S]*?<rect[^>]*\/>/, "").replace(/<\/svg>\s*$/, ""); }
  camera.position.copy(p0); camera.lookAt(target); camera.updateMatrixWorld(true); w3d.render?.();
  const T = order.length * fr.hold, groups = uniq.map((i) => { const times = order.map((k, j) => (k === i ? 1 : 0)); return `<g id="still${i}" visibility="hidden">\n<animate attributeName="visibility" values="${times.map((v) => (v ? "visible" : "hidden")).join(";")};${times[0] ? "visible" : "hidden"}" keyTimes="${order.map((_, j) => (j / order.length).toFixed(4)).join(";")};1" calcMode="discrete" dur="${T.toFixed(2)}s" repeatCount="indefinite"/>\n${stills[i]}\n</g>`; });
  return { svg: head + "\n" + groups.join("\n") + "\n</svg>", stats: Object.assign({}, stats, { stills: uniq.length, seconds: T }) };
}
if (typeof window !== "undefined") window.svg3d = exportSVG;      // the page's Export pane calls it here; svg3d.mjs (node) inlines this file the same way

