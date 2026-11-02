// The Shadows pane's side view at the parts' real heights, exaggerated (Okay, 2 Nov 2026, 13:05: "hand heights
// diagram on right, can we make the distances related to reals but exaggerated to show the distinction? the red lines
// and etc adapt"; 13:10: "1a 2a, draw first" — the tallest part fills the room above the plate, the ratios true; no
// leaders, a row pointed at still lights its part). Drawing round 1. The plate stays on the Plate row; each part
// stands k × its height above it, k = the room from the first row's top to the plate over the tallest part shown;
// a disc k × its depth under it. The drop line runs as before, from the lit part to the next toward the plate.
part = "#shadow-list .shadeparts";
states = ["rest", "minutes lit"];
css = "/**/";
setup = async () => { window.dial_tool.shadows_open(true); await new Promise((r) => setTimeout(r, 300)); };
build = async (state) => {
  const t = window.dial_tool, S = t.S, box = document.querySelector("#shadows-stack"), svg = box.querySelector("svg");
  const parts = box.querySelector(".parts:not(.top)"), top = box.querySelector(".parts.top"), axis = box.querySelector(".axis"), drop = box.querySelector(".drop");
  // the drawings, as stack_picture has them
  const LEN = { hour: 23.5, minute: 34.5, second: 46 }, TAIL = 10;
  const draw = {
    cap: (ax, y) => `<ellipse class="fill" cx="${ax}" cy="${y}" rx="6" ry="2.5"/>`,
    hand: (ax, y, h) => `<line x1="${ax - TAIL}" y1="${y}" x2="${ax + LEN[h]}" y2="${y}"/><ellipse class="fill" cx="${ax}" cy="${y}" rx="2.5" ry="1.4"/>`,
    plate: (ax, y) => `<ellipse class="fill" cx="${ax}" cy="${y}" rx="55.6" ry="18.7"/><rect class="dark" x="${ax + 21}" y="${y - 2.5}" width="10" height="5" rx="1"/><circle class="hole dark" cx="${ax}" cy="${y}" r="1.5"/>`,
    disc: (ax, y) => `<path class="fill" fill-rule="evenodd" d="M${ax - 25.9} ${y}a25.9 8.7 0 1 0 51.8 0a25.9 8.7 0 1 0 -51.8 0M${ax - 18.5} ${y}a18.5 6.2 0 1 0 37 0a18.5 6.2 0 1 0 -37 0Z"/>`,
  };
  const KEY = { cap: "sh_cap", second: "sh_second", minute: "sh_minute", hour: "sh_hour" };
  // a disc's depth as its row says it (the row's number box)
  const height = (name) => (KEY[name] ? S[KEY[name]] : name.startsWith("disc-") ? -parseFloat(document.querySelector(`#shadow-list .row[data-part="${name}"] input[type=text]`)?.value || 0) : 0);
  t.shadow_stack.refresh = () => {
    const b = svg.getBoundingClientRect(), W = Math.round(b.width), H = Math.round(b.height), ax = W / 2;
    if (!W || !H) return;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
    const rows = [...document.querySelectorAll("#shadow-list .shaderows > .row, #shadow-list .shadowdiscs > .row")].filter((r) => !r.hidden);
    const at = (r) => r.getBoundingClientRect(), first = +(at(rows[0]).top - b.top).toFixed(1);
    const plate_row = rows.find((r) => r.classList.contains("ref")), plate_y = +(at(plate_row).top + at(plate_row).height / 2 - b.top).toFixed(1);
    const named = rows.map((r) => r.dataset.part || (r.classList.contains("ref") ? "plate" : "")).filter(Boolean);
    const tallest = Math.max(...named.map(height), 0.05), deepest = Math.max(...named.map((n) => -height(n)), 0.05);
    const PAD = 8, k = (plate_y - first - PAD) / tallest;      // px per mm: the tallest part at the first row's top (plus air)
    const room_below = H - 12 - plate_y, kd = Math.min(k, room_below / deepest);      // a disc as deep as the same scale lets it, held inside the box
    console.log(`measured k ${k.toFixed(1)} px/mm, tallest ${tallest} mm, plate at ${plate_y}`);
    const list = named.map((name) => {
      const z = height(name), y = +(z >= 0 ? plate_y - k * z : plate_y - kd * z).toFixed(1);
      const kind = name === "plate" ? "plate" : name === "cap" ? "cap" : name.startsWith("disc") ? "disc" : "hand";
      return { name, y, svg: kind === "hand" ? draw.hand(ax, y, name) : draw[kind](ax, y) };
    }).sort((p, q) => p.y - q.y);
    const lit = list.find((p) => p.name === t.shade_lit);
    const one = (p) => `<g data-part="${p.name}" class="${p.name === "plate" ? "plate" : ""}${p === lit ? " lit" : ""}${lit && p.name === "plate" ? " dropped" : ""}">${p.svg}</g>`;
    parts.innerHTML = list.filter((p) => p !== lit).map(one).join("");
    top.innerHTML = lit ? one(lit) : "";
    const ytop = Math.min(...list.map((p) => p.y));
    axis.setAttribute("x1", ax); axis.setAttribute("x2", ax); axis.setAttribute("y1", ytop); axis.setAttribute("y2", H - 12);
    drop.classList.toggle("on", Boolean(lit));
    if (lit) {
      const i = list.indexOf(lit), p = list.findIndex((x) => x.name === "plate"), toward = lit.y < plate_y ? list[i + 1] : list[i - 1], next_y = toward ? toward.y : plate_y;
      for (const [cls, y1, y2] of [["knock", lit.y, plate_y], ["fixed", next_y, plate_y], ["moving", lit.y, next_y]]) { const l = drop.querySelector("." + cls); l.setAttribute("x1", ax); l.setAttribute("x2", ax); l.setAttribute("y1", y1); l.setAttribute("y2", y2); }
    }
  };
  t.shade_lit = null;
  if (state === "minutes lit") t.shade_lit = "minute";
  t.shadow_stack.refresh();
  await new Promise((r) => setTimeout(r, 200));
};
