# FeastFlow: Revenue Model

> **What this is:** every way FeastFlow makes (or passes through) money, mapped to the code and Admin Panel settings that drive it. All defaults below come from `backend/config/defaultConfig.js` and are editable at runtime in **Admin Panel → Config → Business Rules** (changes go live to every app at once over the `config:updated` socket event).
>
> **Source of truth for the maths:** `backend/utils/pricing.js` (`calculateBill`, `calculateCouponDiscount`, `calculateDeliveryPayout`, `calculateCommission`) and `backend/controllers/orderController.js` (`createOrder`), with settlement in `backend/utils/orderFlow.js` (`settleDelivered`, `refundCancelled`).

---

## 1. Summary table

| # | Stream | Status | Config key(s) | Admin page | Who keeps it |
|---|---|---|---|---|---|
| 1 | Restaurant commission | **Live** | `businessRules.commissionPercent` (default **18**) + per-restaurant `Restaurant.commissionPercent` | Finance → **Commission** (global + per-restaurant override) | Platform |
| 2 | Customer delivery fee | **Live** | `deliveryFee.base` (30), `deliveryFee.baseKm` (2), `deliveryFee.perKm` (8), `deliveryFee.freeAbove` (499) | Config → **Business Rules** | Platform (pays rider separately) |
| 3 | Rider payout (cost against #2) | **Live** | `deliveryPartnerPayout.base` (25), `.perKm` (6), `.tipSharePercent` (100) | Config → **Business Rules** | Rider |
| 4 | Surge fee | **Live** (off by default) | `surgePricing.enabled` (false), `.multiplier` (1.5), `.reason` ("High demand") | Config → **Business Rules** | Platform (100%, rider payout unchanged) |
| 5 | Platform fee | **Live** (₹0 by default) | `platformFee` (0) | Config → **Business Rules** | Platform |
| 6 | Packaging fee | **Live** (pass-through) | `packagingFee` (15) | Config → **Business Rules** | **Restaurant** (added to `vendorEarning`) |
| 7 | Cancellation penalty | **Live** | `cancellationWindowMinutes` (5), `cancellationPenaltyPercent` (10) | Config → **Business Rules** | Platform (withheld from refund) |
| 8 | Float: wallet balances & payout cycle | **Live** (indirect) | `walletMaxUsePercent` (50), `minPayoutAmount` (500), feature flag `wallet` | Users (wallet adjust), Finance → Transactions | Platform holds cash until paid out |
| 9 | COD | **Live** (cost/risk, not revenue) | `paymentMethods.cod` (on), `codMaxAmount` (2000) | Config → **Business Rules** | Cash held by rider until deposited |
| 10 | Featured placement & banners (ads) | **Manual** | `Restaurant.isFeatured`; Banners collection | Operations → **Restaurants** (featured flag); Config → **Banners**; Config → **Home Layout** | Platform (sold offline, invoiced manually) |
| 11 | Self-serve ads / promoted-listings marketplace | **Backlog** | none | none | none |
| 12 | Vendor subscription plans | **Backlog** | none | none | none |
| 13 | Tips | **Live** (pass-through, **not revenue**) | `tipPresets` (10/20/30/50), `maxTipPercent` (100), `deliveryPartnerPayout.tipSharePercent` (100); flags `tipping`, `deliveryPartnerTips` | Config → **Business Rules**, **Feature Flags** | Rider (100%) |
| 14 | Taxes (GST on food) | **Live** (pass-through, **not revenue**) | `taxPercent` (5), `taxLabel` ("GST") | Config → **Business Rules** | Government |
| 15 | Coupons, referral & wallet credits | **Live** (cost, not revenue) | Coupons collection; `referralBonus` (50), `refereeBonus` (50) | Finance → **Coupons**; Config → **Business Rules** | Cost: see section 4 |

**Status legend:** **Live** = works end-to-end in the product today. **Manual** = the product has the switch but no billing; sales and invoicing happen outside the platform. **Backlog** = not built; needs development.

---

## 2. How an order's money is split (exactly as coded)

At checkout, `calculateBill()` builds the customer's bill:

```
deliveryFee  = 0                                     if (freeAbove > 0 and subtotal >= freeAbove) or a free_delivery coupon applies
             = base + max(0, distanceKm − baseKm) × perKm    otherwise
surgeFee     = deliveryFee × (multiplier − 1)        if surge enabled, multiplier > 1 and deliveryFee > 0; else 0
discount     = min(couponDiscount, subtotal)
taxable      = max(0, subtotal − discount)
tax          = taxable × taxPercent / 100            (tax is on food only; not on fees)
tip          = min(tip, maxTipPercent% × subtotal)
total        = taxable + deliveryFee + surgeFee + packagingFee + platformFee + tax + tip
walletUsed   = min(walletBalance, total × walletMaxUsePercent / 100)   (if customer opts in)
payable      = total − walletUsed
```

Then `createOrder()` fixes each party's share on the order record:

```
commission.amount = (subtotal − discount) × commissionPercent / 100
                    (commissionPercent = restaurant override if set, else global)
vendorEarning     = subtotal − discount − commission.amount + packagingFee
deliveryEarning   = payout.base + distanceKm × payout.perKm + tip × tipSharePercent / 100
```

On **delivery** (`settleDelivered`), `vendorEarning` is credited to the restaurant's wallet, `deliveryEarning` to the rider's wallet, and a `commission` transaction is recorded. Payouts to banks are **manual transfers** that admin records via the payouts endpoint (`POST /api/admin/payouts`, permission `transactions`), which debits the in-app wallet and stores the bank reference.

**What the platform keeps per delivered order** is therefore:

```
platformNet = commission.amount
            + deliveryFee + surgeFee + platformFee
            − (payout.base + distanceKm × payout.perKm)        ← rider's distance pay
            + tip × (100 − tipSharePercent) / 100              ← 0 at default 100%
            − payment-gateway fees (charged by Razorpay/Stripe on the amount collected online)
```

Tax is collected on top and is owed to the government (see stream 14). Packaging goes to the restaurant.

> **Important (coupon funding):** because `vendorEarning = subtotal − discount − commission + packaging`, **every coupon discount, including platform-wide ones like WELCOME50, is currently deducted from the restaurant's earning**, not from the platform's. The platform only "loses" the commission on the discounted amount. Decide your policy **before** you onboard vendors (see section 4 and `vendor-onboarding-script.md`).

---

## 3. Stream-by-stream

### 3.1 Commission (core revenue), Live
- **How it works:** a percentage of the food subtotal after coupon discount. It does not apply to delivery fee, packaging, tax or tip.
- **Config:** `businessRules.commissionPercent` = **18** by default. Per-restaurant override: `Restaurant.commissionPercent` (null = use global).
- **Admin:** **Finance → Commission** shows the global rate and the list of overrides. Set an override per restaurant (for example 10% for a launch partner), or clear it to fall back to global.
- **Timing:** the rate is captured on the order when it is **placed**. Changing an override does not re-price existing orders.
- **Reporting:** Dashboard totals and **Finance → Reports** (revenue by restaurant: orders, GMV, commission, vendor earning) aggregate `commission.amount`.
- **Levers:** tiered launch offers (for example 0–10% for the first N months), exclusivity discounts, higher rates for featured partners. All of these are done by editing the override by hand; there is no automatic expiry, so put a calendar reminder on each one.

### 3.2 Customer delivery fee, Live
- **Formula:** `base + max(0, distanceKm − baseKm) × perKm`, waived when `subtotal ≥ freeAbove` (set `freeAbove` = 0 to never waive) or when a `free_delivery` coupon such as **FREEDEL** is applied.
- **Defaults:** ₹30 for the first 2 km, then ₹8/km; free above ₹499.
- **Delivery is a cost centre at default settings.** The rider is paid `25 + 6 × distanceKm` on the **full** distance, while the customer pays per-km only beyond 2 km:

| Distance (km) | Customer fee (₹) | Rider distance pay (₹) | Delivery margin (₹) |
|---|---|---|---|
| 1 | 30 | 31 | −1 |
| 2 | 30 | 37 | −7 |
| 3 | 38 | 43 | −5 |
| 4 | 46 | 49 | −3 |
| 5 | 54 | 55 | −1 |
| 6 | 62 | 61 | +1 |
| 8 | 78 | 73 | +5 |
| 10 (max radius) | 94 | 85 | +9 |
| any distance, order ≥ ₹499 | 0 | 25 + 6×km | −(25 + 6×km) |

  For distances ≥ 2 km the margin is `2 × km − 11`, so it breaks even at **5.5 km**. Commission funds the gap. To make delivery self-funding, raise `base` or lower `baseKm`, or raise `freeAbove`. Model any change in `unit-economics.md` first.

### 3.3 Surge fee, Live (disabled by default)
- **How it works:** when `surgePricing.enabled` is true, a separate **Surge fee** line equal to `deliveryFee × (multiplier − 1)` appears, labelled with `surgePricing.reason`. At 1.5× on a ₹46 delivery fee that is ₹23.
- **Who keeps it:** 100% platform. The rider payout formula does not include surge. If you want riders to share surge (recommended for rain or peak-hour supply), that needs a code change (backlog) or a manual incentive paid out through payouts.
- **No surge on free-delivery orders** (surge only applies when `deliveryFee > 0`).
- **Ops:** surge is a single global switch, not per zone or per time. An admin toggles it by hand in Business Rules (multi-zone and scheduled surge are backlog).

### 3.4 Platform fee, Live (₹0 default)
- A flat per-order amount added to the bill as "Platform fee". 100% platform revenue.
- Recommended: keep at ₹0 for launch (competitive positioning), then test a small fee (for example ₹2–5) once retention data exists. Changes apply instantly to all carts.
- **Tax note:** the code applies `taxPercent` to food only. Delivery, surge and platform fees are not taxed by the code, so treat them as **GST-inclusive** in your books (or change the code). Confirm the treatment with your CA.

### 3.5 Packaging fee, Live (pass-through to restaurant)
- `packagingFee` (default ₹15) is a flat per-order amount charged to the customer and **added to `vendorEarning` in full**. The platform keeps none of it and charges no commission on it.
- It is a global value, not set per restaurant or per item. Use it in the vendor pitch: "packaging cost is reimbursed by the customer."

### 3.6 Cancellation penalty, Live
- If a **customer** cancels more than `cancellationWindowMinutes` (5) after placing, `cancellationPenaltyPercent` (10%) is withheld from the refund (`refundCancelled(order, penalty)`). The withheld amount stays with the platform. Vendor rejections, auto-rejections (vendor did not accept within `vendorAcceptTimeoutMinutes` = 5) and unpaid-order timeouts are refunded in full.
- This is not meant as revenue. It discourages abuse and offsets food already prepared. If restaurants started cooking, consider sharing it with them manually.

### 3.7 Float: wallet, payout cycle, Live (indirect)
- **Customer wallet:** referral credits, refunds-to-wallet and admin adjustments sit as balances; customers can pay up to `walletMaxUsePercent` (50%) of a bill from the wallet, or 100% with the "wallet" payment method. Money that has been topped up or refunded and not yet spent is a **liability you hold**.
- **Vendor & rider wallets:** earnings accrue on delivery and are paid out manually (vendor minimum `minPayoutAmount` = ₹500). Between delivery and payout the platform holds the cash (the float).
- **Treat float as working capital, not income.** Keep it in a separate current account, reconcile weekly against **Finance → Transactions**, and get advice on prepaid-instrument rules before allowing customers to top up the wallet with cash (consult a payments lawyer; in India see RBI's PPI framework).

### 3.8 COD, Live (operational cost)
- Enabled by default; orders with `payable > codMaxAmount` (₹2,000) cannot use COD. The rider app shows the **amount to collect** (`collectAmount`).
- On delivery the order is marked paid. The rider's in-app earnings are credited as usual, but **the app has no cash ledger for COD cash held by riders**. You must reconcile cash deposits by hand (daily) against delivered COD orders from **Operations → Orders** / **Finance → Reports**. No gateway fee applies, but cash handling, leakage and fake-order risk do.

### 3.9 Featured placement & banners (advertising), Manual
- **What exists:** the restaurant **featured** flag (**Operations → Restaurants**). Featured restaurants sort first in the default listing and appear in the "Featured" home section (**Config → Home Layout**). **Banners** (**Config → Banners**) have placement (home / offers / restaurant / cart), deep link (restaurant / category / cuisine / URL / coupon), start/end dates, ordering and a **click counter**.
- **How to monetise today:** sell packages offline (for example "featured for 7 days" or "home banner for 14 days"), invoice outside the platform, switch the flag on or set the banner dates, and report clicks from the banner's click counter. Track contracts in a spreadsheet.
- **Not built:** self-serve booking, bidding/CPC, impressions tracking, automatic billing or deduction from payouts. This is the **ads marketplace backlog** item.

### 3.10 Vendor subscriptions, Backlog
- Not built: no plans, billing or plan-gated features. Possible future: "FeastFlow Plus for restaurants" (lower commission plus featured slots for a monthly fee). Until it exists, you can run a manual version by setting a lower commission override and invoicing a fixed fee offline.

### 3.11 Tips, pass-through (not revenue)
- The customer picks a preset (₹10/20/30/50) or a custom amount, capped at `maxTipPercent` (100%) of the subtotal. With `tipSharePercent` = **100** the rider receives the entire tip in `deliveryEarning`. If the `deliveryPartnerTips` flag is off, the tip is still charged but is not added to the rider payout, so **keep it on** while tipping is on. Never count tips as revenue in pitch material.

### 3.12 Taxes, pass-through (not revenue)
- `taxPercent` (5%, labelled "GST") is applied to `subtotal − discount` and shown as its own line. The amount is not part of `vendorEarning`, so the platform holds it.
- **India:** under GST law, e-commerce operators are generally made liable to collect and pay GST on restaurant services supplied through them. FeastFlow's structure (platform holds the tax line) is consistent with that, but the filing, invoicing format, TCS and the GST on your **own** fees (commission, delivery, platform fee, ads) **must be set up with a Chartered Accountant**. This document is not tax advice.
- **Other regions:** change `taxPercent`, `taxLabel`, `currencyCode` and `currencySymbol` in Business Rules. Check whether local rules make the marketplace or the restaurant the collector.

---

## 4. Costs embedded in the product (not revenue, but they shape it)

| Cost | Mechanism (as coded) | Who bears it today |
|---|---|---|
| Coupon discounts (WELCOME50: 50% off up to ₹150, min ₹199, first order; FLAT100: ₹100 off ≥ ₹599; FREEDEL: free delivery ≥ ₹249) | `discount` reduces `vendorEarning`; commission is charged on `subtotal − discount` | **Restaurant** pays the discount; platform loses commission on it. FREEDEL: **platform** loses the delivery fee but still pays the rider. |
| Referral credits | `referralBonus` ₹50 to referrer (on the referee's first delivered order) + `refereeBonus` ₹50 to new user on sign-up, as wallet credit | **Platform**: wallet spending reduces what the customer pays but `vendorEarning` is unchanged |
| Wallet refunds | Cancelled paid orders are refunded to the gateway, falling back to wallet | Neutral (refund) |
| Free delivery above ₹499 | Delivery fee 0; rider still paid | **Platform** |
| Payment gateway fees | Razorpay or Stripe (one active, `PAYMENT_PROVIDER`) charges on the online amount | **Platform** |
| SMS/OTP, push, email | Twilio, FCM, SMTP per message | **Platform** |

**Coupon funding: choose one policy and write it into the vendor agreement:**
1. **Vendor-funded (matches the code today):** be explicit with partners that platform coupons reduce their payout, and in return offer a lower commission. Easy to run, but partners may object.
2. **Platform-funded:** reimburse restaurants for platform-wide coupon discounts through an **off-platform settlement** (monthly statement and bank transfer, tracked in a spreadsheet). The app has no "credit vendor" button: admin payouts only debit the vendor wallet.
3. **Co-funded / restaurant-specific only:** run platform coupons only as restaurant-specific coupons (`restaurant` field set) agreed with that partner.
4. **Backlog:** add a `fundedBy` / platform-share field on coupons so `vendorEarning` is computed correctly automatically.

---

## 5. Revenue roadmap (backlog, prioritised)

| Priority | Item | Why |
|---|---|---|
| P1 | Coupon funding split (`fundedBy` field) | Lets you run platform-funded acquisition without hurting vendors |
| P1 | COD cash ledger for riders | Cuts cash leakage; required before COD scales |
| P2 | Self-serve promoted listings (bidding or fixed slots, impression/click tracking, deduct from payouts) | Turns the manual featured/banner sales into a scalable ads business |
| P2 | Surge sharing with riders + per-zone/time surge | Peak-hour supply |
| P2 | Time-bound commission overrides (auto-expire launch offers) | Removes manual reminders |
| P3 | Vendor subscription plans | Recurring revenue, less dependence on commission |
| P3 | Customer membership (free delivery pass) | Retention plus recurring revenue |
| P3 | Multi-city zones with per-zone business rules | Needed for expansion beyond one city |

---

## 6. Changing the model safely
1. Model the change in the spreadsheet in `unit-economics.md`.
2. Edit **Admin → Config → Business Rules** (or **Commission** for rates). Apps update live, and the cart re-quotes from `POST /api/orders/quote`.
3. Place a test order and check the bill lines against the formulas above.
4. Tell partners at least [NOTICE PERIOD, e.g. 15 days] ahead of any commission change, as your vendor agreement requires.
5. Watch **Finance → Reports** for a week afterwards (orders, GMV, commission, vendor earnings).
