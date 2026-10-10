# Test every app locally

This brings up the whole platform on your computer with demo data: database, API, the three Flutter apps (as web apps), the admin panel and the vendor dashboard. It runs with one command and needs only **Docker Desktop**.

> Demo mode uses fixed demo passwords and secrets. Never expose it to the internet or use it for real orders.

## 1. Start

1. Install Docker Desktop (https://docs.docker.com/desktop/) and start it.
2. Unzip the all-in-one zip and open a terminal in `food-delivery-platform/`.
3. Run the script for your system:

| System | This computer only | Also from phones on the same Wi-Fi |
|---|---|---|
| Windows (PowerShell) | `powershell -ExecutionPolicy Bypass -File scripts\demo.ps1` | `... scripts\demo.ps1 -Lan` |
| macOS / Linux | `./scripts/demo.sh` | `./scripts/demo.sh --lan` |

The first run builds the API image and takes a few minutes. The script prints these links when it finishes:

| App | URL | Login |
|---|---|---|
| Customer app | http://localhost:8080/customer/ | customer@example.com / Password@123 |
| Partner (restaurant) app | http://localhost:8080/partner/ | vendor1@example.com / Password@123 |
| Rider app | http://localhost:8080/rider/ | rider@example.com / Password@123 |
| Admin panel | http://localhost:5173 | admin@yourapp.com / Admin@12345 |
| Vendor web dashboard | http://localhost:5174 | vendor1@example.com / Password@123 |

With `--lan` / `-Lan`, replace `localhost` with the IP the script prints, and open the links on your phone. If Windows Firewall asks, allow Docker on private networks.

**Stop:** `scripts/demo.sh --stop` (`demo.ps1 -Stop`). **Wipe all demo data:** `--reset` (`-Reset`).

## 2. Full order flow (about 5 minutes)

Use three browser windows, or a private window per app, so the logins don't overwrite each other.

1. **Customer**: pick a restaurant (e.g. Bella Napoli Pizzeria), add items, open the cart, apply `WELCOME50`, choose **Cash on delivery**, and place the order.
2. **Partner** (or vendor dashboard → Orders): the new order appears live. Click **Accept** → **Preparing** → **Ready**. You have 5 minutes to accept before it auto-rejects (Admin → Business Rules).
3. **Rider**: switch **Online**, accept the delivery request, mark it **Picked up**, then **Delivered**. Enter the 4-digit OTP shown on the customer's tracking screen. Photo proof can be any image file.
4. **Customer**: the tracking screen updates at each step. Rate the order at the end.
5. **Admin panel**: watch the order on the Dashboard and in Orders. Then try changing something live: Theme colors, Feature Flags, Home Layout, Banners, Coupons. The open apps update without a reload.

## 3. What behaves differently in the browser demo

| Feature | In the demo | On a real phone build |
|---|---|---|
| Maps | A card with "Open in Maps" (no Google Maps key) | Live map, with `GOOGLE_MAPS_KEY` |
| Push notifications | Off (no Firebase web config); in-app notifications still work | FCM push |
| Online payments | Razorpay/Stripe keys are empty: use **Cash on delivery** or **Wallet** | Configure keys in `backend/.env` |
| OTP login, SMS, email | Use email + password; OTP codes are printed in the API log (`docker compose -f docker-compose.demo.yml logs backend`) | Twilio / SMTP |
| Rider GPS | Browser location while the tab is open | Background tracking while online |
| Location | Restaurants are seeded around Bengaluru. To test "nearby" in your city, set `DEMO_LAT` / `DEMO_LNG` before the first start (or run `--reset`, then start again). | Device GPS |

## 4. Android APKs (build on your own computer)

Install Flutter 3.x and Android Studio (Android SDK), then run from `flutter-apps/`:

```bash
flutter pub get
# LAN testing against the demo: debug builds allow plain http://
flutter build apk --debug --flavor customer -t lib/main_customer.dart --dart-define=API_BASE_URL=http://<PC-IP>:8080
flutter build apk --debug --flavor vendor   -t lib/main_vendor.dart   --dart-define=API_BASE_URL=http://<PC-IP>:8080
flutter build apk --debug --flavor delivery -t lib/main_delivery.dart --dart-define=API_BASE_URL=http://<PC-IP>:8080
```

Start the demo with `--lan` first. Install the APKs from `build/app/outputs/flutter-apk/`. Release builds need an `https://` API URL (see `docs/FLUTTER_BUILD_GUIDE.md`).

## 5. Rebuilding the demo web apps

The zip already includes `demo/web/`. If you change the source, rebuild it with `./scripts/build-web-demo.sh` (needs Flutter and Node 18+).
