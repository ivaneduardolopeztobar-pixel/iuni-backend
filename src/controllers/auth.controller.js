const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendVerificationEmail, sendWelcomeEmployerEmail } = require('../utils/mailer');
const prisma = new PrismaClient();

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.register = async (req, res) => {
  try {
    const { email, password, userType, firstName, lastName, companyName, repName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya registrado' });

    // Validar dominio universitario para estudiantes
    if (userType === 'STUDENT') {
      const emailDomain = email.split('@')[1];
      if (!emailDomain) return res.status(400).json({ error: 'Email invalido' });

      const validDomain = await prisma.universityDomain.findFirst({
        where: { domain: emailDomain, active: true }
      });

      if (!validDomain) {
        // Verificar si es .edu.sv para sugerir solicitud
        if (emailDomain.endsWith('.edu.sv')) {
          return res.status(400).json({
            error: 'Tu universidad aun no esta en nuestra lista',
            canRequest: true,
            domain: emailDomain
          });
        }
        return res.status(400).json({
          error: 'Solo se permiten correos institucionales universitarios para estudiantes',
          canRequest: false
        });
      }
    }

    const hashed = await bcrypt.hash(password, 12);

    // Estudiantes requieren verificación de email
    const needsVerification = userType === 'STUDENT';
    const verifyToken = needsVerification ? crypto.randomBytes(32).toString('hex') : null;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        userType,
        emailVerified: !needsVerification,
        verifyToken
      }
    });

    if (userType === 'STUDENT') {
      await prisma.student.create({
        data: { userId: user.id, firstName: firstName || '', lastName: lastName || '' }
      });
      // Enviar email de verificación
      try {
        await sendVerificationEmail(email, verifyToken, firstName);
      } catch (emailErr) {
        console.error('Error enviando email de verificación:', emailErr.message);
      }
    } else if (userType === 'EMPLOYER') {
      await prisma.employer.create({
        data: { userId: user.id, repName: repName || '', companyName: companyName || '' }
      });
      // Email de bienvenida al empleador
      try {
        await sendWelcomeEmployerEmail(email, companyName || repName || 'tu empresa');
      } catch (emailErr) {
        console.error('Error enviando email bienvenida:', emailErr.message);
      }
    }

    const token = generateToken(user);

    if (needsVerification) {
      return res.status(201).json({
        requiresVerification: true,
        message: 'Cuenta creada. Revisa tu correo institucional para verificar tu cuenta.',
        userType: user.userType
      });
    }

    res.status(201).json({ token, userType: user.userType, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) return res.status(400).json({ error: 'Token invalido o ya usado' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null }
    });

    const jwtToken = generateToken(user);
    let profileId = null;
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    profileId = student?.id;
    const photoPath = student?.photoPath || null;

    res.json({
      token: jwtToken,
      userType: user.userType,
      userId: user.id,
      profileId,
      photoPath,
      message: 'Email verificado exitosamente'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxx';
    const valid = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    // Verificar si el estudiante verifico su email
    if (user.userType === 'STUDENT' && !user.emailVerified) {
      return res.status(403).json({
        error: 'Debes verificar tu correo institucional antes de iniciar sesion',
        requiresVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user);
    let profileId = null;
    let photoPath = null;

    if (user.userType === 'STUDENT') {
      const s = await prisma.student.findUnique({ where: { userId: user.id } });
      profileId = s?.id;
      photoPath = s?.photoPath || null;
    } else {
      const e = await prisma.employer.findUnique({ where: { userId: user.id } });
      profileId = e?.id;
      photoPath = e?.photoPath || null;
    }

    res.json({ token, userType: user.userType, userId: user.id, profileId, photoPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return res.json({ message: 'Si el email existe y no esta verificado, recibirás un nuevo correo' });
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { verifyToken } });
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    await sendVerificationEmail(email, verifyToken, student?.firstName);
    res.json({ message: 'Correo de verificación reenviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};
