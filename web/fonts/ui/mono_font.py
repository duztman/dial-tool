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
