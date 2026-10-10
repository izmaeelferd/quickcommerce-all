# Environment Setup

## Prerequisites
| Tool | Version | Get it |
|---|---|---|
| Node.js | 20 LTS (18+ works) | https://nodejs.org or `nvm install 20` |
| MongoDB | 7 (6+ works) | local install, Docker (`mongo:7`) or MongoDB Atlas |
| Flutter | current stable (3.24+) | https://docs.flutter.dev/get-started/install |
| Android Studio / Xcode | latest | mobile builds |
| Docker + Compose v2 | optional | https://docs.docker.com/engine/install/ |

## Quick start (local)
```bash
git clone <repo> && cd food-delivery-platform
./scripts/setup.sh          # deps → .env files → seed → starts the API on :5000
```
Then `cd admin-panel && npm run dev` (http://localhost:5173) and `cd vendor-dashboard && npm run dev` (http://localhost:5174).
Fully containerised instead: `./scripts/setup.sh --docker`.

### First login
1. The seeder creates the super admin `ADMIN_DEFAULT_EMAIL` (default `admin@yourapp.com`) with `ADMIN_DEFAULT_PASSWORD`. If you left the password empty in development, the seeder **prints a generated password once** — copy it.
2. Open the Admin Panel → log in → **Users → your account → Edit → set a new password** (or use the mobile app's *Change password*). **Change it immediately.**
3. Go through *App configuration*: Branding → Theme → Business rules → Feature flags → Languages → Legal pages.
4. Approve vendors under *Vendor approvals* and riders under *Delivery partners*.

Demo accounts (development only — skipped in production unless `--demo`): vendor1…vendor4@example.com, customer@example.com, rider@example.com, password `SEED_SAMPLE_PASSWORD` (`Password@123`).

Seeder: `npm run seed` (idempotent: keeps admin edits, only adds missing translation keys/categories), `npm run seed:reset` (wipe everything), `--config-only`, `--demo`.

## backend/.env — every variable, and where to get it
Values containing `#` or spaces must be quoted (`ADMIN_DEFAULT_PASSWORD="Ab#123456"`). In `NODE_ENV=production` the API refuses to start if the JWT secrets are weak, `CLIENT_URLS` is `*`, or `MONGODB_URI`/`PUBLIC_BASE_URL` are missing.

| Variable | Required | What / where to get it |
|---|---|---|
| `NODE_ENV` | yes | `production` on servers. Outside production OTP/reset codes are echoed in API responses for testing |
| `PORT`, `API_PREFIX` | no | default `5000`, `/api` |
| `PUBLIC_BASE_URL` | prod | Public HTTPS origin of the API (e.g. `https://api.example.com`); used to build uploaded-file URLs |
| `CLIENT_URLS` | prod | Comma-separated admin/vendor web origins allowed by CORS, e.g. `https://admin.example.com,https://partner.example.com` (mobile apps don't need CORS) |
| `MONGODB_URI` | yes | `mongodb://localhost:27017/food_delivery`, or Atlas: Atlas → Database → Connect → Drivers |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | yes | Generate: `openssl rand -hex 48` (two different values) |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | no | default `15m` / `30d` |
| `BCRYPT_ROUNDS`, `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_SECONDS` | no | security tuning (10 / 10 / 5 / 30) |
| `ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD` | prod | First super admin created by the seeder. **Change the password after first login** |
| `GOOGLE_CLIENT_IDS` | for Google sign-in | Google Cloud Console → APIs & Services → Credentials → OAuth client IDs (create Android (SHA-1 of your signing key), iOS and Web clients); list all IDs comma-separated |
| `APPLE_CLIENT_ID` | for Apple sign-in | Your iOS bundle id (e.g. `com.yourco.customer`) with *Sign in with Apple* enabled in developer.apple.com → Identifiers |
| `PAYMENT_PROVIDER` | yes | `razorpay` or `stripe` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | if razorpay | dashboard.razorpay.com → Account & Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | if razorpay | dashboard.razorpay.com → Webhooks → add `https://api.example.com/api/payments/webhook/razorpay` (events `payment.captured`, `order.paid`) → the secret you set there |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | if stripe | dashboard.stripe.com → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | if stripe | Developers → Webhooks → add endpoint `…/api/payments/webhook/stripe` (event `payment_intent.succeeded`) → *Signing secret* (`whsec_…`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | for email | Any SMTP provider: Gmail (app password, smtp.gmail.com:587), SendGrid (`apikey` / API key, smtp.sendgrid.net), Amazon SES SMTP credentials, Mailgun |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE` | for SMS/OTP | console.twilio.com → Account Info (SID, Auth Token) → Phone Numbers → buy a number |
| `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_BASE64` | for push | Firebase console → Project settings → Service accounts → *Generate new private key*. Use the path to the JSON or `base64 -w0 key.json`. (The legacy `FCM_SERVER_KEY` API was shut down by Google in 2024 and is not used.) |
| `UPLOAD_DRIVER` | no | `local` (files in `backend/uploads`, persisted in the `uploads` Docker volume) or `s3` |
| `UPLOAD_DIR`, `MAX_UPLOAD_MB` | no | `uploads`, `5` |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_PUBLIC_URL` | if s3 | AWS IAM user with `s3:PutObject` on the bucket; works with any S3-compatible store (Cloudflare R2, DigitalOcean Spaces, MinIO) by setting `AWS_S3_PUBLIC_URL` |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` | no | API-wide and auth/OTP limits per IP |
| `SEED_SAMPLE_PASSWORD`, `SEED_LAT`, `SEED_LNG` | no | demo data only |

Legacy names are still accepted as aliases: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

Unconfigured integrations degrade safely: email/SMS/push are skipped (SMS bodies are never logged in production), online payments return `payment.*` errors, social sign-in returns `auth.*Failed`.

## Web apps — `admin-panel/.env`, `vendor-dashboard/.env`
| Variable | Meaning |
|---|---|
| `VITE_API_URL` | Backend origin, e.g. `https://api.example.com` (no `/api`). Baked in at build time |
| `VITE_API_PREFIX` | `/api` |
| `VITE_DEV_PROXY`, `VITE_DEV_PORT` | dev server only |
Everything else (names, colors, texts, features) comes from `/api/config` at runtime.

## Mobile apps — `--dart-define`
| Define | Required | Example / where to get it |
|---|---|---|
| `API_BASE_URL` | **yes** (the app shows an error screen without it) | `https://api.example.com`; Android emulator → `http://10.0.2.2:5000`; real device → your LAN IP |
| `API_PREFIX` | no | `/api` |
| `GOOGLE_MAPS_KEY` | for maps | Google Cloud Console → enable *Maps SDK for Android* and *Maps SDK for iOS* → Credentials → API key (restrict to your app ids). Also export it as an env var for the Android Gradle build |
| `GOOGLE_SERVER_CLIENT_ID` | for Google sign-in | the **Web** OAuth client id from the same project |

Firebase app files (`google-services.json` per Android flavor, `GoogleService-Info.plist` per iOS flavor): Firebase console → Add app → download. See `FLUTTER_BUILD_GUIDE.md`.

## Tests
```bash
cd backend
npm run seed:reset && npm run dev                                         # terminal 1
ADMIN_DEFAULT_PASSWORD="<seeded password>" API_URL=http://localhost:5000/api npm run test:e2e   # 19 steps
npm run test:scheduler                                                     # background jobs
cd ../flutter-apps && flutter analyze && flutter test
```

### RUN_SCHEDULER
`true` (default) runs the background jobs (vendor-accept and unpaid-payment timeouts) in this API process. When you run more than one API instance against the same database, set `RUN_SCHEDULER=false` on all but one of them.
