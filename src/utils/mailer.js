const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const USE_RESEND = process.env.NODE_ENV === "production";

// Gmail para desarrollo, Resend para produccion
const sendEmail = async ({ to, subject, html }) => {
  if (USE_RESEND) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
      from: process.env.EMAIL_FROM || "iUNI <noreply@iuni.com>",
      to,
      subject,
      html
    });
  } else {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
    return transporter.sendMail({
      from: process.env.EMAIL_FROM || "iUNI <" + process.env.EMAIL_USER + ">",
      to,
      subject,
      html
    });
  }
};

exports.sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = FRONTEND_URL + "/verify-email?token=" + token;
  await sendEmail({
    to: email,
    subject: "iUNI — Verifica tu correo institucional",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 4px;">
          <span style="color: #dc2626;">i</span>UNI
        </h1>
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 24px;">Plataforma de empleo estudiantil</p>
        <h2 style="font-size: 20px; margin-bottom: 8px;">Hola ${name || "estudiante"},</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">
          Verifica tu correo institucional para confirmar que eres estudiante universitario
          y poder postularte a empleos en iUNI.
        </p>
        <a href="${verifyUrl}"
          style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
          Verificar mi correo
        </a>
        <p style="color: #6b7280; font-size: 12px;">Este enlace expira en 24 horas. Si no creaste una cuenta en iUNI, ignora este email.</p>
        <hr style="border-color: #1f2937; margin: 24px 0;" />
        <p style="color: #4b5563; font-size: 12px;">iUNI — Empleo Estudiantil El Salvador</p>
      </div>
    `
  });
  console.log("Email verificacion enviado a:", email);
};

exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = FRONTEND_URL + "/reset-password?token=" + token;
  await sendEmail({
    to: email,
    subject: "iUNI — Restablecer contrasena",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 28px; font-weight: 900;"><span style="color: #dc2626;">i</span>UNI</h1>
        <h2 style="font-size: 20px; margin: 16px 0;">Restablecer contrasena</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">Haz click para crear una nueva contrasena.</p>
        <a href="${resetUrl}"
          style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
          Restablecer contrasena
        </a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Este enlace expira en 1 hora.</p>
        <hr style="border-color: #1f2937; margin: 24px 0;" />
        <p style="color: #4b5563; font-size: 12px;">iUNI — Empleo Estudiantil El Salvador</p>
      </div>
    `
  });
};

exports.sendJobAlertEmail = async (email, job) => {
  const jobUrl = FRONTEND_URL + "/jobs/" + job.id;
  await sendEmail({
    to: email,
    subject: "iUNI — Nueva oferta: " + job.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 28px; font-weight: 900;"><span style="color: #dc2626;">i</span>UNI</h1>
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 24px;">Nueva oferta que coincide con tus alertas</p>
        <div style="background: #111; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 800;">${job.title}</h2>
          <p style="color: #dc2626; font-weight: 600;">${job.companyName || ""}</p>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 8px;">${job.description ? job.description.substring(0, 150) + "..." : ""}</p>
        </div>
        <a href="${jobUrl}" style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 12px 28px; border-radius: 12px; text-decoration: none;">
          Ver oferta completa
        </a>
        <p style="color: #4b5563; font-size: 11px; margin-top: 24px;">Recibiste este email porque tienes alertas activas en iUNI.</p>
      </div>
    `
  });
};

exports.sendStatusNotificationEmail = async (email, title, message) => {
  await sendEmail({
    to: email,
    subject: "iUNI — " + title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 28px; font-weight: 900;"><span style="color: #dc2626;">i</span>UNI</h1>
        <h2 style="font-size: 20px; margin: 16px 0;">${title}</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">${message}</p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background: #dc2626; color: #fff; font-weight: bold; padding: 12px 28px; border-radius: 12px; text-decoration: none;">
          Ir a iUNI
        </a>
        <hr style="border-color: #1f2937; margin: 24px 0;" />
        <p style="color: #4b5563; font-size: 12px;">iUNI — Empleo Estudiantil El Salvador</p>
      </div>
    `
  });
};
