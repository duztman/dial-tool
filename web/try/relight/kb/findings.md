# Findings — what the photographs settled

Each line: the fact · the photographs it comes from (`refs.md` numbers) · whether the round-14 model has it. "Okay" marks what he said in words or drew. Facts are stated as the photographs show them, at the SPB143's size (Ø 40.5, lug to lug 47.6, lugs 20) unless said otherwise.

## The goal

- The target is a product photograph: three-quarter view from the lower right, a soft key light high at the upper left, steel reflecting a bright even room, the watch on tan leather with a soft contact shadow under it. (ref-01, ref-09; Okay: "this reference is the goal") — model: the Photo view and the studio, yes.
- Straight-down ("Top") is the app's view and stays the default; the photo view is for the look. (Okay) — yes.
- Edit mode's SVG paints are out of scope; this is the Photo look only. (Okay) — yes.

## The lug

- A lug is a **slab** leaving the case **band** (the mid-case), not the caseback: flat brushed top, polished flank, a **wide polished chamfer** along the top edge that runs the whole length to the tip and is the lug's brightest line. (ref-11, ref-12, ref-20, ref-21) — yes (round 14).
- The **tip is a flat end face**, cut square and chamfered — not a half-round round the hole. (ref-11, ref-21, ref-22; round 13's half-round was wrong) — flat face yes; its chamfer not yet.
- The lug **falls and thins** toward the tip in the side view: top down from the case top, underside rising a little; tip about 3.2 thick at the Seiko's. (ref-12, ref-21; Okay's side drawing ref-26: "one solid, not clipped walls") — yes: laws `lugTop(u)`, `lugBot(u)`.
- The spring-bar **hole is a small drilled dot** in the flank, a bit above mid-height, about 1.6 in from the tip. Nothing more is visible. (ref-11, ref-20, ref-22) — yes (a dot with a bright rim; not a true bore).
- In plan the outer edge **flares** into the case on the diver (lugPath's curve). (ref-09) — yes.
- The lug's chamfer **continues as the band's chamfer**: one line round the whole case. (ref-12, ref-22) — yes.

## The case band and back

- The band is a tall wall (brushed on the Sub with numbers engraved; polished on the Seiko), with a slight **belly** (fullest at mid-height) and a polished chamfer at the top. The **caseback is a separate polished step** below it. (ref-12, ref-20, ref-21) — yes.
- The bezel is a **separate ring** sitting on a seat at the top of the band; under it the case top is a flat brushed plate. (ref-19, ref-23) — yes.
- A Seiko-style cushion was built (ref-19) and dropped in round 19 (Okay: "sub par"); the model is the diver only.

## The end link

- Sits **inside the lug tips** (the tips extend past it) and **below the lug tops**; a flat brushed block; its **nose a full half-round**; its inner edge the case's curve. (ref-10, ref-09; Okay's markup ref-25: "should follow the lugs' slope") — yes: swept across its width, top = lug top − 0.35.
- The spring bar passes through it; the first row hinges at its far end. (ref-13) — yes.

## The bracelet

- **A link is a barrel in the side view**: its two ends full half-rounds of its thickness, so neighbours' quarter-rounds fall away into a valley that goes dark while the crests catch light — that, not a drawn gap, is a seam. Brushing runs along the bracelet. (ref-15, ref-18, ref-04; Okay: "links don't seem connected" → fixed by the rounds, round 8) — yes.
- **Rows hinge on pins**; the pins lie on the bracelet's curve; a link spans pin to pin and tilts by the line between them. (ref-13, ref-18) — yes (round 8's sign bug: tilt must be −θ).
- Three **sections** seen: **bean** (round corners, flat polished flanks with a screw head each end), **barn** (flat top, 45° polished shoulders, vertical brushed flanks), **slab** (a box with one bright polished bevel on the outer top edge, the rest brushed — the Oyster). The **Jubilee** is five columns: two bean outers brushed, three small polished barrels. (ref-15, ref-16, ref-21, ref-02) — yes, as `link(sec)`.
- The **centre column is half a pitch off** the outer ones (the brick pattern); every column's links are the same length. (ref-04, ref-09, ref-18) — yes.
- **Tapers in every dimension**: width (20 → ~18), thickness (~3.9 → ~3.0), and the **pitch** (fat bricks at the case, smaller toward the clasp). (ref-07, ref-04; Okay: "thick to thin, in all dimensions") — yes: `W0/W1, H0/H1, P0/P1`.
- The outermost links' **outer face is convex**, the tops a slight pillow; **screw heads** flush on the outer flanks. (ref-15, ref-18) — pillow and screws yes; the convex face dropped in round 14 (open).
- The bracelet lies **level past the lugs, then down onto the table, then flat**. (ref-09) — yes.
- Real Oyster outer links are C-shaped and wrap the centre link's ends; from above only the seam grid shows, so the model butts them. (ref-18) — by design.

## The bezel and crown

- Coin-edge **teeth are prismatic blocks** with flat faces and gaps between, chamfered on top — not a ripple. Counts seen: ~60 wide (Baltic), 120 fine (Sub). (ref-24, ref-20, ref-19) — yes: one block carried round, `teeth: { n, depth, fill, chamfer }`.
- The bezel ring is a plain lathe under the teeth; the insert a thin flat ring on top with printed numerals (feet to the centre, none upside down), long marks at the fives, dots at the minutes, a lume dot in the triangle. (ref-23, ref-09) — yes.
- The **crown is fluted** (half-round grooves, flat lands), its rim chamfered, its cap domed; it stands off the case on a tube. (ref-24) — yes.

## The leather strap (ref-29…34) — nothing of this is in the model yet; the leather today is a rounded bar with a torus keeper

- A strap is a **flat band with a slight pillow**, 2.5–4 mm thick (thin calf ref-29; thick "vintage" ref-31/34), its **edges cut square and burnished dark**, the layers showing on the edge (ref-32, ref-34). Not a rounded bar.
- The **lug end is cut square**, sits just past the body's curve (a gap of about a millimetre at the middle; the body is round, the end straight), a hair inside the tips, its top a little under the lug tops; the spring bar runs through a **tunnel in the folded end** (ref-31, ref-32, ref-33). It leaves the lugs level, then falls (ref-29).
- **Stitching**: either a line along both edges about 1 mm in (ref-29), or the vintage way — two heavy stitches across the lug end only and a stitched fold at the tip (ref-31, ref-34). Thread lighter than the leather.
- **Keepers**: flat strips ~6 mm wide of the same leather, one fixed (stitched) near the buckle and one floating; they sit flat on the strap, not rings (ref-31, ref-34).
- **Buckle**: a thin wire tang buckle — a frame, a tongue, the bar — polished or brushed, on the short end (ref-34, ref-31).
- **The long end**: six holes in a line, a rounded-pointed tip (ref-34); the short end square with the buckle.
- **Surface**: smooth calf is matte-satin with a soft broad highlight (ref-29, ref-34); pebbled leather has a grain of ~1 mm cells (ref-30); the colour deepens where the strap bends and at the burnished edge; a low clearcoat, not a metal sheen.
- **The lie in a product shot**: ends open on the table, the short end with the buckle up, the long end straight or curling (ref-30, ref-34); or crossed as a display (ref-31).

## Light and material

- Steel in these photographs reflects a **bright, even room** with a few brighter panels; polished faces mirror it, brushed faces smear it along the grain. A **black card over the lens** keeps the crystal and the polished tops from throwing the ceiling back at a camera above. (ref-01, ref-15) — yes: the studio and the flag.
- **Ambient occlusion** does what the sun can't: the creases between links, the seat under the bezel, the slot between the lugs. (all) — yes: GTAO.
- The dial plate is a **sunburst** (radial brushing under lacquer); markers are **applied** (stand proud, cast shadows); lume is milky and glows. (ref-01, ref-09) — sunburst and applied yes; lume not yet.

## What the photographs do NOT give (measure or ask)

- Exact band height and caseback step of the SPB143 (taken as 2.4 and 9.3 from the published 13.2 total).
- Lug underside: whether hollowed (one glimpse in ref-10 says flat with a chamfer).
- The clasp: nothing built; ref-05/06/08 show it.
