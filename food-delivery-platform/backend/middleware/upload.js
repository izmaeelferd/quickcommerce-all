const multer = require('multer');
const env = require('../config/env');
const { ApiError } = require('../utils/helpers');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.upload.maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    return cb(new ApiError(400, 'upload.invalidType'));
  },
});

module.exports = upload;
