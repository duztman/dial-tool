# decorate.py — fills the help page's icons and small maps, in place. Re-runnable.
#   python3 guide/help/decorate.py   (after icons.cjs has written icons.json)
#
# <i class="ic" data-ic="undo"></i>        → the app's own sign for that button (icons.json, from icons.cjs)
# <span class="map" data-map="rings"></span> → a small picture of the whole window, the part this section is about filled in
import json, re
from pathlib import Path

here = Path(__file__).parent
page = here / "index.html"
icons = json.loads((here / "icons.json").read_text())

def icon(name):
    svg = icons[name]
    # ids inside an icon (its masks, gradients) made its own, so two icons on the page never share one
    for old in set(re.findall(r'id="([^"]+)"', svg)):
        svg = svg.replace(f'id="{old}"', f'id="h-{name}-{old}"').replace(f"url(#{old})", f"url(#h-{name}-{old})")
    vb = re.search(r'viewBox="([-\d. ]+)"', svg)[1].split()
    # the drawing keeps its own width and height, so Safari knows its shape (without them it takes an svg as 300 px wide,
    # and the page scrolled sideways on the iPad); the page sets the height, the width follows
    svg = re.sub(r' width="[\d.]+" height="[\d.]+"', f' width="{vb[2]}" height="{vb[3]}"', svg, count=1)
    return svg

# the window at 1440 × 900, drawn on 160 × 100 (x in % × 1.6, y in %), as measured on the app (Okay, 26 Oct 2026: "You can
# have more detail in these. Centered icon darker, page sections distinctly colored … small buttons around could be
# represented by dots, so you can center them"; "Red markers 2x thicker, if they cant center their target due to
# edges, shrink to center target"). Every button is a dot at its own centre; a section's target is drawn in ink and boxed.
import math
W, H = 160, 100
X = lambda v: round(v * 1.6, 2)
PANEL_W, BAR_Y = X(32), 93.1
DIAL = (X(66), 46.6, 39.6)
TABS = {"dial": 4.5, "rings": 10.2, "hands": 16, "date": 21.7, "export": 27.4}
DOTS = {      # a button's centre, in % of the window
  "gallery": (19.6, 2.3), "help": (15.9, 2.3), "unit": (29.5, 2.4),
  "undo": (34, 3.1), "redo": (36.2, 3.1), "steps": (38.4, 3.1), "versions": (42, 3.1),
  "guides": (95.5, 3.1), "case": (95.5, 7.3), "xray": (95.5, 11.4),
  "backdrop": (34.6, 85.8), "shadows": (34.6, 90),
  "tiny": (98.1, 81.7), "eye": (98.1, 85.8), "iris": (98.1, 90),
  "play": (4.8, 96.6), "zoomout": (93.6, 96.6), "zoomin": (95.8, 96.6), "fit": (98.1, 96.6),
}
WHERE = {      # what each section boxes: dots by name, "tab:x", "dial", "panel", "bar"; a list in a list is one box round them all
  "idea": [["dial"]], "screen": [], "first": [["panel"]], "gallery": [["gallery"]],
  "dial": [["tab:dial"]], "rings": [["tab:rings"]], "hands": [["tab:hands"]], "date": [["tab:date"]], "export": [["tab:export"]],
  "canvas": [["undo", "redo", "steps", "versions"], ["guides", "case", "xray"], ["backdrop", "shadows"], ["tiny", "eye", "iris"]],
  "show": [["iris"]],
}
R_DOT, R_TAB, PAD = 1.4, 2.6, 4

def bbox(t):
    if t == "dial": cx, cy, r = DIAL; return (cx - r, cy - r, cx + r, cy + r)
    if t == "panel": return (1.5, 1.5, PANEL_W - 1, BAR_Y - 1)
    if t.startswith("tab:"): x = X(TABS[t[4:]]); return (x - R_TAB, 10.2 - R_TAB, x + R_TAB, 10.2 + R_TAB)
    x, y = DOTS[t]; return (X(x) - R_DOT, y - R_DOT, X(x) + R_DOT, y + R_DOT)

def box(targets):
    bs = [bbox(t) for t in targets]
    l, t, r, b = min(x[0] for x in bs), min(x[1] for x in bs), max(x[2] for x in bs), max(x[3] for x in bs)
    p = max(1, min(PAD, l - 1.5, t - 1.5, W - 1.5 - r, H - 1.5 - b))      # the same room on all four sides: less only where an edge is nearer, so the box stays centred
    return f'<rect x="{l - p:.2f}" y="{t - p:.2f}" width="{r - l + 2 * p:.2f}" height="{b - t + 2 * p:.2f}" rx="{min(p + 1.5, 4):.2f}" class="mark"/>'

def small_map(name):
    on = {t for group in WHERE[name] for t in group}
    cx, cy, r = DIAL
    ticks = "".join(f'<path d="M{cx + (r - 7) * math.sin(a * 0.5236):.1f} {cy - (r - 7) * math.cos(a * 0.5236):.1f}L{cx + (r - 2.5) * math.sin(a * 0.5236):.1f} {cy - (r - 2.5) * math.cos(a * 0.5236):.1f}"/>' for a in range(12))
    rows = "".join(f'<rect x="{X(1.7)}" y="{y}" width="{X(28.6)}" height="{h}" class="row"/>' for y, h in [(47.2, 3.8), (51.6, 3.8), (56.0, 3.8)])
    lines = "".join(f'<path d="M{X(3)} {y}H{X(29)}" class="line"/>' for y in (20, 26, 32, 38))
    tabs = "".join(f'<circle cx="{X(x)}" cy="10.2" r="{R_TAB}" class="{"tab on" if "tab:" + k in on else "tab"}"/>' for k, x in TABS.items())
    dots = "".join(f'<circle cx="{X(x)}" cy="{y}" r="{R_DOT}" class="{"dot on" if k in on else "dot"}"/>' for k, (x, y) in DOTS.items())
    boxes = "".join(box(g) for g in WHERE[name])
    return (f'<svg viewBox="0 0 {W} {H}" aria-hidden="true">'
            f'<rect width="{W}" height="{H}" class="backdrop"/>'
            f'<rect width="{PANEL_W}" height="{BAR_Y}" class="panel"/>'
            f'<path d="M{X(3.5)} 2.3H{X(12.5)}" class="title"/>'
            f'<path d="M{X(1.7)} 14.2H{X(30.3)}" class="rule"/>'
            f'<rect x="{X(1.7)}" y="15" width="{X(28.6)}" height="31.4" class="pin"/>{lines}{rows}{tabs}'
            f'<rect y="{BAR_Y}" width="{W}" height="{H - BAR_Y}" class="bar"/>'
            f'<path d="M{X(33)} 96.6H{X(67)}" class="ruler"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" class="{"dial on" if "dial" in on else "dial"}"/><g class="ticks">{ticks}</g>'
            f'<path d="M{cx} {cy}L{cx - 16} {cy - 10}M{cx} {cy}L{cx + 24} {cy - 14}" class="hands"/><circle cx="{cx}" cy="{cy}" r="2.2" class="cap"/>'
            f'{dots}{boxes}</svg>')

WHERE_CAP = '<span class="where">The red box is where this sits on the screen. Press for the larger view.</span>'
CAPS = {"show-watch": '<span class="where">Show mode itself: the panel on the right, the watch on its own ground. Press for the larger view.</span>'}

def show_map():
    # show mode, simply (Okay, 26 Oct 2026: "add a second: the panel and bg changed version with a simple silhouette watch
    # with case and bracelet"): the canvas on its own ground at left, the panel on the right, the bar along the foot
    px = X(66)                                     # the panel's left edge, as shoot.cjs measures show mode
    tabs = "".join(f'<circle cx="{px + 8 + i * 13.2:.1f}" cy="10.2" r="{R_TAB}" class="tab"/>' for i in range(4))
    cx, cy = px / 2, 46.6
    links = "".join(f'<rect x="{cx - 9}" y="{y:.1f}" width="18" height="5" rx="1" class="link"/>' for y in [cy - 31, cy - 25.5, cy + 20.5, cy + 26])
    return (f'<svg viewBox="0 0 {W} {H}" aria-hidden="true">'
            f'<rect width="{W}" height="{H}" class="ground"/>'
            f'<circle cx="{cx}" cy="{cy}" r="42" class="spot"/>'
            f'<rect x="{px}" width="{W - px}" height="{BAR_Y}" class="panel"/>'
            f'<path d="M{px + 4} 2.3H{px + 22}" class="title"/><path d="M{px + 3} 14.2H{W - 3}" class="rule"/>{tabs}'
            f'<rect x="{px + 3}" y="15" width="{W - px - 6}" height="31.4" class="pin"/>'
            + "".join(f'<path d="M{px + 5} {y}H{W - 5}" class="line"/>' for y in (20, 26, 32, 38, 52, 58, 64)) +
            f'<rect x="{cx - 9}" y="4" width="18" height="{BAR_Y - 8}" class="band"/>{links}'
            f'<rect x="{cx - 14}" y="{cy - 20}" width="28" height="40" rx="4" class="lugs"/>'
            f'<circle cx="{cx}" cy="{cy}" r="17" class="case"/><circle cx="{cx}" cy="{cy}" r="12.5" class="face"/>'
            f'<path d="M{cx} {cy}L{cx - 5.5} {cy - 3.5}M{cx} {cy}L{cx + 8.5} {cy - 5}" class="hands"/>'
            f'<rect y="{BAR_Y}" width="{W}" height="{H - BAR_Y}" class="bar"/><path d="M{X(33)} 96.6H{X(60)}" class="ruler"/></svg>')

text = page.read_text()
text = re.sub(r'<i class="ic" data-ic="([a-z0-9-]+)">.*?</i>', lambda m: f'<i class="ic" data-ic="{m[1]}">{icon(m[1])}</i>', text, flags=re.S)
text = re.sub(r'<span class="map" data-map="([a-z-]+)"[^>]*>.*?</svg>(<span class="where">.*?</span>)?</span>', lambda m: f'<span class="map" data-map="{m[1]}" title="Where on the screen">{show_map() if m[1] == "show-watch" else small_map(m[1])}{CAPS.get(m[1], WHERE_CAP)}</span>', text, flags=re.S)
page.write_text(text)
print("icons:", len(re.findall(r'class="ic"', text)), "· maps:", len(re.findall(r'class="map"', text)))
