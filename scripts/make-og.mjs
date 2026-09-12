// Generates public/og.png, the preview card shown when the site's link is
// pasted into LinkedIn, Slack, a job application form or a message.
//
// Run it with:  npm run og
//
// The card is written as SVG and rasterised by sharp, so editing it means
// editing the text below. Two things to know before you do:
//
//   1. sharp renders SVG with SYSTEM fonts, not the site's web fonts. The
//      serif here is Georgia, which is close to Newsreader but not identical.
//      Naming "Newsreader" would silently fall back to something else.
//
//   2. Nothing on this card should be able to go out of date. No ratings, no
//      install counts, no shipped-title count, no game icons. A store listing
//      can be withdrawn and a count can change; a name and a role cannot.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "og.png");

const W = 1200;
const H = 630;

// Matches src/styles/global.css
const INK = "#0b0b0c";
const PAPER = "#e9e6e0";
const MUTED = "#827e78";
const ACCENT = "#d9a441";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="14%" cy="-10%" r="85%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.17" />
      <stop offset="100%" stop-color="${INK}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${INK}" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />

  <text x="600" y="250" text-anchor="middle"
        font-family="Georgia, serif" font-size="124" fill="${PAPER}">Portfolio</text>

  <line x1="430" y1="306" x2="770" y2="306" stroke="${ACCENT}" stroke-opacity="0.55" />

  <text x="600" y="372" text-anchor="middle"
        font-family="Georgia, serif" font-size="52" fill="${ACCENT}">Emre Çanaklı</text>

  <text x="600" y="438" text-anchor="middle"
        font-family="monospace" font-size="20" letter-spacing="4"
        fill="${MUTED}">SENIOR UNITY DEVELOPER · İZMİR</text>
</svg>`;

const info = await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log(`og.png written: ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
