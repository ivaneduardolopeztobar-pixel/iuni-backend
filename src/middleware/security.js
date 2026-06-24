const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const isDev = process.env.NODE_ENV === 'development';

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 5000 : 300,
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit estricto para LOGIN (proteger contra brute-force de contraseñas)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 8,
  message: { error: 'Demasiados intentos de inicio de sesion, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // solo cuenta intentos fallidos
});

// Rate limit permisivo para REGISTRO (crear cuentas no es un vector de brute-force igual)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDev ? 200 : 20,
  message: { error: 'Demasiados intentos de registro, intenta en 1 hora' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para RESET de contraseña y verificación de email
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 5,
  message: { error: 'Demasiadas solicitudes, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { error: 'Limite de uploads alcanzado, intenta en 1 hora' },
});

module.exports = {
  helmet,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  resetLimiter,
  uploadLimiter,
  // Mantener authLimiter como alias por compatibilidad si se usa en otro lado
  authLimiter: loginLimiter,
};
