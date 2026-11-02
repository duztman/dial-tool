// #175 round 6 (Okay, 2 Nov 2026, 22:25: "Draw lume height + dial"): the hour hand's openings on the dial itself, at
// the watchmaker's 10:09:36 — the values of hand-openings.js (Bar · 3 · From 30 % · To 92 % · Width 0.80 · Gap 0.40,
// filled with lume #E8E3C7). States: open (the dial shows through) and lume. Drawn over the hand in its own units (mm,
// pointing to 12 before it turns), so it turns with it.
part = "svg.preview";
states = ["open", "lume"];
css = `/**/`;
build = async (state) => {
  const t = window.dial_tool, S = t.S, H = S.ha_hour;
  const O = { op_count: 3, op_from: 30, op_to: 92, op_w: 0.8, op_gap: 0.4, lume: "#E8E3C7" };
  // the hour hand's slot: the one whose shape reaches the hand's length
  const slot = t.slots.find((s) => s.angle && Math.abs(s.node.getBBox().height - (+H.len + +H.tail)) < 0.05);
  if (!slot) { console.log("measured: no hour slot found"); return; }
  const ns = "http://www.w3.org/2000/svg", g = document.createElementNS(ns, "g");
  g.setAttribute("transform", `rotate(${-slot.angle})`);
  const dial = "rgb(" + (S.c_plate || [1, 1, 1, 1]).slice(0, 3).map((v) => Math.round(v * 255)).join(",") + ")";
  const L = +H.len, n = O.op_count, a = (L * O.op_from) / 100, b = (L * O.op_to) / 100;
  const each = (b - a - O.op_gap * (n - 1)) / n, w = O.op_w;
  for (let k = 0; k < n; k++) {
    const y0 = a + k * (each + O.op_gap), r = document.createElementNS(ns, "rect");
    r.setAttribute("x", -w / 2); r.setAttribute("y", y0); r.setAttribute("width", w); r.setAttribute("height", each);
    r.setAttribute("fill", state === "lume" ? O.lume : dial);
    g.append(r);
  }
  slot.node.after(g);
  console.log(`measured hour at ${slot.angle}°, each ${each.toFixed(2)} mm`);
};
