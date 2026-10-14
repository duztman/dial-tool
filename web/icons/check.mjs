// icons/check.mjs — the icon check (R33). Opens the built page (dial-tool.html) in Chromium at 2×, visits the window's
// states, finds every icon (an <svg> in the panel, the bars and the pop-outs: not the preview, the ruler, font samples,
// hand details or the Gallery), and checks it against the icon grid written in src/app.js (docs/design.md §9):
//   1. one unit, one point: the viewBox is the icon's size on screen (hand tiles: twice, drawn by the geometry)
//   2. every stroked line has one of the four widths, LINE · SLANT · CURVE · DENSE (or DENSE + 1/8: the round corners of
//      a quiet box, drawn with box(…, DENSE, DENSE + 1 / 8)), or is a pictured width (PICTURED)
//   3. a LINE's straight runs sit on quarter points (x.25, x.75), so they cover whole screen dots
//   4. a box with round corners is drawn with box(): its round corners CURVE, its sides LINE
// Then writes icons/out/: inventory.json (every icon, its size, scale, widths, a self-contained copy), a 2× crop of
// each (icons/<n>.png), sheet.png (all of them on one sheet: look at it) and lines.json for look.py.
//
//   cd web && node build.mjs && node icons/check.mjs          (exits 1 if a rule is broken)
//   python3 icons/look.py                                       (how heavy each line looks: equal on the eye)
import { chromium } from "playwright";
import fs from "fs";

const OUT = "icons/out";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT + "/icons", { recursive: true });

// the four widths, read from app.js, so this check follows the source
const src = fs.readFileSync("src/app.js", "utf8");
const decl = /const (LINE = [^;]+);/.exec(src);
if (!decl) { console.log("FAIL  app.js has no `const LINE = …` line: the icon grid is gone"); process.exit(1); }
const W = {};
for (const part of decl[1].split(/,\s*(?=[A-Z]+ =)/)) { const [k, v] = part.split("=").map((s) => s.trim()); W[k] = Function(...Object.keys(W), `return ${v}`)(...Object.values(W)); }
const WIDTHS = [...["LINE", "SLANT", "CURVE", "DENSE"].map((k) => W[k]), W.DENSE + 1 / 8];      // the last: a quiet (DENSE) box's round corners, an eighth heavier, as a LINE box's CURVE corners are
// pictured widths: drawings of a thing's own width, not lines (design.md §8). By the icon's host and the element's place.
const PICTURED = [
  { host: /^ring-kind-|^add-/, widths: [1, 2, 3], why: "a ring kind: ticks 1, marks 2, band 3, as on the dial" },
  { host: /^ring-twelve-Style-3$/, widths: [2], why: "a dashed outline: dashes look lighter than a whole line" },
  { host: /^play$/, widths: [3], why: "the arcade button's two sausages: as thick as its black ring (Okay, 15 Oct 2026: \"the sausage thickness is equal to outer black ring\")" },
];
const near = (a, b) => Math.abs(a - b) < 0.006;
const onQuarter = (v) => near(((v % 0.5) + 0.5) % 0.5, 0.25);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => { Date.now = () => 1791900000000; });
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await page.waitForTimeout(300);

const unfold = () => page.evaluate(() => { for (let n = 0; n < 4; n++) document.querySelectorAll(".pane.folded > .fold").forEach((f) => f.click()); });
const tab = async (n) => { await page.click(`button[data-tab="${n}"]`); await unfold(); await page.waitForTimeout(200); };
const seen = new Map();
let n = 0;

// what an icon is, read in the page: size, scale, every drawn child with its width, path and the transform it sits in
const collect = async (state) => {
  const found = await page.evaluate(() => {
    const skip = (s) => s.closest(".preview, .ruler, .fontrow, .examples, .detail, .sample, .face, .tip, .fontname") || s.classList.contains("preview") || s.classList.contains("ruler");
    document.querySelectorAll("[data-icon]").forEach((e) => e.removeAttribute("data-icon"));
    const res = [];
    document.querySelectorAll("svg").forEach((s, i) => {
      if (skip(s)) return;
      const r = s.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      for (let p = s; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).display === "none" || getComputedStyle(p).visibility === "hidden") return;
      const vb = s.viewBox.baseVal, scale = vb && vb.width ? r.width / vb.width : 1;
      const host = s.closest("button, a, label, li, summary, .card, h2") || s.parentElement;
      const name = host.id || host.getAttribute("data-tab") || host.title || host.getAttribute("aria-label") || (host.textContent || "").trim().slice(0, 24);
      const root = s.getCTM();
      const parts = [...s.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse")].filter((e) => !e.closest("mask, clipPath, defs")).map((e) => {
        const cs = getComputedStyle(e), m = root.inverse().multiply(e.getCTM());
        return { tag: e.tagName, stroked: cs.stroke !== "none" && cs.display !== "none" && parseFloat(cs.strokeWidth) > 0, w: parseFloat(cs.strokeWidth), d: e.getAttribute("d"),
          rect: e.tagName === "rect" ? ["x", "y", "width", "height", "rx"].map((a) => parseFloat(e.getAttribute(a) || 0)) : null,
          plain: Math.abs(m.a - 1) < 1e-6 && Math.abs(m.d - 1) < 1e-6 && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6, tx: m.e, ty: m.f, dash: cs.strokeDasharray !== "none" };
      });
      // a self-contained copy: every child carries its computed paint
      const c = s.cloneNode(true), a = [s, ...s.querySelectorAll("*")], b = [c, ...c.querySelectorAll("*")];
      a.forEach((e, k) => { const cs = getComputedStyle(e); if (k === 0) { b[0].setAttribute("style", `color:${cs.color}`); b[0].removeAttribute("class"); return; }
        b[k].setAttribute("style", ["fill", "stroke", "stroke-width", "opacity", "display"].map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";")); });
      s.setAttribute("data-icon", "i" + i);
      res.push({ key: "i" + i, name, on: !!host.closest(".on, [aria-pressed=true], [aria-expanded=true]"), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
        vb: vb ? [vb.x, vb.y, vb.width, vb.height] : null, scale: +scale.toFixed(3), parts, inline: c.outerHTML, hand: host.id.startsWith("hand-shape-") && /^hand-shape-Shape-\d+$/.test(host.id) });
    });
    return res;
  });
  for (const f of found) {
    const sig = f.inline + f.w + "x" + f.h;
    if (seen.has(sig)) { seen.get(sig).states.add(state); continue; }
    const id = String(++n).padStart(3, "0");
    try {
      const loc = page.locator(`svg[data-icon="${f.key}"]`);
      await loc.evaluate((e) => e.scrollIntoView({ block: "center", inline: "nearest" }));
      const b = await loc.boundingBox(), x = Math.max(0, b.x - 6), y = Math.max(0, b.y - 6);
      await page.screenshot({ path: `${OUT}/icons/${id}.png`, clip: { x, y, width: Math.min(1440 - x, b.width + 12), height: Math.min(900 - y, b.height + 12) } });
    } catch (e) { /* off screen: the sheet shows it missing */ }
    seen.set(sig, { id, ...f, states: new Set([state]) });
  }
};
const visit = async (state, fn) => { try { await fn(); await page.waitForTimeout(150); await collect(state); } catch (e) { console.log("note  could not reach " + state + ": " + e.message.split("\n")[0]); } };

// the window's states: every tab, its picks and pop-ups, chosen and not
await visit("Dial", unfold);
await visit("guides list", () => page.click("#guides-more"));
await visit("guides off", async () => { await page.click("#guides-more"); await page.click("#guides"); });
await page.click("#guides");
await visit("colour pop-out", () => page.click("#global-c-plate-Plate"));
await page.click("#pop-close").catch(() => {});
await visit("Rings", () => tab("Rings"));
for (const kind of ["numerals", "markers"]) await visit("ring " + kind, async () => { await page.click(`.ringlist li.ring:has-text("${kind}")`); await unfold(); });
await visit("add menu", () => page.click("#ring-add"));
await page.click("#ring-add").catch(() => {});
await visit("ring hidden", () => page.click(".ringlist li.ring.on button.eye"));
await page.click(".ringlist li.ring.on button.eye").catch(() => {});
await visit("value pop-up", () => page.click("#ring-r"));
await page.keyboard.press("Escape");
await visit("size pop-up", () => page.click("#ring-size"));
await page.keyboard.press("Escape");
await visit("font box", async () => { await page.click('.ringlist li.ring:has-text("numerals")'); await unfold(); await page.evaluate(() => document.querySelectorAll(".fontbox .partfold:not(.none)").forEach((b) => b.click())); });
await visit("font sheet", async () => { await page.click("#font-change"); await page.waitForTimeout(400); });
await page.keyboard.press("Escape");
await visit("Hands", () => tab("Hands"));
await visit("all hand shapes", () => page.click("#hand-shape-Shape-more"));
await page.click("#hand-shape-Shape-more").catch(() => {});
await visit("Windows", async () => { await tab("Date"); await page.locator("label", { hasText: "Show this window" }).first().click(); await unfold(); });
for (const kind of ["day", "am · pm", "moon"]) await visit("window " + kind, () => page.locator(".form .pickt:visible", { hasText: kind }).first().click());
await visit("window off", () => page.click("#window-card-2"));
await visit("Export", () => tab("Export"));
// "panel away" is gone: the panel's square left the bar (#190, 14 Oct 2026)
await browser.close();

// ── the rules ───────────────────────────────────────────────
const problems = [];
const fail = (icon, what) => problems.push(`${icon.name}${icon.on ? " (chosen)" : ""}: ${what}`);
// a path's straight runs that are level or upright, from its absolute commands (our icons write absolute M L H V A C S Z)
const runs = (d) => {
  const out = []; let x = 0, y = 0, sx = 0, sy = 0;
  const toks = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cmd = "";
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    if (/[a-z]/.test(cmd) && cmd !== "z") return null;      // relative commands: not checked (the source writes absolute)
    if (cmd === "M") { x = num(); y = num(); sx = x; sy = y; cmd = "L"; }
    else if (cmd === "L") { const nx = num(), ny = num(); if (near(nx, x) || near(ny, y)) out.push(near(nx, x) ? ["x", x] : ["y", y]); x = nx; y = ny; }
    else if (cmd === "H") { x = num(); out.push(["y", y]); }
    else if (cmd === "V") { y = num(); out.push(["x", x]); }
    else if (cmd === "A") { i += 5; x = num(); y = num(); }
    else if (cmd === "C") { i += 4; x = num(); y = num(); }
    else if (cmd === "S" || cmd === "Q") { i += 2; x = num(); y = num(); }
    else if (cmd === "Z" || cmd === "z") { if (near(sx, x) || near(sy, y)) out.push(near(sx, x) ? ["x", x] : ["y", y]); x = sx; y = sy; }
    else return null;
  }
  return out;
};
const icons = [...seen.values()];
for (const ic of icons) {
  const want = ic.hand ? 2 : 1;
  if (!near(ic.scale, want)) fail(ic, `drawn at one size, shown at another (×${ic.scale}); draw it at ${ic.w} × ${ic.h} (rule 1)`);
  const pictured = PICTURED.find((p) => p.host.test(ic.name));
  ic.parts.forEach((p, k) => {
    if (!p.stroked) return;
    const w = p.w * ic.scale;
    const ok = WIDTHS.some((v) => near(v, w)) || (pictured && pictured.widths.some((v) => near(v, w)));
    if (!ok) fail(ic, `line ${k} (${p.tag}) is ${+w.toFixed(3)}; use LINE ${W.LINE}, SLANT ${W.SLANT}, CURVE ${W.CURVE} or DENSE ${W.DENSE} (rule 2)`);
    if (p.tag === "rect" && p.rect[4] > 0 && !p.dash) fail(ic, `line ${k} is a <rect> with round corners; draw it with box() (rule 4)`);
    if (!near(w, W.LINE) || !p.plain || ic.scale !== 1) return;
    const r = p.tag === "rect" ? [["x", p.rect[0]], ["x", p.rect[0] + p.rect[2]], ["y", p.rect[1]], ["y", p.rect[1] + p.rect[3]]] : p.tag === "path" && p.d ? runs(p.d) : [];
    for (const [axis, v] of r || []) {
      const at = v + (axis === "x" ? p.tx : p.ty);
      if (!onQuarter(at)) { fail(ic, `line ${k}: a ${axis === "x" ? "upright" : "level"} run at ${axis} ${+at.toFixed(3)} is off the quarter points (rule 3)`); break; }
    }
  });
}

// ── what it found ───────────────────────────────────────────
fs.writeFileSync(OUT + "/inventory.json", JSON.stringify(icons.map((v) => ({ ...v, states: [...v.states] })), null, 1));
fs.writeFileSync(OUT + "/look.json", JSON.stringify(icons.filter((v) => !v.on && v.parts.some((p) => p.stroked)).map((v) => ({ id: v.name.replace(/[^\w-]+/g, "_").slice(0, 40), svg: v.inline }))));
// the sheet: every icon's crop on one picture, to look at (R19)
const sheet = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const sp = await sheet.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
const cells = icons.map((v) => fs.existsSync(`${OUT}/icons/${v.id}.png`) ? `<figure><img src="icons/${v.id}.png" style="height:${Math.round((v.h + 12) * 2)}px"><figcaption>${v.id} ${v.name.replace(/</g, "&lt;").slice(0, 26)}${v.on ? " ·on" : ""}</figcaption></figure>` : "").join("");
fs.writeFileSync(OUT + "/sheet.html", `<style>body{margin:12px;font:11px sans-serif;display:flex;flex-wrap:wrap;gap:12px;background:#fff}figure{margin:0;display:grid;justify-items:start;gap:4px;width:180px}img{image-rendering:pixelated}</style>${cells}`);
await sp.goto("file://" + process.cwd() + "/" + OUT + "/sheet.html");
await sp.screenshot({ path: OUT + "/sheet.png", fullPage: true });
await sheet.close();

console.log(`${icons.length} icons in ${new Set(icons.flatMap((v) => [...v.states])).size} states · widths LINE ${W.LINE} · SLANT ${W.SLANT} · CURVE ${W.CURVE} · DENSE ${W.DENSE}`);
for (const e of errors) problems.push("page error: " + e);
for (const p of [...new Set(problems)]) console.log("FAIL  " + p);
console.log(problems.length ? `${new Set(problems).size} icon problems` : "ok    every icon on the grid (icons/out/sheet.png to look at; python3 icons/look.py for weight)");
process.exit(problems.length ? 1 : 0);
