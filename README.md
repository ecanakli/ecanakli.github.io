# ecanakli.github.io

Portfolio site for Emre Çanaklı, Senior Unity Developer.

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

All copy is data. Editing the site means editing one of these, not the markup.

| File | Holds |
|------|-------|
| `src/data/site.js` | Profile, intro, metric tiles, stack groups |
| `src/data/games.js` | Shipped titles and what I owned on each |
| `src/data/systems.js` | The case studies, in full |
| `src/data/store-data.json` | App Store metadata, fetched once and committed |
| `public/media/` | App icons and screenshots, hosted locally on purpose |

Store media is committed rather than hot-linked. Listings get withdrawn, and
the site should not break when they do.

`src/data/systems.js` opens with the editing rule the case studies are held
to. Read it before adding one.
