// #175, a hand as a stack — drawing round 1 (Okay, 2 Nov 2026, 16:38: "Let's tackle hand on a stack"; 21:52, his
// answers: openings are "C · several shapes"; the lume "Filled opening, own height"; the rows "Opening tick → pane",
// as Bevel's (v1.1.37); the lume's colour "Per hand").
// What this round shows, on the Hour hand:
//   closed  — the Show box with a third tick, Opening, beside Show · Bevel
//   open    — Opening ticked: a pane of its own under the Show box (Bevel's fitting), its rows the app's own:
//             Shape (Bar · Dot, the markers' words) · Count · From % · To % · Width · Gap · Fill (Open · Lume) · Lume colour
//             and the hand's picture beside its numbers drawn with the openings: open ones show the dial, lume ones the lume
// The lume's height (Shadows pane) and the dial's own hands come in the next round.
part = ".panel .form";
tab = "Hands";
states = ["closed", "open"];
css = `
  /* a third pane under the Show box (Bevel's, this one, the hand's): each opens with the thin black line, as the app's
     rule does for two (4b-lines-tabs.css; Okay, 2 Nov 2026, 18:48: "with a black line on top") */
  .form > .showbox + .pane.headless + .pane.headless + .pane.headless { border-top: 0; padding-top: calc(var(--u4) + 2 * var(--hair)); background: linear-gradient(var(--ink) 0 0) right top / calc(100% - var(--lead)) var(--hair) no-repeat; }
`;
build = async (state) => {
  const t = window.dial_tool, $ = (q) => document.querySelector(q), S = t.S, H = S.ha_hour;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // the settings this round shows, on the hour hand (sketch only: not in the app's settings yet)
  const O = { op_shape: 0, op_count: 3, op_from: 30, op_to: 92, op_w: 0.8, op_gap: 0.4, op_fill: 1, op_lume: [0.91, 0.89, 0.78, 1] };
  Object.assign(H, O);
  // the tick, beside Bevel, in the Show box's own line
  const line = $(".showbox .showline");
  const box = document.createElement("input"); box.type = "checkbox"; box.id = "hand-opening"; box.checked = state === "open";
  const word = document.createElement("label"); word.className = "check"; word.htmlFor = box.id; word.append(box, " Opening");
  line.append(word);
  if (state !== "open") return;
  // the pane: under the Show box (and under Bevel's when that is ticked), the app's own rows
  const pane = document.createElement("section"); pane.className = "pane headless openpane";
  const body = document.createElement("div"); body.className = "body"; pane.append(body);
  const row = (r) => { const o = t.build_row({ scope: "hand", ...r }); body.append(o.el); o.el.hidden = false; o.refresh(H); return o; };
  row({ kind: "seg", key: "op_shape", text: "Shape", items: ["Bar", "Dot"] });
  row({ kind: "num", key: "op_count", text: "Count", lo: 1, hi: 12, step: 1, whole: true });
  row({ kind: "num", key: "op_from", text: "From %", lo: 0, hi: 100, step: 1, whole: true });
  row({ kind: "num", key: "op_to", text: "To %", lo: 0, hi: 100, step: 1, whole: true });
  row({ kind: "num", key: "op_w", text: "Width", lo: 0.05, hi: 3, step: 0.05 });
  row({ kind: "num", key: "op_gap", text: "Gap", lo: 0, hi: 3, step: 0.05 });
  row({ kind: "seg", key: "op_fill", text: "Fill", items: ["Open", "Lume"] });
  row({ kind: "col", key: "op_lume", text: "Lume" });
  $(".bevelpane").after(pane);      // Bevel's first when both are ticked: the order of the ticks
  // the openings on the hand's picture (its own units: mm, pointing up, the hub at 0): along the hand from From % to
  // To % of its length, Count shapes with Gap between; a Bar as long as its share, a Dot round, Width across
  const svg = $("#hand-detail svg.upright"), L = +H.len, n = O.op_count, a = (L * O.op_from) / 100, b = (L * O.op_to) / 100;
  const each = (b - a - O.op_gap * (n - 1)) / n, w = O.op_w;
  const ns = "http://www.w3.org/2000/svg", dial = getComputedStyle($("#hand-detail")).backgroundColor;
  const rgb = (c) => `rgb(${c.slice(0, 3).map((v) => Math.round(v * 255)).join(",")})`;
  for (let k = 0; k < n; k++) {
    const y0 = a + k * (each + O.op_gap), s = document.createElementNS(ns, O.op_shape ? "circle" : "rect");
    if (O.op_shape) { s.setAttribute("cx", 0); s.setAttribute("cy", -(y0 + each / 2)); s.setAttribute("r", Math.min(w, each) / 2); }
    else { s.setAttribute("x", -w / 2); s.setAttribute("y", -(y0 + each)); s.setAttribute("width", w); s.setAttribute("height", each); }
    s.setAttribute("fill", O.op_fill ? rgb(O.op_lume) : dial);
    svg.append(s);
  }
  console.log(`measured each ${each.toFixed(2)} mm long, ${w} wide, wall ${(1.43 - w) / 2} mm each side`);
  await wait(200);
};
