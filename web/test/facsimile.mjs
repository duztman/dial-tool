// facsimile.mjs — one part of the window as a vector PDF with live text, for Okay to redraw in Illustrator.
//
//   node test/facsimile.mjs out.pdf <selector> [setup.js] [tab]
//
//   selector   the part, e.g. "#guide-list" (the Guides popup)
//   setup.js   JavaScript run in the page first, to open the part (a click on its button)
//   tab        Dial · Rings · Hands · Date · Export
//
// The page is printed by Chromium: the part alone, at its size on screen (1 CSS px = 0.75 pt), its colours and
// backgrounds kept, its words as text in the fonts the page uses (embedded, so they open as type in Illustrator).
// Everything else on the page is hidden, and the part is moved to the page's top left.
// Chromium writes a CFF font (Inter's OTF, the UI's stand-in here) as Type 3, which Illustrator can't edit as type:
// FAC_SANS=<folder with Inter-Regular.ttf, Inter-Medium.ttf, Inter-SemiBold.ttf> sets the UI's face in TrueType, so
// its words stay type (make them with fontTools: cu2qu). On Okay's Mac the UI's face is the system's (SF): change the
// font in Illustrator.
import { chromium } from "playwright";
import fs from "fs";
const [out, selector, setup, tab = "Dial"] = process.argv.slice(2);
if (!out || !selector) { console.log("usage: node test/facsimile.mjs out.pdf <selector> [setup.js] [tab]"); process.exit(1); }
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
await page.addInitScript(() => { setTimeout(() => { if (!localStorage.getItem("dial-tool-last")) localStorage.setItem("dial-tool-last", "{}"); }, 0); });
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await page.click(`button[data-tab="${tab}"]`);
if (setup) await page.evaluate(fs.readFileSync(setup, "utf8"));
await page.waitForTimeout(400);
if (process.env.FAC_SANS) {
  const face = (w, file) => `@font-face { font-family: "Fac Sans"; font-weight: ${w}; src: url(data:font/ttf;base64,${fs.readFileSync(process.env.FAC_SANS + "/" + file).toString("base64")}) format("truetype"); }`;
  await page.addStyleTag({ content: face(400, "Inter-Regular.ttf") + face(500, "Inter-Medium.ttf") + face(600, "Inter-SemiBold.ttf") + `:root { --sans: "Fac Sans" !important; } ${selector}, ${selector} * { font-family: "Fac Sans" !important; }` });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
}
const box = await page.$eval(selector, (e) => { const r = e.getBoundingClientRect(); return { w: Math.ceil(r.width), h: Math.ceil(r.height), x: r.left, y: r.top }; });
// print the part alone: everything hidden but it, it fixed at the top left, the page its size
await page.addStyleTag({ content: `
  html, body { background: transparent !important; overflow: visible !important; }
  body * { visibility: hidden !important; }
  ${selector}, ${selector} * { visibility: visible !important; }
  ${selector} { position: fixed !important; left: 0 !important; top: 0 !important; right: auto !important; bottom: auto !important; translate: none !important; transform: none !important; margin: 0 !important; width: ${box.w}px !important; box-shadow: none !important; }` });
await page.emulateMedia({ media: "screen" });
box.h = await page.$eval(selector, (e) => Math.ceil(e.getBoundingClientRect().height));      // measured again once it stands alone
// printed on a page the window's size, so the layout is the window's (a page as narrow as the part would lay the
// panel out as a phone's), then the page cut to the part by crop.py (its media box: 1 CSS px = 0.75 pt)
await page.addStyleTag({ content: "@page { size: 1440px 900px; margin: 0; }" });
const whole = out.replace(/\.pdf$/, "") + "-page.pdf";
await page.pdf({ path: whole, width: "1440px", height: "900px", printBackground: true, pageRanges: "1" });
const { execFileSync } = await import("child_process");
execFileSync("python3", ["-I", "-c", `import sys, pypdf
r = pypdf.PdfReader(sys.argv[1]); p = r.pages[0]; H = float(p.mediabox.top)
w, h = float(sys.argv[3]) * 0.75, float(sys.argv[4]) * 0.75
p.mediabox = p.cropbox = pypdf.generic.RectangleObject([0, H - h, w, H])
o = pypdf.PdfWriter(); o.add_page(p); o.write(sys.argv[2])`, whole, out, String(box.w), String(box.h)]);
fs.unlinkSync(whole);
console.log(`${out}: ${selector}, ${box.w} × ${box.h} px (${(box.w * 0.75).toFixed(1)} × ${(box.h * 0.75).toFixed(1)} pt)`);
await browser.close();
