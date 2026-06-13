const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id }, include: { user: { select: { email: true } } } });
    if (!employer) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(employer);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body;
    delete data.userId; delete data.id;
    const employer = await prisma.employer.update({ where: { userId: req.user.id }, data });
    res.json(employer);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al actualizar' }); }
};
