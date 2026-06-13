const router = require('express').Router();
const { authLimiter } = require('../middleware/security');
const { requestReset, resetPassword } = require('../controllers/reset.controller');

router.post('/request', authLimiter, requestReset);
router.post('/confirm', authLimiter, resetPassword);

module.exports = router;
