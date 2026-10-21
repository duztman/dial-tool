# Font research, 16 Oct 2026

*Written 16 Oct 2026, night, by the Claude session that did the research with Okay. For the next agent. Nothing in `web/` was changed by it. The draft tiers are in [`font-tiers-2026-10-16.md`](font-tiers-2026-10-16.md).*

## 1 · Where it stands

- Okay asked for a long list of open-licence fonts that suit dial numerals, to improve the font sheet's list (`web/fonts.mjs`: 20 families, 21 with Inter, since Rubik joined on 15 Oct).
- Two sources were searched and voted on by Okay, page by page: **Font Picks** (92 candidate families, mostly Google Fonts; **49 yes, 43 no**) and **Peter Wiegel's CAT Fonts** (peter-wiegel.de, 337 families; narrowed in five passes to **46**).
- **Both lists are locked** (Okay, 16 Oct: "46 accepted, wiegel collection locked… Our earlier selection? All in."). That is 95 accepted fonts. Claude's reading: *our earlier selection* = Font Picks' 49 yeses.
- They are held in **tiers**, not added to the list yet. The first draft is top 21 · middle 50 · bottom 14 (85 Latin-numeral fonts), with the 10 non-Latin numeral fonts parked.
- **Waiting on Okay:** do the top fonts join the 21 already in the list, or compete with them for about 20 seats? (`docs/brief.md` §5, question 13; build list #313.) Until he answers, don't touch `web/fonts.mjs`.

## 2 · What Okay decided on 16 Oct

| Question | His answer | So |
|---|---|---|
| The list is kept at 20 (11 Oct) and 95 fonts are accepted. What happens to the cap? | "Tiers, top ~20 in the picker" (Claude's reading of *picker*: the font sheet's list) | Top tier is the list; middle and bottom are accepted but held back. Join or compete is still open. |
| Syncopate is Apache 2.0, not OFL. | "Keep, credit Apache 2.0" | Stays (middle tier). Needs its licence text and a credit line; see §7. |
| Write the notes into the repo? | "Yes, side branch" | This file, on `notes/font-roster`. Nothing on `dev` or `main`; no pull request. |
| Non-Latin numeral fonts as fallback faces (build list #15, #52) | "Fallback set is a good idea but not necessary, we run on fonts." | Parked. Not dropped: #15 and #52 stay open. The 10 fonts are kept on the list, outside the tiers. |

## 3 · How the two lists were made

Each step was a page Okay worked in; the marks he made are saved in that page's own database (the claude.ai pages are private to him). Counts are the final ones.

| Step | Page | What he did | Result |
|---|---|---|---|
| Font Picks | Font Picks | Yes or No on 92 candidate families | 49 yes, 43 no |
| Wiegel catalogue | Wiegel Fonts | Yes or No on all 337 families, number fonts first | 140 yes, 197 no |
| Review | Font Review | A page built to weed near-duplicates across both lists (Keep or Drop). Nothing was marked on it when last read; the comparing moved to the Compare page | none |
| Winners | Wiegel Winners | The 140 yeses grouped by style and era | 92 win, 47 out, 1 unmarked |
| Second Pass | Wiegel Second Pass | Finalists settled by rule: a 4 with an open, wide gap, or an open 9. Licence-flagged fonts and Amazonas removed. The rest marked Finalist or Out | 22 settled + 53 to review; 7 Out |
| Compare | Wiegel Compare | 68 fonts in one list ordered by measured shape similarity, at one digit height; Pass or Fail each | 49 pass, 19 fail |
| Finals | Wiegel Finals | The 49 as dials; Fail what should go | 3 fail (CAT Arena, Doergon, Symphony): **46** |

## 4 · Licences

- **Wiegel's site states a licence per download.** Of the 337 families: 260 carry the SIL OFL 1.1 (some with a GPL font exception), 2 a free-software licence, 27 Creative Commons (several conflicting, e.g. BY 3.0 with BY-NC-SA), 35 personal use only (mostly Dieter Steffmann originals he extended), 13 none stated. Stefans Uhr, flagged for proprietary OpenType code, was kept out too.
- **Only OFL and free-software fonts were allowed through** to the final stages. The 46 are 45 OFL and one free-software font (GL-Nummernschild; its licence text must go with it).
- **Build list #58 is answered:** the three DIN 1451 archives (alte DIN 1451 Mittelschrift, DIN 1451 Breitschrift 1936, DIN 1451 Form H) are all OFL 1.1 with Reserved Font Names, so passing them on is allowed. Alte DIN 1451 and DIN 1451 fette Breitschrift are in the accepted lists; Form H (a stencil) did not make it through the later passes.
- **Reserved Font Names:** the OFL says a modified version may not use the reserved name, and subsetting a font is generally treated as modifying it (read the OFL's own FAQ). The tool ships whole files, so this holds as things stand. If anyone subsets a font for size, read its `OFL.txt` for a Reserved Font Name line first.
- **Syncopate** (Font Picks) is Apache 2.0. `web/fonts/README.md` says every family is OFL, and `web/fonts.mjs` builds `ofl/` URLs and fetches `OFL.txt`. See §7.
- The Font Picks yeses are otherwise all OFL 1.1.

## 5 · How the shapes were measured

Both were done on 16 Oct to give Okay something to compare, not as a ranking.

- **Numeral shapes** (Wiegel only): the 4 closed, open with a hairline gap, open, or open with a wide gap (over 12 % of the digit's height); the 6 and 9 the same way; the 2 flat, angular, curved or looped; the 0 plain, open or slashed. Patterned or dotted fonts were marked *decor* because the measure is unreliable there.
- **Similarity** between two fonts: every digit, capital and lowercase letter both have (at least 14, or the ten digits for a digits-only font) is drawn at the same cap height, blurred slightly, and compared as a zero-mean cosine, taking the best of five stroke-weight shifts so a bold and a regular of the same design still match. The mean over the shared glyphs is the score; 100 % = the same drawing. 93 % and over is near-identical, about 90 % a close cousin (the tiers treat 90 % as covered), about 85 % a looser relative; blackletters score lower against each other, so 87 % counts there.
- **A bug, found and fixed the same night:** the weight shift eroded hairline fonts to nothing, so nine of them (Vis-A-Vis, Symphony, Rudelskopf, Tartlers, Bernardo Moda Contrast, Lucian Schönschrift, Youbilee, Kabinett-Fraktur, Tiraspol) scored zero against everything. The Compare, Finals and tier numbers use the fixed measure. The "Closest" lines on the earlier pages (Review, Winners, Second Pass) do not.

## 6 · The locked lists

**Wiegel, 46** (his page is `https://www.peter-wiegel.de/<id>.html`; in the Compare order, neighbours alike): Youlilee (`youbilee`), Bernardo Moda Contrast (`BernardoContrast`), Lucian Schönschrift (`LucianSchoen`), Rundkursiv (`Rundkursiv`), CAT Kurier (`CATKurier`), Göschen Fraktur (`GoeschenFraktur`), Koch-Fraktur (`KochFraktur`), Apollo (`Apollo`), Böcklins Universe (`Boecklin`), Standard Graf (`StandardGraf`), CAT STACK (`CAT_STACK`), Xayax (`Xayax`), Astrud (`Astrud`), Berliner Wand (`BerlinerWand`), Stage (`Stage`), Nürnberg (`Nuernberg`), Immermann (`Immermann`), TGL 0-16 (DIN 16) - TGL 0-17 (DIN 17) (`TGL_0-16`), GL-Nummernschild (`GL_Nummernschild`, free software), Sowjetschablone (`SowjetSchablone`), Varieté (`Variete`), Sylvar (`Sylvar`), Tiraspol Trolley (`Tiraspol`), Rundgotisch Rauh (`Rundgotisch`), Rundspruch (`Rundspruch`), CAT Rhythmus (`CATRhythmus`), Omega CAT (`Omega`), Dante (`Dante`), Preussische VI 9 (`PreussischeVI9`), Alte DIN 1451 Mittelschrift (`alteDin1451`), CAT Robertson (`CAT_Robertson`), Isar CAT (`Isar`), CAT DyFa (`CAT_DyFa`), CAT Eckmann (`eckmann`), Teutonic (`Teutonic`), CAT Childs (`CATChilds`), Fette Bauersche Antiqua (`FetteBauer`), Wattauchimma (`Wattauchimma`), CentreClaws (`CentreClaws`), Erika Type (`ErikaType`), Peter Obscure (`PeterObscure`), Eyechart (`Eyechart`), DIN 1451 fette Breitschrift (`DinBreit`), CAT North (`CATNorth`), CAT Linz (`CATLinz`), Tartlers End (`Tartlers`).

**Font Picks, 49** (39 with Latin numerals): Aboreto (`aboreto`), Anta (`anta`), Anton (`anton`), Anybody (`anybody`), Audiowide (`audiowide`), Bebas Neue (`bebas`), Big Shoulders Display (`bigshoulders`), Black Ops One (`blackops`), Libre Caslon Display (`caslondisplay`), Cinzel (`cinzel`), Cooper Hewitt (`cooperhewitt`), Courier Prime (`courierprime`), D-DIN (`d-din`), Forum (`forum`), Gilda Display (`gilda`), Italiana (`italiana`), Julius Sans One (`juliussans`), Krona One (`kronaone`), League Gothic (`leaguegothic`), Limelight (`limelight`), Major Mono Display (`majormono`), Marcellus (`marcellus`), Martian Mono (`martianmono`), Pathway Extreme (`pathwayextreme`), Public Sans (`publicsans`), Quantico (`quantico`), Railway Sans (`railway`), Science Gothic (`sciencegothic`), Sirin Stencil (`sirin`), Six Caps (`sixcaps`), Sometype Mono (`sometype`), Space Grotesk (`spacegrotesk`), Staatliches (`staatliches`), Stardos Stencil (`stardos`), Syncopate (`syncopate`, Apache 2.0), Tenor Sans (`tenorsans`), Tourney (`tourney`), Unica One (`unicaone`), Zen Dots (`zendots`).

**Parked, non-Latin numeral fonts (10)**: Reem Kufi (`num_arab`), Noto Sans Bengali (`num_bn`), Noto Sans Devanagari (`num_dev`), Vazirmatn (`num_fa`), Noto Sans Indic Siyaq Numbers (`num_ind`), Noto Sans Mayan Numerals (`num_may`), Noto Serif Ottoman Siyaq (`num_ott`), Noto Sans Tamil (`num_ta`), Kanit (`num_th`), Noto Serif SC (`num_zh`).

## 7 · If you build the tiers into the font sheet

Wait for Okay's answer to question 13 first. Then:

1. **Add a line to `FAMILIES` in `web/fonts.mjs`** for each chosen font, run it, then `build.mjs` (the file's own header says how). The files are committed, so the page never depends on another site staying as it is.
2. **Wiegel's fonts are not on Google Fonts.** Each is a zip at `https://www.peter-wiegel.de/Fonts/<zip>`; the zip name is in the font's own page. Fetch once, keep the one font file and the licence text from the zip in `web/fonts/` and `web/fonts/licences/`. `fonts.mjs` has two sources today (`google`, `routed`); a third for his zips, or the files added by hand with a README line, are the two ways.
3. **Syncopate** lives under `apache/syncopate` in `github.com/google/fonts`, not `ofl/` (check the path before fetching), with a `LICENSE.txt`. The `google` source builds `ofl/` paths and asks for `OFL.txt`, and `web/fonts/README.md` says all fonts are OFL: both need a line for the exception. Apache 2.0 asks for the licence text and a credit.
4. **GL-Nummernschild** (free software): copy its licence text.
5. **Old-style figures by default:** Bernardo Moda Contrast, Lucian Schönschrift (Wiegel), Italiana and Libre Caslon Display (Font Picks). The numerals ring shows what the font gives, unless a lining-figures feature is switched on where the font has one.
6. **File sizes** in the tier tables are whole files. CAT Linz is 1.2 MB (bottom tier); Science Gothic 2.6 MB (bottom). Digit-only subsets are a few KB, with the Reserved Font Names caution in §4.
7. After any change in `web/`: the checks in CLAUDE.md (`npm test`, look at `web/test/out/`) and the font README.

## 8 · What is and is not kept

- **In this repo:** these two files, plus the rows in `docs/decisions.md` and brief §5 and `docs/build-list.md` #313.
- **Not in the repo:** the working files. They were in the research session's temporary folder and are gone with it: the scraped pages and zips, the extracted fonts, the measurement scripts, the per-font numbers. Okay has a data bundle (`wiegel-project-data.zip`: the families, licences, numeral shapes, style groups, votes and scripts; no font files) for a separate project, a standalone Wiegel font finder. It is not part of this repo. The lists in §6 are the durable record of what was chosen.
- **The claude.ai pages** keep the marks Okay made on each step; they are private to him.
