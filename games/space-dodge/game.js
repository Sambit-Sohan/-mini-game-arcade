(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ui = {
    timer: $('timer'), score: $('score'), lives: $('lives'), best: $('bestScore'),
    overlay: $('overlay'), eyebrow: $('overlayEyebrow'), title: $('overlayTitle'),
    message: $('overlayText'), start: $('startButton'), pause: $('pauseButton'),
    restart: $('restartButton'), status: $('gameStatus'),
    left: $('leftButton'), right: $('rightButton')
  };

  const WIDTH = 900;
  const HEIGHT = 520;
  const MISSION_SECONDS = 60;
  const ship = { x: WIDTH / 2, y: HEIGHT - 72, targetX: WIDTH / 2, targetY: HEIGHT - 72, radius: 19 };
  let mode = 'ready';
  let previousTime = 0;
  let elapsed = 0;
  let score = 0;
  let shields = 3;
  let asteroids = [];
  let energy = [];
  let stars = [];
  let asteroidClock = 0.5;
  let energyClock = 1.5;
  let animationId = 0;
  let pointerDown = false;
  const keys = Object.create(null);
  let best = Number(localStorage.getItem('spaceDodgeBest') || 0);
  ui.best.textContent = String(best);

  for (let i = 0; i < 90; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, size: 0.7 + Math.random() * 1.4, phase: Math.random() * 6 });
  }

  function updateHud() {
    ui.timer.textContent = Math.ceil(Math.max(0, MISSION_SECONDS - elapsed)) + 's';
    ui.score.textContent = String(score);
    ui.lives.textContent = '♥ '.repeat(shields).trim() + '♡ '.repeat(3 - shields).trim();
    ui.lives.setAttribute('aria-label', shields + ' of 3 shields remaining');
  }

  function showOverlay(label, heading, copy, buttonText) {
    ui.overlay.hidden = false;
    ui.eyebrow.textContent = label;
    ui.title.textContent = heading;
    ui.message.textContent = copy;
    ui.start.textContent = buttonText;
  }

  function resetGame() {
    elapsed = 0;
    score = 0;
    shields = 3;
    asteroids = [];
    energy = [];
    asteroidClock = 0.5;
    energyClock = 1.5;
    ship.x = WIDTH / 2;
    ship.y = HEIGHT - 72;
    ship.targetX = ship.x;
    ship.targetY = ship.y;
    pointerDown = false;
    for (const key of Object.keys(keys)) delete keys[key];
    updateHud();
    render();
  }

  function startGame() {
    cancelAnimationFrame(animationId);
    resetGame();
    mode = 'playing';
    ui.pause.disabled = false;
    ui.pause.textContent = 'Pause';
    ui.overlay.hidden = true;
    ui.status.textContent = 'Mission underway. Move your pointer or finger to steer!';
    previousTime = 0;
    animationId = requestAnimationFrame(frame);
  }

  function pauseGame() {
    if (mode === 'playing') {
      mode = 'paused';
      cancelAnimationFrame(animationId);
      ui.pause.textContent = 'Resume';
      showOverlay('MISSION PAUSED', 'Take a breather, pilot.', 'Your score is ' + score + '. Resume when ready.', 'Resume mission');
      ui.status.textContent = 'Mission paused.';
    } else if (mode === 'paused') {
      mode = 'playing';
      ui.pause.textContent = 'Pause';
      ui.overlay.hidden = true;
      previousTime = 0;
      animationId = requestAnimationFrame(frame);
      ui.status.textContent = 'Back in orbit. Keep moving!';
    }
  }

  function finishGame(won) {
    if (mode !== 'playing') return;
    mode = won ? 'won' : 'over';
    cancelAnimationFrame(animationId);
    ui.pause.disabled = true;
    if (score > best) {
      best = score;
      localStorage.setItem('spaceDodgeBest', String(best));
      ui.best.textContent = String(best);
    }
    if (won) {
      showOverlay('MISSION COMPLETE', 'You made it!', 'You survived the asteroid field and scored ' + score + ' points.', 'Play again');
      ui.status.textContent = 'Mission complete! Final score ' + score + '.';
    } else {
      showOverlay('SHIP DISABLED', 'Mission over', 'You scored ' + score + ' points. Try again and watch the asteroid patterns.', 'Try again');
      ui.status.textContent = 'Ship disabled. Final score ' + score + '.';
    }
  }

  function spawnAsteroid() {
    const radius = 16 + Math.random() * 20;
    asteroids.push({
      x: radius + Math.random() * (WIDTH - radius * 2),
      y: -radius,
      radius,
      speed: 145 + Math.random() * 95 + elapsed * 2.2,
      drift: (Math.random() - 0.5) * 55,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 1.8
    });
    asteroidClock = Math.max(0.3, 0.85 - elapsed * 0.006) + Math.random() * 0.35;
  }

  function spawnEnergy() {
    energy.push({ x: 25 + Math.random() * (WIDTH - 50), y: -18, radius: 10, speed: 135 + elapsed, phase: 0 });
    energyClock = 2.5 + Math.random() * 1.5;
  }

  function circlesTouch(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
  }

  function update(dt) {
    elapsed += dt;
    score += Math.floor(elapsed * 2) - Math.floor((elapsed - dt) * 2);

    const horizontal = Number(keys.ArrowRight || keys.KeyD) - Number(keys.ArrowLeft || keys.KeyA);
    const vertical = Number(keys.ArrowDown || keys.KeyS) - Number(keys.ArrowUp || keys.KeyW);
    if (horizontal || vertical) {
      ship.targetX += horizontal * 390 * dt;
      ship.targetY += vertical * 330 * dt;
    }

    ship.targetX = Math.max(25, Math.min(WIDTH - 25, ship.targetX));
    ship.targetY = Math.max(42, Math.min(HEIGHT - 35, ship.targetY));

    // Frame-rate-independent easing: the ship glides towards its target every frame.
    const smoothing = 1 - Math.exp(-10 * dt);
    ship.x += (ship.targetX - ship.x) * smoothing;
    ship.y += (ship.targetY - ship.y) * smoothing;

    asteroidClock -= dt;
    energyClock -= dt;
    if (asteroidClock <= 0) spawnAsteroid();
    if (energyClock <= 0) spawnEnergy();

    for (const rock of asteroids) {
      rock.y += rock.speed * dt;
      rock.x += rock.drift * dt;
      rock.angle += rock.spin * dt;
      if (rock.x < rock.radius || rock.x > WIDTH - rock.radius) rock.drift *= -1;
    }
    for (const orb of energy) {
      orb.y += orb.speed * dt;
      orb.phase += dt * 5;
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (circlesTouch(ship, asteroids[i])) {
        asteroids.splice(i, 1);
        shields--;
        ui.status.textContent = 'Asteroid impact! ' + shields + ' shields left.';
        updateHud();
        if (shields <= 0) { finishGame(false); return; }
      } else if (asteroids[i].y - asteroids[i].radius > HEIGHT) {
        asteroids.splice(i, 1);
      }
    }

    for (let i = energy.length - 1; i >= 0; i--) {
      if (circlesTouch(ship, energy[i])) {
        energy.splice(i, 1);
        score += 25;
        ui.status.textContent = 'Energy collected! +25 points.';
      } else if (energy[i].y - energy[i].radius > HEIGHT) {
        energy.splice(i, 1);
      }
    }

    updateHud();
    if (elapsed >= MISSION_SECONDS) {
      elapsed = MISSION_SECONDS;
      updateHud();
      finishGame(true);
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.shadowColor = '#c8f36b';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#c8f36b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(21, 20);
    ctx.lineTo(0, 12);
    ctx.lineTo(-21, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8bd8ef';
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff91ad';
    ctx.beginPath();
    ctx.moveTo(-7, 20);
    ctx.lineTo(0, 34 + Math.sin(elapsed * 22) * 4);
    ctx.lineTo(7, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#111a35');
    gradient.addColorStop(1, '#202747');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of stars) {
      ctx.globalAlpha = 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(elapsed + star.phase));
      ctx.fillStyle = '#eaf4ff';
      ctx.beginPath();
      ctx.arc(star.x, (star.y + elapsed * 13) % HEIGHT, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const rock of asteroids) {
      ctx.save();
      ctx.translate(rock.x, rock.y);
      ctx.rotate(rock.angle);
      ctx.fillStyle = '#a5abc0';
      ctx.strokeStyle = '#e0e5f2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9;
        const radius = rock.radius * (0.78 + (i % 3) * 0.09);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    for (const orb of energy) {
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.shadowColor = '#c8f36b';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#c8f36b';
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius + Math.sin(orb.phase) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawShip();
    ctx.fillStyle = '#c8f36b';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('SURVIVE THE FIELD', 22, 28);
  }

  function frame(timestamp) {
    if (mode !== 'playing') return;
    if (!previousTime) previousTime = timestamp;
    const dt = Math.min((timestamp - previousTime) / 1000, 0.04);
    previousTime = timestamp;
    update(dt);
    render();
    if (mode === 'playing') animationId = requestAnimationFrame(frame);
  }

  function setTargetFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    ship.targetX = Math.max(25, Math.min(WIDTH - 25, (event.clientX - rect.left) * scaleX));
    ship.targetY = Math.max(42, Math.min(HEIGHT - 35, (event.clientY - rect.top) * scaleY));
  }

  canvas.addEventListener('pointerdown', event => {
    if (mode !== 'playing') return;
    pointerDown = true;
    canvas.setPointerCapture(event.pointerId);
    setTargetFromPointer(event);
    event.preventDefault();
  });

  canvas.addEventListener('pointermove', event => {
    if (mode !== 'playing') return;
    if (event.pointerType === 'mouse' || pointerDown) setTargetFromPointer(event);
  });

  function releasePointer() { pointerDown = false; }
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('lostpointercapture', releasePointer);

  function setButtonDirection(button, key) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      keys[key] = true;
      button.setPointerCapture(event.pointerId);
    });
    const release = () => { keys[key] = false; };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }
  setButtonDirection(ui.left, 'ArrowLeft');
  setButtonDirection(ui.right, 'ArrowRight');

  document.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(event.code)) keys[event.code] = true;
    if ((event.code === 'KeyP' || event.code === 'Escape') && mode === 'playing') pauseGame();
    if (event.code === 'Enter' && ['ready', 'over', 'won'].includes(mode)) startGame();
  });
  document.addEventListener('keyup', event => { keys[event.code] = false; });
  window.addEventListener('blur', () => {
    for (const key of Object.keys(keys)) keys[key] = false;
    pointerDown = false;
  });

  ui.start.addEventListener('click', () => {
    if (mode === 'paused') pauseGame(); else startGame();
  });
  ui.pause.addEventListener('click', pauseGame);
  ui.restart.addEventListener('click', startGame);

  resetGame();
  showOverlay('MISSION CONTROL', 'Ready for launch?', 'Move your mouse or drag your finger inside the playfield to steer in any direction. You can also use the arrow keys or WASD. Dodge asteroids and collect energy orbs for 60 seconds.', 'Start mission');
})();