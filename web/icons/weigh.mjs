// icons/weigh.mjs — for look.py: draws each icon black on white at 2× and records, for every stroked line in it, the
// picture and the line's middle in screen dots. Input: a JSON list of { id, svg, w? } (w: widths to try, by the
// line's place in the svg). Mode "context": the icon's other parts stay drawn (crowding counts); otherwise each line
// is drawn alone. Output: <out>/<id>-<k>.png and <out>/lines.json
//
//   node icons/weigh.mjs icons/out/look.json icons/out/weigh context      (look.py runs this)
import { chromium } from "playwright";
import fs from "fs";
const [input, out, mode] = process.argv.slice(2);      // mode "context": the others stay drawn (density counts)
const items = JSON.parse(fs.readFileSync(input, "utf8"));
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 2 });
const lines = [];
for (const it of items) {
  await p.setContent(`<body style="margin:0;background:#fff"><div id="h" style="position:absolute;left:8px;top:8px;color:#000">${it.svg}</div></body>`);
  const els = await p.evaluate((W) => {
    const svg = document.querySelector("#h svg");
    if (!svg.getAttribute("width")) { const vb = svg.viewBox.baseVal; svg.setAttribute("width", vb.width); svg.setAttribute("height", vb.height); }
    [...svg.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse")].forEach((e, k) => { if (W && W[k] != null) e.style.strokeWidth = W[k]; });
    // paint everything black, then list the stroked shapes
    const all = [...svg.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse")];
    return all.map((e, k) => { const cs = getComputedStyle(e); return { k, stroked: cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0 && cs.display !== "none" && cs.opacity !== "0", w: parseFloat(cs.strokeWidth) }; });
  }, it.w || null);
  for (const e of els.filter((e) => e.stroked)) {
    const pts = await p.evaluate(([k, CTX]) => {
      const svg = document.querySelector("#h svg"), all = [...svg.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse")];
      const ctx = CTX;
      all.forEach((x, i) => { x.style.visibility = ctx || i === k ? "visible" : "hidden"; if (getComputedStyle(x).stroke !== "none") x.style.stroke = "#000"; if (getComputedStyle(x).fill !== "none") x.style.fill = "#000"; x.style.opacity = "1"; if (i === k && !ctx) x.style.fill = "none"; });
      if (!ctx) svg.querySelectorAll("text").forEach((t) => (t.style.visibility = "hidden"));
      const el = all[k], m = el.getScreenCTM(), L = el.getTotalLength(), n = Math.max(8, Math.round(L * 4));
      const scale = Math.hypot(m.a, m.b);
      // the path's own transform (e.g. rotate) is inside getScreenCTM; sample the centreline
      const P = [];
      for (let i = 0; i <= n; i++) { const q = el.getPointAtLength((L * i) / n); P.push([(m.a * q.x + m.c * q.y + m.e) * 2, (m.b * q.x + m.d * q.y + m.f) * 2]); }
      return { P, L: L * scale, closed: /Z\s*$/i.test(el.getAttribute("d") || "") || ["circle", "rect", "ellipse", "polygon"].includes(el.tagName), tag: el.tagName, scale };
    }, [e.k, mode === "context"]);
    const file = `${out}/${it.id}-${e.k}.png`;
    const box = await p.evaluate(() => { const r = document.querySelector("#h svg").getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
    await p.screenshot({ path: file, clip: { x: 0, y: 0, width: Math.ceil(box[0] + box[2] + 8), height: Math.ceil(box[1] + box[3] + 8) } });
    lines.push({ id: it.id, k: e.k, w: e.w * pts.scale, file, ...pts });
  }
}
fs.writeFileSync(`${out}/lines.json`, JSON.stringify(lines));
await b.close();
console.log(lines.length, "lines");
