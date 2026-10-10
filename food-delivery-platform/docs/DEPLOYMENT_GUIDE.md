# VPS Deployment Guide (Ubuntu 22.04/24.04)

## 1. Server preparation
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl git ufw nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```
DNS: point `api.example.com`, `admin.example.com`, `partner.example.com` to the server.

## 2. Configure
```bash
git clone <your-repo> /opt/food-delivery && cd /opt/food-delivery
cp backend/.env.example backend/.env
nano backend/.env    # NODE_ENV=production, secrets, PUBLIC_BASE_URL=https://api.example.com,
                     # CORS_ORIGINS=https://admin.example.com,https://partner.example.com, payment/SMTP/Twilio/FCM keys
cp .env.example .env # PUBLIC_API_URL=https://api.example.com
```
Generate secrets: `openssl rand -hex 48`.

## 3. Run
```bash
docker compose up -d --build
docker compose exec backend npm run seed     # first run only
docker compose ps
```
Services: API `127.0.0.1:5000`, Admin `:5173`, Vendor `:5174`, MongoDB internal only. Uploaded files persist in the `uploads` volume; MongoDB in `mongo_data`.

## 4. Nginx reverse proxy + TLS
`/etc/nginx/sites-available/food-delivery`:
```nginx
server {
  server_name api.example.com;
  client_max_body_size 10m;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;      # socket.io
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server { server_name admin.example.com;   location / { proxy_pass http://127.0.0.1:5173; } }
server { server_name partner.example.com; location / { proxy_pass http://127.0.0.1:5174; } }
```
```bash
sudo ln -s /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.example.com -d admin.example.com -d partner.example.com
```
Restrict published ports to localhost in production by prefixing them in `docker-compose.yml` (e.g. `"127.0.0.1:5000:5000"`).

## 5. Payment webhooks
* Razorpay → `https://api.example.com/api/payments/webhook/razorpay` (events `payment.captured`, `order.paid`), secret = `RAZORPAY_KEY_SECRET`.
* Stripe → `https://api.example.com/api/payments/webhook/stripe` (event `payment_intent.succeeded`), signing secret → `STRIPE_WEBHOOK_SECRET`.

## 6. Without Docker (PM2)
```bash
sudo apt -y install nodejs npm && sudo npm i -g pm2
cd backend && npm ci --omit=dev && pm2 start server.js --name food-api && pm2 save && pm2 startup
cd ../admin-panel && npm ci && VITE_API_BASE_URL=https://api.example.com npm run build   # serve dist/ with nginx
cd ../vendor-dashboard && npm ci && VITE_API_BASE_URL=https://api.example.com npm run build
```
Use MongoDB Atlas or install `mongodb-org` from the official repo.

## 7. Operations
* Backups: `docker compose exec mongo mongodump --archive=/data/db/backup.gz --gzip` (cron + off-site copy), plus the `uploads` volume or S3 (`UPLOAD_DRIVER=s3`).
* Updates: `git pull && docker compose up -d --build`, then `docker compose exec backend npm run seed` to add new translation keys (non-destructive).
* Logs: `docker compose logs -f backend`.
* Health: `GET /api/health` (used by the container HEALTHCHECK).
* Scaling: run several API containers behind nginx with sticky sessions (or add the socket.io Redis adapter) for real-time events.
