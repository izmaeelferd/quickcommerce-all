const router = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validation');

router.use(protect);
router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.delete('/profile', c.deleteAccount);
router.put('/change-password', c.changePassword);
router.post('/fcm-token', c.registerFcmToken);

router.get('/addresses', c.listAddresses);
router.post('/addresses', validate(rules.address), c.addAddress);
router.put('/addresses/:addressId', c.updateAddress);
router.delete('/addresses/:addressId', c.deleteAddress);

router.get('/favorites', c.listFavorites);
router.post('/favorites/:restaurantId', c.toggleFavorite);

router.get('/wallet', c.getWallet);
router.get('/referral', c.getReferral);

module.exports = router;
