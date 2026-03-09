const path = require('path');

const ROOT_DIR   = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PHOTOS_DIR = path.join(PUBLIC_DIR, 'photos');
const THUMBS_DIR = path.join(PHOTOS_DIR, '.thumbs');
const VIDEOS_DIR = path.join(PUBLIC_DIR, 'videos');

/* Validate SITE_URL at startup to prevent injection in SEO routes */
const rawSiteUrl = (process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');
try { new URL(rawSiteUrl); } catch {
  console.error('[CONFIG] Invalid SITE_URL:', rawSiteUrl);
  process.exit(1);
}

module.exports = {
  PORT:           process.env.PORT || 3000,
  UPLOAD_PIN:     process.env.UPLOAD_PIN    || 'sunshine2026',
  MAX_FILE_MB:    parseInt(process.env.MAX_FILE_MB    || '15'),
  MAX_PER_SEASON: parseInt(process.env.MAX_PER_SEASON || '500'),
  SITE_URL:       rawSiteUrl,

  VALID_SEASONS:  new Set(['spring','summer','monsoon','autumn','winter','golden']),
  ALLOWED_MIME:   new Set(['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ALLOWED_EXT:    new Set(['.jpg','.jpeg','.png','.webp','.gif']),
  VALID_VIDEO:    new Set(['.mp4','.webm','.mov','.ogg']),

  THUMB_WIDTH:   400,
  THUMB_QUALITY: 80,

  /* Cloudflare R2 */
  R2_ACCOUNT_ID:       process.env.ACCOUNT_ID        || '',
  R2_ACCESS_KEY_ID:    process.env.ACCESS_KEY_ID      || '',
  R2_SECRET_ACCESS_KEY:process.env.SECRET_ACCESS_KEY_ID || '',
  R2_BUCKET_NAME:      process.env.R2_BUCKET_NAME     || 'glasscaset',
  R2_PUBLIC_URL:       (process.env.R2_PUBLIC_URL      || '').replace(/\/+$/, ''),

  ROOT_DIR,
  PUBLIC_DIR,
  PHOTOS_DIR,
  THUMBS_DIR,
  VIDEOS_DIR,
};

