# date_font.py — the bar's date face: Inter SemiBold, cut down to the figures. Packed into the page by build.mjs, as the
# time's face is.
#
#   python3 web/fonts/ui/date_font.py      (reads Inter-SemiBold.otf beside it, writes DialDate-SemiBold.otf)
#
# Why: the date is three small figures stacked — day, month, year — in the bar's box height (Okay, 18 Oct 2026: "short
# date, 07/10/28 style, stacked"). Barlow Bold in 4.62; Okay, 21:20: "three tier with barlow abort, try inter with
# appropriate weight for that size" — Inter is drawn for screens at small sizes, and SemiBold keeps its figures open at
# 9 px. Tabular figures so the stack stands in one column. Its own family name, "Dial Date" (Inter: SIL OFL 1.1,
# Inter-OFL.txt beside it).
import os
from fontTools.ttLib import TTFont
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
font = TTFont(os.path.join(HERE, "Inter-SemiBold.otf"))
for record in font["name"].names:
    if record.nameID in (1, 16): record.string = "Dial Date"
    elif record.nameID == 4: record.string = "Dial Date SemiBold"
    elif record.nameID == 6: record.string = "DialDate-SemiBold"
options = subset.Options()
options.layout_features = ["tnum"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(text="0123456789/–- ")
sub.subset(font)
out = os.path.join(HERE, "DialDate-SemiBold.otf")
font.save(out)
print(f"{out}: {os.path.getsize(out)} bytes")
