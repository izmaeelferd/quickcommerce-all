# Apple App Store Deployment

Repeat per flavor (three App Store records).

## 1. Apple Developer setup
1. Certificates, Identifiers & Profiles → **Identifiers**: create App IDs `com.yourco.customer`, `.vendor`, `.delivery` with capabilities: Push Notifications, Sign in with Apple (customer), Background Modes, Associated Domains (optional).
2. **Keys**: APNs auth key (.p8) → upload to Firebase Cloud Messaging for each iOS app.
3. Xcode → Signing & Capabilities: automatic signing with your team for each configuration (see FLUTTER_BUILD_GUIDE §5 for flavor configurations/schemes).

## 2. App Store Connect
1. **My Apps → +** New App: platform iOS, name, primary language, bundle id, SKU.
2. App Privacy: declare data collected (contact info, location, purchases, user content/photos, identifiers) and purposes.
3. Provide a privacy policy URL and support URL (from Admin → Branding/Legal).
4. App Review information: demo accounts (customer/vendor/rider), notes explaining that content is managed remotely and that vendor/rider apps require approval (pre-approve the demo accounts).

## 3. Build & upload
```bash
cd flutter-apps
flutter build ipa --flavor customer -t lib/main_customer.dart --dart-define-from-file=env/prod.json
# upload
xcrun altool --upload-app -f build/ios/ipa/*.ipa -t ios -u <apple-id> -p <app-specific-password>
# or open build/ios/archive/Runner.xcarchive in Xcode → Distribute App
```

## 4. TestFlight → Release
1. Wait for processing, answer export compliance (uses standard HTTPS encryption → exempt).
2. Internal/external TestFlight testing.
3. Prepare for submission: screenshots (6.7", 6.5", 5.5", iPad if supported), description, keywords, category Food & Drink, age rating.
4. Submit for review. Common rejection points: background location justification (delivery app — explain live tracking), Sign in with Apple must be offered when Google sign-in is offered (keep `appleSignIn` enabled in Feature Flags for the iOS customer app), account deletion must be available (Profile → Settings → delete account calls `DELETE /api/users/profile`).
5. After approval, set `storeUrlIos` in Admin → Settings → App versions.
