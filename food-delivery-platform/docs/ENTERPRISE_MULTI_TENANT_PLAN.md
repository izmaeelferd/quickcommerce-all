# Enterprise Resale Plan: Multi-Tenant, Multi-Region, Zero-Hardcoding

**Status:** proposal. Nothing in this document is implemented yet unless a row says "exists today".
**Scope:** turn the current single-tenant platform into a resaleable source package where one deployment can serve many isolated businesses (tenants), each with its own brand, region, currency, tax rules and providers, and where a buyer can install it through a first-run wizard.

---

## 0. Where the codebase stands today

The platform already externalizes most *business* behavior. The work ahead is mainly about **scoping** that configuration per tenant and moving the remaining environment-level settings into it.

| Area | Today | Gap for enterprise resale |
|---|---|---|
| Runtime config | Singleton `AppConfig` (`key: 'main'`) deep-merged over `config/defaultConfig.js`, edited in the Admin Panel, pushed live via `config:updated` | One config for the whole deployment; no tenant or region scope |
| Config cache | In-process object in `utils/configCache.js` (short TTL) | Not shared across API instances; no per-tenant keys |
| Strings | `Translation` collection per language, dotted keys, seeded from `seeders/translations` | No per-tenant overrides; no pluralization or ICU message format |
| Money | `utils/pricing.js` computes with floating-point numbers and `round2` | Floats are unsafe for multi-currency; currencies with 0 or 3 decimals break |
| Tax | One `businessRules.taxPercent` applied to food only | No jurisdictions, tax components, inclusive pricing or rate history |
| Payments | `config/payments.js` picks Razorpay or Stripe from **environment** variables | Credentials are per deployment, not per tenant |
| Storage | Local disk or S3 chosen by `UPLOAD_DRIVER` env | No per-tenant isolation of files |
| Home layout | Fully dynamic, validated by `utils/layoutSections.js` | Ready; only needs tenant scoping |
| Background jobs | In-process scheduler, single-instance guard via `RUN_SCHEDULER` | Needs a distributed lock or a dedicated worker at scale |
| Install | `scripts/setup.sh`, `docker-compose.yml`, seed script, env files | No first-run web installer |

---

## 1. Configuration architecture

### 1.1 The four layers

Every setting belongs to exactly one layer. A value is resolved top-down, and the first layer that defines it wins:

```
4. Tenant config        Admin Panel (tenant admins)     brand, theme, fees, flags, layout, legal pages
3. Region pack          Admin Panel (platform owner)    currency, tax rules, locale formats, address format, compliance texts
2. Platform defaults    Code (packages/config/defaults) safe fallbacks for every key, versioned with the code
1. Infrastructure env   Environment / Docker secrets    DB URI, Redis URL, master encryption key, public base URL
```

Rules that keep this from decaying:

- **Layer 1 is infrastructure only.** Anything a business operator might change at runtime (payment keys, SMTP, SMS sender, tax rates) moves out of env into layer 3 or 4. The only secrets left in env are the ones needed *before* the database can be read.
- **Layer 2 is the only place defaults live.** No literal business values inside controllers, widgets or React pages. `config/defaultConfig.js` already plays this role. It becomes a typed schema (section 1.2).
- **Every read goes through one resolver**, `config.get(tenantId, 'businessRules.deliveryFee.base')`. That makes it possible to audit what is configurable and to cache it in one place.

### 1.2 Typed, versioned config schema

Replace the hand-written Mongoose sub-schema plus `defaultConfig.js` with **one schema definition** that produces everything else:

- Define the config shape once with **zod** (or JSON Schema + Ajv) in `packages/config/schema.ts`. Each field carries its default, its validation, a UI hint (`color`, `money`, `percent`, `richText`, `select:[...]`) and its scope (`platform | region | tenant`).
- Generate from it:
  - server-side validation for every `PUT /admin/config/*` (replacing the per-section rules in `middleware/validation.js` and extending what `utils/layoutSections.js` already does for layouts);
  - TypeScript types for the admin panel and vendor dashboard;
  - a Dart model for Flutter via a small code generator (json_serializable input), so `models/app_config.dart` stops being hand-maintained;
  - the Admin Panel forms themselves. A generic `<ConfigForm section="businessRules" />` renders fields from UI hints, so adding a setting needs no new page.
- Store `schemaVersion` on each config document. Write **migrations** (`migrations/config/0007-split-tax-rules.js`) that upgrade stored documents when the schema changes. A buyer upgrading from v1.3 to v1.4 then runs one command and keeps their data.

### 1.3 Environment variables (layer 1 only)

Final list after the move, everything else being runtime config:

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT`, `PUBLIC_BASE_URL` | Runtime and URL building |
| `MONGODB_URI` | Database |
| `REDIS_URL` | Cache, rate limits, Socket.io adapter, job locks |
| `MASTER_KEY` (or `MASTER_KEY_FILE`) | Envelope encryption for tenant secrets (section 2.4) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (or `_FILE`) | Token signing. Kept here because rotation needs a restart anyway. |
| `STORAGE_DRIVER`, `S3_*` | Object storage endpoint for the platform bucket |
| `INSTALL_TOKEN` (optional) | Pre-sets the installer token for unattended installs |
| `RUN_SCHEDULER` | Job runner role (exists today) |

Conventions:
- Every secret supports a `*_FILE` variant so Docker/Kubernetes secrets work without plain env values.
- `config/env.js` keeps its production fail-fast check (exists today) and extends it to the new variables.

### 1.4 Localized strings

Today: `Translation { code, strings: Map }`, with the requested language merged over the default.

Target:

- **Key catalog in code.** `packages/i18n/keys.json` lists every key with a description and an English source string. CI fails if code references a key that isn't in the catalog, or if the catalog has keys no code uses. A version of this check was run during the audit; it becomes a permanent CI step.
- **Three merge levels.** Resolution goes tenant override → platform language pack → English source. Tenants change only the strings they care about and still receive new keys on upgrade.
  - New collection `TranslationOverride { tenantId, locale, key, value }`.
  - Platform packs stay in `Translation`.
- **ICU MessageFormat** for plurals, gender and selects, e.g. `{count, plural, one {# item} other {# items}}`.
  - Server and web: `intl-messageformat`.
  - Flutter: the `intl` package's `Intl.message`, or a small ICU parser in `TranslationManager`.
  - Existing `{name}` placeholders stay valid because ICU accepts them.
- **Locale-aware formatting from data, not code.** Dates, numbers and currencies always go through `Intl` / `NumberFormat` with the region pack's locale. `core/formatters.dart` already does this for money. Admin and vendor web get the same through `Intl.NumberFormat`.
- **RTL** is already supported (`isRTL` on languages). Keep it a property of the language pack.
- **Translator workflow.** Export and import languages as XLIFF or JSON from the Languages page, so buyers can use Crowdin or Lokalise.

### 1.5 Currencies and money

1. **Integer minor units everywhere.** Store every amount as an integer in minor units with its ISO 4217 code: `{ amount: 49900, currency: 'INR' }`.
   - Implementation: a `Money` value object in `packages/money` with `add`, `multiply(rate, rounding)`, `allocate(ratios)` and `format(locale)`.
   - Use the `Intl.NumberFormat` currency data for decimals: JPY has 0, KWD has 3.
   - This replaces the float math and `round2` in `utils/pricing.js`. Payment gateways already expect minor units; `config/payments.js` converts today.
2. **Tenant currency, not platform currency.** Each tenant (or each tenant store, if stores span regions) has one settlement currency. Orders snapshot `currency`, and every stored amount carries it.
3. **Display currency (optional).** Show approximate prices in another currency using an FX rate table `FxRate { base, quote, rate, asOf }`, refreshed by a job. Always charge in the settlement currency and label converted prices as approximate.
4. **Rounding policy is config.** `region.rounding = { mode: 'halfEven' | 'halfUp', cashIncrement: 5 }`. Cash rounding applies only to cash-on-delivery totals, which some countries require.

### 1.6 Regional tax rules

Replace the single `taxPercent` with a **tax engine** fed by data.

```
TaxJurisdiction { _id, regionPackId, code: 'IN-KA', name, parentCode: 'IN' }
TaxCategory     { _id, tenantId|null, code: 'food_restaurant' | 'delivery_service' | 'packaging' | 'platform_fee' }
TaxRule {
  _id, jurisdictionCode, categoryCode,
  components: [ { code: 'CGST', rate: 0.025 }, { code: 'SGST', rate: 0.025 } ],
  priceMode: 'exclusive' | 'inclusive',
  rounding: 'perLine' | 'perInvoice',
  effectiveFrom, effectiveTo,           // rates change; history is required for audits
  conditions: { minAmount?, b2b? },
}
```

How it is used:
- Every priced thing gets a tax category: menu items (default from restaurant type), delivery fee, packaging fee, platform fee.
- `TaxService.compute(lines, { jurisdictionCode, at: orderTime })` returns per-line and per-component tax, using the rules valid at that moment.
- **Orders snapshot the computed tax** (components, rates and rule ids), exactly as they already snapshot pricing. Invoices and reports never recompute history.
- **Region packs ship starter rules.** Examples: India GST components, UK VAT inclusive, Gulf VAT 5%, US sales tax. Each is clearly labeled "verify with a tax advisor". US sales tax and EU OSS are complex enough that a buyer may plug in an external provider such as Avalara or TaxJar through the same `TaxProvider` interface (section 4.3).
- **Invoices** use a template per region (GST invoice fields, VAT number and so on), configured in the region pack and rendered to PDF by a worker.

### 1.7 Region packs

A region pack bundles everything that differs by country. Buyers install or extend packs instead of editing code.

```
RegionPack {
  code: 'IN' | 'AE' | 'GB' | ...,
  defaultLocale, supportedLocales,
  currency, rounding,
  addressFormat: { fields: ['line1','line2','city','state','postalCode'], postalCodeRegex, requiredFields },
  phone: { countryCode, e164Regex },
  taxJurisdictions, taxRules,
  compliance: {
    dataProtection: 'DPDP' | 'GDPR' | 'PDPL' | ...,
    consentTexts: { locale: html },
    requiredBusinessDocs: ['FSSAI', 'GSTIN'],   // drives vendor KYC form fields
    ageGate: { alcohol: 21 } | null,
  },
  paymentMethods: ['upi','card','cod'],         // what is offered in this region
  units: { distance: 'km' | 'mi' },
}
```

Packs ship as JSON in `packages/region-packs/<code>/` and are imported by the installer or from the Admin Panel. Once imported, the platform owner edits them in the database, and upgrades merge new keys without overwriting edited ones.

---

## 2. Multi-tenant and white-labeling framework

### 2.1 Choosing the isolation model

| Model | Isolation | Cost and operations | When to use |
|---|---|---|---|
| **A. Shared database, `tenantId` on every document** | Logical (enforced in code) | Cheapest; one migration path | Default for SaaS resale with many small tenants |
| **B. Database per tenant** (same cluster) | Strong; per-tenant backup and restore | Connection pool per tenant; migrations run N times | Enterprise tenants with contractual isolation |
| **C. Deployment per tenant** | Full | Highest; one stack per customer | Buyers who self-host for a single brand |

**Recommendation:** build A, with the data-access layer written so that B is a configuration switch (`tenant.isolation = 'shared' | 'dedicated'`). C works automatically, because a single-tenant install is simply A with one tenant. This gives buyers all three sales options from one codebase.

### 2.2 Data model

New platform-level collections (no `tenantId`):

```
Tenant {
  _id, slug, name, status: 'trial' | 'active' | 'suspended' | 'closed',
  isolation: 'shared' | 'dedicated', dbName?,
  regionPackCode, settlementCurrency, defaultLocale,
  domains: [{ host: 'order.brand.com', verified: bool, primary: bool }],
  plan: { code, limits: { restaurants, ordersPerMonth, adminSeats } },
  createdAt, ownerUserId
}
PlatformUser { _id, email, passwordHash, role: 'platform_owner' | 'platform_support', mfa }
TenantSecret { tenantId, provider: 'razorpay' | 'stripe' | 'twilio' | 'smtp' | 'fcm' | 's3', ciphertext, keyVersion, updatedAt }
AuditLog     { tenantId|null, actorId, action, target, before, after, ip, at }
Installation { _id: 'singleton', installedAt, version, schemaVersion }
```

Changes to existing collections: **every** business collection gets `tenantId` (an indexed ObjectId, required). That covers User, Restaurant, MenuCategory, MenuItem, Order, Transaction, Coupon, Banner, Category, Review, DeliveryPartner, Notification, AdminRole, Translation overrides and AppConfig.

- `AppConfig` changes from `key: 'main'` to `tenantId` (unique).
- Uniqueness becomes per tenant:
  - users: `{ tenantId, email }` and `{ tenantId, phone }` unique. The same person can be a customer of two brands.
  - coupons: `{ tenantId, code }` unique.
  - restaurants: `{ tenantId, slug }` unique.
  - order numbers: `{ tenantId, orderNumber }` unique.
- Geo indexes become compound where queries filter by tenant: `{ tenantId: 1, location: '2dsphere' }`.
- `ensureIndexes()` (exists today) creates these at startup.

**Migration from today:** a migration creates one default tenant, backfills `tenantId` on every document, rewrites unique indexes, and converts the `main` config into that tenant's config. Existing single-brand installs keep working unchanged.

### 2.3 Enforcing isolation (defense in depth)

1. **Tenant resolution middleware.** It runs first on every request and resolves the tenant from, in order:
   - the `Host` header (custom domain or `<slug>.platform.com`);
   - an `X-Tenant` header, for mobile apps whose build pins a tenant;
   - the signed JWT claim `tid`, which must match.

   Unknown or suspended tenants get 404 or 403 before any handler runs.
2. **Request-scoped context.** Use `AsyncLocalStorage` to hold `{ tenantId, tenant, locale }`, so services never take `tenantId` as a loose parameter.
3. **A Mongoose plugin enforces scope automatically.**
   - Every `find`, `count`, `aggregate`, `update` and `delete` on tenant-scoped models gets `tenantId` injected from the context.
   - Every `save` stamps it.
   - Aggregations get a `$match` prepended. `$geoNear` must stay the first stage, so the plugin adds `tenantId` to its `query` instead.
   - Any query without a tenant context throws, except in code wrapped in an explicit `runAsPlatform(() => ...)` for platform jobs.
4. **Tokens are tenant-bound.** JWTs carry `tid`, and a token from tenant A is rejected on tenant B's host.
5. **Sockets are tenant-scoped.** Room names are prefixed `t:<tenantId>:...`, and broadcasts such as `config:updated` go only to that tenant's room. Today they go to everyone.
6. **Caches and files are tenant-keyed.**
   - Cache keys: `cfg:<tenantId>`, `tr:<tenantId>:<locale>`.
   - Object storage paths: `tenants/<tenantId>/...`.
7. **Isolation test suite.** For every API route, create data in tenants A and B and assert that A's credentials can never read or modify B's data. This runs in CI and is the most important test for resale credibility.

### 2.4 Tenant secrets

Payment, SMS, email, push and storage credentials are per tenant, entered in the Admin Panel, and never returned to the browser after saving (write-only fields with a "configured" indicator).

- **Envelope encryption:** each secret is encrypted with AES-256-GCM using a data key, and the data key is wrapped by `MASTER_KEY` (or by a cloud KMS key through a `KeyProvider` interface).
- `keyVersion` allows master-key rotation: a re-wrap job runs without downtime.
- **Provider factories** read credentials per request, e.g. `payments.for(tenant)` instead of the module-level `env.payments` used today. Clients are cached per `tenantId` + `keyVersion`.
- **Webhooks** include the tenant in the path (`/api/payments/webhook/:provider/:tenantSlug`) and are verified with that tenant's webhook secret.

### 2.5 White-labeling: web

- **Branding is tenant config** (it already is config): name, logos, favicon, colors, fonts, email templates, legal pages and support contacts.
- **Assets** are stored under `tenants/<tenantId>/branding/` in object storage and served through a CDN with immutable, content-hashed file names (`logo.3f9a1c.png`). Changing a logo then never fights browser caches.
- **One build serves every tenant.** The admin panel, vendor dashboard and customer web app are built once.
  - At load they call `GET /api/config`; the tenant is resolved from the host.
  - They apply the theme through CSS variables, which the Tailwind setup already uses (`rgb(var(--color-x))`).
  - `index.html` is served by a tiny edge handler that injects the tenant's title, favicon and meta tags, so link previews and the first paint are branded.
- **Custom domains:**
  1. The tenant adds `order.brand.com` in the admin panel.
  2. The platform shows the CNAME target.
  3. A verification job checks DNS.
  4. TLS is issued automatically by Caddy on-demand TLS (or Traefik with an ACME resolver), using an `ask` endpoint that only approves verified tenant domains.
- **Email templates** use MJML or Handlebars stored per tenant with platform defaults, and are rendered with the tenant's colors and logo.

### 2.6 White-labeling: mobile apps

App stores require each brand to be a separate app with its own store listing, and Apple guideline 4.2.6 expects white-label apps to be submitted from the **client's own developer account**. So mobile white-labeling is a **build pipeline**, not a runtime switch:

- **Tenant build manifest** `tenants/<slug>/mobile.json`:
  - application ids and bundle ids per flavor;
  - display names;
  - icon and splash sources;
  - `google-services.json` / `GoogleService-Info.plist` references;
  - `API_BASE_URL`;
  - store signing references (never the keys themselves).
- **CI job** (GitHub Actions or Codemagic) takes a tenant slug and:
  1. generates icons with `flutter_launcher_icons` and splash screens with `flutter_native_splash`;
  2. writes flavor resources (the Gradle `productFlavors` and xcconfig names already read app names from properties);
  3. builds AAB and IPA per flavor;
  4. uploads to the client's store accounts with fastlane.
- **Runtime branding stays dynamic:** theme, strings, layout and features already come from `/api/config`. The build only fixes identity (ids, icons, Firebase project).

### 2.7 Tenant lifecycle

| Stage | What happens |
|---|---|
| Provision | Platform owner (or self-signup) creates a tenant, which seeds its config from the chosen region pack, creates the tenant admin, default roles and translations |
| Configure | Tenant admin completes the onboarding checklist: branding, payment provider, domain, legal pages, first restaurant |
| Operate | Plan limits enforced in middleware; usage metered per month (orders, SMS, storage) |
| Suspend | Read-only, or blocked with a branded notice; data kept |
| Export / close | GDPR/DPDP-compliant export (JSON + uploads archive); hard delete after a retention period, run by a platform job |

---

## 3. Automated setup and deployment

### 3.1 First-run web installer

Goal: a buyer runs `docker compose up`, opens the URL and finishes setup in the browser without editing files beyond the minimal `.env`.

**Activation and security**

- On boot, the API checks the `Installation` document. If it's missing, the API enters **install mode**:
  - only `/install/*`, `/api/health` and static installer assets are served;
  - every other route returns 503 `system.notInstalled`.
- A one-time **setup token** is generated and printed to the container log, or taken from `INSTALL_TOKEN`. The wizard requires it. This blocks anyone who reaches the URL before the owner from claiming the install.
- When setup completes, the `Installation` document is written and install routes are permanently disabled. Re-running requires a CLI command (`npm run install:reset`) with shell access.

**Wizard steps** (each validated server-side and resumable)

| # | Step | Details |
|---|---|---|
| 1 | Setup token | Paste the token from the logs |
| 2 | System check | Node version, DB reachable and replica-set status (required for transactions), Redis reachable, storage writable, `PUBLIC_BASE_URL` reachable, clock skew, free disk |
| 3 | License | Enter purchase code; verify online, or offline with a signed license file (section 3.4) |
| 4 | Platform owner | Email, password (strength-checked), optional TOTP enrollment |
| 5 | Mode | Single brand (one tenant, tenant UI simplified) or multi-tenant SaaS |
| 6 | Region pack | Choose countries to enable; imports tax rules, currency, address format and consent texts |
| 7 | First tenant | Name, slug, default language, currency, logo and primary color (live preview) |
| 8 | Providers | Payments (Razorpay / Stripe / later others), SMTP, SMS, push (FCM service account), maps key. Each has a **Test** button; can be skipped and finished later from the Admin Panel |
| 9 | Demo data | Optional sample restaurants and menus, clearly marked and removable in one click |
| 10 | Finish | Summary, links to the admin panel and partner dashboard, mobile build instructions, "Secure your installation" checklist |

**Implementation notes**

- The installer is a separate small React app (`apps/installer`) served by the API only in install mode, so it adds nothing to the normal attack surface.
- Each step writes through the same services the Admin Panel uses (config, tenants, secrets). The installer is a guided front end, not a second code path.
- Every step is idempotent, so a refresh or a crash mid-install can resume.
- An **unattended mode** covers automation: `npm run install -- --config install.yaml` performs the same steps from a file.

### 3.2 Production Docker setup

```
compose.yaml
  services:
    proxy      Caddy 2: automatic HTTPS, on-demand TLS for tenant domains, HTTP/3, gzip/zstd
    api        Node API (N replicas), read-only root fs, non-root user, healthcheck /api/health
    worker     Same image, command "node worker.js": scheduler, emails/SMS, PDF invoices, imports
    web        Static admin / vendor / customer-web / installer builds (nginx or served by Caddy)
    mongo      MongoDB 7 replica set (1 node minimum, 3 recommended), or external Atlas
    redis      Redis 7: cache, rate limits, Socket.io adapter, BullMQ queues, locks
    migrate    One-shot: runs DB + config migrations, then exits; api/worker depend on it
    backup     Scheduled mongodump + uploads sync to S3-compatible storage, with retention
  profiles:
    default    proxy, api, worker, web, mongo, redis, migrate
    external   no mongo/redis (managed services)
    backup     adds backup
    observability  adds Prometheus, Grafana, Loki
```

Practices to keep, several of which exist today:
- Multi-stage builds.
- `npm ci --omit=dev`.
- Pinned base image digests.
- `HEALTHCHECK` in every image.
- Non-root user.
- `.dockerignore`.
- Ports bound to localhost behind the proxy.

New for enterprise:
- **Image per release** published to a registry with semver tags and an SBOM (`syft`), plus a vulnerability scan (`trivy`) in CI.
- **Secrets via `*_FILE`** and Docker secrets, never baked into images.
- **Zero-downtime upgrades:** `docker compose pull && docker compose up -d`. The `migrate` service runs first, and migrations must be backward compatible for one version (expand-then-contract).
- **Horizontal scale:**
  - API replicas are stateless: sessions are JWTs, the Socket.io Redis adapter handles fan-out, and Redis holds rate limits and cache.
  - Scheduled jobs run only in `worker`, with a Redis lock, which replaces the `RUN_SCHEDULER` flag.
- **Kubernetes path:** ship a Helm chart generated from the same images. It covers Deployments for api/worker, a Job for migrate, an Ingress with cert-manager, and HPA on CPU and request rate.
- **Observability:**
  - structured JSON logs carrying `tenantId` and `requestId`;
  - OpenTelemetry traces;
  - Prometheus metrics (request latency, order funnel, payment failures per tenant).
- **Backups:** nightly `mongodump --archive --gzip` plus an uploads sync. A **monthly automated restore test** into a scratch database checks that backups actually restore. The runbooks in `launch-kit/operations` already describe the manual version.

### 3.3 Upgrade path for buyers

- Semver releases with a CHANGELOG and an `UPGRADING.md` per minor version.
- `npm run migrate` (DB and config) is idempotent and records applied migrations in a `migrations` collection.
- The Admin Panel shows "Update available" by comparing `Installation.version` with a release feed. Only a notice; updates are never auto-applied.
- Customizations survive upgrades because they live in data (config, translations, region packs, templates) or in extension points (section 4.3), not in edited core files.

### 3.4 Licensing for resale

- **Purchase code verification** at install, and optionally on a weekly heartbeat, against your license server.
- **Offline license:** a signed JSON license (Ed25519) containing buyer, domain(s), tier and expiry, verified locally with your public key.
- **Degrade gently:** an invalid license shows an admin banner. It never breaks customer ordering, because breaking a buyer's live business creates legal and reputational risk.
- **Tiers by feature flag:** multi-tenant mode, white-label mobile pipeline, external tax providers. These flags are read from the license, never from editable config.
- Don't rely on obfuscation; the source package is the product. Use the license agreement plus the purchase-code check.

---

## 4. Production-ready code structure

### 4.1 Monorepo layout

```
feastflow/
├── apps/
│   ├── api/                      Node + Express (or Fastify) HTTP + Socket.io
│   │   ├── src/
│   │   │   ├── main.ts           Bootstrap: env → db → redis → modules → server
│   │   │   ├── core/             Cross-cutting kernel (no business logic)
│   │   │   │   ├── tenancy/      resolveTenant middleware, AsyncLocalStorage context, mongoose tenant plugin
│   │   │   │   ├── config/       resolver (env → defaults → region → tenant), cache, change events
│   │   │   │   ├── i18n/         message lookup, ICU formatting
│   │   │   │   ├── money/        re-export of packages/money
│   │   │   │   ├── security/     auth, RBAC, rate limits, sanitize, audit log
│   │   │   │   ├── errors/       DomainError hierarchy → HTTP mapping
│   │   │   │   ├── events/       in-process bus + outbox for cross-module events
│   │   │   │   └── observability/ logger, metrics, tracing
│   │   │   ├── modules/          One folder per bounded context
│   │   │   │   ├── catalog/      restaurants, menus, categories
│   │   │   │   ├── ordering/     cart, quote, orders, state machine
│   │   │   │   ├── pricing/      fees, coupons, surge
│   │   │   │   ├── tax/          TaxService + providers
│   │   │   │   ├── payments/     PaymentService + providers + webhooks
│   │   │   │   ├── wallet/
│   │   │   │   ├── delivery/     riders, assignment, tracking
│   │   │   │   ├── notifications/ push, email, SMS, in-app
│   │   │   │   ├── identity/     users, sessions, OTP, social login
│   │   │   │   ├── tenants/      provisioning, domains, plans, secrets
│   │   │   │   ├── content/      layout, banners, legal pages, translations
│   │   │   │   ├── reporting/
│   │   │   │   └── install/      first-run wizard API
│   │   │   └── jobs/             schedulers and queue processors (run by worker)
│   │   └── test/                 unit, integration (testcontainers), tenant-isolation, e2e
│   ├── worker/                   Thin entry that loads apps/api modules' job processors
│   ├── admin-web/                React + Vite: platform owner and tenant admin
│   ├── vendor-web/               React + Vite: restaurant partners
│   ├── customer-web/             Optional web ordering (same config-driven layout)
│   ├── installer/                First-run wizard (React)
│   └── mobile/                   Flutter: flavors customer / vendor / delivery
├── packages/                     Shared, versioned, framework-agnostic
│   ├── config/                   Config schema (zod) → types, validators, defaults, form hints
│   ├── i18n/                     Key catalog + English source + platform language packs
│   ├── money/                    Money value object, currency data, rounding
│   ├── region-packs/             IN, AE, GB, US, ... JSON packs
│   ├── api-client/               Typed client generated from OpenAPI
│   └── ui/                       Shared React components, icon set, design tokens
├── infra/
│   ├── docker/                   Dockerfiles, compose.yaml, Caddyfile
│   ├── helm/                     Kubernetes chart
│   └── ci/                       Pipelines: test, build images, SBOM, scan, mobile white-label builds
├── migrations/                   DB + config migrations (ordered, idempotent)
├── tenants/                      Mobile white-label manifests (one folder per brand)
├── docs/                         Install, configuration, extension guide, API (OpenAPI), runbooks
└── tools/                        Code generators (Dart config model), i18n checker, license tools
```

Mapping from today's repo: `backend/` becomes `apps/api`, `admin-panel/` becomes `apps/admin-web`, `vendor-dashboard/` becomes `apps/vendor-web`, `flutter-apps/` becomes `apps/mobile`, and `launch-kit/` stays as sales and operations material outside the product code.

### 4.2 Inside a module

```
modules/ordering/
├── ordering.routes.ts        HTTP wiring only: path, auth, permission, validator, controller
├── ordering.controller.ts    Translates HTTP ⇄ service calls; no business rules
├── ordering.service.ts       Business rules; depends on repositories and other modules' public APIs
├── ordering.repository.ts    All persistence; only file that touches the Mongoose model
├── ordering.model.ts         Mongoose schema (tenant plugin applied)
├── ordering.schemas.ts       zod request/response schemas → validation + OpenAPI
├── ordering.events.ts        Events this module emits (OrderPlaced, OrderDelivered, ...)
├── order-state-machine.ts    Pure functions (exists today as utils/orderFlow.js)
├── index.ts                  The module's public API — other modules import only this
└── __tests__/
```

Rules, enforced with `eslint-plugin-boundaries` or dependency-cruiser in CI:
- Modules import each other only through `index.ts`.
- Controllers never import models.
- `core/` never imports from `modules/`.
- Business rules contain no literals for money, rates, durations or texts. They read config, or constants declared in the config schema.
- Errors are typed: `throw new OrderNotCancellable(order.status)`, mapped centrally to an HTTP status and a translation key. The API already returns translation keys as messages; this keeps it.

### 4.3 Extension points for buyers

Buyers customize without forking core files. Each extension point is a typed interface with a registry:

| Interface | Built-in implementations | Example buyer extension |
|---|---|---|
| `PaymentProvider` | Razorpay, Stripe | PayTabs, Mercado Pago, Paystack |
| `TaxProvider` | Rule engine (section 1.6) | Avalara, TaxJar |
| `SmsProvider` | Twilio | MSG91, Unifonic |
| `EmailProvider` | SMTP | SES, SendGrid API |
| `PushProvider` | FCM | OneSignal |
| `StorageProvider` | Local, S3-compatible | Azure Blob, GCS |
| `MapsProvider` | Google | Mapbox, HERE |
| `DispatchStrategy` | Nearest available rider | Batching, zone-based |
| `HomeSection` (web + mobile) | All home section types, including custom content | New section type with its own renderer |

Plugins live in `plugins/<name>/`. They register through a manifest (`plugin.json`: name, version, provides, config schema) and are enabled per tenant in the Admin Panel. Their config fields appear automatically, because forms are generated from the config schema (section 1.2).

### 4.4 Quality gates for a sellable package

| Gate | Tooling | Required to release |
|---|---|---|
| Types and lint | TypeScript strict, ESLint, `flutter analyze` | Zero errors |
| Unit and integration tests | Vitest/Jest + testcontainers (Mongo, Redis); Flutter tests | Coverage ≥ 80% on `modules/pricing`, `tax`, `payments`, `ordering` |
| Tenant isolation suite | Generated per-route tests (section 2.3) | 100% pass |
| End-to-end | API e2e (exists today: 21 steps) + Playwright for admin, vendor and customer web | Pass on a fresh install via the installer |
| Hardcoding scan | Custom checker: literal currency symbols, rates, hex colors, user-facing strings outside i18n | Zero findings |
| i18n completeness | Key catalog check (section 1.4) | No missing keys in shipped languages |
| Security | `npm audit`, trivy, OWASP ZAP baseline against staging, dependency licenses | No high/critical |
| Docs | Install, upgrade, configuration reference (generated from schema), API (OpenAPI), extension guide | Updated for the release |

---

## 5. Delivery roadmap

Effort is in engineer-weeks for a team familiar with this codebase. Phases 1–3 are the minimum to sell multi-tenant; phase 4 onward broadens the market.

| Phase | Scope | Effort | Exit criteria |
|---|---|---|---|
| **1. Foundations** | Monorepo move; config schema (zod) with generated validators/types; `Money` with integer minor units replacing float pricing; DB/config migration framework | 4–5 | All existing e2e steps pass on the new structure; pricing tests cover 0/2/3-decimal currencies |
| **2. Tenancy core** | `Tenant` model; tenant resolution; AsyncLocalStorage context; Mongoose tenant plugin; per-tenant config and cache in Redis; tenant-scoped sockets; default-tenant backfill migration; isolation test suite | 5–6 | Isolation suite green on every route; existing single-brand installs upgrade without data loss |
| **3. Tenant secrets and providers** | Envelope encryption; provider factories per tenant (payments, SMS, email, push, storage); per-tenant webhooks; write-only secret UI | 3 | Two tenants with different Razorpay/Stripe accounts complete paid orders and refunds |
| **4. Regional engine** | Region packs; tax engine with components, inclusive pricing and history; address/phone formats; ICU messages; translation overrides; invoice templates | 5–6 | IN, AE and GB packs produce correct tax on reference orders verified by an accountant |
| **5. Installer and deployment** | Install mode + token; wizard app; unattended install; compose with Caddy, Redis, worker, migrate, backup profiles; Helm chart; release pipeline with SBOM and scan | 4 | A clean VM goes from `docker compose up` to a live paid order through the wizard in under 30 minutes |
| **6. White-label at scale** | Custom domains with on-demand TLS; branded HTML shell; email templates; mobile white-label CI pipeline with fastlane | 4 | A second brand runs on its own domain and ships its own signed apps from the pipeline |
| **7. Commercial packaging** | Licensing (online and offline); plan limits and metering; platform-owner console; docs site; demo instance | 3 | Package passes all quality gates in section 4.4 |

**Total:** about 28–31 engineer-weeks. With two engineers working in parallel after phase 1, that is roughly 4–5 months.

### Risks and how to contain them

| Risk | Mitigation |
|---|---|
| A missed `tenantId` filter leaks data between tenants | The plugin enforces it by default; queries without context throw; isolation suite in CI; audit log on cross-tenant platform actions |
| Money migration changes historical totals | Convert stored amounts once with a reviewed migration; snapshots are immutable; reconciliation report before and after |
| Tax rules are legally wrong for a market | Packs are labeled as starting points; per-tenant overrides; external `TaxProvider` option; buyer acknowledgment in the installer |
| Upgrades break buyer customizations | Customization only through data, plugins and extension points; semver with expand-then-contract migrations |
| App store rejection for white-label apps | Each brand ships from its own developer account, with distinct content and branding (the pipeline enforces separate ids) |
| Socket and scheduler behavior with many API replicas | Redis adapter for Socket.io; jobs only in `worker` with distributed locks |

---

## 6. Immediate next steps

1. Approve the isolation model (shared database with a dedicated-database switch) and the four config layers.
2. Start phase 1 with the `Money` refactor of `utils/pricing.js` and the config schema. Both reduce risk for everything after them.
3. Write the tenant isolation test harness *before* adding `tenantId`, so every later change is measured against it.
