"""check_lines.py — does any leader line or highlight box run over the picture under it? (Okay, 14 Oct 2026:
"avoid content while drawing lines"; "a zero padding square … generates overlaps with the highlightee".)
Reads out/leaders.json and out/page-NN-bare.png (each page with its lines and labels hidden) and looks along every
segment: where the picture under the line changes sharply (text, an edge, an icon), the line is crossing content.
Leaders marked "through" (on the dial itself) are skipped. Prints one line per problem; exit 0 always."""
import json, os, sys
from PIL import Image, ImageFilter, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out", "review")
D = json.load(open(os.path.join(OUT, "leaders.json"))); data = D["leaders"]; FR = D["frames"]
cache = {}
def edges(no):
    if no not in cache:
        im = Image.open(os.path.join(OUT, f"page-{no}-bare.png")).convert("L")
        mx, mn = im.filter(ImageFilter.MaxFilter(3)), im.filter(ImageFilter.MinFilter(3))
        cache[no] = (ImageChops.subtract(mx, mn), im.width / 297.0)
    return cache[no]
def hits(no, pts, skip_start=0.9, skip_end=0.3):
    e, px = edges(no); bad = []
    segs = list(zip(pts, pts[1:])); total = sum(abs(b[0]-a[0]) + abs(b[1]-a[1]) for a, b in segs); run = 0
    for a, b in segs:
        L = abs(b[0]-a[0]) + abs(b[1]-a[1]); n = max(1, int(L / 0.2))
        for i in range(n + 1):
            d = run + L * i / n
            if d < skip_start or d > total - skip_end: continue
            x = a[0] + (b[0]-a[0]) * i / n; y = a[1] + (b[1]-a[1]) * i / n
            if any((abs(x-f[0]) < .6 or abs(x-f[2]) < .6) and f[1]-.6 < y < f[3]+.6 or (abs(y-f[1]) < .6 or abs(y-f[3]) < .6) and f[0]-.6 < x < f[2]+.6 for f in FR.get(no, [])): continue
            v = e.getpixel((min(e.width-1, int(x*px)), min(e.height-1, int(y*px))))
            if v > 60: bad.append((round(x, 1), round(y, 1)))
        run += L
    return bad
problems = 0
for L in data:
    if L["through"]: continue
    b = hits(L["page"], L["pts"])
    if len(b) > 1: problems += 1; print(f"LINE   p{L['page']} \"{L['text'][:34]}\" crosses the picture at {b[0]} … ({len(b)} points)")
    if L.get("box"):
        x, y, w, h = L["box"]; ring = [[x, y], [x+w, y], [x+w, y+h], [x, y+h], [x, y]]
        bb = hits(L["page"], ring, 0, 0)
        if len(bb) > 2: problems += 1; print(f"BOX    p{L['page']} \"{L['text'][:34]}\" box touches what it boxes at {bb[0]} … ({len(bb)} points)")
print(f"check_lines: {problems} problems")
