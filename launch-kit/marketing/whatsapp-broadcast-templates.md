# FeastFlow — WhatsApp Message Templates

Ready-to-submit WhatsApp Business templates for customers, restaurant partners and riders, in Meta's template format (`{{1}}`, `{{2}}` … variables; category **UTILITY** or **MARKETING**).

> **Important — no WhatsApp integration exists in FeastFlow today.** The platform sends push notifications (FCM), in-app notifications, email (SMTP) and SMS (Twilio) only. These templates are for:
> 1. **A WhatsApp Business Solution Provider (BSP)** such as [BSP NAME] — you submit the templates in their console (or Meta WhatsApp Manager) and send broadcasts from there with a CSV of opted-in numbers; or
> 2. **Manual use** from the WhatsApp Business app (small volumes; broadcast lists only reach contacts who saved your number).
>
> Automatic order-status messages (C1–C8) need development work: a webhook/worker that listens to order status changes in the backend and calls the BSP's API. Until that exists, the app's push notifications already cover order updates; use C1–C8 only for manual support follow-ups. Treat WhatsApp API integration as backlog.

**Format rules applied (Meta, verified with Python):** body ≤ 1,024 characters; header text ≤ 60; footer ≤ 60; button text ≤ 25; variables numbered in order, never at the very start or end of the body, never two variables side by side; no more than one header variable (none of these templates uses one); at least ~3 words of fixed text per variable to avoid rejection for a high variable-to-text ratio. Template names: lowercase + underscores. Submit each template in every language you will use (English below; add Hindi `hi` versions using the same variable order).

**Placeholders:** `[SUPPORT PHONE]`, `[SUPPORT EMAIL]`, `[APP LINK]`, `[WEBSITE URL]`, `[PARTNER DASHBOARD URL]`, `[CITY]`. In buttons, URL buttons may use one dynamic suffix variable (e.g. `[WEBSITE URL]/o/{{1}}`) — only if you host such a page; otherwise use `[APP LINK]`.

---

## 1. Customer — order updates (UTILITY)

Order lifecycle in FeastFlow: placed → accepted → preparing → ready → picked → delivered, or cancelled / rejected.

### C1 · `ff_order_placed` · UTILITY
- **Header:** Order received
- **Body:**
```text
Hi {{1}}, thanks for ordering with FeastFlow! Your order {{2}} from {{3}} has been placed. Total: ₹{{4}}.

We'll let you know as soon as the restaurant accepts it. You can track every step in the FeastFlow app.
```
- **Footer:** FeastFlow · Reply HELP for support
- **Buttons:** `Track in app` (URL → [APP LINK])
- **Variables:** {{1}} customer first name · {{2}} order number (e.g. FF-10234) · {{3}} restaurant name · {{4}} order total
- **Sample:** Hi Asha, thanks for ordering with FeastFlow! Your order FF-10234 from Spice Hub has been placed. Total: ₹412.

### C2 · `ff_order_accepted` · UTILITY
- **Header:** Order accepted
- **Body:**
```text
Good news, {{1}}! {{2}} has accepted your order {{3}} and is preparing it now.

Estimated arrival: around {{4}}. We'll message you when a rider picks it up.
```
- **Footer:** FeastFlow
- **Buttons:** `Track order` (URL → [APP LINK])
- **Variables:** {{1}} first name · {{2}} restaurant · {{3}} order number · {{4}} ETA time (e.g. 8:15 PM) — ETA is an estimate (prep time + buffer + distance), never a guarantee.

### C3 · `ff_order_out_for_delivery` · UTILITY
- **Header:** Your order is on the way
- **Body:**
```text
Hi {{1}}, your order {{2}} has been picked up by {{3}} and is on the way.

Your delivery OTP is {{4}}. Please share it only with your rider at the door. You can follow the rider live on the map in the FeastFlow app.
```
- **Footer:** Never share your OTP over a call
- **Buttons:** `Track live` (URL → [APP LINK])
- **Variables:** {{1}} first name · {{2}} order number · {{3}} rider first name · {{4}} 4-digit delivery OTP
- **Note:** Only send the OTP if the `deliveryOtp` feature flag is on; the OTP is visible in the app anyway. Messages containing codes may be reviewed by Meta — if rejected as UTILITY, drop the OTP sentence.

### C4 · `ff_order_delivered` · UTILITY
- **Header:** Delivered. Enjoy your meal!
- **Body:**
```text
Hi {{1}}, your order {{2}} from {{3}} has been delivered.

How was it? Rate the food and delivery in the FeastFlow app; your feedback helps local restaurants and riders improve.
```
- **Footer:** FeastFlow
- **Buttons:** `Rate order` (URL → [APP LINK]) · `Report a problem` (Quick reply)
- **Variables:** {{1}} first name · {{2}} order number · {{3}} restaurant

### C5 · `ff_order_cancelled_refund` · UTILITY (customer-cancelled)
- **Header:** Order cancelled
- **Body:**
```text
Hi {{1}}, your order {{2}} has been cancelled as requested.

Refund: ₹{{3}} will be returned to your {{4}}. Bank and card refunds usually take {{5}} working days; wallet refunds are instant. Need help? Contact us at [SUPPORT PHONE].
```
- **Footer:** FeastFlow Support
- **Buttons:** `Contact support` (Quick reply)
- **Variables:** {{1}} first name · {{2}} order number · {{3}} refund amount · {{4}} refund destination ("original payment method" / "FeastFlow wallet") · {{5}} refund timeline from your refund policy (e.g. 5–7)
- **Note:** Cancellations after `cancellationWindowMinutes` (default 5) carry a `cancellationPenaltyPercent` (default 10%) deduction — {{3}} must be the net amount actually refunded. COD orders: use C5b.

### C5b · `ff_order_cancelled_cod` · UTILITY
- **Header:** Order cancelled
- **Body:**
```text
Hi {{1}}, your cash-on-delivery order {{2}} has been cancelled. No payment was taken.

Hungry still? You can place a new order any time in the FeastFlow app.
```
- **Footer:** FeastFlow
- **Buttons:** `Open FeastFlow` (URL → [APP LINK])
- **Variables:** {{1}} first name · {{2}} order number

### C6 · `ff_order_rejected_refund` · UTILITY (restaurant rejected / did not accept in time)
- **Header:** Sorry, your order couldn't be accepted
- **Body:**
```text
Hi {{1}}, we're sorry. {{2}} couldn't accept your order {{3}} right now.

You will not be charged: ₹{{4}} is being refunded in full to your {{5}}. Please try another restaurant nearby in the FeastFlow app.
```
- **Footer:** FeastFlow Support
- **Buttons:** `Find another restaurant` (URL → [APP LINK])
- **Variables:** {{1}} first name · {{2}} restaurant · {{3}} order number · {{4}} amount · {{5}} refund destination
- **Note:** Unaccepted orders are auto-rejected and refunded after `vendorAcceptTimeoutMinutes` (default 5).

### C7 · `ff_payment_not_completed` · UTILITY
- **Header:** Payment not completed
- **Body:**
```text
Hi {{1}}, we didn't receive payment for order {{2}} within {{3}} minutes, so the order was cancelled.

If money was debited, it will be refunded automatically to your original payment method. Questions? Contact [SUPPORT EMAIL].
```
- **Footer:** FeastFlow Support
- **Buttons:** `Order again` (URL → [APP LINK])
- **Variables:** {{1}} first name · {{2}} order number · {{3}} payment timeout (default `paymentTimeoutMinutes` 15)

### C8 · `ff_refund_processed` · UTILITY
- **Header:** Refund processed
- **Body:**
```text
Hi {{1}}, a refund of ₹{{2}} for order {{3}} has been processed to your {{4}}.

Reference: {{5}}. Depending on your bank, it may take a few working days to show. Contact [SUPPORT PHONE] if you need help.
```
- **Footer:** FeastFlow Support
- **Buttons:** `Contact support` (Quick reply)
- **Variables:** {{1}} first name · {{2}} amount · {{3}} order number · {{4}} destination · {{5}} gateway refund reference (Razorpay/Stripe) or "Wallet"

---

## 2. Customer — offers (MARKETING)

Send only to customers who opted in to promotional WhatsApp messages (see §6). Codes and terms must match Admin → Finance → Coupons exactly at send time.

### M1 · `ff_welcome_offer` · MARKETING
- **Header (image):** WELCOME50 offer card
- **Body:**
```text
Hi {{1}}, welcome to FeastFlow!

Your first order is 50% off with code {{2}} (up to ₹{{3}} off on orders above ₹{{4}}). Valid till {{5}}.

Order from your favourite [CITY] restaurants and track your rider live.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Order now` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} WELCOME50 · {{3}} 150 · {{4}} 199 · {{5}} validTo date
- **Who:** Waitlist members and new sign-ups who opted in.

### M2 · `ff_weekend_offer` · MARKETING
- **Header (text):** Weekend feast, sorted
- **Body:**
```text
Hi {{1}}, the weekend is here!

Use {{2}} for {{3}} on orders above ₹{{4}}. Valid till {{5}}.

Plus, every order above ₹499 gets free delivery.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Order now` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} code (e.g. FREEDEL) · {{3}} benefit text ("free delivery" / "₹100 off") · {{4}} min order · {{5}} end date/time
- **Note:** Remove the free-delivery line if you changed `deliveryFee.freeAbove`.

### M3 · `ff_festival_offer` · MARKETING
- **Header (image):** Festival artwork (food-focused)
- **Body:**
```text
Happy {{1}} from FeastFlow!

Celebrate with your favourite food: {{2}} with code {{3}} on orders above ₹{{4}}. Valid {{5}}.

Order early; restaurants get busy on festival days.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Order now` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} festival (Diwali / Holi / Eid / Christmas / New Year) · {{2}} benefit ("30% off up to ₹120") · {{3}} code · {{4}} min order · {{5}} date range

### M4 · `ff_referral_boost` · MARKETING
- **Header (text):** Refer friends, earn more
- **Body:**
```text
Hi {{1}}, share FeastFlow and earn!

Your referral code: {{2}}. Friends get ₹{{3}} in their wallet when they sign up with it, and you get ₹{{4}} when their first order is delivered. Boosted reward valid till {{5}}.
```
- **Footer:** T&C apply · Reply STOP to opt out
- **Buttons:** `Share my code` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} user's referral code · {{3}} `refereeBonus` · {{4}} `referralBonus` · {{5}} end date

### M5 · `ff_lunch_slot_offer` · MARKETING
- **Header (text):** Lunch, sorted
- **Body:**
```text
Hi {{1}}, busy day ahead? Book your lunch for the 12–2 PM slot now.

Use {{2}} for ₹{{3}} off on orders above ₹{{4}}, valid till {{5}} today. Pick from local kitchens, pay by UPI, card, wallet or cash, and track your rider live.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Schedule lunch` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} code (LUNCH60) · {{3}} 60 · {{4}} 249 · {{5}} time (2 PM)

---

## 3. Customer — re-engagement (MARKETING)

FeastFlow has **no automatic segmentation**. Build the recipient list manually (database query in promo-strategies.md §2.8 → export phone numbers of opted-in users → upload CSV to your BSP). Use hidden codes (`showInOffers` off).

### M6 · `ff_win_back` · MARKETING
- **Header (text):** We miss you
- **Body:**
```text
Hi {{1}}, it's been a while! Your favourite [CITY] restaurants are still cooking.

Here's ₹{{2}} off your next order above ₹{{3}} with code {{4}}. Valid till {{5}}. Your saved addresses and favourites are right where you left them.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Order now` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} 75 · {{3}} 299 · {{4}} MISSYOU75 · {{5}} end date

### M7 · `ff_first_order_nudge` · MARKETING (signed up, never ordered)
- **Header (text):** Your first feast is waiting
- **Body:**
```text
Hi {{1}}, you joined FeastFlow but haven't ordered yet.

Try it this week: {{2}}% off your first order (up to ₹{{3}}) with code {{4}}. Valid till {{5}}. Pay with UPI, card, wallet or cash on delivery.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Browse restaurants` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} 40 · {{3}} 120 · {{4}} COMEBACK40 · {{5}} end date

### M8 · `ff_new_restaurant` · MARKETING
- **Header (image):** Restaurant hero dish
- **Body:**
```text
Hi {{1}}, something new near you: {{2}} is now on FeastFlow!

Known for {{3}}. Try it with code {{4}} for {{5}} this week, and track your order live from their kitchen to your door.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `See menu` (URL → [APP LINK]) · `Stop promotions` (Quick reply)
- **Variables:** {{1}} first name · {{2}} restaurant · {{3}} signature dish · {{4}} restaurant-specific code · {{5}} benefit text

---

## 4. Restaurant partners (FeastFlow Partner)

### V1 · `ff_vendor_application_received` · UTILITY
- **Header (text):** Application received
- **Body:**
```text
Hi {{1}}, thanks for registering {{2}} on FeastFlow Partner.

Our team is reviewing your details. We'll contact you within {{3}} working days. Meanwhile, keep your FSSAI licence, GSTIN (if registered), bank details and menu with prices ready.
```
- **Footer:** FeastFlow Partnerships
- **Buttons:** `Talk to us` (Quick reply)
- **Variables:** {{1}} owner name · {{2}} restaurant name · {{3}} days

### V2 · `ff_vendor_approved_onboarding` · UTILITY
- **Header (text):** Welcome to FeastFlow Partner
- **Body:**
```text
Congratulations {{1}}, {{2}} is approved on FeastFlow!

Next steps:
1. Log in to the FeastFlow Partner app or the web dashboard: [PARTNER DASHBOARD URL]
2. Add your menu, categories, add-ons and photos
3. Set your opening timings
4. Switch your restaurant to Open when you're ready to take orders

Your go-live date: {{3}}. Your partner manager: {{4}}.
```
- **Footer:** FeastFlow Partnerships
- **Buttons:** `Open dashboard` (URL → [PARTNER DASHBOARD URL]) · `Need help` (Quick reply)
- **Variables:** {{1}} owner name · {{2}} restaurant · {{3}} go-live date · {{4}} manager name + phone

### V3 · `ff_vendor_menu_checklist` · UTILITY
- **Header (text):** Menu checklist
- **Body:**
```text
Hi {{1}}, a quick checklist before {{2}} goes live on FeastFlow:

- Every item has a price, photo and veg/non-veg tag
- Add-ons (extra cheese, sides) are set up
- Prep time is realistic
- Opening timings are correct for every day

Customers filter by veg and see your photos first, so this really helps orders. Reply DONE when ready.
```
- **Footer:** FeastFlow Partnerships
- **Buttons:** `Done` (Quick reply) · `Need help` (Quick reply)
- **Variables:** {{1}} owner name · {{2}} restaurant

### V4 · `ff_vendor_launch_briefing` · UTILITY
- **Header (text):** Launch day briefing
- **Body:**
```text
Hi {{1}}, FeastFlow launches in [CITY] on {{2}}. Please make sure {{3}} is:

- Set to Open in the Partner app during your hours
- Accepting orders quickly: orders not accepted within {{4}} minutes are auto-rejected and refunded
- Marking sold-out items unavailable

Launch offers running: {{5}}. Thank you for being a launch partner!
```
- **Footer:** FeastFlow Partnerships
- **Buttons:** `Got it` (Quick reply) · `Call partner team` (Phone → [SUPPORT PHONE])
- **Variables:** {{1}} owner name · {{2}} launch date · {{3}} restaurant · {{4}} `vendorAcceptTimeoutMinutes` (default 5) · {{5}} offer summary and funding terms (e.g. "WELCOME50, platform-funded")

### V5 · `ff_vendor_menu_update_reminder` · UTILITY
- **Header (text):** Keep your menu fresh
- **Body:**
```text
Hi {{1}}, a quick reminder for {{2}}: please review your FeastFlow menu.

- Turn off items that are sold out today
- Update prices and photos if anything changed
- Check your timings for {{3}}

An accurate menu means fewer rejected orders and better ratings.
```
- **Footer:** FeastFlow Partnerships
- **Buttons:** `Open dashboard` (URL → [PARTNER DASHBOARD URL])
- **Variables:** {{1}} owner name · {{2}} restaurant · {{3}} upcoming date/holiday

### V6 · `ff_vendor_promo_invite` · MARKETING
- **Header (text):** Boost your orders
- **Body:**
```text
Hi {{1}}, we'd like to feature {{2}} in a FeastFlow promotion: {{3}} from {{4}}.

Funding: {{5}}. Featured restaurants also appear in the Featured section and on a home banner during the campaign. Reply YES to join or call us to discuss.
```
- **Footer:** Reply STOP to opt out of promotions
- **Buttons:** `Yes, join` (Quick reply) · `Not now` (Quick reply)
- **Variables:** {{1}} owner name · {{2}} restaurant · {{3}} offer (e.g. "20% off up to ₹100 above ₹299") · {{4}} date range · {{5}} who pays (e.g. "discount shared 50/50; we reimburse our share with your payout")
- **Note:** As built, coupon discounts are deducted from the vendor's earning. Always state funding explicitly and get written consent (a YES reply is a good record).

### V7 · `ff_vendor_weekly_summary` · UTILITY
- **Header (text):** Your week on FeastFlow
- **Body:**
```text
Hi {{1}}, here's {{2}}'s summary for {{3}}:

Orders delivered: {{4}}
Earnings: ₹{{5}}
Average rating: {{6}}

Tip: replying to reviews in the Partner app shows customers you care.
```
- **Footer:** FeastFlow Partnerships
- **Buttons:** `View details` (URL → [PARTNER DASHBOARD URL])
- **Variables:** {{1}} owner name · {{2}} restaurant · {{3}} week dates · {{4}} orders · {{5}} vendorEarning sum · {{6}} rating — source: Admin → Reports → Restaurants and Reviews CSV.

### V8 · `ff_vendor_payout_processed` · UTILITY
- **Header (text):** Payout processed
- **Body:**
```text
Hi {{1}}, we've processed a payout of ₹{{2}} for {{3}} covering {{4}}.

Reference: {{5}}. It should reach your registered bank account within {{6}} working days. You can see the breakdown under Payouts in the Partner app.
```
- **Footer:** FeastFlow Finance
- **Buttons:** `View payouts` (URL → [PARTNER DASHBOARD URL])
- **Variables:** {{1}} owner name · {{2}} amount · {{3}} restaurant · {{4}} period · {{5}} bank/UTR reference · {{6}} days

### V9 · `ff_vendor_payout_threshold` · UTILITY
- **Header (text):** Payout update
- **Body:**
```text
Hi {{1}}, your current FeastFlow balance for {{2}} is ₹{{3}}.

Payouts are released once the balance reaches ₹{{4}}. Your balance will roll over to the next cycle.
```
- **Footer:** FeastFlow Finance
- **Buttons:** `View earnings` (URL → [PARTNER DASHBOARD URL])
- **Variables:** {{1}} owner name · {{2}} restaurant · {{3}} balance · {{4}} `minPayoutAmount` (default 500)

---

## 5. Riders (FeastFlow Rider)

### R1 · `ff_rider_application_received` · UTILITY
- **Header (text):** Application received
- **Body:**
```text
Hi {{1}}, thanks for registering as a FeastFlow Rider in [CITY].

We're verifying your documents. You'll hear from us within {{2}} working days. Once approved, you can go online in the FeastFlow Rider app and start receiving orders.
```
- **Footer:** FeastFlow Fleet
- **Buttons:** `Talk to us` (Quick reply)
- **Variables:** {{1}} rider first name · {{2}} days

### R2 · `ff_rider_approved` · UTILITY
- **Header (text):** You're approved!
- **Body:**
```text
Welcome to FeastFlow, {{1}}! Your rider account is approved.

How you earn: ₹{{2}} base per delivery + ₹{{3}} per km + 100% of customer tips.

Before your first shift: allow location access (needed while online), keep your phone charged, and always ask the customer for the delivery OTP at handover. Ride safe; never rush.
```
- **Footer:** FeastFlow Fleet
- **Buttons:** `Open Rider app` (URL → [APP LINK]) · `Need help` (Quick reply)
- **Variables:** {{1}} first name · {{2}} `deliveryPartnerPayout.base` (default 25) · {{3}} `perKm` (default 6)
- **Note:** Remove "100% of customer tips" if you change `tipSharePercent`.

### R3 · `ff_rider_peak_hours` · MARKETING (Meta usually classifies availability nudges as marketing)
- **Header (text):** Busy hours ahead
- **Body:**
```text
Hi {{1}}, we expect high order volume in {{2}} from {{3}}.

Go online in the FeastFlow Rider app to pick up more deliveries. Please ride safely; no order is worth a risk.
```
- **Footer:** Reply STOP to opt out
- **Buttons:** `Go online` (URL → [APP LINK]) · `Stop alerts` (Quick reply)
- **Variables:** {{1}} first name · {{2}} area · {{3}} time window

### R4 · `ff_rider_weekly_earnings` · UTILITY
- **Header (text):** Your weekly earnings
- **Body:**
```text
Hi {{1}}, your FeastFlow summary for {{2}}:

Deliveries: {{3}}
Distance: {{4}} km
Earnings: ₹{{5}} (including ₹{{6}} in tips)

Thank you for riding with us. Full history is in the Rider app.
```
- **Footer:** FeastFlow Fleet
- **Buttons:** `View earnings` (URL → [APP LINK])
- **Variables:** {{1}} first name · {{2}} week dates · {{3}} deliveries · {{4}} km · {{5}} earnings · {{6}} tips — source: Admin → Reports → Delivery CSV.

### R5 · `ff_rider_document_reminder` · UTILITY
- **Header (text):** Action needed
- **Body:**
```text
Hi {{1}}, your {{2}} on file expires on {{3}}.

Please share an updated copy with the fleet team by {{4}} to keep your account active.
```
- **Footer:** FeastFlow Fleet
- **Buttons:** `Contact fleet team` (Quick reply)
- **Variables:** {{1}} first name · {{2}} document (driving licence / RC / insurance) · {{3}} expiry date · {{4}} deadline

### R6 · `ff_rider_safety_advisory` · UTILITY
- **Header (text):** Safety advisory
- **Body:**
```text
Hi {{1}}, {{2}} is expected in [CITY] {{3}}.

Your safety comes first: slow down, avoid flooded roads, and go offline if conditions feel unsafe. Delayed orders are okay; accidents are not. Call [SUPPORT PHONE] if you need help on the road.
```
- **Footer:** FeastFlow Fleet
- **Buttons:** `I'm safe` (Quick reply) · `Call support` (Phone → [SUPPORT PHONE])
- **Variables:** {{1}} first name · {{2}} condition (heavy rain / heatwave / road closure) · {{3}} timeframe ("this evening")

---

## 6. Opt-in and compliance

**WhatsApp Business Policy**
- You may only message people who **opted in to receive WhatsApp messages from FeastFlow**, and the opt-in must name FeastFlow and WhatsApp. Collect it explicitly:
  - Waitlist form: unticked checkbox "Send me updates and offers from FeastFlow on WhatsApp".
  - In-app: FeastFlow does not have a WhatsApp opt-in toggle today — add one (backlog), or collect opt-in on a web form / via the customer messaging you first ("Hi" to your WhatsApp number counts for the 24-hour service window, not for marketing).
  - Partners and riders: opt-in clause in the signed partner agreement / rider onboarding form.
- Keep **separate consent for UTILITY and MARKETING**. A customer who opts in to order updates has not agreed to offers.
- Every MARKETING template includes a **STOP / opt-out** path. Honour opt-outs immediately (remove from every BSP list) and keep a suppression list.
- Keep quality high: low read rates and blocks reduce your number's quality rating and messaging limits. Start with small, engaged segments; never upload a purchased list.
- Template category is decided by Meta; if a "utility" template contains promotion it will be re-categorised (and charged) as marketing. Do not add offers to C1–C8, V1–V5, V7–V9, R1–R2, R4–R6.
- Service conversations: replies within 24 hours of the customer's last message can be free-form; outside that window you must use an approved template.

**India — DPDP Act 2023 / TRAI**
- Collect only the phone number and name needed; state the purpose in the privacy policy (Admin → Config → Legal Pages → `privacyPolicy`) and at the point of collection.
- Users can withdraw consent as easily as they gave it; record consent timestamp and source.
- When exporting users for a campaign (promo-strategies.md §2.8), restrict access, delete the export after use, and share with the BSP under a data-processing agreement.
- SMS sent through Twilio from Admin → Notifications to Indian numbers require DLT registration (sender ID + templates) under TRAI rules — separate from WhatsApp.

**Other regions:** GDPR (EU/UK) requires a lawful basis and explicit consent for marketing; TCPA (US) requires prior express written consent for marketing messages. Have a lawyer review your opt-in wording. This section is not legal advice.

## 7. Operating without an integration — workflow

1. Export opted-in users (name, phone) — only those with recorded consent.
2. Apply suppression list (opt-outs, banned users from Admin → Operations → Users).
3. Upload CSV to the BSP, map columns to `{{1}}`, `{{2}}` …
4. Double-check coupon codes are active and valid for the full message window (Admin → Finance → Coupons).
5. Send a test to internal numbers; then send in batches (start ≤ 1,000/day while your number's tier is low).
6. Measure: BSP delivered/read rates + coupon `usedCount` change during the window.
