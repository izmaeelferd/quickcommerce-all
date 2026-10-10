const { round2 } = require('./helpers');

/**
 * Computes the full order bill purely from the dynamic businessRules config.
 */
function calculateBill(rules, { subtotal, distanceKm = 0, tip = 0, couponDiscount = 0, freeDelivery = false, walletBalance = 0, useWallet = false }) {
  const df = rules.deliveryFee || {};
  const surge = rules.surgePricing || {};

  let deliveryFee = 0;
  if (!(df.freeAbove && subtotal >= df.freeAbove) && !freeDelivery) {
    const extraKm = Math.max(0, distanceKm - (df.baseKm || 0));
    deliveryFee = (df.base || 0) + extraKm * (df.perKm || 0);
  }
  let surgeFee = 0;
  if (surge.enabled && surge.multiplier > 1 && deliveryFee > 0) {
    surgeFee = deliveryFee * (surge.multiplier - 1);
  }
  const packagingFee = rules.packagingFee || 0;
  const platformFee = rules.platformFee || 0;
  const discount = Math.min(couponDiscount, subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * (rules.taxPercent || 0)) / 100;

  const maxTip = ((rules.maxTipPercent || 0) / 100) * subtotal;
  const safeTip = Math.max(0, Math.min(Number(tip) || 0, maxTip || Number(tip) || 0));

  const total = taxable + deliveryFee + surgeFee + packagingFee + platformFee + tax + safeTip;

  let walletUsed = 0;
  if (useWallet && walletBalance > 0) {
    const cap = (total * (rules.walletMaxUsePercent || 0)) / 100;
    walletUsed = Math.min(walletBalance, cap);
  }

  return {
    currencyCode: rules.currencyCode,
    currencySymbol: rules.currencySymbol,
    subtotal: round2(subtotal),
    deliveryFee: round2(deliveryFee),
    surgeFee: round2(surgeFee),
    packagingFee: round2(packagingFee),
    platformFee: round2(platformFee),
    tax: round2(tax),
    tip: round2(safeTip),
    discount: round2(discount),
    walletUsed: round2(walletUsed),
    total: round2(total),
    payable: round2(total - walletUsed),
  };
}

function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon) return { discount: 0, freeDelivery: false };
  if (coupon.discountType === 'free_delivery') return { discount: 0, freeDelivery: true };
  let discount = coupon.discountType === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return { discount: round2(Math.min(discount, subtotal)), freeDelivery: false };
}

function calculateDeliveryPayout(rules, distanceKm, tip) {
  const p = rules.deliveryPartnerPayout || {};
  const tipShare = rules.deliveryPartnerPayout && p.tipSharePercent != null ? p.tipSharePercent : 100;
  return round2((p.base || 0) + distanceKm * (p.perKm || 0) + ((tip || 0) * tipShare) / 100);
}

function calculateCommission(rules, restaurant, subtotalAfterDiscount) {
  const percent = restaurant && restaurant.commissionPercent != null ? restaurant.commissionPercent : rules.commissionPercent || 0;
  return { percent, amount: round2((subtotalAfterDiscount * percent) / 100) };
}

module.exports = { calculateBill, calculateCouponDiscount, calculateDeliveryPayout, calculateCommission };
