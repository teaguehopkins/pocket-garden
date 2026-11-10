// Renders public/icon.svg to the PNG sizes the web manifest needs. Run: node scripts/icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.1], ['apple-touch-icon.png', 180, 0]]) {
  await p.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - 2 * pad));
  await p.setContent(`<html><body style="margin:0;background:#cfe7f2;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await p.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname });
}
await b.close();
console.log('icons written');
