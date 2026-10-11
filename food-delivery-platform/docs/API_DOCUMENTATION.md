# API Documentation

Base URL: `{PUBLIC_BASE_URL}{API_PREFIX}` (default `http://localhost:5000/api`).

## Conventions

| Item | Value |
|---|---|
| Auth | `Authorization: Bearer <accessToken>` (JWT, short-lived) + refresh token rotation |
| App type header | `X-App-Type: customer \| vendor \| delivery \| admin \| vendor-web` (used by maintenance mode) |
| Success envelope | `{ "success": true, "message": "<translation key>", "data": … }` |
| Error envelope | `{ "success": false, "message": "<translation key>", "details": … }` |
| Pagination | `?page=1&limit=20` → `data: { items, pagination: { page, limit, total, pages } }` |
| Messages | Every `message` is a **translation key** (e.g. `coupon.expired`). Clients render it with the active language from `/api/config/translations/:lang`. |
| Validation | Every mutating route validates its input (express-validator) → `422 validation.failed` with `details: [{field, message}]`. Keys starting with `$` or containing `.` are stripped from body/query/params (NoSQL-injection guard); query strings are parsed flat |
| Rate limits | API-wide (`RATE_LIMIT_MAX` per window) and stricter on `/auth/*` (`AUTH_RATE_LIMIT_MAX`) → `429` |

Roles: `customer`, `vendor`, `delivery`, `admin`, `superadmin`. Admins can be restricted by an **AdminRole** (permission list); `superadmin` and admins without a role have every permission.

---

## 1. Dynamic configuration (powers every app)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/config` | public | Full runtime config: `theme`, `branding`, `onboarding`, `homeLayout`, `features`, `businessRules`, `legal`, `languages`, `defaultLanguage`, `languageMeta`, `maintenance`, `appVersions`, active `banners`, `categories`, `cuisines`, `payment {provider, publicKey}`, `serverTime` |
| GET | `/config/translations/:lang?` | public | `{ code, name, isRTL, strings }` — strings of `lang` merged over the default language |
| POST | `/config/banners/:id/click` | public | Banner click tracking |
| GET | `/admin/config` | admin `config` | Full stored config |
| PUT | `/admin/config/theme` | `config` | Partial update (deep-merged) |
| PUT | `/admin/config/branding` | `config` | Partial update |
| PUT | `/admin/config/layout` | `config` | **Array** of sections `{ id, type, enabled, order, title, titleKey, subtitle, layout, columns, limit, filter, style }` — replaces the layout |
| PUT | `/admin/config/features` | `config` | e.g. `{ "wallet": false }` |
| PUT | `/admin/config/business` | `config` | Business rules (partial) |
| PUT | `/admin/config/legal` | `legal` | `{ privacyPolicy, termsAndConditions, refundPolicy, aboutUs }` (HTML) |
| PUT | `/admin/config/maintenance` | `config` | `{ appInMaintenance, maintenanceMessage, maintenanceImageUrl, affectedApps[] }` (admin and `/config` routes always stay reachable) |
| PUT | `/admin/config/onboarding` | `config` | `{ enabled, pages:[{title, description, imageUrl, order}] }` |
| PUT | `/admin/config/app-versions` | `config` | Per app `{ minVersion, latestVersion, forceUpdate, storeUrlAndroid, storeUrlIos }` |
| PUT | `/admin/config/languages` | `translations` | `{ languages: ["en","hi"], defaultLanguage: "en" }` |
| GET/POST | `/admin/config/banners` | `banners` | List / create `{ imageUrl*, title, subtitle, placement, linkType, linkValue, order, startDate, endDate, isActive, backgroundColor }` |
| PUT | `/admin/config/banners/reorder` | `banners` | `{ ids: [...] }` |
| PUT/DELETE | `/admin/config/banners/:id` | `banners` | Update / delete |
| GET/POST | `/admin/config/translations` | `translations` | List languages / create `{ code, name, nativeName, isRTL, copyFrom, strings }` |
| POST | `/admin/config/translations/keys` | `translations` | Add a key to every language `{ key, values: { en: "...", hi: "..." } }` |
| GET/PUT/DELETE | `/admin/config/translations/:code` | `translations` | Read / update `{ name, nativeName, isRTL, isActive, strings, merge=true }` (a `null` value deletes a key) / delete |

Every config write increments `version`, invalidates the server cache and emits the socket event **`config:updated`** so open apps reload instantly.

## 2. Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `name, email?, phone?, password, role (customer\|vendor\|delivery), referralCode?, language?` | Returns `{ user, accessToken, refreshToken, restaurant?, deliveryProfile? }` |
| POST | `/auth/login` | `identifier (email or phone), password, role?` | `role` makes the app reject accounts of another type (`auth.wrongApp`) |
| POST | `/auth/send-otp` | `phone, role?` | Requires `features.otpLogin` and `businessRules.otpLogin`. Resend cooldown `OTP_RESEND_SECONDS` → `429 auth.otpTooSoon`. In non-production the response includes `devOtp` |
| POST | `/auth/verify-otp` | `phone, otp, name?, referralCode?` | Creates the user on first login (`isNewUser`). After `OTP_MAX_ATTEMPTS` wrong codes the OTP is burned → `auth.otpAttemptsExceeded` |
| POST | `/auth/forgot-password` | `identifier` | Sends reset code by email/SMS |
| POST | `/auth/reset-password` | `identifier, code, password` | Revokes all refresh tokens; the code is burned after `OTP_MAX_ATTEMPTS` wrong tries |
| POST | `/auth/refresh-token` | `refreshToken` | Rotates refresh token |
| POST | `/auth/google-signin` | `idToken, role?` | Verified against `GOOGLE_CLIENT_IDS`; gated by `features.googleSignIn` |
| POST | `/auth/apple-signin` | `identityToken, name?, role?` | Verified against Apple JWKS; gated by `features.appleSignIn` |
| POST | `/auth/logout` | `refreshToken?, fcmToken?` | Auth |
| GET | `/auth/me` | — | Auth `{ user, restaurant?, deliveryProfile? }` |

## 3. Users (Auth)

`GET/PUT/DELETE /users/profile` · `PUT /users/change-password {currentPassword,newPassword}` · `POST /users/fcm-token {token}` ·
`GET/POST /users/addresses` · `PUT/DELETE /users/addresses/:addressId` (body: `label, fullAddress*, landmark, city, state, pincode, contactName, contactPhone, lat, lng, isDefault`) ·
`GET /users/favorites` · `POST /users/favorites/:restaurantId` (toggle; `features.favorites`) ·
`GET /users/wallet` (`features.wallet`; balance, cap, transactions) · `GET /users/referral` (`features.referral`; code, bonuses from business rules, stats).

## 4. Restaurants & menu

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/restaurants` | optional | Query: `q, lat, lng, radiusKm, cuisine, category, veg, minRating, sort (rating\|distance\|priceLow\|priceHigh\|deliveryTime\|popular\|newest), featured, maxPriceForTwo, ids, page, limit`. `ids` = comma-separated restaurant ids (max 50) for hand-picked sections; results keep that order unless `sort` is given. With `lat/lng` results are geo-filtered within `businessRules.radiusKm` and include `distanceKm`. Every item has `isOpenNow` |
| GET | `/restaurants/:id` | optional | By id or slug; includes applicable `offers` and `isFavorite` |
| GET | `/restaurants/:id/menu` | public | `?veg=true&q=` → `{ categories:[{…, items}], recommended }` |
| GET | `/restaurants/:id/reviews` | public | Paginated |
| GET/PUT | `/restaurants/mine/details` | vendor | Own restaurant |
| PATCH | `/restaurants/mine/status` | vendor | `{ isOpen?, acceptingOrders? }` |
| PUT | `/restaurants/mine/timings` | vendor | `{ timings:[{day 0-6, open "HH:mm", close, closed}] }` |
| POST | `/restaurants` | vendor/admin | Create (vendors start as `pending`) |
| PUT / PATCH | `/restaurants/:id`, `/restaurants/:id/status` | vendor owner/admin | Admin may also set `status, commissionPercent, isFeatured` |
| GET | `/categories?type=category\|cuisine` | public | Platform categories |
| GET | `/menu/public/items` | public | `?ids=a,b,c` (max 50): available dishes from approved restaurants, in the given order, with `restaurant { name, isOpen, acceptingOrders }` |
| GET | `/menu/items/:id` | public | Item detail |
| GET/POST | `/menu/categories` | vendor/admin | Admin passes `?restaurantId=` |
| PUT | `/menu/categories/reorder` | vendor/admin | `{ ids }` |
| PUT/DELETE | `/menu/categories/:id` | vendor/admin | |
| GET/POST | `/menu/items` | vendor/admin | Item: `category*, name*, price*, description, discountPrice, image, isVeg, isAvailable, isBestseller, spiceLevel, tags, addOns:[{name, required, minSelect, maxSelect, options:[{name, price, isVeg, isAvailable}]}]` |
| PUT/DELETE | `/menu/items/:id` | vendor/admin | |
| PATCH | `/menu/items/:id/availability` | vendor/admin | `{ isAvailable }` |
| PUT | `/menu/items/:id/addons` | vendor/admin | `{ addOns }` |

## 5. Orders

Status flow: `placed → accepted → preparing → ready → picked → delivered` (plus `cancelled`, `rejected`). Transitions are validated per actor (vendor, delivery, admin, customer).

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders/quote` | customer | Authoritative bill from business rules. Body: `restaurantId, items:[{menuItemId, quantity, addOns:[{groupId, optionIds[]}], instructions}], addressId?, couponCode?, tip?, useWallet?` → `{ items, bill, distanceKm, coupon, couponError, meetsMinimum, tipPresets, paymentMethods, deliverySlots, … }` |
| POST | `/orders` | customer | Same body + `paymentMethod (card\|upi\|wallet\|cod\|netbanking)`, `scheduledFor?`, `deliverySlot?`, `instructions?` → `{ order, requiresPayment }`. Validates open hours, radius, min order, COD cap, add-on rules, coupon, wallet cap |
| GET | `/orders` · `/orders/active` | customer | History / active orders |
| GET | `/orders/:id` | owner/vendor/rider/admin | Includes `canCancel`; `deliveryOtp` only for the customer |
| POST | `/orders/:id/cancel` | customer/admin | `{ reason }`. Penalty `cancellationPenaltyPercent` applies after `cancellationWindowMinutes`; refunds go to wallet (if enabled) or back to the gateway |
| GET | `/orders/:id/reorder` | customer | Available items to rebuild the cart |
| GET | `/orders/vendor/list` | vendor | `?status=placed,accepted&from&to` |
| PATCH | `/orders/vendor/:id/status` | vendor | `{ status: accepted\|rejected\|preparing\|ready\|cancelled, reason? }` |
| GET | `/orders/vendor/stats` | vendor | Today, pending, totals, daily series, top items, effective commission % |
| GET | `/orders/vendor/payouts` | vendor | Payout history + settlements |

Background jobs (every minute, from `businessRules`): orders not accepted within `vendorAcceptTimeoutMinutes` are auto-rejected and refunded; online orders unpaid after `paymentTimeoutMinutes` are auto-cancelled (wallet and coupon restored). `0` disables a job. ETA = prep time + `etaBufferMinutes` + km × `etaMinutesPerKm`; delivery OTP length = `deliveryOtpLength`.

Bill formula (all values from `businessRules`):
```
deliveryFee = (subtotal ≥ freeAbove or free-delivery coupon) ? 0 : base + max(0, km − baseKm) × perKm
surgeFee    = surge.enabled ? deliveryFee × (multiplier − 1) : 0
tax         = (subtotal − discount) × taxPercent / 100
tip         ≤ maxTipPercent% of subtotal
total       = subtotal − discount + deliveryFee + surgeFee + packagingFee + platformFee + tax + tip
walletUsed  ≤ walletMaxUsePercent% of total ;  payable = total − walletUsed
commission  = (subtotal − discount) × (restaurant.commissionPercent ?? commissionPercent) / 100
vendorEarning   = subtotal − discount − commission + packagingFee
deliveryEarning = payout.base + km × payout.perKm + tip × tipSharePercent / 100
```

## 6. Payments

| Method | Path | Description |
|---|---|---|
| POST | `/payments/create-intent` | Auth `{ orderId }` or `{ purpose: "wallet_topup", amount }` → Razorpay order or Stripe PaymentIntent (provider = `PAYMENT_PROVIDER`) with `publicKey`, branding and prefill |
| POST | `/payments/verify` | Auth `{ orderId?, intentId, paymentId?, signature? }` — HMAC (Razorpay) or intent status (Stripe). Marks paid and emits `order:new` to the vendor |
| POST | `/payments/webhook/:provider` | Gateway webhooks. Razorpay: HMAC-SHA256 of the raw body with `RAZORPAY_WEBHOOK_SECRET` (timing-safe); Stripe: `STRIPE_WEBHOOK_SECRET`. Confirms orders and wallet top-ups idempotently; a payment that arrives after the order was cancelled is refunded automatically |
| POST | `/payments/refund` · `/admin/orders/:orderId/refund` | admin `{ orderId, amount?, toWallet? }` |
| GET | `/payments/history` | Auth user transactions |

## 7. Coupons & reviews

`GET /coupons/available?restaurantId=` · `POST /coupons/validate {code, restaurantId, subtotal}` ·
`GET/POST /coupons`, `PUT/DELETE /coupons/:id` (admin: any; vendor: own restaurant) — fields: `code, title, description, discountType (percent|flat|free_delivery), value, maxDiscount, minOrderValue, validFrom, validTo, usageLimit, perUserLimit, restaurant, firstOrderOnly, isActive, showInOffers, bannerImage`.

`POST /reviews {orderId, rating, deliveryRating?, comment?, images?}` (delivered orders, once) · `GET /reviews/restaurant/:id` · `GET /reviews/mine` · `GET /reviews/vendor` · `POST /reviews/:id/reply {text}` · `PATCH /reviews/:id/visibility {isVisible}` (admin).

## 8. Delivery partner (role `delivery`)

`POST /delivery/register {vehicleType, vehicleNumber, licenseNumber, documents, bankDetails}` · `GET /delivery/profile` ·
`PATCH /delivery/online {isOnline, lat?, lng?}` · `POST /delivery/location {lat, lng, heading?, speed?}` ·
`GET /delivery/available-orders` (only while online & approved; within `radiusKm`; includes `payout`, `collectAmount`) ·
`POST /delivery/orders/:id/accept` (atomic — first rider wins) · `POST /delivery/orders/:id/reject` · `GET /delivery/active` ·
`PATCH /delivery/orders/:id/status {status: picked|delivered, otp?, photoUrl?}` (OTP / photo enforced by feature flags `deliveryOtp`, `deliveryPhotoProof`) ·
`GET /delivery/history` · `GET /delivery/earnings?days=7`.

## 9. Admin (role `admin`, permission in brackets)

`GET /admin/stats` [dashboard] · `GET /admin/analytics/revenue?days=&groupBy=day|month` [dashboard] ·
Users [users]: `GET/POST /admin/users`, `GET/PUT /admin/users/:id`, `PATCH /admin/users/:id/ban {banned, reason}`, `POST /admin/users/:id/wallet {amount (+/-), reason}` ·
Restaurants: `GET /admin/restaurants?status=&q=` [restaurants], `PATCH /admin/restaurants/:id/status {status, reason}` [vendors], `PATCH /admin/restaurants/:id/commission {commissionPercent|null}` [settings], `DELETE /admin/restaurants/:id` ·
Commission [settings]: `GET/PUT /admin/commission` ·
Categories [categories]: `GET/POST /admin/categories`, `PUT /admin/categories/reorder`, `PUT/DELETE /admin/categories/:id` ·
Orders [orders]: `GET /admin/orders`, `PATCH /admin/orders/:id/assign {partnerUserId}`, `PATCH /admin/orders/:id/status {status, reason}` ·
Finance [transactions]: `GET /admin/transactions?type=&from=&to=`, `POST /admin/payouts {kind: vendor|delivery, id, amount, reference}` ·
Delivery [delivery]: `GET /admin/delivery-partners?status=&online=`, `PATCH /admin/delivery-partners/:id/status` ·
Notifications [notifications]: `POST /admin/notifications/send {audience: all|customer|vendor|delivery, userIds?, title, body, imageUrl, channels:[push,inapp,email,sms], data}`, `GET /admin/notifications` ·
Reviews [restaurants]: `GET /admin/reviews?maxRating=&visible=&restaurant=` (moderation; toggle with `PATCH /reviews/:id/visibility`) ·
Reports [reports]: `GET /admin/reports?type=orders|restaurants|delivery|reviews&from&to&format=csv` ·
Roles [roles]: `GET/POST /admin/roles`, `PUT/DELETE /admin/roles/:id`.

## 10. Uploads & notifications

`POST /upload/image` (multipart field `image`, optional `folder`) → `{ url }` · `POST /upload/images` (field `images`, ≤10).
Driver: `UPLOAD_DRIVER=local` (served from `/uploads`) or `s3`.

`GET /notifications` (own + broadcast; `unread` count) · `POST /notifications/read {ids?}`.

## 11. Socket.io

Connect to the server origin with `auth: { token: <accessToken> }` (anonymous connections only receive `config:updated`).

| Event (server → client) | Rooms | Payload |
|---|---|---|
| `config:updated` | everyone | `{ section, at }` — reload `/api/config` |
| `order:new` | restaurant, admin | populated order |
| `order:accepted` | customer, order | populated order |
| `order:status-update` | customer, restaurant, rider, admin, order | `{ orderId, status, statusHistory, order }` |
| `delivery:available` | online riders | populated order |
| `delivery:taken` | online riders | `{ orderId }` |
| `delivery:assigned` | customer, restaurant, rider, order | `{ orderId, deliveryPartner, order }` |
| `delivery:location` | customer, order | `{ orderId, lat, lng, heading, speed, at }` |
| `notification:new` | user | `{ title, body, imageUrl, data }` |

| Event (client → server) | Payload |
|---|---|
| `order:join` / `order:leave` | `{ orderId }` (authorised parties only) |
| `delivery:online` | `{ online }` |
| `delivery:location` | `{ lat, lng, heading?, speed? }` |

## 12. Health

`GET /health` → `{ success, status: "ok", env, time }`.
