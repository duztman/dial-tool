// guides.js — the Guides list (its kinds, colours, the guides you add) and the Shadows pane (the sun, the parts
// exploded, each part's height), and the shadows drawn on the preview.

import * as G from "./geometry.js";

import { LINE, SIGNS, SLANT, TOOL_ICONS, icon, none_dot, sw } from "./icons.js";
import { $, token, GUIDE_STEP, clamp, el, parse_number, svg_el } from "./ui.js";
import { chevron_box, chk, num } from "./rows.js";

export const GUIDES = {
  /** guides, at the preview's top right (Okay, 19 Oct 2026): a switch (a bullseye and the word; solid outline = on,
   *  dashed = off) and, joined to it, an arrow that drops their list: the five kinds of guide, each with an eye and
   *  one of eight colours; one thickness; Reset. No free colours here. */
  guides_box() {
    this.guides_tick = el("button", { type: "button", className: "onview guidesbox", id: "guides", onclick: () => this.set_value("global", "guides", !this.S.guides) });
    this.guides_tick.innerHTML = icon(TOOL_ICONS.guides, 18);
    const word = el("span", { className: "word", textContent: "Guides" });
    word.dataset.text = "Guides";
    this.guides_tick.append(word);
    const list = el("div", { className: "guidelist night", id: "guide-list", hidden: true });
    const more = el("button", { type: "button", className: "onview guidesmore", id: "guides-more", title: "Which guides, and their colours", ariaLabel: "Which guides, and their colours" });
    more.innerHTML = icon(SIGNS.down);
    more.setAttribute("aria-expanded", "false");
    const open = (on) => {
      list.hidden = !on; more.setAttribute("aria-expanded", String(on));
      this.render();      // the added guides' handles come and go with the list (#527)
      if (!on) return;
      this.sync_guides();
      // its room: from its switch down to the preview's bottom edge, measured now (a long list ran past the top of an
      // iPad's screen)
      const m = this.main.getBoundingClientRect(), g = this.guides_tick.getBoundingClientRect();
      list.style.setProperty("--list-room", `${Math.max(m.bottom - g.bottom - 2 * parseFloat(getComputedStyle(list).getPropertyValue("--list-gap") || 0), 120)}px`);
      requestAnimationFrame(() => this.guides_more_below && this.guides_more_below());
    };
    more.onclick = () => open(list.hidden);
    this.guides_open = open;
    // the list (#539; Okay, 25 Oct 2026, from his marks on the drawing): one column, 240 wide — Dial (the centre hole,
    // the centre lines); Rings with its menu on its heading and a line per ring; Windows with its menu and a line per
    // window; Added with a minus that takes the last added away, and a line per added guide. Under it, on the foot's
    // ground, always in view: Add · Line · Crosshair · Circle; Thickness 1 · 2 · 3 · Reset All.
    // A guide is one line: its name, its colour as a dot (a press opens None and the eight colours by it), and a tick
    // that shows or hides it, keeping its colour for when it comes back.
    const pop = el("div", { className: "guidepop dots", id: "guide-pop", role: "radiogroup", hidden: true });
    const none = el("button", { type: "button", className: "none", id: "guide-pop-none", title: "None: hide it", ariaLabel: "None" });
    none.innerHTML = none_dot;
    none.dataset.k = "none";
    // None and seven colours, two lines of four: black is left out, near invisible on the dark ground (Okay, 24 Oct
    // 2026: "Drop the black"); it stays in GUIDE_COLOURS (R9), so a guide already black stays black
    pop.append(none, ...G.GUIDE_COLOURS.map((hex, i) => [hex, i]).filter(([hex]) => hex !== "#111111").map(([hex, i]) => { const b = el("button", { type: "button", className: "tone", title: hex, ariaLabel: hex }); b.style.setProperty("--c", hex); b.dataset.k = i; return b; }));
    for (const b of pop.children) b.setAttribute("role", "radio");
    let pop_for = null;
    const pop_shut = () => { if (pop_for) pop_for.chev.setAttribute("aria-expanded", "false"); pop.hidden = true; pop_for = null; };
    this.guide_pop_shut = pop_shut;
    pop.onclick = (e) => {
      const b = e.target.closest("[data-k]");
      if (!b || !pop_for) return;
      pop_for.choose(b.dataset.k === "none" ? null : +b.dataset.k);
      pop_shut();
    };
    // a guide's line (Okay's drawing, 24 Oct 2026: "All the ticks chevrons, they open up small rounded corner boxes"):
    // its name, its colour as a dot, and a chevron that opens None and the colours in a small box under the line. A
    // hidden guide (None) shows its dot as an empty ring and its name grey.
    const guide_line = (name, get, set, id = "") => {
      const label = el("span", { className: "name", textContent: name, title: name });
      const dot = el("button", { type: "button", className: "gdot", id: id ? id + "-colour" : "", tabIndex: -1, ariaHidden: "true" });
      const chev = el("button", { type: "button", className: "gchev", id, title: "Its colour, or none", ariaLabel: name + ": its colour" });
      chev.innerHTML = icon(SIGNS.down);
      chev.setAttribute("aria-expanded", "false");
      const line = el("div", { className: "guidekind" }, label, dot, chev);
      const d = { line, label, dot, chev,
        choose: (k) => { set(k); this.sync_rows(); this.render(); },
        refresh: () => {
          const k = get();
          dot.style.setProperty("--c", k === null ? "transparent" : G.GUIDE_COLOURS[k] || G.GUIDE_COLOURS[0]);
          line.classList.toggle("off", k === null);
          if (pop_for === d) for (const b of pop.children) { const on = b.dataset.k === "none" ? k === null : +b.dataset.k === k; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); }
        } };
      const open = () => {
        if (pop_for === d) return pop_shut();
        if (pop_for) pop_shut();
        pop_for = d;
        chev.setAttribute("aria-expanded", "true");
        pop.hidden = false;
        d.refresh();
        const scroll = list.querySelector(".guidescroll"), l = scroll.getBoundingClientRect(), r = line.getBoundingClientRect();      // under its line, its right edge on the chevron's, kept inside the list
        pop.style.top = `${r.bottom - l.top + scroll.scrollTop}px`;
        pop.style.left = `${Math.max(0, chev.getBoundingClientRect().right - l.left - pop.offsetWidth)}px`;
      };
      chev.onclick = open;
      dot.onclick = open;
      return d;
    };
    this.guide_dots = guide_line;
    // the dial's own: the centre hole (first, Okay, 16 Oct 2026, #267) and the centre lines
    this.guide_kinds = [G.GUIDE_KINDS[5], G.GUIDE_KINDS[1]].map(([show, colour, name]) =>
      guide_line(name, () => (this.S[show] ? this.S[colour] : null), (k) => { if (k === null) this.S[show] = false; else { this.S[show] = true; this.S[colour] = k; } }, "guide-" + show));
    // which rings and which windows show their guides: a chevron box on the heading (R15: every menu is one; Okay, 25 Oct
    // 2026: "Selected/all etc can be a dropdown to gain width"), Selected · All · None, opening the tool's own list
    const which_menu = (id, title, get, set) => {
      const select = el("select", { id, title, ariaLabel: title });
      ["Selected", "All", "None"].forEach((word, i) => select.append(el("option", { value: String(i), textContent: word })));
      select.onchange = () => { set(+select.value); this.sync_rows(); this.render(); };
      const { box, sync } = chevron_box(select);
      box.classList.add("gmenu");
      return { box, refresh: () => { select.value = String(get()); sync(); } };
    };
    const which_of = (all, sel) => (all ? 1 : sel ? 0 : 2), which_to = (n) => [n === 1, n !== 2];      // Selected 0 · All 1 · None 2 → [all, selected]
    this.guide_which = which_menu("guide-rings", "Which rings show their guides", () => which_of(this.S.gd_rings, this.S.gd_sel), (n) => { [this.S.gd_rings, this.S.gd_sel] = which_to(n); });
    this.guide_which_w = which_menu("guide-windows", "Which windows show their guides", () => which_of(this.S.gd_wins, this.S.gd_wsel), (n) => { [this.S.gd_wins, this.S.gd_wsel] = which_to(n); });
    this.guide_rings = el("div", { className: "guiderings" });
    this.guide_windows = el("div", { className: "guiderings" });
    this.guide_more = el("div", { className: "guiderings guidemore" });
    const head = (word, ...rest) => el("div", { className: "guidehead" }, el("span", { className: "name", textContent: word }), ...rest);
    this.guide_windows_head = head("Windows", this.guide_which_w.box);
    this.guide_windows_head.classList.add("gap");      // a group after a group: a unit of air over its heading
    const last_gone = el("button", { type: "button", className: "minus", id: "guide-more-last", title: "Take the last added guide away", ariaLabel: "Take the last added guide away", onclick: () => { this.S.gd_more = (this.S.gd_more || []).slice(0, -1); this.sync_rows(); this.render(); } });
    last_gone.innerHTML = icon(`<path d="M3 6H9" ${sw(LINE)}/>`, 12);
    this.guide_more_head = head("Added", last_gone);
    // one column, four groups, each a bold heading over its lines inset a unit (#539; Okay, 25 Oct 2026: "One column layout
    // now and always"; "might have inset tiered layer system"): Dial · Rings · Windows · Added
    const rings_head = head("Rings", this.guide_which.box);
    rings_head.classList.add("gap");
    this.guide_more_head.classList.add("gap");
    this.guide_added = el("div", { className: "guideadded" }, this.guide_more_head, this.guide_more);
    const scroll = el("div", { className: "guidescroll" }, head("Dial"), el("div", { className: "guiderings" }, ...this.guide_kinds.map((d) => d.line)), rings_head, this.guide_rings, this.guide_windows_head, this.guide_windows, this.guide_added, pop);
    // guides you add: a line, a crosshair, a circle (Okay: "add an option to add others, crosshair, straight line etc."),
    // as free pills (canon §6)
    const adds = el("span", { className: "pillswitch free" });
    G.GUIDE_MORE.forEach((kind, i) => adds.append(el("button", { type: "button", id: "guide-add-" + kind, textContent: kind[0].toUpperCase() + kind.slice(1), onclick: () => {
      const used = new Set((this.S.gd_more || []).map((g) => g.k));
      this.S.gd_more = [...(this.S.gd_more || []), { kind: i, a: 0, r: +(this.S.dial_d / 4).toFixed(2), k: [3, 0, 2, 5, 4, 1].find((k) => !used.has(k)) ?? 3 }];
      this.sync_rows(); this.render();
    } })));
    const settings = el("div", { className: "guidesettings" }, head("Add", adds));
    list.append(scroll, settings);
    list.classList.add("guidesheet");
    list.addEventListener("pointerdown", (e) => { if (!pop.hidden && !e.target.closest("#guide-pop, .gdot, .gchev")) pop_shut(); });
    // more under the fold: its last line fades into the settings, so a finger knows it scrolls (a phone's and an iPad's
    // scrollbar only shows while it moves)
    this.guides_more_below = () => scroll.classList.toggle("more", scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 2);
    scroll.addEventListener("scroll", () => { pop_shut(); this.menu_list_close(); this.guides_more_below(); }, { passive: true });
    // the last line: Thickness 1 · 2 · 3 — steps of the thinnest, 0.75 (Okay, 24 Oct 2026: "Steps of today's") — a pill
    // switch (canon §6), then Reset All as a quiet word (#271: "Written as 'Reset All'")
    const thick = el("span", { className: "pillswitch gthick", role: "radiogroup", ariaLabel: "Thickness" });
    [1, 2, 3].forEach((n) => { const b = el("button", { type: "button", id: "guide-w-" + n, textContent: String(n), role: "radio", onclick: () => { this.S.gd_w = GUIDE_STEP * n; this.sync_rows(); this.render(); } }); thick.append(b); });
    this.guide_thick = thick;
    // Reset All asks first, in its line's place: "Reset all guides?" and round ✕ and ✓ (#271; answer: it resets the
    // guides only, and says so)
    const ask = (on) => { last.classList.toggle("asking", on); question.hidden = !on; if (on) yes.focus(); };
    const reset = el("button", { type: "button", className: "gword", id: "guides-reset", textContent: "Reset All", title: "Every guide as it started", onclick: () => ask(true) });
    const round = (id, text, title, act) => { const b = el("button", { type: "button", className: "roundb", id, title, ariaLabel: title, onclick: act }); b.innerHTML = icon(text, 12); return b; };
    const no = round("guides-reset-no", `<path d="M3 3L9 9M9 3L3 9" ${sw(SLANT)}/>`, "Keep the guides", () => { ask(false); reset.focus(); });
    const yes = round("guides-reset-yes", `<path d="M2.5 6.25L5 8.75L9.5 3.5" ${sw(SLANT)}/>`, "Reset all guides", () => {
      for (const key of Object.keys(G.DEFAULTS)) if (key.startsWith("gd_")) this.S[key] = structuredClone(G.DEFAULTS[key]);
      for (const ring of this.S.rings) ring.guide = G.RING_BASE.guide;       // the rings' own colours too: by their place again
      for (const w of G.windows_of(this.S)) w.guide = G.WINDOW_BASE.guide;      // and the windows'
      ask(false);
      this.sync_rows();
      this.render();
      reset.focus();
    });
    const question = el("span", { className: "ask", hidden: true }, el("span", { textContent: "Reset all guides?" }), el("span", { className: "answers" }, no, yes));
    question.onkeydown = (e) => { if (e.key === "Escape") { e.stopPropagation(); ask(false); reset.focus(); } };
    const last = el("div", { className: "guidelast" }, el("label", { textContent: "Thickness" }), el("span", { className: "numcell" }, thick), el("span", { className: "resetall" }, reset), question);
    settings.append(last);
    const box = el("div", { className: "guides" }, this.guides_tick, more, list);
    box.onkeydown = (e) => { if (e.key === "Escape" && !list.hidden) { open(false); more.focus(); } };
    return box;
  },

  /** shadows, at the preview's bottom left, over the Backdrop switch (a trial; Okay, 14 Oct 2026): a switch and,
   *  joined to it, an arrow that opens their settings upward — made like the Guides switch. Preview only (R5). */
  shadows_box() {
    this.shadows_tick = el("button", { type: "button", className: "onview guidesbox shadowsbox", id: "shadows", onclick: () => this.set_value("global", "sh_on", !this.S.sh_on) });
    this.shadows_tick.innerHTML = icon(TOOL_ICONS.shadows, 18);      // its sign, before its word, as Guides has
    const word = el("span", { className: "word", textContent: "Shadows" });
    word.dataset.text = "Shadows";
    this.shadows_tick.append(word);
    const list = el("div", { className: "guidelist shadelist night", id: "shadow-list", hidden: true });
    const more = el("button", { type: "button", className: "onview guidesmore", id: "shadows-more", title: "The light, and how high each part stands", ariaLabel: "The light, and how high each part stands" });
    more.innerHTML = icon(SIGNS.down);
    more.setAttribute("aria-expanded", "false");
    const open = (on) => {
      list.hidden = !on; more.setAttribute("aria-expanded", String(on));
      if (!on) return;
      // where it stands: from the panel's margin to the switch's right edge, standing on the switch (Okay, 25 Oct 2026,
      // 02:09: "similar to fonts left margin and organically one side full touching connection kept with button. Above button")
      const b = box.getBoundingClientRect(), tab = $('.tabs button[data-tab="Rings"]')?.getBoundingClientRect();
      list.style.setProperty("--shade-right", `${Math.round(b.right)}px`);
      if (tab) list.style.setProperty("--shade-left", `${Math.round(tab.left)}px`);      // its left edge on the Rings tab's (Okay, 02:20: "aligned with rings tab above")
      list.style.setProperty("--shade-bottom", `${Math.round(innerHeight - b.top)}px`);
      this.sync_shadows();
    };
    more.onclick = () => open(list.hidden);
    this.shadows_open = open;
    const row = (r) => this.build_row({ ...r, scope: "global" });
    // the pane (#526; Okay's drawing, 24 Oct 2026, and his answers of 25 Oct): the sun's picture on top, dragged (round =
    // the angle, toward the middle = higher); under it Angle · Height · Strength as three named sliders (R15, form D);
    // then the parts, exploded, top to bottom as they stand — Cap · Seconds · Minutes · Hours · every ring (its ink
    // height, the same number as show mode's Colours) · Dial, the reference · Date discs under the plate — each with a
    // small side-view drawing, white while it is being sized; the foot: Soft edge · Bevels % · Reset
    const sun = this.sun_picture("shadows");
    // the top: the sun's picture at the left; Angle · Height · Strength stacked at its right, each name over its slider,
    // the value riding in the knob (R15, form D; Okay, 25 Oct 2026, 01:34: "numbers on the buttons since we have nowhere
    // else to write"). The parts: the rows at the left, as the Hands tab's side rows; the exploded view at the right
    // (01:46: "the whole diagram box moves rightmost of the columns")
    const light = [row(num("sh_from", "Angle", 0, 359, 1, { whole: true, named: true, suffix: "°" })), row(num("sh_rise", "Height", 5, 85, 1, { whole: true, named: true })),
      row(num("sh_dark", "Strength", 0, 100, 1, { whole: true, named: true, suffix: " %" }))];
    const top = el("div", { className: "suntop" }, sun.el, el("div", { className: "three" }, ...light.map((r) => r.el)));
    const part = (key, text, lo, hi, step, name, o = {}) => row(num(key, text, lo, hi, step, { side: true, part: name, ...o }));
    const heights = [part("sh_cap", "Cap", 0, 4, 0.05, "cap"), part("sh_second", "Seconds", 0, 3, 0.05, "second"), part("sh_minute", "Minutes", 0, 3, 0.05, "minute"), part("sh_hour", "Hours", 0, 3, 0.05, "hour")];
    this.shadow_rings = el("div", { className: "shadowrings" });      // the rings, a line each: their ink stands in steps 0–10, the same number as show mode's Colours (#521)
    const plate = el("div", { className: "row side ref" }, el("label", { textContent: "Plate" }));      // the reference: everything stands over or under it
    const under = [part("sh_disc", "Date discs", 0, 2, 0.05, "disc")];
    const soft = row(chk("sh_blur", "Soft edge")), bevel = row(num("sh_bevel", "Bevels %", 0, 100, 1, { whole: true, block: true }));      // the hands' bevels' strength; each hand's own Bevel tick turns its bevel on
    this.shadow_rows = [...light, ...heights, ...under, soft, bevel];
    this.shadow_ring_rows = [];
    const reset = el("button", { type: "button", className: "gword", id: "shadows-reset", textContent: "Reset", title: "The shadows as they started", onclick: () => {
      for (const key of Object.keys(G.DEFAULTS)) if (key.startsWith("sh_") && key !== "sh_on") this.S[key] = structuredClone(G.DEFAULTS[key]);
      this.sync_rows();
      this.render();
    } });
    const rows = el("div", { className: "shaderows" }, ...heights.map((r) => r.el), this.shadow_rings, plate, ...under.map((r) => r.el));
    this.shadow_stack = this.stack_picture();
    const parts = el("div", { className: "shadeparts" }, rows, this.shadow_stack.el);
    // a row pointed at, focused or with its controller open lights its part in the picture
    const lit = (e) => { const r = e.target.closest(".row"); this.shade_light(r && r.dataset.part && (e.type === "pointerover" || e.type === "focusin") ? r.dataset.part : null); };
    for (const kind of ["pointerover", "pointerout", "focusin", "focusout"]) rows.addEventListener(kind, lit);
    const scroll = el("div", { className: "shadescroll" }, top, el("div", { className: "shadedivide" }), parts);
    list.append(scroll, el("div", { className: "guidefoot shadefoot" }, soft.el, bevel.el, reset));
    this.shadow_sun = sun;
    const box = el("div", { className: "shadows" }, this.shadows_tick, more);
    $("#shadow-list")?.remove();      // the preview is built again on a mode change: one pane only
    document.body.append(list);      // the pane stands over the panel's column, outside the canvas (main clips what it holds), so it lives on the body, as the menus do
    const esc = (e) => { if (e.key === "Escape" && !list.hidden) { open(false); more.focus(); } };
    box.onkeydown = esc; list.onkeydown = esc;
    return box;
  },

  /** shadows on the preview (a trial, preview only: R5). One light, far away. Each part stands at a height: the date
   *  discs under the plate, the plate's face at 0, the hands over it, the cap on top. A part at height z casts its own
   *  outline, shifted by z / tan(the light's height) away from the light, onto every surface lower than it; each
   *  surface keeps only what falls on itself (a clip by its own outline). So a seconds hand's shadow lies further out
   *  on the plate than on the minute hand it crosses, and steps at that hand's edge — and at a window's edge.
   *  The hands and the cap are tied to the centre by their pipes: the pipes' shadow is a band from the centre to the
   *  cap's shadow, as wide as the cap. Nothing is drawn outside the dial: the plate's own shadow falls only into its
   *  windows. Each surface's shadows are one group with one opacity, so where two overlap it is not darker. */
  draw_shadows(items) {
    const S = { ...this.S, sh_blur: this.S.sh_blur && !this.moving() };      // the soft edge waits while something moves (moving())
    if (!this.shade) {
      const defs = svg_el("defs"), filter = svg_el("filter"), blur = svg_el("feGaussianBlur");
      filter.id = "shadow-soft";
      for (const [k, v] of [["x", "-20%"], ["y", "-20%"], ["width", "140%"], ["height", "140%"]]) filter.setAttribute(k, v);
      filter.append(blur);
      defs.append(filter);
      this.svg.prepend(defs);
      this.shade = { defs, blur, parts: new Map() };
    }
    const shade = this.shade, used = new Set();
    // a node, made once and kept by its name; parts not used this frame are removed at the end
    const part = (name, tag, parent) => {
      let n = shade.parts.get(name);
      if (!n) { n = svg_el(tag); shade.parts.set(name, n); }
      if (n.parentNode !== parent) parent.append(n);
      used.add(name);
      return n;
    };
    const set = (n, k, v) => { if (n.getAttribute(k) !== v) n.setAttribute(k, v); };
    const finish = () => { for (const [name, n] of shade.parts) if (!used.has(name)) { n.remove(); shade.parts.delete(name); } };
    if (!S.sh_on || S.out_production) return finish();

    set(shade.blur, "stdDeviation", "0.07");      // mm: a small soft edge, the same for every shadow (0.08 until Okay, 23:05: "sharpen it just a little")
    const a = S.sh_from * Math.PI / 180, per = 1 / Math.tan(clamp(S.sh_rise, 20, 89) * Math.PI / 180);      // never longer than a 20° sun throws them, as the watch's (Okay, 23 Oct 2026)
    const away = (dz) => [-Math.sin(a) * per * dz, -Math.cos(a) * per * dz];      // y grows upward inside the dial (place())
    const f = (v) => v.toFixed(4);
    const height = { hour: S.sh_hour, minute: S.sh_minute, second: S.sh_second };
    const nodes = items.map((_, i) => this.slots[i].node);
    const hands = items.map((item, i) => ({ item, i })).filter((x) => x.item.role === "hand").map((x) => ({ ...x, z: height[x.item.name] ?? 0, d: this.slots[x.i].d }));
    const cap_r = G.cap_shows(S) ? S.ha_cap / 2 : 0;
    const top = Math.max(S.sh_cap, ...hands.map((h) => h.z));
    // what a part's shadow does to the surface under it (Okay, 16 Oct 2026, #295: "shadow of transparent items are
    // extreme. Realistic color shadows maybe?"): the shadow multiplies the surface, channel by channel, by
    // 1 − dark × (1 − T), where T is the light that gets through the part: (1 − α)(1 + α × its colour). An opaque part
    // lets none through, whatever its colour: the shadow it always cast. A see-through one casts less, and in its colour.
    const dark = clamp(S.sh_dark, 0, 100) / 100;
    const tint = (c = [0, 0, 0, 1]) => { const a = clamp(c[3] ?? 1, 0, 1); return `rgb(${[0, 1, 2].map((k) => Math.round(255 * (1 - dark * (1 - (1 - a) * (1 + a * c[k]))))).join(", ")})`; };
    hands.sort((p, q) => (p.item.fill?.[3] ?? 1) - (q.item.fill?.[3] ?? 1));      // see-through first, so a solid part's shadow covers theirs where they cross: never darker twice

    // one surface: its group goes just before `before` (a node, or null for the end), clipped to its own outline
    const surface = (name, before, outline, from_z) => {
      const g = part(name, "g", this.dial), clip = part(name + "/clip", "clipPath", shade.defs);
      clip.id = "shadow-clip-" + name;
      outline.forEach(([d, turn], k) => { const p = part(`${name}/clip/${k}`, "path", clip); set(p, "d", d); set(p, "transform", turn ? `rotate(${f(-turn)})` : ""); });
      set(g, "clip-path", `url(#${clip.id})`);
      g.removeAttribute("opacity"); g.removeAttribute("fill");      // each shadow its own tint (#295), multiplied onto the surface
      set(g, "style", "mix-blend-mode: multiply");
      set(g, "pointer-events", "none");
      if (S.sh_blur) set(g, "filter", "url(#shadow-soft)"); else g.removeAttribute("filter");
      if (g.nextSibling !== before) this.dial.insertBefore(g, before);
      // what falls on it: every hand higher than it, then the pipes' band up to the cap's top
      let k = 0;
      const cast = (d, turn, dz, colour) => {
        const p = part(`${name}/cast/${k++}`, "path", g), [x, y] = away(dz);
        set(p, "d", d);
        set(p, "fill", tint(colour));
        set(p, "transform", `translate(${f(x)} ${f(y)})` + (turn ? ` rotate(${f(-turn)})` : ""));
      };
      for (const h of hands) if (h.z > from_z) cast(h.d, h.item.angle, h.z - from_z, h.item.fill);
      if (cap_r && top > from_z) {
        // the pipes stand from the plate's face (0) to the cap's top: on a surface under the plate their band starts
        // where the face's height lands, not at the centre
        const [x0, y0] = away(Math.max(0, -from_z)), [x, y] = away(top - from_z);
        const len = Math.hypot(x - x0, y - y0) || 1, nx = -(y - y0) / len * cap_r, ny = (x - x0) / len * cap_r;
        const ring = (cx, cy) => `M${f(cx - cap_r)} ${f(cy)}A${f(cap_r)} ${f(cap_r)} 0 1 0 ${f(cx + cap_r)} ${f(cy)}A${f(cap_r)} ${f(cap_r)} 0 1 0 ${f(cx - cap_r)} ${f(cy)}Z`;
        for (const d of [ring(x0, y0), ring(x, y), `M${f(x0 + nx)} ${f(y0 + ny)}L${f(x + nx)} ${f(y + ny)}L${f(x - nx)} ${f(y - ny)}L${f(x0 - nx)} ${f(y0 - ny)}Z`]) {
          const p = part(`${name}/cast/${k++}`, "path", g);
          set(p, "d", d);
          set(p, "fill", tint(S.c_cap));
          set(p, "transform", "");
        }
      }
      return { cast, g };
    };

    // the date discs, under the plate: they catch the plate's own shadow at the window's edge, and the hands'
    const plate_at = items.findIndex((x) => x.role === "plate");
    const discs = items.map((x, i) => ({ x, i })).filter(({ x }) => x.role === "date disc");
    if (discs.length && plate_at >= 0) {
      const s = surface("discs", nodes[plate_at], discs.map(({ i }) => [this.slots[i].d, 0]), -S.sh_disc);
      s.cast(this.slots[plate_at].d, 0, S.sh_disc, S.c_plate);
    }
    // the plate's face, with everything printed on it: drawn after the last thing before the hands
    if (plate_at >= 0 && hands.length) {
      const first = items.findIndex((x) => x.role === "hand" || x.role === "cap" || x.role === "guide");
      surface("plate", first >= 0 ? nodes[first] : null, [[this.slots[plate_at].d, 0]], 0);
    }
    // each hand catches the hands above it
    const after = (i) => { let n = i + 1; while (items[n]?.role === "mark" && items[n].name === items[i].name) n++; return n; };      // past a disc's painted mark, which catches the shadow too (#300)
    for (const h of hands) if (hands.some((o) => o.z > h.z) || (cap_r && top > h.z)) surface("hand-" + h.item.name, nodes[after(h.i)] || null, [[h.d, h.item.angle]], h.z);
    finish();
  },

  /** the guides' switch and list show the settings. */
  sync_guides() {
    const S = this.S;
    this.guides_tick.setAttribute("aria-pressed", String(Boolean(S.guides)));
    this.guides_tick.title = S.guides ? "Guides are on: press to hide them" : "Guides are off: press to show them";
    if ($("#guide-list").hidden) return;
    for (const k of this.guide_kinds) k.refresh();
    this.guide_which.refresh();
    this.guide_which_w.refresh();
    // a line per ring, top first, built again when the list of rings changes
    const rings = JSON.stringify(S.rings.map((r) => r.name));
    if (this.guide_rings.dataset.rings !== rings) {
      this.guide_rings.dataset.rings = rings;
      this.guide_ring_lines = S.rings.map((ring, i) => {
        const d = this.guide_dots(ring.name || G.kind_of(ring), () => G.ring_guide(this.S, i), (k) => { this.S.rings[i].guide = k === null ? -2 : k; }, "guide-ring-" + i);
        d.line.classList.add("ring");
        return d;
      });
      this.guide_rings.replaceChildren(...this.guide_ring_lines.map((d) => d.line));
    }
    this.guide_ring_lines.forEach((d, i) => { d.refresh(); d.line.classList.toggle("selected", i === S.ui_ring); });
    // a line per window that is on (#271)
    const shown = G.windows_of(S).map((w, i) => (w.on ? i : -1)).filter((i) => i >= 0), wins = JSON.stringify(shown.map((i) => [i, G.window_place(G.windows_of(S)[i])]));
    if (this.guide_windows.dataset.wins !== wins) {
      this.guide_windows.dataset.wins = wins;
      this.guide_window_lines = shown.map((i) => {
        const d = this.guide_dots(`Window at ${G.window_place(G.windows_of(this.S)[i])}`, () => G.window_guide(this.S, i), (k) => { G.windows_of(this.S)[i].guide = k === null ? -2 : k; }, "guide-window-" + i);
        d.line.classList.add("ring");
        d.index = i;
        return d;
      });
      this.guide_windows.replaceChildren(...this.guide_window_lines.map((d) => d.line));
    }
    this.guide_windows_head.hidden = this.guide_windows.hidden = !shown.length;      // no window on: nothing to say (R16)
    this.guide_window_lines.forEach((d) => { d.refresh(); d.line.classList.toggle("selected", d.index === S.ui_window); });
    // the guides added by hand, one line each (#305): its name and measures (quiet numbers to type in), its colour, its tick
    const more = JSON.stringify((S.gd_more || []).map((g) => g.kind));
    if (this.guide_more.dataset.more !== more) {
      this.guide_more.dataset.more = more;
      this.guide_more_lines = (S.gd_more || []).map((g, i) => {
        const kind = G.GUIDE_MORE[g.kind], d = this.guide_dots(kind[0].toUpperCase() + kind.slice(1), () => (this.S.gd_more[i].k >= 0 ? this.S.gd_more[i].k : null), (k) => { this.S.gd_more[i].k = k === null ? -2 : k; }, `guide-more-${i}`);
        const field = (key, word, length) => {      // the angle: 45°; the radius: r 8
          const input = el("input", { type: "text", inputMode: "decimal", id: `guide-more-${i}-${key}`, title: key === "a" ? "Angle, degrees" : "Radius", ariaLabel: key === "a" ? "Angle" : "Radius" });
          input.onchange = () => { const now = this.S.gd_more[i][key] * (length ? this.unit()[2] : 1); this.S.gd_more[i][key] = +(parse_number(input.value, now, length ? this.unit()[2] : 0) / (length ? this.unit()[2] : 1)).toFixed(4); this.sync_rows(); this.render(); };
          input.oninput = () => { input.style.width = `${Math.max(1, input.value.length)}ch`; };      // as wide as it is
          const words = key === "a" ? [input, el("span", { textContent: word })] : [el("span", { textContent: word }), input];
          return { key, length, input, el: el("label", { className: "guidefield" }, ...words) };
        };
        const fields = [...(kind !== "circle" ? [field("a", "°", false)] : []), ...(kind !== "line" ? [field("r", "r", true)] : [])];
        d.label.replaceChildren(el("span", { className: "word", textContent: d.label.textContent }), ...fields.map((f) => f.el));
        d.line.classList.add("added");
        return { ...d, fields };
      });
      this.guide_more.replaceChildren(...this.guide_more_lines.map((d) => d.line));
    }
    this.guide_added.hidden = !(S.gd_more || []).length;      // "Added" over the guides added by hand, when there are any (4.79)
    this.guide_more_lines.forEach((d, i) => {
      d.refresh();
      for (const f of d.fields) if (document.activeElement !== f.input) { f.input.value = f.length ? String(parseFloat(this.in_unit(S.gd_more[i][f.key], 2))) : String(+(+S.gd_more[i][f.key]).toFixed(1)); f.input.style.width = `${Math.max(1, f.input.value.length)}ch`; }
    });
    [...this.guide_thick.children].forEach((b, n) => { const on = Math.abs(S.gd_w - GUIDE_STEP * (n + 1)) < 1e-6; b.setAttribute("aria-checked", String(on)); b.classList.toggle("on", on); });      // the chosen one filled: the chosen layer's rule for a pill switch
  },

  /** the shadows' switch and list show the settings. */
  sync_shadows() {
    const on = Boolean(this.S.sh_on);
    this.shadows_tick.setAttribute("aria-pressed", String(on));
    this.shadows_tick.title = on ? "Shadows are on: press to hide them" : "Shadows are off: press to show them";
    if ($("#shadow-list").hidden) return;
    // a line per ring shown, built again when the rings change: its ink height, the same number as show mode's Colours (#521)
    const rings = JSON.stringify(this.S.rings.map((r) => [r.name, r.on]));      // a ring is shown or hidden by `on` (RING_BASE); there is no `show` key (found 25 Oct 2026: hidden rings had a line too)
    if (this.shadow_rings.dataset.rings !== rings) {
      this.shadow_rings.dataset.rings = rings;
      this.shadow_ring_rows = this.S.rings.map((ring, i) => [ring, i]).filter(([ring]) => ring.on).map(([ring, i]) => this.build_row({ ...num("ink", ring.name || G.kind_of(ring), 0, 10, 1, { whole: true, side: true, part: `ring-${i}`, id: `shadow-ring-${i}`,
        get: () => { const R = this.S.rings[i]; return R ? clamp(this.S.w_ink + (R.ink_d || 0), 0, 10) : 0; },
        put: (app, v) => { const R = this.S.rings[i]; if (!R) return; R.ink_d = clamp(v, 0, 10) - this.S.w_ink; this.changed(); } }), scope: "global" }));
      this.shadow_rings.replaceChildren(...this.shadow_ring_rows.map((r) => r.el));
    }
    for (const r of [...this.shadow_rows, ...this.shadow_ring_rows]) r.refresh(this.S);
    this.shadow_sun.refresh();
    this.shadow_stack.refresh();
  },

  /** the parts exploded (#526; Okay, 25 Oct 2026, 01:46: "Exploded perspective's centre point should be regarded by all
   *  components … distances between exploded components vaguely proportional"): one axis, every part centred on it —
   *  the cap a small disc; a hand its pipe on the axis, the hand out to the right, its tail left, the seconds thinnest
   *  and longest; a ring a thin ellipse at its radius; the plate wider, with its hole and a window; the date discs
   *  dashed under it. Each stands at its height: y follows the height, and parts never closer than a gap, so the order
   *  always reads; the stack is centred in the frame by its extent. The part being sized is white. */
  stack_picture() {
    const W = 120, H = 306, AX = W / 2, MM = 70, GAP = 24, STEP = 0.01, ROUND = 0.42;      // ROUND: an ellipse's height to its width      // px per mm; the least between two parts; an ink step as mm (ten steps, a tenth of a millimetre: the inks lie close over the plate, under every hand)
    const box = el("div", { className: "stackpic", id: "shadows-stack" });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><line class="axis"/><g class="parts"></g></svg><span class="word">Components</span>`;
    const parts = box.querySelector(".parts"), axis = box.querySelector(".axis");
    const refresh = () => {
      const S = this.S, hands = ["hour", "minute", "second"].filter((h) => S.ha_on && S["ha_" + h] && S["ha_" + h].on);      // the hands shown: `on` (HAND_BASE), as the dial draws them
      const list = [{ name: "cap", z: Math.max(S.sh_cap, ...hands.map((h) => S["sh_" + h])) + 0.01, draw: (y) => `<ellipse cx="${AX}" cy="${y}" rx="6" ry="2.5" class="fill"/>` }];
      for (const h of hands) { const len = { hour: 32, minute: 40, second: 46 }[h], w = { hour: 3.5, minute: 2.5, second: 1.25 }[h]; list.push({ name: h, z: S["sh_" + h], draw: (y) => `<circle cx="${AX}" cy="${y}" r="2.5"/><line x1="${AX}" y1="${y}" x2="${AX + len}" y2="${y}" stroke-width="${w}"/><line x1="${AX}" y1="${y}" x2="${AX - 10}" y2="${y}" stroke-width="${w}"/>` }); }
      // the rings: rounder ellipses, spread evenly from the smallest to the frame's width (Okay, 01:58: "rounder ellipses, proportionally more space between rings so they fit the horizontal gap perfectly")
      const shown = S.rings.map((R, i) => [R, i]).filter(([R]) => R.on);
      shown.forEach(([R, i], n) => { const r = clamp(S.w_ink + (R.ink_d || 0), 0, 10), rx = 18 + (AX - 10 - 18) * (n / Math.max(1, shown.length - 1)); list.push({ name: `ring-${i}`, z: r * STEP, draw: (y) => `<ellipse cx="${AX}" cy="${y}" rx="${rx.toFixed(1)}" ry="${(rx * ROUND).toFixed(1)}"/>` }); });
      list.push({ name: "plate", z: 0, draw: (y) => `<ellipse cx="${AX}" cy="${y}" rx="${AX - 4}" ry="${((AX - 4) * ROUND).toFixed(1)}" stroke-width="1.5"/><circle cx="${AX}" cy="${y}" r="1.5"/><rect x="${AX + 22}" y="${y - 2.5}" width="8" height="5" rx="1"/>` });
      list.push({ name: "disc", z: -S.sh_disc - 0.3, draw: (y) => `<ellipse cx="${AX}" cy="${y}" rx="30" ry="${(30 * ROUND).toFixed(1)}" stroke-dasharray="2 2"/>` });
      list.sort((a, b) => b.z - a.z);      // top first
      // y from the height, then pushed apart so no two are closer than GAP, from the plate upward and downward
      const at = list.map((p) => -p.z * MM), i0 = list.findIndex((p) => p.name === "plate");
      for (let i = i0 - 1; i >= 0; i--) at[i] = Math.min(at[i], at[i + 1] - GAP);
      for (let i = i0 + 1; i < list.length; i++) at[i] = Math.max(at[i], at[i - 1] + GAP);
      const top = at[0] - 6, bottom = at.at(-1) + 30 * ROUND + 2, shift = H / 2 - (top + bottom) / 2;      // the stack centred in the frame by its extent
      parts.innerHTML = list.map((p, i) => `<g data-part="${p.name}"${p.name === this.shade_lit ? ' class="lit"' : ""}>${p.draw((at[i] + shift).toFixed(1))}</g>`).join("");
      axis.setAttribute("x1", AX); axis.setAttribute("x2", AX); axis.setAttribute("y1", (top + shift).toFixed(1)); axis.setAttribute("y2", (bottom + shift).toFixed(1));
    };
    return { el: box, refresh };
  },

  shade_light(name) {
    if (name === this.shade_lit) return;
    this.shade_lit = name || null;
    for (const g of document.querySelectorAll("#shadows-stack .parts > g")) g.classList.toggle("lit", g.dataset.part === this.shade_lit);
  },

  /** the sun's picture (#526; Okay's drawing, 24 Oct 2026): the dial as a ring, the sun outside it with rays, a faint
   *  disc on the far side where the shadows fall (the figures ride in the three sliders' knobs beside it). One
   *  finger or the pointer moves the sun: round the dial for the angle, toward the middle for higher (Okay, 24 Oct
   *  2026: "Drag it"); the sliders under it follow. The rays point away from the dial, symmetrical about that line,
   *  and grow with the sun's distance (Okay: "Rays can grow on distant suns, shorter when they are close"); a sun
   *  near a corner has its rays cut by the frame ("the rays pop in and out"). Drawn once, moved by attributes. */
  sun_picture(id) {
    const W = token("--sun-w", 224), H = token("--sun-h", 204), cx = W / 2, cy = H / 2, R = 56, NEAR = 16, FAR = 100;      // the picture's grid, as the stylesheet sizes its box (--sun-w × --sun-h); the sun's distance from the middle: Height 85 = NEAR, 5 = FAR
    const box = el("div", { className: "sunpic", id: id + "-sun" });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><circle class="dial" cx="${cx}" cy="${cy}" r="${R}"/><circle class="hole" cx="${cx}" cy="${cy}" r="3"/><circle class="fall" r="7"/><g class="sun"><circle r="8"/><g class="rays"></g></g></svg><span class="word">Sun</span>`;
    const sun = box.querySelector(".sun"), rays = box.querySelector(".rays"), fall = box.querySelector(".fall");
    for (let i = 0; i < 16; i++) rays.append(svg_el("line"));
    const where = () => { const a = this.S.sh_from * Math.PI / 180, d = FAR - (clamp(this.S.sh_rise, 5, 85) - 5) / 80 * (FAR - NEAR); return { a, d, x: cx + Math.sin(a) * d, y: cy - Math.cos(a) * d }; };      // clock angles: 0 at 12, clockwise (R2)
    const refresh = () => {
      const { a, d, x, y } = where();
      sun.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      // sixteen rays; Strength lengthens them ("Strength more less lengthens the sun's rays"); a sun far out shows the
      // fewest — 5 % of them hidden near the dial, 75 % at the corners — and the ones facing away from the dial go
      // first, the ones toward it always stay ("Imagine magnet attracting iron shavings", Okay, 25 Oct 2026, 01:58)
      const len = (4 + 10 * clamp(this.S.sh_dark, 0, 100) / 100) * (0.8 + 0.4 * (d - NEAR) / (FAR - NEAR));
      const hide = 0.05 + 0.70 * clamp((d - NEAR) / (FAR - NEAR), 0, 1), toward = a + Math.PI;      // the direction to the dial's middle
      [...rays.children].forEach((line, i) => {
        const t = toward + (i - 7.5) * Math.PI / 8, facing = (1 - Math.cos(t - toward)) / 2;      // 0 toward the dial, 1 away
        line.style.display = facing > 1 - hide ? "none" : "";
        for (const [k, v] of [["x1", 12 * Math.sin(t)], ["y1", -12 * Math.cos(t)], ["x2", (12 + len) * Math.sin(t)], ["y2", -(12 + len) * Math.cos(t)]]) line.setAttribute(k, v.toFixed(1));
      });
      fall.setAttribute("cx", (cx - Math.sin(a) * (R - 2)).toFixed(1)); fall.setAttribute("cy", (cy + Math.cos(a) * (R - 2)).toFixed(1));
    };
    // a drag anywhere on the picture puts the sun under the finger
    const move = (e) => {
      const r = box.getBoundingClientRect(), k = Math.max(W / r.width, H / r.height);      // the picture keeps its proportions in a box of any width (it is centred), so the press is read through that scale
      const px = W / 2 + (e.clientX - r.left - r.width / 2) * k, py = H / 2 + (e.clientY - r.top - r.height / 2) * k;
      const dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy), from = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360;
      this.S.sh_from = Math.round(from);
      this.S.sh_rise = Math.round(clamp(5 + 80 * (FAR - clamp(dist, NEAR, FAR)) / (FAR - NEAR), 5, 85));
      this.sync_rows(); this.render();
    };
    box.onpointerdown = (e) => { if (e.button !== 0 && e.pointerType === "mouse") return; e.preventDefault(); box.setPointerCapture(e.pointerId); box.classList.add("held"); move(e); };
    box.onpointermove = (e) => { if (box.classList.contains("held")) move(e); };
    box.onpointerup = box.onpointercancel = () => box.classList.remove("held");
    return { el: box, refresh };
  },
};
