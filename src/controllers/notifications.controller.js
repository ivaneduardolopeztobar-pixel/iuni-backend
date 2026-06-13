const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false }
    , data: { read: true }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.markOneRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { read: true }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};
