# FeastFlow — 30-Day Launch Campaign Plan

A day-by-day / week-by-week plan from a 14-day pre-launch waitlist through the first 30 days live in **[CITY]**, with every action mapped to the exact place in the FeastFlow Admin Panel (or vendor/rider apps) and the settings to use.

- **T0** = public launch day. Pre-launch = T-14 … T-1. Launch window = T0 … T+30.
- Social posts referenced as `IG-xx`, `X-xx`, `LI-xx`, `FB-xx` are in `social-media-kit.md`. Coupon recipes are in `promo-strategies.md`. Message templates in `whatsapp-broadcast-templates.md`. Ads in `google-ads-copy.md`. Press in `app-store-announcement-press-release.md`.
- Admin paths use the sidebar labels: **Config** (Theme, Branding, Home Layout, Banners, Feature Flags, Business Rules, Languages, Legal Pages, Maintenance), **Operations** (Orders, Vendors, Restaurants, Categories, Reviews, Delivery Partners, Users), **Finance** (Transactions, Coupons, Commission, Reports), **System** (Notifications, Admin Roles, Settings). All config changes go live instantly to apps (no app release needed).

> **Not in the codebase:** a public website or waitlist landing page. Use a form tool for the waitlist — `[WAITLIST FORM TOOL]` (e.g. Google Forms, Typeform, Tally) — and host links at `[WAITLIST LINK]`. Collect: name, phone/email, locality, **explicit marketing consent checkbox** (unticked by default), and "how did you hear about us". Waitlist sign-ups are not users in the app; you notify them by email/SMS from your form tool or email provider, not from Admin → Notifications (which only reaches registered app users).

---

## Phase overview

| Phase | Days | Goal | Primary levers |
|---|---|---|---|
| 0. Readiness | T-21 … T-15 | Supply + config ready | Vendors, Restaurants, Delivery Partners approval; Business Rules; Legal Pages |
| 1. Pre-launch waitlist | T-14 … T-1 | Build demand list; finish supply | Waitlist form, social teasers, partner/rider recruitment, coupons + banners pre-scheduled |
| 2. Launch week | T0 … T+6 | First orders, flawless ops | WELCOME50, launch banners, broadcasts, PR, ads |
| 3. Referral push | T+7 … T+16 | Viral loop, second orders | Referral bonus boost, FLAT100/FREEDEL, weekend codes |
| 4. Habit & retention | T+17 … T+30 | Repeat orders, win-back | Lunch slot offers, restaurant-specific coupons, manual win-back |

---

## Phase 0 — Readiness checklist (T-21 … T-15)

| # | Action | Where | Settings |
|---|---|---|---|
| 0.1 | Brand the apps | Config → Branding | App name **FeastFlow**, logo, support email/phone `[SUPPORT EMAIL]` / `[SUPPORT PHONE]` |
| 0.2 | Colours | Config → Theme | Brand palette; check dark mode (`darkModeToggle` flag) |
| 0.3 | Commercials | Config → Business Rules | Confirm: `commissionPercent` (default 18), `deliveryFee` {base 30, baseKm 2, perKm 8, freeAbove 499}, `packagingFee` 15, `platformFee` 0, `taxPercent` 5, `minOrderValue` 99, `radiusKm` 10, `deliverySlots`, `paymentMethods` (card/upi/wallet/cod), `codMaxAmount` 2000, `minPayoutAmount` 500, `deliveryPartnerPayout` {base 25, perKm 6, tipSharePercent 100} |
| 0.4 | Per-restaurant commission deals | Finance → Commission | Override for launch partners if you offered intro rates |
| 0.5 | Legal pages | Config → Legal Pages | Publish `privacyPolicy`, `termsAndConditions` (include coupon/referral T&C), `refundPolicy`, `aboutUs` (have a lawyer review) |
| 0.6 | Feature flags | Config → Feature Flags | Keep on: `coupons`, `wallet`, `referral`, `tipping`, `deliveryPartnerTips`, `liveTracking`, `scheduleOrder`, `vegOnlyFilter`, `deliveryOtp`, `pushNotifications`, `onboarding`. Turn on `emailNotifications`/`smsNotifications` only if SMTP / Twilio are configured. Turn **off** `appleSignIn`/`googleSignIn` if not configured. |
| 0.7 | Supply approval | Operations → Vendors, Restaurants, Delivery Partners | Approve launch restaurants (target `[N]`) and riders (target `[N]`). Verify menus, photos, veg tags, add-ons, Timings. |
| 0.8 | Categories & cuisines | Operations → Categories | Clean category list with images (used by home and banner links) |
| 0.9 | Team access | System → Admin Roles | Create "Marketing" role (Coupons, Banners, Notifications, Reports) and "Support" role (Orders, Users) — no Settings/Business Rules |
| 0.10 | Partner funding agreement | Off-platform | Decide who funds coupon discounts — **as built, item discounts are deducted from vendorEarning** (see promo-strategies.md §1.3) |
| 0.11 | Store listings | Play Console / App Store Connect | Listings, screenshots, reviewer demo accounts `[REVIEW DEMO EMAIL]` / `[REVIEW DEMO PASSWORD]` (create dedicated accounts, not seed accounts) |

---

## Phase 1 — Pre-launch waitlist (T-14 … T-1)

| Day | Action | Where / exact settings | Owner |
|---|---|---|---|
| **T-14** | Waitlist form live; founder post; teaser | `[WAITLIST FORM TOOL]` → `[WAITLIST LINK]`; social IG-01, X-01, LI-01 | Marketing |
| T-14 | Start restaurant partner outreach (in person + LinkedIn) | LI-02 (T-12); share `[PARTNER SIGNUP URL]` / FeastFlow Partner app download; approve in Operations → Vendors | Partnerships |
| T-13 | Facebook waitlist post; join local community groups | FB-01 | Marketing |
| T-12 | Partner onboarding WhatsApp sequence starts | Templates V1–V3 (whatsapp-broadcast-templates.md) via BSP/manual | Partnerships |
| T-10 | Rider recruitment | LI-03, X-10; riders register in FeastFlow Rider app → approve in Operations → Delivery Partners | Ops |
| T-10 | Google Ads account build (paused) | google-ads-copy.md structure; link Firebase | Growth |
| T-9 | Community poll | FB-02 | Marketing |
| **T-7** | Create launch coupons, **scheduled** | Finance → Coupons: **WELCOME50** — discountType `percent`, value 50, maxDiscount 150, minOrderValue 199, firstOrderOnly on, perUserLimit 1, usageLimit `[BUDGET ÷ 150]`, validFrom **T0 00:00**, validTo **T+30 23:59**, isActive on, showInOffers on. Edit seeded **FLAT100** (flat 100, maxDiscount 100, minOrderValue 599, perUserLimit 3) and **FREEDEL** (free_delivery, value 0, minOrderValue 249, perUserLimit 5): set validFrom T0 00:00, validTo T+30 23:59, usageLimit from budget. | Marketing + Finance review |
| T-7 | Countdown posts | IG-02, X-02; email waitlist "7 days to go" from your email tool | Marketing |
| T-6 | Soft-launch / friends & family test (real orders, real payments) | Invite 20–50 testers; watch Operations → Orders; test refund flow from Orders; test coupon errors (min order, first order) | Ops |
| T-5 | Fix issues; verify push delivery | System → Notifications → audience `customer`, channels `push`+`inapp`, to internal testers via **User IDs** field | Tech |
| **T-3** | Schedule launch banners | Config → Banners: **(1)** title "50% off your first order", subtitle "Code WELCOME50 · up to ₹150 · min ₹199", image 1200×600, placement `home`, linkType `coupon`, linkValue `WELCOME50`, startDate T0 00:00, endDate T+30 23:59, order 1. **(2)** "Free delivery above ₹499", placement `home`, linkType `none`, order 2, same dates. **(3)** "FLAT100 · ₹100 off above ₹599", placement `cart`, linkType `coupon`, linkValue `FLAT100`. **(4)** same WELCOME50 banner on placement `offers`. | Marketing |
| T-3 | Home layout | Config → Home Layout | Order: search, banners, offers, categories, featured, cuisines, top rated, all restaurants |
| T-3 | Feature 6–10 strongest restaurants | Operations → Restaurants → `featured` on | Partnerships |
| T-3 | Launch restaurant spotlight | IG-03 | Marketing |
| T-2 | Press kit + media pitch sent under embargo | app-store-announcement-press-release.md | PR |
| T-2 | Vendor + rider briefing | WhatsApp V4 (launch briefing), R1 (rider launch); confirm restaurants set Timings and are **open** on T0 | Ops |
| T-1 | Final QA: Maintenance mode off; app versions set (minVersion, latestVersion, forceUpdate off, storeUrlAndroid / storeUrlIos filled with real store links) | Config → Maintenance; System → Settings (app versions for customer / vendor / delivery) | Tech |
| T-1 | Waitlist email "Tomorrow" + app links (pre-registration if Play pre-registration is used) | Email tool | Marketing |
| T-1 | Backup DB | `docker compose exec -T mongo mongodump --archive --gzip > backup-$(date +%F).gz` | Tech |

**Phase 1 KPIs**

| KPI | Target | Source |
|---|---|---|
| Waitlist sign-ups (with consent) | [TARGET] | Form tool |
| Approved restaurants live with complete menus | [TARGET] | Operations → Restaurants |
| Approved riders (and expected online at peak) | [TARGET] | Operations → Delivery Partners |
| Soft-launch orders delivered without manual intervention | ≥ [90]% | Operations → Orders |
| Social followers / engagement rate | [TARGET] | Platform insights |
| Media pitches sent / responses | [N] / [N] | PR tracker |

---

## Phase 2 — Launch week (T0 … T+6)

| Day | Time | Action | Where / exact settings |
|---|---|---|---|
| **T0** | 07:00 | Smoke test: health check, test order, coupon WELCOME50 appears on Offers | `GET /api/health`; customer app |
| T0 | 09:00 | Press release out; LI-04 | PR wire / email; LinkedIn |
| T0 | 10:00 | Waitlist email + SMS "We're live" with `[APP LINK]` + WELCOME50 | Email/SMS tool (waitlist is outside the app) |
| T0 | 11:30 | Launch broadcast #1 (lunch) | System → Notifications: audience `customer`, title "FeastFlow is live in [CITY]", body "Your first order is 50% off with WELCOME50 (up to ₹150, min ₹199). Order lunch now.", channels `push` + `inapp` |
| T0 | 11:30 | Social launch | IG-04, X-03 (pin), FB-03 |
| T0 | 11:30 | Start Google Ads (Brand, Offers, Generic) + App campaign | google-ads-copy.md |
| T0 | 12:00–15:00 / 19:00–22:30 | War room: watch Orders for stuck `placed` orders (auto-rejected after `vendorAcceptTimeoutMinutes` 5 → refunded), unassigned orders (assign manually in Orders), payment failures | Operations → Orders; `docker compose logs -f backend` |
| T0 | 18:30 | Launch broadcast #2 (dinner) | Notifications: audience `customer`, "Dinner's on FeastFlow tonight", "Order from [X] [CITY] restaurants. New here? WELCOME50 = 50% off.", `push` + `inapp` |
| T0 | 22:30 | Day-1 review: orders, coupon `usedCount`, cancellations, rider coverage | Dashboard; Finance → Coupons; Reports |
| T+1 | 11:00 | How-to-order content | FB-04, X-04; Story |
| T+1 | | Vendor check-in: acceptance speed, out-of-stock toggling | WhatsApp V5 (menu update reminder) |
| T+2 | | Tracking explainer | IG-05 |
| T+2 | | Reviews moderation | Operations → Reviews (hide abusive only; never hide honest negative reviews) |
| T+3 | | Behind the build; payments post | LI-05, X-05, FB-05 |
| T+3 | | If demand > riders at peak: enable surge | Config → Business Rules → `surgePricing` {enabled true, multiplier 1.25–1.5, reason "High demand"}; **pause discount pushes while on**; disable after peak |
| **T+4 (Fri)** | 17:00 | Weekend push | Notifications: `customer`, "Weekend feast, sorted", "FREEDEL: free delivery above ₹249. FLAT100: ₹100 off above ₹599.", `push`+`inapp`; X-09; IG-06 |
| T+4 | | Weekend banner | Banners: "Free delivery this weekend · FREEDEL", placement `home`, linkType `coupon`, linkValue `FREEDEL`, start Fri 17:00, end Sun 23:59, order 1 (move WELCOME50 to order 2) |
| T+5 | | Tips post; restaurant spotlight | X-06, FB-06 |
| T+6 | | Veg filter post; rider economics | IG-07, LI-06 |
| T+6 | | Week-1 review + vendor payout reconciliation of coupon funding (if platform-funded) | Reports → Orders CSV (`discount`, `vendorEarning`), Reports → Restaurants |

**Phase 2 KPIs**

| KPI | Definition | Source |
|---|---|---|
| Installs | Store installs | Play Console / App Store Connect |
| Sign-ups | New customer accounts | Operations → Users (joined date) |
| Install → first order | First orders ÷ installs | Store console + WELCOME50 `usedCount` |
| Orders/day, GMV/day | Delivered orders, sum subtotal | Dashboard; Reports → Orders |
| WELCOME50 redemptions & spend | `usedCount`; sum `discount` | Finance → Coupons; Reports CSV |
| Vendor acceptance rate / auto-rejects | Rejected (timeout) ÷ placed | Reports → Orders (`status`) |
| Cancellation rate | cancelled+rejected ÷ placed | Reports → Orders |
| Avg delivery rating | | Reports → Reviews (`deliveryRating`) |
| Restaurant rating | | Reports → Reviews (`rating`) |
| Support contacts per 100 orders | | Your support inbox |
| Banner clicks | WELCOME50 banner `clicks` | Config → Banners |
| CPI / CPA | Ad spend ÷ installs / first orders | Google Ads |

---

## Phase 3 — Referral push (T+7 … T+16)

| Day | Action | Where / exact settings |
|---|---|---|
| **T+7** | Verify referral is on | Config → Feature Flags → `referral` on, `wallet` on |
| T+7 | Lunch slot content | X-07, FB-07 (Sat family dinner, FLAT100) |
| T+8 | Founder learnings (real numbers only), hiring | LI-09, LI-07 |
| **T+9** | **Boost referral for 7 days** | Config → Business Rules → `referralBonus` 50 → **100** (referrer, paid after referee's first delivered order); keep `refereeBonus` **50** (paid at sign-up — keep modest to limit fake sign-ups). Note the change date/time in the campaign log. |
| T+9 | Referral banner | Banners: title "Refer a friend, earn ₹100", subtitle "They get ₹50 on sign-up", placement `home`, linkType `none` (or `url` to a referral explainer page), start T+9, end T+15 23:59, order 1 |
| T+9 | Referral broadcast | Notifications: audience `customer`, title "Earn ₹100 for every friend", body "Share your FeastFlow referral code. Friends get ₹50 on sign-up; you get ₹100 when their first order is delivered. This week only.", `push`+`inapp` |
| T+9 | Social | IG-08; X-08 (T+10); FB-08 (T+10) |
| T+10 | Second-order nudge to customers with exactly one order | Identify via DB query (promo-strategies.md §2.8 — change `$match` to `orders: 1`); Notifications → **User IDs** = pasted list; body "Your next order: FLAT100 above ₹599 or FREEDEL above ₹249." |
| T+11 (Fri) | Weekend #2 | Create `WKND[DATE]` (percent 20, maxDiscount 80, minOrderValue 349, perUserLimit 2, validFrom Sat 00:00, validTo Sun 23:59, usageLimit from budget, showInOffers on) + banner linkType `coupon` + Fri 17:00 push; X-09 |
| T+11 | Partner spotlight | LI-08 |
| T+12 | Rider appreciation + safety | IG-09, FB-09; rider message R4 (weekly earnings summary) |
| T+13 | Office lunch pitch | LI-10 |
| T+14 | Restaurant recruitment wave 2; community thank-you | X-10, FB-10 |
| **T+16** | **Restore referral bonus** | Business Rules → `referralBonus` 100 → 50; end-date the referral banner (already set) |
| T+16 | Check referral abuse | Finance → Transactions: filter type `referral_bonus`; look for clusters of referee credits with no orders; Operations → Users → ban fraudulent accounts and adjust wallet (negative amount) with reason |

**Phase 3 KPIs**

| KPI | Definition | Source |
|---|---|---|
| Referral sign-ups | Count of referee `referral_bonus` credits | Finance → Transactions |
| Successful referrals | Referrer credits (after first delivered order) | Finance → Transactions |
| Referral conversion | Successful ÷ referral sign-ups | Above |
| Referral cost | (₹50 × sign-ups) + (₹100 × successful) | Above |
| 2nd-order rate | Customers with ≥ 2 delivered orders ÷ customers with ≥ 1 | DB query / Reports CSV pivot |
| FLAT100 / FREEDEL / WKND usage | `usedCount` | Finance → Coupons |
| AOV | Avg subtotal of delivered orders | Reports → Orders |
| Fraud rate | Banned accounts ÷ referral sign-ups | Operations → Users |

---

## Phase 4 — Habit & retention (T+17 … T+30)

| Days | Action | Where / exact settings |
|---|---|---|
| T+17 – T+21 (Mon–Fri) | **Lunch week** | Coupons: `LUNCH60` daily — flat 60, maxDiscount 60, minOrderValue 249, perUserLimit 1, validFrom 10:30, validTo 14:00 each day (create five, future-dated), usageLimit `[daily budget ÷ 60]`, showInOffers on. Banner placement `home`, linkType `category` → "Lunch"/"Thali", start/end per day. Push 10:30 daily: "Book your 12–2 PM lunch slot. ₹60 off above ₹249 till 2 PM." |
| T+17 | Restaurant-specific promos for 2–3 slow restaurants | Coupons: `[RESTO]20` — percent 20, maxDiscount 100, minOrderValue 299, **restaurant = [that restaurant]**, perUserLimit 2, 7 days. Restaurants → `featured` on for the same week. Banner placement `home`, linkType `restaurant`. Funding agreed in writing (WhatsApp V6). |
| T+18 (Fri) | Weekend #3 | Same as T+11 recipe; consider `FRIYAY` free_delivery above ₹199 instead of % off (compare with weekend #2 results) |
| **T+21** | **Win-back #1** — users with 1+ delivered orders, none in last 14 days; and sign-ups who never ordered | DB query (promo-strategies.md §2.8). Coupons: `MISSYOU75` — flat 75, maxDiscount 75, minOrderValue 299, perUserLimit 1, validTo +7 days, **showInOffers off**, usageLimit = targeted × 0.3. `COMEBACK40` for never-ordered — percent 40, maxDiscount 120, minOrderValue 199, firstOrderOnly on, showInOffers off. Notifications → **User IDs** = list, channels `push`+`inapp` (+`email` if configured; only to users who have not opted out of marketing). |
| T+22 | Rate-and-review prompt content | Social/Story: "Tell restaurants what you loved" — reviews feature (`reviews` flag) |
| T+24 | Vendor performance review | Reports → Restaurants (orders, GMV, commission); Reviews; message V7 (performance tips) |
| T+25 (Fri) | Weekend #4 + festival readiness | If a festival falls in the next 30 days, create its coupon now with future validFrom (promo-strategies.md §2.5) |
| T+27 | WELCOME50 decision for month 2 | Keep, tighten (e.g. maxDiscount 100) or switch to WELCOME100 flat. Extend `validTo` on the coupon **and** `endDate` on the WELCOME50 banners together. |
| T+28 | Win-back #1 results | `MISSYOU75`/`COMEBACK40` `usedCount` ÷ users targeted |
| T+30 | **30-day review** | See below. Deactivate expired/exhausted codes (`isActive` off), archive banners, backup DB. |

**Phase 4 KPIs**

| KPI | Definition | Source |
|---|---|---|
| Weekly active customers | Distinct customers with a delivered order in the week | Reports → Orders CSV |
| Repeat rate (30-day) | Customers with ≥ 2 orders ÷ customers with ≥ 1 | Reports CSV / DB |
| Lunch-slot share | Scheduled orders (`scheduledFor` between 12:00–14:00) ÷ all lunch-window orders | DB (`orders.scheduledFor`) |
| LUNCH60 redemptions | `usedCount` per day | Finance → Coupons |
| Win-back rate | Redemptions ÷ users targeted | Coupons |
| Discount as % of GMV | Σ discount ÷ Σ subtotal | Reports → Orders |
| Contribution per order | commission + delivery fee + packaging + platform fee − rider payout − gateway fees − platform-funded discount | Reports → Orders + Transactions |
| Restaurant churn | Restaurants with 0 orders in last 7 days / deactivated | Reports → Restaurants |
| Rider utilisation | Deliveries per active rider per day | Reports → Delivery |

---

## 30-day review template

| Area | Result | vs. target | Decision |
|---|---|---|---|
| Installs / sign-ups / first orders | | | |
| Orders, GMV, AOV | | | |
| Repeat rate | | | |
| Total promo spend (coupons + referral) and % of GMV | | | |
| CAC (ads + promo) per first-order customer | | | |
| Best / worst coupon by cost per incremental order | | | |
| Ops: cancellations, auto-rejects, avg delivery rating | | | |
| Supply: active restaurants, riders at peak | | | |
| Top 3 customer complaints | | | |
| Month-2 plan | | | |

## Daily ops checklist during the campaign
- [ ] Morning: Dashboard + yesterday's Reports → Orders; coupon `usedCount` vs `usageLimit`; banners active and not expired.
- [ ] Before each scheduled push: coupon in message is active and valid for the whole window.
- [ ] Peak hours: Operations → Orders for stuck orders; riders online; decide on surge.
- [ ] Evening: support tickets, reviews, social replies.
- [ ] Any Business Rules change (fees, referral, surge) logged with date/time and reason.

## Not available (plan around it)
No automated segments/journeys, no A/B testing, no in-app chat, no loyalty points, no group ordering, no WhatsApp API integration, no multi-city, no analytics beyond the Reports page and Dashboard, no public website/landing page in the codebase.
