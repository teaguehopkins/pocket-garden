import { expect, test } from '@playwright/test';

test('installable and plays offline (production build)', async ({ page, context }) => {
  await page.goto('/');
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    return href ? (await fetch(href)).json() : null;
  });
  expect(manifest).toMatchObject({ name: 'Pocket Garden', display: 'standalone' });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const i of manifest.icons) expect((await page.request.get(i.src)).ok()).toBe(true);
  // Wait for the service worker to take control, then go offline.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pocket Garden' })).toBeVisible();
  // Play a little offline.
  await page.locator('.offer').first().click();
  await expect(page.getByText('2 of 4')).toBeVisible();
  const fontOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('600 20px Fredoka'); });
  expect(fontOk).toBe(true);
  await context.setOffline(false);
});
