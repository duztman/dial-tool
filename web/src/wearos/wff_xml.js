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
    </UserConfigurations>

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

        <!-- Analog Clock Hands -->
        <AnalogClock x="0" y="0" width="450" height="450">
${hands.join("\n")}
        </AnalogClock>
${cap ? "\n" + cap : ""}
    </Scene>
</WatchFace>
`;
}
