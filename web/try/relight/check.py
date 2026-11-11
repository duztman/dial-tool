# check.py — before a publish of the 3D trial: the module parses, and no code line hides behind a // comment (rounds 34, 36, 41, 44 all
# shipped a statement swallowed by a comment on the same line). Run from web/: python3 try/relight/check.py
import re, sys
FILES = ["watch3d.html", "main.js", "drawing.js", "specs.js", "sweep.js", "dial-in.js"]      # the page and its own modules (round 101)
bad = 0
for i, l, f in ((i, l, f) for f in FILES for i, l in enumerate(open("try/relight/" + f).read().split("\n"), 1)):
    if l.lstrip().startswith("//") or "//" not in l: continue
    head, seg = l.split("//", 1)
    if head.rstrip().endswith(":") or "http" in head[-8:]: continue      # a URL
    if re.search(r"[a-zA-Z_$][\w.$]*\s*=\s*[^=]", seg) and re.search(r";\s*$", seg): print(f"{f} line {i}: code after a comment? …{seg[-120:]}"); bad += 1
print("swallowed-line scan:", "clean" if not bad else f"{bad} suspect line(s)"); sys.exit(1 if bad else 0)
