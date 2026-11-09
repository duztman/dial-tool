// case.js — the case round the dial (#582): the Dial tab's own tabs (Dial · Rehaut · Bezel), the section diagram beside
// the rows, the presets. The rules are the 3D exercise's (try/relight, round 34: the bezel stack by named numbers), drawn
// in 2D — the plan in geometry.js (case_spans, case_grounds), the section here.

import * as G from "./geometry.js";
import { el } from "./ui.js";
import { to_hex } from "./ui.js";

// the two cases the 3D exercise specified (its CASES table; the diver after the SPB143 and Submariner photographs, the
// dress Claude's first draft "from turning the diver's sliders"), in dial millimetres for the default Ø 30: the spec's
// numbers at its opening of Ø 29.2, near enough to read as they are. A preset sets every case number at once; its
// colours are left as they are
export const CASE_PRESETS = [
  ["Diver", { rh_w: 1.7, bz_kind: 0, bz_w: 3.3, bz_chamfer: 0.45, bz_in_in: 0.4, bz_in_out: 0.6, bz_teeth_n: 60, bz_teeth_depth: 0.5, bz_teeth_fill: 0.62, bz_teeth_chamfer: 0.45, bz_dial_up: 0.7, bz_seat: 0.3, bz_h: 2.3, bz_lip: 0.55, bz_rim: 0.4, bz_up: 0.65, bz_dome: 1.35 }],
  ["Dress", { rh_w: 1.2, bz_kind: 1, bz_w: 2.2, bz_chamfer: 0.3, bz_in_in: 0.4, bz_in_out: 0.6, bz_teeth_n: 60, bz_teeth_depth: 0, bz_teeth_fill: 0.62, bz_teeth_chamfer: 0.45, bz_dial_up: 0.7, bz_seat: 0.3, bz_h: 1.4, bz_lip: 0.4, bz_rim: 0.5, bz_up: 0.4, bz_dome: 1.8 }],
];

/** the section's shapes, in mm: r to the right from the dial's centre, z up from the band's top — the 3D exercise's lathe
 *  profiles (buildBezel), the dial's plate added. [{ part, pts, fill }] bottom first; a part that is off is left out. */
export function case_section(S) {
  const sp = G.case_spans(S), R = S.dial_d / 2, out = [];
  const z_dial = S.bz_dial_up, z0 = S.bz_seat, z1 = z0 + S.bz_h, lip = S.bz_lip, ch = S.bz_chamfer;
  const PLATE = 0.4;      // the plate's thickness, a drawing's (the dial's brass is 0.3–0.5)
  out.push({ part: "dial", pts: [[0, z_dial - PLATE], [R, z_dial - PLATE], [R, z_dial], [0, z_dial]], fill: S.c_plate });
  if (sp.rehaut) {      // a polished wall up from the dial's face, sloping out to a flange under the ring's top
    const r0 = sp.rehaut[1], top = (sp.bezel ? z1 : z_dial + 1.2) - lip;
    out.push({ part: "rehaut", pts: [[R, z_dial], [R + 0.6, top], [r0 - 0.2, top + 0.15], [r0, top + 0.15], [r0, z0], [R, z0]], fill: S.rh_c });
  }
  if (sp.bezel) {
    const [r0, r1] = sp.bezel;
    if (S.bz_kind === 0) {      // the turning ring with a recess for the insert
      const ri = r0 + S.bz_in_in, ro = r1 - S.bz_in_out, top = z1 + lip;
      out.push({ part: "bezel", pts: [[r0, z0], [r1, z0], [r1, z1], [r1 - ch, top], [ro, top], [ro, z1], [ri, z1], [ri, top - 0.05], [ri - 0.2, top], [ri - 0.3, z1 - 0.3], [r0, z1 - 0.3]], fill: S.bz_c });
      out.push({ part: "insert", pts: [[ri, z1], [ro, z1], [ro, z1 + 0.5], [ri, z1 + 0.5]], fill: S.bz_insert_c });
      if (S.bz_teeth_depth > 0) {      // the coin edge: a scallop's depth as a notch in the outer wall, chamfered on top
        const d = S.bz_teeth_depth, tch = S.bz_teeth_chamfer, mid = (z0 + z1) / 2;
        out.push({ part: "teeth", pts: [[r1, z0], [r1 + d, z0], [r1 + d, z1 - tch], [r1 + d - tch, z1], [r1, z1], [r1, mid + 0.35], [r1 + d * 0.9, mid], [r1, mid - 0.35]], fill: S.bz_c });
      }
    } else {      // a plain bezel, closed over the top, sloping from the chamfer in to the crystal's rim
      const rim = r0 - S.bz_rim;
      out.push({ part: "bezel", pts: [[r0, z0], [r1, z0], [r1, z1], [r1 - ch, z1 + ch], [rim + 0.3, z1 + lip], [rim, z1 + lip - 0.15], [rim, z1 - 0.3], [r0, z1 - 0.3]], fill: S.bz_c });
    }
    // the crystal: its rim in from the ring's inner radius, up over the ring's top, a gentle dome in four arcs
    const rim = r0 - S.bz_rim, zb = z1 - 0.35, zr = z1 + S.bz_up, zt = zr + S.bz_dome, d = zt - zr;
    out.push({ part: "crystal", pts: [[0, zb], [rim, zb], [rim, zr], [rim - 0.1, zr + 0.26 * d], [rim - 0.4, zr + 0.44 * d], [rim - 0.9, zr + 0.56 * d], [rim - 1.5, zr + 0.59 * d], [rim * 0.69, zr + 0.74 * d], [rim * 0.44, zr + 0.89 * d], [rim * 0.22, zr + 0.98 * d], [0, zt]], fill: [0.6, 0.72, 0.8, 0.35] });
  }
  return out;
}

export const CASE = {
  /** the Dial tab's own tabs, always in view: Dial · Rehaut · Bezel (Okay, 9 Nov 2026: "Tab under dial. What we have now
   *  is a tab, bezel and rehault are tabs"), as the hand tabs are */
  row_case_tabs(wrap, out) {
    wrap.className = "tabsbar casetabs";
    const tabs = el("span", { className: "segs", role: "tablist", ariaLabel: "Dial, rehaut or bezel" });
    ["Dial", "Rehaut", "Bezel"].forEach((name, i) => {
      const b = el("button", { type: "button", className: "tab", id: "case-tab-" + i, textContent: name, onclick: () => { this.S.ui_dial_tab = i; this.sync_rows(); this.render(); } });
      b.setAttribute("role", "tab");
      tabs.append(b);
    });
    wrap.append(tabs);
    out.refresh = (S) => [...tabs.children].forEach((b, i) => { const on = i === (S.ui_dial_tab || 0); b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
  },

  /** the section beside the rows (Okay: "a diagram next to sliders like we have in hands"): the right half of the case
   *  cut through its middle — the plate, the rehaut's wall, the ring, its insert and coin edge, the crystal's dome — drawn
   *  from the same numbers the rows set, so what a number changes is seen beside it. The part the rows are about (the
   *  tab's) is in ink, the rest in their colours. */
  row_case_detail(wrap, out) {
    wrap.className = "detail casedetail";
    let drawn = "";
    out.refresh = (S) => {
      // the box starts on the line after the pane's full rows (the tick, Preset, Kind), as the hand's box follows its thumbs; the side rows stand beside it
      let n = 0; for (let e = wrap.previousElementSibling; e; e = e.previousElementSibling) if (!e.hidden) n++;
      wrap.style.gridRow = `${n + 1} / span 40`;
      const parts = case_section(S), f = (v) => v.toFixed(3);
      const xs = parts.flatMap((p) => p.pts.map((q) => q[0])), zs = parts.flatMap((p) => p.pts.map((q) => q[1]));
      // the view: the case's edge, from 4 mm inside the dial's rim to the coin edge — the dial's middle says nothing here
      const x0 = S.dial_d / 2 - 4, x1 = Math.max(...xs), zlo = Math.min(...zs), zhi = Math.max(...zs), m = (x1 - x0) * 0.04;
      const focus = ["dial", "rehaut", "bezel"][S.ui_dial_tab || 0];
      const shape = (p) => `<path class="${p.part}${p.part === focus || (focus === "bezel" && (p.part === "insert" || p.part === "teeth")) ? " focus" : ""}" d="M${p.pts.map(([x, z]) => `${f(x)} ${f(-z)}`).join("L")}Z" fill="${to_hex(p.fill)}" fill-opacity="${p.fill[3] ?? 1}"/>`;
      const now = `<svg class="section" viewBox="${f(x0 - m)} ${f(-zhi - m)} ${f(x1 - x0 + 2 * m)} ${f(zhi - zlo + 2 * m)}" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><line class="axis" x1="${f(S.dial_d / 2)}" y1="${f(-zhi - m)}" x2="${f(S.dial_d / 2)}" y2="${f(-zlo + m)}"/>${parts.map(shape).join("")}</svg>`;
      if (now !== drawn) { drawn = now; wrap.innerHTML = now; }
    };
  },

  /** the presets, a pill: Diver · Dress set every case number (the colours stay); none lit once a number differs */
  row_case_preset(wrap, out) {
    wrap.className = "row";
    const group = el("span", { className: "pillswitch", role: "radiogroup", ariaLabel: "Preset" });
    const buttons = CASE_PRESETS.map(([name, values], i) => el("button", { type: "button", id: "case-preset-" + i, textContent: name, onclick: () => { Object.assign(this.S, values); this.changed(true); } }));
    group.append(...buttons);
    wrap.append(el("label", { textContent: "Preset" }), group);
    out.refresh = (S) => buttons.forEach((b, i) => { const on = Object.entries(CASE_PRESETS[i][1]).every(([k, v]) => Math.abs(S[k] - v) < 1e-9); b.classList.toggle("on", on); });
  },
};
