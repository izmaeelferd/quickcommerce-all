# FeastFlow — Backup & Restore Strategy

What must survive a disaster, in order of importance:

| Asset | Where it lives | Path A (Docker) | Path B (Native) | Backed up by |
|---|---|---|---|---|
| **MongoDB** `food_delivery` (users, orders, wallet balances, transactions, restaurants, menus, config, translations, coupons, banners) | Database | volume `mongo_data` | `/var/lib/mongodb` | `mongodump` nightly + off-site (§2–§4) |
| **Uploads** (restaurant logos, menu photos, banners, delivery photo proofs) | `UPLOAD_DRIVER=local` → disk; `s3` → bucket | volume `uploads` (mounted at `/app/uploads`) | `backend/uploads/` | tar nightly (§5) or bucket versioning |
| **Secrets** `backend/.env`, root `.env` (compose vars), Firebase service-account JSON | Server files | `/opt/food-delivery/food-delivery-platform/...` | same | encrypted copy on change (§6) |
| **Signing keys** (Android upload keystore + `key.properties`, iOS certificates) | Developer machine | — | — | password manager / encrypted vault — losing the Android upload key blocks app updates until Google resets it |
| Nginx config + TLS | `/etc/nginx/sites-available/food-delivery`, `/etc/letsencrypt` | — | — | config in git/vault; certs re-issuable with certbot |
| Code | Git remote | — | — | git host (not a backup concern) |

---

## 1. Targets

| Metric | Target at launch | Achieved by | Upgrade path |
|---|---|---|---|
| **RPO** (max data loss) | **≤ 24 h** (nightly dump); ≤ [6 h] if you add the 6-hourly cron in §2.3 | `mongodump` cron | Managed MongoDB (Atlas) continuous backup / point-in-time restore → RPO minutes (`scaling-roadmap.md` stage 3) |
| **RTO** (time to be back online) | **≤ 2 h** for a DB restore on the same server; **≤ [4–6 h]** for a full rebuild on a new VPS | This document + `docs/DEPLOYMENT_GUIDE.md` | Pre-built standby VPS / infrastructure as code → < 1 h |
| Retention | 7 daily + 4 weekly + 6 monthly (local: 7 daily) | rotation script §3 / bucket lifecycle §4 | adjust to your legal/tax retention needs ([RETENTION REQUIREMENT]) |
| Restore test | Monthly, documented | §7 | automate weekly |

Why 24 h RPO is acceptable at launch: payments are also recorded at Razorpay/Stripe, so orders lost in the gap can be reconstructed from the gateway; but wallet balances and vendor earnings cannot — reduce RPO as volume grows.

---

## 2. MongoDB dump (the commands from the deployment guide, productionised)

Base commands (from `docs/DEPLOYMENT_GUIDE.md` §7):
- Path A: `docker compose exec -T mongo mongodump --archive --gzip > backup-$(date +%F).gz`
- Path B: `mongodump --archive=backup.gz --gzip`

### 2.1 Directory layout
```bash
sudo mkdir -p /var/backups/feastflow/{mongo,uploads,secrets,logs}
sudo chown -R deploy:deploy /var/backups/feastflow
chmod 700 /var/backups/feastflow
```

### 2.2 Backup script — `/opt/food-delivery/bin/backup-mongo.sh`
Works for both paths (set `MODE`).

```bash
#!/usr/bin/env bash
# FeastFlow MongoDB backup with rotation. Usage: backup-mongo.sh [docker|native]
set -euo pipefail
MODE="${1:-docker}"
APP_DIR=/opt/food-delivery/food-delivery-platform
DEST=/var/backups/feastflow/mongo
DB=food_delivery
KEEP_DAILY=7          # local copies kept
STAMP=$(date +%F_%H%M)
FILE="$DEST/${DB}-${STAMP}.gz"

mkdir -p "$DEST"
if [ "$MODE" = "docker" ]; then
  cd "$APP_DIR"
  docker compose exec -T mongo mongodump --db "$DB" --archive --gzip > "$FILE.partial"
else
  # add --uri "mongodb://user:pass@127.0.0.1:27017/?authSource=admin" if MongoDB auth is enabled
  mongodump --db "$DB" --archive="$FILE.partial" --gzip
fi

# Sanity: non-empty and a valid gzip stream
[ -s "$FILE.partial" ] || { echo "backup empty"; rm -f "$FILE.partial"; exit 1; }
gzip -t "$FILE.partial"
mv "$FILE.partial" "$FILE"
sha256sum "$FILE" > "$FILE.sha256"

# Rotation: keep the newest $KEEP_DAILY archives locally
ls -1t "$DEST"/${DB}-*.gz | tail -n +$((KEEP_DAILY + 1)) | while read -r old; do rm -f "$old" "$old.sha256"; done

echo "$(date -Is) OK $FILE $(du -h "$FILE" | cut -f1)"
```
```bash
chmod +x /opt/food-delivery/bin/backup-mongo.sh
/opt/food-delivery/bin/backup-mongo.sh docker      # Path A test run
/opt/food-delivery/bin/backup-mongo.sh native      # Path B test run
```
`mongodump` is consistent per collection, not across collections, on a standalone server. At launch volumes this is fine; run it at the quietest hour. A replica set (Atlas) allows `--oplog` / snapshot backups.

### 2.3 Cron (`crontab -e` as `deploy`; server timezone is UTC per the deployment guide)
```cron
# 03:15 IST = 21:45 UTC — nightly DB backup (Path A: docker | Path B: native)
45 21 * * * /opt/food-delivery/bin/backup-mongo.sh docker >> /var/backups/feastflow/logs/mongo.log 2>&1
# optional: every 6 h for RPO ≤ 6 h
# 45 3,9,15 * * * /opt/food-delivery/bin/backup-mongo.sh docker >> /var/backups/feastflow/logs/mongo.log 2>&1
# 04:00 IST = 22:30 UTC — uploads + off-site sync
30 22 * * * /opt/food-delivery/bin/backup-uploads.sh docker >> /var/backups/feastflow/logs/uploads.log 2>&1
15 23 * * * /opt/food-delivery/bin/offsite-sync.sh >> /var/backups/feastflow/logs/offsite.log 2>&1
```
Path A: the `deploy` user must be in the `docker` group (DEPLOYMENT_GUIDE does `usermod -aG docker deploy`). Cron runs without a TTY, which is why the commands use `exec -T`.

Alerting: add a dead-man's switch so a silently failing cron is noticed — e.g. append `&& curl -fsS -m 10 [HEALTHCHECK PING URL]` (healthchecks.io / Better Uptime / cron monitoring of your choice) to each line.

---

## 3. Retention rotation (local vs off-site)

- **Local** (`/var/backups/feastflow/mongo`): the script keeps 7 newest — fast restores for "someone deleted something yesterday".
- **Off-site**: keep 7 daily / 4 weekly / 6 monthly. Easiest with bucket lifecycle rules (§4). If your remote has no lifecycle rules, promote copies by date:

```bash
#!/usr/bin/env bash
# /opt/food-delivery/bin/promote-backups.sh — weekly (Sunday) and monthly (1st) copies, kept longer
set -euo pipefail
SRC=/var/backups/feastflow/mongo
LATEST=$(ls -1t $SRC/food_delivery-*.gz | head -1)
[ "$(date +%u)" = "7" ] && rclone copy "$LATEST" "[RCLONE REMOTE]:[BUCKET]/mongo/weekly/"
[ "$(date +%d)" = "01" ] && rclone copy "$LATEST" "[RCLONE REMOTE]:[BUCKET]/mongo/monthly/"
rclone delete "[RCLONE REMOTE]:[BUCKET]/mongo/daily/"   --min-age 8d
rclone delete "[RCLONE REMOTE]:[BUCKET]/mongo/weekly/"  --min-age 35d
rclone delete "[RCLONE REMOTE]:[BUCKET]/mongo/monthly/" --min-age 190d
```

---

## 4. Off-site copy

A backup on the same VPS is not a backup. Copy every night to a **different provider/region**.

### 4.1 rclone (any S3-compatible store: AWS S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces, Wasabi, Google Drive)
```bash
sudo apt -y install rclone
rclone config            # create remote "[RCLONE REMOTE]" — use a key limited to ONE bucket, write-only if the provider supports it
```
`/opt/food-delivery/bin/offsite-sync.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
REMOTE="[RCLONE REMOTE]:[BUCKET]"
rclone copy /var/backups/feastflow/mongo   "$REMOTE/mongo/daily"   --include "*.gz" --include "*.sha256" --max-age 2d
rclone copy /var/backups/feastflow/uploads "$REMOTE/uploads"       --max-age 2d
rclone copy /var/backups/feastflow/secrets "$REMOTE/secrets"       --max-age 2d
/opt/food-delivery/bin/promote-backups.sh
echo "$(date -Is) offsite OK"
```

### 4.2 AWS CLI alternative
```bash
aws s3 cp /var/backups/feastflow/mongo/ s3://[BUCKET]/mongo/daily/ --recursive --exclude "*" --include "*$(date +%F)*"
```
Bucket settings: **versioning on**, **object lock / retention** if available (protects against ransomware deleting backups with the server's key), lifecycle rule: delete `mongo/daily/` after 8 days, `weekly/` 35, `monthly/` 190, server-side encryption on.

### 4.3 Encryption (recommended — the dump contains personal data: names, phones, addresses)
Encrypt before upload with `age` or `gpg`:
```bash
age -r [AGE PUBLIC KEY] -o file.gz.age file.gz          # encrypt (public key on server)
age -d -i [PRIVATE KEY FILE] -o file.gz file.gz.age      # decrypt (private key NOT on the server; keep in vault)
```
Or use rclone's `crypt` remote wrapper. Keep the decryption key in at least two places (password manager + offline).

---

## 5. Uploads

### Option 1 — local disk (default `UPLOAD_DRIVER=local`)
`/opt/food-delivery/bin/backup-uploads.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
MODE="${1:-docker}"
DEST=/var/backups/feastflow/uploads
STAMP=$(date +%F)
mkdir -p "$DEST"
if [ "$MODE" = "docker" ]; then
  # Volume name = <compose project>_uploads; confirm with: docker volume ls | grep uploads
  VOL=$(docker volume ls -q | grep -E '_uploads$' | head -1)
  docker run --rm -v "$VOL":/data:ro -v "$DEST":/backup alpine tar czf "/backup/uploads-$STAMP.tgz" -C /data .
else
  tar czf "$DEST/uploads-$STAMP.tgz" -C /opt/food-delivery/food-delivery-platform/backend uploads
fi
# keep 7 local archives
ls -1t "$DEST"/uploads-*.tgz | tail -n +8 | xargs -r rm -f
```
Uploads only grow; when the archive gets large (> a few GB), switch to incremental sync instead of tarballs: `rclone sync <uploads dir> [RCLONE REMOTE]:[BUCKET]/uploads-live --backup-dir [RCLONE REMOTE]:[BUCKET]/uploads-deleted/$(date +%F)` (Path A: sync from `/var/lib/docker/volumes/<project>_uploads/_data` with sudo).

Restore uploads:
```bash
# Path A
docker run --rm -v <project>_uploads:/data -v /var/backups/feastflow/uploads:/backup alpine sh -c "cd /data && tar xzf /backup/uploads-YYYY-MM-DD.tgz"
# Path B
tar xzf /var/backups/feastflow/uploads/uploads-YYYY-MM-DD.tgz -C /opt/food-delivery/food-delivery-platform/backend
```

### Option 2 — S3-compatible storage (`UPLOAD_DRIVER=s3`) — recommended once you have real vendors
Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_PUBLIC_URL` in `backend/.env`, restart. Then the backup is the bucket's own durability + **versioning** + optional cross-region replication; no tar job needed. Existing local files are not moved automatically — copy them to the bucket and update stored URLs (developer task, backlog `INF-05`).

---

## 6. Secrets backup (`.env` and friends)

Back up on every change (not nightly — they rarely change), encrypted:
```bash
cd /opt/food-delivery/food-delivery-platform
tar czf - backend/.env .env [path/to/firebase-service-account.json] \
  | age -r [AGE PUBLIC KEY] > /var/backups/feastflow/secrets/env-$(date +%F).tgz.age
```
Also store each secret individually in a team password manager ([PASSWORD MANAGER]) with owner and rotation date. Never commit `.env` (it is in `.gitignore`). Document which person can access the decryption key.

---

## 7. Restore test procedure (monthly) — non-destructive

Restores last night's archive into a **separate database** `food_delivery_restoretest` on the same server, compares counts, then drops it. Production data is untouched.

```bash
F=$(ls -1t /var/backups/feastflow/mongo/food_delivery-*.gz | head -1); echo "$F"
sha256sum -c "$F.sha256"

# Path A
cd /opt/food-delivery/food-delivery-platform
docker compose exec -T mongo mongorestore --archive --gzip \
  --nsFrom='food_delivery.*' --nsTo='food_delivery_restoretest.*' --drop < "$F"
# Path B
mongorestore --archive="$F" --gzip --nsFrom='food_delivery.*' --nsTo='food_delivery_restoretest.*' --drop
```
Compare document counts (Path A prefix: `docker compose exec -T mongo`):
```bash
mongosh --quiet --eval '
const a=db.getSiblingDB("food_delivery"), b=db.getSiblingDB("food_delivery_restoretest");
a.getCollectionNames().sort().forEach(c => print(c.padEnd(20), a[c].countDocuments(), b[c].countDocuments()));
print("latest order in backup:", JSON.stringify(b.orders.find({}, {orderNumber:1, createdAt:1}).sort({createdAt:-1}).limit(1).toArray()));'
```
Expected: restore-test counts ≤ live counts, latest order timestamp ≈ backup time. Then clean up:
```bash
mongosh --quiet --eval 'db.getSiblingDB("food_delivery_restoretest").dropDatabase()'
```
Quarterly, do a **full drill** on a fresh VPS: follow `docs/DEPLOYMENT_GUIDE.md`, restore the off-site archive (download + decrypt), restore uploads, copy `.env`, point a test subdomain at it, log in to the Admin Panel, open an order. Measure the time → that is your real RTO.

Log every test in [RESTORE TEST LOG]: date, archive, duration, counts OK?, problems, who.

---

## 8. Real restore (production) — destructive

Follow `incident-response.md` §7.4. Key commands:
```bash
# Path A
docker compose exec -T mongo mongorestore --archive --gzip --drop < /var/backups/feastflow/mongo/food_delivery-YYYY-MM-DD_HHMM.gz
docker compose restart backend
# Path B
mongorestore --archive=/var/backups/feastflow/mongo/food_delivery-YYYY-MM-DD_HHMM.gz --gzip --drop
pm2 restart food-api
```
`--drop` drops each collection before restoring it — anything written after the backup is gone. Always take a fresh dump of the current state first. Indexes are restored from the dump and also ensured on API start.

Restoring **one collection** (e.g. someone wiped coupons): `--nsInclude='food_delivery.coupons'` together with `--drop` restores only that collection.

---

## 9. Checklist

- [ ] `/opt/food-delivery/bin/backup-mongo.sh`, `backup-uploads.sh`, `offsite-sync.sh`, `promote-backups.sh` installed and executable
- [ ] Cron entries active (`crontab -l`), logs in `/var/backups/feastflow/logs/`
- [ ] Dead-man's-switch monitoring on backup cron
- [ ] Off-site bucket: versioning, lifecycle, encryption, separate credentials
- [ ] Encryption key stored in two places off the server
- [ ] `.env` + Firebase JSON backed up encrypted; signing keystores in vault
- [ ] Monthly restore test done and logged
- [ ] Quarterly full rebuild drill done; RTO measured
