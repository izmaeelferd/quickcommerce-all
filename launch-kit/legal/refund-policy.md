# FeastFlow Refund & Cancellation Policy

> **TEMPLATE — NOT LEGAL ADVICE.** This is a starting-point template for the FeastFlow platform. It is not legal advice. **Have qualified legal counsel review it**, including against consumer-protection law (e.g. India's Consumer Protection Act, 2019 and Consumer Protection (E-Commerce) Rules, 2020) and your payment gateway's merchant terms, before publishing. Replace every `[BRACKETED PLACEHOLDER]`.
>
> **Configured values:** Numbers marked *"configured value"* are set in **Admin Panel → Config → Business Rules** (or **Feature Flags**) and can be changed at runtime. The shipped default and config key are shown, e.g. `businessRules.cancellationWindowMinutes` = 5. **Before publishing, confirm every number matches your live Admin Panel settings**, and update this policy whenever you change them.
>
> **Operator note — where refunds go (read before publishing; delete this note afterwards):** In the current FeastFlow code, refunds for **cancelled or rejected** orders are credited to the customer's **FeastFlow Wallet** (instant) **when the Wallet feature flag (`features.wallet`) is ON (the default)**, and are sent back to the **original payment method** through Razorpay/Stripe only when the Wallet feature is OFF. Refunds for **payments that arrive after an order was already cancelled** go back to the original payment method, falling back to the Wallet if the gateway refund fails. Admins can also issue a refund from **Admin → Orders** to either the original method or the Wallet. Section 4 below is written to match this behaviour with the Wallet ON. If your business or local law requires refunds to the original payment method by default (or a customer choice), either turn the Wallet feature off or change the backend (`backend/utils/orderFlow.js → refundCancelled`), and edit Section 4 accordingly. [COUNSEL: check whether refund-to-wallet without customer choice is acceptable in your jurisdiction.]

**Last updated:** [EFFECTIVE DATE]

This policy explains when you can cancel a FeastFlow order, when you get a refund, how much, and how long it takes. It forms part of the FeastFlow **Terms of Service**. The legal entity operating FeastFlow is **[COMPANY LEGAL NAME]**, [REGISTERED ADDRESS].

---

## 1. Quick summary

| Situation | Who cancels | Refund | Cancellation fee |
|---|---|---|---|
| You cancel **within the cancellation window** (configured value `businessRules.cancellationWindowMinutes` = **5 minutes** from placing the order) | You | **100%** of what you paid (online + wallet) | None |
| You cancel **after the window**, while the order is still *placed* or *accepted* | You | Amount paid **minus the cancellation fee** | **10%** of the amount you paid (configured value `businessRules.cancellationPenaltyPercent` = 10) |
| You try to cancel once the restaurant has started **preparing** or later | — | Cancellation not available in the app; contact support. Refund only at FeastFlow's discretion or where the order fails (see below). | — |
| Restaurant **rejects** your order | Restaurant | **100%** | None |
| Restaurant **does not accept in time** — order auto-rejected (configured value `businessRules.vendorAcceptTimeoutMinutes` = **5 minutes**) | System | **100%** | None |
| Restaurant cancels after accepting (e.g. item unavailable, kitchen issue) | Restaurant | **100%** | None |
| FeastFlow cancels (e.g. no rider available, safety, fraud check, pricing error) | FeastFlow | **100%** (except where cancelled due to your fraud/abuse) | None |
| **Unpaid** online order — payment not completed in time (configured value `businessRules.paymentTimeoutMinutes` = **15 minutes**) | System | Nothing was charged; any wallet amount and coupon are restored | None |
| Payment completes **after** the order was cancelled | System | **100% automatic refund** to the original payment method (Wallet if the gateway refund fails) | None |
| Missing, wrong, damaged, spilled or poor-quality items | You report | Partial or full refund after review (Section 6) | None |
| Order not delivered (and you did not share the delivery OTP) | You report | Full refund after review (Section 6) | None |
| You were unreachable / gave a wrong address / refused delivery | — | **No refund** [COUNSEL TO CONFIRM] | — |

## 2. Cancelling an order

2.1 **How to cancel:** Open **Orders → [your order] → Cancel order** in the FeastFlow app. The Cancel option is shown only while the order is **placed** or **accepted**.

2.2 **Free cancellation window:** You can cancel free of charge for **5 minutes** after you place the order (configured value `businessRules.cancellationWindowMinutes` = 5). The window is measured from the time the order was created.

2.3 **Cancellation after the window:** If you cancel later than that, while the order is still placed or accepted, we deduct a **cancellation fee of 10%** (configured value `businessRules.cancellationPenaltyPercent` = 10) of the total amount you paid for the order (online payment + wallet amount used). The fee compensates the restaurant and delivery partner for work already started. [COUNSEL: decide whether part of the fee is passed to the restaurant; currently the fee is retained on the Platform.]

   *Example:* You paid ₹400 (₹300 by UPI + ₹100 from Wallet) and cancel 8 minutes after ordering. Fee = 10% × ₹400 = ₹40. Refund = ₹360.

2.4 **After preparation starts:** Once the restaurant marks the order as *preparing*, it cannot be cancelled from the app because the food is being made. If there is a genuine problem (e.g. a long delay), contact support — we may cancel and refund at our discretion.

2.5 **Coupons:** If an order is cancelled or rejected, the coupon usage is restored so you can use it again (subject to its validity dates).

## 3. Orders cancelled by the restaurant, the system or FeastFlow

3.1 **Restaurant rejection:** If the restaurant rejects your order, you receive a **full refund** with no fee.

3.2 **Auto-reject after timeout:** Restaurants must accept orders within **5 minutes** (configured value `businessRules.vendorAcceptTimeoutMinutes` = 5). For online payments, the timer starts when your payment succeeds; for Cash on Delivery, when you place the order. If not accepted in time, the order is **automatically rejected and fully refunded**. (Scheduled orders are not auto-rejected by this timer.)

3.3 **Payment timeout:** If you choose an online payment method but do not complete payment within **15 minutes** (configured value `businessRules.paymentTimeoutMinutes` = 15), the order is **automatically cancelled**. No money was taken by the gateway, so there is nothing to refund; any **wallet balance and coupon applied are restored**.

3.4 **Late payment:** If your bank or UPI app completes the payment **after** the order was cancelled (for example after the payment timeout), we **never fulfil** that order and **automatically refund the full amount** to your original payment method. If the gateway refund fails, the amount is credited to your FeastFlow Wallet instead.

3.5 **FeastFlow cancellation:** We may cancel an order if no delivery partner is available, for safety reasons, suspected fraud, a clear pricing error, or a restaurant closure. You receive a full refund, unless the cancellation was due to your fraud or breach of the Terms.

## 4. How and where refunds are paid

| Refund destination | When used | Typical timeline |
|---|---|---|
| **FeastFlow Wallet** | Default for cancelled or rejected orders while the Wallet feature is enabled; fallback for late-payment refunds if the gateway refund fails; and admin "refund to wallet" | **Instant** once the cancellation/rejection is processed |
| **Original payment method** (UPI, card, net banking via Razorpay/Stripe) | Late-payment refunds; cancelled/rejected orders when the Wallet feature is disabled; refunds issued by support to source | Refund is initiated immediately; typically **5–7 business days** for the money to reach your account **[CONFIRM WITH GATEWAY]** — UPI is often faster; cards can take up to [10] business days depending on your bank |
| **Cash on Delivery orders** | Nothing is paid online, so there is nothing to refund for the cash portion. If you used wallet balance towards a COD order, that wallet amount is returned to your Wallet. | Instant (wallet portion) |

4.1 Wallet balance can be used on future FeastFlow orders (up to the configured share of an order — configured value `businessRules.walletMaxUsePercent` = 50% — or in full when paying by Wallet). [STATE WHETHER/HOW A CUSTOMER CAN REQUEST WALLET REFUNDS TO SOURCE — e.g. "If you prefer a refund to your original payment method, contact support within [X] days and we will reverse the wallet credit and refund to source."]

4.2 We initiate refunds; the time for the money to appear depends on your bank, card issuer or UPI provider. If a refund to source has not arrived within **[10] business days**, contact support with your order number — we will share the gateway refund reference (ARN/RRN) so you can trace it with your bank.

4.3 Refund amounts never exceed the amount you paid for the order. Tips are refunded with cancelled orders as part of the amount paid. Discounts given by coupons are not paid out in cash.

## 5. Cash on Delivery (COD)

- COD is available for orders up to the COD limit (configured value `businessRules.codMaxAmount` = ₹2,000).
- Cancelling a COD order within the window is free. After the window, the cancellation fee applies only to any wallet amount you used on that order (because no online payment was made). [COUNSEL: if you want to charge a fee on COD cancellations, it must be collected on the next order — not currently implemented.]
- Repeatedly refusing COD orders at the door may lead to COD being disabled for your account or suspension.
- If you paid cash and there is a problem with the delivered food (Section 6), approved refunds are credited to your FeastFlow Wallet [OR: via bank/UPI transfer — CONFIRM].

## 6. Problems with a delivered order

| Issue | What to do | Outcome |
|---|---|---|
| **Missing item(s)** | Report within **[2 HOURS / 24 HOURS]** of delivery via in-app support or [SUPPORT EMAIL], with order number | Refund of the missing item(s) price (incl. applicable tax) after verification |
| **Wrong item(s)** | Report within the same window, with a photo of what you received | Refund of the wrong item(s), or full refund if the whole order is wrong |
| **Damaged / spilled packaging** | Report with photos | Partial or full refund depending on extent |
| **Quality / food safety** (e.g. foreign object, spoiled food) | Report with photos; keep the food if possible | Refund at our discretion after review with the restaurant; serious food-safety complaints are escalated to the restaurant [and the relevant authority where required] |
| **Order marked delivered but not received** | Report immediately. Note: delivery is confirmed by the **delivery OTP** you share at handover and may be backed by a **photo proof** | Full refund if investigation confirms non-delivery. If the OTP was shared, we will review the photo proof and rider location data before deciding. |
| **Very late delivery** | Contact support | Goodwill credit at our discretion; delivery times are estimates, not guarantees |

Refunds for these issues are typically credited to your **FeastFlow Wallet** (instant) or, on request, to your **original payment method** (5–7 business days, [CONFIRM WITH GATEWAY]). Refund decisions consider order history, photos, OTP and photo proof, and restaurant/rider input. Abuse of the refund process (e.g. repeated false claims) may lead to refusal and account suspension.

## 7. How to request a refund or raise a dispute

1. **In the app:** Orders → select order → Help / Support [CONFIRM IN-APP PATH], or call the restaurant using the call button for food issues.
2. **Email:** [SUPPORT EMAIL] with your order number (format `OD…`), registered phone number, a description and photos.
3. **Phone:** [SUPPORT PHONE] ([SUPPORT HOURS]).
4. **Escalation:** if you are not satisfied, contact our **Grievance Officer — [GRIEVANCE OFFICER NAME], [GRIEVANCE EMAIL], [GRIEVANCE PHONE]**. We acknowledge complaints within **[48 hours]** and aim to resolve them within **[30 days]**.
5. You may also have the right to approach a consumer commission or other dispute body under applicable law (e.g. the National Consumer Helpline 1915 in India).

## 8. Tips, wallet top-ups and referral credits

- **Tips** are refunded as part of the amount paid if the order is cancelled before delivery. Tips on delivered orders are passed 100% to the rider and are not refundable except in case of non-delivery.
- **Wallet top-ups** are [non-refundable to source except where required by law / refundable on request within [X] days]. [COUNSEL TO DECIDE.]
- **Referral and promotional credits** are not refundable or convertible to cash and may be reversed if obtained through abuse.

## 9. Changes

We may update this policy, including the configured windows, fees and limits. The version in force at the time you place your order applies to that order.

**Contact:** [COMPANY LEGAL NAME] · [REGISTERED ADDRESS] · [SUPPORT EMAIL] · [SUPPORT PHONE]
