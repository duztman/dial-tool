// #175's lume view, round 1 — the interface first (Okay, 3 Nov 2026, 13:34: "let's draw the night mode as a whole, first
// the ui then the actual what happens to the canvas part"). His spec, 01:06: "Light gets another pill selector, top:
// day/night. Night is lume mode. Lume mode opens up a slider below for lume decay. Sun is replaced by the "moon" below
// and color theory-accurate darkness filter applied. Moon strength defaults to 50%."
// Drawn on the Light tab, from its own rows (nothing imitated): a Day · Night pill row first in the pinned band, over
// Style and Lighting (the Style row cloned, its words changed); on Night a "Lume decay %" row under the pill (the Strength
// row cloned); the Sun pane reads Moon, its disc a crescent without rays, Strength 50; the rest of the pane as it is.
// Open readings, asked with the picture: the pill row's own name (drawn "Time"); the decay's unit (drawn %, 0 fresh).
part = ".panel";
tab = "Dial";
below = 0;
states = ["Day", "Night"];
setup = async () => {
  const t = window.dial_tool, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  t.changed(true); t.show_mode(true, true); await wait(300);
  document.querySelector('button[data-tab="Light"]').click(); await wait(400);
};
css = `
  .sunbox .sunpic .sun.moon .rays { display: none; }
  .sunbox .sunpic .sun.moon .shade { fill: var(--column-solid); }      /* the crescent: the pane's ground laid over the disc */
`;
build = async (state) => {
  const $ = (q) => document.querySelector(q), rows = [...document.querySelectorAll(".panel .pinned .row.seg, .panel .form .row")];
  const style = rows.find((r) => r.querySelector("label")?.textContent === "Style");
  // the Day · Night pill, the Style row's twin, first in the band
  const pill = style.cloneNode(true); pill.querySelector("label").textContent = "Time";
  const [a, b] = pill.querySelectorAll(".segs button, .pillswitch button"); a.textContent = "Day"; b.textContent = "Night";
  a.classList.toggle("on", state === "Day"); b.classList.toggle("on", state === "Night");
  pill.querySelectorAll("[id]").forEach((e) => { e.id = "sketch-" + e.id; });
  style.before(pill);
  if (state === "Night") {
    // the decay slider under the pill, the Strength row's twin
    const strength = rows.find((r) => r.querySelector("label")?.textContent === "Strength %");
    const decay = strength.cloneNode(true); decay.querySelector("label").textContent = "Lume decay %";
    decay.querySelectorAll("[id]").forEach((e) => { e.id = "sketch-" + e.id; });
    const range = decay.querySelector('input[type="range"]'), field = decay.querySelector("input:not([type=range])");
    if (range) range.value = 20; if (field) field.value = "20";
    pill.after(decay);
    // the Sun pane is the Moon's: its heading, Strength 50, the disc a crescent, no rays
    const h2 = [...document.querySelectorAll(".panel .form h2")].find((h) => h.textContent.trim().startsWith("Sun")); if (h2) h2.firstChild.textContent = "Moon";
    const srange = strength.querySelector('input[type="range"]'), sfield = strength.querySelector("input:not([type=range])"); if (srange) srange.value = 50; if (sfield) sfield.value = "50";
    const sun = $(".sunbox .sun"); sun.classList.add("moon");
    const disc = sun.querySelector("circle"), shade = disc.cloneNode(); shade.setAttribute("class", "shade"); shade.setAttribute("r", "6.2"); shade.setAttribute("cx", "3.2"); shade.setAttribute("cy", "-2.4"); sun.append(shade);
  }
};
