# FeastFlow — Marketing Launch Kit

Marketing materials for launching **FeastFlow** (customer app), **FeastFlow Partner** (restaurants) and **FeastFlow Rider** (delivery) in **[CITY]**. Everything is grounded in what the platform actually does today: the coupon engine, banners, push/in-app/email/SMS broadcasts, referral, Business Rules and Feature Flags in the Admin Panel.

| File | What it is | Use it when |
|---|---|---|
| [launch-campaign.md](launch-campaign.md) | 30-day plan: readiness (T-21), pre-launch waitlist (T-14…T-1), launch week, referral push, habit & retention. Every action is mapped to its Admin Panel location and exact settings, with KPIs per phase and a 30-day review template. | Planning and running the launch day by day. |
| [promo-strategies.md](promo-strategies.md) | Coupon engine reference and field-by-field recipes: WELCOME50, FLAT100, FREEDEL, free-delivery-above-X, weekend, festivals (Diwali, Holi, Eid, Christmas, New Year), restaurant-specific, lunch slots, manual win-back, referral. Also covers surge, guardrails, budget math and how to measure results. | Creating any coupon or offer. |
| [social-media-kit.md](social-media-kit.md) | 40 launch posts (Instagram 10, X 10, LinkedIn 10, Facebook 10), each with copy, a visual brief and hashtag sets, plus brand voice, a posting calendar and community management notes. | Scheduling social content. |
| [google-ads-copy.md](google-ads-copy.md) | Campaign structure, 15 responsive search ads, shared assets, sitelinks, callouts, keyword groups, negative keywords, App campaign notes and a compliance checklist. | Building Google Ads. |
| [whatsapp-broadcast-templates.md](whatsapp-broadcast-templates.md) | 32 WhatsApp templates (22 UTILITY, 10 MARKETING) with `{{n}}` variables and a UTILITY/MARKETING category for each: order updates, offers, re-engagement, restaurant partners (onboarding, menu, payouts) and riders. Includes opt-in and compliance notes. | Messaging through a WhatsApp BSP or by hand. |
| [app-store-announcement-press-release.md](app-store-announcement-press-release.md) | Press release, boilerplate, fact sheet, store "What's New" copy, a media pitch email with a follow-up, and a target list. | PR and launch announcements. |

## Facts the kit relies on (change the copy if you change these)

| Item | Value | Where to change |
|---|---|---|
| WELCOME50 | 50% off, max ₹150, min ₹199, first order only, 1 per user | Admin → Finance → Coupons |
| FLAT100 | ₹100 off above ₹599, 3 per user | Admin → Finance → Coupons |
| FREEDEL | Free delivery above ₹249, 5 per user | Admin → Finance → Coupons |
| Free delivery threshold | Above ₹499 | Config → Business Rules → deliveryFee.freeAbove |
| Delivery fee | ₹30 for the first 2 km, then ₹8/km | Business Rules → deliveryFee |
| Referral | ₹50 to the new user at sign-up, ₹50 to the referrer when the friend's first order is delivered | Business Rules → refereeBonus / referralBonus; Feature Flags → referral, wallet |
| Rider tips | Riders keep 100% | Business Rules → deliveryPartnerPayout.tipSharePercent |
| COD limit | ₹2,000 | Business Rules → codMaxAmount |
| Slots | Lunch 12–2, Snacks 4–6, Dinner 7–10 | Business Rules → deliverySlots |
| Languages | English, Hindi, Spanish, Arabic, French | Config → Languages |

## Three things to know before launch

1. **Who pays for coupon discounts.** As built, item discounts from `percent` and `flat` coupons are taken out of the restaurant's earning (`vendorEarning = subtotal − discount − commission + packaging`). If FeastFlow is paying for launch offers, you have to reimburse restaurants by hand. Details are in promo-strategies.md §1.3.
2. **No segmentation, website or WhatsApp integration.** Win-back lists come from a manual database query. The waitlist page needs a form tool. WhatsApp templates are sent through a BSP or by hand.
3. **No invented proof.** None of the files contain testimonials, ratings, user counts or awards. Social proof is left as placeholders such as `[4.X/5 rating from X,XXX reviews]`. Fill those in only with real numbers.

## Placeholders used across files
`[CITY]`, `[LOCALITY]`, `[APP LINK]`, `[PLAY STORE LINK]`, `[APP STORE LINK]`, `[WAITLIST LINK]`, `[WAITLIST FORM TOOL]`, `[WEBSITE URL]`, `[PARTNER SIGNUP URL]`, `[RIDER SIGNUP URL]`, `[PARTNER DASHBOARD URL]`, `[@HANDLE]`, `[LAUNCH DATE]`, `[COMPANY LEGAL NAME]`, `[REGISTERED ADDRESS]`, `[SUPPORT EMAIL]`, `[SUPPORT PHONE]`, `[PRESS EMAIL]`, `[MEDIA CONTACT NAME]`, `[SPOKESPERSON NAME]`, `[FOUNDER NAME]`, `[RESTAURANT NAME]`, `[BSP NAME]`, `[BUDGET]`, `[TARGET]`.

## Character limits verified
Every limit was checked with Python `len()`. That covers X posts (≤280, with links counted at 23), Google Ads headlines (≤30), descriptions (≤90), sitelinks (≤25/35), callouts (≤25), WhatsApp template bodies (≤1,024), headers and footers (≤60) and buttons (≤25), plus store text limits. Counts that include a placeholder count the placeholder's own text, so check those lines again after you substitute real values.

## Adapting for other regions
Change the currency, payment methods and tax label in Business Rules. Swap in local festivals and meal times. Translate the copy (Admin → Languages edits the app strings). Replace the DPDP Act and TRAI notes with the local privacy and messaging rules (GDPR, TCPA and so on).
