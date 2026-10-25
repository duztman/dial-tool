// crop.mjs — a picture of one part of the window, for the sketch rounds (the crops Okay sees after each round).
// Keep them in web/test/crops/ (ignored by git; test/out is emptied by parity.py), archived at the session's end (docs/working-with-okay.md §2).
//
//   node test/crop.mjs out.png <tab> <selector> [setup.js] [settings.json]
//
//   tab        Dial · Rings · Hands · Date · Export (the data-tab names; "Date" is the Windows tab)
//   selector   the part to picture, e.g. ".form" or ".bar"; the crop is its box plus a margin
//   setup.js   optional: a file of JavaScript run in the page before the shot (click a ring, open a popup…);
//              if it ends in a value (measures from getBoundingClientRect), that is printed
//
// CROP_H=1800 for a taller window (a whole tab); CROP_W=1180 CROP_H=820 an iPad on its side. Same page set-up as shot.mjs and look.mjs: the plain starting dial, every pane open, fonts served from web/fonts/.
import { chromium } from "playwright";
import fs from "fs";
const [out, tab = "Dial", selector = ".form", setup, settings] = process.argv.slice(2);
if (!out) { console.log("usage: node test/crop.mjs out.png <tab> <selector> [setup.js] [settings.json]"); process.exit(1); }
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: +(process.env.CROP_W || 1440), height: +(process.env.CROP_H || 900) }, deviceScaleFactor: 2, hasTouch: !!process.env.CROP_TOUCH });      // CROP_TOUCH=1: a finger (pointer: coarse), as on the iPad
page.on("pageerror", (e) => console.log("page error:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text()); });
await page.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
if (settings) await page.addInitScript((s) => { setTimeout(() => localStorage.setItem("dial-tool-last", s), 0); }, fs.readFileSync(settings, "utf8"));
else await page.addInitScript(() => { setTimeout(() => { if (!localStorage.getItem("dial-tool-last")) localStorage.setItem("dial-tool-last", "{}"); }, 0); });
await page.addInitScript(() => { setTimeout(() => { if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); }, 0); });
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await page.click(`button[data-tab="${tab}"]`);
await page.waitForTimeout(250);
if (setup) { const said = await page.evaluate(fs.readFileSync(setup, "utf8")); await page.waitForTimeout(300); if (said !== undefined) console.log(JSON.stringify(said)); }      // a setup that ends in a value: printed (measures, R21)
const el = await page.$(selector);
if (!el) { console.log("no element for", selector); await browser.close(); process.exit(1); }
await el.scrollIntoViewIfNeeded();
const b = await el.boundingBox();
const m = 8;
await page.screenshot({ path: out, clip: { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), width: b.width + 2 * m, height: Math.min(b.height + 2 * m, +(process.env.CROP_H || 900)) } });
console.log(`${out}: ${selector} on ${tab}, ${Math.round(b.width)} × ${Math.round(b.height)} px`);
await browser.close();
