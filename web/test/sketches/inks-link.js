// #581, round 2 (3 Nov 2026, 09:47): show mode's Inks list — the group's name centred between its lines, the LINK pill
// made the Windows tab's Width · Height pill (#358, panel.js): LINKED filled in --ink when linked, LINK an outline in the
// line's colour when not, standing on the line, the line not passing behind it. Measured in show mode (09:30): the
// unlinked pill's ground was transparent (--surface is transparent in the column), so the line ran through the word;
// the word never changed (colour.js writes "LINK" once). The heading's ink sat 14.5 px under the line above and 9 px
// over the line below (padding-bottom --u2 on align-items: end).
part = ".inklist";
tab = "Dial";
setup = async () => {
  const t = window.dial_tool;
  t.changed(true); t.show_mode(true, true);
  await new Promise((r) => setTimeout(r, 300));
  t.S.ui_section = 5; t.show_section(); t.sync_rows();
  await new Promise((r) => setTimeout(r, 300));
  document.getElementById("ink-0-link-2").click();      // Markers given its own height, so both states show: Numerals linked, Markers not
  await new Promise((r) => setTimeout(r, 300));
};
css = `
  .colourlist > .row.showsub { padding-bottom: var(--u3); }                                             /* 8.25: the ink 11.75 from the line above and from the line below */
  .colourlist > .row.haslink > .linkpill { background: var(--column-solid); }                           /* unlinked: the column's own solid ground inside the outline, as the Windows tab's pill has the paper — the line stops at the pill */
  .colourlist > .row.haslink > .linkpill.on { background: var(--ink); color: var(--column-solid); }     /* linked: filled, the word in the column's colour */
`;
build = async () => { for (const p of document.querySelectorAll(".inklist .linkpill")) p.textContent = p.classList.contains("on") ? "LINKED" : "LINK"; };      // the word follows the state, as panel.js line 525 does for Width · Height
