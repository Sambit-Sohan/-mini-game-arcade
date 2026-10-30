(() => {
  'use strict';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {
    score: $('score'), timer: $('timer'), lives: $('lives'), best: $('bestScore'),
    combo: $('comboNumber'), comboText: $('comboText'), comboFill: $('comboFill'),
    start: $('startOverlay'), pause: $('pauseOverlay'), over: $('gameOverOverlay'),
    final: $('finalScore'), newBest: $('newBest'), pauseButton: $('pauseButton'),
    sound: $('soundToggle'), soundIcon: $('soundIcon'), status: $('statusHint'),
    comboPop: $('comboPop')
  };
  const ROUND_SECONDS = 60;
  const FRUITS = [
    {emoji:'🍊',color:'#ff9e38',points:10}, {emoji:'🍉',color:'#ff6680',points:10},
    {emoji:'🍓',color:'#fa5b78',points:10}, {emoji:'🥝',color:'#b8d95d',points:10},
    {emoji:'🍋',color:'#f5dc55',points:10}, {emoji:'🍑',color:'#ffad8a',points:10},
    {emoji:'🍍',color:'#f3c75d',points:15}, {emoji:'🍇',color:'#a58be8',points:10}
  ];
  let width=0,height=0,dpr=1, state='ready', score=0, lives=3, timeLeft=ROUND_SECONDS;
  let best=Number(localStorage.getItem('fruitSliceBest') || 0), entities=[], particles=[], trail=[];
  let lastFrame=0, elapsed=0, spawnClock=0, lastSliceAt=0, combo=0, comboClock=0;
  let pointerDown=false, pointerId=null, lastPoint=null, soundOn=true, audioContext=null;
  let gameEndReason='time';
  ui.best.textContent=String(best).padStart(4,'0');

  function resize(){
    const rect=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    width=Math.max(1,rect.width); height=Math.max(1,rect.height);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  new ResizeObserver(resize).observe(canvas); resize();
  const rand=(a,b)=>Math.random()*(b-a)+a;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function sound(freq=420,duration=.07,type='sine',volume=.035){
    if(!soundOn)return;
    try{
      audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audioContext.state==='suspended') audioContext.resume();
      const osc=audioContext.createOscillator(), gain=audioContext.createGain();
      osc.type=type; osc.frequency.setValueAtTime(freq,audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(80,freq*.68),audioContext.currentTime+duration);
      gain.gain.setValueAtTime(volume,audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
      osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);
    }catch(_){/* Audio is optional; gameplay remains available. */}
  }
  function updateSoundButton(){
    ui.sound.setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');
    ui.soundIcon.innerHTML=soundOn?'<path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9a5 5 0 0 1 0 6M18.5 6.5a9 9 0 0 1 0 11"/>':'<path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="m17 9 5 6m0-6-5 6"/>';
  }
  ui.sound.addEventListener('click',()=>{soundOn=!soundOn;updateSoundButton();if(soundOn)sound(620,.06);}); updateSoundButton();
  function setState(next){state=next;ui.pauseButton.disabled=next!=='playing';ui.status.textContent=next==='playing'?'SWIPE TO SLICE':next==='paused'?'ROUND PAUSED':next==='over'?'ROUND COMPLETE':'SWIPE TO PLAY';}
  function updateHud(){
    ui.score.textContent=String(score).padStart(4,'0');
    ui.timer.innerHTML=`${Math.ceil(timeLeft)}<span>s</span>`;
    ui.timer.style.color=timeLeft<=10?'#ff8da5':'var(--lime)';
    ui.lives.textContent='♥ '.repeat(lives).trim()+'♡ '.repeat(3-lives).trim();
    ui.lives.setAttribute('aria-label',`${lives} of 3 lives remaining`);
    ui.combo.innerHTML=`${combo}<span>×</span>`;
    ui.comboFill.style.width=`${clamp(combo/8*100,0,100)}%`;
    ui.comboText.textContent=combo>=5?'On fire! Keep that streak alive.':combo>1?`${combo} slices chained. Keep it going!`:'Slice fruit in quick succession to build your streak.';
  }
  function reset(){score=0;lives=3;timeLeft=ROUND_SECONDS;entities=[];particles=[];trail=[];elapsed=0;spawnClock=.25;lastSliceAt=0;combo=0;comboClock=0;gameEndReason='time';updateHud();}
  function start(){reset();ui.start.classList.add('hidden');ui.pause.classList.add('hidden');ui.over.classList.add('hidden');setState('playing');lastFrame=performance.now();canvas.focus({preventScroll:true});sound(520,.09);}
  function pause(){if(state!=='playing')return;setState('paused');ui.pause.classList.remove('hidden');pointerDown=false;trail=[];}
  function resume(){if(state!=='paused')return;ui.pause.classList.add('hidden');setState('playing');lastFrame=performance.now();}
  function end(reason){if(state==='over')return;gameEndReason=reason;setState('over');pointerDown=false;trail=[];
    const isBest=score>best;if(isBest){best=score;localStorage.setItem('fruitSliceBest',String(best));ui.best.textContent=String(best).padStart(4,'0');}
    ui.final.textContent=String(score).padStart(4,'0');ui.newBest.classList.toggle('hidden',!isBest);
    $('gameOverTitle').textContent=reason==='bombs'?'Out of lives!':score>=500?'Slice superstar!':'Juicy effort!';
    $('gameOverMessage').textContent=reason==='bombs'?'Those bombs were tricky. Take a breath and go again.':score>=500?'A seriously juicy round. Can you beat that?':'Every slice counts. Ready for another round?';
    ui.over.classList.remove('hidden');sound(170,.22,'triangle',.045);updateHud();
  }
  function spawn(){
    const bomb=Math.random()<(elapsed>12?.13:.08);
    const fruit=FRUITS[Math.floor(Math.random()*FRUITS.length)];
    const radius=rand(22,31), x=rand(radius+12,width-radius-12);
    const y=height+radius+8, vx=rand(-125,125), vy=-rand(590,760)-Math.min(elapsed*2,100);
    entities.push({x,y,vx,vy,r:radius,rot:rand(-.5,.5),vr:rand(-2.4,2.4),bomb,fruit,alive:true,age:0});
  }
  function burst(x,y,color,bomb=false){
    const count=bomb?24:16;
    for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),speed=rand(65,260);particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:rand(2,5),life:rand(.28,.65),max:.65,color:bomb?'#ff927d':color,shape:Math.random()>.5?'circle':'spark'});}
  }
  function segmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;const t=len?clamp(((px-x1)*dx+(py-y1)*dy)/len,0,1):0;return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));}
  function sliceSegment(a,b){
    if(!a||!b)return;let hit=0;
    for(const e of entities){if(!e.alive)continue;if(segmentDistance(e.x,e.y,a.x,a.y,b.x,b.y)<e.r+11){
      e.alive=false;if(e.bomb){lives=Math.max(0,lives-1);burst(e.x,e.y,'#ff8c7c',true);sound(110,.2,'sawtooth',.06);combo=0;comboClock=0;if(lives===0)end('bombs');}
      else{const now=performance.now();combo=now-lastSliceAt<950?combo+1:1;lastSliceAt=now;comboClock=1.25;const multiplier=Math.min(5,Math.floor((combo-1)/2)+1);const points=e.fruit.points*multiplier;score+=points;hit++;burst(e.x,e.y,e.fruit.color);sound(400+Math.min(combo,8)*65,.065,'sine');if(combo>=2)showCombo(multiplier,combo);}
    }}
    if(hit)updateHud();
  }
  function showCombo(multiplier,count){const label=multiplier>1?`${multiplier}× MULTIPLIER!`:`${count}× COMBO!`;ui.comboPop.textContent=label;ui.comboPop.classList.remove('hidden');ui.comboPop.style.animation='none';void ui.comboPop.offsetWidth;ui.comboPop.style.animation='';}
  function position(ev){const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};}
  canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;if(e.pointerType==='mouse'&&e.button!==0)return;pointerDown=true;pointerId=e.pointerId;lastPoint=position(e);trail=[{...lastPoint,life:.18}];try{canvas.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();},{passive:false});
  canvas.addEventListener('pointermove',e=>{if(!pointerDown||e.pointerId!==pointerId||state!=='playing')return;const p=position(e);if(lastPoint){sliceSegment(lastPoint,p);trail.push({...p,life:.18});}lastPoint=p;e.preventDefault();},{passive:false});
  function release(e){if(pointerId!==null&&e.pointerId!==undefined&&e.pointerId!==pointerId)return;pointerDown=false;pointerId=null;lastPoint=null;}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  // Only the active game surface suppresses touch scrolling; the rest of the page remains navigable.
  canvas.addEventListener('touchmove',e=>{if(pointerDown&&state==='playing')e.preventDefault();},{passive:false});
  function drawFruit(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rot);if(e.bomb){
      ctx.shadowColor='#ff775f';ctx.shadowBlur=17;ctx.fillStyle='#263344';ctx.beginPath();ctx.arc(0,0,e.r*.88,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#74869b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ff8d75';ctx.beginPath();ctx.moveTo(-4,-e.r*.73);ctx.quadraticCurveTo(-12,-e.r-10,-3,-e.r-12);ctx.lineTo(3,-e.r*.7);ctx.fill();ctx.fillStyle='#fff1d9';ctx.font=`${e.r*1.05}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✹',0,1);
    }else{ctx.shadowColor=e.fruit.color;ctx.shadowBlur=16;ctx.font=`${e.r*2.05}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.fruit.emoji,0,1);}
    ctx.restore();}
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastFrame)/1000||0,.033);lastFrame=now;
    ctx.clearRect(0,0,width,height);
    if(state==='playing'){
      elapsed+=dt;timeLeft=Math.max(0,timeLeft-dt);spawnClock-=dt;
      if(spawnClock<=0){spawn();if(Math.random()<.27&&elapsed>5)spawn();spawnClock=Math.max(.38,.88-elapsed*.006)+rand(.02,.32);}
      for(const e of entities){e.age+=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=850*dt;e.rot+=e.vr*dt;}
      entities=entities.filter(e=>e.y<height+e.r+30&&e.alive);
      if(comboClock>0){comboClock-=dt;if(comboClock<=0){combo=0;updateHud();}}
      if(timeLeft<=0){timeLeft=0;updateHud();end('time');}
      if(Math.floor(timeLeft)!==Math.floor(timeLeft+dt))updateHud();
    }
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*dt;p.vx*=.985;}
    particles=particles.filter(p=>p.life>0);
    for(const e of entities)drawFruit(e);
    for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;if(p.shape==='spark'){ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillRect(-p.r*1.7,-1,p.r*3.4,2);}else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.restore();}
    for(const t of trail)t.life-=dt;trail=trail.filter(t=>t.life>0);
    if(trail.length>1){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];ctx.globalAlpha=clamp(b.life/.18,0,1)*.8;ctx.strokeStyle='#d6ff9a';ctx.lineWidth=2+b.life*16;ctx.shadowColor='#c7f36b';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}
  }
  requestAnimationFrame(frame);
  $('startButton').addEventListener('click',start);$('restartButton').addEventListener('click',start);$('restartSmall').addEventListener('click',start);$('pauseRestartButton').addEventListener('click',start);$('resumeButton').addEventListener('click',resume);ui.pauseButton.addEventListener('click',pause);
  document.addEventListener('keydown',e=>{if(e.code==='Enter'){if(state==='ready'||state==='over')start();else if(state==='paused')resume();}if(e.code==='Space'&&state==='playing'){e.preventDefault();pause();}else if(e.code==='Space'&&state==='paused'){e.preventDefault();resume();}if(e.key.toLowerCase()==='m'){soundOn=!soundOn;updateSoundButton();if(soundOn)sound(620,.06);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
  updateHud();setState('ready');
})();
