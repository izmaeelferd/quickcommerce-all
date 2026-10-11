const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const DeliveryPartner = require('../models/DeliveryPartner');

let ioRef = null;

const rooms = {
  user: (id) => `user:${id}`,
  restaurant: (id) => `restaurant:${id}`,
  order: (id) => `order:${id}`,
  deliveryPool: 'delivery:online',
  admin: 'admin',
};

function emit(room, event, payload) {
  if (ioRef) ioRef.to(room).emit(event, payload);
}

const events = {
  orderNew(order) {
    emit(rooms.restaurant(order.restaurant._id || order.restaurant), 'order:new', order);
    emit(rooms.admin, 'order:new', order);
  },
  orderAccepted(order) {
    emit(rooms.order(order._id), 'order:accepted', order);
    emit(rooms.user(order.customer._id || order.customer), 'order:accepted', order);
  },
  orderStatus(order) {
    const payload = { orderId: order._id, status: order.status, statusHistory: order.statusHistory, order };
    emit(rooms.order(order._id), 'order:status-update', payload);
    emit(rooms.user(order.customer._id || order.customer), 'order:status-update', payload);
    emit(rooms.restaurant(order.restaurant._id || order.restaurant), 'order:status-update', payload);
    if (order.deliveryPartner) emit(rooms.user(order.deliveryPartner._id || order.deliveryPartner), 'order:status-update', payload);
    emit(rooms.admin, 'order:status-update', payload);
  },
  deliveryAvailable(order) {
    emit(rooms.deliveryPool, 'delivery:available', order);
  },
  deliveryAssigned(order) {
    const payload = { orderId: order._id, deliveryPartner: order.deliveryPartner, order };
    emit(rooms.order(order._id), 'delivery:assigned', payload);
    emit(rooms.user(order.customer._id || order.customer), 'delivery:assigned', payload);
    emit(rooms.restaurant(order.restaurant._id || order.restaurant), 'delivery:assigned', payload);
    if (order.deliveryPartner) emit(rooms.user(order.deliveryPartner._id || order.deliveryPartner), 'delivery:assigned', payload);
    emit(rooms.deliveryPool, 'delivery:taken', { orderId: order._id });
  },
  deliveryLocation(orderId, customerId, location) {
    const payload = { orderId, ...location };
    emit(rooms.order(orderId), 'delivery:location', payload);
    if (customerId) emit(rooms.user(customerId), 'delivery:location', payload);
  },
  toUser(userId, event, payload) {
    emit(rooms.user(userId), event, payload);
  },
};

function init(io) {
  ioRef = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token
        ? socket.handshake.auth.token
        : (socket.handshake.headers.authorization || '').replace('Bearer ', '');
      if (!token) {
        socket.user = null; // anonymous: config updates only
        return next();
      }
      const payload = jwt.verify(token, env.jwt.secret);
      const user = await User.findById(payload.id).select('name role isBanned');
      if (!user || user.isBanned) return next(new Error('unauthorized'));
      socket.user = user;
      return next();
    } catch (e) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const u = socket.user;
    if (!u) return;
    socket.join(rooms.user(u._id));
    if (u.role === 'admin' || u.role === 'superadmin') socket.join(rooms.admin);
    if (u.role === 'vendor') {
      const r = await Restaurant.findOne({ owner: u._id }).select('_id');
      if (r) socket.join(rooms.restaurant(r._id));
    }
    if (u.role === 'delivery') {
      const dp = await DeliveryPartner.findOne({ user: u._id }).select('isOnline status');
      if (dp && dp.isOnline && dp.status === 'approved') socket.join(rooms.deliveryPool);
    }

    socket.on('order:join', async ({ orderId } = {}, ack) => {
      try {
        const order = await Order.findById(orderId).select('customer restaurant deliveryPartner');
        if (!order) throw new Error('not found');
        const isAdmin = u.role === 'admin' || u.role === 'superadmin';
        const r = u.role === 'vendor' ? await Restaurant.findOne({ owner: u._id }).select('_id') : null;
        const allowed = isAdmin || order.customer.equals(u._id) || (order.deliveryPartner && order.deliveryPartner.equals(u._id)) || (r && order.restaurant.equals(r._id));
        if (!allowed) throw new Error('forbidden');
        socket.join(rooms.order(orderId));
        if (ack) ack({ ok: true });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
    });

    socket.on('order:leave', ({ orderId } = {}) => socket.leave(rooms.order(orderId)));

    socket.on('delivery:online', async ({ online } = {}) => {
      if (u.role !== 'delivery') return;
      if (online) socket.join(rooms.deliveryPool);
      else socket.leave(rooms.deliveryPool);
    });

    socket.on('delivery:location', async ({ lat, lng, heading, speed } = {}) => {
      if (u.role !== 'delivery' || lat == null || lng == null) return;
      const dp = await DeliveryPartner.findOneAndUpdate(
        { user: u._id },
        { currentLocation: { type: 'Point', coordinates: [Number(lng), Number(lat)] }, lastLocationAt: new Date() },
        { new: true }
      );
      if (dp && dp.activeOrder) {
        const order = await Order.findById(dp.activeOrder).select('customer');
        if (order) events.deliveryLocation(dp.activeOrder, order.customer, { lat, lng, heading, speed, at: Date.now() });
      }
    });
  });
}

module.exports = { init, events, rooms };
