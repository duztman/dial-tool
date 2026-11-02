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
// Round 4 (01:31: "The hr lines cut short, start from 2nd column for expanded items."): the lines from the pane's left only
// for what opens and closes and for Dial — the group names; the lines of the items inside a group start at the second
// column, the marks', as they did.
// Round 5 (01:34: "Hands seconds hand, on the discs date at 3, et. All multiple color parts get multiple lines per color
// and label."): a part of several colours opens as an expandable — its chevron, its name bold — and under it a line for
// each colour, named by what it colours (Hand · Cap; Frame · Disc · Figures · Neighbours), each with its pill. A part that
// shows and hides (the seconds hand): the chevron in its dot's place, the dot on the Hand line.
// Round 6 (01:39: "Check the row heights and paddings of the newly placed color rows, they are not up to code. Their lines
// do not extend to the second column, they start where the label starts, 3rd column. Lines only in between colors are
// white."): a colour's line, under its part: the line over it from where the names start (the third column); the lines
// between two colours white, from there too; the last colour's line as an item's (from the marks' column).
part = ".panel .form";
states = ["open", "Rings closed"];
css = `
  .colourlist > :is(.row.showsub, .row.showline.lead) { margin-left: calc(-1 * var(--x-in)); padding-left: var(--x-in); }      /* a group's line and Dial's from the pane's left; an item's from the marks' column */
  .colourlist > .row.showsub .colhead, .colourlist > .row.showline.lead > label { color: var(--ink); font-weight: 600; font-size: var(--t-s); }
  .colourlist > .row.showline.lead > label { grid-column: 1 / span 2; }      /* Dial on the marks' column */
  .colourlist > .row.showline.lead > .mark { display: none; }
  .colourlist > .row.showsub { position: relative; }
  .colourlist > .row.showsub > .chev { position: absolute; top: 0; bottom: 0; left: calc(var(--nudge) - var(--eye) - var(--gap) + var(--x-in)); width: var(--eye); display: grid; place-items: center; }
  .colourlist .chev { color: var(--grey); }
  .colourlist .chev:not(.open) svg { transform: rotate(-90deg); }
  .colourlist > .row.showline:has(> .chev) > label { color: var(--ink); font-weight: 600; }      /* an expandable line: bold */
  .colourlist > .row.showline.many > .mark { visibility: visible; }
  .colourlist > .row.showline:has(+ .row.part) { box-shadow: 0 calc(-1 * var(--hair)) 0 var(--row-rule); background: linear-gradient(var(--row-rule) 0 0) right bottom / calc(100% - var(--label-x)) var(--hair) no-repeat; }      /* a part over its colours: its line from the names' column */
  .colourlist > .row.part:has(+ .row.part) { box-shadow: none; background: linear-gradient(var(--white) 0 0) right bottom / calc(100% - var(--label-x)) var(--hair) no-repeat; }      /* between two colours: white, from the names' column */
  .colourlist > .row.part { box-shadow: inset 0 calc(-1 * var(--hair)) 0 var(--row-rule); }
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
  { const r = list.querySelector(".row.showline:not(.lead)"), lx = r.querySelector("label").getBoundingClientRect().left - r.getBoundingClientRect().left; for (const l of $$(".colourlist")) l.style.setProperty("--label-x", lx + "px"); console.log(`measured the names start ${lx.toFixed(1)} px into a line`); }
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
  // a part of several colours: an expandable, a line a colour under it (a single-pill line copied for each)
  const model = $$(".colourlist:not(.inklist) > .row.showline").find((r) => r.querySelector(".single .colour"));
  const hex = (c) => "#" + c.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("").toUpperCase();
  for (const row of $$(".colourlist > .row.showline")) {
    const sw = [...row.querySelectorAll(".swatches .swatch")];
    if (sw.length < 2) continue;
    const c = chev.cloneNode(true); c.classList.add("open"); c.removeAttribute("id");
    const dot = row.firstElementChild.matches(".eye") ? row.firstElementChild : null;      // a part that shows and hides: its dot goes to its first colour's line (the hand itself), the chevron takes its place
    row.replaceChild(c, row.firstElementChild);
    row.classList.add("many"); row.querySelector(".note")?.remove(); row.querySelector(".swatches").style.visibility = "hidden";
    let after = row;
    for (const s of sw) {
      let words = (s.title || s.dataset.tip || "").split(" · ").pop();
      if (/ hand$/.test(words)) words = "hand";      // the seconds hand's own colour: Hand
      const line = model.cloneNode(true); line.classList.add("part");
      line.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
      line.firstElementChild.replaceWith(document.createElement("i")); line.querySelector(".mark").innerHTML = "";
      line.querySelector("label").textContent = words[0].toUpperCase() + words.slice(1);
      const bg = s.style.getPropertyValue("--c") || getComputedStyle(s).backgroundColor, pill = line.querySelector(".colour");
      pill.querySelector(".dot").style.setProperty("--c", bg); pill.querySelector(".dot").style.background = bg; pill.querySelector(".hex").textContent = hex(bg);
      line.querySelector(".place")?.replaceChildren();      // the number's place kept, empty: a colour has no height of its own
      if (dot && s === sw[0]) line.firstElementChild.replaceWith(dot);
      after.after(line); after = line;
    }
  }
  for (const row of $$(".colourlist > .row.showline")) {
    const name = row.querySelector("label")?.textContent || "", mark = row.querySelector(".mark");
    if (name === "Dial") row.classList.add("lead");
    if (/hand$/.test(name) || ["Seconds", "Minutes", "Hours"].includes(name)) mark.innerHTML = hand;      // the Hands pane's lines too
    if (/ at /.test(name) && mark.querySelector("rect")) mark.innerHTML = win;
    if (/^\d+ parts$/.test(name)) mark.innerHTML = many;
    if (name === "Cap") mark.innerHTML = cap;
  }
  // measured: every line's height, its rule's colour, its label's left (R21)
  const rows = $$(".colourlist > .row").filter((r) => !r.hidden && r.querySelector(".colour")).map((r) => { const b = r.getBoundingClientRect(), p = r.querySelector(".colour").getBoundingClientRect(); return `${(r.querySelector("label")?.textContent || "").slice(0, 10)} ${b.height.toFixed(1)} pill ${(p.top - b.top).toFixed(1)}/${(b.bottom - p.bottom).toFixed(1)}`; });
  console.log("measured rows " + rows.join(" | "));
  const a = $$(".colourlist > .row.part")[0], b = $$(".colourlist > .row.showline").find((r) => r.querySelector("label")?.textContent === "Hour hand");
  console.log("measured kids " + [a, b].map((r) => [...r.children].map((k) => k.tagName + "." + k.className + ":" + Math.round(k.getBoundingClientRect().top - r.getBoundingClientRect().top) + "/" + Math.round(k.getBoundingClientRect().height)).join(",")).join(" || "));
};
