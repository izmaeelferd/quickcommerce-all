# Google Play listing: FeastFlow Rider (Delivery (Rider) app)

Flavor: `delivery` · Build: `flutter build appbundle --flavor delivery -t lib/main_delivery.dart --dart-define-from-file=env/prod.json` (see docs/FLUTTER_BUILD_GUIDE.md)

> **Before you submit:** replace every `[BRACKETED PLACEHOLDER]`. Never publish invented ratings, user counts, awards or press quotes; fill social-proof slots only with real, verifiable numbers, or delete them. The app name shown to users is set in **Admin Panel → Config → Branding**; keep it identical to the store name.

### Pre-submission technical checks (from the codebase)
- The Rider flavor's `android/app/src/delivery/AndroidManifest.xml` adds `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` (no `ACCESS_BACKGROUND_LOCATION`). While the rider is online, GPS streams through a location foreground service with a persistent notification ("You are online / Sharing your location for deliveries. Go offline to stop."), so tracking continues when the app is backgrounded; it stops when the rider goes offline. In Play Console complete the **Foreground service permissions** declaration (Policy → App content) for the **location** type, with a short video showing the rider going online, the notification, and live delivery tracking. The background-location (`ACCESS_BACKGROUND_LOCATION`) declaration is **not** needed. Reuse the "ABOUT LOCATION" paragraph of the full description below and the background-location justification in `app-store-delivery.md`.
- The main manifest sets `android:usesCleartextTraffic="false"` (only the debug/profile manifests re-enable it for local development). Point production builds at an `https://` API (`wss://` for sockets) so the "data encrypted in transit" answer stays true.

## App title (max 30)
```
FeastFlow Rider: Deliver Food
```
*29 / 30 characters*

## Short description (max 80)
```
Deliver food with FeastFlow. Go online, get orders, earn per km + 100% tips.
```
*76 / 80 characters*

## Full description (max 4000)
*1684 / 4000 characters.* Plain text; Play renders line breaks and bullets (•). Delete the social-proof lines if you have no real numbers yet.

```
Earn on your own schedule. FeastFlow Rider is the delivery partner app for FeastFlow: go online, get orders assigned automatically and deliver food from local restaurants to customers nearby.

[XXX+ riders delivering in [CITY]] · [X.X/5 rider rating]

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

## Category and tags
- **Category:** Maps & Navigation
- **Tags (Store settings → Tags, pick up to 5):** Delivery jobs, Courier, Earn money, Gig work, Navigation
- **Contact details:** email [SUPPORT EMAIL] · website [WEBSITE URL] · phone [SUPPORT PHONE] (optional)
- **Privacy policy URL:** [PRIVACY POLICY URL] (publish from Admin Panel → Config → Legal Pages)

## Content rating questionnaire (IARC)
Category to choose: **"All Other App Types"** (not a game). Suggested answers:

| Question area | Answer | Notes |
|---|---|---|
| Violence | **No** | No violent content. |
| Sexual content / nudity | **No** | Restaurant and dish images only. |
| Profanity / crude language | **No** | User reviews can contain text; they are moderated by admins (see UGC). |
| Controlled substances: drugs | **No** | |
| Controlled substances: alcohol | **No** | FeastFlow does not sell alcohol or tobacco. There is no age-verification or alcohol feature in the platform. If you ever allow restaurants to list alcohol, you must add age gating, comply with local excise law, and re-answer this questionnaire (rating will rise). Tell vendors in your partner terms not to list alcohol/tobacco. |
| Controlled substances: tobacco | **No** | |
| Gambling / simulated gambling | **No** | Coupons and referral credits are not games of chance. |
| Users can interact / user-generated content | **No.** Riders do not post public content. There is no in-app chat. Riders may phone the customer or restaurant using the device dialer. | |
| Shares user location with other users | **Yes.** While the rider is online or on an active delivery, their live GPS location is shared with the customer for that order (live tracking) and with the platform for order assignment. Answer **Yes** to "Does the app share the user's current physical location with other users?" | |
| Digital purchases | **No.** Riders receive earnings; there are no purchases in the app. | |
| Unrestricted internet / web browser | **No** | Legal pages open in-app / external browser links only. |

Expected result: **IARC 3+ / PEGI 3 / ESRB Everyone** (Google may display "Users Interact" for the customer and partner apps).
Target audience (App content → Target audience): **18+** recommended for riders and partners (workers/businesses). Do not opt into the Designed for Families program.

## Data safety form
Answers below reflect what the codebase does; tick only what your deployment actually does and mark anything you add (analytics SDKs, crash reporting) accordingly.

**Overview answers**
- Does your app collect or share any required user data types? **Yes**
- Is all user data encrypted in transit? **Yes** (HTTPS/TLS via Nginx + certbot; WSS for sockets). *Release builds block cleartext traffic; make sure the production API URL is https.*
- Do you provide a way for users to request that their data is deleted? **Yes**: in-app via **Profile → Settings → Delete account** (calls `DELETE /api/users/profile`), and by email to [PRIVACY EMAIL]. Also provide the web deletion URL Play requires: [ACCOUNT DELETION URL].
- Committed to Play Families Policy? **No** (not a children's app).
- Independent security review? **No** (unless you obtain one).

**Data types**

| Data type | Collected | Shared | Required / optional | Purposes |
|---|---|---|---|---|
| Personal info: Name | Yes | Yes (to customers/platform as needed for orders) | Required | Account management, App functionality |
| Personal info: Email address | Yes | No | Required | Account management, Communications |
| Personal info: Phone number | Yes | Yes (rider/restaurant can call about the order) | Required | Account management, App functionality, Communications (SMS OTP) |
| Location: Precise (incl. background while online) | Yes | Yes (live position shown to the customer of the active order) | Required to deliver | App functionality |
| Location: Approximate | Yes | No | Required | App functionality |
| Personal info: Other info (vehicle/ID documents) [VERIFY what you collect] | Yes | No | Required | Account management, Fraud prevention, security & compliance |
| Financial info: Other financial info (earnings, bank/payout details) | Yes | Yes (payment provider for payouts) | Required | App functionality |
| Photos (proof-of-delivery photos) | Yes | Yes (visible to admin/support for disputes) [VERIFY] | Required when enabled | App functionality, Fraud prevention |
| App activity: In-app actions (delivery history) | Yes | No | Required | App functionality |
| Device or other IDs (FCM push token) | Yes | Yes (Google Firebase Cloud Messaging, as processor) | Required for assignments | App functionality |

"Shared" here means transferred to a third party other than your own service providers. Google does not count transfers to service providers acting on your behalf (e.g. Firebase, Twilio, SMTP host, S3 storage) as sharing, but **does** count giving data to other users (restaurant, rider, customer). Data retained for legal/tax reasons after deletion (e.g. invoices) should be disclosed in your privacy policy ([PRIVACY POLICY URL]).

## Screenshot captions (8 slots)
Phone screenshots 1080×1920 (or 1080×2340); captions are overlaid on the image. Full copy and design notes: `screenshot-copy.md`.

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

## Feature graphic (1024×500) text overlay options
Keep text inside the central safe area (avoid the outer ~15%); max ~6 words in the headline; no rating badges or "#1" claims.

1. **Headline:** "Deliver with FeastFlow. Earn your way." (38 chars)  
   **Sub-line:** "Flexible hours · Per-km pay · 100% tips"
2. **Headline:** "Your bike. Your hours. Your earnings." (37 chars)  
   **Sub-line:** "Join FeastFlow Rider in [CITY]"
3. **Headline:** "Keep 100% of your tips" (22 chars)  
   **Sub-line:** "Go online any time and start delivering"

## ASO keywords (for title/short/full description weaving; Play has no keyword field)
1. delivery partner
2. delivery boy job
3. food delivery job
4. rider app
5. courier app
6. delivery driver
7. part time job
8. earn money
9. flexible job
10. gig work
11. bike delivery
12. delivery jobs near me
13. food delivery rider
14. earn daily
15. side income
16. delivery earnings
17. delivery partner app
18. work from bike
19. weekend job
20. [CITY] delivery jobs
21. [CITY] rider job

Use the top 5 naturally in the full description 2-3 times each; avoid keyword stuffing (Play policy). Replace `[CITY]` with real service areas.

## What's New (release notes), max 500 characters per language

**v1.0.0**
```
FeastFlow Rider launches!
• One-tap online/offline
• Auto-assigned orders nearby
• Navigation to pickup and drop
• OTP + photo proof of delivery
• Earnings: base + per km + 100% of tips
Rider support: [RIDER SUPPORT EMAIL]
```
*222 / 500 characters*

**Template for future releases**
```
v[X.Y.Z]
New
• [Feature users will notice, written as a benefit]
Improved
• [Speed / UX improvement]
Fixed
• [Bug users reported]
Thanks for the feedback! [SUPPORT EMAIL]
```
*170 / 500 characters (before filling placeholders; re-check after)*

Tips: lead with the most visible change; never mention internal tickets; keep a separate note per language in Play Console → Release → Release notes.
