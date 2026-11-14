// THE LOGO (#609; Okay, 14 Nov 2026: "Make background into "logo", upload svg. only accept one color solid svgs. treat them as
// normal, stroke, weight size etc. placement is with mouse, limited to within dial and scale is possible"; "One logo, gets it's
// own ring, the drawing can be filled, stroked, treat it as a shape as others"; "the logo is straight only").
//
// What this file does: reads his SVG into ONE shape (read_logo), and gives the window its row (Dial › Shape › Logo), the ring
// that shows it and the drag on the dial. The drawing is kept in S.logo — the settings file and the browser's store, not the
// link — and drawn by a markers ring of one mark whose shape is "file" (geometry.js logo_ring), so it has what every ring has:
// a colour, a Finish, a Stroke and its weight, an ink height, a place in the list.
//
// The reader is the first place of #173's one mechanism (R34): a marker's, a hand's and a moon's SVG take this same door.
import * as G from "./geometry.js";
import { el } from "./ui.js";

const SHAPES = "path,rect,circle,ellipse,polygon,polyline,line";
/** an SVG shape element → its outline as path text, in its own coordinates */
function outline(e) {
  const n = (k) => parseFloat(e.getAttribute(k)) || 0, t = e.tagName.toLowerCase();
  if (t === "path") return e.getAttribute("d") || "";
  if (t === "rect") { const [x, y, w, h] = [n("x"), n("y"), n("width"), n("height")]; let rx = n("rx") || n("ry"), ry = n("ry") || n("rx"); rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
    return rx > 0 ? `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z` : `M${x} ${y}H${x + w}V${y + h}H${x}Z`; }
  if (t === "circle" || t === "ellipse") { const rx = t === "circle" ? n("r") : n("rx"), ry = t === "circle" ? n("r") : n("ry"), cx = n("cx"), cy = n("cy");
    return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`; }
  if (t === "line") return `M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`;
  const pts = (e.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number).filter((v) => !Number.isNaN(v));
  let d = ""; for (let i = 0; i + 1 < pts.length; i += 2) d += `${i ? "L" : "M"}${pts[i]} ${pts[i + 1]}`;
  return d && t === "polygon" ? d + "Z" : d;
}
const colour_of = (text) => { const m = /rgba?\(([^)]+)\)/.exec(text || ""); if (!m) return null; const v = m[1].split(/[,\s/]+/).map(Number); return v.length > 3 && v[3] === 0 ? null : v.slice(0, 3).join(","); };

/** READ AN SVG INTO ONE SHAPE. Takes: paths and the basic shapes, with their transforms, groups and styles; a filled shape as
 *  its fill, a line as the outline of its stroke at its own weight. Refuses, saying which: more than one colour, a gradient or
 *  a pattern, a picture, live text (outline it first), nothing drawn. Clipping and masks are not applied (R23).
 *  → { cmds, wide } (height 1, middle at 0 · 0, y up) or { refused: "why" } */
export function read_logo(text) {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml"), root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return { refused: "this is not an SVG file" };
  const count = (q) => root.querySelectorAll(q).length;
  if (count("image")) return { refused: "it holds a picture (pixels): a logo is one flat shape" };
  if (count("text")) return { refused: "it holds live text: turn the text into outlines first" };
  const host = el("div"); host.style.cssText = "position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden"      // off the page, not hidden: a hidden shape reads as one the file hides;
  const live = document.importNode(root, true); host.append(live); document.body.append(host);
  try {
    const colours = new Set(), parts = [];
    for (const e of live.querySelectorAll(SHAPES)) {
      if (e.closest("defs,clipPath,mask,pattern,symbol,marker")) continue;
      const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue;
      if (/url\(/.test(cs.fill) && cs.fill !== "none" || /url\(/.test(cs.stroke)) return { refused: "it holds a gradient or a pattern: a logo is one solid colour" };
      const fill = parseFloat(cs.fillOpacity) === 0 ? null : colour_of(cs.fill), stroke = parseFloat(cs.strokeOpacity) === 0 ? null : colour_of(cs.stroke), weight = parseFloat(cs.strokeWidth) || 0;
      const open = ["line", "polyline"].includes(e.tagName.toLowerCase()), d = outline(e); if (!d) continue;
      const m = e.getCTM(), M = m ? [m.a, m.b, m.c, m.d, m.e, m.f] : null, grown = M ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1;
      let shape = null;
      if (fill && !open) { shape = G.Path.from_svg(d, M); colours.add(fill); }
      if (stroke && weight > 0) { const line = G.Path.from_svg(d, M).expandStroke(weight * grown); shape = shape ? shape.union(line) : line; colours.add(stroke); }
      if (shape && !G.empty(shape)) parts.push(shape);
    }
    if (colours.size > 1) return { refused: `it holds ${colours.size} colours: a logo is one solid colour` };
    if (!parts.length) return { refused: "nothing is drawn in it" };
    const all = parts.length > 1 ? G.merge(parts) : parts[0], b = all.bounds(); if (!b || b[3] - b[1] <= 0 || b[2] - b[0] <= 0) return { refused: "nothing is drawn in it" };
    const h = b[3] - b[1], cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, tidy = (v) => Math.round(v * 1e5) / 1e5;
    all.translate(-cx, -cy).scale(1 / h, -1 / h);      // SVG's y runs down, the dial's up
    return { cmds: all.d.map((c) => [c[0], ...c.slice(1).map(tidy)]), wide: tidy((b[2] - b[0]) / h) };
  } finally { host.remove(); }
}

export const LOGO = {
  /** take a file's text as the logo: its drawing kept, its ring made if there is none (a ring of its own, named Logo, in the
   *  middle of the upper half, a fifth of the dial tall), chosen in the list. → "" or why it was refused */
  logo_take(text, name) {
    const read = read_logo(text); if (read.refused) return read.refused;
    const S = this.S; this.record?.();
    S.logo = { name, cmds: read.cmds, wide: read.wide }; G.file_shape_set(G.LOGO_FILE, read.cmds);
    if (G.logo_ring(S) < 0) {
      const ring = G.new_ring("markers", S); Object.assign(ring, { name: "Logo", count: 1, shape: G.SHAPES.indexOf("file"), file: G.LOGO_FILE, twelve: 0, wall: 0, r: 0, start: 0, len: S.dial_d / 5 });
      S.rings.unshift(ring);
    }
    const i = G.logo_ring(S), fit = G.logo_fit(S, 0, S.dial_d / 4, S.rings[i].len); Object.assign(S.rings[i], fit);
    S.ui_ring = i; this.changed(true); this.show_section?.(); this.sync_rows?.();
    return "";
  },
  /** the logo and its ring gone */
  logo_remove() {
    const S = this.S, i = G.logo_ring(S); this.record?.();
    S.logo = null; G.file_shape_set(G.LOGO_FILE, null);
    if (i >= 0 && S.rings.length > 1) { S.rings.splice(i, 1); S.ui_ring = Math.min(S.ui_ring || 0, S.rings.length - 1); }
    this.changed(true); this.show_section?.(); this.sync_rows?.();
  },
  /** the row Logo, in the Shape pane: Upload (or Replace) · the file's name · Remove; what stopped a file, said in the row */
  row_background(wrap) {
    const file = el("input", { type: "file", accept: ".svg,image/svg+xml", hidden: true, id: "logo-file" });
    const note = el("span", { className: "quiet", id: "background-note" }), up = el("button", { type: "button", className: "btn", id: "logo-upload" }), off = el("button", { type: "button", className: "btn", id: "logo-remove", textContent: "Remove" });
    const sync = (why = "") => { const L = this.S.logo; up.textContent = L ? "Replace" : "Upload SVG"; off.hidden = !L; note.textContent = why || (L ? L.name : G.logo_ring(this.S) >= 0 ? "its drawing is not in a link: upload it again" : "one shape, one solid colour"); note.classList.toggle("warn", Boolean(why)); };
    up.onclick = () => file.click(); off.onclick = () => { this.logo_remove(); sync(); };
    file.onchange = async () => { const f = file.files[0]; file.value = ""; if (!f) return; sync(this.logo_take(await f.text(), f.name)); };
    wrap.append(el("label", { textContent: "Logo" }), el("span", { className: "tools" }, up, off, note, file));
    wrap.sync = () => sync(); sync();
  },
  /** after any change: the logo's size and place as near what they say as the dial's edge lets them be */
  logo_keep() { const S = this.S, b = G.logo_box(S); if (!b) return; const r = S.rings[G.logo_ring(S)], fit = G.logo_fit(S, b.x, b.y, r.len); if (fit.len !== r.len || Math.abs(fit.r - r.r) > 0.0011) Object.assign(r, fit); },
  /** is this point of the dial (mm) on the logo? → true: a press there drags it (preview_events) */
  logo_hit(mm) { const b = !this.S.ui_show && G.logo_box(this.S); return Boolean(b) && Math.abs(mm[0] - b.x) <= b.w / 2 && Math.abs(mm[1] - b.y) <= b.h / 2; },
  /** drag it: its middle follows the pointer by the grip's offset, kept inside the dial */
  logo_drag(mm, grip) { const S = this.S, i = G.logo_ring(S), fit = G.logo_fit(S, mm[0] - grip[0], mm[1] - grip[1]); if (!fit) return; Object.assign(S.rings[i], fit); this.changed(); },
};
