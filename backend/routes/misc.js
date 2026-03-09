const router = require('express').Router();
const path   = require('path');
const fsp    = require('fs').promises;
const rateLimit = require('express-rate-limit');
const { VALID_SEASONS, PHOTOS_DIR, VIDEOS_DIR, MAX_PER_SEASON, SITE_URL, UPLOAD_PIN } = require('../config');
const { authLimiter } = require('../middleware');
const ensureThumb = require('../thumbnails');

/* Rate limiter for expensive endpoints */
const heavyLimiter = rateLimit({
  windowMs: 60*1000, max: 10,
  message: { error: 'Too many requests. Try again in a minute.' }
});

/* ── HEALTH CHECK ── */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

/* ── VERIFY PIN ── */
router.post('/verify-pin', authLimiter, (req, res) => {
  const pin = req.body?.pin;
  if (!pin || pin !== UPLOAD_PIN) return res.status(401).json({ valid: false });
  res.json({ valid: true });
});

/* ── ASSET MANIFEST (for Service Worker preloading) ── */
router.get('/manifest', heavyLimiter, async (req, res) => {
  const assets = {
    css: ['/css/base.css', '/css/home.css', '/css/gallery.css', '/css/about.css', '/css/birthday.css', '/css/upload.css', '/css/btn-hover.css'],
    js:  ['/js/cursor.js', '/js/common.js', '/js/home.js', '/js/countdown.js', '/js/gallery.js', '/js/seasons.js', '/js/upload.js', '/js/about.js', '/js/birthday-page.js', '/js/btn-hover.js', '/js/preloader.js'],
    pages: ['/', '/gallery', '/about', '/birthday'],
    thumbs: [],
    videos: []
  };

  for (const season of VALID_SEASONS) {
    const dir = path.join(PHOTOS_DIR, season);
    try {
      const files = await fsp.readdir(dir);
      const imgs = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
      for (const f of imgs) {
        const thumb = await ensureThumb(season, f);
        if (thumb) assets.thumbs.push(thumb);
      }
    } catch {}
  }

  for (const season of VALID_SEASONS) {
    const vDir = path.join(VIDEOS_DIR, season);
    try {
      const files = await fsp.readdir(vDir);
      const vids = files.filter(f => /\.(mp4|webm|mov|ogg)$/i.test(f) && !f.startsWith('.'));
      if (vids.length) assets.videos.push(`/videos/${season}/${vids[0]}`);
    } catch {}
  }

  res.json(assets);
});

/* ── STORAGE STATS ── */
router.get('/storage', heavyLimiter, async (req, res) => {
  const stats = {};
  let totalPhotos = 0, totalSize = 0;
  for (const season of VALID_SEASONS) {
    const dir = path.join(PHOTOS_DIR, season);
    const s = { photos: 0, bytes: 0, capacity: MAX_PER_SEASON };
    try {
      const allFiles = await fsp.readdir(dir);
      const files = allFiles.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
      s.photos = files.length;
      for (const f of files) {
        try { const st = await fsp.stat(path.join(dir, f)); s.bytes += st.size; } catch {}
      }
    } catch {}
    totalPhotos += s.photos;
    totalSize += s.bytes;
    stats[season] = s;
  }
  res.json({ seasons: stats, totalPhotos, totalBytes: totalSize, totalMB: +(totalSize / (1024 * 1024)).toFixed(2) });
});

/* ── SHAREABLE SEASON LINKS ── */
router.get('/link/:season', (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  res.json({
    season,
    url: `${SITE_URL}/gallery#${season}`,
    embed: `<a href="${SITE_URL}/gallery#${season}">View ${season} photos</a>`,
  });
});

module.exports = router;
