// icons.cjs — the app's own signs, taken from the running app (built web/dial-tool.html) for the help page.
//   cd web && node build.mjs && node ../guide/help/icons.cjs   → guide/help/icons.json
// Each is the <svg> the app draws in that button, as it is (R33: icons are drawn once, in web/icons/; never redrawn here).
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const WEB = path.join(__dirname, "../../web");
const WANT = {
  dial: 'button[data-tab="Dial"]', rings: 'button[data-tab="Rings"]', hands: 'button[data-tab="Hands"]', windows: 'button[data-tab="Date"]', export: 'button[data-tab="Export"]',
  mark: ".mast", undo: "#undo", redo: "#redo", history: "#history-more", versions: "#versions",
  guides: "#guides", case: "#case", xray: "#xray", backdrop: "#backdrop", shadows: "#shadows",
  tiny: "#tiny-open", eye: "#eye-box", iris: "#iris-box", play: "#play", zoom: ".zoomwell", fit: "#fit",
};
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto("file://" + path.join(WEB, "dial-tool.html"));
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  const out = await page.evaluate((want) => {
    const o = {};
    for (const [k, q] of Object.entries(want)) {
      const e = document.querySelector(q); if (!e) { o[k] = null; continue; }
      const svg = e.querySelector("svg"); if (!svg) { o[k] = null; continue; }
      const c = svg.cloneNode(true); c.removeAttribute("class"); c.removeAttribute("id");
      o[k] = c.outerHTML.replace(/\s+/g, " ");
    }
    return o;
  }, WANT);
  for (const [k, v] of Object.entries(out)) console.log(k.padEnd(9), v ? v.length + " chars" : "— none");
  fs.writeFileSync(path.join(__dirname, "icons.json"), JSON.stringify(out, null, 1));
  await browser.close();
})();
