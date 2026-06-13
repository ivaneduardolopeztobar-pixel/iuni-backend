const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/verify-email?token=' + token;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'iUNI — Verifica tu correo institucional',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 4px;">
          <span style="color: #dc2626;">i</span>UNI
        </h1>
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 24px;">Plataforma de empleo estudiantil</p>
        <h2 style="font-size: 20px; margin-bottom: 8px;">Hola ${name || 'estudiante'},</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">
          Verifica tu correo institucional para confirmar que eres estudiante universitario
          y poder postularte a empleos en iUNI.
        </p>
        <a href="${verifyUrl}"
          style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
          Verificar mi correo
        </a>
        <p style="color: #6b7280; font-size: 12px;">
          Este enlace expira en 24 horas. Si no creaste una cuenta en iUNI, ignora este email.
        </p>
        <hr style="border-color: #1f2937; margin: 24px 0;" />
        <p style="color: #4b5563; font-size: 12px;">Universidad de El Salvador — Ingenieria en Desarrollo de Software</p>
      </div>
    `,
  });
};
