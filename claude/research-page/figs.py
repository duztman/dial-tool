# Explanatory drawings for the Dial Research page. Each returns an inline <figure> with an SVG that uses the page's tokens.
import math

INK = "var(--ink)"; MUTE = "var(--mute)"; LINE = "var(--line)"; BUG = "var(--bug)"; TILE = "var(--tile)"; PAPER = "var(--paper)"
F = "font-family:Inter,ui-sans-serif,system-ui,sans-serif"

def fig(svg, cap, num, w=760, h=400, id=None):
    return (f'<figure class="draw" id="{id or ""}"><svg viewBox="0 0 {w} {h}" role="img" aria-label="{cap}" style="{F};font-size:13px">{svg}</svg>'
            f'<figcaption><b>Fig. {num}.</b> {cap}</figcaption></figure>')

def t(x, y, s, size=13, fill=INK, anchor="start", weight=400, extra=""):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" {extra}>{s}</text>'

# ── A. The chain: brief to delivery, where the surprises land (vertical) ──
def chain():
    steps = [("Brief", "the founder draws", ""), ("2D and CAD", "Illustrator, Rhino, SolidWorks; 1–3 months", ""), ("Render", "KeyShot, sent as the brief", ""),
             ("Factory drawing", "the maker redraws to its own tolerances", "pinion height against raised indices; feet"),
             ("Sample 1", "4–8 weeks", "colour on the real material · lume thickness and brightness · index boldness · matte where a sunburst was meant"),
             ("Corrections", "a mould change: about 3 months", ""), ("Sample 2", "4–8 weeks", ""),
             ("Production", "8–12 weeks; 3–4 months a dial at Flückiger", "a batch returning in the wrong shade"),
             ("Delivery", "9–15 months from the brief", "")]
    x = 150; y0 = 44; s = ""; y = y0; ys = []
    s += t(x + 16, 24, "in red: where the surprises land, from Their pain", 12, BUG, "start", 600)
    for i, (a, b, c) in enumerate(steps):
        ys.append(y)
        s += f'<circle cx="{x}" cy="{y}" r="6" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>'
        s += t(x - 16, y + 5, a, 13, INK, "end", 600) + t(x + 16, y + 5, b, 12, MUTE)
        words = c.split(" · ") if c else []
        for k, w_ in enumerate(words):
            s += t(x + 16, y + 22 + k * 15, w_, 12, BUG, "start", 600)
        y += 40 + (6 + 15 * len(words) if words else 0)
    s = f'<line x1="{x}" y1="{ys[0]}" x2="{x}" y2="{ys[-1]}" stroke="{LINE}" stroke-width="2"/>' + s
    s += t(24, y + 2, "Paper does not decide; the sample does. The surprises cluster at sample 1, the first time colour, lume", 12, MUTE)
    s += t(24, y + 18, "and boldness exist on the real material.", 12, MUTE)
    dy = 0; steps_h = y + 36
    return fig(s, "The chain from brief to delivery, and where the surprises land. Durations inferred from the Nodus, Mk II, Firle and Fehr accounts [I]; the surprises are the incidents in Their pain.", 20, 760, steps_h, "fig-chain")

# ── B. Horizontal bars (failure modes, price bands) ──
def bars(rows, title, cap, num, unit="", id=None, accent_first=True, w=760):
    rowh = 30; top = 48; left = 230; bw = w - left - 70; peak = max(v for _, v in rows)
    h = top + len(rows) * rowh + 34
    s = t(24, 26, title, 13, MUTE)
    for i, (name, v) in enumerate(rows):
        y = top + i * rowh
        fill = BUG if (i == 0 and accent_first) else TILE
        s += t(left - 10, y + 19, name, 13, INK, "end")
        s += f'<rect x="{left}" y="{y+5}" width="{bw*v/peak:.0f}" height="18" fill="{fill}" stroke="{LINE}" stroke-width="1" rx="2"/>'
        s += t(left + bw * v / peak + 8, y + 19, f"{v}{unit}", 13, INK, "start", 600, 'style="font-variant-numeric:tabular-nums"')
    return fig(s, cap, num, w, h, id)

def failure_modes():
    rows = [("Lume under-delivery", 10), ("Colour drift, sample to batch", 4), ("Alignment", 4), ("Render against reality", 4), ("Enamel and special-finish rejects", 3), ("Print legibility", 2)]
    return bars(rows, "Incidents found, 2017–2026, by failure mode", "What goes wrong with microbrand dials: 27 incidents by mode, from the tables in Their pain. Eleven rest on unopened snippets.", 21, id="fig-pain")

def price_bands():
    rows = [("under $500", 11), ("$500–1,500", 14), ("$1,500–3,000", 4), ("$3,000–5,000", 3)]
    return bars(rows, "Brands by retail price band, 32 brands with a stated price", "Where the 32 priced brands sit. Placed by the stated price or the midpoint of a range [D]; the sample leans to US and UK coverage.", 22, id="fig-bands", accent_first=False)

def fairs():
    data = [("Windup NYC", [("2025", 140), ("2026", 170)]), ("Dubai Watch Week", [("2023", 63), ("2025", 90)]), ("Geneva Watch Days", [("2020", 17), ("2022", 33), ("2024", 52), ("2025", 67), ("2026", 71)]), ("British Watchmakers' Day", [("2025", 44), ("2026", 48)])]
    left = 90; bw = 580; peak = 180; y = 48; s = t(24, 26, "Exhibiting brands per edition, as announced", 13, MUTE)
    for name, items in data:
        s += t(24, y + 12, name, 13, INK, "start", 600); y += 22
        for yr, v in items:
            s += t(left - 8, y + 13, yr, 12, MUTE, "end")
            s += f'<rect x="{left}" y="{y+2}" width="{bw*v/peak:.0f}" height="15" fill="{BUG if name.startswith("Geneva") else TILE}" stroke="{LINE}" rx="2"/>'
            s += t(left + bw * v / peak + 6, y + 13, str(v), 12, INK, "start", 600); y += 22
        y += 10
    return fig(s, "Fair rosters grew every year; Geneva Watch Days from 17 brands in 2020 to 71 in 2026. Windup's counts include strap and accessory makers.", 19, 760, y + 6, "fig-fairs")

# ── C. The groove rule: three finishes under one sun at 9 o'clock ──
def groove():
    def dial(cx, cy, r, kind, label, sub):
        s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#2b2b2b" stroke="{LINE}"/>'
        if kind == "sun":
            for k in range(180):
                a = k * 2; rad = math.radians(a)
                # bright where the ray is at 90° to the line to the light (light from 9 o'clock = 180°): rays at 90° and 270°
                o = max(0.0, math.cos(math.radians(a - 90)) ** 2) * 0.9
                x2 = cx + r * math.cos(rad); y2 = cy + r * math.sin(rad)
                s += f'<line x1="{cx}" y1="{cy}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#fff" stroke-opacity="{o:.2f}" stroke-width="1.2"/>'
        elif kind == "brush":
            s += f'<clipPath id="cb"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath><g clip-path="url(#cb)">'
            for k in range(-r, r, 3):
                s += f'<line x1="{cx-r}" y1="{cy+k}" x2="{cx+r}" y2="{cy+k}" stroke="#fff" stroke-opacity="0.12" stroke-width="1"/>'
            s += f'<rect x="{cx-18}" y="{cy-r}" width="36" height="{2*r}" fill="#fff" fill-opacity="0.45"/></g>'
        elif kind == "conc":
            for k in range(6, r, 6):
                s += f'<circle cx="{cx}" cy="{cy}" r="{k}" fill="none" stroke="#fff" stroke-opacity="0.12"/>'
            # bright along the line to the light: tangents there are at 90° to the light
            s += f'<rect x="{cx-r}" y="{cy-10}" width="{2*r}" height="20" fill="#fff" fill-opacity="0.4" clip-path="url(#cc)"/><clipPath id="cc"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
        s += t(cx, cy + r + 24, label, 13, INK, "middle", 600) + t(cx, cy + r + 42, sub, 11, MUTE, "middle")
        return s
    s = f'<text x="40" y="150" font-size="22" fill="{INK}">☀</text>' + t(40, 172, "sun at 9", 11, MUTE)
    s += t(40, 26, "One far light, from the left. Only grooves at right angles to the line to the light send it to the eye.", 12, MUTE)
    s += dial(190, 150, 90, "sun", "Sunburst", "a bow-tie at 12 and 6, across the sun")
    s += dial(430, 150, 90, "brush", "Linear brush", "a bar across the grain")
    s += dial(670, 150, 90, "conc", "Concentric (snailing)", "a bar along the sun line")
    return fig(s, "The groove rule drawn: the same light on three finishes. Sunburst and brush are sourced (Atmospheric Optics, KeyShot); the bow-tie's direction is a derivation [D] that a phone torch settles in a minute.", 14, 760, 300, "fig-groove")

# ── D. Lume over the night (log scale) ──
def lume_night():
    pts = [(10, 300), (60, 60), (500, 4), (2000, 0.32)]  # minutes, mcd/m²
    left, right, top, bot = 70, 720, 30, 250
    def X(m): return left + (math.log10(m) - 1) / (math.log10(3000) - 1) * (right - left)
    def Y(v): return bot - (math.log10(v) + 1) / (math.log10(1000) + 1) * (bot - top)
    s = ""
    for v, lab in [(0.1, "0.1"), (1, "1"), (10, "10"), (100, "100"), (1000, "1000")]:
        s += f'<line x1="{left}" y1="{Y(v):.0f}" x2="{right}" y2="{Y(v):.0f}" stroke="{LINE}"/>' + t(left - 8, Y(v) + 4, lab, 11, MUTE, "end")
    for m, lab in [(10, "10 min"), (60, "1 h"), (480, "8 h"), (2000, "33 h")]:
        s += t(X(m), bot + 18, lab, 11, MUTE, "middle")
    s += t(left - 8, top - 10, "mcd/m²", 11, MUTE, "end")
    path = " ".join(f"{'M' if i == 0 else 'L'}{X(m):.0f} {Y(v):.0f}" for i, (m, v) in enumerate(pts))
    s += f'<path d="{path}" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'
    for m, v in pts:
        s += f'<circle cx="{X(m):.0f}" cy="{Y(v):.0f}" r="4" fill="{INK}"/>'
    s += f'<line x1="{left}" y1="{Y(0.4):.0f}" x2="{right}" y2="{Y(0.4):.0f}" stroke="{BUG}" stroke-dasharray="4 4" stroke-width="1.5"/>' + t(right, Y(0.4) - 6, "0.4 mcd/m²: the limit of legibility, ISO 17514", 11, BUG, "end", 600)
    s += f'<line x1="{left}" y1="{Y(4):.0f}" x2="{right}" y2="{Y(4):.0f}" stroke="{MUTE}" stroke-dasharray="2 4"/>' + t(right, Y(4) - 6, "tritium paint, flat at a few mcd/m²", 11, MUTE, "end")
    s += t(X(60) + 8, Y(60) - 8, "6 % of the start at 60 min", 11, INK)
    s += t(X(500) + 8, Y(4) + 16, "\"just readable\" at 8 h 20", 11, INK)
    return fig(s, "A Super-LumiNova night, as the Lume tables describe it: over 300 mcd/m² at 10 minutes, about 6 % of the start at an hour, 4 mcd/m² after eight hours, below the 0.4 mcd/m² limit after about 33 hours. Four points joined; the shape is the point, not a datasheet [D].", 1, 760, 280, "fig-night")

# ── E. Finest line per method ──
def finest():
    rows = [("Pad print", 0.04, 0.053), ("Fibre laser", 0.06, 0.06), ("Decal, stock", 0.10, 0.10), ("Photo-etch, half-etch", 0.127, 0.127), ("Toner transfer", 0.13, 0.35), ("Screen print", 0.18, 0.20), ("CNC engraving", 0.5, 0.5)]
    left = 200; bw = 480; peak = 0.5; rowh = 28; top = 44
    s = t(24, 26, "Finest line reported, mm (best case, then routine)", 13, MUTE)
    for i, (name, best, routine) in enumerate(rows):
        y = top + i * rowh
        s += t(left - 10, y + 18, name, 13, INK, "end")
        s += f'<rect x="{left}" y="{y+4}" width="{bw*routine/peak:.0f}" height="18" fill="{TILE}" stroke="{LINE}" rx="2"/>'
        s += f'<rect x="{left}" y="{y+4}" width="{bw*best/peak:.0f}" height="18" fill="{BUG if name=="Toner transfer" else INK}" rx="2"/>'
        lab = f"{best}" + (f" – {routine}" if routine != best else "")
        s += t(left + bw * routine / peak + 8, y + 18, lab + " mm", 12, INK, "start", 600, 'style="font-variant-numeric:tabular-nums"')
    s += t(left, top + len(rows) * rowh + 18, "Toner transfer in red: Okay's own method; its line data is copper PCB, not brass.", 11, MUTE)
    return fig(s, "Finest line per method, from Methods compared. Solid is the best case reported, the pale bar the routine result where one was given.", 18, 760, top + len(rows) * rowh + 40, "fig-finest")

# ── F. Enamel cross-section ──
def enamel():
    s = t(24, 26, "A grand feu enamel dial in section, not to scale", 13, MUTE)
    x0, w = 40, 330; y = 70
    layers = [("printed numerals: pad print over the last layer, refired", 6, INK), ("enamel: 6–9 layers, about 1 mm, fired 3–9 times at 800–880 °C", 64, "#7aa6c9"),
              ("blank: copper, or die-stamped silver (anOrdain), so it stays flat", 24, "#b08a5a"), ("counter-enamel on the back, against warping", 10, "#7aa6c9")]
    for name, hgt, col in layers:
        s += f'<rect x="{x0}" y="{y}" width="{w}" height="{hgt}" fill="{col}" fill-opacity="0.85" stroke="{INK}" stroke-width="1"/>'
        s += f'<line x1="{x0+w}" y1="{y+hgt/2:.0f}" x2="{x0+w+16}" y2="{y+hgt/2:.0f}" stroke="{LINE}"/>'
        s += t(x0 + w + 22, y + hgt / 2 + 4, name, 12, INK); y += hgt
    for k in range(1, 7):
        s += f'<line x1="{x0}" y1="{76+k*9}" x2="{x0+w}" y2="{76+k*9}" stroke="{PAPER}" stroke-opacity="0.6"/>'
    s += f'<line x1="{x0+40}" y1="{78}" x2="{x0+40}" y2="{138}" stroke="{BUG}" stroke-width="2"/>' + t(x0 + 48, 110, "a particle trapped under an early layer:", 11, BUG, "start", 600) + t(x0 + 48, 124, "the dial is scrap", 11, BUG, "start", 600)
    s += t(24, 206, "Reject rates: anOrdain about 30 % overall; Donzé's print stage 60–70 %; \"almost 90 %\" claimed for the trade.", 12, MUTE)
    s += t(24, 224, "Eight good dials a week was anOrdain's output in 2018.", 12, MUTE)
    return fig(s, "Why enamel costs what it costs: a section through a fired dial, and the stage at which a dial dies. From anOrdain, Monochrome and Deployant in Finishes and How they design and produce dials.", 23, 760, 244, "fig-enamel")

# ── G. Where Dial Tool fits: outputs against the chain's needs ──
def fit():
    has = ["True-size PDF and SVG, mm", "Production masks per ink, mirrored", "Print sheet and spec sheet", "Show mode: the dial in a watch", "Rings, hands, four windows, 75 fonts", "Export log: thinnest line (#225)"]
    needs = [("Colour as it will fire or lacquer", "Later"), ("Lume by grade and layer count", "#545, Next"), ("Finest line per method, text too", "#225, Next"), ("Feet, apertures, pinion height", "#89, Q1"), ("A night view", "#532, Next"), ("Six colours of one dial on a sheet", "#17, Later")]
    s = t(60, 26, "What Dial Tool has", 13, INK, "start", 600) + t(420, 26, "What the proof layer needs", 13, INK, "start", 600)
    for i, h in enumerate(has):
        y = 54 + i * 34
        s += f'<rect x="40" y="{y-16}" width="300" height="26" fill="{TILE}" stroke="{LINE}" rx="3"/>' + t(52, y + 2, h, 12, INK)
    for i, (n, bl) in enumerate(needs):
        y = 54 + i * 34
        s += f'<rect x="400" y="{y-16}" width="320" height="26" fill="{PAPER}" stroke="{INK}" rx="3"/>' + t(412, y + 2, n, 12, INK) + t(712, y + 2, bl, 11, BUG, "end", 600)
    # links: outputs that already serve a need
    for a, b in [(0, 0), (2, 3), (5, 2), (3, 4), (2, 5)]:
        ya = 54 + a * 34 - 3; yb = 54 + b * 34 - 3
        s += f'<path d="M340 {ya} C370 {ya} 370 {yb} 400 {yb}" fill="none" stroke="{MUTE}" stroke-width="1.2"/>'
    s += t(40, 268, "A line means the output is the place where the need would land; none of the needs is met today.", 12, MUTE)
    return fig(s, "Where Dial Tool fits: what it exports today against what the sample-one surprises ask for. The proof layer is the only part a bureau, a mod shop or a freelancer would pay for [D].", 24, 760, 285, "fig-fit")

FIGS = {"fig-fairs": fairs, "fig-bands": price_bands, "fig-chain": chain, "fig-pain": failure_modes, "fig-groove": groove, "fig-night": lume_night, "fig-finest": finest, "fig-enamel": enamel, "fig-fit": fit}
