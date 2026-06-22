const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EDITABLE_FIELDS = [
  'repName', 'phone', 'companyName', 'companySchedule', 'city', 'country',
  'workerCount', 'sector', 'annualVacancies', 'photoPath', 'website'
];

exports.getProfile = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { email: true } } }
    });
    if (!employer) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = {};
    for (const key of EDITABLE_FIELDS) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const employer = await prisma.employer.update({ where: { userId: req.user.id }, data });
    res.json(employer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

exports.getPublicProfile = async (req, res) => {
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
        website: true,
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
        _count: { select: { jobPosts: true } }
      }
    });
    if (!employer) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(employer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};
