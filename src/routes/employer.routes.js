const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/employer.controller');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/public/:employerId', getPublicProfile);

module.exports = router;
