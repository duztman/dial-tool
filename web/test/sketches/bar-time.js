// The bar's time box, squeezed (Okay, 31 Oct 2026, 01:26, on his marked-up crop):
// "we need am's box narrower. Am text one px larger. red means the rest of the box shrinks that way. I need a wider time slider."
// His green marks: AM's room left of the word = right of it = the date's room left of "31" (all var(--u2)).
// 01:35, round 2: "Notice the gaps" (each rule the same ink distance from the figure before and after it);
// "Am and now vertically centered within the green lines" (their ink's middle on the time's ink's middle).
// 01:39: "Vertical rules: lines have gap between them" — each rule split in two;
// 01:41: "The hr gaps before after line segments should be equal" — the gap inside the rule = the gap either side (--clock-gap).
// Kept from the crop he liked (01:14): the colons as thin upright rules, AM in NOW's kind of type.
part = ".bar .lead";
tab = "Dial";
css = `
  .bar .lead { --clock-gap: 4px; }      /* ink of a figure to its rule, both sides: a sketch value, not yet on the unit scale */
  .bar .timewell { padding: 0 var(--u2); }
  .bar .lead .timewell .time { display: none; }
  .bar .lead .timewell .clock { display: flex; align-items: center; height: 100%; font-family: var(--time-face); font-size: var(--t-time); letter-spacing: var(--time-track); color: var(--bar-light); }
  /* each rule two lines with a gap between them, like a colon drawn long (01:39: "lines have gap between them") */
  .bar .lead .timewell .clock i { flex: none; width: var(--hair); height: 0.75em; background: linear-gradient(var(--bar-light) calc(50% - var(--clock-gap) / 2), transparent 0 calc(50% + var(--clock-gap) / 2), var(--bar-light) 0); }
  .bar .lead .timebox .half { width: auto; padding: 0 var(--u2); font-size: var(--t-m); letter-spacing: var(--track-50); }
`;
build = async () => {
  const $ = (q) => document.querySelector(q);
  const well = $(".bar .timewell"), [h, m, s] = $(".bar .timewell .time").value.split(":");
  const c = document.createElement("div"); c.className = "clock";
  c.innerHTML = `<span id="k0">${h}</span><i id="r0"></i><span id="k1">${m}</span><i id="r1"></i><span id="k2">${s}</span>`;
  well.append(c);
  await document.fonts.ready;
  // each rule: the same ink distance to the figure before it and the one after
  const gap = parseFloat(getComputedStyle(c).getPropertyValue("--clock-gap"));
  for (let n = 0; n < 4; n++) for (const k of [0, 1]) {      // measured again after the first pass: rounding to screen dots
    const a = await ink(`#k${k}`), r = await ink(`#r${k}`), b = await ink(`#k${k + 1}`), st = $(`#r${k}`).style;      // the rule as drawn, on its screen dots
    st.marginLeft = (parseFloat(st.marginLeft || 0) + gap - (r.left - a.right)) + "px";
    st.marginRight = (parseFloat(st.marginRight || 0) + gap - (b.left - r.right)) + "px";
  }
  // AM and NOW: their ink's middle on the time's ink's middle
  const t = await ink(".bar .timewell"), mid = (t.top + t.bottom) / 2;
  for (const q of [".bar .lead .timebox .half", ".bar .lead #now"]) {
    const word = $(q).querySelector(".ink") || $(q);
    word.style.position = "relative";
    let dy = 0;
    for (let n = 0; n < 3; n++) { const e = await ink(q); dy += mid - (e.top + e.bottom) / 2; word.style.top = dy + "px"; }      // moved, measured again, till it stands
  }
  const out = {};
  for (const k of [0, 1]) { const a = await ink(`#k${k}`), r = await ink(`#r${k}`), b = await ink(`#k${k + 1}`); out["rule" + k] = [+(r.left - a.right).toFixed(2), +(b.left - r.right).toFixed(2)]; }
  const t2 = await ink(".bar .timewell");
  for (const q of [".bar .lead .timebox .half", ".bar .lead #now"]) { const e = await ink(q); out[q.split(" ").pop()] = +(((e.top + e.bottom) - (t2.top + t2.bottom)) / 2).toFixed(2); }
  console.log("measured:", JSON.stringify(out));
};
