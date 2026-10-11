# Google Play Store Deployment

Repeat for each flavor (customer, vendor, delivery) — they are separate Play listings.

## 1. Prepare
- [ ] Unique `APP_ID_BASE` (e.g. `com.yourco`) → package names `com.yourco.customer`, `.vendor`, `.delivery`
- [ ] Release keystore + `android/key.properties` (enrol in **Play App Signing**)
- [ ] Bump `version: x.y.z+build` in `pubspec.yaml` for every upload
- [ ] Production `env/prod.json` (HTTPS API URL)
- [ ] Replace the placeholder launcher icons in `android/app/src/<flavor>/res/mipmap-*` and the 512 px `ic_launcher-playstore.png` per flavor
- [ ] Privacy policy URL — serve the Admin-edited policy, e.g. `https://example.com/privacy` or link to `GET /api/config` content

## 2. Build
```bash
flutter build appbundle --flavor customer -t lib/main_customer.dart --dart-define-from-file=env/prod.json
```

## 3. Play Console
1. **Create app** → name, default language, App/Game = App, Free/Paid.
2. **App content**: privacy policy, ads declaration, app access (provide a demo login — e.g. a test customer/vendor/rider), content rating questionnaire, target audience, news app = no, data safety (location, personal info, financial info for payments, photos for delivery proof), government apps = no.
3. **Permissions declarations**:
   - Background location (delivery app only) — explain live order tracking for customers while delivering; include a short video. Remove `ACCESS_BACKGROUND_LOCATION` from the customer/vendor builds if you do not need it (manifest `tools:node="remove"` in `src/<flavor>/AndroidManifest.xml`).
   - Foreground service (location) if used.
4. **Store listing**: short/full description, screenshots (phone + 7"/10" tablet), feature graphic 1024×500, icon 512×512.
5. **Testing → Internal testing**: upload the `.aab`, add testers, roll out. Promote to closed/open testing, then **Production**.
6. Set the store URL in Admin → Settings → App versions (`storeUrlAndroid`) to enable the in-app update prompt; raise `minVersion` to force upgrades.

## 4. Post-release
- Monitor Android vitals/crashes.
- Every release: bump build number, upload, staged rollout (10% → 100%).
- Config/theme/text changes do **not** need a new release — use the Admin Panel.
