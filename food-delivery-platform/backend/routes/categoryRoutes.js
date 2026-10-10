const router = require('express').Router();
const Category = require('../models/Category');
const { asyncHandler, ok } = require('../utils/helpers');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = { isActive: true };
    if (req.query.type) q.type = req.query.type;
    return ok(res, await Category.find(q).sort({ order: 1 }));
  })
);

module.exports = router;
