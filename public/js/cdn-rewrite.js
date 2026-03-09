/* cdn-rewrite.js — Rewrite /photos/ and /videos/ URLs to load directly from R2 CDN
   This MUST run synchronously before images are parsed by the browser.
   Include this script WITHOUT defer/async in <head>. */
(function () {
  var CDN = 'https://pub-99ed6b790de84467a3b4484443e81c79.r2.dev';

  function rewrite(el) {
    var src = el.getAttribute('src');
    if (src && (src.startsWith('/photos/') || src.startsWith('/videos/'))) {
      el.setAttribute('src', CDN + src);
    }
    /* Also handle poster attributes on video elements */
    var poster = el.getAttribute('poster');
    if (poster && (poster.startsWith('/photos/') || poster.startsWith('/videos/'))) {
      el.setAttribute('poster', CDN + poster);
    }
  }

  /* Rewrite elements already in the DOM */
  function rewriteAll() {
    var els = document.querySelectorAll('img[src^="/photos/"], img[src^="/videos/"], video[src^="/photos/"], video[src^="/videos/"], source[src^="/photos/"], source[src^="/videos/"], video[poster^="/photos/"], video[poster^="/videos/"]');
    for (var i = 0; i < els.length; i++) rewrite(els[i]);
  }

  /* Watch for new elements being added to the DOM */
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var nodes = mutations[m].addedNodes;
        for (var n = 0; n < nodes.length; n++) {
          var node = nodes[n];
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'IMG' || node.tagName === 'VIDEO' || node.tagName === 'SOURCE') {
            rewrite(node);
          }
          /* Also check children of the added node */
          if (node.querySelectorAll) {
            var kids = node.querySelectorAll('img, video, source');
            for (var k = 0; k < kids.length; k++) rewrite(kids[k]);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* Also rewrite on DOMContentLoaded as a safety net */
  document.addEventListener('DOMContentLoaded', rewriteAll);

  /* And rewrite immediately for any elements already parsed */
  rewriteAll();
})();
