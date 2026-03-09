/* ═══════════════════════════════════════════════════
   GALLERY.JS  —  All photos from local /api/photos/:season
   Uploads merge seamlessly into the same grid
═══════════════════════════════════════════════════ */
(function () {

  const SEASONS = [
    { id:'spring',  num:'01 / 06', name:'Spring Whispers',   sub:'Soft · Tender · Full of Promise',            acc:'linear-gradient(90deg,#FFC6DD,#FFAECC)', emoji:'🌸🌷🦋', hero:'/photos/spring/_hero.jpg' },
    { id:'summer',  num:'02 / 06', name:'Summer Radiance',   sub:'Warm · Luminous · Sun-kissed',               acc:'linear-gradient(90deg,#ffe066,#ff9640)',   emoji:'☀️🌻🌈', hero:'/photos/summer/_hero.jpg' },
    { id:'monsoon', num:'03 / 06', name:'Monsoon Romance',   sub:'Dreamy · Petrichor · Magic in the Rain',     acc:'linear-gradient(90deg,#BDE0FE,#A2D2FF)',   emoji:'🌧️🌈🍃', hero:'/photos/monsoon/_hero.jpg' },
    { id:'autumn',  num:'04 / 06', name:'Autumn Grace',      sub:'Golden · Transitions · Breathtaking',        acc:'linear-gradient(90deg,#ffb347,#e8643a)',   emoji:'🍂🍁🌾', hero:'/photos/autumn/_hero.jpg' },
    { id:'winter',  num:'05 / 06', name:'Winter Glow',       sub:'Still · Warmth in Cold · She is the Light',  acc:'linear-gradient(90deg,#A2D2FF,#e0f4ff)',  emoji:'❄️⛄🌨️', hero:'/photos/winter/_hero.jpg' },
    { id:'golden',  num:'06 / 06', name:'Golden Hour',       sub:'Perfect Light · Her Magic Hour · Always',    acc:'linear-gradient(90deg,#FFAECC,#CDBADB,#A2D2FF)', emoji:'✨🌅💛', hero:'/photos/golden/_hero.jpg' }
  ];

  /* Fallback hero videos used when no local _hero.jpg exists */
  const HERO_FALLBACK_VIDEOS = {
    spring:  '/videos/spring/Cherry_blossom_tree_falling_petals_delpmaspu_.mp4',
    summer:  '/videos/summer/Clover_field_looking_up_sky_delpmaspu_.mp4',
    monsoon: '/videos/monsoon/Lotus_pond_looking_upward_sky_delpmaspu_.mp4',
    autumn:  '/videos/autumn/Wildflower_meadow_swaying_in_breeze_delpmaspu_.mp4',
    winter:  '/videos/winter/Sunrise_in_rapeseed_field_delpmaspu_.mp4',
    golden:  '/videos/golden/Meadow_with_daisies_and_clouds_delpmaspu_.mp4'
  };

  let curS = -1;
  let overlayEl, seasonCanvas, expView;
  let currentPhotos = []; // cache of current season's photos

  /* ── Fetch photos from server ── */
  async function fetchPhotos(seasonId) {
    try {
      const res  = await fetch('/api/photos/' + seasonId);
      const data = await res.json();
      return data.photos || [];
    } catch (e) {
      return [];
    }
  }

  /* ══════════════════════════════════════════
     PHOTO CARD POPUP — Instagram-style lightbox
     with download + delete
  ══════════════════════════════════════════ */
  var photoCard = {
    overlay: null,
    img: null,
    currentUrl: null,
    currentFilename: null,
    currentSeason: null,
    deleteConfirm: null,
    _bound: false,

    init: function() {
      this.overlay       = document.getElementById('photoCardOverlay');
      this.img           = document.getElementById('photoCardImg');
      this.deleteConfirm = document.getElementById('photoDeleteConfirm');
      if (!this.overlay) return;

      var self = this;

      document.getElementById('photoCardClose').addEventListener('click', function() { self.close(); });
      document.getElementById('photoCardDownload').addEventListener('click', function() { self.download(); });
      document.getElementById('photoCardDelete').addEventListener('click', function() { self.showDeleteConfirm(); });
      document.getElementById('deleteConfirmCancel').addEventListener('click', function() { self.hideDeleteConfirm(); });
      document.getElementById('deleteConfirmYes').addEventListener('click', function() { self.confirmDelete(); });

      /* Close on backdrop click */
      this.overlay.addEventListener('click', function(e) {
        if (e.target === self.overlay) self.close();
      });
      this.deleteConfirm.addEventListener('click', function(e) {
        if (e.target === self.deleteConfirm) self.hideDeleteConfirm();
      });

      /* Escape key */
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          if (self.deleteConfirm.classList.contains('active')) { self.hideDeleteConfirm(); return; }
          if (self.overlay.classList.contains('active')) { self.close(); }
        }
      });

      this._bound = true;
    },

    open: function(url, filename, season) {
      if (!this._bound) return;
      this.currentUrl = url;
      this.currentFilename = filename;
      this.currentSeason = season;
      this.img.src = url;
      this.overlay.classList.remove('closing');
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    close: function() {
      var self = this;
      this.overlay.classList.add('closing');
      this.overlay.classList.remove('active');
      setTimeout(function() {
        self.overlay.classList.remove('closing');
        self.img.src = '';
        self.currentUrl = null;
        self.currentFilename = null;
        self.currentSeason = null;
        document.body.style.overflow = '';
      }, 350);
    },

    download: function() {
      if (!this.currentUrl) return;
      var a = document.createElement('a');
      a.href = this.currentUrl;
      a.download = this.currentFilename || 'photo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    showDeleteConfirm: function() {
      this.deleteConfirm.classList.remove('closing');
      this.deleteConfirm.classList.add('active');
    },

    hideDeleteConfirm: function() {
      var self = this;
      this.deleteConfirm.classList.add('closing');
      this.deleteConfirm.classList.remove('active');
      setTimeout(function() { self.deleteConfirm.classList.remove('closing'); }, 300);
    },

    confirmDelete: function() {
      var self = this;
      var season = this.currentSeason;
      var filename = this.currentFilename;
      if (!season || !filename) return;

      /* Silently use stored PIN — no popup needed */
      var pin = window.UploadManager ? UploadManager.getPin() : null;
      var headers = {};
      if (pin) headers['X-Upload-Pin'] = pin;

      var btn = document.getElementById('deleteConfirmYes');
      btn.textContent = 'Deleting…';
      btn.disabled = true;

      fetch('/api/photos/' + encodeURIComponent(season) + '/' + encodeURIComponent(filename), {
        method: 'DELETE',
        headers: headers
      })
      .then(function(res) { return res.json().then(function(d) { return { ok: res.ok, data: d }; }); })
      .then(function(result) {
        btn.textContent = 'Delete';
        btn.disabled = false;

        if (result.ok && result.data.success) {
          /* Remove from DOM */
          var item = document.querySelector('.pitem[data-filename="' + CSS.escape(filename) + '"]');
          if (item) {
            item.style.transition = 'opacity .3s, transform .3s';
            item.style.opacity = '0';
            item.style.transform = 'scale(.8)';
            setTimeout(function() { item.remove(); }, 300);
          }

          /* Update count */
          var metaEl = document.getElementById('emeta');
          if (metaEl) {
            var remaining = document.querySelectorAll('.pitem').length - 1;
            metaEl.textContent = remaining + ' photograph' + (remaining !== 1 ? 's' : '');
          }

          /* Update currentPhotos cache */
          currentPhotos = currentPhotos.filter(function(p) { return p.filename !== filename; });

          self.hideDeleteConfirm();
          self.close();
        } else {
          alert(result.data.error || 'Delete failed. Please try again.');
        }
      })
      .catch(function() {
        btn.textContent = 'Delete';
        btn.disabled = false;
        alert('Network error. Please try again.');
      });
    }
  };

  /* ── Render photo items into the masonry grid ── */
  function renderPhotos(photos, grid, expView) {
    grid.innerHTML = '';

    if (!photos.length) {
      grid.innerHTML =
        '<div class="empty-season">' +
        '<div class="es-icon">📷</div>' +
        '<p class="es-title">No photos yet</p>' +
        '<p class="es-sub">Be the first to add photos to this season using the Upload button above</p>' +
        '</div>';
      return;
    }

    photos.forEach(function(photo, i) {
      const div = document.createElement('div');
      div.className = 'pitem';
      div.dataset.filename = photo.filename;

      const img = document.createElement('img');
      img.src     = photo.url;
      img.alt     = 'Photo ' + (i + 1);
      img.loading = 'lazy';

      div.appendChild(img);
      grid.appendChild(div);
      /* Open photo card on click */
      div.addEventListener('click', function() {
        var season = SEASONS[curS] ? SEASONS[curS].id : '';
        photoCard.open(photo.url, photo.filename, season);
      });    });

    /* Stagger reveal */
    const pio = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('show'); pio.unobserve(e.target); }
      });
    }, { root: expView, rootMargin: '0px 0px 300px 0px', threshold: 0.01 });

    grid.querySelectorAll('.pitem').forEach(function(it, i) {
      it.style.transitionDelay = Math.min(i * 0.03, 0.5) + 's';
      pio.observe(it);
    });
  }

  /* ── Append newly uploaded photos to existing grid ── */
  function appendPhotos(newPhotos, grid, expView) {
    const existing = grid.querySelectorAll('.pitem').length;

    /* Remove empty state if present */
    const empty = grid.querySelector('.empty-season');
    if (empty) empty.remove();

    newPhotos.forEach(function(photo, i) {
      const div = document.createElement('div');
      div.className = 'pitem show'; /* Already visible - no delay needed */
      div.dataset.filename = photo.filename;
      div.style.animation = 'photoAppear .5s cubic-bezier(.22,1,.36,1) forwards';

      const img = document.createElement('img');
      img.src     = photo.url;
      img.alt     = 'Photo ' + (existing + i + 1);
      img.loading = 'lazy';

      div.appendChild(img);
      grid.appendChild(div);
      /* Open photo card on click */
      div.addEventListener('click', function() {
        var season = SEASONS[curS] ? SEASONS[curS].id : '';
        photoCard.open(photo.url, photo.filename, season);
      });    });
  }

  /* ── Build expanded season view ── */
  async function buildExpanded(idx) {
    const s    = SEASONS[idx];
    const grid = document.getElementById('ephotos');

    document.getElementById('enum').textContent  = s.num;
    document.getElementById('ename').textContent = s.name;
    document.getElementById('esub').textContent  = s.sub;
    document.getElementById('ebar').style.background = s.acc;
    document.getElementById('ebigtitle').textContent = s.name;

    /* Hero — try local _hero.jpg first, fall back to season video */
    const heroEl   = document.getElementById('ehimg');
    const heroVid  = document.getElementById('ehvid');
    heroVid.pause();
    heroVid.classList.remove('active');
    heroEl.classList.add('active');
    heroEl.onerror = function() {
      heroEl.onerror = null;
      heroEl.classList.remove('active');
      var vSrc = HERO_FALLBACK_VIDEOS[s.id];
      if (vSrc) {
        heroVid.src = vSrc;
        heroVid.classList.add('active');
        heroVid.play().catch(function(){});
      }
    };
    heroEl.src = s.hero;

    /* Update photo count after fetch */
    document.getElementById('emeta').textContent = 'Loading…';

    /* Wire header upload button */
    const upBtn = document.getElementById('exp-upload-btn');
    if (upBtn) {
      const newBtn = upBtn.cloneNode(true);
      upBtn.parentNode.replaceChild(newBtn, upBtn);
      newBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.UploadManager) UploadManager.openForSeason(s.id);
      });
    }



    /* Show panel */
    expView.classList.add('open');
    expView.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    setTimeout(function() { document.body.style.overflow = ''; expView.style.overflowY = 'auto'; }, 100);

    /* Fetch & render photos */
    grid.innerHTML = '<div class="grid-loading"><div class="gl-dot"></div><div class="gl-dot"></div><div class="gl-dot"></div></div>';
    const photos = await fetchPhotos(s.id);
    currentPhotos = photos;

    document.getElementById('emeta').textContent = photos.length + ' photograph' + (photos.length !== 1 ? 's' : '');
    renderPhotos(photos, grid, expView);

    history.pushState(null, '', '#' + s.id);
    if (window.setCursorSeason) window.setCursorSeason(s.id);

    /* Expose refresh function for upload.js */
    window._refreshSeasonGrid = async function() {
      const fresh = await fetchPhotos(s.id);
      const newOnes = fresh.filter(function(p) {
        return !currentPhotos.find(function(c) { return c.filename === p.filename; });
      });
      currentPhotos = fresh;
      document.getElementById('emeta').textContent = fresh.length + ' photograph' + (fresh.length !== 1 ? 's' : '');
      if (newOnes.length) appendPhotos(newOnes, grid, expView);
    };
  }

  /* ── Open season with canvas animation ── */
  function openS(idx) {
    curS = idx;
    const s = SEASONS[idx];
    overlayEl.querySelector('.ov-num').textContent   = s.num;
    overlayEl.querySelector('.ov-name').textContent  = s.name;
    overlayEl.querySelector('.ov-emoji').textContent = s.emoji;
    SeasonAnimator.cancel();
    SeasonAnimator.play(s.id, overlayEl, function() { buildExpanded(idx); });
  }

  /* ── Close expanded view ── */
  function closeExp() {
    expView.style.opacity = '0';
    expView.style.transform = 'translateY(20px)';
    expView.style.transition = 'opacity .3s, transform .3s';
    setTimeout(function() {
      expView.classList.remove('open');
      expView.style.cssText = '';
      history.pushState(null, '', location.pathname);
    }, 300);
    curS = -1;
    currentPhotos = [];
    window._refreshSeasonGrid = null;
    if (window.setCursorSeason) window.setCursorSeason('default');
  }

  /* ── Navigate between seasons ── */
  function navS(d) {
    expView.style.opacity = '0';
    expView.style.transform = 'translateY(25px)';
    expView.style.transition = 'opacity .3s, transform .3s';
    setTimeout(function() {
      expView.classList.remove('open');
      expView.style.cssText = '';
      curS = (curS + d + SEASONS.length) % SEASONS.length;
      const s = SEASONS[curS];
      overlayEl.querySelector('.ov-num').textContent   = s.num;
      overlayEl.querySelector('.ov-name').textContent  = s.name;
      overlayEl.querySelector('.ov-emoji').textContent = s.emoji;
      SeasonAnimator.cancel();
      SeasonAnimator.play(s.id, overlayEl, function() { buildExpanded(curS); });
    }, 300);
  }

  /* ── Hamburger nav ── */
  function initNav() {
    const ham    = document.getElementById('navHam');
    const drawer = document.getElementById('navDrawer');
    if (!ham || !drawer) return;
    ham.addEventListener('click', function() {
      const open = drawer.classList.toggle('open');
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        drawer.classList.remove('open'); ham.classList.remove('open');
        ham.setAttribute('aria-expanded','false'); document.body.style.overflow = '';
      });
    });
  }


  /* ══════════════════════════════════════════
     VIDEO CARD LOADER
     - One batch fetch to /api/videos
     - Creates <video> per season that has one
     - IntersectionObserver: play when visible,
       pause when scrolled away (battery-safe)
     - Smooth crossfade from poster → video
  ══════════════════════════════════════════ */
  function initVideoCards() {
    fetch('/api/videos')
      .then(function(r) { return r.json(); })
      .then(function(videoMap) {
        var seasons = ['spring','summer','monsoon','autumn','winter','golden'];
        seasons.forEach(function(season, idx) {
          var info = videoMap[season];
          if (!info || !info.url) return; // no video — keep poster image

          var container = document.getElementById('img' + idx);
          if (!container) return;

          injectVideo(container, info);
        });
      })
      .catch(function() {}); // silently ignore if API down
  }

  function injectVideo(container, info) {
    /* Mark the card */
    container.classList.add('has-video');
    container.closest('.seacard').classList.add('has-video');

    /* Build <video> */
    var vid = document.createElement('video');
    vid.src         = info.url;
    vid.muted       = true;
    vid.loop        = true;
    vid.playsInline = true;            // critical for iOS
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.preload     = 'none';          // don't download until visible

    /* Fade in once playable */
    vid.addEventListener('canplay', function() {
      vid.classList.add('ready');
    });

    /* Insert into wrap */
    var wrap = container.querySelector('.card-video-wrap');
    wrap.appendChild(vid);

    /* Play only when visible, pause when not — saves bandwidth + GPU */
    var vidObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          vid.preload = 'auto';
          vid.play().catch(function() {});
        } else {
          vid.pause();
        }
      });
    }, { threshold: 0.25 });
    vidObserver.observe(container);
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    overlayEl    = document.getElementById('seasonOverlay');
    seasonCanvas = document.getElementById('seasonCanvas');
    expView      = document.getElementById('expv');
    SeasonAnimator.init(seasonCanvas);
    initNav();
    photoCard.init();

    for (var i = 0; i < 6; i++) {
      (function(idx) {
        var exBtn = document.getElementById('explore' + idx);
        var imgEl = document.getElementById('img' + idx);
        var upEl  = document.getElementById('upload' + idx);
        if (exBtn) exBtn.addEventListener('click', function(e) { e.stopPropagation(); openS(idx); });
        if (imgEl) imgEl.addEventListener('click', function() { openS(idx); });
        if (upEl)  upEl.addEventListener('click',  function(e) { e.stopPropagation(); if(window.UploadManager) UploadManager.openForSeason(SEASONS[idx].id); });
      })(i);
    }

    var closeBtn = document.getElementById('closeExpBtn');
    var vallBtn  = document.getElementById('vallBtn');
    var prevBtn  = document.getElementById('sprev');
    var nextBtn  = document.getElementById('snext');
    if (closeBtn) closeBtn.addEventListener('click', closeExp);
    if (vallBtn)  vallBtn.addEventListener('click',  closeExp);
    if (prevBtn)  prevBtn.addEventListener('click',  function() { navS(-1); });
    if (nextBtn)  nextBtn.addEventListener('click',  function() { navS(1);  });

    var h = location.hash.replace('#','');
    if (h) {
      var i = SEASONS.findIndex(function(s) { return s.id === h; });
      if (i >= 0) openS(i);
    }

    initVideoCards();

    document.addEventListener('keydown', function(e) {
      if (!expView.classList.contains('open')) return;
      /* Don't close expanded view if photo card or delete confirm is open */
      if (photoCard.overlay && photoCard.overlay.classList.contains('active')) return;
      if (photoCard.deleteConfirm && photoCard.deleteConfirm.classList.contains('active')) return;
      if (e.key==='Escape')     closeExp();
      if (e.key==='ArrowLeft')  navS(-1);
      if (e.key==='ArrowRight') navS(1);
    });
  });

})();
