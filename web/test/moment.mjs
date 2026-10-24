// test/moment.mjs — the complications' engine (src/moment.js, #346) against known dates. Run by npm test.
import { moment, moon_age, window_text, disc_place, disc_turn, disc_fits, NAMES, LANGS, DISC_PLACES } from "../src/moment.js";

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? "ok  " : "FAIL"}  ${what}`); if (!ok) failed++; };

// 17 Oct 2026 is a Saturday; 10:09:36 is the tool's starting time
const a = moment("2026-10-17", 10 * 3600 + 9 * 60 + 36);
check(a.y === 2026 && a.m === 10 && a.d === 17 && a.wd === 5 && a.h === 10 && a.min === 9 && a.s === 36 && !a.pm, `17 Oct 2026, 10:09:36: Saturday, AM (${JSON.stringify(a)})`);
check(moment("2024-02-29", 13 * 3600).wd === 3 && moment("2024-02-29", 13 * 3600).pm, "29 Feb 2024 is a Thursday; 13:00 is PM");
check(moment("2026-01-01", 86400 + 60).d === 1, "a time past midnight wraps within the day (the tool's day is one day)");
{ const sat = moment("2026-10-17", 0), pm = moment("2026-10-17", 13 * 3600);
  const full = window_text("day", sat, "tr", 1), own = window_text("day", sat, "en", 2, ["", "", "", "", "", "Cumartesi!", ""]), blank = window_text("day", sat, "fr", 2, null);
  check(full === "CUMARTESİ" && own === "Cumartesi!" && blank === "SAM" && window_text("am · pm", pm, "en", 0, ["sabah", "akşam"]) === "akşam" && window_text("am · pm", sat, "en", 0, null) === "AM",
    `day names in full, in the language's own capitals (${full}); your own seven, a blank one the short name (${own} · ${blank}); an am · pm window's own two words (#515, #516)`); }

// the moon: the new moon of the total eclipse, 8 Apr 2024, 18:21 UT; the full moon of 18 Sep 2024, 02:34 UT (a partial lunar eclipse)
const eclipse = moon_age(Date.UTC(2024, 3, 8, 18, 21)), full = moon_age(Date.UTC(2024, 8, 18, 2, 34));
check(Math.min(eclipse, 29.53 - eclipse) < 0.3, `8 Apr 2024's eclipse is a new moon (age ${eclipse.toFixed(2)})`);
check(Math.abs(full - 14.77) < 0.3, `18 Sep 2024 is a full moon (age ${full.toFixed(2)})`);

// the windows' words, in every language
check(window_text("date", a) === "17" && window_text("day", a) === "SAT" && window_text("day", a, "tr") === "CMT" && window_text("day", a, "de") === "SA" && window_text("day", a, "fr") === "SAM" && window_text("day", a, "it") === "SAB" && window_text("month", a, "tr") === "EKİ" && window_text("am · pm", a) === "AM",
  "date 17 · SAT · CMT · SA · SAM · SAB · EKİ · AM");
check(LANGS.every((l) => NAMES[l].days.length === 7 && NAMES[l].months.length === 12 && NAMES[l].day_names.length === 7 && NAMES[l].month_names.length === 12), "five languages, seven days and twelve months each");

// the discs: the place under the window, and the turn that puts it there
check(disc_place("date", a) === 16 && disc_place("day", a) === 5 && disc_place("am · pm", a) === 0, "the date disc shows its 17th place, the day disc its 6th, AM its first");
check(Math.abs(disc_turn("date", a, 90) - ((90 - 16 * 360 / 31 + 360) % 360)) < 1e-9 && disc_turn("day", moment("2026-10-12", 0), 0) === 0, "a disc turns so its place stands under the window (Monday's under 12 with no turn)");
check(DISC_PLACES["moon phase"] === 59 && disc_place("moon phase", moment("2024-09-18", 2 * 3600 + 34 * 60)) >= 28 && disc_place("moon phase", moment("2024-09-18", 2 * 3600 + 34 * 60)) <= 31, "the moon disc: two moons in 59 teeth, a full moon near its 30th");

// physics: a disc under a 30 mm dial
check(disc_fits(10.5, 2, 30).fits && !disc_fits(14.5, 2, 30).fits && disc_fits(14.5, 2, 30, { physics: false }).fits, "physics: a window band ending past the case is refused, unless physics is off");

console.log(failed ? `Moment: ${failed} failed.` : "Moment: passed.");
process.exit(failed ? 1 : 0);
