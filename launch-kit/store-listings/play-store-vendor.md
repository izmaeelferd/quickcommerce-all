# Google Play listing: FeastFlow Partner (Vendor (Partner) app)

Flavor: `vendor` · Build: `flutter build appbundle --flavor vendor -t lib/main_vendor.dart --dart-define-from-file=env/prod.json` (see docs/FLUTTER_BUILD_GUIDE.md)

> **Before you submit:** replace every `[BRACKETED PLACEHOLDER]`. Never publish invented ratings, user counts, awards or press quotes; fill social-proof slots only with real, verifiable numbers, or delete them. The app name shown to users is set in **Admin Panel → Config → Branding**; keep it identical to the store name.

### Pre-submission technical checks (from the codebase)
- `android/app/src/main/AndroidManifest.xml` (shared by all flavors) declares only foreground location (`ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`), with no `ACCESS_BACKGROUND_LOCATION` or foreground-service permissions; those are added only by the Rider flavor's `android/app/src/delivery/AndroidManifest.xml`. The Vendor (Partner) app uses when-in-use location only, so no background-location or foreground-service declaration is needed in Play Console.
- The main manifest sets `android:usesCleartextTraffic="false"` (only the debug/profile manifests re-enable it for local development). Point production builds at an `https://` API (`wss://` for sockets) so the "data encrypted in transit" answer stays true.

## App title (max 30)
```
FeastFlow Partner: Restaurant
```
*29 / 30 characters*

## Short description (max 80)
```
Manage FeastFlow orders, menu, timings and payouts for your restaurant.
```
*71 / 80 characters*

## Full description (max 4000)
*1754 / 4000 characters.* Plain text; Play renders line breaks and bullets (•). Delete the social-proof lines if you have no real numbers yet.

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

## Category and tags
- **Category:** Business
- **Tags (Store settings → Tags, pick up to 5):** Restaurant management, Order management, Food business, Point of sale (orders), Merchant app
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
| Users can interact / user-generated content | **Yes (limited).** Restaurant partners can post public replies to customer reviews. Admins can hide reviews from Admin Panel → Operations → Reviews. No in-app chat or open messaging. | |
| Shares user location with other users | **No.** The partner can optionally tap "use current location" once to pin the restaurant on the map (foreground only). That fixed restaurant location is shown to customers and riders as the pickup point; the partner's live location is never shared or tracked. | |
| Digital purchases | **No.** Vendors receive payouts; there are no purchases in the app. | |
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
| Personal info: Address (restaurant address) | Yes | Yes (shown to customers/riders) | Required | App functionality |
| Personal info: Other info (restaurant/business details, GST/FSSAI numbers if collected) [VERIFY] | Yes | No | Required | Account management |
| Location: Precise (one-time, to pin the restaurant on the map) | Yes | Yes (restaurant pickup location shown to customers/riders) | Optional (address can be typed) | App functionality |
| Financial info: Other financial info (bank/payout details, earnings) | Yes | Yes (payment provider for payouts) | Required | App functionality, Account management |
| Financial info: Purchase history (orders received) | Yes | No | Required | App functionality |
| Photos (menu/restaurant images) | Yes | Yes (shown publicly in the customer app) | Optional | App functionality |
| App activity: Other user-generated content (review replies) | Yes | Yes (public) | Optional | App functionality |
| Device or other IDs (FCM push token) | Yes | Yes (Google Firebase Cloud Messaging, as processor) | Required for order alerts | App functionality |

"Shared" here means transferred to a third party other than your own service providers. Google does not count transfers to service providers acting on your behalf (e.g. Firebase, Twilio, SMTP host, S3 storage) as sharing, but **does** count giving data to other users (restaurant, rider, customer). Data retained for legal/tax reasons after deletion (e.g. invoices) should be disclosed in your privacy policy ([PRIVACY POLICY URL]).

## Screenshot captions (8 slots)
Phone screenshots 1080×1920 (or 1080×2340); captions are overlaid on the image. Full copy and design notes: `screenshot-copy.md`.

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

## Feature graphic (1024×500) text overlay options
Keep text inside the central safe area (avoid the outer ~15%); max ~6 words in the headline; no rating badges or "#1" claims.

1. **Headline:** "Grow your restaurant with FeastFlow" (35 chars)  
   **Sub-line:** "Orders · Menu · Payouts in one app"
2. **Headline:** "Every order. One tap away." (26 chars)  
   **Sub-line:** "Accept, prepare and hand over with ease"
3. **Headline:** "Your kitchen, in your pocket" (28 chars)  
   **Sub-line:** "Manage menu, timings and earnings anywhere"

## ASO keywords (for title/short/full description weaving; Play has no keyword field)
1. restaurant partner app
2. restaurant order management
3. restaurant manager
4. food business app
5. restaurant owner app
6. accept food orders
7. kitchen order app
8. menu management
9. restaurant menu editor
10. merchant app
11. vendor app
12. restaurant payouts
13. restaurant earnings
14. cloud kitchen app
15. home chef orders
16. cafe order app
17. food delivery partner
18. sell food online
19. restaurant reviews reply
20. order alerts
21. restaurant timings
22. [CITY] restaurant partner

Use the top 5 naturally in the full description 2-3 times each; avoid keyword stuffing (Play policy). Replace `[CITY]` with real service areas.

## What's New (release notes), max 500 characters per language

**v1.0.0**
```
FeastFlow Partner is here!
• Instant new-order alerts with accept timer
• Preparing / Ready status updates
• Menu, categories, add-ons & availability
• Opening timings and open/close toggle
• Earnings, payouts and review replies
Partner support: [PARTNER SUPPORT EMAIL]
```
*269 / 500 characters*

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
