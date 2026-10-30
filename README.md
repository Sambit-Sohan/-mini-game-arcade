# Mini Game Arcade

A lightweight, responsive static arcade website. The catalogue currently contains one completed game: **Fruit Slice**. Its existing canvas gameplay, swipe controls, score/timer/lives, combos, bomb hazards, pause/restart, sound toggle and local best-score storage are kept on a dedicated playable page.

## Run locally

Requires Node.js 18+ and no package installation.

```bash
npm test
npm run build
```

To preview the production output, serve the `dist/` folder with any static server. For example:

```bash
npx serve dist
```

Or serve the project root while developing:

```bash
npx serve .
```

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the repository in Vercel.
3. Use Framework Preset `Other`, build command `npm run build`, and output directory `dist`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact settings. No `vercel.json` or route rewrite is required.
4. Deploy. No environment variables, API keys, database or backend are required.

## Add a new game

Only publish a card after its game page is implemented and tested.

1. Create `games/your-game/` and add a self-contained `index.html`, CSS, JavaScript and any permitted assets. Use relative paths and provide a clear link back to `../../index.html`.
2. Make the game responsive, keyboard usable and accessible. Explain its controls on the game page. Keep touch-scroll suppression scoped to the active play surface only.
3. Create an original thumbnail in `assets/` (SVG is a good lightweight choice) or use media you have permission to use.
4. Add one `<article class="game-card">` to the `.game-grid` in the root `index.html`. Include the thumbnail with meaningful alt text, game title, honest description, control/duration details and a Play link to `games/your-game/`.
5. Add the new page and assets to the required-file and link checks in `scripts/check.mjs`.
6. Run `npm test` and `npm run build`. Preview `dist/`, test the new game with keyboard and touch/mouse, and check the browser console before publishing.

There is intentionally no search or category filter while only one game is available. The catalogue does not contain placeholder cards for unfinished games.

## Project structure

- `index.html` — homepage, catalogue, About and Contact sections.
- `games/fruit-slice/index.html` — playable Fruit Slice game and control instructions.
- `games/fruit-slice/game.css`, `game.js` — game styling and gameplay.
- `privacy.html`, `terms.html` — policy pages.
- `assets/` — original SVG artwork and favicon.
- `site.css`, `site.js` — shared site styling and navigation.
- `scripts/` — dependency-free validation and production build.
- `dist/` — generated static production site.\n- `DEPLOYMENT.md` — verified Vercel project settings and deployment checklist.

## Before public launch

Replace `hello@minigamearcade.example` with an email address you control. Review the Privacy Policy and Terms against your actual hosting provider, jurisdiction and any future integrations. The site uses system font stacks and original SVG artwork; it does not need remote fonts, analytics, ad scripts, APIs or a backend.
