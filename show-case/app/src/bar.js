// Dial Show Case — the bottom bar, as Dial Tool has it (web/src/app.js, beta 4.90): play (the arcade button, pulsing
// with the movement's beat), how fast (0.1× to 720×), the time with its AM · PM and its date (a popup to change it),
// Now, the day's ruler with its hours and 10:10, and the view's zoom. The code is Dial Tool's, moved into a class of
// its own: `host` stands where the tool was — it holds S (t, date, ha_beat) and draws when told.
import * as G from "../../../web/src/geometry.js";
import { offset as ink_offset } from "../../../web/src/ink.js";

export const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children) e.append(c);
  return e;
};
const svg_el = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const LINE = 1.5, SLANT = LINE + 1 / 16, CURVE = LINE + 2 / 16;
const sw = (w) => `stroke-width="${w}"`;
export const icon = (inside, size = 16, high = size) => `<svg viewBox="0 0 ${size} ${high}" width="${size}" height="${high}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round">${inside}</svg>`;
const RIM = 15.5 - CURVE / 2;
const SIGNS = { plus: `<path d="M8.25 3.75V12.75M3.75 8.25H12.75"/>`, minus: `<path d="M3.75 8.25H12.75"/>` };
export const STEP = { plus: icon(`<path d="M8.25 2.25V14.25M2.25 8.25H14.25"/>`), minus: icon(`<path d="M2.25 8.25H14.25"/>`) };
const FIND = `<circle cx="7" cy="7" r="4.25" ${sw(CURVE)}/><path d="M10.25 10.25L13.25 13.25" ${sw(SLANT)}/>`;
const play_triangle = (c, r) => {
  const p = (a) => `${(c + r * Math.cos(a * Math.PI / 180)).toFixed(3)} ${(c + r * Math.sin(a * Math.PI / 180)).toFixed(3)}`;
  return `M${p(0)}L${p(120)}L${p(240)}Z`;
};
// play: an arcade button seen from above — up while still, pressed in while time runs
const ARCADE = (down) => {
  const RING = 0.75 * 2, CAP = RIM + CURVE / 2, R = CAP + RING, C = R, mid = CAP - RING / 2;
  const arc = (from, to) => {
    const p = (a) => `${(C + mid * Math.cos(a * Math.PI / 180)).toFixed(3)} ${(C + mid * Math.sin(a * Math.PI / 180)).toFixed(3)}`;
    return `M${p(from)}A${mid} ${mid} 0 0 1 ${p(to)}`;
  };
  const [light, dark] = down ? [arc(15, 135), arc(195, 315)] : [arc(195, 315), arc(15, 135)];
  return `<svg viewBox="0 0 ${2 * R} ${2 * R}" width="${2 * R}" height="${2 * R}" aria-hidden="true">`
    + `<circle class="arc-out" cx="${C}" cy="${C}" r="${R}"/><circle class="arc-cap" cx="${C}" cy="${C}" r="${CAP}"/>`
    + `<path class="arc-hi" d="${light}" stroke-width="${RING}"/><path class="arc-lo" d="${dark}" stroke-width="${RING}"/>`
    + `<filter id="play-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>`
    + `<path class="arc-play" d="${play_triangle(C, 0.45 * CAP)}" filter="url(#play-soft)"/></svg>`;
};
const menu_arrow = (select) => { const arrow = el("span", { className: "labelmenu" }, select); arrow.insertAdjacentHTML("afterbegin", icon(`<path d="M3.25 4.75L6.25 7.75L9.25 4.75" ${sw(SLANT)}/>`, 12)); return arrow; };
const DAY_STEPS = [...Array.from({ length: 12 }, (_, h) => [h * 3600, String(h || 12), false]), [10 * 3600 + 10 * 60, "10:10", true]].sort((a, b) => a[0] - b[0]);
const SPEEDS = [1, 50, 750];
const frac = (x) => ((x % 1) + 1) % 1;
const PULSE_MOST = 6, PULSE_RISE = 0.03, PULSE_FLASH = 0.4;
const fmt_time = (t) => {
  t = ((Math.floor(t) % 43200) + 43200) % 43200;
  return [Math.floor(t / 3600) || 12, Math.floor(t / 60) % 60, t % 60].map((v, i) => (i ? String(v).padStart(2, "0") : v)).join(":");
};
function parse_time(text, pm_now = false) {
  const said = /([ap])\.?\s*m\.?\s*$/i.exec(String(text));
  if (said) text = String(text).slice(0, said.index);
  const p = String(text).split(/[:.\s]+/).map(Number);
  if (p.some((v) => !Number.isFinite(v))) return null;
  const pm = said ? said[1].toLowerCase() === "p" : p[0] >= 12 && p[0] < 24 ? true : p[0] === 24 || p[0] === 0 ? false : pm_now;
  return ((p[0] % 12) * 3600 + (p[1] || 0) * 60 + (p[2] || 0)) % 43200 + (pm ? 43200 : 0);
}

/** a label centred on its ink (Dial Tool's rule, ink.js): the words in a span moved by how far their ink's middle is
 *  from their box's middle */
function ink_label(button, text) {
  let span = button.querySelector(".ink");
  if (!span) { span = el("span", { className: "ink" }); button.replaceChildren(span); }
  if (span.textContent !== text) span.textContent = text;
  if (!span.isConnected) return;
  const [dx, dy] = ink_offset(text, getComputedStyle(span));
  span.style.setProperty("--ink-dx", dx + "px"); span.style.setProperty("--ink-dy", dy + "px");
}

export class Bar {
  /** host: { S, render(), zoom(k), fit(), tip(text) } */
  constructor(host) {
    this.host = host; this.S = host.S; this.playing = false; this.speed = 1;
    this.time_field = el("input", { id: "time", className: "time", type: "text", title: "Time shown, h:mm:ss" });
    if (document.fonts) document.fonts.ready.then(() => { this.time_zeros = null; this.sync_time(); this.set_speed(this.speed); });
    this.time_field.onchange = () => { const t = parse_time(this.time_field.value, this.S.t >= 43200); if (t !== null) this.set_time(t); else this.sync_time(); this.time_field.value = fmt_time(this.S.t); };
    this.half_button = el("button", { type: "button", id: "ampm", className: "half", title: "Morning or afternoon: an am · pm window follows it", onclick: () => this.set_time((this.S.t + 43200) % 86400) });
    this.date_button = el("button", { type: "button", id: "date", className: "date", title: "The day the dial shows: a window that follows the date shows it" });
    this.date_lines = [el("span"), el("span")];
    this.date_button.append(...this.date_lines);
    this.date_pick = el("input", { type: "date", id: "date-pick", className: "datepick", tabIndex: -1, ariaLabel: "The day the dial shows" });
    this.date_pick.onchange = () => { this.set_date(this.date_pick.value || ""); this.date_pop_sync(); };
    this.date_button.onclick = () => this.date_pop_open(!this.date_pop || this.date_pop.hidden);
    const time_box = el("span", { className: "timebox" }, el("span", { className: "timewell" }, this.time_field), this.half_button, el("span", { className: "datewell" }, this.date_button, this.date_pick, this.date_pop_box()));
    this.time_slider = el("input", { id: "time-slider", type: "range", min: 0, max: 43199, step: 1 });
    this.time_slider.oninput = () => this.set_time(+this.time_slider.value + this.half());
    this.play_button = el("button", { type: "button", className: "icon play", id: "play", onclick: () => this.play(!this.playing) });
    // how fast: three speeds on a pill (Okay, 20 Oct 2026, 23:59: "Remove speed slider, make a pill selector for 1x 50x 750x")
    this.speed_buttons = SPEEDS.map((k) => { const b = el("button", { type: "button", id: "speed-" + k, textContent: String(k), title: `Time runs ${k}× as fast` }); b.onclick = () => this.set_speed(k); return b; });
    this.speeds = el("span", { className: "speedpill", role: "radiogroup", ariaLabel: "How fast time runs" }, ...this.speed_buttons);
    const view = (id, title, inside, act) => { const b = el("button", { type: "button", className: "icon", id, title, ariaLabel: title, onclick: act }); b.innerHTML = icon(inside); return b; };
    const steps = el("div", { className: "steps12" });
    for (const [t, text, special] of DAY_STEPS) {
      const b = el("button", { type: "button", className: special ? "special" : "", textContent: text, title: special ? "10:10, the classic pose" : `${text} o’clock`, onclick: () => this.set_time(t + this.half()) });
      b.style.setProperty("--at", t / 43200);
      b.dataset.t = t;
      steps.append(b);
    }
    // the day under a finger or the pointer: a press that moves scrubs, one that doesn't goes to the nearest step
    const at_x = (x) => { const r = this.time_slider.getBoundingClientRect(), THUMB = 3; return Math.round(clamp((x - r.left - THUMB / 2) / (r.width - THUMB), 0, 1) * 43199); };
    let pressed = null;
    const scrub = (e) => { if (!pressed) return; if (Math.abs(e.clientX - pressed.x) > 3) pressed.moved = true; if (pressed.moved) this.set_time(at_x(e.clientX) + this.half()); };
    const day_strip = (strip) => {
      strip.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || e.target.closest(".steps12 button")) return;
        pressed = { x: e.clientX, id: e.pointerId, moved: false };
        strip.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      strip.addEventListener("pointermove", scrub);
      const up = (e) => {
        if (!pressed || e.pointerId !== pressed.id) return;
        if (!pressed.moved && e.type === "pointerup") { const t = at_x(e.clientX); this.set_time([...this.day_ticks, 10 * 3600 + 600].reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best)) + this.half()); }
        pressed = null;
      };
      strip.addEventListener("pointerup", up);
      strip.addEventListener("pointercancel", up);
    };
    this.needle = el("span", { className: "needle", ariaHidden: "true" });
    this.ruler = svg_el("svg");
    this.ruler.setAttribute("class", "ruler");
    this.ruler.setAttribute("aria-hidden", "true");
    this.day_ticks = DAY_STEPS.map((x) => x[0]);
    new ResizeObserver(() => this.draw_ruler()).observe(this.time_slider);
    const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
    const zoom_sign = el("span", { className: "zoomsign", tabIndex: 0, role: "note", ariaLabel: "How to zoom" });
    zoom_sign.title = touch ? "Pinch to zoom · drag moves the sun" : "⌘ + scroll zooms · drag moves the sun";
    zoom_sign.innerHTML = icon(FIND);
    this.day_box = el("div", { className: "group day" }, this.ruler, this.time_slider, steps, this.needle);
    day_strip(this.day_box);
    this.el = el("footer", { className: "bar" },
      el("div", { className: "lead" }, this.play_button, this.speeds, time_box,
        el("button", { type: "button", id: "now", textContent: "Now", title: "The time it is now", onclick: () => this.to_now() })),
      this.day_box);      // zoom stands on the canvas, bottom left (Okay, 20 Oct 2026, 23:46)
    this.set_speed(1);
    this.play_icon();
    // the time from the keyboard: ← → a minute, with ⇧ an hour; space plays or pauses (not while typing)
    document.addEventListener("keydown", (e) => {
      const at = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (at && at.closest && at.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const step = (e.shiftKey ? 3600 : 60) * (e.key === "ArrowLeft" ? -1 : 1);
        this.set_time(((this.S.t + step) % 86400 + 86400) % 86400);
        e.preventDefault();
      } else if (e.key === " " && !e.repeat) { this.play(!this.playing); e.preventDefault(); }
    });
    const loop = () => { this.frame(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  frame() {
    if (!this.playing) return;
    const [wall, t] = this.play_from;
    this.S.t = (t + (performance.now() - wall) / 1000 * this.speed) % 86400;
    this.sync_time();
    this.pulse(this.S.t, performance.now() / 1000);
    this.host.render("time");
  }

  to_now() { const d = new Date(); if (this.S.date) this.set_date(""); this.set_time(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000); }
  set_date(v) { this.S.date = v; this.sync_time(); this.host.render("time"); }

  date_pop_box() {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekday = el("span", { className: "popword weekday", id: "date-pop-weekday" });
    const shown = () => new Date(G.shown_day(this.S) + "T12:00:00");
    const put = (d) => this.set_date(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    const group = (name, set) => {
      const select = el("select", { id: "date-pop-" + name, ariaLabel: "The " + name });
      const word = el("span", { className: "popword" });
      select.onchange = () => { const d = shown(); set(d, +select.value); put(d); this.date_pop_sync(); };
      return { select, word, el: el("span", { className: "popgroup pop-" + name }, word, menu_arrow(select)) };
    };
    const day = group("day", (d, v) => d.setDate(v));
    const month = group("month", (d, v) => { const keep = d.getDate(); d.setDate(1); d.setMonth(v); d.setDate(Math.min(keep, new Date(d.getFullYear(), v + 1, 0).getDate())); });
    const year = group("year", (d, v) => { const keep = d.getDate(), m = d.getMonth(); d.setDate(1); d.setFullYear(v); d.setDate(Math.min(keep, new Date(v, m + 1, 0).getDate())); });
    MONTHS.forEach((m, i) => month.select.append(el("option", { value: i, textContent: m })));
    const step = (sign) => el("button", { type: "button", className: "popstep", innerHTML: sign < 0 ? STEP.minus : STEP.plus, ariaLabel: sign < 0 ? "A day earlier" : "A day later", onclick: () => this.step_day(sign) });
    this.date_pop = el("div", { className: "barpop datepop", id: "date-pop", hidden: true },
      el("div", { className: "popline" }, weekday, day.el, month.el, year.el, el("span", { className: "popsteps" }, step(-1), step(1))));
    this.date_pop.onkeydown = (e) => { if (e.key === "Escape") this.date_pop_open(false); };
    this.date_pop_sync = () => {
      if (!this.date_pop || this.date_pop.hidden) return;
      const d = shown(), y = d.getFullYear(), m = d.getMonth(), last = new Date(y, m + 1, 0).getDate();
      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      weekday.textContent = DAYS[d.getDay()];
      if (!weekday.style.width) {
        const pen = document.createElement("canvas").getContext("2d"), c = getComputedStyle(weekday);
        pen.font = `${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
        weekday.style.width = Math.ceil(Math.max(...DAYS.map((x) => pen.measureText(x).width))) + "px";
      }
      if (day.select.options.length !== last) day.select.replaceChildren(...Array.from({ length: last }, (_, i) => el("option", { value: i + 1, textContent: i + 1 })));
      if (+(year.select.options[0] || {}).value !== y - 50) year.select.replaceChildren(...Array.from({ length: 101 }, (_, i) => el("option", { value: y - 50 + i, textContent: y - 50 + i })));
      day.select.value = d.getDate(); month.select.value = m; year.select.value = y;
      day.word.textContent = d.getDate(); month.word.textContent = MONTHS[m]; year.word.textContent = y;
    };
    return this.date_pop;
  }
  date_pop_open(on) {
    this.date_pop.hidden = !on;
    this.date_button.setAttribute("aria-expanded", String(on));
    if (on) {
      this.date_pop_sync();
      if (this.date_pop_away) document.removeEventListener("pointerdown", this.date_pop_away, true);
      this.date_pop_away = (e) => { if (!this.date_pop.contains(e.target) && e.target !== this.date_button && !this.date_button.contains(e.target)) this.date_pop_open(false); };
      document.addEventListener("pointerdown", this.date_pop_away, true);
    } else if (this.date_pop_away) { document.removeEventListener("pointerdown", this.date_pop_away, true); this.date_pop_away = null; }
  }
  step_day(sign) {
    const d = new Date(G.shown_day(this.S) + "T12:00:00");
    d.setDate(d.getDate() + sign);
    this.set_date(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    this.date_pop_sync();
  }

  half() { return this.S.t % 86400 >= 43200 ? 43200 : 0; }

  sync_time() {
    if (this.date_pop_sync) this.date_pop_sync();
    const t12 = ((this.S.t % 43200) + 43200) % 43200;
    const [y, m, d] = G.shown_day(this.S).split("-");
    [d, m].forEach((v, i) => { if (this.date_lines[i].textContent !== v) this.date_lines[i].textContent = v; });
    this.date_button.classList.toggle("today", !this.S.date);
    this.date_button.ariaLabel = `Date ${d}/${m}/${y.slice(-2)}${this.S.date ? "" : ", today"}`;
    if (document.activeElement !== this.time_field) this.time_field.value = fmt_time(this.S.t);
    const zeros = this.time_field.value.replace(/[0-9]/g, "0");
    if (zeros !== this.time_zeros && this.time_field.isConnected) {
      this.time_zeros = zeros;
      const cs = getComputedStyle(this.time_field), pen = document.createElement("canvas").getContext("2d");
      pen.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      this.time_field.style.setProperty("--time-w", Math.ceil(pen.measureText(zeros).width + 1) + "px");      // the field as wide as its words, so its box's room is the same as the others'
      const [dx, dy] = ink_offset(zeros, cs);
      this.time_field.style.setProperty("--ink-dx", dx + "px");
      this.time_field.style.setProperty("--ink-dy", dy + "px");
    }
    if (document.activeElement !== this.time_slider || this.playing) this.time_slider.value = Math.floor(t12);
    this.place_needle(t12);
    for (const b of this.day_box.querySelectorAll(".steps12 button")) b.classList.toggle("on", Math.abs(+b.dataset.t - t12) < 0.5);
    const word = this.half() ? "PM" : "AM";
    if (this.half_button.textContent !== word) this.half_button.textContent = word;
  }

  set_time(t) {
    this.S.t = t;
    if (this.playing) this.play_from = [performance.now(), t];
    this.sync_time();
    this.host.render("time");
  }

  place_needle(t12 = ((this.S.t % 43200) + 43200) % 43200) {
    const n = this.needle, s = this.time_slider;
    if (!n || !n.isConnected || !s.clientWidth) return;
    const THUMB = 3, bar = n.closest(".bar");
    n.style.left = `${s.offsetLeft + THUMB / 2 + (s.clientWidth - THUMB) * t12 / 43200}px`;
    n.style.top = `${s.offsetTop}px`;
    n.style.height = `${bar.getBoundingClientRect().bottom - s.getBoundingClientRect().top}px`;
  }

  draw_ruler() {
    const W = this.time_slider.clientWidth, H = 22, THUMB = 3;
    if (!W) return;
    const hour = (W - THUMB) / 12;
    const minutes = [5, 10, 15, 30, 60].find((m) => hour / (60 / m) >= 7) || 60;
    const x = (t) => (THUMB / 2 + (W - THUMB) * t / 43200).toFixed(2);
    const lines = { hour: "", half: "", small: "" };
    this.day_ticks = [];
    for (let m = 0; m < 720; m += minutes) {
      const kind = m % 60 === 0 ? "hour" : m % 30 === 0 ? "half" : "small", h = { hour: 18, half: 12, small: 7 }[kind];
      lines[kind] += `M${x(m * 60)} ${(H - h) / 2}V${(H + h) / 2}`;
      this.day_ticks.push(m * 60);
    }
    this.place_needle();
    this.ruler.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.ruler.dataset.minutes = minutes;
    this.ruler.innerHTML = `<path class="line" d="M0 ${H / 2}H${W}"/>` + Object.entries(lines).map(([kind, d]) => `<path class="${kind}" d="${d}"/>`).join("")
      + `<path class="pose" d="M${x(36600)} 1V${H - 1}"/>`;
  }

  set_speed(k) {
    this.speed = k;
    if (this.playing) this.play_from = [performance.now(), this.S.t];
    this.speed_buttons.forEach((b, i) => { const on = SPEEDS[i] === k; ink_label(b, SPEEDS[i] + (on ? "X" : "")); b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); });
  }

  pulse(t, now = 0) {
    let cap = 0, tri = 0;
    const slow = this.speed < 1;
    if (this.playing && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const beat = G.BEATS[this.S.ha_beat] ? G.BEATS[this.S.ha_beat][1] : 0, rate = beat || 0.5, most = Math.max(beat, PULSE_MOST);
      const f = rate * this.speed <= most ? frac(t * rate) : frac(now * most);
      if (beat > 0) {
        cap = (1 - f) ** 3;
        const h = Math.min(1, (slow ? f / this.speed : f) / PULSE_FLASH);
        tri = h < PULSE_RISE ? 0.5 - 0.5 * Math.cos(Math.PI * h / PULSE_RISE) : (1 - (h - PULSE_RISE) / (1 - PULSE_RISE)) ** 2;
      } else {
        cap = 0.5 - 0.5 * Math.cos(2 * Math.PI * (slow ? frac(now * rate) : f)); tri = cap ** 3;
      }
    }
    this.play_button.classList.toggle("slow", this.playing && slow);
    this.play_button.style.setProperty("--pulse", cap.toFixed(3));
    this.play_button.style.setProperty("--pulse-tri", tri.toFixed(3));
  }

  play(on) {
    this.playing = on;
    if (!on) this.pulse(0);
    this.play_from = [performance.now(), this.S.t];
    this.play_icon();
    this.host.render("time");
  }

  play_icon() {
    this.play_button.innerHTML = ARCADE(this.playing);
    this.play_button.setAttribute("aria-pressed", String(this.playing));
    this.play_button.title = this.play_button.ariaLabel = this.playing ? "Pause" : "Play";
  }
}
