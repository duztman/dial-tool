// The bar's time box, squeezed (Okay, 31 Oct 2026, 01:26, on his marked-up crop):
// "we need am's box narrower. Am text one px larger. red means the rest of the box shrinks that way. I need a wider time slider."
// His green marks: AM's room left of the word = right of it = the date's room left of "31" (all var(--u2)).
// Kept from the crop he liked (01:14, "This one looks promising"): the colons as thin upright rules, AM in NOW's kind of type.
part = ".bar .lead";
tab = "Dial";
css = `
  /* the time: a squeezed well, figures with a hairline rule where the colons were */
  .bar .timewell { padding: 0 var(--u2); }
  .bar .lead .timewell .time { display: none; }
  .bar .lead .timewell .clock { display: flex; align-items: center; gap: var(--u1); height: 100%; font-family: var(--time-face); font-size: var(--t-time); letter-spacing: var(--time-track); color: var(--bar-light); }
  .bar .lead .timewell .clock i { width: var(--hair); height: 0.75em; background: var(--bar-light); }
  /* AM: its box as narrow as its word plus --u2 each side; one px over NOW's size (--t-s 12 → --t-m 13) */
  .bar .lead .timebox .half { width: auto; padding: 0 var(--u2); font-size: var(--t-m); letter-spacing: var(--track-50); }
`;
build = () => {
  const well = document.querySelector(".bar .timewell"), [h, m, s] = document.querySelector(".bar .timewell .time").value.split(":");
  const c = document.createElement("div"); c.className = "clock";
  c.innerHTML = `<span>${h}</span><i></i><span>${m}</span><i></i><span>${s}</span>`;
  well.append(c);
};
