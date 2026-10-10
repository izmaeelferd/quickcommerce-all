# Apple App Store listing: FeastFlow: Food Delivery (Customer app)

> **Before you submit:** replace every `[BRACKETED PLACEHOLDER]`. Never publish invented ratings, user counts, awards or press quotes; fill social-proof slots only with real, verifiable numbers, or delete them. The app name shown to users is set in **Admin Panel → Config → Branding**; keep it identical to the store name.

> **iOS build check:** `ios/Runner/Info.plist` is shared by all flavors and declares `UIBackgroundModes` → `location` plus `NSLocationAlwaysAndWhenInUseUsageDescription`. These are only justified for the Rider app. Remove them from the Customer app build (per-flavor Info.plist or build-time plist edit), or App Review will likely reject under Guideline 2.5.4.

## App name (max 30)
```
FeastFlow: Food Delivery
```
*24 / 30 characters*

## Subtitle (max 30)
```
Local restaurants, live track
```
*29 / 30 characters*

## Category
- **Primary:** Food & Drink
- **Secondary:** Lifestyle

## Keywords field (max 100, comma-separated, no spaces)
```
dishes,order,meal,takeaway,dinner,lunch,veg,biryani,pizza,cod,upi,tracking,near,me,eat,cuisine
```
*94 / 100 characters*

Words already in the name/subtitle are deliberately excluded (Apple indexes those already). Replace generic words with your city/area names once you know your launch market (e.g. swap `near,me` for `[CITY]`), checking the count stays at or under 100.

## Promotional text (max 170, editable without a new build)
```
New on FeastFlow: schedule lunch or dinner for a delivery slot that suits you, and use code WELCOME50 for 50% off your first order (T&Cs apply).
```
*144 / 170 characters*

## Description (max 4000)
*2169 / 4000 characters.* Plain text, no markup. Same body as Google Play; delete social-proof lines you cannot back with real data.

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

**Support URL:** [SUPPORT URL] · **Marketing URL:** [WEBSITE URL] · **Copyright:** © [YEAR] [COMPANY LEGAL NAME]

## Screenshot captions (8)
Sizes: 6.9" (1320×2868) required; 6.5" (1284×2778) optional. Copy and design notes: `screenshot-copy.md`.

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

## App Review notes (App Review Information → Notes)

**Demo account** (create a dedicated reviewer account on your production backend; do not reuse seed accounts like customer@example.com):
- Email: [REVIEW DEMO EMAIL]
- Password: [REVIEW DEMO PASSWORD]
- Sign in with **Email + password** on the login screen.

**OTP login:** If the reviewer chooses phone login, OTPs are sent by SMS (Twilio). Provide a reviewer phone number with a fixed/visible OTP if your backend supports one [VERIFY: e.g. a whitelisted test number], or ask the reviewer to use the email login above. OTP length is 6 digits.

**Sign in with Apple:** The app offers Google sign-in, so Sign in with Apple is also offered (Guideline 4.8), controlled by the `appleSignIn` feature flag in Admin Panel → Config → Feature Flags. Keep it **ON** for the iOS submission.

**How to test ordering**
1. Allow location (or type an address); the demo account has a saved address in [REVIEW CITY / AREA] where test restaurants are open.
2. Open any restaurant on Home, add an item (try add-ons), go to Cart.
3. Choose **Cash on Delivery** to place a real order without payment, or use the payment gateway test mode if this build points at a test backend [STATE WHICH].
4. Track the order on the tracking screen. Our team will move it through Accepted → Preparing → Ready → Picked → Delivered during review hours [REVIEW SUPPORT HOURS + TIMEZONE], or the reviewer can see a completed demo order in Orders.
5. Coupons: apply [REVIEW COUPON CODE] on the cart.

**Payments:** All purchases are physical goods (food) and delivery services, paid via Razorpay/Stripe, UPI or COD, so In-App Purchase does not apply (Guideline 3.1.3(e)). The wallet stores refunds/referral credit and optional top-ups that can only be spent on food orders.

**Location:** "When In Use" location is used only to show restaurants that deliver to the user and to pre-fill the delivery address. The customer app does not use background location. [Ensure UIBackgroundModes `location` and the Always usage string are removed from the customer build.]

**Account deletion (Guideline 5.1.1(v)):** Profile → Settings → Delete account. Deletion is immediate after confirmation.

Contact during review: [REVIEW CONTACT NAME], [REVIEW CONTACT PHONE], [REVIEW CONTACT EMAIL].

## Privacy nutrition label (App Privacy) suggestions
**Data Used to Track You:** None (no third-party advertising or cross-app tracking SDKs in the codebase). Do not show the ATT prompt. Revisit if you add ad/attribution SDKs.

**Data Linked to You:**

| Category | Data types | Purpose |
|---|---|---|
| Contact Info | Name, Email Address, Phone Number, Physical Address | App Functionality |
| Location | Precise Location, Coarse Location | App Functionality |
| Financial Info | Payment Info (via Razorpay/Stripe; declare if your SDK config collects it) [VERIFY] | App Functionality |
| User Content | Photos (optional), Other User Content (reviews) | App Functionality |
| Purchases | Purchase History (orders) | App Functionality |
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
