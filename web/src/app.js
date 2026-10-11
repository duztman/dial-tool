// Dial Tool, web version — part 4: the window.
//
//   left: sections (Dial · Rings · Hands · Date · Export), each a list of rows
//   right: the preview (SVG — one element per scene item) and the bar under it
//
// Rows are described as data (ROWS), as in dial.py; one function turns a row into
// controls. Controls change the settings S and ask for a frame; the frame draws (R28).

import * as G from "./geometry.js";
import { svg_document, pdf_document } from "./output.js";

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children) e.append(c);
  return e;
};
const svg_el = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const LAST = "dial-tool-last";                     // the last session, kept by the browser
const FEATURE_NAMES = {
  kern: "kerning", liga: "ligatures", calt: "contextual alternates", dlig: "discretionary ligatures",
  tnum: "tabular figures", pnum: "proportional figures", onum: "oldstyle figures", lnum: "lining figures",
  zero: "slashed zero", frac: "fractions", sups: "superscript", subs: "subscript", sinf: "scientific inferiors",
  ordn: "ordinals", smcp: "small caps", c2sc: "caps to small caps", case: "case-sensitive forms",
  salt: "stylistic alternates", swsh: "swash", titl: "titling", ccmp: "glyph composition", locl: "localized forms",
  mark: "mark positioning", mkmk: "mark to mark", aalt: "access all alternates", cpsp: "capital spacing",
  hist: "historical forms", ornm: "ornaments", dnom: "denominators", numr: "numerators",
  afrc: "alternative fractions", rvrn: "variation alternates",
};
const DEFAULT_ON = new Set(["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "rlig", "rclt", "curs", "clig", "rvrn"]);

// ── rows: what each section shows ────────────────────────────

const num = (key, text, lo, hi, step, o = {}) => ({ kind: "num", key, text, lo, hi, step, ...o });
const pop = (key, text, items, o = {}) => ({ kind: "pop", key, text, items, ...o });
const seg = (key, text, items, o = {}) => ({ kind: "seg", key, text, items, ...o });
const chk = (key, text, o = {}) => ({ kind: "chk", key, text, ...o });
const col = (key, text, o = {}) => ({ kind: "col", key, text, ...o });
const txt = (key, text, o = {}) => ({ kind: "txt", key, text, ...o });
const hdr = (text, o = {}) => ({ kind: "hdr", text, ...o });
const info = (text, o = {}) => ({ kind: "note", text, ...o });
const custom = (name, o = {}) => ({ kind: "custom", name, ...o });

const kind_in = (...names) => (R) => names.includes(G.kind_of(R));
const marks_with = (...shapes) => (R) => ["ticks", "markers"].includes(G.kind_of(R)) && shapes.includes(G.SHAPES[R.shape]);
const labels_are = (name) => (R) => G.kind_of(R) === "numerals" && G.LABEL_SETS[R.labels][0] === name;
const hand_is = (...shapes) => (H) => shapes.includes(G.HAND_SHAPES[H.shape]);
const numerals_only = kind_in("numerals");
const date_on = (S) => S.da_on;
const H = { scope: "hand" };

const ROWS = {
  Dial: [
    num("dial_d", "Diameter", 15, 50, 0.1),
    num("margin", "Page margin", 0, 10, 0.5),
    hdr("Colour"),
    col("c_plate", "Plate"), col("c_backdrop", "Backdrop"),
  ],
  Rings: [                                         // one list; rows that don't apply hide (R16)
    custom("ring_list", { scope: "global", pin: true }),            // pin: stays in view while the rest scrolls
    pop("kind", "Kind", G.KINDS, { pin: true }),
    col("c", "Colour", { pin: true }),
    num("r", "Outer radius", 0, 25, 0.05, { pin: true, show: kind_in("ticks", "markers", "band") }),
    num("r", "Centre radius", 0, 25, 0.05, { pin: true, show: kind_in("numerals") }),
    hdr("Positions"),
    num("count", "Count", 1, 360, 1, { whole: true }),
    num("start", "Start °", -180, 180, 0.5),
    num("span", "Span °", 1, 360, 1),
    num("every", "Every", 1, 60, 1, { whole: true }),
    num("offset", "Offset", 0, 59, 1, { whole: true }),
    chk("invert", "Skip those instead"),
    hdr("Give way to rings above"),
    pop("skip", "Skip where", G.SKIP_FROM),
    pop("knock", "Knock out", G.KNOCK_FROM),
    num("clear", "Clearance", 0, 2, 0.01, { show: (R) => R.knock !== 0 }),
    hdr("Look"),
    seg("shape", "Shape", G.SHAPES.slice(0, 3), { show: kind_in("ticks", "markers") }),
    num("len", "Length", 0.05, 10, 0.05, { show: marks_with("bar", "wedge", "file") }),
    num("w", "Width · Ø", 0.02, 5, 0.01, { show: marks_with("bar", "wedge", "dot", "file") }),
    num("taper", "Inner width ×", 0, 2, 0.01, { show: marks_with("wedge") }),
    num("round_out", "Round outer", 0, 2, 0.01, { show: marks_with("bar", "wedge", "file") }),
    num("round_in", "Round inner", 0, 2, 0.01, { show: marks_with("bar", "wedge", "file") }),
    custom("round_ends", { show: marks_with("bar", "wedge", "file") }),
    num("wall", "Hollow wall", 0, 1.5, 0.01, { show: kind_in("ticks", "markers") }),
    hdr("12 o’clock · first position", { show: kind_in("markers") }),
    seg("twelve", "Style", G.TWELVES, { show: kind_in("markers") }),
    num("twelve_scale", "Scale ×", 0.5, 2.5, 0.05, { show: (R) => G.kind_of(R) === "markers" && R.twelve !== 3 }),
    num("twelve_gap", "Gap", 0, 3, 0.05, { show: (R) => G.kind_of(R) === "markers" && R.twelve === 1 }),
    pop("labels", "Labels", G.LABEL_SETS.map((s) => s[0]), { show: numerals_only }),
    txt("custom", "Custom", { show: labels_are("Custom") }),
    num("num_from", "First number", -1000, 1000, 1, { show: labels_are("Numbers") }),
    num("num_step", "Step", -100, 100, 1, { show: labels_are("Numbers") }),
    num("num_digits", "Digits", 0, 4, 1, { whole: true, show: labels_are("Numbers") }),
    pop("mode", "Placement", G.MODES, { show: numerals_only }),
    num("size", "Size", 0.3, 8, 0.05, { show: numerals_only }),
    num("width", "Band width", 0.02, 25, 0.05, { show: kind_in("band") }),
    num("fill", "Fill % of step", 1, 100, 1, { show: kind_in("band") }),
    hdr("Nudge one numeral", { show: numerals_only }),
    custom("nudge", { show: numerals_only }),
    hdr("Type", { show: numerals_only }),
    custom("font", { show: numerals_only }),
    pop("lang", "Language", G.LANGS, { show: numerals_only }),
    num("tracking", "Tracking", -200, 800, 5, { show: numerals_only }),
    custom("axes", { show: numerals_only }),
    custom("features", { show: numerals_only }),
  ],
  Hands: [
    chk("ha_on", "Show hands"),
    pop("ha_beat", "Motion", G.BEATS.map((b) => b[0])),
    num("ha_cap", "Cap Ø", 0, 4, 0.05),
    col("c_cap", "Cap colour"),
    hdr("Hand"),
    seg("ui_hand", "Edit", ["Hour", "Minute", "Seconds"]),
    chk("on", "Show this hand", H),
    pop("shape", "Shape", G.HAND_SHAPES.slice(0, 9), H),
    num("len", "Length", 0.5, 30, 0.05, H),
    num("w", "Width", 0.02, 4, 0.01, H),
    num("tail", "Tail", 0, 10, 0.05, H),
    num("round", "Round ends", 0, 2, 0.01, { ...H, show: hand_is("baton", "pencil", "sword", "arrow", "syringe", "breguet", "lollipop", "file") }),
    num("tip", "Tip length", 0, 10, 0.05, { ...H, show: hand_is("pencil", "sword", "arrow", "syringe", "breguet") }),
    num("feature", "Head width", 0, 6, 0.05, { ...H, show: hand_is("arrow", "syringe") }),
    num("feature", "Ring · disc Ø", 0, 6, 0.05, { ...H, show: hand_is("breguet", "lollipop") }),
    num("feature_at", "Widest at %", 0, 100, 1, { ...H, show: hand_is("dauphine") }),
    num("feature_at", "Barrel from %", 0, 100, 1, { ...H, show: hand_is("syringe") }),
    num("feature_at", "Ring · disc at %", 0, 100, 1, { ...H, show: hand_is("breguet", "lollipop") }),
    num("counter", "Counterweight Ø", 0, 4, 0.05, H),
    num("wall", "Hollow wall", 0, 1, 0.01, H),
    col("c", "Colour", H),
  ],
  Date: [
    chk("da_on", "Date window"),
    pop("da_at", "Position", G.DATE_AT.map((d) => d[0]), { show: date_on }),
    num("da_r", "Radius", 2, 18, 0.05, { show: date_on }),
    num("da_w", "Width", 0.5, 6, 0.05, { show: date_on }),
    num("da_h", "Height", 0.5, 5, 0.05, { show: date_on }),
    num("da_round", "Corner", 0, 2, 0.05, { show: date_on }),
    num("da_frame", "Frame", 0, 0.6, 0.01, { show: date_on }),
    num("da_clear", "Print clearance", 0, 1, 0.01, { show: date_on }),
    col("da_ink", "Print colour", { show: date_on }),
    txt("da_day", "Shows", { show: date_on }),
    num("da_size", "Text % of height", 20, 100, 1, { show: date_on }),
    info("Uses the top numerals ring’s type.", { show: date_on }),
  ],
  Export: [
    chk("out_production", "Production: mono print mask"),
    chk("out_mirror", "Mirror: toner transfer"),
    num("out_dpi", "PNG dpi", 72, 2400, 1),
    custom("export"),
    custom("settings"),
    custom("log"),
  ],
};
const SECTIONS = Object.keys(ROWS);
for (const name of SECTIONS) for (const row of ROWS[name]) row.scope ??= name === "Rings" ? "ring" : "global";

// ── small helpers ────────────────────────────────────────────

/** '1.2' absolute · '+0.5' add · 'x0.5' multiply · '/2' divide */
function parse_number(text, current) {
  const s = String(text).trim().replace(",", ".").replace("×", "x");
  const v = parseFloat(s.slice(1));
  let out = s[0] === "+" ? current + v : s[0] === "x" || s[0] === "*" ? current * v : s[0] === "/" ? current / v : parseFloat(s);
  return Number.isFinite(out) ? out : current;
}
const decimals = (step) => (String(step).split(".")[1] || "").length;
const fmt = (v, step) => (+v).toFixed(Math.max(decimals(step), 0));
const fmt_time = (t) => {
  t = ((Math.floor(t) % 43200) + 43200) % 43200;
  return [Math.floor(t / 3600) || 12, Math.floor(t / 60) % 60, t % 60].map((v, i) => (i ? String(v).padStart(2, "0") : v)).join(":");
};
function parse_time(text) {
  const p = String(text).split(/[:.\s]+/).map(Number);
  if (p.some((v) => !Number.isFinite(v))) return null;
  return ((p[0] % 12) * 3600 + (p[1] || 0) * 60 + (p[2] || 0)) % 43200;
}
const to_hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0")).join("");
const from_hex = (h, alpha = 1) => [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)).concat([alpha]);

function save_file(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── a dial as a link: the settings, packed into the part of the address after # ──
//   scheme 1: lean settings (only what differs from the start) → JSON → deflate → base64 for addresses.
//   scheme 0: the same without deflate, for a browser that can't compress.

const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const un_b64 = (text) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

async function pack(S) {
  const bytes = new TextEncoder().encode(JSON.stringify(G.lean(S)));
  try { return `${G.LINK_SCHEME}.` + b64(await through(bytes, new CompressionStream("deflate-raw"))); }
  catch (e) { return "0." + b64(bytes); }
}

/** the part after # → settings, or null if it isn't a dial. */
async function unpack(hash) {
  const m = /^#?([01])\.([A-Za-z0-9_-]+)$/.exec(hash || "");
  if (!m) return null;
  try {
    const bytes = m[1] === "0" ? un_b64(m[2]) : await through(un_b64(m[2]), new DecompressionStream("deflate-raw"));
    const settings = JSON.parse(new TextDecoder().decode(bytes));
    return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : null;
  } catch (e) {
    return null;
  }
}

// ── the tool ─────────────────────────────────────────────────

class DialTool {
  constructor(settings) {
    this.S = G.fresh_settings(settings);
    this.statik = null;                            // everything that doesn't move, rebuilt when geometry changes
    this.static_dirty = true;
    this.pending = false;                          // a frame has been asked for
    this.playing = false;
    this.slots = [];                               // one SVG element per scene item, and what it shows
    this.z = 10; this.c = [0, 0]; this.fitted = true;      // preview: screen points per mm · dial centre in the view
    this.catalog = new Map();                      // fonts that can be loaded: PostScript name → {family, style, ps, load()}
    this.nudge_at = "0";                           // which numeral the nudge rows edit
    this.font_note = "";                           // what the last font action did, shown under its buttons
    this.build_ms = 0;
    this.rows = [];
    this.log_lines = [];
    this.build_window();
    this.show_section();
    this.fit();
    this.sync_time();
    this.render();
    this.log(`Dial Tool · ${G.VERSION} · shapes: PathKit · text: HarfBuzz`);
    this.fonts_at_start();
  }

  // ── settings in scopes: the dial, the selected ring, the selected hand ──

  ring() { return this.S.rings[this.S.ui_ring]; }
  hand() { return this.S["ha_" + G.HANDS[this.S.ui_hand]]; }
  target(scope) { return scope === "ring" ? this.ring() : scope === "hand" ? this.hand() : this.S; }

  set_value(scope, key, value) {
    const T = this.target(scope);
    if (JSON.stringify(T[key]) === JSON.stringify(value)) return;
    T[key] = value;
    if (scope === "ring") {
      if (!["c", "name"].includes(key)) this.static_dirty = true;
      if (key === "kind" || key === "name" || key === "on") this.fill_ring_list();
    } else if (scope === "global") {
      const quiet = G.NOT_GEOMETRY.includes(key) || G.NOT_GEOMETRY_PREFIX.some((p) => key.startsWith(p));
      if (!quiet) this.static_dirty = true;
      if (key === "dial_d" || key === "margin") { if (this.fitted) this.fit(); }
    }
    this.sync_rows();
    this.render();
  }

  // ── building the window ──────────────────────────────────

  build_window() {
    const root = $("#app");
    root.replaceChildren();
    this.tabs = el("nav", { className: "tabs" });
    SECTIONS.forEach((name, i) => {
      this.tabs.append(el("button", { type: "button", textContent: name, onclick: () => { this.S.ui_section = i; this.show_section(); this.render(); } }));
    });
    this.pinned = el("div", { className: "pinned" });              // rows that stay in view
    this.form = el("div", { className: "form" });                  // rows that scroll
    this.guides_box = el("input", { id: "guides", type: "checkbox" });
    this.guides_box.onchange = () => this.set_value("global", "guides", this.guides_box.checked);
    const panel = el("aside", { className: "panel" },
      el("header", {}, el("h1", { textContent: "Dial Tool" }), el("span", { className: "quiet", textContent: G.VERSION }),
        el("label", { className: "check guides" }, this.guides_box, " Guides")),
      this.tabs, this.pinned, this.form);

    this.svg = svg_el("svg");
    this.svg.setAttribute("class", "preview");
    this.backdrop = svg_el("rect");
    this.backdrop.setAttribute("width", "100%");
    this.backdrop.setAttribute("height", "100%");
    this.dial = svg_el("g");
    this.svg.append(this.backdrop, this.dial);
    this.preview_events();

    this.time_field = el("input", { id: "time", className: "time", type: "text", title: "Time shown, h:mm:ss" });
    this.time_field.onchange = () => { const t = parse_time(this.time_field.value); if (t !== null) this.set_time(t); else this.sync_time(); };
    this.time_slider = el("input", { id: "time-slider", type: "range", min: 0, max: 43199, step: 1 });
    this.time_slider.oninput = () => this.set_time(+this.time_slider.value);
    this.play_button = el("button", { type: "button", className: "icon", id: "play", onclick: () => this.play(!this.playing) });
    this.status = el("div", { className: "status" });
    const bar = el("footer", { className: "bar" },
      this.status, this.time_field, this.time_slider, this.play_button,
      el("button", { type: "button", textContent: "Now", onclick: () => { const d = new Date(); this.set_time(d.getHours() % 12 * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000); } }),
      el("button", { type: "button", textContent: "Fit", onclick: () => { this.fit(); this.render(); } }));
    root.append(panel, el("main", {}, this.svg), bar);
    this.play_icon();
    new ResizeObserver(() => this.resized()).observe(this.svg);
  }

  /** the rows of the section that is showing. */
  show_section() {
    const name = SECTIONS[this.S.ui_section];
    [...this.tabs.children].forEach((b, i) => b.classList.toggle("on", i === this.S.ui_section));
    this.form.replaceChildren();
    this.pinned.replaceChildren();
    this.rows = ROWS[name].map((row) => this.build_row(row));
    for (const r of this.rows) (r.row.pin ? this.pinned : this.form).append(r.el);
    this.pinned.hidden = !this.pinned.children.length;
    this.sync_rows();
    this.form.scrollTop = 0;
  }

  /** every row: hidden if it doesn't apply (R16), its controls showing the scope's value. */
  sync_rows() {
    for (const r of this.rows) {
      const T = this.target(r.row.scope);
      r.el.hidden = r.row.show ? !r.row.show(T) : false;
      if (!r.el.hidden) r.refresh(T);
    }
    this.guides_box.checked = this.S.guides;
  }

  /** one row of the form → {row, el, refresh(T)}. */
  build_row(row) {
    const wrap = el("div", { className: "row " + row.kind });
    const out = { row, el: wrap, refresh: () => {} };
    const set = (v) => this.set_value(row.scope, row.key, v);
    const id = `${row.scope}-${row.key}-${row.text || row.name}`.replace(/[^A-Za-z0-9]+/g, "-");
    const active = (e) => document.activeElement === e;

    if (row.kind === "hdr") wrap.append(el("h2", { textContent: row.text }));
    if (row.kind === "note") wrap.append(el("span"), el("span", { className: "quiet", textContent: row.text }));

    if (row.kind === "num") {                      // label · slider · typed field · stepper (R15)
      const slider = el("input", { type: "range", min: row.lo, max: row.hi, step: row.step, id: id + "-slider" });
      const field = el("input", { type: "text", id, inputMode: "decimal", title: "1.2 sets · +0.5 adds · x0.5 multiplies · /2 divides" });
      const commit = (v) => {
        v = row.whole ? Math.round(v) : +(+v).toFixed(6);
        set(row.whole ? clamp(v, row.lo, row.hi) : v);       // typing past the slider's range is allowed
      };
      let typing = false;                          // the field follows every change, except while you type in it
      slider.oninput = () => commit(+slider.value);
      field.oninput = () => { typing = true; };
      field.onblur = () => { typing = false; out.refresh(this.target(row.scope)); };
      field.onchange = () => { typing = false; commit(parse_number(field.value, this.target(row.scope)[row.key])); out.refresh(this.target(row.scope)); };
      field.onkeydown = (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); commit(this.target(row.scope)[row.key] + (e.key === "ArrowUp" ? 1 : -1) * row.step * (e.shiftKey ? 10 : 1)); }
      };
      const step = (dir) => el("button", { type: "button", className: "step", textContent: dir > 0 ? "+" : "−", tabIndex: -1, onclick: () => commit(this.target(row.scope)[row.key] + dir * row.step) });
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), slider, field, el("span", { className: "steps" }, step(-1), step(1)));
      out.refresh = (T) => {
        const v = T[row.key] ?? 0;
        if (v > +slider.max) slider.max = v;       // the slider grows to hold a typed value
        if (v < +slider.min) slider.min = v;
        if (+slider.value !== v) slider.value = v;
        if (!typing) field.value = fmt(v, row.step);
      };
    }

    if (row.kind === "pop") {
      const select = el("select", { id });
      row.items.forEach((name, i) => select.append(el("option", { value: i, textContent: name })));
      select.onchange = () => set(+select.value);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), select);
      out.refresh = (T) => { select.value = T[row.key]; };
    }

    if (row.kind === "seg") {
      const group = el("span", { className: "segs" });
      row.items.forEach((name, i) => group.append(el("button", { type: "button", textContent: name, onclick: () => { set(i); if (row.key === "ui_hand") this.sync_rows(); } })));
      wrap.append(el("label", { textContent: row.text }), group);
      out.refresh = (T) => [...group.children].forEach((b, i) => b.classList.toggle("on", i === T[row.key]));
    }

    if (row.kind === "chk") {
      const box = el("input", { type: "checkbox", id });
      box.onchange = () => set(box.checked);
      wrap.append(el("span"), el("label", { className: "check", htmlFor: id }, box, " " + row.text));
      out.refresh = (T) => { box.checked = Boolean(T[row.key]); };
    }

    if (row.kind === "col") {
      const well = el("input", { type: "color", id });
      const hex = el("span", { className: "quiet" });
      well.oninput = () => set(from_hex(well.value, this.target(row.scope)[row.key][3] ?? 1));
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), el("span", { className: "colour" }, well, hex));
      out.refresh = (T) => { if (!active(well)) well.value = to_hex(T[row.key]); hex.textContent = to_hex(T[row.key]).toUpperCase(); };
    }

    if (row.kind === "txt") {
      const field = el("input", { type: "text", id, className: "wide" });
      field.oninput = () => set(field.value);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), field);
      out.refresh = (T) => { if (!active(field)) field.value = T[row.key]; };
    }

    if (row.kind === "custom") this["row_" + row.name](wrap, out);
    return out;
  }

  // ── rows built by hand ───────────────────────────────────

  /** the ring list: order = stacking order, top ring first. Show, name, and the tools. */
  row_ring_list(wrap, out) {
    wrap.className = "ringlist";
    this.ring_list = el("ol");
    const add = el("div", { className: "tools" }, el("span", { className: "quiet", textContent: "Add" }));
    for (const kind of G.KINDS) {
      add.append(el("button", { type: "button", textContent: kind[0].toUpperCase() + kind.slice(1), onclick: () => this.ring_tool("add", kind) }));
    }
    const tools = el("div", { className: "tools" });
    for (const [name, action] of [["Duplicate", "duplicate"], ["Delete", "delete"], ["↑ Up", "up"], ["↓ Down", "down"]]) {
      tools.append(el("button", { type: "button", textContent: name, onclick: () => this.ring_tool(action) }));
    }
    wrap.append(this.ring_list, tools, add);
    this.fill_ring_list();
  }

  fill_ring_list() {
    if (!this.ring_list) return;
    const keep = document.activeElement && document.activeElement.dataset.ring;
    this.ring_list.replaceChildren();
    this.S.rings.forEach((ring, i) => {
      const box = el("input", { type: "checkbox", checked: ring.on, title: "Show this ring" });
      box.onchange = () => { this.S.ui_ring = i; this.set_value("ring", "on", box.checked); };
      const name = el("input", { type: "text", value: ring.name, className: "name" });
      name.dataset.ring = i;
      name.onfocus = () => this.select_ring(i, false);
      name.oninput = () => { ring.name = name.value; this.autosave(); };
      const item = el("li", { className: i === this.S.ui_ring ? "on" : "" }, box, name, el("span", { className: "quiet", textContent: G.kind_of(ring) }));
      item.onclick = (e) => { if (e.target === item || e.target.tagName === "SPAN") this.select_ring(i); };
      this.ring_list.append(item);
    });
    if (keep !== undefined && keep !== null) { const again = this.ring_list.querySelector(`input[data-ring="${keep}"]`); if (again && document.activeElement !== again) again.focus(); }
  }

  select_ring(i, refill = true) {
    if (i === this.S.ui_ring && !refill) return;
    this.S.ui_ring = clamp(i, 0, this.S.rings.length - 1);
    if (refill) this.fill_ring_list();
    else [...this.ring_list.children].forEach((li, k) => li.classList.toggle("on", k === this.S.ui_ring));
    this.sync_rows();
    this.render();
  }

  ring_tool(action, kind) {
    const rings = this.S.rings, i = this.S.ui_ring;
    if (action === "add") {
      rings.splice(i, 0, G.new_ring(kind, this.S, kind === "numerals" ? rings.find((r) => G.kind_of(r) === "numerals") : null));
    } else if (action === "duplicate") {
      const copy = JSON.parse(JSON.stringify(rings[i]));
      copy.name += " copy";
      rings.splice(i, 0, copy);
    } else if (action === "delete") {
      if (rings.length === 1) return this.log("A dial keeps at least one ring: hide it instead.");
      rings.splice(i, 1);
      this.S.ui_ring = Math.min(i, rings.length - 1);
    } else {
      const j = i + (action === "up" ? -1 : 1);
      if (j < 0 || j >= rings.length) return;
      [rings[i], rings[j]] = [rings[j], rings[i]];
      this.S.ui_ring = j;
    }
    this.static_dirty = true;
    this.fill_ring_list();
    this.sync_rows();
    this.render();
  }

  /** one click for round ends: both corner radii to half the mark's width or more. */
  row_round_ends(wrap) {
    wrap.className = "row";
    const both = (radius) => () => {
      const R = this.ring();
      R.round_out = R.round_in = radius(R);
      this.static_dirty = true; this.sync_rows(); this.render();
    };
    wrap.append(el("span"), el("span", { className: "tools" },
      el("button", { type: "button", textContent: "Round both ends", onclick: both((R) => Math.max(+(R.w / 2).toFixed(2), 0.01)) }),
      el("button", { type: "button", textContent: "Square", onclick: both(() => 0) })));
  }

  /** a correction for one numeral: radius ±, angle ±, rotate, size ×. Click a numeral in the preview to pick it. */
  row_nudge(wrap, out) {
    wrap.className = "nudge";
    const pick = el("select", { id: "nudge-pick" });
    pick.onchange = () => { this.nudge_at = pick.value; this.sync_rows(); };
    const fields = {};
    const line = (key, text, step, neutral) => {
      const f = el("input", { type: "text", id: "nudge-" + key, inputMode: "decimal" });
      f.onchange = () => {
        const R = this.ring(), n = { ...(R.nudge[this.nudge_at] || {}) };
        const v = parse_number(f.value, n[key] ?? neutral);
        if (Math.abs(v - neutral) < 1e-9) delete n[key]; else n[key] = +v.toFixed(4);
        const all = { ...R.nudge };
        if (Object.keys(n).length) all[this.nudge_at] = n; else delete all[this.nudge_at];
        this.set_value("ring", "nudge", all);
      };
      fields[key] = [f, step, neutral];
      return el("div", { className: "row txt" }, el("label", { htmlFor: "nudge-" + key, textContent: text }), f);
    };
    wrap.append(el("div", { className: "row pop" }, el("label", { htmlFor: "nudge-pick", textContent: "Numeral" }), pick),
      line("dr", "Radius ±", 0.05, 0), line("da", "Angle ± °", 0.1, 0), line("rot", "Rotate °", 1, 0), line("s", "Size ×", 0.01, 1),
      el("div", { className: "row" }, el("span"), el("button", { type: "button", textContent: "Reset this numeral", onclick: () => {
        const all = { ...this.ring().nudge };
        delete all[this.nudge_at];
        this.set_value("ring", "nudge", all);
      } })));
    out.refresh = (R) => {
      const labels = G.ring_labels(R);
      if (+this.nudge_at >= labels.length) this.nudge_at = "0";
      const want = labels.map((l, i) => `${i + 1} · ${l || "—"}${R.nudge[String(i)] ? "  •" : ""}`).join("|");
      if (pick.dataset.items !== want) {
        pick.replaceChildren(...labels.map((l, i) => el("option", { value: String(i), textContent: `${i + 1} · ${l || "—"}${R.nudge[String(i)] ? "  •" : ""}` })));
        pick.dataset.items = want;
      }
      pick.value = this.nudge_at;
      const n = R.nudge[this.nudge_at] || {};
      for (const key in fields) { const [f, step, neutral] = fields[key]; if (document.activeElement !== f) f.value = fmt(n[key] ?? neutral, step / 10); }
    };
  }

  /** family and style, and where fonts come from: this computer (Chrome, Edge) or a font file. */
  row_font(wrap, out) {
    wrap.className = "font";
    const family = el("select", { id: "font-family" }), style = el("select", { id: "font-style" });
    const state = el("span", { className: "quiet" });
    const families = () => {
      const by = new Map();
      for (const f of this.catalog.values()) { if (!by.has(f.family)) by.set(f.family, []); by.get(f.family).push(f); }
      return new Map([...by.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    };
    family.onchange = () => {
      const styles = families().get(family.value) || [];
      const first = styles.find((f) => /^(regular|roman|book|normal)$/i.test(f.style)) || styles[0];
      if (first) this.use_font(first);
    };
    style.onchange = () => { const f = this.catalog.get(style.value); if (f) this.use_font(f); };
    const file = el("input", { type: "file", accept: ".ttf,.otf,.ttc,.otc", multiple: true, hidden: true, id: "font-file" });
    file.onchange = async () => { await this.add_font_files([...file.files]); file.value = ""; };
    const buttons = el("div", { className: "tools" },
      el("button", { type: "button", id: "local-fonts", textContent: "Installed fonts", hidden: !("queryLocalFonts" in window), onclick: () => this.local_fonts(true) }),
      el("button", { type: "button", textContent: "Add font file…", onclick: () => file.click() }), file);
    wrap.append(el("div", { className: "row pop" }, el("label", { htmlFor: "font-family", textContent: "Family" }), family),
      el("div", { className: "row pop" }, el("label", { htmlFor: "font-style", textContent: "Style" }), style),
      el("div", { className: "row" }, el("span"), buttons), el("div", { className: "row note" }, el("span"), state));
    out.refresh = (R) => {
      const by = families();
      const names = [...by.keys()];
      if (!by.has(R.family)) names.unshift(R.family);
      const want = names.join("|");
      if (family.dataset.items !== want) { family.replaceChildren(...names.map((n) => el("option", { value: n, textContent: n }))); family.dataset.items = want; }
      family.value = R.family;
      const styles = by.get(R.family) || [];
      style.replaceChildren(...styles.map((f) => el("option", { value: f.ps, textContent: f.style || f.ps })));
      style.value = R.ps;
      const missing = G.has_font(R.ps) ? "" : this.catalog.has(R.ps) ? "Loading… "
        : `${R.family} isn’t loaded yet, so ${G.font_list()[0].family} stands in. Press Installed fonts (Chrome or Edge) or add its file. `;
      state.textContent = missing + (this.font_note || "");
    };
  }

  /** a variable font's axes, one slider each. */
  row_axes(wrap, out) {
    wrap.className = "axes";
    let shown = null;
    out.refresh = (R) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      const axes = font ? G.font_axes(font) : {};
      const key = R.ps + JSON.stringify(Object.keys(axes)) + this.S.ui_ring;
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren();
        if (Object.keys(axes).length) wrap.append(el("div", { className: "row hdr" }, el("h2", { textContent: "Variable axes" })));
        for (const tag in axes) {
          const a = axes[tag], id = "axis-" + tag;
          const slider = el("input", { type: "range", min: a.min, max: a.max, step: (a.max - a.min) / 1000, id: id + "-slider" });
          const field = el("input", { type: "text", id, inputMode: "decimal" });
          const commit = (v) => {
            const all = { ...this.ring().axes };
            v = clamp(+(+v).toFixed(2), a.min, a.max);
            if (Math.abs(v - a.default) < 1e-6) delete all[tag]; else all[tag] = v;
            this.set_value("ring", "axes", all);
          };
          slider.oninput = () => commit(slider.value);
          field.onchange = () => commit(parse_number(field.value, this.ring().axes[tag] ?? a.default));
          slider.dataset.tag = field.dataset.tag = tag;
          wrap.append(el("div", { className: "row num" }, el("label", { htmlFor: id, textContent: `${a.name} · ${tag}` }), slider, field, el("span")));
        }
      }
      for (const input of wrap.querySelectorAll("input")) {
        const a = axes[input.dataset.tag];
        if (a && document.activeElement !== input) input.value = input.type === "range" ? (R.axes[a && input.dataset.tag] ?? a.default) : fmt(R.axes[input.dataset.tag] ?? a.default, 0.1);
      }
    };
  }

  /** the font's OpenType features. Only what differs from the font's default is stored (R12). */
  row_features(wrap, out) {
    wrap.className = "features";
    let shown = null;
    out.refresh = (R) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      const key = (font ? font.ps : "") + this.S.ui_ring;
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren(el("div", { className: "row hdr" }, el("h2", { textContent: "OpenType features" })));
        // the switches a designer would use: named by the font, or known by name here, or a stylistic set
        // or character variant. (Fonts also list features their script needs to work at all; those stay on.)
        const useful = ([tag, designer]) => designer || FEATURE_NAMES[tag] || /^(ss|cv)\d\d$/.test(tag);
        for (const [tag, designer] of font ? G.font_features(font).filter(useful) : []) {
          const box = el("input", { type: "checkbox", id: "feature-" + tag });
          box.dataset.tag = tag;
          box.onchange = () => {
            const all = { ...this.ring().features };
            if (box.checked === DEFAULT_ON.has(tag)) delete all[tag]; else all[tag] = box.checked;
            this.set_value("ring", "features", all);
          };
          wrap.append(el("div", { className: "row chk" }, el("span", { className: "quiet tag", textContent: tag }),
            el("label", { className: "check", htmlFor: "feature-" + tag }, box, " " + (designer || FEATURE_NAMES[tag] || tag))));
        }
      }
      for (const box of wrap.querySelectorAll("input")) box.checked = R.features[box.dataset.tag] ?? DEFAULT_ON.has(box.dataset.tag);
    };
  }

  row_export(wrap) {
    wrap.className = "row bar-row";
    const tools = el("span", { className: "tools" });
    for (const kind of ["PDF", "SVG", "PNG"]) tools.append(el("button", { type: "button", id: "export-" + kind.toLowerCase(), textContent: kind, onclick: () => this.export(kind.toLowerCase()) }));
    wrap.append(el("label", { textContent: "Export" }), tools);
  }

  row_settings(wrap) {
    wrap.className = "row bar-row";
    const file = el("input", { type: "file", accept: ".json,application/json", hidden: true, id: "load-file" });
    file.onchange = async () => { if (file.files[0]) this.load_text(await file.files[0].text(), file.files[0].name); file.value = ""; };
    wrap.append(el("label", { textContent: "Settings" }), el("span", { className: "tools" },
      el("button", { type: "button", id: "save", textContent: "Save…", onclick: () => { save_file("dial.json", JSON.stringify(this.S, null, 1), "application/json"); this.log("saved dial.json to your downloads"); } }),
      el("button", { type: "button", textContent: "Load…", onclick: () => file.click() }),
      el("button", { type: "button", textContent: "Defaults", onclick: () => this.reopen({ ui_section: this.S.ui_section }) }),
      el("button", { type: "button", id: "copy-link", textContent: "Copy link", onclick: () => this.copy_link() }), file));
  }

  row_log(wrap, out) {
    wrap.className = "logrow";
    const box = el("pre", { className: "log", id: "log" });
    wrap.append(el("h2", { textContent: "Log" }), box);
    out.refresh = () => { box.textContent = this.log_lines.join("\n"); };
  }

  // ── fonts ────────────────────────────────────────────────

  /** fonts are needed before the first numerals are right: load what the settings name, if we may. */
  async fonts_at_start() {
    for (const f of G.font_list()) this.catalog.set(f.ps, { family: f.family, style: f.style, ps: f.ps });
    try {
      const status = await navigator.permissions.query({ name: "local-fonts" });
      if (status.state === "granted") await this.local_fonts(false);
    } catch (e) { /* this browser has no such permission: fonts come from files */ }
    this.sync_rows();
  }

  /** list the fonts installed on this computer (Chrome and Edge ask once), and load the ones in use. */
  async local_fonts(asked) {
    const say = (text) => { if (asked) { this.font_note = text; this.log(text); this.sync_rows(); } };
    say("Asking the browser for this computer’s fonts… (it may show a question near the address bar)");
    try {
      const list = await window.queryLocalFonts();
      for (const f of list) {
        if (!this.catalog.has(f.postscriptName)) this.catalog.set(f.postscriptName, { family: f.family, style: f.style, ps: f.postscriptName, data: f });
      }
      // a browser that isn't allowed answers with an empty list, not with an error
      if (list.length) say(`${list.length} installed fonts are now listed under Family.`);
      else say("The browser gave no fonts: it isn’t allowed to for this page. Click the icon at the left of the address bar → Site settings → Fonts → Allow, reload, and press Installed fonts again. Or use Add font file… (Helvetica Neue is /System/Library/Fonts/HelveticaNeue.ttc).");
      await this.load_fonts_in_use();
    } catch (e) {
      say(`The browser refused to list fonts (${e.name}: ${e.message}). Use Add font file… instead.`);
    }
    this.sync_rows();
  }

  /** read one catalogued font into the text engine. A collection file holds several: find ours. */
  async load_font(entry) {
    if (G.has_font(entry.ps) || !entry.data) return G.has_font(entry.ps);
    const bytes = new Uint8Array(await (await entry.data.blob()).arrayBuffer());
    for (let i = 0; i < 64; i++) {
      const got = G.add_font(bytes, i);
      if (!got) break;
      if (got.ps === entry.ps) return true;
    }
    return G.has_font(entry.ps);
  }

  async load_fonts_in_use() {
    let loaded = false;
    for (const ring of this.S.rings) {
      const entry = this.catalog.get(ring.ps);
      if (entry && !G.has_font(ring.ps)) loaded = (await this.load_font(entry)) || loaded;
    }
    if (loaded) { this.static_dirty = true; this.sync_rows(); this.render(); }
  }

  async add_font_files(files) {
    const added = [];
    const say = (text) => { this.font_note = text; this.log(text); this.sync_rows(); };
    try {
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        for (let i = 0; i < 64; i++) {             // a collection (.ttc) holds several fonts
          const got = G.add_font(bytes, i);
          if (!got) break;
          this.catalog.set(got.ps, { family: got.family, style: got.style, ps: got.ps });
          added.push(got);
        }
      }
    } catch (e) {
      return say(`Couldn’t read ${files.map((f) => f.name).join(", ")} (${e.name}: ${e.message}).`);
    }
    if (!added.length) return say(`${files.map((f) => f.name).join(", ")} didn’t open as a font (TTF, OTF, TTC).`);
    const families = [...new Set(added.map((f) => f.family))];
    say(`Added ${families.slice(0, 3).join(", ")}${families.length > 3 ? "…" : ""}: ${added.length} style${added.length > 1 ? "s" : ""}.`);
    const R = this.ring();
    if (G.kind_of(R) === "numerals" && !added.some((f) => f.ps === R.ps)) {       // not the ring's own font: switch to the new one
      const pick = added.find((f) => /^(regular|roman|book|normal)$/i.test(f.style)) || added[0];
      await this.use_font(this.catalog.get(pick.ps));
    }
    G.forget();
    this.static_dirty = true; this.sync_rows(); this.render();
  }

  async use_font(entry) {
    await this.load_font(entry);
    const R = this.ring();
    R.family = entry.family; R.ps = entry.ps; R.axes = {}; R.features = {};
    this.static_dirty = true;
    this.sync_rows();
    this.render();
  }

  // ── the frame: nothing draws inside a control (R28) ──────

  render() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => this.frame());
  }

  frame() {
    this.pending = false;
    try {
      if (this.playing) {
        const [wall, t] = this.play_from;
        this.S.t = (t + (performance.now() - wall) / 1000) % 43200;
        this.sync_time();
        this.render();
      }
      this.draw();
    } catch (e) {
      this.play(false);
      this.log("error while drawing a frame: " + (e.stack || e));
    }
  }

  draw() {
    const S = this.S;
    if (!this.statik || this.static_dirty) {
      const t0 = performance.now();
      this.statik = G.build_static(S);
      this.static_dirty = false;
      this.build_ms = performance.now() - t0;
    }
    const items = G.scene(S, this.statik, S.t, true, S.ui_ring);
    this.items = items;
    const backdrop = S.out_production ? [1, 1, 1, 1] : S.c_backdrop;
    this.backdrop.setAttribute("fill", to_hex(backdrop));
    while (this.slots.length < items.length) {
      const node = svg_el("path");
      this.dial.append(node);
      this.slots.push({ node, path: null, fill: null, stroke: null, angle: null });
    }
    while (this.slots.length > items.length) this.slots.pop().node.remove();
    items.forEach((item, i) => {
      const slot = this.slots[i], node = slot.node;
      if (slot.path !== item.path) {               // the same object = the same shape (remembered geometry)
        const d = item.path.svg(4);                // guides are new objects every frame: compare their text
        if (d !== slot.d) node.setAttribute("d", d);
        slot.d = d;
        slot.path = item.path;
      }
      const fill = item.fill ? to_hex(item.fill) + "/" + item.fill[3] : "none";
      if (fill !== slot.fill) {
        slot.fill = fill;
        node.setAttribute("fill", item.fill ? to_hex(item.fill) : "none");
        node.setAttribute("fill-opacity", item.fill ? item.fill[3] : 1);
      }
      const stroke = item.stroke ? to_hex(item.stroke) + "/" + item.stroke[3] + "/" + item.px : "none";
      if (stroke !== slot.stroke) {
        slot.stroke = stroke;
        if (item.stroke) {
          node.setAttribute("stroke", to_hex(item.stroke));
          node.setAttribute("stroke-opacity", item.stroke[3]);
          node.setAttribute("stroke-width", item.px);
          node.setAttribute("vector-effect", "non-scaling-stroke");      // guides keep their width on screen
          node.setAttribute("pointer-events", "none");
        } else for (const a of ["stroke", "stroke-opacity", "stroke-width", "vector-effect", "pointer-events"]) node.removeAttribute(a);
      }
      if (item.angle !== slot.angle) {             // hands turn about the pivot (R2: clockwise)
        slot.angle = item.angle;
        if (item.angle) node.setAttribute("transform", `rotate(${-item.angle})`); else node.removeAttribute("transform");
      }
      node.dataset.i = i;
    });
    this.place();
    const ring = this.ring();
    const font = G.kind_of(ring) === "numerals" ? `   ·   ${ring.ps}` : "";
    this.status.textContent = `${ring.name}${font} · Ø ${S.dial_d.toFixed(1)} mm · build ${this.build_ms.toFixed(0)} ms`;
    while (G.NOTES.length) this.log(G.NOTES.shift());
    this.autosave();
  }

  // ── the preview: zoom, pan, click ────────────────────────

  size() { const r = this.svg.getBoundingClientRect(); return [r.width, r.height]; }
  fit_zoom() { const [w, h] = this.size(); return Math.min(w, h) / G.page_mm(this.S); }

  /** put the dial at c, scaled to z; mirrored for toner transfer. y grows upward inside. */
  place() {
    const flip = this.S.out_mirror ? -1 : 1;
    this.dial.setAttribute("transform", `translate(${this.c[0]} ${this.c[1]}) scale(${flip * this.z} ${-this.z})`);
  }

  fit() {
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    this.fitted = true;
    this.z = this.fit_zoom();
    this.c = [w / 2, h / 2];
    this.place();
  }

  /** zoom by k so that the spot under view point p stays there. */
  zoom(k, p) {
    const lo = this.fit_zoom() / 4, hi = 400;
    k = clamp(this.z * k, lo, hi) / this.z;
    this.z *= k;
    this.c = [p[0] + (this.c[0] - p[0]) * k, p[1] + (this.c[1] - p[1]) * k];
    this.fitted = false;
    this.place();
  }

  resized() {
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    if (this.fitted) this.fit();
    else if (this.view) { this.c = [this.c[0] + (w - this.view[0]) / 2, this.c[1] + (h - this.view[1]) / 2]; this.place(); }
    this.view = [w, h];
  }

  /** a point of the view → millimetres on the dial (y up). */
  to_mm(p) {
    const flip = this.S.out_mirror ? -1 : 1;
    return [(p[0] - this.c[0]) / this.z * flip, -(p[1] - this.c[1]) / this.z];
  }

  preview_events() {
    const at = (e) => { const r = this.svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    this.svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) this.zoom(Math.exp(-e.deltaY * 0.01), at(e));      // pinch, or ⌘ / ctrl + scroll
      else { this.fitted = false; this.c = [this.c[0] - e.deltaX, this.c[1] - e.deltaY]; this.place(); }
    }, { passive: false });
    let down = null;
    this.svg.addEventListener("pointerdown", (e) => { down = { p: at(e), c: this.c.slice(), moved: false }; this.svg.setPointerCapture(e.pointerId); });
    this.svg.addEventListener("pointermove", (e) => {
      if (!down) return;
      const p = at(e);
      if (Math.hypot(p[0] - down.p[0], p[1] - down.p[1]) > 4) down.moved = true;
      if (down.moved) { this.fitted = false; this.c = [down.c[0] + p[0] - down.p[0], down.c[1] + p[1] - down.p[1]]; this.place(); }
    });
    this.svg.addEventListener("pointerup", (e) => {
      if (down && !down.moved) this.clicked(at(e), document.elementFromPoint(e.clientX, e.clientY));
      down = null;
    });
    let pinch = 1;                                 // Safari reports a pinch as gesture events
    this.svg.addEventListener("gesturestart", (e) => { e.preventDefault(); pinch = 1; });
    this.svg.addEventListener("gesturechange", (e) => { e.preventDefault(); this.zoom(e.scale / pinch, at(e)); pinch = e.scale; });
  }

  /** a click on the preview opens the settings of what was clicked. */
  clicked(p, node) {
    const S = this.S, mm = this.to_mm(p), r = Math.hypot(mm[0], mm[1]);
    const item = node && node.dataset && node.dataset.i !== undefined ? this.items[+node.dataset.i] : null;
    const role = item ? item.role : null;
    const go = (section) => { S.ui_section = section; };
    let ring = null;
    if (role === "hand") { go(2); S.ui_hand = G.HANDS.indexOf(item.name); }
    else if (role === "cap") go(2);
    else if (role && role.startsWith("date") || role === "cutline") go(3);
    else if (role === "ring") ring = item.index;
    else {                                         // the plate or the backdrop. Thin ticks are hard to hit, so:
      const slack = 4 / this.z;                    // of the rings whose zone (between their radii) is under the
      const angle = Math.atan2(mm[0], mm[1]) * 180 / Math.PI;      // click, take the one with the nearest mark
      let best = Infinity;
      for (const d of this.statik.rings) {         // top ring first, so the top one wins a tie
        const R = d.ring;
        const [lo, hi] = d.kind === "numerals" ? [R.r - R.size / 2, R.r + R.size / 2] : [R.r - (d.kind === "band" ? R.width : R.len), R.r];
        if (r < lo - slack || r > hi + slack) continue;
        const away = d.kind === "band" ? 1e6 : Math.min(...d.taken.map((a) => Math.abs(((angle - a + 540) % 360) - 180))) * Math.PI / 180 * r;
        if (away < best) { best = away; ring = S.rings.indexOf(R); }
      }
      if (ring === null) go(r <= S.dial_d / 2 ? 0 : S.ui_section);
    }
    if (ring !== null) {
      go(1);
      S.ui_ring = ring;
      const d = this.statik.rings.find((x) => x.ring === S.rings[ring]);
      if (d && d.kind === "numerals") {            // which numeral? the nearest one's centre
        let best = Infinity;
        d.parts.forEach((part, k) => {
          const b = part.bounds();
          if (!b) return;
          const dist = Math.hypot((b[0] + b[2]) / 2 - mm[0], (b[1] + b[3]) / 2 - mm[1]);
          if (dist < best) { best = dist; this.nudge_at = String(d.at[k]); }
        });
      }
    }
    this.show_section();
    this.render();
  }

  // ── time ─────────────────────────────────────────────────

  sync_time() {
    if (document.activeElement !== this.time_field) this.time_field.value = fmt_time(this.S.t);
    if (document.activeElement !== this.time_slider || this.playing) this.time_slider.value = Math.floor(this.S.t);
  }

  set_time(t) {
    this.S.t = t;
    if (this.playing) this.play_from = [performance.now(), t];     // Play carries on from the new time
    this.sync_time();
    this.render();
  }

  play(on) {
    this.playing = on;
    this.play_from = [performance.now(), this.S.t];
    this.play_icon();
    this.render();
  }

  /** the button shows what a press will do: a triangle to play, two bars to pause. */
  play_icon() {
    const shape = this.playing ? '<rect x="3" y="2" width="3.5" height="12"/><rect x="9.5" y="2" width="3.5" height="12"/>' : '<path d="M4 2 L14 8 L4 14 Z"/>';
    this.play_button.innerHTML = `<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="currentColor">${shape}</svg>`;
    this.play_button.title = this.play_button.ariaLabel = this.playing ? "Pause" : "Play";
  }

  // ── files out and in ─────────────────────────────────────

  async export(kind) {
    try {
      const S = this.S, statik = G.build_static(S);
      if (kind === "svg") save_file("dial.svg", svg_document(S, statik, S.t), "image/svg+xml");
      if (kind === "pdf") save_file("dial.pdf", pdf_document(S, statik, S.t), "application/pdf");
      if (kind === "png") {
        const px = Math.round(G.page_mm(S) / 25.4 * S.out_dpi);
        const image = new Image();
        image.src = URL.createObjectURL(new Blob([svg_document(S, statik, S.t)], { type: "image/svg+xml" }));
        await image.decode();
        const canvas = el("canvas", { width: px, height: px });
        canvas.getContext("2d").drawImage(image, 0, 0, px, px);
        URL.revokeObjectURL(image.src);
        save_file("dial.png", await new Promise((done) => canvas.toBlob(done, "image/png")), "image/png");
        this.log(`exported dial.png · ${px} × ${px} px`);
        return;
      }
      this.log(`exported dial.${kind} · ${G.page_mm(S).toFixed(2)} mm square, to your downloads`);
    } catch (e) {
      this.log(`export ${kind} failed: ${e.stack || e}`);
    }
  }

  load_text(text, name) {
    try {
      const settings = JSON.parse(text);
      if (typeof settings !== "object" || Array.isArray(settings)) throw new Error("not a settings file");
      this.reopen(settings);
      tool.log(`loaded ${name}`);
    } catch (e) {
      this.log(`couldn’t load ${name}: ${e.message}`);
    }
  }

  /** start again with new settings (the simplest way to update every control). */
  reopen(settings) {
    this.playing = false;
    const fonts = this.catalog;
    tool = new DialTool(settings);
    for (const [ps, f] of fonts) if (!tool.catalog.has(ps)) tool.catalog.set(ps, f);
    tool.load_fonts_in_use();
    window.dial_tool = tool;
  }

  /** shortly after the last change: keep the session, and make the address bar say this dial. */
  autosave() {
    clearTimeout(this.saving);
    this.saving = setTimeout(async () => {
      try { localStorage.setItem(LAST, JSON.stringify(this.S)); } catch (e) { /* private window: nothing kept */ }
      try { history.replaceState(null, "", "#" + await pack(this.S)); } catch (e) { /* the address stays as it was */ }
    }, 400);
  }

  /** the whole dial as one address: open it anywhere and the dial is back. Fonts travel by name only. */
  async copy_link() {
    const link = location.href.split("#")[0] + "#" + await pack(this.S);
    try {
      await navigator.clipboard.writeText(link);
      this.log(`link copied · ${link.length} characters`);
    } catch (e) {
      this.log(`couldn’t copy by itself; the link is in the address bar, and here:\n${link}`);
    }
    try { history.replaceState(null, "", link); } catch (e) { /* fine */ }
  }

  log(message) {
    const stamp = new Date().toTimeString().slice(0, 8);
    this.log_lines.unshift(`${stamp}  ${message}`);
    this.log_lines.length = Math.min(this.log_lines.length, 200);
    const box = $("#log");
    if (box) box.textContent = this.log_lines.join("\n");
    console.log(message);
  }
}

// ── start ────────────────────────────────────────────────────

let tool = null;

export async function open_window(pathkit, harfbuzz, font_bytes) {
  G.start(pathkit, harfbuzz);
  G.add_font(font_bytes, 0, true);                 // the page's own font: stands in until yours are loaded
  let settings = await unpack(location.hash);      // a dial in the address comes first…
  const from_link = settings !== null;
  if (!settings) { try { settings = JSON.parse(localStorage.getItem(LAST)); } catch (e) { settings = null; } }   // …then the last session
  tool = new DialTool(settings);
  if (from_link) tool.log("opened the dial in the address");
  window.addEventListener("hashchange", async () => {              // another dial's link pasted into this tab
    const next = await unpack(location.hash);
    if (next) { tool.reopen(next); tool.log("opened the dial in the address"); }
  });
  tool.sync_time();
  window.dial_tool = tool;
  window.addEventListener("pagehide", () => { try { localStorage.setItem(LAST, JSON.stringify(tool.S)); } catch (e) { /* nothing kept */ } });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", async (e) => {    // drop a settings file or font files anywhere
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    const json = files.find((f) => f.name.toLowerCase().endsWith(".json"));
    if (json) tool.load_text(await json.text(), json.name);
    const fonts = files.filter((f) => /\.(ttf|otf|ttc|otc)$/i.test(f.name));
    if (fonts.length) tool.add_font_files(fonts);
  });
}
