# Flutter Build Guide (one codebase → 3 apps)

| Flavor | Entry point | Android applicationId | Role |
|---|---|---|---|
| customer | `lib/main_customer.dart` | `${APP_ID_BASE}.customer` | Ordering app |
| vendor | `lib/main_vendor.dart` | `${APP_ID_BASE}.vendor` | Restaurant partner app |
| delivery | `lib/main_delivery.dart` | `${APP_ID_BASE}.delivery` | Rider app |

`APP_ID_BASE` defaults to `com.fooddelivery` (`-PAPP_ID_BASE=com.yourco` or env var). The launcher name comes from `CUSTOMER_APP_NAME` / `VENDOR_APP_NAME` / `DELIVERY_APP_NAME`; the **in-app** name, logo, colors and every string are loaded at runtime from `/api/config`.

## 1. Setup
```bash
cd flutter-apps
flutter pub get
flutter analyze && flutter test
```

## 2. Build-time defines (the only compile-time values)
| Define | Example |
|---|---|
| `API_BASE_URL` | `https://api.example.com` (Android emulator → `http://10.0.2.2:5000`) |
| `API_PREFIX` | `/api` |
| `GOOGLE_MAPS_KEY` | Maps SDK key (also pass as Gradle property/env for the Android manifest) |
| `GOOGLE_SERVER_CLIENT_ID` | Web OAuth client id for Google sign-in |

Keep them in a file and pass `--dart-define-from-file=env/prod.json`:
```json
{ "API_BASE_URL": "https://api.example.com", "GOOGLE_MAPS_KEY": "AIza...", "GOOGLE_SERVER_CLIENT_ID": "xxx.apps.googleusercontent.com" }
```

## 3. Run
```bash
flutter run --flavor customer -t lib/main_customer.dart --dart-define-from-file=env/dev.json
flutter run --flavor vendor   -t lib/main_vendor.dart   --dart-define-from-file=env/dev.json
flutter run --flavor delivery -t lib/main_delivery.dart --dart-define-from-file=env/dev.json
```

## 4. Android release
1. Create a keystore: `keytool -genkey -v -keystore ~/upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
2. `android/key.properties`:
   ```
   storePassword=***
   keyPassword=***
   keyAlias=upload
   storeFile=/home/you/upload.jks
   ```
3. Build:
   ```bash
   export GOOGLE_MAPS_KEY=AIza...
   flutter build appbundle --flavor customer -t lib/main_customer.dart --dart-define-from-file=env/prod.json
   flutter build apk --split-per-abi --flavor delivery -t lib/main_delivery.dart --dart-define-from-file=env/prod.json
   ```
   Output: `build/app/outputs/bundle/customerRelease/app-customer-release.aab`.

Firebase (push): create three Android apps in one Firebase project and place each `google-services.json` in `android/app/src/<flavor>/`. The Google Services plugin is applied automatically when a file is present; without Firebase the apps run with push disabled.

## 5. iOS flavors
The repository ships `ios/Flutter/<flavor>.xcconfig` and `Debug-|Release-|Profile-<flavor>.xcconfig` (bundle id, display name, Maps key, entry point). One-time Xcode setup:
1. Open `ios/Runner.xcworkspace`.
2. Runner project → Info → Configurations: duplicate Debug/Release/Profile as `Debug-customer`, `Release-customer`, `Profile-customer` (repeat for vendor and delivery) and set each one's base configuration file to the matching `Flutter/<Config>-<flavor>.xcconfig`.
3. Product → Scheme → Manage Schemes: duplicate *Runner* into schemes named `customer`, `vendor`, `delivery`; set Run/Test/Profile/Analyze/Archive to the matching configurations.
4. `cd ios && pod install`.
5. Add `GoogleService-Info.plist` per flavor (Build Phase script copying `Firebase/<flavor>/GoogleService-Info.plist`), enable Push Notifications, Background Modes (location, remote notifications) and *Sign in with Apple* capabilities.
6. Build: `flutter build ipa --flavor customer -t lib/main_customer.dart --dart-define-from-file=env/prod.json`.

## 6. Payments
* Razorpay works out of the box on Android/iOS (`razorpay_flutter`).
* Stripe uses PaymentSheet — `MainActivity` extends `FlutterFragmentActivity` and the Android theme is `Theme.MaterialComponents` (already configured).
* The provider is chosen by the backend (`PAYMENT_PROVIDER`); the app reads it from `/api/config` → `payment.provider`.

## 7. Tablets & orientation
Layouts use flexible lists/grids; grid column counts come from `homeLayout[].columns`, so you can raise them for tablets from the Layout Builder.

## 8. Troubleshooting
| Symptom | Fix |
|---|---|
| App stuck on splash with retry | `API_BASE_URL` unreachable from the device (use LAN IP / 10.0.2.2) |
| Maps blank | Missing `GOOGLE_MAPS_KEY` (Gradle/env for Android, xcconfig for iOS) |
| Google sign-in fails | Add the client IDs to backend `GOOGLE_CLIENT_IDS` and pass `GOOGLE_SERVER_CLIENT_ID` |
| No push | `google-services.json` / `GoogleService-Info.plist` missing; backend `FIREBASE_SERVICE_ACCOUNT_*` unset |
