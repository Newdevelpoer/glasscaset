const router = require('express').Router();
const path   = require('path');
const { VALID_SEASONS, VALID_VIDEO } = require('../config');
const { listR2Objects } = require('../r2');

function getVideoMime(ext) {
  if (ext === '.webm') return 'video/webm';
  if (ext === '.ogg') return 'video/ogg';
  return 'video/mp4';
}

/* ── GET all videos: /api/videos ── */
router.get('/videos', async (req, res) => {
  const result = {};
  for (const season of VALID_SEASONS) {
    result[season] = null;
    try {
      const items = await listR2Objects(`videos/${season}/`);
      const videoItems = items.filter(o => {
        const ext = path.extname(o.Key).toLowerCase();
        return VALID_VIDEO.has(ext) && !path.basename(o.Key).startsWith('.');
      });
      if (videoItems.length) {
        const chosen = path.basename(videoItems[0].Key);
        result[season] = {
          url: `/videos/${season}/${chosen}`,
          type: getVideoMime(path.extname(chosen).toLowerCase())
        };
      }
    } catch {}
  }
  res.json(result);
});

/* ── GET single season video: /api/video/:season ── */
router.get('/video/:season', async (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  try {
    const items = await listR2Objects(`videos/${season}/`);
    const videoItems = items.filter(o => {
      const ext = path.extname(o.Key).toLowerCase();
      return VALID_VIDEO.has(ext) && !path.basename(o.Key).startsWith('.');
    });
    if (!videoItems.length) return res.json({ video: null });
    const chosen = path.basename(videoItems[0].Key);
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
