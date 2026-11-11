// colour.js — colours: the pop-out (one for the whole tool, opened at a swatch's right), the colour maths (RGB, HSV,
// CMYK, hex), the colours listed in a pane (the dial's, a ring's sectors, show mode's lines).

import * as G from "./geometry.js";
import { $, KEY, clamp, drag_in, el, from_hex, has_focus, is_day, moon_look, paint, to_hex } from "./ui.js";
import { num } from "./rows.js";
import { PICS, SIGNS, TOOL_ICONS, icon, list_dot, shown_dot } from "./icons.js";
import { LUMES, lume_by_name, lume_exact } from "./lume.js";
import { RAL_FAMILIES, ral_by_code, ral_exact, ral_family_colour, ral_grid, ral_lightness, ral_nearest } from "./ral.js";

export const PALETTE = ["#111111", "#FFFFFF", "#EDE8DB", "#A7A7AA", "#3A3A3C", "#0E2A47", "#12372A", "#7A1F1F", "#C8E6A0", "#E8742A"];      // the palette's first ten: black, white, cream, silver, anthracite, navy, green, burgundy, lume, orange

export const POP_GAP = 12;                              // between a swatch and the pop-out it opens, in screen points

export const PALETTE_KEY = KEY("palette");           // the palette as this browser keeps it: the ten, and what was added

/** colour as hue (0–360), strength and brightness (0–1), and back. */
export function rgb_hsv([r, g, b]) {
  const hi = Math.max(r, g, b), d = hi - Math.min(r, g, b);
  const h = d === 0 ? 0 : hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, hi === 0 ? 0 : d / hi, hi];
}

export function hsv_rgb([h, s, v]) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)];
}

/** CMYK by plain arithmetic (no printer profile): good for naming a colour, not for proofing one. */
export function rgb_cmyk([r, g, b]) {
  const k = 1 - Math.max(r, g, b);
  return k >= 1 ? [0, 0, 0, 1] : [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k];
}

export const cmyk_rgb = ([c, m, y, k]) => [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];

/** '#abc', 'ABCDEF', '#a1b2c3' → '#A1B2C3'; anything else → null. */
export function parse_hex(text) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(text).trim());
  return m ? "#" + (m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1]).toUpperCase() : null;
}

/** a colour's word in a pill: its hex, or — exactly a RAL — R and the code without spaces, dashes inside (Okay, 30 Oct
 *  2026: "rals get into big swatch pills like hex with R 5001"; "R does not have space, spaces inside color names become
 *  dashes"): R5015, R210-50-30 */
export function colour_word(c) {
  const hex = to_hex(c).toUpperCase(), lume = lume_exact(hex), ral = ral_exact(hex);
  return lume ? lume.name : ral ? "R" + ral.code.replace(/ /g, "-") : hex;      // a lume says its name (Okay, 2 Nov 2026, 22:38: "their tag-swatch versions named with their name")
}
/** a colour's own name on its line under its part (show mode, 01:34): the last of its title's words — "Date at 3 ·
 *  frame" → Frame, "Numerals · sector 2" → Sector 2; a hand's own colour, Hand */
export const colour_part = (title) => { const w = String(title).includes(" · ") ? title.split(" · ").pop() : / hand$/.test(title) ? "hand" : title; return w[0].toUpperCase() + w.slice(1); };
/** an opening's fill with nothing in it: no colour, the dial seen through (#175) */
export const is_open = (c) => Array.isArray(c) && (c[3] ?? 1) === 0;

export const COLOUR = {
  /** this dial's colours: every part that has one, each colour once — in the order the Colours pane lists them (rings
   *  and their sectors, hands, cap, windows), or with the page: plate, backdrop, cap, then the rest (the colour
   *  pop-out's "On this dial", in its own order). */
  dial_colours(page = true) {
    const S = this.S, rings = S.rings.flatMap((r) => [r.c, ...Object.values(r.cs || {})]), hands = G.HANDS.filter((h) => G.hand_added(S, h)).map((h) => S["ha_" + h].c), windows = G.windows_of(S).filter((w) => w.on).map((w) => w.ink);
    const all = page ? [S.c_plate, S.c_backdrop, S.c_cap, ...rings, ...hands, ...windows] : [...rings, ...hands, S.c_cap, ...windows];      // the pop-out's order as it was (4.38)
    const once = new Map();
    for (const c of all) if (Array.isArray(c)) { const hex = to_hex(c).toUpperCase(); if (!once.has(hex)) once.set(hex, c); }
    return [...once.values()];
  },

  build_pop() {
    const P = this.pop = { at: null, hsv: [0, 0, 0], used: "", mode: "", wide: false };
    try { this.palette = JSON.parse(localStorage.getItem(PALETTE_KEY)); } catch (e) { /* not kept */ }
    if (!Array.isArray(this.palette)) this.palette = PALETTE.slice();
    this.colour_mode = G.COLOUR_MODES[this.S.ui_colour_as] || "HEX";      // as Settings says (#554)
    const put = (rgb) => P.at.write(rgb.map((v) => +clamp(v, 0, 1).toFixed(4)).concat([P.at.read()[3] ?? 1]));
    P.put = put;
    P.pick = (hex) => put(from_hex(hex).slice(0, 3));
    P.title = el("h2");
    const wide = el("button", { type: "button", className: "sign", id: "pop-wide", title: "Twice the size, and back", ariaLabel: "Twice the size, and back", onclick: () => this.pop_wide(!P.wide) });
    wide.innerHTML = icon(TOOL_ICONS.wide);
    const shut = el("button", { type: "button", className: "sign", id: "pop-close", title: "Close", ariaLabel: "Close", onclick: () => this.pop_close() });
    shut.innerHTML = icon(SIGNS.cross);
    const head = el("header", { title: "Drag to move" }, P.title, wide, shut);
    P.used_chips = el("span", { className: "chips", id: "pop-used" });
    P.none_btn = el("button", { type: "button", className: "nocolour", id: "pop-none", textContent: "No colour", title: "No colour: the bare material shows", onclick: () => { if (P.at && P.at.none) { P.at.none.set(); this.pop_refresh(); } } });
    P.none = el("div", { className: "chiprow nonerow", hidden: true }, el("span", { className: "quiet", textContent: "Bare" }), P.none_btn);      // a row of its own, its pill at the chips' start (Okay, 11 Nov 2026: "No color is a pill")
    P.palette_chips = el("span", { className: "chips", id: "pop-palette" });
    P.field = el("div", { className: "sv", title: "Across: how strong. Down: how dark." }, el("i"));
    P.hues = el("div", { className: "hue", title: "Hue" }, el("i"));
    drag_in(P.field, (x, y) => { P.hsv = [P.hsv[0], x, 1 - y]; put(hsv_rgb(P.hsv)); });
    drag_in(P.hues, (x) => { P.hsv = [x * 360, P.hsv[1], P.hsv[2]]; put(hsv_rgb(P.hsv)); });
    // RAL mode (ral.js): in the field's place a family's colours as a grid, in the strip's place the nine families as
    // fixed bands, each named by its thousand. Pressing a band shows its family; pressing a colour takes it, exactly.
    // Under the grid, which chart: a pill switch, RAL Classic | Classic & Design System+, each with the tiles it shows
    // (a plain one, a dotted one); the second on to start, kept while the page is open (Okay, 30 Oct 2026, 16:03–16:08:
    // "Pill selectors we have designed use them … flush left with smaller type"; "inside the pills give all thumbnails";
    // "RAL classic on the left").
    // Lume mode (lume.js; #175): in the field's place the research's lumes as tiles — the colour by day with a faded L,
    // a dot of its glow, its name and its strength against C3. Pressing one takes it, exactly. For an opening's fill it
    // is the only mode, and an Open tile comes first: no fill, the dial seen through (Okay, 2 Nov 2026, 22:38: "with
    // lume coming in with our color selector with no other options but lume")
    P.lumes = el("div", { className: "lumegrid", id: "pop-lumes", hidden: true });
    P.design = true;
    P.ral = el("div", { className: "ralgrid", id: "pop-ralgrid", title: "RAL: down, darker; across, more vivid", hidden: true });
    const chart = (id, on, ...kids) => el("button", { type: "button", id, onclick: () => { P.design = on; this.pop_refresh(); } }, ...kids);
    P.charts = el("div", { className: "pillswitch charts", id: "pop-charts", role: "radiogroup", ariaLabel: "Which RAL colours", hidden: true },
      chart("pop-classic", false, el("i"), el("span", { textContent: "RAL Classic" })),
      chart("pop-design", true, el("i"), el("span", { textContent: "Classic & " }), el("i", { className: "design" }), el("span", { textContent: "Design System+" })));
    // the bands, each named by its thousand inside it, the name dark on a light band (Okay, 16:01: "Put ral's thousands
    // inside the colored section to win one line there")
    P.bands = el("div", { className: "bands", id: "pop-bands", hidden: true }, ...RAL_FAMILIES.map(([digit, name]) => {
      const b = el("button", { type: "button", id: "pop-band-" + digit, className: ral_lightness(ral_family_colour(digit)) > 60 ? "light" : "", title: `${name} (RAL ${digit}000)`, ariaLabel: `${name}, RAL ${digit}000`, onclick: () => { P.family = digit; this.pop_refresh(); } }, el("span", { textContent: digit + "000" }));
      b.dataset.family = digit;
      b.style.setProperty("--c", ral_family_colour(digit));
      return b;
    }));
    // how see-through: a strip from nothing to the full colour, and the same as a percentage. Rings only.
    const see_through = (a) => P.at.write(P.at.read().slice(0, 3).concat([+clamp(a, 0, 1).toFixed(2)]));
    P.alpha = el("div", { className: "alpha", title: "Opacity" }, el("i"));
    drag_in(P.alpha, (x) => see_through(x));
    P.alpha_field = el("input", { type: "text", inputMode: "numeric", id: "pop-alpha", ariaLabel: "Opacity, %", title: "Opacity, %" });
    P.alpha_field.onchange = () => { const v = parseFloat(P.alpha_field.value); if (Number.isFinite(v)) see_through(v / 100); P.alpha_field.value = `${Math.round((P.at.read()[3] ?? 1) * 100)}%`; };
    P.alpha_row = el("div", { className: "alpharow" }, P.alpha, P.alpha_field);
    P.dot = el("i", { className: "dot" });      // the colour's own swatch, inside the values' box (Okay, 30 Oct 2026: "Incorporate swatches into the color code boxes, no stroke for them")
    P.modes = el("span", { className: "segs" });
    for (const mode of G.COLOUR_MODES) P.modes.append(el("button", { type: "button", textContent: mode, id: "pop-as-" + mode, onclick: () => { this.colour_mode = mode; this.pop_refresh(); } }));
    P.numbers = el("span", { className: "numbers" });
    // Copy: the copy sign alone (Okay, 30 Oct 2026: "Copy gets an icon, color name area grows"); copied, it fills for a moment; failed, it says NO
    P.copy = el("button", { type: "button", className: "btn copy", id: "pop-copy", title: "Copy the values shown", ariaLabel: "Copy the values shown", onclick: async () => {
      try { await navigator.clipboard.writeText(this.pop_text()); P.copy.classList.add("done"); } catch (e) { P.copy.textContent = "NO"; }
      setTimeout(() => { P.copy.classList.remove("done"); P.copy.innerHTML = icon(SIGNS.copy); }, 1200);
    } });
    P.copy.innerHTML = icon(SIGNS.copy);
    P.el = el("div", { className: "colourpop night", id: "colour-pop", hidden: true },
      head,
      el("div", { className: "chiprow" }, el("span", { className: "quiet", textContent: "On this dial" }), P.used_chips),
      P.none,
      el("div", { className: "chiprow" }, el("span", { className: "quiet", textContent: "Palette" }), P.palette_chips),
      P.field, P.ral, P.lumes, P.charts, P.hues, P.bands, P.alpha_row, el("div", { className: "asnumbers" }, P.modes, el("span", { className: "valuebox" }, P.dot, P.numbers), P.copy));
    P.el.setAttribute("role", "dialog");
    P.el.onkeydown = (e) => { if (e.key === "Escape") { const swatch = P.at && P.at.swatch; this.pop_close(); if (swatch) swatch.focus(); } };
    // the head drags it (not when it is wide, and not on a phone, where it is a sheet)
    head.onpointerdown = (e) => {
      if (e.target.closest("button") || this.pop_is_sheet()) return;
      e.preventDefault();
      head.setPointerCapture(e.pointerId);
      const r = P.el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.onpointermove = (ev) => this.pop_place(ev.clientX - dx, ev.clientY - dy);
      head.onpointerup = head.onpointercancel = () => { head.onpointermove = null; };
    };
    return P.el;
  },

  pop_is_sheet() { return matchMedia("(max-width: 860px)").matches; },

  /** put its top left corner there, kept inside the window. */
  pop_place(x, y) {
    const P = this.pop, r = P.el.getBoundingClientRect();
    if (this.pop_is_sheet()) { P.el.style.left = P.el.style.top = ""; return; }      // a sheet stands where the stylesheet puts it
    P.el.style.left = `${clamp(x, 0, Math.max(0, innerWidth - r.width))}px`;
    P.el.style.top = `${clamp(y, 0, Math.max(0, innerHeight - r.height))}px`;
  },

  /** a colour pill: one small button — a swatch and the hex in monospace (Okay, 12 Oct 2026: "all sleek"). It only
   *  opens the pop-out, on every device. While the pop-out is open for it, it is black. show(rgba) fills it. */
  colour_pill(id, title) {
    const dot = el("i", { className: "dot" }), hex = el("span", { className: "hex", id: id + "-hex" });
    const pill = el("button", { type: "button", className: "colour", id, title }, dot, hex);
    pill.setAttribute("aria-expanded", "false");
    pill.none = () => { paint(dot, [0, 0, 0, 0]); dot.classList.add("none"); hex.textContent = "None"; };      // no colour at all: the Paint's off (the bare metal shows)
    pill.show = (c) => { dot.classList.remove("none"); paint(dot, c); dot.classList.toggle("lume", !is_open(c) && Boolean(lume_exact(to_hex(c)))); hex.textContent = is_open(c) ? "Open" : colour_word(c); if (title) pill.ariaLabel = `${title} ${hex.textContent}`; };      // a lume's swatch carries a faded L (22:38: "Lume colors get L in their swatches")      // a screen reader hears whose colour it is, not the hex alone (#244, 4.47.2)
    return pill;
  },

  /** a row's colour, as the pop-out wants it: read it, write it, say whose it is ("Numerals · Colour", "Plate").
   *  It follows the scope, so with a ring's colour open, selecting another ring shows that ring's. */
  colour_of_row(row) {
    return {
      alpha: (row.scope === "ring" || row.scope === "hand") && !row.lume_only,      // rings (Okay, 12 Oct 2026) and hands (#163, 14 Oct 2026) can be see-through; a lume never: an ink, laid whole
      lume_only: Boolean(row.lume_only),      // an opening's fill: Lume alone, with Open (#175)
      // none: the pop-out's No colour button, for a colour that may be left off (Paint: Okay, 11 Nov 2026, "on off is possible through color selector popup adding a no color button in it")
      none: row.none ? { off: () => this.S[row.none] === false, set: () => this.set_value("global", row.none, false) } : null,
      read: () => { const T = this.target(row.scope); return T ? (row.get ? row.get(T) : T[row.key]) || (row.or ? row.or(T) : null) : null; },      // get · put: a row standing for part of a setting (a NATO's stripe)
      write: (value) => { if (row.none && this.S[row.none] === false) this.set_value("global", row.none, true);      // a colour picked puts it back on
        return row.put ? row.put(this, value) : this.set_value(row.scope, row.key, value); },
      label: () => {
        const S = this.S, scope = row.scope;
        const whose = scope === "ring" ? this.ring().name || G.kind_of(this.ring()) : scope === "hand" ? ["Hour hand", "Minute hand", "Seconds hand"][S.ui_hand] : scope === "window" ? `Window ${S.ui_window + 1}` : "";
        return whose ? `${whose} · ${row.text}` : row.text;
      },
    };
  },

  /** a swatch was pressed: open beside it; pressed again: close. colour = {read(), write(rgba), label()}.
   *  beside = what it opens at the right of: the swatch, or the row of swatches it is in, so its neighbours stay in reach. */
  pop_open(colour, swatch, beside = swatch) {
    const P = this.pop;
    if (P.at && P.at.swatch === swatch) return this.pop_close();
    if (P.at) P.at.swatch.setAttribute("aria-expanded", "false");
    P.at = { ...colour, swatch };
    P.family = null;      // RAL mode starts at the family of the colour in hand
    this.colour_mode = colour.lume_only ? "Lume" : G.COLOUR_MODES[this.S.ui_colour_as] || "HEX";      // it opens as Settings says; the others a press away (Okay, 31 Oct 2026: "opens the color selector box to open default as, other colors still allowed"); an opening's fill in Lume, alone
    swatch.setAttribute("aria-expanded", "true");
    P.el.hidden = false;
    this.pop_wide(false);
    this.sync_rows();
    this.pop_place(beside.getBoundingClientRect().right + POP_GAP, swatch.getBoundingClientRect().top - POP_GAP);
  },

  pop_close() {
    const P = this.pop;
    if (!P || !P.at) return;
    const swatch = P.at.swatch;
    P.at = null;
    P.el.hidden = true;
    swatch.setAttribute("aria-expanded", "false");
  },

  /** twice its size (Okay, 12 Oct 2026: "size of popup grows ×2"), or back. Twice as wide; the field of one hue takes
   *  the added height, so the whole is twice as high. Never larger than the window. On a phone it is a sheet: wide,
   *  it is the whole screen, and the stylesheet does it. */
  pop_wide(on) {
    const P = this.pop;
    if (on === P.wide) return;
    const face = this.colour_mode === "RAL" ? P.ral : P.field;      // the field of one hue, or RAL's grid: whichever is shown takes the added height
    const r = P.el.getBoundingClientRect(), field = face.getBoundingClientRect().height;
    P.wide = on;
    P.el.classList.toggle("wide", on);
    $("#pop-wide").setAttribute("aria-pressed", String(on));
    if (on && !this.pop_is_sheet()) {
      P.el.style.width = `${Math.min(2 * r.width, innerWidth)}px`;
      face.style.height = `${field}px`;
      const rest = P.el.getBoundingClientRect().height - field;      // everything but the field, at the new width (the chips grew)
      face.style.height = `${Math.max(field, Math.min(2 * r.height, innerHeight) - rest)}px`;
    } else P.el.style.width = P.field.style.height = P.ral.style.height = "";
    if (!P.el.hidden) this.pop_place(r.left, r.top);          // where it was, moved only as far as the window asks
  },

  /** the window changed size: a sheet is placed by the stylesheet; anything else stays inside the window. */
  pop_cover() {
    const P = this.pop;
    if (!P.at) return;
    if (this.pop_is_sheet()) { P.el.style.width = P.field.style.height = P.ral.style.height = ""; }
    const r = P.el.getBoundingClientRect();
    this.pop_place(r.left, r.top);
  },

  /** the values as the line shows them, to copy: #RRGGBB · 255, 128, 0 · 0, 50, 100, 0 · RAL 5015 Sky blue */
  pop_text() {
    const rgb = this.pop.at.read().slice(0, 3), mode = this.colour_mode;
    if (mode === "RAL") { const { colour, exact } = ral_nearest(rgb, this.pop.design); return `${exact ? "" : "≈ "}RAL ${colour.code} ${colour.name}`; }
    if (mode === "Lume") { const l = lume_exact(to_hex(rgb)); return l ? `Lume ${l.name}` : to_hex(rgb).toUpperCase(); }
    return mode === "HEX" ? to_hex(rgb).toUpperCase() : (mode === "RGB" ? rgb.map((v) => Math.round(v * 255)) : rgb_cmyk(rgb).map((v) => Math.round(v * 100))).join(", ");
  },

  /** the pop-out shows the setting it edits. */
  pop_refresh() {
    const P = this.pop;
    if (!P || !P.at) return;
    const colour = P.at.swatch.isConnected ? P.at.read() : null;
    if (!Array.isArray(colour)) return this.pop_close();      // its swatch is gone (another section, a ring deleted)
    const rgb = colour.slice(0, 3), value = to_hex(rgb).toUpperCase();
    const before = P.el.getBoundingClientRect();      // RAL mode is taller: when the pop-out stands low on the screen it grows upward, high it grows down (Okay, 30 Oct 2026: "ral selection makes color popup grow up when it's down on screen, down when up")
    P.title.textContent = P.at.label();
    P.none.hidden = !P.at.none; if (P.at.none) P.none_btn.setAttribute("aria-pressed", String(P.at.none.off()));
    const put = (c) => P.pick(c);
    const chip = (c) => { const lume = lume_exact(c), ral = !lume && ral_exact(c), said = lume ? `Lume ${lume.name}` : ral ? `RAL ${ral.code} ${ral.name}` : c, b = el("button", { type: "button", className: lume ? "lume" : ral ? "ral" : "", title: said, ariaLabel: said, onclick: () => put(c) }); b.style.background = c; b.dataset.colour = c; return b; };      // a chip that is exactly a RAL carries a faded R (Okay, 30 Oct 2026, 16:14), a lume's a faded L (2 Nov 2026, 22:38)
    const used = this.dial_colours().map((c) => to_hex(c).toUpperCase());      // this dial's colours, each once
    if (P.used !== used.join()) { P.used = used.join(); P.used_chips.replaceChildren(...used.map(chip)); }
    // the palette, then its + (or −, when the colour in hand is already in it)
    const kept = this.palette.includes(value), list = this.palette.join() + kept;
    if (P.listed !== list) {
      P.listed = list;
      const change = el("button", { type: "button", className: "add", id: "pop-add", textContent: kept ? "−" : "+", title: kept ? "Take this colour out of the palette" : "Add this colour to the palette", onclick: () => {
        const now = to_hex(P.at.read()).toUpperCase();
        this.palette = this.palette.includes(now) ? this.palette.filter((c) => c !== now) : [...this.palette, now];
        try { localStorage.setItem(PALETTE_KEY, JSON.stringify(this.palette)); } catch (e) { /* not kept */ }
        this.pop_refresh();
      } });
      P.palette_chips.replaceChildren(...this.palette.map(chip), change);
    }
    for (const b of P.el.querySelectorAll(".chips button[data-colour]")) b.classList.toggle("on", b.dataset.colour === value && !(P.at.none && P.at.none.off()));      // bare: no colour is in hand
    // RAL mode shows a family's grid and the bands in place of the field and the hues (ral.js)
    const ral = this.colour_mode === "RAL", near = ral ? ral_nearest(rgb, P.design) : null, lumed = this.colour_mode === "Lume", only = Boolean(P.at.lume_only);
    P.field.hidden = P.hues.hidden = ral || lumed;
    P.ral.hidden = P.charts.hidden = P.bands.hidden = !ral;
    P.lumes.hidden = !lumed;
    P.el.classList.toggle("lumeonly", only);      // Lume alone: no other modes, no dial or palette chips
    if (lumed) {
      const shown = only ? "open+" : "lumes";
      if (P.lumes.dataset.shown !== shown) {
        P.lumes.dataset.shown = shown;
        const tile = (id, name, small, title, day, glow, take) => { const b = el("button", { type: "button", id, title, ariaLabel: title, onclick: take }, el("span", { className: "day" }), el("b", { textContent: name }), el("small", { textContent: small })); if (day) { b.firstChild.style.background = day; b.firstChild.append(el("i")); b.firstChild.lastChild.style.background = glow; } return b; };
        P.lumes.replaceChildren(...(only ? [tile("pop-lume-open", "Open", "no fill", "Open: no fill, the dial seen through", null, null, () => P.at.write([...P.at.read().slice(0, 3), 0]))] : []),
          ...LUMES.map((l) => { const b = tile("pop-lume-" + l.name.replace(/ /g, "-"), l.name, l.k, `${l.name}: ${l.what}`, l.hex, l.glow, () => P.at.write([...from_hex(l.hex).slice(0, 3), 1])); b.dataset.hex = l.hex; return b; }));
        if (only) P.lumes.firstChild.classList.add("open");
      }
      const at = is_open(colour) ? null : value;
      for (const b of P.lumes.children) b.classList.toggle("on", b.classList.contains("open") ? at === null : b.dataset.hex === at);
    }
    if (ral) {
      const family = P.family || near.colour.family, shown = family + (P.design ? "+" : "");
      if (P.ral.dataset.shown !== shown) {
        P.ral.dataset.shown = shown;
        P.ral.replaceChildren(...ral_grid(family, P.design).map((row) => el("div", { className: "ralrow" }, ...row.map((c) => {
          if (!c) return el("i");      // no colour at this step
          const b = el("button", { type: "button", className: c.design ? "design" : "", title: `RAL ${c.code} ${c.name}`, ariaLabel: `RAL ${c.code} ${c.name}`, onclick: () => P.pick(c.hex) });
          b.dataset.code = c.code; b.style.setProperty("--c", c.hex);
          return b;
        }))));
      }
      for (const b of P.ral.querySelectorAll("button")) b.classList.toggle("on", near.exact && b.dataset.code === near.colour.code);
      for (const b of P.bands.children) b.classList.toggle("on", b.dataset.family === family);
      P.charts.style.setProperty("--pop-key", ral_family_colour(family));
      for (const b of P.charts.children) { const on = (b.id === "pop-design") === P.design; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); }
    }
    // the field and the hues. Grey has no hue and black no strength: keep the ones last chosen.
    const fresh = rgb_hsv(rgb);
    if (to_hex(hsv_rgb(P.hsv)).toUpperCase() !== value) P.hsv = [fresh[1] > 0 && fresh[2] > 0 ? fresh[0] : P.hsv[0], fresh[2] > 0 ? fresh[1] : P.hsv[1], fresh[2]];
    const knob = P.field.firstChild;
    P.field.style.setProperty("--hue", `hsl(${P.hsv[0]} 100% 50%)`);
    knob.style.left = `${P.hsv[1] * 100}%`; knob.style.top = `${(1 - P.hsv[2]) * 100}%`;
    knob.style.background = value;
    P.hues.firstChild.style.left = `${P.hsv[0] / 360 * 100}%`;
    P.hues.firstChild.style.background = `hsl(${P.hsv[0]} 100% 50%)`;
    const a = colour[3] ?? 1;
    P.alpha_row.hidden = !P.at.alpha || lumed;
    P.alpha.style.setProperty("--solid", value);
    P.alpha.firstChild.style.left = `${a * 100}%`;
    if (!has_focus(P.alpha_field)) P.alpha_field.value = `${Math.round(a * 100)}%`;
    paint(P.dot, P.at.alpha ? colour : rgb);
    // the line: the same colour as numbers
    const mode = this.colour_mode;
    [...P.modes.children].forEach((b) => b.classList.toggle("on", b.textContent === mode));
    if (P.mode !== mode) {
      P.mode = mode;
      P.numbers.dataset.mode = mode;
      const commit = () => {
        const fields = [...P.numbers.querySelectorAll("input")];
        if (mode === "HEX") { const hex = parse_hex(fields[0].value); if (hex) P.pick(hex); else this.pop_refresh(); return; }
        if (mode === "RAL") { const colour = ral_by_code(fields[0].value); if (colour) P.pick(colour.hex); else this.pop_refresh(); return; }
        if (mode === "Lume") { const l = lume_by_name(fields[0].value); if (l) P.at.write([...from_hex(l.hex).slice(0, 3), 1]); else this.pop_refresh(); return; }
        const all = fields.map((x) => parseFloat(x.value) || 0);
        const next = mode === "RGB" ? all.map((v) => v / 255) : cmyk_rgb(all.map((v) => v / 100));
        P.put(next);
        this.pop_refresh();
      };
      // the values in cells divided by black rules, a letter over each (HEX · R G B · C M Y K · RAL NAME); RAL's last
      // cell is the name, twice a code's width, cut when long; "≈" before the code when the colour is near one, not on it
      const cell = (letter, i, kid) => { const c = el("span", { className: "cell" + (letter === "name" ? " name" : "") }, kid); c.dataset.l = letter; kid.dataset.i = i; return c; };
      const field = (letter, i) => cell(letter, i, el("input", { type: "text", inputMode: mode === "HEX" || mode === "RAL" ? "text" : "numeric", ariaLabel: letter, id: "pop-" + letter, spellcheck: false, onchange: commit }));
      P.numbers.replaceChildren(...(mode === "HEX" ? [field("hex", 0)] : mode === "RAL" ? [field("ral", 0), cell("name", 1, el("span", { id: "pop-ral-name" }))] : mode === "Lume" ? [field("lume", 0), cell("glow", 1, el("span", { id: "pop-lume-glow" }))] : [...mode].map((letter, i) => field(letter, i))));
    }
    const lume = mode === "Lume" ? lume_exact(value) : null;
    const values = mode === "Lume" ? (is_open(colour) ? ["Open", "none"] : lume ? [lume.name, lume.glows] : ["≈ " + value, "not a lume"]) : mode === "HEX" ? [value] : mode === "RAL" ? [(near.exact ? "" : "≈ ") + near.colour.code, near.colour.name] : mode === "RGB" ? rgb.map((v) => Math.round(v * 255)) : rgb_cmyk(rgb).map((v) => Math.round(v * 100));
    for (const f of P.numbers.querySelectorAll("input")) if (!has_focus(f)) f.value = values[f.dataset.i];
    if (mode === "RAL") $("#pop-ral-name").textContent = values[1];
    if (mode === "Lume") $("#pop-lume-glow").textContent = values[1];
    const grown = P.el.getBoundingClientRect().height - before.height;
    if (grown && !P.el.hidden && !this.pop_is_sheet() && before.top + before.height / 2 > innerHeight / 2) this.pop_place(before.left, before.top - grown);      // low on the screen: the bottom stays, the top moves
  },

  /** a setting changed outside set_value (a colour in a list): show it. shapes = the dial's shapes changed too. */
  changed(shapes = false) {
    if (shapes) this.static_dirty = true;
    this.sync_rows();
    this.render();
  },

  /** a band's sectors as colours: [{id, title, read, write}], one per position it uses. */
  sector_colours(i) {
    const ring = this.S.rings[i], name = ring.name || G.kind_of(ring);
    return G.positions_of(ring).map((at, n) => ({
      id: `ring-${i}-sector-${at}`, title: `${name} · sector ${n + 1}`, alpha: true,
      read: () => { const R = this.S.rings[i]; return R ? G.sector_colour(R, at) : null; },
      write: (value) => { const R = this.S.rings[i]; R.cs = { ...R.cs, [at]: value }; this.changed(true); },
    }));
  },

  /** lines of swatches inside a holder: lines() → [{text, colours: [{id, title, read, write}]}]. Built again only
   *  when the list itself changes (a ring added, renamed, a sector more), so an open pop-out keeps its swatch. */
  swatch_lines(holder, lines) {
    const raw = lines(), showing = raw.some((l) => l.eye);      // show mode: each line eye · name · colour · its own extras (#521)
    // show mode: a part of several colours opens to a line a colour, each named by what it colours (Okay, 3 Nov 2026, 01:34:
    // "All multiple color parts get multiple lines per color and label"): the part an expandable line (its chevron in its
    // dot's place, its name bold), its dot on its first colour's line (the hand itself)
    const list = showing ? raw.flatMap((l) => {
      if (l.sub || l.colours.length < 2) return [l];
      const key = "part:" + l.text;
      return [{ ...l, colours: [], note: null, eye: null, parent: key },
        ...l.colours.map((c, n) => ({ text: colour_part(c.title), colours: [{ ...c, square: false }], part: key, eye: n === 0 ? l.eye : null, mark: c.id.startsWith("cap") ? PICS.cap : "" }))];
    }) : raw;
    const signature = JSON.stringify(list.map((l) => [l.text, l.colours.map((c) => c.id), Boolean(l.eye), Boolean(l.sub), l.mark || "", l.note || "", (l.tail || []).map((t) => t.key), l.parent || l.part || "", l.grip ?? "", Boolean(l.lead)]));
    if (holder.dataset.list !== signature) {
      holder.dataset.list = signature;
      holder.extras = [];
      holder.replaceChildren(...list.map((line) => {
        if (line.sub) return this.list_head(line.text, showing ? "group:" + line.text : null);      // a group's name: Rings · Hands · Windows (#545), with its chevron in show mode
        // one colour: a pill with its hex, like a colour row (show mode too: "swatches, alone spelled out", #546). Many (a
        // band's sectors), or one marked square (the cap beside its hand, a Hands line): squares.
        const pills = line.colours.filter((c) => !c.square).length;
        const group = el("span", { className: pills === 1 && line.colours.length === 1 ? "single" : "swatches" });
        for (const c of line.colours) {
          const swatch = pills === 1 && line.colours.length === 1 ? this.colour_pill("colour-" + c.id, c.title) : el("button", { type: "button", className: "swatch", id: "colour-" + c.id, title: c.title });
          if (c.square || showing) swatch.dataset.tip = c.title;
          swatch.onclick = () => this.pop_open({ read: c.read, write: c.write, label: () => c.title, alpha: Boolean(c.alpha), lume_only: Boolean(c.lume_only) }, swatch, group);
          group.append(swatch);
        }
        if (line.note) { const dots = el("span", { className: "dots" }, ...group.children); group.append(dots, el("span", { className: "note", textContent: line.note })); }      // the swatches six to a line in their own box, then what they are, in grey: "12 sectors", "hand · cap"
        const name = el("label", { textContent: line.text });
        if (!showing) return el("div", { className: "row" }, name, group);
        // show mode's line (#546): the eye (or its empty place), the part's kind mark, the name, the colour(s) on the one
        // swatch column every line of the tab shares (as main's ring list), then the number's place
        // a part shown on the watch or not: a dot (#547: the eye is the panes' fold), filled shown, a ring hidden
        const eye_place = line.parent ? this.list_chevron(line.parent) : line.eye ? el("button", { type: "button", className: "eye seen", title: line.eye.title, ariaLabel: line.eye.title, onclick: () => line.eye.write(!line.eye.read()) }) : el("i");      // an <i>: an empty first span would be hidden (4c-rows)
        const mark = el("span", { className: "mark" });
        if (line.mark) mark.innerHTML = line.mark;
        const number = el("span", { className: "place" });
        for (const t of line.tail || []) { const made = t.make(); number.append(made.el); holder.extras.push(made); }
        const row = el("div", { className: "row showline" + (line.tail ? "" : " bare") + (line.lead ? " lead" : "") + (line.parent ? " many" : "") + (line.part ? " part" : "") }, eye_place, mark, name, group, number);
        if (line.grip != null) {      // a ring's grip, the Rings tab's (#579, Okay: "a 6 dot gripper and ring top-down arranger here as well. just before the color swatches"): dragged, drag_ring moves the ring in both lists
          const grip = el("span", { className: "grip", title: "Drag to change the order" });
          grip.innerHTML = icon(TOOL_ICONS.grip);
          grip.onpointerdown = (e) => this.drag_ring(e, line.grip, { list: holder, rows: [...holder.children].filter((r) => r.querySelector(":scope > .grip")), after: () => { holder.dataset.list = ""; } });
          name.after(grip);
        }      // bare: colours only (Colours), the swatches may run on into the number's room
        if (line.parent) row.dataset.key = line.parent;
        if (line.eye) holder.extras.push({ refresh: () => { const on = Boolean(line.eye.read()); eye_place.innerHTML = list_dot(on); eye_place.setAttribute("aria-pressed", String(on)); row.classList.toggle("off", !on); } });      // hidden: the line greys, its dot a dotted ring (01:27)
        return row;
      }));
    }
    for (const x of holder.extras || []) x.refresh(this.S);
    if (showing) this.list_folds(holder);
    const all = list.flatMap((l) => l.colours);
    [...holder.querySelectorAll("button.colour, button.swatch")].forEach((swatch, k) => {
      const c = all[k].read();
      if (swatch.show) swatch.show(c); else paint(swatch, c);
    });
  },

  /** show mode's lists (Okay, 3 Nov 2026, 01:17–01:43, drawn on the Dial tab): what holds several opens and closes by a
   *  chevron in the dots' column, its name bold — a group (Rings, On the dial…) and a part of several colours. Which are
   *  shut is kept by this browser, as the panes' eyes are. */
  list_shut() {
    if (!this.shut) { try { this.shut = new Set(JSON.parse(localStorage.getItem(KEY("shut"))) || []); } catch (e) { this.shut = new Set(); } }
    return this.shut;
  },
  list_chevron(key) {
    const open = !this.list_shut().has(key);
    const b = el("button", { type: "button", className: "eye chev" + (open ? " open" : ""), title: open ? "Close" : "Open", ariaLabel: open ? "Close" : "Open", ariaExpanded: String(open), onclick: () => {
      const shut = this.list_shut();
      if (shut.has(key)) shut.delete(key); else shut.add(key);
      try { localStorage.setItem(KEY("shut"), JSON.stringify([...shut])); } catch (e) { /* not kept */ }
      for (const c of document.querySelectorAll(".colourlist .chev[data-key]")) { const o = !shut.has(c.dataset.key); c.classList.toggle("open", o); c.ariaExpanded = String(o); c.title = c.ariaLabel = o ? "Close" : "Open"; }
      for (const l of document.querySelectorAll(".colourlist")) this.list_folds(l);
    } });
    b.dataset.key = key;
    b.innerHTML = icon(SIGNS.down);
    return b;
  },
  /** a group's name; with a key, its chevron */
  list_head(text, key) {
    const row = el("div", { className: "row showsub" }, el("span", { className: "colhead", textContent: text }));
    if (key) { row.prepend(this.list_chevron(key)); row.dataset.key = key; }
    return row;
  },
  /** hide what a shut chevron holds: a group's lines down to the next group's name, a part's colour lines */
  list_folds(holder) {
    const shut = this.list_shut();
    let group = null, part = null;
    for (const row of holder.children) {
      if (row.classList.contains("showsub")) { group = row.dataset.key || null; part = null; continue; }
      if (row.classList.contains("many")) part = row.dataset.key;
      else if (!row.classList.contains("part")) part = null;
      row.hidden = Boolean(group && shut.has(group)) || (row.classList.contains("part") && Boolean(part && shut.has(part)));
    }
  },

  /** Dial → Colours: every coloured part on the plate. Rings top first, a band's sectors one by one; hands, cap, windows.
   *  In show mode (#545) the same parts by what they are — RINGS · HANDS · WINDOWS — each line its eye, its name and every
   *  colour it has; their inks and heights are in the Inks and Hands panes, whose swatches are these same colours. */
  row_colours(wrap, out) {
    wrap.className = "colourlist";
    const one = (id, title, read, write, alpha = false) => [{ id, title, read, write, alpha }];
    out.refresh = () => this.swatch_lines(wrap, () => {
      const S = this.S, lines = [], show = S.ui_show;
      if (show) lines.push({ text: "Dial", lead: true, colours: one("plate", "Dial", () => this.S.c_plate, (v) => { this.S.c_plate = v; this.changed(); }) });      // flush on the marks' column, bold (01:13: "is not indented, is bold")
      if (show) lines.push({ sub: true, text: "Rings", colours: [] });
      S.rings.forEach((ring, i) => {
        const line = { text: ring.name || G.kind_of(ring), colours: this.ring_colours(i) };
        if (show) {
          line.eye = { title: "Show or hide this ring", read: () => (this.S.rings[i] || {}).on, write: (on) => this.show_ring(i, on) };
          line.mark = PICS.kind(ring.kind);      // the ring list's kind mark
          line.grip = i;      // the ring list's 6-dot grip before the swatch: dragged, the rings' order (#579)
          if (line.colours.length > 1) line.note = `${line.colours.length} sectors`;
        }
        lines.push(line);
      });
      const cap = this.cap_colour();
      if (show) lines.push({ sub: true, text: "Hands", colours: [] });
      G.HANDS.forEach((h, k) => {
        if (!G.hand_added(S, h)) return;      // a hand of your own not yet added has no line (#577)
        const text = G.hand_word(h), line = { text, colours: show ? this.hand_colours(h, text) : [this.hand_colour(h, text)], mark: show ? PICS.hand : "" };
        if (show) {      // its eye, its colour and the cap's as a square beside it, on the hand the cap sits on (Okay: "A swatch on its hand's line")
          line.eye = { title: "Show or hide this hand", read: () => this.S["ha_" + h].on, write: (on) => { this.S["ha_" + h].on = on; this.changed(); } };
          if (G.cap_shows(S) && k === G.top_hand(S)) { line.colours = [...line.colours, { ...cap, square: true }]; line.note = "hand · cap"; }
        }
        lines.push(line);
      });
      if (!show || !G.cap_shows(S) || G.top_hand(S) < 0) lines.push({ text: "Cap", colours: [cap] });
      const wins = G.windows_of(S).map((w, k) => [w, k]).filter(([w]) => w.on);
      if (show && wins.length) lines.push({ sub: true, text: "Windows", colours: [] });
      for (const [w, k] of wins) {
        if (show) { const colours = this.window_colours(k); lines.push({ text: G.window_name(w), mark: PICS.window_mark, colours, note: colours.map((c) => c.title.split(" · ").pop()).join(" · ") }); }      // frame · disc · what is printed on it, one line, the squares named in grey (#546)
        else lines.push({ text: `Window ${k + 1}`, colours: one("window-" + k, `Window ${k + 1}`, () => G.windows_of(this.S)[k].ink, (v) => { G.windows_of(this.S)[k].ink = v; this.changed(); }) });
      }
      return lines;
    });
  },

  /** a ring's colour, or a band's sectors' — the same swatches wherever the ring is listed */
  ring_colours(i) {
    const ring = this.S.rings[i], text = ring.name || G.kind_of(ring);
    if (G.kind_of(ring) === "band" && G.positions_of(ring).length > 1) return this.sector_colours(i);
    return [{ id: `ring-${i}`, title: text, alpha: true, read: () => (this.S.rings[i] || {}).c, write: (v) => { this.S.rings[i].c = v; this.changed(); } }];
  },
  /** a hand's colours in show mode's lists (Okay, 3 Nov 2026, 02:11: "Disc hands have more colors, all the hands that have
   *  other colors or lume areas are expanded here"): the hand itself (a disc's: Disc), a disc's painted mark and its
   *  stroke, its openings' lume — the line opens to them when there are more than one. suffix: the list's own ids */
  hand_colours(h, text, suffix = "") {
    const H = () => this.S["ha_" + h], put = (key) => (v) => { H()[key] = v; this.changed(true); }, T = H(), disc = G.HAND_SHAPES[T.shape] === "disc";
    const out = [{ ...this.hand_colour(h, text), id: `hand-${h}${suffix}`, title: `${text} · ${disc ? "disc" : "hand"}` }];
    if (G.paints_mark(T) && G.disc_mark(T)) out.push({ id: `hand-${h}-mark${suffix}`, title: `${text} · mark`, alpha: true, read: () => H().mark_c, write: put("mark_c") });
    if (G.mark_stroke(T)) out.push({ id: `hand-${h}-stroke${suffix}`, title: `${text} · mark stroke`, read: () => H().mark_stroke_c || H().c, write: put("mark_stroke_c") });
    if (G.fills_openings(T)) out.push({ id: `hand-${h}-lume${suffix}`, title: `${text} · lume`, lume_only: true, read: () => H().op_fill, write: put("op_fill") });
    return out;
  },
  hand_colour(h, text) { return { id: "hand-" + h, title: text, alpha: true, read: () => this.S["ha_" + h].c, write: (v) => { this.S["ha_" + h].c = v; this.changed(); } }; },
  cap_colour() { return { id: "cap", title: "Cap", read: () => this.S.c_cap, write: (v) => { this.S.c_cap = v; this.changed(); } }; },

  /** a window's colours as the Windows tab names them: its frame, its disc, then what is printed on the disc */
  window_colours(k) {
    const w = () => G.windows_of(this.S)[k], put = (key) => (v) => { w()[key] = v; this.changed(); };
    const W = w(), name = G.window_name(W);
    const disc_word = is_day(W) && !W.ampm_form ? "AM half" : moon_look(W) === 1 ? "Moon" : "Disc";
    return [{ id: `window-${k}`, title: `${name} · frame`, read: () => w().ink, write: put("ink") },
      { id: `window-${k}-disc`, title: `${name} · ${disc_word.toLowerCase()}`, read: () => w().disc_c || [1, 1, 1, 1], write: put("disc_c") },
      ...this.window_prints(k)];
  },
  /** what is printed on a window's disc: its figures or picture, and a moon's shade or the neighbours (#545: on the disc,
   *  not the dial, so never one of the dial's inks) */
  window_prints(k) {
    const w = () => G.windows_of(this.S)[k], put = (key) => (v) => { w()[key] = v; this.changed(); };
    const W = w(), name = G.window_name(W), kind = G.WINDOW_KINDS[W.kind];
    const word = kind === "am · pm" || kind === "moon phase" ? (moon_look(W) === 1 ? "sky" : is_day(W) ? (W.ampm_form ? "text" : "PM half") : "picture") : "figures";
    const out = [{ id: `window-${k}-print`, title: `${name} · ${word}`, read: () => w().text_c || w().ink, write: put("text_c") }];
    if (moon_look(W) === 1) out.push({ id: `window-${k}-c2`, title: `${name} · shade`, read: () => w().c2 || G.PICTURE_TONES.shade, write: put("c2") });
    else if ((kind === "date" || kind === "day") && W.neighbours) out.push({ id: `window-${k}-c2`, title: `${name} · neighbours`, read: () => w().c2 || w().text_c || w().ink, write: put("c2") });
    return out;
  },

  /** the pane's heading line's right: the number column's name (Inks, Hands: "Height mm") */
  row_colhead(wrap, out, row) { wrap.append(el("span", { className: "colhead", textContent: row.text })); },

  /** show mode's Inks (#545): what a printer sees. ON THE DIAL, every ink by its exact colour, folded to start (its swatch
   *  — the colour of all its parts at once —, its hex, how many parts, its height); open, its parts, and the Two inks
   *  switch that makes it A and B, each its own height, each part an A | B pill. ON THE DISCS, what each window's disc
   *  carries, one height a window. DISC DEPTHS, each disc under the plate, the Shadows pane's number. */
  row_inks(wrap, out) {
    wrap.className = "colourlist inklist";
    this.ink_open = this.ink_open || new Set();      // which inks are open: the window's own state, closed to start (Okay: "Closed, each says its part count")
    const S = () => this.S;
    let rows = [];
    const sub = (text) => this.list_head(text, "group:" + text);      // a group's name, its chevron (01:27: "These rules are for all items in these panes with multiples")
    const height = (id, text, get, put, lo = 0, hi = G.INK_MOST) => { const made = this.line_number(num(id, text, lo, hi, 0.01, { block: true, id, get, put: (app, v) => { put(clamp(v, lo, hi)); this.changed(); } })); rows.push(made); return made.el; };
    // a colour: one alone is a pill with its hex spelled out; several are squares (#546: "swatches, alone spelled out")
    const swatch = (id, title, read, write, pill = false, lume_only = false) => {
      const b = pill ? this.colour_pill("colour-" + id, title) : el("button", { type: "button", className: "swatch", id: "colour-" + id, title });
      b.dataset.tip = title;
      b.onclick = () => this.pop_open({ read, write, label: () => title, lume_only }, b, b.parentElement);
      rows.push({ refresh: () => (b.show ? b.show(read()) : paint(b, read())) });
      return b;
    };
    const colours = (list) => (list.length === 1 ? swatch(list[0].id, list[0].title, list[0].read, list[0].write, true) : el("span", { className: "swatches" }, ...list.map((c) => swatch(c.id, c.title, c.read, c.write))));
    const mark = (html = "") => { const m = el("span", { className: "mark" }); m.innerHTML = html; return m; };
    const place = (...kids) => el("span", { className: "place" }, ...kids);
    const all = () => +S().w_ink_all || 0;
    const entry = (hex) => { const inks = S().w_inks = S().w_inks || {}; return (inks[hex] = inks[hex] || {}); };
    const build = () => {
      rows = [];
      const inks = G.dial_inks(S()), kids = [];
      kids.push(sub("On the dial"));      // the groups' names in grey, as the Shadows pane's (#546: "don't use allcaps everywhere")
      // every part straight under On the dial, grouped by ink, each with its ink's colour and its height (Okay, 3 Nov 2026,
      // 02:11: "This 3 items thing aborted. All 4 items expand from on the dial. This logic for all the inks"): the parts
      // of one ink share one height — a LINK pill between two, filled — unless a part is switched to its own ("Share one
      // height unless switched to separate heights"): its LINK pressed, the part below it gets its own number
      inks.forEach((ink, n) => {
        const now = () => G.dial_inks(S()).find((x) => x.parts.some((q) => q.kind === ink.parts[0].kind && q.i === ink.parts[0].i)) || ink;      // this ink now: its colour moves while a pop-out drags it
        // the swatch recolours every part of its ink, and its height goes with it to the new colour
        const write = (v) => {
          const from = now(), was = from.hex, to = G.ink_hex(v);
          for (const p of from.parts) {
            if (p.kind === "frame") { G.windows_of(S())[p.i].ink = v; continue; }
            if (p.kind === "stroke") { S().rings[p.i].stroke_c = v; continue; }
            const R = S().rings[p.i];
            if (Array.isArray(R.c) && G.ink_hex(R.c) === was) R.c = v;
            for (const at of Object.keys(R.cs || {})) if (Array.isArray(R.cs[at]) && G.ink_hex(R.cs[at]) === was) R.cs = { ...R.cs, [at]: v };
          }
          const keep = S().w_inks || {};
          if (was !== to && keep[was] && !keep[to]) { keep[to] = keep[was]; delete keep[was]; }
          this.changed(true);
        };
        let above = null;
        ink.parts.forEach((p, m) => {
          const name = p.name + (p.sectors > 1 ? ` · ${p.sectors} sectors` : p.sectors === 1 ? " · 1 sector" : "");
          const own = () => this.part_own(p);
          const box = height(`ink-${n}-part-${m}`, `${name}: its height`, () => (own() ?? G.ink_of(S(), now().hex).h) + all(), (v) => { const h = +(v - all()).toFixed(3); if (own() != null) this.part_own(p, h); else entry(now().hex).h = h; });
          const kind = p.kind === "frame" ? PICS.window_mark : PICS.kind(S().rings[p.i].kind);
          const pill = swatch(`ink-${n}-${m}`, `${name}: its ink, every part of it`, () => now().colour, write, true);
          const line = el("div", { className: "row showline inkline part" + (above ? " haslink" : "") }, el("i"), mark(kind), el("label", { textContent: name }), pill, place(box));
          // the LINK between this part and the one above it, on the line between them: filled, this part shares the ink's height
          if (above) this.ink_link(above, name, () => own() == null, () => { this.part_own(p, own() != null ? null : G.ink_of(S(), now().hex).h); wrap.dataset.list = ""; this.changed(true); }, rows, `ink-${n}-link-${m}`);
          kids.push(line); above = line;
        });
      });
      // what is printed on the hands — a lume, a disc's painted mark and its stroke (#175, #574; Okay, 2 Nov 2026, 22:31:
      // "Lume height … only on showcase as an ink height"; 3 Nov 2026, 02:11: "all the hands that have other colors or lume
      // areas are expanded here"): a line each, its ink's height over the blade or disc, linked as the dial's
      const prints = G.hand_prints(S());
      if (prints.length) kids.push(sub("On the hands"));
      let over = null;
      prints.forEach((p, n) => {
        const H = () => S()["ha_" + p.hand], now = () => G.hand_prints(S()).find((q) => q.hand === p.hand && q.kind === p.kind) || p;
        const own = (v) => { if (v === undefined) return H()[p.own] ?? null; H()[p.own] = v; };
        const write = (v) => { for (const q of G.hand_prints(S())) if (q.hex === now().hex) S()["ha_" + q.hand][q.key] = v; this.changed(true); };      // its ink: every part of that colour
        const pill = swatch(`print-${n}`, `${p.name}: its ink`, () => now().colour, write, true, p.kind === "lume");
        const box = height(`print-${n}-h`, `${p.name}: its height`, () => (own() ?? G.ink_of(S(), now().hex).h) + all(), (v) => { const h = +(v - all()).toFixed(3); if (own() != null) own(h); else entry(now().hex).h = h; });
        const line = el("div", { className: "row showline inkline part" }, el("i"), mark(PICS.hand), el("label", { textContent: p.name }), pill, place(box));
        if (over && over.hex === p.hex) this.ink_link(over.line, p.name, () => own() == null, () => { own(own() != null ? null : G.ink_of(S(), now().hex).h); wrap.dataset.list = ""; this.changed(true); }, rows, `print-link-${n}`);
        kids.push(line); over = { line, hex: p.hex };
      });
      // what is printed on the discs, a line a print, one height a window (its prints linked)
      const wins = G.windows_of(S()).map((w, k) => [w, k]).filter(([w]) => w.on);
      if (wins.length) kids.push(sub("On the discs"));
      for (const [w, k] of wins) {
        let first = null;
        this.window_prints(k).forEach((c, m) => {
          const box = height(`disc-${k}-print-${m}`, `${G.window_name(w)}: prints' height`, () => (G.windows_of(S())[k].print_h ?? G.INK_MM) + all(), (v) => { G.windows_of(S())[k].print_h = +(v - all()).toFixed(3); });
          const said = colour_part(c.title), label = wins.length > 1 ? `${G.window_name(w).split(" at ").pop()} · ${said}` : said;      // its print's name; with two windows, where it is first ("3 · Figures")
          const line = el("div", { className: "row showline inkline part" }, el("i"), mark(PICS.window_mark), el("label", { textContent: label, title: G.window_name(w) + " · " + said }), swatch(c.id + "-ink", c.title, c.read, c.write, true), place(box));
          if (first) this.ink_link(first, G.window_name(w), () => true, null, rows, `disc-${k}-link-${m}`);      // a disc's prints share one height: linked, always
          kids.push(line); first = line;
        });
      }
      // each disc's depth under the plate: the Shadows pane's number (one number, both places)
      const discs = wins.filter(([w, k]) => G.disc_of(S(), k));
      if (discs.length) kids.push(sub("Disc depths"));
      for (const [w, k] of discs) {
        const disc = this.window_colours(k)[1];
        kids.push(el("div", { className: "row showline inkline disc" }, el("i"), mark(PICS.window_mark), el("label", { textContent: G.window_name(w) }), swatch(disc.id + "-depth", disc.title, disc.read, disc.write, true),
          place(height(`disc-${k}-depth`, `${G.window_name(w)}: disc's depth`, () => this.disc_depth(G.windows_of(S())[k]), (v) => { G.windows_of(S())[k].depth = v; }, 0, 1))));
      }
      wrap.replaceChildren(...kids);
      this.list_folds(wrap);
    };
    out.refresh = () => {
      // built again when what is listed changes (an ink more or less, a part moving ink, an ink opened or split), not
      // when a colour only moves: an open pop-out keeps its swatch
      const sig = JSON.stringify([G.hand_prints(this.S).map((p) => [p.hand, p.kind, p.hex, this.S["ha_" + p.hand][p.own] == null]), G.dial_inks(this.S).map((ink) => ink.parts.map((p) => [p.kind, p.i, p.sectors, this.part_own(p) == null])),
        G.windows_of(this.S).map((w, k) => [w.on, w.kind, w.at, w.at_deg, w.neighbours, w.look, w.ampm_form, G.disc_of(this.S, k) ? 1 : 0])]);
      if (wrap.dataset.list !== sig) { wrap.dataset.list = sig; build(); }
      for (const r of rows) r.refresh(this.S);

    };
  },

  /** the LINK pill on the line between two parts of one ink (the windows' Width · Height fitting, #358): LINKED, filled, the
   *  part below shares the ink's height; pressed, LINK, hollow, it gets its own (toggle null: always linked, not pressable) */
  ink_link(above, name, linked, toggle, rows, id) {
    const link = el("button", { type: "button", className: "linkpill", id, ariaLabel: `${name}: linked to the part above`, textContent: "LINK",
      title: toggle ? "Linked: the same height as the part above. Press to give this part its own" : "One height for every print on this disc" });
    link.disabled = !toggle;
    if (toggle) link.onclick = toggle;
    rows.push({ refresh: () => { const on = linked(); link.classList.toggle("on", on); link.textContent = on ? "LINKED" : "LINK"; link.setAttribute("aria-pressed", String(on)); } });      // the word follows the state, as the Width · Height pill's does
    above.append(el("span", { className: "linkline" }, link, el("i", { className: "rule" })));      // the strip at the row's foot: the pill, then the line from its end (4e-colour.css)
    above.classList.add("haslink");
  },

  /** an ink's part's own height, mm (null: its ink's) — a window's frame, a ring's stroke or the ring; with v, set it (null: linked again) */
  part_own(p, v) {
    const on = p.kind === "frame" ? G.windows_of(this.S)[p.i] : this.S.rings[p.i], key = p.kind === "frame" ? "frame_h" : p.kind === "stroke" ? "stroke_h" : "ink_h";
    if (v === undefined) return on[key] ?? null;
    on[key] = v;
  },

  /** whether an ink's part is printed with ink B — a window's frame, a ring's stroke or the ring itself; with b, set it */
  part_b(p, b) {
    const on = p.kind === "frame" ? G.windows_of(this.S)[p.i] : this.S.rings[p.i], key = p.kind === "frame" ? "frame_b" : p.kind === "stroke" ? "stroke_b" : "ink_b";
    if (b === undefined) return on[key];
    on[key] = b;
  },

  /** a part's A | B under a split ink: a pill of two words, the chosen one filled */
  ab_pill(p, n, on_b) {
    const put = (b) => { this.part_b(p, b); this.changed(); };
    const group = el("span", { className: "pillswitch ab", role: "radiogroup", ariaLabel: `${p.name}: ink A or B` });
    const a = el("button", { type: "button", id: `ink-${n}-${p.kind}-${p.i}-a`, textContent: "A", onclick: () => put(false) }), b = el("button", { type: "button", id: `ink-${n}-${p.kind}-${p.i}-b`, textContent: "B", onclick: () => put(true) });
    group.append(a, b);
    return { el: group, refresh: () => { const on = Boolean(on_b()); a.classList.toggle("on", !on); b.classList.toggle("on", on); } };
  },

  /** show mode's Hands (#545): the cap and each hand — eye, colour (the same swatch as in Colours), height in mm, the
   *  Shadows pane's numbers */
  row_show_hands(wrap, out) {
    wrap.className = "colourlist";
    out.refresh = () => this.swatch_lines(wrap, () => {
      const S = this.S, lines = [];
      const tall = (h, text) => [{ key: "height", place: "number", make: () => this.line_number(num("sh_" + h, text, 0, 3, 0.05, { scope: "global", block: true, id: `show-${h}-height` })) }];
      if (G.cap_shows(S)) lines.push({ text: "Cap", mark: PICS.cap, colours: [{ ...this.cap_colour(), id: "cap-hands", square: true }], tail: tall("cap", "Cap height") });      // squares: the hex is spelled out in Colours above (Okay: "a · square only")
      for (const h of G.hand_stack(S).slice().reverse()) {      // top down, as they stand (the Shadows pane's order, #577)
        if (!G.hand_added(S, h)) continue;
        const text = G.HAND_PLURAL[h];
        lines.push({ text, mark: PICS.hand, colours: this.hand_colours(h, text + " hand", "-hands").map((c) => ({ ...c, square: true })), tail: tall(h, text + " height"),
          eye: { title: "Show or hide this hand", read: () => this.S["ha_" + h].on, write: (on) => { this.S["ha_" + h].on = on; this.changed(); } } });
      }
      return lines;
    });
  },

  /** Bevels: which hands have one — a free pill each, filled when on (the hand lines' own toggles, gathered) */
  row_bevel_pills(wrap, out) {
    const group = el("span", { className: "pillswitch free", role: "group", ariaLabel: "Bevels" });
    const buttons = G.hand_stack(this.S).slice().reverse().map((h) => { const text = G.HAND_PLURAL[h];
      const b = el("button", { type: "button", id: `bevel-${h}`, textContent: text, onclick: () => { const H = this.S["ha_" + h]; H.bevel = !H.bevel; this.changed(); } });
      return [h, b];
    });
    group.append(...buttons.map(([, b]) => b));
    wrap.classList.add("bevels");      // its pills from the second column to the line's end, on one line
    wrap.append(el("label", { textContent: "Bevels" }), group);
    out.refresh = (S) => { for (const [h, b] of buttons) { const on = Boolean(this.S["ha_" + h].bevel); b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.hidden = !G.hand_added(S, h) || !this.S["ha_" + h].on || G.HAND_SHAPES[this.S["ha_" + h].shape] === "disc"; } };      // a disc hand has no bevel (02:11)
  },

  /** a number box alone, for a line of show mode's Colours (#521): the row's own box and − +, its name the line's */
  line_number(row) {
    const r = this.build_row(row), box = r.el.querySelector(".numbox");
    box.querySelector("input").ariaLabel = row.text;
    return { el: box, refresh: (S) => r.refresh(S) };
  },

  /** a toggle alone, for a line of show mode's Colours (#521): as Shenanigans' (#525), named in a tag */
  line_toggle(id, text, read, write) {
    const toggle = el("button", { type: "button", id, className: "toggle", role: "switch", ariaLabel: text, onclick: () => write(!read()) }, el("span", { className: "knob" }));
    toggle.dataset.tip = text;
    return { el: toggle, refresh: () => toggle.setAttribute("aria-checked", String(Boolean(read()))) };
  },

  /** Rings → Sector colours (a band with more than one sector): a swatch per sector, and all back to the ring's colour. */
  row_sectors(wrap, out) {
    wrap.className = "colourlist";
    const lines = el("div"), same = el("button", { type: "button", className: "btn", id: "sectors-same", textContent: "All as the ring", title: "Every sector in the ring’s colour again", onclick: () => this.set_value("ring", "cs", {}) });
    wrap.append(lines, el("div", { className: "row" }, el("span"), el("span", { className: "tools" }, same)));
    out.refresh = () => this.swatch_lines(lines, () => {
      const i = this.S.ui_ring, at = G.positions_of(this.S.rings[i]), out = [{ text: "Sectors", colours: this.sector_colours(i) }];
      if (at.length % 2 === 0) out.push({ text: "Alternate", colours: this.alternate_colours(i) });
      return out;
    });
  },

  /** a band with an even number of sectors: two colours that alternate round it (Okay, 15 Oct 2026, 11:13: "Segmented
   *  stuff coloring, if even; chose two color to alternate"; 11:32: "Good call on alternatings"). The first is the
   *  ring's own colour and takes sectors 1, 3, 5…; the second takes 2, 4, 6…. Kept in the keys a band already has
   *  (`c`, `cs`), so a link carries it as before. Choosing either puts the whole band in the pattern: sectors 1, 3, 5…
   *  lose a colour of their own. */
  alternate_colours(i) {
    const ring = this.S.rings[i], name = ring.name || G.kind_of(ring);
    const pattern = (R, second) => {
      const cs = { ...R.cs };
      G.positions_of(R).forEach((at, n) => { if (n % 2) cs[at] = second; else delete cs[at]; });
      R.cs = cs;
    };
    return [
      { id: `ring-${i}-alternate-1`, title: `${name} · sectors 1, 3, 5…`, alpha: true,
        read: () => (this.S.rings[i] || {}).c,
        write: (value) => { const R = this.S.rings[i], at = G.positions_of(R); R.c = value; pattern(R, G.sector_colour(R, at[1])); this.changed(true); } },
      { id: `ring-${i}-alternate-2`, title: `${name} · sectors 2, 4, 6…`, alpha: true,
        read: () => { const R = this.S.rings[i]; return R ? G.sector_colour(R, G.positions_of(R)[1]) : null; },
        write: (value) => { pattern(this.S.rings[i], value); this.changed(true); } },
    ];
  },
};
