// The domain policy page in three tabs: keyboard, addresses and "Next" links.
import { test, expect } from '@playwright/test';

test('domain policy page is split into three tabs', async ({ page }) => {
  await page.goto('/domain-policy');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await expect(page.getByRole('tab', { name: 'Check an address' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#oc-input')).toBeVisible();
  await expect(page.locator('#policy')).toBeHidden();

  await page.getByRole('tab', { name: 'Check an address' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Questions' })).toBeFocused();
  await expect(page.locator('#questions')).toBeVisible();
  await expect(page).toHaveURL(/#questions$/);

  await page.getByRole('link', { name: /Next: a policy you can copy/ }).click();
  await expect(page.locator('#policy')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'The policy' })).toHaveAttribute('aria-selected', 'true');
});

test('a tab can be opened from its address', async ({ page }) => {
  await page.goto('/domain-policy#policy');
  await expect(page.locator('#policy')).toBeVisible();
  await expect(page.locator('#check')).toBeHidden();
});

test('printing shows every tab', async ({ page }) => {
  await page.goto('/domain-policy');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#questions')).toBeVisible();
  await expect(page.locator('#policy')).toBeVisible();
});
