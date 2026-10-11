# FeastFlow — Scaling Roadmap

Principle: **scale when a trigger fires, not before.** The launch architecture (one VPS, Docker Compose or PM2, MongoDB on the same box) is correct for a single-city launch. Each stage lists the trigger, what changes, the code changes it needs (honestly), and a cost placeholder.

Numbers below are planning heuristics, not measurements of this codebase — load-test before each move ([LOAD TEST TOOL, e.g. k6/Artillery] against a staging copy).

---

## 0. What to monitor from day one

| Metric | Source | Warning | Action threshold |
|---|---|---|---|
| Orders/day, peak orders/hour | Admin → Dashboard / Reports | — | Stage triggers below |
| API p95 latency | Nginx `$request_time` in access log (add to `log_format`), or APM ([APM TOOL]) | > 300 ms | > 500 ms sustained at peak |
| 5xx rate | Nginx access log | > 0.5 % | > 1 % |
| CPU (host / API process) | `htop`, `docker stats`, `pm2 monit`, provider graphs | > 60 % at peak | > 75 % at peak for a week |
| RAM | `free -h` | > 75 % | swap in use |
| Disk used | `df -h` | > 70 % | > 80 % |
| MongoDB slow ops | profiler (`incident-response.md` §7.3), `db.serverStatus().opcounters` | queries > 100 ms | > 500 ms |
| Mongo working set vs RAM | `db.serverStatus().wiredTiger.cache` | cache > 80 % full | evictions climbing |
| Socket.io connections | count at peak (add a log/metric) | — | > [5,000] concurrent per instance |
| Uptime | external monitor on `https://[API DOMAIN]/api/health` every 1 min ([UPTIME MONITOR]) | — | any downtime |
| Background jobs | `[scheduler]` log lines; stale `placed` orders (runbook §1.3) | — | any stale orders |
| Backups | cron dead-man's switch | — | missed run |

Add before Stage 2: structured logs (morgan is dev-only today — production request logging comes from Nginx), an error tracker ([e.g. Sentry]) and an uptime monitor. Backlog `OPS-01..03`.

---

## Stage 1 — Single VPS (launch)

**Shape**: 1 VPS (2 vCPU / 4 GB RAM / 80 GB SSD), Nginx + certbot, API + MongoDB 7 + both web panels (Path A containers or Path B PM2 `food-api` + `mongod`). Uploads on local disk. Nightly `mongodump` off-site.
**Good for**: up to roughly **[1,000–2,000] orders/day**, a few hundred concurrent app users.
**Cost**: [₹/$ X]/month VPS + [Y] backups storage + SMS/push/email usage.
**Do now**: monitoring above, backups (`backup-strategy.md`), `UPLOAD_DRIVER=s3` early if you can (makes later stages trivial).

## Stage 2 — Bigger VPS, then separate DB server

**Triggers (any)**: CPU > 75 % at peak for a week · p95 > 500 ms at peak · RAM pressure / Mongo cache evictions · > [2,000] orders/day · disk > 70 %.
**Step 2a — vertical**: resize to 4–8 vCPU / 8–16 GB. Zero code change; ~10 min downtime (schedule it, use Maintenance).
**Step 2b — split**: MongoDB on its own VPS (private network only, `bindIp` private IP, **auth enabled**, firewall to API host), API + panels on the app VPS. Change `MONGODB_URI` in `backend/.env` (Path A: remove the `mongo` service / override the compose `MONGODB_URI`).
**Code changes**: none.
**Cost**: [X + Y]/month.

## Stage 3 — Managed MongoDB (Atlas or equivalent) replica set

**Triggers**: need RPO < 1 h / point-in-time restore · DB ops burden · > [5,000] orders/day · planning multiple API instances · compliance needs (encryption at rest, audit).
**Change**: MongoDB Atlas (region close to your servers, e.g. Mumbai `ap-south-1` for India) M10+ replica set (3 nodes) → `MONGODB_URI=mongodb+srv://...` with a dedicated DB user; IP access list = API server IPs. Migrate with `mongodump`/`mongorestore` or Atlas Live Migration during a maintenance window.
**Code changes**: none required (Mongoose handles replica sets). Optional: transactions for wallet/refund flows (they currently use atomic single-document updates, which is OK).
**Gains**: automatic failover, continuous backups with PITR, metrics, Performance Advisor index suggestions.
**Cost**: [Atlas tier price]/month.

## Stage 4 — Multiple API instances behind a load balancer

**Triggers**: single API process CPU-bound at peak even on a big VPS (Node is single-threaded per process) · need zero-downtime deploys · high-availability requirement.
**Shape**: 2+ API instances (PM2 cluster mode on one box, or several boxes/containers) behind Nginx `upstream` or a cloud load balancer.

**Required code/config changes — the current code is single-instance by design:**

| # | Problem in today's code | Why it breaks with N instances | Required change |
|---|---|---|---|
| 1 | **Socket.io rooms are in-process** (`backend/sockets/orderTracking.js` emits to `user:`, `restaurant:`, `order:`, `delivery:online`, `admin` rooms; `config:updated` via `io.emit`) | An order accepted on instance A won't reach a customer connected to instance B; config pushes reach only one instance's clients | Add **`@socket.io/redis-adapter`** (+ `redis` client) in `server.js`: `io.adapter(createAdapter(pub, sub))`. Clients already use the WebSocket-only transport, so sticky sessions are not strictly required, but configure **sticky sessions** anyway (Nginx `ip_hash` or LB cookie) in case polling is ever enabled. |
| 2 | **Scheduler runs in every API process unless disabled** (`backend/utils/scheduler.js`, started by `startScheduler()` in `server.js` when `RUN_SCHEDULER` is not `false`, default `true`; sweeps every 60 s) | If `RUN_SCHEDULER=false` is missed on extra instances: N concurrent sweeps → duplicate auto-reject/auto-cancel attempts and duplicate refund work. `transition()` re-checks the state machine so most duplicates fail with `order.invalidTransition`, but two sweeps can load the same order before either saves → **risk of double refund**. | **Config only:** set `RUN_SCHEDULER=false` on every API instance except one (documented in `backend/.env.example`, `docs/ENVIRONMENT_SETUP.md`, `docs/DEPLOYMENT_GUIDE.md`). Do not set the timeouts to 0 instead — `vendorAcceptTimeoutMinutes`/`paymentTimeoutMinutes` are global Business Rules, so that disables the jobs everywhere. **Hardening backlog** (protects against misconfiguration): a MongoDB/Redis lease lock (only the lock holder sweeps) or a separate worker process, and an atomic state change (`findOneAndUpdate({_id, status:'placed'}, …)`) before refunding. |
| 3 | **Config cache is per process** (`utils/configCache.js`, 30 s TTL, invalidated only on the instance that handled the admin save) | Other instances serve stale config (fees, flags, maintenance) for up to 30 s | Acceptable short-term; better: publish an invalidation over Redis pub/sub (or the Socket.io adapter) on every config save |
| 4 | **Rate limiter memory store** (`express-rate-limit` default) | Limits are per instance (effective limit × N), counters lost on restart | `rate-limit-redis` store (Stage 5) |
| 5 | **Local uploads** (`UPLOAD_DRIVER=local`) | Files written on instance A are missing on B | `UPLOAD_DRIVER=s3` (already supported) — do Stage 6 first or together |
| 6 | Nginx config | single `proxy_pass` | `upstream api { ip_hash; server 10.0.0.11:5000; server 10.0.0.12:5000; }` + keep the WebSocket `Upgrade` headers |
| 7 | PM2 cluster mode (`pm2 start server.js -i max --name food-api`) | Same issues 1–5 apply between workers on one box | Same fixes |

**Cost**: LB [X] + extra instances [Y] + Redis (Stage 5).

## Stage 5 — Redis (shared state)

**Triggers**: Stage 4 · hot read endpoints (restaurant list/menu) dominating DB load · need for rate limits across instances · OTP/session-type data.
**Uses**: Socket.io adapter (required for Stage 4), `rate-limit-redis` for `apiLimiter`/`authLimiter`, config-cache invalidation pub/sub, caching `GET /api/config` and restaurant/menu reads (short TTL, invalidate on vendor menu edits), scheduler lock.
**Hosting**: managed Redis ([Upstash / ElastiCache / Redis Cloud]) or a small VPS with persistence off for cache-only use.
**Code changes**: new `utils/redis.js`, adapter in `server.js`, store in `middleware/rateLimiter.js`, cache wrapper in restaurant/menu controllers, env `REDIS_URL` in `.env.example` + `docs/ENVIRONMENT_SETUP.md`. Redis is **not used anywhere today** (backlog `INF-01`).
**Cost**: [X]/month.

## Stage 6 — Object storage + CDN for uploads and web panels

**Triggers**: uploads > [10 GB] · image bandwidth noticeable on VPS · Stage 4 · users far from the server.
**Change**: `UPLOAD_DRIVER=s3` with `AWS_S3_BUCKET` + `AWS_S3_PUBLIC_URL` pointing at a CDN (CloudFront / Cloudflare R2 + custom domain / Bunny). Migrate existing `uploads/` files and rewrite stored URLs (one-off script, backlog `INF-05`). Admin/vendor panels are static builds — can be served from the CDN too (Path B already builds static `dist/`).
**Code changes**: none for new uploads; migration script for old ones. Consider image resizing/thumbnails (backlog).
**Cost**: storage [X]/GB + egress [Y].

## Stage 7 — Containers orchestration (Kubernetes / managed container platform)

**Triggers**: > [N] services or teams · autoscaling needed for strong peaks (lunch/dinner) · multi-region / multi-city · > [50,000] orders/day.
**Shape**: managed k8s ([EKS / GKE / DOKS]) or simpler managed containers ([ECS Fargate / Cloud Run (needs WebSocket support settings) / Render / Fly.io]). Images from the existing `Dockerfile.backend`, `Dockerfile.admin`, `Dockerfile.vendor-dashboard`. Separate Deployment for the scheduler worker (replicas: 1), HPA on API CPU, Ingress with WebSocket support and session affinity, secrets in a secret manager, Atlas + managed Redis outside the cluster.
**Code changes**: health/readiness probes (`/api/health` exists; add a DB-aware readiness check), graceful shutdown on SIGTERM (close server + Mongo connection — not implemented today), scheduler as its own entrypoint, structured JSON logs.
**Cost**: [cluster + nodes + LB + egress] — usually 3–5× Stage 4; only worth it with ops capacity.

---

## Cost summary (fill in)

| Stage | Infra | Est. monthly cost | Orders/day it supports (planning) |
|---|---|---|---|
| 1 Single VPS | 1 VPS | [₹/$] | ≤ [1–2k] |
| 2 Bigger / split DB | 1–2 VPS | [₹/$] | ≤ [5k] |
| 3 Atlas | VPS + Atlas M10–M30 | [₹/$] | ≤ [10–20k] |
| 4+5 Multi-instance + Redis | LB + 2–4 API + Atlas + Redis | [₹/$] | ≤ [50k] |
| 6 CDN/S3 | + storage/CDN | [₹/$] | — |
| 7 k8s | cluster | [₹/$] | [50k+] |

Third-party costs scale with orders, not servers: SMS OTP per message ([₹ X]), payment gateway fee ([~2 %] per online order), maps API calls (Flutter maps/geocoding), email. Track them per order in your unit economics.

---

## Application-level scaling items (independent of stages)

- Indexes: verify compound indexes for hot queries (`orders` by `restaurant+status+createdAt`, `customer+createdAt`) with the profiler before adding.
- Pagination limits are enforced in list endpoints; keep Reports date ranges reasonable (they aggregate on the primary DB — move to a read replica/analytics store at Stage 3+, Atlas allows secondary reads).
- Push broadcasts to "all" users run inside the API request — at large user counts move to a queue/worker (backlog `INF-03`).
- Image sizes: compress before upload (`MAX_UPLOAD_MB=5` by default).
- Multi-city: today there is one global `radiusKm` and one set of Business Rules — city/zone-specific pricing needs the multi-city zones feature (backlog `GEO-01`).
