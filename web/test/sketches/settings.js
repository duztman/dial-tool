// Settings: a cog in the unit box's place, opening a white box with two settings (Okay, 31 Oct 2026, 01:49):
// "We are adding a settings icon. In place of mm. Icon drawing rules, a cog with a hole, outline. Opens a white box.
//  Inside two settings: unit, explain this applies everywhere on app. Colors cmyk hex whatever, selecting whatever opens
//  the color selector box to open default as, other colors still allowed, pill swatches still say hex codes unless ral."
// 01:54, round 2: "narrower box, as wide as the green box" (drawn from x 120 to 442 of the 460 crop: five of the
// panel's columns, 5 --col + 4 --gap = 318); the notes cut to his words.
// 02:01, round 3: "Gray lines before after every row … there are good examples just below on your screenshot diameter
// and such"; "Titles on the left too far away. Bring them as close inner (right) as possible."
// 02:03, round 4: his hatching over the box's left 40 px: "Remove the shown area, window less wide" — the box as wide
// as what it holds: the names and the pills on two columns, nothing spare.
// Round 1: the box shown open. Rows are the app's own (build_row: a seg row and a note row), not drawn copies.
part = ".panel > header";
below = 260;
tab = "Dial";
css = `
  .unitbox.cog { width: auto; height: auto; padding: var(--u1); display: grid; place-items: center; }
  .unitbox.cog > .word { display: none; }
  .settingsbox { position: absolute; z-index: 6; top: calc(100% + var(--unit)); right: 0; width: max-content; border: var(--hair) solid var(--ink); background: var(--field); padding: var(--u2); }      /* --u2 in from every side: the grey lines over the first row and under the last stand clear of the black edge */
  .settingsbox > .row.note > .quiet { grid-column: 2; }      /* on the controls' column, as a pane's note (4c-rows.css, .body) */
  .settingsbox { display: grid; grid-template-columns: max-content max-content; }      /* two columns: the names, the controls */
  .settingsbox > .row { grid-column: 1 / -1; grid-template-columns: subgrid; }      /* every row on the box's two columns, so the names share one width */
  .settingsbox > .row > label { grid-column: 1; justify-self: end; text-align: right; }      /* the name against its controls, a column gap from them */
  .settingsbox > .row > :not(label) { grid-column: 2; }
`;
build = async () => {
  const t = window.dial_tool, $ = (q) => document.querySelector(q);
  // the cog: 8 teeth, outline, a hole; drawn at its size on screen (16), curves at CURVE 1.625 (R33, canon §9)
  const c = 8.25, R = 7, r = 5.25, hole = 2.5, n = 8, top = 0.16, foot = 0.24;      // centre on a quarter point; tooth tops and feet as fractions of a turn's eighth
  const P = (a, rr) => `${(c + rr * Math.sin(a)).toFixed(3)} ${(c - rr * Math.cos(a)).toFixed(3)}`;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 2 * Math.PI, s = (2 * Math.PI) / n;
    const a1 = a - s * foot, a2 = a - s * top, a3 = a + s * top, a4 = a + s * foot, a5 = a + s / 2 + 0.001;
    d += (k ? "" : `M${P(a1, r)}`) + `L${P(a2, R)}A${R} ${R} 0 0 1 ${P(a3, R)}L${P(a4, r)}A${r} ${r} 0 0 1 ${P(a + s - s * foot, r)}`;
  }
  const svg = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.625" stroke-linejoin="round"><path d="${d}Z"/><circle cx="${c}" cy="${c}" r="${hole}"/></svg>`;
  const b = $("#unit"); b.classList.add("cog"); b.title = "Settings"; b.insertAdjacentHTML("beforeend", svg);
  // the box: the app's own rows
  const box = document.createElement("div"); box.className = "settingsbox";
  const row = (r) => { const o = t.build_row(r); box.append(o.el); o.refresh(t.S); };
  row({ kind: "seg", key: "ui_unit", text: "Unit", items: ["mm", "pt", "in", "lig"], scope: "" });
  row({ kind: "note", text: "Every length in the app" });
  t.S.ui_colour_as = 1;
  row({ kind: "seg", key: "ui_colour_as", text: "Colours", items: ["RGB", "HEX", "CMYK", "RAL"], scope: "" });
  row({ kind: "note", text: "The colour pop-out opens in it" });
  $(".unit").append(box);
  box.querySelectorAll(".row").forEach((r) => r.hidden = false);
  box.querySelectorAll(".row.note").forEach((n) => { n.previousElementSibling.classList.add("noted"); n.dataset.after = "field"; });      // as sync_rows marks a row and its note: one box, the note just below the pill
  const q = getComputedStyle(box.querySelector(".row.note > .quiet")), wn = [...document.querySelectorAll(".row")].find((r) => !box.contains(r) && r.textContent.startsWith("Every width")), w = getComputedStyle(wn.lastElementChild);      // the app's own note under Weight %, for comparison
  console.log("measured:", JSON.stringify({ box: Math.round(box.getBoundingClientRect().width), note: [q.fontSize, q.color], weight_note: [w.fontSize, w.color] }));
};
