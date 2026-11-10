import { expect, test } from '@playwright/test';
import { freshOnLane, step } from './helpers';

test('stats screen records gardens and copies a stats code', async ({ page }) => {
  await freshOnLane(page);
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  await expect(page.getByText('Finish a garden and your stats start here.')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the Lane' }).click();
  for (let g = 0; g < 2; g++) {
    await page.locator('.lane .btn', { hasText: 'Plant' }).first().click();
    let n = 0;
    while ((await step(page)) && n < 80) n++;
    await page.getByRole('button', { name: 'Back to the Lane' }).click();
  }
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  await expect(page.locator('.big b').first()).toHaveText('2');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('blocked')) } }));
  await page.getByRole('button', { name: 'Copy my stats' }).click();
  const text = await page.locator('textarea[aria-label="Your stats"]').inputValue();
  expect(text).toContain('2 gardens');
  expect(text).toMatch(/PGS1\.[A-Za-z0-9_-]+/);
  const fs = await import('node:fs');
  fs.writeFileSync(`test-results/stats-code-${test.info().project.name}.txt`, text);
  await page.screenshot({ path: `test-results/shot-stats-${test.info().project.name}.png`, fullPage: true });
});
