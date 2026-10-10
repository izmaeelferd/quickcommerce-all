# FeastFlow — Operations Kit

Runbooks for running the FeastFlow platform (customer app "FeastFlow", vendor app "FeastFlow Partner", delivery app "FeastFlow Rider", Admin Panel, Vendor web dashboard, Node.js API) in production.

All commands match `food-delivery-platform/docs/DEPLOYMENT_GUIDE.md`:
**Path A** Docker Compose (services `backend`, `mongo`, `admin`, `vendor-dashboard`) · **Path B** Node 20 + MongoDB 7 + PM2 process `food-api`. Health check `GET /api/health`. Domains are placeholders (`[API DOMAIN]`, `[ADMIN DOMAIN]`, `[PARTNER DOMAIN]`).

| File | Use it when | Audience |
|---|---|---|
| [`admin-daily-runbook.md`](admin-daily-runbook.md) | Every day: morning / midday / evening checklists, weekly payouts, monthly restore test, cert check, app version gates | Ops admins, on-call |
| [`support-playbook.md`](support-playbook.md) | Answering customers/vendors/riders: what the system refunds automatically, manual refund matrix, escalation tiers & SLAs, 10 reply templates, how to refund/adjust wallets in the Admin Panel | Support agents, ops lead |
| [`incident-response.md`](incident-response.md) | Something is broken: severity levels, triage block, maintenance mode, server down, 5xx, payment gateway down, webhooks, DB down/disk full/slow/restore, sockets, SMS/push/email, security & secret rotation, postmortem template | On-call engineer, incident lead |
| [`backup-strategy.md`](backup-strategy.md) | Setting up and testing backups: mongodump cron + rotation script, off-site rclone/S3, uploads, `.env` secrets, restore test with `mongorestore`, RPO/RTO | Server owner |
| [`scaling-roadmap.md`](scaling-roadmap.md) | Planning growth: monitoring, stage triggers, required code changes for multi-instance (Socket.io Redis adapter, single scheduler via `RUN_SCHEDULER`), Redis, CDN, k8s | Tech lead, founders |

## Fill these placeholders first
`[API DOMAIN]`, `[ADMIN DOMAIN]`, `[PARTNER DOMAIN]`, `[SERVER IP]`, `[SUPPORT EMAIL]`, `[SUPPORT PHONE]`, `[SUPPORT HOURS]`, `[GRIEVANCE OFFICER NAME]`, `[GRIEVANCE EMAIL]`, `[INCIDENT CHANNEL]`, `[STATUS PAGE URL]`, on-call names/phones, refund approval limits `[₹X]`, `[RCLONE REMOTE]:[BUCKET]`, `[AGE PUBLIC KEY]`, `[HEALTHCHECK PING URL]`, cost placeholders.

## Day-one setup checklist
- [ ] Uptime monitor on `https://[API DOMAIN]/api/health` (1-minute interval, SMS/phone alert to on-call)
- [ ] Backup scripts + cron + off-site + dead-man's switch (`backup-strategy.md` §2–§4)
- [ ] First restore test done (`backup-strategy.md` §7)
- [ ] Admin Roles created for support (orders, users, transactions) vs. ops (all) — no shared logins
- [ ] Business Rules reviewed; Refund Policy (Legal Pages) matches the actual refund behaviour (`support-playbook.md` §1)
- [ ] Settings → App Versions: store URLs filled for all three apps
- [ ] Gateway webhooks configured and tested (`incident-response.md` §6)
- [ ] PM2 log rotation (`pm2 install pm2-logrotate`) or Docker log limits
- [ ] Escalation contacts filled in everywhere

## Known gaps in v1.0 that affect operations (tracked in `../updates/feature-backlog.md`)
- No vendor-payout button in the Admin Panel — record vendor payouts via `POST /api/admin/payouts` (`admin-daily-runbook.md` §4). Rider payouts have a button.
- The scheduler runs in every API process unless `RUN_SCHEDULER=false` — when you run more than one API instance, set `RUN_SCHEDULER=false` on all but one (`scaling-roadmap.md` Stage 4).
- Broadcast notifications with the SMS or email channel to audience "all" send one message per user from inside the request — mind SMS cost and timeouts.
- No in-app chat; support runs on email/phone/WhatsApp outside the app.

Never run `npm run seed:reset` against production — it is the destructive reset used by the test suite. `npm run seed` is safe (adds missing data and translation keys only).
