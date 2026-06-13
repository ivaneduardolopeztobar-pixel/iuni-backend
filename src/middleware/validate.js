const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg
    });
  }
  next();
};

const registerRules = [
  body('email')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contrasena debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayuscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un numero'),
  body('userType')
    .isIn(['STUDENT', 'EMPLOYER']).withMessage('Tipo de usuario invalido'),
];

const loginRules = [
  body('email')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Contrasena requerida'),
];

module.exports = { handleValidation, registerRules, loginRules };
