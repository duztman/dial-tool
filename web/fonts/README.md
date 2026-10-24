# Fonts that come with the web version

Open-licence fonts the web version offers in its font list. All are under the SIL Open Font Licence 1.1,
which allows passing them on with their licence — but one: GL-Nummernschild is Gutenberg Labo's free-software font
("unlimited permission is granted to use, copy, and distribute it, with or without modification"; its licence is only in
the font's own name table, copied into `licences/`). Each family's own licence file, with its copyright line, is in `licences/`.
Taken from github.com/google/fonts (folder `ofl/`) and github.com/dse/routed-gothic on 11 Oct 2026, and on 17 Oct 2026
(the font research's top tier, `docs/font-tiers-2026-10-16.md`) from google/fonts again, from Peter Wiegel's zips at
peter-wiegel.de, and — D-DIN — from github.com/amcchord/datto-d-din, a copy of Datto's own `D-DIN_complete.zip` (Datto's
page is not reachable from a session); unchanged, only renamed (`Jost[wght].ttf` → `Jost-wght.ttf`, spaces to dashes).
On 24 Oct 2026 (#501) the middle tier's and the non-Latin numeral fonts that are on google/fonts joined (`apache/` for
Syncopate). Most carry Reserved Font Names: a file is passed on whole, never subset (docs/font-research-2026-10-16.md §4)
— but one: Noto Serif SC (25 MB whole, OFL with no Reserved Font Name) is cut to the characters a dial uses (`SUBSET` in
`web/fonts.mjs`: Latin, digits, Chinese numerals and the date's words).
Inter, the page's stand-in font, is packed inside the page itself (also OFL). The list is written by `web/fonts.mjs`.

| Family | Files | Copyright | Licence |
|---|---|---|---|
| Arimo | `Arimo-wght.ttf` | Copyright 2026 The Arimo Project Authors (https://github.com/googlefonts/arimo) | [licence](licences/Arimo-OFL.txt) |
| Archivo | `Archivo-wdth-wght.ttf` | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | [licence](licences/Archivo-OFL.txt) |
| Barlow | `Barlow-Regular.ttf` `Barlow-Medium.ttf` `Barlow-SemiBold.ttf` `Barlow-Bold.ttf` | Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow) | [licence](licences/Barlow-OFL.txt) |
| Barlow Condensed | `BarlowCondensed-Regular.ttf` `BarlowCondensed-Medium.ttf` `BarlowCondensed-SemiBold.ttf` | Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow) | [licence](licences/BarlowCondensed-OFL.txt) |
| Overpass | `Overpass-wght.ttf` | Copyright 2021 The Overpass Project Authors (https://github.com/RedHatOfficial/Overpass) | [licence](licences/Overpass-OFL.txt) |
| B612 | `B612-Regular.ttf` `B612-Bold.ttf` | Copyright 2012 The B612 Project Authors (https://github.com/polarsys/b612) | [licence](licences/B612-OFL.txt) |
| Routed Gothic | `routed-gothic.ttf` `routed-gothic-narrow.ttf` `routed-gothic-wide.ttf` | Copyright (c) 2017, Darren Embry (<https://webonastick.com/>), with | [licence](licences/RoutedGothic-OFL.txt) |
| Jost | `Jost-wght.ttf` | Copyright 2020 The Jost Project Authors (https://github.com/indestructible-type) | [licence](licences/Jost-OFL.txt) |
| Josefin Sans | `JosefinSans-wght.ttf` | Copyright 2010 The Josefin Sans Project Authors (https://github.com/ThomasJockin/JosefinSansFont-master), with Reserved Font Name "Josefin Sans". | [licence](licences/JosefinSans-OFL.txt) |
| Montserrat | `Montserrat-wght.ttf` | Copyright 2024 The Montserrat.Git Project Authors (https://github.com/JulietaUla/Montserrat.git) | [licence](licences/Montserrat-OFL.txt) |
| Rubik | `Rubik-wght.ttf` | Copyright 2015 The Rubik Project Authors (https://github.com/googlefonts/rubik) | [licence](licences/Rubik-OFL.txt) |
| Oswald | `Oswald-wght.ttf` | Copyright 2016 The Oswald Project Authors (https://github.com/googlefonts/OswaldFont) | [licence](licences/Oswald-OFL.txt) |
| Antonio | `Antonio-wght.ttf` | Copyright 2013 The Antonio Project Authors (https://github.com/googlefonts/antonioFont) | [licence](licences/Antonio-OFL.txt) |
| Michroma | `Michroma-Regular.ttf` | Copyright 2011 The Michroma Project Authors (https://github.com/googlefonts/Michroma-font) | [licence](licences/Michroma-OFL.txt) |
| Saira | `Saira-wdth-wght.ttf` | Copyright 2020 The Saira Project Authors (https://github.com/Omnibus-Type/Saira) | [licence](licences/Saira-OFL.txt) |
| Bodoni Moda | `BodoniModa-opsz-wght.ttf` | Copyright 2020 The Bodoni Moda Project Authors (https://github.com/indestructible-type/Bodoni) | [licence](licences/BodoniModa-OFL.txt) |
| Playfair Display | `PlayfairDisplay-wght.ttf` | Copyright 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name "Playfair Display" | [licence](licences/PlayfairDisplay-OFL.txt) |
| Cormorant | `Cormorant-wght.ttf` | Copyright 2015 the Cormorant Project Authors (github.com/CatharsisFonts/Cormorant) | [licence](licences/Cormorant-OFL.txt) |
| Poiret One | `PoiretOne-Regular.ttf` | Copyright 2011 The Poiret One Project Authors (https://github.com/alexeiva/poiretone) | [licence](licences/PoiretOne-OFL.txt) |
| Allerta Stencil | `AllertaStencil-Regular.ttf` | Copyright (c) 2010, Matt McInerney (matt@pixelspread.com), | [licence](licences/AllertaStencil-OFL.txt) |
| Anybody | `Anybody-wdth-wght.ttf` | Copyright 2020 The Anybody Project Authors (https://github.com/Etcetera-Type-Co/Anybody) | [licence](licences/Anybody-OFL.txt) |
| Bebas Neue | `BebasNeue-Regular.ttf` | Copyright © 2010 by Dharma Type. | [licence](licences/BebasNeue-OFL.txt) |
| Cinzel | `Cinzel-wght.ttf` | Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) | [licence](licences/Cinzel-OFL.txt) |
| Italiana | `Italiana-Regular.ttf` | Copyright (c) 2011, Santiago Orozco (hi@typemade.mx), with Reserved Font Name "Italiana". | [licence](licences/Italiana-OFL.txt) |
| Marcellus | `Marcellus-Regular.ttf` | Copyright (c) 2012, Brian J. Bonislawsky DBA Astigmatic (AOETI) (astigma@astigmatic.com), with Reserved Font Names "Marcellus" | [licence](licences/Marcellus-OFL.txt) |
| Public Sans | `PublicSans-wght.ttf` | Copyright 2015 The Public Sans Project Authors (https://github.com/uswds/public-sans) | [licence](licences/PublicSans-OFL.txt) |
| Sometype Mono | `SometypeMono-wght.ttf` | Copyright 2018 The Sometype Mono Project Authors (https://github.com/googlefonts/sometype-mono) | [licence](licences/SometypeMono-OFL.txt) |
| Space Grotesk | `SpaceGrotesk-wght.ttf` | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | [licence](licences/SpaceGrotesk-OFL.txt) |
| Tourney | `Tourney-wdth-wght.ttf` | Copyright 2020 The Tourney Project Authors (https://github.com/Etcetera-Type-Co/Tourney) | [licence](licences/Tourney-OFL.txt) |
| Unica One | `UnicaOne-Regular.ttf` | Copyright 2012 The Unica One Project Authors (https://github.com/etunni/unica) | [licence](licences/UnicaOne-OFL.txt) |
| D-DIN | `D-DIN.ttf` `D-DIN-Bold.ttf` `D-DINCondensed.ttf` `D-DINExp.ttf` | Copyright (C) 2017 Datto Inc. https://www.datto.com/fonts/d-din, | [licence](licences/D-DIN-OFL.txt) |
| Alte DIN 1451 Mittelschrift | `din1451alt.ttf` | Copyright (c) 2017, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/AlteDIN1451Mittelschrift-OFL.txt) |
| Apollo | `ApolloASM.ttf` | Copyright (c) 2010, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/Apollo-OFL.txt) |
| Bernardo Moda Contrast | `Bernardo-Moda-contrast.ttf` | Copyright (c) 2017, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/BernardoModaContrast-OFL.txt) |
| CAT DyFa | `CAT_DyFa.ttf` | Copyright (c) 2015, CAT-Fonts, Peter Wiegel (http://www.catfonts.de | wiegel@peter-wiegel.de), | [licence](licences/CATDyFa-OFL.txt) |
| CAT Kurier | `CATKurier.ttf` | Copyright (c) 2015, CAT-Fonts, Peter Wiegel (http://www.catfonts.de | wiegel@peter-wiegel.de), | [licence](licences/CATKurier-OFL.txt) |
| Erika Type | `Erika-Type.ttf` `Erika-Type_B.ttf` | Copyright (c) 2009, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/ErikaType-OFL.txt) |
| GL-Nummernschild | `GL-Nummernschild-Mtl.ttf` `GL-Nummernschild-Eng.ttf` | (C)2009-2011 Gutenberg Labo, All rights reserved. http://gutenberg.sourceforge.jp/ | [licence](licences/GL-Nummernschild-free-software.txt) |
| Immermann | `immermann.ttf` | Copyright (c) 2012, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/Immermann-OFL.txt) |
| Koch-Fraktur | `Koch-Fraktur_UNZ1A.ttf` | Copyright (c) 2009, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/Koch-Fraktur-OFL.txt) |
| TGL 0-16 | `TGL-0-16.ttf` `TGL-0-17.ttf` | Copyright (c) 2010, Peter Wiegel, www.peter-wiegel.de, wiegel@peter-wiegel.de | [licence](licences/TGL0-16-OFL.txt) |
| Aboreto | `Aboreto-Regular.ttf` | Copyright 2022 The Aboreto Project Authors (https://github.com/domija/Aboreto) | [licence](licences/Aboreto-OFL.txt) |
| Anta | `Anta-Regular.ttf` | Copyright 2019 The Anta Project Authors (https://github.com/Typedesigners/Anta-Regular) | [licence](licences/Anta-OFL.txt) |
| Audiowide | `Audiowide-Regular.ttf` | Copyright (c) 2012, Brian J. Bonislawsky DBA Astigmatic (AOETI) (astigma@astigmatic.com), with Reserved Font Names "Audiowide" | [licence](licences/Audiowide-OFL.txt) |
| Big Shoulders Display | `BigShouldersDisplay-wght.ttf` | Copyright 2019 The Big Shoulders Project Authors (https://github.com/xotypeco/big_shoulders) | [licence](licences/BigShouldersDisplay-OFL.txt) |
| Black Ops One | `BlackOpsOne-Regular.ttf` | Copyright 2022 The Black-Ops Project Authors (https://github.com/googlefonts/googlefonts-project-template) | [licence](licences/BlackOpsOne-OFL.txt) |
| Courier Prime | `CourierPrime-Regular.ttf` `CourierPrime-Bold.ttf` | Copyright 2015 The Courier Prime Project Authors (https://github.com/quoteunquoteapps/CourierPrime). | [licence](licences/CourierPrime-OFL.txt) |
| Gilda Display | `GildaDisplay-Regular.ttf` | Copyright 2012 The Gilda Display Project Authors (https://github.com/etunni/gilda-display) with Reserved Font Name 'Gilda'. | [licence](licences/GildaDisplay-OFL.txt) |
| Julius Sans One | `JuliusSansOne-Regular.ttf` | Copyright (c) 2012, LatinoType (luciano@latinotype.com), with Reserved Font Names 'Julius' | [licence](licences/JuliusSansOne-OFL.txt) |
| Krona One | `KronaOne-Regular.ttf` | Copyright (c) 2011 by Sorkin Type Co (www.sorkintype.com), | [licence](licences/KronaOne-OFL.txt) |
| Libre Caslon Display | `LibreCaslonDisplay-Regular.ttf` | Copyright 2012 The Libre Caslon Display Authors (https://github.com/impallari/Libre-Caslon-Display) | [licence](licences/LibreCaslonDisplay-OFL.txt) |
| Limelight | `Limelight-Regular.ttf` | Copyright (c) 2011 by Sorkin Type Co (www.sorkintype.com), | [licence](licences/Limelight-OFL.txt) |
| Major Mono Display | `MajorMonoDisplay-Regular.ttf` | Copyright 2018 The Major Mono Project Authors (https://github.com/googlefonts/majormono) | [licence](licences/MajorMonoDisplay-OFL.txt) |
| Pathway Extreme | `PathwayExtreme-opsz-wdth-wght.ttf` | Copyright 2019 The Pathway Extreme Project Authors (https://github.com/etunni/Pathway-Variable-Font) | [licence](licences/PathwayExtreme-OFL.txt) |
| Sirin Stencil | `SirinStencil-Regular.ttf` | Copyright (c) 2011, Cyreal (www.cyreal.org), | [licence](licences/SirinStencil-OFL.txt) |
| Stardos Stencil | `StardosStencil-Regular.ttf` `StardosStencil-Bold.ttf` | Copyright (c) 2011 by vernon adams (vern@newtypography.co.uk), | [licence](licences/StardosStencil-OFL.txt) |
| Syncopate | `Syncopate-Regular.ttf` `Syncopate-Bold.ttf` |  | [licence](licences/Syncopate-Apache.txt) |
| Tenor Sans | `TenorSans-Regular.ttf` | Copyright (c) 2011, Denis Masharov <denis.masharov@gmail.com>, | [licence](licences/TenorSans-OFL.txt) |
| Zen Dots | `ZenDots-Regular.ttf` | Copyright 2021 The Dots Project Authors (https://github.com/googlefonts/zen-dots) | [licence](licences/ZenDots-OFL.txt) |
| Reem Kufi | `ReemKufi-wght.ttf` | Copyright 2015-2022 The Reem Kufi Project Authors (https://github.com/aliftype/reem-kufi), with Reserved Font Name "Josefin Sans". | [licence](licences/ReemKufi-OFL.txt) |
| Noto Sans Bengali | `NotoSansBengali-wdth-wght.ttf` | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/bengali) | [licence](licences/NotoSansBengali-OFL.txt) |
| Noto Sans Devanagari | `NotoSansDevanagari-wdth-wght.ttf` | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/devanagari) | [licence](licences/NotoSansDevanagari-OFL.txt) |
| Vazirmatn | `Vazirmatn-wght.ttf` | Copyright 2015 The Vazirmatn Project Authors (https://github.com/rastikerdar/vazirmatn) | [licence](licences/Vazirmatn-OFL.txt) |
| Noto Sans Indic Siyaq Numbers | `NotoSansIndicSiyaqNumbers-Regular.ttf` | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/indic-siyaq-numbers) | [licence](licences/NotoSansIndicSiyaqNumbers-OFL.txt) |
| Noto Sans Mayan Numerals | `NotoSansMayanNumerals-Regular.ttf` | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/mayan-numerals) | [licence](licences/NotoSansMayanNumerals-OFL.txt) |
| Noto Serif Ottoman Siyaq | `NotoSerifOttomanSiyaq-Regular.ttf` | Copyright 2023 The Noto Project Authors (https://github.com/notofonts/noto-project-template) | [licence](licences/NotoSerifOttomanSiyaq-OFL.txt) |
| Noto Sans Tamil | `NotoSansTamil-wdth-wght.ttf` | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/tamil) | [licence](licences/NotoSansTamil-OFL.txt) |
| Kanit | `Kanit-Regular.ttf` `Kanit-Bold.ttf` | Copyright 2020 The Kanit Project Authors (https://github.com/cadsondemak/kanit) | [licence](licences/Kanit-OFL.txt) |
| Noto Serif SC | `NotoSerifSC-wght.ttf` | Copyright 2012 Google Inc. All Rights Reserved. | [licence](licences/NotoSerifSC-OFL.txt) |
