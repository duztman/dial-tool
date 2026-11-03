// #579, round 1 (3 Nov 2026, 12:15, "579, draw first"): show mode's Colours › Rings — each ring's line gets the dial
// side's 6-dot gripper, just before its colour swatch (Okay, 02:34: "Rings also need a 6 dot gripper and ring top-down
// arranger here as well. just before the color swatches. Like rings on tool side.").
// Drawn: the grip (icons.js TOOL_ICONS.grip, the ring list's, 4f-rings.css) at the end of the name's cell, so the
// swatch column stays where every line of the tab has it; the column gap (--u2) between grip and swatch. Its colour
// the ring list's: --rule, --grey on the row under the pointer. The drag itself (rings.js drag_ring) comes with the build.
part = ".colourlist:not(.inklist)";
tab = "Dial";
states = ["plain", "hover"];
setup = async () => {
  const t = window.dial_tool;
  t.changed(true); t.show_mode(true, true);
  await new Promise((r) => setTimeout(r, 300));
  t.S.ui_section = 5; t.show_section(); t.sync_rows();
  await new Promise((r) => setTimeout(r, 300));
  document.querySelector(".colourlist").scrollIntoView({ block: "start" });
  await new Promise((r) => setTimeout(r, 300));
};
css = `
  .colourlist > .row.showline > .grip { grid-column: 2; grid-row: 1; justify-self: end; display: grid; place-items: center; height: 100%; color: var(--rule); cursor: grab; touch-action: none; }   /* 4f-rings.css's grip, in the name's cell at its end (both placed outright, so they share the cell) */
  .colourlist > .row.showline:has(> .grip) > label { grid-column: 2; grid-row: 1; padding-right: calc(var(--u4) + var(--u2)); }      /* the name stops short of the grip: the icon's width plus a gap */
  @media (hover: hover) { .colourlist > .row.showline:hover > .grip { color: var(--grey); } }
`;
build = async (state) => {
  const rows = [...document.querySelectorAll(".colourlist:not(.inklist) > .row")];
  let group = null, first = null;
  for (const row of rows) {
    if (row.classList.contains("showsub")) { group = row.querySelector(".colhead").textContent; continue; }
    if (group !== "Rings" || !row.classList.contains("showline")) continue;
    const grip = document.createElement("span"); grip.className = "grip"; grip.title = "Drag to change the order";
    grip.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="currentColor" stroke="none"><circle cx="5.5" cy="4" r="1"/><circle cx="10.5" cy="4" r="1"/><circle cx="5.5" cy="8" r="1"/><circle cx="10.5" cy="8" r="1"/><circle cx="5.5" cy="12" r="1"/><circle cx="10.5" cy="12" r="1"/></g></svg>';      // icons.js: icon(TOOL_ICONS.grip), as the ring list draws it; the build uses that call
    row.querySelector("label").after(grip);
    first ??= row;
  }
  if (state === "hover") return { hover: ".colourlist:not(.inklist) > .row.showline:has(> .grip) > label" };      // the pointer on the name, as a hand over the row
};
