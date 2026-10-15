// shots.mjs — the guide's pictures, taken from the app as a person would reach them (guide/PLAN.md §2, step 7).
// Cold start: a fresh browser with nothing kept; the First dial opened by its link (guide/checks/first-dial.json);
// from there only taps on what the screen names. Measuring where things sit reads the page; acting never does.
//
//   cd web && node ../guide/look/shots.mjs [app.html]    → guide/look/img/*.png, *.svg, rects.json
//
// iPad held landscape, 1180 × 820 points, 3 pixels a point (so a crop at 0.2 mm a point prints at 381 dpi);
// the phone 390 × 844. Guides off in every picture (the reader's link keeps them as they are).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const WEB = process.cwd(), APP = path.resolve(process.argv[2] || path.join(WEB, "dial-tool.html"));
const HERE = path.dirname(new URL(import.meta.url).pathname), IMG = path.join(HERE, process.env.SHOTS_OUT || "img");
fs.mkdirSync(IMG, { recursive: true });
const FIRST = JSON.parse(fs.readFileSync(path.join(HERE, "../checks/first-dial.json"), "utf8"));
const FINAL = FIRST.steps.find((s) => s.n === 9).link;
const version = fs.readFileSync(APP, "utf8").match(/beta \d+\.\d+(\.\d+)?/)[0];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const rects = {}, links = {};
let page, context;
async function cold(viewport, scale, hash) {                    // a new browser: nothing kept from before
  if (context) await context.close();
  context = await browser.newContext({ viewport, deviceScaleFactor: scale, hasTouch: true, acceptDownloads: true, reducedMotion: "reduce" });
  await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
  page = await context.newPage();
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.goto("file://" + APP + hash);
  await page.getByRole("heading", { name: "Dial Tool" }).waitFor();
  await page.waitForTimeout(1500);
}
const wait = (ms = 350) => page.waitForTimeout(ms);
const tap = async (loc) => { await loc.first().tap(); await wait(); };
const button = (name, exact = true) => page.getByRole("button", { name, exact }).filter({ visible: true });
const tab = (name) => tap(button(name));
const ring = async (name) => {           // a ring's row: a tap at its right end (its name is a field of its own)
  const row = page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) }).first(), b = await row.boundingBox();
  await row.tap({ position: { x: b.width - 12, y: b.height / 2 } }); await wait();
};
const guides_off = async () => { const g = button("Guides"); if ((await g.getAttribute("aria-pressed")) === "true") await tap(g); };
/** where something sits, in points: a locator, or a list of them (their union) */
async function box(...locs) {
  const bs = [];
  for (const l of locs) for (const e of await l.all()) { const b = await e.boundingBox(); if (b && b.width && b.height) bs.push(b); }
  if (!bs.length) return null;
  const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y));
  return [x, y, Math.max(...bs.map((b) => b.x + b.width)) - x, Math.max(...bs.map((b) => b.y + b.height)) - y].map((v) => Math.round(v * 10) / 10);
}
async function shot(name, parts = {}) {
  await page.mouse.move(2, 2);
  await page.screenshot({ path: path.join(IMG, name + ".png") });
  rects[name] = {};
  for (const [k, v] of Object.entries(parts)) { rects[name][k] = await box(...[].concat(v)); if (!rects[name][k]) console.log(`  missing: ${name}.${k}`); }
  console.log("shot", name);
}
async function export_svg(name) {
  await tab("Export");
  const [d] = await Promise.all([page.waitForEvent("download"), button("SVG").first().tap()]);
  await d.saveAs(path.join(IMG, name + ".svg"));
}
const row_of = (name) => page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) }).first();
const css = (q) => page.locator(q).filter({ visible: true });

// ── 1 · the iPad window: the First dial, Rings, Markers selected ──
await cold({ width: 1180, height: 820 }, 3, FINAL);
await guides_off();
await tab("Rings"); await ring("Markers");
const W = {
  logo: css(".logo"), name: page.getByRole("heading", { name: "Dial Tool" }), version: page.getByText(version, { exact: true }), help: page.getByRole("link", { name: "Help" }),
  gallery: button("Gallery"), unit: css("#unit"), tabs: css(".tabs"),
  tab_dial: button("Dial"), tab_rings: button("Rings"), tab_hands: button("Hands"), tab_windows: button("Windows"), tab_export: button("Export"),
  list_head: page.getByText("Rings, top first", { exact: true }), tools: css("#ring-add, #ring-up, #ring-down, #ring-duplicate, #ring-delete"),
  rows: page.getByRole("listitem").filter({ has: page.getByText(/^(Numerals|Markers|Minute ticks)$/) }),
  row_numerals: row_of("Numerals"), row_markers: row_of("Markers"), row_ticks: row_of("Minute ticks"),
  drawer: css(".ringline, .lineholder"), kinds: css("[id^=ring-kind-Kind-]"), colour: css("[id^=ring-c-]"),
  size_button: button(/^Length/, false), radius_button: button(/^Outer radius/, false),
  shape_eye: css(".pane button.fold").filter({ hasText: "Shape" }),
  undo: css("#undo"), redo: css("#redo"), guides: css("#guides, #guides-more"), backdrop: button("Backdrop"), shadows: css("#shadows, #shadows-more"),
  alone: css("#eye-box"), showcase: css("#iris-box"),
  play: css("#play"), speed: css("#speed"), time: css("#time"), ampm: css("#ampm"), now: css("#now"), day: css("#time-slider"), pose: button("10:10"),
  zoom: css("#zoom-out, #zoom-in"), fit: css("#fit"), panel: css("aside, .panel"), preview: css("main"), bar: css(".bar"),
};
await shot("window", W);
rects.window.row_eye = await box(page.getByRole("button", { name: "Show Markers" }));
rects.window.row_rename = await box(page.getByRole("button", { name: "Rename this ring" }).filter({ visible: true }));
{ const r = row_of("Markers");
  rects.window.row_grip = await box(r.locator(".grip, [class*=grip]"));
  rects.window.row_name = await box(r.getByText("Markers", { exact: true }));
  rects.window.row_count = await box(r.getByText("8 markers", { exact: true }));
  rects.window.row_chip = await box(r.locator(".chip, .swatch, [class*=chip], [class*=swatch]"));
  rects.window.row_values = await box(r.getByText("2.4", { exact: true }), r.getByText("16.2", { exact: true }));
  rects.window.drawer_chip = await box(css("[id^=ring-c-]"));
}
rects.window.dial = await page.evaluate(() => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return [r.left + t.c[0], r.top + t.c[1], t.z]; });     // centre (pt) and points a millimetre

// the radius button's pop-up, open (the same crop as closed: two states of one control)
await tap(button(/^Outer radius/, false));
await shot("pop", { pop: css(".valuepop, #value-pop, [role=dialog]"), radius_button: button(/^Outer radius/, false), drawer: css(".ringline, .lineholder") });
await page.mouse.click(1100, 790); await wait();         // a tap elsewhere closes it

// a pane folded: the Shape pane's eye, pressed (and pressed again)
const shape = css(".pane button.fold").filter({ hasText: "Shape" });
await tap(shape);
await shot("folded", { shape_eye: shape, panes: css(".form .pane") });
await tap(shape);

// the colour pop-out from the selected ring's chip
await tap(css("[id^=ring-c-]"));
await shot("colour", { pop: css(".pop, [id^=pop-]"), close: button("Close"), wide: css("#pop-wide") });
await tap(button("Close"));

// every row not selected (the list taken apart, page 01): the Markers row from a state where Numerals is selected
await ring("Numerals");
await shot("rows-b", { kinds: css("[id^=ring-kind-Kind-]"), row_markers: row_of("Markers"), row_numerals: row_of("Numerals"), row_ticks: row_of("Minute ticks"), drawer: css(".ringline, .lineholder"), size_button: button(/^Size/, false), radius_button: button(/^Centre radius/, false) });
// the font sheet, from Numerals' Type pane
await tap(button("Change…"));
await shot("font", { sheet: css("dialog[open]"), search: page.getByRole("searchbox", { name: "Find a font" }) });
await page.mouse.click(1170, 810); await wait();
links.final = await page.evaluate(() => location.hash);

// ── 2 · the dials: the tool's own SVG export, the final dial and each step of the First dial ──
await export_svg("dial-final");
// the maker's two files: the print mask, and the colour file with the hands hidden
await tab("Export"); await tap(page.getByRole("checkbox", { name: "Mono print mask", exact: true }));
await export_svg("dial-mask");
await tap(page.getByRole("checkbox", { name: "Mono print mask", exact: true }));
await tab("Hands"); await tap(page.getByRole("checkbox", { name: "Show hands", exact: true }));
await export_svg("dial-nohands");
await tab("Hands"); await tap(page.getByRole("checkbox", { name: "Show hands", exact: true }));
for (const s of FIRST.steps) {
  await cold({ width: 1180, height: 820 }, 1, s.link);
  await export_svg(`step-${s.n}`); links[`step-${s.n}`] = s.link;
}
console.log("dials exported");

// ── 3 · the phone: the same dial, the drawer at its start ──
await cold({ width: 390, height: 844 }, 3, FINAL);
await guides_off();
await tab("Rings");
await shot("phone", { bar: css(".bar"), play: css("#play"), grip: css(".sheetgrip"), title: css(".mast"), help: page.getByRole("link", { name: "Help" }), gallery: button("Gallery"), unit: css("#unit"), preview: css("main"), panel: css("aside, .panel"), tabs: css(".tabs"), alone: css("#eye-box"), showcase: css("#iris-box"), undo: css("#undo, #redo"), guides: css("#guides, #guides-more"), rows: page.getByRole("listitem").filter({ has: page.getByText(/^(Numerals|Markers|Minute ticks)$/) }) });

fs.writeFileSync(path.join(IMG, "rects.json"), JSON.stringify({ when: new Date().toISOString(), version, viewport: [1180, 820], phone: [390, 844], scale: 3, rects, links }, null, 1) + "\n");
await browser.close();
console.log(`shots: ${version} → ${path.relative(process.cwd(), IMG)}`);
