const router = require('express').Router();
const { SITE_URL } = require('../config');

/* ── robots.txt ── */
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml`
  );
});

/* ── sitemap.xml ── */
router.get('/sitemap.xml', (req, res) => {
  const pages = ['/', '/gallery', '/about', '/birthday'];
  const urls = pages.map(p =>
    `  <url><loc>${SITE_URL}${p}</loc><changefreq>weekly</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`
  ).join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  );
});

module.exports = router;
