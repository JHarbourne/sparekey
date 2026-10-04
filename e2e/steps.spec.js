// The tool shows one step at a time, with the list of steps as the way around.
import { test, expect } from '@playwright/test';

test('one step at a time, with Next, Back and the list of steps', async ({ page }) => {
  await page.goto('/#start');
  await expect(page.locator('#people')).toBeVisible();
  await expect(page.locator('#domains-sec')).toBeHidden();
  await expect(page.locator('#steps a[aria-current="step"]')).toContainText('People');

  await page.getByRole('button', { name: 'Next: Domains' }).click();
  await expect(page.locator('#domains-sec')).toBeVisible();
  await expect(page.locator('#people')).toBeHidden();
  await expect(page.locator('#domains-h')).toBeFocused();

  await page.locator('#domains-sec').getByRole('button', { name: /Back/ }).click();
  await expect(page.locator('#people')).toBeVisible();

  await page.locator('#steps a', { hasText: 'Hand over' }).click();
  await expect(page.locator('#handover')).toBeVisible();
  await expect(page.locator('#handover').getByRole('button', { name: /^Next/ })).toHaveCount(0);

  await page.reload();
  await expect(page.locator('#handover')).toBeVisible();
});

test('on a phone the steps are a bar across the top', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/#start');
  const bar = page.locator('#steps');
  await expect(bar).toBeVisible();
  await expect(page.locator('#steps a[aria-current="step"] .label')).toBeVisible();
  const box = await bar.boundingBox();
  expect(box.width).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('printing shows every step', async ({ page }) => {
  await page.goto('/#start');
  await page.emulateMedia({ media: 'print' });
  for (const id of ['#people', '#domains-sec', '#services-sec', '#access', '#risks-sec', '#handover']) await expect(page.locator(id)).toBeVisible();
});
