// marks.mjs — where a leader line can leave a dial without crossing anything printed (#93, page 06).
// Okay, 14 Oct 2026 (r4): a dot sits on the thing it names; lines move at 90°, never cross, never pass through content.
// The tool's own SVG export is the truth (rings that give way leave gaps, so counting angles is not enough): each
// ring's path is painted into a bitmap, cut into its separate marks, and for every mark the rows a horizontal line
// can leave it by are scored by how much other ink they cross on their way out of the dial.
//   import { dial_marks } from "./marks.mjs";  const M = await dial_marks(browser, svgFile, idsByRing)
export async function dial_marks(browser, svgFile, ids, o = {}) {
  const PX = o.px ?? 20;                                 // bitmap pixels a millimetre of the dial
  const page = await browser.newPage();
  const svg = (await import("fs")).readFileSync(svgFile, "utf8");
  await page.setContent(svg);
  const res = await page.evaluate(([ids, PX, o]) => {
    const vb = document.querySelector("svg").viewBox.baseVal, S = vb.width, N = Math.round(S * PX), C = S / 2;
    const paths = [...document.querySelectorAll("path[id]")];
    const bits = {};
    for (const p of paths) {
      const cv = new OffscreenCanvas(N, N), g = cv.getContext("2d");
      g.setTransform(PX, 0, 0, PX, C * PX, C * PX); g.fill(new Path2D(p.getAttribute("d")));
      const a = g.getImageData(0, 0, N, N).data, b = new Uint8Array(N * N);
      for (let i = 0; i < N * N; i++) b[i] = a[i * 4 + 3] > 100 ? 1 : 0;
      bits[p.id] = b;
    }
    const xy = (i, j) => [i / PX - C, j / PX - C];
    // the ink a line must not cross: everything printed except flat grounds (plate, bands, the bezel's colour)
    const GROUND = new Set(["plate", "band", "bezel-colour-1", "bezel-colour-2", "bezel-edge"]);
    const ink = new Uint8Array(N * N), owner = new Int16Array(N * N).fill(-1);
    paths.forEach((p, k) => { if (!GROUND.has(p.id)) { const b = bits[p.id]; for (let i = 0; i < N * N; i++) if (b[i]) { ink[i] = 1; owner[i] = k; } } });
    const out = {};
    for (const [ring, list] of Object.entries(ids)) {
      const b = new Uint8Array(N * N); for (const id of list) { const s = bits[id]; for (let i = 0; i < N * N; i++) if (s[i]) b[i] = 1; }
      // separate marks: pixels joined within 0.5 mm (so a two-digit numeral is one mark)
      const lab = new Int32Array(N * N).fill(-1), R = Math.round(0.5 * PX), marks = [];
      for (let s = 0; s < N * N; s++) {
        if (!b[s] || lab[s] >= 0) continue;
        const m = marks.length, st = [s]; lab[s] = m; const px = [];
        while (st.length) {
          const q = st.pop(); px.push(q); const qi = q % N, qj = (q / N) | 0;
          for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
            const i = qi + di, j = qj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
            const t = j * N + i; if (b[t] && lab[t] < 0) { lab[t] = m; st.push(t); }
          }
        }
        marks.push(px);
      }
      const big = marks.length === 1;                      // a whole band: one mark round the dial
      const cands = [];
      marks.forEach((px, m) => {
        let i0 = N, i1 = 0, j0 = N, j1 = 0;
        for (const q of px) { const i = q % N, j = (q / N) | 0; i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
        const cx = (i0 + i1) / 2 - C * PX;
        const sides = big ? ["L", "R"] : Math.abs(cx) < 0.3 * PX ? ["L", "R"] : [cx < 0 ? "L" : "R"];
        const h = j1 - j0, step = Math.max(1, Math.round(PX * 0.1));
        for (let j = j0 + Math.ceil(h * (big ? 0 : 0.25)); j <= j1 - Math.ceil(h * (big ? 0 : 0.25)); j += step) for (const side of sides) {
          // walk in from the label's side to the first pixel of this mark
          let hit = -1;
          if (side === "L") { for (let i = 0; i < N; i++) if (lab[j * N + i] === m) { hit = i; break; } }
          else { for (let i = N - 1; i >= 0; i--) if (lab[j * N + i] === m) { hit = i; break; } }
          if (hit < 0) continue;
          // the mark must be solid around the dot (not a hairline grazed at its tip)
          let solid = 0; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const t = (j + dj) * N + hit + (side === "L" ? 2 : -2) + di; if (lab[t] === m) solid++; }
          if (solid < (o.solid ?? 15)) continue;
          // the way out: ink crossed (other marks, other rings, hands), counted in pixels; leave a 0.25 mm clear lane
          const lane = Math.round((o.lane ?? 0.25) * PX); let cross = 0;
          const from = side === "L" ? 0 : hit + 1, to = side === "L" ? hit : N;
          for (let i = from; i < to; i++) for (let dj = -lane; dj <= lane; dj++) { const t = (j + dj) * N + i; if (ink[t] && lab[t] !== m) cross++; }
          const [x, y] = xy(hit + (side === "L" ? 1 : -1) * 0.15 * PX, j);
          cands.push({ mark: m, side, x, y, cross });
        }
      });
      out[ring] = cands;
    }
    return { size: S, out };
  }, [ids, PX, { solid: o.solid, lane: o.lane }]);
  await page.close();
  return res;
}
