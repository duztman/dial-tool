// preview.js — the canvas: the frame (render → frame → draw, R28), the view (place, fit, zoom), what the pointer is
// on, the selected ring's handles, the case round the dial, the switches on the canvas (Backdrop, case, X-ray) and
// the Tiny Preview.

import * as G from "./geometry.js";
import { svg_document } from "./output.js";
import { frame, KINDS } from "./watch.js";
import * as SHOW from "./show.js";      // show mode: the watch round the dial, its tabs, its export (#509)
import { $, FINE, FINE_FREE, HANDLE_OUT, HANDLE_R, HANDLE_REACH, HANDLE_SEAT, HOLE_LIVE_MS, TINY_EVERY, clamp, el, from_hex, paint, svg_el, to_hex } from "./ui.js";
import { SIGNS, TOOL_ICONS, eye, icon } from "./icons.js";
import { merges_of } from "./rows.js";

export const PREVIEW = {
  dial_alone(on) {
    const app = $("#app");
    this.eye_button.setAttribute("aria-pressed", String(on));
    if (this.unit_open) this.unit_open(false);
    app.style.setProperty("--title-end", this.title.getBoundingClientRect().right.toFixed(1) + "px");      // undo · redo stop short of the title
    app.style.setProperty("--bar-h", $(".bar").offsetHeight + "px");      // a phone: the panel's row is what the bar leaves
    this.fitted = true;
    this.sliding = true;                           // the shadows' soft edge waits for the slide (moving())
    if (this.view_end) app.removeEventListener("transitionend", this.view_end);
    const back = () => { if (!on) app.classList.remove("alone"); };
    this.view_end = (e) => { if (e.target === app) { this.sliding = false; back(); this.fit(); this.render(); } };
    setTimeout(() => { back(); if (this.sliding) { this.sliding = false; this.render(); } }, 1200);      // no slide (less motion asked, nothing to move): don't wait for it
    app.addEventListener("transitionend", this.view_end);
    if (on && app.classList.contains("showing")) {      // measured before the panel moves (with less motion it moves at once). Show mode: the bar goes too (2-base.css) and the title moves flush right as the panel goes (4a-panel.css; Okay, 25 Oct 2026: "on right name needs to stay flush right sadly, an exception")
      const r = $(".mast").getBoundingClientRect(), m = parseFloat(getComputedStyle($(".panel")).getPropertyValue("--margin")) || 16;
      app.style.setProperty("--mast-shift", (innerWidth - m - r.right).toFixed(1) + "px"); app.classList.add("alone"); }
    app.classList.toggle("away", on);
    if (app.classList.contains("showing") && !app.classList.contains("swooping")) { const follow = () => { if (!this.sliding) return; this.fit(); requestAnimationFrame(follow); }; requestAnimationFrame(follow); }      // show mode: the canvas keeps its size while the column slides over it, so the watch is fitted frame by frame (in a swoop, the swoop moves it)
  },

  /** show mode's round swatch at the title line's end (the Show Case's, 21 Oct 2026, 03:35): the panel's other look — in greys
   *  like the bar, or back in the backdrop's colour. It shows the look it would switch to. Hidden on the dial side (R16) */
  grey_swatch() {
    this.grey_button = el("button", { type: "button", className: "greyswatch", id: "grey-panel", onclick: () => { this.set_value("global", "ui_grey_panel", !this.S.ui_grey_panel); this.tint_panel(); } });
    return this.grey_button;
  },

  /** the backdrop's colour, at the preview's bottom left (Okay, 12 Oct 2026): one switch like the Guides one, always
   *  with a solid line, showing the colour as a chip. A press opens the colour pop-out for the backdrop. */
  backdrop_box() {
    const dot = el("i", { className: "dot" });
    const box = el("button", { type: "button", className: "onview backdropbox", id: "backdrop", title: "The backdrop’s colour (preview only)" }, dot, el("span", { className: "word", textContent: "Backdrop" }));
    box.setAttribute("aria-expanded", "false");
    const pop = this.ground_pop();
    box.onclick = () => { if (this.S.ui_show) return this.ground_open(pop.hidden); this.pop_open({ read: () => this.S.c_backdrop, write: (v) => this.set_value("global", "c_backdrop", v), label: () => "Backdrop" }, box); };      // show mode: the Show Case's presets and gradients; the dial side: the colour itself
    this.backdrop_dot = dot;
    // the eye switch (Okay, 15 Oct 2026, 02:42; at the preview's bottom right since 03:41, .eyes): on, the dial alone —
    // the panel slides away and the dial grows to fit (dial_alone(), 04:02). Not part of a dial
    const eye = el("button", { type: "button", className: "onview eyebox", id: "eye-box", title: "The dial alone: the panel slides away", ariaLabel: "The dial alone" });
    eye.innerHTML = icon(TOOL_ICONS.show_eye, 30);      // the eye, lids and iris (Okay, 24 Oct 2026: "switch activate showcase to rays and regular eye to regular preview")
    eye.dataset.tip = "The dial alone";
    eye.setAttribute("aria-pressed", "false");
    eye.onclick = () => { if (this.comparing) return this.compare(false); this.dial_alone(eye.getAttribute("aria-pressed") !== "true"); };      // in Compare (#435) the eye is the way back
    this.eye_button = eye;
    // the showcase switch, left of the eye: an iris in a box. Pressed, it opens to the left with ACTIVATE SHOWCASE, and
    // only those words take you there (Okay, 04:59: "we need affordance"); pressed again, it shuts. In the showcase
    // it is an X, the way out
    const iris = el("button", { type: "button", className: "iriskey", id: "iris-box", ariaLabel: "The showcase" });      // no tag and no tooltip: its words unfold when pressed (Okay, 24 Oct 2026, 21:39: "show mode tooltip no need and incorrect on desktop")
    iris.innerHTML = icon(TOOL_ICONS.eyebox, 30);      // the rays round the iris (Okay, 24 Oct 2026: "Eye with rays is … for activate showcase"); they turn once as its words unfold and fold
    iris.setAttribute("aria-pressed", "false");
    iris.onclick = () => { if (this.S.ui_show) this.show_mode(false); else this.iris_open(this.iris_box.getAttribute("aria-expanded") !== "true"); };
    this.iris_go = el("button", { type: "button", className: "irisgo", id: "iris-go", textContent: "Activate showcase", onclick: () => this.show_mode(true) });
    this.iris_box = el("div", { className: "onview irisbox" }, this.iris_go, iris);
    this.iris_button = iris;
    this.iris_open(false);
    this.eye_box = el("div", { className: "eyes" }, eye, this.iris_box);      // bottom to top: show mode, the dial alone, (the Tiny Preview over them) — Okay, 24 Oct 2026: "Lowest is activate middle normal, top mini"
    return el("div", { className: "backdrops" }, box, pop);
  },

  /** show mode's Backdrop (the Show Case's background popup, 21 Oct 2026; Okay, 23 Oct 2026: "Backdrop did not get the
   *  gradients/preset colors"): two sides, one colour and a gradient, ten presets each, and under each its own colour — one
   *  pill, or two for the gradient's ends — which opens the colour pop-out. A gradient is c_backdrop to c_backdrop2 */
  ground_pop() {
    // show mode's Backdrop (#510; Okay, 25 Oct 2026: "Make the all swatches same, large size, gradents are 2x blocks of the
    // same single swatch with a gradient in it. Better design of the popup. Adding colors or gradients by user possible,
    // save file carries those too"): the Shadows pane's night box and width; one grid of large squares — Auto, the ten
    // colours, yours, then + (the colour pop-out's palette: + adds the backdrop in hand, − takes it out) — and the
    // gradients as two squares each, the same way; the footer (§popfoot) holds the colour in hand and the gradient's ends
    const pop = el("div", { className: "guidelist shadelist night groundpop", id: "ground-pop", hidden: true });
    const S = () => this.S, hex = (c) => (c ? to_hex(c) : null), syncs = [];
    const grad = () => (S().c_backdrop2 ? [S().c_backdrop, S().c_backdrop2] : this.ground_grad || SHOW.GRADIENTS[8].slice(1).map((h) => from_hex(h)));      // the gradient last used, kept while one colour is shown
    const set = (a, b, auto = false) => { this.set_value("global", "w_ground_auto", auto); this.set_value("global", "c_backdrop", a); this.set_value("global", "c_backdrop2", b); if (b) this.ground_grad = [a, b]; this.ground_sync(); };
    const same = (a, b) => hex(a) === hex(b);
    const now_is = (a, b) => !S().w_ground_auto && same(S().c_backdrop, a) && (b ? same(S().c_backdrop2, b) : !S().c_backdrop2);
    const tile = (name, look, on, act, wide = false) => { const b = el("button", { type: "button", className: "groundtile" + (wide ? " wide" : ""), title: name, ariaLabel: name }, el("i")); b.firstChild.style.background = look; b.onclick = act; syncs.push(() => b.classList.toggle("on", on())); return b; };
    const head = (word) => el("div", { className: "guidehead" }, el("span", { className: "name", textContent: word }));
    // yours, kept in the file and the session (w_grounds): each [colour] or [first, second]
    const mine = (two) => (S().w_grounds || []).filter((g) => (g.length === 2) === two);
    const kept = (two) => (S().w_grounds || []).some((g) => (two ? S().c_backdrop2 && g.length === 2 && same(g[0], S().c_backdrop) && same(g[1], S().c_backdrop2) : !S().c_backdrop2 && g.length === 1 && same(g[0], S().c_backdrop)));
    const plus = (two) => { const b = el("button", { type: "button", className: "groundtile add" + (two ? " wide" : ""), id: two ? "ground-add-gradient" : "ground-add" });
      b.onclick = () => { const now = S().c_backdrop2 ? [S().c_backdrop, S().c_backdrop2] : [S().c_backdrop], list = (S().w_grounds || []).slice();
        if (Boolean(S().c_backdrop2) !== two) return;      // + adds what is in hand of its own kind: a colour to the colours, a gradient to the gradients
        const at = list.findIndex((g) => g.length === now.length && g.every((c, k) => same(c, now[k])));
        if (at >= 0) list.splice(at, 1); else list.push(now.map((c) => c.slice()));
        this.set_value("global", "w_grounds", list); this.ground_fill(); };
      syncs.push(() => { const k = kept(two), can = Boolean(S().c_backdrop2) === two; b.textContent = k ? "−" : "+"; b.disabled = !can;
        b.title = b.ariaLabel = !can ? (two ? "Pick a gradient to add it" : "Pick a colour to add it") : k ? "Take this backdrop out of yours" : two ? "Add this gradient to yours" : "Add this colour to yours"; });
      return b; };
    const solids = el("div", { className: "groundtiles", id: "ground-colours" }), gradients = el("div", { className: "groundtiles", id: "ground-gradients" });
    const auto_tile = tile("Auto", "", () => Boolean(S().w_ground_auto), () => set(SHOW.auto_ground(S()), null, true));
    auto_tile.classList.add("auto"); auto_tile.firstChild.textContent = "Auto";
    syncs.push(() => { auto_tile.firstChild.style.background = hex(SHOW.auto_ground(S())); });
    const add_one = plus(false), add_two = plus(true);
    this.ground_fill = () => {      // the grids again: yours change with + and −
      syncs.length = base;
      solids.replaceChildren(auto_tile, ...SHOW.GROUNDS.map(([n, c]) => tile(n, c, () => now_is(from_hex(c)), () => set(from_hex(c), null))),
        ...mine(false).map(([c], i) => tile(`Yours ${i + 1} · ${hex(c).toUpperCase()}`, hex(c), () => now_is(c), () => set(c.slice(), null))), add_one);
      gradients.replaceChildren(...SHOW.GRADIENTS.map(([n, a, b]) => tile(n, `linear-gradient(135deg, ${a}, ${b})`, () => now_is(from_hex(a), from_hex(b)), () => set(from_hex(a), from_hex(b)), true)),
        ...mine(true).map(([a, b], i) => tile(`Yours ${i + 1}`, `linear-gradient(135deg, ${hex(a)}, ${hex(b)})`, () => now_is(a, b), () => set(a.slice(), b.slice()), true)), add_two);
      this.ground_sync();
    };
    // the footer: the colour in hand (its dot and hex) and the gradient's two ends, each a cell
    const one_dot = el("i", { className: "dot" }), one_hex = el("span", { className: "hex" });
    const one = el("button", { type: "button", className: "colour groundpick", id: "ground-one", title: "The backdrop's colour" }, one_dot, one_hex);
    one.onclick = () => this.pop_open({ read: () => S().c_backdrop, write: (v) => set(v, null), label: () => "Backdrop" }, one);
    const ends = [0, 1].map((k) => { const d = el("button", { type: "button", className: "colour groundpick groundend", id: `ground-end-${k}`, title: k ? "The gradient's second colour" : "The gradient's first colour" }, el("i", { className: "dot" }));
      d.onclick = () => this.pop_open({ read: () => grad()[k], write: (v) => { const g = grad().slice(); g[k] = v; set(g[0], g[1]); }, label: () => (k ? "Gradient · second" : "Gradient · first") }, d); return d; });
    const both = el("span", { className: "gradpick" }, ...ends);
    syncs.push(() => {
      paint(one_dot, S().c_backdrop); one_hex.textContent = hex(S().c_backdrop).toUpperCase(); one.classList.toggle("on", !S().c_backdrop2 && !S().w_ground_auto);
      grad().forEach((c, k) => paint(ends[k].firstChild, c)); both.classList.toggle("on", Boolean(S().c_backdrop2));
    });
    const base = syncs.length;
    const cell = (cls, word, ...what) => el("div", { className: "cell " + cls }, el("span", { className: "footname", textContent: word }), ...what);
    pop.append(el("div", { className: "shadescroll groundscroll" }, head("One colour"), solids, head("Gradient"), gradients),
      el("div", { className: "popfoot groundfoot" }, cell("lead", "Colour", one), cell("", "Gradient", both), el("div", { className: "cell" })));
    this.ground_sync = () => { for (const f of syncs) f(); };
    this.ground_open = (on) => { if (on) this.ground_fill(); pop.hidden = !on; $("#backdrop").setAttribute("aria-expanded", String(on)); };
    return pop;
  },

  /** Okay's mark in the panel's first column, left of the title; a press opens a short bio: who made the tool, where
   *  its source is, and the open-source work it stands on (Okay, 15 Oct 2026, 02:42: "This triggers bio. Make it short,
   *  give links. Acknowledge harfbuzz and other opensource providers"). A press elsewhere or Escape closes it. */
  logo_box() {
    const button = el("button", { type: "button", className: "logo", id: "logo", title: "About Dial Tool", ariaLabel: "About Dial Tool" });
    button.innerHTML = icon(TOOL_ICONS.logo);
    button.setAttribute("aria-expanded", "false");
    const a = (href, text) => el("a", { href, textContent: text, target: "_blank", rel: "noopener" });
    const line = (...parts) => el("p", {}, ...parts);
    const bio = el("div", { className: "bio night", id: "bio", hidden: true },      // no title of its own: the header's is right above it (Okay, 03:06)
      this.bio_first = line("A tool for designing watch dials, ring by ring, in the browser. Designed and vibecoded by Okay (pronounced oak·eye), a graphic designer in Istanbul working across contemporary art, architecture and cinema, for a watch he is building. "),      // 06:51: "designed and vibe coded by okay"; the contact line ends this paragraph
      line("Source, every version and the MIT licence: ", a("https://github.com/duztman/dial-tool", "github.com/duztman/dial-tool"), "."),
      el("h3", { textContent: "Built on open source" }),
      el("ul", {},
        el("li", {}, a("https://harfbuzz.github.io", "HarfBuzz"), " sets the type (harfbuzzjs, MIT)."),
        el("li", {}, a("https://skia.org", "Skia"), "’s PathKit joins and cuts the shapes (BSD 3-clause)."),
        el("li", {}, a("https://rsms.me/inter/", "Inter"), " by Rasmus Andersson is the stand-in typeface; ", a("https://fonts.google.com/specimen/Silkscreen", "Silkscreen"), " by Jason Kottke sets the tiny figures (SIL OFL)."),
        el("li", {}, "The twenty-one dial typefaces, each under its designers’ SIL Open Font License, most of them from ", a("https://fonts.google.com", "Google Fonts"), "."),
        el("li", {}, a("https://www.drawbot.com", "DrawBot"), " is where the tool began; ", a("https://esbuild.github.io", "esbuild"), " builds it and ", a("https://playwright.dev", "Playwright"), " tests it.")));
    // contact: Okay's address, kept from address-harvesting robots that read pages and repositories (Okay, 03:18:
    // "encrypt it somehow so no one can get it. Reasonably"): stored as its letters' codes, each XOR 23, back to front,
    // so it never stands in the page or the source as an address; put together only when "here" is pressed
    const MAIL = [122, 120, 116, 57, 123, 126, 118, 122, 112, 87, 101, 118, 123, 126, 110, 118, 115, 118, 101, 118, 124, 110, 118, 124, 120];
    const write = el("a", { href: "#contact", textContent: "here", onclick: (e) => { e.preventDefault(); location.href = "mailto:" + String.fromCharCode(...MAIL.map((c) => c ^ 23).reverse()); } });
    this.bio_first.append("Contact him ", write, ".");
    const open = (on) => { bio.hidden = !on; button.setAttribute("aria-expanded", String(on)); };
    this.bio_open = open;
    button.onclick = () => { if (!this.S.ui_show) open(bio.hidden); };      // show mode: the mark opens nothing (Okay, 23 Oct 2026: "Showcase does not get a bio popup, unclickable icon")
    const box = el("div", { className: "about" }, button, bio);
    box.onkeydown = (e) => { if (e.key === "Escape" && !bio.hidden) { open(false); button.focus(); } };
    return box;
  },

  /** Tiny Preview (#337; Okay's notes 2, 18 Oct 2026: "pops up in place when clicked, not editable, just a 100%
   *  preview. If the dial is 40mm, this guy is 40mm + appropriate padding. Has a shadow, and like a window it can be
   *  dragged and dropped anywhere. Top of everything. On its top left an eye appears on hover or tap, that hides it, it
   *  goes back to its place"). Its button at the preview's bottom right, the iris as its sign (19 Oct 2026). The dial
   *  as its SVG file draws it — at the browser's millimetres (96 to the inch: "approximation fine for now", 18 Oct),
   *  its margins round it on the backdrop — redrawn at most five times a second while the dial changes. */
  tiny_box() {
    const button = el("button", { type: "button", className: "onview tinyopen", id: "tiny-open", ariaLabel: "Tiny preview" });
    button.dataset.tip = "Tiny Preview";      // its name, as the other two (Okay, 24 Oct 2026: "Their names")
    button.innerHTML = icon(TOOL_ICONS.iris, 30);      // the iris alone (Okay, 19 Oct 2026: "Tiny gets the dot, showcase gets the eye")
    const shut = el("button", { type: "button", className: "tinyshut", id: "tiny-shut", ariaLabel: "Put the tiny preview away" });
    shut.innerHTML = eye(true);
    const face = el("div", { className: "tinyface" });
    const win = el("div", { className: "tinywin", id: "tiny", hidden: true, role: "img", ariaLabel: "The dial at its own size" }, face, shut);
    if ($("#tiny")) $("#tiny").remove();           // the last tool's, left in the body (a dial opened anew builds the tool again)
    document.body.append(win);
    const show = (on) => {
      const b = button.getBoundingClientRect();    // measured while the button still stands
      win.hidden = !on; button.hidden = on;
      if (!on) { button.focus({ preventScroll: true }); return; }
      this.tiny_draw(true);
      if (!this.tiny.placed) {                     // until it is dragged: in place of its button, their right edges together, kept inside the canvas's padding (Okay, 24 Oct 2026: "Mini appears within canvas inside normal view padding")
        const m = this.main.getBoundingClientRect(), pad = parseFloat(getComputedStyle(this.main).getPropertyValue("--canvas-inset")) || 0;
        win.style.left = `${clamp(b.right - win.offsetWidth, m.left + pad, m.right - pad - win.offsetWidth)}px`;
        win.style.top = `${clamp(b.top, m.top + pad, m.bottom - pad - win.offsetHeight)}px`;
      }
    };
    button.onclick = () => show(true);
    shut.onclick = (e) => { e.stopPropagation(); show(false); };
    shut.onpointerdown = (e) => e.stopPropagation();
    // dragged anywhere, kept inside the window; a tap (a finger has no hover) wakes the eye a moment
    let grab = null;
    win.onpointerdown = (e) => {
      const b = win.getBoundingClientRect();
      grab = { dx: e.clientX - b.left, dy: e.clientY - b.top, moved: false };
      win.setPointerCapture(e.pointerId);
      win.classList.add("held");
    };
    win.onpointermove = (e) => {
      if (!grab) return;
      const x = clamp(e.clientX - grab.dx, 0, innerWidth - win.offsetWidth), y = clamp(e.clientY - grab.dy, 0, innerHeight - win.offsetHeight);
      win.style.left = `${x}px`; win.style.top = `${y}px`; grab.moved = true; this.tiny.placed = true;
    };
    win.onpointerup = win.onpointercancel = () => {
      if (grab && !grab.moved) { win.classList.add("awake"); clearTimeout(this.tiny.wake); this.tiny.wake = setTimeout(() => win.classList.remove("awake"), 2400); }
      grab = null; win.classList.remove("held");
    };
    this.tiny = { win, face, show, button, at: 0, timer: 0, placed: false, wake: 0 };
    return button;
  },

  /** the Tiny Preview follows the dial: now, or at most five times a second (it is a whole SVG each time). */
  tiny_draw(now = false) {
    const T = this.tiny;
    if (!T || T.win.hidden || !this.statik) return;
    const go = () => {
      T.at = performance.now(); T.timer = 0;
      T.face.innerHTML = svg_document({ ...this.S, guides: false, xray: false, out_production: false, out_mirror: false }, this.statik, this.S.t, { preview: true }).replace(/^<\?xml[^>]*>\s*/, "");
    };
    if (now) { clearTimeout(T.timer); return go(); }
    if (!T.timer) T.timer = setTimeout(go, Math.max(0, TINY_EVERY - (performance.now() - T.at)));
  },

  /** handles on the selected ring's guides (4.65; farukahmet's PR #2, 18 Oct 2026, redrawn: Okay, 21:20: "Drag handles
   *  great as an idea, needs to be implemented in our ways and design, inner outer thing already has dotted line, all
   *  these handles should be in guide color, adapted"). On the Rings tab, with guides on, over the selected ring:
   *    · a disc on its dotted line (where its radius measures to: outer, middle or inner end, a numeral's anchor) —
   *      dragged in or out, it sets the radius;
   *    · a square on the edge away from it — dragged, it sets how big one of its things is (a mark's length or a dot's
   *      Ø, a numeral's size, a band's width), the edge following the pointer;
   *    · a triangle just outside the ring at its first position — dragged round, it sets Start;
   *    · with a span under 360°, a second triangle at its end — dragged round, it sets Span.
   *  All in the ring's guide colour, a hairline of white round them, the size of a fingertip on any zoom. The radius
   *  and size handles stand halfway between the first two positions, so they never sit on a mark. They go through
   *  set_value, as the panel's rows do: undo, the controller, the guides live while dragged. */
  draw_handles() {
    const H = this.handles;
    if (!H) return;
    const more = this.more_handles();      // the added guides' handles, while the Guides list is open (#527)
    const R = this.ring(), k = R ? G.ring_guide(this.S, this.S.ui_ring) : null;
    if (this.S.ui_show || this.unselected || this.S.ui_section !== 1 || !this.guides_drawn || !R || !R.on || k === null) {      // the selected ring's, shown to start (#486) and always with its guide (draw): a numeral being nudged hides both
      if ("more:" + more.key !== this.handles_key) { this.handles_key = "more:" + more.key; H.innerHTML = more.parts.join(""); }      // its own kind of key, so a cleared key ("") never passes for "nothing to show"
      return;
    }
    const kind = G.kind_of(R), ext = { ticks: R.len, markers: R.len, band: R.width }[kind] || 0;
    let outer = R.r + G.from_shift(R, ext), inner = outer - ext;
    if (G.has_text(R)) [inner, outer] = G.text_band(R);      // the band (#488)
    const angles = G.ring_angles(R), a0 = angles[0] ?? (+R.start || 0);
    const free = angles.length > 1 ? a0 + ((((angles[1] - a0) % 360) + 360) % 360) / 2 : a0 + 15;
    const edge = Math.abs(outer - R.r) >= Math.abs(R.r - inner) ? outer : inner;      // the edge away from the dotted line
    const span = Math.min(Math.max(+R.span || 360, 1), 360), out = outer + HANDLE_OUT / this.z;
    const key = [this.S.ui_ring, R.r, edge, outer, a0, free, span, this.z, this.S.out_mirror, k, more.key].join();
    if (key === this.handles_key) return;          // nothing moved: the handles stay as they are
    this.handles_key = key;
    const tone = G.GUIDE_COLOURS[k], s = 1 / this.z, flip = this.S.out_mirror ? -1 : 1;
    const at = (r, a) => G.clock_point(r, a).map((v) => v.toFixed(4)).join(" ");
    const shape = { radius: `<circle r="${HANDLE_R}"/>`, size: `<rect x="${-HANDLE_R}" y="${-HANDLE_R}" width="${2 * HANDLE_R}" height="${2 * HANDLE_R}"/>`,
      start: `<path d="M${-HANDLE_R} ${-HANDLE_R}L${HANDLE_R} 0L${-HANDLE_R} ${HANDLE_R}Z"/>`, span: `<path d="M${HANDLE_R} ${-HANDLE_R}L${-HANDLE_R} 0L${HANDLE_R} ${HANDLE_R}Z"/>` };
    const tip = { radius: "Radius: drag in or out", size: { numerals: "Size", text: "Size", band: "Band width", ticks: "Length", markers: G.SHAPES[R.shape] === "dot" ? "Ø" : "Length" }[kind] + ": drag in or out", start: "Start: drag round", span: "Span: drag round" };
    const place = { radius: [R.r, free], size: [edge, free], start: [out, a0], span: [out, (+R.start || 0) + span] };
    const parts = Object.keys(place).filter((w) => w !== "span" || span < 360).map((w) => {
      const [r, a] = place[w];
      // a handle stands upright on the screen; the triangles turn with their angle, pointing round the ring
      const turn = w === "start" || w === "span" ? a : 0;
      return `<g class="handle ${w}" data-handle="${w}" data-tip="${tip[w]}" transform="translate(${at(r, a)}) scale(${(flip * s).toFixed(6)} ${(-s).toFixed(6)}) rotate(${(flip * turn).toFixed(3)})"><circle class="reach" r="${HANDLE_REACH}"/><circle class="seat" r="${HANDLE_SEAT}"/>${shape[w]}</g>`;      // each in a disc of the guide's colour (#486: "All resize etc handles get a guide colored disc to sit in")
    });
    H.style.setProperty("--handle", tone);
    H.innerHTML = parts.join("") + more.parts.join("");
  },

  /** the guides added by hand, each with a handle in its own colour while the Guides list is open (#527; Okay, 24 Oct
   *  2026: placed "Both" ways — dragged here, and by the numbers in its line): a line by a triangle on it, turned round;
   *  a crosshair by a square on its point, moved anywhere; a circle by a disc on it, dragged in or out. */
  more_handles() {
    const S = this.S, list = $("#guide-list");
    if (S.ui_show || !S.guides || !list || list.hidden || !(S.gd_more || []).length) return { key: "", parts: [] };
    const s = 1 / this.z, flip = S.out_mirror ? -1 : 1, R0 = S.dial_d / 2;
    const at = (r, a) => G.clock_point(r, a).map((v) => v.toFixed(4)).join(" ");
    const parts = S.gd_more.map((g, i) => {
      if (!(g.k >= 0)) return "";      // a hidden guide has no handle
      const kind = G.GUIDE_MORE[g.kind];
      const [r, a, sign, turn, tip] = kind === "line" ? [R0 * 0.8, g.a || 0, `<path d="M${-HANDLE_R} ${-HANDLE_R}L${HANDLE_R} 0L${-HANDLE_R} ${HANDLE_R}Z"/>`, (g.a || 0) + 90, "Line: drag round"]
        : kind === "crosshair" ? [g.r || 0, g.a || 0, `<rect x="${-HANDLE_R}" y="${-HANDLE_R}" width="${2 * HANDLE_R}" height="${2 * HANDLE_R}"/>`, 0, "Crosshair: drag it anywhere"]
        : [g.r || 0, 135, `<circle r="${HANDLE_R}"/>`, 0, "Circle: drag in or out"];      // at half past four: clear of the list, which opens at the top right
      return `<g class="handle more" data-more="${i}" data-tip="${tip}" style="--handle: ${G.GUIDE_COLOURS[g.k]}" transform="translate(${at(r, a)}) scale(${(flip * s).toFixed(6)} ${(-s).toFixed(6)}) rotate(${(flip * turn).toFixed(3)})"><circle class="reach" r="${HANDLE_REACH}"/><circle class="seat" r="${HANDLE_SEAT}"/>${sign}</g>`;
    });
    return { key: JSON.stringify([S.gd_more, this.z, S.out_mirror, S.dial_d]), parts };
  },

  /** a handle dragged: the pointer, in mm on the dial, sets its value as the row would (set_value). */
  handle_events() {
    const H = this.handles;
    H.addEventListener("pointerdown", (e) => {
      const m = e.target.closest("[data-more]");
      if (m) {                                      // an added guide's handle (#527)
        e.stopPropagation(); e.preventDefault();
        this.more_drag = { i: +m.dataset.more, x: e.clientX, y: e.clientY, moved: false };
        H.setPointerCapture(e.pointerId);
        H.classList.add("dragging");
        this.tag_hide();
        return;
      }
      const g = e.target.closest("[data-handle]");
      if (!g) return;
      e.stopPropagation(); e.preventDefault();      // not a pan, not a press on the dial
      const R = this.ring(), what = g.dataset.handle, kind = G.kind_of(R);
      const key = what === "size" ? (G.has_text(R) ? "size" : kind === "band" ? "width" : G.SHAPES[R.shape] === "dot" ? "w" : "len") : what === "radius" ? "r" : what;
      const ext = { ticks: R.len, markers: R.len, band: R.width }[kind] || 0;
      let outer = R.r + G.from_shift(R, ext), inner = outer - ext;
      if (G.has_text(R)) [inner, outer] = G.text_band(R);      // the band (#488)
      const edge = Math.abs(outer - R.r) >= Math.abs(R.r - inner) ? outer : inner;
      const b = this.svg.getBoundingClientRect(), [px, py] = this.to_mm([e.clientX - b.left, e.clientY - b.top]), d0 = Math.hypot(px, py), a0 = ((Math.atan2(px, py) * 180 / Math.PI) + 360) % 360;
      this.handle_drag = { what, key, v0: R[key], reach: Math.abs(edge - R.r) || 0.01, side: Math.sign(edge - R.r) || -1, r0: R.r, prev: null, x: e.clientX, y: e.clientY, moved: false,
        d0, a0, dist: d0, angle: a0, last_d: d0, last_a: a0 };      // where it was pressed, and the pointer's travel so far, slowed as it strays (#486)
      H.setPointerCapture(e.pointerId);
      H.classList.add("dragging");
      this.tag_hide();
    });
    H.addEventListener("pointermove", (e) => {
      const m = this.more_drag;
      if (m) {
        if (!m.moved && Math.hypot(e.clientX - m.x, e.clientY - m.y) < 3) return;
        m.moved = true;
        const b = this.svg.getBoundingClientRect(), [x, y] = this.to_mm([e.clientX - b.left, e.clientY - b.top]);
        const r = +Math.hypot(x, y).toFixed(2), a = +((((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360).toFixed(1));
        const g = this.S.gd_more[m.i], kind = G.GUIDE_MORE[g.kind];
        this.S.gd_more[m.i] = kind === "line" ? { ...g, a: +(a % 180).toFixed(1) } : kind === "crosshair" ? { ...g, r, a } : { ...g, r: Math.max(r, 0.05) };      // a line through the centre: 0–180° says it all
        this.sync_rows(); this.render();
        return;
      }
      const d = this.handle_drag;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 3) return;      // a press that hasn't moved changes nothing
      d.moved = true;
      const b = this.svg.getBoundingClientRect(), [x, y] = this.to_mm([e.clientX - b.left, e.clientY - b.top]);
      // finer the farther the pointer strays from its path, as a slider held away from its track (#486, #406: "Detail
      // rises with the mouse away like the sliders"): a radius or size handle travels along the line out from the
      // centre, so straying is sideways from it; a Start or Span handle travels round, so straying is in or out
      const d_now = Math.hypot(x, y), a_now = ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360, turned = ((a_now - d.last_a + 540) % 360) - 180;
      const round = d.what === "start" || d.what === "span";
      const stray = round ? Math.abs(d_now - d.d0) * this.z : Math.abs(d_now * Math.sin((a_now - d.a0) * Math.PI / 180)) * this.z;
      const fine = FINE(Math.max(stray - FINE_FREE, 0));
      d.dist = Math.max(d.dist + (d_now - d.last_d) * (round ? 1 : fine), 0); d.angle = ((d.angle + turned * (round ? fine : 1)) % 360 + 360) % 360;
      d.last_d = d_now; d.last_a = a_now;
      const dist = d.dist, angle = d.angle;
      this.guides_live();
      if (d.what === "radius") return this.set_value("ring", "r", +Math.max(dist, 0.05).toFixed(2));
      if (d.what === "size") {                       // the edge follows the pointer: the value grows as its reach from the dotted line does
        const reach = Math.max((dist - d.r0) * d.side, 0.02);
        return this.set_value("ring", d.key, +(d.v0 * reach / d.reach).toFixed(3));
      }
      if (d.what === "start") return this.set_value("ring", "start", Math.round(((angle + 540) % 360) - 180));
      const R = this.ring(), s0 = ((+R.start || 0) % 360 + 360) % 360;
      let span = ((angle - s0) % 360 + 360) % 360;
      if (d.prev !== null && d.prev - span > 180) span = 360; else if (d.prev !== null && span - d.prev > 180) span = 1;
      d.prev = span = Math.min(Math.max(Math.round(span), 1), 360);
      this.set_value("ring", "span", span);
    });
    const end = () => { this.handle_drag = null; this.more_drag = null; H.classList.remove("dragging"); };
    H.addEventListener("pointerup", end);
    H.addEventListener("pointercancel", end);
  },

  /** a case round the dial (4.66; farukahmet's PR #3, "abstractified" — bezels.js), drawn again only when its kind or
   *  the dial's size changes. Preview only: never in an export or the Tiny Preview (R26). */
  draw_bezel() {
    const S = this.S, key = S.ui_case ? `${S.bezel || 0}/${S.dial_d}` : "";
    if (key === this.bezel_key) return;
    this.bezel_key = key;
    this.bezel_g.innerHTML = S.ui_case ? frame({ kind: G.CASE_OF_BEZEL[S.bezel] || "dress", d: S.dial_d }) : "";
  },

  /** the case's switch, beside Backdrop (4.66): its kind's name and a chevron; the system's list over it, unseen. No case
   *  to start (ui_case; Okay, 23 Oct 2026: "On main default is caseless"); the kind is show mode's too. No strap here: the
   *  strap is show mode's alone ("case toggle does not bring in strap") */
  case_box() {
    const word = el("span", { className: "word" });
    const arrow = el("span", { className: "arrow" });
    arrow.innerHTML = icon(SIGNS.down);      // every chevron on the canvas points down (#518; Okay, 24 Oct 2026: "Chevrons all point down")
    const menu = el("select", { id: "case-pick", ariaLabel: "A case round the dial (preview only)", title: "A case round the dial (preview only)" });
    const NAMES = { dress: "Dress", field: "Field", diver: "Diver", emre01: "Emre" };      // Emre (Okay, 23 Oct 2026); its key stays emre01 (R8)
    menu.append(el("option", { value: "none", textContent: "No case" }));
    KINDS.forEach((kind) => menu.append(el("option", { value: String(G.BEZEL_OF_CASE[kind]), textContent: NAMES[kind] })));
    menu.onchange = () => {      // the view stays on the dial (4.69)
      if (menu.value === "none") this.set_value("global", "ui_case", false);
      else { this.set_value("global", "bezel", +menu.value); this.set_value("global", "ui_case", true); }
      this.case_sync(); this.render();
    };
    const sign = el("span", { className: "sign" }); sign.innerHTML = icon(TOOL_ICONS.case, 18);
    const box = el("span", { className: "onview casebox", id: "case" }, sign, word, arrow, menu);
    this.case_sync = () => {
      const S = this.S, kind = G.CASE_OF_BEZEL[S.bezel] || "dress";
      word.textContent = S.ui_case ? NAMES[kind] : "Case"; menu.value = S.ui_case ? String(G.BEZEL_OF_CASE[kind]) : "none"; box.classList.toggle("on", Boolean(S.ui_case));
    };
    this.case_sync();
    return [box];
  },

  render() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => this.frame());
  },

  frame() {
    this.pending = false;
    if (this.closed) return;
    try {
      if (this.playing) {
        const [wall, t] = this.play_from;
        this.S.t = (t + (performance.now() - wall) / 1000 * this.speed) % 86400;
        this.sync_time();
        this.pulse(this.S.t, performance.now() / 1000);
        this.render();
      }
      this.draw();
      if (this.S.ui_show) { if (!this.swoop_in) SHOW.draw(this, this.items); this.tint_panel(); } else this.draw_bezel();      // while the panels move into show mode the watch waits: the dial alone moves
      this.draw_handles();
      this.tiny_draw();
    } catch (e) {
      this.play(false);
      this.log("error while drawing a frame: " + (e.stack || e));
    }
  },

  draw() {
    let S = this.S.ui_show ? { ...this.S, guides: false } : this.unselected ? { ...this.S, ui_section: -1 } : this.S;      // show mode: no guides; nothing selected: no tab's focus, so no selected ring's or window's guides
    if (!S.ui_show && this.hole_at && performance.now() - this.hole_at < HOLE_LIVE_MS) {      // the centre hole being sized: its guide, alone if the guides are off (#267)
      S = S.guides ? { ...S, gd_hole_live: true } : { ...S, guides: true, gd_hole_live: true, gd_axes: false, gd_rings: false, gd_sel: false, gd_wins: false, gd_wsel: false, gd_more: [] };
    } else if (!S.ui_show && this.guides_at && performance.now() - this.guides_at < HOLE_LIVE_MS) S = { ...S, guides: this.guides_on };      // a number being slid: the guides as set; a numeral being nudged: none (guides_live)
    else if (!S.ui_show && !S.guides && S.ui_section === 1 && this.ring()?.on) S = { ...S, guides: true, gd_axes: false, gd_hole: false, gd_rings: false, gd_sel: true, gd_wins: false, gd_wsel: false, gd_more: [] };      // on the Rings tab the selected ring's guide shows with its handles, the guides off or on (Okay, 04:52: "Handles and guides show together at all times")
    this.guides_drawn = S.guides;      // the handles show when the guides do (draw_handles)
    const day = G.shows_day(S) ? G.day_hour(S) : null;       // an am · pm window follows the time shown, in steps of six minutes
    if (day !== this.day_drawn) { this.day_drawn = day; this.static_dirty = true; }
    if (!this.statik || this.static_dirty) {
      const t0 = performance.now();
      this.statik = G.build_static(S);
      this.static_dirty = false;
      if (this.nudge_sync) this.nudge_sync();      // Edit one numeral's list: what the rebuilt ring draws
      this.build_ms = performance.now() - t0;
      if (S.out_production) merges_of(this);      // the mask's note (#220): what the new build loses, once the dial is still
    }
    const items = G.scene(S, this.statik, S.t, true, S.ui_ring);
    this.items = items;
    const backdrop = S.out_production ? [1, 1, 1, 1] : S.c_backdrop;
    this.backdrop.setAttribute("fill", to_hex(backdrop));
    this.main.style.setProperty("--canvas-fill", to_hex(backdrop));      // the backdrop's colour, for a switch whose words show (6-preview.css)
    // what stands on the preview (Guides, Backdrop) is outline only, in black or white: whichever stands out more from
    // the backdrop. One of the two always has a contrast of 4.5 or more, so they can't be lost on any colour.
    const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4), L = 0.2126 * lin(backdrop[0]) + 0.7152 * lin(backdrop[1]) + 0.0722 * lin(backdrop[2]);
    this.main.classList.toggle("dark", 1.05 / (L + 0.05) > (L + 0.05) / 0.05);
    $("#app").classList.toggle("dark", this.main.classList.contains("dark"));      // the mark and title stand on the backdrop when the panel is away
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
      const stroke = item.stroke ? to_hex(item.stroke) + "/" + item.stroke[3] + "/" + item.px + (item.dots ? "/dots" : item.spaced ? "/spaced" : "") : "none";
      if (stroke !== slot.stroke) {
        slot.stroke = stroke;
        if (item.stroke) {
          node.setAttribute("stroke", to_hex(item.stroke));
          node.setAttribute("stroke-opacity", item.stroke[3]);
          node.setAttribute("stroke-width", item.px);
          node.setAttribute("vector-effect", "non-scaling-stroke");      // guides keep their width on screen
          node.setAttribute("pointer-events", "none");
          if (item.dots) { node.setAttribute("stroke-dasharray", `0 ${3 * item.px}`); node.setAttribute("stroke-linecap", "round"); }      // a dotted guide: round dots three widths apart (#272)
          else if (item.spaced) { node.setAttribute("stroke-dasharray", `0 ${6 * item.px}`); node.setAttribute("stroke-linecap", "round"); }      // a window's disc: dots twice as far apart as its middle's, told from the window's own solid edges (#485: "Dasheds get dotted")
          else { node.removeAttribute("stroke-dasharray"); node.removeAttribute("stroke-linecap"); }
        } else for (const a of ["stroke", "stroke-opacity", "stroke-width", "vector-effect", "pointer-events", "stroke-dasharray", "stroke-linecap"]) node.removeAttribute(a);
      }
      if (item.angle !== slot.angle) {             // hands turn about the pivot (R2: clockwise)
        slot.angle = item.angle;
        if (item.angle) node.setAttribute("transform", `rotate(${-item.angle})`); else node.removeAttribute("transform");
      }
      node.dataset.i = i;
    });
    this.draw_picked();
    this.draw_light(items);      // a ring of shine and the hands' bevels, before the shadows that fall over them (4.77)
    if (!this.S.ui_show) this.draw_shadows(items);      // show mode: the watch draws the hands' shadows
    this.place();
    const ring = this.ring();
    const font = G.has_text(ring) ? `   ·   ${ring.ps}` : "";
    this.status.textContent = `${ring.name}${font} · Ø ${this.in_unit(S.dial_d, 1)} ${this.unit()[0]} · build ${this.build_ms.toFixed(0)} ms`;
    while (G.NOTES.length) {                       // a font that is on its way isn't worth a line: it arrives in a moment
      const note = G.NOTES.shift(), ps = (/\(([^)]+)\) isn’t loaded|\(([^)]+)\) isn't loaded/.exec(note) || []).slice(1).find(Boolean);
      const coming = ps && this.catalog.has(ps) && (this.catalog.get(ps).file || this.catalog.get(ps).data);
      if (!coming) this.log(note);
    }
    this.autosave();
  },

  size() {
    const r = this.svg.getBoundingClientRect();
    if (!$("#app").classList.contains("showing")) return [r.width, r.height];
    const p = $(".panel").getBoundingClientRect();      // show mode: the canvas runs on under the column; what counts is the part left of it, measured where the column stands now, so the watch follows it while it slides
    return [clamp(p.left - r.left, 0, r.width), r.height];
  },

  fit_zoom() { const [w, h] = this.size(); return this.S.ui_show ? SHOW.fit_zoom(this, w, h) : Math.min(w, h) / G.page_mm(this.S); },      // show mode fits the case (Okay, 22 Oct 2026)      // the dial, never its case (4.69; Okay, 22:35: "Fit and previews care about the dial still, the bezel and strap secondary"; 4.66–4.68 made room for the case)

  /** put the dial at c, scaled to z; mirrored for toner transfer. y grows upward inside. */
  place() {
    const flip = this.S.out_mirror ? -1 : 1;
    const where = `translate(${this.c[0]} ${this.c[1]}) scale(${flip * this.z} ${-this.z})`;
    this.dial.setAttribute("transform", where);
    this.over.setAttribute("transform", where);
    if (this.handles) { this.handles.setAttribute("transform", where); this.handles_key = ""; }
    if (this.bezel_g) this.bezel_g.setAttribute("transform", where);
    if (this.watch_g) this.watch_g.setAttribute("transform", where);
  },

  fit() {
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    this.fitted = true;
    const to = { c: [w / 2, h / 2], z: this.fit_zoom() };
    this.z = to.z;
    this.c = to.c;
    this.place();
  },

  /** zoom by k so that the spot under view point p stays there. */
  zoom(k, p) {
    const lo = this.fit_zoom() / 4, hi = 400;
    k = clamp(this.z * k, lo, hi) / this.z;
    this.z *= k;
    this.c = [p[0] + (this.c[0] - p[0]) * k, p[1] + (this.c[1] - p[1]) * k];
    this.fitted = false;
    this.place();
  },

  resized() {
    this.pop_cover();
    const [w, h] = this.size();
    if (w < 1 || h < 1) return;
    if (this.fitted) this.fit();
    else if (this.view) { this.c = [this.c[0] + (w - this.view[0]) / 2, this.c[1] + (h - this.view[1]) / 2]; this.place(); }
    this.view = [w, h];
  },

  /** a point of the view → millimetres on the dial (y up). */
  to_mm(p) {
    const flip = this.S.out_mirror ? -1 : 1;
    return [(p[0] - this.c[0]) / this.z * flip, -(p[1] - this.c[1]) / this.z];
  },

  /** show mode's sun (the Show Case's, 21 Oct 2026): one finger or the pointer anywhere on the canvas — its direction from
   *  the middle is where the light comes from, and the nearer the middle, the higher the sun (85° there, 10° at 0.42 of
   *  the canvas's shorter side). The angle on screen is the watch's L; the dial's From is L + 90 (R2, clock angles) */
  sun_at(p) {
    const [w, h] = this.size(), dx = p[0] - w / 2, dy = p[1] - h / 2, reach = 0.42 * Math.min(w, h), TOP = 85, LOW = 10;
    if (reach <= 0) return;
    const L = Math.atan2(dy, dx) * 180 / Math.PI, rise = clamp(TOP - (TOP - LOW) * Math.hypot(dx, dy) / reach, LOW, TOP);
    this.set_value("global", "sh_from", Math.round(((L + 90) % 360 + 360) % 360));
    this.set_value("global", "sh_rise", Math.round(rise));
  },

  preview_events() {
    const at = (e) => { const r = this.svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    this.svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.hover(null);
      this.zoom(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), at(e));      // the wheel zooms, in both modes, no key needed (Okay, 23 Oct 2026: "Scroll to zoom in out, universal"); a trackpad's pinch comes as a wheel with ctrl, in small steps
    }, { passive: false });
    // fingers and the mouse, each tracked by its id (#152: one shared `down` let a second finger reset the pan and
    // both fingers drag it from different places — the jump at the start of a pinch). One pointer pans (or clicks,
    // if it hasn't moved); two pinch: the zoom follows their distance, the pan their midpoint.
    const pts = new Map();                         // pointerId → where it is now
    let down = null;                               // one pointer: {p, c, moved} · two: {d, mid, moved}
    const pair = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; };
    const restart = () => {                        // a pointer came or went: start again from where they all are now
      const moved = down ? down.moved : false;
      if (pts.size === 1) down = { p: [...pts.values()][0], c: this.c.slice(), moved };
      else if (pts.size >= 2) down = { ...pair(), moved: true };      // a pinch is never a click
      else down = null;
    };
    this.svg.addEventListener("pointerdown", (e) => { pts.set(e.pointerId, at(e)); this.svg.setPointerCapture(e.pointerId); if (pts.size === 1) down = null; restart(); if (pts.size === 1) { down.pan = e.button === 2; if (down.pan) down.moved = true; else if (this.S.ui_show) { down.moved = true; this.sun_at(at(e)); } } });      // the right button moves the drawing, in both modes; in show mode one finger or the pointer is the sun, never a click
    this.svg.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return e.pointerType === "mouse" ? this.hover(at(e), document.elementFromPoint(e.clientX, e.clientY)) : null;
      pts.set(e.pointerId, at(e));
      if (pts.size >= 2) {
        const now = pair();
        this.hover(null);
        this.c = [this.c[0] + now.mid[0] - down.mid[0], this.c[1] + now.mid[1] - down.mid[1]];      // pan by the midpoint…
        this.zoom(now.d / down.d, now.mid);                                                        // …zoom by the distance (zoom places)
        down.d = now.d; down.mid = now.mid;
        return;
      }
      const p = at(e);
      if (down.pan && !(e.buttons & 2)) { down.pan = false; return; }      // the button let go (outside the window too): the move ends
      if (down.pan) { this.fitted = false; this.c = [down.c[0] + p[0] - down.p[0], down.c[1] + p[1] - down.p[1]]; return this.place(); }
      if (this.S.ui_show) return this.sun_at(p);
      if (Math.hypot(p[0] - down.p[0], p[1] - down.p[1]) > 4) down.moved = true;
      // a finger alone doesn't move the dial: two do, with the pinch (Okay, 18 Oct 2026, notes 2: "on ipad and all touch
      // screens, you need two fingers to move as well. One finger drag sometimes confusing as reported"). The mouse drags.
      if (e.pointerType === "touch") return;
      if (down.moved) { this.hover(null); this.fitted = false; this.c = [down.c[0] + p[0] - down.p[0], down.c[1] + p[1] - down.p[1]]; this.place(); }
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      const click = pts.size === 1 && down && !down.moved && e.type === "pointerup";
      pts.delete(e.pointerId);
      if (click) this.clicked(at(e), document.elementFromPoint(e.clientX, e.clientY));
      restart();
    };
    this.svg.addEventListener("pointerup", up);
    this.svg.addEventListener("pointercancel", up);
    this.svg.addEventListener("pointerleave", () => this.hover(null));
    let pinch = 1;                                 // Safari reports a pinch as gesture events
    this.svg.addEventListener("gesturestart", (e) => { e.preventDefault(); pinch = 1; });
    this.svg.addEventListener("gesturechange", (e) => {      // a Mac trackpad in Safari; on a touch screen the two pointers above already pinch
      e.preventDefault();
      if (pts.size < 2) this.zoom(e.scale / pinch, at(e));
      pinch = e.scale;
    });
  },

  /** what is under a point of the preview: {kind, name, …} or null. kind: ring · hand · cap · date · plate.
   *  Used by the hover label and by the click, so they always agree. */
  piece_at(p, node) {
    const S = this.S, mm = this.to_mm(p), r = Math.hypot(mm[0], mm[1]);
    const item = node && node.dataset && node.dataset.i !== undefined ? this.items[+node.dataset.i] : null;
    const role = item ? item.role : null;
    if (role === "hand" || role === "mark") return { kind: "hand", hand: G.HANDS.indexOf(item.name), name: { hour: "Hour hand", minute: "Minute hand", second: "Seconds hand" }[item.name], path: item.path, angle: item.angle };
    if (role === "cap") return { kind: "cap", name: "Cap", path: item.path, angle: 0 };
    if (role && (role.startsWith("date") || role === "cutline")) {
      const x = this.statik.windows.find((b) => b.index === item.window), kind = G.WINDOW_KINDS[x.w.kind];
      return { kind: "date", window: x.index, name: { date: "Date window", day: "Day window", "am · pm": "AM · PM window", "moon phase": "Moon phase window" }[kind], path: x.window, angle: 0 };
    }
    let d = role === "ring" ? item.ring : null;
    if (!d) {                                      // the plate or the backdrop. Thin ticks are hard to hit, so:
      const slack = 4 / this.z;                    // of the rings whose zone (between their radii) is under the
      const angle = Math.atan2(mm[0], mm[1]) * 180 / Math.PI;      // point, take the one with the nearest mark
      let best = Infinity;
      for (const x of this.statik.rings) {         // top ring first, so the top one wins a tie
        const R = x.ring;
        const [lo, hi] = G.has_text(R) ? [R.r - R.size / 2, R.r + R.size / 2] : [R.r - (x.kind === "band" ? R.width : R.len), R.r];
        if (r < lo - slack || r > hi + slack) continue;
        const away = x.kind === "band" ? 1e6 : Math.min(...x.taken.map((a) => Math.abs(((angle - a + 540) % 360) - 180))) * Math.PI / 180 * r;
        if (away < best) { best = away; d = x; }
      }
    }
    if (!d) return r <= S.dial_d / 2 && !S.out_production ? { kind: "plate", name: "Plate", path: this.statik.plate, angle: 0 } : null;
    const piece = { kind: "ring", ring: S.rings.indexOf(d.ring), name: d.ring.name || G.kind_of(d.ring), path: d.path, angle: 0 };
    if (d.kind !== "band" && d.parts) {            // which numeral or mark? the nearest one's centre (marks too, #349)
      let best = Infinity;
      d.parts.forEach((part, k) => {
        const b = part && part.bounds();
        if (!b) return;
        const dist = Math.hypot((b[0] + b[2]) / 2 - mm[0], (b[1] + b[3]) / 2 - mm[1]);
        if (dist < best) { best = dist; piece.position = String(d.at[k]); }
      });
    }
    return piece;
  },

  /** a click on the preview opens the settings of what was clicked. */
  clicked(p, node) {
    const piece = this.piece_at(p, node), S = this.S;
    if (!piece) { this.unselected = true; this.render(); return this.words_unfold(); }      // a press on nothing: nothing selected — the selected ring's or window's guides, its handles and the picked numeral go (Okay, 23 Oct 2026: "DESELECT anything that is selected")
    this.unselected = false;
    const section = { ring: 1, hand: 2, cap: 2, date: 3, plate: 0 }[piece.kind], same = section === S.ui_section;
    // a ring: a first press chooses it; a press on the ring already chosen chooses the numeral or mark pressed (4.78,
    // #349; Okay's notes 2: "a double click or tap selects the ring, a second what was clicked")
    const second = piece.kind === "ring" && same && S.ui_ring === piece.ring && piece.position !== undefined;
    S.ui_section = section;
    if (piece.kind === "ring") { S.ui_ring = piece.ring; if (second) this.nudge_at = piece.position; }
    if (piece.kind === "hand") S.ui_hand = piece.hand;
    if (piece.kind === "date") S.ui_window = piece.window;
    if (same) { this.fill_ring_list(); this.sync_rows(); } else this.show_section();
    if (second) {                                  // a numeral or mark picked for Nudge: its pane opens, since it starts folded (#270)
      const nudge = this.rows.find((r) => r.fold && r.row.text === "Edit one numeral");
      if (nudge && this.is_folded(nudge)) this.fold(nudge, false);
    }
    this.render();
  },

  /** the pointer rests on something that can be edited: outline it, and say its name beside the pointer. */
  hover(p, node) {
    const piece = p && !this.S.ui_show ? this.piece_at(p, node) : null;      // show mode: no outlines, no names
    this.tip.hidden = !piece;
    for (const line of this.glow) line.setAttribute("d", piece ? piece.path.svg(4) : "");
    if (!piece) return;
    for (const line of this.glow) { if (piece.angle) line.setAttribute("transform", `rotate(${-piece.angle})`); else line.removeAttribute("transform"); }
    this.tip.firstChild.textContent = piece.name;
    // the label sits above the pointer, its arrow's tip 10 points from it; under the pointer near the top edge.
    // Near a side edge the label stops at the edge and the arrow slides along it, so it still points at the pointer.
    const [w] = this.size(), box = this.tip.getBoundingClientRect(), half = box.width / 2, gap = 10, edge = 6;
    const below = p[1] - gap - box.height - 8 < edge;
    const x = clamp(p[0], edge + half, Math.max(edge + half, w - edge - half));
    this.tip.classList.toggle("below", below);
    this.tip.style.left = `${x - half}px`;
    this.tip.style.top = `${below ? p[1] + gap + 8 : p[1] - gap - 8 - box.height}px`;
    this.tip.style.setProperty("--arrow", `${clamp(p[0] - (x - half), 12, box.width - 12)}px`);
  },
};
