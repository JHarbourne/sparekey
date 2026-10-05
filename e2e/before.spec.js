// What to have to hand: shown at the start of step 01 until closed, and in the guide.
import { test, expect } from '@playwright/test';

test('the before-you-start list shows until it is closed', async ({ page }) => {
  await page.goto('/#start');
  const box = page.locator('#before');
  await expect(box).toBeVisible();
  await expect(box).toContainText('package.json');
  await expect(box).toContainText('saved in this browser');
  await page.getByRole('button', { name: 'Got it, hide this' }).click();
  await expect(box).toBeHidden();
  await expect(page.locator('[data-bind="client.name"]')).toBeFocused();
  await page.reload();
  await expect(box).toBeHidden();
  await page.goto('/guide#before');
  await expect(page.locator('#before')).toContainText('emergency contact you trust');
});
