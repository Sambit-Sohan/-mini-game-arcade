# Vercel Deployment

## Project type

Mini Game Arcade is a dependency-free static HTML/CSS/JavaScript website. It is not a React, Next.js, Vite, or other framework application. The project root is the directory containing `package.json`, `index.html`, `scripts/`, `games/`, and `assets/`.

## Vercel project settings

When importing this repository into Vercel, use:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `./` (the repository root containing this `package.json`) |
| Install Command | Leave blank / use Vercel default; there are no npm dependencies |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Development Command | Leave blank |

If the repository contains this project inside a parent folder, set Root Directory to `mini-game-arcade` instead.

## Build and preview locally

Requires Node.js 18 or newer. From the project root:

```bash
npm test
npm run build
npx serve dist
```

The production build copies the static pages, game, scripts, styles and SVG assets into `dist/`. Vercel should publish the contents of `dist/`.

## Routes and rewrites

No client-side router or SPA fallback is used. Pages are ordinary static HTML files:

- `/` — homepage
- `/games/fruit-slice/` — playable game (`games/fruit-slice/index.html`)
- `/privacy.html` — privacy policy
- `/terms.html` — terms of use

Vercel serves the `index.html` inside the game directory automatically. No rewrite rules or `vercel.json` are required.

## Environment variables and secrets

The current site has no backend, external API integration, or environment-variable requirements. Do not add API keys or credentials to the source repository. The contact address in the homepage and legal pages is an example placeholder and should be replaced before launch.

## Pre-launch checklist

- Replace `hello@minigamearcade.example` with an address you control.
- Review the privacy policy and terms for your actual hosting setup and jurisdiction.
- Run `npm test` and `npm run build`.
- Preview the `dist/` output and test the game on desktop and mobile.
- Import the project into Vercel with the settings above. A successful local build does not mean the site has been deployed; verify the production URL after deploying.
