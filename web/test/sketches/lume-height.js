// #175 round 6 (Okay, 2 Nov 2026, 22:25: "Draw lume height + dial"; 21:52: "Filled opening, own height"): the lume a
// part of its own in the Shadows pane. A hand whose Opening is on and filled with lume gets a row under its own:
// "Hours lume", its height above the plate as every part's is (0.20: 0.05 proud of the hour hand's 0.15; below 0.15 it
// sits sunk in the blade). In the Parts picture, a short bar in the lume's colour at that height on the hour hand.
part = "#shadow-list";
states = ["rest", "lume lit"];
css = `
  #shadows-stack .lumebar { stroke: #E8E3C7; stroke-width: 3; }
  #shadows-stack .lumebar.lit { stroke: var(--lit, #FF6A00); }
`;
setup = async () => { window.dial_tool.shadows_open(true); await new Promise((r) => setTimeout(r, 300)); };
build = async (state) => {
  const t = window.dial_tool, S = t.S, $ = (q) => document.querySelector(q);
  S.sh_hour_lume = 0.2;      // the slider from the plate to the minutes hand, as the Hours slider runs (Okay, 25 Oct 2026: "seconds hand cant go below minutes and so on")
  const hours = [...document.querySelectorAll("#shadow-list .row")].find((r) => r.textContent.trim().startsWith("Hours"));
  const def = t.rows?.find((r) => r.row.key === "sh_hour")?.row || { kind: "num", key: "sh_hour", lo: 0, hi: 2, step: 0.05 };
  const o = t.build_row({ ...def, lo: 0, hi: +S.sh_minute, key: "sh_hour_lume", text: "Hours lume", id: "sh-hour-lume" });
  o.el.className = hours.className + " lume";      /* the hand rows' own layout: same columns as Hours */ o.el.hidden = false; hours.after(o.el); o.refresh(S);
  // the Parts picture: the hour hand's line, and a lume bar over it at its height on the picture's own scale
  await new Promise((r) => setTimeout(r, 200));
  const svg = $("#shadows-stack svg"), hour = svg.querySelector('[data-part="hour"] line'), plate = svg.querySelector('[data-part="plate"] ellipse');
  if (!hour || !plate) { console.log("measured: no hour or plate in the picture"); return; }
  const yh = +hour.getAttribute("y1"), yp = +plate.getAttribute("cy"), k = (yp - yh) / S.sh_hour, yl = yp - k * S.sh_hour_lume;
  const x1 = +hour.getAttribute("x1"), x2 = +hour.getAttribute("x2"), L = x2 - x1;
  const bar = document.createElementNS("http://www.w3.org/2000/svg", "line");
  bar.setAttribute("class", "lumebar" + (state === "lume lit" ? " lit" : ""));
  for (const [a, v] of [["x1", x1 + 0.4 * L], ["x2", x1 + 0.95 * L], ["y1", yl], ["y2", yl]]) bar.setAttribute(a, v.toFixed(1));
  hour.parentElement.append(bar);
  if (state === "lume lit") o.el.classList.add("lit");
  console.log(`measured k ${k.toFixed(1)} px/mm, hour at ${yh}, lume at ${yl.toFixed(1)}`);
};
