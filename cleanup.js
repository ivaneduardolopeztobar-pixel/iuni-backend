const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUserCascade(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.log('No existe:', email); return; }

  if (user.userType === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s) {
      await prisma.application.deleteMany({ where: { studentId: s.id } });
      await prisma.favorite.deleteMany({ where: { studentId: s.id } });
      await prisma.profileView.deleteMany({ where: { studentId: s.id } });
      await prisma.jobAlert.deleteMany({ where: { studentId: s.id } });
      await prisma.student.delete({ where: { userId: user.id } });
    }
  } else if (user.userType === 'EMPLOYER') {
    const e = await prisma.employer.findUnique({ where: { userId: user.id } });
    if (e) {
      const jobs = await prisma.jobPost.findMany({ where: { employerId: e.id } });
      for (const job of jobs) {
        await prisma.application.deleteMany({ where: { jobPostId: job.id } });
        await prisma.favorite.deleteMany({ where: { jobPostId: job.id } });
      }
      await prisma.jobPost.deleteMany({ where: { employerId: e.id } });
      await prisma.profileView.deleteMany({ where: { employerId: e.id } });
      await prisma.employer.delete({ where: { userId: user.id } });
    }
  }

  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('Eliminado:', email);
}

async function main() {
  await deleteUserCascade('Lt22009@ues.edu.sv');
  await deleteUserCascade('lt22009@ues.edu.sv');
  await deleteUserCascade('contacto@jmtech-solutions.com');
  await prisma.$disconnect();
}
main();
