/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDatabase } = require('../config/database');
const defaults = require('../config/defaultConfig');
const models = require('../models');
const en = require('./translations/en');
const enAdmin = require('./translations/en-admin');
const others = require('./translations/others');
const sample = require('./sampleData');
const { gradientPng } = require('./placeholderImage');
const { uploadRoot } = require('../utils/storage');

const { AppConfig, Translation, User, AdminRole, Restaurant, Category, MenuCategory, MenuItem, Coupon, Banner, DeliveryPartner } = models;

const RESET = process.argv.includes('--reset');
const CONFIG_ONLY = process.argv.includes('--config-only');
const CENTER = [Number(process.env.SEED_LNG || 77.5946), Number(process.env.SEED_LAT || 12.9716)];
const SAMPLE_PASSWORD = process.env.SEED_SAMPLE_PASSWORD || 'Password@123';

const seedDir = path.join(uploadRoot, 'seed');
function image(name, colors, w = 800, h = 600) {
  if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });
  const file = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${w}x${h}.png`;
  const full = path.join(seedDir, file);
  if (!fs.existsSync(full)) fs.writeFileSync(full, gradientPng(w, h, colors[0], colors[1]));
  return `${env.publicBaseUrl}/uploads/seed/${file}`;
}

async function seedConfig() {
  const existing = await AppConfig.findOne({ key: 'main' });
  if (existing && !RESET) {
    console.log('• config exists — leaving admin edits untouched');
    return;
  }
  await AppConfig.deleteMany({});
  await AppConfig.create({ key: 'main', ...defaults });
  console.log('✓ default app config');
}

async function seedTranslations() {
  const english = { ...en, ...enAdmin };
  const languages = [{ code: 'en', name: 'English', nativeName: 'English', isRTL: false, strings: english }, ...Object.entries(others).map(([code, v]) => ({ code, ...v }))];
  for (const lang of languages) {
    const doc = await Translation.findOne({ code: lang.code });
    if (!doc) {
      await Translation.create({ code: lang.code, name: lang.name, nativeName: lang.nativeName, isRTL: lang.isRTL, strings: Translation.encodeStrings(lang.strings) });
      console.log(`✓ language ${lang.code} (${Object.keys(lang.strings).length} strings)`);
      continue;
    }
    // Only add keys that do not exist yet so admin edits are preserved.
    const current = doc.getStrings();
    const missing = Object.fromEntries(Object.entries(lang.strings).filter(([k]) => !(k in current)));
    if (RESET) doc.setStrings(lang.strings, { replace: true });
    else doc.setStrings(missing);
    await doc.save();
    console.log(`• language ${lang.code}: ${RESET ? 'reset' : `added ${Object.keys(missing).length} new keys`}`);
  }
}

async function seedAdmins() {
  let admin = await User.findOne({ email: env.seed.adminEmail.toLowerCase() });
  if (!admin) {
    admin = await User.create({ name: 'Super Admin', email: env.seed.adminEmail, password: env.seed.adminPassword, role: 'superadmin', isVerified: true });
    console.log(`✓ superadmin ${env.seed.adminEmail}`);
  }
  const roles = [
    { name: 'Operations', description: 'Orders, vendors, delivery and support', permissions: ['dashboard', 'orders', 'vendors', 'restaurants', 'delivery', 'users', 'notifications'] },
    { name: 'Finance', description: 'Payments, payouts and reports', permissions: ['dashboard', 'transactions', 'reports', 'coupons', 'settings'] },
    { name: 'Content', description: 'Branding, banners, languages and legal pages', permissions: ['config', 'banners', 'translations', 'legal', 'categories'] },
  ];
  for (const r of roles) await AdminRole.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true });
}

async function seedCatalog() {
  if (!RESET && (await Restaurant.estimatedDocumentCount()) > 0) {
    console.log('• sample catalog exists — skipping (use --reset to recreate)');
    return;
  }
  const catMap = {};
  for (const [i, c] of sample.categories.entries()) {
    const doc = await Category.findOneAndUpdate({ name: c.name, type: 'category' }, { $set: { image: image(`cat-${c.name}`, c.colors, 256, 256), order: i + 1, isActive: true } }, { upsert: true, new: true });
    catMap[c.name] = doc._id;
  }
  for (const [i, c] of sample.cuisines.entries()) {
    await Category.findOneAndUpdate({ name: c.name, type: 'cuisine' }, { $set: { image: image(`cuisine-${c.name}`, c.colors, 320, 320), order: i + 1, isActive: true } }, { upsert: true });
  }
  console.log('✓ categories & cuisines');

  for (const [i, b] of sample.banners.entries()) {
    const linkValue = b.linkType === 'category' ? String(catMap[b.linkValue] || '') : b.linkValue || '';
    await Banner.create({ title: b.title, subtitle: b.subtitle, imageUrl: image(`banner-${i}`, b.colors, 1200, 480), linkType: b.linkType, linkValue, order: i + 1, placement: 'home' });
  }
  console.log('✓ banners');

  for (const r of sample.restaurants) {
    let owner = await User.findOne({ email: r.owner.email });
    if (!owner) owner = await User.create({ ...r.owner, password: SAMPLE_PASSWORD, role: 'vendor', isVerified: true });
    const restaurant = await Restaurant.create({
      owner: owner._id,
      name: r.name,
      description: r.description,
      cuisines: r.cuisines,
      categories: r.categories.map((c) => catMap[c]).filter(Boolean),
      priceForTwo: r.priceForTwo,
      avgPrepTimeMinutes: r.avgPrepTimeMinutes,
      offerText: r.offerText,
      isFeatured: r.isFeatured,
      isPureVeg: !!r.isPureVeg,
      status: 'approved',
      phone: r.owner.phone,
      email: r.owner.email,
      logo: image(`logo-${r.name}`, r.colors, 256, 256),
      coverImage: image(`cover-${r.name}`, r.colors, 1200, 600),
      address: { fullAddress: `${r.name}, Sample Street`, city: 'Sample City' },
      location: { type: 'Point', coordinates: [CENTER[0] + r.offset[0], CENTER[1] + r.offset[1]] },
      timings: Array.from({ length: 7 }, (_, d) => ({ day: d, open: '00:00', close: '23:59', closed: false })),
      rating: 4 + Math.round(Math.random() * 8) / 10,
      ratingCount: 50 + Math.floor(Math.random() * 400),
    });
    let order = 1;
    for (const [catName, items] of Object.entries(r.menu)) {
      const cat = await MenuCategory.create({ restaurant: restaurant._id, name: catName, order: order++ });
      for (const [j, item] of items.entries()) {
        await MenuItem.create({
          ...item,
          addOns: (item.addOns || []).map((g) => ({ ...g, minSelect: g.required ? 1 : 0 })),
          restaurant: restaurant._id,
          category: cat._id,
          order: j + 1,
          image: image(`item-${r.name}-${item.name}`, [r.colors[1], r.colors[0]], 400, 400),
        });
      }
    }
    console.log(`✓ restaurant ${r.name}`);
  }

  for (const c of sample.coupons) await Coupon.updateOne({ code: c.code }, { $setOnInsert: { ...c, isActive: true, showInOffers: true } }, { upsert: true });
  console.log('✓ coupons');

  if (!(await User.exists({ email: 'customer@example.com' }))) {
    await User.create({
      name: 'Demo Customer',
      email: 'customer@example.com',
      phone: '+910000000201',
      password: SAMPLE_PASSWORD,
      role: 'customer',
      isVerified: true,
      walletBalance: 200,
      addresses: [{ label: 'Home', fullAddress: '221B Sample Road', city: 'Sample City', isDefault: true, location: { type: 'Point', coordinates: [CENTER[0] + 0.003, CENTER[1] + 0.002] } }],
    });
  }
  if (!(await User.exists({ email: 'rider@example.com' }))) {
    const rider = await User.create({ name: 'Demo Rider', email: 'rider@example.com', phone: '+910000000301', password: SAMPLE_PASSWORD, role: 'delivery', isVerified: true });
    await DeliveryPartner.create({ user: rider._id, status: 'approved', vehicleType: 'bike', vehicleNumber: 'KA01AB1234', licenseNumber: 'DL-0001', currentLocation: { type: 'Point', coordinates: CENTER } });
  }
  console.log(`✓ demo accounts (customer@example.com / rider@example.com / vendor1-4@example.com, password: ${SAMPLE_PASSWORD})`);
}

async function run() {
  await connectDatabase();
  if (RESET) {
    console.log('! --reset: dropping existing data');
    await Promise.all(Object.values(models).map((m) => m.deleteMany({})));
  }
  await seedConfig();
  await seedTranslations();
  await seedAdmins();
  if (!CONFIG_ONLY) await seedCatalog();
  console.log('Seeding complete.');
}

if (require.main === module) {
  run()
    .then(() => mongoose.disconnect())
    .catch(async (e) => {
      console.error(e);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = { run };
