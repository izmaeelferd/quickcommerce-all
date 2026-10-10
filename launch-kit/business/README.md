# FeastFlow Launch Kit: Business Documents

Business documents for launching **FeastFlow** (customer app), **FeastFlow Partner** (restaurant app + web dashboard) and **FeastFlow Rider** (delivery app). Every fee, commission and payout figure is tied to the actual platform code (`backend/utils/pricing.js`, `backend/controllers/orderController.js`, `backend/utils/orderFlow.js`) and the default **Business Rules** in the Admin Panel.

| File | What it is | Use it for |
|---|---|---|
| [pitch-deck.md](pitch-deck.md) | 15-slide investor deck: on-slide content, visual suggestions and speaker notes, plus appendix and design checklist | Fundraising, partner and bank presentations |
| [revenue-model.md](revenue-model.md) | Every revenue stream and pass-through mapped to config keys and admin pages, with a Live / Manual / Backlog status table | Pricing decisions, finance setup, explaining the model to your CA |
| [unit-economics.md](unit-economics.md) | Formulas, worked examples (standard, WELCOME50, free delivery, surge, COD), sensitivity table, CAC/LTV/payback, break-even, copy-paste spreadsheet | Modelling price changes, investor diligence |
| [launch-checklist.md](launch-checklist.md) | Week −8 to Week +4 checklist: legal, GST/FSSAI, payments, store accounts, deployment, admin config, supply, testing, soft launch | Running the launch project |
| [vendor-onboarding-script.md](vendor-onboarding-script.md) | Visit and phone scripts, objection handling, FAQ, document checklist, admin onboarding steps, commission negotiation guide | Restaurant sales / partnerships team |
| [delivery-recruitment-post.md](delivery-recruitment-post.md) | Long job post, WhatsApp/Facebook short posts (English + Hindi), poster text, earnings explanation, FAQ | Rider recruitment |

## Ground rules used in these documents
- **Placeholders:** anything in `[BRACKETS]` (company name, addresses, market sizes, traction, team, terms) must be filled with **your own verified data**. No market statistics are invented; the deck lists the kinds of source to use (government statistics, regulator data, industry association reports, listed companies' filings).
- **Illustrative numbers:** unit-economics examples use the platform defaults (18% commission; delivery fee ₹30 for 2 km + ₹8/km, free above ₹499; rider ₹25 + ₹6/km + 100% tips; packaging ₹15 to restaurant; platform fee ₹0; GST 5%) and labelled assumptions (2% gateway fee, ₹400 basket, 4 km). Replace them with actuals from **Admin → Finance → Reports**.
- **Only built features are promised.** Not built (roadmap/backlog): in-app chat, self-serve ads marketplace (featured flag + banners exist and are sold manually), vendor subscriptions, loyalty points, group ordering, meal subscriptions, AI search, WhatsApp Business API, dine-in, multi-city zones.
- **Not legal or tax advice.** Have a CA and a lawyer review GST/FSSAI/DPDP obligations, agreements and policies.

## Key findings from the code to act on before launch
1. **Coupons are vendor-funded as coded.** `vendorEarning = subtotal − discount − commission + packagingFee`, so platform-wide coupons such as WELCOME50 reduce the restaurant's payout. Choose and document a funding policy (revenue-model §4, vendor script §9).
2. **Delivery runs at a small loss below ~5.5 km on default settings** (the rider is paid per km from 0 km; the customer pays per km only beyond 2 km), and at a full loss on orders that qualify for free delivery (≥ ₹499). Commission funds it.
3. **Surge fee is kept 100% by the platform.** The rider payout formula ignores surge.
4. **Packaging fee goes 100% to the restaurant**, with no commission on it.
5. **COD cash has no in-app rider ledger.** Reconcile manually every day.
6. **Payouts are manual bank transfers** recorded in admin (wallet debit + bank reference). Commission overrides do not expire automatically.
7. **Tax is computed on food only.** Delivery, surge and platform fees are not taxed by the code; agree the GST treatment with your CA.

## Related technical docs (in the codebase)
`food-delivery-platform/docs/`: DEPLOYMENT_GUIDE, ENVIRONMENT_SETUP, CONFIGURATION_GUIDE, FLUTTER_BUILD_GUIDE, PLAY_STORE_DEPLOYMENT, APP_STORE_DEPLOYMENT, API_DOCUMENTATION, DATABASE_SCHEMA.
