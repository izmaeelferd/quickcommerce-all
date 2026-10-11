const env = require('../config/env');

const notFound = (req, res) => res.status(404).json({ success: false, message: 'route.notFound', path: req.originalUrl });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'server.error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 422;
    message = 'validation.failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'validation.invalidId';
  } else if (err.code === 11000) {
    status = 409;
    message = 'resource.duplicate';
    details = err.keyValue;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'upload.tooLarge';
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ success: false, message, details, ...(env.isProd ? {} : { stack: status >= 500 ? err.stack : undefined }) });
};

module.exports = { notFound, errorHandler };
