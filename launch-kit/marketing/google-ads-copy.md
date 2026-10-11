# FeastFlow — Google Ads Copy Kit

Search (Responsive Search Ads), sitelinks, callouts, keyword plan and App campaign notes for the FeastFlow launch in **[CITY]**.

> **Character limits used (Google Ads):** headline ≤ 30, description ≤ 90, sitelink text ≤ 25, sitelink description lines ≤ 35 each, callout ≤ 25. Every line below was counted with Python `len()`; the count is shown next to it.
> **Placeholders:** counts include the literal placeholder text (e.g. `[CITY]` = 6 characters). After you substitute, re-check any line that contains a placeholder (a city name longer than ~9 characters can push `[CITY]'s Favourite Kitchens` over 30).
> **Offer accuracy:** codes and values below match the seeded coupons (WELCOME50, FLAT100, FREEDEL) and default Business Rules (free delivery above ₹499, COD up to ₹2,000, riders keep 100% of tips via `deliveryPartnerPayout.tipSharePercent = 100`). If you change any of these in the Admin Panel, pause or edit the matching ads the same day — Google disapproves ads whose landing page or app does not match the offer, and it is also a consumer-protection issue.

---

## 1. Account and campaign structure

| Campaign | Type | Goal | Ad groups | Budget share (launch month) | Bidding (start → after data) |
|---|---|---|---|---|---|
| `FF_Search_Brand_[CITY]` | Search | Protect brand term, cheap installs | Brand | 10% | Manual CPC / Max clicks → Target impression share |
| `FF_Search_Generic_[CITY]` | Search | Capture "food delivery" intent | Food Delivery Generic, Order Online, Near Me | 30% | Maximise conversions → Target CPA once ~30 conversions/30 days |
| `FF_Search_Offers_[CITY]` | Search | Deal seekers, first order | First-Order Offer, Free Delivery, Coupon Codes | 15% | Maximise conversions |
| `FF_Search_Cuisine_[CITY]` | Search | Dish/cuisine intent | Biryani, Pizza, North Indian, Chinese, Veg, Snacks, Lunch | 15% | Maximise conversions |
| `FF_App_Install_[CITY]` | App campaign (Android; iOS when live) | Installs → first order | Asset groups: Offer, Tracking, Local | 25% | Target CPI → switch to in-app action "first_order" |
| `FF_Search_Supply_[CITY]` | Search | Restaurant partners + riders | Restaurant Partner, Delivery Rider Jobs | 5% | Maximise conversions (lead form / registration) |

**Location targeting:** "Presence: people in or regularly in" your delivery area only. The platform has one delivery radius (`businessRules.radiusKm`, default 10 km) and no multi-city zones, so target a radius around the city centre / restaurant cluster that matches what riders can actually serve. Exclude everything else.
**Schedule:** run generic and cuisine campaigns with bid adjustments up around 11:30–14:00 and 18:30–22:30 (matches the Lunch 12–14 and Dinner 19–22 delivery slots). Reduce bids when restaurants are mostly closed.
**Languages:** English + Hindi (the app supports en, hi, es, ar, fr; add others only if you write ads in them).
**Conversion tracking:** the codebase has no built-in ad attribution SDK. Use Firebase (already in the app for FCM) + Google Analytics for Firebase to log `first_open` and a custom `first_order` event, then import into Google Ads. Until that is wired, use install counts and coupon redemptions (`WELCOME50` `usedCount` in Admin → Coupons) as proxies. Treat this as a dev task before ad spend scales.

**Naming convention:** `FF_<Type>_<Theme>_<City>` for campaigns; `AG_<Theme>` for ad groups; `RSA-NN` for ads.

---

## 2. Responsive Search Ad variants (15)

Each RSA should ideally carry 8–15 headlines and 4 descriptions. The variants below give each theme its unique assets; top them up from the **shared headline pool** (section 3). Pin "FeastFlow Food Delivery" to position 1 only in the Brand ad group; leave others unpinned so Google can test.

Final URL for all: `[APP LINK]` (store listing or a smart link that routes Android/iOS). Display path: `feastflow / [city]`.

### RSA-01 Brand core (Ad group: Brand)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | FeastFlow Food Delivery | 23 |
| Headline 2 | Order Food in [CITY] | 20 |
| Headline 3 | Live Rider Tracking | 19 |
| Headline 4 | Pay by UPI, Card or COD | 23 |
| Headline 5 | 50% Off Your First Order | 24 |
| Headline 6 | Download FeastFlow Today | 24 |
| Description 1 | Order from local restaurants in [CITY] and track your rider live on the map. | 76 |
| Description 2 | New here? Use WELCOME50 for 50% off your first order (max ₹150, min ₹199). | 74 |

### RSA-02 First-order offer (Ad group: First-Order Offer)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Use Code WELCOME50 | 18 |
| Headline 2 | 50% Off First Order | 19 |
| Headline 3 | Save Up to ₹150 Today | 21 |
| Headline 4 | New User Offer in [CITY] | 24 |
| Headline 5 | Hungry? Order in Minutes | 24 |
| Description 1 | 50% off your first FeastFlow order, up to ₹150 on orders above ₹199. T&C apply. | 79 |
| Description 2 | Browse menus, add to cart, apply WELCOME50 and pay by UPI, card, wallet or COD. | 79 |

### RSA-03 Free delivery (Ad group: Free Delivery)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Free Delivery Above ₹499 | 24 |
| Headline 2 | Code FREEDEL Above ₹249 | 23 |
| Headline 3 | No Delivery Fee Today | 21 |
| Headline 4 | Free Delivery, Fresh Food | 25 |
| Description 1 | Orders above ₹499 get free delivery. Use FREEDEL for free delivery above ₹249. | 78 |
| Description 2 | Order from [CITY] restaurants and skip the delivery fee on eligible orders. | 75 |

### RSA-04 Live tracking (Ad group: Food Delivery Generic)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Track Your Order Live | 21 |
| Headline 2 | See Your Rider on the Map | 25 |
| Headline 3 | Watch Your Order Arrive | 23 |
| Headline 4 | Secure OTP Handover | 19 |
| Description 1 | Follow every step: accepted, preparing, picked up, on the way. Live on the map. | 79 |
| Description 2 | Your order is handed over only with your 4-digit delivery OTP. Safe and simple. | 79 |

### RSA-05 Scheduled lunch (Ad group: Lunch)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Schedule Lunch Delivery | 23 |
| Headline 2 | Pick a 12–2 PM Slot | 19 |
| Headline 3 | Lunch Sorted in Advance | 23 |
| Headline 4 | Order Now, Eat at Noon | 22 |
| Description 1 | Pre-order lunch for the 12–2 PM slot and get on with your morning. | 66 |
| Description 2 | Schedule Lunch, Snacks or Dinner slots on FeastFlow. Order ahead, eat on time. | 78 |

### RSA-06 Dinner (Ad group: Order Online)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Dinner Delivered Tonight | 24 |
| Headline 2 | Dinner Slots 7–10 PM | 20 |
| Headline 3 | Your Dinner, Your Way | 21 |
| Headline 4 | Order Dinner on FeastFlow | 25 |
| Description 1 | From comfort food to new cuisines, get dinner from [CITY] restaurants tonight. | 78 |
| Description 2 | Order now or schedule a 7–10 PM dinner slot. Pay by UPI, card, wallet or COD. | 77 |

### RSA-07 Veg only (Ad group: Veg)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Pure Veg Filter | 15 |
| Headline 2 | Veg-Only Filter in 1 Tap | 24 |
| Headline 3 | Veg-Only Food Delivery | 22 |
| Headline 4 | Filter Veg Dishes Fast | 22 |
| Description 1 | Turn on the veg-only filter and see vegetarian dishes from [CITY] restaurants. | 78 |
| Description 2 | Search by dish, cuisine or restaurant, then filter to veg in a single tap. | 74 |

> The veg filter relies on restaurants tagging items correctly in their menu. Audit veg tagging for your launch restaurants before running this group.

### RSA-08 Payment choice (Ad group: Order Online)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Pay With UPI or COD | 19 |
| Headline 2 | Cash on Delivery Available | 26 |
| Headline 3 | Wallet, Card, UPI, COD | 22 |
| Headline 4 | Pay the Way You Like | 20 |
| Description 1 | Pay with UPI, card, FeastFlow wallet or cash on delivery (COD up to ₹2,000). | 76 |
| Description 2 | Checkout in seconds with the payment method you trust. Order food on FeastFlow. | 79 |

### RSA-09 Reorder (Ad group: Brand / remarketing lists)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Reorder in One Tap | 18 |
| Headline 2 | Your Favourites, Saved | 22 |
| Headline 3 | Order Again in Seconds | 22 |
| Headline 4 | Save Restaurants You Love | 25 |
| Description 1 | Loved it? Reorder from your order history in a tap and save your favourite spots. | 81 |
| Description 2 | FeastFlow remembers your addresses and favourites so ordering stays quick. | 74 |

### RSA-10 Referral (Ad group: Coupon Codes)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Refer a Friend, Get ₹50 | 23 |
| Headline 2 | Invite Friends to FeastFlow | 27 |
| Headline 3 | Share Your Referral Code | 24 |
| Headline 4 | ₹50 for You and a Friend | 24 |
| Description 1 | Share your referral code. Your friend gets ₹50 in their wallet when they sign up. | 81 |
| Description 2 | You get ₹50 wallet credit after your friend's first delivered order. T&C apply. | 79 |

> Matches the code: `refereeBonus` is credited at sign-up; `referralBonus` is credited to the referrer when the referee's first order is **delivered**. Both require Feature Flags `referral` and `wallet` on.

### RSA-11 Flat discount (Ad group: Coupon Codes)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Flat ₹100 Off Above ₹599 | 24 |
| Headline 2 | Use Code FLAT100 | 16 |
| Headline 3 | Bigger Order, Bigger Saving | 27 |
| Headline 4 | Feast for the Group | 19 |
| Description 1 | Ordering for the group? Get flat ₹100 off orders above ₹599 with FLAT100. | 73 |
| Description 2 | Use FLAT100 up to 3 times. Valid on eligible orders in [CITY]. T&C apply. | 73 |

### RSA-12 Local restaurants (Ad group: Near Me)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Local Restaurants Near You | 26 |
| Headline 2 | [CITY]'s Favourite Kitchens | 27 |
| Headline 3 | Support Local Restaurants | 25 |
| Headline 4 | Discover New Cuisines | 21 |
| Description 1 | Order from independent restaurants near you and discover new local favourites. | 78 |
| Description 2 | Browse by cuisine, rating or category and find something new to try tonight. | 76 |

### RSA-13 Tip riders (Ad group: Food Delivery Generic)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Tip Your Rider, 100% Theirs | 27 |
| Headline 2 | Riders Keep 100% of Tips | 24 |
| Headline 3 | Thank Your Rider | 16 |
| Description 1 | Add a tip at checkout. On FeastFlow, riders keep 100% of the tips you give. | 75 |
| Description 2 | Fair for riders, fast for you. Track your rider live and tip in one tap. | 72 |

> Only run while Business Rules → `deliveryPartnerPayout.tipSharePercent` = 100 and Feature Flags `tipping` + `deliveryPartnerTips` are on.

### RSA-14 Snacks (Ad group: Snacks)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Snack Time? Order Now | 21 |
| Headline 2 | Snacks Slot 4–6 PM | 18 |
| Headline 3 | Evening Cravings Sorted | 23 |
| Headline 4 | Chai-Time Snacks Delivered | 26 |
| Description 1 | Beat the 4 PM slump. Order snacks now or schedule the 4–6 PM snacks slot. | 73 |
| Description 2 | From samosas to sandwiches, get snacks from [CITY] restaurants on FeastFlow. | 76 |

### RSA-15 Languages (Ad group: Food Delivery Generic, Hindi-language targeting)

| Asset | Text | Chars |
|---|---|---|
| Headline 1 | Order in Your Language | 22 |
| Headline 2 | Available in Hindi & More | 25 |
| Headline 3 | Dark Mode Friendly App | 22 |
| Headline 4 | Food Delivery in Hindi | 22 |
| Description 1 | Use FeastFlow in English, Hindi, Spanish, Arabic or French. Switch any time. | 76 |
| Description 2 | A clean, simple app with dark mode, saved addresses and live order tracking. | 76 |

---

## 3. Shared headline / description pool

Add these to any RSA to reach 8–15 headlines and 4 descriptions.

| Asset | Text | Chars |
|---|---|---|
| Headline | Food Delivery in [CITY] | 23 |
| Headline | Order From Top Local Spots | 26 |
| Headline | Get the FeastFlow App | 21 |
| Headline | Hot Food, Live Tracking | 23 |
| Headline | Order Lunch or Dinner Now | 25 |
| Headline | Hungry? FeastFlow It | 20 |
| Headline | New in [CITY]: FeastFlow | 24 |
| Headline | Restaurants Open Now | 20 |
| Description | Download FeastFlow, pick a restaurant, and track your order to your door. | 73 |
| Description | Pay by UPI, card, wallet or COD. Schedule a slot or order for right now. | 72 |

> "Restaurants Open Now" is accurate only during operating hours; use an ad schedule so it does not run overnight.

---

## 4. Sitelinks

| Sitelink text (≤25) | Description line 1 (≤35) | Description line 2 (≤35) | Final URL |
|---|---|---|---|
| First Order Offer (17) | 50% off with WELCOME50 (22) | Max ₹150 on orders above ₹199 (29) | [WEBSITE URL]/offers |
| Free Delivery (13) | Free above ₹499 (15) | FREEDEL: free delivery above ₹249 (33) | [WEBSITE URL]/offers |
| Track Your Order (16) | Live rider on the map (21) | OTP-secured handover (20) | [WEBSITE URL]/how-it-works |
| Refer & Earn (12) | ₹50 for you and a friend (24) | Wallet credit, T&C apply (24) | [WEBSITE URL]/refer |
| Partner With Us (15) | List your restaurant (20) | Get orders via FeastFlow Partner (32) | [PARTNER SIGNUP URL] |
| Ride With FeastFlow (19) | Become a delivery rider (23) | Keep 100% of tips (17) | [RIDER SIGNUP URL] |
| Schedule a Meal (15) | Lunch, Snacks or Dinner (23) | Order ahead for a time slot (27) | [WEBSITE URL]/how-it-works |
| Download the App (16) | Android and iOS (15) | Order in a few taps (19) | [APP LINK] |

> The codebase does not include a public marketing website — the pages above (`/offers`, `/refer`, `/how-it-works`) are placeholders you must build on your site builder of choice, or point all sitelinks at `[APP LINK]`. Legal pages (privacy, terms, refund) exist in-app via Admin → Legal Pages; mirror them on the website for ad policy compliance.

## 5. Callouts

| Callout (≤25) | Chars |
|---|---|
| Live Order Tracking | 19 |
| UPI, Card, Wallet & COD | 23 |
| Free Delivery Above ₹499 | 24 |
| Veg-Only Filter | 15 |
| Scheduled Delivery Slots | 24 |
| Riders Keep 100% of Tips | 24 |
| OTP-Secured Handover | 20 |
| Reorder in One Tap | 18 |
| Hindi & 4 More Languages | 24 |
| Dark Mode | 9 |
| First Order 50% Off | 19 |

**Structured snippet** (header: *Types*): Biryani, Pizza, North Indian, South Indian, Chinese, Desserts, Snacks — list only cuisines your launch restaurants actually serve.

---

## 6. Keyword groups

Match types: `[exact]`, `"phrase"`, broad (only with Smart Bidding + good conversion data). Start exact + phrase.

| Ad group | Keywords |
|---|---|
| **Brand** | [feastflow], [feastflow app], [feast flow], "feastflow food delivery", "feastflow coupon", "feastflow [city]" |
| **Food Delivery Generic** | "food delivery [city]", "food delivery app", [food delivery near me], "online food delivery", "home delivery food", "food delivery service" |
| **Order Online** | "order food online", "order food online [city]", "order dinner online", "restaurant delivery", "food order app" |
| **Near Me** | [restaurants near me delivery], "food near me", "restaurants open now near me", "best restaurants near me delivery" |
| **First-Order Offer** | "food delivery first order offer", "first order free food", "food app offers new user", "food delivery discount" |
| **Free Delivery** | "free delivery food", "free food delivery app", "no delivery fee food" |
| **Coupon Codes** | "food delivery coupon code", "food coupon today", "food promo code", "refer and earn food app" |
| **Biryani** | "biryani delivery", "biryani near me", "order biryani online", "biryani home delivery [city]" |
| **Pizza** | "pizza delivery [city]", "pizza near me", "order pizza online" |
| **North Indian / Chinese** | "north indian food delivery", "thali delivery", "chinese food delivery", "noodles near me" |
| **Veg** | "pure veg food delivery", "veg restaurant near me", "veg food home delivery", "jain food delivery" (only if restaurants tag Jain options) |
| **Snacks** | "snacks delivery", "evening snacks near me", "samosa delivery" |
| **Lunch** | "lunch delivery [city]", "office lunch delivery", "order lunch online", "lunch near me" |
| **Restaurant Partner** | "list restaurant on food delivery app", "restaurant partner food delivery", "online food ordering for restaurants", "increase restaurant orders" |
| **Delivery Rider Jobs** | "delivery boy job [city]", "food delivery job", "part time delivery job", "bike delivery job near me" |

**Competitor terms:** bidding on competitor brand names is allowed in Google Ads search terms but you must **not** use their trademarks in ad text. Keep competitor terms in a separate campaign with a capped budget, and only after brand/generic campaigns are profitable.

## 7. Negative keywords

Apply at account level (shared negative list `NEG_Global`) unless noted.

| Theme | Negatives |
|---|---|
| Jobs (add to all customer campaigns, NOT to Rider Jobs) | job, jobs, vacancy, salary, hiring, career, recruitment, delivery boy, part time |
| Partner/B2B (add to customer campaigns, NOT to Restaurant Partner) | franchise, wholesale, supplier, distributor, register restaurant, partner login, vendor |
| Recipes & cooking | recipe, recipes, how to make, how to cook, ingredients, calories, nutrition, youtube |
| Support for other apps | customer care number, complaint, refund status, helpline, login problem (plus competitor brand + "customer care") |
| Grocery / non-food | grocery, groceries, vegetables online, milk delivery, medicine, pharmacy, alcohol, liquor, beer, wine |
| Free / irrelevant intent | free food ngo, langar, donation, food bank, pdf, project, ppt, essay, case study, clone script, source code, template |
| Out-of-area | names of cities and localities outside your delivery radius |
| Logistics | courier, parcel, packers and movers, tiffin service monthly (unless offered) |

Review the **Search terms report** every 2–3 days in launch week and weekly after.

---

## 8. App install campaign (Google App campaigns) notes

- **Prerequisites:** Play Store listing live (see `docs/PLAY_STORE_DEPLOYMENT.md`), Firebase linked to Google Ads, and in-app events logged: `first_open`, `sign_up`, `first_order` (custom; needs a small code change — the app currently uses Firebase only for push). Without in-app events, optimise for installs only and judge quality by `WELCOME50` redemptions.
- **Phase 1 (days 1–10):** Target CPI ≈ [TARGET CPI ₹]. Daily budget ≥ 50× target CPI so the algorithm can learn.
- **Phase 2 (from ~day 11, after ≥ 10 `first_order` events/day):** switch to "In-app actions" → `first_order`, Target CPA ≈ [TARGET CPA ₹].
- **Text assets (≤ 30 chars headlines, ≤ 90 chars descriptions):** reuse headlines from RSA-01/02/04 and descriptions from RSA-02/04. App campaigns accept up to 5 headlines and 5 descriptions.
- **Image assets:** 1200×628, 1200×1200, 1200×1500 — real dishes from launch restaurants (with restaurant permission), the live tracking map screen, the WELCOME50 offer card.
- **Video assets:** 10–15 s vertical (9:16), horizontal (16:9) and square: (1) craving → order → live map → doorstep OTP; (2) offer-led "50% off your first order, code WELCOME50".
- **Geo:** delivery radius only. **Language:** English + Hindi.
- **iOS:** App campaigns for iOS need SKAdNetwork; expect limited data. Start Android-first if the iOS build is still in review.
- **Store listing quality** drives install rate: screenshots of real restaurants in [CITY], the offer, live tracking, and multi-language support.

## 9. Compliance checklist

- [ ] Every price/discount claim matches the live coupon in Admin → Coupons (value, maxDiscount, minOrderValue, perUserLimit, validTo).
- [ ] "T&C apply" lines link to terms on your website (copy from Admin → Legal Pages → termsAndConditions).
- [ ] No ratings, user counts, "No. 1", "fastest" or delivery-time guarantees in ads — the app shows ETA estimates, not guarantees.
- [ ] No competitor trademarks in ad text.
- [ ] Remove offer ads the day a coupon is deactivated or exhausted (`usedCount` reaches `usageLimit`).
- [ ] Privacy policy URL on website and Play listing (DPDP Act 2023 for India; GDPR/CCPA elsewhere).

### Adapting for other regions
Swap ₹ for local currency (Business Rules → currency), replace UPI/COD lines with the local payment methods enabled in Business Rules → paymentMethods, and rewrite the Hindi ad group for the local language (the app also supports Spanish, Arabic (RTL) and French).
