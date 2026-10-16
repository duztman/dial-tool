# PowerShell script to build the minimal base WFF template APK using aapt2
$ErrorActionPreference = "Stop"

$baseDir = "tools/wff_template"
$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.dialtool.watchface"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk
        android:minSdkVersion="33"
        android:targetSdkVersion="34" />

    <uses-feature android:name="android.hardware.type.watch" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/icon"
        android:allowBackup="true"
        android:hasCode="false">

        <property
            android:name="com.google.wear.watchface.format.version"
            android:value="2" />

    </application>
</manifest>
"@
Set-Content -Path "$baseDir/AndroidManifest.xml" -Value $manifest -Encoding UTF8

$strings = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Dial Tool</string>
    <string name="aod_plate_setting">Dimming Options</string>
    <string name="aod_plate_black">Pure Black</string>
    <string name="aod_plate_dimmed">Dimmed</string>
    <string name="aod_plate_plate">Same as Dial</string>
</resources>
"@
Set-Content -Path "$baseDir/res/values/strings.xml" -Value $strings -Encoding UTF8

$watchFaceInfo = @"
<?xml version="1.0" encoding="utf-8"?>
<WatchFaceInfo xmlns:android="http://schemas.android.com/apk/res/android">
    <Preview value="@drawable/preview" />
    <Category value="EMPTY" />
    <AvailableInRetail value="true" />
    <MultipleInstancesAllowed value="true" />
    <Editable value="true" />
</WatchFaceInfo>
"@
Set-Content -Path "$baseDir/res/xml/watch_face_info.xml" -Value $watchFaceInfo -Encoding UTF8

$dummyWff = @"
<?xml version="1.0" encoding="utf-8"?>
<WatchFace width="450" height="450">
    <Metadata key="CLOCK_TYPE" value="ANALOG" />
    <Scene>
        <PartImage x="0" y="0" width="450" height="450">
            <Image resource="dial_face" />
        </PartImage>
        <AnalogClock x="0" y="0" width="450" height="450">
            <HourHand resource="hour_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" />
            <MinuteHand resource="minute_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" />
            <SecondHand resource="second_hand" x="0" y="0" width="450" height="450" pivotX="0.5" pivotY="0.5" />
        </AnalogClock>
        <PartImage x="215" y="215" width="20" height="20">
            <Image resource="cap" />
        </PartImage>
    </Scene>
</WatchFace>
"@
Set-Content -Path "$baseDir/res/raw/watchface.xml" -Value $dummyWff -Encoding UTF8

# 1x1 transparent PNG bytes
$pngBytes = [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
$drawables = @("icon", "preview", "dial_face", "dial_face_ambient", "dial_face_ambient_black", "dial_face_ambient_dimmed", "hour_hand", "hour_hand_ambient", "minute_hand", "minute_hand_ambient", "second_hand", "cap")

foreach ($d in $drawables) {
    [IO.File]::WriteAllBytes("$baseDir/res/drawable-nodpi/$d.png", $pngBytes)
}

Write-Host "Compiling resources with aapt2..."
New-Item -ItemType Directory -Path "$baseDir/compiled" -Force | Out-Null
& tools/aapt2/aapt2.exe compile --dir "$baseDir/res" -o "$baseDir/compiled/resources.zip"

Write-Host "Linking resources into base APK..."
& tools/aapt2/aapt2.exe link `
    -I tools/android-34.jar `
    --manifest "$baseDir/AndroidManifest.xml" `
    --min-sdk-version 33 `
    --target-sdk-version 34 `
    --version-code 1 `
    --version-name "1.0" `
    -o "tools/base_wff_template.apk" `
    --auto-add-overlay `
    "$baseDir/compiled/resources.zip"

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("tools/base_wff_template.apk"))
$jsContent = "// Auto-generated pre-compiled WFF container APK (base64)`nexport const BASE_WFF_APK_B64 = `"$b64`";`n"
Set-Content -Path "web/src/wearos/base_template.js" -Value $jsContent -Encoding UTF8

Write-Host "Base APK and web/src/wearos/base_template.js successfully updated!"
