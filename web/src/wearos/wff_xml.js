// wff_xml.js — Generates the Watch Face Format (WFF) watchface.xml for Wear OS 4 / 5+
import { BEATS } from "../geometry.js";

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
export function generate_watchface_xml(S) {
  const beat = (BEATS[S.ha_beat] || BEATS[0])[1];
  const secondMovement = beat === 1 ? "<Tick />" : (beat > 1 ? `<Sweep frequency="${beat}" />` : "<Sweep />");
  const aodMode = S.wearos_aod || "black";

  let backgroundPart = "";
  if (aodMode === "plate") {
    // Exact same dial face in interactive and ambient modes
    backgroundPart = `        <PartImage x="0" y="0" width="450" height="450">
            <Image resource="dial_face" />
        </PartImage>`;
  } else {
    // Interactive dial face fades out in ambient mode
    // Ambient dial face (pure black or dimmed plate with bright luminous rings) fades in
    backgroundPart = `        <!-- Interactive Dial Face -->
        <PartImage x="0" y="0" width="450" height="450" alpha="255">
            <Image resource="dial_face" />
            <Variant mode="AMBIENT" target="alpha" value="0" />
        </PartImage>

        <!-- Ambient Dial Face (AOD: ${aodMode}) -->
        <PartImage x="0" y="0" width="450" height="450" alpha="0">
            <Image resource="dial_face_ambient" />
            <Variant mode="AMBIENT" target="alpha" value="255" />
        </PartImage>`;
  }

  const hands = [];
  if (S.ha_on) {
    if (S.ha_hour && S.ha_hour.on) {
      hands.push(`            <!-- Hour Hand -->
            <HourHand resource="hour_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="255">
                <Variant mode="AMBIENT" target="alpha" value="0" />
            </HourHand>
            <HourHand resource="hour_hand_ambient" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="0">
                <Variant mode="AMBIENT" target="alpha" value="255" />
            </HourHand>`);
    }
    if (S.ha_minute && S.ha_minute.on) {
      hands.push(`            <!-- Minute Hand -->
            <MinuteHand resource="minute_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="255">
                <Variant mode="AMBIENT" target="alpha" value="0" />
            </MinuteHand>
            <MinuteHand resource="minute_hand_ambient" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" alpha="0">
                <Variant mode="AMBIENT" target="alpha" value="255" />
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
    <Scene>
${backgroundPart}

        <!-- Analog Clock Hands -->
        <AnalogClock x="0" y="0" width="450" height="450">
${hands.join("\n")}
        </AnalogClock>
${cap ? "\n" + cap : ""}
    </Scene>
</WatchFace>
`;
}
