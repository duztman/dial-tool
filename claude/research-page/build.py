# Builds index.built.html: the research text (doc/main.md) + drawn figures + licensed photos + the picture pool.
import re, json, html, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import figs
HERE = os.path.dirname(os.path.abspath(__file__))
md = open(f"{HERE}/doc/main.md", encoding="utf-8").read()
data = json.load(open(f"{HERE}/data.json"))
photos = json.load(open(f"{HERE}/photos.json")) if os.path.exists(f"{HERE}/photos.json") else []

def slug(s):
    s = re.sub(r"[^\w\s-]", "", s.lower()).strip(); s = re.sub(r"[\s_]+", "-", s); return s[:60]

# ── inline markdown ──
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

# ── block parser ──
lines = md.splitlines()
out = []; nav = []; i = 0; cur_h2 = None
def flush_para(buf):
    if buf: out.append(f"<p>{inline(' '.join(buf))}</p>")
buf = []
while i < len(lines):
    l = lines[i]
    if l.startswith("# "):
        i += 1; continue  # page title handled by template
    if l.startswith("## ") or l.startswith("### "):
        flush_para(buf); buf = []
        lvl = 2 if l.startswith("## ") else 3; txt = l[lvl + 1:].strip()
        sid = slug(txt)
        if lvl == 2:
            cur_h2 = sid; nav.append((sid, txt, []))
            out.append(f'<h2 id="{sid}">{inline(txt)}</h2>')
        else:
            sid = f"{cur_h2}-{sid}"; nav[-1][2].append((sid, txt))
            out.append(f'<h3 id="{sid}">{inline(txt)}</h3>')
        i += 1; continue
    if l.startswith("|"):
        flush_para(buf); buf = []
        rows = []
        while i < len(lines) and lines[i].startswith("|"):
            rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
        rows = [r for r in rows if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
        if not rows: continue
        head, body = rows[0], rows[1:]
        # drop empty-header tables' header if all blank
        th = "".join(f"<th>{inline(c)}</th>" for c in head)
        tb = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
        out.append(f'<div class="tw"><table class="two"><thead><tr>{th}</tr></thead><tbody>{tb}</tbody></table></div>')
        continue
    m = re.match(r"^(\d+)\.\s+(.*)", l)
    if m or l.startswith("- ") or l.startswith("* "):
        flush_para(buf); buf = []
        ordered = bool(m); items = []
        while i < len(lines):
            l2 = lines[i]; m2 = re.match(r"^(\d+)\.\s+(.*)", l2)
            if ordered and m2: items.append(m2.group(2))
            elif (not ordered) and (l2.startswith("- ") or l2.startswith("* ")): items.append(l2[2:])
            elif l2.startswith("  ") and items: items[-1] += " " + l2.strip()
            else: break
            i += 1
        tag = "ol" if ordered else "ul"
        out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")
        continue
    if l.startswith("&#91;image:") or l.startswith("&#91;embedded"):
        flush_para(buf); buf = []
        cap = re.sub(r"^&#91;(image|embedded content): ", "", l).rstrip("\\]").strip()
        out.append(f'<!--media:{html.escape(cap)}-->'); i += 1; continue
    if not l.strip():
        flush_para(buf); buf = []; i += 1; continue
    buf.append(l.strip()); i += 1
flush_para(buf)
body = "\n".join(o for o in out if not re.match(r"<p>Oct 25, 2026 · @", o))

# ── figures: replace the doc's media markers, and add the new drawings ──
F = figs.FIGS
def photo_fig(keys, cap):
    cards = ""
    for k in keys:
        p = next((x for x in photos if x["key"] == k), None)
        if not p: continue
        cards += (f'<figure class="photo"><a href="{p["large"]}" class="zoom" data-cap="{html.escape(p["cap"])}" data-credit="{html.escape(p["credit"])}"><img loading="lazy" decoding="async" src="{p["large"]}" width="{p["w"]}" height="{p["h"]}" alt="{html.escape(p["alt"])}"></a>'
                  f'<figcaption>{p["cap"]} <span class="credit">{p["credit"]}</span></figcaption></figure>')
    return f'<div class="photos">{cards}</div>' if cards else ""

media = {
    "Fig. 1 — lume grades by day and over the night": F["fig-night"](),
    "Fig. 3 — the Day · Night switch on one dial": "",
    "Fig. 18 — finest line and gap per method": F["fig-finest"](),
    "Fig. 14 — engraved and stamped patterns under one sun": F["fig-groove"](),
    "C3 lume, BGW9 lume and tritium tubes": photo_fig(["146561276", "146647007", "2443976"], ""),
    "Two sunburst dials": photo_fig(["184506033", "98916281"], ""),
    "Record grooves and brushed metal": photo_fig(["56260321", "10521814"], ""),
    "Guilloché and tapisserie dials": photo_fig(["73001952", "124097422"], ""),
}
def media_sub(m):
    cap = html.unescape(m.group(1))
    if cap.startswith("fair organisers"): return F["fig-fairs"]()
    return media.get(cap, "")
body = re.sub(r"<!--media:(.*?)-->", media_sub, body)
# drop the v2 photo caption paragraphs that followed removed/kept images? keep them: they carry the credits.
# place the new drawings after their section's lead paragraph
def after_heading(hid, fig_html):
    global body
    m = re.search(rf'<h[23] id="{hid}">[^<]*</h[23]>(\s*<p>(?:(?!</p>).)*</p>)?', body, re.S)
    if m: body = body[:m.end()] + fig_html + body[m.end():]
    else: print("no place for", hid)
after_heading("microbrands-20232026-price-bands", F["fig-bands"]())
after_heading("how-they-design-and-produce-dials-the-process-and-where-it-bites", F["fig-chain"]())
after_heading("their-pain-failure-modes-ranked", F["fig-pain"]())
after_heading("finishes-enamel", F["fig-enamel"]())
after_heading("where-dial-tool-fits", F["fig-fit"]())
# extra licensed photos from the agent, by section
extra = json.load(open(f"{HERE}/place.json"))
for hid, keys in extra.items():
    pf = photo_fig(keys, "")
    if pf: after_heading(hid, pf)

# ── nav ──
navhtml = ""
for sid, txt, subs in nav:
    navhtml += f'<a href="#{sid}">{html.escape(txt)}</a>'
# ── template ──
tpl = open(f"{HERE}/template.html", encoding="utf-8").read()
page = tpl.replace("__BODY__", body).replace("__NAV__", navhtml).replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
open(f"{HERE}/index.built.html", "w", encoding="utf-8").write(page)
print("built", len(page) // 1000, "KB;", len(nav), "sections;", body.count("<table"), "tables;", body.count('class="draw"'), "drawings;", body.count('class="photo"'), "photos")
