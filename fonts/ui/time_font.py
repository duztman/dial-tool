# time_font.py — the bar's time face (#284, beta 4.44): Barlow Condensed Light, cut down to what the time and AM · PM
# need, its colon smaller and centred on the figures. Packed into the page by build.mjs, as Silkscreen is.
#
#   python3 web/fonts/ui/time_font.py      (reads BarlowCondensed-Light.ttf beside it, writes DialTime-Light.ttf)
#
# Why these choices (Okay's notes, p. 15: "digits as thin as the box's line or whatever Barlow allows", "the colons
# centred and smaller", tabular figures, tight tracking):
#   - Light: its stems are 0.90 px at the time's 17 px, the box's line is 1 px (Thin 0.51, ExtraLight 0.66, Regular
#     1.21; measured 16 Oct 2026).
#   - The colon: Barlow's sits from the baseline to the x-height (5 to 444 of 1000). Here it is 80 % as large and its
#     middle stands at the figures' middle (350, half the cap height), in a width of 240 (194 in Barlow), so it has
#     room either side (4.44.6). An input can't style one character, so the change is made in the font itself.
#   - Tabular figures: the font's own (tnum), kept; the stylesheet asks for them.
#   - Its own family name, "Dial Time": the rings may load Barlow Condensed under its own name. Barlow (SIL OFL 1.1,
#     BarlowCondensed-OFL.txt beside it) names no Reserved Font Name; renaming a modified copy is the courteous way.
import os
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
SCALE, MIDDLE, COLON_W = 0.8, 350, 240      # the colon 80 %, on the figures' middle, 240 wide: more room either side (4.44.6; Okay: "more spaces both sides of :s"; 155 before, its ink 80)
KEEP = "0123456789:AMPamp. "      # the time, AM · PM, and what one may type into the time ("3:20 pm")

font = TTFont(os.path.join(HERE, "BarlowCondensed-Light.ttf"))
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
colon = cmap[ord(":")]
bounds = BoundsPen(glyphs); glyphs[colon].draw(bounds)
x0, y0, x1, y1 = bounds.bounds
width, lsb = font["hmtx"][colon]
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
new_width = COLON_W
dx = new_width / 2 - cx * SCALE      # the colon's middle in the middle of its new width
pen = TTGlyphPen(glyphs)
glyphs[colon].draw(TransformPen(pen, (SCALE, 0, 0, SCALE, dx, MIDDLE - cy * SCALE)))
font["glyf"][colon] = pen.glyph()
font["glyf"][colon].recalcBounds(font["glyf"])
font["hmtx"][colon] = (new_width, font["glyf"][colon].xMin)

for record in font["name"].names:      # the family's name, in every place a browser may read it
    if record.nameID in (1, 16): record.string = "Dial Time"
    elif record.nameID == 4: record.string = "Dial Time Light"
    elif record.nameID == 6: record.string = "DialTime-Light"
options = subset.Options()
options.layout_features = ["tnum", "kern"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(text=KEEP)
sub.subset(font)
out = os.path.join(HERE, "DialTime-Light.ttf")
font.save(out)
print(f"{out}: {os.path.getsize(out)} bytes; colon {width} → {new_width} wide, its middle at {MIDDLE}")
