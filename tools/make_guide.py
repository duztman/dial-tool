"""
make_guide.py — build the Dial Tool guidebook (docs/Dial-Tool-guide.pdf).

  docs/guide/guide.html   the pages: text, layout and styles. Edit it there.
  tools/guide_dials.py    the classic dials, as real Dial Tool settings.
  this file               the small feature figures (FIGURES), and the build:

  1. fonts     downloaded once from github.com/google/fonts into docs/guide/cache
               (not in the repo): Recursive for the pages, and open stand-ins for
               the macOS fonts the dials name (guide_dials.FONT_STAND_INS);
  2. figures   every dial and feature figure is drawn by dial.py itself, through
               the test harness (drawbot-skia), as SVG into docs/guide/img;
  3. presets   each classic dial → docs/guide/presets/<name>.json (Load… reads them);
  4. pages     {{…}} marks in guide.html are filled in (figure strips, recipes
               printed from the same settings that drew the pictures), and
               Chromium prints the result to PDF. A page whose content
               overflows is reported: shorten the text.

Marks in guide.html: {{version}} {{date}} {{strip:NAME}} {{classic:NAME}} {{dial:NAME}}

Setup (once): pip install drawbot-skia skia-pathops pillow fonttools playwright
              (+ a Chromium: `playwright install chromium`, or set CHROME=/path/to/chrome)
Use:          python tools/make_guide.py
"""

import os, re, sys, json, glob, html, datetime, urllib.request
from PIL import Image, ImageDraw, ImageFont
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
    "Recursive.ttf":       "recursive/Recursive%5BCASL%2CCRSV%2CMONO%2Cslnt%2Cwght%5D.ttf",
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
        fig("Count 10 · Start −135° · Span 270°", "an arc: both ends marked", [dict(MARKS, count=10, start=-135, span=270)]),
    ],
    "shapes": [
        fig("bar", "Length 3.4 · Width 1.2", [dict(MARKS, len=3.4, w=1.2)], crop="top"),
        fig("wedge", "Inner width × 0.35", [dict(MARKS, shape="wedge", len=3.4, w=1.6, taper=0.35)], crop="top"),
        fig("wedge", "Inner width × 0", [dict(MARKS, shape="wedge", len=3.4, w=1.8, taper=0.0)], crop="top"),
        fig("rounded", "Round outer 0.6 · inner 0.2", [dict(MARKS, len=3.4, w=1.2, round_out=0.6, round_in=0.2)], crop="top"),
        fig("dot", "Ø 2.0", [dict(MARKS, shape="dot", w=2.0)], crop="top"),
        fig("hollow", "Hollow wall 0.22", [dict(MARKS, len=3.4, w=1.4, wall=0.22, round_out=0.3, round_in=0.3)], crop="top"),
        fig("file", "your SVG · PDF · AI", [dict(MARKS, shape="file", file="@marker.svg", scale=1.0)], crop="top"),
    ],
    "twelve": [
        fig("same", "", [dict(MARKS, w=1.0, twelve="same")], crop="top"),
        fig("double", "Gap 0.4", [dict(MARKS, w=1.0, twelve="double", twelve_gap=0.4)], crop="top"),
        fig("triangle", "Scale × 1.2", [dict(MARKS, w=1.0, twelve="triangle", twelve_scale=1.2)], crop="top"),
        fig("none", "", [dict(MARKS, w=1.0, twelve="none")], crop="top"),
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
        fig("arc", "Start 108° · Span 54°", [dict(kind="band", r=14.4, width=1.2, start=108, span=54, c=G.RED),
                                             dict(kind="band", r=14.4, width=0.14, c=INK)]),
    ],
    "labels": [
        fig("Arabic", "", [dict(NUMS, r=12.0)], crop="top"),
        fig("Roman · IIII", "", [dict(NUMS, r=12.0, labels="Roman · IIII", **G.BODONI)], crop="top"),
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
        fig("Bars · Triangle", "markers · Count 4 · Count 1", None, base="diver", keep=["Bars 6 · 9", "Triangle"], ha_on=False, da_on=False),
        fig("Depth", "numerals · Custom · on path", None, base="diver", keep=["Depth"], ha_on=False, da_on=False),
        fig("= the dial", "plus hands and the date", None, base="diver"),
    ],
}

HANDS = [
    ("baton", dict(w=0.9, tail=1.6)),
    ("pencil", dict(w=0.9, tail=1.6, tip=1.6)),
    ("sword", dict(w=1.2, tail=1.4, tip=2.6)),
    ("dauphine", dict(w=1.5, tail=1.4, feature_at=20)),
    ("leaf", dict(w=1.7, tail=1.6)),
    ("arrow", dict(w=0.45, tail=1.6, tip=2.0, feature=1.7)),
    ("syringe", dict(w=0.3, tail=1.6, tip=2.2, feature=0.9, feature_at=40)),
    ("breguet", dict(w=0.22, tail=1.6, tip=1.2, feature=1.6, feature_at=72)),
    ("lollipop", dict(w=0.16, tail=2.6, feature=1.0, feature_at=80)),
    ("hollow wall", dict(shape="dauphine", w=1.7, tail=1.4, feature_at=22, wall=0.2)),
    ("counterweight", dict(shape="baton", w=0.16, tail=3.2, counter=1.1)),
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
        hand = ns["complete"](ns["HAND_BASE"], dict(dict(shape=label, len=12.0), **kw))
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

CALLOUTS = {1: (552, 89), 2: (552, 176), 3: (552, 266), 4: (552, 720),     # pixels in img/window.png
            5: (1600, 190), 6: (600, 1238), 7: (1336, 1238), 8: (440, 1300)}

def draw_window():
    """Okay's screenshot (img/window.png) with numbered callouts."""
    im = Image.open(os.path.join(IMG, "window.png")).convert("RGBA")
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(font_file("Recursive.ttf", dict(MONO=1, CASL=0, wght=700, slnt=0, CRSV=0))[0], 26)
    for n, (x, y) in CALLOUTS.items():
        d.ellipse((x - 19, y - 19, x + 19, y + 19), fill="#CC381A", outline="white", width=3)
        d.text((x, y), str(n), font=f, fill="white", anchor="mm")
    flat = Image.new("RGB", im.size, "white")
    flat.paste(im, mask=im.split()[3])
    flat.save(os.path.join(IMG, "fig-window.png"))

def figures():
    ns = H.load_dial(H.find_font())
    ns["text_path"], ns["advance"] = text_path, advance
    os.makedirs(H.OUT, exist_ok=True)
    for old in glob.glob(os.path.join(IMG, "*.svg")) + glob.glob(os.path.join(IMG, "fig-*.png")):
        os.remove(old)
    os.makedirs(PRESETS, exist_ok=True)
    for name in G.ORDER:
        settings = G.resolved(G.DIALS[name]["settings"], ns)
        with open(os.path.join(PRESETS, name + ".json"), "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=1, ensure_ascii=False)
        draw_dial(ns, ns["fresh_settings"](settings), os.path.join(IMG, f"dial-{name}.svg"))
    for strip, figs in FIGURES.items():
        for i, f in enumerate(figs):
            draw_dial(ns, figure_settings(ns, f), os.path.join(IMG, f"{strip}-{i}.svg"))
    draw_hands(ns)
    draw_window()
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

def number(v):
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
            out.append(f"{esc(label[:-1].strip())} <b>{esc(number(v))}{' ' * (label[-1] == '%')}{label[-1]}</b>")
        elif key == "custom":
            out.append(f"{esc(label)} <code>{esc(v)}</code>")
        else:
            out.append(f"{esc(label)} <b>{esc(number(v))}</b>")
    return " · ".join(out)

def classic(name, ns):
    """a panel: the dial, what it is drawn after, and the settings that make it."""
    d = G.DIALS[name]
    s = d["settings"]
    rows = [f'<tr><th>Dial</th><td>Diameter <b>{number(s["dial_d"])}</b> · Plate {swatch(s["c_plate"])}</td></tr>']
    for ring in s["rings"]:
        colour = swatch(ring["c"]) if "c" in ring else ""
        rows.append(f'<tr><th>{esc(ring["name"])}<span>{esc(ring["kind"])}</span></th>'
                    f'<td>{values(ring, RING_KEYS, ns)} {colour}</td></tr>')
    if s.get("da_on"):
        at = ns["DATE_AT"][s.get("da_at", 0)][0]
        rows.append(f'<tr><th>Date<span>window</span></th><td>Position <b>{at}</b> · {values(s, DATE_KEYS)}</td></tr>')
    for key, label in (("ha_hour", "Hour"), ("ha_minute", "Minute"), ("ha_second", "Seconds")):
        hand = s.get(key, {})
        if hand.get("on", True):
            rows.append(f'<tr><th>{label}<span>hand</span></th><td>{values(hand, HAND_KEYS)} {swatch(hand["c"])}</td></tr>')
    rows.append(f'<tr><th>Cap</th><td>Ø <b>{number(s["ha_cap"])}</b> {swatch(s["c_cap"])}</td></tr>')
    dark = "dark" if sum(s["c_plate"][:3]) < 1.0 else ""
    return (f'<section class="classic"><div class="plate {dark}"><img src="img/dial-{name}.svg"></div>'
            f'<div class="recipe"><h3>{esc(d["title"])}</h3><p class="after">{esc(d["after"])}. '
            f'<code>presets/{name}.json</code></p><table>{"".join(rows)}</table></div></section>')

def strip(name):
    """a row of small captioned figures."""
    if name == "hands":
        cells = [f'<figure><div class="hand"><img src="img/hand-{label.replace(" ", "-")}.svg"></div>'
                 f'<figcaption><b>{esc(label)}</b></figcaption></figure>' for label, _ in HANDS]
        return f'<div class="strip hands">{"".join(cells)}</div>'
    cells = []
    for i, f in enumerate(FIGURES[name]):
        crop = f' class="crop {f["crop"]}"' if f["crop"] else ' class="whole"'
        note = f'<br>{esc(f["values"])}' if f["values"] else ""
        cells.append(f'<figure><div{crop}><img src="img/{name}-{i}.svg"></div>'
                     f'<figcaption><b>{esc(f["title"])}</b>{note}</figcaption></figure>')
    return f'<div class="strip n{len(cells)} {name}">{"".join(cells)}</div>'

def fill_in(page, ns, version, date):
    page = page.replace("{{version}}", esc(version)).replace("{{date}}", esc(date))
    page = page.replace("{{fonts}}", "cache")
    page = re.sub(r"\{\{strip:([\w-]+)\}\}", lambda m: strip(m.group(1)), page)
    page = re.sub(r"\{\{classic:([\w-]+)\}\}", lambda m: classic(m.group(1), ns), page)
    page = re.sub(r"\{\{dial:([\w-]+)\}\}", lambda m: f'<img src="img/dial-{m.group(1)}.svg">', page)
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
            const inner = p.querySelector('.inner');
            return [i + 1, Math.round(inner.scrollHeight - inner.clientHeight)]; })""")
        tab.pdf(path=OUT, width="210mm", height="297mm", print_background=True,
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
