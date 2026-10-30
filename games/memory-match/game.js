(() => {
  'use strict';
  const symbols = [
    { symbol: '✦', label: 'star', color: 'star' },
    { symbol: '●', label: 'circle', color: 'circle' },
    { symbol: '◆', label: 'diamond', color: 'diamond' },
    { symbol: '✿', label: 'flower', color: 'flower' },
    { symbol: '⬟', label: 'hexagon', color: 'hexagon' },
    { symbol: '☾', label: 'moon', color: 'moon' }
  ];
  const $ = (id) => document.getElementById(id);
  const board = $('board'), timerDisplay = $('timer'), movesDisplay = $('moves'), pairsDisplay = $('pairs');
  const statusDisplay = $('boardStatus'), startOverlay = $('startOverlay'), endOverlay = $('endOverlay');
  const startButton = $('startButton'), restartButton = $('restartButton'), playAgainButton = $('playAgainButton');
  const bestMovesDisplay = $('bestMoves');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cards = [], firstCard = null, secondCard = null, lockBoard = true;
  let moves = 0, matchedPairs = 0, secondsLeft = 90, intervalId = null;
  let gameStarted = false, gameFinished = false, mismatchTimeout = null;
  let bestMoves = Number(localStorage.getItem('memoryMatchBestMoves')) || 0;
  bestMovesDisplay.textContent = bestMoves ? String(bestMoves) : '—';

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function createBoard() {
    const deck = shuffle(symbols.flatMap((item, pairId) => [
      { ...item, pairId, cardId: pairId + '-a' }, { ...item, pairId, cardId: pairId + '-b' }
    ]));
    cards = deck;
    board.replaceChildren();
    board.setAttribute('aria-label', 'Memory grid with six pairs. Select two cards to find a match.');
    deck.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'memory-card';
      button.dataset.index = String(index); button.dataset.pair = String(card.pairId);
      button.setAttribute('aria-label', 'Card ' + (index + 1) + ', face down');
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<span class="card-back" aria-hidden="true">✳</span><span class="card-face ' + card.color + '" aria-hidden="true">' + card.symbol + '</span>';
      button.addEventListener('click', () => flipCard(button));
      board.append(button);
    });
  }
  function updateStats() {
    timerDisplay.innerHTML = secondsLeft + '<span>s</span>';
    movesDisplay.textContent = String(moves);
    pairsDisplay.innerHTML = matchedPairs + ' <small>/ 6</small>';
  }
  function startGame() {
    clearInterval(intervalId); clearTimeout(mismatchTimeout);
    moves = 0; matchedPairs = 0; secondsLeft = 90;
    firstCard = null; secondCard = null; lockBoard = false;
    gameStarted = true; gameFinished = false;
    startOverlay.classList.add('hidden'); endOverlay.classList.add('hidden');
    statusDisplay.textContent = 'FIND ALL SIX PAIRS';
    createBoard(); updateStats();
    intervalId = window.setInterval(() => {
      if (!gameStarted || gameFinished) return;
      secondsLeft = Math.max(0, secondsLeft - 1); updateStats();
      if (secondsLeft === 0) finishGame(false);
    }, 1000);
    const first = board.querySelector('.memory-card');
    if (first) first.focus({ preventScroll: true });
  }
  function flipCard(button) {
    if (!gameStarted || gameFinished || lockBoard || button.classList.contains('is-open') || button.classList.contains('is-matched')) return;
    const index = Number(button.dataset.index), card = cards[index];
    button.classList.add('is-open'); button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', 'Card ' + (index + 1) + ', ' + card.label);
    if (!firstCard) { firstCard = button; return; }
    secondCard = button; moves += 1; updateStats(); lockBoard = true;
    if (firstCard.dataset.pair === secondCard.dataset.pair) {
      firstCard.classList.add('is-matched'); secondCard.classList.add('is-matched');
      firstCard.disabled = true; secondCard.disabled = true;
      firstCard.setAttribute('aria-label', 'Matched ' + card.label);
      secondCard.setAttribute('aria-label', 'Matched ' + card.label);
      matchedPairs += 1; pairsDisplay.innerHTML = matchedPairs + ' <small>/ 6</small>';
      resetTurn();
      statusDisplay.textContent = matchedPairs === 6 ? 'ALL PAIRS FOUND!' : matchedPairs + ' OF 6 PAIRS FOUND';
      if (matchedPairs === 6) finishGame(true);
    } else {
      statusDisplay.textContent = 'NOT A MATCH — TRY AGAIN';
      mismatchTimeout = window.setTimeout(() => {
        [firstCard, secondCard].forEach((cardButton) => {
          if (!cardButton) return;
          cardButton.classList.remove('is-open'); cardButton.setAttribute('aria-pressed', 'false');
          const cardIndex = Number(cardButton.dataset.index);
          cardButton.setAttribute('aria-label', 'Card ' + (cardIndex + 1) + ', face down');
        });
        resetTurn(); statusDisplay.textContent = 'KEEP LOOKING';
      }, reducedMotion ? 350 : 850);
    }
  }
  function resetTurn() { firstCard = null; secondCard = null; lockBoard = false; }
  function finishGame(won) {
    if (gameFinished) return;
    gameFinished = true; gameStarted = false;
    clearInterval(intervalId); clearTimeout(mismatchTimeout);
    statusDisplay.textContent = won ? 'BOARD CLEARED!' : 'TIME IS UP';
    $('endMark').textContent = won ? '✦' : '◷';
    $('endEyebrow').textContent = won ? 'BOARD CLEARED' : 'TIME IS UP';
    $('endTitle').textContent = won ? 'Brilliant memory!' : 'Time flew by!';
    $('endMessage').textContent = won ? 'You found every pair. Nice work!' : 'You found ' + matchedPairs + ' of 6 pairs. Give it another try!';
    $('finalMoves').textContent = String(moves); $('finalTime').textContent = secondsLeft + 's';
    if (won && (!bestMoves || moves < bestMoves)) {
      bestMoves = moves; localStorage.setItem('memoryMatchBestMoves', String(bestMoves));
      bestMovesDisplay.textContent = String(bestMoves);
    }
    endOverlay.classList.remove('hidden'); playAgainButton.focus({ preventScroll: true });
  }
  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', startGame);
  playAgainButton.addEventListener('click', startGame);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !gameStarted && !gameFinished && !startOverlay.classList.contains('hidden')) {
      event.preventDefault(); startGame();
    } else if (event.key === 'Enter' && gameFinished && !endOverlay.classList.contains('hidden')) {
      event.preventDefault(); startGame();
    }
  });
  createBoard(); updateStats();
})();