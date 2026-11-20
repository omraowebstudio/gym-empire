// Renders the app icon, adaptive icon layers, splash icon and favicon from SVG using the
// pre-installed Playwright Chromium. Run: node scripts/generate-icons.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'images');

const mark = (s = 1) => `
  <g transform="translate(512 540) scale(${s})">
    <path d="M -150 -210 L -170 -330 L -85 -260 L 0 -360 L 85 -260 L 170 -330 L 150 -210 Z" fill="#FFC83D" stroke="#B07A00" stroke-width="14" stroke-linejoin="round"/>
    <circle cx="0" cy="-330" r="18" fill="#FF5CC8"/>
    <rect x="-330" y="-22" width="660" height="44" rx="22" fill="#DDE3F2" stroke="#2A2F3B" stroke-width="10"/>
    <rect x="-300" y="-150" width="70" height="300" rx="22" fill="#2F7BFF" stroke="#0F2A7A" stroke-width="12"/>
    <rect x="-225" y="-115" width="56" height="230" rx="18" fill="#7B4DFF" stroke="#36198F" stroke-width="12"/>
    <rect x="230" y="-150" width="70" height="300" rx="22" fill="#2F7BFF" stroke="#0F2A7A" stroke-width="12"/>
    <rect x="169" y="-115" width="56" height="230" rx="18" fill="#7B4DFF" stroke="#36198F" stroke-width="12"/>
    <rect x="-288" y="-136" width="16" height="120" rx="8" fill="#fff" opacity="0.45"/>
    <text x="0" y="250" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="150" fill="#FFC83D" stroke="#7A4A00" stroke-width="10">GYM</text>
  </g>`;
const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3D2BB8"/><stop offset="1" stop-color="#0F1650"/></linearGradient>
<radialGradient id="r" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#5FA0FF" stop-opacity="0.55"/><stop offset="1" stop-color="#5FA0FF" stop-opacity="0"/></radialGradient></defs>
<rect width="1024" height="1024" fill="url(#g)"/><rect width="1024" height="1024" fill="url(#r)"/>`;

const svgs = {
  'icon.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${bg}${mark(1)}</svg>`],
  'android-icon-background.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${bg}</svg>`],
  'android-icon-foreground.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${mark(0.62)}</svg>`],
  'android-icon-monochrome.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><g style="filter:brightness(0) invert(1)">${mark(0.62)}</g></svg>`],
  'splash-icon.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${mark(1)}</svg>`],
  'favicon.png': [196, `<svg xmlns="http://www.w3.org/2000/svg" width="196" height="196" viewBox="0 0 1024 1024">${bg}${mark(1)}</svg>`],
};

(async () => {
  const b = await chromium.launch();
  for (const [name, [size, svg]] of Object.entries(svgs)) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(OUT, name), omitBackground: true });
    await p.close();
  }
  await b.close();
  console.log('icons written');
})();
