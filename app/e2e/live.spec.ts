import { expect, test } from '@playwright/test';
// Run on demand against the published site: LIVE_URL=https://.../ npx playwright test e2e/live.spec.ts --project pwa
const LIVE = process.env.LIVE_URL;
test('published site installs and plays offline', async ({ page, context }) => {
  test.skip(!LIVE, 'set LIVE_URL to run');
  await page.goto(LIVE!);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pocket Garden' })).toBeVisible();
  await page.locator('.offer').first().click();
  await expect(page.getByText('2 of 4')).toBeVisible();
  await context.setOffline(false);
});
