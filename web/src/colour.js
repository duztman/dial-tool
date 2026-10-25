// colour.js — colours: the pop-out (one for the whole tool, opened at a swatch's right), the colour maths (RGB, HSV,
// CMYK, hex), the colours listed in a pane (the dial's, a ring's sectors, show mode's lines).

import * as G from "./geometry.js";
import { $, KEY, clamp, drag_in, el, from_hex, has_focus, is_day, moon_look, paint, to_hex } from "./ui.js";
import { num } from "./rows.js";
import { PICS, SIGNS, TOOL_ICONS, eye, icon } from "./icons.js";

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

export const COLOUR = {
  /** this dial's colours: every part that has one, each colour once — in the order the Colours pane lists them (rings
   *  and their sectors, hands, cap, windows), or with the page: plate, backdrop, cap, then the rest (the colour
   *  pop-out's "On this dial", in its own order). */
  dial_colours(page = true) {
    const S = this.S, rings = S.rings.flatMap((r) => [r.c, ...Object.values(r.cs || {})]), hands = G.HANDS.map((h) => S["ha_" + h].c), windows = G.windows_of(S).filter((w) => w.on).map((w) => w.ink);
    const all = page ? [S.c_plate, S.c_backdrop, S.c_cap, ...rings, ...hands, ...windows] : [...rings, ...hands, S.c_cap, ...windows];      // the pop-out's order as it was (4.38)
    const once = new Map();
    for (const c of all) if (Array.isArray(c)) { const hex = to_hex(c).toUpperCase(); if (!once.has(hex)) once.set(hex, c); }
    return [...once.values()];
  },

  build_pop() {
    const P = this.pop = { at: null, hsv: [0, 0, 0], used: "", mode: "", wide: false };
    try { this.palette = JSON.parse(localStorage.getItem(PALETTE_KEY)); } catch (e) { /* not kept */ }
    if (!Array.isArray(this.palette)) this.palette = PALETTE.slice();
    this.colour_mode = "HEX";
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
    P.palette_chips = el("span", { className: "chips", id: "pop-palette" });
    P.field = el("div", { className: "sv", title: "Across: how strong. Down: how dark." }, el("i"));
    P.hues = el("div", { className: "hue", title: "Hue" }, el("i"));
    drag_in(P.field, (x, y) => { P.hsv = [P.hsv[0], x, 1 - y]; put(hsv_rgb(P.hsv)); });
    drag_in(P.hues, (x) => { P.hsv = [x * 360, P.hsv[1], P.hsv[2]]; put(hsv_rgb(P.hsv)); });
    // how see-through: a strip from nothing to the full colour, and the same as a percentage. Rings only.
    const see_through = (a) => P.at.write(P.at.read().slice(0, 3).concat([+clamp(a, 0, 1).toFixed(2)]));
    P.alpha = el("div", { className: "alpha", title: "Opacity" }, el("i"));
    drag_in(P.alpha, (x) => see_through(x));
    P.alpha_field = el("input", { type: "text", inputMode: "numeric", id: "pop-alpha", ariaLabel: "Opacity, %", title: "Opacity, %" });
    P.alpha_field.onchange = () => { const v = parseFloat(P.alpha_field.value); if (Number.isFinite(v)) see_through(v / 100); P.alpha_field.value = `${Math.round((P.at.read()[3] ?? 1) * 100)}%`; };
    P.alpha_row = el("div", { className: "alpharow" }, P.alpha, P.alpha_field);
    P.dot = el("i", { className: "dot" });
    P.modes = el("span", { className: "segs" });
    for (const mode of ["RGB", "CMYK", "HEX"]) P.modes.append(el("button", { type: "button", textContent: mode, id: "pop-as-" + mode, onclick: () => { this.colour_mode = mode; this.pop_refresh(); } }));
    P.numbers = el("span", { className: "numbers" });
    P.copy = el("button", { type: "button", className: "btn copy", id: "pop-copy", textContent: "COPY", title: "Copy the values shown", onclick: async () => {
      try { await navigator.clipboard.writeText(this.pop_text()); P.copy.textContent = "COPIED"; } catch (e) { P.copy.textContent = "NO"; }
      setTimeout(() => { P.copy.textContent = "COPY"; }, 1200);
    } });
    P.el = el("div", { className: "colourpop night", id: "colour-pop", hidden: true },
      head,
      el("div", { className: "chiprow" }, el("span", { className: "quiet", textContent: "On this dial" }), P.used_chips),
      el("div", { className: "chiprow" }, el("span", { className: "quiet", textContent: "Palette" }), P.palette_chips),
      P.field, P.hues, P.alpha_row, el("div", { className: "asnumbers" }, P.modes, P.dot, P.numbers, P.copy));
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
    pill.show = (c) => { paint(dot, c); hex.textContent = to_hex(c).toUpperCase(); if (title) pill.ariaLabel = `${title} ${hex.textContent}`; };      // a screen reader hears whose colour it is, not the hex alone (#244, 4.47.2)
    return pill;
  },

  /** a row's colour, as the pop-out wants it: read it, write it, say whose it is ("Numerals · Colour", "Plate").
   *  It follows the scope, so with a ring's colour open, selecting another ring shows that ring's. */
  colour_of_row(row) {
    return {
      alpha: row.scope === "ring" || row.scope === "hand",      // rings (Okay, 12 Oct 2026) and hands (#163, 14 Oct 2026) can be see-through
      read: () => { const T = this.target(row.scope); return T ? (row.get ? row.get(T) : T[row.key]) || (row.or ? row.or(T) : null) : null; },      // get · put: a row standing for part of a setting (a NATO's stripe)
      write: (value) => (row.put ? row.put(this, value) : this.set_value(row.scope, row.key, value)),
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
    const r = P.el.getBoundingClientRect(), field = P.field.getBoundingClientRect().height;
    P.wide = on;
    P.el.classList.toggle("wide", on);
    $("#pop-wide").setAttribute("aria-pressed", String(on));
    if (on && !this.pop_is_sheet()) {
      P.el.style.width = `${Math.min(2 * r.width, innerWidth)}px`;
      P.field.style.height = `${field}px`;
      const rest = P.el.getBoundingClientRect().height - field;      // everything but the field, at the new width (the chips grew)
      P.field.style.height = `${Math.max(field, Math.min(2 * r.height, innerHeight) - rest)}px`;
    } else P.el.style.width = P.field.style.height = "";
    if (!P.el.hidden) this.pop_place(r.left, r.top);          // where it was, moved only as far as the window asks
  },

  /** the window changed size: a sheet is placed by the stylesheet; anything else stays inside the window. */
  pop_cover() {
    const P = this.pop;
    if (!P.at) return;
    if (this.pop_is_sheet()) { P.el.style.width = P.field.style.height = ""; }
    const r = P.el.getBoundingClientRect();
    this.pop_place(r.left, r.top);
  },

  /** the values as the line shows them, to copy: #RRGGBB · 255, 128, 0 · 0, 50, 100, 0 */
  pop_text() {
    const rgb = this.pop.at.read().slice(0, 3), mode = this.colour_mode;
    return mode === "HEX" ? to_hex(rgb).toUpperCase() : (mode === "RGB" ? rgb.map((v) => Math.round(v * 255)) : rgb_cmyk(rgb).map((v) => Math.round(v * 100))).join(", ");
  },

  /** the pop-out shows the setting it edits. */
  pop_refresh() {
    const P = this.pop;
    if (!P || !P.at) return;
    const colour = P.at.swatch.isConnected ? P.at.read() : null;
    if (!Array.isArray(colour)) return this.pop_close();      // its swatch is gone (another section, a ring deleted)
    const rgb = colour.slice(0, 3), value = to_hex(rgb).toUpperCase();
    P.title.textContent = P.at.label();
    const put = (c) => P.pick(c);
    const chip = (c) => { const b = el("button", { type: "button", title: c, ariaLabel: c, onclick: () => put(c) }); b.style.background = c; b.dataset.colour = c; return b; };
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
    for (const b of P.el.querySelectorAll(".chips button[data-colour]")) b.classList.toggle("on", b.dataset.colour === value);
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
    P.alpha_row.hidden = !P.at.alpha;
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
        const all = fields.map((x) => parseFloat(x.value) || 0);
        const next = mode === "RGB" ? all.map((v) => v / 255) : cmyk_rgb(all.map((v) => v / 100));
        P.put(next);
        this.pop_refresh();
      };
      P.numbers.replaceChildren(...(mode === "HEX" ? ["hex"] : [...mode]).map((letter, i) => {
        const f = el("input", { type: "text", inputMode: mode === "HEX" ? "text" : "numeric", ariaLabel: letter, id: "pop-" + letter, spellcheck: false, onchange: commit });
        f.dataset.i = i;
        return f;
      }));
    }
    const values = mode === "HEX" ? [value] : mode === "RGB" ? rgb.map((v) => Math.round(v * 255)) : rgb_cmyk(rgb).map((v) => Math.round(v * 100));
    for (const f of P.numbers.querySelectorAll("input")) if (!has_focus(f)) f.value = values[f.dataset.i];
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
    const list = lines(), signature = JSON.stringify(list.map((l) => [l.text, l.colours.map((c) => c.id), Boolean(l.eye), Boolean(l.sub), l.mark || "", l.note || "", (l.tail || []).map((t) => t.key)]));
    const showing = list.some((l) => l.eye);      // show mode: each line eye · name · colour · its own extras (#521)
    if (holder.dataset.list !== signature) {
      holder.dataset.list = signature;
      holder.extras = [];
      holder.replaceChildren(...list.map((line) => {
        if (line.sub) return el("div", { className: "row showsub" }, el("span", { className: "colhead", textContent: line.text }));      // a group's name, in small capitals: RINGS · HANDS · WINDOWS (#545)
        // one colour: a pill with its hex, like a colour row (show mode too: "swatches, alone spelled out", #546). Many (a
        // band's sectors), or one marked square (the cap beside its hand, a Hands line): squares.
        const pills = line.colours.filter((c) => !c.square).length;
        const group = el("span", { className: pills === 1 && line.colours.length === 1 ? "single" : "swatches" });
        for (const c of line.colours) {
          const swatch = pills === 1 && line.colours.length === 1 ? this.colour_pill("colour-" + c.id, c.title) : el("button", { type: "button", className: "swatch", id: "colour-" + c.id, title: c.title });
          if (c.square || showing) swatch.dataset.tip = c.title;
          swatch.onclick = () => this.pop_open({ read: c.read, write: c.write, label: () => c.title, alpha: Boolean(c.alpha) }, swatch, group);
          group.append(swatch);
        }
        if (line.note) group.append(el("span", { className: "note", textContent: line.note }));      // what the squares are, in grey: "12 sectors", "hand · cap"
        const name = el("label", { textContent: line.text });
        if (!showing) return el("div", { className: "row" }, name, group);
        // show mode's line (#546): the eye (or its empty place), the part's kind mark, the name, the colour(s) on the one
        // swatch column every line of the tab shares (as main's ring list), then the number's place
        const eye_place = line.eye ? el("button", { type: "button", className: "eye", title: line.eye.title, ariaLabel: line.eye.title, onclick: () => line.eye.write(!line.eye.read()) }) : el("i");      // an <i>: an empty first span would be hidden (4c-rows)
        if (line.eye) holder.extras.push({ refresh: () => { const on = Boolean(line.eye.read()); eye_place.innerHTML = eye(on); eye_place.setAttribute("aria-pressed", String(on)); } });
        const mark = el("span", { className: "mark" });
        if (line.mark) mark.innerHTML = line.mark;
        const number = el("span", { className: "place" });
        for (const t of line.tail || []) { const made = t.make(); number.append(made.el); holder.extras.push(made); }
        return el("div", { className: "row showline" + (line.tail ? "" : " bare") }, eye_place, mark, name, group, number);      // bare: colours only (Colours), the swatches may run on into the number's room
      }));
    }
    for (const x of holder.extras || []) x.refresh(this.S);
    const all = list.flatMap((l) => l.colours);
    [...holder.querySelectorAll("button.colour, button.swatch")].forEach((swatch, k) => {
      const c = all[k].read();
      if (swatch.show) swatch.show(c); else paint(swatch, c);
    });
  },

  /** Dial → Colours: every coloured part on the plate. Rings top first, a band's sectors one by one; hands, cap, windows.
   *  In show mode (#545) the same parts by what they are — RINGS · HANDS · WINDOWS — each line its eye, its name and every
   *  colour it has; their inks and heights are in the Inks and Hands panes, whose swatches are these same colours. */
  row_colours(wrap, out) {
    wrap.className = "colourlist";
    const one = (id, title, read, write, alpha = false) => [{ id, title, read, write, alpha }];
    out.refresh = () => this.swatch_lines(wrap, () => {
      const S = this.S, lines = [], show = S.ui_show;
      if (show) lines.push({ text: "Dial", colours: one("plate", "Dial", () => this.S.c_plate, (v) => { this.S.c_plate = v; this.changed(); }) });
      if (show) lines.push({ sub: true, text: "Rings", colours: [] });
      S.rings.forEach((ring, i) => {
        const line = { text: ring.name || G.kind_of(ring), colours: this.ring_colours(i) };
        if (show) {
          line.eye = { title: "Show or hide this ring", read: () => (this.S.rings[i] || {}).on, write: (on) => this.show_ring(i, on) };
          line.mark = PICS.kind(ring.kind);      // the ring list's kind mark
          if (line.colours.length > 1) line.note = `${line.colours.length} sectors`;
        }
        lines.push(line);
      });
      const cap = this.cap_colour();
      if (show) lines.push({ sub: true, text: "Hands", colours: [] });
      G.HANDS.forEach((h, k) => {
        const text = ["Hour hand", "Minute hand", "Seconds hand"][k], line = { text, colours: [this.hand_colour(h, text)] };
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
  hand_colour(h, text) { return { id: "hand-" + h, title: text, read: () => this.S["ha_" + h].c, write: (v) => { this.S["ha_" + h].c = v; this.changed(); } }; },
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
    const sub = (text) => el("div", { className: "row showsub" }, el("span", { className: "colhead", textContent: text }));
    const height = (id, text, get, put, lo = 0, hi = G.INK_MOST) => { const made = this.line_number(num(id, text, lo, hi, 0.01, { block: true, id, get, put: (app, v) => { put(clamp(v, lo, hi)); this.changed(); } })); rows.push(made); return made.el; };
    // a colour: one alone is a pill with its hex spelled out; several are squares (#546: "swatches, alone spelled out")
    const swatch = (id, title, read, write, pill = false) => {
      const b = pill ? this.colour_pill("colour-" + id, title) : el("button", { type: "button", className: "swatch", id: "colour-" + id, title });
      b.dataset.tip = title;
      b.onclick = () => this.pop_open({ read, write, label: () => title }, b, b.parentElement);
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
      inks.forEach((ink, n) => {
        const hex = ink.hex, open = this.ink_open.has(hex), one = G.ink_of(S(), hex);
        const now = () => G.dial_inks(S())[n] || ink;      // the ink at this place now: its colour moves while a pop-out drags it
        // the ink's swatch recolours every part of it, and its heights go with it to the new colour
        const write = (v) => {
          const from = now(), was = from.hex, to = G.ink_hex(v);
          for (const p of from.parts) {
            if (p.kind === "frame") { G.windows_of(S())[p.i].ink = v; continue; }
            const R = S().rings[p.i];
            if (Array.isArray(R.c) && G.ink_hex(R.c) === was) R.c = v;
            for (const at of Object.keys(R.cs || {})) if (Array.isArray(R.cs[at]) && G.ink_hex(R.cs[at]) === was) R.cs = { ...R.cs, [at]: v };
          }
          const keep = S().w_inks || {};
          if (was !== to && keep[was] && !keep[to]) { keep[to] = keep[was]; delete keep[was]; }
          this.changed(true);
        };
        const chev = el("button", { type: "button", className: "eye chev" + (open ? " open" : ""), title: open ? "Close this ink" : "Open this ink: its parts", ariaLabel: open ? "Close this ink" : "Open this ink", ariaExpanded: String(open),
          onclick: () => { if (this.ink_open.has(hex)) this.ink_open.delete(hex); else this.ink_open.add(hex); wrap.dataset.list = ""; this.changed(); } });
        chev.innerHTML = icon(SIGNS.down);
        const count = ink.parts.length === 1 ? "1 part" : `${ink.parts.length} parts`;
        const label = el("label", { className: "inkname", textContent: count });      // the line named by its part count, the ink's own colour in the swatch column (Okay: "Its part count")
        // an ink of two parts has nothing to choose: split, its first part is A and its second B (Okay, 25 Oct 2026, 21:23:
        // "Switch stays, but on two item lists leave them text only")
        const pair = (parts) => parts.length === 2;
        const set_b = (p, b) => { if (p.kind === "frame") G.windows_of(S())[p.i].frame_b = b; else S().rings[p.i].ink_b = b; };
        const toggle = open ? this.line_toggle(`ink-${n}-two`, "Two inks", () => G.ink_of(S(), now().hex).two, (on) => { entry(now().hex).two = on; const parts = now().parts; if (on && pair(parts)) parts.forEach((p, m) => set_b(p, m === 1)); this.changed(); }) : null;
        if (toggle) rows.push(toggle);
        // closed: its height on its line. Open: Two inks at the line's right end, its word stuck to it, and each part
        // under it with its ink's height — split, the A | B pill before the part's name and the box its letter's height
        // (Okay, 25 Oct 2026, 21:18, his marks: "a part on its letter's line"; "Switch in the right place label stuck to it
        // all the way to the right")
        const number = open ? null : height(`ink-${n}-h`, `${hex} height`, () => G.ink_of(S(), now().hex).h + all(), (v) => { entry(now().hex).h = +(v - all()).toFixed(3); });
        const pill = swatch(`ink-${n}`, `${hex}: every part of this ink`, () => now().colour, write, true);
        const end = open ? el("span", { className: "place two" }, el("label", { textContent: "Two inks" }), toggle.el) : place(number);
        kids.push(el("div", { className: "row showline inkline" + (open ? " open" : "") }, chev, mark(), label, pill, end));      // open: Two inks in the number's place, its word against it
        if (!open) return;
        ink.parts.forEach((p, m) => {
          const on_b = () => (p.kind === "frame" ? G.windows_of(S())[p.i].frame_b : S().rings[p.i].ink_b);
          const letter = () => (G.ink_of(S(), now().hex).two && on_b() ? "b" : "h");      // A's height is the ink's own
          const name = p.name + (p.sectors > 1 ? ` · ${p.sectors} sectors` : p.sectors === 1 ? " · 1 sector" : "");
          const pill = one.two && !pair(ink.parts) ? this.ab_pill(p, n, on_b) : null;
          if (pill) rows.push(pill);
          const said = one.two && pair(ink.parts) ? el("span", { className: "letter", textContent: on_b() ? "B" : "A" }) : el("i");      // two parts: the letter alone, as text, in the eye's column
          const box = height(`ink-${n}-part-${m}`, `${name}: its ink's height`, () => G.ink_of(S(), now().hex)[letter()] + all(), (v) => { entry(now().hex)[letter()] = +(v - all()).toFixed(3); });
          const kind = p.kind === "frame" ? PICS.window_mark : PICS.kind(S().rings[p.i].kind);
          kids.push(el("div", { className: "row showline inkpart" }, said, mark(kind), el("label", { textContent: name }), pill ? pill.el : el("i"), place(box)));
        });
      });
      // what is printed on the discs, one height a window
      const wins = G.windows_of(S()).map((w, k) => [w, k]).filter(([w]) => w.on);
      if (wins.length) kids.push(sub("On the discs"));
      for (const [w, k] of wins) {
        const prints = this.window_prints(k);
        kids.push(el("div", { className: "row showline inkline disc" }, el("i"), mark(PICS.window_mark), el("label", { textContent: G.window_name(w) }), colours(prints.map((c) => ({ ...c, id: c.id + "-ink" }))),
          place(height(`disc-${k}-print`, `${G.window_name(w)}: prints' height`, () => (G.windows_of(S())[k].print_h ?? G.INK_MM) + all(), (v) => { G.windows_of(S())[k].print_h = +(v - all()).toFixed(3); }))));
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
    };
    out.refresh = () => {
      // built again when what is listed changes (an ink more or less, a part moving ink, an ink opened or split), not
      // when a colour only moves: an open pop-out keeps its swatch
      const sig = JSON.stringify([G.dial_inks(this.S).map((ink) => [ink.parts.map((p) => [p.kind, p.i, p.sectors, p.kind === "frame" ? Boolean(G.windows_of(this.S)[p.i].frame_b) : Boolean(this.S.rings[p.i].ink_b)]), this.ink_open.has(ink.hex), G.ink_of(this.S, ink.hex).two]),
        G.windows_of(this.S).map((w, k) => [w.on, w.kind, w.at, w.at_deg, w.neighbours, w.look, w.ampm_form, G.disc_of(this.S, k) ? 1 : 0])]);
      if (wrap.dataset.list !== sig) { wrap.dataset.list = sig; build(); }
      for (const r of rows) r.refresh(this.S);

    };
  },

  /** a part's A | B under a split ink: a pill of two words, the chosen one filled */
  ab_pill(p, n, on_b) {
    const put = (b) => { if (p.kind === "frame") G.windows_of(this.S)[p.i].frame_b = b; else this.S.rings[p.i].ink_b = b; this.changed(); };
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
      if (G.cap_shows(S)) lines.push({ text: "Cap", colours: [{ ...this.cap_colour(), id: "cap-hands", square: true }], tail: tall("cap", "Cap height") });      // squares: the hex is spelled out in Colours above (Okay: "a · square only")
      for (const [h, text] of [["second", "Seconds"], ["minute", "Minutes"], ["hour", "Hours"]]) {      // top down, as they stand (the Shadows pane's order)
        lines.push({ text, colours: [{ ...this.hand_colour(h, text + " hand"), id: `hand-${h}-hands`, square: true }], tail: tall(h, text + " height"),
          eye: { title: "Show or hide this hand", read: () => this.S["ha_" + h].on, write: (on) => { this.S["ha_" + h].on = on; this.changed(); } } });
      }
      return lines;
    });
  },

  /** Bevels: which hands have one — a free pill each, filled when on (the hand lines' own toggles, gathered) */
  row_bevel_pills(wrap, out) {
    const group = el("span", { className: "pillswitch free", role: "group", ariaLabel: "Bevels" });
    const buttons = [["second", "Seconds"], ["minute", "Minutes"], ["hour", "Hours"]].map(([h, text]) => {
      const b = el("button", { type: "button", id: `bevel-${h}`, textContent: text, onclick: () => { const H = this.S["ha_" + h]; H.bevel = !H.bevel; this.changed(); } });
      return [h, b];
    });
    group.append(...buttons.map(([, b]) => b));
    wrap.classList.add("bevels");      // its pills from the second column to the line's end, on one line
    wrap.append(el("label", { textContent: "Bevels" }), group);
    out.refresh = (S) => { for (const [h, b] of buttons) { const on = Boolean(this.S["ha_" + h].bevel); b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.hidden = !this.S["ha_" + h].on; } };
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
