import type { Page } from '@playwright/test';

export const V5 = { bag: false, life: false, plots: false, tools: false, wishes: false, content: false };
export const P1 = { bag: true, life: true, plots: true, tools: true, wishes: true, content: true };

/** Fresh storage with the teaching garden done, so the app opens on the Lane. */
export async function freshOnLane(page: Page, features: object = P1) {
  await page.goto('/');
  await page.evaluate((f) => {
    localStorage.clear();
    localStorage.setItem('pg3-features', JSON.stringify(f));
    localStorage.setItem('pg3-settings', JSON.stringify({ sound: false, haptics: false, theme: 'system' }));
    localStorage.setItem('pg3-profile', JSON.stringify({ v: 1, runs: 1, years: 0, best: 0, rank: 1, stars: 0, seedBest: {}, tutorialDone: true }));
  }, features);
  await page.reload();
}

/** From the Lane, start a garden on the first plot and draft through to planting. */
export async function plantFirstPlot(page: Page) {
  await page.locator('.lane .btn', { hasText: 'Plant' }).first().click();
  while (await page.locator('.offer').first().isVisible()) await page.locator('.offer').first().click();
}

/** Take one step of a simple policy. Returns false when the run is over. */
export async function step(page: Page): Promise<boolean> {
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
