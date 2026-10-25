// windows.js — the Windows tab: the four window cards, a window's shape and place, its times, the day names typed, the
// date popup of the bar's date, and X-ray with the disc that passes the case.

import * as G from "./geometry.js";
import { KIND_TAB_KEYS, el } from "./ui.js";
import { WINDOW_CARDS, menu_arrow } from "./rows.js";
import { PICS, STEP, TOOL_ICONS, card_pic, icon } from "./icons.js";

export const WINDOWS = {
  /** your own words for a window (#515, #516): one small field each — a day window's seven, an am · pm window's two — the
   *  tool's own word faint in a blank one, which is what it shows. They fill the controls' columns side by side. */
  row_own_names(wrap, out, row) {
    const fields = Array.from({ length: row.count }, (_, i) => {
      const f = el("input", { type: "text", className: "ownname", ariaLabel: `${row.text} ${i + 1}`, spellcheck: false });
      f.oninput = () => { const T = this.target("window"), list = Array.from({ length: row.count }, (_, k) => (T.own_names && T.own_names[k]) || ""); list[i] = f.value; this.set_value("window", "own_names", list.some(Boolean) ? list : null); };
      return f;
    });
    wrap.append(el("label", { textContent: row.text }), el("span", { className: "ownnames", style: `--n: ${Math.min(row.count, 4)}` }, ...fields));      // four to a line at most: a day's word needs the room
    out.refresh = (T) => { const hint = row.hint(T); fields.forEach((f, i) => { f.placeholder = hint[i] || ""; if (document.activeElement !== f) f.value = (T.own_names && T.own_names[i]) || ""; }); };
  },

  /** the complications act like tabs (Okay, 18 Oct 2026: "Act like tabs, selecting them changes settings accordingly",
   *  #328): each kind keeps its own settings for the window — its shape and size, its text, colours and font — and a kind
   *  taken again brings its own back. Where the window stands (on, place, radius, guide, link) is shared by its kinds.
   *  Kept for this visit (a link keeps the window as it is shown); a kind never taken starts from what the window has.
   *  → whether the kind's own settings came back. */
  kind_tab(T, to) {
    const mine = ((this.kind_tabs ||= {})[this.S.ui_window] ||= {});
    mine[T.kind ?? 0] = Object.fromEntries(KIND_TAB_KEYS.map((k) => [k, structuredClone(T[k])]));
    const back = mine[to];
    if (!back) return false;
    for (const [k, v] of Object.entries(back)) T[k] = structuredClone(v);
    return true;
  },

  /** the bar's date popup (#402, #412): one line — the weekday, then the day, the month and the year, each a menu, then
   *  − and + side by side (Okay, 19 Oct 2026: "Minus moves next to plus, dropdowns just for groupings"; "Remove time"):
   *  a day earlier or later. Its parts keep their widths whatever the date reads ("size fixed, no movements by change in
   *  content"). The menus are the rows' menus (menu_arrow, R34) on the bar's dark; built once, hidden. */
  date_pop_box() {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekday = el("span", { className: "popword weekday", id: "date-pop-weekday" });
    const shown = () => new Date(G.shown_day(this.S) + "T12:00:00");
    const put = (d) => this.set_value("global", "date", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    // one group: its value as a word over the browser's own menu, unseen, with the boxed arrow; `set` moves the date
    const group = (name, set) => {
      const select = el("select", { id: "date-pop-" + name, ariaLabel: "The " + name });
      const word = el("span", { className: "popword" });
      select.onchange = () => { const d = shown(); set(d, +select.value); put(d); this.date_pop_sync(); };
      return { select, word, el: el("span", { className: "popgroup pop-" + name }, word, menu_arrow(select)) };
    };
    const day = group("day", (d, v) => d.setDate(v));
    const month = group("month", (d, v) => { const keep = d.getDate(); d.setDate(1); d.setMonth(v); d.setDate(Math.min(keep, new Date(d.getFullYear(), v + 1, 0).getDate())); });
    const year = group("year", (d, v) => { const keep = d.getDate(), m = d.getMonth(); d.setDate(1); d.setFullYear(v); d.setDate(Math.min(keep, new Date(v, m + 1, 0).getDate())); });
    MONTHS.forEach((m, i) => month.select.append(el("option", { value: i, textContent: m })));
    const step = (sign) => el("button", { type: "button", className: "popstep", innerHTML: sign < 0 ? STEP.minus : STEP.plus, ariaLabel: sign < 0 ? "A day earlier" : "A day later", onclick: () => this.step_day(sign) });
    this.date_pop = el("div", { className: "barpop datepop", id: "date-pop", hidden: true },
      el("div", { className: "popline" }, weekday, day.el, month.el, year.el, el("span", { className: "popsteps" }, step(-1), step(1))));
    this.date_pop.onkeydown = (e) => { if (e.key === "Escape") this.date_pop_open(false); };
    this.date_pop_sync = () => {
      if (!this.date_pop || this.date_pop.hidden) return;
      const d = shown(), y = d.getFullYear(), m = d.getMonth(), last = new Date(y, m + 1, 0).getDate();
      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      weekday.textContent = DAYS[d.getDay()];
      if (!weekday.style.width) {      // as wide as the widest weekday, measured in its own type, so the popup never changes size (#412: "size fixed, no movements by change in content")
        const pen = document.createElement("canvas").getContext("2d"), c = getComputedStyle(weekday);
        pen.font = `${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
        weekday.style.width = Math.ceil(Math.max(...DAYS.map((x) => pen.measureText(x).width))) + "px";
      }
      if (day.select.options.length !== last) day.select.replaceChildren(...Array.from({ length: last }, (_, i) => el("option", { value: i + 1, textContent: i + 1 })));
      if (+(year.select.options[0] || {}).value !== y - 50) year.select.replaceChildren(...Array.from({ length: 101 }, (_, i) => el("option", { value: y - 50 + i, textContent: y - 50 + i })));
      day.select.value = d.getDate(); month.select.value = m; year.select.value = y;
      day.word.textContent = d.getDate(); month.word.textContent = MONTHS[m]; year.word.textContent = y;
    };
    return this.date_pop;
  },

  date_pop_open(on) {
    this.date_pop.hidden = !on;
    this.date_button.setAttribute("aria-expanded", String(on));
    if (on) { this.date_pop_sync(); if (this.date_pop_away) document.removeEventListener("pointerdown", this.date_pop_away, true); this.date_pop_away = (e) => { if (!this.date_pop.contains(e.target) && e.target !== this.date_button && !this.date_button.contains(e.target)) this.date_pop_open(false); }; document.addEventListener("pointerdown", this.date_pop_away, true); }
    else if (this.date_pop_away) { document.removeEventListener("pointerdown", this.date_pop_away, true); this.date_pop_away = null; }
  },

  /** the day shown, a day earlier or later (the bar's date popup) */
  step_day(sign) {
    const d = new Date(G.shown_day(this.S) + "T12:00:00");
    d.setDate(d.getDate() + sign);
    this.set_value("global", "date", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    this.date_pop_sync();
  },

  /** X-ray (#346): a switch under Guides, shown while a window with a disc is on — a date, day or am · pm window. On,
   *  every such disc is drawn whole in a stack (geometry.js scene: the selected window's disc on top at full strength
   *  with a white dotted outline, then the hands, the face, the other discs, each layer 15 % fainter than the one
   *  above — Okay, 19 Oct 2026). Preview only: never in an export (R5, R26). */
  xray_box() {
    const b = el("button", { type: "button", className: "onview casebox xraybox", id: "xray", title: "X-ray: the windows' discs under the plate (preview only)", onclick: () => this.set_value("global", "xray", !this.S.xray) }, el("span", { className: "word", textContent: "X-ray" }));
    b.insertAdjacentHTML("afterbegin", icon(TOOL_ICONS.xray, 18));
    this.xray_sync = () => {
      const S = this.S, has = G.windows_of(S).some((w) => w.on && ["date", "day", "am · pm"].includes(G.WINDOW_KINDS[w.kind]));
      b.hidden = !has; b.classList.toggle("on", Boolean(S.xray)); b.setAttribute("aria-pressed", String(Boolean(S.xray)));
    };
    this.xray_sync();
    return b;
  },

  /** the selected window's disc past the case, with physics on (4.72): how far, in mm, or 0. (The panel shows the
   *  selected window's rows; its settings come as a fresh object each time, so they are found by the selection.) */
  disc_past() {
    const d = G.disc_of(this.S, this.S.ui_window);
    return d && !d.fits ? d.reach - (this.S.dial_d / 2 - G.DISC_RIM) : 0;
  },

  /** Windows, on top: four cards, 12 · 3 · 6 · 9, starting on the second column. A card is a small dial with its window
   *  drawn where it is: filled when it is shown, an outline when it isn't. They are tabs: a press chooses the window
   *  the panes below are about. A window not in use yet goes to its card's place when its card is first pressed. */
  row_window_cards(wrap, out) {
    wrap.className = "windowcards";
    const grid = el("div", { className: "cards", role: "tablist", ariaLabel: "Which window" });
    const cards = WINDOW_CARDS.map((c) => {
      const pic = el("span", { className: "pic" });       // the card is its picture alone: a small dial with the window in its place, filled when the window is shown (Okay, 13 Oct 2026: no number under it)
      const b = el("button", { type: "button", className: "tab", id: "window-card-" + c.slot, onclick: () => {
        const w = G.windows_of(this.S)[c.slot];
        this.S.ui_window = c.slot; this.unselected = false;
        if (!w.on && w.at === G.WINDOW_BASE.at && c.at !== w.at) { w.at = c.at; this.static_dirty = true; }      // never used: it starts at its card's place
        this.sync_rows();
        this.render();
      } }, pic);
      b.setAttribute("role", "tab");
      grid.append(el("div", { className: "card" }, b));
      return { ...c, b, pic, drawn: "" };
    });
    wrap.append(grid);
    out.refresh = (S) => {
      for (const c of cards) {
        const w = G.windows_of(S)[c.slot], at = !w.on && w.at === G.WINDOW_BASE.at ? c.at : w.at;      // never used: shown at its card's place, where it will start
        const used = w.on || w.at !== G.WINDOW_BASE.at || w.at_deg != null;
        const place = used ? G.window_place(w) : G.DATE_AT[at][0], angle = used ? G.window_angle(w) : G.DATE_AT[at][1];
        const state = `${angle}/${Boolean(w.on)}`;
        if (c.drawn !== state) {
          c.drawn = state;
          c.pic.innerHTML = card_pic(angle, w.on);
          c.b.title = `The window at ${place}${w.on ? "" : " (not shown)"}`;
        }
        c.b.classList.toggle("on", c.slot === S.ui_window);
        c.b.classList.toggle("off", !w.on);
        c.b.setAttribute("aria-selected", String(c.slot === S.ui_window));
      }
    };
  },

  /** a window's shape as picture tiles: rectangle · circle · polygon · its kind's own · arc. What is stored is the place
   *  in G.WINDOW_SHAPES; 0, "as its kind", shows as the shape that kind has had all along. The kind's own shape stands
   *  fourth and only for its kind: a moon's arch, an am · pm's half (Okay, 20 Oct 2026, 01:16: "Am/pm window should come
   *  selected as a shape instead of moon window. moon window button only active with moon selected, absent from others") */
  row_window_shape(wrap, out) {
    // the shapes as buttons without words, stretched along the Shape heading's line as Position's are along theirs
    // (#265, 4.46.1; Okay on the mock-ups: "stretch shapes like position, top-right"). The row goes on the heading line (head)
    wrap.className = "row pick";
    const group = el("span", { className: "btnline shapes", role: "radiogroup", ariaLabel: "Shape" });
    const names = ["rectangle", "circle", "polygon", "arch", "half", "arc"], own = { arch: "moon phase", half: "am · pm" };      // shown in this order; arch and half only for their kinds
    names.forEach((name) => {
      const at = G.WINDOW_SHAPES.indexOf(name);
      const tile = el("button", { type: "button", id: `window-shape-${name}`, title: name, ariaLabel: name, onclick: () => this.set_value("window", "shape", at) });
      tile.setAttribute("role", "radio");
      tile.innerHTML = icon(PICS.hole[at - 1], 26, 18);
      group.append(tile);
    });
    wrap.append(el("span"), group);
    out.refresh = (T) => [...group.children].forEach((b, i) => {
      const name = names[i], on = name === G.window_shape(T);
      b.hidden = Boolean(own[name]) && G.WINDOW_KINDS[T.kind] !== own[name];
      b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on));
    });
  },

  /** a window's place (Okay, 13 Oct 2026): every named place is a button, so the others are seen and pressed — first
   *  the four quarters, a square of 3 · 6 · 9 · 12; a white bar; then the places between; and a last box, three dots,
   *  that opens the tag with a field for any time ("2:15"). The window keeps the place in the list (at, R9), or the
   *  time's angle (at_deg) when it has one of its own. */
  row_window_at(wrap, out) {
    // Position (#264, 4.46.1; Okay's notes, p. 19–20: "five square buttons, 3 · 6 · 9 · 12 and one with three dots";
    // on the mock-ups, 16 Oct 2026: on the heading's line, "Position should not be small", "3 6 9 12 are circular
    // buttons now"). The dots open the popup with every place as a button and a field for any time; when the window
    // stands elsewhere they say where, and grow into a pill to hold it. The row goes on the heading line (head).
    wrap.className = "row windowat";
    const at = (name) => G.DATE_AT.findIndex((d) => d[0] === name);
    const press = (i) => { const w = this.window(); w.at = i; w.at_deg = null; this.changed(true); };
    const quarters = ["3", "6", "9", "12", "4"].map((name) => el("button", { type: "button", id: "window-at-Position-" + at(name), textContent: name, onclick: () => press(at(name)) }));      // and 4 (Okay, on 4.46.1: "Add 4 to the circles before …")
    const more = el("button", { type: "button", className: "atmore", id: "window-at-more", textContent: "···", title: "Every place, or any time: 2:15, 7:40…" });
    more.setAttribute("aria-expanded", "false");
    more.onclick = () => this.value_pop_open(more, { kind: "custom", name: "at_time", scope: "window", key: "at_deg", text: "Position" });
    wrap.append(el("label", { textContent: "Position" }), el("span", { className: "circles" }, ...quarters, more));
    out.refresh = (T) => {
      for (const b of quarters) b.classList.toggle("on", T.at_deg == null && b.id === "window-at-Position-" + T.at);
      const elsewhere = T.at_deg != null || !["3", "6", "9", "12", "4"].includes(G.DATE_AT[T.at]?.[0]);
      more.classList.toggle("on", elsewhere);
      more.textContent = elsewhere ? G.window_place(T) : "···";
    };
  },

  /** inside the tag that the three dots open: the window's place as a time, typed. "2:15", "2.25" and "14:15" all
   *  say a quarter past two; a named place typed here ("4:30") is that place. */
  row_at_time(wrap, out) {
    wrap.className = "row txt";
    const field = el("input", { type: "text", id: "window-at-time", inputMode: "numeric", placeholder: "2:15" });
    const take = () => {
      const m = field.value.trim().match(/^(\d{1,2})(?:[:.,h ](\d{1,2}))?$/), w = this.window();
      if (!m || +m[1] > 24 || +(m[2] || 0) > 59) { field.value = G.window_place(w); return; }
      const dot = /[.,]/.test(field.value) && m[2] !== undefined;      // 2.25: a quarter of an hour, not 25 minutes
      const deg = ((+m[1] % 12) + (dot ? +("0." + m[2]) : +(m[2] || 0) / 60)) * 30, named = G.DATE_AT.findIndex((d) => Math.abs(d[1] - deg) < 0.01);
      if (named >= 0) { w.at = named; w.at_deg = null; } else w.at_deg = deg;
      this.changed(true);
    };
    field.onchange = take;
    // every named place, in the clock's order, as a button (#264: "the dots open a popup with all the places pre-buttoned")
    const order = ["12", "1:30", "3", "4", "4:30", "6", "7:30", "9", "10:30"], idx = (name) => G.DATE_AT.findIndex((d) => d[0] === name);
    const places = order.map((name) => el("button", { type: "button", id: "window-at-place-" + idx(name), textContent: name, onclick: () => { const w = this.window(); w.at = idx(name); w.at_deg = null; this.changed(true); this.value_pop_close(); } }));
    wrap.append(el("label", { htmlFor: "window-at-time", textContent: "Time" }), el("span", { className: "places" }, ...places), field);
    out.refresh = (T) => {
      if (document.activeElement !== field) field.value = G.window_place(T);
      for (const b of places) b.classList.toggle("on", T.at_deg == null && b.id === "window-at-place-" + T.at);
    };
  },
};
