# FeastFlow — Admin Daily Runbook

Who this is for: the on-duty operations admin (marketplace ops) and whoever looks after the server.
Where things are: **Admin Panel** at `https://[ADMIN DOMAIN]` (e.g. `admin.example.com`), API at `https://[API DOMAIN]`.
Server paths in this runbook assume the layout in `docs/DEPLOYMENT_GUIDE.md`: code in `/opt/food-delivery/food-delivery-platform`, Linux user `deploy`.

> **Pick your deployment path once and ignore the other column.**
> **Path A** = Docker Compose (services `backend`, `mongo`, `admin`, `vendor-dashboard`).
> **Path B** = Native Node + MongoDB 7 + PM2 (process name `food-api`), web panels served as static files by Nginx.

---

## 0. Admin Panel map (what exists, and where)

The sidebar has exactly these pages. Nothing else is referenced in this runbook.

| Sidebar group | Page | Route | What you use it for daily |
|---|---|---|---|
| Overview | **Dashboard** | `/` | Today's orders, today's GMV, today's commission, totals, revenue trend, payment mix, top restaurants, recent orders |
| Configuration | Theme | `/config/theme` | Rarely |
| | Branding | `/config/branding` | Rarely (app name "FeastFlow", logos, support contacts) |
| | Home Layout | `/config/layout` | Re-order / enable home sections for campaigns |
| | **Banners** | `/config/banners` | Check scheduled banners started/ended; click counts |
| | **Feature Flags** | `/config/features` | Kill switches (wallet, coupons, tipping, scheduleOrder, liveTracking, …) |
| | **Business Rules** | `/config/business` | Fees, surge, timeouts, `paymentMethods`, `codMaxAmount`, cancellation rules |
| | Languages | `/config/languages` | Fix a typo in any app string, live |
| | Legal Pages | `/config/legal` | Privacy, Terms, Refund Policy, About |
| | **Maintenance** | `/config/maintenance` | Put customer/vendor/delivery apps into maintenance |
| Operations | **Orders** | `/orders` | Status filter, search by order number, assign rider, change status, refund |
| | **Vendors** | `/vendors` | Restaurant approval queue (tabs: pending / approved / suspended / rejected) |
| | **Restaurants** | `/restaurants` | Edit restaurants, featured flag, deactivate; "pending payout" column |
| | Categories | `/categories` | Categories and cuisines |
| | **Reviews** | `/reviews` | Moderation: filter by max rating / visibility, hide/show |
| | **Delivery Partners** | `/delivery-partners` | Rider approval (pending / approved / suspended / rejected) and rider payouts |
| | **Users** | `/users` | Find a user, ban/unban, wallet adjust (+/−), recent orders |
| Finance | **Transactions** | `/transactions` | Ledger filtered by type and date range; status column |
| | **Coupons** | `/coupons` | Usage (`used / limit`), active flag, validity |
| | Commission | `/commission` | Global % and per-restaurant override |
| | **Reports** | `/reports` | Orders / restaurants / delivery / reviews reports by date range, CSV export |
| System | Notifications | `/notifications` | Broadcast push / in-app / email / SMS |
| | Admin Roles | `/roles` | Permission-based roles for your staff |
| | **Settings** | `/settings` | Onboarding screens + **App Versions** (min/latest version, force update, store URLs) |

Header (navbar): **Change password** for your own account.

Admin permissions used below (Admin Roles): `dashboard`, `orders`, `vendors`, `restaurants`, `delivery`, `users`, `transactions`, `coupons`, `reports`, `config`, `settings`. Give each staff member only what they need.

---

## 1. Morning checks (start of day, before lunch rush — target 15–20 min)

### 1.1 Server health (2 min)

```bash
# From anywhere
curl -s https://[API DOMAIN]/api/health
# Expected: {"success":true,"status":"ok","env":"production","time":"..."}
```

On the server (`ssh deploy@[SERVER IP]`):

| Check | Path A (Docker) | Path B (PM2) |
|---|---|---|
| Processes up | `cd /opt/food-delivery/food-delivery-platform && docker compose ps` (all `running`, mongo `healthy`) | `pm2 status` (`food-api` = `online`; restarts counter not climbing) and `systemctl status mongod --no-pager` |
| Local health | `curl -s http://127.0.0.1:5000/api/health` | same |
| Errors in last 12 h | `docker compose logs --since 12h backend \| grep -iE "error\|failed\|unhandled" \| tail -50` | `pm2 logs food-api --lines 500 --nostream \| grep -iE "error\|failed\|unhandled" \| tail -50` |
| Background jobs | `docker compose logs --since 12h backend \| grep "\[scheduler\]" \| tail` | `pm2 logs food-api --lines 1000 --nostream \| grep "\[scheduler\]" \| tail` |
| Refunds sent to wallet instead of source | `docker compose logs --since 24h backend \| grep "\[refund\] gateway refund failed, crediting wallet"` | `pm2 logs food-api --lines 2000 --nostream \| grep "\[refund\] gateway refund failed, crediting wallet"` |
| Disk | `df -h /` and `docker system df` | `df -h /` and `du -sh /var/lib/mongodb /opt/food-delivery/food-delivery-platform/backend/uploads` |
| Memory | `free -h` and `docker stats --no-stream` | `free -h` and `pm2 monit` (Ctrl-C to exit) |
| Last night's backup exists | `ls -lh /var/backups/feastflow/mongo \| tail -3` (see `backup-strategy.md`) | same |
| TLS | `sudo certbot certificates` (days remaining > 20) | same |

Act if: disk > 80 % used → see `incident-response.md` §7.2; any `[refund] gateway refund failed, crediting wallet` lines → step 1.4 (those customers got a wallet credit instead of a card/UPI refund); `food-api` restart count increasing → `incident-response.md` §3.

### 1.2 Dashboard (2 min)

**Admin → Dashboard**
- Compare *Today's orders* and *Today's GMV* with the same weekday last week (use **Reports** → Orders for last week). A drop > [X]% before noon = investigate (payments? one big vendor closed? app outage?).
- *Payment mix*: sudden drop in card/UPI share with COD rising = payment gateway problem (`incident-response.md` §5).
- *Recent orders*: scan for many `cancelled`/`rejected` in a row.

### 1.3 Orders that need a human (5 min)

**Admin → Orders → status filter**

| Filter | What to look for | Action |
|---|---|---|
| `placed` | Orders older than `vendorAcceptTimeoutMinutes` (default 5) that are **paid or COD** should not exist — the scheduler auto-rejects them every minute. If you see old ones, the scheduler is not running. | `incident-response.md` §3 (restart API). |
| `placed` with payment status `pending`/`failed` | Unpaid online orders. They are hidden from the vendor and auto-cancelled after `paymentTimeoutMinutes` (default 15). Old ones = scheduler not running. | Same as above. |
| `accepted` / `preparing` | Orders far past their ETA. | Call restaurant (phone on order detail), post-delay message to customer (`support-playbook.md` template T1). |
| `ready` | Orders with **no rider** for > [10] min. | Open order → **Assign rider** (list shows online approved riders, "busy" if they hold an active order) → **Assign**. |
| `picked` | Orders picked > [45] min ago and not delivered. | Call rider (phone on order detail); check customer complaints. |

Rule of thumb: an order should never sit in one status longer than [PLACEHOLDER SLA per status] — set these after your first two weeks of data.

### 1.4 Money that is stuck (3 min)

When the `wallet` feature flag is **off**, cancellation refunds go back to the card/UPI through the gateway. If that gateway refund fails, the order is not left unrefunded: it logs `[refund] gateway refund failed, crediting wallet`, credits the full refund to the customer's **wallet** and marks the payment `refunded` / `partially_refunded`. So each such log line is a customer who got wallet credit instead of a source refund (the log line carries the gateway error, not the order number — find the orders with the second query below).
→ Optional follow-up: tell the customer the money is in their FeastFlow wallet; if they want it in the bank instead, follow `support-playbook.md` §4.3 (refund in the gateway dashboard, then debit the wallet).

**Admin → Orders**, filter `cancelled`, then `rejected`: an order whose payment column still says **paid** (online method, not COD) should not occur. If you see one, the refund did not run at all — use **Refund to source** (or **Refund to wallet** if the customer agrees) in the order modal (`support-playbook.md` §4) and report it to engineering.

Faster on the server (read-only queries; the first should return nothing):

```bash
# Path A
docker compose exec -T mongo mongosh --quiet food_delivery --eval '
db.orders.find({status:{$in:["cancelled","rejected"]},"payment.status":"paid","payment.method":{$ne:"cod"}},
 {orderNumber:1,status:1,"pricing.payable":1,createdAt:1}).sort({createdAt:-1}).limit(50).toArray()'
# Path B
mongosh --quiet food_delivery --eval '<same query>'

# Wallet-fallback refunds in the last 24 h (wallet-credited refunds on orders that had a successful online payment; meaningful only while the wallet flag is off)
docker compose exec -T mongo mongosh --quiet food_delivery --eval '
const since=new Date(Date.now()-24*3600e3);
db.transactions.find({type:"refund",provider:"",description:"order.refund",createdAt:{$gte:since}}).toArray()
 .filter(t=>db.transactions.findOne({order:t.order,type:"payment",status:"success"}))
 .map(t=>({order:db.orders.findOne({_id:t.order},{orderNumber:1}).orderNumber,customer:t.user,amount:t.amount,at:t.createdAt}))'
```

**Admin → Transactions**: set type = `payment`, date = today. Rows with status `pending` or `failed` older than ~15 min are abandoned checkouts — normal in small numbers. A spike = gateway trouble. Set type = `refund` to confirm yesterday's refunds have `success` status.

### 1.5 Approval queues (3 min)

- **Admin → Vendors → tab `pending`**: review each new restaurant (name, address, documents per your onboarding checklist [VENDOR KYC CHECKLIST LINK]). **Approve** or **Reject** (a reason is asked). Target: decide within [24] h.
- **Admin → Delivery Partners → filter `pending`**: verify rider documents per [RIDER KYC CHECKLIST LINK]. **Approve** / **Reject**. Only `approved` riders who are online receive orders.

### 1.6 Banners and coupons running today (2 min)

- **Admin → Banners**: banners whose start/end date covers today are live; check none are expired-but-expected or pointing to a deactivated restaurant/coupon.
- **Admin → Coupons**: check the *usage* column (`used / usageLimit`) on campaign coupons; deactivate (`isActive` off) anything that is running away with budget.

---

## 2. Midday checks (during lunch peak, ~12:30–14:00 — 5–10 min, repeat at dinner peak ~20:00)

1. `curl -s https://[API DOMAIN]/api/health` — still ok.
2. **Dashboard**: today's orders keep climbing at the expected rate.
3. **Orders → `placed`**: anything waiting on a vendor for more than 3 min → call the restaurant (they will be auto-rejected at `vendorAcceptTimeoutMinutes`).
4. **Orders → `ready`** with no rider: assign manually. If this happens repeatedly:
   - Not enough riders online → broadcast to riders: **Notifications** → audience `delivery` → "High demand now in [AREA]".
   - Consider **Business Rules → surgePricing** `enabled: true` (multiplies the delivery fee by `multiplier`, shows `reason` to customers). Turn it off after the peak.
5. **Delivery Partners**: number of online approved riders vs. open orders.
6. Restaurants closing unexpectedly: vendors toggle open/close themselves; if a restaurant is unreachable and orders keep failing, deactivate it temporarily from **Restaurants** and tell the vendor.
7. Glance at logs for 5xx bursts: Path A `docker compose logs --since 30m backend | grep -c -i error`; Path B `pm2 logs food-api --lines 300 --nostream | grep -ci error`.

---

## 3. Evening checks (after dinner peak, ~22:30 — 10 min)

1. **Orders**: nothing left in `accepted`, `preparing`, `ready`, `picked` from more than 2 hours ago. Close out manually after confirming with vendor/rider:
   - Delivered but rider forgot to mark → order modal → **Update status** → `delivered` (this settles vendor earning, commission and rider earning — do it only when delivery is confirmed).
   - Never delivered → `cancelled` (triggers refund; no customer penalty because the actor is admin).
2. **Reviews** (filter max rating 1–2, visible): hide reviews that break your content policy ([REVIEW POLICY LINK]) — abuse, personal data, spam. Do **not** hide genuine negative reviews. Vendors can reply from their dashboard.
3. **Users**: action any ban requests from support (fraud, abuse). Ban = user cannot log in.
4. **Reports → Orders**, today: export CSV for your daily sheet ([DAILY KPI SHEET LINK]).
5. Make sure maintenance mode is **off** unless intended (**Maintenance** page).
6. Confirm any temporary changes made during the day are reverted (surge off, emergency banners removed, disabled payment methods re-enabled).

---

## 4. Weekly tasks

| Day | Task | Where / how |
|---|---|---|
| [MON] | **Rider payouts** | **Delivery Partners** → riders with a wallet balance show a **Payout** button → enter amount + bank/UPI transfer reference → **Confirm**. Do the actual bank transfer first; this only records it (creates a `delivery_payout` debit). |
| [MON] | **Vendor payouts** | **Restaurants** → *Pending payout* column shows each restaurant's earned balance. Vendors see the same in their dashboard **Payouts** page; pay those at or above `minPayoutAmount` (default ₹500). Make the bank transfer, then record it — the Admin Panel has **no vendor payout button** in this version, so record via the API (below). |
| [MON] | Payout reconciliation | **Transactions** → type `vendor_payout` and `delivery_payout` for last week → match against bank statement. |
| [TUE] | Coupon review | **Coupons**: usage vs. budget; expire/deactivate finished campaigns; plan next week's codes. |
| [TUE] | Commission review | **Commission**: confirm per-restaurant overrides are intentional. |
| [WED] | Review moderation sweep | **Reviews**: all hidden reviews — still correct to hide? |
| [THU] | Reports | **Reports** → restaurants / delivery / reviews for the week → CSV to [WEEKLY REPORT LOCATION]. |
| [FRI] | Security hygiene | **Admin Roles** + **Users** filter role `admin`: remove staff who left; no shared logins. |
| [FRI] | Server updates | `sudo apt update && sudo apt -y upgrade` in a quiet window; reboot if the kernel changed, then re-run §1.1. |
| [SUN] | Backup check | Latest backups present locally and off-site (`backup-strategy.md` §6). |

**Recording a vendor payout via API** (admin with `transactions` permission):

```bash
API=https://[API DOMAIN]/api
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"[ADMIN EMAIL]","password":"[ADMIN PASSWORD]","role":"admin"}' | jq -r '.data.accessToken')
# RESTAURANT_ID = the restaurant's _id (Restaurants page / Reports export / mongosh)
curl -s -X POST $API/admin/payouts -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"kind":"vendor","id":"RESTAURANT_ID","amount":1250.50,"reference":"[BANK UTR / UPI REF]"}'
```
The amount cannot exceed the restaurant's balance (`wallet.insufficient`). Adding a vendor-payout button to the Restaurants page is backlog item `FIN-01` in `../updates/feature-backlog.md`.

---

## 5. Monthly tasks

| Task | How |
|---|---|
| **Backup restore test** | Restore last night's dump into a throw-away database and verify counts — procedure in `backup-strategy.md` §7. Record the result in [RESTORE TEST LOG]. |
| **TLS certificate check** | `sudo certbot certificates` (all three names, > 30 days left) and `sudo certbot renew --dry-run`. `systemctl list-timers \| grep certbot` shows the renewal timer. |
| **App version gates** | **Settings → App Versions**: for each app (customer / vendor / delivery) set `latestVersion` to the newest store version, `minVersion` to the oldest version you still support, store URLs (Android/iOS) filled in. Apps compare their version with `minVersion` at start-up: below it, users see an update prompt — dismissible when **Force update** is off, blocking when it is on. Raise `minVersion` only after the new build is live in **both** stores, and turn on Force update only when an old version is broken or insecure. Keep `CHANGELOG.md` in sync (`../updates/CHANGELOG.md`). |
| Secrets rotation review | Rotate any third-party key that a departed staff member had access to (`incident-response.md` §9). |
| Dependency/security updates | Plan a release with `npm audit` fixes (developer task). |
| Legal pages | **Legal Pages**: still accurate (refund policy matches Business Rules). |
| Business Rules review | Delivery fee, free-delivery threshold, packaging fee, commission vs. unit economics ([UNIT ECONOMICS SHEET]). |
| Capacity review | CPU/RAM/disk trend, orders/day vs. `scaling-roadmap.md` triggers. |
| Access review | Server SSH keys (`~/.ssh/authorized_keys`), MongoDB users, Razorpay/Stripe dashboard users, Firebase/Twilio console users. |

---

## 6. Quick reference

| Need | Path A (Docker) | Path B (PM2) |
|---|---|---|
| Restart API | `docker compose up -d backend` (or `docker compose restart backend`) | `pm2 restart food-api` |
| Follow logs | `docker compose logs -f backend` | `pm2 logs food-api` |
| Deploy update | `git pull && docker compose up -d --build && docker compose exec backend npm run seed` | `git pull && cd backend && npm ci --omit=dev && npm run seed && pm2 restart food-api` then rebuild panels (`npm ci && VITE_API_URL=https://[API DOMAIN] npm run build` in `admin-panel/` and `vendor-dashboard/`, copy `dist/*` to `/var/www/admin` and `/var/www/partner`) |
| Seed (non-destructive, adds new translation keys) | `docker compose exec backend npm run seed` | `cd backend && npm run seed` |
| Mongo shell | `docker compose exec mongo mongosh food_delivery` | `mongosh food_delivery` |
| Backup now | `docker compose exec -T mongo mongodump --archive --gzip > backup-$(date +%F).gz` | `mongodump --archive=backup-$(date +%F).gz --gzip` |

**Never run `npm run seed:reset` in production** — it is the destructive reset used for tests.

Escalation contacts: on-call engineer [NAME / PHONE], ops lead [NAME / PHONE], payments contact [NAME]. Severity definitions: `incident-response.md` §1.
