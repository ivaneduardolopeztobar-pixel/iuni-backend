const router = require('express').Router();
const auth = require('../middleware/auth');
const { getEmployerMetrics } = require('../controllers/metrics.controller');

router.get('/employer', auth, getEmployerMetrics);

module.exports = router;
