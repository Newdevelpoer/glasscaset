/* ═══════════════════════════════════════════════════
   PRELOADER.JS — Preloads critical assets, then reveals page
   Shows loading screen while caching images, fonts, videos
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var preloader = document.getElementById('preloader');
  var bar       = document.querySelector('.pl-bar');
  if (!preloader || !bar) return;

  var loaded = 0;
  var total  = 0;

  function updateProgress() {
    loaded++;
    var pct = total > 0 ? Math.min((loaded / total) * 100, 100) : 100;
    bar.style.width = pct + '%';
    if (loaded >= total) finish();
  }

  function finish() {
    bar.style.width = '100%';
    setTimeout(function () {
      preloader.classList.add('done');
      // Remove from DOM after transition
      setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 700);
    }, 300);
  }

  function preloadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () {
        updateProgress();
        resolve();
      };
      img.src = src;
    });
  }

  function preloadVideo(src) {
    return new Promise(function (resolve) {
      var vid = document.createElement('video');
      vid.preload = 'auto';
      vid.muted = true;
      vid.oncanplaythrough = vid.onerror = function () {
        updateProgress();
        resolve();
      };
      vid.src = src;
      // Timeout fallback — don't block loading forever
      setTimeout(function () {
        updateProgress();
        resolve();
      }, 8000);
    });
  }

  function run() {
    // Collect all images already in the page
    var pageImages = Array.prototype.slice.call(document.querySelectorAll('img[src]'));
    var imageSrcs = pageImages.map(function (img) { return img.src; });

    // Collect all video sources in the page
    var pageVideos = Array.prototype.slice.call(document.querySelectorAll('video source[src], video[src]'));
    var videoSrcs = pageVideos.map(function (v) { return v.src; }).filter(Boolean);

    // De-duplicate
    var seen = {};
    imageSrcs = imageSrcs.filter(function (s) { if (seen[s]) return false; seen[s] = 1; return true; });
    videoSrcs = videoSrcs.filter(function (s) { if (seen[s]) return false; seen[s] = 1; return true; });

    total = imageSrcs.length + videoSrcs.length;
    if (total === 0) { finish(); return; }

    var promises = [];
    imageSrcs.forEach(function (src) { promises.push(preloadImage(src)); });
    videoSrcs.forEach(function (src) { promises.push(preloadVideo(src)); });

    // Safety timeout — never block more than 12 seconds
    setTimeout(finish, 12000);
  }

  // Start preloading once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
