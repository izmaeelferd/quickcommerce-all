# Google Play listing: FeastFlow (Customer app)

Flavor: `customer` · Build: `flutter build appbundle --flavor customer -t lib/main_customer.dart --dart-define-from-file=env/prod.json` (see docs/FLUTTER_BUILD_GUIDE.md)

> **Before you submit:** replace every `[BRACKETED PLACEHOLDER]`. Never publish invented ratings, user counts, awards or press quotes; fill social-proof slots only with real, verifiable numbers, or delete them. The app name shown to users is set in **Admin Panel → Config → Branding**; keep it identical to the store name.

### Pre-submission technical checks (from the codebase)
- All three flavors share `android/app/src/main/AndroidManifest.xml`, which declares `ACCESS_BACKGROUND_LOCATION` and `FOREGROUND_SERVICE_LOCATION` (needed only by the Rider app). The Customer app does **not** need background location. Remove them for this flavor (e.g. add `android/app/src/customer/AndroidManifest.xml` with `tools:node="remove"` on those permissions), or Play will require a background-location declaration and is likely to reject it.
- `android:usesCleartextTraffic="true"` is set in the main manifest. Point production builds at an `https://` API and set it to `false` so the "data encrypted in transit" answer is true.

## App title (max 30)
```
FeastFlow: Food Delivery
```
*24 / 30 characters*

## Short description (max 80)
```
Order from local restaurants. Live tracking, UPI, COD & scheduled delivery.
```
*75 / 80 characters*

## Full description (max 4000)
*2169 / 4000 characters.* Plain text; Play renders line breaks and bullets (•). Delete the social-proof lines if you have no real numbers yet.

```
Hungry? FeastFlow brings your favourite local restaurants to your door, with live tracking from kitchen to doorstep.

[★ X.X rating from X,XXX reviews] · [XXX+ restaurants in [CITY]]

WHY FEASTFLOW
• Local favourites: browse restaurants near you by cuisine, category, top rated and featured picks
• Find it fast: search with filters, plus a one-tap Veg-only filter
• Order your way: customise dishes with add-ons, then pay by UPI, card, wallet or cash on delivery
• Know where your food is: follow your order live on a map, from "accepted" to "delivered"
• Safe handover: share a short delivery OTP with your rider so the order reaches the right person

ORDER NOW OR LATER
Order for right now, or schedule delivery in a Lunch, Snacks or Dinner slot. Planning ahead has never been easier.

SAVE ON EVERY ORDER
• Offers screen with live coupons and deals
• First-order welcome offer [UPDATE TO MATCH YOUR ACTIVE COUPON]
• Free delivery above a minimum order value [AMOUNT]
• FeastFlow Wallet for refunds, referral rewards and faster checkout
• Refer friends: you both earn wallet credit

MADE FOR YOU
• Save favourite restaurants and multiple delivery addresses
• Reorder past meals in a couple of taps
• Rate and review restaurants to help others choose
• Tip your rider (100% of tips go to the rider)
• Call the restaurant directly from your order
• Sign in with phone OTP, email, Google or Apple
• Available in English, Hindi, Spanish, Arabic and French
• Light and dark mode

TRANSPARENT & FAIR
See delivery fee, taxes, packaging and tip clearly before you pay. If a restaurant can't accept your order, or an order is cancelled, refunds for prepaid orders go back to your original payment method (or to your wallet).

WHAT CUSTOMERS SAY
"[REAL CUSTOMER QUOTE — use only with permission]" — [FIRST NAME], [CITY]
"[REAL CUSTOMER QUOTE — use only with permission]" — [FIRST NAME], [CITY]

Now delivering in [CITY / SERVICE AREAS]. Availability, offers and fees depend on your location and the restaurant.

Need help? Write to [SUPPORT EMAIL] or visit [WEBSITE URL].
Privacy policy: [PRIVACY POLICY URL] · Terms: [TERMS URL]
FeastFlow is operated by [COMPANY LEGAL NAME].
```

## Category and tags
- **Category:** Food & Drink
- **Tags (Store settings → Tags, pick up to 5):** Food delivery, Restaurants, Online ordering, Takeout & delivery, Local food
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
| Users can interact / user-generated content | **Yes.** Users can post star ratings and text reviews of restaurants. Reviews are moderated: Admin Panel → Operations → Reviews can hide or show any review. Users cannot message each other in-app (there is no in-app chat; the "contact" button calls the restaurant by phone). | |
| Shares user location with other users | **Yes, with the user's permission:** precise location is used to find nearby restaurants and set the delivery address (foreground only). It is shared with the assigned restaurant and rider only as the delivery address. Users do not share their live location with other users. | |
| Digital purchases | **No digital goods.** Customers pay for physical goods (food) and delivery via Razorpay/Stripe, UPI or COD. Google Play Billing is not required for physical goods. The FeastFlow Wallet holds money used only for food orders and refunds. Answer **No** to "Does the app contain digital purchases?" (If the questionnaire asks generically about purchases, state: real-world goods/services only.) | |
| Unrestricted internet / web browser | **No** | Legal pages open in-app / external browser links only. |

Expected result: **IARC 3+ / PEGI 3 / ESRB Everyone** (Google may display "Users Interact" for the customer and partner apps).
Target audience (App content → Target audience): **18+** recommended for the customer app as well, since payments and COD are involved; at minimum select 13+ and not "children". Do not opt into the Designed for Families program.

## Data safety form
Answers below reflect what the codebase does; tick only what your deployment actually does and mark anything you add (analytics SDKs, crash reporting) accordingly.

**Overview answers**
- Does your app collect or share any required user data types? **Yes**
- Is all user data encrypted in transit? **Yes** (HTTPS/TLS via Nginx + certbot; WSS for sockets). *Only true once cleartext traffic is disabled and the API URL is https.*
- Do you provide a way for users to request that their data is deleted? **Yes**: in-app via **Profile → Settings → Delete account** (calls `DELETE /api/users/profile`), and by email to [PRIVACY EMAIL]. Also provide the web deletion URL Play requires: [ACCOUNT DELETION URL].
- Committed to Play Families Policy? **No** (not a children's app).
- Independent security review? **No** (unless you obtain one).

**Data types**

| Data type | Collected | Shared | Required / optional | Purposes |
|---|---|---|---|---|
| Personal info: Name | Yes | Yes (to restaurant/rider for the order) | Required | Account management, App functionality |
| Personal info: Email address | Yes | No | Optional (phone OTP login possible) | Account management, Communications |
| Personal info: Phone number | Yes | Yes (rider/restaurant can call about the order) | Required | Account management, App functionality, Communications (SMS OTP) |
| Personal info: Address | Yes | Yes (delivery address to restaurant and rider) | Required | App functionality |
| Location: Precise | Yes | Yes (as delivery address) | Optional (can type address) | App functionality |
| Location: Approximate | Yes | No | Optional | App functionality |
| Financial info: Purchase history | Yes | No | Required | App functionality, Account management |
| Financial info: Payment info | No* | Yes (processed by Razorpay/Stripe) | Optional (COD/wallet) | App functionality, Fraud prevention |
| Photos | Yes (only if user uploads a profile/review photo) | No | Optional | App functionality |
| App activity: In-app actions / other user-generated content (reviews) | Yes | No | Optional | App functionality, Analytics (internal reports) |
| App activity: In-app search history | No (not stored server-side) [VERIFY] | No | - | - |
| Device or other IDs (FCM push token) | Yes | Yes (Google Firebase Cloud Messaging, as processor) | Required for push | App functionality (notifications) |

\* Card/UPI details are entered in the Razorpay/Stripe checkout and are not stored on FeastFlow servers. Google lets you declare this as collected by the payment SDK; if in doubt, declare Payment info as **Collected + Shared** with purpose "App functionality".

"Shared" here means transferred to a third party other than your own service providers. Google does not count transfers to service providers acting on your behalf (e.g. Firebase, Twilio, SMTP host, S3 storage) as sharing, but **does** count giving data to other users (restaurant, rider, customer). Data retained for legal/tax reasons after deletion (e.g. invoices) should be disclosed in your privacy policy ([PRIVACY POLICY URL]).

## Screenshot captions (8 slots)
Phone screenshots 1080×1920 (or 1080×2340); captions are overlaid on the image. Full copy and design notes: `screenshot-copy.md`.

| # | Caption (chars) | Supporting line | Screen to capture |
|---|---|---|---|
| 1 | **Local favourites, delivered** (27) | Featured, top-rated and nearby restaurants in one feed | Home screen with banners, category chips and featured restaurants |
| 2 | **Find it fast. Veg-only too.** (27) | Search with filters and Veg-only toggle | Search results with filters panel and Veg-only switch on |
| 3 | **Make every dish yours** (21) | Restaurant menu with add-ons | Restaurant page, add-on bottom sheet open on a popular dish |
| 4 | **Deals that actually save** (24) | Offers screen with coupons | Offers screen listing active coupons (e.g. WELCOME50, FREEDEL) |
| 5 | **Pay with UPI, card or cash** (26) | Cart with tip, coupon applied and payment options | Cart: coupon applied, tip chips, bill breakdown, payment methods |
| 6 | **Order now or schedule a slot** (28) | Lunch, Snacks and Dinner delivery slots | Checkout slot picker showing Lunch / Snacks / Dinner |
| 7 | **Watch your order arrive live** (28) | Live map tracking with rider location and ETA | Order tracking: map with rider pin, status timeline, ETA |
| 8 | **Reorder favourites in seconds** (29) | Order history, favourites, wallet & referrals | Order history with Reorder buttons (or Wallet + Refer screen) |

## Feature graphic (1024×500) text overlay options
Keep text inside the central safe area (avoid the outer ~15%); max ~6 words in the headline; no rating badges or "#1" claims.

1. **Headline:** "Your favourite food, tracked live" (33 chars)  
   **Sub-line:** "Order from local restaurants · UPI · COD"
2. **Headline:** "Hungry? FeastFlow it." (21 chars)  
   **Sub-line:** "Local restaurants delivered to your door"
3. **Headline:** "50% off your first order" (24 chars)  
   **Sub-line:** "Use code WELCOME50 · T&Cs apply [UPDATE IF CHANGED]"

## ASO keywords (for title/short/full description weaving; Play has no keyword field)
1. food delivery
2. order food online
3. restaurant delivery
4. food near me
5. online food order
6. home delivery food
7. takeaway
8. food app
9. veg food delivery
10. pure veg restaurants
11. biryani delivery
12. pizza delivery
13. lunch delivery
14. dinner delivery
15. schedule food order
16. cash on delivery food
17. UPI food order
18. food coupons
19. food offers
20. live order tracking
21. local restaurants
22. late night food
23. meal delivery
24. [CITY] food delivery
25. [CITY] restaurants

Use the top 5 naturally in the full description 2-3 times each; avoid keyword stuffing (Play policy). Replace `[CITY]` with real service areas.

## What's New (release notes), max 500 characters per language

**v1.0.0**
```
Welcome to FeastFlow!
• Order from local restaurants in [CITY]
• Live order tracking on a map
• Pay by UPI, card, wallet or cash on delivery
• Schedule delivery for lunch, snacks or dinner
• Coupons, referrals and a FeastFlow Wallet
• English, Hindi, Spanish, Arabic & French
Questions? [SUPPORT EMAIL]
```
*302 / 500 characters*

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
