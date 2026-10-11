# 05 — Complete module code structure

**Pillar 5 of the QuickCart blueprint.**
**Status:** blueprint. The tree and code below define how the code base is to be organized and written. None of it exists yet as a running system. The TypeScript samples in this document were type-checked in isolation (`tsc --strict --noUncheckedIndexedAccess`) against TypeScript 5.6, drizzle-orm 0.36, Fastify 5.1, fastify-type-provider-zod 4, Zod 3.23 and stripe-node 17.4, with minimal stubs for referenced sibling files (other schema tables, `@quickcart/money`, the permission catalog); the unit test in section 11.2 was run against the sample entity. That check covers syntax and types only, not runtime behavior against real services. Samples are the reference for implementation.
**Governing file:** `00-CONTRACT.md` (stack, names, statuses, flag keys, monorepo root). Architecture and flows: `01-ARCHITECTURE.md`. Table DDL: `02-DATA-SCHEMAS.md`. Flag/settings/tax/i18n engines: `03-CONFIG-FLAGS-TAX.md`. Design tokens: `04-DESIGN-SYSTEM.md`. Environment schema, Docker and indexes: `06-INSTALLER-DEPLOYMENT.md`.

---

## Table of contents

1. Structural principles
2. Monorepo tree
3. `apps/api` tree
4. The inventory module, fully expanded, with code
5. Integration adapters
6. Dependency rules and enforcement
7. `apps/worker`
8. Web front ends (`admin-web`, `store-web`)
9. Flutter app (`apps/mobile`)
10. `packages/*`
11. Testing layout
12. Naming conventions

---

## 1. Structural principles

| # | Principle | Consequence in the tree |
|---|---|---|
| P1 | Modular monolith, one bounded context per module | `apps/api/src/modules/<module>/` with a single public entry `index.ts` |
| P2 | Clean architecture inside each module | `domain/` (pure TypeScript) ← `application/` (use cases, ports) ← `infrastructure/` and `interfaces/` (frameworks). Arrows point inward only. |
| P3 | Kernel without business logic | `src/core/` holds tenancy, config, flags, i18n, money, security, errors, events/outbox, observability, db. It never imports a module. |
| P4 | Vendors behind ports | `src/integrations/<capability>/` defines cross-module ports (routing, maps, push, storage, SMS, email, search index) and their adapters. Module-specific ports (for example `PaymentGateway`) live in the owning module. |
| P5 | One schema source per boundary | Zod schemas in `interfaces/http/schemas/` drive validation, types and OpenAPI; Drizzle table definitions in `src/core/db/schema/` drive SQL types and `drizzle-kit` migrations (authoritative DDL and policies: `02-DATA-SCHEMAS.md`). |
| P6 | The worker reuses module code | `apps/worker` imports module `jobs/` processors through each module's `index.ts`; it has no business logic of its own. |
| P7 | Generated clients | Web apps and Flutter use clients generated from the OpenAPI document produced by `apps/api` (`packages/api-client` for TypeScript; `apps/mobile/packages/qc_api` for Dart). |

---

## 2. Monorepo tree

Root as fixed by contract section 7. Package manager: pnpm workspaces; task runner: Turborepo. Flutter is managed with its own tooling under `apps/mobile` (melos for its internal packages).

```
quickcart/
├── package.json                      workspace scripts (lint, typecheck, test, build, openapi:generate)
├── pnpm-workspace.yaml               apps/*, packages/* (excluding apps/mobile)
├── turbo.json                        pipeline: build -> typecheck -> test; caching by inputs
├── tsconfig.base.json                strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes=false, ES2023, NodeNext
├── .dependency-cruiser.cjs           architecture rules (section 6)
├── .editorconfig
├── .nvmrc                            22
├── apps/
│   ├── api/                          Fastify modular monolith (section 3)
│   ├── worker/                       BullMQ processors and schedulers (section 7)
│   ├── admin-web/                    React: super admin + tenant admin (section 8)
│   ├── store-web/                    React: dark-store dashboard (section 8)
│   ├── installer/                    First-run wizard (owned by 06-INSTALLER-DEPLOYMENT.md)
│   └── mobile/                       Flutter: flavors customer, store, rider (section 9)
├── packages/
│   ├── config/                       settings + flag catalogs, permission catalog (Zod)
│   ├── money/                        Money value object, currency table, allocation
│   ├── i18n/                         translation key catalog, source strings, ICU helpers
│   ├── design-tokens/                token source (JSON) -> CSS variables, TS, Dart
│   ├── api-client/                   generated TypeScript client + TanStack Query hooks
│   ├── ui-web/                       React component library on design tokens
│   ├── region-packs/                 country packs (tax seeds, synonyms, formats)
│   └── eslint-config/                shared ESLint flat config
├── infra/
│   ├── docker/                       Dockerfiles, compose files (06-INSTALLER-DEPLOYMENT.md)
│   ├── helm/                         Kubernetes chart
│   └── ci/                           pipelines: lint, typecheck, depcruise, tests, images, mobile builds
├── migrations/                       drizzle-kit SQL migrations + hand-written SQL (RLS, triggers, PostGIS)
│   ├── 0000_extensions.sql           postgis, ltree, pgcrypto, btree_gist
│   ├── 0001_platform.sql ...
│   └── meta/                         drizzle-kit journal
├── docs/                             generated OpenAPI, ADRs, runbooks
│   ├── adr/                          architecture decision records (NNNN-title.md)
│   └── openapi/openapi.json          generated, committed for client generation
└── tools/
    ├── openapi-export/               boots api in "spec only" mode, writes docs/openapi/openapi.json
    ├── i18n-check/                   verifies every error code and UI key has a source string
    ├── token-build/                  runs Style Dictionary for packages/design-tokens
    ├── tenant-isolation-gen/         generates per-route isolation tests from the route table
    └── prototype-import/             one-time import from quickcommerce-backend (01-ARCHITECTURE.md section 14)
```

---

## 3. `apps/api` tree

### 3.1 Top level

```
apps/api/
├── package.json
├── tsconfig.json                     paths: @core/* -> src/core/*, @integrations/* -> src/integrations/*, @modules/* -> src/modules/*
├── drizzle.config.ts                 schema: src/core/db/schema/index.ts, out: ../../migrations
├── vitest.config.ts                  projects: unit, integration, isolation, contract
├── src/
│   ├── main.ts
│   ├── bootstrap/
│   ├── core/
│   ├── integrations/
│   └── modules/
└── test/                             cross-module suites (section 11)
```

### 3.2 `src/main.ts` and `src/bootstrap/`

```
src/
├── main.ts                           entry: loadEnv -> buildContainer -> buildServer -> listen; signal handling
└── bootstrap/
    ├── env.ts                        Zod schema of process.env (variables listed in 06-INSTALLER-DEPLOYMENT.md)
    ├── container.ts                  composition root: creates db, redis, adapters, and every module via its factory
    ├── server.ts                     Fastify instance: type provider, plugins, hooks, error handler, route registration
    ├── plugins.ts                    @fastify/helmet, @fastify/cors (tenant domains), @fastify/rate-limit (Redis), @fastify/sensible
    ├── openapi.ts                    zod-to-openapi registry -> /api/v1/openapi.json (+ spec-only mode for tools/openapi-export)
    ├── socket.ts                     Socket.IO server, Redis adapter, auth middleware, module ws gateways
    ├── module-registry.ts            ordered list of module factories; each returns { routes, wsGateways, jobs }
    ├── health.ts                     /health/live, /health/ready (db, redis, meilisearch checks)
    └── shutdown.ts                   graceful close: stop accepting, drain sockets, close pools
```

```ts
// apps/api/src/main.ts
import { loadEnv } from './bootstrap/env.js';
import { buildContainer } from './bootstrap/container.js';
import { buildServer } from './bootstrap/server.js';
import { registerShutdown } from './bootstrap/shutdown.js';

async function main(): Promise<void> {
  const env = loadEnv(process.env);
  const container = await buildContainer(env);
  const server = await buildServer(container);
  registerShutdown(server, container);
  await server.listen({ host: env.API_HOST, port: env.API_PORT });
}

main().catch((error: unknown) => {
  // Logger may not exist yet if env loading failed; write a structured line to stderr.
  process.stderr.write(`${JSON.stringify({ level: 'fatal', msg: 'api failed to start', error: String(error) })}\n`);
  process.exit(1);
});
```

### 3.3 `src/core/`

```
src/core/
├── kernel/
│   ├── clock.ts                      Clock port + SystemClock
│   ├── ids.ts                        IdGenerator port + UuidV7Generator (uuid v7)
│   └── result.ts                     small helpers (assertNever, nonEmpty)
├── tenancy/
│   ├── tenant-context.ts             TenantContext type { id, slug, countryCode, defaultLocale, currency, status }
│   ├── tenant-resolver.ts            Host / X-Tenant -> tenant (Redis cache, tenants + tenant_domains)
│   ├── tenancy.hook.ts               onRequest hook: resolve tenant, reject suspended, compare JWT tid
│   └── tenant-als.ts                 AsyncLocalStorage for tenant context (logging, jobs)
├── config/
│   ├── settings.service.ts           typed settings resolver (scopes per 03-CONFIG-FLAGS-TAX.md)
│   ├── settings.cache.ts             Redis + in-process LRU, invalidated via pub/sub
│   └── secrets.service.ts            tenant_secrets envelope decryption (KMS / master key)
├── flags/
│   ├── flag-evaluator.ts             precedence: segment -> store -> tenant -> country -> global -> default, force_off
│   ├── flag.cache.ts
│   └── flags.hook.ts                 request.flags(key) helper bound to tenant/store/segment
├── i18n/
│   ├── translator.ts                 ICU MessageFormat, tenant overrides, fallback chain
│   └── i18n.hook.ts                  request.t(), locale negotiation
├── money/
│   └── index.ts                      re-export of @quickcart/money (Money, currencyExponent)
├── security/
│   ├── jwt.ts                        ES256 sign/verify, JWKS, kid rotation
│   ├── authenticate.hook.ts          onRequest: verify token unless route config.public
│   ├── authorize.hook.ts             preHandler: enforce route config.permission via role_permissions cache
│   ├── permissions.ts                Permission union type re-exported from @quickcart/config
│   ├── idempotency.hook.ts           preHandler/onSend: route config.idempotency, Redis store
│   ├── rate-limit.ts                 key generators per route group
│   ├── pii-crypto.ts                 AES-256-GCM field encryption + HMAC blind index
│   └── audit-log.writer.ts           hash-chained audit_logs insert (advisory lock per chain)
├── http/
│   ├── fastify-augmentation.ts       declaration merging for FastifyRequest / FastifyContextConfig
│   └── error-response.schema.ts      shared Zod schema of the error envelope
├── errors/
│   ├── domain-error.ts               DomainError base + generic errors
│   └── http-error-handler.ts         DomainError / validation / unknown -> { error: { code, message, details } }
├── events/
│   ├── outbox/
│   │   ├── outbox-writer.ts          OutboxWriter port + OutboxEventInput
│   │   ├── drizzle-outbox-writer.ts  insert into outbox_events within the current transaction
│   │   └── outbox-relay.ts           worker-side relay: FOR UPDATE SKIP LOCKED -> BullMQ / Redis pub/sub
│   ├── event-bus.ts                  typed in-process subscription registry used by the relay consumers
│   └── processed-events.ts           consumer idempotency (Redis SET NX with TTL)
├── observability/
│   ├── logger.ts                     pino with redaction paths
│   ├── tracing.ts                    OpenTelemetry SDK (http, pg, ioredis, fastify instrumentations)
│   └── metrics.ts                    prom-client registry, HTTP histograms, queue gauges
├── db/
│   ├── client.ts                     pg Pool + Drizzle instance, Database/Transaction types
│   ├── tenant-transaction.ts         withTenantTransaction (SET LOCAL app.tenant_id, ambient join)
│   ├── platform-transaction.ts       withPlatformReader (qc_platform_reader, read replica, audited)
│   └── schema/
│       ├── index.ts                  re-exports all table definitions (drizzle-kit input)
│       ├── platform.ts               installation, licenses, platform_users, tenants, tenant_domains, countries, currencies, fx_rates, languages, translation_keys, feature_definitions
│       ├── config.ts                 feature_flag_rules, settings, translations, tenant_secrets
│       ├── tax.ts                    tax_jurisdictions, tax_categories, tax_rules, tax_rule_versions, order_tax_lines
│       ├── identity.ts               users, user_addresses, roles, role_permissions, user_roles, devices, sessions
│       ├── stores.ts                 dark_stores, store_service_areas (PostGIS custom type), store_hours, delivery_slots
│       ├── logistics.ts              riders, rider_shifts, rider_location_pings, dispatch_offers, deliveries, proofs_of_delivery
│       ├── catalog.ts                brands, categories (ltree custom type), products, product_variants, product_media, product_substitutes, store_prices
│       ├── inventory.ts              inventory_items, inventory_movements, stock_reservations
│       ├── commerce.ts               carts, cart_items, orders, order_items, order_substitutions, order_events, pick_tasks, coupons, coupon_redemptions, promotions
│       ├── content.ts                home_layouts, layout_sections, banners
│       ├── money.ts                  payments, refunds, wallet_accounts, ledger_entries, commission_rules, settlements, payouts
│       ├── ops.ts                    notifications, notification_templates, audit_logs, outbox_events
│       └── custom-types.ts           geometry(MultiPolygon/Point, 4326), ltree, citext column helpers
└── testing/
    └── fixtures.ts                   builders shared by unit tests (no infrastructure imports)
```

### 3.4 `src/integrations/` (cross-module vendor ports)

```
src/integrations/
├── routing/
│   ├── routing-provider.ts           RoutingProvider port (section 5.3)
│   ├── routing.errors.ts
│   ├── routing.factory.ts            per tenant/region selection, haversine fallback wrapper
│   └── adapters/
│       ├── osrm.routing-provider.ts
│       ├── google-routes.routing-provider.ts
│       ├── mapbox.routing-provider.ts
│       └── haversine.routing-provider.ts    degraded fallback (distance / settings speed)
├── maps/
│   ├── maps-provider.ts              geocode, reverseGeocode, autocomplete, placeDetails
│   ├── maps.factory.ts
│   └── adapters/{google.maps-provider.ts, mapbox.maps-provider.ts}
├── push/
│   ├── push-sender.ts                PushSender port
│   ├── push.factory.ts               per-tenant FCM service account from tenant_secrets
│   └── adapters/fcm.push-sender.ts   FCM HTTP v1 (OAuth2 service-account JWT, token cache)
├── storage/
│   ├── storage-provider.ts           presignPut, presignGet, putObject, deleteObject, headObject
│   ├── storage.factory.ts            enforces key prefix tenants/{tenantId}/
│   └── adapters/s3.storage-provider.ts   AWS SDK v3; works with S3, MinIO, R2 (endpoint + forcePathStyle)
├── sms/
│   ├── sms-provider.ts
│   └── adapters/{twilio.sms-provider.ts, msg91.sms-provider.ts, log.sms-provider.ts}   log adapter: development only
├── email/
│   ├── email-provider.ts
│   └── adapters/{smtp.email-provider.ts, ses.email-provider.ts, log.email-provider.ts}
└── search/
    ├── search-index.ts               SearchIndex port (index naming products_<tenantSlug>_<locale>)
    └── adapters/meilisearch.search-index.ts
```

### 3.5 `src/modules/` — module list

Every module follows the same template (3.6). Responsibility and main tables:

| Module | Responsibility | Owns tables (writes) | Public API highlights (`index.ts`) |
|---|---|---|---|
| `identity` | OTP and password login, sessions, refresh rotation, users, addresses, roles, devices | `users`, `user_addresses`, `roles`, `role_permissions`, `user_roles`, `devices`, `sessions`, `platform_users` | `IdentityPublicApi.getUserSummary`, `resolvePermissions` |
| `tenancy` | Tenant provisioning, domains, branding, plans, tenant secrets UI | `tenants`, `tenant_domains`, `tenant_secrets` | `provisionTenant`, `getTenantBranding` |
| `catalog` | Brands, categories, products, variants, media, substitutes, collections | `brands`, `categories`, `products`, `product_variants`, `product_media`, `product_substitutes` | `getVariants`, `rankSubstitutes` |
| `search` | Query API, index document building, synonyms, trending, recent | none (Meilisearch, Redis) | `reindexTenant`, `onAvailabilityChanged` |
| `inventory` | Stock levels, movements ledger, reservations, thresholds, toggles | `inventory_items`, `inventory_movements`, `stock_reservations` | `reserveStockForCart`, `commitReservationsForOrder`, `consumeReservationsForOrder`, `releaseReservations` |
| `stores` | Dark stores, geofences, hours, slots, serviceability, throttling | `dark_stores`, `store_service_areas`, `store_hours`, `delivery_slots` | `resolveServiceability`, `getStore` |
| `cart` | Carts, items, substitution preferences, soft stock checks | `carts`, `cart_items` | `getCartForCheckout`, `assertCartOwnedBy` |
| `checkout` | Quote, order placement orchestration (one transaction) | none (orchestrates) | `placeOrder` |
| `orders` | Order aggregate, state machine, order events, cancellation | `orders`, `order_items`, `order_events` | `transition`, `getOrder` |
| `fulfillment` | Auto-accept, pick tasks, substitutions during picking, packing, handoff | `pick_tasks`, `order_substitutions` | `createPickTasks` |
| `dispatch` | Candidate scoring, offers, cascade, batching, route optimization | `dispatch_offers` | `requestDispatch` |
| `delivery` | Shifts, rider status, location ingestion, ETA, POD, failed delivery | `riders`, `rider_shifts`, `rider_location_pings`, `deliveries`, `proofs_of_delivery` | `getActiveDeliveryForOrder` |
| `payments` | Payment intents, capture, void, refunds, webhooks, reconciliation | `payments`, `refunds` | `authorizeForOrder`, `captureFinalAmount`, `refund` |
| `wallet` | Accounts, double-entry journals, balances, top-ups, expiries | `wallet_accounts`, `ledger_entries` | `postJournal`, `getBalance` |
| `promotions` | Promotions, coupons, redemptions, eligibility | `promotions`, `coupons`, `coupon_redemptions` | `evaluate` |
| `pricing` | Store prices, fees (delivery, small cart, surge), quote composition | `store_prices` | `quoteLines`, `quoteFees` |
| `tax` | Tax computation and snapshots (engine defined in `03-CONFIG-FLAGS-TAX.md`) | `tax_jurisdictions`, `tax_categories`, `tax_rules`, `tax_rule_versions`, `order_tax_lines` | `computeTax`, `snapshotForOrder` |
| `notifications` | Templates, rendering, quiet hours, push/SMS/email, inbox | `notifications`, `notification_templates` | `notify` |
| `content` | Home layouts, sections, banners, hydration | `home_layouts`, `layout_sections`, `banners` | `resolveHomeLayout` |
| `settlements` | Commission rules, settlements, payouts | `commission_rules`, `settlements`, `payouts` | `runDailySettlement` |
| `reporting` | Dashboards, exports, cross-tenant metrics (platform reader role) | materialized views only | `getPlatformMetrics` |
| `audit` | Audit log queries, chain verification | `audit_logs` (writes go through `core/security/audit-log.writer.ts`) | `verifyChain` |
| `install` | First-run installation API used by `apps/installer` | `installation` | `getInstallState` |
| `licensing` | License validation, entitlements, seat limits | `licenses` | `assertEntitled` |

Configuration tables (`feature_flag_rules`, `settings`, `translations`, `feature_definitions`, `countries`, `currencies`, `fx_rates`, `languages`, `translation_keys`) are read by `core/config`, `core/flags` and `core/i18n`; their admin CRUD endpoints live in the `tenancy` module (tenant scope) and a `platform` sub-folder of `tenancy` (platform scope), following `03-CONFIG-FLAGS-TAX.md`.

### 3.6 Module template

```
src/modules/<module>/
├── index.ts                          public API: module factory, public types, event payload types. Nothing else is importable from outside.
├── <module>.module.ts                factory: wires repositories, adapters, use cases, routes, ws gateways, jobs
├── domain/
│   ├── entities/                     aggregates and entities with invariants (no I/O)
│   ├── value-objects/
│   ├── services/                     domain services (pure functions/classes)
│   ├── events/                       domain event types
│   ├── errors/                       typed DomainError subclasses (code = translation key)
│   └── repositories/                 repository interfaces (ports owned by the domain)
├── application/
│   ├── commands/                     use cases that change state (one class per file, execute())
│   ├── queries/                      read use cases (may use read-model ports)
│   ├── dto/                          input/output types of use cases (plain TS)
│   └── ports/                        non-repository ports: unit of work, other modules, policies, gateways
├── infrastructure/
│   ├── persistence/                  Drizzle repositories, unit of work, row <-> entity mappers
│   ├── adapters/                     implementations of application ports (other modules' public APIs, settings, vendors)
│   └── projections/                  Redis read models fed by events
├── interfaces/
│   ├── http/
│   │   ├── <module>.routes.ts        Fastify plugin(s): path, schema, config.permission, handler -> use case
│   │   └── schemas/                  Zod request/response schemas (also OpenAPI)
│   └── ws/
│       └── <module>.gateway.ts       Socket.IO emitters/handlers for this module's rooms and events
├── jobs/                             BullMQ processors and schedulers (run by apps/worker)
└── __tests__/
    ├── unit/                         domain + application with in-memory fakes
    └── integration/                  Drizzle repositories with testcontainers PostgreSQL
```

Rules (enforced in section 6): `domain` imports nothing outside itself except `@core/errors`, `@core/kernel` and `@quickcart/money`; `application` imports `domain`, `@core/*` ports and types, never frameworks; `infrastructure` and `interfaces` import anything allowed except other modules' internals; route handlers call use cases only.

---

## 4. The inventory module, fully expanded, with code

### 4.1 File tree (every file)

```
src/modules/inventory/
├── index.ts
├── inventory.module.ts
├── domain/
│   ├── entities/
│   │   ├── inventory-item.ts                     InventoryItem aggregate (reserve/release/commit/receive/adjust/toggle)
│   │   └── stock-reservation.ts                  StockReservation entity and status transitions
│   ├── value-objects/
│   │   ├── quantity.ts                           positive integer quantity
│   │   ├── stock-levels.ts                       { onHand, reserved, isActive } + available()
│   │   ├── reservation-status.ts                 'active' | 'committed' | 'consumed' | 'released' | 'expired'
│   │   └── movement-type.ts                      'receipt' | 'sale' | 'adjustment' | 'damage' | 'expiry' | 'return' | 'transfer_in' | 'transfer_out' | 'cycle_count'
│   ├── services/
│   │   ├── stock-threshold-evaluator.ts          low-stock and visibility crossings -> domain events
│   │   └── reservation-planner.ts                nets previous holds against requested lines, deterministic lock order
│   ├── events/
│   │   └── inventory-events.ts                   InventoryDomainEvent union
│   ├── errors/
│   │   └── inventory-errors.ts                   InsufficientStockError, InventoryItemInactiveError, ...
│   └── repositories/
│       ├── inventory.repository.ts
│       ├── stock-reservation.repository.ts
│       └── inventory-movement.repository.ts
├── application/
│   ├── commands/
│   │   ├── reserve-stock-for-cart.ts
│   │   ├── commit-reservations-for-order.ts      payment confirmed: active -> committed, expires_at = null
│   │   ├── consume-reservations-for-order.ts     pack confirmed: entity commit(), sale movements, committed -> consumed
│   │   ├── release-reservations.ts               cancel/reject/payment failure: active|committed -> released
│   │   ├── expire-reservation.ts                 TTL: active -> expired (after payments state check by caller)
│   │   ├── receive-stock.ts                      GRN: receipt movements
│   │   ├── adjust-stock.ts                       damage/expiry/adjustment, approval threshold
│   │   ├── record-cycle-count.ts
│   │   ├── toggle-inventory-item.ts              quick in/out-of-stock (is_active)
│   │   └── update-low-stock-threshold.ts
│   ├── queries/
│   │   ├── get-store-inventory.ts                paginated, filters: low_stock, out_of_stock, inactive, category
│   │   ├── get-availability.ts                   bulk availability for cart/search enrichment
│   │   ├── list-low-stock-items.ts
│   │   └── get-movement-history.ts
│   ├── dto/
│   │   ├── reservation.dto.ts
│   │   ├── stock-adjustment.dto.ts
│   │   └── inventory-view.dto.ts
│   └── ports/
│       ├── inventory-unit-of-work.ts             transaction scope with tx-bound repositories + outbox
│       ├── inventory-policy.provider.ts          settings needed by inventory (TTL, thresholds)
│       ├── cart-access.port.ts                   ownership/store check implemented via cart module
│       └── inventory-read-model.ts               queries port (Drizzle or replica)
├── infrastructure/
│   ├── persistence/
│   │   ├── drizzle-inventory.repository.ts
│   │   ├── drizzle-stock-reservation.repository.ts
│   │   ├── drizzle-inventory-movement.repository.ts
│   │   ├── drizzle-inventory-unit-of-work.ts
│   │   ├── drizzle-inventory-read-model.ts
│   │   └── mappers/inventory-item.mapper.ts
│   ├── adapters/
│   │   ├── settings-inventory-policy.provider.ts reads settings:inventory.*, settings:search.hide_below_available
│   │   └── cart-access.adapter.ts                calls @modules/cart index (assertCartOwnedBy)
│   └── projections/
│       └── redis-availability.projector.ts       HSET t:{tenantId}:store:{storeId}:avail
├── interfaces/
│   ├── http/
│   │   ├── inventory.routes.ts                   registers the plugins below under /api/v1
│   │   ├── reservation.routes.ts                 POST /stores/:storeId/inventory/reservations
│   │   ├── store-inventory.routes.ts             GET/PATCH /stores/:storeId/inventory[/...]
│   │   ├── stock-movement.routes.ts              POST receipts, adjustments, cycle counts; GET movements
│   │   └── schemas/
│   │       ├── reservation.schemas.ts
│   │       ├── store-inventory.schemas.ts
│   │       └── stock-movement.schemas.ts
│   └── ws/
│       └── inventory.gateway.ts                  Redis channel t:{tenantId}:store:{storeId}:inventory -> room t:{tenantId}:store:{storeId}
├── jobs/
│   ├── reservation-expiry.processor.ts           queue reservation-expiry
│   ├── reservation-sweeper.scheduler.ts          every 60 s, FOR UPDATE SKIP LOCKED safety net
│   ├── availability-projector.consumer.ts        inventory.stock_changed -> Redis avail hash
│   ├── low-stock-alert.consumer.ts               inventory.low_stock -> notifications.notify
│   ├── auto-threshold.scheduler.ts               nightly threshold computation (settings:inventory.auto_threshold)
│   └── ledger-reconciliation.scheduler.ts        nightly: on_hand == sum(movements), reserved == sum(active+committed)
└── __tests__/
    ├── unit/
    │   ├── inventory-item.spec.ts
    │   ├── quantity.spec.ts
    │   ├── reservation-planner.spec.ts
    │   ├── stock-threshold-evaluator.spec.ts
    │   └── reserve-stock-for-cart.spec.ts        in-memory unit of work
    └── integration/
        ├── drizzle-inventory.repository.int.spec.ts
        ├── reserve-stock-for-cart.int.spec.ts
        ├── concurrent-reservation.int.spec.ts    N parallel carts on the last units; asserts no oversell
        └── inventory-rls.int.spec.ts             tenant A cannot read/update tenant B rows
```

**Naming note on "commit".** The `InventoryItem.commit()` method finalizes reserved units as a sale when the order is packed (it decrements `on_hand` and `reserved`); the reservation row moves to `consumed`. The reservation status `committed` (payment confirmed, no TTL) does not touch `inventory_items`. See the lifecycle in `01-ARCHITECTURE.md` section 5.3.

### 4.2 Core errors used by every module

```ts
// apps/api/src/core/errors/domain-error.ts
export type ErrorDetails = Readonly<Record<string, unknown>>;

/**
 * Base class of every expected, typed failure. `code` is both the API error code
 * and the translation key (contract section 6).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details: ErrorDetails;

  protected constructor(message: string, details: ErrorDetails = {}) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'auth.forbidden';
  readonly httpStatus = 403;

  constructor(details: ErrorDetails = {}) {
    super('Forbidden', details);
  }
}

export class NotFoundError extends DomainError {
  readonly code: string;
  readonly httpStatus = 404;

  constructor(code: string, details: ErrorDetails = {}) {
    super(`Not found: ${code}`, details);
    this.code = code;
  }
}

/** Programming error: work for tenant B attempted inside a transaction bound to tenant A. */
export class TenantMismatchError extends DomainError {
  readonly code = 'tenancy.mismatch';
  readonly httpStatus = 500;

  constructor(expectedTenantId: string, actualTenantId: string) {
    super('Tenant mismatch inside transaction', { expectedTenantId, actualTenantId });
  }
}
```

```ts
// apps/api/src/core/kernel/clock.ts
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };
```

```ts
// apps/api/src/core/kernel/ids.ts
import { v7 as uuidv7 } from 'uuid';

export interface IdGenerator {
  next(): string;
}

export const uuidV7Generator: IdGenerator = { next: () => uuidv7() };
```

### 4.3 Domain layer

```ts
// apps/api/src/modules/inventory/domain/errors/inventory-errors.ts
import { DomainError } from '@core/errors/domain-error.js';

export interface StockShortage {
  readonly variantId: string;
  readonly requested: number;
  readonly available: number;
}

export class InvalidQuantityError extends DomainError {
  readonly code = 'inventory.invalid_quantity';
  readonly httpStatus = 422;

  constructor(value: number) {
    super(`Quantity must be a positive safe integer, got ${value}`, { value });
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = 'inventory.insufficient_stock';
  readonly httpStatus = 409;

  constructor(
    readonly storeId: string,
    readonly shortages: readonly StockShortage[],
  ) {
    super(`Insufficient stock for ${shortages.length} line(s)`, { storeId, shortages });
  }
}

export class InventoryItemInactiveError extends DomainError {
  readonly code = 'inventory.item_inactive';
  readonly httpStatus = 409;

  constructor(storeId: string, variantId: string) {
    super('Inventory item is not active', { storeId, variantId });
  }
}

export class ReservationUnderflowError extends DomainError {
  readonly code = 'inventory.reservation_underflow';
  readonly httpStatus = 409;

  constructor(storeId: string, variantId: string, quantity: number) {
    super('Cannot release or commit more than is reserved', { storeId, variantId, quantity });
  }
}

export class StockInvariantViolationError extends DomainError {
  readonly code = 'inventory.invariant_violation';
  readonly httpStatus = 409;

  constructor(reason: string, details: Readonly<Record<string, unknown>>) {
    super(`Inventory invariant violated: ${reason}`, { reason, ...details });
  }
}

export class EmptyReservationError extends DomainError {
  readonly code = 'inventory.empty_reservation';
  readonly httpStatus = 422;

  constructor() {
    super('A reservation needs at least one line');
  }
}
```

```ts
// apps/api/src/modules/inventory/domain/value-objects/quantity.ts
import { InvalidQuantityError } from '../errors/inventory-errors.js';

/**
 * A strictly positive integer number of stock units. Weighted goods are stocked
 * in their base unit (for example grams), so quantities stay integral.
 */
export class Quantity {
  private constructor(readonly value: number) {}

  static of(value: number): Quantity {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new InvalidQuantityError(value);
    }
    return new Quantity(value);
  }

  plus(other: Quantity): Quantity {
    return Quantity.of(this.value + other.value);
  }
}
```

```ts
// apps/api/src/modules/inventory/domain/value-objects/stock-levels.ts
export interface StockLevels {
  readonly onHand: number;
  readonly reserved: number;
  readonly isActive: boolean;
}

export function availableOf(levels: StockLevels): number {
  return levels.onHand - levels.reserved;
}
```

```ts
// apps/api/src/modules/inventory/domain/events/inventory-events.ts
import type { StockLevels } from '../value-objects/stock-levels.js';

interface InventoryEventBase {
  readonly tenantId: string;
  readonly storeId: string;
  readonly variantId: string;
  readonly inventoryItemId: string;
  /** ISO-8601 UTC; events are JSON-serializable because they are stored in outbox_events.payload. */
  readonly occurredAt: string;
}

export interface StockChangedEvent extends InventoryEventBase {
  readonly type: 'inventory.stock_changed';
  readonly before: StockLevels;
  readonly after: StockLevels;
}

export interface LowStockEvent extends InventoryEventBase {
  readonly type: 'inventory.low_stock';
  readonly available: number;
  readonly threshold: number;
}

export interface LowStockClearedEvent extends InventoryEventBase {
  readonly type: 'inventory.low_stock_cleared';
  readonly available: number;
  readonly threshold: number;
}

export interface AvailabilityChangedEvent extends InventoryEventBase {
  readonly type: 'inventory.availability_changed';
  readonly visible: boolean;
}

export type InventoryDomainEvent =
  | StockChangedEvent
  | LowStockEvent
  | LowStockClearedEvent
  | AvailabilityChangedEvent;
```

```ts
// apps/api/src/modules/inventory/domain/services/stock-threshold-evaluator.ts
import type { InventoryDomainEvent } from '../events/inventory-events.js';
import { availableOf, type StockLevels } from '../value-objects/stock-levels.js';

export interface ThresholdPolicy {
  /** A variant is hidden in a store when available <= hideBelowAvailable (settings:search.hide_below_available). */
  readonly hideBelowAvailable: number;
  /** Units above the threshold needed before a low-stock alert clears. */
  readonly lowStockHysteresis: number;
}

export interface StockTransition {
  readonly tenantId: string;
  readonly storeId: string;
  readonly variantId: string;
  readonly inventoryItemId: string;
  readonly lowStockThreshold: number;
  readonly before: StockLevels;
  readonly after: StockLevels;
}

/** Pure domain service: turns one stock transition into the events it implies. */
export class StockThresholdEvaluator {
  evaluate(
    transition: StockTransition,
    policy: ThresholdPolicy,
    occurredAt: string,
  ): InventoryDomainEvent[] {
    const base = {
      tenantId: transition.tenantId,
      storeId: transition.storeId,
      variantId: transition.variantId,
      inventoryItemId: transition.inventoryItemId,
      occurredAt,
    };
    const events: InventoryDomainEvent[] = [
      { ...base, type: 'inventory.stock_changed', before: transition.before, after: transition.after },
    ];

    const availableBefore = availableOf(transition.before);
    const availableAfter = availableOf(transition.after);
    const threshold = transition.lowStockThreshold;
    const clearLevel = threshold + policy.lowStockHysteresis;

    if (availableBefore > threshold && availableAfter <= threshold) {
      events.push({ ...base, type: 'inventory.low_stock', available: availableAfter, threshold });
    } else if (availableBefore <= clearLevel && availableAfter > clearLevel) {
      events.push({ ...base, type: 'inventory.low_stock_cleared', available: availableAfter, threshold });
    }

    const visibleBefore = transition.before.isActive && availableBefore > policy.hideBelowAvailable;
    const visibleAfter = transition.after.isActive && availableAfter > policy.hideBelowAvailable;
    if (visibleBefore !== visibleAfter) {
      events.push({ ...base, type: 'inventory.availability_changed', visible: visibleAfter });
    }

    return events;
  }
}
```

```ts
// apps/api/src/modules/inventory/domain/entities/inventory-item.ts
import {
  InsufficientStockError,
  InventoryItemInactiveError,
  ReservationUnderflowError,
  StockInvariantViolationError,
} from '../errors/inventory-errors.js';
import type { Quantity } from '../value-objects/quantity.js';
import { availableOf, type StockLevels } from '../value-objects/stock-levels.js';

export interface InventoryItemProps {
  readonly id: string;
  readonly tenantId: string;
  readonly storeId: string;
  readonly variantId: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly lowStockThreshold: number;
  readonly isActive: boolean;
  readonly binCode: string | null;
  readonly pickSequence: number | null;
}

export interface RecordedStockChange {
  readonly before: StockLevels;
  readonly after: StockLevels;
  /** Signed change of on_hand; non-zero only for physical movements (receipt, sale, adjustment, ...). */
  readonly onHandDelta: number;
}

/**
 * Aggregate root for one SKU in one dark store.
 *
 * Invariants (mirrored by CHECK constraints in 02-DATA-SCHEMAS.md):
 *   I1 onHand >= 0          I2 reserved >= 0          I3 reserved <= onHand
 *   I4 lowStockThreshold >= 0, all values are safe integers
 *
 * The checkout hot path does not load this entity: it reserves with a single
 * conditional UPDATE that enforces the same rules in SQL (section 4.7). The entity
 * is used for every other mutation (receipts, adjustments, packing, cycle counts)
 * after loading the row with SELECT ... FOR UPDATE, and a property-based test
 * asserts that the SQL path and the entity accept and reject the same inputs.
 */
export class InventoryItem {
  private props: InventoryItemProps;
  private changes: RecordedStockChange[] = [];

  private constructor(props: InventoryItemProps) {
    InventoryItem.assertInvariants(props);
    this.props = props;
  }

  static rehydrate(props: InventoryItemProps): InventoryItem {
    return new InventoryItem({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get levels(): StockLevels {
    return { onHand: this.props.onHand, reserved: this.props.reserved, isActive: this.props.isActive };
  }

  get available(): number {
    return availableOf(this.levels);
  }

  get lowStockThreshold(): number {
    return this.props.lowStockThreshold;
  }

  get isLowStock(): boolean {
    return this.available <= this.props.lowStockThreshold;
  }

  toProps(): InventoryItemProps {
    return { ...this.props };
  }

  /** Holds units for a cart or order. */
  reserve(quantity: Quantity): void {
    if (!this.props.isActive) {
      throw new InventoryItemInactiveError(this.props.storeId, this.props.variantId);
    }
    if (quantity.value > this.available) {
      throw new InsufficientStockError(this.props.storeId, [
        { variantId: this.props.variantId, requested: quantity.value, available: this.available },
      ]);
    }
    this.apply({ reserved: this.props.reserved + quantity.value }, 0);
  }

  /** Returns held units to availability (expiry, cancellation, rejected substitution). */
  release(quantity: Quantity): void {
    if (quantity.value > this.props.reserved) {
      throw new ReservationUnderflowError(this.props.storeId, this.props.variantId, quantity.value);
    }
    this.apply({ reserved: this.props.reserved - quantity.value }, 0);
  }

  /**
   * Converts reserved units into a sale when the order is packed.
   * `reservedQuantity` is what the order held; `pickedQuantity` is what physically left
   * the shelf (short picks release the difference).
   */
  commit(reservedQuantity: Quantity, pickedQuantity: number): void {
    if (reservedQuantity.value > this.props.reserved) {
      throw new ReservationUnderflowError(this.props.storeId, this.props.variantId, reservedQuantity.value);
    }
    if (!Number.isSafeInteger(pickedQuantity) || pickedQuantity < 0 || pickedQuantity > reservedQuantity.value) {
      throw new StockInvariantViolationError('picked quantity out of range', {
        variantId: this.props.variantId,
        pickedQuantity,
        reservedQuantity: reservedQuantity.value,
      });
    }
    this.apply(
      {
        onHand: this.props.onHand - pickedQuantity,
        reserved: this.props.reserved - reservedQuantity.value,
      },
      -pickedQuantity,
    );
  }

  /** Goods received (GRN) or returned to shelf. */
  receive(quantity: Quantity): void {
    this.apply({ onHand: this.props.onHand + quantity.value }, quantity.value);
  }

  /**
   * Signed correction (damage, expiry, cycle count). Units held by reservations cannot be
   * written off; the caller must first release or substitute the affected order lines.
   */
  adjust(delta: number): void {
    if (!Number.isSafeInteger(delta) || delta === 0) {
      throw new StockInvariantViolationError('adjustment must be a non-zero integer', { delta });
    }
    const onHand = this.props.onHand + delta;
    if (onHand < this.props.reserved) {
      throw new StockInvariantViolationError('adjustment would leave reserved units without stock', {
        variantId: this.props.variantId,
        onHand,
        reserved: this.props.reserved,
      });
    }
    this.apply({ onHand }, delta);
  }

  setActive(isActive: boolean): void {
    if (isActive === this.props.isActive) return;
    this.apply({ isActive }, 0);
  }

  setLowStockThreshold(threshold: number): void {
    if (!Number.isSafeInteger(threshold) || threshold < 0) {
      throw new StockInvariantViolationError('threshold must be a non-negative integer', { threshold });
    }
    this.props = { ...this.props, lowStockThreshold: threshold };
  }

  /** Returns and clears the changes recorded since the last call (for movements and events). */
  pullChanges(): RecordedStockChange[] {
    const recorded = this.changes;
    this.changes = [];
    return recorded;
  }

  private apply(patch: Partial<Pick<InventoryItemProps, 'onHand' | 'reserved' | 'isActive'>>, onHandDelta: number): void {
    const before = this.levels;
    const next: InventoryItemProps = { ...this.props, ...patch };
    InventoryItem.assertInvariants(next);
    this.props = next;
    this.changes.push({ before, after: this.levels, onHandDelta });
  }

  private static assertInvariants(p: InventoryItemProps): void {
    const integers = [p.onHand, p.reserved, p.lowStockThreshold].every((n) => Number.isSafeInteger(n));
    if (!integers) {
      throw new StockInvariantViolationError('non-integer stock value', { inventoryItemId: p.id });
    }
    if (p.onHand < 0) {
      throw new StockInvariantViolationError('on_hand < 0', { inventoryItemId: p.id, onHand: p.onHand });
    }
    if (p.reserved < 0) {
      throw new StockInvariantViolationError('reserved < 0', { inventoryItemId: p.id, reserved: p.reserved });
    }
    if (p.reserved > p.onHand) {
      throw new StockInvariantViolationError('reserved > on_hand', {
        inventoryItemId: p.id,
        onHand: p.onHand,
        reserved: p.reserved,
      });
    }
    if (p.lowStockThreshold < 0) {
      throw new StockInvariantViolationError('low_stock_threshold < 0', { inventoryItemId: p.id });
    }
  }
}
```

```ts
// apps/api/src/modules/inventory/domain/services/reservation-planner.ts
import { EmptyReservationError } from '../errors/inventory-errors.js';
import { Quantity } from '../value-objects/quantity.js';

export interface RequestedLine {
  readonly variantId: string;
  readonly quantity: Quantity;
}

export interface HeldReservation {
  readonly storeId: string;
  readonly variantId: string;
  readonly quantity: number;
}

export interface PlanStep {
  readonly storeId: string;
  readonly variantId: string;
  readonly previous: number;
  readonly requested: number;
  /** requested - previous: > 0 reserve more, < 0 release, 0 no-op. */
  readonly delta: number;
}

/** Merges duplicate variant lines and validates quantities. */
export function normalizeRequestedLines(
  lines: ReadonlyArray<{ readonly variantId: string; readonly quantity: number }>,
): RequestedLine[] {
  if (lines.length === 0) throw new EmptyReservationError();
  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + line.quantity);
  }
  return [...merged.entries()].map(([variantId, quantity]) => ({ variantId, quantity: Quantity.of(quantity) }));
}

/**
 * Computes per-(store, variant) deltas between what a cart already holds and what it now
 * requests. Steps are sorted by (storeId, variantId) so every transaction locks
 * inventory_items rows in the same global order, which prevents deadlocks.
 */
export class ReservationPlanner {
  plan(previous: readonly HeldReservation[], storeId: string, requested: readonly RequestedLine[]): PlanStep[] {
    const acc = new Map<string, { storeId: string; variantId: string; previous: number; requested: number }>();
    const entry = (s: string, v: string) => {
      const key = `${s}|${v}`;
      let found = acc.get(key);
      if (!found) {
        found = { storeId: s, variantId: v, previous: 0, requested: 0 };
        acc.set(key, found);
      }
      return found;
    };

    for (const held of previous) entry(held.storeId, held.variantId).previous += held.quantity;
    for (const line of requested) entry(storeId, line.variantId).requested += line.quantity.value;

    return [...acc.values()]
      .map((s) => ({ ...s, delta: s.requested - s.previous }))
      .sort((a, b) => compare(a.storeId, b.storeId) || compare(a.variantId, b.variantId));
  }
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
```

```ts
// apps/api/src/modules/inventory/domain/repositories/inventory.repository.ts
import type { InventoryItem } from '../entities/inventory-item.js';
import type { Quantity } from '../value-objects/quantity.js';

export interface StockKey {
  readonly storeId: string;
  readonly variantId: string;
}

/** Row state returned by atomic stock statements (values AFTER the statement). */
export interface StockRow {
  readonly inventoryItemId: string;
  readonly variantId: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly lowStockThreshold: number;
  readonly isActive: boolean;
}

/**
 * Repository bound to one tenant transaction (obtained from InventoryUnitOfWork).
 * tryReserve/release are atomic, race-free statements; they return null when the
 * guard condition fails instead of throwing, so the caller can collect all shortages.
 */
export interface InventoryRepository {
  tryReserve(key: StockKey, quantity: Quantity): Promise<StockRow | null>;
  release(key: StockKey, quantity: Quantity): Promise<StockRow | null>;
  findForUpdate(key: StockKey): Promise<InventoryItem | null>;
  findAvailability(storeId: string, variantIds: readonly string[]): Promise<ReadonlyMap<string, number>>;
  save(item: InventoryItem): Promise<void>;
}
```

```ts
// apps/api/src/modules/inventory/domain/repositories/stock-reservation.repository.ts
export interface NewStockReservation {
  readonly id: string;
  readonly storeId: string;
  readonly variantId: string;
  readonly cartId: string;
  readonly orderId: string | null;
  readonly quantity: number;
  readonly expiresAt: Date;
}

export interface ReleasedReservation {
  readonly id: string;
  readonly storeId: string;
  readonly variantId: string;
  readonly quantity: number;
}

export interface StockReservationRepository {
  insertMany(reservations: readonly NewStockReservation[]): Promise<void>;
  /** Marks every active reservation of the cart as released and returns them. */
  releaseActiveForCart(cartId: string): Promise<ReleasedReservation[]>;
}
```

### 4.4 Application ports

```ts
// apps/api/src/modules/inventory/application/ports/inventory-unit-of-work.ts
import type { OutboxWriter } from '@core/events/outbox/outbox-writer.js';
import type { InventoryRepository } from '../../domain/repositories/inventory.repository.js';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository.js';

export interface InventoryTxScope {
  readonly inventory: InventoryRepository;
  readonly reservations: StockReservationRepository;
  readonly outbox: OutboxWriter;
}

/**
 * Runs work in one tenant-scoped transaction. If the caller is already inside a
 * transaction for the same tenant (for example checkout's PlaceOrder), the work
 * joins it, so order creation and reservation commit or roll back together.
 */
export interface InventoryUnitOfWork {
  run<T>(tenantId: string, work: (scope: InventoryTxScope) => Promise<T>): Promise<T>;
}
```

```ts
// apps/api/src/modules/inventory/application/ports/inventory-policy.provider.ts
import type { ThresholdPolicy } from '../../domain/services/stock-threshold-evaluator.js';

export interface InventoryPolicy extends ThresholdPolicy {
  /** settings:inventory.reservation_ttl_s */
  readonly reservationTtlSeconds: number;
}

export interface InventoryPolicyProvider {
  forStore(tenantId: string, storeId: string): Promise<InventoryPolicy>;
}
```

```ts
// apps/api/src/modules/inventory/application/ports/cart-access.port.ts
export interface CartAccessPort {
  /** Throws ForbiddenError unless the cart belongs to the actor, is active and is bound to the store. */
  assertCanReserve(input: {
    readonly tenantId: string;
    readonly cartId: string;
    readonly storeId: string;
    readonly actorUserId: string;
  }): Promise<void>;
}
```

```ts
// apps/api/src/core/events/outbox/outbox-writer.ts
export interface OutboxEventInput {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface OutboxWriter {
  enqueueMany(events: readonly OutboxEventInput[]): Promise<void>;
}
```

### 4.5 Use case `ReserveStockForCart`

```ts
// apps/api/src/modules/inventory/application/dto/reservation.dto.ts
export interface ReserveStockForCartCommand {
  readonly tenantId: string;
  readonly storeId: string;
  readonly cartId: string;
  readonly actorUserId: string;
  /** Null for a checkout pre-hold; set when called from PlaceOrder inside the order transaction. */
  readonly orderId: string | null;
  readonly lines: ReadonlyArray<{ readonly variantId: string; readonly quantity: number }>;
}

export interface ReservedLine {
  readonly reservationId: string;
  readonly variantId: string;
  readonly quantity: number;
}

export interface ReserveStockForCartResult {
  readonly reservations: readonly ReservedLine[];
  readonly expiresAt: Date;
}
```

```ts
// apps/api/src/modules/inventory/application/commands/reserve-stock-for-cart.ts
import type { Clock } from '@core/kernel/clock.js';
import type { IdGenerator } from '@core/kernel/ids.js';
import type { OutboxEventInput } from '@core/events/outbox/outbox-writer.js';
import {
  InsufficientStockError,
  ReservationUnderflowError,
  type StockShortage,
} from '../../domain/errors/inventory-errors.js';
import type { InventoryDomainEvent } from '../../domain/events/inventory-events.js';
import type { StockRow } from '../../domain/repositories/inventory.repository.js';
import type { NewStockReservation } from '../../domain/repositories/stock-reservation.repository.js';
import { normalizeRequestedLines, type ReservationPlanner } from '../../domain/services/reservation-planner.js';
import type { StockThresholdEvaluator, ThresholdPolicy } from '../../domain/services/stock-threshold-evaluator.js';
import { Quantity } from '../../domain/value-objects/quantity.js';
import type { ReserveStockForCartCommand, ReserveStockForCartResult } from '../dto/reservation.dto.js';
import type { CartAccessPort } from '../ports/cart-access.port.js';
import type { InventoryPolicyProvider } from '../ports/inventory-policy.provider.js';
import type { InventoryUnitOfWork } from '../ports/inventory-unit-of-work.js';

export interface ReserveStockForCartDeps {
  readonly uow: InventoryUnitOfWork;
  readonly cartAccess: CartAccessPort;
  readonly policy: InventoryPolicyProvider;
  readonly planner: ReservationPlanner;
  readonly evaluator: StockThresholdEvaluator;
  readonly ids: IdGenerator;
  readonly clock: Clock;
}

/**
 * Reserves stock for every line of a cart, all-or-nothing, in one tenant transaction.
 * Re-running it for the same cart nets against the cart's previous holds, so the
 * checkout pre-hold and the order placement call are both safe.
 */
export class ReserveStockForCart {
  constructor(private readonly deps: ReserveStockForCartDeps) {}

  async execute(command: ReserveStockForCartCommand): Promise<ReserveStockForCartResult> {
    const requested = normalizeRequestedLines(command.lines);

    await this.deps.cartAccess.assertCanReserve({
      tenantId: command.tenantId,
      cartId: command.cartId,
      storeId: command.storeId,
      actorUserId: command.actorUserId,
    });

    const policy = await this.deps.policy.forStore(command.tenantId, command.storeId);
    const now = this.deps.clock.now();
    const occurredAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + policy.reservationTtlSeconds * 1000);

    return this.deps.uow.run(command.tenantId, async (scope) => {
      const previous = await scope.reservations.releaseActiveForCart(command.cartId);
      const steps = this.deps.planner.plan(previous, command.storeId, requested);

      const shortages: Array<{ variantId: string; requested: number }> = [];
      const events: InventoryDomainEvent[] = [];

      for (const step of steps) {
        if (step.delta === 0) continue;
        const key = { storeId: step.storeId, variantId: step.variantId };

        if (step.delta > 0) {
          const row = await scope.inventory.tryReserve(key, Quantity.of(step.delta));
          if (row === null) {
            shortages.push({ variantId: step.variantId, requested: step.requested });
            continue;
          }
          events.push(...this.transitionEvents(command.tenantId, step.storeId, row, step.delta, policy, occurredAt));
        } else {
          const releaseQty = -step.delta;
          const row = await scope.inventory.release(key, Quantity.of(releaseQty));
          if (row === null) {
            throw new ReservationUnderflowError(step.storeId, step.variantId, releaseQty);
          }
          events.push(...this.transitionEvents(command.tenantId, step.storeId, row, step.delta, policy, occurredAt));
        }
      }

      if (shortages.length > 0) {
        const available = await scope.inventory.findAvailability(
          command.storeId,
          shortages.map((s) => s.variantId),
        );
        const detailed: StockShortage[] = shortages.map((s) => ({
          variantId: s.variantId,
          requested: s.requested,
          available: Math.max(0, available.get(s.variantId) ?? 0),
        }));
        // Throwing rolls back the whole transaction, including releases and partial reserves.
        throw new InsufficientStockError(command.storeId, detailed);
      }

      const reservations: NewStockReservation[] = requested.map((line) => ({
        id: this.deps.ids.next(),
        storeId: command.storeId,
        variantId: line.variantId,
        cartId: command.cartId,
        orderId: command.orderId,
        quantity: line.quantity.value,
        expiresAt,
      }));
      await scope.reservations.insertMany(reservations);

      const outbox: OutboxEventInput[] = events.map((event) => ({
        aggregateType: 'inventory_item',
        aggregateId: event.inventoryItemId,
        eventType: event.type,
        payload: { ...event },
      }));
      outbox.push({
        aggregateType: 'cart',
        aggregateId: command.cartId,
        eventType: 'inventory.stock_reserved',
        payload: {
          tenantId: command.tenantId,
          storeId: command.storeId,
          cartId: command.cartId,
          orderId: command.orderId,
          reservationIds: reservations.map((r) => r.id),
          expiresAt: expiresAt.toISOString(),
          occurredAt,
        },
      });
      await scope.outbox.enqueueMany(outbox);

      return {
        reservations: reservations.map((r) => ({ reservationId: r.id, variantId: r.variantId, quantity: r.quantity })),
        expiresAt,
      };
    });
  }

  /** Rebuilds before/after levels from the post-statement row and the applied reserved delta. */
  private transitionEvents(
    tenantId: string,
    storeId: string,
    row: StockRow,
    reservedDelta: number,
    policy: ThresholdPolicy,
    occurredAt: string,
  ): InventoryDomainEvent[] {
    return this.deps.evaluator.evaluate(
      {
        tenantId,
        storeId,
        variantId: row.variantId,
        inventoryItemId: row.inventoryItemId,
        lowStockThreshold: row.lowStockThreshold,
        before: { onHand: row.onHand, reserved: row.reserved - reservedDelta, isActive: row.isActive },
        after: { onHand: row.onHand, reserved: row.reserved, isActive: row.isActive },
      },
      policy,
      occurredAt,
    );
  }
}
```

The `reservation-expiry` delayed job is not scheduled here: the outbox consumer of `inventory.stock_reserved` schedules it at `expiresAt` (no queue call inside the transaction).

### 4.6 Tenant transaction in `core/db`

```ts
// apps/api/src/core/db/client.ts
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export interface DatabaseHandle {
  readonly db: Database;
  readonly pool: pg.Pool;
}

export function createDatabase(connectionString: string, maxConnections: number): DatabaseHandle {
  const pool = new pg.Pool({ connectionString, max: maxConnections, application_name: 'quickcart-api' });
  return { db: drizzle(pool, { schema }), pool };
}
```

```ts
// apps/api/src/core/db/tenant-transaction.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { TenantMismatchError } from '../errors/domain-error.js';
import type { Database, Transaction } from './client.js';

interface AmbientTransaction {
  readonly tx: Transaction;
  readonly tenantId: string;
}

const ambient = new AsyncLocalStorage<AmbientTransaction>();

export interface TenantTransactionOptions {
  /** Applied only when this call opens the transaction (ignored when joining). */
  readonly lockTimeoutMs?: number;
  readonly statementTimeoutMs?: number;
}

/**
 * Runs `work` in a transaction where RLS sees only `tenantId`.
 *
 * `set_config('app.tenant_id', $1, true)` is the parameterized form of
 * `SET LOCAL app.tenant_id = ...` (SET does not accept bind parameters). The value
 * is reset at COMMIT/ROLLBACK, so a pooled connection never leaks a tenant.
 *
 * Nested calls for the same tenant join the open transaction (one atomic unit across
 * modules); a nested call for another tenant is a programming error.
 */
export async function withTenantTransaction<T>(
  db: Database,
  tenantId: string,
  work: (tx: Transaction) => Promise<T>,
  options: TenantTransactionOptions = {},
): Promise<T> {
  const current = ambient.getStore();
  if (current) {
    if (current.tenantId !== tenantId) throw new TenantMismatchError(current.tenantId, tenantId);
    return work(current.tx);
  }

  return db.transaction(
    async (tx) => {
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
      if (options.lockTimeoutMs !== undefined) {
        await tx.execute(sql`select set_config('lock_timeout', ${`${options.lockTimeoutMs}ms`}, true)`);
      }
      if (options.statementTimeoutMs !== undefined) {
        await tx.execute(sql`select set_config('statement_timeout', ${`${options.statementTimeoutMs}ms`}, true)`);
      }
      return ambient.run({ tx, tenantId }, () => work(tx));
    },
    { isolationLevel: 'read committed' },
  );
}
```

### 4.7 Drizzle schema and repositories

The Drizzle definitions mirror the DDL of `02-DATA-SCHEMAS.md`; RLS policies, triggers and partitioning are hand-written SQL in `migrations/`.

```ts
// apps/api/src/core/db/schema/inventory.ts
import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { productVariants } from './catalog.js';
import { carts, orders } from './commerce.js';
import { darkStores } from './stores.js';

export const stockReservationStatus = pgEnum('stock_reservation_status', [
  'active',
  'committed',
  'consumed',
  'released',
  'expired',
]);

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    storeId: uuid('store_id').notNull().references(() => darkStores.id),
    variantId: uuid('variant_id').notNull().references(() => productVariants.id),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    binCode: text('bin_code'),
    pickSequence: integer('pick_sequence'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('inventory_items_tenant_store_variant_uq').on(t.tenantId, t.storeId, t.variantId),
    index('inventory_items_tenant_variant_idx').on(t.tenantId, t.variantId),
    check('inventory_items_on_hand_nonneg', sql`${t.onHand} >= 0`),
    check('inventory_items_reserved_nonneg', sql`${t.reserved} >= 0`),
    check('inventory_items_reserved_le_on_hand', sql`${t.reserved} <= ${t.onHand}`),
    check('inventory_items_threshold_nonneg', sql`${t.lowStockThreshold} >= 0`),
  ],
);

export const stockReservations = pgTable(
  'stock_reservations',
  {
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    storeId: uuid('store_id').notNull().references(() => darkStores.id),
    variantId: uuid('variant_id').notNull().references(() => productVariants.id),
    cartId: uuid('cart_id').references(() => carts.id),
    orderId: uuid('order_id').references(() => orders.id),
    quantity: integer('quantity').notNull(),
    status: stockReservationStatus('status').notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('stock_reservations_cart_active_idx').on(t.tenantId, t.cartId).where(sql`${t.status} = 'active'`),
    index('stock_reservations_order_idx').on(t.tenantId, t.orderId),
    index('stock_reservations_expiry_idx').on(t.expiresAt).where(sql`${t.status} = 'active'`),
    check('stock_reservations_quantity_pos', sql`${t.quantity} > 0`),
  ],
);
```

```ts
// apps/api/src/modules/inventory/infrastructure/persistence/drizzle-inventory.repository.ts
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Transaction } from '@core/db/client.js';
import { inventoryItems } from '@core/db/schema/inventory.js';
import { InventoryItem } from '../../domain/entities/inventory-item.js';
import type { InventoryRepository, StockKey, StockRow } from '../../domain/repositories/inventory.repository.js';
import type { Quantity } from '../../domain/value-objects/quantity.js';

const stockRowColumns = {
  inventoryItemId: inventoryItems.id,
  variantId: inventoryItems.variantId,
  onHand: inventoryItems.onHand,
  reserved: inventoryItems.reserved,
  lowStockThreshold: inventoryItems.lowStockThreshold,
  isActive: inventoryItems.isActive,
};

export class DrizzleInventoryRepository implements InventoryRepository {
  constructor(
    private readonly tx: Transaction,
    private readonly tenantId: string,
  ) {}

  /**
   * UPDATE inventory_items SET reserved = reserved + $q
   *  WHERE tenant_id = $t AND store_id = $s AND variant_id = $v
   *    AND is_active AND on_hand - reserved >= $q
   * RETURNING ...
   * Row lock + guard + write in one statement; READ COMMITTED re-checks the guard
   * against the latest row version after waiting for a concurrent writer.
   */
  async tryReserve(key: StockKey, quantity: Quantity): Promise<StockRow | null> {
    const rows = await this.tx
      .update(inventoryItems)
      .set({
        reserved: sql`${inventoryItems.reserved} + ${quantity.value}`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(inventoryItems.tenantId, this.tenantId),
          eq(inventoryItems.storeId, key.storeId),
          eq(inventoryItems.variantId, key.variantId),
          eq(inventoryItems.isActive, true),
          sql`${inventoryItems.onHand} - ${inventoryItems.reserved} >= ${quantity.value}`,
        ),
      )
      .returning(stockRowColumns);
    return rows[0] ?? null;
  }

  async release(key: StockKey, quantity: Quantity): Promise<StockRow | null> {
    const rows = await this.tx
      .update(inventoryItems)
      .set({
        reserved: sql`${inventoryItems.reserved} - ${quantity.value}`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(inventoryItems.tenantId, this.tenantId),
          eq(inventoryItems.storeId, key.storeId),
          eq(inventoryItems.variantId, key.variantId),
          sql`${inventoryItems.reserved} >= ${quantity.value}`,
        ),
      )
      .returning(stockRowColumns);
    return rows[0] ?? null;
  }

  async findForUpdate(key: StockKey): Promise<InventoryItem | null> {
    const rows = await this.tx
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.tenantId, this.tenantId),
          eq(inventoryItems.storeId, key.storeId),
          eq(inventoryItems.variantId, key.variantId),
        ),
      )
      .for('update');
    const row = rows[0];
    if (!row) return null;
    return InventoryItem.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      storeId: row.storeId,
      variantId: row.variantId,
      onHand: row.onHand,
      reserved: row.reserved,
      lowStockThreshold: row.lowStockThreshold,
      isActive: row.isActive,
      binCode: row.binCode,
      pickSequence: row.pickSequence,
    });
  }

  async findAvailability(storeId: string, variantIds: readonly string[]): Promise<ReadonlyMap<string, number>> {
    if (variantIds.length === 0) return new Map();
    const rows = await this.tx
      .select({
        variantId: inventoryItems.variantId,
        available: sql<number>`case when ${inventoryItems.isActive} then ${inventoryItems.onHand} - ${inventoryItems.reserved} else 0 end`.mapWith(Number),
      })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.tenantId, this.tenantId),
          eq(inventoryItems.storeId, storeId),
          inArray(inventoryItems.variantId, [...variantIds]),
        ),
      );
    return new Map(rows.map((r) => [r.variantId, r.available]));
  }

  async save(item: InventoryItem): Promise<void> {
    const p = item.toProps();
    await this.tx
      .update(inventoryItems)
      .set({
        onHand: p.onHand,
        reserved: p.reserved,
        lowStockThreshold: p.lowStockThreshold,
        isActive: p.isActive,
        binCode: p.binCode,
        pickSequence: p.pickSequence,
        updatedAt: sql`now()`,
      })
      .where(and(eq(inventoryItems.tenantId, this.tenantId), eq(inventoryItems.id, p.id)));
  }
}
```

```ts
// apps/api/src/modules/inventory/infrastructure/persistence/drizzle-stock-reservation.repository.ts
import { and, eq, sql } from 'drizzle-orm';
import type { Transaction } from '@core/db/client.js';
import { stockReservations } from '@core/db/schema/inventory.js';
import type {
  NewStockReservation,
  ReleasedReservation,
  StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository.js';

export class DrizzleStockReservationRepository implements StockReservationRepository {
  constructor(
    private readonly tx: Transaction,
    private readonly tenantId: string,
  ) {}

  async insertMany(reservations: readonly NewStockReservation[]): Promise<void> {
    if (reservations.length === 0) return;
    await this.tx.insert(stockReservations).values(
      reservations.map((r) => ({
        id: r.id,
        tenantId: this.tenantId,
        storeId: r.storeId,
        variantId: r.variantId,
        cartId: r.cartId,
        orderId: r.orderId,
        quantity: r.quantity,
        status: 'active' as const,
        expiresAt: r.expiresAt,
      })),
    );
  }

  async releaseActiveForCart(cartId: string): Promise<ReleasedReservation[]> {
    return await this.tx
      .update(stockReservations)
      .set({ status: 'released', releasedAt: sql`now()`, updatedAt: sql`now()` })
      .where(
        and(
          eq(stockReservations.tenantId, this.tenantId),
          eq(stockReservations.cartId, cartId),
          eq(stockReservations.status, 'active'),
        ),
      )
      .returning({
        id: stockReservations.id,
        storeId: stockReservations.storeId,
        variantId: stockReservations.variantId,
        quantity: stockReservations.quantity,
      });
  }
}
```

```ts
// apps/api/src/core/events/outbox/drizzle-outbox-writer.ts
import type { Transaction } from '../../db/client.js';
import { outboxEvents } from '../../db/schema/ops.js';
import type { IdGenerator } from '../../kernel/ids.js';
import type { OutboxEventInput, OutboxWriter } from './outbox-writer.js';

export class DrizzleOutboxWriter implements OutboxWriter {
  constructor(
    private readonly tx: Transaction,
    private readonly tenantId: string,
    private readonly ids: IdGenerator,
  ) {}

  async enqueueMany(events: readonly OutboxEventInput[]): Promise<void> {
    if (events.length === 0) return;
    await this.tx.insert(outboxEvents).values(
      events.map((e) => ({
        id: this.ids.next(),
        tenantId: this.tenantId,
        aggregateType: e.aggregateType,
        aggregateId: e.aggregateId,
        eventType: e.eventType,
        payload: e.payload,
      })),
    );
  }
}
```

```ts
// apps/api/src/modules/inventory/infrastructure/persistence/drizzle-inventory-unit-of-work.ts
import type { Database } from '@core/db/client.js';
import { withTenantTransaction } from '@core/db/tenant-transaction.js';
import { DrizzleOutboxWriter } from '@core/events/outbox/drizzle-outbox-writer.js';
import type { IdGenerator } from '@core/kernel/ids.js';
import type { InventoryTxScope, InventoryUnitOfWork } from '../../application/ports/inventory-unit-of-work.js';
import { DrizzleInventoryRepository } from './drizzle-inventory.repository.js';
import { DrizzleStockReservationRepository } from './drizzle-stock-reservation.repository.js';

/** Fixed infrastructure bounds for checkout-path transactions (01-ARCHITECTURE.md section 9.1). */
const LOCK_TIMEOUT_MS = 500;
const STATEMENT_TIMEOUT_MS = 2000;

export class DrizzleInventoryUnitOfWork implements InventoryUnitOfWork {
  constructor(
    private readonly db: Database,
    private readonly ids: IdGenerator,
  ) {}

  run<T>(tenantId: string, work: (scope: InventoryTxScope) => Promise<T>): Promise<T> {
    return withTenantTransaction(
      this.db,
      tenantId,
      (tx) =>
        work({
          inventory: new DrizzleInventoryRepository(tx, tenantId),
          reservations: new DrizzleStockReservationRepository(tx, tenantId),
          outbox: new DrizzleOutboxWriter(tx, tenantId, this.ids),
        }),
      { lockTimeoutMs: LOCK_TIMEOUT_MS, statementTimeoutMs: STATEMENT_TIMEOUT_MS },
    );
  }
}
```

A `lock_timeout` breach raises PostgreSQL error `55P03`; `core/errors/http-error-handler.ts` maps it (by `code` on the driver error) to `503 inventory.busy` with `Retry-After: 1`, as specified in `01-ARCHITECTURE.md` section 9.1.

### 4.8 HTTP interface: Fastify route with Zod

```ts
// apps/api/src/core/http/fastify-augmentation.ts
import type { Permission } from '@quickcart/config/permissions';
import type { TenantContext } from '../tenancy/tenant-context.js';

export interface AuthContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly app: 'customer' | 'store' | 'rider' | 'admin' | 'store-web';
  readonly roles: readonly string[];
  readonly storeIds: readonly string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    tenant: TenantContext;
    auth: AuthContext;
    t(key: string, params?: Readonly<Record<string, unknown>>): string;
  }

  interface FastifyContextConfig {
    /** Route needs no authentication (catalog browse, webhooks). */
    public?: boolean;
    /** Enforced by core/security/authorize.hook.ts before the handler runs. */
    permission?: Permission;
    /** Enforced by core/security/idempotency.hook.ts (Idempotency-Key header). */
    idempotency?: 'required' | 'optional';
  }
}
```

```ts
// apps/api/src/core/http/error-response.schema.ts
import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
  }),
});
```

```ts
// apps/api/src/modules/inventory/interfaces/http/schemas/reservation.schemas.ts
import { z } from 'zod';

export const ReservationParamsSchema = z.object({
  storeId: z.string().uuid(),
});

export const ReservationHeadersSchema = z.object({
  'idempotency-key': z.string().uuid(),
});

export const ReserveStockBodySchema = z.object({
  cartId: z.string().uuid(),
  lines: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(200),
});

export const ReserveStockResponseSchema = z.object({
  reservations: z.array(
    z.object({
      reservationId: z.string().uuid(),
      variantId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ),
  expiresAt: z.string().datetime(),
});

export type ReserveStockBody = z.infer<typeof ReserveStockBodySchema>;
```

```ts
// apps/api/src/modules/inventory/interfaces/http/reservation.routes.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ErrorResponseSchema } from '@core/http/error-response.schema.js';
import type { ReserveStockForCart } from '../../application/commands/reserve-stock-for-cart.js';
import {
  ReservationHeadersSchema,
  ReservationParamsSchema,
  ReserveStockBodySchema,
  ReserveStockResponseSchema,
} from './schemas/reservation.schemas.js';

export interface ReservationRoutesOptions {
  readonly reserveStockForCart: ReserveStockForCart;
}

/** Mounted under the /api/v1 prefix that bootstrap/server.ts applies to every module's routes. */
export const reservationRoutes: FastifyPluginAsyncZod<ReservationRoutesOptions> = async (app, opts) => {
  app.post(
    '/stores/:storeId/inventory/reservations',
    {
      config: { permission: 'checkout.place_order', idempotency: 'required' },
      schema: {
        tags: ['inventory'],
        operationId: 'reserveStockForCart',
        summary: 'Hold stock for the lines of a cart (checkout pre-hold)',
        params: ReservationParamsSchema,
        headers: ReservationHeadersSchema,
        body: ReserveStockBodySchema,
        response: {
          201: ReserveStockResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
          422: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await opts.reserveStockForCart.execute({
        tenantId: request.tenant.id,
        storeId: request.params.storeId,
        cartId: request.body.cartId,
        actorUserId: request.auth.userId,
        orderId: null,
        lines: request.body.lines,
      });

      return reply.code(201).send({
        reservations: result.reservations.map((r) => ({ ...r })),
        expiresAt: result.expiresAt.toISOString(),
      });
    },
  );
};
```

### 4.9 Typed domain error mapped to HTTP

```ts
// apps/api/src/core/errors/http-error-handler.ts
import type { FastifyError, FastifyInstance } from 'fastify';
import { DomainError } from './domain-error.js';

const PG_LOCK_NOT_AVAILABLE = '55P03';
const PG_QUERY_CANCELED = '57014';

function isPgBusy(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  const code = (error as { code: unknown }).code;
  return code === PG_LOCK_NOT_AVAILABLE || code === PG_QUERY_CANCELED;
}

/**
 * Single mapping point from failures to the contract error envelope:
 *   { error: { code, message, details } }  where code is also the translation key.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof DomainError) {
      if (error.httpStatus >= 500) request.log.error({ err: error }, error.code);
      return reply.code(error.httpStatus).send({
        error: { code: error.code, message: request.t(error.code, error.details), details: error.details },
      });
    }

    if (error.validation) {
      const code = 'common.validation_failed';
      return reply.code(400).send({
        error: {
          code,
          message: request.t(code),
          details: { context: error.validationContext ?? 'body', issues: error.validation },
        },
      });
    }

    if (isPgBusy(error)) {
      const code = 'inventory.busy';
      return reply.header('Retry-After', '1').code(503).send({
        error: { code, message: request.t(code), details: {} },
      });
    }

    const status = typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500
      ? error.statusCode
      : 500;
    if (status === 500) request.log.error({ err: error }, 'unhandled error');
    const code = status === 500 ? 'common.internal_error' : 'common.request_error';
    return reply.code(status).send({ error: { code, message: request.t(code), details: {} } });
  });
}
```

Example response for the use case above when two lines are short:

```json
{
  "error": {
    "code": "inventory.insufficient_stock",
    "message": "Some items are no longer available in the quantity you selected.",
    "details": {
      "storeId": "0192f1e0-7c1a-7f3e-9a51-2a7c1e0f4b11",
      "shortages": [
        { "variantId": "0192f1e3-1b2c-7d4e-8f60-0a1b2c3d4e5f", "requested": 3, "available": 1 },
        { "variantId": "0192f1e3-9f8e-7d6c-8b5a-4c3d2e1f0a9b", "requested": 1, "available": 0 }
      ]
    }
  }
}
```

### 4.10 Module factory and public API

```ts
// apps/api/src/modules/inventory/inventory.module.ts
import type { FastifyPluginAsync } from 'fastify';
import type { Database } from '@core/db/client.js';
import type { Clock } from '@core/kernel/clock.js';
import type { IdGenerator } from '@core/kernel/ids.js';
import { ReserveStockForCart } from './application/commands/reserve-stock-for-cart.js';
import type { CartAccessPort } from './application/ports/cart-access.port.js';
import type { InventoryPolicyProvider } from './application/ports/inventory-policy.provider.js';
import { ReservationPlanner } from './domain/services/reservation-planner.js';
import { StockThresholdEvaluator } from './domain/services/stock-threshold-evaluator.js';
import { DrizzleInventoryUnitOfWork } from './infrastructure/persistence/drizzle-inventory-unit-of-work.js';
import { reservationRoutes } from './interfaces/http/reservation.routes.js';

export interface InventoryModuleDeps {
  readonly db: Database;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly policy: InventoryPolicyProvider;
  readonly cartAccess: CartAccessPort;
}

export interface InventoryModule {
  readonly name: 'inventory';
  readonly routes: FastifyPluginAsync;
  readonly api: {
    readonly reserveStockForCart: ReserveStockForCart;
  };
}

export function createInventoryModule(deps: InventoryModuleDeps): InventoryModule {
  const reserveStockForCart = new ReserveStockForCart({
    uow: new DrizzleInventoryUnitOfWork(deps.db, deps.ids),
    cartAccess: deps.cartAccess,
    policy: deps.policy,
    planner: new ReservationPlanner(),
    evaluator: new StockThresholdEvaluator(),
    ids: deps.ids,
    clock: deps.clock,
  });

  const routes: FastifyPluginAsync = async (app) => {
    await app.register(reservationRoutes, { reserveStockForCart });
  };

  return { name: 'inventory', routes, api: { reserveStockForCart } };
}
```

```ts
// apps/api/src/modules/inventory/index.ts
export { createInventoryModule } from './inventory.module.js';
export type { InventoryModule, InventoryModuleDeps } from './inventory.module.js';
export type { ReserveStockForCartCommand, ReserveStockForCartResult } from './application/dto/reservation.dto.js';
export type { InventoryDomainEvent } from './domain/events/inventory-events.js';
export { InsufficientStockError } from './domain/errors/inventory-errors.js';
```

The full module factory additionally wires the remaining commands, queries, `store-inventory.routes.ts`, `stock-movement.routes.ts`, the ws gateway and job processors in the same way; the excerpt shows the reservation path end to end.

---

## 5. Integration adapters

### 5.1 Layout and ownership

| Port | Location of interface | Adapters (file) | Credentials | Contract tests |
|---|---|---|---|---|
| `PaymentGateway` | `modules/payments/application/ports/payment-gateway.ts` | `modules/payments/infrastructure/gateways/stripe/stripe.payment-gateway.ts`, `.../razorpay/razorpay.payment-gateway.ts` | `tenant_secrets` (`stripe`, `razorpay`) via `payment-gateway.factory.ts`, client cached per tenant + key version | `modules/payments/__tests__/contract/payment-gateway.contract.ts` run against each adapter (sandbox keys in CI secrets, recorded fixtures offline) |
| `PushSender` | `integrations/push/push-sender.ts` | `integrations/push/adapters/fcm.push-sender.ts` | FCM service account JSON per tenant | `integrations/push/__tests__/push-sender.contract.ts` |
| `MapsProvider` | `integrations/maps/maps-provider.ts` | `google.maps-provider.ts`, `mapbox.maps-provider.ts` | per tenant API key | contract suite with recorded HTTP fixtures |
| `RoutingProvider` | `integrations/routing/routing-provider.ts` | `osrm.routing-provider.ts`, `google-routes.routing-provider.ts`, `mapbox.routing-provider.ts`, `haversine.routing-provider.ts` | OSRM URLs per region (env); vendor keys per tenant | OSRM contract test against a small OSRM container (Monaco extract) |
| `StorageProvider` | `integrations/storage/storage-provider.ts` | `s3.storage-provider.ts` | platform bucket (env) or tenant bucket | MinIO testcontainer |
| `SmsProvider` | `integrations/sms/sms-provider.ts` | `twilio.sms-provider.ts`, `msg91.sms-provider.ts`, `log.sms-provider.ts` | per tenant | recorded fixtures |
| `EmailProvider` | `integrations/email/email-provider.ts` | `smtp.email-provider.ts`, `ses.email-provider.ts`, `log.email-provider.ts` | per tenant | MailHog/Mailpit container |
| `SearchIndex` | `integrations/search/search-index.ts` | `meilisearch.search-index.ts` | platform Meilisearch master key (env), per-tenant indexes | Meilisearch testcontainer |

Payments adapter folder:

```
modules/payments/
├── application/ports/payment-gateway.ts
├── domain/errors/payment-errors.ts
└── infrastructure/gateways/
    ├── payment-gateway.factory.ts          (tenantId, provider) -> PaymentGateway; checks flag payments.<provider>
    ├── stripe/
    │   ├── stripe.payment-gateway.ts
    │   ├── stripe.mappers.ts               (inlined below for completeness)
    │   └── stripe.credentials.ts
    └── razorpay/
        ├── razorpay.payment-gateway.ts     orders API + payments capture/refund, HMAC-SHA256 webhook verification
        └── razorpay.credentials.ts
```

### 5.2 `PaymentGateway` interface

```ts
// apps/api/src/modules/payments/application/ports/payment-gateway.ts
import type { Money } from '@quickcart/money';

export type PaymentProviderCode = 'stripe' | 'razorpay';

export type GatewayPaymentStatus =
  | 'requires_payment_method'
  | 'requires_action'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'canceled'
  | 'failed';

export interface GatewayCallOptions {
  /** Passed to the gateway as its idempotency key: pay_{paymentId}, cap_{paymentId}_{n}, ref_{refundId}. */
  readonly idempotencyKey: string;
}

export interface CreatePaymentIntentInput {
  readonly tenantId: string;
  readonly paymentId: string;
  readonly orderId: string;
  readonly amount: Money;
  readonly captureMethod: 'manual' | 'automatic';
  readonly gatewayCustomerId?: string;
  readonly savedPaymentMethodId?: string;
  readonly savePaymentMethod?: boolean;
  readonly description?: string;
}

export interface PaymentIntentResult {
  readonly gatewayPaymentId: string;
  readonly status: GatewayPaymentStatus;
  /** Handed to the device SDK (Stripe PaymentSheet / Razorpay Checkout); never logged. */
  readonly clientSecret: string | null;
  readonly amountAuthorized: Money | null;
  readonly amountCaptured: Money | null;
}

export interface CaptureInput {
  readonly gatewayPaymentId: string;
  /** Final amount after packing; must be <= authorized amount. */
  readonly amount: Money;
}

export interface CancelAuthorizationInput {
  readonly gatewayPaymentId: string;
  readonly reason: 'abandoned' | 'requested_by_customer' | 'duplicate' | 'fraudulent';
}

export type RefundReason = 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'short_pick' | 'order_cancelled';

export interface RefundInput {
  readonly tenantId: string;
  readonly refundId: string;
  readonly gatewayPaymentId: string;
  readonly amount: Money;
  readonly reason: RefundReason;
}

export interface RefundResult {
  readonly gatewayRefundId: string;
  readonly status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  readonly amount: Money;
}

export interface WebhookInput {
  readonly rawBody: Buffer;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}

interface WebhookEventBase {
  readonly eventId: string;
  readonly occurredAt: Date;
}

export type GatewayWebhookEvent =
  | (WebhookEventBase & { readonly kind: 'payment.authorized'; readonly gatewayPaymentId: string; readonly amount: Money })
  | (WebhookEventBase & { readonly kind: 'payment.captured'; readonly gatewayPaymentId: string; readonly amount: Money })
  | (WebhookEventBase & { readonly kind: 'payment.requires_action'; readonly gatewayPaymentId: string })
  | (WebhookEventBase & {
      readonly kind: 'payment.failed';
      readonly gatewayPaymentId: string;
      readonly failureCode: string | null;
      readonly failureMessage: string | null;
    })
  | (WebhookEventBase & { readonly kind: 'payment.canceled'; readonly gatewayPaymentId: string })
  | (WebhookEventBase & {
      readonly kind: 'refund.updated';
      readonly gatewayRefundId: string;
      readonly gatewayPaymentId: string | null;
      readonly status: RefundResult['status'];
      readonly amount: Money;
    })
  | (WebhookEventBase & { readonly kind: 'ignored'; readonly providerEventType: string });

export interface PaymentGateway {
  readonly provider: PaymentProviderCode;
  createPaymentIntent(input: CreatePaymentIntentInput, options: GatewayCallOptions): Promise<PaymentIntentResult>;
  retrieve(gatewayPaymentId: string): Promise<PaymentIntentResult>;
  capture(input: CaptureInput, options: GatewayCallOptions): Promise<PaymentIntentResult>;
  cancelAuthorization(input: CancelAuthorizationInput, options: GatewayCallOptions): Promise<PaymentIntentResult>;
  refund(input: RefundInput, options: GatewayCallOptions): Promise<RefundResult>;
  /** Verifies the signature over the raw body and returns a normalized event; throws on failure. */
  verifyWebhook(input: WebhookInput): Promise<GatewayWebhookEvent>;
}
```

```ts
// apps/api/src/modules/payments/domain/errors/payment-errors.ts
import { DomainError, type ErrorDetails } from '@core/errors/domain-error.js';

export type PaymentGatewayErrorCode =
  | 'payments.card_declined'
  | 'payments.gateway_unavailable'
  | 'payments.gateway_invalid_request'
  | 'payments.gateway_auth_failed'
  | 'payments.idempotency_conflict'
  | 'payments.currency_unsupported'
  | 'payments.amount_invalid'
  | 'payments.gateway_unknown_status'
  | 'payments.gateway_error';

export class PaymentGatewayError extends DomainError {
  readonly httpStatus: number;

  constructor(
    readonly code: PaymentGatewayErrorCode,
    message: string,
    readonly retryable: boolean,
    details: ErrorDetails = {},
  ) {
    super(message, details);
    this.httpStatus =
      code === 'payments.card_declined' ? 402
      : code === 'payments.currency_unsupported' || code === 'payments.amount_invalid' ? 422
      : 502;
  }
}

export class WebhookVerificationError extends DomainError {
  readonly code = 'payments.webhook_invalid';
  readonly httpStatus = 400;

  constructor(provider: string, reason: string) {
    super(`Webhook verification failed for ${provider}: ${reason}`, { provider, reason });
  }
}
```

### 5.3 Stripe adapter

Library baseline for this adapter: `stripe` (stripe-node) v17 or later, whose `Stripe.Event` is a discriminated union so `event.data.object` narrows by `event.type`. `@quickcart/money` exposes `Money.of(amountMinor: bigint, currency: string)`, `money.amountMinor: bigint`, `money.currency: string` (ISO 4217, upper case) and `currencyExponent(code): number` (section 10).

Currency handling (decision): QuickCart minor units follow ISO 4217 exponents. Stripe uses the same exponent for nearly all currencies; the documented exceptions are rejected explicitly rather than converted silently:
- ISK, HUF, TWD, UGX: Stripe's amount representation differs from the ISO exponent for some operations → `payments.currency_unsupported` on Stripe (tenants in those countries use another gateway or a dedicated adapter).
- Three-decimal currencies (BHD, JOD, KWD, OMR, TND): Stripe requires the last digit to be 0 → `payments.amount_invalid` if not; the pricing module rounds totals to tens of fils for these currencies when Stripe is the active gateway.

```ts
// apps/api/src/modules/payments/infrastructure/gateways/stripe/stripe.credentials.ts
export interface StripeCredentials {
  readonly tenantId: string;
  readonly secretKey: string;
  readonly webhookSecret: string;
  /** tenant_secrets key version; part of the client cache key. */
  readonly keyVersion: number;
}
```

```ts
// apps/api/src/modules/payments/infrastructure/gateways/stripe/stripe.payment-gateway.ts
import Stripe from 'stripe';
import { currencyExponent, Money } from '@quickcart/money';
import type {
  CancelAuthorizationInput,
  CaptureInput,
  CreatePaymentIntentInput,
  GatewayCallOptions,
  GatewayPaymentStatus,
  GatewayWebhookEvent,
  PaymentGateway,
  PaymentIntentResult,
  RefundInput,
  RefundReason,
  RefundResult,
  WebhookInput,
} from '../../../application/ports/payment-gateway.js';
import { PaymentGatewayError, WebhookVerificationError } from '../../../domain/errors/payment-errors.js';
import type { StripeCredentials } from './stripe.credentials.js';

const STRIPE_EXPONENT_MISMATCH = new Set(['ISK', 'HUF', 'TWD', 'UGX']);

export class StripePaymentGateway implements PaymentGateway {
  readonly provider = 'stripe' as const;
  private readonly stripe: Stripe;

  constructor(
    private readonly credentials: StripeCredentials,
    client?: Stripe,
  ) {
    this.stripe =
      client ??
      new Stripe(credentials.secretKey, {
        maxNetworkRetries: 2,
        timeout: 10_000,
        appInfo: { name: 'QuickCart' },
      });
  }

  async createPaymentIntent(input: CreatePaymentIntentInput, options: GatewayCallOptions): Promise<PaymentIntentResult> {
    this.assertTenant(input.tenantId);
    const { amount, currency } = toStripeAmount(input.amount);

    const params: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      capture_method: input.captureMethod === 'manual' ? 'manual' : 'automatic',
      automatic_payment_methods: { enabled: true },
      metadata: {
        tenant_id: input.tenantId,
        order_id: input.orderId,
        payment_id: input.paymentId,
      },
    };
    if (input.gatewayCustomerId) params.customer = input.gatewayCustomerId;
    if (input.savedPaymentMethodId) params.payment_method = input.savedPaymentMethodId;
    if (input.savePaymentMethod) params.setup_future_usage = 'off_session';
    if (input.description) params.description = input.description;

    const intent = await this.call('createPaymentIntent', () =>
      this.stripe.paymentIntents.create(params, { idempotencyKey: options.idempotencyKey }),
    );
    return toIntentResult(intent);
  }

  async retrieve(gatewayPaymentId: string): Promise<PaymentIntentResult> {
    const intent = await this.call('retrieve', () => this.stripe.paymentIntents.retrieve(gatewayPaymentId));
    this.assertTenant(intent.metadata['tenant_id']);
    return toIntentResult(intent);
  }

  async capture(input: CaptureInput, options: GatewayCallOptions): Promise<PaymentIntentResult> {
    const { amount } = toStripeAmount(input.amount);
    const intent = await this.call('capture', () =>
      this.stripe.paymentIntents.capture(
        input.gatewayPaymentId,
        { amount_to_capture: amount },
        { idempotencyKey: options.idempotencyKey },
      ),
    );
    this.assertTenant(intent.metadata['tenant_id']);
    return toIntentResult(intent);
  }

  async cancelAuthorization(input: CancelAuthorizationInput, options: GatewayCallOptions): Promise<PaymentIntentResult> {
    const intent = await this.call('cancelAuthorization', () =>
      this.stripe.paymentIntents.cancel(
        input.gatewayPaymentId,
        { cancellation_reason: input.reason },
        { idempotencyKey: options.idempotencyKey },
      ),
    );
    this.assertTenant(intent.metadata['tenant_id']);
    return toIntentResult(intent);
  }

  async refund(input: RefundInput, options: GatewayCallOptions): Promise<RefundResult> {
    this.assertTenant(input.tenantId);
    const { amount } = toStripeAmount(input.amount);
    const refund = await this.call('refund', () =>
      this.stripe.refunds.create(
        {
          payment_intent: input.gatewayPaymentId,
          amount,
          reason: toStripeRefundReason(input.reason),
          metadata: { tenant_id: input.tenantId, refund_id: input.refundId, reason: input.reason },
        },
        { idempotencyKey: options.idempotencyKey },
      ),
    );
    return {
      gatewayRefundId: refund.id,
      status: toRefundStatus(refund.status),
      amount: fromStripeAmount(refund.amount, refund.currency),
    };
  }

  async verifyWebhook(input: WebhookInput): Promise<GatewayWebhookEvent> {
    const header = input.headers['stripe-signature'];
    const signature = Array.isArray(header) ? header[0] : header;
    if (!signature) throw new WebhookVerificationError('stripe', 'missing stripe-signature header');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(input.rawBody, signature, this.credentials.webhookSecret);
    } catch {
      throw new WebhookVerificationError('stripe', 'signature mismatch');
    }

    const base = { eventId: event.id, occurredAt: new Date(event.created * 1000) };

    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object;
        this.assertTenant(pi.metadata['tenant_id']);
        return { ...base, kind: 'payment.authorized', gatewayPaymentId: pi.id, amount: fromStripeAmount(pi.amount_capturable, pi.currency) };
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        this.assertTenant(pi.metadata['tenant_id']);
        return { ...base, kind: 'payment.captured', gatewayPaymentId: pi.id, amount: fromStripeAmount(pi.amount_received, pi.currency) };
      }
      case 'payment_intent.requires_action': {
        const pi = event.data.object;
        this.assertTenant(pi.metadata['tenant_id']);
        return { ...base, kind: 'payment.requires_action', gatewayPaymentId: pi.id };
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        this.assertTenant(pi.metadata['tenant_id']);
        return {
          ...base,
          kind: 'payment.failed',
          gatewayPaymentId: pi.id,
          failureCode: pi.last_payment_error?.decline_code ?? pi.last_payment_error?.code ?? null,
          failureMessage: pi.last_payment_error?.message ?? null,
        };
      }
      case 'payment_intent.canceled': {
        const pi = event.data.object;
        this.assertTenant(pi.metadata['tenant_id']);
        return { ...base, kind: 'payment.canceled', gatewayPaymentId: pi.id };
      }
      case 'refund.created':
      case 'refund.updated':
      case 'refund.failed': {
        const refund = event.data.object;
        this.assertTenant(refund.metadata?.['tenant_id']);
        const paymentIntent = refund.payment_intent;
        return {
          ...base,
          kind: 'refund.updated',
          gatewayRefundId: refund.id,
          gatewayPaymentId: typeof paymentIntent === 'string' ? paymentIntent : (paymentIntent?.id ?? null),
          status: toRefundStatus(refund.status),
          amount: fromStripeAmount(refund.amount, refund.currency),
        };
      }
      default:
        return { ...base, kind: 'ignored', providerEventType: event.type };
    }
  }

  /** Every Stripe object created by QuickCart carries metadata.tenant_id; a mismatch means a misrouted call or webhook. */
  private assertTenant(tenantId: string | undefined): void {
    if (tenantId !== this.credentials.tenantId) {
      throw new PaymentGatewayError('payments.gateway_invalid_request', 'Stripe object belongs to another tenant', false, {
        expectedTenantId: this.credentials.tenantId,
      });
    }
  }

  private async call<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw toGatewayError(operation, error);
    }
  }
}

function toStripeAmount(money: Money): { amount: number; currency: string } {
  const currency = money.currency.toUpperCase();
  if (STRIPE_EXPONENT_MISMATCH.has(currency)) {
    throw new PaymentGatewayError('payments.currency_unsupported', `Stripe adapter does not support ${currency}`, false, { currency });
  }
  if (money.amountMinor <= 0n || money.amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new PaymentGatewayError('payments.amount_invalid', 'Amount out of range', false, {
      amountMinor: money.amountMinor.toString(),
      currency,
    });
  }
  if (currencyExponent(currency) === 3 && money.amountMinor % 10n !== 0n) {
    throw new PaymentGatewayError('payments.amount_invalid', 'Stripe requires three-decimal amounts to end in 0', false, {
      amountMinor: money.amountMinor.toString(),
      currency,
    });
  }
  return { amount: Number(money.amountMinor), currency: currency.toLowerCase() };
}

function fromStripeAmount(amount: number, currency: string): Money {
  return Money.of(BigInt(amount), currency.toUpperCase());
}

function toIntentStatus(intent: Stripe.PaymentIntent): GatewayPaymentStatus {
  switch (intent.status) {
    case 'requires_payment_method':
      return intent.last_payment_error ? 'failed' : 'requires_payment_method';
    case 'requires_confirmation':
    case 'requires_action':
      return 'requires_action';
    case 'processing':
      return 'processing';
    case 'requires_capture':
      return 'authorized';
    case 'succeeded':
      return 'captured';
    case 'canceled':
      return 'canceled';
    default:
      throw new PaymentGatewayError('payments.gateway_unknown_status', 'Unknown Stripe PaymentIntent status', false, {
        status: String(intent.status),
      });
  }
}

function toIntentResult(intent: Stripe.PaymentIntent): PaymentIntentResult {
  const status = toIntentStatus(intent);
  return {
    gatewayPaymentId: intent.id,
    status,
    clientSecret: intent.client_secret,
    amountAuthorized: status === 'authorized' ? fromStripeAmount(intent.amount_capturable, intent.currency) : null,
    amountCaptured: intent.amount_received > 0 ? fromStripeAmount(intent.amount_received, intent.currency) : null,
  };
}

function toStripeRefundReason(reason: RefundReason): Stripe.RefundCreateParams.Reason {
  switch (reason) {
    case 'duplicate':
      return 'duplicate';
    case 'fraudulent':
      return 'fraudulent';
    case 'requested_by_customer':
    case 'short_pick':
    case 'order_cancelled':
      return 'requested_by_customer';
  }
}

function toRefundStatus(status: string | null): RefundResult['status'] {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      // 'pending', 'requires_action' and null are all still in flight.
      return 'pending';
  }
}

function toGatewayError(operation: string, error: unknown): PaymentGatewayError {
  if (error instanceof PaymentGatewayError) return error;
  if (error instanceof Stripe.errors.StripeCardError) {
    return new PaymentGatewayError('payments.card_declined', error.message, false, {
      operation,
      providerCode: error.code ?? null,
      declineCode: error.decline_code ?? null,
    });
  }
  if (error instanceof Stripe.errors.StripeIdempotencyError) {
    return new PaymentGatewayError('payments.idempotency_conflict', error.message, false, { operation });
  }
  if (
    error instanceof Stripe.errors.StripeRateLimitError ||
    error instanceof Stripe.errors.StripeConnectionError ||
    error instanceof Stripe.errors.StripeAPIError
  ) {
    return new PaymentGatewayError('payments.gateway_unavailable', error.message, true, { operation, requestId: error.requestId ?? null });
  }
  if (error instanceof Stripe.errors.StripeAuthenticationError || error instanceof Stripe.errors.StripePermissionError) {
    return new PaymentGatewayError('payments.gateway_auth_failed', error.message, false, { operation });
  }
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return new PaymentGatewayError('payments.gateway_invalid_request', error.message, false, {
      operation,
      providerCode: error.code ?? null,
      param: error.param ?? null,
    });
  }
  if (error instanceof Stripe.errors.StripeError) {
    return new PaymentGatewayError('payments.gateway_error', error.message, false, { operation });
  }
  return new PaymentGatewayError('payments.gateway_error', 'Unexpected payment gateway failure', false, { operation });
}
```

Webhook route (`modules/payments/interfaces/http/webhook.routes.ts`): `POST /api/v1/payments/webhooks/:provider/:tenantSlug` with `config: { public: true }`, a raw-body content-type parser registered only in that plugin (`addContentTypeParser('application/json', { parseAs: 'buffer' }, ...)`), tenant resolved from `tenantSlug`, gateway built by the factory, `verifyWebhook` called before any processing, then the normalized event is handed to the `HandleGatewayEvent` command, which deduplicates on `eventId`.

### 5.4 `RoutingProvider` interface and OSRM adapter

```ts
// apps/api/src/integrations/routing/routing-provider.ts
export interface LatLng {
  readonly lat: number;
  readonly lng: number;
}

/** Vehicle profile; each profile maps to its own OSRM dataset/instance. */
export type TravelProfile = 'bike' | 'car' | 'foot';

export interface RouteRequest {
  readonly origin: LatLng;
  readonly destination: LatLng;
  /** Intermediate stops in visiting order (batched deliveries). */
  readonly waypoints?: readonly LatLng[];
  readonly profile: TravelProfile;
}

export interface RouteLeg {
  readonly distanceMeters: number;
  readonly durationSeconds: number;
}

export interface RouteResult {
  readonly distanceMeters: number;
  readonly durationSeconds: number;
  /** Encoded polyline of the full route. */
  readonly polyline: string;
  readonly polylinePrecision: 5 | 6;
  readonly legs: readonly RouteLeg[];
}

export interface MatrixRequest {
  readonly sources: readonly LatLng[];
  readonly destinations: readonly LatLng[];
  readonly profile: TravelProfile;
}

export interface MatrixResult {
  /** [sourceIndex][destinationIndex]; null when no route exists. */
  readonly durationsSeconds: ReadonlyArray<ReadonlyArray<number | null>>;
  readonly distancesMeters: ReadonlyArray<ReadonlyArray<number | null>>;
}

export interface RoutingProvider {
  readonly name: 'osrm' | 'google_routes' | 'mapbox' | 'haversine';
  route(request: RouteRequest, signal?: AbortSignal): Promise<RouteResult>;
  matrix(request: MatrixRequest, signal?: AbortSignal): Promise<MatrixResult>;
}
```

```ts
// apps/api/src/integrations/routing/routing.errors.ts
import { DomainError } from '@core/errors/domain-error.js';

export class RoutingUnavailableError extends DomainError {
  readonly code = 'routing.unavailable';
  readonly httpStatus = 503;

  constructor(provider: string, reason: string) {
    super(`Routing provider ${provider} unavailable: ${reason}`, { provider, reason });
  }
}
```

```ts
// apps/api/src/integrations/routing/adapters/osrm.routing-provider.ts
import { RoutingUnavailableError } from '../routing.errors.js';
import type {
  LatLng,
  MatrixRequest,
  MatrixResult,
  RouteRequest,
  RouteResult,
  RoutingProvider,
  TravelProfile,
} from '../routing-provider.js';

export interface OsrmConfig {
  /** One osrm-routed base URL per profile, e.g. http://osrm-car:5000 (example values; env per region). */
  readonly baseUrlByProfile: Readonly<Record<TravelProfile, string>>;
  readonly timeoutMs: number;
}

interface OsrmBaseResponse {
  readonly code: string;
  readonly message?: string;
}

interface OsrmRouteResponse extends OsrmBaseResponse {
  readonly routes?: ReadonlyArray<{
    readonly distance: number;
    readonly duration: number;
    readonly geometry: string;
    readonly legs: ReadonlyArray<{ readonly distance: number; readonly duration: number }>;
  }>;
}

interface OsrmTableResponse extends OsrmBaseResponse {
  readonly durations?: ReadonlyArray<ReadonlyArray<number | null>>;
  readonly distances?: ReadonlyArray<ReadonlyArray<number | null>>;
}

function encodeCoordinates(points: readonly LatLng[]): string {
  // OSRM expects lng,lat pairs separated by semicolons.
  return points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
}

export class OsrmRoutingProvider implements RoutingProvider {
  readonly name = 'osrm' as const;

  constructor(
    private readonly config: OsrmConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async route(request: RouteRequest, signal?: AbortSignal): Promise<RouteResult> {
    const points = [request.origin, ...(request.waypoints ?? []), request.destination];
    const url =
      `${this.baseUrl(request.profile)}/route/v1/driving/${encodeCoordinates(points)}` +
      '?overview=full&geometries=polyline6&steps=false&annotations=false';
    const body = await this.get<OsrmRouteResponse>(url, signal);
    const best = body.routes?.[0];
    if (!best) throw new RoutingUnavailableError('osrm', 'no_route');
    return {
      distanceMeters: best.distance,
      durationSeconds: best.duration,
      polyline: best.geometry,
      polylinePrecision: 6,
      legs: best.legs.map((leg) => ({ distanceMeters: leg.distance, durationSeconds: leg.duration })),
    };
  }

  async matrix(request: MatrixRequest, signal?: AbortSignal): Promise<MatrixResult> {
    if (request.sources.length === 0 || request.destinations.length === 0) {
      return { durationsSeconds: [], distancesMeters: [] };
    }
    const points = [...request.sources, ...request.destinations];
    const sources = request.sources.map((_, i) => i).join(';');
    const destinations = request.destinations.map((_, i) => i + request.sources.length).join(';');
    const url =
      `${this.baseUrl(request.profile)}/table/v1/driving/${encodeCoordinates(points)}` +
      `?sources=${sources}&destinations=${destinations}&annotations=duration,distance`;
    const body = await this.get<OsrmTableResponse>(url, signal);
    if (!body.durations || !body.distances) throw new RoutingUnavailableError('osrm', 'incomplete_table');
    return { durationsSeconds: body.durations, distancesMeters: body.distances };
  }

  private baseUrl(profile: TravelProfile): string {
    return this.config.baseUrlByProfile[profile].replace(/\/+$/, '');
  }

  private async get<T extends OsrmBaseResponse>(url: string, signal?: AbortSignal): Promise<T> {
    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await this.fetchImpl(url, { signal: combined, headers: { accept: 'application/json' } });
    } catch (error) {
      throw new RoutingUnavailableError('osrm', error instanceof Error ? error.name : 'network_error');
    }

    let body: T;
    try {
      body = (await response.json()) as T;
    } catch {
      throw new RoutingUnavailableError('osrm', `invalid_json_http_${response.status}`);
    }
    if (!response.ok || body.code !== 'Ok') {
      throw new RoutingUnavailableError('osrm', body.code || `http_${response.status}`);
    }
    return body;
  }
}
```

`routing.factory.ts` wraps the selected provider in a fallback decorator: on `RoutingUnavailableError` it answers from `haversine.routing-provider.ts` (great-circle distance x `settings:routing.detour_factor` / `settings:routing.fallback_speed_kmh`) and increments the `routing_fallback_total` metric.

### 5.5 Other port signatures (summary)

| Port | Methods |
|---|---|
| `MapsProvider` | `geocode(query, { locale, countryCode })`, `reverseGeocode(latLng, { locale })`, `autocomplete(input, { sessionToken, bias: LatLng, radiusM, locale })`, `placeDetails(placeId, { sessionToken })` → normalized `Address` |
| `PushSender` | `send(message: { tokens: string[]; title; body; data: Record<string,string>; link?; priority: 'high' | 'normal'; ttlSeconds; collapseKey? })` → `{ successCount, invalidTokens: string[], retryableTokens: string[] }` |
| `StorageProvider` | `presignPut({ key, contentType, maxBytes, expiresInS })`, `presignGet({ key, expiresInS })`, `putObject({ key, body, contentType })`, `headObject(key)`, `deleteObject(key)`; keys must start with `tenants/{tenantId}/` |
| `SmsProvider` | `send({ to: E164, body, templateId?, senderId? })` → `{ providerMessageId }` |
| `EmailProvider` | `send({ to, from, replyTo?, subject, html, text, attachments? })` → `{ providerMessageId }` |
| `SearchIndex` | `ensureIndex(tenantSlug, locale, settings)`, `upsertDocuments(index, docs)`, `updateDocuments(index, partialDocs)`, `deleteDocuments(index, ids)`, `search(index, { q, filter, sort, limit, offset, attributesToHighlight })`, `updateSynonyms(index, map)`, `swapIndexes(a, b)` |

---

## 6. Dependency rules and enforcement

### 6.1 Allowed import directions

```
                 bootstrap/  (composition root: may import everything)
                     │
     ┌───────────────┼──────────────────────────┐
     ▼               ▼                          ▼
 modules/<m>/interfaces   modules/<m>/infrastructure   modules/<m>/jobs
     │        \            /        │               /
     │         ▼          ▼         ▼              /
     │      modules/<m>/application  ◀────────────┘
     │               │
     │               ▼
     │      modules/<m>/domain
     │
     ├──▶ modules/<other>/index.ts   (only from infrastructure/adapters, jobs, bootstrap)
     ├──▶ integrations/<capability>  (ports from application; adapters from infrastructure/bootstrap)
     └──▶ core/*                     (domain: only core/errors, core/kernel)
 core/*  ──▶ packages/*  (never modules/, never integrations/)
```

| From | May import | Must not import |
|---|---|---|
| `modules/<m>/domain` | own `domain/**`, `@core/errors`, `@core/kernel`, `@quickcart/money` | anything else, including npm packages |
| `modules/<m>/application` | own `domain`, own `application`, `@core/*` types/ports, `integrations/*/<port>.ts` (interfaces only), `@quickcart/*` | own `infrastructure`, `interfaces`, `jobs`; other modules; framework packages (fastify, drizzle-orm, pg, ioredis, bullmq, socket.io, vendor SDKs) |
| `modules/<m>/infrastructure` | own `domain`, `application`, `@core/*` (including `core/db/schema`), `integrations/*`, other modules' `index.ts`, framework packages | other modules' internals; own `interfaces` |
| `modules/<m>/interfaces` | own `application` (use cases, DTOs), own `domain` (types, errors), `@core/http`, `@core/errors`, Zod, Fastify, Socket.IO | own `infrastructure`; `core/db`; other modules' internals |
| `modules/<m>/jobs` | own `application`, `@core/*`, BullMQ | own `infrastructure` (receives use cases via factory), other modules' internals |
| `integrations/*` | `@core/*`, vendor SDKs | `modules/*` |
| `core/*` | `core/*`, `@quickcart/*`, framework packages | `modules/*`, `integrations/*` |
| `apps/admin-web`, `apps/store-web` | `@quickcart/api-client`, `@quickcart/ui-web`, `@quickcart/design-tokens`, `@quickcart/i18n`, `@quickcart/money` | `apps/api/**` |

### 6.2 dependency-cruiser configuration

```js
// .dependency-cruiser.cjs
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-is-module-agnostic',
      comment: 'core/ must never depend on business modules or integrations.',
      severity: 'error',
      from: { path: '^apps/api/src/core/' },
      to: { path: ['^apps/api/src/modules/', '^apps/api/src/integrations/'] },
    },
    {
      name: 'integrations-do-not-know-modules',
      severity: 'error',
      from: { path: '^apps/api/src/integrations/' },
      to: { path: '^apps/api/src/modules/' },
    },
    {
      name: 'domain-is-pure',
      comment: 'domain/ may import only itself, core/errors, core/kernel and packages/money.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/domain/' },
      to: {
        pathNot: [
          '^apps/api/src/modules/$1/domain/',
          '^apps/api/src/core/(errors|kernel)/',
          '^packages/money/',
        ],
      },
    },
    {
      name: 'application-not-to-outer-layers',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/application/' },
      to: { path: '^apps/api/src/modules/$1/(infrastructure|interfaces|jobs)/' },
    },
    {
      name: 'application-no-frameworks',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/application/' },
      to: {
        path: 'node_modules/(fastify|drizzle-orm|pg|ioredis|bullmq|socket\\.io|stripe|razorpay|meilisearch|@aws-sdk|firebase-admin)/',
      },
    },
    {
      name: 'application-integrations-ports-only',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/application/' },
      to: { path: '^apps/api/src/integrations/[^/]+/adapters/' },
    },
    {
      name: 'interfaces-not-to-infrastructure',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/interfaces/' },
      to: { path: ['^apps/api/src/modules/$1/infrastructure/', '^apps/api/src/core/db/'] },
    },
    {
      name: 'module-boundary',
      comment: 'Another module is reachable only through its index.ts.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/[^/]+/',
        pathNot: ['^apps/api/src/modules/$1/', '^apps/api/src/modules/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'cross-module-only-from-adapters',
      comment: 'Domain, application and interfaces reach other modules through ports, never directly.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/(domain|application|interfaces)/' },
      to: { path: '^apps/api/src/modules/[^/]+/index\\.ts$', pathNot: '^apps/api/src/modules/$1/index\\.ts$' },
    },
    {
      name: 'db-schema-only-in-persistence',
      severity: 'error',
      from: {
        pathNot: [
          '^apps/api/src/core/',
          '^apps/api/src/modules/[^/]+/infrastructure/',
          '^apps/api/src/bootstrap/',
          '^apps/api/test/',
          '^apps/api/drizzle\\.config\\.ts$',
        ],
      },
      to: { path: '^apps/api/src/core/db/schema/' },
    },
    {
      name: 'web-apps-isolated-from-api-source',
      severity: 'error',
      from: { path: '^apps/(admin-web|store-web)/' },
      to: { path: '^apps/(api|worker)/' },
    },
    {
      name: 'tests-not-imported-by-source',
      severity: 'error',
      from: { pathNot: '(__tests__|^apps/api/test/)' },
      to: { path: '(__tests__/|^apps/api/test/)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'apps/api/tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
    reporterOptions: { dot: { collapsePattern: 'node_modules/[^/]+' } },
  },
};
```

`$1` in `to.path` / `to.pathNot` refers to the capture group of `from.path` (dependency-cruiser group matching), which is how "own module" is expressed. CI runs `pnpm depcruise apps/api/src apps/admin-web/src apps/store-web/src --config .dependency-cruiser.cjs` and fails on any `error`. ESLint (`packages/eslint-config`) adds `no-restricted-imports` for the same rules to give editor feedback; dependency-cruiser remains the gate.

Flutter: `apps/mobile/analysis_options.yaml` uses `custom_lint` with a rule set forbidding `features/<a>/**` from importing `features/<b>/**` (shared code goes to `lib/core` or `lib/shared`) and `domain/` from importing `data/` or `presentation/`.

---

## 7. `apps/worker`

```
apps/worker/
├── package.json
├── tsconfig.json                     same path aliases as apps/api; references apps/api/src
└── src/
    ├── main.ts                       loadEnv -> buildContainer (shared with api) -> start processors and schedulers
    ├── queues.ts                     queue names and default job options (attempts, backoff, removeOnComplete)
    ├── processors.ts                 registry: queue -> processor from each module's index.ts (jobs/)
    ├── schedulers.ts                 repeatable jobs (outbox relay tick, sweepers, nightly jobs) behind a Redis lock
    ├── outbox-relay.runner.ts        core/events/outbox/outbox-relay.ts loop with LISTEN/NOTIFY wake-up
    ├── health.ts                     /health for orchestrator probes (queue connectivity)
    └── shutdown.ts                   worker.close() with grace period; in-flight jobs complete or return to queue
```

Queue names and consumers are listed in `01-ARCHITECTURE.md` section 3. Every processor sets the tenant context (`core/tenancy/tenant-als.ts`) from the job payload before calling a use case, so logs and transactions are tenant-scoped.

---

## 8. Web front ends

Both web apps share the same layout; they differ in features.

```
apps/admin-web/
├── index.html
├── vite.config.ts
├── tailwind.config.ts                theme extends CSS variables from @quickcart/design-tokens
├── tsconfig.json
└── src/
    ├── main.tsx                      providers: QueryClient, Router, I18n, Theme, Auth
    ├── app/
    │   ├── router.tsx                TanStack Router (or React Router 6) route tree; platform vs tenant shells
    │   ├── shells/
    │   │   ├── platform-shell.tsx    super admin navigation (aud = platform)
    │   │   └── tenant-shell.tsx      tenant admin navigation (aud = tenant)
    │   ├── providers/
    │   │   ├── query-client.ts       defaults: staleTime, retry policy honoring 409/422 as non-retryable
    │   │   ├── auth-provider.tsx     token storage (memory + refresh via httpOnly cookie), MFA flow
    │   │   ├── theme-provider.tsx    tenant branding -> CSS variables (04-DESIGN-SYSTEM.md)
    │   │   └── i18n-provider.tsx     @quickcart/i18n, RTL switch
    │   └── realtime/
    │       └── socket.ts             Socket.IO client, room events -> queryClient.setQueryData patches
    ├── features/
    │   ├── dashboard/                god's-eye metrics, maps
    │   ├── tenants/                  platform: list, provisioning wizard, domains, plans
    │   ├── commission-rules/
    │   ├── tax/                      jurisdictions, categories, rules, versions, calculator
    │   ├── flags/                    flag console with precedence preview
    │   ├── countries-currencies/
    │   ├── audit/                    hash-chained log viewer, verify range
    │   ├── stores/                   stores, polygon editor (map draw), hours, throttle
    │   ├── catalog/                  products, variants, categories, brands, substitutes, import
    │   ├── pricing/
    │   ├── promotions/
    │   ├── layouts/                  home layout editor + live preview
    │   ├── search-settings/          synonyms, typo-disabled words, zero-result report
    │   ├── orders/                   search, timeline, cancel, refund
    │   ├── customers/
    │   ├── riders/
    │   ├── notifications/
    │   ├── finance/                  settlements, payouts, reconciliation
    │   ├── staff-roles/
    │   └── settings/                 tenant settings and secrets (write-only fields)
    │       Each feature folder:
    │         ├── routes.tsx           route definitions for the feature
    │         ├── pages/               route components
    │         ├── components/          feature-local components
    │         ├── hooks/               wrappers over generated api-client hooks
    │         ├── schemas.ts           form schemas (Zod, shared shapes with the API types)
    │         └── __tests__/
    ├── shared/
    │   ├── components/               app-level composites built on @quickcart/ui-web
    │   ├── permissions/              <Can permission="refunds.create"> using the permission catalog
    │   ├── money/                    <MoneyText> using @quickcart/money + Intl.NumberFormat
    │   └── errors/                   error envelope -> translated toast/form errors
    └── test/
        ├── msw/                      Mock Service Worker handlers generated from OpenAPI examples
        └── setup.ts

apps/store-web/
└── src/
    ├── main.tsx
    ├── app/                          same structure as admin-web (single shell, store switcher)
    └── features/
        ├── queue/                    live kanban, SLA timers (server-offset clock)
        ├── order-detail/
        ├── inventory/                table, toggles, thresholds, SKU movement ledger
        ├── receiving/                GRN, adjustments, cycle counts, approvals
        ├── alerts/                   low-stock alerts
        ├── store-status/             open/pause/throttle
        ├── staff/                    roster, productivity
        ├── riders/                   rider area, manual assignment
        ├── reports/
        └── settlements/
```

API client: `packages/api-client` is generated from `docs/openapi/openapi.json` with `@hey-api/openapi-ts` (types + fetch client) and `@tanstack/react-query` plugin (query/mutation hooks). Generation runs in CI; a diff in the generated client without a matching API change fails the build. The client injects `Authorization`, `Idempotency-Key` (for operations whose OpenAPI declares that header; a UUID per user action), and `Accept-Language`.

---

## 9. Flutter app (`apps/mobile`)

One Flutter project, three flavors (`customer`, `store`, `rider`), white-labeled per tenant at build time.

```
apps/mobile/
├── pubspec.yaml                      flutter_riverpod, go_router, dio, socket_io_client, drift, firebase_messaging,
│                                     google_maps_flutter / mapbox_maps_flutter, flutter_stripe, razorpay_flutter,
│                                     mobile_scanner, geolocator, flutter_foreground_task, intl
├── analysis_options.yaml             strict lints + custom_lint architecture rules
├── l10n.yaml                         arb-dir: lib/l10n, output-class: AppLocalizations
├── melos.yaml                        internal packages under packages/
├── flavors/                          per-flavor and per-tenant build inputs
│   ├── customer/  store/  rider/     app id suffix, icons, launch screens
│   └── tenants/<tenantSlug>/         tenant.json (tenant id/slug, API host, deep link scheme, Firebase options),
│                                     brand tokens override, store listing assets
├── android/                          productFlavors: customer, store, rider (x tenant via Gradle properties)
├── ios/                              schemes/configurations per flavor (xcconfig)
├── packages/
│   ├── qc_api/                       Dart client generated from OpenAPI (openapi-generator dart-dio)
│   ├── qc_tokens/                    generated from packages/design-tokens (colors, typography, spacing, motion)
│   └── qc_ui/                        shared widgets on qc_tokens (buttons, cards, product tile, map marker)
├── lib/
│   ├── main_customer.dart            bootstrap(Flavor.customer)
│   ├── main_store.dart               bootstrap(Flavor.store)
│   ├── main_rider.dart               bootstrap(Flavor.rider)
│   ├── bootstrap.dart                env/tenant config load, Firebase init, ProviderScope, error zones
│   ├── app.dart                      MaterialApp.router with theme from qc_tokens, locale, router per flavor
│   ├── core/
│   │   ├── config/                   flavor.dart, tenant_config.dart (from flavors/tenants/<slug>/tenant.json)
│   │   ├── network/                  dio client, interceptors (auth refresh, X-Tenant, X-App, X-App-Version,
│   │   │                             Accept-Language, Idempotency-Key), error envelope -> AppFailure
│   │   ├── realtime/                 socket client, room event streams, reconnect/backoff, polling fallback
│   │   ├── storage/                  drift database (cart, offline action queue, location buffer), secure storage
│   │   ├── auth/                     session state, token refresh, logout on reuse detection
│   │   ├── flags/                    flags snapshot from /api/v1/config/bootstrap, FeatureGate widget
│   │   ├── i18n/                     locale resolution, server translation overrides
│   │   ├── money/                    Money (int minor units as BigInt) + formatting per currency/locale
│   │   ├── routing/                  go_router base, deep link parsing (scheme + universal links)
│   │   ├── push/                     FCM token registration (devices), notification tap -> route
│   │   ├── location/                 permission flows; rider foreground service wrapper
│   │   ├── theme/                    ThemeData built from qc_tokens + tenant overrides (04-DESIGN-SYSTEM.md)
│   │   ├── offline/                  action queue with idempotency keys, connectivity monitor
│   │   └── telemetry/                crash and performance reporting, structured logs
│   ├── shared/                       widgets/utilities used by 2+ features of the same or different flavors
│   ├── features/
│   │   │   (each feature: data/ domain/ presentation/)
│   │   │   data/          datasources (remote via qc_api, local via drift), DTO mappers, repository implementations
│   │   │   domain/        entities, repository interfaces, use cases (pure Dart)
│   │   │   presentation/  screens, widgets, Riverpod providers/notifiers, routes.dart
│   │   ├── auth/                     all flavors
│   │   ├── onboarding/               customer
│   │   ├── address/                  customer (map picker, saved addresses)
│   │   ├── serviceability/           customer
│   │   ├── home/                     customer (layout section renderers per type)
│   │   ├── catalog/                  customer (category tree, listing, product detail)
│   │   ├── search/                   customer (instant search, recent, trending)
│   │   ├── cart/                     customer (substitution preferences)
│   │   ├── checkout/                 customer (quote, payment sheets, 3DS)
│   │   ├── orders/                   customer (history, detail, invoice, reorder)
│   │   ├── tracking/                 customer (animated map, ETA, timeline)
│   │   ├── substitutions/            customer (approval sheet) and store (proposal)
│   │   ├── wallet/                   customer
│   │   ├── notifications/            all flavors (inbox, preferences)
│   │   ├── support_chat/             customer, rider
│   │   ├── referral/                 customer
│   │   ├── store_queue/              store
│   │   ├── picking/                  store (scanner, pick list, short pick)
│   │   ├── packing/                  store
│   │   ├── handoff/                  store, rider
│   │   ├── store_inventory/          store (search, toggle, receive, cycle count)
│   │   ├── shifts/                   rider
│   │   ├── dispatch_offers/          rider (full-screen offer, countdown)
│   │   ├── trip/                     rider (stops, navigation hand-off)
│   │   ├── proof_of_delivery/        rider (OTP, signature, photo)
│   │   ├── cash/                     rider (COD cash in hand, deposits)
│   │   ├── earnings/                 rider
│   │   └── profile/                  all flavors
│   ├── routers/
│   │   ├── customer_router.dart      only customer features are reachable (tree-shaken per flavor entry)
│   │   ├── store_router.dart
│   │   └── rider_router.dart
│   └── l10n/
│       ├── app_en.arb                source strings (keys mirror packages/i18n where shared, e.g. error codes)
│       ├── app_ar.arb
│       └── app_hi.arb
└── test/
    ├── unit/                         domain use cases, mappers, money
    ├── widget/                       screens with mocked providers; golden tests per flavor and theme (light/dark, RTL)
    └── integration_test/             flavor flows on emulator against a seeded API (e2e, section 11)
```

Flavor entry example:

```dart
// apps/mobile/lib/main_customer.dart
import 'bootstrap.dart';
import 'core/config/flavor.dart';

Future<void> main() => bootstrap(Flavor.customer);
```

```dart
// apps/mobile/lib/core/config/flavor.dart
enum Flavor {
  customer(appHeader: 'customer'),
  store(appHeader: 'store'),
  rider(appHeader: 'rider');

  const Flavor({required this.appHeader});

  /// Value sent in the X-App header (contract section 6).
  final String appHeader;
}
```

Build command pattern (decision): `flutter build appbundle --flavor customer -t lib/main_customer.dart --dart-define=TENANT=<tenantSlug>`; the `TENANT` define selects `flavors/tenants/<tenantSlug>/tenant.json`, bundled as an asset by a pre-build script in `tools/`. Theme values come from `packages/qc_tokens` generated from `packages/design-tokens`, with tenant brand overrides applied at runtime from `/api/v1/config/bootstrap`.

---

## 10. `packages/*`

| Package | Contents | Consumers |
|---|---|---|
| `packages/config` | Zod schemas and TypeScript types for the settings catalog and `feature_definitions` seeds (keys from contract section 5 and `01-ARCHITECTURE.md` section 13), the permission catalog (`Permission` union, default role grants), region-pack schema; form hints for admin UIs. Exported subpaths: `@quickcart/config/settings`, `/flags`, `/permissions`. Semantics in `03-CONFIG-FLAGS-TAX.md`. | api, worker, admin-web, store-web, installer |
| `packages/money` | `Money` value object (`amountMinor: bigint`, `currency`), `Money.of`, `add`, `subtract`, `multiplyByInteger`, `percentOf(basisPoints, roundingMode)`, `allocate(ratios)` (largest-remainder, no lost minor units), `compare`, `isZero`; `currencyExponent(code)` from an ISO 4217 table; `formatMoney(money, locale)` via `Intl.NumberFormat`; JSON codec (`{ amount_minor, currency }`, number within the safe-integer range). No floats anywhere. | api, worker, web apps; Dart port in `apps/mobile/lib/core/money` |
| `packages/i18n` | Translation key catalog (including every error `code`), English source strings, platform language packs, ICU helpers, RTL locale list, `tools/i18n-check` integration. | api, web apps, Flutter (ARB export) |
| `packages/design-tokens` | Token source JSON (color, typography, spacing, radius, elevation, motion) and Style Dictionary build outputs: CSS variables, TypeScript constants, Dart (`qc_tokens`). Owned by `04-DESIGN-SYSTEM.md`. | ui-web, web apps, mobile |
| `packages/api-client` | Generated TypeScript client and TanStack Query hooks from `docs/openapi/openapi.json`; thin wrapper adding auth refresh, tenant headers and idempotency keys. | admin-web, store-web, installer |
| `packages/ui-web` | React components on tokens (Button, Input, Select, DataTable, Drawer, Dialog, Toast, MoneyText, StatusBadge for order statuses, SlaTimer, MapPolygonEditor, KanbanColumn), Storybook, accessibility tests. | admin-web, store-web, installer |
| `packages/region-packs` | Per-country JSON packs (tax seeds, address formats, phone formats, default currency/locale, search synonyms, legal retention) validated by `@quickcart/config` schemas. | api (tenant provisioning), installer |
| `packages/eslint-config` | ESLint flat config: TypeScript strict rules, import ordering, `no-restricted-imports` mirroring section 6, React rules for web, ban on floating-point money helpers (`no-restricted-syntax` for `parseFloat` in money paths). | all TS packages |

---

## 11. Testing layout

### 11.1 Test types

| Type | Location | Tooling | Scope and rules |
|---|---|---|---|
| Unit | `apps/api/src/modules/<m>/__tests__/unit/*.spec.ts` | Vitest | Domain entities, value objects, domain services, use cases with in-memory fakes of ports. No I/O. Must run in < 1 s per file. |
| Integration | `apps/api/src/modules/<m>/__tests__/integration/*.int.spec.ts` | Vitest + Testcontainers (`postgis/postgis:16-3.4`, `redis:7`, `getmeili/meilisearch:v1.x`, MinIO) | Drizzle repositories against real PostgreSQL with migrations and RLS applied, connected as `qc_app`. Includes concurrency tests (parallel reservations). |
| Tenant isolation | `apps/api/test/isolation/*.isolation.spec.ts` | Vitest + Testcontainers + Fastify `inject` | For every route in the route table: seed tenants A and B, call with A's token against B's ids and B's Host; assert 403/404 and no B data in the response. Also asserts that every tenant table has RLS forced (`pg_class.relforcerowsecurity`) and that a query without `app.tenant_id` fails. Generated by `tools/tenant-isolation-gen`; a route without an isolation case fails CI. |
| Contract (adapters) | `apps/api/src/**/__tests__/contract/*.contract.ts` | Vitest; shared suite function per port (`describePaymentGatewayContract(factory)`) | Each adapter runs the same behavioral suite: create, capture, cancel, refund, webhook verification with valid and tampered signatures, error mapping. Online mode uses vendor sandboxes (nightly); offline mode replays recorded fixtures (every PR). |
| API contract | `apps/api/test/openapi/*.spec.ts` | Vitest + OpenAPI diff | Generated spec matches committed `docs/openapi/openapi.json`; breaking changes require a version bump. |
| End-to-end | `e2e/` at repo root: `e2e/web/*.e2e.ts` (Playwright), `apps/mobile/test/integration_test/*` (Flutter) | Docker Compose stack seeded with two tenants | Golden journeys: flow (a) order with card + 3DS test card; flow (b) pick with substitution approval and timeout; flow (c) payment timeout releasing stock; flow (d) low stock hiding a product in search; admin commission rule change and audit verification. |
| Load | `tools/load/*.js` | k6 | Targets from `01-ARCHITECTURE.md` section 11 (search, serviceability, checkout, ping ingestion). |
| Web unit/component | `apps/*-web/src/**/__tests__/*.test.tsx` | Vitest + Testing Library + MSW | Feature components, permission gating, error envelope handling. |
| Flutter | `apps/mobile/test/{unit,widget}` | flutter_test, golden tests | Domain, providers, widgets, goldens per flavor/theme/RTL. |

### 11.2 Example unit test

```ts
// apps/api/src/modules/inventory/__tests__/unit/inventory-item.spec.ts
import { describe, expect, it } from 'vitest';
import { InventoryItem } from '../../domain/entities/inventory-item.js';
import { InsufficientStockError, StockInvariantViolationError } from '../../domain/errors/inventory-errors.js';
import { Quantity } from '../../domain/value-objects/quantity.js';

const item = (onHand: number, reserved: number) =>
  InventoryItem.rehydrate({
    id: '0192f1e0-0000-7000-8000-000000000001',
    tenantId: '0192f1e0-0000-7000-8000-0000000000aa',
    storeId: '0192f1e0-0000-7000-8000-0000000000bb',
    variantId: '0192f1e0-0000-7000-8000-0000000000cc',
    onHand,
    reserved,
    lowStockThreshold: 2,
    isActive: true,
    binCode: 'A03-S2-B4',
    pickSequence: 120,
  });

describe('InventoryItem', () => {
  it('reserves up to the available quantity', () => {
    const i = item(5, 3);
    i.reserve(Quantity.of(2));
    expect(i.available).toBe(0);
  });

  it('rejects a reservation above availability', () => {
    expect(() => item(5, 3).reserve(Quantity.of(3))).toThrow(InsufficientStockError);
  });

  it('commits a short pick: on_hand drops by picked, reserved by reserved', () => {
    const i = item(10, 4);
    i.commit(Quantity.of(4), 3);
    expect(i.levels).toEqual({ onHand: 7, reserved: 0, isActive: true });
    expect(i.pullChanges()).toHaveLength(1);
  });

  it('refuses a write-off that would leave reservations without stock', () => {
    expect(() => item(5, 4).adjust(-2)).toThrow(StockInvariantViolationError);
  });
});
```

### 11.3 Example concurrency integration test (outline of assertions)

`concurrent-reservation.int.spec.ts` seeds `on_hand = 3` for one SKU, starts 20 `ReserveStockForCart` executions for 20 different carts in parallel (each requesting 1 unit) through the real `DrizzleInventoryUnitOfWork`, and asserts: exactly 3 fulfilled, 17 rejected with `InsufficientStockError`, `inventory_items.reserved = 3`, exactly 3 `stock_reservations` rows with `status = 'active'`, and 3 `inventory.stock_reserved` rows in `outbox_events`.

### 11.4 Commands

| Command | Runs |
|---|---|
| `pnpm test:unit` | Unit tests of all TS workspaces |
| `pnpm test:int` | Integration + isolation (Testcontainers; Docker required) |
| `pnpm test:contract` | Adapter contract suites (offline fixtures; `CONTRACT_ONLINE=1` for sandboxes) |
| `pnpm test:e2e` | Compose stack + Playwright |
| `pnpm depcruise` | Architecture rules (section 6) |
| `melos run test` | Flutter unit and widget tests |

---

## 12. Naming conventions

| Item | Convention | Example |
|---|---|---|
| TS files | kebab-case with role suffix | `reserve-stock-for-cart.ts`, `drizzle-inventory.repository.ts`, `reservation.routes.ts`, `reservation.schemas.ts`, `inventory.gateway.ts`, `reservation-expiry.processor.ts` |
| Classes | PascalCase; use cases are verb phrases | `ReserveStockForCart`, `InventoryItem`, `StripePaymentGateway` |
| Ports | Noun + role, no `I` prefix | `InventoryRepository`, `PaymentGateway`, `RoutingProvider`, `CartAccessPort` |
| Adapters | `<Vendor/Tech><Port>` | `DrizzleInventoryRepository`, `OsrmRoutingProvider`, `FcmPushSender` |
| Domain errors | `<Condition>Error`, `code` = `<module>.<snake_case>` translation key | `InsufficientStockError` → `inventory.insufficient_stock` |
| Events | `<aggregate>.<fact>` snake_case | `inventory.low_stock`, `order.placed` |
| Queues | kebab-case nouns | `reservation-expiry`, `search-index` |
| Socket rooms | contract format | `t:{tenantId}:store:{storeId}` |
| Socket events | `<domain>.<fact>` | `order.status_changed`, `dispatch.offer` |
| Redis keys | `t:{tenantId}:<area>:...` for tenant data; `platform:<area>:...` otherwise | `t:{tenantId}:store:{storeId}:avail` |
| REST paths | plural nouns, kebab-case, `/api/v1` prefix | `/api/v1/stores/{storeId}/inventory/reservations` |
| OpenAPI `operationId` | camelCase verb phrase, unique | `reserveStockForCart` |
| Zod schemas | `<Thing><Role>Schema` | `ReserveStockBodySchema`, `ReserveStockResponseSchema` |
| DB | snake_case tables/columns from contract section 3; indexes `<table>_<cols>_idx`, uniques `_uq`, checks `<table>_<rule>` | `inventory_items_tenant_store_variant_uq` |
| Settings / flags | dotted lower snake case | `inventory.reservation_ttl_s`, `cart.substitutions` |
| Tests | `*.spec.ts` (unit), `*.int.spec.ts` (integration), `*.isolation.spec.ts`, `*.contract.ts`, `*.e2e.ts` | `inventory-item.spec.ts` |
| Dart files | snake_case; providers end with `_provider.dart`, screens with `_screen.dart` | `pick_task_screen.dart`, `cart_provider.dart` |
| Flutter features | snake_case folder per feature with `data/`, `domain/`, `presentation/` | `features/proof_of_delivery/` |
| ADRs | `docs/adr/NNNN-title-in-kebab-case.md` | `docs/adr/0003-conditional-update-for-reservations.md` |
