import { expect, test, type Page } from '@playwright/test';

const V5 = { bag: false, life: false, plots: false, tools: false, wishes: false, content: false };
const P1 = { bag: true, life: true, plots: true, tools: true, wishes: true, content: true };

async function fresh(page: Page, features: object) {
  await page.goto('/');
  await page.evaluate((f) => {
    localStorage.clear();
    localStorage.setItem('pg3-features', JSON.stringify(f));
  }, features);
  await page.reload();
}

/** Take one step of a simple policy. Returns false when the run is over. */
async function step(page: Page): Promise<boolean> {
  if (await page.getByTestId('result').isVisible()) return false;
  const opt = page.locator('.opt').first();
  if (await opt.isVisible()) {
    await opt.click();
    return true;
  }
  await page.getByTestId('packet').first().click();
  const can = page.locator('.cell.can').first();
  if (await can.count()) await can.click();
  else await page.getByRole('button', { name: /go to seed/ }).click();
  return true;
}

for (const [label, features] of [['v5', V5], ['phase 1', P1]] as const) {
  test(`plays a full year and survives a reload mid-run (${label})`, async ({ page }) => {
    await fresh(page, features);
    let n = 0;
    while (n < 10) { await step(page); n++; }
    const before = await page.getByTestId('plot').innerHTML();
    await page.reload();
    expect(await page.getByTestId('plot').innerHTML()).toBe(before);
    while ((await step(page)) && n < 60) n++;
    await expect(page.getByTestId('result')).toBeVisible();
    // no horizontal scroll at 360px
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.screenshot({ path: `test-results/end-${label.replace(' ', '')}-${test.info().project.name}.png`, fullPage: true });
  });
}
