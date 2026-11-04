// shot3d.mjs — a crop of the 3D trial for the chat. Run from web/: node try/relight/shot3d.mjs out.png <sun from °> <sun height °>
// three.js is served from node_modules (the sandbox has no CDN); the page itself loads it from jsdelivr.
import { chromium } from "playwright";
import fs from "fs";
const [out, from = "135", rise = "40", mode = "studio"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.route("https://cdn.jsdelivr.net/npm/three@0.170.0/**", (route) => { const p = route.request().url().replace("https://cdn.jsdelivr.net/npm/three@0.170.0/", "node_modules/three/"); route.fulfill({ body: fs.readFileSync(p), contentType: "text/javascript" }); });
await page.goto("file://" + process.cwd() + "/try/relight/watch3d.html");
await page.waitForFunction(() => window.watch3d, null, { timeout: 120000 });
await page.evaluate(([f, r, m]) => { window.watch3d.S.from = +f; window.watch3d.S.rise = +r; window.watch3d.setMode(m); window.watch3d.render(); }, [from, rise, mode]);
await page.waitForTimeout(500);
console.log(await page.evaluate(() => document.getElementById("status").textContent));
await page.screenshot({ path: out });
await browser.close();
