const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPush, sendTopic } = require('../utils/push');
const { sendEmail } = require('../utils/email');
const { sendSms } = require('../utils/sms');
const { events } = require('../sockets/orderTracking');
const { asyncHandler, ok, ApiError, paginate, paged } = require('../utils/helpers');

const audienceForRole = (role) => (['customer', 'vendor', 'delivery'].includes(role) ? role : 'customer');

const listMine = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { $or: [{ user: req.user._id }, { audience: { $in: ['all', audienceForRole(req.user.role)] }, user: null, createdAt: { $gte: req.user.createdAt } }] };
  const [items, total, unread] = await Promise.all([
    Notification.find(q).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Notification.countDocuments(q),
    Notification.countDocuments({ ...q, readBy: { $ne: req.user._id }, isRead: false }),
  ]);
  const uid = req.user._id.toString();
  const mapped = items.map((n) => ({ ...n, isRead: n.isRead || (n.readBy || []).some((r) => r.toString() === uid), readBy: undefined }));
  return ok(res, { ...paged(mapped, total, p), unread });
});

const markRead = asyncHandler(async (req, res) => {
  const ids = req.body.ids;
  const filter = ids && ids.length ? { _id: { $in: ids } } : {};
  await Notification.updateMany({ ...filter, user: req.user._id }, { isRead: true });
  await Notification.updateMany({ ...filter, user: null }, { $addToSet: { readBy: req.user._id } });
  return ok(res, null, 'notification.read');
});

/** Admin: POST /api/admin/notifications/send { audience, userIds?, title, body, imageUrl, channels, data } */
const send = asyncHandler(async (req, res) => {
  const { audience = 'all', userIds = [], title, body, imageUrl, channels = ['push', 'inapp'], data = {} } = req.body;
  if (!title) throw new ApiError(422, 'validation.titleRequired');
  let users;
  if (userIds.length) users = await User.find({ _id: { $in: userIds } }).select('+fcmTokens email phone');
  else if (audience === 'all') users = await User.find({ isBanned: false, role: { $in: ['customer', 'vendor', 'delivery'] } }).select('+fcmTokens email phone');
  else users = await User.find({ isBanned: false, role: audience }).select('+fcmTokens email phone');

  if (channels.includes('inapp')) {
    if (userIds.length) await Notification.insertMany(users.map((u) => ({ user: u._id, audience: 'user', title, body, imageUrl, data, channels, sentBy: req.user._id, type: 'promo' })));
    else await Notification.create({ user: null, audience, title, body, imageUrl, data, channels, sentBy: req.user._id, type: 'promo' });
    users.forEach((u) => events.toUser(u._id, 'notification:new', { title, body, imageUrl, data }));
  }
  const report = { recipients: users.length };
  if (channels.includes('push')) {
    if (!userIds.length) report.topic = await sendTopic({ topic: audience, title, body, data }).catch((e) => ({ error: e.message }));
    const tokens = users.flatMap((u) => u.fcmTokens || []);
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
    report.push = await Promise.all(chunks.map((c) => sendPush({ tokens: c, title, body, data, imageUrl }).catch((e) => ({ error: e.message }))));
  }
  if (channels.includes('email')) report.email = (await Promise.allSettled(users.filter((u) => u.email).map((u) => sendEmail({ to: u.email, subject: title, text: body })))).length;
  if (channels.includes('sms')) report.sms = (await Promise.allSettled(users.filter((u) => u.phone).map((u) => sendSms({ to: u.phone, body: `${title}: ${body}` })))).length;
  return ok(res, report, 'notification.sent');
});

const history = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { sentBy: { $ne: null } };
  const [items, total] = await Promise.all([
    Notification.find(q).populate('sentBy', 'name').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Notification.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

module.exports = { listMine, markRead, send, history };
