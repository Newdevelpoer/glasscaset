#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   BUILD-ASSETS.JS — One-time script to:
   1. Generate 400px-wide thumbnails for all photos
   2. Moderately compress videos (CRF 23, keep 720p+)
   Run: node build-assets.js
═══════════════════════════════════════════════════ */
const fs   = require('fs');
const fsp  = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const PHOTOS_DIR = path.join(__dirname, 'public', 'photos');
const THUMBS_DIR = path.join(__dirname, 'public', 'photos', '.thumbs');
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 80;

const SEASONS = ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'golden'];
const IMG_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;
const VID_EXT = /\.(mp4|webm|mov|ogg)$/i;

async function generateThumbnails() {
  console.log('\n📸 Generating thumbnails...\n');
  let created = 0, skipped = 0, failed = 0;

  for (const season of SEASONS) {
    const srcDir   = path.join(PHOTOS_DIR, season);
    const thumbDir = path.join(THUMBS_DIR, season);

    if (!fs.existsSync(srcDir)) { console.log(`  ⏭  ${season}/ — no folder`); continue; }

    await fsp.mkdir(thumbDir, { recursive: true });
    const files = (await fsp.readdir(srcDir)).filter(f => IMG_EXT.test(f));
    console.log(`  🌸 ${season}/ — ${files.length} images`);

    for (const file of files) {
      const thumbPath = path.join(thumbDir, file);
      const srcPath   = path.join(srcDir, file);

      if (fs.existsSync(thumbPath)) { skipped++; continue; }

      try {
        await sharp(srcPath)
          .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
          .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
          .toFile(thumbPath);
        created++;
        process.stdout.write(`    ✅ ${file}\n`);
      } catch (e) {
        failed++;
        process.stdout.write(`    ❌ ${file} — ${e.message}\n`);
      }
    }
  }

  console.log(`\n  Done: ${created} created, ${skipped} skipped, ${failed} failed\n`);
}

async function compressVideos() {
  console.log('\n🎬 Compressing videos...\n');

  let ffmpeg, ffmpegPath;
  try {
    ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    ffmpeg = require('fluent-ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegPath);
  } catch {
    console.log('  ⚠️  fluent-ffmpeg or @ffmpeg-installer/ffmpeg not installed — skipping video compression');
    console.log('  Run: npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg\n');
    return;
  }

  for (const season of SEASONS) {
    const dir = path.join(VIDEOS_DIR, season);
    if (!fs.existsSync(dir)) continue;

    const files = (await fsp.readdir(dir)).filter(f => VID_EXT.test(f) && !f.startsWith('.') && !f.includes('_compressed'));

    for (const file of files) {
      const srcPath  = path.join(dir, file);
      const ext      = path.extname(file);
      const base     = path.basename(file, ext);
      const outPath  = path.join(dir, base + '_compressed' + ext);

      if (fs.existsSync(outPath)) { console.log(`  ⏭  ${season}/${file} — already compressed`); continue; }

      const srcStat = await fsp.stat(srcPath);
      const srcMB   = (srcStat.size / (1024 * 1024)).toFixed(1);
      console.log(`  🎬 ${season}/${file} (${srcMB} MB) — compressing...`);

      await new Promise((resolve, reject) => {
        ffmpeg(srcPath)
          .videoCodec('libx264')
          .addOption('-crf', '23')          // moderate quality (18=near-lossless, 28=visible)
          .addOption('-preset', 'slow')     // better compression ratio
          .addOption('-movflags', '+faststart')  // web-optimized (moov atom at start)
          .audioCodec('aac')
          .audioBitrate('128k')
          .on('end', async () => {
            const outStat = await fsp.stat(outPath);
            const outMB = (outStat.size / (1024 * 1024)).toFixed(1);
            const savings = ((1 - outStat.size / srcStat.size) * 100).toFixed(0);
            console.log(`    ✅ ${outMB} MB (${savings}% smaller)`);

            // Replace original with compressed version
            await fsp.rename(srcPath, srcPath + '.original');
            await fsp.rename(outPath, srcPath);
            console.log(`    📁 Original backed up as ${file}.original`);
            resolve();
          })
          .on('error', (err) => {
            console.log(`    ❌ ${err.message}`);
            // Clean up failed output
            fsp.unlink(outPath).catch(() => {});
            resolve(); // don't stop the whole process
          })
          .save(outPath);
      });
    }
  }

  console.log('\n  Video compression done!\n');
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Her Universe — Asset Build Script');
  console.log('═══════════════════════════════════════');

  await generateThumbnails();
  await compressVideos();

  console.log('✨ All done!\n');
}

main().catch(e => { console.error(e); process.exit(1); });
