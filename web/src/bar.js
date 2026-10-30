// bar.js — the bottom bar: the time and its play, the speed ball, the day strip with its ruler and needle, AM · PM,
// the date, Now.

import * as G from "./geometry.js";
import { offset as ink_offset } from "./ink.js";
import { el, fmt_time } from "./ui.js";
import { UNIT_INK } from "./rows.js";
import { ARCADE } from "./icons.js";

// the day slider's steps: every hour (10:10 left the timeline: Okay, 23 Oct 2026, "10:10 was a good joke while it lasted")
export const DAY_STEPS = Array.from({ length: 12 }, (_, h) => [h * 3600, String(h || 12)]);

// how fast time runs: one slider from half speed to 720×, on a log scale, with humps on its track at 1× (larger),
// 6×, 60× and 720× (Okay, 14 Oct 2026, 23:26: "a regular sliding track with humps on it on 1 (larger), 6 then
// logarithmicly up to 720"; "slightly slower is acceptable": it starts at 0.5×). Near a hump the slider snaps onto
// it. The speed is written beside the track, not on its thumb, which a finger covers.
// Slow motion is back below 1× (Okay's notes, p. 15, #283; removed 15 Oct 2026, 01:59): the track's first part, two
// thumbs wide, holds four steps — 0.1 · 0.25 · 0.5 · 1× ("not many steps") — and the thumb snaps onto them; from 1×
// the rest runs on a log scale to 720× as before. The thumb starts at 1×; the ends are marked 0.1X and 720X.
export const SPEED_SLOW = [0.1, 0.25, 0.5, 1], SPEED_HI = 720;

/** a speed → 0 to 1 along the track, whose first `split` holds the slow steps */
export const speed_place = (k, split) => (k < 1 ? split * SPEED_SLOW.reduce((best, x, i) => (Math.abs(x - k) < Math.abs(SPEED_SLOW[best] - k) ? i : best), 0) / (SPEED_SLOW.length - 1) : split + (1 - split) * Math.log(k) / Math.log(SPEED_HI));

/** …and back: a place on the track → its speed (a slow step, or anything from 1× up) */
export const speed_at = (p, split) => (p < split ? SPEED_SLOW[Math.round(p / split * (SPEED_SLOW.length - 1))] : SPEED_HI ** ((p - split) / (1 - split)));

export const speed_word = (k) => (k >= 10 ? String(Math.round(k)) : String(+k.toFixed(k < 1 ? 2 : 1)));      // the figures: 0.25, 1, 2.5, 60

export const frac = (x) => ((x % 1) + 1) % 1;

export const PULSE_MOST = 6;      // the play button's pulse: at most this many a second, unless the movement's own beat is more (#282; 3 in 4.44 — Okay: "Play button can go faster in animation"; the three-flash limit is for flashes over a large part of the view, not a 31-point button)

export const PULSE_RISE = 0.03;   // the triangle's flash: how much of it is the rise — next to nothing, a few milliseconds — before the eased fall (#308; Okay, 17 Oct 2026: "like a flash: zero to bright in milliseconds, then slow descent. but all very quickly"; a fifth until 4.49.2)

export const PULSE_FLASH = 0.4;   // …and how much of a beat the whole flash takes (Okay: "all very quickly")

export const BAR = {
  /** the half of the day that is showing, in seconds: 0 in the morning, 43200 after noon. The slider and its steps
   *  are twelve hours long and stay in the half they are in. */
  half() { return this.S.t % 86400 >= 43200 ? 43200 : 0; },

  sync_time() {
    if (G.set_today(G.day_text(new Date()))) this.static_dirty = true;      // the geometry is told the day (R6: it never reads the clock); a new day redraws a dial that follows the date
    if (this.date_pop_sync) this.date_pop_sync();      // the date popup follows a day passing at midnight
    const t12 = ((this.S.t % 43200) + 43200) % 43200;
    if (this.date_lines) {                         // the date, stacked: day over month, two figures each (07/10; no year — Okay, 19 Oct 2026: "better fit inside the bounding box")
      const [y, m, d] = G.shown_day(this.S).split("-");
      [d, m].forEach((v, i) => { if (this.date_lines[i].textContent !== v) this.date_lines[i].textContent = v; });
      this.date_button.classList.toggle("today", !this.S.date);
      this.date_button.ariaLabel = `Date ${d}/${m}/${y.slice(-2)}${this.S.date ? "" : ", today"}`;
    }
    if (document.activeElement !== this.time_field) this.time_field.value = fmt_time(this.S.t);
    // centred on its ink, measured with every figure a 0, so it stands still while its figures change (ink.js)
    const zeros = this.time_field.value.replace(/[0-9]/g, "0");
    if (zeros !== this.time_zeros) {
      this.time_zeros = zeros;
      const [dx, dy] = ink_offset(zeros, getComputedStyle(this.time_field));
      this.time_field.style.setProperty("--ink-dx", dx + "px");
      this.time_field.style.setProperty("--ink-dy", dy + "px");
    }
    if (document.activeElement !== this.time_slider || this.playing) this.time_slider.value = Math.floor(t12);
    this.place_needle(t12);
    for (const b of document.querySelectorAll(".steps12 button")) b.classList.toggle("on", Math.abs(+b.dataset.t - t12) < 0.5);
    const word = this.half() ? "PM" : "AM";
    if (this.half_button.textContent !== word) this.half_button.textContent = word;
  },

  set_time(t) {
    this.S.t = t;
    if (this.playing) this.play_from = [performance.now(), t];     // Play carries on from the new time
    this.sync_time();
    this.render();
  },

  /** the needle on the ruler, from the time itself (t12: seconds into the half day): over the slider's thumb's place,
   *  from the ruler's top down to the bar's foot. */
  place_needle(t12 = ((this.S.t % 43200) + 43200) % 43200) {
    const n = this.needle, s = this.time_slider;
    if (!n || !n.isConnected || !s.clientWidth) return;
    const THUMB = 3, bar = n.closest(".bar");
    n.style.left = `${s.offsetLeft + THUMB / 2 + (s.clientWidth - THUMB) * t12 / 43200}px`;
    n.style.top = `${s.offsetTop}px`;
    n.style.height = `${bar.getBoundingClientRect().bottom - s.getBoundingClientRect().top}px`;
  },

  /** the day's ruler. An hour gets as many cuts as its width allows: none, halves, quarters, ten or five minutes.
   *  Hour lines are long, the others shorter; all cross the line. A click on the slider snaps to the nearest cut. */
  draw_ruler() {
    const W = this.time_slider.clientWidth, H = 26, THUMB = 3;      // H: --ruler
    if (!W) return;
    const hour = (W - THUMB) / 12;
    const minutes = [5, 10, 15, 30, 60].find((m) => hour / (60 / m) >= 7) || 60;      // cuts at least 7 apart
    const x = (t) => (THUMB / 2 + (W - THUMB) * t / 43200).toFixed(2);
    const lines = { hour: "", half: "", small: "" };
    this.day_ticks = [];
    for (let m = 0; m < 720; m += minutes) {
      const kind = m % 60 === 0 ? "hour" : m % 30 === 0 ? "half" : "small", h = { hour: 21, half: 14, small: 8 }[kind];      // taller (Okay, 30 Oct 2026, 18:38: "taller marks as wider vertically"; were 18 · 12 · 7)
      lines[kind] += `M${x(m * 60)} ${(H - h) / 2}V${(H + h) / 2}`;
      this.day_ticks.push(m * 60);
    }
    this.place_needle();
    this.ruler.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.ruler.dataset.minutes = minutes;
    this.ruler.innerHTML = `<path class="line" d="M0 ${H / 2}H${W}"/>` + Object.entries(lines).map(([kind, d]) => `<path class="${kind}" d="${d}"/>`).join("");
  },

  /** how fast time runs while playing: 1 = a real second each second. Part of the window, not of the dial. */
  set_speed(k) {
    this.speed = k;
    if (this.playing) this.play_from = [performance.now(), this.S.t];
    const split = this.speed_split(), p = Math.round(speed_place(k, split) * 1000);
    this.one_knob.style.setProperty("--at", split.toFixed(4));      // 1× is where the slow steps end
    if (document.activeElement !== this.speed_slider || k < 1) this.speed_slider.value = p;      // a slow speed: the thumb onto its step, even while dragged
    this.speed_slider.setAttribute("aria-valuetext", speed_word(k) + "×");
    const word = speed_word(k) + "X";      // a slow speed's leading 0 in a span of its own: a phone's thumb, which holds the word, leaves it out (".25X")
    if (this.speed_name.textContent !== word) this.speed_name.replaceChildren(...(k < 1 ? [el("span", { className: "zero", textContent: "0" }), word.slice(1)] : [word]));
    this.speed_name.style.setProperty("--at", (+this.speed_slider.value / 1000).toFixed(4));      // where the thumb stands
    this.speed_slider.title = `How fast time runs: ${speed_word(k)}× (0.1× to 720×)`;
    this.speeds.classList.toggle("real", k === 1);
  },

  /** the unit box round its word's ink, 2 px from every side (Okay, 16 Oct 2026, #302). The ink's size and place on its
   *  line come from Dial Mono's outlines (UNIT_INK); where the browser puts the line's baseline is measured, with a dot
   *  on it — browsers round a face's ascent and descent each their own way (counted 16 Oct 2026: 8 px down a 10 px line
   *  in Chromium, where the face's figures say 8.6; on Okay's screen "mm" stood on the box's bottom line) */
  size_unit() {
    const word = this.unit()[0], ink = UNIT_INK[word] || UNIT_INK.mm, box = this.unit_button, b = box.style;
    const span = el("span", { className: "word", textContent: word }), dot = el("span");
    box.replaceChildren(span);
    dot.style.cssText = "display:inline-block;width:0;height:0";
    span.append(dot);
    const line = span.getBoundingClientRect(), base = dot.getBoundingClientRect().top - line.top;
    dot.remove();
    if (!line.height) return;      // not shown (a phone's squeezed line): placed when it is
    // in whole screen dots, so the line is crisp and the room the same on every side: the box round the ink, the ink's
    // leftover fraction shared out, the word placed so its ink starts the padding in
    const size = parseFloat(getComputedStyle(box).fontSize), dots = window.devicePixelRatio || 1, snap = (v) => Math.round(v * dots) / dots;
    // its width the word's own; its height mm's for every unit, on mm's baseline, so a unit's ascenders and descenders
    // reach into the padding (Okay, on 4.44.3: "Others use the same height, width can change")
    const [l, w] = ink.map((v) => v * size), [, , t, h] = UNIT_INK.mm.map((v) => v * size), W = Math.round(w * dots) / dots, H = Math.round(h * dots) / dots;
    b.setProperty("--ink-w", W + "px");
    b.setProperty("--ink-h", H + "px");
    b.setProperty("--word-x", snap((W - w) / 2 - l) + "px");      // from the padding's inner edge to the word's line
    b.setProperty("--word-y", snap((H - h) / 2 + t - base) + "px");
    requestAnimationFrame(() => this.level_title());      // a box of another height: its word on the title's baseline again
  },

  /** how much of the speed track the slow steps take: two thumbs of the thumb's travel (#283: "at least as wide as two
   *  thumbs"), a fifth to a half of it; before the bar is laid out, two fifths */
  speed_split() {
    const thumb = parseFloat(getComputedStyle(this.speeds).getPropertyValue("--speed-thumb")) || 0, travel = this.speed_slider.getBoundingClientRect().width - thumb;
    return thumb > 0 && travel > 0 ? Math.min(0.5, Math.max(0.2, 2 * thumb / travel)) : 0.4;
  },

  /** while time runs the play button pulses with each beat of the movement (Okay, 15 Oct 2026, 01:20; his notes, p. 14,
   *  #282): its cap brightens and fades the whole way before the next beat, eased (--pulse, 0 to 1 of --play-pulse);
   *  the triangle flares with it and fades faster, gone by half the beat (--pulse-tri, between its two bounds). The beat
   *  is the movement's own (Hands: 1/s quartz, 6 or 8 a second); a sweep has none, and breathes once every two seconds.
   *  It follows the time shown, so it falls with the seconds hand's steps and goes faster as time does — up to six
   *  a second (PULSE_MOST), or the movement's own beat if that is more; past that it holds, in real seconds (720× would
   *  otherwise flash hundreds of times a second; answer to #282).
   *  Below 1× (slow motion) the triangle's flash keeps its own pace (#308; Okay, 16 Oct 2026, on 4.46: "flash and dim
   *  the arrow much faster on slow speeds, flash brighter. Like an analog fade. Eased over the line and comes back"):
   *  it starts at the beat as before, but lasts as long in real seconds as it does at 1× (half a beat), and peaks
   *  brighter (the button's class slow: --play-tri-slow); a sweep's breath runs in real seconds there too. The flash
   *  itself is a flash: zero to bright in milliseconds (PULSE_RISE), then an eased descent, all within PULSE_FLASH of a beat.
   *  t = the time shown, in seconds · now = real seconds. Not where the system asks for less motion. */
  pulse(t, now = 0) {
    let cap = 0, tri = 0;
    const slow = this.speed < 1;
    if (this.playing && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const beat = G.BEATS[this.S.ha_beat] ? G.BEATS[this.S.ha_beat][1] : 0, rate = beat || 0.5, most = Math.max(beat, PULSE_MOST);
      const f = rate * this.speed <= most ? frac(t * rate) : frac(now * most);      // how far from the last beat, 0 to 1
      if (beat > 0) {
        cap = (1 - f) ** 3;                                                         // the cap: a flash at the beat, fading the whole beat
        const h = Math.min(1, (slow ? f / this.speed : f) / PULSE_FLASH);           // the flash's own clock: 0 at the beat, 1 when it is over (PULSE_FLASH of a beat; at 0.1× still that much of a beat in real time)
        tri = h < PULSE_RISE ? 0.5 - 0.5 * Math.cos(Math.PI * h / PULSE_RISE) : (1 - (h - PULSE_RISE) / (1 - PULSE_RISE)) ** 2;
      } else {                                                                      // sweep: a slow breath (in real seconds below 1×)
        cap = 0.5 - 0.5 * Math.cos(2 * Math.PI * (slow ? frac(now * rate) : f)); tri = cap ** 3;
      }
    }
    this.play_button.classList.toggle("slow", this.playing && slow);
    this.play_button.style.setProperty("--pulse", cap.toFixed(3));
    this.play_button.style.setProperty("--pulse-tri", tri.toFixed(3));
  },

  play(on) {
    this.playing = on;
    if (!on) this.pulse(0);
    this.play_from = [performance.now(), this.S.t];
    this.play_icon();
    this.render();
  },

  /** the arcade button shows whether time runs: up, still; pressed in, running (ARCADE). Its name says what a press does. */
  play_icon() {
    this.play_button.innerHTML = ARCADE(this.playing);
    this.play_button.setAttribute("aria-pressed", String(this.playing));
    this.play_button.title = this.play_button.ariaLabel = this.playing ? "Pause" : "Play";
  },
};
