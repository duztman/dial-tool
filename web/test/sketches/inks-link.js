// #581, round 3 (3 Nov 2026, 11:15): show mode's Inks list — the group's name centred between its lines; the LINK pill
// LINKED filled in --ink when linked, LINK a hollow outline when not, in the line's colour, the word too (Okay: "make link
// text black when off"); no ground colour in the pill and no line under it (Okay: "remove the bg color from the pill but
// also remove the line from under it").
// How the line leaves the pill alone: the row no longer paints its colour line as a background; instead a strip at the
// row's foot (.linkline) holds the pill and, after it, the line (.rule) — a flex strip, so the line begins where the
// pill ends, whatever word it carries. The Windows tab's Width · Height pill (#358, panel.js) is untouched.
// Measured earlier: the heading's ink 14.5 px under the line above and 9 over the line below (padding-bottom --u2 on
// align-items: end); the pill's ground was --surface, transparent in the column, so the line ran through the word.
part = ".inklist";
tab = "Dial";
setup = async () => {
  const t = window.dial_tool;
  t.changed(true); t.show_mode(true, true);
  await new Promise((r) => setTimeout(r, 300));
  t.set_value("window", "on", true);      // the date window on, so On the discs shows
  t.S.ui_section = 5; t.show_section(); t.sync_rows();
  await new Promise((r) => setTimeout(r, 300));
  document.getElementById("ink-0-link-2").click();      // Markers given its own height, so both states show: Numerals linked, Markers not
  await new Promise((r) => setTimeout(r, 300));
  document.querySelector(".inklist").scrollIntoView({ block: "start" });      // the column scrolls: bring the list to the top of the window
  await new Promise((r) => setTimeout(r, 300));
};
css = `
  .colourlist > .row.showsub { padding-bottom: var(--u3); }                                             /* 8.25: the ink 11.75 from the line above and from the line below */
  .colourlist > .row.showline.part.haslink { background: none; box-shadow: none; }                      /* its colour line is drawn by the strip below, after the pill */
  .colourlist > .row.part { box-shadow: inset 0 calc(-1 * var(--hair)) 0 var(--row-rule); }              /* a part draws only its own bottom line, never the outer top one of 4c-rows.css line 7: that was the full line under a pill and the long line over a window's last colour (02:34: "neighbors top line loses length") */
  .colourlist > .row.haslink > .linkline { position: absolute; z-index: 1; left: calc(var(--kind-pic) + var(--u2)); right: 0; bottom: 0; translate: 0 50%; display: flex; align-items: center; }
  .colourlist > .row.haslink > .linkline > .rule { flex: 1; height: var(--hair); background: var(--row-rule); }
  .colourlist > .row.haslink .linkpill { position: static; translate: none; display: grid; place-items: center; height: var(--link-pill); padding: 0 var(--u2); border: var(--hair) solid var(--row-rule); border-radius: var(--round-pill); background: none; color: var(--row-rule); font: 400 var(--t-pixel)/1 var(--pixel); letter-spacing: 0; }   /* the pill as 4c-rows.css draws it (built: that selector widened to a descendant), hollow, outline and word in the line's colour */
  .colourlist > .row.haslink .linkpill.on { background: var(--ink); color: var(--column-solid); }                            /* linked: filled, the word in the column's colour */
`;
build = async () => {
  for (const p of document.querySelectorAll(".inklist .linkpill")) {
    p.textContent = p.classList.contains("on") ? "LINKED" : "LINK";      // the word follows the state, as panel.js line 525 does for Width · Height
    const strip = document.createElement("span"); strip.className = "linkline";
    p.replaceWith(strip); strip.append(p, Object.assign(document.createElement("i"), { className: "rule" }));
  }
};
