const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/favorites.controller');
router.post('/:jobId/toggle', auth, c.toggle);
router.get('/my', auth, c.getMyFavorites);
module.exports = router;
