const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalEmployers,
      totalJobs,
      totalApplications,
      totalNotifications,
      recentUsers,
      recentJobs,
      applicationsByStatus
    ] = await Promise.all([
      prisma.student.count(),
      prisma.employer.count(),
      prisma.jobPost.count({ where: { isActive: true } }),
      prisma.application.count(),
      prisma.notification.count({ where: { read: false } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, userType: true, createdAt: true }
      }),
      prisma.jobPost.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { employer: { select: { companyName: true } }, _count: { select: { applications: true } } }
      }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    res.json({
      stats: { totalStudents, totalEmployers, totalJobs, totalApplications, totalNotifications },
      recentUsers,
      recentJobs,
      applicationsByStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { type, search, page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;
    const where = {};
    if (type) where.userType = type;
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, email: true, userType: true, createdAt: true,
          student: { select: { firstName: true, lastName: true, city: true } },
          employer: { select: { companyName: true, city: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;
    const where = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          employer: { select: { companyName: true } },
          _count: { select: { applications: true } }
        }
      }),
      prisma.jobPost.count({ where })
    ]);

    res.json({ jobs, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.toggleJob = async (req, res) => {
  try {
    const job = await prisma.jobPost.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!job) return res.status(404).json({ error: 'No encontrado' });
    const updated = await prisma.jobPost.update({
      where: { id: job.id },
      data: { isActive: !job.isActive }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'No encontrado' });
    if (user.userType === 'ADMIN') return res.status(403).json({ error: 'No puedes eliminar un admin' });

    if (user.userType === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) {
        await prisma.application.deleteMany({ where: { studentId: student.id } });
        await prisma.favorite.deleteMany({ where: { studentId: student.id } });
        await prisma.profileView.deleteMany({ where: { studentId: student.id } });
        await prisma.student.delete({ where: { userId } });
      }
    } else if (user.userType === 'EMPLOYER') {
      const employer = await prisma.employer.findUnique({ where: { userId } });
      if (employer) {
        const jobs = await prisma.jobPost.findMany({ where: { employerId: employer.id } });
        for (const job of jobs) {
          await prisma.application.deleteMany({ where: { jobPostId: job.id } });
          await prisma.favorite.deleteMany({ where: { jobPostId: job.id } });
        }
        await prisma.jobPost.deleteMany({ where: { employerId: employer.id } });
        await prisma.profileView.deleteMany({ where: { employerId: employer.id } });
        await prisma.employer.delete({ where: { userId } });
      }
    }

    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

exports.getEmployers = async (req, res) => {
  try {
    const employers = await prisma.employer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, createdAt: true } },
        _count: { select: { jobPosts: true } }
      }
    });
    res.json(employers);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.toggleVerified = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!employer) return res.status(404).json({ error: 'No encontrado' });
    const updated = await prisma.employer.update({
      where: { id: employer.id },
      data: {
        verified: !employer.verified,
        verifiedAt: !employer.verified ? new Date() : null
      }
    });

    // Notificar al empleador
    if (updated.verified) {
      await prisma.notification.create({
        data: {
          userId: (await prisma.user.findFirst({ where: { employer: { id: employer.id } } })).id,
          title: 'Empresa verificada',
          message: 'Tu empresa ha sido verificada por el equipo de iUNI. Ahora apareces con el badge de verificación.'
        }
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};

exports.getDomains = async (req, res) => {
  try {
    const domains = await prisma.universityDomain.findMany({ orderBy: { university: 'asc' } });
    res.json(domains);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.addDomain = async (req, res) => {
  try {
    const { domain, university } = req.body;
    if (!domain || !university) return res.status(400).json({ error: 'Datos requeridos' });
    const existing = await prisma.universityDomain.findUnique({ where: { domain } });
    if (existing) return res.status(400).json({ error: 'Dominio ya existe' });
    const d = await prisma.universityDomain.create({ data: { domain, university } });
    res.json(d);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.toggleDomain = async (req, res) => {
  try {
    const d = await prisma.universityDomain.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!d) return res.status(404).json({ error: 'No encontrado' });
    const updated = await prisma.universityDomain.update({
      where: { id: d.id },
      data: { active: !d.active }
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.getDomainRequests = async (req, res) => {
  try {
    const requests = await prisma.domainRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.approveDomainRequest = async (req, res) => {
  try {
    const request = await prisma.domainRequest.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!request) return res.status(404).json({ error: 'No encontrado' });
    await prisma.universityDomain.create({
      data: { domain: request.domain, university: request.university }
    });
    await prisma.domainRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED' }
    });
    res.json({ message: 'Dominio aprobado' });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};
