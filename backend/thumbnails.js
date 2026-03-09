const path  = require('path');
const fsp   = require('fs').promises;
const sharp = require('sharp');
const { PHOTOS_DIR, THUMBS_DIR, THUMB_WIDTH, THUMB_QUALITY } = require('./config');

/* Limit sharp to prevent pixel-bomb DoS attacks */
sharp.concurrency(1);
sharp.cache(false);
const MAX_INPUT_PIXELS = 100_000_000; // ~10000x10000 max

async function ensureThumb(season, filename) {
  const thumbDir  = path.join(THUMBS_DIR, season);
  const thumbPath = path.join(thumbDir, filename);
  const origPath  = path.join(PHOTOS_DIR, season, filename);

  // Security: ensure paths stay within expected directories
  if (!thumbPath.startsWith(THUMBS_DIR) || !origPath.startsWith(PHOTOS_DIR)) return null;

  try {
    await fsp.access(thumbPath);
    return `/photos/.thumbs/${season}/${filename}`;
  } catch {
    // Thumb doesn't exist yet — generate it
  }

  try {
    await fsp.mkdir(thumbDir, { recursive: true });
    await sharp(origPath, { limitInputPixels: MAX_INPUT_PIXELS })
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toFile(thumbPath);
    return `/photos/.thumbs/${season}/${filename}`;
  } catch {
    return null;
  }
}

module.exports = ensureThumb;
