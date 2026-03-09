const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { VALID_SEASONS, ALLOWED_MIME, ALLOWED_EXT, MAX_FILE_MB, PHOTOS_DIR } = require('./config');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const season = req.params.season;
    if (!VALID_SEASONS.has(season)) return cb(new Error('Invalid season'));
    const dir = path.join(PHOTOS_DIR, season);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error('Invalid file type'));
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    ALLOWED_MIME.has(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed'));
  },
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 20 }
});

module.exports = upload;
