# Store listings: FeastFlow apps

Ready-to-paste Google Play and Apple App Store listing copy for the three Flutter flavors of the platform.

| File | What it contains |
|---|---|
| `play-store-customer.md` | Google Play listing for **FeastFlow** (customer app): title, short and full description, category/tags, IARC content-rating answers, Data safety answers, screenshot captions, feature-graphic text, ASO keywords, release notes. |
| `play-store-vendor.md` | Same, for **FeastFlow Partner** (restaurant/vendor app). |
| `play-store-delivery.md` | Same, for **FeastFlow Rider** (delivery app), including the foreground-service (location) declaration notes. |
| `app-store-customer.md` | App Store Connect listing for **FeastFlow**: name, subtitle, keywords field, promotional text, description, screenshot captions, App Review notes, privacy nutrition label, age rating, category. |
| `app-store-vendor.md` | Same, for **FeastFlow Partner**. |
| `app-store-delivery.md` | Same, for **FeastFlow Rider**, with the background-location justification for App Review. |
| `screenshot-copy.md` | Headline, subtext, screen to capture and design notes for all 8 screenshots of each app. |

## Before you use them
1. **App name:** the name users see inside the apps is set at runtime in **Admin Panel → Config → Branding** (the seeded default is "FeastFlow"). Set it to match the store names here (FeastFlow / FeastFlow Partner / FeastFlow Rider) before taking screenshots or submitting.
2. Replace every `[BRACKETED PLACEHOLDER]` (company, URLs, emails, city, review accounts). Social-proof placeholders such as `[X.X/5 rating from X,XXX reviews]` must be filled with real numbers or deleted; never invent ratings, user counts or quotes.
3. Publish the Privacy Policy and Terms from **Admin Panel → Config → Legal Pages** and use those URLs in both consoles.
4. Check the permission notes at the top of each listing: the shared Android manifest and iOS Info.plist declare only foreground (when-in-use) location, and cleartext traffic is disabled in release builds. Only the Rider app adds background tracking: on Android via its flavor manifest (location foreground service; complete the Play foreground-service declaration), on iOS via its own Info.plist plus `--dart-define=IOS_BACKGROUND_LOCATION=true`.
5. Create dedicated reviewer accounts (`[REVIEW DEMO EMAIL]` / `[REVIEW DEMO PASSWORD]`) on the production backend; do not give reviewers the seed demo accounts.
6. Keep listings consistent with the actual feature flags. If you switch a feature off in Admin → Feature Flags (e.g. wallet, scheduleOrder, appleSignIn), remove it from the copy. Note that Sign in with Apple must stay on for iOS if Google sign-in is on.

## Character limits
Every limited field shows its character count, and all were checked with Python `len()` when these files were generated:
Play title 30 · Play short description 80 · Play full description 4000 · Release notes 500 · App Store name 30 · subtitle 30 · keywords 100 · promotional text 170 · description 4000 · screenshot headlines 30 (ideal).
Re-count after you replace placeholders, since placeholders differ in length from the final text.

## Not claimed (not built yet)
The copy deliberately avoids in-app chat, loyalty points, group ordering, meal subscriptions, dine-in, AI search, promoted listings/ads, vendor subscription plans and multi-city zones. Don't add them to listings until they ship.
