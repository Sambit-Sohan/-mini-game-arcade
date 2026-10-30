(() => {
  'use strict';
  const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d'),playerShip=document.getElementById('playerShip');
  const $=id=>document.getElementById(id);
  const timerEl=$('timer'),scoreEl=$('score'),livesEl=$('lives'),bestEl=$('bestScore');
  const overlay=$('overlay'),eyebrow=$('overlayEyebrow'),title=$('overlayTitle'),message=$('overlayText');
  const startButton=$('startButton'),pauseButton=$('pauseButton'),restartButton=$('restartButton'),status=$('gameStatus');
  const leftButton=$('leftButton'),rightButton=$('rightButton');
  const W=900,H=520,DURATION=60;
  const ship={x:W/2,y:H-112,r:24,speed:440};
  let state='ready',last=0,elapsed=0,score=0,lives=3,spawnRock=0,spawnOrb=1.3,rocks=[],orbs=[],stars=[],raf=0;
  let left=false,right=false,keys={},pointerActive=false,targetX=ship.x;
  let best=Number(localStorage.getItem('spaceDodgeBest')||0);
  bestEl.textContent=String(best);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(let i=0;i<75;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:.5+Math.random()*1.5,phase:Math.random()*6.28});
  function reset(){elapsed=0;score=0;lives=3;spawnRock=.4;spawnOrb=1.2;rocks=[];orbs=[];ship.x=W/2;targetX=ship.x;pointerActive=false;left=false;right=false;updateHud();draw();}
  function updateHud(){timerEl.textContent=Math.ceil(Math.max(0,DURATION-elapsed))+'s';scoreEl.textContent=String(score);livesEl.textContent='♥ '.repeat(lives).trim()+'♡ '.repeat(3-lives).trim();livesEl.setAttribute('aria-label',lives+' of 3 shields remaining');}
  function showOverlay(label,heading,copy,button){overlay.hidden=false;eyebrow.textContent=label;title.textContent=heading;message.textContent=copy;startButton.textContent=button;}
  function hideOverlay(){overlay.hidden=true;}
  function start(){cancelAnimationFrame(raf);reset();state='running';pauseButton.disabled=false;pauseButton.textContent='Pause';hideOverlay();status.textContent='Mission underway. Dodge the asteroids!';last=0;raf=requestAnimationFrame(loop);}
  function pause(){if(state==='running'){state='paused';cancelAnimationFrame(raf);pauseButton.textContent='Resume';showOverlay('MISSION PAUSED','Take a breather, pilot.','Your score is '+score+'. Resume when you are ready.','Resume mission');status.textContent='Mission paused.';}else if(state==='paused'){state='running';pauseButton.textContent='Pause';hideOverlay();last=0;raf=requestAnimationFrame(loop);status.textContent='Back in orbit. Keep moving!';}}
  function finish(won){if(state!=='running')return;state=won?'won':'over';cancelAnimationFrame(raf);pauseButton.disabled=true;const finalScore=score;if(finalScore>best){best=finalScore;localStorage.setItem('spaceDodgeBest',String(best));bestEl.textContent=String(best);}if(won){showOverlay('MISSION COMPLETE','You made it!','You survived the asteroid field and scored '+score+' points. Stellar flying!','Play again →');status.textContent='Mission complete! Final score '+score+'.';}else{showOverlay('SHIP DISABLED','Mission over','You scored '+score+' points. Watch the asteroid patterns and give it another try.','Try again ↻');status.textContent='Ship disabled. Final score '+score+'.';}}
  function spawnAsteroid(){const r=17+Math.random()*22;rocks.push({x:35+Math.random()*(W-70),y:-r,r,vy:170+Math.random()*100+elapsed*3,vx:(Math.random()-.5)*65,spin:Math.random()*6,rot:(Math.random()-.5)*2});spawnRock=Math.max(.28,.82-elapsed*.006)+Math.random()*.38;}
  function hit(a,b,pad=0){return Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r-pad;}
  function update(dt){
    const previousElapsed=elapsed;
    elapsed+=dt;
    // Award survival points from elapsed-time milestones, not per-frame rounding.
    // This reliably awards 2 points per second across variable frame rates.
    score+=Math.floor(elapsed*2)-Math.floor(previousElapsed*2);
    spawnRock-=dt;spawnOrb-=dt;if(spawnRock<=0)spawnAsteroid();if(spawnOrb<=0)spawnOrbFn();const direction=Number(right||keys.ArrowRight||keys.KeyD)-Number(left||keys.ArrowLeft||keys.KeyA);if(direction!==0){pointerActive=false;ship.x+=direction*ship.speed*dt;}else if(pointerActive){ship.x+=(targetX-ship.x)*Math.min(1,dt*12);}ship.x=Math.max(28,Math.min(W-28,ship.x));
    for(const rock of rocks){rock.y+=rock.vy*dt;rock.x+=rock.vx*dt;rock.spin+=rock.rot*dt;}
    for(const orb of orbs){orb.y+=orb.vy*dt;orb.phase+=dt*4;}
    for(let i=rocks.length-1;i>=0;i--){const rock=rocks[i];if(hit(ship,rock,4)){rocks.splice(i,1);lives--;status.textContent='Asteroid impact! '+lives+' shields left.';updateHud();if(lives<=0){finish(false);return;}}else if(rock.y-rock.r>H)rocks.splice(i,1);}
    for(let i=orbs.length-1;i>=0;i--){const orb=orbs[i];if(hit(ship,orb,-2)){orbs.splice(i,1);score+=25;status.textContent='Energy collected! +25 points.';}else if(orb.y-orb.r>H)orbs.splice(i,1);}
    updateHud();if(elapsed>=DURATION){elapsed=DURATION;updateHud();finish(true);}
  }
  function spawnOrbFn(){orbs.push({x:30+Math.random()*(W-60),y:-20,r:10,vy:150+elapsed*2,phase:0});spawnOrb=2.2+Math.random()*1.6;}
  function pathShip(){ctx.save();ctx.translate(ship.x,ship.y);ctx.shadowColor='#c8f36b';ctx.shadowBlur=22;ctx.fillStyle='#c8f36b';ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-32);ctx.lineTo(25,23);ctx.lineTo(0,14);ctx.lineTo(-25,23);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#8bd8ef';ctx.strokeStyle='#e7fbff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-5,8,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ff91ad';ctx.beginPath();ctx.moveTo(-9,23);ctx.lineTo(0,43+Math.sin(elapsed*24)*5);ctx.lineTo(9,23);ctx.closePath();ctx.fill();ctx.restore();}
  function draw(){playerShip.style.left=(ship.x/W*100)+'%';playerShip.style.top=(ship.y/H*100)+'%';ctx.clearRect(0,0,W,H);const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#111a35');bg.addColorStop(1,'#202747');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    for(const star of stars){ctx.globalAlpha=.35+.45*(.5+.5*Math.sin(elapsed*1.5+star.phase));ctx.fillStyle='#eaf4ff';ctx.beginPath();ctx.arc(star.x,(star.y+elapsed*(10+star.r*5))%(H+5),star.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    for(const rock of rocks){ctx.save();ctx.translate(rock.x,rock.y);ctx.rotate(rock.spin);ctx.fillStyle='#a5abc0';ctx.strokeStyle='#d4d9e8';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=rock.r*(.78+(i%3)*.1);if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#707b98';ctx.beginPath();ctx.arc(-rock.r*.2,-rock.r*.1,rock.r*.2,0,Math.PI*2);ctx.fill();ctx.restore();}
    for(const orb of orbs){ctx.save();ctx.translate(orb.x,orb.y);ctx.shadowColor='#c8f36b';ctx.shadowBlur=18;ctx.fillStyle='#c8f36b';ctx.beginPath();ctx.arc(0,0,orb.r+Math.sin(orb.phase)*2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3,-3,3,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.fillStyle='#c8f36b';ctx.font='bold 13px Arial';ctx.fillText('SURVIVE THE FIELD',22,30);
  }
  function loop(timestamp){if(state!=='running')return;if(!last)last=timestamp;const dt=Math.min((timestamp-last)/1000,.035);last=timestamp;update(dt);draw();if(state==='running')raf=requestAnimationFrame(loop);}
  startButton.addEventListener('click',()=>{if(state==='paused')pause();else start();});
  pauseButton.addEventListener('click',pause);restartButton.addEventListener('click',start);
  function setDirection(which,value){if(which==='left')left=value;else right=value;}
  for(const [button,which] of [[leftButton,'left'],[rightButton,'right']]){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);setDirection(which,true);});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>setDirection(which,false));}
  function setPointerTarget(e){const rect=canvas.getBoundingClientRect();targetX=Math.max(28,Math.min(W-28,(e.clientX-rect.left)/rect.width*W));pointerActive=true;}canvas.addEventListener('pointerdown',e=>{if(state!=='running')return;setPointerTarget(e);if(e.pointerType!=='mouse')canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(state!=='running')return;if(e.pointerType==='mouse'||e.pointerType==='touch'||e.pointerType==='pen')setPointerTarget(e);});canvas.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')pointerActive=false;});canvas.addEventListener('pointercancel',()=>{pointerActive=false;});canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')pointerActive=false;});
  document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft'||e.code==='ArrowRight'||e.code==='KeyA'||e.code==='KeyD'){keys[e.code]=true;pointerActive=false;}if((e.code==='KeyP'||e.code==='Escape')&&state==='running')pause();if(e.code==='Enter'&&(state==='ready'||state==='over'||state==='won'))start();});
  document.addEventListener('keyup',e=>{keys[e.code]=false;});
  window.addEventListener('blur',()=>{left=false;right=false;keys={};if(state==='running')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});
  reset();showOverlay('MISSION CONTROL','Ready for launch?','Move left and right to dodge the incoming asteroids. Collect glowing energy orbs for bonus points. Survive for 60 seconds to complete your mission.','Start mission →');
})();