# FeastFlow — Promotions Playbook (built-in coupon engine)

How to run every launch-phase promotion with what is **already built** in FeastFlow: the coupon engine (Admin → Finance → Coupons), banners (Admin → Config → Banners), push / in-app / email / SMS broadcasts (Admin → System → Notifications), referral (Business Rules + Feature Flags) and the global free-delivery threshold (Business Rules → deliveryFee.freeAbove).

All field names below are the exact fields of the `Coupon` model and the admin form.

---

## 1. How the coupon engine actually works

### 1.1 Fields (Admin → Finance → Coupons → New)

| Field | Type | Meaning / gotchas |
|---|---|---|
| `code` | text | Stored UPPERCASE, must be unique. Customers type it or pick it from the Offers screen. |
| `title` | text | Short line shown on the Offers screen / coupon card ("50% off your first order"). |
| `description` | text | The conditions in plain words ("Up to ₹150 off on orders above ₹199. First order only."). Always state cap, minimum and limits here. |
| `discountType` | `percent` \| `flat` \| `free_delivery` | `percent` = `value`% of item subtotal; `flat` = ₹`value` off; `free_delivery` = delivery fee (and therefore any surge fee) becomes 0, `value` is ignored. |
| `value` | number | Percentage (e.g. 50) or rupees (e.g. 100). Set 0 for `free_delivery`. |
| `maxDiscount` | number or empty | Cap in ₹ for `percent` (also applies to `flat` if set). **Always set it for percent coupons.** Empty = no cap. |
| `minOrderValue` | number | Minimum **item subtotal** (before fees, tax, tip) for the code to apply. Separate from the global Business Rules `minOrderValue` (₹99), which still applies to every order. |
| `validFrom` / `validTo` | date-time | Date **and time** (the admin form uses a datetime picker), so you can run time-boxed windows such as 11:00–14:30. Empty `validTo` = never expires (avoid for promos). |
| `usageLimit` | number or empty | Total redemptions across all users. Empty = unlimited. **This is your budget cap.** |
| `perUserLimit` | number | Redemptions per customer (default 1). |
| `restaurant` | select or "All restaurants" | Restricts the code to one restaurant (validation fails on other restaurants' carts). The general Offers screen lists it with the restaurant's name; at checkout only codes for that restaurant or for all restaurants are offered. |
| `firstOrderOnly` | toggle | Valid only if the customer has no previous order other than cancelled/rejected ones. |
| `isActive` | toggle | Master switch. Turn off to stop a code instantly (it disappears from Offers and fails validation). |
| `showInOffers` | toggle | Show on the in-app Offers screen. Off = "secret" code that only works when typed (good for influencer, win-back and per-user codes). |
| `bannerImage` | image URL | Optional artwork for the coupon card on the Offers screen. |
| `usedCount` | read-only | Total redemptions so far — your primary results metric. |

> An exhausted code (`usedCount` = `usageLimit`) still appears on the Offers screen until its `validTo` passes — it just fails validation. Switch `isActive` off as soon as a code is exhausted to avoid frustrated customers.

### 1.2 Validation order (what the customer sees when it fails)
1. Code exists and `isActive` → else "invalid".
2. Now ≥ `validFrom` → else "not started"; now ≤ `validTo` → else "expired".
3. `restaurant` matches the cart's restaurant → else "not applicable".
4. Item subtotal ≥ `minOrderValue` → else "minimum order ₹X".
5. `usedCount` < `usageLimit` → else "exhausted".
6. This user's uses < `perUserLimit` → else "already used".
7. `firstOrderOnly` and the user has an earlier non-cancelled order → else "first order only".

Only **one coupon per order**. Coupons can be combined with wallet balance (wallet can pay up to `walletMaxUsePercent` = 50% of the order total by default).

### 1.3 Who pays for the discount — read this before launch

As the code stands (`backend/controllers/orderController.js`):

```
discount        = percent: subtotal × value% (capped by maxDiscount) | flat: value | free_delivery: 0
commission      = commissionPercent × (subtotal − discount)
vendorEarning   = subtotal − discount − commission + packagingFee
tax (GST)       = taxPercent × (subtotal − discount)
```

So **item discounts (`percent`/`flat`) are deducted from the restaurant's earning**, and the platform's commission is calculated on the discounted subtotal. There is no "platform-funded" switch.

Worked example — ₹400 cart, WELCOME50, default 18% commission, ₹15 packaging:

| | Without coupon | With WELCOME50 |
|---|---|---|
| Discount | ₹0 | ₹150 (50% = ₹200, capped at ₹150) |
| Commission (18%) | ₹72.00 | ₹45.00 |
| Vendor earning | ₹343.00 | ₹220.00 |
| Restaurant bears | — | ₹123 |
| Platform bears | — | ₹27 (lost commission) |

**Decide the funding model before launch and put it in the partner agreement:**
- **A. Restaurant-funded** (as built): only with written vendor consent; best for restaurant-specific coupons the vendor asks for.
- **B. Platform-funded**: export delivered orders from Admin → Reports (type *Orders*) — the `discount` column shows each order's coupon discount — and reimburse vendors the discount (or an agreed share) with their payout. Keep a reconciliation sheet per payout cycle.
- **C. Co-funded**: e.g. 50/50 — reimburse half.
- *Backlog:* add a `fundedBy` field to coupons so vendorEarning is computed automatically. Until then, B/C are manual.

`free_delivery` coupons and the global free-delivery threshold are **platform-funded**: the customer pays no delivery fee, but the rider is still paid `deliveryPartnerPayout` (default ₹25 + ₹6/km).

---

## 2. Recipes

Every recipe is a row of field values you can type straight into Admin → Coupons. "—" means leave empty.

### 2.1 Welcome / first order — WELCOME50 (seeded)

| Field | WELCOME50 (seeded, launch default) | WELCOME50 hardened for paid ads | Alternative: WELCOME100 (flat) |
|---|---|---|---|
| code | WELCOME50 | WELCOME50 | WELCOME100 |
| title | 50% off your first order | 50% off your first order | ₹100 off your first order |
| description | Up to ₹150 off on orders above ₹199. First order only. | Up to ₹150 off on orders above ₹199. First order only. Valid till [DATE]. | ₹100 off on orders above ₹299. First order only. |
| discountType | percent | percent | flat |
| value | 50 | 50 | 100 |
| maxDiscount | 150 | 150 | 100 |
| minOrderValue | 199 | 199 | 299 |
| validFrom | launch date 00:00 | launch date 00:00 | — |
| validTo | — (seeded) | launch + 30 days 23:59 | launch + 30 days 23:59 |
| usageLimit | — | [BUDGET ÷ 150] e.g. 2,000 | [BUDGET ÷ 100] |
| perUserLimit | 1 | 1 | 1 |
| restaurant | All | All | All |
| firstOrderOnly | on | on | on |
| isActive | on | on | on |
| showInOffers | on | on | on |

Use WELCOME50 for launch (strong headline). Consider swapping to WELCOME100 (flat) after month one: same headline value on a typical cart, simpler to explain, and cheaper on small carts (₹199–₹299 carts no longer qualify).

**Abuse note:** `firstOrderOnly` and `perUserLimit` are per account. Someone can create multiple accounts (different phones/emails). Mitigations available today: OTP login (phone verification), a `usageLimit` cap, watching Admin → Reports (Orders) for repeated delivery addresses, and banning abusers in Admin → Users. Device fingerprinting is not built.

### 2.2 Bigger baskets — FLAT100 (seeded)

| Field | Value |
|---|---|
| code | FLAT100 |
| title | Flat ₹100 off |
| description | ₹100 off on orders above ₹599. Up to 3 uses per user. |
| discountType | flat |
| value | 100 |
| maxDiscount | 100 |
| minOrderValue | 599 |
| validTo | set an end date for every campaign window (seeded value may be empty) |
| usageLimit | [BUDGET ÷ 100] |
| perUserLimit | 3 |
| firstOrderOnly | off |
| showInOffers | on |

Effective discount ≤ 16.7% (100/599). Raise AOV: put it on a `cart` placement banner ("Add ₹X more for ₹100 off" is not automated — the banner is static, so phrase it as "₹100 off above ₹599").

### 2.3 Free delivery — FREEDEL (seeded) vs. global threshold

Two tools, use both deliberately:

| Mechanism | Where | How it works | Use for |
|---|---|---|---|
| Global free delivery | Admin → Config → Business Rules → `deliveryFee.freeAbove` (default ₹499) | Every order with item subtotal ≥ freeAbove has ₹0 delivery fee. No code needed. | Permanent promise ("Free delivery above ₹499"). |
| `free_delivery` coupon | Admin → Coupons | Delivery fee = 0 when the code is applied and subtotal ≥ `minOrderValue`. | Time-boxed or targeted pushes ("FREEDEL this weekend above ₹249"). |

**FREEDEL (seeded):**

| Field | Value |
|---|---|
| code | FREEDEL |
| title | Free delivery |
| description | Free delivery on orders above ₹249. Up to 5 uses per user. |
| discountType | free_delivery |
| value | 0 |
| maxDiscount | — |
| minOrderValue | 249 |
| usageLimit | [BUDGET ÷ avg delivery fee] |
| perUserLimit | 5 |
| firstOrderOnly | off |
| showInOffers | on |

**Free-delivery-above-X variants:**

| Code | minOrderValue | perUserLimit | validFrom → validTo | Notes |
|---|---|---|---|---|
| FREEDEL199 | 199 | 2 | Mon 00:00 → Thu 23:59 | Weekday demand fill |
| FREEDEL349 | 349 | 3 | campaign window | Mid-basket nudge |
| (global) | `freeAbove` 499 | — | always | Lower to 399 temporarily for launch week, then restore. Changing Business Rules applies instantly to all users (socket `config:updated`). |

**Cost per use** = the delivery fee you would have charged = `base` ₹30 for the first `baseKm` 2 km + ₹8/km after. At 4 km: ₹30 + 2×₹8 = ₹46. Budget: `usageLimit` × average fee (check `deliveryFee` in Reports → Orders export for typical values).

**Surge interaction:** surge (Business Rules → `surgePricing`) multiplies the delivery fee and is only applied when a delivery fee exists. Free-delivery orders (coupon or threshold) pay **no surge fee**. During surge, free-delivery offers are therefore more expensive in rider-supply terms (you still pay riders) and remove your surge revenue — see section 4.

### 2.4 Weekend offers

| Field | WEEKEND20 | FRIYAY (free delivery) |
|---|---|---|
| title | 20% off this weekend | Free delivery this weekend |
| description | 20% off up to ₹80 on orders above ₹349. Sat–Sun only. | Free delivery on orders above ₹199. Fri 6 PM – Sun 11:59 PM. |
| discountType | percent | free_delivery |
| value | 20 | 0 |
| maxDiscount | 80 | — |
| minOrderValue | 349 | 199 |
| validFrom | Sat 00:00 | Fri 18:00 |
| validTo | Sun 23:59 | Sun 23:59 |
| usageLimit | [BUDGET ÷ 80] | [BUDGET ÷ 46] |
| perUserLimit | 2 | 3 |
| firstOrderOnly | off | off |
| showInOffers | on | on |

Since there is no recurring schedule, **create a new coupon for each weekend** (e.g. `WEEKEND20` → edit `validFrom`/`validTo` each week, or create `WKND1012`, `WKND1019` …). Editing the dates of the same code keeps `usedCount` cumulative; new codes give clean per-weekend metrics. Pair with: Admin → Banners (placement `home`, linkType `coupon`, linkValue `WEEKEND20`, start/end = same window) and a Friday 17:00 push.

### 2.5 Festival campaigns (generic templates)

Pattern: festival code, 3–5 day window, capped `percent` or `flat`, `usageLimit` from budget, `perUserLimit` 1–2, banner + push on day 1 and on the festival day. Copy must avoid religious imagery that could offend; focus on food, family and togetherness. Check restaurant opening hours on festival days (Vendors set Timings; many close) and rider availability before committing.

| Field | Diwali | Holi | Eid | Christmas | New Year |
|---|---|---|---|---|---|
| code | DIWALI[YY] | HOLI[YY] | EID[YY] | XMAS[YY] | NEWYEAR[YY] |
| title | Diwali feast: 30% off | Holi special: ₹75 off | Eid feast: 25% off | Christmas treat: ₹120 off | New Year party: free delivery + ₹100 off via FLAT100 |
| description | 30% off up to ₹120 above ₹399 | ₹75 off above ₹349 | 25% off up to ₹125 above ₹449 | ₹120 off above ₹699 | Free delivery above ₹299 on 31 Dec–1 Jan |
| discountType | percent | flat | percent | flat | free_delivery |
| value | 30 | 75 | 25 | 120 | 0 |
| maxDiscount | 120 | 75 | 125 | 120 | — |
| minOrderValue | 399 | 349 | 449 | 699 | 299 |
| validFrom → validTo | Dhanteras 00:00 → Bhai Dooj 23:59 | Holika Dahan 16:00 → Holi 23:59 | Chand Raat 18:00 → Eid +1 day 23:59 | 24 Dec 00:00 → 26 Dec 23:59 | 31 Dec 12:00 → 1 Jan 23:59 |
| usageLimit | [BUDGET ÷ 120] | [BUDGET ÷ 75] | [BUDGET ÷ 125] | [BUDGET ÷ 120] | [BUDGET ÷ 46] |
| perUserLimit | 2 | 1 | 2 | 1 | 2 |
| restaurant | All (or sweets/mithai partner) | All | All (or biryani/kebab partners) | All (or bakery partner) | All |
| firstOrderOnly | off | off | off | off | off |
| showInOffers | on | on | on | on | on |
| Banner | home + offers, linkType coupon | home, linkType cuisine "Sweets"/"Snacks" | home, linkType cuisine "Biryani"/"Mughlai" | home, linkType category "Desserts" | home + cart, linkType coupon |
| Push | D-1 19:00, D0 11:30 | D0 10:00 (Holi brunch) | Chand Raat 20:00, D0 12:00 | 24 Dec 18:00 | 31 Dec 17:00 |

Notes:
- Dates of Diwali, Holi and Eid change every year — confirm local dates (Eid depends on moon sighting; keep `validTo` one day longer).
- New Year Eve is typically a high-demand night; consider surge (section 4) instead of a discount, or a free-delivery offer only if you have plenty of riders.
- Other regions: swap in Lunar New Year, Ramadan iftar windows (time-boxed 17:30–20:30), Thanksgiving, etc. — same recipe.

### 2.6 Restaurant-specific coupons (`restaurant` field)

Use for: new-restaurant launches, a vendor's slow day, vendor-requested promotions (restaurant-funded, see 1.3).

| Field | Value |
|---|---|
| code | [RESTO]20 (e.g. SPICEHUB20) |
| title | 20% off at [RESTAURANT NAME] |
| description | 20% off up to ₹100 on orders above ₹299 at [RESTAURANT NAME]. |
| discountType | percent |
| value | 20 |
| maxDiscount | 100 |
| minOrderValue | 299 |
| validFrom → validTo | 7–14 days |
| usageLimit | agreed with vendor |
| perUserLimit | 2 |
| restaurant | [select the restaurant] |
| firstOrderOnly | off |
| showInOffers | on (appears on that restaurant's checkout offers) |

Combine with: Admin → Restaurants → `featured` flag on (appears in the Featured home section) + Admin → Banners (placement `home` or `restaurant`, linkType `restaurant`, linkValue = that restaurant) for the same dates. **Featured placement and banners are the only "promoted listing" tools** — there is no self-serve ads marketplace; sell featured slots to vendors manually if you wish, with a written agreement.

Vendors can also create coupons scoped to their own restaurant through the API (the `/api/coupons` endpoints accept the vendor role), but the vendor web dashboard has no Coupons page yet — in practice the admin creates them.

### 2.7 Lunch slot offers

The coupon engine has no time-of-day rule, but `validFrom`/`validTo` take a time, and the app has scheduled delivery slots (Lunch 12–14, Snacks 16–18, Dinner 19–22; Feature Flag `scheduleOrder`).

| Field | LUNCH60 (daily window) | Weekly variant |
|---|---|---|
| title | Lunch deal: ₹60 off | Workweek lunch: ₹60 off |
| description | ₹60 off on orders above ₹249, 10:30 AM–2:00 PM today | ₹60 off above ₹249, Mon–Fri. Book the 12–2 PM slot! |
| discountType | flat | flat |
| value | 60 | 60 |
| maxDiscount | 60 | 60 |
| minOrderValue | 249 | 249 |
| validFrom | today 10:30 | Mon 00:00 |
| validTo | today 14:00 | Fri 23:59 |
| usageLimit | [daily budget ÷ 60] | [weekly budget ÷ 60] |
| perUserLimit | 1 | 3 |
| showInOffers | on | on |

- Daily window = one coupon per day (create the week's five in one sitting with future `validFrom`; they stay hidden until valid — the Offers list only shows currently valid, active coupons).
- The weekly variant is redeemable at any time of day; it is a lunch campaign in messaging only. Use the daily window if you need it strictly at lunch.
- Coupon validity is checked when the order is placed, not at the slot time — a customer can place at 09:00 for the 12–14 slot only if `validFrom` ≤ 09:00.
- Pair with a 10:30 push ("Book your 12–2 lunch slot") on weekdays, and a `home` banner linking to the "Lunch"/"Thali" category.

### 2.8 Win-back campaigns

**No automatic segmentation exists** — there is no "inactive users" audience, no cohort builder, no automated journeys. Do it manually:

1. **Identify users.** Admin → Reports → type *Orders* → date range → Export CSV gives orders with customer *name*, not ID. For the user IDs needed for targeting, run a read-only query on the database (Path A: `docker compose exec mongo mongosh food_delivery`; Path B: `mongosh food_delivery`):

   ```js
   // Customers whose last delivered order was more than 21 days ago
   const cutoff = new Date(Date.now() - 21 * 864e5);
   db.orders.aggregate([
     { $match: { status: 'delivered' } },
     { $group: { _id: '$customer', last: { $max: '$createdAt' }, orders: { $sum: 1 } } },
     { $match: { last: { $lt: cutoff } } }
   ]).toArray().map(d => d._id.toString()).join(',')

   // Signed up but never ordered
   const buyers = db.orders.distinct('customer');
   db.users.find({ role: 'customer', isBanned: false, _id: { $nin: buyers } }, { _id: 1 })
     .toArray().map(u => u._id.toString()).join(',')
   ```

   Run against a read replica or during low traffic; never run write commands. Treat the export as personal data (DPDP Act 2023): minimum necessary, stored securely, deleted after the campaign.

2. **Create a hidden code** (`showInOffers` off) so only targeted users know it:

   | Field | MISSYOU75 | COMEBACK (never-ordered) |
   |---|---|---|
   | discountType | flat | percent |
   | value | 75 | 40 |
   | maxDiscount | 75 | 120 |
   | minOrderValue | 299 | 199 |
   | validFrom → validTo | send date → +7 days | send date → +7 days |
   | usageLimit | number of targeted users × expected redemption rate × 1.2 | same |
   | perUserLimit | 1 | 1 |
   | firstOrderOnly | off | on (they have no orders) |
   | showInOffers | **off** | **off** |

   A hidden code can still be shared publicly by anyone who receives it — `usageLimit` is the safety net.

3. **Send targeted messages.** Admin → System → Notifications: paste the comma-separated user IDs into **User IDs**, pick channels (`push`, `inapp`, `email`, `sms` — each only if enabled in Feature Flags and configured), title + body with the code. When User IDs are given, the audience selector is ignored and only those users receive it. Respect marketing opt-outs: remove users who opted out of promotions (you need to track this — see whatsapp-broadcast-templates.md §7).

4. **Per-user unique codes are manual**: create one coupon per user (`perUserLimit` 1, `usageLimit` 1) only for high-value customers; for everyone else use one shared hidden code.

5. **Measure**: `usedCount` on the code after 7 days ÷ users targeted = win-back rate.

### 2.9 Referral programme (not a coupon, but part of the promo budget)

| Setting | Location | Default | Notes |
|---|---|---|---|
| Referral on/off | Admin → Config → Feature Flags → `referral` | on | Also needs `wallet` on (bonuses are wallet credits). |
| Referee bonus | Business Rules → `refereeBonus` | ₹50 | Credited to the new user **at sign-up** with a valid code. |
| Referrer bonus | Business Rules → `referralBonus` | ₹50 | Credited to the referrer when the referee's **first order is delivered**. |
| Wallet use cap | Business Rules → `walletMaxUsePercent` | 50% | Wallet can pay at most this share of an order total, which limits how fast bonuses are burned. |

Referral push idea (week 3): raise `referralBonus` to ₹100 for 7 days ("Refer now, earn ₹100"), then restore. The referee bonus is paid on sign-up, so a sign-up-farming abuse vector exists — monitor Admin → Finance → Transactions for many `referral_bonus` credits to unused accounts and keep `refereeBonus` modest.

---

## 3. Banners and placements that support a coupon

Admin → Config → Banners:

| Field | Recommendation |
|---|---|
| title / subtitle | Code + value + condition ("WELCOME50 · 50% off first order · up to ₹150") |
| image | 1200×600 (keep text large; mobile) — the app crops; test on a small phone |
| placement | `home` (reach), `offers` (consideration), `cart` (conversion, e.g. FLAT100), `restaurant` (restaurant-specific) |
| linkType / linkValue | `coupon` + the code (opens the Offers screen); `restaurant` + restaurant; `category`/`cuisine` for festival themes; `url` for external pages |
| startDate / endDate | Same as the coupon's `validFrom`/`validTo` — otherwise you advertise an expired code |
| order | Lower = earlier in the carousel |
| clicks | Read-only click counter = banner CTR proxy |

Home Layout (Admin → Config → Home Layout builder) controls whether the banners and offers sections appear and in which order — make sure `banners` and `offers` sections are enabled above the restaurant list during campaigns.

---

## 4. Surge considerations

Business Rules → `surgePricing` {`enabled`, `multiplier` (default 1.5), `reason` ("High demand")}: the delivery fee is multiplied, and the surge part is shown as a separate fee. It is a manual switch — there is no automatic demand detection.

- **Do not run aggressive discounts while surge is on** — it sends mixed signals ("we're overloaded" + "order more"). Pause banners/pushes for discount codes when you enable surge.
- Free-delivery coupons and the `freeAbove` threshold remove the surge fee entirely; if surge is enabled because riders are scarce, consider temporarily setting high-volume free-delivery codes `isActive` off.
- Rain / festival nights: prefer surge + rider incentives (off-platform bonus, or tips encouragement) over discounts.
- Communicate honestly: set `reason` to the real cause ("Heavy rain", "Festival demand").
- Always disable surge when the peak ends; it is not time-limited automatically.

---

## 5. Guardrails and budget math

**Rules of thumb**
1. Every `percent` coupon has a `maxDiscount`. No exceptions.
2. Every campaign coupon has a `validTo` and a `usageLimit`.
3. `minOrderValue` ≥ ~2× the discount for flat coupons (keeps discount ≤ 50% of items).
4. No more than [N] public codes on the Offers screen at once (3–5 keeps the screen readable).
5. Check the funding model (1.3) for every new code; record it in a campaign log.
6. One person creates, another reviews (Admin → System → Admin Roles lets you give a marketing role Coupons access without Finance/Settings access).

**Maximum exposure per code**
```
percent / flat:  maxExposure = usageLimit × maxDiscount   (or × value for flat)
free_delivery:   maxExposure ≈ usageLimit × average delivery fee foregone
```

**Example launch-month promo budget** (fill with your numbers):

| Code | usageLimit | Max per use | Max exposure | Expected redemptions | Expected cost |
|---|---|---|---|---|---|
| WELCOME50 | 2,000 | ₹150 | ₹3,00,000 | [X] | [X × avg discount] |
| FLAT100 | 1,500 | ₹100 | ₹1,50,000 | [X] | |
| FREEDEL | 3,000 | ~₹46 | ~₹1,38,000 | [X] | |
| Referral | — | ₹50 + ₹50 | [cap via monitoring] | [X] | |
| **Total cap** | | | **[SUM]** | | |

Expected average discount on WELCOME50 = min(50% × average first-order subtotal, ₹150). With a ₹300 average cart the cap is always hit (₹150).

**CAC check:** cost per acquired customer ≈ (WELCOME50 cost + referral bonuses + ad spend) ÷ new customers with ≥1 delivered order. Compare against contribution margin per order (commission + delivery fee + packaging/platform fees − rider payout − payment gateway fees − discount share) × expected orders in 90 days.

**Kill switches:** `isActive` off on the coupon (instant), Feature Flags `coupons` off (disables all coupons — emergency only), Feature Flags `referral` off.

---

## 6. Measuring results

| Metric | Where | How |
|---|---|---|
| Redemptions per code | Admin → Finance → Coupons → `usedCount` column | Snapshot daily during a campaign (it's cumulative). |
| Discount spend (total) | Admin → Finance → Reports → type *Orders* → Export CSV | Sum the `discount` column for the date range (delivered orders only — filter `status`). |
| Discount by code | Database (read-only) | `db.orders.aggregate([{ $match: { status: 'delivered', 'coupon.code': { $nin: [null, ''] }, createdAt: { $gte: ISODate('[FROM]') } } }, { $group: { _id: '$coupon.code', orders: { $sum: 1 }, discount: { $sum: '$pricing.discount' }, gmv: { $sum: '$pricing.subtotal' } } }])` — the Reports CSV does not include the coupon code column. |
| Per-restaurant impact | Reports → type *Restaurants* | Orders, GMV, commission, vendorEarning per restaurant for the window vs. the previous window. |
| Banner performance | Admin → Banners → click counter | Clicks ÷ (estimated home sessions) — session analytics are not built; compare clicks between banners. |
| Push reach | Admin → Notifications → history | Delivery report per send (topic/tokens, email/SMS counts). Open rates are not tracked. |
| Referral | Admin → Finance → Transactions (type `referral_bonus`) | Count credits = sign-ups via referral (referee) and successful referrals (referrer). |
| New vs repeat | Reports *Orders* CSV | Pivot by customer name: first order date in window = new; >1 order = repeat. |
| Overall | Admin → Dashboard | Orders, revenue trends for the period. |

Analytics beyond the Reports page (cohorts, funnels, attribution) are not built — use the CSV exports in a spreadsheet, or add Firebase Analytics events as a dev task.

**Post-campaign review template:** code · window · usageLimit vs usedCount · discount spent · delivered orders with code · AOV with code vs without · new customers acquired · repeat rate after 14 days · funding split settled with vendors (Y/N) · keep / change / kill.

---

## 7. Not available today (do not promise; backlog)
Loyalty points, automatic user segmentation or lifecycle journeys, stacked coupons, BOGO / item-level discounts, cashback coupons (use wallet adjust in Admin → Users manually), automatic per-user unique codes, vendor self-serve ads marketplace, subscription meal plans, group ordering, multi-city zones.
