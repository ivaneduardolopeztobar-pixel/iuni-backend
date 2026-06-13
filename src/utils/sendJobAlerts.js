const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

      // Ciudad es opcional — si no hay ciudad en el empleo o en la alerta, igual enviar
      const alertCity = alert.city ? alert.city.toLowerCase() : null;
      const jobCity = job.employerCity ? job.employerCity.toLowerCase() : null;
      const matchesCity = !alertCity || !jobCity || jobCity.includes(alertCity) || alertCity.includes(jobCity);

      if (matchesKeyword && matchesJobType && matchesCity) {
        const email = alert.student?.user?.email;
        if (!email) continue;

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'iUNI — Nueva oferta: ' + job.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
              <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 4px;">
                <span style="color: #dc2626;">i</span>UNI
              </h1>
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 24px;">Nueva oferta que coincide con tus alertas</p>
              <div style="background: #111; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 4px;">${job.title}</h2>
                <p style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">${job.companyName || ''}</p>
                ${job.jobType ? '<span style="background: #1f2937; color: #9ca3af; font-size: 12px; padding: 4px 10px; border-radius: 999px;">' + job.jobType + '</span>' : ''}
                ${job.salary ? '<span style="color: #4ade80; font-size: 13px; font-weight: 600; margin-left: 8px;">' + job.salary + '</span>' : ''}
                <p style="color: #9ca3af; font-size: 13px; margin-top: 12px; line-height: 1.6;">
                  ${job.description ? job.description.substring(0, 150) + '...' : ''}
                </p>
              </div>
              <a href="http://localhost:5173/jobs/${job.id}"
                style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 12px 28px; border-radius: 12px; text-decoration: none;">
                Ver oferta completa
              </a>
              <p style="color: #4b5563; font-size: 11px; margin-top: 24px;">
                Recibiste este email porque tienes alertas de empleo activas en iUNI.
              </p>
            </div>
          `,
        });
      }
    }
  } catch (err) {
    console.error('Error enviando alertas:', err.message);
  }
};

module.exports = sendJobAlerts;
