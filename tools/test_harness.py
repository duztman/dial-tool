"""
test_harness.py — render dial.py's geometry without the DrawBot app.

Runs sections 1–3 of dial.py (settings, geometry, drawing) through
drawbot-skia, a cross-platform port of DrawBot's drawing API, and writes
a contact sheet. The interface (section 4) is skipped: it needs macOS
(tools/ui_smoke.py checks it with stand-ins instead).

Text uses a plain font here (no FormattedString), so kerning, OpenType
features and variable axes are NOT tested by this harness. PDF import
reads files with macOS's PDF scanner, so only its drawing logic
(PDFPainter) is tested here, with hand-written PDF operators.

Setup (once):
    pip install drawbot-skia skia-pathops pillow

Use:
    python tools/test_harness.py                      # built-in variants
    python tools/test_harness.py variants.json        # your own: {"name": {setting: value}}
    python tools/test_harness.py --font /path/font.ttf

Variants may use beta 1.0's flat settings (they are converted, R8) or
beta 2.0's rings. Writes test-renders/<name>.png and test-renders/sheet.png.
"""

import json, os, sys, time

import skia
import drawbot_skia.drawbot as D
from drawbot_skia.path import BezierPath as SkiaPath
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DIAL = os.path.join(HERE, "..", "dial.py")
OUT = os.path.join(HERE, "..", "test-renders")
ZOOM = 8                                                   # preview scale; geometry stays in mm


# DrawBot's BezierPath.expandStroke (CoreGraphics) — the same thing with skia
def _expand_stroke(self, width, lineCap="round", lineJoin="round", miterLimit=10):
    caps = dict(butt=skia.Paint.kButt_Cap, round=skia.Paint.kRound_Cap, square=skia.Paint.kSquare_Cap)
    joins = dict(miter=skia.Paint.kMiter_Join, round=skia.Paint.kRound_Join, bevel=skia.Paint.kBevel_Join)
    paint = skia.Paint(Style=skia.Paint.kStroke_Style, StrokeWidth=width, StrokeCap=caps[lineCap],
                       StrokeJoin=joins[lineJoin], StrokeMiter=miterLimit)
    out = skia.Path()
    paint.getFillPath(self.path, out)
    return SkiaPath(path=out)

SkiaPath.expandStroke = _expand_stroke


INK, ACCENT, NAVY = [0.08, 0.08, 0.08, 1], [0.80, 0.22, 0.10, 1], [0.13, 0.22, 0.36, 1]

VARIANTS = {
    # beta 1.0 settings — these also test the conversion to rings (R8)
    "default": {},
    "dots-one-ring": {"mk_shape": 2, "mk_w": 1.4, "mk_wall": 0.35, "mk_twelve": 1, "mk_twelve_gap": 0.3},
    "rounded-wedge": {"mk_shape": 1, "mk_taper": 0.25, "mk_round_out": 0.35, "mk_round_in": 0.1,
                      "mk_len": 3.2, "mk_w": 1.2, "tr_collision": 1, "mk_offset": 0.4,
                      "mk_twelve": 1, "mk_twelve_gap": 0.8, "nu_mode": 2, "nu_set": 1},
    "knockout-date": {"tr_collision": 2, "mk_offset": -0.6, "tr_rail": True, "tr_div": 3,
                      "mk_round_out": 0.35, "mk_round_in": 0.35, "mk_wall": 0.15,
                      "da_on": True, "da_at": 1, "da_frame": 0.2, "nu_at": 1},
    "words-on-path": {"nu_set": 5, "nu_mode": 3, "ty_size": 1.3, "nu_r": 11.3, "tr_collision": 1,
                      "mk_shape": 2, "mk_w": 0.6, "da_on": True, "da_at": 2, "ha_style": 3,
                      "nu_nudge": {"9": {"dr": -0.5, "rot": 10}}},
    "production-mirror": {"out_production": True, "out_mirror": True, "tr_collision": 2,
                          "mk_offset": -0.6, "da_on": True, "mk_shape": 1, "mk_taper": 0},

    # beta 2.0 rings (top ring first)
    "sector-dial": {
        "c_plate": [0.94, 0.92, 0.87, 1],
        "rings": [
            {"kind": "numerals", "name": "Hours", "r": 8.6, "every": 3, "size": 2.0},
            {"kind": "markers", "name": "Hour bars", "r": 11.9, "len": 1.4, "w": 0.45, "every": 3, "invert": True},
            {"kind": "ticks", "name": "Minutes", "r": 14.4, "count": 60, "len": 0.7, "w": 0.1, "c": [1, 1, 1, 1]},
            {"kind": "numerals", "name": "Minute numerals", "r": 12.9, "start": 30, "labels": 7, "num_from": 5,
             "num_step": 5, "num_digits": 2, "size": 0.9, "mode": 2, "c": [1, 1, 1, 1]},
            {"kind": "band", "name": "Chapter", "r": 14.7, "width": 2.6, "c": NAVY, "knock": 0},
            {"kind": "ticks", "name": "Crosshair", "r": 12.0, "count": 4, "len": 12.0, "w": 0.1},
            {"kind": "band", "name": "Sectors", "r": 6.0, "width": 6.0, "count": 12, "every": 2,
             "c": [0.86, 0.82, 0.72, 1]},
        ],
        "ha_hour": {"shape": "dauphine", "len": 7.5, "w": 1.3, "tail": 1.0, "feature_at": 22, "c": NAVY},
        "ha_minute": {"shape": "dauphine", "len": 12.6, "w": 1.1, "tail": 1.4, "feature_at": 18, "c": NAVY},
        "ha_second": {"shape": "lollipop", "len": 13.4, "w": 0.12, "tail": 3.0, "feature": 0.9,
                      "feature_at": 80, "c": ACCENT},
        "c_cap": NAVY,
    },
    "scale-arc": {
        "rings": [
            {"kind": "numerals", "name": "Scale", "r": 11.4, "count": 10, "start": -135, "span": 270,
             "labels": 7, "num_from": 0, "num_step": 10, "size": 1.3, "mode": 2},
            {"kind": "markers", "name": "Scale marks", "r": 14.3, "count": 10, "start": -135, "span": 270,
             "len": 1.5, "w": 0.3, "shape": "wedge", "taper": 0.3},
            {"kind": "ticks", "name": "Scale ticks", "r": 14.3, "count": 46, "start": -135, "span": 270,
             "len": 0.8, "w": 0.1, "skip": 1},
            {"kind": "band", "name": "Rail", "r": 14.5, "width": 0.12, "count": 1, "start": -135, "span": 270, "c": INK},
            {"kind": "band", "name": "Red zone", "r": 14.5, "width": 0.9, "count": 1, "start": 108, "span": 27,
             "c": ACCENT, "knock": 3, "clear": 0.12},
        ],
        "ha_hour": {"shape": "arrow", "len": 8.0, "w": 0.5, "tail": 1.5, "tip": 1.8, "feature": 1.6, "wall": 0.15},
        "ha_minute": {"shape": "syringe", "len": 12.8, "w": 0.3, "tail": 1.8, "tip": 2.2, "feature": 0.9, "feature_at": 45},
        "ha_second": {"shape": "breguet", "len": 13.2, "w": 0.14, "tail": 2.5, "tip": 1.0, "feature": 1.3,
                      "feature_at": 70, "counter": 0.8, "c": ACCENT},
    },
    "file-shapes": {
        "rings": [
            {"kind": "markers", "name": "File markers", "r": 13.8, "shape": "file", "file": "@marker.svg",
             "scale": 1.0, "wall": 0.12, "twelve": 1},
            {"kind": "ticks", "name": "Dots", "r": 14.5, "count": 60, "shape": "dot", "w": 0.25, "skip": 1},
            {"kind": "numerals", "name": "Roman", "r": 9.6, "labels": 2, "mode": 1, "size": 1.8},
        ],
        "ha_hour": {"shape": "file", "file": "@hand.svg", "fit": True, "len": 8.0, "c": INK},
        "ha_minute": {"shape": "file", "file": "@hand.svg", "fit": True, "len": 12.5, "w_scale": 0.7, "c": INK},
        "ha_second": {"shape": "pencil", "len": 13.0, "w": 0.15, "tip": 1.5, "tail": 2.8, "counter": 1.0, "c": ACCENT},
    },
}

MARKER_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
<path d="M5 0 L7.2 5 L5 10 L2.8 5 Z"/></svg>"""                       # a diamond, 10 pt tall
HAND_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -40 40 80">
<path d="M0 -40 C 6 -20 5 0 2 6 L2 10 L-2 10 L-2 6 C -5 0 -6 -20 0 -40 Z"/>
<circle cx="0" cy="0" r="3"/></svg>"""                                   # a leaf, tip at the top


def find_font():
    for p in ("/System/Library/Fonts/Supplemental/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if os.path.exists(p):
            return p
    raise SystemExit("no test font found — pass --font /path/to/font.ttf")


def load_dial(font):
    ns = {"__name__": "test_harness"}                      # not __main__: the window won't open
    exec(compile(open(DIAL, encoding="utf-8").read(), "dial.py", "exec"), ns)
    ns["TEST_FONT"] = font
    return ns


def resolve_files(over):
    """"@name" in a variant → a test file written next to the renders."""
    files = {"@marker.svg": MARKER_SVG, "@hand.svg": HAND_SVG}
    def fix(v):
        if isinstance(v, str) and v in files:
            path = os.path.join(OUT, "_" + v[1:])
            with open(path, "w") as f:
                f.write(files[v])
            return path
        if isinstance(v, dict):
            return {k: fix(x) for k, x in v.items()}
        if isinstance(v, list):
            return [fix(x) for x in v]
        return v
    return fix(over)


def render(ns, name, over):
    S = ns["fresh_settings"](resolve_files(over))
    t0 = time.perf_counter()
    static = ns["build_static"](S)
    ms = (time.perf_counter() - t0) * 1000
    D.newDrawing()
    mm = ns["MM"]
    ns["MM"] = mm * ZOOM
    ns["draw_page"](D, S, static, S["t"], preview=True)
    ns["MM"] = mm
    path = os.path.join(OUT, f"{name}.png")
    D.saveImage(path)
    D.endDrawing()
    rings = len(static["rings"])
    print(f"{name:20s} {rings} rings · geometry {ms:5.0f} ms → {path}")
    while ns["NOTES"]:
        print("    note:", ns["NOTES"].pop(0))
    return path


def check_pdf_painter(ns):
    """the PDF importer's drawing logic, fed plain operators (no Mac needed)."""
    pp = ns["PDFPainter"]()
    for op, v in [("q", []), ("cm", [2, 0, 0, 2, 10, 10]), ("re", [0, 0, 10, 5]), ("f", []), ("Q", []),  # black 10..30 × 10..20
                  ("g", [1]), ("re", [15, 12, 4, 4]), ("f", []),                                         # white: a hole
                  ("G", [0]), ("w", [2]), ("m", [0, 40]), ("l", [20, 40]), ("S", []),                    # a stroked line
                  ("g", [0]), ("re", [40, 0, 10, 10]), ("re", [42, 2, 6, 6]), ("f*", []),               # even-odd: a frame
                  ("BT", [])]:
        pp.op(op, v)
    p = pp.shape
    x0, y0, x1, y1 = p.bounds()
    checks = {
        "bounds": abs(x0) < 0.01 and abs(y0) < 0.01 and abs(x1 - 50) < 0.01 and abs(y1 - 41) < 0.01,
        "fill": p.pointInside((12, 12)),
        "white cuts a hole": not p.pointInside((17, 14)),
        "stroke outlined": p.pointInside((10, 40.5)) and not p.pointInside((10, 42)),
        "even-odd frame": p.pointInside((41, 5)) and not p.pointInside((45, 5)),
        "text reported": pp.skipped == {"text"},
    }
    for k, ok in checks.items():
        print(("PASS  " if ok else "FAIL  ") + "PDF painter: " + k)
    return all(checks.values())


def sheet(paths, cols=3):
    ims = [Image.open(p).convert("RGBA") for p in paths]
    w, h = ims[0].size
    rows = (len(ims) + cols - 1) // cols
    s = Image.new("RGBA", (w * cols, h * rows), "white")
    for i, im in enumerate(ims):
        s.alpha_composite(im, ((i % cols) * w, (i // cols) * h))
    out = os.path.join(OUT, "sheet.png")
    s.convert("RGB").save(out)
    print("sheet →", out)


if __name__ == "__main__":
    args = sys.argv[1:]
    font = None
    if "--font" in args:
        i = args.index("--font")
        font = args[i + 1]
        del args[i:i + 2]
    variants = json.load(open(args[0])) if args else VARIANTS
    os.makedirs(OUT, exist_ok=True)
    ns = load_dial(font or find_font())
    ok = check_pdf_painter(ns)
    sheet([render(ns, n, v) for n, v in variants.items()])
    sys.exit(0 if ok else 1)
