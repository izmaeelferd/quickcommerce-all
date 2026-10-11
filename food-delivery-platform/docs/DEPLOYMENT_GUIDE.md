# Production Deployment (fresh Ubuntu 22.04 / 24.04 VPS)

Two supported paths — pick one:
* **A. Docker Compose** (recommended): MongoDB + API + Admin + Vendor web in containers behind host Nginx.
* **B. Native**: Node 20 + MongoDB 7 + PM2 + Nginx.

Both use the same DNS, firewall, Nginx and TLS steps. Replace `example.com` with your domain.

## 0. DNS
Create **A records** pointing to the VPS public IP:
| Host | Purpose |
|---|---|
| `api.example.com` | REST API + Socket.io + uploads (used by mobile apps and web panels) |
| `admin.example.com` | Admin Panel |
| `partner.example.com` | Vendor Dashboard |

## 1. Base server
```bash
ssh root@YOUR_IP
adduser deploy && usermod -aG sudo deploy && rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
su - deploy
sudo apt update && sudo apt -y upgrade
sudo apt -y install git curl ufw nginx certbot python3-certbot-nginx
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
sudo timedatectl set-timezone UTC
```

## 2. Get the code and configure
```bash
sudo mkdir -p /opt/food-delivery && sudo chown deploy:deploy /opt/food-delivery
git clone <your-repo-url> /opt/food-delivery && cd /opt/food-delivery/food-delivery-platform
cp backend/.env.example backend/.env
nano backend/.env
```
Set at minimum (see `ENVIRONMENT_SETUP.md` for every key):
```
NODE_ENV=production
PUBLIC_BASE_URL=https://api.example.com
CLIENT_URLS=https://admin.example.com,https://partner.example.com
MONGODB_URI=mongodb://127.0.0.1:27017/food_delivery      # path B; path A overrides it in compose
JWT_ACCESS_SECRET=<openssl rand -hex 48>
JWT_REFRESH_SECRET=<openssl rand -hex 48, different>
ADMIN_DEFAULT_EMAIL=admin@example.com
ADMIN_DEFAULT_PASSWORD="<strong password — change after first login>"
PAYMENT_PROVIDER=razorpay   # + keys and webhook secret
```

---
## Path A — Docker Compose
```bash
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker deploy && newgrp docker
cp .env.example .env && sed -i 's#^PUBLIC_API_URL=.*#PUBLIC_API_URL=https://api.example.com#' .env
docker compose up -d --build
docker compose exec backend npm run seed          # default config, languages, categories, coupons, super admin
docker compose ps                                  # all healthy
curl -s http://127.0.0.1:5000/api/health
```
Containers listen on `127.0.0.1` only (API 5000, Admin 5173, Vendor 5174); Nginx (step 3) publishes them. MongoDB is not exposed. Data volumes: `mongo_data`, `uploads`.

Update: `git pull && docker compose up -d --build && docker compose exec backend npm run seed` (seed is non-destructive: adds new translation keys only).

---
## Path B — Native (Node + MongoDB + PM2)
```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt -y install nodejs
# MongoDB 7 (official repo)
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt -y install mongodb-org && sudo systemctl enable --now mongod
# API
cd /opt/food-delivery/food-delivery-platform/backend
npm ci --omit=dev && npm run seed
sudo npm i -g pm2
pm2 start server.js --name food-api && pm2 save && pm2 startup systemd -u deploy --hp /home/deploy   # run the printed command
curl -s http://127.0.0.1:5000/api/health
# Web panels (static builds served by Nginx)
cd ../admin-panel && npm ci && VITE_API_URL=https://api.example.com npm run build
cd ../vendor-dashboard && npm ci && VITE_API_URL=https://api.example.com npm run build
sudo mkdir -p /var/www/admin /var/www/partner
sudo cp -r ../admin-panel/dist/* /var/www/admin/ && sudo cp -r dist/* /var/www/partner/
```
MongoDB binds to 127.0.0.1 by default — keep it that way (or enable auth and use a user in `MONGODB_URI`).

---
## 3. Nginx reverse proxy
`sudo nano /etc/nginx/sites-available/food-delivery`
```nginx
server {
  server_name api.example.com;
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;          # Socket.io
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 75s;
  }
}
# Path A (containers):
server { server_name admin.example.com;   location / { proxy_pass http://127.0.0.1:5173; } }
server { server_name partner.example.com; location / { proxy_pass http://127.0.0.1:5174; } }
# Path B (static files) — use these two blocks instead of the two above:
# server { server_name admin.example.com;   root /var/www/admin;   location / { try_files $uri /index.html; } }
# server { server_name partner.example.com; root /var/www/partner; location / { try_files $uri /index.html; } }
```
```bash
sudo ln -s /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 4. TLS (Let's Encrypt)
```bash
sudo certbot --nginx -d api.example.com -d admin.example.com -d partner.example.com --redirect -m you@example.com --agree-tos -n
sudo systemctl status certbot.timer     # auto-renewal
```

## 5. Payment webhooks
* Razorpay → `https://api.example.com/api/payments/webhook/razorpay` — events `payment.captured`, `order.paid`; put the webhook secret in `RAZORPAY_WEBHOOK_SECRET`.
* Stripe → `https://api.example.com/api/payments/webhook/stripe` — event `payment_intent.succeeded`; signing secret → `STRIPE_WEBHOOK_SECRET`.
Restart the API after editing `.env` (`docker compose up -d backend` or `pm2 restart food-api`).

## 6. Go-live checks
```bash
curl -s https://api.example.com/api/health                       # {"status":"ok","env":"production"}
curl -s https://api.example.com/api/config | head -c 300          # config JSON
curl -sI -H "Origin: https://evil.test" https://api.example.com/api/config | grep -i access-control || echo "CORS locked"
```
Then: log in at `https://admin.example.com` with `ADMIN_DEFAULT_EMAIL`, **change the password**, configure branding/theme/rules, and build the mobile apps with `--dart-define=API_BASE_URL=https://api.example.com`.

## 7. Operations
* **Backups**: Path A `docker compose exec -T mongo mongodump --archive --gzip > backup-$(date +%F).gz`; Path B `mongodump --archive=backup.gz --gzip`. Schedule with cron and copy off-site; back up `uploads` too (or use `UPLOAD_DRIVER=s3`).
* **Logs**: `docker compose logs -f backend` / `pm2 logs food-api`.
* **Payment webhooks** keep working during maintenance mode (`/api/payments/webhook/*` is always allowed).
* **Background jobs** (vendor accept timeout, unpaid-order timeout) run inside the API process every minute — run exactly one scheduler per database: set `RUN_SCHEDULER=false` on every additional API instance.
* **Scaling**: multiple API instances need sticky sessions (or the Socket.io Redis adapter) for realtime events.
