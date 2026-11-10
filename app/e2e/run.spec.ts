import { expect, test } from '@playwright/test';
import { P1, V5, freshOnLane, step } from './helpers';

for (const [label, features] of [['v5', V5], ['phase 1', P1]] as const) {
  test(`plays a full year and survives a reload mid-run (${label})`, async ({ page }) => {
    await freshOnLane(page, features);
    await page.locator('.lane .btn', { hasText: 'Plant' }).first().click();
    let n = 0;
    while (n < 10) { await step(page); n++; }
    const cells = () => page.locator('[data-cell]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    const before = await cells();
    await page.reload();
    expect(await cells()).toEqual(before);
    while ((await step(page)) && n < 80) n++;
    await expect(page.getByTestId('result')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.getByRole('button', { name: 'Back to the Lane' }).click();
    await expect(page.getByRole('heading', { name: 'The Lane' })).toBeVisible();
  });
}

test('first run: teaching garden, then the Lane and the Almanac', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('pg3-settings', JSON.stringify({ sound: false, haptics: false, theme: 'system' }));
  });
  await page.reload();
  await expect(page.getByText('Window Box').first()).toBeVisible();
  await expect(page.getByText('1 of 4')).toBeVisible();
  let n = 0;
  while ((await step(page)) && n < 60) n++;
  await expect(page.getByTestId('result')).toBeVisible();
  await page.screenshot({ path: `test-results/shot-rest-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Back to the Lane' }).click();
  await expect(page.getByRole('heading', { name: 'Raised Bed' })).toBeVisible();
  await page.screenshot({ path: `test-results/shot-lane-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: /Almanac/ }).click();
  await expect(page.getByRole('tab', { name: /Species/ })).toBeVisible();
  await page.screenshot({ path: `test-results/shot-almanac-${test.info().project.name}.png`, fullPage: true });
  // Reloading after the teaching garden opens on the Lane, not another teaching garden.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The Lane' })).toBeVisible();
});
