const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/student.controller');
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
module.exports = router;

router.get('/public/:studentId', auth, async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.studentId) },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        city: true, country: true, desiredPosition: true, career: true,
        profileDescription: true, languages: true, technicalSkills: true,
        softSkills: true, photoPath: true, cvPath: true,
        hasWorkExperience: true, workExperience: true,
        hasDriverLicense: true, willingToTravel: true,
        user: { select: { email: true } }
      }
    });
    if (!student) return res.status(404).json({ error: 'No encontrado' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});
