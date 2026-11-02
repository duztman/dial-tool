// Show mode's Dial tab, the Colours pane (Okay, 3 Nov 2026, 01:13, his picture of it): "These separator lines, extend all
// the way to the start of this first column. Disc is not indented, is bold, as is hands and windows. Hands get round
// icons with hands in L formation in the same style as others. The window icon is not filled outlined (rounded
// rectangle) all for this pane. Draw first" — this pane alone: the Inks pane under it keeps its look
// Round 1, read as: every line of the list runs from the eye's column (the pane's left, where its heading's eye and the
// thick line start); Dial on the marks' column, bold, as the group names Rings · Hands · Windows are made bold there; a
// hand's line gets a round mark like a ring's — the circle, two hands at 12 and 3 (an L); a window's mark an outlined
// rounded rectangle, not a filled one.
part = ".panel .form";
states = ["as drawn"];
css = `
  .colourlist:not(.inklist) > .row { margin-left: calc(-1 * var(--x-in)); padding-left: var(--x-in); }      /* the line from the pane's left */
  .colourlist:not(.inklist) > .row.showline > :first-child { left: calc(var(--nudge) - var(--eye) - var(--gap) + var(--x-in)); }      /* the dot keeps its place */
  .colourlist:not(.inklist) > .row.showsub .colhead, .colourlist:not(.inklist) > .row.showline.lead > label { color: var(--ink); font-weight: 600; font-size: var(--t-s); }
  .colourlist:not(.inklist) > .row.showline.lead > label { grid-column: 1 / span 2; }      /* Dial on the marks' column */
  .colourlist:not(.inklist) > .row.showline.lead > .mark { display: none; }
`;
setup = async () => {
  const t = window.dial_tool, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  t.S.windows[0].on = true; t.changed(true);      // a window shown, so its line is drawn too
  t.show_mode(true, true); await wait(400);
  t.S.ui_section = 5; t.show_section(); t.sync_rows(); await wait(400);
};
build = async () => {
  const $$ = (q) => [...document.querySelectorAll(q)], list = document.querySelector(".colourlist:not(.inklist)");
  const pane = list.closest(".pane"), x = list.firstElementChild.getBoundingClientRect().left - pane.getBoundingClientRect().left;
  list.style.setProperty("--x-in", x + "px");
  console.log(`measured the lines start ${x.toFixed(1)} px right of the pane's left`);
  const icon = (inside) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;
  const hand = icon(`<circle cx="12" cy="12" r="9"/><path d="M12 12V5.25"/><path d="M12 12H16.5"/>`);      // the circle, the minute hand at 12, the hour hand at 3
  const win = icon(`<rect x="7.25" y="8.75" width="9.5" height="6.5" rx="1.5"/>`);      // outlined
  for (const row of $$(".colourlist:not(.inklist) > .row.showline")) {
    const name = row.querySelector("label")?.textContent || "", mark = row.querySelector(".mark");
    if (name === "Dial") row.classList.add("lead");
    if (/hand$/.test(name)) mark.innerHTML = hand;
    if (/ at /.test(name) && mark.querySelector("rect")) mark.innerHTML = win;
  }
};
