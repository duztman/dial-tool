// look.mjs — screenshots of each section (and the hover label), for looking at the design:  node test/look.mjs [settings.json]
import { chromium } from "playwright";
import fs from "fs";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("page error:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text()); });
await page.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
if (process.argv[2]) await page.addInitScript((s) => localStorage.setItem("dial-tool-last", s), fs.readFileSync(process.argv[2], "utf8"));
else await page.addInitScript(() => { if (!localStorage.getItem("dial-tool-last")) localStorage.setItem("dial-tool-last", "{}"); });      // the plain starting dial, not the opener (Okay's watch, 4.38.12)
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
for (const name of ["Dial", "Rings", "Hands", "Date", "Export"]) {
  await page.click(`button[data-tab="${name}"]`);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `test/out/look-${name}.png` });
}
await page.click('button[data-tab="Rings"]');
await page.click('.ringlist li:has-text("numerals")');
await page.$eval(".form", (e) => { e.scrollTop = 560; });
const box = await page.$eval(".preview", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await page.mouse.move(box[0] - 150, box[1] + 30);
await page.waitForTimeout(250);
await page.screenshot({ path: "test/out/look-Type.png" });
await browser.close();
