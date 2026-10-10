const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { Server } = require('socket.io');

const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { maintenanceGuard } = require('./middleware/maintenance');
const { sanitize } = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const orderTracking = require('./sockets/orderTracking');
const configController = require('./controllers/configController');
const { uploadRoot } = require('./utils/storage');
const { startScheduler } = require('./utils/scheduler');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: (origin, cb) => {
    // Unknown origins get no CORS headers (the browser blocks them); not an error.
    return cb(null, !origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin));
  },
  credentials: true,
};

const io = new Server(server, { cors: { origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins, credentials: true } });
orderTracking.init(io);
configController.attachIo(io);
app.set('io', io);

app.set('trust proxy', 1);
// Flat query strings only: `?a[$ne]=x` is never parsed into an object.
app.set('query parser', 'simple');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(compression());
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      if (req.originalUrl.includes('/payments/webhook')) req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(sanitize);
if (!env.isProd) app.use(morgan('dev'));

app.use('/uploads', express.static(uploadRoot, { maxAge: '7d' }));
app.use(env.apiPrefix, apiLimiter, maintenanceGuard, routes);
app.get('/', (req, res) => res.json({ success: true, service: 'food-delivery-api', docs: `${env.apiPrefix}/health` }));

app.use(notFound);
app.use(errorHandler);

async function start() {
  const problems = env.productionProblems();
  if (problems.length) {
    problems.forEach((p) => console.error(`[config] ${p}`));
    throw new Error('Unsafe production configuration — fix the variables above in backend/.env');
  }
  await connectDatabase();
  if (env.runScheduler) startScheduler();
  server.listen(env.port, () => console.log(`[server] listening on :${env.port} (${env.nodeEnv})`));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[server] failed to start', err);
    process.exit(1);
  });
}

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

module.exports = { app, server, io, start, path };
