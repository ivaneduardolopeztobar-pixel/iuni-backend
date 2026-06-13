const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/applications.controller');

router.post('/:jobId/apply', auth, c.apply);
router.get('/my', auth, c.getMyApplications);
router.get('/:jobId/list', auth, c.getJobApplications);
router.patch('/:appId/status', auth, c.updateStatus);

module.exports = router;
