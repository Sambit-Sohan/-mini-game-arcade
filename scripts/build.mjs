import { cp, mkdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const item of ['index.html','site.css','site.js','privacy.html','terms.html','ads.txt','assets','games']) {
  await cp(new URL(item, root), new URL(item, out), { recursive: true });
}
console.log('Static production site built in dist/.');