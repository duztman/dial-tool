// shots.mjs — the guidebook's pictures, taken from the tool itself (beta 4.36.1, locked: Okay, 14 Oct 2026).
//   node docs/guide/web/shots.mjs [path to the locked version's web/ folder]
// Writes img/<state>.png (the whole window, 1440 × 900 points at 2×), img/rects.json (where named parts sit
// in each state, in points) and img/dial-*.svg (dials exported by the tool's own SVG button).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(process.argv[2] || path.join(HERE, "../../../../dial-tool-versions/v4.36.1/web"));
const IMG = path.join(HERE, "img");
fs.mkdirSync(IMG, { recursive: true });
const { link } = await import(pathToFileURL(path.join(WEB, "links.mjs")));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3, acceptDownloads: true, reducedMotion: "reduce" });
await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
const page = await context.newPage();
page.on("pageerror", (e) => console.log("page error:", e.message));
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const ready = () => page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
// the page is served at its real address, so its own link shows the address people will see
await context.route(/^https:\/\/duztman\.github\.io\/dial-tool\/(index\.html)?(#.*)?$/, (r) => r.fulfill({ path: path.join(WEB, "dial-tool.html"), contentType: "text/html" }));
const open = async (hash = "") => { await page.goto("about:blank"); await page.goto("https://duztman.github.io/dial-tool/" + hash); await ready(); await page.waitForTimeout(400); await frame(); };
const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await frame(); await page.waitForTimeout(150); };
const guides_off = async () => { await page.evaluate(() => { const t = window.dial_tool; t.S.guides = false; t.render(); }); await frame(); };
const rect = (sel) => page.evaluate((sel) => {
  const els = [...document.querySelectorAll(sel)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
  if (!els.length) return null;
  const bs = els.map((e) => e.getBoundingClientRect());
  const x = Math.min(...bs.map((b) => b.left)), y = Math.min(...bs.map((b) => b.top));
  return [x, y, Math.max(...bs.map((b) => b.right)) - x, Math.max(...bs.map((b) => b.bottom)) - y].map((v) => Math.round(v * 10) / 10);
}, sel);
const rects = {};
const shot = async (name, parts) => {
  await frame();
  await page.screenshot({ path: path.join(IMG, name + ".png") });
  rects[name] = {};
  for (const [k, sel] of Object.entries(parts)) { rects[name][k] = await rect(sel); if (!rects[name][k]) console.log(`missing: ${name}.${k} (${sel})`); }
  console.log("shot", name);
};
/** a pane, found by the words of its heading */
const pane = (words) => page.evaluate((w) => {
  const h = [...document.querySelectorAll(".pane h2, .pane .fold, h2")].find((e) => e.textContent.trim().startsWith(w));
  const p = h && (h.closest(".pane") || h.parentElement);
  if (!p) return null; const b = p.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(Math.round);
}, words);

// ── the window: the starting dial, guides off ──
await open();
await tab("Export");
await page.click('button:text-is("Defaults")');
await ready(); await frame();
await guides_off();

await tab("Dial");
// one change and back, so undo stands lit as it does in use
for (const v of ["3.5", "3"]) { await page.fill("#global-margin-Page-margin", v); await page.press("#global-margin-Page-margin", "Enter"); await page.waitForTimeout(1500); }
await page.mouse.move(5, 5); await frame();
await shot("dial", {
  title: "header", unit: "#unit", tabs: ".tabs", undo: "#undo, #redo", guides: "#guides, #guides-more", backdrop: "#backdrop",
  play: "#play, #speed-1, #speed-60, #speed-720", time: "#time, #ampm, #now", day: "#time-slider", zoom: "#zoom-out, #zoom-in, #fit",
  panel_toggle: "#panel-toggle", bar: ".bar", panel: "aside", preview: "main",
  diameter: "#global-dial-d-Diameter-slider, #global-dial-d-Diameter, #global-ui-scale-Scale-everything-with-it",
  plate: "#global-c-plate-Plate", backdrop_pill: "#global-c-backdrop-Backdrop", margin: "#global-margin-Page-margin-slider, #global-margin-Page-margin",
  colours: "[id^=colour-ring-], [id^=colour-hand-], #colour-cap", number_row: "#global-dial-d-Diameter-slider, #global-dial-d-Diameter, #global-dial-d-Diameter ~ *",
});
rects.dial.pane_dial = await pane("Dial");
rects.dial.pane_page = await pane("Page");
rects.dial.pane_colours = await pane("Colours");

await page.click("#global-c-plate-Plate"); await page.waitForTimeout(200);
await shot("pop", { pop: "[id^=pop-]", plate: "#global-c-plate-Plate" });
rects.pop.box = await page.evaluate(() => { let e = document.querySelector("#pop-close"); while (e && e.getBoundingClientRect().height < 300) e = e.parentElement; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(Math.round); });
const pop_ids = await page.evaluate(() => [...document.querySelectorAll("[id^=pop]")].map((e) => e.id).join(" "));
console.log("pop ids:", pop_ids);
await page.keyboard.press("Escape"); await page.mouse.click(1200, 120); await frame();

// the units box, open
await page.click("#unit"); await page.waitForTimeout(200);
await shot("unit", { menu: "#unit-menu", unit: "#unit" });
await page.click("#unit"); await page.mouse.click(1200, 120); await frame();

await tab("Rings");
await shot("rings", { list: ".ringlist", tools: ".headtools", drawer: ".ringline, .lineholder", pinned: ".pinned", panel: "aside" });
await page.click("#ring-add"); await page.waitForTimeout(200);
await shot("add", { menu: "#add-menu", plus: "#ring-add", list: ".ringlist" });
await page.mouse.click(60, 44); await frame();

// the pointer on a marker at 2 o'clock: its outline and its name
const p = await page.evaluate(() => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(), R = 13.0, a = 60 * Math.PI / 180;
  return [r.left + t.c[0] + R * Math.sin(a) * t.z, r.top + t.c[1] - R * Math.cos(a) * t.z]; });
await page.mouse.move(p[0] + 1, p[1] + 1); await page.mouse.move(p[0], p[1]); await frame();
await shot("hover", { tip: ".tip", glow: ".glow:not(.under)", preview: "main" });
rects.hover.pointer = [p[0] - 4, p[1] - 4, 8, 8];
await page.mouse.move(5, 5); await frame();

await tab("Export");
await shot("export", { panel: "aside" });
rects.export.pane_link = await pane("Link to this dial");
rects.export.pane_file = await pane("Export a file");
rects.export.pane_print = await pane("Print");

await tab("Hands");
await shot("hands", { panel: "aside", tabs: "[id^=hand-tab-]" });

// ── round 3 (Okay's notes of 14 Oct, 16:56): more states, and the parts inside them ──
const part_rects = async (name, parts) => { rects[name] = rects[name] || {}; for (const [k, sel] of Object.entries(parts)) { rects[name][k] = await rect(sel); if (!rects[name][k]) console.log(`missing: ${name}.${k}`); } };
// parts of the starting window
await tab("Dial");
await part_rects("dial", { eye: ".pane button.fold .eye, .pane button.fold svg", title_text: "header" });
// parts of the colour box
await page.click("#global-c-plate-Plate"); await page.waitForTimeout(200);
await part_rects("pop", { wide: "#pop-wide", close: "#pop-close", used: "#pop-used", palette: "#pop-palette", add: "#pop-add",
  field: "#pop-wide ~ * canvas, .pop canvas, [class*=pop] canvas", as: "#pop-as-RGB, #pop-as-CMYK, #pop-as-HEX", hex: "#pop-hex", copy: "#pop-copy" });
await page.keyboard.press("Escape"); await page.mouse.click(1200, 120); await frame();
// the units menu's rows
await page.click("#unit"); await page.waitForTimeout(200);
await part_rects("unit", { items: "#unit-menu > *" });
await page.click("#unit"); await page.mouse.click(1200, 120); await frame();
// a group folded: the Page group's eye pressed
await page.evaluate(() => { const h = [...document.querySelectorAll(".pane")].find((p) => p.textContent.trim().startsWith("Page")); h.querySelector("button.fold").click(); });
await page.waitForTimeout(300); await frame();
await shot("folded", { panel: "aside" });
rects.folded.pane_page = await pane("Page");
rects.folded.pane_colours = await pane("Colours");
await page.evaluate(() => { const h = [...document.querySelectorAll(".pane")].find((p) => p.textContent.trim().startsWith("Page")); h.querySelector("button.fold").click(); });
await page.waitForTimeout(300);
// the Windows tab
await tab("Date");
await shot("windows", { panel: "aside" });
// the rings: one row's parts, the drawer's buttons
await tab("Rings");
await part_rects("rings", { row: ".ringlist li.ring.on", row_eye: ".ringlist li.ring.on button.eye", row_rename: ".ringlist li.ring.on button.rename",
  rows: ".ringlist li.ring", kinds: "#ring-kind-Kind-0, #ring-kind-Kind-1, #ring-kind-Kind-2, #ring-kind-Kind-3", colour: "#ring-c-Colour",
  size: "#ring-size", radius: "#ring-r", add: "#ring-add", up: "#ring-up, #ring-down", dup: "#ring-duplicate", del: "#ring-delete",
  grip: ".ringlist li.ring.on .grip, .ringlist li.ring.on [class*=grip]" });
// the pointer on other things, and what a click does
const at = (R, deg) => page.evaluate(([R, deg]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(), a = deg * Math.PI / 180;
  return [r.left + t.c[0] + R * Math.sin(a) * t.z, r.top + t.c[1] - R * Math.cos(a) * t.z]; }, [R, deg]);
const hover_at = async (q) => { await page.mouse.move(q[0] + 1, q[1] + 1); await page.mouse.move(q[0], q[1]); await frame(); await page.waitForTimeout(100); };
const hands_deg = await page.evaluate(() => { const t = window.dial_tool.S.t; return [((t / 3600) % 12) * 30, ((t / 60) % 60) * 6]; });
let q = await at(5, hands_deg[0]); await hover_at(q);
await shot("hover-hand", { tip: ".tip" }); rects["hover-hand"].pointer = [q[0] - 4, q[1] - 4, 8, 8];
q = await at(10, 0); await hover_at(q);
await shot("hover-numeral", { tip: ".tip" }); rects["hover-numeral"].pointer = [q[0] - 4, q[1] - 4, 8, 8];
q = await at(13.0, 60); await hover_at(q); await page.mouse.click(q[0], q[1]); await frame(); await page.waitForTimeout(200);
await page.mouse.move(q[0], q[1] - 1); await frame();
await shot("clicked", { tip: ".tip", list: ".ringlist", row: ".ringlist li.ring.on", panel: "aside" }); rects.clicked.pointer = [q[0] - 4, q[1] - 4, 8, 8];
await page.mouse.move(5, 5); await frame();
// the dial zoomed in, moved
for (let i = 0; i < 4; i++) await page.click("#zoom-in");
await frame(); await page.waitForTimeout(200);
await shot("zoomed", { preview: "main", zoom: "#zoom-out, #zoom-in, #fit" });
await page.click("#fit"); await frame();
// Scale everything with it: the starting dial at 30 mm, at 36 without, at 36 with
const set_d = async (v) => { await page.fill("#global-dial-d-Diameter", v); await page.press("#global-dial-d-Diameter", "Enter"); await page.waitForTimeout(300); };
await tab("Dial");

// ── the dials of "A first dial", exported by the tool's own SVG button ──
const W = [0.95, 0.95, 0.92, 1], DARK = [0.11, 0.11, 0.12, 1], ACCENT = [0.80, 0.22, 0.10, 1];
const minutes = { kind: 0, name: "Minutes", c: W, r: 17.4, count: 60, len: 1.2, w: 0.16 };
const hours = { kind: 1, name: "Hours", c: W, r: 17.4, count: 12, len: 3.2, w: 1.0 };
const numerals = { kind: 2, name: "Numerals", c: W, r: 12.0, count: 12, size: 3.4 };
const font = { family: "Barlow", ps: "Barlow-SemiBold" };
const hands = { ha_on: true, ha_cap: 1.5, c_cap: W,
  ha_hour: { shape: 0, len: 9.6, w: 1.5, tail: 1.6, round: 0.75, c: W }, ha_minute: { shape: 0, len: 15.6, w: 1.1, tail: 2.0, round: 0.55, c: W },
  ha_second: { shape: 1, len: 16.8, w: 0.22, tail: 3.6, tip: 1.2, c: W } };
const base = { dial_d: 36, margin: 2, c_plate: DARK, guides: false, ha_on: false, da_on: false, t: 10 * 3600 + 9 * 60 + 36 };
const steps = [];
steps.push({ ...base, rings: [{ ...minutes, on: false }] });                                   // 1 the plate
steps.push({ ...base, rings: [minutes] });                                                        // 2 minute track
steps.push({ ...base, rings: [hours, minutes] });                                                 // 3 hours
steps.push({ ...base, rings: [hours, { ...minutes, skip: 1 }] });                                // 4 give way
steps.push({ ...base, rings: [numerals, hours, { ...minutes, skip: 1 }] });                       // 5 numerals
steps.push({ ...base, rings: [{ ...numerals, ...font }, hours, { ...minutes, skip: 1 }] });       // 6 font
steps.push({ ...steps[5], ...hands });                                                            // 7 hands
steps.push({ ...steps[6], da_on: true, da_r: 12.0, da_w: 3.0, da_h: 2.4, da_ink: W, da_disc_c: W, da_text_c: DARK, da_day: "17" }); // 8 date
steps.push({ ...steps[7], ha_second: { ...hands.ha_second, c: ACCENT }, c_cap: ACCENT });         // 9 colour
steps.push({ ...steps[8] });                                                                      // 10 out
const links = {};
const export_svg = async (name) => {
  const [d] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => window.dial_tool.export("svg"))]);
  await d.saveAs(path.join(IMG, name + ".svg"));
};
for (const [i, s] of steps.entries()) {
  const hash = link(s);
  links[`step-${i + 1}`] = hash;
  await open(hash);
  await export_svg(`dial-step-${i + 1}`);
  console.log("dial step", i + 1);
}
// Okay's bezel diver (docs/guide/classics-links.md): a richer dial, for the cover until Okay picks one
const diver = fs.readFileSync(path.join(HERE, "../classics-links.md"), "utf8").match(/Diver, bezel.*?(#1\.[A-Za-z0-9_-]+)/)[1];
links.diver = diver;
await open(diver);
await export_svg("dial-diver");
// Okay's B-Uhr, for the Start page: the window, and the address it lives at
const buhr = fs.readFileSync(path.join(HERE, "../classics-links.md"), "utf8").match(/B-Uhr.*?(#1\.[A-Za-z0-9_-]+)/)[1];
await open(buhr); await guides_off(); await page.mouse.move(5, 5); await frame();
await shot("buhr", { panel: "aside" });
links.buhr = buhr;
// the same dial's own link pane, so the address on page 01 and the link card agree
await tab("Export"); await page.mouse.move(5, 5); await frame();
await shot("buhr-export", { panel: "aside" });
rects["buhr-export"].pane_link = await pane("Link to this dial");
links.buhr_live = await page.evaluate(() => location.hash);          // the address as the tool rewrote it
// the same dial's diameter in millimetres, then in lignes (page 01: the unit box's tidbit)
await tab("Dial"); await page.mouse.move(5, 5); await frame();
await shot("buhr-mm", { row: "#global-dial-d-Diameter-slider, #global-dial-d-Diameter, #global-dial-d-Diameter ~ *", label: "label[for=global-dial-d-Diameter], #global-dial-d-Diameter-slider" });
await page.click("#unit"); await page.waitForTimeout(200);
await page.click('#unit-menu >> text=Lignes'); await page.waitForTimeout(200); await page.mouse.move(5, 5); await frame();
await shot("buhr-lig", { row: "#global-dial-d-Diameter-slider, #global-dial-d-Diameter, #global-dial-d-Diameter ~ *", unit: "#unit" });
await open(diver);
fs.writeFileSync(path.join(IMG, "dial-diver.json"), JSON.stringify(await page.evaluate(() => window.dial_tool.S)));
await tab("Rings");
await shot("diver-rings", { list: ".ringlist", rows: ".ringlist li.ring", panel: "aside", add: "#ring-add", up: "#ring-up", down: "#ring-down", dup: "#ring-duplicate", del: "#ring-delete" });
// the + pressed on the same list: closed and open at the same crop (Okay: two states of one control, same size)
await page.click("#ring-add"); await page.waitForTimeout(200);
await shot("diver-add", { menu: "#add-menu", plus: "#ring-add" });
await page.keyboard.press("Escape"); await frame();
// the radius button's pop-up on a numerals ring: the number and its anchor menu (page 06: the Watch's picture)
await page.click('.ringlist li.ring:has-text("Bezel: 10")'); await frame(); await page.waitForTimeout(150);
await page.mouse.click(page.viewportSize().width - 5, 5); await frame();
await page.click("#ring-r"); await page.waitForTimeout(300); await frame();
await shot("diver-radius", { pop: "#value-pop", r: "#ring-r", list: ".ringlist" });
await page.keyboard.press("Escape"); await frame();
// Scale everything with it
await open(); await tab("Export"); await page.click('button:text-is("Defaults")'); await ready(); await frame();
await export_svg("scale-30");
await tab("Dial"); await page.fill("#global-dial-d-Diameter", "36"); await page.press("#global-dial-d-Diameter", "Enter"); await page.waitForTimeout(400);
await export_svg("scale-off");
await page.fill("#global-dial-d-Diameter", "30"); await page.press("#global-dial-d-Diameter", "Enter"); await page.waitForTimeout(300);
await page.check("#global-ui-scale-Scale-everything-with-it");
await page.fill("#global-dial-d-Diameter", "36"); await page.press("#global-dial-d-Diameter", "Enter"); await page.waitForTimeout(400);
await export_svg("scale-on");
// the cover: the finished dial, and the same dial as the print mask
await open(links["step-10"]);
await page.evaluate(() => { const t = window.dial_tool; t.S.out_production = true; t.render(); });
await export_svg("dial-mask");

fs.writeFileSync(path.join(IMG, "rects.json"), JSON.stringify({ viewport: [1440, 900], scale: 3, rects, links }, null, 1));
await browser.close();
