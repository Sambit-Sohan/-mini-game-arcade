# Mini Game Arcade

A lightweight, responsive static arcade website with three completed browser games: **Fruit Slice**, **Memory Match** and **Color Sort**. All games run entirely in the browser with no API keys, accounts, database or backend.

## Run locally

Requires Node.js 18+ and no package installation.

```bash
npm test
npm run build
```

To preview the production output, serve the `dist/` folder with any static server (for example, `npx serve dist`).

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the repository in Vercel.
3. Use Framework Preset `Other`, build command `npm run build`, and output directory `dist`. See [DEPLOYMENT.md](DEPLOYMENT.md).
4. Deploy. No environment variables, API keys, database or backend are required.

## Games

- **Fruit Slice** — choose Easy, Normal or Hard, swipe through fruit, build combos, avoid bombs, and play 60-second rounds with lives, pause/restart and sound controls. Difficulty changes fruit speed, spawn frequency and bomb frequency.
- **Memory Match** — progress through six increasingly difficult boards, from 6 to 16 pairs. Each level has its own timer and best-moves record, with restart, undo-free clean matching, win/time-expired states, and mouse/touch/keyboard controls.

## Add a new game

Only publish a card after its game page is implemented and tested.

1. Create `games/your-game/` with a self-contained HTML page, CSS and JavaScript. Use relative paths and provide a clear link back to `../../index.html`.
2. Make the game responsive, keyboard usable and accessible. Explain its controls on the game page.
3. Create an original thumbnail in `assets/` (SVG is a lightweight choice) or use media you have permission to use.
4. Add a game card to the `.game-grid` in root `index.html`, including meaningful alt text, an honest description, control details and a working Play link.
5. Add the page and assets to `scripts/check.mjs`.
6. Run `npm test` and `npm run build`. Test keyboard, touch/mouse, game-over and restart behavior before publishing.

The catalogue intentionally contains no placeholder cards for unfinished games.

## Project structure

- `index.html` — homepage and game catalogue.
- `games/fruit-slice/` — Fruit Slice page, styling and gameplay.
- `games/memory-match/` — Memory Match page, styling and six-level gameplay.
- `games/color-sort/` — Color Sort page, styling and gameplay.
- `privacy.html`, `terms.html` — policy pages.
- `assets/` — original SVG artwork and favicon.
- `site.css`, `site.js` — shared site styling and navigation.
- `scripts/` — dependency-free validation and production build.
- `dist/` — generated static production site.

## Before public launch

Replace `hello@minigamearcade.example` with an email address you control. Review the Privacy Policy and Terms against your hosting provider, jurisdiction and any future integrations.
