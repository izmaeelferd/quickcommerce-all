# FeastFlow: Launch Checklist (Week −8 to Week +4)

> Week 0 = **soft launch** in one zone of [CITY]. Each item has an owner field; put a name next to every box. Lead times are typical, not guaranteed (store reviews, KYC and licences can take longer), so start anything marked "(long lead)" as early as possible.
>
> Not legal or tax advice. Confirm registrations and obligations with a CA and a lawyer in your jurisdiction. India-specific items are marked (IN); see "Adapting for other regions" at the end.
>
> Technical references in the codebase: `docs/DEPLOYMENT_GUIDE.md`, `docs/ENVIRONMENT_SETUP.md`, `docs/CONFIGURATION_GUIDE.md`, `docs/FLUTTER_BUILD_GUIDE.md`, `docs/PLAY_STORE_DEPLOYMENT.md`, `docs/APP_STORE_DEPLOYMENT.md`.

**Launch targets (fill in):**
| Target | Value |
|---|---|
| Launch zone | [ZONE / AREA NAME] (delivery radius `radiusKm` default 10 km) |
| Soft launch date (Week 0) | [DATE] |
| Restaurants live at soft launch | [TARGET N, e.g. aim for enough choice across cuisines/price points] |
| Riders approved at soft launch | [TARGET N] |
| Orders/day target by Week +4 | [TARGET] |
| Launch budget | [₹ AMOUNT] |

---

## Week −8: Company, compliance, accounts (long lead times)

**Legal & finance**
- [ ] Incorporate / confirm legal entity: [COMPANY LEGAL NAME] ([ENTITY TYPE]) · owner: ___ (long lead)
- [ ] PAN, TAN for the entity (IN) · owner: ___
- [ ] Current bank account (separate account for customer/vendor money float recommended) · owner: ___ (long lead)
- [ ] **GST registration**. E-commerce operators generally need GST registration regardless of turnover. Ask your CA about operator obligations on restaurant services and TCS (IN) · owner: ___ (long lead)
- [ ] **FSSAI**: confirm with your consultant whether the platform needs its own FSSAI licence as an e-commerce food business operator, and set the rule that **every partner restaurant must hold a valid FSSAI licence/registration** (IN) · owner: ___ (long lead)
- [ ] Shops & Establishment registration / trade licence for office (IN) · owner: ___
- [ ] Engage CA (bookkeeping, GST returns) and lawyer (T&Cs, vendor and rider agreements) · owner: ___
- [ ] Trademark search and filing for "FeastFlow" + logo in your classes · owner: ___ (long lead)
- [ ] Insurance: general liability; consider rider accident cover · owner: ___

**Payments**
- [ ] Choose the gateway: **Razorpay** (India) or **Stripe** (`PAYMENT_PROVIDER` env, one active at a time) · owner: ___
- [ ] Submit gateway **business KYC** (entity docs, bank, website with policies live; see Week −6 legal pages) (long lead) · owner: ___
- [ ] Negotiate MDR / pricing; write the actual % into `unit-economics.md` (replaces the 2% assumption) · owner: ___

**Developer & service accounts**
- [ ] **Apple Developer Program** (organisation account needs a D-U-N-S number) (long lead) · owner: ___
- [ ] **Google Play Console** (organisation account; identity verification) (long lead) · owner: ___
- [ ] **Firebase** project: Android + iOS apps for all 3 flavours (customer, vendor, delivery); download service account JSON → `FIREBASE_SERVICE_ACCOUNT_PATH`; APNs key for iOS push · owner: ___
- [ ] **Twilio** account, buy/verify sender (`TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`). (IN) DLT registration of sender ID and SMS templates is required for India SMS (long lead) · owner: ___
- [ ] **SMTP** provider (transactional email): `SMTP_HOST/PORT/SECURE/USER/PASS`, `EMAIL_FROM`; set SPF, DKIM, DMARC on the domain · owner: ___
- [ ] **Google Sign-In** OAuth client IDs (`GOOGLE_CLIENT_IDS`), **Sign in with Apple** (`APPLE_CLIENT_ID`) if flags `googleSignIn` / `appleSignIn` stay on · owner: ___
- [ ] Google Maps / map tiles API key as required by the Flutter build (see `FLUTTER_BUILD_GUIDE.md`) · owner: ___

**Brand & domain**
- [ ] Register domain [DOMAIN]; plan DNS: `api.`, `admin.`, `partner.` subdomains (per DEPLOYMENT_GUIDE §0) + marketing site [WEBSITE URL] · owner: ___
- [ ] Logo, app icons, splash, brand colours, font · owner: ___
- [ ] Support channels: [SUPPORT EMAIL], [SUPPORT PHONE], WhatsApp number for manual support · owner: ___

---

## Week −7: Infrastructure & deployment

- [ ] Provision VPS (Ubuntu 22.04/24.04) sized for launch; create `deploy` user, UFW, Nginx, certbot (DEPLOYMENT_GUIDE §1) · owner: ___
- [ ] DNS A records for `api.[DOMAIN]`, `admin.[DOMAIN]`, `partner.[DOMAIN]` · owner: ___
- [ ] Clone repo to `/opt/food-delivery`, `cp backend/.env.example backend/.env` and fill in **every** key (ENVIRONMENT_SETUP.md): `NODE_ENV=production`, `PUBLIC_BASE_URL`, `CLIENT_URLS`, strong distinct `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (`openssl rand -hex 48`), `ADMIN_DEFAULT_EMAIL`, strong `ADMIN_DEFAULT_PASSWORD`, payment keys, SMTP, Twilio, Firebase, uploads · owner: ___
- [ ] Choose deploy path: **A. Docker Compose** (recommended) or **B. Node 20 + MongoDB 7 + PM2 (`food-api`)** · owner: ___
- [ ] Uploads: local `backend/uploads` (back it up) or `UPLOAD_DRIVER=s3` with `AWS_*` keys · owner: ___
- [ ] Nginx reverse proxy (with WebSocket upgrade for Socket.io) + TLS via certbot (§3–4) · owner: ___
- [ ] Go-live checks (§6): `curl https://api.[DOMAIN]/api/health` returns `{"status":"ok","env":"production"}`; `/api/config` returns JSON; CORS locked to your origins · owner: ___
- [ ] Log in to Admin at `https://admin.[DOMAIN]` and **change the admin password immediately** (navbar) · owner: ___
- [ ] Do **not** run the sample-data seed on production unless you intend to delete demo restaurants/users afterwards; if you used it for testing, remove demo accounts (`customer@example.com`, `rider@example.com`, `vendor1-4@example.com`) before launch · owner: ___
- [ ] Backups: cron the mongodump command (Path A `docker compose exec -T mongo mongodump --archive --gzip > backup-$(date +%F).gz`; Path B `mongodump --archive=backup.gz --gzip`), copy off-site, back up uploads; **test a restore** · owner: ___
- [ ] Uptime monitoring on `/api/health`; disk and memory alerts · owner: ___
- [ ] Run the scheduler on exactly **one** API instance (vendor-accept timeout, payment timeout jobs run in-process): keep `RUN_SCHEDULER=true` (default) there and set `RUN_SCHEDULER=false` on any additional instance · owner: ___

---

## Week −6: Payments, webhooks, legal pages

- [ ] **Razorpay webhook** → `https://api.[DOMAIN]/api/payments/webhook/razorpay`, events `payment.captured`, `order.paid`; secret → `RAZORPAY_WEBHOOK_SECRET` · owner: ___
- [ ] **Stripe webhook** (if used) → `https://api.[DOMAIN]/api/payments/webhook/stripe`, event `payment_intent.succeeded`; secret → `STRIPE_WEBHOOK_SECRET` · owner: ___
- [ ] Restart API after `.env` edits (`docker compose up -d backend` / `pm2 restart food-api`) · owner: ___
- [ ] Test-mode payments: success, failure, abandoned payment (auto-cancel after `paymentTimeoutMinutes` = 15), refund to source, refund fallback to wallet, late payment on a cancelled order (auto-refund) · owner: ___
- [ ] Lawyer-reviewed **Legal Pages** in Admin → Config → Legal Pages: `privacyPolicy` (DPDP Act 2023 (IN): purposes, consent, grievance officer [GRIEVANCE OFFICER NAME], data retention), `termsAndConditions`, `refundPolicy` (match your cancellation rules: 5-min window, 10% penalty after), `aboutUs` · owner: ___
- [ ] Publish the same policies on [WEBSITE URL] (needed for gateway KYC and store listings) · owner: ___
- [ ] Draft **Vendor Partner Agreement** (commission, coupon funding policy, payout cycle, min payout ₹500, FSSAI responsibility, food safety, cancellations, termination) · owner: ___
- [ ] Draft **Rider Agreement** (independent contractor vs employee per local law, pay formula, COD cash deposit policy, conduct, insurance) · owner: ___
- [ ] Draft the internal **payout SOP**: weekly vendor and rider bank transfers recorded in Admin with bank reference; COD cash reconciliation daily · owner: ___

---

## Week −5: Admin configuration (Config section)

- [ ] **Branding**: app name "FeastFlow", logos, support contacts (replace seeded "FoodHub" defaults everywhere) · owner: ___
- [ ] **Theme**: brand colours, light/dark · owner: ___
- [ ] **Languages**: review en and hi strings (also es, ar RTL, fr if used); disable languages you won't support · owner: ___
- [ ] **Business Rules**, reviewed line by line (see `revenue-model.md`):
  - [ ] Currency ₹ / INR · tax 5% "GST" (confirm with CA)
  - [ ] Commission 18% (or your launch rate)
  - [ ] Delivery fee base ₹30 / baseKm 2 / perKm ₹8 / freeAbove ₹499
  - [ ] Rider payout ₹25 + ₹6/km, tip share 100%
  - [ ] Packaging ₹15, platform fee ₹0, min order ₹99
  - [ ] Surge **off** (enable manually for rain/peaks)
  - [ ] Radius 10 km (consider smaller for launch density)
  - [ ] Cancellation window 5 min / penalty 10%
  - [ ] Vendor accept timeout 5 min, payment timeout 15 min, auto-assign delivery on
  - [ ] Payment methods (card/UPI/wallet/COD on, netbanking off), COD cap ₹2,000
  - [ ] Wallet max 50%, referral ₹50/₹50, min payout ₹500
  - [ ] Delivery slots (Lunch 12–14, Snacks 16–18, Dinner 19–22) match restaurant hours
- [ ] **Feature Flags**: decide each (all default on). Keep `deliveryOtp`, `deliveryPhotoProof`, `liveTracking`, `deliveryPartnerTips` on; turn off `appleSignIn`/`googleSignIn` if not configured; `smsNotifications` off until DLT is approved (IN) · owner: ___
- [ ] **Coupons**: review seeded WELCOME50 / FLAT100 / FREEDEL; set `validFrom/validTo`, `usageLimit` (budget cap), `showInOffers`; decide **coupon funding policy** (code deducts discount from vendor earning) · owner: ___
- [ ] **Banners**: launch banners (home + offers), deep links to coupon/cuisine, start/end dates · owner: ___
- [ ] **Home Layout**: section order (search, banners, categories, offers, featured, cuisines, top rated, all) · owner: ___
- [ ] **Categories / cuisines** cleaned up for your city · owner: ___
- [ ] **Admin Roles**: create least-privilege roles (ops, finance, support); individual logins, no shared admin password · owner: ___
- [ ] **Maintenance** screen text ready (and force-update version settings) · owner: ___

---

## Week −4: Supply: restaurants and riders

**Vendor onboarding (see `vendor-onboarding-script.md`)**
- [ ] Target list of [N] restaurants in the launch zone (mix cuisines, veg/non-veg, price points, late-night) · owner: ___
- [ ] Field team trained on the pitch, objection handling and launch offer · owner: ___
- [ ] Launch offer decided: e.g. [X]% commission for first [N] months via **Finance → Commission** override; record end dates in a tracker · owner: ___
- [ ] Document collection (FSSAI, GST if registered, PAN, bank/cancelled cheque, menu, photos) · owner: ___
- [ ] Each restaurant: registers in **FeastFlow Partner** / partner web → admin approves in **Operations → Vendors** → restaurant visible; menu, add-ons, timings, photos complete; owner trained on accepting within 5 min · owner: ___
- [ ] Weekly target: [N] signed / [N] live · owner: ___

**Rider recruiting (see `delivery-recruitment-post.md`)**
- [ ] Post job ads (long form, WhatsApp/Facebook groups, posters near rider hangouts) · owner: ___
- [ ] Onboarding day: install **FeastFlow Rider**, register (vehicle type/number, licence, documents), verify documents, approve in **Operations → Delivery Partners** · owner: ___
- [ ] Rider kit: delivery bag, [T-SHIRT], ID card; COD cash deposit process explained · owner: ___
- [ ] Shift plan for lunch and dinner peaks · owner: ___

---

## Week −3: Mobile builds and store submission

- [ ] Build all three flavours with production API (`--dart-define=API_BASE_URL=https://api.[DOMAIN]`), per `FLUTTER_BUILD_GUIDE.md`: **FeastFlow**, **FeastFlow Partner**, **FeastFlow Rider**; set bundle IDs/package names, icons, signing keys (back up the upload keystore!) · owner: ___
- [ ] Store listings: titles, descriptions, screenshots, privacy policy URL, data safety (Play) / privacy nutrition labels (Apple), content rating · owner: ___
- [ ] Rider app location: Play **foreground service (location)** declaration with video of the "You are online" notification (no background-location declaration needed); iOS Rider target with its own Info.plist (`location` background mode + Always usage string) built with `--dart-define=IOS_BACKGROUND_LOCATION=true` (FLUTTER_BUILD_GUIDE §5 item 6); explain delivery tracking clearly · owner: ___
- [ ] Create dedicated reviewer accounts → put [REVIEW DEMO EMAIL] / [REVIEW DEMO PASSWORD] in review notes; ensure a demo restaurant is open so reviewers can place an order · owner: ___
- [ ] Submit to **Google Play** (internal → closed testing → production; new personal accounts may need a closed test period) (long lead) · owner: ___
- [ ] Submit to **App Store** (TestFlight → review) (long lead) · owner: ___
- [ ] Vendor and rider apps can also be distributed via Play internal testing first if store review is slow · owner: ___

---

## Week −2: End-to-end test orders (staging data in prod, then cleaned up)

- [ ] Run at least [N] full test orders across restaurants and riders:
  - [ ] UPI, card, wallet, COD (and COD over ₹2,000 blocked)
  - [ ] Coupon: WELCOME50 first order, FLAT100, FREEDEL; invalid/expired coupon messages
  - [ ] Scheduled order in a delivery slot
  - [ ] Vendor doesn't accept in 5 min → auto-reject + refund
  - [ ] Customer cancels inside vs after the 5-min window (10% penalty)
  - [ ] Rider pickup → delivery OTP → photo proof → earnings credited
  - [ ] Push, SMS, email notifications at each status
  - [ ] Live tracking on map, ETA sensible
  - [ ] Review + vendor reply; admin hide/show review
  - [ ] Referral: new user gets ₹50, referrer gets ₹50 after first delivery
- [ ] Verify bill lines against the formulas in `unit-economics.md` · owner: ___
- [ ] Verify **Finance → Reports** totals and **Transactions** match the test orders · owner: ___
- [ ] Do a test payout: record vendor and rider payouts with a bank reference · owner: ___
- [ ] Refund/void all test payments; delete or deactivate test data · owner: ___
- [ ] Load sanity: several simultaneous orders; server resource check · owner: ___

---

## Week −1: Readiness

- [ ] Restaurants live ≥ [TARGET N]; all menus have photos and prices verified · owner: ___
- [ ] Riders approved ≥ [TARGET N]; shift roster for Week 0 · owner: ___
- [ ] Support runbook: refunds (Admin → Orders), reassign rider, restaurant closed, rider no-show, wrong item, COD shortfall; escalation phone tree · owner: ___
- [ ] Ops dashboard watch: Admin → Dashboard + Orders open on a screen during peaks · owner: ___
- [ ] Marketing assets ready: social posts, local influencer/creator briefs, flyers with QR, launch push copy · owner: ___
- [ ] Friends & family beta (invite-only, [N] users) · owner: ___
- [ ] Go/no-go meeting: store apps approved? payments live? webhooks verified? backups tested? · owner: ___

---

## Week 0: Soft launch in one zone

- [ ] Switch payment gateway to **live** keys; confirm webhook in live mode · owner: ___
- [ ] Release apps publicly (or staged rollout on Play) · owner: ___
- [ ] Launch push broadcast (Admin → System → Notifications) and banners · owner: ___
- [ ] Daily stand-up: orders, cancellations, accept time, delivery time, complaints · owner: ___
- [ ] Daily COD cash reconciliation with riders · owner: ___
- [ ] Turn on surge manually only in genuine supply crunches (rain), and communicate rider incentives · owner: ___
- [ ] Log every bug/feedback item; hotfix policy agreed · owner: ___

## Week +1
- [ ] First weekly vendor payout cycle (≥ ₹500 balances) + rider payouts; send statements · owner: ___
- [ ] Review restaurant performance: rejection rate, prep time, ratings; coach or pause poor performers · owner: ___
- [ ] Coupon budget check vs `usageLimit`; adjust · owner: ___
- [ ] Ask happy customers for store ratings (never incentivise reviews) · owner: ___

## Week +2
- [ ] Unit-economics actuals: AOV, distance, CM per order vs model; update spreadsheet · owner: ___
- [ ] Tune Business Rules if needed (delivery fee, free-delivery threshold, radius) · owner: ___
- [ ] Referral push to existing customers; first featured/banner sales to restaurants (manual) · owner: ___
- [ ] Recruit riders for gaps found in peak hours · owner: ___

## Week +3
- [ ] Onboard second wave of restaurants in the zone (fill cuisine gaps) · owner: ___
- [ ] Retention: cohort repeat rate; win-back push to lapsed customers · owner: ___
- [ ] Security review: rotate any shared credentials, check admin roles, check backup restore again · owner: ___

## Week +4
- [ ] Launch retrospective: what worked, what to fix · owner: ___
- [ ] Decide: expand radius / second zone (separate deployment or wait for multi-zone feature) · owner: ___
- [ ] Update pitch deck traction slide with real numbers from Finance → Reports · owner: ___
- [ ] Prioritise backlog (coupon co-funding, COD ledger, ads marketplace) based on data · owner: ___

---

## Adapting for other regions
| India item | Generic equivalent |
|---|---|
| GST registration & e-commerce operator rules | VAT/sales-tax registration; marketplace facilitator rules |
| FSSAI | Local food business registration / health department licence |
| DPDP Act 2023 | GDPR / local privacy law (DPO, consent, data rights) |
| Twilio DLT registration | Local sender ID / 10DLC / short-code registration |
| Razorpay | Stripe (set `PAYMENT_PROVIDER=stripe`), local acquirer |
| ₹ / INR, UPI, COD cap | Change currency, payment methods and COD cap in Business Rules |
