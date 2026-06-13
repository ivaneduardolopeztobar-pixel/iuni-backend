const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'iUNI — Restablecer contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 8px;">
          <span style="color: #dc2626;">i</span>UNI
        </h1>
        <h2 style="font-size: 20px; margin-bottom: 16px;">Restablecer contraseña</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">
          Recibimos una solicitud para restablecer tu contraseña. 
          Haz click en el botón de abajo para crear una nueva contraseña.
        </p>
        <a href="${resetUrl}"
          style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
          Restablecer contraseña
        </a>
        <p style="color: #6b7280; font-size: 12px;">
          Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.
        </p>
        <hr style="border-color: #1f2937; margin: 24px 0;" />
        <p style="color: #4b5563; font-size: 12px;">
          Universidad de El Salvador — Ingenieria en Desarrollo de Software
        </p>
      </div>
    `,
  });
};
