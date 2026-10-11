# Configuration Guide — how the dynamic system works

Nothing a user sees is compiled into an app. Colors, texts, layout, feature visibility, prices and rules live in MongoDB and are edited in the Admin Panel.

```
 Admin Panel ──PUT /api/admin/config/*──> Backend (MongoDB) ──GET /api/config──> Customer / Vendor / Delivery apps,
      ▲                                       │                                   Vendor dashboard, Admin panel
      └────────── live preview ───────────────┴── socket "config:updated" ──────> apps reload instantly
```

## 1. Sources of truth

| What | Stored in | Edited at | Consumed by |
|---|---|---|---|
| Theme (colors, font, radii, logos, splash) | `appconfigs.theme` | Theme Editor | Flutter `DynamicTheme.build()`, web CSS variables (`applyTheme`) |
| Branding (names, contacts, socials) | `appconfigs.branding` | Branding | Splash, login, settings, emails |
| Home layout | `appconfigs.homeLayout[]` | Home Layout Builder | Flutter `SectionRenderer` iterates enabled sections by `order` |
| Banners | `banners` collection | Banner Manager | `BannerWidget` (only active & in schedule window) |
| Features | `appconfigs.features` | Feature Flags | `FeatureGate`, `cfg.feature('x')` in every screen, router guard `FeatureRoute` (deep links to a disabled screen show *unavailable*); enforced server-side too |
| Business rules | `appconfigs.businessRules` | Business Rules / Commission | **Server** pricing (`utils/pricing.js`), cart UI, payouts, cancellation |
| Strings | `translations` collection | Language Manager | `tr('key')` in Flutter, `t('key')` on the web |
| Legal pages | `appconfigs.legal` (HTML) | Legal Pages | `LegalScreen` (`HtmlWidget`) |
| Maintenance | `appconfigs.maintenance` | Maintenance Mode | API guard (HTTP 503) + maintenance screens |
| Onboarding & app versions | `appconfigs.onboarding/appVersions` | Settings | Onboarding screen, force-update dialog |
| Categories / cuisines | `categories` collection | Categories & cuisines | Category grid, cuisine row, search chips |

`backend/config/defaultConfig.js` only seeds the database and fills keys that are missing from the stored document. Flutter/web fallbacks are neutral values used for the few milliseconds before `/api/config` returns (and from the offline cache afterwards).

## 2. Request lifecycle

1. App launches → `GET /api/config` (cached locally for offline start) → `GET /api/config/translations/:lang`.
2. Theme is built from `theme`, strings are loaded into `TranslationManager`, currency into `Fmt`.
3. Maintenance (`maintenance.affectedApps` contains this app) → maintenance screen. Version below `appVersions.<app>.minVersion` → update dialog.
4. Admin saves a section → server updates MongoDB with a dot-path `$set` (partial updates never wipe sibling keys), bumps `version`, clears the cache, emits `config:updated`.
5. Apps listening on the socket call `/api/config` again and rebuild: colors, layout and texts change without a store release. If maintenance is switched on while an app is open, it jumps straight to the maintenance screen.

## 3. Home layout sections

| `type` | Renders | Useful options |
|---|---|---|
| `search` | Search bar | `titleKey` = placeholder key |
| `banner` | Auto-playing carousel | `filter.placement`, `style.autoplaySeconds`, `style.height` |
| `categories` | Category circles | `layout` grid/carousel, `columns`, `limit` |
| `cuisines` | Cuisine tiles | `layout`, `limit` |
| `offers` | Coupons with `showInOffers` | hidden when `features.coupons` is off |
| `restaurants`, `featured`, `topRated`, `nearby`, `custom` | Restaurant lists | `layout` list/grid/carousel, `limit`, `filter.cuisine/category/veg/minRating/sort/featured` |

Unknown types are ignored by older app builds, so new section types can be introduced safely.

## 4. Feature flags → behaviour

| Flag | Off means |
|---|---|
| `wallet` | Wallet screen, wallet toggle in cart and wallet payment hidden; API rejects wallet use |
| `coupons` | Offers section, coupon picker and `/coupons/*` disabled |
| `tipping` / `deliveryPartnerTips` | Tip card hidden / tips not passed to rider payout |
| `reviews`, `favorites`, `referral` | Respective screens & buttons hidden; endpoints return `feature.disabled` |
| `liveTracking` | Map hidden on tracking screen (timeline remains) |
| `chatWithVendor` | Restaurant call buttons hidden |
| `scheduleOrder` | Delivery slots hidden; scheduled orders rejected |
| `vegOnlyFilter`, `searchFilters` | Filter chips hidden |
| `googleSignIn`, `appleSignIn`, `otpLogin` | Buttons hidden; endpoints refuse |
| `push/email/smsNotifications` | Channel muted server-wide |
| `deliveryOtp`, `deliveryPhotoProof` | Rider completion requirements |
| `onboarding`, `darkModeToggle` | Intro slides / appearance switch |

## 5. Translations

* Every UI string is a dotted key, e.g. `cart.proceed` → `"Proceed to pay · {total}"`. Placeholders `{name}` are interpolated by the client.
* The server merges the requested language over the default language, so partially translated languages work.
* Backend error/success messages are keys too (`coupon.expired`), so API errors are translated in the app.
* Add a language: Language Manager → *Add language* (copy from English) → translate (use *Only missing*) → *Enabled*. Mark RTL for Arabic/Hebrew/Urdu — apps switch text direction.
* Add a key used by a custom section: *Add key*, then reference it as the section's `titleKey`.

## 6. Money rules (server-side only)

Prices are always recomputed on the server (`POST /orders/quote` and `POST /orders`), never trusted from the client. See the formula in `API_DOCUMENTATION.md §5`. Each order stores a snapshot of fees, commission and payouts, so changing rules affects only new orders.

Commission precedence: `restaurant.commissionPercent` (Commission page override) → `businessRules.commissionPercent`.

Operational rules (also in Business Rules → *Cancellations & dispatch*): `vendorAcceptTimeoutMinutes` (auto-reject unaccepted orders), `paymentTimeoutMinutes` (auto-cancel unpaid online orders), `etaBufferMinutes` + `etaMinutesPerKm` (ETA shown to customers), `deliveryOtpLength`.

## 7. Adding a new configurable thing (developer checklist)

1. Add the field to `models/AppConfig.js` and a fallback in `config/defaultConfig.js`.
2. Expose it in the relevant admin page (or a new one) using `useConfigSection('<section>')`.
3. Read it in apps via `AppConfig` (`flutter-apps/lib/models/app_config.dart`) / `useConfig()`.
4. Any new visible text → add a translation key to `backend/seeders/translations/en.js` and run `npm run seed` (adds missing keys without overwriting edits).
