import { expect, test, type Page } from '@playwright/test';

const P1 = { bag: true, life: true, plots: true, tools: true, wishes: true, content: true };

async function toPlay(page: Page) {
  await page.goto('/');
  await page.evaluate((f) => {
    localStorage.clear();
    localStorage.setItem('pg3-features', JSON.stringify(f));
    localStorage.setItem('pg3-settings', JSON.stringify({ sound: false, haptics: false, theme: 'system' }));
  }, P1);
  await page.reload();
  for (let k = 0; k < 7; k++) await page.locator('.offer').first().click();
}

test('drag a packet onto a square to plant it', async ({ page }) => {
  await toPlay(page);
  const pk = page.getByTestId('packet').first();
  const target = page.locator('[data-cell]').filter({ hasNot: page.locator('.piece') }).nth(3);
  const a = (await pk.boundingBox())!;
  const b = (await target.boundingBox())!;
  const cell = await target.getAttribute('data-cell');
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  // The piece floats 56px above the finger, so aim below the square.
  for (let k = 1; k <= 10; k++) await page.mouse.move(a.x + a.width / 2 + ((b.x + b.width / 2 - a.x - a.width / 2) * k) / 10, a.y + a.height / 2 + ((b.y + b.height / 2 + 56 - a.y - a.height / 2) * k) / 10);
  await page.mouse.up();
  await expect(page.locator(`[data-cell="${cell}"] .piece`)).toHaveCount(1);
});

test('tally runs smoothly with a 4x slower CPU', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await toPlay(page);
  const cdp = await page.context().newCDPSession(page);
  for (let k = 0; k < 4; k++) {
    await page.getByTestId('packet').first().click();
    await page.locator('.cell.can').first().click();
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    const w = window as unknown as { frames_: number[] };
    w.frames_ = [];
    let last = performance.now();
    const tick = (t: number) => { w.frames_.push(t - last); last = t; if (w.frames_.length < 400) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.getByTestId('packet').first().click();
  await page.locator('.cell.can').first().click();
  await page.waitForTimeout(3000);
  const frames: number[] = await page.evaluate(() => (window as unknown as { frames_: number[] }).frames_.slice(5));
  const sorted = [...frames].sort((x, y) => x - y);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const median = sorted[Math.floor(sorted.length / 2)];
  console.log(`tally frames (4x CPU): n=${frames.length} median=${median.toFixed(1)}ms p95=${p95.toFixed(1)}ms long(>50ms)=${frames.filter((f) => f > 50).length}`);
  expect(median).toBeLessThan(20);
});
