import { test } from '@playwright/test';

// Not an assertion test: captures screenshots of key screens for review.
test('screens (phase 1)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('pg3-features', JSON.stringify({ bag: true, life: true, plots: true, tools: true, wishes: true, content: true }));
    localStorage.setItem('pg3-profile', JSON.stringify({ v: 1, runs: 1, years: 1, best: 0, rank: 2, stars: 0, seedBest: {}, tutorialDone: true, lane: { 'raised-bed': { blooms: 1, best: 90, bestGrid: null, wishes: [true, false, false] } } }));
    localStorage.setItem('pg3-settings', JSON.stringify({ sound: false, haptics: false, theme: 'system' }));
  });
  await page.reload();
  const name = test.info().project.name;
  await page.locator('.lane .btn', { hasText: 'Plant' }).nth(1).click();
  await page.screenshot({ path: `test-results/shot-draft-${name}.png`, fullPage: true });
  for (let k = 0; k < 6; k++) await page.locator('.offer').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/shot-rule-${name}.png`, fullPage: true });
  await page.locator('.offer').first().click();
  for (let k = 0; k < 3; k++) {
    await page.getByTestId('packet').first().click();
    await page.locator('.cell.can').first().click();
  }
  await page.getByTestId('packet').nth(1).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/shot-play-${name}.png`, fullPage: true });
  for (let k = 0; k < 2; k++) {
    await page.getByTestId('packet').first().click();
    await page.locator('.cell.can').first().click();
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/shot-tally-mid-${name}.png` });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `test-results/shot-tally-end-${name}.png`, fullPage: true });
});
