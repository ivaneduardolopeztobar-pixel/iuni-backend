const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { email: true } } }
    });
    if (!student) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      'firstName', 'lastName', 'phone', 'birthDate', 'identification',
      'country', 'city', 'desiredPosition', 'career', 'profileDescription',
      'willingToTravel', 'languages', 'hasWorkExperience', 'workExperience',
      'hasDriverLicense', 'technicalSkills', 'softSkills'
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const student = await prisma.student.update({
      where: { userId: req.user.id },
      data,
      include: { user: { select: { email: true } } }
    });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.studentId) },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        city: true, country: true, desiredPosition: true, career: true,
        profileDescription: true, languages: true, technicalSkills: true,
        softSkills: true, photoPath: true, cvPath: true,
        hasWorkExperience: true, workExperience: true,
        hasDriverLicense: true, willingToTravel: true,
        user: { select: { email: true } }
      }
    });
    if (!student) return res.status(404).json({ error: 'No encontrado' });

    // Reemplazar email con nombre de universidad basado en el dominio
    let university = null;
    if (student.user?.email) {
      const domain = student.user.email.split('@')[1];
      const uniDomain = await prisma.universityDomain.findUnique({ where: { domain } });
      university = uniDomain ? uniDomain.university : null;
    }

    const { user, ...rest } = student;
    res.json({ ...rest, university });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
};
