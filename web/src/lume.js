// lume.js — lume as a way of naming a colour: the colour pop-out's fifth mode, after RAL (#175; Okay, 2 Nov 2026,
// 22:25: "Lume is a swatch! Add it next to ral on colors. The lume research has names and such, implement them. It is
// treated as an ink."; 22:35: "Research ones only").
//
// The lumes are the research's (Dial Tool research, v31, §6.1, "The names lume is sold under", sourced there): each
// with its colour by day — the swatch, and what is drawn — its glow, and its strength against C3, the reference. The
// daylight colours are the research table's drawings, sRGB stand-ins as RAL's are: good for naming and choosing, never
// for matching a paint. The two tints are the research's illustrations, and say so. C7 and C9 have no colour there and
// are left out.
//
// A colour that is exactly a lume's is that lume: its chip carries a faded L, its pill says its name (C3), and in show
// mode it is an ink like any other, with its own height (geometry.js, ink_mm).

/** [name, by day, glow, its glow in a word, strength against C3, what it is] — the order the grid shows them */
export const LUMES = [
  ["C3", "#E4EAC2", "#8CF56A", "Green", "100 %", "pale yellow-green by day, glows green (515 nm); the reference"],
  ["BGW9", "#F4F4F0", "#62DDF5", "Blue-green", "95 %", "white by day, glows blue-green (485 nm); about 95 % of C3"],
  ["C5", "#E9EDB0", "#B7F06A", "Green", "89 %", "greenish-yellow by day; 89 % of C3, unsourced"],
  ["C1", "#F7F7F4", "#8CF56A", "Green, weaker", "31 %", "a white body, glows green, weaker; about 31 % of C3, unsourced"],
  ["Old radium", "#E6D3B0", "#E9A86A", "Weaker", "tint", "a tan tint in the body; glows weaker (the research's illustration)"],
  ["Dark red", "#D8574C", "#F0645A", "Red, faint", "22 %", "a red tint; about 22 % of C3, unsourced (the research's illustration)"],
].map(([name, hex, glow, glows, k, what]) => ({ name, hex, glow, glows, k, what }));

const BY_HEX = new Map(LUMES.map((l) => [l.hex, l]));
/** the lume a colour is exactly ("#E4EAC2"), or null */
export const lume_exact = (hex) => BY_HEX.get(String(hex).toUpperCase()) || null;
/** the lume of this name (any case), or null */
export const lume_by_name = (name) => LUMES.find((l) => l.name.toLowerCase() === String(name).trim().toLowerCase()) || null;
