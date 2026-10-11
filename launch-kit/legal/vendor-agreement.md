# FeastFlow Restaurant Partner Agreement

> **TEMPLATE — NOT LEGAL ADVICE.** This is a starting-point template for onboarding restaurants onto FeastFlow. It is not legal advice. Commission, tax (GST, TCS/TDS), food-safety (e.g. FSSAI), competition-law (pricing parity) and contract rules vary by jurisdiction. **Have qualified legal counsel and a chartered accountant / tax adviser review this agreement before use.** Replace every `[BRACKETED PLACEHOLDER]`.
>
> **Configured values:** Numbers marked *"configured value"* are set in **Admin Panel → Config → Business Rules** (global) or **Admin Panel → Finance → Commission** (per-restaurant override) and can be changed at runtime. The shipped default and config key are shown, e.g. `businessRules.commissionPercent` = 18. **Before signing, make sure each number matches what is configured for this restaurant in the Admin Panel.**

**Agreement No.:** [AGREEMENT NUMBER]
**Effective Date:** [EFFECTIVE DATE]

**BETWEEN**

**(1) [COMPANY LEGAL NAME]**, a [COMPANY TYPE] incorporated under the laws of [COUNTRY], registration number [REGISTRATION NUMBER], GSTIN [GSTIN], with its registered office at [REGISTERED ADDRESS] ("**FeastFlow**"); and

**(2) [RESTAURANT LEGAL ENTITY NAME]**, a [sole proprietorship / partnership / LLP / company], trading as **[RESTAURANT BRAND NAME]**, with its principal place of business at [RESTAURANT ADDRESS], PAN [PAN], GSTIN [RESTAURANT GSTIN or "Not registered"], FSSAI Licence/Registration No. [FSSAI NUMBER] ("**Restaurant Partner**").

Each a "**Party**", together the "**Parties**".

---

## 1. Definitions

- **Platform** — the FeastFlow customer app, FeastFlow Partner app, vendor web dashboard, website and related systems.
- **Customer** — an end user who places an Order through the Platform.
- **Order** — a request by a Customer through the Platform for food and beverages from the Restaurant Partner.
- **Order Value / Subtotal** — the menu price of items and add-ons in an Order, before taxes, fees and tips.
- **Net Order Value** — Subtotal minus any coupon discount applied to the Order.
- **Delivery Partner** — an independent rider who delivers Orders via the FeastFlow Rider app.
- **Business Rules** — the configurable settings in the FeastFlow Admin Panel that govern fees, timings and limits.
- **Partner Balance** — the running balance of the Restaurant Partner's earnings held in the Platform pending payout.

## 2. Appointment and scope

2.1 FeastFlow grants the Restaurant Partner a non-exclusive right to list its restaurant and menu on the Platform and to receive Orders from Customers, and provides order management tools (FeastFlow Partner app and vendor web dashboard: Orders, Menu, Categories, Timings, Reviews, Payouts, Settings).

2.2 FeastFlow acts as [a technology platform / e-commerce operator and limited agent of the Restaurant Partner for the purpose of collecting payment from Customers] [COUNSEL TO CONFIRM]. The contract for the sale of food is between the Restaurant Partner and the Customer.

2.3 This Agreement is non-exclusive. [OPTIONAL EXCLUSIVITY CLAUSE — COUNSEL TO REVIEW FOR COMPETITION-LAW RISK.]

## 3. Onboarding and KYC

3.1 Before listing, the Restaurant Partner must submit through the Partner app / dashboard, and keep up to date:

| Item | Detail |
|---|---|
| Business details | Legal name, brand name, description, cuisines, contact phone and email |
| Address & location | Full address, city, state, PIN, map location |
| **Food-safety licence** | FSSAI licence/registration number [OR EQUIVALENT LOCAL FOOD BUSINESS LICENCE] and expiry date; copy of licence |
| **Tax registration** | GSTIN (if registered), PAN; [state if composition scheme] |
| **Bank details** | Account holder name, account number, IFSC [or local routing code], UPI ID (optional); cancelled cheque or bank letter |
| Owner KYC | [ID PROOF OF OWNER / AUTHORISED SIGNATORY] |
| Other | [SHOP & ESTABLISHMENT LICENCE / TRADE LICENCE / HEALTH CERTIFICATE / OTHER LOCAL PERMITS] |
| Menu | Items, prices, descriptions, veg/non-veg markers, add-ons, photos, opening hours |

3.2 The restaurant goes live only after FeastFlow **approves** the application (Admin → Vendors). FeastFlow may reject or request further documents at its discretion.

3.3 The Restaurant Partner must notify FeastFlow within **[7] days** of any change to its licences, ownership, bank details or tax registration, and must not operate on the Platform with an expired or suspended food-safety licence.

## 4. Commission and fees

4.1 **Commission.** FeastFlow charges a commission on the **Net Order Value** of each delivered Order at the rate of:

> **[18]%** — default (configured value `businessRules.commissionPercent` = 18), **or** a restaurant-specific rate of **[__]%** agreed with the Restaurant Partner and set as a per-restaurant override in Admin → Finance → Commission.

4.2 Commission is calculated and recorded per Order when it is placed, and settled when the Order is delivered. GST at the applicable rate is charged on the commission [COUNSEL/CA TO CONFIRM].

4.3 **Other fees** [OPTIONAL — DELETE IF NONE]: [ONBOARDING FEE], [PHOTOGRAPHY FEE], [FEATURED LISTING / BANNER FEES — FeastFlow can mark restaurants as featured and run banners; any paid placement must be agreed in writing], [PAYMENT GATEWAY CHARGES PASS-THROUGH].

4.4 FeastFlow may change the default commission or fees on **[30] days'** written notice. If the Restaurant Partner does not accept the change, it may terminate under Clause 15.

## 5. Customer pricing and charges

5.1 The Restaurant Partner sets its own menu prices. **Pricing parity** [OPTIONAL — COUNSEL TO REVIEW FOR COMPETITION-LAW COMPLIANCE, e.g. under the Indian Competition Act, 2002, EU/UK law]: [The Restaurant Partner agrees that menu prices on the Platform will not be higher than its dine-in menu prices by more than [X]% / Delete this clause].

5.2 FeastFlow sets and collects Customer-side charges according to the Business Rules, including delivery fees, surge fees, platform fee and taxes. The **packaging fee** (configured value `businessRules.packagingFee` = ₹15 per Order) is collected from the Customer and **passed to the Restaurant Partner**.

5.3 **Coupons:** Platform coupons may be applied to Orders, including restaurant-specific coupons. **Under the current settlement logic, coupon discounts reduce the Net Order Value and therefore the Restaurant Partner's earnings.** [CHOOSE: (a) Restaurant Partner bears all coupon discounts; (b) Restaurant Partner bears discounts only on coupons it has approved, and FeastFlow reimburses Platform-funded coupons via [MECHANISM]; COUNSEL/CA TO CONFIRM AND, IF (b), ADJUST THE SETTLEMENT PROCESS.]

## 6. Earnings and payouts

6.1 **Earnings per delivered Order:**

> Restaurant earning = Subtotal − coupon discount − commission + packaging fee

Taxes collected from the Customer, delivery fees, surge fees, platform fees and tips are **not** part of the Restaurant Partner's earnings. [CA: set out GST treatment, including whether FeastFlow pays GST on restaurant services as an e-commerce operator under Section 9(5) of the CGST Act, and TCS/TDS deductions under GST and the Income-tax Act.]

6.2 Earnings are credited to the **Partner Balance** when the Order is marked delivered and are visible in the Partner app / dashboard under **Payouts**.

6.3 **Payout cycle:** FeastFlow will pay the Partner Balance to the registered bank/UPI account **[WEEKLY / EVERY [X] DAYS / MONTHLY] on [DAY]**, by bank transfer, recorded with a payment reference.

6.4 **Minimum payout:** a payout is made only when the Partner Balance is at least **₹500** (configured value `businessRules.minPayoutAmount` = 500); smaller balances roll over to the next cycle.

6.5 **Deductions and set-off.** FeastFlow may deduct from payouts: (a) commission and agreed fees (and GST on them); (b) taxes required to be withheld or collected by law (e.g. TCS/TDS) [CA TO CONFIRM]; (c) refunds given to Customers for issues attributable to the Restaurant Partner (missing/wrong items, quality, post-acceptance cancellation by the restaurant); (d) penalties agreed in a schedule [OPTIONAL SCHEDULE]; (e) any amounts owed to FeastFlow under this Agreement.

6.6 **Cash on Delivery:** For COD Orders, the Delivery Partner collects cash on FeastFlow's behalf [CONFIRM]; the Restaurant Partner's earning is credited to the Partner Balance in the same way as prepaid Orders.

6.7 **Statements and disputes:** FeastFlow will make transaction-level statements available in the dashboard. The Restaurant Partner must raise any discrepancy within **[30] days** of the payout date, failing which the statement is deemed accepted (except for manifest error).

## 7. Restaurant Partner responsibilities

7.1 **Food safety and quality.** Prepare all food in compliance with applicable food-safety law (e.g. Food Safety and Standards Act, 2006 and FSSAI regulations), in hygienic conditions, using fresh and safe ingredients, at proper temperatures, in tamper-evident, food-grade, spill-proof packaging.

7.2 **Menu accuracy.** Keep item names, descriptions, prices, add-ons, images, veg/non-veg markers, and **allergen, nutritional and other information required by law** accurate and complete. Images must fairly represent the food. Use the **item-availability toggle** for unavailable items and the **open/close toggle** and **Timings** for hours.

7.3 **Order acceptance.** Accept or reject each Order promptly. **Orders not accepted within the configured time are automatically rejected by the system and the Customer is fully refunded** (configured value `businessRules.vendorAcceptTimeoutMinutes` = 5 minutes; the timer starts when the Order is placed for COD, or when payment succeeds for online payments). Repeated auto-rejections, rejections or post-acceptance cancellations may lead to reduced visibility, temporary closure or suspension.

7.4 **Preparation time.** Maintain an accurate average preparation time in the restaurant profile (used for Customer ETAs). Update Order status to *preparing* and *ready* promptly, and have Orders ready for pickup on time.

7.5 **Handover.** Hand the Order only to the assigned Delivery Partner, verify the Order number, and treat Delivery Partners with courtesy.

7.6 **Customer contact.** Customers may call the restaurant via the in-app "call restaurant" button. Respond professionally. Use Customer data only to fulfil the Order (Clause 11).

7.7 **Compliance.** Comply with all applicable laws, including consumer protection, labour, tax, weights-and-measures/legal metrology, and display of licence numbers where required. Do not sell items that are illegal or require age verification (e.g. alcohol, tobacco) unless expressly agreed in writing and permitted by law.

## 8. Taxes

8.1 Each Party is responsible for its own taxes. The Restaurant Partner is responsible for the accuracy of its GST registration status and for any tax on its supplies except where the law places the obligation on FeastFlow as e-commerce operator.

8.2 FeastFlow will issue tax invoices for its commission and fees, and [tax invoices to Customers on behalf of the Restaurant Partner / in its own name under Section 9(5)] [CA TO CONFIRM].

8.3 The Restaurant Partner indemnifies FeastFlow for taxes, interest and penalties arising from incorrect information it provides.

## 9. Ratings and reviews

9.1 Customers may rate and review the restaurant after a delivered Order. The restaurant's rating is the average of visible review ratings.

9.2 The Restaurant Partner may reply to reviews publicly via the Reviews section. Replies must be professional, must not disclose Customers' personal data, and must not harass or threaten reviewers.

9.3 The Restaurant Partner must not post or procure fake reviews, offer incentives for positive reviews without disclosure, or manipulate ratings. FeastFlow may hide reviews that violate its content rules but will not remove genuine reviews merely because they are negative.

## 10. Intellectual property and listing content

10.1 The Restaurant Partner grants FeastFlow a non-exclusive, royalty-free, worldwide licence during the term (and for a reasonable wind-down period) to use its name, trademarks, logos, images and menu content on the Platform and in marketing of the Platform, including featured listings and banners.

10.2 The Restaurant Partner warrants it owns or has rights to all content it uploads and that it does not infringe third-party rights.

10.3 FeastFlow's trademarks may be used by the Restaurant Partner only as approved in writing (e.g. "Order on FeastFlow" stickers).

## 11. Data protection and confidentiality

11.1 Customer personal data (name, address, phone, order details) made available to the Restaurant Partner is to be used **only to prepare and fulfil the relevant Order** and to handle related complaints. The Restaurant Partner must not use it for marketing, contact Customers outside the Order context, retain it longer than necessary, or share it with third parties.

11.2 Each Party will comply with applicable data-protection law, including India's Digital Personal Data Protection Act, 2023 [and GDPR where applicable], and implement reasonable security safeguards. The Restaurant Partner must notify FeastFlow within **[24] hours** of becoming aware of any breach involving Customer data.

11.3 FeastFlow processes the Restaurant Partner's data (including bank details, KYC and order data) in accordance with the FeastFlow Privacy Policy [PRIVACY POLICY URL].

11.4 Each Party will keep confidential the other's non-public business information, including commission rates and this Agreement's terms, except as required by law.

## 12. Customer complaints and refunds

12.1 FeastFlow handles Customer support and decides on Customer refunds in accordance with its Refund & Cancellation Policy. The Restaurant Partner will cooperate in investigations and respond to FeastFlow queries within **[24] hours**.

12.2 Where a refund is attributable to the Restaurant Partner (e.g. missing/wrong items, food quality, cancellation after acceptance), FeastFlow may recover the refunded item value from the Partner Balance under Clause 6.5.

12.3 Customer cancellation fees (configured value `businessRules.cancellationPenaltyPercent` = 10% after the `cancellationWindowMinutes` = 5 window) are [retained by FeastFlow / shared with the Restaurant Partner as follows: [__]] [CONFIRM].

## 13. Representations, warranties and indemnity

13.1 Each Party represents that it has authority to enter into this Agreement.

13.2 The Restaurant Partner warrants that it holds and will maintain all licences required to operate, and that its food complies with applicable law.

13.3 The Restaurant Partner will indemnify and hold harmless FeastFlow, its affiliates and personnel against all claims, losses, fines, penalties and costs (including reasonable legal fees) arising from: (a) food prepared or supplied by it, including illness, injury, allergic reactions or contamination; (b) inaccurate menu, allergen or pricing information; (c) breach of this Agreement or law; (d) infringement of third-party IP by its content.

13.4 **Insurance:** The Restaurant Partner will maintain [PUBLIC/PRODUCT LIABILITY INSURANCE of at least [AMOUNT]] [OPTIONAL].

## 14. Limitation of liability

14.1 Neither Party is liable for indirect or consequential losses, loss of profit, revenue or goodwill.

14.2 FeastFlow's total liability under this Agreement in any 12-month period is limited to the **commission received from the Restaurant Partner in the [3] months** preceding the claim.

14.3 Nothing limits liability for fraud, death or personal injury caused by negligence, the indemnities in Clause 13.3, or liability that cannot be limited by law.

14.4 FeastFlow does not guarantee any minimum number of Orders, visibility or revenue, or uninterrupted availability of the Platform.

## 15. Suspension, term and termination

15.1 **Term:** This Agreement starts on the Effective Date and continues until terminated.

15.2 **Termination for convenience:** Either Party may terminate on **[30] days'** written notice.

15.3 **Suspension:** FeastFlow may temporarily suspend the listing (status "suspended", hidden from Customers) with or without notice where: food-safety or licence concerns arise; there are repeated customer complaints, high rejection or auto-rejection rates, or low ratings below [THRESHOLD]; fraud or manipulation is suspected; required documents expire; or required by law or authority. FeastFlow will notify the reason and, where appropriate, give an opportunity to remedy within [7] days.

15.4 **Termination for cause:** Either Party may terminate immediately on written notice if the other materially breaches this Agreement and (where curable) fails to cure within **[15] days** of notice, or becomes insolvent.

15.5 **Effect:** On termination, the listing is deactivated; Orders already accepted must be fulfilled; FeastFlow pays the remaining Partner Balance (after permitted deductions) within **[30] days**, irrespective of the minimum payout; Clauses 6.5, 8, 11, 13, 14 and 16 survive.

## 16. General

16.1 **Governing law:** [GOVERNING LAW, e.g. the laws of India]. 16.2 **Disputes:** The Parties will first try to resolve disputes amicably within [30] days; failing which, disputes will be referred to arbitration by a sole arbitrator under [the Arbitration and Conciliation Act, 1996 / RULES], seated at **[JURISDICTION CITY]**, in English. Subject to arbitration, the courts at **[JURISDICTION CITY]** have exclusive jurisdiction. 16.3 **Relationship:** The Parties are independent contractors; nothing creates a partnership, joint venture or employment. 16.4 **Changes:** FeastFlow may update operational policies (e.g. Business Rules, acceptance timeouts) on notice through the dashboard; changes to commission follow Clause 4.4. 16.5 **Assignment:** The Restaurant Partner may not assign without FeastFlow's consent. 16.6 **Notices:** in writing to the addresses above or by email to [FEASTFLOW PARTNER EMAIL] / [RESTAURANT EMAIL]. 16.7 **Entire agreement:** This Agreement (with its Schedules and the FeastFlow Terms of Service Part C) is the entire agreement; this Agreement prevails in case of conflict. 16.8 **Counterparts / e-signature:** may be executed electronically and in counterparts.

---

## Schedule 1 — Commercial terms

| Term | Value |
|---|---|
| Commission rate | [__]% of Net Order Value (default 18%, `businessRules.commissionPercent`; per-restaurant override in Admin → Finance → Commission) |
| Packaging fee passed through | ₹[15] per Order (`businessRules.packagingFee`) |
| Payout cycle | [WEEKLY / ___] |
| Minimum payout | ₹[500] (`businessRules.minPayoutAmount`) |
| Acceptance timeout | [5] minutes (`businessRules.vendorAcceptTimeoutMinutes`) |
| Coupon funding | [AS AGREED IN CLAUSE 5.3] |
| Other fees | [NONE / LIST] |
| Restaurant-specific notes | [ ] |

## Schedule 2 — Bank details for payouts

| Field | Value |
|---|---|
| Account holder name | [ ] |
| Account number | [ ] |
| IFSC / routing code | [ ] |
| UPI ID (optional) | [ ] |

---

## Signatures

**For [COMPANY LEGAL NAME] (FeastFlow)**

Signature: ______________________________
Name: [AUTHORISED SIGNATORY NAME]
Designation: [DESIGNATION]
Date: [DATE]
Place: [PLACE]

**For [RESTAURANT LEGAL ENTITY NAME] (Restaurant Partner)**

Signature: ______________________________
Name: [AUTHORISED SIGNATORY NAME]
Designation: [DESIGNATION]
Date: [DATE]
Place: [PLACE]

[Company seal, if applicable]
