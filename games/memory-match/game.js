(() => {
  'use strict';
  const symbols = [
    ['✦','star','star'],['●','circle','circle'],['◆','diamond','diamond'],['✿','flower','flower'],
    ['⬟','hexagon','hexagon'],['☾','moon','moon'],['♥','heart','heart'],['☀','sun','sun'],
    ['♣','clover','clover'],['✚','cross','cross'],['⬢','gem','gem'],['♫','music','music'],
    ['☂','umbrella','umbrella'],['❖','spark','spark'],['☯','yin yang','yin'],['♠','spade','spade']
  ].map(([symbol,label,color])=>({symbol,label,color}));
  const levels=[
    {pairs:6,time:90,columns:4},{pairs:8,time:110,columns:4},
    {pairs:10,time:130,columns:5},{pairs:12,time:150,columns:4},
    {pairs:14,time:170,columns:5},{pairs:16,time:190,columns:4}
  ];
  const $=id=>document.getElementById(id);
  const board=$('board'),timerDisplay=$('timer'),movesDisplay=$('moves'),pairsDisplay=$('pairs');
  const statusDisplay=$('boardStatus'),startOverlay=$('startOverlay'),endOverlay=$('endOverlay');
  const startButton=$('startButton'),restartButton=$('restartButton'),playAgainButton=$('playAgainButton');
  const bestMovesDisplay=$('bestMoves'),levelDisplay=$('level');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cards=[],firstCard=null,secondCard=null,lockBoard=true,moves=0,matchedPairs=0;
  let secondsLeft=90,intervalId=null,gameStarted=false,gameFinished=false,mismatchTimeout=null,currentLevel=1;
  const bestKey=level=>'memoryMatchBestMovesLevel'+level;
  function updateBest(){const best=Number(localStorage.getItem(bestKey(currentLevel)))||0;bestMovesDisplay.textContent=best?String(best):'—';}
  function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
  function createBoard(){
    const config=levels[currentLevel-1],deck=shuffle(symbols.slice(0,config.pairs).flatMap((item,pairId)=>[
      {...item,pairId},{...item,pairId}
    ]));
    cards=deck;board.replaceChildren();board.style.setProperty('--columns',config.columns);
    board.setAttribute('aria-label',config.pairs+' pairs of cards. Select two cards to find a match.');
    deck.forEach((card,index)=>{
      const button=document.createElement('button');button.type='button';button.className='memory-card';
      button.dataset.index=String(index);button.dataset.pair=String(card.pairId);
      button.setAttribute('aria-label','Card '+(index+1)+', face down');button.setAttribute('aria-pressed','false');
      const back=document.createElement('span');back.className='card-back';back.setAttribute('aria-hidden','true');back.textContent='✳';
      const face=document.createElement('span');face.className='card-face '+card.color;face.setAttribute('aria-hidden','true');face.textContent=card.symbol;
      button.append(back,face);button.addEventListener('click',()=>flipCard(button));board.append(button);
    });
  }
  function updateStats(){timerDisplay.innerHTML=secondsLeft+'<span>s</span>';movesDisplay.textContent=String(moves);pairsDisplay.innerHTML=matchedPairs+' <small>/ '+levels[currentLevel-1].pairs+'</small>';levelDisplay.textContent=String(currentLevel).padStart(2,'0');}
  function startGame(level=currentLevel){
    currentLevel=Math.max(1,Math.min(level,levels.length));clearInterval(intervalId);clearTimeout(mismatchTimeout);
    moves=0;matchedPairs=0;secondsLeft=levels[currentLevel-1].time;firstCard=null;secondCard=null;lockBoard=false;
    gameStarted=true;gameFinished=false;startOverlay.classList.add('hidden');endOverlay.classList.add('hidden');
    statusDisplay.textContent='FIND ALL '+levels[currentLevel-1].pairs+' PAIRS';updateBest();createBoard();updateStats();
    intervalId=window.setInterval(()=>{if(!gameStarted||gameFinished)return;secondsLeft=Math.max(0,secondsLeft-1);updateStats();if(secondsLeft===0)finishGame(false);},1000);
    const first=board.querySelector('.memory-card');if(first)first.focus({preventScroll:true});
  }
  function flipCard(button){
    if(!gameStarted||gameFinished||lockBoard||button.classList.contains('is-open')||button.classList.contains('is-matched'))return;
    const index=Number(button.dataset.index),card=cards[index];button.classList.add('is-open');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Card '+(index+1)+', '+card.label);
    if(!firstCard){firstCard=button;return;}
    secondCard=button;moves++;updateStats();lockBoard=true;
    if(firstCard.dataset.pair===secondCard.dataset.pair){
      firstCard.classList.add('is-matched');secondCard.classList.add('is-matched');firstCard.disabled=true;secondCard.disabled=true;
      firstCard.setAttribute('aria-label','Matched '+card.label);secondCard.setAttribute('aria-label','Matched '+card.label);
      matchedPairs++;updateStats();resetTurn();statusDisplay.textContent=matchedPairs===levels[currentLevel-1].pairs?'ALL PAIRS FOUND!':matchedPairs+' OF '+levels[currentLevel-1].pairs+' PAIRS FOUND';
      if(matchedPairs===levels[currentLevel-1].pairs)finishGame(true);
    }else{
      statusDisplay.textContent='NOT A MATCH — TRY AGAIN';
      mismatchTimeout=window.setTimeout(()=>{
        [firstCard,secondCard].forEach(cardButton=>{
          if(!cardButton)return;cardButton.classList.remove('is-open');cardButton.setAttribute('aria-pressed','false');
          const cardIndex=Number(cardButton.dataset.index);cardButton.setAttribute('aria-label','Card '+(cardIndex+1)+', face down');
        });
        resetTurn();statusDisplay.textContent='KEEP LOOKING';
      },reducedMotion?350:850);
    }
  }
  function resetTurn(){firstCard=null;secondCard=null;lockBoard=false;}
  function finishGame(won){
    if(gameFinished)return;gameFinished=true;gameStarted=false;clearInterval(intervalId);clearTimeout(mismatchTimeout);
    statusDisplay.textContent=won?'LEVEL CLEARED!':'TIME IS UP';
    $('endMark').textContent=won?'✦':'◷';$('endEyebrow').textContent=won?'LEVEL '+currentLevel+' COMPLETE':'TIME IS UP';
    $('endTitle').textContent=won?'Brilliant memory!':'Time flew by!';
    $('endMessage').textContent=won?(currentLevel===levels.length?'You conquered every level. The arcade champion!':'You found all '+levels[currentLevel-1].pairs+' pairs. Ready for the next challenge?'):'You found '+matchedPairs+' of '+levels[currentLevel-1].pairs+' pairs. Try again and beat the clock!';
    $('finalMoves').textContent=String(moves);$('finalTime').textContent=secondsLeft+'s';
    const key=bestKey(currentLevel),best=Number(localStorage.getItem(key))||0;
    if(won&&(!best||moves<best)){localStorage.setItem(key,String(moves));updateBest();}
    playAgainButton.textContent=won&&currentLevel<levels.length?'Next level →':won?'Play from level 1 ↻':'Retry level ↻';
    endOverlay.classList.remove('hidden');playAgainButton.focus({preventScroll:true});
  }
  startButton.addEventListener('click',()=>startGame(1));
  restartButton.addEventListener('click',()=>startGame(currentLevel));
  playAgainButton.addEventListener('click',()=>startGame(gameFinished&&matchedPairs===levels[currentLevel-1].pairs&&currentLevel<levels.length?currentLevel+1:gameFinished&&matchedPairs===levels[currentLevel-1].pairs?1:currentLevel));
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!gameStarted&&!gameFinished&&!startOverlay.classList.contains('hidden')){event.preventDefault();startGame(1);}
    else if(event.key==='Enter'&&gameFinished&&!endOverlay.classList.contains('hidden')){event.preventDefault();playAgainButton.click();}
  });
  createBoard();updateStats();updateBest();
})();