# Deployment Readiness Audit

Scope: every file in `backend/`, `flutter-apps/`, `admin-panel/`, `vendor-dashboard/`, `docs/`, `scripts/` and the Docker files.
Method: Python/Node scanners (regex scans, route-map cross-check, import/dependency graph), then the real toolchains: `node --check`, `flutter analyze`, `flutter test`, `vite build`, Docker image builds, a 20-step end-to-end API test, a scheduler test, Chromium runs of every web page and a Flutter web build of the customer app.

## Summary

| # | Audit | Issues found | Fixed | Status |
|---|---|---|---|---|
| 1 | Hardcoded values | 6 | 6 | ✅ PASS |
| 2 | API connection integrity | 5 | 5 | ✅ PASS |
| 3 | Payment flow integrity | 4 | 4 | ✅ PASS |
| 4 | Config system integrity | 4 | 4 | ✅ PASS |
| 5 | Deployment file completeness | 7 | 7 | ✅ PASS |
| 6 | Security hardening | 9 | 9 | ✅ PASS |
| 7 | Static runtime checks | 0 | — | ✅ PASS |
| 8 | Documentation | 8 docs updated | — | ✅ PASS |
| 9 | Default admin & first run | 3 | 3 | ✅ PASS |
| + | Found during verification | 4 | 4 | ✅ PASS |

---

## 1. Hardcoded value scan
| Category | Result | Fix |
|---|---|---|
| A. Secrets / keys (`sk_live_`, `rzp_`, `AIza`, `AKIA`, JWTs, private keys, `whsec_`) | **0 found** in any file | — (`.env.example` now documents every variable; see §5) |
| B. Business values in client code | 0 in apps/dashboards (17 regex hits were image corner radii and empty-form initial values). **2 in the backend**: ETA added a fixed 20 min; delivery OTP length fixed at 4 | New `businessRules.etaBufferMinutes`, `etaMinutesPerKm`, `deliveryOtpLength` (editable in Business Rules) |
| C. UI colors / literal flags | 1 Flutter `Colors.white` (fixed earlier), `bg-black` modal scrims in both web apps | Scrims use a theme token `scrim`; Flutter uses `colorScheme.onPrimary`. No `Color(0x…)` in screens; no literal feature flags |
| D. URLs | Flutter compiled in `http://10.0.2.2:5000` as a fallback | `API_BASE_URL` is now **required** (`--dart-define`); a build without it shows an error screen instead of calling a dev host. Web apps read `VITE_API_URL`. Backend's dev fallback for `PUBLIC_BASE_URL` is refused in production |
| E. Text strings | 0 literal UI strings in Flutter widgets or JSX | 30 new keys added for audit features; **coverage check: 0 keys used without an English string (1,278 strings)** |
| — Config keys with no effect | `vendorAcceptTimeoutMinutes` (editable, did nothing) and `maintenance.allowAdmins` | Timeout now enforced by a scheduler (§4); `allowAdmins` removed |

## 2. API connection integrity
- **Route map**: 152 routes extracted from the live Express router; every route resolves to a controller function; `routes/index.js` mounts all 15 route files; no circular requires.
- **Frontend → backend**: 171 API calls found in Flutter services + admin + vendor web; **all 171 match a backend route** (method + path). The dynamic `/admin/config/${section}` call maps to the section routes.
- **Dead endpoints wired up**: vendor review list + reply → new Vendor *Reviews* page; review moderation → new `GET /admin/reviews` + Admin *Reviews* page; `DELETE /admin/restaurants/:id` → *Deactivate* button.
- **Sockets**: server emits `order:new`, `order:accepted`, `order:status-update`, `delivery:location`, `delivery:assigned`, `delivery:available`, `delivery:taken`, `config:updated`, `notification:new`. Vendor app listens `order:new`; customer listens `order:status-update`, `delivery:location`, `delivery:assigned` and now also **`order:accepted`** (was missing); delivery app listens `delivery:assigned/available/taken`. Names match exactly (shared constant list in `socket_service.dart`).
- **Auth flow**: register/OTP/login → JWT pair → Flutter secure storage / browser localStorage → `Authorization: Bearer` interceptor → on 401 single-flight refresh + retry → logout on refresh failure. Access token is now accepted **only** from the Authorization header (cookie fallback and `cookie-parser` removed). Role middleware verified per route (E2E checks wrong-app login and admin RBAC).

## 3. Payment flow integrity
| Check | Finding | Fix |
|---|---|---|
| Razorpay keys | `key_id` sent to clients, `key_secret` server-only ✔ | — |
| Razorpay **webhook** | Verified with the API key secret (Razorpay signs webhooks with a separate webhook secret), non-constant-time compare | `RAZORPAY_WEBHOOK_SECRET` + `timingSafeEqual`; 503 if unset. Verified: bad signature → 400, valid → 200 |
| Stripe | secret + webhook signature from env ✔ | — |
| Double confirmation | `/verify` and the webhook could both process a payment | Atomic `pending → paid` flip; wallet top-ups credited exactly once (webhook now also credits top-ups) |
| Late payment | A payment completing after the order was cancelled would have confirmed a dead order | Refunded automatically (gateway, wallet fallback) |
| Wallet | Balance check and debit were separate (race) | Conditional atomic debit `{walletBalance: {$gte: amount}}`; E2E fires concurrent orders and verifies no overdraw |
| COD / refunds / amounts | COD skips gateway ✔; cancel → refund (wallet or gateway) with penalty rules ✔; all totals recomputed server-side from `businessRules` ✔ | — |

## 4. Config system integrity
- `/api/config` returns theme, branding, onboarding, homeLayout, features, businessRules, legal, languages, maintenance, appVersions, banners, categories, cuisines (E2E asserts every section).
- Apps load config **before** UI (splash) and cache it; web panels block until config arrives.
- Admin edits → PUT → MongoDB → `config:updated` socket → apps reload (E2E asserts the socket event).
- **Fixed**: feature flags now guard routes, not just buttons — `FeatureRoute` wraps wallet/referral/favorites/review/offers/onboarding routes (deep links to disabled features show "unavailable").
- **Fixed**: maintenance switched on while an app is open now redirects immediately (was: only on next launch or next API 503).
- **Fixed**: `vendorAcceptTimeoutMinutes` enforced + new `paymentTimeoutMinutes` (auto-cancel unpaid online orders); covered by `tests/scheduler.js`.
- Home renders strictly from `homeLayout` order/enabled/layout (verified visually in the Flutter web build).

## 5. Deployment file completeness
| Item | Fix |
|---|---|
| `backend/.env.example` | Rewritten with canonical names `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URLS`, `TWILIO_SID/TOKEN/PHONE`, `RAZORPAY_WEBHOOK_SECRET`, `ADMIN_DEFAULT_*`, … (old names still accepted as aliases). Note on quoting values with `#` (dotenv truncation found while testing). `FCM_SERVER_KEY` intentionally not used (legacy FCM API retired by Google) — service-account JSON instead. Cloudinary not used — S3-compatible storage instead |
| Web `.env.example` | `VITE_API_URL` per app (legacy `VITE_API_BASE_URL` accepted) |
| docker-compose | `MONGODB_URI`, `VITE_API_URL`; ports bound to `127.0.0.1` (only Nginx is public); `docker compose config` validates |
| Dockerfiles | Strict `npm ci`, `.dockerignore`; all three images build |
| Flutter flavors | Distinct placeholder launcher icons per flavor (were all the default Flutter icon) + 512 px store icons |
| `setup.sh` | Now installs all services, copies env files, seeds **and starts the API**; fixed a backgrounding bug (PID written to wrong dir / pipe left open). Verified end to end |
| `.gitignore` | `.env`, `node_modules`, `uploads`, keystores, Firebase files, `api.log/pid` |

## 6. Security hardening
| Check | Finding | Fix |
|---|---|---|
| Passwords | bcrypt, never logged ✔ | — |
| JWT | short access + rotating refresh ✔ | Header-only; production refuses weak/identical secrets |
| Input validation | Only ~10 routes validated | **Every** POST/PUT/PATCH/DELETE route validated (express-validator) except webhooks (signature), uploads (multer type/size) and delete-account (no input) |
| NoSQL injection | `{"$ne": null}` in body or `?a[$ne]=` reached queries | `sanitize` middleware strips `$`/dotted keys from body/query/params + flat query parser. E2E sends operator payloads |
| Rate limiting | auth/OTP limited ✔ | refresh-token also limited |
| CORS | `*` allowed in production | Production refuses `*`; disallowed origins get no CORS headers (was a 500 + stack trace) |
| OTP | no attempt limit, no resend cooldown | Burn after `OTP_MAX_ATTEMPTS`, `OTP_RESEND_SECONDS` cooldown (429), same for reset codes |
| Uploads | SVG accepted (stored-XSS vector) | SVG removed; MIME + extension both checked; file/field count limits |
| Logs | SMS bodies (OTPs) logged when Twilio unset | Never logged in production |
| Admin | — | Admins can't change their own role (prevents accidental self-demotion found in §9); non-superadmins can't edit superadmins |

## 7. Static runtime checks
| Check | Result |
|---|---|
| `node --check` on all 80 backend/script files | 0 failures |
| Flutter imports resolve | 0 unresolved; `flutter analyze` → **No issues found** |
| React imports resolve | 0 unresolved; both `vite build` succeed |
| package.json vs imports | 0 undeclared (unused = build tools only) |
| pubspec vs Flutter imports | 0 undeclared |
| Backend circular dependencies | 0 |

## 8. Documentation
Updated to the audited code: `README.md` (3-command quick start, first-login steps, structure, stack), `DEPLOYMENT_GUIDE.md` (fresh Ubuntu → DNS → firewall → Docker *or* Node+MongoDB+PM2 → Nginx → Let's Encrypt → webhooks → go-live checks), `ENVIRONMENT_SETUP.md` (every variable + where to obtain it), `FLUTTER_BUILD_GUIDE.md` (per-flavor APK/AAB/IPA table, required `API_BASE_URL`), `API_DOCUMENTATION.md` (validation, OTP limits, webhooks, background jobs, admin reviews), `DATABASE_SCHEMA.md` (new fields, index creation), `CONFIGURATION_GUIDE.md` (route guards, live maintenance, new rules), `PLAY_STORE_DEPLOYMENT.md` (icons).

## 9. Default admin & first run
| Check | Fix |
|---|---|
| Static default password `Admin@123` | Removed. `ADMIN_DEFAULT_PASSWORD` required in production; in development a random password is generated and printed once. Default email `admin@yourapp.com` |
| First-login password change | Admin header → **Change password**. Found and fixed a bug where editing your own user in *Users* would demote a super admin to customer |
| Demo data in production | Demo restaurants/accounts are skipped in production unless `--demo`; categories, cuisines and `WELCOME50`/`FLAT100`/`FREEDEL` coupons are always seeded |

## Found during verification (not in the checklist)
1. **Production had no MongoDB indexes** — `autoIndex` is off in production, so a fresh production DB had no 2dsphere (nearby search → HTTP 500) and **no unique indexes** (email, phone, order number, coupon code). Indexes are now created explicitly at start-up and by the seeder; verified on a fresh production container.
2. dotenv silently truncates unquoted values at `#` (documented in `.env.example`).
3. Super-admin self-demotion via the Users editor (see §9).
4. `setup.sh` background-start bug (see §5).

## Verification evidence
- `tests/e2e.js` — **20/20 steps pass** against (a) the local API and (b) the production-mode Docker image on a fresh database. Covers config edits + socket broadcast, translations, quote math, COD flow, vendor/rider flow with OTP + photo proof, settlement, reviews, cancellation refund, maintenance guard, RBAC, banner scheduling, injection payloads, 422 validation, OTP limits, SVG rejection, Helmet headers, concurrent wallet orders, admin self-demotion guard.
- `tests/scheduler.js` — vendor accept timeout, payment timeout, fresh orders untouched.
- Production boot: refuses weak secrets / `CLIENT_URLS=*`; boots with valid settings; CORS whitelist and webhook signatures checked with curl.
- `flutter analyze` clean, `flutter test` 2/2, Flutter web build driven in Chromium (login → dynamic home → restaurant → cart with server-computed bill).
- Admin (24 pages) and Vendor (8 pages) loaded in Chromium against the seeded API: no console/page errors.

## Must be tested manually after deployment
These need real credentials, devices or stores and cannot be verified in a sandbox:
1. **Live payments**: a real Razorpay/Stripe test-mode payment from the app, plus webhook delivery from the gateway dashboard.
2. **Push notifications** (FCM service account + `google-services.json`/`GoogleService-Info.plist`), **SMS OTP** (Twilio), **email** (SMTP).
3. **Google / Apple sign-in** with your OAuth client IDs and bundle ids.
4. **Google Maps** rendering and live rider location on physical devices (`GOOGLE_MAPS_KEY`).
5. **Native builds**: `flutter build appbundle` / `flutter build ipa` per flavor on a machine with the Android SDK / Xcode (only analysis, tests and a web build were run here). iOS flavors need the one-time Xcode scheme setup in `FLUTTER_BUILD_GUIDE.md` §5.
6. **Background location** while the rider app is backgrounded (OS permission prompts).
7. Replace the placeholder launcher icons and demo content before store submission.
