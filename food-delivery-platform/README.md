# Food Delivery Platform — fully dynamic, config-driven

A complete Zomato-style marketplace where **nothing visible is hardcoded**: theme, branding, home layout, banners, feature flags, business rules (fees, taxes, commission, tips, referral, wallet), every UI string (multi-language, RTL), legal pages and maintenance mode are stored in MongoDB and edited live from the Admin Panel.

| Part | Stack | Path |
|---|---|---|
| API + realtime | Node.js, Express, MongoDB/Mongoose, Socket.io, JWT + refresh tokens, Razorpay **and** Stripe, FCM, Nodemailer, Twilio, Multer/S3 | `backend/` |
| Mobile apps | Flutter (Riverpod), **one codebase → 3 flavors**: customer, vendor, delivery (Android + iOS + tablets) | `flutter-apps/` |
| Admin Panel | React, Vite, Tailwind, Recharts, Axios | `admin-panel/` |
| Vendor Dashboard | React, Vite, Tailwind, Axios | `vendor-dashboard/` |
| Docs | API, schema, configuration, deployment, store guides | `docs/` |
| Infra | Dockerfiles, docker-compose, setup & seed scripts | root, `scripts/` |

## Quick start
```bash
./scripts/setup.sh              # Node + local MongoDB
# or
./scripts/setup.sh --docker     # MongoDB + API + Admin + Vendor in containers
```
Admin → http://localhost:5173 · Vendor → http://localhost:5174 · API → http://localhost:5000/api

Mobile:
```bash
cd flutter-apps && flutter pub get
flutter run --flavor customer -t lib/main_customer.dart --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

Demo accounts are listed in `docs/ENVIRONMENT_SETUP.md`.

## How "dynamic" works (short)
1. Every app calls `GET /api/config` on launch (cached for offline start) and `GET /api/config/translations/:lang`.
2. Flutter builds `ThemeData` from `theme`; the web apps write it into CSS variables used by Tailwind.
3. The customer home screen iterates `homeLayout` (type + order + enabled + layout style) through `SectionRenderer`.
4. Screens and buttons are gated by `features`; the API enforces the same flags.
5. Prices are always recomputed on the server from `businessRules`; orders snapshot them.
6. Admin saves emit `config:updated` over Socket.io, so open apps update without a release.

Full explanation: [`docs/CONFIGURATION_GUIDE.md`](docs/CONFIGURATION_GUIDE.md).

## Features
**Customer app** — splash & onboarding from config, password/OTP/Google/Apple login (per flags), dynamic home (search, banners, categories, offers, featured/top-rated/custom lists, cuisines), search with filters, restaurant menus with veg badges & add-ons, cart with server-side bill (coupon, tips, wallet cap, packaging, tax, surge, delivery fee/slots), addresses with GPS, card/UPI/wallet/COD per config, Razorpay/Stripe checkout, live tracking (timeline + map + rider location + call), history & reorder, favorites, reviews with photos, wallet top-up, referral, notifications, language & theme switch, legal pages, maintenance & force-update screens, account deletion.

**Vendor app & dashboard** — restaurant onboarding/approval status, open/accepting toggles, realtime order board (accept/reject/preparing/ready), menu & category CRUD with images and add-on groups, availability toggles, opening hours, earnings with effective commission, settlements & payouts.

**Delivery app** — onboarding (vehicle/bank), online/offline with GPS streaming, nearby requests with config-driven payout and COD amount, atomic accept, navigation & call, picked → delivered with OTP and photo proof (per flags), earnings & history.

**Admin Panel** — dashboard & revenue charts; **Theme Editor** (color pickers, fonts, radii sliders, logo uploads, live phone preview); **Branding**; **Home Layout Builder** (drag-and-drop, toggle, rename, layout style, filters, live preview); **Banner Manager** (upload, link, schedule, reorder); **Feature Flags**; **Business Rules**; **Language Manager** (coverage, side-by-side editor, add language/key, RTL, default); **Legal Pages** (rich text); **Maintenance**; orders (status, assign rider, refunds), vendor approvals, restaurants (commission override, featured), categories & cuisines, delivery partners & payouts, users (ban, wallet adjust), transactions, coupons, commission, reports (CSV), push/email/SMS campaigns, admin roles (RBAC), onboarding & app-version settings.

## Verification performed
- `backend/tests/e2e.js` — 17-step end-to-end test (config edits + socket broadcast, dotted translations, quote math, COD order, vendor flow, rider dispatch with OTP/photo, settlement, review, cancellation refund, maintenance guard, RBAC, banner scheduling) — passes against a local server and against the Docker image.
- Flutter: `flutter analyze` (no issues), `flutter test`, and a web build of the customer flavor rendered and driven in Chromium (login → dynamic home → restaurant → cart with server bill).
- Admin Panel & Vendor Dashboard: production builds + every page loaded in Chromium against the seeded API without runtime errors.

## Repository layout
```
backend/            server.js, config/, controllers/, models/, routes/, middleware/, sockets/, utils/, seeders/, tests/
flutter-apps/       lib/{core,models,services,providers,screens/{customer,vendor,delivery,shared},widgets/{dynamic,common}}, android/, ios/
admin-panel/        src/{components,pages,services,context,utils}
vendor-dashboard/   src/{components,pages,services,context,utils}
docs/               API_DOCUMENTATION, DATABASE_SCHEMA, CONFIGURATION_GUIDE, DEPLOYMENT_GUIDE, FLUTTER_BUILD_GUIDE, PLAY_STORE_DEPLOYMENT, APP_STORE_DEPLOYMENT, ENVIRONMENT_SETUP
scripts/            setup.sh, seed-database.js
```
