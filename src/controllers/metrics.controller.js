const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEmployerMetrics = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    if (!employer) return res.status(404).json({ error: 'No encontrado' });

    const jobs = await prisma.jobPost.findMany({
      where: { employerId: employer.id },
      include: {
        applications: true,
        _count: { select: { applications: true, favorites: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.isActive).length;
    const totalApplications = jobs.reduce((sum, j) => sum + j._count.applications, 0);
    const totalFavorites = jobs.reduce((sum, j) => sum + j._count.favorites, 0);

    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: { jobPost: { employerId: employer.id } },
      _count: { status: true }
    });

    const profileViews = await prisma.profileView.count({
      where: { employerId: employer.id }
    });

    const topJobs = jobs
      .sort((a, b) => b._count.applications - a._count.applications)
      .slice(0, 5)
      .map(j => ({
        id: j.id,
        title: j.title,
        applications: j._count.applications,
        favorites: j._count.favorites,
        isActive: j.isActive,
        createdAt: j.createdAt
      }));

    const last7days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0,0,0,0));
      const end = new Date(date.setHours(23,59,59,999));
      const count = await prisma.application.count({
        where: {
          jobPost: { employerId: employer.id },
          createdAt: { gte: start, lte: end }
        }
      });
      last7days.push({
        date: start.toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric' }),
        applications: count
      });
    }

    res.json({
      summary: { totalJobs, activeJobs, totalApplications, totalFavorites, profileViews },
      applicationsByStatus,
      topJobs,
      last7days
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};
