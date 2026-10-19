# pop_font.py — the bar's date popup's face: Barlow Regular, cut down to the letters and figures the popup writes. Packed
# into the page by build.mjs, as the time's and the date's faces are.
#
#   python3 web/fonts/ui/pop_font.py      (reads ../Barlow-Regular.ttf, writes DialPop-Regular.ttf beside this file)
#
# Why: the popup writes a day ("Mon 19 Oct 2026") and a time ("10:09:36 AM") in Barlow, not Condensed (Okay,
# 19 Oct 2026: "Try barlow not condensed for font"); the whole family file would add 140 kB to the page. Its own
# family name, "Dial Pop" (Barlow: SIL OFL 1.1, the licence in web/fonts/licences/).
import os
from fontTools.ttLib import TTFont
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
font = TTFont(os.path.join(HERE, "..", "Barlow-Regular.ttf"))
for record in font["name"].names:
    if record.nameID in (1, 16): record.string = "Dial Pop"
    elif record.nameID == 4: record.string = "Dial Pop Regular"
    elif record.nameID == 6: record.string = "DialPop-Regular"
options = subset.Options()
options.layout_features = ["kern", "tnum"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(text="0123456789:./ -ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
sub.subset(font)
out = os.path.join(HERE, "DialPop-Regular.ttf")
font.save(out)
print(f"{out}: {os.path.getsize(out)} bytes")
