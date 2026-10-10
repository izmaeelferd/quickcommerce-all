const Review = require('../models/Review');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const DeliveryPartner = require('../models/DeliveryPartner');
const { getConfig } = require('../utils/configCache');
const { asyncHandler, ok, ApiError, paginate, paged } = require('../utils/helpers');

const create = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  if (!cfg.features.reviews) throw new ApiError(403, 'feature.disabled');
  const { orderId, rating, comment, deliveryRating, images } = req.body;
  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'order.notFound');
  if (order.status !== 'delivered') throw new ApiError(400, 'review.orderNotDelivered');
  if (order.isRated) throw new ApiError(409, 'review.alreadyRated');
  const review = await Review.create({
    user: req.user._id,
    restaurant: order.restaurant,
    order: order._id,
    deliveryPartner: order.deliveryPartner,
    rating,
    comment,
    deliveryRating,
    images,
  });
  order.isRated = true;
  await order.save();
  await Review.recalculate(order.restaurant);
  if (deliveryRating && order.deliveryPartner) {
    const dp = await DeliveryPartner.findOne({ user: order.deliveryPartner });
    if (dp) {
      dp.rating = Math.round(((dp.rating * dp.ratingCount + Number(deliveryRating)) / (dp.ratingCount + 1)) * 10) / 10;
      dp.ratingCount += 1;
      await dp.save();
    }
  }
  return ok(res, review, 'review.created', 201);
});

const listByRestaurant = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { restaurant: req.params.restaurantId, isVisible: true };
  const [items, total] = await Promise.all([
    Review.find(q).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Review.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const myReviews = asyncHandler(async (req, res) => ok(res, await Review.find({ user: req.user._id }).populate('restaurant', 'name logo').sort({ createdAt: -1 })));

const vendorReviews = asyncHandler(async (req, res) => {
  const r = await Restaurant.findOne({ owner: req.user._id });
  if (!r) throw new ApiError(404, 'restaurant.notFound');
  const p = paginate(req.query);
  const [items, total] = await Promise.all([
    Review.find({ restaurant: r._id }).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Review.countDocuments({ restaurant: r._id }),
  ]);
  return ok(res, paged(items, total, p));
});

const reply = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'review.notFound');
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  if (!isAdmin && !(await Restaurant.exists({ _id: review.restaurant, owner: req.user._id }))) throw new ApiError(403, 'auth.forbidden');
  review.reply = { text: req.body.text, at: new Date() };
  await review.save();
  return ok(res, review, 'review.replied');
});

const setVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isVisible: !!req.body.isVisible }, { new: true });
  if (!review) throw new ApiError(404, 'review.notFound');
  await Review.recalculate(review.restaurant);
  return ok(res, review, 'review.updated');
});

module.exports = { create, listByRestaurant, myReviews, vendorReviews, reply, setVisibility };
