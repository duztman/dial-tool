// movements.mjs — the movements' record for the tool: writes src/movements.js.
//
// The record is docs/research/movements.json (the study beside it, movements.md, has every number's source and tag). It
// is the ONE place a movement's numbers live (Okay, 10 Nov 2026: "i imagine you have slots, or a system for values about
// various movement types. If one was to find them and list them, you can adjust"). This script keeps what the tool and
// the 3D exercise read and works out each movement's hand heights by one rule. After the record changes:
//
//   cd web && node movements.mjs && node build.mjs          (node movements.mjs check: the test's stale check)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url));
const record = JSON.parse(fs.readFileSync(path.join(here, "../docs/research/movements.json"), "utf8"));

const HAND_T = 0.15;      // a hand's thickness where the maker prints none, mm (ours, not a maker's)
const STEP = 0.05;        // the Shadows pane's step: a worked-out height lands on it
const step = (x) => Math.round(x / STEP + 1e-9) * STEP, mm = (x) => +x.toFixed(3);
const SHORT = { "nh35": "NH35", "nh34": "NH34", "nh36": "NH36", "nh38": "NH38", "miyota-9015": "9015", "sw200-1": "SW200", "ronda-715": "715", "sw100": "SW100", "eta-6497-1": "6497", "miyota-2035": "2035", "miyota-8215": "8215", "any": "Imaginary" };

/** A movement's hand heights over the dial's face: each hand's underside, and the cap's top.
 *  · the maker prints where the hands sit (`hands_over_dial_top`: [underside, top] of each): those, the cap's top the
 *    seconds hand's top;
 *  · the maker prints the posts' tops over the dial's seat (`pipe_tops_over_dial_seat`): less the dial's thickness each
 *    hand has a space on its post — the hour hand from the face to the hour wheel's top, the minute hand from there to
 *    the cannon pinion's top, the seconds hand from there to the pinion's tip. A HAND_T hand lies in the middle of its
 *    space, to the pane's step; the cap's top is the tip. Where in its space a hand sits is then ours, not the maker's;
 *  · neither: null — the dial keeps its own heights. */
function heights(m) {
  const h = m.hands?.heights, dial = m.dial?.thickness ?? 0.4;
  if (h?.hands_over_dial_top) { const at = h.hands_over_dial_top; return { from: "maker", hour: at.hour[0], minute: at.minute[0], second: at.second[0], cap: at.second[1] }; }
  const p = h?.pipe_tops_over_dial_seat;
  if (p && p.hour != null && p.minute != null && p.second != null) { const top = [p.hour, p.minute, p.second].map((x) => x - dial), floor = [0, top[0], top[1]];
    const [hour, minute, second] = top.map((t, i) => mm(step(floor[i] + (t - floor[i] - HAND_T) / 2)));
    return { from: "posts", hour, minute, second, cap: mm(top[2]), room: top.map(mm) }; }
  return null;
}

/** The posts the hands stand on (#588), for a view from the side: `d` each post's Ø (the hand holes' — the hour wheel's
 *  pipe, the cannon pinion, the seconds pivot) and `top` each one's top over the dial's face. Where the maker prints the
 *  posts' tops, those less the dial; where it prints the hands' places, each hand's top (TMI's drawing has the hour wheel
 *  and the cannon pinion end flush with their hands' tops); else no tops. */
function posts(m) {
  const holes = m.hands?.holes, h = m.hands?.heights, dial = m.dial?.thickness ?? 0.4; if (!holes) return null;
  const d = { hour: holes.hour, minute: holes.minute, second: holes.second }, p = h?.pipe_tops_over_dial_seat, at = h?.hands_over_dial_top;
  const top = at ? { hour: at.hour[1], minute: at.minute[1], second: at.second[1] } : p && p.hour != null && p.minute != null && p.second != null ? { hour: mm(p.hour - dial), minute: mm(p.minute - dial), second: mm(p.second - dial) } : null;
  return { d, top };
}

// A SIBLING (#586; Okay, 11 Nov 2026: NH34 · NH36 · NH38 "as their own rows"): a row with `of` is that movement's record
// with `set` applied, each key a dotted path
const plain = Object.fromEntries(record.movements.filter((m) => !m.of).map((m) => [m.id, m]));
const resolved = (m) => { if (!m.of) return m; const r = JSON.parse(JSON.stringify(plain[m.of]));
  for (const [path, v] of Object.entries(m.set || {})) { const keys = path.split("."), last = keys.pop(); let at = r; for (const k of keys) at = at[k] = at[k] && typeof at[k] === "object" ? at[k] : {}; at[last] = v; }
  return { ...r, id: m.id, name: m.name, shown: m.shown, of: m.of, family: null }; };
/** what a movement can drive (#586, R16: a real movement removes what it can't): its seconds (central · small · none ·
 *  "central or none"), a GMT hand, the date window's places, a day window, the calendar hands. null: the Imaginary
 *  Movement — no limits */
function can(m) {
  if (m.id === "any") return null;
  const f = m.functions || {}, w = m.windows || {}, date = w.date && typeof w.date === "object" ? w.date : null, day = w.day && typeof w.day === "object" ? w.day : null;
  return { seconds: m.hands?.seconds ?? null, gmt: f.gmt === true, date_hand: f.date_hand === true, day_hand: f.day_hand === true, month_hand: f.month_hand === true,
    date: date ? date.positions ?? [] : [], date_default: date?.default ?? (date?.positions ?? [])[0] ?? null,
    day: day ? { positions: day.positions ?? [], r: day.window_r ?? null, aperture: day.aperture ?? null, date_part: day.date_part ?? null } : null,
    ampm: w.ampm === true, moon: w.moon === true };
}
const out = record.movements.map(resolved).map((m) => {
  const h = heights(m), date = m.windows?.date && typeof m.windows.date === "object" ? m.windows.date : null, dial = m.dial || {};
  return { id: m.id, name: m.name, short: SHORT[m.id] ?? m.name, kind: m.kind, shown: Boolean(m.shown),
    dial: m.id === "any" ? null : { d: dial.d ?? null, thickness: dial.thickness ?? null, hole: dial.hole ?? null },
    heights: h, posts: posts(m), hand_t: m.hands?.heights?.blade_thickness ?? null,
    crystal_clearance: m.case?.crystal_clearance ?? null,
    disc_under_face: date && date.disc_to_dial != null ? mm((dial.thickness ?? 0.4) + date.disc_to_dial) : null,
    date: date ? { positions: date.positions ?? [], r: date.window_r ?? null, aperture: date.aperture ?? null, disc_d: date.disc_d ?? null } : null,      // aperture: [along the radius, across]
    of: m.of ?? null, can: can(m), holes: m.hands?.holes ?? null };      // aperture: [along the radius, across]
});
const text = `// GENERATED by web/movements.mjs from docs/research/movements.json — do not edit; change the record, then run the script.
// A movement: what the tool and the 3D exercise read of it. \`heights\`: each hand's underside and the cap's top, mm over the
// dial's face (\`from\` "maker": printed by the maker · "posts": worked out from the posts' tops, see movements.mjs); null where
// the record has neither. \`hand_t\`: each hand's thickness where the maker prints it. \`crystal_clearance\`: from the top of
// the stack to the crystal. \`disc_under_face\`: the date disc's top under the dial's face. \`can\`: what it drives (null: no limits,
// the Imaginary Movement). \`holes\`: its hand holes' Ø. \`of\`: the movement a sibling is made from.
// \`posts\`: each post's Ø (\`d\`) and its top over the dial's face (\`top\`). \`HOLE_FIT\`: the posts' Ø where no movement is chosen —
// the tool's common hand holes (geometry.js HOLE_FIT; labels.mjs holds the two equal).
export const HAND_T = ${HAND_T};
export const HOLE_FIT = { hour: 1.5, minute: 0.9, second: 0.2 };
export const MOVEMENTS = ${JSON.stringify(out, null, 1)};
export const movement = (id) => MOVEMENTS.find((m) => m.id === id) ?? null;
`;
const file = path.join(here, "src/movements.js");
if (process.argv[2] === "check") { if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) { console.error("FAIL  src/movements.js is stale: cd web && node movements.mjs"); process.exit(1); } console.log("ok    src/movements.js is the record's"); }
else { fs.writeFileSync(file, text); console.log(`src/movements.js — ${out.length} movements, ${out.filter((m) => m.heights).length} with hand heights`); }
