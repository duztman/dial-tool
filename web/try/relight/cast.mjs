// cast.mjs — what the screen shows WHILE the page is busy: frames from the compositor (CDP screencast), not from the page's thread.
// node cast.mjs <page.html> <outdir> <js to start the work> [width] [height] [seconds]
import { chromium } from "playwright-core";
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [pageFile, outDir, js, w = "1400", h = "900", secs = "9"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.route("https://cdn.jsdelivr.net/npm/three@0.170.0/**", (route) => { const p = route.request().url().replace("https://cdn.jsdelivr.net/npm/three@0.170.0/", process.cwd() + "/node_modules/three/"); route.fulfill({ body: fs.readFileSync(p), contentType: "text/javascript" }); });
await page.goto("file://" + path.resolve(pageFile), { timeout: 240000 });
await page.waitForFunction(() => window.watch3d, null, { timeout: 180000 });
await page.waitForTimeout(1500);
const cdp = await page.context().newCDPSession(page); const frames = []; const t0 = Date.now();
cdp.on("Page.screencastFrame", (f) => { frames.push({ t: Date.now() - t0, data: f.data }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, everyNthFrame: 1 });
page.evaluate(js).catch((e) => console.log("eval:", e.message));
await new Promise((r) => setTimeout(r, +secs * 1000));
await cdp.send("Page.stopScreencast").catch(() => {});
console.log("frames:", frames.length, "at ms:", frames.map((f) => f.t).join(" "));
frames.forEach((f, i) => fs.writeFileSync(path.join(outDir, `f${String(i).padStart(3, "0")}-${f.t}.jpg`), Buffer.from(f.data, "base64")));
await browser.close();
