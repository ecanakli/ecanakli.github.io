# ecanakli.github.io

Portfolio site for Emre Çanaklı — Senior Unity Developer.

Built with [Astro](https://astro.build). Static output, no client framework.
Deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml`
on every push to `main`.

## Local

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Where the content lives

| File | Holds |
|------|-------|
| `src/data/site.js` | Profile, headline claim, metrics, stack |
| `src/data/games.js` | Shipped titles and what I owned on each |
| `src/data/systems.js` | Case-study summaries |
| `src/data/store-data.json` | App Store metadata, fetched once and committed |
| `public/media/` | App icons and screenshots, hosted locally on purpose |

Store media is committed rather than hot-linked. Listings get withdrawn — the
site should not break when they do.
