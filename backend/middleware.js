const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const compression = require('compression');
const morgan     = require('morgan');
const crypto     = require('crypto');
const { PUBLIC_DIR, UPLOAD_PIN, R2_PUBLIC_URL } = require('./config');

/* Extract R2 domain for CSP */
const r2Origin = R2_PUBLIC_URL ? new URL(R2_PUBLIC_URL).origin : '';

/* ── Apply all middleware to an Express app ── */
function applyMiddleware(app) {

  /* GZIP / BROTLI */
  app.use(compression({ level: 6, threshold: 1024 }));

  /* REQUEST LOGGING */
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  /* CORS */
  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Upload-Pin'],
    maxAge: 86400,
  }));

  /* SECURITY HEADERS */
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        workerSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        imgSrc:     ["'self'", 'data:', 'blob:', r2Origin].filter(Boolean),
        mediaSrc:   ["'self'", 'blob:', r2Origin].filter(Boolean),
        connectSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        frameSrc:   ["'none'"],
        objectSrc:  ["'none'"],
        baseUri:    ["'self'"],
        formAction: ["'self'"],
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  /* Extra security headers */
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  /* GLOBAL RATE LIMITER — skip media proxy paths */
  app.use(rateLimit({
    windowMs: 15*60*1000, max: 1000, standardHeaders: true, legacyHeaders: false,
    skip: (req) => req.path.startsWith('/photos/') || req.path.startsWith('/videos/')
  }));

  /* JSON PARSER */
  app.use(express.json({ limit: '1mb' }));

  /* STATIC FILES */
  app.use(express.static(PUBLIC_DIR, {
    etag: true,
    lastModified: true,
    setHeaders(res, fp) {
      if (/\.(js|css)$/.test(fp))                       res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(fp))  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else if (/\.(mp4|webm|mov|ogg)$/i.test(fp))       res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else if (/\.(woff2?|ttf|otf|eot)$/i.test(fp))     res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
}

/* ── Focused rate limiters (exported for route use) ── */
const uploadLimiter = rateLimit({
  windowMs: 15*60*1000, max: 40,
  message: { error: 'Upload limit reached. Try again in 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15*60*1000, max: 5,
  message: { error: 'Too many failed attempts. Locked for 15 minutes.' }
});

/* ── Constant-time string comparison (prevents timing attacks) ── */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to burn the same time, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/* ── PIN guard middleware ── */
function requirePin(req, res, next) {
  const pin = req.headers['x-upload-pin'] || req.body?.pin;
  if (!pin || !safeCompare(pin, UPLOAD_PIN)) return res.status(401).json({ error: 'Wrong PIN.' });
  next();
}

module.exports = { applyMiddleware, uploadLimiter, authLimiter, requirePin };
