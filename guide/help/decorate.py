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

# the window at 1440 × 900, drawn on 160 × 100 as a caricature on one grid (Okay, 26 Oct 2026: "Align these items on
# thumbs, intrathumb logic can veer off for a consistent and visibly aligned grid. Think caricaturing, but subtle, buttons
# can be inset to accommodate red circles"; before: "small buttons around could be represented by dots, so you can center
# them"; "Centered icon darker, page sections distinctly colored"; "Red markers 2x thicker, if they cant center their
# target due to edges, shrink to center target"). The parts keep the app's order and sides; their places are the grid's:
#   M, the inset: every corner dot and the panel's content stand M from the edges, so a red box fits round each;
#   STEP, the pitch of a stack of dots, wide enough that a box round one stops short of its neighbour;
#   ROW, the top row: the panel's title line and the preview's top buttons on one line;
#   the tabs one row down, the panel's rule under them; the bottom stacks rise from BAR_Y − M in steps of STEP;
#   the dial centred in the preview. A section's target is drawn in ink and boxed.
import math
W, H = 160, 100
M, STEP, ROW = 7, 6, 7
PANEL_W, BAR_Y = 51.2, 93.1
BAR_MID = (BAR_Y + H) / 2
TAB_Y, RULE_Y = ROW + 9, ROW + 14.5
DIAL = ((PANEL_W + W) / 2, BAR_Y / 2, min(W - PANEL_W, BAR_Y) / 2 - 12.5)      # clear of the corner dots, so its box is too
R_DOT, R_TAB, PAD = 1.4, 2.2, 2.5      # a box 2.5 round its target: it rings one tab or dot and stops short of the next
TABS = {k: M + R_TAB + i * (PANEL_W - 2 * M - 2 * R_TAB) / 4 for i, k in enumerate(["dial", "rings", "hands", "date", "export"])}
L, R, B = PANEL_W + M, W - M, BAR_Y - M      # the preview's inset edges
DOTS = {      # each button's place on the grid
  "help": (PANEL_W - M - 2 * STEP - 3, ROW), "gallery": (PANEL_W - M - STEP - 1, ROW), "unit": (PANEL_W - M, ROW),
  "undo": (L, ROW), "redo": (L + STEP, ROW), "steps": (L + 2 * STEP, ROW), "versions": (L + 3 * STEP + 2, ROW),
  "guides": (R, ROW), "case": (R, ROW + STEP), "xray": (R, ROW + 2 * STEP),
  "backdrop": (L, B - STEP), "shadows": (L, B),
  "tiny": (R, B - 2 * STEP), "eye": (R, B - STEP), "iris": (R, B),
  "play": (M, BAR_MID), "zoomout": (R - 2 * STEP, BAR_MID), "zoomin": (R - STEP, BAR_MID), "fit": (R, BAR_MID),
}
WHERE = {      # what each section boxes: dots by name, "tab:x", "dial", "panel"; a list in a list is one box round them all
  "idea": [["dial"]], "screen": [], "first": [["panel"]], "gallery": [["gallery"]],
  "dial": [["tab:dial"]], "rings": [["tab:rings"]], "hands": [["tab:hands"]], "date": [["tab:date"]], "export": [["tab:export"]],
  "canvas": [["undo", "redo", "steps", "versions"], ["guides", "case", "xray"], ["backdrop", "shadows"], ["tiny", "eye", "iris"]],
  "show": [["iris"]], "bar": [["bar"]],
}

def bbox(t):
    if t == "dial": cx, cy, r = DIAL; return (cx - r, cy - r, cx + r, cy + r)
    if t == "bar": return (1.5, BAR_Y, W - 1.5, H - 1.5)
    if t == "panel": return (M - 2, ROW - 3, PANEL_W - M + 2, BAR_Y - M + 2)
    if t.startswith("tab:"): x = TABS[t[4:]]; return (x - R_TAB, TAB_Y - R_TAB, x + R_TAB, TAB_Y + R_TAB)
    x, y = DOTS[t]; return (x - R_DOT, y - R_DOT, x + R_DOT, y + R_DOT)

def box(targets):
    return box_round([bbox(t) for t in targets])

def box_round(bs):
    l, t, r, b = min(x[0] for x in bs), min(x[1] for x in bs), max(x[2] for x in bs), max(x[3] for x in bs)
    p = max(1, min(PAD, l - 1.5, t - 1.5, W - 1.5 - r, H - 1.5 - b))      # the same room on all four sides: less only where an edge is nearer, so the box stays centred
    return f'<rect x="{l - p:.2f}" y="{t - p:.2f}" width="{r - l + 2 * p:.2f}" height="{b - t + 2 * p:.2f}" rx="{min(p + 1.5, 4):.2f}" class="mark"/>'

def dot(x, y, on=False):
    return f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{R_DOT}" class="{"dot on" if on else "dot"}"/>'

def panel(x0, x1, tabs_n, on_tab=None, rows=True):
    # the panel: its title line on the top row, the tabs a row down, the rule, the pinned pane, the panes under it
    w = x1 - x0
    tx = lambda i: x0 + M + R_TAB + i * (w - 2 * M - 2 * R_TAB) / (tabs_n - 1)
    out = f'<rect x="{x0}" width="{w}" height="{BAR_Y}" class="panel"/><path d="M{x0 + M} {ROW}H{x0 + M + 13}" class="title"/>'
    out += "".join(f'<circle cx="{tx(i):.2f}" cy="{TAB_Y}" r="{R_TAB}" class="{"tab on" if i == on_tab else "tab"}"/>' for i in range(tabs_n))
    out += f'<path d="M{x0 + M - 2} {RULE_Y}H{x1 - M + 2}" class="rule"/><rect x="{x0 + M - 2}" y="{RULE_Y + 2}" width="{w - 2 * M + 4}" height="28" class="pin"/>'
    out += "".join(f'<path d="M{x0 + M} {y}H{x1 - M}" class="line"/>' for y in (RULE_Y + 8, RULE_Y + 14, RULE_Y + 20, RULE_Y + 26))
    if rows: out += "".join(f'<rect x="{x0 + M - 2}" y="{y}" width="{w - 2 * M + 4}" height="4.4" class="row"/>' for y in (RULE_Y + 32, RULE_Y + 36.4, RULE_Y + 40.8))
    return out

def bar(ruler):
    return f'<rect y="{BAR_Y}" width="{W}" height="{H - BAR_Y}" class="bar"/><path d="M{ruler[0]} {BAR_MID}H{ruler[1]}" class="ruler"/>'

def small_map(name):
    on = {t for group in WHERE[name] for t in group}
    cx, cy, r = DIAL
    ticks = "".join(f'<path d="M{cx + (r - 7) * math.sin(a * 0.5236):.1f} {cy - (r - 7) * math.cos(a * 0.5236):.1f}L{cx + (r - 2.5) * math.sin(a * 0.5236):.1f} {cy - (r - 2.5) * math.cos(a * 0.5236):.1f}"/>' for a in range(12))
    tab_on = next((i for i, k in enumerate(TABS) if "tab:" + k in on), None)
    dots = "".join(dot(x, y, k in on) for k, (x, y) in DOTS.items())
    return (f'<svg viewBox="0 0 {W} {H}" aria-hidden="true">'
            f'<rect width="{W}" height="{H}" class="backdrop"/>{panel(0, PANEL_W, 5, tab_on)}{bar((L, W / 2 + 20))}'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" class="{"dial on" if "dial" in on else "dial"}"/><g class="ticks">{ticks}</g>'
            f'<path d="M{cx} {cy}L{cx - 16} {cy - 10}M{cx} {cy}L{cx + 24} {cy - 14}" class="hands"/><circle cx="{cx}" cy="{cy}" r="2.2" class="cap"/>'
            f'{dots}{"".join(box(g) for g in WHERE[name])}{letters() if name == "canvas" else ""}</svg>')

def letters():
    # the four corners lettered A to D, clockwise from the top left, as the section's titles are (Okay, 27 Oct 2026:
    # "A, B, C, D"): each letter beside its box, toward the dial
    g = WHERE["canvas"]
    ext = lambda grp: [f(bbox(t)[i] for t in grp) for f, i in ((min, 0), (min, 1), (max, 2), (max, 3))]
    (l0, t0, r0, b0), (l1, t1, r1, b1), (l2, t2, r2, b2), (l3, t3, r3, b3) = (ext(x) for x in g)
    at = [("A", (l0 + r0) / 2, b0 + PAD + 5.5), ("B", l1 - PAD - 4.5, t1 + 2), ("C", l3 - PAD - 4.5, b3 - 2), ("D", r2 + PAD + 4.5, b2 - 2)]
    return "".join(f'<text x="{x:.2f}" y="{y:.2f}" class="letter">{c}</text>' for c, x, y in at)

def show_map():
    # the Show Case on the same grid (Okay, 26 Oct 2026: "add a second: the panel and bg changed version with a simple
    # silhouette watch with case and bracelet"; "Show the exit from show case as well on the thumb"): the canvas on its own
    # ground at left, the panel on the right, the bar along the foot; the way out boxed
    px = W - PANEL_W
    cx, cy = px / 2, BAR_Y / 2
    seams = "".join(f'<path d="M{cx - 9} {y:.1f}H{cx + 9}" class="seam"/>' for y in (cy - 33, cy - 28, cy - 23, cy + 23, cy + 28, cy + 33, cy + 38))
    shen = "".join(dot(px + M + i * (PANEL_W - 2 * M) / 5, B) for i in range(6))
    dots = "".join(dot(M + i * STEP + (2 if i == 3 else 0), ROW) for i in range(4)) + dot(M, B) + dot(px - M, B - STEP) + dot(px - M, B, True)
    return (f'<svg viewBox="0 0 {W} {H}" aria-hidden="true">'
            f'<rect width="{W}" height="{H}" class="ground"/><circle cx="{cx}" cy="{cy}" r="42" class="spot"/>'
            f'{panel(px, W, 4, rows=False)}<path d="M{px + M - 2} {B - 4.5}H{W - M + 2}" class="rule"/>{shen}'
            f'<rect x="{cx - 9}" y="3" width="18" height="{BAR_Y - 6}" class="band"/>{seams}'
            f'<rect x="{cx - 14}" y="{cy - 20}" width="28" height="40" rx="4" class="lugs"/>'
            f'<circle cx="{cx}" cy="{cy}" r="17" class="case"/><circle cx="{cx}" cy="{cy}" r="12.5" class="face"/>'
            f'<path d="M{cx} {cy}L{cx - 5.5} {cy - 3.5}M{cx} {cy}L{cx + 8.5} {cy - 5}" class="hands"/>'
            f'{bar((M + 20, px - 10))}{dots}{box_round([(px - M - R_DOT, B - R_DOT, px - M + R_DOT, B + R_DOT)])}</svg>')

WHERE_CAP = '<span class="where">The red box is where this sits on the screen. Press for the larger view.</span>'
CAPS = {"show": '<span class="where">In: the switch at the preview’s bottom right.</span>',
        "show-watch": '<span class="where">Out: the same switch, at the watch’s bottom right.</span>'}

text = page.read_text()
text = re.sub(r'<i class="ic" data-ic="([a-z0-9-]+)">.*?</i>', lambda m: f'<i class="ic" data-ic="{m[1]}">{icon(m[1])}</i>', text, flags=re.S)
text = re.sub(r'<span class="map" data-map="([a-z-]+)"[^>]*>.*?</svg>(<span class="where">.*?</span>)?</span>', lambda m: f'<span class="map" data-map="{m[1]}" title="Where on the screen">{show_map() if m[1] == "show-watch" else small_map(m[1])}{CAPS.get(m[1], WHERE_CAP)}</span>', text, flags=re.S)
page.write_text(text)
print("icons:", len(re.findall(r'class="ic"', text)), "· maps:", len(re.findall(r'class="map"', text)))
