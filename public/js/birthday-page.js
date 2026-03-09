/* ═══════════════════════════════════════════
   BIRTHDAY-PAGE.JS  —  Celebration on /birthday
═══════════════════════════════════════════ */
(function () {

  function launchConfetti() {
    var canvas = document.getElementById('bdConfetti');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W   = canvas.width  = window.innerWidth;
    var H   = canvas.height = window.innerHeight;
    window.addEventListener('resize', function() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

    var COLORS = ['#FFC6DD','#FFAECC','#CDBADB','#BDE0FE','#A2D2FF','#ffe066','#ff9640','#a8e6cf'];
    var particles = [];

    function mkP() {
      return {
        x: Math.random() * W, y: -20 - Math.random() * 60,
        vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2, rspd: (Math.random() - .5) * .15,
        size: 7 + Math.random() * 9, color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() < .33 ? 'circle' : Math.random() < .5 ? 'rect' : 'star',
        alpha: 1, wobble: Math.random() * Math.PI * 2, wspd: .04 + Math.random() * .06
      };
    }

    for (var i = 0; i < 120; i++) { var p = mkP(); p.y = Math.random() * H; particles.push(p); }

    var spawnT = 0, raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      spawnT++;
      if (spawnT % 3 === 0 && particles.length < 280) { particles.push(mkP()); particles.push(mkP()); }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.wobble += p.wspd; p.x += p.vx + Math.sin(p.wobble) * 1.1; p.y += p.vy; p.rot += p.rspd;
        if (p.y > H + 20) { if (particles.length > 60) { particles.splice(i, 1); continue; } p.y = -20; p.x = Math.random() * W; p.alpha = 1; }
        if (p.y > H * .82) p.alpha = Math.max(0, p.alpha - .022);

        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill(); }
        else if (p.shape === 'rect') { ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.6); }
        else {
          ctx.beginPath();
          for (var s = 0; s < 5; s++) { var a = s*4*Math.PI/5-Math.PI/2; var r = s%2===0?p.size/2:p.size/5; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); }
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    setTimeout(function() { cancelAnimationFrame(raf); canvas.style.transition = 'opacity 2s'; canvas.style.opacity = '0'; }, 20000);
  }

  function launchBalloons() {
    var container = document.getElementById('bdBalloons');
    if (!container) return;
    var COLS = [['#FFC6DD','#FFAECC'],['#A2D2FF','#BDE0FE'],['#CDBADB','#d9ccec'],['#ffe066','#ffd033'],['#a8e6cf','#7dc9a4'],['#ffb347','#ff9640']];
    function mkB(delay) {
      var col  = COLS[Math.floor(Math.random() * COLS.length)];
      var size = 45 + Math.random() * 50;
      var left = 3 + Math.random() * 94;
      var dur  = 5.5 + Math.random() * 5;
      var sway = (Math.random() - .5) * 65;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;bottom:-130px;left:'+left+'%;animation:balloonRise '+dur+'s '+delay+'s ease-in forwards;';
      var ball = document.createElement('div');
      ball.style.cssText = 'width:'+size+'px;height:'+(size*1.15)+'px;background:radial-gradient(circle at 35% 35%,'+col[0]+','+col[1]+');border-radius:50% 50% 50% 50% / 55% 55% 45% 45%;box-shadow:inset -4px -4px 12px rgba(0,0,0,.12);animation:balloonSway '+(2+Math.random())+'s ease-in-out infinite alternate;--sway:'+sway+'px;';
      var str  = document.createElement('div');
      str.style.cssText = 'width:1px;height:'+(size*1.4)+'px;background:rgba(0,0,0,.18);margin:0 auto;';
      wrap.appendChild(ball); wrap.appendChild(str); container.appendChild(wrap);
    }
    for (var i = 0; i < 22; i++) mkB(i * 0.3);
    setInterval(function() { mkB(0); var w = container.querySelectorAll('div'); if (w.length > 50) w[0].remove(); }, 1500);
  }

  document.addEventListener('DOMContentLoaded', function() {
    launchConfetti();
    launchBalloons();
  });
})();
