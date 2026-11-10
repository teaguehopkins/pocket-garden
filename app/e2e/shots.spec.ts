import { test } from '@playwright/test';

// Not an assertion test: captures screenshots of key screens for review.
test('screens (phase 1)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('pg3-features', JSON.stringify({ bag: true, life: true, plots: true, tools: true, wishes: true, content: true }));
    localStorage.setItem('pg3-profile', JSON.stringify({ v: 1, runs: 0, years: 0, best: 0, rank: 2, stars: 0, seedBest: {} }));
  });
  await page.reload();
  const name = test.info().project.name;
  await page.screenshot({ path: `test-results/shot-draft-${name}.png`, fullPage: true });
  for (let k = 0; k < 7; k++) await page.locator('.opt').first().click();
  for (let k = 0; k < 3; k++) {
    await page.getByTestId('packet').first().click();
    await page.locator('.cell.can').first().click();
  }
  await page.getByTestId('packet').nth(1).click();
  await page.locator('details').first().click();
  await page.screenshot({ path: `test-results/shot-play-${name}.png`, fullPage: true });
});
