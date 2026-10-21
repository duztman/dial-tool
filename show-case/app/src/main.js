// Dial Show Case — a dial from Dial Tool put in a whole watch, under a light, in one of two drawing styles
// (Engineer · Miyazaki); its colours changed; time run with Dial Tool's bar; saved as PNG or PDF.
//
// How it fits together:
//   a link  → Dial Tool's own engine (geometry.js) opens it and draws the dial's shapes, as on Dial Tool's preview
//   shapes  → the cases-and-straps engine (engineer.js / miyazaki.js) draws the watch round them, as one SVG
//   time    → the hands are turned in place each frame; the watch is drawn again only when something else changes
import PathKitInit from "pathkit-wasm/bin/pathkit.js";
import * as HarfBuzz from "harfbuzzjs";
import * as G from "../../../web/src/geometry.js";
import { FONT_LIST } from "../../../web/src/font_list.js";
import { start_ink } from "../../../web/src/ink.js";
import * as ENGINEER from "./engineer.js";
import * as MIYAZAKI from "./miyazaki.js";
import { Bar, el, clamp, icon, STEP } from "./bar.js";

const STYLES = { engineer: ENGINEER, miyazaki: MIYAZAKI };
const FIRST_LINK = "__FIRST_LINK__";
let refresh_ground = () => {};      // the background popup shown again (set where it is made)
const VERSION = "beta 1.0.18";      // the live site keeps the stable ones (beta 1.0 at /dial-tool/show-case/); this page counts on from there (01:43)
const FONT_BASE = "__FONT_BASE__";

// ── what is shown: the dial (S, Dial Tool's settings) and the watch round it (W) ──
const S = { t: 10 * 3600 + 10 * 60, date: "" };
const metal_strap = () => W.strap === "bracelet" || W.strap === "links";      // a bracelet of the case's metal
const W = {
  style: "miyazaki", key: "dress", size: 1, strap: "leather", nato: "regimental", view: "detail", flare: "arc",
  metal_preset: "gold", metal: null, leather_preset: "brown", leather: null, nato_colours: null,
  floor: "#2a1a17", floor2: "#b4533a",      // the ground: one colour, or two for a gradient at 45°. The opener stands on Ember (Okay, 21 Oct 2026, 02:40)
  ground_set: false,      // the background chosen by hand: then an opened link keeps it; otherwise it goes back to its own (null)
  insert_preset: "black", insert: null,      // the diver's insert: [top, bottom]
  side_shown: true, grey_panel: false,
  lighting: "dramatic",      // dramatic (spotlight, flare) or flat — on its own, whatever the view (01:48)
  L: 225, h: 40,      // the light: from the upper left, 40° high
  zoom: 1, pan: [0, 0],      // the view: how far in, and how far moved (screen pixels)
  sun_shown: false,      // the sun's knob: off to start (23:59)
  blurs: true, flare_on: true, fl: { size: 1, tint: 0.45, bright: 1 },      // the flare: size, how close to the case's colour, brightness
  glass: { fat: 1, len: 1, op: 1 },      // the shine on the glass: width, length, opacity
  ink: 6, bevels: false,      // the dial: printed ink's height (relief levels, 0 flat), the hands' bevels
  shadow: 1,      // shadows: darker or lighter than the engine's own
};
let statik = null, items = [], dial_colours = [], recolour = new Map(), ink_by = new Map(), window_key = "", dial_name = "";
const E = () => STYLES[W.style];
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0")).join("");

// ── the colours as they stand: what the person chose, or the style's own ──
const metal = () => W.metal || E().PRESETS.metals[W.metal_preset];
const leather = () => W.leather || E().PRESETS.leather[W.leather_preset];
const nato_colours = () => W.nato_colours || E().PRESETS.nato[W.nato];
const floor = () => W.floor || E().PRESETS.floor;
const insert = () => W.insert || INSERTS[W.insert_preset];
// the diver's insert: one colour, or two halves as a GMT's — the darker (night) half on top. Pepsi's blue is its night
// half (Luxury Bazaar); the others are read the same way, their darker colour on top.
const INSERTS = { black: ["#2b2c30", "#2b2c30"], blue: ["#1f3a6e", "#1f3a6e"], green: ["#1f5a3a", "#1f5a3a"], pepsi: ["#23407a", "#a8262e"],
  batman: ["#222326", "#22457e"], coke: ["#222326", "#a3232b"], rootbeer: ["#2a2420", "#6b3f24"], sprite: ["#222326", "#2f7a3c"] };
// the ground's presets: one colour, or two for a gradient (the first top left)
// the background's presets (Okay, 20 Oct 2026, 23:51): ten single colours and ten gradients (the first colour top left)
const SOLIDS = [["Stone", "#b9b3a6"], ["Umber", "#877f6d"], ["Paper", "#e8e4da"], ["Bone", "#d8d0bf"], ["Sky", "#a9bccb"],
  ["Sage", "#9aa891"], ["Olive", "#6b6a4e"], ["Brick", "#8a4a3a"], ["Slate", "#5b6066"], ["Night", "#1c1c1f"]];
const GRADIENTS = [["Dusk", "#3b3f58", "#b8876c"], ["Sea", "#1f4e5a", "#a9c7c0"], ["Clay", "#d9b8a0", "#7a4a3a"], ["Fog", "#e6e6e3", "#8c9096"], ["Dune", "#e8d8b8", "#a5835a"],
  ["Moss", "#1e2a1f", "#8fa27b"], ["Steel", "#2b3138", "#9aa6b2"], ["Plum", "#2a1f33", "#9c6d8f"], ["Ember", "#2a1a17", "#b4533a"], ["Ink", "#0e0f14", "#3b4256"]];

// ── opening a link ──
const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
async function open_link(text) {
  const hash = "#" + String(text).trim().split("#").pop();
  const kind = G.link_kind(hash);
  if (!kind) throw new Error("That isn’t a Dial Tool link: copy the address from Dial Tool’s Export → Link.");
  if (kind.scheme !== G.LINK_SCHEME) throw new Error(`This link is from an older Dial Tool (scheme ${kind.scheme}); open it in Dial Tool and copy its link again.`);
  const settings = G.from_link_text(new TextDecoder().decode(await through(G.un_base32(kind.letters), new DecompressionStream("deflate-raw"))));
  if (!settings) throw new Error("The link couldn’t be read.");
  Object.assign(S, G.fresh_settings(settings), { t: S.t, date: S.date, guides: false, xray: false });
  await load_fonts();
  recolour = new Map(); ink_by = new Map();      // a dial's colours and ink heights are its own
  dial_name = settings.name || "";
  bake();
}
async function load_fonts() {
  for (const ring of [...S.rings, ...G.windows_of(S).filter((w) => w.ps)]) {
    const entry = FONT_LIST.find((f) => f.ps === ring.ps);
    if (!entry || G.has_font(ring.ps)) continue;
    try {
      const answer = await fetch(FONT_BASE + entry.file);      // beside the page (the artifact) or the live site's own fonts (GitHub Pages)
      if (!answer.ok) throw new Error(answer.status);
      const bytes = new Uint8Array(await answer.arrayBuffer());
      for (let i = 0; i < 64; i++) { const got = G.add_font(bytes, i); if (!got || got.ps === entry.ps) break; }
    } catch (e) { say(`${entry.family} couldn’t be loaded, so its numerals stand in Inter.`); }
  }
}
/** the dial's shapes as Dial Tool draws them now: hands unturned (they turn each frame), every fill with its colour */
function bake() {
  statik = G.build_static(S);
  const shapes = G.scene(S, statik, S.t, true, null).filter((x) => x.fill && !x.stroke);
  items = shapes.map((x) => ({ role: x.role, hand: (x.role === "hand" || x.role === "mark") && ["hour", "minute", "second"].includes(x.name) ? x.name : null, p: x.path.svg(3), f: hex(x.fill), a: +x.fill[3] }));
  window_key = windows_now();
  // the dial's colours, one row each, named by what wears them, in the order a dial is built: plate, rings, hands, windows
  const seen = new Map();
  for (const x of items) {
    const word = x.role === "hand" && x.hand ? (x.hand === "second" ? "seconds hand" : x.hand + " hand") : ROLE_WORDS[x.role] || x.role;
    if (!seen.has(x.f)) seen.set(x.f, new Set());
    seen.get(x.f).add(word);
  }
  const rank = (words) => Math.min(...[...words].map((w) => { const i = ORDER.findIndex((o) => w.includes(o)); return i < 0 ? ORDER.length : i; }));
  dial_colours = [...seen].map(([f, roles]) => ({ f, printed: items.some((x) => x.f === f && PRINTED(x.role)), roles: [...roles].sort((a, b) => rank([a]) - rank([b])) })).sort((a, b) => rank(a.roles) - rank(b.roles));
}
const INK_START = 6;      // every colour's ink height to start: the last level shown on 20 Oct (20:21)
const PRINTED = (role) => !["plate", "cap", "hand", "mark", "date disc"].includes(role);      // a window's disc is the ground under its hole, not ink: no relief (00:44)      // what carries ink relief (hands get bevels)
const ORDER = ["plate", "rings", "hour", "minute", "seconds", "hand marks", "cap", "window"];
const ROLE_WORDS = { plate: "plate", ring: "rings", hand: "hands", cap: "cap", mark: "hand marks", "date frame": "window frames", "date number": "window text", "date disc": "window discs", "disc print": "disc print", "date picture": "window pictures" };
/** what the windows show now: when it changes (a new day, an am · pm turn, the moon), the dial is baked again */
const windows_now = () => JSON.stringify([G.windows_of(S).map((w) => G.shown_window(S, w)), G.shows_day(S) ? G.day_hour(S) : null]);
const hand_angles = () => { const A = { hour: 0, minute: 0, second: 0 }; for (const x of G.scene(S, statik, S.t, true, null)) if (x.role === "hand" && x.name in A) A[x.name] = x.angle; return A; };

// ── drawing ──
const options = (view = W.view) => ({
  items: items.map((x) => ({ ...x, f: recolour.get(x.f) || x.f, ink: PRINTED(x.role) ? ink_by.get(x.f) ?? INK_START : 0 })), d: S.dial_d, A: hand_angles(), key: W.key, strap: W.strap, nato: W.nato,
  metal: metal(), leather: leather(), natoColours: [0, 1, 2].map((i) => nato_colours()[i] || nato_colours()[0]), floor: floor(), floor2: W.floor ? W.floor2 : null, insert: { top: insert()[0], bottom: insert()[1] },
  L: W.L, h: W.h, size: W.size, view, flare: W.flare, lighting: W.lighting, flareOn: W.blurs && W.flare_on, fl: W.fl, glass: W.glass, ink: W.ink, bevels: W.bevels, shadow: W.shadow,
});
let pending = null, drawn_view = null;
function render(kind = "all") {
  if (kind === "all" || pending === "all") pending = "all"; else pending = "time";
  if (!render.asked) { render.asked = true; requestAnimationFrame(frame); }
}
function frame() {
  render.asked = false;
  const kind = pending; pending = null;
  if (!statik) return;
  if (kind === "time" && windows_now() === window_key) return turn_hands();
  if (kind === "time") bake();
  const svg = E().draw(options());
  stage.innerHTML = svg;
  drawn_view = stage.firstElementChild;
  drawn_view.removeAttribute("width"); drawn_view.removeAttribute("height");
  drawn_view.dataset.box = drawn_view.getAttribute("viewBox");
  ground_look();
  frame_view();
  turn_hands();
  sync_panel();
}
/** the hands to the time shown, and their shadows with them, without drawing the watch again */
function turn_hands() {
  const A = hand_angles();
  for (const n of stage.querySelectorAll("[data-h]")) n.setAttribute("transform", `rotate(${-A[n.dataset.h]})`);
  for (const n of stage.querySelectorAll("[data-hs]")) n.setAttribute("transform", `translate(${n.dataset.sh}) rotate(${-A[n.dataset.hs]})`);
  // a bevel: the hand's half toward the light lighter, the other darker, more so the more the hand lies across the light
  const L = W.L * Math.PI / 180;
  for (const n of stage.querySelectorAll("[data-hb]")) {
    const a = A[n.dataset.hb] * Math.PI / 180, side = Math.cos(a) * Math.cos(L) + Math.sin(a) * Math.sin(L), lit = 0.22 * Math.abs(side), dark = 0.26 * Math.abs(side);
    const [right, left] = n.querySelectorAll("rect");
    n.setAttribute("transform", `rotate(${-A[n.dataset.hb]})`);
    right.setAttribute("fill", side > 0 ? "#fff" : "#000"); right.setAttribute("fill-opacity", (side > 0 ? lit : dark).toFixed(3));
    left.setAttribute("fill", side > 0 ? "#000" : "#fff"); left.setAttribute("fill-opacity", (side > 0 ? dark : lit).toFixed(3));
  }
}
/** the part of the preview not under the controls: the drawing is centred there (the controls lie over the canvas,
 *  see-through, on the right; on a phone along the foot) */
function visible() {
  // measured where the column stands now, so the drawing follows it while it slides
  const mw = main.clientWidth, mh = main.clientHeight, m = main.getBoundingClientRect(), r = side.getBoundingClientRect(), wide = side.offsetTop === 0;
  return wide ? [clamp(r.left - m.left, 0, mw), mh] : [mw, clamp(r.top - m.top, 0, mh)];
}
/** the drawing's box widened to the preview's shape (its ground runs on past the edge), zoomed and moved */
function frame_view() {
  if (!drawn_view) return;
  const [x, y, w, h] = drawn_view.dataset.box.split(" ").map(Number), mw = main.clientWidth, mh = main.clientHeight, [vw, vh] = visible();
  if (!mw || !mh || vw <= 0 || vh <= 0) return;
  // Fit (01:43): the watch by its lugs — lug tip to lug tip as tall as the canvas less the buttons' margin at top and
  // foot, the case (with its crown) as wide as it allows; the whole watch's view fits its whole drawing the same way
  // The Dial view (01:45) fits as Dial Tool's Fit does: the dial and its page margin across the canvas's shorter side
  const cb = E().caseBox(W.key, W.size);
  let k;
  if (W.view === "dial") k = cb.dial * (1 + 2 * (+S.margin || 0) / S.dial_d) / Math.min(vw, vh) / W.zoom;
  else { const M = 2 * (16 + 32 + 16), [bw, bh] = W.view === "full" ? [w, h] : [cb.w, cb.h]; k = Math.max(bw / Math.max(vw - M, 40), bh / Math.max(vh - M, 40)) / W.zoom; }      // millimetres a screen pixel
  drawn_view.setAttribute("viewBox", `${x + w / 2 - (vw / 2 + W.pan[0]) * k} ${y + h / 2 - (vh / 2 + W.pan[1]) * k} ${mw * k} ${mh * k}`);
  place_sun();
}
/** zoom by `ratio` about a point of the preview (pixels from its corner), keeping what is under it there */
function zoom_at(ratio, px, py) {
  const next = clamp(W.zoom * ratio, 0.3, 16), r = next / W.zoom, [vw, vh] = visible();
  W.pan = [px - vw / 2 - (px - vw / 2 - W.pan[0]) * r, py - vh / 2 - (py - vh / 2 - W.pan[1]) * r];
  W.zoom = next; frame_view();
}

// ── the sun: a knob on the preview — its direction from the middle is where the light comes from; nearer the middle,
//    the higher it stands (85° at the middle, 10° at the edge) ──
const H_TOP = 85, H_LOW = 10;
function sun_reach() { const [vw, vh] = visible(); return 0.42 * Math.min(vw, vh); }
function place_sun() {
  const r = sun_reach() * (H_TOP - W.h) / (H_TOP - H_LOW), a = W.L * Math.PI / 180, [vw, vh] = visible();
  sun.hidden = !W.sun_shown;
  sun.style.left = `${vw / 2 + Math.cos(a) * r}px`;
  sun.style.top = `${vh / 2 + Math.sin(a) * r}px`;
}
function sun_to(e) {
  const box = main.getBoundingClientRect(), [vw, vh] = visible(), dx = e.clientX - box.left - vw / 2, dy = e.clientY - box.top - vh / 2;
  W.L = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);
  W.h = Math.round(clamp(H_TOP - (H_TOP - H_LOW) * Math.hypot(dx, dy) / sun_reach(), H_LOW, H_TOP));
  place_sun(); render();
}

// ── saving ──
async function save(filename, blob) {
  let downloads = null;
  try { downloads = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch (e) { downloads = null; }
  if (downloads) {
    try { await downloads.save({ filename, data: blob }); say(`Saved ${filename}.`); } catch (e) { say(e.code === "declined" ? "Not saved." : `Couldn’t save ${filename} (${e.code || e.message}).`); }
    return;
  }
  const a = el("a", { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a); a.click(); a.remove();
  say(`Saved ${filename}.`);
}
/** the drawing at `px` along its longer side, as a canvas: the same SVG the preview shows, at its own box */
async function picture(px) {
  const svg = E().draw(options());
  const [, , w, h] = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
  const k = px / Math.max(w, h), cw = Math.round(w * k), ch = Math.round(h * k);
  const url = URL.createObjectURL(new Blob([svg.replace("<svg ", `<svg width="${cw}" height="${ch}" `)], { type: "image/svg+xml" }));
  const img = new Image();
  await new Promise((ok, fail) => { img.onload = ok; img.onerror = () => fail(new Error("the drawing couldn’t be turned into a picture")); img.src = url; });
  const canvas = el("canvas", { width: cw, height: ch });
  canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
  URL.revokeObjectURL(url);
  return { canvas, mm: [w, h] };
}
const file_base = () => `${(dial_name || "dial").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "dial"}-${W.key}-${W.style}-${W.view}`;
async function export_png() {
  say("Drawing the PNG…");
  const { canvas } = await picture(EXPORT.px);
  save(file_base() + ".png", await new Promise((ok) => canvas.toBlob(ok, "image/png")));
}
/** a PDF of one page at the drawing's real size in millimetres, the picture inside it (JPEG, at EXPORT.px) */
async function export_pdf() {
  say("Drawing the PDF…");
  const { canvas, mm } = await picture(EXPORT.px);
  const jpeg = new Uint8Array(await (await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.95))).arrayBuffer());
  const pt = mm.map((v) => (v * 72 / 25.4).toFixed(2)), enc = new TextEncoder(), parts = [], offsets = [];
  let size = 0;
  const put = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); size += b.length; };
  const obj = (n, body) => { offsets[n] = size; put(`${n} 0 obj\n`); for (const b of [].concat(body)) put(b); put("\nendobj\n"); };
  const draw = `q ${pt[0]} 0 0 ${pt[1]} 0 0 cm /Im0 Do Q`;
  put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt[0]} ${pt[1]}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, "\nendstream"]);
  obj(5, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
  const xref = size;
  put(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  save(file_base() + ".pdf", new Blob(parts, { type: "application/pdf" }));
}
const EXPORT = { px: 3000 };

// ── the panel: Dial Tool's rows ──
const EYE_OPEN = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 8.25C3.75 4.85 6.05 3.55 8.25 3.55S12.75 4.85 14.75 8.25C12.75 11.65 10.45 12.95 8.25 12.95S3.75 11.65 1.75 8.25Z" stroke-width="1.625"></path><circle cx="8.25" cy="8.25" r="2.25" fill="currentColor" stroke="none"></circle></svg>`;
const EYE_SHUT = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 6.75C3.75 9.85 6.05 11.05 8.25 11.05S12.75 9.85 14.75 6.75M8.25 11.05V13.75M4.95 10.35L3.95 12.65M11.55 10.35L12.55 12.65M2.75 8.35L1.35 10.05M13.75 8.35L15.15 10.05" stroke-width="1.625"></path></svg>`;
const syncs = [];      // each row's way of showing its value again
const sync_panel = () => { for (const s of syncs) s(); };
function pane(title, open = true, summary = () => "", head = null) {
  const eye = el("span", { className: "eye" }), sum = el("span", { className: "summary quiet" });
  const fold = el("button", { type: "button", className: "fold", title: "Show or hide this pane" }, eye, el("h2", { textContent: title }), sum);
  const body = el("div", { className: "body" }), section = el("section", { className: head ? "pane headed" : "pane" }, head ? el("div", { className: "headline" }, fold, ...head) : fold, body);
  const set = (on) => { section.classList.toggle("folded", !on); body.hidden = !on; fold.setAttribute("aria-expanded", String(on)); eye.innerHTML = on ? EYE_OPEN : EYE_SHUT; };
  fold.onclick = () => set(body.hidden);
  set(open);
  syncs.push(() => { sum.textContent = summary(); });
  return { section, body };
}
const id_of = (text) => "sc-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
/** a number row as Dial Tool's: its name and its box with − +. `slider`: "own" puts the slider on a line of its own under
 *  it (Okay, 20 Oct 2026, 23:46: from Sun down); "none" leaves it out (Size, Ink height) */
function num(text, lo, hi, step, get, set, slider_at = "own", list = syncs) {
  const id = id_of(text), slider = el("input", { type: "range", min: lo, max: hi, step, id: id + "-slider", ariaLabel: text });
  const field = el("input", { type: "text", id, inputmode: "decimal" });
  const put = (v) => { v = clamp(Math.round(v / step) * step, lo, hi); set(+v.toFixed(4)); render(); sync_panel(); };
  slider.oninput = () => put(+slider.value);
  field.onchange = () => { const v = parseFloat(field.value); if (Number.isFinite(v)) put(v); else sync_panel(); };
  const stepper = (sign) => { const b = el("button", { type: "button", className: "step", tabIndex: -1, ariaLabel: sign < 0 ? "Minus" : "Plus" }); b.innerHTML = sign < 0 ? STEP.minus : STEP.plus; b.onclick = () => put(get() + sign * step); return b; };
  const row = el("div", { className: "row num" + (slider_at === "own" ? " withslider" : "") }, el("label", { htmlFor: id, textContent: text }), el("span", { className: "numbox" }, field, el("span", { className: "steps" }, stepper(-1), stepper(1))));
  const digits = (String(step).split(".")[1] || "").length;
  list.push(() => { const v = get(); if (document.activeElement !== slider) slider.value = v; slider.style.setProperty("--p", ((v - lo) / (hi - lo)).toFixed(4)); if (document.activeElement !== field) field.value = (+v).toFixed(digits); });
  if (slider_at !== "own") return row;
  return el("div", { className: "numpair" }, row, el("div", { className: "row slideline" }, slider));
}
function seg(text, choices, get, set, shown = () => true, many = false, offered = () => true) {
  const group = el("span", { className: many ? "pillswitch many" : "pillswitch", role: "radiogroup", ariaLabel: text });
  const buttons = choices.map(([value, word]) => { const b = el("button", { type: "button", id: id_of(text + "-" + value), textContent: word, role: "radio" }); b.onclick = () => { set(value); render(); sync_panel(); }; group.append(b); return [value, b]; });
  const row = el("div", { className: "row seg" }, el("label", { textContent: text }), group);
  syncs.push(() => { row.hidden = !shown(); for (const [value, b] of buttons) { b.hidden = !offered(value); b.classList.toggle("on", get() === value); b.setAttribute("aria-checked", String(get() === value)); } });
  return row;
}
/** the system's colour picker laid unseen over a swatch, so the press lands on it directly: a picker opened from a
 *  script (input.click()) is refused in the page's frame (00:22: "Color picker does not activate") */
function over_picker(look, label, get, set, after = () => {}) {
  const pick = el("input", { type: "color", className: "overpick", ariaLabel: label, title: label });
  pick.oninput = () => { set(pick.value); after(); render(); sync_panel(); };
  const wrap = el("span", { className: "pickwrap" }, look, pick);
  return { wrap, sync: () => { if (document.activeElement !== pick) pick.value = get(); } };
}
/** a colour row as Dial Tool's: the swatch and its hex; a press opens the system's colour picker */
function colour(text, get, set, shown = () => true, list = syncs) {
  const id = id_of(text), dot = el("i", { className: "dot" }), code = el("span", { className: "hex" });
  const look = el("span", { className: "colour", id }, dot, code);
  const p = over_picker(look, text, get, set);
  const row = el("div", { className: "row col" }, el("label", { textContent: text, title: text }), p.wrap);
  list.push(() => { row.hidden = !shown(); const c = get(); dot.style.setProperty("--c", c); code.textContent = c.toUpperCase(); p.sync(); });
  return row;
}
/** a colour's ink height (23:51, 00:03): indented under its colour, the number as plain text with − + beside it */
function ink_row(f, i) {
  const get = () => ink_by.get(f) ?? INK_START, put = (v) => { ink_by.set(f, clamp(Math.round(v), 0, 10)); render(); sync_panel(); };
  // a number box like the others, black (00:27)
  const value = el("input", { type: "text", className: "inkval", id: `sc-ink-${i + 1}`, inputMode: "numeric", ariaLabel: "Ink height" });
  value.onchange = () => { const v = parseFloat(value.value); if (Number.isFinite(v)) put(v); else sync_panel(); };
  value.onfocus = () => value.select();
  const stepper = (sign) => { const b = el("button", { type: "button", className: "step", ariaLabel: sign < 0 ? "Ink lower" : "Ink higher" }); b.innerHTML = sign < 0 ? STEP.minus : STEP.plus; b.onclick = () => put(get() + sign); return b; };
  const row = el("div", { className: "row inkrow" }, el("span", { className: "blank" }), el("span", { className: "inkbox" }, el("label", { htmlFor: value.id, textContent: "Ink height" }), el("span", { className: "numbox" }, value, el("span", { className: "steps" }, stepper(-1), stepper(1)))));
  dial_syncs_now.push(() => { if (document.activeElement !== value) value.value = get(); });
  return row;
}
let dial_syncs_now = [];
/** a note in Dial Tool's way: under a tick its words start with the tick's words; under a field, on the controls' column */
const note = (get, after = "", wide = false) => { const q = el("span", { className: "quiet" }), row = el("div", { className: "row note" + (after === "field" ? " under" : "") }, el("span"), q); if (after) row.dataset.after = after; if (wide) row.classList.add("wide"); syncs.push(() => { const t = get(); row.hidden = !t; q.textContent = t; }); return row; };
function chk(text, get, set, shown = () => true, flush = false) {
  const id = id_of(text), box = el("input", { type: "checkbox", id });
  box.onchange = () => { set(box.checked); render(); sync_panel(); };
  const row = el("div", { className: flush ? "row chk flush" : "row chk" }, el("span"), el("label", { className: "check", htmlFor: id }, box, el("span", { className: "words", textContent: text })));
  syncs.push(() => { row.hidden = !shown(); box.checked = get(); });
  return row;
}
/** two ticks on one line: the first from the names' column, the second where the controls start (02:21) */
function chk_pair(a, b) {
  const one = chk(...a), two = chk(...b);
  const row = el("div", { className: "row chk pair" }, one.querySelector(".check"), two.querySelector(".check"));
  const [, , , shown_b = () => true] = b, second = row.lastChild;
  syncs.push(() => { second.style.visibility = shown_b() ? "" : "hidden"; });
  return row;
}
/** a share of the engine's own amount, as a percentage */
const pct = (text, lo, hi, obj, key, shown) => { const row = num(text, lo, hi, 1, () => Math.round(obj()[key] * 100), (v) => { obj()[key] = v / 100; }); if (shown) syncs.push(() => { row.hidden = !shown(); }); return row; };
function say(text) { message = text; sync_panel(); }
let message = "";

// ── the window ──
const stage = el("div", { className: "stage" });
const sun = el("button", { type: "button", className: "sunknob", title: "The sun: drag it, or drag anywhere on the drawing", ariaLabel: "The sun" });
const main = el("main", { className: "dark" }, stage, sun);
const side = el("div", { className: "side night" });      // the controls and the bar, one column over the canvas

// ── on the canvas: Fit and the ground's colour at the bottom left; the column's switch at the top right ──
// zoom: − + Fit as one pill (Okay, 20 Oct 2026, 23:46)
const zoom_step = (sign) => { const b = el("button", { type: "button", className: "zstep", id: sign < 0 ? "zoom-out" : "zoom-in", title: sign < 0 ? "Zoom out" : "Zoom in", ariaLabel: sign < 0 ? "Zoom out" : "Zoom in" }); b.innerHTML = icon(sign < 0 ? `<path d="M3.75 8.25H12.75"/>` : `<path d="M8.25 3.75V12.75M3.75 8.25H12.75"/>`); b.onclick = () => host.zoom(sign < 0 ? 1 / 1.4 : 1.4); return b; };
const fit = el("button", { type: "button", className: "zstep fitword", id: "fit", title: "Show the whole drawing" }, el("span", { className: "word", textContent: "Fit" }));
const zoom_pill = el("div", { className: "onview zoompill", role: "group", ariaLabel: "Zoom" }, zoom_step(-1), zoom_step(1), fit);
const ground_dot = el("i", { className: "dot" });
const ground_button = el("button", { type: "button", className: "onview backdropbox", id: "ground", title: "The background: one colour, or two for a gradient", ariaExpanded: "false" }, ground_dot, el("span", { className: "word", textContent: "Background" }));
const ground_pop = el("div", { className: "groundpop night", id: "ground-pop", hidden: true });
const canvas_foot = el("div", { className: "canvasfoot" }, ground_pop, el("div", { className: "canvasbtns" }, zoom_pill, ground_button));
// the column's switch: an arrow on the column's left edge that travels with it — pointing right to put the column away,
// left to bring it back (00:29); on a phone, along its top edge, down and up
const side_switch = el("button", { type: "button", className: "onview sideswitch", id: "side-switch" });      /* a round button of the panel's colour, an arrow on it (03:35, after a send button) */
/** the panel in Dial Tool's greys, as the bar, instead of the ground's colour: the round swatch at the title line's end
 *  (03:35). It shows the other look: grey while tinted, the tinted colour while grey; a click swaps them */
const grey_swatch = el("button", { type: "button", className: "greyswatch", id: "sc-grey" });
/** the ground's look on the screen: the column a much darker, stronger version of the first colour, at 70 %; the canvas
 *  buttons light or dark by the ground under them */
function ground_look() {
  const c = floor(), n = parseInt(c.slice(1), 16), [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => v / 255);
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = (hi + lo) / 2, d = hi - lo, sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = 0; if (d) h = hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  // the column: a much darker, strongly saturated version of the ground at 85 % (00:51)
  let ch = Math.round(h * 60), cs = Math.round(Math.min(1, sat * 2.2 + 0.15) * 100), cl = Math.round(l * 30);
  const tinted = `hsl(${ch} ${cs}% ${cl}%)`, GREY = [0, 0, 13];      // the bar's grey, #212121
  if (W.grey_panel) [ch, cs, cl] = GREY;
  grey_swatch.style.background = W.grey_panel ? tinted : `hsl(0 0% ${GREY[2]}%)`;
  grey_swatch.title = grey_swatch.ariaLabel = W.grey_panel ? "The panel in the background's colour" : "The panel in greys";
  grey_swatch.setAttribute("aria-pressed", String(Boolean(W.grey_panel)));
  side.style.setProperty("--column-solid", `hsl(${ch} ${cs}% ${Math.min(100, cl + 10)}%)`);      // the top's colour, the brighter one (03:40)
  const op = W.grey_panel ? 1 : 0.85;      // grey: solid, as the bar
  side.style.setProperty("--column", `hsl(${ch} ${cs}% ${cl}% / ${op})`);
  side.style.setProperty("--column-top", `hsl(${ch} ${cs}% ${Math.min(100, cl + 10)}% / ${op})`);      // the top, a tenth lighter
  // the interface's "blacks" (row lines, pill outlines, the ink rows' words): always a clear step from the column — 22
  // points darker where the column is light enough, else 22 lighter — so they hold at midtones and darks alike
  side.style.setProperty("--uiblack", cl >= 22 ? `hsl(${ch} ${cs}% ${cl - 22}%)` : `hsl(${ch} ${Math.min(cs, 60)}% ${cl + 22}%)`);
  // …and for words, which need more: 40 points
  side.style.setProperty("--uiblack-text", cl >= 22 ? `hsl(${ch} ${cs}% ${Math.max(0, cl - 40)}%)` : `hsl(${ch} ${Math.min(cs, 50)}% ${cl + 40}%)`);
  // the panel's whites and greys tinted by the ground too (03:14: "the white 2 shades lighter than mid color; other
  // darker and lighter grays get tinted by the bg as well"). A shade is the 22-point step the lines take; the lines (the
  // mid colour) sit a shade above the column, the white two shades above them. The bar keeps Dial Tool's greys.
  const panel = side.querySelector(".panel");
  if (panel) {
    const tint = Math.min(cs, 40), grey = Math.min(cs, 25), wl = Math.min(97, cl + 22 + 44);
    const set = (k, v) => panel.style.setProperty(k, v);
    side.style.setProperty("--switch-ink", `hsl(${ch} ${tint}% ${wl}%)`);
    set("--ink", `hsl(${ch} ${tint}% ${wl}%)`); set("--grey", `hsl(${ch} ${tint}% ${wl}% / 0.66)`); set("--white", `hsl(${ch} ${tint}% ${Math.min(100, wl + 6)}%)`);
    // the boxes and their outlines a step from the column, the same way as the lines (darker on a light column, lighter
    // on a dark one): a fixed grey vanished once tinted, being the column's own hue (03:18: "we lost the rounded boxes")
    const by = (k) => Math.max(0, Math.min(100, cl >= 22 ? cl - k : cl + k));
    set("--night", `hsl(${ch} ${grey}% ${Math.max(0, cl - 4)}%)`); set("--night-field", `hsl(${ch} ${grey}% ${by(11)}%)`); set("--field", `hsl(${ch} ${grey}% ${by(11)}%)`);
    set("--hover", `hsl(${ch} ${grey}% ${by(16)}%)`); set("--rule", `hsl(${ch} ${grey}% ${by(22)}%)`); set("--chip-rule", `hsl(${ch} ${tint}% ${wl}% / 0.28)`);
  }
  main.style.setProperty("--floor", W.floor2 && W.floor ? `linear-gradient(135deg, ${W.floor}, ${W.floor2})` : E().edge(c, W.lighting === "flat" ? "flat" : "detail"));
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  main.classList.toggle("dark", lum < 0.55);
  ground_dot.style.setProperty("--c", c);
  ground_dot.style.background = W.floor2 && W.floor ? `linear-gradient(135deg, ${W.floor}, ${W.floor2})` : c;
  const shown = W.side_shown;
  side.classList.toggle("away", !shown);
  const wide = side.offsetTop === 0, arrow = wide ? (shown ? "M3.25 8.25H12.75M8.75 4.25L12.75 8.25L8.75 12.25" : "M13.25 8.25H3.75M7.75 4.25L3.75 8.25L7.75 12.25") : (shown ? "M8.25 3.25V12.75M4.25 8.75L8.25 12.75L12.25 8.75" : "M8.25 13.25V3.75M4.25 7.75L8.25 3.75L12.25 7.75");
  side_switch.innerHTML = icon(`<path d="${arrow}"/>`);
  side_switch.title = side_switch.ariaLabel = shown ? "Hide the controls" : "Show the controls";
  side_switch.setAttribute("aria-pressed", String(shown));
  if (!drawn_view) return;
  frame_view();
}
// while the column slides (eased, Dial Tool's view time), the drawing re-centres each frame
grey_swatch.onclick = () => { W.grey_panel = !W.grey_panel; ground_look(); };
side_switch.onclick = () => {
  W.side_shown = !W.side_shown; ground_look();
  const until = performance.now() + 800, follow = () => { frame_view(); bar.place_needle(); if (performance.now() < until) requestAnimationFrame(follow); };
  requestAnimationFrame(follow);
};
fit.onclick = () => { W.zoom = 1; W.pan = [0, 0]; frame_view(); };
const ground_syncs = [];
ground_button.onclick = () => { ground_pop.hidden = !ground_pop.hidden; ground_button.setAttribute("aria-expanded", String(!ground_pop.hidden)); for (const s of ground_syncs) s(); };
document.addEventListener("pointerdown", (e) => { if (!ground_pop.hidden && !canvas_foot.contains(e.target)) { ground_pop.hidden = true; ground_button.setAttribute("aria-expanded", "false"); } }, true);
/** the background popup: two sides — left one colour, right a gradient — each ten presets, and under them a button
 *  holding the colour itself (one swatch, or two for the gradient); a press on a swatch opens the colour picker */
let grad = GRADIENTS[8].slice(1);      /* Ember, the opener's */      // the gradient's two colours, kept while one colour is shown
function ground_popup() {
  const refresh = () => { render(); for (const f of ground_syncs) f(); };
  refresh_ground = refresh;
  const tile = (name, look, on, act) => { const b = el("button", { type: "button", className: "groundtile", title: name, ariaLabel: name }, el("i")); b.firstChild.style.background = look; b.onclick = act; ground_syncs.push(() => b.classList.toggle("on", on())); return b; };
  const side = (title, tiles, button) => el("div", { className: "groundside" }, el("h3", { textContent: title }), el("div", { className: "groundtiles" }, ...tiles), button);
  // one colour: one swatch and its hex; the picker over it
  const one_dot = el("i", { className: "dot" }), one_hex = el("span", { className: "hex" });
  const one_look = el("span", { className: "colour groundpick", id: "ground-one" }, one_dot, one_hex);
  const one = over_picker(one_look, "The background's colour", floor, (c) => { W.floor = c; W.floor2 = null; W.ground_set = true; }, () => { for (const f of ground_syncs) f(); });
  ground_syncs.push(() => { one_dot.style.setProperty("--c", floor()); one_hex.textContent = floor().toUpperCase(); one_look.classList.toggle("on", !W.floor2); one.sync(); });
  const one_button = one.wrap;
  // a gradient: its two colours, each a swatch with a picker of its own, in one box
  const g_parts = [0, 1].map((k) => { const d = el("span", { className: "gdot" }, el("i", { className: "dot" })); return [d, over_picker(d, k ? "The gradient's second colour" : "The gradient's first colour", () => grad[k], (c) => { grad[k] = c; W.floor = grad[0]; W.floor2 = grad[1]; W.ground_set = true; }, () => { for (const f of ground_syncs) f(); })]; });
  const g_dots = g_parts.map(([d]) => d);
  const g_button = el("span", { className: "colour groundpick gradpick", id: "ground-gradient" }, ...g_parts.map(([, p]) => p.wrap));
  ground_syncs.push(() => g_parts.forEach(([, p]) => p.sync()));
  ground_syncs.push(() => { g_dots.forEach((d, k) => d.firstChild.style.setProperty("--c", grad[k])); g_button.classList.toggle("on", Boolean(W.floor2)); });
  ground_pop.append(el("div", { className: "pophead" }, el("h2", { textContent: "Background" })),
    el("div", { className: "groundsides" },
      side("One colour", SOLIDS.map(([n, c]) => tile(n, c, () => !W.floor2 && W.floor === c, () => { W.floor = c; W.floor2 = null; W.ground_set = true; refresh(); })), one_button),
      side("Gradient", GRADIENTS.map(([n, a, b]) => tile(n, `linear-gradient(135deg, ${a}, ${b})`, () => W.floor2 === b && W.floor === a, () => { grad = [a, b]; W.floor = a; W.floor2 = b; W.ground_set = true; refresh(); })), g_button)));
}
const middle = () => { const [vw, vh] = visible(); return [vw / 2, vh / 2]; };
const host = { S, render, zoom: (k) => zoom_at(k, ...middle()), fit: () => { W.zoom = 1; W.pan = [0, 0]; frame_view(); } };
const bar = new Bar(host);

const LINE = 1.5, CURVE = LINE + 2 / 16, RIM = 15.5 - CURVE / 2, C = 17.25;
const SECTION_SIGNS = {
  Dial: `<circle class="hub" cx="17" cy="17" r="2" stroke-width="${CURVE}"/>`,      // Dial Tool's own: the plate and its centre hole
  // a watch: Dial Tool's Case icon (its ring, short lugs, the hands at three, the crown's stub), without the ink traps,
  // drawn 1.2 times its 18-point size so its line comes out at the tabs' own weight (1.25 × 1.2 = 1.5)
  Watch: `<g transform="translate(5.9 5.9) scale(1.2)" stroke-width="1.25"><circle cx="9.25" cy="9.25" r="5.5"/><path d="M6.25 2.75V5M12.25 2.75V5M6.25 13.5V15.75M12.25 13.5V15.75"/><path d="M9.25 9.25V6M9.25 9.25H11.75M14.75 9.25H15.75"/></g>`,
  // light: a small sun, eight short rays (01:16: "shorter")
  Light: `<circle cx="17" cy="17" r="3" fill="currentColor" stroke="none"/><path d="${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `M${(17 + c * 5.75).toFixed(2)} ${(17 + s * 5.75).toFixed(2)}L${(17 + c * 7.75).toFixed(2)} ${(17 + s * 7.75).toFixed(2)}`; }).join("")}"/>`,
  Export: `<path d="M${C} 9.25V20.25M13.25 16.25L${C} 20.25L21.25 16.25M10.75 24.25H23.75"/>`,      // Dial Tool's own
};
const section_icon = (name) => icon(`<circle class="ring" cx="17" cy="17" r="${RIM}" stroke-width="${CURVE}"/><g class="sign">${SECTION_SIGNS[name]}</g>`, 34);
function panel() {
  // the dial: its link and Open on the pane's heading line (Okay, 20 Oct 2026, 23:38); under it the dial's own colours,
  // the ink's height and the hands' bevels
  const link = el("input", { type: "text", id: "sc-link", placeholder: "Paste a Dial Tool link", value: FIRST_LINK, ariaLabel: "A Dial Tool link" });
  const open = async () => { try { say("Opening…"); await open_link(link.value); if (!W.ground_set) { W.floor = W.floor2 = null; refresh_ground(); } say(""); bar.sync_time(); render(); } catch (e) { say(e.message); } };
  link.onkeydown = (e) => { if (e.key === "Enter") open(); };
  link.onpaste = () => setTimeout(open, 0);
  const dial = pane("Dial", true, () => "", [link, el("button", { type: "button", className: "btn main", id: "sc-open", textContent: "Open", onclick: open })]);
  dial.body.append(note(() => message));

  // the watch: its case and metal, the diver's insert, the strap — each with its colours under its presets. A bracelet
  // only on the diver, and only in one of the metals (Okay, 20 Oct 2026, 23:28)
  const watch = pane("Watch", true, () => `${W.key} · ${W.style}`);
  const nato_at = (i) => nato_colours()[i] || nato_colours()[0];
  watch.body.append(
    seg("View", [["detail", "Detail"], ["full", "Whole watch"], ["dial", "Dial"]], () => W.view, (v) => { W.view = v; W.zoom = 1; W.pan = [0, 0]; }),
    seg("Case", [["dress", "Dress"], ["field", "Field"], ["diver", "Diver"], ["emre01", "Emre01"]], () => W.key, (v) => { W.key = v; W.strap = v === "diver" ? (metal_strap() ? W.strap : "bracelet") : metal_strap() ? "leather" : W.strap; if (metal_strap()) W.metal = null; }),
    num("Size", 0.8, 1.2, 0.01, () => W.size, (v) => { W.size = v; }, "none"),
    seg("Metal", [["steel", "Fe"], ["gold", "Au"], ["alu", "Al"], ["bronze", "CuSn"], ["titanium", "Ti"], ["black", "Black"]], () => (W.metal ? null : W.metal_preset), (v) => { W.metal_preset = v; W.metal = null; }, () => true, true),
    colour("Case colour", metal, (c) => { W.metal = c; }, () => !metal_strap()),
    note(() => (metal_strap() ? "With the bracelet, the case and bracelet are one of the metals." : ""), "field"),
    seg("Insert", [["black", "Black"], ["blue", "Blue"], ["green", "Green"], ["pepsi", "Pepsi"], ["batman", "Batman"], ["coke", "Coke"], ["rootbeer", "Root beer"], ["sprite", "Sprite"]], () => (W.insert ? null : W.insert_preset), (v) => { W.insert_preset = v; W.insert = null; }, () => W.key === "diver", true),
    colour("Insert top", () => insert()[0], (c) => { W.insert = [c, insert()[1]]; }, () => W.key === "diver"),
    colour("Insert bottom", () => insert()[1], (c) => { W.insert = [insert()[0], c]; }, () => W.key === "diver"));
  // the strap, its own pane (02:21)
  const strap = pane("Strap", true, () => (W.strap === "nato" ? "NATO" : W.strap));
  strap.body.append(
    seg("Strap", [["leather", "Leather"], ["nato", "NATO"], ["bracelet", "Bracelet"], ["links", "Links"]], () => W.strap, (v) => { W.strap = v; if (metal_strap()) W.metal = null; }, () => true, false, (v) => (v !== "bracelet" && v !== "links") || W.key === "diver"),
    seg("Leather", [["tan", "Tan"], ["brown", "Brown"], ["black", "Black"]], () => (W.leather ? null : W.leather_preset), (v) => { W.leather_preset = v; W.leather = null; }, () => W.strap === "leather"),
    colour("Strap colour", leather, (c) => { W.leather = c; }, () => W.strap === "leather"),
    seg("Pattern", [["bond", "Bond"], ["regimental", "Regimental"], ["khaki", "Khaki"], ["blackgrey", "Black · grey"], ["olive", "Olive"], ["grey", "Grey"]], () => W.nato, (v) => { W.nato = v; W.nato_colours = null; }, () => W.strap === "nato", true),
    ...[0, 1, 2].map((i) => colour(`Stripe ${i + 1}`, () => nato_at(i), (c) => { W.nato_colours = [0, 1, 2].map((k) => (k === i ? c : nato_at(k))); }, () => W.strap === "nato" && i < E().STRIPE_COUNT(W.nato))));
  // the reset, its own pane (02:21): the case's, the insert's and the strap's colours back to their presets
  const reset = pane("Reset", true, () => "", [el("button", { type: "button", className: "btn", id: "sc-reset-watch", textContent: "Reset watch colours", onclick: () => { W.metal = W.leather = W.nato_colours = W.insert = null; render(); sync_panel(); } })]);      /* the button on the pane's own line, as Dial's link and Open (02:26) */

  // the dial's own colours, one row each: made again when another dial opens
  const dial_rows = el("div", { className: "dialcolours" }), dial_syncs = [];
  let listed = null;
  syncs.unshift(() => {
    if (listed !== dial_colours) {
      listed = dial_colours;
      dial_syncs.length = 0; dial_syncs_now = dial_syncs;
      // each colour, then (where it is printed) its own ink height, the two tied as one
      dial_rows.replaceChildren(...dial_colours.map(({ f, roles, printed }, i) => {
        const name = roles.join(" · ").replace(/^./, (c) => c.toUpperCase());
        const group = el("div", { className: "inkgroup" }, colour(name, () => recolour.get(f) || f, (c) => recolour.set(f, c), () => true, dial_syncs));
        if (printed) group.append(ink_row(f, i));
        return group;
      }));
    }
    for (const s of dial_syncs) s();
  });
  dial.body.append(dial_rows,
    el("div", { className: "row" }, el("span", { className: "blank" }), el("button", { type: "button", className: "btn", id: "sc-reset-colours", textContent: "Reset colours and ink", onclick: () => { recolour = new Map(); ink_by = new Map(); render(); sync_panel(); } })),
    chk("Hand bevels", () => W.bevels, (v) => { W.bevels = v; }));

  const shade = pane("Shadows", true, () => `${Math.round(W.shadow * 100)} %`);
  shade.body.append(pct("Darkness %", 0, 250, () => W, "shadow"));

  const light = pane("Sun", true, () => `from ${W.L}° · ${W.h}° high`);
  light.body.append(
    num("From", 0, 359, 1, () => W.L, (v) => { W.L = v; }),
    num("Height", H_LOW, H_TOP, 1, () => W.h, (v) => { W.h = v; }),
    chk("Show the sun", () => W.sun_shown, (v) => { W.sun_shown = v; }, () => true, true),
    note(() => "One finger or the pointer moves the sun: its direction is where the light comes from; nearer the middle, higher. Two fingers zoom and move the drawing; on a trackpad, pinch and scroll.", "tick", true));

  // the flare: Detail's bright bloom on the case's edge. Blurs off is the flat version: no blur anywhere, so no flare.
  const flare_shown = () => W.blurs && W.flare_on;
  const flare = pane("Flare", true, () => (!W.blurs ? "blurs off" : !W.flare_on ? "off" : `${W.style === "miyazaki" ? W.flare + " · " : ""}${Math.round(W.fl.size * 100)} %`));
  flare.body.append(
    chk_pair(["Blurs", () => W.blurs, (v) => { W.blurs = v; }], ["Flare", () => W.flare_on, (v) => { W.flare_on = v; }, () => W.blurs]),
    seg("Kind", [["arc", "Arc"], ["dot", "Dot"]], () => W.flare, (v) => { W.flare = v; }, () => flare_shown() && W.style === "miyazaki"),
    pct("Size %", 20, 300, () => W.fl, "size", flare_shown),
    pct("Case colour %", 0, 100, () => W.fl, "tint", flare_shown),
    pct("Brightness %", 0, 300, () => W.fl, "bright", flare_shown),
    note(() => (flare_shown() && W.lighting === "flat" ? "The flare shows with dramatic lighting." : ""), "field"));

  const glass = pane("Glass reflection", true, () => `shine ${Math.round(W.glass.op * 100)} %`);
  glass.body.append(
    pct("Width %", 0, 400, () => W.glass, "fat"),
    pct("Length %", 10, 300, () => W.glass, "len"),
    pct("Opacity %", 0, 200, () => W.glass, "op"));


  const out = pane("Export", true, () => "");
  out.body.append(
    el("div", { className: "row" }, el("label", { textContent: "Image" }), el("button", { type: "button", className: "btn main", id: "sc-png", textContent: "PNG", onclick: () => export_png().catch((e) => say(e.message)) })),
    el("div", { className: "row" }, el("span", { className: "blank" }), el("button", { type: "button", className: "btn main", id: "sc-pdf", textContent: "PDF", onclick: () => export_pdf().catch((e) => say(e.message)) })),
    num("Pixels", 1000, 8000, 100, () => EXPORT.px, (v) => { EXPORT.px = v; }),
    note(() => `The view as shown, ${EXPORT.px} px along its longer side. The PDF holds the same picture on a page at the drawing’s real size in millimetres.`, "field", true));

  // the title as Dial Tool's: Okay's mark, the name, the version (01:16: "Dial Tool Show Case v1.0")
  const mark = el("button", { type: "button", className: "logo", id: "logo", title: "About Dial Tool", ariaLabel: "About Dial Tool", ariaExpanded: "false" }); mark.innerHTML = icon(`<circle cx="8" cy="8" r="7" stroke-width="1.375"/><path d="M1.62 10.88L10.88 1.62M6.5 6H14.71M6.5 6V14.84M10 6V10H6.5M10 10L12.95 12.95" stroke-width="1"/>`);
  const name = el("h1", { textContent: "Dial Tool " }); name.append(el("span", { className: "light", textContent: "Show Case" }));
  const title = el("div", { className: "title" }, name, el("span", { className: "quiet", textContent: VERSION }), el("a", { className: "quiet help", href: "https://duztman.github.io/dial-tool/guide/", target: "_blank", rel: "noopener", textContent: "Help" }));
  // tabs at the top, as Dial Tool's (01:07): Dial · Watch · Light (the sun, shadows, flare, glass) · Export
  // the Light tab's persistent line: the drawing's Style, kept above the panes as they scroll (01:43)
  const style_line = el("div", { className: "pinline" }, seg("Style", [["engineer", "Engineer"], ["miyazaki", "Miyazaki"]], () => W.style, (v) => { W.style = v; }),
    seg("Lighting", [["dramatic", "Dramatic"], ["flat", "Flat"]], () => W.lighting, (v) => { W.lighting = v; }));
  const TABS = [["Dial", [dial]], ["Watch", [watch, strap, reset]], ["Light", [light, shade, flare, glass]], ["Export", [out]]];
  const tabs = el("nav", { className: "tabs" });
  const show = (k) => { TABS.forEach(([, panes], i) => panes.forEach((p) => { p.section.hidden = i !== k; })); style_line.hidden = TABS[k][0] !== "Light"; TABS.forEach(([, panes], i) => panes.forEach((p, j) => p.section.classList.toggle("first", i === k && j === 0))); [...tabs.children].forEach((b, i) => { b.classList.toggle("on", i === k); b.setAttribute("aria-selected", String(i === k)); }); W.tab = k; };
  TABS.forEach(([name], i) => { const b = el("button", { type: "button", role: "tab", id: "tab-" + name.toLowerCase() }); b.innerHTML = section_icon(name); b.append(el("span", { textContent: name })); b.onclick = () => show(i); tabs.append(b); });
  tabs.setAttribute("role", "tablist");
  show(0);
  // the mark opens the bio, as in Dial Tool: the same words
  const a = (href, text) => el("a", { href, textContent: text, target: "_blank", rel: "noopener" }), line = (...kids) => el("p", {}, ...kids);
  const first = line("A tool for designing watch dials, ring by ring, in the browser. Designed and vibecoded by Okay (pronounced oak·eye), a graphic designer in Istanbul working across contemporary art, architecture and cinema, for a watch he is building. ");
  const MAIL = [122, 120, 116, 57, 123, 126, 118, 122, 112, 87, 101, 118, 123, 126, 110, 118, 115, 118, 101, 118, 124, 110, 118, 124, 120];      // Dial Tool's: the address kept from robots
  first.append("Contact him ", el("a", { href: "#contact", textContent: "here", onclick: (e) => { e.preventDefault(); location.href = "mailto:" + String.fromCharCode(...MAIL.map((c) => c ^ 23).reverse()); } }), ".");
  const bio = el("div", { className: "bio night", id: "bio", hidden: true }, first,
    line("Source, every version and the MIT licence: ", a("https://github.com/duztman/dial-tool", "github.com/duztman/dial-tool"), "."),
    el("h3", { textContent: "Built on open source" }),
    el("ul", {},
      el("li", {}, a("https://harfbuzz.github.io", "HarfBuzz"), " sets the type (harfbuzzjs, MIT)."),
      el("li", {}, a("https://skia.org", "Skia"), "’s PathKit joins and cuts the shapes (BSD 3-clause)."),
      el("li", {}, a("https://rsms.me/inter/", "Inter"), " by Rasmus Andersson is the stand-in typeface; ", a("https://fonts.google.com/specimen/Silkscreen", "Silkscreen"), " by Jason Kottke sets the tiny figures (SIL OFL)."),
      el("li", {}, "The twenty-one dial typefaces, each under its designers’ SIL Open Font License, most of them from ", a("https://fonts.google.com", "Google Fonts"), "."),
      el("li", {}, a("https://www.drawbot.com", "DrawBot"), " is where the tool began; ", a("https://esbuild.github.io", "esbuild"), " builds it and ", a("https://playwright.dev", "Playwright"), " tests it.")));
  const open_bio = (on) => { bio.hidden = !on; mark.setAttribute("aria-expanded", String(on)); };
  mark.onclick = () => open_bio(bio.hidden);
  document.addEventListener("pointerdown", (e) => { if (!bio.hidden && !bio.contains(e.target) && !mark.contains(e.target)) open_bio(false); }, true);
  return el("aside", { className: "panel" }, el("header", {}, el("div", { className: "mast" }, el("div", { className: "about" }, mark, bio), title), grey_swatch), tabs, style_line,
    el("div", { className: "form" }, ...TABS.flatMap(([, panes]) => panes.map((p) => p.section))));
}

// ── start ──
const pathkit = await PathKitInit({ wasmBinary: globalThis.__DIAL.bytes("pathkit") });
G.start(pathkit, HarfBuzz);
G.add_font(globalThis.__DIAL.bytes("font"), 0, true);
ENGINEER.attach(pathkit); MIYAZAKI.attach(pathkit);
const app = document.getElementById("app");
app.classList.add("sc");
side.append(panel(), bar.el);
ground_popup();
main.append(canvas_foot);
side.append(side_switch);
syncs.push(() => { for (const f of ground_syncs) f(); });
app.replaceChildren(main, side);
start_ink();
// the sun follows a drag anywhere on the drawing; ⌘ or Ctrl + scroll zooms (as in Dial Tool); a pinch too
// one finger or the pointer: the sun. Two fingers: zoom (their spread) and move (their middle). A trackpad: pinch
// zooms (the browser sends it as a wheel with Ctrl), two-finger scroll moves; ⌘ + scroll zooms too, as in Dial Tool.
const pts = new Map();
let pair = null;
const at = (e) => { const r = main.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
const pair_now = () => { const [a, b] = [...pts.values()]; return { mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; };
main.addEventListener("pointerdown", (e) => {
  if (e.button > 0 || e.target.closest(".side, .canvasfoot, .sideswitch")) return;
  pts.set(e.pointerId, at(e)); main.setPointerCapture(e.pointerId); e.preventDefault();
  if (pts.size === 1) { main.classList.add("sunning"); sun_to(e); }
  if (pts.size === 2) { main.classList.remove("sunning"); pair = pair_now(); }
});
main.addEventListener("pointermove", (e) => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, at(e));
  if (pts.size === 1 && !pair) return sun_to(e);
  if (pts.size === 2 && pair) {
    const now = pair_now();
    W.pan = [W.pan[0] + now.mid[0] - pair.mid[0], W.pan[1] + now.mid[1] - pair.mid[1]];
    zoom_at(pair.d > 0 ? now.d / pair.d : 1, ...now.mid);
    pair = now;
  }
});
const let_go = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pair = pts.size ? pair : null; if (!pts.size) { pair = null; main.classList.remove("sunning"); } };
main.addEventListener("pointerup", let_go); main.addEventListener("pointercancel", let_go);
main.addEventListener("wheel", (e) => {
  if (e.target.closest(".side, .groundpop")) return;
  e.preventDefault();
  if (e.metaKey || e.ctrlKey) zoom_at(Math.exp(-e.deltaY / (e.ctrlKey ? 100 : 300)), ...at(e));
  else { W.pan = [W.pan[0] - e.deltaX, W.pan[1] - e.deltaY]; frame_view(); }
}, { passive: false });
new ResizeObserver(() => { frame_view(); bar.place_needle(); }).observe(main);
bar.sync_time();
try { await open_link(FIRST_LINK); } catch (e) { say(e.message); }
render();
