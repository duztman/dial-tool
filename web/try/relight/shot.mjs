// shot.mjs — a crop of the trial for the chat. Run from web/: node try/relight/shot.mjs out.png <sun from °> <sun height °> [style 0 photo · 2 miyazaki · 1 engineer]
import { chromium } from "playwright";
const [out, from, rise, style = "0"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 760, height: 760 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.goto("file://" + process.cwd() + "/try/relight/relight-built.html");
await page.waitForFunction(() => window.relight, null, { timeout: 60000 });
await page.evaluate(([f, r, s]) => { window.relight.S.from = +f; window.relight.S.rise = +r; window.relight.S.style = +s; window.relight.render(); }, [from, rise, style]);
await page.waitForTimeout(200);
await page.locator("#gl").screenshot({ path: out });
await browser.close();
