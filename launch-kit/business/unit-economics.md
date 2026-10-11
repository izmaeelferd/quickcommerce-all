# FeastFlow: Unit Economics

> **All numbers in this document are ILLUSTRATIVE.** They use FeastFlow's default business rules (Admin → Config → Business Rules) and clearly labelled **assumptions** for things the platform does not control (order value, distance, gateway fees, marketing). Replace them with your own data once you have real orders (**Finance → Reports**). The formulas match `backend/utils/pricing.js` and `backend/controllers/orderController.js` exactly.

---

## 1. Inputs

### 1.1 Platform defaults (from code, editable in Admin)
| Input | Key | Default |
|---|---|---|
| Commission | `commissionPercent` | 18% (per-restaurant override possible) |
| Delivery fee: base | `deliveryFee.base` | ₹30 |
| Delivery fee: km included in base | `deliveryFee.baseKm` | 2 km |
| Delivery fee: per extra km | `deliveryFee.perKm` | ₹8 |
| Free delivery above | `deliveryFee.freeAbove` | ₹499 subtotal |
| Surge | `surgePricing` | off, 1.5× when on (applies to delivery fee) |
| Packaging fee | `packagingFee` | ₹15 (goes to restaurant) |
| Platform fee | `platformFee` | ₹0 |
| Tax | `taxPercent` | 5% on (subtotal − discount) |
| Rider payout | `deliveryPartnerPayout` | ₹25 + ₹6 × km (full distance) + 100% of tip |
| Min order | `minOrderValue` | ₹99 |
| Wallet cap per order | `walletMaxUsePercent` | 50% |
| Referral credits | `referralBonus` / `refereeBonus` | ₹50 / ₹50 |
| WELCOME50 coupon | Coupons | 50% off, max ₹150, min ₹199, first order only |

### 1.2 Assumptions (yours to replace, labelled)
| Assumption | Illustrative value | How to get the real number |
|---|---|---|
| Average food subtotal per order (AOV) | ₹400 | Finance → Reports: GMV ÷ orders (use the subtotal-based restaurant report) |
| Average delivery distance | 4 km | Order export: average `distanceKm` |
| Average tip | ₹20 | Order export: tip column |
| Payment gateway fee | **2% of amount collected online** (assumption; check your Razorpay/Stripe contract, and add 18% GST on the fee if you cannot claim it as input credit) | Gateway dashboard / settlement reports |
| Other variable cost per order (SMS/OTP, support, refunds leakage, maps) | ₹5 | Twilio, support tooling and refund reports ÷ orders |
| Fixed costs per month (team, office, servers, marketing retainers) | ₹5,00,000 | Your budget: [FIXED COSTS / MONTH] |
| Orders per active customer per month | 2 | Cohort analysis from order export |
| Average customer lifetime | 6 months | Cohort retention curve |
| Blended CAC (marketing + acquisition incentives ÷ new ordering customers) | ₹250 | Ad spend + platform-funded coupons + referral credits ÷ first orders |

---

## 2. Formulas

```
GMV (customer-paid)   = Σ total               (what Admin Dashboard "GMV" sums: pricing.total)
Food GMV              = Σ subtotal           (what the restaurant report "GMV" sums)
AOV                   = Food GMV ÷ orders

deliveryFee           = 0 if (freeAbove > 0 and subtotal ≥ freeAbove) or free_delivery coupon
                        else base + max(0, km − baseKm) × perKm
surgeFee              = surge on ? deliveryFee × (multiplier − 1) : 0
discount              = min(coupon discount, subtotal)
                        percent coupon: min(subtotal × value%, maxDiscount); flat: value
tax                   = (subtotal − discount) × taxPercent
customerTotal         = (subtotal − discount) + deliveryFee + surgeFee + packaging + platformFee + tax + tip

commission            = (subtotal − discount) × commission%
vendorEarning         = subtotal − discount − commission + packaging
riderPay              = riderBase + km × riderPerKm            (excl. tip)
riderTip              = tip × tipShare%                        (= tip at default)
gatewayFee            = amount collected online × gateway%     (0 for COD/wallet-only)

Contribution margin   = commission + deliveryFee + surgeFee + platformFee
  (CM) per order        + tip × (1 − tipShare%)
                        − riderPay − gatewayFee − otherVariableCost
Check                 = customerTotal − vendorEarning − riderPay − riderTip − tax − gatewayFee − otherVariableCost  (must equal CM)

Take rate             = CM ÷ AOV
Break-even orders/day = Fixed costs per month ÷ (CM × 30)
LTV                   = orders/customer/month × lifetime months × CM
LTV : CAC             = LTV ÷ CAC
CAC payback (months)  = CAC ÷ (CM × orders/customer/month)
```

---

## 3. Worked examples (illustrative, default rules)

### Example A: typical order (₹400 subtotal, 4 km, ₹20 tip, no coupon, paid online)

| Line | Calculation | ₹ |
|---|---|---|
| Food subtotal | assumption | 400.00 |
| Discount | none | 0.00 |
| Delivery fee | 30 + (4 − 2) × 8 | 46.00 |
| Surge fee | off | 0.00 |
| Packaging | default | 15.00 |
| Platform fee | default | 0.00 |
| GST 5% | 400 × 5% | 20.00 |
| Tip | assumption | 20.00 |
| **Customer pays** | | **501.00** |
| Commission (18%) | 400 × 18% | 72.00 |
| **Restaurant earning** | 400 − 0 − 72 + 15 | **343.00** |
| Rider distance pay | 25 + 4 × 6 | 49.00 |
| Rider tip | 20 × 100% | 20.00 |
| **Rider earning** | | **69.00** |
| Gateway fee (2%, assumption) | 501 × 2% | 10.02 |
| Other variable cost (assumption) | | 5.00 |
| **Contribution margin** | 72 + 46 − 49 − 10.02 − 5 | **53.98** |
| Check | 501 − 343 − 49 − 20 − 20 − 10.02 − 5 | 53.98 (matches) |
| Take rate | 53.98 ÷ 400 | 13.5% |

Where the platform's ₹53.98 comes from: **commission +72**, **delivery −3** (46 in, 49 out), **gateway −10.02**, **other −5**.

### Example B: first order with WELCOME50 (same basket)

WELCOME50 = 50% off, capped at ₹150 → discount = min(400 × 50%, 150) = **₹150**.

| Line | Calculation | ₹ |
|---|---|---|
| Subtotal − discount | 400 − 150 | 250.00 |
| Delivery fee | free-delivery threshold checks the **subtotal** (400 < 499), so the fee applies | 46.00 |
| Packaging | | 15.00 |
| GST 5% | 250 × 5% | 12.50 |
| Tip | | 20.00 |
| **Customer pays** | | **343.50** |
| Commission | 250 × 18% | 45.00 |
| **Restaurant earning (as coded)** | 400 − 150 − 45 + 15 | **220.00** |
| Rider earning | 49 + 20 | 69.00 |
| Gateway fee | 343.50 × 2% | 6.87 |
| Other variable | | 5.00 |
| **CM, as coded (vendor funds coupon)** | 45 + 46 − 49 − 6.87 − 5 | **30.13** |
| **CM if platform reimburses vendor ₹150 off-platform** | 30.13 − 150 | **−119.87** |

**Coupon cost:** as coded, the restaurant loses ₹123 vs Example A (343 → 220) and the platform loses ₹23.85 (53.98 → 30.13, mostly commission on the discounted ₹150 plus a lower gateway fee). If you choose to **fund** the welcome offer yourself (recommended for partner goodwill), count ₹150 plus the lost commission as **CAC**, not as an ongoing order cost. See `revenue-model.md` section 4.

### Example C: free delivery (₹550 subtotal ≥ ₹499, 4 km, no tip)

| Line | ₹ |
|---|---|
| Customer pays: 550 + 0 delivery + 15 packaging + 27.50 GST | 592.50 |
| Commission 18% × 550 | 99.00 |
| Restaurant earning: 550 − 99 + 15 | 466.00 |
| Rider pay: 25 + 4 × 6 (paid even though customer paid no delivery fee) | 49.00 |
| Gateway 2% × 592.50 | 11.85 |
| Other variable | 5.00 |
| **CM**: 99 − 49 − 11.85 − 5 | **33.15** |

A bigger basket can earn the platform **less** than a ₹400 basket because free delivery removes ₹46 of fee income. If many orders cluster just above ₹499, consider raising `freeAbove` or using **FREEDEL**-style coupons with a narrower window instead.

### Example D: surge on (Example A with surge 1.5×)
Surge fee = 46 × 0.5 = ₹23 (rider pay unchanged). Customer pays 524.00; gateway 10.48. **CM = 72 + 46 + 23 − 49 − 10.48 − 5 = 76.52.**

### Example E: COD (Example A paid in cash)
No gateway fee → **CM = 72 + 46 − 49 − 5 = 64.00**, but add cash-handling risk and the cost of manual reconciliation (the rider app has no COD cash ledger; see `revenue-model.md` section 3.8).

### Sensitivity: CM per order vs distance and commission (₹400 basket, online, ₹20 tip, other variable ₹5)

Gateway fee varies slightly with the delivery fee; rounded to the nearest rupee.

| Distance | Commission 10% (launch offer) | 15% | **18% (default)** | 22% |
|---|---|---|---|---|
| 1 km | 24 | 44 | **56** | 72 |
| 2 km | 18 | 38 | **50** | 66 |
| 4 km | 22 | 42 | **54** | 70 |
| 6 km | 26 | 46 | **58** | 74 |
| 8 km | 29 | 49 | **61** | 77 |

(Each cell = 400 × commission% + delivery margin from the table in `revenue-model.md` − 2% × customer total − 5.) For example, 4 km at 10%: 40 − 3 − 10.02 − 5 = 21.98 ≈ 22.

**Takeaways (with defaults):**
1. Commission is essentially the whole profit; delivery runs at a small loss below 5.5 km.
2. A 10% launch commission roughly halves the per-order margin, so cap launch offers by time **and** volume.
3. Free delivery above ₹499 is the single biggest margin drain on large baskets.

---

## 4. Customer economics (illustrative)

| Metric | Formula | Illustrative |
|---|---|---|
| CM per order (Example A) | | ₹53.98 |
| Orders / customer / month | assumption | 2 |
| Lifetime | assumption | 6 months |
| **LTV** | 2 × 6 × 53.98 | **₹647.76** |
| CAC (blended) | assumption: ads + platform-funded coupons + referral credits (₹50 + ₹50 per referred user) | ₹250 |
| **LTV : CAC** | 647.76 ÷ 250 | **2.6×** |
| **CAC payback** | 250 ÷ (53.98 × 2) | **2.3 months** |

Target ranges people commonly use: LTV:CAC ≥ 3× and payback under 6 months. Treat these as rules of thumb, not benchmarks. Check them against reports on comparable marketplaces before you put them in a deck.

## 5. Break-even (illustrative)

| Metric | Formula | Illustrative |
|---|---|---|
| Fixed costs / month | [FIXED COSTS / MONTH] | ₹5,00,000 |
| CM per order | Example A | ₹53.98 |
| **Break-even orders / month** | 5,00,000 ÷ 53.98 | **9,263** |
| **Break-even orders / day** | 9,263 ÷ 30 | **≈ 309** |
| Equivalent with ~30% of orders on WELCOME50-style CM (₹30.13) | blended CM = 0.7 × 53.98 + 0.3 × 30.13 = 46.83 | ≈ **356 / day** |

---

## 6. Copy-paste spreadsheet (Google Sheets / Excel)

Paste column A (labels) and column B (values or formulas) starting at cell **A1**. Inputs are in rows 2–25; outputs in rows 27–46 (rows 47–49 are optional helpers). Formulas use the same logic as `pricing.js`.

| Row | A (label) | B (value / formula) |
|---|---|---|
| 1 | **INPUTS** | |
| 2 | Food subtotal (AOV) ₹ | `400` |
| 3 | Distance km | `4` |
| 4 | Tip ₹ | `20` |
| 5 | Coupon discount ₹ (enter computed discount) | `0` |
| 6 | Commission % | `18` |
| 7 | Delivery base ₹ | `30` |
| 8 | Base km | `2` |
| 9 | Per extra km ₹ | `8` |
| 10 | Free delivery above ₹ (0 = never) | `499` |
| 11 | Surge enabled (1/0) | `0` |
| 12 | Surge multiplier | `1.5` |
| 13 | Packaging ₹ | `15` |
| 14 | Platform fee ₹ | `0` |
| 15 | Tax % | `5` |
| 16 | Rider base ₹ | `25` |
| 17 | Rider per km ₹ | `6` |
| 18 | Tip share to rider % | `100` |
| 19 | Gateway fee % (assumption) | `2` |
| 20 | Share of orders paid online % (assumption) | `100` |
| 21 | Other variable cost per order ₹ (assumption) | `5` |
| 22 | Fixed costs per month ₹ (assumption) | `500000` |
| 23 | Orders per customer per month (assumption) | `2` |
| 24 | Customer lifetime months (assumption) | `6` |
| 25 | CAC ₹ (assumption) | `250` |
| 26 | **OUTPUTS** | |
| 27 | Delivery fee | `=IF(AND(B10>0,B2>=B10),0,B7+MAX(0,B3-B8)*B9)` |
| 28 | Surge fee | `=IF(AND(B11=1,B12>1,B27>0),B27*(B12-1),0)` |
| 29 | Discount applied | `=MIN(B5,B2)` |
| 30 | Taxable food value | `=MAX(0,B2-B29)` |
| 31 | Tax | `=B30*B15/100` |
| 32 | Customer total | `=B30+B27+B28+B13+B14+B31+B4` |
| 33 | Commission | `=B30*B6/100` |
| 34 | Restaurant earning | `=B2-B29-B33+B13` |
| 35 | Rider distance pay | `=B16+B3*B17` |
| 36 | Rider tip | `=B4*B18/100` |
| 37 | Gateway fee | `=B32*B20/100*B19/100` |
| 38 | Delivery margin | `=B27+B28-B35` |
| 39 | **Contribution margin / order** | `=B33+B27+B28+B14+(B4-B36)-B35-B37-B21` |
| 40 | Check (must equal B39) | `=B32-B34-B35-B36-B31-B37-B21` |
| 41 | Take rate | `=B39/B2` |
| 42 | Break-even orders / month | `=B22/B39` |
| 43 | Break-even orders / day | `=B42/30` |
| 44 | LTV | `=B23*B24*B39` |
| 45 | LTV : CAC | `=B44/B25` |
| 46 | CAC payback (months) | `=B25/(B39*B23)` |
| 47 | WELCOME50 discount helper (50%, cap 150, min 199) | `=IF(B2>=199,MIN(B2*0.5,150),0)` |
| 48 | Customer pays from wallet (cap 50%) given wallet bal in C48 | `=MIN(C48,B32*0.5)` |
| 49 | Platform GMV (customer total) for N orders in C49 | `=B32*C49` |

**Tab-separated version** (paste directly into cell A1 of an empty sheet):

```
INPUTS	
Food subtotal (AOV)	400
Distance km	4
Tip	20
Coupon discount	0
Commission %	18
Delivery base	30
Base km	2
Per extra km	8
Free delivery above (0=never)	499
Surge enabled (1/0)	0
Surge multiplier	1.5
Packaging	15
Platform fee	0
Tax %	5
Rider base	25
Rider per km	6
Tip share to rider %	100
Gateway fee % (assumption)	2
Online paid share % (assumption)	100
Other variable cost (assumption)	5
Fixed costs per month (assumption)	500000
Orders per customer per month (assumption)	2
Customer lifetime months (assumption)	6
CAC (assumption)	250
OUTPUTS	
Delivery fee	=IF(AND(B10>0,B2>=B10),0,B7+MAX(0,B3-B8)*B9)
Surge fee	=IF(AND(B11=1,B12>1,B27>0),B27*(B12-1),0)
Discount applied	=MIN(B5,B2)
Taxable food value	=MAX(0,B2-B29)
Tax	=B30*B15/100
Customer total	=B30+B27+B28+B13+B14+B31+B4
Commission	=B30*B6/100
Restaurant earning	=B2-B29-B33+B13
Rider distance pay	=B16+B3*B17
Rider tip	=B4*B18/100
Gateway fee	=B32*B20/100*B19/100
Delivery margin	=B27+B28-B35
Contribution margin per order	=B33+B27+B28+B14+(B4-B36)-B35-B37-B21
Check (= CM)	=B32-B34-B35-B36-B31-B37-B21
Take rate	=B39/B2
Break-even orders per month	=B22/B39
Break-even orders per day	=B42/30
LTV	=B23*B24*B39
LTV : CAC	=B44/B25
CAC payback months	=B25/(B39*B23)
```

With the default inputs the sheet returns: delivery fee 46, customer total 501, commission 72, restaurant earning 343, CM **53.98**, break-even **≈ 309 orders/day**, LTV **647.76**, LTV:CAC **2.59**, payback **2.32 months**, matching section 3.

### Monthly P&L tab (optional)
Columns: `Month | Orders | AOV | Food GMV (=Orders*AOV) | Commission (=FoodGMV*Comm%) | Delivery fees | Surge | Platform fees | Rider pay | Gateway fees | Coupons funded by platform | Referral credits | Other variable | Contribution (=Comm+Del+Surge+Plat−Rider−Gateway−Coupons−Referral−Other) | Fixed costs | EBITDA (=Contribution−Fixed)`. Fill actuals from **Finance → Reports** and **Finance → Transactions** exports.
