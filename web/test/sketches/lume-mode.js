// Lume as a way of naming a colour: the colour pop-out's fifth mode, after RAL (Okay, 2 Nov 2026, 22:25: "Lume is a
// swatch! Add it next to ral on colors. The lume research has names and such, implement them. It is treated as an
// ink."; 22:35, his picks: the research's lumes only; a lume ink's height from what it sits on — the plate, or a
// hand's blade (+ proud, − sunk); the Opening pane's Fill one colour row; a lume anywhere a colour is).
// The swatches: the research's Lume table (research v31, §6.1, sourced there), daylight colour as drawn in its table,
// glow colour, strength against C3. Tints are illustrative there and say so here.
//   C3          pale yellow-green · glows green 515 nm · 100 %, the reference
//   BGW9        white · glows blue-green 485 nm · about 95 %
//   C5          greenish-yellow · glows green · 89 %, unsourced
//   C1          white body · glows green, weaker · about 31 %, unsourced
//   Old radium  tan (a tint) · glows weaker
//   Dark red    red (a tint) · about 22 %, unsourced
part = "#colour-pop";
tab = "Hands";
css = `
  #colour-pop .lumegrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--u2); padding: var(--u3) 0; }
  #colour-pop .lumegrid > button { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: var(--u2); align-items: center; padding: var(--u1); border: var(--hair) solid transparent; border-radius: var(--round-small); background: none; color: inherit; text-align: left; }
  #colour-pop .lumegrid > button.on { border-color: currentColor; }
  #colour-pop .lumegrid .day { grid-row: 1 / span 2; width: calc(3 * var(--u4)); height: calc(3 * var(--u4)); border-radius: var(--round-small); position: relative; }
  #colour-pop .lumegrid .day > i { position: absolute; right: var(--u1); bottom: var(--u1); width: var(--u3); height: var(--u3); border-radius: 50%; box-shadow: 0 0 0 var(--hair) #0B0E12; }      /* its glow, a dot */
  #colour-pop .lumegrid b { font-weight: 600; font-size: var(--t-s); }
  #colour-pop .lumegrid small { font-size: var(--t-xs); opacity: 0.6; }
`;
setup = async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector(".row.col .colour, .row.col button")?.click(); await wait(300);
  document.querySelector("#pop-as-RAL")?.click(); await wait(300);
};
build = async () => {
  const $ = (q) => document.querySelector(q), pop = $("#colour-pop");
  const LUMES = [
    ["C3", "#E4EAC2", "#8CF56A", "100 %"], ["BGW9", "#F4F4F0", "#62DDF5", "95 %"], ["C5", "#E9EDB0", "#B7F06A", "89 %"],
    ["C1", "#F7F7F4", "#8CF56A", "31 %"], ["Old radium", "#E6D3B0", "#E9A86A", "tint"], ["Dark red", "#D8574C", "#F0645A", "22 %"],
  ];
  // the modes: Lume after RAL, chosen
  const modes = $("#colour-pop .asnumbers .segs");
  modes.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
  const lume = document.createElement("button"); lume.type = "button"; lume.id = "pop-as-Lume"; lume.textContent = "Lume"; lume.className = "on"; modes.append(lume);
  // in RAL's grid, bands and charts' place: the lumes
  for (const id of ["#pop-ralgrid", "#pop-charts", "#pop-bands", "#colour-pop .alpharow"])      // no Opacity: a lume is an ink, laid whole
  { const e = $(id); if (e) e.hidden = true; }
  const grid = document.createElement("div"); grid.className = "lumegrid";
  for (const [name, day, glow, k] of LUMES) {
    const b = document.createElement("button"); b.type = "button"; b.className = name === "C3" ? "on" : ""; b.title = `${name}: by day ${day}, glows ${glow}`;
    b.innerHTML = `<span class="day" style="background:${day}"><i style="background:${glow}"></i></span><b>${name}</b><small>${k}</small>`;
    grid.append(b);
  }
  $("#pop-ralgrid").before(grid);
  // the values line: the lume's name, and what it is by day and its glow
  $("#colour-pop .dot").style.setProperty("--c", "#E4EAC2");
  const nums = $("#colour-pop .numbers"); nums.dataset.mode = "Lume";
  nums.querySelector('[data-l="ral"]').dataset.l = "lume"; $("#pop-ral").value = "C3";
  nums.querySelector('[data-l="name"]').dataset.l = "glow"; $("#pop-ral-name").textContent = "Green";
};
