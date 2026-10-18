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
/** a browser of its own: its own storage, so nothing one keeps is seen by another (the link test's "someone else") */
const visitor = async () => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true, reducedMotion: "reduce" });      // panes fold at once here; their slide has a check of its own
  await c.grantPermissions(["local-fonts"]).catch(() => {});
  await c.addInitScript(() => { if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); });      // every pane open, as for a visitor who has opened them; a first visit has a check of its own (#270)
  // the tool's own fonts come from its site; here they are served from web/fonts/, so the test needs no network
  await c.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
  return c;
};
const context = await visitor();
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
const settings = process.argv[2];
if (settings) await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("dial-tool-last", s); sessionStorage.setItem("seeded", "1"); } }, fs.readFileSync(settings, "utf8"));
await page.goto("file://" + process.cwd() + "/dial-tool.html");
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });

const S = (expr) => page.evaluate(`(() => { const t = window.dial_tool, S = t.S; return ${expr}; })()`);
// a value typed: in its own field, or — a quiet number, which is not typed in place since 4.58 (#317) — in the controller its press opens
const enter_value = async (id, v) => {
  if (!(await page.$eval(id, (e) => e.readOnly))) { await page.fill(id, v); await page.press(id, "Enter"); return; }
  await page.click(id); await page.waitForSelector("#value-pop");
  await page.fill('#value-pop input[type="text"]', v); await page.press('#value-pop input[type="text"]', "Enter");
  await page.evaluate(() => window.dial_tool.value_pop_close());
};
/** set a colour the way a person does: open its pill's pop-out, type the hex there, close it. */
const type_hex = async (id, hex) => { await page.click("#" + id); await page.click("#pop-as-HEX"); await enter_value("#pop-hex", hex); await page.click("#pop-close"); };
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
await page.click("#plain");
await page.waitForFunction(() => window.dial_tool.statik);
await frame();
check(await S("S.rings.length === 3 && S.dial_d === 30"), "Defaults: the starting dial, three rings");
await shot("1-default");

// ── a number row: slider, typed field with shorthand, stepper ──
await tab("Dial");
await enter_value("#global-dial-d-Diameter", "36");
check(await S("S.dial_d === 36"), "typed 36 → diameter 36");
await enter_value("#global-dial-d-Diameter", "+0.5");
check(await S("S.dial_d === 36.5"), "typed +0.5 → 36.5");
await enter_value("#global-dial-d-Diameter", "x2");
check(await S("S.dial_d === 73") && await page.$eval("#global-dial-d-Diameter-slider", (e) => +e.max === 73), "typed x2 → 73, and the slider grew to hold it");
await enter_value("#global-dial-d-Diameter", "30");
await page.click(".row.num:has(#global-dial-d-Diameter) .step >> nth=1");
check(near(await S("S.dial_d"), 30.1, 1e-9), "stepper + → 30.1");
await enter_value("#global-dial-d-Diameter", "30");
await page.$eval("#global-dial-d-Diameter-slider", (e) => { e.value = 31; e.dispatchEvent(new Event("input", { bubbles: true })); });
check(await S("S.dial_d === 31") && await page.inputValue("#global-dial-d-Diameter") === "31.0", "slider → 31, the field follows");
await enter_value("#global-dial-d-Diameter", "30");

// ── clicking the preview opens the settings of what was clicked ──
await click_mm(...clock(10, 120));                                  // the numeral 4
check(await S("S.ui_section === 1 && ['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'numerals' && t.nudge_at === '4'"), "click the numeral 4 → Rings, the numerals ring, and Nudge is set to that numeral");
{ // Nudge's adjusters are number rows on the chosen numeral (#252): a slider, the value, ±; a neutral value is not kept
  await enter_value("#nudge-da-Angle-", "5");
  const set = await S("JSON.stringify(t.ring().nudge[t.nudge_at])");
  await page.click("#nudge-da-Angle- ~ .steps .step >> nth=1");
  const plus = await S("t.ring().nudge[t.nudge_at].da");
  await enter_value("#nudge-da-Angle-", "0");
  const gone = await S("t.ring().nudge[t.nudge_at] === undefined");
  const rows = await page.$$eval('[id^="nudge-"][id$="-slider"]', (e) => e.length);
  check(set === '{"da":5}' && Math.abs(plus - 5.1) < 1e-9 && gone && rows === 4, `Nudge: its four adjusters are number rows with a slider and ± (${rows}); the angle typed 5, plus 0.1, back to 0 leaves nothing kept (#252)`);
  // sliding one hides the guides; a moment after, they are back (#252: "when a numeral is being nudged hide all guides")
  const guides = () => S("t.items.filter((i) => i.role === 'guide').length");
  const shown = await guides();
  await page.$eval('[id^="nudge-dr-"][id$="-slider"]', (e) => { e.value = 0.5; e.dispatchEvent(new Event("input", { bubbles: true })); });
  await frame();
  const hid = await guides();
  await page.waitForTimeout(1400);
  const back = await guides();
  await page.evaluate(() => window.dial_tool.set_value("nudge", "dr", 0));
  check(shown > 0 && hid === 0 && back === shown, `sliding a numeral's nudge hides the guides (${shown} → ${hid}), back a moment after (${back}) (#252, 4.45.2)`);
}
await click_mm(...clock(13, 150));                                  // the marker at 5
check(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'markers'"), "click a marker → the markers ring");
await click_mm(...clock(13.9, 94));                                 // beside a thin tick (in its zone); 93° until the bar grew (#190): with the preview 10 shorter it fell to the marker at 3
check(await S("['ticks','markers','numerals','band'][S.rings[S.ui_ring].kind] === 'ticks'"), "click in the ticks' zone → the ticks ring");
const hands = await S("(() => { const a = [S.t / 43200 * 360, (S.t % 3600) / 3600 * 360]; return a; })()");
await click_mm(...clock(6, hands[0]));
check(await S("S.ui_section === 2 && S.ui_hand === 0"), "click the hour hand → Hands, Hour");
await click_mm(...clock(11, hands[1]));
check(await S("S.ui_section === 2 && S.ui_hand === 1"), "click the minute hand → Hands, Minute");
await click_mm(0.5, 3);
check(await S("S.ui_section === 0"), "click the bare plate → Dial");
await tab("Date");
await page.check("#window-on-Show");
await frame();
await click_mm(...clock(await S("S.da_r"), 90));
check(await S("S.ui_section === 3"), "click the date window → Date");
await shot("2-date");

// ── round ends: markers (one click) and hands ──
await click_mm(...clock(13, 150));
await page.click('button:text-is("Round both ends")');
check(await S("S.rings[S.ui_ring].round_out === 0.35 && S.rings[S.ui_ring].round_in === 0.35"), "Round both ends → both radii = half the marker's width");
await click_mm(...clock(13.9, 93));
await enter_value("#ring-w-Width", "0.3");
await page.click('button:text-is("Round both ends")');
await click_mm(...clock(6, hands[0]));
await enter_value("#hand-round-Round-ends", "2");
await page.click('.segs button:text-is("Minute")');
await enter_value("#hand-round-Round-ends", "2");
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
// a ring's row: eye · grip · the kind as an icon · the name — no numbers, no colour (#254, 4.50; Okay's notes, p. 3: "no text details, only the kind icon"); the drawer under the selected one says the rest
const rows = await page.$$eval(".ringlist li.ring", (l) => l.map((e) => { const x = (q) => Math.round(e.querySelector(q).getBoundingClientRect().left); return [e.querySelector(".kindicon svg") !== null, e.querySelector(".kindicon").dataset.kind, x(".eye") < x(".grip") && x(".grip") < x(".kindicon") && x(".kindicon") < x(".name"), e.querySelectorAll(".says, .dot.tiny").length, e.getBoundingClientRect().height, x(".kindicon")]; }));
check(rows.every((x) => x[0] && /^[0-4]$/.test(x[1]) && x[2] && x[3] === 0) && new Set(rows.map((x) => x[4])).size === 1 && new Set(rows.map((x) => x[5])).size === 1,
  `every ring's row is eye · grip · kind icon · name, the icons in one column, no numbers or colour in a row (${rows.map((x) => x[1]).join(" ")})`);
// the list's pill and the fit (#256, 4.47.1): with more than five rings a black pill stands in the middle of the pinned
// part's line; selecting a ring scrolls its row and drawer whole into the list; a drag on the pill shows more rows, a
// tap jumps between five and all
{
  const m = () => page.evaluate(() => { const t = window.dial_tool, ol = t.ring_list, g = document.querySelector("#list-grip"), p = document.querySelector(".pinned").getBoundingClientRect(), gb = g.getBoundingClientRect(), h = t.ring_line_holder;
    return [t.S.rings.length, getComputedStyle(g).display, Math.round((gb.left + gb.right) / 2 - (p.left + p.right) / 2), +((gb.top + gb.bottom) / 2 - p.bottom + 1).toFixed(1), ol.clientHeight, ol.scrollHeight, ol.scrollTop, ol.style.getPropertyValue("--ring-rows"), h.offsetTop + h.offsetHeight]; });
  const was = await S("[S.ui_ring, S.rings.length]");
  const few = await m();
  await page.evaluate(() => { const t = window.dial_tool; for (let i = 0; i < 5; i++) t.S.rings.push({ ...t.S.rings[0], name: "Copy " + i }); t.static_dirty = true; t.fill_ring_list(); t.ring_list.scrollTop = 0; t.select_ring(t.S.rings.length - 1); });
  await page.waitForTimeout(100);
  const fitted = await m();
  const g = await page.$eval("#list-grip", (e) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await page.mouse.move(g[0], g[1]); await page.mouse.down(); await page.mouse.move(g[0], g[1] + 60, { steps: 6 }); await page.mouse.move(g[0], g[1] + 114, { steps: 6 }); await page.mouse.up();
  const dragged = await m();
  const g2 = await page.$eval("#list-grip", (e) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await page.mouse.click(g2[0], g2[1]);
  const tapped = [...await m(), await page.evaluate(() => localStorage.getItem("dial-tool-ring-rows"))];
  await page.evaluate(([ring, n]) => { const t = window.dial_tool; t.S.rings.length = n; t.static_dirty = true; t.select_ring(ring); localStorage.removeItem("dial-tool-ring-rows"); }, was);
  check(few[0] <= 5 && few[1] === "none" && fitted[0] === few[0] + 5 && fitted[1] === "grid" && fitted[2] === 0 && fitted[3] === 0 && fitted[5] > fitted[4] && fitted[6] === fitted[8] - fitted[4] && dragged[7] === String(fitted[0]) && dragged[4] === dragged[5] && tapped[7] === "5" && tapped[4] === fitted[4] && tapped[9] === "5",
    `the list's pill (#256): none with ${few[0]} rings; with ${fitted[0]} it stands in the middle of the pinned part's line (${fitted[2]} / ${fitted[3]} off); selecting the last ring scrolls the list (${fitted[6]}) so its row and drawer end in view (${fitted[8]} in ${fitted[4]}); dragged three rows down the list shows all ${dragged[7]} (${dragged[4]} = ${dragged[5]}); a tap brings five back, kept by the browser`);
}
// names a screen reader hears (#244, 4.47.2): a ring's row is an option in a listbox, reached with Tab and taken with
// Enter; every slider says its name; a colour pill says whose colour it is before its hex; in the showcase the panel
// and the bar are inert
{
  const roles = await page.evaluate(() => { const ol = document.querySelector(".ringlist ol"), rows = [...ol.querySelectorAll("li.ring")]; return [ol.getAttribute("role"), ol.getAttribute("aria-label"), rows.map((r) => r.getAttribute("role") + ":" + r.getAttribute("aria-selected") + ":" + r.tabIndex).join(" "), [...document.querySelectorAll(".form input[type=range]")].every((s) => s.getAttribute("aria-label")), document.querySelector(".form input[type=range]").getAttribute("aria-label")]; });
  const was = await S("S.ui_ring"), target = await S("S.rings.length - 1");
  await page.focus(`.ringlist li.ring:nth-child(${target + 1} of .ring)`); await page.keyboard.press("Enter");
  const by_key = await S("S.ui_ring");
  await page.evaluate((i) => window.dial_tool.select_ring(i), was);
  const pill = await page.evaluate(() => { const t = window.dial_tool, was = t.S.ui_section; t.S.ui_section = 0; t.show_section(); const name = document.querySelector(".colourlist button.colour").getAttribute("aria-label"); t.S.ui_section = was; t.show_section(); t.sync_rows(); return name; });
  const inert = await page.evaluate(() => { const t = window.dial_tool, p = document.querySelector(".panel"), b = document.querySelector(".bar"); t.showcase(true); const on = [p.inert, b.inert]; t.showcase(false); return [...on, p.inert, b.inert]; });
  check(roles[0] === "listbox" && roles[1] === "Rings, top first" && /^(option:(true|false):0 ?)+$/.test(roles[2]) && roles[3] && roles[4] && by_key === target && /^[A-Z][a-z]+ · Colour #[0-9A-F]{6}$|^[A-Za-z ]+ #[0-9A-F]{6}$/.test(pill) && inert.join() === "true,true,false,false",
    `names a screen reader hears (#244): the ring list is a listbox of options (${roles[2]}), a row taken with Enter (ring ${by_key}); every slider named (${roles[4]}); a colour pill named by its owner, then its hex (${pill}); in the showcase the panel and the bar are inert (${inert.join(" ")})`);
}
const sum_before = await page.textContent("#ring-r-fig");
await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "r", t.ring().r - 1); });
check(await page.textContent("#ring-r-fig") !== sum_before && await page.textContent("#ring-r-fig") === String(await S("S.rings[S.ui_ring].r")) && await page.$$eval(".ringlist li.ring.on", (e) => e.length) === 1, `the selected row's radius follows the ring: ${sum_before} → ${await page.textContent("#ring-r-fig")}`);
await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "r", t.ring().r + 1); });
await shot("4c7-ring-summary");
check(await page.$$eval(".ringlist input", (e) => e.length) === 0 && await page.$$eval(".ringlist .rename", (e) => e.length) === 1, "the ring list has no name fields: one rename box, on the selected ring");
const mine = await S("S.ui_ring"), other_ring = mine === 0 ? 1 : 0;
await page.click(`.ringlist li:nth-child(${other_ring + 1} of .ring) .name`);
check(await S(`S.ui_ring === ${other_ring}`) && await page.$$eval(".ringlist input", (e) => e.length) === 0, "a click on another ring's name selects it and renames nothing");
await page.click(`.ringlist li:nth-child(${mine + 1} of .ring) .name`);
await page.click(".ringlist li.ring.on .rename");
await enter_value(".ringlist li.ring.on input.name", "Edge");
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
// #183: an eye on another row shows or hides that ring and leaves the selection (and the ring line) where they are
{
  const sel = await S("S.ui_ring"), other = sel === 0 ? 1 : 0;
  const y0 = await page.$eval(`.ringlist li:nth-child(${other + 1} of .ring) button.eye`, (e) => e.getBoundingClientRect().top);
  await page.click(`.ringlist li:nth-child(${other + 1} of .ring) button.eye`);
  const y1 = await page.$eval(`.ringlist li:nth-child(${other + 1} of .ring) button.eye`, (e) => e.getBoundingClientRect().top);
  check(await S(`S.ui_ring === ${sel} && S.rings[${other}].on === false`) && Math.abs(y1 - y0) < 1, `another row's eye hides its ring without selecting it; the eye stays put (${y0} → ${y1})`);
  await page.click(`.ringlist li:nth-child(${other + 1} of .ring) button.eye`);
  check(await S(`S.rings[${other}].on === true && S.ui_ring === ${sel}`), "and shows it again");
}
const eyes = await page.$$eval(".ringlist button.eye svg, .pinned button.fold .eye svg", (e) => [...new Set(e.map((x) => Math.round(x.getBoundingClientRect().left)))]);
const starts = await page.evaluate(() => { const l = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left), r = (q) => Math.round(document.querySelector(q).getBoundingClientRect().right); return { row: l(".ringlist li.ring"), row_end: r(".ringlist li.ring"), line: l(".lineholder"), line_end: r(".lineholder"), heading: l(".pinned h2"), tools: r(".headtools"), pane: r(".pinned .pane"), details: l("#ring-details .line"), eye: l(".ringlist li.ring.on .eye svg") }; });
check(eyes.length === 2 && starts.row === starts.heading && starts.line === starts.row && starts.line_end === starts.row_end && starts.tools === starts.pane && Math.abs(starts.details - starts.eye) <= 1,
  `ring rows start where the heading starts, a ring's eye inside its row; the ring line is as wide as the rows, its details starting under the eye; the tools end on the pane's line (${JSON.stringify(starts)})`);
// the heading line carries the tools: a plus and four signs, all the same outlined circle; the plus opens the five kinds (four until the text ring, #297, 4.48).
// Since 4.36 the circle is drawn in the sign (its rim, as heavy as the sign: R33), not a border
const tools = await page.evaluate(() => { const signs = [...document.querySelectorAll(".headtools .sign")], h = document.querySelector(".pinned .fold").getBoundingClientRect(); return { rims: document.querySelectorAll(".headtools .sign svg .rim").length, ids: signs.map((b) => b.id).join(" "), look: [...new Set(signs.map((b) => { const c = getComputedStyle(b), r = b.getBoundingClientRect(); return [c.borderTopWidth, parseFloat(c.borderTopLeftRadius) >= 13, r.width, r.height].join("/"); }))], on_line: signs.every((b) => { const r = b.getBoundingClientRect(); return r.top >= h.top && r.bottom <= h.bottom; }), foot: document.querySelectorAll(".listfoot").length }; });
check(tools.ids === "ring-add ring-up ring-down ring-duplicate ring-delete" && tools.look.length === 1 && tools.look[0] === "0px/true/26/26" && tools.rims === 5 && tools.on_line && tools.foot === 0, `plus · up · down · duplicate · delete stand on the heading line, five outlined circles of one size (${tools.look.join(" ")}); no line under the list`);
await page.click("#ring-add");
check(await page.isVisible("#add-menu") && (await page.$$eval("#add-menu button > span", (b) => b.map((x) => x.textContent).join(" "))) === "Ticks Markers Numerals Band Text", "the plus opens a menu of the four kinds");
await shot("4c9-add-menu");
await page.mouse.click(60, 44);      // on the tool's name: nothing to press there
check(await page.isHidden("#add-menu"), "a press outside puts the menu away");
// the ring drawer (Okay's design, 13 Oct 2026; his PSD of 18 Oct 2026, #335 #327, 4.55): in the list, right under the selected ring's row; the details written out on two lines · a bare colour · size · radius, the buttons one height; the row above has the kind as a button and the size and radius in Dial Mono over their buttons
const one = await page.evaluate(() => {
  const p = document.querySelector(".pinned"), holder = p.querySelector(".lineholder"), line = holder.querySelector(".ringline"), parts = [...line.children], on = p.querySelector(".ringlist li.ring.on");
  const c = getComputedStyle(holder), row = getComputedStyle(on), h = (e) => Math.round(e.getBoundingClientRect().height), sq = on.querySelector("#ring-kind-square"), det = line.querySelector("#ring-details"), lines = [...det.querySelectorAll(".line")];
  const m = (e) => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2; };
  const fig = (id, b) => { const f = document.querySelector(id); return [f.textContent, Math.abs(m(f) - m(document.querySelector(b))) <= 1, getComputedStyle(f).fontFamily.includes("Dial Mono")]; };
  return { panes: p.querySelectorAll(".pane").length, under: holder.previousElementSibling === on, gap: Math.round(holder.getBoundingClientRect().top - on.getBoundingClientRect().bottom), order: parts.map((e) => e.id || e.className).join(" "),
    square: [sq && sq.tagName, sq && sq.dataset.kind, sq && sq.querySelector("svg") !== null, document.querySelector("#ring-change") === null],
    details: [lines.length, lines.map((l) => l.textContent), lines.every((l) => getComputedStyle(l).textOverflow === "ellipsis" && getComputedStyle(l).whiteSpace === "nowrap"), getComputedStyle(det.querySelector(".k")).color !== getComputedStyle(det).color],
    figs: [fig("#ring-size-fig", "#ring-size"), fig("#ring-r-fig", "#ring-r")], untagged: [...line.querySelectorAll(".valueb")].every((b) => !b.dataset.tip),
    hex: getComputedStyle(line.querySelector(".colour .hex")).display, swatch: getComputedStyle(line.querySelector(".colour")).borderTopColor,
    heights: [...new Set([...line.querySelectorAll(".colour, .valueb")].map(h))], round: [...line.querySelectorAll(".valueb")].every((e) => Math.round(e.getBoundingClientRect().width) === h(e)),
    title: p.querySelector("h2").textContent, figures: line.querySelectorAll(".figure").length, small: line.querySelectorAll("#ring-size svg .small").length,
    ground: c.backgroundColor, frame: c.borderTopColor, row_frame: row.borderTopColor, tip: sq && sq.dataset.tip, rows: p.querySelectorAll(".ringlist li.ring").length, all: p.querySelectorAll(".ringlist li").length };
});
const R0 = await S("S.rings[S.ui_ring]");
check(one.panes === 1 && one.under && one.gap === 2 && one.order === "ring-details ring-c-Colour ring-size ring-r" && one.square[0] === "BUTTON" && one.square[1] === String(R0.kind) && one.square[2] && one.square[3]
  && one.details[0] === 2 && one.details[1][0] === `Width: ${R0.width} · Fill: ${R0.fill}%` && one.details[1][1].startsWith(`Positions: ${R0.count}`) && one.details[2] && one.details[3]
  && one.figs[0].join() === `${R0.width},true,true` && one.figs[1].join() === `${R0.r},true,true` && one.untagged
  && one.hex === "none" && one.swatch === "rgba(0, 0, 0, 0)" && one.heights.length === 1 && one.round && one.title === "Rings, top first" && one.all === one.rows + 1 && one.small === 1 && one.ground === "rgb(255, 255, 255)" && one.frame === one.row_frame && one.tip === "Kind",
  `the ring drawer stands in the list, ${one.gap} under the selected ring's row: the details on two lines, grey names, each line cut when long (${one.details[1].join(" / ")}) · a bare swatch · size · radius, all ${one.heights[0]} high, no tags; the row's kind icon is a button and its size and radius (${one.figs.map((f) => f[0]).join(", ")}) stand in Dial Mono over their buttons; no Change; white, its frame the guide's colour like its row's (${one.frame}) (#335, #327)`);
// the square opens the kinds, over everything, under the square, the ring's kind marked, the note at the foot; a kind taken; Escape and a press outside put it away
{
  await page.click("#ring-kind-square");
  const menu = await page.evaluate(() => { const m = document.querySelector("#kind-menu"), s = document.querySelector("#ring-kind-square").getBoundingClientRect(), r = m.getBoundingClientRect(); return [!m.hidden, m.parentElement === document.body, Math.round(r.left - s.left), Math.round(r.top - s.bottom), [...m.querySelectorAll("button")].map((b) => b.querySelector("span").textContent + (b.classList.contains("on") ? "*" : "")).join(" "), m.querySelector(".note"), getComputedStyle(m).position, getComputedStyle(m).zIndex]; });
  await page.click("#ring-kind-Kind-0");
  const took = await S("S.rings[S.ui_ring].kind") === 0 && await page.isHidden("#kind-menu") && await page.$eval("#ring-kind-square", (e) => e.dataset.kind) === "0" && await page.$eval(".ringlist li.ring.on .kindicon", (e) => e.dataset.kind) === "0";
  await page.evaluate(() => window.dial_tool.set_value("ring", "kind", 3));
  await page.click("#ring-kind-square"); await page.keyboard.press("Escape"); const esc = await page.isHidden("#kind-menu");
  await page.click("#ring-kind-square"); await page.mouse.click(60, 44); const out = await page.isHidden("#kind-menu");
  check(menu[0] && menu[1] && menu[2] === 0 && menu[3] === 6 && menu[4] === "Ticks Markers Numerals Band* Text" && menu[5] === null && menu[6] === "fixed" && menu[7] === "30" && took && esc && out,
    `the row's kind icon opens the five kinds under it, over everything (${menu[4]}), no note under them (4.60: "Remove the explainer from dropdown"); a kind taken changes the ring, the square and the row's icon; Escape and a press outside put it away`);
}
// its frame: an outer line in the guide's colour and, inside it, a line three times as thick in the selected row's ground; the kind pictures in the tool's sans, bold (#255: "abort silkscreen there")
{
  const look = await page.evaluate(() => {
    const h = document.querySelector(".lineholder"), c = getComputedStyle(h), on = getComputedStyle(document.querySelector(".ringlist li.ring.on"));
    const strokes = [...new Set([...document.querySelectorAll(".valueb svg circle:first-child, .valueb svg .small")].map((e) => getComputedStyle(e).stroke))], fig = document.querySelector(".ringlist .kindicon svg text.figure") || document.querySelector("#kind-menu svg text.figure");
    return { inner: c.boxShadow, ground: on.backgroundColor, pad: parseFloat(c.paddingTop), strokes, text: fig && getComputedStyle(fig).fontWeight, pixel: document.querySelectorAll(".ringlist svg text.pixel, #kind-menu svg text.pixel").length };
  });
  check(look.inner.includes("3px") && look.inner.includes("inset") && look.inner.startsWith(look.ground) && look.pad === 11 && look.strokes.length === 1 && look.text === "700" && look.pixel === 0,
    `the ring drawer's frame has an inner line 3 thick in its row's ground (${look.ground}) and ${look.pad} of room; the kind pictures' figures are the tool's sans, bold (${look.text}), none in Silkscreen; the round buttons have one outline`);
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
await page.hover("#ring-kind-square");
const tag = await page.evaluate(() => { const t = document.querySelector("#tag"), b = document.querySelector("#ring-kind-square").getBoundingClientRect(), r = t.getBoundingClientRect(); return [t.hidden, t.textContent, r.top > b.bottom, Math.abs((r.left + r.right) / 2 - (b.left + b.right) / 2) < 2]; });
check(!tag[0] && tag[1] === "Kind" && tag[2] && tag[3], "the selected row's kind icon says what it is in a tag under it while the pointer is on it: Kind");
await page.hover("#ring-r");
check(await page.$eval("#tag", (t) => t.hidden), "the drawer's radius button has no tag: its number stands in the row above (4.55)");
await page.hover("#ring-kind-square");
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
check(await page.$("#value-pop") === null && Math.abs(await S("S.rings[S.ui_ring].r") - (r_before + 0.5)) < 1e-9 && await page.textContent("#ring-r-fig") === String(r_before + 0.5), `typing +0.5 and Enter adds it and closes the pop-up: ${r_before} → ${await S("S.rings[S.ui_ring].r")}`);
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
  const pop = await page.evaluate(() => { const e = document.querySelector("#value-pop"), p = e.getBoundingClientRect(), c = getComputedStyle(e), row = e.querySelector(".row"), s = e.querySelector("input[type=range]"), k = s.getBoundingClientRect(), pp = +s.style.getPropertyValue("--p"), steps = [...e.querySelectorAll(".step")].map((x) => x.getBoundingClientRect());
    return [e.querySelector("label").textContent, e.parentElement === document.body && e.classList.contains("numpop"), Math.round(p.width), Math.round(p.height), c.borderRadius, getComputedStyle(row).borderRadius, [c.backgroundColor, getComputedStyle(row).backgroundColor, getComputedStyle(s).backgroundColor, getComputedStyle(steps.length ? e.querySelector(".step") : e).backgroundColor].join(" "),
      [Math.round(k.height), ...steps.map((r) => Math.round(r.width) + "×" + Math.round(r.height))].join(" "), steps.length === 2 && Math.round(steps[1].left - steps[0].right) === 86 && e.querySelectorAll(".step svg").length === 2, [e.querySelector(".popname-line") === null && e.querySelector(".row > label").hidden, Math.round(e.querySelector(".popvalue").getBoundingClientRect().height), getComputedStyle(e.querySelector(".popvalue")).backgroundColor, getComputedStyle(e.querySelector(".popvalue input")).fontWeight, getComputedStyle(e.querySelector(".popvalue input")).fontSize].join(" "),
      [k.left + k.height / 2 + pp * (k.width - k.height), k.top + k.height / 2]]; });
  await shot("4c19-size-pop");
  await page.keyboard.type("x2"); await page.keyboard.press("Enter");
  const w_after = await S("S.rings[S.ui_ring].width");
  await page.evaluate((w) => window.dial_tool.set_value("ring", "width", w), w_before);
  check(Math.abs(dragged - (w_before + 0.4)) < 1e-9 && pop[0] === "Band width" && pop[1] && pop[2] === 251 && pop[3] === 248 && pop[4] === "49.5px" && pop[5] === "0px" && pop[6] === "rgb(92, 92, 88) rgba(0, 0, 0, 0) rgb(255, 255, 255) rgb(63, 63, 62)" && pop[7] === "66 66×66 66×66" && pop[8] && pop[9] === "true 66 rgb(185, 185, 180) 700 41px" && Math.abs(pop[10][0] - sb[0]) <= 1 && Math.abs(pop[10][1] - sb[1]) <= 1 && Math.abs(w_after - 2 * w_before) < 1e-9 && await page.$("#value-pop") === null,
    `the size button, before the radius: dragged 16 to the right a band is 0.4 wider; a click opens the controller (#249; Okay's second drawing, controller 2.svg, 18 Oct 2026) with its knob under the press (${pop[10].map(Math.round)} for ${sb.map(Math.round)}): one dark square (${pop[6]}) holding, all 66 high (${pop[7]}), the value in bold 41 on a grey pill and no name ("No name necessary": ${pop[9]}), the slider in a white pill, − and + as two dark discs 86 apart; ${pop[2]} × ${pop[3]}, corners ${pop[4]}; it takes x2`);
  // sliding in it shows the guides, as set, even with Guides off, and they go a moment after (Okay, on 4.45: "activate guides on slide. Even if off")
  await page.evaluate(() => window.dial_tool.set_value("global", "guides", false));
  await page.click("#ring-size"); await page.waitForTimeout(200);
  await page.evaluate(() => { const s = document.querySelector("#value-pop input[type=range]"); s.value = +s.value + 0.2; s.dispatchEvent(new Event("input", { bubbles: true })); });
  await frame();
  const live = await S("t.items.filter((i) => i.role === 'guide').length");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1400);
  const gone = await S("t.items.filter((i) => i.role === 'guide').length");
  await page.evaluate((w) => { window.dial_tool.set_value("ring", "width", w); window.dial_tool.set_value("global", "guides", true); }, w_before);
  check(live > 0 && gone === 0, `sliding in the popup with Guides off shows the guides (${live} drawn), gone a moment after (${gone}) (4.45.2)`);
}
{ // a full row's name opens the popup; pressed and moved, it changes the value (#249, #170)
  await page.click('button[data-tab="Dial"]'); await frame();
  const lab = await page.$('label[for="global-dial-d-Diameter"]');
  await lab.click(); await frame();
  const opened = await page.evaluate(() => { const e = document.querySelector("#value-pop"); return !!e && e.querySelector("label").textContent === "Diameter" && document.activeElement.id === "global-dial-d-Diameter" && document.activeElement.closest("#value-pop") !== null; });
  await page.keyboard.press("Escape");
  const before = await S("S.dial_d"), b = await lab.boundingBox();
  await page.mouse.move(b.x + 10, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + 30, b.y + b.height / 2, { steps: 5 }); await page.mouse.up();
  const after = await S("S.dial_d"), still = await page.$("#value-pop");
  await page.evaluate((v) => window.dial_tool.set_value("global", "dial_d", v), before);
  check(opened && after === before + 1 && still === null, `a row's name opens its popup, the field ready (Diameter); pressed and moved 20 to the right it is 1 more (${before} → ${after}) and nothing opens`);
  await page.click('button[data-tab="Rings"]'); await frame();
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
    && await page.textContent("#ring-r-fig") === String(s0[1]) && await page.$$eval(".ringlist li.ring", (l) => l.length) === s0[0],
    `undo: a duplicate, then a whole drag of the radius (${s1[1]} → ${s0[1]}), each one step back; redo brings the drag back; the panel follows`);
  await page.evaluate(() => window.dial_tool.set_value("global", "dial_d", 31));
  await settle();
  await page.keyboard.press("Meta+z");
  check((await state())[3] === s0[3], "⌘Z does the same");
  const place = await page.evaluate(() => { const u = document.querySelector(".undos").getBoundingClientRect(), g = document.querySelector("#tiny-open").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); return [u.right <= g.left, Math.round(u.top - m.top) === Math.round(g.top - m.top), Math.round(u.left - m.left) === 12, document.querySelector("#redo").classList.contains("none")]; });
  await page.click("#redo");
  const fwd = (await state())[3];
  await page.click("#undo");
  check(place[0] && place[1] && place[2] && !place[3] && fwd === 31 && (await state())[3] === s0[3], "Undo and Redo stand on the preview's top left, 12 from its left edge, level with the Tiny Preview's eye (the Guides switch's place until 4.58), and do the same");
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
  // no name in the controller (Okay, 18 Oct 2026, controller 2.svg: "No name necessary"): the menu stays on the row; the
  // value's pill as far from the square's top as the discs from its foot
  const pop = document.querySelector("#value-pop"), p = pop.getBoundingClientRect(), head = pop.querySelector(".pophead").getBoundingClientRect(), steps = pop.querySelector(".steps").getBoundingClientRect();
  out.look = [pop.querySelector(".menulabel").hidden, Math.round(head.top - p.top), Math.round(p.bottom - steps.bottom), Math.round(p.height), Math.round(head.height)];
  return out;
});
await shot("4c10-radius-pop");
await page.keyboard.press("Escape");
await page.click(`.ringlist li:nth-child(${ring_before + 1} of .ring) .name`);
check(anchors.options === "Baseline Ascender Centre Outer edge Inner edge" && anchors.labels.join(" | ") === "Centre radius | Baseline radius | Ascender radius | Centre radius" && anchors.a1 === 1 && anchors.a2 === 2 && anchors.a0 === 0 && anchors.look.join(" ") === "true 17 17 248 66",
  `the radius of numerals has a menu beside its label: ${anchors.options}; the label follows: ${anchors.labels.join(" → ")}; in the controller no name, the value's pill as far from the top as the discs from the foot (${anchors.look.join(" · ")}) (controller 2.svg, 18 Oct 2026)`);
// …and the drawing follows: the numeral at 12 stands on the radius (baseline), hangs from it (ascender), or is centred on it
const at12 = [];
for (const v of [1, 2, 0]) {
  await page.evaluate((v) => { const t = window.dial_tool; t.S.rings.find((r) => r.kind === 2).anchor = v; t.static_dirty = true; t.render(); }, v);
  await frame();
  at12.push(await page.evaluate(() => { const t = window.dial_tool, d = t.statik.rings.find((x) => x.ring.kind === 2), b = d.parts[0].bounds(); return [b[1] - d.ring.r, b[3] - d.ring.r, (b[1] + b[3]) / 2 - d.ring.r]; }));
}
check(Math.abs(at12[0][0]) < 0.06 && at12[0][1] > 1 && Math.abs(at12[1][1]) < 0.01 && at12[1][0] < -1 && Math.abs(at12[2][2]) < 0.001,
  `at 12 the numeral's foot is on the radius with Baseline (${at12[0][0].toFixed(3)}), its top with Ascender (${at12[1][1].toFixed(3)}), its middle with Centre (${at12[2][2].toFixed(4)})`);
{ // the edges, tangent (#338; Okay, 18 Oct 2026: "Tangent to inner or outer"), and a change of anchor that moves nothing on
  // the dial, only the dotted line (#326: "Nothing changed … just the dotted line moves"; "applies to reverse auto reverse")
  const r = await page.evaluate(() => {
    const t = window.dial_tool, S = t.S, ring = S.rings.find((x) => x.kind === 2), keep = { anchor: ring.anchor, r: ring.r, mode: ring.mode, i: S.ui_ring };
    const part = (k = 0) => { t.static_dirty = true; t.render(); t.draw(); return t.statik.rings.find((x) => x.ring === ring).parts[k].bounds(); };
    S.ui_ring = S.rings.indexOf(ring);
    ring.anchor = 3; ring.mode = 0; const out12 = part(0);
    ring.anchor = 4; const in12 = part(0);
    ring.anchor = 0; ring.mode = 1; const before = part(0), before3 = part(1);
    t.set_value("ring", "anchor", 2); const after = part(0), after3 = part(1), r2 = ring.r;
    t.set_value("ring", "anchor", 4); const after_in = part(0);
    Object.assign(ring, { anchor: keep.anchor, r: keep.r, mode: keep.mode }); S.ui_ring = keep.i; t.static_dirty = true; t.render();
    const moved = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
    return { top: out12[3] - keep.r, inner: in12[1] - keep.r, still: Math.max(moved(before, after), moved(before3, after3), moved(before, after_in)), r2: r2 - keep.r };
  });
  check(Math.abs(r.top) < 0.01 && Math.abs(r.inner) < 0.01 && r.still < 0.02 && Math.abs(r.r2) > 0.1,      // 0.02: labels of different heights hang from one line with Ascender, each from its own middle with Centre — a hundredth, seen at 400 %
    `Outer edge: the numeral at 12 touches the radius with its top (${r.top.toFixed(3)}); Inner edge: the 12's foot (${r.inner.toFixed(3)}); a radial ring changed from Centre to Ascender and Inner edge doesn't move (${r.still.toFixed(4)}), its radius does (${r.r2.toFixed(3)})`);
}
{ // one mark nudged (#349, groundwork: "Each individual marker could be selected and edited"): a mark keeps its own radius ±,
  // angle ±, size × and turn in the ring's nudge, as a numeral does
  const m = await page.evaluate(() => { const t = window.dial_tool, ring = t.S.rings.find((x) => x.kind === 1), keep = JSON.stringify(ring.nudge || {});
    const part = () => { t.static_dirty = true; t.render(); t.draw(); return t.statik.rings.find((x) => x.ring === ring).parts[0].bounds(); };
    const a = part(); ring.nudge = { "0": { dr: 1 } }; const b = part(); ring.nudge = { "0": { s: 2 } }; const c = part();
    ring.nudge = JSON.parse(keep); part(); return [b[3] - a[3], (c[3] - c[1]) / (a[3] - a[1])]; });
  check(Math.abs(m[0] - 1) < 0.01 && Math.abs(m[1] - 2) < 0.05, `a mark nudged: 1 further out (${m[0].toFixed(3)}), twice as long (${m[1].toFixed(2)}) — the numerals' Nudge, for every mark`);
}
{ // a disc hand's window inside its disc (#344; "Off in old links for window"): off to start, on for a hand made a disc here
  const d = await page.evaluate(() => { const t = window.dial_tool, i = t.S.ui_hand, keep = JSON.stringify(t.S.ha_minute);
    t.S.ui_hand = 1; const was = t.S.ha_minute.mark_in; t.set_value("hand", "shape", 10); const now = t.S.ha_minute.mark_in;
    Object.assign(t.S.ha_minute, JSON.parse(keep)); t.S.ui_hand = i; t.render(); return [was, now]; });
  check(d[0] === false && d[1] === true, `a disc hand's window: off to start (${d[0]}), on once a hand is made a disc in the tool (${d[1]}), so older links draw as they did`);
}
// resize from (#257, 4.47): a mark's or a band's radius measures to its outer end, its middle or its inner end — the
// same menu beside the radius' label; the ring's dotted guide is that radius; the Resize pane stands first (Type first
// in a numerals ring, #296)
{
  const from = [], was = await S("[S.ui_ring, S.gd_rings]");
  for (const v of [0, 1, 2]) {
    from.push(await page.evaluate((v) => {
      const t = window.dial_tool, S = t.S, ring = S.rings.find((r) => r.kind === 1), band = S.rings.find((r) => r.kind === 3);
      ring.from = band.from = v; S.gd_rings = true; S.ui_ring = S.rings.indexOf(ring); t.show_section(); t.sync_rows(); t.static_dirty = true; t.render(); t.draw();
      const d = t.statik.rings.find((x) => x.ring === ring), b = d.parts[0].bounds(), e = t.statik.rings.find((x) => x.ring === band).parts[0].bounds();
      const dots = t.items.filter((i) => i.role === "guide" && i.dots).map((i) => +(i.path.bounds()[3]).toFixed(2));
      const panes = [...document.querySelectorAll(".form .pane h2")].filter((h) => h.closest(".pane").offsetParent).map((h) => h.textContent);
      return [+(b[1] - ring.r).toFixed(3), +(b[3] - ring.r).toFixed(3), +(e[3] - band.r).toFixed(3), +(e[3] - e[1] - band.width).toFixed(3), dots.includes(+ring.r.toFixed(2)) && dots.includes(+band.r.toFixed(2)), document.querySelector("#ring-r-Outer-radius").closest(".row").querySelector("label").textContent, panes.slice(0, 2).join(" · "), dots.join(" ")];
    }, v));
  }
  await page.evaluate(() => { const t = window.dial_tool; for (const r of t.S.rings) r.from = 0; t.static_dirty = true; t.render(); });
  const numerals_panes = await page.evaluate(() => { const t = window.dial_tool; t.S.ui_ring = t.S.rings.findIndex((r) => r.kind === 2); t.show_section(); t.sync_rows(); return [...document.querySelectorAll(".form .pane h2")].filter((h) => h.closest(".pane").offsetParent).map((h) => h.textContent).slice(0, 2).join(" · "); });
  await page.evaluate(([ring, all]) => { const t = window.dial_tool; t.S.ui_ring = ring; t.S.gd_rings = all; t.show_section(); t.sync_rows(); t.draw(); }, was);
  check(from[0][1] === 0 && from[0][0] < 0 && Math.abs(from[1][0] + from[1][1]) < 0.001 && from[2][0] === 0 && from[2][1] > 0 && from[0][2] === 0 && Math.abs(from[1][2] - 0.5) < 0.001 && from[2][2] === 1 && from.every((f) => f[4]) && from.map((f) => f[5]).join(" | ") === "Outer radius | Middle radius | Inner radius" && from[0][6] === "Resize · Shape" && numerals_panes === "Type · Resize",
    `resize from (#257): a marker's outer end on the radius (${from[0].slice(0, 2)}), then its middle (${from[1].slice(0, 2)}), then its inner end (${from[2].slice(0, 2)}); a band likewise (its outer edge ${from.map((f) => f[2]).join(" · ")} past its radius); the ring's dotted guide at its radius each time (dotted at ${from[0][7]}); the label follows (${from.map((f) => f[5]).join(" → ")}); Resize first under the pinned part (${from[0][6]}), Type first for numerals (${numerals_panes}, #296)`);
}
// a text ring (#297, 4.48): a fifth kind, its words at every position; its panes Text · Type · Resize; its angle snaps to the other rings' indices
{
  const was = await S("[S.ui_ring, S.rings.length]");
  await page.click("#ring-add"); await page.click("#add-text"); await page.waitForTimeout(200);
  const t1 = await page.evaluate(() => { const t = window.dial_tool, R = t.ring(), d = t.statik.rings.find((x) => x.ring === R), panes = [...document.querySelectorAll(".form .pane h2")].filter((h) => h.closest(".pane").offsetParent).map((h) => h.textContent).slice(0, 3).join(" · ");
    const b = d.parts[0].bounds();
    return [t.G ? "" : "", R.kind, R.custom, R.count, R.start, [...document.querySelectorAll("#ring-details .line")].map((l) => l.textContent).join(" / "), panes, d.parts.length, Math.round((b[1] + b[3]) / 2), document.querySelector("#ring-custom-Text") !== null]; });
  await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "custom", "SWISS MADE"); t.set_value("ring", "count", 3); t.set_value("ring", "start", 31); });
  await frame();
  const t2 = await page.evaluate(() => { const t = window.dial_tool, R = t.ring(), d = t.statik.rings.find((x) => x.ring === R); return [R.start, d.parts.length, document.querySelectorAll("#ring-details .line")[1].textContent]; });
  await page.evaluate(() => window.dial_tool.set_value("ring", "start", 44));
  const t3 = await S("S.rings[S.ui_ring].start");
  await page.evaluate(([ring, n]) => { const t = window.dial_tool; t.ring_tool("delete"); if (t.S.rings.length !== n) throw new Error("the text ring was not the one deleted"); t.select_ring(ring); }, was);
  check(t1[1] === 4 && t1[2] === "AUTOMATIC" && t1[3] === 1 && t1[4] === 180 && t1[5] === "Text: AUTOMATIC / Positions: 1 · Start: 180°" && t1[6] === "Text · Type · Resize" && t1[7] === 1 && t1[8] < 0 && t1[9] && t2[0] === 30 && t2[1] === 3 && t2[2] === "Positions: 3 · Start: 30°" && t3 === 44,
    `a text ring (#297): added as the fifth kind, "${t1[2]}" once under the centre (its middle ${t1[8]} mm, start ${t1[4]}°), its row says "${t1[5]}", its panes ${t1[6]}; with Count 3 the words stand at every position (${t2[1]}, "${t2[2]}"); Start 31° snaps to the markers' 30° (${t2[0]}), 44° stays (${t3}) — within ${2}°`);
}
// Positions (#251, 4.50.1; drawn by Okay, notes 2, #357, 4.56): a round preview at the left, three rows high — a mark at every position, the used ones in ink, the skipped faint, the first a dot, the span a dotted arc; beside it Count · Every as menus, Offset · Start · Span as number blocks, Skip those with an (i); the start and the span's end dragged round the preview
{
  const was = await S("[S.ui_ring, S.rings[S.ui_ring].every, S.rings[S.ui_ring].start, S.rings[S.ui_ring].span, S.rings[S.ui_ring].count]");
  await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "every", 3); t.set_value("ring", "start", 15); t.set_value("ring", "span", 270); });
  const pos = await page.evaluate(() => { const e = document.querySelector("#ring-positions"), t = window.dial_tool, R = t.ring(), r = e.getBoundingClientRect(), c = e.querySelector("circle.axis"), cs = getComputedStyle(c), rows = [...e.parentElement.querySelectorAll(":scope > .row")].filter((x) => !x.hidden);
    const first = e.querySelector(".first"), fx = +first.getAttribute("cx"), fy = +first.getAttribute("cy"), cells = rows.map((x) => x.getBoundingClientRect());
    return [e.classList.contains("detail") && e.classList.contains("round"), getComputedStyle(e).borderTopWidth, cs.fill, e.querySelectorAll(".used").length, e.querySelectorAll(".skipped").length, R.count, getComputedStyle(e.querySelector(".span")).strokeDasharray, Math.round(Math.atan2(fx, -fy) * 180 / Math.PI), rows.map((x) => (x.querySelector("label").textContent || "").trim()).join(" · "), rows.map((x) => x.className.replace("row ", "")).join(" "), e.getAttribute("role"), e.ariaLabel, Math.round(r.width) === Math.round(r.height) && Math.round(r.top) === Math.round(cells[0].top), cells[0].top === cells[1].top && cells[2].top === cells[3].top && cells[4].top === cells[5].top && cells[0].left === cells[2].left && cells[1].left > cells[0].right]; });
  await page.click(".pane.positions .row.nummenu label");
  const popped = await page.evaluate(() => { const p = document.querySelector("#value-pop"); return !!p && p.querySelector("label").textContent === "Count" && getComputedStyle(p.querySelector("input[type=range]")).display !== "none"; });
  await page.keyboard.press("Escape"); await page.evaluate(() => window.dial_tool.value_pop_close());
  // the menu: a count picked; Custom turns it into a field, Enter takes it, Escape puts the menu back
  await page.selectOption("#ring-count-Count-menu", "12"); const picked = await S("S.rings[S.ui_ring].count");
  await page.selectOption("#ring-count-Count-menu", "custom"); const typing = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.type("7"); await page.keyboard.press("Enter");
  const typed = [await S("S.rings[S.ui_ring].count"), await page.isHidden("#ring-count-Count"), await page.$eval("#ring-count-Count-menu", (e) => e.value)];
  await page.selectOption("#ring-count-Count-menu", "custom"); await page.keyboard.type("11"); await page.keyboard.press("Escape"); const kept = await S("S.rings[S.ui_ring].count");
  // the drags: the outer band moves the start, the inner the span's end
  const b = await page.$eval("#ring-positions", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width]; });
  const P = (deg, part) => { const k = b[2] / 2.2, a = deg * Math.PI / 180; return [b[0] + b[2] / 2 + Math.sin(a) * part * k, b[1] + b[2] / 2 - Math.cos(a) * part * k]; };
  await page.mouse.move(...P(15, 0.75)); await page.mouse.down(); await page.mouse.move(...P(60, 0.75), { steps: 4 }); await page.mouse.move(...P(90, 0.75), { steps: 4 }); await page.mouse.up();
  const start = await S("S.rings[S.ui_ring].start");
  await page.mouse.move(...P(90 + 260, 0.5)); await page.mouse.down(); await page.mouse.move(...P(90 + 200, 0.5), { steps: 4 }); await page.mouse.move(...P(90 + 180, 0.5), { steps: 4 }); await page.mouse.up();
  const span = await S("S.rings[S.ui_ring].span");
  // the (i) beside Skip those says what it does in a tag, a tap away
  await page.click(".pane.positions .row.chk .infosign"); await page.waitForTimeout(50);
  const tip = await page.$eval("#tag", (t) => [t.hidden, t.textContent, t.getBoundingClientRect().width <= 241, t.getBoundingClientRect().height > 30, t.getBoundingClientRect().left >= 0 && t.getBoundingClientRect().right <= innerWidth]);
  await page.evaluate(([i, every, start, span, count]) => { const t = window.dial_tool; for (const [k, v] of Object.entries({ every, start, span, count })) t.set_value("ring", k, v); }, was);
  check(pos[0] && pos[1] === "0px" && pos[2] === "none" && pos[3] + pos[4] === pos[5] && pos[3] === Math.ceil(pos[5] / 3) && pos[6] !== "none" && pos[7] === 15 && pos[8] === "Count · Every · Offset · Skip those · Start · Span" && pos[9] === "nummenu nummenu num block chk num block num block" && pos[10] === "img" && pos[11].startsWith(`${pos[3]} of ${pos[5]} positions used`) && pos[12] && pos[13] && popped
    && picked === 12 && typing === "ring-count-Count" && typed.join() === "7,true,7" && kept === 7 && start === 90 && span === 180 && !tip[0] && tip[1].startsWith("Turns it over") && tip[2] && tip[3] && tip[4],
    `Positions (#357): a round preview three rows high, no frame: ${pos[3]} marks in ink and ${pos[4]} faint of ${pos[5]} with Every 3, the first at ${pos[7]}°, the span dotted (${pos[6]}); beside it two columns (${pos[8]}); a name opens the controller (${popped}); the menu picks 12, Custom types 7 (${typed.join(" ")}), Escape keeps ${kept}; dragged, the start goes to ${start}°, the span's end to ${span}°; the (i) says "${tip[1].slice(0, 20)}…" in a tag no wider than 240, wrapped, on screen (4.63: "constrict the width")`);
}
// Give way (#258, 4.50.2): two side tabs, the open one white and joined to a white-bordered square; in it a drawing of the choice, the choices as radio buttons, Clearance a quiet row only when something is knocked out
{
  const was = await S("[S.rings[S.ui_ring].skip, S.rings[S.ui_ring].knock, S.rings[S.ui_ring].clear]");
  await page.evaluate(() => { const t = window.dial_tool; t.set_value("ring", "skip", 2); t.set_value("ring", "knock", 0); });
  await frame();
  const g1 = await page.evaluate(() => { const w = document.querySelector("#give-way"), tabs = [...w.querySelectorAll(".givetab")], box = w.querySelector("#give-box"), t0 = tabs[0].getBoundingClientRect(), b = box.getBoundingClientRect(), own = w.querySelector(".givepic path.own").getAttribute("d");
    return [tabs.map((x) => x.textContent).join(" · "), tabs[0].classList.contains("on"), getComputedStyle(tabs[0]).backgroundColor, getComputedStyle(box).backgroundColor, getComputedStyle(box).borderTopColor, Math.round(t0.right) >= Math.round(b.left), (own.match(/M/g) || []).length, [...w.querySelectorAll(".givechoices input[type=radio]")].length, w.querySelector(".givechoices input:checked").id, w.querySelector(".row.side.quiet").hidden, tabs[0].getAttribute("role"), w.querySelector(".givepic").getAttribute("role")]; });
  await page.click("#give-tab-1");
  await page.click("#ring-give-knock-3");
  await page.evaluate(() => window.dial_tool.set_value("ring", "clear", 0.3));
  await frame();
  const g2 = await page.evaluate(() => { const w = document.querySelector("#give-way"), own = w.querySelector(".givepic path.own").getAttribute("d"), t = window.dial_tool.ring();
    return [w.querySelector("#give-tab-1").classList.contains("on"), t.knock, (own.match(/M/g) || []).length, own.includes("V62"), w.querySelector(".row.side.quiet").hidden, w.querySelector(".row.side.quiet label").textContent, getComputedStyle(w.querySelector(".row.side.quiet input[type=range]")).display]; });
  await page.evaluate(([skip, knock, clear]) => { const t = window.dial_tool; t.set_value("ring", "skip", skip); t.set_value("ring", "knock", knock); t.set_value("ring", "clear", clear); t.give_tab = null; }, was);
  check(g1[0] === "Skip where · Knock out" && g1[1] && g1[2] === "rgb(255, 255, 255)" && g1[3] === "rgb(255, 255, 255)" && g1[4] === "rgb(255, 255, 255)" && g1[5] && g1[6] === 7 && g1[7] === 4 && g1[8] === "ring-give-skip-2" && g1[9] && g1[10] === "tab" && g1[11] === "img"
    && g2[0] && g2[1] === 3 && g2[2] === 9 && g2[3] && !g2[4] && g2[5] === "Clearance" && g2[6] === "none",
    `Give way (#258): tabs ${g1[0]}, the open one white (${g1[2]}) and touching the white-bordered square (${g1[3]}, ${g1[4]}); Skip where "markers & numerals above" draws ${g1[6]} of 9 ticks, four radio buttons with ${g1[8]} chosen, no Clearance (hidden ${g1[9]}); Knock out "everything above" draws all ${g2[2]} ticks, some cut short, and Clearance as a quiet row (${g2[5]}, slider ${g2[6]})`);
}
{
  const tiles = await page.$$eval("[id^=ring-mode-Placement-] svg", (es) => es.map((e) => { const [stems, heads] = [...e.querySelectorAll("path")].map((p) => p.getAttribute("d")); return [(stems.match(/M/g) || []).length, (heads.match(/Z/g) || []).length, e.querySelector("circle") !== null, e.querySelector("path").getAttribute("stroke-width")]; }));
  check(tiles.length === 4 && tiles.every((t) => t[0] === 6 && t[1] === 6 && t[2] && t[3] === "1.25"), `Placement's four tiles are micro dials (#259): a circle and six arrows each, thin stems (DENSE) and big filled heads (Okay, 18 Oct 2026: "thinner but big headed arrows") (${tiles.map((t) => t.join("/")).join(" · ")})`);
}
check(await page.$$eval(".row.pick .pickt svg", (e) => e.length) >= 4, "Kind is a row of picture tiles");
await page.click("#ring-kind-square"); await page.click("#ring-kind-Kind-0");
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

// ── guides: a switch on the preview's bottom left (top right until 4.58), with an arrow that opens their list (five kinds, eight colours) ──
await tab("Dial");
check(await page.$("main .guides #guides") !== null && await page.$(".panel #guides") === null && await page.isHidden("#guide-list"), "the Guides switch stands on the preview, not in the panel; its list is shut");
const guides_at = await page.evaluate(() => { const g = document.querySelector("#tiny-open").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); return [Math.round(m.right - g.right), Math.round(g.top - m.top)]; });
check(guides_at[0] === 12 && guides_at[1] === 16, `the Tiny Preview's eye, where Guides stood, is 12 from the preview's right, and 16 from its top: on the header's middle line (${guides_at.join(" / ")})`);
await page.click("#guides-more");
check(await page.isVisible("#guide-list") && (await page.$$eval("#guide-list > .guidekind .name", (n) => n.map((e) => e.textContent))).join() === "Centre hole,Centre lines" && await page.$$eval("#guide-list .guidekind >> nth=0 >> .dots .tone", (b) => b.length) === 8 && await page.$eval("#guide-list .guiderings", (e) => e.querySelectorAll(".guidekind.ring").length) === await S("S.rings.length") && await page.$("#guide-list .swatch") === null,
  "the arrow drops the list: the centre hole's guide first, then the centre lines (no dial edge since 15 Oct 2026, no window radii since 4.42.5), then a line for every ring and every window that is on, each with None and eight round colours, no free colour");
// the list's look (Okay, 16 Oct 2026, #271; 18 Oct, notes 2: "fainter"): a colour not chosen at 40 % (60 % until 4.52), the "none" sign one path; lines 30 high (#305, 4.45.3: "tighter"; 38 before)
{
  const look = await page.evaluate(() => { const q = (s) => document.querySelector("#guide-list " + s); return [Math.round(q(".guidekind").getBoundingClientRect().height), getComputedStyle(q(".tone:not(.on)")).opacity, getComputedStyle(q(".tone.on")).opacity, q(".none svg").querySelectorAll("path, circle, line").length]; });
  check(look[0] === 30 && look[1] === "0.4" && look[2] === "1" && look[3] === 1, `a guide's line is ${look[0]} high; a colour not chosen shows at ${look[1]}, the chosen one whole; the "none" sign is ${look[3]} path, so nothing in it overlaps`);
}
// windows have their own section, as rings (#271): All · Selected · None, Selected to start; a line per window that is on, in its own colour; its edges drawn solid, its middle dotted, as a ring's (#272).
// One thing in focus (#301): the tab says which — Rings its selected ring, Windows its selected window, the others neither; with All the rest show faded
{
  const start = await page.evaluate(() => { const t = window.dial_tool, h = [...document.querySelectorAll("#guide-list .guidehead")].find((e) => e.textContent.startsWith("Windows")); return [!!h && !h.hidden, t.S.gd_wins, t.S.gd_wsel, document.querySelector("#guide-windows-selected").classList.contains("on"), [...document.querySelectorAll("#guide-list .guidekind .name")].map((e) => e.textContent).includes("Window at 3")]; });
  // in a tab (0 Dial · 1 Rings · 3 Windows): the dotted middles drawn, "f" for a faded one
  const dotted = (n) => S(`(() => { const was = S.ui_section; S.ui_section = ${n}; t.draw(); const d = t.items.filter((i) => i.role === "guide" && i.dots).map((i) => (i.stroke[3] < 1 ? "f" : "d")).join(""); S.ui_section = was; t.draw(); return d; })()`);
  const sel = [await dotted(0), await dotted(1), await dotted(3)];
  await page.click("#guide-windows-all");
  const all = [await dotted(0), await dotted(1), await dotted(3)];
  await page.click("#guide-windows-none");
  const none = [await S("[S.gd_wins, S.gd_wsel]"), await dotted(3)];
  await page.click("#guide-windows-selected");
  const tones = await page.evaluate(() => { const on = (name) => [...document.querySelectorAll("#guide-list .guidekind")].find((e) => e.querySelector(".name").textContent === name).querySelector(".tone.on").title; return [on("Centre hole"), on("Window at 3")]; });
  check(start.every((x) => x === true || x === false) && start[0] && !start[1] && start[2] && start[3] && start[4] && sel.join() === ",d,d" && all.join() === "f,df,d" && !none[0][0] && !none[0][1] && none[1] === "" && tones[0] !== tones[1],
    `Windows: its heading with All · Selected · None (Selected to start), a line for the date window. The guides follow the tab (#301): Dial none, Rings the selected ring's, Windows the selected window's (${sel.map((x) => x || "–").join(" · ")}); with All the window's shows everywhere, faded out of its tab (${all.map((x) => x || "–").join(" · ")}); None takes it away; the first window's guide starts in a colour of its own (${tones[1]}; the centre hole's ${tones[0]})`);
}
// guides are connected to the rings (13 Oct 2026): each ring's edges in its own colour, different ones to start with; the row in the ring list is tinted with it
{
  const start = await page.evaluate(() => { const t = window.dial_tool, G = t.S.rings.map((r, i) => [r.guide, [...document.querySelectorAll("#guide-list .guidekind.ring")][i].querySelector(".tone.on").title]); return G; });
  await page.click("#guide-rings-all");      // all rings' guides, to see their colours (only the selected ring's to start since 15 Oct 2026)
  const strokes = await page.evaluate(() => { const t = window.dial_tool; t.draw(); return [...new Set(t.items.filter((i) => i.role === "guide").map((i) => i.stroke.map((v) => Math.round(v * 255)).join(",")))].length; });
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
  await enter_value("#guide-more-0-a", "45");
  await enter_value("#guide-more-1-r", "8");
  await frame();
  const added = await page.evaluate(() => { const t = window.dial_tool, lines = [...document.querySelectorAll("#guide-list .guidekind.added")]; return [t.S.gd_more.map((g) => g.kind).join(""), t.S.gd_more[0].a, t.S.gd_more[1].r, t.items.filter((i) => i.role === "guide").length, lines.length,
    lines.every((l) => Math.round(l.getBoundingClientRect().height) === 30 && l.querySelector(".dots > :first-child").classList.contains("remove") && !l.querySelector(".none")), lines.map((l) => l.querySelector(".name").scrollWidth <= l.querySelector(".name").clientWidth).join(" ")]; });
  await shot("4c20-guides");
  await page.click("#guide-more-1-remove");
  const left = await S("S.gd_more.map((g) => g.kind).join('')");
  await page.evaluate(() => { const t = window.dial_tool; t.S.gd_more = []; t.sync_rows(); t.render(); });
  check(added[0] === "012" && added[1] === 45 && added[2] === 8 && added[4] === 3 && left === "02", `Add: Line · Crosshair · Circle put a guide of that kind in the list, with its angle or radius, its colours and a way to remove it (${added[3]} guides drawn)`);
  check(added[5] && added[6] === "true true true", `an added guide is one line, 30 high: its name and values whole (${added[6]}), its colours, a cross in the none sign's place (#305, 4.45.3)`);
}
const list_look = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#guide-list")), on = getComputedStyle(document.querySelector("#guide-list .tone.on")); return [c.backgroundColor, parseFloat(c.borderTopLeftRadius), on.borderTopLeftRadius, on.boxShadow.split("rgb").length - 1]; });
check(list_look[0] === "rgb(20, 20, 19)" && list_look[1] >= 12 && list_look[2] === "50%" && list_look[3] === 3, "the list is near black and round; the chosen colour is a disc in a thick ring of its own colour");
await enter_value("#global-gd-w-Thickness", "3");
await page.click("#guide-gd_axes");
await frame();
check(await S("t.items.filter((i) => i.role === 'guide' && i.px === 3).length > 0 && !t.items.some((i) => i.role === 'guide' && i.path.d.length === 2)"), "Guides: thickness 3, and None on centre lines takes them off the preview");
check(await page.$eval("#guide-gd_axes", (e) => e.classList.contains("on")) && await page.$$eval('#guide-list .guidekind:has-text("Centre lines") .tone.on', (b) => b.length) === 0, "None wears the mark; no colour does");
await page.click('#guide-list .guidekind:has-text("Centre lines") .tone >> nth=3');
await frame();
check(await S("S.gd_axes === true && S.gd_k_axes === 3"), "pressing a colour shows that kind again, in that colour");
await page.click("#guide-gd_axes");
await page.click('#guide-list .guidekind:has-text("Centre hole") .tone >> nth=0');
await frame();
const names = await page.$$eval("#guide-list .guidekind .name", (n) => n.map((e) => e.textContent));
check(await S("S.gd_hole === true && S.gd_k_hole === 0") && !names.includes("Dial edge") && !names.includes("Window radii"), "a colour pressed is the centre hole's, the first of the eight; there is no dial edge nor window radii any more");
// the last line (#271): Thickness, its number with a compact plus and minus, a rule, then Reset All — on one line
{
  const last = await page.evaluate(() => { const r = (s) => document.querySelector("#guide-list .guidelast " + s).getBoundingClientRect(), a = r("label"), b = r(".numbox"), c = r("#guides-reset"), d = getComputedStyle(document.querySelector("#guide-list .resetall")); return [Math.abs((a.top + a.bottom) / 2 - (c.top + c.bottom) / 2) < 1 && Math.abs((b.top + b.bottom) / 2 - (c.top + c.bottom) / 2) < 1, a.right <= b.left && b.right <= c.left, d.borderLeftWidth, document.querySelector("#guides-reset").textContent, !!document.querySelector("#guide-list .guidelast .numbox .step")]; });
  check(last[0] && last[1] && last[2] === "1px" && last[3] === "Reset All" && last[4], `Thickness, its number with a compact plus and minus, a rule (${last[2]}) and Reset All stand on one line, in that order`);
  const foot = await page.evaluate(() => { const list = document.querySelector("#guide-list"), f = list.querySelector(".guidelast"), r = f.getBoundingClientRect(), l = list.getBoundingClientRect(), c = getComputedStyle(f), rule = list.querySelector(".resetall").getBoundingClientRect(), s = getComputedStyle(list.querySelector(".resetall"));
    list.scrollTop = list.scrollHeight; const r2 = f.getBoundingClientRect();
    return [c.backgroundColor, c.boxShadow, Math.round(r2.bottom - (l.bottom - 1)), Math.round(r.left - (l.left + 1)), Math.round((l.right - 1) - r.right), Math.round(rule.top - r.top), Math.round(r.bottom - rule.bottom), s.borderLeftColor, getComputedStyle(list).backgroundColor]; });
  check(foot[0] === "rgb(74, 74, 70)" && foot[1] === "none" && foot.slice(2, 7).every((v) => v === 0) && foot[7] === foot[8], `the bottom section (#305): filled with the line colour (${foot[0]}), no line over or under it, from edge to edge and down to the box's bottom; its rule the ground's colour, from its top to the bottom`);
  await page.click("#guide-list .guidelast label");
  const slider = await page.evaluate(() => { const e = document.querySelector("#value-pop"); return !!e && e.querySelector("label").textContent === "Thickness" && getComputedStyle(e.querySelector("input[type=range]")).display !== "none"; });
  await page.keyboard.press("Escape");
  check(slider && await page.$("#value-pop") === null && await page.isVisible("#guide-list"), "a press on Thickness opens its popup, its slider there (R15 form B, #271); Escape puts it away, the list stays");
}
await shot("4c-guides");
await page.click("#guides-reset");
{ // Reset All asks first (#271): the question in its line's place, round ✕ and ✓; ✕ keeps the guides, ✓ resets them
  const asked = await page.evaluate(() => { const q = document.querySelector("#guide-list .guidelast .ask"); return !!q && !q.hidden && q.textContent.includes("Reset all guides?") && [...q.querySelectorAll(".roundb")].every((b) => getComputedStyle(b).borderRadius === "50%"); });
  await page.click("#guides-reset-no");
  const kept = await S("S.gd_k_hole === 0 && S.gd_w === 3");
  await page.click("#guides-reset"); await page.click("#guides-reset-yes");
  check(asked && kept, "Reset All asks first, in its line's place: \"Reset all guides?\", round ✕ and ✓; ✕ keeps the guides as they are");
}
await frame();
check(await S("S.gd_axes === true && S.gd_k_axes === 0 && S.gd_hole === true && S.gd_k_hole === 1 && S.gd_rings === false && S.gd_sel === true && S.gd_wins === false && S.gd_wsel === true && S.gd_w === 1"), "Reset All: the guides as they start — centre hole cyan, centre lines pink, the selected ring's and the selected window's (Okay, 15–16 Oct 2026)");
// the centre hole's guide shows while the hole is being sized, even with the guides off, then goes (#267)
{
  await page.click("#guides");      // off
  const was = await S("S.dial_hole");
  await page.evaluate(() => window.dial_tool.set_value("global", "dial_hole", 3));
  await frame();
  const live = await S("t.items.filter((i) => i.role === 'guide').length");
  await page.waitForTimeout(1400);
  const after = await S("t.items.filter((i) => i.role === 'guide').length");
  await page.evaluate((v) => window.dial_tool.set_value("global", "dial_hole", v), was);
  await page.waitForTimeout(1400);
  await page.click("#guides");      // on again
  check(live === 1 && after === 0, `sizing the centre hole with the guides off: its guide alone shows (${live}), and is gone ${1.2} s after (${after})`);
}
await page.click("#guides");
await frame();
check(await S("!t.items.some((i) => i.role === 'guide')") && await page.isVisible("#guide-list"), "the Guides switch, off: none drawn; the list stays where it is");
await page.mouse.move(640, 30);
// the backdrop's colour as the browser spells a background (a labelled switch is filled with it: Okay, 15 Oct 2026, 07:07)
const FILL = `(() => { const h = getComputedStyle(document.querySelector("main")).getPropertyValue("--canvas-fill").trim().replace("#", ""); const n = (i) => parseInt(h.length === 3 ? h[i] + h[i] : h.slice(2 * i, 2 * i + 2), 16); return \`rgb(\${n(0)}, \${n(1)}, \${n(2)})\`; })()`;
const one_colour = await page.evaluate(`(() => { const c = (q) => getComputedStyle(document.querySelector(q)); return [c("#guides").color, c("#guides-more").color, c("#guides").borderTopColor, c("#guides").backgroundColor, c("#guides").borderTopStyle, document.querySelectorAll("#guides .slash, #guides .core-off").length, c("#guides").fontWeight, ${FILL}]; })()`);
check(one_colour[0] === one_colour[1] && /0\.35\)$/.test(one_colour[2]) && one_colour[3] === one_colour[7] && one_colour[4] === "solid" && one_colour[5] === 0 && one_colour[6] === "400", `off, it is an outline filled with the backdrop's own colour (its words show); sign, word, arrow and line are one colour (${one_colour[0]}), the line at 0.35 of it (${one_colour[2]}); the sign is the one it has on, only fainter (Okay, 15 Oct 2026, 03:41)`);
{ // three states on the preview: can be pressed (faint) · can't (fainter) · on (Guides: its word alone whole)
  const o = (q) => page.$eval(q, (e) => getComputedStyle(e).opacity);
  const off = [await o("#guides .word"), await o("#guides svg"), await o("#backdrop span"), await o("#undo svg")];
  await page.click("#guides"); await page.mouse.move(640, 30);
  const on = [await o("#guides .word"), await o("#guides svg"), await page.$eval("#guides", (e) => getComputedStyle(e).borderTopColor)];
  await page.hover("#guides");
  const over = await page.$eval("#guides", (e) => getComputedStyle(e).borderTopColor);
  await page.click("#guides"); await page.mouse.move(640, 30);
  check(off.join() === "0.35,0.35,0.35,0.35" && on[0] === "1" && on[1] === "1" && /0\.35\)$/.test(on[2]) && over === one_colour[0], `on the preview a switch is faint (${off[0]}); Guides on: its sign and word whole (15 Oct 2026), its line still faint; under the pointer the line is whole`);
}
await page.mouse.click(640, 30);                      // the backdrop, off the dial
check(await page.isHidden("#guide-list"), "a press outside the list puts it away");
await page.click("#guides-more");
const looks = await page.evaluate(() => { const c = (q, p) => getComputedStyle(document.querySelector(q))[p]; return [c(".bar", "backgroundColor"), c(".bar", "color")]; });
const whites = await page.evaluate(() => [...document.querySelectorAll(".bar, .bar *:not(.rider)")].filter((e) => e.getClientRects().length).flatMap((e) => { const c = getComputedStyle(e); return [c.color, c.backgroundColor, c.borderTopColor].filter((v) => /^rgba?\((2[3-5]\d), (2[3-5]\d), (2[3-5]\d)/.test(v)).map((v) => (e.id || e.className.baseVal || e.className) + " " + v); }));
check(looks[0] === "rgb(51, 51, 51)" && looks[1] === "rgb(115, 115, 115)" && whites.length === 0, `the bar is 80 % black, its light tone 55 % grey, nothing on it white but the speed riding over its thumb (Okay, 15 Oct 2026) and the play triangle (#282, its fill) ${whites.slice(0, 3).join(" · ")}`);
await page.mouse.move(900, 400);
const off_look = await page.evaluate(`(() => { const e = document.querySelector("#guides"), c = getComputedStyle(e); return [e.getAttribute("aria-pressed"), c.backgroundColor === ${FILL}, e.textContent, c.borderTopStyle]; })()`);
check(off_look[0] === "false" && off_look[1] && off_look[2] === "Guides" && off_look[3] === "solid", "off: filled with the backdrop's colour only, no dashes");
await shot("4c3-guides-off");
await page.click("#guides");
await page.click("#guides-more");
await page.mouse.move(900, 400);
check(await S("S.guides === true && S.ui_section === 0") && await page.isHidden("#guide-list") && await page.evaluate(`(() => { const e = document.querySelector("#guides"), c = getComputedStyle(e); return (c.backgroundColor === ${FILL}) + c.color + c.fontWeight + getComputedStyle(e.querySelector(".word")).opacity + e.querySelectorAll(".slash").length; })()`) === "truergb(17, 17, 17)40010", "pressed again it is on: still only the backdrop's fill; the word whole, not bolder (Okay, 14 Oct 2026, 23:05), the sign whole");
// the backdrop's colour: a switch at the preview's bottom left, showing the colour as a chip
const bd = await page.evaluate(() => { const b = document.querySelector("#backdrop").getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(), c = getComputedStyle(document.querySelector("#backdrop")); const sh = document.querySelector("#shadows").getBoundingClientRect(), unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit")); const g = document.querySelector("#guides").getBoundingClientRect(); return [Math.round(sh.left - m.left), Math.round(m.bottom - sh.bottom), c.borderTopStyle, getComputedStyle(document.querySelector("#backdrop .dot")).getPropertyValue("--c"), Math.round(b.left - m.left), Math.round(g.top - b.bottom - unit) + Math.round(sh.top - g.bottom - unit), Math.round(g.left - m.left)]; });
check(bd[0] === 12 && bd[1] === 12 && bd[4] === 12 && bd[5] === 0 && bd[6] === 12 && bd[2] === "solid" && bd[3].includes("204, 204, 199"), "the Shadows switch is 12 from the preview's bottom left, Guides a unit over it, the Backdrop switch a unit over that, solid-lined, its chip the backdrop's colour (4.59)");
await page.click("#backdrop");
check(await page.isVisible("#colour-pop") && await page.textContent("#colour-pop h2") === "Backdrop" && await page.$eval("#colour-pop", (e) => e.getBoundingClientRect().bottom <= innerHeight), "a press opens the colour pop-out for the backdrop, inside the window");
await page.click("#pop-as-HEX"); await enter_value("#pop-hex", "#808080");
check(await S("Math.round(S.c_backdrop[0] * 255) === 128") && (await page.$eval("#backdrop .dot", (e) => getComputedStyle(e).getPropertyValue("--c"))).includes("128, 128, 128"), "typing a colour there changes the backdrop and the chip");
await shot("4c6-backdrop-switch");
await page.click("#backdrop");
check(await page.isHidden("#colour-pop"), "pressed again, it closes");
await type_hex("global-c-backdrop-Backdrop", "#CCCCC7");
// its colour follows the backdrop
await type_hex("global-c-backdrop-Backdrop", "#1A1A1F");
await frame();
check(await page.evaluate(`(() => [...document.querySelectorAll("#guides, #backdrop")].every((e) => { const c = getComputedStyle(e); return c.backgroundColor === ${FILL} && c.color === "rgb(255, 255, 255)"; }))()`), "on a dark backdrop both switches are white outlines on the backdrop's own colour");
for (const grey of ["#808080", "#F2F2EE", "#141413", "#4B317F", "#C8E6A0", "#CC381A"]) { await type_hex("global-c-backdrop-Backdrop", grey); await frame(); await page.screenshot({ path: path.join(OUT, `4c5-guides-on-${grey.slice(1)}.png`), clip: { x: 1240, y: 0, width: 200, height: 60 } }); await page.click("#guides"); await page.mouse.move(640, 30); await frame(); await page.screenshot({ path: path.join(OUT, `4c5-guides-off-${grey.slice(1)}.png`), clip: { x: 1240, y: 0, width: 200, height: 60 } }); await page.screenshot({ path: path.join(OUT, `4c5-backdrop-${grey.slice(1)}.png`), clip: { x: 460, y: 790, width: 200, height: 60 } }); await page.click("#guides"); await page.mouse.move(640, 30); }
await shot("4c4-guides-dark");
await type_hex("global-c-backdrop-Backdrop", "#CCCCC7");
// the Dial section: two panes, Dial (diameter, plate, background) and Page (margin, backdrop); no Guides pane
check(JSON.stringify(await page.$$eval(".pinned .pane h2", (h) => h.map((x) => x.textContent))) === '["Dial","Page"]' && JSON.stringify(await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent))) === '["Colours","Reset"]' && await page.isVisible("#background-add"), "Dial has four panes (Reset last since 4.41.25): Dial and Page stay in view, Colours scrolls under them; Background is a button");
// units: a box at the panel's top right; lengths are shown and typed in the unit, kept in mm
// the unit box round its word's ink, 2 px all round and a line (#302): [word, width, height, from the column's end, the room
// between its line and its letters — top, bottom, left, right — counted on its own picture, in px (a canvas's measure of
// the ink is not trusted: it is what disagreed with the screen, 4.44.1)
const unit_box = async () => {
  await page.mouse.move(700, 500);
  const b = await (await page.$("#unit")).boundingBox(), png = await page.screenshot({ clip: { x: b.x - 2, y: b.y - 2, width: b.width + 4, height: b.height + 4 } });
  const room = await page.evaluate(async (src) => {
    const img = new Image(); img.src = "data:image/png;base64," + src; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, bg = d[0], ink = (i, j) => d[(j * W + i) * 4] < bg - 30;
    const rows = [], cols = [];      // the line: rows and columns mostly ink
    for (let j = 0; j < H; j++) { let n = 0; for (let i = 0; i < W; i++) n += ink(i, j); if (n > W * 0.6) rows.push(j); }
    for (let i = 0; i < W; i++) { let n = 0; for (let j = 0; j < H; j++) n += ink(i, j); if (n > H * 0.6) cols.push(i); }
    const top = Math.max(...rows.filter((j) => j < H / 2)) + 1, bottom = Math.min(...rows.filter((j) => j > H / 2)) - 1, left = Math.max(...cols.filter((i) => i < W / 2)) + 1, right = Math.min(...cols.filter((i) => i > W / 2)) - 1;
    let t = Infinity, u = -1, l = Infinity, r = -1;
    for (let j = top; j <= bottom; j++) for (let i = left; i <= right; i++) if (ink(i, j)) { t = Math.min(t, j); u = Math.max(u, j); l = Math.min(l, i); r = Math.max(r, i); }
    return [t - top, bottom - u, l - left, right - r].map((v) => v / devicePixelRatio);
  }, png.toString("base64"));
  return page.$eval("#unit", (e, room) => { const r = e.getBoundingClientRect(), row = document.querySelector(".form .row").getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height), Math.round(row.right - r.right), room]; }, room);
};
const as_mm = await unit_box();
check(as_mm[0] === "mm" && as_mm[3] === 0 && await page.isHidden("#unit-menu"), "the unit box says mm and ends on the panel's last column");
await page.click("#unit");
check(JSON.stringify(await page.$$eval("#unit-menu button span:first-child", (b) => b.map((x) => x.textContent))) === '["Millimetres","Points","Inches","Lignes","Thou"]', "its menu: millimetres, points, inches, lignes, thou (#299)");
await page.click("#unit-in");
const as_in = await unit_box();
check(as_in[0] === "in" && as_mm[4].every((v) => v >= 3.5 && v <= 4.5) && as_in[2] === as_mm[2] && as_in[4].every((v) => v >= 2) && await page.isHidden("#unit-menu"), `Inches: the box says in; mm's box stands 4 px round its letters, to a screen dot, counted on its picture (top · bottom · left · right: ${as_mm[4].join(" · ")}); every unit's box mm's height, its own width (in: ${as_in[1]} × ${as_in[2]}, its dot ${as_in[4][0]} from the top; #302, 4.44.4)`);
check(await page.inputValue("#global-dial-d-Diameter") === "1.181" && await S("S.dial_d") === 30, "a 30 mm diameter shows as 1.181; the setting is still 30");
await enter_value("#global-dial-d-Diameter", "1.5");
check(near(await S("S.dial_d"), 38.1, 1e-6), "1.5 typed in inches is 38.1 mm");
await page.click("#unit"); await page.click("#unit-pt");
check(await page.inputValue("#global-dial-d-Diameter") === "108.0", "in points it reads 108.0");
await shot("4b-units");
await page.click("#unit"); await page.mouse.click(640, 30);
check(await page.isHidden("#unit-menu"), "a press outside the menu puts it away");
await page.click("#unit");
check(await page.evaluate(() => { const b = document.querySelector("#unit-menu button:last-child").getBoundingClientRect(), hit = document.elementFromPoint(b.right - 8, b.top + b.height / 2); return !!hit && !!hit.closest("#unit-menu"); }), "the unit menu stands over the rows under it: its last line (Thou) is pressed, not a row's minus or plus (Okay, 16 Oct 2026: \"Thou falls under\")");
await page.mouse.click(640, 30);
await page.click("#unit"); await page.click("#unit-mm");
await enter_value("#global-dial-d-Diameter", "30");
// scale everything with the diameter: off, the rings stay; on, every measure follows, and comes back
const measures = () => S("[S.rings[0].r, S.rings[0].size, S.rings[1].len, S.ha_hour.len, S.ha_cap, S.rings[0].count, S.margin]");
const at_30 = await measures();
await enter_value("#global-dial-d-Diameter", "36");
check(JSON.stringify(await measures()) === JSON.stringify(at_30), "the diameter alone leaves rings and hands where they are");
await enter_value("#global-dial-d-Diameter", "30");
await page.check("#global-ui-scale-Scale-everything-with-it");
await enter_value("#global-dial-d-Diameter", "36");
const at_36 = await measures();
check(at_36.slice(0, 5).every((v, i) => near(v, at_30[i] * 1.2, 1e-4)) && at_36[5] === at_30[5] && at_36[6] === at_30[6], `with "scale everything" ticked, 30 → 36 makes radii, sizes, lengths and the cap 1.2× (count and margin stay)`);
await shot("4d-scaled");
for (const d of ["41.3", "22", "30"]) { await enter_value("#global-dial-d-Diameter", d); }
check(JSON.stringify(await measures()) === JSON.stringify(at_30), "36 → 41.3 → 22 → 30: everything is back exactly where it was");
await page.uncheck("#global-ui-scale-Scale-everything-with-it");
check(await page.evaluate(() => Math.round(document.querySelector(".row.nest .check").getBoundingClientRect().left) === Math.round(document.querySelector(".row.num input[type=range]").getBoundingClientRect().left)), "a nested question starts on the controls' column");
check(await S("!('ui_scale' in G_lean(S))".replace("G_lean(S)", "JSON.parse(JSON.stringify(S, (k, v) => (k.startsWith('ui_') ? undefined : v)))")), "the tick is the window's state, not the dial's");
// Colours: every coloured part in one list
const listed = await page.$$eval(".colourlist .row label", (l) => l.map((x) => x.textContent));
check(listed.length === await S("S.rings.length + 4 + [S.da_on, ...S.windows.map((w) => w.on)].filter(Boolean).length") && listed.join().includes("Hour hand,Minute hand,Seconds hand,Cap"), `Colours lists every ring, the hands, the cap and the windows that are on (${listed.join(" · ")})`);
await page.click("#colour-hand-second");
check(await page.textContent("#colour-pop h2") === "Seconds hand", "a swatch in the list opens the pop-out for that part");
await page.click("#pop-as-HEX"); await enter_value("#pop-hex", "#39FF14");
check(JSON.stringify(await S("S.ha_second.c.slice(0, 3).map((v) => Math.round(v * 255))")) === "[57,255,20]", "and sets its colour");
await enter_value("#pop-hex", "#CC381A");
await page.click("#pop-close");
// a band's sectors, one colour each
await tab("Rings");
await page.click("#ring-add");
await page.click("#add-band");
check(await page.isHidden("#sectors-same"), "a band of one piece has no sector colours");
await page.selectOption("#ring-count-Count-menu", "6");
await enter_value("#ring-width-Band-width", "4");
await frame();
const band = await S("S.ui_ring");
check(await page.$$eval(`.form .colourlist .swatch[id^="colour-ring-${band}-sector"]`, (b) => b.length) === 6, "six sectors: Sector colours shows six swatches");
await page.click(`#colour-ring-${band}-sector-1`);
check((await page.textContent("#colour-pop h2")).endsWith("sector 2"), "the second one opens the pop-out as “… · sector 2”");
check(await page.isVisible(".alpharow"), "a ring's colour has an opacity strip");
await enter_value("#pop-alpha", "50");
await frame();
check(await S(`S.rings[${band}].cs["1"][3] === 0.5`) && await page.$eval(".preview path[fill-opacity='0.5']", (e) => e !== null) && await page.inputValue("#pop-alpha") === "50%", "opacity 50: the sector is half see-through in the preview");
await enter_value("#pop-alpha", "100");
await enter_value("#pop-hex", "#0E2A47");
await page.click(`#colour-ring-${band}-sector-3`);
await enter_value("#pop-hex", "#0E2A47");
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
// two colours alternating (Okay, 15 Oct 2026, 11:13 and 11:32): an even count only
await page.click(`#colour-ring-${band}-alternate-2`);
await enter_value("#pop-hex", "#0E2A47"); await page.click("#pop-close");
await frame();
check(JSON.stringify(await S(`Object.keys(S.rings[${band}].cs)`)) === '["1","3","5"]' && (await S(`t.items.filter((i) => i.role === 'ring' && i.index === ${band}).length`)) === 2, "Alternate: the second colour takes sectors 2, 4, 6 — two shapes");
await page.selectOption("#ring-count-Count-menu", "5"); await frame();
check(await page.isHidden(`#colour-ring-${band}-alternate-1`), "an odd number of sectors: no Alternate");
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
for (const i of [0, 1, 2]) await page.click(`.form .pane:visible >> nth=${i} >> .fold`);
const folded_gaps = await gaps();
check(folded_gaps[1] === 42 && folded_gaps[2] === 42, `folded panes in a row are 42 apart, and so is the open one after them (${folded_gaps.join(", ")})`);
for (const i of [0, 1, 2]) await page.click(`.form .pane:visible >> nth=${i} >> .fold`);
await tab("Hands");
// Hands: Hour · Minute · Seconds are tabs on top of the pinned part; the panes below are about the chosen hand
const hand_tabs = await page.evaluate(() => { const p = document.querySelector(".pinned"), t = p.querySelector(".tabsbar"); return [p.firstElementChild.classList.contains("handsbar"), p.firstElementChild.nextElementSibling === t, [...t.querySelectorAll("button")].map((b) => b.textContent).join(" "), [...document.querySelectorAll(".form .pane h2")].map((h) => h.textContent).join(" · ")]; });
check(hand_tabs[0] && hand_tabs[1] && hand_tabs[2] === "Hour Minute Seconds", "All hands is the first pinned line, the hand tabs the second, right above the hand's panes");
const under_tab = (tab) => page.evaluate((tab) => { const box = document.querySelector(".form").firstElementChild, c = box.querySelector(".check").getBoundingClientRect(), t = document.querySelector(tab).getBoundingClientRect(), p = document.querySelector(".pinned").getBoundingClientRect();
  return (c.left - t.left).toFixed(1) + " " + (c.right - t.right).toFixed(1) + " " + (c.top - p.bottom).toFixed(1); }, tab);
const tick_up = await page.evaluate(() => { const box = document.querySelector(".form").firstElementChild, pane = box.nextElementSibling;
  return [box.classList.contains("showbox") && box.querySelector("input").id, box.textContent.trim(), pane.classList.contains("headless") && pane.querySelector(".fold").hidden && getComputedStyle(pane).borderTopWidth === "0px", getComputedStyle(box.querySelector(".check")).backgroundColor !== getComputedStyle(document.querySelector(".form")).backgroundColor, [...pane.querySelectorAll(".body .check")].every((c) => !c.checkVisibility())]; });      // (the cap's "Cap on this hand" waits there, hidden: #262)
await page.click("#hand-tab-0");
const show_under = [await under_tab("#hand-tab-0")];
await page.click("#hand-tab-2"); show_under.push(await under_tab("#hand-tab-2")); await page.click("#hand-tab-0");
// under the box a thin black line opens the hand's pane, from where the tabs start; the hand's box starts there too, its top on the first row's line (Okay, on 4.46.1: "Blue lines, align, black line, new black line, thin")
const opened = await page.evaluate(() => { const pane = document.querySelector(".form > .pane.headless"), c = getComputedStyle(pane), d = document.querySelector("#hand-detail").getBoundingClientRect(), t = document.querySelector(".tabsbar .segs").getBoundingClientRect(), rows = [...document.querySelectorAll(".form > .pane.headless .row.side:not([hidden])")], row = rows[0].getBoundingClientRect(), last = rows.at(-1).getBoundingClientRect(), box = document.querySelector(".form > .showbox > .check").getBoundingClientRect(), p = pane.getBoundingClientRect();
  return [c.backgroundImage.includes("linear-gradient") && c.backgroundSize.endsWith(" 1px"), (d.left - t.left).toFixed(1), (d.top - (row.top - 1)).toFixed(1), (d.bottom - last.bottom).toFixed(1), (p.top - box.bottom).toFixed(1) + "/" + (row.top - 1 - (p.top + 1)).toFixed(1)].join(" "); });      // over the line: from the box to its top edge; under it: from its foot to the first row's white line
check(/^true 0\.0 0\.0 0\.0 (\S+)\/\1$/.test(opened), `under the Show box a thin black line opens the hand's pane, as far under the box as the rows are under it (${opened.split(" ").at(-1)}); the hand's box starts where the tabs do, from the first row's line to the last row's foot (4.46.4: "Enlarge the preview to fit the area")`);
check(tick_up[0] === "hand-on-Show" && tick_up[1] === "Show" && tick_up[2] && tick_up[3] && tick_up[4] && show_under.every((u) => u === "0.0 0.0 0.0"), `the Show box (#261; 4.46.2): it grows down from the chosen tab, as wide as it, and goes with it (Hour, Seconds: ${show_under.join(" · ")}); a ground of its own, it holds Show; the hand's pane under it has no name line and no thick line`);
const pill_gaps = await page.$eval(".form .colour", (e) => { const r = e.getBoundingClientRect(), d = e.querySelector(".dot").getBoundingClientRect(), h = e.querySelector(".hex").getBoundingClientRect(), row = e.closest(".row").getBoundingClientRect();
  return { gaps: [d.left - r.left, h.left - d.right, r.right - h.right, d.top - r.top, r.bottom - d.bottom, r.top - row.top, row.bottom - r.bottom], dot: d.height, type: parseFloat(getComputedStyle(e).fontSize) }; });
check(pill_gaps.gaps.every((v) => Math.abs(v - 5.5) < 0.3) && pill_gaps.dot === pill_gaps.type, `a colour pill has one space seven times: beside, over and under its swatch, between swatch and hex, after the hex, from the pill to its row's two lines; the swatch is as high as the hex is set (${pill_gaps.gaps.map((v) => +v.toFixed(2)).join(" · ")}; ${pill_gaps.dot} = ${pill_gaps.type})`);
await page.click("#hand-tab-2");
check(await S("S.ui_hand === 2") && await page.$eval("#hand-tab-2", (e) => e.classList.contains("on")) && await page.$eval(".form .pane", (e) => e.classList.contains("headless")), "a tab chooses the hand; the tab names it, the pane under it has no name line (#261)");
{ // the cap is part of the seconds hand (#262, beta 4.43): its rows in the seconds hand's pane, no pane of its own;
  // with no seconds hand, "Cap on this hand" under the topmost hand's, off: then no cap is drawn until it is ticked
  const seen = () => page.evaluate(() => { const v = (q) => { const e = document.querySelector(q); return !!e && e.checkVisibility(); }, t = window.dial_tool;
    return [v('[id^="global-ha-cap-Cap"]'), v('[id^="global-c-cap"]'), v('[id^="global-ha-cap-top"]'), t.items.some((i) => i.role === "cap")]; });
  const panes = await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent));
  const second = await seen();
  await page.click("#hand-tab-0");
  const hour = await seen();
  await page.evaluate(() => { const t = window.dial_tool; t.S.ha_second.on = false; t.sync_rows(); t.render(); });
  await page.click("#hand-tab-1"); await frame();
  const none = await seen();
  await page.click('[id^="global-ha-cap-top"]'); await frame();
  const asked = await seen();
  await page.evaluate(() => { const t = window.dial_tool; t.S.ha_second.on = true; t.S.ha_cap_top = false; t.sync_rows(); t.render(); });
  check(!panes.includes("Cap") && second.join() === "true,true,false,true" && hour.join() === "false,false,false,true" && none.join() === "false,false,true,false" && asked.join() === "true,true,true,true",
    `the cap's size and colour stand in the seconds hand's pane (no Cap pane), not in the hour hand's; with no seconds hand the minute hand's pane offers "Cap on this hand", off, and the cap is drawn only once it is ticked (${[second, hour, none, asked].map((x) => x.map(Number).join("")).join(" · ")})`);
}
await page.click("#hand-tab-0");
{
  const strip = await page.evaluate(() => { const tabs = [...document.querySelectorAll(".tabsbar .segs > button")], r = (e) => e.getBoundingClientRect(), p = r(document.querySelector(".pinned")), c = getComputedStyle(tabs[0]), v = (b) => getComputedStyle(b, "::before");
    const cut = (b) => getComputedStyle(b, "::before").clipPath.replace(/calc\(|\)/g, "");      // the tab's shape: its cut corners
    return { touch: tabs.every((b, i) => !i || Math.abs(r(b).left - r(tabs[i - 1]).right) <= 1), on_line: Math.round(p.bottom - r(tabs[0]).bottom), line: getComputedStyle(document.querySelector(".pinned")).borderBottomWidth, round: [c.borderTopLeftRadius, getComputedStyle(tabs.at(-1)).borderTopRightRadius].join(" "), notch: [cut(tabs[0]).startsWith("polygon(0px 0px, 100%") && !cut(tabs[0]).includes("5.5px"), cut(tabs[1]).startsWith("polygon(5.5px 0px, 100% - 5.5px 0px, 100% 5.5px"), cut(tabs[2]).startsWith("polygon(5.5px 0px, 100% 0px, 100% 0px"), getComputedStyle(tabs[0], "::after").backgroundColor].join(" "), high: Math.round(r(tabs[0]).height) }; });
  check(strip.touch && strip.on_line === 2 && strip.line === "2px" && strip.round === "0px 0px" && strip.notch === "true true true rgb(17, 17, 17)" && strip.high === 40, `the hand tabs are tabs: touching, on a thick line, each cutting its top corners one unit deep so a sharp V stands over each joint, the first and last corner square, the chosen one ink and square (#260, 4.46) (${strip.notch}), ${strip.high} high`);
}
{ // a hand's pane (13 Oct 2026): a box with the hand itself at the left, its rows beside it: a line of tiles that opens, numbers, colour
  const look = () => page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), box = r("#hand-detail"), rows = [...document.querySelectorAll(".form .pane .body")][0].querySelectorAll(".row.side:not([hidden])"), first = rows[0].getBoundingClientRect(), last = rows[rows.length - 1].getBoundingClientRect(), tiles = [...document.querySelectorAll(".row.thumbs > .picks.thumbs > *")].filter((e) => e.offsetParent).map((e) => e.title);
    return { beside: Math.round(first.left - box.right), top: Math.round(box.top - first.top), bottom: Math.round(last.bottom - box.bottom), high: Math.round(box.height), tiles: tiles.join(" "), panes: [...document.querySelectorAll(".form .pane h2")].filter((h) => h.checkVisibility()).map((h) => h.textContent).join(" · "), d: document.querySelector("#hand-detail .upright path").getAttribute("d"), centre: document.querySelectorAll("#hand-detail .upright .axis, #hand-detail .upright .pivot").length, one_line: [...rows].every((e) => e.getBoundingClientRect().height < 90) }; });
  const a = await look();
  check(a.beside === 12 && a.top === -1 && a.bottom === 0 && a.panes === "" && a.centre === 2, `a hand has one pane: at the left a box with the hand itself, its centre marked, as high as the rows beside it (${JSON.stringify({ ...a, d: 0 })})`);      // top −1: its line on the first row's (4.46.2; 6 below it until then)
  // its shapes: a row of thumbs under the box and every row beside it, from the box's left to the end, one line, the SVG tile last (4.46.4; Okay: "Put hand type as a row spanning preview to end, after wall")
  const thumbs = await page.evaluate(() => { const r = (e) => e.getBoundingClientRect(), box = r(document.querySelector("#hand-detail")), rows = [...document.querySelectorAll(".form .row.side:not([hidden])")].map(r), t = [...document.querySelectorAll(".row.thumbs > .picks.thumbs > *")].map(r), end = Math.max(...rows.map((x) => x.right));
    return [t.length, t.every((x) => x.top >= box.bottom && x.top >= Math.max(...rows.map((y) => y.bottom)) && x.height > x.width), new Set(t.map((x) => Math.round(x.top))).size, Math.abs(t[0].left - box.left).toFixed(1) + " " + Math.abs(t.at(-1).right - end).toFixed(1), [...document.querySelectorAll(".row.thumbs .pickt > span")].every((e) => !e.checkVisibility()),
      (() => { const row = document.querySelector(".row.thumbs"), c = getComputedStyle(row); return [c.borderTopColor, c.borderBottomColor].every((x) => x === "rgb(17, 17, 17)") && c.borderTopWidth === "1px" && Math.abs(r(row).top - box.bottom - parseFloat(getComputedStyle(row.querySelector(".picks")).paddingTop)) < 0.5; })()]; });
  check(a.tiles.startsWith("baton pencil sword") && a.tiles.includes("disc") && a.tiles.endsWith("not built yet") && thumbs[0] === 11 && thumbs[1] && thumbs[2] === 1 && thumbs[3] === "0.0 0.0" && thumbs[4] && thumbs[5],
    `a hand's shapes are a row of upright thumbs without words under the box and its rows, every one (${thumbs[0]}, the disc and the SVG tile among them) on one line from the box's left to the end (${thumbs[3]}), between two thin black lines, the first two units under the box's foot, the same space as round them (4.46.5: "THERE'S A SPACE. THEN COMES BLACK LINE")`);
  await page.click("#hand-shape-Shape-7");
  const b = await look();
  const box_high = await page.$eval("#hand-detail", (e) => Math.round(e.getBoundingClientRect().height));
  check(b.d !== a.d && b.top === -1 && b.bottom === 0 && box_high > a.high && await page.$eval("#hand-shape-Shape-7", (e) => e.classList.contains("on")), `a thumb pressed (breguet) is chosen and the box shows it; with its three more rows the box grows to their height (${a.high} → ${box_high})`);
  await page.click("#hand-shape-Shape-0");
  { // pointing at a hand's number lights its part on the picture (4.70, #329; Okay's notes 2: "hovering a row lights its part on the hand's picture at the left"): the length its tip, the width its edges, a counterweight at 0 where it would be; in the selected guide's colour; gone when the pointer leaves
    const lit = async (name) => { await page.hover(`.form .row.side:not([hidden]):has(label:has-text("${name}"))`); await page.waitForTimeout(80);
      return page.evaluate(() => { const p = document.querySelector("#hand-detail .upright .lit"); if (!p.getAttribute("d")) return null; const b = p.getBBox(); return [+b.y.toFixed(2), +b.height.toFixed(2), +b.width.toFixed(2), getComputedStyle(p).fill]; }); };
    const len = await lit("Length"), wide = await lit("Width"), counter = await lit("Counter"), tone = await page.evaluate(() => { const t = window.dial_tool; return window.getComputedStyle(document.querySelector("#hand-detail")).getPropertyValue("--lit").trim().toUpperCase() === ["#FF2D95", "#00E5FF", "#39FF14", "#FFE600", "#FF6A00", "#7A5CFF", "#111111", "#FFFFFF"][t.S.gd_k_sel]; });
    await page.mouse.move(5, 5); await page.waitForTimeout(80);
    const gone = await page.evaluate(() => !document.querySelector("#hand-detail .lit").getAttribute("d"));
    check(len && wide && counter && wide[1] > len[1] && len[2] <= wide[2] + 0.01 && tone && gone, `pointing at a hand's number lights its part in the selected guide's colour: the length a band at the tip (${len}), the width the edges along it (${wide}), a counterweight at 0 where it would come (${counter}); gone when the pointer leaves`);
  }
  { // handles on the hand's picture (4.71, #345; Okay's notes 2: "draggable dots at the extremes of what can be edited, a dotted bounding box like Photoshop's transform; one side's width drag edits the other symmetrically"): a dotted box round the hand, a square at each side's middle; the tip's drags the length, an edge's the width by twice its travel, the tail's the tail; a disc hand has no tail handle
    const grips = () => page.evaluate(() => [...document.querySelectorAll("#hand-detail .grips .handle")].map((g) => { const r = g.querySelector("rect").getBoundingClientRect(); return [g.dataset.grip, r.left + r.width / 2, r.top + r.height / 2]; }));
    const scale = () => page.evaluate(() => [...document.querySelectorAll("#hand-detail svg:not(.grips)")].find((v) => v.getBoundingClientRect().width > 0).getScreenCTM().a);
    const was = await page.evaluate(() => { const h = window.dial_tool.hand(); return [h.len, h.w, h.tail]; });
    const drag = async (name, mm_x, mm_y) => { const k = await scale(), g = (await grips()).find((x) => x[0] === name); await page.mouse.move(g[1], g[2]); await page.mouse.down(); await page.mouse.move(g[1] + mm_x * k / 2, g[2] + mm_y * k / 2, { steps: 3 }); await page.mouse.move(g[1] + mm_x * k, g[2] + mm_y * k, { steps: 3 }); await page.mouse.up(); await frame(); };
    const names = (await grips()).map((g) => g[0]).join(), frame_dash = await page.$eval("#hand-detail .grips .frame", (r) => getComputedStyle(r).strokeDasharray !== "none");
    await drag("len", 0, -1); const len = await S("S.ha_hour.len");
    await drag("w2", 0.2, 0); const w = await S("S.ha_hour.w");
    await drag("tail", 0, 0.5); const tail = await S("S.ha_hour.tail");
    await page.click("#hand-shape-Shape-10"); await frame();
    const disc = (await grips()).map((g) => g[0]).join();
    await page.click("#hand-shape-Shape-0"); await frame();
    await page.evaluate((v) => { const t = window.dial_tool; t.set_value("hand", "len", v[0]); t.set_value("hand", "w", v[1]); t.set_value("hand", "tail", v[2]); }, was);
    check(names === "len,tail,w1,w2" && frame_dash && Math.abs(len - was[0] - 1) < 0.11 && Math.abs(w - was[1] - 0.4) < 0.03 && Math.abs(tail - was[2] - 0.5) < 0.11 && disc === "len,w1,w2",
      `the hand's picture has a dotted box and four handles (${names}); dragged, the tip sets the length (${was[0]} → ${len}, a mm out), an edge the width by twice its travel (${was[1]} → ${w}, 0.2 mm out), the tail the tail (${was[2]} → ${tail}); a disc hand: ${disc}`);
  }
  // the one number box beside a hand's box (4.64; Okay, 18 Oct 2026, 21:20: "This version of boxes win … these replace
  // all … Number box touches minus box"; the quiet number with its tiny ± of 4.45.1–4.63 retired): the value's box, then
  // − and + in theirs, touching, the hairline of the rule's grey; + steps it; the name opens the controller
  const len = await S("S.ha_hour.len");
  const nb = await page.evaluate(() => { const box = document.querySelector(".row.side .numbox"), f = box.querySelector("input"), st = [...box.querySelectorAll(".step")], r = (e) => e.getBoundingClientRect(), c = getComputedStyle(f);
    return [st.length, Math.abs(r(f).right - r(st[0]).left) < 0.5 && Math.abs(r(st[0]).right - r(st[1]).left) < 0.5, c.borderTopWidth, c.borderTopColor, st.every((b) => b.querySelector("svg") !== null), !f.readOnly, Math.round(r(box).width)]; });
  await page.click(".row.side .numbox .step >> nth=1");
  const stepped = await S("S.ha_hour.len");
  await page.click("label[for='hand-len-Length']");
  const popped = await page.evaluate(() => { const e = document.querySelector("#value-pop"); return !!e && e.querySelector("label").textContent === "Length" && getComputedStyle(e.querySelector("input[type=range]")).display !== "none"; });
  await page.keyboard.press("Escape"); await page.evaluate(() => window.dial_tool.value_pop_close());
  await page.evaluate((v) => window.dial_tool.set_value("hand", "len", v), len);
  check(nb[0] === 2 && nb[1] && nb[2] === "1px" && nb[3] === "rgb(185, 185, 180)" && nb[4] && nb[5] && near(stepped - len, 0.05, 1e-6) && popped,
    `beside a hand's box the one number box: the value, − and + touching, a hairline of the rule's grey, drawn signs, typed in place (${nb.join(" ")}); + steps it; the name opens the controller (4.64)`);
}
{ // a disc's marker: Hole or Mark, its rows named by the choice; Mark brings its colour (#300, 4.45.4)
  const was = await S("JSON.stringify(S.ha_hour)");
  await page.evaluate(() => { const t = window.dial_tool; t.S.ui_hand = 0; t.S.ha_hour.shape = 10; t.static_dirty = true; t.sync_rows(); t.render(); });
  const names = () => page.evaluate(() => [...document.querySelectorAll(".row.side")].filter((r) => r.offsetParent).map((r) => r.querySelector("label .whole")?.textContent || r.querySelector("label")?.textContent).join(" · "));
  const hole = await names();
  await page.click("#hand-mark-as-Marker-1");
  const mark = await names(), as = await S("S.ha_hour.mark_as");
  await page.evaluate((h) => { const t = window.dial_tool; t.S.ha_hour = JSON.parse(h); t.static_dirty = true; t.sync_rows(); t.render(); }, was);
  check(hole.includes("Marker · Hole · Hole length · Hole width · ") && hole.includes("Inside the disc · Round ends") && mark.includes("Marker · Mark · Mark length · Mark width · Mark ink · ") && as === 1,
    `a disc's marker is a Hole or a Mark; its rows say which (${mark.split(" · ").slice(3, 8).join(" · ")}), and a mark has its colour (#300)`);
}
{ // one line through the top: the middle of the title's small letters, undo and Guides; the unit box's and the Gallery pill's words on the title's baseline, as Help's are (Okay, 16 Oct 2026, #285: "same baseline")
  const line = await page.evaluate(() => { const mid = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return r.top + r.height / 2; }, h = document.querySelector("h1");
    const base_of = (e) => { const probe = document.createElement("span"); probe.style.cssText = "display:inline-block;width:0;height:0"; e.append(probe); const y = probe.getBoundingClientRect().top; probe.remove(); return y; };
    const base = base_of(h), c = getComputedStyle(h), pen = document.createElement("canvas").getContext("2d"); pen.font = `${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
    return { mids: [base - pen.measureText("x").actualBoundingBoxAscent / 2, mid("#undo"), mid("#tiny-open")], bases: [base, base_of(document.querySelector(".mast .help")), base_of(document.querySelector("#unit")), base_of(document.querySelector("#to-gallery"))] }; });
  check(line.mids.every((y) => Math.abs(y - line.mids[0]) < 0.6) && line.bases.every((y) => Math.abs(y - line.bases[0]) < 0.6), `the title's small letters, undo and the Tiny Preview's eye are centred on one line (${line.mids.map((y) => +y.toFixed(1)).join(" · ")}); Help's, the unit box's and the Gallery pill's words stand on the title's baseline (${line.bases.map((y) => +y.toFixed(1)).join(" · ")})`);
}
{ // the line between All hands and the hand tabs starts and ends where the tabs do (Okay, 16 Oct 2026, #260)
  await tab("Hands");
  const l = await page.evaluate(() => { const bar = document.querySelector(".handsbar + .tabsbar"), b = bar.getBoundingClientRect(), tabs = [...bar.querySelectorAll(".tab")].map((t) => t.getBoundingClientRect()), size = getComputedStyle(bar).backgroundSize;
    const cut = parseFloat((size.match(/100% - ([\d.]+)px/) || [])[1]);
    return { line: [+(b.left + cut).toFixed(1), +b.right.toFixed(1)], tabs: [+tabs[0].left.toFixed(1), +tabs.at(-1).right.toFixed(1)], border: getComputedStyle(bar).borderTopColor }; });
  check(Math.abs(l.line[0] - l.tabs[0]) < 0.6 && Math.abs(l.line[1] - l.tabs[1]) < 0.6 && l.border === "rgba(0, 0, 0, 0)", `the line under All hands runs where the tabs run (${l.line.join("–")} · ${l.tabs.join("–")})`);
}
await shot("4g-hand-tabs");
{ // 10:10 stands on its own thick line, its middle bottom on the line's top (Okay, 15 Oct 2026, 00:51; over the bar, clear of the ruler, before)
  const p = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), pill = r(".steps12 .special"), line = r(".ruler .pose");
    return [Math.round((line.top - pill.bottom) * 10) / 10, Math.round((pill.left + pill.width / 2 - (line.left + line.width / 2)) * 10) / 10, getComputedStyle(document.querySelector(".ruler .pose")).strokeWidth, document.elementFromPoint(pill.left + pill.width / 2, pill.top + pill.height / 2).textContent]; });
  check(Math.abs(p[0]) <= 0.5 && Math.abs(p[1]) <= 1 && p[2] === "3px" && p[3] === "10:10", `10:10 sits on its thick line (gap ${p[0]}, off its middle ${p[1]}, line ${p[2]} wide), and can be pressed there`);
}
// Windows: four cards, 12 · 3 · 6 · 9, are the tabs; Show this window is on the heading line, also when the pane is folded
await tab("Date");
const cards = await page.$$eval(".windowcards .card > button:first-child", (b) => b.map((x) => [x.id, x.textContent, x.classList.contains("on"), Math.round(x.getBoundingClientRect().width)]));
check(cards.map((c) => c[1]).join("") === "" && cards.map((c) => c[0]).join(" ") === "window-card-1 window-card-0 window-card-2 window-card-3" && cards[1][2] && await page.$$eval(".cardswitch", (e) => e.length) === 0 && await page.evaluate(() => Math.round(document.querySelector(".windowcards .card").getBoundingClientRect().left) === Math.round(document.querySelector(".form .pane .row > :first-child").getBoundingClientRect().left)), `four cards, pictures only, starting where the labels start: 12 · 3 · 6 · 9; the date window of old is the one at 3, and chosen (${cards[0][3]} wide)`);
// a window's shape is its own: rectangle · circle · polygon · arch · arc; it can turn with its radius; its own font; three colours
{
  const was = await S("JSON.stringify([S.ui_window, S.da_on, S.da_at, S.da_shape, S.da_turn, S.da_ps, S.da_family, S.da_text_c, S.da_disc_c, S.da_w])");
  await page.evaluate(() => { const t = window.dial_tool; t.S.ui_window = 0; t.set_value("window", "on", true); t.sync_rows(); });
  const tiles = await page.$$eval('[id^="window-shape-"]', (b) => b.map((x) => [x.title, x.classList.contains("on")]));
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
    `Shape: five buttons, a date window starts as a rectangle (${rect.join(" × ")}); circle ${circle[0].join(" × ")}, polygon with Sides and Corner, arc ${arc[0].join(" × ")} (no turning), arch ${arch.join(" × ")}`);
  { // a window's place (#264, 4.46.1): on its pane's heading line, round buttons 3 · 6 · 9 · 12 · ··· spread from the
    // controls' column to the end, as the shapes on the Shape line are; the heading says Position under its title;
    // the dots open every place as a button and a field for any time
    const line = await page.evaluate(() => { const r = (e) => e.getBoundingClientRect(), b = [...document.querySelectorAll(".pane > .circles button")], s = [...document.querySelectorAll(".pane > .btnline.shapes button")], w = b.map((x) => r(x).width), pane = b[0].closest(".pane"), sub = pane.querySelector(".fold .sub"), h2 = pane.querySelector(".fold h2"), eye = pane.querySelector(".fold .eye");
      const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit")), gaps = b.slice(1).map((x, i) => r(x).left - r(b[i]).right);
      return [b.map((x) => x.textContent).join(" "), w.every((v) => Math.abs(v - w[0]) < 0.5 && Math.abs(v - r(b[0]).height) < 0.5) && getComputedStyle(b[0]).borderTopLeftRadius === "50%" && gaps.every((g) => Math.abs(g - unit) < 0.5), Math.round(r(b[0]).left - r(s[0]).left) + " " + Math.round(r(b.at(-1)).right - r(s.at(-1)).right), s[0].closest(".pane").querySelector("h2").textContent, Math.round(r(b[0]).height),
        String(!sub) + " " + (Math.abs((r(eye).top + r(eye).bottom) / 2 - (r(h2).top + r(h2).bottom) / 2) < 2), Math.abs(r(s[0]).height - r(b[0]).height) < 0.5]; });
    const before = await S("[S.da_at, S.da_at_deg]");
    await page.click("#window-at-more");
    const open = await page.isVisible("#window-at-time"), places = await page.$$eval("#value-pop .places button", (b) => b.map((x) => x.textContent).join(" "));
    await enter_value("#window-at-time", "2:15");
    const own = [await S("S.da_at_deg"), await page.textContent("#window-at-more"), await page.textContent(".form .pane h2"), await page.$$eval(".circles button.on", (b) => b.map((x) => x.id).join())];
    await page.click("#window-at-more"); await enter_value("#window-at-time", "4:30");
    const named = await S("[S.da_at, S.da_at_deg]");
    await page.click("#window-at-more"); await page.click("#window-at-place-7");      // 10:30, a button in the popup
    const placed = [await S("[S.da_at, S.da_at_deg]"), await page.$("#value-pop"), await page.textContent("#window-at-more")];
    await page.click("#window-at-Position-" + before[0]);
    check(line[0] === "3 6 9 12 4 ···" && line[1] && line[2] === "0 0" && line[3] === "Shape" && line[4] >= 36 && line[5] === "true true" && line[6], `a window's place: six round buttons on its heading's line, a unit apart, as large as their share of the line (${line[4]} across), from the same column to the same end as the shapes on the Shape line (${line[2]}), which are as high; no "Position" under the title (4.46.4: "Delete position name"), the eye level with the title (#264; 4.46.2: "add 4… scale up circles")`);
    // both headings that carry controls: a unit over and under them, the heading as high as that; the title where every heading has it
    const heads = await page.evaluate(() => { const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit")), r = (e) => e.getBoundingClientRect();
      const gap = (pane) => { const p = r(pane), b = parseFloat(getComputedStyle(pane).borderTopWidth); return +(r(pane.querySelector(".fold h2")).top - p.top - b).toFixed(1); };
      const room = (pane, q) => { const p = r(pane), b = parseFloat(getComputedStyle(pane).borderTopWidth), c = r(pane.querySelector(q)), body = r(pane.querySelector(".body")); return [c.top - p.top - b, body.top - c.bottom].every((v) => Math.abs(v - unit) < 0.5); };
      const win = document.querySelector(".pane > .circles").closest(".pane"), shape = document.querySelector(".pane > .btnline.shapes").closest(".pane"), plain = [...document.querySelectorAll(".form .pane")].find((p) => !p.querySelector(":scope > .headcontrol") && !p.classList.contains("headless"));
      return [gap(win), gap(shape), plain ? gap(plain) : null, room(win, ":scope > .circles"), room(shape, ":scope > .btnline.shapes")]; });
    check(heads[0] === heads[1] && heads[3] && heads[4], `a heading with controls on its line gives them a unit over and under and grows to hold them; its title keeps the same gap over it on both (${heads[0]} · ${heads[1]}) (4.46.2)`);
    check(open && places === "12 1:30 3 4 4:30 6 7:30 9 10:30" && own[0] === 67.5 && own[1] === "2:15" && own[2] === "Window at 2:15" && own[3] === "window-at-more" && named[0] === 1 && named[1] === null && placed[0][0] === 7 && placed[0][1] === null && placed[1] === null && placed[2] === "10:30" && await S("S.da_at_deg === null"),
      `the dots open every place as a button (${places}) and a field for any time: 2:15 puts the window at 67.5°, and the dots say so; a named time typed (4:30) is that place; a place pressed (10:30) is taken and the popup goes`);
  }
  // turned with its radius at 4: 30°; the text with it or level
  await page.click("#window-at-more"); await page.click("#window-at-place-8");      // 4 o'clock: the ninth in the list (R9), a button in the dots' popup
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
    await enter_value("#window-tracking-Tracking", "40");
    await page.click("#window-lang"); await page.click("#window-lang-tr");
    check(before && await S("S.da_tracking === 40 && S.da_lang === 1 && S.rings.find((r) => r.kind === 2).tracking === 0") && await page.textContent("#window-lang") === "TR", "a window has tracking and a language of its own, in its font box; the numerals keep theirs");
  }
  { // every font box has all of it (beta 4.30): a window's box has the variable axes and the OpenType features too, and both can be put away
    await page.waitForFunction(() => document.querySelector("#window-axis-wght"), null, { timeout: 8000 }).catch(() => {});
    const ring_before = await S("JSON.stringify(S.rings.find((r) => r.kind === 2).axes)");
    await enter_value("#window-axis-wght", "600");
    check(await page.isHidden(".fontbox .features"), "the OpenType features are put away until asked for");
    await page.click('.fontbox .partfold:has-text("OpenType")');
    const tile = await page.$("#window-feature-tnum") ? "tnum" : await page.$eval(".boxpart .features .tile", (e) => e.dataset.tag);
    await page.click("#window-feature-" + tile);
    check(await S("S.da_axes.wght === 600") && await S(`S.da_features && Object.keys(S.da_features)[0] === '${tile}'`) && await S("JSON.stringify(S.rings.find((r) => r.kind === 2).axes)") === ring_before, `a window's font box has its own variable axes and OpenType features (weight 600, ${tile}); the numerals keep theirs`);
    const heads = await page.$$eval(".fontbox .partfold", (b) => b.filter((e) => e.offsetParent).map((e) => e.querySelector("span").textContent).join(" · "));
    const many = await page.$eval(".fontbox .partfold .many", (e) => +e.textContent === document.querySelectorAll(".fontbox .features .tile").length && +e.textContent > 0);
    await page.click(".fontbox .partfold >> nth=0");
    const shut = await page.isHidden(".fontbox .features");
    await page.click(".fontbox .partfold >> nth=0");
    const tag = await page.$eval(".fontbox .features .tile", (e) => { const s = e.querySelector(".sticker"), c = getComputedStyle(s); return [s.textContent === e.dataset.tag, c.fontSize, c.fontFamily.includes("Silkscreen")].join(" "); });
    const lines = await page.$$eval(".fontbox > *", (e) => e.filter((x) => x.offsetParent).map((x) => (x.querySelector("label, .partfold span, .stickerlabel") || {}).textContent || x.className.split(" ")[0]).join(" · "));
    check(heads === "OpenType features" && many && shut && await page.isVisible(".fontbox .features") && tag === "true 8px true", `the OpenType features can be put away and brought back, their number beside the name; a feature is a tile with its code as a sticker (${tag})`);
    check(lines.includes("Size % · Tracking · Weightwght · OpenType features"), `the box's lines, top to bottom: ${lines}`);
  }
  await page.click("#window-font-back");
  check(await S("S.da_tracking === null && S.da_lang === null && S.da_features === null && Object.keys(S.da_axes).length === 0"), "As the numerals takes the window's tracking, language, axes and features back too");
  check(await page.$eval("#window-font-back", (b) => b.hidden || (b.textContent === "Same font as Numerals" && b.querySelector("i").textContent === "Numerals" && getComputedStyle(b).backgroundColor === "rgba(0, 0, 0, 0)" && b.querySelector("svg") !== null)), "its button says Copy style of Numerals — the ring's name as written, in italic — beside a copy sign, a box with no fill");
  check(own[0] === "Oswald" && own[1] === ring_font && own[2] && await S("S.da_ps === ''") && !(await page.textContent("#window-font-name")).includes("as the numerals"), "a window can have a font of its own (Oswald) without touching the numerals' font; As the numerals takes it back");
  // three colours
  const fills = async () => { await frame(); return page.evaluate(() => { const t = window.dial_tool, items = [...document.querySelectorAll("main svg [fill]")]; const S = t.S; return [S.da_text_c, S.da_disc_c, S.da_ink]; }); };
  await page.evaluate(() => { const t = window.dial_tool; t.set_value("window", "disc_c", [0.1, 0.1, 0.1, 1]); t.set_value("window", "text_c", [1, 0.9, 0.2, 1]); });
  await frame();
  const scene = await page.evaluate(() => { const t = window.dial_tool; return t.slots ? [...document.querySelectorAll("main svg path")].map((p) => p.getAttribute("fill")).filter(Boolean) : []; });
  await shot("4c18-window-colours");
  check(/Window at [^·]+ · Shape$/.test((await page.$$eval(".form .pane h2", (h) => h.map((x) => x.textContent))).join(" · ")) && await page.evaluate(() => { const rows = [...document.querySelectorAll(".form .pane .body")][0].children, ids = [...rows].filter((r) => r.offsetParent).map((r) => (r.querySelector("select, input, button") || {}).id); return ids[0] === "window-kind-Complication-0" && !!document.querySelector(".form .pane:first-of-type > .circles #window-at-Position-0"); })
    && await page.$eval("#window-r-Radius", (e) => e.closest(".pane").querySelector("h2").textContent) === "Shape" && await page.$eval("#window-clear-Clearance", (e) => e.closest(".pane").querySelector("h2").textContent) === "Shape" && await page.$eval("#window-frame-Frame", (e) => e.closest(".pane").querySelector("h2").textContent) === "Shape"
    && await page.isVisible("#window-font-c") && await page.isHidden("#window-text-c-Picture") && await page.isVisible("#window-disc-c-Disc-under-it") && await page.isVisible("#window-ink-Frame") && await page.$eval("#window-ink-Frame", (e) => e.closest(".row").classList.contains("colours") && e.closest(".row") === document.querySelector("#window-disc-c-Disc-under-it").closest(".row")),
    "Windows (#263, 4.46.1): Window at x holds Position (on its heading line) and Complication (Shows until 4.51.1); Shape holds Radius, the sizes, the colours on one line (the disc under it, the frame, and the picture's for a window that shows one), the text and its font, Frame and Clearance");
  await page.evaluate((was) => { const t = window.dial_tool, [ui, on, at, shape, turn, ps, family, text_c, disc_c, w] = JSON.parse(was); Object.assign(t.S, { da_at: at, da_shape: shape, da_turn: turn, da_ps: ps, da_family: family, da_text_c: text_c, da_disc_c: disc_c, da_w: w, da_text_turn: true, da_on: on, ui_window: ui }); t.static_dirty = true; t.sync_rows(); t.render(); }, was);
}
// an am · pm window follows the time shown: light at 10 in the morning, dark at 10 at night; AM · PM stands in the time's box
{
  const was = await page.evaluate(() => { const t = window.dial_tool, was = [t.S.ui_window, t.S.da_on, t.S.da_kind, t.S.t]; t.S.ui_window = 0; t.set_value("window", "on", true); t.set_value("window", "kind", 2); return was; });
  const dark = async () => { await frame(); return page.evaluate(() => { const t = window.dial_tool, x = t.statik.windows[0], b = x.number.bounds(), w = x.window.bounds(); return b ? (b[2] - b[0]) * (b[3] - b[1]) / ((w[2] - w[0]) * (w[3] - w[1])) : 0; }); };
  await enter_value("#time", "10:00");
  const am = [await S("S.t"), await page.textContent("#ampm"), await dark()];
  await page.click("#ampm");
  const pm = [await S("S.t"), await page.textContent("#ampm"), await dark(), await page.inputValue("#time")];
  await shot("4c12-ampm");
  await enter_value("#time", "15:20");
  const typed = [await S("S.t"), await page.inputValue("#time")];
  await enter_value("#time", "3:20 am");
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
  check(strip.touch && strip.on_line === "2 2px true" && strip.round === "0px 0px" && strip.notch === "true true true true" && strip.left === 28 && strip.right === 0 && strip.high >= 54, `the window cards are tabs, always in view: touching, on a thick line, square at both ends with a sharp notch over each joint, from the labels' line to the margin (${strip.high} high; ${JSON.stringify(strip)})`);
}
await page.click("#window-card-2");
check(await S("S.ui_window === 2 && S.windows[1].at === 2 && S.windows[1].on === false") && await page.textContent(".form .pane >> nth=0 >> h2") === "Window at 6" && await page.$eval("#window-card-2", (e) => e.classList.contains("on") && e.classList.contains("off")), "the card at 6 chooses its window: the pane says Window at 6; not in use yet, it takes the card's place");
const on_box = await page.evaluate(() => { const box = document.querySelector(".form").firstElementChild, c = box.querySelector(".check").getBoundingClientRect(), t = document.querySelector(".windowcards .card > .tab.on").getBoundingClientRect(); return [box.classList.contains("showbox"), box.querySelector("input").id, box.nextElementSibling.querySelector("h2").textContent, !document.querySelector(".form .pane .headcontrol input"), (c.left - t.left).toFixed(1) + " " + (c.right - t.right).toFixed(1)]; });
const win_gap = await page.evaluate(() => { const box = document.querySelector(".form > .showbox > .check").getBoundingClientRect(), pane = document.querySelector(".form > .showbox + .pane").getBoundingClientRect(); return +(pane.top - box.bottom).toFixed(1); });
check(win_gap === 11, `under the window's Show box its pane's thick line stands as far below as the hand's thin line does (${win_gap}; 4.46.4: "Thick line stands here")`);
check(on_box[0] && on_box[1] === "window-on-Show" && on_box[2] === "Window at 6" && on_box[3] && on_box[4] === "0.0 0.0", `Show stands in the Show box under the chosen card, as wide as it (${on_box[4]}), over the window's pane (#261; 4.46.2): the cards are tabs only`);
await page.click(".form .pane >> nth=0 >> .fold h2");
check(await page.isVisible("#window-on-Show"), "the window's pane folded, Show stays in view");
await page.click(".form .pane >> nth=0 >> .fold h2");
await page.click("#window-card-0");
await shot("4h-window-cards");
{ // one tab look (#260, 4.46): a chosen tab squares up, a window card as a hand tab; the others keep the notch between them
  const cuts = await page.evaluate(() => { const c = (e) => { const s = getComputedStyle(e); return s.getPropertyValue("--cut-l").trim() + "/" + s.getPropertyValue("--cut-r").trim(); };
    const cards = [...document.querySelectorAll(".windowcards .card > .tab")], on = cards.find((t) => t.classList.contains("on")), off = cards.filter((t) => !t.classList.contains("on"))[1];
    return [c(on), c(off)]; });
  check(cuts[0] === "0px/0px" && cuts[1] !== "0px/0px", `a chosen window card squares up as a chosen hand tab does (${cuts[0]}); the others keep their cut corners (${cuts[1]}) (#260)`);
}
await tab("Dial");
const controls_x = await page.evaluate(() => Math.round(document.querySelector("#global-dial-d-Diameter").closest(".row").querySelector("input[type=range]").getBoundingClientRect().left));      // the controls' column, on a plain row (the Cap pane, which had one here, is gone: #262)
await tab("Hands");
// All hands: one line, always in view — its name, the tick, the menu, on the columns
const bar_line = await page.evaluate((controls_x) => { const b = document.querySelector(".pinned .handsbar"), tops = [...b.children].map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); const x = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left); return [Math.max(...tops) - Math.min(...tops), x(".handsbar .check") - controls_x, b.querySelector("h2").textContent]; }, controls_x);
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
await page.evaluate(() => window.dial_tool.value_pop_close());      // a controller still open from above (the second drawing's square is larger, 4.52, and stood over the swatch)
await page.click("#global-c-plate-Plate");
const pop_at = await page.evaluate(() => { const p = document.querySelector("#colour-pop").getBoundingClientRect(), s = document.querySelector("#global-c-plate-Plate").closest(".colour").getBoundingClientRect(); return [Math.round(p.left - s.right), p.top < s.bottom && p.bottom > s.top]; });
check(await page.isVisible("#colour-pop") && pop_at[0] === 12 && pop_at[1], "the plate's swatch opens the colour pop-out, 12 to the right of its pill");
const pop_look = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#colour-pop")), pill = getComputedStyle(document.querySelector("#global-c-plate-Plate").closest(".colour")); return [c.backgroundColor, parseFloat(c.borderTopLeftRadius), parseFloat(pill.borderTopLeftRadius), getComputedStyle(document.querySelector("#global-c-plate-Plate-hex")).fontFamily.includes("mono") && document.querySelector("#global-c-plate-Plate").tagName === "BUTTON" && getComputedStyle(document.querySelector("#global-c-plate-Plate")).backgroundColor === "rgb(17, 17, 17)"]; });
check(pop_look[0] === "rgb(20, 20, 19)" && pop_look[1] >= 12 && pop_look[2] >= 4 && pop_look[3], "the pop-out is near black with round corners; a colour in the panel is a pill, one button: a small swatch and its hex in monospace; black while its pop-out is open");
check(await page.isHidden(".alpharow"), "the plate has no opacity strip");
await page.mouse.click(60, 200);      // on the Diameter label: a plain spot outside the pop-out (the colour list moved down with the centre hole row, #165)
check(await page.isHidden("#colour-pop"), "a press outside the pop-out puts it away");
await page.evaluate(() => window.dial_tool.value_pop_close());      // that press was on Diameter's name, which opens its controller: put it away (since 4.52 the controller is larger and stood over the swatch)
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
await enter_value("#pop-K", "100");
await page.click("#pop-as-HEX");
check(JSON.stringify(await S("S.c_plate.slice(0, 3)")) === "[0,0,0]" && await page.inputValue("#pop-hex") === "#000000", "CMYK: K 100 is black, and HEX says #000000");
await page.click("#pop-as-RGB");
await enter_value("#pop-R", "255");
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
await page.click("#pop-as-HEX"); await enter_value("#pop-hex", "ede8db");
check(JSON.stringify(await S("S.c_plate.map((v) => Math.round(v * 255))")) === "[237,232,219,255]", "a typed value sets it too");
await page.click("#global-c-plate-Plate");
await shot("4c2-colour");
check(await page.$$eval(".tabs button", (b) => b.map((x) => x.textContent.trim()).join(" ")) === "Dial Rings Hands Windows Export" && await page.$("main button.guidesbox#guides svg") !== null, "tabs: Export last; Guides is a rounded switch with a bullseye at the top right");

{ // no two parts of the window share an id (a label's for, a test's #id find the first; 4.45.2 had two window-w-Width)
  const twice = await page.evaluate(() => { const n = {}; for (const e of document.querySelectorAll("[id]")) if (e.id) n[e.id] = (n[e.id] || 0) + 1; return Object.keys(n).filter((k) => n[k] > 1); });
  check(twice.length === 0, `every id once (${twice.join(" ") || "none twice"})`);
}
// ── windows: up to four, each a date, a day, am · pm or a moon phase ──
await tab("Date");
const kinds = [["1", "1", "9"], ["2", "2", "6"], ["3", "3", "12"]];          // window (its card's number), kind, position
for (const [n, kind, at] of kinds) {
  await page.click("#window-card-" + n);
  await page.check("#window-on-Show");
  await page.click("#window-kind-Complication-" + kind);
  await page.click("#window-at-Position-" + ["3", "4:30", "6", "9", "12", "1:30", "7:30", "10:30", "4"].indexOf(at));
}
await page.uncheck("#window-follows-Follows-the-date-in-the-bar");      // switched on, the moon followed the date (4.62): its own age, typed
await enter_value("#window-age-Moon-age-days", "6");
await enter_value("#window-w-Width-arch", "4");
await frame();
check(await S("t.statik.windows.length === 4 && S.windows[0].text === 'MON' && S.windows.map((w) => w.kind).join('') === '123'"), "four windows: date, day (its text became MON), am · pm, moon phase");
check(await S("t.statik.windows.every((x) => x.number.bounds() !== null && x.window.bounds() !== null)") && await S("t.items.filter((i) => i.role === 'date disc').length === 4"), "each window has a hole and something showing through it");
const moon_at = await S("(() => { const b = t.statik.windows[3].window.bounds(); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2 + 0.6]; })()");
await over_mm(...moon_at);
check((await page.textContent(".tip span")) === "Moon phase window", "pointer on the fourth window: Moon phase window");
await click_mm(...moon_at);
check(await S("S.ui_section === 3 && S.ui_window === 3") && await page.isVisible("#window-age-Moon-age-days") && await page.isHidden("#window-h-Height"), "click it: Windows, window 4, with the moon's rows");
{ // a window's width over its height, a LINK pill on the line between them (#358, 4.57); linked, one changed keeps their ratio
  await page.evaluate(() => { const t = window.dial_tool; t.S.ui_window = 0; t.show_section(); t.sync_rows(); });
  await frame();
  const look = await page.evaluate(() => { const w = document.querySelector("#window-w-Width").closest(".row"), h = document.querySelector("#window-h-Height").closest(".row"), p = document.querySelector("#window-w-Width-link"), wr = w.getBoundingClientRect(), hr = h.getBoundingClientRect(), pr = p.getBoundingClientRect(), ps = getComputedStyle(p);
    return [hr.top >= wr.bottom - 1, Math.abs((pr.top + pr.bottom) / 2 - wr.bottom) <= 1, p.textContent, ps.fontFamily.includes("Silkscreen"), ps.borderTopColor, ps.backgroundColor === getComputedStyle(document.querySelector(".form")).getPropertyValue("--surface").trim() || ps.backgroundColor, w.querySelector('input[type="range"]') !== null && h.querySelector('input[type="range"]') !== null]; });
  const was = await S("[S.da_w, S.da_h]");
  await page.click("#window-w-Width-link");
  const on = [await S("S.da_wh_link"), await page.textContent("#window-w-Width-link"), await page.$eval("#window-w-Width-link", (p) => getComputedStyle(p).color)];
  await page.evaluate((w) => window.dial_tool.set_value("window", "w", w * 2), was[0]);
  const twice = await S("[S.da_w, S.da_h]");
  await page.click("#window-w-Width-link");
  await page.evaluate((w) => window.dial_tool.set_value("window", "w", w), was[0]);
  const free = await S("[S.da_w, S.da_h, S.da_wh_link]");
  await page.evaluate((h) => window.dial_tool.set_value("window", "h", h), was[1]);
  check(look[0] && look[1] && look[2] === "LINK" && look[3] && look[6] && on[0] === true && on[1] === "LINKED" && on[2] === "rgb(255, 255, 255)" && Math.abs(twice[0] - 2 * was[0]) < 1e-9 && Math.abs(twice[1] - 2 * was[1]) < 1e-3 && free[0] === was[0] && Math.abs(free[1] - 2 * was[1]) < 1e-3 && free[2] === false,
    `a window's width over its height, each with its slider; LINK in the pixel font on the line between them; pressed it says LINKED, white on dark, and width ×2 takes height ×2 (${was.join(" × ")} → ${twice.join(" × ")}); unlinked, width alone (#358)`);
}
{ // the complications act like tabs (#328, 4.61: "selecting them changes settings accordingly"): each kind keeps its own settings, its place is shared
  const was = await S("JSON.stringify([S.da_kind, S.da_w, S.da_day, S.da_r])");
  const tabs = await page.evaluate(() => { const t = window.dial_tool, v = (k, x) => t.set_value("window", k, x), S = t.S; t.S.ui_window = 0;
    v("kind", 0); v("w", 3.3); v("text", "21");
    v("kind", 1); const day_first = [S.da_day, S.da_w]; v("w", 5); v("r", 9.5);
    v("kind", 0); const date_back = [S.da_day, S.da_w, S.da_r];
    v("kind", 1); const day_back = [S.da_day, S.da_w, S.da_r];
    return [day_first, date_back, day_back]; });
  await page.evaluate((was) => { const [k, w, d, r] = JSON.parse(was), t = window.dial_tool; t.set_value("window", "kind", k); Object.assign(t.S, { da_w: w, da_day: d, da_r: r }); t.static_dirty = true; t.sync_rows(); t.render(); }, was);
  check(tabs[0].join() === "21,3.3" && tabs[1].join() === "21,3.3,9.5" && tabs[2].join() === "21,5,9.5", `the complications act like tabs: a day taken first starts from the date's settings, a typed text kept (${tabs[0]}); each kind keeps its own (date ${tabs[1]}, day ${tabs[2]}), the radius shared (#328)`);
}
await shot("4d-windows");
for (const n of ["1", "2", "3"]) { await page.click("#window-card-" + n); await page.uncheck("#window-on-Show"); }
await page.click("#window-card-0");
check(await S("t.statik.windows.length === 1"), "windows 2 to 4 switched off again");

// ── fonts: only the ring's font shows in Type; the list is a sheet over the panel ──
await click_mm(...clock(10, 120));
check(await page.$$eval(".form .fontrow", (rows) => rows.length) === 1 && await page.$$eval(".form select#font-family", (e) => e.length) === 0, "Type shows one font, the selected one, and no dropdowns");
await page.click("#font-current");
const sheet_at = await page.$eval("#font-picker", (d) => { const r = d.getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect(); const c = getComputedStyle(d), p = document.querySelector(".panel").getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width - p.width), Math.round(r.right - m.left), c.boxShadow !== "none", !document.querySelector("#font-done")].join(" "); });
check(await page.$eval("#font-picker", (d) => d.open) && sheet_at === "184 64 -1 183 true true" && await page.$eval("#font-picker", (d) => Math.round(document.querySelector(".bar").getBoundingClientRect().top - d.getBoundingClientRect().bottom) === 34 && document.activeElement !== document.querySelector("#font-find") && document.querySelector("#font-find").closest("header") !== null), `pressing it opens the font sheet: floating over the panel, from the line under the panel's title down to one row above the bar (Okay: "window starts here"; "bottom shrinks"), its left edge on the panel's third column, as wide as the panel less its edge line, with a shadow; no Done button; Find a font is on its top line and waits for a press (${sheet_at})`);
{
  const row = await page.evaluate(() => { const rows = [...document.querySelectorAll("#font-picker .fontrow")], x = (e) => Math.round(e.getBoundingClientRect().left), by = (f) => rows.find((r) => r.dataset.family === f);
    return { names: new Set(rows.map((r) => x(r.querySelector(".name")))).size, numerals: new Set(rows.map((r) => x(r.querySelector(".sample")))).size, order: rows.every((r) => x(r.querySelector(".name")) < x(r.querySelector(".sample")) && x(r.querySelector(".sample")) < x(r.querySelector(".has"))), drawn: by("Jost").querySelector(".name svg path") !== null, barlow: [...by("Barlow").querySelectorAll(".sticker")].map((e) => e.textContent + "/" + e.className.split(" ")[1]).join(" "), archivo: [...by("Archivo").querySelectorAll(".sticker")].map((e) => e.textContent + "/" + e.className.split(" ")[1]).join(" "), sticker: (() => { const c = getComputedStyle(by("Archivo").querySelector(".sticker.weight")), d = getComputedStyle(by("Archivo").querySelector(".sticker.width")); return [c.fontFamily.includes("Silkscreen"), c.fontSize, c.backgroundColor !== d.backgroundColor, c.borderTopLeftRadius].join(" "); })(), two_lines: rows.filter((r) => r.dataset.group === "list" && r.querySelector(".has").getBoundingClientRect().height > 20).map((r) => r.dataset.family).join(), one_line: by("Arimo").querySelector(".has").getBoundingClientRect().height < 30 && by("Routed Gothic").querySelector(".has").getBoundingClientRect().height < 30 && rows.every((r) => r.dataset.group !== "list" || r.querySelector(".has").getBoundingClientRect().height < 45), three: rows.filter((r) => r.querySelector(".has") && r.querySelector(".has").getBoundingClientRect().height >= 45).map((r) => r.dataset.family + " " + r.dataset.group).join(), sets: [...by("Cormorant").querySelectorAll(".sticker.sets")].map((e) => e.textContent).join(" | "), legend: [...document.querySelectorAll("#font-legend dt")].map((e) => e.textContent).join(" "), legend_at: (() => { const leg = document.querySelector("#font-legend"), b = document.querySelector("#font-legend-open"); if (!leg.hidden) return false; b.click(); const l = leg.getBoundingClientRect(), q = document.querySelector("#font-picker .squares").getBoundingClientRect(), shown = !leg.hidden && l.bottom <= q.top + 1 && b.getAttribute("aria-expanded") === "true"; b.click(); return shown && leg.hidden; })(), cut: rows.every((r) => { const sv = r.querySelector(".sample svg"); return !sv || Math.round(sv.getBoundingClientRect().height) === 25; }), fits: rows.every((r) => { const n = r.querySelector(".name"), g = n.querySelector("svg"); return !g || g.getBoundingClientRect().right <= n.getBoundingClientRect().right + 0.5; }), has: new Set(rows.map((r) => Math.round(r.querySelector(".has").getBoundingClientRect().width))).size, line: getComputedStyle(rows[0]).borderBottomColor === getComputedStyle(document.querySelector(".fontlist")).borderTopColor,
      squares: [...document.querySelectorAll("#font-picker .squares .pickt")].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return b.textContent + " " + (Math.round(r.height) <= 46); }).join(" · "), three: (() => { const a = [...document.querySelectorAll("#font-picker .adds > .pickt")].map((b) => b.getBoundingClientRect()), l = document.querySelector("#font-legend-open").getBoundingClientRect(), w = a.map((r) => Math.round(r.width)); return a.length === 3 && new Set(w).size === 1 && Math.abs(a[0].top - l.top) < 1 && getComputedStyle(document.querySelector("#font-picker .adds small")).display === "none"; })() }; });
  check(row.names === 1 && row.numerals === 1 && row.order && row.drawn && row.line, "a line of the sheet: the family's name drawn in its own face at the left · its numerals, all starting on one line · what it has; a full line between two");
  check(row.barlow === "bold/weight tab/figure frac/figure 4 st/styles" && row.archivo === "w. 100–900/weight wd/width tab/figure old/figure zero/figure frac/figure" && row.sticker === "true 8px true 3px" && row.has === 1, `what a family has, as stickers in the pixel font, in short words (bold and italic whole), a colour for each kind, round corners: Barlow ${row.barlow}; Archivo ${row.archivo}; their column is one width (${row.sticker})`);
  check(row.one_line, `a row's stickers stand on one line where the column lets them, never three in the tool's own list (on two: ${row.two_lines || "none"}; three: ${row.three || "none"})`);
  check(row.sets === "12 ss | 5 cv", `a family's numbered sets and variants are two stickers at most, one colour (Cormorant: ${row.sets})`);
  check(row.legend === "w. 100–900 bold italic wd opt tab old zero frac 2 ss 5 cv 3 st" && row.legend_at, `a legend says what each sticker means: folded to a button beside the squares, it opens upwards over them (${row.legend})`);
  check(row.cut, "numerals keep their size in every row: the wide ones are cut at their column's edge, none above");
  check(row.fits, "every family's name fits its column: the long ones are drawn smaller");
  check(row.squares === "Installed true · Add font link(gfonts, url) true · Add font file(woff, ttf, otf) true · Legend(OpenType abbr.) true" && row.three, `the buttons for adding a font: where the browser reads installed fonts, Installed first and the three sharing the first two columns on one line, without their second lines; short (no higher than 46); the legend's button in the third column (${row.squares})`);
  await page.keyboard.press("Escape");
  { // the text's colour stands in the ring list's colour column; the name's whole line opens the sheet
    const col = await page.evaluate(() => { const mid = (e) => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; }; return [mid(document.querySelector(".ringline .colour")), mid(document.querySelector("#font-c")), document.querySelector("#font-c").getBoundingClientRect().right <= document.querySelector("#lang").getBoundingClientRect().left, document.querySelector("#font-name").getBoundingClientRect().right <= document.querySelector("#font-c").getBoundingClientRect().left + 0.5 && document.querySelector("#font-change") === null]; });
    const name = await page.$eval("#font-name", (e) => { const r = e.getBoundingClientRect(); return [r.right - 6, r.top + r.height / 2]; });
    await page.mouse.click(name[0], name[1]);
    const opened = await page.$eval("#font-picker", (d) => d.open);
    await page.keyboard.press("Escape");
    await page.click("#font-c");
    const colour_only = await page.$eval("#font-picker", (d) => !d.open) && await page.isVisible("#colour-pop");
    await page.keyboard.press("Escape"); await page.mouse.click(640, 30);
    check(Math.abs(col[0] - col[1]) < 0.6 && col[2] && col[3], `the text's colour beside the font's name stands in the ring list's colour column (${col[0]} = ${col[1]}), before EN; the name runs up to it; no Change… (Okay's drawing, 18 Oct 2026)`);
    check(opened && colour_only, "a press anywhere on the name's line opens the font sheet; a press on the colour opens the colour instead");
    await page.click("#font-name");
  }
  const shut = await page.isHidden("#font-link");
  await page.click("#font-add");
  check(shut && await page.isVisible("#font-link") && await page.evaluate(() => document.activeElement.id === "font-link"), "the field for a link is out of sight until Add link is pressed; then it is there, with the keyboard in it");
}
{ const fam = [await page.$$eval('#font-picker .fontrow[data-group="list"]', (rows) => rows.length), await page.$$eval('#font-picker .fontrow[data-group="list"] .sample svg path', (p) => p.length), await page.$$eval('#font-picker .fontrow[data-group="list"]', (rows) => rows.filter((r) => r.querySelectorAll(".sample svg path").length !== 1).map((r) => r.dataset.family + ":" + r.querySelectorAll(".sample svg path").length).join(" "))];
  check(fam[0] === 42 && fam[1] === 42, `the sheet lists the tool's forty-two families (twenty-one until 4.46.7, #313), each showing numerals in its own outlines (${fam[0]} · ${fam[1]} ${fam[2]})`); }
await page.click('.fontrow[data-family="Jost"]');
await page.waitForFunction(() => window.dial_tool.ring().ps === "Jost-Regular" && document.querySelector("#axis-wght"), null, { timeout: 8000 }).catch(() => {});
check(await S("S.rings[S.ui_ring].ps === 'Jost-Regular'") && await page.$("#axis-wght") !== null && await page.$eval("#font-picker", (d) => !d.open), "click Jost: fetched and drawn, and the sheet closes (4.68; Okay, 18 Oct 2026, 22:35: \"Font window, selecting font closes window\"; it stayed open to compare until 4.67)");
await page.click("#font-current");
await page.click('.fontrow[data-family="Josefin Sans"]');
await page.waitForFunction(() => window.dial_tool.ring().family === "Josefin Sans");
check(await S("S.rings[S.ui_ring].axes.wght === 400"), "a variable font that rests at Thin starts at regular weight");
await page.click("#font-current");
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
await enter_value("#font-link", "Nonesuch Grotesk");
await page.waitForFunction(() => document.querySelector("#picker-note").textContent.includes("no family"), null, { timeout: 8000 }).catch(() => {});
check((await page.textContent("#picker-note")).includes("no family spelled"), "a name Google Fonts doesn't have is answered plainly");
if (await page.isHidden("#font-link")) await page.click("#font-add");
await enter_value("#font-link", "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap");
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
check(await page.$eval("#font-picker", (d) => !d.open) && (await page.textContent("#font-name")) === "Lora" && await page.$("#font-current .sample svg") !== null, "choosing Lora closes the sheet; Type shows Lora with its numerals");
await frame();
check(await page.$("#axis-wght") !== null, "Lora's weight axis has a slider");
{ // a variable axis is named by a sticker, in the tool's colours, that is a button: it sets the axis back
  await enter_value("#axis-wght", "650");
  const moved = await S("S.rings[S.ui_ring].axes.wght");
  const look = await page.$eval("#axis-wght-back", (e) => { const c = getComputedStyle(e); const st = getComputedStyle(e.querySelector(".sticker")); return [e.firstChild.textContent, st.fontFamily.includes("Silkscreen"), e.querySelector(".sticker").textContent, st.fontSize + " " + (c.color === getComputedStyle(document.querySelector(".fontbox .row > label")).color) + " " + (getComputedStyle(e).fontFamily === getComputedStyle(document.querySelector(".fontbox .row > label")).fontFamily)]; });
  await page.click("#axis-wght-back");
  check(moved === 650 && look[0] === "Weight" && look[1] && look[2] === "wght" && look[3] === "8px true true" && await S("S.rings[S.ui_ring].axes.wght === undefined"), "an axis is named in the tool's own type, grey like the labels, with its code as a small sticker; the name is a button: a press sets the axis back to where the font rests");
}
{
  // the font box after Okay's drawing (font-selector_171026, 18 Oct 2026): a grey head — the preview on white, then the
  // name's line, grey and bold, the colour, EN at its right end — then the styles, the rows; no Change…
  const f = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), box = r(".fontbox"), top = r("#font-current"), name = r("#font-name"), line = r(".fontname"), lang = r("#lang"), styles = r(".font .styles"), c = (q) => getComputedStyle(document.querySelector(q));
    return { order: top.bottom <= name.top && name.bottom <= styles.top, right: Math.round(box.right - lang.right), on_line: lang.top >= line.top && lang.bottom <= line.bottom, head: [c(".currentwrap").backgroundColor, c(".fontname").backgroundColor, c("#font-current").backgroundColor, c("#font-name").color].join(" "),
      white: c(".fontbox").backgroundColor, quiet: c("#lang").fontSize === "10px" && Math.round(parseFloat(c("#lang").height)) === 20, change: document.querySelector("#font-change") === null }; });
  check(f.order && f.right === 8 && f.on_line && f.head === "rgb(232, 232, 230) rgb(232, 232, 230) rgb(255, 255, 255) rgb(142, 142, 137)" && f.white === "rgb(255, 255, 255)" && f.quiet && f.change && await page.textContent("#lang") === "EN" && await page.isHidden("#lang-menu"),
    `a font's box after Okay's drawing: a grey head with the preview on white and the name's line under it (the name grey), EN at the line's right end, 8 inside the box (20 high, 10 type), no Change… (${JSON.stringify(f)})`);
  // the font box, 4.51 (phase H): the styles as tabs hanging from the name's line (#275); the sliders as wide as the longest label allows (#274); Light · Dark on the sheet (#276)
  {
    const h = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)), r = (q) => document.querySelector(q).getBoundingClientRect(), tabs = [...document.querySelectorAll(".font .styles > .tab")], on = tabs.find((t) => t.classList.contains("on"));
      const slider = r("#ring-size-Size-slider"), plain = [...document.querySelectorAll(".pane .body > .row.num:not(.side) input[type=range]")].find((e) => e.offsetParent && !e.closest(".fontbox")).getBoundingClientRect(), label = r("#ring-size-Size-slider").left - r(".fontbox .row.num").left;
      return [tabs.length, tabs.every((t) => t.classList.contains("hang") && t.getAttribute("role") === "tab"), on && on.textContent, on && getComputedStyle(on).color, Math.round(r(".font .styles").top - r(".fontname").bottom), Math.round(slider.width), Math.round(plain.width), Math.round(label)]; });
    check(h[0] >= 2 && h[1] && h[2] === "Regular" && h[3] === "rgb(255, 255, 255)" && h[4] <= 1 && h[5] > h[6] * 1.2 && h[7] < 110,
      `the family's ${h[0]} styles are tabs hanging from the name's line (${h[4]} apart; #275), the chosen one mid grey with white words (${h[2]}, ${h[3]}; Okay's drawing, 18 Oct 2026); the box's slider is ${h[5]} wide where a pane's is ${h[6]} (#274), its name column ${h[7]}`);
    await page.click("#font-name");
    await page.click("#font-ground-dark");
    const d = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)); return [c("#font-list").backgroundColor, c("#font-current").backgroundColor, c("#font-current").color, c("#font-ground-dark").backgroundColor, document.querySelector("#font-ground-dark").getAttribute("aria-checked"), sessionStorage.getItem("dial-tool-font-dark"), c(".fontbox").backgroundColor]; });
    await page.click("#font-ground-light");
    const l = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)); return [c("#font-list").backgroundColor, c("#font-current").backgroundColor]; });
    await page.keyboard.press("Escape");
    check(d[0] === "rgb(63, 63, 62)" && d[1] === "rgb(63, 63, 62)" && d[2] === "rgb(236, 236, 232)" && d[3] === "rgb(17, 17, 17)" && d[4] === "true" && d[5] === "1" && d[6] === "rgb(255, 255, 255)" && l[0] === "rgb(255, 255, 255)" && l[1] === "rgb(255, 255, 255)",
      `the sheet's Light · Dark pill (#276): Dark puts the list and a font box's preview on a dark grey (${d[0]}, ${d[1]}), its figures near white (${d[2]}), the rest of the box as it was (${d[6]}; notes 2, 18 Oct 2026: "only the 1234…, the preview rectangle"), kept for the session (${d[5]}); Light brings the white back (${l.join(", ")})`);
  }
  await page.click("#lang");
  const langs = await page.$$eval("#lang-menu button", (b) => b.map((x) => x.textContent).join(" | "));
  await page.click("#lang-tr");
  check(langs.startsWith("As the font sets itEN | TurkishTR | DutchNL") && await page.textContent("#lang") === "TR" && await page.isHidden("#lang-menu") && await S("S.rings[S.ui_ring].lang === 1"), "a press opens the list of languages by name; choosing Turkish sets the ring's language and the button says TR");
  await page.click("#lang"); await page.click("#lang-default");
  check(await S("S.rings[S.ui_ring].lang === 0"), "and back to the font's own");
  await page.$eval(".font", (e) => e.scrollIntoView({ block: "center" }));
  await shot("4c22-font");
  await page.click("#font-name");
  check(await page.$eval("#font-picker", (d) => d.open), "Change… opens the font sheet");
  await page.keyboard.press("Escape");
}
const light = await S("t.statik.rings.find((d) => d.kind === 'numerals').path.svg(3).length");
await enter_value("#axis-wght", "700");
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
check(await page.$eval("#ring-kind-square", (e) => { const r = e.getBoundingClientRect(), p = document.querySelector(".panel").getBoundingClientRect(); return r.top > p.top && r.bottom < p.bottom && e.closest(".pinned") !== null; }), "Kind, Colour and radius stay in view when the rows are scrolled to the end");
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
await page.click("#fit");
check(near(await S("t.z"), z0, 1e-6) && await S("t.fitted"), "Fit puts the whole page back");
const t0 = await S("S.t");
await page.click("#play");
await page.waitForTimeout(600);
const t1 = await S("S.t");
check(await page.getAttribute("#play", "title") === "Pause", "while playing, the button offers Pause");
await page.click("#play");
check(t1 - t0 > 0.4 && t1 - t0 < 1.5, `Play moves the time (${(t1 - t0).toFixed(2)} s in 0.6 s)`);
// the play button (#282, beta 4.44): a soft white triangle on the cap, no beat's dot; while time runs the cap pulses
// with the beat and fades the whole way, the triangle flares and fades by half the beat; faster with the time, held
// at three a second (or the movement's own beat). Checked on the pulse itself, with motion allowed for a moment
{
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const p = await page.evaluate(() => {
    const t = window.dial_tool, was = [t.playing, t.speed, t.S.ha_beat], v = () => { const s = t.play_button.style; return [+s.getPropertyValue("--pulse"), +s.getPropertyValue("--pulse-tri")]; };
    t.playing = true; t.S.ha_beat = 1; t.speed = 1;
    t.pulse(100, 0); const beat = v(); t.pulse(100.005, 0); const rise = v(); t.pulse(100.012, 0); const peak = v(); t.pulse(100.25, 0); const quarter = v(); t.pulse(100.5, 0); const half = v();
    t.speed = 720; t.pulse(100.5, 0); const held = v(); t.pulse(100.5, 1 / 12); const held_half = v();
    // slow motion (#308, 4.46.6): the flash as long in real seconds as at 1× — at 0.1× over by 0.05 of a beat (half a real second), its peak full; one beat later still a flash
    t.speed = 0.1; t.pulse(100.0012, 0); const slow_peak = [...v(), t.play_button.classList.contains("slow"), getComputedStyle(t.play_button).getPropertyValue("--play-tri-high").trim()]; t.pulse(100.05, 0); const slow_over = v(); t.pulse(101.0012, 0); const slow_next = v();
    t.speed = 1; t.pulse(100.1, 0); const fast_class = t.play_button.classList.contains("slow");
    [t.playing, t.speed, t.S.ha_beat] = was; t.pulse(0);
    const tri = t.play_button.querySelector(".arc-play"), r = tri.getBoundingClientRect(), b = t.play_button.getBoundingClientRect();
    return { beat, rise, peak, quarter, half, held, held_half, slow_peak, slow_over, slow_next, fast_class, dot: !!t.play_button.querySelector(".arc-dot"), rest: getComputedStyle(tri).opacity, fill: getComputedStyle(tri).fill, blur: !!tri.getAttribute("filter"), off: [((r.left + r.right) / 2 - (b.left + b.right) / 2).toFixed(1), ((r.top + r.bottom) / 2 - (b.top + b.bottom) / 2).toFixed(1)] };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(p.beat.join() === "1,0" && p.rise[1] > 0 && p.rise[1] < 1 && p.peak[1] === 1 && p.quarter[0] > p.quarter[1] && p.quarter[1] > 0 && p.half[1] === 0 && p.half[0] > 0 && p.held.join() === "1,0" && p.held_half[1] === 0 && !p.dot && p.rest === "0.4" && p.fill === "rgb(255, 255, 255)" && p.blur
    && p.slow_peak.join() === "0.996,1,true,1" && p.slow_over[1] === 0 && p.slow_next[1] === 1 && !p.fast_class,
    `the play button: a soft white triangle (${p.rest} at rest, its box ${p.off.join(" / ")} off the cap's middle, as its ink is centred), no beat's dot; at a beat the cap full and the triangle flashing: full within 12 ms (${p.rise[1]} at 5 ms), gone by 0.4 of the beat (${p.quarter.join(" / ")} at a quarter, ${p.half.join(" / ")} at half); at 720× the flashes held at six a second (${p.held_half.join(" / ")} a twelfth of a second on; three until 4.44.5); at 0.1× the flash lasts 0.4 of a real second, not four (${p.slow_over[1]} at 0.05 of a beat), and peaks at full (${p.slow_peak.slice(2).join(" · ")}) (#308)`);
}
// how fast: one slider — slow motion's four steps first (0.1 · 0.25 · 0.5 · 1×, #283), then a log scale to 720×
const at_speed = async (k) => page.$eval("#speed", (e, k) => { const split = window.dial_tool.speed_split(); e.value = Math.round((split + (1 - split) * Math.log(k) / Math.log(720)) * 1000) + 8; e.dispatchEvent(new Event("input", { bubbles: true })); }, k);
await at_speed(60);
const near60 = await S("t.speed");
check(near60 > 55 && near60 < 70 && near60 !== 60 && /^\d+×$/.test(await page.getAttribute("#speed", "aria-valuetext")), `the speed slider is free between its ends (${near60.toFixed(1)}× near 60), and tells a screen reader (no words in the box since 15 Oct 2026)`);
const ends = await page.$$eval(".humpname.end", (n) => n.map((e) => e.textContent + " " + getComputedStyle(e).color).join(" · "));
const pill = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)), r = c(".humpname.rider"), ten = c(".steps12 button.special"); return [r.backgroundColor === ten.backgroundColor, r.color === ten.color, r.fontWeight === ten.fontWeight, r.fontSize === ten.fontSize, r.height === ten.height, r.borderRadius === ten.borderRadius].every(Boolean); });
await page.waitForTimeout(1000);
check(ends === "0.1X rgb(115, 115, 115) · 720X rgb(115, 115, 115)" && pill && await page.$eval(".humpname.rider", (e) => e.textContent + " " + getComputedStyle(e).color) === Math.round(near60) + "X rgb(255, 255, 255)",
  `its ends are named in the bar's grey (${ends}); while it is moved the speed over the thumb is a pill exactly like 10:10's (#283), then white again`);
await at_speed(60);
await page.click("#play");
await page.waitForTimeout(600);
const t2 = await S("S.t");
await page.click("#play");
check(t2 - t1 > 20 && t2 - t1 < 90, `about 60×: a minute every second (${(t2 - t1).toFixed(0)} s in 0.6 s)`);
{ // slow motion (#283): the first part of the track, two thumbs wide, snaps to its four steps; the thumb starts at 1×
  const slow = await page.evaluate(() => {
    const t = window.dial_tool, e = t.speed_slider, split = t.speed_split(), go = (v) => { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); return [t.speed, +e.value, e.getAttribute("aria-valuetext"), t.speed_name.textContent]; };
    const thumb = parseFloat(getComputedStyle(t.speeds).getPropertyValue("--speed-thumb")), travel = e.getBoundingClientRect().width - thumb;
    const out = { split: +split.toFixed(3), wide: +(split * travel).toFixed(1), thumb, left: go(0), near_quarter: go(Math.round(split * 1000 / 3) + 20), half: go(Math.round(split * 2000 / 3) - 20) };
    t.set_speed(1); out.one = [+e.value, Math.round(split * 1000)];
    const dot = t.speeds.querySelector(".knob.one").getBoundingClientRect(), track = t.speeds.querySelector(".humps").getBoundingClientRect();
    out.dot = [+(((dot.left + dot.right) / 2 - track.left) / track.width).toFixed(3), +split.toFixed(3), getComputedStyle(t.speeds.querySelector(".knob.one")).backgroundColor];
    return out;
  });
  check(slow.left.join() === "0.1,0,0.1×,0.1X" && slow.near_quarter[0] === 0.25 && slow.near_quarter[1] === Math.round(slow.split * 1000 / 3) && slow.half[0] === 0.5 && slow.half[3] === "0.5X" && slow.one[0] === slow.one[1] && slow.wide >= 2 * slow.thumb - 1 && Math.abs(slow.dot[0] - slow.dot[1]) < 0.01 && slow.dot[2] === "rgb(0, 0, 0)",
    `slow motion: the track's first ${slow.wide} (two ${slow.thumb} thumbs) holds 0.1 · 0.25 · 0.5 · 1×, the thumb snapping onto them (${slow.near_quarter[0]}× at its step); 1× is ${slow.one[0] / 10} % along, marked by a black dot on the line (4.44.5)`);
}
await at_speed(1);
const z1 = await S("t.z");
await page.click("#zoom-in");
check(near(await S("t.z") / z1, 1.4, 0.01), "the + in the bar zooms in by 1.4");
await page.click("#zoom-out");
await page.click("#fit");
// the day slider's steps: a click on a step, or on the slider near one, goes exactly there; 10:10 is one of them
await page.click('.steps12 button:has(.ink:text-is("3"))');
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
const wide_ruler = await page.$eval("#time-slider", (e) => Math.round(e.getBoundingClientRect().width));
check(finer === cut && wide_ruler <= 518, `on a wider window the ruler stays as wide as on an iPad (${wide_ruler}), cut as before (every ${finer / 60} minutes; Okay, 14 Oct 2026: limit it to the iPad's width)`);
await page.setViewportSize({ width: 1440, height: 900 });
await frame();
const under = await page.evaluate(() => { const l = (q) => Math.round(document.querySelector(q).getBoundingClientRect().left), row = [...document.querySelectorAll(".form .row.num")].find((e) => e.offsetParent) || document.querySelector(".row.num"); return { play: l("#play"), col: Math.round(row.getBoundingClientRect().left), now_right: Math.round(document.querySelector("#now").getBoundingClientRect().right), row_right: Math.round(row.getBoundingClientRect().right) }; });
check(under.play === under.col && under.now_right === under.row_right, `under the panel the time controls start and end with the six columns (${JSON.stringify(under)})`);
const pane_lines = await page.$$eval(".form .pane", (h) => h.filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().left) + "/" + Math.round(e.querySelector(".eye svg").getBoundingClientRect().left)));
check(pane_lines.length > 0 && pane_lines.every((x) => x === "24/26"), `a pane's line starts at the margin, over its eye, which stands 2 further in (${pane_lines[0]})`);
// the bar keeps the columns: widths of one or two columns, and the Guides switch ends on the panel's last column
const fits = await page.evaluate(() => { const w = (q) => Math.round(document.querySelector(q).getBoundingClientRect().width), r = (q) => Math.round(document.querySelector(q).getBoundingClientRect().right); const box = (q) => document.querySelector(q).getBoundingClientRect(), lead = document.querySelector(".bar .lead"), pad = parseFloat(getComputedStyle(lead).paddingRight);
    const gaps = [["#play", ".speeds"], [".speeds", ".timewell"], ["#date", "#now"]].map(([a, b]) => +(box(b).left - box(a).right).toFixed(1));
    return { play: w("#play"), zooms: w("#zoom-out") + w("#zoom-in"), fit: w("#fit"), fitpad: getComputedStyle(document.querySelector("#fit")).paddingLeft === getComputedStyle(document.querySelector("#now")).paddingLeft && Math.abs(box("#fit").width - (box("#fit span").width + 2 * parseFloat(getComputedStyle(document.querySelector("#fit")).paddingLeft) + parseFloat(getComputedStyle(document.querySelector("#fit")).borderLeftWidth) + parseFloat(getComputedStyle(document.querySelector("#fit")).borderRightWidth))) < 0.5, sign: box(".zoomsign").right <= box(".zooms").left && Math.abs(box("#zoom-in").right - box("#fit").left) < 0.5 && document.querySelector("#fit svg") === null, gaps, touch: +(box("#ampm").left - box(".timewell").right).toFixed(1), half: [+box("#ampm").width.toFixed(1), +box("#ampm").height.toFixed(1), +((box("#ampm").top + box("#ampm").bottom) / 2 - (box(".timewell").top + box(".timewell").bottom) / 2).toFixed(1)], end: Math.round(box(".bar .lead").right - pad - box("#now").right) }; });
check(fits.play === 34 && fits.zooms === 54 && fits.fitpad && fits.sign && fits.gaps[0] === 24 - 3.5 && fits.gaps[1] === fits.gaps[2] && fits.touch === 0 && fits.half[1] === 30 && Math.abs(fits.half[2]) < 0.5 && fits.end === 0,
  `under the panel: play, a margin less what the speed box grew toward it (24 − 3.5, Okay 15 Oct 03:18), how fast · the time with AM · PM attached, as high, its word the time's size (#284, 4.44.6), then the date touching it (4.62) · NOW one equal gap apart, NOW ending on the panel's last column; at the right the magnifier first, then − + FIT side by side (notes 2, 18 Oct 2026), FIT a word with NOW's padding (#315) (${JSON.stringify(fits)})`);
{ // the bar's time, second look (#306, 4.45.5): the figures tracked +0.04em, AM · PM 5.5 each side, NOW filled light with a dark word
  const look = await page.evaluate(() => { const c = (q) => getComputedStyle(document.querySelector(q)); return [c("#time").letterSpacing, c("#ampm").paddingLeft, c("#ampm").paddingRight, c("#now").backgroundColor, c("#now").color]; });
  check(look.join(" ") === "0.8px 5.5px 5.5px color(srgb 0.360784 0.360784 0.360784) rgb(212, 212, 207)", `the bar's time: its figures tracked +0.04em, AM · PM closer to its word, NOW filled 20 % darker than AM's outline (#5C5C5C) with its word the light rule tone, not white (${look.join(" · ")}) (#306, #307)`);
}
await shot("7b-bar");
await enter_value("#time", "3:20:10");
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
  check(e.pinned === "Export a file" && e.order === "export-pdf | export-svg | global-out-live-text-Keep-numerals-as-text-in-the-SVG | export-png | global-out-dpi-dpi-slider | row note under | export-wearos | wearos-name | row note under" && e.pdf === e.svg && e.png === e.pdf && e.pdf > e.label && e.tick === e.svg && e.lines === "211101101" && e.halves === "010110110" && e.below === "Print · Link to this dial · Settings file · Log · Gallery",
    `Export a file is pinned: Vector · PDF, SVG under it with its tick tied to it, then PNG on the same column with its dpi under it, then Wear OS's APK with its name under it (4.67); a half line, from the buttons' column, before each nested row (the tick, the dpi, its note: ${e.lines} ${e.halves}); below scroll ${e.below}`);
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
await page.click("#plain");
await page.waitForFunction(() => window.dial_tool.statik);
check(await S("S.ha_hour.round === 0"), "Plain dial clears them");
await page.setInputFiles("#load-file", saved);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2);
const after_load = await S("JSON.stringify({ ...S, ui_section: 0 })");
check(after_load === JSON.stringify({ ...JSON.parse(before_save), ui_section: 0 }), "Load… brings every setting back");
{ // after Load the pane names the file and Save… offers that name again; a sentence says what a settings file is (Okay, 16 Oct 2026, #279)
  const named = await page.evaluate(() => [...document.querySelectorAll(".pane h2")].map((h) => h.textContent).find((t) => t.startsWith("Settings file")));
  const again = await download("#save");
  check(named === `Settings file · ${path.basename(saved)}` && path.basename(again) === path.basename(saved) && /keeps this dial with every value/.test(await page.textContent("#settings-note")),
    `after Load the pane names the file (${named}) and Save… offers that name again (${path.basename(again)}); a sentence says what a settings file is`);
}
await page.reload();
await page.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
check(await S("S.ha_hour.round === 2"), "the last session is back after closing and reopening the page");
await shot("8-reopened");

// ── examples: the five first dials, now in the Gallery, each a link ──
await tab("Export");
{ const names = await page.$$eval(".gallery a", (a) => a.map((x) => x.querySelector("span").textContent)), lights = await page.$$eval(".gallery a", (a) => a.map((x) => x.dataset.light === "true"));
  const zig = lights.map((l, i) => [l, i]).filter(([l]) => l).map(([, i]) => i), slots = [2, 4, 6, 10, 14, 16, 18, 22].filter((s) => s < names.length - 1);
  check(names[0] === "First dial" && names.at(-1) === "Okay's watch" && ["Field", "Diver", "Bauhaus", "Sector", "Gauge"].every((n) => names.includes(n)) && slots.every((s) => lights[s]), `the Gallery (#286, 4.49): the First dial first, Okay's watch last, the five first examples among its own dials, the white dials on the diagonals (${zig.join(" ")}; ${names.join(" · ")})`); }
const example = await page.getAttribute('.gallery a:has-text("Diver") >> nth=-1', "href");
await page.click('.gallery a:has-text("Diver") >> nth=-1');
{ // a card walks into focus first (#289, 4.49): lifted, with its two choices; the first opens it here
  const f = await page.evaluate(() => { const a = [...document.querySelectorAll(".gallery a")].filter((x) => x.textContent.includes("Diver")).at(-1), b = [...a.querySelectorAll(".choices button")]; return [a.classList.contains("focus"), getComputedStyle(a).outlineWidth, b.map((x) => x.textContent).join(" · "), getComputedStyle(a.querySelector(".choices")).display, window.dial_tool.S.rings.length]; });
    const rows = await page.evaluate(() => { const a = [...document.querySelectorAll(".gallery a")].filter((x) => x.textContent.includes("Diver")).at(-1), next = [...a.parentElement.children].indexOf(a) + 3, below = a.parentElement.children[next]; return below ? Math.round(below.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null; });
  check(f[0] && f[1] === "0px" && f[2] === "Edit this dial · In a new tab" && f[3] === "grid" && (rows === null || rows >= 0), `a press on a card fills it with the chosen tint, no line round it, its two choices (${f[2]}) growing down over the row under it, the rows staying put (notes 2, 18 Oct 2026); the dial is not taken yet (${f.join(" · ")})`);
  await page.click('.gallery a:has-text("Diver") >> nth=-1 >> text=Edit this dial'); }
await page.waitForFunction((h) => location.hash === h && window.dial_tool.statik && window.dial_tool.S.ui_section === 4, example, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(700);
check(await page.evaluate((h) => location.hash === h, example) && await S("t.log_lines.slice(0, 3).every((l) => !l.includes('stands in'))"), "clicking Diver opens it: the address is its link and its fonts are drawn");
await shot("9-example");
await page.setInputFiles("#load-file", saved);
await page.waitForFunction(() => window.dial_tool.S.ha_hour.round === 2);

// ── a dial as a link ──
await context.grantPermissions(["local-fonts", "clipboard-read", "clipboard-write"]).catch(() => {});
await tab("Export");
await page.evaluate(() => window.dial_tool.set_value("global", "ha_beat", 1));      // quartz: the beat travels in the link too (Okay, 16 Oct 2026, #277)
await page.waitForTimeout(300);
await page.click("#copy-link");
await page.waitForFunction(() => window.dial_tool.log_lines[0].includes("link copied"), null, { timeout: 5000 }).catch(() => {});
const link = await page.evaluate(() => location.href);
{ // the link on one line, cut at the box's edge; Copy link with its sign, flush right on the pane's heading line (#277)
  const l = await page.evaluate(() => { const box = document.getElementById("link"), c = getComputedStyle(box), b = document.getElementById("copy-link"), fold = b.closest(".pane").querySelector(".fold").getBoundingClientRect(), r = b.getBoundingClientRect();
    return { input: box.tagName === "INPUT", cut: c.textOverflow === "ellipsis" && c.whiteSpace === "nowrap", head: r.top >= fold.top && r.bottom <= fold.bottom, right: Math.round(fold.right - r.right), sign: Boolean(b.querySelector("svg")), mono: getComputedStyle(document.getElementById("log")).fontFamily.toLowerCase().includes("mono") }; });
  check(await page.inputValue("#link") === link && l.input && l.cut && l.head && l.right <= 1 && l.sign && l.mono, `the link stands on one line, cut at the box's edge; Copy link, with its sign, flush right on the heading line (${JSON.stringify(l)}); the log is monospaced`);
}
check(/#2[0-9A-Z]+$/.test(link), `Copy link: the address carries the dial in capitals and digits only, link scheme 2 (#278; ${link.split("#")[1].length} characters after #)`);
const wanted = await S("JSON.stringify({ ...S, ui_section: 0, ui_ring: 0, ui_hand: 0 })");
const other = await (await visitor()).newPage();      // someone else's browser: no last session of this dial. A browser of its own, not a second tab: a tab shares the first one's storage, where the first keeps saving its dial while its clock runs (found 16 Oct 2026, 4.42.5: a save landed while this page started)
await other.addInitScript(() => localStorage.removeItem("dial-tool-last"));      // and what it keeps itself between the addresses below
await other.goto(link);
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
const got = await other.evaluate(() => JSON.stringify({ ...window.dial_tool.S, ui_section: 0, ui_ring: 0, ui_hand: 0 }));
{
  // the same within what a link rounds (#246): a number to 3 decimals, a colour to hex, the time to the second (test/linktrip.mjs)
  const apart = (a, b, at = "") => typeof a === "number" && typeof b === "number" ? (Math.abs(a - b) <= (at === ".t" ? 0.5 : 0.5 / 255 + 0.5e-4) ? [] : [at])
    : Array.isArray(a) && Array.isArray(b) ? (a.length === b.length ? a.flatMap((x, i) => apart(x, b[i], `${at}[${i}]`)) : [at])
    : a && b && typeof a === "object" && typeof b === "object" ? [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((k) => apart(a[k], b[k], `${at}.${k}`))
    : JSON.stringify(a) === JSON.stringify(b) ? [] : [at];
  const off = apart(JSON.parse(wanted), JSON.parse(got));
  check(off.length === 0 && JSON.parse(got).ha_beat === 1, `opening the link elsewhere gives the same dial, every setting within a link's rounding, the beat too (quartz)${off.length ? " — " + off.slice(0, 5).join(" ") : ""}`);
}
await page.evaluate(() => window.dial_tool.set_value("global", "ha_beat", 0));
// a link of scheme 1 (until 4.42.5; Okay's first B-Uhr link, 15 Oct 2026, 09:39) is not read any more (R31 as replaced,
// 16 Oct 2026): the First dial opens, and a note says why, on the preview and in the log
const OLD_LINK = "#1.lVTJjtswDP0VQ2ePocXyduyh7aWXorfBwNDYmkSIYhteJp0GBvoP_cN-SSlZXhIk0_Zi07T4-PhI8YxKJXReooyFPtoNqpQdyl6E7qSPirzRopcoe8QBjnHk44ASHsOLRGHskycftaraQcDjGR1UBSjER5U4Qgj61ipR7bT0RO8RigANjhGIjRMDMUVDAA8i-FcPVW-ju71opLW0rFAWBgn30QllFHL6qIefEIQhFCLKvB4gCgeMzw5VmW8ajv4NRqfaK-u-u-ASsg2XKCALFwpcetGC9RCD2QhAJqDRoaqLA8i1UKWWHwkwWZOyJennemi9QrWFli4vDlLuzw86505N6pMq-70pgEQGy0F8UdXQy-7dcKAeLtQj0Kc7qMbyWPlaQUkw8QWRVrr0gu4mE04TSBPyML1oOspik65TP6TtDMj_Io5KvwHCV-iJLL1Pdb9XBSA13eJ0vlt5XY0e__3zF-cLgShMTZsiGtty8VovsYMxzw1ZmsXw3CyGwdTiWWpgAC2shmP-0tZHlPGZumnTUO7AOiNiHiVAP8A8jT5i228OjvjakVw70o2Dj-N_i-K0-KhepXf856ZPnZ4vDA1i119zKfqT1K-m0Fuj-UFUpVfUzduaxPbZPSlcuDlReKH2dlBjtzXg416Ov8Nvh_cuOpzdi_xZiukQ2IUwhdvYyb4_snB6D6NtGrReWytY4i4ENdtFaQNoFo3RlNrV5GApwCVJxOZxJE-jhZ0adQMYRIvcauArduKwmUl7hR1dY3eyqI2eZ4fITa3T5Z0RZ-HMWiR2fd2XAUDNdoh5GlDGeUoZCTHMFNqVufi-LP7xDw";
await other.goto(link.split("#")[0] + OLD_LINK);
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
{
  const o = await other.evaluate(() => { const t = window.dial_tool, n = document.getElementById("preview-note"), r = n.getBoundingClientRect(), m = document.querySelector("main").getBoundingClientRect();
    return { d: t.S.dial_d, rings: t.S.rings.map((x) => x.name).join(" · "), shown: !n.hidden, note: n.textContent, inside: r.left >= m.left && r.right <= m.right, centred: Math.abs((r.left + r.right) / 2 - (m.left + m.right) / 2) < 1, log: t.log_lines.some((l) => l.includes("older Dial Tool") && l.includes("scheme 1")) }; });
  await other.screenshot({ path: path.join(OUT, "9b-old-link.png") });
  await other.click("#preview-note");
  const gone = await other.evaluate(() => document.getElementById("preview-note").hidden);
  check(o.d === 34 && o.rings === "Numerals · Markers · Minute ticks" && o.shown && /older Dial Tool/.test(o.note) && o.inside && o.centred && o.log && gone,
    `a scheme-1 link opens the First dial (${o.d} mm), and says so on the preview ("${o.note}", centred) and in the log; a press puts the note away`);
}
await other.goto(link.split("#")[0] + "#2NOTADIAL");
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
check(await other.evaluate(() => window.dial_tool.S.rings.length > 0), "a broken link opens the tool anyway");
await other.goto(link.split("#")[0]);
await other.waitForFunction(() => window.dial_tool && window.dial_tool.statik);
const opener = await other.evaluate(() => [window.dial_tool.S.dial_d, window.dial_tool.S.rings.map((r) => r.name).join(" · ")]);
check(opener[0] === 34 && opener[1] === "Numerals · Markers · Minute ticks", `no dial in the address and no last session: it opens with the guide's First dial (${opener[0]} mm: ${opener[1]})`);
{ // Reset, last in the Dial tab under Colours, its warning under it; not on the preview (Okay, 16 Oct 2026, 10:46: "Not under the dial like a view option! That is dangerous")
  await other.evaluate(() => { const t = window.dial_tool; t.set_value("global", "dial_d", 25); });
  await other.waitForTimeout(700);
  await other.click('button[data-tab="Dial"]'); await other.waitForTimeout(300);
  const r = await other.evaluate(() => { const b = document.getElementById("reset"), panes = [...document.querySelectorAll(".form .pane")], last = panes.at(-1), before = panes.at(-2);
    return { inPreview: !!document.querySelector("main #reset"), lastPane: last && last.contains(b), afterColours: before && before.textContent.trim().startsWith("Colours"), warn: (document.getElementById("reset-warning") || {}).textContent || "", described: b.getAttribute("aria-describedby") === "reset-warning" }; });
  await other.click("#reset"); await other.waitForTimeout(500);
  const back = await other.evaluate(() => [window.dial_tool.S.dial_d, window.dial_tool.S.rings.map((x) => x.name).join(" · ")]);
  await other.click("#undo"); await other.waitForTimeout(500);
  const undone = await other.evaluate(() => window.dial_tool.S.dial_d);
  check(!r.inPreview && r.lastPane && r.afterColours && /Replaces everything/.test(r.warn) && r.described && back[0] === 34 && back[1] === "Numerals · Markers · Minute ticks" && undone === 25,
    `Reset: last in the Dial tab, after Colours, not on the preview, its warning under it (${JSON.stringify(r)}); brings back the opener (${back.join(", ")}); undo brings back 25 mm (${undone})`);
}
await other.context().close();
{ // a first visit, in a browser that has kept nothing (Okay, 16 Oct 2026, #270): in every tab the pinned panes open and every pane under them folded, but the one a tab is about when only tabs are pinned (a hand, a window). Folded, Colours shows the colours it lists as tiny swatches (#268); Reset says Reset alone, and open, its button stands on its heading line (#269). Custom labels say how they work (#298)
  const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await fresh.route("https://duztman.github.io/dial-tool/fonts/**", (route) => route.fulfill({ path: "fonts/" + decodeURIComponent(route.request().url().split("/fonts/")[1]), headers: { "access-control-allow-origin": "*" } }));
  const p = await fresh.newPage();
  await p.goto("file://" + process.cwd() + "/dial-tool.html");
  await p.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
  const panes = async (name) => { await p.click(`button[data-tab="${name}"]`); await p.waitForTimeout(200); return p.$$eval(".pane", (ps) => ps.filter((x) => x.offsetParent).map((x) => ({ name: x.querySelector("h2").textContent.trim(), pinned: Boolean(x.closest(".pinned")), shut: x.classList.contains("folded") }))); };
  const seen = {}, wrong = [];
  for (const name of ["Dial", "Rings", "Hands", "Date", "Export"]) {
    seen[name] = await panes(name);
    const loose = seen[name].filter((x) => !x.pinned), main = (name === "Hands" || name === "Date") ? loose[0] : null;
    for (const x of seen[name]) if (x.shut !== (!x.pinned && x !== main)) wrong.push(`${name}/${x.name}`);
  }
  await p.click('button[data-tab="Dial"]'); await p.waitForTimeout(200);
  const colours = await p.evaluate(() => { const pane = [...document.querySelectorAll(".form .pane")].find((x) => x.querySelector("h2").textContent.trim() === "Colours"); return [pane.querySelectorAll(".fold .summary .dot.tiny").length, window.dial_tool.dial_colours(false).length]; });
  const reset_shut = await p.isHidden("#reset");
  await p.click('.form .pane:has(#reset) .fold'); await p.waitForTimeout(300);
  const reset_open = await p.evaluate(() => { const b = document.getElementById("reset").getBoundingClientRect(), f = document.querySelector(".form .pane:has(#reset) .fold").getBoundingClientRect(); return [b.height > 0 && b.top >= f.top && b.bottom <= f.bottom, Math.round(document.getElementById("reset-warning").getBoundingClientRect().left - b.left)]; });
  await p.click('button[data-tab="Rings"]'); await p.waitForTimeout(200);
  await p.evaluate(() => [...document.querySelectorAll(".form .pane")].find((x) => x.querySelector("h2").textContent.trim() === "Numerals").querySelector(".fold").click()); await p.waitForTimeout(300);
  await p.selectOption("#ring-labels-Labels", { label: "Custom" }); await p.waitForTimeout(300);
  const hint = await p.evaluate(() => [...document.querySelectorAll(".form .row.note")].filter((n) => n.offsetParent).map((n) => n.textContent).join(" | "));
  // Export: Copy link stays on its folded pane's heading line; Defaults gives the guide's First dial, Plain dial the plain starting values (#277, #279)
  await p.click('button[data-tab="Export"]'); await p.waitForTimeout(200);
  const copy_folded = await p.isVisible("#copy-link") && await p.evaluate(() => document.getElementById("copy-link").closest(".pane").classList.contains("folded"));
  await p.evaluate(() => window.dial_tool.set_value("global", "dial_d", 25)); await p.waitForTimeout(300);
  await p.click(".form .pane:has(#defaults) .fold"); await p.waitForTimeout(300);
  await p.click("#defaults"); await p.waitForTimeout(500);
  const defaults = await p.evaluate(() => [window.dial_tool.S.dial_d, window.dial_tool.S.rings.map((r) => r.name).join(" · ")]);
  await p.click("#plain"); await p.waitForTimeout(500);
  const plain = await p.evaluate(() => location.hash);
  if (!(copy_folded && defaults[0] === 34 && defaults[1] === "Numerals · Markers · Minute ticks" && plain.length < 12)) wrong.push(`Export: copy on the folded line ${copy_folded}, Defaults ${defaults.join(" ")}, Plain dial ${plain}`);
  await fresh.close();
  check(!wrong.length && colours[0] > 0 && colours[0] === colours[1] && reset_shut && reset_open[0] && reset_open[1] === 0 && /Commas between labels/.test(hint),
    `a first visit: pinned panes open, the rest folded but a hand's and a window's pane (${wrong.length ? "wrong: " + wrong.join(", ") : Object.entries(seen).map(([k, v]) => k + ": " + v.map((x) => x.name + (x.shut ? " ▸" : " ▾")).join(", ")).join(" · ")}); folded Colours shows its ${colours[0]} colours as swatches; Reset folded says Reset alone, open its button stands on its heading line flush left with its warning (${reset_open[1]} apart; 4.44.2); Custom labels say how they work; Copy link stays on its folded line, Defaults gives the First dial, Plain dial the plain start`);
}
await page.click("#plain");
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
// #84: the time from the keyboard; #163: a hand's colour has an opacity strip; #152: two fingers pinch without a jump
{
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.dial_tool.set_time(36000); });
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("Shift+ArrowLeft");
  const t1 = await S("S.t");
  await page.keyboard.press(" "); const playing = await S("t.playing"); await page.keyboard.press(" ");
  check(t1 === 36000 + 60 - 3600 && playing && !(await S("t.playing")), `→ a minute, ⇧← an hour back (${t1}), space plays and pauses`);
  const hand_alpha = await page.evaluate(() => { const t = window.dial_tool; return t.colour_of_row({ scope: "hand", key: "c" }).alpha; });
  check(hand_alpha === true, "a hand's colour can be see-through: the pop-out shows the opacity strip");
  const r = await page.evaluate(() => { const b = window.dial_tool.svg.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  const before = await S("[t.z, t.c[0], t.c[1]]");
  const send = (type, id, x, y) => page.evaluate(([type, id, x, y]) => window.dial_tool.svg.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: "touch", clientX: x, clientY: y, bubbles: true, isPrimary: id === 11 })), [type, id, x, y]);
  await page.evaluate(() => { const s = window.dial_tool.svg; s.setPointerCapture = () => {}; });
  await send("pointerdown", 11, r[0] - 50, r[1]); await send("pointerdown", 12, r[0] + 50, r[1]);
  const landed = await S("[t.z, t.c[0], t.c[1]]");
  await send("pointermove", 11, r[0] - 100, r[1]); await send("pointermove", 12, r[0] + 100, r[1]);
  const after = await S("[t.z, t.c[0], t.c[1]]");
  await send("pointerup", 11, r[0] - 100, r[1]); await send("pointerup", 12, r[0] + 100, r[1]);
  check(landed.every((v, i) => v === before[i]) && Math.abs(after[0] / before[0] - 2) < 0.01, `a second finger landing moves nothing; spreading them twice as far zooms ×${(after[0] / before[0]).toFixed(2)}`);
  await page.evaluate(() => window.dial_tool.fit && window.dial_tool.fit());
}
// #165: the centre hole shows only with the hands hidden; a production mask has its cut line · #164: a disc hand
{
  const plate_is = (which) => page.evaluate((w) => { const t = window.dial_tool, p = t.items.find((i) => i.role === "plate"); return p.path === t.statik[w]; }, which);
  const was_on = await S("S.ha_on");
  await page.evaluate(() => { window.dial_tool.S.ha_on = true; window.dial_tool.render(); }); await frame();
  const under = await plate_is("plate") && await S("Boolean(t.statik.hole) && S.dial_hole === 2.7");
  await page.evaluate(() => { window.dial_tool.S.ha_on = false; window.dial_tool.render(); }); await frame();
  const shows = await plate_is("plate_holed");
  await page.evaluate((w) => { window.dial_tool.S.ha_on = w; window.dial_tool.render(); }, was_on); await frame();
  check(under && shows, "the centre hole (Ø 2.7) is under the hands, and shows when they are hidden");
  const was_hour = await S("JSON.stringify(S.ha_hour)");
  await page.evaluate(() => { const t = window.dial_tool; Object.assign(t.S.ha_hour, { on: true, shape: 10, len: 3, disc_d: 8, mark: 0, mark_len: 1.5, mark_w: 0.6 }); t.S.ha_on = true; t.static_dirty = true; t.render(); }); await frame();
  const disc = await page.evaluate(() => { const b = window.dial_tool.items.find((i) => i.role === "hand" && i.name === "hour").path.bounds(); return [b[2] - b[0], b[3] - b[1]]; });
  await page.evaluate((h) => { const t = window.dial_tool; t.S.ha_hour = JSON.parse(h); t.static_dirty = true; t.render(); }, was_hour); await frame();
  check(Math.abs(disc[0] - 8) < 0.01 && Math.abs(disc[1] - 8) < 0.01, `a disc hand is its disc, the marker cut into it (${disc.map((v) => v.toFixed(2)).join(" × ")} mm)`);
  // the marker painted on instead (#300, 4.45.4): the disc whole, the marker an item of its own right after it, in its
  // own colour, turning with it; as a hole, no such item and the disc has the hole
  const disc_mark = (as) => page.evaluate((as) => { const t = window.dial_tool; Object.assign(t.S.ha_hour, { on: true, shape: 10, len: 3, disc_d: 8, mark: 0, mark_len: 1.5, mark_w: 0.6, mark_as: as, mark_c: [0.8, 0.2, 0.1, 1] }); t.S.ha_on = true; t.static_dirty = true; t.render(); t.draw();
    const hand = t.items.find((i) => i.role === "hand" && i.name === "hour"), mark = t.items.find((i) => i.role === "mark" && i.name === "hour");
    return [hand.path.d.filter((c) => c[0] === "M").length, !!mark && t.items[t.items.indexOf(hand) + 1] === mark && mark.angle === hand.angle, mark ? mark.fill.join() : ""]; }, as);
  const holed = await disc_mark(0), painted = await disc_mark(1);
  await page.evaluate((h) => { const t = window.dial_tool; t.S.ha_hour = JSON.parse(h); t.static_dirty = true; t.render(); }, was_hour); await frame();
  check(holed[0] === 2 && !holed[1] && painted[0] === 1 && painted[1] && painted[2] === "0.8,0.2,0.1,1", `a disc's marker as a hole: two outlines (${holed[0]}), no mark; as a mark: the disc whole (${painted[0]}), the marker painted on it in its colour, turning with it (#300)`);
}
check(errors.length === 0, "no errors in the browser's console" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
// ── the gallery: under everything else in Export; a card opens its dial ──
await tab("Export");
{
  const g = await page.evaluate(() => { const panes = [...document.querySelectorAll(".form .pane h2")].map((h) => h.textContent), cards = [...document.querySelectorAll(".gallery a")]; return { last: panes.at(-1), n: cards.length, names: cards.map((c) => c.querySelector("span").textContent).join(" · "), pictures: cards.every((c) => c.querySelector("svg path")), across: new Set(cards.slice(0, 3).map((c) => Math.round(c.getBoundingClientRect().top))).size }; });
  check(g.last === "Gallery" && g.n >= 6 && g.pictures && g.across === 1, `the Gallery is the last pane of Export: ${g.n} dials, three to a line (${g.names})`);
  check(g.names.startsWith("First dial · ") && g.names.endsWith(" · Okay's watch"), "the Gallery opens with the First dial and ends with Okay's watch (#286; the other way round from 15 Oct to 4.48)");
  { // Help (#230; Okay, 15 Oct 2026, 12:50: "next to beta number same font but underlined"): the guide, in a new tab
    const h = await page.evaluate(() => { const a = [...document.querySelectorAll(".panel .title a")].find((e) => e.textContent === "Help"), v = document.querySelector(".panel .title .quiet"), sa = a && getComputedStyle(a), sv = getComputedStyle(v);
      return a && { href: a.href, blank: a.target === "_blank", after: v.nextElementSibling === a, same: sa.fontFamily === sv.fontFamily && sa.fontSize === sv.fontSize && sa.color === sv.color, under: sa.textDecorationLine.includes("underline") }; });
    check(h && h.href === "https://duztman.github.io/dial-tool/guide/" && h.blank && h.after && h.same && h.under, `Help beside the version, in its type and colour, underlined, opens the guide in a new tab (${JSON.stringify(h)})`);
  }
  { // the way to the Gallery from the panel's top line: right after Help, as far from it as Help is from the version, as high as the unit box, darker than it and lighter than Help (Okay, 16 Oct 2026, #285; centred between Help and the unit box from 15 Oct, 07:45); pressed, Export with the Gallery in view
    await tab("Dial");
    const w = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), version = r(".mast .title > .quiet:not(.help)"), help = r(".mast .help"), u = r("#unit"), p = r("#to-gallery");
      const shade = (q) => { const s = getComputedStyle(document.querySelector(q)).color, n = s.match(/[\d.]+/g).map(Number), rgb = (s.startsWith("color(") ? n.slice(0, 3).map((x) => x * 255) : n.slice(0, 3)), a = n.length > 3 ? n[3] : 1; return Math.round((rgb[0] + rgb[1] + rgb[2]) / 3 * a + 251.3 * (1 - a)); };      // how light it reads on the paper
      const uc = getComputedStyle(document.querySelector("#unit"));
      return { gaps: [+(help.left - version.right).toFixed(2), +(p.left - help.right).toFixed(2)], high: p.height > u.height && uc.fontFamily.startsWith('"Dial Mono"') && document.fonts.check('10px "Dial Mono"') && uc.textTransform === "none" && uc.paddingTop === "4px" && uc.paddingLeft === "4px" && uc.borderTopColor === uc.color, shades: [shade("#unit"), shade("#to-gallery"), shade(".mast .help")] }; });
    await page.click("#to-gallery"); await page.waitForTimeout(900);
    const at = await page.evaluate(() => { const g = document.querySelector(".gallery").getBoundingClientRect(), f = document.querySelector(".form").getBoundingClientRect(); return [window.dial_tool.S.ui_section, g.top < f.bottom && g.bottom > f.top]; });
    check(Math.abs(w.gaps[0] - w.gaps[1]) < 0.6 && w.high && w.shades[0] > w.shades[1] && w.shades[1] > w.shades[2] && at[0] === 4 && at[1], `the Gallery pill: right after Help, as far from it as Help from the version (${w.gaps.join(" · ")}), taller than the unit box, whose word is in Dial Mono (packed), small letters, 4 px all round mm, its line the word's colour (#302), darker than mm and lighter than Help (${w.shades.join(" > ")}); pressed, Export with the Gallery in view`);
  }
  { // see-through shadows (Okay, 16 Oct 2026, #295): a see-through hand casts a lighter shadow, in its colour; a solid one as it always did; each multiplied onto the plate
    const s = await page.evaluate(async () => { const t = window.dial_tool, was = t.S.ha_minute.c.slice(); t.S.ha_minute.c = [1, 0, 0, 0.5]; t.changed(); t.render(); await new Promise((r) => setTimeout(r, 400));
      const g = document.querySelector('.preview g[clip-path="url(#shadow-clip-plate)"]'), fills = g ? [...g.querySelectorAll("path")].map((x) => x.getAttribute("fill")) : [];
      const blend = g ? getComputedStyle(g).mixBlendMode : ""; t.S.ha_minute.c = was; t.changed(); t.render(); return { fills, blend, dark: t.S.sh_dark, on: t.S.sh_on }; });
    const solid = `rgb(${Array(3).fill(Math.round(255 * (1 - s.dark / 100))).join(", ")})`, red = s.fills.find((f) => f !== solid) || "";
    const [cr, cg, cb] = (red.match(/\d+/g) || []).map(Number);
    check(s.on && s.blend === "multiply" && s.fills.includes(solid) && cr > cg && cg === cb && cg > Math.round(255 * (1 - s.dark / 100)), `a see-through red hand's shadow is lighter and red (${red}), a solid hand's as before (${solid}), multiplied onto the plate (${s.blend})`);
  }
  check(await page.evaluate(() => JSON.parse(localStorage.getItem("dial-tool-folds") || "{}")["Export/Export a file"] === true) && !(await page.isVisible("#export-pdf")), "the Gallery pill shuts the eye of Export a file, so the Gallery has the room (Okay, 15 Oct 2026, 10:47)");
  { const f = JSON.parse(await page.evaluate(() => localStorage.getItem("dial-tool-folds") || "{}")); delete f["Export/Export a file"]; await page.evaluate((x) => { localStorage.setItem("dial-tool-folds", x); window.dial_tool.folds = JSON.parse(x); window.dial_tool.show_section(); }, JSON.stringify(f)); }      // open again for the checks after
  await page.$eval(".gallery", (e) => e.scrollIntoView());
  await shot("4c13-gallery");
  const before = await S("JSON.stringify(S.rings.map((r) => r.name))");
  await page.click(".gallery a >> text=Montgomery");      // by its name: the cards' order changes (Bauhaus third, 4.41.14; the zigzag, 4.49)
  await page.click('.gallery a:has-text("Montgomery") >> text=Edit this dial');      // the card walks into focus first (#289, 4.49)
  await page.waitForFunction((b) => JSON.stringify(window.dial_tool.S.rings.map((r) => r.name)) !== b, before);
  check(await S("S.rings[0].name === 'Every fifth minute' && S.dial_d === 38"), "a card opens its dial: Montgomery, 38 mm, every fifth minute on top");
  await frame(); await shot("4c14-gallery-montgomery");
  await page.waitForTimeout(550);
  await page.keyboard.press("Control+z");
  check(await S("JSON.stringify(S.rings.map((r) => r.name))") === before, "and ⌘Z brings the dial that was there back");
}

// ── the bar (Okay, 14 Oct 2026, 23:19, #190), and a phone ──
{ // the speed box clears its thumb at either end as much as above and below it; mm as light as a dead switch (Okay, 15 Oct 2026, 03:18)
  const m = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), box = r(".bar .speeds"), track = r(".bar .speedtrack"), c = getComputedStyle(document.querySelector("#unit"));
    const thumb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--speed-thumb"));
    return { side: [+(track.left - box.left - 1).toFixed(2), +(box.right - 1 - track.right).toFixed(2)], top: (box.height - 2 - thumb) / 2, unit: [c.color, c.borderTopColor] }; });
  check(m.side[0] === m.top && m.side[1] === m.top && m.unit[0] === m.unit[1],
    `the speed thumb at an end stands as far from the box's wall (${m.side.join(" · ")}) as from its top (${m.top}); mm's word and line one light colour (${m.unit[0]})`);
}
const look = await page.evaluate(() => { const q = (s) => document.querySelector(s), r = (s) => q(s).getBoundingClientRect(), c = (s) => getComputedStyle(q(s));
  return { square: !q("#panel-toggle"), bar: Math.round(r(".bar").height), play: [Math.round(r("#play").width), Math.round(r("#play").height), c("#play").borderRadius], time: c("#time").fontFamily.startsWith('"Dial Time"') && document.fonts.check('300 17px "Dial Time"'),
    status: c(".bar .status").display, hint: q(".zoomsign").dataset.tip, first: q(".viewing").children[1] === q(".zoomsign") && q(".zooms").lastElementChild === q("#fit"), ruler: Math.round(r("#time-slider").width) }; });
check(look.square && look.bar === 62 && look.play[0] === look.play[1] && look.play[2] === "50%" && look.time && look.status === "none" && look.hint.includes("⌘ + scroll") && look.first && look.ruler <= 518,
  `the bar: a fifth higher (${look.bar}), no panel square, a round play, the time in Dial Time (Barlow Condensed Light, #284), no status line, the magnifier first with how to zoom in its tag, then − + FIT together (notes 2, 18 Oct 2026), the day slider no wider than an iPad's (${look.ruler})`);
{ // the needle (notes 2, 18 Oct 2026: "Ruler pin does not move on bottom bar"; "1px wide and red, starts from the bottom of
  // the screen"): placed from the time, whatever has the focus; a press and a drag on the strip set the time (an iPad's own
  // range control did not scrub)
  await page.focus("#time-slider");
  const n0 = await page.evaluate(() => document.querySelector(".needle").getBoundingClientRect().left);
  await page.evaluate(() => window.dial_tool.set_time(3 * 3600));
  const n = await page.evaluate(() => { const e = document.querySelector(".needle"), r = e.getBoundingClientRect(), c = getComputedStyle(e), bar = document.querySelector(".bar").getBoundingClientRect(); return [r.left, r.width, c.backgroundColor, Math.round(bar.bottom - r.bottom)]; });
  const s = await page.locator("#time-slider").boundingBox();
  await page.mouse.move(s.x + s.width * 0.25, s.y + s.height / 2); await page.mouse.down(); await page.mouse.move(s.x + s.width * 0.75, s.y + s.height / 2, { steps: 6 }); await page.mouse.up();
  const dragged = await S("Math.round(S.t % 43200)");
  check(Math.abs(n[0] - n0) > 20 && n[1] === 1 && n[2] === "rgb(204, 56, 26)" && n[3] === 0 && Math.abs(dragged - 32400) < 120,
    `the needle follows the time with the slider focused (${Math.round(n0)} → ${Math.round(n[0])}), 1 wide, red (${n[2]}), down to the bar's foot (${n[3]}); dragged to three quarters the time is ${dragged} s (9:00)`);
  await page.evaluate(() => window.dial_tool.set_time(10 * 3600 + 600));
}
await shot("10-bar");
{ // the showcase (Okay, 15 Oct 2026, 04:26, reshaped 04:59 and 05:09)
  const q = () => page.evaluate(() => { const t = window.dial_tool, r = (s) => document.querySelector(s).getBoundingClientRect(), c = (s) => getComputedStyle(document.querySelector(s));
    return { show: !!t.show, w: innerWidth, h: innerHeight, z: t.z, dial: t.z * t.S.dial_d, c: t.c.slice(), moving: t.moving(), playing: t.playing, speed: t.speed, t: t.S.t, phase: t.show ? t.show.phase : null, from: t.show ? t.sun().from : null,
      bar: c(".bar").visibility, guides: c(".guides").visibility, open: document.querySelector(".irisbox").getAttribute("aria-expanded"), words: Math.round(r("#iris-go").width),
      iris: [Math.round(r(".irisbox").right), Math.round(r(".irisbox").bottom), r(".irisbox").top + r(".irisbox").height / 2], x: c(".irisbox .x").display, pill: [r("#show-now").left + r("#show-now").width / 2, r("#show-now").top + r("#show-now").height / 2, Math.round(r("#show-now").width), r("#show-now").right],
      mast: [c(".mast").opacity, c(".mast").pointerEvents], sky: c(".sky").opacity, guide_items: t.items.filter((i) => i.role === "guide").length,
      soft: [...document.querySelectorAll('.preview g[clip-path^="url(#shadow-clip"]')].some((g) => g.getAttribute("filter")), letter: c("#show-now").letterSpacing,
      gap: Math.round(r("#eye-box").bottom) === Math.round(r(".irisbox").bottom) ? r("#eye-box").left - r(".irisbox").right : -1, hint_mid: (() => { const h = r("#sun-hint"), m = r("main"), below = m.top + t.c[1] + t.S.dial_d / 2 * t.z, above = r("#show-now").top; return Math.abs(h.top + h.height / 2 - (below + above) / 2) < 1 && h.width === 108; })() }; });
  const before = await q();
  await page.click("#iris-box"); await page.waitForTimeout(400);
  const opened = await q();
  await page.click("#iris-go"); await page.waitForTimeout(150);
  const going = await q();
  await page.waitForTimeout(1300); await page.mouse.move(5, 300);
  const on = await q();
  await page.waitForTimeout(1000);
  const later = await q();
  await page.mouse.move(on.w / 4, on.h / 2); await page.mouse.down(); await page.mouse.move(on.w / 4 + 1, on.h / 2);
  const dragged = await q(); await page.mouse.up();
  await page.click("#show-now"); await page.waitForTimeout(300);
  const spinning = await q();
  await page.waitForTimeout(1700);
  const nowed = await q(), clock = await page.evaluate(() => { const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(); });
  await page.click("#show-now"); await page.waitForTimeout(2000);
  const unnowed = await q();
  await page.click("#iris-box"); await page.waitForTimeout(1300);
  const back = await q();
  const page_px = Math.min(on.w / 210, on.h / 297) * 210 * 2 / 3, inset = 24;
  const sc = [['!before.show', !before.show], ['before.gap === 5.5', before.gap === 5.5], ['on.hint_mid', on.hint_mid], ['opened.open === "true"', opened.open === "true"], ['opened.words > 100', opened.words > 100], ['!opened.show', !opened.show], ['going.show', going.show], ['going.moving', going.moving], ['going.bar === "hidden"', going.bar === "hidden"], ['Math.abs(on.dial - page_px) < 0.5', Math.abs(on.dial - page_px) < 0.5], ['Math.abs(on.c[0] - on.w / 2) < 0.5', Math.abs(on.c[0] - on.w / 2) < 0.5], ['Math.abs(on.c[1] - on.h / 2) < 0.5', Math.abs(on.c[1] - on.h / 2) < 0.5], ['!on.moving', !on.moving], ['on.soft', on.soft], ['on.playing', on.playing], ['on.speed === 1', on.speed === 1], ['on.guides === "hidden"', on.guides === "hidden"], ['on.guide_items === 0', on.guide_items === 0], ['on.iris[0] === on.w - inset', on.iris[0] === on.w - inset], ['on.iris[1] === on.h - inset', on.iris[1] === on.h - inset], ['on.x !== "none"', on.x !== "none"], ['Math.abs(on.pill[3] - (on.w - 5.5) / 2) < 1', Math.abs(on.pill[3] - (on.w - 5.5) / 2) < 1], ['Math.abs(on.pill[1] - on.iris[2]) < 0.5', Math.abs(on.pill[1] - on.iris[2]) < 0.5], ['on.mast.join() === "0.5,none"', on.mast.join() === "0.5,none"], ['on.sky === "1"', on.sky === "1"], ['on.letter === "1.5px"', on.letter === "1.5px"], ['Math.abs(later.phase - on.phase - 0.05) < 0.02', Math.abs(later.phase - on.phase - 0.05) < 0.02], ['Math.abs(dragged.phase - 0.25) < 0.01', Math.abs(dragged.phase - 0.25) < 0.01], ['Math.abs(dragged.from - 315) < 1', Math.abs(dragged.from - 315) < 1], ['spinning.moving', spinning.moving], ['nowed.pill[2] === 40', nowed.pill[2] === 40], ['Math.abs(nowed.t % 43200 - clock % 43200) < 5', Math.abs(nowed.t % 43200 - clock % 43200) < 5], ['unnowed.pill[2] === 80', unnowed.pill[2] === 80], ['Math.abs(unnowed.t - nowed.t) > 5', Math.abs(unnowed.t - nowed.t) > 5], ['!back.show', !back.show], ['Math.abs(back.z - before.z) < 0.01 && Math.abs(back.c[0] - before.c[0]) < 0.5', Math.abs(back.z - before.z) < 0.01], ['back.bar === "visible"', back.bar === "visible"], ['back.guides === "visible"', back.guides === "visible"], ['back.playing === before.playing', back.playing === before.playing]];
  check(sc.every((x) => x[1]),
    sc.filter((x) => !x[1]).map((x) => x[0]).join(' | ') + `the iris switch opens to ACTIVATE SHOWCASE (${opened.words} px), which alone goes in: the bar and switches gone at once, the dial travelling (${going.moving}) to 2/3 of an A4 fitted in the window (${on.dial.toFixed(1)} = ${page_px.toFixed(1)} px), centred, the soft edge back once still; the clock at 1×; the X at the corner, Now (tracked ${on.letter}) on its line; the sun crosses a day in twenty seconds (+${(later.phase - on.phase).toFixed(2)} a second), the arrow hint between the dial and Now and a drag puts it along it (a quarter across: ${dragged.from.toFixed(0)}°); Now spins the hands to now and shrinks to an undo (${nowed.pill[2]} px), which spins them back; the X goes back to where we were`);
  const mark = await page.evaluate(() => { const h = document.querySelector(".panel .title h1"), look = getComputedStyle(h), probe = document.createElement("span"); probe.style.cssText = "display:inline-block;width:0;height:0"; h.append(probe); const base = probe.getBoundingClientRect().top; probe.remove();
    const pen = document.createElement("canvas").getContext("2d"); pen.font = `${look.fontWeight} ${look.fontSize} ${look.fontFamily}`; const cap = pen.measureText("D").actualBoundingBoxAscent, ring = document.querySelector("#logo circle").getBoundingClientRect();
    return +((ring.top + ring.bottom) / 2 - (base - cap / 2)).toFixed(2); });
  check(Math.abs(mark) < 0.3, `the mark's ring is centred on the title's capitals (${mark} px off; Okay, 04:26: "align icon better")`);
}
{ // Okay's mark opens the bio; the eye switch, at the preview's bottom right, turns on and off and does nothing else (15 Oct 2026)
  const before = await S("JSON.stringify(S, (k, v) => (k.startsWith('ui_') || k === 't' ? undefined : v))");
  await page.click("#logo");
  const bio = await page.evaluate(() => { const b = document.querySelector("#bio"), r = b.getBoundingClientRect(), l = document.querySelector("#logo").getBoundingClientRect(), t = document.querySelector(".panel .title").getBoundingClientRect();
    return { shown: !b.hidden, links: [...b.querySelectorAll("a")].map((a) => a.textContent), logo_left: Math.round(l.left), title_left: Math.round(t.left),
      text_left: Math.round(b.querySelector("p").getBoundingClientRect().left), heads: b.querySelectorAll("h2").length,
      contact: b.querySelector("p:first-child a[href='#contact']")?.textContent, bare: /[\w.]+@[\w-]+\.\w+/.test(document.documentElement.outerHTML), turned: getComputedStyle(document.querySelector("#logo")).backgroundColor }; });
  await page.mouse.click(1300, 120);
  const shut = await page.isHidden("#bio");
  const eye_at = await page.evaluate(() => { const m = document.querySelector("main").getBoundingClientRect(), e = document.querySelector("#eye-box").getBoundingClientRect(), inset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--canvas-inset")); return Math.round(m.right - e.right) === inset && Math.round(m.bottom - e.bottom) === inset && document.querySelectorAll("#eye-box mask, #eye-box circle").length === 2; });
  // the dial alone (Okay, 15 Oct 2026, 04:02): the panel slides away, the bar stays, the mast stays, Backdrop and Shadows
  // stop on the mark's line, undo · redo after the title, the dial fitted in the whole preview; and back
  const where = () => page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), t = window.dial_tool;
    return { panel: Math.round(r(".panel").right), main: Math.round(r("main").left), mast: Math.round(r(".mast").left), title: Math.round(r(".panel .title").right), undo: Math.round(r(".undos").left), back: Math.round(r(".backdrops").left), shadows: Math.round(r(".shadows").left),
      bar: [Math.round(r(".bar").top), Math.round(r(".bar .lead").width)], fitted: t.fitted, centre: Math.round(t.c[0] - r("main").width / 2), fill: getComputedStyle(document.querySelector("#eye-box"), "::before").backgroundColor, z: t.z }; });
  const here = await where();
  await page.click("#eye-box"); const eye_on = await page.getAttribute("#eye-box", "aria-pressed");
  await page.waitForTimeout(1000);
  const gone = await where();
  await page.click("#eye-box"); await page.waitForTimeout(1000);
  const back = await where();
  check(gone.panel <= 0 && gone.main === 0 && gone.mast === here.mast && gone.back === 24 && gone.shadows === 24 && gone.undo === gone.title + 12 && gone.bar.join() === here.bar.join() && gone.fitted && gone.centre === 0 && gone.z >= here.z && /^rgb\(17, 17, 17\)/.test(gone.fill)
      && back.panel === here.panel && back.main === here.main && back.undo === here.undo && back.back === here.back,
    `the eye switch, on: the dial alone — the panel slid away (${gone.panel}), the mark and title stay (${gone.mast}), Backdrop and Shadows stop on the mark's line (${gone.back}), undo · redo after the title (${gone.undo}), the bar as it was, the dial fitted and centred (×${(gone.z / here.z).toFixed(2)}); the switch filled (${gone.fill}); off, all back`);
  check(bio.shown && shut && bio.links.includes("HarfBuzz") && bio.links.includes("github.com/duztman/dial-tool") && bio.logo_left === 24 && bio.title_left === 52 && bio.text_left === 52 && bio.heads === 0 && bio.contact === "here" && !bio.bare && bio.turned === "rgb(20, 20, 19)" && eye_at && eye_on === "true" && await page.getAttribute("#eye-box", "aria-pressed") === "false" && await S("JSON.stringify(S, (k, v) => (k.startsWith('ui_') || k === 't' ? undefined : v))") === before,
    `Okay's mark in the first column (${bio.logo_left}; the title at ${bio.title_left}) turns over on a night disc (${bio.turned}) and opens the bio, no title of its own, its text on the title's line (${bio.text_left}), with its links (${bio.links.length}), its first paragraph ending "Contact him here" — no address anywhere in the page; a press outside shuts it; the eye switch, alone at the preview's bottom right (${eye_at}), turns on and off, nothing more`);
}
{ // the window never zooms, only the dial (Okay, 15 Oct 2026, 02:19)
  const still = await page.evaluate(() => { const wheel = new WheelEvent("wheel", { ctrlKey: true, deltaY: -40, bubbles: true, cancelable: true }); document.querySelector(".panel").dispatchEvent(wheel);
    return [document.querySelector('meta[name="viewport"]').content, getComputedStyle(document.documentElement).touchAction, wheel.defaultPrevented]; });
  const z0 = await S("t.z");
  await page.mouse.move(1000, 400); await page.keyboard.down("Control"); await page.mouse.wheel(0, -100); await page.keyboard.up("Control"); await frame();
  check(still[0].includes("user-scalable=no") && still[1] === "pan-x pan-y" && still[2] && await S("t.z") > z0, `the window doesn't zoom (a pinch on the panel is refused; ${still[1]}), the dial still does`);
}
{ // the showcase's 10:10 and hands key (Okay, 15 Oct 2026, 07:40): 10:10 beside Now, the gap between them on the centre line; the one pressed turns into the undo sign, the other stays put; the hands key at the bottom left hides the hands in the showcase only
  await page.click("#iris-box"); await page.waitForTimeout(300); await page.click("#iris-go"); await page.waitForTimeout(1600);
  const at = () => page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), t = window.dial_tool; return { now: [r("#show-now").left, r("#show-now").right, r("#show-now").width], ten: [r("#show-ten").left, r("#show-ten").width], key: [r("#hands-key").left, r("#hands-key").bottom, r("#hands-key").width, getComputedStyle(document.querySelector("#hands-key")).borderRadius], x: r(".irisbox").bottom, w: innerWidth, t: t.S.t, hands: t.items.filter((i) => i.role === "hand").length }; });
  const a = await at();
  await page.click("#show-ten"); await page.waitForTimeout(1900);
  const b = await at();
  await page.click("#show-ten"); await page.waitForTimeout(1900);
  await page.click("#hands-key"); await page.waitForTimeout(200);
  const c = await at();
  await page.click("#iris-box"); await page.waitForTimeout(1300);
  const d = await page.evaluate(() => [window.dial_tool.S.ha_on, window.dial_tool.items.filter((i) => i.role === "hand").length]);
  const ok = [Math.abs((a.now[1] + a.ten[0]) / 2 - a.w / 2) < 0.6, a.ten[1] > a.now[2], b.t % 43200 - 36600 >= 0 && b.t % 43200 - 36600 < 4, b.ten[1] === 40, b.now[0] === a.now[0] && b.now[2] === a.now[2], b.ten[0] === a.ten[0],
    c.key[0] === 24 && Math.abs(c.key[1] - c.x) < 0.5 && c.key[2] === 40 && c.key[3] === "50%", c.hands === 0, d[0] === true && d[1] > 0];
  check(ok.every(Boolean), `the showcase's 10:10: beside Now, the gap on the centre line; pressed, the hands to 10:10 and it turns undo while Now stays put; the hands key round at the bottom left, across from the X, hiding the hands in the showcase only (${ok.join(" ")})`);
}
{ // the showcase's Now (Okay, 15 Oct 2026, 07:36): the hour hand one turn clockwise, the minute hand one anticlockwise, the seconds the short way; halfway through the spin (eased, so half the way)
  const half = await page.evaluate(() => { const t = window.dial_tool, kept = t.show, items = ["hour", "minute", "second"].map((name) => ({ role: "hand", name, angle: 100 }));
    t.show = { spin: { from: [90, 110, 350], way: 1, t0: performance.now() - 800 } }; t.spin_hands(items); t.show = kept; return items.map((i) => i.angle); });
  const want = [90 + (10 + 360) / 2, 110 - (10 + 360) / 2, 350 + 110 / 2];
  check(half.every((a, i) => Math.abs(a - want[i]) < 4), `Now in the showcase: hour clockwise, minute anticlockwise, one turn each; seconds the short way (${half.map((a) => a.toFixed(1)).join(" ")} ≈ ${want.join(" ")})`);
}
{ // what stays put ends on the thick line on every tab (Okay, 15 Oct 2026, 06:20)
  const ends = [];
  for (const name of ["Dial", "Rings", "Hands", "Date", "Export"]) { await tab(name); ends.push(await page.$eval(".pinned", (e) => { const c = getComputedStyle(e); return [c.borderBottomWidth, c.borderBottomColor, c.backgroundImage, c.backgroundSize, c.backgroundOrigin].join(" "); })); }
  const twice = await page.$eval(".pinned", (e) => 2 * parseFloat(getComputedStyle(e).paddingLeft));
  check(ends.every((x) => x === `2px rgba(0, 0, 0, 0) linear-gradient(rgb(17, 17, 17) 0px, rgb(17, 17, 17) 0px) calc(100% - ${twice}px) 2px border-box`), `every tab's pinned part ends on the thick line, inside the margins (Okay, 07:29) (${[...new Set(ends)].join(" · ")}); FIT in capitals at 12 (${await page.$eval("#fit > span", (e) => getComputedStyle(e).textTransform + " " + getComputedStyle(e).fontSize)})`);
}
await page.setViewportSize({ width: 390, height: 844 });
await tab("Rings");
await frame();
const narrow = await page.evaluate(() => ({ wide: document.documentElement.scrollWidth, eye: document.querySelector(".form button.fold .eye").getBoundingClientRect().left, bar: document.querySelector(".bar").getBoundingClientRect().top }));
check(narrow.wide <= 390 && narrow.eye >= 0 && narrow.bar === 0, "a phone: nothing wider than the screen, the eyes in view, the bar on top");
{ // a phone's title line (Okay, 15 Oct 2026, 07:59): full at the drawer's top (Gallery pill, unit box); scrolled, squeezed and held on top with the tabs under it; full again back at the top
  const m = () => page.evaluate(() => { const panel = document.querySelector(".panel"), h = panel.querySelector(":scope > header").getBoundingClientRect(), t = panel.querySelector(".tabs").getBoundingClientRect(), shown = (q) => !!document.querySelector(q).offsetParent;
    return { sq: panel.classList.contains("squeezed"), high: Math.round(h.height), on_top: Math.round(h.top - panel.getBoundingClientRect().top), tabs_under: Math.round(t.top - h.bottom), pill: shown("#to-gallery"), unit: shown("#unit") }; });
  const set = (y) => page.evaluate((y) => { document.querySelector(".panel").scrollTop = y; }, y).then(() => page.waitForTimeout(200));
  await set(0); const a = await m(); await set(400); const b = await m(); await set(0); const c = await m();
  const ok = [!a.sq && a.pill && a.unit && a.high > b.high, b.sq && !b.pill && !b.unit && b.high === 40 && b.on_top <= 1 && b.tabs_under === 0, JSON.stringify(c) === JSON.stringify(a)];
  check(ok.every(Boolean), `a phone's title line: full at the top with Gallery and mm (${a.high}), squeezed and held on top once scrolled (${b.high}, the tabs under it), full again back at the top (${ok.join(" ")})`);
}
{ // a phone's bar row (Okay, 15 Oct 2026, 07:45): the time at the bar's text size, the red dot with as much room left as right
  const b = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(); return { font: getComputedStyle(document.querySelector(".bar .time")).fontSize, half: getComputedStyle(document.querySelector(".bar .timebox .half")).fontSize, left: r(".bar .lead .play").left, right: r(".bar .speeds").left - r(".bar .lead .play").right }; });
  check(b.font === b.half && Math.abs(b.left - b.right) < 0.5 && b.left > 14, `a phone's bar: the time as large as AM (${b.font}), the red dot ${b.left.toFixed(1)} from the edge and ${b.right.toFixed(1)} from how fast`);
}
{ // a phone (Okay, 15 Oct 2026, 06:20–06:27): the switches fold to their signs and a tap on the backdrop unfolds them; the
  // drawer has a gripper on its top line — a tap makes it taller, and tall it holds its top still; the lists open as sheets
  const g = () => page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), panel = document.querySelector(".panel");
    return { guides: Math.round(r("#guides").width), grip: [Math.round(r("#sheet-grip").left + r("#sheet-grip").width / 2), Math.round(r("#sheet-grip").top + r("#sheet-grip").height / 2), Math.round(r(".panel").top)], dot: getComputedStyle(document.querySelector("#sheet-grip"), "::before").backgroundColor,
      line: getComputedStyle(panel).borderTopColor, held: panel.classList.contains("held"), panel: Math.round(panel.getBoundingClientRect().height), body: getComputedStyle(document.body).backgroundColor }; });
  await page.click("#fit");      // the dial was zoomed in above: fitted, the backdrop's corners are free
  await page.waitForTimeout(3500);      // anything unfolded by the taps before folds back first
  const folded = await g();
  const spot = await page.evaluate(() => { const r = document.querySelector("main").getBoundingClientRect(); return [r.left + 40, r.top + 60]; });      // a corner of the backdrop, off the dial
  await page.mouse.click(spot[0], spot[1]); await page.waitForTimeout(600);
  const open = await g();
  await page.waitForTimeout(3300);
  const shut = await g();
  await page.mouse.click(folded.grip[0], folded.grip[1]); await page.waitForTimeout(400);
  const tall = await g();
  await page.mouse.click(tall.grip[0], tall.grip[1]); await page.waitForTimeout(400);
  const back = await g();
  await page.click("#guides-more"); await page.waitForTimeout(200);
  const sheet = await page.evaluate(() => { const r = document.querySelector("#guide-list").getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.bottom), innerWidth, innerHeight]; });
  await page.click("#guides-more");
  check(folded.guides === 32 && open.guides > 60 && shut.guides === 32 && folded.dot === folded.line && folded.grip[1] === folded.grip[2] && tall.panel > folded.panel && tall.held && !back.held && back.panel === folded.panel
      && sheet[0] === 0 && sheet[1] === sheet[3] && sheet[2] === sheet[4] && folded.body === "rgb(51, 51, 51)",
    `a phone: the switches show their signs (${folded.guides} px) and unfold their words on a tap of the backdrop (${open.guides}), folding back after 3 s; the gripper sits on the drawer's top line in its grey; a tap makes the drawer taller (${folded.panel} → ${tall.panel}) and it holds its top still, another brings it back; Guides opens as a sheet from the bottom; the page's own colour is the bar's`);
}
await shot("11-phone");
await page.click('.form .fold:visible >> nth=0');
await shot("11b-phone-folded");
await page.click('.form .fold:visible >> nth=0');
{ // a phone (4.68; Okay, 18 Oct 2026, 22:35): the controller at three quarters ("Controller too big on the phones, 75% scale"); a hand's rows give the slider all the room between the name and the box ("Hands sliders squeezed, use all row width")
  await tab("Dial"); await page.$eval('label[for="global-dial-d-Diameter"]', (e) => e.scrollIntoView({ block: "center" }));
  await page.click('label[for="global-dial-d-Diameter"]'); await page.waitForTimeout(200);
  const pop = await page.evaluate(() => { const v = document.querySelector("#value-pop"), w = v ? v.getBoundingClientRect().width : 0; window.dial_tool.value_pop_close(); return w; });
  const k = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--num-pop-k").trim());
  await tab("Hands");
  const side = await page.evaluate(() => { const r = [...document.querySelectorAll(".body > .row.side")].find((x) => x.offsetParent && x.querySelector('input[type="range"]')), q = (s) => r.querySelector(s).getBoundingClientRect(); return [Math.round(r.getBoundingClientRect().width), Math.round(q("label").width), Math.round(q('input[type="range"]').width), Math.round(q(".numbox").width), Math.round(parseFloat(getComputedStyle(r).gridTemplateColumns.split(" ")[1]))]; });
  await tab("Dial");
  check(k === "0.75" && pop > 150 && pop < 200 && side[2] === side[4] && side[2] > side[0] / 3, `a phone: the controller at ${k} (${Math.round(pop)} px wide); a hand's row ${side[0]} wide: name ${side[1]}, slider ${side[2]} (its whole column, ${side[4]}), box ${side[3]}`);
}
await page.setViewportSize({ width: 1440, height: 900 });

// ── labels centred on their ink (ink.js, #186): measured from the screen's dots, not from the code's numbers ──
await S("(t.S.da_on = true, t.S.ui_section = 3, t.show_section(), t.static_dirty = true, t.sync_rows(), t.render(), true)");
await page.waitForTimeout(300);
const inked = [];
for (const sel of ['.circles button:has(.ink:text-is("12"))', '.circles button:has(.ink:text-is("6"))', ".circles button.on", "#ampm", '.steps12 button:has(.ink:text-is("1"))']) {
  const box = page.locator(sel).first();
  const png = (await box.screenshot()).toString("base64");
  // the ink: dots that differ clearly from the box's own ground (its middle row's first dots inside the border)
  inked.push([sel, await page.evaluate(async (src) => {
    const img = new Image(); img.src = "data:image/png;base64," + src; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => d.slice((y * c.width + x) * 4, (y * c.width + x) * 4 + 3);
    const ground = at(Math.round(c.width * 0.08) + 3, Math.round(c.height / 2)), edge = 4;          // inside the border
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let y = edge; y < c.height - edge; y++) for (let x = edge; x < c.width - edge; x++) {
      const p = at(x, y); if (Math.abs(p[0] - ground[0]) + Math.abs(p[1] - ground[1]) + Math.abs(p[2] - ground[2]) > 150) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    return [((x0 + x1 + 1) / 2 - c.width / 2) / 2, ((y0 + y1 + 1) / 2 - c.height / 2) / 2];      // in CSS pixels (2 dots each)
  }, png)]);
}
const off = inked.filter(([, [dx, dy]]) => Math.abs(dx) > 0.75 || Math.abs(dy) > 0.75);
check(off.length === 0, "short labels in boxes stand on their ink's centre, within ¾ px: " + inked.map(([s, [dx, dy]]) => `${(s.match(/"([^"]+)"/) || [0, s])[1]} ${dx.toFixed(1)},${dy.toFixed(1)}`).join(" · "));
check(await page.$eval('.circles button:has(.ink:text-is("12"))', (b) => getComputedStyle(b.firstElementChild).fontVariantNumeric.includes("proportional")).catch(() => false), "their figures are proportional");
await page.evaluate(() => { const t = window.dial_tool; t.set_time((t.S.t + 43200) % 86400); });
await page.waitForTimeout(100);
check(await page.$eval("#ampm", (b) => b.firstElementChild && b.firstElementChild.classList.contains("ink")), "a label whose words change (AM → PM) is measured again");

// ── under a finger: small controls are pressed from a little outside their edge too ──
const touch = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const pad = await touch.newPage();
await pad.addInitScript(() => { if (!localStorage.getItem("dial-tool-last")) localStorage.setItem("dial-tool-last", "{}"); });      // the plain starting dial, not the opener (Okay's watch, 4.38.12)
await pad.addInitScript(() => { if (!localStorage.getItem("dial-tool-folds")) localStorage.setItem("dial-tool-folds", '{"*":false}'); });      // every pane open (#270)
await pad.goto("file://" + process.cwd() + "/dial-tool.html");
await pad.waitForFunction(() => window.dial_tool && window.dial_tool.statik, null, { timeout: 20000 });
await pad.tap("#guides-more");
const reach = await pad.evaluate(() => {
  const dots = [...document.querySelectorAll("#guide-list .guidekind:nth-child(2) .tone")], a = dots[2].getBoundingClientRect(), b = dots[3].getBoundingClientRect();
  const at = (x, y) => document.elementFromPoint(x, y);
  return { coarse: matchMedia("(pointer: coarse)").matches, size: a.width, left: at(a.left - 5, a.top + a.height / 2) === dots[2], above: at(a.left + a.width / 2, a.top - 10) === dots[2], nearer_next: at(b.left - 5, b.top + b.height / 2) === dots[3] };
});
check(reach.coarse && reach.left && reach.above && reach.nearer_next, `under a finger a ${reach.size} dot is pressed from 5 beside it and 10 above it; nearer the next dot, the next one is`);
{ // under a finger the number popup opens without taking the focus, so no keyboard comes up (4.46.1; Okay: "Value gets selected was the wrong choice, triggers the keypad on ipad")
  await pad.tap("#guides-more");      // the guides' list away again
  await pad.tap('label[for="global-dial-d-Diameter"]'); await pad.waitForTimeout(300);
  const typing = await pad.evaluate(() => { const pop = document.querySelector("#value-pop"); return [!!pop, !!pop && pop.contains(document.activeElement) && document.activeElement.type === "text"]; });
  check(typing[0] && !typing[1], "under a finger a number's popup opens with nothing chosen to type over: no keyboard comes up until the value is pressed");
  await pad.tap("#guides-more"); await pad.waitForTimeout(200);      // a press outside puts the popup away; the guides' list open again for what follows
}
await pad.touchscreen.tap(...await pad.$eval('#guide-list .guidekind:nth-child(2) .tone:nth-child(5)', (e) => { const r = e.getBoundingClientRect(); return [r.left - 4, r.top - 8]; }));
check(await pad.evaluate(() => window.dial_tool.S.gd_k_axes === 3), "a tap just outside a dot chooses it");
await pad.tap("#global-c-plate-Plate-hex");
const chip_reach = await pad.evaluate(() => { const c = [...document.querySelectorAll("#pop-palette button")], r = c[4].getBoundingClientRect(); return [document.elementFromPoint(r.left - 4, r.top + 4) === c[4], document.querySelector("#global-c-plate-Plate-hex").tagName === "SPAN", !document.querySelector("#colour-pop").hidden]; });
check(chip_reach.every(Boolean), "the hex in a pill opens the pop-out and isn't typed in; a chip is pressed from 4 beside it");
{ // under a finger a row's slider and its name open the controller; its field takes typing and its − + step in place (4.68; Okay, 18 Oct 2026, 22:35: "On phones and ipad tapping or sliding slider or title opens controller, you can type in box or tap plusminus"; 4.60–4.67 the field and − + opened it)
  await pad.evaluate(() => { const t = window.dial_tool; t.pop_close && t.pop_close(); t.value_pop_close(); if (t.guides_open) t.guides_open(false); });
  const d0 = await pad.evaluate(() => window.dial_tool.S.dial_d);
  await pad.tap("#global-dial-d-Diameter ~ .steps .step:last-child"); await pad.waitForTimeout(200);
  const plus = await pad.evaluate((d0) => [window.dial_tool.S.dial_d > d0, !document.querySelector("#value-pop")], d0);
  await pad.evaluate((d0) => window.dial_tool.set_value("global", "dial_d", d0), d0);
  await pad.tap("#global-dial-d-Diameter"); await pad.waitForTimeout(200);
  const field = await pad.evaluate(() => [!document.querySelector("#value-pop"), document.activeElement === document.querySelector("#global-dial-d-Diameter")]);
  await pad.evaluate(() => document.activeElement.blur());
  const v0 = await pad.evaluate(() => window.dial_tool.S.dial_d);
  await pad.tap('#global-dial-d-Diameter ~ input[type="range"], .row:has(#global-dial-d-Diameter) input[type="range"]'); await pad.waitForTimeout(200);
  const slider = await pad.evaluate((v0) => [!!document.querySelector("#value-pop"), window.dial_tool.S.dial_d === v0], v0);
  await pad.evaluate(() => window.dial_tool.value_pop_close());
  check(plus.every(Boolean) && field.every(Boolean) && slider.every(Boolean), `under a finger a row's + steps in place, no controller (${plus.join(" ")}); its field is focused to type (${field.join(" ")}); its slider opens the controller and moves nothing (${slider.join(" ")})`);
}
await pad.screenshot({ path: path.join(OUT, "12-touch.png") });
await touch.close();

{ // the selected ring's handles on its guides (4.65; farukahmet's PR #2, Okay: "implemented in our ways and design … all these handles should be in guide color"): radius on the dotted line, size on the far edge, start and span round the outside; dragged, they set the ring as its rows do
  await tab("Rings");
  const was = await page.evaluate(() => { const t = window.dial_tool; t.S.guides = true; t.select_ring(0); t.render(); const R = t.ring(); return [R.r, R.size, R.start, R.span]; });
  await page.evaluate(() => window.dial_tool.set_value("ring", "span", 270)); await frame();
  const hs = await page.evaluate(() => { return [...document.querySelectorAll(".handles .handle")].map((g) => { const r = g.querySelector(":not(.reach)").getBoundingClientRect(); return [g.dataset.handle, r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(g).fill]; }); });
  const tone = await page.evaluate(() => { const t = window.dial_tool, h = window.getComputedStyle(document.querySelector(".handles")).getPropertyValue("--handle").trim(); return h; });
  const mm = await page.evaluate(() => window.dial_tool.z);
  const move = async (name, dx, dy) => { const h = hs.find((x) => x[0] === name); await page.mouse.move(h[1], h[2]); await page.mouse.down(); await page.mouse.move(h[1] + dx / 2, h[2] + dy / 2, { steps: 3 }); await page.mouse.move(h[1] + dx, h[2] + dy, { steps: 3 }); await page.mouse.up(); await frame(); };
  const c = await page.evaluate(() => { const b = document.querySelector("svg.preview, main svg").getBoundingClientRect(), t = window.dial_tool; return [b.left + t.c[0], b.top + t.c[1]]; });
  const radial = (name, k) => { const h = hs.find((x) => x[0] === name), dx = h[1] - c[0], dy = h[2] - c[1], l = Math.hypot(dx, dy); return [dx / l * k, dy / l * k]; };
  const r0 = await S("S.rings[S.ui_ring].r"); await move("radius", ...radial("radius", mm)); const r1 = await S("S.rings[S.ui_ring].r");
  await page.evaluate((r) => window.dial_tool.set_value("ring", "r", r), r0); await frame();
  const hs2 = await page.evaluate(() => [...document.querySelectorAll(".handles .handle")].map((g) => { const r = g.querySelector(":not(.reach)").getBoundingClientRect(); return [g.dataset.handle, r.left + r.width / 2, r.top + r.height / 2]; }));
  hs.splice(0, hs.length, ...hs2);
  const z0 = await S("S.rings[S.ui_ring].size"); await move("size", ...radial("size", -mm * 0.5)); const z1 = await S("S.rings[S.ui_ring].size");
  const st = hs.find((x) => x[0] === "start"), rr = Math.hypot(st[1] - c[0], st[2] - c[1]);
  await page.mouse.move(st[1], st[2]); await page.mouse.down(); await page.mouse.move(c[0] + rr * 0.7, c[1] - rr * 0.7, { steps: 4 }); await page.mouse.move(c[0] + rr, c[1], { steps: 4 }); await page.mouse.up(); await frame();
  const start = await S("S.rings[S.ui_ring].start");
  await page.evaluate((w) => { const t = window.dial_tool; for (const [k, v] of [["r", w[0]], ["size", w[1]], ["start", w[2]], ["span", w[3]]]) t.set_value("ring", k, v); }, was);
  await tab("Dial"); const gone = await page.$$eval(".handles .handle", (e) => e.length);
  check(hs.length === 4 && hs.map((x) => x[0]).join() === "radius,size,start,span" && tone.length > 0 && Math.abs(r1 - r0 - 1) < 0.15 && z1 !== z0 && Math.abs(start - 90) <= 1 && gone === 0,
    `on the Rings tab the selected ring has four handles in its guide colour (${tone}): radius, size, start, span; dragged a mm out the radius goes ${r0} → ${r1}, the size handle ${z0} → ${z1}, the start round to ${start}°; on another tab none`);
}
{ // the date in the bar (4.62; Okay: "Date best set at the bar, short date, 07/10/28 style, stacked barlow medium or bold, next to am, touching. Default from system date"); a window that follows it says it
  const look = await page.evaluate(() => { const d = document.querySelector("#date"), a = document.querySelector("#ampm").getBoundingClientRect(), r = d.getBoundingClientRect(), c = getComputedStyle(d), spans = [...d.children].map((e) => e.textContent), n = new Date();
    const today = [String(n.getDate()).padStart(2, "0"), String(n.getMonth() + 1).padStart(2, "0"), String(n.getFullYear()).slice(-2)];
    return [Math.abs(r.left - a.right) < 0.5 && Math.abs(r.top - a.top) < 0.5, spans.join("/") === today.join("/"), c.fontFamily.includes("Dial Date"), c.fontWeight, window.dial_tool.S.date]; });
  const follow = await page.evaluate(() => { const t = window.dial_tool, was = [t.S.ui_window, t.S.da_on, t.S.da_kind, t.S.da_follows, t.S.da_names, t.S.date]; t.S.ui_window = 0;
    t.set_value("window", "on", true); t.set_value("window", "kind", 0); t.set_value("window", "follows", true); t.set_value("global", "date", "2028-10-07"); t.frame();
    const date = t.statik.windows[0].w.text, bar = [...document.querySelector("#date").children].map((e) => e.textContent).join("/");
    t.set_value("window", "kind", 1); t.set_value("window", "names", 1); t.frame(); const day = t.statik.windows[0].w.text;
    t.to_now(); const now = t.S.date;
    t.set_value("window", "kind", was[2]); t.set_value("window", "follows", was[3]); t.set_value("window", "names", was[4]); t.set_value("window", "on", was[1]); t.S.date = was[5]; t.S.ui_window = was[0]; t.sync_rows(); t.sync_time(); t.render();
    return [date, bar, day, now]; });
  check(look[0] && look[1] && look[2] && look[3] === "600" && look[4] === "" && follow.join() === "7,07/10/28,CMT,",
    `the date stands touching AM · PM, today's to start, stacked day · month · year in Inter SemiBold (Barlow Bold in 4.62) (${look.join(" ")}); 7 Oct 2028 set, a following date window says ${follow[0]} and the bar ${follow[1]}; a day window in Turkish ${follow[2]}; Now brings today back`);
}
{ // a case round the dial, preview only (4.66; farukahmet's PR #3 "abstractified": "low number of colors, thick lines, minimal … One highlight one shadow")
  const z0 = await page.evaluate(() => window.dial_tool.z);
  await page.selectOption("#case-pick", "1"); await frame();
  const on = await page.evaluate(() => { const t = window.dial_tool, g = document.querySelector("g.bezel"), fills = new Set([...g.querySelectorAll("path")].map((p) => p.getAttribute("fill"))), svg = t.statik && window.dial_tool;
    return [t.S.bezel, g.querySelectorAll("path").length, fills.size, document.querySelector("#case .word").textContent, t.z, g.compareDocumentPosition(t.dial) & Node.DOCUMENT_POSITION_FOLLOWING ? true : false]; });
  // its strap (4.69; Okay, 22:35: "Add straps to bezels metal bands too, same style … Add strap color change option"; "Fit and previews care about the dial still")
  const fills = () => page.evaluate(() => [...document.querySelectorAll("g.bezel path")].map((p) => p.getAttribute("fill")));
  const leather = await fills(), strap_on = await page.evaluate(() => [!document.querySelector("#strap").hidden, document.querySelector("#strap .word").textContent, !document.querySelector("#strap-colour").hidden]);
  await page.evaluate(() => window.dial_tool.set_value("global", "c_strap", [0.1, 0.25, 0.45, 1])); await frame();
  const blue = await fills();
  await page.selectOption("#strap-pick", "2"); await frame();
  const bracelet = await fills(), chip = await page.evaluate(() => document.querySelector("#strap-colour").hidden);
  await page.evaluate(() => { const t = window.dial_tool; t.set_value("global", "strap", 1); t.set_value("global", "c_strap", [0.29, 0.2, 0.14, 1]); }); await frame();
  await page.selectOption("#case-pick", "0"); await frame();
  const off = await page.evaluate(() => [window.dial_tool.S.bezel, document.querySelector("g.bezel").childElementCount, document.querySelector("#case .word").textContent, window.dial_tool.z, document.querySelector("#strap").hidden]);
  check(on[0] === 1 && on[1] > 20 && on[2] <= 8 && on[3] === "Diver" && Math.abs(on[4] - z0) < 1e-6 && on[5] && off[0] === 0 && off[1] === 0 && off[2] === "Case" && Math.abs(off[3] - z0) < 1e-6 && off[4],
    `a case round the dial: Diver drawn under the dial in ${on[2]} tones (${on[1]} parts) with its strap; the view stays on the dial (${z0.toFixed(2)} → ${on[4].toFixed(2)}); No case takes both away`);
  check(strap_on.join() === "true,Strap,true" && blue.includes("#1A4073") && !leather.includes("#1A4073") && bracelet.length > leather.length && !bracelet.includes("#1A4073") && chip,
    `its strap: a switch beside Case while a case is on (${strap_on.join(" ")}); a new strap colour repaints it; a bracelet is links in the case's metal (${bracelet.length} parts), no chip`);
}
{ // Tiny Preview (#337, 4.59): its button top right where Guides stood; the dial at its own size (the browser's mm) with its margins, over everything; dragged anywhere; its eye puts it away. Guides at the bottom left, between Backdrop and Shadows, their list opening upward
  const corner = await page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), m = r("main"), o = r("#tiny-open"), g = r("#guides"), b = r("#backdrop"), sh = r("#shadows"); return [Math.round(m.right - o.right) === Math.round(m.bottom - m.bottom) || o.top - m.top < 40, b.bottom <= g.top + 1 && g.bottom <= sh.top + 1 && Math.abs(g.left - sh.left) < 1]; });
  await page.click("#tiny-open"); await page.waitForTimeout(250);
  const tiny = await page.evaluate(() => { const t = document.querySelector("#tiny"), s = t.querySelector("svg"), S = window.dial_tool.S, mm = parseFloat(s.getAttribute("width")); return [!t.hidden, document.querySelector("#tiny-open").hidden, mm, Math.abs(s.getBoundingClientRect().width - mm * 96 / 25.4) < 1, Math.abs(mm - (S.dial_d + 2 * S.margin)) < 0.01, +getComputedStyle(t).zIndex, t.parentElement === document.body, !t.querySelector('[id^="guide"]')]; });
  const b0 = await page.$eval("#tiny", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; });
  await page.mouse.move(b0[0] + 60, b0[1] + 60); await page.mouse.down(); await page.mouse.move(b0[0] - 140, b0[1] + 160, { steps: 5 }); await page.mouse.up();
  const b1 = await page.$eval("#tiny", (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; });
  await page.hover("#tiny"); await page.waitForTimeout(250); const shown = await page.$eval("#tiny-shut", (e) => getComputedStyle(e).opacity);
  await page.click("#tiny-shut");
  const away = [await page.isHidden("#tiny"), await page.isVisible("#tiny-open")];
  await page.click(".guides .guidesmore"); const up = await page.evaluate(() => document.querySelector("#guide-list").getBoundingClientRect().bottom <= document.querySelector("#guides").getBoundingClientRect().top); await page.click(".guides .guidesmore");
  check(corner.every(Boolean) && tiny[0] && tiny[1] && tiny[3] && tiny[4] && tiny[5] >= 60 && tiny[6] && tiny[7] && Math.round(b1[0] - b0[0]) === -200 && Math.round(b1[1] - b0[1]) === 100 && shown === "1" && away.every(Boolean) && up,
    `Tiny Preview (#337): its button top right; open, the dial and its margins at ${tiny[2]} mm in the browser's mm, over everything, no guides; dragged (−200, +100), its eye shows under the pointer and puts it away; Guides at the bottom left between Backdrop and Shadows, the list opening upward`);
}
await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s).` : "\nWindow test passed.");
process.exit(problems.length ? 1 : 0);
