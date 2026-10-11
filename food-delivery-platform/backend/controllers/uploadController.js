const { saveFile } = require('../utils/storage');
const { asyncHandler, ok, ApiError } = require('../utils/helpers');

const single = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'upload.noFile');
  const url = await saveFile(req.file, req.body.folder || req.query.folder || 'images');
  return ok(res, { url }, 'upload.success', 201);
});

const multiple = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new ApiError(400, 'upload.noFile');
  const folder = req.body.folder || req.query.folder || 'images';
  const urls = await Promise.all(req.files.map((f) => saveFile(f, folder)));
  return ok(res, { urls }, 'upload.success', 201);
});

module.exports = { single, multiple };
