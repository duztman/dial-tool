// specs.js — Show Case 3D's watches as data: the cases (CASES) and the bracelets (BRACELETS). A new case is a row here.
// See kb/system.md, The one rule. Every number in mm.
// ── 1 · the specs: one case (the cushion was dropped in round 19 — Okay: "sub par"; its row is in the history), three bracelets ──────────────────────────────────────────────────────────────────────────
export const CASES = {
  // after the SPB143 / Submariner photographs: a round band with a belly and a polished chamfer, slab lugs with a flare in plan
  diver: { name: "Diver", plan: "round", R: 20.25, l2l: 47.6, lugw: 20, lugT: 2.9, flare: 3.6, zBand: 2.4, zTop: 9.3, belly: 0.3, chamfer: 0.9, flank: "polished",
    lug: { tipTop: 7.3, tipBot: 4.1, rootBot: 2.4, chamferTip: 0.75, holeIn: 1.6, corner: 0.8, fillet: 1.2, chamferIn: 0.25 },      // fillet: the soft blend where the lug leaves the body (Okay: soft is the default); chamferIn: the small break on the inner wall's top edge
    // the BEZEL STACK by named numbers, all relative (round 34): the ring's outer radius sits `inset` inside the body's, its inner `width` in from that;
    // the dial's face `dialUp` over the band top; the ring on a seat `seat` over the band top, `h` tall; its top chamfer `chamfer`; the insert in a
    // recess `lip` deep from the top (kind "rotating": the diver's separate turning ring with its insert and coin edge; "fixed": a plain pressed ring, no insert, no teeth), `inIn` / `inOut` in from the ring's inner / outer radius; the crystal's rim `rim` in from the
    // ring's inner radius, up `up` over the ring's top, its dome `dome` high; the rehaut's wall from the dial's face to `lip` under the ring's top
    bezel: { kind: "rotating", inset: 0.65, width: 3.3, dialUp: 0.7, seat: 0.3, h: 2.3, chamfer: 0.45, lip: 0.55, inIn: 0.4, inOut: 0.6, rim: 0.4, up: 0.65, dome: 1.35, teeth: { n: 60, depth: 0.5, fill: 0.62, chamfer: 0.45 } },
    crown: { at: 0, w: 6.4, h: 3.0, z: 6.0, flutes: 18 }, strap: "oyster" },
  // a DRESS case, first draft (round 36): Claude's numbers from turning the diver's sliders, not from photographs — Okay's Calatrava-type references will correct it
  dress: { name: "Dress", plan: "round", R: 18.5, l2l: 45, lugw: 20, lugT: 2.2, flare: 0.6, zBand: 1.8, zTop: 7.0, belly: 0.3, chamfer: 0.6, flank: "polished",
    lug: { tipTop: 5.2, tipBot: 2.6, rootBot: 1.8, chamferTip: 0.5, holeIn: 1.6, corner: 0.8, fillet: 1.5, chamferIn: 0.2 },
    bezel: { kind: "fixed", inset: 0.5, width: 2.2, dialUp: 0.7, seat: 0.3, h: 1.4, chamfer: 0.3, lip: 0.4, inIn: 0.4, inOut: 0.6, rim: 0.5, up: 0.4, dome: 1.8, teeth: { n: 60, depth: 0, fill: 0.62, chamfer: 0.45 } },
    crown: { at: 0, w: 4.6, h: 2.4, z: 4.4, flutes: 18 }, strap: "leather" },
};
// a bracelet: columns across (a share of the width, a section, which side faces out, half a pitch off or not, an optional
// finish "polished" for a column — the Sub's centre links; the goal's SPB143 is all brushed, so none here), and the
// taper laws from the case (W0, H0, P0) to the clasp (W1, H1, P1)
export const BRACELETS = {
  oyster: { W1: 18, P0: 8.4, P1: 7.0, H1: 2.6, gapx: 0.14, gap: 0.12, columns: [[0.31, "slab", -1, 0], [0.38, "slab", 0, 0.5], [0.31, "slab", 1, 0]] },
  barn: { W1: 18, P0: 8.0, P1: 6.8, H1: 2.8, gapx: 0.16, gap: 0.14, columns: [[0.30, "barn", -1, 0], [0.40, "barn", 0, 0.5], [0.30, "barn", 1, 0]] },
};

