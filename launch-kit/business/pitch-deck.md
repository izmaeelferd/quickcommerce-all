# FeastFlow: Investor Pitch Deck (15 slides)

> **How to use:** each slide has a **title**, **on-slide content** (keep it this short on the slide), a **visual** suggestion and **speaker notes** (what you say). Everything in `[BRACKETS]` is a placeholder for **your** verified data. Never replace a placeholder with a number you cannot source. Unit-economics figures are **illustrative**, computed from FeastFlow's default business rules (see `unit-economics.md`), and must be labelled that way on the slide.
>
> **Where to find market data for the placeholders:**
> - **Government / official:** national statistics office household consumption surveys (India: MoSPI's Household Consumption Expenditure Survey), census and urban population data, FSSAI licence and registration counts by state, GST registration data for restaurants, internet and smartphone subscriber reports from the telecom regulator (India: TRAI), and digital payments volume from the payments body (India: NPCI's UPI statistics).
> - **Industry reports:** the national restaurant association's annual food services report (India: NRAI India Food Services Report), management-consultancy and VC reports on online food delivery and quick commerce, investment-bank equity research on listed food-delivery companies, and listed aggregators' annual reports and shareholder letters (for GOV, AOV, take rate and contribution margin disclosures).
> - **Primary research:** your own survey of [N] restaurants and [N] consumers in [CITY], and pilot data.
>
> Cite the source and year in small print on every slide that uses a market number.

---

## Slide 1: Title
**On-slide content**
- **FeastFlow**
- Food delivery built for [CITY], fair to restaurants, fast for customers
- [FOUNDER NAME], [TITLE] · [CONTACT EMAIL] · [MONTH YEAR]

**Visual:** full-bleed food photo with the FeastFlow logo, plus phone mockups of the three apps (customer, Partner, Rider) in brand colours.

**Speaker notes:** "We're FeastFlow, a food-delivery platform for [CITY]. Our full stack is built and in [STATUS: soft launch / pilot / pre-launch]: customer app, restaurant app and dashboard, rider app and an admin console. We're raising [AMOUNT] to win [CITY] before we expand."

---

## Slide 2: Problem
**On-slide content**
- **Restaurants:** high commissions to large aggregators [SOURCE: typical commission range reported by restaurant association surveys], little control over pricing, discounts imposed on them, delayed payouts.
- **Customers in [CITY / TIER]:** limited selection, high fees, long ETAs outside metro cores.
- **Riders:** opaque pay, unclear per-km earnings, tips not always visible.

**Visual:** three columns (Restaurant / Customer / Rider), each with an icon and one pain line. Optional quote cards from your interviews: "[RESTAURANT OWNER QUOTE, name and permission required]".

**Speaker notes:** Open with what you heard in the field. "We spoke with [N] restaurant owners in [AREA]; [X] of them said [FINDING]." Use only your own interview data or cited reports. Make the point that the market is consolidated and the incumbents are optimised for metros, not for [CITY].

---

## Slide 3: Solution
**On-slide content**
- **One platform, three apps + two web consoles**
  - **FeastFlow** (customers): discover, order, pay by UPI/card/wallet/COD, track live
  - **FeastFlow Partner** (restaurants): app + web dashboard: accept orders, manage menu, see payouts, reply to reviews
  - **FeastFlow Rider** (delivery): auto-assigned orders, navigation, OTP handover, transparent earnings
  - **Admin console:** every fee, commission, coupon and screen configurable live
- Transparent, configurable commission with per-restaurant launch offers

**Visual:** hub-and-spoke diagram with FeastFlow at the centre and Customer / Restaurant / Rider / Admin around it, arrows labelled "order", "payout", "live location".

**Speaker notes:** Stress that this is not a prototype: order lifecycle, payments (Razorpay/Stripe + wallet + COD), live tracking over sockets, push/SMS/email notifications and multi-language support (English, Hindi, Spanish, Arabic with RTL, French) are built. The differentiator for restaurants is control and transparency. For us it's operating leverage: we can retune pricing city by city from the admin panel without shipping an app update.

---

## Slide 4: Product demo
**On-slide content**
- Customer: search, filters, veg-only → menu with add-ons → cart (tip, coupon, wallet) → pay → **live map tracking** → rate & review
- Restaurant: new order with **accept timer** (auto-rejects and refunds after 5 min) → preparing → ready
- Rider: online toggle → auto-assigned → pickup → **4-digit delivery OTP + photo proof**
- Admin: change delivery fee or theme → all apps update **instantly**

**Visual:** 4 phone screenshots in a row (Home, Cart bill breakdown, Live tracking, Partner order card with timer), or embed a 60–90 s screen recording. Optional QR code to a demo build.

**Speaker notes:** Run the live demo or video. Show a full order end-to-end with three devices. Finish with the "wow" moment: change the theme colour or turn on surge in Admin and watch the customer app update without a restart. Mention scheduled orders (Lunch/Snacks/Dinner slots), referral, dark mode, and maintenance and force-update screens for operations.

---

## Slide 5: Why now
**On-slide content**
- Digital payments are the default: [UPI MONTHLY TRANSACTIONS: NPCI, year]
- Smartphone and data reach in [CITY TIER]: [FIGURE: TRAI/telecom regulator, year]
- Restaurants want alternatives to concentrated aggregators: [SURVEY / NEWS: restaurant association statements, year]
- Building a full delivery stack now costs a fraction of what it once did (we built ours: [TIME / COST])

**Visual:** four tiles, each with one big number (placeholder) and a source line.

**Speaker notes:** Give each tile one sentence on why it matters to FeastFlow. Avoid claims you can't cite. If you have a local trigger (new IT park, college cluster, a competitor exiting), lead with it: "[LOCAL CATALYST]".

---

## Slide 6: Market
**On-slide content**
- **TAM:** [TAM: online food delivery spend, country, year: source, e.g. industry report on food services or online food delivery]
- **SAM:** [SAM: online food delivery spend in [STATE/REGION] tier-[X] cities: derive from TAM × urban population share (census) × online adoption (survey)]
- **SOM (3 yrs):** [SOM: our target GMV in [CITY] = target orders/day × AOV × 365]
- Restaurants in [CITY] with food licences: [FIGURE: FSSAI registration data / municipal data]

**Visual:** three concentric circles (TAM ⊃ SAM ⊃ SOM) with the formula for each written underneath.

**Speaker notes:** Investors care most about the SOM logic. Build it bottom-up: "[N] restaurants × [X]% onboarded × [Y] orders/day × ₹[AOV] = ₹[GMV] per year." Show the method, not just the number. State source and year for TAM and SAM out loud.

---

## Slide 7: Business model
**On-slide content**
| Stream | Default | Status |
|---|---|---|
| Commission on food value | 18% (configurable per restaurant) | Live |
| Delivery fee | ₹30 first 2 km + ₹8/km; free above ₹499 | Live |
| Surge fee | 1.5× delivery fee when enabled | Live |
| Platform fee | ₹0 at launch | Live |
| Featured listings & banners | Sold manually | Manual today → self-serve ads (roadmap) |
| Restaurant subscriptions | n/a | Roadmap |
- Pass-through, not revenue: packaging (to restaurant), tips (100% to rider), GST

**Visual:** a ₹ flow diagram of one order: customer pays → restaurant / rider / tax / FeastFlow.

**Speaker notes:** Everything in this table is a setting in our admin panel, so we can test pricing per market quickly. We deliberately keep the platform fee at zero for launch. Featured placement and banners exist in the product with click counters; today we sell them by hand to restaurants. A self-serve ad marketplace is on the roadmap.

---

## Slide 8: Unit economics (illustrative)
**On-slide content**
*Illustrative, platform defaults, ₹400 basket, 4 km, ₹20 tip, online payment:*
| | ₹ |
|---|---|
| Customer pays | 501.00 |
| → Restaurant (400 − 18% + ₹15 packaging) | 343.00 |
| → Rider (₹25 + 4 × ₹6 + ₹20 tip) | 69.00 |
| → GST | 20.00 |
| → Gateway (2%, assumption) | 10.02 |
| → Other variable (assumption) | 5.00 |
| **FeastFlow contribution / order** | **53.98 (13.5% of food value)** |
- Illustrative break-even: **~309 orders/day** at ₹[5,00,000] fixed cost/month (assumption)

**Visual:** waterfall chart from ₹501 down to ₹53.98.

**Speaker notes:** Be upfront: "These are model numbers from our default settings, not actuals." Explain that commission carries the margin, delivery is roughly break-even by design, and first-order coupons are treated as CAC. Then: "Our pilot actuals are [CM/ORDER ACTUAL] on [N] orders" once you have them. Have the spreadsheet in `unit-economics.md` ready for diligence.

---

## Slide 9: Traction
**On-slide content**
- Restaurants signed: **[N]** ([N] live) · pipeline **[N]**
- Riders approved: **[N]**
- Orders to date: **[N]**, week-on-week growth **[X]%**
- Repeat rate (30-day): **[X]%** · rating **[4.X/5 from X,XXX reviews]**
- LOIs / partnerships: [NAMES, with permission]

**Visual:** a line chart of weekly orders (from Finance → Reports) plus 3–4 KPI tiles. If pre-launch, use a milestone timeline instead ("product built → [N] LOIs → soft launch [DATE]").

**Speaker notes:** Use only real numbers from the admin Reports page or signed documents. If pre-launch, say so and show signed LOIs, waitlist sign-ups and the onboarding pipeline. Don't extrapolate.

---

## Slide 10: Go-to-market
**On-slide content**
1. **Supply first:** sign [TARGET N] restaurants in one zone ([AREA]) before launch. Launch offer: reduced commission for the first [N] months.
2. **Riders:** recruit [TARGET N] riders with transparent per-km pay + 100% tips.
3. **Demand:** WELCOME50 (50% off up to ₹150, first order), referral (₹50 + ₹50 wallet credit), FREEDEL, push broadcasts, local social channels, college and office tie-ups.
4. **Density, then expand:** hit [X orders/day] in zone 1 before opening zone 2.

**Visual:** a city map with zone 1 highlighted, plus a 3-phase timeline (Supply → Soft launch → Scale).

**Speaker notes:** Explain why density matters: shorter distances keep delivery cost below fee income (delivery breaks even at ~5.5 km on default settings). The tools for every GTM lever are already in admin: coupons with limits and first-order rules, banners with click tracking, push broadcasts, referral codes. Multi-city zone configuration is on the roadmap. For now each city runs as its own deployment.

---

## Slide 11: Competition
**On-slide content**
| | Large national aggregators | Local delivery services / restaurant-own delivery | **FeastFlow** |
|---|---|---|---|
| Commission | Typically high, non-negotiable [cite source] | Varies / none | 18% default, negotiable launch offers |
| Restaurant control | Limited | High | Accept timer, menu, timings, open/close, review replies, payout view |
| Selection | Very wide | Single restaurant | Curated local, growing |
| Local focus | Metro-first | Local | [CITY]-first ops & support |
| Tech | Mature | Basic | Full stack, runtime-configurable |

**Visual:** 2×2 positioning map. X axis "Restaurant-friendly (control, fees)", Y axis "Customer convenience (selection, tracking)". FeastFlow upper right; aggregators upper left; own-delivery lower right.

**Speaker notes:** Don't name or disparage competitors on the slide. Describe categories. Be honest that big aggregators have scale and selection. Our wedge is local density, partner economics and responsive local support. Our moat is relationships plus operational speed, helped by a stack we control.

---

## Slide 12: Roadmap
**On-slide content**
- **Now (built):** 3 apps + vendor dashboard + admin, payments, live tracking, coupons, referral, wallet, scheduled orders, 5 languages, featured & banners
- **Next [QUARTER]:** coupon co-funding with restaurants, COD cash ledger for riders, time-bound commission offers
- **Later [QUARTER]:** self-serve promoted listings (ads marketplace), multi-city zones, in-app chat, loyalty points
- **Exploring:** restaurant subscription plans, group ordering, meal subscriptions, AI search, WhatsApp Business API ordering, dine-in

**Visual:** 3-column timeline (Now / Next / Later) with icons.

**Speaker notes:** Be clear about what's built and what isn't. Each "Next" item directly improves unit economics or partner trust, and each "Later" item opens a new revenue stream (ads, subscriptions) or a new market (zones).

---

## Slide 13: Team
**On-slide content**
- **[FOUNDER 1 NAME]**, [ROLE]: [1-line relevant experience]
- **[FOUNDER 2 NAME]**, [ROLE]: [1-line relevant experience]
- **[KEY HIRE / OPS LEAD]**, [ROLE]: [experience]
- Advisors: [NAME, ROLE] (with consent)
- Hiring with this round: [ROLES]

**Visual:** headshots in a row with role and one-line credential. Logos of past employers only with permission.

**Speaker notes:** Explain why this team wins in [CITY]: local network, restaurant relationships, ops experience, tech ownership. Mention the open roles the round will fund.

---

## Slide 14: The ask & use of funds
**On-slide content**
- Raising **[AMOUNT]** ([INSTRUMENT: SAFE / equity / convertible note]) at [TERMS]
- Runway: **[N] months** to [MILESTONE: e.g. X orders/day, contribution-positive in zone 1, Y cities]
- Use of funds:
  - [X]% Customer acquisition (coupons treated as CAC, referral, local marketing)
  - [X]% Restaurant & rider onboarding (field team, launch incentives)
  - [X]% Product & engineering (roadmap items above)
  - [X]% Operations & support
  - [X]% Working capital & contingency (payout float, compliance)

**Visual:** donut chart of use of funds plus a milestone bar.

**Speaker notes:** Tie every rupee to a milestone. "With [AMOUNT] we reach [MILESTONE] by [DATE], which sets up the next round at [METRIC]." Have the detailed budget and the unit-economics sheet ready.

---

## Slide 15: Contact
**On-slide content**
- **FeastFlow**: [TAGLINE]
- [FOUNDER NAME] · [EMAIL] · [PHONE]
- [WEBSITE URL] · Demo: [APP LINK / QR]
- [COMPANY LEGAL NAME], [REGISTERED ADDRESS]

**Visual:** logo, QR code to download the app or watch the demo video, and a single hero food photo.

**Speaker notes:** "Thank you. We'd love to show you a live order on your own phone." Offer to share the data room: deck, unit-economics model, product demo, vendor pipeline.

---

## Appendix slides (optional, for diligence)
- **A1. Pricing levers:** full Business Rules table (commission, delivery fee, surge, platform fee, packaging, min order, COD cap, wallet cap). Source: `revenue-model.md`.
- **A2. Delivery economics by distance:** the table from `revenue-model.md` section 3.2.
- **A3. Tech architecture:** Node.js/Express + MongoDB + Socket.io, Flutter (3 flavours from one codebase), React admin and vendor web, Docker/PM2 deploy, Razorpay/Stripe, FCM, Twilio.
- **A4. Compliance:** GST registration and e-commerce operator obligations, FSSAI checks on partners, DPDP Act 2023 privacy notice, grievance officer: [STATUS].
- **A5. Cohorts:** retention by signup week (once data exists).

## Design checklist
- [ ] Brand colours and font match Admin → Theme/Branding
- [ ] Every market number has source + year in footnote
- [ ] "Illustrative" label on slides 8 and A1/A2
- [ ] No competitor logos; no unverified claims ("fastest", "cheapest")
- [ ] Export to PDF; file name `FeastFlow_Deck_[MONTH-YEAR].pdf`
