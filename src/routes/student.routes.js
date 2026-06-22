const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/student.controller');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/public/:studentId', auth, getPublicProfile);

module.exports = router;
