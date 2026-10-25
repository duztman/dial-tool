// app.js — the window: the DialTool class, its start and its lifetime.
//
//   left: sections (Dial · Rings · Hands · Windows · Export), each a list of panes; a pane is a heading and its rows
//   right: the preview (SVG — one element per scene item) and the bar under it
//
// Rows are described as data (rows.js, ROWS); one function turns a row into controls (panel.js, build_row). Controls
// change the settings S and ask for a frame; the frame draws (R28, preview.js). This file holds what is the tool's
// own: the constructor, the settings in scopes (set_value), the window's skeleton (build_window), undo, the session,
// open and close. Everything else is a part — one file per part of the window, each an object of methods put on
// the class here (Object.assign at the end), so inside any of them `this` is the tool:
//   ui.js the small helpers and sizes · icons.js every icon (R33) · rows.js the ROWS tables · session.js links, the
//   kept dials and the undo history · panel.js panes, rows and the controller · rings.js the ring list and its rows ·
//   hands.js · windows.js · colour.js the colour pop-out · fonts.js the font box and sheet · preview.js the canvas ·
//   guides.js the Guides and Shadows lists · bar.js the bottom bar · cards.js the Gallery and Versions ·
//   export.js files out and in · mode.js the change to show mode (show.js draws the watch).

import * as G from "./geometry.js";

import { attach as attach_watch } from "./watch.js";

import { OPENER } from "./opener.js";
import { start_ink } from "./ink.js";
import { BAD_LINK_NOTE, HISTORY, OLD_LINK_NOTE, OLD_SET_NOTE, dial_text, keep_and_shorten, step_name, unpack, unpack_set } from "./session.js";
import { $, DEV, FINE, FINE_FREE, HELP, HOLE_LIVE_MS, KEYS, LAST, LINKED_PAIRS, NUDGE_NEUTRAL, clamp, el, fmt_time, parse_time, svg_el } from "./ui.js";
import { SECTIONS, SHOW_SECTIONS, TAB_NAMES, TAB_ORDER } from "./rows.js";
import { SIGNS, STEP, TOOL_ICONS, icon, section_icon } from "./icons.js";

// the parts of the window: one object of methods each, put on the class below (Object.assign), so `this` in them is the tool
import { COLOUR } from "./colour.js";
import { FONTS } from "./fonts.js";
import { PANEL } from "./panel.js";
import { RINGS } from "./rings.js";
import { HANDS } from "./hands.js";
import { WINDOWS } from "./windows.js";
import { PREVIEW } from "./preview.js";
import { GUIDES } from "./guides.js";
import { BAR, DAY_STEPS, SPEED_HI, SPEED_SLOW, speed_at } from "./bar.js";
import { CARDS } from "./cards.js";
import { EXPORT } from "./export.js";
import { MODE } from "./mode.js";

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
    this.scrolls = {};                             // how far each section was scrolled (the window's state, not the dial's)
    this.log_lines = [];
    this.build_window();
    if (!DialTool.listening) {                     // once for the page: the tool that is open now gets the press
      DialTool.listening = true;
      document.addEventListener("pointerdown", (e) => { if (window.dial_tool) window.dial_tool.pressed(e); }, true);
      // the window itself never zooms (Okay, 15 Oct 2026, 02:19: "never let us zoom into the interface. That stays
      // still, the zoom only applies to the dial on touches"). A pinch anywhere is refused to the browser: Safari's
      // gesture events (an iPad, a Mac trackpad in Safari) and ctrl + wheel (a trackpad pinch in Chrome). Inside the
      // preview the dial still zooms: its own listeners act on these before they reach here (preview_events). The
      // stylesheet does the same for fingers (touch-action on html and body), the page's viewport for iOS.
      for (const kind of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(kind, (e) => e.preventDefault(), { passive: false });
      document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
      const tipped = (e) => (e.target.closest ? e.target.closest("[data-tip]") : null);      // tags: under the pointer, or where the keyboard is
      // how the last press came: a finger (or pen) or a mouse, and a key — a tap leaves no focus ring (#153)
      document.addEventListener("pointerdown", (e) => { document.documentElement.dataset.press = e.pointerType === "mouse" ? "mouse" : "touch"; }, true);
      document.addEventListener("keydown", () => { document.documentElement.dataset.press = "key"; }, true);
      // every menu opens the tool's own list, not the browser's (Okay, 20 Oct 2026, 01:05: "the popping up thing on
      // these, styled like mm dropdown. all around the site"): a press on a menu is caught before the browser opens its
      // own, and the list (menu_list) stands under the menu's box; the keys that would open the browser's open it too
      // (Okay, 23 Oct 2026: "system dropdown is no more, all around the app. we have our own dropdowns")
      const menu_press = (e) => {
        const select = e.target instanceof HTMLSelectElement ? e.target : null;
        if (!select || select.disabled || !window.dial_tool || (e.type === "mousedown" && e.button !== 0)) return;
        e.preventDefault();
        if (e.type === "pointerdown") window.dial_tool.menu_list(select);      // mousedown and touchstart only kept from opening the browser's
      };
      for (const kind of ["pointerdown", "mousedown", "touchstart"]) document.addEventListener(kind, menu_press, { capture: true, passive: false });
      document.addEventListener("contextmenu", (e) => { if (!e.target.closest("input, textarea")) e.preventDefault(); }, true);      // no browser menu on a right press, but in a field (Okay, 23 Oct 2026: "disable other right clicks")
      document.addEventListener("keydown", (e) => {
        const select = e.target instanceof HTMLSelectElement ? e.target : null;
        if (!select || select.disabled || !window.dial_tool || ![" ", "Enter", "ArrowDown", "ArrowUp"].includes(e.key)) return;
        e.preventDefault(); window.dial_tool.menu_list(select);
      }, true);
      // a slider held with a mouse or a pen grows finer the farther the pointer moves from its track, up or down (#406;
      // Okay, 19 Oct 2026, 17:43: "Moving away from slider increases accuracy: build soon"): the press puts the value where
      // it lands, as the browser's own slider does; from then on, sideways travel moves it as the track would, times
      // FINE(distance) — whole within FINE_FREE px of the track, a half FINE_HALF px further, a third twice that, and so
      // on down to FINE_LEAST. A finger opens the controller instead (R15). The panel's sliders and the controller's.
      const held_range = (e) => (e.target instanceof HTMLInputElement && e.target.type === "range" && e.target.closest(".panel, #value-pop, #shadow-list") ? e.target : null);
      document.addEventListener("mousedown", (e) => { if (held_range(e)) e.preventDefault(); }, true);      // the browser's own drag stays out of it
      document.addEventListener("pointerdown", (e) => {
        const s = e.target instanceof HTMLInputElement && e.target.type === "range" ? e.target : null;
        if (!s || e.pointerType === "touch" || e.button !== 0 || s.disabled || !s.closest(".panel, #value-pop, #shadow-list")) return;
        e.preventDefault();
        s.focus({ preventScroll: true });
        const lo = +s.min, hi = +s.max, step = +s.step || 0, box = () => s.getBoundingClientRect();
        const travel = () => { const k = box(); return Math.max(k.width - k.height, 1); };      // the thumb's centre runs a thumb short of the track
        const put = (v) => { const r = step ? Math.round((v - lo) / step) * step + lo : v; s.value = String(+clamp(r, lo, hi).toFixed(6)); s.dispatchEvent(new Event("input", { bubbles: true })); };
        const k = box();
        let v = lo + clamp((e.clientX - k.left - k.height / 2) / travel(), 0, 1) * (hi - lo), x = e.clientX;
        put(v);
        const move = (m) => {
          const r = box(), off = Math.max(Math.abs(m.clientY - (r.top + r.bottom) / 2) - r.height / 2 - FINE_FREE, 0);
          v = clamp(v + (m.clientX - x) / travel() * (hi - lo) * FINE(off), lo, hi); x = m.clientX;
          put(v);
        };
        const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); s.dispatchEvent(new Event("change", { bubbles: true })); };
        addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
      }, true);
      document.addEventListener("pointerover", (e) => { const t = tipped(e); if (window.dial_tool) { if (t && e.pointerType !== "touch") window.dial_tool.tag_show(t); else window.dial_tool.tag_hide(); } });
      document.addEventListener("focusin", (e) => { const t = tipped(e); if (t && window.dial_tool && t.matches(":focus-visible") && document.documentElement.dataset.press !== "touch") window.dial_tool.tag_show(t); });
      document.addEventListener("focusout", () => { if (window.dial_tool) window.dial_tool.tag_hide(); });
      // the time from the keyboard (#84, atlas 4.3): ← → a minute, with ⇧ an hour; space plays or pauses. Not while
      // typing, on a slider or a menu (they use these keys), with ⌘/Ctrl/⌥ held, or with a dialog open.
      document.addEventListener("keydown", (e) => {
        const tool = window.dial_tool, at = e.target;
        if (!tool || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]")) return;
        if (at && at.closest && at.closest("input, textarea, select, [contenteditable='true']")) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const step = (e.shiftKey ? 3600 : 60) * (e.key === "ArrowLeft" ? -1 : 1);
          tool.set_time(((tool.S.t + step) % 86400 + 86400) % 86400);
          e.preventDefault();
        } else if (e.key === " " && !e.repeat) {
          tool.play(!tool.playing);
          e.preventDefault();
        } else if (e.key.toLowerCase() === "g" && !e.repeat && !e.shiftKey && !tool.S.ui_show) {      // G: guides on or off (Okay, 18 Oct 2026, notes 2); not in show mode, where there are none to show
          tool.set_value("global", "guides", !tool.S.guides);
          e.preventDefault();
        } else if (!e.repeat && !e.shiftKey && KEYS[e.key.toLowerCase()]) {      // more like G (#472; Okay, 20 Oct 2026, 02:37: "Can we get shortcuts like these for keyboards")
          KEYS[e.key.toLowerCase()](tool);
          e.preventDefault();
        }
      });
      document.addEventListener("keydown", (e) => {   // ⌘Z undo · ⇧⌘Z or ⌘Y redo (Ctrl on Windows) — Okay, 13 Oct 2026
        const z = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "z", y = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "y";
        if (!(z || y) || !window.dial_tool || document.querySelector("dialog[open]")) return;
        e.preventDefault();
        window.dial_tool.undo(y || e.shiftKey ? 1 : -1);
      });
    }
    if (this.S.ui_show) { this.S.ui_show = false; const app = $("#app"); app.classList.add("snap"); this.show_mode(true, true); setTimeout(() => app.classList.remove("snap"), 100); }      // the session ended in show mode: open there, no slide
    this.show_section();
    this.fit();
    this.sync_time();
    this.render();
    this.log(`Dial Tool · ${G.VERSION} · shapes: PathKit · text: HarfBuzz`);
    this.fonts_at_start();
  }

  ring() { return this.S.rings[this.S.ui_ring]; }

  hand() { return this.S["ha_" + G.HANDS[this.S.ui_hand]]; }

  window() { return G.windows_of(this.S)[this.S.ui_window]; }

  target(scope) { return scope === "ring" ? this.ring() : scope === "hand" ? this.hand() : scope === "window" ? this.window() : scope === "nudge" ? { ...NUDGE_NEUTRAL, ...(this.ring().nudge[this.nudge_at] || {}) } : this.S; }

  set_value(scope, key, value) {
    if (scope === "ring" && key === "start" && this.ring() && G.kind_of(this.ring()) === "text") value = this.snapped_angle(value);      // a text ring holds to the indices (#297)
    // what the radius measures to changes: the radius changes with it so nothing on the dial moves, only the dotted line
    // (#326; Okay, 18 Oct 2026, notes 2: "Nothing changed … just the dotted line moves"). Undo takes both back.
    if (scope === "ring" && (key === "anchor" || key === "from") && this.ring() && value !== (this.ring()[key] || 0)) this.ring().r = +G.radius_kept(this.ring(), key, value).toFixed(4);
    if (scope === "hand" && key === "shape" && G.HAND_SHAPES[value] === "disc") this.target("hand").mark_in = true;      // a disc made here keeps its window inside (#344); older links keep theirs as drawn
    if (scope === "nudge") {                       // the chosen numeral's own: a neutral value is not kept (#252)
      const R = this.ring(), n = { ...(R.nudge[this.nudge_at] || {}) }, all = { ...R.nudge };
      if (Math.abs(value - NUDGE_NEUTRAL[key]) < 1e-9) delete n[key]; else n[key] = +(+value).toFixed(4);
      if (Object.keys(n).length) all[this.nudge_at] = n; else delete all[this.nudge_at];
      return this.set_value("ring", "nudge", all);
    }
    const T = this.target(scope);
    if (JSON.stringify(T[key]) === JSON.stringify(value)) return;
    // a linked pair (#358, LINKED_PAIRS): the other one keeps their ratio, as in Illustrator
    const pair = (LINKED_PAIRS[scope] || []).find((p) => p.keys.includes(key) && T[p.link] && p.when(T));
    if (pair && T[key] > 0 && value > 0) { const other = pair.keys.find((k) => k !== key); T[other] = +(T[other] * value / T[key]).toFixed(4); }
    // the diameter, with "scale everything" ticked: every measure on the dial grows or shrinks by the same factor
    if (scope === "global" && key === "dial_d" && this.S.ui_scale && T.dial_d > 0 && value > 0) this.scale_with(T.dial_d, value);
    if (scope === "global" && key === "ui_weight" && T.ui_weight > 0 && value > 0) this.weight_with(T.ui_weight, value);
    if (scope === "window" && key === "on" && value && !T.on && ["17", "MON"].includes(T.text)) T.follows = true;      // a window switched on with its starting text follows the date (4.62: "Default from system date"); one with typed text keeps it
    const restored = scope === "window" && key === "kind" && value !== T.kind ? this.kind_tab(T, value) : false;
    T[key] = value;
    if (scope === "ring") {
      if (!["c", "name", "guide"].includes(key)) this.static_dirty = true;      // (cs too: which sectors share a colour decides the shapes)
      if (key === "kind" || key === "name" || key === "on") this.fill_ring_list();
    } else if (scope === "window") {
      if (!["ink", "text_c", "disc_c"].includes(key)) this.static_dirty = true;
      if (key === "kind" && !restored) {           // a kind taken for the first time: a date shows a number, a day a word, so swap the untouched starting text
        if (G.WINDOW_KINDS[value] === "day" && T.text === "17") T.text = "MON";
        if (["date", "big date"].includes(G.WINDOW_KINDS[value]) && T.text === "MON") T.text = "17";
      }
    } else if (scope === "global") {
      const quiet = !G.GEOMETRY_AFTER_ALL.includes(key) && (G.NOT_GEOMETRY.includes(key) || G.NOT_GEOMETRY_PREFIX.some((p) => key.startsWith(p)));
      if (!quiet) this.static_dirty = true;
      if (key === "dial_d" || key === "margin") { if (this.fitted) this.fit(); }
      if (key === "date") this.sync_time();      // the bar's stacked date (4.62)
      if ((key === "bezel" || key === "ui_case") && this.case_sync) this.case_sync();
      if (key === "dial_hole") {                  // its guide shows while it is being sized, whatever the guides are set to (#267)
        this.hole_at = performance.now();
        clearTimeout(this.hole_timer);
        this.hole_timer = setTimeout(() => this.render(), HOLE_LIVE_MS + 50);
      }
    }
    this.sync_rows();
    this.render();
  }

  /** the diameter goes from one value to another and everything on the dial goes with it. The measures are always
   *  worked out from where a run of changes began (this.scale_from), not from the last step, so dragging the slider
   *  up and back lands exactly on the first values. Anything else edited in between starts a new run. */
  /** Weight % (#88), as scale_with: the widths as they were when it started moving, times to/from. A width changed by
   *  hand since starts a new run, from the Weight shown. */
  weight_with(from, to) {
    const S = this.S, now = JSON.stringify(G.measures(S, G.WEIGHT_KEYS));
    if (!this.weight_from || this.weight_from.now !== now) this.weight_from = { w: from, base: G.measures(S, G.WEIGHT_KEYS) };
    const run = this.weight_from;
    G.set_measures(S, run.base.map((v) => (typeof v === "number" ? +(v * to / run.w).toFixed(6) : v)), G.WEIGHT_KEYS);
    run.now = JSON.stringify(G.measures(S, G.WEIGHT_KEYS));
  }

  scale_with(from, to) {
    const S = this.S, now = JSON.stringify(G.measures(S));
    if (!this.scale_from || this.scale_from.now !== now) this.scale_from = { d: from, base: G.measures(S) };
    const run = this.scale_from;
    G.set_measures(S, run.base.map((v) => +(v * to / run.d).toFixed(6)));
    run.now = JSON.stringify(G.measures(S));
  }

  /** a press anywhere outside the colour pop-out or the guides' list puts it away (Okay, 12 Oct 2026). A press on a
   *  swatch or a colour pill is left to that swatch: it opens, moves or closes the pop-out itself. */
  pressed(e) {
    const on = (q) => e.target.closest && e.target.closest(q);
    if (this.pop && this.pop.at && !on("#colour-pop") && !on(".swatch, .colour, .backdropbox")) this.pop_close();
    if (this.guides_open && !$("#guide-list").hidden && !on(".guides, .handles [data-more]")) this.guides_open(false);      // an added guide's handle is the list's too (#527)
    if (this.shadows_open && !$("#shadow-list").hidden && !on(".shadows, #shadow-list, #value-pop")) this.shadows_open(false);      // the pane lives on the body, over the panel
    if (this.ground_open && !$("#ground-pop").hidden && !on(".backdrops, #colour-pop")) this.ground_open(false);
    if (this.versions_open && !$("#version-list").hidden && !on(".versions")) this.versions_open(false);
    if (this.history_open && !$("#history-list").hidden && !on(".undopair")) this.history_open(false);
    if (this.bio_open && !$("#bio").hidden && !on(".about")) this.bio_open(false);
    if (this.unit_open && !$("#unit-menu").hidden && !on(".unit")) this.unit_open(false);
    if (this.iris_box && !on(".irisbox")) this.iris_open(false);
    if (this.lang_opens && !on(".langs")) for (const shut of this.lang_opens) shut(false);
    if (this.add_open && $("#add-menu") && !$("#add-menu").hidden && !on(".adder")) this.add_open(false);
    if (this.kind_open && $("#kind-menu") && !$("#kind-menu").hidden && !on("#ring-kind-square") && !on("#kind-menu")) this.kind_open(false);
    if (this.value_pop && !on("#value-pop") && !on(".valueb, .atmore, .popname")) this.value_pop_close();
    this.tag_hide();
  }

  build_window() {
    const root = $("#app");
    root.replaceChildren();
    this.tabs = el("nav", { className: "tabs" });
    [...TAB_ORDER, ...SHOW_SECTIONS].forEach((name) => {      // both modes' tabs; show_mode() shows one set (R16)
      const i = SECTIONS.indexOf(name);
      const tab = el("button", { type: "button", onclick: () => { if (this.S.ui_section === i) return; this.S.ui_section = i; this.show_section(); this.render(); } });
      tab.dataset.tab = name;
      tab.hidden = SHOW_SECTIONS.includes(name);
      tab.innerHTML = section_icon(name);
      tab.append(el("span", { textContent: TAB_NAMES[name] || name }));
      this.tabs.append(tab);
    });
    this.pinned = el("div", { className: "pinned" });              // rows that stay in view
    this.form = el("div", { className: "form" });                  // rows that scroll
    const panel = el("aside", { className: "panel" },
      // .mast: the mark, the title and the version — what stays when the panel slides away (dial_alone(), 15 Oct 2026)
      el("header", {}, el("div", { className: "mast" }, this.logo_box(), this.title = el("div", { className: "title" }, el("h1", { textContent: "Dial Tool" }), el("span", { className: "quiet", textContent: DEV ? `${G.VERSION} · dev` : G.VERSION }), el("a", { className: "quiet help", href: HELP, target: "_blank", rel: "noopener", textContent: "Help" }))), this.gallery_way(), this.grey_swatch(), this.unit_box()),
      this.tabs, this.pinned, this.form, this.shenanigans_box());
    this.finger_anchor(panel);

    this.svg = svg_el("svg");
    this.svg.setAttribute("class", "preview");
    this.backdrop = svg_el("rect");
    this.backdrop.setAttribute("width", "100%");
    this.backdrop.setAttribute("height", "100%");
    this.dial = svg_el("g");
    this.over = svg_el("g");                       // above the dial, same place and zoom: the outline of what the pointer is on
    this.over.setAttribute("pointer-events", "none");
    this.glow = ["glow under", "glow"].map((name) => { const line = svg_el("path"); line.setAttribute("class", name); this.over.append(line); return line; });
    this.picked = ["picked under", "picked"].map((name) => { const line = svg_el("path"); line.setAttribute("class", name); this.over.append(line); return line; });      // the numeral or mark Nudge works on (4.78)
    this.handles = svg_el("g");                    // the selected ring's handles on its guides (4.65, draw_handles), over everything on the dial
    this.handles.setAttribute("class", "handles");
    this.handle_events();
    this.bezel_g = svg_el("g");                    // a case round the dial, preview only (4.66, bezels.js), under it
    this.bezel_g.setAttribute("class", "bezel");
    this.bezel_g.setAttribute("pointer-events", "none");
    this.watch_g = svg_el("g");                    // show mode: the watch, drawn by watch.js round the dial's own shapes (show.js); in the dial's space, as the case is
    this.watch_g.setAttribute("class", "watch");
    this.watch_g.setAttribute("pointer-events", "none");
    this.svg.append(this.backdrop, this.bezel_g, this.dial, this.watch_g, this.over, this.handles);
    this.tip = el("div", { className: "tip", hidden: true }, el("span"));       // the name of what the pointer is on
    this.tip.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 20 10" width="20" height="10" aria-hidden="true"><path class="a" d="M0 0 L10 10 L20 0"/><path class="b" d="M0 0 L10 10 L20 0"/><path class="c" d="M-1 -3 L21 -3 L21 0 L10 9 L-1 0 Z"/></svg>');
    this.preview_events();

    this.time_field = el("input", { id: "time", className: "time", type: "text", title: "Time shown, h:mm:ss" });
    if (document.fonts) document.fonts.ready.then(() => { this.time_zeros = null; this.sync_time(); });      // Dial Time arrived: measure the time's ink again
    this.time_field.onchange = () => { const t = parse_time(this.time_field.value, this.S.t >= 43200); if (t !== null) this.set_time(t); else this.sync_time(); this.time_field.value = fmt_time(this.S.t); };      // "15:20" reads back as 3:20:00, PM
    // which half of the day: the hands can't say, an am · pm window can (it follows the time shown). Typing "15:20" or "3:20 pm" sets it too.
    this.half_button = el("button", { type: "button", id: "ampm", className: "half", title: "Morning or afternoon: an am · pm window follows it", onclick: () => this.set_time((this.S.t + 43200) % 86400) });
    // the date (4.62; Okay, 18 Oct 2026: "Date best set at the bar, short date, 07/10/28 style, stacked barlow medium or
    // bold, next to am, touching. Default from system date"): day, month and year stacked, touching AM · PM. A press opens
    // the system's date picker (an input under it, unseen); a date or day window that follows the date shows it. Until a
    // date is picked it is today's, wherever the dial is opened (S.date ""); Now brings today back.
    this.date_button = el("button", { type: "button", id: "date", className: "date", title: "The day the dial shows: a window that follows the date shows it" });
    this.date_lines = [el("span"), el("span")];      // day over month: the year left out (4.82; Okay, 19 Oct 2026: "i don't want it there"); the picker still sets it
    this.date_button.append(...this.date_lines);
    this.date_pick = el("input", { type: "date", id: "date-pick", className: "datepick", tabIndex: -1, ariaLabel: "The day the dial shows" });
    this.date_pick.onchange = () => { this.set_value("global", "date", this.date_pick.value || ""); this.date_pop_sync(); };
    // a press on the date opens its popup (4.89; Okay, 19 Oct 2026: "Date on the black bar is click to edit on popup.
    // Plusminus for both. No controller"): the day written out between − and + (a day each), the time between its − and +
    // (an hour each); a press on the day opens the system's date picker. In Barlow Regular ("Try barlow not condensed").
    this.date_button.onclick = () => this.date_pop_open(!this.date_pop || this.date_pop.hidden);
    const time_box = el("span", { className: "timebox" }, el("span", { className: "timewell" }, this.time_field), this.half_button, el("span", { className: "datewell" }, this.date_button, this.date_pick, this.date_pop_box()));
    this.time_slider = el("input", { id: "time-slider", type: "range", min: 0, max: 43199, step: 1 });
    this.time_slider.oninput = () => this.set_time(+this.time_slider.value + this.half());
    this.play_button = el("button", { type: "button", className: "icon play", id: "play", onclick: () => this.play(!this.playing) });
    this.status = el("div", { className: "status" });      // what is selected, the size, the build time: kept, not shown (Okay, 14 Oct 2026, 23:19: "hide it")
    // the bar, in two parts: time (play, how fast, the time and its half of the day, now, the day slider) · view
    // (how to zoom, zoom out, in, fit). The panel's square left the bar (Okay, 14 Oct 2026, 23:19: it "doesn't work
    // anyway"; build list #190)
    this.speed = 1;
    this.speed_slider = el("input", { id: "speed", type: "range", min: 0, max: 1000, step: 1, ariaLabel: "How fast time runs", title: "How fast time runs: 0.1× to 720×" });
    // while the speed is being changed its name over the thumb is a pill (#283): a press on the track
    // until it is let go; a key, for a moment
    let sliding = 0, pressing = false;
    const slide = (on) => { clearTimeout(sliding); this.speed_name.classList.toggle("sliding", on); if (on && !pressing) sliding = setTimeout(() => slide(false), 900); };
    this.speed_slider.oninput = () => {      // (set_speed puts the rider over the thumb, and a slow speed's thumb onto its step)
      this.set_speed(speed_at(+this.speed_slider.value / 1000, this.speed_split()));
      slide(true);
    };
    this.speed_slider.onpointerdown = () => { pressing = true; slide(true); };
    this.speed_slider.onpointerup = this.speed_slider.onpointercancel = () => { pressing = false; slide(false); };
    // no words for the speed in the box any more (Okay, 15 Oct 2026, 00:18: "Remove 1x next to red button"): the slider
    // tells a screen reader its speed (aria-valuetext); the eye has the ball at 1× and where the thumb stands
    this.one_knob = el("i", { className: "knob one" });      // 1×, now that slow motion stands before it: a dot on the line (Okay, 16 Oct 2026, on 4.44: "1x needs a dot")
    const humps = el("span", { className: "humps", ariaHidden: "true" }, el("i", { className: "knob first" }), this.one_knob, el("i", { className: "knob last" }));
    // its two ends named in the bar's grey, 0.1X and 720X (Okay, 15 Oct 2026, 01:59: "denote them 1x and 720x with the bar's gray"; 0.1X since #283)
    for (const [at, word] of [[0, SPEED_SLOW[0] + "X"], [1, SPEED_HI + "X"]]) { const name = el("span", { className: "humpname end", textContent: word }); name.style.setProperty("--at", at); humps.append(name); }
    // the speed's name rides over the thumb, the one white thing on the bar: how many X (Okay, 15 Oct 2026, 01:08: "1X
    // follows the dot. Indicates how many Xs"; 01:59: "It is the only white thing there")
    this.speed_name = el("span", { className: "humpname rider", ariaHidden: "true" });
    humps.append(this.speed_name);
    this.speeds = el("span", { className: "speeds" }, el("span", { className: "speedtrack" }, humps, this.speed_slider));
    const view = (id, title, inside, act) => { const b = el("button", { type: "button", className: "icon", id, title, ariaLabel: title, onclick: act }); b.innerHTML = icon(inside); return b; };
    const middle = () => [this.svg.clientWidth / 2, this.svg.clientHeight / 2];
    // the day: the slider, and under it the steps a click snaps to — the twelve hours
    const steps = el("div", { className: "steps12" });
    for (const [t, text] of DAY_STEPS) {
      const b = el("button", { type: "button", textContent: text, title: `${text} o’clock`, onclick: () => this.set_time(t + this.half()) });
      b.style.setProperty("--at", t / 43200);
      b.dataset.t = t;
      steps.append(b);
    }
    // the day under a finger or the pointer, read by the tool itself (Okay, 18 Oct 2026, notes 2: "On ipad scrubbing time
    // does not work now"; "Ruler pin does not move on bottom bar"): the slider stays for the keyboard and a screen reader,
    // but presses go to the strip around it, which turns the press's place into the time — the same in every browser,
    // where an iPad's own range control was not. A press that doesn't move goes to the nearest step, as before.
    const at_x = (x) => { const r = this.time_slider.getBoundingClientRect(), THUMB = 3; return Math.round(clamp((x - r.left - THUMB / 2) / (r.width - THUMB), 0, 1) * 43199); };
    let pressed = null;
    const scrub = (e) => { if (!pressed) return; if (Math.abs(e.clientX - pressed.x) > 3) pressed.moved = true; if (pressed.moved) this.set_time(at_x(e.clientX) + this.half()); };
    this.day_strip = (strip) => {
      strip.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || e.target.closest(".steps12 button")) return;      // the hour steps under it are buttons of their own
        pressed = { x: e.clientX, id: e.pointerId, moved: false };
        strip.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      strip.addEventListener("pointermove", scrub);
      const up = (e) => {
        if (!pressed || e.pointerId !== pressed.id) return;
        if (!pressed.moved && e.type === "pointerup") { const t = at_x(e.clientX); this.set_time([...this.day_ticks, 10 * 3600 + 600].reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best)) + this.half()); }
        pressed = null;
      };
      strip.addEventListener("pointerup", up);
      strip.addEventListener("pointercancel", up);
    };
    // the needle: the time on the ruler, a red line one point wide from the ruler's top to the screen's foot, placed by
    // the tool from the time itself, whatever has the focus (notes 2: "The moving needle is 1px wide and red, starts from
    // the bottom of the screen unlike the ruler which has room below"); the slider's own thumb is not drawn
    this.needle = el("span", { className: "needle", ariaHidden: "true" });
    // the ruler behind the slider: a line with ticks crossing it. The wider the window, the finer it is cut.
    this.ruler = svg_el("svg");
    this.ruler.setAttribute("class", "ruler");
    this.ruler.setAttribute("aria-hidden", "true");
    this.day_ticks = DAY_STEPS.map((x) => x[0]);
    this.watchers = [new ResizeObserver(() => this.draw_ruler())];      // closed with the tool (close)
    this.cleanups = [];                            // listeners on the document or the window, taken off with the tool (listen)
    this.watchers[0].observe(this.time_slider);
    this.watchers.push(new ResizeObserver(() => this.set_speed(this.speed)));      // the slow steps' share of the track follows its width
    this.watchers.at(-1).observe(this.speed_slider);
    // Fit: a word button padded like NOW and AM; the magnifier stands alone before it, between the zoom steps and FIT
    // (#315, 4.51.1; Okay, 17 Oct 2026: "icon moves out of the fit box, sits in between plusminus and fit, the horizontal
    // padding like now and am"). Inside the button at its word's left from 15 Oct to 4.51.
    const fit_button = el("button", { type: "button", id: "fit", className: "fit", title: "Show the whole page" }, el("span", { textContent: "Fit" }));
    fit_button.onclick = () => { this.fit(); this.render(); };
    // the magnifier: first, before − + FIT, which stand together; how to zoom and move is in its tag, under the pointer
    // (Okay, 18 Oct 2026, notes 2: "The magnifying glass moves to the left before minus, plus and fit snap together …
    // Hovering on the mag. glass tells these details. Remove details from the left").
    const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
    const zoom_sign = el("span", { className: "zoomsign", tabIndex: 0, role: "note", ariaLabel: "How to zoom and move" });
    zoom_sign.dataset.tip = touch ? "Pinch to zoom · two fingers move" : "Scroll zooms · right-drag moves · two fingers pinch and move";      // Okay, 23 Oct 2026
    zoom_sign.innerHTML = icon(TOOL_ICONS.zoominfo);
    // on a phone − and + are not on the bar: a tap on the magnifier opens a popup with the note and − + (#445; Okay, 20 Oct
    // 2026, 00:34: "Zoom popup has plus minus in the tooltip with note. On mobile"), as the date's (barpop); elsewhere a
    // tap shows the tag a moment (a finger has no hover)
    const zstep = (sign) => el("button", { type: "button", className: "popstep", innerHTML: sign < 0 ? STEP.minus : STEP.plus, ariaLabel: sign < 0 ? "Zoom out" : "Zoom in", onclick: () => { this.zoom(sign < 0 ? 1 / 1.4 : 1.4, middle()); this.render(); } });
    const zoom_pop = el("div", { className: "barpop zoompop", id: "zoom-pop", hidden: true },
      el("div", { className: "popline" }, el("span", { className: "popword", textContent: zoom_sign.dataset.tip }), el("span", { className: "popsteps" }, zstep(-1), zstep(1))));
    const zoom_away = (e) => { if (!zoom_pop.contains(e.target) && !zoom_sign.contains(e.target)) { zoom_pop.hidden = true; document.removeEventListener("pointerdown", zoom_away, true); } };
    zoom_sign.onclick = () => {
      if (this.pop_is_sheet()) { zoom_pop.hidden = !zoom_pop.hidden; if (!zoom_pop.hidden) document.addEventListener("pointerdown", zoom_away, true); return; }
      this.tag_show(zoom_sign); clearTimeout(this.zoom_tip); this.zoom_tip = setTimeout(() => this.tag_hide(), 2400);
    };
    const bar = el("footer", { className: "bar" },
      el("div", { className: "lead" }, this.play_button, this.speeds, time_box,
        el("button", { type: "button", id: "now", textContent: "Now", title: "The time it is now", onclick: () => this.to_now() })),
      this.day_box = el("div", { className: "group day" }, this.ruler, this.time_slider, steps, this.needle),
      el("div", { className: "group viewing" }, this.status, el("span", { className: "zoomwell" }, zoom_sign,
        zoom_pop, el("span", { className: "zooms" },
          view("zoom-out", "Zoom out", SIGNS.minus, () => { this.zoom(1 / 1.4, middle()); this.render(); }),
          view("zoom-in", "Zoom in", SIGNS.plus, () => { this.zoom(1.4, middle()); this.render(); }),
          fit_button))));
    this.set_speed(1);
    const guides = this.guides_box();
    // on the preview: undo · redo top left, beside the panel (Okay, 13 Oct 2026) · Tiny Preview bottom right (#337) · bottom left: Backdrop, Shadows
    // a note on the preview (R17, R31: an old link): a dark pill under the header's line; a press puts it away, and so
    // does the first change to the dial
    this.note = el("button", { type: "button", className: "previewnote", id: "preview-note", hidden: true, title: "Put this note away", onclick: () => { this.note.hidden = true; } });
    // the top right corner, one column, top to bottom: Guides (its list dropping), the case and (with a case) its strap,
    // X-ray (4.86; Okay, 19 Oct 2026, 12:46: "Guides case and xray move top right corner of the canvas, stacked in that
    // order")
    const corner = el("div", { className: "corner" }, guides, ...this.case_box(), this.xray_box());
    this.main = el("main", {}, this.svg, this.tip, this.note, this.undo_box(), this.tiny_box(), corner, this.shadows_box(), this.backdrop_box(), this.eye_box);
    this.day_strip(this.day_box);
    root.append(panel, this.main, bar, this.build_picker(), this.build_pop());
    root.append(this.sheet());      // a phone's gripper, on the drawer's top line
    requestAnimationFrame(() => this.level_title());
    this.play_icon();
    this.watchers.push(new ResizeObserver(() => this.resized()));
    this.watchers.at(-1).observe(this.svg);
    // the bar's height, for the rows that make room for it (a phone; the showcase closes its row): kept while it is in place
    this.watchers.push(new ResizeObserver(() => { if (bar.offsetHeight) root.style.setProperty("--bar-h", bar.offsetHeight + "px"); }));
    this.watchers.at(-1).observe(bar);
    requestAnimationFrame(() => this.words_unfold());      // the page opens with the switches' words out, then folds them (#518: "load with animation")
  }

  /** the clock to the time it is now (the bar's Now) */
  to_now() { const d = new Date(); if (this.S.date) this.set_value("global", "date", ""); this.set_time(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000); }

  /** something is moving: the panel sliding. The shadows' soft edge waits for it to stop (Okay, 04:59 and 05:09: "blur off on all animations") */
  moving() { return Boolean(this.sliding); }

  unit() { return G.UNITS[this.S.ui_unit] || G.UNITS[0]; }

  /** a length in mm → the text of it in the chosen unit. */
  in_unit(mm, places) { const u = this.unit(); return (mm * u[2]).toFixed(Math.max(0, places + u[3])); }      // thou takes a decimal away: never fewer than none

  /** a listener on the document or the window that belongs to this tool: taken off when the tool closes */
  listen(target, type, fn, options) { target.addEventListener(type, fn, options); this.cleanups.push(() => target.removeEventListener(type, fn, options)); }

  /** this tool is being replaced (reopen): stop everything it still has running, so it can't draw or
   *  save over the new one. */
  close() {
    this.closed = true;
    this.playing = false;
    this.value_pop_close();                        // a controller left open would outlive the dial it was for, standing over the new panel (found 18 Oct 2026, 4.52)
    for (const t of ["saving", "merge_wait", "hole_timer", "guides_timer", "words_timer", "zoom_tip", "info_tip", "copied_back"]) clearTimeout(this[t]);      // nothing of this tool fires into the next one's window
    for (const w of this.watchers) w.disconnect();
    for (const off of this.cleanups) off();      // a document or window listener of this tool would otherwise live on, one more per dial opened (#542i)
    if (this.menus_list) { this.menu_list_close(); this.menus_list.remove(); }      // the one list and the one tag stand on the body, outside #app: they go with their tool (found 25 Oct 2026: one more of each per dial opened)
    if (this.tag) this.tag.remove();
  }

  /** start again with new settings (the simplest way to update every control). */
  reopen(settings) {
    // the window is built again for the new dial: it keeps where it was scrolled, so a Gallery card pressed stays under
    // the finger (Okay, 15 Oct 2026, 11:49: "Found the real jumper: selecting a gallery watch" — measured: the form went
    // back to its top, the Gallery 550 points down, out of sight)
    const panel = $(".panel"), keep = { form: this.form ? this.form.scrollTop : 0, panel: panel ? panel.scrollTop : 0, scrolls: { ...this.scrolls, ...(this.section_shown ? { [this.section_shown]: this.form.scrollTop } : {}) } };
    this.close();
    const fonts = this.catalog;
    tool = new DialTool(settings);
    for (const [ps, f] of fonts) if (!tool.catalog.has(ps)) tool.catalog.set(ps, f);
    tool.load_fonts_in_use();
    window.dial_tool = tool;
    tool.scrolls = keep.scrolls;
    let frames = 0;                                // on a phone or an iPad held upright, which part scrolls is settled a few frames later (.held): try until both stand
    const back = () => {
      const p = $(".panel");
      tool.form.scrollTop = keep.form;
      if (p) p.scrollTop = keep.panel;
      if (++frames < 20 && (Math.abs(tool.form.scrollTop - keep.form) > 1 || (p && Math.abs(p.scrollTop - keep.panel) > 1))) requestAnimationFrame(back);
    };
    back();
  }

  /** undo and redo on the preview, top right, before the Guides switch (Okay, 13 Oct 2026): two outlined buttons,
   *  like the switches there; pale when there is nothing to go back or forward to. */
  undo_box() {
    const make = (id, title, way, d) => { const b = el("button", { type: "button", className: "onview undobox", id, title, ariaLabel: title, onclick: () => this.undo(way) }); b.innerHTML = icon(d); return b; };
    this.undo_buttons = [make("undo", "Undo (⌘Z)", -1, TOOL_ICONS.undo), make("redo", "Redo (⇧⌘Z)", 1, TOOL_ICONS.redo)];
    // the steps, named (#172): a third box joined to the two, its chevron the Guides' one; pressed, the steps drop under
    // it, the newest first — the ones redo would bring back faint over a line, the ones undo would take back under it.
    // A press on a step goes back (or forward) to just before it. Function first: its look is to be designed with Okay
    const more = el("button", { type: "button", className: "onview undobox historymore", id: "history-more", title: "The steps, named", ariaLabel: "The steps, named" });
    more.innerHTML = icon(SIGNS.down);
    more.setAttribute("aria-expanded", "false");
    this.history_more = more;
    const list = el("div", { className: "historylist", id: "history-list", hidden: true });
    const open = (on) => {
      list.hidden = !on; more.setAttribute("aria-expanded", String(on));
      if (!on) return;
      this.take_step();
      const all = [...HISTORY.past, HISTORY.now, ...HISTORY.future.slice().reverse()], here = HISTORY.past.length, SHOWN = 20;
      const line = (i) => {      // the step from state i-1 to state i; going to it is |here - i| undos or redos
        const done = i <= here, way = done ? -1 : 1, times = done ? here - i + 1 : i - here;
        const b = el("button", { type: "button", className: `histitem${done ? "" : " ahead"}`, textContent: step_name(all[i - 1], all[i]),
          title: done ? `Undo this and the ${times - 1 || "no"} after it` : `Redo up to this`, onclick: () => { for (let k = 0; k < times; k++) this.undo(way); open(true); } });
        return b;
      };
      const ahead = [], back = [];
      for (let i = all.length - 1; i > here && ahead.length < SHOWN; i--) ahead.push(line(i));
      for (let i = here; i > 0 && back.length < SHOWN; i--) back.push(line(i));
      list.replaceChildren(...ahead, el("div", { className: "nowline", textContent: "Now" }), ...(back.length ? back : [el("p", { className: "quiet", textContent: "Nothing to undo yet." })]));
    };
    more.onclick = () => { if (more.classList.contains("none") && list.hidden) return; open(list.hidden); };
    this.history_open = open;
    this.sync_undo();
    return el("span", { className: "undos" }, el("span", { className: "undopair" }, ...this.undo_buttons, more, list), this.versions_box());
  }

  sync_undo() {
    if (!this.undo_buttons) return;
    [HISTORY.past, HISTORY.future].forEach((steps, i) => { this.undo_buttons[i].classList.toggle("none", !steps.length); this.undo_buttons[i].setAttribute("aria-disabled", String(!steps.length)); });
    // the steps' chevron: pale as they are when there is no step either way (#481: "If undo redo is unclickable, versions
    // and chevron are not clickable too, right?"); Versions stays live, its saved dials are not steps
    const none = !HISTORY.past.length && !HISTORY.future.length;
    if (this.history_more) { this.history_more.classList.toggle("none", none); this.history_more.setAttribute("aria-disabled", String(none)); if (none && this.history_open && this.history_more.getAttribute("aria-expanded") === "true") this.history_open(false); }
    // each says what it would undo or redo (#172), named when pointed at
    this.undo_buttons[0].title = HISTORY.past.length && HISTORY.now ? `Undo ${step_name(HISTORY.past.at(-1), HISTORY.now)} (⌘Z)` : "Undo (⌘Z)";
    this.undo_buttons[1].title = HISTORY.future.length && HISTORY.now ? `Redo ${step_name(HISTORY.now, HISTORY.future.at(-1))} (⇧⌘Z)` : "Redo (⇧⌘Z)";
  }

  /** the dial has changed and stood still: that is one step to undo. */
  take_step() {
    const now = dial_text(this.S);
    if (!this.note.hidden && now !== this.note_for) this.note.hidden = true;      // the dial changed since the note: it is said
    if (HISTORY.now === null) HISTORY.now = now;
    this.sync_undo();
    if (now === HISTORY.now) return;
    HISTORY.past.push(HISTORY.now);
    if (HISTORY.past.length > HISTORY.most) HISTORY.past.shift();
    HISTORY.now = now;
    HISTORY.future = [];
    this.sync_undo();
  }

  /** a note on the preview, as well as the log's line (R17). */
  say(text) {
    this.note.textContent = text;
    this.note.hidden = false;
    this.note_for = dial_text(this.S);
  }

  /** one step back (-1) or forward again (1). The time shown and the window's state stay as they are. */
  undo(way) {
    const field = document.activeElement;
    if (field && field.matches && field.matches("input, textarea, select")) field.blur();      // what is being typed counts as a change first
    this.take_step();
    const [from, to] = way < 0 ? [HISTORY.past, HISTORY.future] : [HISTORY.future, HISTORY.past];
    if (!from.length) return this.log(way < 0 ? "nothing to undo" : "nothing to redo");
    to.push(HISTORY.now);
    HISTORY.now = from.pop();
    const keep = Object.fromEntries(Object.entries(this.S).filter(([key]) => key === "t" || key.startsWith("ui_")));
    this.S = G.fresh_settings({ ...JSON.parse(HISTORY.now), ...keep });
    this.S.ui_ring = clamp(this.S.ui_ring, 0, this.S.rings.length - 1);
    this.static_dirty = true;
    this.scale_from = null;
    this.value_pop_close();                        // the controller goes with the controls it stood over (found 25 Oct 2026: left on the page, its row gone)
    this.show_section();                           // every control from the settings again
    this.load_fonts_in_use();
    this.render();
    this.sync_undo();
    this.log(way < 0 ? `undone: ${step_name(HISTORY.now, HISTORY.future.at(-1))} · ${HISTORY.past.length} more` : `redone: ${step_name(HISTORY.past.at(-1), HISTORY.now)} · ${HISTORY.future.length} more`);
  }

  /** shortly after the last change: keep the session, take a step for undo, and bring the link box up to date.
   *  Every frame asks; a change to the dial starts the wait again (one drag of a slider is one step), but frames that
   *  only move the time leave a waiting save alone and keep the session every 2 s — so while time plays, changes are
   *  kept and the address follows (#234: they waited for time to stop). */
  autosave() {
    const dial = dial_text(this.S), changed = dial !== this.saved_dial;
    if (this.saving && !changed) return;            // only the time moved: the save already waiting goes ahead
    clearTimeout(this.saving);
    this.saved_dial = dial;
    this.saving = setTimeout(async () => {
      this.saving = null;
      if (this.closed) return;
      this.take_step();
      keep_and_shorten(this.S);
      this.show_link().catch((e) => this.log(`couldn’t write the link: ${e.message}`));      // R17: packing (CompressionStream) failing is said, not lost
    }, changed ? 400 : 2000);
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
Object.assign(DialTool.prototype, PANEL, RINGS, HANDS, WINDOWS, COLOUR, FONTS, PREVIEW, GUIDES, BAR, CARDS, EXPORT, MODE);      // the parts, in the window's order: left to right, top to bottom

let tool = null;

export async function open_window(pathkit, harfbuzz, font_bytes) {
  G.start(pathkit, harfbuzz); attach_watch(pathkit);
  G.add_font(font_bytes, 0, true);                 // the page's own font: stands in until yours are loaded
  const set = await unpack_set(location.hash);    // a set of dials (#523): looked at over the last session, nothing kept unasked
  const linked = await unpack(location.hash);      // a dial in the address comes first…
  let settings = linked?.settings ?? (linked?.old !== undefined ? structuredClone(OPENER) : null);      // (a link of an older scheme: the First dial, R31)
  let from = linked && !linked.bad ? null : "no last session in this browser";      // where the dial came from, said in the log (R17: a dial drawn from the opener is never silent); after an unreadable link too
  if (!settings) { try { settings = JSON.parse(localStorage.getItem(LAST)); if (settings) from = "the last session"; } catch (e) { settings = null; from = `couldn’t read the last session (${e.message})`; } }   // …then the last session…
  if (!settings) settings = structuredClone(OPENER);      // …then the opener: the guide's First dial (opener.js; 16 Oct 2026)
  tool = new DialTool(settings);
  if (from) tool.log(from === "the last session" ? "opened the last session" : `${from}: the First dial`);
  const opened = (link) => {
    if (link.settings) { tool.log("opened the dial in the address"); return; }
    if (link.bad) { tool.log(`${BAD_LINK_NOTE} (${location.hash.length - 1} characters after #)`); tool.say(BAD_LINK_NOTE); return; }
    tool.log(`${OLD_LINK_NOTE} (link scheme ${link.old}; this Dial Tool reads scheme ${G.LINK_SCHEME})`);
    tool.say(OLD_LINK_NOTE);
  };
  if (linked) { opened(linked); keep_and_shorten(tool.S); }
  const set_opened = (got) => {
    if (got.dials) tool.look_at_set(got.dials); else { tool.log(`${OLD_SET_NOTE} (link scheme ${got.old})`); tool.say(OLD_SET_NOTE); }
    keep_and_shorten(tool.S);
  };
  if (set) set_opened(set);
  window.addEventListener("hashchange", async () => {              // another dial's link pasted into this tab
    const got = await unpack_set(location.hash);
    if (got) return set_opened(got);
    const next = await unpack(location.hash);
    if (!next) return;
    if (next.bad) return opened(next);           // the dial that is open stays; the note says why
    tool.reopen({ ...(next.settings ?? structuredClone(OPENER)), ui_section: tool.S.ui_section });
    opened(next);
    keep_and_shorten(tool.S);
  });
  tool.sync_time();
  start_ink();                                     // short labels in boxes, centred on their ink (ink.js)
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
