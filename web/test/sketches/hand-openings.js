// #175, a hand as a stack — drawing rounds (Okay, 2 Nov 2026, 16:38: "Let's tackle hand on a stack").
// Round 1 (21:52, his answers): openings are "C · several shapes"; the lume "Filled opening, own height"; the lume's
// colour "Per hand". Rows: Shape (Bar · Dot, the markers' words) · Count · From % · To % · Width · Gap · Fill (Open ·
// Lume) · Lume colour.
// Round 2 (22:00): "opening is its own eye list menu below with a switch on off next to the title. When on the menu up
// top appears. This comes after the preview and sliders beside, hand type moves up top of the preview and sliders."
// Read as: no tick in the Show box; Opening is a pane with a heading and its eye (a folding pane, as Flare's in show
// mode), its on · off on the heading line — the app's toggle (#525) — and its rows only while on; the pane comes after
// the hand's pane (its picture and the sliders beside it); the hand types' strip moves to the top of the hand's pane.
// Round 3 (22:04, his marks on round 2): the picture "Too much" (empty below: the shots now end under the last row);
// the line over the strip struck out (the strip stands right under the Show box); the switch → "TICK BOX" (the app's
// tick on the heading line, as Flare's).
// Round 4 (22:09): "All good. Hand types and the above" — kept as round 3; "move bevel as an eye and a tick box below
// openings" — Bevel leaves the Show box for a pane of its own after Opening's, its tick on the heading line, Bevel Type
// and Bevels % in it while ticked (the real rows, the real keys); "Show same as windows' show" — the Show box holds Show
// alone, as a window's does.
// Round 5 (22:18): "New design is good. Only needed thing is line above, like this. The distance from show to line to
// the beginning of the content" — the hand's pane keeps its thin black line under the Show box, at the distances it has
// now (show → line → content), the strip its first content; "list of hand types gets a thin black line".
// Not drawn yet: the lume's height (Shadows pane), the openings on the dial's own hands.
part = ".panel .form";
tab = "Hands";
states = ["off", "on"];
css = `
  /* the strip on top: its own grid line, the picture and the sliders from the next one down (4d-hands.css puts the
     picture on line 1 to span 40); the pane's own black line is over it, so the strip keeps only the one under it,
     the gap to the picture a unit and a half, as from the Show box's line to the strip */
  @media (min-width: 861px) { .body > .row.thumbs { grid-row: 1; } .body > .detail { grid-row: 2 / span 40; } }
  .row.thumbs { margin-top: 0; border-top: 0; margin-bottom: var(--u4); }
  /* round 6 (22:25: "The gap after the line for hands, is the same as before, between it and gray show block. There's
     too much vertical gap there"): line → tiles as Show box → line, --u4 (11 px measured, was 24) */
  .form > .pane.headless:has(> .body > .row.thumbs) { padding-top: var(--u4); }
  .row.thumbs > .picks.thumbs { padding-top: 0; }
  .lumechip::after { content: "L"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(0, 0, 0, 0.35); font: 600 calc(var(--t-xs) * 0.8)/1 var(--sans); }      /* a lume's swatch: a faded L, as a RAL's R */
`;
build = async (state) => {
  const t = window.dial_tool, $ = (q) => document.querySelector(q), H = t.S.ha_hour;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // the settings this round shows, on the hour hand (sketch only: not in the app's settings yet)
  const O = { op_on: state === "on", op_shape: 0, op_count: 3, op_from: 30, op_to: 92, op_w: 0.8, op_gap: 0.4, op_fill: 1, op_lume: [0.894, 0.918, 0.761, 1] };      // C3 by day, #E4EAC2 (research v31, §6.1)
  Object.assign(H, O);
  // the hand types' strip to the top of the hand's pane, over its picture and sliders
  const thumbs = $(".row.pick.thumbs"), body = thumbs.parentElement;
  body.prepend(thumbs);
  // the Opening pane, after the hand's pane: built and kept as the panel builds its own (a heading, its toggle on the
  // heading line, the rows in its body), so the eye, the lines and showing a row only while on are the app's
  const on = (T) => Boolean(T.op_on);
  H.bevel = state === "on";
  // a pane as the panel builds one: a heading with its eye, a tick on the heading line (the box alone: the heading
  // already says its name), the rows in its body; kept with the panel's rows so sync_rows shows each only while it applies
  const all = [];
  const pane = (defs, place) => {
    const rows = defs.map((r) => t.build_row({ scope: "hand", ...r })), [head, ...rest] = rows;
    place(head.el);
    for (const r of rest) {
      if (r.row.head) { const c = r.el.lastElementChild; c.classList.add("headcontrol"); c.querySelector(".words")?.remove(); r.el = c; r.group = head; r.in_head = true; head.button.after(c); head.el.classList.add("has"); }
      else { r.group = head; head.body.append(r.el); }
    }
    all.push(...rows);
    return head;
  };
  const opening = pane([
    { kind: "hdr", text: "Opening", folded: false },
    { kind: "chk", key: "op_on", text: "Opening", head: true },
    { kind: "seg", key: "op_shape", text: "Shape", items: ["Bar", "Dot"], show: on },
    { kind: "num", key: "op_count", text: "Count", lo: 1, hi: 12, step: 1, whole: true, show: on },
    { kind: "num", key: "op_from", text: "From %", lo: 0, hi: 100, step: 1, whole: true, show: on },
    { kind: "num", key: "op_to", text: "To %", lo: 0, hi: 100, step: 1, whole: true, show: on },
    { kind: "num", key: "op_w", text: "Width", lo: 0.05, hi: 3, step: 0.05, show: on },
    { kind: "num", key: "op_gap", text: "Gap", lo: 0, hi: 3, step: 0.05, show: on },
    { kind: "col", key: "op_lume", text: "Fill", show: on },      // 22:38: one row, its pop-out Lume alone (Open, or a lume); the pill says the lume's name, its swatch an L
  ], (el) => body.closest(".pane").after(el));
  // Bevel: out of the Show box (Show alone, as a window's) into a pane after Opening's, its own rows moved in
  $("#hand-bevel")?.closest("label")?.remove();
  const own = (key) => t.rows.find((r) => r.row.key === key && !r.in_head)?.row;
  pane([
    { kind: "hdr", text: "Bevel", folded: false },
    { kind: "chk", key: "bevel", text: "Bevel", head: true },
    { ...own("bevel_look") },
    { ...own("sh_bevel") },
  ], (el) => opening.el.after(el));
  $(".bevelpane")?.remove();
  const rows = all;
  t.rows.push(...rows);
  t.sync_rows();
  // the openings on the hand's picture (its own units: mm, pointing up, the hub at 0): along the hand from From % to
  // To % of its length, Count shapes with Gap between; a Bar as long as its share, a Dot round, Width across
  if (!O.op_on) return;
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
  console.log(`measured each ${each.toFixed(2)} mm long, ${w} wide`);
  // the Fill pill: the lume's name, an L on its swatch (as a RAL's pill says R5015, its chip a faded R)
  const fill = [...document.querySelectorAll(".row.col")].find((r) => r.textContent.trim().startsWith("Fill"));
  if (fill) { const word = [...fill.querySelectorAll("span")].find((e) => /^#/.test(e.textContent.trim())); if (word) word.textContent = "C3"; const dot = fill.querySelector("i, .dot"); if (dot) { dot.classList.add("lumechip"); dot.style.position = "relative"; } }
  await wait(200);
  // the gaps round the line under the Show box, measured off the page (R21): Show box → line, line → the strip's tiles
  const sb = $(".showbox .showline").getBoundingClientRect(), pn = body.closest(".pane").getBoundingClientRect(), tile = $(".row.thumbs .pickt").getBoundingClientRect();
  console.log(`measured show→line ${(pn.top - sb.bottom).toFixed(1)}, line→tiles ${(tile.top - pn.top).toFixed(1)}`);
};
