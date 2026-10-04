"""
make_guide.py — build the Dial Tool guidebook (docs/Dial-Tool-guide.pdf).

The text lives in docs/guide/guide.md; edit it there. This script:
  1. renders the figures with dial.py itself (through the test harness,
     drawbot-skia): sample dials, one dial split into its rings, the hand
     shapes, and the window screenshot with numbered callouts;
  2. lays out guide.md in IBM Plex Mono (docs/guide/fonts, SIL OFL).

Each "# " heading starts a page. The script warns when a section runs past
its page — then shorten the text, not the type.

Markdown it understands: # page, ## heading, paragraphs, "- " bullets,
"1. " numbers, "> " note, "| a | b |" tables (2 or 4 columns),
![cap|cap](a.png | b.png){w=170} image rows, **bold**, `accent`,
{{version}} and {{date}}.

Setup (once): pip install drawbot-skia skia-pathops pillow reportlab
Use:          python tools/make_guide.py
"""

import os, re, sys, datetime
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
GUIDE = os.path.join(ROOT, "docs", "guide")
IMG = os.path.join(GUIDE, "img")
FONTS = os.path.join(GUIDE, "fonts")
OUT = os.path.join(ROOT, "docs", "Dial-Tool-guide.pdf")

sys.path.insert(0, HERE)
import test_harness as H                                    # loads dial.py, drawbot-skia, expandStroke
D = H.D

INK, ACCENT, CREAM, GREY = "#141414", "#CC381A", "#F3EFE6", "#8A8A86"


# ── figures ──────────────────────────────────────────────────

def render_dial(ns, settings, name, zoom=14):
    S = ns["fresh_settings"](H.resolve_files(settings))
    S.update(guides=False, c_backdrop=[1, 1, 1, 1])
    static = ns["build_static"](S)
    D.newDrawing()
    mm = ns["MM"]
    ns["MM"] = mm * zoom
    ns["draw_page"](D, S, static, S["t"], preview=True)
    ns["MM"] = mm
    path = os.path.join(IMG, name)
    D.saveImage(path)
    D.endDrawing()
    return path

def render_rings(ns):
    """the starting dial, one ring at a time, then all together."""
    S = ns["fresh_settings"]({})
    names = {"Numerals": "numerals", "Markers": "markers", "Minute ticks": "ticks"}
    for ring_name, short in names.items():
        rings = [dict(r, on=(r["name"] == ring_name)) for r in S["rings"]]
        render_dial(ns, dict(rings=rings, ha_on=False), f"fig-ring-{short}.png", zoom=10)
    render_dial(ns, dict(rings=S["rings"]), "fig-ring-all.png", zoom=10)

HANDS = [
    ("baton", dict(w=0.9, tail=1.6)),
    ("pencil", dict(w=0.9, tail=1.6, tip=1.6)),
    ("sword", dict(w=1.2, tail=1.4, tip=2.6)),
    ("dauphine", dict(w=1.5, tail=1.4, feature_at=20)),
    ("leaf", dict(w=1.7, tail=1.6)),
    ("arrow", dict(w=0.45, tail=1.6, tip=2.0, feature=1.7)),
    ("syringe", dict(w=0.3, tail=1.6, tip=2.2, feature=0.9, feature_at=40)),
    ("breguet", dict(w=0.22, tail=1.6, tip=1.2, feature=1.6, feature_at=72)),
    ("lollipop", dict(w=0.16, tail=2.6, feature=1.0, feature_at=80, counter=1.0)),
    ("hollow wall", dict(shape="dauphine", w=1.6, tail=1.4, feature_at=22, wall=0.18)),
]

def render_hands(ns, zoom=11):
    cell, L, top = 9.0, 12.0, 4.0                            # mm
    w, h = cell * len(HANDS) * zoom, (L + top + 8) * zoom
    D.newDrawing()
    D.newPage(w, h)
    D.fill(1)
    D.rect(0, 0, w, h)
    for k, (label, kw) in enumerate(HANDS):
        hand = ns["complete"](ns["HAND_BASE"], dict(dict(shape=label, len=L), **kw))
        p = ns["hand_shape"](hand).copy()
        p.scale(zoom)
        p.translate((k + 0.5) * cell * zoom, 6.0 * zoom)
        D.fill(0.08, 0.08, 0.08)
        D.drawPath(p)
        D.font(os.path.join(FONTS, "IBMPlexMono-Regular.ttf"))
        D.fontSize(1.25 * zoom)
        D.fill(0.25)
        D.text(label, ((k + 0.5) * cell * zoom, 0.9 * zoom), align="center")
    path = os.path.join(IMG, "fig-hands.png")
    D.saveImage(path)
    D.endDrawing()

CALLOUTS = {1: (552, 89), 2: (552, 176), 3: (552, 266), 4: (552, 720),     # pixels in img/window.png
            5: (1600, 190), 6: (600, 1238), 7: (1336, 1238), 8: (440, 1300)}

def render_window():
    im = Image.open(os.path.join(IMG, "window.png")).convert("RGBA")
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(os.path.join(FONTS, "IBMPlexMono-Bold.ttf"), 26)
    for n, (x, y) in CALLOUTS.items():
        d.ellipse((x - 19, y - 19, x + 19, y + 19), fill=ACCENT, outline="white", width=3)
        d.text((x, y + 1), str(n), font=f, fill="white", anchor="mm")
    flat = Image.new("RGB", im.size, "white")
    flat.paste(im, mask=im.split()[3])
    flat.save(os.path.join(IMG, "fig-window.png"))

def figures():
    ns = H.load_dial(H.find_font())
    render_dial(ns, H.VARIANTS["sector-dial"], "fig-dial-sectors.png")
    render_dial(ns, H.VARIANTS["scale-arc"], "fig-dial-scale.png")
    render_dial(ns, H.VARIANTS["file-shapes"], "fig-dial-files.png")
    render_rings(ns)
    render_hands(ns)
    render_window()
    return ns["VERSION"]


# ── layout ───────────────────────────────────────────────────

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table,
                                TableStyle, Image as RLImage, PageBreak, KeepTogether)

for name, file in (("Mono", "Regular"), ("Mono-Bold", "Bold"), ("Mono-Semi", "SemiBold"), ("Mono-It", "Italic")):
    pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, f"IBMPlexMono-{file}.ttf")))
pdfmetrics.registerFontFamily("Mono", normal="Mono", bold="Mono-Bold", italic="Mono-It", boldItalic="Mono-Bold")

SYMBOLS = None                                               # IBM Plex Mono has no ⌘: borrow it
for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", "/Library/Fonts/Arial Unicode.ttf",
             "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"):
    if os.path.exists(path):
        pdfmetrics.registerFont(TTFont("Symbols", path))
        SYMBOLS = "Symbols"
        break

MARGIN, WIDTH = 16 * mm, A4[0] - 32 * mm
body = ParagraphStyle("body", fontName="Mono", fontSize=9, leading=12.8, textColor=INK, spaceAfter=4.5)
small = ParagraphStyle("small", parent=body, fontSize=7.4, leading=9.5, textColor=GREY, spaceAfter=0)
cover = ParagraphStyle("cover", parent=body, fontName="Mono-Bold", fontSize=38, leading=42, spaceAfter=3)
h1 = ParagraphStyle("h1", parent=body, fontName="Mono-Bold", fontSize=21, leading=25, spaceAfter=9)
h2 = ParagraphStyle("h2", parent=body, fontName="Mono-Bold", fontSize=9.6, leading=13, textColor=ACCENT,
                    spaceBefore=11, spaceAfter=4.5)
bullet = ParagraphStyle("bullet", parent=body, leftIndent=13, bulletIndent=0, spaceAfter=3)
cell = ParagraphStyle("cell", parent=body, spaceAfter=0)
note = ParagraphStyle("note", parent=body, spaceAfter=0, textColor=INK)

def inline(text, version, date):
    text = text.replace("{{version}}", version).replace("{{date}}", date)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r'<font name="Mono-Bold">\1</font>', text)
    text = re.sub(r"`(.+?)`", rf'<font color="{ACCENT}">\1</font>', text)
    return text.replace("⌘", f'<font name="{SYMBOLS}">⌘</font>' if SYMBOLS else "Cmd-")

def image_row(captions, files, width_mm):
    files = [f.strip() for f in files]
    total = (width_mm or 170) * mm
    gap = 4 * mm
    w = (total - gap * (len(files) - 1)) / len(files)
    pics, caps = [], []
    for f in files:
        path = os.path.join(IMG, f)
        iw, ih = Image.open(path).size
        pics.append(RLImage(path, width=w, height=w * ih / iw))
    caps = [Paragraph(c, small) for c in captions] if any(captions) else None
    rows = [pics] + ([caps] if caps else [])
    t = Table(rows, colWidths=[w + (gap if i < len(files) - 1 else 0) for i in range(len(files))],
              hAlign="LEFT")
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    return t

def table(rows, version, date):
    cols = len(rows[0])
    data = [[Paragraph(inline(c, version, date), cell) for c in r] for r in rows]
    if cols == 4:                                            # callout legend: number, text, number, text
        widths = [6 * mm, WIDTH / 2 - 6 * mm, 6 * mm, WIDTH / 2 - 6 * mm]
        for r in data:
            for i in (0, 2):
                r[i] = Paragraph(f'<font name="Mono-Bold" color="{ACCENT}">{r[i].text}</font>', cell)
    else:
        first = 30 * mm
        widths = [first] + [(WIDTH - first) / (cols - 1)] * (cols - 1)
    t = Table(data, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                           ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#D9D4C8"))]))
    return t

def note_box(text, version, date):
    t = Table([[Paragraph(inline(text, version, date), note)]], colWidths=[WIDTH])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(CREAM)),
                           ("LINEBEFORE", (0, 0), (0, -1), 2, colors.HexColor(ACCENT)),
                           ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return [Spacer(1, 3), t, Spacer(1, 4)]

def parse(md, version, date):
    """guide.md → flowables; each "# " starts a page."""
    story, pages, para, lines = [], 0, [], md.splitlines()
    i = 0
    def flush():
        if para:
            story.append(Paragraph(inline(" ".join(para), version, date), body))
            para.clear()
    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith("# "):
            flush()
            if pages:
                story.append(PageBreak())
            pages += 1
            story.append(Paragraph(inline(line[2:], version, date), cover if pages == 1 else h1))
        elif line.startswith("## "):
            flush()
            story.append(Paragraph(inline(line[3:].upper(), version, date), h2))
        elif line.startswith("- ") or re.match(r"^\d+\. ", line):
            flush()
            mark = "•" if line.startswith("- ") else line.split(".")[0] + "."
            text = line[2:] if line.startswith("- ") else line.split(". ", 1)[1]
            story.append(Paragraph(inline(text, version, date), bullet, bulletText=mark))
        elif line.startswith("> "):
            flush()
            story += note_box(line[2:], version, date)
        elif line.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(set(c) <= set("-: ") for c in cells):
                    rows.append(cells)
                i += 1
            story += [Spacer(1, 2), table(rows, version, date), Spacer(1, 4)]
            continue
        elif line.startswith("!["):
            flush()
            m = re.match(r"!\[(.*?)\]\((.+?)\)(\{w=(\d+)\})?", line)
            captions = [inline(c, version, date) for c in m.group(1).split("|")]
            files = m.group(2).split("|")
            story += [Spacer(1, 4), image_row(captions + [""] * (len(files) - len(captions)), files,
                                               int(m.group(4)) if m.group(4) else None), Spacer(1, 4)]
        elif not line.strip():
            flush()
        else:
            para.append(line.strip())
        i += 1
    flush()
    return story, pages

def build(version):
    date = datetime.date.today().strftime("%-d %b %Y")
    md = open(os.path.join(GUIDE, "guide.md"), encoding="utf-8").read()
    story, sections = parse(md, version, date)

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Mono", 6.8)
        canvas.setFillColor(colors.HexColor(GREY))
        canvas.drawString(MARGIN, 10 * mm, "DIAL TOOL · GUIDEBOOK")
        canvas.drawRightString(A4[0] - MARGIN, 10 * mm, f"{version} · {date} · page {doc.page}/{sections}")
        canvas.setStrokeColor(colors.HexColor("#D9D4C8"))
        canvas.setLineWidth(0.4)
        canvas.line(MARGIN, 13 * mm, A4[0] - MARGIN, 13 * mm)
        canvas.restoreState()

    doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=14 * mm,
                          bottomMargin=17 * mm, title="Dial Tool — guidebook", author="Okay · Dial Tool",
                          subject=f"Dial Tool {version}")
    frame = Frame(MARGIN, 17 * mm, WIDTH, A4[1] - 31 * mm, leftPadding=0, rightPadding=0,
                  topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=footer)])
    doc.build(story)
    pages = doc.page
    print(f"{OUT}: {pages} pages for {sections} sections")
    if pages != sections:
        print("WARNING: a section runs past its page — shorten guide.md")
    return pages == sections


if __name__ == "__main__":
    os.makedirs(IMG, exist_ok=True)
    version = figures()
    sys.exit(0 if build(version) else 1)
