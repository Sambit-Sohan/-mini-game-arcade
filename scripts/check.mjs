import { readFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'index.html', 'site.css', 'site.js', 'privacy.html', 'terms.html',
  'games/fruit-slice/index.html', 'games/fruit-slice/game.css',
  'games/fruit-slice/game.js', 'games/memory-match/index.html',
  'games/memory-match/game.css', 'games/memory-match/game.js', 'games/color-sort/index.html', 'games/color-sort/game.css', 'games/color-sort/game.js', 'games/jump-runner/index.html', 'games/jump-runner/game.css', 'games/jump-runner/game.js',
  'assets/fruit-slice.svg', 'assets/memory-match.svg', 'assets/color-sort.svg', 'assets/jump-runner.svg', 'assets/favicon.svg'
];
for (const file of requiredFiles) await access(join(root, file));

const htmlFiles = ['index.html', 'privacy.html', 'terms.html', 'games/fruit-slice/index.html', 'games/memory-match/index.html', 'games/color-sort/index.html', 'games/jump-runner/index.html'];
const problems = [];
for (const file of htmlFiles) {
  const source = await readFile(join(root, file), 'utf8');
  if (!/<!doctype html>/i.test(source)) problems.push(`${file}: missing HTML doctype`);
  if (!/<html lang="en">/i.test(source)) problems.push(`${file}: missing document language`);
  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) continue;
    const path = value.split(/[?#]/, 1)[0];
    if (!path) continue;
    try { await access(resolve(dirname(join(root, file)), path)); }
    catch { problems.push(`${file}: broken local link or asset: ${value}`); }
  }
}
const home = await readFile(join(root, 'index.html'), 'utf8');
const fruit = await readFile(join(root, 'games/fruit-slice/index.html'), 'utf8');
for (const token of ['href="#games"', 'href="#about"', 'href="#contact"', 'href="privacy.html"', 'href="terms.html"', 'href="games/fruit-slice/"', 'assets/fruit-slice.svg', 'href="games/memory-match/"', 'assets/memory-match.svg', 'href="games/color-sort/"', 'assets/color-sort.svg', 'href="games/jump-runner/"', 'assets/jump-runner.svg']) {
  if (!home.includes(token)) problems.push(`Homepage missing required content/link: ${token}`);
}
for (const token of ['id="gameCanvas"', 'id="startButton"', 'id="pauseButton"', 'id="restartButton"', 'id="resumeButton"', 'id="soundToggle"', 'id="difficultySelect"', 'src="game.js"', 'href="game.css"']) {
  if (!fruit.includes(token)) problems.push(`Fruit Slice page missing game control/asset: ${token}`);
}
const fruitScript = await readFile(join(root, 'games/fruit-slice/game.js'), 'utf8');
const fruitCss = await readFile(join(root, 'games/fruit-slice/game.css'), 'utf8');
for (const token of ['easy:', 'normal:', 'hard:', 'function setDifficulty(', 'bombChance', 'config.spawnBase']) {
  if (!fruitScript.includes(token)) problems.push(`Fruit Slice missing difficulty behavior: ${token}`);
}
if (!fruitCss.includes('.difficulty-picker')) problems.push('Fruit Slice difficulty selector styling is missing');

const colorPage = await readFile(join(root, 'games/color-sort/index.html'), 'utf8');
const colorScript = await readFile(join(root, 'games/color-sort/game.js'), 'utf8');
const colorCss = await readFile(join(root, 'games/color-sort/game.css'), 'utf8');
for (const token of ['id="tubeBoard"', 'id="timer"', 'id="moves"', 'id="undoButton"', 'id="restartButton"', 'id="nextButton"', 'src="game.js"', 'href="game.css"']) {
  if (!colorPage.includes(token)) problems.push(`Color Sort page missing required control: ${token}`);
}
for (const token of ['function makePuzzle(', 'function pour(', 'function chooseTube(', 'function win(', 'function lose(']) {
  if (!colorScript.includes(token)) problems.push(`Color Sort gameplay missing required behavior: ${token}`);
}
if (!colorCss.includes('@media(max-width:560px)') || !colorCss.includes('@media(max-width:850px)')) problems.push('Color Sort is missing mobile/tablet responsive breakpoints');

const memoryPage = await readFile(join(root, 'games/memory-match/index.html'), 'utf8');
const memoryScript = await readFile(join(root, 'games/memory-match/game.js'), 'utf8');
for (const token of ['id="board"', 'id="timer"', 'id="moves"', 'id="restartButton"', 'id="startButton"', 'id="endOverlay"', 'src="game.js"', 'href="game.css"']) {
  if (!memoryPage.includes(token)) problems.push(`Memory Match page missing required control: ${token}`);
}
for (const token of ['function shuffle(', 'function startGame(', 'function flipCard(', 'function finishGame(', 'function bestKey(', 'pairs:16', 'memoryMatchBestMovesLevel', 'aria-label']) {
  if (!memoryScript.includes(token)) problems.push(`Memory Match gameplay missing required behavior: ${token}`);
}
const runnerPage = await readFile(join(root, 'games/jump-runner/index.html'), 'utf8');
const runnerScript = await readFile(join(root, 'games/jump-runner/game.js'), 'utf8');
const runnerCss = await readFile(join(root, 'games/jump-runner/game.css'), 'utf8');
for (const token of ['id="gameCanvas"', 'id="distance"', 'id="stars"', 'id="pauseButton"', 'id="restartButton"', 'id="jumpButton"', 'id="startButton"', 'src="game.js"', 'href="game.css"']) {
  if (!runnerPage.includes(token)) problems.push(`Jump Runner page missing required control: ${token}`);
}
for (const token of ['function start(', 'function jump(', 'function update(', 'function end(', 'function spawnObstacle(', 'function spawnStar(', 'localStorage.setItem']) {
  if (!runnerScript.includes(token)) problems.push(`Jump Runner gameplay missing required behavior: ${token}`);
}
if (!runnerScript.includes("e.code==='Space'") || !runnerScript.includes("e.code==='ArrowUp'") || !runnerScript.includes("addEventListener('pointerdown'")) problems.push('Jump Runner is missing keyboard/touch input support');
if (!runnerCss.includes('@media(max-width:650px)')) problems.push('Jump Runner is missing mobile responsive breakpoint');
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(home + fruit + memoryPage + colorPage)) problems.push('Unexpected remote font dependency in page markup');
for (const file of ['site.js', 'games/fruit-slice/game.js', 'games/memory-match/game.js', 'games/color-sort/game.js', 'games/jump-runner/game.js', 'scripts/build.mjs']) {
  const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`${file}: JavaScript syntax error: ${result.stderr}`);
}
if (problems.length) {
  console.error('Validation failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`Passed: ${requiredFiles.length} required files exist; ${htmlFiles.length} HTML pages have valid local links/assets; Fruit Slice, Memory Match, Color Sort and Jump Runner controls, gameplay hooks, responsive breakpoints, and JavaScript syntax verified.`);
