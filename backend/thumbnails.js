const sharp = require('sharp');
const { THUMB_WIDTH, THUMB_QUALITY } = require('./config');
const { uploadToR2, getR2Buffer, existsInR2 } = require('./r2');

/* Limit sharp to prevent pixel-bomb DoS attacks */
sharp.concurrency(1);
sharp.cache(false);
const MAX_INPUT_PIXELS = 100_000_000; // ~10000x10000 max

/**
 * Ensure a thumbnail exists in R2.
 * @param {string} season
 * @param {string} filename
 * @param {Buffer} [sourceBuffer] — optional, if we already have the source in memory
 * @returns {string|null} public thumb URL or null
 */
async function ensureThumb(season, filename, sourceBuffer) {
  const thumbKey = `photos/.thumbs/${season}/${filename}`;

  /* Already generated? */
  if (await existsInR2(thumbKey)) {
    return `/photos/.thumbs/${season}/${filename}`;
  }

  try {
    /* Get source buffer from R2 if not provided */
    const buf = sourceBuffer || await getR2Buffer(`photos/${season}/${filename}`);

    const thumbBuf = await sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS })
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toBuffer();

    await uploadToR2(thumbKey, thumbBuf, 'image/jpeg');
    return `/photos/.thumbs/${season}/${filename}`;
  } catch {
    return null;
  }
}

module.exports = ensureThumb;
