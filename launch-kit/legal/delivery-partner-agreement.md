# FeastFlow Delivery Partner Agreement

> **TEMPLATE — NOT LEGAL ADVICE.** This is a starting-point template for engaging delivery partners ("riders") on FeastFlow. It is not legal advice. **Worker classification is a high-risk area.** Whether riders can be treated as independent contractors depends on local law and on how you actually operate. In India, review the **Code on Social Security, 2020** (gig and platform worker provisions, including any aggregator contribution to social-security funds) and any **state platform-worker laws** (e.g. Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023, and Karnataka/other state laws as enacted); in the EU review the **Platform Work Directive** and national law; in the UK/US review worker/employee status case law and local rules. **Have qualified labour/employment counsel review this agreement before use.** Replace every `[BRACKETED PLACEHOLDER]`.
>
> **Configured values:** Numbers marked *"configured value"* are set in **Admin Panel → Config → Business Rules** and can be changed at runtime. The shipped default and config key are shown, e.g. `businessRules.deliveryPartnerPayout.base` = 25. **Before use, make sure each number matches your live Admin Panel settings.**

**Agreement No.:** [AGREEMENT NUMBER]
**Effective Date:** [EFFECTIVE DATE]

**BETWEEN**

**(1) [COMPANY LEGAL NAME]**, a [COMPANY TYPE] incorporated under the laws of [COUNTRY], registration number [REGISTRATION NUMBER], with its registered office at [REGISTERED ADDRESS] ("**FeastFlow**"); and

**(2) [DELIVERY PARTNER FULL NAME]**, aged [AGE], residing at [ADDRESS], mobile [PHONE], [ID TYPE] No. [ID NUMBER] ("**Delivery Partner**", "**you**").

This Agreement is accepted electronically in the FeastFlow Rider app at registration [and/or signed below].

---

## 1. Services and relationship

1.1 FeastFlow operates a technology platform that connects customers, restaurants and independent delivery partners. Through the **FeastFlow Rider** app, you may receive offers to pick up orders from restaurants and deliver them to customers ("**Delivery Services**").

1.2 **Independent contractor [COUNSEL TO CONFIRM].** You provide Delivery Services as an independent contractor on a principal-to-principal basis. You are not an employee, worker, agent or partner of FeastFlow. Subject to Clause 1.3, you:
- decide **whether and when to go Online**, and for how long;
- may **decline** delivery offers [CONFIRM — the app records riders who decline orders];
- provide and maintain your own vehicle, smartphone, data plan and equipment;
- may provide services to other platforms or businesses at the same time, unless doing so would be unsafe or conflict with an active FeastFlow delivery.

1.3 Nothing in this Agreement requires minimum hours or shifts. [IF YOU INTRODUCE SHIFTS, INCENTIVE TARGETS OR EXCLUSIVITY, COUNSEL MUST REVIEW THE IMPACT ON CLASSIFICATION.]

1.4 **Social security and welfare [PLACEHOLDER].** Where the law provides social-security, welfare or registration schemes for gig/platform workers (e.g. under the Code on Social Security, 2020 or state laws), FeastFlow will comply with its obligations as an aggregator/platform, including [REGISTRATION ON THE e-SHRAM / STATE PORTAL, AGGREGATOR CONTRIBUTIONS, WELFARE CESS — COUNSEL TO SPECIFY]. You agree to provide information reasonably required for this.

## 2. Eligibility and documents

2.1 To register, you must:
- be at least **[18]** years old and legally permitted to work in [COUNTRY];
- hold a valid **driving licence** for your vehicle class (not required for bicycles) [CONFIRM LOCAL RULE];
- for motorised vehicles, hold a valid **vehicle registration**, **insurance** (at least third-party, as required by the Motor Vehicles Act, 1988 or local law) and **pollution certificate** where applicable;
- own a smartphone that can run the Rider app with GPS;
- pass identity and background verification [DESCRIBE — e.g. police verification, where lawful and with consent].

2.2 In the Rider app you will provide: name, phone, email, photo, **vehicle type** (bicycle, bike, scooter or car), **vehicle number**, **driving licence number**, uploaded **documents** ([ID PROOF, DRIVING LICENCE, VEHICLE RC, INSURANCE, PAN, OTHER]), and **bank account / UPI details** for payouts.

2.3 Your account is activated only after **FeastFlow approves it** (Admin → Delivery Partners). FeastFlow may reject an application or request further documents. You must keep your documents valid and inform FeastFlow of changes within **[7] days**.

## 3. How deliveries work

3.1 **Going Online.** When you toggle **Online**, you are available for delivery offers. When you toggle **Offline**, you will receive no offers.

3.2 **Assignment.** Orders are offered automatically to nearby online Delivery Partners when auto-assignment is enabled (configured value `businessRules.autoAssignDelivery` = true). The app shows the pickup and drop locations and the estimated earning before you accept.

3.3 **Pickup.** Go to the restaurant, verify the order number, collect the sealed order and mark it **picked up**. Do not open or tamper with the packaging.

3.4 **Delivery and handover.** Navigate to the customer, hand over the order and complete the delivery in the app by:
- entering the customer's **delivery OTP** (configured value `businessRules.deliveryOtpLength` = 4 digits; feature flag `deliveryOtp`), and
- taking a **photo proof** of the delivered order at the drop point, when required (feature flag `deliveryPhotoProof`). Photos should show the package at the door/handover point and **must not** show customers' faces or the inside of their homes.

**You must never mark an order as delivered before physically handing it over, and must never ask a customer to share the OTP before handover.**

3.5 **Problems.** If the customer is unreachable, the address is wrong, or the order is damaged, contact support through the app [CONFIRM PATH] and follow instructions. Do not abandon orders.

3.6 **Cash on Delivery.** For COD orders (up to configured value `businessRules.codMaxAmount` = ₹2,000), you collect the payable amount in cash on behalf of [FeastFlow / the Restaurant Partner] and must deposit/settle it [WITHIN [X] HOURS / BY [METHOD]] [OPERATOR: the current FeastFlow software does not track rider cash-in-hand; define a manual process]. Cash collected remains the property of [FeastFlow] until settled.

## 4. Location tracking

4.1 **While you are Online**, the Rider app collects your **precise GPS location continuously, including when the app is in the background or your screen is off**. This is necessary to: offer you nearby orders; navigate to pickup and drop; show your live location to the customer and restaurant for the order you are delivering; calculate distance-based earnings; verify deliveries and resolve disputes; and support your safety.

4.2 **Location collection stops when you go Offline.** FeastFlow stores your latest location and the time it was recorded. See the FeastFlow Privacy Policy [PRIVACY POLICY URL] for retention and your rights.

4.3 You consent to this processing by granting the location permission and going Online (while you are Online and the app is in the background, your device shows a notification or location indicator that your location is being shared). You may withdraw consent by going Offline or revoking the permission, but you cannot receive orders without it. You must not use GPS-spoofing or location-masking tools.

## 5. Earnings

5.1 For each **delivered** order you earn:

| Component | Default (configured value) |
|---|---|
| Base pay per delivery | ₹25 (`businessRules.deliveryPartnerPayout.base`) |
| Distance pay | ₹6 per km of the restaurant-to-customer distance (`businessRules.deliveryPartnerPayout.perKm`) |
| Customer tips | **100%** of the tip (`businessRules.deliveryPartnerPayout.tipSharePercent` = 100; feature flag `deliveryPartnerTips`) |
| Incentives / bonuses | [OPTIONAL — e.g. peak-hour, rain or weekly incentives: DESCRIBE OR DELETE. Not built into the software by default.] |

*Example:* a 4 km delivery with a ₹20 tip = ₹25 + (4 × ₹6) + ₹20 = **₹69**.

5.2 The earning for an order is calculated when the order is placed and shown in the app; it is credited to your Rider balance when the order is marked **delivered**. No earning is due for orders cancelled before pickup [COUNSEL/OPERATOR: decide compensation for orders cancelled after you have travelled to the restaurant or picked up — e.g. [₹X] or base pay].

5.3 FeastFlow may change the earning rates on **[7/15] days'** notice in the app. Rates shown at the time you accept an order apply to that order.

5.4 **Taxes.** You are responsible for your own income tax and, if applicable, GST. FeastFlow may deduct tax at source (TDS) where required by law and will issue certificates [CA TO CONFIRM].

## 6. Payouts

6.1 Your Rider balance is paid to your registered bank account / UPI ID **[WEEKLY on [DAY] / every [X] days]** by bank transfer, recorded with a reference you can see in the Earnings section.

6.2 Minimum payout: **₹[500]** [configured value `businessRules.minPayoutAmount` = 500 is shown to restaurant partners in the app; CONFIRM WHETHER THE SAME MINIMUM APPLIES TO RIDERS]. Smaller balances roll over.

6.3 **Deductions:** FeastFlow may deduct from payouts: (a) unsettled COD cash; (b) taxes required by law; (c) amounts for orders proven to be lost, tampered with or falsely marked delivered through your fault, after a fair review; (d) [EQUIPMENT/BAG DEPOSITS IF ANY — CONFIRM LEGALITY]. You will be notified of any deduction with reasons and can dispute it within **[15] days**.

6.4 On deactivation or termination, your remaining balance (less permitted deductions) is paid within **[15/30] days**.

## 7. Conduct and standards

You agree to:
- follow all **traffic laws**, wear a helmet (two-wheelers) and seatbelt (cars), and **never use your phone while riding**;
- never ride under the influence of alcohol or drugs;
- treat customers, restaurant staff and other riders with respect; no harassment, discrimination, abuse or violence;
- keep customer personal data (name, phone, address, OTP) **confidential**, use it only to complete the delivery, and not contact customers afterwards;
- not tamper with, consume or open orders;
- not ask customers for extra payment beyond the order amount (COD) — tips are voluntary and are added in the app;
- maintain food hygiene: use a clean, insulated delivery bag; keep hot and cold food separated where possible;
- not let any other person use your account; your account is personal and non-transferable;
- not use GPS spoofing, emulators, modified apps, or create multiple accounts;
- not wear FeastFlow branding in a misleading way or speak for FeastFlow to the media.

## 8. Safety

8.1 Your safety comes first. You may refuse or abandon a delivery if you reasonably believe it is unsafe (e.g. severe weather, threatening behaviour) — inform support immediately.

8.2 **Emergency:** In an accident or emergency, call local emergency services ([EMERGENCY NUMBER, e.g. 112]) first, then FeastFlow support at [RIDER SUPPORT PHONE]. [ADD AN IN-APP SOS FEATURE IF BUILT — NOT INCLUDED IN THE SOFTWARE BY DEFAULT.]

8.3 FeastFlow does not set delivery deadlines that require unsafe riding. ETAs shown to customers are estimates.

## 9. Insurance [PLACEHOLDER]

9.1 You must maintain the vehicle insurance required by law.

9.2 [OPTIONAL: FeastFlow provides / facilitates **accident and health insurance** for active Delivery Partners through [INSURER NAME], policy [POLICY NUMBER], covering [ACCIDENTAL DEATH / DISABILITY / HOSPITALISATION up to ₹AMOUNT] while Online / on an active delivery. Premium paid by [FeastFlow / shared]. Details: [LINK].] [COUNSEL: check whether insurance or welfare contributions are mandatory under applicable gig-worker law.]

## 10. Ratings and quality

Customers may rate their delivery (1–5 stars). Your average rating is visible to you. Persistently low ratings, repeated complaints, frequent order abandonment or late deliveries may lead to a review, coaching, temporary suspension or deactivation under Clause 11. Ratings alone will not be the sole basis for deactivation without human review [RECOMMENDED].

## 11. Suspension and deactivation

11.1 **Immediate suspension** (status "suspended") pending investigation may occur for: safety incidents; harassment or violence; fraud (false delivery marking, GPS spoofing, account sharing); theft or tampering with orders; riding under the influence; expired licence, registration or insurance; serious legal violations.

11.2 **Deactivation after review** may occur for repeated breaches of Clauses 3, 4 or 7, or persistently low quality after warning.

11.3 **Fair process:** FeastFlow will (except where unsafe or unlawful) tell you the reason, give you an opportunity to respond within **[7] days**, review your response with a human reviewer, and inform you of the outcome. You may appeal to [RIDER APPEALS EMAIL]. [COUNSEL: align with any statutory notice/grievance requirements for platform workers.]

11.4 You may stop using the app at any time and terminate this Agreement by notice in the app or to [RIDER SUPPORT EMAIL]. Deleting your login (Profile → Settings → Delete account) does not delete records needed for settlement and tax; contact support for full closure.

## 12. Data protection

FeastFlow processes your personal data (identity, documents, vehicle details, bank details, location while Online, delivery photos, ratings and earnings) as described in the **FeastFlow Privacy Policy** [PRIVACY POLICY URL], including under India's Digital Personal Data Protection Act, 2023. You can exercise your rights or raise a grievance with **[GRIEVANCE OFFICER NAME], [GRIEVANCE EMAIL]**.

## 13. Liability and indemnity

13.1 You are responsible for your vehicle, your conduct and compliance with law. You will indemnify FeastFlow against third-party claims arising from your wilful misconduct, gross negligence, or breach of law or this Agreement.

13.2 FeastFlow's liability to you is limited to unpaid earnings due under this Agreement plus [OTHER], except for liability that cannot be limited by law (including death or personal injury caused by FeastFlow's negligence).

## 14. General

14.1 **Governing law:** [GOVERNING LAW]. 14.2 **Disputes:** first through the rider grievance process ([RIDER SUPPORT EMAIL] → [GRIEVANCE OFFICER NAME]); then [ARBITRATION / CONCILIATION / LABOUR AUTHORITY AS REQUIRED BY LAW] at **[JURISDICTION CITY]**; courts at **[JURISDICTION CITY]** have jurisdiction subject to any mandatory forum. 14.3 **Changes:** FeastFlow may amend this Agreement on **[15] days'** notice in the app; continued use after the effective date means acceptance; you may terminate if you do not agree. 14.4 **Language:** a translation in [HINDI / LOCAL LANGUAGE] is available; [the English version prevails / both versions are equally authoritative]. 14.5 **Entire agreement:** this Agreement and the FeastFlow Terms of Service Part D form the entire agreement; this Agreement prevails on conflict. 14.6 **Electronic acceptance:** acceptance in the app is a valid signature under the Information Technology Act, 2000 [or local e-signature law].

---

## Signatures

**For [COMPANY LEGAL NAME] (FeastFlow)**

Signature: ______________________________
Name: [AUTHORISED SIGNATORY NAME]
Designation: [DESIGNATION]
Date: [DATE]

**Delivery Partner**

Signature: ______________________________
Name: [DELIVERY PARTNER FULL NAME]
Rider ID / Phone: [RIDER ID / PHONE]
Date: [DATE]

*Or accepted electronically in the FeastFlow Rider app on [DATE/TIME], from device [DEVICE ID].*
