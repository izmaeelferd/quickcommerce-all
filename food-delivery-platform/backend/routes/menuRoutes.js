const router = require('express').Router();
const c = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.get('/items/:id', c.getItem);

router.use(protect, authorize('vendor', 'admin'));
router.get('/categories', c.listCategories);
router.post('/categories', validate(rules.menuCategory), c.createCategory);
router.put('/categories/reorder', validate(rules.reorder), c.reorderCategories);
router.put('/categories/:id', validate(rules.menuCategoryUpdate), c.updateCategory);
router.delete('/categories/:id', validate([rules.objectId()]), c.deleteCategory);

router.get('/items', c.listItems);
router.post('/items', validate(rules.menuItem), c.createItem);
router.put('/items/:id', validate(rules.menuItemUpdate), c.updateItem);
router.delete('/items/:id', validate([rules.objectId()]), c.deleteItem);
router.patch('/items/:id/availability', validate(rules.availability), c.toggleAvailability);
router.put('/items/:id/addons', validate(rules.addOns), c.updateAddOns);

module.exports = router;
