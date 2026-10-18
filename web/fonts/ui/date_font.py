# date_font.py — the bar's date face (4.62): Barlow Bold, cut down to the figures. Packed into the page by build.mjs,
# as the time's face is.
#
#   python3 web/fonts/ui/date_font.py      (reads ../Barlow-Bold.ttf, writes DialDate-Bold.ttf beside this file)
#
# Why (Okay, 18 Oct 2026: "Date best set at the bar, short date, 07/10/28 style, stacked barlow medium or bold, next
# to am, touching"): the date is three small figures stacked — day, month, year — in the bar's box height, so the bold
# weight, which holds at small sizes; tabular figures so the stack stands in one column. Its own family name, "Dial
# Date": the rings may load Barlow under its own name (Barlow: SIL OFL 1.1, no Reserved Font Name).
import os
from fontTools.ttLib import TTFont
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
font = TTFont(os.path.join(HERE, "..", "Barlow-Bold.ttf"))
for record in font["name"].names:
    if record.nameID in (1, 16): record.string = "Dial Date"
    elif record.nameID == 4: record.string = "Dial Date Bold"
    elif record.nameID == 6: record.string = "DialDate-Bold"
options = subset.Options()
options.layout_features = ["tnum"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(text="0123456789/–- ")
sub.subset(font)
out = os.path.join(HERE, "DialDate-Bold.ttf")
font.save(out)
print(f"{out}: {os.path.getsize(out)} bytes")
