const router = require('express').Router();
const c = require('../controllers/adminController');
const n = require('../controllers/notificationController');
const p = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission: perm } = require('../middleware/roles');

router.use(protect, authorize('admin'));

router.get('/stats', perm('dashboard'), c.stats);
router.get('/analytics/revenue', perm('dashboard'), c.revenue);

router.get('/users', perm('users'), c.listUsers);
router.post('/users', perm('users'), c.createAdmin);
router.get('/users/:id', perm('users'), c.getUser);
router.put('/users/:id', perm('users'), c.updateUser);
router.patch('/users/:id/ban', perm('users'), c.setBan);
router.post('/users/:id/wallet', perm('users'), c.adjustWallet);

router.get('/restaurants', perm('restaurants'), c.listRestaurants);
router.patch('/restaurants/:id/status', perm('vendors'), c.setRestaurantStatus);
router.patch('/restaurants/:id/commission', perm('settings'), c.setRestaurantCommission);
router.delete('/restaurants/:id', perm('restaurants'), c.deleteRestaurant);

router.get('/commission', perm('settings'), c.commissionOverview);
router.put('/commission', perm('settings'), c.setGlobalCommission);

router.get('/categories', perm('categories'), c.listCategories);
router.post('/categories', perm('categories'), c.createCategory);
router.put('/categories/reorder', perm('categories'), c.reorderCategories);
router.put('/categories/:id', perm('categories'), c.updateCategory);
router.delete('/categories/:id', perm('categories'), c.deleteCategory);

router.get('/orders', perm('orders'), c.listOrders);
router.patch('/orders/:id/assign', perm('orders'), c.assignDelivery);
router.patch('/orders/:id/status', perm('orders'), c.adminUpdateOrderStatus);
router.post('/orders/:orderId/refund', perm('transactions'), p.refund);

router.get('/transactions', perm('transactions'), c.listTransactions);
router.post('/payouts', perm('transactions'), c.recordPayout);

router.get('/delivery-partners', perm('delivery'), c.listPartners);
router.patch('/delivery-partners/:id/status', perm('delivery'), c.setPartnerStatus);

router.post('/notifications/send', perm('notifications'), n.send);
router.get('/notifications', perm('notifications'), n.history);

router.get('/reports', perm('reports'), c.reports);

router.get('/roles', perm('roles'), c.listRoles);
router.post('/roles', perm('roles'), c.createRole);
router.put('/roles/:id', perm('roles'), c.updateRole);
router.delete('/roles/:id', perm('roles'), c.deleteRole);

module.exports = router;
