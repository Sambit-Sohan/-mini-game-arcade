(() => {
'use strict';
const $=id=>document.getElementById(id);
const palette=['#ff8b9e','#ffd166','#78d6b0','#8ca8ff','#c49aff','#ffad68'];
const board=$('tubeBoard'),timerEl=$('timer'),movesEl=$('moves'),sortedEl=$('sorted'),statusEl=$('status');
let level=1,tubes=[],moves=0,seconds=180,clock=null,started=false,finished=false,selected=-1,history=[],colorCount=3,undoButton=$('undoButton');
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function formatTime(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function updateStats(){timerEl.textContent=formatTime(seconds);movesEl.textContent=moves;sortedEl.innerHTML=sortedCount()+' <small>/ '+colorCount+'</small>';undoButton.disabled=!history.length;}
function sortedCount(){return tubes.filter(t=>t.length===4&&t.every(c=>c===t[0])).length;}
function makePuzzle(){
 colorCount=Math.min(3+Math.floor((level-1)/2),palette.length);
 const layers=[];for(let c=0;c<colorCount;c++)for(let n=0;n<4;n++)layers.push(c);
 shuffle(layers);tubes=[];for(let i=0;i<colorCount;i++)tubes.push(layers.slice(i*4,i*4+4));
 tubes.push([]);if(level>=4)tubes.push([]);
 // Avoid a solved tube in the opening arrangement.
 if(tubes.slice(0,colorCount).some(t=>t.every(c=>c===t[0]))){return makePuzzle();}
}
function render(){
 board.replaceChildren();board.style.setProperty('--tube-count',tubes.length);
 tubes.forEach((tube,index)=>{
  const b=document.createElement('button');b.type='button';b.className='tube'+(selected===index?' selected':'')+(isSolved(tube)?' solved':'');
  b.setAttribute('aria-label','Tube '+(index+1)+', '+(tube.length? tube.length+' layers, top color '+colorName(tube[tube.length-1]):'empty')+(selected===index?', selected':''));
  b.setAttribute('aria-pressed',String(selected===index));b.dataset.index=index;
  const glass=document.createElement('span');glass.className='glass';
  tube.forEach((color,i)=>{const layer=document.createElement('span');layer.className='layer';layer.style.background=palette[color];layer.style.height=(100/4)+'%';layer.setAttribute('aria-hidden','true');glass.append(layer);});
  const cap=document.createElement('span');cap.className='tube-cap';cap.setAttribute('aria-hidden','true');b.append(cap,glass);
  b.addEventListener('click',()=>chooseTube(index));board.append(b);
 });
 updateStats();
}
function colorName(c){return ['coral','sunshine','mint','blue','violet','tangerine'][c]||'color';}
function isSolved(t){return t.length===4&&t.every(c=>c===t[0]);}
function pour(from,to){
 const a=tubes[from],b=tubes[to];if(!a.length||b.length===4)return false;
 const color=a[a.length-1];if(b.length&&b[b.length-1]!==color)return false;
 let count=0;while(a.length&&a[a.length-1]===color&&b.length<4){b.push(a.pop());count++;}
 if(!count)return false;
 moves++;return true;
}
function chooseTube(index){
 if(!started||finished)return;
 if(selected===-1){if(!tubes[index].length){statusEl.textContent='PICK A TUBE WITH COLOR FIRST';return;}selected=index;statusEl.textContent='NOW CHOOSE WHERE TO POUR';render();return;}
 if(selected===index){selected=-1;statusEl.textContent='SELECTION CLEARED';render();return;}
 const before=snapshot();if(pour(selected,index)){history.push(before);selected=-1;statusEl.textContent='NICE POUR!';render();if(sortedCount()===colorCount)win();}
 else{statusEl.textContent=tubes[index].length===4?'THAT TUBE IS FULL':'MATCH THE TOP COLOR';selected=tubes[index].length?index:-1;render();}
}
let lastMove=null;
function snapshot(){return tubes.map(t=>t.slice());}
function startGame(newLevel=level){
 clearInterval(clock);level=newLevel;moves=0;seconds=Math.max(90,180-(level-1)*10);selected=-1;history=[];finished=false;started=true;lastMove=null;
 makePuzzle();$('level').textContent=String(level).padStart(2,'0');$('startOverlay').classList.add('hidden');$('endOverlay').classList.add('hidden');statusEl.textContent='SELECT A TUBE TO BEGIN';render();
 clock=setInterval(()=>{if(!started||finished)return;seconds--;timerEl.textContent=formatTime(seconds);if(seconds<=0)lose();},1000);
}
function recordAndPour(from,to){const before=snapshot();if(pour(from,to)){history.push(before);lastMove=null;selected=-1;render();if(sortedCount()===colorCount)win();return true;}return false;}
function win(){finished=true;started=false;clearInterval(clock);$('endIcon').textContent='✦';$('endEyebrow').textContent='LEVEL COMPLETE';$('endTitle').textContent='Beautifully sorted!';$('endMessage').textContent='Every color found its place. Ready for a trickier board?';$('finalMoves').textContent=moves;$('finalTime').textContent=formatTime(seconds);$('nextButton').textContent='Next level →';$('nextButton').dataset.action='next';$('endOverlay').classList.remove('hidden');$('nextButton').focus();}
function lose(){finished=true;started=false;clearInterval(clock);$('endIcon').textContent='◷';$('endEyebrow').textContent='TIME IS UP';$('endTitle').textContent='Try another pour!';$('endMessage').textContent='You sorted '+sortedCount()+' of '+colorCount+' colors. Restart and try a new plan.';$('finalMoves').textContent=moves;$('finalTime').textContent='00:00';$('nextButton').textContent='Try again ↻';$('nextButton').dataset.action='retry';$('endOverlay').classList.remove('hidden');$('nextButton').focus();}
$('startButton').addEventListener('click',()=>startGame(1));
$('restartButton').addEventListener('click',()=>startGame(level));
$('nextButton').addEventListener('click',()=>startGame($('nextButton').dataset.action==='next'?level+1:level));
undoButton.addEventListener('click',()=>{if(!started||!history.length)return;tubes=history.pop();moves=Math.max(0,moves-1);selected=-1;statusEl.textContent='LAST POUR UNDONE';render();});
document.addEventListener('keydown',e=>{if(!started||finished)return;if(e.key==='Escape'&&selected!==-1){selected=-1;statusEl.textContent='SELECTION CLEARED';render();}});
makePuzzle();render();$('startOverlay').classList.remove('hidden');
})();