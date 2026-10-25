# Dial Research, reorganised around the tool. Parses doc/main.md into addressable blocks, then composes a new order with
# intros, inline pool pictures, licensed photos, and the drawings; writes index.built.html from template2.html.
import re, json, html, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import figs, swatches
HERE = os.path.dirname(os.path.abspath(__file__))
md = open(f"{HERE}/doc/main.md", encoding="utf-8").read()
data = json.load(open(f"{HERE}/data.json"))
photos = json.load(open(f"{HERE}/photos.json"))
PICS = data["pics"]; SECS = {s["id"]: s for s in data["sections"]}

def slug(s):
    s = re.sub(r"[^\w\s-]", "", s.lower()).strip(); s = re.sub(r"[\s_]+", "-", s); return s[:60]

def inline(s):
    s = html.escape(s, quote=False)
    s = s.replace("\\[", "[").replace("\\]", "]").replace("\\~", "~").replace("\\_", "_").replace("\\*", "*")
    s = re.sub(r"\[([^\]]+)\]\(<?([^)>\s]+)>?\)", lambda m: f'<a href="{m.group(2)}" target="_blank" rel="noopener">{m.group(1)}</a>', s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<i>\1</i>", s)
    s = re.sub(r"\[(S|P|R|F|M|B|I|D)(?:[^\]]{0,40})?\]", lambda m: f'<span class="tag">{m.group(0)}</span>', s)
    s = re.sub(r"(?<![\w#])#(\d{1,3})\b", r'<span class="bl">#\1</span>', s)
    return s

# ── parse into blocks with their (h2, h3) address ──
blocks = []  # (h2slug, h3slug, kind, html)
lines = md.splitlines(); i = 0; h2 = None; h3 = None; buf = []
def flush():
    global buf
    if buf:
        txt = " ".join(buf)
        if not re.match(r"Oct 25, 2026 · @|\*Left|\*Left to right", txt): blocks.append((h2, h3, "p", f"<p>{inline(txt)}</p>"))
        buf = []
while i < len(lines):
    l = lines[i]
    if l.startswith("# "): i += 1; continue
    if l.startswith("## ") or l.startswith("### "):
        flush(); lvl = 2 if l.startswith("## ") else 3; txt = l[lvl + 1:].strip()
        if lvl == 2: h2 = slug(txt); h3 = None; blocks.append((h2, None, "h2", txt))
        else: h3 = slug(txt); blocks.append((h2, h3, "h3", txt))
        i += 1; continue
    if l.startswith("|"):
        flush(); rows = []
        while i < len(lines) and lines[i].startswith("|"):
            rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
        rows = [r for r in rows if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
        if rows:
            sws = [swatches.match(r, PICS, photos) for r in rows[1:]]
            anysw = any(sws)
            th = ("<th class=\"swc\"></th>" if anysw else "") + "".join(f"<th>{inline(c)}</th>" for c in rows[0])
            tb = "".join("<tr>" + (f"<td class=\"swc\">{sw}</td>" if anysw else "") + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r, sw in zip(rows[1:], sws))
            blocks.append((h2, h3, "table", f'<div class="tw"><table class="two"><thead><tr>{th}</tr></thead><tbody>{tb}</tbody></table></div>'))
        continue
    m = re.match(r"^(\d+)\.\s+(.*)", l)
    if m or l.startswith("- ") or l.startswith("* "):
        flush(); ordered = bool(m); items = []
        while i < len(lines):
            l2 = lines[i]; m2 = re.match(r"^(\d+)\.\s+(.*)", l2)
            if ordered and m2: items.append(m2.group(2))
            elif (not ordered) and (l2.startswith("- ") or l2.startswith("* ")): items.append(l2[2:])
            elif l2.startswith("  ") and items: items[-1] += " " + l2.strip()
            else: break
            i += 1
        tag = "ol" if ordered else "ul"
        blocks.append((h2, h3, "list", f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")); continue
    if l.startswith("&#91;image:") or l.startswith("&#91;embedded"):
        flush(); cap = re.sub(r"^&#91;(image|embedded content): ", "", l).rstrip("\\]").strip(); blocks.append((h2, h3, "media", cap)); i += 1; continue
    if not l.strip(): flush(); i += 1; continue
    buf.append(l.strip()); i += 1
flush()

# ── helpers to pull content ──
def body_of(h2s, h3s=None, with_h3=True, demote=True, skip_media=False):
    out = []
    for (a, b, kind, h) in blocks:
        if a != h2s: continue
        if h3s is None and b is not None: continue
        if h3s is not None and b != h3s: continue
        if kind == "h2": continue
        if kind == "h3":
            if with_h3: out.append(f'<h3 id="{a}-{b}">{inline(h)}</h3>' if demote else f'<h2 id="{a}-{b}">{inline(h)}</h2>')
            continue
        if kind == "media":
            if not skip_media: out.append(media(h))
            continue
        out.append(h)
    return "\n".join(out)
def all_h3(h2s): return [b for (a, b, k, h) in blocks if a == h2s and k == "h3"]
def section(h2s, skip=(), only=None):
    parts = [body_of(h2s)]
    for s in (only or all_h3(h2s)):
        if s in skip: continue
        parts.append(body_of(h2s, s))
    return "\n".join(parts)

F = figs.FIGS
def photo_cards(keys):
    cards = ""
    for k in keys:
        p = next((x for x in photos if x["key"] == k), None)
        if not p: print("no photo", k); continue
        cards += (f'<figure class="photo"><a href="{p["large"]}" class="zoom" data-cap="{html.escape(p["cap"])}" data-credit="{html.escape(p["credit"])}"><img loading="lazy" decoding="async" src="{p["large"]}" width="{p["w"]}" height="{p["h"]}" alt="{html.escape(p["alt"])}"></a>'
                  f'<figcaption>{p["cap"]} <span class="credit">{p["credit"]}</span></figcaption></figure>')
    return f'<div class="photos">{cards}</div>' if cards else ""
def pool(titles, note=""):
    tiles = ""
    for t in titles:
        p = next((x for x in PICS if x["t"] == t), None)
        if not p: print("no pic", t); continue
        tiles += (f'<figure class="tile" tabindex="0" data-id="{p["id"]}" data-text="{html.escape((p["t"]+" "+p["shows"]+" "+p["means"]+" "+p["tool"]+" "+p["poss"]+" "+p["bl"]).lower())}">'
                  f'<img loading="lazy" decoding="async" src="{p["tile"]}" width="640" height="640" alt="{html.escape(p["t"])}"><figcaption><span>{html.escape(p["t"])}</span>'
                  + (f'<span class="bl">{html.escape(p["bl"])}</span>' if p["bl"] else "") + '</figcaption></figure>')
    n = f'<p class="note">{note}</p>' if note else ""
    return f'<div class="pool">{n}<div class="grid">{tiles}</div></div>' if tiles else ""
def media(cap):
    if cap.startswith("fair organisers"): return F["fig-fairs"]()
    return {"Fig. 1 — lume grades by day and over the night": F["fig-night"](), "Fig. 18 — finest line and gap per method": F["fig-finest"](), "Fig. 14 — engraved and stamped patterns under one sun": F["fig-groove"](),
            "C3 lume, BGW9 lume and tritium tubes": photo_cards(["146561276", "2443976"]), "Two sunburst dials": photo_cards(["184506033", "98916281"]),
            "Record grooves and brushed metal": photo_cards(["56260321", "10521814"]), "Guilloché and tapisserie dials": photo_cards(["73001952", "124097422"])}.get(cap, "")
CANON = json.load(open(f"{HERE}/canon.json"))
def canon(*keys):
    s = ""
    for k in keys:
        c = CANON[k]
        s += (f'<figure class="canon"><a href="{c["large"]}" class="zoom" data-cap="{html.escape(c["cap"])}" data-credit="Drawn for the {c["ed"]}, with the Project\'s generator"><img loading="lazy" decoding="async" src="{c["large"]}" width="{c["w"]}" height="{c["h"]}" alt="{html.escape(c["cap"])}"></a>'
              f'<figcaption><b>{c["ed"]}.</b> {c["cap"]}</figcaption></figure>')
    return s
def intro(txt): return f'<p class="intro">{txt}</p>'
def h3(id, txt): return f'<h3 id="{id}">{txt}</h3>'
def tool(txt): return f'<aside class="tool"><b>In the tool today</b> {txt}</aside>'

# ── compose ──
S = []  # (group, id, title, html)
def add(group, sid, title, body): S.append((group, sid, title, body))

# 1 · Dial Tool
add("Dial Tool", "point", "The point", intro(
 "Dial Tool is a parametric watch-dial design tool in the browser: rings of ticks, markers, numerals, bands and text, hands, up to four windows, true size in millimetres, exported as PDF, SVG and PNG, with production masks per ink, a print sheet and a spec sheet, and a show mode that puts the dial in a watch. It exists for a watch Okay will build: etched brass by toner transfer, pad or screen printing, laser. This research is everything the tool needs to know to draw a dial true, read against the code on <code>dev</code> @ 1a3ed78 (beta 4.94.18), and, since the third edition, against the market of microbrands who would be its clients if it were sold.")
 + "<p>Read it in this order. First what the tool is and what it lacks, with the single picture that says where it fits. Then the dial as it is made, from the brief to the batch, because every later section is a layer of that process: lume, ink, finish, rendering, type, the case round it. Then the market, which is a lens for the proof layer, not a business plan. Then the learnings, drawn, and every possibility in one table keyed to the build list. The record at the end is the audit, the open questions, the reading and the sources.</p>"
 + tool("The window's source is one file per part (<code>rows.js</code>, <code>rings.js</code>, <code>hands.js</code>, <code>windows.js</code>, <code>preview.js</code>, <code>export.js</code>, <code>mode.js</code>); the geometry and the drawing in <code>geometry.js</code>; the exports in <code>output.js</code>; the watch round the dial in <code>watch.js</code>. The plate is one flat colour. Lume is one word in <code>colour.js</code>. Four cases, two bracelets, leather and NATO straps. Seventy-five open fonts.")
 + F["fig-fit"]()
 + h3("point-connections", "Connections, part by part") + body_of("connections-to-dial-tool") + body_of("connections-to-dial-tool", "part-by-part")
 + body_of("connections-to-dial-tool", "where-v1-contradicts-the-repo") + body_of("connections-to-dial-tool", "words-v1-used-differently-from-the-glossary") + body_of("connections-to-dial-tool", "docs-that-disagree-with-each-other"))

# 2 · The dial as it is made
add("The dial", "made", "The dial as it is made", intro(
 "A dial is a stamped blank with feet, coloured by plating, spray or lacquer, printed from steel clichés one colour at a time, fitted with applied indices on pins toleranced to two hundredths of a millimetre, lumed last, by hand. The Swiss trade does it in forty to a hundred stages over three or four months and mostly refuses orders under a hundred; the Chinese trade's minimums fell from a thousand to three hundred; one Swiss house takes single pieces. The founder draws, a render carries the intent to the factory, and the first physical sample decides. This is the chain the tool's proof layer would have to stand in.")
 + F["fig-chain"]()
 + body_of("how-they-design-and-produce-dials")
 + body_of("how-they-design-and-produce-dials", "who-draws-with-what")
 + pool(["A CAD render with its bracelet", "IXDAO Serene Warrior, the one-page sheet", "IXDAO dial, flat"], "What a brief looks like from the maker's side: a CAD render sent as the intent, and an amateur's one-page sheet with the date window's logic drawn out, the proof sheet this research keeps asking for.")
 + body_of("how-they-design-and-produce-dials", "dial-makers")
 + photo_cards(["dial_factory", "print_machine", "radium_painters"])
 + body_of("how-they-design-and-produce-dials", "what-it-costs")
 + body_of("how-they-design-and-produce-dials", "the-process-and-where-it-bites")
 + pool(["An enamel dial on wire mesh", "Malachite blanks beside finished dials", "Cloisonné eagle, wires set", "Cloisonné, enamel placed with a brush", "Cloisonné, fired"], "Dials in the making: an enamel blank on the firing mesh, stone blanks before cutting and printing, and a cloisonné dial at three stages, wires, colour, fired. The colour at the end is the fired colour, not the Pantone chosen on screen."))

# 3 · Lume
add("The dial", "lume", "Lume", intro(
 "Lume is the finish that fails most often and the one a screen shows worst. The daylight colour sets the glow's strength: a white body glows about a third as bright as C3's pale yellow-green; tinted lume is diluted by its pigment; the grade (Standard, A, X1, X2) slows the fade, the layer count sets the brightness, and one gram of pigment does a hundred to three hundred dials, so the surcharge is labour, not material. A night ends at 0.4 mcd/m², the legibility limit of ISO 17514, which Super-LumiNova reaches after about thirty-three hours and zinc sulphide after a few.")
 + photo_cards(["lume_kilby", "lume_regent", "lume_snk"])
 + body_of("lume") + body_of("lume", "grades-and-colours") + canon("lume-grades")
 + body_of("lume", "absolute-numbers") + body_of("lume", "other-luminous-materials")
 + photo_cards(["lume_ball", "lume_elgin", "2443976"])
 + body_of("lume", "how-lume-is-applied") + canon("lume-ways")
 + photo_cards(["lume_panerai", "applied_davosa", "applied_explorer"])
 + pool(["Formex Field, outlined numerals", "Salmon full-lume chronograph", "alkin Model Two at night", "Ubiq, green gradient with full-lume numerals"], "Four ways lume is built: filled outline numerals, a whole plate of tinted lume, a full-lume plate that reverses the night picture, lume numerals on a gradient.")
 + body_of("lume", "makers-compared") + body_of("lume", "what-goes-wrong-and-how-lume-shots-lie")
 + pool(["Smiths diver at night", "Smiths diver, day", "Crossroad square at night", "Crossroad red, day"], "Two watches by day and by night. At night the bezel, the chapter ring and the hands become one graphic; the red second hand goes dark; a lumed frame line becomes a lume ring. This is what the Day · Night switch must draw."))

# 4 · Ink and printing
add("The dial", "ink", "Ink and printing", intro(
 "Pad print from a laser-etched steel cliché holds a line of 0.04 mm and lays five to eight microns a pass; screen print holds 0.18 mm and lays a raised layer; toner-transfer etching, Okay's own method, holds 0.13 mm at best and 0.2–0.4 mm routinely, loses half to one times the depth sideways per edge, and every line figure for it is copper PCB, not brass. Text fails first on toner. The Export log names the thinnest line of a dial; numerals and text are not measured yet.")
 + body_of("ink-and-production") + body_of("ink-and-production", "pad-print-the-numbers") + canon("closing", "misreg")
 + photo_cards(["seiko_macro", "print_defect", "casio"])
 + body_of("ink-and-production", "methods-compared") + canon("finest-v2", "eight-ways")
 + photo_cards(["print_sicura", "sicura_regatta"])
 + pool(["Worldtimer, grained black dial", "Mondaine Helvetica, black", "Hamilton Khaki King"], "Dials that are print alone on a grained or flat plate: what a toner-transfer or pad-print dial can be, with nothing applied.")
 + body_of("ink-and-production", "etched-brass-undercut-and-allowance") + canon("pad-vs-toner") + body_of("ink-and-production", "what-shows-at-show-modes-size") + canon("edge") + body_of("ink-and-production", "the-order-of-layers") + canon("ink-heights"))

# 5 · Finishes
add("The dial", "finishes", "Finishes", intro(
 "A finish is a set of grooves or a surface that answers one light. Only grooves at right angles to the line to the light send it to the eye, so a sunburst shows a bow-tie across the sun, a linear brush a bar across the grain, a concentric finish a bar along the sun line; a grained surface catches light everywhere and shows no streak; a lacquer shows one gloss spot; a stone shows its own pattern and nothing else. The tool draws a flat plate today; every finish below is a layer the show mode could carry, and the pictures Okay saved are mostly finishes.")
 + body_of("finishes") + body_of("finishes", "the-groove-rule") + canon("why-rays", "seven-finishes")
 + pool(["Riley Heritage, two-tone sunburst", "Riley Cobb Solar, brown ring", "Roebuck, two-tone brushed with a green band", "Tsao Baltimore, blue sunburst"], "Sunburst and brush, as sold: two sunbursts side by side, a vertical brush with a painted band across it, a plain sunburst.")
 + body_of("finishes", "metal-finishes") + canon("far-near")
 + photo_cards(["sunburst_alpinist", "sunburst_binkada2"])
 + pool(["Traska, frosted silver, macro", "Traska, frosted silver, whole", "Dufrane Waterloo, hammered copper", "The Orange, textured"], "Frost and hammer: a grain that carries no highlight while the applied parts carry it all; random dishes against a sunburst's radial order.")
 + body_of("finishes", "paint-lacquer-and-fumé")
 + photo_cards(["fume_moser", "gradient_sicura", "lacquer_stella"])
 + pool(["Green fumé, no markers", "Ubiq, green gradient with full-lume numerals", "Pink ripple dial", "Beaubleu Pièce n°1 in moka", "Arsène Lippens, speckled dial"], "Paint: a fumé with nothing on it, a gradient under lume, a relief ripple in gloss, a dial a thread calls too dark, a speckle that is colour noise rather than relief.")
 + body_of("finishes", "enamel") + F["fig-enamel"]()
 + photo_cards(["enamel_omega", "enamel_speake", "enamel_blancpain", "patek_cloisonne"])
 + body_of("finishes", "engraved-and-stamped") + canon("engraved-v2")
 + photo_cards(["guilloche_pratt"])
 + pool(["Atelier Wen Perception, purple guilloché", "Direnzo, gold case, black guilloché", "Havstrøm, yellow stamped grid", "Triple calendar, blue barleycorn, press render", "Arcangel, salmon triple calendar", "Detomaso, frost and azurage subdial"], "Cut and stamped: hand guilloché from the cave workshop, a pressed grid, a barleycorn in a render that flattens it, azurage in a subdial recess.")
 + body_of("finishes", "stones-and-others") + canon("stones")
 + photo_cards(["meteorite_genevrier"])
 + pool(["Aventurine with a meteorite small seconds", "Vestahav, teal hexagon mosaic", "Blue hexagon mosaic diver", "Montera, pistachio mother-of-pearl", "Loresum, stone moonphase, dark", "Loresum, red stone", "Red meteorite chronograph", "Héron New York GMT, mother-of-pearl centre", "Seiko 5 confetti"], "Stones, mosaics, nacre, and one confetti: the finishes a screen cannot do and the tool parks.")
 + body_of("finishes", "seen-elsewhere-described-not-copied"))

# 6 · Rendering and the night
add("The dial", "render", "Rendering and the night", intro(
 "One far light lies about every finish, and the night is a second picture, not a darker day. Stay in SVG and the cached dial; the blur is the only expensive thing, and it is the Intel Mac that prices it. The Day · Night switch is one matrix and about five milliseconds; the lume view needs lume as an ink with a grade before anything can glow.")
 + body_of("rendering-and-presentation") + canon("sweep") + section("rendering-and-presentation") + canon("redraw")
 + h3("render-lume-preview", "Lume preview") + body_of("lume-preview") + canon("daynight") + F["fig-night"]() + body_of("lume-preview", "the-recipe-against-the-code") + body_of("lume-preview", "what-it-costs") + body_of("lume-preview", "adversarial-pass")
 + pool(["Nodus Sector Deep, orange", "Seaholm chronograph", "Steinhart, gilt diver", "Sternglas, grey with tricolour hands"], "Presentation references: a lumed bezel, cream lume on black, gilt print, a hand set in three colours."))

# 7 · Type on the dial
add("The dial", "type", "Type on the dial", intro(
 "The numerals are the dial's voice, and one glyph, the 4, tells the typeface. The tool sets seventy-five open fonts, one per ring, upright or on the ring's path, with the Cap-middle law fixing the ring's thickness to the type's cap height; Michroma and Audiowide give the Eurostile look, Arimo gives Helvetica's metrics, the DIN family comes in five cuts. What it does not do yet: one numeral in a second colour (#513, open), numerals turned to the radius, word numerals (parked), a Breguet set (an SVG import), scales with uneven spacing (the positions law, #83), hand lettering as shapes.")
 + tool("Fonts live in <code>web/fonts/</code> with their licences; the tiers of 16 Oct 2026 rank them. A ring is one font, one size, one colour. The every/offset/skip rule in <code>geometry.js</code> makes patterns such as dots for the even hours.")
 + pool(["Horological 4s", "Oliver Hemming, rotated numerals", "Word numerals clock", "Peter Pepper Eurostile clock", "Eurostile wall clock, grey", "Westclox alarm, dots for the even hours"], "Faces where the type is the dial: the grid of fours, numerals turned to the radius, hours as words, three Eurostile clocks, dots for the even hours.")
 + pool(["Mondaine Helvetica, black", "Mondaine Helvetica, white on mesh", "alkin Model One, green", "alkin Model One, white", "Jaz alarm clock, green", "Jaz alarm clock, cream square", "Meister-Anker octagonal wall clock", "Junghans repetition clock, orange"], "One typeface and nothing else; field numerals; alarm and wall clocks with inner rings and an octagon.")
 + pool(["G morphologies, with a Breitling Top Time", "Wittnauer and Abercrombie Seafarer", "Omega and Aero-Compax", "Marloe Haskell, blue", "Marloe Haskell, silver, red and blue scales", "Marloe, blue dial, close", "Haskell lettering, macro", "Emit, telemeter and tachymeter", "Baltic, salmon with Breguet numerals"], "Lettering: how a G is built, a text ring round a subdial, a script wordmark, a type designer's dials with two-colour scales, a telemeter and tachymeter with uneven marks, Breguet numerals as a set."))

# 8 · Cases, straps, bracelets
add("The dial", "cases", "The case, the strap, the bracelet", intro(
 "Show mode puts the dial in a watch so a finish and a lume can be judged where they will live. The engine in <code>watch.js</code> holds four cases (a 1939 military cushion, the Seiko SPB143 diver with a bezel insert, Emre's prototype, the Calatrava 5196 dress case), each with lug width, lug-to-lug, a crown and stepped bands; two bracelets, a vaulted Oyster type and Emre's H-links, closed round a wrist since 4.94.18; leather in three tones per colour with a pore-and-crease grain; NATO in six stripe sets with a weave; buckle, keepers, taper. The case snaps to the dial's size. What Okay's pictures ask for beyond that: a TV case, a square, a tonneau, an octagon, an integrated bracelet, beads of rice, suede, rubber, a stitch line.")
 + pool(["Case and lug profiles, an infographic"], "The vocabulary of a case drawing in one card: flat, curved and angular lugs; bezel profile, lug curve, case thickness, lug tip, case to bracelet.")
 + pool(["Brew Retrograph, TV case, side", "Brew Retrograph, front", "Islander tonneau", "Square case on an integrated bracelet, macro", "San Martin, three integrated", "Venezianico moonphase, in hand"], "Shapes the tool does not draw: a TV case, a tonneau, integrated bracelets with no lug and no spring bar.")
 + pool(["Smiths on a beads-of-rice bracelet", "Formex Field, bead-blasted cushion", "Traska on a flat-link bracelet", "Alpina Startimer, blue grain"], "Bracelets: beads of rice, a bead-blasted cushion on fabric, a flat-link Oyster type that the tool's vault bracelet already is.")
 + pool(["Stitched tan leather and a movement caseback", "Tsao on tan leather, cream stitch", "Riley on brown suede", "Montera on grey suede", "Ubiq on mint rubber", "Pink dial on teal suede", "Paulin on a black NATO", "Formex on grey fabric", "Emit buckle on black leather"], "Straps: stitching the leather lacks, suede with no pores, rubber with one highlight, the NATO the tool has, a buckle with the brand on its bar."))

# 9 · The market
add("The market", "market", "Microbrands, 2023–2026", intro(
 "A few hundred brands, most selling direct from their own site in runs of 50 to 500, and the dial is what they are talked about for. The brands that rose in these three years did it with a material or a process: stone, enamel under $3,000, guilloché by machine or by hand, stamped or lasered textures, or a colour story. No census exists; the fairs give the counts, and they are growing. Prices here are as the opened source states them.")
 + body_of("microbrands-20232026") + body_of("microbrands-20232026", "who-they-are")
 + photo_cards(["cw_c60", "cw_c60r", "cw_c70", "cw_c8", "cw_c8b", "lorier", "yema", "yema2"])
 + pool(["Paulin Mara Diver × Hodinkee", "Nodus Sector Deep, orange", "Baltic, salmon with Breguet numerals", "Studio Underd0g Bicompax", "Venezianico moonphase, in hand", "echo/neutra Averau, moon at 6", "AVI-8 GMT, orange and cream"], "Brands of the table as Okay saved them: Paulin, Nodus, Baltic, Studio Underd0g, Venezianico, echo/neutra, AVI-8.")
 + body_of("microbrands-20232026", "price-bands") + F["fig-bands"]() + body_of("microbrands-20232026", "how-they-sell") + body_of("microbrands-20232026", "the-fairs") + photo_cards(["ww2023"])
 + h3("market-stories", "Dial stories") + body_of("dial-stories"))
add("The market", "pain", "Their pain", intro(
 "Lume is what goes wrong most, then colour drifting between the approved sample and the batch, then alignment. Renders oversell exactly the two things a dial tool draws worst: texture and glow. The richest first-person accounts sit in Kickstarter and BackerKit updates this session's network cannot open; those are leads, unverified.")
 + body_of("their-pain") + F["fig-pain"]() + section("their-pain"))
add("The market", "serves", "What already serves them, and where the tool fits", intro(
 "Nothing serves the job Dial Tool does. Configurators are swap menus built in-house; render studios and freelancers sell pictures; the only dedicated dial software is a SOLIDWORKS add-in; hobbyists draw in Illustrator and Inkscape and cut holes by hand. UV bureaus now print one dial from any file for about $25, so the minimum-order wall is gone for a one-off maker; what nobody sells is a proof that shows what sample one will show. The market is small, open and not lucrative: a few hundred brands, one to three dials a year each.")
 + body_of("what-already-serves-them") + section("what-already-serves-them")
 + h3("serves-fit", "Where Dial Tool fits") + body_of("where-dial-tool-fits") + section("where-dial-tool-fits"))

# 10 · Visual learnings
learn = [("fig-fit", "Where Dial Tool fits", "Every output the tool has is a true-size drawing; every need the makers have is a proof of what the material will do. The gap is the proof layer, and nothing else."),
         ("fig-chain", "The chain", "Paper does not decide; the sample does. Colour, lume thickness and index boldness are discovered at sample one, the wrong shade at production."),
         ("fig-night", "A night", "Lume fades on a log scale: a tenth by the hour, a hundredth by eight hours, below legibility by the second night. A minutes-since-charged slider can end at the minute the glow crosses 0.4 mcd/m²."),
         ("fig-finest", "Finest line", "Pad print holds 0.04 mm; toner transfer 0.13 at best and 0.3 routinely. Text is where a toner dial fails first, and text is not measured yet."),
         ("fig-groove", "The groove rule", "One far light, three answers: a bow-tie across the sun, a bar across the grain, a bar along the sun line. The sunburst's direction is still a derivation; a torch settles it."),
         ("fig-enamel", "Enamel in section", "Seven layers, a millimetre, fired up to nine times, and a trapped particle under layer two scraps the dial. That is the price of enamel, not the pigment."),
         ("fig-pain", "Failure modes", "Ten of twenty-seven incidents are lume; colour, alignment and renders tie at four. The proof layer should show lume first."),
         ("fig-bands", "Price bands", "Twenty-five of thirty-two priced brands sit under $1,500; the enamel and guilloché stories live in the band above."),
         ("fig-fairs", "Fair rosters", "Geneva Watch Days went from 17 brands to 71 in six years; Windup seats 170. The counts are rosters, not customers.")]
add("Learnings", "learn", "Visual learnings", intro("The nine drawings, gathered, each with the one line it is there to prove. Every drawing is also in its section; this is the place to see them together and check them against each other.")
 + "".join(f'<div class="learn"><p><b><a href="#{fid}">{t}</a>.</b> {s}</p>{F[fid]()}</div>' for fid, t, s in learn))

# 11 · Possibilities
bykey = {}
for p in PICS:
    for tok in re.split(r"\s*·\s*", p["bl"] or ""):
        tok = tok.strip()
        if not tok: continue
        bykey.setdefault(tok, {"poss": [], "pics": []})
        if p["poss"] and p["poss"] not in bykey[tok]["poss"] and p["poss"] not in ("As above.", "Same.", "Drawable now.", ""): bykey[tok]["poss"].append(p["poss"])
        bykey[tok]["pics"].append(p)
def keyorder(k):
    m = re.match(r"#(\d+)", k); return (0, int(m.group(1))) if m else (1, k)
rows = ""
for k in sorted(bykey, key=keyorder):
    v = bykey[k]
    thumbs = "".join(f'<img loading="lazy" src="{p["tile"]}" alt="{html.escape(p["t"])}" title="{html.escape(p["t"])}" data-id="{p["id"]}" class="mini" width="640" height="640">' for p in v["pics"][:8])
    rows += f'<tr><td><span class="bl">{html.escape(k)}</span></td><td>{" ".join(html.escape(x) for x in v["poss"])}</td><td><div class="minis">{thumbs}</div></td></tr>'
poss_table = f'<div class="tw"><table class="two poss"><thead><tr><th>Build list</th><th>The possibility, from the pictures</th><th>Pictures</th></tr></thead><tbody>{rows}</tbody></table></div>'
add("Learnings", "possible", "Possibilities", intro("Everything the research and the pictures ask of the tool, in one place: first the map as the document keeps it (what is open in v1 comes first, then the cheap steps, then later, then parked), then every possibility the pictures raised, keyed to the build-list number it lands on. Click a thumbnail to open the picture.")
 + body_of("the-map") + section("the-map") + h3("possible-pictures", "From the pictures, by build-list number") + poss_table)

# 12 · Record
add("Record", "record", "The record", intro("The audit of the second edition against the first, the questions only Okay can answer, the reading worth the time, and how far each page could be reached.")
 + h3("record-audit", "Audit log") + body_of("audit-log") + section("audit-log")
 + h3("record-questions", "Open questions for Okay") + body_of("open-questions-for-okay") + section("open-questions-for-okay")
 + h3("record-reading", "Further reading") + body_of("further-reading") + section("further-reading")
 + h3("record-sources", "Sources and reach") + body_of("sources-and-reach") + section("sources-and-reach")
 + h3("record-scope", "Scope, as the document states it") + body_of("scope"))

# ── fix duplicate figure ids (a figure used twice): second copy gets a suffix ──
seen = {}
def dedupe(m):
    fid = m.group(1); seen[fid] = seen.get(fid, 0) + 1
    return f'<figure class="draw" id="{fid}{"" if seen[fid] == 1 else "-"+str(seen[fid])}">'
bodyhtml = ""
navhtml = ""; lastg = None
for g, sid, title, b in S:
    bodyhtml += f'<section id="{sid}"><h2 id="h-{sid}">{title}</h2>{b}</section>'
    if g != lastg: navhtml += f"<b>{g}</b>"; lastg = g
    navhtml += f'<a href="#{sid}">{title}</a>'
bodyhtml = re.sub(r'<figure class="draw" id="([a-z-]+)">', dedupe, bodyhtml)
# the pool's unused pictures, as an index at the end of the record
used = set(re.findall(r'data-id="([^"]+)"', bodyhtml))
left = [p for p in PICS if p["id"] not in used]
if left:
    bodyhtml = bodyhtml[:bodyhtml.rfind("</section>")] + '<h3 id="record-pool">The rest of the pool</h3>' + pool([p["t"] for p in left], "Pictures not placed in a section above, kept so nothing is lost.") + "</section>"
print("unplaced pool pictures:", len(left))
tpl = open(f"{HERE}/template2.html", encoding="utf-8").read()
page = tpl.replace("__BODY__", bodyhtml).replace("__NAV__", navhtml).replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
open(f"{HERE}/index.built.html", "w", encoding="utf-8").write(page)
print("built", len(page) // 1000, "KB;", len(S), "sections;", bodyhtml.count("<table"), "tables;", bodyhtml.count('class="draw"'), "drawings;", bodyhtml.count('class="photo"'), "photos;", bodyhtml.count('class="tile"'), "pool tiles")
