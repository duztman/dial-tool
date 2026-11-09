// shot76.mjs — open the page in Chrome (software GL), run a snippet, save a picture.
// node shot.mjs <page.html> <out.png> [js to run in the page] [width] [height]
import { chromium } from "playwright-core";
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [pageFile, out, js = "", w = "1180", h = "820"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: false });
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.route("https://cdn.jsdelivr.net/npm/three@0.170.0/**", (route) => { const p = route.request().url().replace("https://cdn.jsdelivr.net/npm/three@0.170.0/", process.cwd() + "/node_modules/three/"); route.fulfill({ body: fs.readFileSync(p), contentType: "text/javascript" }); });
await page.route("https://cdn.jsdelivr.net/npm/imagetracerjs**", (route) => route.abort());
await page.goto("file://" + path.resolve(pageFile), { timeout: 240000 });
await page.waitForFunction(() => window.watch3d, null, { timeout: 180000 });
if (js) console.log("eval:", JSON.stringify(await page.evaluate(js)));
await page.waitForTimeout(800);
await page.screenshot({ path: out, timeout: 300000 });
await browser.close();
