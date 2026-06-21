const router = require('express').Router();
const { register, login, verifyEmail, resendVerification } = require('../controllers/auth.controller');
const { loginLimiter, registerLimiter, resetLimiter } = require('../middleware/security');
const { registerRules, loginRules, handleValidation } = require('../middleware/validate');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', registerLimiter, registerRules, handleValidation, register);
router.post('/login', loginLimiter, loginRules, handleValidation, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resetLimiter, resendVerification);

// Solicitar nuevo dominio universitario
router.post('/request-domain', registerLimiter, async (req, res) => {
  try {
    const { domain, university, email } = req.body;
    if (!domain || !university || !email) return res.status(400).json({ error: 'Datos requeridos' });
    await prisma.domainRequest.create({ data: { domain, university, email } });
    res.json({ message: 'Solicitud enviada. Te notificaremos cuando sea aprobada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
});

module.exports = router;
