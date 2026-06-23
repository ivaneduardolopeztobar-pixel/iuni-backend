const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.toggle = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(403).json({ error: 'Solo estudiantes' });
    const existing = await prisma.favorite.findUnique({ where: { studentId_jobPostId: { studentId: student.id, jobPostId: parseInt(req.params.jobId) } } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }
    await prisma.favorite.create({ data: { studentId: student.id, jobPostId: parseInt(req.params.jobId) } });
    res.json({ favorited: true });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(403).json({ error: 'Solo estudiantes' });
    const favs = await prisma.favorite.findMany({ where: { studentId: student.id }, include: { jobPost: { include: { employer: { select: { companyName: true, city: true } } } } } });
    res.json(favs);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};
