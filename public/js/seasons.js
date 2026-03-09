/* ═══════════════════════════════════════════════════
   SEASONS.JS  —  Canvas transition animations
   Exports: window.SeasonAnimator
═══════════════════════════════════════════════════ */
window.SeasonAnimator = (function () {

  const overlay = null; // set at runtime
  let canvas, ctx, animId, particles, transTime;

  function init(cvs) {
    canvas = cvs;
    ctx    = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* ════ SPRING ════ */
  function initSpring() {
    particles = [];
    const c=['#FFAECC','#FFC6DD','#CDBADB','#ff9eb5','#ffcce0','#c8f7c5','#ff80ab'];
    for (let i=0;i<120;i++) {
      const isBfly = i<8;
      particles.push({ x:Math.random()*canvas.width, y:-Math.random()*canvas.height,
        size:isBfly?18+Math.random()*12:6+Math.random()*16, color:c[i%c.length],
        speedY:isBfly?0.8+Math.random():1.5+Math.random()*2.5, speedX:(Math.random()-.5)*1.5,
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.08,
        wobble:Math.random()*Math.PI*2, wobbleSpeed:0.04+Math.random()*0.04,
        isBfly, wingPhase:Math.random()*Math.PI*2, opacity:0.7+Math.random()*0.3 });
    }
  }
  function drawSpring(t) {
    const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0,'#fce4ec');g.addColorStop(.5,'#e8f5e9');g.addColorStop(1,'#f8bbd0');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.wobble+=p.wobbleSpeed;p.y+=p.speedY;p.x+=p.speedX+Math.sin(p.wobble)*.8;p.rot+=p.rotSpeed;
      if(p.y>canvas.height+30){p.y=-30;p.x=Math.random()*canvas.width;}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.opacity;
      if(p.isBfly){
        p.wingPhase+=0.15;const ws=Math.abs(Math.sin(p.wingPhase));
        ctx.fillStyle=p.color;
        ctx.beginPath();ctx.ellipse(-p.size*ws,0,p.size*ws,p.size*.7,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse( p.size*ws,0,p.size*ws,p.size*.7,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(80,20,60,0.6)';ctx.beginPath();ctx.ellipse(0,0,3,p.size*.5,0,0,Math.PI*2);ctx.fill();
      } else {
        ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size*.4,p.size*.7,0,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    });
  }

  /* ════ SUMMER ════ */
  function initSummer() {
    particles=[];
    const c=['#ffe082','#ffb300','#fff9c4','#ff8f00','#ffffff','#ffecb3'];
    for(let i=0;i<80;i++) particles.push({
      x:Math.random()*canvas.width, y:-Math.random()*canvas.height*1.2,
      size:4+Math.random()*12, color:c[i%c.length],
      speedY:1+Math.random()*2, speedX:(Math.random()-.5)*.8,
      rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*.06,
      opacity:.5+Math.random()*.5, isSpark:i<30
    });
  }
  function drawSummer(t) {
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#fff9c4');g.addColorStop(.5,'#ffe082');g.addColorStop(1,'#ffcc02');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    const sx=canvas.width/2, sy=canvas.height*.38, pulse=90+Math.sin(t*.04)*12;
    const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,pulse*3);
    sg.addColorStop(0,'rgba(255,255,200,.95)');sg.addColorStop(.3,'rgba(255,220,50,.7)');
    sg.addColorStop(.7,'rgba(255,180,0,.25)');sg.addColorStop(1,'rgba(255,150,0,0)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,pulse*3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,248,150,.98)';ctx.beginPath();ctx.arc(sx,sy,pulse,0,Math.PI*2);ctx.fill();
    for(let i=0;i<18;i++){
      const a=(i/18)*Math.PI*2+t*.008, r1=pulse+15, r2=pulse+55+Math.sin(t*.02+i)*20;
      ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.globalAlpha=.35+Math.sin(t*.04+i*.5)*.15;
      const rg=ctx.createLinearGradient(0,r1,0,r2);rg.addColorStop(0,'#ffee58');rg.addColorStop(1,'rgba(255,230,0,0)');
      ctx.fillStyle=rg;ctx.beginPath();ctx.moveTo(-5,r1);ctx.lineTo(0,r2);ctx.lineTo(5,r1);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    particles.forEach(p=>{
      p.y+=p.speedY;p.x+=p.speedX;p.rot+=p.rotSpeed;if(p.y>canvas.height+20)p.y=-20;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.opacity;
      ctx.fillStyle='rgba(255,255,180,.9)';
      if(p.isSpark){for(let s=0;s<4;s++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(p.size*.3,p.size);ctx.lineTo(0,p.size*.7);ctx.lineTo(-p.size*.3,p.size);ctx.closePath();ctx.fill();}}
      else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.size*.5,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    });
  }

  /* ════ MONSOON ════ */
  function initMonsoon() {
    particles=[];
    for(let i=0;i<250;i++){
      const w=i<15;
      particles.push({x:Math.random()*canvas.width*1.5-canvas.width*.25, y:Math.random()*canvas.height,
        len:w?60+Math.random()*80:12+Math.random()*18, speed:w?8+Math.random()*6:18+Math.random()*12,
        angle:w?-.15+Math.random()*.1:-.2+Math.random()*.1, opacity:w?.06+Math.random()*.08:.35+Math.random()*.5,
        thick:w?2+Math.random()*3:1+Math.random(), isWind:w,
        color:w?'hsla(210,60%,80%,1)':'hsla(210,70%,80%,1)'});
    }
  }
  function drawMonsoon(t) {
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#1a237e');g.addColorStop(.5,'#283593');g.addColorStop(1,'#3949ab');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    if(Math.sin(t*.07)*Math.cos(t*.13)>.92){ctx.fillStyle='rgba(200,220,255,.12)';ctx.fillRect(0,0,canvas.width,canvas.height);}
    const rbP=Math.min(1,Math.max(0,(t-30)/80));
    if(rbP>0){
      const rc=canvas.width/2, ry=canvas.height*1.1;
      ['rgba(255,80,80,.5)','rgba(255,165,0,.5)','rgba(255,255,0,.5)','rgba(0,200,80,.5)','rgba(0,150,255,.5)','rgba(75,0,130,.45)','rgba(150,0,200,.45)'].forEach((c,i)=>{
        const r=canvas.height*(.7+i*.06);ctx.strokeStyle=c;ctx.lineWidth=18*rbP;ctx.globalAlpha=.55*rbP;
        ctx.beginPath();ctx.arc(rc,ry,r,Math.PI,0);ctx.stroke();
      });ctx.globalAlpha=1;
    }
    for(let i=0;i<3;i++){
      const cx=canvas.width*(.15+i*.35)+Math.sin(t*.008+i)*30, cy=canvas.height*.12+i*20;
      const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,120);
      cg.addColorStop(0,'rgba(150,160,200,.45)');cg.addColorStop(1,'rgba(100,120,180,0)');
      ctx.fillStyle=cg;
      ctx.beginPath();ctx.arc(cx,cy,120,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx+70,cy+20,90,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx-60,cy+15,80,0,Math.PI*2);ctx.fill();
    }
    particles.forEach(p=>{
      p.x+=Math.sin(p.angle)*p.speed*.26;p.y+=Math.cos(p.angle)*p.speed*.26;
      if(p.y>canvas.height+30||p.x>canvas.width+50){p.y=-20;p.x=Math.random()*canvas.width*1.2-canvas.width*.1;}
      ctx.save();ctx.globalAlpha=p.opacity;ctx.strokeStyle=p.color;ctx.lineWidth=p.thick;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.sin(p.angle)*p.len,p.y+Math.cos(p.angle)*p.len);ctx.stroke();ctx.restore();
    });
  }

  /* ════ AUTUMN ════ */
  function initAutumn() {
    particles=[];
    const c=['#e65100','#f57c00','#ff8f00','#e64a19','#bf360c','#d84315','#c62828','#4e342e','#ffb74d','#ff7043'];
    for(let i=0;i<90;i++) particles.push({
      x:Math.random()*canvas.width*1.2-canvas.width*.1, y:-Math.random()*canvas.height,
      size:14+Math.random()*22, color:c[i%c.length],
      speedY:1.5+Math.random()*2.5, speedX:(Math.random()-.5)*1.8,
      rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*.06,
      wobble:Math.random()*Math.PI*2, wobbleSpeed:.02+Math.random()*.03,
      swing:Math.random()*Math.PI*2, opacity:.75+Math.random()*.25
    });
  }
  function drawLeafShape(ctx,size,color){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(0,-size);ctx.bezierCurveTo(size*.6,-size*.5,size*.7,size*.3,0,size);
    ctx.bezierCurveTo(-size*.7,size*.3,-size*.6,-size*.5,0,-size);ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(0,size);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-size*.5);ctx.lineTo(size*.4,size*.3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-size*.4,size*.4);ctx.stroke();
  }
  function drawAutumn(t) {
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#3e2723');g.addColorStop(.5,'#5d4037');g.addColorStop(1,'#4a2a1a');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    const hg=ctx.createRadialGradient(canvas.width*.5,canvas.height,0,canvas.width*.5,canvas.height,canvas.height);
    hg.addColorStop(0,'rgba(255,140,0,.22)');hg.addColorStop(.5,'rgba(230,80,0,.1)');hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg;ctx.fillRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.wobble+=p.wobbleSpeed;p.swing+=.015;
      p.y+=p.speedY;p.x+=p.speedX+Math.sin(p.swing)*.9;p.rot+=p.rotSpeed+Math.cos(p.wobble)*.02;
      if(p.y>canvas.height+30){p.y=-40;p.x=Math.random()*canvas.width*1.2-canvas.width*.1;}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.opacity;
      drawLeafShape(ctx,p.size,p.color);ctx.restore();
    });
  }

  /* ════ WINTER ════ */
  function initWinter() {
    particles=[];
    for(let i=0;i<200;i++) particles.push({
      x:Math.random()*canvas.width, y:-Math.random()*canvas.height,
      size:2+Math.random()*8, speed:.8+Math.random()*1.8,
      drift:(Math.random()-.5)*.8, wobble:Math.random()*Math.PI*2, wobbleSpeed:.02+Math.random()*.03,
      rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*.02, opacity:.5+Math.random()*.5,
      type:i%5===0?'star':'circle'
    });
  }
  function drawSnowflakeShape(ctx,r){
    for(let i=0;i<6;i++){
      ctx.save();ctx.rotate(i*Math.PI/3);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-r*.4);ctx.lineTo(-r*.2,-r*.55);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-r*.4);ctx.lineTo(r*.2,-r*.55);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-r*.7);ctx.lineTo(-r*.15,-r*.85);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-r*.7);ctx.lineTo(r*.15,-r*.85);ctx.stroke();
      ctx.restore();
    }
  }
  function drawSnowmanShape(ctx,cx,cy,s){
    const bg=ctx.createRadialGradient(cx-s*.2,cy+s*.8,s*.1,cx,cy+s,s*.7);
    bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#c8e6f5');
    ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy+s,s*.7,0,Math.PI*2);ctx.fill();
    const mg=ctx.createRadialGradient(cx-s*.15,cy-.05*s,s*.05,cx,cy+s*.05,s*.5);
    mg.addColorStop(0,'#ffffff');mg.addColorStop(1,'#d0eaf8');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(cx,cy,s*.5,0,Math.PI*2);ctx.fill();
    const hg=ctx.createRadialGradient(cx-s*.1,cy-s*.85,s*.02,cx,cy-s*.8,s*.32);
    hg.addColorStop(0,'#ffffff');hg.addColorStop(1,'#d8eef9');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(cx,cy-s*.8,s*.32,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1a2a3a';ctx.beginPath();ctx.arc(cx-s*.1,cy-s*.88,s*.04,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(cx+s*.1,cy-s*.88,s*.04,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff6600';ctx.beginPath();ctx.moveTo(cx,cy-s*.8);ctx.lineTo(cx+s*.22,cy-s*.78);ctx.lineTo(cx,cy-s*.76);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#1a2a3a';ctx.lineWidth=s*.03;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(cx,cy-s*.8,s*.14,.3,Math.PI-.3);ctx.stroke();
    ctx.strokeStyle='#FFAECC';ctx.lineWidth=s*.08;ctx.beginPath();ctx.arc(cx,cy-s*.5,s*.5,Math.PI*1.1,Math.PI*.1);ctx.stroke();
    ctx.fillStyle='#2d3a4a';[-.12,0,.12].forEach(dy=>{ctx.beginPath();ctx.arc(cx,cy+dy*s*2,s*.05,0,Math.PI*2);ctx.fill();});
    ctx.strokeStyle='#5d4037';ctx.lineWidth=s*.04;ctx.lineCap='round';
    ctx.save();ctx.translate(cx,cy);
    ctx.beginPath();ctx.moveTo(-s*.5,0);ctx.lineTo(-s*1.1,-s*.4);ctx.moveTo(-s*1.1,-s*.4);ctx.lineTo(-s*1.3,-s*.6);ctx.moveTo(-s*1.1,-s*.4);ctx.lineTo(-s*1.1,-s*.65);ctx.stroke();
    ctx.beginPath();ctx.moveTo(s*.5,0);ctx.lineTo(s*1.1,-s*.4);ctx.moveTo(s*1.1,-s*.4);ctx.lineTo(s*1.3,-s*.6);ctx.moveTo(s*1.1,-s*.4);ctx.lineTo(s*1.1,-s*.65);ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#1a2a3a';ctx.fillRect(cx-s*.28,cy-s*1.18,s*.56,s*.08);ctx.fillRect(cx-s*.22,cy-s*1.55,s*.44,s*.38);
    ctx.fillStyle='#CDBADB';ctx.fillRect(cx-s*.28,cy-s*1.2,s*.56,s*.05);
  }
  function drawWinter(t) {
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#e3f2fd');g.addColorStop(.6,'#bbdefb');g.addColorStop(1,'#e8eaf6');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(220,240,255,.9)';
    ctx.beginPath();ctx.moveTo(0,canvas.height);
    for(let x=0;x<canvas.width;x+=40) ctx.quadraticCurveTo(x+20,canvas.height-20+Math.sin(x*.03+t*.02)*8,x+40,canvas.height-12+Math.cos(x*.04)*6);
    ctx.lineTo(canvas.width,canvas.height);ctx.closePath();ctx.fill();
    const smP=Math.min(1,Math.max(0,(t-40)/50));
    if(smP>0){ctx.globalAlpha=smP;drawSnowmanShape(ctx,canvas.width*.5,canvas.height*.75,80);ctx.globalAlpha=1;}
    particles.forEach(p=>{
      p.wobble+=p.wobbleSpeed;p.y+=p.speed;p.x+=p.drift+Math.sin(p.wobble)*.5;p.rot+=p.rotSpeed;
      if(p.y>canvas.height+20){p.y=-20;p.x=Math.random()*canvas.width;}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.opacity;
      if(p.type==='star'||p.size>5){ctx.strokeStyle='rgba(162,220,255,.9)';ctx.lineWidth=p.size>.5?1.2:.8;drawSnowflakeShape(ctx,p.size);}
      else{ctx.fillStyle='rgba(200,235,255,.9)';ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    });
  }

  /* ════ GOLDEN ════ */
  function initGolden() {
    particles=[];
    const c=['#FFAECC','#CDBADB','#A2D2FF','#fff176','#ce93d8','#80deea','#ffb74d'];
    for(let i=0;i<130;i++) particles.push({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      vx:(Math.random()-.5)*.6, vy:-.3-Math.random()*.8,
      size:2+Math.random()*8, color:c[i%c.length],
      life:0, maxLife:120+Math.random()*80, born:Math.floor(Math.random()*80),
      rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*.05, isStar:i%4===0
    });
  }
  function drawStarShape(ctx,r){
    ctx.beginPath();
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5-Math.PI/2, ai=(i+.5)*Math.PI*2/5-Math.PI/2;
      ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(ai)*r*.45,Math.sin(ai)*r*.45);
    }ctx.closePath();ctx.fill();
  }
  function drawGolden(t) {
    const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0,'#1a0033');g.addColorStop(.4,'#4a0080');g.addColorStop(.7,'#6a0080');g.addColorStop(1,'#1a0050');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    const hg=ctx.createRadialGradient(canvas.width*.5,canvas.height*.6,0,canvas.width*.5,canvas.height*.6,canvas.width*.7);
    hg.addColorStop(0,'rgba(255,174,204,.35)');hg.addColorStop(.4,'rgba(205,186,219,.18)');hg.addColorStop(1,'rgba(162,210,255,0)');
    ctx.fillStyle=hg;ctx.fillRect(0,0,canvas.width,canvas.height);
    const ox=canvas.width*.5, oy=canvas.height*.55;
    for(let i=0;i<20;i++){
      const a=(i/20)*Math.PI*2+t*.004, len=canvas.height*(.6+Math.sin(t*.015+i*.7)*.2);
      ctx.save();ctx.translate(ox,oy);ctx.rotate(a);ctx.globalAlpha=.05+Math.sin(t*.02+i*.8)*.03;
      const rg=ctx.createLinearGradient(0,0,0,len);rg.addColorStop(0,'rgba(255,174,204,.8)');rg.addColorStop(1,'rgba(162,210,255,0)');
      ctx.fillStyle=rg;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(0,len);ctx.lineTo(8,0);ctx.closePath();ctx.fill();ctx.restore();
    }
    for(let i=0;i<50;i++){
      const sx=(i*137.5+50)%canvas.width, sy=(i*97.3+30)%(canvas.height*.6), sw=.4+Math.sin(t*.05+i)*.4;
      ctx.globalAlpha=sw*.7;ctx.fillStyle='white';ctx.beginPath();ctx.arc(sx,sy,.8+sw*.8,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    particles.forEach(p=>{
      if(t<p.born)return;p.life++;if(p.life>p.maxLife){p.life=0;p.x=Math.random()*canvas.width;p.y=Math.random()*canvas.height;}
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.rotSpeed;
      const prog=p.life/p.maxLife, alpha=prog<.15?prog/.15:prog>.7?(1-prog)/.3:1;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=alpha*.85;
      ctx.fillStyle=p.color;
      if(p.isStar)drawStarShape(ctx,p.size);
      else{ctx.beginPath();ctx.arc(0,0,p.size*.6,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    });
  }

  /* ════ DISPATCHER ════ */
  const INITS  = { spring:initSpring, summer:initSummer, monsoon:initMonsoon, autumn:initAutumn, winter:initWinter, golden:initGolden };
  const DRAWS  = { spring:drawSpring, summer:drawSummer, monsoon:drawMonsoon, autumn:drawAutumn, winter:drawWinter, golden:drawGolden };

  function play(seasonId, overlayEl, onComplete) {
    if (!canvas) return onComplete && onComplete();
    const id  = seasonId;
    const ini = INITS[id];
    const drw = DRAWS[id];
    if (!ini) { onComplete && onComplete(); return; }

    resize();
    ini();
    transTime = 0;

    // Overlay text
    const numEl  = overlayEl.querySelector('.ov-num');
    const nameEl = overlayEl.querySelector('.ov-name');
    const emoEl  = overlayEl.querySelector('.ov-emoji');
    // Caller should have already set these

    overlayEl.classList.add('active');
    setTimeout(() => overlayEl.classList.add('show-text'), 50);

    let startTs = null;
    const DURATION = 2800;

    function frame(ts) {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      transTime++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drw(transTime);
      const fadeStart = DURATION - 500;
      if (elapsed > fadeStart) {
        const a = (elapsed - fadeStart) / 500;
        ctx.fillStyle = 'rgba(253,246,255,' + a + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (elapsed < DURATION) {
        animId = requestAnimationFrame(frame);
      } else {
        overlayEl.classList.remove('active', 'show-text');
        cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete && onComplete();
      }
    }
    animId = requestAnimationFrame(frame);
  }

  function cancel() {
    if (animId) cancelAnimationFrame(animId);
  }

  return { init, play, cancel };
})();
