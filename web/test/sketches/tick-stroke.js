// Strokes for ticks and markers (#556; Okay, 31 Oct 2026, 03:31: "Also indices and markers get outlines"; 03:33: "Yes to
// all" — drawn first). Round 1: a pane of its own, Stroke, after Shapes — its On on the heading line (Okay, 12 Oct 2026:
// "a pane's main selector goes on top, on its heading line"), then the rows the font box's Stroke part has (the app's
// own stroke_part: Width · Join · Side · Colour). The dial shows the minute ticks with a red stroke outside.
part = ".form";
tab = "Rings";
below = 0;
css = `
  .sk-stroke .fold { display: flex; align-items: center; }
  .sk-stroke .fold h2 { flex: 1; }
  .sk-stroke .parton { flex: none; padding: 0 var(--frame-pad); font-weight: 400; }
  .sk-stroke .strokerows > .row { border-top: var(--hair) solid var(--row-rule); }
`;
setup = async () => { const t = window.dial_tool; t.S.ui_ring = t.S.rings.findIndex((r) => r.kind === 0); t.show_section(); t.sync_rows(); };
build = async () => {
  const t = window.dial_tool, i = t.S.ui_ring;
  const shapes = [...document.querySelectorAll(".form > .pane")].find((p) => p.querySelector("h2")?.textContent === "Shapes");
  const pane = shapes.cloneNode(false); pane.classList.add("sk-stroke");
  const head = shapes.querySelector(":scope > .fold").cloneNode(true); head.querySelector("h2").textContent = "Stroke";
  const part = t.stroke_part();
  head.append(part.on);
  const body = document.createElement("div"); body.className = "body"; body.append(part.el);
  pane.append(head, body);
  shapes.after(pane);
  Object.assign(t.S.rings[i], { stroke: true, stroke_w: 0.1 });
  part.refresh(null, t.S.rings[i]);
  pane.scrollIntoView({ block: "center" });
  await new Promise((r) => setTimeout(r, 300));
};
