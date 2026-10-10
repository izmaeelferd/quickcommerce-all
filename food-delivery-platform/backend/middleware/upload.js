const multer = require('multer');
const env = require('../config/env');
const { ApiError } = require('../utils/helpers');

// SVG is deliberately excluded: it can carry scripts and would be served from the API origin.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];
const EXT = /\.(jpe?g|png|webp|gif|ico)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.upload.maxMb * 1024 * 1024, files: 10, fields: 10 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype) && EXT.test(file.originalname || '')) return cb(null, true);
    return cb(new ApiError(400, 'upload.invalidType'));
  },
});

module.exports = upload;
