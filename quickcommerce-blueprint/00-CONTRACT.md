# Blueprint contract: decisions every document must follow

This file fixes the names and decisions shared by all blueprint documents. If two documents disagree, this file wins.

Working product name: **QuickCart** (placeholder; every visible name comes from tenant branding config).

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js 22 LTS + TypeScript 5 (strict), **Fastify 5** | Fast JSON throughput, schema-first routes, first-class TypeScript |
| Validation | **Zod**, with `fastify-type-provider-zod` (request/response) and `zod-to-openapi` | One schema → validation, types, OpenAPI |
| Primary DB | **PostgreSQL 16 + PostGIS 3.4** | Stock reservation needs ACID transactions and row locks; geofences need polygons |
| ORM / SQL | **Drizzle ORM** (typed SQL, raw PostGIS where needed), migrations with `drizzle-kit` | Close to SQL, no hidden queries, works with RLS |
| Tenant isolation | `tenant_id` on every tenant table + **PostgreSQL Row-Level Security**, set per transaction via `SET LOCAL app.tenant_id` | Isolation enforced by the database, not only by code |
| Cache / queues / locks | **Redis 7** + **BullMQ** | Feature-flag and config cache, rate limits, Socket.IO adapter, jobs, distributed locks |
| Search | **Meilisearch 1.x** (one index per tenant + locale, e.g. `products_<tenantSlug>_<locale>`) | Typo-tolerant, sub-50 ms; per-store stock/price filtering via filterable attributes |
| Realtime | **Socket.IO 4** with Redis adapter; rooms `t:{tenantId}:order:{orderId}`, `t:{tenantId}:store:{storeId}`, `t:{tenantId}:rider:{riderId}` | Order tracking, store queue, rider dispatch |
| Object storage | S3-compatible (AWS S3, MinIO, R2); keys `tenants/{tenantId}/...` | Product images, proof-of-delivery photos, branding |
| Mobile apps | **Flutter 3.24+** (Dart 3), Riverpod 2, go_router, one codebase with flavors `customer`, `store` (dark-store picker/manager), `rider` | Matches the existing Flutter apps in this repo |
| Web apps | React 18 + Vite + TypeScript + Tailwind (CSS-variable tokens) + TanStack Query: `admin-web` (super admin + tenant admin), `store-web` (dark-store dashboard) | Matches the existing panels |
| Maps / routing | Adapter interfaces: Google Maps / Mapbox for tiles + geocoding; **OSRM** (self-hosted) or Google Routes for ETAs and route optimization | No vendor lock-in |
| Payments | Adapter interface; built-in Stripe and Razorpay; tenant-scoped credentials | Multi-country |
| Push | Firebase Cloud Messaging (HTTP v1, service account per tenant) | |
| Observability | pino JSON logs, OpenTelemetry traces, Prometheus metrics | |

## 2. Money, time, ids

- Money is **`bigint` minor units + `char(3)` ISO 4217 currency** in every table (`amount_minor`, `currency`). Never floats. A `Money` value object in `packages/money`.
- Timestamps are `timestamptz` in UTC; local display uses the store's IANA time zone (`dark_stores.timezone`).
- Primary keys are **UUIDv7** (`uuid`, time-ordered, generated in the app).
- Every tenant table has `tenant_id uuid not null`, `created_at`, `updated_at`; soft-deletable tables have `deleted_at`.

## 3. Canonical entity names (snake_case tables)

Platform (no tenant_id): `installation`, `licenses`, `platform_users`, `tenants`, `tenant_domains`, `countries`, `currencies`, `fx_rates`, `languages`, `translation_keys`, `feature_definitions`.

Configuration: `feature_flag_rules` (scope: global | country | tenant | store | segment), `settings` (key/value per scope), `translations` (platform + tenant overrides), `tenant_secrets`.

Tax: `tax_jurisdictions`, `tax_categories`, `tax_rules`, `tax_rule_versions`, `order_tax_lines` (snapshot).

Identity: `users`, `user_addresses`, `roles`, `role_permissions`, `user_roles`, `devices` (push tokens), `sessions`.

Stores and logistics: `dark_stores`, `store_service_areas` (PostGIS polygon geofences), `store_hours`, `delivery_slots`, `riders`, `rider_shifts`, `rider_location_pings` (hot data in Redis, history partitioned by day), `dispatch_offers`, `deliveries`, `proofs_of_delivery`.

Catalog and inventory: `brands`, `categories` (tree, `path` ltree), `products`, `product_variants` (the sellable SKU), `product_media`, `product_substitutes`, `store_prices` (price per variant per store), `inventory_items` (per store per SKU: `on_hand`, `reserved`, `low_stock_threshold`, `is_active`), `inventory_movements` (append-only ledger), `stock_reservations`.

Commerce: `carts`, `cart_items` (`substitution_preference`: `none | best_match | specific`), `orders`, `order_items`, `order_substitutions`, `order_events` (append-only status history), `pick_tasks`, `coupons`, `coupon_redemptions`, `promotions`, `home_layouts`, `layout_sections`, `banners`.

Money: `payments`, `refunds`, `wallet_accounts`, `ledger_entries` (double-entry, immutable), `commission_rules`, `settlements`, `payouts`.

Ops: `notifications`, `notification_templates`, `audit_logs` (append-only, hash-chained), `outbox_events`.

## 4. Order lifecycle (canonical statuses)

`pending_payment → placed → accepted → picking → packed → assigned → picked_up → arriving → delivered`
Side exits: `cancelled` (customer/system/admin), `rejected` (store), `failed_delivery`, `returned`.
Every transition writes `order_events` and an `outbox_events` row in the same transaction.

## 5. Feature flags (canonical keys, partial list)

`checkout.tipping`, `checkout.wallet`, `checkout.cod`, `checkout.scheduled_orders`, `checkout.store_pickup`, `payments.stripe`, `payments.razorpay`, `cart.substitutions`, `catalog.age_restricted_items`, `delivery.signature_pod`, `delivery.otp_pod`, `delivery.photo_pod`, `dispatch.auto_assign`, `dispatch.batching`, `search.typo_tolerance`, `home.recommendations`, `referral.program`, `support.in_app_chat`.

Resolution precedence (most specific wins): **user segment → store → tenant → country → global → definition default**. A global **kill switch** (`force_off`) overrides everything below it.

## 6. API conventions

- REST under `/api/v1`, OpenAPI 3.1 generated from Zod. Mobile clients send `X-App: customer|store|rider` and `X-App-Version`.
- Tenant resolved from Host (`{slug}.platform.tld` or custom domain), or `X-Tenant` for mobile builds pinned to a tenant; must match the JWT `tid` claim.
- Errors: `{ error: { code: 'inventory.insufficient_stock', message, details } }` where `code` is also a translation key.
- Idempotency: `Idempotency-Key` header required on order placement, payments and refunds.

## 7. Monorepo root

```
quickcart/
  apps/api  apps/worker  apps/admin-web  apps/store-web  apps/installer  apps/mobile
  packages/{config,money,i18n,design-tokens,api-client,ui-web,region-packs,eslint-config}
  infra/{docker,helm,ci}  migrations/  docs/  tools/
```

## 8. Writing rules for the blueprint

- State clearly what is a design decision vs. an example value. Example values are configuration, never code.
- Code samples must be correct, complete for what they show (no `TODO`), and consistent with the names above.
- No emoji. Professional tone. Prefer tables and concrete schemas over prose.
- This is a blueprint: do not claim that any of it already exists or has been tested.
