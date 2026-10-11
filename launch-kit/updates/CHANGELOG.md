# Changelog

All notable changes to FeastFlow (API, Admin Panel, Vendor Dashboard, and the FeastFlow / FeastFlow Partner / FeastFlow Rider apps) are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Custom home sections, configured in Admin Panel -> Home layout builder -> Custom content: promo card (image, text, button link), hand-picked restaurants, hand-picked dishes, rich-text block and spacer. Every section can also set a background color and vertical padding.
- `GET /api/menu/public/items?ids=` and an `ids` filter on `GET /api/restaurants` for hand-picked sections.
- Server-side validation of every home section (allow-listed fields, clamped numbers, hex colors, http(s) links, sanitized HTML).
### Changed
- Admin Panel and vendor dashboard use an SVG line-icon set instead of emoji; default brand names are FeastFlow / FeastFlow Partner / FeastFlow Rider.
### Deprecated
### Removed
### Fixed
### Security

---

## [1.0.0] - [RELEASE DATE YYYY-MM-DD]

Initial production release. Platform version 1.0.0 (`backend/package.json` 1.0.0, Flutter `pubspec.yaml` `version: 1.0.0+1`, Admin Panel → Settings → App Versions `minVersion`/`latestVersion` 1.0.0 for all three apps).

### Added

#### Platform & dynamic configuration
- Fully config-driven platform: theme, branding, onboarding, home layout, banners, feature flags, business rules, legal pages, languages, maintenance mode and app version gates stored in a singleton `AppConfig` (deep-merged over `config/defaultConfig.js`) and editable live from the Admin Panel.
- Live config push: every admin save emits `config:updated` over Socket.io; open apps and panels reload instantly (maintenance redirects immediately).
- 22 feature flags (wallet, coupons, tipping, reviews, favorites, referral, liveTracking, chatWithVendor [call restaurant], deliveryPartnerTips, scheduleOrder, vegOnlyFilter, searchFilters, googleSignIn, appleSignIn, otpLogin, email/sms/pushNotifications, onboarding, darkModeToggle, deliveryPhotoProof, deliveryOtp), enforced in the UI (`FeatureGate`, `FeatureRoute`) and on the API.
- Business rules engine: commission (global + per-restaurant override), distance-based delivery fee with free-delivery threshold, surge pricing, tax, packaging and platform fees, minimum order, tips, referral bonuses, wallet usage cap, COD limit, cancellation window and penalty, rider payout formula, ETA formula, delivery slots, payment method toggles, minimum payout.
- Multi-language UI: 1,278 English strings plus Hindi, Spanish, Arabic (RTL) and French core strings; every visible string is a dotted translation key editable in Admin → Languages.

#### Customer app (FeastFlow)
- Onboarding; login with OTP, email + password, Google and Apple.
- Configurable home (search, banners, categories, offers, featured, cuisines, top rated, all restaurants) rendered by `SectionRenderer`.
- Search with filters and veg-only; restaurant page with menu and add-ons; favorites.
- Cart with server-computed bill, tips, coupons, wallet; scheduled delivery slots.
- Payments: UPI, card (Razorpay or Stripe), wallet, cash on delivery.
- Live order tracking with rider location on the map, ETA, delivery OTP; call restaurant.
- Order history and reorder; ratings and reviews; addresses; referral program; notifications.
- Dark mode, maintenance screen, force-update screen, account deletion.

#### Vendor app (FeastFlow Partner) and Vendor web dashboard
- Accept/reject incoming orders with countdown; preparing / ready status updates.
- Menu, menu categories, add-ons, item availability toggle; opening timings; open/close toggle.
- Reviews with replies; earnings and payouts view with minimum payout; restaurant profile.
- Web dashboard pages: Dashboard, Orders, Menu, Categories, Timings, Reviews, Payouts, Settings.

#### Delivery app (FeastFlow Rider)
- Registration with admin approval; online/offline toggle; auto-assigned and available orders.
- Navigation to pickup and drop; pickup → deliver with OTP and optional photo proof.
- Location sharing while online, including in the background: on Android via a location foreground service with a persistent "You are online" notification (stops when the rider goes offline); on iOS when the Rider target is built with its own Info.plist (`location` background mode + Always usage string) and `--dart-define=IOS_BACKGROUND_LOCATION=true`, otherwise only while the app is open.
- Earnings (base + per-km + tip share) and delivery history.

#### Admin Panel
- Dashboard (today's orders, GMV, commission, revenue trend, payment mix, top restaurants, recent orders).
- Config: Theme editor with live preview, Branding, Home Layout builder (drag and drop), Banners (placement, links, scheduling, click counter), Feature Flags, Business Rules, Languages, Legal Pages (rich-text), Maintenance.
- Operations: Orders (status filter, search, manual status change, rider assignment, refunds to source or wallet), Vendors (approval queue, suspend), Restaurants (edit, featured flag, deactivate, pending payout), Categories and cuisines, Reviews moderation, Delivery Partners (approval, rider payouts), Users (ban, wallet adjustment, admin users).
- Finance: Transactions ledger, Coupons (percent / flat / free delivery, limits, first-order, restaurant-specific, offers screen), Commission, Reports with CSV export.
- System: push/in-app/email/SMS broadcast Notifications, permission-based Admin Roles, Settings (onboarding screens, app versions / force update); change own password.

#### Backend
- Node.js/Express API (~152 routes) with MongoDB/Mongoose, Socket.io realtime (order, delivery and config events), JWT access + rotating refresh tokens.
- Server-side pricing (`utils/pricing.js`) with pricing snapshot per order; order state machine (`utils/orderFlow.js`) with settlement and refunds.
- Background scheduler: vendor accept timeout (auto-reject + refund) and payment timeout (auto-cancel unpaid online orders). New env `RUN_SCHEDULER` (default `true`); set it to `false` on every API instance except one (`backend/.env.example`, `docs/ENVIRONMENT_SETUP.md`, `docs/DEPLOYMENT_GUIDE.md`).
- Payments: Razorpay and Stripe with verified webhooks, idempotent confirmation, automatic refund of late payments, atomic wallet debits.
- Cancellation refunds to source (wallet flag off) fall back to a wallet credit if the gateway refund fails (logged as `[refund] gateway refund failed, crediting wallet`; payment marked `refunded`/`partially_refunded`), so paid cancelled orders are never left unrefunded.
- Maintenance mode allows payment gateway webhooks (`/api/payments/webhook/*` in `middleware/maintenance.js` `ALLOW_PREFIXES`), so payments keep confirming during maintenance.
- Notifications: FCM HTTP v1 push, SMTP email, Twilio SMS. Uploads to local disk or S3-compatible storage.
- Seeder: default config, translations, categories, cuisines, coupons `WELCOME50`, `FLAT100`, `FREEDEL`, super admin; demo data in development only.

#### Infrastructure & docs
- Dockerfiles for API, Admin Panel and Vendor Dashboard; `docker-compose.yml`; `scripts/setup.sh`.
- Deployment guide (Docker Compose or Node + MongoDB 7 + PM2, Nginx, Let's Encrypt, webhooks), environment setup, configuration guide, API documentation, database schema, Flutter build guide, Play Store and App Store guides.
- Tests: 20-step end-to-end API test (`npm run test:e2e`), scheduler test, Flutter analyze/test.

### Security
- Production start-up refuses weak or identical JWT secrets, wildcard CORS and missing public URL.
- Validation on every mutating route; NoSQL operator sanitisation; rate limits on API, auth and refresh; OTP attempt limit and resend cooldown.
- Upload hardening (no SVG, MIME + extension checks); Helmet headers; no OTPs in production logs.
- Android release builds block cleartext HTTP (`usesCleartextTraffic="false"` in the main manifest; only debug/profile manifests allow it for local development).
- Least-privilege location permissions: the shared Android manifest and iOS Info.plist declare foreground (when-in-use) location only. Only the Rider flavor adds `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_LOCATION` (`android/app/src/delivery/AndroidManifest.xml`); no flavor requests `ACCESS_BACKGROUND_LOCATION`.
- Admins cannot change their own role; non-superadmins cannot edit superadmins; no static default admin password.

---

## Template for future entries

Copy this block under `[Unreleased]` while working; on release rename `[Unreleased]` to the version and date and start a fresh `[Unreleased]`.

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- {Feature} ({area: API / Admin / Vendor web / Customer app / Partner app / Rider app}) — {one line}. Backlog: {ID}.

### Changed
- {Behaviour change}. **Operators:** {config key to review / default value}.

### Deprecated
- {Endpoint/field} — will be removed in {version}.

### Removed
- {Thing removed}.

### Fixed
- {Bug} — {symptom fixed}.

### Security
- {Hardening / dependency update / vulnerability fix}.

### Upgrade notes
- Backend: `git pull` → Path A `docker compose up -d --build && docker compose exec backend npm run seed` / Path B `npm ci --omit=dev && npm run seed && pm2 restart food-api`.
- New env vars: {NAME — purpose} (also in `backend/.env.example`).
- New config keys / feature flags: {key — default}. New admin permission: {permission}.
- Mobile: new builds required? {yes/no — which flavors}. App Versions: customer {min}/{latest}, vendor {min}/{latest}, delivery {min}/{latest}; force update: {yes/no}.
- Database migration: {none / script + command}.
```

---

## Versioning guidance (semver for a multi-app platform)

FeastFlow ships one **platform version** (this changelog) across the API, web panels and three apps. Mobile store builds also have their own `version: X.Y.Z+BUILD` in `flutter-apps/pubspec.yaml`; keep `X.Y.Z` aligned with the platform version when the apps change, and always increase `+BUILD` for every store upload.

| Bump | When | Examples |
|---|---|---|
| **MAJOR** (2.0.0) | A change that breaks apps already installed on phones, or requires data migration operators must run | Removing/renaming an API field the apps read, changing auth token format, new required order field from clients |
| **MINOR** (1.1.0) | New backward-compatible feature, new config keys/flags, new endpoints, new admin pages | Loyalty points, in-app chat, new home section type |
| **PATCH** (1.0.1) | Backward-compatible fixes, copy changes in seed translations, performance, security patches | Fix wrong ETA, fix admin page error |

Rules:
- API changes must stay backward compatible for at least the oldest app version still allowed by `appVersions.<app>.minVersion`. Add fields; don't remove or rename them until old app versions are blocked.
- Config-only changes made in the Admin Panel (fees, texts, flags) are operational, not releases — no version bump.
- Tag releases in git: `git tag -a v1.1.0 -m "v1.1.0" && git push --tags`.

### Forcing app updates (`appVersions` config)
Admin Panel → **Settings → App Versions**, per app (customer / vendor / delivery):
- `latestVersion` — newest version in the stores (informational in v1.0; keep it accurate).
- `minVersion` — checked at app start (splash). Users on an older version get the update prompt; with **Force update** on, the prompt is blocking (app cannot be used), with it off they can dismiss it.
- `storeUrlAndroid` / `storeUrlIos` — where the update button sends users.
Workflow: release build → wait until it is live in **both** stores (review times differ) → set `latestVersion` → to nudge users, raise `minVersion` with Force update off (dismissible prompt) → only if old builds are broken or insecure, also enable **Force update**. Record the values in the release's *Upgrade notes*.
