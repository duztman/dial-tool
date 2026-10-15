"""diff.py — the picture diff (guide/PLAN.md §5): which of the guide's pictures changed between two sets of shots.

  python3 guide/look/diff.py OLD_DIR NEW_DIR          (folders written by shots.mjs; the default OLD is guide/look/img)

For every crop a page uses (out/review/jobs.json, written by build.mjs) it cuts the same rectangle from both shots and
compares them; the whole-window pictures are compared with the title line's version number covered (it changes every
release and means nothing). A picture is flagged when more than 0.2 % of its pixels differ by more than 24 levels
(of 255) — enough to ignore antialiasing noise, small enough to catch one changed word. Flags go to a human look;
exit 1 if any. Written 15 Oct 2026 (step 7's gate: "a label change caught by the diff").
"""
import json, os, sys
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "img")
NEW = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "img-new")
PX = 3
jobs = json.load(open(os.path.join(HERE, "out", "review", "jobs.json")))
rects = json.load(open(os.path.join(OLD, "rects.json")))["rects"]


def changed(a, b):
    if a.size != b.size:
        return 1.0
    d = ImageChops.difference(a.convert("L"), b.convert("L")).point(lambda v: 255 if v > 24 else 0)
    return sum(d.histogram()[255:]) / (a.width * a.height)


def cut(folder, shot, rect):
    im = Image.open(os.path.join(folder, shot + ".png"))
    x, y, w, h = [round(v * PX) for v in rect]
    return im.crop((x, y, x + w, y + h))


flags = []
seen = set()
for j in jobs:
    key = (j["shot"], tuple(j["rect"]))
    if key in seen:
        continue
    seen.add(key)
    f = changed(cut(OLD, j["shot"], j["rect"]), cut(NEW, j["shot"], j["rect"]))
    line = f'{j["out"]:<22} {j["shot"]:<8} {" ".join(str(round(v)) for v in j["rect"]):<22} {100 * f:6.2f} % changed'
    print(("FLAG   " if f > 0.002 else "same   ") + line)
    if f > 0.002:
        flags.append(j["out"])
# the whole windows, the version covered
for shot, cover in (("window", rects["window"]["version"]), ("phone", rects["phone"]["title"])):
    a, b = Image.open(os.path.join(OLD, shot + ".png")), Image.open(os.path.join(NEW, shot + ".png"))
    if cover:
        x, y, w, h = [round(v * PX) for v in cover]
        for im in (a, b):
            im.paste((255, 255, 255), (x - 6, y - 6, x + w + 6, y + h + 6))
    f = changed(a, b)
    print(("FLAG   " if f > 0.002 else "same   ") + f"{shot + '.png (whole)':<22} {'':<31} {100 * f:6.2f} % changed")
    if f > 0.002:
        flags.append(shot)
print(f"diff: {len(flags)} of {len(seen) + 2} pictures changed" + (": " + " ".join(flags) if flags else ""))
sys.exit(1 if flags else 0)
