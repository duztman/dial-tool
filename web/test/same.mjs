// same.mjs — does the window look the same as it did? A check for changes to the stylesheet that must not change the look.
//
//   node test/same.mjs save     the look of the built page now, kept in test/same.json
//   node test/same.mjs          the look now against the kept one: every difference is printed
//
// "The look" is what the browser works out for every element of the window (its computed style: sizes, places,
// colours, type — about 350 values each, and those of its ::before and ::after), in about forty states of the
// tool: each section, each kind of ring, the pop-outs and sheets open, a phone, a finger — and, on a mouse, each
// kind of control under the pointer, pressed, and with the keyboard on it. Elements are matched by their order in
// the page, so a class may be renamed, but the page's structure has to stay.
// Sliders' tracks and handles can't be asked for this way: look at the screenshots for those.
import { chromium } from "playwright";
import fs from "fs";
import crypto from "crypto";

const FILE = process.env.SAME || "test/same.json";      // not in the repo (about 20 MB); SAME=… keeps it elsewhere
const saving = process.argv[2] === "save";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const dict = new Map();                            // a style's text → its number (most elements share theirs)
const texts = [];
const keep = (text) => { if (!dict.has(text)) { dict.set(text, texts.length); texts.push(text); } return dict.get(text); };
const states = {};
const kinds_seen = new Set();

// in the page: every element's computed style, in the page's order
const SNAP = (root_selector) => {
  const out = [];
  const style_of = (e, pseudo) => {
    const cs = getComputedStyle(e, pseudo);
    if (pseudo && (cs.content === "none" || cs.content === "normal")) return "";
    let s = "";
    for (const p of cs) if (!p.startsWith("--")) s += p + ":" + cs.getPropertyValue(p) + ";";
    return s;
  };
  const roots = root_selector ? [...document.querySelectorAll(root_selector)].filter((e) => e.dataset.sameProbe === "1") : [document.body];
  for (const root of roots) {
    for (const e of [root, ...root.querySelectorAll("*")]) {
      if (e.closest("script, style")) continue;
      const drawing = e.closest("svg.preview, .examples svg, .fontrow svg, .detail svg");      // drawings: the picture itself only
      if (drawing && drawing !== e) continue;
      out.push([e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).join(".") : ""), style_of(e), style_of(e, "::before"), style_of(e, "::after")]);
    }
  }
  return out;
};

async function open(options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.setDefaultTimeout(2500);
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.addInitScript(() => { Date.now = () => 1791900000000; });      // a still clock, so nothing differs by the hour
  await page.goto("file://" + (process.env.PAGE || process.cwd() + "/dial-tool.html"));      // PAGE=…: another build, to keep its look
  await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 30000 });
  await page.waitForTimeout(300);
  return page;
}
async function snap(page, name) {
  await page.waitForTimeout(260);
  const rows = await page.evaluate(SNAP, null);
  states[name] = rows.map(([sig, a, b, c]) => [sig, keep(a), keep(b), keep(c)]);
}
// each kind of control under the pointer, pressed, with the keyboard on it (forced through the browser's own tools)
async function pointer(page, name) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
  const SEL = "button, a, select, input, li.ring, label.check, [role=radio], .fontname, .colour, .swatch, .fontrow, .axisname";
  // one of each kind: the same tag, classes and parent's classes look the same
  const firsts = await page.evaluate(({ sel, known }) => {
    const seen = new Set(known), list = [], fresh = [];
    [...document.querySelectorAll(sel)].forEach((e, i) => {
      if (!e.offsetParent && getComputedStyle(e).position !== "fixed") return;
      const key = e.tagName + "." + e.className + "<" + (e.parentElement.className || e.parentElement.tagName) + "|" + (e.getAttribute("aria-pressed") || "") + (e.getAttribute("aria-expanded") || "") + (e.type || "");
      if (seen.has(key)) return;
      seen.add(key); list.push(i); fresh.push(key);
    });
    return { list, fresh };
  }, { sel: SEL, known: [...kinds_seen] }).then(({ list, fresh }) => { fresh.forEach((k) => kinds_seen.add(k)); return list; });      // each kind once, in the first state that shows it
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: SEL });
  for (const i of firsts) {
    for (const forced of ["hover", "active", "focus-visible"]) {
      await cdp.send("CSS.forcePseudoState", { nodeId: nodeIds[i], forcedPseudoClasses: forced === "focus-visible" ? ["focus", "focus-visible"] : forced === "active" ? ["hover", "active"] : [forced] });
      const rows = await page.evaluate(({ sel, i, SNAP }) => {
        const e = document.querySelectorAll(sel)[i];
        e.dataset.sameProbe = "1";
        const rows = new Function("return " + SNAP)()("[data-same-probe]");
        delete e.dataset.sameProbe;
        return rows;
      }, { sel: SEL, i, SNAP: SNAP.toString() });
      states[`${name} · ${forced} · ${rows[0][0].includes("#") ? rows[0][0].split(".")[0] : rows[0][0]} (${i})`] = rows.map(([sig, a, b, c]) => [sig.replace(/\[data-same-probe\]/, ""), keep(a), keep(b), keep(c)]);
    }
    await cdp.send("CSS.forcePseudoState", { nodeId: nodeIds[i], forcedPseudoClasses: [] });
  }
  await cdp.detach();
}
const unfold = (page) => page.evaluate(() => { for (let n = 0; n < 4; n++) document.querySelectorAll(".pane.folded > .fold").forEach((f) => f.click()); });      // every pane open
const tab = async (page, name) => { await page.click(`button[data-tab="${name}"]`); await unfold(page); await page.waitForTimeout(300); };
const attempt = async (what, run) => { try { await run(); } catch (e) { console.log(`  (state skipped: ${what}: ${String(e.message).split("\n")[0]})`); states["SKIPPED " + what] = []; } };

// the states, on one kind of screen
async function walk(page, screen, with_pointer) {
  const S = (name) => `${screen} · ${name}`;
  const look = async (name) => { await snap(page, S(name)); if (with_pointer) await pointer(page, S(name)); };
  await look("Dial");
  await attempt("dial folded", async () => { await page.click(".pinned .fold h2"); await snap(page, S("Dial, first pane folded")); await page.click(".pinned .fold h2"); });
  await attempt("unit menu", async () => { await page.click("#unit"); await look("unit menu"); await page.click("#unit"); });
  await attempt("colour pop-out", async () => {
    await page.click("#global-c-plate-Plate"); await look("colour pop-out");
    await page.click("#pop-as-HEX"); await snap(page, S("colour pop-out, HEX"));
    await page.click("#pop-wide"); await snap(page, S("colour pop-out, wide")); await page.click("#pop-wide");
    await page.click("#pop-close");
  });
  await attempt("guides list", async () => {
    await page.click("#guides-more"); await look("guides list");
    await page.click('.guidelist button:text-is("Line")'); await page.click('.guidelist button:text-is("Circle")'); await snap(page, S("guides list, two added"));
    await page.click("#guides-more");
    await page.click("#guides"); await snap(page, S("guides off")); await page.click("#guides");
  });
  await attempt("backdrop", async () => {
    await page.click("#backdrop"); await page.fill("#pop-hex", "#141413"); await page.press("#pop-hex", "Enter"); await look("backdrop dark, its pop-out open");
    await page.fill("#pop-hex", "#D0D0CB"); await page.press("#pop-hex", "Enter"); await page.click("#pop-close");
  });
  await tab(page, "Rings");
  for (const kind of ["numerals", "markers", "ticks"]) {
    await attempt("ring " + kind, async () => { await page.click(`.ringlist li.ring:has-text("${kind}")`); await unfold(page); await look("Rings, " + kind); });
  }
  await attempt("a band", async () => { await page.click("#ring-add"); await snap(page, S("Rings, add menu")); await page.click("#add-band"); await unfold(page); await look("Rings, band"); });
  await attempt("value pop-up", async () => { await page.hover("#ring-r"); await snap(page, S("Rings, the radius' tag")); await page.click("#ring-r"); await look("Rings, radius pop-up"); await page.keyboard.press("Escape"); });
  await attempt("rename", async () => { await page.click(".ringlist li.ring.on .rename"); await snap(page, S("Rings, renaming")); await page.keyboard.press("Escape"); });
  await attempt("hidden ring", async () => { await page.click(".ringlist li.ring.on button.eye"); await snap(page, S("Rings, a hidden ring")); await page.click(".ringlist li.ring.on button.eye"); });
  await attempt("rings folded", async () => { await page.click(".pinned .fold h2"); await snap(page, S("Rings, folded")); await page.click(".pinned .fold h2"); });
  await attempt("type", async () => {
    await page.click('.ringlist li.ring:has-text("numerals")'); await unfold(page);
    await page.evaluate(() => document.querySelectorAll(".fontbox .partfold:not(.none)").forEach((b) => b.click()));
    await look("Rings, numerals with the font box's parts open");
    await page.click("#lang"); await snap(page, S("Rings, language list")); await page.click("#lang");
    await page.click("#font-change"); await look("font sheet"); await page.keyboard.press("Escape");
  });
  await tab(page, "Hands");
  for (const n of [0, 1, 2]) await attempt("hand " + n, async () => { await page.click("#hand-tab-" + n); await unfold(page); await look("Hands, " + n); });
  await attempt("hand shapes open", async () => { await page.click("#hand-shape-Shape-more"); await snap(page, S("Hands, all shapes")); await page.click("#hand-shape-Shape-more"); });
  await attempt("number box", async () => { await page.focus(".row.side .numbox input"); await snap(page, S("Hands, a number box open")); await page.keyboard.press("Escape"); await page.evaluate(() => document.activeElement.blur()); });
  await tab(page, "Date");
  await attempt("window on", async () => { await page.check("#window-on-Show-this-window"); await unfold(page); });
  await look("Windows, the date");
  for (const kind of ["day", "am · pm", "moon"]) await attempt("window " + kind, async () => { await page.locator(".form .pickt:visible", { hasText: kind }).first().click(); await snap(page, S("Windows, " + kind)); });
  await attempt("window date again", async () => { await page.locator(".form .pickt:visible", { hasText: "date" }).first().click(); });
  for (const shape of ["circle", "polygon", "arc", "arch", "rectangle"]) await attempt("shape " + shape, async () => { await page.click("#window-shape-" + shape); await snap(page, S("Windows, " + shape)); });
  await attempt("window place", async () => { await page.click("#window-at-more"); await snap(page, S("Windows, a time of its own")); });
  await attempt("window off", async () => { await page.click("#window-card-2"); await look("Windows, one not shown"); await page.click("#window-card-0"); });
  await tab(page, "Export");
  await look("Export");
  await attempt("panel away", async () => { await page.click("#panel-toggle"); await snap(page, S("panel put away")); await page.click("#panel-toggle"); });
  await attempt("gallery dial", async () => { await page.click('.gallery a:has-text("Diver")'); await page.waitForTimeout(500); await tab(page, "Rings"); await snap(page, S("Diver from the Gallery, Rings")); await tab(page, "Dial"); await snap(page, S("Diver from the Gallery, Dial")); });
}

const mouse = await open({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await walk(mouse, "mouse", true);
await mouse.context().close();
const finger = await open({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await walk(finger, "finger", false);
await finger.context().close();
const phone = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
await walk(phone, "phone", false);
await phone.context().close();
await browser.close();

const count = Object.values(states).reduce((n, rows) => n + rows.length, 0);
if (saving) {
  fs.writeFileSync(FILE, JSON.stringify({ texts, states }));
  console.log(`kept: ${Object.keys(states).length} states, ${count} elements, ${texts.length} different styles · ${crypto.createHash("sha1").update(JSON.stringify({ texts, states })).digest("hex").slice(0, 8)}`);
  process.exit(0);
}
const was = JSON.parse(fs.readFileSync(FILE, "utf8"));
const parse = (text) => Object.fromEntries(text.split(";").filter(Boolean).map((d) => { const i = d.indexOf(":"); return [d.slice(0, i), d.slice(i + 1)]; }));
let differences = 0;
const seen = new Set();
for (const name of new Set([...Object.keys(was.states), ...Object.keys(states)])) {
  const a = was.states[name], b = states[name];
  if (!a || !b) { differences++; console.log(`DIFFERENT  ${name}: ${a ? "this state is gone" : "a new state"}`); continue; }
  if (a.length !== b.length) { differences++; console.log(`DIFFERENT  ${name}: ${a.length} elements before, ${b.length} now (the page's structure changed)`); continue; }
  for (let i = 0; i < a.length; i++) {
    for (const [k, part] of [[1, ""], [2, "::before"], [3, "::after"]]) {
      const x = was.texts[a[i][k]], y = texts[b[i][k]];
      if (x === y) continue;
      const px = parse(x), py = parse(y);
      const changed = [...new Set([...Object.keys(px), ...Object.keys(py)])].filter((p) => px[p] !== py[p]).map((p) => `${p}: ${px[p]} → ${py[p]}`);
      differences++;
      const key = b[i][0].replace(/#[\w-]+/, "") + part + "|" + changed.join("|");
      if (seen.has(key)) continue;                 // the same change on the same kind of element is said once
      seen.add(key);
      if (seen.size <= 60) console.log(`DIFFERENT  ${name}\n    ${b[i][0]}${part}\n    ${changed.slice(0, 8).join("\n    ")}${changed.length > 8 ? `\n    … and ${changed.length - 8} more` : ""}`);
    }
  }
}
console.log(differences ? `\n${differences} differences, ${seen.size} of them of different kinds (the first 60 are shown).` : `The same: ${Object.keys(states).length} states, ${count} elements.`);
process.exit(differences ? 1 : 0);
