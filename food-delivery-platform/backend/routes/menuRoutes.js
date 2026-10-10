const router = require('express').Router();
const c = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.get('/items/:id', c.getItem);

router.use(protect, authorize('vendor', 'admin'));
router.get('/categories', c.listCategories);
router.post('/categories', c.createCategory);
router.put('/categories/reorder', c.reorderCategories);
router.put('/categories/:id', c.updateCategory);
router.delete('/categories/:id', c.deleteCategory);

router.get('/items', c.listItems);
router.post('/items', validate(rules.menuItem), c.createItem);
router.put('/items/:id', c.updateItem);
router.delete('/items/:id', c.deleteItem);
router.patch('/items/:id/availability', c.toggleAvailability);
router.put('/items/:id/addons', c.updateAddOns);

module.exports = router;
