// wff_xml.js — Generates the Watch Face Format (WFF) watchface.xml for Wear OS 4 / 5+
import { BEATS } from "../geometry.js";

/**
 * Builds the official WFF watchface.xml definition.
 * Viewport is fixed at canonical 450x450 (Wear OS circular watch face standard).
 */
export function generate_watchface_xml(S) {
  const beat = (BEATS[S.ha_beat] || BEATS[0])[1];
  const secondMovement = beat === 1 ? "<Tick />" : (beat > 1 ? `<Sweep frequency="${beat}" />` : "<Sweep />");

  const hands = [];
  if (S.ha_on) {
    if (S.ha_hour && S.ha_hour.on) {
      hands.push(`            <HourHand resource="hour_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5">
                <Variant mode="AMBIENT" target="resource" value="hour_hand_ambient" />
            </HourHand>`);
    }
    if (S.ha_minute && S.ha_minute.on) {
      hands.push(`            <MinuteHand resource="minute_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5">
                <Variant mode="AMBIENT" target="resource" value="minute_hand_ambient" />
            </MinuteHand>`);
    }
    if (S.ha_second && S.ha_second.on) {
      hands.push(`            <SecondHand resource="second_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5">
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
        <!-- Static Dial Face (Plate, Rings, Numerals) -->
        <PartImage x="0" y="0" width="450" height="450">
            <Image resource="dial_face" />
            <Variant mode="AMBIENT" target="resource" value="dial_face_ambient" />
        </PartImage>

        <!-- Analog Clock Hands -->
        <AnalogClock x="0" y="0" width="450" height="450">
${hands.join("\n")}
        </AnalogClock>
${cap ? "\n" + cap : ""}
    </Scene>
</WatchFace>
`;
}
