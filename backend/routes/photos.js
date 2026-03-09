const router = require('express').Router();
const path   = require('path');
const { v4: uuidv4 } = require('uuid');
const { VALID_SEASONS, MAX_PER_SEASON } = require('../config');
const { uploadLimiter, authLimiter, requirePin } = require('../middleware');
const upload      = require('../multerSetup');
const ensureThumb = require('../thumbnails');
const { uploadToR2, deleteFromR2, listR2Objects } = require('../r2');

/* ── TOTAL PHOTO COUNT (lightweight) ── */
router.get('/total', async (req, res) => {
  let total = 0;
  for (const season of VALID_SEASONS) {
    const items = await listR2Objects(`photos/${season}/`);
    /* Filter out .thumbs prefix and non-image keys */
    total += items.filter(o => {
      const k = o.Key;
      return !k.includes('.thumbs') && /\.(jpg|jpeg|png|webp|gif)$/i.test(k);
    }).length;
  }
  res.json({ total });
});

/* ── LIST PHOTOS ── */
router.get('/:season', async (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  try {
    const items = await listR2Objects(`photos/${season}/`);
    /* Filter only direct image files (not .thumbs) */
    const imgItems = items.filter(o => {
      const k = o.Key;
      return !k.includes('.thumbs') && /\.(jpg|jpeg|png|webp|gif)$/i.test(k);
    });

    const files = await Promise.all(imgItems.map(async o => {
      const filename = path.basename(o.Key);
      const thumbUrl = await ensureThumb(season, filename);
      return {
        filename,
        url: `/photos/${season}/${filename}`,
        thumb: thumbUrl || `/photos/${season}/${filename}`,
        uploadedAt: o.LastModified ? o.LastModified.toISOString() : new Date().toISOString()
      };
    }));
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ season, photos: files, count: files.length });
  } catch (err) {
    console.error('[PHOTOS LIST]', err.message);
    res.json({ photos: [], count: 0 });
  }
});

/* ── UPLOAD ── */
const uploadRouter = require('express').Router();

uploadRouter.post('/:season', authLimiter, uploadLimiter, requirePin, upload.array('photos', 20), async (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });

  /* Check capacity */
  try {
    const items = await listR2Objects(`photos/${season}/`);
    const cnt = items.filter(o => !o.Key.includes('.thumbs') && /\.(jpg|jpeg|png|webp|gif)$/i.test(o.Key)).length;
    if (cnt >= MAX_PER_SEASON) return res.status(400).json({ error: 'Season storage full.' });
  } catch {}

  if (!req.files?.length) return res.status(400).json({ error: 'No files received.' });

  const results = [];
  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = uuidv4() + ext;
    const key = `photos/${season}/${filename}`;
    await uploadToR2(key, file.buffer, file.mimetype);
    const url = `/photos/${season}/${filename}`;
    results.push({ filename, url, size: file.size });

    /* Fire-and-forget thumbnail generation */
    ensureThumb(season, filename, file.buffer).catch(() => {});
  }
  res.json({ success: true, uploaded: results });
});

/* ── DELETE ── */
router.delete('/:season/:filename', authLimiter, async (req, res) => {
  const { season, filename } = req.params;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  if (!/^[a-zA-Z0-9_\-]{1,255}\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return res.status(400).json({ error: 'Invalid filename' });

  const key = `photos/${season}/${filename}`;
  try {
    await deleteFromR2(key);
    /* Also delete thumbnail */
    deleteFromR2(`photos/.thumbs/${season}/${filename}`).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    console.error('[PHOTO DELETE]', err.message);
    res.status(500).json({ error: 'Delete failed.' });
  }
});

module.exports = { photosRouter: router, uploadRouter };
