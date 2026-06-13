const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  message: { error: 'Demasiados intentos de login, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { error: 'Limite de uploads alcanzado, intenta en 1 hora' },
});

module.exports = { helmet, generalLimiter, authLimiter, uploadLimiter };
