/* ═══════════════════════════════════════════════════
   COMMON.JS — shared utilities
═══════════════════════════════════════════════════ */
(function () {

  /* ── Detect touch / desktop for cursor ── */
  function initCursorMode() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) {
      document.body.classList.add('desktop');
    }
  }

  /* ── Ripple effect on elements with class ripR ── */
  function initRipples() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.ripR');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const sp = document.createElement('span');
      sp.className = 'rpl';
      const sz = Math.max(rect.width, rect.height) * 2;
      sp.style.cssText = 'width:'+sz+'px;height:'+sz+'px;left:'+(e.clientX-rect.left-sz/2)+'px;top:'+(e.clientY-rect.top-sz/2)+'px';
      btn.appendChild(sp);
      setTimeout(function() { if(sp.parentNode) sp.remove(); }, 600);
    });
  }

  /* ── Scroll progress bar + nav scroll state ── */
  function initProgress() {
    const prog = document.getElementById('prog');
    const nav  = document.getElementById('nav');
    if (!prog) return;
    function onScroll() {
      const h = document.body.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
      if (nav) nav.classList.toggle('sc', window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Scroll reveal via IntersectionObserver ── */
  function initReveal() {
    const io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.rv, .rvl, .rvr').forEach(function(el) { io.observe(el); });
  }

  /* ── Floating background bubbles ── */
  function initBubbles() {
    const bg = document.getElementById('bubblebg');
    if (!bg) return;
    const COLS = ['#CDBADB','#FFC6DD','#FFAECC','#BDE0FE','#A2D2FF'];
    for (let i = 0; i < 15; i++) {
      const b = document.createElement('div');
      b.className = 'bub';
      const s = 25 + Math.random() * 100;
      b.style.cssText = 'width:'+s+'px;height:'+s+'px;left:'+(Math.random()*100)+'%;background:'+COLS[i%COLS.length]+';animation-duration:'+(14+Math.random()*18)+'s;animation-delay:'+(-Math.random()*20)+'s';
      bg.appendChild(b);
    }
  }

  /* ── Horizontal drag-scroll for strip ── */
  function initDragScroll(id) {
    const el = document.getElementById(id);
    if (!el) return;
    let dn=false, sx, sl;
    el.addEventListener('mousedown',  function(e) { dn=true; sx=e.pageX-el.offsetLeft; sl=el.scrollLeft; el.style.cursor='grabbing'; });
    el.addEventListener('mouseleave', function() { dn=false; el.style.cursor=''; });
    el.addEventListener('mouseup',    function() { dn=false; el.style.cursor=''; });
    el.addEventListener('mousemove',  function(e) {
      if(!dn) return; e.preventDefault();
      el.scrollLeft = sl - (e.pageX - el.offsetLeft - sx) * 1.3;
    });
  }

  /* ── Hamburger nav (shared across pages) ── */
  function initHamburger() {
    const ham = document.getElementById('navHam');
    const drawer = document.getElementById('navDrawer');
    if (!ham || !drawer) return;

    ham.addEventListener('click', function() {
      const isOpen = drawer.classList.toggle('open');
      ham.classList.toggle('open', isOpen);
      ham.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        drawer.classList.remove('open');
        ham.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Init all ── */
  document.addEventListener('DOMContentLoaded', function() {
    initCursorMode();
    initRipples();
    initProgress();
    initReveal();
    initBubbles();
    initDragScroll('srow');
    initHamburger();
    fetchAndUpdatePhotoCount();
    // Register service worker — force unregister stale SW first so code changes take effect immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        var unregistrations = regs.map(function(r) { return r.unregister(); });
        return Promise.all(unregistrations);
      }).then(function() {
        navigator.serviceWorker.register('/sw.js?v=3').catch(function() {});
      }).catch(function() {
        navigator.serviceWorker.register('/sw.js?v=3').catch(function() {});
      });
    }
  });

  /* ── Dynamic photo count — fetches total and fills all [data-photo-count] elements ── */
  function fetchAndUpdatePhotoCount() {
    fetch('/api/photos/total')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var n = d.total || 0;
        document.querySelectorAll('[data-photo-count]').forEach(function(el) {
          var tpl = el.getAttribute('data-photo-count');
          el.textContent = tpl.replace('{n}', n);
        });
        // Update the stat card count-up target
        var statNum = document.querySelector('.photo-stat');
        if (statNum) statNum.setAttribute('data-to', String(n));
        // Update meta tags too
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', metaDesc.getAttribute('content').replace(/\d+ photographs/g, n + ' photographs'));
        var ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', ogDesc.getAttribute('content').replace(/\d+ photographs/g, n + ' photographs'));
        window.HU._totalPhotos = n;
      })
      .catch(function() {});
  }

  /* expose */
  window.HU = window.HU || {};
  window.HU.initReveal = initReveal;
  window.HU.refreshPhotoCount = fetchAndUpdatePhotoCount;
  window.closeNav = function() {
    var drawer = document.getElementById('navDrawer');
    var ham = document.getElementById('navHam');
    if(drawer) drawer.classList.remove('open');
    if(ham) { ham.classList.remove('open'); ham.setAttribute('aria-expanded','false'); }
    document.body.style.overflow = '';
  };
})();
