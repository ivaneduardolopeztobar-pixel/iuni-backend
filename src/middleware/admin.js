module.exports = (req, res, next) => {
  if (req.user?.userType !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
