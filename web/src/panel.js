// panel.js — the panel's workings: sections shown, panes folded, every row built from its data (build_row) and kept
// in step with the settings (sync_rows), the number controller (value_pop_*, R15), the names that open it, the tags,
// the tool's own menu list and the unit box.

import * as G from "./geometry.js";

import { OPENER } from "./opener.js";
import { BIG, SIGNS, STEP, TOOL_ICONS, eye, icon, pic } from "./icons.js";
import { $, HOLE_LIVE_MS, KEY, POP_FADE_MS, POP_LINGER_MS, SHEET, WORDS_MS, clamp, css_colour, decimals, el, filled, fmt, is_length, label_of, paint, parse_number, round_step, to_hex } from "./ui.js";
import { ROWS, SECTIONS, SVG_LATER, TILE_WORDS, chevron_box, menu_arrow } from "./rows.js";

export const PANEL = {
  /** how to zoom, beside the zoom buttons: words, then a faint magnifier, nothing to press (Okay, 14 Oct 2026,
   *  23:19: "say cmd+scroll is zoom in out attached to the zoom area. Put a magnifier icon at the end"; 23:26: "at the
   *  end, not a button, faint"). On a screen without a pointer the words say what a finger does. */
  /** the switches on the preview show only their signs; a press on the empty canvas, and the page opening, unfold their
   *  words for WORDS_MS, then they fold back (Okay, 15 Oct 2026, 06:20: "hide labels until backdrop tap"; 24 Oct 2026,
   *  #518: "All canvas buttons, labels default hidden. Like on mobile, load with animation"; the extended-button
   *  pattern: a label that folds back to its sign). Under a pointer the word shows too (the stylesheet) */
  words_unfold() {
    this.main.classList.add("words");
    clearTimeout(this.words_timer);
    this.words_timer = setTimeout(() => this.main.classList.remove("words"), WORDS_MS);
  },

  /** a phone: the drawer under the preview (the panel) takes as much of the screen as its gripper is dragged to; a tap
   *  on the gripper jumps between two heights (SHEET). Remembered by this browser. When the drawer is tall enough for
   *  its title, tabs and pinned panes and some room to scroll (SHEET.room), those stay put and only the rest scrolls,
   *  as on a wider screen (.held); shorter, the whole drawer scrolls (Okay, 15 Oct 2026, 06:20: "on mobile bottom menu
   *  should be height adjustable… simple gripper mid top line dot, grey as the line it sits upon") */
  sheet() {
    const app = $("#app"), grip = el("div", { className: "sheetgrip", id: "sheet-grip", title: "Drag to make the drawer taller or shorter", ariaLabel: "Drawer height" });
    grip.setAttribute("role", "separator");
    const set = (share) => { this.sheet_share = share; app.style.setProperty("--preview-share", (share * 100).toFixed(2) + "%"); };
    try { const kept = parseFloat(localStorage.getItem(KEY("sheet"))); if (kept > 0 && kept < 1) set(kept); } catch (e) { /* not kept */ }
    const limits = () => { const h = app.clientHeight, bar = $(".bar").offsetHeight; return [SHEET.preview / h, (h - bar - SHEET.drawer) / h]; };
    let down = null;
    grip.onpointerdown = (e) => { grip.setPointerCapture(e.pointerId); down = { y: e.clientY, moved: false }; this.fitted = true; app.classList.add("gripping"); };
    grip.onpointermove = (e) => {
      if (!down) return;
      if (Math.abs(e.clientY - down.y) > 4) down.moved = true;
      if (!down.moved) return;
      const [lo, hi] = limits(), top = app.getBoundingClientRect().top, bar = $(".bar").offsetHeight;
      set(clamp((e.clientY - top - bar) / app.clientHeight, lo, hi));
    };
    grip.onpointerup = grip.onpointercancel = (e) => {
      if (!down) return;
      if (!down.moved && e.type === "pointerup") { const [lo, hi] = limits(), now = this.sheet_share ?? SHEET.shares[0]; set(clamp(Math.abs(now - SHEET.shares[0]) < 0.02 ? SHEET.shares[1] : SHEET.shares[0], lo, hi)); }
      down = null;
      app.classList.remove("gripping");
      try { localStorage.setItem(KEY("sheet"), String(this.sheet_share)); } catch (er) { /* not kept */ }
    };
    // tall enough to hold its top still? measured whenever the drawer or its pinned part changes size
    const panel = $(".panel"), hold = () => {
      const narrow = matchMedia("(max-width: 860px)").matches, parts = [this.tabs, this.pinned].filter(Boolean);
      const top = head_full() + parts.reduce((sum, x) => sum + (x.hidden ? 0 : x.offsetHeight), 0);      // the title line counted at its full height, so squeezing it never tips the drawer into holding
      panel.classList.toggle("held", narrow && panel.clientHeight - top >= SHEET.room);
    };
    // a phone (8-narrow.css): at the drawer's top its title line is full, with the Gallery pill and the unit box; once it
    // scrolls, the line squeezes (.squeezed) and stays on top, the tabs held under it (.stuck); back at the very top it is
    // full again (Okay, 15 Oct 2026, 07:59: "this squeezed state is persistent. However, the big size with mm… comes up
    // when the user loads the page first or scrolls back all the way. Gallery hides together with mm. Only mobile").
    // Squeezed past 32 px, full again only at 0: the line's own 24 px can't tip it back and forth
    const head = panel.querySelector(":scope > header"), form = panel.querySelector(".form");
    let full_h = 0;
    const head_full = () => (panel.classList.contains("squeezed") && full_h) || (full_h = head.offsetHeight);
    const squeeze = () => {
      const held = panel.classList.contains("held"), top = held ? form.scrollTop : panel.scrollTop;
      if (top > 32) panel.classList.add("squeezed");
      else if (top < 1) panel.classList.remove("squeezed");
      panel.classList.toggle("stuck", !held && panel.classList.contains("squeezed"));
    };
    panel.addEventListener("scroll", squeeze, { passive: true });
    form.addEventListener("scroll", squeeze, { passive: true });
    this.watchers.push(new ResizeObserver(hold));
    this.watchers.at(-1).observe(panel);
    this.watchers.at(-1).observe(this.pinned);
    return grip;
  },

  /** one line runs through the top of the window (Okay, 13 Oct 2026): the middle of the title's small letters (its
   *  x-height), the unit box, and undo · Guides on the preview. The boxes are centred on the header's middle by the
   *  stylesheet; the title is moved onto it here, because where a font's small letters sit can only be measured. */
  level_title() {
    const h = this.title.querySelector("h1"), look = getComputedStyle(h);
    this.title.style.translate = "";
    const probe = el("span");                      // an empty box in the line stands on the baseline
    probe.style.cssText = "display:inline-block;width:0;height:0";
    h.append(probe);
    const baseline = probe.getBoundingClientRect().top;
    probe.remove();
    const pen = document.createElement("canvas").getContext("2d");
    pen.font = `${look.fontWeight} ${look.fontSize} ${look.fontFamily}`;
    const x_height = pen.measureText("x").actualBoundingBoxAscent;
    const header = this.title.closest("header").getBoundingClientRect();
    if (!header.height || !x_height) return;
    this.title.style.translate = `0 ${(header.top + header.height / 2 - (baseline - x_height / 2)).toFixed(2)}px`;
    // the mark: its ring centred on the middle of the title's capitals, so it reaches as far above them as below the
    // baseline (Okay, 15 Oct 2026, 04:26: "align icon better"; it was on the header's middle, a point low)
    const logo = $("#logo"), cap = pen.measureText("D").actualBoundingBoxAscent, moved = header.top + header.height / 2 - (baseline - x_height / 2);
    if (logo && cap) { logo.style.translate = ""; const r = logo.getBoundingClientRect(); logo.style.translate = `0 ${(baseline + moved - cap / 2 - (r.top + r.height / 2)).toFixed(2)}px`; }
    // the Gallery pill and the unit box: their words on the title's baseline, as Help's are (Okay, 16 Oct 2026: "same
    // baseline"). Each is moved as a whole (its menu with it); one that isn't shown (a phone's squeezed line) stays put
    for (const box of document.querySelectorAll(".panel > header :is(.galleryway, .unit)")) {
      box.style.translate = "";
      const word = box.querySelector("button .word") || box.querySelector("button"), dot = el("span");      // the unit box: its word's own line
      dot.style.cssText = "display:inline-block;width:0;height:0";
      word.append(dot);
      const at = dot.getBoundingClientRect();
      dot.remove();
      if (at.height === 0 && at.top === 0) continue;
      const dots = window.devicePixelRatio || 1;
      box.style.translate = `0 ${Math.round((baseline + moved - at.top) * dots) / dots}px`;      // in whole screen dots: a hairline box stays crisp (the unit box, #302)
    }
  },

  /** a menu's list (menu_press): its choices as the unit box's list is drawn (.unitmenu), under the menu's box — over it
   *  when the room is above — at least as wide, scrolled to the chosen one. A choice sets the menu and tells it, as the
   *  browser's list would (a change event); a press elsewhere or Escape puts it away. One list for every menu (R34). */
  menu_list(select) {
    let list = this.menus_list;
    if (!list) {
      list = this.menus_list = el("div", { className: "unitmenu floating", id: "menu-list", hidden: true });
      list.setAttribute("role", "listbox");
      document.body.append(list);
      this.menus_away = (e) => { if (!list.contains(e.target) && e.target !== this.menus_for) this.menu_list_close(); };
      list.onkeydown = (e) => {
        if (e.key === "Escape") { e.preventDefault(); const s = this.menus_for; this.menu_list_close(); if (s) s.focus(); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {      // the arrows walk the list, as the browser's did
          e.preventDefault(); const items = [...list.children], at = items.indexOf(document.activeElement);
          items[clamp(at + (e.key === "ArrowDown" ? 1 : -1), 0, items.length - 1)]?.focus();
        }
      };
    }
    if (!list.hidden && this.menus_for === select) return this.menu_list_close();
    this.menus_for = select;
    const items = [...select.options].filter((o) => !o.hidden && !o.disabled).map((o) => {
      const b = el("button", { type: "button", role: "option", className: o.selected ? "on" : "", textContent: o.textContent });
      b.setAttribute("aria-selected", String(o.selected));
      b.onclick = () => { this.menu_list_close(); if (select.value !== o.value) { select.value = o.value; select.dispatchEvent(new Event("change", { bubbles: true })); } };
      return b;
    });
    list.replaceChildren(...items);
    list.hidden = false;
    const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit"));      // the stylesheet's unit: a unit off the box and the window's edges
    const box = (select.closest(".menubox, .popgroup, .casebox, .menulabel") || select.parentElement || select).getBoundingClientRect();
    const room_below = innerHeight - box.bottom, room_above = box.top, up = room_below < Math.min(list.scrollHeight, 240) && room_above > room_below;
    list.style.minWidth = `${Math.round(box.width)}px`;
    list.style.maxHeight = `${Math.floor((up ? room_above : room_below) - 2 * u)}px`;
    list.style.left = `${Math.round(Math.max(u, Math.min(box.left, innerWidth - list.offsetWidth - u)))}px`;
    list.style.top = up ? "" : `${Math.round(box.bottom + u)}px`;
    list.style.bottom = up ? `${Math.round(innerHeight - box.top + u)}px` : "";
    const on = list.querySelector(".on");
    if (on) { list.scrollTop = on.offsetTop - (list.clientHeight - on.offsetHeight) / 2; on.focus({ preventScroll: true }); }
    document.addEventListener("pointerdown", this.menus_away, true);
  },

  menu_list_close() {
    if (this.menus_list) this.menus_list.hidden = true;
    this.menus_for = null;
    if (this.menus_away) document.removeEventListener("pointerdown", this.menus_away, true);
  },

  unit_box() {
    const menu = el("div", { className: "unitmenu", id: "unit-menu", hidden: true });
    menu.setAttribute("role", "menu");
    this.unit_button = el("button", { type: "button", className: "unitbox", id: "unit", title: "The unit lengths are shown in" });
    this.unit_button.setAttribute("aria-haspopup", "menu");
    if (document.fonts) document.fonts.load('10px "Dial Mono"').then(() => this.size_unit(), () => {});      // measured again once Dial Mono is in (fonts.ready can come before a face is even asked for)
    const open = (on) => { menu.hidden = !on; this.unit_button.setAttribute("aria-expanded", String(on)); };
    this.unit_open = open;
    this.unit_button.onclick = () => open(menu.hidden);
    this.unit_items = G.UNITS.map(([short, name], i) => {
      const b = el("button", { type: "button", id: "unit-" + short, onclick: () => { this.S.ui_unit = i; open(false); this.sync_rows(); this.render(); } }, el("span", { textContent: name }), el("span", { className: "quiet", textContent: short }));
      b.setAttribute("role", "menuitemradio");
      menu.append(b);
      return b;
    });
    const box = el("div", { className: "unit" }, this.unit_button, menu);
    box.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); this.unit_button.focus(); } };
    open(false);
    return box;
  },

  /** the rows of the section that is showing. A heading opens a pane; the rows after it go inside the pane,
   *  which can be folded. Each section remembers how far it was scrolled. */
  show_section() {
    this.unselected = false;      // a tab chosen: its selection shows again
    if (!(this.S.ui_section in SECTIONS)) this.S.ui_section = 0;
    const name = SECTIONS[this.S.ui_section];
    if (this.section_shown) this.scrolls[this.section_shown] = this.form.scrollTop;
    this.pop_close();                              // its swatch goes with the rows
    [...this.tabs.children].forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    this.form.replaceChildren();
    this.pinned.replaceChildren();
    this.ring_list = null;                         // the Rings section builds it again
    this.ring_line_holder = null;
    this.font_scope = SECTIONS[this.S.ui_section] === "Date" ? "window" : "ring";      // whose font the font row here is about
    this.rows = ROWS[name].map((row) => this.build_row(row));
    let pane = null;
    for (const r of this.rows) {
      if (r.row.bar) (r.row.pin ? this.pinned : this.form).append(r.el);      // a line of its own, outside the panes
      else if (r.fold) { pane = r; (r.row.pin ? this.pinned : this.form).append(r.el); }
      else if (r.row.head && pane) {               // a pane's main selector: its control alone, on the heading line
        const control = r.el.lastElementChild;
        control.classList.add("headcontrol");
        control.ariaLabel = r.row.text;
        r.el = control; r.group = pane; r.in_head = true;
        pane.button.after(control);
        pane.el.classList.add("has");
      }
      else { r.group = pane; pane.body.append(r.el); }
    }
    this.pinned.hidden = !this.pinned.children.length;
    this.pin_grip(name);
    this.sync_rows();
    this.section_shown = name;
    this.form.scrollTop = this.scrolls[name] || 0;
  },

  /** folded groups are remembered by this browser (a convenience, not part of the dial). A pane this browser has never
   *  folded or opened starts as its row says (`folded`: a first visit, #270), unless "*" is kept: one fold for every
   *  such pane (the tests keep "*": false, a visitor who has opened them all). */
  is_folded(r) {
    if (r.row.headless) return false;              // a pane with no heading has nothing to fold it (the hand's, #261)
    if (!this.folds) { try { this.folds = JSON.parse(localStorage.getItem(KEY("folds"))) || {}; } catch (e) { this.folds = {}; } }
    return this.folds[r.fold] ?? this.folds["*"] ?? Boolean(r.row.folded);
  },

  fold(r, folded) {
    this.is_folded(r);
    this.folds[r.fold] = folded;
    try { localStorage.setItem(KEY("folds"), JSON.stringify(this.folds)); } catch (e) { /* not kept */ }
    const open = r.body.offsetHeight;                // the pane's height before anything changes (0 if it was folded)
    this.sync_rows();
    this.slide(r, open, folded);
  },

  /** a pane closes and opens by sliding, so what is under it travels instead of jumping.
   *  Not when the system asks for less motion; and never left half-way (R17). */
  slide(r, from, folded) {
    const body = r.body;
    if (r.sliding) { r.sliding.onfinish = r.sliding.oncancel = null; r.sliding.cancel(); r.sliding = null; }      // turned round half-way
    const done = () => { body.classList.remove("sliding"); body.hidden = this.is_folded(r); r.sliding = null; };
    body.hidden = false;                             // in view while it slides
    const to = folded ? 0 : body.offsetHeight;
    if (!body.animate || from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    body.classList.add("sliding");
    r.sliding = body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 140, easing: "ease-out" });
    r.sliding.onfinish = r.sliding.oncancel = done;
  },

  /** every row: hidden if it doesn't apply (R16); its controls showing the scope's value. A pane hides its rows
   *  when it is folded, and everything in it when its heading doesn't apply. */
  sync_rows() {
    if (this.case_sync) this.case_sync();      // the case's switch follows an undo, a link, a file (4.66)
    if (this.xray_sync) this.xray_sync();      // X-ray's, too (4.72)
    this.sync_guides();
    this.sync_shadows();
    if (this.shen_rows) for (const r of this.shen_rows) r.refresh(this.S);
    this.sync_ring_summaries();
    paint(this.backdrop_dot, this.S.c_backdrop); this.backdrop_dot.style.background = this.S.ui_show && this.S.c_backdrop2 ? `linear-gradient(135deg, ${css_colour(this.S.c_backdrop)}, ${css_colour(this.S.c_backdrop2)})` : "";      // a gradient shows as one
    if (this.unit_button.textContent !== this.unit()[0]) this.size_unit();
    this.unit_items.forEach((b, i) => { b.classList.toggle("on", i === this.S.ui_unit); b.setAttribute("aria-checked", String(i === this.S.ui_unit)); });
    for (const r of this.rows) {
      const T = this.target(r.row.scope);
      const applies = r.row.show ? Boolean(r.row.show(T, this.S, this)) : true;      // a row's show sees its own settings and the dial's (a hand's Bevel needs Bevels %)
      r.el.hidden = !applies;
      if (r.fold) {
        const folded = this.is_folded(r);
        r.el.classList.toggle("folded", folded);
        if (!r.sliding) r.body.hidden = folded;
        if (r.folded_shown !== folded) { r.folded_shown = folded; r.eye.innerHTML = eye(!folded); r.button.setAttribute("aria-expanded", String(!folded)); }
        const parts = folded ? this.summary(r) : [], said = JSON.stringify(parts);
        if (r.summary_shown !== said) { r.summary_shown = said; this.show_summary(r.summary, parts); }
      }
      r.applies = applies;
    }
    // R16: a pane whose rows all don't apply goes with them — no heading without something under it to use (Okay,
    // 19 Oct 2026: "We don't need to see a header we do not have the interaction with")
    for (const r of this.rows) if (r.fold) r.empty = true;
    for (const r of this.rows) if (r.group && r.applies) r.group.empty = false;
    for (const r of this.rows) if (r.fold && r.empty && this.rows.some((x) => x.group === r)) r.el.hidden = true;
    // a note belongs to the row it stands under, however many hidden rows lie between (design canon §6): that row draws
    // no line under itself (noted), and the note knows what it stands under (after: a tick, tiles, or a field), so its
    // words start where they should (Okay, 20 Oct 2026, 01:16: "why the follows.. line stuck up there?")
    for (const r of this.rows) {
      const row = r.el;
      if (!row.classList.contains("row") || row.classList.contains("note") || row.hidden) continue;
      let next = row.nextElementSibling;
      while (next && next.hidden) next = next.nextElementSibling;
      const noted = !!next && next.classList.contains("row") && next.classList.contains("note");
      row.classList.toggle("noted", noted);
      if (noted) next.dataset.after = row.classList.contains("chk") ? "tick" : row.classList.contains("pick") ? "tiles" : row.classList.contains("note") ? "note" : "field";
    }
    for (const r of this.rows) {
      const pane = r.group;
      if (r.applies && (r.in_head || !(pane && (pane.el.hidden || this.is_folded(pane))))) r.refresh(this.target(r.row.scope));      // a heading's selector shows even when its pane is folded
    }
    if (this.value_pop) {
      if (!this.value_pop.button.isConnected) this.value_pop_close();      // its line went with the section: the box (on the body) goes with it
      else this.value_pop.r.refresh(this.target(this.value_pop.r.row.scope));
    }
    this.pop_refresh();
  },

  /** what a folded pane holds, in a few words: the values of its first rows. Folding hides controls, not information. */
  summary(heading) {
    if (heading.row.summary) return heading.row.summary(this.S, this);
    const parts = [];
    for (const r of this.rows) {
      if (r.group !== heading || !r.row.key || r.in_head || parts.length === 3) continue;
      const row = r.row, T = this.target(row.scope);
      if (row.show && !row.show(T, this.S, this)) continue;
      const v = T[row.key];
      if (row.kind === "num") parts.push(`${label_of(row, T).replace(/^…/, "").toLowerCase()} ${is_length(row) ? this.in_unit(v, decimals(row.step)) : fmt(v, row.step)}`);
      else if (row.kind === "pop" || row.kind === "pick" || row.kind === "seg") parts.push(String(row.items[v] ?? ""));
      else if (row.kind === "col") parts.push({ c: v || (row.or ? row.or(T) : [0, 0, 0, 1]) });       // a colour is shown, not spelled: a tiny swatch (Okay, 13 Oct 2026)
      else if (row.kind === "txt") parts.push(String(v));
      else if (row.kind === "chk" && v) parts.push(row.text.toLowerCase());
    }
    return parts.filter(Boolean);
  },

  /** a summary's parts in a line, a dot between them: words as words, a colour as a tiny swatch (colours side by side
   *  with a space between, no dot). */
  show_summary(box, parts) {
    box.replaceChildren();
    parts.filter((part) => part !== undefined && part !== null && part !== false && part !== "").forEach((part, i, parts) => {      // an empty part says nothing and takes no dot
      if (i) box.append(typeof part === "string" || typeof parts[i - 1] === "string" ? " · " : " ");
      if (typeof part === "string") return box.append(part);
      const dot = el("i", { className: "dot tiny", title: to_hex(part.c).toUpperCase() });
      paint(dot, part.c);
      box.append(dot);
    });
  },

  /** one row of the form → {row, el, refresh(T)}. */
  build_row(row) {
    const wrap = el("div", { className: "row " + row.kind + (row.nest ? " nest" : "") + (row.side ? " side" : "") + (row.under ? " under" : "") });      // under: a note about the controls above, on their column
    const tied = () => { if (row.tie) out.el.classList.add("tied"); };      // tie: this row belongs to the one above it, no line between them
    const out = { row, el: wrap, refresh: () => {} };
    const set = (v) => (row.put ? row.put(this, v) : this.set_value(row.scope, row.key, v));      // put: a row that stands for another setting (the big date tick)
    const id = (row.id || `${row.scope}-${row.key}-${row.text || row.name}`.replace(/[^A-Za-z0-9]+/g, "-")) + (row.inpop ? "-pop" : "");      // id: when two rows would share one; the controller's copy of a row ends in -pop, so no id stands twice in the page (#542f)
    const active = (e) => document.activeElement === e;

    if (row.kind === "hdr") {                      // a heading: click it to fold or unfold its group
      out.fold = `${SECTIONS[this.S.ui_section]}/${row.text || row.name}`;
      // the eye in the left column says whether the pane is open; the whole heading is its button
      const title = el("h2", { textContent: row.text || "" });
      out.eye = el("span", { className: "eye" });
      out.summary = el("span", { className: "summary quiet" });
      out.button = el("button", { type: "button", className: "fold", title: "Show or hide this pane", onclick: () => this.fold(out, !this.is_folded(out)) }, out.eye, title, out.summary);
      out.body = el("div", { className: "body" });
      out.el = el("section", { className: (row.headless ? "pane headless" : row.bare ? "pane bare" : "pane") + (row.cls ? " " + row.cls : "") }, out.button, out.body);      // cls: a pane laid out its own way (Positions, #357)      // ("plain" is a button's class) · bare: open, the heading gives way to what is in it (the Type pane, #319)
      if (row.headless) out.button.hidden = true;
      if (row.tools) {                             // tools on the heading line, at its right; folded, the summary stands there instead
        out.el.classList.add("tooled");
        out.button.after(this["head_" + row.tools]());
      }
      if (row.title) out.refresh = (T) => { title.textContent = row.title(T, this.is_folded(out), this); };
      return out;
    }
    if (row.kind === "note") {                     // a line of words; its words may follow the dial (a function of the row's settings, 4.72)
      const words = el("span", { className: "quiet", textContent: typeof row.text === "function" ? "" : row.text });
      wrap.append(el("span"), words);
      if (typeof row.text === "function") out.refresh = (T) => { words.textContent = row.text(T, this); };
    }

    if (row.kind === "num") {                      // label · slider · typed field · stepper (R15)
      const slider = el("input", { type: "range", min: row.lo, max: row.hi, step: row.step, id: id + "-slider" });
      const field = el("input", { type: "text", id, inputMode: "decimal", title: "1.2 sets · +0.5 adds · x0.5 multiplies · /2 divides" });
      // under a finger (or a pen) a row's slider opens the controller, tapped or slid — its knob is small for a fingertip;
      // the field takes typing and − + step, as with a mouse (Okay, 18 Oct 2026, 22:35: "On phones and ipad tapping or
      // sliding slider or title opens controller, you can type in box or tap plusminus")
      // …and the same finger goes on sliding it, without lifting (4.85; Okay, 19 Oct 2026, 12:30: "On ipad, activate does
      // not immediately allow me to scrub, it should. Like click and drag adjusters we have. The popup is just for
      // accuracy, does not dictate start of the movement"): the controller's slider follows the finger (value_pop_scrub)
      if (!row.inpop) {
        slider.addEventListener("touchstart", (e) => {
          e.preventDefault();      // the slider itself doesn't move
          const t = e.touches[0];
          if (!(this.value_pop && this.value_pop.button === field)) this.value_pop_open(field, row, { x: t.clientX, y: t.clientY });
          this.value_pop_scrub(t.clientX, true);
        }, { passive: false });
        slider.addEventListener("touchmove", (e) => { if (!this.value_pop) return; e.preventDefault(); this.value_pop_scrub(e.touches[0].clientX); }, { passive: false });
      }
      const commit = (v) => {
        v = row.whole ? Math.round(v) : +(+v).toFixed(6);
        // limits: a number's hard ends, where typing past the slider's range stops (#233, R17): reached, it says so
        if (row.limits && (v < row.limits[0] || v > row.limits[1])) {
          const to = clamp(v, ...row.limits);
          this.say(`${row.text} stops at ${to}${is_length(row) ? " mm" : ""}: ${+v.toFixed(3)} is past what the tool draws (${row.limits[0]}–${row.limits[1]}).`);
          this.log(`${row.text}: ${+v.toFixed(3)} typed, ${to} taken (its limits are ${row.limits[0]}–${row.limits[1]})`);
          v = to;
        }
        set(row.whole ? clamp(v, row.lo, row.hi) : v);       // typing past the slider's range is allowed
      };
      // a length is kept in mm and shown in the chosen unit: per = how many of that unit make a mm, places = decimals shown
      const length = is_length(row);
      const per = () => (length ? this.unit()[2] : 1), places = () => Math.max(0, decimals(row.step) + (length ? this.unit()[3] : 0), decimals(unit_step()));
      // − + and the arrow keys step in round amounts of the shown unit and land on its round values; in mm, as the row says (#76)
      const unit_step = () => (length && per() !== 1 ? round_step(row.step * per()) : row.step);
      const stepped = (v, n) => { if (!length || per() === 1) return v + n * row.step; const u = unit_step(); return Math.round((v * per() + n * u) / u) * u / per(); };
      const shown = (v) => (row.trim ? String(parseFloat((v * per()).toFixed(places()))) : (v * per()).toFixed(places())) + (row.suffix || "");      // trim: no trailing zeros, so −142.5° fits a small box (Positions)      // suffix: a degree sign in the field (Positions, #357); parse_number reads past it
      const now = () => { const T = this.target(row.scope); return (row.get ? row.get(T) : T[row.key]) ?? (row.or ? row.or(T) : 0); };      // or: what an unset number is (a window's tracking: the numerals')
      let typing = false;                          // the field follows every change, except while you type in it
      slider.oninput = () => { if (row.inpop || row.scope === "nudge") this.guides_live(row.scope !== "nudge"); commit(+slider.value); };
      field.oninput = () => { typing = true; };
      field.onblur = () => { typing = false; out.refresh(this.target(row.scope)); };
      field.onchange = () => { typing = false; commit(parse_number(field.value, now() * per(), length ? per() : 0) / per()); out.refresh(this.target(row.scope)); };
      field.onkeydown = (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); commit(stepped(now(), (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1))); }
      };
      // − and +: as typed signs in a full row; in the popup the thick ones (BIG); beside a quiet number the tiny ones
      const step = (dir) => {
        const b = el("button", { type: "button", className: "step", tabIndex: -1, onclick: () => commit(stepped(now(), dir)) });
        const sign = (row.inpop ? BIG : row.side || row.block ? SIGNS : STEP)[dir > 0 ? "plus" : "minus"];      // a narrow box (beside a hand's box, a quiet row, Positions) the shared 9-across signs, so they keep their room
        const svg_sign = !row.inpop && (row.side || row.block);
        b.innerHTML = svg_sign ? icon(sign) : sign; b.ariaLabel = dir > 0 ? "Plus" : "Minus";
        if (row.inpop) b.id = "value-pop-" + (dir > 0 ? "plus" : "minus");
        return b;
      };
      const label = el("label", { htmlFor: id, textContent: row.text });
      slider.ariaLabel = row.text;                 // the label is the field's; the slider says its name itself (#244, 4.47.2)
      if (row.short) { label.textContent = ""; label.title = row.text; label.append(el("span", { className: "whole", textContent: row.text }), el("span", { className: "short", textContent: row.short })); }      // two wordings; the stylesheet shows the one there is room for
      let lead = label, menu = null;
      if (row.button) lead = el("button", { type: "button", className: "btn main", id: "export-" + row.button, textContent: row.button.toUpperCase(), title: `Export a ${row.button.toUpperCase()} at this dpi`, onclick: () => this.export(row.button) });
      if (row.menu) {                              // label · a small boxed arrow: the browser's own menu lies over the arrow, unseen
        menu = el("select", { id: id + "-" + row.menu.key, title: row.menu.title, ariaLabel: row.menu.title });
        for (const [v, name] of row.menu.items) menu.append(el("option", { value: v, textContent: name }));
        menu.onchange = () => this.set_value(row.scope, row.menu.key, +menu.value);
        lead = el("span", { className: "menulabel" }, label, menu_arrow(menu));
      }
      if (row.button) { slider.ariaLabel = field.ariaLabel = row.text; field.title = row.text + " · " + field.title; }
      if (row.bare) { label.textContent = ""; label.className = "blank"; slider.ariaLabel = field.ariaLabel = row.text; field.title = row.text + " · " + field.title; }
      if (row.inpop) slider.ariaLabel = field.ariaLabel = row.text;      // the popup's head says its name too (4.49.2)
      if (!row.inpop && !row.side && !row.bare && !row.button && !row.block && !row.named) this.name_opens(label, row);      // form A: its name opens the popup (#249)
      if (row.part) wrap.dataset.part = row.part;      // the part it sizes in the Shadows pane's picture (#526)
      // one number box for the whole tool (Okay, 18 Oct 2026, 21:20: "This version of boxes win: small plusminus and
      // these new thick border ones are retired, these replace all … Number box touches minus box"): the value in its
      // box, then − and + in theirs, all touching. A full row: name · slider · box. Beside a hand's box (side), the same,
      // narrower. A quiet row (form B) and a Positions block: name · box, the slider in the controller its name opens.
      const numbox = () => el("span", { className: "numbox" }, field, el("span", { className: "steps" }, step(-1), step(1)));
      if (row.side) {
        wrap.append(lead, slider, numbox());
        if (!row.inpop) this.name_opens(label, row);      // its name opens the controller, as a full row's does (#249)
        if (row.quiet) wrap.classList.add("quiet");      // form B: no slider on the row (#251)
      } else if (row.link || (row.inpop && row.poplink)) {
        // the LINK pill on the line under this row, between its name and the next row's (#358): a white outline on the
        // pane's ground, LINK in the pixel font; pressed, dark with LINKED in white. In the controller a disc between −
        // and + (4.85, 4.86), for both of the pair (poplink: the second's)
        const link = row.link || row.poplink;
        wrap.append(lead, slider, numbox());
        const pill = el("button", { type: "button", className: "linkpill", id: id + "-link" });
        pill.dataset.link = link;
        pill.onclick = () => this.set_value(row.scope, link, !this.target(row.scope)[link]);
        wrap.classList.add("haslink");
        wrap.append(pill);
        out.link = pill;
      } else if (row.named) {
        // form D, a named slider (R15; the Shadows pane, #526): the name over the slider, no box on the row — the value
        // rides in the knob (Okay, 25 Oct 2026: "numbers on the buttons since we have nowhere else to write"); the name
        // opens the controller, as a full row's does
        wrap.classList.add("named");
        const knob = el("output", { className: "knobval" });
        wrap.append(lead, el("span", { className: "lane" }, slider, knob));
        out.knob = knob;
        this.name_opens(label, row);
      } else if (row.block) {
        // a number block (#357, #317; the font box's of 4.54): the name, then the value and its − + joined, no slider
        // on the row; the name opens the controller and drags the value, as a quiet row's does (#249)
        wrap.classList.add("block");
        wrap.append(lead, numbox());
        this.name_opens(label, row);
        if (row.tip) label.dataset.tip = row.tip;      // what it does, in a tag over the name (#357: "Offset and skip need tooltip details")
      } else wrap.append(lead, slider, numbox());
      out.refresh = (T) => {
        const v = (row.get ? row.get(T) : T[row.key]) ?? (row.or ? row.or(T) : 0);
        if (out.knob) { out.knob.textContent = shown(v); const f = (v - +slider.min) / Math.max(1e-9, +slider.max - +slider.min); out.knob.style.setProperty("--at", clamp(f, 0, 1).toFixed(4)); }      // form D: the value in the knob, moved with it
        if (out.link) { const on = Boolean(T[out.link.dataset.link]); out.link.classList.toggle("on", on); out.link.textContent = on ? (row.inpop ? "LINK\n+ED" : "LINKED") : "LINK"; out.link.setAttribute("aria-pressed", String(on)); out.link.ariaLabel = on ? "Width and height linked: press to unlink" : "Link width and height"; }      // in the controller's disc, linked: two lines (4.86, Okay: "LINK / +ED")
        if (row.top) { const top = Math.max(row.top(this.S), v); if (+slider.max !== top) slider.max = top; }      // top: the slider's end follows the dial (a numeral's Size runs to the dial's diameter, #535)
        if (v > +slider.max) slider.max = v;       // the slider grows to hold a typed value
        if (v < +slider.min) slider.min = v;
        slider.step = String(unit_step() / per());      // the slider moves in the shown unit's round steps too (#76)
        if (+slider.value !== v) slider.value = v;
        filled(slider);
        if (!typing) field.value = shown(v);
        if (menu) { const v = T[row.menu.key] ?? 0; menu.value = row.menu.items.some(([x]) => x === v) ? v : row.menu.items[0][0]; label.textContent = label_of(row, T); }      // a retired choice (#418) shows as the first
        if (row.say) {                             // a name that follows another setting (a disc's Hole or Mark, #300)
          const [whole, short] = row.say(T);
          if (row.short) { label.querySelector(".whole").textContent = whole; label.querySelector(".short").textContent = short; label.title = whole; } else label.textContent = whole;
        }
      };
    }

    if (row.kind === "pop") {
      const select = el("select", { id });
      row.items.forEach((name, i) => select.append(el("option", { value: i, textContent: name })));
      select.onchange = () => set(+select.value);
      const menu = chevron_box(select);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), menu.box);
      out.refresh = (T) => { select.value = T[row.key]; menu.sync(); };
    }

    if (row.kind === "pick") {                     // a choice as pictures: one tile per item, on the columns
      const group = el("span", { className: (row.small ? "picks small" : row.thumbs ? "picks thumbs" : "picks") + (row.across ? " across" : ""), role: "radiogroup", ariaLabel: row.text });
      if (row.across) group.style.setProperty("--across", Math.max(4, row.across));      // four to a line at least: fewer keep a four's size, the room left at the right; a fifth squeezes in (design canon §6)      // as many tiles to a line as it has (a window's complications, five)
      (row.order || row.items.map((_, i) => i)).forEach((i) => {      // order: the tiles' order when it isn't the list's (R9)
        const name = row.items[i];
        if (row.skip && row.skip.includes(i)) return;      // an item kept in the list for its place (R9) but not offered here
        const tile = el("button", { type: "button", className: "pickt", id: `${id}-${i}`, title: name, onclick: () => set(i) });
        tile.setAttribute("role", "radio");
        tile.innerHTML = typeof row.pics === "function" ? row.pics(i) : pic(row.pics[i]);
        tile.append(el("span", { textContent: TILE_WORDS[name] || name }));
        group.append(tile);
      });
      const label = el("label", { textContent: row.text, className: row.label ? "strong" : "" });
      if (row.thumbs) {                            // thumbs: pictures alone, a row of their own without a name (a hand's shapes, 4.46.3), and the dashed SVG tile last — a shape of one's own, not built yet
        const own = el("button", { type: "button", className: "pickt own", id: id + "-own", title: "A shape of your own, from an SVG file: not built yet" });
        own.innerHTML = icon(SIGNS.plus);
        own.setAttribute("aria-disabled", "true");
        group.append(own);
        wrap.classList.add("thumbs");
        wrap.append(group);
      } else wrap.append(label, group);
      out.refresh = (T) => {
        if (row.label) label.textContent = row.label(T);
        const tiles = [...group.querySelectorAll('[role="radio"]')];
        const on = row.shown ? row.shown(T) : T[row.key];      // shown: which tile stands for the value (a big date lights the Date tile)
        tiles.forEach((b) => { const i = +b.id.slice(id.length + 1); b.classList.toggle("on", i === on); b.setAttribute("aria-checked", String(i === on)); });
      };
    }

    if (row.kind === "seg" && row.bool) {
      // a toggle (Shenanigans, #525; Okay, 24 Oct 2026, 19:04: "On off does not need to be written down. A dot travels. On is
      // outline only … Apple style sliding on of. On is right position and backg is filled button is white. Off text label
      // also goes black"): a small track and a dot; off, the outline and the dot at the left, its name dark; on, the dot at
      // the right, white on the filled track
      const name = el("label", { htmlFor: id, textContent: row.text });
      const toggle = el("button", { type: "button", id, className: "toggle", role: "switch", ariaLabel: row.text, onclick: () => set(!(row.get ? row.get(this.target(row.scope)) : this.target(row.scope)[row.key])) }, el("span", { className: "knob" }));
      wrap.append(name, toggle);
      out.refresh = (T) => { const on = Boolean(row.get ? row.get(T) : T[row.key]); toggle.setAttribute("aria-checked", String(on)); wrap.classList.toggle("off", !on); };
    }
    else if (row.kind === "seg") {
      // order: the buttons' order when it isn't the list's (the list only grows at its end, R9) · many: on two lines
      const group = el("span", { className: row.free ? "pillswitch free" : row.many ? "pillswitch many" : "pillswitch", role: "radiogroup", ariaLabel: row.text });      // a choice of words is a pill switch, as the font sheet's Light · Dark (Okay, 20 Oct 2026, 01:33: "exactly same style. can we make this universal?")
      const buttons = row.items.map((name, i) => el("button", { type: "button", id: `${id}-${i}`, textContent: name, onclick: () => { set(i); if (row.key.startsWith("ui_")) this.sync_rows(); } }));
      group.append(...(row.order || buttons.map((b, i) => i)).map((i) => buttons[i]));
      const name = el("label", { textContent: row.text });
      wrap.append(name, group);
      out.refresh = (T) => { const at = row.get ? row.get(T) : T[row.key]; buttons.forEach((b, i) => { b.classList.toggle("on", i === at); if (row.offered) b.hidden = !row.offered(T).includes(i); }); if (row.say) name.textContent = label_of(row, T); };      // offered: which choices can be used now (R16)
    }

    if (row.kind === "chk") {
      const box = el("input", { type: "checkbox", id });
      box.onchange = () => set(box.checked);
      wrap.append(el("span"), el("label", { className: "check", htmlFor: id }, box, el("span", { className: "words", textContent: row.text })));      // the words after the box by a set gap (--tick-gap), so a note under them can start where they do
      if (row.tip) wrap.append(this.info_sign(row.tip));
      out.refresh = (T) => { box.checked = Boolean(row.get ? row.get(T) : T[row.key]); };
    }

    if (row.kind === "col") {                      // a colour pill: a button that opens the colour pop-out. Nothing is typed in it; the pop-out has the HEX field.
      const pill = this.colour_pill(id, "Choose a colour");
      pill.onclick = () => this.pop_open(this.colour_of_row(row), pill);
      const name = el("label", { htmlFor: id, textContent: row.text });
      wrap.append(name, pill);
      out.refresh = (T) => { pill.show((row.get ? row.get(T) : T[row.key]) || (row.or ? row.or(T) : [0, 0, 0, 1])); if (row.say) name.textContent = row.say(T)[0]; };
    }

    if (row.kind === "txt") {
      const field = el("input", { type: "text", id });      // on the label's line, from the controls' column on (Okay, 13 Oct 2026; under the label, full width, before)
      field.oninput = () => set(field.value);
      wrap.append(el("label", { htmlFor: id, textContent: row.text }), field);
      out.refresh = (T) => { if (!active(field)) field.value = T[row.key]; };
    }

    if (row.kind === "custom") this["row_" + row.name](wrap, out, row);
    if (row.scope === "hand" && row.kind === "num") {      // pointing at a hand's number, or in its field, lights its part on the picture (#329)
      wrap.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") this.hand_light(row); });
      wrap.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && this.value_pop?.row !== row) this.hand_light(null); });
      wrap.addEventListener("focusin", () => this.hand_light(row));
      wrap.addEventListener("focusout", () => { if (this.value_pop?.row !== row) this.hand_light(null); });
    }
    tied();
    return out;
  },

  row_reset_go(wrap) {                             // the button, on the pane's heading line (head)
    const go = el("button", { type: "button", className: "btn reset", id: "reset", textContent: "Reset to the First dial", title: "Replaces the whole dial with the guide’s First dial", onclick: () => { this.reopen({ ...structuredClone(OPENER), ui_section: this.S.ui_section }); this.log("reset to the opener: the First dial"); } });
    go.setAttribute("aria-describedby", "reset-warning");
    wrap.append(go);
  },

  row_reset(wrap) {                                // its warning, under the heading line
    wrap.append(el("p", { className: "warn", id: "reset-warning", textContent: "Replaces everything on this dial — size, rings, hands, windows, colours — with the guide’s First dial. Undo brings yours back." }));
  },

  /** a blank face (Okay, 18 Oct 2026, notes 2: "For if someone wants a 'blank' face: Under dial, reset to first dial: add
   *  a blank face option. White dial color, no rings, etc."): the starting values with a white plate, no rings and no
   *  windows; the hands stay, so the time still reads (Claude's reading, to confirm). The ring list is never empty (a
   *  ring is always selected), so it holds one ring, hidden: turn its eye on to start. One press replaces the dial, as
   *  Reset does, and Undo brings it back. */
  row_reset_blank(wrap) {
    const go = el("button", { type: "button", className: "btn", id: "reset-blank", textContent: "Blank face", title: "A white plate with hands and nothing else",
      onclick: () => { this.reopen({ c_plate: [1, 1, 1, 1], rings: [{ on: false }], da_on: false, ui_section: this.S.ui_section }); this.log("a blank face: white plate, hands, no rings, no windows"); } });
    wrap.classList.add("resetblank");      // laid out as Reset's First dial: the button on the controls' column, its words under it (4.64; it wrapped a word a line)
    wrap.append(go, el("span", { className: "quiet", textContent: "White plate and hands, nothing else." }));
  },

  /** the plate's background: a place made ready for an SVG, with a note and no button (#530, #218; Okay, 24 Oct 2026:
   *  "Svg imports postponed to consideration after v01. However make their places ready and display a message … in
   *  relevant places"). A button that only says "not built" is a dead end (R17). */
  row_background(wrap) {
    wrap.append(el("label", { textContent: "Background" }),
      el("span", { className: "tools" }, el("span", { className: "quiet", id: "background-note", textContent: SVG_LATER })));
  },

  /** an (i): what a setting does, in a tag — under the pointer, or a moment after a tap (a finger has no hover), as
   *  the magnifier's (Okay's notes 2, #357: "Offset and skip need tooltip details"). */
  info_sign(text) {
    const b = el("button", { type: "button", className: "infosign", ariaLabel: text });
    b.dataset.tip = text;
    b.innerHTML = icon(TOOL_ICONS.info);
    b.onpointerdown = (e) => e.stopPropagation();      // inside a name that opens the controller: the (i) is its own press
    b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.tag_show(b); clearTimeout(this.info_tip); this.info_tip = setTimeout(() => this.tag_hide(), 2400); };
    return b;
  },

  /** a whole number picked from a menu (#357, Okay's drawing: "4 ⌄" opening 1, 2, 3, 4 … Custom; "Custom … line turns
   *  into" a typed field with →): the browser's own menu lies over the box, unseen, so a finger gets the system's
   *  list. Custom turns the box into a field: Enter or → takes what is typed, Escape or a press elsewhere puts the
   *  menu back. A value not in the list is put in it, so the box always says the value. The name opens the
   *  controller and drags the value (#249), as every number's name does. */
  row_num_menu(wrap, out, row) {
    const spec = { kind: "num", scope: "ring", key: row.key, text: row.text, lo: row.lo, hi: row.hi, step: 1, whole: true };
    wrap.className = "row nummenu";
    const id = `ring-${row.key}-${row.text}`;
    const label = el("label", { htmlFor: id + "-menu", textContent: row.text });
    this.name_opens(label, spec);
    if (row.tip) label.append(this.info_sign(row.tip));
    const menu = el("select", { id: id + "-menu", ariaLabel: row.text });
    const shown = el("span", { className: "v" });
    const arrow = el("span", { className: "arrow" });
    arrow.innerHTML = icon(SIGNS.down);
    const field = el("input", { type: "text", id, inputMode: "numeric", ariaLabel: row.text, hidden: true });
    const go = el("button", { type: "button", className: "go", ariaLabel: "Take it", hidden: true });
    go.innerHTML = icon(TOOL_ICONS.go);
    const box = el("span", { className: "menubox" }, shown, arrow, menu, field, go);
    const typing = (on) => {
      box.classList.toggle("typing", on);
      for (const e of [shown, arrow, menu]) e.hidden = on;
      field.hidden = go.hidden = !on;
      if (on) { field.value = String(this.ring()[row.key]); field.focus(); field.select(); }
    };
    const take = () => { const v = Math.round(parse_number(field.value, this.ring()[row.key])); typing(false); this.set_value("ring", row.key, clamp(v, row.lo, row.hi)); out.refresh(this.ring()); };
    menu.onchange = () => { if (menu.value === "custom") typing(true); else this.set_value("ring", row.key, +menu.value); };
    field.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); take(); } else if (e.key === "Escape") { e.preventDefault(); typing(false); out.refresh(this.ring()); } };
    field.onblur = (e) => { if (e.relatedTarget !== go) { typing(false); out.refresh(this.ring()); } };
    go.onmousedown = (e) => e.preventDefault();
    go.onclick = take;
    wrap.append(label, box);
    let listed = "";
    out.refresh = (R) => {
      const v = parseInt(R[row.key]) || row.lo, items = [...new Set([...row.items, v])].sort((x, y) => x - y), now = items.join();
      if (now !== listed) { listed = now; menu.replaceChildren(...items.map((n) => el("option", { value: String(n), textContent: String(n) })), el("option", { value: "custom", textContent: "Custom…" })); }
      menu.value = String(v);
      shown.textContent = String(v);
    };
  },

  value_button(id, row, drawing, tagged = true) {      // tagged: false for the ring drawer's two, whose numbers stand in the row above (4.55)
    const b = el("button", { type: "button", className: "valueb", id });
    b.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true">${drawing}</svg>`;
    const T = () => this.target(row().scope);
    const refresh = () => {                        // no number in it (Okay, 13 Oct 2026): the ring's row, right above, says it; so does the tag
      const r = row(), v = T()[r.key] ?? 0, text = String(parseFloat(this.in_unit(v, decimals(r.step))));
      if (tagged) b.dataset.tip = label_of(r, T());
      b.dataset.value = text;
      b.ariaLabel = `${label_of(r, T())} ${text} ${this.unit()[0]}`;
    };
    let press = null;
    const read = () => { const r = row(), t = T(); return (r.get ? r.get(t) : t[r.key]) ?? 0; }, write = (r, v) => (r.put ? r.put(this, v) : this.set_value(r.scope, r.key, v));      // a row that stands for another setting (get, put): the same way in as build_row's (R34)
    b.onpointerdown = (e) => { press = { x: e.clientX, y: e.clientY, v: read(), moved: false }; b.setPointerCapture(e.pointerId); };
    b.onpointermove = (e) => {
      if (!press) return;
      const d = (e.clientX - press.x) - (e.clientY - press.y);      // right or up: more
      if (!press.moved && Math.abs(d) < 4) return;
      if (!press.moved) { press.moved = true; this.value_pop_close(); this.tag_hide(); b.classList.add("dragging"); }
      const r = row(), step = r.step * (e.shiftKey ? 0.1 : 1);
      this.guides_live(r.scope !== "nudge");
      write(r, +Math.max(press.v + Math.round(d / 2) * step, r.lo).toFixed(6));       // two screen points a step
    };
    b.onpointerup = b.onpointercancel = (e) => { const was = press; press = null; b.classList.remove("dragging"); if (was && !was.moved) this.value_pop_open(b, row(), { x: e.clientX, y: e.clientY }); };
    b.onclick = (e) => { if (!e.detail && !this.value_pop) this.value_pop_open(b, row()); };      // the keyboard (Enter, Space) opens it too
    return { el: b, refresh };
  },

  /** a number's name as the way into its popup (#249, #170): a press that doesn't move opens it; a press moved
   *  sideways changes the value, two screen points a step (Shift: ten times finer), as a value button does. The name
   *  keeps its field as its label for a screen reader, but a press on it no longer goes to the field. */
  name_opens(label, row) {
    label.classList.add("popname");
    label.title = `${row.text} — press for its slider, drag sideways to change it`;
    let press = null;
    const now = () => { const T = this.target(row.scope); return (row.get ? row.get(T) : T[row.key]) ?? (row.or ? row.or(T) : 0); };
    label.onclick = (e) => e.preventDefault();
    label.onpointerdown = (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") {      // a finger: the controller at once, tapped or slid (22:35), and the slide goes on in it (4.85)
        e.preventDefault(); press = { touch: true }; label.setPointerCapture(e.pointerId);
        if (!(this.value_pop && this.value_pop.button === label)) this.value_pop_open(label, row, { x: e.clientX, y: e.clientY });
        return this.value_pop_scrub(e.clientX, true);
      }
      press = { x: e.clientX, v: now(), moved: false }; label.setPointerCapture(e.pointerId);
    };
    label.onpointermove = (e) => {
      if (!press) return;
      if (press.touch) return this.value_pop_scrub(e.clientX);
      const d = e.clientX - press.x;
      if (!press.moved && Math.abs(d) < 4) return;
      if (!press.moved) { press.moved = true; this.value_pop_close(); label.classList.add("dragging"); }
      const v = press.v + Math.round(d / 2) * row.step * (e.shiftKey ? 0.1 : 1);
      this.guides_live(row.scope !== "nudge");
      const w = row.whole ? clamp(Math.round(v), row.lo, row.hi) : +clamp(Math.max(v, row.lo), ...(row.limits || [-Infinity, Infinity])).toFixed(6);      // a name dragged stops at the row's limits too (#233)
      if (row.put) row.put(this, w); else this.set_value(row.scope, row.key, w);      // a row that stands for another setting writes through its put (the Shadows pane's ink rows; found 25 Oct 2026: a drag wrote S.ink, a key that is no setting)
    };
    label.onpointerup = label.onpointercancel = (e) => { const was = press; press = null; label.classList.remove("dragging"); if (was && !was.touch && !was.moved) this.value_pop_open(label, row, { x: e.clientX, y: e.clientY }); };
  },

  /** the guides while a number is slid — the popup's slider, a name or a value button dragged — even with Guides off
   *  (Okay, 16 Oct 2026, on 4.45: "activate guides on slide. Even if off"): as they are set, until a moment after the
   *  last change (draw). A numeral being nudged hides them instead, whatever slides it (on = false; #252: "when a
   *  numeral is being nudged hide all guides"). Call before the change, which draws. */
  guides_live(on = true) {
    this.guides_at = performance.now();
    this.guides_on = on;
    clearTimeout(this.guides_timer);
    this.guides_timer = setTimeout(() => this.render(), HOLE_LIVE_MS + 50);
  },

  /** the tag: what a wordless button is, said under it while the pointer or the keyboard is on it. One for the whole
   *  tool, laid over everything, so a list that scrolls can't cut it off. A value button's tag is as wide as the
   *  pop-up it grows into on a click (value_pop_open): its name at the left, its value at the right. */
  tag_show(target) {
    if (!this.tag) { this.tag = el("div", { className: "tag", id: "tag", hidden: true }); document.body.append(this.tag); }
    if (target.getAttribute("aria-expanded") === "true") return this.tag_hide();       // its pop-up is open under it: the tag would lie on it
    const value = target.classList.contains("valueb");
    this.tag.classList.toggle("value", value);
    if (value) this.tag.replaceChildren(el("span", { textContent: target.dataset.tip }), el("span", { className: "figure", textContent: target.dataset.value }));
    else this.tag.textContent = target.dataset.tip;
    this.tag.hidden = false;
    this.tag_place(this.tag, target);
  },

  tag_hide() { if (this.tag) this.tag.hidden = true; },

  /** under a button, centred on it (kept inside the window), its point on the button's middle. */
  tag_place(box, target) {
    const at = target.getBoundingClientRect(), half = box.offsetWidth / 2, x = clamp(at.left + at.width / 2, half + 4, innerWidth - half - 4);
    box.style.left = `${x}px`;
    const above = at.bottom + 7 + box.offsetHeight > innerHeight;      // no room under it (the bottom bar): over it, the arrow down
    box.classList.toggle("above", above);
    box.style.top = `${above ? at.top - 7 - box.offsetHeight : at.bottom + 7}px`;
    box.style.setProperty("--point", `${at.left + at.width / 2 - x}px`);
  },

  /** the number popup (Okay's notes, p. 5 and 18, #249, beta 4.45; R15's popup): one for every number that has one —
   *  a value button's (form C), a row's name (form A), a quiet row's (form B). The number's own row, laid out as the
   *  popup: its name, the slider (its thumb a pill, a fifth larger), the value in a pill, round − and + under it; in a
   *  2-point dark-grey frame on a ground darker than the pane's, its corners as round as its pills. Under what opened
   *  it, centred; on a phone a sheet at the bottom, over the drawer, so the dial stays in view. Being the row itself,
   *  it does all the row does (R15: typing past the slider's range widens it). Enter, Escape or a press outside closes
   *  it. */
  value_pop_open(button, row, at = null) {
    if (this.value_pop && this.value_pop.button === button) return this.value_pop_close();
    this.value_pop_close();
    for (const old of document.querySelectorAll(".numpop.fading")) old.remove();      // one on its way out: gone now
    this.tag_hide();
    const r = this.build_row({ ...row, inpop: true, side: false, block: false, named: false, tip: null });      // whatever the row's form, the controller is the full one: value, slider, − + and the name (R15; a named slider's opened bare, found 25 Oct 2026)
    // the controller (Okay's second drawing, 18 Oct 2026, controller 2.svg): one dark square; at its top the value in a
    // grey pill, then the slider in a white pill, then − and + as two discs. No name: "No name necessary, preview shows
    // what's changing anyway" (the row's label stays out of sight, for the screen reader: the box is named by it).
    // (17 Oct to 4.51.1: a light head with the name over a hairline, the value riding over the knob.)
    const name = r.el.querySelector(":scope > .menulabel, :scope > label"), field = r.el.querySelector('input[type="text"]');
    if (name) name.hidden = true;
    // its name, untouchable, in the gap between − and + (Okay, 24 Oct 2026, #514: "The gap between plus and minus becomes
    // a good place to just untouchably write the name of the thing being edited"); a linked pair's LINK disc stands there instead
    // the value in a grey pill as small as its figures, riding over the knob (Okay, 24 Oct 2026, 18:31: "Shrink to the size of
    // the numbers, make it follow the slider button all the way in its lane"); the name, untouchable, between − and +
    // ("name goes back below, normal size"); a linked pair's LINK disc takes that place
    const steps = r.el.querySelector(".steps");
    if (steps && row.text && !r.el.querySelector(".linkpill")) steps.lastElementChild.before(el("span", { className: "popword", ariaHidden: "true", textContent: row.text }));
    const head = el("div", { className: "pophead" }, ...(field ? [el("div", { className: "popvalue" }, field)] : []));
    head.hidden = !field;                          // a window's places: no value, so no pill
    const box = el("div", { className: "numpop", id: "value-pop", role: "dialog", ariaLabel: row.text || "" }, head, r.el);
    // as wide as the row's controls — everything right of its name, the slider and the number box — so on a wide
    // column it lies over the slider exactly (Okay, 24 Oct 2026, #514: "as wide as two columns"; "On very wide coluns,
    // controller takes over and spans exactly as wide as the slider below … slider overlapping slider"); never narrower
    // than its drawing (controller 2.svg). A control outside a row (a value button) keeps the drawing's width.
    const home = button.closest(".row"), parts = home ? [...home.children].filter((c) => !c.matches("label, .menulabel, .popname, .linkpill") && c.offsetParent) : [];
    const span = parts.length ? parts.map((c) => c.getBoundingClientRect()).reduce((a, b) => ({ left: Math.min(a.left, b.left), right: Math.max(a.right, b.right) })) : null;
    document.body.append(box);
    const pad = parseFloat(getComputedStyle(box).paddingLeft) || 0;
    if (span) box.style.setProperty("--num-pop-w", `${span.right - span.left + 2 * pad}px`);
    button.setAttribute("aria-expanded", "true");
    this.value_pop = { button, box, r, row, timer: 0 };
    if (row.scope === "hand") this.hand_light(row);      // its part lit while the controller is open (#329)
    if (row.part) this.shade_light(row.part);      // the Shadows pane's part, too (#526)
    r.refresh(this.target(row.scope));
    // where it stands: the knob under the finger that opened it (at: the press's point), kept inside the window; opened
    // from the keyboard, or with no slider (a window's places), under its button, centred
    const slider = box.querySelector('input[type="range"]'), w = box.offsetWidth, h = box.offsetHeight, bb = button.getBoundingClientRect();
    let left = (at ? at.x : bb.left + bb.width / 2) - w / 2, top = bb.bottom + 7;
    const own = home && home.querySelector(':scope > input[type="range"]');
    if (span && slider) {
      // over the row: its slider's line on the row's slider (or, with none in sight, on the row's middle), centred on the
      // controls — exactly over them when they are wider than the drawing
      const k = slider.getBoundingClientRect(), b0 = box.getBoundingClientRect(), o = (own && own.offsetParent ? own : home).getBoundingClientRect();
      left = (span.left + span.right) / 2 - w / 2; top = b0.top + (o.top + o.height / 2 - (k.top + k.height / 2));
    } else if (at && slider) {
      const k = slider.getBoundingClientRect(), p = +slider.style.getPropertyValue("--p") || 0, b0 = box.getBoundingClientRect();
      const knob = [k.left + k.height / 2 + p * (k.width - k.height), k.top + k.height / 2];      // the knob's centre: its travel is the pill's width less its height
      left = b0.left + (at.x - knob[0]); top = b0.top + (at.y - knob[1]);
    }
    box.style.left = `${clamp(left, 4, innerWidth - w - 4)}px`;
    box.style.top = `${clamp(top, 4, innerHeight - h - 4)}px`;
    // its ground: a twin just under it that multiplies with what is below on a light ground and screens on a dark one,
    // so what is under it shows through as through tinted glass (Okay, 24 Oct 2026: "Can we make the box bg multiply with
    // the bg at all times instead of opacity"; "Multiply / screen"). Dark is what the canvas calls dark (main.dark, the
    // switches turn white) or show mode's column; the dial side's panel is light. A twin, not a layer inside the box: the
    // box is a layer of its own, and a blend inside it would blend with nothing
    const dark = button.closest(".panel") ? Boolean(this.S.ui_show) : this.main.classList.contains("dark");
    const ground = el("div", { className: "numground" + (dark ? " screen" : "") });
    for (const k of ["left", "top"]) ground.style[k] = box.style[k];
    ground.style.width = `${box.offsetWidth}px`; ground.style.height = `${box.offsetHeight}px`;
    box.before(ground);
    this.value_pop.ground = ground;
    // after its last use it fades away: a press or a slide inside starts the clock again; a press held, or typing, holds it
    const later = () => { clearTimeout(this.value_pop?.timer); if (this.value_pop) this.value_pop.timer = setTimeout(() => this.value_pop_close(true), POP_LINGER_MS()); };
    const hold = () => clearTimeout(this.value_pop?.timer);
    box.addEventListener("pointerdown", hold); box.addEventListener("pointerup", later); box.addEventListener("keydown", hold);
    box.addEventListener("input", (e) => { if (e.target.type === "range") later(); });
    box.onkeydown = (e) => {
      if (!(e.key === "Escape" || (e.key === "Enter" && e.target === field))) return;
      e.preventDefault();                          // or the same key press would go on to the button and open it again
      this.value_pop_close();                      // (what was typed is taken as the field goes)
      button.focus();
    };
    // the value ready to type over, for a mouse or the keys only: under a finger (a phone, an iPad) the keyboard comes
    // only when the value is pressed (Okay, 16 Oct 2026, 4.46.1: "Value gets selected was the wrong choice, triggers the keypad on ipad")
    if (field && document.documentElement.dataset.press !== "touch") { field.focus(); field.select(); }
  },

  /** the finger that opened the controller slides on (4.85): its slider moves by as much as the finger has moved since
   *  the press, along the knob's travel — wherever the controller had to stand to stay in the window. start: the press. */
  value_pop_scrub(x, start = false) {
    const P = this.value_pop, s = P && P.box.querySelector('input[type="range"]');
    if (!s) return;
    if (start || !P.scrub) { P.scrub = { x, v: +s.value }; return; }
    const k = s.getBoundingClientRect(), travel = Math.max(k.width - k.height, 1), lo = +s.min, hi = +s.max, step = +s.step || 0.01;
    const v = clamp(P.scrub.v + (x - P.scrub.x) / travel * (hi - lo), lo, hi);
    s.value = String(+(Math.round(v / step) * step).toFixed(6));
    s.dispatchEvent(new Event("input", { bubbles: true }));
  },

  /** fade: it goes in a short fade (its last use is over); otherwise at once (a press elsewhere, Escape, another opening) */
  value_pop_close(fade = false) {
    if (!this.value_pop) return;
    const { button, box, timer, ground } = this.value_pop;
    clearTimeout(timer);
    if (this.value_pop.row?.scope === "hand" && (!matchMedia("(hover: hover)").matches || !button.closest(".row")?.matches(":hover"))) this.hand_light(null);
    if (this.value_pop.row?.part && (!matchMedia("(hover: hover)").matches || !button.closest(".row")?.matches(":hover"))) this.shade_light(null);      // its part stays lit only while a mouse still points at its row (a finger's :hover sticks after a tap: 4.79)
    this.value_pop = null;
    const field = box.querySelector('input[type="text"]');
    if (document.activeElement === field) field.blur();      // what was typed is taken before the field goes
    const gone = [box, ground].filter(Boolean);
    if (fade && !matchMedia("(prefers-reduced-motion: reduce)").matches) { for (const g of gone) g.classList.add("fading"); setTimeout(() => gone.forEach((g) => g.remove()), POP_FADE_MS()); }
    else gone.forEach((g) => g.remove());
    button.setAttribute("aria-expanded", "false");
  },

  /** keep what was pressed under the finger (Okay, 15 Oct 2026, 11:13: "Selecting reordering is impossible from
   *  jumpiness"; 11:32, of the ways offered: "A and c together. Jumpiness is everywhere, not just on rings"). Safari,
   *  on the iPad, has no scroll anchoring (caniuse, Oct 2026: no stable Safari nor iOS Safari has overflow-anchor), so
   *  when rows show, hide or move above what was pressed — the ring line moving to the ring just chosen, a "more" that
   *  opens — what is under the finger moves away. Here: a press in the rows (the pinned part or the scrolling form)
   *  notes where the pressed thing stands on screen; until a moment after the finger lifts, every frame scrolls the
   *  panel's scrolling parts, innermost first, so that it stands there again — as far as they can scroll (at the very
   *  top of a list there is nothing to give). A press that moves, other than on a slider or a value button, is a
   *  scroll or a drag: it lets go. Text fields are left alone (the iPad's keyboard moves the page itself). */
  finger_anchor(panel) {
    const SLOP = 8, AFTER_MS = 500;
    let a = null;
    const scrollers = (node) => {
      const out = [];
      for (let n = node.parentElement; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowY;
        if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) out.push(n);
      }
      return out;
    };
    const frame = () => {
      if (!a) return;
      if (!a.down && performance.now() > a.until) { a = null; return; }
      const el = a.el.isConnected ? a.el : a.ring != null ? this.ring_rows()[a.ring] : null;      // a ring's row is drawn again when it is chosen: the same place in the list
      if (el) {
        let d = el.getBoundingClientRect().top - a.y;
        if (Math.abs(d) >= 1) for (const sc of scrollers(el)) {
          const before = sc.scrollTop;
          sc.scrollTop = before + d;
          d -= sc.scrollTop - before;
          if (Math.abs(d) < 1) break;
        }
      }
      requestAnimationFrame(frame);
    };
    panel.addEventListener("pointerdown", (e) => {
      const t = e.target;
      if (!(t instanceof Element) || !t.closest(".form, .pinned") || t.closest("input[type=text], input:not([type]), textarea")) { a = null; return; }
      const row = t.closest("li.ring"), el = row || t.closest("button, input, label, .valueb, [role=radio]") || t;
      const going = !!a;
      a = { el, y: el.getBoundingClientRect().top, ring: row ? this.ring_rows().indexOf(row) : null, down: true, x0: e.clientX, y0: e.clientY, until: 0, holds: !!t.closest("input[type=range], .valueb") };
      if (!going) requestAnimationFrame(frame);
    }, true);
    panel.addEventListener("pointermove", (e) => {
      if (a && a.down && !a.holds && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > SLOP) a = null;      // a scroll or a drag: not a press
    }, true);
    const up = () => { if (a) { a.down = false; a.until = performance.now() + AFTER_MS; } };
    // the list scrolled on purpose under the finger (fit_ring, #256): the anchor takes the row's new place as its own
    this.anchor_rebase = () => { if (a && a.ring != null) { const row = this.ring_rows()[a.ring]; if (row) a.y = row.getBoundingClientRect().top; } };
    panel.addEventListener("pointerup", up, true);
    panel.addEventListener("pointercancel", () => { a = null; }, true);
    panel.addEventListener("wheel", () => { a = null; }, { passive: true, capture: true });
  },

  /** keep the panel's scrolling parts where they stand while the ring list and the rows are rebuilt (Okay, 15 Oct
   *  2026, 11:13: "Menu jumps up down too much on ipad"). Rebuilding empties the list for a moment, so the form is
   *  briefly shorter and its scroll is cut back, and Chrome's scroll anchoring moves it again when the rows of
   *  another kind show: measured, 366 → 32 px on a selection. What is restored is clamped by the browser. */
  steady(fn) {
    const parts = [this.form, this.form && this.form.closest(".panel"), this.ring_list].filter(Boolean), at = parts.map((p) => p.scrollTop);
    fn();
    parts.forEach((p, k) => { if (p.scrollTop !== at[k]) p.scrollTop = at[k]; });
  },
};
