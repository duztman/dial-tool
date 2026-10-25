// hands.js — the Hands tab: the hand tabs and All hands line, a hand's detail box with its grips, and the hand lit on
// the preview while its row is under the pointer.

import * as G from "./geometry.js";
import { BEVEL, hand_detail, hand_part } from "./icons.js";
import { HANDLE_AXIS, HANDLE_REACH, clamp, el, svg_el } from "./ui.js";
import { ROWS, chevron_box } from "./rows.js";

export const HANDS = {
  /** the light on the dial (4.77): wherever shadows
   *  are drawn, each hand's bevel (BEVEL) — its two long halves lighter and darker by where the light comes from.
   *  Drawn into groups kept by name, just under the shadows that fall on the same surfaces. Preview only (R5, R26). */
  draw_light(items) {
    const S = this.S;
    if (!this.light_parts) this.light_parts = new Map();
    const parts = this.light_parts, used = new Set(), f = (v) => v.toFixed(4);
    const part = (name, tag, parent, before = null) => {
      let n = parts.get(name);
      if (!n) { n = svg_el(tag); parts.set(name, n); }
      if (n.parentNode !== parent || (before && n.nextSibling !== before)) parent.insertBefore(n, before);
      used.add(name);
      return n;
    };
    const finish = () => { for (const [name, n] of parts) if (!used.has(name)) { n.remove(); parts.delete(name); } };
    // how much light there is to shade by: the shadows' darkness while they are on; off, the sun still has a direction,
    // so a hand with its Bevel ticked keeps it (Okay, 24 Oct 2026, #531: "bevels are lost on this current version on tool side. Bring them back")
    const on = S.sh_on ? Math.min(S.sh_dark / 25, 2) : 1;
    if (S.out_production || !(on > 0)) return finish();
    if (!this.light_defs) { this.light_defs = svg_el("defs"); this.svg.prepend(this.light_defs); }
    const from = S.sh_from, nodes = items.map((_, i) => this.slots[i].node);
    // each hand's bevel: its right and left halves (as it points) lighter and darker by where the light comes from
    items.forEach((item, i) => {
      const own = S["ha_" + item.name];
      if (item.role !== "hand" || G.HAND_SHAPES[own?.shape] === "disc" || !(own?.bevel && +S.sh_bevel > 0)) return;      // a disc hand is flat; a hand without its Bevel (or at Bevels 0) gets only the showcase's shine
      const side = Math.sin((from - item.angle) * Math.PI / 180);      // + : the light comes from the hand's right
      const key = "bevel-" + item.name, clip = part(key + "/clip", "clipPath", this.light_defs), shape = part(key + "/clip/hand", "path", clip);
      clip.id = "bevel-clip-" + item.name; shape.setAttribute("d", this.slots[i].d);
      let n = i + 1; while (items[n]?.role === "mark" && items[n].name === item.name) n++;
      const g = part(key, "g", this.dial, nodes[n] || null);
      g.setAttribute("transform", `rotate(${f(-item.angle)})`); g.setAttribute("pointer-events", "none");
      const inner = part(key + "/in", "g", g);
      inner.setAttribute("clip-path", `url(#${clip.id})`);
      const half = (name, x, colour, k) => { const r = part(`${key}/${name}`, "rect", inner); r.setAttribute("x", f(x)); r.setAttribute("y", "-50"); r.setAttribute("width", "50"); r.setAttribute("height", "100"); r.setAttribute("fill", colour); r.setAttribute("fill-opacity", f(k)); };
      const amount = S["ha_" + item.name]?.bevel ? clamp(+S.sh_bevel || 0, 0, 100) / 100 : 0;      // Shadows → Bevels % (4.79): none to start; a hand's own Bevel tick off: none on it
      const lit = BEVEL.light * Math.abs(side) * Math.min(on, 1) * amount, dark = BEVEL.dark * Math.abs(side) * Math.min(on, 1) * amount;
      half("right", 0, side > 0 ? "#fff" : "#000", side > 0 ? lit : dark);
      half("left", -50, side > 0 ? "#000" : "#fff", side > 0 ? dark : lit);
    });
    finish();
  },

  /** Hands, on top and always in view: Hour · Minute · Seconds, as tabs for the panes below. */
  row_hand_tabs(wrap, out) {
    wrap.className = "tabsbar";
    const tabs = el("span", { className: "segs", role: "tablist", ariaLabel: "Which hand" });
    ["Hour", "Minute", "Seconds"].forEach((name, i) => {
      const b = el("button", { type: "button", className: "tab", id: "hand-tab-" + i, textContent: name, onclick: () => this.set_value("global", "ui_hand", i) });
      b.setAttribute("role", "tab");
      tabs.append(b);
    });
    wrap.append(tabs);
    out.refresh = (S) => [...tabs.children].forEach((b, i) => { b.classList.toggle("on", i === S.ui_hand); b.setAttribute("aria-selected", String(i === S.ui_hand)); });
  },

  /** Hands, always in view, one line (Okay, 12 Oct 2026): the name, a tick to show the hands, how they move. */
  row_hands_bar(wrap, out) {
    wrap.className = "handsbar";
    const tick = el("input", { type: "checkbox", id: "global-ha-on-Show-hands" });
    tick.onchange = () => this.set_value("global", "ha_on", tick.checked);
    const motion = el("select", { id: "global-ha-beat-Motion", title: "How the seconds hand moves", ariaLabel: "Motion" });
    G.BEATS.forEach((b, i) => motion.append(el("option", { value: i, textContent: b[0] })));
    motion.onchange = () => this.set_value("global", "ha_beat", +motion.value);
    const motion_box = chevron_box(motion);
    wrap.append(el("h2", { textContent: "All hands" }), el("label", { className: "check", htmlFor: tick.id }, tick, " Show hands"), motion_box.box);
    out.refresh = (S) => { tick.checked = Boolean(S.ha_on); motion.value = S.ha_beat; motion_box.sync(); };
  },

  row_hand_detail(wrap, out) {
    wrap.className = "detail";
    wrap.id = "hand-detail";
    let drawn = "";
    // its handles (#345): an overlay of its own, kept when the drawing under it is replaced
    const grips = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    grips.setAttribute("class", "grips");
    // the shape's name under its picture (4.79; Okay, 19 Oct 2026: on an iPad or a phone a tile's name — its title —
    // never shows, so the shapes went by guesses: "leaf", "diamond")
    const named = el("span", { className: "handname", id: "hand-shape-name" });
    this.hand_grips = grips;
    this.hand_grip_events(wrap, grips);
    out.refresh = (T) => {
      const S = this.S, cap = G.cap_shows(S) && S.ui_hand === G.top_hand(S) ? { d: +S.ha_cap } : null;      // the cap goes with the hand it is drawn on (cap_rows)
      const now = hand_detail(T, cap);
      if (now !== drawn) {
        drawn = now;
        // the drawings under the handles replaced, the handles' own layer kept in place (moving it would drop a drag's hold on the pointer)
        for (const old of [...wrap.children]) if (old !== grips && old !== named) old.remove();
        if (!grips.parentElement) wrap.append(grips);
        grips.insertAdjacentHTML("beforebegin", now);
        if (named.parentElement !== wrap) wrap.append(named);
        const shape = G.HAND_SHAPES[T.shape] || "baton";
        named.textContent = shape === "file" ? "Your SVG" : shape[0].toUpperCase() + shape.slice(1);
      }
      this.hand_lit_draw();
      grips_soon();
    };
    // drawn once the panel has settled — the rows round the box show or hide after it, and its size follows them
    let soon = 0;
    const grips_soon = () => { if (!soon) soon = requestAnimationFrame(() => { soon = 0; this.hand_grips_draw(); }); };
    this.watchers.push(new ResizeObserver(grips_soon));      // disconnected with the tool (close)
    this.watchers.at(-1).observe(wrap);
  },

  /** the hand's handles on its picture (#345; Okay's notes 2: "draggable dots at the extremes of what can be edited, a
   *  dotted bounding box like Photoshop's transform; one side's width drag edits the other symmetrically"): a dotted
   *  box round the hand and a square at the middle of each of its sides — at the tip the length, at the other end the
   *  tail, at the two edges the width (a disc hand's: its Ø), both edges moving together. In the selected guide's
   *  colour, as the ring handles (4.65). Dragged, a handle sets its number as the row does (set_value), its part lit. */
  hand_grips_draw() {
    const g = this.hand_grips, box = g?.parentElement, h = this.hand();
    if (!box || !h) return;
    const pic = [...box.querySelectorAll("svg:not(.grips)")].find((v) => v.getBoundingClientRect().width > 0), hand = pic?.querySelector("path");
    if (!hand) return g.replaceChildren();
    const B = g.getBoundingClientRect(), lying = pic.classList.contains("lying"), M = hand.getScreenCTM();      // measured from the overlay itself: it stands inside the box's border (from the box, 4.71–4.79 put every handle a point off)
    // the box round the hand without its hub (#370): a hub wider than the hand would pull the width handles off its edges
    const b = G.hand_shape({ ...h, hub: 0 }).bounds() || [0, 0, 0, 0];
    const corners = [[b[0], -b[3]], [b[2], -b[1]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(M));
    const x0 = Math.min(...corners.map((p) => p.x)) - B.left, x1 = Math.max(...corners.map((p) => p.x)) - B.left;
    const y0 = Math.min(...corners.map((p) => p.y)) - B.top, y1 = Math.max(...corners.map((p) => p.y)) - B.top, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const disc = G.HAND_SHAPES[h.shape] === "disc";
    // where each stands: upright the tip is up; lying (a wide box) the tip is to the right
    // the width pair stands where the hand is widest, when its shape has such a place (#368): found through the
    // drawing's own matrix, so it sits on the outline whatever the picture's scale or way round
    const widest = G.hand_widest(h), wp = widest && new DOMPoint(0, -widest.at).matrixTransform(hand.getScreenCTM());
    const wx = wp ? wp.x - B.left : mx, wy = wp ? wp.y - B.top : my;
    const at = lying ? { len: [x1, my], tail: [x0, my], w1: [wx, y0], w2: [wx, y1] } : { len: [mx, y0], tail: [mx, y1], w1: [x0, wy], w2: [x1, wy] };
    const along = widest ? { feature_at: "where it is widest", bulge: "where it bulges", tip: "where its point starts" }[widest.key] : "";
    const tips = { len: "Length: drag", tail: "Tail: drag", w: disc ? "Disc Ø: drag, both sides together" : "Width: drag across, both sides together" + (along ? ` · along: ${along}` : "") };
    // a side's reach, unseen: pointed at, it lights that side (the drawn squares and the dotted box are gone, #411:
    // "Thick selection indicators faulty at times. Abort this type"); its cursor says which way it drags
    const across = (key) => (key === "w") !== lying;      // a width drags across the hand, a length or tail along it
    const sq = (name, [x, y], key) => `<g class="handle ${across(key) ? "ew" : "ns"}" data-grip="${name}" data-tip="${tips[key]}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle class="reach" r="${HANDLE_REACH}"/></g>`;
    g.style.setProperty("--handle", G.GUIDE_COLOURS[this.S.gd_k_sel] || G.GUIDE_COLOURS[0]);
    g.innerHTML = sq("len", at.len, "len") + (disc ? "" : sq("tail", at.tail, "tail")) + sq("w1", at.w1, "w") + sq("w2", at.w2, "w");
  },

  /** a handle on the hand's picture dragged: the pointer's travel, in mm at the picture's scale when the drag began,
   *  added to the number it had (so it works the same for every shape, whatever its outline does at that edge). The
   *  picture keeps fitting the hand as it changes, so a handle drifts from the pointer as the hand grows a lot; kept so
   *  the whole hand stays in its box (a picture held at its scale let the tip leave the box after a millimetre). */
  hand_grip_events(box, g) {
    const ROW = (key) => ROWS.Hands.find((r) => r.key === key && r.kind === "num");
    g.addEventListener("pointerdown", (e) => {
      const grip = e.target.closest("[data-grip]");
      if (!grip) return;
      e.preventDefault(); e.stopPropagation();
      const h = this.hand(), disc = G.HAND_SHAPES[h.shape] === "disc", name = grip.dataset.grip;
      const key = name === "len" ? "len" : name === "tail" ? "tail" : disc ? "disc_d" : "w";
      const pic = [...box.querySelectorAll("svg:not(.grips)")];
      const shown = pic.find((v) => v.getBoundingClientRect().width > 0), scale = shown.getScreenCTM().a;      // screen points per mm
      // a width handle on a shape with a widest place (#368) waits to see which way it is first dragged: across, the
      // width; along the hand, that place (an axis held for the rest of the drag, so the one does not nudge the other)
      const widest = (name === "w1" || name === "w2") && G.hand_widest(h);
      this.hand_drag = { key, name, row: ROW(key), v0: +h[key], x: e.clientX, y: e.clientY, scale, lying: shown.classList.contains("lying"), widest, axis: widest ? null : "across" };
      g.setPointerCapture(e.pointerId);
      box.classList.add("dragging");
      this.hand_light(this.hand_drag.row);
      this.tag_hide();
    });
    g.addEventListener("pointermove", (e) => {
      const d = this.hand_drag;
      if (!d) return;
      const dx = (e.clientX - d.x) / d.scale, dy = (e.clientY - d.y) / d.scale;
      if (!d.axis) {
        const across = Math.abs(d.lying ? e.clientY - d.y : e.clientX - d.x), up = Math.abs(d.lying ? e.clientX - d.x : e.clientY - d.y);
        if (Math.max(across, up) < HANDLE_AXIS) return;      // not yet far enough to tell
        d.axis = across >= up ? "across" : "along";
        if (d.axis === "along") {
          const R = ROWS.Hands.find((r) => r.key === d.widest.key && r.kind === "num" && (!r.show || r.show(this.hand())));
          Object.assign(d, { key: d.widest.key, row: R, v0: +this.hand()[d.widest.key] });
          this.hand_light(R);
        }
      }
      if (d.axis === "along") {      // up the hand in mm, turned into the number that moves the widest place
        const v = d.v0 + (d.lying ? dx : -dy) * d.widest.per_mm, R = d.row, step = R.step;
        this.set_value("hand", d.key, +clamp(Math.round(v / step) * step, R.lo, R.hi).toFixed(4));
        return;
      }
      // how far the handle's own side moved outwards: the tip away from the centre, the tail the other way, an edge out
      const out = { len: d.lying ? dx : -dy, tail: d.lying ? -dx : dy, w1: d.lying ? -dy : -dx, w2: d.lying ? dy : dx }[d.name];
      const v = d.v0 + (d.key === "w" || d.key === "disc_d" ? 2 * out : out);      // both edges move: the width grows twice the travel
      const R = d.row, step = R.step;
      this.set_value("hand", d.key, +clamp(Math.round(v / step) * step, R.lo, R.hi).toFixed(4));
    });
    const end = () => {
      if (!this.hand_drag) return;
      this.hand_drag = null; box.classList.remove("dragging");
      if (!matchMedia("(hover: hover)").matches || !box.matches(":hover")) this.hand_light(null);      // a finger's :hover sticks (4.79)
    };
    g.addEventListener("pointerup", end);
    g.addEventListener("pointercancel", end);
    // pointed at, a side lights what it changes (#411); a drag keeps its own light
    const row_of = (grip) => { const h = this.hand(), n = grip.dataset.grip; return ROW(n === "len" ? "len" : n === "tail" ? "tail" : G.HAND_SHAPES[h.shape] === "disc" ? "disc_d" : "w"); };
    g.addEventListener("pointerover", (e) => { const grip = e.target.closest("[data-grip]"); if (grip && !this.hand_drag) this.hand_light(row_of(grip)); });
    g.addEventListener("pointerout", (e) => { const grip = e.target.closest("[data-grip]"); if (grip && !this.hand_drag && !grip.contains(e.relatedTarget)) this.hand_light(null); });
  },

  /** light a hand number's part on the hand's picture, or none (#329): while its row is pointed at, holds the focus,
   *  has its controller open, or its side on the picture is pointed at or dragged. What lights is the hand's outline
   *  where that number moves it — its active sides, a line in the selected guide's colour, not a filled area (Okay,
   *  19 Oct 2026, #411: "Find 'highlighting active sides' kind of simple solution"). */
  hand_light(row) {
    if (row === this.lit_row) return;
    this.lit_row = row;
    this.hand_lit_draw();
  },

  hand_lit_draw() {
    const box = document.querySelector("#hand-detail");
    if (!box) return;
    const row = this.lit_row, h = this.hand(), key = row && h ? `${row.key}/${JSON.stringify(h)}` : "";
    if (key !== this.lit_key) {      // worked out again only when the number or the hand changed
      const part = key ? hand_part(h, row) : null;
      this.lit_key = key; this.lit_d = part ? part.svg(3, true) : "";
    }
    const d = this.lit_d;
    box.style.setProperty("--lit", G.GUIDE_COLOURS[this.S.gd_k_sel] || G.GUIDE_COLOURS[0]);
    for (const p of box.querySelectorAll(".litarea")) { if (d) p.setAttribute("d", d); else p.removeAttribute("d"); }      // the outline shows only inside the part that moves: its sides (#411)
  },
};
