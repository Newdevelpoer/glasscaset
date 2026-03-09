const router = require('express').Router();
const path   = require('path');
const { PUBLIC_DIR } = require('../config');

/* ── Clean URL routes ── */
router.get('/',         (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
router.get('/gallery',  (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'gallery.html')));
router.get('/about',    (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'about.html')));
router.get('/birthday', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'birthday.html')));

module.exports = router;
