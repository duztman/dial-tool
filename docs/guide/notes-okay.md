# Okay's notes on the guidebook, all rounds (canon for whoever builds or reviews a page)

*14 Oct 2026. Collected from the chat and from his annotated PDFs (rounds 1–4). Each line is a rule; the page it came from is in brackets. When a new note contradicts an old one, the new one wins.*

## Writing
- Short prose, plain words, no jargon outside the reference pages. Tone: a guide to a piece of technical equipment. No promotional or "ad copy" lines ("one idea", "the link is the dial" as a slogan). [r3 06, r4 01]
- Block titles carry information, not a catchy fragment that only exists to make a full stop. "Everything is in millimetres" is vague; a short title is fine only if it is information-dense. [r4 01]
- Every label that points at something says, in one self-contained sentence, what it does and how or where to use it. Never the obvious ("a click opens…"), never an internal name ("a group with its eye"). The Guides control is a button: say what it does. [r3 03/04]
- No redundant labels: if the screenshot already says it (a button reading "Copy link"), do not label it. [r4 01]
- No orphans and no "widow-ish" endings: not one word, not two short words, alone on a line. Every paragraph and every label should read as a block, a rectangle. Fix with small text edits. [r2, r4 03]
- Leads: one sentence per line, written with care. [r2 01]
- "Watch" notes are valuable (and a pun): add them wherever they genuinely help. [r3 05]
- A Watch note hangs directly under the block it warns about: smaller (8 pt), indented further, no rule of its own. The pair fills grid boxes as one; a box it runs into counts as full, and the next block starts in the box after. [r4 01, 19:18]
- English only.

## Hierarchy and layout
- Narrative from big to small: big title → the lead (two lines) directly under the title → the image → its explaining text; then image–text pairs repeat, getting smaller and more detailed. [r3 01, r4 03]
- Pages: one larger image on the left, smaller and more detailed to the right; denser pages with controlled white space; four equal columns are not enough. [r3 01]
- Text: a touch smaller and more line height than first drafts. [r1]
- On a page that is one big annotated picture, the leader labels are the main text; the explanatory blocks under it are lesser information and must be SMALLER than the leader labels. [r4 03]
- Text close to its picture so they read as one unit; a hairline above every text block. [r1 02]
- Everything on the 8-unit grid; the part tab sits above the rule, one grid row; beside it the guide's name, the address at the far right. [r2, r3 03]
- The whole window comes before its parts. [r3 04→03]
- Proportion, balance, detail: every screenshot, line break and placement intentional. [r3]
- A homogeneous page beats a hole: no empty grid box at the bottom of a column. If a column runs short, give it another small screenshot and tidbit. [r4 01, 19:18]

## Screenshots
- Interface is black and white mostly. Background screenshots go through a gradient map: section colour as white, a slightly darker version as black (low contrast). [r2, r3 05]
- The part that matters: isolated, extended on all sides with its own background colour (a box with margins), rounded corners, small soft shadow (≈4 px blur, 30 % black). Watch background continuation. [r3 05/06]
- Crop for information, not for CSS boxes: no empty right halves; for a long list of similar items, crop in the middle and let it fade. The fade starts only after at least two unselected items, so a reader sees the list goes on; not too tight. [r3 05, r4 06]
- Never overlap what you screenshotted. No ghost/low-opacity outlines of the same UI behind the card. If the background cannot give context, use the plain section colour. It is good to show where a crop comes from. [r4 01]
- What you screenshot is centred in its frame, with room for every help text to float around it, and even spacing. [r4 01]
- Two states of one control (closed → open) at the same size, side by side or one above the other, so the change shows. [r1 01, r3 06]
- Frames must not cut UI lines or collide with the UI's own outlines; no overlaps, no cut-offs. [r3 03/04]
- Zoom only to what the text talks about; read the whole paragraph and show what it describes, several small pictures if needed (zoom levels, circumstances). [r3 03/06]
- Bottom of a picture is not "nothingness": fill with something that works (small screenshots of the thing working). [r3 03]

## Lines and boxes (dot-and-line labels)
- Lines move only at 90°; they never cross; each is distinct and easy to follow. [r4 03]
- No zigzag: a line from something directly below/above goes straight. Fewer kinks; equal line widths. [r4 03]
- Lines never pass through content (a UI label, a title). [r4 03]
- A highlight box is larger than what it highlights (padding on all sides); it never touches or overlaps the highlighted thing. [r4 03]
- Labels next to each other must not read as one sentence: clear separation. [r4 03]
- Use lines generously to annotate buttons; longer texts and more screenshots are fine, arranged homogeneously. [r3 06]

- Highlights are outline shapes in the section's dark ink, well clear of what they ring (aim ~10 screen px; where the interface is denser, as much as it leaves, never touching a UI line); no grey washes. [r4 06, 19:52]
- Labels over a picture share one baseline (bottom-aligned, pointing down); labels under it share one cap line (top-aligned, pointing up). The space round a picture is shared out evenly: above the labels = between labels and picture = under the picture. [r4 06, 19:52]
- A line meets the text, not its bounding box: it ends just under (or over) the line of words it belongs to, somewhere inside the words (a quarter to three quarters along), never at a corner. Side labels: the line meets the first line at its x-height middle. Lines must be long enough to read as lines. [r4 06, 19:52]
- Screenshot cards: rounded corners, a little more padding. [r4 06, 19:52]

- Communication beats the rules: break one on purpose when it removes unease. A page reads either as a clearly designed white space or as no white space at all; never as leftover gaps. (Page 06: the lead beside the title; rows stretched to fill the page; a narrow label so the picture sits nearer the centre.) [r5 06, 20:22]
- Labels carry information, not repeated names: on a dial, say each ring's kind and what it draws ("Ticks · every five minutes"), not "Bezel: …" five times. [r5 06, 20:22]

- Labels say what a thing means and how it works, never what it looks like ("Sixty ticks that skip where a marker sits", not "Ticks · the minute track"); don't define one thing over and over. [r6 06, 20:46]
- Watch notes: no space before the warning icon; the icon itself pushes the text in. (Okay's own rule, not general design knowledge.) [r6 06, 20:46]
- Outlines: a lighter, clearer tone of the section colour, not the dark ink (it clashed with the interface's blacks). Where the interface leaves no room (the open + menu), an outline may lie over it so the highlight can breathe, as long as the eye stays on the thing. [r6 06, 20:46]
- Balance and emptiness are judged by eye for each page; when the lead stands beside the title it fills the right half, its last line on the title's baseline. [r6 06, 20:46]

- Show how the material works, don't arrange boxes (Okay, 21:18–21:33). Page 06: the list taken apart row by row, each row joined by a straight line to its ring lifted off the dial as a layer (top row = top layer; gaps where a ring gives way); the plate at the bottom. Beside it, cause and effect: one setting changed, the diver exported again by the tool, before → after in loupes. [r9 06]

## Cover (later)
- Big type: tighter tracking/kerning; the title must not overlap the dial. A richer, aesthetic dial; Okay will guide. Etching is not the focus; ring building and design help are. [r1, r4 00]

## Content facts
- Production not tested yet; no production figures. Hide-panel button does not work in 4.36.1 (#182). Guide locked to beta 4.36.1.
