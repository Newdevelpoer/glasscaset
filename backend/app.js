const express = require('express');
const { applyMiddleware } = require('./middleware');
const { MAX_FILE_MB, PUBLIC_DIR } = require('./config');
const path = require('path');

/* ── Route modules ── */
const { photosRouter, uploadRouter } = require('./routes/photos');
const videosRoutes = require('./routes/videos');
const seoRoutes    = require('./routes/seo');
const miscRoutes   = require('./routes/misc');
const pageRoutes   = require('./routes/pages');

function createApp() {
  const app = express();

  /* ── Middleware stack ── */
  applyMiddleware(app);

  /* ── SEO (top-level paths) ── */
  app.use(seoRoutes);

  /* ── API routes ── */
  app.use('/api/photos',  photosRouter);       // /api/photos/total, /api/photos/:season, /api/photos/:season/:filename
  app.use('/api/upload',  uploadRouter);       // /api/upload/:season
  app.use('/api',         videosRoutes);       // /api/videos, /api/video/:season
  app.use('/api',         miscRoutes);         // /api/health, /api/verify-pin, /api/manifest, /api/storage, /api/link/:season

  /* ── Multer / upload error handler ── */
  app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: `File too large. Max ${MAX_FILE_MB}MB.` });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 20 at once.' });
    if (err.message === 'Only images allowed' || err.message === 'Invalid file type' || err.message === 'Invalid season') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  });

  /* ── HTML pages (clean URLs) ── */
  app.use(pageRoutes);

  /* ── 404 fallback ── */
  app.use((req, res) => {
    if (req.accepts('html')) {
      res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  /* ── Global error handler ── */
  app.use((err, req, res, next) => {
    console.error('[UNHANDLED]', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  });

  return app;
}

module.exports = createApp;
