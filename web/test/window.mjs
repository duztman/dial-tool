// window.mjs — runs the built page (dial-tool.html) in a real browser and uses it:
// sections, rows, the ring list, clicking the preview, round ends, fonts, exports, save and load.
//
//   cd web && node build.mjs && node test/window.mjs [settings.json]
//
// Writes screenshots and the exported files to web/test/out/. Exits 1 if anything failed.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "test/out";
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const check = (ok, what) => { console.log((ok ? "ok    " : "FAIL  ") + what); if (!ok) problems.push(what); };
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true, reducedMotion: "reduce" });      // panes fold at once here; their slide has a check of its own
await context.grantPermissions(["local-fonts"]).catch(() => {});
// the tool's own fonts come from its site; here they are served from web/fonts/, so the test needs no network
await context.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
const settings = process.argv[2];
if (settings) await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("dial-tool-last", s); sessionStorage.setItem("seeded", "1"); } }, fs.readFileSync(settings, "utf8"));
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });

const S = (expr) => page.evaluate(`(() => { const t = window.dial_tool, S = t.S; return ${expr}; })()`);
/** set a colour the way a person does: open its pill's pop-out, type the hex there, close it. */
const type_hex = async (id, hex) => { await page.click("#" + id); await page.click("#pop-as-HEX"); await page.fill("#pop-hex", hex); await page.press("#pop-hex", "Enter"); await page.click("#pop-close"); };
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const tab = async (name) => { await page.click(`button[data-tab="${name}"]`); await frame(); };
const shot = async (name) => { await frame(); await page.screenshot({ path: path.join(OUT, name + ".png") }); };
/** click the preview at a spot given in dial millimetres (y up). */
const click_mm = async (x, y) => {
  const p = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return [r.left + t.c[0] + x * t.z * (t.S.out_mirror ? -1 : 1), r.top + t.c[1] - y * t.z]; }, [x, y]);
  await page.mouse.click(p[0], p[1]);
  await frame();
};
const clock = (r, a) => [r * Math.sin(a * Math.PI / 180), r * Math.cos(a * Math.PI / 180)];
const download = async (selector) => {
  const [d] = await Promise.all([page.waitForEvent("download"), page.click(selector)]);
  const file = path.join(OUT, d.suggestedFilename());
  await d.saveAs(file);
  return file;
};

// ── start with the default dial ──
await tab("Export");
await page.click('button:text-is("Defaults")');
await page.waitForFunction(() => window.dial_tool.statik);
await frame();
check(await S("S.rings.length === 3 && S.dial_d === 30"), "Defaults: the starting dial, three rings");
await shot("1-default");

// ── a number row: slider, typed field with shorthand, stepper ──
await tab("Dial");
await page.fill("#global-dial-d-Diameter", "36");
await page.press("#global-dial-d-Diameter", "Enter");
check(await S("S.dial_d === 36"), "typed 36 → diameter 36");
await page.fill("#global-dial-d-Diameter", "+0.5");
await page.press("#global-dial-d-Diameter", "Enter");
check(await S("S.dial_d === 36.5"), "typed +0.5 → 36.5");
await page.fill("#global-dial-d-Diameter", "x2");
await page.press("#global-dial-d-Diameter", "Enter");
check(await S("S.dial_d === 73") && await page.$eval("#global-dial-d-Diameter-slider", (e) => +e.max === 73), "typed x2 → 73, and the slider grew to hold it");
await page.fill("#global-dial-d-Diameter", "30");
await page.press("#global-dial-d-Diameter", "Enter");
await page.click(".row.num:has(#global-dial-d-Diameter) .step >> nth=1");
check(near(await S("S.dial_d"), 30.1, 1e-9), "stepper + → 30.1");
await page.fill("#global-dial-d-Diameter", "30");
await page.press("#global-dial-d-Diameter", "Enter");
await page.$eval("#global-dial-d-Diameter-slider", (e) => { e.value = 31; e.dispatchEvent(new Event("input", { bubbles: true })); });
check(await S("S.dial_d === 31") && await page.inputValue("#global-dial-d-Diameter") === "31.0", "slider → 31, the field follows");
await page.fill("#global-dial-d-Diameter", "30");
await page.press("#global-dial-d-Diameter", "Enter");

// ── clicking the preview opens the settings of what was clicked ──
await click_mm(...clock(10, 120));                                  // the numeral 4
check(await S("S.ui_section === 1 && ['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'numerals' && t.nudge_at === '4'"), "click the numeral 4 → Rings, the numerals ring, and Nudge is set to that numeral");
await click_mm(...clock(13, 150));                                  // the marker at 5
check(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'markers'"), "click a marker → the markers ring");
await click_mm(...clock(13.9, 93));                                 // beside a thin tick (in its zone)
check(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'ticks'"), "click in the ticks' zone → the ticks ring");
const hands = await S("(() => { const a = [S.t / 43200 * 360, (S.t % 3600) / 3600 * 360]; return a; })()");
await click_mm(...clock(6, hands[0]));
check(await S("S.ui_section === 2 && S.ui_hand === 0"), "click the hour hand → Hands, Hour");
await click_mm(...clock(11, hands[1]));
check(await S("S.ui_section === 2 && S.ui_hand === 1"), "click the minute hand → Hands, Minute");
await click_mm(0.5, 3);
check(await S("S.ui_section === 0"), "click the bare plate → Dial");
await tab("Date");
await page.check("#window-on-Show-this-window");
await frame();
await click_mm(...clock(await S("S.da_r"), 90));
check(await S("S.ui_section === 3"), "click the date window → Date");
await shot("2-date");

// ── round ends: markers (one click) and hands ──
await click_mm(...clock(13, 150));
await page.click('button:text-is("Round both ends")');
check(await S("S.rings[S.ui_ring].round_out === 0.35 && S.rings[S.ui_ring].round_in === 0.35"), "Round both ends → both radii = half the marker's width");
await click_mm(...clock(13.9, 93));
await page.fill("#ring-w-Width-", "0.3");
await page.press("#ring-w-Width-", "Enter");
await page.click('button:text-is("Round both ends")');
await click_mm(...clock(6, hands[0]));
await page.fill("#hand-round-Round-ends", "2");
await page.press("#hand-round-Round-ends", "Enter");
await page.click('.segs button:text-is("Minute")');
await page.fill("#hand-round-Round-ends", "2");
await page.press("#hand-round-Round-ends", "Enter");
check(await S("S.ha_hour.round === 2 && S.ha_minute.round === 2"), "Round ends on the hour and minute hands");
const hour = await S("(() => { const p = t.items.find((i) => i.role === 'hand' && i.name === 'hour').path; return { curves: p.d.filter((c) => c[0] === 'C').length, b: p.bounds() }; })()");
check(hour.curves === 4 && near(hour.b[3], await S("S.ha_hour.len"), 1e-6), "the hour hand has four rounded corners and keeps its length");
await shot("3-round-ends");

// ── the ring list: add, rename, hide, duplicate, move, delete ──
await tab("Rings");
const before = await S("S.rings.length");
await page.click("#ring-add");
await page.click("#add-band");
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].kind === 3`), "Add Band → a band ring, selected");
const row_look = await page.$$eval(".ringlist li.ring", (l) => l.map((e) => { const c = getComputedStyle(e); return (e.classList.contains("on") ? "on " : "") + c.borderTopWidth + " " + c.backgroundColor; }));
// the selected row has the colour of the selected ring's guide (13 Oct 2026); with that guide set to None, the light blue of before
const guide_row = await page.evaluate(() => { const t = window.dial_tool, bg = () => getComputedStyle(document.querySelector(".ringlist li.ring.on")).backgroundColor; const was = t.ring().guide, a = bg(); t.set_value("ring", "guide", -2); const b = bg(); t.set_value("ring", "guide", was); return [a, b, bg(), t.S.gd_k_sel]; });
check(row_look.every((x) => x.includes("1px")) && row_look.filter((x) => x.startsWith("on ")).length === 1 && guide_row[1] === "rgb(207, 228, 245)" && guide_row[0] !== guide_row[1] && guide_row[0] === guide_row[2] && !/255, 255, 255/.test(guide_row[0]),
  `every ring is a framed row; the selected one is tinted with its own guide's colour (${guide_row[0]}), light blue when it has none`);
// a ring's row says what the ring is, in the drawer's order (13 Oct 2026): name · how many of what kind · its colour · its size · its radius
const sums = await page.$$eval(".ringlist li.ring", (l) => l.map((e) => { const t = (q) => e.querySelector(q).textContent, x = (q) => Math.round(e.querySelector(q).getBoundingClientRect().left); return [t(".says-kind"), t(".says-size"), t(".says-r"), [x(".name") < x(".says-kind"), x(".says-kind") < x(".chipcell"), x(".chipcell") < x(".says-size"), x(".says-size") < x(".says-r")].every(Boolean), x(".says-size") + "/" + x(".says-r") + "/" + x(".chipcell"), e.getBoundingClientRect().height, e.querySelectorAll(".dot.tiny").length === (e.classList.contains("on") ? 0 : 1)]; }));
check(sums.every((x) => /^\d+ (ticks|markers|numerals|band)$/.test(x[0]) && /^[\d.]+$/.test(x[1]) && /^[\d.]+$/.test(x[2]) && x[3] && x[6]) && new Set(sums.map((x) => x[4])).size === 1 && new Set(sums.map((x) => x[5])).size === 1,
  `every ring's row reads kind · colour · size · radius after its name, each in one column down the list; every row but the selected one has its colour (the drawer's button is right under): ${sums.map((x) => x.slice(0, 3).join(" · ")).join(" | ")}`);
const sum_before = await page.textContent(".ringlist li.ring.on .says-r");
await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "r", t.ring().r - 1); });
check(await page.textContent(".ringlist li.ring.on .says-r") !== sum_before && await page.$$eval(".ringlist li.ring.on", (e) => e.length) === 1, `the row follows the ring: radius ${sum_before} → ${await page.textContent(".ringlist li.ring.on .says-r")}`);
await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "r", t.ring().r + 1); });
await shot("4c7-ring-summary");
check(await page.$$eval(".ringlist input", (e) => e.length) === 0 && await page.$$eval(".ringlist .rename", (e) => e.length) === 1, "the ring list has no name fields: one rename box, on the selected ring");
const mine = await S("S.ui_ring"), other_ring = mine === 0 ? 1 : 0;
await page.click(`.ringlist li:nth-child(${other_ring + 1} of .ring) .name`);
check(await S(`S.ui_ring === ${other_ring}`) && await page.$$eval(".ringlist input", (e) => e.length) === 0, "a click on another ring's name selects it and renames nothing");
await page.click(`.ringlist li:nth-child(${mine + 1} of .ring) .name`);
await page.click(".ringlist li.ring.on .rename");
await page.fill(".ringlist li.ring.on input.name", "Edge");
await page.press(".ringlist li.ring.on input.name", "Enter");
check(await S("S.rings[S.ui_ring].name === 'Edge'") && await page.textContent(".ringlist li.ring.on span.name") === "Edge", "the rename box turns the name into a field; Enter keeps it: Edge");
await page.click(".ringlist li.ring.on .rename");
await page.fill(".ringlist li.ring.on input.name", "Nope");
await page.press(".ringlist li.ring.on input.name", "Escape");
check(await S("S.rings[S.ui_ring].name === 'Edge'"), "Esc puts the old name back");
const was = await S("S.ui_ring");
await page.click("#ring-up");
check(await S(`S.rings[${was - 1}].name === 'Edge' && S.ui_ring === ${was - 1}`), "↑ Up moves it one place up the list");
await page.click("#ring-down");
check(await S(`S.rings[${was}].name === 'Edge' && S.ui_ring === ${was}`), "↓ Down moves it back");
await page.click("#ring-duplicate");
check(await S(`S.rings.length === ${before + 2} && S.rings[S.ui_ring].name === 'Edge copy'`), "Duplicate");
await page.click("#ring-delete");
check(await S(`S.rings.length === ${before + 1} && S.rings[S.ui_ring].name === 'Edge'`), "Delete removes the copy");
await page.click(".ringlist li.ring.on button.eye");
await frame();
check(await S("S.rings[S.ui_ring].on === false && !t.items.some((i) => i.role === 'ring' && i.index === S.ui_ring)"), "the eye in the left column hides the ring in the preview");
check(await page.$$eval(".ringlist li.ring.on.off .rename", (e) => e.length) === 0, "a hidden ring greys and loses its rename box");
await shot("4a-hidden-ring");
await page.click(".ringlist li.ring.on button.eye");
check(await page.$$eval(".ringlist li.ring.on .rename", (e) => e.length) === 1, "shown again: the rename box is back");
const eyes = await page.$$eval(".ringlist button.eye svg, .pinned button.fold .eye svg", (e) => [...new Set(e.map((x) => Math.round(x.getBoundingClientRect().left)))]);
const starts = await page.evaluate(() => { const l = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left), r = (q) => Math.round(document.querySelector(q).getBoundingClientRect().right); return { row: l(".ringlist li.ring"), row_end: r(".ringlist li.ring"), line: l(".lineholder"), line_end: r(".lineholder"), heading: l(".pinned h2"), tools: r(".headtools"), pane: r(".pinned .pane"), name: l(".ringlist li.ring.on .name") + 6, kinds: l(".ringline .kinds") }; });
check(eyes.length === 2 && starts.row === starts.heading && starts.line === starts.row && starts.line_end === starts.row_end && starts.tools === starts.pane && starts.kinds === starts.name,
  `ring rows start where the heading starts, a ring's eye inside its row; the ring line is as wide as the rows and its buttons start where the names start; the tools end on the pane's line (${JSON.stringify(starts)})`);
// the heading line carries the tools: a plus and four signs, all the same outlined circle; the plus opens the four kinds
const tools = await page.evaluate(() => { const signs = [...document.querySelectorAll(".headtools .sign")], h = document.querySelector(".pinned .fold").getBoundingClientRect(); return { ids: signs.map((b) => b.id).join(" "), look: [...new Set(signs.map((b) => { const c = getComputedStyle(b), r = b.getBoundingClientRect(); return [c.borderTopWidth, parseFloat(c.borderTopLeftRadius) >= 13, r.width, r.height].join("/"); }))], on_line: signs.every((b) => { const r = b.getBoundingClientRect(); return r.top >= h.top && r.bottom <= h.bottom; }), foot: document.querySelectorAll(".listfoot").length }; });
check(tools.ids === "ring-add ring-up ring-down ring-duplicate ring-delete" && tools.look.length === 1 && tools.look[0] === "1px/true/26/26" && tools.on_line && tools.foot === 0, `plus · up · down · duplicate · delete stand on the heading line, five outlined circles of one size (${tools.look.join(" ")}); no line under the list`);
await page.click("#ring-add");
check(await page.isVisible("#add-menu") && (await page.$$eval("#add-menu button > span", (b) => b.map((x) => x.textContent).join(" "))) === "Ticks Markers Numerals Band", "the plus opens a menu of the four kinds");
await shot("4c9-add-menu");
await page.mouse.click(60, 44);      // on the tool's name: nothing to press there
check(await page.isHidden("#add-menu"), "a press outside puts the menu away");
// the ring line (Okay's design, 13 Oct 2026): in the list, right under the selected ring's row; kinds · colour · size · radius, all one height
const one = await page.evaluate(() => {
  const p = document.querySelector(".pinned"), holder = p.querySelector(".lineholder"), line = holder.querySelector(".ringline"), parts = [...line.children], on = p.querySelector(".ringlist li.ring.on");
  const c = getComputedStyle(holder), row = getComputedStyle(on), h = (e) => Math.round(e.getBoundingClientRect().height);
  return { panes: p.querySelectorAll(".pane").length, under: holder.previousElementSibling === on, gap: Math.round(holder.getBoundingClientRect().top - on.getBoundingClientRect().bottom), order: parts.map((e) => e.id || e.className).join(" "),
    kinds: line.querySelectorAll(".kinds button svg").length, words: line.querySelectorAll(".kinds span, .name").length, hex: getComputedStyle(line.querySelector(".colour .hex")).display,
    heights: [...new Set([...line.querySelectorAll(".kinds button, .colour, .valueb")].map(h))], round: [...line.querySelectorAll(".valueb")].every((e) => Math.round(e.getBoundingClientRect().width) === h(e)),
    title: p.querySelector("h2").textContent, radius: on.querySelector(".says-r").textContent, size: on.querySelector(".says-size").textContent, figures: line.querySelectorAll(".figure").length,
    over: [[".chipcell", ".colour"], [".says-size", "#ring-size"], [".says-r", "#ring-r"]].map(([a, b]) => { const m = (e) => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2; }; return Math.abs(m(on.querySelector(a)) - m(line.querySelector(b))); }), small: line.querySelectorAll("#ring-size svg .small").length,
    ground: c.backgroundColor, frame: c.borderTopColor, row_frame: row.borderTopColor, tip: line.querySelector(".kinds button").dataset.tip, kinds_end: Math.abs(line.querySelector(".kinds").getBoundingClientRect().right - on.querySelector(".says-kind").getBoundingClientRect().right), rows: p.querySelectorAll(".ringlist li.ring").length, all: p.querySelectorAll(".ringlist li").length };
});
check(one.panes === 1 && one.under && one.gap === 2 && one.order === "kinds ring-c-Colour ring-size ring-r" && one.kinds === 4 && one.words === 0 && one.hex === "none" && one.heights.length === 1 && one.round && one.title === "Rings, top first" && one.all === one.rows + 1
  && one.radius === String(await S("S.rings[S.ui_ring].r")) && one.size === String(await S("S.rings[S.ui_ring].width")) && one.small === 1 && one.figures === 0 && one.kinds_end <= 1 && one.over.every((d) => d <= 1) && one.ground === "rgb(255, 255, 255)" && one.frame === one.row_frame && one.tip === "Ticks",
  `the ring drawer stands in the list, ${one.gap} under the selected ring's row: four kinds (ending where the kinds' words end) · colour · size (Okay's scale drawing) · radius, all ${one.heights[0]} high, no numbers in them; the row's colour, size ${one.size} and radius ${one.radius} stand right over their buttons; white, its frame the guide's colour like its row's (${one.frame})`);
// its frame: an outer line in the guide's colour and, inside it, a line three times as thick in the selected row's ground; the tiny numbers are in Silkscreen
{
  const look = await page.evaluate(async () => {
    await document.fonts.load('8px "Silkscreen"');
    const h = document.querySelector(".lineholder"), c = getComputedStyle(h), on = getComputedStyle(document.querySelector(".ringlist li.ring.on")), f = getComputedStyle(document.querySelector(".ringlist li.ring.on .says-r")), k = getComputedStyle(document.querySelector(".ringlist li.ring.on .says-kind"));
    const strokes = [...new Set([...document.querySelectorAll(".valueb svg circle:first-child, .valueb svg .small")].map((e) => getComputedStyle(e).stroke))], kind = getComputedStyle(document.querySelector(".kinds button:not(.on)")).borderTopColor;
    return { inner: c.boxShadow, ground: on.backgroundColor, pad: parseFloat(c.paddingTop), font: f.fontFamily, size: f.fontSize, quiet: f.color === k.color, loaded: document.fonts.check('8px "Silkscreen"'), strokes, kind, text: getComputedStyle(document.querySelector(".kinds svg text")).fontFamily };
  });
  check(look.inner.includes("3px") && look.inner.includes("inset") && look.inner.startsWith(look.ground) && look.pad === 11 && /mono/i.test(look.font) && look.size === "11px" && look.quiet && look.loaded && look.text.includes("Silkscreen") && look.strokes.length === 1 && look.strokes[0] === look.kind,
    `the ring drawer's frame has an inner line 3 thick in its row's ground (${look.ground}) and ${look.pad} of room; a row's numbers are quiet, in the mono face at 11; the numerals picture keeps Silkscreen; round and square buttons have one outline (${look.kind})`);
}
// the selected ring is renamed by a click on its name; the rename box stands right beside the name
{
  const gap = await page.evaluate(() => { const n = document.querySelector(".ringlist li.ring.on .name").getBoundingClientRect(), r = document.querySelector(".ringlist li.ring.on .rename").getBoundingClientRect(); return Math.round(r.left - n.right); });
  const was = await S("S.rings[S.ui_ring].name");
  await page.click(".ringlist li.ring.on .name");
  const field = await page.$$eval(".ringlist li.ring.on input.name", (e) => e.length);
  await page.keyboard.press("Escape");
  await page.evaluate(() => { const t = window.dial_tool; t.ring().name = "A very long name for a ring that can not fit in its row"; t.fill_ring_list(); t.sync_rows(); });
  const long = await page.evaluate(() => { const r = document.querySelector(".ringlist li.ring.on .rename"), n = document.querySelector(".ringlist li.ring.on .name"); return [r.hidden, n.scrollWidth > n.clientWidth]; });
  await page.click(".ringlist li.ring.on .name");
  const still = await page.$$eval(".ringlist li.ring.on input.name", (e) => e.length);
  await page.keyboard.press("Escape");
  await page.evaluate((was) => { const t = window.dial_tool; t.ring().name = was; t.fill_ring_list(); t.sync_rows(); }, was);
  check(gap === 0 && field === 1 && long[0] && long[1] && still === 1 && await S("S.rings[S.ui_ring].name") === was, "the rename box stands right beside the name; a click on the selected ring's name renames it; a name too long for the row loses the box and still renames");
}
await page.hover("#ring-kind-Kind-0");
const tag = await page.evaluate(() => { const t = document.querySelector("#tag"), b = document.querySelector("#ring-kind-Kind-0").getBoundingClientRect(), r = t.getBoundingClientRect(); return [t.hidden, t.textContent, r.top > b.bottom, Math.abs((r.left + r.right) / 2 - (b.left + b.right) / 2) < 2]; });
check(!tag[0] && tag[1] === "Ticks" && tag[2] && tag[3], "a kind button says what it is in a tag under it while the pointer is on it: Ticks");
await page.hover("#ring-r");
const vtag = await page.evaluate(() => { const t = document.querySelector("#tag"); return [[...t.children].map((c) => c.textContent).join(" | "), Math.round(t.getBoundingClientRect().width), Math.round(t.getBoundingClientRect().height)]; });
check(vtag[0] === "Outer radius | " + await S("S.rings[S.ui_ring].r"), `a round button's tag says its name and its value: ${vtag[0]} (${vtag[1]} wide)`);
await page.hover("#ring-kind-Kind-0");
{
  const d = await page.evaluate(() => { const b = document.querySelector("#ring-size"), r = b.getBoundingClientRect(), parts = [...b.querySelectorAll("svg > *")].map((e) => e.getBoundingClientRect()), c = document.querySelector(".ringline .colour").getBoundingClientRect(), rad = document.querySelector("#ring-r").getBoundingClientRect();
    return [parts.every((x) => x.left >= r.left - 0.6 && x.right <= r.right + 0.6 && x.top >= r.top - 0.6 && x.bottom <= r.bottom + 0.6), Math.round(r.left - c.right), Math.round(rad.left - r.right)]; });
  check(d[0] && d[1] === d[2], `the scale drawing is whole inside its button; colour · size · radius stand the same space apart (${d[1]} · ${d[2]})`);
}
await shot("4c15-ring-line");
await page.mouse.move(60, 44);
check(await page.$eval("#tag", (t) => t.hidden), "the tag goes when the pointer leaves");
// selecting another ring moves the line under that ring's row
{
  const before = await S("S.ui_ring"), other = before === 0 ? 1 : 0;
  await page.click(`.ringlist li:nth-child(${other + 1} of .ring) .name`);
  const moved = await page.evaluate(() => { const h = document.querySelector(".lineholder"); return h.previousElementSibling === document.querySelector(".ringlist li.ring.on") && document.querySelectorAll(".lineholder").length === 1; });
  await page.click(`.ringlist li:nth-child(${before + 1} of .ring) .name`);
  check(moved, "select another ring and the line moves under its row");
}
const pinned_open = await page.$eval(".pinned", (e) => e.getBoundingClientRect().height);
await page.click(".pinned .fold h2");
const shut = await page.evaluate(() => { const p = document.querySelector(".pinned"), s = p.querySelector(".summary"); return [p.querySelector("h2").textContent, s.textContent, p.getBoundingClientRect().height, s.querySelectorAll(".dot.tiny").length, getComputedStyle(p.querySelector(".headtools")).display]; });
check(shut[0] === "Rings: " + await S("S.rings[S.ui_ring].name") && shut[1].startsWith(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind]") + " ·  · ") && !shut[1].includes("#") && shut[3] === 1 && shut[2] < 60 && shut[4] === "none", `folded, it is one line: "${shut[0]}   ${shut[1].replace(" ·  · ", " · ■ · ")}", the colour a tiny swatch without hex (${Math.round(pinned_open)} → ${Math.round(shut[2])} high)`);
await shot("4c8-rings-folded");
await page.click(".pinned .fold h2");
// the radius button: a click pops up the number's row, the field ready; typing sets; a press outside puts it away
const r_before = await S("S.rings[S.ui_ring].r");
await page.click("#ring-r");
check(await page.isVisible("#value-pop") && await page.evaluate(() => document.activeElement && document.activeElement.closest("#value-pop") !== null && document.activeElement.type === "text"), "a click on the radius button pops up a number field, ready to type in");
await page.keyboard.type("+0.5");
await page.keyboard.press("Enter");
check(await page.$("#value-pop") === null && Math.abs(await S("S.rings[S.ui_ring].r") - (r_before + 0.5)) < 1e-9 && await page.textContent(".ringlist li.ring.on .says-r") === String(r_before + 0.5), `typing +0.5 and Enter adds it and closes the pop-up: ${r_before} → ${await S("S.rings[S.ui_ring].r")}`);
await page.click("#ring-r");
await page.mouse.click(60, 44);      // on the tool's name: nothing to press there
check(await page.$("#value-pop") === null, "a press outside puts the pop-up away");
// …and pressing and moving changes the value without opening anything: two screen points a step, right or up is more
const rb = await page.$eval("#ring-r", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await page.mouse.move(rb[0], rb[1]); await page.mouse.down(); await page.mouse.move(rb[0] + 10, rb[1], { steps: 4 }); await page.mouse.move(rb[0] + 20, rb[1], { steps: 4 });
const mid_drag = await S("S.rings[S.ui_ring].r");
await page.mouse.move(rb[0] - 20, rb[1], { steps: 6 }); await page.mouse.up();
check(Math.abs(mid_drag - (r_before + 0.5 + 0.5)) < 1e-9 && Math.abs(await S("S.rings[S.ui_ring].r") - (r_before + 0.5 - 0.5)) < 1e-9 && await page.$("#value-pop") === null, `dragged 20 to the right the radius is 0.5 more (${mid_drag}), 20 to the left 0.5 less; no pop-up opens`);
await page.evaluate((r) => window.dial_tool.set_value("ring", "r", r), r_before);
{
  const w_before = await S("S.rings[S.ui_ring].width");
  const sb = await page.$eval("#ring-size", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(sb[0], sb[1]); await page.mouse.down(); await page.mouse.move(sb[0] + 8, sb[1], { steps: 4 }); await page.mouse.move(sb[0] + 16, sb[1], { steps: 4 }); await page.mouse.up();
  const dragged = await S("S.rings[S.ui_ring].width");
  await page.evaluate((w) => window.dial_tool.set_value("ring", "width", w), w_before);
  await page.click("#ring-size");
  await page.waitForTimeout(200);
  const pop = await page.evaluate(() => { const e = document.querySelector("#value-pop"), p = e.getBoundingClientRect(), b = document.querySelector("#ring-size").getBoundingClientRect(); return [e.querySelector("label").textContent, Math.round(p.top - b.bottom), e.parentElement === document.body && e.classList.contains("tag"), Math.round((p.left + p.right) / 2 - (b.left + b.right) / 2), Math.round(p.width), Math.round(p.height), getComputedStyle(e.querySelector("input[type=range]")).display]; });
  await shot("4c19-size-pop");
  await page.keyboard.type("x2"); await page.keyboard.press("Enter");
  const w_after = await S("S.rings[S.ui_ring].width");
  await page.evaluate((w) => window.dial_tool.set_value("ring", "width", w), w_before);
  check(Math.abs(dragged - (w_before + 0.4)) < 1e-9 && pop[0] === "Band width" && pop[1] === 7 && pop[2] && Math.abs(pop[3]) <= 1 && pop[4] === vtag[1] && pop[5] > vtag[2] + 40 && pop[6] === "none" && Math.abs(w_after - 2 * w_before) < 1e-9 && await page.$("#value-pop") === null,
    `the size button, before the radius: dragged 16 to the right a band is 0.4 wider; a click grows its tag into the pop-up — the same box under the button, as wide as the tag (${pop[4]}), now ${pop[5]} high: ${pop[0]}, the field, − +; it takes x2`);
}
// undo: ⌘Z takes one step back, ⇧⌘Z forward again; a drag is one step; the window's state stays (13 Oct 2026)
{
  const settle = () => page.waitForTimeout(550);
  await settle();
  const state = () => S("[S.rings.length, S.rings[S.ui_ring].r, S.ui_section, S.dial_d]");
  const s0 = await state();
  await page.mouse.move(rb[0], rb[1]); await page.mouse.down(); await page.mouse.move(rb[0] + 12, rb[1], { steps: 5 }); await page.mouse.move(rb[0] + 24, rb[1], { steps: 5 }); await page.mouse.up();
  await settle();
  const s1 = await state();
  await page.click("#ring-duplicate");
  await settle();
  const s2 = await state();
  await page.keyboard.press("Control+z");
  const u1 = await state();
  await page.keyboard.press("Control+z");
  const u2 = await state();
  await page.keyboard.press("Control+Shift+z");
  const r1 = await state();
  await page.keyboard.press("Control+z");
  const back = await state();
  check(s1[1] > s0[1] && s2[0] === s0[0] + 1 && JSON.stringify(u1) === JSON.stringify(s1) && JSON.stringify(u2) === JSON.stringify(s0) && JSON.stringify(r1) === JSON.stringify(s1) && JSON.stringify(back) === JSON.stringify(s0)
    && await page.textContent(".ringlist li.ring.on .says-r") === String(s0[1]) && await page.$$eval(".ringlist li.ring", (l) => l.length) === s0[0],
    `undo: a duplicate, then a whole drag of the radius (${s1[1]} → ${s0[1]}), each one step back; redo brings the drag back; the panel follows`);
  await page.evaluate(() => window.dial_tool.set_value("global", "dial_d", 31));
  await settle();
  await page.keyboard.press("Meta+z");
  check((await state())[3] === s0[3], "⌘Z does the same");
  const place = await page.evaluate(() => { const u = document.querySelector(".undos").getBoundingClientRect(), g = document.querySelector("#guides").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); return [u.right <= g.left, Math.round(u.top - m.top) === Math.round(g.top - m.top), Math.round(u.left - m.left) === 12, document.querySelector("#redo").classList.contains("none")]; });
  await page.click("#redo");
  const fwd = (await state())[3];
  await page.click("#undo");
  check(place[0] && place[1] && place[2] && !place[3] && fwd === 31 && (await state())[3] === s0[3], "Undo and Redo stand on the preview's top left, 12 from its left edge, level with the Guides switch, and do the same");
  await shot("4c16-undo");
}
// a numeral's radius measures to its centre, its baseline or its top: the menu beside the label, in the pop-up (13 Oct 2026)
const numerals_at = await S("S.rings.findIndex((r) => r.kind === 2)"), ring_before = await S("S.ui_ring");
await page.click(`.ringlist li:nth-child(${numerals_at + 1} of .ring) .name`);
await page.click("#ring-r");
const anchors = await page.evaluate(() => {
  const t = window.dial_tool, ring = t.ring(), menu = document.querySelector("#value-pop .menulabel select"), label = () => document.querySelector("#value-pop .menulabel label").textContent;
  const out = { options: [...menu.options].map((o) => o.textContent).join(" "), labels: [label()], r: ring.r };
  for (const v of ["1", "2", "0"]) { menu.value = v; menu.dispatchEvent(new Event("change")); out.labels.push(label()); out["a" + v] = ring.anchor; }
  return out;
});
await shot("4c10-radius-pop");
await page.keyboard.press("Escape");
await page.click(`.ringlist li:nth-child(${ring_before + 1} of .ring) .name`);
check(anchors.options === "Baseline Ascender Centre" && anchors.labels.join(" | ") === "Centre radius | Baseline radius | Ascender radius | Centre radius" && anchors.a1 === 1 && anchors.a2 === 2 && anchors.a0 === 0,
  `the radius of numerals has a menu beside its label: ${anchors.options}; the label follows: ${anchors.labels.join(" → ")}`);
// …and the drawing follows: the numeral at 12 stands on the radius (baseline), hangs from it (ascender), or is centred on it
const at12 = [];
for (const v of [1, 2, 0]) {
  await page.evaluate((v) => { const t = window.dial_tool; t.S.rings.find((r) => r.kind === 2).anchor = v; t.static_dirty = true; t.render(); }, v);
  await frame();
  at12.push(await page.evaluate(() => { const t = window.dial_tool, d = t.statik.rings.find((x) => x.ring.kind === 2), b = d.parts[0].bounds(); return [b[1] - d.ring.r, b[3] - d.ring.r, (b[1] + b[3]) / 2 - d.ring.r]; }));
}
check(Math.abs(at12[0][0]) < 0.06 && at12[0][1] > 1 && Math.abs(at12[1][1]) < 0.01 && at12[1][0] < -1 && Math.abs(at12[2][2]) < 0.001,
  `at 12 the numeral's foot is on the radius with Baseline (${at12[0][0].toFixed(3)}), its top with Ascender (${at12[1][1].toFixed(3)}), its middle with Centre (${at12[2][2].toFixed(4)})`);
check(await page.$$eval(".row.pick .pickt svg", (e) => e.length) >= 4, "Kind is a row of picture tiles");
await page.click("#ring-kind-Kind-0");
check(await S("S.rings[S.ui_ring].kind === 0 && S.rings[S.ui_ring].width === 1"), "changing a ring's kind keeps its settings");
await page.click("#ring-delete");
await shot("4-rings");

// ── the pointer on the preview: an outline, and a label with the piece's name ──
const over_mm = async (x, y) => {
  const p = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return [r.left + t.c[0] + x * t.z, r.top + t.c[1] - y * t.z]; }, [x, y]);
  await page.mouse.move(p[0] + 1, p[1] + 1);
  await page.mouse.move(p[0], p[1]);
  await frame();
  return p;
};
const hour_at = await over_mm(...clock(6, hands[0]));
check(await page.isVisible(".tip") && (await page.textContent(".tip span")) === "Hour hand", "pointer on the hour hand: the label says Hour hand");
check(await page.$eval(".glow:not(.under)", (e) => e.getAttribute("d").length > 20 && e.getAttribute("transform") !== null), "…and the hand is outlined, turned with it");
const tip_box = await page.$eval(".tip", (e) => { const r = e.getBoundingClientRect(), a = e.querySelector("svg").getBoundingClientRect(); return { bottom: r.bottom, arrow: a.left + a.width / 2 }; });
check(tip_box.bottom < hour_at[1] && Math.abs(tip_box.arrow - hour_at[0]) < 1.5, "the label sits above the pointer and its arrow points at it");
await over_mm(...clock(13.9, 93));
check((await page.textContent(".tip span")) === "Minute ticks", "pointer beside a thin tick: Minute ticks");
await page.mouse.move(5, 5);
await frame();
check(await page.isHidden(".tip"), "pointer off the preview: no label");
await shot("4b-hover-setup");

// ── drag a ring to another place in the list ──
await tab("Rings");
const order = await S("S.rings.map((r) => r.name)");
const grip = await page.$eval(".ringlist li:nth-child(1 of .ring) .grip", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.height]; });
grip[2] = await page.$$eval(".ringlist li.ring", (l) => l[1].getBoundingClientRect().top - l[0].getBoundingClientRect().top);      // from one row to the next
await page.mouse.move(grip[0], grip[1]);
await page.mouse.down();
await page.mouse.move(grip[0], grip[1] + grip[2] * 1.2, { steps: 4 });
check(await page.isVisible(".ringlist .dropline"), "dragging a ring by its grip shows where it will land");
await page.mouse.move(grip[0], grip[1] + grip[2] * 2.2, { steps: 4 });
await page.mouse.up();
await frame();
check(JSON.stringify(await S("S.rings.map((r) => r.name)")) === JSON.stringify([order[1], order[2], order[0], ...order.slice(3)]) && await S("S.ui_ring === 2"), "dropped two rows down: the order changed and the ring stays selected");
await page.mouse.move(grip[0], grip[1] + grip[2] * 2);
await page.mouse.down();
await page.mouse.move(grip[0], grip[1] - grip[2], { steps: 5 });
await page.mouse.up();
await frame();
check(JSON.stringify(await S("S.rings.map((r) => r.name)")) === JSON.stringify(order), "dragged back to the top: the first order again");

// ── guides: a switch on the preview's top right, with an arrow that drops their list (five kinds, eight colours) ──
await tab("Dial");
check(await page.$("main .guides #guides") !== null && await page.$(".panel #guides") === null && await page.isHidden("#guide-list"), "the Guides switch stands on the preview, not in the panel; its list is shut");
const guides_at = await page.evaluate(() => { const g = document.querySelector(".guides").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); return [Math.round(m.right - g.right), Math.round(g.top - m.top)]; });
check(guides_at[0] === 12 && guides_at[1] === 16, `it is 12 from the preview's right, and 16 from its top: on the header's middle line (${guides_at.join(" / ")})`);
await page.click("#guides-more");
check(await page.isVisible("#guide-list") && await page.$$eval("#guide-list > .guidekind", (r) => r.length) === 3 && await page.$$eval("#guide-list .guidekind >> nth=0 >> .dots .tone", (b) => b.length) === 8 && await page.$$eval("#guide-list .guiderings .guidekind.ring", (r) => r.length) === await S("S.rings.length") && await page.$("#guide-list .swatch") === null, "the arrow drops the list: the dial's three kinds of guide, then a line for every ring, each with None and eight round colours, no free colour");
// guides are connected to the rings (13 Oct 2026): each ring's edges in its own colour, different ones to start with; the row in the ring list is tinted with it
{
  const start = await page.evaluate(() => { const t = window.dial_tool, G = t.S.rings.map((r, i) => [r.guide, [...document.querySelectorAll("#guide-list .guidekind.ring")][i].querySelector(".tone.on").title]); return G; });
  const strokes = await page.evaluate(() => { const t = window.dial_tool; return [...new Set(t.items.filter((i) => i.role === "guide").map((i) => i.stroke.map((v) => Math.round(v * 255)).join(",")))].length; });
  await page.click("#guide-list .guidekind.ring >> nth=0 >> .tone >> nth=5");
  const set = await S("S.rings[0].guide");
  await page.click("#guide-list .guidekind.ring >> nth=0 >> .none");
  const none = await S("S.rings[0].guide");
  await page.click("#guide-rings-selected");
  const only = await page.evaluate(() => { const t = window.dial_tool; t.draw(); return [t.S.gd_rings, t.S.gd_sel]; });
  await page.click("#guide-rings-all");
  await page.evaluate(() => { window.dial_tool.set_value("ring", "guide", -1); const t = window.dial_tool; t.S.rings[0].guide = -1; t.sync_rows(); t.render(); });
  check(new Set(start.map((x) => x[1])).size === Math.min(start.length, 6) && strokes >= 3 && set === 5 && none === -2 && only[0] === false && only[1] === true,
    `every ring has a guide colour of its own to start with (${start.map((x) => x[1]).join(" ")}); a ring's line in the list changes it or hides it; Rings: All · Selected · None says which rings show theirs`);
  // guides you add: a line, a crosshair, a circle
  await page.click("#guide-add-line"); await page.click("#guide-add-crosshair"); await page.click("#guide-add-circle");
  await page.fill("#guide-more-0-a", "45"); await page.press("#guide-more-0-a", "Enter");
  await page.fill("#guide-more-1-r", "8"); await page.press("#guide-more-1-r", "Enter");
  await frame();
  const added = await page.evaluate(() => { const t = window.dial_tool; return [t.S.gd_more.map((g) => g.kind).join(""), t.S.gd_more[0].a, t.S.gd_more[1].r, t.items.filter((i) => i.role === "guide").length, document.querySelectorAll("#guide-list .guidekind.added").length]; });
  await shot("4c20-guides");
  await page.click("#guide-more-1-remove");
  const left = await S("S.gd_more.map((g) => g.kind).join('')");
  await page.evaluate(() => { const t = window.dial_tool; t.S.gd_more = []; t.sync_rows(); t.render(); });
  check(added[0] === "012" && added[1] === 45 && added[2] === 8 && added[4] === 3 && left === "02", `Add: Line · Crosshair · Circle put a guide of that kind in the list, with its angle or radius, its colours and a way to remove it (${added[3]} guides drawn)`);
}
const list_look = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#guide-list")), on = getComputedStyle(document.querySelector("#guide-list .tone.on")); return [c.backgroundColor, parseFloat(c.borderTopLeftRadius), on.borderTopLeftRadius, on.boxShadow.split("rgb").length - 1]; });
check(list_look[0] === "rgb(20, 20, 19)" && list_look[1] >= 12 && list_look[2] === "50%" && list_look[3] === 3, "the list is near black and round; the chosen colour is a disc in a thick ring of its own colour");
await page.fill("#global-gd-w-Thickness", "3");
await page.press("#global-gd-w-Thickness", "Enter");
await page.click("#guide-gd_axes");
await frame();
check(await S("t.items.filter((i) => i.role === 'guide' && i.px === 3).length > 0 && !t.items.some((i) => i.role === 'guide' && i.path.d.length === 2)"), "Guides: thickness 3, and None on centre lines takes them off the preview");
check(await page.$eval("#guide-gd_axes", (e) => e.classList.contains("on")) && await page.$$eval('#guide-list .guidekind:has-text("Centre lines") .tone.on', (b) => b.length) === 0, "None wears the mark; no colour does");
await page.click('#guide-list .guidekind:has-text("Centre lines") .tone >> nth=3');
await frame();
check(await S("S.gd_axes === true && S.gd_k_axes === 3"), "pressing a colour shows that kind again, in that colour");
await page.click("#guide-gd_axes");
await page.click('#guide-list .guidekind:has-text("Dial edge") .tone >> nth=0');
await frame();
check(await S("S.gd_k_edge === 0") && await page.$eval(".preview path[stroke]", (e) => e.getAttribute("stroke")) === "#ff2d95", "a colour pressed is the dial edge's: the first of the eight, at full strength");
await shot("4c-guides");
await page.click("#guides-reset");
await frame();
check(await S("S.gd_k_edge === 1 && S.gd_axes === true && S.gd_w === 1"), "Reset: the guides as they started");
await page.click("#guides");
await frame();
check(await S("!t.items.some((i) => i.role === 'guide')") && await page.isVisible("#guide-list"), "the Guides switch, off: none drawn; the list stays where it is");
await page.mouse.move(640, 30);
const one_colour = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)); return [c("#guides").color, c("#guides-more").color, c("#guides").borderTopColor, c("#guides").backgroundColor, c("#guides").borderTopStyle, c("#guides .slash").display, c("#guides").fontWeight]; });
check(one_colour[0] === one_colour[1] && /0\.35\)$/.test(one_colour[2]) && one_colour[3] === "rgba(0, 0, 0, 0)" && one_colour[4] === "solid" && one_colour[5] !== "none" && one_colour[6] === "400", `off, it is an outline with no fill; sign, word, arrow and line are one colour (${one_colour[0]}), the line at 0.35 of it (${one_colour[2]}); the sign is struck through`);
{ // three states on the preview: can be pressed (faint) · can't (fainter) · on (Guides: its word alone whole)
  const o = (q) => page.$eval(q, (e) => getComputedStyle(e).opacity);
  const off = [await o("#guides .word"), await o("#guides svg"), await o("#backdrop span"), await o("#undo svg")];
  await page.click("#guides"); await page.mouse.move(640, 30);
  const on = [await o("#guides .word"), await o("#guides svg"), await page.$eval("#guides", (e) => getComputedStyle(e).borderTopColor)];
  await page.hover("#guides");
  const over = await page.$eval("#guides", (e) => getComputedStyle(e).borderTopColor);
  await page.click("#guides"); await page.mouse.move(640, 30);
  check(off.join() === "0.35,0.35,0.35,0.35" && on[0] === "1" && on[1] === "0.35" && /0\.35\)$/.test(on[2]) && over === one_colour[0], `on the preview a switch is faint (${off[0]}); Guides on: its word alone is whole, its line still faint; under the pointer the line is whole`);
}
await page.mouse.click(640, 30);                      // the backdrop, off the dial
check(await page.isHidden("#guide-list"), "a press outside the list puts it away");
await page.click("#guides-more");
const looks = await page.evaluate(() => { const c = (q, p) => getComputedStyle(document.querySelector(q))[p]; return [c(".bar", "backgroundColor"), c(".bar", "color")]; });
check(looks[0] === "rgb(51, 51, 51)" && looks[1] === "rgb(242, 242, 238)", "the bar is 80 % black with light words");
await page.mouse.move(900, 400);
const off_look = await page.$eval("#guides", (e) => { const c = getComputedStyle(e); return [e.getAttribute("aria-pressed"), c.backgroundColor, e.textContent, c.borderTopStyle]; });
check(off_look[0] === "false" && off_look[1] === "rgba(0, 0, 0, 0)" && off_look[2] === "Guides" && off_look[3] === "solid", "off: no fill, no dashes");
await shot("4c3-guides-off");
await page.click("#guides");
await page.click("#guides-more");
await page.mouse.move(900, 400);
check(await S("S.guides === true && S.ui_section === 0") && await page.isHidden("#guide-list") && await page.$eval("#guides", (e) => { const c = getComputedStyle(e); return c.backgroundColor + c.color + c.fontWeight + getComputedStyle(e.querySelector(".slash")).display; }) === "rgba(0, 0, 0, 0)rgb(17, 17, 17)600none", "pressed again it is on: still no fill; a bold word, the sign whole");
// the backdrop's colour: a switch at the preview's bottom left, showing the colour as a chip
const bd = await page.evaluate(() => { const b = document.querySelector("#backdrop").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(), c = getComputedStyle(document.querySelector("#backdrop")); return [Math.round(b.left - m.left), Math.round(m.bottom - b.bottom), c.borderTopStyle, getComputedStyle(document.querySelector("#backdrop .dot")).getPropertyValue("--c")]; });
check(bd[0] === 12 && bd[1] === 12 && bd[2] === "solid" && bd[3].includes("204, 204, 199"), "the Backdrop switch is 12 from the preview's bottom left, solid-lined, its chip the backdrop's colour");
await page.click("#backdrop");
check(await page.isVisible("#colour-pop") && await page.textContent("#colour-pop h2") === "Backdrop" && await page.$eval("#colour-pop", (e) => e.getBoundingClientRect().bottom <= innerHeight), "a press opens the colour pop-out for the backdrop, inside the window");
await page.click("#pop-as-HEX"); await page.fill("#pop-hex", "#808080"); await page.press("#pop-hex", "Enter");
check(await S("Math.round(S.c_backdrop[0] * 255) === 128") && (await page.$eval("#backdrop .dot", (e) => getComputedStyle(e).getPropertyValue("--c"))).includes("128, 128, 128"), "typing a colour there changes the backdrop and the chip");
await shot("4c6-backdrop-switch");
await page.click("#backdrop");
check(await page.isHidden("#colour-pop"), "pressed again, it closes");
await type_hex("global-c-backdrop-Backdrop", "#CCCCC7");
// its colour follows the backdrop
await type_hex("global-c-backdrop-Backdrop", "#1A1A1F");
await frame();
check(await page.$eval("#guides", (e) => { const c = getComputedStyle(e); return c.backgroundColor + c.color; }) === "rgba(0, 0, 0, 0)rgb(255, 255, 255)" && await page.$eval("#backdrop", (e) => { const c = getComputedStyle(e); return c.backgroundColor + c.color; }) === "rgba(0, 0, 0, 0)rgb(255, 255, 255)", "on a dark backdrop both switches are white outlines");
for (const grey of ["#808080", "#F2F2EE", "#141413", "#4B317F", "#C8E6A0", "#CC381A"]) { await type_hex("global-c-backdrop-Backdrop", grey); await frame(); await page.screenshot({ path: path.join(OUT, `4c5-guides-on-${grey.slice(1)}.png`), clip: { x: 1240, y: 0, width: 200, height: 60 } }); await page.click("#guides"); await page.mouse.move(640, 30); await frame(); await page.screenshot({ path: path.join(OUT, `4c5-guides-off-${grey.slice(1)}.png`), clip: { x: 1240, y: 0, width: 200, height: 60 } }); await page.screenshot({ path: path.join(OUT, `4c5-backdrop-${grey.slice(1)}.png`), clip: { x: 460, y: 790, width: 200, height: 60 } }); await page.click("#guides"); await page.mouse.move(640, 30); }
await shot("4c4-guides-dark");
await type_hex("global-c-backdrop-Backdrop", "#CCCCC7");
// the Dial section: two panes, Dial (diameter, plate, background) and Page (margin, backdrop); no Guides pane
check(JSON.stringify(await page.$$eval(".pinned .pane h2", (h) => h.map((x) => x.textContent))) === '["Dial","Page"]' && JSON.stringify(await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent))) === '["Colours"]' && await page.isVisible("#background-add"), "Dial has three panes: Dial and Page stay in view, Colours scrolls under them; Background is a button");
// units: a box at the panel's top right; lengths are shown and typed in the unit, kept in mm
const unit_box = async () => page.$eval("#unit", (e) => { const r = e.getBoundingClientRect(), row = document.querySelector(".form .row").getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height), Math.round(row.right - r.right)]; });
const as_mm = await unit_box();
check(as_mm[0] === "mm" && as_mm[3] === 0 && await page.isHidden("#unit-menu"), "the unit box says mm and ends on the panel's last column");
await page.click("#unit");
check(JSON.stringify(await page.$$eval("#unit-menu button span:first-child", (b) => b.map((x) => x.textContent))) === '["Millimetres","Points","Inches","Lignes"]', "its menu: millimetres, points, inches, lignes");
await page.click("#unit-in");
const as_in = await unit_box();
check(as_in[0] === "in" && as_in[1] === as_mm[1] && as_in[2] === as_mm[2] && await page.isHidden("#unit-menu"), `Inches: the box says in and keeps its size (${as_in[1]} × ${as_in[2]})`);
check(await page.inputValue("#global-dial-d-Diameter") === "1.181" && await S("S.dial_d") === 30, "a 30 mm diameter shows as 1.181; the setting is still 30");
await page.fill("#global-dial-d-Diameter", "1.5"); await page.press("#global-dial-d-Diameter", "Enter");
check(near(await S("S.dial_d"), 38.1, 1e-6), "1.5 typed in inches is 38.1 mm");
await page.click("#unit"); await page.click("#unit-pt");
check(await page.inputValue("#global-dial-d-Diameter") === "108.0", "in points it reads 108.0");
await shot("4b-units");
await page.click("#unit"); await page.mouse.click(640, 30);
check(await page.isHidden("#unit-menu"), "a press outside the menu puts it away");
await page.click("#unit"); await page.click("#unit-mm");
await page.fill("#global-dial-d-Diameter", "30"); await page.press("#global-dial-d-Diameter", "Enter");
// scale everything with the diameter: off, the rings stay; on, every measure follows, and comes back
const measures = () => S("[S.rings[0].r, S.rings[0].size, S.rings[1].len, S.ha_hour.len, S.ha_cap, S.rings[0].count, S.margin]");
const at_30 = await measures();
await page.fill("#global-dial-d-Diameter", "36"); await page.press("#global-dial-d-Diameter", "Enter");
check(JSON.stringify(await measures()) === JSON.stringify(at_30), "the diameter alone leaves rings and hands where they are");
await page.fill("#global-dial-d-Diameter", "30"); await page.press("#global-dial-d-Diameter", "Enter");
await page.check("#global-ui-scale-Scale-everything-with-it");
await page.fill("#global-dial-d-Diameter", "36"); await page.press("#global-dial-d-Diameter", "Enter");
const at_36 = await measures();
check(at_36.slice(0, 5).every((v, i) => near(v, at_30[i] * 1.2, 1e-4)) && at_36[5] === at_30[5] && at_36[6] === at_30[6], `with "scale everything" ticked, 30 → 36 makes radii, sizes, lengths and the cap 1.2× (count and margin stay)`);
await shot("4d-scaled");
for (const d of ["41.3", "22", "30"]) { await page.fill("#global-dial-d-Diameter", d); await page.press("#global-dial-d-Diameter", "Enter"); }
check(JSON.stringify(await measures()) === JSON.stringify(at_30), "36 → 41.3 → 22 → 30: everything is back exactly where it was");
await page.uncheck("#global-ui-scale-Scale-everything-with-it");
check(await page.evaluate(() => Math.round(document.querySelector(".row.nest .check").getBoundingClientRect().left) === Math.round(document.querySelector(".row.num input[type=range]").getBoundingClientRect().left)), "a nested question starts on the controls' column");
check(await S("!('ui_scale' in G_lean(S))".replace("G_lean(S)", "JSON.parse(JSON.stringify(S, (k, v) => (k.startsWith('ui_') ? undefined : v)))")), "the tick is the window's state, not the dial's");
// Colours: every coloured part in one list
const listed = await page.$$eval(".colourlist .row label", (l) => l.map((x) => x.textContent));
check(listed.length === await S("S.rings.length + 4 + [S.da_on, ...S.windows.map((w) => w.on)].filter(Boolean).length") && listed.join().includes("Hour hand,Minute hand,Seconds hand,Cap"), `Colours lists every ring, the hands, the cap and the windows that are on (${listed.join(" · ")})`);
await page.click("#colour-hand-second");
check(await page.textContent("#colour-pop h2") === "Seconds hand", "a swatch in the list opens the pop-out for that part");
await page.click("#pop-as-HEX"); await page.fill("#pop-hex", "#39FF14"); await page.press("#pop-hex", "Enter");
check(JSON.stringify(await S("S.ha_second.c.slice(0, 3).map((v) => Math.round(v * 255))")) === "[57,255,20]", "and sets its colour");
await page.fill("#pop-hex", "#CC381A"); await page.press("#pop-hex", "Enter");
await page.click("#pop-close");
// a band's sectors, one colour each
await tab("Rings");
await page.click("#ring-add");
await page.click("#add-band");
check(await page.isHidden("#sectors-same"), "a band of one piece has no sector colours");
await page.fill("#ring-count-Count", "6"); await page.press("#ring-count-Count", "Enter");
await page.fill("#ring-width-Band-width", "4"); await page.press("#ring-width-Band-width", "Enter").catch(() => {});
await frame();
const band = await S("S.ui_ring");
check(await page.$$eval(".form .colourlist .swatch", (b) => b.length) === 6, "six sectors: Sector colours shows six swatches");
await page.click(`#colour-ring-${band}-sector-1`);
check((await page.textContent("#colour-pop h2")).endsWith("sector 2"), "the second one opens the pop-out as “… · sector 2”");
check(await page.isVisible(".alpharow"), "a ring's colour has an opacity strip");
await page.fill("#pop-alpha", "50"); await page.press("#pop-alpha", "Enter");
await frame();
check(await S(`S.rings[${band}].cs["1"][3] === 0.5`) && await page.$eval(".preview path[fill-opacity='0.5']", (e) => e !== null) && await page.inputValue("#pop-alpha") === "50%", "opacity 50: the sector is half see-through in the preview");
await page.fill("#pop-alpha", "100"); await page.press("#pop-alpha", "Enter");
await page.fill("#pop-hex", "#0E2A47"); await page.press("#pop-hex", "Enter");
await page.click(`#colour-ring-${band}-sector-3`);
await page.fill("#pop-hex", "#0E2A47"); await page.press("#pop-hex", "Enter");
await frame();
const parts = await S(`t.items.filter((i) => i.role === 'ring' && i.index === ${band}).map((i) => [i.part, Math.round(i.fill[2] * 255)])`);
check(JSON.stringify(await S(`Object.keys(S.rings[${band}].cs)`)) === '["1","3"]' && parts.length === 2 && parts.some((p) => p[1] === 71), `two sectors navy: the band is drawn as two shapes, one per colour (${JSON.stringify(parts)})`);
await shot("4e-sectors");
await tab("Dial");
check(await page.$$eval(`.colourlist .swatch[id^="colour-ring-${band}-sector"]`, (b) => b.length) === 6, "Dial → Colours shows the band's six sectors too");
await tab("Rings");
await page.click("#sectors-same");
await frame();
check(await S(`Object.keys(S.rings[${band}].cs).length === 0 && t.items.filter((i) => i.role === 'ring' && i.index === ${band}).length === 1`), "All as the ring: one colour, one shape again");
await page.click("#ring-delete");
await tab("Dial");
// a line before and after every row: white on the scrolling grey, that grey on paper
const row_line = await page.$eval(".form .colourlist .row", (e) => getComputedStyle(e).boxShadow);
check(row_line.split("rgb(255, 255, 255)").length === 3, "every row has a white hairline before and after it, on the grey");
const half_line = await page.$eval(".row:has(+ .row.nest)", (e) => { const c = getComputedStyle(e); return [c.boxShadow.split("rgb").length - 1, c.backgroundSize, c.backgroundPosition, e.querySelector("label").textContent]; });
check(half_line[0] === 1 && half_line[1].startsWith("calc(66.6667% - 4px)") && half_line[2] === "100% 100%" && half_line[3] === "Diameter", "before a nested row stands a half line, from the controls' column to the right edge: Diameter draws it, over Scale everything with it");
await page.click('.pinned .fold:has-text("Dial")');
check(await page.isHidden("#global-dial-d-Diameter") && await page.isVisible("#global-margin-Page-margin"), "a heading folds its own group only");
check((await page.textContent('.pinned .fold:has-text("Dial") .summary')).includes("diameter 30.0"), "a folded pane says what it holds: diameter 30.0 …");
await page.click('.pinned .fold:has-text("Dial") .eye');
check(await page.isVisible("#global-dial-d-Diameter") && (await page.textContent('.pinned .fold:has-text("Dial") .summary')) === "", "its eye opens it again, and the summary goes");
// folding must not leave uneven gaps: folded panes stack line on line, whatever they hold
await tab("Rings");
const gaps = async () => page.$$eval(".form .pane", (h) => h.filter((e) => e.offsetParent).map((e, i, all) => (i ? Math.round(e.getBoundingClientRect().top - all[i - 1].getBoundingClientRect().top) : 0)).slice(1));
for (const i of [0, 1, 2]) await page.click(`.form .pane:visible >> nth=${i} >> .fold h2`);
const folded_gaps = await gaps();
check(folded_gaps[1] === 42 && folded_gaps[2] === 42, `folded panes in a row are 42 apart, and so is the open one after them (${folded_gaps.join(", ")})`);
for (const i of [0, 1, 2]) await page.click(`.form .pane:visible >> nth=${i} >> .fold h2`);
await tab("Hands");
// Hands: Hour · Minute · Seconds are tabs on top of the pinned part; the panes below are about the chosen hand
const hand_tabs = await page.evaluate(() => { const p = document.querySelector(".pinned"), t = p.querySelector(".tabsbar"); return [p.firstElementChild.classList.contains("handsbar"), p.firstElementChild.nextElementSibling === t, [...t.querySelectorAll("button")].map((b) => b.textContent).join(" "), [...document.querySelectorAll(".form .pane h2")].map((h) => h.textContent).join(" · ")]; });
check(hand_tabs[0] && hand_tabs[1] && hand_tabs[2] === "Hour Minute Seconds", "All hands is the first pinned line, the hand tabs the second, right above the hand's panes");
const tick_up = await page.evaluate(() => { const pane = document.querySelector(".form .pane"), t = pane.querySelector(".headcontrol").getBoundingClientRect(), h = pane.querySelector(".fold").getBoundingClientRect(); return [pane.querySelector(".headcontrol input").id, t.top >= h.top && t.bottom <= h.bottom, pane.querySelector(".body .check") === null]; });
check(tick_up[0] === "hand-on-Show-this-hand" && tick_up[1] && tick_up[2], "Show this hand is on the heading line, beside the hand's name");
const pill_gaps = await page.$eval(".form .colour", (e) => { const r = e.getBoundingClientRect(), d = e.querySelector(".dot").getBoundingClientRect(), h = e.querySelector(".hex").getBoundingClientRect(), row = e.closest(".row").getBoundingClientRect();
  return { gaps: [d.left - r.left, h.left - d.right, r.right - h.right, d.top - r.top, r.bottom - d.bottom, r.top - row.top, row.bottom - r.bottom], dot: d.height, type: parseFloat(getComputedStyle(e).fontSize) }; });
check(pill_gaps.gaps.every((v) => Math.abs(v - 5.5) < 0.3) && pill_gaps.dot === pill_gaps.type, `a colour pill has one space seven times: beside, over and under its swatch, between swatch and hex, after the hex, from the pill to its row's two lines; the swatch is as high as the hex is set (${pill_gaps.gaps.map((v) => +v.toFixed(2)).join(" · ")}; ${pill_gaps.dot} = ${pill_gaps.type})`);
await page.click("#hand-tab-2");
check(await S("S.ui_hand === 2") && await page.textContent(".form .pane >> nth=0 >> h2") === "Seconds hand" && await page.$eval("#hand-tab-2", (e) => e.classList.contains("on")), "a tab chooses the hand; the first pane's heading says Seconds hand");
check((await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent))).at(-1) === "Cap", "Cap, which belongs to all three, comes after the hand's own panes");
await page.click("#hand-tab-0");
{
  const strip = await page.evaluate(() => { const tabs = [...document.querySelectorAll(".tabsbar .segs > button")], r = (e) => e.getBoundingClientRect(), p = r(document.querySelector(".pinned")), c = getComputedStyle(tabs[0]), v = (b) => getComputedStyle(b, "::before");
    const cut = (b) => getComputedStyle(b, "::before").clipPath.replace(/calc\(|\)/g, "");      // the tab's shape: its cut corners
    return { touch: tabs.every((b, i) => !i || Math.abs(r(b).left - r(tabs[i - 1]).right) <= 1), on_line: Math.round(p.bottom - r(tabs[0]).bottom), line: getComputedStyle(document.querySelector(".pinned")).borderBottomWidth, round: [c.borderTopLeftRadius, getComputedStyle(tabs.at(-1)).borderTopRightRadius].join(" "), notch: [cut(tabs[0]).startsWith("polygon(0px 0px, 100% - 5.5px 0px, 100% 5.5px"), cut(tabs[1]).startsWith("polygon(5.5px 0px, 100% - 5.5px 0px, 100% 5.5px"), cut(tabs[2]).startsWith("polygon(5.5px 0px, 100% 0px, 100% 0px"), getComputedStyle(tabs[0], "::after").backgroundColor].join(" "), high: Math.round(r(tabs[0]).height) }; });
  check(strip.touch && strip.on_line === 2 && strip.line === "2px" && strip.round === "0px 0px" && strip.notch === "true true true rgb(17, 17, 17)" && strip.high === 40, `the hand tabs are tabs: touching, on a thick line, each cutting its top corners one unit deep so a sharp V stands over each joint, the first and last corner square, the chosen one ink (${strip.notch}), ${strip.high} high`);
}
{ // a hand's pane (13 Oct 2026): a box with the hand itself at the left, its rows beside it: a line of tiles that opens, numbers, colour
  const look = () => page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), box = r("#hand-detail"), rows = [...document.querySelectorAll(".form .pane .body")][0].querySelectorAll(".row.side:not([hidden])"), first = rows[0].getBoundingClientRect(), last = rows[rows.length - 1].getBoundingClientRect(), tiles = [...document.querySelectorAll(".picks.line > *")].filter((e) => e.offsetParent).map((e) => e.textContent);
    return { beside: Math.round(first.left - box.right), top: Math.round(box.top - first.top), bottom: Math.round(last.bottom - box.bottom), tiles: tiles.join(" "), panes: [...document.querySelectorAll(".form .pane h2")].map((h) => h.textContent).join(" · "), d: document.querySelector("#hand-detail .upright path").getAttribute("d"), centre: document.querySelectorAll("#hand-detail .upright .axis, #hand-detail .upright .pivot").length, one_line: [...rows].every((e) => e.getBoundingClientRect().height < 90) }; });
  const a = await look();
  check(a.beside === 12 && a.top === 6 && a.bottom === 6 && a.panes === "Hour hand · Cap" && a.centre === 2, `a hand has one pane: at the left a box with the hand itself, its centre marked, as high as the rows beside it (${JSON.stringify({ ...a, d: 0 })})`);
  check(a.tiles === "baton pencil more SVG", `its shapes are one line: ${a.tiles}`);
  await page.click("#hand-shape-Shape-more");
  const open = (await look()).tiles;
  await page.click("#hand-shape-Shape-7");
  await page.click("#hand-shape-Shape-more");
  const b = await look();
  check(open.split(" ").length === 11 && open.endsWith("less SVG") && b.tiles === "baton breguet more SVG" && b.d !== a.d, `more opens all nine (${open}); closed again, the chosen one has a place on the line (${b.tiles}), and the box shows it`);
  await page.click("#hand-shape-Shape-0");
  // the number box: the number with a tiny plus over a tiny minus; a press on the number and it grows over the slider
  const nb = () => page.evaluate(() => { const box = document.querySelector(".row.side .numbox"), r = box.getBoundingClientRect(), s = box.closest(".row").querySelector("input[type=range]").getBoundingClientRect(), [minus, plus] = [...box.querySelectorAll(".step")].map((e) => e.getBoundingClientRect()); return { w: Math.round(r.width), h: Math.round(r.height), over: r.left <= s.left + 1, stacked: plus.bottom <= minus.top + 1 && Math.round(plus.left) === Math.round(minus.left), step: Math.round(plus.width) + "x" + Math.round(plus.height) }; });
  const shut = await nb(), len = await S("S.ha_hour.len");
  await page.click(".row.side .numbox .step >> nth=1");
  const stepped = await S("S.ha_hour.len"), still = await nb();
  await page.click("#hand-len-Length");
  const wide = await nb();
  await page.click(".row.side .numbox .step >> nth=0");
  const back = await S("S.ha_hour.len"), held = await nb();
  await page.keyboard.press("Escape");
  const closed = await nb();
  check(shut.w === 60 && shut.h === 26 && shut.stacked && shut.step === "16x13" && near(stepped - len, 0.05, 1e-6) && still.w === 60, `beside the box a number has a tiny plus over a tiny minus (${shut.step}); they step it and the box stays small`);
  check(wide.over && wide.h === 32 && wide.step === "32x32" && !wide.stacked && near(back, len, 1e-6) && held.w === wide.w && closed.w === 60, `a press on the number and its box grows over the slider (${wide.w} wide): a large minus and plus beside the number; it stays open while they are pressed, Escape closes it`);
}
{ // one line through the top: the middle of the title's small letters, the unit box, undo and Guides
  const line = await page.evaluate(() => { const mid = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return r.top + r.height / 2; }, h = document.querySelector("h1"), probe = document.createElement("span"); probe.style.cssText = "display:inline-block;width:0;height:0"; h.append(probe);
    const base = probe.getBoundingClientRect().top; probe.remove(); const c = getComputedStyle(h), pen = document.createElement("canvas").getContext("2d"); pen.font = `${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
    return [base - pen.measureText("x").actualBoundingBoxAscent / 2, mid("#unit"), mid("#undo"), mid("#guides")]; });
  check(line.every((y) => Math.abs(y - line[1]) < 0.6), `the title's small letters, the unit box, undo and Guides are centred on one line (${line.map((y) => +y.toFixed(1)).join(" · ")})`);
}
await shot("4g-hand-tabs");
{ // 10:10 stands on the preview, over the bar, clear of the ruler (Okay, 13 Oct 2026); the scale drawing stays inside its button
  const p = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), pill = r(".steps12 .special"), bar = r(".bar"); return [Math.round((bar.top - pill.bottom) * 10) / 10, document.elementFromPoint(pill.left + pill.width / 2, pill.top + pill.height / 2).textContent]; });
  check(p[0] === 5.5 && p[1] === "10:10", `10:10 stands on the preview, one unit over the bar (${p[0]}), and can be pressed there`);
}
// Windows: four cards, 12 · 3 · 6 · 9, are the tabs; Show this window is on the heading line, also when the pane is folded
await tab("Date");
const cards = await page.$$eval(".windowcards .card > button:first-child", (b) => b.map((x) => [x.id, x.textContent, x.classList.contains("on"), Math.round(x.getBoundingClientRect().width)]));
check(cards.map((c) => c[1]).join("") === "" && cards.map((c) => c[0]).join(" ") === "window-card-1 window-card-0 window-card-2 window-card-3" && cards[1][2] && await page.$$eval(".cardswitch", (e) => e.length) === 0 && await page.evaluate(() => Math.round(document.querySelector(".windowcards .card").getBoundingClientRect().left) === Math.round(document.querySelector(".form .pane").getBoundingClientRect().left)), `four cards, pictures only, starting at the margin: 12 · 3 · 6 · 9; the date window of old is the one at 3, and chosen (${cards[0][3]} wide)`);
// a window's shape is its own: rectangle · circle · polygon · arch · arc; it can turn with its radius; its own font; three colours
{
  const was = await S("JSON.stringify([S.ui_window, S.da_on, S.da_at, S.da_shape, S.da_turn, S.da_ps, S.da_family, S.da_text_c, S.da_disc_c, S.da_w])");
  await page.evaluate(() => { const t = window.dial_tool; t.S.ui_window = 0; t.set_value("window", "on", true); t.sync_rows(); });
  const tiles = await page.$$eval('[id^="window-shape-"]', (b) => b.map((x) => [x.textContent, x.classList.contains("on")]));
  const box = async () => { await frame(); return page.evaluate(() => { const b = window.dial_tool.statik.windows[0].window.bounds(); return [+(b[2] - b[0]).toFixed(3), +(b[3] - b[1]).toFixed(3)]; }); };
  const rect = await box();
  await page.click("#window-shape-circle");
  const circle = [await box(), await page.isHidden("#window-h-Height"), await page.isVisible('[id="window-w-"]')];
  await page.click("#window-shape-polygon");
  const polygon = [await box(), await page.isVisible("#window-sides-Sides"), await page.isVisible("#window-round-Corner")];
  await page.click("#window-shape-arc");
  const arc = [await box(), await page.isHidden("#window-turn-Turn-it-with-its-radius")];
  await page.click("#window-shape-arch");
  const arch = await box();
  await page.click("#window-shape-rectangle");
  check(tiles.map((t) => t[0]).join(" ") === "rectangle circle polygon arch arc" && tiles[0][1] && Math.abs(circle[0][0] - circle[0][1]) < 0.01 && circle[1] && circle[2] && polygon[1] && polygon[2] && arc[1] && arc[0][0] !== rect[0] && arch[1] < arch[0] && await S("S.da_shape") === 1,
    `Shape: five tiles, a date window starts as a rectangle (${rect.join(" × ")}); circle ${circle[0].join(" × ")}, polygon with Sides and Corner, arc ${arc[0].join(" × ")} (no turning), arch ${arch.join(" × ")}`);
  { // a window's place: a square of the quarters, a white bar, the places between, and three dots for any time
    const grid = await page.evaluate(() => { const r = (e) => e.getBoundingClientRect(), q = [...document.querySelectorAll(".atgrid .quarters button")].map(r), bar = r(document.querySelector(".atgrid .divide")), b = [...document.querySelectorAll(".atgrid .between button")].map(r);
      return [q.length === 4 && Math.round(q[0].top) === Math.round(q[1].top) && Math.round(q[2].top) === Math.round(q[3].top) && q[2].top > q[0].top, bar.left > q[1].right && bar.right < b[0].left && bar.height > 50 && getComputedStyle(document.querySelector(".atgrid .divide")).backgroundColor, b.length === 6 && Math.round(b[3].top) > Math.round(b[0].top)].join(" "); });
    const before = await S("[S.da_at, S.da_at_deg]");
    await page.click("#window-at-more");
    const open = await page.isVisible("#window-at-time");
    await page.fill("#window-at-time", "2:15"); await page.press("#window-at-time", "Enter");
    const own = [await S("S.da_at_deg"), await page.textContent("#window-at-more"), await page.textContent(".form .pane h2"), await page.$$eval(".atgrid button.on", (b) => b.map((x) => x.id).join())];
    await page.click("#window-at-more"); await page.fill("#window-at-time", "4:30"); await page.press("#window-at-time", "Enter");
    const named = await S("[S.da_at, S.da_at_deg]");
    await page.click("#window-at-Position-" + before[0]);
    check(grid === "true rgb(255, 255, 255) true", `a window's place: a square of 3 · 6 · 9 · 12, a white bar, the five between and three dots (${grid})`);
    check(open && own[0] === 67.5 && own[1] === "2:15" && own[2] === "Window at 2:15" && own[3] === "window-at-more" && named[0] === 1 && named[1] === null && await S("S.da_at_deg === null"), `three dots open a field for any time: 2:15 puts the window at 67.5°, and the box says so; a named time typed there (4:30) is that place`);
  }
  // turned with its radius at 4: 30°; the text with it or level
  await page.click("#window-at-Position-8");      // 4 o'clock: the ninth in the list (R9), a button now
  const level = await box();
  await page.check("#window-turn-Turn-it-with-its-radius");
  const turned = await box(), text_turned = await page.evaluate(() => { const b = window.dial_tool.statik.windows[0].number.bounds(); return b[3] - b[1]; });
  await page.uncheck("#window-text-turn-Turn-the-text-with-it");
  await frame();
  const text_level = await page.evaluate(() => { const b = window.dial_tool.statik.windows[0].number.bounds(); return b[3] - b[1]; });
  await shot("4c17-window-turned");
  check(turned[1] > level[1] + 0.3 && text_turned > text_level + 0.1 && await S("S.da_at === 8"), `at 4 a window turned with its radius stands 30° askew (its box ${level.join(" × ")} → ${turned.join(" × ")}); its text turns with it, or stays level`);
  // its own font, and back
  const ring_font = await S("S.rings.find((r) => r.kind === 2).ps");
  await page.click("#window-font-current");
  await page.click('#font-picker .fontrow[data-family="Oswald"]');
  await page.waitForFunction(() => window.dial_tool.S.da_ps === "Oswald-Regular" && window.dial_tool.statik);
  const own = [await S("S.da_family"), await S("S.rings.find((r) => r.kind === 2).ps"), await page.isVisible("#window-font-back")];
  if (await page.$eval("#font-picker", (d) => d.open)) await page.keyboard.press("Escape");
  { // a window's own tracking and language (beta 4.26): unset they are the numerals'; As the numerals takes them back
    const before = await S("S.da_tracking === null && S.da_lang === null");
    await page.fill("#window-tracking-Tracking", "40"); await page.press("#window-tracking-Tracking", "Enter");
    await page.click("#window-lang"); await page.click("#window-lang-tr");
    check(before && await S("S.da_tracking === 40 && S.da_lang === 1 && S.rings.find((r) => r.kind === 2).tracking === 0") && await page.textContent("#window-lang") === "TR", "a window has tracking and a language of its own, in its font box; the numerals keep theirs");
  }
  { // every font box has all of it (beta 4.30): a window's box has the variable axes and the OpenType features too, and both can be put away
    await page.waitForFunction(() => document.querySelector("#window-axis-wght"), null, { timeout: 8000 }).catch(() => {});
    const ring_before = await S("JSON.stringify(S.rings.find((r) => r.kind === 2).axes)");
    await page.fill("#window-axis-wght", "600"); await page.press("#window-axis-wght", "Enter");
    check(await page.isHidden(".fontbox .features"), "the OpenType features are put away until asked for");
    await page.click('.fontbox .partfold:has-text("OpenType")');
    const tile = await page.$("#window-feature-tnum") ? "tnum" : await page.$eval(".boxpart .features .tile", (e) => e.dataset.tag);
    await page.click("#window-feature-" + tile);
    check(await S("S.da_axes.wght === 600") && await S(`S.da_features && Object.keys(S.da_features)[0] === '${tile}'`) && await S("JSON.stringify(S.rings.find((r) => r.kind === 2).axes)") === ring_before, `a window's font box has its own variable axes and OpenType features (weight 600, ${tile}); the numerals keep theirs`);
    const heads = await page.$$eval(".fontbox .partfold", (b) => b.filter((e) => e.offsetParent).map((e) => e.textContent).join(" · "));
    await page.click(".fontbox .partfold >> nth=0");
    const shut = await page.isHidden(".fontbox .features");
    await page.click(".fontbox .partfold >> nth=0");
    const tag = await page.$eval(".fontbox .features .tile", (e) => { const s = e.querySelector(".sticker"), c = getComputedStyle(s); return [s.textContent === e.dataset.tag, c.fontSize, c.fontFamily.includes("Silkscreen")].join(" "); });
    const lines = await page.$$eval(".fontbox > *", (e) => e.filter((x) => x.offsetParent).map((x) => (x.querySelector("label, .partfold span, .stickerlabel") || {}).textContent || x.className.split(" ")[0]).join(" · "));
    check(heads === "OpenType features" && shut && await page.isVisible(".fontbox .features") && tag === "true 8px true", `the OpenType features can be put away and brought back; a feature is a tile with its code as a sticker (${tag})`);
    check(lines.includes("Size % · Tracking · Weightwght · OpenType features"), `the box's lines, top to bottom: ${lines}`);
  }
  await page.click("#window-font-back");
  check(await S("S.da_tracking === null && S.da_lang === null && S.da_features === null && Object.keys(S.da_axes).length === 0"), "As the numerals takes the window's tracking, language, axes and features back too");
  check(own[0] === "Oswald" && own[1] === ring_font && own[2] && await S("S.da_ps === ''") && !(await page.textContent("#window-font-name")).includes("as the numerals"), "a window can have a font of its own (Oswald) without touching the numerals' font; As the numerals takes it back");
  // three colours
  const fills = async () => { await frame(); return page.evaluate(() => { const t = window.dial_tool, items = [...document.querySelectorAll("main svg [fill]")]; const S = t.S; return [S.da_text_c, S.da_disc_c, S.da_ink]; }); };
  await page.evaluate(() => { const t = window.dial_tool; t.set_value("window", "disc_c", [0.1, 0.1, 0.1, 1]); t.set_value("window", "text_c", [1, 0.9, 0.2, 1]); });
  await frame();
  const scene = await page.evaluate(() => { const t = window.dial_tool; return t.slots ? [...document.querySelectorAll("main svg path")].map((p) => p.getAttribute("fill")).filter(Boolean) : []; });
  await shot("4c18-window-colours");
  check((await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent))).join(" · ").endsWith("Colours · Shape") && await page.evaluate(() => { const rows = [...document.querySelectorAll(".form .pane .body")][0].children, ids = [...rows].filter((r) => r.offsetParent).map((r) => (r.querySelector("select, input, button") || {}).id); return ids[0] === "window-at-Position-0" && ids[1].startsWith("window-r-Radius") && [...document.querySelectorAll(".atgrid button")].map((b) => b.textContent).join(" ") === "3 6 9 12 1:30 4 4:30 7:30 10:30 ···"; }) && await page.$eval("#window-clear-Clearance", (e) => e.closest(".pane").querySelector("h2").textContent) === "Shape" && await page.$eval("#window-frame-Frame", (e) => e.closest(".pane").querySelector("h2").textContent) === "Shape" && await page.isVisible("#window-font-c") && await page.isHidden("#window-text-c-Picture") && await page.isVisible("#window-disc-c-Disc-under-it") && await page.isVisible("#window-ink-Frame"),
    "Windows has the panes Colours · Shape, and no Print pane: position, radius and size come first in the window's own pane, right under Show this window; Frame and Clearance are in Shape; the text's colour is a small swatch beside its font's name; Colours: the disc under it, the frame (and the picture's, for a window that shows one)");
  await page.evaluate((was) => { const t = window.dial_tool, [ui, on, at, shape, turn, ps, family, text_c, disc_c, w] = JSON.parse(was); Object.assign(t.S, { da_at: at, da_shape: shape, da_turn: turn, da_ps: ps, da_family: family, da_text_c: text_c, da_disc_c: disc_c, da_w: w, da_text_turn: true, da_on: on, ui_window: ui }); t.static_dirty = true; t.sync_rows(); t.render(); }, was);
}
// an am · pm window follows the time shown: light at 10 in the morning, dark at 10 at night; AM · PM stands in the time's box
{
  const was = await page.evaluate(() => { const t = window.dial_tool, was = [t.S.ui_window, t.S.da_on, t.S.da_kind, t.S.t]; t.S.ui_window = 0; t.set_value("window", "on", true); t.set_value("window", "kind", 2); return was; });
  const dark = async () => { await frame(); return page.evaluate(() => { const t = window.dial_tool, x = t.statik.windows[0], b = x.number.bounds(), w = x.window.bounds(); return b ? (b[2] - b[0]) * (b[3] - b[1]) / ((w[2] - w[0]) * (w[3] - w[1])) : 0; }); };
  await page.fill("#time", "10:00"); await page.press("#time", "Enter");
  const am = [await S("S.t"), await page.textContent("#ampm"), await dark()];
  await page.click("#ampm");
  const pm = [await S("S.t"), await page.textContent("#ampm"), await dark(), await page.inputValue("#time")];
  await shot("4c12-ampm");
  await page.fill("#time", "15:20"); await page.press("#time", "Enter");
  const typed = [await S("S.t"), await page.inputValue("#time")];
  await page.fill("#time", "3:20 am"); await page.press("#time", "Enter");
  const said = await S("S.t");
  check(am[0] === 36000 && am[1] === "AM" && pm[0] === 79200 && pm[1] === "PM" && pm[3] === "10:00:00" && pm[2] > am[2] + 0.3 && typed[0] === 55200 && typed[1] === "3:20:00" && said === 12000 && await page.$('[id*="Hour-of-the-day"]') === null,
    `an am · pm window follows the time: at 10 AM ${(am[2] * 100).toFixed(0)} % of it is drawn dark, at 10 PM ${(pm[2] * 100).toFixed(0)} %; "15:20" is 3:20 PM, "3:20 am" the morning; no Hour of the day row`);
  await page.evaluate((was) => { const t = window.dial_tool; t.set_value("window", "kind", was[2]); t.set_value("window", "on", was[1]); t.S.ui_window = was[0]; t.set_time(was[3]); t.sync_rows(); }, was);
}
await tab("Export");
const example_w = 78;      // what an example card measured while there were five in a row (until beta 4.13): a window card keeps that size
await tab("Date");
{ // tabs (13 Oct 2026): the window cards and the hand tabs touch each other, stand on the line under them, have round top corners (the notch between two) and fill the six columns
  const strip = await page.evaluate(() => { const cards = [...document.querySelectorAll(".windowcards .card > button")], r = (e) => e.getBoundingClientRect(), pinned = document.querySelector(".pinned"), pane = document.querySelector(".form .pane"), c = getComputedStyle(cards[0]);
    return { touch: cards.every((b, i) => !i || Math.abs(r(b).left - r(cards[i - 1]).right) <= 1), on_line: Math.round(r(pinned).bottom - r(cards[0]).bottom) + " " + getComputedStyle(pinned).borderBottomWidth + " " + pinned.contains(cards[0]), round: [c.borderTopLeftRadius, getComputedStyle(cards.at(-1)).borderTopRightRadius].join(" "), notch: cards.map((b) => getComputedStyle(b, "::before").clipPath.startsWith("polygon")).join(" "), left: Math.round(r(cards[0]).left - r(pane).left), right: Math.round(r(cards.at(-1)).right - r(pane).right), high: Math.round(r(cards[0]).height) }; });
  check(strip.touch && strip.on_line === "2 2px true" && strip.round === "0px 0px" && strip.notch === "true true true true" && strip.left === 0 && strip.right === 0 && strip.high >= 54, `the window cards are tabs, always in view: touching, on a thick line, square at both ends with a sharp notch over each joint, from margin to margin (${strip.high} high; ${JSON.stringify(strip)})`);
}
await page.click("#window-card-2");
check(await S("S.ui_window === 2 && S.windows[1].at === 2 && S.windows[1].on === false") && await page.textContent(".form .pane >> nth=0 >> h2") === "Window at 6" && await page.$eval("#window-card-2", (e) => e.classList.contains("on") && e.classList.contains("off")), "the card at 6 chooses its window: the pane says Window at 6; not in use yet, it takes the card's place");
const on_head = await page.evaluate(() => { const pane = document.querySelector(".form .pane"), c = pane.querySelector(".headcontrol").getBoundingClientRect(), h = pane.querySelector(".fold").getBoundingClientRect(); return [c.top >= h.top && c.bottom <= h.bottom, pane.querySelector(".headcontrol input").id]; });
check(on_head[0] && on_head[1] === "window-on-Show-this-window", "Show this window is on the heading line: the cards are tabs only");
await page.click(".form .pane >> nth=0 >> .fold h2");
check(await page.isVisible("#window-on-Show-this-window"), "folded, the pane still shows it");
await page.click(".form .pane >> nth=0 >> .fold h2");
await page.click("#window-card-0");
await shot("4h-window-cards");
await tab("Hands");
// All hands: one line, always in view — its name, the tick, the menu, on the columns
const bar_line = await page.evaluate(() => { const b = document.querySelector(".pinned .handsbar"), tops = [...b.children].map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); const x = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left); return [Math.max(...tops) - Math.min(...tops), x(".handsbar .check") - x(".form .pane:last-child .row.num input[type=range]"), b.querySelector("h2").textContent]; });
check(bar_line[0] <= 1 && bar_line[1] === 0 && bar_line[2] === "All hands", "All hands is one pinned line: name · Show hands · Motion, the tick on the controls' column");
await page.selectOption("#global-ha-beat-Motion", "1");
await page.uncheck("#global-ha-on-Show-hands");
await frame();
check(await S("S.ha_beat === 1 && S.ha_on === false && !t.items.some((i) => i.role === 'hand')"), "its menu and tick work: quartz, hands hidden");
await page.check("#global-ha-on-Show-hands"); await page.selectOption("#global-ha-beat-Motion", "0");
await shot("4f-hands-bar");
await tab("Dial");
// the columns: every slider, value and stepper starts on the same three lines
const lines = await page.$$eval(".pinned .row.num", (rows) => [...new Set(rows.filter((r) => r.offsetParent).map((r) => [...r.children].slice(1).map((c) => Math.round(c.getBoundingClientRect().left)).join("/")))]);
check(lines.length === 1, `number rows share their columns (${lines.join(" | ")})`);

// ── colour: a swatch opens the pop-out at its right; the value can be typed ──
await page.click("#global-c-plate-Plate");
const pop_at = await page.evaluate(() => { const p = document.querySelector("#colour-pop").getBoundingClientRect(), s = document.querySelector("#global-c-plate-Plate").closest(".colour").getBoundingClientRect(); return [Math.round(p.left - s.right), p.top < s.bottom && p.bottom > s.top]; });
check(await page.isVisible("#colour-pop") && pop_at[0] === 12 && pop_at[1], "the plate's swatch opens the colour pop-out, 12 to the right of its pill");
const pop_look = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#colour-pop")), pill = getComputedStyle(document.querySelector("#global-c-plate-Plate").closest(".colour")); return [c.backgroundColor, parseFloat(c.borderTopLeftRadius), parseFloat(pill.borderTopLeftRadius), getComputedStyle(document.querySelector("#global-c-plate-Plate-hex")).fontFamily.includes("mono") && document.querySelector("#global-c-plate-Plate").tagName === "BUTTON" && getComputedStyle(document.querySelector("#global-c-plate-Plate")).backgroundColor === "rgb(17, 17, 17)"]; });
check(pop_look[0] === "rgb(20, 20, 19)" && pop_look[1] >= 12 && pop_look[2] >= 4 && pop_look[3], "the pop-out is near black with round corners; a colour in the panel is a pill, one button: a small swatch and its hex in monospace; black while its pop-out is open");
check(await page.isHidden(".alpharow"), "the plate has no opacity strip");
await page.mouse.click(200, 800);
check(await page.isHidden("#colour-pop"), "a press outside the pop-out puts it away");
await page.click("#global-c-plate-Plate");
await page.mouse.click(200, 800);
await page.click("#global-c-plate-Plate-hex");
check(await page.isVisible("#colour-pop") && await page.textContent("#colour-pop h2") === "Plate", "a click on the hex in the pill opens the pop-out too");
check(await page.$$eval("#pop-used button", (b) => b.length) >= 3 && await page.$$eval("#pop-palette button[data-colour]", (b) => b.length) === 10 && await page.isVisible('#pop-palette [data-colour="#0E2A47"]'), "first row: this dial's colours; second row: a palette of ten");
const one_row = await page.$$eval("#pop-palette button", (b) => new Set(b.map((x) => Math.round(x.getBoundingClientRect().top))).size);
check(one_row === 1, "the ten and their + stand in one row");
const sv = await page.$eval("#colour-pop .sv", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await page.mouse.click(sv[0] + sv[2] * 0.5, sv[1] + sv[3] * 0.25);
const picked = await S("(() => { const [r, g, b] = S.c_plate, hi = Math.max(r, g, b), lo = Math.min(r, g, b); return [hi, (hi - lo) / hi]; })()");
check(near(picked[0], 0.75, 0.03) && near(picked[1], 0.5, 0.03), "a click in the colour field: half strength, three quarters bright");
const hue = await page.$eval("#colour-pop .hue", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await page.mouse.click(hue[0] + hue[2] * 2 / 3, hue[1] + hue[3] / 2);
check(await S("S.c_plate[2] > S.c_plate[0] && S.c_plate[2] > S.c_plate[1]") && hue[3] >= 20, "a click two thirds along the hues: blue (the strip is 20 high or more)");
// add the colour in hand to the palette; it is kept by the browser; − takes it out
const in_hand = await S("document.querySelector('#global-c-plate-Plate-hex').textContent");
await page.click("#pop-add");
check(await page.$$eval("#pop-palette button[data-colour]", (b) => b.length) === 11 && await S(`JSON.parse(localStorage.getItem('dial-tool-palette')).includes('${in_hand}')`) && await page.textContent("#pop-add") === "−", "+ adds the colour in hand to the palette, kept by the browser; the + becomes −");
await page.click("#pop-add");
check(await page.$$eval("#pop-palette button[data-colour]", (b) => b.length) === 10, "− takes it out again");
await page.click("#pop-as-CMYK");
await page.fill("#pop-K", "100");
await page.press("#pop-K", "Enter");
await page.click("#pop-as-HEX");
check(JSON.stringify(await S("S.c_plate.slice(0, 3)")) === "[0,0,0]" && await page.inputValue("#pop-hex") === "#000000", "CMYK: K 100 is black, and HEX says #000000");
await page.click("#pop-as-RGB");
await page.fill("#pop-R", "255");
await page.press("#pop-R", "Enter");
check(await page.textContent("#global-c-plate-Plate-hex") === "#FF0000", "RGB: R 255 → #FF0000");
const one_line = await page.evaluate(() => { const tops = [...document.querySelectorAll("#colour-pop .asnumbers button, #colour-pop .asnumbers input")].map((e) => Math.round(e.getBoundingClientRect().top)); const c = getComputedStyle(document.querySelector("#pop-copy")); return [new Set(tops).size, c.textTransform, document.querySelector("#pop-copy").textContent]; });
check(one_line[0] === 1 && one_line[2] === "COPY", "RGB · CMYK · HEX, the values and COPY stand on one line, in capitals");
const pop_size = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
const chip_gaps = await page.$$eval("#pop-palette button", (b) => { const r = b.map((x) => x.getBoundingClientRect()); return [Math.round(r[1].left - r[0].right), Math.round(r[0].width * 10) / 10, Math.round(r[0].height * 10) / 10]; });
check(chip_gaps[0] === 12 && chip_gaps[1] === chip_gaps[2] && chip_gaps[1] < 22, `the chips stand 12 apart and share the row: ${chip_gaps[1]} square`);
// its head drags it; the square widens it over the preview and back
const pop_before = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width]; });
await page.mouse.move(pop_before[0] + 60, pop_before[1] + 20);
await page.mouse.down();
await page.mouse.move(pop_before[0] + 260, pop_before[1] + 120, { steps: 4 });
await page.mouse.up();
const pop_moved = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; });
check(Math.round(pop_moved[0] - pop_before[0]) === 200 && Math.round(pop_moved[1] - pop_before[1]) === 100, "dragged by its head it moves with the pointer");
await page.click("#pop-wide");
const twice = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.width, r.height, r.right <= innerWidth && r.bottom <= innerHeight]; });
check(Math.round(twice[0]) === 2 * Math.round(pop_before[2]) && near(twice[1], 2 * pop_size[1], 2) && twice[2], `its square makes it twice the size: ${Math.round(twice[0])} × ${Math.round(twice[1])}, inside the window`);
await shot("4c2-picker-wide");
await page.click("#pop-wide");
const pop_back = await page.$eval("#colour-pop", (e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
check(pop_back[0] === pop_before[2] && near(pop_back[1], pop_size[1], 1), "and back to its own size");
await shot("4c1-picker");
await page.click('#colour-pop [data-colour="#0E2A47"]');
check(JSON.stringify(await S("S.c_plate.map((v) => Math.round(v * 255))")) === "[14,42,71,255]" && await page.textContent("#global-c-plate-Plate-hex") === "#0E2A47", "picking navy sets the plate, and the value shows as text");
await page.click("#pop-as-HEX"); await page.fill("#pop-hex", "ede8db"); await page.press("#pop-hex", "Enter");
check(JSON.stringify(await S("S.c_plate.map((v) => Math.round(v * 255))")) === "[237,232,219,255]", "a typed value sets it too");
await page.click("#global-c-plate-Plate");
await shot("4c2-colour");
check(await page.$$eval(".tabs button", (b) => b.map((x) => x.textContent.trim()).join(" ")) === "Dial Rings Hands Windows Export" && await page.$("main button.guidesbox#guides svg") !== null, "tabs: Export last; Guides is a rounded switch with a bullseye at the top right");

// ── windows: up to four, each a date, a day, am · pm or a moon phase ──
await tab("Date");
const kinds = [["1", "1", "9"], ["2", "2", "6"], ["3", "3", "12"]];          // window (its card's number), kind, position
for (const [n, kind, at] of kinds) {
  await page.click("#window-card-" + n);
  await page.check("#window-on-Show-this-window");
  await page.click("#window-kind-Shows-" + kind);
  await page.click("#window-at-Position-" + ["3", "4:30", "6", "9", "12", "1:30", "7:30", "10:30", "4"].indexOf(at));
}
await page.fill("#window-age-Moon-age-days", "6");
await page.press("#window-age-Moon-age-days", "Enter");
await page.fill("#window-w-Width", "4");
await page.press("#window-w-Width", "Enter");
await frame();
check(await S("t.statik.windows.length === 4 && S.windows[0].text === 'MON' && S.windows.map((w) => w.kind).join('') === '123'"), "four windows: date, day (its text became MON), am · pm, moon phase");
check(await S("t.statik.windows.every((x) => x.number.bounds() !== null && x.window.bounds() !== null)") && await S("t.items.filter((i) => i.role === 'date disc').length === 4"), "each window has a hole and something showing through it");
const moon_at = await S("(() => { const b = t.statik.windows[3].window.bounds(); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2 + 0.6]; })()");
await over_mm(...moon_at);
check((await page.textContent(".tip span")) === "Moon phase window", "pointer on the fourth window: Moon phase window");
await click_mm(...moon_at);
check(await S("S.ui_section === 3 && S.ui_window === 3") && await page.isVisible("#window-age-Moon-age-days") && await page.isHidden("#window-h-Height"), "click it: Windows, window 4, with the moon's rows");
await shot("4d-windows");
for (const n of ["1", "2", "3"]) { await page.click("#window-card-" + n); await page.uncheck("#window-on-Show-this-window"); }
await page.click("#window-card-0");
check(await S("t.statik.windows.length === 1"), "windows 2 to 4 switched off again");

// ── fonts: only the ring's font shows in Type; the list is a sheet over the panel ──
await click_mm(...clock(10, 120));
check(await page.$$eval(".form .fontrow", (rows) => rows.length) === 1 && await page.$$eval(".form select#font-family", (e) => e.length) === 0, "Type shows one font, the selected one, and no dropdowns");
await page.click("#font-current");
const sheet_at = await page.$eval("#font-picker", (d) => { const r = d.getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); const c = getComputedStyle(d), p = document.querySelector(".panel").getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width - p.width), Math.round(r.right - m.left), c.boxShadow !== "none", !document.querySelector("#font-done")].join(" "); });
check(await page.$eval("#font-picker", (d) => d.open) && sheet_at === "184 0 -1 183 true true" && await page.$eval("#font-picker", (d) => Math.round(document.querySelector(".bar").getBoundingClientRect().top - d.getBoundingClientRect().bottom) === 0 && document.activeElement !== document.querySelector("#font-find") && document.querySelector("#font-find").closest("header") !== null), `pressing it opens the font sheet: floating over the panel, from the window's top down to the bar, its left edge on the panel's third column, as wide as the panel less its edge line, with a shadow; no Done button; Find a font is on its top line and waits for a press (${sheet_at})`);
{
  const row = await page.evaluate(() => { const rows = [...document.querySelectorAll("#font-picker .fontrow")], x = (e) => Math.round(e.getBoundingClientRect().left), by = (f) => rows.find((r) => r.dataset.family === f);
    return { names: new Set(rows.map((r) => x(r.querySelector(".name")))).size, numerals: new Set(rows.map((r) => x(r.querySelector(".sample")))).size, order: rows.every((r) => x(r.querySelector(".name")) < x(r.querySelector(".sample")) && x(r.querySelector(".sample")) < x(r.querySelector(".has"))), drawn: by("Jost").querySelector(".name svg path") !== null, barlow: [...by("Barlow").querySelectorAll(".sticker")].map((e) => e.textContent + "/" + e.className.split(" ")[1]).join(" "), archivo: [...by("Archivo").querySelectorAll(".sticker")].map((e) => e.textContent + "/" + e.className.split(" ")[1]).join(" "), sticker: (() => { const c = getComputedStyle(by("Archivo").querySelector(".sticker.weight")), d = getComputedStyle(by("Archivo").querySelector(".sticker.width")); return [c.fontFamily.includes("Silkscreen"), c.fontSize, c.backgroundColor !== d.backgroundColor, c.borderTopLeftRadius].join(" "); })(), two_lines: rows.filter((r) => r.dataset.group === "list" && r.querySelector(".has").getBoundingClientRect().height > 20).map((r) => r.dataset.family).join(), one_line: by("Arimo").querySelector(".has").getBoundingClientRect().height < 30 && by("Routed Gothic").querySelector(".has").getBoundingClientRect().height < 30, sets: [...by("Cormorant").querySelectorAll(".sticker.sets")].map((e) => e.textContent).join(" | "), legend: [...document.querySelectorAll("#font-legend dt")].map((e) => e.textContent).join(" "), legend_at: (() => { const l = document.querySelector("#font-legend").getBoundingClientRect(), d = document.querySelector("#font-picker").getBoundingClientRect(); return l.bottom > d.bottom - 80 && l.top > document.querySelector("#font-picker .squares").getBoundingClientRect().bottom; })(), cut: rows.every((r) => { const sv = r.querySelector(".sample svg"); return !sv || Math.round(sv.getBoundingClientRect().height) === 25; }), fits: rows.every((r) => { const n = r.querySelector(".name"), g = n.querySelector("svg"); return !g || g.getBoundingClientRect().right <= n.getBoundingClientRect().right + 0.5; }), has: new Set(rows.map((r) => Math.round(r.querySelector(".has").getBoundingClientRect().width))).size, line: getComputedStyle(rows[0]).borderBottomColor === getComputedStyle(document.querySelector(".fontlist")).borderTopColor,
      squares: [...document.querySelectorAll("#font-picker .squares > .pickt")].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return b.textContent + " " + (Math.round(r.width) === Math.round(r.height)); }).join(" · ") }; });
  check(row.names === 1 && row.numerals === 1 && row.order && row.drawn && row.line, "a line of the sheet: the family's name drawn in its own face at the left · its numerals, all starting on one line · what it has; a full line between two");
  check(row.barlow === "bold/weight tabular/figure fractions/figure 4 styles/styles" && row.archivo === "weight 100–900/weight width/width tabular/figure oldstyle/figure zero/figure fractions/figure" && row.sticker === "true 8px true 3px" && row.has === 1, `what a family has, as stickers in the pixel font, in words, a colour for each kind, round corners: Barlow ${row.barlow}; Archivo ${row.archivo}; their column is one width (${row.sticker})`);
  check(row.one_line, `a row's stickers stand on one line where the column lets them (on more: ${row.two_lines || "none"})`);
  check(row.sets === "12 sets | 5 variants", `a family's numbered sets and variants are two stickers at most, one colour (Cormorant: ${row.sets})`);
  check(row.legend === "weight 100–900 bold italic width optical tabular oldstyle zero fractions 2 sets 3 styles" && row.legend_at, `a legend at the sheet's bottom, under the square buttons, says what each sticker means (${row.legend})`);
  check(row.cut, "numerals keep their size in every row: the wide ones are cut at their column's edge, none above");
  check(row.fits, "every family's name fits its column: the long ones are drawn smaller");
  check(row.squares.startsWith("Add link true · Font file true"), `Add fonts has square buttons (${row.squares})`);
  await page.keyboard.press("Escape");
  { // the text's colour stands in the ring list's colour column; the name's whole line opens the sheet
    const col = await page.evaluate(() => { const mid = (e) => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; }; return [mid(document.querySelector(".ringlist li.ring:not(.on) .chipcell")), mid(document.querySelector("#font-c")), document.querySelector("#font-c").getBoundingClientRect().right <= document.querySelector("#font-change").getBoundingClientRect().left, true]; });
    const name = await page.$eval("#font-name", (e) => { const r = e.getBoundingClientRect(); return [r.right - 6, r.top + r.height / 2]; });
    await page.mouse.click(name[0], name[1]);
    const opened = await page.$eval("#font-picker", (d) => d.open);
    await page.keyboard.press("Escape");
    await page.click("#font-c");
    const colour_only = await page.$eval("#font-picker", (d) => !d.open) && await page.isVisible("#colour-pop");
    await page.keyboard.press("Escape"); await page.mouse.click(640, 30);
    check(Math.abs(col[0] - col[1]) < 0.6 && col[2] && col[3], `the text's colour beside the font's name stands in the ring list's colour column (${col[0]} = ${col[1]}), before Change…`);
    check(opened && colour_only, "a press anywhere on the name's line opens the font sheet; a press on the colour opens the colour instead");
    await page.click("#font-change");
  }
  const shut = await page.isHidden("#font-link");
  await page.click("#font-add");
  check(shut && await page.isVisible("#font-link") && await page.evaluate(() => document.activeElement.id === "font-link"), "the field for a link is out of sight until Add link is pressed; then it is there, with the keyboard in it");
}
check(await page.$$eval('#font-picker .fontrow[data-group="list"]', (rows) => rows.length) === 20 && await page.$$eval('#font-picker .fontrow[data-group="list"] .sample svg path', (p) => p.length) === 20, "the sheet lists the tool's twenty families, each showing numerals in its own outlines");
await page.click('.fontrow[data-family="Jost"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Jost-Regular" && document.querySelector("#axis-wght"), null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Jost-Regular'") && await page.$("#axis-wght") !== null && await page.$eval("#font-picker", (d) => d.open), "click Jost: fetched and drawn, the sheet stays open to compare");
await page.click('.fontrow[data-family="Josefin Sans"]');
await page.waitForFunction(() => window.dial_tool.ring().family === "Josefin Sans");
check(await S("S.rings[S.ui_ring].axes.wght === 400"), "a variable font that rests at Thin starts at regular weight");
await shot("5a-font-sheet");

// add fonts: a Google Fonts link (served here from this machine: the test needs no network)
const meta = (name, file, ps) => `name: "${name}"\nlicense: "OFL"\nfonts {\n  name: "${name}"\n  style: "normal"\n  weight: 400\n  filename: "${file}"\n  post_script_name: "${ps}"\n  full_name: "${name} Regular"\n}\nfonts {\n  name: "${name}"\n  style: "italic"\n  weight: 400\n  filename: "Italic.ttf"\n  post_script_name: "${ps}Italic"\n  full_name: "${name} Italic"\n}\n`;
const asked_for = [];
await context.route("https://raw.githubusercontent.com/google/fonts/main/**", (route) => {
  const path_ = decodeURIComponent(route.request().url().split("/main/")[1]);
  asked_for.push(path_);
  const cors = { "access-control-allow-origin": "*" };
  if (path_ === "ofl/lora/METADATA.pb") return route.fulfill({ body: meta("Lora", "Lora[wght].ttf", "Lora-Regular"), headers: cors });
  if (path_ === "ofl/lora/Lora[wght].ttf") return route.fulfill({ path: "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf", headers: cors });
  return route.fulfill({ status: 404, body: "404: Not Found", headers: cors });
});
if (await page.isHidden("#font-link")) await page.click("#font-add");
await page.fill("#font-link", "https://fonts.google.com/specimen/Lora?preview.text=12");
await page.click("#font-add");
await page.waitForFunction(() => window.dial_tool.ring().family === "Lora" && window.dial_tool.statik, null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Lora-Regular'") && asked_for.includes("ofl/lora/Lora[wght].ttf") && !asked_for.includes("ofl/lora/Italic.ttf"), "a Google Fonts page link adds the family's upright fonts and uses it");
check((await page.textContent("#picker-note")).includes("Added Lora") && await page.$('#font-picker .fontrow[data-family="Lora"][data-group="added"] .sample svg') !== null && await S("JSON.parse(localStorage.getItem('dial-tool-fonts')).some((f) => f.ps === 'Lora-Regular' && f.url.includes('raw.githubusercontent.com'))"), "the sheet says so; Lora is listed under Added by you with its numerals, and this browser remembers where it came from");
if (await page.isHidden("#font-link")) await page.click("#font-add");
await page.fill("#font-link", "Nonesuch Grotesk");
await page.press("#font-link", "Enter");
await page.waitForFunction(() => document.querySelector("#picker-note").textContent.includes("no family"), null, { timeout: 8000 }).catch(() => {});
check((await page.textContent("#picker-note")).includes("no family spelled"), "a name Google Fonts doesn't have is answered plainly");
if (await page.isHidden("#font-link")) await page.click("#font-add");
await page.fill("#font-link", "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap");
await page.press("#font-link", "Enter");
await page.waitForFunction(() => document.querySelector("#picker-note").textContent.includes("Added Lora"), null, { timeout: 8000 }).catch(() => {});
check((await page.textContent("#picker-note")).includes("Added Lora"), "an embed link (fonts.googleapis.com/css2?family=…) works too");
errors.length = 0;                                   // the three "not found" answers above are the browser's, and expected

// a font file
await page.setInputFiles("#font-file", "/usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf");
await page.waitForFunction(() => window.dial_tool.ring().ps === "Poppins-Light", null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Poppins-Light'") && (await page.textContent("#picker-note")).includes("Added Poppins"), "a font file is added and used");
await page.click('#font-picker .fontrow[data-family="Lora"]');
await page.waitForFunction(() => window.dial_tool.ring().family === "Lora");
await page.keyboard.press("Escape");
check(await page.$eval("#font-picker", (d) => !d.open) && (await page.textContent("#font-name")) === "Lora" && await page.$("#font-current .sample svg") !== null, "Done closes the sheet; Type shows Lora with its numerals");
await frame();
check(await page.$("#axis-wght") !== null, "Lora's weight axis has a slider");
{ // a variable axis is named by a sticker, in the tool's colours, that is a button: it sets the axis back
  await page.fill("#axis-wght", "650"); await page.press("#axis-wght", "Enter");
  const moved = await S("S.rings[S.ui_ring].axes.wght");
  const look = await page.$eval("#axis-wght-back", (e) => { const c = getComputedStyle(e); const st = getComputedStyle(e.querySelector(".sticker")); return [e.firstChild.textContent, st.fontFamily.includes("Silkscreen"), e.querySelector(".sticker").textContent, st.fontSize + " " + (c.color === getComputedStyle(document.querySelector(".fontbox .row > label")).color) + " " + (getComputedStyle(e).fontFamily === getComputedStyle(document.querySelector(".fontbox .row > label")).fontFamily)]; });
  await page.click("#axis-wght-back");
  check(moved === 650 && look[0] === "Weight" && look[1] && look[2] === "wght" && look[3] === "8px true true" && await S("S.rings[S.ui_ring].axes.wght === undefined"), "an axis is named in the tool's own type, grey like the labels, with its code as a small sticker; the name is a button: a press sets the axis back to where the font rests");
}
{
  const f = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), box = r(".fontbox"), top = r("#font-current"), name = r("#font-name"), change = r("#font-change"), lang = r("#lang"), styles = r(".font .styles"), numerals = r("#font-current svg"), c = (q) => getComputedStyle(document.querySelector(q));
    return { order: top.bottom <= name.top && name.bottom <= styles.top, right: Math.round(box.right - change.right), left: Math.round(name.left - box.left + parseFloat(c("#font-name").paddingLeft)), whole: numerals.right <= top.right, lang: lang.left >= name.right && lang.right <= change.left,
      white: c(".fontbox").backgroundColor, lines: [c(".fontname").borderTopWidth, c(".font .styles").borderTopWidth].join(" "), quiet: c("#font-change").borderTopColor === c(".fontbox").outlineColor }; });
  check(f.order && f.right === 8 && f.left === 10 && f.lang && f.white === "rgb(255, 255, 255)" && f.lines === "1px 1px" && f.quiet, `a font stands in a white box of lines with a hairline between them: its numerals and letters, as far as the box goes · its name, then the language and Change… ending on the pane's line, 8 inside the box's edge (a ring row's frame) · its styles; the buttons' lines are as faint as the box's (${JSON.stringify(f)})`);
  check(await page.textContent("#lang") === "Lang." && await page.$eval("#lang", (e) => { const r = e.getBoundingClientRect(), n = document.querySelector("#font-name").getBoundingClientRect(), c = document.querySelector("#font-change"), k = c.getBoundingClientRect(); return Math.round(r.left - n.right) === 12 && r.height === k.height && getComputedStyle(e).font === getComputedStyle(c).font && getComputedStyle(e).paddingLeft === getComputedStyle(c).paddingLeft; }) && await page.isHidden("#lang-menu") && await page.$("select[id*=lang]") === null, "the language is a small button (it says Lang. while the font sets it) on the controls' column after the font's name, as high and set like Change…, not a row with a menu");
  await page.click("#lang");
  const langs = await page.$$eval("#lang-menu button", (b) => b.map((x) => x.textContent).join(" | "));
  await page.click("#lang-tr");
  check(langs.startsWith("As the font sets itLang. | TurkishTR | DutchNL") && await page.textContent("#lang") === "TR" && await page.isHidden("#lang-menu") && await S("S.rings[S.ui_ring].lang === 1"), "a press opens the list of languages by name; choosing Turkish sets the ring's language and the button says TR");
  await page.click("#lang"); await page.click("#lang-default");
  check(await S("S.rings[S.ui_ring].lang === 0"), "and back to the font's own");
  await page.$eval(".font", (e) => e.scrollIntoView({ block: "center" }));
  await shot("4c22-font");
  await page.click("#font-change");
  check(await page.$eval("#font-picker", (d) => d.open), "Change… opens the font sheet");
  await page.keyboard.press("Escape");
}
const light = await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length");
await page.fill("#axis-wght", "700");
await page.press("#axis-wght", "Enter");
await frame();
check(await S("S.rings[S.ui_ring].axes.wght === 700") && (await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length")) !== light, "weight 700 changes the numerals' outlines");
const wide = await S("(() => { const b = t.statik.rings.find((d) => d.kind === 'numerals').parts[0].bounds(); return b[2] - b[0]; })()");
if (await page.isHidden("#feature-tnum")) await page.click('.fontbox .partfold:has-text("OpenType")');
{
  const order = await page.$$eval(".fontbox .features .tiles >> nth=0 >> .tile", (t) => t.map((e) => (e.querySelector(".sticker.figure") ? "F" : "o")).join(""));
  check(/^F+o*$/.test(order), `the features that change numerals come first in the list (${order})`);
}
await page.click("#feature-tnum");
await frame();
const tab_w = await S("(() => { const b = t.statik.rings.find((d) => d.kind === 'numerals').parts[0].bounds(); return b[2] - b[0]; })()");
check(await S("S.rings[S.ui_ring].features.tnum === true") && tab_w !== wide, "the tnum feature (tabular figures) changes the width of “12”");
check(await page.getAttribute("#feature-tnum", "aria-pressed") === "true", "the feature's tile shows as pressed");
await page.click("#feature-tnum");
check(await S("!('tnum' in S.rings[S.ui_ring].features)"), "switching a feature back to the font's default stores nothing (R12)");
await shot("5-type");

// styles as buttons; the fonts on this computer
await page.click("#font-current");
await page.click('#font-picker .fontrow[data-family="Barlow"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Barlow-Regular");
await page.keyboard.press("Escape");
await page.click('.font .styles button:text-is("Bold")');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Barlow-Bold", null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Barlow-Bold'"), "Barlow's styles are buttons under the font: Bold");
await page.click("#font-current");
if (await page.evaluate(() => "queryLocalFonts" in window)) {
  await page.click("#local-fonts");
  await page.waitForFunction(() => [...window.dial_tool.catalog.values()].some((f) => f.data), null, { timeout: 15000 }).catch(() => {});
  const listed = await S("[...t.catalog.values()].filter((f) => f.data).length");
  check(listed > 5, `Installed fonts: ${listed} listed`);
  const pick = await S("[...t.catalog.values()].find((f) => f.data && /Liberation Sans$/.test(f.family) && /^Regular$/.test(f.style))?.family || [...t.catalog.values()].find((f) => f.data).family");
  await page.fill("#font-find", pick.slice(0, 6));
  await page.click(`#font-picker .fontrow[data-family="${pick}"]`);
  await page.waitForFunction((f) => window.dial_tool.ring().family === f && window.dial_tool.statik, pick);
  await frame();
  check(await S("S.rings[S.ui_ring].family") === pick && !(await page.textContent("#font-note")).includes("stands in"), `Find narrows the list; a font installed on this computer (${pick}) draws the numerals`);
} else check(false, "this browser has no queryLocalFonts");
await shot("6-local-font");
await page.keyboard.press("Escape");

// ── the ring's main rows stay in view while the rest scrolls ──
await page.$eval(".form", (e) => { e.scrollTop = 99999; });
check(await page.$eval("#ring-kind-Kind-0", (e) => { const r = e.getBoundingClientRect(), p = document.querySelector(".panel").getBoundingClientRect(); return r.top > p.top && r.bottom < p.bottom && e.closest(".pinned") !== null; }), "Kind, Colour and radius stay in view when the rows are scrolled to the end");
await shot("6b-scrolled");

// ── zoom, pan, fit; play ──
const z0 = await S("t.z");
const box = await page.$eval(".preview", (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 + 120, r.top + r.height / 2 - 80]; });
const spot = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return t.to_mm([x - r.left, y - r.top]); }, box);
await page.mouse.move(box[0], box[1]);
await page.keyboard.down("Control");
await page.mouse.wheel(0, -120);
await page.keyboard.up("Control");
await frame();
const spot2 = await page.evaluate(([x, y]) => { const t = window.dial_tool, r = t.svg.getBoundingClientRect(); return t.to_mm([x - r.left, y - r.top]); }, box);
check(await S("t.z") > z0 * 1.5 && near(spot[0], spot2[0], 0.01) && near(spot[1], spot2[1], 0.01), "ctrl-scroll zooms, and the spot under the cursor stays put");
await shot("7-zoomed");
await page.mouse.wheel(40, 30);
await frame();
check(await S("t.fitted === false"), "two-finger scroll pans");
await page.click('button:text-is("Fit")');
check(near(await S("t.z"), z0, 1e-6) && await S("t.fitted"), "Fit puts the whole page back");
const t0 = await S("S.t");
await page.click("#play");
await page.waitForTimeout(600);
const t1 = await S("S.t");
check(await page.getAttribute("#play", "title") === "Pause", "while playing, the button offers Pause");
await page.click("#play");
check(t1 - t0 > 0.4 && t1 - t0 < 1.5, `Play moves the time (${(t1 - t0).toFixed(2)} s in 0.6 s)`);
await page.click("#speed-60");
await page.click("#play");
await page.waitForTimeout(600);
const t2 = await S("S.t");
await page.click("#play");
check(t2 - t1 > 24 && t2 - t1 < 90 && await page.getAttribute("#speed-60", "aria-checked") === "true", `60×: a minute every second (${(t2 - t1).toFixed(0)} s in 0.6 s)`);
await page.click("#speed-1");
const z1 = await S("t.z");
await page.click("#zoom-in");
check(near(await S("t.z") / z1, 1.4, 0.01), "the + in the bar zooms in by 1.4");
await page.click("#zoom-out");
await page.click("#fit");
// the day slider's steps: a click on a step, or on the slider near one, goes exactly there; 10:10 is one of them
await page.click('.steps12 button:text-is("3")');
check(await S("S.t === 3 * 3600") && await page.inputValue("#time") === "3:00:00", "the step 3 under the day slider: three o'clock sharp");
await page.click(".steps12 button.special");
check(await S("S.t === 10 * 3600 + 600") && await page.$eval(".steps12 button.special", (e) => e.classList.contains("on")), "the 10:10 step: ten past ten");
const track = await page.$eval("#time-slider", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top + r.height / 2, r.width]; });
const cut = 60 * +(await page.getAttribute(".ruler", "data-minutes"));
check(cut < 3600 && await page.$$eval(".ruler path", (p) => p.length) >= 4, `the ruler cuts each hour (every ${cut / 60} minutes at this width)`);
await page.mouse.click(track[0] + 1.5 + (track[2] - 3) * 0.503, track[1]);
check(await S("S.t === 6 * 3600"), `a click on the ruler just past the middle snaps to six o'clock (${await S("S.t")})`);
await page.mouse.click(track[0] + 1.5 + (track[2] - 3) * (6 * 3600 + cut * 1.2) / 43200, track[1]);
check(await S(`S.t === 6 * 3600 + ${cut}`), `a click near the next cut snaps to it (${await S("S.t")})`);
const drag_from = track[0] + 1.5 + (track[2] - 3) * (6 * 3600 + cut) / 43200;
await page.mouse.move(drag_from, track[1]); await page.mouse.down(); await page.mouse.move(drag_from + 41, track[1], { steps: 4 }); await page.mouse.up();
check(await S(`S.t % ${cut} !== 0 && S.t > 6 * 3600`), `a drag does not snap (${await S("S.t")})`);
await page.setViewportSize({ width: 2200, height: 900 });
await frame();
const finer = 60 * +(await page.getAttribute(".ruler", "data-minutes"));
check(finer < cut, `on a wider window the ruler is cut finer (every ${finer / 60} minutes at 2200 wide)`);
await page.setViewportSize({ width: 1440, height: 900 });
await frame();
const under = await page.evaluate(() => { const l = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left), row = [...document.querySelectorAll(".form .row.num")].find((e) => e.offsetParent) || document.querySelector(".row.num"); return { play: l("#play"), col: Math.round(row.getBoundingClientRect().left), now_right: Math.round(document.querySelector("#now").getBoundingClientRect().right), row_right: Math.round(row.getBoundingClientRect().right) }; });
check(under.play === under.col && under.now_right === under.row_right, `under the panel the time controls start and end with the six columns (${JSON.stringify(under)})`);
const pane_lines = await page.$$eval(".form .pane", (h) => h.filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().left) + "/" + Math.round(e.querySelector(".eye svg").getBoundingClientRect().left)));
check(pane_lines.length > 0 && pane_lines.every((x) => x === "24/26"), `a pane's line starts at the margin, over its eye, which stands 2 further in (${pane_lines[0]})`);
// the bar keeps the columns: widths of one or two columns, and the Guides switch ends on the panel's last column
const fits = await page.evaluate(() => { const w = (q) => Math.round(document.querySelector(q).getBoundingClientRect().width), r = (q) => Math.round(document.querySelector(q).getBoundingClientRect().right); return { play: w("#play"), speeds: w(".speeds"), time: w("#time"), now: w("#now"), zooms: w(".zooms"), fit: w("#fit"), side: Math.round(document.querySelector("#panel-toggle").getBoundingClientRect().left + 13) }; });
check(fits.play === 54 && fits.now === 54 && fits.zooms === 54 && fits.fit === 54 && fits.speeds === 120 && fits.time === 120 && fits.side === 32, `the bar fits the columns (${JSON.stringify(fits)})`);
await shot("7b-bar");
await page.fill("#time", "3:20:10");
await page.press("#time", "Enter");
check(await S("S.t === 3 * 3600 + 20 * 60 + 10"), "typed time 3:20:10");

// ── files: PDF, SVG, PNG, save, load ──
await tab("Export");
const size_mm = await S("S.dial_d + 2 * S.margin");
const await_ring_name = await S("S.rings.find((r) => r.on).name");
const pdf = await download("#export-pdf");
const pdf_text = fs.readFileSync(pdf, "latin1");
const box_pt = /MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf_text);
check(pdf_text.startsWith("%PDF-1.5") && box_pt && near(+box_pt[1] / 72 * 25.4, size_mm, 0.001), `PDF: page ${(box_pt[1] / 72 * 25.4).toFixed(2)} mm = dial + margins (${size_mm} mm)`);
check(!/ S\n| re\n|BT\n/.test(pdf_text) && (pdf_text.match(/\nf\n/g) || []).length >= 8, "PDF: filled paths only, no strokes or text (R4, R5)");
const layer_names = (pdf_text.match(/\/Type \/OCG \/Name <FEFF([0-9A-F]+)>/g) || []).map((x) => (/<FEFF([0-9A-F]+)>/.exec(x)[1].match(/.{4}/g) || []).map((h) => String.fromCharCode(parseInt(h, 16))).join(""));
check(layer_names.includes("Plate") && layer_names.includes("Hour hand") && layer_names.some((n) => n === await_ring_name) && (pdf_text.match(/ BDC\n/g) || []).length === layer_names.length,
  `PDF: every part is a layer with its name (${layer_names.join(" · ")})`);
check(/^dial-[\d.]+mm-\d{4}-\d\d-\d\d\.pdf$/.test(path.basename(pdf)), `the file says what it is: ${path.basename(pdf)}`);
const svg = await download("#export-svg");
const svg_text = fs.readFileSync(svg, "utf8");
const svg_ids = (svg_text.match(/ id="[^"]+"/g) || []).map((x) => x.slice(5, -1));
check(svg_ids.includes("plate") && svg_ids.includes("hour-hand") && new Set(svg_ids).size === svg_ids.length && !/scale\(1 1\)/.test(svg_text), `SVG: shapes are named after what they are, each name once (${svg_ids.slice(0, 6).join(", ")} …)`);
check(svg_text.includes(`width="${size_mm}mm"`) && !svg_text.includes("stroke=") && (svg_text.match(/<path/g) || []).length >= 8, "SVG: true size in mm, no guides");
// live text: the numerals stay text, each where its outline was
await page.check("#global-out-live-text-Keep-numerals-as-text-in-the-SVG");
const live_text = fs.readFileSync(await download("#export-svg"), "utf8");
fs.writeFileSync(path.join(OUT, "dial-live.svg"), live_text);
const numerals = await S("(() => { const d = t.statik.rings.find((d) => d.kind === 'numerals'); if (!d) return null; const b = d.parts[0].bounds(); return { n: d.parts.length, c: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], mode: d.ring.mode, family: d.ring.family }; })()");
if (numerals) {
  const texts = live_text.match(/<text [^>]*>[^<]*<\/text>/g) || [];
  const first = /translate\(([-\d.]+) ([-\d.]+)\) rotate/.exec(texts.find((x) => x.includes("rotate(")) || "");
  check(texts.length >= numerals.n && texts[0].includes(`font-family="${numerals.family}"`), `SVG with live text: ${texts.length} texts in ${numerals.family}`);
  if (numerals.mode === 0) check(first && near(+first[1], numerals.c[0], 0.01) && near(+first[2], -numerals.c[1], 0.01), "the first numeral's text stands where its outline's centre is");
}
check((live_text.match(/<path/g) || []).length >= 6 && !svg_text.includes("<text"), "everything else stays outlines; without the tick there is no text");
await page.uncheck("#global-out-live-text-Keep-numerals-as-text-in-the-SVG");
// Export a file stays in view; its order: Vector · PDF | SVG and its tick | PNG and its settings (Okay, 13 Oct 2026)
{
  const e = await page.evaluate(() => {
    const p = document.querySelector(".pinned"), rows = [...p.querySelectorAll(".body > .row")].filter((r) => r.offsetParent), left = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left), shadow = (r) => getComputedStyle(r).boxShadow.split("rgb").length - 1, half = (r) => { const c = getComputedStyle(r); return c.backgroundImage === "none" ? 0 : c.backgroundSize.startsWith("calc(66.6667% - 4px)") && c.backgroundPosition === "100% 100%" ? 1 : 9; };      // two thirds of the row less a third of a gap: from the third column on
    return { pinned: [...p.querySelectorAll("h2")].map((h) => h.textContent).join(), order: rows.map((r) => (r.querySelector("button.main") || {}).id || (r.querySelector("input") || {}).id || r.className).join(" | "),
      pdf: left("#export-pdf"), svg: left("#export-svg"), png: left("#export-png"), label: left(".pinned .row > label"), tick: left(".pinned .check"), lines: rows.map(shadow).join(""), halves: rows.map(half).join(""), below: [...document.querySelectorAll(".form .pane h2")].map((h) => h.textContent).join(" · ") };
  });
  check(e.pinned === "Export a file" && e.order === "export-pdf | export-svg | global-out-live-text-Keep-numerals-as-text-in-the-SVG | export-png | global-out-dpi-dpi-slider | row note under" && e.pdf === e.svg && e.png === e.pdf && e.pdf > e.label && e.tick === e.svg && e.lines === "211101" && e.halves === "010110" && e.below === "Print · Link to this dial · Settings file · Log · Gallery",
    `Export a file is pinned: Vector · PDF, SVG under it with its tick tied to it, then PNG on the same column with its dpi under it; a half line, from the buttons' column, before each nested row (the tick, the dpi, its note: ${e.lines} ${e.halves}); below scroll ${e.below}`);
  await shot("4c21-export");
}
{
  const at = await page.evaluate(() => { const l = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left); return [l("#png-size"), l("#export-png"), l("#global-out-dpi-dpi-slider"), document.querySelector(".row:has(#global-out-dpi-dpi) > :first-child").textContent]; });
  check(/dpi = \d+ × \d+ px/.test(await page.textContent("#png-size")) && at[0] === at[1] && at[2] === at[1] && at[3] === "", "the dpi's slider has no word before it; it and the line saying what that comes to start on the buttons' column");
  const note = await page.evaluate(() => { const q = document.querySelector("#png-size"), row = q.closest(".row").getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(q); const words = range.getBoundingClientRect(); return [words.top - row.top, row.bottom - words.bottom, parseFloat(getComputedStyle(q).paddingTop), parseFloat(getComputedStyle(q).paddingBottom)]; });
  check(Math.abs(note[0] - note[1]) < 0.3 && note[2] === 5.5 && note[3] === 5.5, `a note has as much room over its words as under them, one unit of padding each way (${note.map((v) => +v.toFixed(2)).join(" · ")})`);
  await shot("4c21-export");
}
const png = await download("#export-png");
const want_px = Math.round(size_mm / 25.4 * await S("S.out_dpi"));
const png_bytes = fs.readFileSync(png);
check(png_bytes.readUInt32BE(16) === want_px && png_bytes.readUInt32BE(20) === want_px, `PNG: ${want_px} × ${want_px} px at ${await S("S.out_dpi")} dpi`);
const phys = png_bytes.indexOf("pHYs");
check(phys === 37 && near(png_bytes.readUInt32BE(phys + 4) * 0.0254, await S("S.out_dpi"), 0.5) && png_bytes.readUInt32BE(phys - 4) === 9, `PNG: its dpi is written in the file (${(png_bytes.readUInt32BE(phys + 4) * 0.0254).toFixed(1)}), so it opens at true size`);
// a production mask: grey ink only in the PDF, and black on white (not on nothing) in the PNG
await page.check("#global-out-production-Mono-print-mask");
const mask_pdf = await download("#export-pdf");
const mask_text = fs.readFileSync(mask_pdf, "latin1");
check(/\n0 g\n/.test(mask_text) && !/ rg\n/.test(mask_text) && path.basename(mask_pdf).includes("-mask-"), `a mask's PDF is in grey ink (0 g), no RGB black: ${path.basename(mask_pdf)}`);
const mask_png = await download("#export-png");
const corner = await page.evaluate(async (b64) => { const i = new Image(); i.src = "data:image/png;base64," + b64; await i.decode(); const c = document.createElement("canvas"); c.width = c.height = 4; const x = c.getContext("2d"); x.drawImage(i, 0, 0); return [...x.getImageData(0, 0, 1, 1).data]; }, fs.readFileSync(mask_png).toString("base64"));
check(corner.join() === "255,255,255,255", "a mask's PNG has a white ground");
await page.uncheck("#global-out-production-Mono-print-mask");
const saved = await download("#save");
const before_save = await S("JSON.stringify(S)");
check(JSON.stringify(JSON.parse(fs.readFileSync(saved, "utf8"))) === before_save, "Save… writes the settings as they are");
await page.click('button:text-is("Defaults")');
await page.waitForFunction(() => window.dial_tool.statik);
check(await S("S.ha_hour.round === 0"), "Defaults clears them");
await page.setInputFiles("#load-file", saved);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2);
const after_load = await S("JSON.stringify({ ...S, ui_section: 0 })");
check(after_load === JSON.stringify({ ...JSON.parse(before_save), ui_section: 0 }), "Load… brings every setting back");
await page.reload();
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
check(await S("S.ha_hour.round === 2"), "the last session is back after closing and reopening the page");
await shot("8-reopened");

// ── examples: the five first dials, now in the Gallery, each a link ──
await tab("Export");
check(await page.$$eval(".examples a svg", (e) => e.length) === await page.$$eval(".gallery a svg", (e) => e.length) && (await page.$$eval(".gallery a", (a) => a.map((x) => x.textContent))).slice(-5).join(" ") === "Field Diver Bauhaus Sector Gauge", "the five first examples are part of the Gallery now, after its own dials");
const example = await page.getAttribute('.gallery a:has-text("Diver") >> nth=-1', "href");
await page.click('.gallery a:has-text("Diver") >> nth=-1');
await page.waitForFunction((h) => location.hash === h && window.dial_tool.statik && window.dial_tool.S.ui_section === 4, example, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(700);
check(await page.evaluate((h) => location.hash === h, example) && await S("t.log_lines.slice(0, 3).every((l) => !l.includes('stands in'))"), "clicking Diver opens it: the address is its link and its fonts are drawn");
await shot("9-example");
await page.setInputFiles("#load-file", saved);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2);

// ── a dial as a link ──
await context.grantPermissions(["local-fonts", "clipboard-read", "clipboard-write"]).catch(() => {});
await tab("Export");
await page.click("#copy-link");
await page.waitForFunction(() => window.dial_tool.log_lines[0].includes("link copied"), null, { timeout: 5000 }).catch(() => {});
const link = await page.evaluate(() => location.href);
check(await page.inputValue("#link") === link && (await page.$eval("#log", (e) => getComputedStyle(e).fontFamily)).toLowerCase().includes("mono"), "the link is spelled out above its Copy button; the log is monospaced");
check(/#1\.[A-Za-z0-9_-]+$/.test(link), `Copy link: the address carries the dial (${link.split("#")[1].length} characters after #)`);
const wanted = await S("JSON.stringify({ ...S, ui_section: 0, ui_ring: 0, ui_hand: 0 })");
const other = await context.newPage();                               // someone else's browser: no last session of this dial
await other.addInitScript(() => localStorage.removeItem("dial-tool-last"));
await other.goto(link);
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
const got = await other.evaluate(() => JSON.stringify({ ...window.dial_tool.S, ui_section: 0, ui_ring: 0, ui_hand: 0 }));
check(got === wanted, "opening the link elsewhere gives the same dial, every setting");
await other.goto(link.split("#")[0] + "#1.not-a-dial");
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
check(await other.evaluate(() => window.dial_tool.S.rings.length > 0), "a broken link opens the tool anyway");
await other.close();
await page.click('button:text-is("Defaults")');
await page.waitForFunction(() => window.dial_tool.statik && window.dial_tool.S.ha_hour.round === 0);
await page.waitForTimeout(600);
const short = await page.evaluate(() => location.hash);
check(short.length < 12, `the starting dial's link is short (${short})`);
await page.evaluate((l) => { location.hash = l.split("#")[1]; }, link);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2, null, { timeout: 5000 }).catch(() => {});
check(await S("S.ha_hour.round === 2"), "pasting a link into the open tool switches to that dial");

// ── nothing jumps: a click on the preview keeps the rows; panes slide; the Guides switch keeps its size ──
await tab("Rings");
await page.click(".ringlist li.ring >> nth=2");
await page.$eval(".form", (e) => { e.scrollTop = 180; });
await page.evaluate(() => { window.__row = document.querySelector(".form .row"); });
await page.click(".pinned .colour");
await click_mm(...clock(13, 150));                     // the marker at 5: a ring with the same panes as the ticks (a ring of another kind has other panes: there the scroll starts again)
const kept = await page.evaluate(() => ({ same_rows: window.__row === document.querySelector(".form .row"), scroll: document.querySelector(".form").scrollTop, picker: document.querySelector("#colour-pop").hidden, ring: window.dial_tool.ring().name, list: document.querySelector(".ringlist li.ring.on .name").textContent }));
check(kept.same_rows && kept.scroll === 180 && kept.picker && kept.ring === kept.list, `a click on the preview keeps the rows, their scroll (${kept.scroll}) and selects ${kept.ring}; the colour pop-out, pressed outside of, is put away`);
await page.click(".pinned .colour");
await tab("Rings"); await page.$eval(".form", (e) => { e.scrollTop = 120; }); await tab("Dial"); await tab("Rings");
check(await page.$eval(".form", (e) => e.scrollTop) === 120, "a section is back where it was scrolled to");
await page.$eval(".form", (e) => { e.scrollTop = 0; });
await tab("Dial");
const guides_w = [];
for (let i = 0; i < 2; i++) { guides_w.push(await page.$eval("#guides", (e) => e.getBoundingClientRect().width)); await page.click("#guides"); await frame(); }
check(guides_w[0] === guides_w[1], `the Guides switch is the same width on and off (${guides_w.join(" / ")})`);
check(await page.$eval("#global-dial-d-Diameter-slider", (e) => { const p = +e.style.getPropertyValue("--p"); return Math.abs(p - (e.value - e.min) / (e.max - e.min)) < 0.001 && getComputedStyle(e).appearance === "none"; }), "a slider knows how far along it is: its track is filled up to the handle");
await page.emulateMedia({ reducedMotion: "no-preference" });
const heights = await page.evaluate(async () => {
  const pane = [...document.querySelectorAll(".pinned .pane")].find((p) => !p.hidden && !p.classList.contains("folded")), body = pane.querySelector(".body"), next = pane.nextElementSibling;
  const open = body.offsetHeight, top0 = next.getBoundingClientRect().top, seen = [];
  pane.querySelector(".fold").click();
  for (let i = 0; i < 60 && (body.getAnimations().length || !i); i++) { await new Promise((r) => requestAnimationFrame(r)); seen.push(Math.round(body.getBoundingClientRect().height)); }
  const shut = { hidden: body.hidden, moved: Math.round(top0 - next.getBoundingClientRect().top) };
  pane.querySelector(".fold").click();
  await new Promise((r) => setTimeout(r, 400));
  return { open, between: seen.filter((h) => h > 0 && h < open).length, shut, again: body.offsetHeight };
});
check(heights.between >= 2 && heights.shut.hidden && heights.shut.moved === heights.open && heights.again === heights.open, `a pane slides shut and open: ${heights.between} steps on the way, and what is under it moves by exactly its height (${heights.shut.moved} = ${heights.open})`);
await page.emulateMedia({ reducedMotion: "reduce" });
check(errors.length === 0, "no errors in the browser's console" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
// ── the gallery: under everything else in Export; a card opens its dial ──
await tab("Export");
{
  const g = await page.evaluate(() => { const panes = [...document.querySelectorAll(".form .pane h2")].map((h) => h.textContent), cards = [...document.querySelectorAll(".gallery a")]; return { last: panes.at(-1), n: cards.length, names: cards.map((c) => c.textContent).join(" · "), pictures: cards.every((c) => c.querySelector("svg path")), across: new Set(cards.slice(0, 3).map((c) => Math.round(c.getBoundingClientRect().top))).size }; });
  check(g.last === "Gallery" && g.n >= 6 && g.pictures && g.across === 1, `the Gallery is the last pane of Export: ${g.n} dials, three to a line (${g.names})`);
  await page.$eval(".gallery", (e) => e.scrollIntoView());
  await shot("4c13-gallery");
  const before = await S("JSON.stringify(S.rings.map((r) => r.name))");
  await page.click(".gallery a >> nth=3");
  await page.waitForFunction((b) => JSON.stringify(window.dial_tool.S.rings.map((r) => r.name)) !== b, before);
  check(await S("S.rings[0].name === 'Every fifth minute' && S.dial_d === 38"), "a card opens its dial: Montgomery, 38 mm, every fifth minute on top");
  await frame(); await shot("4c14-gallery-montgomery");
  await page.waitForTimeout(550);
  await page.keyboard.press("Control+z");
  check(await S("JSON.stringify(S.rings.map((r) => r.name))") === before, "and ⌘Z brings the dial that was there back");
}

// ── the panel put away, and a phone ──
await page.click("#panel-toggle");
await frame();
check(await page.isHidden(".panel") && await page.$eval(".preview", (e) => e.getBoundingClientRect().left) < 2, "the square in the bar puts the panel away: the dial has the whole window");
await shot("10-no-panel");
await page.click("#panel-toggle");
check(await page.isVisible(".panel"), "and brings it back");
await page.setViewportSize({ width: 390, height: 844 });
await tab("Rings");
await frame();
const narrow = await page.evaluate(() => ({ wide: document.documentElement.scrollWidth, eye: document.querySelector(".form button.fold .eye").getBoundingClientRect().left, bar: document.querySelector(".bar").getBoundingClientRect().top }));
check(narrow.wide <= 390 && narrow.eye >= 0 && narrow.bar === 0, "a phone: nothing wider than the screen, the eyes in view, the bar on top");
await shot("11-phone");
await page.click('.form .fold:visible >> nth=0');
await shot("11b-phone-folded");
await page.click('.form .fold:visible >> nth=0');
await page.setViewportSize({ width: 1440, height: 900 });

// ── under a finger: small controls are pressed from a little outside their edge too ──
const touch = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const pad = await touch.newPage();
await pad.goto("file://" + process.cwd() + "/dial-tool.html");
await pad.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await pad.tap("#guides-more");
const reach = await pad.evaluate(() => {
  const dots = [...document.querySelectorAll("#guide-list .guidekind:nth-child(2) .tone")], a = dots[2].getBoundingClientRect(), b = dots[3].getBoundingClientRect();
  const at = (x, y) => document.elementFromPoint(x, y);
  return { coarse: matchMedia("(pointer: coarse)").matches, size: a.width, left: at(a.left - 5, a.top + a.height / 2) === dots[2], above: at(a.left + a.width / 2, a.top - 10) === dots[2], nearer_next: at(b.left - 5, b.top + b.height / 2) === dots[3] };
});
check(reach.coarse && reach.left && reach.above && reach.nearer_next, `under a finger a ${reach.size} dot is pressed from 5 beside it and 10 above it; nearer the next dot, the next one is`);
await pad.touchscreen.tap(...await pad.$eval('#guide-list .guidekind:nth-child(2) .tone:nth-child(5)', (e) => { const r = e.getBoundingClientRect(); return [r.left - 4, r.top - 8]; }));
check(await pad.evaluate(() => window.dial_tool.S.gd_k_axes === 3), "a tap just outside a dot chooses it");
await pad.tap("#global-c-plate-Plate-hex");
const chip_reach = await pad.evaluate(() => { const c = [...document.querySelectorAll("#pop-palette button")], r = c[4].getBoundingClientRect(); return [document.elementFromPoint(r.left - 4, r.top + 4) === c[4], document.querySelector("#global-c-plate-Plate-hex").tagName === "SPAN", !document.querySelector("#colour-pop").hidden]; });
check(chip_reach.every(Boolean), "the hex in a pill opens the pop-out and isn't typed in; a chip is pressed from 4 beside it");
await pad.screenshot({ path: path.join(OUT, "12-touch.png") });
await touch.close();

await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s).` : "\nWindow test passed.");
process.exit(problems.length ? 1 : 0);
