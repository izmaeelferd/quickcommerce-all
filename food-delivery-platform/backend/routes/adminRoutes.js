const router = require('express').Router();
const c = require('../controllers/adminController');
const n = require('../controllers/notificationController');
const p = require('../controllers/paymentController');
const rv = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission: perm } = require('../middleware/roles');
const { validate, rules: r } = require('../middleware/validation');

router.use(protect, authorize('admin'));

router.get('/stats', perm('dashboard'), c.stats);
router.get('/analytics/revenue', perm('dashboard'), c.revenue);

router.get('/users', perm('users'), c.listUsers);
router.post('/users', perm('users'), validate(r.adminUser), c.createAdmin);
router.get('/users/:id', perm('users'), c.getUser);
router.put('/users/:id', perm('users'), validate(r.adminUserUpdate), c.updateUser);
router.patch('/users/:id/ban', perm('users'), validate(r.ban), c.setBan);
router.post('/users/:id/wallet', perm('users'), validate(r.walletAdjust), c.adjustWallet);

router.get('/restaurants', perm('restaurants'), c.listRestaurants);
router.patch('/restaurants/:id/status', perm('vendors'), validate(r.accountStatus), c.setRestaurantStatus);
router.patch('/restaurants/:id/commission', perm('settings'), validate(r.commission), c.setRestaurantCommission);
router.delete('/restaurants/:id', perm('restaurants'), validate([r.objectId()]), c.deleteRestaurant);

router.get('/commission', perm('settings'), c.commissionOverview);
router.put('/commission', perm('settings'), validate(r.globalCommission), c.setGlobalCommission);

router.get('/categories', perm('categories'), c.listCategories);
router.post('/categories', perm('categories'), validate(r.category), c.createCategory);
router.put('/categories/reorder', perm('categories'), validate(r.reorder), c.reorderCategories);
router.put('/categories/:id', perm('categories'), validate(r.categoryUpdate), c.updateCategory);
router.delete('/categories/:id', perm('categories'), validate([r.objectId()]), c.deleteCategory);

router.get('/orders', perm('orders'), c.listOrders);
router.patch('/orders/:id/assign', perm('orders'), validate(r.assign), c.assignDelivery);
router.patch('/orders/:id/status', perm('orders'), validate(r.adminOrderStatus), c.adminUpdateOrderStatus);
router.post('/orders/:orderId/refund', perm('transactions'), validate(r.refund), p.refund);

router.get('/transactions', perm('transactions'), c.listTransactions);
router.post('/payouts', perm('transactions'), validate(r.payout), c.recordPayout);

router.get('/delivery-partners', perm('delivery'), c.listPartners);
router.patch('/delivery-partners/:id/status', perm('delivery'), validate(r.accountStatus), c.setPartnerStatus);

router.post('/notifications/send', perm('notifications'), validate(r.notify), n.send);
router.get('/notifications', perm('notifications'), n.history);

router.get('/reports', perm('reports'), c.reports);

router.get('/reviews', perm('restaurants'), rv.adminList);

router.get('/roles', perm('roles'), c.listRoles);
router.post('/roles', perm('roles'), validate(r.role), c.createRole);
router.put('/roles/:id', perm('roles'), validate(r.roleUpdate), c.updateRole);
router.delete('/roles/:id', perm('roles'), validate([r.objectId()]), c.deleteRole);

module.exports = router;
