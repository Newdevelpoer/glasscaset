/**
 * migrate-to-r2.js  —  One-time script to upload local photos + videos to Cloudflare R2
 *
 * Usage: node migrate-to-r2.js
 *
 * Uploads everything from:
 *   public/photos/{season}/*   →  R2: photos/{season}/*
 *   public/videos/{season}/*   →  R2: videos/{season}/*
 */
require('dotenv').config();

const fs   = require('fs');
const fsp  = require('fs').promises;
const path = require('path');
const { VALID_SEASONS, PHOTOS_DIR, VIDEOS_DIR } = require('./backend/config');
const { uploadToR2, existsInR2 } = require('./backend/r2');

const PHOTO_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.ogg']);

function getMimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.ogg': 'video/ogg'
  };
  return map[ext] || 'application/octet-stream';
}

async function uploadDir(localDir, r2Prefix, allowedExts) {
  for (const season of VALID_SEASONS) {
    const dir = path.join(localDir, season);
    if (!fs.existsSync(dir)) { console.log(`  ⏭  ${season}/ — not found, skipping`); continue; }

    const files = await fsp.readdir(dir);
    const filtered = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return allowedExts.has(ext) && !f.startsWith('.');
    });

    console.log(`\n  📂 ${season}/ — ${filtered.length} files`);

    for (let i = 0; i < filtered.length; i++) {
      const file = filtered[i];
      const key = `${r2Prefix}/${season}/${file}`;
      const localPath = path.join(dir, file);

      /* Skip if already uploaded */
      if (await existsInR2(key)) {
        process.stdout.write(`    ✓ [${i+1}/${filtered.length}] ${file} (exists)\n`);
        continue;
      }

      const buffer = await fsp.readFile(localPath);
      const ext = path.extname(file).toLowerCase();
      await uploadToR2(key, buffer, getMimeType(ext));
      process.stdout.write(`    ⬆ [${i+1}/${filtered.length}] ${file} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)\n`);
    }
  }
}

async function main() {
  console.log('\n🚀 Migrating local files to Cloudflare R2...\n');

  console.log('📸 Uploading photos...');
  await uploadDir(PHOTOS_DIR, 'photos', PHOTO_EXTS);

  console.log('\n\n🎥 Uploading videos...');
  await uploadDir(VIDEOS_DIR, 'videos', VIDEO_EXTS);

  console.log('\n\n✅ Migration complete!\n');
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
