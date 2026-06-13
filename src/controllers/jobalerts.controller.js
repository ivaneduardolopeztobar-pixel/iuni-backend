const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAlert = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'No encontrado' });
    const alert = await prisma.jobAlert.findFirst({ where: { studentId: student.id } });
    res.json(alert || null);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.saveAlert = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'No encontrado' });
    const { keywords, jobType, city, active } = req.body;
    const existing = await prisma.jobAlert.findFirst({ where: { studentId: student.id } });
    let alert;
    if (existing) {
      alert = await prisma.jobAlert.update({
        where: { id: existing.id },
        data: { keywords, jobType, city, active }
      });
    } else {
      alert = await prisma.jobAlert.create({
        data: { studentId: student.id, keywords, jobType, city, active }
      });
    }
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};
