const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/profileviews.controller');

router.post('/student/:studentId', auth, c.registerView);
router.get('/my', auth, c.getMyViews);

module.exports = router;
