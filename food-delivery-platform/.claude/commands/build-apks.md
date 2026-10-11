---
description: Install/check Flutter + Android SDK and build debug APKs (customer, partner, rider) for the local demo
---
Build Android APKs of the three apps so the user can test them on a phone against the local demo. Work in `flutter-apps/`. Explain each install step to the user before you run it.

1. **Demo first.** The APKs talk to the demo API over the LAN. Check that the demo is running in LAN mode: `http://<LAN-IP>:8080/api/health` should return 200. If it isn't, run `/setup-demo` first and choose phone testing. Note the LAN IP.
2. **Java 17**
   - Check `java -version`.
   - If it's missing, install it:
     - Windows: `winget install -e --id EclipseAdoptium.Temurin.17.JDK`
     - macOS: `brew install --cask temurin@17`
     - Linux: `sudo apt install openjdk-17-jdk`
3. **Flutter**
   - Check `flutter --version` (it must be 3.24 or newer).
   - If it's missing, install it:
     - Windows: download the stable SDK zip from https://docs.flutter.dev/get-started/install/windows, extract it to `C:\src\flutter` and add `C:\src\flutter\bin` to the user PATH; Git for Windows is also needed (`winget install -e --id Git.Git`)
     - macOS: `brew install --cask flutter`
     - Linux: `sudo snap install flutter --classic`
4. **Android SDK**
   - Run `flutter doctor -v`. If the Android toolchain is missing, either:
     - install Android Studio (Windows: `winget install -e --id Google.AndroidStudio`; macOS: `brew install --cask android-studio`) and ask the user to open it once to finish the SDK setup wizard, or
     - install the command-line tools and run `sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"`.
   - Then run `flutter doctor --android-licenses`. The user must accept the licenses themselves, so tell them to type `y`.
   - Re-run `flutter doctor` until the Android toolchain reports no issues.
5. **Build** with `flutter pub get`, then:
   ```
   flutter build apk --debug --flavor customer -t lib/main_customer.dart --dart-define=API_BASE_URL=http://<LAN-IP>:8080
   flutter build apk --debug --flavor vendor   -t lib/main_vendor.dart   --dart-define=API_BASE_URL=http://<LAN-IP>:8080
   flutter build apk --debug --flavor delivery -t lib/main_delivery.dart --dart-define=API_BASE_URL=http://<LAN-IP>:8080
   ```
   - Debug builds are required because the demo uses plain `http://`; release builds are HTTPS-only by design.
   - Pass `--dart-define=GOOGLE_MAPS_KEY=<key>` only if the user has a key.
   - If Gradle fails, read the error and fix it (SDK version, licenses, JAVA_HOME). Never edit the app to weaken security.
6. **Collect** the APKs from `build/app/outputs/flutter-apk/`. Copy them to a new `apks/` folder next to this project with clear names: `customer.apk`, `partner.apk`, `rider.apk`.
7. **Report** where the APKs are and the logins from `TESTING.md`. Say that the user can run `/install-apks` with the phone connected by USB, or copy the files to the phone and allow "install unknown apps".
