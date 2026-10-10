# Environment Setup

## Prerequisites
| Tool | Version |
|---|---|
| Node.js | 18+ (20 LTS recommended) |
| MongoDB | 6+ (7 recommended) — local, Docker or Atlas |
| Flutter | 3.24+ (tested with the current stable channel) |
| Android Studio / Xcode | for mobile builds |
| Docker + Compose (optional) | v2 |

## Quick start
```bash
./scripts/setup.sh            # installs deps, creates .env files, seeds MongoDB
# or fully containerised:
./scripts/setup.sh --docker
```

Manual:
```bash
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
cd admin-panel && cp .env.example .env && npm install && npm run dev       # :5173
cd vendor-dashboard && cp .env.example .env && npm install && npm run dev  # :5174
```

Seeded accounts (change immediately in production):

| Role | Login | Password |
|---|---|---|
| Super admin | `SEED_ADMIN_EMAIL` (admin@example.com) | `SEED_ADMIN_PASSWORD` (Admin@123) |
| Vendors | vendor1@example.com … vendor4@example.com | `SEED_SAMPLE_PASSWORD` (Password@123) |
| Customer | customer@example.com | Password@123 |
| Rider | rider@example.com | Password@123 |

Seeder flags: `npm run seed` (idempotent; keeps admin edits and only adds missing translation keys), `npm run seed:reset` (wipe), `node seeders/seedDatabase.js --config-only`. Sample restaurants are placed around `SEED_LAT`/`SEED_LNG` (env, defaults to a demo city centre).

## backend/.env reference
| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT`, `API_PREFIX` | Runtime; in non-production OTP/reset codes are echoed for testing |
| `PUBLIC_BASE_URL` | Absolute base used for uploaded file URLs |
| `CORS_ORIGINS` | Comma-separated admin/vendor web origins (`*` allowed for dev) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | Tokens — use long random secrets |
| `OTP_EXPIRY_MINUTES`, `BCRYPT_ROUNDS` | Security tuning |
| `GOOGLE_CLIENT_IDS` | Comma-separated OAuth client IDs (Android, iOS, Web) accepted for Google sign-in |
| `APPLE_CLIENT_ID` | iOS bundle id / Services ID for Apple sign-in |
| `PAYMENT_PROVIDER` | `razorpay` or `stripe` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe |
| `SMTP_*`, `EMAIL_FROM` | Nodemailer |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | SMS / OTP |
| `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_BASE64` | FCM push |
| `UPLOAD_DRIVER` (`local`/`s3`), `UPLOAD_DIR`, `MAX_UPLOAD_MB`, `AWS_*` | File storage |
| `RATE_LIMIT_*` | Rate limiting |
| `SEED_*` | Seeder accounts/location |

Unconfigured integrations degrade gracefully: email/SMS/push are logged to the console instead of sent, and online payments return a clear error until keys are set.

## Web apps (.env)
`VITE_API_BASE_URL` (backend origin), `VITE_API_PREFIX` (`/api`), optional `VITE_DEV_PROXY`, `VITE_DEV_PORT`. Nothing else — all UI comes from `/api/config`.

## Flutter (dart-define)
`API_BASE_URL`, `API_PREFIX`, `GOOGLE_MAPS_KEY`, `GOOGLE_SERVER_CLIENT_ID`. See `FLUTTER_BUILD_GUIDE.md`.

## Tests
```bash
cd backend && npm run seed:reset && npm run dev     # in one terminal
cd backend && API_URL=http://localhost:5000/api npm run test:e2e
cd flutter-apps && flutter analyze && flutter test
```
