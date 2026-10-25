# check.py — what changed in the app since the help page was last checked, and what the page doesn't name.
#   python3 guide/help/check.py          report
#   python3 guide/help/check.py --done   after the page is revised: record this app version and its labels as checked
#
# It reads every row label in web/src/rows.js (the ROWS block: hdr, num, chk, seg, pick, pop, txt, col) and
#  1. compares them with labels.txt, the labels at the last check: labels added and gone since;
#  2. looks for each label in the page's text: a label the page never names is listed, unless known.txt says why;
#  3. compares the app's VERSION with the version the page was checked against (<meta name="checked">), and lists
#     the changelog's headings in between, the place to read what changed in behaviour, which labels can't show.
import re, sys, html
from pathlib import Path

here = Path(__file__).parent
root = here.parent.parent
app = (root / "web/src/rows.js").read_text()      # the panel's rows (app.js is in parts since 4.94, #69)
page = (here / "index.html").read_text()
version = re.search(r'VERSION = "([^"]+)"', (root / "web/src/geometry.js").read_text())[1]
checked = re.search(r'<meta name="checked" content="([^"]+)"', page)
checked = checked[1] if checked else "never"

block = app[app.index("const ROWS = {"):app.index("const SECTIONS = Object.keys(ROWS)")]
labels = []
for m in re.finditer(r'\b(hdr|num|chk|seg|pick|pop|txt|col)\("([^"]*)"(?:,\s*"([^"]*)")?', block):
    label = m[2] if m[1] == "hdr" else m[3]
    if label and label not in labels:
        labels.append(label)

text = html.unescape(re.sub(r"<[^>]+>", " ", page)).lower()
text = re.sub(r"\s+", " ", text).replace("’", "'")
known = {}
if (here / "known.txt").exists():
    for line in (here / "known.txt").read_text().splitlines():
        if line.strip() and not line.startswith("#"):
            label, _, why = line.partition(" — ")
            known[label.strip()] = why.strip()

before = (here / "labels.txt").read_text().splitlines() if (here / "labels.txt").exists() else []
added = [l for l in labels if l not in before]
gone = [l for l in before if l not in labels]
missing = [l for l in labels if l.lower().replace("’", "'") not in text and l not in known]

print(f"app {version} · page checked against {checked}")
if checked != version:
    log = (root / "docs/changelog.md").read_text()
    heads = re.findall(r"^#+ .*$", log, flags=re.M)
    since = []
    for h in heads:
        if h.startswith(f"## {checked} "): break
        since.append(h)
    print(f"\nchangelog since {checked} (read these for behaviour):")
    for h in since[:40]: print("  " + h)
if before:
    print(f"\nlabels added since the last check ({len(added)}):", ", ".join(added) or "none")
    print(f"labels gone since the last check ({len(gone)}):", ", ".join(gone) or "none")
print(f"\nlabels the page doesn't name ({len(missing)} of {len(labels)}; known.txt explains {len(known)}):")
for l in missing: print("  " + l)

if "--done" in sys.argv:
    (here / "labels.txt").write_text("\n".join(labels) + "\n")
    new = f'<meta name="checked" content="{version}">'
    page = re.sub(r'<meta name="checked" content="[^"]+">', new, page) if checked != "never" else page.replace("<title>", new + "\n<title>", 1)
    page = re.sub(r"(<footer>Dial Tool · )beta [\d.]+( · help written )[^·<]+", lambda m: f"{m[1]}{version}{m[2]}" + __import__("datetime").date.today().strftime("%-d %b %Y") + " ", page)
    page = re.sub(r'<span class="ver">[^<]*</span>', f'<span class="ver">{version}</span>', page)
    (here / "index.html").write_text(page)
    print(f"\nrecorded: page checked against {version}; labels.txt written")
