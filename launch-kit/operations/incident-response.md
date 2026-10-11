# FeastFlow — Incident Response Runbook

All commands assume you are on the server as `deploy` in `/opt/food-delivery/food-delivery-platform` (see `docs/DEPLOYMENT_GUIDE.md`).
**Path A** = Docker Compose (services `backend`, `mongo`, `admin`, `vendor-dashboard`; volumes `mongo_data`, `uploads`).
**Path B** = Native: PM2 process `food-api`, systemd `mongod`, web panels as static files in `/var/www/admin` and `/var/www/partner`.
Domains: `[API DOMAIN]` (e.g. api.example.com), `[ADMIN DOMAIN]`, `[PARTNER DOMAIN]`.

---

## 1. Severity levels

| Sev | Definition | Examples | Response | Update cadence | Who |
|---|---|---|---|---|---|
| **SEV1** | Platform down or money at risk for everyone | API unreachable, DB down, all payments failing, data leak, secret leak | Acknowledge ≤ [10 min], all hands | Every 30 min to [STATUS CHANNEL] | On-call + ops lead + [FOUNDER] |
| **SEV2** | Major function broken for many users, workaround exists | One payment gateway down (COD works), live tracking broken, SMS OTP down (email login works), 5xx > 5 % | Acknowledge ≤ [30 min] | Hourly | On-call + ops lead |
| **SEV3** | Partial/minor degradation | Push notifications delayed, one city slow, admin page error, some webhooks failing | Next working hours / ≤ [4 h] | Daily | On-call |
| **SEV4** | Cosmetic, single user | Typo, wrong image | Backlog | — | — |

Roles in SEV1/2: **Incident lead** (decides, communicates), **Fixer** (hands on keyboard), **Comms** (customers, vendors, riders via Admin → Notifications / Maintenance message).

### First 5 minutes (any severity)
1. Post in [INCIDENT CHANNEL]: "Investigating {symptom}, lead = {name}".
2. Run the triage block below.
3. Decide: fix forward, roll back (§3.4), or enable maintenance (§2).
4. Start a timeline (time + action) — needed for the postmortem.

### Triage block (copy-paste)
```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://[API DOMAIN]/api/health
curl -s http://127.0.0.1:5000/api/health
uptime; free -h; df -h /
# Path A
docker compose ps
docker compose logs --since 15m backend | tail -100
docker compose logs --since 15m mongo | tail -30
# Path B
pm2 status
pm2 logs food-api --lines 100 --nostream
systemctl status mongod --no-pager | head -15
sudo journalctl -u mongod --since "15 min ago" | tail -30
# Both
sudo systemctl status nginx --no-pager | head -5
sudo tail -50 /var/log/nginx/error.log
```

---

## 2. Maintenance mode (the big switch)

**Admin → Maintenance**: toggle *App in maintenance*, edit the message/image, pick *affected apps* (customer / vendor / delivery). Saving broadcasts `config:updated` and open apps redirect to the maintenance screen immediately.

What it does on the API (`backend/middleware/maintenance.js`): non-admin requests from affected apps get HTTP 503 `maintenance.active`. Still allowed: `/api/config`, `/api/auth/login`, `/api/auth/refresh-token`, `/api/admin/*`, `/api/health`, translations, and payment gateway webhooks (`/api/payments/webhook/*`). The Admin Panel keeps working.

If the Admin Panel itself is unreachable but MongoDB works, flip it directly:
```bash
# Path A
docker compose exec -T mongo mongosh --quiet food_delivery --eval 'db.appconfigs.updateOne({key:"main"},{$set:{"maintenance.appInMaintenance":true},$inc:{version:1}})'
docker compose restart backend          # config cache TTL is 30 s; restart applies it at once
# Path B
mongosh --quiet food_delivery --eval '<same updateOne>'
pm2 restart food-api
```
(Check the collection name first with `show collections` — Mongoose pluralises the `AppConfig` model to `appconfigs`.)

---

## 3. Server / API down

**Symptoms**: apps show connection errors, `/api/health` fails or times out, Nginx returns 502/504.

### 3.1 Is it Nginx, the API or the machine?
| Result | Meaning |
|---|---|
| Public health fails, local `127.0.0.1:5000/api/health` OK | Nginx/TLS/DNS problem → §3.3 |
| Both fail | API process down → §3.2 |
| SSH impossible | VPS down → provider console [PROVIDER CONSOLE URL]; reboot; check provider status page |

### 3.2 API process
**Path A**
```bash
docker compose ps backend
docker compose logs --tail 200 backend
docker compose up -d backend                 # (re)start
# If it keeps restarting, read the first error after "[server]" / "[config]"
```
**Path B**
```bash
pm2 status
pm2 logs food-api --lines 200 --nostream
pm2 restart food-api
# if PM2 lost the process (e.g. after reboot without pm2 startup):
cd /opt/food-delivery/food-delivery-platform/backend && pm2 start server.js --name food-api && pm2 save
```
Common start-up failures:
| Log line | Fix |
|---|---|
| `[config] JWT_ACCESS_SECRET must be a random string of 32+ characters` (or REFRESH / CLIENT_URLS / PUBLIC_BASE_URL / MONGODB_URI) | Production safety check — fix `backend/.env`, restart |
| `[server] failed to start ... MongoServerSelectionError` / `ECONNREFUSED 27017` | DB down → §7.1 |
| `EADDRINUSE :5000` | Another process holds the port: `sudo lsof -i :5000`; stop it; Path B check `pm2 list` for duplicates |
| `Cannot find module` | Dependencies missing after deploy: Path A `docker compose up -d --build backend`; Path B `cd backend && npm ci --omit=dev` |
| Value truncated / auth fails after editing `.env` | Unquoted `#` in a value — quote it (`"S3cure#Pass"`) |

### 3.3 Nginx / TLS
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certificates                      # expired?
sudo certbot renew && sudo systemctl reload nginx
```

### 3.4 Roll back a bad deploy
```bash
git log --oneline -5
git checkout <last-good-commit>               # or: git revert <bad-commit>
# Path A
docker compose up -d --build
# Path B
cd backend && npm ci --omit=dev && pm2 restart food-api
# (rebuild admin-panel / vendor-dashboard and copy dist/* if the panels changed)
```
If the bad release changed data, restore from backup only after reading `backup-strategy.md` §7 (it is destructive).

---

## 4. Elevated API errors / 5xx

1. Quantify:
   ```bash
   sudo awk '$9 ~ /^5/ {print $9, $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20
   ```
   (Default Nginx combined log: `$9` = status, `$7` = path.) Group by path to find the failing endpoint.
2. Read the API stack traces: Path A `docker compose logs --since 30m backend | grep -iA5 error`; Path B `pm2 logs food-api --lines 500 --nostream | grep -iA5 error`.
3. Typical causes:
   | Signal | Likely cause | Action |
   |---|---|---|
   | 429 `rateLimit.exceeded` spikes | `RATE_LIMIT_MAX` too low for real traffic behind one NAT, or an attack | Raise `RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` in `.env` and restart; block abusive IPs in Nginx / provider firewall |
   | 500 on nearby/search | Missing 2dsphere index (indexes are created at start-up) | Restart API; check log for index errors |
   | 503 `maintenance.active` | Maintenance is on | Admin → Maintenance |
   | Timeouts across all routes | Mongo slow / CPU 100 % | §7.3, `top`, `docker stats` |
   | Errors right after a deploy | Code regression | Roll back §3.4 |
   | `unhandledRejection` lines | Bug in a code path | Capture the stack trace for engineering, workaround if possible |
4. Memory leak suspicion (RSS growing until OOM): restart as stop-gap (`docker compose restart backend` / `pm2 restart food-api`); Path B can cap it with `pm2 start server.js --name food-api --max-memory-restart 800M` (delete + re-add, then `pm2 save`).

---

## 5. Payment gateway down / payments failing

**Symptoms**: Dashboard payment mix shifts to COD; Transactions show many `payment` rows `pending`/`failed`; customers report "payment failed"; gateway status page ([RAZORPAY/STRIPE STATUS URL]) shows an incident.

1. Confirm: Admin → **Transactions** → type `payment`, today. Many failures in the last 15 min = incident (SEV2; SEV1 if COD also off).
2. Check server logs for gateway errors (`razorpay`/`stripe` in the log) and that keys are still valid (key revoked/rotated by someone?).
3. **Mitigate without code**: Admin → **Business Rules → paymentMethods**:
   - Turn **off** the broken methods (`card`, `upi`, `netbanking`) — the checkout only offers enabled methods.
   - Keep **`cod` on** (consider temporarily raising `codMaxAmount` from 2000) and **`wallet` on**.
   - Save → pushed live to apps via `config:updated`.
4. If neither COD nor wallet is acceptable, enable **Maintenance** (§2) for the customer app only with an honest message.
5. Comms: Admin → **Notifications** (audience customer, push): "Card/UPI payments are temporarily unavailable — Cash on Delivery works." Keep it short.
6. Unpaid orders created during the outage are auto-cancelled after `paymentTimeoutMinutes`; payments that land late are auto-refunded. Afterwards check §1.4 of `admin-daily-runbook.md` for stuck refunds.
7. Recovery: re-enable methods, test one real low-value payment end to end, then remove the notice.

Switching provider (Razorpay ↔ Stripe) is an env change (`PAYMENT_PROVIDER` + keys + webhook secret) and restart — only if both accounts are already live and the app build supports the provider's checkout. Not a 5-minute fix; plan it in advance.

---

## 6. Payment webhook failures

Endpoints (from `docs/DEPLOYMENT_GUIDE.md`):
- Razorpay → `https://[API DOMAIN]/api/payments/webhook/razorpay` (events `payment.captured`, `order.paid`), secret `RAZORPAY_WEBHOOK_SECRET`.
- Stripe → `https://[API DOMAIN]/api/payments/webhook/stripe` (event `payment_intent.succeeded`), secret `STRIPE_WEBHOOK_SECRET`.

Why it matters: the app confirms payments via `/api/payments/verify`, but the webhook is the backstop (app killed mid-payment, wallet top-ups, late payments → auto-refund). Webhook failures = orders stuck unpaid and auto-cancelled while money was taken.

| Gateway dashboard shows | Meaning | Fix |
|---|---|---|
| HTTP 503 `webhook secret not configured` | `RAZORPAY_WEBHOOK_SECRET` empty | Set it in `backend/.env`, restart |
| HTTP 400 `invalid signature` / `Webhook Error` | Secret mismatch (rotated in dashboard, or using API key secret) | Copy the webhook secret from the dashboard into `.env`, restart |
| HTTP 404 | Wrong URL (missing `/api`, wrong provider segment) | Fix the URL in the gateway dashboard |
| HTTP 5xx / timeout | API down or erroring | §3 / §4 |
| HTTP 503 `maintenance.active` | Should not happen — `/api/payments/webhook/*` is on the maintenance allow-list (`middleware/maintenance.js` `ALLOW_PREFIXES`). Seeing it means the API is running an older build | Deploy the current release, then replay webhooks. |

After fixing: **replay failed deliveries** from the gateway dashboard (Razorpay: Webhooks → event log → Resend; Stripe: Developers → Webhooks → endpoint → Resend). Processing is idempotent (atomic `pending → paid` flip), so replays are safe. Then run the stuck-refund query in `admin-daily-runbook.md` §1.4.

Test signature handling after any change:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://[API DOMAIN]/api/payments/webhook/razorpay -H 'Content-Type: application/json' -d '{}'
# expected 400 (invalid signature) — 503 means the secret is missing
```

---

## 7. Database incidents

### 7.1 MongoDB down
**Path A**
```bash
docker compose ps mongo
docker compose logs --tail 100 mongo
docker compose up -d mongo && docker compose up -d backend
```
**Path B**
```bash
sudo systemctl status mongod --no-pager
sudo journalctl -u mongod -n 100 --no-pager
sudo tail -100 /var/log/mongodb/mongod.log
sudo systemctl restart mongod && pm2 restart food-api
```
Common causes: disk full (§7.2), OOM-killed (`dmesg -T | grep -i oom`), unclean shutdown lock file (`/var/lib/mongodb/mongod.lock` — remove only after confirming no `mongod` is running), permissions after a manual restore (`sudo chown -R mongodb:mongodb /var/lib/mongodb`).

### 7.2 Disk full
```bash
df -h /
sudo du -xh / --max-depth=2 2>/dev/null | sort -rh | head -20
# Path A
docker system df
docker image prune -a -f              # old images from previous builds (safe; does not touch volumes)
docker builder prune -f
# never run `docker volume prune` — it can delete mongo_data / uploads
# Path B
pm2 flush                             # clears PM2 logs
sudo du -sh /var/lib/mongodb /var/log/mongodb ~/.pm2/logs
# Both
sudo journalctl --vacuum-size=200M
ls -lh /var/backups/feastflow/mongo   # old local backups? rotation script in backup-strategy.md
```
Install PM2 log rotation permanently (Path B): `pm2 install pm2-logrotate`. Docker (Path A): add log limits in `/etc/docker/daemon.json` (`{"log-driver":"json-file","log-opts":{"max-size":"50m","max-file":"5"}}`) and `sudo systemctl restart docker` during a quiet window.
If MongoDB stopped because the disk filled, free space first, then start mongod and verify with `db.adminCommand({ping:1})`.

### 7.3 Slow queries
```bash
# Path A: docker compose exec mongo mongosh food_delivery     Path B: mongosh food_delivery
db.currentOp({ secs_running: { $gte: 3 } })              // long-running ops
db.setProfilingLevel(1, { slowms: 200 })                  // log slow ops for a while
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()
db.orders.getIndexes()                                    // indexes present?
db.setProfilingLevel(0)                                   // turn profiling off afterwards
```
Kill a runaway operation: `db.killOp(<opid>)`. Missing indexes are recreated at API start (`ensureIndexes`), so a restart after a fresh restore fixes "no index" slowness. Persistent slowness at load → `scaling-roadmap.md` stage 2/3.

### 7.4 Restore from backup (data loss / corruption)
**Destructive. SEV1. Get a second person to confirm.**
1. Enable **Maintenance** (§2) for all apps.
2. Take a backup of the current (bad) state first — you may need it for forensics.
3. Restore the chosen archive:
   ```bash
   # Path A
   docker compose exec -T mongo mongorestore --archive --gzip --drop < /var/backups/feastflow/mongo/food_delivery-YYYY-MM-DD_HHMM.gz
   docker compose restart backend
   # Path B
   mongorestore --archive=/var/backups/feastflow/mongo/food_delivery-YYYY-MM-DD_HHMM.gz --gzip --drop
   pm2 restart food-api
   ```
4. Verify counts (`backup-strategy.md` §7), log in to the Admin Panel, place a test order.
5. Reconcile the gap between backup time and incident time with the gateway dashboard (payments captured in the gap have no order record now → refund or recreate manually).
6. Disable maintenance.

---

## 8. Real-time (Socket.io) issues

**Symptoms**: vendors don't see new orders until refresh, customers' tracking doesn't move, config changes don't push, but REST works.

1. Check the WebSocket upgrade through Nginx:
   ```bash
   curl -s "https://[API DOMAIN]/socket.io/?EIO=4&transport=polling" | head -c 200    # expect a "0{"sid":...}" handshake
   ```
   The Nginx `server` block must contain `proxy_http_version 1.1`, `Upgrade $http_upgrade`, `Connection "upgrade"` (DEPLOYMENT_GUIDE §3). The apps connect with the WebSocket transport, so a missing Upgrade header breaks realtime while REST still works.
2. Cloudflare or another proxy in front? WebSockets must be enabled there.
3. Socket auth uses the JWT access token — if secrets were rotated, clients reconnect after refresh/re-login.
4. More than one API instance? Events emitted on instance 1 don't reach sockets on instance 2 → needs sticky sessions + Redis adapter (`scaling-roadmap.md` stage 4). Short-term: run a single instance.
5. Rider location not updating while other events work: device side — check the rider is **Online** (Android shows the persistent "You are online" notification while location is shared; if it is missing, go offline and online again), location permission is allowed, and battery optimisation is disabled for the app. On iOS, background updates work only in a Rider build with the `location` background mode and `IOS_BACKGROUND_LOCATION=true` (docs/FLUTTER_BUILD_GUIDE.md §5); otherwise the rider must keep the app open.
6. Restart the API (`docker compose restart backend` / `pm2 restart food-api`) — clients reconnect automatically.

Fallback: order status is still visible by pulling (opening the order screen calls the REST API).

---

## 9. SMS / push / email outage

| Channel | Provider / env | Check | Mitigation |
|---|---|---|---|
| **SMS (OTP)** | Twilio: `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE` | Twilio console → Monitor → Logs (error codes, balance, geo permissions for India / DLT registration); API logs for twilio errors | Tell users to log in with email+password / Google / Apple (Feature Flags `googleSignIn`, `appleSignIn` on). Temporarily turning off `otpLogin` in Feature Flags hides OTP login. Top up balance. |
| **Push** | FCM HTTP v1 via service account (`FIREBASE_SERVICE_ACCOUNT_PATH` or `_BASE64`) | Firebase console → Cloud Messaging; API logs for `messaging`/`credential` errors; service account key deleted/disabled in Google Cloud IAM? | In-app notifications and sockets still work; send critical notices via SMS/email channels in Admin → Notifications |
| **Email** | SMTP: `SMTP_HOST/PORT/SECURE/USER/PASS`, `EMAIL_FROM` | Provider dashboard (quota, suspended sender, SPF/DKIM); `openssl s_client -starttls smtp -connect $SMTP_HOST:587` from the server | Non-critical; queue manual mails for password-reset requests via support |

After changing any of these env values: `docker compose up -d backend` / `pm2 restart food-api`. Test via Admin → Notifications → send to yourself.

---

## 10. Security incident / secret leak

**Treat as SEV1.** Examples: `.env` committed to git, server compromised, admin account taken over, gateway key exposed, suspicious admin actions.

### 10.1 Contain (first 30 minutes)
1. If the server is compromised: snapshot the VPS in the provider console (forensics), then restrict SSH (`sudo ufw status`, remove unknown keys from `~/.ssh/authorized_keys`, check `last`, `sudo cat /var/log/auth.log | tail -200`).
2. Admin takeover: Admin → **Users** → filter role `admin`/`superadmin` → ban unknown accounts; reset passwords; review **Admin Roles**; check recent Business Rules / Feature Flags / Coupons changes (the config `updatedBy` and `version` fields in `appconfigs`).
3. Enable Maintenance if data is being exfiltrated or money is moving.

### 10.2 Rotate secrets (order matters)
| Secret | How to rotate | Effect |
|---|---|---|
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `openssl rand -hex 48` twice (they must differ, ≥ 32 chars) → `backend/.env` → restart | **All users, vendors, riders and admins are logged out** (tokens no longer verify). Expected. |
| `ADMIN_DEFAULT_PASSWORD` / admin passwords | Each admin: navbar → Change password; Users → edit others | — |
| `RAZORPAY_KEY_SECRET` (+ key id) | Razorpay dashboard → API keys → regenerate → `.env` → restart. Key id changes too → it is sent to apps via `/api/config` (payment.publicKey), no rebuild needed | Payments fail between dashboard regenerate and restart — do it fast |
| `RAZORPAY_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET` | Gateway dashboard → webhook → new secret → `.env` → restart | Replay failed webhooks after |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → roll key | — |
| `TWILIO_TOKEN` | Twilio console → rotate auth token | — |
| Firebase service account | Google Cloud IAM → service account → delete old key, create new → update file/base64 | — |
| `SMTP_PASS` | Mail provider | — |
| `AWS_ACCESS_KEY_ID/SECRET` (if `UPLOAD_DRIVER=s3`) | IAM → create new key, deactivate old | — |
| MongoDB credentials (if auth enabled) | `db.changeUserPassword()` → update `MONGODB_URI` | — |
| Google Maps key (in app builds) | Restrict/regenerate in Cloud Console; new app build needed | Requires release |

Then restart: `docker compose up -d backend` / `pm2 restart food-api`, and check `/api/health`.

### 10.3 Clean up
- Secret in git: rotation is the fix; also remove the file from history (`git filter-repo`) and force-push, and invalidate any forks/CI caches.
- Review Transactions for unusual refunds, wallet credits, payouts during the exposure window.
- **Personal data breach**: you may have legal notification duties (India: DPDP Act 2023 — notify the Data Protection Board and affected users; CERT-In 6-hour reporting for certain incidents). Involve [LEGAL CONTACT] immediately. Other regions: GDPR 72 h, etc.

---

## 11. Communication templates

**Customer push (Admin → Notifications)**: "We're having trouble with {payments/orders} right now. {Cash on Delivery still works.} We'll update you shortly." / "All fixed — thanks for your patience!"
**Vendor broadcast (audience vendor)**: "FeastFlow is experiencing {issue} since {time}. Orders {may be delayed / are paused}. Please keep the Partner app open; we'll notify you when resolved."
**Status page / social**: [STATUS PAGE URL] — "Investigating" → "Identified" → "Monitoring" → "Resolved".

---

## 12. Postmortem template (blameless, within [3] working days for SEV1/SEV2)

```markdown
# Postmortem: {title}
- Date / duration: {start} – {end} ({minutes} min)          - Severity: SEV{n}
- Incident lead: {name}                                      - Authors: {names}
- Status: draft | reviewed | actions complete

## Summary
2–3 sentences: what broke, who was affected, how it was fixed.

## Impact
- Orders affected: {n} (failed / delayed / cancelled)
- GMV impact: {currency}{amount}; refunds issued: {currency}{amount}
- Users/vendors/riders affected: {n}; support tickets: {n}
- Data loss: none / {details}

## Timeline (UTC / IST)
| Time | Event |
|---|---|
| hh:mm | First signal (alert / ticket / ...) |
| hh:mm | Acknowledged by ... |
| hh:mm | Mitigation: ... |
| hh:mm | Resolved |

## Root cause
Technical cause and the conditions that allowed it (5 whys).

## Detection
How we found out; how we could have found out sooner.

## What went well / what went badly / where we got lucky

## Action items
| # | Action | Type (prevent/detect/mitigate) | Owner | Due | Ticket |
|---|---|---|---|---|---|

## Lessons / runbook updates
Which section of this runbook changed because of this incident.
```
