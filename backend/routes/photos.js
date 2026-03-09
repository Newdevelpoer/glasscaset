const router = require('express').Router();
const path   = require('path');
const fsp    = require('fs').promises;
const { VALID_SEASONS, PHOTOS_DIR, THUMBS_DIR, MAX_PER_SEASON, MAX_FILE_MB } = require('../config');
const { uploadLimiter, authLimiter, requirePin } = require('../middleware');
const upload      = require('../multerSetup');
const ensureThumb = require('../thumbnails');

/* ── TOTAL PHOTO COUNT (lightweight) ── */
router.get('/total', async (req, res) => {
  let total = 0;
  for (const season of VALID_SEASONS) {
    const dir = path.join(PHOTOS_DIR, season);
    try {
      const files = await fsp.readdir(dir);
      total += files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f)).length;
    } catch {}
  }
  res.json({ total });
});

/* ── LIST PHOTOS ── */
router.get('/:season', async (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  const dir = path.join(PHOTOS_DIR, season);
  try {
    await fsp.access(dir);
  } catch {
    return res.json({ photos: [], count: 0 });
  }
  try {
    const allFiles = await fsp.readdir(dir);
    const imgFiles = allFiles.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    const files = await Promise.all(imgFiles.map(async f => {
      const stat = await fsp.stat(path.join(dir, f));
      const thumb = await ensureThumb(season, f);
      return {
        filename: f,
        url: `/photos/${season}/${f}`,
        thumb: thumb || `/photos/${season}/${f}`,
        uploadedAt: stat.mtime.toISOString()
      };
    }));
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ season, photos: files, count: files.length });
  } catch {
    res.json({ photos: [], count: 0 });
  }
});

/* ── UPLOAD (separate router to avoid /:season collision) ── */
const uploadRouter = require('express').Router();

uploadRouter.post('/:season', authLimiter, uploadLimiter, requirePin, async (req, res, next) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  const dir = path.join(PHOTOS_DIR, season);
  try {
    await fsp.access(dir);
    const files = await fsp.readdir(dir);
    const cnt = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f)).length;
    if (cnt >= MAX_PER_SEASON) return res.status(400).json({ error: 'Season storage full.' });
  } catch {
    // dir doesn't exist yet, that's fine
  }
  next();
}, upload.array('photos', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files received.' });
  const results = req.files.map(f => ({
    filename: f.filename,
    url: `/photos/${req.params.season}/${f.filename}`,
    size: f.size
  }));
  // Fire-and-forget thumbnail generation
  for (const f of req.files) {
    ensureThumb(req.params.season, f.filename).catch(() => {});
  }
  res.json({ success: true, uploaded: results });
});

/* ── DELETE ── */
router.delete('/:season/:filename', authLimiter, async (req, res) => {
  const { season, filename } = req.params;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  if (!/^[a-zA-Z0-9_\-]{1,255}\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return res.status(400).json({ error: 'Invalid filename' });
  const fp = path.join(PHOTOS_DIR, season, filename);
  if (!fp.startsWith(PHOTOS_DIR)) return res.status(403).json({ error: 'Forbidden' });
  try {
    await fsp.access(fp);
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
  await fsp.unlink(fp);
  const thumbPath = path.join(THUMBS_DIR, season, filename);
  fsp.unlink(thumbPath).catch(() => {});
  res.json({ success: true });
});

module.exports = { photosRouter: router, uploadRouter };
