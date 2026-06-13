const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/jobalerts.controller');

router.get('/', auth, c.getAlert);
router.post('/', auth, c.saveAlert);

module.exports = router;
