# FeastFlow Launch Kit

Launch and growth materials for the food delivery platform in `food-delivery-platform/`.
"FeastFlow", "FeastFlow Partner" and "FeastFlow Rider" are placeholder names. The in-app name is set at runtime in **Admin Panel → Config → Branding**. Anything in `[BRACKETS]` is a placeholder for you to fill in. Nothing in this kit invents legal entities, user numbers, ratings, testimonials or market statistics.

Every number in this kit is a default from **Admin → Business Rules**. If you change a setting there, update the documents that quote it too (each document names the config key it relies on).

| Folder | What it contains |
|---|---|
| `store-listings/` | Google Play and App Store listings for Customer, Partner and Rider; screenshot overlay copy. Character limits were checked with a script. |
| `legal/` | Privacy policy (GDPR + India DPDP), terms, refund policy, vendor agreement, delivery partner agreement, cookie policy, disclaimer. `legal/html/` has pandoc-converted HTML to paste into **Admin → Legal Pages** (HTML mode). Remove the operator-note blockquotes first. These are templates, not legal advice. |
| `business/` | Pitch deck (slides + speaker notes), revenue model mapped to code and config, unit economics with formulas, week-by-week launch checklist, vendor onboarding script, rider recruitment posts. |
| `marketing/` | Social media kit (40 posts), 30-day launch campaign, coupon-engine promo recipes, 15 Google Ads variants, WhatsApp templates, press release. |
| `operations/` | Admin daily runbook, support playbook, incident response (Docker + PM2 commands), backup strategy, scaling roadmap. |
| `updates/` | `UPDATE_PROMPT.md` (reusable prompt for future AI sessions on this codebase), `CHANGELOG.md`, `feature-backlog.md` (90 ideas). |

## Decisions to make before launch (found while writing this kit)
1. **Who pays for coupons.** As coded, a discount reduces the restaurant's earnings (`vendorEarning = subtotal − discount − commission + packaging`). This includes platform-wide codes like WELCOME50. Decide on a policy and tell restaurants. See `business/revenue-model.md` and `marketing/promo-strategies.md`.
2. **Short-trip delivery margin.** With the default fees, the platform loses a little on delivery below about 5.5 km, and on every order that gets free delivery. Commission covers it. Tune this in Business Rules (`business/unit-economics.md`).
3. **Refund destination.** With the Wallet feature on (the default), refunds for cancelled orders go to the customer's wallet instantly. Turn the wallet off to refund to the original payment method instead. The refund policy is written to match the code.
4. **Manual processes.** Vendor and rider payouts are recorded by an admin. Cash-on-delivery money held by riders is not tracked in the app, so reconcile it daily.
5. **iOS Rider app.** Background location needs the Rider target's own Info.plist plus `--dart-define=IOS_BACKGROUND_LOCATION=true` (`docs/FLUTTER_BUILD_GUIDE.md`).
