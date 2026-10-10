# Apple App Store listing: FeastFlow Partner (Vendor (Partner) app)

> **Before you submit:** replace every `[BRACKETED PLACEHOLDER]`. Never publish invented ratings, user counts, awards or press quotes; fill social-proof slots only with real, verifiable numbers, or delete them. The app name shown to users is set in **Admin Panel → Config → Branding**; keep it identical to the store name.

> **iOS build check:** `ios/Runner/Info.plist` is shared by all flavors and declares `UIBackgroundModes` → `location` plus `NSLocationAlwaysAndWhenInUseUsageDescription`. These are only justified for the Rider app. Remove them from the Vendor (Partner) app build (per-flavor Info.plist or build-time plist edit), or App Review will likely reject under Guideline 2.5.4.

## App name (max 30)
```
FeastFlow Partner
```
*17 / 30 characters*

## Subtitle (max 30)
```
Orders, menu & payouts
```
*22 / 30 characters*

## Category
- **Primary:** Business
- **Secondary:** Food & Drink

## Keywords field (max 100, comma-separated, no spaces)
```
restaurant,merchant,vendor,kitchen,manager,sell,earnings,owner,store,cafe,cloud,dashboard,alerts
```
*96 / 100 characters*

Words already in the name/subtitle are deliberately excluded (Apple indexes those already). Replace generic words with your city/area names once you know your launch market (e.g. swap `near,me` for `[CITY]`), checking the count stays at or under 100.

## Promotional text (max 170, editable without a new build)
```
Accept orders the moment they arrive, update your menu in seconds, and track earnings and payouts, all from one app built for FeastFlow restaurant partners.
```
*156 / 170 characters*

## Description (max 4000)
*1754 / 4000 characters.* Plain text, no markup. Same body as Google Play; delete social-proof lines you cannot back with real data.

```
FeastFlow Partner is the app for restaurants that sell on FeastFlow. Accept orders, run your kitchen flow, keep your menu up to date and track your earnings, all from your phone.

[XXX+ restaurant partners in [CITY]] · [★ X.X partner rating]

NEVER MISS AN ORDER
• Instant push alerts for new orders
• Accept or reject each order with a clear countdown timer
• Move orders through Preparing → Ready so customers and riders know when to arrive
• See order items, add-ons, notes and bill details at a glance

YOUR MENU, YOUR WAY
• Add and edit dishes, prices, photos and add-ons
• Organise your menu into categories
• Mark items unavailable in one tap when you run out
• Changes go live for customers straight away

CONTROL YOUR HOURS
• Set opening timings for every day of the week
• Go online or offline instantly with the open/close toggle

KNOW YOUR NUMBERS
• Track earnings per order
• Request payouts once you reach the minimum payout amount [AMOUNT]
• See commission and fees transparently [UPDATE TO MATCH YOUR TERMS]

BUILD YOUR REPUTATION
• Read customer ratings and reviews
• Reply to reviews publicly to thank guests or resolve issues

ALSO ON THE WEB
Prefer a bigger screen? Use the FeastFlow Partner web dashboard at [VENDOR DASHBOARD URL] with the same login.

WHAT PARTNERS SAY
"[REAL PARTNER QUOTE — use only with permission]" — [NAME], [RESTAURANT], [CITY]

HOW TO JOIN
New to FeastFlow? Register your restaurant in the app or at [PARTNER SIGNUP URL]. Our team reviews and approves new partners before they go live. Commission and payout terms are shared during onboarding.

Partner support: [PARTNER SUPPORT EMAIL] · [SUPPORT PHONE]
Privacy policy: [PRIVACY POLICY URL] · Terms: [TERMS URL]
FeastFlow is operated by [COMPANY LEGAL NAME].
```

**Support URL:** [SUPPORT URL] · **Marketing URL:** [WEBSITE URL] · **Copyright:** © [YEAR] [COMPANY LEGAL NAME]

## Screenshot captions (8)
Sizes: 6.9" (1320×2868) required; 6.5" (1284×2778) optional. Copy and design notes: `screenshot-copy.md`.

| # | Caption (chars) | Supporting line | Screen to capture |
|---|---|---|---|
| 1 | **New order? Accept in one tap** (28) | Live order alerts with an accept timer | Incoming order card with countdown, Accept / Reject buttons |
| 2 | **Run your kitchen, step by step** (30) | Preparing → Ready status updates | Orders list grouped by status (New / Preparing / Ready) |
| 3 | **Every detail, no confusion** (26) | Items, add-ons and notes on one screen | Order detail screen with items, add-ons, notes, bill |
| 4 | **Edit your menu in seconds** (25) | Dishes, prices, photos and add-ons | Menu screen with categories and item cards |
| 5 | **Sold out? Toggle it off** (23) | Item availability in one tap | Menu list with availability switches, one item switched off |
| 6 | **Open when you want** (18) | Weekly timings and open/close toggle | Timings screen with weekday hours and the Open toggle |
| 7 | **Track earnings & payouts** (24) | Per-order earnings and payout requests | Earnings / Payouts screen with balance and payout history |
| 8 | **Reply to every review** (21) | Build loyalty with public replies | Reviews screen with star ratings and a reply being typed |

## App Review notes (App Review Information → Notes)

**Demo account** (create a dedicated reviewer account on your production backend; do not reuse seed accounts like customer@example.com):
- Email: [REVIEW DEMO EMAIL]
- Password: [REVIEW DEMO PASSWORD]
- Sign in with **Email + password** on the login screen. (this account is an **approved** restaurant partner, [DEMO RESTAURANT NAME]).

**OTP login:** If the reviewer chooses phone login, OTPs are sent by SMS (Twilio). Provide a reviewer phone number with a fixed/visible OTP if your backend supports one [VERIFY: e.g. a whitelisted test number], or ask the reviewer to use the email login above. OTP length is 6 digits.

**Sign in with Apple:** The app offers Google sign-in, so Sign in with Apple is also offered (Guideline 4.8), controlled by the `appleSignIn` feature flag in Admin Panel → Config → Feature Flags. Keep it **ON** for the iOS submission.

**How to test**
1. Sign in; the demo restaurant is open. Toggle Open/Closed from the dashboard.
2. To see an incoming order, place one from the FeastFlow customer app with [REVIEW CUSTOMER DEMO EMAIL]/[REVIEW DEMO PASSWORD], or ask us to send one during review hours [HOURS + TIMEZONE]. Accept it within the timer and move it to Preparing → Ready.
3. Menu: add/edit an item, toggle availability. Timings, Reviews (reply), Earnings/Payouts are in the menu.

**Who can use this app:** Only restaurants that registered and were approved by [COMPANY LEGAL NAME]. New sign-ups see a pending-approval screen until approved; that is expected behaviour.

**Location / camera:** Location is used only in the foreground, once, if the partner taps "use current location" to pin the restaurant on the map. There is no location tracking. The camera/photo library is used only to upload menu and restaurant photos.

**Account deletion (Guideline 5.1.1(v)):** Profile → Settings → Delete account. Deletion is immediate after confirmation.

Contact during review: [REVIEW CONTACT NAME], [REVIEW CONTACT PHONE], [REVIEW CONTACT EMAIL].

## Privacy nutrition label (App Privacy) suggestions
**Data Used to Track You:** None (no third-party advertising or cross-app tracking SDKs in the codebase). Do not show the ATT prompt. Revisit if you add ad/attribution SDKs.

**Data Linked to You:**

| Category | Data types | Purpose |
|---|---|---|
| Contact Info | Name, Email Address, Phone Number, Physical Address (restaurant) | App Functionality |
| Location | Precise Location (one-time restaurant pin) | App Functionality |
| Financial Info | Other Financial Info (payout/bank details, earnings) | App Functionality |
| User Content | Photos (menu/restaurant), Other User Content (review replies) | App Functionality |
| Identifiers | User ID, Device ID (push token) | App Functionality |

**Data Not Linked to You:** none by default. If you add crash reporting (e.g. Crashlytics), declare Diagnostics → Crash Data / Performance Data.

Privacy Policy URL: [PRIVACY POLICY URL] · Account deletion: in-app (Profile → Settings → Delete account).

## Age rating answers
| Item | Answer |
|---|---|
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Prolonged graphic or sadistic realistic violence | None |
| Profanity or crude humor | None |
| Mature/suggestive themes | None |
| Horror/fear themes | None |
| Medical/treatment information | None |
| Alcohol, tobacco, or drug use or references | None (no alcohol/tobacco sold; re-answer if that changes) |
| Simulated gambling | None |
| Sexual content or nudity | None |
| Graphic sexual content and nudity | None |
| Contests | None |
| Unrestricted web access | No |
| User-generated content | Yes (moderated reviews) |
| Messaging and chat | No (no in-app chat) |
| Gambling | No |
| Age assurance / parental controls | No |

Expected rating: **4+** (Apple may assign a higher age if UGC is declared; that is fine).
