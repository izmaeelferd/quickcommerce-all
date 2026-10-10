const crypto = require('crypto');
const env = require('./env');

let razorpayClient = null;
let stripeClient = null;

function getRazorpay() {
  if (!razorpayClient && env.payments.razorpay.keyId && env.payments.razorpay.keySecret) {
    const Razorpay = require('razorpay');
    razorpayClient = new Razorpay({
      key_id: env.payments.razorpay.keyId,
      key_secret: env.payments.razorpay.keySecret,
    });
  }
  return razorpayClient;
}

function getStripe() {
  if (!stripeClient && env.payments.stripe.secretKey) {
    const Stripe = require('stripe');
    stripeClient = new Stripe(env.payments.stripe.secretKey);
  }
  return stripeClient;
}

/**
 * Unified payment gateway. Provider is selected by PAYMENT_PROVIDER env var.
 * Amounts are passed in major units (e.g. 249.50) and converted to minor units here.
 */
const gateway = {
  provider: () => env.payments.provider,

  publicKey: () =>
    env.payments.provider === 'stripe'
      ? env.payments.stripe.publishableKey
      : env.payments.razorpay.keyId,

  isConfigured() {
    return env.payments.provider === 'stripe' ? !!getStripe() : !!getRazorpay();
  },

  async createIntent({ amount, currency, receipt, notes = {} }) {
    const minor = Math.round(Number(amount) * 100);
    if (env.payments.provider === 'stripe') {
      const stripe = getStripe();
      if (!stripe) throw new Error('Stripe is not configured');
      const intent = await stripe.paymentIntents.create({
        amount: minor,
        currency: currency.toLowerCase(),
        metadata: { receipt, ...notes },
        automatic_payment_methods: { enabled: true },
      });
      return { provider: 'stripe', id: intent.id, clientSecret: intent.client_secret, amount: minor, currency };
    }
    const rzp = getRazorpay();
    if (!rzp) throw new Error('Razorpay is not configured');
    const order = await rzp.orders.create({ amount: minor, currency: currency.toUpperCase(), receipt, notes });
    return { provider: 'razorpay', id: order.id, amount: minor, currency, keyId: env.payments.razorpay.keyId };
  },

  async verify({ intentId, paymentId, signature }) {
    if (env.payments.provider === 'stripe') {
      const stripe = getStripe();
      if (!stripe) throw new Error('Stripe is not configured');
      const intent = await stripe.paymentIntents.retrieve(intentId);
      return { verified: intent.status === 'succeeded', paymentId: intent.latest_charge || intent.id, raw: intent.status };
    }
    const expected = crypto
      .createHmac('sha256', env.payments.razorpay.keySecret)
      .update(`${intentId}|${paymentId}`)
      .digest('hex');
    const verified =
      typeof signature === 'string' &&
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    return { verified, paymentId };
  },

  async refund({ paymentId, amount }) {
    const minor = amount ? Math.round(Number(amount) * 100) : undefined;
    if (env.payments.provider === 'stripe') {
      const stripe = getStripe();
      if (!stripe) throw new Error('Stripe is not configured');
      const params = String(paymentId).startsWith('pi_') ? { payment_intent: paymentId } : { charge: paymentId };
      if (minor) params.amount = minor;
      const refund = await stripe.refunds.create(params);
      return { id: refund.id, status: refund.status };
    }
    const rzp = getRazorpay();
    if (!rzp) throw new Error('Razorpay is not configured');
    const refund = await rzp.payments.refund(paymentId, minor ? { amount: minor } : {});
    return { id: refund.id, status: refund.status };
  },
};

module.exports = gateway;
