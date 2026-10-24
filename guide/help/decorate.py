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
    svg = re.sub(r' width="[\d.]+" height="[\d.]+"', "", svg, count=1)      # the page sets its size
    return svg

# the window, in % of its width and height, as measured on the app at 1440 × 900 (shoot.cjs prints them)
PANEL, BAR = 32, 93
TABS = [(1.7 + 5.72 * i, 4.8, 5.72, 9.6) for i in range(5)]      # Dial, Rings, Hands, Windows, Export, side by side
PARTS = {
    "topleft": (32.8, 1.3, 13.6, 3.6), "topright": (91, 1.3, 8.2, 11.9),
    "bottomleft": (32.8, 84.1, 6.9, 7.6), "bottomright": (96.9, 84.1, 2.2, 7.7), "iris": (96.9, 88.3, 2.2, 3.5),
}
WHERE = {      # what each section fills
    "idea": [(PANEL, 0, 100 - PANEL, BAR)],
    "screen": [],
    "first": [(0, 0, PANEL, BAR)],
    # a tab: the panel below it faint, the tab itself solid
    "dial": [("soft", 0, 14.4, PANEL, BAR - 14.4), TABS[0]], "rings": [("soft", 0, 14.4, PANEL, BAR - 14.4), TABS[1]],
    "hands": [("soft", 0, 14.4, PANEL, BAR - 14.4), TABS[2]], "date": [("soft", 0, 14.4, PANEL, BAR - 14.4), TABS[3]],
    "export": [("soft", 0, 14.4, PANEL, BAR - 14.4), TABS[4]],
    "canvas": [PARTS["topleft"], PARTS["topright"], PARTS["bottomleft"], PARTS["bottomright"], (0, BAR, 100, 100 - BAR)],
    "show": [PARTS["iris"]],
}

def small_map(name):
    w, h = 64, 40      # the window's shape, 16 : 10
    X = lambda v: round(v * w / 100, 2)
    Y = lambda v: round(v * h / 100, 2)
    def part(r):
        kind, (x, y, a, b) = (r[0], r[1:]) if isinstance(r[0], str) else ("on", r)
        a, b = max(X(a), 3), max(Y(b), 3)      # a corner button is a few points of the window: drawn at least 3, so it shows
        return f'<rect x="{min(X(x), w - a)}" y="{min(Y(y), h - b)}" width="{a}" height="{b}" rx=".6" class="{kind}"/>'
    parts = "".join(part(r) for r in WHERE[name])
    return (f'<svg viewBox="-.5 -.5 {w + 1} {h + 1}" aria-hidden="true">'
            f'<rect width="{w}" height="{h}" rx="1.5" class="frame"/>'
            f'<path d="M{X(PANEL)} 0V{Y(BAR)}M0 {Y(BAR)}H{w}" class="line"/>{parts}</svg>')

text = page.read_text()
text = re.sub(r'<i class="ic" data-ic="([a-z]+)">.*?</i>', lambda m: f'<i class="ic" data-ic="{m[1]}">{icon(m[1])}</i>', text, flags=re.S)
text = re.sub(r'<span class="map" data-map="([a-z]+)"[^>]*>.*?</span>', lambda m: f'<span class="map" data-map="{m[1]}" title="Where on the screen">{small_map(m[1])}</span>', text, flags=re.S)
page.write_text(text)
print("icons:", len(re.findall(r'class="ic"', text)), "· maps:", len(re.findall(r'class="map"', text)))
