# FeastFlow — Feature Backlog

Ideas for after v1.0.0, grounded in what the codebase already has. Each item lists the modules it touches so it can be pasted straight into `UPDATE_PROMPT.md` ("Implement GRW-03 from feature-backlog.md").

**Priority**: P0 = do before/at scale-up (risk or revenue blocker) · P1 = next 1–2 releases · P2 = this year · P3 = nice to have.
**Effort**: S ≤ 3 dev-days · M ≈ 1–2 weeks · L ≈ 3–5 weeks · XL > 5 weeks (one full-stack developer; includes tests + docs).
**Module shorthand**: BE = `backend/` (M = models, C = controllers, R = routes, U = utils, V = validation rules) · AP = Admin Panel page(s) · VD = Vendor web dashboard · FC / FV / FD = Flutter customer / vendor / delivery flavor · CFG = `defaultConfig.js` + `AppConfig` schema + admin editor · TR = translation keys · FF = new feature flag.

Every item follows the conventions: new tunables in CFG, new text in TR, validators on new routes, e2e step in `tests/e2e.js`.

> Already in v1.0 (don't rebuild): scheduled orders with delivery slots (`scheduleOrder` flag + `businessRules.deliverySlots`), coupons engine, banners with scheduling, referral, wallet, featured restaurants flag, call-restaurant button (`chatWithVendor`), dark mode toggle, delivery OTP + photo proof, reports with CSV, RBAC, payment webhooks allowed during maintenance (OPS-07), `RUN_SCHEDULER` single-scheduler flag (INF-02).

---

## 1. Ordering & customer experience (ORD)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| ORD-01 | **Scheduled delivery improvements** | P1 | M | BE M Order, U scheduler (release scheduled orders to vendor X min before slot), C order; CFG `businessRules.deliverySlots` per weekday + `scheduleLeadMinutes`, `maxScheduleDays`; AP Business Rules; FC cart slot picker; FV/VD "scheduled" tab | Scheduling **already exists** (slots Lunch/Snacks/Dinner, scheduled orders excluded from the accept timeout). Improve: per-day slots, per-restaurant slot capacity, schedule up to N days ahead, vendor sees scheduled queue and gets a reminder, auto-release into the normal flow before the slot. |
| ORD-02 | **Group ordering** | P2 | L | BE new M GroupCart, C/R `/group-carts`, sockets room `group:<id>`; FC share link + join screen, per-person items, host checkout; FF `groupOrdering`; TR | Host creates a shared cart, friends add items via link, host pays (optional split via wallet transfers later). |
| ORD-03 | Bill splitting | P3 | M | BE C payment (multiple intents per order), M Order.payment[]; FC split screen; FF | Split payment between group members (depends on ORD-02). |
| ORD-04 | Reorder favourites & "usuals" | P2 | S | BE C order (top items per user); FC home section type `usuals`; CFG homeLayout new type; AP Layout Builder | One-tap "your usual" from history as a configurable home section. |
| ORD-05 | Order notes & cutlery opt-out | P1 | S | BE M Order (`notes`, `noCutlery`), V; FC cart; FV/VD order detail | Free-text instructions to restaurant + eco cutlery toggle (configurable). |
| ORD-06 | Item customisation upgrades | P2 | M | BE M MenuItem (variant groups min/max, required), pricing; VD/FV menu editor; FC item sheet | Required choices, min/max selections, size variants with price deltas. |
| ORD-07 | Live order modification window | P3 | M | BE orderFlow (edit while `placed`), pricing re-quote, payment delta; FC; FV | Add/remove items before vendor accepts. |
| ORD-08 | Dish-level search & rich filters | P1 | M | BE C restaurant/menu search (text index on MenuItem), R; FC search tabs Restaurants/Dishes; CFG `searchFilters` options | Search dishes across restaurants, filters by price, rating, delivery time, offers. |
| ORD-09 | Pickup / takeaway mode | P2 | M | BE M Order `fulfilment: delivery|pickup`, pricing (no delivery fee), orderFlow (`ready → delivered` by vendor); FC toggle; FV/VD; FF `takeaway`; CFG fees | Customer collects the order; skips rider assignment. |
| ORD-10 | Accessibility & large-text pass | P2 | S | FC/FV/FD widgets, semantics labels via TR | Screen-reader labels, contrast checks against theme tokens, text scaling. |

## 2. Growth, loyalty & retention (GRW)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| GRW-01 | Abandoned-cart nudges | P2 | S | BE scheduler job (or worker), M Cart snapshot, notify; CFG `abandonedCartMinutes`; FF | Push reminder N minutes after a cart is left (respect notification prefs). |
| GRW-02 | Customer segments for broadcasts | P1 | M | BE C notification (filters: last order date, city/zone, order count, spend), AP Notifications segment builder | Target pushes/coupons at lapsed users, high spenders, new users. |
| GRW-03 | **Loyalty points** | P1 | L | BE new M LoyaltyLedger, U pricing (redeem), orderFlow settle (earn on delivered, reverse on refund), C/R `/loyalty`; CFG `loyalty {earnPerAmount, redeemValue, minRedeem, expiryDays, tiers}`; FF `loyalty`; AP Loyalty settings + user ledger in Users; FC points balance, history, redeem at checkout; TR | Earn points per ₹ spent, redeem at checkout, expiry, optional tiers (Silver/Gold). Not built in v1.0. |
| GRW-04 | **Subscription meals** (meal plans) | P2 | XL | BE new M MealPlan, Subscription, C/R, scheduler creates recurring scheduled orders, payments (mandate/recurring via Razorpay Subscriptions / Stripe Billing); VD/FV plan setup; FC subscribe/pause/skip; AP plans + subscribers; FF `mealSubscriptions` | Weekly/monthly tiffin plans from a restaurant with pause/skip and auto-billing. Not built. |
| GRW-05 | Membership (free-delivery pass) | P2 | L | BE M Membership, pricing (free delivery / extra discount), recurring payments; CFG plans; AP; FC; FF | Paid customer membership like "FeastFlow Plus" [NAME PLACEHOLDER]. |
| GRW-06 | Gift cards / wallet gifting | P3 | M | BE M GiftCard, C redeem → wallet credit, Transaction type; AP generate/batch; FC redeem | Corporate/festive gift codes that credit the wallet. |
| GRW-07 | Referral tiers & campaign analytics | P2 | S | BE C referral stats, CFG tiered bonuses; AP Reports new type `referrals` | Bonus ladder, referral funnel report. |
| GRW-08 | Deep links & share | P1 | M | FC app links (Android App Links / iOS Universal Links) for restaurant/coupon/banner; BE `.well-known` files served by Nginx; CFG link domain | Share restaurant/dish/coupon links that open the app. |
| GRW-09 | In-app ratings prompt & NPS | P3 | S | FC native review prompt after Nth delivered order; CFG thresholds; BE M Feedback; AP Reports | Store rating prompt + NPS survey. |

## 3. Communication & support (COM)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| COM-01 | **In-app live chat** (customer ↔ support, customer ↔ rider, customer ↔ restaurant) | P1 | L | BE new M Conversation, Message, C/R `/chats`, sockets events `chat:message`, `chat:typing`, rooms per conversation, push on new message, upload images; AP Support inbox page (perm `support`); VD chat panel; FC/FV/FD chat screens; FF `inAppChat` (separate from existing `chatWithVendor`, which is only a call button); TR | Real-time chat tied to an order, with masked identities, canned replies for agents, auto-close after delivery + N hours. Not built in v1.0. |
| COM-02 | **WhatsApp Business API integration** | P1 | M | BE U `whatsapp.js` (Meta Cloud API or BSP), notify channel `whatsapp`, webhook route for inbound + status; env `WHATSAPP_*`; CFG templates mapping per event; AP Notifications channel checkbox; FF `whatsappNotifications` | Order updates, OTP fallback and support via approved templates. Today templates can only be used manually/third-party. |
| COM-03 | Help centre & ticketing in app | P2 | M | BE M Ticket, C/R; AP Tickets page (assign, SLA timers, refund action inline); FC "Help" on order; TR | Structured issue reporting per order (missing item, wrong item…) feeding the support playbook matrix. |
| COM-04 | Number masking for calls | P2 | M | BE U telephony (Twilio Proxy/Exotel), C; FC/FD call buttons | Customer and rider call each other without seeing numbers. |
| COM-05 | Email templates editor | P3 | M | BE M EmailTemplate + i18n; AP editor (RichTextEditor); U email | Branded transactional emails per language. |
| COM-06 | Notification preferences | P1 | S | BE M User.notificationPrefs, notify checks; FC settings; TR | Users opt in/out per channel and category (orders vs. promos) — needed for marketing consent under DPDP. |

## 4. Vendor tools (VND)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| VND-01 | **Vendor analytics upgrade** | P1 | M | BE C order/restaurant aggregations (hourly heatmap, item sales, repeat customers, cancellations by reason, avg prep time vs. promised, rating trend), R `/orders/vendor/analytics`; VD Dashboard charts (Charts.jsx); FV insights screen | Current vendor dashboard shows basics; add actionable analytics and CSV export. |
| VND-02 | **Vendor subscription plans** (SaaS tiers) | P2 | L | BE new M VendorPlan, VendorSubscription, billing (recurring payments or deduction from payouts), commission override per plan in `calculateCommission`; AP Plans page; VD plan/billing page; CFG plans; FF | Tiers with lower commission / featured slots / analytics access. Not built. |
| VND-03 | Inventory & stock counts | P2 | M | BE M MenuItem.stock, decrement on accept, auto-unavailable at 0; VD/FV | Daily stock limits per item. |
| VND-04 | Holiday & special hours | P1 | S | BE M Restaurant.specialHours, availability check; VD Timings; FV | Closures and special timings by date. |
| VND-05 | Auto-accept & busy mode | P1 | S | BE orderFlow (auto-accept when enabled), M Restaurant.autoAccept / extra prep time; VD/FV toggles; CFG allow | Reduce auto-rejections at peak; "busy" adds prep time to ETA. |
| VND-06 | Printer / KOT support | P2 | M | VD print layout (browser print), FV Bluetooth thermal printer plugin | Kitchen order tickets on accept. |
| VND-07 | Vendor self-onboarding with documents | P1 | M | BE M Restaurant.documents (FSSAI, GST, PAN, bank), upload, C; AP Vendors review view; VD/FV onboarding wizard; TR | KYC collection inside the product instead of email. |
| VND-08 | Bulk menu import (CSV) | P2 | S | BE C menu import with validation; VD upload + preview | Faster onboarding for large menus. |
| VND-09 | Multi-outlet / brand accounts | P3 | L | BE M Brand, User↔Restaurant many; VD outlet switcher; AP | One owner managing several outlets. |
| VND-10 | Vendor-funded offers | P2 | M | BE M Coupon.fundedBy (platform/vendor/shared %), settlement in `settleDelivered`; VD create offer; AP approve | Restaurants run their own discounts, cost charged to their earnings. |

## 5. Delivery & logistics (DLV)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| DLV-01 | Smarter dispatch (nearest rider, batching) | P1 | L | BE U new `dispatch.js` (score by distance from DeliveryPartner location, load, rating), orderFlow hooks, sockets `delivery:assigned`; CFG `dispatch {radiusKm, maxBatch, offerTimeoutSec}`; AP Business Rules | Replace broadcast-to-pool with ranked offers and optional 2-order batching. |
| DLV-02 | Rider shifts & incentives | P2 | M | BE M Shift, Incentive rules, settle bonus; CFG; AP Delivery Partners incentives; FD shifts screen | Peak-hour bonuses, minimum guarantee per shift. |
| DLV-03 | Rider cash (COD) reconciliation | P0 | M | BE M DeliveryPartner.cashInHand, Transaction types `cod_collected`/`cod_deposit`; AP Delivery Partners deposit action; FD cash summary | Track COD cash riders hold and deposits — prevents leakage as COD grows. |
| DLV-04 | Live ETA recalculation with maps | P2 | M | BE U eta via Directions API (env key), update `estimatedDeliveryAt` on location updates; FC tracking | Traffic-aware ETAs instead of km × minutes-per-km. |
| DLV-05 | Third-party fleet fallback | P3 | L | BE U adapter for logistics partner API ([PARTNER]), webhook routes; AP toggle per zone | Hand off orders when no in-house rider is available. |
| DLV-06 | Proof-of-delivery photo review | P3 | S | AP Orders filter "photo proof", gallery | Spot-check delivery photos for disputes. |

## 6. Monetisation & marketplace (MON)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| MON-01 | **Ads / promoted listings marketplace** | P2 | XL | BE new M AdCampaign (restaurant, placement search/home/category, bid or flat, budget, schedule), ranking hook in restaurant list/search, impression/click tracking, billing (deduct from vendor earnings or prepaid); AP Ads approval + revenue report; VD self-serve campaign creation + stats; FC "Promoted" label; FF `ads`; TR | Today only the admin `featured` flag and Banners exist (can be sold manually). This adds self-serve sponsored placements with budgets and reporting. |
| MON-02 | Dynamic surge by zone/time | P2 | M | BE pricing surge rules (time windows, rider/order ratio), CFG `surgeRules[]`; AP Business Rules | Automatic surge instead of the manual global toggle. |
| MON-03 | Small-order fee & distance bands | P1 | S | BE pricing, CFG `smallOrderFee {threshold, fee}`, `deliveryFeeBands[]`; AP Business Rules; FC bill rows (TR) | Finer fee control for unit economics. |
| MON-04 | Platform fee per order type | P3 | S | CFG, pricing | Different platform fee for scheduled/pickup/large orders. |

## 7. Finance & payouts (FIN)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| FIN-01 | **Vendor payout button in Admin** | P0 | S | AP Restaurants (Payout modal like DeliveryPartners → `POST /api/admin/payouts {kind:'vendor'}`), TR | API exists; admin UI currently only shows "pending payout". |
| FIN-02 | Automated payouts (RazorpayX / Stripe Connect) | P1 | L | BE U payouts adapter, M bank details (encrypted), scheduler weekly batch, webhooks for payout status; AP payout batches; VD bank details | Removes manual bank transfers. |
| FIN-03 | Vendor charge-backs / adjustments | P1 | S | BE C adjust restaurant wallet (+/−) with reason, Transaction type `vendor_adjustment`; AP Restaurants | Recover refunds caused by restaurant errors. |
| FIN-04 | GST invoices & tax reports | P0 | M | BE U invoice PDF per order (customer) and monthly commission invoice (vendor), M InvoiceCounter; CFG legal entity/GSTIN placeholders; AP Reports `tax`; FC download invoice | Needed for compliance in India (GST on commission, TCS under section 52 for e-commerce operators — confirm with your CA). |
| FIN-05 | Settlement statements for vendors | P1 | S | BE C statement aggregation; VD Payouts download CSV/PDF | Weekly statement: orders, commission, adjustments, payouts. |
| FIN-06 | Refund to source after wallet refund | P2 | S | BE C admin refund for `refunded`-to-wallet orders (debit wallet + gateway refund atomically); AP Orders | Today requires gateway dashboard + manual wallet debit. |
| FIN-07 | Payment reconciliation report | P1 | M | BE job pulls gateway settlements, matches Transactions; AP Reports `reconciliation` | Detect missing/duplicate payments automatically. |

## 8. Geography (GEO)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| GEO-01 | **Multi-city zones** | P1 | XL | BE new M Zone (GeoJSON polygon, city, active, overrides of businessRules: fees, surge, radius, slots, paymentMethods, codMaxAmount), U `zoneFor(point)`, pricing uses zone rules, Restaurant.zone, DeliveryPartner.zone, scoping of dispatch; AP Zones page with map polygon editor + per-zone Business Rules override, filters by zone on Orders/Reports/Dashboard; admin RBAC scoped to zones; FC city picker / "not serviceable" screen; CFG `zones` defaults; TR | Today there is one global `radiusKm` and one set of Business Rules. Zones enable launching new cities with their own pricing and city managers. |
| GEO-02 | Serviceability check & waitlist | P1 | S | BE C serviceability endpoint, M Waitlist; FC "we're coming soon" capture | Collect demand from unserved areas. |
| GEO-03 | Multi-currency / region pack | P3 | M | CFG per-zone currency, tax label; pricing formatting already config-driven | Launch outside India (VAT instead of GST, Stripe region). |

## 9. Dine-in & table services (DIN)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| DIN-01 | **Table booking** | P2 | L | BE new M Reservation (restaurant, slot, party size, status), C/R, notifications; Restaurant.tables/capacity; VD/FV reservations screen; FC book a table + manage; AP reservations report; FF `tableBooking`; CFG deposit/no-show rules | Reserve tables with confirmation, reminders, no-show policy. Not built. |
| DIN-02 | **Dine-in QR ordering** | P3 | L | BE M Order `fulfilment: dinein` + table no., QR generator per table, pay-at-table; VD table/QR management; FC (or lightweight web) scan → menu → order; FF `dineIn` | Order and pay from the table. Not built. |
| DIN-03 | Dine-in offers / pay bill | P3 | M | BE payment for external bill amount with offer; VD confirm; FC | Pay restaurant bill in-app with platform discount. |

## 10. AI & personalisation (AI)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| AI-01 | **AI search** (natural language + typo tolerant) | P2 | L | BE search service (MongoDB Atlas Search or vector embeddings of menu items), C restaurant/menu search, env for AI provider key; FC search UI ("spicy veg under ₹200 near me"); FF `aiSearch`; CFG provider/limits | Semantic dish search and query understanding; falls back to normal search. Not built. |
| AI-02 | Personalised home ranking | P2 | L | BE recommendation scoring (history, time of day, ratings), C home feed; CFG weights; SectionRenderer new section type `forYou` | "For you" section driven by order history. |
| AI-03 | Review summarisation & moderation assist | P3 | M | BE job summarising reviews per restaurant, toxicity flagging; AP Reviews flags; FC summary on restaurant page | Faster moderation, better restaurant pages. |
| AI-04 | Menu description & image enhancement | P3 | M | VD "improve description" button, translation of menus into enabled languages | Helps vendors with weak listings; auto-translate menus. |
| AI-05 | Demand forecasting for riders/vendors | P3 | L | BE analytics job; AP forecast chart; VD prep suggestions | Predict peak hours per zone. |

## 11. App experience & theming (APP)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| APP-01 | **Dark mode scheduler** | P3 | S | CFG `theme.darkModeSchedule {mode: system|manual|scheduled, from, to}`; AP Theme editor; FC/FV/FD DynamicTheme picks mode by time; web panels same via CSS variables | Automatic dark theme at night; today there is only a user toggle (`darkModeToggle`). |
| APP-02 | Seasonal themes & festive skins | P3 | S | CFG `theme.presets[]` with schedule; AP Theme editor preset scheduling | Auto-switch colors/banners for festivals. |
| APP-03 | Home layout A/B testing | P2 | M | BE assign variant per user, CFG `homeLayoutVariants`, metrics in Reports; AP Layout Builder variants | Test section order/offers impact on conversion. |
| APP-04 | Offline-first improvements | P3 | M | FC cache menus/orders (storage_service) | Better experience on weak networks. |
| APP-05 | Web ordering site (PWA) | P2 | XL | New web client using the same API + config/translations (or Flutter web build of customer flavor) | Order from browsers; SEO landing pages per restaurant. |

## 12. Admin, ops & observability (OPS)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| OPS-01 | Structured production logging | P0 | S | BE request logger (pino/morgan JSON in prod), log correlation id | morgan is dev-only today; production relies on Nginx logs. |
| OPS-02 | Error tracking (Sentry or similar) | P0 | S | BE errorHandler hook, env DSN; AP/VD/Flutter SDKs | Stack traces with context for every 5xx and app crash. |
| OPS-03 | Metrics & alerting endpoint | P1 | M | BE `/api/metrics` (protected) or OpenTelemetry; dashboards ([Grafana]) | Latency, 5xx, socket connections, scheduler runs, queue depth. |
| OPS-04 | Admin audit log | P0 | M | BE M AuditLog written by admin routes (who/what/before/after), C/R; AP Audit page (perm `roles`) | Accountability for refunds, wallet adjustments, config changes. |
| OPS-05 | Bulk actions in Orders/Users | P2 | S | AP DataTable selection, BE batch endpoints with validators | Bulk cancel/reassign/notify. |
| OPS-06 | Stuck-order & refund-failure alerts | P1 | S | BE scheduler checks (orders stuck per status, cancelled+paid, wallet-fallback refunds after a failed gateway refund), notify admins room/email; CFG thresholds; AP Dashboard widget | Automates the manual checks in the daily runbook. |
| OPS-07 | ~~Maintenance allow-list for payment webhooks~~ **Done in v1.0.0** | — | — | BE middleware/maintenance.js `ALLOW_PREFIXES` includes `/payments/webhook` | Gateway webhooks keep working during maintenance mode. |
| OPS-08 | Config change history & rollback | P2 | M | BE M ConfigRevision on every `updateSection`, restore endpoint; AP "History" drawer on config pages | Undo a bad Business Rules save in one click. |
| OPS-09 | Vendor/rider document expiry reminders | P3 | S | BE scheduler + notify; AP flags | FSSAI/licence/insurance expiry tracking. |

## 13. Infrastructure & scale (INF)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| INF-01 | **Redis** integration | P1 | M | BE `utils/redis.js`, `@socket.io/redis-adapter` in server.js, `rate-limit-redis` in middleware/rateLimiter.js, config-cache invalidation pub/sub, read caches; env `REDIS_URL`; docker-compose `redis` service; docs | Prerequisite for multiple API instances. Not used anywhere today. |
| INF-02 | ~~Single-instance scheduler guard~~ **Done in v1.0.0** (`RUN_SCHEDULER` env) | P2 (hardening) remainder | S | Done: BE server.js starts the scheduler only when `RUN_SCHEDULER` ≠ `false`; `.env.example`; ENVIRONMENT_SETUP; DEPLOYMENT_GUIDE. Remaining idea: MongoDB/Redis lease lock or separate worker + atomic state transition in scheduler; tests/scheduler.js | Set `RUN_SCHEDULER=false` on every API instance except one. The lock would only protect against misconfiguration (see scaling roadmap Stage 4). |
| INF-03 | Background job queue | P1 | M | BE queue (BullMQ on Redis) for broadcasts, emails, SMS, webhooks retries; worker entrypoint; compose service | Moves slow work out of HTTP requests (broadcasts to "all" currently run inline). |
| INF-04 | Graceful shutdown & readiness probe | P1 | S | BE server.js SIGTERM handler (close HTTP, sockets, Mongo), `/api/health/ready` checks DB | Zero-downtime deploys, k8s readiness. |
| INF-05 | Migrate local uploads to S3 + CDN | P1 | S | Script to copy `uploads/` to bucket and rewrite stored URLs; env `UPLOAD_DRIVER=s3`; docs | Enables multi-instance and CDN delivery. |
| INF-06 | Image thumbnails/optimisation | P2 | M | BE upload pipeline (sharp) → multiple sizes / WebP; Flutter/web use sized URLs | Faster lists, lower bandwidth. |
| INF-07 | CI pipeline | P0 | S | `.github/workflows` (node --check, e2e with Mongo service, vite builds, flutter analyze/test, docker build) | Automates the update checks. |
| INF-08 | Staging environment | P1 | S | Second compose stack / subdomain, seeded demo data, test gateway keys | Safe place to test releases. |

## 14. Security & compliance (SEC)

| ID | Feature | Pri | Effort | Modules touched | Description |
|---|---|---|---|---|---|
| SEC-01 | Admin 2FA (TOTP) | P0 | M | BE M User.totpSecret, auth flow for admin role, C/R; AP setup + login step; TR | Protects the most powerful accounts. |
| SEC-02 | DPDP consent & data export | P1 | M | BE M Consent records, data export endpoint (JSON of user's data), retention jobs; FC consent screen + "download my data"; AP grievance requests | DPDP Act 2023 alignment (consent, access, erasure, grievance). Have counsel review. |
| SEC-03 | Fraud rules (refund abuse, multi-accounting, COD no-shows) | P1 | M | BE risk scoring on order placement (device id, address reuse, refund ratio), COD block list; CFG thresholds; AP flagged users | Reduce abuse losses. |
| SEC-04 | Session/device management | P2 | S | BE list/revoke refresh tokens per device; FC/FV/FD settings; AP force logout user | Users and admins can sign out other devices. |
| SEC-05 | Secrets manager support | P3 | S | BE env loader from AWS/GCP secret manager | Replace plain `.env` on servers. |

---

## Suggested sequencing

1. **Hardening sprint (P0):** FIN-01, OPS-01, OPS-02, OPS-04, INF-07, SEC-01, DLV-03, FIN-04.
2. **Retention & ops (P1):** COM-06, ORD-05, VND-04, VND-05, OPS-06, GRW-02, VND-01, GRW-03, COM-01, COM-02, ORD-01, ORD-08.
3. **Scale-out:** INF-01, INF-02 (lease lock, optional hardening), INF-03, INF-04, INF-05, GEO-01, DLV-01, FIN-02.
4. **New revenue lines (P2):** MON-01, VND-02, GRW-04, GRW-05, DIN-01.
5. **Differentiators (P2–P3):** AI-01, AI-02, ORD-02, APP-01, DIN-02.

Count: 90 items across 14 areas (OPS-07 and the `RUN_SCHEDULER` part of INF-02 already done in v1.0.0).
