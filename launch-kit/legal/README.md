# FeastFlow Legal Templates — How to Use

> **TEMPLATES — NOT LEGAL ADVICE.** Everything in this folder is a starting-point template written to match how the FeastFlow software actually behaves. None of it is legal advice. **Have qualified legal counsel (and a chartered accountant / tax adviser for the partner agreements) review every document for each country you operate in before you publish or sign anything.**
>
> **Configured values:** Every number marked *"configured value"* in these documents (fees, windows, timeouts, limits, percentages) mirrors a setting in **Admin Panel → Config → Business Rules** or **Feature Flags**, and is shown with its shipped default and config key, e.g. `businessRules.cancellationWindowMinutes` = 5. **Before publishing, compare each value with your live Admin Panel**, and re-check these documents whenever you change a Business Rule.

## 1. What's in this folder

| File | Document | Audience | Where it goes |
|---|---|---|---|
| `privacy-policy.md` | Privacy Policy (incl. GDPR, India DPDP Act 2023, optional CCPA sections) | Everyone | **Admin → Config → Legal Pages → `privacyPolicy`** + website + app-store listings |
| `terms-of-service.md` | Terms of Service — Part A General, B Customers, C Restaurant Partners, D Delivery Partners | Everyone | **Admin → Legal Pages → `termsAndConditions`** + website |
| `refund-policy.md` | Refund & Cancellation Policy | Customers | **Admin → Legal Pages → `refundPolicy`** + website (payment gateways usually require a public URL) |
| `vendor-agreement.md` | Restaurant Partner Agreement (with schedules and signature block) | Restaurants | Website / partner onboarding (signed PDF or e-sign) |
| `delivery-partner-agreement.md` | Delivery Partner Agreement (with signature block) | Riders | Website / rider onboarding (signed PDF or in-app acceptance link) |
| `cookie-policy.md` | Cookie & Browser Storage Policy for the web Admin Panel and Vendor Dashboard | Admins, vendors | Website (link from the dashboards' login pages / footer) |
| `disclaimer.md` | Platform Disclaimer (marketplace, food, allergens, ETAs, images) | Everyone | Website; optionally append to `aboutUs` or link from Terms |

### Config-key mapping (Admin → Config → Legal Pages)

The Admin Panel has four Legal Pages tabs. They are stored in the `legal` section of the app config and shown inside all three apps (customer, Partner, Rider) on the in-app legal screen, and linked from the login/sign-up screens (Terms and Privacy).

| Legal Pages tab | Config key | Paste this file |
|---|---|---|
| Privacy Policy | `legal.privacyPolicy` | `privacy-policy.md` |
| Terms & Conditions | `legal.termsAndConditions` | `terms-of-service.md` |
| Refund Policy | `legal.refundPolicy` | `refund-policy.md` |
| About Us | `legal.aboutUs` | *(not provided — write your own; you may append a short version of `disclaimer.md`)* |

`vendor-agreement.md`, `delivery-partner-agreement.md`, `cookie-policy.md` and `disclaimer.md` have **no in-app config key**. Host them on your website (e.g. `[WEBSITE URL]/legal/restaurant-partner-agreement`) and link to them from the Terms, your onboarding emails and the dashboard login pages.

## 2. How to paste a document into Admin → Legal Pages

The Legal Pages editor is a **rich-text (HTML) editor** with a live preview and an **HTML source toggle**. It does **not** understand Markdown — pasting raw `.md` text will show `#`, `|` and `**` characters. Convert to HTML first.

**Before converting:** fill in all placeholders (Section 4) and **delete the grey "TEMPLATE — NOT LEGAL ADVICE" / "Configured values" / "Operator note" blockquotes at the top** of the document — they are instructions for you, not for your users. Also remove any `[OPTIONAL …]` sections you are not using.

### Option A — pandoc (recommended; keeps tables and headings)

```bash
cd launch-kit/legal
# HTML fragment (no <html>/<head>), ready for the editor's HTML source mode
pandoc privacy-policy.md      -f gfm -t html -o privacy-policy.html
pandoc terms-of-service.md    -f gfm -t html -o terms-of-service.html
pandoc refund-policy.md       -f gfm -t html -o refund-policy.html
```

Then:

1. Open **Admin Panel → Config → Legal Pages** and select the tab (e.g. *Privacy Policy*).
2. Click the **HTML** toggle in the editor toolbar to switch to source mode.
3. Select all existing content and replace it with the contents of the `.html` file.
4. Switch back to visual mode and check the **live preview** on the right.
5. Click **Save**. The change is pushed live to all apps (via the `config:updated` socket event) — no app release needed.
6. Open the app → Profile → Settings → (Terms / Privacy) or the login screen links to check rendering on a phone, including **dark mode** and a **small screen** (wide tables scroll horizontally; if one looks cramped, simplify it).

Do **not** use `pandoc -s` (standalone) — that adds `<html>`, `<head>` and `<style>` tags which you don't want inside the editor.

### Option B — no command line

Open the `.md` file in any Markdown viewer (VS Code preview, GitHub, Typora, Obsidian, or an online Markdown-to-HTML converter you trust), **copy the rendered text** (not the raw Markdown), and paste it into the editor in visual mode. Check that headings, lists and tables survived the paste; if tables break, use Option A.

### Website versions

For the website, generate standalone pages: `pandoc vendor-agreement.md -f gfm -s --metadata title="FeastFlow Restaurant Partner Agreement" -o vendor-agreement.html`, or paste into your CMS. For signed partner agreements, export to PDF/DOCX (`pandoc vendor-agreement.md -o vendor-agreement.docx`) and use your e-signature tool.

## 3. Things in the code that affect what these documents say

Read these before publishing — they are the points most likely to need a business or legal decision:

1. **Where refunds go.** With the Wallet feature flag ON (default), refunds for cancelled/rejected orders are credited to the customer's **FeastFlow Wallet** instantly; they go back to the original card/UPI only when Wallet is OFF. Payments that arrive *after* an order was cancelled are refunded to the original method (Wallet fallback if the gateway refund fails). `refund-policy.md` describes this and has an operator note. If you want refunds to source by default, turn the Wallet flag off or change `backend/utils/orderFlow.js → refundCancelled`. Note: in that source-refund path, if the gateway refund fails the system credits the refund to the customer's Wallet instead (logged as `[refund] gateway refund failed, crediting wallet`) — ops reviews these daily (`../operations/admin-daily-runbook.md` §1.4), so the policy should mention the Wallet fallback.
2. **Cancellation fee** is 10% of what the customer paid online + from wallet, applied only when the *customer* cancels more than 5 minutes after placing the order. Customers can cancel only while an order is *placed* or *accepted*. On COD orders there is nothing to deduct the fee from except any wallet amount used.
3. **Coupon discounts reduce the restaurant's earnings** (earning = subtotal − discount − commission + packaging fee). Decide who funds coupons (vendor-agreement Clause 5.3).
4. **Payouts are manual.** Admins record vendor/rider payouts (bank transfer + reference) from the Admin Panel; there is no automatic payout cycle. Fill the payout-cycle placeholders with what you will actually do.
5. **COD cash handled by riders is not tracked** in the software. Define a manual cash-settlement process (delivery-partner-agreement Clause 3.6).
6. **Account deletion** (Profile → Settings → Delete account) hard-deletes the user profile; orders and transactions remain. Wallet balance is lost — decide your policy (privacy-policy Section 13).
7. **Referee bonus** is credited at sign-up with a referral code; the **referrer bonus** after the referee's first delivered order.
8. **Not built** — don't promise these unless you add them: in-app chat (the "chat with vendor" flag is a call-the-restaurant button), rider SOS button, rider insurance, nutrition fields, age verification, analytics/cookie consent banner.

## 4. Placeholder checklist

Search each file for `[` to find every placeholder (`grep -n "\[" *.md`). Replace them all, then search again to confirm none remain.

### Company and contact (used in every document)
- [ ] `[COMPANY LEGAL NAME]` — exact registered name of the operating entity
- [ ] `[COMPANY TYPE]` — e.g. private limited company, LLP
- [ ] `[COUNTRY OF INCORPORATION]` / `[COUNTRY]`
- [ ] `[REGISTRATION NUMBER]`, `[CIN]`, `[GSTIN]`, `[PAN]` as applicable
- [ ] `[REGISTERED ADDRESS]`
- [ ] `[WEBSITE URL]`, `[ADMIN PANEL URL]`, `[VENDOR DASHBOARD URL]`
- [ ] `[SUPPORT EMAIL]`, `[SUPPORT PHONE]`, `[SUPPORT HOURS]`
- [ ] `[PRIVACY EMAIL]`, `[LEGAL EMAIL]`
- [ ] `[PARTNER SUPPORT EMAIL]`, `[FEASTFLOW PARTNER EMAIL]`, `[RIDER SUPPORT EMAIL]`, `[RIDER SUPPORT PHONE]`, `[RIDER APPEALS EMAIL]`
- [ ] `[EFFECTIVE DATE]` (and "Last updated")

### Grievance and data protection
- [ ] `[GRIEVANCE OFFICER NAME]`, `[DESIGNATION]`, `[GRIEVANCE EMAIL]`, `[GRIEVANCE PHONE]`, working hours
- [ ] Grievance acknowledgement/resolution timelines (check DPDP Rules, IT Rules 2021, Consumer Protection (E-Commerce) Rules 2020)
- [ ] `[EU REPRESENTATIVE NAME AND ADDRESS]`, `[UK REPRESENTATIVE …]`, `[DPO NAME]`, `[DPO EMAIL]` — or delete the GDPR section
- [ ] `[CONSENT MANAGER NAME AND LINK]` (India, if integrated)
- [ ] `[HOSTING PROVIDER]`, `[HOSTING REGION]`, `[STORAGE PROVIDER]`, `[EMAIL PROVIDER NAME]`, `[HOSTING/CDN PROVIDER]`
- [ ] Payment gateway(s) used — delete Razorpay or Stripe if not used
- [ ] Retention periods in privacy-policy Section 7
- [ ] Wallet-on-deletion policy; review visibility after deletion
- [ ] CCPA section — keep only if applicable
- [ ] Any analytics / SDKs you add (privacy-policy Section 6, cookie-policy Section 5)

### Legal / disputes
- [ ] `[GOVERNING LAW]`
- [ ] `[JURISDICTION CITY]` (courts and arbitration seat)
- [ ] Arbitration clause — keep or delete (counsel to check consumer enforceability)
- [ ] Liability caps `[₹ AMOUNT]`, notice periods `[15/30] days`, minimum age `[18]`

### Customer commerce
- [ ] GST/tax treatment notes (`[COUNSEL/CA …]`) in Terms B2 and vendor agreement Clauses 6 and 8
- [ ] Payment collection model (Terms B3.4, vendor agreement 2.2)
- [ ] Wallet terms: expiry, transferability, cash-out, PPI review (Terms B4.1, refund policy 4.1 and 8)
- [ ] Missing/wrong item reporting window `[2 HOURS / 24 HOURS]`
- [ ] Undelivered/unreachable-customer policy `[X] minutes`
- [ ] `[CONFIRM WITH GATEWAY]` — refund-to-source timelines with Razorpay/Stripe
- [ ] In-app support path `[CONFIRM IN-APP PATH]`
- [ ] Featured/banner placement: editorial or paid (disclaimer Section 1)

### Restaurant Partner Agreement
- [ ] Restaurant party details, `[FSSAI NUMBER]`, GSTIN, PAN, signatories
- [ ] Commission rate (Schedule 1) — must equal the per-restaurant override or global `businessRules.commissionPercent`
- [ ] `[PAYOUT CYCLE]`, payout day, deductions schedule
- [ ] Coupon funding choice (Clause 5.3)
- [ ] Pricing parity clause — keep or delete (competition law)
- [ ] Cancellation fee sharing (Clause 12.3)
- [ ] Other fees, insurance, exclusivity

### Delivery Partner Agreement
- [ ] Classification and social-security wording reviewed by labour counsel (Clause 1)
- [ ] Required documents list, background verification process
- [ ] Incentives (if any), cancelled-after-pickup compensation
- [ ] Payout cycle, rider minimum payout
- [ ] COD cash settlement process
- [ ] Insurance details or deletion (Clause 9)
- [ ] Emergency number, appeal process, language version

### Business Rules to cross-check (Admin → Config → Business Rules)

| Config key | Default in documents | Your value |
|---|---|---|
| `cancellationWindowMinutes` | 5 | |
| `cancellationPenaltyPercent` | 10 | |
| `vendorAcceptTimeoutMinutes` | 5 | |
| `paymentTimeoutMinutes` | 15 | |
| `commissionPercent` | 18 (per-restaurant override possible) | |
| `minPayoutAmount` | 500 | |
| `codMaxAmount` | 2000 | |
| `walletMaxUsePercent` | 50 | |
| `deliveryFee.base` / `baseKm` / `perKm` / `freeAbove` | 30 / 2 / 8 / 499 | |
| `surgePricing.enabled` / `multiplier` | off / 1.5 | |
| `packagingFee` | 15 | |
| `platformFee` | 0 | |
| `taxPercent` | 5 | |
| `minOrderValue` | 99 | |
| `tipPresets` / `maxTipPercent` | 10,20,30,50 / 100 | |
| `deliveryPartnerPayout.base` / `perKm` / `tipSharePercent` | 25 / 6 / 100 | |
| `referralBonus` / `refereeBonus` | 50 / 50 | |
| `radiusKm` | 10 | |
| `etaBufferMinutes` / `etaMinutesPerKm` | 10 / 3 | |
| `deliveryOtpLength` | 4 | |
| `deliverySlots` | Lunch 12–14, Snacks 16–18, Dinner 19–22 | |
| `paymentMethods` | card, UPI, wallet, COD on; netbanking off | |
| `currencyCode` | INR (₹) | |
| `autoAssignDelivery` | true | |

Feature flags referenced: `wallet`, `coupons`, `referral`, `tipping`, `deliveryPartnerTips`, `reviews`, `scheduleOrder`, `liveTracking`, `deliveryOtp`, `deliveryPhotoProof`, `googleSignIn`, `appleSignIn`, `otpLogin`. If you turn any of these off, remove or soften the matching clauses.

## 5. Adapting for other regions

The templates are written India-first (₹, GST, FSSAI, UPI, DPDP Act 2023, Code on Social Security 2020). For other markets, at minimum: replace currency and tax references; replace FSSAI with the local food-business licence; review the GDPR/UK, CCPA and "Other regions" sections of the privacy policy; check local consumer-protection cancellation/refund rules and gig-worker laws; and update governing law and dispute resolution.

## 6. After publishing

- Add the public URLs of the Privacy Policy (required) and Terms to the **Google Play** and **App Store** listings, and complete the Play **Data safety** form / App Store **privacy nutrition label** consistently with `privacy-policy.md` (location incl. background location for the Rider app, contact info, purchase history, photos, device IDs/push tokens).
- Provide the account-deletion instructions (Profile → Settings → Delete account, or email) on a public web page — Google Play requires a deletion URL.
- Give Razorpay/Stripe your Terms, Privacy, Refund policy and contact page URLs during merchant onboarding.
- Re-review these documents whenever you change Business Rules, enable/disable feature flags, add a third-party service, or launch in a new region.
