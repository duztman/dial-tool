"""
make_guide.py — build the Dial Tool guidebook (docs/Dial-Tool-guide.pdf).

  docs/guide/guide.html   the pages: text, layout and styles. Edit it there.
  tools/guide_dials.py    the classic dials, as real Dial Tool settings.
  this file               the small feature figures (FIGURES), and the build:

  1. fonts     downloaded once from github.com/google/fonts into docs/guide/cache
               (not in the repo): Inter for the pages, and open stand-ins for
               the macOS fonts the dials name (guide_dials.FONT_STAND_INS);
  2. figures   every dial and feature figure is drawn by dial.py itself, through
               the test harness (drawbot-skia), as SVG into docs/guide/img;
  3. presets   each classic dial → docs/guide/presets/<name>.json (Load… reads them);
  4. pages     {{…}} marks in guide.html are filled in (figure strips, recipes
               printed from the same settings that drew the pictures), and
               Chromium prints the result to PDF. A page whose content
               overflows is reported: shorten the text.

Marks in guide.html: {{version}} {{date}} {{contents}} {{classics}} {{window}} {{page:ID}} {{dial:NAME}}
                     {{strip:NAME}} {{strip:NAME:FROM-TO}} {{hero:NAME:COLUMNS}} {{rings:NAME}}
                     {{ui:strip:NAME-INDEX:RING:keys}} {{ui:dial:NAME:RING|hour|minute|second|date|dial:keys}}

Setup (once): pip install drawbot-skia skia-pathops pillow fonttools playwright
              (+ a Chromium: `playwright install chromium`, or set CHROME=/path/to/chrome)
Use:          python tools/make_guide.py
"""

import os, re, sys, json, glob, html, datetime, urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
GUIDE = os.path.join(ROOT, "docs", "guide")
IMG, CACHE, PRESETS = (os.path.join(GUIDE, d) for d in ("img", "cache", "presets"))
OUT = os.path.join(ROOT, "docs", "Dial-Tool-guide.pdf")

sys.path.insert(0, HERE)
import test_harness as H                                    # loads dial.py on drawbot-skia
import guide_dials as G
from drawbot_skia.path import BezierPath
D = H.D


# ── fonts ────────────────────────────────────────────────────

GOOGLE = "https://raw.githubusercontent.com/google/fonts/main/ofl/"
DOWNLOADS = {
    "Inter.ttf":           "inter/Inter%5Bopsz%2Cwght%5D.ttf",
    "Inter-Italic.ttf":    "inter/Inter-Italic%5Bopsz%2Cwght%5D.ttf",
    "Jost.ttf":            "jost/Jost%5Bwght%5D.ttf",
    "Barlow-SemiBold.ttf": "barlow/Barlow-SemiBold.ttf",
    "Arimo.ttf":           "arimo/Arimo%5Bwght%5D.ttf",
    "BodoniModa.ttf":      "bodonimoda/BodoniModa%5Bopsz%2Cwght%5D.ttf",
    "NotoSansArabic.ttf":  "notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf",
    "NotoSansSC.ttf":      "notosanssc/NotoSansSC%5Bwght%5D.ttf",
}

def fetch_fonts():
    os.makedirs(CACHE, exist_ok=True)
    for name, path in DOWNLOADS.items():
        target = os.path.join(CACHE, name)
        if not os.path.exists(target):
            print("fetching", name)
            urllib.request.urlretrieve(GOOGLE + path, target)

_fonts = {}

def font_file(name, axes=None, only=None):
    """a font from the cache; a variable font pinned to one instance; only = keep just these characters."""
    key = (name, json.dumps(axes, sort_keys=True), only)
    if key not in _fonts:
        path = os.path.join(CACHE, name)
        if axes or only:
            tag = "-".join(f"{k}{v:g}" for k, v in sorted((axes or {}).items())) + ("-sub" if only else "")
            out = os.path.join(CACHE, f"{name[:-4]}-{tag}.ttf")
            if not os.path.exists(out):
                font = TTFont(path)
                if only:
                    s = subset.Subsetter()
                    s.populate(text=only)
                    s.subset(font)
                if axes:
                    font = instancer.instantiateVariableFont(font, axes)
                font.save(out)
            path = out
        _fonts[key] = (path, TTFont(path))
    return _fonts[key]

CHINESE = "十一二三四五六七八九"

def font_for(txt, t):
    if any("؀" <= ch <= "ۿ" for ch in txt):
        return font_file("NotoSansArabic.ttf", dict(wght=500, wdth=100))
    if any(ch in CHINESE for ch in txt):
        return font_file("NotoSansSC.ttf", dict(wght=500), only=CHINESE)
    name, axes = G.FONT_STAND_INS.get(t["ps"], G.FONT_STAND_INS["HelveticaNeue-Medium"])
    return font_file(name, axes)

def text_path(txt, t, size):
    p = BezierPath()
    p.text(txt, font=font_for(txt, t)[0], fontSize=size)
    return p

def advance(txt, t, size):
    """typeset width from the font's own advances (the harness's default measures ink, which loses spaces)."""
    font = font_for(txt, t)[1]
    cmap, widths = font.getBestCmap(), font["hmtx"]
    total = sum(widths[cmap[ord(ch)]][0] for ch in txt if ord(ch) in cmap)
    return total * size / font["head"].unitsPerEm + t["tracking"] / 1000 * size * len(txt)


# ── figures ──────────────────────────────────────────────────

PAPER  = [0.955, 0.945, 0.915, 1]
INK    = G.INK
MARKS  = dict(kind="markers", name="Markers", r=13.4, len=2.8, w=0.7)
TICKS  = dict(kind="ticks", name="Ticks", r=14.4, count=60, len=1.0, w=0.12)
NUMS   = dict(kind="numerals", name="Numerals", r=10.0, size=2.6, **G.HELV)
PLAIN  = dict(ha_on=False, c_plate=PAPER)
TOP3   = dict(NUMS, r=11.6, size=3.4, count=3, start=-30, span=60, labels="Custom", custom="11, 12, 1")

def fig(title, values, rings=None, crop=None, base=None, keep=None, **settings):
    """a small figure: its own rings on a plain plate — or a classic dial (base), optionally
    with only some of its rings (keep) — plus any settings to change."""
    return dict(title=title, values=values, crop=crop, rings=rings, base=base, keep=keep, settings=settings)

# strips of small figures: name → [figures]. The values text is what you'd set in the tool.
FIGURES = {
    "kinds": [
        fig("ticks", "Count 60 · Length 1.0 · Width 0.12", [TICKS]),
        fig("markers", "Count 12 · Length 2.8 · Width 0.7", [MARKS]),
        fig("numerals", "Labels Arabic · Size 2.6", [NUMS]),
        fig("band", "Radius 14.4 · Band width 2.2", [dict(kind="band", r=14.4, width=2.2, c=G.NAVY)]),
    ],
    "positions": [
        fig("Count 12", "Start 0° · Span 360°", [MARKS]),
        fig("Every 3", "the cardinals", [dict(MARKS, every=3)]),
        fig("Every 3 · skip those instead", "the other eight", [dict(MARKS, every=3, invert=True)]),
        fig("Every 2 · Offset 1", "the odd hours", [dict(MARKS, every=2, offset=1)]),
        fig("Count 4 · Start 45°", "a quarter turn off", [dict(MARKS, count=4, start=45)]),
        fig("Count 10 · Start −135° · Span 270°", "an arc: both ends marked", [dict(MARKS, count=10, start=-135, span=270)]),
    ],
    "shapes": [
        fig("bar", "Length 3.4 · Width 1.2", [dict(MARKS, len=3.4, w=1.2)], crop="top"),
        fig("bar, fine", "Count 60 · Length 1.6 · Width 0.12", [dict(TICKS, r=13.4, len=1.6)], crop="top"),
        fig("wedge", "Inner width × 0.35", [dict(MARKS, shape="wedge", len=3.4, w=1.6, taper=0.35)], crop="top"),
        fig("wedge", "Inner width × 0", [dict(MARKS, shape="wedge", len=3.4, w=1.8, taper=0.0)], crop="top"),
        fig("wedge", "Inner width × 1.8", [dict(MARKS, shape="wedge", len=3.4, w=0.9, taper=1.8)], crop="top"),
        fig("dot", "Ø 2.0", [dict(MARKS, shape="dot", w=2.0)], crop="top"),
        fig("file", "your own SVG · PDF · AI", [dict(MARKS, shape="file", file="@marker.svg", scale=1.0)], crop="top"),
        fig("rounded", "Round outer 0.6 · Round inner 0.2", [dict(MARKS, len=3.4, w=1.2, round_out=0.6, round_in=0.2)], crop="top"),
        fig("hollow", "Hollow wall 0.22", [dict(MARKS, len=3.4, w=1.4, wall=0.22, round_out=0.3, round_in=0.3)], crop="top"),
        fig("12: double", "Gap 0.4", [dict(MARKS, w=1.0, twelve="double", twelve_gap=0.4)], crop="top"),
        fig("12: triangle", "Scale × 1.2", [dict(MARKS, w=1.0, twelve="triangle", twelve_scale=1.2)], crop="top"),
        fig("12: none", "", [dict(MARKS, w=1.0, twelve="none")], crop="top"),
    ],
    "giveway": [
        fig("stack", "Skip where: nothing · Knock out: nothing",
            [dict(MARKS, r=14.4, len=3.2, w=1.5, wall=0.25), dict(TICKS, count=120, len=1.6, w=0.16)], crop="top"),
        fig("skip where", "markers above",
            [dict(MARKS, r=14.4, len=3.2, w=1.5, wall=0.25), dict(TICKS, count=120, len=1.6, w=0.16, skip=1)], crop="top"),
        fig("knock out", "markers above · Clearance 0.25",
            [dict(MARKS, r=14.4, len=3.2, w=1.5, wall=0.25), dict(TICKS, count=120, len=1.6, w=0.16, knock=1, clear=0.25),
             dict(kind="band", r=13.2, width=0.9, c=G.NAVY, knock=1, clear=0.25)], crop="top"),
        fig("knock out", "markers & numerals above",
            [dict(NUMS, r=12.6, size=2.4), dict(kind="band", r=14.4, width=3.6, c=G.NAVY, knock=2, clear=0.3)], crop="top"),
    ],
    "bands": [
        fig("ring", "Count 1 · Band width 2.0", [dict(kind="band", r=14.4, width=2.0, c=G.NAVY)]),
        fig("sectors", "Count 12 · Every 2", [dict(kind="band", r=14.4, width=3.0, count=12, every=2, c=G.NAVY)]),
        fig("fill", "Count 60 · Fill 50 %", [dict(kind="band", r=14.4, width=1.4, count=60, fill=50, c=G.NAVY)]),
        fig("pies", "Band width = radius", [dict(kind="band", r=12.0, width=12.0, count=8, every=2, c=G.NAVY)]),
        fig("rails", "two bands, Band width 0.12", [dict(kind="band", r=14.4, width=0.12, c=INK), dict(kind="band", r=13.3, width=0.12, c=INK),
                                                    dict(TICKS, r=14.4, len=1.1)]),
        fig("arc", "Start 108° · Span 54°", [dict(kind="band", r=14.4, width=1.2, start=108, span=54, c=G.RED),
                                             dict(kind="band", r=14.4, width=0.14, c=INK)]),
    ],
    "labels": [
        fig("Arabic", "", [dict(NUMS, r=12.0)], crop="top"),
        fig("Roman · IIII", "", [dict(NUMS, r=12.0, labels="Roman · IIII", **G.BODONI)], crop="top"),
        fig("Roman · IV", "", [dict(NUMS, r=12.0, labels="Roman · IV", **G.BODONI)], crop="top"),
        fig("Eastern Arabic", "", [dict(NUMS, r=12.0, labels="Eastern Arabic")], crop="top"),
        fig("Chinese", "", [dict(NUMS, r=12.0, labels="Chinese", size=2.2)], crop="top"),
        fig("Words", "on path", [dict(NUMS, labels="Words", mode="on path", size=1.5, r=12.4)], crop="top"),
        fig("Numbers", "First 5 · Step 5 · Digits 2 · Start 30°",
            [dict(NUMS, r=12.0, labels="Numbers", num_from=5, num_step=5, num_digits=2, start=30)], crop="top"),
        fig("Custom", "N, NNE, , , E, …", [dict(NUMS, r=12.0, labels="Custom", custom="N, NNE, , E, , , S, , , W, , NNW", size=2.2)], crop="top"),
    ],
    "type": [
        fig("DIN Alternate Bold", "", [dict(TOP3, **G.DIN)], crop="top"),
        fig("Futura Medium", "", [dict(TOP3, **G.FUTURA)], crop="top"),
        fig("Helvetica Neue Medium", "", [TOP3], crop="top"),
        fig("Bodoni 72 Book", "", [dict(TOP3, custom="XI, XII, I", **G.BODONI)], crop="top"),
    ],
    "placement": [
        fig("upright", "always level", [dict(NUMS, labels="Roman · IV", size=2.3, **G.BODONI)]),
        fig("radial", "turns with the circle", [dict(NUMS, labels="Roman · IV", size=2.3, mode="radial", **G.BODONI)]),
        fig("radial, auto-flip", "never upside down", [dict(NUMS, labels="Roman · IV", size=2.3, mode="radial, auto-flip", **G.BODONI)]),
        fig("on path", "letters follow the circle", [dict(NUMS, labels="Words", mode="on path", size=1.15, r=11.6)]),
    ],
    "date": [
        fig("at 3", "Radius 10.5 · 2.6 × 2.0 · Frame 0.15", [MARKS, dict(TICKS, skip=1)],
            da_on=True, da_at=0, da_day="17"),
        fig("at 4:30", "Corner 0.6 · Frame 0", [MARKS, dict(TICKS, skip=1)],
            da_on=True, da_at=1, da_round=0.6, da_frame=0.0, da_day="28"),
        fig("at 6", "Print clearance 0.4 cuts the band", [dict(MARKS, r=13.0), dict(kind="band", r=11.6, width=2.2, c=G.NAVY)],
            da_on=True, da_at=2, da_r=10.5, da_clear=0.4, da_day="3"),
    ],
    "output": [
        fig("design", "PDF · SVG · PNG", None, base="california"),
        fig("production", "one colour, no plate, no hands", None, base="california", out_production=True),
        fig("production + mirror", "for toner transfer", None, base="california", out_production=True, out_mirror=True),
    ],
    "exploded": [
        fig("Minutes", "ticks · Count 60", None, base="diver", keep=["Minutes"], ha_on=False, da_on=False),
        fig("Dots", "markers · Every 3, skip those instead", None, base="diver", keep=["Dots"], ha_on=False, da_on=False),
        fig("Bars 6 · 9", "markers · Count 4 · 12 o’clock: none", None, base="diver", keep=["Bars 6 · 9"], ha_on=False, da_on=False),
        fig("Triangle", "markers · Count 1 · wedge", None, base="diver", keep=["Triangle"], ha_on=False, da_on=False),
        fig("Depth", "numerals · Custom · on path", None, base="diver", keep=["Depth"], ha_on=False, da_on=False),
        fig("The dial", "with hands and the date", None, base="diver"),
    ],
}

# one large example per page. crop: None = the whole dial with room for labels round it,
# "top" / "east" = a close-up of 12 or 3 o'clock.
HEROES = {
    "rings":     fig("", "", None, base="diver"),
    "positions": fig("", "", [MARKS]),
    "marks":     fig("", "", [dict(MARKS, len=3.4, w=1.2, count=3, start=-30, span=60)], crop="top"),
    "giveway":   fig("", "", [dict(MARKS, r=14.4, len=3.2, w=1.5, wall=0.25),
                              dict(TICKS, count=120, len=1.6, w=0.16, knock=1, clear=0.25),
                              dict(kind="band", r=13.2, width=0.9, c=G.NAVY, knock=1, clear=0.25)], crop="top"),
    "bands":     fig("", "", None, base="sector", ha_on=False),
    "numerals":  fig("", "", None, base="california", ha_on=False),
    "type":      fig("", "", None, base="field", ha_on=False, crop="top"),
    "hands":     fig("", "", None, base="dress"),
    "date":      fig("", "", [dict(MARKS, r=13.4), dict(kind="band", r=12.2, width=3.4, c=G.NAVY)], crop="east",
                     da_on=True, da_at=0, da_r=10.5, da_w=2.6, da_h=2.0, da_frame=0.15, da_clear=0.25, da_day="17"),
    "files":     fig("", "", None, base="california", out_production=True, out_mirror=True),
}
PAD = 0.62                                                   # a whole hero's share of its tile
# close-ups: enlargement, and the point of the dial (mm from its centre) that sits at the panel's top middle
# ("top") or in its middle ("east")
CLOSE = dict(marks=(2.1, 15.5), giveway=(4.0, 16.4), type=(2.1, 14.9), date=(2.6, 9.63))

def cp(r, a):
    """clock angle → x, y on the page (y grows downward)."""
    import math
    return (r * math.sin(math.radians(a)), -r * math.cos(math.radians(a)))

def label(x, y, text, anchor="start", sub=None, white=False):
    out = f'<text{' class="wt"' if white else ""} x="{x:.2f}" y="{y:.2f}" text-anchor="{anchor}"><tspan class="bold">{esc(text)}</tspan>'
    if sub:
        out += f'<tspan class="g" x="{x:.2f}" dy="1.25em">{esc(sub)}</tspan>'
    return out + "</text>"

def leader(r, a, edge, text, sub=None, out=17.6, dark=True):
    """from a point on the dial straight out to a label beside it; white while it crosses a dark plate."""
    (x0, y0), (x1, y1), (x2, y2) = cp(r, a), cp(max(edge, r), a), cp(out, a)
    side = "start" if x2 >= -0.01 else "end"
    lx = x2 + (0.7 if side == "start" else -0.7)
    inner = f'<line class="{"w" if dark else ""}" x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}"/>' if edge > r else ""
    return (f'<circle class="{"w" if dark else ""}" cx="{x0:.2f}" cy="{y0:.2f}" r="0.34"/>{inner}'
            f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}"/>' + label(lx, y2 + 0.1, text, side, sub))

def dim(x0, y0, x1, y1, text, tx, ty, anchor="start", sub=None, tick=0.35):
    """a dimension line with end ticks, and its label."""
    import math
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1
    px, py = -dy / n * tick, dx / n * tick
    ends = "".join(f'<line x1="{x - px:.2f}" y1="{y - py:.2f}" x2="{x + px:.2f}" y2="{y + py:.2f}"/>' for x, y in ((x0, y0), (x1, y1)))
    return f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}"/>{ends}' + label(tx, ty, text, anchor, sub)

def arc_path(r, a0, a1):
    (x0, y0), (x1, y1) = cp(r, a0), cp(r, a1)
    return f'<path d="M{x0:.2f} {y0:.2f} A{r} {r} 0 {int(abs(a1 - a0) > 180)} 1 {x1:.2f} {y1:.2f}"/>'

def overlay(name, S):
    """the annotations drawn over a hero, in the dial's own millimetres."""
    if name == "rings":
        R = S["dial_d"] / 2
        return "".join([
            leader(11.4, 0, R, "Triangle", "markers · Count 1", out=19.6),
            leader(11.85, 30, R, "Dots", "markers · every 3, skipped"),
            leader(13.85, 66, R, "Minutes", "ticks · Count 60"),
            leader(12.05, 90, R, "Date", "window at 3"),
            leader(6.0, 166, R, "Depth", "numerals · on path"),
            leader(11.55, 270, R, "Bars 6 · 9", "markers · Count 4"),
            leader(6.3, 304.8, R, "Hands", "hour · minute · seconds")])
    if name == "positions":
        out = ['<line class="dash" x1="0" y1="0" x2="0" y2="-19.4"/>', label(0, -20.3, "0° = 12 o’clock", "middle"),
               arc_path(8.0, 0, 30), label(*cp(9.6, 15), "30°", "middle"),
               dim(0, 0, 13.4, 0, "Radius 13.4", 6.7, -0.75, "middle"),
               arc_path(19.0, 96, 128), '<path d="M%.2f %.2f l1.1 -.2 M%.2f %.2f l.35 -1.05"/>' % (*cp(19.0, 128), *cp(19.0, 128)),
               label(*cp(20.4, 112), "clockwise", "start")]
        for i in range(12):
            x, y = cp(16.7, i * 30)
            if i:
                out.append(f'<text class="g" x="{x:.2f}" y="{y + 0.4:.2f}" text-anchor="middle">{i}</text>')
        out.append(label(0, 20.6, "Positions 0 – 11", "middle", "Every and Offset count these"))
        return "".join(out)
    if name == "marks":
        return "".join([
            dim(-0.6, -14.2, 0.6, -14.2, "Width 1.2", 1.0, -14.07, tick=0.22),
            dim(1.6, -13.4, 1.6, -10.0, "Length 3.4", 2.0, -11.55, tick=0.22),
            '<line class="dash" x1="-2.6" y1="-13.4" x2="-0.6" y2="-13.4"/><line class="dash" x1="-2.6" y1="0" x2="-0.5" y2="0"/>',
            '<path d="M-.5 0h1M0 -.5v1"/>', label(0.9, 0.13, "the dial’s centre", "start"),
            dim(-2.2, 0, -2.2, -13.4, "Radius 13.4", -2.6, -6.1, "end", "centre to the outer end", tick=0.22)])
    if name == "giveway":
        return "".join([
            dim(0.75, -12.75, 1.0, -12.75, "", 0, 0, tick=0.12),
            '<line x1="0.875" y1="-12.6" x2="1.5" y2="-11.0"/>',
            label(1.65, -10.75, "Clearance 0.25", "start", "the gap, in mm"),
            '<line x1="-0.95" y1="-13.9" x2="-1.5" y2="-11.0"/>',
            label(-1.65, -10.75, "Knock out · markers above", "end", "ticks and band stop short of it")])
    if name == "hands":
        R = S["dial_d"] / 2
        return "".join([
            leader(13.0, 57.6, R, "Minute", "dauphine · Length 13", dark=False),
            leader(8.4, 304.8, R, "Hour", "dauphine · Length 8.4", dark=False),
            leader(13.9, 216, R, "Seconds", "baton · Length 13.9", dark=False),
            leader(3.6, 36, R, "Tail 3.6", "behind the pivot", dark=False),
            leader(0.55, 135, R, "Cap Ø 1.1", "over the pivot", dark=False)])
    if name == "date":
        return "".join([
            dim(9.2, -1.75, 11.8, -1.75, "Width 2.6", 10.5, -2.05, "middle", tick=0.14),
            dim(12.45, -1.0, 12.45, 1.0, "Height 2.0", 12.75, 0.08, tick=0.14),
            '<line class="dash w" x1="4.2" y1="0" x2="9.05" y2="0"/>', label(4.2, 0.62, "Radius 10.5", "start", "from the dial’s centre"),
            '<line class="w" x1="10.5" y1="1.45" x2="10.5" y2="2.5"/>',
            '<line class="w" x1="10.5" y1="2.5" x2="8.55" y2="2.5"/>',
            label(8.2, 2.6, "Frame 0.15 + Print clearance 0.25", "end", "print keeps this far from the hole")])
    return ""

def hero(name, span, ns):
    """{{hero:NAME:COLUMNS}} — the large example, with its annotations."""
    f = HEROES[name]
    S = figure_settings(ns, f)
    page = S["dial_d"] + 2 * S["margin"]
    tile = span * 19.083 + (span - 1) * 4                    # mm on paper
    if f["crop"]:
        z, focus = CLOSE[name]
        unit = tile * z / page                               # mm on paper per mm of dial
        box = f"{-page / 2:.3f} {-page / 2:.3f} {page:.3f} {page:.3f}"
    else:
        unit = tile * PAD / page
        box = f"{-page / 2 / PAD:.3f} {-page / 2 / PAD:.3f} {page / PAD:.3f} {page / PAD:.3f}"
    svg = (f'<svg class="over" viewBox="{box}" style="--fs:{2.65 / unit:.3f}px; --sw:{0.2 / unit:.4f}px">'
           f'{overlay(name, S)}</svg>') if overlay(name, S) else ""
    art = f'<div class="art"><img src="img/hero-{name}.svg">{svg if f["crop"] else ""}</div>'
    if f["crop"]:
        if f["crop"] == "top":
            place = f"width:{z * 100:g}cqw; left:{(1 - z) * 50:g}cqw; top:{-(page / 2 - focus) / page * z * 100:.1f}cqw"
        else:
            place = f"width:{z * 100:g}cqw; left:{50 - (page / 2 + focus) / page * z * 100:.1f}cqw; top:calc(50cqh - {z * 50:g}cqw)"
        art = art.replace('class="art"', f'class="art" style="{place}"', 1)
        return f'<figure class="s{span} hero"><div class="crop {f["crop"]}">{art}</div></figure>'
    pad = " pad" if svg else ""
    return f'<figure class="s{span} hero"><div class="whole{pad}"><div class="sq">{art}{svg}</div></div></figure>'

HANDS = [
    ("baton", dict(w=0.9, tail=1.6)),
    ("pencil", dict(w=0.9, tail=1.6, tip=1.6)),
    ("sword", dict(w=1.2, tail=1.4, tip=2.6)),
    ("dauphine", dict(w=1.5, tail=1.4, feature_at=20)),
    ("leaf", dict(w=1.7, tail=1.6)),
    ("arrow", dict(w=0.45, tail=1.6, tip=2.0, feature=1.7)),
    ("syringe", dict(w=0.3, tail=1.6, tip=2.2, feature=0.9, feature_at=40)),
    ("breguet", dict(w=0.22, tail=1.6, tip=1.2, feature=1.6, feature_at=72)),
    ("lollipop", dict(w=0.16, tail=3.0, feature=1.0, feature_at=80)),
    ("hollow wall", dict(shape="dauphine", w=1.7, tail=1.4, feature_at=22, wall=0.2)),
    ("counterweight", dict(shape="baton", w=0.16, tail=3.2, counter=1.1)),
    ("file", dict(shape="file", file="@hand.svg", fit=True)),
]


def figure_settings(ns, f):
    if f["base"]:
        s = dict(G.DIALS[f["base"]]["settings"])
        if f["keep"]:
            s["rings"] = [r for r in s["rings"] if r["name"] in f["keep"]]
    else:
        s = dict(PLAIN, rings=f["rings"])
    s.update(f["settings"])
    return ns["fresh_settings"](H.resolve_files(G.resolved(s, ns)))

def draw_dial(ns, S, path, zoom=6):
    static = ns["build_static"](S)
    D.newDrawing()
    mm = ns["MM"]
    ns["MM"] = mm * zoom
    ns["draw_page"](D, S, static, S["t"], preview=False)       # as exported: no backdrop, no guides
    ns["MM"] = mm
    D.saveImage(path)
    D.endDrawing()
    for message in ns["NOTES"]:
        print("    note:", message)
    ns["NOTES"].clear()

def draw_hands(ns, zoom=6):
    for label, kw in HANDS:
        hand = ns["complete"](ns["HAND_BASE"], H.resolve_files(dict(dict(shape=label, len=12.0), **kw)))
        p = ns["hand_shape"](hand).copy()
        w, h = 7.0 * zoom * ns["MM"], 17.0 * zoom * ns["MM"]
        p.scale(zoom * ns["MM"])
        p.translate(w / 2, 4.0 * zoom * ns["MM"])
        D.newDrawing()
        D.newPage(w, h)
        D.fill(*INK[:3])
        D.drawPath(p)
        D.saveImage(os.path.join(IMG, f"hand-{label.replace(' ', '-')}.svg"))
        D.endDrawing()

def draw_preview(ns, name, selected):
    """a classic dial as the tool's own preview shows it: backdrop, guides, the selected ring's in orange."""
    S = ns["fresh_settings"](G.resolved(G.DIALS[name]["settings"], ns))
    static = ns["build_static"](S)
    D.newDrawing()
    mm = ns["MM"]
    ns["MM"] = mm * 6
    ns["draw_page"](D, S, static, S["t"], preview=True, selected=selected)
    ns["MM"] = mm
    D.saveImage(os.path.join(IMG, f"preview-{name}.svg"))
    D.endDrawing()

WINDOW = ("field", 3)                                       # the dial and the selected ring in the window drawing

def figures():
    ns = H.load_dial(H.find_font())
    ns["text_path"], ns["advance"] = text_path, advance
    os.makedirs(H.OUT, exist_ok=True)
    for old in glob.glob(os.path.join(IMG, "*.svg")) + glob.glob(os.path.join(IMG, "*.png")):
        os.remove(old)
    os.makedirs(PRESETS, exist_ok=True)
    for name in G.ORDER:
        settings = G.resolved(G.DIALS[name]["settings"], ns)
        with open(os.path.join(PRESETS, name + ".json"), "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=1, ensure_ascii=False)
        draw_dial(ns, ns["fresh_settings"](settings), os.path.join(IMG, f"dial-{name}.svg"))
    for name, f in HEROES.items():
        draw_dial(ns, figure_settings(ns, f), os.path.join(IMG, f"hero-{name}.svg"))
    for strip, figs in FIGURES.items():
        for i, f in enumerate(figs):
            draw_dial(ns, figure_settings(ns, f), os.path.join(IMG, f"{strip}-{i}.svg"))
    draw_hands(ns)
    draw_preview(ns, *WINDOW)
    return ns


# ── the pages ────────────────────────────────────────────────

RING_KEYS = [  # (key, label, kinds it is shown for)
    ("r", "Radius", None), ("count", "Count", None), ("start", "Start °", None), ("span", "Span °", None),
    ("every", "Every", None), ("offset", "Offset", None), ("invert", "Skip those instead", None),
    ("shape", "Shape", None), ("len", "Length", None), ("w", "Width", None), ("taper", "Inner width ×", None),
    ("round_out", "Round outer", None), ("round_in", "Round inner", None), ("wall", "Hollow wall", None),
    ("twelve", "12 o'clock", None), ("twelve_scale", "Scale ×", None), ("twelve_gap", "Gap", None),
    ("labels", "Labels", None), ("custom", "Custom", None), ("num_from", "First number", None),
    ("num_step", "Step", None), ("num_digits", "Digits", None), ("mode", "Placement", None),
    ("size", "Size", None), ("family", "Font", None), ("width", "Band width", None), ("fill", "Fill %", None),
    ("skip", "Skip where", None), ("knock", "Knock out", None), ("clear", "Clearance", None),
]
HAND_KEYS = [("shape", "Shape"), ("len", "Length"), ("w", "Width"), ("tail", "Tail"), ("tip", "Tip length"),
             ("feature", "Head · ring · disc"), ("feature_at", "at %"), ("counter", "Counterweight Ø"),
             ("wall", "Hollow wall")]
DATE_KEYS = [("da_r", "Radius"), ("da_w", "Width"), ("da_h", "Height"), ("da_round", "Corner"),
             ("da_frame", "Frame"), ("da_clear", "Print clearance"), ("da_day", "Shows"), ("da_size", "Text %")]
STYLES = {"DINAlternate-Bold": "Bold", "Futura-Medium": "Medium", "HelveticaNeue-Medium": "Medium",
          "BodoniSvtyTwoITCTT-Book": "Book"}

def esc(text):
    return html.escape(str(text))

def number_text(v):
    if isinstance(v, bool):
        return "on" if v else "off"
    if isinstance(v, float):
        return f"{v:g}".replace("-", "−")
    if isinstance(v, int):
        return str(v).replace("-", "−")
    return str(v)

def swatch(c):
    r, g, b = (round(x * 255) for x in c[:3])
    return f'<i class="swatch" style="background:rgb({r},{g},{b})"></i>'

def values(d, keys, ns=None):
    out = []
    for key, label, *_ in keys:
        if key not in d:
            continue
        v = d[key]
        if key == "family":
            v = f"{v} {STYLES.get(d.get('ps'), '')}".strip()
        if key == "w" and d.get("shape") == "dot":
            label = "Ø"
        if key == "invert":
            out.append(f"<b>{esc(label)}</b>")
            continue
        if key in ("skip", "knock") and isinstance(v, int):
            v = ns[{"skip": "SKIP_FROM", "knock": "KNOCK_FROM"}[key]][v]
        if label.endswith(("°", "%")):                           # Start ° 30 → Start 30°
            out.append(f"{esc(label[:-1].strip())} <b>{esc(number_text(v))}{' ' * (label[-1] == '%')}{label[-1]}</b>")
        elif key == "custom":
            out.append(f"{esc(label)} <code>{esc(v)}</code>")
        else:
            out.append(f"{esc(label)} <b>{esc(number_text(v))}</b>")
    return " · ".join(out)

# The tool's controls, redrawn flat. Values, ranges and labels come from dial.py's own row
# descriptions (RING_ROWS, HAND_ROWS, DATE_ROWS, DIAL_ROWS), so a redrawn slider sits where the real one would.

def ui_row(row, T, ns):
    kind, key, label = row["kind"], row.get("key"), esc(row.get("text", ""))
    if kind == "hdr":
        return f'<div class="row hdr"><label></label><b class="wide">{label}</b></div>'
    v = T[key]
    if kind == "num":
        lo, hi = min(row["lo"], v), max(row["hi"], v)
        at = 100 * (v - lo) / (hi - lo) if hi > lo else 0
        return (f'<div class="row"><label>{label}</label><i class="slider" style="--at:{at:.1f}%"></i>'
                f'<i class="field">{esc(ns["fmt"](v, row["step"]).replace("-", "−"))}</i><i class="step"></i></div>')
    if kind == "fil":
        return f'<div class="row"><label>{label}</label><i class="pop wide">{esc(os.path.basename(v) or "none")}</i></div>'
    if kind == "pop":
        return f'<div class="row"><label>{label}</label><i class="pop wide">{esc(row["items"][v])}</i></div>'
    if kind == "seg":
        cells = "".join(f'<b class="{"on" if i == v else ""}">{esc(t)}</b>' for i, t in enumerate(row["items"]))
        return f'<div class="row"><label>{label}</label><i class="seg wide">{cells}</i></div>'
    if kind == "chk":
        return f'<div class="row"><label></label><i class="chk wide {"on" if v else ""}">{label}</i></div>'
    if kind == "col":
        r, g, b = (round(x * 255) for x in v[:3])
        return f'<div class="row"><label>{label}</label><i class="well" style="background:rgb({r},{g},{b})"></i></div>'
    return f'<div class="row"><label>{label}</label><i class="field wide">{esc(v)}</i></div>'

def ui(source, which, keys, ns):
    """rows of redrawn controls. source: a figure "strip:index" or a classic "dial:name";
    which: a ring's index, hour · minute · second, date or dial; keys: the settings to show."""
    kind, name = source.split(":")
    S = figure_settings(ns, FIGURES[name.rsplit("-", 1)[0]][int(name.rsplit("-", 1)[1])]) if kind == "strip" \
        else ns["fresh_settings"](G.resolved(G.DIALS[name]["settings"], ns))
    if which in ("hour", "minute", "second"):
        T, rows = S["ha_" + which], [r for r in ns["HAND_ROWS"] if r.get("scope") == "hand"]
    elif which in ("date", "dial"):
        T, rows = S, ns["DATE_ROWS"] + ns["DIAL_ROWS"] + ns["EXPORT_ROWS"] + [r for r in ns["HAND_ROWS"] if not r.get("scope")]
    else:
        T, rows = S["rings"][int(which)], ns["RING_ROWS"]
    out = []
    for key in keys.split(","):
        row = next((r for r in rows if r.get("key") == key and (r.get("show") is None or r["show"](T))), None)
        if row is None:
            raise SystemExit(f"guide.html: {{{{ui:{source}:{which}}}}} has no row for {key!r}")
        out.append(ui_row(row, T, ns))
    return f'<div class="ui">{"".join(out)}</div>'

def ring_list(s, selected=0):
    rows = "".join(f'<div class="{"sel" if i == selected else ""}"><i class="chk on"></i><span>{esc(r["name"])}</span>'
                   f'<em>{esc(r["kind"])}</em></div>' for i, r in enumerate(s["rings"]))
    return f'<div class="ui list"><div class="head"><i></i><span>Ring</span><em>Kind</em></div>{rows}</div>'

def window(ns):
    """the whole window, redrawn from dial.py: same sizes (1300 × 860 points, panel 470), the rows the
    selected ring really shows, the tool's own preview with guides."""
    name, selected = WINDOW
    settings = G.DIALS[name]["settings"]
    S = ns["fresh_settings"](G.resolved(settings, ns))
    ring = S["rings"][selected]
    rows = "".join(ui_row(r, ring, ns) for r in ns["RING_ROWS"]
                   if r["kind"] in ("num", "pop", "seg", "chk", "col", "txt", "hdr")
                   and (r.get("show") is None or r["show"](ring)))
    tabs = "".join(f'<b class="{"on" if t == "Rings" else ""}">{t}</b>' for t in ns["SECTIONS"])
    tools = "".join(f"<b>{esc(t)}</b>" for t in ns["RING_TOOLS"])
    font = f' · {ring["ps"]}' if ns["kind_of"](ring) == "numerals" else ""
    r, g, b = (round(x * 255) for x in S["c_backdrop"][:3])
    return f"""<div class="window"><div class="px">
  <div class="titlebar"><i></i><i></i><i></i><span>Dial Tool · {esc(ns["VERSION"])}</span></div>
  <div class="body">
    <i class="seg tabs" style="left:10px; top:10px; width:470px; height:26px">{tabs}</i>
    <div style="left:10px; top:46px; width:470px; height:132px">{ring_list(settings, selected)}</div>
    <i class="pop" style="left:10px; top:188px; width:132px; height:24px">Add ring…</i>
    <i class="seg" style="left:150px; top:187px; width:330px; height:26px">{tools}</i>
    <div class="ui rows" style="left:10px; top:228px; width:470px">{rows}</div>
    <div class="view" style="left:490px; top:10px; width:800px; height:776px; background:rgb({r},{g},{b})"><img src="img/preview-{name}.svg"></div>
    <span style="left:492px; top:801px">Time</span>
    <i class="slider" style="left:534px; top:810px; width:230px; --at:84.7%"></i>
    <i class="field" style="left:776px; top:798px; width:84px; height:24px">{esc(ns["fmt_time"](S["t"]))}</i>
    <i class="chk on" style="left:872px; top:801px">Guides</i>
    <i class="seg" style="left:954px; top:797px; width:120px; height:26px"><b class="on">Canvas</b><b>PDF</b></i>
    <i class="btn" style="left:1080px; top:798px; width:60px; height:24px">Now</i>
    <i class="btn" style="left:1146px; top:798px; width:66px; height:24px">Play</i>
    <i class="btn" style="left:1218px; top:798px; width:72px; height:24px">Fit</i>
    <span class="status" style="left:12px; top:836px">{esc(ring["name"])}{font}   ·   Ø {S["dial_d"]:.1f} mm   ·   canvas   ·   build 0 ms   ·   frame 1 ms</span>
  </div>
  <i class="tag" style="left:452px; top:12px">1</i><i class="tag" style="left:452px; top:80px">2</i>
  <i class="tag" style="left:452px; top:188px">3</i><i class="tag" style="left:452px; top:262px">4</i>
  <i class="tag" style="left:1262px; top:44px">5</i><i class="tag" style="left:742px; top:802px">6</i>
  <i class="tag" style="left:1048px; top:802px">7</i><i class="tag" style="left:452px; top:860px">8</i>
</div></div>"""

def classic(name, ns, number):
    """one page: the dial large, what it is drawn after, and the settings that make it."""
    d = G.DIALS[name]
    s = d["settings"]
    rows = []
    for ring in s["rings"]:
        rows.append(f'<tr><th>{esc(ring["name"])}<span>{esc(ring["kind"])}</span></th>'
                    f'<td>{values(ring, RING_KEYS, ns)} {swatch(ring["c"])}</td></tr>')
    if s.get("da_on"):
        at = ns["DATE_AT"][s.get("da_at", 0)][0]
        rows.append(f'<tr><th>Date<span>window</span></th><td>Position <b>{at}</b> · {values(s, DATE_KEYS)}</td></tr>')
    for key, label in (("ha_hour", "Hour"), ("ha_minute", "Minute"), ("ha_second", "Seconds")):
        hand = s.get(key, {})
        if hand.get("on", True):
            rows.append(f'<tr><th>{label}<span>hand</span></th><td>{values(hand, HAND_KEYS)} {swatch(hand["c"])}</td></tr>')
    rows.append(f'<tr><th>Cap</th><td>Ø <b>{number_text(s["ha_cap"])}</b> {swatch(s["c_cap"])}</td></tr>')
    rows.append(f'<tr><th>Preset</th><td><code>presets/{name}.json</code> · Dial <b>{number_text(s["dial_d"])}</b> mm {swatch(s["c_plate"])}</td></tr>')
    return f"""<section class="page classic" id="{name}" data-toc="{esc(d['title'])}" data-sub="1"><div class="grid">
  <div class="col s8">
    <figure class="s8 hero"><div class="whole"><div class="sq"><div class="art">{{{{dial:{name}}}}}</div></div></div></figure>
  </div>
  <div class="col s4">
    <div class="s4"><span class="no">{{{{classics-number}}}}.{number}</span><h1>{esc(d['title'])}</h1>
      <p class="lead">{esc(d['after'])}</p>
      <div class="block look"><svg class="ic"><use href="#i-eye"/></svg><span class="k">Look for</span><p>{d['note']}</p></div></div>
    <div class="s4"><span class="k">Rings top first, then hands. Only what differs from a new ring.</span>
      <table class="recipe">{"".join(rows)}</table></div>
  </div>
</div><div class="foot"><span>Dial Tool {{{{version}}}}</span><span class="pg"></span></div></section>
"""

SPANS = dict(giveway=3, type=3)        # figures wider than two columns

def figure(name, i):
    if name == "hands":
        label = HANDS[i][0]
        return (f'<figure class="s1"><div class="hand"><img src="img/hand-{label.replace(" ", "-")}.svg"></div>'
                f'<figcaption><b>{esc(label)}</b></figcaption></figure>')
    f = FIGURES[name][i]
    crop = f'crop {f["crop"]}' if f["crop"] else "whole"
    note = f'<br>{esc(f["values"])}' if f["values"] else ""
    return (f'<figure class="s{SPANS.get(name, 2)} {name}"><div class="{crop}"><div class="art"><img src="img/{name}-{i}.svg"></div></div>'
            f'<figcaption><b>{esc(f["title"])}</b>{note}</figcaption></figure>')

def strip(name, first=None, last=None):
    """figures as grid cells; {{strip:name}} or {{strip:name:from-to}}."""
    n = len(HANDS) if name == "hands" else len(FIGURES[name])
    return "".join(figure(name, i) for i in range(n)[int(first or 0):int(last) if last else n])

def fill_in(page, ns, version, date):
    page = page.replace("{{classics}}", "".join(classic(n, ns, i + 1) for i, n in enumerate(G.ORDER)))
    page = page.replace("{{window}}", window(ns))
    page = page.replace("{{version}}", esc(version)).replace("{{date}}", esc(date))
    page = page.replace("{{fonts}}", "cache")
    page = re.sub(r"\{\{strip:([\w]+)(?::(\d+)-(\d+))?\}\}", lambda m: strip(*m.groups()), page)
    page = re.sub(r"\{\{hero:(\w+):(\d+)\}\}", lambda m: hero(m.group(1), int(m.group(2)), ns), page)
    page = re.sub(r"\{\{dial:([\w-]+)\}\}", lambda m: f'<img src="img/dial-{m.group(1)}.svg">', page)
    page = re.sub(r"\{\{ui:(\w+:[\w-]+):(\w+):([\w,]+)\}\}", lambda m: ui(m.group(1), m.group(2), m.group(3), ns), page)
    page = re.sub(r"\{\{rings:(\w+)(?::(\d+))?\}\}",
                  lambda m: ring_list(G.DIALS[m.group(1)]["settings"], int(m.group(2) or 0)), page)
    # page numbers: every <section class="page" id=…> can be referred to as {{page:id}}; data-toc makes a contents line
    sections = re.findall(r'<section class="page[^"]*"([^>]*)>', page)
    numbers, contents = {}, []
    for n, attrs in enumerate(sections, 1):
        ident, toc = re.search(r'id="([\w-]+)"', attrs), re.search(r'data-toc="([^"]+)"', attrs)
        if ident:
            numbers[ident.group(1)] = n
        if toc:
            sub = ' class="sub"' if "data-sub" in attrs else ""
            contents.append(f"<tr{sub}><td>{toc.group(1)}</td><td>{n:02d}</td></tr>")
    page = re.sub(r"\{\{page:([\w-]+)\}\}", lambda m: str(numbers[m.group(1)]), page)
    number = re.search(r'id="classics" data-toc="(\d\d)', page)
    page = page.replace("{{classics-number}}", number.group(1) if number else "")
    page = page.replace("{{contents}}", f'<table class="contents">{"".join(contents)}</table>')
    left = re.findall(r"\{\{.+?\}\}", page)
    if left:
        raise SystemExit(f"guide.html: unknown marks {left}")
    return page

def chromium():
    for path in [os.environ.get("CHROME")] + sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")) + [
            "/opt/pw-browsers/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
        if path and os.path.isfile(path):
            return path
    return None                                              # let Playwright find its own

def build(ns):
    version, date = ns["VERSION"], datetime.date.today().strftime("%-d %b %Y")
    page = fill_in(open(os.path.join(GUIDE, "guide.html"), encoding="utf-8").read(), ns, version, date)
    built = os.path.join(GUIDE, "_built.html")               # next to img/ and cache/, so relative links work
    with open(built, "w", encoding="utf-8") as f:
        f.write(page)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chromium())
        tab = browser.new_page()
        tab.goto("file://" + os.path.abspath(built))
        tab.evaluate("document.fonts.ready")
        tab.wait_for_load_state("networkidle")
        report = tab.evaluate("""() => [...document.querySelectorAll('.page')].map((p, i) => {
            const inner = p.querySelector('.grid');
            if (!inner) return [i + 1, 0];
            let over = inner.scrollHeight - inner.clientHeight;
            for (const c of inner.querySelectorAll('.col')) over = Math.max(over, c.scrollHeight - c.clientHeight);
            return [i + 1, Math.round(over)]; })""")
        tab.pdf(path=OUT, width="297mm", height="210mm", print_background=True,
                margin=dict(top="0", right="0", bottom="0", left="0"))
        browser.close()
    os.remove(built)
    over = [(n, px) for n, px in report if px > 1]
    print(f"{OUT}: {len(report)} pages")
    for n, px in over:
        print(f"WARNING: page {n} overflows by {px} px — shorten guide.html")
    return not over


if __name__ == "__main__":
    os.makedirs(IMG, exist_ok=True)
    fetch_fonts()
    sys.exit(0 if build(figures()) else 1)
