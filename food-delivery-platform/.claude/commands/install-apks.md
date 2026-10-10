---
description: Install the built APKs on an Android phone connected by USB
---
Install the demo APKs on the user's Android phone.

1. Find `adb`: on PATH, or at `<Android SDK>/platform-tools/adb`. The SDK location is in `flutter doctor -v`.
2. Run `adb devices`.
   - If no device is listed, tell the user to turn on Developer options and USB debugging. Developer options are unlocked by tapping Settings → About phone → Build number 7 times; USB debugging is under Settings → Developer options.
   - They then connect the phone by USB and accept the "Allow USB debugging" prompt on the phone.
   - Re-check until the device shows as `device`, not `unauthorized`.
3. Install each APK from `../apks/` (or `flutter-apps/build/app/outputs/flutter-apk/`) with `adb install -r <file>`: customer, partner and rider.
4. Remind the user:
   - the phone must be on the same Wi-Fi as this computer
   - the demo must be running in LAN mode
5. List the logins from `TESTING.md`.
