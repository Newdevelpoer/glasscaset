/* ═══════════════════════════════════════════════════
   SERVICE WORKER — Her Universe
   Cache-first for assets, network-first for HTML/API
═══════════════════════════════════════════════════ */
var CACHE_NAME = 'her-universe-v8';

var PRECACHE = [
  '/',
  '/gallery',
  '/about',
  '/birthday',
  '/css/base.css',
  '/css/home.css',
  '/css/gallery.css',
  '/css/about.css',
  '/css/birthday.css',
  '/css/upload.css',
  '/css/btn-hover.css',
  '/css/preloader.css',
  '/js/cursor.js',
  '/js/common.js',
  '/js/home.js',
  '/js/countdown.js',
  '/js/gallery.js',
  '/js/seasons.js',
  '/js/upload.js',
  '/js/about.js',
  '/js/birthday-page.js',
  '/js/btn-hover.js',
  '/js/preloader.js'
];

/* ── INSTALL: precache critical assets ── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: clean old caches ── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── FETCH: strategy per resource type ── */
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Skip non-GET
  if (e.request.method !== 'GET') return;

  // Skip external origins (fonts, CDNs) — let browser handle them directly
  if (url.origin !== self.location.origin) return;

  // API calls — network only (fresh data)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Photos, videos, thumbs — cache-first, persist with eviction
  if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|ogg)$/i) ||
      url.pathname.startsWith('/photos/') ||
      url.pathname.startsWith('/videos/')) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        if (cached) return cached;
        return fetch(e.request).then(function (res) {
          // Never cache partial (206) responses — video range requests
          if (res.ok && res.status !== 206) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) {
              c.put(e.request, clone);
              // Evict oldest entries if cache grows too large
              c.keys().then(function (keys) {
                var MAX_MEDIA_CACHE = 200;
                if (keys.length > MAX_MEDIA_CACHE) {
                  var toDelete = keys.length - MAX_MEDIA_CACHE;
                  for (var i = 0; i < toDelete; i++) { c.delete(keys[i]); }
                }
              });
            });
          }
          return res;
        });
      })
    );
    return;
  }

  // CSS, JS, fonts — network-first so code changes are always picked up
  if (url.pathname.match(/\.(css|js|woff2?|ttf|otf|eot)$/i)) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res.ok && res.status !== 206) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // HTML pages — network-first, fallback to cache
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok && res.status !== 206) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(e.request, clone); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function(cached) {
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      });
    })
  );
});
