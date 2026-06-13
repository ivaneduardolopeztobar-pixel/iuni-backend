const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/email');
const prisma = new PrismaClient();

exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Siempre responder igual para no revelar si el email existe
    if (!user) {
      return res.json({ message: 'Si el email existe recibirás un correo en breve' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry }
    });

    await sendPasswordResetEmail(email, token);

    res.json({ message: 'Si el email existe recibirás un correo en breve' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Datos requeridos' });

    if (password.length < 8) return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres' });
    if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Debe contener al menos una mayuscula' });
    if (!/[0-9]/.test(password)) return res.status(400).json({ error: 'Debe contener al menos un numero' });

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Token invalido o expirado' });

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Contrasena actualizada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al restablecer contrasena' });
  }
};
