"""idml.py — writes the guide's pages as an InDesign package (Okay, 15 Oct 2026: "1! Go!").

  python3 guide/look/idml.py out/review/layout.json out/indesign/Dial-Tool-guide "beta 4.41.23"

Called by build.mjs (through indesign.mjs), which has already put the linked files in Links/. Writes:
  Dial-Tool-guide.idml   the pages; open it in InDesign and save it as .indd
  Document fonts/        Inter (OFL); InDesign turns on the fonts in a folder of this name beside the document
  guide.pdf              the pages as the build made them, to compare
  README.txt             what is in it, what differs, how changes come back
and a zip of the folder beside it.

IDML is InDesign's open file format (a zip of XML). The template in idml-template/ is a blank document saved by
InDesign (from SimpleIDML's tests, BSD licence); this script replaces its page size, master, pages, stories and adds
the guide's colours and paragraph styles. Everything is placed where the browser set it: a text frame's first
baseline sits on the browser's first baseline ("Leading" first-baseline offset), a picture's frame is its box.
InDesign breaks lines with its own metrics, so a few lines may break differently (single-line composer, to be
closest to a browser's).
"""
import json, os, shutil, sys, zipfile
from xml.sax.saxutils import escape, quoteattr

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, "idml-template")
layout_file, DIR, VERSION = sys.argv[1], sys.argv[2], sys.argv[3]
pages = json.load(open(layout_file))
K = 72 / 25.4                                   # points a millimetre
PW, PH = 297 * K, 210 * K
LAYER = "ub3"                                   # the template's one layer
MASTER = "uca"
uid = [0x3000]


def u():
    uid[0] += 1
    return "u%x" % uid[0]


f = lambda v: ("%.4f" % v).rstrip("0").rstrip(".")
pt = lambda mm: mm * K

# ── colours: every hex used becomes a swatch named by it ──
COLORS = {}


def color(hexv):
    if not hexv:
        return "Swatch/None"
    hexv = hexv.upper()
    if hexv not in COLORS:
        COLORS[hexv] = "Color/Guide " + hexv[1:]
    return COLORS[hexv]


def path_xml(points, closed=True, curves=None):
    pts = ""
    for i, (x, y) in enumerate(points):
        if curves:
            l, r = curves[i]
            pts += f'<PathPointType Anchor="{f(x)} {f(y)}" LeftDirection="{f(l[0])} {f(l[1])}" RightDirection="{f(r[0])} {f(r[1])}"/>'
        else:
            pts += f'<PathPointType Anchor="{f(x)} {f(y)}" LeftDirection="{f(x)} {f(y)}" RightDirection="{f(x)} {f(y)}"/>'
    return f'<Properties><PathGeometry><GeometryPathType PathOpen="{"false" if closed else "true"}"><PathPointArray>{pts}</PathPointArray></GeometryPathType></PathGeometry></Properties>'


def rect_pts(x, y, w, h):
    return [(x, y), (x, y + h), (x + w, y + h), (x + w, y)]


def corners(r):
    if not r:
        return ""
    return "".join(f' {c}CornerOption="RoundedCorner" {c}CornerRadius="{f(r)}"' for c in ("TopLeft", "TopRight", "BottomLeft", "BottomRight"))


# A spread's origin is its centre: a lone page sits at (−W/2, −H/2). Each item keeps page coordinates inside and is
# moved there by its ItemTransform, as the page is.
PAGE_TF = f"1 0 0 1 {-PW / 2:.4f} {-PH / 2:.4f}"
COMMON = f'ItemLayer="{LAYER}" ItemTransform="{PAGE_TF}" AppliedObjectStyle="ObjectStyle/$ID/[None]" Locked="false" Visible="true"'

# ── paragraph styles: one per kind of text, its values from the first of its kind ──
STYLES = {}
WEIGHT = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold"}
JUST = {"left": "LeftAlign", "start": "LeftAlign", "right": "RightAlign", "end": "RightAlign", "center": "CenterAlign"}


def style_for(it):
    s = it["style"]
    if s not in STYLES:
        STYLES[s] = it
    return s


def text_frame(it, stories):
    sid = u()
    s = style_for(it)
    st = STYLES[s]
    lead = it["leading"]
    x, y, w, h = [pt(v) for v in it["box"]]
    slack = 2.5 if not it.get("single") else 0.15 * w + 8      # a little room: InDesign's widths are not the browser's; a one-line text gets plenty, so it never wraps
    al = JUST.get(it["align"], "LeftAlign")
    if al == "RightAlign":
        x -= slack
    elif al == "CenterAlign":
        x -= slack / 2
    w += slack
    top = pt(it["base"]) - lead if it["base"] is not None else y
    bottom = y + h + lead
    # the story: one paragraph, its runs; a weight or colour other than the style's is a local override
    runs = ""
    for r in it["runs"]:
        attrs = ""
        if r["w"] != st["weight"]:
            attrs += f' FontStyle="{WEIGHT.get(r["w"], "Regular")}"'
        if r["c"] and r["c"] != st["color"]:
            attrs += f' FillColor="{color(r["c"])}"'
        if it["size"] != st["size"]:
            attrs += f' PointSize="{f(it["size"])}"'
        if abs(it["leading"] - st["leading"]) > 0.01:
            attrs += f'><Properties><Leading type="unit">{f(it["leading"])}</Leading></Properties'
        runs += f'<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]"{attrs}><Content>{escape(r["t"])}</Content></CharacterStyleRange>'
    par = f' Justification="{al}"' if al != JUST.get(st["align"], "LeftAlign") else ""
    stories.append((sid, f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Story xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging" DOMVersion="7.5">
<Story Self="{sid}" AppliedTOCStyle="n" TrackChanges="false" StoryTitle="$ID/" AppliedNamedGrid="n">
<StoryPreference OpticalMarginAlignment="false" OpticalMarginSize="12" FrameType="TextFrameType" StoryOrientation="Horizontal" StoryDirection="LeftToRightDirection"/>
<ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/{escape(s)}"{par}>{runs}</ParagraphStyleRange>
</Story>
</idPkg:Story>
'''))
    return (f'<TextFrame Self="{u()}" ParentStory="{sid}" PreviousTextFrame="n" NextTextFrame="n" ContentType="TextType" {COMMON} FillColor="Swatch/None" StrokeColor="Swatch/None" StrokeWeight="0" Name={quoteattr(it["style"] + ": " + "".join(r["t"] for r in it["runs"])[:40])}>'
            + path_xml(rect_pts(x, top, w, bottom - top))
            + '<TextFramePreference TextColumnCount="1" AutoSizingType="Off" FirstBaselineOffset="LeadingOffset" MinimumFirstBaselineOffset="0" VerticalJustification="TopAlign" IgnoreWrap="true">'
            + '<Properties><InsetSpacing type="list"><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem></InsetSpacing></Properties></TextFramePreference>'
            + '</TextFrame>')


def placed(it):
    x, y, w, h = [pt(v) for v in it["box"]]
    if it["format"] == "png":                   # a PNG gets the resolution that makes its own size its frame's: placed at 100 %
        from PIL import Image
        p = os.path.join(DIR, "Links", it["link"])
        im = Image.open(p)
        dpi = im.width / (w / 72)
        im.save(p, dpi=(dpi, dpi))
        it["natural"] = [w, im.height / dpi * 72]
        it["ppi"] = dpi
    nat = it["natural"]                         # the linked file's own size, points
    s = w / nat[0]
    link = f'<Link Self="{u()}" AssetURL="$ID/" AssetID="$ID/" LinkResourceURI={quoteattr("file:Links/" + it["link"])} LinkResourceFormat="{"$ID/Adobe Portable Document Format (PDF)" if it["format"] == "pdf" else "$ID/Portable Network Graphics (PNG)"}" StoredState="Normal" LinkClassID="35906" LinkClientID="257" LinkResourceModified="false" LinkObjectModified="false" ShowInUI="true" CanEmbed="true" CanUnembed="true" CanPackage="true" ImportPolicy="NoAutoImport" ExportPolicy="NoAutoExport"/>'
    inner_tf = f'ItemTransform="{f(s)} 0 0 {f(s)} {f(x)} {f(y)}"'
    bounds = f'<Properties><GraphicBounds Left="0" Top="0" Right="{f(nat[0])}" Bottom="{f(nat[1])}"/></Properties>'
    if it["format"] == "pdf":
        inner = f'<PDF Self="{u()}" {inner_tf}>{bounds}<PDFAttribute PageNumber="1" PDFCrop="CropMedia" TransparentBackground="true"/>{link}</PDF>'
    else:
        ppi = f'{it["ppi"]:.0f} {it["ppi"]:.0f}'
        inner = f'<Image Self="{u()}" Space="$ID/#Links_RGB" ActualPpi="{ppi}" EffectivePpi="{ppi}" ImageTypeName="$ID/Portable Network Graphics (PNG)" {inner_tf}>{bounds}{link}</Image>'
    eff = ""
    sh = it.get("shadow")
    if sh:
        eff = (f'<TransparencySetting><DropShadowSetting Mode="Drop" BlendMode="Multiply" Opacity="{f(sh["opacity"] * 100)}" '
               f'XOffset="{f(pt(sh["x"]))}" YOffset="{f(pt(sh["y"]))}" Size="{f(pt(sh["blur"]) / 2)}" Spread="0" Noise="0" KnockedOut="true" UseGlobalLight="false" EffectColor="Color/Black"/></TransparencySetting>')
    name = os.path.basename(it["link"])
    return (f'<Rectangle Self="{u()}" ContentType="GraphicType" {COMMON} FillColor="Swatch/None" StrokeColor="Swatch/None" StrokeWeight="0"{corners(pt(it.get("r") or 0))} Name={quoteattr(name)}>'
            + path_xml(rect_pts(x, y, w, h)) + eff + inner + '</Rectangle>')


def natural(it):
    p = os.path.join(DIR, "Links", it["link"])
    if it["format"] == "png":
        from PIL import Image
        im = Image.open(p)
        dpi = im.info.get("dpi", (72, 72))[0] or 72
        return [im.width * 72 / dpi, im.height * 72 / dpi]
    import re
    data = open(p, "rb").read()
    m = re.search(rb"/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]", data)
    return [float(m.group(3)) - float(m.group(1)), float(m.group(4)) - float(m.group(2))]


def item_xml(it, stories):
    k = it["k"]
    if k == "text":
        return text_frame(it, stories) if it["runs"] else ""
    if k == "rect":
        x, y, w, h = [pt(v) for v in it["box"]]
        return f'<Rectangle Self="{u()}" ContentType="Unassigned" {COMMON} FillColor="{color(it["fill"])}" StrokeColor="Swatch/None" StrokeWeight="0">' + path_xml(rect_pts(x, y, w, h)) + '</Rectangle>'
    if k == "orect":
        x, y, w, h = [pt(v) for v in it["box"]]
        return (f'<Rectangle Self="{u()}" ContentType="Unassigned" {COMMON} FillColor="{color(it.get("fill"))}" StrokeColor="{color(it["stroke"])}" StrokeWeight="{f(pt(it["sw"]))}" StrokeAlignment="CenterAlignment"{corners(pt(it.get("r") or 0))}>'
                + path_xml(rect_pts(x, y, w, h)) + '</Rectangle>')
    if k == "line":
        out = ""
        pts = it["pts"]
        for a, b in zip(pts, pts[1:]):
            out += (f'<GraphicLine Self="{u()}" {COMMON} StrokeColor="{color(it["stroke"])}" StrokeWeight="{f(pt(it["sw"]))}" EndCap="RoundEndCap" EndJoin="RoundEndJoin" FillColor="Swatch/None">'
                    + path_xml([(pt(a[0]), pt(a[1])), (pt(b[0]), pt(b[1]))], closed=False) + '</GraphicLine>')
        return out
    if k == "dot":
        cx, cy, r = pt(it["c"][0]), pt(it["c"][1]), pt(it["r"])
        c = 0.5523 * r
        P = [(cx, cy - r), (cx - r, cy), (cx, cy + r), (cx + r, cy)]
        C = [((cx + c, cy - r), (cx - c, cy - r)), ((cx - r, cy - c), (cx - r, cy + c)), ((cx - c, cy + r), (cx + c, cy + r)), ((cx + r, cy + c), (cx + r, cy - c))]
        return f'<Oval Self="{u()}" ContentType="Unassigned" {COMMON} FillColor="{color(it["fill"])}" StrokeColor="Swatch/None" StrokeWeight="0">' + path_xml(P, True, C) + '</Oval>'
    if k in ("img", "overlay", "icon"):
        it["natural"] = natural(it)
        return placed(it)
    return ""


# ── the pages ──
spreads, stories = [], []
G = dict(SIDE=12, TOP=11.5, COL=19.08, GUT=4, ROW=8.25, RGAP=5.5)
cols = " ".join(f(pt(i * (G["COL"] + G["GUT"]))) + " " + f(pt(i * (G["COL"] + G["GUT"]) + G["COL"])) for i in range(12))
margin = f'<MarginPreference ColumnCount="12" ColumnGutter="{f(pt(G["GUT"]))}" Top="{f(pt(G["TOP"]))}" Bottom="{f(pt(G["TOP"]))}" Left="{f(pt(G["SIDE"]))}" Right="{f(pt(G["SIDE"]))}" ColumnDirection="Horizontal" ColumnsPositions="{cols}"/>'
for n, p in enumerate(pages):
    sid = u()
    body = f'<Rectangle Self="{u()}" ContentType="Unassigned" {COMMON} FillColor="{color("#FCFCFA")}" StrokeColor="Swatch/None" StrokeWeight="0" Name="paper">' + path_xml(rect_pts(0, 0, PW, PH)) + '</Rectangle>'
    for it in p["items"]:
        body += item_xml(it, stories)
    guides = ""
    for r in range(14):
        for y in (G["TOP"] + r * (G["ROW"] + G["RGAP"]), G["TOP"] + r * (G["ROW"] + G["RGAP"]) + G["ROW"]):
            guides += f'<Guide Self="{u()}" Orientation="Horizontal" Location="{f(pt(y))}" FitToPage="true" ViewThreshold="5" Locked="false" ItemLayer="{LAYER}" PageIndex="0"/>'
    spreads.append((sid, f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:Spread xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging" DOMVersion="7.5">
<Spread Self="{sid}" FlattenerOverride="Default" AllowPageShuffle="true" ItemTransform="1 0 0 1 0 0" ShowMasterItems="true" PageCount="1" BindingLocation="0" PageTransitionType="None" PageTransitionDirection="NotApplicable" PageTransitionDuration="Medium">
<Page Self="{u()}" GeometricBounds="0 0 {f(PH)} {f(PW)}" ItemTransform="{PAGE_TF}" Name="{p["no"]}" AppliedTrapPreset="TrapPreset/$ID/kDefaultTrapStyleName" OverrideList="" AppliedMaster="{MASTER}" MasterPageTransform="1 0 0 1 0 0" TabOrder="" GridStartingPoint="TopOutside" UseMasterGrid="true">{margin}</Page>
{body}{guides}
</Spread>
</idPkg:Spread>
'''))

# ── the package ──
os.makedirs(DIR, exist_ok=True)
STAGE = os.path.join(os.path.dirname(DIR), "_idml")
shutil.rmtree(STAGE, ignore_errors=True)
shutil.copytree(TPL, STAGE)
for d in ("Spreads", "Stories"):
    os.makedirs(os.path.join(STAGE, d), exist_ok=True)
for sid, xml in spreads:
    open(os.path.join(STAGE, "Spreads", f"Spread_{sid}.xml"), "w").write(xml)
for sid, xml in stories:
    open(os.path.join(STAGE, "Stories", f"Story_{sid}.xml"), "w").write(xml)
# the backing story, emptied of the template's XML
open(os.path.join(STAGE, "XML", "BackingStory.xml"), "w").write('''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:BackingStory xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging" DOMVersion="7.5">
	<XmlStory Self="u9c" AppliedTOCStyle="n" TrackChanges="false" StoryTitle="$ID/" AppliedNamedGrid="n">
		<ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/$ID/NormalParagraphStyle">
			<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]">
				<XMLElement Self="di2" MarkupTag="XMLTag/Root"/>
				<Content>﻿</Content>
			</CharacterStyleRange>
		</ParagraphStyleRange>
	</XmlStory>
</idPkg:BackingStory>
''')
# the master: one page, A4 landscape, the grid's margins and columns
open(os.path.join(STAGE, "MasterSpreads", f"MasterSpread_{MASTER}.xml"), "w").write(f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<idPkg:MasterSpread xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging" DOMVersion="7.5">
<MasterSpread Self="{MASTER}" ItemTransform="1 0 0 1 0 0" OverriddenPageItemProps="" Name="A-Master" NamePrefix="A" BaseName="Master" ShowMasterItems="true" PageCount="1" PrimaryTextFrame="n">
<Page Self="{u()}" GeometricBounds="0 0 {f(PH)} {f(PW)}" ItemTransform="{PAGE_TF}" Name="A" AppliedTrapPreset="TrapPreset/$ID/kDefaultTrapStyleName" OverrideList="" MasterPageTransform="1 0 0 1 0 0" TabOrder="" GridStartingPoint="TopOutside" UseMasterGrid="true">{margin}</Page>
</MasterSpread>
</idPkg:MasterSpread>
''')
# designmap: our spreads and stories in place of the template's
dm = open(os.path.join(STAGE, "designmap.xml"), encoding="utf-8").read()
import re
dm = re.sub(r'\s*<idPkg:Spread src="[^"]*"\s*/>', "", dm)
dm = re.sub(r'\s*<idPkg:Story src="[^"]*"\s*/>', "", dm)
dm = re.sub(r'StoryList="[^"]*"', 'StoryList="' + " ".join([s for s, _ in stories] + ["u9c"]) + '"', dm)
add = "".join(f'\n\t<idPkg:Spread src="Spreads/Spread_{s}.xml"/>' for s, _ in spreads) + "".join(f'\n\t<idPkg:Story src="Stories/Story_{s}.xml"/>' for s, _ in stories)
dm = dm.replace('<idPkg:BackingStory src="XML/BackingStory.xml"', add.lstrip("\n") + '\n\t<idPkg:BackingStory src="XML/BackingStory.xml"', 1)
open(os.path.join(STAGE, "designmap.xml"), "w", encoding="utf-8").write(dm)
# preferences: A4 landscape, single pages, the grid's margins
pr = open(os.path.join(STAGE, "Resources", "Preferences.xml"), encoding="utf-8").read()
pr = re.sub(r'(<DocumentPreference[^>]*?)PageHeight="[^"]*"', rf'\1PageHeight="{f(PH)}"', pr)
pr = re.sub(r'(<DocumentPreference[^>]*?)PageWidth="[^"]*"', rf'\1PageWidth="{f(PW)}"', pr)
pr = re.sub(r'(<DocumentPreference[^>]*?)PagesPerDocument="[^"]*"', rf'\1PagesPerDocument="{len(spreads)}"', pr)
pr = re.sub(r'(<DocumentPreference[^>]*?)FacingPages="[^"]*"', r'\1FacingPages="false"', pr)
pr = re.sub(r'<MarginPreference [^>]*/>', margin.replace(f' ColumnsPositions="{cols}"', ""), pr, count=1)
open(os.path.join(STAGE, "Resources", "Preferences.xml"), "w", encoding="utf-8").write(pr)
# colours
gr = open(os.path.join(STAGE, "Resources", "Graphic.xml"), encoding="utf-8").read()
cxml = "".join(f'\n\t<Color Self="{escape(v)}" Model="Process" Space="RGB" ColorValue="{int(h[1:3], 16)} {int(h[3:5], 16)} {int(h[5:7], 16)}" ColorOverride="Normal" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="{escape(v[6:])}" ColorEditable="true" ColorRemovable="true" Visible="true" SwatchCreatorID="7937"/>' for h, v in sorted(COLORS.items()))
gr = gr.replace("<Swatch ", cxml.lstrip("\n") + "\n\t<Swatch ", 1)
open(os.path.join(STAGE, "Resources", "Graphic.xml"), "w", encoding="utf-8").write(gr)
# paragraph styles, named as the guide names them
sxml = ""
for name, st in STYLES.items():
    bal = '<BalanceRaggedLines type="enumeration">FullyBalanced</BalanceRaggedLines>' if st.get("balance") else ""
    sxml += (f'\n\t\t<ParagraphStyle Self="ParagraphStyle/{escape(name)}" Name="{escape(name)}" Imported="false" NextStyle="ParagraphStyle/{escape(name)}" KeyboardShortcut="0 0" '
             f'FontStyle="{WEIGHT.get(st["weight"], "Regular")}" PointSize="{f(st["size"])}" FillColor="{color(st["color"])}" Justification="{JUST.get(st["align"], "LeftAlign")}" '
             f'Tracking="{f(st["track"])}" Hyphenation="false" SpaceBefore="0" SpaceAfter="0" FirstLineIndent="0" LeftIndent="0" RightIndent="0" Composer="HL Single" KerningMethod="$ID/Metric">'
             f'<Properties><BasedOn type="string">$ID/[No paragraph style]</BasedOn><PreviewColor type="enumeration">Nothing</PreviewColor><Leading type="unit">{f(st["leading"])}</Leading>'
             f'<AppliedFont type="string">Inter</AppliedFont>{bal}</Properties></ParagraphStyle>')
sy = open(os.path.join(STAGE, "Resources", "Styles.xml"), encoding="utf-8").read()
i = sy.index("<RootParagraphStyleGroup")
j = sy.index(">", i) + 1
# the template's own styles first (InDesign needs [No paragraph style]); ours after the last of them
k = sy.index("</RootParagraphStyleGroup>")
sy = sy[:k] + sxml + "\n\t" + sy[k:]
open(os.path.join(STAGE, "Resources", "Styles.xml"), "w", encoding="utf-8").write(sy)
# graphics.xml was rewritten after the colours were all known: the styles above may have added more
gr = open(os.path.join(STAGE, "Resources", "Graphic.xml"), encoding="utf-8").read()
for h, v in sorted(COLORS.items()):
    if f'Self="{v}"' not in gr:
        gr = gr.replace("<Swatch ", f'<Color Self="{escape(v)}" Model="Process" Space="RGB" ColorValue="{int(h[1:3], 16)} {int(h[3:5], 16)} {int(h[5:7], 16)}" ColorOverride="Normal" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="{escape(v[6:])}" ColorEditable="true" ColorRemovable="true" Visible="true" SwatchCreatorID="7937"/>\n\t<Swatch ', 1)
open(os.path.join(STAGE, "Resources", "Graphic.xml"), "w", encoding="utf-8").write(gr)

idml = os.path.join(DIR, "Dial-Tool-guide.idml")
with zipfile.ZipFile(idml, "w") as z:
    z.write(os.path.join(STAGE, "mimetype"), "mimetype", compress_type=zipfile.ZIP_STORED)
    for root, _, files in os.walk(STAGE):
        for fn in sorted(files):
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, STAGE)
            if rel != "mimetype":
                z.write(full, rel, compress_type=zipfile.ZIP_DEFLATED)
shutil.rmtree(STAGE)
print(f"idml.py: {len(spreads)} pages, {len(stories)} text frames, {len(COLORS)} colours, {len(STYLES)} paragraph styles → {os.path.relpath(idml)}")
