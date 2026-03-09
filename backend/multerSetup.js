const multer = require('multer');
const path   = require('path');
const { ALLOWED_MIME, ALLOWED_EXT, MAX_FILE_MB } = require('./config');

/* Memory storage — files go to req.files[].buffer for R2 upload */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error('Invalid file type'));
    ALLOWED_MIME.has(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed'));
  },
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 20 }
});

module.exports = upload;
