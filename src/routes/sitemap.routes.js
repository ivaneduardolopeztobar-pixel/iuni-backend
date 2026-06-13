const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const jobs = await prisma.jobPost.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/register', priority: '0.8', changefreq: 'monthly' },
      { url: '/login', priority: '0.5', changefreq: 'monthly' },
    ];

    const jobPages = jobs.map(j => ({
      url: '/jobs/' + j.id,
      priority: '0.9',
      changefreq: 'weekly',
      lastmod: j.updatedAt.toISOString().split('T')[0]
    }));

    const allPages = [...staticPages, ...jobPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    ${p.lastmod ? '<lastmod>' + p.lastmod + '</lastmod>' : ''}
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /employer/
Disallow: /student/profile
Disallow: /my-applications
Disallow: /my-favorites

Sitemap: ${baseUrl}/sitemap.xml`);
});

module.exports = router;
