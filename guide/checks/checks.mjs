// checks.mjs — the guide's behavioural checks (guide/PLAN.md §0, §5). Each check does what a person does — taps and
// types by the names on screen, reloads, opens links, exports files — then looks at what came out: what the screen
// says, or the exported file (a person's own output). Every "do X and Y happens" sentence in the guide names its check
// (<!-- check: B8 --> after the sentence); the build refuses a sentence whose check doesn't pass.
//
//   cd web && node build.mjs && node ../guide/checks/checks.mjs [B8 B10 …]   → guide/checks/out/results.json, screenshots
//
// One exception to "like a person": to tap a spot on the dial given in millimetres, the preview's scale is read
// (where a person would simply look). Nothing else reads the app's insides.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const WEB = process.cwd();                       // run from web/
const APP = "file://" + path.join(WEB, "dial-tool.html");
const OUT = path.join(WEB, "../guide/checks/out");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const only = process.argv.slice(2);

// ── a fresh browser, as a newcomer has: no dial kept from before ──
async function fresh({ width = 1180, height = 820, hash = "" } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, acceptDownloads: true, reducedMotion: "reduce" });
  await context.route("https://duztman.github.io/dial-tool/fonts/**", (r) => r.fulfill({ path: path.join(WEB, "fonts", decodeURIComponent(r.request().url().split("/fonts/")[1])), headers: { "access-control-allow-origin": "*" } }));
  const page = await context.newPage();
  await page.goto(APP + hash);
  await page.getByRole("heading", { name: "Dial Tool" }).waitFor();
  await page.waitForTimeout(600);
  return { context, page, ...tools(page) };
}
function tools(page) {
  const t = {
    tab: (name) => page.getByRole("button", { name: name === "Windows" ? "Windows" : name, exact: true }).first().click().then(() => page.waitForTimeout(250)),
    field: (label) => page.getByRole("textbox", { name: label, exact: true }).first(),
    type: async (label, value) => { const f = t.field(label); await f.fill(String(value)); await f.press("Enter"); await page.waitForTimeout(250); },
    value: (label) => t.field(label).inputValue(),
    button: (name, exact = true) => page.getByRole("button", { name, exact }).first(),
    say: (text) => page.getByText(text, { exact: false }).first().isVisible().catch(() => false),
    defaults: async () => { await t.tab("Export"); await t.button("Defaults").click(); await page.waitForTimeout(500); },
    ring: async (name) => {                        // select a ring by its row: a press on the row's right end (a press on the selected name renames it)
      await t.tab("Rings");
      const row = page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) }).first(), b = await row.boundingBox();
      await row.click({ position: { x: b.width - 12, y: b.height / 2 } }); await page.waitForTimeout(250);
    },
    save: async (button, name) => {
      await t.tab("Export");
      const [d] = await Promise.all([page.waitForEvent("download"), t.button(button).click()]);
      const file = path.join(OUT, name || d.suggestedFilename()); await d.saveAs(file);
      return { file, suggested: d.suggestedFilename(), text: /\.(svg)$/.test(file) ? fs.readFileSync(file, "utf8") : null };
    },
    tick: async (name, on = true) => { const c = page.getByRole("checkbox", { name, exact: true }).first(); if ((await c.isChecked()) !== on) await c.click(); await page.waitForTimeout(250); },
    shot: (name) => page.screenshot({ path: path.join(OUT, name + ".png") }),
    /** tap the dial at clock angle a (0 = 12, clockwise) and radius r in mm */
    tap_dial: async (a, r) => {
      const p = await page.evaluate(([a, r]) => { const t = window.dial_tool, b = t.svg.getBoundingClientRect(), x = r * Math.sin(a * Math.PI / 180), y = r * Math.cos(a * Math.PI / 180); return [b.left + t.c[0] + x * t.z, b.top + t.c[1] - y * t.z]; }, [a, r]);
      await page.mouse.click(p[0], p[1]); await page.waitForTimeout(300);
    },
  };
  return t;
}
/** shapes of one id in an exported SVG: how many separate outlines (M commands) */
const outlines = (svg, id) => { const m = svg.match(new RegExp(`id="${id}"[^>]*\\sd="([^"]*)"`)) || svg.match(new RegExp(`\\sd="([^"]*)"[^>]*id="${id}"`)); return m ? (m[1].match(/M/g) || []).length : 0; };
/** choose a picture tile by its name (a radio whose dot is hidden: its tile is what a person presses) */
const pick = async (page, name) => { const r = page.getByRole("radio", { name, exact: true }).first(); if (await r.isVisible()) await r.click(); else await r.locator("xpath=..").click(); };
const t_ring = (page) => page.getByRole("button", { name: "Rings", exact: true }).first().click();
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const ids = (svg) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

const CHECKS = {
  async B1() {        // kept in this browser and the address
    const { page, type, value, context } = await fresh();
    await type("Diameter", 25); await page.waitForTimeout(1200);
    const hash = await page.evaluate(() => location.hash);
    await page.reload(); await page.getByRole("heading", { name: "Dial Tool" }).waitFor(); await page.waitForTimeout(600);
    const after = await value("Diameter");
    const p2 = await context.newPage(); await p2.goto(APP); await p2.getByRole("heading", { name: "Dial Tool" }).waitFor(); await p2.waitForTimeout(600);
    const later = await tools(p2).value("Diameter");
    await context.close();
    return { ok: after.startsWith("25") && later.startsWith("25") && hash.length > 3, note: `after reload ${after}, a later visit ${later}` };
  },
  async B1p() {       // …but not while time plays (#234)
    const { page, type, value, button, context } = await fresh();
    await button("Play").click(); await page.waitForTimeout(400);
    await type("Diameter", 25); await page.waitForTimeout(1500);
    const p2 = await context.newPage(); await p2.goto(APP); await p2.getByRole("heading", { name: "Dial Tool" }).waitFor(); await p2.waitForTimeout(600);
    const elsewhere = await tools(p2).value("Diameter"); await p2.close();
    await button("Play").click().catch(() => button("Pause").click()); await page.waitForTimeout(1200);
    const p3 = await context.newPage(); await p3.goto(APP); await p3.getByRole("heading", { name: "Dial Tool" }).waitFor(); await p3.waitForTimeout(600);
    const stopped = await tools(p3).value("Diameter");
    await context.close();
    return { ok: !elsewhere.startsWith("25") && stopped.startsWith("25"), note: `while playing another tab saw ${elsewhere}; after stopping ${stopped}` };
  },
  async B2() {        // a link: the dial and the time, not the tab, the selected ring or the unit
    const a = await fresh();
    await a.type("Diameter", 27); await a.button("mm").click(); await a.page.getByRole("menuitemradio", { name: /in/ }).first().click().catch(() => a.page.getByText("in", { exact: true }).first().click());
    await a.page.waitForTimeout(1200); const shown = await a.value("Diameter"); await a.tab("Hands");
    const link = await a.page.evaluate(() => location.hash); await a.context.close();
    const b = await fresh({ hash: link });
    const d = await b.value("Diameter"), unit = await b.button(/^(mm|pt|in|lig)$/, false).innerText().catch(() => "?");
    const dialTab = await b.page.getByRole("textbox", { name: "Diameter", exact: true }).isVisible();
    await b.context.close();
    return { ok: !shown.startsWith("27") && d.startsWith("27") && /mm/.test(unit) && dialTab, note: `before: diameter shown ${shown} (another unit); opened: diameter ${d}, unit ${unit}, on the Dial tab: ${dialTab}` };
  },
  async B3() {        // Defaults replaces the dial; ⌘Z brings the one before back
    const { page, defaults, value, tab, context } = await fresh();
    const before = await value("Diameter"); await defaults(); await tab("Dial");
    const after = await value("Diameter"); await page.keyboard.press("Meta+z"); await page.keyboard.press("Control+z"); await page.waitForTimeout(500);
    const undone = await value("Diameter"); await context.close();
    return { ok: before !== after && after.startsWith("30") && undone === before, note: `${before} → Defaults ${after} → undo ${undone}` };
  },
  async B4() {        // the starting dial asks for Helvetica Neue: "not loaded", Inter stands in
    const { page, defaults, ring, say, shot, context } = await fresh();
    await defaults(); await ring("Numerals");
    const nl = await say("not loaded"), hv = await say("Helvetica Neue"); await shot("B4-not-loaded"); await context.close();
    return { ok: nl && hv, note: `"not loaded" ${nl}, "Helvetica Neue" ${hv}` };
  },
  async B5() {        // tap a mark on the preview: its ring is selected, Rings opens
    const { page, defaults, tab, tap_dial, shot, context } = await fresh();
    await defaults(); await tab("Dial"); await tap_dial(6 * 7, 14.4 - 0.4);
    const rings = await page.getByRole("button", { name: "Rings, top first" }).isVisible();
    const count = await page.getByRole("textbox", { name: "Count", exact: true }).first().inputValue();      // the minute ticks are the ring with 60
    await shot("B5-tap"); await context.close();
    return { ok: rings && count === "60", note: `Rings open ${rings}; the selected ring's Count reads ${count}` };
  },
  async B6() {        // a ring changed to another kind and back is as it was
    const { page, defaults, ring, save, context } = await fresh();
    await defaults(); await ring("Markers");
    const a = (await save("SVG", "B6-a.svg")).text;
    await ring("Markers"); await pick(page, "band"); await page.waitForTimeout(300);
    await pick(page, "markers"); await page.waitForTimeout(300);
    await ring("Markers"); const b = (await save("SVG", "B6-b.svg")).text; await context.close();
    return { ok: a === b, note: a === b ? "identical exports" : "exports differ" };
  },
  async B7() {        // skip where drops the minute ticks under the markers above; nothing → all 60
    const { page, defaults, ring, save, context } = await fresh();
    await defaults();
    const a = outlines((await save("SVG", "B7-a.svg")).text, "minute-ticks");
    await ring("Minute ticks"); await page.getByRole("combobox", { name: "Skip where" }).first().selectOption({ index: 0 }); await page.waitForTimeout(300);
    const b = outlines((await save("SVG", "B7-b.svg")).text, "minute-ticks"); await context.close();
    return { ok: a === 48 && b === 60, note: `ticks with skip where: ${a}; with nothing: ${b}` };
  },
  async B8() {        // a shown window drops the numeral and the marker at its place; the minute tick there shows again
    const { page, defaults, tab, save, tick, context } = await fresh();
    await defaults(); await tick("Keep numerals as text in the SVG", true);
    const a = await save("SVG", "B8-a.svg");
    await tab("Windows"); await page.getByRole("tab", { name: /The window at 3/ }).first().click(); await tick("Show this window", true);
    const b = await save("SVG", "B8-b.svg"); await context.close();
    const na = texts(a.text), nb = texts(b.text);
    const m = [outlines(a.text, "markers"), outlines(b.text, "markers")], tk = [outlines(a.text, "minute-ticks"), outlines(b.text, "minute-ticks")];
    na.splice(na.indexOf("17"), na.includes("17") ? 1 : 0); nb.splice(nb.indexOf("17"), nb.includes("17") ? 1 : 0);      // the date's own number is text too
    return { ok: na.includes("3") && !nb.includes("3") && m[1] === m[0] - 1 && tk[1] === tk[0] + 1, note: `numerals ${na.length}→${nb.length} (3 gone: ${!nb.includes("3")}), markers ${m[0]}→${m[1]}, minute ticks ${tk[0]}→${tk[1]}` };
  },
  async B10() {       // the page is the diameter plus twice the margin; the file name gives the diameter
    const { defaults, save, context } = await fresh();
    await defaults(); const s = await save("SVG"); await context.close();
    const w = s.text.match(/width="([\d.]+)mm"/)?.[1];
    return { ok: +w === 36 && /dial-30mm/.test(s.suggested), note: `page ${w} mm, file ${s.suggested}` };
  },
  async B11() {       // colour export: hands and window content in; guides, backdrop, shadows never
    const { defaults, save, context } = await fresh();
    await defaults(); const s = (await save("SVG")).text; await context.close();
    const I = ids(s);
    return { ok: I.includes("hour-hand") && I.includes("seconds-hand") && !I.some((i) => /guide|backdrop|shadow/.test(i)), note: I.join(" ") };
  },
  async B12() {       // the mask: no plate, no hands; window and hole as cut lines
    const { page, defaults, tab, tick, save, context } = await fresh();
    await defaults(); await tab("Windows"); await page.getByRole("tab", { name: /The window at 3/ }).first().click(); await tick("Show this window", true);
    await tab("Export"); await tick("Mono print mask", true);
    const s = (await save("SVG", "B12-mask.svg")).text; await context.close();
    const I = ids(s), fills = new Set([...s.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]));
    return { ok: !I.includes("plate") && !I.some((i) => /hand/.test(i)) && I.some((i) => /cut-line/.test(i)) && I.includes("hole"), note: `ids: ${I.join(" ")} · fills: ${[...fills].join(" ")}` };
  },
  async B12b() {      // marks lying on a band vanish in the mask unless the band knocks them out
    const { page, defaults, ring, save, tick, tab, type, context } = await fresh();
    await defaults(); await t_ring(page); await page.getByRole("button", { name: "Add a ring" }).click(); await page.getByRole("menuitem", { name: /band/i }).filter({ visible: true }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Move down" }).click(); await page.getByRole("button", { name: "Move down" }).click(); await page.getByRole("button", { name: "Move down" }).click();
    await page.getByRole("button", { name: /Outer radius/ }).filter({ visible: true }).first().click(); await type("Outer radius", 14.6); await page.keyboard.press("Escape");
    await type("Band width", 3.2);                 // a band under the markers and the minute ticks
    await tab("Export"); await tick("Mono print mask", true);
    const a = (await save("SVG", "B12b-a.svg")).text;
    await ring("Band"); await page.getByRole("combobox", { name: "Knock out" }).first().selectOption({ index: 3 }); await page.waitForTimeout(300);
    const b = (await save("SVG", "B12b-b.svg")).text; await context.close();
    return { ok: outlines(a, "band") <= 2 && outlines(b, "band") > 2, note: `band outlines in the mask: plain ${outlines(a, "band")}, knocking out ${outlines(b, "band")}` };
  },
  async B13() {       // mirrored flips the export left to right
    const { defaults, tick, save, context } = await fresh();
    await defaults(); await tick("Mirrored, for toner transfer", true); const s = await save("SVG"); await context.close();
    return { ok: /scale\(-1 1\)/.test(s.text) && /mirrored/.test(s.suggested), note: s.suggested };
  },
  async B14() {       // knock-out cuts only round rings that are shown: hide the rings above and the band comes out solid
    const { page, defaults, ring, save, tick, tab, type, context } = await fresh();
    await defaults(); await t_ring(page); await page.getByRole("button", { name: "Add a ring" }).click(); await page.getByRole("menuitem", { name: /band/i }).filter({ visible: true }).first().click(); await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Move down" }).click();
    await page.getByRole("button", { name: /Outer radius/ }).filter({ visible: true }).first().click(); await type("Outer radius", 14.6); await page.keyboard.press("Escape");
    await type("Band width", 3.2); await page.getByRole("combobox", { name: "Knock out" }).first().selectOption({ index: 3 }); await page.waitForTimeout(300);
    await tab("Export"); await tick("Mono print mask", true);
    const a = outlines((await save("SVG", "B14-a.svg")).text, "band");
    await t_ring(page); for (const n of ["Numerals", "Markers", "Minute ticks"]) await page.getByRole("button", { name: "Show " + n, exact: true }).click();
    const b = outlines((await save("SVG", "B14-b.svg")).text, "band"); await context.close();
    return { ok: a > 2 && b === 2, note: `band outlines: rings above shown ${a}, hidden ${b}` };
  },
  async B20() {       // the showcase: its own view; pressing the switch again comes back as it was
    const { page, button, field, context } = await fresh();
    await button("The showcase").click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /Activate showcase/i }).click(); await page.waitForTimeout(1500);
    const seen = async () => { const b = await field("Diameter").boundingBox(); return !!b && b.x >= 0 && b.x + b.width <= 1180 && await field("Diameter").evaluate((e) => getComputedStyle(e.closest("aside, .panel") || e).opacity !== "0"); };
    const inside = await seen();
    await button("The showcase").click(); await page.waitForTimeout(2000);
    const back = await seen(); await page.screenshot({ path: path.join(OUT, "B20-back.png") }); await context.close();
    return { ok: !inside && back, note: `panel inside the showcase: ${inside}; after pressing the switch again: ${back}` };
  },
  async B15() {       // a number field takes 1.2 · +0.5 · x0.5 · /2
    const { type, value, context } = await fresh();
    const seen = []; for (const v of ["30", "+0.5", "x2", "/2"]) { await type("Diameter", v); seen.push(await value("Diameter")); }
    await context.close();
    return { ok: seen.join(" ") === "30.0 30.5 61.0 30.5", note: seen.join(" → ") };
  },
  async B18() {       // a PNG opens at true size: its dpi is written in it
    const { defaults, save, context } = await fresh();
    await defaults(); const s = await save("PNG"); await context.close();
    const b = fs.readFileSync(s.file), i = b.indexOf("pHYs"), ppm = i > 0 ? b.readUInt32BE(i + 4) : 0;
    return { ok: Math.abs(ppm * 0.0254 - 600) < 1, note: `${(ppm * 0.0254).toFixed(1)} dpi written` };
  },
  async B19() {       // keep numerals as text: text in the SVG only
    const { defaults, tick, save, context } = await fresh();
    await defaults(); const plain = (await save("SVG")).text; await tick("Keep numerals as text in the SVG", true);
    const s = (await save("SVG")).text, p = fs.readFileSync((await save("PDF")).file, "latin1"); await context.close();
    return { ok: texts(plain).length === 0 && texts(s).length === 12 && !/\/Font/.test(p), note: `SVG texts: plain ${texts(plain).length}, ticked ${texts(s).length}; PDF fonts ${/\/Font/.test(p)}` };
  },
  async B21() {       // numerals follow the positions in order: Count 4 gives 12 1 2 3; Count 12 + Every 3 gives 12 3 6 9
    const { defaults, ring, type, tick, save, context } = await fresh();
    await defaults(); await tick("Keep numerals as text in the SVG", true); await ring("Numerals");
    await type("Count", 4); const a = texts((await save("SVG")).text);
    await ring("Numerals"); await type("Count", 12); await type("Every", 3); const b = texts((await save("SVG")).text);
    await ring("Numerals"); await tick("Skip those instead", true); const c = texts((await save("SVG")).text); await context.close();
    return { ok: a.join(" ") === "12 1 2 3" && b.join(" ") === "12 3 6 9" && c.join(" ") === "1 2 4 5 7 8 10 11", note: `count 4: ${a.join(" ")} · every 3: ${b.join(" ")} · skip those instead: ${c.join(" ")}` };
  },
  async B22() {       // the 10:10 step sets 10:10:00
    const { page, button, context } = await fresh();
    await page.getByRole("button", { name: /10:10/ }).first().click(); await page.waitForTimeout(300);
    const v = await page.getByRole("textbox", { name: /Time shown/ }).inputValue(); await context.close();
    return { ok: /10:10:00/.test(v), note: v };
  },
  async B23() {       // a Gallery dial replaces yours; undo brings it back
    const { page, button, value, tab, context } = await fresh();
    const before = await value("Diameter"); await button("Gallery").click(); await page.getByRole("link", { name: "Field", exact: true }).click(); await page.waitForTimeout(800);
    await tab("Dial"); const field = await value("Diameter"); await page.keyboard.press("Control+z"); await page.waitForTimeout(500); const back = await value("Diameter"); await context.close();
    return { ok: field !== before && back === before, note: `${before} → Field ${field} → undo ${back}` };
  },
};

Object.assign(CHECKS, {
  async B24() {       // the drawer's size and radius buttons: press one to type a number
    const { page, defaults, ring, type, value, context } = await fresh();
    await defaults(); await ring("Numerals");
    await page.getByRole("button", { name: /^Centre radius/ }).filter({ visible: true }).first().click(); await page.waitForTimeout(300);
    await type("Centre radius", 11.5); const r = await page.getByRole("button", { name: /^Centre radius/ }).filter({ visible: true }).first().getAttribute("aria-label");
    const field = page.getByRole("textbox", { name: /^(Centre radius|1\.2 sets)/ }).filter({ visible: true }), was = await field.count();
    await page.getByRole("heading", { name: "Dial Tool" }).click(); await page.waitForTimeout(300);      // a tap elsewhere
    const left = await page.locator("[aria-expanded='true'].valueb").count(); await context.close();
    return { ok: /11\.5/.test(r || "") && left === 0, note: `after typing 11.5 the button reads "${r}"; after a tap elsewhere the pop-up is ${left ? "still open" : "closed"}` };
  },
  async B25() {       // with the mono print mask on, the dial on screen shows the mask (the plate goes white)
    const { page, tab, tick, context } = await fresh();
    const px = async () => { const buf = await page.screenshot({ clip: { x: 900, y: 600, width: 1, height: 1 } }); return buf; };
    await tab("Export"); const a = await page.screenshot({ clip: { x: 760, y: 140, width: 420, height: 420 } });
    await tick("Mono print mask", true); await page.waitForTimeout(400);
    const b = await page.screenshot({ path: path.join(OUT, "B25-mask-on.png"), clip: { x: 760, y: 140, width: 420, height: 420 } }); await context.close();
    return { ok: !a.equals(b), note: "the preview changed when the mask went on (see B25-mask-on.png)" };
  },
  async B26() {       // hands hidden: no hands in the file
    const { page, defaults, tab, tick, save, context } = await fresh();
    await defaults(); await tab("Hands"); await tick("Show hands", false); const I = ids((await save("SVG")).text); await context.close();
    return { ok: !I.some((i) => /hand/.test(i)), note: I.join(" ") };
  },
  async B27() {       // a PDF has one layer per ring, named as in the list
    const { defaults, save, context } = await fresh();
    await defaults(); const p = fs.readFileSync((await save("PDF")).file, "latin1"); await context.close();
    const names = [...p.matchAll(/\/OCG \/Name <FEFF([0-9A-F]*)>/g)].map((m) => Buffer.from(m[1], "hex").swap16().toString("utf16le"));      // UTF-16 names
    return { ok: ["Numerals", "Markers", "Minute ticks"].every((n) => names.includes(n)), note: names.join(" · ") };
  },
  async B28() {       // the font sheet stays open after a font is chosen; a tap outside it closes it
    const { page, defaults, ring, context } = await fresh({ width: 1180, height: 820 });
    await defaults(); await ring("Numerals");
    await page.getByRole("button", { name: "Change…", exact: true }).filter({ visible: true }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("searchbox", { name: "Find a font" }).fill("Jost"); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Jost/ }).first().click(); await page.waitForTimeout(800);
    const open = await page.getByRole("searchbox", { name: "Find a font" }).isVisible();
    await page.mouse.click(1170, 810); await page.waitForTimeout(400);       // outside the sheet, the window's corner
    const closed = !(await page.getByRole("searchbox", { name: "Find a font" }).isVisible());
    const font = await page.getByText("Jost", { exact: true }).filter({ visible: true }).count(); await context.close();
    return { ok: open && closed && font > 0, note: `after choosing: open ${open}; after a tap outside: closed ${closed}; Jost shown ${font > 0}` };
  },
  async B28p() {      // a phone: the font sheet covers the dial too; a tap on the dark bar at the top closes it
    const { page, defaults, ring, context } = await fresh({ width: 390, height: 844 });
    await defaults(); await ring("Numerals");
    await page.getByRole("button", { name: "Change…", exact: true }).filter({ visible: true }).first().click(); await page.waitForTimeout(400);
    await page.getByRole("searchbox", { name: "Find a font" }).fill("Jost"); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Jost/ }).first().click(); await page.waitForTimeout(800);
    const open = await page.getByRole("searchbox", { name: "Find a font" }).isVisible();
    await page.mouse.click(250, 12); await page.waitForTimeout(400);
    const closed = !(await page.getByRole("searchbox", { name: "Find a font" }).isVisible()); await context.close();
    return { ok: open && closed, note: `phone: open after choosing ${open}; a tap on the top bar closes it ${closed}` };
  },
  async B29() {       // the eye beside a pane's name folds the pane, and opens it again
    const { page, field, context } = await fresh();
    const head = page.getByRole("button", { name: /^Page/ }).filter({ visible: true }).first();
    const tapHead = async () => { const b = await head.boundingBox(); await page.mouse.click(b.x + 12, b.y + b.height / 2); await page.waitForTimeout(500); };      // its eye, at the left
    await tapHead(); const folded = !(await field("Page margin").isVisible());
    await tapHead(); const open = await field("Page margin").isVisible(); await context.close();
    return { ok: folded && open, note: `folded: ${folded}; open again: ${open}` };
  },
  async B30() {       // a colour's pop-out: its × closes it; the square beside it doubles its size
    const { page, context } = await fresh();
    await page.getByRole("button", { name: "Plate" }).first().click(); await page.waitForTimeout(300);
    const box = await page.getByRole("button", { name: "Twice the size, and back" }).isVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click(); await page.waitForTimeout(300);
    const gone = !(await page.getByRole("button", { name: "Twice the size, and back" }).isVisible()); await context.close();
    return { ok: box && gone, note: `square "twice the size" ${box}; closed by × ${gone}` };
  },
  async B31() {       // the card at 6 is Window 3 in the colour list (Window 1 is the card at 3, then 12, 6, 9)
    const { page, defaults, tab, tick, context } = await fresh();
    await defaults(); await tab("Windows"); await page.getByRole("tab", { name: /The window at 6/ }).first().click(); await tick("Show this window", true);
    await tab("Dial"); const w3 = await page.getByText("Window 3", { exact: false }).filter({ visible: true }).count(); await context.close();
    return { ok: w3 > 0, note: `"Window 3" in Dial › Colours: ${w3 > 0}` };
  },
});

const results = {};
for (const [id, fn] of Object.entries(CHECKS)) {
  if (only.length && !only.includes(id)) continue;
  try { results[id] = await fn(); } catch (e) { results[id] = { ok: false, note: "error: " + e.message.split("\n")[0] }; }
  console.log((results[id].ok ? "pass  " : "FAIL  ") + id.padEnd(5) + results[id].note);
}
const version = fs.readFileSync(path.join(WEB, "src/geometry.js"), "utf8").match(/VERSION = "([^"]+)"/)[1];
const file = path.join(WEB, "../guide/checks/results.json");
const kept = only.length && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")).results : {};      // a partial run keeps the others' last results
fs.writeFileSync(file, JSON.stringify({ when: new Date().toISOString(), version, results: { ...kept, ...results } }, null, 1) + "\n");
await browser.close();
process.exit(Object.values(results).every((r) => r.ok) ? 0 : 1);
