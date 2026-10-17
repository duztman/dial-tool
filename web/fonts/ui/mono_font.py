# mono_font.py — the unit box's face (#302, beta 4.44.1): JetBrains Mono (SIL OFL), at the weight whose stem is as
# thick as the box's line, cut down to the units' letters. Packed into the page by build.mjs, as Silkscreen is.
#
#   python3 web/fonts/ui/mono_font.py      (reads JetBrainsMono[wght].ttf beside it, writes DialMono.ttf)
#
# Why (Okay, 16 Oct 2026: "use mono, abort silkscreen, border and letters should match, small"; then "Not system
# font, something universal … match the box please, and mm lowercase"):
#   - A packed face, not the system's monospace: the same letters on every machine.
#   - JetBrains Mono: its weight runs freely from 100 to 800, so a stem can be set to exactly one line's width; and of
#     the monospaced faces looked at (IBM Plex Mono, DM Mono, JetBrains Mono) it has the tallest lowercase (x-height
#     0.55), the most legible at 10 px (measured 16 Oct 2026).
#   - The weight: where a stem ("|") is 1 px at the box's 10 px — 100 of 1000 units — found by halving.
#   - Its own family name, "Dial Mono" (renaming a modified copy, as OFL asks of a Reserved Font Name; JetBrains Mono
#     names none).
import os
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "JetBrainsMono[wght].ttf")
STEM, KEEP = 100, "mptinlghou"      # a stem of 1 px at 10 px; the letters of mm · pt · in · lig · thou


def stem(weight):
    font = instancer.instantiateVariableFont(TTFont(SOURCE), {"wght": weight})
    glyphs = font.getGlyphSet(); pen = BoundsPen(glyphs)
    glyphs[font.getBestCmap()[ord("|")]].draw(pen)
    return pen.bounds[2] - pen.bounds[0]


lo, hi = 300.0, 600.0
for _ in range(20):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if stem(mid) < STEM else (lo, mid)
weight = round((lo + hi) / 2)
font = instancer.instantiateVariableFont(TTFont(SOURCE), {"wght": weight})
for record in font["name"].names:
    if record.nameID in (1, 16): record.string = "Dial Mono"
    elif record.nameID in (2, 17): record.string = "Regular"
    elif record.nameID == 4: record.string = "Dial Mono"
    elif record.nameID == 6: record.string = "DialMono"
font["OS/2"].usWeightClass = 400
options = subset.Options()
options.layout_features = ["kern"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(text=KEEP)
sub.subset(font)
out = os.path.join(HERE, "DialMono.ttf")
font.save(out)
print(f"{out}: {os.path.getsize(out)} bytes; weight {weight}, its stem {stem(weight):.1f} of 1000")

# each unit's ink, from the outlines themselves (4.44.3; Okay, on 4.44.1: the box's room uneven — a canvas measures
# a web face's ink differently from browser to browser): [left of the advance's start, width, top over the baseline,
# height], in em. app.js keeps them as UNIT_INK; the box is drawn round them (size_unit)
font = TTFont(out)
glyphs, cmap, hmtx, upm = font.getGlyphSet(), font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
ink = {}
for word in ["mm", "pt", "in", "lig", "thou"]:
    x, lo_x, hi_x, lo_y, hi_y = 0, None, None, None, None
    for ch in word:
        name = cmap[ord(ch)]; pen = BoundsPen(glyphs); glyphs[name].draw(pen); b = pen.bounds
        lo_x = x + b[0] if lo_x is None else min(lo_x, x + b[0]); hi_x = x + b[2] if hi_x is None else max(hi_x, x + b[2])
        lo_y = b[1] if lo_y is None else min(lo_y, b[1]); hi_y = b[3] if hi_y is None else max(hi_y, b[3])
        x += hmtx[name][0]
    ink[word] = [round(v / upm, 4) for v in (lo_x, hi_x - lo_x, hi_y, hi_y - lo_y)]
hhea = font["hhea"]
print(f"line: ascent {hhea.ascent / upm} · descent {-hhea.descent / upm} (hhea = typo = win, USE_TYPO_METRICS)")
print("const UNIT_INK = " + "{ " + ", ".join(f"{w}: [{', '.join(str(v) for v in ink[w])}]" for w in ink) + " };")
