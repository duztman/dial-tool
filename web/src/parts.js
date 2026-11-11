// parts.js — THE DIAL'S PARTS: what each part of a dial is and how it stands, for any view that builds the dial in depth
// (Show Case 3D first). One record per part; Dial Tool writes it, a 3D view reads it, and both read the stack's rules from here.
// Okay, 11 Nov 2026: "the rules in dial tool and 3d should be synced, caps for hands, hand thicknesses etc can also be decided
// from dial tool" — so the numbers the 3D view stands the hands by live in the tool, not in the view.
//
// A part's MAKE says how it is made, and so which numbers it has (all in mm):
//   plate     the dial's plate                                  metal: its bare metal (brass · bronze · steel · silver) when unpainted
//   printed   ink on the plate (a ring, its stroke, a frame)    ink: the ink's thickness
//   applied   a solid piece set on the plate (an index, a logo; height, section, edge (sharp · chamfer · round), material
//             an ink made Applied in show mode's Inks, #602)    (colour · brass · bronze · steel · silver · gold · lume)
//   hand      a hand's blade                                    over (its underside over the plate's face), t, section, hw, boss
//   on hand   ink on a hand (its lume, a painted mark)          — (flush in the hand's top)
//   cap       the cap over the hands                            over (its TOP over the plate's face), t
//   disc      a window's disc, under the plate                  under (how deep under the plate's face)
//   in window what a window shows, printed on its disc          —
//   case      the rehaut, the bezel, its insert                 — (the case is the view's own)
//   engraved  a marking cut into the metal it lies on (a bare   — (the cut's depth is the view's; Okay, 11 Nov 2026: "I need the
//             plate, the rehaut, a bezel's metal): Finish Engrave  ability to add these engravings instead of paint on metal")
// SECTION: a hand's or an applied part's cross-section, in the tool's Bevel words (geometry.js BEVEL_LOOKS) — flat · ridge ·
// faceted · domed. The tool draws Faceted as a Ridge (#573); a view may too. Nothing is applied yet: the make is ready for it.
// A record travels in a saved SVG as `data-` attributes (show.js `svg_facts` writes them, `read_part` reads them back), so a
// file and the tool's own state give a view the same parts.
import { HAND_T } from "./movements.js";

export const PARTS_V = 1;
/** the stack's rules: the numbers a view stands the hands, the cap and their pipes by, where a movement prints none (mm) */
export const STACK = {
  hand_t: HAND_T,      // a hand's thickness
  cap_t: 0.25,         // the cap's thickness (its height is its top)
  boss_t: 0.05,        // a boss's step on its hand
  pipe_wall: 0.2,      // a hand's own pipe round its post: its wall
  pipe_len: 0.4,       // …and how far it reaches under the blade
  clear: 0.4,          // from the top of the stack to the crystal (Miyota's)
};
export const SECTIONS = ["flat", "ridge", "faceted", "domed"];
export const MAKES = ["plate", "printed", "applied", "hand", "on hand", "cap", "disc", "in window", "case", "engraved"];      // appended only

const CASE = ["rehaut", "bezel", "bezel chamfer", "insert"], WINDOW = ["date number", "date picture", "disc print"];
/** a part's make, from its role in the engine's words (show.js) */
export const make_of = (role, hand) =>
  role === "plate" ? "plate" : role === "hand" ? "hand" : (role === "lume" || role === "mark") && hand ? "on hand" : role === "cap" ? "cap"
    : role === "date disc" ? "disc" : WINDOW.includes(role) ? "in window" : CASE.includes(role) ? "case" : role === "boss" ? "hand" : "printed";

const mm = (v) => +(+v).toFixed(3);
/** a record → its `data-` attributes as text. Every number the record has; the older words (bevel, dome) kept for older readers */
export function part_attrs(p) {
  const says = [["role", p.role], ["make", p.make]];
  if (p.make === "printed" || (p.make === "on hand" && p.ink != null)) says.push(["ink", mm(p.ink)]);
  if (p.hand) says.push(["hand", p.hand]);
  if (p.make === "plate" && p.metal) says.push(["metal", p.metal]);
  if (p.make === "applied") says.push(["height", mm(p.height)], ["section", p.section], ["edge", p.edge || "sharp"], ["material", p.material || "colour"]);
  if (p.make === "hand") { says.push(["over", mm(p.over)], ["t", mm(p.t)], ["section", p.section], ["hw", mm(p.hw)]);
    if (p.section !== "flat") says.push(["bevel", 1]); if (p.section === "domed") says.push(["dome", 1]); if (p.boss) says.push(["boss", mm(p.boss)]); }
  if (p.make === "cap") says.push(["over", mm(p.over)], ["t", mm(p.t)]);
  if (p.make === "disc") says.push(["under", mm(p.under)]);
  return says.map(([k, v]) => ` data-${k}="${v}"`).join("");
}
/** the dial's own attributes: its Ø, the record's version and the stack's rules */
export const dial_attrs = (d) => ` data-dial-d="${mm(d)}" data-parts="${PARTS_V}" data-stack="${Object.entries(STACK).map(([k, v]) => `${k}:${v}`).join(" ")}"`;

/** an element's `data-` attributes (a function: name → text or null) → its record. A file from before the record (v1.1.63–66)
 *  says role, ink, hand, over, under, bevel, dome, hw, boss: its make is worked out, its thicknesses are the stack's */
export function read_part(get) {
  const num = (k) => (get(k) == null ? null : +get(k)), role = get("role") || "ring", hand = get("hand") || null, make = get("make") || make_of(role, hand);
  const p = { role, make, hand };
  if (make === "plate" && get("metal")) p.metal = get("metal");      // bare: no paint over the metal (Okay, 11 Nov 2026: "Can 3d get these new bare metal dials?")
  if (make === "printed" || make === "on hand") { const ink = num("ink"); if (ink != null) p.ink = ink; }
  if (make === "applied") { p.height = num("height") ?? 0.3; p.section = get("section") || "flat"; p.edge = get("edge") || "sharp"; p.material = get("material") || "colour"; }
  if (make === "hand") { p.over = num("over"); p.t = num("t") ?? STACK.hand_t; p.hw = num("hw") ?? 0; p.boss = num("boss");
    p.section = get("section") || (num("dome") === 1 ? "domed" : num("bevel") === 1 ? "ridge" : "flat"); }
  if (make === "cap") { p.over = num("over"); p.t = num("t") ?? STACK.cap_t; }
  if (make === "disc") p.under = num("under");
  return p;
}
/** THE CASE round the dial as the tool sets it (Okay, 11 Nov 2026: "add bezel and rehaut there"): the rehaut's reach and rise
 *  and its colour; the bezel's kind and every number of its stack (the 3D exercise's own names, mm) and its insert's colour.
 *  null where that part is off. → `data-case`, its JSON (quotes written as &quot;) */
export const case_attrs = (c) => (c && (c.rehaut || c.bezel || c.body) ? ` data-case="${JSON.stringify(c).replace(/"/g, "&quot;")}"` : "");
export const read_case = (text) => { try { return text ? JSON.parse(text) : null; } catch (e) { return null; } };
/** the dial group's `data-stack` → the stack's rules (the tool's numbers where the file says none) */
export const read_stack = (text) => ({ ...STACK, ...Object.fromEntries(String(text || "").split(/\s+/).filter(Boolean).map((kv) => kv.split(":")).map(([k, v]) => [k, +v])) });
