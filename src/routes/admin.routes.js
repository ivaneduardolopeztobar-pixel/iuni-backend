const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const c = require('../controllers/admin.controller');

router.use(auth, admin);

router.get('/stats', c.getStats);
router.get('/users', c.getUsers);
router.get('/jobs', c.getJobs);
router.patch('/jobs/:id/toggle', c.toggleJob);
router.delete('/users/:id', c.deleteUser);
router.get('/employers', c.getEmployers);
router.patch('/employers/:id/verify', c.toggleVerified);
router.get('/domains', c.getDomains);
router.post('/domains', c.addDomain);
router.patch('/domains/:id/toggle', c.toggleDomain);
router.get('/domain-requests', c.getDomainRequests);
router.post('/domain-requests/:id/approve', c.approveDomainRequest);

module.exports = router;
