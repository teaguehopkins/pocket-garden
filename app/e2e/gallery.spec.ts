import { test } from '@playwright/test';
test('tile gallery', async ({ page }) => {
  await page.goto('/#gallery');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/gallery-${test.info().project.name}.png`, fullPage: true });
});
