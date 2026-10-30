(() => {
  'use strict';
  const canvas=document.getElementById('gameCanvas');
  const ctx=canvas.getContext('2d');
  const $=id=>document.getElementById(id);
  const distanceEl=$('distance'),starsEl=$('stars'),paceEl=$('pace'),bestEl=$('best');
  const overlay=$('overlay'),overlayEyebrow=$('overlayEyebrow'),overlayTitle=$('overlayTitle'),overlayText=$('overlayText');
  const startButton=$('startButton'),pauseButton=$('pauseButton'),restartButton=$('restartButton'),jumpButton=$('jumpButton'),status=$('gameStatus');
  const W=900,H=360,ground=292,runner={x:112,y:ground-43,w:38,h:43,vy:0,onGround:true};
  const gravity=1750,jumpVelocity=-650;
  let state='ready',last=0,elapsed=0,distance=0,stars=0,speed=300,spawnIn=1,starIn=2,obstacles=[],collectibles=[],frameId=0;
  let best=Number(localStorage.getItem('jumpRunnerBest')||0);
  bestEl.textContent=best+' m';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reset(){elapsed=0;distance=0;stars=0;speed=300;spawnIn=1;starIn=2;obstacles=[];collectibles=[];runner.y=ground-runner.h;runner.vy=0;runner.onGround=true;updateStats();draw();}
  function updateStats(){distanceEl.textContent=Math.floor(distance)+' m';starsEl.textContent=stars;paceEl.textContent=(speed/300).toFixed(1)+'×';}
  function showOverlay(eyebrow,title,message,button){overlay.hidden=false;overlayEyebrow.textContent=eyebrow;overlayTitle.textContent=title;overlayText.textContent=message;startButton.textContent=button;}
  function hideOverlay(){overlay.hidden=true;}
  function start(){if(state==='running')return;reset();state='running';pauseButton.disabled=false;pauseButton.textContent='Pause';hideOverlay();status.textContent='Run in progress. Jump over the hurdles!';last=0;cancelAnimationFrame(frameId);frameId=requestAnimationFrame(loop);}
  function pause(){if(state==='running'){state='paused';cancelAnimationFrame(frameId);pauseButton.textContent='Resume';showOverlay('TAKE A BREATHER','Run paused','You are at '+Math.floor(distance)+' metres. Resume when ready.','Resume running');status.textContent='Paused.';}else if(state==='paused'){state='running';pauseButton.textContent='Pause';hideOverlay();last=0;frameId=requestAnimationFrame(loop);status.textContent='Back in action!';}}
  function end(){state='over';pauseButton.disabled=true;cancelAnimationFrame(frameId);const score=Math.floor(distance);if(score>best){best=score;localStorage.setItem('jumpRunnerBest',String(best));bestEl.textContent=best+' m';}showOverlay('RUN COMPLETE','Nice run!','You covered '+score+' metres and collected '+stars+' stars. Ready for another?','Run again');status.textContent='Run over. Distance: '+score+' metres. Collected '+stars+' stars.';}
  function jump(){if(state!=='running')return;if(runner.onGround){runner.vy=jumpVelocity;runner.onGround=false;}}
  function spawnObstacle(){const height=26+Math.random()*22,width=22+Math.random()*20;obstacles.push({x:W+20,y:ground-height,w:width,h:height});spawnIn=Math.max(.72,1.35-Math.min(speed-300,300)/650)+Math.random()*.55;}
  function spawnStar(){collectibles.push({x:W+20,y:ground-75-Math.random()*95,r:10,got:false});starIn=2.1+Math.random()*1.5;}
  function intersects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function update(dt){elapsed+=dt;speed=Math.min(570,300+elapsed*5);distance+=speed*dt/18;spawnIn-=dt;starIn-=dt;if(spawnIn<=0)spawnObstacle();if(starIn<=0)spawnStar();
    runner.vy+=gravity*dt;runner.y+=runner.vy*dt;if(runner.y>=ground-runner.h){runner.y=ground-runner.h;runner.vy=0;runner.onGround=true;}
    for(const o of obstacles)o.x-=speed*dt;for(const s of collectibles)s.x-=speed*dt;
    const player={x:runner.x+5,y:runner.y+5,w:runner.w-10,h:runner.h-7};
    if(obstacles.some(o=>intersects(player,o))){end();return;}
    for(const s of collectibles){if(!s.got&&Math.hypot((runner.x+runner.w/2)-s.x,(runner.y+runner.h/2)-s.y)<s.r+20){s.got=true;stars++;}}
    obstacles=obstacles.filter(o=>o.x+o.w>-5);collectibles=collectibles.filter(s=>s.x+s.r>-5&&!s.got);updateStats();
  }
  function roundedRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function draw(){ctx.clearRect(0,0,W,H);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#bfe6dc');sky.addColorStop(1,'#e7efd0');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.arc(730,75,35,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9ccbb9';for(let i=0;i<5;i++){const x=((i*230-elapsed*22)%(W+220)+W+220)%(W+220)-110;ctx.beginPath();ctx.ellipse(x,ground-12,95,65,0,Math.PI,0);ctx.fill();}
    ctx.fillStyle='#426f69';ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle='#d4efb2';for(let i=0;i<18;i++){const x=((i*65-elapsed*speed*.55)%(W+65)+W+65)%(W+65);ctx.fillRect(x,ground+19,27,4);}
    for(const o of obstacles){roundedRect(o.x,o.y,o.w,o.h,6,'#e77f83');roundedRect(o.x+5,o.y+5,Math.max(5,o.w-10),5,3,'#ffc1a8');}
    for(const s of collectibles){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(elapsed*2);ctx.fillStyle='#ffbd63';ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?5:s.r;const a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();}
    // Original little runner character: rounded body, face and legs.
    roundedRect(runner.x,runner.y+10,runner.w,runner.h-10,12,'#5d668e');roundedRect(runner.x+6,runner.y,runner.w-12,19,9,'#ff91ad');
    ctx.fillStyle='#172039';ctx.beginPath();ctx.arc(runner.x+25,runner.y+10,2.4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#172039';ctx.lineWidth=2;ctx.beginPath();ctx.arc(runner.x+27,runner.y+14,4,.15,1.15);ctx.stroke();
    ctx.strokeStyle='#35405e';ctx.lineWidth=5;ctx.lineCap='round';const legSwing=state==='running'&&runner.onGround?Math.sin(elapsed*18)*5:0;ctx.beginPath();ctx.moveTo(runner.x+11,runner.y+runner.h-3);ctx.lineTo(runner.x+8+legSwing,runner.y+runner.h+4);ctx.moveTo(runner.x+28,runner.y+runner.h-3);ctx.lineTo(runner.x+31-legSwing,runner.y+runner.h+4);ctx.stroke();
  }
  function loop(timestamp){if(state!=='running')return;if(!last)last=timestamp;const dt=Math.min((timestamp-last)/1000,.032);last=timestamp;update(dt);if(state==='running'){draw();frameId=requestAnimationFrame(loop);}}
  startButton.addEventListener('click',()=>{if(state==='paused')pause();else start();});
  pauseButton.addEventListener('click',pause);
  restartButton.addEventListener('click',start);
  jumpButton.addEventListener('pointerdown',e=>{e.preventDefault();jump();});
  canvas.addEventListener('pointerdown',()=>{if(state==='running')jump();});
  document.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='ArrowUp')&&!e.repeat){e.preventDefault();if(state==='ready'||state==='over')start();else if(state==='running')jump();}if(e.code==='Escape'&&state==='running')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});
  reset();
})();