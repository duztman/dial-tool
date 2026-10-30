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
// 02:06, round 5: "Red marked vertical gaps look excessive. Are they up to code? Even so, reduce, equalize with line and
// its after. Bg of popout box darker, and where is thou?" — pill to note = note to the line after it = the line before
// a row to its pill, measured off the screen; the box on the panel's grey (--well); thou listed (the app's own units).
// 02:07, round 6: "No box around cog icon unless hover and click." — three states: closed, under the pointer, open.
// 02:10, round 7: "lines … need to turn white or darker gray? What are rules! … Why are you not just implementing them
// but inventing things?" — the rule (1-tokens.css): a row's line is white on grey, the scrolling grey on paper; a part
// that sets its ground sets --row-rule with it. This box stands on grey, so its lines are --line-on-grey (white).
// "Red marked paddings are halved. Left side of the box does not shrink, texts move closer to pills": the name to its
// pill --gap → --u2; the box keeps its width, the room going to its left padding.
// 02:11: "Cog hover outline is original icon gray."
// 02:12: "Cogs teeth wider, inner hole is just a dot, slightly thinner outline."
// Round 1: the box shown open. Rows are the app's own (build_row: a seg row and a note row), not drawn copies.
part = ".panel > header";
states = ["closed", "hover", "open"];
below = 260;
tab = "Dial";
css = `
  .unitbox.cog { width: auto; height: auto; padding: var(--u1); display: grid; place-items: center; }
  .unitbox.cog > .word { display: none; }
  .unitbox.cog { border-color: transparent; }      /* no frame at rest */
  .unitbox.cog { --cog: color-mix(in srgb, var(--ink) calc(var(--faint) * 50%), transparent); }      /* the cog's own grey: the unit box's resting colour */
  @media (hover: hover) { .unitbox.cog:hover { color: var(--cog); border-color: var(--cog); background: none; } }      /* 02:16: "Hover icon no bg" */      /* under the pointer the frame in the cog's own grey, the cog unchanged (02:11: "Cog hover outline is original icon gray"); open, the app's chosen look (5-chosen.css: ink, the cog in paper) */
  .unitbox.cog[aria-expanded="true"] { border-color: var(--ink); }      /* this sketch's styles stand outside the layers, so the chosen frame is said again */
  .settingsbox { position: absolute; z-index: 6; top: calc(100% + var(--unit)); right: 0; width: max-content; border: var(--hair) solid var(--ink); background: var(--well); --row-rule: var(--line-on-grey); padding: var(--u2) var(--u2) var(--u2) var(--gap); column-gap: var(--u2); }      /* on grey: white lines (1-tokens.css); left padding takes what the halved gap gives back, so the box keeps its width */      /* --u2 in from every side: the grey lines over the first row and under the last stand clear of the black edge */
  .settingsbox > .row.note > .quiet { grid-column: 2; }      /* on the controls' column, as a pane's note (4c-rows.css, .body) */
  .settingsbox { display: grid; grid-template-columns: max-content max-content; }      /* two columns: the names, the controls */
  .settingsbox > .row { grid-column: 1 / -1; grid-template-columns: subgrid; column-gap: var(--u2); }      /* every row on the box's two columns, so the names share one width */
  .settingsbox > .row > label { grid-column: 1; justify-self: end; text-align: right; }      /* the name against its controls, a column gap from them */
  .settingsbox > .row > :not(label) { grid-column: 2; }
`;
build = async (state) => {
  const t = window.dial_tool, $ = (q) => document.querySelector(q);
  // the cog: 8 teeth, outline, a dot at its centre; drawn at its size on screen (16); its line LINE 1.5, one canon step under CURVE (02:12: "slightly thinner outline"; R33, canon §9); the dot a fill, not a line
  const c = 8.25, R = 7, r = 5.25, hole = 1.25, n = 8, top = 0.19, foot = 0.28;      // 02:12: "teeth wider" (top 0.16 → 0.19, foot 0.24 → 0.28, ~18 %); "inner hole is just a dot" (a filled dot, r 1.25)      // centre on a quarter point; tooth tops and feet as fractions of a turn's eighth
  const P = (a, rr) => `${(c + rr * Math.sin(a)).toFixed(3)} ${(c - rr * Math.cos(a)).toFixed(3)}`;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 2 * Math.PI, s = (2 * Math.PI) / n;
    const a1 = a - s * foot, a2 = a - s * top, a3 = a + s * top, a4 = a + s * foot, a5 = a + s / 2 + 0.001;
    d += (k ? "" : `M${P(a1, r)}`) + `L${P(a2, R)}A${R} ${R} 0 0 1 ${P(a3, R)}L${P(a4, r)}A${r} ${r} 0 0 1 ${P(a + s - s * foot, r)}`;
  }
  const svg = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="${d}Z"/><circle cx="${c}" cy="${c}" r="${hole}" fill="currentColor" stroke="none"/></svg>`;
  const b = $("#unit"); b.classList.add("cog"); b.title = "Settings"; b.insertAdjacentHTML("beforeend", svg);
  // the box: the app's own rows
  const box = document.createElement("div"); box.className = "settingsbox";
  const row = (r) => { const o = t.build_row(r); box.append(o.el); o.refresh(t.S); };
  row({ kind: "seg", key: "ui_unit", text: "Unit", items: [...document.querySelectorAll("#unit-menu button")].map((b) => b.id.slice(5)), scope: "" });
  row({ kind: "note", text: "Every length in the app" });
  t.S.ui_colour_as = 1;
  row({ kind: "seg", key: "ui_colour_as", text: "Colours", items: ["RGB", "HEX", "CMYK", "RAL"], scope: "" });
  row({ kind: "note", text: "The colour pop-out opens in it" });
  $(".unit").append(box);
  b.setAttribute("aria-expanded", String(state === "open"));
  if (state !== "open") { box.style.display = "none"; return state === "hover" ? { hover: "#unit" } : null; }
  box.querySelectorAll(".row").forEach((r) => r.hidden = false);
  box.querySelectorAll(".row").forEach((r, i) => r.id ||= "set-row-" + i);
  box.querySelectorAll(".row.note").forEach((n) => { n.previousElementSibling.classList.add("noted"); n.dataset.after = "field"; });      // as sync_rows marks a row and its note: one box, the note just below the pill
  const q = getComputedStyle(box.querySelector(".row.note > .quiet")), wn = [...document.querySelectorAll(".row")].find((r) => !box.contains(r) && r.textContent.startsWith("Every width")), w = getComputedStyle(wn.lastElementChild);      // the app's own note under Weight %, for comparison
  console.log("measured:", JSON.stringify({ box: Math.round(box.getBoundingClientRect().width), name_to_pill: +(box.querySelector(".row.seg > :not(label)").getBoundingClientRect().left - box.querySelector(".row.seg > label").getBoundingClientRect().right).toFixed(1), line: getComputedStyle(box.querySelector(".row.seg")).boxShadow.slice(0, 22), note: [q.fontSize, q.color], weight_note: [w.fontSize, w.color] }));
  // the gaps, on the ink: g = the line over a row to the top of its pill; the note's words g under the pill, the line g under them
  await document.fonts.ready;
  const before = {};
  for (const r of box.querySelectorAll(".row.note")) {
    const row = r.previousElementSibling, pill = row.querySelector(":scope > :not(label)"), words = r.querySelector(".quiet");
    const line = row.getBoundingClientRect().top, p = pill.getBoundingClientRect(), g = p.top - line;
    words.id ||= r.id + "-w";
    const w = await ink("#" + words.id), end = r.getBoundingClientRect().bottom;
    before[r.id] = [+(w.top - p.bottom).toFixed(1), +(end - w.bottom).toFixed(1), +g.toFixed(1)];
    const mt = parseFloat(getComputedStyle(words).marginTop), pb = parseFloat(getComputedStyle(words).paddingBottom);
    words.style.marginTop = (mt + g - (w.top - p.bottom)) + "px";
    words.style.paddingBottom = (pb + g - (end - w.bottom)) + "px";
  }
  const after = {};
  for (const r of box.querySelectorAll(".row.note")) {
    const row = r.previousElementSibling, p = row.querySelector(":scope > :not(label)").getBoundingClientRect(), w = await ink("#" + r.id + "-w");
    after[r.id] = [+(w.top - p.bottom).toFixed(1), +(r.getBoundingClientRect().bottom - w.bottom).toFixed(1), +(p.top - row.getBoundingClientRect().top).toFixed(1)];
  }
  console.log("measured gaps [pill→words, words→line, line→pill]:", JSON.stringify({ before, after }));
};
