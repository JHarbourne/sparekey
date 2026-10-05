// What to have to hand: open on an empty plan, closed once there's something in it,
// and back again after starting afresh. Also in the guide.
import { test, expect } from '@playwright/test';

test('the before-you-start list opens on an empty plan', async ({ page }) => {
  await page.goto('/#start');
  const box = page.locator('#before');
  await expect(box).toHaveAttribute('open', '');
  await expect(box.locator('summary')).toHaveText('Before you start, have these 6 things to hand');
  await expect(box.locator('ol li')).toHaveCount(6);

  await box.locator('summary').click();
  await expect(box).not.toHaveAttribute('open', '');
  await box.locator('summary').click();
  await expect(box).toHaveAttribute('open', '');

  await page.locator('[data-bind="client.organisation"]').fill('Village Arts Trail');
  await page.waitForTimeout(400);
  await page.reload();
  await expect(box).not.toHaveAttribute('open', '');

  await page.getByRole('button', { name: 'New plan' }).click();
  await expect(box).toHaveAttribute('open', '');

  await page.goto('/guide#before');
  await expect(page.locator('#before ol li')).toHaveCount(6);
});
