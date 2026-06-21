const router = require('express').Router();
const { resetLimiter } = require('../middleware/security');
const { requestReset, resetPassword } = require('../controllers/reset.controller');

router.post('/request', resetLimiter, requestReset);
router.post('/confirm', resetLimiter, resetPassword);

module.exports = router;
