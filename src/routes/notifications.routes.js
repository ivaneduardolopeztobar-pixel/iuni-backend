const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/notifications.controller');

router.get('/', auth, c.getMyNotifications);
router.put('/read-all', auth, c.markRead);
router.put('/:id/read', auth, c.markOneRead);

module.exports = router;
