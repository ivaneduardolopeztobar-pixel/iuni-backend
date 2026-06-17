const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/employer.controller');
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
module.exports = router;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/public/:employerId', async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({
      where: { id: parseInt(req.params.employerId) },
      select: {
        id: true,
        companyName: true,
        sector: true,
        city: true,
        country: true,
        workerCount: true,
        companySchedule: true,
        photoPath: true,
        verified: true,
        createdAt: true,
        jobPosts: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            jobType: true,
            salary: true,
            createdAt: true,
            _count: { select: { applications: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { jobPosts: true }
        }
      }
    });
    if (!employer) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(employer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
});
