# FeastFlow — Customer Support Playbook

For: support agents and the ops admins who back them up.
Channels: [SUPPORT EMAIL], [SUPPORT PHONE], [WHATSAPP NUMBER — manual/BSP, not integrated in the app], in-app (the app has no in-app chat in v1.0 — customers reach you via the contact details in Branding / Legal pages).
Hours: [SUPPORT HOURS, e.g. 10:00–23:30 IST, 7 days].

Everything below is grounded in how the platform actually behaves (code in `backend/utils/orderFlow.js`, `backend/utils/scheduler.js`, `backend/controllers/paymentController.js`). The numbers are the **default** Business Rules — always check the live values in **Admin → Business Rules** before quoting them to a customer.

---

## 1. How money moves automatically (know this before you promise anything)

| Situation | What the system does by itself | Refund destination | Customer penalty |
|---|---|---|---|
| **Customer cancels within `cancellationWindowMinutes`** (default 5 min from order placement). Customers can only cancel while the order is `placed` or `accepted`. | Order → `cancelled`, refund runs immediately. | **Wallet** if the `wallet` feature flag is on (instant); otherwise back to the card/UPI via the gateway (wallet if the gateway refund fails). Wallet amount used on the order always returns to the wallet. | None |
| **Customer cancels after the window** (still `placed`/`accepted`) | Same, minus penalty. | Same as above | `cancellationPenaltyPercent` (default 10 %) of (online amount paid + wallet used). Recorded as a `cancellation_fee` transaction. |
| **Vendor rejects** the order | Order → `rejected`, full refund. | Same as above | None |
| **Vendor does not accept within `vendorAcceptTimeoutMinutes`** (default 5 min; for online orders the clock starts when payment succeeds) | Scheduler auto-rejects (`order.autoRejected`), full refund. Scheduled orders (delivery slot) are excluded. | Same as above | None |
| **Online payment not completed within `paymentTimeoutMinutes`** (default 15 min) | Scheduler auto-cancels (`order.paymentTimeout`); wallet amount and coupon usage restored. No money was captured, so nothing to refund. | Wallet portion → wallet | None |
| **Payment captured after the order was already cancelled** (late payment, e.g. bank delay) | Gateway webhook arrives → system refunds automatically, never fulfils the dead order (`payment.lateRefund`). | Gateway first, wallet if the gateway refund fails | None |
| **Admin/vendor cancels** an accepted/preparing/ready/picked order | Full refund. | Same as first row | None (penalty only applies when the *customer* is the actor) |
| **COD order cancelled/rejected** | Nothing was paid online; only the wallet portion (if any) is returned. | Wallet | None |
| Coupon on a cancelled/rejected order | Usage count is given back, customer can reuse it. | — | — |

Important facts:
- Gateway refunds take **[5–7 business days]** to reach the customer's bank/card (Razorpay/Stripe timelines; UPI is often faster). Wallet refunds are instant.
- If an automatic gateway refund **fails**, the system credits the full refund to the customer's **wallet** instead (logged as `[refund] gateway refund failed, crediting wallet`) and marks the payment `refunded`/`partially_refunded`. Ops lists these customers every morning (`admin-daily-runbook.md` §1.4); if a customer wants the money in the bank, use §4.3. A cancelled/rejected order still showing **paid** means the refund did not run at all — refund manually (§4.1).
- Refunds do not change the order status. Admin refunds are allowed only while the payment status is exactly `paid` — once an order is `refunded` or `partially_refunded`, further refunds go through the wallet adjust (§4.2) or the gateway dashboard.
- With the `wallet` flag on, automatic cancellation refunds go to the **wallet**, not the bank. Make sure your Refund Policy (**Admin → Legal Pages → refundPolicy**) says so. If a customer insists on a bank refund see §4.3.

---

## 2. Refund decision matrix (manual cases)

"Item value" = the price of the affected item(s) incl. add-ons, from the order detail. "Order payable" = what the customer paid (`pricing.payable`). Default destination for goodwill = **wallet**; to source only if the customer asks or the policy requires.

| # | Case | Evidence to collect | Decision | Amount | Destination | Who can approve |
|---|---|---|---|---|---|---|
| R1 | Order cancelled/rejected but still shows **paid** (rare: automatic refund did not run) | Order detail | Refund — system failed | Full payable | Source | Tier 1 |
| R2 | Charged but no order created / order auto-cancelled and money debited | UTR / bank SMS, time, amount, phone | Check gateway dashboard first (§3 T5). Usually auto-refunded by the gateway or our late-payment refund | Full | Source (via gateway dashboard if no order exists) | Tier 2 |
| R3 | Missing item(s) | Photo of bag/receipt, item names | Refund the missing items | Item value (+ proportional tax) | Wallet (default) or source | Tier 1 up to [₹X]; Tier 2 above |
| R4 | Wrong item delivered | Photo | Refund item; full order if main dish wrong and inedible for the customer (allergy/veg vs non-veg) | Item value; full payable for veg/non-veg or allergy mismatch | Customer's choice | Tier 1 up to [₹X]; veg/non-veg mismatch → Tier 2 always (also flag vendor) |
| R5 | Quality issue (cold, spilled, damaged) | Photo within [2] h of delivery | Partial goodwill | [25–50]% of item value or coupon | Wallet | Tier 1 up to [₹X] |
| R6 | Late delivery, food delivered | Order timeline (status history in order modal) | Apology; goodwill if > [30] min past ETA | Delivery fee or [₹X] wallet credit | Wallet | Tier 1 |
| R7 | Never delivered but marked `delivered` | Rider location/OTP: delivery OTP and photo proof are recorded on the order if enabled | If OTP was not used and no photo proof → refund and investigate rider | Full payable | Source | Tier 2 (+ rider investigation) |
| R8 | Customer changed mind after window | — | Policy penalty applies automatically; no extra refund | — | — | — |
| R9 | Restaurant closed/couldn't fulfil after accepting | Vendor confirmation | Admin cancels the order (no penalty) | Full (automatic) | Automatic | Tier 1 |
| R10 | Duplicate charge (two payments, one order) | Two gateway payment IDs | Refund the duplicate in the gateway dashboard | Duplicate amount | Source | Tier 2 |
| R11 | Suspected abuse (> [3] refund claims in [30] days) | Users → recent orders | Decline politely, escalate | — | — | Tier 2 / Tier 3 |
| R12 | Rider misconduct | Description, time | Apology + goodwill; rider escalation | [₹X] | Wallet | Tier 2 |

Recording rule: every manual refund/credit needs a **reason** that includes the order number and case code, e.g. `R3 #ORD123 missing raita`. Use it in the wallet-adjust reason field (Admin → Users).

Vendor recovery: for R3/R4/R5 attributable to the restaurant, log it in [VENDOR DEDUCTIONS SHEET] for deduction at the next vendor payout (there is no automatic vendor charge-back in v1.0 — see backlog `FIN-03`).

---

## 3. Escalation tiers and SLAs

| Tier | Who | Handles | First response SLA | Resolution SLA |
|---|---|---|---|---|
| **Tier 1** | Support agents (Admin Role with `orders`, `users` read, `transactions`) | All tickets; refunds ≤ [₹X]; wallet credits ≤ [₹Y]; reassigning riders; status corrections | [15 min] chat/phone, [4 h] email | [24 h] |
| **Tier 2** | Ops lead / senior agent | Refunds above limits, payment disputes, vendor/rider complaints, account recovery, bans | [1 h] | [48 h] |
| **Tier 3** | Engineering on-call [NAME/PHONE] | Bugs, system-wide failures, data fixes, anything needing server access | Per severity in `incident-response.md` | Per severity |
| **Management** | [FOUNDER / HEAD OF OPS] | Legal threats, press/social media, chargebacks > [₹Z], safety incidents | [1 h] | case by case |

Escalate immediately (skip tiers) for: food safety / allergic reaction, rider accident or safety threat, harassment, data/privacy complaints (route to [GRIEVANCE OFFICER NAME] / [GRIEVANCE EMAIL] per DPDP Act 2023 timelines), more than [5] similar tickets in [15] min (likely incident → Tier 3).

Priority labels: **P1** money taken/no food, safety; **P2** order in progress problem; **P3** post-delivery complaint; **P4** questions/feedback.

---

## 4. How to execute in the Admin Panel

### 4.1 Refund an order — Admin → Orders
1. **Orders** → type the order number in the search box (or filter by status).
2. Click the row → order modal opens (items, bill breakdown, commission, timeline/status history, delivery photo if any).
3. The refund block appears **only when payment status is `paid`**:
   - **Refund amount**: leave empty for the full payable amount, or type a partial amount.
   - **Refund to source** → refunds through Razorpay/Stripe to the original card/UPI (COD/wallet-paid orders are returned to the wallet).
   - **Refund to wallet** → instant wallet credit (only if the `wallet` feature is on; otherwise it goes to source).
4. Toast "refunded" = done. Payment status becomes `refunded` (full) or `partially_refunded`.
5. Permission needed: `transactions`.

Need to stop an order instead? Same modal → **Update status** → `cancelled` (admin cancellation = full automatic refund, no penalty). Allowed from `placed`, `accepted`, `preparing`, `ready`, `picked`.

### 4.2 Credit or debit a wallet — Admin → Users
1. **Users** → role filter `customer` → search name/email/phone → click the row.
2. The detail shows wallet balance, lifetime spend, referral code, recent orders.
3. **Adjust wallet**: amount (positive = credit, negative = debit) + **reason** (case code + order number) → **Apply**.
4. Creates a wallet transaction visible in **Transactions**.

### 4.3 Customer wants bank refund but system refunded to wallet
1. Confirm the wallet still holds the amount (Users → detail).
2. Refund the payment in the **gateway dashboard** ([RAZORPAY/STRIPE DASHBOARD URL]) against the original payment ID (Transactions → provider ref column, or order detail).
3. Debit the same amount from the wallet: Users → Adjust wallet → `-amount`, reason `bank refund of wallet credit #ORD…`.
Tier 2 only.

### 4.4 Other actions
| Need | Where |
|---|---|
| Assign/reassign rider | Orders → modal → *Assign rider* (online approved riders) |
| Ban / unban a user | Users → detail → **Ban** / **Unban** (banned users cannot log in) |
| Hide abusive review | Reviews → toggle visibility |
| Check a payment | Transactions → type `payment`/`refund`, date range; provider + reference column |
| Suspend a restaurant | Vendors → tab `approved` → **Suspend** (reason asked) |
| Suspend a rider | Delivery Partners → **Suspend** |
| Broadcast an apology/outage notice | Notifications → audience + channels |

---

## 5. Ticket reply templates

Replace `{…}` placeholders. Keep the tone warm and short. Never share rider/vendor personal phone numbers; never ask for card numbers, CVV, UPI PIN or OTPs.

### T1 — Late delivery (order still in progress)
> Hi {name}, I'm sorry your order {order_no} from {restaurant} is running late. I've checked: it is currently **{status: being prepared / with our delivery partner}**{, and the rider is about {X} minutes away}. You can follow it live in the FeastFlow app under *Orders*. I'll keep an eye on it until it reaches you. If it arrives more than {X} minutes after the promised time, reply here and I'll make it right.
> — {agent}, FeastFlow Support

### T1b — Late delivery (delivered, goodwill)
> Hi {name}, thank you for your patience with order {order_no} — it reached you {N} minutes later than we promised, and that's not the experience we want for you. I've added **{currency}{amount}** to your FeastFlow wallet as an apology; you'll see it on your next checkout. We've also shared the feedback with {the restaurant / our delivery team}.

### T2 — Wrong item
> Hi {name}, I'm really sorry you received the wrong item in order {order_no}. Could you share a photo of what arrived (and the bill/label if there is one)? Once I have it, I'll {refund {currency}{amount} for {item} to your {wallet / original payment method}}. {If veg/non-veg mix-up: We take this very seriously — I've escalated it to the restaurant and our quality team.}

### T3 — Missing item
> Hi {name}, sorry that {item} was missing from order {order_no}. I've checked with {restaurant} and processed a refund of **{currency}{amount}** to your {FeastFlow wallet (available immediately) / original payment method (5–7 business days)}. Thanks for letting us know — it helps us fix this with the restaurant.

### T4 — Payment failed (no money taken)
> Hi {name}, your payment for order {order_no} didn't go through, so no money was taken and the order wasn't sent to the restaurant. Unpaid orders are cancelled automatically after {paymentTimeoutMinutes} minutes, so you can safely place it again — UPI, card{, wallet}{, cash on delivery for orders up to {currency}{codMaxAmount}} are available at checkout.

### T5 — Charged but no order / order cancelled after payment
Agent checklist first: (1) Admin → Orders: search by customer (Users → recent orders) — is there an order with payment `paid`, `refunded` or `pending`? (2) Admin → Transactions: type `payment`/`refund`, today. (3) Gateway dashboard: search by the customer's UTR/amount.
> Hi {name}, I'm sorry for the worry. I can see a payment of **{currency}{amount}** at {time}. {Case A — refunded automatically: Because the payment reached us after the order had timed out, our system refunded it automatically on {date} (reference {refund_ref}). Banks usually show it within 5–7 business days.} {Case B — bank-held/auto-reversed: The payment was never confirmed to us, so your bank will reverse it automatically, usually within {X} business days.} {Case C — manual: I've issued the refund now, reference {ref}.} If you don't see it by {date}, reply with your bank statement line and I'll chase it personally.

### T6 — Restaurant closed / couldn't fulfil
> Hi {name}, unfortunately {restaurant} couldn't prepare order {order_no} {because they closed early / an item ran out}. The order has been cancelled and the full amount of **{currency}{amount}** has been refunded to your {FeastFlow wallet — you can use it right away / original payment method — 5–7 business days}. Sorry about that! {Optional: Here's a code for your next order: {coupon}.}

### T7 — Rider issue
> Hi {name}, thank you for telling us about your experience with the delivery partner on order {order_no}. I'm sorry — that isn't acceptable. I've reported it to our delivery team, who will follow up with the partner. {Goodwill: I've added {currency}{amount} to your wallet.} {Safety: If you ever feel unsafe, please call {emergency number} first and then us at [SUPPORT PHONE].}

### T8 — Refund status
> Hi {name}, your refund of **{currency}{amount}** for order {order_no} was processed on {date} to your {original payment method / FeastFlow wallet}. {Source: Banks take 5–7 business days to show it; your reference number is {refund_ref} — your bank can trace it with this.} {Wallet: It's already in your wallet — open *Profile → Wallet* to see it.}

### T9 — Account / OTP issues
> Hi {name}, sorry you're having trouble signing in. A few things that usually fix it:
> 1. OTPs expire after {OTP_EXPIRY_MINUTES} minutes and you can request a new one after {OTP_RESEND_SECONDS} seconds.
> 2. After {OTP_MAX_ATTEMPTS} wrong attempts the code is blocked — request a fresh one.
> 3. Check your number includes the right country code, and that DND/SMS blocking isn't on.
> 4. You can also sign in with email + password{, Google or Apple}.
> If it still doesn't work, reply with the phone number/email on your account (never the OTP itself) and I'll check it.

Agent notes for T9: defaults are `OTP_EXPIRY_MINUTES=10`, `OTP_MAX_ATTEMPTS=5`, `OTP_RESEND_SECONDS=30` (server env). If many users report no SMS at once → SMS outage, escalate (`incident-response.md` §9). A banned user gets "banned" at login — only Tier 2 can unban. Account deletion requests: the app has a delete-account option in profile; follow the DPDP process for data requests.

### T10 — Wallet / coupon didn't apply
> Hi {name}, {coupon} {needs a minimum order of {currency}{min} / is for first orders only / has reached its usage limit / is valid only at {restaurant}}. Wallet balance can cover up to {walletMaxUsePercent}% of an order. {Goodwill if our mistake: I've added {currency}{amount} to your wallet.}

---

## 6. Vendor & rider support (quick answers)

| Question | Answer |
|---|---|
| Vendor: "Orders get auto-rejected" | Orders must be accepted within {vendorAcceptTimeoutMinutes} min. Keep the Partner app open/notifications on, or close the restaurant when unattended. |
| Vendor: "When do I get paid?" | Earnings (after {commissionPercent}% commission) accrue on delivered orders; visible in dashboard **Payouts**; paid [weekly on MON] once ≥ {minPayoutAmount}. |
| Rider: "Not getting orders" | Must be **approved** and **online**, with location permission allowed. While online, Android shows a persistent "You are online" notification and keeps sharing location in the background; on iOS keep the app open unless the Rider build has background location enabled. |
| Rider: "Customer didn't give OTP" | Customer sees the {deliveryOtpLength}-digit OTP in the tracking screen. Call support before leaving with the food. |
| Rider: earnings | Base {deliveryPartnerPayout.base} + {perKm}/km + {tipSharePercent}% of tips, credited on delivery; payouts [weekly]. |

---

## 7. Daily support metrics to track
Tickets/100 orders, first-response time, resolution time, refunds as % of GMV, top 5 contact reasons, repeat-claim users. Source: [HELPDESK TOOL] + Admin → Reports (orders) + Transactions (type `refund`).
