const router = require('express').Router();
const auth = require('../middleware/auth');
const { uploadPhoto, uploadCV } = require('../utils/cloudinary');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Foto estudiante
router.post('/student/photo', auth, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subio ninguna imagen' });
    const url = req.file.path;
    await prisma.student.update({
      where: { userId: req.user.id },
      data: { photoPath: url }
    });
    res.json({ photoPath: url, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir foto' });
  }
});

// CV estudiante
router.post('/student/cv', auth, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subio ningun archivo' });
    const url = req.file.path;
    await prisma.student.update({
      where: { userId: req.user.id },
      data: { cvPath: url }
    });
    res.json({ cvPath: url, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir CV' });
  }
});

// Logo empleador
router.post('/employer/photo', auth, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subio ninguna imagen' });
    const url = req.file.path;
    await prisma.employer.update({
      where: { userId: req.user.id },
      data: { photoPath: url }
    });
    res.json({ photoPath: url, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir logo' });
  }
});

// Logo empleador (alias)
router.post('/employer/logo', auth, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subio ninguna imagen' });
    const url = req.file.path;
    await prisma.employer.update({
      where: { userId: req.user.id },
      data: { photoPath: url }
    });
    res.json({ photoPath: url, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir logo' });
  }
});

module.exports = router;
