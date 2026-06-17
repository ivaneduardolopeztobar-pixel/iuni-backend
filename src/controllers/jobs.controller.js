const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const sendJobAlerts = require('../utils/sendJobAlerts');

exports.getAll = async (req, res) => {
  try {
    const { search, location, jobType, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (jobType) {
      where.jobType = { contains: jobType, mode: 'insensitive' };
    }
    if (location) {
      where.employer = {
        city: { contains: location, mode: 'insensitive' }
      };
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        include: { employer: { select: { id: true, companyName: true, city: true, photoPath: true, verified: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.jobPost.count({ where })
    ]);

    res.json({
      jobs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + jobs.length < total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const job = await prisma.jobPost.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { employer: { select: { id: true, companyName: true, city: true, photoPath: true, sector: true, verified: true } }, applications: true }
    });
    if (!job) return res.status(404).json({ error: 'No encontrado' });
    res.json(job);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.create = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    if (!employer) return res.status(403).json({ error: 'No autorizado' });
    const job = await prisma.jobPost.create({ data: { ...req.body, employerId: employer.id } });

    // Enviar alertas a estudiantes en background
    sendJobAlerts({
      id: job.id,
      title: job.title,
      description: job.description,
      jobType: job.jobType,
      salary: job.salary,
      companyName: employer.companyName,
      employerCity: employer.city
    }).catch(err => console.error('Alert error:', err));

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear' });
  }
};

exports.update = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    const job = await prisma.jobPost.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!job || job.employerId !== employer.id) return res.status(403).json({ error: 'No autorizado' });
    const allowed = ['title','description','jobType','experienceRequired','minEducation',
      'careerYear','technicalSkills','workConditions','studentBenefits','salary','softSkills'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const updated = await prisma.jobPost.update({ where: { id: job.id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    const job = await prisma.jobPost.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!job || job.employerId !== employer.id) return res.status(403).json({ error: 'No autorizado' });
    await prisma.jobPost.update({ where: { id: job.id }, data: { isActive: false } });
    res.json({ message: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.getByEmployer = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    const jobs = await prisma.jobPost.findMany({
      where: { employerId: employer.id },
      include: { applications: { include: { student: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};
