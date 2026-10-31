// rings.js — the Rings tab: the ring list (rows, grips, drag to reorder, rename, the selected ring's line and tools),
// the rows a ring has (round ends, Show, Positions, Give way, Resize from, Edit one numeral) and the numeral picked.

import * as G from "./geometry.js";

import { $, KEY, RING_ROWS, SNAP_DEG, clamp, el, paint } from "./ui.js";
import { DENSE, KIND_PIC, LINE, PICS, SIGNS, TOOL_ICONS, eye, icon, round_sign } from "./icons.js";
import { VALUE_PICS, chevron_box, num, radius_row, size_row } from "./rows.js";

export const RINGS = {
  /** the numeral or mark Nudge works on, outlined on the dial in its ring's guide colour while the Nudge pane is open
   *  on the Rings tab (4.78, #349) — so the one a press chose, or the list chose, is seen. */
  draw_picked() {
    const S = this.S, R = this.ring(), nudge = this.rows && this.rows.find((r) => r.fold && r.row.text === "Edit one numeral");
    const d = !S.ui_show && !this.unselected && S.ui_section === 1 && R && nudge && !nudge.el.hidden && !this.is_folded(nudge) ? this.statik.rings.find((x) => x.ring === R) : null;
    const k = d ? d.at.indexOf(+this.nudge_at) : -1, part = k >= 0 && d.parts ? d.parts[k] : null;
    // a box touching it, not its outline (Okay, 04:52: "selected number on dial too aggressive. This may be a rectangular tangent box around number")
    const b = part ? part.bounds() : null, f = (v) => v.toFixed(3);
    const path = b ? `M${f(b[0])} ${f(b[1])}H${f(b[2])}V${f(b[3])}H${f(b[0])}Z` : "", tone = G.GUIDE_COLOURS[G.ring_guide(S, S.ui_ring) ?? S.gd_k_sel] || G.GUIDE_COLOURS[0];
    for (const line of this.picked) { if (line.getAttribute("d") !== path) line.setAttribute("d", path); }
    this.picked[1].style.setProperty("--picked", tone);
  },

  /** Give way to rings above (#258, 4.50.2): two side tabs (Skip where · Knock out) and a square that pictures the
   *  choice. The picture: a row of this ring's ticks, and over them three marks of rings above, faint — a marker, a
   *  numeral, a tick. Skip where drops the tick under each mark the choice names; Knock out cuts it back by the
   *  clearance instead. Which tab is open is this session's, not the dial's (nothing stored, R31 free). */
  row_give_way(wrap, out) {
    wrap.className = "giveway";
    wrap.id = "give-way";
    const NAMES = ["Skip where", "Knock out"], KEYS = ["skip", "knock"], LISTS = [G.SKIP_FROM, G.KNOCK_FROM];
    const tabs = el("div", { className: "givetabs", role: "tablist", ariaLabel: "How this ring gives way" });
    const box = el("div", { className: "givebox", id: "give-box" });
    const picture = el("div", { className: "givepic", role: "img" });
    const choices = el("div", { className: "givechoices", role: "radiogroup" });
    const clear = this.build_row(num("clear", "Clearance", 0, 2, 0.01, { scope: "ring", side: true, quiet: true }));
    box.append(picture, choices, clear.el);
    wrap.append(tabs, box);
    NAMES.forEach((name, i) => {
      const b = el("button", { type: "button", className: "givetab", id: "give-tab-" + i, textContent: name, role: "tab", onclick: () => { this.give_tab = i; this.sync_rows(); } });
      tabs.append(b);
    });
    // the drawing, 2 : 1: this ring's ticks along the foot, in ink and thick (a dial's ticks pictured, as the kind
    // pictures' are — Okay, 18 Oct 2026, on 4.51.1: "thicker indices, better indication of the actual state on watch");
    // over them, in a lighter tone and as outlines, the marks of the rings above where they really lie — on the same
    // band of the dial — so what the choice does to the ticks under them shows: run through (nothing), gone (skip),
    // cut back by the clearance (knock out). (4.50.2 to 4.51.1: thin lines, the marks above standing over the ticks.)
    const TICKS = [16, 30, 44, 58, 72, 86, 100, 114, 128], ABOVE = { 30: "markers", 72: "numerals", 114: "ticks" }, BOTTOM = { 30: 48.25, 72: 44, 114: 48.25 };
    const draw = (tab, i) => {
      const kinds = G.FROM_KINDS[i], gap = tab === 1 ? Math.max(2, 20 * (this.ring().clear || 0)) : 0;      // the clearance in the drawing: 20 px a mm, never less than a line's width
      const ticks = TICKS.map((x) => {                   // 3 wide, its edges on whole dots
        const kind = ABOVE[x];
        if (!kind || !kinds.includes(kind)) return `M${x + 0.5} 34V62`;
        if (tab === 0) return "";
        return BOTTOM[x] + gap >= 62 ? "" : `M${x + 0.5} ${BOTTOM[x] + gap}V62`;
      }).join("");
      return `<svg viewBox="0 0 144 72" width="144" height="72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="butt">`
        + `<path class="own" d="${ticks}" stroke-width="3"/>`
        + `<g class="above"><rect x="26.75" y="20.75" width="7.5" height="27.5"/>`
        + `<text class="figure" x="72.5" y="34" font-size="26" text-anchor="middle" dominant-baseline="central" fill="none" stroke="currentColor" stroke-width="${DENSE}">6</text>`
        + `<rect x="112.25" y="24.75" width="4.5" height="23.5"/></g></svg>`;
    };
    let drawn = "";
    out.refresh = (R) => {
      const tab = this.give_tab ?? (R.knock && !R.skip ? 1 : 0), key = KEYS[tab], list = LISTS[tab], at = R[key] || 0;
      [...tabs.children].forEach((b, i) => { b.classList.toggle("on", i === tab); b.setAttribute("aria-selected", String(i === tab)); });
      const now = `${tab}:${at}:${R.clear}`;
      if (now !== drawn) {
        drawn = now;
        picture.innerHTML = draw(tab, at);
        choices.ariaLabel = NAMES[tab];
        choices.replaceChildren(...list.map((text, i) => {
          const id = `ring-give-${key}-${i}`;
          const r = el("input", { type: "radio", name: "give-" + key, id, checked: i === at });
          r.onchange = () => { if (r.checked) this.set_value("ring", key, i); };
          return el("label", { className: "check", htmlFor: id }, r, " " + text);
        }));
      }
      picture.ariaLabel = `${NAMES[tab]}: ${list[at]}`;
      clear.el.hidden = !(tab === 1 && R.knock !== 0);
      clear.refresh(R);
    };
  },

  /** Reset: the opener back, every setting — the guide's First dial (opener.js). It replaces the whole dial, so it
   *  stands last in the Dial tab, apart from what is changed often, with its warning under it; undo brings the dial back. */
  /** Resize Ring from …, on the pane's heading line (#419): "from" in plain type, then the radius's own menu (what it
   *  measures to) as a box saying the choice, stretched to the margin, with the boxed arrow the rows' menus have.
   *  Numerals: Centre · Outer edge · Inner edge; marks and bands: Outer · Middle · Inner. */
  row_resize_from(wrap, out) {
    wrap.className = "row";
    const select = el("select", { id: "resize-from", title: "What the radius measures to", ariaLabel: "Resize ring from" });
    let menu = null;
    select.onchange = () => this.set_value("ring", menu.key, +select.value);
    const chev = chevron_box(select), words = chev.box.querySelector(".v");      // a press anywhere on the box opens the list, never folds the pane (Okay, 20 Oct 2026, 01:05: "clicking 'centre' activates dropdown not collapse")
    words.classList.add("fromwords");
    wrap.append(el("span"), el("span", { className: "fromwide" }, el("span", { className: "fromword quiet", textContent: "from" }), chev.box));
    out.refresh = (R) => {
      const now = radius_row(R).menu;
      if (now !== menu) { menu = now; select.replaceChildren(...menu.items.map(([v, name]) => el("option", { value: v, textContent: name }))); }
      const v = R[menu.key] ?? 0, item = menu.items.find(([x]) => x === v) || menu.items[0];
      select.value = item[0]; words.textContent = item[1];
    };
  },

  /** the ring list: order = stacking order, top ring first. Its tools are on the pane's heading line (head_ring_tools). */
  row_ring_list(wrap, out) {
    wrap.className = "ringlist";
    this.ring_list = el("ol", { ariaLabel: "Rings, top first" });
    this.ring_list.setAttribute("role", "listbox");      // its rows are options (#244)
    this.ring_list.onscroll = () => this.value_pop_close();      // the pop-up hangs where the ring line was
    wrap.append(this.ring_list);
    this.list_grip();
    this.fill_ring_list();
  },

  /** the ring list holds five rings and the drawer, then scrolls (4f-rings.css). With more rings than that a pill
   *  stands in the middle of the pinned part's black line — the phone's gripper, but black — and dragging it shows
   *  more or fewer rows; a tap jumps between five and all. Remembered by this browser, not by the dial (Okay's notes,
   *  p. 2, #256: "there's a limit to it … a resize pill"). */
  list_grip() {
    const ol = this.ring_list, set = (n) => { this.ring_rows_shown = n; ol.style.setProperty("--ring-rows", String(n)); this.sync_list_grip(); };
    try { const kept = parseInt(localStorage.getItem(KEY("ring-rows"))); if (kept >= 1) set(kept); } catch (e) { /* not kept */ }
    const grip = el("div", { className: "listgrip", id: "list-grip", title: "Drag to show more or fewer rings", ariaLabel: "Rings shown" });
    grip.setAttribute("role", "separator");
    const most = () => Math.max(this.S.rings.length, 1), rows = () => this.ring_rows_shown ?? RING_ROWS;
    let down = null;
    grip.onpointerdown = (e) => { grip.setPointerCapture(e.pointerId); down = { y: e.clientY, moved: false }; grip.classList.add("gripping"); };
    grip.onpointermove = (e) => {
      if (!down) return;
      if (Math.abs(e.clientY - down.y) > 4) down.moved = true;
      if (!down.moved) return;
      const c = getComputedStyle(ol), pitch = parseFloat(c.getPropertyValue("--line")) + parseFloat(c.getPropertyValue("--ring-gap")), top = ol.getBoundingClientRect().top + parseFloat(c.paddingTop);
      const drawer = this.ring_line_holder ? this.ring_line_holder.offsetHeight : 0;
      set(clamp(Math.round((e.clientY - top - drawer) / pitch), 1, most()));      // whole rows: the pill snaps
    };
    grip.onpointerup = grip.onpointercancel = (e) => {
      if (!down) return;
      if (!down.moved && e.type === "pointerup") set(rows() === RING_ROWS ? most() : RING_ROWS);
      down = null;
      grip.classList.remove("gripping");
      try { localStorage.setItem(KEY("ring-rows"), String(this.ring_rows_shown)); } catch (er) { /* not kept */ }
    };
    this.pinned.append(grip);
  },

  /** every pinned part has a pill on its black line (Okay, 20 Oct 2026, 03:41: "All persistents get a resizer as default.
   *  apart from hands and windows"): the Rings tab's is the ring list's (list_grip), shown always; on the others the
   *  pinned panes go into a box of their own that the pill makes shorter (it then scrolls) or taller, up to all of it; a
   *  tap jumps between all and its first line. Remembered by this browser per tab, as the list's rows are. */
  pin_grip(name) {
    if (["Hands", "Date"].includes(name) || this.pinned.hidden || this.ring_list || this.S.ui_show) return;      // show mode's pinned lines are two: nothing to resize
    const body = el("div", { className: "pinbody" }, ...this.pinned.children), key = KEY("pinned-" + name);
    const grip = el("div", { className: "listgrip pingrip", id: "pin-grip", title: "Drag to make this part taller or shorter", ariaLabel: "Height of what stays in view" });
    grip.setAttribute("role", "separator");
    this.pinned.replaceChildren(body, grip);
    this.pinned.classList.add("pin-resize");
    const set = (h) => { if (h == null) body.style.removeProperty("max-height"); else body.style.maxHeight = h + "px"; this.pinned_h = h; };
    try { const kept = parseFloat(localStorage.getItem(key)); if (kept > 0) set(kept); } catch (e) { /* not kept */ }
    const least = () => { const first = body.querySelector(".fold"); return first ? first.getBoundingClientRect().height : 40; };
    let down = null;
    grip.onpointerdown = (e) => { grip.setPointerCapture(e.pointerId); down = { y: e.clientY, h: body.getBoundingClientRect().height, moved: false }; grip.classList.add("gripping"); };
    grip.onpointermove = (e) => {
      if (!down) return;
      if (Math.abs(e.clientY - down.y) > 4) down.moved = true;
      if (!down.moved) return;
      const h = down.h + e.clientY - down.y;
      set(h >= body.scrollHeight - 1 ? null : Math.max(h, least()));      // dragged to all of it: no limit, so a pane opened later shows whole
    };
    grip.onpointerup = grip.onpointercancel = (e) => {
      if (!down) return;
      if (!down.moved && e.type === "pointerup") set(this.pinned_h == null ? least() : null);
      down = null;
      grip.classList.remove("gripping");
      try { if (this.pinned_h == null) localStorage.removeItem(key); else localStorage.setItem(key, String(this.pinned_h)); } catch (er) { /* not kept */ }
    };
  },

  /** the list's pill shows whenever it has a use (#448, R17: no dead end): the list scrolls (more rings than the rows
   *  shown, however few were kept), or it was made taller than five and can be made shorter again. */
  sync_list_grip() {
    if (!this.pinned) return;
    const n = this.S.rings.length, rows = this.ring_rows_shown ?? RING_ROWS;
    this.pinned.classList.toggle("ring-scrolls", n > 0 || rows !== RING_ROWS);      // shown always, as every pinned part's pill (Okay, 20 Oct 2026, 03:41: "All persistents get a resizer as default")
  },

  /** the selected ring's row and the drawer under it, whole in the list's view (Okay's notes, p. 2, #256: "even if
   *  only a few pixels of it show, scrolls so its whole row and drawer are in the view box"); the row wins when both
   *  can't fit. Only the list scrolls here (on a phone it has no height of its own). */
  fit_ring() {
    const ol = this.ring_list, row = this.ring_rows()[this.S.ui_ring], holder = this.ring_line_holder;
    if (!ol || !row || ol.scrollHeight <= ol.clientHeight) return;
    const top = row.offsetTop, bottom = (holder && holder.isConnected ? holder : row).offsetTop + (holder && holder.isConnected ? holder : row).offsetHeight;
    let at = ol.scrollTop;
    if (bottom > at + ol.clientHeight) at = bottom - ol.clientHeight;
    if (top < at) at = top;
    if (at !== ol.scrollTop) ol.scrollTop = at;
  },

  /** the list's tools, on the heading line: a plus that opens the four kinds (add one above the selected ring),
   *  then what you can do to the selected ring. All five are the same outlined circle (Okay, 13 Oct 2026). */
  head_ring_tools() {
    const menu = el("div", { className: "addmenu", id: "add-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const plus = el("button", { type: "button", className: "sign", id: "ring-add", title: "Add a ring", ariaLabel: "Add a ring" });
    plus.innerHTML = round_sign(SIGNS.plus);
    plus.setAttribute("aria-haspopup", "menu");
    const open = (on) => { menu.hidden = !on; plus.setAttribute("aria-expanded", String(on)); };
    this.add_open = open;
    plus.onclick = () => open(menu.hidden);
    G.KINDS.forEach((kind, i) => {
      const b = el("button", { type: "button", id: "add-" + kind, onclick: () => { open(false); this.ring_tool("add", kind); } });
      b.innerHTML = PICS.kind(i, 24);
      b.append(el("span", { textContent: kind[0].toUpperCase() + kind.slice(1) }));
      b.setAttribute("role", "menuitem");
      menu.append(b);
    });
    const tools = el("span", { className: "headtools signs" }, el("span", { className: "adder" }, plus, menu));
    tools.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); plus.focus(); } };
    for (const [action, title] of [["up", "Move up"], ["down", "Move down"], ["duplicate", "Duplicate"], ["delete", "Delete"]]) {
      const b = el("button", { type: "button", className: "sign", id: "ring-" + action, title, ariaLabel: title, onclick: () => this.ring_tool(action) });
      b.innerHTML = round_sign(TOOL_ICONS[action]);
      tools.append(b);
    }
    open(false);
    return tools;
  },

  /** a text ring's angle snaps to the positions of the other rings — the hours' markers, the minute ticks — when
   *  it comes within SNAP_DEG of one (#297; Okay: "Snap to indice is a great idea for this"). Typed or slid alike. */
  snapped_angle(a) {
    let best = null, off = SNAP_DEG;
    for (const r of this.S.rings) {
      if (r === this.ring() || !r.on || G.kind_of(r) === "band") continue;
      const angles = G.ring_angles(r);
      for (const i of G.positions_of(r)) { const d = Math.abs((((a - angles[i]) % 360) + 540) % 360 - 180); if (d < off) { off = d; best = angles[i]; } }
    }
    return best === null ? a : +(((best + 180) % 360 + 360) % 360 - 180).toFixed(6);
  },

  /** the selected ring's line (Okay's design, 13 Oct 2026; redrawn after his PSD of 18 Oct 2026, notes 2, #335 #327): a
   *  framed line in the list, right under the selected ring's row: the ring's details written out in full on two lines
   *  (grey names, dark values) in the names' room · its colour, a bare swatch · its size and its radius, two round value
   *  buttons that a click opens and a drag changes. Their numbers stand above them, in the selected row (fill_ring_list:
   *  "Numbers update above the icons, that's enough"), so they have no tag. The kind is changed from the row's kind
   *  icon, which opens the kinds (the drawer's kind square and its Change button are gone: "This 'change' is
   *  meaningless, remove it, write the details in full"). The frame has the colour of the selected ring's guide. */
  row_ring_line(wrap, out) {
    wrap.className = "ringline";
    // the kinds, opened from the selected row's kind icon (#ring-kind-square), with the note that nothing is lost by a
    // change (#253, 4.50; the note went in 4.60). The menu lies over everything, under
    // the icon (the list scrolls and would cut it): in the body, placed on opening.
    if ($("#kind-menu")) $("#kind-menu").remove();      // the last drawer's menu, left in the body
    const menu = el("div", { className: "addmenu kindmenu", id: "kind-menu", hidden: true });
    menu.setAttribute("role", "menu");
    const open = (on) => {
      const icon_at = $("#ring-kind-square");
      if (on && icon_at) { document.body.append(menu); const at = icon_at.getBoundingClientRect(); menu.style.left = `${at.left}px`; menu.style.top = `${at.bottom + 5.5}px`; }
      menu.hidden = !(on && icon_at); if (icon_at) icon_at.setAttribute("aria-expanded", String(!menu.hidden));
    };
    this.kind_open = open;
    this.kind_menu = menu;
    G.KINDS.forEach((kind, i) => {
      const b = el("button", { type: "button", id: `ring-kind-Kind-${i}`, onclick: () => { open(false); this.set_value("ring", "kind", i); } });
      b.setAttribute("role", "menuitemradio");
      b.innerHTML = PICS.kind(i, KIND_PIC);
      b.append(el("span", { textContent: kind[0].toUpperCase() + kind.slice(1) }));
      menu.append(b);
    });
    // (its note — "Settings stay with the ring. Switch back any time." — went in 4.60: Okay, "Remove the explainer from dropdown")
    menu.onkeydown = (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); const k = $("#ring-kind-square"); if (k) k.focus(); } };
    // the details: two lines, each cut at its end when long (ring_details)
    const details = el("div", { className: "details", id: "ring-details" });
    const colour = this.colour_pill("ring-c-Colour", "");
    colour.classList.add("bare");                  // the swatch alone: no hex
    colour.dataset.tip = colour.ariaLabel = "Colour";
    colour.onclick = () => this.pop_open(this.colour_of_row({ scope: "ring", key: "c", text: "Colour" }), colour);
    const size = this.value_button("ring-size", () => size_row(this.ring()), VALUE_PICS.size, false);
    const radius = this.value_button("ring-r", () => radius_row(this.ring()), VALUE_PICS.radius, false);
    wrap.append(details, colour, size.el, radius.el);
    this.ring_line_holder = el("li", { className: "lineholder" }, wrap);      // it lives in the list (place_ring_line), not among the pane's rows
    out.el = el("span", { className: "nothing" });
    out.refresh = (R) => {
      [...menu.querySelectorAll("button")].forEach((b, i) => { b.classList.toggle("on", i === R.kind); b.setAttribute("aria-checked", String(i === R.kind)); });
      const lines = this.ring_details(R), said = JSON.stringify(lines);
      if (details.dataset.said !== said) {
        details.dataset.said = said;
        details.replaceChildren(...lines.map((line) => el("span", { className: "line" }, ...line.flatMap(([name, value], k) =>
          [...(k ? [" · "] : []), el("span", { className: "k", textContent: `${name}: ` }), value]))));
        details.title = lines.map((line) => line.map(([n, v]) => `${n}: ${v}`).join(" · ")).join("\n");
      }
      colour.show(R.c);
      size.refresh();
      radius.refresh();
    };
  },

  /** a ring written out in full for its drawer (#327; Okay's PSD, 18 Oct 2026: "Custom: LONDON, PARIS, CAIRO…" over
   *  "Positions: 24 · Nudge One Numeral: 1-…"): two lines of [name, value] pairs. The first says what it draws — a
   *  numeral ring its set and the labels it draws, a text ring its words, ticks and markers their shape and its
   *  measures, a band its width and fill. The second says where: how many positions, and what departs from a whole
   *  turn — a start, a span, a give-way, nudged numerals. The names are the panes' and rows' own words. */
  ring_details(R) {
    const kind = G.kind_of(R), len = (mm) => `${parseFloat(this.in_unit(mm, 2))}`, at = G.positions_of(R);
    const what = [], where = [["Positions", String(parseInt(R.count) || 1)]];      // the Positions pane's count (a give-way may draw fewer; it is said after)
    if (kind === "numerals") {
      const labels = G.ring_labels(R);
      what.push([G.LABEL_SETS[R.labels][0], at.map((i) => labels[i]).filter(Boolean).join(", ") || "—"]);
    } else if (kind === "text") what.push(["Text", R.custom || "—"]);
    else if (kind === "band") what.push(["Width", len(R.width)], ["Fill", `${parseFloat(R.fill)}%`]);
    else {
      const shape = G.SHAPES[R.shape];
      what.push(["Shape", shape[0].toUpperCase() + shape.slice(1)]);
      if (shape === "dot") what.push(["Diameter", len(R.w)]);
      else what.push(["Length", len(R.len)], ["Width", len(R.w)]);
    }
    if (+R.start) where.push(["Start", `${parseFloat((+R.start).toFixed(2))}°`]);
    if (+R.span !== 360) where.push(["Span", `${parseFloat((+R.span).toFixed(2))}°`]);
    if (R.skip) where.push(["Skip where", G.SKIP_FROM[R.skip]]);
    if (R.knock) where.push(["Knock out", G.KNOCK_FROM[R.knock]]);
    const nudged = Object.keys(R.nudge || {}).filter((k) => R.nudge[k] && Object.values(R.nudge[k]).some((v) => +v));
    if (G.has_text(R) && nudged.length) { const labels = G.ring_labels(R); where.push(["Edit one numeral", nudged.map((k) => labels[+k] || +k + 1).join(", ")]); }
    return [what, where];
  },

  /** a ring's row says what the ring is, in the ring drawer's own order (Okay, 13 Oct 2026): its kind (with how many
   *  it draws) · its colour · how big one of its things is · its radius. Each of the last three stands over the
   *  drawer's button for it, so the row is the read-out and the drawer under it the controls. "How big" is what you
   *  would name first for its kind: a tick's or marker's length (a dot's Ø), a numeral's size, a band's width.
   *  Lengths in Settings' unit, without trailing zeros. → {kind, size, r} as text */
  ring_summary(ring) {
    const kind = G.kind_of(ring), len = (mm) => String(parseFloat(this.in_unit(mm, 2))), n = G.positions_of(ring).length;
    const one = G.has_text(ring) ? ring.size : kind === "band" ? ring.width : G.SHAPES[ring.shape] === "dot" ? ring.w : ring.len;
    // the count's word: "1 marker", "60 ticks"; a band is one, more are sectors (#185)
    const word = kind === "band" ? (n === 1 ? "band" : "sectors") : kind === "text" ? (n === 1 ? "text" : "texts") : n === 1 ? kind.slice(0, -1) : kind;
    return { kind: `${n} ${word}`, size: len(one), r: len(ring.r) };
  },

  /** the rows follow every change without the list being built again (a name may be being typed in it). */
  sync_ring_summaries() {
    if (!this.ring_list) return;
    // the selected row has the colour of the selected ring's guide on the dial (Okay, 13 Oct 2026): the same thing,
    // marked the same way in both places. No such guide (None): the light blue of before.
    const k = G.ring_guide(this.S, this.S.ui_ring);     // the selected ring's own guide colour (none, or guides for rings off: the light blue)
    const wrap = this.ring_list.closest(".pane"), guide = k !== null && (this.S.gd_rings || this.S.gd_sel) ? G.GUIDE_COLOURS[k] : null;      // on the pane: the ring's row and the ring drawer both take it
    wrap.classList.toggle("guided", Boolean(guide));
    if (guide) wrap.style.setProperty("--guide", guide); else wrap.style.removeProperty("--guide");
    this.place_ring_line();
    // a tool that can't act now shows inactive (R16, as undo does): up at the top, down at the bottom, delete with one ring
    const none = { up: this.S.ui_ring === 0, down: this.S.ui_ring >= this.S.rings.length - 1, delete: this.S.rings.length <= 1 };
    for (const [action, off] of Object.entries(none)) { const b = $("#ring-" + action); if (b) { b.classList.toggle("none", off); b.setAttribute("aria-disabled", String(off)); } }
    const R = this.ring(), says = R ? this.ring_summary(R) : null;
    for (const [id, text] of [["#ring-size-fig", says && says.size], ["#ring-r-fig", says && says.r]]) { const f = $(id); if (f && f.textContent !== text) f.textContent = text; }
    this.ring_rows().forEach((li, i) => {         // a row's kind icon follows a change of kind (#254); its size, radius and colour too (#504)
      const ring = this.S.rings[i], k = li.querySelector(".kindicon");
      if (ring) {
        const said = this.ring_summary(ring), f = li.querySelectorAll(".fig"), dot = li.querySelector(".rowswatch .dot");
        if (f[0] && f[0].textContent !== said.size) f[0].textContent = said.size;
        if (f[1] && f[1].textContent !== said.r) f[1].textContent = said.r;
        if (dot) paint(dot, ring.c);
      }
      if (!ring || !k || k.dataset.kind === String(ring.kind)) return;
      k.dataset.kind = String(ring.kind); k.innerHTML = PICS.kind(ring.kind, KIND_PIC); k.title = G.kind_of(ring);
    });
  },

  /** one row per ring: eye (show or hide it on the dial) · grip · name, with the rename box right beside it (selected
   *  ring only, not while it is hidden, and not when the line is too full) · its kind · its colour · its size · its
   *  radius (ring_summary). A click on the selected ring's name renames it; a click anywhere else on a row selects it. */
  fill_ring_list() {
    if (!this.ring_list) return;
    this.sync_list_grip();
    this.ring_list.replaceChildren();
    this.S.rings.forEach((ring, i) => {
      const selected = i === this.S.ui_ring;
      const show = el("button", { type: "button", className: "eye", title: ring.on ? "Hide this ring" : "Show this ring", ariaLabel: `Show ${ring.name}`, onclick: (e) => { e.stopPropagation(); this.show_ring(i, !ring.on); } });      // the eye only shows or hides: the selection stays, so the ring line doesn't move and the next eye stays under the pointer (#183)
      show.setAttribute("aria-pressed", String(ring.on));
      show.innerHTML = eye(ring.on);
      const grip = el("span", { className: "grip", title: "Drag to change the order" });
      grip.innerHTML = icon(TOOL_ICONS.grip);
      grip.onpointerdown = (e) => this.drag_ring(e, i);
      // the kind as an icon where the drawer's square stands, then the name (#254); then its colour, size and radius (#504)
      // the selected row's kind icon is a button that opens the kinds (4.55, Okay's PSD of 18 Oct: the drawer's square went)
      const kind = el(selected ? "button" : "span", { className: "kindicon", id: selected ? "ring-kind-square" : `ring-kind-row-${i}`, title: G.kind_of(ring) });
      kind.dataset.kind = String(ring.kind);
      kind.innerHTML = PICS.kind(ring.kind, KIND_PIC);
      if (selected) {
        kind.type = "button";
        kind.dataset.tip = "Kind"; kind.title = ""; kind.ariaLabel = "Kind";
        kind.setAttribute("aria-haspopup", "menu");
        kind.onclick = (e) => { e.stopPropagation(); if (this.kind_open) this.kind_open(this.kind_menu.hidden); };
        kind.onkeydown = (e) => { if (e.key === "Escape" && this.kind_menu && !this.kind_menu.hidden) { e.stopPropagation(); this.kind_open(false); } };
      }
      const name = el("span", { className: "name", textContent: ring.name || G.kind_of(ring) });
      const cell = el("span", { className: "namecell" }, name);       // the name and, right beside it, the rename box
      // the selected ring's size and radius, large, in Dial Mono, each over its button in the drawer below (4.55, Okay's
      // PSD: "Large mono numbers for size and radius, slashless 0 if possible"); sync_ring_summaries keeps them current
      // every ring's size and radius, in Dial Mono, each over its button in the drawer's columns (4.55, Okay's PSD: "Large
      // mono numbers for size and radius"); every row not selected has its colour too, a swatch in the colour column,
      // where the selected ring's line has its own (Okay, 21 Oct 2026, 22:57 and 23:07, his drawing: "The collapsed ring
      // list shows numbers and appropriate swatch too", #504). sync_ring_summaries keeps them current
      const says = this.ring_summary(ring);
      const figs = [el("span", { className: "fig size", ...(selected ? { id: "ring-size-fig" } : {}), textContent: says.size }), el("span", { className: "fig r", ...(selected ? { id: "ring-r-fig" } : {}), textContent: says.r })];
      const swatch = selected ? [] : [el("span", { className: "colour bare rowswatch", ariaHidden: "true" }, el("i", { className: "dot" }))];
      if (swatch.length) paint(swatch[0].firstChild, ring.c);
      const item = el("li", { className: "ring" + (selected ? " on" : "") + (ring.on ? "" : " off"), tabIndex: 0 }, show, grip, kind, cell, ...swatch, ...figs);
      // a row is a choice in a list, reached with Tab and taken with Enter or Space (#244, 4.47.2: rows had no role and no way in from the keyboard)
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(selected));
      item.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === item) { e.preventDefault(); this.select_ring(i); } };
      let rename = null;
      if (selected && ring.on) {                   // the selected ring is renamed by a click on its name, or on the box beside it (Okay, 13 Oct 2026)
        const start = (e) => { e.stopPropagation(); this.rename_ring(i, item, cell); };
        rename = el("button", { type: "button", className: "rename", title: "Rename this ring", ariaLabel: "Rename this ring", onclick: start });
        rename.innerHTML = icon(TOOL_ICONS.rename, 18);
        cell.append(rename);
        name.classList.add("renames");
        name.title = "Rename this ring";
        name.onclick = start;
      }
      item.onclick = () => { if (!item.querySelector("input")) this.select_ring(i); };
      this.ring_list.append(item);
      if (rename && name.scrollWidth > name.clientWidth) rename.hidden = true;       // no room: the box goes, the name keeps its letters (and still renames)
    });
    this.place_ring_line();
  },

  /** the rings' rows in the list, top first (the list also holds the ring line, which is not one of them). */
  ring_rows() { return this.ring_list ? [...this.ring_list.children].filter((li) => li.classList.contains("ring")) : []; },

  /** show or hide ring i on the dial without selecting it (the eye's job; a click on the row selects). */
  show_ring(i, on) {
    const ring = this.S.rings[i];
    if (!ring || ring.on === on) return;
    ring.on = on;
    this.static_dirty = true;
    this.steady(() => { this.fill_ring_list(); this.sync_rows(); });
    this.render();
  },

  /** the ring line stands in the list, right under the selected ring's row (Okay's design, 13 Oct 2026). */
  place_ring_line() {
    const row = this.ring_rows()[this.S.ui_ring], holder = this.ring_line_holder;
    if (row && holder && (holder.previousElementSibling !== row || !holder.isConnected)) row.after(holder);
  },

  /** the name becomes a field: Enter or a click elsewhere keeps it, Esc puts the old name back. */
  rename_ring(i, item, name) {                     // name: what the field stands in for (the name's cell)
    const ring = this.S.rings[i], before = ring.name;
    const field = el("input", { type: "text", value: ring.name, className: "name", ariaLabel: "Ring name" });
    let done = false;
    const end = (keep) => {
      if (done) return;
      done = true;
      ring.name = keep ? field.value.trim() || before : before;
      this.fill_ring_list(); this.sync_rows(); this.autosave();
    };
    field.oninput = () => { ring.name = field.value; this.sync_rows(); };
    field.onblur = () => end(true);
    field.onkeydown = (e) => { if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); };
    name.replaceWith(field);
    item.classList.add("renaming");
    field.focus(); field.select();
  },

  /** drag a ring by its grip to another place in the list. The list's order is the stacking order:
   *  the top row is drawn last, in front. A line shows where the ring will land. */
  drag_ring(e, from) {
    e.preventDefault();
    const list = this.ring_list, rows = this.ring_rows(), grip = e.currentTarget;
    const line = el("div", { className: "dropline" });
    list.append(line);
    rows[from].classList.add("dragged");
    grip.setPointerCapture(e.pointerId);
    let to = from;
    const move = (ev) => {                         // the gap nearest the pointer: 0 = above the first row
      const box = list.getBoundingClientRect(), y = ev.clientY - box.top + list.scrollTop;
      let gap = rows.findIndex((row) => y < row.offsetTop + row.offsetHeight / 2);      // the list is the rows' frame of reference
      if (gap < 0) gap = rows.length;
      to = gap > from ? gap - 1 : gap;               // where the ring ends up once it is taken out
      const at = gap < rows.length ? rows[gap].offsetTop : rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight;
      line.style.top = `${Math.max(at - 1, 0)}px`;
      line.hidden = to === from;
    };
    const drop = () => {
      grip.onpointermove = grip.onpointerup = grip.onpointercancel = null;
      line.remove();
      rows[from].classList.remove("dragged");
      if (to === from) return this.select_ring(from);
      const rings = this.S.rings, [ring] = rings.splice(from, 1);
      rings.splice(to, 0, ring);
      this.S.ui_ring = to;
      this.static_dirty = true;
      this.steady(() => { this.fill_ring_list(); this.sync_rows(); });
      this.render();
    };
    grip.onpointermove = move;
    grip.onpointerup = drop;
    grip.onpointercancel = () => { to = from; drop(); };
    move(e);
  },

  select_ring(i, refill = true) {
    if (this.unselected) { this.unselected = false; this.render(); }      // a ring chosen in the list is selected again
    if (i === this.S.ui_ring && !refill) return;
    this.value_pop_close();                        // it was about the ring that was selected
    this.S.ui_ring = clamp(i, 0, this.S.rings.length - 1);
    this.steady(() => {
      if (refill) this.fill_ring_list();
      else { this.ring_rows().forEach((li, k) => li.classList.toggle("on", k === this.S.ui_ring)); this.place_ring_line(); }
      this.sync_rows();
    });
    this.fit_ring();                               // the row and its drawer whole in view (#256)
    if (this.anchor_rebase) this.anchor_rebase();  // …and the finger's anchor holds that place, not the old one
    this.render();
  },

  ring_tool(action, kind) {
    const rings = this.S.rings, i = this.S.ui_ring;
    if (action === "add") {
      rings.splice(i, 0, G.new_ring(kind, this.S, kind === "numerals" || kind === "text" ? rings.find((r) => G.kind_of(r) === "numerals") : null));      // a new ring of words takes the top numerals ring's type
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
  },

  /** one click for round ends: both corner radii to half the mark's width or more. */
  row_round_ends(wrap) {
    wrap.className = "row";
    const both = (radius) => () => {
      const R = this.ring();
      R.round_out = R.round_in = radius(R);
      this.static_dirty = true; this.sync_rows(); this.render();
    };
    wrap.append(el("span"), el("span", { className: "tools" },
      el("button", { type: "button", className: "btn", textContent: "Round both ends", onclick: both((R) => Math.max(+(R.w / 2).toFixed(2), 0.01)) }),
      el("button", { type: "button", className: "btn", textContent: "Square", onclick: both(() => 0) })));
  },

  /** a correction for one numeral: radius ±, angle ±, rotate, size ×. Click a numeral in the preview to pick it. */
  /** a window's width and height on one line (Okay's notes, p. 20, #265, beta 4.45.2; R15 form B): four cells — a
   *  name and its quiet number with a compact ±, twice. A press on a name or a number opens its popup, the slider
   *  there. The two are a side row's parts, each still its own row (build_row), so they do all a number does. */
  /** the Show box (#261, 4.46; Okay's notes, p. 2: "Show this window moves with the tab and says just Show: a thin box,
   *  darker than the pane's grey, grows down from the tab and holds it"; one word for windows and hands alike): the
   *  tick that shows the chosen hand or window, on top of the grey page under the tabs. */
  row_show_box(wrap, out, row) {
    // under the chosen tab alone, as wide as it, and it travels with it (4.46.2; Okay on 4.46.1: "the top tab attaches
    // traveling show ticker"; what #261 said: "grows down from the tab"): the box stands in the same columns as the
    // tabs, in the chosen one's (--tabs, --tab)
    const id = `${row.scope}-on-Show`, box = el("input", { type: "checkbox", id });
    box.onchange = () => this.set_value(row.scope, "on", box.checked);
    wrap.className = "showbox";
    const line = el("span", { className: "showline" }, el("label", { className: "check", htmlFor: id, title: row.scope === "hand" ? "Show this hand" : "Show this window" }, box, " Show"));
    // a hand's Bevel beside Show, once it is shown (Okay, 19 Oct 2026, 23:53: "Bevel on off moves next to show under the
    // tab just above. appears after show is switched on"), off to start; Shadows → Bevels % is its strength
    const bevel = row.scope === "hand" ? el("input", { type: "checkbox", id: "hand-bevel" }) : null;
    const bevel_word = bevel ? el("label", { className: "check", htmlFor: "hand-bevel", title: "This hand's bevel, the light and dark halves the shadows' light gives it" }, bevel, " Bevel") : null;
    if (bevel) { bevel.onchange = () => this.set_value("hand", "bevel", bevel.checked); line.append(bevel_word); }
    wrap.append(line);
    out.refresh = (T) => {
      box.checked = Boolean(T.on);
      if (bevel) { bevel.checked = Boolean(T.bevel); bevel_word.hidden = !(T.on && G.HAND_SHAPES[T.shape] !== "disc"); }      // with Show, Shadows on or off (#531)      // with Show, at once (20 Oct 2026, 01:33: "bevel appears as soon as show tick turned on"); a disc hand is flat; no shadows, no bevels
      const tabs = [...document.querySelectorAll(row.scope === "hand" ? ".tabsbar .segs > .tab" : ".windowcards .card > .tab")];
      wrap.style.setProperty("--tabs", Math.max(tabs.length, 1));
      wrap.style.setProperty("--tab", Math.max(tabs.findIndex((t) => t.classList.contains("on")), 0) + 1);
      // …and then onto the chosen tab's own edges, measured: the tabs overlap a hair each (one line between two), which
      // engines place differently, so columns alone left it off its tab in Safari (Okay, 23 Oct 2026: "moves left on safari")
      const place = () => {
        const on = tabs.find((t) => t.classList.contains("on")), a = on && on.getBoundingClientRect(), w = wrap.getBoundingClientRect();
        if (!a || !a.width || !wrap.isConnected) return;      // not laid out yet: the next frame does it
        Object.assign(line.style, { gridColumn: "1 / -1", justifySelf: "start", marginLeft: `${a.left - w.left}px`, width: `${a.width}px` });
      };
      place(); requestAnimationFrame(place);
    };
  },

  row_nudge(wrap, out) {                           // which numeral the rows under it nudge (scope "nudge", #252), and a way to undo its nudges
    wrap.className = "nudge";
    const pick = el("select", { id: "nudge-pick" });
    pick.onchange = () => { this.nudge_at = pick.value; this.unselected = false; this.sync_rows(); this.render(); };
    const word = el("label", { htmlFor: "nudge-pick", textContent: "Numeral" }), reset = el("button", { type: "button", className: "btn", id: "nudge-reset", textContent: "Reset this numeral" });
    const pick_box = chevron_box(pick);
    // its own font, and with it its own colour (#513; Okay, 24 Oct 2026: "Nudge one numeral is named 'edit one numeral' and
    // gets font (with it color) change"): the font sheet chooses for this numeral alone; the colour is the ring's
    // colour for this position (cs, as a band's sectors have), drawn as a shape of its own
    const font = el("button", { type: "button", className: "btn", id: "nudge-font", onclick: () => { this.font_scope = "numeral"; this.open_picker(); } });
    const same = el("button", { type: "button", className: "btn quiet", id: "nudge-font-ring", textContent: "As the ring", onclick: () => {
      const all = { ...this.ring().nudge }, n = { ...(all[this.nudge_at] || {}) }; delete n.family; delete n.ps; delete n.axes;
      if (Object.keys(n).length) all[this.nudge_at] = n; else delete all[this.nudge_at];
      this.set_value("ring", "nudge", all);
    } });
    const colour = this.colour_pill("nudge-c", "This numeral's colour");
    const colour_of = () => ({ alpha: true, read: () => G.sector_colour(this.ring(), +this.nudge_at), label: () => `${this.ring().name || "Numerals"} · ${pick.selectedOptions[0]?.textContent.trim() || ""}`,
      write: (v) => this.set_value("ring", "cs", { ...(this.ring().cs || {}), [this.nudge_at]: v }) });
    colour.onclick = () => this.pop_open(colour_of(), colour);
    const font_row = el("div", { className: "row" }, el("label", { htmlFor: "nudge-font", textContent: "Font" }), el("span", { className: "btnline" }, font, same));
    const colour_row = el("div", { className: "row col" }, el("label", { htmlFor: "nudge-c", textContent: "Colour" }), colour);
    wrap.append(el("div", { className: "row pop" }, word, pick_box.box), font_row, colour_row,
      el("div", { className: "row" }, el("span"), Object.assign(reset, { onclick: () => {
        const all = { ...this.ring().nudge }, cs = { ...(this.ring().cs || {}) };
        delete all[this.nudge_at]; delete cs[this.nudge_at];      // its nudges, its font and its colour
        this.set_value("ring", "nudge", all); this.set_value("ring", "cs", cs);
      } })));
    out.refresh = (R) => {
      const text = G.has_text(R);
      word.textContent = text ? "Numeral" : "Mark"; reset.textContent = text ? "Reset this numeral" : "Reset this mark";
      // only what is drawn is listed (Okay, 24 Oct 2026: "If there is a skip in the numerals, humans see emptiness on the
      // skipped stops … write out only what is seen"): the positions the ring keeps, not every stop; a numeral by its own
      // word, a mark by the time it stands at (1:00, 1:12 …), with no running number before it ("horrible number confusion")
      const at = (a) => { const m = Math.round((((a % 360) + 360) % 360) * 2), h = Math.floor(m / 60) % 12 || 12; return `${h}:${String(m % 60).padStart(2, "0")}`; };
      const labels = text ? G.ring_labels(R) : G.ring_angles(R).map(at);
      const built = this.statik && this.statik.rings.find((x) => x.ring === R);
      const drawn = built ? built.at.filter((i) => i < labels.length) : labels.map((_, i) => i);
      if (drawn.length && !drawn.includes(+this.nudge_at)) this.nudge_at = String(drawn[0]);
      const name = (i) => `${labels[i] || "—"}${R.nudge[String(i)] ? "  •" : ""}`;
      const want = drawn.map((i) => `${i}:${name(i)}`).join("|");
      if (pick.dataset.items !== want) {
        pick.replaceChildren(...drawn.map((i) => el("option", { value: String(i), textContent: name(i) })));
        pick.dataset.items = want;
      }
      pick.value = this.nudge_at;
      pick_box.sync();
      const n = R.nudge[String(this.nudge_at)] || {};
      font_row.hidden = colour_row.hidden = !text;      // a mark's own colour and shape come with #349
      font.textContent = n.family || R.family || "Font"; font.title = n.ps ? "This numeral's own font" : "As the ring: press to choose one for this numeral alone";
      same.hidden = !n.ps;
      colour.show(G.sector_colour(R, +this.nudge_at));
    };
    this.nudge_sync = () => { const R = this.ring(); if (R && !wrap.hidden) out.refresh(R); };      // the list follows a change of what is drawn, once the dial is rebuilt
  },

  /** the chosen hand in detail: a box of its own, at the left of the hand's rows (on a phone: over them, the hand lying). */
  /** the ring's positions, drawn (Okay's notes, p. 5, #251, 4.50.1: "a ring-specific preview at the left, like the
   *  hands' detail box: round, not in a square box, with even padding"): a faint circle; a mark at every position, the
   *  used ones in ink, the ones skipped (Every, Offset, Skip those) faint; the first position marked with a dot, so
   *  Start is seen. Also (notes 2, #357: "start point" · "Span ruler: make it dotted instead of ruler" · "these
   *  are controls, click/tap dragable") also the span, a dotted arc inside, from the start round to its end, which a
   *  small ring marks. A press in the outer band (the marks and the dot) drags the start round the dial; a press
   *  inside it drags the span's end. Whole degrees; the rows beside it say the numbers. */
  row_ring_positions(wrap, out) {
    wrap.className = "detail round";
    wrap.id = "ring-positions";
    wrap.setAttribute("role", "img");
    const DOT = 0.68, ARC = 0.52;                 // the start's dot and the span's arc, as parts of the radius
    let drawn = "";
    out.refresh = (R) => {
      const angles = G.ring_angles(R), used = new Set(G.positions_of(R)), f = (v) => v.toFixed(4);
      const at = (a, r) => [f(r * Math.sin(a * Math.PI / 180)), f(-r * Math.cos(a * Math.PI / 180))];
      const marks = angles.map((a, i) => { const [x0, y0] = at(a, 0.84), [x1, y1] = at(a, 1); return `<path class="${used.has(i) ? "used" : "skipped"}" d="M${x0} ${y0}L${x1} ${y1}"/>`; }).join("");
      const a0 = +R.start || 0, span = Math.min(Math.max(+R.span || 360, 1), 360), [fx, fy] = at(angles[0] ?? a0, DOT);
      const [sx, sy] = at(a0, ARC), [ex, ey] = at(a0 + span, ARC);
      const arc = span >= 360 ? `<circle class="span" r="${ARC}"/>` : `<path class="span" d="M${sx} ${sy}A${ARC} ${ARC} 0 ${span > 180 ? 1 : 0} 1 ${ex} ${ey}"/>`;
      const now = `<svg viewBox="-1 -1 2 2" aria-hidden="true"><circle class="axis" r="1"/>${marks}${arc}<circle class="spanend" cx="${ex}" cy="${ey}" r="0.06"/><circle class="first" cx="${fx}" cy="${fy}" r="0.07"/></svg>`;
      if (now !== drawn) { drawn = now; wrap.innerHTML = now; }
      wrap.ariaLabel = `${used.size} of ${angles.length} positions used, the first at ${(angles[0] || 0).toFixed(1)}°`;
    };
    // the drag: the pointer's place as a clock angle and a part of the radius
    const polar = (e) => { const b = (wrap.querySelector("svg") || wrap).getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 2 - 1, y = (e.clientY - b.top) / b.height * 2 - 1; return [Math.atan2(x, -y) * 180 / Math.PI, Math.hypot(x, y)]; };      // the circle's own square (#417)
    let grab = null;
    wrap.onpointerdown = (e) => {
      const [, rho] = polar(e);
      grab = { what: rho > (DOT + ARC) / 2 ? "start" : "span", span: null };      // span: where the drag has it (null: the press itself, taken as it is)
      wrap.setPointerCapture(e.pointerId);
      wrap.classList.add("dragging");
      wrap.onpointermove(e);
    };
    wrap.onpointermove = (e) => {
      if (!grab) return;
      const [a] = polar(e), R = this.ring();
      this.guides_live();
      if (grab.what === "start") { this.set_value("ring", "start", Math.round(((a + 540) % 360) - 180)); return; }
      let d = (((a - (+R.start || 0)) % 360) + 360) % 360;
      if (grab.span === null) { /* the press: where it is */ } else if (grab.span - d > 180) d = 360;           // past the start going on: it stays whole
      else if (d - grab.span > 180) d = 1;        // back past the start: the least there is
      grab.span = Math.min(Math.max(Math.round(d), 1), 360);
      this.set_value("ring", "span", grab.span);
    };
    wrap.onpointerup = wrap.onpointercancel = () => { grab = null; wrap.classList.remove("dragging"); };
  },
};
