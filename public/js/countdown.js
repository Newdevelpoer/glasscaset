/* ═══════════════════════════════════════════════════
   COUNTDOWN.JS  —  Birthday Countdown + Celebration
   
   Set her birthday below (YYYY-MM-DD).
   On birthday → celebration mode for 30 days.
   After 30 days → countdown restarts to next year.
═══════════════════════════════════════════════════ */

window.HER_BIRTHDAY = "2026-03-23";   /* ← CHANGE THIS */
window.CELEBRATION_DAYS = 30;          /* how many days celebration lasts */

(function () {

  /* ────────────────────────────────
     DATE HELPERS  (all IST / UTC+5:30)

     States:
       COUNTDOWN  — before birthday this year, or after 30-day window
       BIRTHDAY   — birthday day through (birthday + 29 days)  inclusive

     All comparisons are done in UTC ms so device timezone is irrelevant.
  ──────────────────────────────── */
  var IST_OFFSET_MS   = 5.5 * 60 * 60 * 1000;   // 19800000 ms
  var ONE_DAY_MS      = 86400000;

  function parseBirthday(str) {
    var p = str.split('-');
    return { month: parseInt(p[1]) - 1, day: parseInt(p[2]) };
  }

  /*
   * Returns the UTC timestamp of midnight IST on the birthday for a given calendar year.
   *
   * midnight IST (UTC+5:30) on day D
   *   = day D at 00:00:00 IST
   *   = day D at 00:00:00 UTC  MINUS  5h30m
   *   = Date.UTC(year, month, day, 0,0,0)  -  IST_OFFSET_MS
   */
  function getBirthdayStartUTC(year) {
    var b = parseBirthday(window.HER_BIRTHDAY);
    return Date.UTC(year, b.month, b.day, 0, 0, 0) - IST_OFFSET_MS;
  }

  /*
   * Returns the current IST year by shifting Date.now() forward by the IST offset
   * and reading the UTC year of that shifted moment.
   */
  function getISTYear() {
    return new Date(Date.now() + IST_OFFSET_MS).getUTCFullYear();
  }

  /*
   * True  →  we are in the birthday window  [birthday midnight IST … birthday + 30 days)
   * False →  before birthday OR after the 30-day window (countdown mode)
   */
  function isCelebrating() {
    var nowMs   = Date.now();
    var year    = getISTYear();
    var startMs = getBirthdayStartUTC(year);
    var endMs   = startMs + window.CELEBRATION_DAYS * ONE_DAY_MS;
    return nowMs >= startMs && nowMs < endMs;
  }

  /*
   * Returns a Date object pointing to the NEXT birthday to count down to.
   * - If now < this year's birthday start  →  this year's birthday
   * - If now ≥ this year's birthday end    →  next year's birthday
   * (Should never be called while isCelebrating() is true)
   */
  function getNextBirthday() {
    var nowMs   = Date.now();
    var year    = getISTYear();
    var startMs = getBirthdayStartUTC(year);
    var endMs   = startMs + window.CELEBRATION_DAYS * ONE_DAY_MS;

    if (nowMs < startMs) {
      // Before this year's birthday
      return new Date(startMs);
    }
    // Either celebrating (shouldn't be here) or past the 30-day window → next year
    return new Date(getBirthdayStartUTC(year + 1));
  }

  /* ────────────────────────────────
     COUNTDOWN TICK
  ──────────────────────────────── */
  function bump(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    var v = String(val).padStart(2, '0');
    if (el.textContent !== v) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      el.textContent = v;
    }
  }

  var tickInterval = null;

  function tick() {
    if (isCelebrating()) {
      clearInterval(tickInterval);
      enterBirthdayMode();
      return;
    }

    var nowMs  = Date.now();
    var next   = getNextBirthday();   // Date object (UTC ms of birthday midnight IST)
    var diff   = next.getTime() - nowMs;

    if (diff <= 0) {
      // Just crossed the birthday threshold; re-check properly
      if (isCelebrating()) {
        clearInterval(tickInterval);
        enterBirthdayMode();
      }
      return;
    }

    bump('cdd', Math.floor(diff / ONE_DAY_MS));
    bump('cdh', Math.floor((diff % ONE_DAY_MS) / 36e5));
    bump('cdm', Math.floor((diff % 36e5) / 6e4));
    bump('cds', Math.floor((diff % 6e4)   / 1e3));

    var dtEl = document.getElementById('cdt');
    if (dtEl) {
      // Display target date in IST
      var istDate = new Date(next.getTime() + IST_OFFSET_MS);
      dtEl.textContent = istDate.toLocaleDateString('en-US', {
        timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  /* ────────────────────────────────
     BIRTHDAY CELEBRATION MODE
  ──────────────────────────────── */
  function enterBirthdayMode() {
    var countdownMode = document.getElementById('cdCountdownMode');
    var birthdayMode  = document.getElementById('cdBirthdayMode');
    if (!birthdayMode) return;

    if (countdownMode) countdownMode.style.display = 'none';
    birthdayMode.style.display = 'block';
    birthdayMode.classList.add('bd-active');

    launchConfetti();
    launchBalloons();
  }

  /* ────────────────────────────────
     CONFETTI  (canvas particle system)
  ──────────────────────────────── */
  function launchConfetti() {
    var canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    var ctx    = canvas.getContext('2d');
    var W      = canvas.width  = window.innerWidth;
    var H      = canvas.height = window.innerHeight;

    window.addEventListener('resize', function() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    var COLORS = ['#FFC6DD','#FFAECC','#CDBADB','#BDE0FE','#A2D2FF','#ffe066','#ff9640','#a8e6cf'];
    var SHAPES = ['circle','rect','star'];
    var particles = [];

    function mkParticle() {
      return {
        x:     Math.random() * W,
        y:     -20 - Math.random() * 80,
        vx:    (Math.random() - 0.5) * 3,
        vy:    2 + Math.random() * 4,
        rot:   Math.random() * Math.PI * 2,
        rspd:  (Math.random() - 0.5) * 0.15,
        size:  6 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        alpha: 1,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.06
      };
    }

    for (var i = 0; i < 160; i++) {
      var p = mkParticle();
      p.y = Math.random() * H; /* start spread across screen */
      particles.push(p);
    }

    var spawnTimer = 0;
    var raf;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      /* Spawn new particles */
      spawnTimer++;
      if (spawnTimer % 3 === 0 && particles.length < 300) {
        particles.push(mkParticle());
        particles.push(mkParticle());
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.wobble  += p.wobbleSpeed;
        p.x       += p.vx + Math.sin(p.wobble) * 1.2;
        p.y       += p.vy;
        p.rot     += p.rspd;
        if (p.y > H + 20) {
          if (particles.length > 80) { particles.splice(i, 1); continue; }
          p.y = -20; p.x = Math.random() * W;
        }
        if (p.y > H * 0.85) p.alpha = Math.max(0, p.alpha - 0.02);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.size/2, -p.size/3, p.size, p.size*0.6);
        } else {
          /* 5-pointed star */
          ctx.beginPath();
          for (var s = 0; s < 5; s++) {
            var ang = (s * 4 * Math.PI / 5) - Math.PI / 2;
            var r   = s % 2 === 0 ? p.size / 2 : p.size / 5;
            ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
          }
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    draw();

    /* Stop after 18 seconds - let last particles fall */
    setTimeout(function() {
      cancelAnimationFrame(raf);
      /* Fade canvas out */
      canvas.style.transition = 'opacity 2s';
      canvas.style.opacity    = '0';
    }, 18000);
  }

  /* ────────────────────────────────
     BALLOONS  (CSS-animated divs)
  ──────────────────────────────── */
  function launchBalloons() {
    var container = document.getElementById('balloonContainer');
    if (!container) return;

    var BALLOON_COLORS = [
      ['#FFC6DD','#FFAECC'],['#A2D2FF','#BDE0FE'],
      ['#CDBADB','#d9ccec'],['#ffe066','#ffd033'],
      ['#a8e6cf','#7dc9a4'],['#ffb347','#ff9640']
    ];

    function mkBalloon(delay) {
      var col  = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      var size = 45 + Math.random() * 45;
      var left = 5 + Math.random() * 90;
      var dur  = 5 + Math.random() * 5;
      var sway = (Math.random() - 0.5) * 60;

      var wrap = document.createElement('div');
      wrap.className = 'balloon-wrap';
      wrap.style.cssText =
        'position:absolute;bottom:-120px;left:' + left + '%;' +
        'animation:balloonRise ' + dur + 's ' + delay + 's ease-in forwards;';

      var ball = document.createElement('div');
      ball.className = 'balloon';
      ball.style.cssText =
        'width:' + size + 'px;height:' + (size * 1.15) + 'px;' +
        'background:radial-gradient(circle at 35% 35%,' + col[0] + ',' + col[1] + ');' +
        'border-radius:50% 50% 50% 50% / 55% 55% 45% 45%;' +
        'box-shadow:inset -4px -4px 12px rgba(0,0,0,.12), 0 4px 24px rgba(0,0,0,.1);' +
        'position:relative;' +
        'animation:balloonSway ' + (2 + Math.random()) + 's ease-in-out infinite alternate;' +
        '--sway:' + sway + 'px;';

      /* string */
      var str = document.createElement('div');
      str.style.cssText =
        'width:1px;height:' + (size * 1.3) + 'px;' +
        'background:rgba(0,0,0,.2);' +
        'margin:0 auto;';

      wrap.appendChild(ball);
      wrap.appendChild(str);
      container.appendChild(wrap);
    }

    for (var i = 0; i < 18; i++) {
      mkBalloon(i * 0.35);
    }

    /* Keep adding balloons */
    var bInterval = setInterval(function() {
      if (document.getElementById('cdBirthdayMode').style.display !== 'none') {
        mkBalloon(0);
        /* Prune old ones */
        var wraps = container.querySelectorAll('.balloon-wrap');
        if (wraps.length > 40) wraps[0].remove();
      } else {
        clearInterval(bInterval);
      }
    }, 1800);
  }

  /* ────────────────────────────────
     DOM READY
  ──────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('cdd') && !document.getElementById('cdBirthdayMode')) return;

    if (isCelebrating()) {
      enterBirthdayMode();
    } else {
      tick();
      tickInterval = setInterval(tick, 1000);
    }
  });

})();
