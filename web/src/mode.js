// mode.js — the change between the dial side and show mode (#509): the panel slides out and the show column in, the
// shenanigans switches, the column tinted from the backdrop. show.js draws the watch; this is the window's side of it.

import * as G from "./geometry.js";

import * as SHOW from "./show.js";      // show mode: the watch round the dial, its tabs, its export (#509)
import { $, el } from "./ui.js";
import { SECTIONS, SHOW_SECTIONS, seg } from "./rows.js";

export const MODE = {
  /** the iris switch opened (its words, ACTIVATE SHOWCASE, slid out to its left) or shut */
  iris_open(on) {
    if (!this.iris_box) return;
    this.iris_box.setAttribute("aria-expanded", String(on));
    this.iris_go.tabIndex = on ? 0 : -1;
  },

  /** the dial alone, or back (Okay, 15 Oct 2026, 04:02: "it immediately triggers a sliding away action of the left
   *  white column. Bottom bar stays. Backdrop and shadow stop short. Logo and dial tool and version number is what
   *  remains on top. In sync with panels sliding away dial is centered, enlarged to fit while enlarging. Use easing").
   *  The stylesheet does the moving: #app.away turns --away from 0 to 1 (eased), and the panel's column, the panel and
   *  what stands on the preview follow it. The preview grows with its column; each step of that is a resize, and a
   *  fitted dial re-fits on every one, so the dial grows and centres in step with the slide. Not part of a dial. */
  /** show mode, or back (#509; Okay, 22 Oct 2026: "left side slides out, right side slides in"): the panel slides away
   *  to the left, comes back on the right with the show tabs and the backdrop's tint; the dial's own drawing gives way
   *  to the watch (show.js); Fit fits the case. The bar stays. Nothing of the dial changes; ui_show remembers the mode. */
  show_mode(on, instant = false) {
    const app = $("#app");
    if (on === Boolean(this.S.ui_show)) return;
    this.hover(null);
    if (this.pop && this.pop.at) this.pop_close();
    if (this.bio_open) this.bio_open(false);
    this.iris_open(false);
    if (this.ground_open) this.ground_open(false);
    const leaving = instant || $("#app").classList.contains("away") ? null : this.panel_copy();      // the panel as it is now, before its tabs change
    this.S.ui_show = on;
    this.iris_button.setAttribute("aria-pressed", String(on));
    const first = SECTIONS.indexOf("Watch");      // each mode remembers its tab; show mode opens on Watch to start (Okay, 23 Oct 2026: "Watch tab comes active on show case")
    if (on) { this.S.ui_edit_section = this.S.ui_section; this.S.ui_section = SHOW_SECTIONS.includes(SECTIONS[this.S.ui_show_section]) ? this.S.ui_show_section : first; }
    else { this.S.ui_show_section = this.S.ui_section; this.S.ui_section = SHOW_SECTIONS.includes(SECTIONS[this.S.ui_edit_section]) ? 0 : this.S.ui_edit_section; }
    [...this.tabs.children].forEach((b) => { b.hidden = SHOW_SECTIONS.includes(b.dataset.tab) !== on; });
    if (instant) {      // a session that ended in show mode opens there: no movement
      app.classList.toggle("showing", on); this.layers(on); this.show_section(); this.watch_key = null; this.fit(); this.render();
      return;
    }
    this.swoop(on, leaving);
  },

  /** a still copy of the panel as it stands, over it: what slides away while the real panel comes in on the other side.
   *  Its frame carries the mode it was in (.showing or not), so it keeps that mode's look while the app changes. No ids */
  panel_copy() {
    const panel = $(".panel"), r = panel.getBoundingClientRect(), copy = panel.cloneNode(true), showing = $("#app").classList.contains("showing");
    copy.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id")); copy.removeAttribute("id");
    Object.assign(copy.style, { width: "100%", height: "100%", translate: "none" });
    const frame = el("div", { className: "panelcopy" + (showing ? " showing" : "") }, copy);
    Object.assign(frame.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", background: showing ? "" : getComputedStyle(document.body).backgroundColor });
    document.body.append(frame);
    return frame;
  },

  /** the drawing's layers in a mode: show mode the watch alone; the dial side its dial, case and overlays */
  layers(on) {
    this.watch_g.style.opacity = ""; this.watch_g.classList.remove("fading");
    for (const g of [this.dial, this.bezel_g, this.over]) g.style.display = on ? "none" : "";
    if (!on) { this.watch_g.replaceChildren(); this.watch_key = null; }
  },

  /** into show mode or out, in one movement (Okay, 23 Oct 2026: "The watch knows its final size and destination, so no
   *  interim zoom size changes. one zoom and done. Right column moves in when the left has left halfway. smoother,
   *  slower. one fail swoop"; "Case fades in fast after panel transition complete. During panel transition no load on
   *  the system"): the panel as it was — a still copy of it — slides away; when it is halfway gone the panel of the other
   *  mode starts in from its own side. All the while the dial alone (the light drawing) moves and zooms once, eased, from
   *  where it stands to where the watch will stand; then the watch is drawn and fades in fast. Going back, the watch fades
   *  out fast first. Both slides take --show-time; the fade --watch-fade */
  swoop(on, leaving) {
    const app = $("#app"), css = getComputedStyle(app), T = parseFloat(css.getPropertyValue("--show-time")) || 1000, F = parseFloat(css.getPropertyValue("--watch-fade")) || 250, ease = css.getPropertyValue("--view-ease").trim() || "ease-in-out";
    const svg0 = this.svg.getBoundingClientRect();
    const from = { x: svg0.left + this.c[0], y: svg0.top + this.c[1], z: this.z };      // where the drawing stands, on the screen
    if (leaving) {      // the copy slides away to its own side, then goes
      const r = leaving.getBoundingClientRect();
      leaving.animate([{ transform: "translateX(0)" }, { transform: `translateX(${on ? -r.right : innerWidth - r.left}px)` }], { duration: T, easing: ease, fill: "forwards" }).finished.then(() => leaving.remove());
    }
    // the other mode's panel, waiting off its side: no slide to get there
    app.classList.add("snap", "away"); app.classList.remove("alone"); app.classList.toggle("showing", on);      // a mode change brings the bar back
    { const r = this.svg.getBoundingClientRect(); this.c = [from.x - r.left, from.y - r.top]; this.place(); }      // the canvas changed its edges: the drawing stays where it stood on the screen
    this.show_section(); this.fitted = false; this.sliding = true;
    if (!on) this.tint_panel();      // the dial side's own colours again (the still copy keeps the tint as it slides away)
    this.swoop_in = on;
    this.dial.style.display = ""; this.bezel_g.style.display = ""; this.over.style.display = "none";      // the dial moves, its overlays wait
    if (on) { this.watch_g.replaceChildren(); this.watch_key = null; }
    else { this.watch_g.classList.add("fading"); this.watch_g.style.opacity = "0"; setTimeout(() => { this.watch_g.replaceChildren(); this.watch_key = null; this.watch_g.style.opacity = ""; this.watch_g.classList.remove("fading"); }, F); }      // the watch goes first, fast
    this.render();
    requestAnimationFrame(() => {
      app.classList.remove("snap");
      const svg1 = this.svg.getBoundingClientRect(), pw = $(".panel").getBoundingClientRect().width, w = svg1.width - pw, left = on ? svg1.left : svg1.left + pw;
      const to = { x: left + w / 2, y: svg1.top + svg1.height / 2, z: on ? SHOW.fit_zoom(this, w, svg1.height) : Math.min(w, svg1.height) / G.page_mm(this.S) };      // where it ends, known before it is drawn
      setTimeout(() => {      // in when the other is halfway out; the swoop alone moves the drawing: not dial_alone(), whose transitionend would fit the view a frame before the swoop ends and snap it (#542e; #511's flash, to verify)
        app.classList.add("swooping"); this.fitted = false;
        this.eye_button.setAttribute("aria-pressed", "false");
        app.style.setProperty("--title-end", this.title.getBoundingClientRect().right.toFixed(1) + "px");
        app.style.setProperty("--bar-h", $(".bar").offsetHeight + "px");
        app.classList.remove("away");
      }, T / 2);
      const t0 = performance.now(), D = T * 1.5, io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / D), e = io(t), r = this.svg.getBoundingClientRect();
        this.z = from.z * (to.z / from.z) ** e;      // one zoom: the scale eased on its logarithm, so it grows evenly
        this.c = [from.x + (to.x - from.x) * e - r.left, from.y + (to.y - from.y) * e - r.top];
        this.place();
        if (t < 1) return requestAnimationFrame(step);
        app.classList.remove("swooping"); this.sliding = false; this.fit();
        if (!on) { this.over.style.display = ""; this.render(); return; }
        this.swoop_in = false; this.watch_key = null; this.watch_g.style.opacity = "0"; this.frame();      // now the watch, once, in its place…
        requestAnimationFrame(() => { this.watch_g.classList.add("fading"); this.watch_g.style.opacity = "1"; setTimeout(() => this.layers(true), F); });      // …fading in fast over the dial
      };
      requestAnimationFrame(step);
    });
  },

  /** show mode's Shenanigans (Okay, 23 Oct 2026): at the column's foot, always in view, on the top's darker ground — the
   *  costly or showy layers on and off in one place. Only shortcuts: the same keys as their rows and switches elsewhere,
   *  which keep every other setting of theirs. Hidden on the dial side (R16). Laid out after his drawing (24 Oct 2026,
   *  #525; his drawings of 19:04): Shadows · Blurs, Flare · Bevels, Gradients, two to a line, each its name and a toggle; All alone
   *  in the third column behind a white line, turning the five on or off together */
  shenanigans_box() {
    const KEYS = ["sh_on", "sh_blur", "w_bevels", "w_flare_on", "w_gradients"], pill = (key, text, o = {}) => this.build_row({ ...seg(key, text, ["On", "Off"], { bool: true, ...o }), scope: "global" });
    const all = pill("w_flare_on", "All", { get: (T) => KEYS.every((k) => T[k]), put: (tool, v) => KEYS.forEach((k) => tool.set_value("global", k, v)) });
    this.shen_rows = [...[["sh_on", "Shadows"], ["sh_blur", "Blurs"], ["w_flare_on", "Flare"], ["w_bevels", "Bevels"], ["w_gradients", "Gradients"]].map(([key, text]) => pill(key, text)), all];      // Gradients: every gradient in show mode (Okay, 24 Oct 2026: "Both")
    return el("div", { className: "shenanigans" }, el("div", { className: "shenticks" }, ...this.shen_rows.map((r) => r.el)));
  },

  /** the panel's colours from the backdrop in show mode (show.js tint_panel; #505) */
  tint_panel() {
    const key = this.S.ui_show ? this.S.c_backdrop.join(",") + (this.S.ui_grey_panel ? " grey" : "") : "";
    if (key === this.tint_key) return;
    this.tint_key = key;
    SHOW.tint_panel($(".panel"), this.S.ui_show, this.S.c_backdrop, this.S.ui_grey_panel);
    for (const [to, from] of [["--iris-fill", "--column-solid"], ["--iris-ink", "--ink"]]) {      // the iris switch in the column's colours while in show mode (Okay, 23 Oct 2026)
      if (this.S.ui_show) this.iris_box.style.setProperty(to, $(".panel").style.getPropertyValue(from)); else this.iris_box.style.removeProperty(to);
    }
    if (this.grey_button) { const grey = Boolean(this.S.ui_grey_panel); this.grey_button.setAttribute("aria-pressed", String(grey)); this.grey_button.title = this.grey_button.ariaLabel = grey ? "The panel in the backdrop's colour" : "The panel in greys"; }
  },
};
