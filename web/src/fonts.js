// fonts.js — the font box on a ring and the font sheet: the tool's own fonts, yours, this computer's; axes and
// features; loading a font when it is used (R35), remembering the ones added.

import * as G from "./geometry.js";
import { FONT_LIST, FONT_SITE } from "./font_list.js";
import { $, DEFAULT_ON, FEATURE_NAMES, KEY, PLACE, clamp, el, filled, fmt, parse_number } from "./ui.js";

import { NONE_SIGN, SIGNS, TOOL_ICONS, eye, icon } from "./icons.js";
import { LANG_NAMES, lang_short, num } from "./rows.js";

// a language in the list, by its name; on its button, by two letters ("zh-Hans" → ZH; the font's own choice → "Lang.")
export const FONT_DARK_KEY = KEY("font-dark");      // the font sheet's ground, light or dark, kept for the session (#276)

// the font sheet's legend: a sticker of each kind, and what it says about a family. The stickers' words are short, so a
// family's stickers stand on one line; bold and italic keep their words (Okay, 13 Oct 2026: "condense all sticker text but
// bold and italic. weight gets w. and range"). The legend spells each one out.
// Each meaning is a sentence; at its end, light, in square brackets, the OpenType abbreviation of what the sticker reads (Okay, 14 Oct 2026).
// a meaning's last line is never one word alone: its last word stays with the bracket after it, or with the word before it (Okay, 14 Oct 2026: "no orphans")
export function no_orphan(says, code) {
  const words = says.split(" "), keep = code ? 1 : 2, tail = words.splice(-keep);
  const end = el("span", { className: "together" }, tail.join(" "), ...(code ? [" ", el("small", { textContent: `[${code}]` })] : []));
  return [words.length ? words.join(" ") + " " : "", end];
}

export const STICKER_LEGEND = [["w. 100–900", "weight", "Any weight in the range.", "wght"], ["bold", "weight", "Has a bold.", ""],
  ["italic", "italic", "Has an italic, axis or style.", "ital, slnt"], ["wd", "width", "Any width, narrow to wide.", "wdth"],
  ["opt", "optical", "Shapes made for small and large sizes.", "opsz"], ["tab", "figure", "Tabular figures, all one width.", "tnum"],
  ["old", "figure", "Oldstyle figures, which rise and fall.", "onum"], ["zero", "figure", "A slashed zero.", "zero"],
  ["frac", "figure", "Fractions: ½ made from 1/2.", "frac"], ["2 ss", "sets", "Stylistic sets: other shapes.", "ss01–ss20"],
  ["5 cv", "sets", "Single letters redrawn.", "cv01–cv99"], ["3 st", "styles", "Separate styles: Regular, Bold…", ""]];      // short, so the window rarely scrolls (Okay, 14 Oct 2026)

// the OpenType switches that change numerals, in a short word each, for the stickers
export const FIGURE_WORDS = [["tnum", "tab"], ["onum", "old"], ["zero", "zero"], ["frac", "frac"]];

// a variable font's axes, in words, for the font sheet's stickers
// the font sheet's filters (R35): what each pill shows. Sans, serif, condensed and non-Latin are said by the font list
// (`kinds`, web/fonts.mjs); variable is a file with axes; mono / tabular a font drawn monospaced or with tabular figures
export const FONT_FILTERS = [["sans", "Sans"], ["serif", "Serif"], ["variable", "Variable"], ["condensed", "Condensed"], ["mono", "Mono"], ["nonlatin", "Non-Latin"]];

export const font_is = (fonts, kind) => fonts.some((f) => kind === "variable" ? Object.keys(f.axes || {}).length > 0
  : kind === "mono" ? (f.kinds || []).includes("mono") || (f.features || []).includes("tnum")
  : (f.kinds || []).includes(kind));

export const FONT_SHEET_KEY = KEY("font-sheet");      // the sheet's tab, search and filters (R35)

export const font_sheet_read = () => { try { return JSON.parse(localStorage.getItem(FONT_SHEET_KEY) || "{}") || {}; } catch (e) { return {}; } };

export const NAME_LEAST = 0.7;                            // in the font sheet a family's name may shrink to this share of its size to fit its column

export const AXIS_WORDS = { wdth: "wd", opsz: "opt", GRAD: "grad", XHGT: "xh", SOFT: "soft", MONO: "mono", CASL: "cas" };

// font files added by hand, kept by this browser (#56: "font files added by hand are forgotten when the page closes"):
// their bytes in IndexedDB (localStorage holds too little), read back when the page opens. A private window or a full
// store keeps nothing, and the log says so once (R17)
export const FONT_STORE = { db: PLACE, store: "font-files" };

export const font_store = () => new Promise((done, fail) => {
  const ask = indexedDB.open(FONT_STORE.db, 1);
  ask.onupgradeneeded = () => ask.result.createObjectStore(FONT_STORE.store);
  ask.onsuccess = () => done(ask.result); ask.onerror = () => fail(ask.error);
});

export const font_files_put = async (name, bytes) => { const db = await font_store(); await new Promise((done, fail) => { const tx = db.transaction(FONT_STORE.store, "readwrite"); tx.objectStore(FONT_STORE.store).put(bytes, name); tx.oncomplete = done; tx.onerror = () => fail(tx.error); }); db.close(); };

export const font_files_all = async () => { const db = await font_store(); const out = await new Promise((done, fail) => { const tx = db.transaction(FONT_STORE.store), st = tx.objectStore(FONT_STORE.store), keys = st.getAllKeys(), vals = st.getAll(); tx.oncomplete = () => done(keys.result.map((k, i) => ({ name: k, bytes: vals.result[i] }))); tx.onerror = () => fail(tx.error); }); db.close(); return out; };

export const FONTS = {
  /** family → its fonts, in the catalogue's order. */
  families() {
    const by = new Map();
    for (const f of this.catalog.values()) { if (!by.has(f.family)) by.set(f.family, []); by.get(f.family).push(f); }
    return by;
  },

  /** "1234567890" in the font itself: the outline made with the list, or drawn now, or set by the browser.
   *  what = "name": the family's name in its own face instead, likewise. */
  sample(f, what = "sample", fits = what === "name") {
    const box = el("span", { className: what === "name" ? "face" : "sample" });
    // preview: in a font box the numerals are followed by letters, A to g (Okay, 13 Oct 2026)
    // …and an ellipsis after the g (Okay, 13 Oct 2026): the font's own, or three full stops where it has none (Routed Gothic)
    const t = G.has_font(f.ps) ? { ...G.RING_BASE, ps: f.ps, axes: f.start || {}, features: {}, tracking: 0, lang: 0 } : null;
    const text = what === "name" ? f.family : what === "preview" ? "1234567890 Abcdefg" + (t && G.has_chars("…", t) ? "…" : "...") : "1234567890", high = what === "name" ? 16 : what === "preview" ? 20 : 26;      // the sheet's numerals larger (Okay, 24 Oct 2026, 23:32: "ENLARGE NUMS"; 20 before)
    let s = what === "preview" ? (t ? null : f.sample) : f[what];
    if (!s && t) {
      s = { d: G.text_path(text, t, 1000).svg(0, true), w: Math.round(G.advance(text, t, 1000)) };
    }
    // the law of the name column: a name wider than its column is drawn smaller to fit, down to NAME_LEAST of its size,
    // then cut. Numerals keep their size: what doesn't fit is cut at their column's right edge (Okay, 13 Oct 2026).
    // The picture is taller than the em (from 1000 over the baseline to 250 under it), so tall figures are never cut above.
    const wide = s ? Math.ceil(s.w / 1000 * high) : 0, tall = Math.round(high * 1.25);
    if (s && s.d) box.innerHTML = `<svg viewBox="0 -1000 ${s.w} 1250" width="${wide}" height="${tall}"${fits ? ` style="min-width:${Math.ceil(wide * NAME_LEAST)}px"` : ""} aria-hidden="true"><path d="${s.d}" fill="currentColor"/></svg>`;
    else { box.textContent = text; box.style.fontFamily = `"${f.family}"`; }       // an installed font: the browser can show it
    return box;
  },

  /** what a family has, for the font sheet's last column, as small stickers in the pixel font (Okay, 13 Oct 2026):
   *  → [[word, kind]…]. The kind gives the sticker its colour (the legend under the list says which is which).
   *  Short words, spelled out in the legend: "w. 100–900", "tab", "2 ss". */
  family_says(fonts) {
    const styles = fonts.map((f) => f.style || ""), first = fonts[0];
    // a font of the tool's own list says its axes there, [least, most] each; a loaded one is asked
    const ranges = first.axes || (G.has_font(first.ps) ? Object.fromEntries(Object.entries(G.font_axes(G.font_of({ ps: first.ps, axes: {} }))).map(([tag, x]) => [tag, [x.min, x.max]])) : {});
    const axes = Object.keys(ranges);
    const said = [];
    if (axes.includes("wght")) said.push([`w. ${Math.round(ranges.wght[0])}–${Math.round(ranges.wght[1])}`, "weight"]);      // the range it can take (Okay, 13 Oct 2026)
    else if (styles.some((x) => /bold|black|heavy/i.test(x))) said.push(["bold", "weight"]);
    if (axes.includes("ital") || axes.includes("slnt") || styles.some((x) => /italic|oblique/i.test(x))) said.push(["italic", "italic"]);
    for (const tag of axes) if (!["wght", "ital", "slnt"].includes(tag)) said.push([AXIS_WORDS[tag] || tag, { wdth: "width", opsz: "optical" }[tag] || "other"]);
    // what it can do to numerals (Okay, 13 Oct 2026: "open type features related to numbers as stickers. Not just axes"),
    // then its numbered sets and variants: one colour, two stickers at most
    const tags = first.features || (G.has_font(first.ps) ? G.font_features(G.font_of({ ps: first.ps, axes: {} })).map(([tag]) => tag) : []);
    for (const [tag, word] of FIGURE_WORDS) if (tags.includes(tag)) said.push([word, "figure"]);
    const sets = tags.filter((tag) => /^ss\d\d$/.test(tag)).length, variants = tags.filter((tag) => /^cv\d\d$/.test(tag)).length;
    if (sets) said.push([`${sets} ss`, "sets"]);
    if (variants) said.push([`${variants} cv`, "sets"]);
    if (fonts.length > 1) said.push([`${fonts.length} st`, "styles"]);
    return said;
  },

  /** whose font the font sheet and the style buttons set: the selected ring's, or the selected window's. */
  font_holder() {
    if (this.font_scope === "numeral") { const R = this.ring(), k = String(this.nudge_at || 0); return (R.nudge[k] ||= {}); }      // one numeral's own font (#513), kept with its nudges
    return this.font_scope === "window" ? this.window() : this.ring();
  },

  /** …and the type that holder draws with: a window without a font of its own draws with the top numerals ring's. */
  font_shown() { const T = this.font_holder(); return this.font_scope === "window" ? G.window_type(this.S, T) : T; },

  /** a font, in a white box of three lines with hairlines between (Okay, 13 Oct 2026): its numerals · its name, with
   *  the language (a ring's only: two letters, a list under them) and Change… at the right · its styles as buttons
   *  · its tracking (a ring's only).
   *  The numerals and Change… both open the font sheet. */
  row_font(wrap, out) {
    wrap.className = "font";
    const scope = out.row.scope, own = scope === "window";       // a window's font row: the same, with a way back to the numerals' font
    const pre = own ? "window-" : "";
    const choose = (act) => { this.font_scope = scope; return act(); };
    const open = () => choose(() => this.open_picker());
    const current = el("button", { type: "button", className: "fontrow current", id: pre + "font-current", title: "Choose a font", onclick: open });
    const name = el("span", { className: "name", id: pre + "font-name" });
    // a window has tracking and a language of its own too (Okay, 13 Oct 2026); unset, they are the numerals'
    const numerals = () => G.window_type(this.S, {});
    const lang = own ? this.lang_box("window", "window-", () => numerals().lang) : this.lang_box();
    // the text's colour beside the font's name, a full pill with its hex (Okay, 19 Oct 2026, #408: "color here gets full swatch with hex"):
    // a window's text colour (unset: its frame's) · a numerals ring's colour
    const crow = own ? { key: "text_c", scope: "window", text: "Text", or: (T) => T.ink } : { key: "c", scope: "ring", text: "Colour" };
    const swatch = this.colour_pill(pre + "font-c", "The text’s colour");      // a full pill, swatch and hex, as the colour rows have (#408)
    swatch.onclick = () => this.pop_open(this.colour_of_row(crow), swatch);
    const tracking = this.build_row(own ? { ...num("tracking", "Tracking", -200, 800, 5), scope: "window", or: () => numerals().tracking } : { ...num("tracking", "Tracking", -200, 800, 5), scope: "ring" });      // the box's last line
    // the language stands at the right inside the preview's cell, on the cell's grey, knocking the preview out where it reaches (#273, 4.51; Okay's notes, p. 12)
    // Okay's drawing of the box (font-selector_171026, 18 Oct 2026): a grey head holding the preview on white and, under
    // it, the name — grey, bold, running to the colour — and EN at the line's right end; no Change…: the preview and the
    // name open the font sheet.
    const shown_cell = el("div", { className: "currentwrap" }, current);
    const named = el("div", { className: "fontname", title: "Choose a font", onclick: (e) => { if (!e.target.closest(".colour, .langs, button")) open(); } }, el("span", { className: "namecol" }, name, swatch), ...(lang ? [lang.el] : []));      // the name runs to the colour; the colour ends a gap before EN (#408)
    const styles = el("div", { className: "styles", role: "tablist", ariaLabel: "Style" });      // tabs hanging from the name's line (#275, 4.51)
    const state = el("div", { className: "quiet note", id: pre + "font-note" });
    const back = el("button", { type: "button", className: "btn", id: "window-font-back", innerHTML: icon(SIGNS.copy) + "<span>Same font as <i>Numerals</i></span>", title: "Use the top numerals ring’s font again", hidden: true,      // "Copy style of" until 4.52.1: it never copied, it gives the window the ring's font again (Okay, 18 Oct 2026: "Same font as hours, yes")
      onclick: () => { const w = this.window(); w.family = ""; w.ps = ""; w.axes = {}; w.features = null; w.tracking = null; w.lang = null; this.changed(true); } });
    // every font box has all of it (Okay, 13 Oct 2026): numerals and letters · name, colour · styles, language · size ·
    // tracking · the variable axes · the OpenType features. The last can be put away.
    // size · tracking · the variable axes, one under the other without a heading (Okay's drawing, 13 Oct 2026)
    const size = this.build_row(own ? { ...num("size", "Size %", 20, 100, 1), scope: "window" } : { ...num("size", "Size", 0.3, 8, 0.05, { top: (S) => S.dial_d }), scope: "ring" });      // a window's text is sized in % of its height
    const axes = this.axes_part(pre, own);
    const features = this.box_part("font/features", "OpenType features", this.features_part(pre, own), true);
    wrap.append(el("div", { className: "fontbox" }, shown_cell, named, styles, size.el, tracking.el, axes.el, features.el), ...(own ? [back] : []), state);
    let shown = null;
    out.refresh = (T) => {
      const R = own ? G.window_type(this.S, T) : T;
      back.hidden = !(own && (T.ps || T.tracking != null || T.lang != null || T.features != null || Object.keys(T.axes || {}).length));
      if (own) back.querySelector("i").textContent = numerals().name || "Numerals";      // the top numerals ring, by its name as it is written (Okay, 14 Oct 2026; "Same font as", 4.52.2)
      if (lang) lang.refresh(T);
      size.refresh(T);
      tracking.refresh(T);
      axes.el.hidden = !axes.refresh(R, T);
      features.refresh(R, T);
      swatch.show(T[crow.key] || (crow.or ? crow.or(T) : [0, 0, 0, 1]));
      const mine = this.families().get(R.family) || [], f = this.catalog.get(R.ps) || mine[0];
      const key = R.ps + "/" + G.has_font(R.ps) + "/" + Boolean(T.ps);
      if (key !== shown) {
        shown = key;
        current.replaceChildren(f ? this.sample(f, "preview") : el("span", { className: "sample quiet", textContent: "not loaded" }));
        name.textContent = R.family;                // a window without a font of its own shows the numerals' font, plainly (Okay, 13 Oct 2026: no "· as the numerals" after it)
      }
      // the family's styles as tabs of the name's box, hanging from its line (#275, 4.51; Okay, 16 Oct 2026: "it is a part of
      // the font so it needs to look like tabs of the upper box which is the font name"). A variable font with a weight
      // axis and no named styles gets Regular and Bold here, which set the axis (what a font may offer here is limited
      // to bold and italic; its other axes stay down with the sliders)
      const tab = (text, on, act, id) => { const b = el("button", { type: "button", className: "tab hang", textContent: text, role: "tab", id, onclick: act }); b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); return b; };
      let tabs = mine.length > 1 ? mine.map((x, i) => tab(x.style || x.ps, x.ps === R.ps, () => choose(() => this.use_font(x)), `${pre}font-style-${i}`)) : [];
      if (!tabs.length && G.has_font(R.ps)) {
        const a = G.font_axes(G.font_of(R)).wght;
        if (a && a.max >= 600) {
          const side = this.font_side(own), H = this.target(side.scope), now = (H.axes || {}).wght ?? side.base_axis(H, "wght", a), bold = Math.min(700, a.max);
          const put = (v) => { const all = { ...(this.target(side.scope).axes || {}) }; if (Math.abs(v - side.base_axis(this.target(side.scope), "wght", a)) < 1e-6) delete all.wght; else all.wght = v; this.set_value(side.scope, "axes", all); };
          tabs = [tab("Regular", now < 600, () => put(a.default), `${pre}font-style-0`), tab("Bold", now >= 600, () => put(bold), `${pre}font-style-1`)];
        }
      }
      styles.hidden = tabs.length < 2;
      styles.replaceChildren(...tabs);
      const missing = G.has_font(R.ps) ? "" : this.catalog.has(R.ps) ? "Loading… "
        : `${R.family} isn’t loaded yet, so ${G.font_list()[0].family} stands in. Press its name to choose another or to add it. `;
      state.textContent = missing + (this.font_note || "");
      if (this.picker && this.picker.open) this.fill_picker();
    };
  },

  /** the language the numerals are set in (a font may draw a figure differently for one): a small button saying its
   *  two letters; a press opens the list (Okay, 13 Oct 2026). The ring keeps the place in G.LANGS (R9). */
  lang_box(scope = "ring", pre = "", or = null) {
    const menu = el("div", { className: "unitmenu langmenu", id: pre + "lang-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const button = el("button", { type: "button", className: "btn langbox", id: pre + "lang" });
    button.setAttribute("aria-haspopup", "menu");
    const open = (on) => { menu.hidden = !on; button.setAttribute("aria-expanded", String(on)); };
    (this.lang_opens = this.lang_opens || []).push(open);
    button.onclick = () => open(menu.hidden);
    const items = G.LANGS.map((code, i) => {
      const b = el("button", { type: "button", id: pre + "lang-" + code, onclick: () => { open(false); this.set_value(scope, "lang", i); } },
        el("span", { textContent: LANG_NAMES[code] || code }), el("span", { className: "quiet", textContent: lang_short(code) }));
      b.setAttribute("role", "menuitemradio");
      menu.append(b);
      return b;
    });
    const box = el("div", { className: "langs" }, button, menu);
    box.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); button.focus(); } };
    open(false);
    const refresh = (T) => {
      const R = { lang: T.lang ?? (or ? or(T) : 0) };
      const code = G.LANGS[R.lang] || G.LANGS[0];
      button.textContent = lang_short(code);
      button.title = "Language: " + (LANG_NAMES[code] || code);
      items.forEach((b, i) => { b.classList.toggle("on", i === (R.lang || 0)); b.setAttribute("aria-checked", String(i === (R.lang || 0))); });
    };
    return { el: box, refresh };
  },

  /** the font sheet: every font with its numerals — the tool’s own twenty-one, then yours, then (Chrome, Edge)
   *  this computer's — and the ways to add more. It lies over the panel, so the dial stays in view. */
  build_picker() {
    // Find: a field with a magnifier, no words in it (Okay, 13 Oct 2026)
    const find = el("input", { type: "search", id: "font-find", ariaLabel: "Find a font", title: "Find a font" });
    find.oninput = () => { this.font_sheet_keep(); this.fill_picker(true, false); };      // the list follows the typing; it never jumps back to the ring's font while a search is typed (found 25 Oct 2026)
    const field = el("span", { className: "find" }, find);
    field.insertAdjacentHTML("beforeend", icon(TOOL_ICONS.find));
    // the filters (R35; Okay, 24 Oct 2026: "Any of them"; 23:32, his marks: "One line, full sheet width"): six pills on
    // one line over the list, as wide as it; each pressed adds its fonts, none pressed shows every font
    const kept = font_sheet_read();
    this.font_filters = new Set(kept.filters || []);
    this.font_tab = kept.tab === 1 && "queryLocalFonts" in window ? 1 : 0;
    find.value = kept.q || "";
    const tray = el("span", { className: "findtray", role: "group", ariaLabel: "Show only" }, ...FONT_FILTERS.map(([kind, word]) => {
      const pill = el("button", { type: "button", className: "filterpill", id: "font-filter-" + kind, textContent: word });
      pill.setAttribute("aria-pressed", String(this.font_filters.has(kind)));
      pill.onclick = () => { const on = !this.font_filters.has(kind); if (on) this.font_filters.add(kind); else this.font_filters.delete(kind); pill.setAttribute("aria-pressed", String(on)); this.font_sheet_keep(); this.fill_picker(true, false); };
      return pill;
    }));
    const finder = el("span", { className: "findbox" }, field);
    this.font_tray = tray;
    // two tabs over the list (R35; Okay, 24 Oct 2026: "Two tabs over the list"): the tool's own fonts · this computer's,
    // the second only where the browser can read them (Chrome, Edge; R16 elsewhere). Installed asks the browser the
    // first time; its fonts are found by name, so the filters go while it is open
    const sheet_tab = (i, word) => { const b = el("button", { type: "button", className: "tab", id: "font-tab-" + i, textContent: word, role: "tab", onclick: () => this.font_tab_go(i) }); return b; };
    this.font_tabs = el("div", { className: "sheettabs", hidden: !("queryLocalFonts" in window) }, el("span", { className: "segs", role: "tablist", ariaLabel: "Which fonts" }, sheet_tab(0, "Dial Tool’s fonts"), sheet_tab(1, "Installed")));
    const list = el("div", { className: "fontlist", id: "font-list" });
    // the list's own scrollbar, drawn by the tool (an iPad shows its own only while the list moves): a light pill the
    // whole height, a darker one as long as the share of the list in view, where that share is (Okay, 13 Oct 2026)
    const rail = el("span", { className: "rail", ariaHidden: "true" }, el("i"));
    this.rail = rail;
    list.addEventListener("scroll", () => this.rail_place(), { passive: true });
    rail.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const thumb = rail.firstChild, r = rail.getBoundingClientRect(), t = thumb.getBoundingClientRect();
      const span = list.scrollHeight - list.clientHeight, room = r.height - t.height;
      const grab = e.target === thumb ? e.clientY - t.top : t.height / 2;
      const go = (y) => { list.scrollTop = room > 0 ? Math.min(1, Math.max(0, (y - r.top - grab) / room)) * span : 0; };
      if (e.target !== thumb) go(e.clientY);
      rail.setPointerCapture(e.pointerId);
      rail.classList.add("held");
      rail.onpointermove = (m) => go(m.clientY);
      rail.onpointerup = rail.onpointercancel = () => { rail.onpointermove = rail.onpointerup = rail.onpointercancel = null; rail.classList.remove("held"); };
    });
    // the legend: folded to one button beside the squares; open, it stands over them and pushes the list up
    const legend = el("dl", { className: "legend", id: "font-legend", hidden: true }, el("div", { className: "legendhead" }, "Variable font axes and", el("br"), "OpenType abbreviations"), ...STICKER_LEGEND.flatMap(([word, kind, says, code]) => [el("dt", {}, el("span", { className: "sticker " + kind, textContent: word })), el("dd", {}, ...no_orphan(says, code))]));
    const legend_button = el("button", { type: "button", className: "pickt legendbutton", id: "font-legend-open", title: "What the stickers mean" });
    legend_button.innerHTML = icon(SIGNS.up) + "<span>Legend<br><small>(OpenType abbr.)</small></span>";      // a second line like its brothers (Okay, 14 Oct 2026)
    legend_button.setAttribute("aria-expanded", "false");
    this.legend_fit = () => {      // the window grows upwards as far as the font list's top, then scrolls (Okay, 14 Oct 2026)
      if (legend.hidden) return;
      const room = legend.parentElement.getBoundingClientRect().top - list.getBoundingClientRect().top - parseFloat(getComputedStyle(legend).marginBottom || 0);
      legend.style.maxHeight = Math.max(0, Math.floor(room - parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit")))) + "px";
    };
    legend_button.onclick = () => {
      legend.hidden = !legend.hidden;
      this.legend_fit();
      legend_button.setAttribute("aria-expanded", String(!legend.hidden));
      requestAnimationFrame(() => this.rail_place());
    };
    const paste = el("input", { type: "text", id: "font-link", placeholder: "Google Fonts link or family name, or a link to a font file" });
    const add = () => { if (paste.value.trim()) this.add_from_text(paste.value).then((ok) => { if (ok) paste.value = ""; }); };
    paste.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } };
    paste.hidden = true;
    const file = el("input", { type: "file", accept: ".ttf,.otf,.ttc,.otc", multiple: true, hidden: true, id: "font-file" });
    file.onchange = async () => { await this.add_font_files([...file.files]); file.value = ""; };
    // no Done button (Okay, 13 Oct 2026): a press beside the sheet, or Escape, puts it away. Adding fonts: a field
    // for a link or a name, and three square buttons.
    const square = (id, word, title, d, act, o = {}) => { const b = el("button", { type: "button", className: "pickt", id, title, onclick: act, ...o }); const [what, takes] = word.split(" ("); b.innerHTML = icon(d) + `<span>${what}${takes ? `<br><small>(${takes}</small>` : ""}</span>`; return b; };      // the second line, light: what it takes (Okay, 13 Oct 2026)
    // light or dark (#276, 4.51; Okay's notes, p. 13): a pill at the top middle shows the previews on white or on a dark
    // ground, kept for this session; the font boxes follow it, in the inverse of their present ground, never pitch black
    // (Okay, 16 Oct 2026: "inverse of existing block can't be black")
    const ground = el("div", { className: "pillswitch", role: "radiogroup", ariaLabel: "The previews' ground" });
    const grounds = ["Light", "Dark"].map((w, i) => { const b = el("button", { type: "button", id: "font-ground-" + w.toLowerCase(), textContent: w, role: "radio", onclick: () => this.font_ground(i === 1) }); ground.append(b); return b; });
    this.font_ground = (dark) => {
      this.font_dark = dark;
      try { sessionStorage.setItem(FONT_DARK_KEY, dark ? "1" : ""); } catch (e) { /* not kept */ }
      $("#app").classList.toggle("font-dark", dark);
      grounds.forEach((b, i) => { b.classList.toggle("on", (i === 1) === dark); b.setAttribute("aria-checked", String((i === 1) === dark)); });
    };
    this.picker = el("dialog", { className: "picker", id: "font-picker" },
      el("header", {}, el("h2", { textContent: "Fonts" }), ground, finder, this.font_tabs, this.font_tray),      // the search at the sheet's top right, the filters' box hanging from it down to the list; the tabs at the left on the list's line
      el("div", { className: "listbox" }, el("div", { className: "listwrap" }, list, rail)),
      el("div", { className: "adding" },
        paste,
        el("div", { className: "quiet note", id: "picker-note" }),
        legend,
        el("div", { className: "squares" },
          // the ways to add a font, in the first two of the sheet's three columns, sharing them equally: Installed first when
          // the browser can read this computer's fonts (Chrome, Edge), then a link, then a file (Okay, 14 Oct 2026)
          el("div", { className: "adds" },
            square("font-add", "Add font link (gfonts, url)", "A font by its Google Fonts link or name, or by a link to a font file", SIGNS.plus, () => { if (paste.hidden) { paste.hidden = false; paste.focus(); } else if (paste.value.trim()) add(); else paste.focus(); }),      // the field for the link is out of sight until this is pressed (Okay, 13 Oct 2026)
            square("font-file-open", "Add font file (woff, ttf, otf)", "A font file from this computer: .ttf · .otf · .woff", SIGNS.sheet, () => file.click())),
          file, legend_button)));
    this.picker.tabIndex = -1;
    let dark = false;
    try { dark = sessionStorage.getItem(FONT_DARK_KEY) === "1"; } catch (e) { /* not kept */ }
    this.font_ground(dark);
    this.listen(window, "resize", () => { if (this.picker.open) { this.rail_place(); this.legend_fit(); } });
    this.picker.addEventListener("click", (e) => { if (e.target === this.picker) this.picker.close(); });      // a click outside closes it
    // the legend's window closes at a press anywhere outside it (but its own button, which toggles it) (Okay, 14 Oct 2026)
    this.picker.addEventListener("pointerdown", (e) => { if (!legend.hidden && !e.target.closest("#font-legend, #font-legend-open")) legend_button.click(); });
    return this.picker;
  },

  /** the sheet's tabs: 0 the tool's own fonts (and yours), 1 this computer's. */
  async font_tab_go(i) {
    this.font_tab = i;
    this.font_sheet_keep();
    this.fill_picker(true);
    if (i === 1 && ![...this.catalog.values()].some((f) => f.group === "computer")) { await this.local_fonts(true); this.fill_picker(true); }
  },

  /** the sheet keeps its tab, search and filters between openings, in this browser (R35; Okay, 24 Oct 2026: it opens on
   *  the ring's font, "The ring's font", so where the list was scrolled is not kept). */
  font_sheet_keep() { try { localStorage.setItem(FONT_SHEET_KEY, JSON.stringify({ tab: this.font_tab, q: $("#font-find").value, filters: [...this.font_filters] })); } catch (e) { /* kept for this page only */ } },

  open_picker() {
    if (!this.picker.open) {
      this.picker.showModal();
      this.picker.focus();                         // not the search field: it waits for a press (on an iPad the keyboard would come up at once; Okay, 13 Oct 2026)
    }
    this.fill_picker(true);                        // after it is open: the stickers' column is measured on the page
    this.load_remembered();
  },

  /** again: build the list afresh (fonts came, the search or a filter changed); to_font: then scroll to the ring's own font (R35: the sheet opens on it) */
  fill_picker(again = false, to_font = again) {
    const list = $("#font-list"), R = this.font_shown(), by = this.families(), q = $("#font-find").value.trim().toLowerCase();
    const regular = (fonts) => fonts.find((f) => /^(regular|roman|book|normal)$/i.test(f.style)) || fonts[0];
    const key = [...by.keys()].join("|") + "/" + q + "/" + [...this.font_filters].join(",") + "/" + this.font_tab + "/" + G.font_list().length;
    const installed = this.font_tab === 1;
    this.font_tray.classList.toggle("away", installed);      // out of sight but keeping its room, so the list doesn't jump between the tabs
    this.font_tabs.querySelectorAll(".tab").forEach((b, i) => { b.classList.toggle("on", i === this.font_tab); b.setAttribute("aria-selected", String(i === this.font_tab)); });
    if (again || list.dataset.shown !== key) {     // the list itself changes only when fonts arrive or the search does
      list.dataset.shown = key;
      list.replaceChildren();
      let group = null;
      for (const [family, every] of by) {
        if (q && !family.toLowerCase().includes(q)) continue;
        const fonts = every.filter((f) => (f.group === "computer") === installed);      // each tab its own fonts: a family both added and installed stands in both, each with its own
        if (!fonts.length) continue;
        if (!installed && this.font_filters.size && ![...this.font_filters].some((kind) => font_is(fonts, kind))) continue;      // any of the pressed filters
        const f = regular(fonts);
        if (f.group !== group) {
          group = f.group;
          const title = { added: "Added by you" }[group];
          if (title) list.append(el("div", { className: "group quiet", textContent: title }));
        }
        // a line of the sheet (Okay, 13 Oct 2026): the family's name in its own face · its numerals · what it has
        const named = this.sample(fonts.find((x) => x.name) || f, "name");
        named.classList.add("name");
        named.setAttribute("aria-label", family);
        const row = el("button", { type: "button", className: "fontrow", title: f.what ? `${family} · ${f.what}` : family, onclick: () => { this.font_note = ""; this.use_font(f); this.picker.close(); } },      // choosing a font closes the sheet (Okay, 18 Oct 2026, 22:35)
          named, this.sample(f), el("span", { className: "has" }, ...this.family_says(fonts).map(([word, kind]) => el("span", { className: "sticker " + kind, textContent: word }))));
        row.dataset.family = family;
        row.dataset.group = f.group;
        list.append(row);
      }
      // the stickers' column is as wide as the Find field above it and starts under its left edge (Okay, 13 Oct 2026):
      // the stylesheet sets it (--font-has); the numerals are cut at its edge
      const on = list.querySelector(`.fontrow[data-family="${CSS.escape(R.family)}"]`);
      if (on && to_font) list.scrollTop = Math.max(0, on.offsetTop - list.offsetTop - 80);
    }
    for (const row of list.querySelectorAll(".fontrow")) row.classList.toggle("on", row.dataset.family === R.family);
    $("#picker-note").textContent = this.font_note || "";
    requestAnimationFrame(() => this.rail_place());
  },

  /** the font list's scrollbar: the dark pill's length is the share of the list in view, its place where that share is;
   *  no scrollbar when everything is in view. */
  rail_place() {
    const list = $("#font-list"), rail = this.rail;
    if (!list || !rail) return;
    const span = list.scrollHeight - list.clientHeight;
    rail.hidden = span <= 1;
    if (rail.hidden) return;
    const h = rail.clientHeight, thumb = Math.max(h * list.clientHeight / list.scrollHeight, 3 * parseFloat(getComputedStyle(rail).width));
    rail.firstChild.style.height = thumb + "px";
    rail.firstChild.style.translate = `0 ${(h - thumb) * list.scrollTop / span}px`;
  },

  /** whose type a font box sets, and what an unset part of it is: a ring's own · a window's, which follows the top
   *  numerals ring wherever it has nothing of its own. → {scope, base_axis(T, tag, a), base_feature(T, tag)} */
  font_side(own) {
    const numerals = () => G.window_type(this.S, {});
    return own
      ? { scope: "window", base_axis: (T, tag, a) => (T.ps ? a.default : numerals().axes[tag] ?? a.default), base_feature: (T, tag) => (T.ps ? DEFAULT_ON.has(tag) : numerals().features[tag] ?? DEFAULT_ON.has(tag)) }
      : { scope: "ring", base_axis: (T, tag, a) => a.default, base_feature: (T, tag) => DEFAULT_ON.has(tag) };
  },

  /** a variable font's axes, one slider each: a part of every font box (Okay, 13 Oct 2026: "all font boxes get all
   *  font functionality"). Only what differs from where the axis rests is stored. → {el, refresh(R, T)}: R the type
   *  that is drawn, T whose it is. */
  axes_part(pre, own) {
    const wrap = el("div", { className: "axes" }), side = this.font_side(own);
    let shown = null, axes = {};
    const refresh = (R, T) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      axes = font ? G.font_axes(font) : {};
      const key = R.ps + JSON.stringify(Object.keys(axes));
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren();
        for (const tag in axes) {
          const a = axes[tag], id = pre + "axis-" + tag;
          const slider = el("input", { type: "range", min: a.min, max: a.max, step: (a.max - a.min) / 1000, id: id + "-slider" });
          const field = el("input", { type: "text", id, inputMode: "decimal" });
          const now = () => { const H = this.target(side.scope); return (H.axes || {})[tag] ?? side.base_axis(H, tag, a); };
          const commit = (v) => {
            const H = this.target(side.scope), all = { ...(H.axes || {}) };
            v = clamp(+(+v).toFixed(2), a.min, a.max);
            if (Math.abs(v - side.base_axis(H, tag, a)) < 1e-6) delete all[tag]; else all[tag] = v;
            this.set_value(side.scope, "axes", all);
          };
          slider.oninput = () => commit(slider.value);
          field.onchange = () => commit(parse_number(field.value, now()));
          slider.dataset.tag = field.dataset.tag = tag;
          // the axis is named in the tool's own type, with its code as a sticker of the size and colours the font sheet's
          // have (Okay, 13 Oct 2026: "axes nested here also get ui type"). The name is a button: a press sets the axis
          // back to where the font rests. Axes are not OpenType features.
          const word = { wght: "Weight", wdth: "Width", opsz: "Optical size", ital: "Italic", slnt: "Slant" }[tag] || a.name || tag;
          const kind = { wght: "weight", wdth: "width", opsz: "optical", ital: "italic", slnt: "italic" }[tag] || "other";
          const back = el("button", { type: "button", className: "axisname", id: id + "-back", title: `${a.name} (${tag}), ${a.min}–${a.max}: press to set it back to ${a.default}`, onclick: () => commit(a.default) },
            el("span", { textContent: word }), el("span", { className: "sticker " + kind, textContent: tag }));
          slider.ariaLabel = field.ariaLabel = a.name;
          wrap.append(el("div", { className: "row num" }, el("span", { className: "stickerlabel" }, back), slider, el("span", { className: "numbox alone" }, field)));      // the number box without − + (4.64): an axis is swept or typed
        }
      }
      for (const input of wrap.querySelectorAll("input")) {
        const a = axes[input.dataset.tag];
        if (a && document.activeElement !== input) input.value = input.type === "range" ? (R.axes[input.dataset.tag] ?? a.default) : fmt(R.axes[input.dataset.tag] ?? a.default, 0.1);
        if (input.type === "range") filled(input);
      }
      return Object.keys(axes).length > 0;
    };
    return { el: wrap, refresh };
  },

  /** the font's OpenType features, likewise a part of every font box. Only what differs from the font's default is stored (R12). */
  features_part(pre, own) {
    const wrap = el("div", { className: "features" }), side = this.font_side(own);
    let shown = null;
    const refresh = (R, T) => {
      const font = G.has_font(R.ps) ? G.font_of(R) : null;
      const key = font ? font.ps : "";
      if (key !== shown) {
        shown = key;
        wrap.replaceChildren();
        // the switches a designer would use: named by the font, or known by name here, or a stylistic set
        // or character variant. (Fonts also list features their script needs to work at all; those stay on.)
        const plumbing = ["aalt", "ccmp", "locl", "mark", "mkmk", "rvrn"];
        const useful = ([tag, designer]) => !plumbing.includes(tag) && (designer || FEATURE_NAMES[tag] || /^(ss|cv)\d\d$/.test(tag));
        // three groups: features with a name of their own, then the numbered ones — stylistic sets (ss01…),
        // character variants (cv01…) — each under its own small heading (Okay, 11 Oct 2026)
        const groups = [["", []], ["Stylistic sets", []], ["Character variants", []]];
        for (const [tag, designer] of font ? G.font_features(font).filter(useful) : []) {
          // a switch is a tile: its name in the tool's type, and its code as a sticker, of the size and the colours
          // the font sheet's stickers have (Okay, 13 Oct 2026: "back to rectangular grid with ui type… add codes in actual sticker size/form")
          const kind = /^(tnum|pnum|lnum|onum|zero|frac|numr|dnom|afrc|sups|subs|sinf|ordn)$/.test(tag) ? "figure" : /^(ss|cv)\d\d$/.test(tag) ? "sets" : "styles";
          const tile = el("button", { type: "button", className: "tile", id: pre + "feature-" + tag }, el("span", { textContent: designer || FEATURE_NAMES[tag] || tag }), el("span", { className: "sticker " + kind, textContent: tag }));
          tile.dataset.tag = tag;
          tile.onclick = () => {                     // press to switch; only what differs from what it would be anyway is stored (R12)
            const H = this.target(side.scope), on = tile.getAttribute("aria-pressed") !== "true", all = { ...(H.features || {}) };
            if (on === side.base_feature(H, tag)) delete all[tag]; else all[tag] = on;
            this.set_value(side.scope, "features", own && !Object.keys(all).length ? null : all);
          };
          groups[/^ss\d\d$/.test(tag) ? 1 : /^cv\d\d$/.test(tag) ? 2 : 0][1].push(tile);
        }
        // what changes numerals comes first (Okay, 13 Oct 2026), then the rest; each by name
        const figures = (tile) => (tile.querySelector(".sticker.figure") ? 0 : 1);
        groups[0][1].sort((x, y) => figures(x) - figures(y) || x.firstChild.textContent.localeCompare(y.firstChild.textContent));
        for (const [title, tiles] of groups) {
          if (!tiles.length) continue;
          if (title) wrap.append(el("h3", { textContent: title }));
          wrap.append(el("div", { className: "tiles" }, ...tiles));
        }
      }
      for (const tile of wrap.querySelectorAll(".tile")) tile.setAttribute("aria-pressed", String((R.features || {})[tile.dataset.tag] ?? DEFAULT_ON.has(tile.dataset.tag)));
      return font ? (wrap.children.length ? true : "none") : false;      // none: a font without switches — its line says so, no line more
    };
    return { el: wrap, refresh };
  },

  /** a part of a font box that can be put away (Okay, 13 Oct 2026: "show hide within block possible"): a line with its
   *  name, a press folds what is under it. Kept with the panes' folds, one for all font boxes. */
  box_part(name, title, part, shut = false) {
    const head = el("button", { type: "button", className: "partfold", title: "Show or hide this part" });
    let none = false;                              // nothing to show (a font without switches): the line is grey, its sign a sheet with a cross, and it folds nothing
    const set = () => {
      this.is_folded({ fold: name, row: {} });
      const folded = this.folds[name] ?? shut;     // shut: put away until asked for (the OpenType features)
      part.el.hidden = folded || none;
      head.classList.toggle("none", none);
      head.title = none ? `This font has no ${title}` : "Show or hide this part";
      head.setAttribute("aria-expanded", String(!folded && !none));
      const many = part.el.querySelectorAll(".tile").length;      // how many switches the font has, beside the name (Okay, 13 Oct 2026: "How many?")
      head.innerHTML = (none ? icon(NONE_SIGN) : eye(!folded)) + `<span>${title}</span>` + (many ? `<span class="many">${many}</span>` : "");
    };
    head.onclick = () => { if (none) return; this.is_folded({ fold: name, row: {} }); this.folds[name] = !(this.folds[name] ?? shut); try { localStorage.setItem(KEY("folds"), JSON.stringify(this.folds)); } catch (e) { /* not kept */ } set(); };
    const wrap = el("div", { className: "boxpart" }, head, part.el);
    return { el: wrap, refresh: (R, T) => { const has = part.refresh(R, T); wrap.hidden = !has; none = has === "none"; set(); } };
  },

  /** fonts are needed before the first numerals are right: load what the settings name, if we may. */
  async fonts_at_start() {
    // Inter, inside the page, and any font already loaded (a dial opened before this one used it) — a font of the tool's
    // list keeps the list's family and style: its file may call itself otherwise ("Routed Gothic Wide" is the list's
    // Routed Gothic, Wide), and the sheet would show it as a family of its own (found 15 Oct 2026, with the opener)
    for (const f of G.font_list()) { const listed = FONT_LIST.find((x) => x.ps === f.ps); this.catalog.set(f.ps, { ...(listed || { kinds: f.family === "Inter" ? ["sans"] : [] }), family: listed ? listed.family : f.family, style: listed ? listed.style : f.style, ps: f.ps, group: "list" }); }      // a loaded font keeps what the list says of it (its kinds, axes, features: the filters read them); Inter, the page's own, is a sans
    for (const f of FONT_LIST) if (!this.catalog.has(f.ps)) this.catalog.set(f.ps, { ...f, group: "list" });               // the tool's own list
    for (const f of this.remembered()) if (!this.catalog.has(f.ps)) this.catalog.set(f.ps, { ...f, group: "added" });      // added from a link, earlier
    try {                                          // added from a file, earlier (#56): into the text engine and the list, as when they were added
      for (const src of await font_files_all()) for (let i = 0; i < 64; i++) {
        const got = G.add_font(src.bytes, i);
        if (!got) break;
        if (!this.catalog.has(got.ps)) this.catalog.set(got.ps, { family: got.family, style: got.style, ps: got.ps, group: "added", start: this.start_of(got.ps) });
      }
    } catch (e) { /* nothing kept here (a private window): files are added again by hand */ }
    await this.load_fonts_in_use();
    try {
      const status = await navigator.permissions.query({ name: "local-fonts" });
      if (status.state === "granted") await this.local_fonts(false);
    } catch (e) { /* this browser has no such permission: fonts come from files */ }
    this.sync_rows();
  },

  /** list the fonts installed on this computer (Chrome and Edge ask once), and load the ones in use. */
  async local_fonts(asked) {
    const say = (text) => { if (asked) this.say_font(text); };
    say("Asking the browser for this computer’s fonts… (it may show a question near the address bar)");
    try {
      const list = await window.queryLocalFonts();
      for (const f of list) {
        if (!this.catalog.has(f.postscriptName)) this.catalog.set(f.postscriptName, { family: f.family, style: f.style, ps: f.postscriptName, data: f, group: "computer" });
      }
      // a browser that isn't allowed answers with an empty list, not with an error
      if (list.length) say(`${list.length} installed fonts, under Installed.`);
      else say("The browser gave no fonts: it isn’t allowed to for this page. Click the icon at the left of the address bar → Site settings → Fonts → Allow, reload, and press Installed fonts again. Or use Add font file… (Helvetica Neue is /System/Library/Fonts/HelveticaNeue.ttc).");
      await this.load_fonts_in_use();
    } catch (e) {
      say(`The browser refused to list fonts (${e.name}: ${e.message}). Use Add font file… instead.`);
    }
    this.sync_rows();
  },

  /** read one catalogued font into the text engine. A collection file holds several: find ours. */
  async load_font(entry) {
    if (G.has_font(entry.ps) || !(entry.data || entry.file || entry.url)) return G.has_font(entry.ps);
    let bytes;
    if (entry.file || entry.url) {                 // one of the tool's own, or one added from a link: fetched when first used
      const address = entry.url || FONT_SITE + entry.file;
      const answer = await fetch(address);
      if (!answer.ok) throw new Error(`${answer.status} from ${address}`);
      bytes = new Uint8Array(await answer.arrayBuffer());
    } else bytes = new Uint8Array(await (await entry.data.blob()).arrayBuffer());
    for (let i = 0; i < 64; i++) {
      const got = G.add_font(bytes, i);
      if (!got) break;
      if (got.ps === entry.ps) return true;
    }
    return G.has_font(entry.ps);
  },

  async load_fonts_in_use(S = this.S) {      // the dial's fonts, or another dial's (a set's, #523)
    let loaded = false;
    for (const ring of [...S.rings, ...G.windows_of(S).filter((w) => w.ps), ...S.rings.flatMap((r) => Object.values(r.nudge || {}).filter((n) => n.ps))]) {      // rings, windows and single numerals with a font of their own
      const entry = this.catalog.get(ring.ps);
      try {
        if (entry && !G.has_font(ring.ps)) loaded = (await this.load_font(entry)) || loaded;
      } catch (e) {
        this.font_note = `Couldn’t fetch ${entry.family} (${e.message}). Are you online?`;
        this.log(this.font_note);
      }
    }
    if (loaded) { this.static_dirty = true; this.sync_rows(); this.render(); }
  },

  /** font files chosen or dropped. */
  async add_font_files(files) {
    try {
      const got = [];
      for (const file of files) got.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
      const n = await this.take_fonts(got);
      if (n) for (const f of got) await font_files_put(f.name, f.bytes).catch(() => this.log(`${f.name} is used now but not kept: this browser's storage is closed or full`));
    } catch (e) {
      this.say_font(`Couldn’t read ${files.map((f) => f.name).join(", ")} (${e.name}: ${e.message}).`);
    }
  },

  say_font(text) { this.font_note = text; this.log(text); this.sync_rows(); if (this.picker && this.picker.open) this.fill_picker(); },

  /** fonts that arrived as bytes → the text engine and the list. A source with a url is remembered by this
   *  browser, so the font is there again next time. → how many were added */
  async take_fonts(sources, family = null) {
    const added = [];
    for (const src of sources) {
      for (let i = 0; i < 64; i++) {               // a collection (.ttc) holds several fonts
        const got = G.add_font(src.bytes, i);
        if (!got) break;
        if (!this.catalog.has(got.ps) || this.catalog.get(got.ps).group !== "list") {       // the tool’s own twenty-one keep their entry
          this.catalog.set(got.ps, { family: family || got.family, style: src.style || got.style, ps: got.ps, group: "added", url: src.url, start: this.start_of(got.ps) });
        }
        added.push(this.catalog.get(got.ps));
      }
    }
    if (!added.length) { this.say_font(`${sources.map((x) => x.name).join(", ")} didn’t open as a font (TTF, OTF, TTC).`); return 0; }
    this.remember(added);
    const names = [...new Set(added.map((f) => f.family))];
    this.say_font(`Added ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}: ${added.length} style${added.length > 1 ? "s" : ""}.`);
    const R = this.ring();
    if (G.has_text(R) && !added.some((f) => f.ps === R.ps)) {       // not the ring's own font: switch to the new one
      await this.use_font(added.find((f) => /^(regular|roman|book|normal)$/i.test(f.style)) || added[0]);
    }
    G.forget();
    this.static_dirty = true; this.sync_rows(); this.render();
    if (this.picker && this.picker.open) this.fill_picker(true);
    return added.length;
  },

  /** what was typed or pasted into Add fonts → fonts. Understands: a Google Fonts page or embed link, a family's
   *  name as Google Fonts spells it, and a direct link to a font file. → true if something was added */
  async add_from_text(text) {
    text = text.trim();
    let names = [text], file = null;
    try {
      const u = new URL(text);
      names = [];
      if (/\.(ttf|otf|ttc|otc)$/i.test(u.pathname)) file = text;
      else if (u.hostname === "fonts.googleapis.com") names = u.searchParams.getAll("family").map((f) => f.split(":")[0]);
      else if (u.hostname.endsWith("fonts.google.com")) {
        const page = /\/specimen\/([^/?]+)/.exec(u.pathname);
        if (page) names = [decodeURIComponent(page[1]).replace(/\+/g, " ")];
        else names = u.searchParams.getAll("selection.family").flatMap((v) => v.split("|")).map((f) => f.split(":")[0]);
      }
      if (!file && !names.length) { this.say_font("That link isn’t one I can read: use a Google Fonts page (fonts.google.com/specimen/…), its embed link, or a link that ends in .ttf or .otf."); return false; }
    } catch (e) { /* not a link: a family name */ }
    try {
      if (file) {
        this.say_font(`Fetching ${file}…`);
        const answer = await fetch(file);
        if (!answer.ok) throw new Error(`the site answered ${answer.status}`);
        return (await this.take_fonts([{ name: file.split("/").pop(), bytes: new Uint8Array(await answer.arrayBuffer()), url: file }])) > 0;
      }
      let total = 0;
      for (const name of names) total += await this.add_google(name.trim());
      return total > 0;
    } catch (e) {
      this.say_font(`Couldn’t fetch that (${e.message}). A site has to allow other pages to read its files; if it doesn’t, download the font and use Font file….`);
      return false;
    }
  },

  /** one family from Google Fonts' own repository on GitHub (the font files as their designers delivered them;
   *  Google's font service itself only hands out a compressed web format this tool's text engine can't read). */
  async add_google(name) {
    const folder = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!folder) return 0;
    this.say_font(`Looking for ${name} in Google Fonts…`);
    for (const licence of ["ofl", "apache", "ufl"]) {
      const base = `https://raw.githubusercontent.com/google/fonts/main/${licence}/${folder}/`;
      const answer = await fetch(base + "METADATA.pb");
      if (!answer.ok) continue;
      const about = await answer.text();
      const family = (/^name: "([^"]+)"/m.exec(about) || [])[1] || name;
      const fonts = [...about.matchAll(/fonts \{([^}]*)\}/g)].map((m) => Object.fromEntries([...m[1].matchAll(/(\w+): "?([^"\n]*)"?/g)].map((x) => [x[1], x[2]])));
      const upright = fonts.filter((f) => f.style === "normal").slice(0, 12);     // italics lean: not for a dial
      const sources = [];
      for (const f of upright) {
        const url = base + encodeURIComponent(f.filename);
        const file = await fetch(url);
        if (!file.ok) throw new Error(`${f.filename}: ${file.status}`);
        sources.push({ name: f.filename, bytes: new Uint8Array(await file.arrayBuffer()), url, style: upright.length > 1 ? (f.full_name || "").replace(family, "").trim() || "Regular" : "Regular" });
      }
      return this.take_fonts(sources, family);
    }
    this.say_font(`Google Fonts has no family spelled “${name}”. Copy the name from its page, or paste the page’s link.`);
    return 0;
  },

  /** fonts added from a link are remembered by this browser as their addresses, and fetched again when wanted. */
  remember(added) {
    try {
      const kept = JSON.parse(localStorage.getItem(KEY("fonts")) || "[]").filter((k) => !added.some((f) => f.ps === k.ps));
      for (const f of added) if (f.url) kept.push({ family: f.family, style: f.style, ps: f.ps, url: f.url });
      localStorage.setItem(KEY("fonts"), JSON.stringify(kept));
    } catch (e) { /* not kept */ }
  },

  remembered() {
    try { return JSON.parse(localStorage.getItem(KEY("fonts")) || "[]"); } catch (e) { return []; }
  },

  /** when the sheet opens: fetch the remembered fonts that aren't here yet, so each can show its numerals. */
  async load_remembered() {
    let any = false;
    for (const f of this.catalog.values()) {
      if (f.url && !G.has_font(f.ps)) { try { any = (await this.load_font(f)) || any; } catch (e) { /* offline: it keeps its name */ } }
    }
    if (any && this.picker.open) this.fill_picker(true);
  },

  /** a variable font may rest at its thinnest weight: start it at regular (400) where it has that. */
  start_of(ps) {
    const wght = G.font_axes(G.font_of({ ps })).wght;
    return wght && wght.default !== 400 && wght.min <= 400 && wght.max >= 400 ? { wght: 400 } : {};
  },

  async use_font(entry) {
    try {
      await this.load_font(entry);
    } catch (e) {
      return this.say_font(`Couldn’t fetch ${entry.family} (${e.message}). Are you online?`);
    }
    if (!entry.start && G.has_font(entry.ps)) entry.start = this.start_of(entry.ps);
    const R = this.font_holder();
    R.family = entry.family; R.ps = entry.ps; R.axes = { ...(entry.start || {}) };
    if (this.font_scope === "ring") R.features = {};       // a window's font, and one numeral's, are plain: no features of their own
    this.static_dirty = true;
    this.sync_rows();
    this.render();
  },
};
