// Show mode's Dial tab, the Colours pane (Okay, 3 Nov 2026, 01:13, his picture of it): "These separator lines, extend all
// the way to the start of this first column. Disc is not indented, is bold, as is hands and windows. Hands get round
// icons with hands in L formation in the same style as others. The window icon is not filled outlined (rounded
// rectangle) all for this pane. Draw first" — this pane alone: the Inks pane under it keeps its look
// Round 1, read as: every line of the list runs from the eye's column (the pane's left, where its heading's eye and the
// thick line start); Dial on the marks' column, bold, as the group names Rings · Hands · Windows are made bold there; a
// hand's line gets a round mark like a ring's — the circle, two hands at 12 and 3 (an L); a window's mark an outlined
// rounded rectangle, not a filled one.
// Round 2 (01:17: "Very good. Rings and hands get chevrons. Inks pane and all others get the same look. Expandables get
// chevrons and bold."): the same look on every list of the tab (Colours, Inks, Hands): lines from the pane's left, the
// group names bold in ink, the window mark outlined; Rings and Hands a chevron in the eye's column, as an ink's, that
// opens and closes their lines; every line with a chevron bold (an ink's "4 parts" too). States: open, Rings closed.
// Round 3 (01:27: "Windows also get chevron. These rules are for all items in these panes with multiples. "4 parts" gets
// two stacked outline disks, one covering the other, as a thumbnail, this means multiple items. Cap is weird on your
// drawing, is it hidden? Hidden row might get dotted outline instead of iris like others. If dial design did not come to
// show case with a cap, remove it?"): every group of the tab's lists a chevron (Rings · Hands · Windows; On the dial · On
// the discs · Disc depths); an ink of several parts marked by two outline discs, the front one covering the back one; a
// part hidden on the watch: its dot a dotted ring (the Minute ticks hidden, to show it); the Cap line a mark of its own
// (it has no dot: it shows and hides with its hand, and its line is there only while the dial has a cap).
part = ".panel .form";
states = ["open", "Rings closed"];
css = `
  .colourlist > .row { margin-left: calc(-1 * var(--x-in)); padding-left: var(--x-in); }      /* the line from the pane's left */
  .colourlist > .row.showline > :first-child { left: calc(var(--nudge) - var(--eye) - var(--gap) + var(--x-in)); }      /* the dot keeps its place */
  .colourlist > .row.showsub .colhead, .colourlist > .row.showline.lead > label { color: var(--ink); font-weight: 600; font-size: var(--t-s); }
  .colourlist > .row.showline.lead > label { grid-column: 1 / span 2; }      /* Dial on the marks' column */
  .colourlist > .row.showline.lead > .mark { display: none; }
  .colourlist > .row.showsub { position: relative; }
  .colourlist > .row.showsub > .chev { position: absolute; top: 0; bottom: 0; left: calc(var(--nudge) - var(--eye) - var(--gap) + var(--x-in)); width: var(--eye); display: grid; place-items: center; }
  .colourlist .chev { color: var(--grey); }
  .colourlist .chev:not(.open) svg { transform: rotate(-90deg); }
  .colourlist > .row.showline:has(> .chev) > label { color: var(--ink); font-weight: 600; }      /* an expandable line: bold */
`;
setup = async () => {
  const t = window.dial_tool, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  t.S.windows[0].on = true; t.changed(true);      // a window shown, so its line is drawn too
  const ticks = t.S.rings.findIndex((r) => (r.name || "").startsWith("Minute") || r.kind === 0); if (ticks >= 0) { t.S.rings[ticks].on = false; t.changed(true); }      // a ring hidden: its dot
  t.show_mode(true, true); await wait(400);
  t.S.ui_section = 5; t.show_section(); t.sync_rows(); await wait(400);
};
build = async (state) => {
  const $$ = (q) => [...document.querySelectorAll(q)], list = document.querySelector(".colourlist:not(.inklist)");
  const pane = list.closest(".pane"), x = list.firstElementChild.getBoundingClientRect().left - pane.getBoundingClientRect().left;
  for (const l of $$(".colourlist")) l.style.setProperty("--x-in", x + "px");
  // Rings and Hands: a chevron, as an ink's (its own drawing, copied), open pointing down
  const chev = document.querySelector(".inklist .chev");
  for (const sub of $$(".colourlist > .row.showsub")) {
    const word = sub.textContent.trim();
    const c = chev.cloneNode(true), open = !(state === "Rings closed" && word === "Rings");
    c.classList.toggle("open", open); c.removeAttribute("id"); sub.prepend(c);
    if (!open) for (let n = sub.nextElementSibling; n && !n.classList.contains("showsub"); n = n.nextElementSibling) n.hidden = true;
  }
  console.log(`measured the lines start ${x.toFixed(1)} px right of the pane's left`);
  const icon = (inside) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;
  const hand = icon(`<circle cx="12" cy="12" r="9"/><path d="M12 12V5.25"/><path d="M12 12H16.5"/>`);      // the circle, the minute hand at 12, the hour hand at 3
  const win = icon(`<rect x="7.25" y="8.75" width="9.5" height="6.5" rx="1.5"/>`);      // outlined
  // several parts: two outline discs, the front one covering the back (the back drawn only where the front leaves it)
  const many = icon(`<mask id="sk-many"><rect width="24" height="24" fill="#fff"/><circle cx="14" cy="13.5" r="6.25" fill="#000"/></mask><circle cx="10" cy="10.5" r="5.5" mask="url(#sk-many)"/><circle cx="14" cy="13.5" r="5.5"/>`);
  const cap = icon(`<circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/>`);      // a cap from above
  const hidden = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.25" cy="8.25" r="3.5" stroke-dasharray="1.1 1.2"/></svg>`;
  for (const e of $$(".colourlist .eye.seen[aria-pressed='false']")) e.innerHTML = hidden;
  for (const row of $$(".colourlist > .row.showline")) {
    const name = row.querySelector("label")?.textContent || "", mark = row.querySelector(".mark");
    if (name === "Dial") row.classList.add("lead");
    if (/hand$/.test(name) || ["Seconds", "Minutes", "Hours"].includes(name)) mark.innerHTML = hand;      // the Hands pane's lines too
    if (/ at /.test(name) && mark.querySelector("rect")) mark.innerHTML = win;
    if (/^\d+ parts$/.test(name)) mark.innerHTML = many;
    if (name === "Cap") mark.innerHTML = cap;
  }
};
