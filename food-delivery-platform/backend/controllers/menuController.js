const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const { asyncHandler, ok, ApiError, pick } = require('../utils/helpers');

const ITEM_FIELDS = ['category', 'name', 'description', 'price', 'discountPrice', 'image', 'isVeg', 'isAvailable', 'isBestseller', 'spiceLevel', 'addOns', 'tags', 'order'];

async function resolveRestaurant(req) {
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  const restaurantId = req.query.restaurantId || req.body.restaurantId;
  const r = isAdmin && restaurantId ? await Restaurant.findById(restaurantId) : await Restaurant.findOne({ owner: req.user._id });
  if (!r) throw new ApiError(404, 'restaurant.notFound');
  return r;
}

/* -------- Categories -------- */
const listCategories = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const cats = await MenuCategory.find({ restaurant: r._id }).sort({ order: 1 }).lean();
  const counts = await MenuItem.aggregate([{ $match: { restaurant: r._id } }, { $group: { _id: '$category', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [c._id.toString(), c.n]));
  return ok(res, cats.map((c) => ({ ...c, itemCount: map[c._id.toString()] || 0 })));
});

const createCategory = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const count = await MenuCategory.countDocuments({ restaurant: r._id });
  const cat = await MenuCategory.create({ ...pick(req.body, ['name', 'description', 'isActive', 'order']), order: req.body.order ?? count + 1, restaurant: r._id });
  return ok(res, cat, 'menu.categoryCreated', 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const cat = await MenuCategory.findOneAndUpdate({ _id: req.params.id, restaurant: r._id }, pick(req.body, ['name', 'description', 'isActive', 'order']), { new: true });
  if (!cat) throw new ApiError(404, 'menu.categoryNotFound');
  return ok(res, cat, 'menu.categoryUpdated');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  if (await MenuItem.exists({ category: req.params.id })) throw new ApiError(400, 'menu.categoryNotEmpty');
  await MenuCategory.deleteOne({ _id: req.params.id, restaurant: r._id });
  return ok(res, null, 'menu.categoryDeleted');
});

const reorderCategories = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  await Promise.all((req.body.ids || []).map((id, i) => MenuCategory.updateOne({ _id: id, restaurant: r._id }, { order: i + 1 })));
  return ok(res, await MenuCategory.find({ restaurant: r._id }).sort({ order: 1 }), 'menu.reordered');
});

/* -------- Items -------- */
const listItems = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const q = { restaurant: r._id };
  if (req.query.category) q.category = req.query.category;
  return ok(res, await MenuItem.find(q).populate('category', 'name').sort({ order: 1, name: 1 }));
});

const getItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('category', 'name');
  if (!item) throw new ApiError(404, 'menu.itemNotFound');
  return ok(res, item);
});

const createItem = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  if (!(await MenuCategory.exists({ _id: req.body.category, restaurant: r._id }))) throw new ApiError(400, 'menu.categoryNotFound');
  const item = await MenuItem.create({ ...pick(req.body, ITEM_FIELDS), restaurant: r._id });
  return ok(res, item, 'menu.itemCreated', 201);
});

const updateItem = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const item = await MenuItem.findOne({ _id: req.params.id, restaurant: r._id });
  if (!item) throw new ApiError(404, 'menu.itemNotFound');
  Object.assign(item, pick(req.body, ITEM_FIELDS));
  await item.save();
  return ok(res, item, 'menu.itemUpdated');
});

const deleteItem = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  await MenuItem.deleteOne({ _id: req.params.id, restaurant: r._id });
  return ok(res, null, 'menu.itemDeleted');
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const item = await MenuItem.findOne({ _id: req.params.id, restaurant: r._id });
  if (!item) throw new ApiError(404, 'menu.itemNotFound');
  item.isAvailable = req.body.isAvailable !== undefined ? !!req.body.isAvailable : !item.isAvailable;
  await item.save();
  return ok(res, item, 'menu.availabilityUpdated');
});

const updateAddOns = asyncHandler(async (req, res) => {
  const r = await resolveRestaurant(req);
  const item = await MenuItem.findOne({ _id: req.params.id, restaurant: r._id });
  if (!item) throw new ApiError(404, 'menu.itemNotFound');
  item.addOns = Array.isArray(req.body.addOns) ? req.body.addOns : [];
  await item.save();
  return ok(res, item, 'menu.addOnsUpdated');
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  toggleAvailability,
  updateAddOns,
};
