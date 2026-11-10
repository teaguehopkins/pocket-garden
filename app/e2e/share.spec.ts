import { expect, test } from '@playwright/test';
import { encodeLink } from '../src/core/link';
import { newRun } from '../src/core/run';
import { PLOT_WISHES, poolAt } from '../src/core/content/progress';
import { P1_FEATURES } from '../src/core/types';
import { freshOnLane, step } from './helpers';

test('a friend link opens the same garden and leaves the Lane alone', async ({ page }) => {
  const link = { seed: 4242, plot: 'brook', daily: false, stars: 6, features: P1_FEATURES, score: 150, won: true };
  const expected = newRun({ seed: 4242, features: P1_FEATURES, plot: 'brook', wishes: PLOT_WISHES.brook, pool: poolAt(6) });
  await freshOnLane(page);
  await page.goto(`/?g=${encodeLink(link)}`);
  await expect(page.getByText('A friend shared a garden')).toBeVisible();
  expect(page.url()).not.toContain('?g=');
  await page.getByRole('button', { name: 'Play it' }).click();
  await expect(page.getByText('The Brook').first()).toBeVisible();
  const offered = await page.locator('.offer b').evaluateAll((els) => els.map((e) => e.firstChild?.textContent?.trim()));
  const { SPECIES } = await import('../src/core/content/species');
  expect(offered).toEqual(expected.offer.map((k) => SPECIES[k].name));
  let n = 0;
  while ((await step(page)) && n < 80) n++;
  await expect(page.locator('.versus')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the Lane' }).click();
  await expect(page.locator('.summary .stars')).toHaveText('★ 0');
});

test('share draws the garden as a picture', async ({ page }) => {
  await freshOnLane(page);
  await page.locator('.lane .btn', { hasText: 'Plant' }).first().click();
  let n = 0;
  while ((await step(page)) && n < 80) n++;
  await page.evaluate(() => { Object.defineProperty(navigator, 'share', { value: undefined }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) } }); });
  await page.getByRole('button', { name: 'Share garden' }).click();
  const img = page.locator('.shot img');
  await expect(img).toBeVisible();
  expect(await img.evaluate((e: HTMLImageElement) => [e.naturalWidth, e.naturalHeight])).toEqual([1080, 1350]);
  const href = await page.locator('.shot').getAttribute('href');
  const b64 = await page.evaluate(async (u) => {
    const b = await (await fetch(u!)).blob();
    return await new Promise<string>((r) => { const f = new FileReader(); f.onload = () => r(String(f.result)); f.readAsDataURL(b); });
  }, href);
  const fs = await import('node:fs');
  fs.writeFileSync(`test-results/share-${test.info().project.name}.png`, Buffer.from(b64.split(',')[1], 'base64'));
});
