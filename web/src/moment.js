// moment.js — the complications' engine (build list #346, mechanism first; Okay's notes 2, 18 Oct 2026:
// "Complications, systematized: the four (date, day, am · pm, moon) working, with five languages of months built in for
// example; their discs obey physics or not"). Answers of 18 Oct, 19:02 ("common sense wins"): the five languages are
// EN · TR · DE · FR · IT.
//
// One moment — a calendar day and a time of day — is what every complication reads, as a movement's date wheel, day
// star and moon disc all turn from one train. From it: the day of the month, the weekday, the month, AM or PM, the
// moon's age. Each complication is a disc under the plate turning past its window: how many places it has, and how far
// it is turned for this moment, are here too, so a drawing of the disc and the text in the window always agree.
//
// Pure functions, no window: test/moment.mjs checks them against known dates. Nothing in the tool calls this yet —
// the window and the bar take it up when their design is drawn (build list #346).

export const LANGS = ["en", "tr", "de", "fr", "it"];

// what a watch prints: weekdays and months short, in capitals, as day and month wheels carry them (a German wheel
// has two letters; the others three, French and Italian as their makers abbreviate). Monday first (ISO), so Sunday is 6.
export const NAMES = {
  en: { days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    day_names: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], month_names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
  tr: { days: ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"], months: ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"],
    day_names: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"], month_names: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] },
  de: { days: ["MO", "DI", "MI", "DO", "FR", "SA", "SO"], months: ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"],
    day_names: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"], month_names: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"] },
  fr: { days: ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"], months: ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"],
    day_names: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"], month_names: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] },
  it: { days: ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"], months: ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"],
    day_names: ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"], month_names: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"] },
};

/** a day window's seven names, Monday first: short as a day wheel prints them (form 0), or in full (form 1; Okay, 24 Oct
 *  2026: "Days of the week option to be written in full"), in the language's own capitals (Turkish keeps its dotted İ). */
export const DAY_FORMS = ["Short", "Full"];
export function day_list(lang = "en", form = 0) {
  const N = NAMES[lang] || NAMES.en;
  return form === 1 ? N.day_names.map((d) => d.toLocaleUpperCase(lang)) : N.days;
}

export const SYNODIC = 29.530588853;               // a lunation in days (mean)

/** a moment from a calendar day ("2026-10-17") and the seconds since midnight (the tool's S.t). The day is a civil day
 *  with no time zone: the dial shows what a watch set to it shows. → {y, m, d, wd, h, min, s, pm, moon} — m 1–12,
 *  d 1–31, wd 0 (Monday) … 6 (Sunday), h 0–23, pm true from noon, moon the age in days (0 new · ~14.8 full). */
export function moment(day, t) {
  const [y, m, d] = String(day).split("-").map((v) => parseInt(v, 10));
  const secs = ((Math.floor(t) % 86400) + 86400) % 86400;
  const ms = Date.UTC(y, m - 1, d) + secs * 1000;
  const at = new Date(ms);
  return { y: at.getUTCFullYear(), m: at.getUTCMonth() + 1, d: at.getUTCDate(), wd: (at.getUTCDay() + 6) % 7,
    h: Math.floor(secs / 3600), min: Math.floor(secs / 60) % 60, s: secs % 60, pm: secs >= 43200, moon: moon_age(ms) };
}

/** the moon's age in days at a time (ms since 1970, UT): how far the moon has gone round from the sun, as a part of a
 *  lunation. Both longitudes from their few largest terms (Meeus, *Astronomical Algorithms*, ch. 25 and 47, shortened):
 *  within a few hours of the true phase — the mean lunation alone is off by up to a day and a half. */
export function moon_age(ms) {
  const d = (ms - Date.UTC(2000, 0, 1, 12)) / 86400000, r = Math.PI / 180, sin = (deg) => Math.sin(deg * r);
  const Ms = 357.5291 + 0.98560028 * d;                        // the sun's mean anomaly
  const sun = 280.4665 + 0.98564736 * d + 1.915 * sin(Ms) + 0.020 * sin(2 * Ms);
  const L = 218.3165 + 13.17639648 * d, Mm = 134.9634 + 13.06499295 * d, D = 297.8502 + 12.19074912 * d, F = 93.272 + 13.22935024 * d;
  const moon = L + 6.289 * sin(Mm) - 1.274 * sin(Mm - 2 * D) + 0.658 * sin(2 * D) + 0.214 * sin(2 * Mm) - 0.186 * sin(Ms) - 0.114 * sin(2 * F) + 0.059 * sin(2 * Mm - 2 * D) + 0.057 * sin(2 * D - Ms - Mm) + 0.053 * sin(Mm + 2 * D) + 0.046 * sin(2 * D - Ms) + 0.041 * sin(Mm - Ms);
  const elongation = (((moon - sun) % 360) + 360) % 360;
  return elongation / 360 * SYNODIC;
}

/** what a complication's window shows for a moment: the date's number, the weekday's or the month's short name in a
 *  language, AM or PM. The moon shows a picture: its age is in the moment. */
export function window_text(kind, mo, lang = "en", form = 0) {
  const N = NAMES[lang] || NAMES.en;
  if (kind === "date" || kind === "big date") return String(mo.d);
  if (kind === "day") return day_list(lang, form)[mo.wd];
  if (kind === "month") return N.months[mo.m - 1];
  if (kind === "am · pm") return mo.pm ? "PM" : "AM";
  return "";
}

// each complication's disc: how many places it carries round its turn. A date wheel 31, a day star 7 (a bilingual
// wheel 14: two languages alternating), a month 12, AM/PM 2 (a day and a night half), a moon disc two moons in 59
// teeth — 29.5 days each.
export const DISC_PLACES = { date: 31, day: 7, month: 12, "am · pm": 2, "moon phase": 59 };

/** which place of its disc stands in the window for a moment (0 = the first: 1, Monday, January, AM, new moon). */
export function disc_place(kind, mo) {
  if (kind === "date") return mo.d - 1;
  if (kind === "day") return mo.wd;
  if (kind === "month") return mo.m - 1;
  if (kind === "am · pm") return mo.pm ? 1 : 0;
  if (kind === "moon phase") return Math.floor(mo.moon / SYNODIC * 29.5 * 2) % 59;
  return 0;
}

/** how far the disc is turned, in degrees clockwise, so that place p stands under a window at clock angle `at`: the
 *  disc's place 0 is drawn at 12, each next one a step clockwise. A disc turns the other way to bring the next place
 *  under the window, as a real date wheel does. */
export function disc_turn(kind, mo, at = 0) {
  const n = DISC_PLACES[kind] || 1;
  return (((at - disc_place(kind, mo) * 360 / n) % 360) + 360) % 360;
}

/** physics (#346: "their discs obey physics or not, chosen by the user (a ring bigger than the dial is outside physics,
 *  useful for e-watch faces)"): a disc under the plate, turning on the dial's centre, must end inside the case — its
 *  outer edge within the dial's radius less a rim. Its window shows a band of it: the band's outer edge is where the
 *  window's far side is. → {fits, outer, room} in mm; with physics off, everything fits. */
export function disc_fits(window_r, window_h, dial_d, { physics = true, rim = 0.5 } = {}) {
  const outer = window_r + window_h / 2, room = dial_d / 2 - rim;
  return { fits: !physics || outer <= room, outer, room };
}
