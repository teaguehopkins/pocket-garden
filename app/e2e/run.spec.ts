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
  const tally = page.getByTestId('tally');
  if (await tally.isVisible()) {
    const skip = tally.getByRole('button', { name: 'Skip' });
    if (await skip.isVisible()) await skip.click();
    await tally.getByRole('button', { name: /Continue|See the year/ }).click();
    return true;
  }
  if (await page.getByTestId('result').isVisible()) return false;
  const opt = page.locator('.offer').first();
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
    const cells = () => page.locator('[data-cell]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    const before = await cells();
    await page.reload();
    expect(await cells()).toEqual(before);
    while ((await step(page)) && n < 80) n++;
    await expect(page.getByTestId('result')).toBeVisible();
    // no horizontal scroll at 360px
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.screenshot({ path: `test-results/end-${label.replace(' ', '')}-${test.info().project.name}.png`, fullPage: true });
  });
}
