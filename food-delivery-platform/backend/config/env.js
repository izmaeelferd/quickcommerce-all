const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const list = (v, fallback = []) =>
  v ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback;
const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v));
const bool = (v, fallback = false) => (v === undefined || v === '' ? fallback : String(v) === 'true');

/** First non-empty env var among `names` (canonical name first, legacy aliases after). */
const pickEnv = (...names) => names.map((n) => process.env[n]).find((v) => v !== undefined && v !== '');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
  corsOrigins: list(pickEnv('CLIENT_URLS', 'CORS_ORIGINS'), ['*']),
  mongoUri: pickEnv('MONGODB_URI', 'MONGO_URI') || 'mongodb://localhost:27017/food_delivery',
  jwt: {
    secret: pickEnv('JWT_ACCESS_SECRET', 'JWT_SECRET') || 'dev_access_secret',
    expiresIn: pickEnv('JWT_ACCESS_EXPIRES_IN', 'JWT_EXPIRES_IN') || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  otpExpiryMinutes: num(process.env.OTP_EXPIRY_MINUTES, 10),
  otpMaxAttempts: num(process.env.OTP_MAX_ATTEMPTS, 5),
  // Background jobs (accept/payment timeouts). Set RUN_SCHEDULER=false on every API instance but one.
  runScheduler: process.env.RUN_SCHEDULER !== 'false',
  otpResendSeconds: num(process.env.OTP_RESEND_SECONDS, 30),
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 10),
  google: { clientIds: list(process.env.GOOGLE_CLIENT_IDS) },
  apple: { clientId: process.env.APPLE_CLIENT_ID || '' },
  payments: {
    provider: (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase(),
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },
  twilio: {
    accountSid: pickEnv('TWILIO_SID', 'TWILIO_ACCOUNT_SID') || '',
    authToken: pickEnv('TWILIO_TOKEN', 'TWILIO_AUTH_TOKEN') || '',
    from: pickEnv('TWILIO_PHONE', 'TWILIO_FROM_NUMBER') || '',
  },
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '',
  },
  upload: {
    driver: (process.env.UPLOAD_DRIVER || 'local').toLowerCase(),
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxMb: num(process.env.MAX_UPLOAD_MB, 5),
    s3: {
      region: process.env.AWS_REGION || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucket: process.env.AWS_S3_BUCKET || '',
      publicUrl: process.env.AWS_S3_PUBLIC_URL || '',
    },
  },
  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: num(process.env.RATE_LIMIT_MAX, 500),
    authMax: num(process.env.AUTH_RATE_LIMIT_MAX, 30),
  },
  seed: {
    adminEmail: pickEnv('ADMIN_DEFAULT_EMAIL', 'SEED_ADMIN_EMAIL') || 'admin@yourapp.com',
    adminPassword: pickEnv('ADMIN_DEFAULT_PASSWORD', 'SEED_ADMIN_PASSWORD') || '',
  },
};

/**
 * Fail fast on unsafe production settings instead of booting with dev defaults.
 * Returns the list of problems (empty when OK).
 */
env.productionProblems = () => {
  if (!env.isProd) return [];
  const problems = [];
  if (!pickEnv('MONGODB_URI', 'MONGO_URI')) problems.push('MONGODB_URI is required');
  const weak = (v) => !v || v.length < 32 || /^dev_|change_me/.test(v);
  if (weak(env.jwt.secret)) problems.push('JWT_ACCESS_SECRET must be a random string of 32+ characters');
  if (weak(env.jwt.refreshSecret)) problems.push('JWT_REFRESH_SECRET must be a random string of 32+ characters');
  if (env.jwt.secret === env.jwt.refreshSecret) problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  if (env.corsOrigins.includes('*')) problems.push('CLIENT_URLS must list the admin/vendor web origins (no "*") in production');
  if (!process.env.PUBLIC_BASE_URL) problems.push('PUBLIC_BASE_URL is required (used for uploaded file URLs)');
  return problems;
};

module.exports = env;
