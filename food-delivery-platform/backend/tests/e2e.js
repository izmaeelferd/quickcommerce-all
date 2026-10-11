/* eslint-disable no-console */
/**
 * End-to-end smoke test against a running API seeded with `npm run seed:reset`.
 *   ADMIN_DEFAULT_PASSWORD=... API_URL=http://localhost:5000/api node tests/e2e.js
 * Exercises: dynamic config, translations, admin config edits, customer ordering,
 * vendor status flow, rider dispatch with OTP + photo proof, settlement, reviews, reports.
 */
const assert = require('assert');
const { io } = require('socket.io-client');

const API = process.env.API_URL || 'http://localhost:5000/api';
const PASSWORD = process.env.SEED_SAMPLE_PASSWORD || 'Password@123';
const ADMIN = { id: process.env.ADMIN_DEFAULT_EMAIL || 'admin@yourapp.com', pw: process.env.ADMIN_DEFAULT_PASSWORD };
if (!ADMIN.pw) {
  console.error('Set ADMIN_DEFAULT_PASSWORD to the password the seeder used.');
  process.exit(2);
}

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n    ${e.stack || e.message}`);
    process.exitCode = 1;
    throw e;
  }
}

async function call(method, path, { token, body, raw } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status} ${json.message} ${JSON.stringify(json.details || '')}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json.data;
}

const login = async (identifier, password, role) => (await call('POST', '/auth/login', { body: { identifier, password, role } })).accessToken;

(async () => {
  console.log(`E2E against ${API}`);
  let cfg;
  let admin;
  let customer;
  let vendor;
  let rider;
  let restaurant;
  let order;
  let otp;

  await step('public config exposes every section', async () => {
    cfg = await call('GET', '/config');
    ['theme', 'branding', 'homeLayout', 'features', 'businessRules', 'legal', 'languages', 'maintenance', 'banners', 'categories', 'cuisines'].forEach((k) => assert.ok(cfg[k] !== undefined, `missing ${k}`));
    assert.ok(cfg.homeLayout.length > 0);
    assert.ok(cfg.banners.length > 0);
  });

  await step('translations are served with dotted keys and fallback', async () => {
    const en = await call('GET', '/config/translations/en');
    assert.strictEqual(en.strings['nav.home'], 'Home');
    const ar = await call('GET', '/config/translations/ar');
    assert.strictEqual(ar.isRTL, true);
    assert.notStrictEqual(ar.strings['nav.home'], 'Home');
    assert.ok(ar.strings['vendor.nav.menu'], 'missing keys should fall back to default language');
  });

  await step('logins for all roles', async () => {
    admin = await login(ADMIN.id, ADMIN.pw, 'admin');
    customer = await login('customer@example.com', PASSWORD, 'customer');
    vendor = await login('vendor1@example.com', PASSWORD, 'vendor');
    rider = await login('rider@example.com', PASSWORD, 'delivery');
    await assert.rejects(() => login('customer@example.com', PASSWORD, 'vendor'), /auth.wrongApp/);
  });

  await step('admin edits theme, layout, features, business rules and they are live', async () => {
    const socket = io(API.replace(/\/api$/, ''), { transports: ['websocket'] });
    const got = new Promise((resolve) => socket.on('config:updated', resolve));
    await new Promise((r) => socket.on('connect', r));
    await call('PUT', '/admin/config/theme', { token: admin, body: { primaryColor: '#123456' } });
    await Promise.race([got, new Promise((_, rej) => setTimeout(() => rej(new Error('no config:updated socket event')), 4000))]);
    socket.disconnect();
    const layout = cfg.homeLayout.map((s) => (s.type === 'cuisines' ? { ...s, enabled: true, title: 'Cuisines E2E' } : s)).reverse();
    await call('PUT', '/admin/config/layout', { token: admin, body: layout });
    await call('PUT', '/admin/config/business', { token: admin, body: { packagingFee: 20, deliveryFee: { freeAbove: 100000 } } });
    await call('PUT', '/admin/config/features', { token: admin, body: { deliveryPhotoProof: true, deliveryOtp: true } });
    const fresh = await call('GET', '/config');
    assert.strictEqual(fresh.theme.primaryColor, '#123456');
    assert.strictEqual(fresh.theme.cardRadius, cfg.theme.cardRadius, 'partial update must not wipe other keys');
    assert.strictEqual(fresh.homeLayout.find((s) => s.type === 'cuisines').title, 'Cuisines E2E');
    assert.strictEqual(fresh.businessRules.packagingFee, 20);
    assert.strictEqual(fresh.businessRules.deliveryFee.base, cfg.businessRules.deliveryFee.base);
    cfg = fresh;
  });

  await step('admin edits a translation key (dotted) and adds a language', async () => {
    await call('PUT', '/admin/config/translations/en', { token: admin, body: { strings: { 'cart.view': 'Open cart' } } });
    const en = await call('GET', '/config/translations/en');
    assert.strictEqual(en.strings['cart.view'], 'Open cart');
    await call('POST', '/admin/config/translations', { token: admin, body: { code: 'de', name: 'German', nativeName: 'Deutsch', copyFrom: 'en' } });
    const list = await call('GET', '/admin/config/translations', { token: admin });
    assert.ok(list.find((l) => l.code === 'de').strings['nav.home']);
    await call('DELETE', '/admin/config/translations/de', { token: admin });
  });

  await step('customer browses restaurants near the seeded location and opens a menu', async () => {
    const me = await call('GET', '/auth/me', { token: customer });
    const addr = me.user.addresses[0];
    const [lng, lat] = addr.location.coordinates;
    const list = await call('GET', `/restaurants?lat=${lat}&lng=${lng}`);
    assert.ok(list.items.length >= 3);
    restaurant = list.items.find((r) => r.name.includes('Bella'));
    assert.ok(restaurant.distanceKm !== undefined);
    const menu = await call('GET', `/restaurants/${restaurant._id}/menu`);
    restaurant.menu = menu;
    assert.ok(menu.categories.length > 0);
  });

  let body;
  await step('quote is computed from business rules incl. coupon + tip', async () => {
    const me = await call('GET', '/auth/me', { token: customer });
    const pizza = restaurant.menu.categories.flatMap((c) => c.items).find((i) => i.name === 'Margherita');
    const size = pizza.addOns.find((g) => g.name === 'Size');
    const large = size.options.find((o) => o.name === 'Large');
    body = { restaurantId: restaurant._id, items: [{ menuItemId: pizza._id, quantity: 2, addOns: [{ groupId: size._id, optionIds: [large._id] }] }], addressId: me.user.addresses[0]._id, tip: 20, couponCode: 'WELCOME50' };
    const q = await call('POST', '/orders/quote', { token: customer, body });
    assert.strictEqual(q.bill.subtotal, (299 + 220) * 2);
    assert.strictEqual(q.bill.packagingFee, 20);
    assert.strictEqual(q.bill.discount, 150, 'WELCOME50 is capped at maxDiscount 150');
    assert.strictEqual(q.bill.tip, 20);
    const expectedTax = Math.round(((q.bill.subtotal - 150) * cfg.businessRules.taxPercent)) / 100;
    assert.strictEqual(q.bill.tax, expectedTax);
    await assert.rejects(() => call('POST', '/orders/quote', { token: customer, body: { ...body, items: [{ menuItemId: pizza._id, quantity: 1 }] } }), /order.addOnRequired/);
  });

  await step('customer places a COD order; vendor receives order:new over socket', async () => {
    const vs = io(API.replace(/\/api$/, ''), { transports: ['websocket'], auth: { token: vendor } });
    await new Promise((r) => vs.on('connect', r));
    await new Promise((r) => setTimeout(r, 300));
    const got = new Promise((resolve) => vs.on('order:new', resolve));
    const res = await call('POST', '/orders', { token: customer, body: { ...body, paymentMethod: 'cod' } });
    order = res.order;
    otp = order.deliveryOtp;
    assert.strictEqual(order.status, 'placed');
    assert.ok(otp && otp.length === 4);
    const evt = await Promise.race([got, new Promise((_, rej) => setTimeout(() => rej(new Error('vendor did not get order:new')), 4000))]);
    assert.strictEqual(evt._id, order._id);
    vs.disconnect();
  });

  await step('coupon cannot be reused (firstOrderOnly / perUserLimit)', async () => {
    await assert.rejects(() => call('POST', '/coupons/validate', { token: customer, body: { code: 'WELCOME50', restaurantId: restaurant._id, subtotal: 1000 } }), /coupon\./);
  });

  await step('vendor moves order accepted → preparing → ready; invalid transitions rejected', async () => {
    await assert.rejects(() => call('PATCH', `/orders/vendor/${order._id}/status`, { token: vendor, body: { status: 'delivered' } }), /validation.failed/);
    await assert.rejects(() => call('PATCH', `/orders/vendor/${order._id}/status`, { token: vendor, body: { status: 'ready' } }), /order.invalidTransition/);
    for (const s of ['accepted', 'preparing', 'ready']) await call('PATCH', `/orders/vendor/${order._id}/status`, { token: vendor, body: { status: s } });
    const o = await call('GET', `/orders/${order._id}`, { token: customer });
    assert.strictEqual(o.status, 'ready');
    assert.ok(o.estimatedDeliveryAt);
  });

  await step('rider goes online, sees the request with config-driven payout and accepts it', async () => {
    await call('PATCH', '/delivery/online', { token: rider, body: { isOnline: true } });
    const avail = await call('GET', '/delivery/available-orders', { token: rider });
    const req = avail.items.find((x) => x._id === order._id);
    assert.ok(req, 'order should be available');
    const p = cfg.businessRules.deliveryPartnerPayout;
    const expected = Math.round((p.base + req.distanceKm * p.perKm + (20 * p.tipSharePercent) / 100) * 100) / 100;
    assert.strictEqual(req.payout, expected);
    await call('POST', `/delivery/orders/${order._id}/accept`, { token: rider });
    await call('POST', '/delivery/location', { token: rider, body: { lat: 12.97, lng: 77.59 } });
  });

  await step('delivery requires OTP and photo proof, then settles money', async () => {
    await call('PATCH', `/delivery/orders/${order._id}/status`, { token: rider, body: { status: 'picked' } });
    await assert.rejects(() => call('PATCH', `/delivery/orders/${order._id}/status`, { token: rider, body: { status: 'delivered', otp: '0000', photoUrl: 'x' } }), /delivery.invalidOtp/);
    await assert.rejects(() => call('PATCH', `/delivery/orders/${order._id}/status`, { token: rider, body: { status: 'delivered', otp } }), /delivery.photoRequired/);
    const fd = new FormData();
    fd.append('folder', 'delivery-proof');
    fd.append('image', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'proof.png');
    const up = await (await fetch(`${API}/upload/image`, { method: 'POST', headers: { Authorization: `Bearer ${rider}` }, body: fd })).json();
    assert.ok(up.data.url);
    const done = await call('PATCH', `/delivery/orders/${order._id}/status`, { token: rider, body: { status: 'delivered', otp, photoUrl: up.data.url } });
    assert.strictEqual(done.status, 'delivered');
    assert.strictEqual(done.payment.status, 'paid');
    const earnings = await call('GET', '/delivery/earnings', { token: rider });
    assert.ok(earnings.totalEarnings >= done.deliveryEarning);
    const stats = await call('GET', '/orders/vendor/stats', { token: vendor });
    assert.ok(stats.totals.earnings > 0);
  });

  await step('customer reviews the order; rating recalculated', async () => {
    await call('POST', '/reviews', { token: customer, body: { orderId: order._id, rating: 5, deliveryRating: 4, comment: 'Great' } });
    await assert.rejects(() => call('POST', '/reviews', { token: customer, body: { orderId: order._id, rating: 5 } }), /review.alreadyRated/);
    const reviews = await call('GET', `/reviews/restaurant/${restaurant._id}`);
    assert.ok(reviews.items.length >= 1);
  });

  await step('customer cancels a new order inside the window and gets wallet refund', async () => {
    const me = await call('GET', '/auth/me', { token: customer });
    const before = me.user.walletBalance;
    const burgerList = await call('GET', '/restaurants?q=Stack');
    const r = burgerList.items[0];
    const m = await call('GET', `/restaurants/${r._id}/menu`);
    const item = m.categories.flatMap((c) => c.items).find((i) => i.name === 'Crispy Veg Burger');
    const res = await call('POST', '/orders', { token: customer, body: { restaurantId: r._id, items: [{ menuItemId: item._id, quantity: 1 }], addressId: me.user.addresses[0]._id, useWallet: true, paymentMethod: 'cod' } });
    assert.ok(res.order.pricing.walletUsed > 0);
    const after = (await call('GET', '/auth/me', { token: customer })).user.walletBalance;
    assert.ok(after < before);
    const cancelled = await call('POST', `/orders/${res.order._id}/cancel`, { token: customer, body: { reason: 'changed mind' } });
    assert.strictEqual(cancelled.status, 'cancelled');
    const final = (await call('GET', '/auth/me', { token: customer })).user.walletBalance;
    assert.strictEqual(Math.round(final * 100), Math.round(before * 100));
  });

  await step('maintenance mode blocks customer API but not config/admin', async () => {
    await call('PUT', '/admin/config/maintenance', { token: admin, body: { appInMaintenance: true, maintenanceMessage: 'Back soon', affectedApps: ['customer'] } });
    await new Promise((r) => setTimeout(r, 50));
    const res = await fetch(`${API}/restaurants`, { headers: { 'X-App-Type': 'customer' } });
    assert.strictEqual(res.status, 503);
    const ok = await fetch(`${API}/restaurants`, { headers: { 'X-App-Type': 'delivery' } });
    assert.strictEqual(ok.status, 200);
    const c = await call('GET', '/config');
    assert.strictEqual(c.maintenance.maintenanceMessage, 'Back soon');
    await call('PUT', '/admin/config/maintenance', { token: admin, body: { appInMaintenance: false } });
  });

  await step('admin dashboard, revenue, reports CSV, RBAC', async () => {
    const stats = await call('GET', '/admin/stats', { token: admin });
    assert.ok(stats.counts.orders >= 2);
    const rev = await call('GET', '/admin/analytics/revenue?days=7', { token: admin });
    assert.ok(Array.isArray(rev.series));
    const csv = await call('GET', '/admin/reports?type=orders&format=csv', { token: admin, raw: true });
    assert.ok((await csv.text()).startsWith('orderNumber,date,restaurant'));
    const roles = await call('GET', '/admin/roles', { token: admin });
    const finance = roles.roles.find((r) => r.name === 'Finance');
    const u = await call('POST', '/admin/users', { token: admin, body: { name: 'Fin', email: `fin${Date.now()}@example.com`, password: 'Secret@1', role: 'admin', adminRole: finance._id } });
    const fin = await login(u.email, 'Secret@1', 'admin');
    await call('GET', '/admin/transactions', { token: fin });
    await assert.rejects(() => call('PUT', '/admin/config/theme', { token: fin, body: { primaryColor: '#000000' } }), /auth.permissionDenied/);
  });

  await step('banners CRUD with schedule and reorder', async () => {
    const b = await call('POST', '/admin/config/banners', { token: admin, body: { imageUrl: 'https://example.com/x.png', title: 'Future', startDate: new Date(Date.now() + 86400000) } });
    let pub = await call('GET', '/config');
    assert.ok(!pub.banners.find((x) => x._id === b._id), 'scheduled banner must not be public yet');
    await call('PUT', `/admin/config/banners/${b._id}`, { token: admin, body: { startDate: null } });
    pub = await call('GET', '/config');
    assert.ok(pub.banners.find((x) => x._id === b._id));
    await call('DELETE', `/admin/config/banners/${b._id}`, { token: admin });
  });

  await step('security: operator injection, validation, OTP limits, CORS-safe headers', async () => {
    // NoSQL operator payloads are stripped before reaching Mongo.
    await assert.rejects(() => call('POST', '/auth/login', { body: { identifier: { $ne: null }, password: { $ne: null } } }), /validation.failed|auth.invalidCredentials/);
    await assert.rejects(() => call('POST', '/auth/verify-otp', { body: { phone: { $gt: '' }, otp: '123456' } }), /validation.failed|auth.invalidOtp/);
    const nested = await call('GET', '/restaurants?status[$ne]=approved', { raw: true });
    assert.strictEqual(nested.status, 200);
    // Validation returns 422 with field details.
    const bad = await call('POST', '/orders/quote', { token: customer, body: { restaurantId: 'nope', items: [] }, raw: true });
    assert.strictEqual(bad.status, 422);
    // OTP: resend cooldown and attempt limit burn the code.
    const phone = `+9199${Date.now().toString().slice(-8)}`;
    await call('POST', '/auth/send-otp', { body: { phone } });
    await assert.rejects(() => call('POST', '/auth/send-otp', { body: { phone } }), /auth.otpTooSoon/);
    for (let i = 0; i < 4; i += 1) await assert.rejects(() => call('POST', '/auth/verify-otp', { body: { phone, otp: '000000' } }), /auth.invalidOtp/);
    await assert.rejects(() => call('POST', '/auth/verify-otp', { body: { phone, otp: '000000' } }), /auth.otpAttemptsExceeded/);
    // SVG uploads are refused.
    const fd = new FormData();
    fd.append('image', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'x.svg');
    const up = await fetch(`${API}/upload/image`, { method: 'POST', headers: { Authorization: `Bearer ${customer}` }, body: fd });
    assert.strictEqual(up.status, 400);
    // Helmet headers present.
    const h = await call('GET', '/health', { raw: true });
    assert.ok(h.headers.get('x-content-type-options'));
  });

  await step('wallet debit is atomic under concurrent orders', async () => {
    const me = (await call('GET', '/auth/me', { token: customer })).user;
    await call('POST', `/admin/users/${me._id}/wallet`, { token: admin, body: { amount: 1000 - me.walletBalance, reason: 'test' } });
    const list = await call('GET', '/restaurants?q=Green');
    const r = list.items[0];
    const m = await call('GET', `/restaurants/${r._id}/menu`);
    const item = m.categories.flatMap((c) => c.items).find((i) => i.name === 'Quinoa Buddha Bowl');
    const body2 = { restaurantId: r._id, items: [{ menuItemId: item._id, quantity: 2 }], addressId: me.addresses[0]._id, paymentMethod: 'wallet' };
    const q = await call('POST', '/orders/quote', { token: customer, body: body2 });
    const n = Math.floor(1000 / q.bill.total) + 2; // more orders than the balance can cover
    const results = await Promise.allSettled(Array.from({ length: n }, () => call('POST', '/orders', { token: customer, body: body2 })));
    const okCount = results.filter((x) => x.status === 'fulfilled').length;
    assert.strictEqual(okCount, Math.floor(1000 / q.bill.total), `expected exactly ${Math.floor(1000 / q.bill.total)} orders, got ${okCount}`);
    const after = (await call('GET', '/auth/me', { token: customer })).user.walletBalance;
    assert.ok(after >= 0, 'wallet must never go negative');
  });

  await step('admin cannot demote itself; password change works', async () => {
    const me = (await call('GET', '/auth/me', { token: admin })).user;
    const updated = await call('PUT', `/admin/users/${me._id}`, { token: admin, body: { name: me.name, role: 'customer' } });
    assert.strictEqual(updated.role, 'superadmin');
    await call('PUT', '/users/change-password', { token: admin, body: { currentPassword: ADMIN.pw, newPassword: 'Temp#Pass2026' } });
    const t2 = await login(ADMIN.id, 'Temp#Pass2026', 'admin');
    await call('PUT', '/users/change-password', { token: t2, body: { currentPassword: 'Temp#Pass2026', newPassword: ADMIN.pw } });
  });

  console.log(`\n${passed} steps passed`);
})().catch(() => {
  console.error('\nE2E failed');
  process.exit(1);
});
