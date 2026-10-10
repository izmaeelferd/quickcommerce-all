# Food Delivery Platform — fully dynamic, config-driven

A Zomato-style marketplace where **nothing visible is hardcoded**: theme, branding, home layout, banners, feature flags, business rules (fees, taxes, commission, tips, referral, wallet, timeouts), every UI string (multi-language, RTL), legal pages and maintenance mode live in MongoDB and are edited live from the Admin Panel.

## Quick start (3 commands)
```bash
git clone <your-repo-url> && cd quickcommerce-all/food-delivery-platform
cp backend/.env.example backend/.env          # set MONGODB_URI (+ ADMIN_DEFAULT_PASSWORD, optional in dev)
./scripts/setup.sh                            # installs everything, seeds MongoDB, starts the API on :5000
```
Then `cd admin-panel && npm run dev` → http://localhost:5173 (Admin) and `cd vendor-dashboard && npm run dev` → http://localhost:5174 (Vendor).
No local MongoDB? `./scripts/setup.sh --docker` runs MongoDB + API + both web apps in containers.

Mobile (Android emulator):
```bash
cd flutter-apps && flutter pub get
flutter run --flavor customer -t lib/main_customer.dart --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

## First login
1. The seeder creates the super admin **`ADMIN_DEFAULT_EMAIL`** (default `admin@yourapp.com`) with **`ADMIN_DEFAULT_PASSWORD`**. If you left it empty in development, the generated password is printed once by the seeder.
2. Log in to the Admin Panel → header → **Change password**. **Do this immediately.**
3. *App configuration*: Branding → Theme Editor → Business rules → Feature flags → Languages → Legal pages → (optional) Home layout & Banners.
4. *Operations*: approve restaurants (Vendor approvals) and riders (Delivery partners).
5. Build the apps with your API URL (see `docs/FLUTTER_BUILD_GUIDE.md`).

Demo data (development only): vendor1–4@example.com, customer@example.com, rider@example.com — password `Password@123`.

## Tech stack
| Part | Stack | Path |
|---|---|---|
| API + realtime | Node.js 20, Express, MongoDB/Mongoose, Socket.io, JWT + rotating refresh tokens, Razorpay **and** Stripe, FCM, Nodemailer, Twilio, Multer/S3 | `backend/` |
| Mobile | Flutter + Riverpod — **one codebase, 3 flavors** (customer, vendor, delivery) for Android, iOS, tablets | `flutter-apps/` |
| Admin Panel | React 18, Vite, Tailwind, Recharts, Axios | `admin-panel/` |
| Vendor Dashboard | React 18, Vite, Tailwind, Axios | `vendor-dashboard/` |
| Infra | Dockerfiles, docker-compose, setup/seed scripts | root, `scripts/` |

## Folder structure
```
backend/            server.js · config/ (env, database, payments, defaultConfig) · controllers/ · models/ · routes/
                    middleware/ (auth, roles, validation, sanitize, rateLimiter, upload, maintenance, errorHandler)
                    sockets/ · utils/ (pricing, orderFlow, scheduler, notify, i18n, email, sms, push, storage)
                    seeders/ (default config, 1,278 English strings + hi/es/ar/fr core, demo data) · tests/ (e2e, scheduler)
flutter-apps/       lib/{core,models,services,providers,screens/{customer,vendor,delivery,shared},widgets/{dynamic,common}}
                    android/ (flavors, signing, per-flavor icons) · ios/ (flavor xcconfigs) · test/
admin-panel/        src/{components,pages,services,context,utils}
vendor-dashboard/   src/{components,pages,services,context,utils}
docs/               API · DATABASE_SCHEMA · CONFIGURATION_GUIDE · ENVIRONMENT_SETUP · DEPLOYMENT_GUIDE · FLUTTER_BUILD_GUIDE · PLAY_STORE · APP_STORE
scripts/            setup.sh · seed-database.js
AUDIT_REPORT.md     deployment-readiness audit results
```

## How "dynamic" works
1. Every app loads `GET /api/config` (and `/api/config/translations/:lang`) before showing UI; the response is cached for offline start.
2. Flutter builds `ThemeData` from `theme`; the web apps write it into CSS variables used by Tailwind.
3. The customer home iterates `homeLayout` (type, order, enabled, layout style) through `SectionRenderer`.
4. Screens/buttons are gated by `features`, routes by `FeatureRoute`; the API enforces the same flags.
5. Prices are always recomputed on the server from `businessRules`; orders snapshot them.
6. Admin saves broadcast `config:updated` over Socket.io → open apps refresh instantly (maintenance redirects immediately).

Details: [`docs/CONFIGURATION_GUIDE.md`](docs/CONFIGURATION_GUIDE.md). Production: [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

## Tests
```bash
cd backend && ADMIN_DEFAULT_PASSWORD="<seeded>" API_URL=http://localhost:5000/api npm run test:e2e   # 20-step end-to-end
cd backend && npm run test:scheduler
cd flutter-apps && flutter analyze && flutter test
```
