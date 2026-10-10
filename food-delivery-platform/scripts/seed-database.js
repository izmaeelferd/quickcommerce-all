#!/usr/bin/env node
/**
 * Seeds default configuration, translations and demo data.
 *   node scripts/seed-database.js            # add missing data, keep admin edits
 *   node scripts/seed-database.js --reset    # wipe and recreate everything
 *   node scripts/seed-database.js --config-only
 */
const path = require('path');

process.chdir(path.join(__dirname, '..', 'backend'));
// eslint-disable-next-line import/no-dynamic-require
const { run } = require(path.join(process.cwd(), 'seeders', 'seedDatabase.js'));
const mongoose = require(path.join(process.cwd(), 'node_modules', 'mongoose'));

run()
  .then(() => mongoose.disconnect())
  .catch(async (e) => {
    console.error(e);
    await mongoose.disconnect();
    process.exit(1);
  });
