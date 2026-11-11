// same3d.mjs — proves the page looks the same after a change that must not change the look (the split, the parts record).
// Run from web/, with `python3 -m http.server 8765` serving web/ and three in node_modules:
//   node try/relight/same3d.mjs save  [page]   → the shots of the page as it is, in /tmp/same3d/before-*
//   node try/relight/same3d.mjs check [page]   → the same shots again, compared pixel for pixel (check3d.py)
// page: a path under web/, default try/relight/watch3d.html. Shots: Photo top · low · side, Toon low, Dither low, and the
// Engineer drawing's SVG text (the saved file), each with the opener dial and, when given, a dial from a file (DIAL=path.svg)
import { chromium } from "playwright"; import fs from "fs"; import { execFileSync } from "child_process";
const [mode = "save", page = "try/relight/watch3d.html"] = process.argv.slice(2), dir = "/tmp/same3d", tag = mode === "save" ? "before" : "after";
fs.mkdirSync(dir, { recursive: true });
const src = fs.readFileSync(page, "utf8").replace('<script src="scene.js"></script>', `<script>${fs.readFileSync("try/relight/scene.js", "utf8")}</script>`).replaceAll("https://cdn.jsdelivr.net/npm/three@0.170.0/", "http://localhost:8765/node_modules/three/");
const tmp = page.replace(/[^/]*$/, "_same.html"); fs.writeFileSync(tmp, src);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const pg = await b.newPage({ viewport: { width: 1100, height: 800 } }), errs = [];
pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404")) errs.push(m.text()); });
await pg.goto("http://localhost:8765/" + tmp); await pg.waitForFunction(() => window.watch3d && window.movesReady, null, { timeout: 180000 }); await pg.waitForTimeout(1500);
const shot = async (name, fn, arg) => { await pg.evaluate(fn, arg); await pg.waitForTimeout(1200); await pg.locator("#gl").screenshot({ path: `${dir}/${tag}-${name}.png` }); };
const style = (v) => document.querySelector(`[data-key="style"] [data-v="${v}"]`).click();
const run = async (pre) => {
  await shot(pre + "photo-top", () => window.watch3d.set("view", "top"));
  await shot(pre + "photo-low", () => window.watch3d.set("view", "low"));
  await shot(pre + "photo-side", () => window.watch3d.set("view", "side"));
  await shot(pre + "toon-low", (s) => { document.querySelector(`[data-key="style"] [data-v="toon"]`).click(); window.watch3d.set("view", "low"); });
  await shot(pre + "dither-low", () => document.querySelector(`[data-key="style"] [data-v="dither"]`).click());
  fs.writeFileSync(`${dir}/${tag}-${pre}scene.txt`, await pg.evaluate(() => { const out = [], r = (v) => Math.round(v * 1e4) / 1e4;      // the scene itself, exactly: every mesh's place, size and material
    window.watch3d.scene.updateMatrixWorld(true);
    window.watch3d.scene.traverse((o) => { if (!o.isMesh || !o.visible) return; const g = o.geometry, p = g.attributes.position; let h = 0; for (let i = 0; i < p.array.length; i += 7) h = (h * 31 + Math.round(p.array[i] * 1000)) | 0;
      const m = [].concat(o.material).map((m) => [m.type, m.color?.getHexString(), r(m.roughness ?? -1), r(m.metalness ?? -1), r(m.opacity)].join(":")).join("|");
      out.push([o.name, p.count, h, o.matrixWorld.elements.map(r).join(","), m].join(" ")); }); return out.join("\n"); }));
  const svg = await pg.evaluate(async () => { document.querySelector(`[data-key="style"] [data-v="photo"]`).click(); window.watch3d.set("view", "photo"); const r = await window.svg3d(window.watch3d, { detail: 2 }); return typeof r === "string" ? r : r?.svg ?? JSON.stringify(r).slice(0, 2e6); });
  fs.writeFileSync(`${dir}/${tag}-${pre}engineer.svg`, svg);
};
await run("");
if (process.env.DIAL) { const text = fs.readFileSync(process.env.DIAL, "utf8"); await pg.evaluate((t) => window.watch3d.dialFromText(t, "test"), text); await pg.waitForTimeout(1500);
  fs.writeFileSync(`${dir}/${tag}-dial-meta.txt`, await pg.evaluate(() => document.getElementById("dial-meta").textContent + "\n" + document.getElementById("hand-gap").textContent)); await run("dial-"); }
console.log("errors:", errs.length ? errs : "none"); await b.close(); fs.unlinkSync(tmp);
if (mode !== "save") execFileSync("python3", ["try/relight/check3d.py", dir], { stdio: "inherit" });
