# mono_font.py — the tool's mono, Dial Mono (#302, beta 4.44.1; the whole interface's mono since v1.0.5 beta, Okay,
# 30 Oct 2026: "go with dial mono for all then, but try not to change shapes"): JetBrains Mono (SIL OFL), at the weight
# whose stem is as thick as the unit box's line, with a plain 0, cut down to what the interface sets in mono. Two cuts:
# the regular, and a semibold (600) for the bar's names. Packed into the page by build.mjs, as Silkscreen is.
#
#   python3 web/fonts/ui/mono_font.py      (reads JetBrainsMono[wght].ttf beside it, writes DialMono.ttf and DialMono-Semi.ttf)
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
STEM = 100      # a stem of 1 px at 10 px
# what the interface sets in mono: the units' letters, the figures (Okay, 18 Oct 2026, notes 2: "Large mono numbers for
# size and radius, slashless 0 if possible" — JetBrains Mono's 0 has a dot, taken out below), and since v1.0.5 beta
# every printable ASCII character and the few more the log, a link, a hex, a RAL code and the bar need
KEEP = "".join(chr(c) for c in range(32, 127)) + "≈·×—–°…‘’“”→←↑↓"


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
def cut(weight, style, out_name, weight_class):
    font = instancer.instantiateVariableFont(TTFont(SOURCE), {"wght": weight})
    for record in font["name"].names:
        if record.nameID in (1, 16): record.string = "Dial Mono"
        elif record.nameID in (2, 17): record.string = style
        elif record.nameID == 4: record.string = "Dial Mono " + style
        elif record.nameID == 6: record.string = "DialMono-" + style
    font["OS/2"].usWeightClass = weight_class
    options = subset.Options()
    options.layout_features = ["kern"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    sub = subset.Subsetter(options)
    sub.populate(text=KEEP)
    sub.subset(font)
    # a plain 0: JetBrains Mono's has a dot in its counter (and a slash as its "zero" feature); its smallest contour, the
    # dot, goes, so the figure is a plain oval (notes 2: "slashless 0 if possible")
    from fontTools.pens.recordingPen import RecordingPen
    from fontTools.pens.ttGlyphPen import TTGlyphPen
    glyphs, name = font.getGlyphSet(), font.getBestCmap()[ord("0")]
    rec = RecordingPen(); glyphs[name].draw(rec)
    contours, now = [], []                             # the drawing split into its contours
    for op in rec.value:
        now.append(op)
        if op[0] in ("closePath", "endPath"): contours.append(now); now = []
    def area(c):
        b = BoundsPen(None); RecordingPen.replay(type("R", (), {"value": c})(), b)
        x0, y0, x1, y1 = b.bounds; return (x1 - x0) * (y1 - y0)
    if len(contours) > 2:
        dot = min(contours, key=area)
        out_pen = TTGlyphPen(None)
        for c in contours:
            if c is not dot: RecordingPen.replay(type("R", (), {"value": c})(), out_pen)
        font["glyf"][name] = out_pen.glyph()
        font["glyf"][name].recalcBounds(font["glyf"])
    out = os.path.join(HERE, out_name)
    font.save(out)
    print(f"{out}: {os.path.getsize(out)} bytes; weight {weight}, its stem {stem(weight):.1f} of 1000")
    return out

out = cut(weight, "Regular", "DialMono.ttf", 400)
cut(600, "SemiBold", "DialMono-Semi.ttf", 600)      # the bar's names (7-bar.css sets 600)

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
