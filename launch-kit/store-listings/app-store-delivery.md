# Apple App Store listing: FeastFlow Rider (Delivery (Rider) app)

> **Before you submit:** replace every `[BRACKETED PLACEHOLDER]`. Never publish invented ratings, user counts, awards or press quotes; fill social-proof slots only with real, verifiable numbers, or delete them. The app name shown to users is set in **Admin Panel → Config → Branding**; keep it identical to the store name.

> **iOS build check:** the shared `ios/Runner/Info.plist` declares only when-in-use location (no `location` background mode, no Always key). For background tracking while online, the Rider target must use its own Info.plist that adds `location` to `UIBackgroundModes` and `NSLocationAlwaysAndWhenInUseUsageDescription`, and be built with `--dart-define=IOS_BACKGROUND_LOCATION=true` (see docs/FLUTTER_BUILD_GUIDE.md §5 item 6). Without both, rider tracking on iOS works only while the app is open, and the background-location justification below does not apply.

## App name (max 30)
```
FeastFlow Rider
```
*15 / 30 characters*

## Subtitle (max 30)
```
Deliver food. Earn your way.
```
*28 / 30 characters*

## Category
- **Primary:** Business
- **Secondary:** Navigation

## Keywords field (max 100, comma-separated, no spaces)
```
delivery,driver,courier,partner,job,gig,bike,boy,income,shift,flexible,route,parttime,orders,tips
```
*97 / 100 characters*

Words already in the name/subtitle are deliberately excluded (Apple indexes those already). Replace generic words with your city/area names once you know your launch market (e.g. swap `near,me` for `[CITY]`), checking the count stays at or under 100.

## Promotional text (max 170, editable without a new build)
```
Go online when it suits you, get orders assigned automatically, and keep 100% of your tips. Join FeastFlow Rider in [CITY] today.
```
*129 / 170 characters*

## Description (max 4000)
*1684 / 4000 characters.* Plain text, no markup. Same body as Google Play; delete social-proof lines you cannot back with real data.

```
Earn on your own schedule. FeastFlow Rider is the delivery partner app for FeastFlow: go online, get orders assigned automatically and deliver food from local restaurants to customers nearby.

[XXX+ riders delivering in [CITY]] · [★ X.X rider rating]

WORK WHEN YOU WANT
• Go online or offline with one tap
• No fixed shifts: ride during lunch, dinner or whenever suits you

ORDERS COME TO YOU
• Orders nearby are assigned to you automatically while you're online
• See pickup and drop locations, order details and payment type before you head out
• One-tap navigation to the restaurant and the customer

SIMPLE, SECURE HANDOVER
• Mark pickup once the restaurant hands over the order
• Confirm delivery with the customer's 4-digit OTP
• Add a photo as proof of delivery when needed

CLEAR EARNINGS
• Earn a base payout plus a per-km amount on every delivery [UPDATE TO MATCH YOUR RATES]
• Keep 100% of customer tips
• Track your earnings and delivery history in the app

HOW TO JOIN
1. Download FeastFlow Rider and register with your details and documents [LIST REQUIRED DOCUMENTS]
2. Our team reviews and approves your profile
3. Go online and start delivering

ABOUT LOCATION
While you are online or on an active delivery, FeastFlow Rider uses your location, including in the background, to assign nearby orders, show customers live delivery tracking and calculate distance-based earnings. Location sharing stops when you go offline.

WHAT RIDERS SAY
"[REAL RIDER QUOTE — use only with permission]" — [FIRST NAME], [CITY]

Rider support: [RIDER SUPPORT EMAIL] · [SUPPORT PHONE]
Privacy policy: [PRIVACY POLICY URL] · Terms: [TERMS URL]
FeastFlow is operated by [COMPANY LEGAL NAME].
```

**Support URL:** [SUPPORT URL] · **Marketing URL:** [WEBSITE URL] · **Copyright:** © [YEAR] [COMPANY LEGAL NAME]

## Screenshot captions (8)
Sizes: 6.9" (1320×2868) required; 6.5" (1284×2778) optional. Copy and design notes: `screenshot-copy.md`.

| # | Caption (chars) | Supporting line | Screen to capture |
|---|---|---|---|
| 1 | **Go online. Start earning.** (25) | One-tap online/offline toggle | Rider home with large Online toggle switched on |
| 2 | **Orders come to you** (18) | Auto-assigned orders nearby | New assignment card with pickup, drop, distance, payout |
| 3 | **Navigate in one tap** (19) | Directions to pickup and drop | Active delivery screen with map route and Navigate button |
| 4 | **Pick up, then head out** (22) | Clear pickup flow at the restaurant | Pickup step with order items and Mark Picked Up button |
| 5 | **Hand over with an OTP** (21) | Secure 4-digit delivery confirmation | OTP entry screen at drop-off |
| 6 | **Photo proof, no disputes** (24) | Optional proof-of-delivery photo | Camera/photo proof step with captured image |
| 7 | **Keep 100% of your tips** (22) | Base + per-km pay, tips are all yours | Earnings screen with base, distance and tip breakdown |
| 8 | **Every trip, on record** (21) | Full delivery history | Delivery history list with dates and earnings |

## App Review notes (App Review Information → Notes)

**Demo account** (create a dedicated reviewer account on your production backend; do not reuse seed accounts like customer@example.com):
- Email: [REVIEW DEMO EMAIL]
- Password: [REVIEW DEMO PASSWORD]
- Sign in with **Email + password** on the login screen. (this account is an **approved** rider).

**OTP login:** If the reviewer chooses phone login, OTPs are sent by SMS (Twilio). Provide a reviewer phone number with a fixed/visible OTP if your backend supports one [VERIFY: e.g. a whitelisted test number], or ask the reviewer to use the email login above. OTP length is 6 digits.

**Sign in with Apple:** The app offers Google sign-in, so Sign in with Apple is also offered (Guideline 4.8), controlled by the `appleSignIn` feature flag in Admin Panel → Config → Feature Flags. Keep it **ON** for the iOS submission.

**How to test**
1. Sign in and allow location access ("While Using" is enough; needed for deliveries, see below).
2. Tap **Go Online**. To receive an assignment, place an order from the FeastFlow customer app ([REVIEW CUSTOMER DEMO EMAIL]/[REVIEW DEMO PASSWORD]) at [DEMO RESTAURANT NAME], or ask us to trigger one during review hours [HOURS + TIMEZONE]. Orders are auto-assigned to online riders nearby; the reviewer's location may be outside our service area, so the demo rider account is [VERIFY: configured to receive orders regardless of distance / we will assign manually].
3. Navigate → Mark Picked Up → enter the 4-digit delivery OTP shown in the customer app → optionally take a proof photo → Delivered.
4. Earnings and History show completed deliveries.

**Background location justification (Guideline 2.5.4 / 5.1.1):** FeastFlow Rider is a delivery-partner app. While the rider is **online or on an active delivery**, the app needs continuous location even when the screen is off or another navigation app is in the foreground, so that (a) the customer sees the rider's live position and ETA, (b) the platform can auto-assign the nearest orders, and (c) distance-based earnings are calculated. Location updates stop when the rider goes offline. The `location` background mode is declared (in the Rider target only) for this purpose only, and iOS shows the background location indicator while it is in use. The Always usage string reads: "[RIDER NSLocationAlwaysAndWhenInUseUsageDescription TEXT — e.g. Your location is shared with customers while you are delivering an order.]"

**Camera:** used to take an optional proof-of-delivery photo.

**Who can use this app:** Riders who registered and were approved by [COMPANY LEGAL NAME]. New sign-ups see a pending-approval screen until approved.

**Account deletion (Guideline 5.1.1(v)):** Profile → Settings → Delete account. Deletion is immediate after confirmation.

Contact during review: [REVIEW CONTACT NAME], [REVIEW CONTACT PHONE], [REVIEW CONTACT EMAIL].

## Privacy nutrition label (App Privacy) suggestions
**Data Used to Track You:** None (no third-party advertising or cross-app tracking SDKs in the codebase). Do not show the ATT prompt. Revisit if you add ad/attribution SDKs.

**Data Linked to You:**

| Category | Data types | Purpose |
|---|---|---|
| Contact Info | Name, Email Address, Phone Number | App Functionality |
| Location | Precise Location, Coarse Location | App Functionality |
| Financial Info | Other Financial Info (earnings, payout details) | App Functionality |
| User Content | Photos (proof of delivery) | App Functionality |
| Sensitive Info / Other Data | Identity/vehicle documents if collected [VERIFY] | App Functionality |
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
| User-generated content | No |
| Messaging and chat | No (no in-app chat) |
| Gambling | No |
| Age assurance / parental controls | No |

Expected rating: **4+** (Apple may assign a higher age if UGC is declared; that is fine). Riders must be adults; enforce the minimum age [MINIMUM RIDER AGE] in registration and terms.
