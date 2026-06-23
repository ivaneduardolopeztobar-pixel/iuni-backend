const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.apply = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { user: true }
    });
    if (!student) return res.status(403).json({ error: 'Solo estudiantes' });

    const jobPost = await prisma.jobPost.findUnique({
      where: { id: parseInt(req.params.jobId) },
      include: { employer: { include: { user: true } } }
    });
    if (!jobPost) return res.status(404).json({ error: 'Empleo no encontrado' });

    const existing = await prisma.application.findFirst({
      where: { studentId: student.id, jobPostId: jobPost.id }
    });
    if (existing) return res.status(400).json({ error: 'Ya postulado' });

    const app = await prisma.application.create({
      data: { studentId: student.id, jobPostId: jobPost.id }
    });

    // Notificacion al empleador
    await prisma.notification.create({
      data: {
        userId: jobPost.employer.user.id,
        title: 'Nueva postulacion recibida',
        message: student.firstName + ' ' + student.lastName + ' aplico al puesto de ' + jobPost.title
      }
    });

    res.status(201).json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(403).json({ error: 'Solo estudiantes' });
    const apps = await prisma.application.findMany({
      where: { studentId: student.id },
      include: { jobPost: { include: { employer: { select: { companyName: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(apps);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.getJobApplications = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    if (!employer) return res.status(403).json({ error: 'No autorizado' });
    const job = await prisma.jobPost.findUnique({ where: { id: parseInt(req.params.jobId) } });
    if (!job || job.employerId !== employer.id) return res.status(403).json({ error: 'No autorizado' });
    const apps = await prisma.application.findMany({
      where: { jobPostId: job.id },
      include: { student: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(apps);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['POSTULADO', 'EN_REVISION', 'ACEPTADO', 'RECHAZADO'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Estado invalido' });

    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    if (!employer) return res.status(403).json({ error: 'No autorizado' });

    const app = await prisma.application.findUnique({
      where: { id: parseInt(req.params.appId) },
      include: { jobPost: true, student: { include: { user: true } } }
    });
    if (!app || app.jobPost.employerId !== employer.id) return res.status(403).json({ error: 'No autorizado' });

    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { status }
    });

    const messages = {
      EN_REVISION: {
        title: 'Tu postulacion esta en revision',
        message: employer.companyName + ' esta revisando tu postulacion para el puesto de ' + app.jobPost.title
      },
      ACEPTADO: {
        title: 'Felicidades! Postulacion aceptada',
        message: employer.companyName + ' ha aceptado tu postulacion para el puesto de ' + app.jobPost.title
      },
      RECHAZADO: {
        title: 'Postulacion no seleccionada',
        message: employer.companyName + ' no selecciono tu postulacion para ' + app.jobPost.title + '. Sigue intentando!'
      },
    };

    if (messages[status]) {
      await prisma.notification.create({
        data: {
          userId: app.student.user.id,
          title: messages[status].title,
          message: messages[status].message
        }
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};
