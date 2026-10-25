# Row illustrations: a small dial swatch drawn for a finish, a lume grade, a print method, a stone, a failure mode;
# or a pool tile / licensed photo where one fits. match(cells) → html or "".
import math, re, random, html

W = 84
def rnd(seed):
    r = random.Random(seed); return r
def disc(inner, bg="#2a2a2a", extra=""):
    return f'<svg class="sw" viewBox="0 0 {W} {W}" width="{W}" height="{W}" aria-hidden="true"><defs><clipPath id="c{abs(hash(inner))%100000}"><circle cx="42" cy="42" r="38"/></clipPath></defs><circle cx="42" cy="42" r="38" fill="{bg}"/><g clip-path="url(#c{abs(hash(inner))%100000})">{inner}</g><circle cx="42" cy="42" r="38" fill="none" stroke="var(--line)"/>{extra}</svg>'
# light from 9 o'clock in every swatch
def sunburst(colour="#3a4f7a", rays=120):
    s = ""
    for k in range(rays):
        a = k * 360 / rays; o = max(0, math.cos(math.radians(a - 90)) ** 2) * 0.85
        s += f'<line x1="42" y1="42" x2="{42+40*math.cos(math.radians(a)):.1f}" y2="{42+40*math.sin(math.radians(a)):.1f}" stroke="#fff" stroke-opacity="{o:.2f}" stroke-width="1.1"/>'
    return disc(s, colour)
def brushed(colour="#8a8a8a", vertical=False):
    s = "".join(f'<line x1="0" y1="{y}" x2="84" y2="{y}" stroke="#000" stroke-opacity="0.18"/>' if not vertical else f'<line x1="{y}" y1="0" x2="{y}" y2="84" stroke="#000" stroke-opacity="0.18"/>' for y in range(0, 84, 3))
    band = '<rect x="30" y="0" width="22" height="84" fill="#fff" fill-opacity="0.45"/>' if not vertical else '<rect x="0" y="30" width="84" height="22" fill="#fff" fill-opacity="0.45"/>'
    return disc(s + band, colour)
def concentric(colour="#8c8c8c", step=4):
    s = "".join(f'<circle cx="42" cy="42" r="{r}" fill="none" stroke="#000" stroke-opacity="0.22"/>' for r in range(step, 40, step))
    return disc(s + '<rect x="0" y="34" width="84" height="16" fill="#fff" fill-opacity="0.42"/>', colour)
def snailing(colour="#9a9a9a"):
    s = "".join(f'<circle cx="{42+14*math.cos(math.radians(a))}" cy="{42+14*math.sin(math.radians(a))}" r="{r}" fill="none" stroke="#000" stroke-opacity="0.16"/>' for a in range(0, 360, 60) for r in range(4, 30, 4))
    return disc(s + '<ellipse cx="22" cy="42" rx="14" ry="30" fill="#fff" fill-opacity="0.25"/>', colour)
def grain(colour="#bdbdb8", n=420, size=0.9, seed=3, lobe=0.18):
    r = rnd(seed); s = "".join(f'<circle cx="{r.uniform(2,82):.1f}" cy="{r.uniform(2,82):.1f}" r="{size*r.uniform(.4,1.2):.2f}" fill="#000" fill-opacity="{r.uniform(.15,.4):.2f}"/>' for _ in range(n))
    return disc(s + f'<ellipse cx="26" cy="42" rx="22" ry="34" fill="#fff" fill-opacity="{lobe}"/>', colour)
def fume(centre="#9bbcd6", rim="#0b1a2a"):
    k = abs(hash(centre)) % 100000
    return disc(f'<defs><radialGradient id="g{k}"><stop offset="0" stop-color="{centre}"/><stop offset="1" stop-color="{rim}"/></radialGradient></defs><rect width="84" height="84" fill="url(#g{k})"/>', rim)
def gloss(colour="#1b2a4a", soft=False):
    k = abs(hash(colour + str(soft))) % 100000
    spot = f'<ellipse cx="26" cy="30" rx="12" ry="16" fill="#fff" fill-opacity="0.55"/>'
    edge = '<circle cx="42" cy="42" r="36" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="3"/>' if soft else ""
    return disc(f'<defs><radialGradient id="g{k}" cx="0.3" cy="0.35" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="84" height="84" fill="url(#g{k})"/>' + edge, colour)
def flat(colour="#444"):
    return disc('<ellipse cx="24" cy="42" rx="30" ry="40" fill="#fff" fill-opacity="0.08"/>', colour)
def pattern(kind, colour="#8f8f8f"):
    s = ""
    if kind == "clous":
        for x in range(2, 84, 8):
            for y in range(2, 84, 8):
                s += f'<path d="M{x} {y+8}L{x+4} {y+4}L{x+8} {y+8}Z" fill="#fff" fill-opacity="0.35"/><path d="M{x} {y}L{x+4} {y+4}L{x} {y+8}Z" fill="#000" fill-opacity="0.3"/>'
    elif kind == "barleycorn":
        for y in range(0, 84, 6):
            for x in range(0, 84, 10):
                xx = x + (5 if (y // 6) % 2 else 0)
                s += f'<ellipse cx="{xx+5}" cy="{y+3}" rx="4.5" ry="2.4" fill="#fff" fill-opacity="0.28"/><ellipse cx="{xx+4}" cy="{y+3.6}" rx="4.5" ry="2.4" fill="#000" fill-opacity="0.22"/>'
    elif kind == "tapisserie":
        for x in range(1, 84, 9):
            for y in range(1, 84, 9):
                s += f'<rect x="{x}" y="{y}" width="7" height="7" fill="#fff" fill-opacity="0.22"/><rect x="{x}" y="{y}" width="7" height="1.5" fill="#000" fill-opacity="0.3"/><rect x="{x}" y="{y}" width="1.5" height="7" fill="#000" fill-opacity="0.3"/>'
    elif kind == "hobnail":
        for x in range(2, 84, 7):
            for y in range(2, 84, 7):
                s += f'<circle cx="{x+3}" cy="{y+3}" r="2.6" fill="#fff" fill-opacity="0.3"/><circle cx="{x+3.8}" cy="{y+3.8}" r="2.2" fill="#000" fill-opacity="0.25"/>'
    elif kind == "hammered":
        r = rnd(7)
        for _ in range(60):
            x, y, rr = r.uniform(0, 84), r.uniform(0, 84), r.uniform(4, 9)
            s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="#fff" fill-opacity="0.18"/><circle cx="{x+1.5:.1f}" cy="{y+1.5:.1f}" r="{rr*0.8:.1f}" fill="#000" fill-opacity="0.2"/>'
    elif kind == "linen":
        for y in range(0, 84, 3): s += f'<line x1="0" y1="{y}" x2="84" y2="{y}" stroke="#000" stroke-opacity="0.14"/>'
        for x in range(0, 84, 3): s += f'<line x1="{x}" y1="0" x2="{x}" y2="84" stroke="#fff" stroke-opacity="0.12"/>'
    elif kind == "engraved":
        for y in range(6, 84, 10): s += f'<path d="M4 {y} Q42 {y-6} 80 {y}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="1.6"/><path d="M4 {y+1.2} Q42 {y-4.8} 80 {y+1.2}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8"/>'
    elif kind == "wave":
        for y in range(4, 84, 8): s += f'<path d="M0 {y} C14 {y-5} 28 {y+5} 42 {y} S70 {y-5} 84 {y}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.4"/><path d="M0 {y+1.3} C14 {y-3.7} 28 {y+6.3} 42 {y+1.3} S70 {y-3.7} 84 {y+1.3}" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="0.7"/>'
    elif kind == "radial":
        for k in range(0, 360, 6): s += f'<line x1="42" y1="42" x2="{42+40*math.cos(math.radians(k)):.1f}" y2="{42+40*math.sin(math.radians(k)):.1f}" stroke="#000" stroke-opacity="0.3"/>'
        s += '<ellipse cx="22" cy="42" rx="12" ry="40" fill="#fff" fill-opacity="0.2"/>'
    elif kind == "carbon":
        for x in range(0, 84, 6):
            for y in range(0, 84, 6):
                s += f'<rect x="{x}" y="{y}" width="6" height="3" fill="#fff" fill-opacity="{0.18 if (x//6+y//6)%2 else 0.05}"/>'
    return disc(s + '<ellipse cx="26" cy="42" rx="18" ry="34" fill="#fff" fill-opacity="0.12"/>', colour)
def stone(kind):
    r = rnd(11)
    if kind == "aventurine":
        s = "".join(f'<circle cx="{r.uniform(0,84):.1f}" cy="{r.uniform(0,84):.1f}" r="{r.uniform(.3,.9):.2f}" fill="#fff" fill-opacity="{r.uniform(.4,1):.2f}"/>' for _ in range(260)); return disc(s, "#101a3a")
    if kind == "meteorite":
        s = ""
        for k in range(14):
            a = 35 if k % 2 else 125; x = -20 + k * 9
            s += f'<line x1="{x}" y1="0" x2="{x+60*math.cos(math.radians(a)):.1f}" y2="{60*math.sin(math.radians(a)):.1f}" stroke="#fff" stroke-opacity="0.5" stroke-width="{r.uniform(1,3):.1f}"/>'
            s += f'<line x1="{x+30}" y1="84" x2="{x+30-60*math.cos(math.radians(a)):.1f}" y2="{84-60*math.sin(math.radians(a)):.1f}" stroke="#000" stroke-opacity="0.35" stroke-width="{r.uniform(1,3):.1f}"/>'
        return disc(s, "#8e8e8a")
    if kind == "mop":
        s = "".join(f'<path d="M-10 {y} Q42 {y-14} 94 {y}" fill="none" stroke="{c}" stroke-opacity="0.55" stroke-width="9"/>' for y, c in zip(range(0, 110, 14), ["#f2d9e6", "#d9ecf2", "#f6f0d9", "#e3d9f2", "#f2e1d9", "#d9f2e6", "#f2d9e6", "#d9ecf2"])); return disc(s, "#efece6")
    if kind == "malachite":
        s = "".join(f'<circle cx="30" cy="40" r="{rr}" fill="none" stroke="{"#0a5a3a" if rr % 8 else "#5fd39a"}" stroke-width="{2.5 if rr % 8 else 1.5}"/>' for rr in range(3, 70, 4)); return disc(s, "#1f8a5a")
    if kind == "lapis":
        s = "".join(f'<circle cx="{r.uniform(0,84):.1f}" cy="{r.uniform(0,84):.1f}" r="{r.uniform(.5,2):.1f}" fill="#d4af37" fill-opacity="0.8"/>' for _ in range(40)); return disc(s, "#1a3d9a")
    if kind == "wood":
        s = "".join(f'<path d="M0 {y} Q42 {y+4} 84 {y}" fill="none" stroke="#3a2412" stroke-opacity="0.5" stroke-width="1.5"/>' for y in range(2, 84, 5)); return disc(s, "#8a5a32")
    if kind == "tigereye":
        s = "".join(f'<path d="M0 {y} Q42 {y-10} 84 {y}" fill="none" stroke="{"#f0b040" if (y//6)%2 else "#4a2a08"}" stroke-width="5"/>' for y in range(0, 100, 6)); return disc(s + '<rect x="20" y="0" width="14" height="84" fill="#fff" fill-opacity="0.25"/>', "#8a5a1a")
    return flat("#777")
def lume(day, glow, strength=1.0):
    # left half by day, right half at night
    k = abs(hash(day + glow)) % 100000
    return (f'<svg class="sw" viewBox="0 0 {W} {W}" width="{W}" height="{W}" aria-hidden="true"><defs><radialGradient id="l{k}"><stop offset="0" stop-color="{glow}" stop-opacity="{min(1,strength):.2f}"/><stop offset="0.7" stop-color="{glow}" stop-opacity="{strength*0.5:.2f}"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="42" height="84" fill="#e9e6df"/><rect x="42" width="42" height="84" fill="#0a0a0a"/>'
            f'<rect x="12" y="20" width="12" height="44" rx="2" fill="{day}" stroke="#bbb" stroke-width="0.6"/>'
            f'<circle cx="63" cy="42" r="30" fill="url(#l{k})"/><rect x="57" y="20" width="12" height="44" rx="2" fill="{glow}" fill-opacity="{min(1,0.35+0.65*strength):.2f}"/>'
            f'<rect width="84" height="84" fill="none" stroke="var(--line)"/></svg>')
def tube(colour="#9fe870"):
    return (f'<svg class="sw" viewBox="0 0 {W} {W}" width="{W}" height="{W}" aria-hidden="true"><rect width="84" height="84" fill="#0a0a0a"/>'
            f'<rect x="16" y="36" width="52" height="12" rx="6" fill="{colour}" fill-opacity="0.9"/><rect x="16" y="36" width="52" height="12" rx="6" fill="none" stroke="#fff" stroke-opacity="0.5"/><rect x="20" y="38" width="44" height="3" rx="1.5" fill="#fff" fill-opacity="0.5"/>'
            f'<rect width="84" height="84" fill="none" stroke="var(--line)"/></svg>')
def print_sw(kind):
    # a numeral "4" as laid down by each method, on a grey plate, seen a little from the side
    base = '<rect width="84" height="84" fill="#c9c7c0"/>'
    if kind == "pad": body = '<text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="#111" font-family="Inter,sans-serif">4</text><rect x="14" y="66" width="56" height="3" fill="#111"/>'
    elif kind == "screen": body = '<text x="43" y="59" font-size="46" font-weight="700" text-anchor="middle" fill="#5a5a5a" font-family="Inter,sans-serif">4</text><text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="#111" font-family="Inter,sans-serif">4</text><rect x="14" y="66" width="56" height="4" fill="#111"/><rect x="14" y="70" width="56" height="1.5" fill="#5a5a5a"/>'
    elif kind == "toner": body = '<text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="#7a6a4a" font-family="Inter,sans-serif" stroke="#4a3a20" stroke-width="2" stroke-dasharray="1.5 1">4</text><rect x="14" y="66" width="56" height="4" fill="#7a6a4a" stroke="#4a3a20" stroke-dasharray="1.5 1"/>'
    elif kind == "etch": body = '<text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="#a89a7a" stroke="#6a5a3a" stroke-width="1.2" font-family="Inter,sans-serif">4</text><rect x="14" y="66" width="56" height="4" fill="#a89a7a" stroke="#6a5a3a"/>'
    elif kind == "laser": body = '<text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="#8a8a86" font-family="Inter,sans-serif">4</text><rect x="14" y="66" width="56" height="3" fill="#8a8a86"/>'
    elif kind == "inkjet": body = '<text x="43" y="59" font-size="46" font-weight="700" text-anchor="middle" fill="#8a2a2a" font-family="Inter,sans-serif">4</text><text x="42" y="57" font-size="46" font-weight="700" text-anchor="middle" fill="#c8331b" font-family="Inter,sans-serif">4</text>'
    elif kind == "decal": body = '<rect x="10" y="12" width="64" height="60" fill="#fff" fill-opacity="0.35" stroke="#fff" stroke-opacity="0.7"/><text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="#111" font-family="Inter,sans-serif">4</text>'
    elif kind == "plating": body = '<rect width="84" height="84" fill="#d8b85a"/><ellipse cx="26" cy="42" rx="20" ry="36" fill="#fff" fill-opacity="0.3"/>'
    elif kind == "electroform": body = '<rect width="84" height="84" fill="#b8b8b4"/>' + "".join(f'<rect x="{x}" y="{y}" width="6" height="6" fill="#fff" fill-opacity="0.25"/>' for x in range(2, 84, 9) for y in range(2, 84, 9))
    elif kind == "stamping": body = '<rect x="12" y="12" width="60" height="60" rx="4" fill="#9a9a96" stroke="#555"/><rect x="18" y="18" width="48" height="48" rx="3" fill="#c9c7c0" stroke="#555"/><rect x="26" y="26" width="32" height="32" rx="2" fill="#9a9a96" stroke="#555"/>'
    elif kind == "applied": body = '<rect x="30" y="18" width="24" height="48" fill="#e8e8e4" stroke="#777"/><rect x="30" y="18" width="12" height="48" fill="#fff"/><rect x="42" y="18" width="12" height="48" fill="#9a9a96"/><circle cx="42" cy="72" r="2" fill="#555"/>'
    elif kind == "cnc": body = '<text x="42" y="58" font-size="46" font-weight="700" text-anchor="middle" fill="none" stroke="#333" stroke-width="3" font-family="Inter,sans-serif">4</text>'
    else: body = ""
    return f'<svg class="sw" viewBox="0 0 {W} {W}" width="{W}" height="{W}" aria-hidden="true">{base}{body}<rect width="84" height="84" fill="none" stroke="var(--line)"/></svg>'
def pain(kind):
    base = '<circle cx="42" cy="42" r="36" fill="#2a2a2a"/>'
    if kind == "lume": body = '<rect x="36" y="12" width="12" height="30" fill="#9fe870" fill-opacity="0.9"/><rect x="36" y="48" width="12" height="24" fill="#9fe870" fill-opacity="0.25"/><text x="42" y="80" font-size="9" fill="var(--mute)" text-anchor="middle" font-family="Inter,sans-serif">hands ≠ markers</text>'
    elif kind == "colour": body = '<rect x="12" y="20" width="26" height="40" fill="#3a5f9a"/><rect x="46" y="20" width="26" height="40" fill="#5a7fb8"/><text x="25" y="72" font-size="9" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif">proof</text><text x="59" y="72" font-size="9" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif">batch</text>'
    elif kind == "align": body = "".join(f'<line x1="42" y1="42" x2="{42+34*math.cos(math.radians(a)):.1f}" y2="{42+34*math.sin(math.radians(a)):.1f}" stroke="#ddd" stroke-width="2" stroke-dasharray="0 28 6"/>' for a in range(0, 360, 30)) + "".join(f'<line x1="42" y1="42" x2="{42+34*math.cos(math.radians(a+6)):.1f}" y2="{42+34*math.sin(math.radians(a+6)):.1f}" stroke="#c8331b" stroke-width="2" stroke-dasharray="0 22 6"/>' for a in range(0, 360, 30))
    elif kind == "render": body = '<rect x="8" y="20" width="32" height="44" fill="#3a4f7a"/><text x="24" y="47" font-size="20" fill="#fff" text-anchor="middle">✦</text><rect x="44" y="20" width="32" height="44" fill="#2e3a55"/><text x="24" y="74" font-size="8" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif">render</text><text x="60" y="74" font-size="8" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif">real</text>'
    elif kind == "enamel": body = '<circle cx="42" cy="42" r="30" fill="#e8ecf2"/><path d="M30 20 L40 40 L34 58" fill="none" stroke="#333" stroke-width="1.2"/><circle cx="54" cy="30" r="2" fill="#333"/><circle cx="50" cy="52" r="1.5" fill="#333"/>'
    elif kind == "print": body = '<text x="42" y="52" font-size="12" fill="#ddd" text-anchor="middle" font-family="Inter,sans-serif" opacity="0.5">AUTOMATIC</text><text x="42" y="36" font-size="22" fill="#ddd" text-anchor="middle" font-family="Inter,sans-serif">12</text>'
    else: body = ""
    return f'<svg class="sw" viewBox="0 0 {W} {W}" width="{W}" height="{W}" aria-hidden="true">{base}{body}<circle cx="42" cy="42" r="36" fill="none" stroke="var(--line)"/></svg>'

# ── the rules: (regex on the first cell, then on the whole row), builder ──
RULES = [
 (r"^sunburst|sunray|^sun ?burst", lambda: sunburst()),
 (r"^linear brush|^brushed|straight brush", lambda: brushed()),
 (r"^concentric|azurage|vinyl", lambda: concentric()),
 (r"^snail", lambda: snailing()),
 (r"^gren[eé]|silvered by friction|^frost|frosted", lambda: grain("#cfcfca", 500, 0.8, 5, 0.22)),
 (r"^sandblast|^grain(y|ed)|bead.?blast|^matte|^matt\b", lambda: grain("#8a8a86", 700, 0.6, 9, 0.12)),
 (r"^fum[eé]|^gradient|^d[ée]grad", lambda: fume()),
 (r"^lacquer|^gloss|^paint|^urushi|^sp(ray|rayed)", lambda: gloss("#1b2a4a")),
 (r"^enamel|grand feu|^vitreous", lambda: gloss("#f2f0ea", soft=True)),
 (r"^cloisonn", lambda: pattern("engraved", "#e8ecf2")),
 (r"^champlev", lambda: pattern("tapisserie", "#d9dce6")),
 (r"^flinqu", lambda: pattern("wave", "#2b5fb0")),
 (r"clous de paris|^hobnail|^pyramid", lambda: pattern("clous", "#8f8f8f")),
 (r"barleycorn|grain d.orge", lambda: pattern("barleycorn", "#8f8f8f")),
 (r"tapisserie|^waffle|^grid", lambda: pattern("tapisserie", "#2b4a8a")),
 (r"^hammer|martel", lambda: pattern("hammered", "#b07a4a")),
 (r"^linen|^textile|^fabric", lambda: pattern("linen", "#c9c4b4")),
 (r"^guilloch|rose engine|engine.turn|^engrav", lambda: pattern("radial", "#8f8f8f")),
 (r"^stamp(ed|ing)|^press(ed)?\b|^relief", lambda: print_sw("stamping")),
 (r"^wave|^ripple", lambda: pattern("wave", "#8f8f8f")),
 (r"^carbon|forged", lambda: pattern("carbon", "#222")),
 (r"^aventurine|goldstone", lambda: stone("aventurine")),
 (r"^meteorite|widmanst", lambda: stone("meteorite")),
 (r"mother.of.pearl|^mop\b|^nacre", lambda: stone("mop")),
 (r"^malachite", lambda: stone("malachite")),
 (r"^lapis|^sodalite", lambda: stone("lapis")),
 (r"^tiger", lambda: stone("tigereye")),
 (r"^wood", lambda: stone("wood")),
 (r"^stone|^onyx|^jade|^turquoise|pietersite|^marble", lambda: stone("malachite")),
 (r"^c3\b", lambda: lume("#d9e3a3", "#8fff5a", 1.0)),
 (r"^bgw9|bg.?w9", lambda: lume("#f3f3ee", "#9be7ff", 0.95)),
 (r"^c1\b", lambda: lume("#f6f6f2", "#8fff5a", 0.31)),
 (r"^c5|^c7|^c9", lambda: lume("#e2eab8", "#7ef0b0", 0.8)),
 (r"^tint|old radium|fauxtina", lambda: lume("#d8b273", "#c8a040", 0.3)),
 (r"^standard|^grade|x1|x2", lambda: lume("#d9e3a3", "#8fff5a", 1.0)),
 (r"grain size|^ef\b", lambda: lume("#d9e3a3", "#8fff5a", 0.6)),
 (r"^tritium|^gtls|^tube", lambda: tube()),
 (r"^lumibrite|^seiko lumi", lambda: lume("#e8eec8", "#a8ff70", 0.9)),
 (r"^radium|^promethium", lambda: lume("#c9b060", "#d8c060", 0.4)),
 (r"^zinc sulph|^zns", lambda: lume("#e6efd0", "#b8ff80", 0.4)),
 (r"^electrolum|^indiglo|^led", lambda: lume("#dde", "#7fd0ff", 1.0)),
 (r"^pad print|^pad\b|tampo", lambda: print_sw("pad")),
 (r"^screen print|^silk", lambda: print_sw("screen")),
 (r"^toner|pnp blue|press.?n.?peel", lambda: print_sw("toner")),
 (r"^photo.?etch|^chemical etch|^etch", lambda: print_sw("etch")),
 (r"^fibre laser|^fiber laser|^laser", lambda: print_sw("laser")),
 (r"^diode laser", lambda: print_sw("laser")),
 (r"^uv inkjet|^inkjet|^uv print", lambda: print_sw("inkjet")),
 (r"^decal|waterslide", lambda: print_sw("decal")),
 (r"^galvanic|^plating|^electroplat|^pvd", lambda: print_sw("plating")),
 (r"^electroform", lambda: print_sw("electroform")),
 (r"^applied ind|^applied mark|^appliqu", lambda: print_sw("applied")),
 (r"^cnc", lambda: print_sw("cnc")),
 (r"lume under|^lume\b.*(weak|dim|fail)", lambda: pain("lume")),
 (r"^colour drift|^color drift|pantone|wrong shade", lambda: pain("colour")),
 (r"^alignment|misalign", lambda: pain("align")),
 (r"^render", lambda: pain("render")),
 (r"enamel.*reject|special-finish reject", lambda: pain("enamel")),
 (r"^print legib|typo|fuzzy", lambda: pain("print")),
 (r"^flat\b|^plain\b|^solid", lambda: flat("#444")),
]
# pool tiles / photos for brands and models (first cell or row text)
BRAND_PICS = [
 (r"\bbaltic\b", ("pic", "Baltic, salmon with Breguet numerals")), (r"nodus", ("pic", "Nodus Sector Deep, orange")), (r"paulin", ("pic", "Paulin Mara Diver × Hodinkee")),
 (r"underd0g|underdog", ("pic", "Studio Underd0g Bicompax")), (r"venezianico", ("pic", "Venezianico moonphase, in hand")), (r"echo/neutra|echo neutra", ("pic", "echo/neutra Averau, moon at 6")),
 (r"atelier wen", ("pic", "Atelier Wen Perception, purple guilloché")), (r"traska", ("pic", "Traska, frosted silver, whole")), (r"formex", ("pic", "Formex Field, outlined numerals")),
 (r"christopher ward|\bcw\b", ("photo", "cw_c60")), (r"lorier", ("photo", "lorier")), (r"yema", ("photo", "yema")), (r"smiths", ("pic", "Smiths diver, day")),
 (r"alpina", ("pic", "Alpina Startimer, blue grain")), (r"hamilton", ("pic", "Hamilton Khaki King")), (r"seiko 5|snk", ("pic", "Seiko 5 confetti")), (r"mondaine", ("pic", "Mondaine Helvetica, black")),
 (r"brew\b", ("pic", "Brew Retrograph, front")), (r"h\. ?moser|moser", ("photo", "fume_moser")), (r"laurent ferrier", ("photo", "73001952")), (r"royal oak|audemars", ("photo", "124097422")),
 (r"anordain", ("pic", "An enamel dial on wire mesh")), (r"speedmaster|omega", ("pic", "Speedmaster, gold on black")), (r"ball\b", ("photo", "lume_ball")), (r"panerai", ("photo", "lume_panerai")),
 (r"explorer|rolex", ("photo", "applied_explorer")), (r"datejust", ("photo", "98916281")), (r"watches (and|&) wonders", ("photo", "ww2023")), (r"windup", ("photo", "ww2023")),
 (r"dial factory|fabrique|bienne", ("photo", "dial_factory")), (r"pad.?print(ing)? machine|carousel", ("photo", "print_machine")), (r"crossroad", ("pic", "Crossroad pair")), (r"alkin", ("pic", "alkin Model Two at night")),
 (r"emit\b", ("pic", "Emit, telemeter and tachymeter")), (r"marloe", ("pic", "Marloe Haskell, blue")), (r"dennison|roebuck", ("pic", "Roebuck, two-tone brushed with a green band")), (r"ixdao", ("pic", "IXDAO dial, flat")),
 (r"detomaso", ("pic", "Detomaso, frost and azurage subdial")), (r"loresum", ("pic", "Loresum, stone moonphase, dark")), (r"sternglas", ("pic", "Sternglas, grey with tricolour hands")), (r"seaholm", ("pic", "Seaholm chronograph")),
 (r"avi-?8", ("pic", "AVI-8 GMT, orange and cream")), (r"steinhart", ("pic", "Steinhart, gilt diver")), (r"h[ée]ron", ("pic", "Héron New York GMT, mother-of-pearl centre")), (r"tsao", ("pic", "Tsao Baltimore, blue sunburst")),
 (r"montera", ("pic", "Montera, pistachio mother-of-pearl")), (r"riley", ("pic", "Riley Heritage, two-tone sunburst")), (r"dufrane", ("pic", "Dufrane Waterloo, hammered copper")), (r"havstr", ("pic", "Havstrøm, yellow stamped grid")),
 (r"vestahav", ("pic", "Vestahav, teal hexagon mosaic")), (r"ubiq", ("pic", "Ubiq, green gradient with full-lume numerals")), (r"beaubleu", ("pic", "Beaubleu Pièce n°1 in moka")), (r"lippens", ("pic", "Arsène Lippens, speckled dial")),
 (r"direnzo", ("pic", "Direnzo, gold case, black guilloché")), (r"arcangel", ("pic", "Arcangel, salmon triple calendar")), (r"islander", ("pic", "Islander tonneau")), (r"san martin", ("pic", "San Martin, three integrated")),
 (r"jaz\b", ("pic", "Jaz alarm clock, green")), (r"junghans", ("pic", "Junghans repetition clock, orange")), (r"westclox", ("pic", "Westclox alarm, dots for the even hours")), (r"oliver hemming", ("pic", "Oliver Hemming, rotated numerals")),
 (r"meister.anker", ("pic", "Meister-Anker octagonal wall clock")), (r"peter pepper|eurostile", ("pic", "Peter Pepper Eurostile clock")), (r"breitling", ("pic", "G morphologies, with a Breitling Top Time")), (r"wittnauer|seafarer", ("pic", "Wittnauer and Abercrombie Seafarer")),
 (r"sicura", ("photo", "print_sicura")), (r"casio", ("photo", "casio")), (r"genévrier|genevrier", ("photo", "meteorite_genevrier")), (r"blancpain", ("photo", "enamel_blancpain")), (r"speake", ("photo", "enamel_speake")), (r"patek", ("photo", "patek_cloisonne")),
 (r"derek pratt", ("photo", "guilloche_pratt")), (r"regent", ("photo", "lume_regent")), (r"elgin|radium dial painter", ("photo", "lume_elgin")), (r"davosa", ("photo", "applied_davosa")), (r"binkada", ("photo", "184506033")),
]

def match(cells, pics, photos, section_hint=""):
    first = re.sub(r"<[^>]+>", "", cells[0]).strip().lower(); row = re.sub(r"<[^>]+>", "", " ".join(cells)).lower()
    for rx, (kind, key) in BRAND_PICS:
        if re.search(rx, first):
            if kind == "pic":
                p = next((x for x in pics if x["t"] == key), None)
                if p: return f'<img class="sw rowpic" data-id="{p["id"]}" src="{p["tile"]}" width="640" height="640" alt="{html.escape(p["t"])}" loading="lazy">'
            else:
                p = next((x for x in photos if x["key"] == key), None)
                if p: return f'<a class="zoom" href="{p["large"]}" data-cap="{html.escape(p["cap"])}" data-credit="{html.escape(p["credit"])}"><img class="sw rowpic" src="{p["large"]}" width="{p["w"]}" height="{p["h"]}" alt="{html.escape(p["alt"])}" loading="lazy"></a>'
    for rx, fn in RULES:
        if re.search(rx, first): return fn()
    return ""
