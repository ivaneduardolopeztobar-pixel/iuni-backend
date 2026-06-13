const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.registerView = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    if (!employer) return res.status(403).json({ error: 'Solo empleadores' });

    const studentId = parseInt(req.params.studentId);

    await prisma.profileView.create({
      data: { studentId, employerId: employer.id }
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar vista' });
  }
};

exports.getMyViews = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(403).json({ error: 'Solo estudiantes' });

    const views = await prisma.profileView.findMany({
      where: { studentId: student.id },
      include: {
        employer: {
          select: {
            companyName: true,
            sector: true,
            city: true,
            photoPath: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: 50
    });

    res.json(views);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener vistas' });
  }
};
