import { readFile, access } from 'node:fs/promises';
import { join, resolve, dirname, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'index.html', 'site.css', 'site.js', 'privacy.html', 'terms.html',
  'games/fruit-slice/index.html', 'games/fruit-slice/game.css',
  'games/fruit-slice/game.js', 'assets/fruit-slice.svg', 'assets/favicon.svg'
];
for (const file of requiredFiles) await access(join(root, file));

const htmlFiles = ['index.html', 'privacy.html', 'terms.html', 'games/fruit-slice/index.html'];
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
    const resolved = resolve(dirname(join(root, file)), path);
    try { await access(resolved); }
    catch { problems.push(`${file}: broken local link or asset: ${value}`); }
  }
}

const home = await readFile(join(root, 'index.html'), 'utf8');
const game = await readFile(join(root, 'games/fruit-slice/index.html'), 'utf8');
for (const token of ['href="#games"', 'href="#about"', 'href="#contact"', 'href="privacy.html"', 'href="terms.html"', 'href="games/fruit-slice/"', 'assets/fruit-slice.svg']) {
  if (!home.includes(token)) problems.push(`Homepage missing required content/link: ${token}`);
}
for (const token of ['id="gameCanvas"', 'id="startButton"', 'id="pauseButton"', 'id="restartButton"', 'id="resumeButton"', 'id="soundToggle"', 'src="game.js"', 'href="game.css"']) {
  if (!game.includes(token)) problems.push(`Fruit Slice page missing game control/asset: ${token}`);
}
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(home + game)) problems.push('Unexpected remote font dependency in page markup');

for (const file of ['site.js', 'games/fruit-slice/game.js', 'scripts/build.mjs']) {
  const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`${file}: JavaScript syntax error: ${result.stderr}`);
}

if (problems.length) {
  console.error('Validation failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`Passed: ${requiredFiles.length} required files exist; ${htmlFiles.length} HTML pages have valid local links/assets; game controls and JavaScript syntax verified.`);
