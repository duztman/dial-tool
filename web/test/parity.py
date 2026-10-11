"""
parity.py — does the web version draw what dial.py draws?

Takes the test harness's dials (and any settings files passed on the command line),
draws each one twice — dial.py through drawbot-skia, web/src/geometry.js through Node —
as an export PDF, and compares the two pictures. Both use the same plain test font.

    pip install drawbot-skia skia-pathops pillow pymupdf      (once)
    cd web && npm install                                     (once)
    python web/test/parity.py [more.json …]

Writes web/test/out/sheet.png: dial.py | web | difference, one row per dial.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "tools"))
import test_harness as H
import drawbot_skia.drawbot as D
import pymupdf
from PIL import Image, ImageChops

OUT = os.path.join(HERE, "out")
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
PX = 1200
LIMIT = 0.7           # % of pixels that may differ clearly: hairlines along every edge (the two PDFs' pages
                      # differ by 0.01 mm) and kerning, which the Python harness's plain font lacks


def picture(path):
    page = pymupdf.open(path)[0]
    z = PX / page.rect.width
    pm = page.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=False)
    return Image.frombytes("RGB", (pm.width, pm.height), pm.samples).resize((PX, PX))


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    ns = H.load_dial(FONT)
    dials = {k: v for k, v in H.VARIANTS.items() if k != "file-shapes"}        # imports: not in the web version yet
    dials["round-hands"] = {"ha_hour": {"round": 2, "len": 8, "w": 1.4}, "ha_minute": {"shape": "pencil", "round": 2, "len": 13, "tip": 3},
                            "ha_second": {"shape": "lollipop", "round": 1, "len": 13, "w": 0.3, "feature": 1.2, "tail": 3},
                            "rings": [{"kind": "markers", "r": 14.4, "round_out": 2, "round_in": 2, "w": 0.9},
                                      {"kind": "ticks", "r": 14.4, "count": 60, "len": 1, "w": 0.3, "round_out": 2, "round_in": 2, "skip": 1}]}
    for extra in sys.argv[1:]:
        dials[os.path.splitext(os.path.basename(extra))[0]] = json.load(open(extra))
    for name, over in dials.items():
        S = ns["fresh_settings"](over)
        if name == "round-hands":                  # dial.py has no round hands: its picture is the square-ended one
            for h in ("ha_hour", "ha_minute", "ha_second"):
                S[h]["round"] = over[h]["round"]
        json.dump(S, open(os.path.join(OUT, name + ".json"), "w"))
        D.newDrawing()
        ns["draw_page"](D, S, ns["build_static"](S), S["t"], preview=False)
        D.saveImage(os.path.join(OUT, name + ".py.pdf"))
        D.endDrawing()
    subprocess.run(["node", os.path.join(HERE, "parity.mjs"), OUT], check=True)

    rows, bad = [], []
    for name in dials:
        a, b = picture(os.path.join(OUT, name + ".py.pdf")), picture(os.path.join(OUT, name + ".web.pdf"))
        d = ImageChops.difference(a, b).convert("L")
        share = sum(d.histogram()[65:]) / (PX * PX) * 100
        expected = name == "round-hands"
        print(f"{'ok   ' if share < LIMIT or expected else 'DIFF '} {name:22s} {share:.3f} % of pixels differ" + (" (expected: round ends are new)" if expected else ""))
        if share >= LIMIT and not expected:
            bad.append(name)
        row = Image.new("RGB", (PX * 3, PX), "white")
        row.paste(a, (0, 0)); row.paste(b, (PX, 0)); row.paste(d.point(lambda v: 255 - min(255, v * 2)).convert("RGB"), (PX * 2, 0))
        rows.append(row.resize((900, 300)))
    sheet = Image.new("RGB", (900, 300 * len(rows)), "white")
    for i, row in enumerate(rows):
        sheet.paste(row, (0, 300 * i))
    sheet.save(os.path.join(OUT, "sheet.png"))
    print("sheet →", os.path.join(OUT, "sheet.png"))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
