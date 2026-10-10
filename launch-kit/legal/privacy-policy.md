# FeastFlow Privacy Policy

> **TEMPLATE — NOT LEGAL ADVICE.** This document is a starting-point template prepared for the FeastFlow platform. It is not legal advice and does not create a lawyer–client relationship. Laws differ by country and state and change often. **Have qualified legal counsel in each jurisdiction where you operate review and adapt this policy before publishing it.** Replace every `[BRACKETED PLACEHOLDER]`, and delete any optional section that does not apply to you.
>
> **Configured values:** Numbers marked *"configured value"* come from **Admin Panel → Config → Business Rules** or **Feature Flags** and can be changed at runtime. The text below states the shipped default and the config key, e.g. `businessRules.cancellationWindowMinutes` = 5. **Before publishing, make sure every such number matches what is actually set in your Admin Panel**, and update this document whenever you change those settings.

**Last updated:** [EFFECTIVE DATE]
**Effective from:** [EFFECTIVE DATE]

---

## 1. Who we are

This Privacy Policy explains how **[COMPANY LEGAL NAME]**, a [COMPANY TYPE, e.g. private limited company] incorporated under the laws of [COUNTRY OF INCORPORATION] with company/registration number [REGISTRATION NUMBER] and its registered office at [REGISTERED ADDRESS] ("**FeastFlow**", "**we**", "**us**", "**our**"), collects, uses, shares and protects personal data when you use:

- the **FeastFlow** customer mobile app;
- the **FeastFlow Partner** app and the FeastFlow vendor web dashboard (for restaurant partners);
- the **FeastFlow Rider** app (for delivery partners);
- our website at [WEBSITE URL] and any related services (together, the "**Platform**").

For the purposes of data protection law, [COMPANY LEGAL NAME] is the **data controller** (under the GDPR) and **Data Fiduciary** (under India's Digital Personal Data Protection Act, 2023) for the personal data described in this policy, except where we state otherwise.

If you have any questions, contact us at [PRIVACY EMAIL] or see Section 20 (Contact).

## 2. Scope and who this policy covers

This policy applies to:

- **Customers** — people who browse restaurants, place orders and receive deliveries;
- **Restaurant Partners ("Vendors")** — restaurant owners and their staff who use the Partner app or vendor dashboard;
- **Delivery Partners ("Riders")** — independent couriers who use the Rider app;
- **Visitors** to our website and web dashboards;
- **Administrators** — our own staff using the internal admin panel (internal staff are additionally covered by our internal employee privacy notice [LINK OR "available on request"]).

Restaurants listed on FeastFlow are independent businesses. When a restaurant receives your order details, it uses them to prepare your order. If a restaurant uses your data for its own separate purposes (for example its own loyalty programme outside FeastFlow), it does so under its own privacy policy.

## 3. Personal data we collect

We only collect what we need to run the Platform. The table below reflects the data fields actually stored by the FeastFlow backend.

### 3.1 Data you give us

| Category | Examples | Who |
|---|---|---|
| **Account and identity** | Name, profile photo (avatar), role (customer / vendor / rider), preferred language, password (stored only as a one-way salted hash — we cannot read it) | All users |
| **Contact details** | Mobile phone number, email address | All users |
| **Sign-in identifiers** | If you choose "Sign in with Google" or "Sign in with Apple": the account identifier, name and email address shared by Google or Apple. We do not receive your Google or Apple password. | Users who choose social sign-in |
| **Delivery addresses** | Label (Home/Work/Other), full address, landmark, city, state, PIN/postal code, contact name and contact phone for the address, and the map coordinates (latitude/longitude) of the address | Customers |
| **Order details** | Items, add-ons, quantities, special cooking/delivery instructions, scheduled delivery time or slot, chosen tip, coupon used | Customers |
| **Reviews and content** | Star ratings for the restaurant and the delivery, written comments, photos you attach to reviews; restaurant replies to reviews | Customers, Vendors |
| **Referral data** | Your unique referral code, which user referred you, and whether the referral reward has been issued | Customers |
| **Notification preferences** | Whether you want push, email and SMS notifications | All users |
| **Restaurant (business) data** | Restaurant name, description, logo/cover/photos, cuisines, phone, email, address and map location, opening hours, menu items and prices, food licence number (e.g. FSSAI), GST/tax number, bank account name, account number, IFSC/routing code and UPI ID for payouts | Vendors |
| **Delivery Partner data** | Vehicle type and registration number, driving licence number, uploaded documents (e.g. ID proof, licence, vehicle registration, [OTHER DOCUMENTS YOU REQUIRE]), bank account / UPI details for payouts | Riders |
| **Support communications** | Messages, emails and call notes when you contact customer support | All users |

### 3.2 Data collected automatically

| Category | Details | Who |
|---|---|---|
| **Precise location — customers** | With your permission, the app uses your device's GPS to detect your current location, suggest an address, show nearby restaurants (within the delivery radius, configured value `businessRules.radiusKm` = 10 km) and calculate delivery distance, fees and ETA. Location is used **while the app is in use**. You can instead type an address manually. | Customers |
| **Precise, continuous and background location — riders** | While you are marked **Online** in the Rider app, the app collects your precise GPS location continuously, **including when the app is in the background or the screen is off**, to offer you nearby orders, assign deliveries, provide navigation, and show your live position to the customer and restaurant for the order you are delivering. We store your latest location and the time it was recorded. **Location collection stops when you switch to Offline.** | Riders |
| **Order and transaction history** | Order number, status history with timestamps (placed, accepted, preparing, ready, picked up, delivered, cancelled, rejected), distance, price breakdown, payment status, refunds, cancellation fees, wallet credits/debits, referral bonuses, earnings and payouts | All users (as relevant) |
| **Delivery proof** | Photo taken by the rider at drop-off (when photo proof is enabled, feature flag `deliveryPhotoProof`), and confirmation that the delivery OTP was entered correctly (feature flag `deliveryOtp`). The OTP itself is generated by the system and stored only to verify the handover. | Customers, Riders |
| **Device and push data** | Firebase Cloud Messaging (FCM) push token(s) for each device you log in on, app language, theme preference | All users |
| **Security and log data** | Login timestamps, refresh-token records for active sessions, one-time password (OTP) request and attempt counters, IP address and request logs held by our servers and hosting provider, crash/error logs | All users |
| **Web dashboard storage** | The admin panel and vendor dashboard store login tokens and display preferences in your browser's local storage. See our [Cookie Policy](cookie-policy.md). | Vendors, Admins |

### 3.3 Payment data

Payments are processed by our payment gateway partners **Razorpay** and/or **Stripe** [DELETE WHICHEVER YOU DO NOT USE]. When you pay by card, UPI, net banking or similar, **you enter your payment credentials directly into the gateway's secure checkout. We do not receive or store your full card number, CVV, UPI PIN or net-banking password.** We receive and store only a payment reference (payment/intent ID), the payment method type (e.g. card, UPI, wallet, cash on delivery), the amount, status and time of payment, and any refund reference. The gateways process your payment data as independent controllers or as our processors under their own privacy policies and PCI-DSS obligations.

### 3.4 Data from third parties

- **Google / Apple** — basic profile data if you use social sign-in.
- **Payment gateways** — payment confirmation, status and refund status.
- **Restaurants and riders** — for example, a restaurant may mark an item unavailable, or a rider may report a delivery issue concerning your order.
- **Referrers** — if someone refers you, we record that link when you sign up with their code.

### 3.5 Data we do not intentionally collect

We do not ask for sensitive personal data such as health information, religion, caste, biometric data, or sexual orientation. Please do not include such information in order instructions or reviews. Note that food preferences (e.g. vegetarian filter) or allergy notes you type in instructions could indirectly reveal sensitive information; we use them only to fulfil your order.

## 4. How we use personal data (purposes)

| Purpose | Data used |
|---|---|
| Create and manage your account, verify your phone/email by OTP, and keep you signed in | Account, contact, sign-in identifiers, security data |
| Show restaurants that deliver to you, calculate distance, delivery fees, surge fees (when enabled) and estimated delivery time | Location, addresses |
| Take, route and fulfil orders: send them to the restaurant, assign a rider, enable pickup and delivery | Order details, addresses, contact details, location |
| Live order tracking — show the rider's position to the customer and restaurant during an active delivery | Rider location |
| Confirm delivery with OTP and/or photo proof, and resolve "not delivered" disputes | Delivery proof, order history |
| Process payments, refunds, wallet credits, cancellation fees, coupons and referral rewards | Order, payment references, wallet and referral data |
| Pay restaurants and riders, calculate commission and earnings | Business data, bank/UPI details, order history |
| Send transactional notifications (order status, OTPs, payment and refund updates) by push, SMS and email | Contact data, FCM tokens |
| Send promotional messages and offers (only where permitted and in line with your notification preferences / consent) | Contact data, FCM tokens, order history |
| Publish ratings and reviews, and let restaurants reply | Reviews, name (as displayed) |
| Onboard and verify restaurants and riders (KYC, licences, documents) and approve, suspend or deactivate accounts | Business/rider data, documents |
| Customer support and complaint handling | Support communications, order history |
| Safety, fraud prevention and security: detect fake accounts, OTP abuse, payment fraud, coupon/referral abuse, and enforce our Terms | Security logs, order history, device data |
| Improve the Platform: aggregated reporting on orders, revenue and performance | Order and transaction data (aggregated where possible) |
| Comply with law: tax/GST records, accounting, responding to lawful requests from authorities | Transaction data, business data |

We do **not** sell your personal data, and we do not use automated decision-making that produces legal or similarly significant effects about you without human review, except: orders that a restaurant does not accept within the configured time are automatically rejected and refunded (configured value `businessRules.vendorAcceptTimeoutMinutes` = 5), and unpaid online orders are automatically cancelled after the configured time (`businessRules.paymentTimeoutMinutes` = 15). Riders are automatically offered orders based on proximity when auto-assignment is on (`businessRules.autoAssignDelivery` = true). You may contact us to have any such decision reviewed by a person.

## 5. Legal bases for processing

Where the law requires a legal basis (for example under the GDPR / UK GDPR), we rely on:

| Legal basis | Used for |
|---|---|
| **Performance of a contract** | Creating your account, processing and delivering orders, payments, refunds, payouts, live tracking during delivery, delivery proof, support |
| **Consent** | Precise device location (via your OS permission), rider background location (via OS permission and going Online), push notifications (OS permission), promotional messages where consent is required, optional review photos. You may withdraw consent at any time (see Section 12); this does not affect processing already done. |
| **Legitimate interests** | Fraud prevention and security, improving the Platform, aggregated analytics/reporting, enforcing our Terms, defending legal claims. We balance these against your rights; you can object (Section 12). |
| **Legal obligation** | Tax and accounting records, KYC for payouts where required, responding to lawful orders from courts or authorities, food-safety related requests |

For India, see Section 16 (DPDP Act 2023) for how consent and "legitimate uses" apply.

## 6. How we share personal data

We share personal data only as needed to run the Platform:

| Recipient | What is shared | Why |
|---|---|---|
| **Restaurant Partners** | Customer name, order items and instructions, order number; contact details where needed to resolve an order issue; reviews and ratings you leave for them | To prepare your order and respond to reviews |
| **Delivery Partners (Riders)** | Customer name, delivery address and map location, contact phone, delivery instructions; restaurant pickup address | To pick up and deliver your order |
| **Customers** | Rider's name, photo (if provided), phone (for calls about the order), and live location during an active delivery; restaurant's public profile | Order tracking and handover |
| **Payment gateways — Razorpay, Stripe** | Order amount, order reference, your contact details as required by the gateway, refund requests | Payment processing and refunds |
| **Twilio** (SMS) | Phone number and message content (e.g. OTPs, order updates) | SMS delivery |
| **Email service provider** — [EMAIL PROVIDER NAME, e.g. your SMTP provider] | Email address and message content | Transactional and (where permitted) marketing emails |
| **Google Firebase** (Firebase Cloud Messaging) | Device push tokens and notification content | Push notifications |
| **Google Maps Platform** | Location coordinates and addresses entered or displayed in the apps | Maps, navigation and address display |
| **Google / Apple sign-in** | Authentication requests | Social login (only if you use it) |
| **Cloud hosting & storage** — [HOSTING PROVIDER, e.g. AWS / GCP / Azure / VPS provider] and **S3-compatible object storage** [STORAGE PROVIDER] | All Platform data (hosted on their infrastructure) and uploaded files (photos, documents, delivery proof images) | Hosting, database, file storage, backups |
| **Professional advisers** | As needed | Legal, accounting, audit |
| **Authorities** | As required by law | Compliance with lawful requests, tax, police, courts, food-safety regulators |
| **Business transfer** | Platform data | In a merger, acquisition or sale of assets, subject to this policy |

Service providers acting as our processors are bound by contracts requiring them to protect your data and use it only on our instructions. **We do not sell personal data or share it with third parties for their own advertising.**

[OPTIONAL — IF YOU ADD ANALYTICS, CRASH REPORTING, ADVERTISING OR CUSTOMER-SUPPORT TOOLS, LIST THEM HERE. The FeastFlow code base does not include third-party analytics or advertising SDKs by default.]

## 7. Retention

We keep personal data only as long as needed for the purposes above, then delete or anonymise it. Suggested periods (adjust with counsel to your local legal requirements):

| Data | Retention period |
|---|---|
| Account and profile data | While your account is active; deleted when you delete your account (see Section 13), subject to the exceptions below |
| Order, payment, refund and transaction records | [8 YEARS / PERIOD REQUIRED BY TAX AND ACCOUNTING LAW IN YOUR JURISDICTION] after the transaction |
| Rider live location | Only the latest position is kept on the rider profile and overwritten with each update; [DELETE/ANONYMISE RELATED LOGS AFTER X DAYS] |
| Delivery proof photos | [90 DAYS] after delivery, unless needed for an open dispute |
| OTPs and password-reset tokens | Until used or expired (minutes) |
| Restaurant and rider KYC documents | For the duration of the partnership plus [X YEARS] or as required by law |
| Support communications | [2 YEARS] after the ticket is closed |
| Reviews | Until you delete them or your account, or we remove them under our content rules |
| Server logs and backups | [30–90 DAYS] rolling; backups are overwritten on a rolling schedule of [X DAYS] |

## 8. Security

We use reasonable technical and organisational measures, including: encryption in transit (HTTPS/TLS); passwords stored as salted bcrypt hashes; short-lived access tokens with refresh tokens; rate-limited and attempt-limited OTPs; role-based access control for admin staff with granular permissions; payment card data handled only by PCI-DSS-compliant gateways; restricted access to production databases and backups. [ADD: encryption at rest, penetration testing, staff training, incident response plan — only if true.]

No system is completely secure. If we become aware of a personal data breach affecting you, we will notify you and the relevant authorities as required by law (for example, the Data Protection Board of India and affected Data Principals under the DPDP Act, or a supervisory authority within 72 hours under the GDPR).

Keep your password and OTPs confidential. **FeastFlow staff will never ask for your OTP, password, card PIN or UPI PIN.** Only share the 4-digit delivery OTP with the rider at the time of handover (configured value `businessRules.deliveryOtpLength` = 4).

## 9. Children

The Platform is not intended for children. You must be at least **[18] years old** (or the age of majority in your jurisdiction) to create an account. Delivery Partners and Restaurant Partners must be adults. We do not knowingly collect personal data from children. Under India's DPDP Act a "child" is anyone under 18, and processing their data requires verifiable parental consent; under the GDPR the relevant age may be 13–16 depending on the country. If you believe a child has provided us with personal data, contact [PRIVACY EMAIL] and we will delete it.

## 10. Cookies and similar technologies

Our mobile apps do not use browser cookies. Our web admin panel and vendor dashboard use your browser's local storage to keep you signed in and remember your language and dark-mode preferences; they do not include advertising or analytics trackers by default. See our **Cookie Policy** at [COOKIE POLICY URL] for details.

## 11. International data transfers

Your data is stored on servers located in **[HOSTING REGION, e.g. India (Mumbai) / EU (Frankfurt)]**. Some service providers (e.g. Stripe, Twilio, Google Firebase, Google Maps) may process data in other countries, including the United States. Where we transfer personal data outside your country, we do so in compliance with applicable law — for example, by using the European Commission's Standard Contractual Clauses (or UK International Data Transfer Addendum) for transfers from the EEA/UK, and in accordance with any restrictions notified by the Government of India under Section 16 of the DPDP Act. You can request a copy of the relevant safeguards at [PRIVACY EMAIL].

## 12. Your rights and choices

Depending on where you live, you may have the right to:

- **Access** the personal data we hold about you;
- **Correct** inaccurate or incomplete data (most profile fields and addresses can be edited in the app);
- **Delete** your data (see Section 13);
- **Withdraw consent** at any time — e.g. turn off location permission or notification permission in your device settings, change notification preferences (push/email/SMS) in the app, or switch to Offline (riders);
- **Object** to processing based on legitimate interests, and to direct marketing at any time;
- **Restrict** processing in certain cases;
- **Data portability** — receive data you gave us in a structured, machine-readable format;
- **Nominate** another person to exercise your rights in the event of death or incapacity (India DPDP Act);
- **Grievance redressal** and **complaint** to a regulator (see Sections 15–17).

To exercise these rights, email [PRIVACY EMAIL] from your registered email, or contact us via in-app support. We may need to verify your identity. We will respond within **[30 DAYS / THE PERIOD REQUIRED BY LAW]**. We will not discriminate against you for exercising your rights.

**Turning off permissions:** If you disable location, you can still enter addresses manually (customers), but riders cannot go Online without location. If you disable push notifications you may miss order updates.

## 13. Account deletion

You can delete your account at any time **in the app: Profile → Settings → Delete account**, then confirm. You can also email [PRIVACY EMAIL] from your registered email address.

- An account cannot be deleted while you have an **active order** (placed, accepted, preparing, ready or picked up). Wait until the order is delivered or cancelled.
- When you delete your account, your user profile (name, phone, email, password hash, saved addresses, favourites, push tokens, referral code and notification preferences) is deleted from our live database.
- **Any remaining FeastFlow Wallet balance is forfeited on deletion** unless otherwise required by law. [CONFIRM WITH COUNSEL — consider offering a refund of topped-up wallet balance before deletion.]
- We retain **order, payment, refund and transaction records** (which reference your order but not your profile) for the period required by tax and accounting law (Section 7), and may retain data needed to resolve open disputes, prevent fraud or comply with legal obligations.
- Reviews you wrote may remain visible without your name, or be removed, at our discretion. [CONFIRM AND CONFIGURE.]
- Copies in backups are deleted as backups roll over (Section 7).
- **Restaurant Partners and Delivery Partners:** deleting your user login does not automatically delete your restaurant listing or rider record (needed for settlement of outstanding payouts and tax records). Contact [PARTNER SUPPORT EMAIL] to close your partner account fully and receive any final payout.

## 14. Marketing communications

We may send you offers, coupons and updates by push notification, SMS or email where permitted by law. You can opt out at any time via **notification preferences** in the app, the unsubscribe link in emails, or by contacting us. In India, promotional SMS/calls are subject to TRAI's commercial communications (DLT/DND) regulations. Transactional messages (OTPs, order and refund updates) will still be sent.

## 15. GDPR / UK GDPR (users in the EEA, UK and Switzerland)

*[INCLUDE ONLY IF YOU OFFER SERVICES TO PEOPLE IN THE EEA/UK/SWITZERLAND. OTHERWISE DELETE THIS SECTION.]*

- **Controller:** [COMPANY LEGAL NAME], [REGISTERED ADDRESS].
- **EU Representative (Art. 27 GDPR):** [EU REPRESENTATIVE NAME AND ADDRESS] — required if you are not established in the EU but offer services to people there.
- **UK Representative:** [UK REPRESENTATIVE NAME AND ADDRESS].
- **Data Protection Officer:** [DPO NAME], [DPO EMAIL] — [OR STATE THAT A DPO IS NOT REQUIRED].
- **Legal bases:** see Section 5.
- **Your rights:** access, rectification, erasure, restriction, portability, objection, and the right not to be subject to solely automated decisions with legal or similarly significant effects (Arts. 15–22 GDPR); the right to withdraw consent at any time.
- **Transfers:** see Section 11 (Standard Contractual Clauses / UK Addendum).
- **Complaints:** you may lodge a complaint with your local supervisory authority (e.g. the data protection authority in your EU member state, or the UK Information Commissioner's Office). We would appreciate the chance to address your concern first at [PRIVACY EMAIL].

## 16. India — Digital Personal Data Protection Act, 2023 (DPDP Act)

*[REVIEW WITH INDIAN COUNSEL. The DPDP Rules notified by the Government of India set out detailed timelines and formats; update this section to match the Rules in force on your Effective Date.]*

**16.1 Data Fiduciary.** [COMPANY LEGAL NAME] is the Data Fiduciary for personal data processed through FeastFlow. Our processors (Section 6) act as Data Processors on our behalf.

**16.2 Notice and consent.** We process your digital personal data on the basis of your **consent**, given through a clear affirmative action (e.g. creating an account, granting location permission, opting in to promotions), or for **certain legitimate uses** permitted by Section 7 of the DPDP Act — for example, where you voluntarily provide data for a specified purpose (such as giving your address to receive a delivery), compliance with law or court orders, and responding to medical emergencies or threats to safety. This policy serves as our notice describing the personal data and purposes. You may access this notice in English or any language listed in the Eighth Schedule of the Constitution of India — [STATE WHICH LANGUAGES YOU PROVIDE; the app currently supports English and Hindi among others].

**16.3 Withdrawal of consent.** You can withdraw consent as easily as you gave it — through app settings, device permissions, notification preferences, account deletion, or by writing to the Grievance Officer. After withdrawal we will stop processing (and cause our processors to stop) within a reasonable time, unless processing is required or authorised by law. Withdrawal may mean we cannot provide some or all services.

**16.4 Your rights as a Data Principal.** You have the right to:
- obtain a summary of the personal data we process and the processing activities, and the identities of other Data Fiduciaries and Processors with whom it has been shared (Section 11);
- correction, completion, updating and erasure of your personal data (Section 12);
- grievance redressal (Section 13);
- nominate another individual to exercise your rights in case of death or incapacity (Section 14).

**16.5 Your duties.** Under Section 15 of the DPDP Act, you must not impersonate another person, suppress material information when providing data for KYC/verification, or register false or frivolous grievances.

**16.6 Grievance Officer.**
- Name: **[GRIEVANCE OFFICER NAME]**
- Designation: [DESIGNATION]
- Email: [GRIEVANCE EMAIL]
- Phone: [GRIEVANCE PHONE]
- Address: [REGISTERED ADDRESS]
- Hours: [WORKING HOURS AND DAYS]

We will acknowledge your grievance within [24/48 HOURS] and resolve it within **[THE PERIOD PRESCRIBED UNDER THE DPDP RULES, e.g. 90 DAYS / SHORTER PERIOD]**. This Grievance Officer also serves as the grievance officer under the Information Technology Act, 2000 and IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Consumer Protection (E-Commerce) Rules, 2020, as applicable. [CONFIRM WITH COUNSEL.]

**16.7 Consent Managers.** You may give, manage, review and withdraw your consent through a **Consent Manager** registered with the Data Protection Board of India, once such Consent Managers are available and integrated. [IF YOU INTEGRATE WITH A CONSENT MANAGER, NAME IT HERE: CONSENT MANAGER NAME AND LINK.]

**16.8 Data Protection Board of India.** If you are not satisfied with our response to your grievance, you may file a complaint with the **Data Protection Board of India** after exhausting our grievance redressal process, in the manner prescribed under the DPDP Act and Rules.

**16.9 Children.** We do not knowingly process personal data of children (under 18) without verifiable parental consent, and we do not track, behaviourally monitor or target advertising at children.

**16.10 [SIGNIFICANT DATA FIDUCIARY — OPTIONAL].** If the Government notifies [COMPANY LEGAL NAME] as a Significant Data Fiduciary, we will appoint a Data Protection Officer based in India: [DPO NAME, CONTACT].

## 17. California and other US state privacy laws (optional)

*[OPTIONAL — INCLUDE ONLY IF YOU OPERATE IN THE US AND MEET THE APPLICABLE THRESHOLDS (e.g. CCPA/CPRA). OTHERWISE DELETE.]*

- **Categories collected (last 12 months):** identifiers (name, phone, email, account IDs); customer records; commercial information (order history); geolocation data (precise — sensitive personal information); internet or electronic activity (logs, device tokens); audio/visual information (photos); professional information (riders and vendors); inferences (none drawn by default).
- **Sources, purposes and recipients:** see Sections 3, 4 and 6.
- **Sale / sharing:** We do **not** sell personal information or share it for cross-context behavioural advertising. [IF THIS CHANGES, ADD A "DO NOT SELL OR SHARE MY PERSONAL INFORMATION" LINK.]
- **Sensitive personal information:** precise geolocation is used only to provide the services you request, not to infer characteristics.
- **Your rights:** to know/access, delete, correct, opt out of sale/sharing, limit use of sensitive personal information, and not to be discriminated against for exercising these rights. Submit requests to [PRIVACY EMAIL] or [TOLL-FREE NUMBER]. Authorised agents may submit requests with proof of authorisation.
- **Retention:** see Section 7.

## 18. Other regions

If you operate FeastFlow outside India and the EEA/UK (e.g. UAE PDPL, Saudi PDPL, Brazil LGPD, Singapore PDPA, Australia Privacy Act), add a jurisdiction-specific section here with the local regulator, rights and representative details. [ADAPT FOR YOUR REGION.]

## 19. Changes to this policy

We may update this policy from time to time, for example when we add features or change service providers. We will post the updated version in the app and on [WEBSITE URL] with a new "Last updated" date, and where changes are material, notify you by in-app notice, push notification or email before they take effect. Where the law requires, we will ask for your consent again.

## 20. Contact us

- **Company:** [COMPANY LEGAL NAME]
- **Registered address:** [REGISTERED ADDRESS]
- **Privacy questions:** [PRIVACY EMAIL]
- **Customer support:** [SUPPORT EMAIL] / [SUPPORT PHONE]
- **Grievance Officer:** [GRIEVANCE OFFICER NAME], [GRIEVANCE EMAIL] (see Section 16.6)
- **EU Representative / DPO:** see Section 15
