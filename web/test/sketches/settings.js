// Settings: a cog in the unit box's place, opening a white box with two settings (Okay, 31 Oct 2026, 01:49):
// "We are adding a settings icon. In place of mm. Icon drawing rules, a cog with a hole, outline. Opens a white box.
//  Inside two settings: unit, explain this applies everywhere on app. Colors cmyk hex whatever, selecting whatever opens
//  the color selector box to open default as, other colors still allowed, pill swatches still say hex codes unless ral."
// Round 1: the box shown open. Rows are the app's own (build_row: a seg row and a note row), not drawn copies.
part = ".panel > header";
below = 260;
tab = "Dial";
css = `
  .unitbox.cog { width: auto; height: auto; padding: var(--u1); display: grid; place-items: center; }
  .unitbox.cog > .word { display: none; }
  .settingsbox { position: absolute; z-index: 6; top: calc(100% + var(--unit)); right: 0; width: var(--box-w); border: var(--hair) solid var(--ink); background: var(--field); padding: 0 var(--u4); }
  .settingsbox > .row + .row:not(.note) { border-top: var(--hair) solid var(--rule); }
  .settingsbox > .row.note > .quiet { margin-top: 0; }      /* under a pill: clear of it (sketch: the canon has notes under fields and ticks, none yet under a pill) */
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
  row({ kind: "note", under: true, text: "Every length in the app is shown in it, and typed numbers are read in it." });
  t.S.ui_colour_as = 1;
  row({ kind: "seg", key: "ui_colour_as", text: "Colours", items: ["RGB", "HEX", "CMYK", "RAL"], scope: "" });
  row({ kind: "note", under: true, text: "The colour pop-out opens in it; the others stay a press away. Swatches show the hex code, or the RAL code in RAL." });
  $(".unit").append(box);
  const h = $(".panel > header"), hs = getComputedStyle(h);      // as wide as the header's rule: the panel's own columns fit inside
  box.style.setProperty("--box-w", (h.clientWidth - parseFloat(hs.paddingLeft) - parseFloat(hs.paddingRight)) + "px");
  box.querySelectorAll(".row").forEach((r) => r.hidden = false);
};
