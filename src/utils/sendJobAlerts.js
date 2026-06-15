const { PrismaClient } = require('@prisma/client');
const { sendJobAlertEmail } = require('./mailer');
const prisma = new PrismaClient();

const sendJobAlerts = async (job) => {
  try {
    const alerts = await prisma.jobAlert.findMany({
      where: { active: true },
      include: {
        student: {
          include: { user: { select: { email: true } } }
        }
      }
    });

    for (const alert of alerts) {
      const kw = alert.keywords ? alert.keywords.toLowerCase() : null;
      const matchesKeyword = !kw ||
        job.title.toLowerCase().includes(kw) ||
        (job.description && job.description.toLowerCase().includes(kw));

      const matchesJobType = !alert.jobType || !job.jobType || job.jobType === alert.jobType;

      const alertCity = alert.city ? alert.city.toLowerCase() : null;
      const jobCity = job.employerCity ? job.employerCity.toLowerCase() : null;
      const matchesCity = !alertCity || !jobCity || jobCity.includes(alertCity) || alertCity.includes(jobCity);

      if (matchesKeyword && matchesJobType && matchesCity) {
        const email = alert.student?.user?.email;
        if (!email) continue;
        await sendJobAlertEmail(email, job).catch(err =>
          console.error('Error enviando alerta a', email, err.message)
        );
      }
    }
  } catch (err) {
    console.error('Error en sendJobAlerts:', err.message);
  }
};

module.exports = sendJobAlerts;
