// colour.js — colours: the pop-out (one for the whole tool, opened at a swatch's right), the colour maths (RGB, HSV,
// CMYK, hex), the colours listed in a pane (the dial's, a ring's sectors, show mode's lines).

import * as G from "./geometry.js";
import { $, KEY, clamp, drag_in, el, from_hex, has_focus, paint, to_hex } from "./ui.js";
import { num } from "./rows.js";
import { SIGNS, TOOL_ICONS, eye, icon } from "./icons.js";

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
    const list = lines(), signature = JSON.stringify(list.map((l) => [l.text, l.colours.map((c) => c.id), Boolean(l.eye), (l.tail || []).map((t) => t.key)]));
    const showing = list.some((l) => l.eye);      // show mode: each line eye · name · colour · its own extras (#521)
    if (holder.dataset.list !== signature) {
      holder.dataset.list = signature;
      holder.extras = [];
      holder.replaceChildren(...list.map((line) => {
        const pills = showing ? 0 : line.colours.filter((c) => !c.square).length;      // show mode: every colour a square, so the names keep their room beside the line's eye, toggle and number
        const group = el("span", { className: pills === 1 ? "single" : "swatches" });
        for (const c of line.colours) {
          // one colour: a pill with its hex, like a colour row. Many (a band's sectors), or one beside a pill (the cap
          // on its hand's line): squares.
          const swatch = pills === 1 && !c.square ? this.colour_pill("colour-" + c.id, c.title) : el("button", { type: "button", className: "swatch", id: "colour-" + c.id, title: c.title });
          if (c.square || showing) swatch.dataset.tip = c.title;
          swatch.onclick = () => this.pop_open({ read: c.read, write: c.write, label: () => c.title, alpha: Boolean(c.alpha) }, swatch, group);
          group.append(swatch);
        }
        const name = el("label", { textContent: line.text });
        if (!showing) return el("div", { className: "row" }, name, group);
        // show mode's line: the eye (or its empty place), the name, the colour(s), then a toggle's place and a number's
        // place, so every line's parts stand in the same columns
        const eye_place = line.eye ? el("button", { type: "button", className: "eye", title: line.eye.title, ariaLabel: line.eye.title, onclick: () => line.eye.write(!line.eye.read()) }) : el("i");      // an <i>: an empty first span would be hidden (4c-rows)
        if (line.eye) holder.extras.push({ refresh: () => { const on = Boolean(line.eye.read()); eye_place.innerHTML = eye(on); eye_place.setAttribute("aria-pressed", String(on)); } });
        const places = { toggle: el("span", { className: "place" }), number: el("span", { className: "place" }) };
        for (const t of line.tail || []) { const made = t.make(); places[t.place].append(made.el); holder.extras.push(made); }
        return el("div", { className: "row showline" }, eye_place, name, group, places.toggle, places.number);
      }));
    }
    for (const x of holder.extras || []) x.refresh(this.S);
    const all = list.flatMap((l) => l.colours);
    [...holder.querySelectorAll("button.colour, button.swatch")].forEach((swatch, k) => {
      const c = all[k].read();
      if (swatch.show) swatch.show(c); else paint(swatch, c);
    });
  },

  /** Dial → Colours: every coloured part on the plate. Rings top first, a band's sectors one by one; hands, cap, windows. */
  row_colours(wrap, out) {
    wrap.className = "colourlist";
    const one = (id, title, read, write, alpha = false) => [{ id, title, read, write, alpha }];
    out.refresh = () => this.swatch_lines(wrap, () => {
      const S = this.S, lines = [];
      if (S.ui_show) lines.push({ text: "Dial", colours: one("plate", "Dial", () => this.S.c_plate, (v) => { this.S.c_plate = v; this.changed(); }),
        tail: [{ key: "head", place: "number", make: () => ({ el: el("span", { className: "colhead", textContent: "Ink height" }), refresh: () => {} }) }] });      // the number column's name, on the Dial line (Okay, 24 Oct 2026, 20:26: "Is that column not ink height? Labelling there in black would be ok")      // show mode only: the plate's colour heads the list, and each window's disc follows it (Okay, 23 Oct 2026: "Disk behind each window and plate color")
      S.rings.forEach((ring, i) => {
        const text = ring.name || G.kind_of(ring), sectors = G.kind_of(ring) === "band" && G.positions_of(ring).length > 1;
        const line = { text, colours: sectors ? this.sector_colours(i) : one(`ring-${i}`, text, () => (this.S.rings[i] || {}).c, (v) => { this.S.rings[i].c = v; this.changed(); }, true) };
        if (S.ui_show) {      // show mode (#521; Okay, 24 Oct 2026: "Yes, as drawn"): its eye, and its own ink height in a quiet number box
          line.eye = { title: "Show or hide this ring", read: () => (this.S.rings[i] || {}).on, write: (on) => this.show_ring(i, on) };
          line.tail = [{ key: "ink", place: "number", make: () => this.line_number(num("ink_d", "Ink height", 0, 10, 1, { whole: true, block: true, id: `ring-${i}-ink`,
            get: () => { const R = this.S.rings[i]; return R ? clamp(this.S.w_ink + (R.ink_d || 0), 0, 10) : 0; },      // the height it stands at: All inks and its own step
            put: (app, v) => { const R = this.S.rings[i]; if (!R) return; R.ink_d = clamp(v, 0, 10) - this.S.w_ink; this.changed(); } })) }];
        }
        lines.push(line);
      });
      const cap = one("cap", "Cap", () => this.S.c_cap, (v) => { this.S.c_cap = v; this.changed(); });
      G.HANDS.forEach((h, k) => {
        const text = ["Hour hand", "Minute hand", "Seconds hand"][k], line = { text, colours: one("hand-" + h, text, () => this.S["ha_" + h].c, (v) => { this.S["ha_" + h].c = v; this.changed(); }) };
        if (S.ui_show) {      // show mode: its eye, its colour (the cap's as a square on the hand it sits on), its bevel, its height (#521)
          line.eye = { title: "Show or hide this hand", read: () => this.S["ha_" + h].on, write: (on) => { this.S["ha_" + h].on = on; this.changed(); } };
          if (G.cap_shows(S) && k === G.top_hand(S)) line.colours = [...line.colours, { ...cap[0], square: true }];
          line.tail = [
            { key: "bevel", place: "toggle", make: () => this.line_toggle(`hand-${h}-bevel`, "Bevel", () => this.S["ha_" + h].bevel, (on) => { this.S["ha_" + h].bevel = on; this.changed(); }) },
            { key: "height", place: "number", make: () => this.line_number(num("sh_" + h, "Height", 0, 3, 0.05, { scope: "global", block: true, id: `hand-${h}-height` })) },
          ];
        }
        lines.push(line);
      });
      if (!S.ui_show || !G.cap_shows(S) || G.top_hand(S) < 0) lines.push({ text: "Cap", colours: cap });      // in show mode the cap is a square on its hand's line (Okay: "A swatch on its hand's line")
      G.windows_of(S).forEach((w, k) => {
        if (!w.on) return;
        lines.push({ text: `Window ${k + 1}`, colours: one("window-" + k, `Window ${k + 1}`, () => G.windows_of(this.S)[k].ink, (v) => { G.windows_of(this.S)[k].ink = v; this.changed(); }) });
        if (S.ui_show) lines.push({ text: `Window ${k + 1} disc`, colours: one("disc-" + k, `Window ${k + 1} disc`, () => G.windows_of(this.S)[k].disc_c || [1, 1, 1, 1], (v) => { G.windows_of(this.S)[k].disc_c = v; this.changed(); }) });      // the disc under the hole; none of its own = white, as the window's Disc row
      });
      return lines;
    });
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
