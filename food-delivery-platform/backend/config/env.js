const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const list = (v, fallback = []) =>
  v ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback;
const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v));
const bool = (v, fallback = false) => (v === undefined || v === '' ? fallback : String(v) === 'true');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
  corsOrigins: list(process.env.CORS_ORIGINS, ['*']),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/food_delivery',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_access_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  otpExpiryMinutes: num(process.env.OTP_EXPIRY_MINUTES, 10),
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 10),
  google: { clientIds: list(process.env.GOOGLE_CLIENT_IDS) },
  apple: { clientId: process.env.APPLE_CLIENT_ID || '' },
  payments: {
    provider: (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase(),
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
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
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM_NUMBER || '',
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
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
  },
};

module.exports = env;
