// icons.cjs — the app's own signs, taken from the running app (built web/dial-tool.html) for the help page.
//   cd web && node build.mjs && node ../guide/help/icons.cjs   → guide/help/icons.json
// Each is the <svg> the app draws in that button, as it is (R33: icons are drawn once, in web/icons/; never redrawn here).
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const WEB = path.join(__dirname, "../../web");
// an icon as it is seen: the parts the app's stylesheet hides (an X shown only in another state) left out
const SEEN = `const seen = (svg) => { const hide = [...svg.querySelectorAll("*")].filter((e) => getComputedStyle(e).display === "none");
  hide.forEach((e) => e.setAttribute("data-hide", "")); const c = svg.cloneNode(true); hide.forEach((e) => e.removeAttribute("data-hide"));
  c.querySelectorAll("[data-hide]").forEach((e) => e.remove()); c.removeAttribute("class"); c.removeAttribute("id"); return c.outerHTML.replace(/\\s+/g, " "); };`;
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
  await page.addScriptTag({ content: SEEN.replace("const seen", "window.seen") });
  const out = await page.evaluate((want) => {
    const o = {};
    for (const [k, q] of Object.entries(want)) {
      const e = document.querySelector(q); if (!e) { o[k] = null; continue; }
      const svg = e.querySelector("svg"); if (!svg) { o[k] = null; continue; }
      o[k] = window.seen(svg);
    }
    return o;
  }, WANT);
  // the pictures inside the panes: each set from the state that shows it (Okay, 24 Oct 2026, 20:01: "Every thing that has an icon is important … I want to see all the icons")
  const grab = (prefix, q) => page.evaluate(([prefix, q]) => Object.fromEntries([...document.querySelectorAll(q)].map((e) => {
    const svg = e.querySelector("svg");
    const name = (e.title || e.getAttribute("aria-label") || e.textContent).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return [prefix + name, window.seen(svg)]; })), [prefix, q]);
  const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await page.waitForTimeout(150); };
  await page.evaluate(() => localStorage.setItem("dial-tool-folds", '{"*":false}'));
  await page.reload(); await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  await page.addScriptTag({ content: SEEN.replace("const seen", "window.seen") });
  await tab("Rings");
  Object.assign(out, await grab("tool-", "#ring-add, #ring-up, #ring-down, #ring-duplicate, #ring-delete"));
  Object.assign(out, await grab("place-", '[id^="ring-mode-Placement-"]'));
  out["eye-open"] = await page.$eval(".ringlist .eye svg, .eye svg", (s) => window.seen(s)).catch(() => null);
  out["grip"] = await page.$eval(".grip svg", (s) => window.seen(s)).catch(() => null);
  out["rename"] = await page.$eval("#rename svg, .rename svg", (s) => window.seen(s)).catch(() => null);
  await page.click("#ring-kind-row-1"); await page.waitForTimeout(150);      // the markers ring
  Object.assign(out, await grab("shape-", '[id^="ring-shape-Shape-"]'));
  Object.assign(out, await grab("twelve-", '[id^="ring-twelve-Style-"]'));
  await page.click("#ring-kind-square"); await page.waitForTimeout(150);
  Object.assign(out, await grab("kind-", '[id^="ring-kind-Kind-"]'));
  await page.keyboard.press("Escape");
  await tab("Hands");
  Object.assign(out, await grab("hand-", '[id^="hand-shape-Shape-"]'));
  await tab("Date");
  Object.assign(out, await grab("window-", '[id^="window-kind-Complication-"]'));
  Object.assign(out, await grab("hole-", '[id^="window-shape-"]'));
  for (const [from, to] of [["kind-12369numerals", "kind-numerals"], ["kind-abcxyztext", "kind-text"], ["hand-a-shape-of-your-own-from-an-svg-file-not-built-yet", "hand-own"]]) { out[to] = out[from]; delete out[from]; }
  for (const k of Object.keys(out)) if (out[k]) out[k] = out[k].replace(/ class="[^"]*"/g, (m) => /figure|hub|sign|ring|on|off/.test(m) ? m : "");
  for (const [k, v] of Object.entries(out)) console.log(k.padEnd(9), v ? v.length + " chars" : "— none");
  fs.writeFileSync(path.join(__dirname, "icons.json"), JSON.stringify(out, null, 1));
  await browser.close();
})();
