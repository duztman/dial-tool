"""cards.py — the guidebook's picture work, called by build.mjs with a list of jobs (JSON).

  tint  — a whole screenshot through a gradient map (Okay, 14 Oct 2026: "Photoshop's gradient map: the section
          colour as white, a slightly darker version of it as black … a low contrast image"). → JPEG
  card  — one part of a screenshot, cut out exactly and given a margin of its own background colour
          ("isolate, then extend the sides of the thumbnail with just the colour"). → PNG
Screenshots are 3 pixels a point (shots.mjs). Run: python3 cards.py jobs.json
"""
import json, sys, os
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
OUT = os.path.join(IMG, "made")
os.makedirs(OUT, exist_ok=True)
PX = 3


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tint(job):
    out = os.path.join(OUT, job["out"])
    src = os.path.join(IMG, job["shot"] + ".png")
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(src):
        return
    im = Image.open(src).convert("L")
    im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)      # a background: 1.5 pixels a point is plenty
    dark, light = hexrgb(job["dark"]), hexrgb(job["light"])
    ImageOps.colorize(im, dark, light).save(out, quality=86)


def card(job):
    im = Image.open(os.path.join(IMG, job["shot"] + ".png")).convert("RGB")
    x, y, w, h = [v * PX for v in job["rect"]]
    x, y, w, h = round(x), round(y), round(w), round(h)
    part = im.crop((x, y, x + w, y + h))
    bg = job.get("bg")
    if bg:
        bg = hexrgb(bg)
    else:                                   # the commonest colour along the part's edge: its own background
        from collections import Counter
        edge = [part.getpixel((i, j)) for i in range(0, w, 3) for j in (1, h - 2)] + [part.getpixel((i, j)) for j in range(0, h, 3) for i in (1, w - 2)]
        bg = Counter(edge).most_common(1)[0][0]
    p = round(job.get("pad", 0) * PX)
    made = Image.new("RGB", (w + 2 * p, h + 2 * p), bg)
    made.paste(part, (p, p))
    made.save(os.path.join(OUT, job["out"]))


jobs = json.load(open(sys.argv[1]))
for j in jobs:
    {"tint": tint, "card": card}[j["kind"]](j)
print(f"cards.py: {len(jobs)} jobs")
