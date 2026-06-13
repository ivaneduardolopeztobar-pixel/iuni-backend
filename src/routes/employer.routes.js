const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/employer.controller');
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
module.exports = router;
