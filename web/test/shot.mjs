// a quick look: open the built page, optionally with a settings file, and save a screenshot
import { chromium } from "playwright";
import fs from "fs";
const [out = "test/out/shot.png", settings] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text()); });
page.on("pageerror", (e) => console.log("page error:", e.message));
if (settings) await page.addInitScript((s) => localStorage.setItem("dial-tool-last", s), fs.readFileSync(settings, "utf8"));
else await page.addInitScript(() => { if (!localStorage.getItem("dial-tool-last")) localStorage.setItem("dial-tool-last", "{}"); });      // the plain starting dial, not the opener (Okay's watch, 4.38.12)
await page.addInitScript(() => { if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); });      // every pane open, as for a visitor who has opened them (#270)
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await page.waitForTimeout(300);
await page.screenshot({ path: out });
console.log(await page.evaluate(() => document.querySelector(".status").textContent));
await browser.close();
