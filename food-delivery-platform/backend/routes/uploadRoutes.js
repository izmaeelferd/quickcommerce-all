const router = require('express').Router();
const c = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/image', protect, upload.single('image'), c.single);
router.post('/images', protect, upload.array('images', 10), c.multiple);

module.exports = router;
