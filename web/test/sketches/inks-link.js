// #581, round 1 (3 Nov 2026, 08:15): show mode's Inks list — the group's name centred between its lines, the LINK pill's
// states inverted (Okay: "Invert the states of link, linked" — "Both": the words follow the state and the looks swap).
// As it is: the pill always reads LINK; linked it is filled in --ink, unlinked an outline. Measured: the heading's ink
// sits 14.5 px under the line above and 9 px over the line below (padding-bottom --u2 on align-items: end).
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
  .colourlist > .row.haslink > .linkpill { border-color: var(--row-rule); background: var(--row-rule); color: var(--column, var(--paper)); }   /* unlinked: filled in the line's colour, the word in the pane's ground */
  .colourlist > .row.haslink > .linkpill.on { border-color: var(--row-rule); background: var(--surface); color: var(--grey); }                /* linked: an outline on the line, the word grey */
`;
build = async () => { for (const p of document.querySelectorAll(".inklist .linkpill")) p.textContent = p.classList.contains("on") ? "LINKED" : "LINK"; };
