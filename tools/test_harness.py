"""
test_harness.py — render dial.py's geometry without the DrawBot app.

Runs sections 1–3 of dial.py (settings, geometry, drawing) through
drawbot-skia, a cross-platform port of DrawBot's drawing API, and writes
a contact sheet. The interface (section 4) is skipped: it needs macOS.

Text uses a plain font here (no FormattedString), so kerning, OpenType
features and variable axes are NOT tested by this harness.

Setup (once):
    pip install drawbot-skia skia-pathops pillow

Use:
    python tools/test_harness.py                      # built-in variants
    python tools/test_harness.py variants.json        # your own: {"name": {setting: value}}
    python tools/test_harness.py --font /path/font.ttf

Writes test-renders/<name>.png and test-renders/sheet.png.
"""

import json, os, sys, time

import drawbot_skia.drawbot as D
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DIAL = os.path.join(HERE, "..", "dial.py")
OUT = os.path.join(HERE, "..", "test-renders")
ZOOM = 8                                                   # preview scale; geometry stays in mm

VARIANTS = {
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
}


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


def render(ns, name, over):
    S = ns["fresh_settings"](over)
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
    print(f"{name:20s} geometry {ms:5.0f} ms → {path}")
    return path


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
    sheet([render(ns, n, v) for n, v in variants.items()])
