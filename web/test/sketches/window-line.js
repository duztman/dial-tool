// The window's first pane under its Show box (Okay, 2 Nov 2026, 22:18: "Window at x needs a thick"): the thick black
// line every pane opens with, over "Window at 3" too, at the hand's distances — as much room from the Show box to the
// line as from the line to the heading (4b-lines-tabs.css: "Vertical gaps before after same").
part = ".panel .form";
tab = "Date";
setup = async () => { const b = document.querySelector(".showbox input[type=checkbox]"); if (!b.checked) b.click(); await new Promise((r) => setTimeout(r, 300)); };
css = `
  .form > .showbox + .pane:not(.headless) { margin-top: 0; border-top: var(--thick) solid var(--ink); }      /* the pane's own thick line back (4a-panel.css: 4a's "first pane under the pinned part" rule took it), a Show box's room (--u4) over it */
`;
