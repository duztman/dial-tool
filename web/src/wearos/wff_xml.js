// wff_xml.js — Generates the Watch Face Format (WFF) watchface.xml for Wear OS 4 / 5+
import { BEATS, windows_of, build_static } from "../geometry.js";
import { compute_window_layout } from "./wff_assets.js";

/**
 * Builds the official WFF watchface.xml definition.
 * Viewport is fixed at canonical 450x450 (Wear OS circular watch face standard).
 * 
 * Note on WFF <Variant>:
 * Per WFF specification, <Variant mode="AMBIENT" target="..."> operates on transformable
 * numeric/color attributes (like target="alpha"), not on target="resource".
 * To support different interactive vs ambient appearances:
 * - In "black" mode, dial_face plate is hidden in ambient mode via <Variant mode="AMBIENT" target="alpha" value="0" />
 * - Or dial_face (interactive) and dial_face_ambient (ambient) are cross-faded using target="alpha".
 */
export function generate_watchface_xml(S, statik = null) {
  const beat = (BEATS[S.ha_beat] || BEATS[0])[1];
  const secondMovement = beat === 1 ? "<Tick />" : (beat > 1 ? `<Sweep frequency="${beat}" />` : "<Sweep />");

  const activeWindows = statik
    ? (statik.windows || [])
    : (windows_of(S).some((w) => w.on) ? build_static(S).windows : []);

  const plateLum = 0.2126 * S.c_plate[0] + 0.7152 * S.c_plate[1] + 0.0722 * S.c_plate[2];
  const dayInk = plateLum > 0.5 ? "#1A1A1A" : "#F0F0F0";
  const aodInk = "#E6E6E6";

  const windowSlots = activeWindows.map((x) => {
    const { index, kind, boxX, boxY, boxW, boxH, sheetW, sheetH, colExpr, rowExpr } = compute_window_layout(S, x);
    return window_slot_xml({ index, kind, boxX, boxY, boxW, boxH, sheetW, sheetH, colExpr, rowExpr, dayInk, aodInk });
  });

  const windowSettings = activeWindows.map((x) => `        <ListConfiguration
            id="win_${x.index}"
            displayName="@string/win_${x.index}_setting"
            defaultValue="0">
            <ListOption id="0" displayName="@string/win_opt_on" />
            <ListOption id="1" displayName="@string/win_opt_off" />
        </ListConfiguration>`);

  const hands = [];
  if (S.ha_on) {
    if (S.ha_hour && S.ha_hour.on) {
      hands.push(`            <!-- Hour Hand -->
            <HourHand resource="hour_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="255">
                <Variant mode="AMBIENT" target="alpha" value="[CONFIGURATION.aod_plate] == '2' ? 255 : 0" />
            </HourHand>
            <HourHand resource="hour_hand_ambient" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="0">
                <Variant mode="AMBIENT" target="alpha" value="[CONFIGURATION.aod_plate] == '2' ? 0 : 255" />
            </HourHand>`);
    }
    if (S.ha_minute && S.ha_minute.on) {
      hands.push(`            <!-- Minute Hand -->
            <MinuteHand resource="minute_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="255">
                <Variant mode="AMBIENT" target="alpha" value="[CONFIGURATION.aod_plate] == '2' ? 255 : 0" />
            </MinuteHand>
            <MinuteHand resource="minute_hand_ambient" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="0">
                <Variant mode="AMBIENT" target="alpha" value="[CONFIGURATION.aod_plate] == '2' ? 0 : 255" />
            </MinuteHand>`);
    }
    if (S.ha_second && S.ha_second.on) {
      hands.push(`            <!-- Second Hand (hidden in ambient mode) -->
            <SecondHand resource="second_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5">
                ${secondMovement}
                <Variant mode="AMBIENT" target="alpha" value="0" />
            </SecondHand>`);
    }
  }

  const cap = (S.ha_on && S.ha_cap > 0)
    ? `        <PartImage x="0" y="0" width="450" height="450">
            <Image resource="cap" />
        </PartImage>`
    : "";

  return `<?xml version="1.0" encoding="utf-8"?>
<WatchFace width="450" height="450">
    <Metadata key="CLOCK_TYPE" value="ANALOG" />

    <!-- User Customization Options (accessible on watch & companion app) -->
    <UserConfigurations>
        <ListConfiguration
            id="aod_plate"
            displayName="@string/aod_plate_setting"
            defaultValue="0">
            <ListOption id="0" displayName="@string/aod_plate_black" />
            <ListOption id="1" displayName="@string/aod_plate_dimmed" />
            <ListOption id="2" displayName="@string/aod_plate_plate" />
        </ListConfiguration>
${windowSettings.length ? windowSettings.join("\n") + "\n" : ""}    </UserConfigurations>

    <Scene>
        <!-- Interactive Dial Face -->
        <PartImage x="0" y="0" width="450" height="450" alpha="255">
            <Image resource="dial_face" />
            <Variant mode="AMBIENT" target="alpha" value="0" />
        </PartImage>

        <!-- Ambient Dial Face (Configured via Watch Customization) -->
        <ListConfiguration id="aod_plate">
            <!-- Option 0: Pure Black -->
            <ListOption id="0">
                <PartImage x="0" y="0" width="450" height="450" alpha="0">
                    <Image resource="dial_face_ambient_black" />
                    <Variant mode="AMBIENT" target="alpha" value="255" />
                </PartImage>
            </ListOption>

            <!-- Option 1: Dimmed Plate -->
            <ListOption id="1">
                <PartImage x="0" y="0" width="450" height="450" alpha="0">
                    <Image resource="dial_face_ambient_dimmed" />
                    <Variant mode="AMBIENT" target="alpha" value="255" />
                </PartImage>
            </ListOption>

            <!-- Option 2: Same as Daytime Dial -->
            <ListOption id="2">
                <PartImage x="0" y="0" width="450" height="450" alpha="0">
                    <Image resource="dial_face" />
                    <Variant mode="AMBIENT" target="alpha" value="255" />
                </PartImage>
            </ListOption>
        </ListConfiguration>
${windowSlots.length ? "\n" + windowSlots.join("\n\n") + "\n" : ""}
        <!-- Analog Clock Hands -->
        <AnalogClock x="0" y="0" width="450" height="450">
${hands.join("\n")}
        </AnalogClock>
${cap ? "\n" + cap : ""}
    </Scene>
</WatchFace>
`;
}

// Shown in daytime (and in AOD when "Same as Dial" is picked); the AOD copy takes over otherwise.
const DAY_ALPHA_AOD = "[CONFIGURATION.aod_plate] == '2' ? 255 : 0";
const AOD_ALPHA_AOD = "[CONFIGURATION.aod_plate] == '2' ? 0 : 255";

/** Renders `body(color)` twice: once in the daytime ink, once in a light AOD ink. */
function inked(name, w, h, dayInk, aodInk, body, pad) {
  return `${pad}<Group name="${name}_day" x="0" y="0" width="${w}" height="${h}" alpha="255">
${pad}    <Variant mode="AMBIENT" target="alpha" value="${DAY_ALPHA_AOD}" />
${body(dayInk, pad + "    ")}
${pad}</Group>
${pad}<Group name="${name}_aod" x="0" y="0" width="${w}" height="${h}" alpha="0">
${pad}    <Variant mode="AMBIENT" target="alpha" value="${AOD_ALPHA_AOD}" />
${body(aodInk, pad + "    ")}
${pad}</Group>`;
}

function text_part(x, y, w, h, size, color, expr, pad) {
  return `${pad}<PartText x="${x}" y="${y}" width="${w}" height="${h}">
${pad}    <Text align="CENTER" ellipsis="TRUE">
${pad}        <Font family="SYNC_TO_DEVICE" size="${size}" weight="MEDIUM" color="${color}">
${pad}            <Template>%s<Parameter expression="${expr}" /></Template>
${pad}        </Font>
${pad}    </Text>
${pad}</PartText>`;
}

function icon_part(x, y, s, color, resource, pad) {
  const tint = color ? ` tintColor="${color}"` : "";
  return `${pad}<PartImage x="${x}" y="${y}" width="${s}" height="${s}"${tint}>
${pad}    <Image resource="${resource}" />
${pad}</PartImage>`;
}

/**
 * One Dial Tool window as a customizable <ComplicationSlot>:
 *  - EMPTY provider (default): the Dial Tool visualization (sprite sheet), unless the user set
 *    "win_N" to Off in the watch face settings — then nothing is drawn (clean solid plate).
 *  - Any stock complication picked from the watch's Complications editor replaces it.
 */
function window_slot_xml({ index, kind, boxX, boxY, boxW, boxH, sheetW, sheetH, colExpr, rowExpr, dayInk, aodInk }) {
  const w = boxW;
  const h = boxH;
  const fs = Math.max(10, Math.min(24, Math.round(Math.min(h * 0.42, w / 3.2))));
  const P = "                "; // indentation inside <Complication>
  const n = `win${index}`;

  // SHORT_TEXT: icon above text when the window is tall enough, text alone otherwise
  const shortText = (c, pad) => {
    if (h >= 56) {
      const s = Math.round(h * 0.36);
      const ty = Math.round(h * 0.48);
      return icon_part(Math.round((w - s) / 2), Math.round(h * 0.08), s, c, "[COMPLICATION.MONOCHROMATIC_IMAGE]", pad) + "\n" +
        text_part(0, ty, w, h - ty, Math.min(fs, Math.round(h * 0.34)), c, "[COMPLICATION.TEXT]", pad);
    }
    return text_part(0, 0, w, h, fs, c, "[COMPLICATION.TEXT]", pad);
  };

  // RANGED_VALUE: text with a thin progress bar underneath
  const barW = Math.max(4, w - 8);
  const barH = Math.max(2, Math.round(h * 0.07));
  const barY = h - barH - Math.max(2, Math.round(h * 0.1));
  const frac = "clamp(([COMPLICATION.RANGED_VALUE_VALUE] - [COMPLICATION.RANGED_VALUE_MIN]) / max([COMPLICATION.RANGED_VALUE_MAX] - [COMPLICATION.RANGED_VALUE_MIN], 0.0001), 0, 1)";
  const ranged = (c, pad) =>
    text_part(0, 0, w, barY, Math.min(fs, Math.round(barY * 0.6)), c, "[COMPLICATION.TEXT]", pad) + `
${pad}<PartDraw x="4" y="${barY}" width="${barW}" height="${barH}" alpha="80">
${pad}    <Rectangle x="0" y="0" width="${barW}" height="${barH}">
${pad}        <Fill color="${c}" />
${pad}    </Rectangle>
${pad}</PartDraw>
${pad}<PartDraw x="4" y="${barY}" width="${barW}" height="${barH}">
${pad}    <Rectangle x="0" y="0" width="${barW}" height="${barH}">
${pad}        <Transform target="width" value="${barW} * ${frac}" />
${pad}        <Fill color="${c}" />
${pad}    </Rectangle>
${pad}</PartDraw>`;

  const iconS = Math.round(Math.min(w, h) * 0.7);
  const mono = (c, pad) => icon_part(Math.round((w - iconS) / 2), Math.round((h - iconS) / 2), iconS, c, "[COMPLICATION.MONOCHROMATIC_IMAGE]", pad);
  const imgS = Math.round(Math.min(w, h) * 0.8);

  return `        <!-- Window ${index + 1} (${kind}): Dial Tool visualization by default, swappable for any stock complication -->
        <ComplicationSlot slotId="${index}" name="window_${index}" displayName="@string/comp_slot_${index}"
            x="${boxX}" y="${boxY}" width="${w}" height="${h}"
            supportedTypes="SHORT_TEXT RANGED_VALUE MONOCHROMATIC_IMAGE SMALL_IMAGE EMPTY"
            isCustomizable="TRUE">
            <DefaultProviderPolicy defaultSystemProvider="EMPTY" defaultSystemProviderType="EMPTY" />
            <BoundingBox x="0" y="0" width="${w}" height="${h}" />

            <!-- No provider picked: Dial Tool built-in window (or nothing, if turned off) -->
            <Complication type="EMPTY">
                <Group name="${n}_builtin" x="0" y="0" width="${w}" height="${h}">
                    <ListConfiguration id="win_${index}">
                        <ListOption id="0">
                            <Group name="${n}_sprite" x="0" y="0" width="${w}" height="${h}" alpha="255">
                                <Variant mode="AMBIENT" target="alpha" value="[CONFIGURATION.aod_plate] == '2' ? 255 : 200" />
                                <PartImage x="0" y="0" width="${sheetW}" height="${sheetH}" renderMode="SOURCE">
                                    <Transform target="x" value="-(${colExpr}) * ${w}" />
                                    <Transform target="y" value="-(${rowExpr}) * ${h}" />
                                    <Image resource="window_${index}" />
                                </PartImage>
                                <PartDraw x="0" y="0" width="${w}" height="${h}" renderMode="MASK">
                                    <Rectangle x="0" y="0" width="${w}" height="${h}">
                                        <Fill color="#FFFFFF" />
                                    </Rectangle>
                                </PartDraw>
                            </Group>
                        </ListOption>
                        <ListOption id="1">
                            <PartDraw x="0" y="0" width="1" height="1" alpha="0">
                                <Rectangle x="0" y="0" width="1" height="1">
                                    <Fill color="#00000000" />
                                </Rectangle>
                            </PartDraw>
                        </ListOption>
                    </ListConfiguration>
                </Group>
            </Complication>

            <!-- Stock complications -->
            <Complication type="SHORT_TEXT">
${inked(`${n}_st`, w, h, dayInk, aodInk, shortText, P)}
            </Complication>
            <Complication type="RANGED_VALUE">
${inked(`${n}_rv`, w, h, dayInk, aodInk, ranged, P)}
            </Complication>
            <Complication type="MONOCHROMATIC_IMAGE">
${inked(`${n}_mi`, w, h, dayInk, aodInk, mono, P)}
            </Complication>
            <Complication type="SMALL_IMAGE">
${icon_part(Math.round((w - imgS) / 2), Math.round((h - imgS) / 2), imgS, null, "[COMPLICATION.SMALL_IMAGE]", P)}
            </Complication>
        </ComplicationSlot>`;
}
