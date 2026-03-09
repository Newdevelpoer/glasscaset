const router = require('express').Router();
const path   = require('path');
const fs     = require('fs');
const { VALID_SEASONS, VIDEOS_DIR, VALID_VIDEO } = require('../config');

function getVideoMime(ext) {
  if (ext === '.webm') return 'video/webm';
  if (ext === '.ogg') return 'video/ogg';
  return 'video/mp4';
}

/* ── GET all videos: /api/videos ── */
router.get('/videos', (req, res) => {
  const result = {};
  VALID_SEASONS.forEach(season => {
    const dir = path.join(VIDEOS_DIR, season);
    result[season] = null;
    if (!fs.existsSync(dir)) return;
    try {
      const files = fs.readdirSync(dir)
        .filter(f => VALID_VIDEO.has(path.extname(f).toLowerCase()) && !f.startsWith('.'));
      if (files.length) {
        const chosen = files[0];
        result[season] = {
          url: `/videos/${season}/${chosen}`,
          type: getVideoMime(path.extname(chosen).toLowerCase())
        };
      }
    } catch {}
  });
  res.json(result);
});

/* ── GET single season video: /api/video/:season ── */
router.get('/video/:season', (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  const dir = path.join(VIDEOS_DIR, season);
  if (!fs.existsSync(dir)) return res.json({ video: null });
  try {
    const files = fs.readdirSync(dir)
      .filter(f => VALID_VIDEO.has(path.extname(f).toLowerCase()) && !f.startsWith('.'));
    if (!files.length) return res.json({ video: null });
    const chosen = files[0];
    res.json({
      video: `/videos/${season}/${chosen}`,
      filename: chosen,
      type: getVideoMime(path.extname(chosen).toLowerCase())
    });
  } catch {
    res.json({ video: null });
  }
});

module.exports = router;
