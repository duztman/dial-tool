# patch87.py — round 87 on the round 86 page: python3 patch87.py <in> <out>
import sys, re
s = open(sys.argv[1], encoding="utf-8").read()
def rep(old, new):
    global s
    assert s.count(old) == 1, f"{s.count(old)} of {old[:70]!r}"; s = s.replace(old, new)
i = s.index("the 3D exercise, round 86 (10 Nov 2026): "); 
rep("the 3D exercise, round 86 (10 Nov 2026): ", "the 3D exercise, round 87 (10 Nov 2026): a Movement switch in the Dial pane — the dial's own heights, or the Miyota 8215's or 9015's (hour, minute, seconds, the cap), from Miyota's drawings. Round 86: ")
rep("<h1>Watch 3D · round 86</h1>", "<h1>Watch 3D · round 87</h1>")
rep('"heights":{"hour":0.05,"minute":0.35,"second":0.6,"cap":0.75}', '"heights":{"hour":0.05,"minute":0.85,"second":1.2,"cap":1.45}')
rep('const HAND = { t: 0.15 };', '''// THE MOVEMENT (round 87; Okay, 10 Nov 2026: "Ok can you search for these numbers on the most popular novement? Miyota i think it
// was." · "Amazing. Implement." · "Both, as a switch"): `HAND.move` "dial" stands every hand where the dial says; a movement's name
// stands the hour, minute and seconds hands and the cap at that movement's heights, mm over the dial's face — Dial Tool's
// `MOVEMENT_HEIGHTS` (geometry.js, #585), where each number's source is written. Any other hand keeps the dial's height
const MOVES = { "8215": { hour: 0.3, minute: 0.85, second: 1.2, cap: 1.45 }, "9015": { hour: 0.35, minute: 0.95, second: 1.4, cap: 1.7 } };
const HAND = { t: 0.15, move: "dial" };''')
rep('''The dial gives each hand the height it stands at (Dial Tool's Shadows pane: hour 0.15, minute
// 0.35, seconds 0.60, the cap 0.75 to start) — so the spaces between hands are the dial's.''', '''Each hand stands at a height: the dial's own (Dial Tool's Shadows pane) or, by the
// Movement switch, a movement's (`MOVES`) — so the spaces between hands are the dial's or the movement's.''')
rep('heightOf = (it) => it.z ?? (it.role === "cap" ? Hh.cap : Hh[it.hand]);', 'own = (it) => it.z ?? (it.role === "cap" ? Hh.cap : Hh[it.hand]), M = MOVES[HAND.move], heightOf = (it) => M?.[it.role === "cap" ? "cap" : it.hand] ?? own(it);')
rep('''        <div class="row"><label>Hand thickness</label>''', '''        <div class="row"><label>Movement</label><div class="pills" id="hand-move"><button data-v="dial" class="on">Dial's own</button><button data-v="8215">8215</button><button data-v="9015">9015</button></div></div>
        <div class="row"><label>Hand thickness</label>''')
rep('''(their heights are Dial Tool's): thicker than that and they run into each other.`; };''', '''(their heights are ${HAND.move === "dial" ? "the dial's, from Dial Tool" : "the Miyota " + HAND.move + "'s"}): thicker than that and they run into each other.`; };
  for (const b of $("hand-move").querySelectorAll("button")) b.onclick = () => { $("hand-move").querySelector(".on")?.classList.remove("on"); b.classList.add("on"); HAND.move = b.dataset.v; buildDial(); if (S.style !== "photo") applyStyle(look()); show(); render(); };''')
rep('else if (it.role === "cap") { z = heightOf(it); thick = 0.25; }', 'else if (it.role === "cap") { thick = 0.25; z = heightOf(it) - thick; }      // the cap\'s height is its TOP, the top of the stack (Dial Tool\'s word): it closes over the seconds hand\'s hub')
rep("A hand's BOSS is its hub:", "The CAP's height is its top. A hand's BOSS is its hub:")
open(sys.argv[2], "w", encoding="utf-8").write(s)
